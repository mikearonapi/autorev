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
 * 
 * Uses shared category definitions from @/lib/upgradeCategories.js
 * to ensure consistency with UpgradeCenter and other components.
 */

import { useState, useMemo } from 'react';
import { getUpgradeByKey } from '@/lib/upgrades.js';
import {
  CATEGORY_BY_KEY,
  CATEGORY_ICONS,
  CATEGORY_ORDER,
  normalizeCategory,
} from '@/lib/upgradeCategories.js';
import styles from './BuildModsList.module.css';

export default function BuildModsList({ parts = [], buildData = null, isOwner = false, onEditPart }) {
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  
  // Combine parts from build's project_parts and selected_upgrades
  const allMods = useMemo(() => {
    const mods = [];

    // Add user-specified parts (from parts prop if provided)
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
          source: 'parts_list',
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

  // Sort categories by predefined order (uses shared CATEGORY_ORDER)
  const sortedCategories = useMemo(() => {
    return Object.keys(modsByCategory).sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a);
      const indexB = CATEGORY_ORDER.indexOf(b);
      // Unknown categories go to the end
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
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
          const catInfo = CATEGORY_BY_KEY[category] || CATEGORY_BY_KEY.other;
          const categoryMods = modsByCategory[category];
          const isExpanded = expandedCategories.has(category);
          const categoryHpGain = categoryMods.reduce((sum, m) => sum + (m.hpGain || 0), 0);
          const hasAnyDetails = categoryMods.some(m => m.hasDetails);
          const iconElement = CATEGORY_ICONS[catInfo?.icon] || CATEGORY_ICONS.grid;

          return (
            <div 
              key={category} 
              className={`${styles.categoryCard} ${isExpanded ? styles.expanded : ''}`}
              style={{ '--category-color': catInfo?.color || '#6b7280' }}
            >
              <button 
                className={styles.categoryHeader}
                onClick={() => toggleCategory(category)}
              >
                <div className={styles.categoryIconWrapper}>
                  {iconElement}
                </div>
                <div className={styles.categoryInfo}>
                  <span className={styles.categoryLabel}>{catInfo?.label || 'Other'}</span>
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
