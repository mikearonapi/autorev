'use client';

/**
 * Pit Lane Notice
 *
 * Full-screen dismissible notice shown after login to inform users
 * about ongoing updates/maintenance. Racing-themed messaging.
 *
 * Features:
 * - Only shows for authenticated users
 * - Dismissible with localStorage persistence
 * - Optional expiry to re-show after certain time
 * - Full-screen modal with racing theme
 *
 * @module components/PitLaneNotice
 */

import { useState, useEffect, useCallback } from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { Icons } from '@/components/ui/Icons';
import Modal from '@/components/ui/Modal';

import styles from './PitLaneNotice.module.css';

// =============================================================================
// CONFIGURATION
// =============================================================================

/** localStorage key for tracking dismissal */
const NOTICE_DISMISSED_KEY = 'autorev_pit_lane_notice_dismissed';

/**
 * How long the dismissal lasts (in milliseconds)
 * Set to null for permanent dismissal (until manually reset)
 * Set to a duration to re-show after that time (e.g., 24 hours)
 */
const DISMISSAL_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Version of the notice - increment to force re-display
 * even for users who dismissed a previous version
 */
const NOTICE_VERSION = '2026-02-01-v1';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Check if the notice has been dismissed (and dismissal hasn't expired)
 */
function isNoticeDismissed() {
  if (typeof window === 'undefined') return true; // SSR - don't show

  try {
    const stored = localStorage.getItem(NOTICE_DISMISSED_KEY);
    if (!stored) return false;

    const { timestamp, version } = JSON.parse(stored);

    // If version changed, show the notice again
    if (version !== NOTICE_VERSION) {
      localStorage.removeItem(NOTICE_DISMISSED_KEY);
      return false;
    }

    // If permanent dismissal (no duration), stay dismissed
    if (!DISMISSAL_DURATION_MS) return true;

    // Check if dismissal has expired
    const elapsed = Date.now() - timestamp;
    if (elapsed > DISMISSAL_DURATION_MS) {
      localStorage.removeItem(NOTICE_DISMISSED_KEY);
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Store dismissal in localStorage
 */
function dismissNotice() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(
      NOTICE_DISMISSED_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        version: NOTICE_VERSION,
      })
    );
  } catch (err) {
    console.error('[PitLaneNotice] Failed to store dismissal:', err);
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * PitLaneNotice Component
 *
 * Shows a full-screen notice about ongoing updates after login.
 *
 * @param {Object} props
 * @param {boolean} [props.enabled=true] - Master toggle to enable/disable the notice
 */
export default function PitLaneNotice({ enabled = true }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  // Check if we should show the notice
  useEffect(() => {
    // Don't show while auth is loading
    if (isLoading) return;

    // Only show for authenticated users
    if (!isAuthenticated) return;

    // Check if disabled
    if (!enabled) return;

    // Delay slightly to avoid flash during hydration
    const timer = setTimeout(() => {
      if (!isNoticeDismissed()) {
        setIsVisible(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, enabled]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    dismissNotice();
    setIsVisible(false);
  }, []);

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <Modal
      isOpen={isVisible}
      onClose={handleDismiss}
      size="full"
      closeOnEsc={true}
      closeOnOverlay={false}
      showCloseButton={false}
    >
      <div className={styles.container}>
        {/* Racing-themed header */}
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <Icons.wrench className={styles.icon} />
          </div>
          <h1 className={styles.title}>We're in the Pit Lane</h1>
        </div>

        {/* Message content */}
        <div className={styles.content}>
          <p className={styles.message}>
            Our crew is working on some upgrades to AutoRev right now.
          </p>
          <p className={styles.submessage}>
            You may experience occasional hiccups while we tune things up. We appreciate your
            patience!
          </p>
        </div>

        {/* Decorative elements */}
        <div className={styles.decorativeStripes} aria-hidden="true">
          <div className={styles.stripe} />
          <div className={styles.stripe} />
          <div className={styles.stripe} />
        </div>

        {/* Dismiss button */}
        <div className={styles.footer}>
          <button onClick={handleDismiss} className={styles.dismissButton} type="button">
            Got it, let's go!
          </button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Hook to manually control pit lane notice visibility
 * Useful for testing or admin controls
 */
export function usePitLaneNotice() {
  const reset = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(NOTICE_DISMISSED_KEY);
  }, []);

  const dismiss = useCallback(() => {
    dismissNotice();
  }, []);

  return { reset, dismiss };
}
