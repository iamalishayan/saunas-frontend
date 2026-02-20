import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../services/api';
import './VerifyEmail.css';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('');
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');

  useEffect(() => {
    const verify = async () => {
      console.log('🔍 Starting email verification...');
      console.log('Token:', token);
      
      if (!token) {
        console.error('❌ No token provided');
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        console.log('📡 Calling verifyEmail API...');
        const response = await verifyEmail(token);
        console.log('✅ Verification successful:', response);
        setStatus('success');
        setMessage(response.message);
        setVerifiedEmail(response.email);
      } catch (error: any) {
        console.error('❌ Verification failed:', error);
        console.error('Error details:', error.response?.data || error.message);
        setStatus('error');
        setMessage(error.message || 'Email verification failed. The link may be invalid or expired.');
      }
    };

    verify();
  }, [token]);

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="verify-email-page">
      <div className="verify-email-container">
        {status === 'verifying' && (
          <div className="verify-status verify-loading">
            <div className="verify-spinner"></div>
            <h2>Verifying Your Email...</h2>
            <p>Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="verify-status verify-success">
            <div className="verify-icon success-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#155724" strokeWidth="2" fill="#d4edda"/>
                <path d="M8 12l2 2 4-4" stroke="#155724" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>Email Verified Successfully!</h2>
            <p className="verify-message">{message}</p>
            {verifiedEmail && (
              <p className="verified-email">✓ {verifiedEmail}</p>
            )}
            <button className="verify-login-btn" onClick={handleLoginRedirect}>
              Proceed to Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="verify-status verify-error">
            <div className="verify-icon error-icon">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#721c24" strokeWidth="2" fill="#f8d7da"/>
                <path d="M8 8l8 8M16 8l-8 8" stroke="#721c24" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h2>Verification Failed</h2>
            <p className="verify-message">{message}</p>
            
            {message.includes('already verified') ? (
              <div className="verify-actions">
                <button className="verify-login-btn" onClick={handleLoginRedirect}>
                  Go to Login
                </button>
              </div>
            ) : (
              <div className="verify-actions">
                <button className="verify-retry-btn" onClick={() => navigate('/register')}>
                  Register Again
                </button>
                <button className="verify-support-btn" onClick={() => navigate('/contact')}>
                  Contact Support
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
