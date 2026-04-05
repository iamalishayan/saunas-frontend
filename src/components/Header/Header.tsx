import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

interface HeaderProps {
  onSidebarToggle: () => void;
  isSidebarOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onSidebarToggle, isSidebarOpen = false }) => {
  useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cream logo on dark backgrounds: home page hero or scrolled (dark green) header
  // Dark green logo only on light sticky header (non-home, not yet scrolled)
  const logoSrc = (isHomePage || isScrolled)
    ? '/logos/logo-dark-green.png'
    : '/logos/logo-dark-green.png';

  const logoAlt = 'Victoria Sauna Rentals';

  return (
    <header className={`header ${isHomePage ? 'header--with-background' : ''} ${!isHomePage && isScrolled ? 'header--scrolled' : ''}`}>
      <div className="container">
        <div className="header__content">
          {/* Sidebar Toggle Button */}
          <button 
            className={`header__sidebar-toggle ${isSidebarOpen ? 'header__sidebar-toggle--active' : ''}`}
            onClick={onSidebarToggle}
            aria-label="Toggle sidebar menu"
          >
            <span className="hamburger">
              <span className="hamburger__line"></span>
              <span className="hamburger__line"></span>
              <span className="hamburger__line"></span>
            </span>
          </button>

          {/* Centered Logo */}
          <div className="header__brand">
            <Link to="/" className="header__logo" aria-label={logoAlt}>
              <img
                src={logoSrc}
                alt={logoAlt}
                className="header__logo-img"
              />
            </Link>
          </div>

          {/* Desktop CTA Buttons */}
          <div className="header__cta">
            <Link to="/booking" className="btn btn-primary">
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;