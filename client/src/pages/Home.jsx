import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiRequest from '../utils/api';
import './Home.css';

const highlightStats = [
  { value: '4.9/5', label: 'Learner rating' },
  { value: '120+', label: 'Career tracks' },
  { value: '65%', label: 'Avg. salary boost' },
];

const curatedCategories = ['Development', 'Data Science', 'Design', 'Marketing', 'Business'];

const featuredTracks = [
  {
    title: 'Full-Stack Cloud Engineer',
    duration: '12 weeks • Intermediate',
    outcome: 'Build and deploy production-ready apps',
  },
  {
    title: 'Product Design Accelerator',
    duration: '10 weeks • Beginner friendly',
    outcome: 'Ship polished case studies for your portfolio',
  },
  {
    title: 'AI for Business Operations',
    duration: '6 weeks • Advanced',
    outcome: 'Automate reporting & customer workflows',
  },
];

const learningPillars = [
  {
    title: 'Guided learning',
    description: 'Live mentor sessions and graded projects keep you accountable every week.',
  },
  {
    title: 'Career proof',
    description: 'Earn university-backed certificates with verified assessments and artifacts.',
  },
  {
    title: 'Flexible pacing',
    description: 'Self-paced videos plus calendar-based reminders to stay on track.',
  },
];

const partnerOrgs = ['Northwind U', 'Nova Labs', 'CloudForge', 'Pulse Analytics', 'Lumina Health'];

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
      const coursesArray = Array.isArray(data) ? data : data.courses || [];
      setCourses(coursesArray);
    } catch (error) {
      console.error('Failed to load courses', error);
      setCourses([]);
    }
  };

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">Trusted by ambitious learners worldwide</p>
          <h1>Move your career forward with industry-grade certificates.</h1>
          <p className="lead">
            Build competitive skills, unlock promotions, or pivot into roles that value proof of hands-on mastery.
            Learn alongside mentors, submit projects, and earn credentials recruiters trust.
          </p>

          <div className="hero__actions">
            <Link to="/courses" className="btn btn-primary">
              Explore catalog
            </Link>
            <Link to="/about" className="btn btn-secondary">
              Talk to an advisor
            </Link>
          </div>

          <div className="hero__stats">
            {highlightStats.map((stat) => (
              <div className="stat" key={stat.label}>
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
            <div className="stat stat--courses">
              <span className="stat-value">{courses.length}</span>
              <span className="stat-label">Active courses</span>
            </div>
          </div>
        </div>

        <div className="hero__panel surface">
          <div className="panel-header">
            <p className="eyebrow">Find your next skill</p>
            <h3>Search the entire catalog</h3>
          </div>

          <div className="input-control">
            <label htmlFor="search" className="form-label">
              Keyword
            </label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g. React, Product Analytics, AI Ops..."
              className="form-input"
            />
          </div>

          <div className="panel-chips">
            <span>Popular focus areas</span>
            <div className="chip-group">
              {curatedCategories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`chip ${category === item ? 'chip-primary' : ''}`}
                  onClick={() => setCategory(item === category ? '' : item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="panel-selects">
            <label className="form-label">
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-select">
                <option value="">All</option>
                {curatedCategories.map((item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-label">
              Sort by
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-select">
                <option value="">Recommended</option>
                <option value="latest">Latest</option>
                <option value="popular">Popular</option>
                <option value="rating">Highest rated</option>
                <option value="price_low">Price • Low to High</option>
                <option value="price_high">Price • High to Low</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="trusted-strip surface-muted">
        <p>In partnership with universities & teams such as</p>
        <div className="trusted-strip__logos">
          {partnerOrgs.map((org) => (
            <span key={org}>{org}</span>
          ))}
        </div>
      </section>

      <section className="tracks">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Career-ready pathways</p>
            <h2>Guided programs to accelerate outcomes</h2>
          </div>
          <Link to="/courses" className="link-forward">
            See all tracks →
          </Link>
        </div>
        <div className="tracks-grid">
          {featuredTracks.map((track) => (
            <article className="track-card surface" key={track.title}>
              <span className="badge badge-accent">Career Track</span>
              <h3>{track.title}</h3>
              <p className="track-duration">{track.duration}</p>
              <p className="track-outcome">{track.outcome}</p>
              <Link to="/courses" className="btn btn-secondary">
                View syllabus
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="learning-promise">
        {learningPillars.map((pillar) => (
          <div className="learning-card" key={pillar.title}>
            <h3>{pillar.title}</h3>
            <p>{pillar.description}</p>
          </div>
        ))}
      </section>

      <section className="courses-section">
        <div className="section-header">
          <div>
            <p className="eyebrow">Top picks for you</p>
            <h2>Featured courses</h2>
          </div>
          <p className="course-count">Showing {courses.length} courses</p>
        </div>

        {courses.length === 0 ? (
          <div className="no-courses surface-muted">
            <h3>No courses found</h3>
            <p>Try adjusting your search, filters, or explore another category.</p>
          </div>
        ) : (
          <div className="courses-list">
            {courses.map((course) => (
              <article key={course._id} className="course-card surface">
                <div className="course-card__header">
                  <div>
                    <span className="badge">{course.category || 'General'}</span>
                    <h3>{course.title}</h3>
                  </div>
                  <span className="course-price">{course.price === 0 ? 'Free' : `INR ${course.price}`}</span>
                </div>
                <p className="course-description">{course.description}</p>
                <div className="course-meta">
                  <div>
                    <span className="meta-label">Instructor</span>
                    <strong>{course.instructor?.name || 'Unknown'}</strong>
                  </div>
                  {course.averageRating > 0 && (
                    <div className="course-rating">
                      <span className="meta-label">Rating</span>
                      <strong>{course.averageRating.toFixed(1)}</strong>
                    </div>
                  )}
                </div>
                <div className="course-card__actions">
                  <Link to={`/courses/${course._id}`} className="btn btn-soft">
                    View details
                  </Link>
                  {course.price === 0 ? (
                    <Link to={`/courses/${course._id}`} className="btn btn-primary">
                      Enroll for free
                    </Link>
                  ) : (
                    <Link to={`/checkout?courseId=${course._id}`} className="btn btn-primary">
                      Enroll now
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="callout surface">
        <div>
          <p className="eyebrow">For instructors</p>
          <h3>Share your expertise with a global cohort.</h3>
          <p>
            Launch modular lessons, track cohort progress, and award certificates with zero setup fees. Our curriculum
            team helps convert your experience into immersive learning moments.
          </p>
        </div>
        <Link to="/create-course" className="btn btn-primary">
          Create a course
        </Link>
      </section>
    </div>
  );
};

export default Home;