import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';

function LoginPage({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const loginData = new FormData();
    loginData.append('username', formData.email);
    loginData.append('password', formData.password);

    try {
      const response = await apiClient.post('/auth/login', loginData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      localStorage.setItem('accessToken', response.data.access_token);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container glass-card">
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <span style={{ marginRight: '8px', fontSize: '1.2em' }}>🌌</span>
        <span className="gradient-text">Welcome Back</span>
      </h2>
      
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
            autoFocus
          />
        </div>
        
        <div className="form-group">
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="loading"></span> : 'Sign In'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--color-text-muted)' }}>
        Don't have an account? <a href="/register" style={{ color: 'var(--color-primary)' }}>Sign up</a>
      </p>
    </div>
  );
}

export default LoginPage;