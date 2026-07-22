import os
import time as _time
from flask import Blueprint, request, jsonify
from src.ml.RAG_model import AdvancedRAGModel
from werkzeug.utils import secure_filename
import tempfile
from src.utils.logging import get_logger
from src.utils.nlp_analyzer import NLPHandler
from src.ml.marks_evaluation import calculate_final_score
import traceback
from src.utils.handwriting_extractor_gemini import extract_handwriting_text


logger = get_logger("routes_logs")

# Create a blueprint for API routes
routes = Blueprint("routes", __name__)


@routes.before_request
def log_request():
    """Log every incoming request so it appears in the terminal."""
    print(f"[Flask] {request.method} {request.path}", flush=True)


@routes.route("/", methods=["GET"])
def hello_world():
    try:
        return jsonify("Hello world!"), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@routes.route('/extract-text', methods=['POST'])
def extract_handwriting():
    """
    API endpoint to extract text from handwritten documents.
    """
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided', 'status': 'failure'}), 400

    image_file = request.files['image']
    questions_context = request.form.get('questions', None)

    if image_file.filename == '':
        return jsonify({'error': 'No selected image', 'status': 'failure'}), 400

    result, status_code = extract_handwriting_text(image_file, questions_context)
    return jsonify(result), status_code


@routes.route('/evaluate', methods=['POST'])
def grade_answer():
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['student_answer', 'model_answer', 'question_id', 'max_marks']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'error': f'Missing required field: {field}',
                    'status': 'error'
                }), 400
        
        # Validate input types and clean data
        if not isinstance(data['max_marks'], (int, float)):
            return jsonify({
                'error': 'max_marks must be a number',
                'status': 'error'
            }), 400
            
        student_answer = data['student_answer'].strip()
        model_answer = data['model_answer'].strip()
        
        # Handle empty answers with minimum score if they contain some keywords
        if not student_answer:
            return jsonify({
                'question_id': data['question_id'],
                'final_score': 0,
                'max_marks': data['max_marks'],
                'percentage': 0,
                'details': {
                    'semantic_score': 0,
                    'keyword_score': 0,
                    'structure_score': 0,
                    'relevance_score': 0
                },
                'status': 'empty_answer'
            }), 200
        
        # Initialize NLP Handler with relaxed settings
        handler = NLPHandler()
        
        # Analyze answers with more lenient comparison
        nlp_scores = handler.analyze_text(student_answer, model_answer)
        
        # Extract keyword weightage with partial matching
        keyword_scores, extracted_keywords = handler.extract_keyword_weightage(
            student_answer, 
            model_answer
        )
        
        # Calculate final score with adjusted weights
        final_score, detailed_scores = calculate_final_score(
            nlp_scores, 
            keyword_scores, 
            float(data['max_marks']),
            student_answer,
            model_answer
        )
        
        # Prepare response with additional feedback
        response = {
            'question_id': data['question_id'],
            'final_score': final_score,
            'max_marks': data['max_marks'],
            'percentage': detailed_scores['final_percentage'],
            'details': {
                'semantic_score': detailed_scores['semantic_score'],
                'keyword_score': detailed_scores['keyword_score'],
                'structure_score': detailed_scores['structure_score'],
                'relevance_score': detailed_scores.get('relevance_score', 0)
            },
            'keywords_found': nlp_scores.get('common_entities', []),
            'keywords_missing': nlp_scores.get('missing_entities', []),
            'partial_matches': [k for k, v in keyword_scores.items() if 0.1 <= v < 0.8],  # New field for partial matches
            'status': 'success'
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error in grading: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e),
            'status': 'error'
        }), 500







@routes.route("/generate-answer", methods=["POST"])
def generate_answer():
    """
    API endpoint to generate an answer based on uploaded PDFs and a question.
    """
    try:
        # Check if files and other parameters exist in the request
        if "files" not in request.files or not request.form.get("question") or not request.form.get("question_id") or not request.form.get("marks"):
            return jsonify({"error": "Files, question, question_id, and marks are required"}), 400

        files = request.files.getlist("files")
        question = request.form.get("question")
        question_id = request.form.get("question_id")
        marks = int(request.form.get("marks"))  # Get marks as integer

        # Save the uploaded files temporarily
        temp_file_paths = []
        for file in files:
            filename = secure_filename(file.filename)
            if filename.endswith((".pdf", ".docx", ".txt")):
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1])
                try:
                    file.save(temp_file.name)
                    temp_file_paths.append(temp_file.name)
                finally:
                    temp_file.close()
            else:
                return jsonify({"error": f"Unsupported file format: {filename}"}), 400

        # Instantiate a fresh RAG model for this request to avoid file pollution
        local_rag_model = AdvancedRAGModel()

        # Process uploaded documents
        processed_documents = local_rag_model.upload_and_process_documents(temp_file_paths)

        # Generate the answer using the RAG model
        api_key = os.getenv("GEMINI_API_KEY")
        answer = local_rag_model.generate_answer(question, api_key, marks)

        # Cleanup temporary files
        for temp_file_path in temp_file_paths:
            try:
                os.remove(temp_file_path)
            except OSError as e:
                logger.error(f"Error deleting temporary file {temp_file_path}: {str(e)}")

        # Return the response
        response = {
            "question_id": question_id,
            "question": question,
            "marks": marks,
            "answer": answer,
        }
        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Error in /generate-answer endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500




