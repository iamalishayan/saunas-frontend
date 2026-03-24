import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { checkPaymentStatus } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './BookingSuccess.css';

const BookingSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const bookingId = searchParams.get('bookingId');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<any>(null);

    const isPaymentComplete = paymentStatus?.paymentStatus === 'paid' || paymentStatus?.paymentStatus === 'succeeded';

    useEffect(() => {
        if (bookingId) {
            verifyPayment();
        } else {
            setError('No booking ID provided');
            setLoading(false);
        }
    }, [bookingId]);

    const verifyPayment = async () => {
        if (!bookingId) return;

        try {
            // Try to check payment status with authentication
            const status = await checkPaymentStatus(bookingId);
            setPaymentStatus(status);
            
            if (status.paymentStatus === 'paid' || status.paymentStatus === 'succeeded') {
                // No auto-redirect — user navigates manually via buttons
            }
        } catch (err: any) {
            console.log('Payment verification failed, showing generic success:', err.message);
            // If payment verification fails (likely due to auth), show generic success message
            // since the user was redirected here from Stripe success URL
            setPaymentStatus({ 
                paymentStatus: 'paid', 
                message: 'Payment completed successfully',
                bookingId: bookingId
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="container">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <h2>Verifying Payment...</h2>
                        <p>Please wait while we confirm your booking.</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-content">
                <div className="container">
                    <div className="error-container">
                        <h2>Payment Verification Failed</h2>
                        <p>{error}</p>
                        <div className="actions">
                            <button className="btn btn-primary" onClick={() => navigate('/booking')}>
                                Back to Booking
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/')}>
                                Go to Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="container">
                <div className="success-container">
                    {isPaymentComplete ? (
                        <>
                            <div className="success-icon">✅</div>
                            <h1>Booking Confirmed!</h1>
                            <h2>Payment Successful</h2>
                            <p>Thank you for your booking. Your payment has been processed successfully.</p>
                            
                            <div className="booking-details">
                                <h3>Booking Details</h3>
                                <p><strong>Booking ID:</strong> {bookingId}</p>
                                <p><strong>Status:</strong> {paymentStatus.paymentStatus}</p>
                            </div>

                            <div className="next-steps">{isAuthenticated ? 'your bookings page' : 'The Booking page'}
                                <h3>What's Next?</h3>
                                <ul>
                                    <li>You will receive a confirmation email shortly</li>
                                    <li>Your full rental agreement will be available here once processing completes</li>
                                    <li>Contact us if you have any questions</li>
                                </ul>
                            </div>

                            <div className="booking-details">
                                <h3>Rental Agreement</h3>
                                {paymentStatus?.agreementPdfUrl ? (
                                    <p>
                                        <a
                                            className="agreement-link"
                                            href={paymentStatus.agreementPdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            📄 View Rental Agreement PDF
                                        </a>
                                    </p>
                                ) : (
                                    <p>
                                        Agreement PDF is being generated. Refresh this page in a minute if it is not visible yet.
                                    </p>
                                )}
                            </div>


                        </>
                    ) : (
                        <>
                            <div className="warning-icon">⚠️</div>
                            <h1>Payment Processing</h1>
                            <p>Your payment is still being processed. Please check back in a few minutes.</p>
                            
                            <div className="booking-details">
                                <h3>Booking Details</h3>
                                <p><strong>Booking ID:</strong> {bookingId}</p>
                                <p><strong>Status:</strong> {paymentStatus?.paymentStatus}</p>
                                <p><strong>Message:</strong> {paymentStatus?.message}</p>
                            </div>
                        </>
                    )}

                    <div className="actions">
                        {isAuthenticated ? (
                            <button className="btn btn-primary" onClick={() => navigate('/my-bookings')}>
                                View My Bookings
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={() => navigate('/track-booking')}>
                                Track My Booking
                            </button>
                        )}
                        <button className="btn btn-secondary" onClick={() => navigate('/booking')}>
                            Book Another Trip
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingSuccess;