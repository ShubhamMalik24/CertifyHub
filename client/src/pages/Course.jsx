
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiRequest from '../utils/api';
import useAuth from '../hooks/useAuth';
import './Course.css';


const Course = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(1);
  const [comment, setComment] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [assignmentViewer, setAssignmentViewer] = useState({ open: false, assignment: null, submissions: [] });
  const [certificateStatus, setCertificateStatus] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchCourse();
    if (user && (user.role === 'instructor' || user.role === 'admin')) {
      fetchAssignments();
    }
    if (user && user.role === 'student') {
      checkCertificateStatus();
    }
  }, [id, user]);

  const fetchCourse = async () => {
    try {
      const courseData = await apiRequest(`/courses/${id}`, 'GET');
      setCourse(courseData);
      setReviews(courseData.reviews || []);
    } catch (err) {
      console.error('Failed to load course', err);
    }
  };

  const fetchAssignments = async () => {
    try {
      const assignmentsData = await apiRequest(`/assignments/${id}`, 'GET', null, true);
      setAssignments(assignmentsData);
    } catch (err) {
      console.error('Failed to load assignments', err);
    }
  };

  const checkCertificateStatus = async () => {
    try {
      const response = await apiRequest(`/certificates/courses/${id}/certificate`, 'GET', null, true);
      setCertificateStatus(response);
    } catch (err) {
      // Certificate not available yet
      setCertificateStatus(null);
    }
  };

  const handleEnroll = async () => {
    if (course && course.price > 0) {
      window.location.href = `/checkout?courseId=${course._id}`;
      return;
    }

    try {
      await apiRequest(`/courses/${id}/enroll`, 'POST', null, true);
      alert('Enrolled successfully!');
      fetchCourse();
    } catch (err) {
      let msg = 'Failed to enroll.';
      if (err && err.message) {
        msg += `\n${err.message}`;
      }
      alert(msg);
      console.error(err);
    }
  };

  const handleDownloadCert = async () => {
    try {
      // Use the direct download endpoint
      const response = await fetch(
        `http://localhost:5000/api/certificates/download/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        // Create blob and download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `certificate-${course.title.replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        if (errorData.message.includes('not found')) {
          alert('Certificate not yet available. Complete all course requirements and wait for instructor approval.');
        } else {
          alert('Failed to download certificate: ' + errorData.message);
        }
      }
    } catch (err) {
      alert('Failed to download certificate: ' + err.message);
      console.error('Failed to download certificate', err);
    }
  };

  const handleSubmitReview = async () => {
    try {
      await apiRequest(
        `/courses/${id}/reviews`,
        'POST',
        { rating, comment },
        true
      );
      alert('Review submitted!');
      setRating(1);
      setComment('');
      fetchCourse();
    } catch (err) {
      alert('Failed to submit review.');
      console.error(err);
    }
  };

  const handleViewSubmissions = async (assignment) => {
    try {
      const data = await apiRequest(`/assignments/${assignment._id}/submissions`, 'GET', null, true);
      setAssignmentViewer({ open: true, assignment, submissions: data.submissions || [] });
    } catch (err) {
      console.error('Failed to load submissions', err);
    }
  };

  const handleGradeSubmission = async (studentId, grade) => {
    try {
      await apiRequest(`/assignments/${assignmentViewer.assignment._id}/grade/${studentId}`, 'PUT', { grade }, true);
      alert('Submission graded successfully!');
      // Refresh submissions
      if (assignmentViewer.assignment) {
        await handleViewSubmissions(assignmentViewer.assignment);
      }
    } catch (err) {
      console.error('Failed to grade submission', err);
    }
  };

  if (!course) {
    return <p>Loading course details...</p>;
  }

  return (
    <div>
      <section className="course-details" id="courseDetails">
        <h2 id="courseTitle">{course.title}</h2>
        <p id="courseDescription">{course.description}</p>
        <p><strong>Instructor:</strong> {course.instructor && course.instructor.name ? course.instructor.name : 'N/A'}</p>
        <p><strong>Price:</strong> {course.price === 0 ? 'Free' : `INR ${course.price}`}</p>

        {/* Show Go to Course if enrolled, else Enroll button */}
        {user && Array.isArray(course.enrolledStudents) && course.enrolledStudents.some(s => s && s._id === user._id) ? (
          <a href={`/courses/${course._id}/content`} className="go-to-course-btn">Go to Course</a>
        ) : (
          user && user.role === 'student' && <button id="enrollBtn" onClick={handleEnroll}>Enroll</button>
        )}

        {/* Certificate Section - Only show if course is completed and student is eligible */}
        {user && user.role === 'student' && certificateStatus && (
          <div className="certificate-section">
            <div className="certificate-badge">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 6H4C3.44772 6 3 6.44772 3 7V17C3 17.5523 3.44772 18 4 18H20C20.5523 18 21 17.5523 21 17V7C21 6.44772 20.5523 6 20 6Z" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 18L10 22L12 20L14 22L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <h3>🎉 Certificate Available!</h3>
                <p>Congratulations! You've completed this course.</p>
                {certificateStatus.grade && <p className="cert-grade">Grade: <strong>{certificateStatus.grade}</strong></p>}
                {certificateStatus.overallScore !== null && <p className="cert-score">Score: <strong>{certificateStatus.overallScore}%</strong></p>}
              </div>
            </div>
            <button id="downloadCertBtn" onClick={handleDownloadCert} className="cert-download-btn">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16L7 11L8.4 9.6L11 12.2V4H13V12.2L15.6 9.6L17 11L12 16Z" fill="currentColor"/>
                <path d="M5 20V18H19V20H5Z" fill="currentColor"/>
              </svg>
              Download Certificate
            </button>
          </div>
        )}

        {/* Show requirement message if enrolled but certificate not yet available */}
        {user && user.role === 'student' && 
         Array.isArray(course.enrolledStudents) && 
         course.enrolledStudents.some(s => s && s._id === user._id) && 
         !certificateStatus && (
          <div className="certificate-requirements">
            <h4>📜 Certificate Requirements</h4>
            <p>To earn your certificate, you need to:</p>
            <ul>
              <li>✅ Complete all course modules</li>
              <li>✅ Submit all assignments with passing grades</li>
              <li>✅ Pass all quizzes</li>
              <li>⏳ Wait for instructor to mark the course as complete</li>
            </ul>
          </div>
        )}

        {/* Instructor: Edit Course button */}
        {user && course.instructor && user._id === course.instructor._id && (
          <a href={`/courses/${course._id}/edit`} className="edit-course-btn">Edit Course</a>
        )}

        {/* Show enrolled students if user is instructor of this course */}
        {user && course.instructor && user._id === course.instructor._id && course.enrolledStudents && (
          <div style={{ marginTop: 24 }}>
            <h3>Enrolled Students</h3>
            {course.enrolledStudents.length === 0 ? (
              <p>No students enrolled yet.</p>
            ) : (
              <ul>
                {course.enrolledStudents.map((student) => (
                  <li key={student._id}>{student.name} ({student.email})</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Show assignments and submissions if user is instructor or admin */}
        {user && (user.role === 'instructor' || user.role === 'admin') && assignments.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3>Assignments</h3>
            <ul>
              {assignments.map((assignment) => (
                <li key={assignment._id} style={{ marginBottom: 8 }}>
                  <strong>{assignment.title}</strong>
                  <p>{assignment.description}</p>
                  <p>Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                  <button onClick={() => handleViewSubmissions(assignment)}>View Submissions</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="reviews">
        <h3>Reviews</h3>
        <div id="reviewsList">
          {reviews.length === 0 ? (
            <p>No reviews yet.</p>
          ) : (
            reviews.map((review) => (
              <div key={review._id}>
                <p>Rating: {review.rating}</p>
                <p>{review.comment}</p>
              </div>
            ))
          )}
        </div>

        {/* Only show review form if user is enrolled (safe) */}
        {Array.isArray(course.enrolledStudents) && user && course.enrolledStudents.some(s => s && s._id === user._id) ? (
          <>
            <h4>Add Your Review</h4>
            <input
              type="number"
              id="reviewRating"
              placeholder="Rating (1-5)"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
            <textarea
              id="reviewComment"
              placeholder="Comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button id="submitReviewBtn" onClick={handleSubmitReview}>Submit Review</button>
          </>
        ) : (
          <p style={{ color: '#888', marginTop: 16 }}>Only enrolled students can write a review.</p>
        )}
      </section>

      {/* Assignment Viewer Modal */}
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
                      <p><strong>Grade:</strong> {sub.grade !== undefined ? sub.grade : 'Not graded'}</p>
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
            ) : (
              <p>No submissions yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Course;
