import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiRequest from '../utils/api';
import './Register.css';

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
      if (profilePicture) formData.append('profilePicture', profilePicture);

      const data = await apiRequest('/auth/register', 'POST', formData, false);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      alert(err.message || 'Registration failed. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="register-page">
      {/* Left form side */}
      <div className="register-left">
        <h1>Create Your Account</h1>
        <p>Join CertifyHub and start your journey today!</p>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="form-grid">
            <div className="form-group">
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <textarea
                placeholder="Short Bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                placeholder="Skills (comma separated)"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>

            <div className="form-group">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>

            <div className="form-group file-upload">
              <label className="file-label">
                Upload Profile Picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setProfilePicture(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          <button type="submit" className="btn-register">REGISTER</button>
        </form>

        <p className="login-text">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>

      {/* Right image side */}
      <div className="register-right">
        <img
          src="https://dce.harvard.edu/wp-content/uploads/sites/7/2023/12/choosing-classes.jpg"
          alt="Register illustration"
        />
      </div>
    </div>
  );
};

export default Register;
