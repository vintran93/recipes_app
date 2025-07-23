import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Helper function to get CSRF token from cookies
const getCSRFTokenFromCookie = () => {
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
  return cookieValue;
};

// Helper function to ensure CSRF token is available
const ensureCSRFToken = async (apiBaseUrl) => {
  let token = getCSRFTokenFromCookie();
  
  if (!token) {
    try {
      await axios.get(`${apiBaseUrl}/csrf/`);
      token = getCSRFTokenFromCookie();
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
    }
  }
  
  if (token) {
    axios.defaults.headers.common['X-CSRFToken'] = token;
  }
  
  return token;
};

function PasswordReset({ apiBaseUrl }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);
    setIsSubmitting(true);

    if (!email.trim()) {
      setMessage('Please enter your email address.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Ensure CSRF token is available
      await ensureCSRFToken(apiBaseUrl);

      const response = await axios.post(`${apiBaseUrl}/users/password-reset-request/`, {
        email: email.trim()
      });

      setMessage(response.data.message || 'If an account with that email exists, a password reset link has been sent.');
      setIsSuccess(true);
      setEmail('');

    } catch (error) {
      console.error("Password reset request error:", error.response?.data || error);
      const errorData = error.response?.data;
      if (errorData) {
        const errorMessages = Object.values(errorData).flat().join(' ');
        setMessage(errorMessages || 'Failed to send password reset email.');
      } else {
        setMessage('Failed to send password reset email. Please try again.');
      }
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="App">
      <h1>Reset Password</h1>
      <p>Enter your email address and we'll send you a link to reset your password.</p>
      
      {message && (
        <p className={isSuccess ? 'success-message' : 'error-message'}>
          {message}
        </p>
      )}

      <form onSubmit={handlePasswordResetRequest}>
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubmitting}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>

      <p>
        Remember your password? <Link to="/login">Login here</Link>
      </p>
      <p>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
}

export default PasswordReset;