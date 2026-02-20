import React, { useState } from 'react';
import './DepositManagement.css';

interface ForfeitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  bookingId: string;
  customerName: string;
  depositAmount: number;
}

const ForfeitModal: React.FC<ForfeitModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  bookingId,
  customerName,
  depositAmount
}) => {
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Please provide a reason for forfeiting the deposit');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onConfirm(reason);
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to forfeit deposit');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="deposit-modal-overlay" onClick={handleClose}>
      <div className="deposit-modal-content deposit-forfeit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="deposit-modal-header">
          <h3>❌ Forfeit Security Deposit</h3>
          <button
            className="deposit-modal-close"
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <div className="deposit-modal-body">
          <div className="deposit-forfeit-info">
            <p><strong>Booking ID:</strong> {bookingId}</p>
            <p><strong>Customer:</strong> {customerName}</p>
            <p><strong>Deposit Amount:</strong> ${(depositAmount / 100).toFixed(2)}</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="deposit-form-group">
              <label htmlFor="forfeit-reason">
                Reason for forfeiture: <span className="deposit-required">*</span>
              </label>
              <textarea
                id="forfeit-reason"
                className="deposit-form-control"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Damaged heating element, Cracked sauna window..."
                rows={4}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="deposit-error-message">
                {error}
              </div>
            )}

            <div className="deposit-warning-box">
              <p>⚠️ <strong>Warning:</strong> This action cannot be undone.</p>
              <p>The customer will NOT receive their deposit refund.</p>
            </div>

            <div className="deposit-modal-actions">
              <button
                type="button"
                className="deposit-btn deposit-btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="deposit-btn deposit-btn-danger"
                disabled={loading || !reason.trim()}
              >
                {loading ? 'Processing...' : 'Forfeit Deposit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForfeitModal;
