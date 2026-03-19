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
    const [bookings, setBookings] = useState<Booking[] | null>(null);

    const handleLookup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await lookupBooking(email.trim(), bookingId.trim() || undefined);
            // Backend now returns `bookings` array
            const results = (response as any).bookings ?? (response.booking ? [response.booking] : []);
            setBookings(results);
        } catch (err: any) {
            setError(err.message || 'No bookings found for this email address.');
            setBookings(null);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setEmail('');
        setBookingId('');
        setBookings(null);
        setError(null);
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
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
                    <p>Enter your email address to view all your reservations. You can also add your Booking ID to find a specific one.</p>
                </div>

                {!bookings ? (
                    /* ── Lookup Form ── */
                    <form onSubmit={handleLookup} className="track-booking-form">
                        <div className="form-group">
                            <label htmlFor="email">Email Address <span style={{ color: 'var(--color-primary)' }}>*</span></label>
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
                            <label htmlFor="bookingId">Booking ID <span style={{ color: '#999', fontWeight: 400 }}>(optional)</span></label>
                            <input
                                type="text"
                                id="bookingId"
                                value={bookingId}
                                onChange={(e) => setBookingId(e.target.value)}
                                placeholder="Leave blank to see all bookings"
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
                                disabled={loading || !email}
                            >
                                {loading ? '⏳ Looking up…' : '🔍 Find My Bookings'}
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
                            <h2>{bookings.length === 1 ? 'Booking Found!' : `${bookings.length} Bookings Found`}</h2>
                        </div>

                        {bookings.map((booking, idx) => {
                            const vessel = typeof booking.vessel === 'object' ? booking.vessel : null;
                            const isMobileSauna = vessel?.type === 'mobile_sauna';

                            return (
                                <div key={booking._id || idx} className="track-booking-details">

                                    {/* Booking Information */}
                                    <div className="track-detail-section">
                                        <h3>Booking #{idx + 1}</h3>
                                        <div className="track-detail-grid">
                                            <div className="track-detail-item track-detail-full">
                                                <span className="track-label">Booking ID</span>
                                                <span className="track-value" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{booking._id}</span>
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
                                            {vessel && (
                                                <div className="track-detail-item">
                                                    <span className="track-label">Vessel</span>
                                                    <span className="track-value">{vessel.name}</span>
                                                </div>
                                            )}
                                            <div className="track-detail-item">
                                                <span className="track-label">Type</span>
                                                <span className="track-value">{isMobileSauna ? 'Mobile Sauna Rental' : 'Boat Trip'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Trip Dates */}
                                    {(booking.startTime || booking.endTime) && (
                                        <div className="track-detail-section">
                                            <h3>{isMobileSauna ? 'Rental Period' : 'Trip Details'}</h3>
                                            <div className="track-detail-grid">
                                                {booking.startTime && (
                                                    <div className="track-detail-item">
                                                        <span className="track-label">Start Date</span>
                                                        <span className="track-value">{formatDate(booking.startTime)}</span>
                                                    </div>
                                                )}
                                                {booking.endTime && (
                                                    <div className="track-detail-item">
                                                        <span className="track-label">End Date</span>
                                                        <span className="track-value">{formatDate(booking.endTime)}</span>
                                                    </div>
                                                )}
                                                {booking.deliveryAddress && (
                                                    <div className="track-detail-item track-detail-full">
                                                        <span className="track-label">Delivery Address</span>
                                                        <span className="track-value">{booking.deliveryAddress}</span>
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
                                            {booking.damageDepositCents && (
                                                <div className="track-detail-item">
                                                    <span className="track-label">Security Deposit</span>
                                                    <span className="track-value">{formatPrice(booking.damageDepositCents)} ({booking.damageDepositStatus || 'held'})</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Booked on */}
                                    <div className="track-booking-meta">
                                        <span>Booked on {formatDate(booking.createdAt)}</span>
                                    </div>

                                </div>
                            );
                        })}

                        {/* Support Box */}
                        <div className="track-info-box">
                            <h4>📧 Need Help?</h4>
                            <p>If you have questions about your booking, please contact our support team:</p>
                            <p><strong>Email:</strong> Info@victoriasaunarentals.ca</p>
                            <p><strong>Phone:</strong> 250-885-4955</p>
                        </div>

                        <div className="track-form-actions">
                            <button
                                className="btn btn-primary"
                                onClick={handleReset}
                            >
                                🔄 Search Again
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
