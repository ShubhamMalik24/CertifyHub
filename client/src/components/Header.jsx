import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import logo from '../assets/logo.png';
import Calendar from './Calendar';
import './Header.css'; // import the CSS

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header>
      <div className="logo">
        <Link to="/">
          <img
            src={logo}
            alt="CertifyHub Logo"
          />
        </Link>
      </div>

      <nav>
        <Link to="/">Home</Link>
        <Link to="/courses">Courses</Link>
        <Link to="/about">About</Link>

        {/* Calendar Component */}
        <Calendar />

        {user && (
          <>
            {user.role === 'student' && (
              <Link to="/dashboard/student">My Dashboard</Link>
            )}
            {user.role === 'instructor' && (
              <Link to="/dashboard/instructor">Instructor Dashboard</Link>
            )}
            {user.role === 'admin' && (
              <Link to="/dashboard/admin">Admin Dashboard</Link>
            )}
          </>
        )}

        {user ? (
          <>
            <Link to="/profile">Profile</Link>
            <Link to="/certificates">My Certificates</Link>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;
