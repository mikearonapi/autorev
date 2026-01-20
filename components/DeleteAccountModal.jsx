'use client';

/**
 * Delete Account Modal
 * 
 * Multi-step flow for account deletion:
 * Step 1: "We hate to see you go" - Reason selection + optional details
 * Step 2: Final confirmation - Type DELETE to confirm
 * Step 3: Processing state
 * 
 * Stores feedback in user_feedback table before deletion.
 */

import { useState, useEffect } from 'react';
import styles from './DeleteAccountModal.module.css';

// Deletion reason options
const DELETION_REASONS = [
  { value: 'not_using', label: "I'm not using the app enough" },
  { value: 'missing_features', label: "It's missing features I need" },
  { value: 'too_expensive', label: "It's too expensive" },
  { value: 'found_alternative', label: "I found a better alternative" },
  { value: 'privacy_concerns', label: "I have privacy concerns" },
  { value: 'technical_issues', label: "Too many bugs or technical issues" },
  { value: 'other', label: "Other reason" },
];

// Icons
const Icons = {
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  warning: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  spinner: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.spinner}>
      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
    </svg>
  ),
  sad: (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10"/>
      <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
      <line x1="9" y1="9" x2="9.01" y2="9"/>
      <line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  ),
};

export default function DeleteAccountModal({ isOpen, onClose, userId, onDeleted }) {
  const [step, setStep] = useState(1);
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedReason('');
      setDetails('');
      setConfirmText('');
      setError('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, isDeleting, onClose]);

  const handleNext = () => {
    if (step === 1 && selectedReason) {
      setStep(2);
      setError('');
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setConfirmText('');
      setError('');
    }
  };

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE exactly as shown');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/users/${userId}/account`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: selectedReason,
          details: details.trim() || null,
          confirmText: confirmText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      // Success - call the onDeleted callback
      if (onDeleted) {
        onDeleted();
      }
    } catch (err) {
      console.error('[DeleteAccountModal] Error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={!isDeleting ? onClose : undefined}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        {!isDeleting && (
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            {Icons.close}
          </button>
        )}

        {/* Step 1: Reason Selection */}
        {step === 1 && (
          <div className={styles.content}>
            <div className={styles.sadIcon}>{Icons.sad}</div>
            <h2 className={styles.title}>We hate to see you go</h2>
            <p className={styles.subtitle}>
              Before you leave, please tell us why. Your feedback helps us improve.
            </p>

            <div className={styles.reasonList}>
              {DELETION_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className={`${styles.reasonOption} ${selectedReason === reason.value ? styles.reasonSelected : ''}`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                  />
                  <span className={styles.radioCircle}>
                    {selectedReason === reason.value && Icons.check}
                  </span>
                  <span className={styles.reasonLabel}>{reason.label}</span>
                </label>
              ))}
            </div>

            <div className={styles.detailsField}>
              <label className={styles.detailsLabel}>
                Anything else you'd like to share? (optional)
              </label>
              <textarea
                className={styles.detailsInput}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Tell us more about your experience..."
                rows={3}
                maxLength={500}
              />
              <span className={styles.charCount}>{details.length}/500</span>
            </div>

            <div className={styles.actions}>
              <button className={styles.cancelBtn} onClick={onClose}>
                Cancel
              </button>
              <button
                className={styles.nextBtn}
                onClick={handleNext}
                disabled={!selectedReason}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {step === 2 && !isDeleting && (
          <div className={styles.content}>
            <div className={styles.warningIcon}>{Icons.warning}</div>
            <h2 className={styles.titleDanger}>Delete your account?</h2>
            
            <div className={styles.warningBox}>
              <p className={styles.warningTitle}>This action is permanent and cannot be undone.</p>
              <ul className={styles.warningList}>
                <li>Your garage and all saved vehicles will be deleted</li>
                <li>Your AL conversation history will be erased</li>
                <li>Your projects and modifications will be removed</li>
                <li>Your favorites and saved events will be lost</li>
                <li>Any remaining AL fuel credits will be forfeited</li>
              </ul>
            </div>

            <div className={styles.confirmField}>
              <label className={styles.confirmLabel}>
                Type <span className={styles.deleteText}>DELETE</span> to confirm
              </label>
              <input
                type="text"
                className={styles.confirmInput}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                autoComplete="off"
                autoCapitalize="characters"
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              <button className={styles.backBtn} onClick={handleBack}>
                Back
              </button>
              <button
                className={styles.deleteBtn}
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE'}
              >
                Delete My Account
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {isDeleting && (
          <div className={styles.content}>
            <div className={styles.processingIcon}>{Icons.spinner}</div>
            <h2 className={styles.title}>Deleting your account...</h2>
            <p className={styles.subtitle}>
              Please wait while we remove your data. This may take a moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
