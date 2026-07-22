import os
import json
import re
from difflib import SequenceMatcher
import google.generativeai as genai
from dotenv import load_dotenv
from src.utils.logging import get_logger

logger = get_logger("nlp_handler_logs")

class NLPHandler:
    def __init__(self, credentials_path="config/nlp_key.json"):
        """Initialize the NLP Handler using Gemini API"""
        load_dotenv()
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY environment variable is not set. Will rely on local fallbacks.")
            self.model = None
        else:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-3.1-flash-lite')
                logger.info("Successfully initialized Gemini client for NLPHandler")
            except Exception as e:
                logger.error(f"Error configuring Gemini client: {e}")
                self.model = None

        self.RELEVANCE_THRESHOLD = 10.0  # Percentage threshold
        self.KEYWORD_MATCH_THRESHOLD = 0.80
        self._cache = {}

    def _run_combined_analysis(self, text, reference_text):
        """Run a single combined analysis call to Gemini to save latency and avoid rate limits."""
        cache_key = (text, reference_text)
        if cache_key in self._cache:
            return self._cache[cache_key]

        if not self.model:
            # Generate fallbacks directly
            fallback_analysis = self._local_fallback_analyze(text, reference_text)
            f_scores, f_keys = self._local_fallback_keywords(text, reference_text)
            cached = {
                'analysis': fallback_analysis,
                'keyword_scores': f_scores,
                'extracted_keywords': f_keys
            }
            self._cache[cache_key] = cached
            return cached

        try:
            prompt = f"""You are an expert NLP evaluation and grading engine.
Compare the Student's Answer against the Model Answer.

Student's Answer:
{text}

Model Answer:
{reference_text}

Analyze the answers across these criteria:
1. Entity Similarity: Similarity in the key terms, names, and entities mentioned (0-100%).
2. Sentiment Similarity: Similarity in tone, viewpoint, or approach (0-100%).
3. Syntax Similarity: Similarity in grammatical complexity and structural flow (0-100%).
4. Relevance Score: Clean composite rating of how relevant the student's response is to the model answer (0-100%).
5. Common Entities: List key unique entities present in both answers.
6. Missing Entities: List key entities in the Model Answer that are missing or omitted in the Student's Answer.
7. Is Relevant: Boolean indicating whether the student's answer is relevant to the question topic (True if Relevance Score >= 10%).

Keyword and Concept Scoring:
1. Extract key concepts/entities/keywords from the Model Answer.
2. For each extracted keyword from the Model Answer, determine how well it is matched/covered in the Student's Answer. Score this match from 0.0 (completely missing) to 1.0 (perfect semantic match).
3. Identify which of these keywords from the Model Answer are successfully found/matched in the Student's Answer (score >= 0.1).

Return strictly a JSON object with this exact schema:
{{
    "entity_similarity": float,
    "sentiment_similarity": float,
    "syntax_similarity": float,
    "relevance_score": float,
    "common_entities": ["string"],
    "missing_entities": ["string"],
    "is_relevant": boolean,
    "keyword_scores": {{
        "keyword1": match_score_between_0_and_1,
        "keyword2": match_score_between_0_and_1
    }},
    "extracted_keywords": ["keyword_found1", "keyword_found2"]
}}
"""
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type='application/json',
                    temperature=0.2
                )
            )

            result = json.loads(response.text.strip())
            
            parsed_analysis = {
                'entity_similarity': float(result.get('entity_similarity', 0.0)),
                'sentiment_similarity': float(result.get('sentiment_similarity', 0.0)),
                'syntax_similarity': float(result.get('syntax_similarity', 0.0)),
                'relevance_score': float(result.get('relevance_score', 0.0)),
                'common_entities': list(result.get('common_entities', [])),
                'missing_entities': list(result.get('missing_entities', [])),
                'is_relevant': bool(result.get('is_relevant', True))
            }

            keyword_scores = {str(k): float(v) for k, v in result.get('keyword_scores', {}).items()}
            extracted_keywords = list(result.get('extracted_keywords', []))

            cached_item = {
                'analysis': parsed_analysis,
                'keyword_scores': keyword_scores,
                'extracted_keywords': extracted_keywords
            }
            self._cache[cache_key] = cached_item
            logger.info("Successfully executed combined Gemini NLP analysis")
            return cached_item

        except Exception as e:
            logger.error(f"Error in Gemini combined analysis: {e}. Falling back to local methods...")
            fallback_analysis = self._local_fallback_analyze(text, reference_text)
            f_scores, f_keys = self._local_fallback_keywords(text, reference_text)
            cached = {
                'analysis': fallback_analysis,
                'keyword_scores': f_scores,
                'extracted_keywords': f_keys
            }
            self._cache[cache_key] = cached
            return cached

    def analyze_text(self, text, reference_text):
        """
        Analyze text against a reference text using Gemini API with cache lookup.
        """
        cache_data = self._run_combined_analysis(text, reference_text)
        return cache_data['analysis']

    def extract_keyword_weightage(self, text, reference_text):
        """
        Extract and weight keywords from text using Gemini API with cache lookup.
        """
        cache_data = self._run_combined_analysis(text, reference_text)
        return cache_data['keyword_scores'], cache_data['extracted_keywords']

    def get_document_similarity(self, text, reference_text):
        """Calculate overall document similarity using sequence similarity."""
        try:
            text = text.lower().strip()
            reference_text = reference_text.lower().strip()
            # Sequence similarity using difflib
            sequence_similarity = SequenceMatcher(None, text, reference_text).ratio()
            return sequence_similarity
        except Exception as e:
            logger.error(f"Error calculating document similarity: {e}")
            return 0.0

    def _local_fallback_analyze(self, text, reference_text):
        logger.warning("Using local fallback semantic analyzer")
        text = text.lower().strip()
        reference_text = reference_text.lower().strip()
        
        # Calculate sequence similarity
        seq_sim = SequenceMatcher(None, text, reference_text).ratio()
        
        # Calculate word overlap
        text_words = set(re.findall(r'\b\w{4,}\b', text))
        ref_words = set(re.findall(r'\b\w{4,}\b', reference_text))
        
        overlap_words = text_words.intersection(ref_words)
        common_entities = list(overlap_words)[:10]
        missing_entities = list(ref_words.difference(text_words))[:10]
        
        word_overlap = len(overlap_words) / len(ref_words) if ref_words else 0.0
        
        relevance_score = seq_sim * 100
        
        return {
            'entity_similarity': round(word_overlap * 100, 2),
            'sentiment_similarity': round(seq_sim * 100, 2),
            'syntax_similarity': round(seq_sim * 100, 2),
            'relevance_score': round(relevance_score, 2),
            'common_entities': common_entities,
            'missing_entities': missing_entities,
            'is_relevant': relevance_score >= self.RELEVANCE_THRESHOLD
        }

    def _local_fallback_keywords(self, text, reference_text):
        logger.warning("Using local fallback keyword extractor")
        text = text.lower().strip()
        reference_text = reference_text.lower().strip()
        
        ref_words = [w for w in re.findall(r'\b\w{4,}\b', reference_text) if w not in {'from', 'this', 'that', 'with', 'have', 'they', 'your'}]
        # De-duplicate
        unique_ref_words = list(dict.fromkeys(ref_words))
        
        if not unique_ref_words:
            unique_ref_words = ["answer"]
            
        keyword_scores = {}
        extracted_keywords = []
        for word in unique_ref_words:
            if word in text:
                keyword_scores[word] = 1.0
                extracted_keywords.append(word)
            else:
                best_sim = 0.0
                for st_word in re.findall(r'\b\w{4,}\b', text):
                    sim = SequenceMatcher(None, word, st_word).ratio()
                    if sim > best_sim:
                        best_sim = sim
                keyword_scores[word] = best_sim if best_sim >= 0.7 else 0.0
                if best_sim >= 0.7:
                    extracted_keywords.append(word)
                    
        return keyword_scores, extracted_keywords