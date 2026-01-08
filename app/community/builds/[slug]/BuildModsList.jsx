'use client';

/**
 * Build Mods List - Professional Design
 * 
 * Displays categorized list of parts/mods for a community build.
 * Features:
 * - Clean SVG icons (no emojis)
 * - Expandable category cards
 * - Shows specific products when specified
 * - Owner can add/edit specific parts
 */

import { useState, useMemo } from 'react';
import { getUpgradeByKey } from '@/lib/upgrades.js';
import styles from './BuildModsList.module.css';

// SVG Icon components for categories
const CategoryIcons = {
  intake: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  ),
  exhaust: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 1.85-1.56 3.36-3.5 3.36H6.5C4.56 15.36 3 13.85 3 12s1.56-3.36 3.5-3.36h11c1.94 0 3.5 1.51 3.5 3.36z"/>
      <path d="M3 12l-1 4h3l1-4M22 12l-1 4h-3l1-4"/>
    </svg>
  ),
  ecu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/>
      <line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="15" x2="4" y2="15"/>
      <line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="15" x2="22" y2="15"/>
    </svg>
  ),
  turbo: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
      <path d="M16 8a4 4 0 0 1 0 8"/>
      <path d="M8 8a4 4 0 0 0 0 8"/>
    </svg>
  ),
  supercharger: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  intercooler: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="10" x2="10" y2="14"/>
      <line x1="14" y1="10" x2="14" y2="14"/><line x1="18" y1="10" x2="18" y2="14"/>
    </svg>
  ),
  fuel: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/>
      <path d="M15 12h4a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2"/>
      <path d="M7 2v4"/><path d="M11 2v4"/>
      <rect x="3" y="12" width="12" height="4"/>
    </svg>
  ),
  engine: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  suspension: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19h16M4 15l4-8 4 4 4-4 4 8"/>
      <circle cx="4" cy="19" r="2"/><circle cx="20" cy="19" r="2"/>
    </svg>
  ),
  brakes: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  wheels: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
    </svg>
  ),
  tires: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
    </svg>
  ),
  aero: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12L7 2h10l5 10-5 10H7l-5-10z"/>
      <path d="M12 8v8M8 12h8"/>
    </svg>
  ),
  interior: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 18v-6a8 8 0 0 1 16 0v6"/>
      <path d="M4 18h16"/>
      <path d="M6 18v2M18 18v2"/>
    </svg>
  ),
  exterior: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L1 9l11 6 9-4.91V17M12 21V9"/>
    </svg>
  ),
  other: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  ),
};

// Category metadata with colors
const CATEGORY_INFO = {
  intake: { label: 'Intake', color: '#60a5fa' },
  exhaust: { label: 'Exhaust', color: '#f97316' },
  ecu: { label: 'ECU / Tune', color: '#a78bfa' },
  turbo: { label: 'Turbo', color: '#f43f5e' },
  supercharger: { label: 'Supercharger', color: '#fbbf24' },
  intercooler: { label: 'Intercooler', color: '#38bdf8' },
  fuel: { label: 'Fuel System', color: '#fb923c' },
  engine: { label: 'Engine', color: '#ef4444' },
  suspension: { label: 'Suspension', color: '#22c55e' },
  brakes: { label: 'Brakes', color: '#dc2626' },
  wheels: { label: 'Wheels', color: '#94a3b8' },
  tires: { label: 'Tires', color: '#475569' },
  aero: { label: 'Aero', color: '#06b6d4' },
  interior: { label: 'Interior', color: '#8b5cf6' },
  exterior: { label: 'Exterior', color: '#ec4899' },
  other: { label: 'Other', color: '#6b7280' },
};

// Normalize category key
function normalizeCategory(category) {
  if (!category) return 'other';
  const normalized = category.toLowerCase().trim();
  // Map common variations
  const categoryMap = {
    'tune': 'ecu',
    'tuning': 'ecu',
    'flash': 'ecu',
    'forced-induction': 'turbo',
    'forced_induction': 'turbo',
    'forcedinduction': 'turbo',
  };
  return categoryMap[normalized] || (CATEGORY_INFO[normalized] ? normalized : 'other');
}

export default function BuildModsList({ parts = [], buildData = null, isOwner = false, onEditPart }) {
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  
  // Combine parts from community_post_parts and build selected_upgrades
  const allMods = useMemo(() => {
    const mods = [];

    // Add community post specific parts (user-specified products)
    if (parts && parts.length > 0) {
      parts.forEach(part => {
        mods.push({
          id: part.id,
          category: normalizeCategory(part.category),
          modType: part.mod_type,
          brandName: part.brand_name,
          productName: part.product_name,
          partNumber: part.part_number,
          hpGain: part.hp_gain,
          tqGain: part.tq_gain,
          pricePaid: part.price_paid,
          currency: part.currency || 'USD',
          installType: part.install_type,
          notes: part.notes,
          isRecommended: part.is_recommended,
          productUrl: part.product_url,
          source: 'community_post',
          hasDetails: !!(part.brand_name || part.product_name),
        });
      });
    }

    // Add parts from linked build (project_parts)
    if (buildData?.project_parts && buildData.project_parts.length > 0) {
      buildData.project_parts.forEach(part => {
        mods.push({
          id: part.id,
          category: normalizeCategory(part.category),
          modType: part.part_name,
          brandName: part.brand_name,
          productName: null,
          partNumber: part.part_number,
          hpGain: null,
          tqGain: null,
          pricePaid: part.price_cents,
          currency: 'USD',
          installType: part.install_difficulty,
          notes: part.fitment_notes,
          isRecommended: null,
          productUrl: part.product_url,
          source: 'project_parts',
          hasDetails: !!part.brand_name,
        });
      });
    }

    // Add selected upgrades from linked build
    if (buildData?.selected_upgrades) {
      const rawUpgrades = Array.isArray(buildData.selected_upgrades) 
        ? buildData.selected_upgrades 
        : buildData.selected_upgrades?.upgrades || [];
      
      rawUpgrades.forEach((rawUpgrade, idx) => {
        let upgrade;
        if (typeof rawUpgrade === 'string') {
          upgrade = getUpgradeByKey(rawUpgrade);
          if (!upgrade) {
            upgrade = {
              key: rawUpgrade,
              name: rawUpgrade.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              category: 'other',
            };
          }
        } else {
          upgrade = rawUpgrade;
        }
        
        const upgradeName = upgrade.name || upgrade.key || 'Unknown Upgrade';
        const upgradeCategory = normalizeCategory(upgrade.category);
        
        // Check if this upgrade already has a specific part
        const hasSpecificPart = mods.some(
          mod => mod.category === upgradeCategory && mod.modType === upgradeName
        );
        
        if (!hasSpecificPart && upgradeName) {
          mods.push({
            id: `upgrade_${idx}`,
            upgradeKey: typeof rawUpgrade === 'string' ? rawUpgrade : upgrade.key,
            category: upgradeCategory,
            modType: upgradeName,
            brandName: null,
            productName: null,
            partNumber: null,
            hpGain: upgrade.hpGain || upgrade.hp_gain || upgrade.metricChanges?.hpGain || null,
            tqGain: upgrade.tqGain || upgrade.tq_gain || upgrade.metricChanges?.tqGain || null,
            pricePaid: null,
            currency: 'USD',
            installType: upgrade.difficulty || null,
            notes: upgrade.description || null,
            isRecommended: null,
            productUrl: null,
            source: 'selected_upgrades',
            hasDetails: false,
          });
        }
      });
    }

    return mods;
  }, [parts, buildData]);

  // Group by category
  const modsByCategory = useMemo(() => {
    return allMods.reduce((acc, mod) => {
      const cat = mod.category || 'other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(mod);
      return acc;
    }, {});
  }, [allMods]);

  // Sort categories by predefined order
  const sortedCategories = useMemo(() => {
    const categoryOrder = Object.keys(CATEGORY_INFO);
    return Object.keys(modsByCategory).sort((a, b) => {
      return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
    });
  }, [modsByCategory]);

  // Calculate totals
  const totalHpGain = useMemo(() => {
    return allMods.reduce((sum, mod) => sum + (mod.hpGain || 0), 0);
  }, [allMods]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  if (allMods.length === 0) {
    return null;
  }

  const formatPrice = (cents, currency = 'USD') => {
    if (!cents) return null;
    return (cents / 100).toLocaleString('en-US', { 
      style: 'currency', 
      currency,
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h2 className={styles.title}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            Build Modifications
          </h2>
          <p className={styles.subtitle}>
            {allMods.length} modification{allMods.length !== 1 ? 's' : ''}
            {totalHpGain > 0 && ` • +${totalHpGain} hp total`}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.quickStats}>
        <div className={styles.quickStat}>
          <span className={styles.quickStatValue}>{sortedCategories.length}</span>
          <span className={styles.quickStatLabel}>Categories</span>
        </div>
        <div className={styles.quickStat}>
          <span className={styles.quickStatValue}>{allMods.filter(m => m.hasDetails).length}</span>
          <span className={styles.quickStatLabel}>With Details</span>
        </div>
        <div className={styles.quickStat}>
          <span className={styles.quickStatValue}>{allMods.filter(m => m.productUrl).length}</span>
          <span className={styles.quickStatLabel}>Linked Products</span>
        </div>
      </div>

      {/* Category Cards */}
      <div className={styles.categoriesGrid}>
        {sortedCategories.map((category, catIdx) => {
          const info = CATEGORY_INFO[category] || CATEGORY_INFO.other;
          const categoryMods = modsByCategory[category];
          const isExpanded = expandedCategories.has(category);
          const categoryHpGain = categoryMods.reduce((sum, m) => sum + (m.hpGain || 0), 0);
          const hasAnyDetails = categoryMods.some(m => m.hasDetails);
          const IconComponent = CategoryIcons[category] || CategoryIcons.other;

          return (
            <div 
              key={category} 
              className={`${styles.categoryCard} ${isExpanded ? styles.expanded : ''}`}
              style={{ '--category-color': info.color }}
            >
              <button 
                className={styles.categoryHeader}
                onClick={() => toggleCategory(category)}
              >
                <div className={styles.categoryIconWrapper}>
                  <IconComponent />
                </div>
                <div className={styles.categoryInfo}>
                  <span className={styles.categoryLabel}>{info.label}</span>
                  <span className={styles.categoryMeta}>
                    {categoryMods.length} mod{categoryMods.length !== 1 ? 's' : ''}
                    {categoryHpGain > 0 && ` • +${categoryHpGain}hp`}
                  </span>
                </div>
                <div className={styles.categoryBadges}>
                  {hasAnyDetails && (
                    <span className={styles.detailsBadge} title="Has product details">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                        <line x1="7" y1="7" x2="7.01" y2="7"/>
                      </svg>
                    </span>
                  )}
                  <span className={styles.modCount}>{categoryMods.length}</span>
                </div>
                <svg 
                  className={`${styles.chevron} ${isExpanded ? styles.rotated : ''}`}
                  viewBox="0 0 24 24" 
                  width="20" 
                  height="20" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {isExpanded && (
                <div className={styles.modsListWrapper}>
                  <div className={styles.modsList}>
                    {categoryMods.map((mod, idx) => (
                      <div 
                        key={mod.id} 
                        className={`${styles.modItem} ${mod.hasDetails ? styles.hasDetails : styles.needsDetails}`}
                      >
                        <div className={styles.modMain}>
                          <div className={styles.modNameRow}>
                            <span className={styles.modType}>{mod.modType}</span>
                            {(mod.hpGain > 0 || mod.tqGain > 0) && (
                              <div className={styles.gains}>
                                {mod.hpGain > 0 && (
                                  <span className={styles.hpGain}>+{mod.hpGain}hp</span>
                                )}
                                {mod.tqGain > 0 && (
                                  <span className={styles.tqGain}>+{mod.tqGain}tq</span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {mod.hasDetails ? (
                            <div className={styles.productDetails}>
                              <span className={styles.brandProduct}>
                                {mod.brandName}
                                {mod.productName && ` ${mod.productName}`}
                              </span>
                              {mod.partNumber && (
                                <span className={styles.partNumber}>#{mod.partNumber}</span>
                              )}
                            </div>
                          ) : (
                            <div className={styles.noDetails}>
                              <span className={styles.noDetailsText}>
                                No specific product listed
                              </span>
                              {isOwner && onEditPart && (
                                <button 
                                  className={styles.addDetailsBtn}
                                  onClick={() => onEditPart(mod)}
                                >
                                  + Add Details
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className={styles.modFooter}>
                          {mod.pricePaid && (
                            <span className={styles.price}>
                              {formatPrice(mod.pricePaid, mod.currency)}
                            </span>
                          )}
                          {mod.installType && (
                            <span className={styles.installType}>
                              {mod.installType === 'diy' ? 'DIY' : 
                               mod.installType === 'shop' ? 'Shop Install' : 
                               mod.installType === 'dealer' ? 'Dealer' : mod.installType}
                            </span>
                          )}
                          {mod.isRecommended && (
                            <span className={styles.recommended} title="Owner recommends this product">
                              Recommended
                            </span>
                          )}
                          {mod.productUrl && (
                            <a 
                              href={mod.productUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={styles.productLink}
                            >
                              View Product →
                            </a>
                          )}
                        </div>

                        {mod.notes && (
                          <p className={styles.modNotes}>"{mod.notes}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Call to action for owners */}
      {isOwner && (
        <div className={styles.ownerCta}>
          <p>Add specific product details to help others replicate your build</p>
        </div>
      )}
    </div>
  );
}
