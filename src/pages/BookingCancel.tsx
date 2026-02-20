import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { cancelBooking, checkPaymentStatus } from '../services/api';
import './BookingCancel.css';

const BookingCancel: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const bookingId = searchParams.get('bookingId');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [cancelled, setCancelled] = useState<boolean>(false);
    const [paymentStatus, setPaymentStatus] = useState<any>(null);

    useEffect(() => {
        if (bookingId) {
            checkBookingStatus();
        } else {
            setError('No booking ID provided');
        }
    }, [bookingId]);

    const checkBookingStatus = async () => {
        if (!bookingId) return;

        try {
            const status = await checkPaymentStatus(bookingId);
            setPaymentStatus(status);
        } catch (err: any) {
            console.log('Payment status check failed, proceeding with cancel page:', err.message);
            // If payment status check fails, just show the cancel page
            // since the user was redirected here from Stripe cancel URL
            setPaymentStatus({ 
                paymentStatus: 'cancelled', 
                message: 'Payment was cancelled by user' 
            });
        }
    };

    const handleCancelBooking = async () => {
        if (!bookingId) return;

        setLoading(true);
        setError(null);

        try {
            await cancelBooking(bookingId);
            setCancelled(true);
        } catch (err: any) {
            setError(err.message || 'Failed to cancel booking');
        } finally {
            setLoading(false);
        }
    };

    if (cancelled) {
        return (
            <div className="page-content">
                <div className="container">
                    <div className="cancelled-container">
                        <div className="cancel-icon">❌</div>
                        <h1>Booking Cancelled</h1>
                        <p>Your booking has been successfully cancelled.</p>
                        
                        <div className="booking-details">
                            <h3>Cancellation Details</h3>
                            <p><strong>Booking ID:</strong> {bookingId}</p>
                            <p><strong>Status:</strong> Cancelled</p>
                            <p>Any reserved seats have been released and made available for other customers.</p>
                        </div>

                        <div className="actions">
                            <button className="btn btn-primary" onClick={() => navigate('/booking')}>
                                Book Another Trip
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
                <div className="cancel-container">
                    <div className="warning-icon">⚠️</div>
                    <h1>Payment Cancelled</h1>
                    <p>Your payment was cancelled, but your booking is still reserved temporarily.</p>

                    {error && (
                        <div className="error-message">
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="booking-details">
                        <h3>Booking Details</h3>
                        <p><strong>Booking ID:</strong> {bookingId}</p>
                        {paymentStatus && (
                            <>
                                <p><strong>Status:</strong> {paymentStatus.paymentStatus}</p>
                                <p><strong>Message:</strong> {paymentStatus.message}</p>
                            </>
                        )}
                    </div>

                    <div className="options">
                        <h3>What would you like to do?</h3>
                        <div className="option-cards">
                            <div className="option-card">
                                <h4>Complete Payment</h4>
                                <p>Return to complete your booking payment before the reservation expires.</p>
                                <button className="btn btn-primary" onClick={() => navigate('/my-bookings')}>
                                    View My Bookings
                                </button>
                            </div>

                            <div className="option-card">
                                <h4>Cancel Booking</h4>
                                <p>Cancel this booking and release the reserved seats for other customers.</p>
                                <button 
                                    className="btn btn-danger" 
                                    onClick={handleCancelBooking}
                                    disabled={loading}
                                >
                                    {loading ? 'Cancelling...' : 'Cancel Booking'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="actions">
                        <button className="btn btn-secondary" onClick={() => navigate('/')}>
                            Go to Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingCancel;