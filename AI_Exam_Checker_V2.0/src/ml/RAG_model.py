from src.utils.logging import get_logger
logger = get_logger("RAG_model_logs")
import faiss
from sentence_transformers import SentenceTransformer
import google.generativeai as genai
import os
import time
import re as _re
from src.ml.text_extraction import TextExtractor


def _extract_retry_delay_rag(error_str, default=15.0):
    """Parse the retry delay (in seconds) from a Gemini 429 error message."""
    match = _re.search(r'retry[\s_-]*(?:after|delay|in)[:\s]*([\d.]+)\s*s', str(error_str), _re.IGNORECASE)
    if match:
        return max(float(match.group(1)) + 1.0, default)
    return default


def _call_gemini_with_backoff_rag(model_instance, prompt, generation_config, max_retries=5):
    """
    Call model.generate_content with exponential backoff on 429 rate-limit errors.
    """
    delay = 15.0
    for attempt in range(max_retries):
        try:
            return model_instance.generate_content(prompt, generation_config=generation_config)
        except Exception as exc:
            err_str = str(exc)
            is_rate_limit = ('429' in err_str or
                             'quota' in err_str.lower() or
                             'rate' in err_str.lower() or
                             'Resource has been exhausted' in err_str)
            if is_rate_limit and attempt < max_retries - 1:
                delay = _extract_retry_delay_rag(err_str, default=delay)
                logger.warning(
                    f"Gemini RPM limit hit. Waiting {delay:.1f}s before retry "
                    f"{attempt + 1}/{max_retries - 1}..."
                )
                time.sleep(delay)
                delay = min(delay * 2, 120.0)
            else:
                raise

# Share embedding model globally to avoid slow reinstantiation on every API request
_shared_embedding_model = None

def chunk_text(text, max_words=120, overlap=30):
    """
    Split text into chunks of maximum words with some overlap.
    """
    words = text.split()
    chunks = []
    if not words:
        return chunks
    # Ensure even short text is returned
    if len(words) <= max_words:
        return [text]
        
    for i in range(0, len(words), max_words - overlap):
        chunk = " ".join(words[i:i + max_words])
        if chunk.strip():
            chunks.append(chunk)
    return chunks

class AdvancedRAGModel:
    def __init__(self, embedding_model="all-MiniLM-L6-v2", embedding_dim=384):
        global _shared_embedding_model
        try:
            if _shared_embedding_model is None:
                _shared_embedding_model = SentenceTransformer(embedding_model)
            self.embedding_model = _shared_embedding_model
            self.index = faiss.IndexFlatL2(embedding_dim)
            self.documents = []
            logger.info(f"RAG model initialized with embedding model: {embedding_model}")
        except Exception as e:
            logger.error(f"Error initializing RAG model: {str(e)}")
            raise ValueError("Failed to initialize RAG model") from e

    def add_documents(self, documents):
        try:
            if not documents:
                return
            embeddings = self.embedding_model.encode(documents)
            self.index.add(embeddings)
            self.documents.extend(documents)
            logger.info(f"Documents added to index: {len(documents)}")
        except Exception as e:
            logger.error(f"Error adding documents: {str(e)}")
            raise ValueError("Failed to add documents") from e

    def upload_and_process_documents(self, file_paths):
        try:
            extractor = TextExtractor()
            processed_chunks = []

            for file_path in file_paths:
                try:
                    extracted_pages = []
                    if file_path.endswith(".pdf"):
                        extracted_pages = extractor.extract_text_from_pdf(file_path)
                    elif file_path.endswith(".docx"):
                        extracted_pages = extractor.extract_text_from_docx(file_path)
                    elif file_path.endswith(".txt"):
                        extracted_pages = extractor.extract_text_from_txt(file_path)
                    else:
                        logger.warning(f"Unsupported file format: {file_path}")
                        continue
                    
                    for page_text in extracted_pages:
                        if page_text.strip():
                            # Chunk each page text block
                            chunks = chunk_text(page_text)
                            processed_chunks.extend(chunks)

                except Exception as e:
                    logger.error(f"Error processing file {file_path}: {str(e)}")
                    continue  # Skip problematic files

            self.add_documents(processed_chunks)
            logger.info(f"Processed and added {len(processed_chunks)} document chunks")
            return processed_chunks
        except Exception as e:
            logger.error(f"Error processing documents: {str(e)}")
            raise ValueError("Failed to process documents") from e

    def determine_word_multiplier(self, marks):
        """
        Adjusts the word multiplier based on marks.
        """
        if marks <= 5:
            return 20  # Generate around 20 words per mark
        elif marks <= 10:
            return 15
        elif marks <= 20:
            return 10
        else:
            return 8  # For higher marks, generate fewer words per mark

    def retrieve_context(self, query, k):
        try:
            # If no documents, return empty
            if not self.documents:
                return []
            query_embedding = self.embedding_model.encode([query])
            # Ensure k doesn't exceed index documents count
            search_k = min(k, len(self.documents))
            if search_k <= 0:
                return []
            distances, indices = self.index.search(query_embedding, search_k)
            # Filter valid, positive indices
            valid_contexts = [self.documents[i] for i in indices[0] if 0 <= i < len(self.documents)]
            logger.info(f"Retrieved {len(valid_contexts)} relevant contexts for query.")
            return valid_contexts
        except Exception as e:
            logger.error(f"Error retrieving context: {str(e)}")
            raise ValueError("Failed to retrieve context") from e

    def generate_answer(self, question, api_key, marks):
        try:
            configured_key = api_key or os.getenv("GEMINI_API_KEY")
            if not configured_key:
                raise ValueError("GEMINI_API_KEY is not set")

            genai.configure(api_key=configured_key, transport="rest")

            word_multiplier = self.determine_word_multiplier(marks)  # Determine word multiplier based on marks
            desired_word_count = word_multiplier * marks  # Calculate desired word count

            k = 3  # Fixed number of contexts to retrieve
            contexts = self.retrieve_context(question, k)
            combined_context = " ".join(contexts)
            if not combined_context.strip():
                # combined_context = question
                return "Error: Could not extract readable text from the uploaded PDF to generate an answer. Please ensure the PDF is not an image/scanned document."

            prompt = f"""You are an expert technical assistant designed to generate reference answers for exams.
            Use the provided Context as your primary source of truth to answer the Question.

            Context:
            {combined_context}

            Question: {question}

            Instructions:
            - Answer the question directly and comprehensively, focusing on the concepts and details described in the Context.
            - The answer must be a continuous paragraph. Do not use any bullet points, numbering, or line breaks.
            - Provide a straightforward, detailed answer containing approximately {desired_word_count} words.
            - Ensure the language is natural and technically precise.
            - Do not include phrases like "According to the text", "Based on the context", or "The slides state". Answer directly.

            Answer:"""

            logger.info(f"Generated prompt for query: {question[:50]}...")
            logger.info(f"Combined context length: {len(combined_context)} characters")

            model = genai.GenerativeModel('gemini-3.1-flash-lite')
            response = _call_gemini_with_backoff_rag(
                model,
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                ),
            )
            ans_text = response.text.strip() if response.text else "EMPTY RESPONSE"
            logger.info(f"Gemini API response: {ans_text}")
            return ans_text
        except Exception as e:
            logger.error(f"Error generating answer: {str(e)}")
            return f"Error generating answer: {str(e)}"
