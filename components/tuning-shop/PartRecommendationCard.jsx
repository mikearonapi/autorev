'use client';

/**
 * Part Recommendation Card
 * 
 * Displays a part recommendation from AL with one-click "Add to Build" functionality.
 * When clicked, all part data (brand, price, vendor, etc.) is auto-populated -
 * no manual entry required.
 * 
 * Used in:
 * - AL chat when findBestParts returns results
 * - PartsSelector "Find with AL" results
 */

import React, { useState, useCallback } from 'react';

import { Icons } from '@/components/ui/Icons';
import { PARTS_VENDOR_SHORTLIST } from '@/lib/partsVendors';

import styles from './PartRecommendationCard.module.css';

// Get all vendor keys for trust badge lookup
const TRUSTED_VENDORS = new Set(
  PARTS_VENDOR_SHORTLIST.flatMap(family => 
    family.vendors.map(v => v.key.toLowerCase())
  )
);

/**
 * Check if a vendor name matches a trusted vendor
 */
function isTrustedVendor(vendorName) {
  if (!vendorName) return false;
  const normalized = vendorName.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const key of TRUSTED_VENDORS) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return true;
    }
  }
  return false;
}

/**
 * Format price from cents to dollars
 */
function formatPrice(priceCents, currency = 'USD') {
  if (!priceCents) return null;
  const dollars = priceCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars);
}

/**
 * Get difficulty label and color
 */
function getDifficultyInfo(difficulty) {
  const levels = {
    1: { label: 'DIY Easy', color: 'teal' },
    2: { label: 'DIY Moderate', color: 'teal' },
    3: { label: 'Intermediate', color: 'warning' },
    4: { label: 'Advanced', color: 'warning' },
    5: { label: 'Pro Required', color: 'error' },
  };
  return levels[difficulty] || { label: 'Unknown', color: 'muted' };
}

export default function PartRecommendationCard({
  part,
  onAddToBuild,
  onViewDetails,
  isAdding = false,
  isAdded = false,
  compact = false,
}) {
  const [showDetails, setShowDetails] = useState(false);
  
  const {
    part_id,
    name,
    brand_name,
    part_number,
    category,
    price_cents,
    currency,
    vendor_name,
    product_url,
    fitment_verified,
    fitment_confidence,
    fitment_notes,
    requires_tune,
    install_difficulty,
    estimated_labor_hours,
    is_best_price,
    quality_tier,
    street_legal,
    source_url,
  } = part || {};

  const price = formatPrice(price_cents, currency);
  const isTrusted = isTrustedVendor(vendor_name);
  const difficultyInfo = getDifficultyInfo(install_difficulty);
  
  const handleAddToBuild = useCallback(() => {
    if (onAddToBuild && !isAdding && !isAdded) {
      onAddToBuild(part);
    }
  }, [onAddToBuild, part, isAdding, isAdded]);

  const handleViewDetails = useCallback(() => {
    if (product_url) {
      window.open(product_url, '_blank', 'noopener,noreferrer');
    } else if (onViewDetails) {
      onViewDetails(part);
    }
  }, [product_url, onViewDetails, part]);

  if (!part) return null;

  return (
    <div className={`${styles.card} ${compact ? styles.compact : ''} ${isAdded ? styles.added : ''}`}>
      {/* Header: Brand & Name */}
      <div className={styles.header}>
        <div className={styles.brandInfo}>
          {brand_name && (
            <span className={styles.brandName}>{brand_name}</span>
          )}
          <h4 className={styles.partName}>{name || 'Unknown Part'}</h4>
          {part_number && (
            <span className={styles.partNumber}>#{part_number}</span>
          )}
        </div>
        
        {/* Badges */}
        <div className={styles.badges}>
          {fitment_verified && (
            <span className={`${styles.badge} ${styles.badgeVerified}`}>
              <Icons.check size={10} />
              Verified Fit
            </span>
          )}
          {is_best_price && (
            <span className={`${styles.badge} ${styles.badgeBestPrice}`}>
              Best Price
            </span>
          )}
          {requires_tune && (
            <span className={`${styles.badge} ${styles.badgeTune}`}>
              Tune Required
            </span>
          )}
        </div>
      </div>

      {/* Price & Vendor Row */}
      <div className={styles.priceRow}>
        <div className={styles.priceInfo}>
          {price ? (
            <span className={styles.price}>{price}</span>
          ) : (
            <span className={styles.priceUnknown}>Price TBD</span>
          )}
          {vendor_name && (
            <span className={styles.vendor}>
              {isTrusted && <Icons.shield size={12} className={styles.trustedIcon} />}
              {vendor_name}
            </span>
          )}
        </div>
        
        {quality_tier && (
          <span className={`${styles.tierBadge} ${styles[`tier${quality_tier}`]}`}>
            {quality_tier.charAt(0).toUpperCase() + quality_tier.slice(1)}
          </span>
        )}
      </div>

      {/* Install Info */}
      {(install_difficulty || estimated_labor_hours) && (
        <div className={styles.installInfo}>
          {install_difficulty && (
            <span className={`${styles.difficulty} ${styles[`difficulty${difficultyInfo.color}`]}`}>
              <Icons.wrench size={12} />
              {difficultyInfo.label}
            </span>
          )}
          {estimated_labor_hours && (
            <span className={styles.laborHours}>
              <Icons.clock size={12} />
              ~{estimated_labor_hours}h labor
            </span>
          )}
        </div>
      )}

      {/* Fitment Notes (expandable) */}
      {fitment_notes && (
        <button 
          className={styles.notesToggle}
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide notes' : 'Show fitment notes'}
          <Icons.chevronDown size={12} className={showDetails ? styles.rotated : ''} />
        </button>
      )}
      {showDetails && fitment_notes && (
        <p className={styles.fitmentNotes}>{fitment_notes}</p>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        {product_url && (
          <button 
            className={styles.viewBtn}
            onClick={handleViewDetails}
          >
            <Icons.externalLink size={14} />
            View
          </button>
        )}
        
        <button 
          className={`${styles.addBtn} ${isAdded ? styles.addBtnAdded : ''}`}
          onClick={handleAddToBuild}
          disabled={isAdding || isAdded}
        >
          {isAdding ? (
            <>
              <span className={styles.spinner} />
              Adding...
            </>
          ) : isAdded ? (
            <>
              <Icons.check size={14} />
              Added
            </>
          ) : (
            <>
              <Icons.plus size={14} />
              Add to Build
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Container for displaying multiple AL-recommended parts
 */
export function ALPartsResults({
  parts = [],
  upgradeType,
  carName,
  onAddPart,
  addedPartIds = new Set(),
  isLoading = false,
}) {
  const [addingPartId, setAddingPartId] = useState(null);

  const handleAddPart = useCallback(async (part) => {
    setAddingPartId(part.part_id);
    try {
      await onAddPart?.(part);
    } finally {
      setAddingPartId(null);
    }
  }, [onAddPart]);

  if (isLoading) {
    return (
      <div className={styles.resultsContainer}>
        <div className={styles.loadingState}>
          <span className={styles.loadingSpinner} />
          <span>Finding best {upgradeType} parts for {carName}...</span>
        </div>
      </div>
    );
  }

  if (!parts.length) {
    return (
      <div className={styles.resultsContainer}>
        <div className={styles.emptyState}>
          <Icons.search size={24} />
          <p>No parts found for this upgrade. Try a different search.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.resultsContainer}>
      <div className={styles.resultsHeader}>
        <h3 className={styles.resultsTitle}>
          <Icons.star size={16} />
          AL Recommends
        </h3>
        <span className={styles.resultsCount}>{parts.length} options</span>
      </div>
      
      <div className={styles.resultsList}>
        {parts.map((part, index) => (
          <PartRecommendationCard
            key={part.part_id || index}
            part={part}
            onAddToBuild={handleAddPart}
            isAdding={addingPartId === part.part_id}
            isAdded={addedPartIds.has(part.part_id)}
          />
        ))}
      </div>
    </div>
  );
}
