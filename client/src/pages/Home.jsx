import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiRequest from '../utils/api';
import './Home.css';

const Home = () => {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('');

  useEffect(() => {
    loadCourses();
  }, [searchTerm, category, sortBy]);

  const loadCourses = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('keyword', searchTerm);
      if (category) params.append('category', category);
      if (sortBy) params.append('sort', sortBy);
      
      const queryString = params.toString();
      const endpoint = queryString ? `/courses?${queryString}` : '/courses';
      
      const data = await apiRequest(endpoint, 'GET');
      // Handle both old and new API response formats
      const coursesArray = Array.isArray(data) ? data : (data.courses || []);
      setCourses(coursesArray);
    } catch (error) {
      console.error('Failed to load courses', error);
      setCourses([]);
    }
  };

  const handleSearch = () => {
    loadCourses();
  };

  // Connect Home component with CSS by adding a className to the root div
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to CertifyHub</h1>
          <p>Discover, learn, and get certified with our extensive collection of online courses</p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">{courses.length}</span>
              <span className="stat-label">Available Courses</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="search-filter">
        <div className="filter-group">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search courses..."
            className="search-input"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="filter-select">
            <option value="">All Categories</option>
            <option value="Development">Development</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Business">Business</option>
            <option value="Data Science">Data Science</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="filter-select">
            <option value="">Sort By</option>
            <option value="latest">Latest</option>
            <option value="popular">Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      </section>

      {/* Courses List */}
      <section className="courses-section">
        <div className="section-header">
          <h2>Available Courses</h2>
          <p className="course-count">Showing {courses.length} courses</p>
        </div>
        
        {courses.length === 0 ? (
          <div className="no-courses">
            <h3>No courses found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="courses-list">
            {courses.map(course => (
              <div key={course._id} className="course-card">
                <div className="course-header">
                  <h3>{course.title}</h3>
                  <span className="course-category">{course.category}</span>
                </div>
                <p className="course-description">{course.description}</p>
                <div className="course-meta">
                  <span className="course-instructor">by {course.instructor?.name || 'Unknown'}</span>
                  <div className="course-rating">
                    {course.averageRating > 0 && (
                      <>
                        <span className="rating-stars">{'★'.repeat(Math.floor(course.averageRating))}</span>
                        <span className="rating-number">({course.averageRating.toFixed(1)})</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="course-footer">
                  <span className="course-price">
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                  </span>
                  <Link to={`/courses/${course._id}`} className="course-link">
                    View Course
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;