import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiRequest from '../utils/api';
import useAuth from '../hooks/useAuth';
import './CourseContent.css';

const CourseContent = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [completed, setCompleted] = useState([]);
  const [modules, setModules] = useState([]);
  const [course, setCourse] = useState(null);
  const [viewer, setViewer] = useState({ open: false, lesson: null });
  const [quizViewer, setQuizViewer] = useState({ open: false, quiz: null, attempts: [] });
  const [assignmentViewer, setAssignmentViewer] = useState({ open: false, assignment: null, submissions: [] });
  const [quizTimeLeft, setQuizTimeLeft] = useState(null);
  const [quizTimer, setQuizTimer] = useState(null);
  const [quizCreator, setQuizCreator] = useState({ open: false, moduleId: null });
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    questions: [
      { 
        text: '', 
        options: { optionA: '', optionB: '', optionC: '', optionD: '' }, 
        correctAnswer: 'A', 
        points: 1 
      }
    ],
  });
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [assignmentSubmission, setAssignmentSubmission] = useState("");
  const [quizAnswers, setQuizAnswers] = useState([]);

  useEffect(() => {
    if (user && user._id) {
      fetchContent();
    }
  }, [user]);

  // Debug logging
  useEffect(() => {
    if (user && course) {
      console.log('CourseContent Debug:', {
        userId: user._id,
        userRole: user.role,
        courseId: course._id,
        courseInstructor: course.instructor,
        isInstructor: course.instructor && user._id === course.instructor._id
      });
    }
  }, [user, course]);

  // Cleanup timer when quiz modal closes
  useEffect(() => {
    return () => {
      if (quizTimer) {
        clearInterval(quizTimer);
      }
    };
  }, [quizTimer]);
  const fetchContent = async () => {
    try {
      setErrorMsg("");
      const data = await apiRequest(`/courses/${id}/content`, 'GET', null, true);
      setModules(data.modules || []);
      setCompleted(data.completedModules || []);
      setCourse(data.course || null);
    } catch (err) {
      setErrorMsg('Failed to load course content: ' + err.message);
      console.error('Failed to load course content', err);
    }
  };


  const handleCheck = async (moduleId, checked) => {
    try {
      setStatusMsg(checked ? "Marking as complete..." : "Marking as incomplete...");
      setErrorMsg("");
      let resp;
      if (checked) {
        resp = await apiRequest(`/courses/${id}/modules/${moduleId}/complete`, 'POST', null, true);
      } else {
        resp = await apiRequest(`/courses/${id}/modules/${moduleId}/incomplete`, 'POST', null, true);
      }
      setStatusMsg(resp && resp.message ? resp.message : "Progress updated.");
      console.log("Progress API response:", resp);
      // Always refetch content to get latest progress
      await fetchContent();
    } catch (err) {
      setErrorMsg('Failed to update progress: ' + err.message);
      setStatusMsg("");
      console.error('Failed to update progress', err);
    }
  };

  const handleTakeQuiz = async (quizId) => {
    try {
      setErrorMsg("");
      const quiz = await apiRequest(`/quizzes/single/${quizId}`, 'GET', null, true);
      setQuizAnswers(new Array(quiz.questions.length).fill(null));

      // Initialize timer if timeLimit is set
      if (quiz.timeLimit && quiz.timeLimit > 0) {
        const totalSeconds = quiz.timeLimit * 60; // Convert minutes to seconds
        setQuizTimeLeft(totalSeconds);

        // Start countdown timer
        const timer = setInterval(() => {
          setQuizTimeLeft(prev => {
            if (prev <= 1) {
              // Auto-submit when time runs out
              handleSubmitQuiz();
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        setQuizTimer(timer);
      } else {
        setQuizTimeLeft(null);
        setQuizTimer(null);
      }

      setQuizViewer({ open: true, quiz });
    } catch (err) {
      setErrorMsg('Failed to load quiz: ' + err.message);
      console.error('Failed to load quiz', err);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      setErrorMsg("");

      // Clear timer if exists
      if (quizTimer) {
        clearInterval(quizTimer);
        setQuizTimer(null);
      }

      const answers = quizAnswers.map((answer, index) => ({ questionIndex: index, selectedAnswer: answer }));
      const resp = await apiRequest(`/quizzes/${quizViewer.quiz._id}/submit`, 'POST', { answers }, true);
      setStatusMsg(`Quiz submitted! Score: ${resp.score}%`);
      setQuizViewer({ open: false, quiz: null });
      setQuizAnswers([]);
      setQuizTimeLeft(null);
    } catch (err) {
      setErrorMsg('Failed to submit quiz: ' + err.message);
      console.error('Failed to submit quiz', err);
    }
  };

  const handleSubmitAssignment = async () => {
    try {
      setErrorMsg("");
      await apiRequest(`/assignments/${assignmentViewer.assignment._id}/submit`, 'POST', { submission: assignmentSubmission }, true);
      alert("Assignment submitted successfully!");
      setAssignmentViewer({ open: false, assignment: null, submissions: [] });
      setAssignmentSubmission("");
    } catch (err) {
      setErrorMsg('Failed to submit assignment: ' + err.message);
      console.error('Failed to submit assignment', err);
    }
  };

  const handleViewSubmissions = async (assignment) => {
    try {
      setErrorMsg("");
      const data = await apiRequest(`/assignments/${assignment._id}/submissions`, 'GET', null, true);
      setAssignmentViewer({ open: true, assignment, submissions: data.submissions || [] });
    } catch (err) {
      setErrorMsg('Failed to load submissions: ' + err.message);
      console.error('Failed to load submissions', err);
    }
  };

  const handleGradeSubmission = async (studentId, grade) => {
    try {
      await apiRequest(`/assignments/${assignmentViewer.assignment._id}/grade/${studentId}`, 'PUT', { grade }, true);
      setStatusMsg("Submission graded successfully!");
      // Refresh submissions
      if (assignmentViewer.assignment) {
        await handleViewSubmissions(assignmentViewer.assignment);
      }
    } catch (err) {
      setErrorMsg('Failed to grade submission: ' + err.message);
      console.error('Failed to grade submission', err);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    try {
      await apiRequest(`/quizzes/${quizId}`, 'DELETE', null, true);
      setStatusMsg("Quiz deleted successfully!");
      await fetchContent();
    } catch (err) {
      setErrorMsg('Failed to delete quiz: ' + err.message);
      console.error('Failed to delete quiz', err);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    try {
      await apiRequest(`/assignments/${assignmentId}`, 'DELETE', null, true);
      setStatusMsg("Assignment deleted successfully!");
      await fetchContent();
    } catch (err) {
      setErrorMsg('Failed to delete assignment: ' + err.message);
      console.error('Failed to delete assignment', err);
    }
  };

  const handleCreateQuiz = (moduleId) => {
    setQuizCreator({ open: true, moduleId });
    setNewQuiz({
      title: '',
      description: '',
      questions: [
        { 
          text: '', 
          options: { optionA: '', optionB: '', optionC: '', optionD: '' }, 
          correctAnswer: 'A', 
          points: 1 
        }
      ],
      timeLimit: 30
    });
  };

  const handleAddQuestion = () => {
    setNewQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, { 
        text: '', 
        options: { optionA: '', optionB: '', optionC: '', optionD: '' }, 
        correctAnswer: 'A', 
        points: 1 
      }]
    }));
  };

  const handleRemoveQuestion = (index) => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const handleOptionChange = (questionIndex, optionKey, value) => {
    setNewQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? { ...q, options: { ...q.options, [optionKey]: value } }
          : q
      )
    }));
  };

  const handleSaveQuiz = async () => {
    try {
      setErrorMsg("");

      // Validate quiz data
      if (!newQuiz.title.trim() || !newQuiz.description.trim()) {
        setErrorMsg("Quiz title and description are required");
        return;
      }

      if (newQuiz.questions.some(q => !q.text.trim() || Object.values(q.options).some(opt => !opt.trim()))) {
        setErrorMsg("All questions and options must be filled");
        return;
      }

      await apiRequest('/quizzes', 'POST', {
        title: newQuiz.title,
        description: newQuiz.description,
        questions: newQuiz.questions,
        courseId: id,
        moduleId: quizCreator.moduleId,
        timeLimit: newQuiz.timeLimit
      }, true);

      setStatusMsg("Quiz created successfully!");
      setQuizCreator({ open: false, moduleId: null });
      await fetchContent();
    } catch (err) {
      setErrorMsg('Failed to create quiz: ' + err.message);
      console.error('Failed to create quiz', err);
    }
  };

  const progress = modules.length ? (completed.length / modules.length) * 100 : 0;

  return (
  <div className="course-content-page">
      <h2>{course ? course.title : 'Course Content'}</h2>
      {statusMsg && <div style={{ color: 'green', marginBottom: 8 }}>{statusMsg}</div>}
      {errorMsg && <div style={{ color: 'red', marginBottom: 8 }}>{errorMsg}</div>}
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }} />
      </div>
      <ul className="modules-list">
        {modules.map((mod) => (
          <li key={mod._id} className="module-item">
            <label>
              <input
                type="checkbox"
                checked={completed.includes(mod._id)}
                onChange={e => handleCheck(mod._id, e.target.checked)}
              />
              {mod.title}
            </label>
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              {mod.lessons && mod.lessons.length > 0 ? mod.lessons.map(lesson => (
                <li key={lesson._id} style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{lesson.title}</span> ({lesson.contentType})
                  {lesson.contentType === 'text' && (
                    <button style={{ marginLeft: 8 }} onClick={() => setViewer({ open: true, lesson })}>View Text</button>
                  )}
                  {lesson.contentType === 'pdf' && lesson.contentUrl && (
                    <button style={{ marginLeft: 8 }} onClick={() => setViewer({ open: true, lesson })}>View PDF</button>
                  )}
                  {lesson.contentType === 'slide' && lesson.contentUrl && (
                    <button style={{ marginLeft: 8 }} onClick={() => setViewer({ open: true, lesson })}>View PPT</button>
                  )}
                  {lesson.contentType === 'video' && lesson.contentUrl && (
                    <button style={{ marginLeft: 8 }} onClick={() => setViewer({ open: true, lesson })}>View Video</button>
                  )}
                  {(lesson.contentType === 'doc' || lesson.contentType === 'pages') && lesson.contentUrl && (
                    <button style={{ marginLeft: 8 }} onClick={() => setViewer({ open: true, lesson })}>View {lesson.contentType.toUpperCase()}</button>
                  )}
                </li>
              )) : <li style={{ color: '#888' }}>No lessons yet.</li>}
            </ul>
            {/* Assignments */}
            {mod.assignments && mod.assignments.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <h4>Assignments</h4>
                <ul>
                  {mod.assignments.map(assignment => (
                    <li key={assignment._id} style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{assignment.title}</span>
                      <p>{assignment.description}</p>
                      <p>Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                      {user && course && course.instructor && (user._id === course.instructor._id || user.role === 'admin') ? (
                        <>
                          <button style={{ marginLeft: 8 }} onClick={() => handleViewSubmissions(assignment)}>View Submissions</button>
                          <button style={{ marginLeft: 8, backgroundColor: 'red', color: 'white' }} onClick={() => handleDeleteAssignment(assignment._id)}>Delete Assignment</button>
                        </>
                      ) : (
                        <button style={{ marginLeft: 8 }} onClick={() => setAssignmentViewer({ open: true, assignment, submission: assignment.userSubmission })}>{assignment.userSubmission ? "See Grade" : "Submit Assignment"}</button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Quizzes */}
            {mod.quizzes && mod.quizzes.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <h4>Quizzes</h4>
                <ul>
                  {mod.quizzes.map(quiz => (
                    <li key={quiz._id} style={{ marginBottom: 4 }}>
                      <span style={{ fontWeight: 500 }}>{quiz.title}</span>
                      <p>{quiz.description}</p>
                      <p>Questions: {quiz.questions ? quiz.questions.length : 0}</p>
                      {user && course && course.instructor && user._id === course.instructor._id ? (
                        <>
                          <button style={{ marginLeft: 8 }} onClick={() => setQuizViewer({ open: true, quiz })}>View Attempts</button>
                          <button style={{ marginLeft: 8, backgroundColor: 'red', color: 'white' }} onClick={() => handleDeleteQuiz(quiz._id)}>Delete Quiz</button>
                        </>
                      ) : (
                        <button style={{ marginLeft: 8 }} onClick={() => handleTakeQuiz(quiz._id)}>Take Quiz</button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Add Quiz Button for Instructors - Always show for debugging */}
            {user && course && course.instructor && (
              <div style={{ marginTop: 8 }}>
                <button
                  style={{ backgroundColor: '#28a745', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px' }}
                  onClick={() => handleCreateQuiz(mod._id)}
                >
                  + Add Quiz
                </button>
                {user._id !== course.instructor._id && (
                  <span style={{ marginLeft: 8, color: 'red', fontSize: '12px' }}>
                    (Not instructor)
                  </span>
                )}
              </div>
            )}

            {/* Show if no instructor permission */}
            {user && course && !course.instructor && (
              <div style={{ marginTop: 8, color: 'orange', fontSize: '12px' }}>
                Course has no instructor assigned
              </div>
            )}
          </li>
        ))}
      </ul>
      {/* Modal Viewer */}
      {viewer.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewer({ open: false, lesson: null })}>
          <div style={{
            background: '#fff',
            padding: 24,
            borderRadius: 8,
            width: '80vw',
            maxWidth: 800,
            minHeight: 300,
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative',
            boxSizing: 'border-box',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }} onClick={e => e.stopPropagation()}>
            <button style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => setViewer({ open: false, lesson: null })}>Close</button>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <h3>{viewer.lesson?.title}</h3>
              {viewer.lesson?.contentType === 'text' && (
                <div style={{
                  whiteSpace: 'pre-wrap',
                  color: '#222',
                  fontSize: '1.05rem',
                  padding: 12,
                  margin: 0,
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  minHeight: 120,
                  maxHeight: '60vh',
                  overflowY: 'auto',
                }}>
                  {viewer.lesson.content && viewer.lesson.content.trim() !== ''
                    ? viewer.lesson.content
                    : <span style={{ color: '#ef4444' }}><em>No text content available for this lesson.</em></span>}
                </div>
              )}
              {viewer.lesson?.contentType === 'pdf' && viewer.lesson?.contentUrl && (
                <a href={`http://localhost:5000${viewer.lesson.contentUrl}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 12, padding: 12, background: '#007bff', color: 'white', textDecoration: 'none', borderRadius: 4 }}>View PDF in New Tab</a>
              )}
              {viewer.lesson?.contentType === 'slide' && viewer.lesson?.contentUrl && (
                <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent('http://localhost:5000' + viewer.lesson.contentUrl)}`} title="PPT Viewer" style={{ width: '70vw', height: '70vh', border: 'none' }} />
              )}
              {viewer.lesson?.contentType === 'doc' && viewer.lesson?.contentUrl && (
                <iframe src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent('http://localhost:5000' + viewer.lesson.contentUrl)}`} title="DOC Viewer" style={{ width: '70vw', height: '70vh', border: 'none' }} />
              )}
              {viewer.lesson?.contentType === 'pages' && viewer.lesson?.contentUrl && (
                <iframe src={`http://localhost:5000${viewer.lesson.contentUrl}`} title="Pages Viewer" style={{ width: '70vw', height: '70vh', border: 'none' }} />
              )}
              {viewer.lesson?.contentType === 'video' && viewer.lesson?.contentUrl && (
                <video src={`http://localhost:5000${viewer.lesson.contentUrl}`} controls style={{ width: '70vw', maxHeight: '70vh' }} />
              )}
            </div>
          </div>
        </div>
      )}
      {/* Quiz Viewer */}
      {quizViewer.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setQuizViewer({ open: false, quiz: null })}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => {
              if (quizTimer) clearInterval(quizTimer);
              setQuizViewer({ open: false, quiz: null });
              setQuizTimeLeft(null);
              setQuizTimer(null);
            }}>Close</button>
            <h3>{quizViewer.quiz?.title}</h3>
            <p>{quizViewer.quiz?.description}</p>

            {/* Quiz Timer */}
            {quizTimeLeft !== null && (
              <div style={{
                background: quizTimeLeft < 300 ? '#fff3cd' : '#d1ecf1', // Yellow when < 5 minutes, blue otherwise
                border: `1px solid ${quizTimeLeft < 300 ? '#ffc107' : '#bee5eb'}`,
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                textAlign: 'center',
                fontSize: '18px',
                fontWeight: 'bold',
                color: quizTimeLeft < 300 ? '#856404' : '#0c5460'
              }}>
                ⏱️ Time Remaining: {Math.floor(quizTimeLeft / 60)}:{(quizTimeLeft % 60).toString().padStart(2, '0')}
                {quizTimeLeft < 300 && <div style={{ fontSize: '14px', marginTop: '4px', color: '#856404' }}>⏰ Less than 5 minutes remaining!</div>}
              </div>
            )}

            <form onSubmit={e => { e.preventDefault(); handleSubmitQuiz(); }}>
              {quizViewer.quiz?.questions.map((q, idx) => (
                <div key={idx} style={{ marginBottom: 12 }}>
                  <p><strong>{q.question}</strong></p>
                  {q.options.map((opt, i) => (
                    <label key={i} style={{ display: 'block' }}>
                      <input
                        type="radio"
                        name={`question-${idx}`}
                        value={i}
                        checked={quizAnswers[idx] === i}
                        onChange={() => {
                          const newAnswers = [...quizAnswers];
                          newAnswers[idx] = i;
                          setQuizAnswers(newAnswers);
                        }}
                        required
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ))}
              <button type="submit">Submit Quiz</button>
            </form>
          </div>
        </div>
      )}
      {/* Assignment Viewer */}
      {assignmentViewer.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setAssignmentViewer({ open: false, assignment: null, submissions: [] })}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => setAssignmentViewer({ open: false, assignment: null, submissions: [] })}>Close</button>
            <h3>{assignmentViewer.assignment?.title}</h3>
            <p>{assignmentViewer.assignment?.description}</p>
            {assignmentViewer.submissions && assignmentViewer.submissions.length > 0 ? (
              <div>
                <h4>Submissions</h4>
                <ul>
                  {assignmentViewer.submissions.map(sub => (
                    <li key={sub._id} style={{ marginBottom: 8 }}>
                      <p><strong>Student:</strong> {sub.student.name} ({sub.student.email})</p>
                      <p><strong>Submission:</strong> {sub.submission}</p>
                      <p><strong>Grade:</strong> {sub.grade !== undefined ? sub.grade : 'Assignment to be graded'}</p>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Enter grade"
                        onChange={e => sub.tempGrade = e.target.value}
                        style={{ width: 100, marginRight: 8 }}
                      />
                      <button onClick={() => handleGradeSubmission(sub.student._id, sub.tempGrade)}>Submit Grade</button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : assignmentViewer.submission ? (
              <div>
                <h4>Your Submission</h4>
                <p>{assignmentViewer.submission.submission}</p>
                <p><strong>Grade:</strong> {assignmentViewer.submission.grade !== undefined ? assignmentViewer.submission.grade : 'Assignment to be graded'}</p>
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); handleSubmitAssignment(); }}>
                <textarea
                  value={assignmentSubmission}
                  onChange={e => setAssignmentSubmission(e.target.value)}
                  placeholder="Enter your submission here"
                  rows={10}
                  style={{ width: '100%' }}
                  required
                />
                <button type="submit">Submit Assignment</button>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Quiz Creator Modal */}
      {quizCreator.open && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setQuizCreator({ open: false, moduleId: null })}>
          <div style={{ background: '#fff', padding: 24, borderRadius: 8, maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => setQuizCreator({ open: false, moduleId: null })}>Close</button>
            <h3>Create New Quiz</h3>

            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                placeholder="Quiz Title"
                value={newQuiz.title}
                onChange={e => setNewQuiz(prev => ({ ...prev, title: e.target.value }))}
                style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
                required
              />
              <textarea
                placeholder="Quiz Description"
                value={newQuiz.description}
                onChange={e => setNewQuiz(prev => ({ ...prev, description: e.target.value }))}
                style={{ width: '100%', padding: '8px', marginBottom: '8px', minHeight: '80px' }}
                required
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label>Time Limit (minutes):</label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={newQuiz.timeLimit}
                  onChange={e => setNewQuiz(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                  style={{ width: '80px', padding: '4px' }}
                />
              </div>
            </div>

            <h4>Questions</h4>
            {newQuiz.questions.map((question, qIndex) => (
              <div key={qIndex} style={{ marginBottom: 20, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong>Question {qIndex + 1}</strong>
                  {newQuiz.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIndex)}
                      style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px' }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Question text"
                  value={question.text}
                  onChange={e => handleQuestionChange(qIndex, 'text', e.target.value)}
                  style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
                  required
                />

                <div style={{ marginBottom: 8 }}>
                  <label>Options:</label>
                  {Object.entries(question.options).map(([key, value], optIndex) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                      <input
                        type="radio"
                        name={`correct-${qIndex}`}
                        value={key}
                        checked={question.correctAnswer === key}
                        onChange={() => handleQuestionChange(qIndex, 'correctAnswer', key)}
                      />
                      <input
                        type="text"
                        placeholder={`Option ${key.toUpperCase()}`}
                        value={value}
                        onChange={e => handleOptionChange(qIndex, key, e.target.value)}
                        style={{ marginLeft: 8, flex: 1, padding: '4px' }}
                        required
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label>Points:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={question.points}
                    onChange={e => handleQuestionChange(qIndex, 'points', parseInt(e.target.value))}
                    style={{ width: '60px', padding: '4px' }}
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddQuestion}
              style={{ backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 16px', marginBottom: '16px' }}
            >
              + Add Question
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSaveQuiz}
                style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 16px' }}
              >
                Create Quiz
              </button>
              <button
                onClick={() => setQuizCreator({ open: false, moduleId: null })}
                style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', padding: '8px 16px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseContent;
