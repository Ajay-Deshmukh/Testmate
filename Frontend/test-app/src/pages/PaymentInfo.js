import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './PaymentInfo.css';

const PaymentInfo = () => {
  const navigate = useNavigate();
  const { testId } = useParams();
  const paymentAmount = 100; // Amount in INR

  const handleBuyNow = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_id: testId,
          user_id: localStorage.getItem('user_id'),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.orderId) {
        initiateRazorpayPayment(data.orderId, data.amount, data.currency);
      } else {
        console.error('Failed to create payment order:', data.message);
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('An error occurred while initiating the payment. Please try again later.');
    }
  };

  const initiateRazorpayPayment = (orderId, amount, currency) => {
    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY || '', // Use an environment variable for Razorpay key
      amount: amount,
      currency: currency,
      name: 'GATE Test Payment',
      description: 'One-time payment for full access to the GATE platform',
      order_id: orderId,
      handler: function (response) {
        // Handle successful payment
        handlePaymentSuccess(response);
      },
      theme: {
        color: '#3399cc',
      },
      modal: {
        ondismiss: function () {
          alert('Payment was cancelled. Please try again.');
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handlePaymentSuccess = async (response) => {
    try {
      const verificationResponse = await fetch('http://localhost:8000/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: localStorage.getItem('user_id'),
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      const result = await verificationResponse.json();
      if (result.success) {
        navigate(`/test/${testId}`); // Redirect to Test Interface after payment
      } else {
        console.error('Payment verification failed:', result.message);
        alert('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      alert('Error verifying payment. Please try again later.');
    }
  };

  return (
    <div className="payment-info">
      <h1>Complete Your Payment</h1>
      <p>
        Unlock full access to our GATE platform with a one-time payment. By completing this payment, you'll gain access to all the tests, previous year questions, and other valuable resources available on our platform. This is a lifetime subscription with no recurring charges!
      </p>
      <p><strong>Payment Amount:</strong> ₹1000 </p>  
      <button onClick={handleBuyNow} className="buy-now-button">Buy Now</button>
    </div>
  );
};

export default PaymentInfo;
