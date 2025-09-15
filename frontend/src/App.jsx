import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import VerifyPage from './pages/VerifyPage';
import ParticleBackground from './components/ParticleBackground';
import Sidebar from './components/Sidebar';
import './App.css';

function App() {
  const token = localStorage.getItem('accessToken');
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  // Check if we should show sidebar (only for authenticated routes)
  const showSidebar = token && !['/login', '/register', '/verify'].includes(location.pathname);

  return (
    <>
      <ParticleBackground />
      <nav>
        <div className="nav-content">
          <Link className="logo" to={token ? "/home" : "/"}>
            <span className="gradient-text">ForeSky ✨</span>
          </Link>
          <div className="nav-links">
            {!token && location.pathname !== '/login' && <Link to="/login">Login</Link>}
            {!token && location.pathname !== '/register' && <Link to="/register">Register</Link>}
            {token && <button className="logout" onClick={handleLogout}>Logout</button>}
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </div>
      </nav>

      {showSidebar && <Sidebar />}
      
      <div className={showSidebar ? `main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}` : ''}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/" element={token ? <HomePage /> : <LandingPage />} />
          <Route path="/home" element={token ? <HomePage /> : <LoginPage />} />
          <Route path="/notes" element={token ? <DashboardPage /> : <LoginPage />} />
          <Route path="/analytics" element={token ? <AnalyticsPage /> : <LoginPage />} />
          <Route path="/profile" element={token ? <ProfilePage /> : <LoginPage />} />
          <Route path="/settings" element={token ? <SettingsPage /> : <LoginPage />} />
        </Routes>
      </div>
    </>
  );
}

const LandingPage = () => (
  <div className="app-container">
    <div className="glass-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>
        <span className="bg-text">Welcome to ForeSky</span>
        <span className="emoji-icon" style={{ fontSize: '3rem', marginLeft: '1rem' }}>🌌</span>
      </h1>
      <p style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
        Your personal space for thoughts, ideas, and inspiration
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link to="/register" style={{ textDecoration: 'none' }}>
          <button style={{ padding: '1rem 2.5rem' }}>Get Started</button>
        </Link>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <button className="secondary" style={{ padding: '1rem 2.5rem' }}>Sign In</button>
        </Link>
      </div>
    </div>
  </div>
);

export default App;