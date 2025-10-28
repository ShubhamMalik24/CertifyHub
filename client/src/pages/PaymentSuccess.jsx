import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  return (
    <div style={{ textAlign: 'center', marginTop: 60 }}>
      <h2>Payment Successful!</h2>
      <p>Your enrollment is being processed. You can now access your course from your profile.</p>
      <button style={{ marginTop: 24, padding: '10px 24px', fontSize: 16 }} onClick={() => navigate('/profile')}>
        Go to My Courses
      </button>
    </div>
  );
};

export default PaymentSuccess;
