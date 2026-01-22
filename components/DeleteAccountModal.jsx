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
 * 
 * Uses base Modal component for consistent behavior (ESC, scroll-lock, focus).
 */

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import styles from './DeleteAccountModal.module.css';
import { Icons } from '@/components/ui/Icons';
import { useDeleteAccount } from '@/hooks/useUserData';

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

export default function DeleteAccountModal({ isOpen, onClose, userId, onDeleted }) {
  const [step, setStep] = useState(1);
  const [selectedReason, setSelectedReason] = useState('');
  const [details, setDetails] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  
  // React Query mutation for account deletion
  const deleteAccountMutation = useDeleteAccount();
  const isDeleting = deleteAccountMutation.isPending;

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

    setError('');

    try {
      await deleteAccountMutation.mutateAsync({
        userId,
        reason: selectedReason,
        details: details.trim() || null,
        confirmText,
      });

      // Success - call the onDeleted callback
      if (onDeleted) {
        onDeleted();
      }
    } catch (err) {
      console.error('[DeleteAccountModal] Error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      closeOnEsc={!isDeleting}
      closeOnOverlay={!isDeleting}
      showCloseButton={!isDeleting}
      className={styles.modal}
    >
      {/* Step 1: Reason Selection */}
      {step === 1 && (
        <div className={styles.content}>
          <div className={styles.sadIcon}><Icons.sad size={48} /></div>
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
                  {selectedReason === reason.value && <Icons.check size={16} />}
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
          <div className={styles.warningIcon}><Icons.warning size={24} /></div>
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
          <div className={styles.processingIcon}><Icons.spinner size={20} className={styles.spinner} /></div>
          <h2 className={styles.title}>Deleting your account...</h2>
          <p className={styles.subtitle}>
            Please wait while we remove your data. This may take a moment.
          </p>
        </div>
      )}
    </Modal>
  );
}
