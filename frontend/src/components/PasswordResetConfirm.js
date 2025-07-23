import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

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

function PasswordResetConfirm({ apiBaseUrl }) {
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { uidb64, token } = useParams(); // Get from URL parameters
  const navigate = useNavigate();

  const handlePasswordResetConfirm = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);
    setIsSubmitting(true);

    // Basic validation
    if (!newPassword.trim() || !newPassword2.trim()) {
      setMessage('Please fill in both password fields.');
      setIsSubmitting(false);
      return;
    }

    if (newPassword !== newPassword2) {
      setMessage('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Ensure CSRF token is available
      await ensureCSRFToken(apiBaseUrl);

      const response = await axios.post(`${apiBaseUrl}/users/password-reset-confirm/`, {
        uidb64: uidb64,
        token: token,
        new_password: newPassword,
        new_password2: newPassword2
      });

      setMessage(response.data.message || 'Password has been reset successfully. You can now log in with your new password.');
      setIsSuccess(true);
      setNewPassword('');
      setNewPassword2('');

      // Redirect to login after a few seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      console.error("Password reset confirm error:", error.response?.data || error);
      const errorData = error.response?.data;
      if (errorData) {
        const errorMessages = Object.values(errorData).flat().join(' ');
        setMessage(errorMessages || 'Failed to reset password.');
      } else {
        setMessage('Failed to reset password. The link may be invalid or expired.');
      }
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="App">
      <h1>Set New Password</h1>
      <p>Enter your new password below.</p>
      
      {message && (
        <p className={isSuccess ? 'success-message' : 'error-message'}>
          {message}
        </p>
      )}

      {!isSuccess && (
        <form onSubmit={handlePasswordResetConfirm}>
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={newPassword2}
            onChange={(e) => setNewPassword2(e.target.value)}
            required
            disabled={isSubmitting}
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}

      {isSuccess && (
        <p>
          <Link to="/login">Click here to login now</Link>
        </p>
      )}
    </div>
  );
}

export default PasswordResetConfirm;