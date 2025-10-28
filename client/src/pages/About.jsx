import React from "react";
import './About.css';

const About = () => {
  return (
    <div className="about-container">
      <h1>
        About CertifyHub
      </h1>

      <p>
        <strong>CertifyHub</strong> is a <em>central hub for skill validation</em> designed to help learners and instructors achieve their goals. 
        Our platform provides comprehensive tools to manage courses, track progress, and validate skills efficiently.
      </p>

      <h2>
        Core Features
      </h2>
      <ul>
        <li>👤 <strong>User Profile Management:</strong> Manage bio, skills, and profile pictures.</li>
        <li>📚 <strong>Course Management System:</strong> Instructors can create/edit courses and add modules.</li>
        <li>📖 <strong>Content Delivery System:</strong> Deliver PDFs, documents, and slides seamlessly.</li>
        <li>⭐ <strong>Course Reviews & Ratings:</strong> Users can rate and review courses after completion. Average ratings are displayed on course cards.</li>
        <li>📊 <strong>Progress Tracking:</strong> Lessons auto-mark as completed; progress bars show completion per course/module.</li>
        <li>🔍 <strong>Search & Filter Courses:</strong> Search by title, category; filter by free/paid, popularity, latest, etc.</li>
        <li>💳 <strong>Payment Gateway:</strong> Securely purchase courses.</li>
        <li>🎓 <strong>Certificates:</strong> Earn certificates upon course completion.</li>
        <li>👨‍🏫 <strong>Instructor Dashboard:</strong> Manage created courses, track student progress, and view purchased courses.</li>
      </ul>

      <h2>
        Why CertifyHub?
      </h2>
      <p>
        CertifyHub combines <strong>learning, assessment, and certification</strong> in one platform, making it easier for learners to showcase skills and for instructors to share knowledge efficiently.
      </p>
    </div>
  );
};

export default About;
