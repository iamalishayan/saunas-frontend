import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, logout } = useAuth();

  // Debug: Log when sidebar state changes
  React.useEffect(() => {
    console.log('Sidebar isOpen:', isOpen);
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--active' : ''}`}
        onClick={onClose}
        role="button"
        tabIndex={-1}
        aria-label="Close sidebar"
      />
      
      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'sidebar--open' : ''}`} role="navigation">
        <div className="sidebar__header">
          <h3>Navigation</h3>
          <button 
            className="sidebar__close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        <nav className="sidebar__nav">
          <ul className="sidebar__nav-list">
            <li>
              <Link to="/" className="sidebar__nav-link" onClick={onClose}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>
                <span>Home</span>
              </Link>
              <span className="tooltip">Home</span>
            </li>
            <li>
              <Link to="/services" className="sidebar__nav-link" onClick={onClose}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>Services</span>
              </Link>
              <span className="tooltip">Services</span>
            </li>
            <li>
              <Link to="/booking" className="sidebar__nav-link" onClick={onClose}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                </svg>
                <span>Book Now</span>
              </Link>
              <span className="tooltip">Book Now</span>
            </li>
            <li>
              <Link to="/contact" className="sidebar__nav-link" onClick={onClose}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span>Contact</span>
              </Link>
              <span className="tooltip">Contact</span>
            </li>
            <li>
              <Link to="/about" className="sidebar__nav-link" onClick={onClose}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
                <span>About Us</span>
              </Link>
              <span className="tooltip">About Us</span>
            </li>
          </ul>

          {/* User Account Section */}
          {isAuthenticated && (
            <>
              <div className="sidebar__divider"></div>
              <div className="sidebar__section-title">Account</div>
              <ul className="sidebar__nav-list">
                <li>
                  <Link to="/my-bookings" className="sidebar__nav-link" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                    </svg>
                    <span>My Bookings</span>
                  </Link>
                  <span className="tooltip">My Bookings</span>
                </li>
                {user?.role === 'admin' && (
                  <li>
                    <Link to="/admin" className="sidebar__nav-link sidebar__nav-link--admin" onClick={onClose}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                      <span>Admin Dashboard</span>
                    </Link>
                    <span className="tooltip">Admin Dashboard</span>
                  </li>
                )}
                <li>
                  <button className="sidebar__nav-link sidebar__nav-link--logout" onClick={handleLogout}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                    </svg>
                    <span>Logout</span>
                  </button>
                  <span className="tooltip">Logout</span>
                </li>
              </ul>
            </>
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
