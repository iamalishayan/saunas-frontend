import React, { useState, useEffect } from 'react';
import { getAllBookings, forfeitDeposit, manualRefundDeposit, triggerDepositRefundCheck } from '../../services/api';
import { Booking } from '../../types';
import DepositStatusBadge from './DepositStatusBadge';
import DepositCountdown from './DepositCountdown';
import ForfeitModal from './ForfeitModal';
import './DepositManagement.css';

interface DepositManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const DepositManagement: React.FC<DepositManagementProps> = ({ isOpen, onClose }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingBookingId, setProcessingBookingId] = useState<string | null>(null);
  const [forfeitModalOpen, setForfeitModalOpen] = useState<boolean>(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [triggeringCheck, setTriggeringCheck] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchBookings();
    }
  }, [isOpen]);

  useEffect(() => {
    filterBookings();
  }, [bookings, statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllBookings({});
      // Filter only bookings with deposits (mobile sauna bookings)
      const depositsBookings = data.filter((booking: Booking) => 
        booking.damageDepositCents && booking.damageDepositCents > 0
      );
      setBookings(depositsBookings);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    if (statusFilter === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(
        bookings.filter(booking => booking.damageDepositStatus === statusFilter)
      );
    }
  };

  const handleTriggerRefundCheck = async () => {
    setTriggeringCheck(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await triggerDepositRefundCheck();
      setSuccessMessage(response.message || 'Refund check completed successfully');
      await fetchBookings();
    } catch (err: any) {
      setError(err.message || 'Failed to trigger refund check');
    } finally {
      setTriggeringCheck(false);
    }
  };

  const handleForfeitClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setForfeitModalOpen(true);
  };

  const handleForfeitConfirm = async (reason: string) => {
    if (!selectedBooking) return;

    setProcessingBookingId(selectedBooking._id);
    try {
      await forfeitDeposit(selectedBooking._id, reason);
      setSuccessMessage(`Deposit forfeited for booking ${selectedBooking._id}`);
      setTimeout(() => setSuccessMessage(null), 5000);
      await fetchBookings();
    } catch (err: any) {
      throw err;
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleManualRefund = async (booking: Booking) => {
    if (!confirm(`Manually refund $${(booking.damageDepositCents! / 100).toFixed(2)} deposit for ${getCustomerName(booking)}?`)) {
      return;
    }

    setProcessingBookingId(booking._id);
    setError(null);
    try {
      await manualRefundDeposit(booking._id);
      setSuccessMessage(`Deposit refunded manually for booking ${booking._id}`);
      setTimeout(() => setSuccessMessage(null), 5000);
      await fetchBookings();
    } catch (err: any) {
      setError(err.message || 'Failed to refund deposit');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const getCustomerName = (booking: Booking): string => {
    if (booking.customerName) return booking.customerName;
    if (typeof booking.user === 'object' && booking.user) return booking.user.name;
    return 'Unknown';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="deposit-management-overlay">
      <div className="deposit-management-panel">
        <div className="deposit-management-header">
          <h2>💰 Deposit Management</h2>
          <div className="deposit-header-actions">
            <button
              className="deposit-btn deposit-btn-primary deposit-btn-sm"
              onClick={handleTriggerRefundCheck}
              disabled={triggeringCheck}
            >
              {triggeringCheck ? '⏳ Checking...' : '🔄 Trigger Refund Check'}
            </button>
            <button className="deposit-btn-close" onClick={onClose}>×</button>
          </div>
        </div>

        {error && (
          <div className="deposit-alert deposit-alert-error">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="deposit-alert deposit-alert-success">
            {successMessage}
          </div>
        )}

        <div className="deposit-filters">
          <label>Filter by Status:</label>
          <div className="deposit-filter-buttons">
            <button
              className={`deposit-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All ({bookings.length})
            </button>
            <button
              className={`deposit-filter-btn ${statusFilter === 'held' ? 'active' : ''}`}
              onClick={() => setStatusFilter('held')}
            >
              Held ({bookings.filter(b => b.damageDepositStatus === 'held').length})
            </button>
            <button
              className={`deposit-filter-btn ${statusFilter === 'refunded' ? 'active' : ''}`}
              onClick={() => setStatusFilter('refunded')}
            >
              Refunded ({bookings.filter(b => b.damageDepositStatus === 'refunded').length})
            </button>
            <button
              className={`deposit-filter-btn ${statusFilter === 'forfeited' ? 'active' : ''}`}
              onClick={() => setStatusFilter('forfeited')}
            >
              Forfeited ({bookings.filter(b => b.damageDepositStatus === 'forfeited').length})
            </button>
          </div>
        </div>

        <div className="deposit-list">
          {loading ? (
            <div className="deposit-loading-state">
              <div className="deposit-loading-spinner"></div>
              <p>Loading deposits...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="deposit-empty-state">
              <p>📭 No deposits found</p>
            </div>
          ) : (
            filteredBookings.map(booking => (
              <div key={booking._id} className="deposit-card">
                <div className="deposit-card-header">
                  <div className="deposit-card-info">
                    <h4>📋 {getCustomerName(booking)}</h4>
                    <p className="booking-id">Booking #{booking._id.slice(-6)}</p>
                  </div>
                  <DepositStatusBadge status={booking.damageDepositStatus!} />
                </div>

                <div className="deposit-card-body">
                  <div className="deposit-detail-row">
                    <span className="label">Rental Period:</span>
                    <span className="value">
                      {booking.startTime && formatDate(booking.startTime)} - {booking.endTime && formatDate(booking.endTime)}
                    </span>
                  </div>

                  <div className="deposit-detail-row">
                    <span className="label">Deposit Amount:</span>
                    <span className="value deposit-amount">
                      ${(booking.damageDepositCents! / 100).toFixed(2)}
                    </span>
                  </div>

                  {booking.damageDepositStatus === 'held' && booking.endTime && (
                    <div className="deposit-detail-row">
                      <span className="label">Auto-refund in:</span>
                      <span className="value">
                        <DepositCountdown endTime={booking.endTime} daysOffset={2} />
                      </span>
                    </div>
                  )}

                  {booking.damageDepositStatus === 'refunded' && (
                    <>
                      {booking.damageDepositRefundDate && (
                        <div className="deposit-detail-row">
                          <span className="label">Refunded on:</span>
                          <span className="value">{formatDate(booking.damageDepositRefundDate)}</span>
                        </div>
                      )}
                      {booking.damageDepositRefundId && (
                        <div className="deposit-detail-row">
                          <span className="label">Refund ID:</span>
                          <span className="value refund-id">{booking.damageDepositRefundId}</span>
                        </div>
                      )}
                    </>
                  )}

                  {booking.damageDepositStatus === 'forfeited' && booking.damageDepositNotes && (
                    <div className="deposit-detail-row">
                      <span className="label">Reason:</span>
                      <span className="value">{booking.damageDepositNotes}</span>
                    </div>
                  )}
                </div>

                {booking.damageDepositStatus === 'held' && (
                  <div className="deposit-card-actions">
                    <button
                      className="deposit-btn deposit-btn-danger deposit-btn-sm"
                      onClick={() => handleForfeitClick(booking)}
                      disabled={processingBookingId === booking._id}
                    >
                      {processingBookingId === booking._id ? '⏳' : '🔴'} Forfeit
                    </button>
                    <button
                      className="deposit-btn deposit-btn-success deposit-btn-sm"
                      onClick={() => handleManualRefund(booking)}
                      disabled={processingBookingId === booking._id}
                    >
                      {processingBookingId === booking._id ? '⏳' : '✅'} Refund Now
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {selectedBooking && (
        <ForfeitModal
          isOpen={forfeitModalOpen}
          onClose={() => setForfeitModalOpen(false)}
          onConfirm={handleForfeitConfirm}
          bookingId={selectedBooking._id}
          customerName={getCustomerName(selectedBooking)}
          depositAmount={selectedBooking.damageDepositCents || 0}
        />
      )}
    </div>
  );
};

export default DepositManagement;
