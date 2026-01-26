'use client';

/**
 * PaywallModal Component
 *
 * A modal paywall with:
 * - Plan comparison
 * - Social proof (user count)
 * - Monthly/annual billing toggle
 * - Feature highlights
 * - Placement tracking for analytics
 *
 * Used when users hit feature limits or try to access premium features.
 * Rendered via React Portal to document.body for proper stacking context.
 *
 * @module components/PaywallModal
 */

import React, { useState, useEffect, useCallback } from 'react';

import { createPortal } from 'react-dom';

import BillingToggle from '@/components/BillingToggle';
import { useAuth } from '@/components/providers/AuthProvider';
import { Icons } from '@/components/ui/Icons';
import { useCheckout } from '@/hooks/useCheckout';
import { getTierPricing } from '@/lib/stripe';
import { IS_BETA } from '@/lib/tierAccess';

import styles from './PaywallModal.module.css';

/**
 * Social proof data (static for now, could be dynamic)
 */
const SOCIAL_PROOF = {
  userCount: '10,000+',
  rating: '4.8',
  reviewCount: '500+',
};

/**
 * Feature highlights for each tier
 */
const TIER_HIGHLIGHTS = {
  collector: [
    { icon: Icons.car, label: 'VIN Decode your exact vehicle' },
    { icon: Icons.wrench, label: 'Track maintenance & recalls' },
    { icon: Icons.heart, label: '75 AL chats per month' },
  ],
  tuner: [
    { icon: Icons.zap, label: 'Dyno database & track times' },
    { icon: Icons.tools, label: 'Full parts catalog & fitments' },
    { icon: Icons.sparkle, label: '150 AL chats per month' },
  ],
};

/**
 * PaywallModal Component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close handler
 * @param {string} props.placement - Where the paywall was triggered from
 * @param {string} [props.feature] - Feature that triggered the paywall
 * @param {'collector'|'tuner'} [props.preselectedTier] - Pre-select a tier
 * @param {boolean} [props.showAnnualFirst] - Default to annual billing
 */
export default function PaywallModal({
  isOpen,
  onClose,
  placement,
  feature,
  preselectedTier = 'collector',
  showAnnualFirst = true,
}) {
  const { user } = useAuth();
  const { checkoutSubscription, isLoading: checkoutLoading } = useCheckout();

  const [selectedTier, setSelectedTier] = useState(preselectedTier);
  const [billingInterval, setBillingInterval] = useState(showAnnualFirst ? 'year' : 'month');
  const [showModal, setShowModal] = useState(false);

  // Portal mounting - required for SSR compatibility
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Track modal shown event
  useEffect(() => {
    if (isOpen) {
      setShowModal(true);
      // Track paywall_shown event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'paywall_shown', {
          placement,
          feature,
          user_tier: user?.subscription_tier || 'free',
        });
      }
    }
  }, [isOpen, placement, feature, user?.subscription_tier]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  const handleClose = useCallback(() => {
    // Track paywall_dismissed event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'paywall_dismissed', {
        placement,
        selected_tier: selectedTier,
      });
    }
    setShowModal(false);
    setTimeout(onClose, 200); // Wait for animation
  }, [onClose, placement, selectedTier]);

  const handleTierSelect = (tier) => {
    setSelectedTier(tier);
    // Track plan selection
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'paywall_plan_selected', {
        placement,
        plan: tier,
        interval: billingInterval,
      });
    }
  };

  const handleCTAClick = async () => {
    // Track CTA click
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'paywall_cta_clicked', {
        placement,
        plan: selectedTier,
        interval: billingInterval,
      });
    }

    if (IS_BETA) {
      // During beta, redirect to join page
      window.location.href = `/join?tier=${selectedTier}`;
      return;
    }

    // Proceed to checkout
    await checkoutSubscription(selectedTier, billingInterval);
  };

  if (!isOpen || !isMounted) return null;

  const _pricing = getTierPricing(selectedTier, billingInterval);
  const highlights = TIER_HIGHLIGHTS[selectedTier] || TIER_HIGHLIGHTS.collector;

  const modalContent = (
    <div
      className={`${styles.overlay} ${showModal ? styles.overlayVisible : ''}`}
      onClick={handleClose}
      data-overlay-modal
    >
      <div
        className={`${styles.modal} ${showModal ? styles.modalVisible : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
      >
        {/* Close Button */}
        <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
          <Icons.x size={20} />
        </button>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <Icons.crown size={32} />
          </div>
          <h2 id="paywall-title" className={styles.title}>
            {feature ? `Unlock ${feature}` : 'Upgrade Your Experience'}
          </h2>
          <p className={styles.subtitle}>
            {IS_BETA ? 'Get premium features free during beta' : 'Start your 7-day free trial'}
          </p>
        </div>

        {/* Social Proof */}
        <div className={styles.socialProof}>
          <div className={styles.proofItem}>
            <span className={styles.proofValue}>{SOCIAL_PROOF.userCount}</span>
            <span className={styles.proofLabel}>enthusiasts</span>
          </div>
          <div className={styles.proofDivider} />
          <div className={styles.proofItem}>
            <span className={styles.proofValue}>{SOCIAL_PROOF.rating}</span>
            <span className={styles.proofLabel}>★ rating</span>
          </div>
        </div>

        {/* Billing Toggle */}
        {!IS_BETA && (
          <div className={styles.billingToggle}>
            <BillingToggle
              interval={billingInterval}
              onChange={setBillingInterval}
              savingsPercent={50}
              variant="compact"
            />
          </div>
        )}

        {/* Plan Selection */}
        <div className={styles.plans}>
          {/* Collector/Enthusiast */}
          <button
            className={`${styles.planCard} ${selectedTier === 'collector' ? styles.planSelected : ''}`}
            onClick={() => handleTierSelect('collector')}
          >
            <div className={styles.planHeader}>
              <span className={styles.planName}>Enthusiast</span>
              {IS_BETA ? (
                <span className={styles.planPrice}>Free</span>
              ) : (
                <span className={styles.planPrice}>
                  {getTierPricing('collector', billingInterval)?.formattedPrice}
                  <span className={styles.planInterval}>
                    /{billingInterval === 'year' ? 'year' : 'mo'}
                  </span>
                </span>
              )}
            </div>
            <p className={styles.planDesc}>Own & maintain your car</p>
            {selectedTier === 'collector' && (
              <div className={styles.planCheck}>
                <Icons.check size={16} />
              </div>
            )}
          </button>

          {/* Tuner */}
          <button
            className={`${styles.planCard} ${selectedTier === 'tuner' ? styles.planSelected : ''} ${styles.planPopular}`}
            onClick={() => handleTierSelect('tuner')}
          >
            <span className={styles.popularBadge}>Most Popular</span>
            <div className={styles.planHeader}>
              <span className={styles.planName}>Tuner</span>
              {IS_BETA ? (
                <span className={styles.planPrice}>Free</span>
              ) : (
                <span className={styles.planPrice}>
                  {getTierPricing('tuner', billingInterval)?.formattedPrice}
                  <span className={styles.planInterval}>
                    /{billingInterval === 'year' ? 'year' : 'mo'}
                  </span>
                </span>
              )}
            </div>
            <p className={styles.planDesc}>Build & modify your car</p>
            {selectedTier === 'tuner' && (
              <div className={styles.planCheck}>
                <Icons.check size={16} />
              </div>
            )}
          </button>
        </div>

        {/* Feature Highlights */}
        <div className={styles.features}>
          <h4 className={styles.featuresTitle}>What you'll get:</h4>
          <ul className={styles.featuresList}>
            {highlights.map((highlight, idx) => (
              <li key={idx} className={styles.featureItem}>
                <highlight.icon size={18} />
                <span>{highlight.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <button className={styles.ctaButton} onClick={handleCTAClick} disabled={checkoutLoading}>
          {checkoutLoading
            ? 'Processing...'
            : IS_BETA
              ? 'Get Started Free'
              : 'Start 7-Day Free Trial'}
        </button>

        {/* Terms */}
        <p className={styles.terms}>
          {IS_BETA
            ? 'Free during beta. No credit card required.'
            : 'Cancel anytime. No questions asked.'}
        </p>
      </div>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(modalContent, document.body);
}
