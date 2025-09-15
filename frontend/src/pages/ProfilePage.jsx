import React, { useState, useEffect } from 'react';
import apiClient from '../api';

function ProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await apiClient.get('/users/me/');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="title-with-emoji">
          <span className="emoji-icon">👤</span>
          <span className="bg-text">Profile</span>
        </h1>
      </div>
      
      <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px' }}>
        <h2>Account Information</h2>
        {user && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Email</label>
              <p style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>{user.email}</p>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Account Status</label>
              <p style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>
                {user.is_verified ? '✅ Verified' : '⚠️ Not Verified'}
              </p>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Member Since</label>
              <p style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>
      
      <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px', marginTop: '2rem' }}>
        <h2>Settings</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>
          Profile customization options coming soon...
        </p>
      </div>
    </div>
  );
}

export default ProfilePage;