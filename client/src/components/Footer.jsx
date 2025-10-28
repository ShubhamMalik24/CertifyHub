import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Left Section - Branding */}
        <div className="footer-section footer-branding">
          <h1>CertifyHub © 2025</h1>
          <h4>Empowering learners with verified achievements</h4>
        </div>

        {/* Middle Section - Quick Links */}
        <div className="footer-section footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/courses">Courses</Link></li>
            <li><Link to="/certificates">My Certificates</Link></li>
            <li><Link to="/dashboard/student">Dashboard</Link></li>
            <li><Link to="/about">About</Link></li>
          </ul>
        </div>

        {/* Right Section - Team */}
        <div className="footer-section footer-team">
          <h4>Team</h4>
          <ul>
            <li>Tejal</li>
            <li>Simranjeet</li>
            <li>Shubham</li>
            <li>Tanvi</li>
          </ul>
        </div>
      </div>

      {/* Bottom Line */}
      <div className="footer-bottom">
        <p>Designed with ❤️</p>
      </div>
    </footer>
  );
};

export default Footer;
