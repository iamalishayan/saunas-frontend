import React, { useState, useRef, useEffect } from 'react';
import './GuestCheckout.css';

interface OTPVerificationProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ 
  email, 
  onVerify, 
  onResend, 
  onBack,
  isLoading, 
  error 
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCountdown]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle paste
    if (e.key === 'v' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('');
        const newCode = [...code];
        digits.forEach((digit, i) => {
          if (i < 6) {
            newCode[i] = digit;
          }
        });
        setCode(newCode);
        // Focus last filled input or first empty
        const nextIndex = Math.min(digits.length, 5);
        inputRefs.current[nextIndex]?.focus();
      });
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');
    const newCode = [...code];
    digits.forEach((digit, i) => {
      if (i < 6) {
        newCode[i] = digit;
      }
    });
    setCode(newCode);
    // Focus last filled input or submit if complete
    if (digits.length === 6) {
      inputRefs.current[5]?.focus();
    } else {
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      await onVerify(fullCode);
    }
  };

  const handleResendClick = async () => {
    if (canResend && !isLoading) {
      setResendMessage('');
      await onResend();
      setResendCountdown(60);
      setCanResend(false);
      setResendMessage('✓ New code sent! Check your email.');
      setTimeout(() => setResendMessage(''), 5000);
    }
  };

  const isCodeComplete = code.every(digit => digit !== '');

  return (
    <div className="guest-checkout-step">
      <div className="guest-checkout-header">
        <div className="step-badge">Step 2 of 2</div>
        <h2>Verify Your Email</h2>
        <p>We sent a 6-digit code to</p>
        <p className="email-display">
          <strong>{email}</strong>
          <button 
            type="button" 
            onClick={onBack} 
            className="change-email-btn"
            disabled={isLoading}
          >
            Change
          </button>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="guest-checkout-form otp-form">
        <div className="otp-input-group">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`otp-input ${error ? 'error' : ''}`}
              disabled={isLoading}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {error && (
          <div className="error-message error-box">
            {error}
          </div>
        )}

        {resendMessage && (
          <div className="success-message">
            {resendMessage}
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary btn-large"
          disabled={isLoading || !isCodeComplete}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Verifying...
            </>
          ) : (
            'Verify & Continue'
          )}
        </button>

        <div className="otp-resend">
          {canResend ? (
            <button 
              type="button" 
              onClick={handleResendClick}
              className="btn-link"
              disabled={isLoading}
            >
              Resend Code
            </button>
          ) : (
            <span className="resend-timer">
              Resend code in {resendCountdown}s
            </span>
          )}
        </div>

        <div className="guest-checkout-info">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          <p>This code expires in 5 minutes. Check your spam folder if you don't see it.</p>
        </div>
      </form>
    </div>
  );
};

export default OTPVerification;
