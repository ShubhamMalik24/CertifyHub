import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiRequest from '../utils/api';
import useAuth from '../hooks/useAuth';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [userFilters, setUserFilters] = useState({
    page: 1,
    limit: 10,
    role: '',
    search: ''
  });

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardData();
      if (activeTab === 'users') {
        fetchUsers();
      }
    }
  }, [user, activeTab, userFilters]);

  const fetchDashboardData = async () => {
    try {
      const data = await apiRequest('/users/dashboard/admin', 'GET', null, true);
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: userFilters.page.toString(),
        limit: userFilters.limit.toString(),
        ...(userFilters.role && { role: userFilters.role }),
        ...(userFilters.search && { search: userFilters.search })
      });
      
      const data = await apiRequest(`/users?${params}`, 'GET', null, true);
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await apiRequest(`/users/${userId}/role`, 'PUT', { role: newRole }, true);
      fetchUsers(); // Refresh the user list
      alert(`User role updated to ${newRole}`);
    } catch (err) {
      alert('Failed to update user role');
      console.error('Error updating user role:', err);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiRequest(`/users/${userId}`, 'DELETE', null, true);
      fetchUsers(); // Refresh the user list
      alert('User deleted successfully');
    } catch (err) {
      alert('Failed to delete user');
      console.error('Error deleting user:', err);
    }
  };

  const handleUserSearch = (e) => {
    e.preventDefault();
    setUserFilters({ ...userFilters, page: 1 });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="error-message">
        <h2>Access Denied</h2>
        <p>You don't have permission to access the admin dashboard.</p>
        <Link to="/" className="btn-primary">Go to Home</Link>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Admin Dashboard</h1>
          <p className="welcome-subtitle">Manage your learning platform</p>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button 
          className={`tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          📚 Courses
        </button>
        <button 
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📈 Reports
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && dashboardData && (
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card users-stat">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-number">{dashboardData.stats.totalUsers}</div>
                  <div className="stat-label">Total Users</div>
                  <div className="stat-breakdown">
                    <span>Students: {dashboardData.stats.totalStudents}</span>
                    <span>Instructors: {dashboardData.stats.totalInstructors}</span>
                  </div>
                </div>
              </div>

              <div className="stat-card courses-stat">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <div className="stat-number">{dashboardData.stats.totalCourses}</div>
                  <div className="stat-label">Total Courses</div>
                </div>
              </div>

              <div className="stat-card certificates-stat">
                <div className="stat-icon">🏆</div>
                <div className="stat-content">
                  <div className="stat-number">{dashboardData.stats.totalCertificates}</div>
                  <div className="stat-label">Certificates Issued</div>
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <div className="activity-section">
                <h3>Recent Users</h3>
                <div className="recent-list">
                  {dashboardData.recentUsers.map(user => (
                    <div key={user._id} className="recent-item">
                      <div className="item-info">
                        <h4>{user.name}</h4>
                        <p>{user.email}</p>
                        <span className={`role-badge ${user.role}`}>{user.role}</span>
                      </div>
                      <div className="item-date">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="activity-section">
                <h3>Recent Courses</h3>
                <div className="recent-list">
                  {dashboardData.recentCourses.map(course => (
                    <div key={course._id} className="recent-item">
                      <div className="item-info">
                        <h4>{course.title}</h4>
                        <p>by {course.instructor.name}</p>
                      </div>
                      <div className="item-date">
                        {new Date(course.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="top-courses">
              <h3>Top Performing Courses</h3>
              <div className="courses-table">
                <table>
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Instructor</th>
                      <th>Enrollments</th>
                      <th>Rating</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.topCourses.map(course => (
                      <tr key={course._id}>
                        <td>{course.title}</td>
                        <td>{course.instructor}</td>
                        <td>{course.enrolledCount}</td>
                        <td>{course.averageRating || 0}/5</td>
                        <td>INR {(course.price * course.enrolledCount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <h2>User Management</h2>
            </div>

            <div className="filters-section">
              <form onSubmit={handleUserSearch} className="search-form">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userFilters.search}
                  onChange={(e) => setUserFilters({...userFilters, search: e.target.value})}
                  className="form-input"
                />
                <select
                  value={userFilters.role}
                  onChange={(e) => setUserFilters({...userFilters, role: e.target.value, page: 1})}
                  className="form-select"
                >
                  <option value="">All Roles</option>
                  <option value="student">Students</option>
                  <option value="instructor">Instructors</option>
                  <option value="admin">Admins</option>
                </select>
                <button type="submit" className="btn-primary">Search</button>
              </form>
            </div>

            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Courses</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>
                        <div className="user-info">
                          {user.profilePicture && (
                            <img 
                              src={`http://localhost:5000${user.profilePicture}`}
                              alt="Profile"
                              className="user-avatar"
                            />
                          )}
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>{user.enrolledCourses?.length || 0}</td>
                      <td>
                        <div className="action-buttons">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user._id, e.target.value)}
                            className="role-select"
                          >
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => deleteUser(user._id)}
                            className="btn-danger btn-small"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button
                disabled={userFilters.page <= 1}
                onClick={() => setUserFilters({...userFilters, page: userFilters.page - 1})}
                className="btn-secondary"
              >
                Previous
              </button>
              <span>Page {userFilters.page}</span>
              <button
                onClick={() => setUserFilters({...userFilters, page: userFilters.page + 1})}
                className="btn-secondary"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="courses-section">
            <div className="section-header">
              <h2>Course Management</h2>
            </div>
            <div className="coming-soon">
              <h3>Course Management Panel</h3>
              <p>Advanced course management features will be available here including:</p>
              <ul>
                <li>Course approval/rejection</li>
                <li>Content moderation</li>
                <li>Performance analytics</li>
                <li>Bulk course operations</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-section">
            <div className="section-header">
              <h2>Analytics & Reports</h2>
            </div>
            <div className="coming-soon">
              <h3>Advanced Analytics</h3>
              <p>Comprehensive reporting features coming soon:</p>
              <ul>
                <li>User engagement analytics</li>
                <li>Course performance metrics</li>
                <li>Revenue reports</li>
                <li>Custom report builder</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;