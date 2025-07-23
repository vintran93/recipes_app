import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Login({ apiBaseUrl, onLoginSuccess, message: propMessage }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(propMessage || '');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (propMessage) {
      setMessage(propMessage);
      setIsSuccess(false);
    }
  }, [propMessage]);

  // Function to get CSRF token from cookies
  const getCSRFToken = () => {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    return cookieValue;
  };

  // Fetch CSRF token before login if not present
  const ensureCSRFToken = async () => {
    if (!getCSRFToken()) {
      try {
        await axios.get(`${apiBaseUrl}/csrf/`, { withCredentials: true });
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);

    console.log('Login form data:', { username, password: '***' });

    try {
      // Ensure we have a CSRF token
      await ensureCSRFToken();

      const response = await axios.post(
        `${apiBaseUrl}/users/login/`,
        { 
          username: username.trim(), 
          password: password 
        }
      );
      
      localStorage.setItem('username', response.data.username);
      
      setMessage(response.data.message || 'Login successful!');
      setIsSuccess(true);
      setUsername('');
      setPassword('');
      
      // Call the success callback provided by App.js
      onLoginSuccess(response.data.username);

    } catch (error) {
      console.error("Login error:", error.response?.data || error);
      const errorData = error.response?.data;
      if (errorData) {
        const errorMessages = Object.values(errorData).flat().join(' ');
        setMessage(errorMessages || 'Login failed. Please check your credentials.');
      } else {
        setMessage('Login failed. Please try again.');
      }
      setIsSuccess(false);
    }
  };

  return (
    <div className="App">
      <h1>Login</h1>
      {message && (
        <p className={isSuccess ? 'success-message' : 'error-message'}>
          {message}
        </p>
      )}
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <p>Don't have an account? <Link to="/register">Register here</Link></p>
      <p><Link to="/forgot-password">Forgot Password?</Link></p>
    </div>
  );
}

export default Login;