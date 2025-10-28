import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import apiRequest from '../utils/api';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await apiRequest('/auth/login', 'POST', { email, password });
      localStorage.setItem('token', data.token);
      window.location.href = '/';
    } catch (err) {
      alert('Login failed. Please check your credentials.');
      console.error(err);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <h1>Hello!</h1>
        <p>Sign in to your account</p>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <span className="input-icon">📧</span>
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-footer">
            <label>
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/forgot" className="forgot-link">Forgot password?</Link>
          </div>
          <button type="submit" className="btn-login">SIGN IN</button>
        </form>
        <p className="signup-text">
          Don't have an account? <Link to="/register">Create</Link>
        </p>
      </div>
      <div className="login-right">
         <img src="https://www.shutterstock.com/image-vector/elegant-blue-golden-seal-stamp-600nw-260500034.jpg" alt="Login illustration" />
      </div>
    </div>
  );
};

export default Login;
