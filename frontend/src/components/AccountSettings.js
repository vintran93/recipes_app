import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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

function AccountSettings({ apiBaseUrl, onLogout }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [username, setUsername] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch current user details on component mount
    const fetchCurrentUser = async () => {
      try {
        // Ensure CSRF token is available
        await ensureCSRFToken(apiBaseUrl);
        
        const response = await axios.get(`${apiBaseUrl}/users/me/`);
        setUsername(response.data.username);
      } catch (error) {
        console.error("Error fetching current user:", error.response?.data || error);
        setMessage('Failed to load user data.');
        if (error.response?.status === 401 || error.response?.status === 403) {
          onLogout(); // Force logout if session is invalid or forbidden
        }
      }
    };
    fetchCurrentUser();
  }, [apiBaseUrl, onLogout]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    // Basic validation
    if (!oldPassword.trim() || !newPassword.trim() || !newPassword2.trim()) {
      setMessage('Please fill in all password fields.');
      return;
    }

    if (newPassword !== newPassword2) {
      setMessage('New passwords do not match.');
      return;
    }

    try {
      // Ensure CSRF token is fresh
      await ensureCSRFToken(apiBaseUrl);
      
      const response = await axios.post(`${apiBaseUrl}/users/change-password/`, {
        old_password: oldPassword,
        new_password: newPassword,
        new_password2: newPassword2,
      });
      
      setMessage('Password changed successfully. You have been logged out. Please log in again.');
      setIsSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setNewPassword2('');
      
      // Wait a moment then logout
      setTimeout(() => {
        onLogout();
      }, 2000);

    } catch (error) {
      console.error("Change password error:", error.response?.data || error);
      const errorData = error.response?.data;
      if (errorData) {
        const errorMessages = Object.values(errorData).flat().join(' ');
        setMessage(errorMessages || 'Failed to change password.');
      } else {
        setMessage('Failed to change password. Please try again.');
      }
      setIsSuccess(false);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      // Ensure CSRF token is available before logout
      await ensureCSRFToken(apiBaseUrl);
      onLogout();
    } catch (error) {
      console.error("Error preparing logout:", error);
      // Still try to logout even if CSRF token fetch fails
      onLogout();
    }
  };

  return (
    <div className="App">
      <h1>Account Settings for {username}</h1>
      {message && (
        <p className={isSuccess ? 'success-message' : 'error-message'}>
          {message}
        </p>
      )}

      <h2>Change Password</h2>
      <form onSubmit={handleChangePassword}>
        <input
          type="password"
          placeholder="Old Password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={newPassword2}
          onChange={(e) => setNewPassword2(e.target.value)}
          required
        />
        <button type="submit">Change Password</button>
      </form>

      <hr />
      <button onClick={handleBackToDashboard} className="back-button">
        Back to Dashboard
      </button>
      <button onClick={handleLogout} className="logout-button">
        Logout
      </button>
    </div>
  );
}

export default AccountSettings;