
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiRequest from '../utils/api';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('role', role);
      formData.append('bio', bio);
      formData.append('skills', skills);
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
      }

      const data = await apiRequest('/auth/register', 'POST', formData, false);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      alert(err.message || 'Registration failed. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="centered-container">
      <div className="auth-container glass-container">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Sign up for CertifyHub</p>
        </div>
        <form id="register-form" className="auth-form" onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              className="form-input"
              placeholder="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-input"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="bio">Short Bio</label>
            <textarea
              id="bio"
              className="form-input"
              placeholder="Short Bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="skills">Skills (comma separated)</label>
            <input
              type="text"
              id="skills"
              className="form-input"
              placeholder="Skills (comma separated)"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="profilePicture">Profile Picture</label>
            <input
              type="file"
              id="profilePicture"
              className="form-input"
              accept="image/*"
              onChange={e => setProfilePicture(e.target.files[0])}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="role">Role</label>
            <select id="role" className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-full">Register</button>
        </form>
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="auth-link">Login here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;