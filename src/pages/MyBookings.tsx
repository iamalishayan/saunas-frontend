import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUserBookings, downloadAgreementPDF } from '../services/api';
import { Booking } from '../types';
import './MyBookings.css';

const MyBookings: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
            return;
        }
        
        if (!authLoading && isAuthenticated) {
            fetchUserBookings();
        }
    }, [authLoading, isAuthenticated, navigate]);

    const fetchUserBookings = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getUserBookings();
            setBookings(data);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch your bookings');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
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

    const getStatusBadgeClass = (status: string): string => {
        switch (status) {
            case 'confirmed': return 'badge-success';
            case 'pending': return 'badge-warning';
            case 'cancelled': return 'badge-danger';
            default: return 'badge-default';
        }
    };

    const handleDownloadPDF = async (booking: any) => {
        if (!booking || !booking._id) return;
        
        setDownloadingPDF(booking._id);
        try {
            const vessel = typeof booking.vessel === 'object' ? booking.vessel : null;
            
            // Prepare agreement data
            const agreementData = {
                customerName: booking.customerName || 'Customer',
                deliveryAddress: booking.deliveryAddress || 'N/A',
                customerEmail: booking.customerEmail || 'no-email@example.com',
                customerPhone: booking.customerPhone || '000-000-0000',
                agreementDate: new Date().toISOString().split('T')[0],
                capacity: vessel?.capacity ? `${vessel.capacity} person` : '4 person',
                dropoffDate: booking.startTime ? new Date(booking.startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                pickupDate: booking.endTime ? new Date(booking.endTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                rentalFee: formatPrice(booking.totalPriceCents)
            };

            // Call API to generate PDF
            const blob = await downloadAgreementPDF(agreementData);
            
            // Create blob URL and download
            const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Equipment-Rental-Agreement-${booking.customerName || 'Agreement'}-${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error('Error downloading PDF:', err);
            alert(err.message || 'Failed to download agreement PDF. Please try again.');
        } finally {
            setDownloadingPDF(null);
        }
    };

    if (authLoading) {
        return (
            <div className="page-content my-bookings-page">
                <div className="container">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading authentication...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="page-content my-bookings-page">
                <div className="container">
                    <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading your bookings...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page-content my-bookings-page">
                <div className="container">
                    <div className="error-container">
                        <h2>Unable to Load Bookings</h2>
                        <p>{error}</p>
                        <div className="actions">
                            <button className="btn btn-primary" onClick={fetchUserBookings}>
                                Try Again
                            </button>
                            <button className="btn btn-secondary" onClick={() => navigate('/booking')}>
                                Make New Booking
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content my-bookings-page">
            <div className="container">
                <div className="my-bookings-header">
                    <h1>My Bookings</h1>
                    <p>View and manage your sauna boat reservations</p>
                    <button className="btn btn-primary" onClick={() => navigate('/booking')}>
                        Book New Trip
                    </button>
                </div>

                {bookings.length === 0 ? (
                    <div className="no-bookings">
                        <div className="no-bookings-icon">📅</div>
                        <h3>No Bookings Yet</h3>
                        <p>You haven't made any bookings yet. Ready to embark on your wellness journey?</p>
                        <button className="btn btn-primary" onClick={() => navigate('/booking')}>
                            Book Your First Trip
                        </button>
                    </div>
                ) : (
                    <div className="mybookings-list">
                        {bookings.map(booking => {
                            // Safely access vessel data
                            const vessel = typeof booking.vessel === 'object' ? booking.vessel : null;
                            const trip = booking.trip && typeof booking.trip === 'object' ? booking.trip : null;
                            const vesselType = vessel?.type || 'unknown';
                            const isMobileSauna = vesselType === 'mobile_sauna';
                            
                            return (
                            <div key={booking._id} className="mybookings-card">
                                <div className="mybookings-header-section">
                                    <div className="mybookings-id">
                                        <span className="label">Booking ID:</span>
                                        <span className="value">{booking._id}</span>
                                    </div>
                                    <div className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                    </div>
                                </div>

                                <div className="mybookings-details">
                                    <div className="detail-row">
                                        <div className="detail-item">
                                            <span className="label">Vessel:</span>
                                            <span className="value">{vessel?.name || 'Unknown Vessel'}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Type:</span>
                                            <span className="value vessel-type-badge">
                                                {vesselType === 'mobile_sauna' ? 'Mobile Sauna' : 
                                                 vesselType === 'boat' ? 'Boat' :
                                                 vesselType === 'trailer' ? 'Trailer' : vesselType}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Trip info for boat bookings */}
                                    {trip && vesselType === 'boat' && (
                                        <div className="detail-row">
                                            <div className="detail-item">
                                                <span className="label">Trip:</span>
                                                <span className="value">{trip.title || 'Trip'}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Departure:</span>
                                                <span className="value">{formatDate(trip.departureTime)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Rental period for trailers and mobile saunas */}
                                    {(isMobileSauna || vesselType === 'trailer') && (booking.startTime || booking.endTime) && (
                                        <div className="detail-row">
                                            {booking.startTime && (
                                                <div className="detail-item">
                                                    <span className="label">Start Time:</span>
                                                    <span className="value">{formatDate(booking.startTime)}</span>
                                                </div>
                                            )}
                                            {booking.endTime && (
                                                <div className="detail-item">
                                                    <span className="label">End Time:</span>
                                                    <span className="value">{formatDate(booking.endTime)}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Days booked for mobile sauna */}
                                    {isMobileSauna && (booking as any).daysBooked && (
                                        <div className="detail-row">
                                            <div className="detail-item">
                                                <span className="label">Rental Duration:</span>
                                                <span className="value">{(booking as any).daysBooked} days</span>
                                            </div>
                                            {vessel?.capacity && (
                                                <div className="detail-item">
                                                    <span className="label">Capacity:</span>
                                                    <span className="value">Up to {vessel.capacity} people</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Delivery address for mobile sauna */}
                                    {/* {isMobileSauna && (booking as any).deliveryAddress && (
                                        <div className="detail-row">
                                            <div className="detail-item full-width">
                                                <span className="label">Delivery Address:</span>
                                                <span className="value">{(booking as any).deliveryAddress}</span>
                                            </div>
                                        </div>
                                    )} */}



                                    {/* Contact info for bookings with customer information */}
                                    {(booking as any).customerPhone && (
                                        <div className="detail-row">
                                            {(booking as any).customerName && (
                                                <div className="detail-item">
                                                    <span className="label">Name:</span>
                                                    <span className="value">{(booking as any).customerName}</span>
                                                </div>
                                            )}
                                            <div className="detail-item">
                                                <span className="label">Contact:</span>
                                                <span className="value">{(booking as any).customerPhone}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Delivery address for mobile sauna */}
                                    {isMobileSauna && (booking as any).deliveryAddress && (
                                        <div className="detail-row">
                                            <div className="detail-item">
                                                <span className="label">Delivery Address:</span>
                                                <span className="value">{(booking as any).deliveryAddress}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Seats and pricing */}
                                    <div className="detail-row">
                                        {!isMobileSauna && booking.seatsBooked && (
                                            <div className="detail-item">
                                                <span className="label">Seats:</span>
                                                <span className="value">{booking.seatsBooked} {booking.isGroup ? '(Full Trip)' : ''}</span>
                                            </div>
                                        )}
                                        <div className="detail-item">
                                            <span className="label">Total:</span>
                                            <span className="value total-price">{formatPrice(booking.totalPriceCents)}</span>
                                        </div>
                                    </div>

                                    {/* Deposit Status */}
                                    {booking.damageDepositCents && (
                                        <div className="deposit-section">
                                            <div className="deposit-header">
                                                <span className="deposit-label">🛡️ Security Deposit:</span>
                                                <span className="deposit-amount">{formatPrice(booking.damageDepositCents)}</span>
                                            </div>
                                            <div className="deposit-status">
                                                {booking.damageDepositStatus === 'held' && (
                                                    <div className="deposit-badge deposit-held">
                                                        <span>⏳ HELD</span>
                                                        <p className="deposit-note">Will be auto-refunded 2 days after rental ends</p>
                                                    </div>
                                                )}
                                                {booking.damageDepositStatus === 'refunded' && (
                                                    <div className="deposit-badge deposit-refunded">
                                                        <span>✅ REFUNDED</span>
                                                        {booking.damageDepositRefundDate && (
                                                            <p className="deposit-note">Refunded on {new Date(booking.damageDepositRefundDate).toLocaleDateString()}</p>
                                                        )}
                                                        {booking.damageDepositRefundId && (
                                                            <p className="deposit-refund-id">ID: {booking.damageDepositRefundId}</p>
                                                        )}
                                                    </div>
                                                )}
                                                {booking.damageDepositStatus === 'forfeited' && (
                                                    <div className="deposit-badge deposit-forfeited">
                                                        <span>❌ FORFEITED</span>
                                                        {booking.damageDepositNotes && (
                                                            <p className="deposit-note">Reason: {booking.damageDepositNotes}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Badges */}
                                    <div className="mybookings-badges">
                                        {booking.isGroup && vesselType === 'boat' && (
                                            <div className="mybookings-badge-item mybookings-group-badge">
                                                <span>🏷️ Group Booking</span>
                                            </div>
                                        )}
                                        {isMobileSauna && (
                                            <div className="mybookings-badge-item mybookings-sauna-badge">
                                                <span>🧖 Mobile Sauna Rental</span>
                                            </div>
                                        )}
                                        {(booking as any).rulesAgreed && (booking as any).waiverSigned && (
                                            <div className="mybookings-badge-item mybookings-verified-badge">
                                                <span>✓ Rules & Waiver Signed</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mybookings-footer">
                                    <span className="mybookings-date">
                                        Booked on {formatDate(booking.createdAt)}
                                    </span>
                                    
                                    {isMobileSauna && booking.status === 'confirmed' && (booking as any).rulesAgreed && (booking as any).waiverSigned && (
                                        <div className="mybookings-actions">
                                            <button 
                                                className="mybookings-btn mybookings-btn-download"
                                                onClick={() => handleDownloadPDF(booking)}
                                                disabled={downloadingPDF === booking._id}
                                            >
                                                {downloadingPDF === booking._id ? (
                                                    <>
                                                        <span className="mybookings-spinner"></span>
                                                        Generating PDF...
                                                    </>
                                                ) : (
                                                    <>
                                                        📄 Download Agreement
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    )}
                                    
                                    {booking.status === 'pending' && !isMobileSauna && (
                                        <div className="mybookings-actions">
                                            <button className="mybookings-btn mybookings-btn-secondary">
                                                Contact Support
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyBookings;