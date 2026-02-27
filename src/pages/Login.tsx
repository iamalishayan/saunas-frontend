import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { resendVerificationEmail } from '../services/api';
import './Auth.css';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login, isLoading, error } = useAuth();
    
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [errors, setErrors] = useState({
        email: '',
        password: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [verificationRequired, setVerificationRequired] = useState(false);
    const [unverifiedEmail, setUnverifiedEmail] = useState('');
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
    
    // Get return URL and reason from query params
    const returnUrl = searchParams.get('returnUrl') || '/';
    const reason = searchParams.get('reason');
    
    // Show booking context message
    const [showBookingContext, setShowBookingContext] = useState(false);
    
    useEffect(() => {
        if (reason === 'booking') {
            setShowBookingContext(true);
        }
    }, [reason]);

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
            email: '',
            password: ''
        };

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return !newErrors.email && !newErrors.password;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (validateForm()) {
            try {
                setVerificationRequired(false);
                await login(formData);
                // Login successful, redirect to return URL or home
                navigate(returnUrl);
            } catch (err: any) {
                // Check if error is due to unverified email
                if (err.message && err.message.includes('verify your email')) {
                    setVerificationRequired(true);
                    setUnverifiedEmail(formData.email);
                }
                console.error('Login failed:', err);
            }
        }
    };

    const handleResendVerification = async () => {
        setIsResending(true);
        setResendMessage('');
        try {
            await resendVerificationEmail(unverifiedEmail);
            setResendMessage('✓ Verification email sent! Please check your inbox.');
        } catch (error: any) {
            setResendMessage('✗ ' + (error.message || 'Failed to resend email. Please try again.'));
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="auth-page glass-page">
            <div className="auth-container">
                <div className="auth-card glass-card">
                    <div className="auth-header">
                        <div style={{ 
                            display: 'inline-block', 
                            background: 'linear-gradient(135deg, #8b5a2b 0%, #a0522d 100%)', 
                            color: 'white', 
                            padding: '6px 16px', 
                            borderRadius: '20px', 
                            fontSize: '12px', 
                            fontWeight: 'bold', 
                            marginBottom: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            🔐 Admin Portal
                        </div>
                        <h1>Welcome Back</h1>
                        <p>Administrator and Staff Login</p>
                    </div>

                    {showBookingContext && (
                        <div className="auth-info" style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '15px',
                            borderRadius: '8px',
                            marginBottom: '20px',
                            textAlign: 'center'
                        }}>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>🎯 Almost there!</p>
                            <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
                                Login to complete your booking. Your selection will be restored.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="auth-error">
                            <p>{error}</p>
                            {verificationRequired && (
                                <div className="verification-notice">
                                    <p>📧 <strong>Email verification required</strong></p>
                                    <p>Please check your inbox at <strong>{unverifiedEmail}</strong></p>
                                    {resendMessage && (
                                        <p className={resendMessage.includes('✓') ? 'resend-success' : 'resend-error'}>
                                            {resendMessage}
                                        </p>
                                    )}
                                    <button 
                                        type="button"
                                        onClick={handleResendVerification}
                                        className="btn btn-secondary resend-btn"
                                        disabled={isResending}
                                    >
                                        {isResending ? 'Sending...' : 'Resend Verification Email'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form glass-form">
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
                                    placeholder="Enter your password"
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
                        </div>

                        <div className="form-footer">
                            <Link to="/forgot-password" className="forgot-link">
                                Forgot Password?
                            </Link>
                        </div>

                        <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
                            {isLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    {/* Registration removed - Admin-only system. Guests use OTP verification */}
                </div>
            </div>
        </div>
    );
};

export default Login;
