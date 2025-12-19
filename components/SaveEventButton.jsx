'use client';

/**
 * SaveEventButton Component
 * 
 * Save events to favorites - matches CarActionMenu styling exactly
 * with tooltip on hover "Save Event" / "Unsave Event"
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './SaveEventButton.module.css';
import { useAuth } from './providers/AuthProvider';
import { useAuthModal } from './AuthModal';
import { hasAccess, getUpgradeCTA, IS_BETA } from '@/lib/tierAccess';

// Heart Icon - matches CarActionMenu exactly
const HeartIcon = ({ filled, size = 14 }) => (
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
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
  </svg>
);

// Spinner Icon
const SpinnerIcon = ({ size = 14 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={styles.spinnerSvg}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

/**
 * SaveEventButton component
 * 
 * A button to save/unsave events with tier gating.
 * Matches CarActionMenu button styling exactly with dark tooltip on hover.
 * 
 * @param {Object} props
 * @param {string} props.eventId - Event ID
 * @param {string} props.eventSlug - Event slug
 * @param {string} [props.eventName] - Event name (for upgrade prompt)
 * @param {boolean} [props.isSaved] - Initial saved state
 * @param {Function} [props.onSaveChange] - Callback when save state changes: (eventSlug, isSaved) => void
 * @param {string} [props.theme] - 'auto' | 'light' | 'dark'
 * @param {string} [props.variant] - 'default' | 'compact' | 'with-label'
 * @param {string} [props.size] - 'default' | 'small' - smaller button for dense layouts
 * @param {boolean} [props.showLabel] - Whether to show label text
 */
export default function SaveEventButton({
  eventId,
  eventSlug,
  eventName,
  isSaved: initialSaved = false,
  onSaveChange,
  theme = 'auto',
  variant = 'default',
  size = 'default',
  showLabel = false,
}) {
  const { isAuthenticated, user, profile, session } = useAuth();
  const { openSignIn } = useAuthModal();
  const userTier = profile?.subscription_tier || 'free';
  
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Sync internal state with prop changes
  useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);

  // Check if user has access to save events
  const canSave = IS_BETA ? isAuthenticated : hasAccess(userTier, 'eventsSave', isAuthenticated);
  const upgradeCTA = getUpgradeCTA('collector');

  /**
   * CF-004: Android-compatible event handler
   * - Uses both onClick and onTouchEnd for reliability
   * - Debounces rapid taps
   * - Prevents default to avoid scroll/click conflicts
   */
  const lastTapRef = useRef(0);
  
  const handleClick = useCallback(async (e) => {
    // Prevent default browser behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Debounce rapid taps (Android WebView can fire multiple events)
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      return;
    }
    lastTapRef.current = now;

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

    // Prevent double-action while loading
    if (isLoading) {
      return;
    }

    // Perform save/unsave
    setIsLoading(true);
    const newSavedState = !isSaved;

    // Optimistic update
    setIsSaved(newSavedState);
    onSaveChange?.(eventSlug, newSavedState);

    try {
      const headers = { 'Content-Type': 'application/json' };
      // Important: our app uses supabase-js client auth (localStorage) in many flows.
      // API routes may not have cookie-based sessions, so include Bearer token when available.
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const res = await fetch(`/api/events/${eventSlug}/save`, {
        method: newSavedState ? 'POST' : 'DELETE',
        headers,
      });

      if (!res.ok) {
        // Revert on error
        setIsSaved(!newSavedState);
        onSaveChange?.(eventSlug, !newSavedState);
        const text = await res.text().catch(() => '');
        console.error('[SaveEventButton] Save failed', res.status, text);
      }
    } catch (err) {
      // Revert on error
      setIsSaved(!newSavedState);
      onSaveChange?.(eventSlug, !newSavedState);
      console.error('[SaveEventButton] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, canSave, isSaved, isLoading, eventSlug, onSaveChange, openSignIn, session?.access_token]);

  const iconSize = size === 'small' ? 12 : 14;

  return (
    <>
      <div 
        className={`${styles.container} ${variant === 'with-label' ? styles.withLabelContainer : ''}`}
        data-theme={theme !== 'auto' ? theme : undefined}
      >
        <div className={styles.tooltipWrapper}>
          <button 
            className={`${styles.actionBtn} ${isSaved ? styles.activeFavorite : ''} ${isLoading ? styles.loading : ''} ${variant === 'with-label' ? styles.withLabel : ''} ${size === 'small' ? styles.smallBtn : ''}`}
            onClick={handleClick}
            onTouchEnd={handleClick}
            disabled={isLoading}
            aria-label={isSaved ? 'Unsave Event' : 'Save Event'}
            type="button"
          >
            {isLoading ? (
              <SpinnerIcon size={iconSize} />
            ) : (
              <HeartIcon filled={isSaved} size={iconSize} />
            )}
            {showLabel && (
              <span className={styles.labelText}>
                {isSaved ? 'Saved' : 'Save'}
              </span>
            )}
            <span className={styles.tooltip}>
              {isSaved ? 'Unsave Event' : 'Save Event'}
            </span>
          </button>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradePrompt && (
        <div className={styles.modalOverlay} onClick={() => setShowUpgradePrompt(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.modalClose}
              onClick={() => setShowUpgradePrompt(false)}
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div className={styles.modalIcon}>
              <HeartIcon filled size={32} />
            </div>
            <h3 className={styles.modalTitle}>Save Events for Later</h3>
            <p className={styles.modalDescription}>
              {eventName 
                ? `Bookmark "${eventName}" so you never miss it!`
                : 'Bookmark events so you never miss them!'
              }
              {' '}Saving events is available for Enthusiast members and above.
            </p>
            <div className={styles.modalActions}>
              <Link 
                href={upgradeCTA.href} 
                className={styles.upgradeBtn}
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
 * SaveEventButtonWithLabel - Shows Save/Saved label
 */
export function SaveEventButtonWithLabel(props) {
  return <SaveEventButton {...props} variant="with-label" showLabel={true} />;
}
