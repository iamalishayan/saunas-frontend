import React, { useState, useEffect } from 'react';
import { getAllBookings, cancelBookingAdmin, updateAdminBooking, extendBookingRental, downloadAgreementPDF } from '../../services/api';
import './MobileSaunaManagement.css';

interface MobileSaunaBooking {
    _id: string;
    user: {
        _id: string;
        name: string;
        email: string;
    };
    vessel: {
        _id: string;
        name: string;
        type: string;
    };
    status: 'pending' | 'confirmed' | 'cancelled';
    customerName?: string;
    customerEmail?: string;
    customerBirthdate?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    additionalWoodBins?: number;
    startTime?: string;
    endTime?: string;
    startDate?: string;
    endDate?: string;
    days?: number;
    daysBooked?: number;
    deliveryDistanceKm?: number;
    totalPriceCents: number;
    rentalPriceCents?: number;
    deliveryFeeCents?: number;
    woodBinsCostCents?: number;
    createdAt: string;
    updatedAt: string;
}

interface MobileSaunaManagementProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileSaunaManagement: React.FC<MobileSaunaManagementProps> = ({ isOpen, onClose }) => {
    const [bookings, setBookings] = useState<MobileSaunaBooking[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [editingBooking, setEditingBooking] = useState<MobileSaunaBooking | null>(null);
    const [editFormData, setEditFormData] = useState({
        startDate: '',
        endDate: '',
        additionalWoodBins: 0,
        deliveryAddress: '',
        customerName: '',
        customerPhone: '',
        customerEmail: ''
    });
    const [updateLoading, setUpdateLoading] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);

    // Extend rental state
    const [extendingBooking, setExtendingBooking] = useState<MobileSaunaBooking | null>(null);
    const [extendFormData, setExtendFormData] = useState({ newEndDate: '' });
    const [extendLoading, setExtendLoading] = useState(false);
    const [extendError, setExtendError] = useState<string | null>(null);

    // PDF Download state
    const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);

    // Filters state
    const [filters, setFilters] = useState({
        status: '',
        userId: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchBookings();
        }
    }, [isOpen]);

    const fetchBookings = async (appliedFilters?: any) => {
        setLoading(true);
        setError(null);
        try {
            const filtersToApply = appliedFilters || filters;
            // Remove empty filters and always default to confirmed if no status specified
            const cleanFilters: any = {};
            if (filtersToApply.status && filtersToApply.status.trim() !== '') {
                cleanFilters.status = filtersToApply.status;
            } else {
                cleanFilters.status = 'confirmed'; // Default to confirmed bookings
            }
            if (filtersToApply.userId && filtersToApply.userId.trim() !== '') {
                cleanFilters.userId = filtersToApply.userId;
            }

            const data = await getAllBookings(cleanFilters);
            // Filter only mobile sauna bookings
            const mobileSaunaBookings = data.filter((booking: any) => 
                booking.vessel?.type === 'mobile_sauna'
            );
            setBookings(mobileSaunaBookings);
        } catch (err: any) {
            console.error('Error fetching mobile sauna bookings:', err);
            setError(err.message || 'Failed to fetch mobile sauna bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id: string) => {
        const booking = bookings.find(b => b._id === id);
        if (!booking) return;

        if (booking.status === 'cancelled') {
            setError('Booking is already cancelled');
            return;
        }

        const customerName = booking.customerName || booking.user.name;
        if (!confirm(`Are you sure you want to cancel this mobile sauna booking for ${customerName}?`)) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await cancelBookingAdmin(id);
            await fetchBookings();
        } catch (err: any) {
            console.error('Error cancelling booking:', err);
            setError(err.message || 'Failed to cancel booking');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (booking: MobileSaunaBooking) => {
        setEditingBooking(booking);
        setEditFormData({
            startDate: booking.startDate || booking.startTime?.split('T')[0] || '',
            endDate: booking.endDate || booking.endTime?.split('T')[0] || '',
            additionalWoodBins: booking.additionalWoodBins || 0,
            deliveryAddress: booking.deliveryAddress || '',
            customerName: booking.customerName || booking.user.name,
            customerPhone: booking.customerPhone || '',
            customerEmail: booking.customerEmail || booking.user.email
        });
        setUpdateError(null);
    };

    const handleEditCancel = () => {
        setEditingBooking(null);
        setEditFormData({
            startDate: '',
            endDate: '',
            additionalWoodBins: 0,
            deliveryAddress: '',
            customerName: '',
            customerPhone: '',
            customerEmail: ''
        });
        setUpdateError(null);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingBooking) return;

        setUpdateLoading(true);
        setUpdateError(null);

        try {
            await updateAdminBooking(editingBooking._id, editFormData);
            await fetchBookings();
            handleEditCancel();
        } catch (err: any) {
            console.error('Error updating booking:', err);
            setUpdateError(err.message || 'Failed to update booking');
        } finally {
            setUpdateLoading(false);
        }
    };
    const handleExtendClick = (booking: MobileSaunaBooking) => {
        const currentEndDate = booking.endDate || booking.endTime?.split('T')[0] || '';
        setExtendingBooking(booking);
        setExtendFormData({ newEndDate: currentEndDate });
        setExtendError(null);
    };

    const handleExtendCancel = () => {
        setExtendingBooking(null);
        setExtendFormData({ newEndDate: '' });
        setExtendError(null);
    };

    const handleExtendSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!extendingBooking) return;

        setExtendLoading(true);
        setExtendError(null);

        try {
            await extendBookingRental(extendingBooking._id, extendFormData.newEndDate);
            await fetchBookings();
            handleExtendCancel();
        } catch (err: any) {
            console.error('Error extending rental:', err);
            setExtendError(err.message || 'Failed to extend rental');
        } finally {
            setExtendLoading(false);
        }
    };
    
    const handleFilterChange = (field: string, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleApplyFilters = () => {
        fetchBookings(filters);
    };

    const handleClearFilters = () => {
        const clearedFilters = { status: '', userId: '' };
        setFilters(clearedFilters);
        fetchBookings(clearedFilters);
    };

    const handleDownloadPDF = async (booking: MobileSaunaBooking) => {
        if (!booking || !booking._id) return;
        
        setDownloadingPDF(booking._id);
        try {
            // Prepare agreement data
            const agreementData = {
                customerName: booking.customerName || booking.user.name || 'Customer',
                deliveryAddress: booking.deliveryAddress || 'N/A',
                customerEmail: booking.customerEmail || booking.user.email || 'no-email@example.com',
                customerPhone: booking.customerPhone || '000-000-0000',
                agreementDate: new Date().toISOString().split('T')[0],
                capacity: booking.vessel ? `${(booking.vessel as any).capacity || '4'} person` : '4 person',
                dropoffDate: booking.startTime || booking.startDate ? 
                    new Date(booking.startTime || booking.startDate || '').toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                pickupDate: booking.endTime || booking.endDate ? 
                    new Date(booking.endTime || booking.endDate || '').toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                rentalFee: formatPrice(booking.totalPriceCents)
            };

            // Call API to generate PDF
            const blob = await downloadAgreementPDF(agreementData);
            
            // Create blob URL and download
            const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.download = `Equipment-Rental-Agreement-${booking.customerName || booking.user.name || 'Agreement'}-${Date.now()}.pdf`;
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

    const formatDate = (dateString?: string): string => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString?: string): string => {
        if (!dateString) return 'N/A';
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

    const getBookingIdDisplay = (id: string): string => {
        // Show last 6 characters of booking ID
        return `#${id.slice(-6)}`;
    };

    if (!isOpen) return null;

    return (
        <div className="msauna-modal-overlay" onClick={onClose}>
            <div className="msauna-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="msauna-modal-header">
                    <h2>Mobile Sauna Booking Management</h2>
                    <button className="msauna-close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="msauna-modal-content">                    {/* Filters Section */}
                    <div className="msauna-filters-section">
                        <h3>Filters</h3>
                        <div className="msauna-filters-grid">
                            <div className="msauna-filter-group">
                                <label htmlFor="status-filter">Status</label>
                                <select
                                    id="status-filter"
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="msauna-filter-group">
                                <label htmlFor="userId-filter">User ID</label>
                                <input
                                    type="text"
                                    id="userId-filter"
                                    placeholder="Enter user ID"
                                    value={filters.userId}
                                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="msauna-filter-actions">
                            <button className="msauna-apply-btn" onClick={handleApplyFilters}>
                                Apply Filters
                            </button>
                            <button className="msauna-clear-btn" onClick={handleClearFilters}>
                                Clear Filters
                            </button>
                        </div>
                    </div>
                    {error && (
                        <div className="msauna-error-message">
                            <p>{error}</p>
                            <button onClick={() => setError(null)}>Dismiss</button>
                        </div>
                    )}

                    {loading ? (
                        <div className="msauna-loading-container">
                            <div className="msauna-loading-spinner"></div>
                            <p>Loading mobile sauna bookings...</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="msauna-no-data-message">
                            <p>0 bookings found</p>
                            <p className="msauna-no-data-hint">No mobile sauna bookings available</p>
                        </div>
                    ) : (
                        <>
                            <div className="msauna-bookings-summary">
                                {bookings.length} booking{bookings.length !== 1 ? 's' : ''} found
                            </div>

                            <div className="msauna-table-container">
                                <table className="msauna-table">
                                    <thead>
                                        <tr>
                                            <th>Booking ID</th>
                                            <th>Customer</th>
                                            <th>Rental Period</th>
                                            <th>Vessel</th>
                                            <th>Delivery Address</th>
                                            <th>Wood Bins</th>
                                            <th>Total Price</th>
                                            <th>Status</th>
                                            <th>Booked</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bookings.map((booking) => (
                                            <tr key={booking._id}>
                                                <td className="msauna-booking-id-cell">
                                                    {getBookingIdDisplay(booking._id)}
                                                </td>
                                                <td className="msauna-customer-cell">
                                                    <div className="msauna-customer-name">{booking.customerName || booking.user.name}</div>
                                                    <div className="msauna-customer-email">{booking.customerEmail || booking.user.email}</div>
                                                    {booking.customerPhone && (
                                                        <div className="msauna-customer-phone">{booking.customerPhone}</div>
                                                    )}
                                                </td>
                                                <td className="msauna-dates-cell">
                                                    <div className="msauna-date-start">
                                                        <strong>Start:</strong> {formatDate(booking.startTime || booking.startDate)}
                                                    </div>
                                                    <div className="msauna-date-end">
                                                        <strong>End:</strong> {formatDate(booking.endTime || booking.endDate)}
                                                    </div>
                                                    {booking.daysBooked && (
                                                        <div className="msauna-days-duration">{booking.daysBooked} day{booking.daysBooked !== 1 ? 's' : ''}</div>
                                                    )}
                                                </td>
                                                <td className="msauna-vessel-cell">
                                                    <div className="msauna-vessel-name">{booking.vessel?.name || 'Unknown Vessel'}</div>
                                                    <div className="msauna-vessel-type">Mobile Sauna</div>
                                                </td>
                                                <td className="msauna-address-cell">
                                                    {booking.deliveryAddress || 'N/A'}
                                                    {booking.deliveryDistanceKm !== undefined && (
                                                        <div className="msauna-distance-info">
                                                            {booking.deliveryDistanceKm.toFixed(1)} km from base
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="msauna-woodbins-cell">
                                                    {booking.additionalWoodBins !== undefined ? (
                                                        <div>
                                                            <div className="msauna-bins-total">{2 + booking.additionalWoodBins} total</div>
                                                            <div className="msauna-bins-breakdown">
                                                                2 free + {booking.additionalWoodBins} extra
                                                            </div>
                                                        </div>
                                                    ) : 'N/A'}
                                                </td>
                                                <td className="msauna-price-cell">
                                                    <div className="msauna-total-amount">{formatPrice(booking.totalPriceCents)}</div>
                                                    {(booking.rentalPriceCents || booking.deliveryFeeCents || booking.woodBinsCostCents) && (
                                                        <div className="msauna-price-details">
                                                            {booking.rentalPriceCents && (
                                                                <div>Rental: {formatPrice(booking.rentalPriceCents)}</div>
                                                            )}
                                                            {booking.deliveryFeeCents !== undefined && (
                                                                <div>Delivery: {formatPrice(booking.deliveryFeeCents)}</div>
                                                            )}
                                                            {booking.woodBinsCostCents !== undefined && booking.woodBinsCostCents > 0 && (
                                                                <div>Wood: {formatPrice(booking.woodBinsCostCents)}</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="msauna-status-cell">
                                                    <span className={`msauna-status-badge msauna-status-${booking.status}`}>
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="msauna-booked-date-cell">
                                                    {formatDateTime(booking.createdAt)}
                                                </td>
                                                <td className="msauna-actions-cell">
                                                    <button
                                                        className="action-btn msauna-download-btn"
                                                        onClick={() => handleDownloadPDF(booking)}
                                                        disabled={downloadingPDF === booking._id}
                                                        title="Download Agreement PDF"
                                                    >
                                                        {downloadingPDF === booking._id ? '...' : '📄 PDF'}
                                                    </button>
                                                    <button
                                                        className="action-btn msauna-edit-btn"
                                                        onClick={() => handleEditClick(booking)}
                                                        disabled={loading}
                                                        title="Edit booking"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="action-btn msauna-extend-btn"
                                                        onClick={() => handleExtendClick(booking)}
                                                        disabled={loading}
                                                        title="Extend rental"
                                                    >
                                                        Extend
                                                    </button>
                                                    <button
                                                        className="action-btn msauna-cancel-btn"
                                                        onClick={() => handleCancel(booking._id)}
                                                        disabled={loading}
                                                        title="Cancel booking"
                                                    >
                                                        Cancel
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* Edit Booking Modal */}
                    {editingBooking && (
                        <div className="msauna-edit-modal-overlay" onClick={handleEditCancel}>
                            <div className="msauna-edit-modal" onClick={(e) => e.stopPropagation()}>
                                <div className="msauna-edit-modal-header">
                                    <h3>Edit Booking {getBookingIdDisplay(editingBooking._id)}</h3>
                                    <button className="msauna-close-button" onClick={handleEditCancel}>&times;</button>
                                </div>

                                {updateError && (
                                    <div className="msauna-error-message">
                                        <p>{updateError}</p>
                                        <button onClick={() => setUpdateError(null)}>Dismiss</button>
                                    </div>
                                )}

                                <form onSubmit={handleUpdate} className="msauna-edit-form">
                                    <div className="msauna-form-row">
                                        <div className="msauna-form-group">
                                            <label htmlFor="edit-customerName">Customer Name *</label>
                                            <input
                                                type="text"
                                                id="edit-customerName"
                                                value={editFormData.customerName}
                                                onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                                                required
                                                disabled={updateLoading}
                                            />
                                        </div>

                                        <div className="msauna-form-group">
                                            <label htmlFor="edit-customerEmail">Customer Email *</label>
                                            <input
                                                type="email"
                                                id="edit-customerEmail"
                                                value={editFormData.customerEmail}
                                                onChange={(e) => setEditFormData({ ...editFormData, customerEmail: e.target.value })}
                                                required
                                                disabled={updateLoading}
                                            />
                                        </div>
                                    </div>

                                    <div className="msauna-form-row">
                                        <div className="msauna-form-group">
                                            <label htmlFor="edit-customerPhone">Customer Phone</label>
                                            <input
                                                type="tel"
                                                id="edit-customerPhone"
                                                value={editFormData.customerPhone}
                                                onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                                                disabled={updateLoading}
                                            />
                                        </div>

                                        <div className="msauna-form-group">
                                            <label htmlFor="edit-woodBins">Additional Wood Bins (0-10)</label>
                                            <input
                                                type="number"
                                                id="edit-woodBins"
                                                min="0"
                                                max="10"
                                                value={editFormData.additionalWoodBins}
                                                onChange={(e) => setEditFormData({ ...editFormData, additionalWoodBins: parseInt(e.target.value) || 0 })}
                                                disabled={updateLoading}
                                            />
                                            <small className="msauna-form-hint">2 bins included free, $15 per additional bin</small>
                                        </div>
                                    </div>

                                    <div className="msauna-form-row">
                                        <div className="msauna-form-group">
                                            <label htmlFor="edit-startDate">Start Date *</label>
                                            <input
                                                type="date"
                                                id="edit-startDate"
                                                value={editFormData.startDate}
                                                onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                                                required
                                                disabled={updateLoading}
                                            />
                                        </div>

                                        <div className="msauna-form-group">
                                            <label htmlFor="edit-endDate">End Date *</label>
                                            <input
                                                type="date"
                                                id="edit-endDate"
                                                value={editFormData.endDate}
                                                min={editFormData.startDate}
                                                onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                                                required
                                                disabled={updateLoading}
                                            />
                                        </div>
                                    </div>

                                    <div className="msauna-form-group msauna-form-full">
                                        <label htmlFor="edit-deliveryAddress">Delivery Address *</label>
                                        <textarea
                                            id="edit-deliveryAddress"
                                            value={editFormData.deliveryAddress}
                                            onChange={(e) => setEditFormData({ ...editFormData, deliveryAddress: e.target.value })}
                                            rows={3}
                                            required
                                            disabled={updateLoading}
                                            placeholder="Full address: Street, City, Province, Postal Code"
                                        />
                                        <small className="msauna-form-hint">
                                            Price will be recalculated based on distance from Hillside Mall (Free ≤20km, $4/km after)
                                        </small>
                                    </div>

                                    <div className="msauna-edit-modal-actions">
                                        <button
                                            type="button"
                                            className="msauna-btn-secondary"
                                            onClick={handleEditCancel}
                                            disabled={updateLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="msauna-btn-primary"
                                            disabled={updateLoading}
                                        >
                                            {updateLoading ? 'Updating & Recalculating...' : 'Update Booking'}
                                        </button>
                                    </div>

                                    <div className="msauna-form-note">
                                        <strong>Note:</strong> Changing dates, delivery address, or wood bins will automatically recalculate 
                                        the total price. Availability will be checked before updating.
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Extend Rental Modal */}
                    {extendingBooking && (
                        <div className="msauna-extend-modal-overlay" onClick={handleExtendCancel}>
                            <div className="msauna-extend-modal" onClick={(e) => e.stopPropagation()}>
                                <div className="msauna-extend-modal-header">
                                    <h3>Extend Rental {getBookingIdDisplay(extendingBooking._id)}</h3>
                                    <button className="msauna-close-button" onClick={handleExtendCancel}>&times;</button>
                                </div>

                                {extendError && (
                                    <div className="msauna-error-message">
                                        <p>{extendError}</p>
                                        <button onClick={() => setExtendError(null)}>Dismiss</button>
                                    </div>
                                )}

                                <form onSubmit={handleExtendSubmit} className="msauna-extend-form">
                                    <div className="msauna-extend-info">
                                        <div className="msauna-extend-info-row">
                                            <span className="msauna-info-label">Customer:</span>
                                            <span className="msauna-info-value">{extendingBooking.customerName || extendingBooking.user.name}</span>
                                        </div>
                                        <div className="msauna-extend-info-row">
                                            <span className="msauna-info-label">Current Start Date:</span>
                                            <span className="msauna-info-value">{formatDate(extendingBooking.startDate || extendingBooking.startTime)}</span>
                                        </div>
                                        <div className="msauna-extend-info-row">
                                            <span className="msauna-info-label">Current End Date:</span>
                                            <span className="msauna-info-value">{formatDate(extendingBooking.endDate || extendingBooking.endTime)}</span>
                                        </div>
                                        <div className="msauna-extend-info-row">
                                            <span className="msauna-info-label">Current Total:</span>
                                            <span className="msauna-info-value msauna-price-highlight">{formatPrice(extendingBooking.totalPriceCents)}</span>
                                        </div>
                                    </div>

                                    <div className="msauna-form-group">
                                        <label htmlFor="extend-newEndDate">New End Date *</label>
                                        <input
                                            type="date"
                                            id="extend-newEndDate"
                                            value={extendFormData.newEndDate}
                                            min={extendingBooking.endDate || extendingBooking.endTime?.split('T')[0]}
                                            onChange={(e) => setExtendFormData({ newEndDate: e.target.value })}
                                            required
                                            disabled={extendLoading}
                                        />
                                        <small className="msauna-form-hint">
                                            Price will be automatically calculated based on the extension period.
                                        </small>
                                    </div>

                                    <div className="msauna-extend-modal-actions">
                                        <button
                                            type="button"
                                            className="msauna-btn-secondary"
                                            onClick={handleExtendCancel}
                                            disabled={extendLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="msauna-btn-primary"
                                            disabled={extendLoading}
                                        >
                                            {extendLoading ? 'Extending Rental...' : 'Extend Rental'}
                                        </button>
                                    </div>

                                    <div className="msauna-form-note">
                                        <strong>Note:</strong> The extension will follow the same tiered pricing structure. 
                                        Availability will be checked, and the additional cost will be calculated automatically.
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileSaunaManagement;
