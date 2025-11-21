import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import apiRequest from '../utils/api';
import './Checkout.css';

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

const Checkout = () => {
  const [course, setCourse] = useState(null);
  const [isScriptReady, setIsScriptReady] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const courseId = searchParams.get('courseId');

  useEffect(() => {
    if (!courseId) return;
    const fetchCourse = async () => {
      try {
        const courseData = await apiRequest(`/courses/${courseId}`, 'GET');
        setCourse(courseData);
      } catch (err) {
        console.error('Failed to load course', err);
        setPaymentError('Could not load course details. Please try again later.');
      }
    };

    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    const handleLoad = () => setIsScriptReady(true);
    const handleError = () =>
      setPaymentError('Unable to load Razorpay checkout. Please disable blockers and retry.');

    const existingScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`);

    if (existingScript) {
      if (window.Razorpay) {
        setIsScriptReady(true);
      } else {
        existingScript.addEventListener('load', handleLoad);
        existingScript.addEventListener('error', handleError);
      }

      return () => {
        existingScript.removeEventListener('load', handleLoad);
        existingScript.removeEventListener('error', handleError);
      };
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = handleLoad;
    script.onerror = handleError;

    document.body.appendChild(script);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, []);

  const openRazorpay = useCallback(
    (orderDetails) => {
      if (!window.Razorpay) {
        setPaymentError('Payment gateway is not ready. Please reload the page.');
        setIsPaying(false);
        return;
      }

      const options = {
        key: orderDetails.key,
        amount: orderDetails.amount,
        currency: orderDetails.currency,
        name: 'CertifyHub',
        description: orderDetails.course?.title || 'Course Enrollment',
        order_id: orderDetails.orderId,
        prefill: {
          name: user?.name || orderDetails.user?.name || '',
          email: user?.email || orderDetails.user?.email || '',
        },
        notes: {
          courseId,
        },
        theme: {
          color: '#5E81F4',
        },
        handler: async (response) => {
          try {
            await apiRequest(
              '/payments/verify',
              'POST',
              {
                courseId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              true
            );
            navigate('/payment-success');
          } catch (err) {
            console.error('Verification failed', err);
            setPaymentError(err.message || 'Payment verification failed. Please contact support.');
          } finally {
            setIsPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        console.error('Payment failed', response.error);
        setPaymentError(response.error?.description || 'Payment failed. Please try again.');
        setIsPaying(false);
      });

      razorpay.open();
    },
    [courseId, navigate, user]
  );

  const handlePay = async () => {
    if (!courseId || !course) {
      setPaymentError('Missing course information.');
      return;
    }

    if (!user) {
      setPaymentError('Please log in to continue with the payment.');
      navigate('/login', { replace: true });
      return;
    }

    if (!isScriptReady) {
      setPaymentError('Payment gateway is still loading. Please wait a moment.');
      return;
    }

    setPaymentError('');
    setIsPaying(true);

    try {
      const orderDetails = await apiRequest(
        '/payments/create-order',
        'POST',
        { courseId },
        true
      );

      if (!orderDetails?.orderId) {
        throw new Error('Received invalid order details from server.');
      }

      openRazorpay(orderDetails);
    } catch (err) {
      console.error('Order creation failed', err);
      setPaymentError(err.message || 'Unable to start payment. Please try again.');
      setIsPaying(false);
    }
  };

  const handleFreeEnroll = async () => {
    if (!user) {
      setPaymentError('Please log in to enroll in this course.');
      navigate('/login', { replace: true });
      return;
    }

    setPaymentError('');
    setIsPaying(true);
    try {
      await apiRequest(`/courses/${courseId}/enroll`, 'POST', null, true);
      navigate('/profile');
    } catch (err) {
      console.error('Free enrollment failed', err);
      setPaymentError(err.message || 'Unable to enroll right now. Please try again.');
    } finally {
      setIsPaying(false);
    }
  };

  if (!courseId) {
    return <p>Course not specified. Please go back and choose a course.</p>;
  }

  if (!course) {
    return <p>Loading course details...</p>;
  }

  if (course.price === 0) {
    return (
      <section className="checkout-section">
        <h2>Enroll for Free</h2>
        <div id="courseInfo">
          <h3>{course.title}</h3>
          <p>{course.description}</p>
          <p>
            <strong>Price:</strong> Free
          </p>
        </div>
        {paymentError && (
          <p className="error-message" role="alert">
            {paymentError}
          </p>
        )}
        <button
          id="payBtn"
          onClick={handleFreeEnroll}
          disabled={isPaying}
        >
          {isPaying ? 'Processing...' : 'Enroll now'}
        </button>
      </section>
    );
  }

  return (
    <section className="checkout-section">
      <h2>Checkout</h2>
      <div id="courseInfo">
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <p>
          <strong>Price:</strong> INR {course.price}
        </p>
      </div>

      {paymentError && (
        <p className="error-message" role="alert">
          {paymentError}
        </p>
      )}

      <button
        id="payBtn"
        onClick={handlePay}
        disabled={!isScriptReady || isPaying}
      >
        {isPaying ? 'Processing...' : 'Pay with Razorpay'}
      </button>
    </section>
  );
};

export default Checkout;
