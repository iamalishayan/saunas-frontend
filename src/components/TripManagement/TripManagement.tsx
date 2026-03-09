import React, { useState, useEffect, useMemo } from 'react';
import { createTrip, listTrips, updateTrip, deleteTrip, notifyTripStaff, listVessels, getStaffMembers } from '../../services/api';
import { Trip, TripFormData, Vessel, User } from '../../types';
import './TripManagement.css';

interface TripManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const TripManagement: React.FC<TripManagementProps> = ({ isOpen, onClose }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [staffMembers, setStaffMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingTrip, setProcessingTrip] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [formData, setFormData] = useState<TripFormData>({
    vesselId: '',
    departureTime: '',
    durationMinutes: 180,
    assignedStaff: []
  });

  // Derive the selected vessel's type to conditionally show/hide fields
  const selectedVessel = useMemo(
    () => vessels.find(v => v._id === formData.vesselId),
    [vessels, formData.vesselId]
  );
  const isMobileSauna = selectedVessel?.type === 'mobile_sauna';

  useEffect(() => {
    if (isOpen) {
      fetchTrips();
      fetchVessels();
      fetchStaffMembers();
    }
  }, [isOpen]);

  const fetchTrips = async (showLoader: boolean = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await listTrips();
      setTrips(response);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trips');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const fetchVessels = async () => {
    try {
      const response = await listVessels();
      setVessels(response);
    } catch (err: any) {
      console.error('Error fetching vessels:', err);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const response = await getStaffMembers();
      const staffList = response.staff || response;
      setStaffMembers(Array.isArray(staffList) ? staffList : []);
    } catch (err: any) {
      console.error('Error fetching staff members:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      vesselId: '',
      departureTime: '',
      durationMinutes: 180,
      assignedStaff: []
    });
    setEditingTrip(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingTrip('form');
    setError(null);
    
    try {
      if (editingTrip) {
        await updateTrip(editingTrip._id, formData);
        await fetchTrips(false);
        setSuccessMessage('Trip updated successfully');
      } else {
        await createTrip(formData);
        await fetchTrips(false);
        setSuccessMessage('Trip created successfully');
      }
      
      resetForm();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save trip');
    } finally {
      setProcessingTrip(null);
    }
  };

  const handleEdit = (trip: Trip) => {
    setFormData({
      vesselId: trip.vessel?._id || '',
      title: trip.title || '',
      departureTime: trip.departureTime
        ? new Date(trip.departureTime).toISOString().slice(0, -1)
        : '',
      durationMinutes: trip.durationMinutes || 180,
      assignedStaff: trip.assignedStaff?.map(staff => staff._id) || []
    });
    setEditingTrip(trip);
    setShowCreateForm(true);
  };

  const handleDelete = async (trip: Trip) => {
    if (!confirm(`Are you sure you want to delete the trip "${trip.title || 'this trip'}"?`)) {
      return;
    }

    setProcessingTrip(trip._id);
    setError(null);

    try {
      await deleteTrip(trip._id);
      setTrips(prevTrips => prevTrips.filter(t => t._id !== trip._id));
      setSuccessMessage('Trip deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete trip');
    } finally {
      setProcessingTrip(null);
    }
  };

  const handleNotifyStaff = async (trip: Trip) => {
    if (!trip.assignedStaff || trip.assignedStaff.length === 0) {
      setError('No staff assigned to this trip');
      return;
    }

    setProcessingTrip(trip._id);
    setError(null);

    try {
      await notifyTripStaff(trip._id);
      setSuccessMessage('Staff notifications sent successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to notify staff');
    } finally {
      setProcessingTrip(null);
    }
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins  = minutes % 60;
    if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    return `${mins}m`;
  };

  const handleStaffSelection = (staffId: string, isSelected: boolean) => {
    setFormData(prev => ({
      ...prev,
      assignedStaff: isSelected
        ? [...prev.assignedStaff, staffId]
        : prev.assignedStaff.filter(id => id !== staffId)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="trip-management-overlay">
      <div className="trip-management-container">
        <div className="trip-management-header">
          <h2>Trip Management</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="trip-management-content">
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}

          <button
            className="create-trip-btn"
            onClick={() => setShowCreateForm(true)}
          >
            + Add New Trip
          </button>

          {showCreateForm && (
            <div className="trip-form-container">
              <h3>{editingTrip ? 'Edit Trip' : 'Create New Trip'}</h3>
              <form onSubmit={handleSubmit} className="trip-form">
                <div className="form-row">
                  {/* Vessel selector — always shown */}
                  <div className="form-group">
                    <label htmlFor="vessel">Vessel *</label>
                    <select
                      id="vessel"
                      value={formData.vesselId}
                      onChange={(e) => setFormData(prev => ({ ...prev, vesselId: e.target.value }))}
                      required
                    >
                      <option value="">Select a vessel</option>
                      {vessels.map(vessel => (
                        <option key={vessel._id} value={vessel._id}>
                          {vessel.name || 'Unnamed Vessel'} - {vessel.capacity || 0} capacity
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Departure Time — hidden for mobile saunas */}
                  {!isMobileSauna && (
                    <div className="form-group">
                      <label htmlFor="departureTime">Departure Time *</label>
                      <input
                        type="datetime-local"
                        id="departureTime"
                        value={formData.departureTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="form-row">
                  {/* Duration — hidden for mobile saunas */}
                  {!isMobileSauna && (
                    <div className="form-group">
                      <label htmlFor="durationMinutes">Duration (minutes) *</label>
                      <input
                        type="number"
                        id="durationMinutes"
                        value={formData.durationMinutes}
                        onChange={(e) => setFormData(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) || 180 }))}
                        min="30"
                        max="600"
                        required
                      />
                    </div>
                  )}

                  {/* Info banner for mobile sauna */}
                  {isMobileSauna && (
                    <div className="form-group form-group--full">
                      <div className="mobile-sauna-info-banner">
                        <span>🛖</span>
                        <div>
                          <strong>Mobile Sauna Availability Slot</strong>
                          <p>No fixed departure or duration needed — customers set their own rental dates when booking.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {editingTrip && (
                    <div className="form-group">
                      <label htmlFor="title">Trip Title</label>
                      <input
                        type="text"
                        id="title"
                        value={formData.title || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Leave empty for auto-generated title"
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Assigned Staff</label>
                  <div className="staff-selection">
                    {staffMembers.map(staff => (
                      <label key={staff._id} className="staff-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.assignedStaff.includes(staff._id)}
                          onChange={(e) => handleStaffSelection(staff._id, e.target.checked)}
                        />
                        <span>{staff.name} ({staff.email})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={resetForm}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={processingTrip === 'form'}
                  >
                    {processingTrip === 'form'
                      ? 'Saving...'
                      : editingTrip ? 'Update Trip' : 'Create Trip'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="loading">Loading trips...</div>
          ) : (
            <>
              <div className="trips-summary">{trips.length} trips found</div>

              <div className="trips-table-container">
                <table className="trips-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Vessel</th>
                      <th>Departure</th>
                      <th>Duration</th>
                      <th>Capacity</th>
                      <th>Available Seats</th>
                      <th>Staff</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="no-results">No trips found</td>
                      </tr>
                    ) : (
                      trips.map(trip => {
                        const tripIsMobileSauna = trip.vessel?.type === 'mobile_sauna';
                        return (
                          <tr key={trip._id}>
                            <td className="trip-title">{trip.title || 'Untitled Trip'}</td>
                            <td>
                              <div className="vessel-info">
                                <span className="vessel-name">{trip.vessel?.name || 'Unknown Vessel'}</span>
                                <span className="vessel-type">{trip.vessel?.type || 'boat'}</span>
                              </div>
                            </td>
                            <td className="departure-time">
                              {tripIsMobileSauna
                                ? <span className="na-text">Rental</span>
                                : trip.departureTime ? formatDateTime(trip.departureTime) : '—'}
                            </td>
                            <td className="duration">
                              {tripIsMobileSauna
                                ? <span className="na-text">Flexible</span>
                                : formatDuration(trip.durationMinutes || 180)}
                            </td>
                            <td className="capacity">
                              {trip.vessel?.capacity || trip.capacity || 0}
                            </td>
                            <td className="remaining-seats">
                              <span className={`seats ${trip.remainingSeats === 0 ? 'full' : ''}`}>
                                {trip.remainingSeats || 0}
                              </span>
                            </td>
                            <td className="staff-info">
                              <div className="staff-count">
                                {trip.assignedStaff?.length || 0} staff
                                {trip.staffNotified && <span className="notified-badge">✓</span>}
                              </div>
                            </td>
                            <td className="actions-cell">
                              <button
                                className="action-btn edit-btn"
                                onClick={() => handleEdit(trip)}
                                title="Edit Trip"
                              >Edit</button>
                              <button
                                className="action-btn notify-btn"
                                onClick={() => handleNotifyStaff(trip)}
                                disabled={processingTrip === trip._id || !trip.assignedStaff?.length}
                                title="Notify Staff"
                              >
                                {processingTrip === trip._id ? '...' : 'Notify'}
                              </button>
                              <button
                                className="action-btn delete-btn"
                                onClick={() => handleDelete(trip)}
                                disabled={processingTrip === trip._id}
                                title="Delete Trip"
                              >
                                {processingTrip === trip._id ? '...' : 'Delete'}
                              </button>
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

export default TripManagement;
