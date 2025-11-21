import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import logo from '../assets/logo.png';
import Calendar from './Calendar';
import './Header.css';

const navLinks = [
  { label: 'Programs', to: '/courses' },
  { label: 'Certificates', to: '/certificates' },
  { label: 'For Instructors', to: '/instructor' },
  { label: 'About', to: '/about' },
];

const Header = () => {
  const { user, logout } = useAuth();

  const renderDashboardLink = () => {
    if (!user) return null;
    if (user.role === 'student') {
      return <Link to="/dashboard/student">Student Hub</Link>;
    }
    if (user.role === 'instructor') {
      return <Link to="/dashboard/instructor">Instructor Hub</Link>;
    }
    if (user.role === 'admin') {
      return <Link to="/dashboard/admin">Admin Console</Link>;
    }
    return null;
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <img src={logo} alt="CertifyHub logo" />
          </span>
          <div className="brand-meta">
            <span className="brand-title">CertifyHub</span>
           
          </div>
        </Link>

        <nav className="primary-nav" aria-label="Primary">
          {navLinks.map((link) => (
            <Link key={link.label} to={link.to}>
              {link.label}
            </Link>
          ))}
          {renderDashboardLink()}
        </nav>

        <div className="header-utilities">
          <div className="calendar-trigger" aria-label="Open academic calendar">
            <Calendar />
          </div>

          {user ? (
            <div className="user-controls">
              <Link to="/profile" className="user-chip">
                <span className="chip-label">Signed in</span>
                <strong>{user.name || user.email}</strong>
              </Link>
              <button className="btn btn-secondary" onClick={logout}>
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-primary">
                Start learning
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
