import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VerifyPage from './pages/VerifyPage';
import './App.css';

function App() {
  const token = localStorage.getItem('accessToken');
  const navigate = useNavigate();

  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
    window.location.reload();
  };

  return (
    <>
      <nav>
        <div className="nav-links">
          <Link to="/">Home</Link>
          {!token && <Link to="/login"> Login</Link>}
          {!token && <Link to="/register"> Register</Link>}
          {token && <button onClick={handleLogout}>Logout</button>}
        </div>
        <button onClick={toggleTheme}>
          {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
        </button>
      </nav>

      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/" element={token ? <DashboardPage /> : <HomePage />} />
      </Routes>
    </>
  );
}

const HomePage = () => (
  <div className="container">
    <h2>Welcome to ForeSky 🌌</h2>
    <p>Please register or log in to continue.</p>
  </div>
);

export default App;