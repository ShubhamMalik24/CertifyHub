import React, { useState } from 'react';
import apiRequest from '../utils/api';
import './QuizCreator.css';

const QuizCreator = ({ courseId, moduleId, onQuizCreated, onCancel }) => {
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    timeLimit: null,
    questions: [
      {
        text: '',
        options: { optionA: '', optionB: '', optionC: '', optionD: '' },
        correctAnswer: 'A',
        points: 1
      }
    ]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleQuizChange = (field, value) => {
    setQuiz(prev => ({ ...prev, [field]: value }));
  };

  const handleQuestionChange = (questionIndex, field, value) => {
    const newQuestions = [...quiz.questions];
    if (field === 'options') {
      newQuestions[questionIndex].options = { ...newQuestions[questionIndex].options, ...value };
    } else {
      newQuestions[questionIndex][field] = value;
    }
    setQuiz(prev => ({ ...prev, questions: newQuestions }));
  };

  const addQuestion = () => {
    setQuiz(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          text: '',
          options: { optionA: '', optionB: '', optionC: '', optionD: '' },
          correctAnswer: 'A',
          points: 1
        }
      ]
    }));
  };

  const removeQuestion = (questionIndex) => {
    if (quiz.questions.length > 1) {
      setQuiz(prev => ({
        ...prev,
        questions: prev.questions.filter((_, index) => index !== questionIndex)
      }));
    }
  };

  const validateQuiz = () => {
    if (!quiz.title.trim()) return 'Quiz title is required';
    if (!quiz.description.trim()) return 'Quiz description is required';
    
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      if (!q.text.trim()) return `Question ${i + 1} text is required`;
      
      const { optionA, optionB, optionC, optionD } = q.options;
      if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
        return `Question ${i + 1} must have all 4 options filled`;
      }
      
      if (!q.correctAnswer || !['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
        return `Question ${i + 1} must have a valid correct answer selected`;
      }
      
      if (q.points < 0) {
        return `Question ${i + 1} points must be 0 or greater`;
      }
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateQuiz();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const quizData = {
        title: quiz.title.trim(),
        description: quiz.description.trim(),
        questions: quiz.questions,
        courseId,
        moduleId,
        timeLimit: quiz.timeLimit > 0 ? quiz.timeLimit : null
      };

      const createdQuiz = await apiRequest('/quizzes', 'POST', quizData, true);
      onQuizCreated(createdQuiz);
    } catch (err) {
      setError(err.message || 'Failed to create quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="quiz-creator">
      <div className="quiz-creator-header">
        <h3>Create New Quiz</h3>
        <button type="button" onClick={onCancel} className="btn-cancel">
          Cancel
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="quiz-form">
        <div className="form-group">
          <label htmlFor="quiz-title">Quiz Title *</label>
          <input
            id="quiz-title"
            type="text"
            value={quiz.title}
            onChange={(e) => handleQuizChange('title', e.target.value)}
            placeholder="Enter quiz title"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="quiz-description">Description *</label>
          <textarea
            id="quiz-description"
            value={quiz.description}
            onChange={(e) => handleQuizChange('description', e.target.value)}
            placeholder="Enter quiz description"
            rows={3}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="quiz-time-limit">Time Limit (minutes, optional)</label>
          <input
            id="quiz-time-limit"
            type="number"
            min="1"
            value={quiz.timeLimit || ''}
            onChange={(e) => handleQuizChange('timeLimit', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Leave blank for no time limit"
          />
        </div>

        <div className="questions-section">
          <h4>Questions</h4>
          
          {quiz.questions.map((question, qIndex) => (
            <div key={qIndex} className="question-card">
              <div className="question-header">
                <h5>Question {qIndex + 1}</h5>
                {quiz.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="btn-remove-question"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Question Text *</label>
                <textarea
                  value={question.text}
                  onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                  placeholder="Enter your question"
                  rows={2}
                  required
                />
              </div>

              <div className="options-grid">
                <div className="form-group">
                  <label>Option A *</label>
                  <input
                    type="text"
                    value={question.options.optionA}
                    onChange={(e) => handleQuestionChange(qIndex, 'options', { optionA: e.target.value })}
                    placeholder="Option A"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Option B *</label>
                  <input
                    type="text"
                    value={question.options.optionB}
                    onChange={(e) => handleQuestionChange(qIndex, 'options', { optionB: e.target.value })}
                    placeholder="Option B"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Option C *</label>
                  <input
                    type="text"
                    value={question.options.optionC}
                    onChange={(e) => handleQuestionChange(qIndex, 'options', { optionC: e.target.value })}
                    placeholder="Option C"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Option D *</label>
                  <input
                    type="text"
                    value={question.options.optionD}
                    onChange={(e) => handleQuestionChange(qIndex, 'options', { optionD: e.target.value })}
                    placeholder="Option D"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Correct Answer *</label>
                  <select
                    value={question.correctAnswer}
                    onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                    required
                  >
                    <option value="A">Option A</option>
                    <option value="B">Option B</option>
                    <option value="C">Option C</option>
                    <option value="D">Option D</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Points</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={question.points}
                    onChange={(e) => handleQuestionChange(qIndex, 'points', parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="btn-add-question"
          >
            Add Question
          </button>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? 'Creating Quiz...' : 'Create Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizCreator;