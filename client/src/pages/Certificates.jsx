import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import apiRequest from '../utils/api';
import Certificate from '../components/Certificate';
import './Certificates.css';

const Certificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user._id) {
      fetchCertificates();
    }
  }, [user]);

  const fetchCertificates = async () => {
    if (!user || !user._id) {
      console.warn('User not logged in or user data not available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await apiRequest(`/certificates/student/${user._id}`, 'GET', null, true);
      setCertificates(data);
    } catch (err) {
      setError('Failed to load certificates: ' + err.message);
      console.error('Failed to fetch certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (certificate) => {
    try {
      // Use the certificate's course and student IDs (now properly populated)
      const courseId = certificate.course?._id || certificate.course;
      const studentId = certificate.student?._id || certificate.student;

      if (!courseId || !studentId) {
        alert('Certificate data is incomplete. Please contact support.');
        return;
      }

      // Use the direct download endpoint
      const response = await fetch(
        `http://localhost:5000/api/certificates/download/${courseId}?userId=${studentId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        // Create blob and download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const courseTitle = certificate.course?.title || 'certificate';
        const studentName = certificate.student?.name || 'student';
        link.download = `certificate-${courseTitle.replace(/\s+/g, '-')}-${studentName.replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        alert('Failed to download certificate: ' + errorData.message);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download certificate: ' + error.message);
    }
  };

  if (!user) {
    return (
      <div className="certificates-page">
        <div className="certificates-header glass-container">
          <h1>My Certificates</h1>
          <p>Your academic achievements and course completions</p>
        </div>
        <div className="error-container glass-container">
          <h2>Please Log In</h2>
          <p>You need to be logged in to view your certificates.</p>
          <Link to="/login" className="btn btn-primary">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="certificates-page">
        <div className="certificates-header glass-container">
          <h1>My Certificates</h1>
          <p>Your academic achievements and course completions</p>
        </div>
        <div className="error-container glass-container">
          <h2>Error Loading Certificates</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchCertificates}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="certificates-page">
      <div className="certificates-header glass-container">
        <div className="header-content">
          <div className="header-text">
            <h1>My Certificates</h1>
            <p>Your academic achievements and course completions</p>
          </div>
          <div className="header-stats">
            <div className="stat-card glass-card">
              <div className="stat-number">{certificates.length}</div>
              <div className="stat-label">Total Certificates</div>
            </div>
          </div>
        </div>
      </div>

      {certificates.length === 0 ? (
        <div className="certificates-empty">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </div>
          <h3>No Certificates Yet</h3>
          <p>Complete courses to earn certificates and showcase your learning achievements.</p>
          <Link to="/courses" className="btn">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 6V4M12 6C10.8954 6 10 6.89543 10 8V20H14V8C14 6.89543 13.1046 6 12 6ZM12 6V4M4 8L6 6M20 8L18 6M4 16L6 14M20 16L18 14M8 12L6 10M16 12L18 10" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="certificates-content">
          <div className="certificates-grid">
            {certificates.map((certificate) => (
              <Certificate
                key={certificate._id}
                certificate={certificate}
                onDownload={handleDownloadCertificate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default Certificates;