import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiRequest from '../utils/api';
import useAuth from '../hooks/useAuth';
import './InstructorDashboard.css';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await apiRequest('/users/dashboard/instructor', 'GET', null, true);
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    if (hasHalfStar) {
      stars.push('☆');
    }
    while (stars.length < 5) {
      stars.push('☆');
    }
    
    return stars.join('');
  };

  const handleMarkCourseComplete = async (courseId) => {
    if (!window.confirm('Are you sure you want to mark this course as complete? This will generate certificates for all eligible students.')) {
      return;
    }
    
    try {
      const response = await apiRequest(`/certificates/admin/courses/${courseId}/mark-complete`, 'POST', null, true);
      alert(`Course marked as complete! ${response.certificatesGenerated} certificates generated for eligible students.`);
      fetchDashboardData(); // Refresh the dashboard
    } catch (err) {
      alert('Failed to mark course complete: ' + err.message);
      console.error('Failed to mark course complete', err);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!dashboardData) {
    return <div className="error-message">No dashboard data available</div>;
  }

  return (
    <div className="instructor-dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome, {dashboardData.user.name}</h1>
          <p className="welcome-subtitle">Manage your courses and track your success</p>
        </div>
        
        <div className="instructor-stats">
          <div className="stat-card revenue">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <div className="stat-number">{formatCurrency(dashboardData.stats.totalRevenue)}</div>
              <div className="stat-label">Total Revenue</div>
            </div>
          </div>
          <div className="stat-card courses">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <div className="stat-number">{dashboardData.stats.totalCourses}</div>
              <div className="stat-label">Courses Created</div>
            </div>
          </div>
          <div className="stat-card students">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-number">{dashboardData.stats.totalStudents}</div>
              <div className="stat-label">Total Students</div>
            </div>
          </div>
          <div className="stat-card rating">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-number">{dashboardData.stats.averageRating.toFixed(1)}</div>
              <div className="stat-label">Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="main-content">
          {/* Course Management Section */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>My Courses</h2>
              <Link to="/create-course" className="btn-primary">
                <span>+</span> Create New Course
              </Link>
            </div>
            
            {dashboardData.createdCourses.length === 0 ? (
              <div className="empty-state">
                <h3>No courses created yet</h3>
                <p>Start sharing your knowledge by creating your first course</p>
                <Link to="/create-course" className="btn-primary">Create Course</Link>
              </div>
            ) : (
              <div className="courses-grid">
                {dashboardData.createdCourses.map(course => (
                  <div key={course._id} className="course-card instructor-course">
                    <div className="course-header">
                      <h3>{course.title}</h3>
                      <div className="course-meta">
                        <span className="price">{course.price === 0 ? 'Free' : formatCurrency(course.price)}</span>
                        <span className="rating">
                          {getRatingStars(course.analytics.averageRating)} ({course.analytics.averageRating.toFixed(1)})
                        </span>
                      </div>
                    </div>
                    
                    <div className="course-analytics">
                      <div className="analytics-grid">
                        <div className="metric">
                          <div className="metric-value">{course.analytics.totalStudents}</div>
                          <div className="metric-label">Students</div>
                        </div>
                        <div className="metric">
                          <div className="metric-value">{course.analytics.completionRate}%</div>
                          <div className="metric-label">Completion</div>
                        </div>
                        <div className="metric">
                          <div className="metric-value">{course.analytics.totalAssignments}</div>
                          <div className="metric-label">Assignments</div>
                        </div>
                        <div className="metric">
                          <div className="metric-value">{course.analytics.totalQuizzes}</div>
                          <div className="metric-label">Quizzes</div>
                        </div>
                      </div>
                      
                      <div className="revenue-info">
                        <span>Revenue: {formatCurrency(course.price * course.analytics.totalStudents)}</span>
                      </div>
                    </div>
                    
                    <div className="course-actions">
                      <Link to={`/courses/${course._id}`} className="btn-secondary btn-small">
                        View Course
                      </Link>
                      <Link to={`/courses/${course._id}/edit`} className="btn-secondary btn-small">
                        Edit
                      </Link>
                      <Link to={`/instructor/analytics/${course._id}`} className="btn-primary btn-small">
                        Analytics
                      </Link>
                      {!course.isCompletedByInstructor && (
                        <button 
                          onClick={() => handleMarkCourseComplete(course._id)}
                          className="btn-success btn-small certificate-btn"
                          title="Mark course complete and generate certificates"
                        >
                          🏆 Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Activity Section */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>Recent Activity</h2>
            </div>
            
            <div className="activity-tabs">
              <div className="tab-content">
                <h3>Assignment Submissions</h3>
                {dashboardData.recentAssignmentSubmissions.length === 0 ? (
                  <div className="empty-state-small">
                    <p>No recent assignment submissions</p>
                  </div>
                ) : (
                  <div className="activity-list">
                    {dashboardData.recentAssignmentSubmissions.slice(0, 5).map((submission, index) => (
                      <div key={index} className="activity-item">
                        <div className="activity-info">
                          <h4>{submission.assignmentTitle}</h4>
                          <p className="course-name">{submission.courseTitle}</p>
                          <p className="student-name">
                            Submitted by: {submission.student?.name || 'Unknown Student'}
                          </p>
                          <p className="submission-date">
                            {new Date(submission.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="activity-actions">
                          {submission.grade !== undefined ? (
                            <span className="grade-badge">Graded: {submission.grade}</span>
                          ) : (
                            <span className="pending-badge">Pending Review</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <h3 style={{ marginTop: '2rem' }}>Quiz Attempts</h3>
                {dashboardData.recentQuizAttempts.length === 0 ? (
                  <div className="empty-state-small">
                    <p>No recent quiz attempts</p>
                  </div>
                ) : (
                  <div className="activity-list">
                    {dashboardData.recentQuizAttempts.slice(0, 5).map((attempt, index) => (
                      <div key={index} className="activity-item">
                        <div className="activity-info">
                          <h4>{attempt.quizTitle}</h4>
                          <p className="course-name">{attempt.courseTitle}</p>
                          <p className="student-name">
                            Attempted by: {attempt.student?.name || 'Unknown Student'}
                          </p>
                          <p className="attempt-date">
                            {new Date(attempt.attemptedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="activity-actions">
                          <span className="score-badge">Score: {attempt.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="sidebar">
          {/* Quick Actions */}
          <section className="sidebar-section">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <Link to="/create-course" className="action-item">
                <div className="action-icon">📝</div>
                <div className="action-text">
                  <h4>Create Course</h4>
                  <p>Start a new course</p>
                </div>
              </Link>
              
              <Link to="/instructor/students" className="action-item">
                <div className="action-icon">👥</div>
                <div className="action-text">
                  <h4>Manage Students</h4>
                  <p>View enrolled students</p>
                </div>
              </Link>
              
              <Link to="/instructor/analytics" className="action-item">
                <div className="action-icon">📊</div>
                <div className="action-text">
                  <h4>Analytics</h4>
                  <p>View detailed reports</p>
                </div>
              </Link>
            </div>
          </section>

          {/* Profile Summary */}
          <section className="sidebar-section">
            <h3>Profile</h3>
            <div className="profile-summary">
              {dashboardData.user.profilePicture && (
                <img 
                  src={`http://localhost:5000${dashboardData.user.profilePicture}`}
                  alt="Profile"
                  className="profile-image"
                />
              )}
              <div className="profile-info">
                <h4>{dashboardData.user.name}</h4>
                <p>{dashboardData.user.email}</p>
                <p className="role-badge">Instructor</p>
                {dashboardData.user.bio && <p className="bio">{dashboardData.user.bio}</p>}
              </div>
              <Link to="/profile" className="btn-secondary">Edit Profile</Link>
            </div>
          </section>

          {/* Instructor Tips */}
          <section className="sidebar-section tips-section">
            <h3>💡 Instructor Tips</h3>
            <div className="tips-list">
              <div className="tip-item">
                <p>Keep your course content updated and engaging to maintain high ratings.</p>
              </div>
              <div className="tip-item">
                <p>Respond to student questions promptly to improve engagement.</p>
              </div>
              <div className="tip-item">
                <p>Use a mix of videos, quizzes, and assignments for better learning outcomes.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;