import React, { useState } from 'react';
import apiRequest from '../utils/api';
import './Certificate.css';

const Certificate = ({ certificate, onDownload }) => {
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState(false);

  const handleDownload = async () => {
    if (onDownload) {
      onDownload(certificate);
      return;
    }

    setLoading(true);
    try {
      // Use the direct download endpoint
      const response = await fetch(
        `http://localhost:5000/api/certificates/download/${certificate.course._id}?userId=${certificate.student._id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download certificate');
      }

      // Create blob and download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const courseTitle = certificate.course?.title || certificate.course || 'certificate';
      link.download = `CertifyHub-Certificate-${courseTitle.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download certificate: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async () => {
    if (!certificate.certificateUrl) {
      alert('Certificate not available');
      return;
    }

    setViewing(true);
    try {
      // Open PDF in new tab for viewing
      const response = await fetch(
        `http://localhost:5000/api/certificates/download/${certificate.course._id}?userId=${certificate.student._id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load certificate');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Cleanup after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
      
    } catch (error) {
      console.error('View failed:', error);
      alert('Failed to view certificate: ' + error.message);
    } finally {
      setViewing(false);
    }
  };

  const getGradeBadgeColor = (grade) => {
    switch (grade?.toLowerCase()) {
      case 'distinction':
        return 'grade-badge-distinction';
      case 'merit':
        return 'grade-badge-merit';
      default:
        return 'grade-badge-pass';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="certificate-card glass-card">
      <div className="certificate-header">
        <div className="certificate-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 6H4C3.44772 6 3 6.44772 3 7V17C3 17.5523 3.44772 18 4 18H20C20.5523 18 21 17.5523 21 17V7C21 6.44772 20.5523 6 20 6Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 18L10 22L12 20L14 22L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="certificate-info">
          <h3>{certificate.course?.title || 'Course Certificate'}</h3>
          <p className="student-name">
            {certificate.student?.name || 'Student'}
          </p>
          <div className="certificate-details">
            {certificate.grade && (
              <span className={`grade-badge ${getGradeBadgeColor(certificate.grade)}`}>
                {certificate.grade}
              </span>
            )}
            {certificate.overallScore !== null && certificate.overallScore !== undefined && (
              <span className="score-badge">
                Score: {certificate.overallScore}%
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="certificate-meta">
        <div className="meta-item">
          <span className="meta-label">Issued Date</span>
          <span className="meta-value">
            {formatDate(certificate.issuedAt)}
          </span>
        </div>
        {certificate.certificateId && (
          <div className="meta-item">
            <span className="meta-label">Certificate ID</span>
            <span className="meta-value certificate-id">
              {certificate.certificateId}
            </span>
          </div>
        )}
      </div>

      {certificate.verificationUrl && (
        <div className="certificate-verification">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Verified Certificate</span>
        </div>
      )}

      <div className="certificate-actions">
        <button 
          className="btn btn-secondary"
          onClick={handleView}
          disabled={!certificate.certificateUrl || viewing}
          title="View certificate in new tab"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M12.0003 5C7.52443 5 3.73132 7.94288 2.45825 12C3.73132 16.0571 7.52443 19 12.0003 19C16.4761 19 20.2692 16.0571 21.5423 12C20.2692 7.94288 16.4761 5 12.0003 5Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          {viewing ? 'Opening...' : 'View'}
        </button>
        <button 
          className="btn btn-primary"
          onClick={handleDownload}
          disabled={loading || !certificate.certificateUrl}
          title="Download certificate as PDF"
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 16L7 11L8.4 9.6L11 12.2V4H13V12.2L15.6 9.6L17 11L12 16Z" fill="currentColor"/>
            <path d="M5 20V18H19V20H5Z" fill="currentColor"/>
          </svg>
          {loading ? 'Downloading...' : 'Download PDF'}
        </button>
      </div>
    </div>
  );
};

export default Certificate;