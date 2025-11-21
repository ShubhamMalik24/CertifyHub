import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import apiRequest from '../utils/api';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiRequest('/auth/login', 'POST', { email, password });

      if (data.requiresOTP) {
        setShowOTP(true);
        setOtp('');
      } else {
        localStorage.setItem('token', data.token);
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiRequest('/auth/verify-otp', 'POST', { email, otp });
      localStorage.setItem('token', data.token);
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowOTP(false);
    setOtp('');
    setError('');
  };

  const isOtpStep = showOTP;
  const submitLabel = loading
    ? isOtpStep
      ? 'Verifying...'
      : 'Sending OTP...'
    : isOtpStep
    ? 'Verify & continue'
    : 'Sign in';

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-content">
          <div className="auth-copy">
            <p className="eyebrow">{isOtpStep ? 'Two-step verification' : 'Welcome back'}</p>
            <h1>{isOtpStep ? 'Confirm your login' : 'Sign in to continue learning'}</h1>
            <p>
              Secure access with OTP protection. Continue where you left off, track certificates, and manage your
              career-ready skills.
            </p>
          </div>

          <form className="auth-form" onSubmit={isOtpStep ? handleOTPVerify : handleSubmit}>
            {error && <div className="auth-alert">{error}</div>}

            {!isOtpStep && (
              <>
                <div className="form-group">
                  <label htmlFor="login-email" className="form-label">
                    Email address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="login-password" className="form-label">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    className="form-input"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-footer">
                  <label>
                    <input type="checkbox" />
                    Remember me
                  </label>
                  <Link to="/forgot" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>
              </>
            )}

            {isOtpStep && (
              <>
                <div className="otp-note">
                  <span>Check your inbox</span>
                  <p>
                    We sent a 6-digit verification code to <strong>{email}</strong>.
                  </p>
                </div>
                <div className="form-group">
                  <label htmlFor="login-otp" className="form-label">
                    One-time password
                  </label>
                  <input
                    id="login-otp"
                    type="text"
                    inputMode="numeric"
                    className="form-input otp-input"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    disabled={loading}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading || (isOtpStep && otp.length !== 6)}
            >
              {submitLabel}
            </button>

            {isOtpStep && (
              <button type="button" className="btn btn-ghost" onClick={handleBackToLogin} disabled={loading}>
                Back to login
              </button>
            )}
          </form>

          <p className="auth-switch">
            Don&apos;t have an account? <Link to="/register">Create one</Link>
          </p>
        </div>

        <aside className="auth-aside">
          <div className="auth-aside__content">
            <p className="eyebrow">Learner stories</p>
            <h3>“Courses feel like Coursera—polished, rigorous, and flexible for my schedule.”</h3>
            <p>Certify Hub</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Login;

