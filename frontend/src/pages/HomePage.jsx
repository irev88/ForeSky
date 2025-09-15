import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import './HomePage.css';

function HomePage() {
  const [userEmail, setUserEmail] = useState('');
  const [stats, setStats] = useState({ notes_count: 0, tags_count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [userRes, statsRes] = await Promise.all([
        apiClient.get('/users/me/'),
        apiClient.get('/users/me/stats')
      ]);
      setUserEmail(userRes.data.email);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="welcome-section">
        <h1 className="welcome-title">
          <span className="emoji-icon">👋</span>
          <span className="bg-text">Welcome back!</span>
        </h1>
        <p className="user-email">{userEmail}</p>
      </div>

      <div className="quick-stats">
        <div className="stat-card glass-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{stats.notes_count}</h3>
            <p>Total Notes</p>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <h3>{stats.tags_count}</h3>
            <p>Total Tags</p>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <h3>{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</h3>
            <p>Today</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2 className="section-title">
          <span className="emoji-icon">⚡</span>
          Quick Actions
        </h2>
        <div className="action-grid">
          <a href="/notes" className="action-card glass-card">
            <span className="action-icon">📝</span>
            <span className="action-text">Create Note</span>
          </a>
          <a href="/notes" className="action-card glass-card">
            <span className="action-icon">📚</span>
            <span className="action-text">View Notes</span>
          </a>
          <a href="/analytics" className="action-card glass-card">
            <span className="action-icon">📊</span>
            <span className="action-text">Analytics</span>
          </a>
          <a href="/profile" className="action-card glass-card">
            <span className="action-icon">👤</span>
            <span className="action-text">Profile</span>
          </a>
        </div>
      </div>

      <div className="recent-activity">
        <h2 className="section-title">
          <span className="emoji-icon">🕐</span>
          Recent Activity
        </h2>
        <div className="activity-list glass-card">
          <p className="placeholder-text">Your recent activities will appear here</p>
        </div>
      </div>
    </div>
  );
}

export default HomePage;