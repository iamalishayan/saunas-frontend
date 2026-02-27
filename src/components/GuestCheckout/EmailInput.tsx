import React, { useState } from 'react';
import './GuestCheckout.css';

interface EmailInputProps {
  onEmailSubmit: (email: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const EmailInput: React.FC<EmailInputProps> = ({ onEmailSubmit, isLoading, error }) => {
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setLocalError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setLocalError('Please enter a valid email address');
      return false;
    }
    setLocalError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateEmail(email)) {
      await onEmailSubmit(email);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (localError) {
      setLocalError('');
    }
  };

  return (
    <div className="guest-checkout-step">
      <div className="guest-checkout-header">
        <div className="step-badge">Step 1 of 2</div>
        <h2>Enter Your Email</h2>
        <p>We'll send you a verification code to complete your booking</p>
      </div>

      <form onSubmit={handleSubmit} className="guest-checkout-form">
        <div className="form-group">
          <label htmlFor="guest-email">Email Address</label>
          <input
            type="email"
            id="guest-email"
            name="email"
            value={email}
            onChange={handleChange}
            placeholder="your.email@example.com"
            className={localError || error ? 'error' : ''}
            disabled={isLoading}
            autoFocus
          />
          {localError && <span className="error-message">{localError}</span>}
          {error && <span className="error-message">{error}</span>}
        </div>

        <button 
          type="submit" 
          className="btn btn-primary btn-large"
          disabled={isLoading || !email}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Sending Code...
            </>
          ) : (
            'Send Verification Code'
          )}
        </button>

        <div className="guest-checkout-info">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <p>No account needed! We'll just verify your email to complete the booking.</p>
        </div>
      </form>
    </div>
  );
};

export default EmailInput;
