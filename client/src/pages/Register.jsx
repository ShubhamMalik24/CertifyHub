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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('role', role);
      formData.append('bio', bio);
      formData.append('skills', skills);
      if (profilePicture) formData.append('profilePicture', profilePicture);

      await apiRequest('/auth/register', 'POST', formData, false);
      alert('Registration successful! Please sign in.');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page register-page">
      <div className="auth-card">
        <div className="auth-content">
          <div className="auth-copy">
            <p className="eyebrow">Join CertifyHub</p>
            <h1>Create your learner profile</h1>
            <p>Showcase your background, choose a learning path, and start building verified credentials.</p>
          </div>

          <form className="auth-form register-form" onSubmit={handleSubmit} encType="multipart/form-data">
            {error && <div className="auth-alert">{error}</div>}

            <div className="register-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="register-name">
                  Full name
                </label>
                <input
                  id="register-name"
                  type="text"
                  className="form-input"
                  placeholder="Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-email">
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-password">
                  Password
                </label>
                <input
                  id="register-password"
                  type="password"
                  className="form-input"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-role">
                  I&apos;m joining as
                </label>
                <select
                  id="register-role"
                  className="form-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                </select>
              </div>

              <div className="form-group span-2">
                <label className="form-label" htmlFor="register-bio">
                  Short bio
                </label>
                <textarea
                  id="register-bio"
                  className="form-textarea"
                  rows={3}
                  placeholder="Tell us about your experience or goals"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <div className="form-group span-2">
                <label className="form-label" htmlFor="register-skills">
                  Skills (comma separated)
                </label>
                <input
                  id="register-skills"
                  type="text"
                  className="form-input"
                  placeholder="JavaScript, Figma, Growth Marketing"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>

              <div className="form-group span-2">
                <label className="form-label">Profile picture</label>
                <label className="file-label">
                  Upload image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                  />
                </label>
                {profilePicture && <p className="file-meta">{profilePicture.name}</p>}
              </div>
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting}>
              {submitting ? 'Creating profile...' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>

        <aside className="auth-aside register-aside">
          <div className="auth-aside__content">
            <p className="eyebrow">Become an instructor</p>
            <h3>Launch your next cohort with CertifyHub and reach global learners.</h3>
            <p>Personal onboarding, curriculum support, and real-time analytics included.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Register;
