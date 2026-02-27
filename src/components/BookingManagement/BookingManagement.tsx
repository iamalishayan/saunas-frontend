import React, { useState, useEffect } from 'react';
import { getAllBookings, confirmBooking, cancelBookingAdmin } from '../../services/api';
import { Booking, BookingFilters } from '../../types';
import './BookingManagement.css';

interface BookingManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const BookingManagement: React.FC<BookingManagementProps> = ({ isOpen, onClose }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingBooking, setProcessingBooking] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<BookingFilters>({
    status: '',
    tripId: '',
    userId: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchBookings();
    }
  }, [isOpen]);

  const fetchBookings = async (appliedFilters?: BookingFilters) => {
    setLoading(true);
    setError(null);
    try {
      const filtersToApply = appliedFilters || filters;
      // Remove empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filtersToApply).filter(([_, value]) => value && value.trim() !== '')
      );
      
      const response = await getAllBookings(cleanFilters);
      // Filter out mobile sauna bookings (those belong in Mobile Sauna Management)
      const boatTrailerBookings = response.filter((booking: any) => 
        booking.vessel?.type === 'boat' || booking.vessel?.type === 'trailer'
      );
      setBookings(boatTrailerBookings);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async (booking: Booking) => {
    if (booking.status === 'confirmed') {
      setError('Booking is already confirmed');
      return;
    }

    setProcessingBooking(booking._id);
    setError(null);

    try {
      await confirmBooking(booking._id);
      setBookings(prevBookings => 
        prevBookings.map(b => 
          b._id === booking._id ? { ...b, status: 'confirmed' } : b
        )
      );
      setSuccessMessage('Booking confirmed successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to confirm booking');
    } finally {
      setProcessingBooking(null);
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    if (booking.status === 'cancelled') {
      setError('Booking is already cancelled');
      return;
    }

    // Safely handle both guest and user bookings
    const customerName = booking.customerName || 
      (typeof booking.user === 'object' && booking.user ? booking.user.name : null) || 
      booking.customerEmail || 
      'this customer';
    
    if (!confirm(`Are you sure you want to cancel this booking for ${customerName}?`)) {
      return;
    }

    setProcessingBooking(booking._id);
    setError(null);

    try {
      await cancelBookingAdmin(booking._id);
      setBookings(prevBookings => 
        prevBookings.map(b => 
          b._id === booking._id ? { ...b, status: 'cancelled' } : b
        )
      );
      setSuccessMessage('Booking cancelled successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking');
    } finally {
      setProcessingBooking(null);
    }
  };

  const handleFilterChange = (field: keyof BookingFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    fetchBookings(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = { status: '', tripId: '', userId: '' };
    setFilters(clearedFilters);
    fetchBookings(clearedFilters);
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number): string => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'confirmed': return 'status-confirmed';
      case 'pending': return 'status-pending';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="booking-management-overlay">
      <div className="booking-management-container">
        <div className="booking-management-header">
          <h2>Booking Management</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="booking-management-content">
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}

          {/* Filters Section */}
          <div className="filters-section">
            <h3>Filters</h3>
            <div className="filters-grid">
              <div className="filter-group">
                <label htmlFor="status-filter">Status</label>
                <select
                  id="status-filter"
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="trip-filter">Trip ID</label>
                <input
                  type="text"
                  id="trip-filter"
                  placeholder="Enter trip ID"
                  value={filters.tripId || ''}
                  onChange={(e) => handleFilterChange('tripId', e.target.value)}
                />
              </div>

              <div className="filter-group">
                <label htmlFor="user-filter">User ID</label>
                <input
                  type="text"
                  id="user-filter"
                  placeholder="Enter user ID"
                  value={filters.userId || ''}
                  onChange={(e) => handleFilterChange('userId', e.target.value)}
                />
              </div>
            </div>

            <div className="filter-actions">
              <button className="apply-filters-btn" onClick={handleApplyFilters}>
                Apply Filters
              </button>
              <button className="clear-filters-btn" onClick={handleClearFilters}>
                Clear Filters
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading bookings...</div>
          ) : (
            <>
              <div className="bookings-summary">
                {bookings.length} bookings found
              </div>

              <div className="bookings-table-container">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Trip</th>
                      <th>Status</th>
                      <th>Seats</th>
                      <th>Amount</th>
                      <th>Deposit</th>
                      <th>Booked At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="no-results">No bookings found</td>
                      </tr>
                    ) : (
                      bookings.map(booking => {
                        // Determine if this is a guest or user booking
                        const isGuestBooking = !booking.user || booking.user === null;
                        
                        return (
                        <tr key={booking._id}>
                          <td className="customer-info">
                            <div className="customer-header">
                              <div className="customer-name">
                                {booking.customerName || (typeof booking.user === 'object' && booking.user ? booking.user.name : 'Unknown User')}
                              </div>
                              <span className={`booking-type-badge ${isGuestBooking ? 'guest-badge' : 'user-badge'}`}>
                                {isGuestBooking ? '👤 Guest' : '🔐 User'}
                              </span>
                            </div>
                            <div className="customer-email">
                              {booking.customerEmail || (typeof booking.user === 'object' && booking.user ? booking.user.email : 'No email')}
                            </div>
                            {booking.customerPhone && (
                              <div className="customer-phone">
                                📞 {booking.customerPhone}
                              </div>
                            )}
                          </td>
                          <td className="trip-info">
                            <div className="trip-title">
                              {booking.trip?.title || 'Unknown Trip'}
                            </div>
                            <div className="trip-details">
                              {booking.startTime && (
                                <span className="trip-time">
                                  {formatDateTime(booking.startTime)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </td>
                          <td className="seats-info">
                            {booking.seatsBooked || 0}
                          </td>
                          <td className="amount-info">
                            {booking.totalPriceCents ? formatCurrency(booking.totalPriceCents) : 'N/A'}
                          </td>
                          <td className="deposit-info">
                            {booking.damageDepositCents && booking.damageDepositCents > 0 ? (
                              <div className="deposit-cell">
                                <span className="deposit-amount">{formatCurrency(booking.damageDepositCents)}</span>
                                {booking.damageDepositStatus === 'held' && <span className="dep-badge dep-held">⏳</span>}
                                {booking.damageDepositStatus === 'refunded' && <span className="dep-badge dep-refunded">✅</span>}
                                {booking.damageDepositStatus === 'forfeited' && <span className="dep-badge dep-forfeited">❌</span>}
                              </div>
                            ) : (
                              <span className="no-deposit">—</span>
                            )}
                          </td>
                          <td className="booking-date">
                            {formatDateTime(booking.createdAt)}
                          </td>
                          <td className="actions-cell">
                            {booking.status === 'pending' && (
                              <button 
                                className="action-btn confirm-btn"
                                onClick={() => handleConfirmBooking(booking)}
                                disabled={processingBooking === booking._id}
                                title="Confirm Booking"
                              >
                                {processingBooking === booking._id ? '...' : 'Confirm'}
                              </button>
                            )}
                            {booking.status !== 'cancelled' && (
                              <button 
                                className="action-btn cancel-btn"
                                onClick={() => handleCancelBooking(booking)}
                                disabled={processingBooking === booking._id}
                                title="Cancel Booking"
                              >
                                {processingBooking === booking._id ? '...' : 'Cancel'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingManagement;