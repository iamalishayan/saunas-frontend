import React, { useState, useEffect } from 'react';
import { getUserById } from '../../services/api';
import { User, Booking } from '../../types';
import './UserDetailsModal.css';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface UserStatistics {
  totalBookings: number;
  confirmedBookings: number;
  totalSpent: number;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, onClose, userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getUserById(userId);
      setUser(response.user);
      setStatistics(response.statistics);
      setBookings(response.bookings);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load user details');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const getRoleBadgeClass = (role: string): string => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'badge badge--admin';
      case 'staff':
        return 'badge badge--staff';
      default:
        return 'badge badge--user';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="user-details-modal">
        <div className="modal-header">
          <h2>User Details</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading user details...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={fetchUserDetails}>Retry</button>
            </div>
          ) : user ? (
            <>
              {/* User Profile Section */}
              <div className="user-profile-section">
                <div className="profile-header">
                  <div className="profile-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="profile-info">
                    <h3>{user.name}</h3>
                    <p className="user-email">{user.email}</p>
                    {user.phone && <p className="user-phone">📞 {user.phone}</p>}
                    <div className="profile-badges">
                      <span className={getRoleBadgeClass(user.role)}>{user.role}</span>
                      <span className={`status-badge ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {user.isEmailVerified ? (
                        <span className="verified-badge">✓ Email Verified</span>
                      ) : (
                        <span className="unverified-badge">✗ Email Not Verified</span>
                      )}
                    </div>
                    <p className="user-joined">Joined {formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Statistics Section */}
              {statistics && (
                <div className="statistics-section">
                  <h3>Statistics</h3>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon">📊</div>
                      <div className="stat-content">
                        <div className="stat-value">{statistics.totalBookings}</div>
                        <div className="stat-label">Total Bookings</div>
                      </div>
                    </div>
                    
                    <div className="stat-card">
                      <div className="stat-icon">✅</div>
                      <div className="stat-content">
                        <div className="stat-value">{statistics.confirmedBookings}</div>
                        <div className="stat-label">Confirmed Bookings</div>
                      </div>
                    </div>
                    
                    <div className="stat-card">
                      <div className="stat-icon">💰</div>
                      <div className="stat-content">
                        <div className="stat-value">${statistics.totalSpent.toFixed(2)}</div>
                        <div className="stat-label">Total Revenue</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Booking History Section */}
              <div className="bookings-section">
                <h3>Booking History ({bookings.length})</h3>
                {bookings.length === 0 ? (
                  <div className="no-bookings">
                    <p>No bookings found for this user.</p>
                  </div>
                ) : (
                  <div className="bookings-table-container">
                    <table className="bookings-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Trip/Vessel</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map(booking => (
                          <tr key={booking._id}>
                            <td>{formatDate(booking.createdAt)}</td>
                            <td>
                              {booking.trip && typeof booking.trip === 'object' ? (
                                <div className="booking-info">
                                  <strong>{booking.trip.title}</strong>
                                  <small>{formatDate(booking.trip.departureTime)}</small>
                                </div>
                              ) : booking.vessel && typeof booking.vessel === 'object' ? (
                                <div className="booking-info">
                                  <strong>{booking.vessel.name}</strong>
                                  {booking.startDate && booking.endDate && (
                                    <small>{booking.startDate} to {booking.endDate}</small>
                                  )}
                                </div>
                              ) : (
                                <span>N/A</span>
                              )}
                            </td>
                            <td>
                              {booking.trip ? (
                                <span className="type-badge type-trip">Trip</span>
                              ) : booking.vessel && typeof booking.vessel === 'object' && booking.vessel.type === 'mobile_sauna' ? (
                                <span className="type-badge type-sauna">Mobile Sauna</span>
                              ) : (
                                <span className="type-badge type-rental">Rental</span>
                              )}
                            </td>
                            <td>
                              <span className={`status-badge ${getStatusClass(booking.status)}`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="amount-cell">
                              {formatPrice(booking.totalPriceCents)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
