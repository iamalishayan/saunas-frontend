import React, { useState, useEffect } from 'react';
import { getAllContacts, getContactById, updateContactStatus, deleteContact, Contact } from '../../services/api';
import './ContactManagement.css';

interface ContactManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactManagement: React.FC<ContactManagementProps> = ({ isOpen, onClose }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [inquiryTypeFilter, setInquiryTypeFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
    }
  }, [isOpen, statusFilter, inquiryTypeFilter, currentPage]);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
        limit: 20
      };
      if (statusFilter) params.status = statusFilter;
      if (inquiryTypeFilter) params.inquiryType = inquiryTypeFilter;

      const response = await getAllContacts(params);
      setContacts(response.contacts);
      setTotalPages(response.pagination.pages);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load contacts');
      setLoading(false);
    }
  };

  const handleViewContact = async (contactId: string) => {
    try {
      setProcessingId(contactId);
      const contact = await getContactById(contactId);
      setSelectedContact(contact);
      setAdminNotes(contact.adminNotes || '');
      setIsViewModalOpen(true);
      
      // Refresh the list to update status if it changed to 'read'
      fetchContacts();
    } catch (err: any) {
      setError(err.message || 'Failed to load contact details');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedContact) return;

    try {
      setProcessingId(selectedContact._id);
      await updateContactStatus(selectedContact._id, { 
        status: newStatus,
        adminNotes: adminNotes
      });
      
      setSuccessMessage(`Contact status updated to ${newStatus}`);
      setSelectedContact({ ...selectedContact, status: newStatus as any, adminNotes });
      fetchContacts();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update contact status');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedContact) return;

    try {
      setProcessingId(selectedContact._id);
      await updateContactStatus(selectedContact._id, { adminNotes });
      
      setSuccessMessage('Notes saved successfully');
      setSelectedContact({ ...selectedContact, adminNotes });
      fetchContacts();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save notes');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact inquiry? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessingId(contactId);
      await deleteContact(contactId);
      
      setSuccessMessage('Contact deleted successfully');
      setIsViewModalOpen(false);
      setSelectedContact(null);
      fetchContacts();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete contact');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'new': return 'contact-status-badge contact-status-new';
      case 'read': return 'contact-status-badge contact-status-read';
      case 'replied': return 'contact-status-badge contact-status-replied';
      case 'archived': return 'contact-status-badge contact-status-archived';
      default: return 'contact-status-badge';
    }
  };

  const formatInquiryType = (type: string) => {
    return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (!isOpen) return null;

  return (
    <div className="contact-management-modal">
      <div className="contact-management-container">
        <div className="contact-management-header">
          <h2>📧 Contact Inquiries</h2>
          <button className="contact-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Filters */}
        <div className="contact-filters">
          <div className="contact-filter-group">
            <label>Status:</label>
            <select 
              value={statusFilter} 
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="contact-filter-group">
            <label>Inquiry Type:</label>
            <select 
              value={inquiryTypeFilter} 
              onChange={(e) => {
                setInquiryTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Types</option>
              <option value="booking">Booking Inquiry</option>
              <option value="sauna-boats">Sauna Boat Trips</option>
              <option value="mobile-rental">Mobile Sauna Rental</option>
              <option value="private-events">Private Events</option>
              <option value="corporate">Corporate Wellness</option>
              <option value="partnership">Partnership</option>
              <option value="general">General Question</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="contact-success-message">✓ {successMessage}</div>
        )}
        {error && (
          <div className="contact-error-message">✗ {error}</div>
        )}

        {/* Contacts Table */}
        <div className="contact-table-container">
          {loading ? (
            <div className="contact-loading-state">
              <div className="contact-spinner"></div>
              <p>Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="contact-empty-state">
              <p>📭 No contact inquiries found</p>
            </div>
          ) : (
            <table className="contact-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact._id}>
                    <td>
                      <span className={getStatusBadgeClass(contact.status)}>
                        {contact.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="contact-name">
                      {contact.firstName} {contact.lastName}
                    </td>
                    <td className="contact-email">{contact.email}</td>
                    <td className="contact-subject">{contact.subject}</td>
                    <td>{formatInquiryType(contact.inquiryType)}</td>
                    <td className="contact-date">{formatDate(contact.createdAt)}</td>
                    <td className="contact-actions">
                      <button
                        className="contact-action-btn contact-view-btn"
                        onClick={() => handleViewContact(contact._id)}
                        disabled={processingId === contact._id}
                      >
                        {processingId === contact._id ? 'Loading...' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="contact-pagination">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}

        {/* View Contact Modal */}
        {isViewModalOpen && selectedContact && (
          <div className="contact-detail-modal">
            <div className="contact-detail-container">
              <div className="contact-detail-header">
                <h3>Contact Details</h3>
                <button className="contact-close-btn" onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedContact(null);
                }}>×</button>
              </div>

              <div className="contact-detail-content">
                <div className="contact-info-grid">
                  <div className="contact-info-item">
                    <label>Name:</label>
                    <p>{selectedContact.firstName} {selectedContact.lastName}</p>
                  </div>
                  <div className="contact-info-item">
                    <label>Email:</label>
                    <p><a href={`mailto:${selectedContact.email}`}>{selectedContact.email}</a></p>
                  </div>
                  {selectedContact.phone && (
                    <div className="contact-info-item">
                      <label>Phone:</label>
                      <p>{selectedContact.phone}</p>
                    </div>
                  )}
                  <div className="contact-info-item">
                    <label>Inquiry Type:</label>
                    <p>{formatInquiryType(selectedContact.inquiryType)}</p>
                  </div>
                  <div className="contact-info-item">
                    <label>Status:</label>
                    <p><span className={getStatusBadgeClass(selectedContact.status)}>
                      {selectedContact.status.toUpperCase()}
                    </span></p>
                  </div>
                  <div className="contact-info-item">
                    <label>Submitted:</label>
                    <p>{formatDate(selectedContact.createdAt)}</p>
                  </div>
                </div>

                <div className="contact-subject-box">
                  <label>Subject:</label>
                  <p>{selectedContact.subject}</p>
                </div>

                <div className="contact-message-box">
                  <label>Message:</label>
                  <p>{selectedContact.message}</p>
                </div>

                <div className="admin-notes-box">
                  <label>Admin Notes:</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add internal notes about this inquiry..."
                    rows={4}
                  />
                  <button 
                    className="contact-save-notes-btn"
                    onClick={handleSaveNotes}
                    disabled={processingId === selectedContact._id}
                  >
                    {processingId === selectedContact._id ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>

                <div className="contact-actions-box">
                  <label>Update Status:</label>
                  <div className="contact-status-buttons">
                    <button
                      className="contact-status-btn contact-status-read-btn"
                      onClick={() => handleUpdateStatus('read')}
                      disabled={selectedContact.status === 'read' || processingId === selectedContact._id}
                    >
                      Mark as Read
                    </button>
                    <button
                      className="contact-status-btn contact-status-replied-btn"
                      onClick={() => handleUpdateStatus('replied')}
                      disabled={selectedContact.status === 'replied' || processingId === selectedContact._id}
                    >
                      Mark as Replied
                    </button>
                    <button
                      className="contact-status-btn contact-status-archived-btn"
                      onClick={() => handleUpdateStatus('archived')}
                      disabled={selectedContact.status === 'archived' || processingId === selectedContact._id}
                    >
                      Archive
                    </button>
                    <button
                      className="contact-status-btn contact-status-delete-btn"
                      onClick={() => handleDeleteContact(selectedContact._id)}
                      disabled={processingId === selectedContact._id}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactManagement;
