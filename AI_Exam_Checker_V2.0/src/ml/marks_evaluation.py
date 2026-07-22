from src.utils.logging import get_logger

logger = get_logger("scoring_utils")

from src.utils.logging import get_logger

logger = get_logger("scoring_utils")

def calculate_final_score(nlp_scores, keyword_scores, max_marks, student_answer=None, model_answer=None):
    """
    Calculate final score with a strict, fair, and mathematically correct scoring criteria.
    Includes a length penalty to prevent extremely short answers from getting high marks.
    """
    try:
        # If the answer is completely irrelevant to the question, award 0 marks
        if not nlp_scores.get('is_relevant', True) or nlp_scores.get('relevance_score', 0.0) < 10.0:
            return 0.0, {
                'semantic_score': 0.0,
                'keyword_score': 0.0,
                'structure_score': 0.0,
                'final_percentage': 0.0,
                'relevance_score': nlp_scores.get('relevance_score', 0.0)
            }

        # Adjusted weights: For academic answers, keywords and semantics are paramount.
        # Structure (grammar/sentiment) matters much less than getting the facts right.
        weights = {
            'semantic': 0.40,  # Overall meaning and entity matching
            'keyword': 0.50,   # Specific required terms
            'structure': 0.10  # Grammar, flow, sentiment
        }

        # Calculate keyword score correctly
        num_keywords = len(keyword_scores)
        if num_keywords == 0:
            keyword_score = 0.0
        else:
            actual_score = sum(keyword_scores.values())
            partial_matches = sum(v for v in keyword_scores.values() if 0.1 <= v < 0.8)
            actual_score += (partial_matches * 0.1)
            actual_score = min(actual_score, num_keywords) # Cap at num_keywords
            keyword_score = (actual_score / num_keywords) * 100

        # Calculate semantic score heavily based on entity similarity and overall relevance
        semantic_score = (
            nlp_scores.get('entity_similarity', 0) * 0.7 +
            nlp_scores.get('relevance_score', 0) * 0.3
        )

        # Calculate structure score based on syntax
        structure_score = nlp_scores.get('syntax_similarity', 0)

        # Calculate final percentage directly from weighted components
        final_percentage = (
            (semantic_score * weights['semantic']) +
            (keyword_score * weights['keyword']) +
            (structure_score * weights['structure'])
        )
        
        # Apply length penalty if the student answer is drastically shorter than the model answer
        if student_answer and model_answer:
            student_words = len(student_answer.split())
            model_words = max(1, len(model_answer.split()))
            ratio = student_words / model_words
            
            # If the student writes less than 35% of the expected length, apply a progressive penalty
            if ratio < 0.35:
                # E.g., if ratio is 0.15, penalty_multiplier = max(0.4, 0.15 / 0.35) = max(0.4, 0.42) = 0.42
                # This drops the score proportionally so short answers can't exceed e.g., 20-40% marks
                penalty_multiplier = max(0.3, (ratio / 0.35))
                final_percentage *= penalty_multiplier

        # Ensure final percentage is bounded between 0 and 100
        final_percentage = max(0.0, min(100.0, final_percentage))

        # Convert to marks
        final_score = (final_percentage / 100.0) * max_marks

        return round(final_score, 2), {
            'semantic_score': round(semantic_score, 2),
            'keyword_score': round(keyword_score, 2),
            'structure_score': round(structure_score, 2),
            'final_percentage': round(final_percentage, 2),
            'relevance_score': nlp_scores.get('relevance_score', 0.0)
        }

    except Exception as e:
        logger.error(f"Error in calculating final score: {e}")
        raise RuntimeError(f"Error in score calculation: {e}")