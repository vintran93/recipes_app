import React from 'react';
import { Link } from 'react-router-dom';

function Dashboard({ username, onLogout }) {
  return (
    <div className="App">
      <h1>Welcome to Your Dashboard, {username}!</h1>
      <div className="dashboard-content">
        <p>This is your main application dashboard. You can add more features and links here.</p>
        <p>Explore your options:</p>
        <nav>
          <Link to="/settings">Account Settings</Link>
          <button onClick={onLogout}>Logout</button>
        </nav>
      </div>
    </div>
  );
}

export default Dashboard;