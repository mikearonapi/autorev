'use client';

/**
 * SubscriptionDisclosure Component
 * 
 * Displays App Store compliant subscription terms and conditions.
 * Required for compliance with Apple App Store Guidelines (section 3.1.2).
 * 
 * Shows auto-renewal terms, cancellation policy, and trial forfeiture notice.
 * 
 * @module components/SubscriptionDisclosure
 */

import React from 'react';

import styles from './SubscriptionDisclosure.module.css';

/**
 * Subscription Disclosure component for App Store compliance
 * 
 * @param {Object} props
 * @param {string} [props.price] - Price to display (e.g., "$9.99/month")
 * @param {string} [props.tierName] - Tier name (e.g., "Tuner")
 * @param {boolean} [props.hasTrial] - Whether subscription includes a trial
 * @param {number} [props.trialDays] - Number of trial days (default: 7)
 * @param {'month'|'year'} [props.billingInterval] - Billing interval
 * @param {string} [props.variant] - 'default' | 'compact' | 'minimal'
 */
export default function SubscriptionDisclosure({
  price,
  tierName,
  hasTrial = true,
  trialDays = 7,
  billingInterval = 'month',
  variant = 'default',
}) {
  const isAnnual = billingInterval === 'year';
  const billingLabel = isAnnual ? 'annually' : 'monthly';
  const periodLabel = isAnnual ? 'year' : 'month';

  if (variant === 'minimal') {
    return (
      <p className={styles.minimal}>
        Subscriptions auto-renew {billingLabel} unless canceled 24h before period end.{' '}
        <a href="/terms" className={styles.link}>Terms</a> &middot;{' '}
        <a href="/privacy" className={styles.link}>Privacy</a>
      </p>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={styles.compact}>
        <p className={styles.compactText}>
          {hasTrial && `${trialDays}-day free trial, then `}
          {price || 'subscription'} billed {billingLabel}.
          Auto-renews unless canceled at least 24 hours before the current period ends.
        </p>
        <p className={styles.compactLinks}>
          <a href="/terms" className={styles.link}>Terms</a> &middot;{' '}
          <a href="/privacy" className={styles.link}>Privacy</a>
        </p>
      </div>
    );
  }

  // Default full disclosure
  return (
    <div className={styles.disclosure}>
      <div className={styles.content}>
        <p className={styles.terms}>
          {hasTrial ? (
            <>
              Start your <strong>{trialDays}-day free trial</strong> of {tierName || 'AutoRev Premium'}.{' '}
              After your trial, {price ? <strong>{price}</strong> : 'your subscription'} will be charged {billingLabel} to your payment method.{' '}
            </>
          ) : (
            <>
              {price ? <strong>{price}</strong> : 'Your subscription'} will be charged {billingLabel} to your payment method upon confirmation.{' '}
            </>
          )}
          Subscriptions automatically renew unless canceled at least 24 hours before the end of the current {periodLabel}.
        </p>
        
        <p className={styles.management}>
          You can manage or cancel your subscription anytime in your{' '}
          <a href="/profile" className={styles.link}>account settings</a>.
        </p>

        {hasTrial && (
          <p className={styles.trialNotice}>
            <span className={styles.icon}>ℹ️</span>
            Any unused portion of a free trial will be forfeited when you purchase a subscription.
          </p>
        )}
      </div>
      
      <div className={styles.legal}>
        By subscribing, you agree to our{' '}
        <a href="/terms" className={styles.link}>Terms of Service</a> and{' '}
        <a href="/privacy" className={styles.link}>Privacy Policy</a>.
      </div>
    </div>
  );
}
