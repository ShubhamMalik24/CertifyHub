import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import apiRequest from '../utils/api';
import './Courses.css';

const categoryOptions = ['Development', 'Design', 'Marketing', 'Finance', 'Data Science', 'Business'];

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('');
  const { user } = useAuth();

  const loadCourses = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('keyword', searchTerm);
      if (category) params.append('category', category);
      if (sortBy) params.append('sort', sortBy);

      const endpoint = params.toString() ? `/courses?${params.toString()}` : '/courses';
      const data = await apiRequest(endpoint, 'GET');

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
  }, [searchTerm, category, sortBy]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadCourses();
    }, 300);
    return () => clearTimeout(timeout);
  }, [loadCourses]);

  const handleRefresh = () => {
    loadCourses();
  };

  return (
    <div className="courses-page">
      <section className="courses-hero surface">
        <div>
          <p className="eyebrow">Course catalog</p>
          <h1>Programs built with hiring partners & universities.</h1>
          <p>
            Browse certificates, specializations, and cohort programs backed by practical assessments and mentor
            feedback. Curated to meet in-demand skills across technology, business, design, and data.
          </p>
        </div>
        <div className="courses-hero__stats">
          <div>
            <span className="stat-value">{courses.length}</span>
            <span className="stat-label">Active courses</span>
          </div>
          <div>
            <span className="stat-value">85%</span>
            <span className="stat-label">Finish within 3 months</span>
          </div>
          <div>
            <span className="stat-value">30+</span>
            <span className="stat-label">Expert mentors</span>
          </div>
        </div>
      </section>

      <div className="courses-layout">
        <aside className="filter-panel surface">
          <div className="filter-header">
            <h2>Refine your search</h2>
            <button className="btn btn-soft" type="button" onClick={handleRefresh}>
              Refresh results
            </button>
          </div>

          <div className="filter-group">
            <label className="form-label" htmlFor="course-search">
              Keyword
            </label>
            <input
              id="course-search"
              type="text"
              className="form-input"
              placeholder="e.g. cloud, product analytics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label className="form-label" htmlFor="course-category">
              Category
            </label>
            <select
              id="course-category"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All categories</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="chip-group">
              {categoryOptions.slice(0, 4).map((option) => (
                <button
                  type="button"
                  className={`chip ${category === option ? 'chip-primary' : ''}`}
                  key={option}
                  onClick={() => setCategory(category === option ? '' : option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label className="form-label" htmlFor="course-sort">
              Sort by
            </label>
            <select
              id="course-sort"
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="">Recommended</option>
              <option value="latest">Latest</option>
              <option value="popular">Most popular</option>
              <option value="rating">Highest rated</option>
              <option value="price_low">Price • Low to High</option>
              <option value="price_high">Price • High to Low</option>
            </select>
          </div>
        </aside>

        <section className="courses-results">
          <div className="results-header">
            <div>
              <p className="eyebrow">Showing {courses.length} programs</p>
              <h2>Programs that fit your goals</h2>
            </div>
            {user && user.enrolledCourses?.length > 0 && (
              <Link to="/dashboard/student" className="btn btn-secondary">
                Go to my learning
              </Link>
            )}
          </div>

          {user && user.enrolledCourses && user.enrolledCourses.length > 0 && (
            <div className="enrolled-strip surface-muted">
              <h3>My enrolled courses</h3>
              <div className="enrolled-grid">
                {user.enrolledCourses.map((course) => (
                  <Link to={`/courses/${course._id}`} key={course._id} className="enrolled-card">
                    <span>{course.title}</span>
                    <span className="meta-label">Continue learning →</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {courses.length === 0 ? (
            <div className="no-courses surface-muted">
              <h3>No courses available yet</h3>
              <p>Try adjusting your filters or check back soon.</p>
            </div>
          ) : (
            <div className="courses-grid">
              {courses.map((course) => {
                const isEnrolled =
                  user && user.enrolledCourses && user.enrolledCourses.some((ec) => ec._id === course._id);
                return (
                  <article key={course._id} className={`course-card surface ${isEnrolled ? 'is-enrolled' : ''}`}>
                    <div className="course-card__top">
                      <span className="badge">{course.category || 'General'}</span>
                      <span className="course-price">{course.price === 0 ? 'Free' : `INR ${course.price}`}</span>
                    </div>
                    <h3>{course.title}</h3>
                    <p>{course.description}</p>
                    <div className="course-card__meta">
                      <div>
                        <span className="meta-label">Instructor</span>
                        <strong>{course.instructor?.name || 'Unknown'}</strong>
                      </div>
                      {course.averageRating > 0 && (
                        <div>
                          <span className="meta-label">Rating</span>
                          <strong>{course.averageRating.toFixed(1)}</strong>
                        </div>
                      )}
                    </div>
                    <div className="course-card__actions">
                      <Link to={`/courses/${course._id}`} className="btn btn-soft">
                        View details
                      </Link>
                      {isEnrolled ? (
                        <Link to={`/courses/${course._id}/content`} className="btn btn-primary">
                          Go to course
                        </Link>
                      ) : course.price === 0 ? (
                        <Link to={`/courses/${course._id}`} className="btn btn-primary">
                          Enroll
                        </Link>
                      ) : (
                        <Link to={`/checkout?courseId=${course._id}`} className="btn btn-primary">
                          Pay & enroll
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Courses;
