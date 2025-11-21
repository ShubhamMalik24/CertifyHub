import React, { useState, useEffect } from 'react';
import apiRequest from '../utils/api';
import './QuizTaker.css';

const QuizTaker = ({ quizId, onComplete, onCancel }) => {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  useEffect(() => {
    // Timer logic
    if (quiz && quiz.timeLimit && timeRemaining !== null && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-submit when time runs out
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [quiz, timeRemaining]);

  const loadQuiz = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const quizData = await apiRequest(`/quizzes/single/${quizId}`, 'GET', null, true);
      setQuiz(quizData);
      
      // Initialize time if there's a time limit
      if (quizData.timeLimit) {
        setTimeRemaining(quizData.timeLimit * 60); // Convert minutes to seconds
      }
      
      setStartTime(new Date());
      
      // Initialize answers object
      const initialAnswers = {};
      quizData.questions.forEach((_, index) => {
        initialAnswers[index] = '';
      });
      setAnswers(initialAnswers);
    } catch (err) {
      setError(err.message || 'Failed to load quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, selectedAnswer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: selectedAnswer
    }));
  };

  const validateAnswers = () => {
    const unansweredQuestions = [];
    quiz.questions.forEach((_, index) => {
      if (!answers[index] || answers[index] === '') {
        unansweredQuestions.push(index + 1);
      }
    });
    return unansweredQuestions;
  };

  const handleAutoSubmit = () => {
    // Auto-submit when time runs out
    submitQuiz(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const unansweredQuestions = validateAnswers();
    if (unansweredQuestions.length > 0) {
      const confirmed = window.confirm(
        `You have ${unansweredQuestions.length} unanswered question(s) (Questions: ${unansweredQuestions.join(', ')}). Do you want to submit anyway?`
      );
      if (!confirmed) return;
    }

    submitQuiz(false);
  };

  const submitQuiz = async (isAutoSubmit = false) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Format answers for API
      const formattedAnswers = Object.entries(answers).map(([questionIndex, selectedAnswer]) => ({
        questionIndex: parseInt(questionIndex),
        selectedAnswer: selectedAnswer || 'A' // Default to A if no answer selected
      }));

      const result = await apiRequest(`/quizzes/${quizId}/submit`, 'POST', {
        answers: formattedAnswers
      }, true);

      // Call onComplete with the result
      onComplete({
        ...result,
        isAutoSubmit,
        timeTaken: startTime ? Math.round((new Date() - startTime) / 1000) : null
      });
    } catch (err) {
      setError(err.message || 'Failed to submit quiz');
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeWarningClass = () => {
    if (!timeRemaining || !quiz?.timeLimit) return '';
    
    const totalTime = quiz.timeLimit * 60;
    const percentRemaining = (timeRemaining / totalTime) * 100;
    
    if (percentRemaining <= 10) return 'time-critical';
    if (percentRemaining <= 25) return 'time-warning';
    return '';
  };

  if (isLoading) {
    return (
      <div className="quiz-taker loading">
        <div className="loading-spinner"></div>
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="quiz-taker error">
        <div className="error-message">{error}</div>
        <button onClick={onCancel} className="btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="quiz-taker error">
        <div className="error-message">Quiz not found</div>
        <button onClick={onCancel} className="btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-taker">
      <div className="quiz-header">
        <div className="quiz-info">
          <h2>{quiz.title}</h2>
          <p className="quiz-description">{quiz.description}</p>
          <div className="quiz-stats">
            <span className="question-count">
              Questions: {quiz.questions?.length || 0}
            </span>
            {quiz.timeLimit && (
              <span className={`time-remaining ${getTimeWarningClass()}`}>
                Time Remaining: {formatTime(timeRemaining)}
              </span>
            )}
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="quiz-form">
        <div className="questions-container">
          {quiz.questions.map((question, index) => (
            <div key={index} className="question-card">
              <div className="question-header">
                <h4>Question {index + 1}</h4>
                {question.points && question.points !== 1 && (
                  <span className="question-points">
                    {question.points} point{question.points !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              <p className="question-text">{question.text}</p>
              
              <div className="options">
                {['A', 'B', 'C', 'D'].map(optionKey => {
                  const optionText = question.options[`option${optionKey}`];
                  if (!optionText) return null;

                  return (
                    <label key={optionKey} className="option">
                      <input
                        type="radio"
                        name={`question-${index}`}
                        value={optionKey}
                        checked={answers[index] === optionKey}
                        onChange={() => handleAnswerChange(index, optionKey)}
                        disabled={isSubmitting}
                      />
                      <span className="option-text">
                        <span className="option-letter">{optionKey}.</span>
                        {optionText}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="quiz-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary submit-quiz"
            disabled={isSubmitting || timeRemaining === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizTaker;