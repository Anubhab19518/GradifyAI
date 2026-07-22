import os
from dotenv import load_dotenv
import importlib
import time
import re as _re

# Load environment variables
load_dotenv()

try:
    genai = importlib.import_module("google.generativeai")
except ImportError:  # pragma: no cover - handled when the endpoint is called
    genai = None
import json
import re
import base64
from io import BytesIO
from PIL import Image
from flask import jsonify, request


def _extract_retry_delay(error_str, default=15.0):
    """Parse the retry delay (in seconds) from a Gemini 429 error message."""
    match = _re.search(r'retry[\s_-]*(?:after|delay|in)[:\s]*([\d.]+)\s*s', str(error_str), _re.IGNORECASE)
    if match:
        return max(float(match.group(1)) + 1.0, default)
    return default


def _call_gemini_with_backoff(model_instance, contents, generation_config, max_retries=4, **kwargs):
    """
    Call model.generate_content with exponential backoff on 429 rate-limit errors.
    """
    delay = 15.0
    for attempt in range(max_retries):
        try:
            return model_instance.generate_content(contents, generation_config=generation_config, **kwargs)
        except Exception as exc:
            err_str = str(exc)
            is_rate_limit = ('429' in err_str or
                             'quota' in err_str.lower() or
                             'rate' in err_str.lower() or
                             'Resource has been exhausted' in err_str)
            if is_rate_limit and attempt < max_retries - 1:
                delay = _extract_retry_delay(err_str, default=delay)
                import logging
                logging.getLogger("handwriting_extractor_gemini").warning(
                    f"Gemini RPM limit hit. Waiting {delay:.1f}s before retry "
                    f"{attempt + 1}/{max_retries - 1}..."
                )
                time.sleep(delay)
                # Next delay slightly longer if Google doesn't provide one
                delay = min(delay * 1.5, 60.0) 
            else:
                if is_rate_limit:
                    raise Exception(f"Google Gemini Quota Exceeded. Failed after {max_retries} attempts.")
                raise  # re-raise on non-rate-limit errors or last attempt

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    if genai is None:
        raise ImportError("google.generativeai is not installed")
    genai.configure(api_key=GEMINI_API_KEY, transport="rest")

# Configure Gemini model
model = genai.GenerativeModel('gemini-3.1-flash-lite')

def extract_handwriting_text(image_file, questions_context=None):
    """
    Extracts text from a handwritten document using the Gemini API.
    
    Args:
        image_file: File object representing the uploaded image.

    Returns:
        Tuple (Response JSON, HTTP Status Code)
    """
    import sys

    filename = getattr(image_file, 'filename', 'unknown')
    print(f"[OCR] > Starting OCR for: {filename}", flush=True)

    try:
        if genai is None:
            print("[OCR] [X] google.generativeai is not installed", flush=True)
            return {
                'error': 'google.generativeai is not installed',
                'status': 'failure'
            }, 500

        if not GEMINI_API_KEY:
            print("[OCR] [X] GEMINI_API_KEY is not set in environment", flush=True)
            return {
                'error': 'GEMINI_API_KEY is not configured',
                'status': 'failure'
            }, 500

        print(f"[OCR] [OK] API key loaded (ends with ...{GEMINI_API_KEY[-6:]})", flush=True)

        # Read image bytes and convert to Base64
        print(f"[OCR] Reading image bytes...", flush=True)
        image_bytes = image_file.read()
        print(f"[OCR] [OK] Read {len(image_bytes)} bytes", flush=True)

        image = Image.open(BytesIO(image_bytes))
        print(f"[OCR] [OK] PIL opened image: mode={image.mode}, size={image.size}", flush=True)
        
        # Ensure image is in RGB mode
        if image.mode != 'RGB':
            image = image.convert('RGB')
            print(f"[OCR] Converted to RGB", flush=True)
        
        buffered = BytesIO()
        image.save(buffered, format="PNG")
        base64_image = base64.b64encode(buffered.getvalue()).decode()
        print(f"[OCR] [OK] Base64 encoded ({len(base64_image)} chars)", flush=True)

        context_str = ""
        if questions_context:
            context_str = f"\n\nHere are the possible questions for this exam (in JSON format):\n{questions_context}\n\nIf the question ID is not explicitly written in the margin, you MUST infer the most likely question ID by matching the handwritten content semantically with the questions provided above. When inferring, return EXACTLY the 'id' value from the provided JSON."

        # Prepare prompt for Gemini model
        extraction_prompt = f"""
        You are an expert in document analysis, specializing in handwritten text extraction.
        An exam page may contain answers to multiple different questions. You must extract each distinct answer separately.

        For EACH answer found on the page, extract the following details:
        1. QUESTION ID: 
           - Look at the left margin or the start of the answer for an explicit identifier (e.g., "Q.2", "1)").
           - If found, extract the exact id of the question.
           - If an answer does not have an explicit question ID, you MUST infer the most likely question ID by matching its handwritten content semantically with the context provided below.{context_str}
           - IMPORTANT: For inferred IDs, return EXACTLY the 'id' value from the provided JSON.

        2. DOCUMENT CONTENT:
           - Extract the full handwritten content for this specific answer.
           - Preserve original structure & meaning.
           - Replace unclear words with [UNCLEAR].

        Respond strictly in JSON format as an array of objects under the key "answers":
        {{
            "answers": [
                {{
                    "question_id": "extracted_id",
                    "content": "full extracted text for this specific question"
                }}
            ]
        }}
        """

        # Send image as base64 string to Gemini (with automatic RPM retry)
        print(f"[OCR] -> Calling Gemini API (model: gemini-3.5-flash)...", flush=True)
        try:
            response = _call_gemini_with_backoff(
                model,
                [extraction_prompt, {"mime_type": "image/png", "data": base64_image}],
                generation_config=genai.types.GenerationConfig(
                    response_mime_type='application/json',
                    max_output_tokens=8000
                ),
                request_options={"timeout": 60}
            )
            print(f"[OCR] [OK] Gemini responded", flush=True)

            # Check if response is valid
            if not response or not response.text:
                print(f"[OCR] [X] Empty response from Gemini", flush=True)
                return {'error': 'No response received from Gemini API', 'status': 'failure'}, 500

            # Parse the response
            raw_text = response.text.strip()
            print(f"[OCR] Raw response: {raw_text[:200]}", flush=True)
            try:
                result = json.loads(raw_text)
                answers = result.get('answers', [result]) if isinstance(result, dict) else result
                
                if not isinstance(answers, list):
                    answers = [answers]
                    
                processed_answers = []
                for ans in answers:
                    if not isinstance(ans, dict):
                        continue
                    q_id = str(ans.get('question_id', 'Unknown')).strip()
                    if not q_id or q_id.lower() == 'unknown':
                        q_id = 'Unknown'
                    ans['question_id'] = q_id
                    processed_answers.append(ans)
                    
                print(f"[OCR] [OK] Parsed {len(processed_answers)} answers from image.", flush=True)
                return {'status': 'success', 'data': {'answers': processed_answers}}, 200
            except json.JSONDecodeError as json_error:
                # Regex extraction fallback for truncated or malformed responses
                print(f"[OCR] [X] JSON parse failed: {json_error}. Attempting fallback regex.", flush=True)
                q_id_match = re.search(r'"question_id"\s*:\s*"([^"]*)"', raw_text)
                content_match = re.search(r'"content"\s*:\s*"([\s\S]*?)"\s*}?\s*$', raw_text)
                if not content_match:
                    content_match = re.search(r'"content"\s*:\s*"([\s\S]*)$', raw_text)
                
                if q_id_match and content_match:
                    q_id = q_id_match.group(1)
                    content = content_match.group(1).strip()
                    if content.endswith('"') or content.endswith('}'):
                        content = re.sub(r'"\s*}?\s*$', '', content)
                    content = content.replace('\\n', '\n').replace('\\"', '"')
                    q_id_clean = q_id.strip()
                    if not q_id_clean or q_id_clean.lower() == 'unknown':
                        q_id_clean = 'Unknown'
                    print(f"[OCR] [OK] Fallback parse: question_id={q_id_clean}", flush=True)
                    return {
                        'status': 'success',
                        'data': {
                            'answers': [{
                                'question_id': q_id_clean,
                                'content': content
                            }]
                        }
                    }, 200
                
                print(f"[OCR] [X] JSON parse failed: {json_error}", flush=True)
                return {
                    'error': f'JSON Parsing Error: {str(json_error)}', 
                    'raw_response': raw_text, 
                    'status': 'failure'
                }, 500

        except Exception as api_error:
            print(f"[OCR] [X] Gemini API error: {api_error}", flush=True)
            return {
                'error': f'Gemini API Error: {str(api_error)}', 
                'status': 'failure'
            }, 500

    except Exception as e:
        print(f"[OCR] [X] Image processing error: {e}", flush=True)
        return {
            'error': f'Image Processing Error: {str(e)}', 
            'status': 'failure'
        }, 500