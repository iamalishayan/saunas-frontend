import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { getDashboardStats } from '../services/api';
import { DashboardStats } from '../types';
import UserManagement from '../components/UserManagement/UserManagement';
import BlogManagement from '../components/BlogManagement/BlogManagement';
import VesselManagement from '../components/VesselManagement/VesselManagement';
import TripManagement from '../components/TripManagement/TripManagement';
import BookingManagement from '../components/BookingManagement/BookingManagement';
import MobileSaunaManagement from '../components/MobileSaunaManagement/MobileSaunaManagement';
import DepositManagement from '../components/DepositManagement/DepositManagement';
import ContactManagement from '../components/ContactManagement/ContactManagement';
import StaffManagement from '../components/StaffManagement/StaffManagement';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState<boolean>(false);
  const [isBlogManagementOpen, setIsBlogManagementOpen] = useState<boolean>(false);
  const [isVesselManagementOpen, setIsVesselManagementOpen] = useState<boolean>(false);
  const [isTripManagementOpen, setIsTripManagementOpen] = useState<boolean>(false);
  const [isBookingManagementOpen, setIsBookingManagementOpen] = useState<boolean>(false);
  const [isMobileSaunaManagementOpen, setIsMobileSaunaManagementOpen] = useState<boolean>(false);
  const [isDepositManagementOpen, setIsDepositManagementOpen] = useState<boolean>(false);
  const [isContactManagementOpen, setIsContactManagementOpen] = useState<boolean>(false);
  const [isStaffManagementOpen, setIsStaffManagementOpen]     = useState<boolean>(false);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to fetch dashboard stats:', err);
        setError(err.message || 'Failed to load dashboard statistics');
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Redirect if not authenticated or not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {user?.name}! Manage your sauna business from here.</p>
          </div>
          <div className="dashboard-meta">
            <span className="admin-badge">Administrator</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="dashboard-stats">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading dashboard statistics...</p>
            </div>
          ) : error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : stats ? (
            <>
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>Total Bookings</h3>
                  <p className="stat-number">{stats.summary.totalBookings}</p>
                  <span className="stat-change positive">
                    {stats.summary.confirmedBookings} confirmed
                  </span>
                </div>
              </div>
  
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>Service Utilization</h3>
                  <p className="stat-number">
                    {stats.tripUtilization.length} {stats.tripUtilization.length === 1 ? 'trip' : 'trips'}
                  </p>
                  <span className="stat-change neutral">
                    {stats.tripUtilization[0]?.utilization}% booked
                  </span>
                </div>
              </div>
  
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.98 1.98 0 0 0 18.1 7c-.8 0-1.54.5-1.85 1.26l-1.92 5.75c-.25.74.16 1.54.91 1.79.75.25 1.54-.16 1.79-.91l.67-2.01L18 11l1.5 7v4h.5zM12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2.5 16v-7H6l-2.24-7.4A1.98 1.98 0 0 0 1.9 6.4c-.8 0-1.54.5-1.85 1.26L.92 9.75c-.25.74.16 1.54.91 1.79.75.25 1.54-.16 1.79-.91L4.5 8.5 6 11v7h2z"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>Total Users</h3>
                  <p className="stat-number">{stats.summary.totalUsers}</p>
                  <span className="stat-change positive">Active accounts</span>
                </div>
              </div>
  
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="stat-content">
                  <h3>Revenue</h3>
                  <p className="stat-number">${stats.summary.totalRevenue.toFixed(2)}</p>
                  <span className="stat-change positive">From {stats.summary.confirmedBookings} bookings</span>
                </div>
              </div>
            </>
          ) : (
            <div className="error-message">
              <p>No data available</p>
            </div>
          )}
        </div>

        {/* Management Sections */}
        <div className="dashboard-sections">
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Actions</h2>
              <p>Administrative tasks</p>
            </div>
            <div className="action-grid">

              <button className="action-card" onClick={() => setIsVesselManagementOpen(true)}>
                <div className="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2v-7l-2.29-2.29c-.94-.94-2.23-1.71-3.71-1.71s-2.77.77-3.71 1.71L6 12v7zm6-11c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3>Vessel Management</h3>
                  <p>Manage boats and vessels</p>
                </div>
              </button>

              <button className="action-card" onClick={() => setIsTripManagementOpen(true)}>
                <div className="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2.5-9H19V1h-2v1H7V1H5v1H3.5C2.67 2 2 2.67 2 3.5v13C2 17.33 2.67 18 3.5 18h17c.83 0 1.5-.67 1.5-1.5v-13C22 2.67 21.33 2 20.5 2zm0 14.5h-17v-11h17v11z"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3>Trip Management</h3>
                  <p>Schedule and manage trips</p>
                </div>
              </button>

              <button className="action-card" onClick={() => setIsBookingManagementOpen(true)}>
                <div className="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3>Booking Management</h3>
                  <p>Manage customer bookings</p>
                </div>
              </button>

              <button className="action-card" onClick={() => setIsMobileSaunaManagementOpen(true)}>
                <div className="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3>Mobile Sauna Management</h3>
                  <p>Manage mobile sauna bookings</p>
                </div>
              </button>

              <button className="action-card" onClick={() => setIsDepositManagementOpen(true)}>
                <div className="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3>Deposit Management</h3>
                  <p>Manage security deposits</p>
                </div>
              </button>

              <button className="action-card" onClick={() => setIsUserManagementOpen(true)}>
                <div className="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3>User Management</h3>
                  <p>Manage customer accounts</p>
                </div>
              </button>

              <button className="action-card" onClick={() => setIsBlogManagementOpen(true)}>
                <div className="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3>Blog Management</h3>
                  <p>Create and manage blog posts</p>
                </div>
              </button>

              <button className="action-card" onClick={() => setIsStaffManagementOpen(true)}>
                <div className="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3>Staff Management</h3>
                  <p>Add and manage staff members</p>
                </div>
              </button>

              <button className="action-card" onClick={() => setIsContactManagementOpen(true)}>
                <div className="action-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <div className="action-content">
                  <h3>Contact Inquiries</h3>
                  <p>Manage contact form submissions</p>
                </div>
              </button>

            </div>
          </div>

          <div className="dashboard-section">
            <div className="section-header">
              <h2>Trip Utilization</h2>
              <p>Current trip booking statistics</p>
            </div>
            
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading trip utilization data...</p>
              </div>
            ) : error ? (
              <div className="error-message">
                <p>{error}</p>
              </div>
            ) : stats && stats.tripUtilization.filter(trip => !trip.title.includes('Available for Rental')).length > 0 ? (
              <div className="trip-utilization">
                {stats.tripUtilization.filter(trip => !trip.title.includes('Available for Rental')).map((trip, index) => (
                  <div key={index} className="trip-card">
                    <h3>{trip.title}</h3>
                    <div className="trip-stats">
                      <div className="trip-stat">
                        <span className="stat-label">Capacity</span>
                        <span className="stat-value">{trip.capacity}</span>
                      </div>
                      <div className="trip-stat">
                        <span className="stat-label">Booked</span>
                        <span className="stat-value">{trip.booked}</span>
                      </div>
                      <div className="trip-stat">
                        <span className="stat-label">Available</span>
                        <span className="stat-value">{trip.capacity - trip.booked}</span>
                      </div>
                    </div>
                    <div className="utilization-bar-container">
                      <div 
                        className="utilization-bar" 
                        style={{ width: `${trip.utilization}%` }}
                      ></div>
                      <span className="utilization-percentage">{trip.utilization}% Booked</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <p>No regular trip data available</p>
              </div>
            )}
          </div>

          {/* Mobile Sauna Utilization Section */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Mobile Sauna Statistics</h2>
              <p>Mobile sauna rental booking statistics</p>
            </div>
            
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading mobile sauna data...</p>
              </div>
            ) : error ? (
              <div className="error-message">
                <p>{error}</p>
              </div>
            ) : stats && stats.mobileSaunaUtilization && stats.mobileSaunaUtilization.length > 0 ? (
              <div className="mobile-sauna-utilization">
                {stats.mobileSaunaUtilization.map((sauna, index) => (
                  <div key={index} className="sauna-card">
                    <h3>{sauna.name}</h3>
                    <div className="sauna-stats-grid">
                      <div className="sauna-stat">
                        <span className="stat-label">Capacity</span>
                        <span className="stat-value">{sauna.capacity}</span>
                      </div>
                      <div className="sauna-stat">
                        <span className="stat-label">Total Bookings</span>
                        <span className="stat-value">{sauna.totalBookings}</span>
                      </div>
                      <div className="sauna-stat">
                        <span className="stat-label">Confirmed</span>
                        <span className="stat-value confirmed">{sauna.confirmedBookings}</span>
                      </div>
                      <div className="sauna-stat">
                        <span className="stat-label">Pending</span>
                        <span className="stat-value pending">{sauna.pendingBookings}</span>
                      </div>
                      <div className="sauna-stat">
                        <span className="stat-label">Cancelled</span>
                        <span className="stat-value cancelled">{sauna.cancelledBookings}</span>
                      </div>
                      <div className="sauna-stat">
                        <span className="stat-label">Revenue</span>
                        <span className="stat-value revenue">${(sauna.totalRevenue).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="additional-stats">
                      <div className="days-stat">
                        <span className="stat-label">Total Days Booked</span>
                        <span className="stat-value">{sauna.totalDaysBooked}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <p>No mobile sauna utilization data available</p>
              </div>
            )}
          </div>
          
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Activity</h2>
              <p>Latest system activity</p>
            </div>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="activity-content">
                  <p><strong>System Status:</strong> All services are running normally</p>
                  <span className="activity-time">Just now</span>
                </div>
              </div>
              
              {stats && (
                <div className="activity-item">
                  <div className="activity-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                    </svg>
                  </div>
                  <div className="activity-content">
                    <p><strong>Stats Updated:</strong> Dashboard data refreshed</p>
                    <span className="activity-time">Just now</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Vessel Management Modal */}
      <VesselManagement 
        isOpen={isVesselManagementOpen} 
        onClose={() => setIsVesselManagementOpen(false)} 
      />

      {/* Trip Management Modal */}
      <TripManagement 
        isOpen={isTripManagementOpen} 
        onClose={() => setIsTripManagementOpen(false)} 
      />

      {/* Booking Management Modal */}
      <BookingManagement 
        isOpen={isBookingManagementOpen} 
        onClose={() => setIsBookingManagementOpen(false)} 
      />

      {/* User Management Modal */}
      <UserManagement 
        isOpen={isUserManagementOpen} 
        onClose={() => setIsUserManagementOpen(false)} 
      />

      {/* Blog Management Modal */}
      <BlogManagement 
        isOpen={isBlogManagementOpen} 
        onClose={() => setIsBlogManagementOpen(false)} 
      />

      {/* Mobile Sauna Management Modal */}
      <MobileSaunaManagement 
        isOpen={isMobileSaunaManagementOpen} 
        onClose={() => setIsMobileSaunaManagementOpen(false)} 
      />

      {/* Deposit Management Modal */}
      <DepositManagement 
        isOpen={isDepositManagementOpen} 
        onClose={() => setIsDepositManagementOpen(false)} 
      />

      {/* Contact Management Modal */}
      <ContactManagement 
        isOpen={isContactManagementOpen} 
        onClose={() => setIsContactManagementOpen(false)} 
      />

      {/* Staff Management Modal */}
      <StaffManagement
        isOpen={isStaffManagementOpen}
        onClose={() => setIsStaffManagementOpen(false)}
      />

    </div>
  );
};

export default AdminDashboard;