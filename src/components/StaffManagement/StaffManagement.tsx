import React, { useState, useEffect, useCallback } from 'react';
import {
  getStaffList,
  createStaffMember,
  updateStaffMember,
  deactivateStaffMember,
} from '../../services/api';
import './StaffManagement.css';

interface StaffMember {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

interface StaffFormData {
  name: string;
  email: string;
  phone: string;
}

const EMPTY_FORM: StaffFormData = { name: '', email: '', phone: '' };

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const StaffManagement: React.FC<Props> = ({ isOpen, onClose }) => {
  const [staff, setStaff]         = useState<StaffMember[]>([]);
  const [loading, setLoading]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [formData, setFormData]     = useState<StaffFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<StaffFormData>>({});

  // ─── Load staff ────────────────────────────────────────────────────────────
  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStaffList();
      setStaff(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) loadStaff();
  }, [isOpen, loadStaff]);

  // ─── Form helpers ───────────────────────────────────────────────────────────
  const openAddForm = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setShowForm(true);
  };

  const openEditForm = (member: StaffMember) => {
    setEditingId(member._id);
    setFormData({ name: member.name, email: member.email, phone: member.phone || '' });
    setFormErrors({});
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
  };

  const validate = (): boolean => {
    const errors: Partial<StaffFormData> = {};
    if (!formData.name.trim())  errors.name  = 'Name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = 'Please enter a valid email';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const flash = (msg: string, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setError(null); setSuccess(null); }, 4000);
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateStaffMember(editingId, {
          name:  formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
        });
        flash('Staff member updated successfully');
      } else {
        await createStaffMember({
          name:  formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
        });
        flash('Staff member created — verification email sent ✉️');
      }
      cancelForm();
      await loadStaff();
    } catch (err: any) {
      flash(err.message || 'Operation failed', true);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Toggle active ──────────────────────────────────────────────────────────
  const handleToggleActive = async (member: StaffMember) => {
    try {
      if (member.isActive) {
        await deactivateStaffMember(member._id);
        flash(`${member.name} deactivated`);
      } else {
        await updateStaffMember(member._id, { isActive: true });
        flash(`${member.name} reactivated`);
      }
      await loadStaff();
    } catch (err: any) {
      flash(err.message || 'Failed to update status', true);
    }
  };

  if (!isOpen) return null;

  const active   = staff.filter(s => s.isActive);
  const inactive = staff.filter(s => !s.isActive);

  return (
    <div className="sm-overlay" onClick={onClose}>
      <div className="sm-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sm-header">
          <div className="sm-header-left">
            <div className="sm-header-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
            </div>
            <div>
              <h2>Staff Management</h2>
              <p>{active.length} active · {inactive.length} inactive</p>
            </div>
          </div>
          <div className="sm-header-actions">
            {!showForm && (
              <button className="sm-btn sm-btn--primary" onClick={openAddForm}>
                + Add Staff
              </button>
            )}
            <button className="sm-close-btn" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        <div className="sm-body">

          {/* Alerts */}
          {error   && <div className="sm-alert sm-alert--error">{error}</div>}
          {success && <div className="sm-alert sm-alert--success">{success}</div>}

          {/* ─── Add / Edit Form ──────────────────────────────────────────── */}
          {showForm && (
            <div className="sm-form-card">
              <h3>{editingId ? 'Edit Staff Member' : 'Add New Staff Member'}</h3>
              <p className="sm-form-hint">
                {editingId
                  ? 'Update the staff member details below.'
                  : 'Staff members receive email notifications for assigned trips. They do not have login access.'}
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="sm-form-grid">
                  {/* Name */}
                  <div className={`sm-field ${formErrors.name ? 'sm-field--error' : ''}`}>
                    <label htmlFor="staff-name">Full Name *</label>
                    <input
                      id="staff-name"
                      type="text"
                      placeholder="e.g. John Smith"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    {formErrors.name && <span className="sm-field-error">{formErrors.name}</span>}
                  </div>

                  {/* Email */}
                  <div className={`sm-field ${formErrors.email ? 'sm-field--error' : ''}`}>
                    <label htmlFor="staff-email">Email Address *</label>
                    <input
                      id="staff-email"
                      type="email"
                      placeholder="e.g. john@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                    {formErrors.email && <span className="sm-field-error">{formErrors.email}</span>}
                  </div>

                  {/* Phone */}
                  <div className="sm-field">
                    <label htmlFor="staff-phone">Phone (optional)</label>
                    <input
                      id="staff-phone"
                      type="tel"
                      placeholder="e.g. 250-885-1234"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="sm-form-actions">
                  <button type="button" className="sm-btn sm-btn--secondary" onClick={cancelForm} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="sm-btn sm-btn--primary" disabled={submitting}>
                    {submitting
                      ? (editingId ? 'Saving…' : 'Creating…')
                      : (editingId ? 'Save Changes' : 'Create & Send Email')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ─── Staff Table ───────────────────────────────────────────────── */}
          {loading ? (
            <div className="sm-loading">
              <div className="sm-spinner" />
              <p>Loading staff…</p>
            </div>
          ) : staff.length === 0 ? (
            <div className="sm-empty">
              <div className="sm-empty-icon">👥</div>
              <h3>No staff members yet</h3>
              <p>Click <strong>+ Add Staff</strong> to create the first staff member.</p>
            </div>
          ) : (
            <>
              {/* Active staff */}
              {active.length > 0 && (
                <div className="sm-section">
                  <h4 className="sm-section-title">Active Staff ({active.length})</h4>
                  <div className="sm-table-wrap">
                    <table className="sm-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Email Verified</th>
                          <th>Added</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {active.map(member => (
                          <tr key={member._id}>
                            <td>
                              <div className="sm-name-cell">
                                <div className="sm-avatar">{member.name.charAt(0).toUpperCase()}</div>
                                <strong>{member.name}</strong>
                              </div>
                            </td>
                            <td>{member.email}</td>
                            <td>{member.phone || <span className="sm-na">—</span>}</td>
                            <td>
                              {member.isEmailVerified
                                ? <span className="sm-badge sm-badge--verified">✓ Verified</span>
                                : <span className="sm-badge sm-badge--pending">Pending</span>}
                            </td>
                            <td>{new Date(member.createdAt).toLocaleDateString()}</td>
                            <td className="sm-actions-cell">
                              <button
                                className="sm-action-btn sm-action-btn--edit"
                                onClick={() => openEditForm(member)}
                                title="Edit"
                              >
                                Edit
                              </button>
                              <button
                                className="sm-action-btn sm-action-btn--deactivate"
                                onClick={() => handleToggleActive(member)}
                                title="Deactivate"
                              >
                                Deactivate
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Inactive staff */}
              {inactive.length > 0 && (
                <div className="sm-section">
                  <h4 className="sm-section-title sm-section-title--inactive">
                    Inactive Staff ({inactive.length})
                  </h4>
                  <div className="sm-table-wrap">
                    <table className="sm-table sm-table--inactive">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inactive.map(member => (
                          <tr key={member._id} className="sm-row--inactive">
                            <td>
                              <div className="sm-name-cell">
                                <div className="sm-avatar sm-avatar--inactive">{member.name.charAt(0).toUpperCase()}</div>
                                <span className="sm-inactive-name">{member.name}</span>
                              </div>
                            </td>
                            <td className="sm-inactive-text">{member.email}</td>
                            <td className="sm-inactive-text">{member.phone || <span className="sm-na">—</span>}</td>
                            <td className="sm-actions-cell">
                              <button
                                className="sm-action-btn sm-action-btn--reactivate"
                                onClick={() => handleToggleActive(member)}
                              >
                                Reactivate
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
