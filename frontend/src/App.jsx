import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import VerifyPage from "./pages/VerifyPage";

// Inside <Routes>...</Routes>:

function App() {
  const token = localStorage.getItem('accessToken');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/login');
    window.location.reload(); // Force a refresh to update UI
  };

  return (
    <div>
      <nav>
        <Link to="/">Home</Link> | 
        {!token && <Link to="/login"> Login</Link>} | 
        {!token && <Link to="/register"> Register</Link>}
        {token && <button onClick={handleLogout}>Logout</button>}
      </nav>
      <hr />
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={token ? <DashboardPage /> : <HomePage />} />
        <Route path="/verify" element={<VerifyPage />} />
      </Routes>
    </div>
  );
}

const HomePage = () => <h2>Welcome! Please log in or register.</h2>;

export default App;