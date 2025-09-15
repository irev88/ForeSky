import React from 'react';

function SettingsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="title-with-emoji">
          <span className="emoji-icon">⚙️</span>
          <span className="bg-text">Settings</span>
        </h1>
      </div>
      
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2>Preferences</h2>
        <div style={{ marginTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>🎨 Appearance</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Theme settings are available in the top navigation bar
          </p>
        </div>
        
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>🔔 Notifications</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Notification preferences coming soon...
          </p>
        </div>
        
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>🔐 Security</h3>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Security settings coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;