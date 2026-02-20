import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { resendVerificationEmail } from '../services/api';
import './Auth.css';

const Register: React.FC = () => {
    const { register, isLoading, error } = useAuth();
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const [errors, setErrors] = useState({
        name: '',
        email: '',
        password: ''
    });

    const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);
    const [registeredUserEmail, setRegisteredUserEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {
            name: '',
            email: '',
            password: ''
        };

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        // Password validation (matching backend requirements)
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
        } else if (!/[A-Z]/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one uppercase letter';
        } else if (!/[a-z]/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one lowercase letter';
        } else if (!/\d/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one number';
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one special character';
        }

        setErrors(newErrors);
        return !newErrors.name && !newErrors.email && !newErrors.password;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (validateForm()) {
            try {
                await register(formData);
                // Registration successful, show success message instead of redirecting
                setRegisteredUserEmail(formData.email);
                setIsRegistrationSuccess(true);
                // Clear form data
                setFormData({
                    name: '',
                    email: '',
                    password: ''
                });
                setErrors({
                    name: '',
                    email: '',
                    password: ''
                });
            } catch (err) {
                // Error is handled in the useAuth hook
                console.error('Registration failed:', err);
            }
        }
    };

    const handleResendVerification = async () => {
        setIsResending(true);
        setResendMessage('');
        try {
            await resendVerificationEmail(registeredUserEmail);
            setResendMessage('Verification email sent! Please check your inbox.');
        } catch (error: any) {
            setResendMessage(error.message || 'Failed to resend email. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="auth-page glass-page">
            <div className="auth-container">
                <div className="auth-card glass-card">
                    {isRegistrationSuccess ? (
                        // Success State - Email Verification Required
                        <>
                            <div className="auth-header">
                                <h1>Check Your Email!</h1>
                                <p>We've sent you a verification link</p>
                            </div>

                            <div className="auth-success">
                                <div className="success-icon">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                    </svg>
                                </div>
                                <h3>Registration Successful!</h3>
                                <p>A verification email has been sent to:</p>
                                <p className="registered-email"><strong>{registeredUserEmail}</strong></p>
                                <div className="verification-instructions">
                                    <p>📧 Please check your inbox and click the verification link to activate your account.</p>
                                    <p>⏱️ The verification link will expire in 24 hours.</p>
                                    <p>📂 Don't forget to check your spam folder if you don't see it.</p>
                                </div>
                                
                                {resendMessage && (
                                    <div className={resendMessage.includes('sent') ? 'auth-success-message' : 'auth-error'}>
                                        <p>{resendMessage}</p>
                                    </div>
                                )}

                                <div className="success-actions">
                                    <button 
                                        onClick={handleResendVerification}
                                        className="btn btn-secondary"
                                        disabled={isResending}
                                    >
                                        {isResending ? 'Sending...' : 'Resend Verification Email'}
                                    </button>
                                    <Link to="/login" className="btn btn-primary">
                                        Go to Login
                                    </Link>
                                </div>
                            </div>
                        </>
                    ) : (
                        // Registration Form State
                        <>
                            <div className="auth-header">
                                <h1>Create Account</h1>
                                <p>Join us for the ultimate relaxation experience</p>
                            </div>

                            {error && (
                                <div className="auth-error">
                                    <p>{error}</p>
                                </div>
                            )}

                    <form onSubmit={handleSubmit} className="auth-form glass-form">
                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter Full Name"
                                className={errors.name ? 'error' : ''}
                            />
                            {errors.name && <span className="error-message">{errors.name}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                className={errors.email ? 'error' : ''}
                            />
                            {errors.email && <span className="error-message">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Create a strong password"
                                    className={errors.password ? 'error' : ''}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && <span className="error-message">{errors.password}</span>}
                            <span className="password-hint">
                                Must be 8+ characters with uppercase, lowercase, number, and special character
                            </span>
                        </div>

                            <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
                                {isLoading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>

                        <div className="auth-divider">
                            <span>or</span>
                        </div>

                        <div className="auth-redirect">
                            <p>Already have an account?</p>
                            <Link to="/login" className="btn btn-secondary">
                                Login
                            </Link>
                        </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
