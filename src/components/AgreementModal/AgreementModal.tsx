import React, { useState, useEffect } from 'react';
import { previewAgreement, acceptAgreement } from '../../services/api';
import './AgreementModal.css';

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  bookingId: string;
}

const AgreementModal: React.FC<AgreementModalProps> = ({ isOpen, onClose, onAccept, bookingId }) => {
  const [agreementHtml, setAgreementHtml] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [accepting, setAccepting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && bookingId) {
      loadAgreement();
    }
  }, [isOpen, bookingId]);

  const loadAgreement = async () => {
    setLoading(true);
    setError(null);
    try {
      const html = await previewAgreement(bookingId);
      setAgreementHtml(html);
    } catch (err: any) {
      setError(err.message || 'Failed to load agreement');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!agreed) {
      setError('Please confirm that you agree to the terms');
      return;
    }

    setAccepting(true);
    setError(null);
    try {
      await acceptAgreement(bookingId);
      onAccept();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to accept agreement');
    } finally {
      setAccepting(false);
    }
  };

  const handleOpenInNewTab = () => {
    // Create a new window/tab with the agreement HTML
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Rental Agreement - Booking ${bookingId}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 900px;
              margin: 40px auto;
              padding: 20px;
              line-height: 1.6;
              color: #333;
            }
            h1, h2, h3 { color: #8B4513; }
            @media print {
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          ${agreementHtml}
        </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  const handleClose = () => {
    if (!accepting) {
      setAgreed(false);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="agreement-modal-overlay" onClick={handleClose}>
      <div className="agreement-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="agreement-modal-header">
          <h2>📋 Rental Agreement</h2>
          <button
            className="agreement-modal-close"
            onClick={handleClose}
            disabled={accepting}
          >
            ×
          </button>
        </div>

        <div className="agreement-modal-body">
          {loading ? (
            <div className="agreement-loading">
              <div className="agreement-spinner"></div>
              <p>Loading agreement...</p>
            </div>
          ) : error && !agreementHtml ? (
            <div className="agreement-error">
              <p>❌ {error}</p>
              <button className="agreement-retry-btn" onClick={loadAgreement}>
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="agreement-content">
                <div 
                  className="agreement-html"
                  dangerouslySetInnerHTML={{ __html: agreementHtml }}
                />
              </div>

              <div className="agreement-actions-top">
                <button
                  className="agreement-btn agreement-btn-link"
                  onClick={handleOpenInNewTab}
                  disabled={accepting}
                >
                  🔗 Open Agreement in New Tab
                </button>
              </div>

              <div className="agreement-accept-section">
                <label className="agreement-checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked);
                      setError(null);
                    }}
                    disabled={accepting}
                  />
                  <span>
                    I have read and agree to the terms and conditions of this rental agreement, 
                    including the Mobile Sauna Rules and Liability Waiver *
                  </span>
                </label>

                {error && (
                  <div className="agreement-error-message">
                    {error}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="agreement-modal-footer">
          <button
            className="agreement-btn agreement-btn-secondary"
            onClick={handleClose}
            disabled={accepting || loading}
          >
            Cancel
          </button>
          <button
            className="agreement-btn agreement-btn-primary"
            onClick={handleAccept}
            disabled={!agreed || accepting || loading}
          >
            {accepting ? '⏳ Processing...' : '✓ Accept & Continue to Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgreementModal;
