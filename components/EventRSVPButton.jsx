'use client';

/**
 * EventRSVPButton Component
 * 
 * RSVP to events with "Going" or "Interested" status.
 * Shows who else is attending to foster community connections at car events.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

import { useSetEventRsvp, useRemoveEventRsvp, useEventRsvp } from '@/hooks/useEventsData';

import { useAuthModal } from './AuthModal';
import styles from './EventRSVPButton.module.css';
import { useAuth } from './providers/AuthProvider';

// Icons
const CheckIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const StarIcon = ({ filled = false, size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ChevronIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const SpinnerIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.spinnerSvg}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

/**
 * EventRSVPButton component
 * 
 * @param {Object} props
 * @param {string} props.eventSlug - Event slug
 * @param {string} [props.eventName] - Event name for display
 * @param {Object} [props.initialRsvp] - Initial RSVP state { status: 'going' | 'interested' }
 * @param {Function} [props.onRsvpChange] - Callback when RSVP changes: (eventSlug, status | null) => void
 * @param {string} [props.variant] - 'default' | 'compact' | 'full-width'
 * @param {boolean} [props.showDropdown] - Show dropdown for status selection (default: true)
 */
export default function EventRSVPButton({
  eventSlug,
  eventName,
  initialRsvp = null,
  onRsvpChange,
  variant = 'default',
  showDropdown = true,
}) {
  const { isAuthenticated, user, session } = useAuth();
  const { openSignIn } = useAuthModal();
  
  const [rsvpStatus, setRsvpStatus] = useState(initialRsvp?.status || null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  
  // React Query hooks
  const setRsvpMutation = useSetEventRsvp();
  const removeRsvpMutation = useRemoveEventRsvp();
  
  // Fetch existing RSVP status if user is authenticated
  const { data: rsvpData } = useEventRsvp(eventSlug, {
    enabled: isAuthenticated && !!user?.id && !initialRsvp,
  });
  
  // Update local state from query
  useEffect(() => {
    if (rsvpData?.rsvp?.status) {
      setRsvpStatus(rsvpData.rsvp.status);
    }
  }, [rsvpData]);
  
  // Sync with prop
  useEffect(() => {
    if (initialRsvp?.status !== undefined) {
      setRsvpStatus(initialRsvp.status);
    }
  }, [initialRsvp?.status]);
  
  const isLoading = setRsvpMutation.isPending || removeRsvpMutation.isPending;
  
  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target) && 
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);
  
  // Debounce rapid taps
  const lastTapRef = useRef(0);
  
  /**
   * Handle RSVP button click
   */
  const handleButtonClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Debounce
    const now = Date.now();
    if (now - lastTapRef.current < 300) return;
    lastTapRef.current = now;
    
    // Check auth
    if (!isAuthenticated) {
      openSignIn();
      return;
    }
    
    if (isLoading) return;
    
    // If no current RSVP, default to "going"
    if (!rsvpStatus) {
      handleSetRsvp('going');
    } else if (showDropdown) {
      // Toggle menu
      setShowMenu(prev => !prev);
    } else {
      // Remove RSVP
      handleRemoveRsvp();
    }
  }, [isAuthenticated, isLoading, rsvpStatus, showDropdown, openSignIn]);
  
  /**
   * Set RSVP status
   */
  const handleSetRsvp = useCallback(async (status) => {
    if (!isAuthenticated || isLoading) return;
    
    setShowMenu(false);
    
    // Optimistic update
    setRsvpStatus(status);
    onRsvpChange?.(eventSlug, status);
    
    // Build headers
    const headers = {};
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
    
    try {
      await setRsvpMutation.mutateAsync({
        eventSlug,
        status,
        visibility: 'public',
        headers,
      });
    } catch (err) {
      // Revert on error
      setRsvpStatus(rsvpStatus);
      onRsvpChange?.(eventSlug, rsvpStatus);
      console.error('[EventRSVPButton] Error setting RSVP:', err);
    }
  }, [isAuthenticated, isLoading, eventSlug, session, setRsvpMutation, rsvpStatus, onRsvpChange]);
  
  /**
   * Remove RSVP
   */
  const handleRemoveRsvp = useCallback(async () => {
    if (!isAuthenticated || isLoading) return;
    
    setShowMenu(false);
    
    // Optimistic update
    const previousStatus = rsvpStatus;
    setRsvpStatus(null);
    onRsvpChange?.(eventSlug, null);
    
    // Build headers
    const headers = {};
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
    
    try {
      await removeRsvpMutation.mutateAsync({ eventSlug, headers });
    } catch (err) {
      // Revert on error
      setRsvpStatus(previousStatus);
      onRsvpChange?.(eventSlug, previousStatus);
      console.error('[EventRSVPButton] Error removing RSVP:', err);
    }
  }, [isAuthenticated, isLoading, eventSlug, session, removeRsvpMutation, rsvpStatus, onRsvpChange]);
  
  // Determine button appearance
  const buttonLabel = rsvpStatus === 'going' ? 'Going' : rsvpStatus === 'interested' ? 'Interested' : 'RSVP';
  const isActive = !!rsvpStatus;
  
  return (
    <div className={`${styles.container} ${styles[variant]}`}>
      <button
        ref={buttonRef}
        className={`${styles.rsvpBtn} ${isActive ? styles.active : ''} ${rsvpStatus === 'going' ? styles.going : ''} ${rsvpStatus === 'interested' ? styles.interested : ''}`}
        onClick={handleButtonClick}
        disabled={isLoading}
        aria-label={isActive ? `RSVP: ${buttonLabel}` : 'RSVP to this event'}
        aria-pressed={isActive}
        type="button"
      >
        {isLoading ? (
          <SpinnerIcon size={14} />
        ) : rsvpStatus === 'going' ? (
          <CheckIcon size={14} />
        ) : rsvpStatus === 'interested' ? (
          <StarIcon filled size={14} />
        ) : (
          <CheckIcon size={14} />
        )}
        <span className={styles.label}>{buttonLabel}</span>
        {showDropdown && isActive && (
          <ChevronIcon size={12} />
        )}
      </button>
      
      {/* Dropdown Menu */}
      {showMenu && showDropdown && (
        <div ref={menuRef} className={styles.menu}>
          <button
            className={`${styles.menuItem} ${rsvpStatus === 'going' ? styles.menuItemActive : ''}`}
            onClick={() => handleSetRsvp('going')}
            type="button"
          >
            <CheckIcon size={16} />
            <div className={styles.menuItemContent}>
              <span className={styles.menuItemLabel}>Going</span>
              <span className={styles.menuItemDesc}>I plan to attend</span>
            </div>
          </button>
          
          <button
            className={`${styles.menuItem} ${rsvpStatus === 'interested' ? styles.menuItemActive : ''}`}
            onClick={() => handleSetRsvp('interested')}
            type="button"
          >
            <StarIcon size={16} />
            <div className={styles.menuItemContent}>
              <span className={styles.menuItemLabel}>Interested</span>
              <span className={styles.menuItemDesc}>I might attend</span>
            </div>
          </button>
          
          <div className={styles.menuDivider} />
          
          <button
            className={`${styles.menuItem} ${styles.menuItemRemove}`}
            onClick={handleRemoveRsvp}
            type="button"
          >
            <span className={styles.menuItemLabel}>Remove RSVP</span>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Compact variant - icon only
 */
export function EventRSVPButtonCompact(props) {
  return <EventRSVPButton {...props} variant="compact" showDropdown={false} />;
}

/**
 * Full width variant - for event detail pages
 */
export function EventRSVPButtonFull(props) {
  return <EventRSVPButton {...props} variant="full-width" />;
}
