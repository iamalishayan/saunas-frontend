import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__content">
          {/* Brand & Description */}
          <div className="footer__brand">
            <h3>Sauna Boat Co.</h3>
            <p>
              Experience the ultimate relaxation with our unique floating sauna 
              adventures and mobile sauna rentals. Creating unforgettable wellness 
              experiences on and off the water.
            </p>
            <div className="footer__social">
              <a href="#" aria-label="Facebook" className="footer__social-link">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" aria-label="Instagram" className="footer__social-link">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.017 0C8.396 0 7.989.013 7.041.048 6.094.082 5.52.204 5.015.38a6.015 6.015 0 00-2.174 1.413A6.015 6.015 0 00.38 4.367C.204 4.872.082 5.446.048 6.393.013 7.341 0 7.748 0 11.369s.013 4.028.048 4.976c.034.947.156 1.521.332 2.026a6.015 6.015 0 001.413 2.174 6.015 6.015 0 002.174 1.413c.505.176 1.079.298 2.026.332.948.035 1.355.048 4.976.048s4.028-.013 4.976-.048c.947-.034 1.521-.156 2.026-.332a6.015 6.015 0 002.174-1.413 6.015 6.015 0 001.413-2.174c.176-.505.298-1.079.332-2.026.035-.948.048-1.355.048-4.976s-.013-4.028-.048-4.976c-.034-.947-.156-1.521-.332-2.026a6.015 6.015 0 00-1.413-2.174A6.015 6.015 0 0019.633.38c-.505-.176-1.079-.298-2.026-.332C16.659.013 16.252 0 12.631 0h-.614zm-.081 1.802h.468c3.456 0 3.81.014 4.704.045.847.038 1.417.174 1.75.29.44.17.75.374 1.078.702.328.328.532.638.702 1.078.116.333.252.903.29 1.75.031.894.045 1.248.045 4.704s-.014 3.81-.045 4.704c-.038.847-.174 1.417-.29 1.75-.17.44-.374.75-.702 1.078-.328.328-.638.532-1.078.702-.333.116-.903.252-1.75.29-.894.031-1.248.045-4.704.045s-3.81-.014-4.704-.045c-.847-.038-1.417-.174-1.75-.29a2.909 2.909 0 01-1.078-.702 2.909 2.909 0 01-.702-1.078c-.116-.333-.252-.903-.29-1.75-.031-.894-.045-1.248-.045-4.704s.014-3.81.045-4.704c.038-.847.174-1.417.29-1.75.17-.44.374-.75.702-1.078a2.909 2.909 0 011.078-.702c.333-.116.903-.252 1.75-.29.784-.036 1.087-.045 3.626-.045zm-.901 3.113a4.905 4.905 0 100 9.81 4.905 4.905 0 000-9.81zm0 8.094a3.189 3.189 0 110-6.378 3.189 3.189 0 010 6.378zm6.25-8.27a1.146 1.146 0 11-2.292 0 1.146 1.146 0 012.292 0z"/>
                </svg>
              </a>
              <a href="#" aria-label="Twitter" className="footer__social-link">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer__links">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/services">Our Services</Link></li>
              <li><Link to="/booking">Book Now</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div className="footer__services">
            <h4>Services</h4>
            <ul>
              <li><a href="#boat-sauna">Floating Sauna Trips</a></li>
              <li><a href="#mobile-sauna">Mobile Sauna Rentals</a></li>
              <li><a href="#group-bookings">Group Charters</a></li>
              <li><a href="#private-events">Private Events</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer__contact">
            <h4>Get in Touch</h4>
            <div className="footer__contact-info">
              <div className="footer__contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                <span>(555) 123-4567</span>
              </div>
              <div className="footer__contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                <span>hello@saunaboatco.com</span>
              </div>
              <div className="footer__contact-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span>Vancouver Island, BC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer__bottom">
          <div className="footer__bottom-content">
            <p>&copy; {currentYear} Sauna Boat Co. All rights reserved.</p>
            <div className="footer__legal">
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;