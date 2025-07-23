import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Register({ apiBaseUrl, onRegisterSuccess }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState(''); // For password confirmation
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages
    setIsSuccess(false);

    if (password !== password2) {
      setMessage('Passwords do not match.');
      return;
    }

    try {
      const response = await axios.post(`${apiBaseUrl}/users/register/`, {
        username,
        email,
        password,
        password2, // Send password2 for backend validation
      });
      
      // Assuming backend automatically logs in after successful registration
      // The backend should return the access token and username upon successful registration/login
      // Note: For session-based auth, you don't explicitly get an 'access' token here.
      // The session cookie is handled automatically by the browser with `withCredentials: true`.
      // We store username for display purposes.
      localStorage.setItem('username', response.data.username);
      
      setMessage(response.data.message || 'Registration successful!');
      setIsSuccess(true);
      setUsername('');
      setEmail('');
      setPassword('');
      setPassword2('');
      
      // Call the success callback provided by App.js
      onRegisterSuccess(response.data.username);

    } catch (error) {
      console.error("Registration error:", error.response?.data || error);
      const errorData = error.response?.data;
      if (errorData) {
        // Concatenate all error messages from the backend
        const errorMessages = Object.values(errorData).flat().join(' ');
        setMessage(errorMessages || 'Registration failed. Please try again.');
      } else {
        setMessage('Registration failed. Please try again.');
      }
      setIsSuccess(false);
    }
  };

  return (
    <div className="App">
      <h1>Register Account</h1>
      {message && (
        <p className={isSuccess ? 'success-message' : 'error-message'}>
          {message}
        </p>
      )}
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
        />
        <button type="submit">Register</button>
      </form>
      <p>Already have an account? <Link to="/login">Login here</Link></p>
    </div>
  );
}

export default Register;
