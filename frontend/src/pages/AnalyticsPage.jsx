import React from 'react';

function AnalyticsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="title-with-emoji">
          <span className="emoji-icon">📊</span>
          <span className="bg-text">Analytics</span>
        </h1>
      </div>
      
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2>Usage Statistics</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '1rem' }}>
          Detailed analytics and insights about your notes and productivity will appear here.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
          <div className="stat-placeholder">
            <h3>📈 Growth</h3>
            <p>Coming soon...</p>
          </div>
          <div className="stat-placeholder">
            <h3>📅 Activity</h3>
            <p>Coming soon...</p>
          </div>
          <div className="stat-placeholder">
            <h3>🎯 Goals</h3>
            <p>Coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;