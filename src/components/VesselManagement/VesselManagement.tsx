import React, { useState, useEffect } from 'react';
import { createVessel, listVessels, updateVessel, deleteVessel, updateVesselCapacity } from '../../services/api';
import { Vessel, VesselFormData } from '../../types';
import BookedDatesCalendar from './BookedDatesCalendar';
import './VesselManagement.css';

interface VesselManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const VesselManagement: React.FC<VesselManagementProps> = ({ isOpen, onClose }) => {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingVessel, setProcessingVessel] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [editingVessel, setEditingVessel] = useState<Vessel | null>(null);
  const [calendarVessel, setCalendarVessel] = useState<{ id: string; name: string } | null>(null);
  const [editingCapacity, setEditingCapacity] = useState<string | null>(null);
  const [tempCapacity, setTempCapacity] = useState<number>(0);
  const [formData, setFormData] = useState<VesselFormData>({
    name: '',
    type: 'boat',
    capacity: 1,
    basePriceCents: 5000,
    minimumDays: 1,
    discountThreshold: 7,
    discountPercent: 0,
    inventory: 1,
    pickupDropoffDay: 5,
    pricingTiers: {
      days1to3: 0,
      day4: 0,
      day5: 0,
      day6: 0,
      day7: 0
    }
  });

  useEffect(() => {
    if (isOpen) {
      fetchVessels();
    }
  }, [isOpen]);

  const fetchVessels = async () => {
    setLoading(true);
    try {
      const response = await listVessels();
      setVessels(response);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load vessels');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'boat',
      capacity: 1,
      basePriceCents: 5000,
      minimumDays: 1,
      discountThreshold: 7,
      discountPercent: 0,
      inventory: 1,
      pickupDropoffDay: 5,
      pricingTiers: {
        days1to3: 0,
        day4: 0,
        day5: 0,
        day6: 0,
        day7: 0
      }
    });
    setEditingVessel(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingVessel('form');
    setError(null);
    
    try {
      if (editingVessel) {
        const updatedVessel = await updateVessel(editingVessel._id, formData);
        setVessels(prevVessels => prevVessels.map(v => 
          v._id === editingVessel._id ? updatedVessel : v
        ));
        setSuccessMessage('Vessel updated successfully');
      } else {
        const newVessel = await createVessel(formData);
        setVessels(prevVessels => [newVessel, ...prevVessels]);
        setSuccessMessage('Vessel created successfully');
      }
      
      resetForm();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save vessel');
    } finally {
      setProcessingVessel(null);
    }
  };

  const handleEdit = (vessel: Vessel) => {
    setFormData({
      name: vessel.name || '',
      type: vessel.type || 'boat',
      capacity: vessel.capacity,
      basePriceCents: vessel.basePriceCents || 5000,
      minimumDays: vessel.minimumDays || 1,
      discountThreshold: vessel.discountThreshold || 7,
      discountPercent: vessel.discountPercent || 0,
      inventory: vessel.inventory || 1,
      pickupDropoffDay: vessel.pickupDropoffDay !== undefined ? vessel.pickupDropoffDay : 5,
      pricingTiers: vessel.pricingTiers || {
        days1to3: 0,
        day4: 0,
        day5: 0,
        day6: 0,
        day7: 0
      }
    });
    setEditingVessel(vessel);
    setShowCreateForm(true);
  };

  const handleDelete = async (vessel: Vessel) => {
    if (!confirm(`Are you sure you want to delete "${vessel.name || 'this vessel'}"?`)) {
      return;
    }

    setProcessingVessel(vessel._id);
    setError(null);
    
    try {
      await deleteVessel(vessel._id);
      setVessels(prevVessels => prevVessels.filter(v => v._id !== vessel._id));
      setSuccessMessage('Vessel deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete vessel');
    } finally {
      setProcessingVessel(null);
    }
  };

  const handleShowCalendar = (vessel: Vessel) => {
    setCalendarVessel({ id: vessel._id, name: vessel.name });
  };

  const handleCapacityEditStart = (vessel: Vessel) => {
    setEditingCapacity(vessel._id);
    setTempCapacity(vessel.capacity || 1);
  };

  const handleCapacityEditCancel = () => {
    setEditingCapacity(null);
    setTempCapacity(0);
  };

  const handleCapacitySave = async (vesselId: string) => {
    if (tempCapacity < 1) {
      setError('Capacity must be at least 1');
      return;
    }

    setProcessingVessel(vesselId);
    setError(null);

    try {
      await updateVesselCapacity(vesselId, tempCapacity);
      setVessels(prevVessels =>
        prevVessels.map(v =>
          v._id === vesselId ? { ...v, capacity: tempCapacity } : v
        )
      );
      setEditingCapacity(null);
      setSuccessMessage('Capacity updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update capacity');
    } finally {
      setProcessingVessel(null);
    }
  };

  const formatPrice = (cents: number): string => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="vessel-management-modal">
        <div className="modal-header">
          <h2>Vessel Management</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-content">
          {/* Action Bar */}
          <div className="action-bar">
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              + Add New Vessel
            </button>
          </div>

          {/* Create/Edit Form */}
          {showCreateForm && (
            <div className="vessel-form-section">
              <h3>{editingVessel ? 'Edit Vessel' : 'Add New Vessel'}</h3>
              <form onSubmit={handleSubmit} className="vessel-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="name">Vessel Name *</label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Sauna Boat 1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="type">Vessel Type *</label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value as 'boat' | 'trailer' | 'mobile_sauna'})}
                      required
                    >
                      <option value="boat">Boat</option>
                      <option value="trailer">Trailer</option>
                      <option value="mobile_sauna">Mobile Sauna</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="inventory">Inventory (Units Available) *</label>
                    <input
                      type="number"
                      id="inventory"
                      min="1"
                      max="100"
                      value={formData.inventory || 1}
                      onChange={(e) => setFormData({...formData, inventory: parseInt(e.target.value)})}
                      placeholder="e.g., 1 for single unit, 3 for multiple"
                      required
                    />
                    <small className="field-hint">Total number of identical units available for rental</small>
                  </div>

                  {/* Capacity field - shown for all types but optional for mobile_sauna */}
                  {formData.type !== 'mobile_sauna' && (
                    <div className="form-group">
                      <label htmlFor="capacity">Capacity (People) *</label>
                      <input
                        type="number"
                        id="capacity"
                        min="1"
                        max="50"
                        value={formData.capacity || 1}
                        onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                  )}

                  {formData.type === 'mobile_sauna' && (
                    <div className="form-group">
                      <label htmlFor="capacity">Capacity (People)</label>
                      <input
                        type="number"
                        id="capacity"
                        min="1"
                        max="20"
                        value={formData.capacity || 4}
                        onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                        placeholder="e.g., 4 for Small Barrel, 10 for Large Luxury"
                      />
                      <small className="field-hint">Comfortable capacity for this mobile sauna</small>
                    </div>
                  )}

                  {/* Mobile Sauna Specific Fields */}
                  {formData.type === 'mobile_sauna' && (
                    <>
                      <div className="form-group">
                        <label htmlFor="minimumDays">Minimum Rental Days *</label>
                        <input
                          type="number"
                          id="minimumDays"
                          min="1"
                          max="30"
                          value={formData.minimumDays || 1}
                          onChange={(e) => setFormData({...formData, minimumDays: parseInt(e.target.value)})}
                          required
                        />
                        <small className="field-hint">Minimum days required for rental</small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="discountThreshold">Discount Threshold (Days)</label>
                        <input
                          type="number"
                          id="discountThreshold"
                          min="0"
                          max="30"
                          value={formData.discountThreshold || 7}
                          onChange={(e) => setFormData({...formData, discountThreshold: parseInt(e.target.value)})}
                          placeholder="e.g., 7 for discount on 7+ days"
                        />
                        <small className="field-hint">Days threshold to trigger discount (0 = no discount)</small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="discountPercent">Discount Percentage (%)</label>
                        <input
                          type="number"
                          id="discountPercent"
                          min="0"
                          max="100"
                          value={formData.discountPercent || 0}
                          onChange={(e) => setFormData({...formData, discountPercent: parseInt(e.target.value)})}
                          placeholder="e.g., 20 for 20% off"
                        />
                        <small className="field-hint">Percentage discount for 7+ day rentals</small>
                      </div>

                      {/* Tiered Pricing Section */}
                      <div className="form-section-title">
                        <h4>Tiered Pricing (Total Price in Cents)</h4>
                        <p className="section-description">Set total rental prices for different day ranges</p>
                      </div>

                      <div className="form-group">
                        <label htmlFor="days1to3">1-3 Days Total Price (Cents) *</label>
                        <input
                          type="number"
                          id="days1to3"
                          min="0"
                          step="100"
                          value={formData.pricingTiers?.days1to3 || 0}
                          onChange={(e) => setFormData({
                            ...formData, 
                            pricingTiers: {...formData.pricingTiers!, days1to3: parseInt(e.target.value)}
                          })}
                          placeholder="e.g., 60000 = $600.00"
                          required
                        />
                        <small className="price-helper">
                          Total: {formatPrice(formData.pricingTiers?.days1to3 || 0)}
                        </small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="day4">4 Days Total Price (Cents) *</label>
                        <input
                          type="number"
                          id="day4"
                          min="0"
                          step="100"
                          value={formData.pricingTiers?.day4 || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            pricingTiers: {...formData.pricingTiers!, day4: parseInt(e.target.value)}
                          })}
                          placeholder="e.g., 75000 = $750.00"
                          required
                        />
                        <small className="price-helper">
                          Total: {formatPrice(formData.pricingTiers?.day4 || 0)}
                        </small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="day5">5 Days Total Price (Cents) *</label>
                        <input
                          type="number"
                          id="day5"
                          min="0"
                          step="100"
                          value={formData.pricingTiers?.day5 || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            pricingTiers: {...formData.pricingTiers!, day5: parseInt(e.target.value)}
                          })}
                          placeholder="e.g., 90000 = $900.00"
                          required
                        />
                        <small className="price-helper">
                          Total: {formatPrice(formData.pricingTiers?.day5 || 0)}
                        </small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="day6">6 Days Total Price (Cents) *</label>
                        <input
                          type="number"
                          id="day6"
                          min="0"
                          step="100"
                          value={formData.pricingTiers?.day6 || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            pricingTiers: {...formData.pricingTiers!, day6: parseInt(e.target.value)}
                          })}
                          placeholder="e.g., 105000 = $1,050.00"
                          required
                        />
                        <small className="price-helper">
                          Total: {formatPrice(formData.pricingTiers?.day6 || 0)}
                        </small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="day7">7 Days Total Price (Cents) *</label>
                        <input
                          type="number"
                          id="day7"
                          min="0"
                          step="100"
                          value={formData.pricingTiers?.day7 || 0}
                          onChange={(e) => setFormData({
                            ...formData,
                            pricingTiers: {...formData.pricingTiers!, day7: parseInt(e.target.value)}
                          })}
                          placeholder="e.g., 120000 = $1,200.00"
                          required
                        />
                        <small className="price-helper">
                          Total: {formatPrice(formData.pricingTiers?.day7 || 0)}
                        </small>
                      </div>
                    </>
                  )}

                  {/* Base Price - Only for boat/trailer */}
                  {formData.type !== 'mobile_sauna' && (
                    <div className="form-group">
                      <label htmlFor="basePriceCents">Base Price (Cents) *</label>
                      <input
                        type="number"
                        id="basePriceCents"
                        min="0"
                        step="100"
                        value={formData.basePriceCents}
                        onChange={(e) => setFormData({...formData, basePriceCents: parseInt(e.target.value)})}
                        placeholder="5000 = $50.00"
                        required
                      />
                      <small className="price-helper">
                        Price: {formatPrice(formData.basePriceCents || 0)}
                      </small>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={processingVessel === 'form'}
                  >
                    {processingVessel === 'form' ? 'Saving...' : (editingVessel ? 'Update Vessel' : 'Create Vessel')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {successMessage && (
            <div className="success-message">
              <p>{successMessage}</p>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading vessels...</p>
            </div>
          ) : (
            <>
              <div className="vessels-count">
                <strong>{vessels.length}</strong> vessels found
              </div>
              
              <div className="vessels-table-container">
                <table className="vessels-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Inventory</th>
                      <th>Capacity</th>
                      <th>Pricing</th>
                      <th>Details</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vessels.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="no-results">No vessels found</td>
                      </tr>
                    ) : (
                      vessels.map(vessel => (
                        <tr key={vessel._id}>
                          <td className="vessel-name">{vessel.name || 'Unnamed Vessel'}</td>
                          <td>
                            <span className={`type-badge type-${vessel.type || 'boat'}`}>
                              {vessel.type === 'mobile_sauna' ? 'Mobile Sauna' : 
                               vessel.type ? vessel.type.replace('-', ' ') : 'boat'}
                            </span>
                          </td>
                          <td className="inventory-cell">
                            <span className="inventory-number">{vessel.inventory || 1}</span>
                            <span className="inventory-label">units</span>
                          </td>
                          <td className="capacity-cell">
                            {editingCapacity === vessel._id ? (
                              <div className="capacity-edit-inline">
                                <input
                                  type="number"
                                  min="1"
                                  value={tempCapacity}
                                  onChange={(e) => setTempCapacity(parseInt(e.target.value) || 1)}
                                  className="capacity-input"
                                  autoFocus
                                />
                                <button 
                                  className="capacity-save-btn"
                                  onClick={() => handleCapacitySave(vessel._id)}
                                  disabled={processingVessel === vessel._id}
                                  title="Save"
                                >
                                  ✓
                                </button>
                                <button 
                                  className="capacity-cancel-btn"
                                  onClick={handleCapacityEditCancel}
                                  title="Cancel"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : vessel.capacity ? (
                              <div className="capacity-display" onClick={() => handleCapacityEditStart(vessel)}>
                                <span className="capacity-number">{vessel.capacity}</span>
                                <span className="capacity-label">people</span>
                                <span className="capacity-edit-hint">✏️</span>
                              </div>
                            ) : (
                              <span className="capacity-label">N/A</span>
                            )}
                          </td>
                          <td className="price-cell">
                            {vessel.type === 'mobile_sauna' && vessel.pricingTiers ? (
                              <>
                                <span className="price-amount">{formatPrice(vessel.pricingTiers.days1to3)}</span>
                                <span className="price-label">1-3 days</span>
                              </>
                            ) : (
                              <>
                                <span className="price-amount">{vessel.basePriceCents ? formatPrice(vessel.basePriceCents) : '$0.00'}</span>
                                <span className="price-label">base rate</span>
                              </>
                            )}
                          </td>
                          <td className="details-cell">
                            {vessel.type === 'mobile_sauna' ? (
                              <div className="mobile-sauna-details">
                                <div>Min: {vessel.minimumDays || 1} days</div>
                                {vessel.discountPercent ? (
                                  <div className="discount-info">{vessel.discountPercent}% off {vessel.discountThreshold}+ days</div>
                                ) : null}
                              </div>
                            ) : (
                              <span className="details-na">—</span>
                            )}
                          </td>
                          <td>{vessel.createdAt ? formatDate(vessel.createdAt) : 'N/A'}</td>
                          <td className="actions-cell">
                            <button 
                              className="action-btn calendar-btn"
                              onClick={() => handleShowCalendar(vessel)}
                              title="View Booked Dates"
                            >
                              📅
                            </button>
                            <button 
                              className="action-btn edit-btn"
                              onClick={() => handleEdit(vessel)}
                              title="Edit Vessel"
                            >
                              Edit
                            </button>
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => handleDelete(vessel)}
                              disabled={processingVessel === vessel._id}
                              title="Delete Vessel"
                            >
                              {processingVessel === vessel._id ? '...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {calendarVessel && (
        <BookedDatesCalendar
          vesselId={calendarVessel.id}
          vesselName={calendarVessel.name}
          onClose={() => setCalendarVessel(null)}
        />
      )}
    </div>
  );
};

export default VesselManagement;