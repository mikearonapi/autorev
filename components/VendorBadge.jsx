'use client';

/**
 * Vendor Badge Component
 * 
 * Displays trust indicators for parts vendors based on the PARTS_VENDOR_SHORTLIST.
 * Shows:
 * - Verified Vendor badge for known trusted vendors
 * - Best Price tag when a price is the lowest available
 * - Popular Choice tag for commonly selected parts
 * 
 * Used in:
 * - PartRecommendationCard
 * - PartsSelector shopping list
 * - AL chat responses
 */

import React, { useMemo } from 'react';
import { PARTS_VENDOR_SHORTLIST } from '@/lib/partsVendors';
import { Icons } from '@/components/ui/Icons';
import styles from './VendorBadge.module.css';

// Build a lookup map of all trusted vendors
const TRUSTED_VENDORS_MAP = (() => {
  const map = new Map();
  
  PARTS_VENDOR_SHORTLIST.forEach(family => {
    family.vendors.forEach(vendor => {
      const key = vendor.key.toLowerCase();
      map.set(key, {
        name: vendor.name,
        url: vendor.url,
        family: family.family,
        key: vendor.key,
      });
    });
  });
  
  return map;
})();

/**
 * Check if a vendor name matches a trusted vendor
 * Returns the vendor info if found, null otherwise
 */
export function getTrustedVendorInfo(vendorName) {
  if (!vendorName) return null;
  
  // Normalize the vendor name
  const normalized = vendorName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Check direct key match
  if (TRUSTED_VENDORS_MAP.has(normalized)) {
    return TRUSTED_VENDORS_MAP.get(normalized);
  }
  
  // Check partial matches
  for (const [key, vendor] of TRUSTED_VENDORS_MAP) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return vendor;
    }
  }
  
  return null;
}

/**
 * Check if a vendor is trusted
 */
export function isTrustedVendor(vendorName) {
  return getTrustedVendorInfo(vendorName) !== null;
}

/**
 * Vendor Badge Types
 */
const BADGE_TYPES = {
  verified: {
    icon: 'shield',
    label: 'Verified Vendor',
    className: 'badgeVerified',
    tooltip: 'This vendor is on our trusted vendor list',
  },
  bestPrice: {
    icon: 'tag',
    label: 'Best Price',
    className: 'badgeBestPrice',
    tooltip: 'This is the lowest price we found',
  },
  popular: {
    icon: 'trending',
    label: 'Popular',
    className: 'badgePopular',
    tooltip: 'Frequently chosen by other builders',
  },
  fitmentVerified: {
    icon: 'check',
    label: 'Verified Fit',
    className: 'badgeFitment',
    tooltip: 'Fitment has been verified for this car',
  },
};

/**
 * Single badge icon
 */
function BadgeIcon({ type }) {
  const iconMap = {
    shield: <Icons.shield size={10} />,
    tag: <Icons.tag size={10} />,
    trending: <Icons.trendingUp size={10} />,
    check: <Icons.check size={10} />,
  };
  
  return iconMap[type] || null;
}

/**
 * Individual Vendor Badge
 */
export function VendorBadgeItem({ type, compact = false }) {
  const badge = BADGE_TYPES[type];
  if (!badge) return null;
  
  return (
    <span 
      className={`${styles.badge} ${styles[badge.className]} ${compact ? styles.compact : ''}`}
      title={badge.tooltip}
    >
      <BadgeIcon type={badge.icon} />
      {!compact && <span>{badge.label}</span>}
    </span>
  );
}

/**
 * Full Vendor Badge Component
 * Shows vendor name with applicable trust badges
 */
export default function VendorBadge({
  vendorName,
  isBestPrice = false,
  isPopular = false,
  fitmentVerified = false,
  productUrl = null,
  compact = false,
  showName = true,
  className = '',
}) {
  const vendorInfo = useMemo(() => getTrustedVendorInfo(vendorName), [vendorName]);
  const isTrusted = vendorInfo !== null;
  
  if (!vendorName && !isBestPrice && !isPopular && !fitmentVerified) {
    return null;
  }
  
  return (
    <div className={`${styles.vendorBadge} ${className}`}>
      {showName && vendorName && (
        <span className={styles.vendorName}>
          {productUrl ? (
            <a 
              href={productUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.vendorLink}
            >
              {vendorInfo?.name || vendorName}
              <Icons.externalLink size={10} />
            </a>
          ) : (
            vendorInfo?.name || vendorName
          )}
        </span>
      )}
      
      <div className={styles.badges}>
        {isTrusted && <VendorBadgeItem type="verified" compact={compact} />}
        {isBestPrice && <VendorBadgeItem type="bestPrice" compact={compact} />}
        {isPopular && <VendorBadgeItem type="popular" compact={compact} />}
        {fitmentVerified && <VendorBadgeItem type="fitmentVerified" compact={compact} />}
      </div>
    </div>
  );
}

/**
 * Compact vendor indicator for inline use
 */
export function VendorIndicator({ vendorName, isBestPrice, fitmentVerified }) {
  const isTrusted = isTrustedVendor(vendorName);
  
  if (!isTrusted && !isBestPrice && !fitmentVerified) {
    return vendorName ? <span className={styles.vendorPlain}>{vendorName}</span> : null;
  }
  
  return (
    <span className={styles.vendorIndicator}>
      {isTrusted && <Icons.shield size={12} className={styles.trustedIcon} />}
      {vendorName}
      {isBestPrice && <span className={styles.bestPriceTag}>Best Price</span>}
    </span>
  );
}
