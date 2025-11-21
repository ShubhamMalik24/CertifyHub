import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const linkGroups = [
  {
    title: 'Learn',
    links: [
      { label: 'Course catalog', to: '/courses' },
      { label: 'Career tracks', to: '/courses' },
      { label: 'Certificates', to: '/certificates' },
      { label: 'For teams', to: '/about' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Student dashboard', to: '/dashboard/student' },
      { label: 'Instructor hub', to: '/dashboard/instructor' },
      { label: 'Admin console', to: '/dashboard/admin' },
      { label: 'Support', to: '/about' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Careers', to: '/about' },
      { label: 'Blog', to: '/' },
      { label: 'Contact', to: '/about' },
    ],
  },
];

const Footer = () => (
  <footer className="site-footer">
    <div className="footer-grid">
      <div className="footer-brand">
        <h3>CertifyHub</h3>
        <p>Professional certificates and pathways built with industry experts and universities worldwide.</p>
        <div className="footer-badges">
          <span className="badge badge-accent">200+ partners</span>
          <span className="badge">92% learner satisfaction</span>
        </div>
      </div>

      {linkGroups.map((group) => (
        <div className="footer-links" key={group.title}>
          <h4>{group.title}</h4>
          <ul>
            {group.links.map((link) => (
              <li key={link.label}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="footer-newsletter">
        <h4>Stay informed</h4>
        <p>Monthly digest of new programs, tips, and success stories. No spam.</p>
        <form>
          <label className="sr-only" htmlFor="newsletter-email">
            Email address
          </label>
          <input id="newsletter-email" type="email" placeholder="Email address" aria-label="Email address" />
          <button type="submit">Subscribe</button>
        </form>
      </div>
    </div>

    <div className="footer-bottom">
      <p>© {new Date().getFullYear()} CertifyHub. Designed for lifelong learning.</p>
      <div className="footer-meta">
        <Link to="/">Privacy</Link>
        <Link to="/">Terms</Link>
        <Link to="/">Accessibility</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
