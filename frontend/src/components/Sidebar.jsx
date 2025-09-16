import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const [activeIndicatorStyle, setActiveIndicatorStyle] = useState({});

  const menuItems = [
    { path: '/home', icon: '🏠', label: 'Home', color: '#667eea' },
    { path: '/notes', icon: '📝', label: 'Notes', color: '#764ba2' },
    { path: '/analytics', icon: '📊', label: 'Analytics', color: '#f093fb' },
    { path: '/profile', icon: '👤', label: 'Profile', color: '#4facfe' },
    { path: '/settings', icon: '⚙️', label: 'Settings', color: '#43e97b' },
  ];

  useEffect(() => {
    // Update active indicator position
    const activeIndex = menuItems.findIndex(item => location.pathname === item.path);
    if (activeIndex !== -1) {
      setActiveIndicatorStyle({
        transform: `translateY(${activeIndex * 60}px)`,
      });
    }
  }, [location.pathname]);

  const handleMouseEnter = () => {
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
  };

  return (
    <div 
      className={`sidebar-modern ${isExpanded ? 'expanded' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="sidebar-indicator" style={activeIndicatorStyle}></div>
      
      <div className="sidebar-content">
        {menuItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            style={{ '--item-delay': `${index * 0.05}s`, '--item-color': item.color }}
          >
            <div className="sidebar-item-indicator"></div>
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="sidebar-item-label">{item.label}</span>
            <div className="sidebar-item-tooltip">{item.label}</div>
          </NavLink>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-pulse"></div>
      </div>
    </div>
  );
}

export default Sidebar;