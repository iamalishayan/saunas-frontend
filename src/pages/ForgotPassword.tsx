import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import './Auth.css';

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [emailError, setEmailError] = useState('');

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            return 'Email is required';
        } else if (!emailRegex.test(email)) {
            return 'Please enter a valid email';
        }
        return '';
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        setError(null);
        
        // Clear email error when user starts typing
        if (emailError) {
            setEmailError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const emailValidationError = validateEmail(email);
        if (emailValidationError) {
            setEmailError(emailValidationError);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await forgotPassword(email);
            setIsSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    {isSuccess ? (
                        // Success State
                        <>
                            <div className="auth-header">
                                <h1>Email Sent!</h1>
                                <p>Check your email for password reset instructions</p>
                            </div>

                            <div className="auth-success">
                                <div className="success-icon">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                </div>
                                <h3>Password Reset Email Sent!</h3>
                                <p>We've sent password reset instructions to <strong>{email}</strong></p>
                                <p>Please check your email and follow the link to reset your password.</p>
                                
                                <div className="success-actions">
                                    <Link to="/login" className="btn btn-primary">
                                        Back to Login
                                    </Link>
                                    <button 
                                        onClick={() => {
                                            setIsSuccess(false);
                                            setEmail('');
                                        }} 
                                        className="btn btn-secondary"
                                    >
                                        Send Another Email
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        // Forgot Password Form
                        <>
                            <div className="auth-header">
                                <h1>Forgot Password?</h1>
                                <p>Enter your email address and we'll send you a link to reset your password</p>
                            </div>

                            {error && (
                                <div className="auth-error">
                                    <p>{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="auth-form">
                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={email}
                                        onChange={handleChange}
                                        placeholder="Enter your email address"
                                        className={emailError ? 'error' : ''}
                                    />
                                    {emailError && <span className="error-message">{emailError}</span>}
                                </div>

                                <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
                                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </form>

                            <div className="auth-divider">
                                <span>or</span>
                            </div>

                            <div className="auth-redirect">
                                <p>Remember your password?</p>
                                <Link to="/login" className="btn btn-secondary">
                                    Back to Login
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;