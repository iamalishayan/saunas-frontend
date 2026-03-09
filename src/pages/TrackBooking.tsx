import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lookupBooking } from '../services/api';
import { Booking } from '../types';
import './TrackBooking.css';

const TrackBooking: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState<string>('');
    const [bookingId, setBookingId] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [booking, setBooking] = useState<Booking | null>(null);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await lookupBooking(email.trim(), bookingId.trim());
            setBooking(response.booking);
        } catch (err: any) {
            setError(err.message || 'Failed to find booking. Please check your email and booking ID.');
            setBooking(null);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setEmail('');
        setBookingId('');
        setBooking(null);
        setError(null);
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPrice = (priceCents: number): string => {
        return `$${(priceCents / 100).toFixed(2)}`;
    };

    const getStatusBadge = (status: string) => {
        const statusClasses: { [key: string]: string } = {
            pending:   'track-badge-pending',
            confirmed: 'track-badge-confirmed',
            completed: 'track-badge-completed',
            cancelled: 'track-badge-cancelled'
        };
        return `track-status-badge ${statusClasses[status] || ''}`;
    };

    return (
        <div className="track-booking-page">
            <div className="track-booking-container">

                {/* ── Header ── */}
                <div className="track-booking-header">
                    <div className="track-icon-wrap">🔍</div>
                    <h1>Track Your Booking</h1>
                    <p>Enter your email and booking ID to view your reservation details</p>
                </div>

                {!booking ? (
                    /* ── Lookup Form ── */
                    <form onSubmit={handleLookup} className="track-booking-form">
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="bookingId">Booking ID</label>
                            <input
                                type="text"
                                id="bookingId"
                                value={bookingId}
                                onChange={(e) => setBookingId(e.target.value)}
                                placeholder="Enter your booking ID"
                                required
                                disabled={loading}
                            />
                            <small>You can find your booking ID in the confirmation email</small>
                        </div>

                        {error && (
                            <div className="track-error-message">
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="track-form-actions">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || !email || !bookingId}
                            >
                                {loading ? '⏳ Looking up…' : '🔍 Find My Booking'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate('/booking')}
                            >
                                ← Back to Booking
                            </button>
                        </div>
                    </form>
                ) : (
                    /* ── Results ── */
                    <div className="track-booking-result">
                        <div className="track-result-header">
                            <div className="track-success-icon">✅</div>
                            <h2>Booking Found!</h2>
                        </div>

                        <div className="track-booking-details">

                            {/* Booking Information */}
                            <div className="track-detail-section">
                                <h3>Booking Information</h3>
                                <div className="track-detail-grid">
                                    <div className="track-detail-item track-detail-full">
                                        <span className="track-label">Booking ID</span>
                                        <span className="track-value">{booking._id}</span>
                                    </div>
                                    <div className="track-detail-item">
                                        <span className="track-label">Status</span>
                                        <span className={getStatusBadge(booking.status)}>
                                            {booking.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="track-detail-item">
                                        <span className="track-label">Payment Status</span>
                                        <span className={`track-payment-badge track-payment-${booking.paymentStatus}`}>
                                            {booking.paymentStatus?.toUpperCase() || 'PENDING'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Details */}
                            <div className="track-detail-section">
                                <h3>Customer Details</h3>
                                <div className="track-detail-grid">
                                    <div className="track-detail-item">
                                        <span className="track-label">Name</span>
                                        <span className="track-value">{booking.customerName}</span>
                                    </div>
                                    <div className="track-detail-item">
                                        <span className="track-label">Email</span>
                                        <span className="track-value">{booking.customerEmail}</span>
                                    </div>
                                    <div className="track-detail-item">
                                        <span className="track-label">Phone</span>
                                        <span className="track-value">{booking.customerPhone}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Trip Details */}
                            {booking.trip && (
                                <div className="track-detail-section">
                                    <h3>Trip Details</h3>
                                    <div className="track-detail-grid">
                                        <div className="track-detail-item track-detail-full">
                                            <span className="track-label">Vessel</span>
                                            <span className="track-value">{booking.vessel?.name}</span>
                                        </div>
                                        <div className="track-detail-item track-detail-full">
                                            <span className="track-label">Departure</span>
                                            <span className="track-value">{formatDate(booking.trip.departureTime)}</span>
                                        </div>
                                        <div className="track-detail-item">
                                            <span className="track-label">Seats</span>
                                            <span className="track-value">{booking.numberOfSeats}</span>
                                        </div>
                                        {booking.isGroup && (
                                            <div className="track-detail-item">
                                                <span className="track-badge track-group-badge">GROUP BOOKING</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Mobile Sauna Rental */}
                            {booking.deliveryAddress && (
                                <div className="track-detail-section">
                                    <h3>Mobile Sauna Rental</h3>
                                    <div className="track-detail-grid">
                                        <div className="track-detail-item track-detail-full">
                                            <span className="track-label">Delivery Address</span>
                                            <span className="track-value">{booking.deliveryAddress}</span>
                                        </div>
                                        <div className="track-detail-item">
                                            <span className="track-label">Start Date</span>
                                            <span className="track-value">
                                                {booking.startTime && formatDate(booking.startTime)}
                                            </span>
                                        </div>
                                        <div className="track-detail-item">
                                            <span className="track-label">End Date</span>
                                            <span className="track-value">
                                                {booking.endTime && formatDate(booking.endTime)}
                                            </span>
                                        </div>
                                        {booking.additionalWoodBins && booking.additionalWoodBins > 0 && (
                                            <div className="track-detail-item">
                                                <span className="track-label">Wood Bins</span>
                                                <span className="track-value">{booking.additionalWoodBins} additional</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Payment */}
                            <div className="track-detail-section">
                                <h3>Payment</h3>
                                <div className="track-detail-grid">
                                    <div className="track-detail-item">
                                        <span className="track-label">Total Amount</span>
                                        <span className="track-value track-price">
                                            {formatPrice(booking.totalAmount || booking.totalPriceCents)}
                                        </span>
                                    </div>
                                    {booking.deliveryFee && (
                                        <div className="track-detail-item">
                                            <span className="track-label">Delivery Fee</span>
                                            <span className="track-value">{formatPrice(booking.deliveryFee)}</span>
                                        </div>
                                    )}
                                    {booking.woodBinsFee && booking.woodBinsFee > 0 && (
                                        <div className="track-detail-item">
                                            <span className="track-label">Wood Bins Fee</span>
                                            <span className="track-value">{formatPrice(booking.woodBinsFee)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Agreement Status */}
                            <div className="track-detail-section">
                                <h3>Agreement Status</h3>
                                <div className="track-detail-grid">
                                    <div className="track-detail-item">
                                        <span className="track-label">Rules Agreed</span>
                                        <span className="track-value">{booking.rulesAgreed ? '✅ Yes' : '❌ No'}</span>
                                    </div>
                                    <div className="track-detail-item">
                                        <span className="track-label">Waiver Signed</span>
                                        <span className="track-value">{booking.waiverSigned ? '✅ Yes' : '❌ No'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Support Box */}
                            <div className="track-info-box">
                                <h4>📧 Need Help?</h4>
                                <p>If you have questions about your booking, please contact our support team:</p>
                                <p><strong>Email:</strong> Info@victoriasaunarentals.ca</p>
                            </div>

                        </div>{/* /track-booking-details */}

                        <div className="track-form-actions">
                            <button
                                className="btn btn-primary"
                                onClick={handleReset}
                            >
                                🔄 Look Up Another Booking
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => navigate('/booking')}
                            >
                                Book Another Trip
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default TrackBooking;
