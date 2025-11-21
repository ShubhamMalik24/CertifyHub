import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiRequest from '../utils/api';
import './CreateCourse.css';

const CreateCourse = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState(0);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(
        '/courses',
        'POST',
        { title, description, category, price, modules: [] },
        true
      );
      alert('✅ Course created successfully!');
      navigate('/instructor');
    } catch (err) {
      alert("❌ Failed to create course. Make sure you're logged in as instructor.");
      console.error(err);
    }
  };

  return (
    <main>
      <h1>Create a New Course</h1>
      <form id="create-course-form" onSubmit={handleSubmit}>
        <label htmlFor="title">Course Title:</label>
        <input
          type="text"
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        /><br /><br />

        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        /><br /><br />

        <label htmlFor="category">Category:</label>
        <select
          id="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Select Category</option>
          <option value="Development">Development</option>
          <option value="Design">Design</option>
          <option value="Marketing">Marketing</option>
          <option value="Business">Business</option>
          <option value="Data Science">Data Science</option>
        </select><br /><br />

        <label htmlFor="price">Price (leave 0 for free):</label>
        <input
          type="number"
          id="price"
          min="0"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        /><br /><br />

        <button type="submit">Create Course</button>
      </form>
    </main>
  );
};

export default CreateCourse;