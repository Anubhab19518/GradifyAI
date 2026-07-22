import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const QuestionForm = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    marks: '',
    question_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showInputs, setShowInputs] = useState(true);
  const [editableAnswer, setEditableAnswer] = useState('');
  const [showAnswerEdit, setShowAnswerEdit] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConfirm = async () => {
    const createdBy = localStorage.getItem('usermail');
    const paperName = localStorage.getItem('papername');

    if (!createdBy || !paperName || paperName === 'undefined') {
      setError('Please upload your PDF and click Proceed before adding questions.');
      return;
    }

    if (!currentQuestion.question || !currentQuestion.marks || !currentQuestion.question_id) {
      setError('Please fill in the question, marks, and question ID.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/papers/generate/model-answer`,
        {
          createdBy,
          paperName,
          ...currentQuestion
        }
      );
      
      setCurrentAnswer(response.data.answer);
      setEditableAnswer(response.data.answer);
      setShowInputs(false);
      setShowAnswerEdit(true);
    } catch (error) {
      const message = error.response?.data?.error || error.message || 'Failed to generate answer.';
      setError(message);
      console.error('Error generating answer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerUpdate = (e) => {
    setEditableAnswer(e.target.value);
  };

  const handleConfirmAnswer = () => {
    const newQuestion = {
      ...currentQuestion,
      answer: editableAnswer
    };
    
    setQuestions(prev => [...prev, newQuestion]);
    setCurrentQuestion({
      question: '',
      marks: '',
      question_id: ''
    });
    setCurrentAnswer('');
    setEditableAnswer('');
    setShowInputs(true);
    setShowAnswerEdit(false);
  };

  const handleSubmitQuestions = async () => {
    setSubmitLoading(true);
    try {
      const model_answers = questions.map(q => ({
        question_id: q.question_id,
        question: q.question,
        marks: parseInt(q.marks),
        answer: q.answer
      }));

      const payload = {
        createdBy: localStorage.getItem('usermail'),
        paperName: localStorage.getItem('papername'),
        model_answers
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/papers/store/model-answer`,
        payload
      );
      
      // Redirect to upload-script page on success
      navigate('/upload-script');
    } catch (error) {
      console.error('Error submitting questions:', error);
      alert('Failed to submit questions. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Add Questions</h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      
      {showInputs && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Question</label>
            <textarea
              name="question"
              value={currentQuestion.question}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              rows="3"
              placeholder="Enter your question here"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Marks</label>
            <input
              type="number"
              name="marks"
              value={currentQuestion.marks}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              placeholder="Enter marks"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Question ID</label>
            <input
              type="text"
              name="question_id"
              value={currentQuestion.question_id}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              placeholder="Enter question ID"
            />
          </div>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-3xl hover:bg-gray-800 disabled:bg-gray-400"
          >
            {loading ? 'Generating Answer...' : 'Confirm'}
          </button>
        </div>
      )}

      {showAnswerEdit && (
        <div className="mt-6">
          <div className="mb-4">
            <h3 className="font-medium mb-2">Question:</h3>
            <p className="p-4 bg-gray-50 rounded-md">{currentQuestion.question}</p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Edit Generated Answer:</h3>
            <textarea
              value={editableAnswer}
              onChange={handleAnswerUpdate}
              className="w-full p-4 border rounded-md min-h-32"
              rows="6"
            />
          </div>
          
          <button
            onClick={handleConfirmAnswer}
            className="w-full mt-4 bg-black text-white py-2 rounded-3xl hover:bg-gray-800"
          >
            Confirm Answer
          </button>
        </div>
      )}

      {questions.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Previous Questions:</h3>
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-md">
                <p className="font-medium">Question {index + 1}:</p>
                <p className="mb-2">{q.question}</p>
                <p className="text-sm text-gray-600">Marks: {q.marks}</p>
                <p className="text-sm text-gray-600 mb-2">ID: {q.question_id}</p>
                <p className="text-sm font-medium">Answer:</p>
                <p className="text-sm text-gray-700">{q.answer}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmitQuestions}
            disabled={submitLoading}
            className="w-full mt-6 bg-green-600 text-white py-2 rounded-3xl hover:bg-green-700 disabled:bg-green-400"
          >
            {submitLoading ? 'Submitting...' : 'Submit Questions'}
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionForm;