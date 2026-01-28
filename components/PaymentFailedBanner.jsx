'use client';

/**
 * Payment Failed Banner Component
 * 
 * Displays a banner when a user's subscription payment has failed.
 * Part of the dunning management system for subscription recovery.
 * 
 * Features:
 * - Prominent but non-intrusive warning
 * - Direct link to update payment method
 * - Dismissible with localStorage persistence
 * 
 * @module components/PaymentFailedBanner
 */

import { useState, useEffect } from 'react';

import { useSubscription } from '@/hooks/useSubscription';

import styles from './PaymentFailedBanner.module.css';

/**
 * Payment Failed Banner
 * Shows when subscription status is 'past_due'
 */
export default function PaymentFailedBanner() {
  const { isPastDue, tier, openCustomerPortal, isPortalLoading } = useSubscription();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check for dismissed state
  useEffect(() => {
    const dismissed = localStorage.getItem('payment_failed_banner_dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      // Re-show after 24 hours
      if (now - dismissedDate > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('payment_failed_banner_dismissed');
      } else {
        setIsDismissed(true);
      }
    }
    setIsLoading(false);
  }, []);
  
  // Handle dismiss
  const handleDismiss = () => {
    localStorage.setItem('payment_failed_banner_dismissed', new Date().toISOString());
    setIsDismissed(true);
  };
  
  // Handle update payment
  const handleUpdatePayment = async () => {
    await openCustomerPortal();
  };
  
  // Don't show if not past due, dismissed, or still loading
  if (isLoading || !isPastDue || isDismissed) {
    return null;
  }
  
  return (
    <div className={styles.banner} role="alert">
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        
        <div className={styles.message}>
          <strong>Payment failed</strong>
          <span className={styles.description}>
            We couldn't process your payment. Please update your payment method to keep your {tier} access.
          </span>
        </div>
        
        <div className={styles.actions}>
          <button
            onClick={handleUpdatePayment}
            className={styles.updateButton}
            disabled={isPortalLoading}
          >
            {isPortalLoading ? 'Loading...' : 'Update Payment'}
          </button>
          
          <button
            onClick={handleDismiss}
            className={styles.dismissButton}
            aria-label="Dismiss"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
