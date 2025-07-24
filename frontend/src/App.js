import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

// Import your components
import Register from './components/Register';
import Login from './components/Login';
import AccountSettings from './components/AccountSettings';
import Dashboard from './components/Dashboard';
import CreateRecipe from './components/CreateRecipe';
import RecipeDetail from './components/RecipeDetail';
import EditRecipe from './components/EditRecipe';
import PasswordResetConfirm from './components/PasswordResetConfirm';
import PasswordReset from './components/PasswordReset';

import './App.css';

const API_BASE_URL = "http://localhost:8000/api";

// Configure axios defaults globally - This is crucial for CSRF handling
axios.defaults.withCredentials = true;
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

// Helper function to get CSRF token from cookies
const getCSRFTokenFromCookie = () => {
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
  return cookieValue;
};

// Helper function to ensure CSRF token is available
const ensureCSRFToken = async () => {
  let token = getCSRFTokenFromCookie();
  
  if (!token) {
    try {
      // Make a GET request to a Django endpoint that sets the csrftoken cookie
      // The /api/csrf/ endpoint is ideal for this.
      await axios.get(`${API_BASE_URL}/csrf/`);
      token = getCSRFTokenFromCookie(); // Try to get it again after the request
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
    }
  }
  
  if (token) {
    // Set the token as a default header for all subsequent requests
    axios.defaults.headers.common['X-CSRFToken'] = token;
  }
  
  return token;
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('');

  const navigate = useNavigate();

  // Check authentication status
  const checkAuthStatus = useCallback(async (showMessage = true) => {
    console.log("Checking authentication status...");
    
    try {
      // Ensure CSRF token is available before any authenticated requests
      await ensureCSRFToken();
      
      // Check if user is authenticated
      const response = await axios.get(`${API_BASE_URL}/users/me/`);
      
      setIsAuthenticated(true);
      setUsername(response.data.username);
      if (showMessage) {
        setGlobalMessage('');
      }
      
      console.log("Auth check successful. User:", response.data.username);
      return true;
      
    } catch (error) {
      console.error("Auth check failed:", error.response?.data || error);
      
      setIsAuthenticated(false);
      setUsername('');
      
      if (showMessage && error.response?.status === 403) {
        setGlobalMessage('Your session has expired. Please log in again.');
      }
      
      console.log("Auth check failed. User not authenticated.");
      return false;
    }
  }, []);

  // Initialize app - get CSRF token and check auth
  useEffect(() => {
    const initializeApp = async () => {
      console.log("Initializing app...");
      
      // Get CSRF token first
      await ensureCSRFToken();
      
      // Then check auth status
      await checkAuthStatus(false); // Don't show message on initial load
      
      setAuthCheckComplete(true);
    };

    initializeApp();
  }, [checkAuthStatus]);

  const handleLoginSuccess = async (userUsername) => {
    console.log("Login successful for user:", userUsername);
    
    try {
      // Refresh CSRF token after login
      await ensureCSRFToken();
      
      // Verify the session is working
      const authCheck = await checkAuthStatus(false);
      
      if (authCheck) {
        setIsAuthenticated(true);
        setUsername(userUsername);
        setGlobalMessage('Login successful!');
        
        // Clear message after a few seconds
        setTimeout(() => setGlobalMessage(''), 3000);
        
        navigate('/dashboard');
      } else {
        console.error("Session verification failed after login");
        setGlobalMessage('Login appeared successful but session verification failed. Please try again.');
        setIsAuthenticated(false);
        setUsername('');
      }
    } catch (error) {
      console.error("Error in login success handler:", error);
      setGlobalMessage('Login verification failed. Please try again.');
      setIsAuthenticated(false);
      setUsername('');
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      
      // Ensure CSRF token is available
      await ensureCSRFToken();
      
      // Send logout request
      await axios.post(`${API_BASE_URL}/users/logout/`);
      
      console.log("Logout request successful");
      
      // Clear local state
      localStorage.removeItem('username');
      setIsAuthenticated(false);
      setUsername('');
      setGlobalMessage('Logged out successfully.');
      
      // Clear message after a few seconds
      setTimeout(() => setGlobalMessage(''), 3000);
      
      navigate('/login');
      
    } catch (error) {
      console.error("Logout error:", error.response?.data || error);
      
      // Even if logout request fails, clear local state
      localStorage.removeItem('username');
      setIsAuthenticated(false);
      setUsername('');
      
      if (error.response?.status === 403) {
        setGlobalMessage('Session already expired. Redirected to login.');
      } else {
        setGlobalMessage('Logout request failed, but you have been logged out locally.');
      }
      
      // Clear message after a few seconds
      setTimeout(() => setGlobalMessage(''), 3000);
      
      navigate('/login');
    }
  };

  // Show loading while checking authentication
  if (!authCheckComplete) {
    return (
      <div className="App">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Loading...</h2>
          <p>Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Global message display */}
      {globalMessage && (
        <div className={`global-message ${globalMessage.includes('successful') ? 'success' : 'error'}`}>
          {globalMessage}
        </div>
      )}
      
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/register" 
          element={<Register apiBaseUrl={API_BASE_URL} onRegisterSuccess={handleLoginSuccess} />} 
        />
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
              <Dashboard username={username} onLogout={handleLogout} /> :
              <Login apiBaseUrl={API_BASE_URL} onLoginSuccess={handleLoginSuccess} />
          } 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? 
              <Dashboard apiBaseUrl={API_BASE_URL} username={username} onLogout={handleLogout} /> : // Pass apiBaseUrl to Dashboard
              <Login 
                apiBaseUrl={API_BASE_URL} 
                onLoginSuccess={handleLoginSuccess} 
                message="Please log in to view the dashboard." 
              />
          } 
        />
        <Route 
          path="/settings" 
          element={
            isAuthenticated ? 
              <AccountSettings apiBaseUrl={API_BASE_URL} onLogout={handleLogout} /> : 
              <Login 
                apiBaseUrl={API_BASE_URL} 
                onLoginSuccess={handleLoginSuccess} 
                message="Please log in to view account settings." 
              />
          } 
        />

        {/* Recipe Routes */}
        <Route
          path="/recipes/new"
          element={
            isAuthenticated ?
              <CreateRecipe apiBaseUrl={API_BASE_URL} /> :
              <Login apiBaseUrl={API_BASE_URL} onLoginSuccess={handleLoginSuccess} message="Please log in to add a recipe." />
          }
        />
        {/* Route for viewing a single recipe */}
        <Route
          path="/recipes/:id"
          element={
            isAuthenticated ?
              <RecipeDetail apiBaseUrl={API_BASE_URL} onLogout={handleLogout} /> : // Pass onLogout to RecipeDetail
              <Login apiBaseUrl={API_BASE_URL} onLoginSuccess={handleLoginSuccess} message="Please log in to view recipe details." />
          }
        />
        {/* Route for editing a recipe */}
        <Route
          path="/recipes/edit/:id"
          element={
            isAuthenticated ?
              <EditRecipe apiBaseUrl={API_BASE_URL} /> :
              <Login apiBaseUrl={API_BASE_URL} onLoginSuccess={handleLoginSuccess} message="Please log in to edit a recipe." />
          }
        />


        {/* Default route */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? 
              <Dashboard apiBaseUrl={API_BASE_URL} username={username} onLogout={handleLogout} /> : // Pass apiBaseUrl to Dashboard
              <Login apiBaseUrl={API_BASE_URL} onLoginSuccess={handleLoginSuccess} />
          } 
        />
        <Route path="/forgot-password" element={<PasswordReset apiBaseUrl={API_BASE_URL} />} />
        <Route path="/reset-password-confirm/:uidb64/:token" element={<PasswordResetConfirm apiBaseUrl={API_BASE_URL} />} />
      </Routes>
    </>
  );
}

export default App;