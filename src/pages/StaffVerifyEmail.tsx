import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyStaffEmail } from '../services/api';
import './VerifyEmail.css';

const StaffVerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('');
  const [staffName, setStaffName] = useState<string>('');
  const [staffEmail, setStaffEmail] = useState<string>('');

  useEffect(() => {
    const verify = async () => {
      console.log('🔍 Starting staff email verification...');
      console.log('Token:', token);
      
      if (!token) {
        console.error('❌ No token provided');
        setStatus('error');
        setMessage('Invalid verification link. No token provided.');
        return;
      }

      try {
        console.log('📡 Calling verifyStaffEmail API...');
        const response = await verifyStaffEmail(token);
        console.log('✅ Staff verification successful:', response);
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');
        setStaffName(response.staff?.name || '');
        setStaffEmail(response.staff?.email || '');
      } catch (error: any) {
        console.error('❌ Staff verification failed:', error);
        console.error('Error details:', error.response?.data || error.message);
        setStatus('error');
        setMessage(error.message || 'Email verification failed. The link may be invalid or expired.');
      }
    };

    verify();
  }, [token]);

  const handleHomeRedirect = () => {
    navigate('/');
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
            {staffName && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <p style={{ margin: '0', fontSize: '1rem', color: '#333' }}>
                  <strong>Name:</strong> {staffName}
                </p>
                {staffEmail && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '1rem', color: '#333' }}>
                    <strong>Email:</strong> {staffEmail}
                  </p>
                )}
              </div>
            )}
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px' }}>
              <p style={{ margin: '0', fontSize: '0.95rem', color: '#856404' }}>
                ✉️ <strong>You're all set!</strong> You'll receive notification emails when you're assigned to bookings.
              </p>
            </div>
            <button className="verify-login-btn" onClick={handleHomeRedirect}>
              Return to Homepage
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
            
            <div className="verify-actions">
              <button className="verify-support-btn" onClick={() => navigate('/contact')}>
                Contact Support
              </button>
              <button className="verify-login-btn" onClick={handleHomeRedirect}>
                Go to Homepage
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffVerifyEmail;
