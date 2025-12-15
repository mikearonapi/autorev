'use client';

/**
 * PremiumGate Component
 * 
 * A wrapper that conditionally shows content or an upgrade prompt
 * based on user's subscription tier.
 * 
 * Usage:
 * <PremiumGate feature="dynoDatabase" fallback={<UpgradeTeaser />}>
 *   <DynoDataSection />
 * </PremiumGate>
 * 
 * Or with inline upgrade prompt:
 * <PremiumGate feature="ownerReference">
 *   <OwnerReferencePanel />
 * </PremiumGate>
 */

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  hasAccess,
  shouldShowUpgradePrompt,
  getFeatureConfig,
  getUpgradeCTA,
  TIER_CONFIG,
  IS_BETA,
} from '@/lib/tierAccess';
import styles from './PremiumGate.module.css';

// Icons
const Icons = {
  lock: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  sparkle: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"/>
    </svg>
  ),
  arrowRight: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  crown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
    </svg>
  ),
};

/**
 * Default upgrade prompt shown when user doesn't have access
 */
function DefaultUpgradePrompt({ feature, featureConfig, upgradeCTA, variant = 'default' }) {
  const tierConfig = TIER_CONFIG[upgradeCTA.tier];
  
  if (variant === 'inline') {
    return (
      <div className={styles.inlinePrompt}>
        <Icons.lock size={14} />
        <span>{featureConfig?.name || 'This feature'} requires {upgradeCTA.tierName}</span>
        <Link href={upgradeCTA.href} className={styles.inlineLink}>
          Upgrade <Icons.arrowRight size={12} />
        </Link>
      </div>
    );
  }
  
  if (variant === 'compact') {
    return (
      <div className={styles.compactPrompt} style={{ '--tier-color': tierConfig?.color }}>
        <div className={styles.compactHeader}>
          <Icons.lock size={16} />
          <span>{upgradeCTA.tierName} Feature</span>
        </div>
        <p className={styles.compactDescription}>
          {featureConfig?.description || 'Upgrade to access this feature'}
        </p>
        <Link href={upgradeCTA.href} className={styles.compactCTA}>
          {upgradeCTA.text}
        </Link>
      </div>
    );
  }
  
  // Default full card
  return (
    <div className={styles.upgradeCard} style={{ '--tier-color': tierConfig?.color }}>
      <div className={styles.cardIcon}>
        <Icons.crown size={32} />
      </div>
      <h3 className={styles.cardTitle}>
        {featureConfig?.name || 'Premium Feature'}
      </h3>
      <p className={styles.cardDescription}>
        {featureConfig?.description || 'Upgrade your plan to access this feature'}
      </p>
      <div className={styles.cardTier}>
        <span className={styles.tierBadge}>{upgradeCTA.tierName}</span>
        <span className={styles.tierPrice}>{upgradeCTA.price}</span>
      </div>
      <Link href={upgradeCTA.href} className={styles.cardCTA}>
        {upgradeCTA.text}
        <Icons.arrowRight size={16} />
      </Link>
      {IS_BETA && (
        <p className={styles.betaNote}>
          <Icons.sparkle size={12} />
          Free during beta!
        </p>
      )}
    </div>
  );
}

/**
 * Teaser prompt for free tier - shows limited content with upgrade hook
 */
export function TeaserPrompt({ 
  message, 
  totalCount, 
  shownCount, 
  targetTier = 'collector',
  variant = 'default' 
}) {
  const tierConfig = TIER_CONFIG[targetTier];
  const upgradeCTA = getUpgradeCTA(targetTier);
  
  return (
    <div className={`${styles.teaserPrompt} ${styles[`teaser_${variant}`]}`} style={{ '--tier-color': tierConfig?.color }}>
      <div className={styles.teaserContent}>
        <Icons.lock size={16} />
        <span>
          {message || `Showing ${shownCount} of ${totalCount}`}
        </span>
      </div>
      <Link href={upgradeCTA.href} className={styles.teaserCTA}>
        See all {totalCount} <Icons.arrowRight size={14} />
      </Link>
    </div>
  );
}

/**
 * Main PremiumGate component
 */
export default function PremiumGate({ 
  feature,           // Feature key from tierAccess.js
  requiredTier,      // Alternative: specify tier directly
  children,          // Content to show if user has access
  fallback,          // Optional custom fallback component
  variant = 'default', // 'default' | 'inline' | 'compact' | 'hidden'
  showBetaOverride = true, // Show content during beta even without access
}) {
  const { isAuthenticated, profile } = useAuth();
  const userTier = profile?.subscription_tier || 'free';
  
  // Determine required tier
  const featureConfig = feature ? getFeatureConfig(feature) : null;
  const effectiveTier = requiredTier || featureConfig?.tier || 'free';
  
  // Check access
  const canAccess = hasAccess(userTier, feature || effectiveTier, isAuthenticated);
  const showPrompt = shouldShowUpgradePrompt(userTier, feature || effectiveTier, isAuthenticated);
  
  // During beta with authenticated user, show content
  if (IS_BETA && isAuthenticated && showBetaOverride) {
    return <>{children}</>;
  }
  
  // If user has access, show content
  if (canAccess && !showPrompt) {
    return <>{children}</>;
  }
  
  // User doesn't have access - show upgrade prompt
  const upgradeCTA = getUpgradeCTA(effectiveTier);
  
  // Hidden variant - just don't render anything
  if (variant === 'hidden') {
    return null;
  }
  
  // Custom fallback provided
  if (fallback) {
    return <>{fallback}</>;
  }
  
  // Default upgrade prompt
  return (
    <DefaultUpgradePrompt
      feature={feature}
      featureConfig={featureConfig}
      upgradeCTA={upgradeCTA}
      variant={variant}
    />
  );
}

/**
 * Hook version for more control
 */
export function usePremiumAccess(feature, requiredTier = null) {
  const { isAuthenticated, profile } = useAuth();
  const userTier = profile?.subscription_tier || 'free';
  
  const featureConfig = feature ? getFeatureConfig(feature) : null;
  const effectiveTier = requiredTier || featureConfig?.tier || 'free';
  
  const canAccess = hasAccess(userTier, feature || effectiveTier, isAuthenticated);
  const showPrompt = shouldShowUpgradePrompt(userTier, feature || effectiveTier, isAuthenticated);
  const upgradeCTA = getUpgradeCTA(effectiveTier);
  
  // During beta, authenticated users have access
  const effectiveAccess = (IS_BETA && isAuthenticated) ? true : canAccess;
  const effectiveShowPrompt = (IS_BETA && isAuthenticated) ? false : showPrompt;
  
  return {
    hasAccess: effectiveAccess,
    showUpgradePrompt: effectiveShowPrompt,
    userTier,
    requiredTier: effectiveTier,
    featureConfig,
    upgradeCTA,
    isAuthenticated,
    isBeta: IS_BETA,
  };
}

