import React from 'react';
import './QuizResults.css';

const QuizResults = ({ results, quizTitle, onClose, onRetakeQuiz }) => {
  if (!results) return null;

  const {
    score,
    earnedPoints,
    totalPoints,
    percentage,
    questionsCorrect,
    totalQuestions,
    questionResults,
    submittedAt,
    isAutoSubmit,
    timeTaken,
    status
  } = results;

  const getScoreClass = () => {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 80) return 'good';
    if (percentage >= 70) return 'average';
    if (percentage >= 60) return 'below-average';
    return 'poor';
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="quiz-results">
      <div className="results-header">
        <h2>Quiz Results</h2>
        <button onClick={onClose} className="close-btn" aria-label="Close results">
          ×
        </button>
      </div>

      <div className="quiz-info">
        <h3>{quizTitle}</h3>
        <p className="submission-info">
          Submitted: {formatDate(submittedAt)}
          {isAutoSubmit && <span className="auto-submit-note"> (Auto-submitted when time expired)</span>}
        </p>
      </div>

      <div className="score-summary">
        <div className={`score-circle ${getScoreClass()}`}>
          <div className="score-value">{percentage.toFixed(1)}%</div>
          <div className="score-label">Score</div>
        </div>
        
        <div className="score-details">
          <div className="score-stat">
            <span className="stat-label">Questions Correct:</span>
            <span className="stat-value">{questionsCorrect} / {totalQuestions}</span>
          </div>
          <div className="score-stat">
            <span className="stat-label">Points Earned:</span>
            <span className="stat-value">{earnedPoints} / {totalPoints}</span>
          </div>
          {timeTaken && (
            <div className="score-stat">
              <span className="stat-label">Time Taken:</span>
              <span className="stat-value">{formatTime(timeTaken)}</span>
            </div>
          )}
        </div>
      </div>

      {questionResults && questionResults.length > 0 && (
        <div className="question-results">
          <h4>Question-by-Question Results</h4>
          
          <div className="results-legend">
            <span className="legend-item">
              <span className="legend-icon correct"></span>
              Correct
            </span>
            <span className="legend-item">
              <span className="legend-icon incorrect"></span>
              Incorrect
            </span>
          </div>

          <div className="question-results-list">
            {questionResults.map((result, index) => (
              <div 
                key={index} 
                className={`question-result ${result.isCorrect ? 'correct' : 'incorrect'}`}
              >
                <div className="question-result-header">
                  <span className="question-number">Question {result.questionIndex + 1}</span>
                  <span className={`result-indicator ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                    {result.isCorrect ? '✓' : '✗'}
                  </span>
                  <span className="points-earned">
                    {result.points} / {result.possiblePoints} pts
                  </span>
                </div>
                
                {result.questionText && (
                  <p className="question-text">{result.questionText}</p>
                )}
                
                <div className="answer-details">
                  <div className="answer-row">
                    <span className="answer-label">Your Answer:</span>
                    <span className={`answer-value ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                      {result.selectedAnswer}
                    </span>
                  </div>
                  {!result.isCorrect && (
                    <div className="answer-row">
                      <span className="answer-label">Correct Answer:</span>
                      <span className="answer-value correct">
                        {result.correctAnswer}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="results-actions">
        <button onClick={onClose} className="btn-primary">
          Continue Learning
        </button>
        {/* Note: Retake functionality would need to be implemented based on course rules */}
        {/* 
        <button onClick={onRetakeQuiz} className="btn-secondary">
          Retake Quiz
        </button> 
        */}
      </div>

      {status === 'submitted' && (
        <div className="submission-notice">
          <p>
            <strong>Note:</strong> This quiz has been submitted successfully. 
            Only one submission is allowed per quiz.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizResults;