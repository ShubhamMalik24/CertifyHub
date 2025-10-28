import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import apiRequest from '../utils/api';
import './Courses.css';

const Courses = () => {

  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await apiRequest('/courses', 'GET');
      // Normalize API response - handle both direct array and {courses: []} format
      if (Array.isArray(data)) {
        setCourses(data);
      } else if (data && Array.isArray(data.courses)) {
        setCourses(data.courses);
      } else if (data && Array.isArray(data.data)) {
        setCourses(data.data);
      } else {
        console.warn('Unexpected API response format:', data);
        setCourses([]);
      }
    } catch (error) {
      console.error('Failed to load courses', error);
      setCourses([]);
    }
  };

  const handleSearch = () => {
    // Implement search/filter logic
    // For now, just reload courses
    loadCourses();
  };

  return (
    <div>
      {/* Search & Filter */}
      <section className="search-filter">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search courses..."
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="Development">Development</option>
          <option value="Design">Design</option>
          <option value="Marketing">Marketing</option>
          <option value="Finance">Finance</option>
          <option value="Data Science">Data Science</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="">Sort By</option>
          <option value="latest">Latest</option>
          <option value="popular">Popular</option>
        </select>
        <button onClick={handleSearch}>Search</button>
      </section>


      {/* Enrolled Courses Section */}
      {user && user.enrolledCourses && user.enrolledCourses.length > 0 && (
        <section className="courses-list" style={{ marginBottom: 32 }}>
          <h2>My Enrolled Courses</h2>
          {user.enrolledCourses.map(course => (
            <div key={course._id} className="course-card enrolled">
              <Link to={`/courses/${course._id}`} className="course-link">
                <h3>{course.title}</h3>
              </Link>
            </div>
          ))}
        </section>
      )}

      {/* All Courses Section */}
      <section id="coursesList" className="courses-list">
        <h2>All Courses</h2>
        {!Array.isArray(courses) || courses.length === 0 ? (
          <p>No courses available yet.</p>
        ) : (
          courses.map(course => {
            const isEnrolled = user && user.enrolledCourses && user.enrolledCourses.some(ec => ec._id === course._id);
            return (
              <div key={course._id} className={`course-card${isEnrolled ? ' enrolled' : ''}`}>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <p><strong>Category:</strong> {course.category}</p>
                <p className="price">${course.price}</p>
                <Link to={`/courses/${course._id}`}>View Details</Link>
                {isEnrolled ? (
                  <Link to={`/courses/${course._id}/content`} className="go-to-course-btn">Go to Course</Link>
                ) : (
                  <Link to={`/courses/${course._id}`} className="enroll-btn">Enroll</Link>
                )}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
};

export default Courses;
