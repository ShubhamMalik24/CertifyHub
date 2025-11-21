import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiRequest from '../utils/api';
import useAuth from '../hooks/useAuth';

const EditCourse = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [progress, setProgress] = useState([]);
  const [progressModules, setProgressModules] = useState([]);
  const [lessonInputs, setLessonInputs] = useState({}); // { [moduleId]: { title, contentType, content, file } }
  const [quizInputs, setQuizInputs] = useState({}); // { [moduleId]: { title, description, questions: [{ question, correctAnswer }] } }
  const [assignmentInputs, setAssignmentInputs] = useState({}); // { [moduleId]: { title, description, dueDate, questions } }


  useEffect(() => {
    fetchCourse();
    fetchProgress();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const data = await apiRequest(`/courses/${id}`, 'GET', null, true);
      setCourse(data);
      setModules(data.modules || []);
    } catch (err) {
      console.error('Failed to load course', err);
    }
  };


  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      const res = await apiRequest(`/courses/${id}/modules`, 'POST', { title: newModuleTitle }, true);
      setModules(res.modules || []);
      setNewModuleTitle('');
    } catch (err) {
      alert('Failed to add module.');
      console.error(err);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Delete this module?')) return;
    try {
      const res = await apiRequest(`/courses/${id}/modules/${moduleId}`, 'DELETE', null, true);
      setModules(res.modules || []);
    } catch (err) {
      alert('Failed to delete module.');
      console.error(err);
    }
  };


  const handleUpload = async (moduleId, e) => {
    const formData = new FormData();
    const ppt = e.target.ppt.files[0];
    const pdf = e.target.pdf.files[0];
    if (ppt) formData.append('ppt', ppt);
    if (pdf) formData.append('pdf', pdf);
    try {
      await fetch(`http://localhost:5000/api/courses/${id}/modules/${moduleId}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      fetchCourse();
    } catch (err) {
      alert('Failed to upload files.');
      console.error(err);
    }
  };

  const fetchProgress = async () => {
    try {
      const res = await apiRequest(`/courses/${id}/progress`, 'GET', null, true);
      setProgress(res.students || []);
      setProgressModules(res.modules || []);
    } catch (err) {
      setProgress([]);
      setProgressModules([]);
    }
  };

  if (!course) return <p>Loading...</p>;

  const handleLessonInput = (moduleId, field, value) => {
    setLessonInputs(prev => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], [field]: value }
    }));
  };


  const handleAddLesson = async (moduleId) => {
    const input = lessonInputs[moduleId] || {};
    if (!input.title || !input.contentType) return alert('Lesson title and type required');
    let body = { title: input.title, contentType: input.contentType };
    if (input.contentType === 'text') body.content = input.content;
    // For file types, first create lesson, then upload file if present
    let lessonId = null;
    try {
      const res = await apiRequest(`/courses/${id}/modules/${moduleId}/lessons`, 'POST', body, true);
      lessonId = res.lessons && res.lessons.length ? res.lessons[res.lessons.length - 1]._id : null;
      // If file upload needed
      if (lessonId && input.file && (input.contentType !== 'text')) {
        const formData = new FormData();
        formData.append('file', input.file);
        try {
          await fetch(`http://localhost:5000/api/courses/${id}/modules/${moduleId}/lessons/${lessonId}/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: formData,
          });
        } catch (uploadErr) {
          alert('Failed to upload file: ' + uploadErr.message);
          console.error('Upload error:', uploadErr);
        }
      }
      fetchCourse();
      setLessonInputs(prev => ({ ...prev, [moduleId]: {} }));
    } catch (err) {
      alert('Failed to add lesson.');
      console.error(err);
    }
  };

  const handleDeleteLesson = async (moduleId, lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await apiRequest(`/courses/${id}/modules/${moduleId}/lessons/${lessonId}`, 'DELETE', null, true);
      fetchCourse();
    } catch (err) {
      alert('Failed to delete lesson.');
      console.error(err);
    }
  };

  const handleAssignmentInput = (moduleId, field, value) => {
    setAssignmentInputs(prev => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], [field]: value }
    }));
  };

  const handleAddAssignment = async (moduleId) => {
    const input = assignmentInputs[moduleId] || {};
    if (!input.title || !input.description || !input.dueDate) return alert('Assignment title, description, and due date required');
    try {
      await apiRequest(`/assignments`, 'POST', { ...input, courseId: id, moduleId }, true);
      fetchCourse();
      setAssignmentInputs(prev => ({ ...prev, [moduleId]: {} }));
    } catch (err) {
      alert('Failed to add assignment.');
      console.error(err);
    }
  };

  const handleQuizInput = (moduleId, field, value) => {
    setQuizInputs(prev => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], [field]: value }
    }));
  };

  const handleAddQuiz = async (moduleId) => {
    const input = quizInputs[moduleId] || {};
    if (!input.title || !input.description || !input.questions || input.questions.length === 0) return alert('Quiz title, description, and at least one question required');
    try {
      await apiRequest(`/quizzes`, 'POST', { ...input, courseId: id, moduleId }, true);
      fetchCourse();
      setQuizInputs(prev => ({ ...prev, [moduleId]: {} }));
    } catch (err) {
      alert('Failed to add quiz.');
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '32px auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(30,144,255,0.08)', padding: 32 }}>
      <h2>Edit Course: {course.title}</h2>
      <h3>Modules</h3>
      <ul>
        {modules.map(mod => (
          <li key={mod._id} style={{ marginBottom: 24, borderBottom: '1px solid #eee', paddingBottom: 12 }}>
            <div style={{ fontWeight: 600 }}>{mod.title}
              <button onClick={() => handleDeleteModule(mod._id)} style={{ marginLeft: 12 }}>Delete</button>
            </div>
            {/* Lessons List */}
            <ul style={{ marginTop: 8 }}>
              {mod.lessons && mod.lessons.length > 0 ? mod.lessons.map(lesson => (
                <li key={lesson._id} style={{ marginBottom: 6 }}>
                  <span style={{ fontWeight: 500 }}>{lesson.title}</span> ({lesson.contentType})
                  {lesson.contentType === 'text' && <span style={{ marginLeft: 8, color: '#555' }}>{lesson.content}</span>}
                  {lesson.contentType !== 'text' && lesson.contentUrl && (
                    <a href={`http://localhost:5000${lesson.contentUrl}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8 }}>View</a>
                  )}
                  <button onClick={() => handleDeleteLesson(mod._id, lesson._id)} style={{ marginLeft: 12 }}>Delete</button>
                </li>
              )) : <li style={{ color: '#888' }}>No lessons yet.</li>}
            </ul>
            {/* Add Lesson Form */}
            <div style={{ marginTop: 8 }}>
              <input type="text" placeholder="Lesson title" value={(lessonInputs[mod._id]?.title) || ''} onChange={e => handleLessonInput(mod._id, 'title', e.target.value)} style={{ marginRight: 8 }} />
              <select value={lessonInputs[mod._id]?.contentType || ''} onChange={e => handleLessonInput(mod._id, 'contentType', e.target.value)} style={{ marginRight: 8 }}>
                <option value="">Type</option>
                <option value="text">Text</option>
                <option value="pdf">PDF</option>
              </select>
              {lessonInputs[mod._id]?.contentType === 'text' && (
                <input type="text" placeholder="Content" value={lessonInputs[mod._id]?.content || ''} onChange={e => handleLessonInput(mod._id, 'content', e.target.value)} style={{ marginRight: 8 }} />
              )}
              {(lessonInputs[mod._id]?.contentType === 'pdf' || lessonInputs[mod._id]?.contentType === 'slide' || lessonInputs[mod._id]?.contentType === 'doc' || lessonInputs[mod._id]?.contentType === 'video') && (
                <input type="file" onChange={e => handleLessonInput(mod._id, 'file', e.target.files[0])} style={{ marginRight: 8 }} />
              )}
              <button onClick={() => handleAddLesson(mod._id)}>Add Lesson</button>
            </div>
            {/* Assignments */}
            <h4>Assignments</h4>
            <ul>
              {mod.assignments && mod.assignments.map(assignment => (
                <li key={assignment._id}>
                  <strong>{assignment.title}</strong> - Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </li>
              ))}
              {(!mod.assignments || mod.assignments.length === 0) && <li>No assignments yet.</li>}
            </ul>
            <div>
              <input type="text" placeholder="Assignment title" value={assignmentInputs[mod._id]?.title || ''} onChange={e => handleAssignmentInput(mod._id, 'title', e.target.value)} />
              <input type="text" placeholder="Description" value={assignmentInputs[mod._id]?.description || ''} onChange={e => handleAssignmentInput(mod._id, 'description', e.target.value)} />
              <input type="date" value={assignmentInputs[mod._id]?.dueDate || ''} onChange={e => handleAssignmentInput(mod._id, 'dueDate', e.target.value)} />
              <textarea placeholder="Questions (one per line)" value={assignmentInputs[mod._id]?.questions?.map(q => q.question).join('\n') || ''} onChange={e => handleAssignmentInput(mod._id, 'questions', e.target.value.split('\n').filter(q => q.trim()).map(q => ({ question: q, type: 'text' })))} />
              <button onClick={() => handleAddAssignment(mod._id)}>Add Assignment</button>
            </div>
            {/* Quizzes */}
            <h4>Quizzes</h4>
            <ul>
              {mod.quizzes && mod.quizzes.length > 0 ? mod.quizzes.map(quiz => (
                <li key={quiz._id}>
                  <strong>{quiz.title}</strong>
                </li>
              )) : <li>No quizzes yet.</li>}
            </ul>
            <div>
              <input type="text" placeholder="Quiz title" value={quizInputs[mod._id]?.title || ''} onChange={e => handleQuizInput(mod._id, 'title', e.target.value)} />
              <input type="text" placeholder="Description" value={quizInputs[mod._id]?.description || ''} onChange={e => handleQuizInput(mod._id, 'description', e.target.value)} />
              {/* For simplicity, add one question */}
              <input type="text" placeholder="Question" value={quizInputs[mod._id]?.question || ''} onChange={e => handleQuizInput(mod._id, 'question', e.target.value)} />
              <input type="text" placeholder="Correct Answer" value={quizInputs[mod._id]?.correctAnswer || ''} onChange={e => handleQuizInput(mod._id, 'correctAnswer', e.target.value)} />
              <button onClick={() => {
                const q = quizInputs[mod._id]?.question;
                const a = quizInputs[mod._id]?.correctAnswer;
                if (q && a) {
                  const questions = quizInputs[mod._id]?.questions || [];
                  questions.push({ question: q, options: [a], correctAnswer: 0 });
                  handleQuizInput(mod._id, 'questions', questions);
                  handleQuizInput(mod._id, 'question', '');
                  handleQuizInput(mod._id, 'correctAnswer', '');
                }
              }}>Add Question</button>
              <button onClick={() => handleAddQuiz(mod._id)}>Add Quiz</button>
            </div>
          </li>
        ))}
      </ul>
      <input type="text" value={newModuleTitle} onChange={e => setNewModuleTitle(e.target.value)} placeholder="New module title" />
      <button onClick={handleAddModule}>Add Module</button>

      <h3 style={{ marginTop: 32 }}>Enrolled Students Progress</h3>
      {progress.length === 0 ? <p>No students enrolled yet.</p> : (
        <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Name</th>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Email</th>
              {progressModules.map(m => (
                <th key={m._id} style={{ borderBottom: '1px solid #ccc' }}>{m.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {progress.map(stu => (
              <tr key={stu._id}>
                <td>{stu.name}</td>
                <td>{stu.email}</td>
                {progressModules.map(m => (
                  <td key={m._id} style={{ textAlign: 'center' }}>{stu.completedModules.includes(m._id) ? '✅' : ''}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default EditCourse;
