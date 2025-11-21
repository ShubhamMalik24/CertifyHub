import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiRequest from '../utils/api';
import './Instructor.css';

const Instructor = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState(0);
  const [customPrice, setCustomPrice] = useState('');
  const [myCourses, setMyCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const courses = await apiRequest('/courses', 'GET', null, true);
      setMyCourses(courses);
    } catch (err) {
      console.error('❌ Error fetching courses:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const finalPrice = price === 'other' ? Number(customPrice) : price;
      await apiRequest(
        '/courses',
        'POST',
        { title, description, category, price: finalPrice, modules: [] },
        true
      );
      alert('✅ Course created successfully!');
      fetchMyCourses();
      setTitle('');
      setDescription('');
      setCategory('');
      setPrice(0);
      setCustomPrice('');
    } catch (err) {
      alert("❌ Failed to create course. Make sure you're logged in as instructor.");
      console.error(err);
    }
  };

  return (
    <section className="instructor-section">
      <h2>Instructor Dashboard</h2>

      {/* Create Course Form */}
      <div className="create-course">
        <h3>Create New Course</h3>
        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Course Title:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <label htmlFor="category">Category:</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            <option value="Development">Development</option>
            <option value="Design">Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Business">Business</option>
            <option value="Finance">Finance</option>
            <option value="Photography">Photography</option>
            <option value="Music">Music</option>
            <option value="Other">Other</option>
          </select>

          <label htmlFor="price">Price (₹, 0 for Free):</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>₹</span>
            <select
              id="price"
              value={price === 0 || price === 499 || price === 999 || price === 1499 || price === 1999 ? price : 'other'}
              onChange={e => {
                if (e.target.value === 'other') {
                  setPrice('other');
                } else {
                  setPrice(Number(e.target.value));
                  setCustomPrice('');
                }
              }}
              style={{ flex: 1 }}
            >
              <option value={0}>Free</option>
              <option value={499}>₹499</option>
              <option value={999}>₹999</option>
              <option value={1499}>₹1499</option>
              <option value={1999}>₹1999</option>
              <option value="other">Other</option>
            </select>
            {price === 'other' && (
              <input
                type="number"
                min="1"
                placeholder="Custom price"
                value={customPrice}
                onChange={e => setCustomPrice(e.target.value)}
                style={{ flex: 1, marginLeft: 8 }}
                required
              />
            )}
          </div>

          <button type="submit">Create Course</button>
        </form>
      </div>

      {/* Existing Courses */}
      <div className="my-courses">
        <h3>My Courses</h3>
        <div id="myCoursesList">
          {myCourses.map((course) => (
            <div
              key={course._id}
              className="course-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/courses/${course._id}`)}
            >
              <h4>{course.title}</h4>
              <p>{course.description.substring(0, 100)}...</p>
              <p>Price: {course.price === 0 ? 'Free' : `INR ${course.price}`}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Instructor;
