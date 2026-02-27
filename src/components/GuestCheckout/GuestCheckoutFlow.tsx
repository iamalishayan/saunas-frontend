import React, { useState } from 'react';
import EmailInput from './EmailInput';
import OTPVerification from './OTPVerification';
import { sendOTP, verifyOTP } from '../../services/guestAuth';
import './GuestCheckout.css';

type FlowStep = 'email' | 'otp' | 'verified';

interface GuestCheckoutFlowProps {
  onVerified: (email: string, token: string) => void;
  onCancel?: () => void;
}

const GuestCheckoutFlow: React.FC<GuestCheckoutFlowProps> = ({ onVerified, onCancel }) => {
  const [step, setStep] = useState<FlowStep>('email');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailSubmit = async (submittedEmail: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await sendOTP(submittedEmail);
      setEmail(submittedEmail);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerify = async (code: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await verifyOTP(email, code);
      
      // Store guest token in localStorage
      localStorage.setItem('guestToken', response.token);
      localStorage.setItem('guestEmail', response.email);
      
      setStep('verified');
      
      // Notify parent component
      onVerified(response.email, response.token);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await sendOTP(email);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setError(null);
  };

  return (
    <div className="guest-checkout-container">
      <div className="guest-checkout-card">
        {step === 'email' && (
          <EmailInput
            onEmailSubmit={handleEmailSubmit}
            isLoading={isLoading}
            error={error}
          />
        )}

        {step === 'otp' && (
          <OTPVerification
            email={email}
            onVerify={handleOTPVerify}
            onResend={handleResend}
            onBack={handleBack}
            isLoading={isLoading}
            error={error}
          />
        )}

        {onCancel && (
          <div className="guest-checkout-cancel">
            <button
              type="button" 
              onClick={onCancel} 
              className="btn-link"
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestCheckoutFlow;
