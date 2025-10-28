import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiRequest from '../utils/api';
import './Checkout.css';

const Checkout = () => {
  const [course, setCourse] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');

  useEffect(() => {
    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const courseData = await apiRequest(`/courses/${courseId}`, 'GET');
      setCourse(courseData);
    } catch (err) {
      console.error('Failed to load course', err);
    }
  };

  const handlePay = async () => {
    try {
      const data = await apiRequest(
        `/courses/${courseId}/checkout`,
        'POST',
        { paymentMethod },
        true
      );

      if (data.success) {
        alert('✅ Payment successful! You are now enrolled.');
        navigate('/profile');
      } else {
        alert('❌ Payment failed. Try again.');
      }
    } catch (err) {
      alert('❌ Checkout error. Please login and try again.');
      console.error(err);
    }
  };

  if (!course) {
    return <p>Loading course details...</p>;
  }

  return (
    <section className="checkout-section">
      <h2>Checkout</h2>
      <div id="courseInfo">
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <p><strong>Price:</strong> ${course.price}</p>
      </div>
      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
        <option value="card">Credit Card</option>
        <option value="paypal">PayPal</option>
      </select>
      <button id="payBtn" onClick={handlePay}>Pay & Enroll</button>
    </section>
  );
};

export default Checkout;
