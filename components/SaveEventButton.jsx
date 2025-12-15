'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import styles from './SaveEventButton.module.css';
import { useAuth } from './providers/AuthProvider';
import { useAuthModal } from './AuthModal';
import { hasAccess, getUpgradeCTA, IS_BETA } from '@/lib/tierAccess';

/**
 * Heart Icon
 */
const HeartIcon = ({ filled, size = 20 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={filled ? 'currentColor' : 'none'} 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

/**
 * SaveEventButton component
 * 
 * A button to save/unsave events with tier gating.
 * - Shows sign-in prompt if not authenticated
 * - Shows upgrade prompt if user doesn't have Collector+ tier
 * - Optimistic updates with error handling
 * 
 * @param {Object} props
 * @param {string} props.eventId - Event ID
 * @param {string} props.eventSlug - Event slug
 * @param {string} [props.eventName] - Event name (for upgrade prompt)
 * @param {boolean} [props.isSaved] - Initial saved state
 * @param {Function} [props.onSaveChange] - Callback when save state changes
 * @param {string} [props.variant] - 'default' | 'compact' | 'icon-only'
 * @param {boolean} [props.showLabel] - Whether to show label text
 */
export default function SaveEventButton({
  eventId,
  eventSlug,
  eventName,
  isSaved: initialSaved = false,
  onSaveChange,
  variant = 'default',
  showLabel = true,
}) {
  const { isAuthenticated, user, profile } = useAuth();
  const { openSignIn } = useAuthModal();
  const userTier = profile?.subscription_tier || 'free';
  
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [error, setError] = useState(null);

  // Check if user has access to save events
  const canSave = IS_BETA ? isAuthenticated : hasAccess(userTier, 'eventsSave', isAuthenticated);
  const upgradeCTA = getUpgradeCTA('collector');

  const handleClick = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Reset error
    setError(null);

    // Check authentication
    if (!isAuthenticated) {
      openSignIn();
      return;
    }

    // Check tier access
    if (!canSave) {
      setShowUpgradePrompt(true);
      return;
    }

    // Perform save/unsave
    setIsLoading(true);
    const newSavedState = !isSaved;

    // Optimistic update
    setIsSaved(newSavedState);
    onSaveChange?.(newSavedState);

    try {
      const res = await fetch(`/api/events/${eventSlug}/save`, {
        method: newSavedState ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save event');
      }
    } catch (err) {
      // Revert on error
      setIsSaved(!newSavedState);
      onSaveChange?.(!newSavedState);
      setError(err.message);
      console.error('[SaveEventButton] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, canSave, isSaved, eventSlug, onSaveChange, openSignIn]);

  const buttonClasses = [
    styles.button,
    styles[variant],
    isSaved && styles.saved,
    isLoading && styles.loading,
  ].filter(Boolean).join(' ');

  return (
    <>
      <button
        type="button"
        className={buttonClasses}
        onClick={handleClick}
        disabled={isLoading}
        title={
          !isAuthenticated
            ? 'Sign in to save events'
            : !canSave
              ? 'Upgrade to Collector to save events'
              : isSaved
                ? 'Remove from saved'
                : 'Save event'
        }
        aria-label={isSaved ? 'Remove from saved events' : 'Save event'}
      >
        {isLoading ? (
          <span className={styles.spinner} />
        ) : (
          <HeartIcon filled={isSaved} size={variant === 'compact' ? 16 : 18} />
        )}
        {showLabel && variant !== 'icon-only' && (
          <span className={styles.label}>
            {isSaved ? 'Saved' : 'Save'}
          </span>
        )}
      </button>

      {/* Error Toast */}
      {error && (
        <div className={styles.errorToast}>
          {error}
          <button onClick={() => setError(null)} className={styles.dismissError}>×</button>
        </div>
      )}

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className={styles.modal} onClick={() => setShowUpgradePrompt(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.modalClose}
              onClick={() => setShowUpgradePrompt(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className={styles.modalIcon}>❤️</div>
            <h3 className={styles.modalTitle}>Save Events for Later</h3>
            <p className={styles.modalDescription}>
              {eventName 
                ? `Bookmark "${eventName}" so you never miss it!`
                : 'Bookmark events so you never miss them!'
              }
              {' '}Saving events is available for Collector members and above.
            </p>
            <div className={styles.modalActions}>
              <Link 
                href={upgradeCTA.href} 
                className={styles.upgradeBtn}
                style={{ '--tier-color': upgradeCTA.tierColor }}
              >
                {upgradeCTA.text}
              </Link>
              <button 
                onClick={() => setShowUpgradePrompt(false)}
                className={styles.dismissBtn}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * SaveEventButtonCompact - Smaller variant
 */
export function SaveEventButtonCompact(props) {
  return <SaveEventButton {...props} variant="compact" showLabel={false} />;
}

/**
 * SaveEventButtonIcon - Icon only variant
 */
export function SaveEventButtonIcon(props) {
  return <SaveEventButton {...props} variant="icon-only" showLabel={false} />;
}

