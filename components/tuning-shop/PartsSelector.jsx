'use client';

/**
 * Parts Shopping List Component
 * 
 * SCOPE: Shopping/purchasing workflow (planned → purchased)
 * Installation tracking is handled by the Install page (/garage/my-install)
 * 
 * Shows the selected upgrades as a shopping list - items the user needs to buy.
 * Users can:
 * - See all upgrades they've selected as line items
 * - Track shopping status: planned → purchased
 * - Use "Find with AL" for one-click part recommendations
 * - Add/edit specific part details (brand, model, price, etc.)
 * - Get AL to review the entire build for compatibility and suggestions
 * - Link to Install page when parts are ready
 * 
 * STATUS TRACKING (on this page):
 * - Planned: Selected upgrade, no part chosen yet (gray)
 * - Purchased: Part acquired, ready for installation (teal)
 * - Installed: Shows as complete (read-only, lime) - managed by Install page
 * 
 * @module components/tuning-shop/PartsSelector
 */

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getUpgradeByKey } from '@/lib/upgrades';
import { useAIChat } from '@/components/AIChatContext';
import { UI_IMAGES } from '@/lib/images';
import { Icons } from '@/components/ui/Icons';
import styles from './PartsSelector.module.css';

// Status definitions
// NOTE: Parts page only handles planned ↔ purchased (bidirectional)
// The "installed" status is managed by the Install page
const PART_STATUS = {
  planned: { label: 'Planned', color: 'muted', next: 'purchased', canToggle: true },
  purchased: { label: 'Purchased', color: 'teal', next: 'planned', canToggle: true }, // Can toggle back to planned
  installed: { label: 'Installed', color: 'lime', next: null, canToggle: false }, // Read-only on Parts page
};

/**
 * AL Avatar component - consistent with rest of site
 */
function ALAvatar({ size = 24 }) {
  return (
    <Image 
      src={UI_IMAGES.alMascot}
      alt="AL"
      unoptimized
      width={size} 
      height={size}
      className={styles.alAvatar}
    />
  );
}

/**
 * Build a string summary of all upgrades in the build
 */
function buildContextSummary(upgrades) {
  if (!upgrades || upgrades.length === 0) return '';
  
  // Group by category
  const byCategory = upgrades.reduce((acc, u) => {
    const cat = u.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(u.name);
    return acc;
  }, {});
  
  return Object.entries(byCategory)
    .map(([cat, names]) => `${cat}: ${names.join(', ')}`)
    .join('\n');
}

/**
 * Status Badge Component
 * NOTE: On the Parts page, we only allow toggling between planned/purchased
 * The "installed" status is read-only here - managed by the Install page
 */
function StatusBadge({ status, onClick, disabled, upgradeName }) {
  const statusInfo = PART_STATUS[status] || PART_STATUS.planned;
  const canClick = statusInfo.canToggle && statusInfo.next && !disabled;
  
  // For installed parts, show as complete (non-interactive)
  if (status === 'installed') {
    return (
      <span
        className={`${styles.statusBadge} ${styles[`status${statusInfo.color}`]} ${styles.statusComplete}`}
        title="Part installed - tracked on Install page"
        aria-label={`${upgradeName}: ${statusInfo.label}`}
      >
        <Icons.check size={10} aria-hidden="true" />
        {statusInfo.label}
      </span>
    );
  }
  
  return (
    <button
      className={`${styles.statusBadge} ${styles[`status${statusInfo.color}`]}`}
      onClick={canClick ? onClick : undefined}
      disabled={!canClick}
      title={canClick 
        ? `Click to mark as ${PART_STATUS[statusInfo.next]?.label}` 
        : statusInfo.label
      }
      aria-label={canClick 
        ? `Mark ${upgradeName} as ${PART_STATUS[statusInfo.next]?.label}` 
        : `${upgradeName}: ${statusInfo.label}`
      }
      aria-pressed={status === 'purchased'}
    >
      {status === 'purchased' && <Icons.shoppingCart size={10} aria-hidden="true" />}
      {statusInfo.label}
    </button>
  );
}

/**
 * Single shopping list item for an upgrade
 */
function ShoppingListItem({ 
  upgrade, 
  partDetails, 
  onUpdatePart,
  onStatusChange,
  onFindWithAL,
  carSlug,
}) {
  const [isEditing, setIsEditing] = useState(false);
  
  const [editData, setEditData] = useState({
    brandName: partDetails?.brandName || '',
    partName: partDetails?.partName || '',
    partNumber: partDetails?.partNumber || '',
    price: partDetails?.price || partDetails?.priceCents ? (partDetails.priceCents / 100) : '',
    productUrl: partDetails?.productUrl || '',
    vendorName: partDetails?.vendorName || '',
    notes: partDetails?.notes || '',
  });

  const hasPartDetails = partDetails?.brandName || partDetails?.partName;
  const status = partDetails?.status || 'planned';
  const statusInfo = PART_STATUS[status] || PART_STATUS.planned;
  
  const handleSave = () => {
    onUpdatePart({
      ...editData,
      upgradeKey: upgrade.key,
      upgradeName: upgrade.name,
      category: upgrade.category,
      status: partDetails?.status || 'planned',
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      brandName: partDetails?.brandName || '',
      partName: partDetails?.partName || '',
      partNumber: partDetails?.partNumber || '',
      price: partDetails?.price || partDetails?.priceCents ? (partDetails.priceCents / 100) : '',
      productUrl: partDetails?.productUrl || '',
      vendorName: partDetails?.vendorName || '',
      notes: partDetails?.notes || '',
    });
    setIsEditing(false);
  };

  const handleStatusToggle = () => {
    // Only allow toggling if status supports it and has a next state
    if (!statusInfo.canToggle || !statusInfo.next) return;
    
    const nextStatus = statusInfo.next;
    const now = new Date().toISOString();
    
    const statusUpdate = {
      status: nextStatus,
      // Set or clear purchasedAt based on direction
      ...(nextStatus === 'purchased' 
        ? { purchasedAt: now } 
        : { purchasedAt: null }), // Clear when going back to planned
      // NOTE: installed status is handled by Install page, not here
    };
    
    onStatusChange?.(upgrade.key, statusUpdate);
  };

  const handleFindWithAL = () => {
    onFindWithAL?.(upgrade, carSlug);
  };

  return (
    <div 
      className={`${styles.listItem} ${hasPartDetails ? styles.hasDetails : ''} ${styles[`item${statusInfo.color}`]}`}
      role="listitem"
      aria-label={`${upgrade.name}: ${statusInfo.label}`}
    >
      <div className={styles.itemHeader}>
        {/* Top row: Name + Status (Swapped for better hierarchy) */}
        <div className={styles.itemTopRow}>
          <div className={styles.itemInfo}>
            <span className={styles.itemName}>{upgrade.name}</span>
            {hasPartDetails && (
              <span className={styles.itemBrand}>
                {partDetails.brandName} {partDetails.partName}
              </span>
            )}
          </div>
          
          <div className={styles.itemStatus}>
            <StatusBadge status={status} onClick={handleStatusToggle} upgradeName={upgrade.name} />
          </div>
        </div>
        
        {/* Bottom row: Sub-details + Actions */}
        <div className={styles.itemBottomRow}>
          {/* Left side: Add button + text */}
          <div className={styles.itemSubInfo}>
            {!isEditing && !hasPartDetails && (
              <button
                className={styles.addPartBtn}
                onClick={() => setIsEditing(true)}
                title="Add part manually"
                aria-label={`Add part details for ${upgrade.name}`}
              >
                <Icons.plus size={14} aria-hidden="true" />
              </button>
            )}
            {hasPartDetails ? (
              <div className={styles.partDetailsRow}>
                {(partDetails.price || partDetails.priceCents) && (
                  <span className={styles.itemPrice}>
                    ${Number(partDetails.price || partDetails.priceCents / 100).toLocaleString()}
                  </span>
                )}
                {partDetails.vendorName && (
                  <span className={styles.itemVendor}>{partDetails.vendorName}</span>
                )}
              </div>
            ) : (
              <span className={styles.noPartText}>No part selected</span>
            )}
          </div>
          
          {/* Right side: Actions */}
          <div className={styles.itemActions}>
            {!isEditing && !hasPartDetails && (
              <button
                className={styles.findPartBtn}
                onClick={handleFindWithAL}
                title="Find part with AL"
                aria-label={`Find ${upgrade.name} part with AL assistant`}
              >
                <ALAvatar size={18} />
                <span>Find Part</span>
              </button>
            )}
            {!isEditing && hasPartDetails && (
              <>
                {partDetails.productUrl && (
                  <a
                    href={partDetails.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.viewLinkBtn}
                    title="View product"
                    aria-label={`View ${partDetails.brandName || ''} ${partDetails.partName || upgrade.name} product page (opens in new tab)`}
                  >
                    <Icons.externalLink size={14} aria-hidden="true" />
                  </a>
                )}
                <button
                  className={styles.editPartInline}
                  onClick={() => setIsEditing(true)}
                  title="Edit part details"
                  aria-label={`Edit ${upgrade.name} part details`}
                >
                  <Icons.edit size={14} aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div className={styles.editForm}>
          <div className={styles.editRow}>
            <input
              type="text"
              placeholder="Brand (e.g., AWE, Borla)"
              value={editData.brandName}
              onChange={(e) => setEditData({ ...editData, brandName: e.target.value })}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Part Name"
              value={editData.partName}
              onChange={(e) => setEditData({ ...editData, partName: e.target.value })}
              className={styles.input}
            />
          </div>
          <div className={styles.editRow}>
            <input
              type="text"
              placeholder="Part # (optional)"
              value={editData.partNumber}
              onChange={(e) => setEditData({ ...editData, partNumber: e.target.value })}
              className={`${styles.input} ${styles.inputSmall}`}
            />
            <input
              type="number"
              placeholder="Price $"
              value={editData.price}
              onChange={(e) => setEditData({ ...editData, price: e.target.value })}
              className={`${styles.input} ${styles.inputSmall}`}
              min="0"
              step="0.01"
            />
            <input
              type="text"
              placeholder="Vendor Name"
              value={editData.vendorName}
              onChange={(e) => setEditData({ ...editData, vendorName: e.target.value })}
              className={`${styles.input} ${styles.inputSmall}`}
            />
          </div>
          <div className={styles.editRow}>
            <input
              type="url"
              placeholder="Product URL (optional)"
              value={editData.productUrl}
              onChange={(e) => setEditData({ ...editData, productUrl: e.target.value })}
              className={styles.input}
            />
          </div>
          <div className={styles.editActions}>
            <button className={styles.cancelBtn} onClick={handleCancel}>
              Cancel
            </button>
            <button className={styles.saveBtn} onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main Parts Shopping List Component
 * 
 * SCOPE: This component handles SHOPPING (planned → purchased)
 * Installation tracking is handled by the Install page (/garage/my-install)
 */
export default function PartsSelector({
  selectedUpgrades = [],
  selectedParts = [],
  onPartsChange,
  onStatusChange,
  carName,
  carSlug,
  buildId = null, // Optional build ID for linking to install page
  totalHpGain = 0,
  totalCostRange = null, // { low, high }
}) {
  const { openChatWithPrompt } = useAIChat();

  // Get full upgrade objects from keys
  const upgrades = useMemo(() => {
    return selectedUpgrades
      .map(key => {
        const upgrade = getUpgradeByKey(key);
        return upgrade || { key, name: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') };
      })
      .filter(Boolean);
  }, [selectedUpgrades]);

  // Map parts to upgrades
  const partsByUpgrade = useMemo(() => {
    const map = {};
    selectedParts.forEach(part => {
      if (part.upgradeKey) {
        map[part.upgradeKey] = part;
      }
    });
    return map;
  }, [selectedParts]);

  // Calculate totals
  const totalCost = useMemo(() => {
    return selectedParts.reduce((sum, p) => {
      const price = Number(p.price) || (p.priceCents ? p.priceCents / 100 : 0);
      return sum + price;
    }, 0);
  }, [selectedParts]);

  // Status counts for summary
  const statusCounts = useMemo(() => {
    const counts = { planned: 0, purchased: 0, installed: 0 };
    
    // Count parts by status
    selectedParts.forEach(p => {
      const status = p.status || 'planned';
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });
    
    // Upgrades without parts are "planned"
    const partsWithStatus = selectedParts.filter(p => p.status).map(p => p.upgradeKey);
    upgrades.forEach(u => {
      if (!partsWithStatus.includes(u.key)) {
        counts.planned++;
      }
    });
    
    return counts;
  }, [selectedParts, upgrades]);

  const handleUpdatePart = useCallback((partData) => {
    const existingIndex = selectedParts.findIndex(p => p.upgradeKey === partData.upgradeKey);
    
    let newParts;
    if (existingIndex >= 0) {
      newParts = [...selectedParts];
      newParts[existingIndex] = {
        ...newParts[existingIndex],
        ...partData,
        id: newParts[existingIndex].id || `part_${Date.now()}`,
      };
    } else {
      newParts = [
        ...selectedParts,
        {
          ...partData,
          id: `part_${Date.now()}`,
          status: 'planned',
        },
      ];
    }
    
    onPartsChange(newParts);
  }, [selectedParts, onPartsChange]);

  // Handle status change for a part
  const handleStatusChange = useCallback((upgradeKey, statusUpdate) => {
    const existingIndex = selectedParts.findIndex(p => p.upgradeKey === upgradeKey);
    
    let newParts;
    if (existingIndex >= 0) {
      newParts = [...selectedParts];
      newParts[existingIndex] = {
        ...newParts[existingIndex],
        ...statusUpdate,
      };
    } else {
      // Create a new part entry just for status tracking
      newParts = [
        ...selectedParts,
        {
          id: `part_${Date.now()}`,
          upgradeKey,
          ...statusUpdate,
        },
      ];
    }
    
    onPartsChange?.(newParts);
    onStatusChange?.(upgradeKey, statusUpdate);
  }, [selectedParts, onPartsChange, onStatusChange]);

  // Handle "Find with AL" for a specific upgrade
  const handleFindWithAL = useCallback((upgrade, slug) => {
    const prompt = `I need to find the best ${upgrade.name} for my ${carName}. 

Please use the find_best_parts tool to search for parts that fit my car and give me your top recommendations. I'm looking for:
- Parts with verified fitment for this specific car
- Good balance of quality and price
- Any important installation notes or things I should know

My car: ${carName} (${slug})
Upgrade type: ${upgrade.name} (category: ${upgrade.category})`;

    openChatWithPrompt(prompt, {
      category: `Parts for ${carName}`,
      carSlug: slug,
    }, `Find best ${upgrade.name} for ${carName}`);
  }, [carName, openChatWithPrompt]);

  // AL Build Review - comprehensive analysis of the entire build
  const handleALBuildReview = useCallback(() => {
    const buildSummary = buildContextSummary(upgrades);
    const specifiedParts = selectedParts
      .filter(p => p.brandName || p.partName)
      .map(p => `- ${p.upgradeName}: ${p.brandName || ''} ${p.partName || ''}`.trim())
      .join('\n');
    
    const costInfo = totalCostRange 
      ? `Estimated cost: $${totalCostRange.low?.toLocaleString()} - $${totalCostRange.high?.toLocaleString()}`
      : totalCost > 0 
        ? `Parts cost so far: $${totalCost.toLocaleString()}`
        : '';

    const reviewPrompt = `Please review my ${carName} build and provide expert feedback.

## My Build Configuration:
${buildSummary}

## HP Gain Target: +${totalHpGain} HP
${costInfo}

${specifiedParts ? `## Parts I've Selected:\n${specifiedParts}\n` : ''}

## Please analyze:

1. **Compatibility Check** - Are all these modifications compatible with each other? Any potential conflicts?

2. **Supporting Mods Needed** - What supporting modifications might I be missing? For example:
   - Do I need upgraded fuel system components?
   - Should I upgrade spark plugs or ignition?
   - Is my cooling system adequate?
   - Any drivetrain upgrades needed to handle the power?

3. **Fluids & Maintenance** - Should I change:
   - Oil type/weight after these mods?
   - Coolant type?
   - Transmission fluid?
   - Any break-in procedures?

4. **Installation Order** - What's the recommended order to install these parts?

5. **Potential Issues** - Any known issues or things to watch out for with this combination?

6. **Optimization Suggestions** - Any modifications I should add or swap to get better results?

Be specific to my ${carName} and this exact build configuration.`;

    openChatWithPrompt(reviewPrompt, {
      category: `Build Review for ${carName}`,
      carSlug,
    }, `Review my ${carName} build (${upgrades.length} mods, +${totalHpGain} HP)`);
  }, [upgrades, selectedParts, carName, carSlug, totalHpGain, totalCost, totalCostRange, openChatWithPrompt]);

  if (upgrades.length === 0) {
    return null;
  }

  return (
    <div className={styles.container} role="region" aria-label="Parts Shopping List">
      {/* AL Parts Recommendations CTA - Premium Card */}
      <button
        className={styles.alRecommendationsBtn}
        onClick={handleALBuildReview}
        aria-label="Get AL parts recommendations - compatibility checks, suggestions, and find best parts for your build"
      >
        <ALAvatar size={42} />
        <div className={styles.alRecommendationsText}>
          <span className={styles.alRecommendationsTitle}>AL Parts Recommendations</span>
          <span className={styles.alRecommendationsSubtitle}>
            Get compatibility checks, suggestions & find the best parts for your build
          </span>
        </div>
      </button>

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Icons.shoppingCart size={20} />
          <span className={styles.title}>Parts Shopping List</span>
        </div>
      </div>

      {/* Status Summary - Shopping focused (planned/purchased) */}
      <div className={styles.statusSummary}>
        <div className={`${styles.statusCount} ${styles.statusmuted}`}>
          <span className={styles.statusCountNumber}>{statusCounts.planned}</span>
          <span className={styles.statusCountLabel}>Planned</span>
        </div>
        <div className={`${styles.statusCount} ${styles.statusteal}`}>
          <span className={styles.statusCountNumber}>{statusCounts.purchased}</span>
          <span className={styles.statusCountLabel}>Purchased</span>
        </div>
        {statusCounts.installed > 0 && (
          <div className={`${styles.statusCount} ${styles.statuslime}`}>
            <span className={styles.statusCountNumber}>{statusCounts.installed}</span>
            <span className={styles.statusCountLabel}>Installed</span>
          </div>
        )}
      </div>

      <div className={styles.list}>
        {upgrades.map(upgrade => (
          <ShoppingListItem
            key={upgrade.key}
            upgrade={upgrade}
            partDetails={partsByUpgrade[upgrade.key]}
            onUpdatePart={handleUpdatePart}
            onStatusChange={handleStatusChange}
            onFindWithAL={handleFindWithAL}
            carSlug={carSlug}
          />
        ))}
      </div>

      {totalCost > 0 && (
        <div className={styles.totalRow}>
          <span>Estimated Total</span>
          <span className={styles.totalAmount}>${totalCost.toLocaleString()}</span>
        </div>
      )}

      {/* Ready to Install CTA - shows when there are purchased parts */}
      {statusCounts.purchased > 0 && (
        <Link 
          href={buildId ? `/garage/my-install?build=${buildId}` : `/garage/my-install?car=${carSlug}`}
          className={styles.readyToInstallCta}
        >
          <div className={styles.readyToInstallCtaContent}>
            <span className={styles.readyToInstallCtaTitle}>
              {statusCounts.purchased} {statusCounts.purchased === 1 ? 'Part' : 'Parts'} Ready to Install
            </span>
            <span className={styles.readyToInstallCtaSubtitle}>
              Track your installation progress, find DIY videos, or locate service centers
            </span>
          </div>
          <Icons.chevronRight size={20} className={styles.readyToInstallCtaIcon} />
        </Link>
      )}
    </div>
  );
}

// Export for backwards compatibility
export { PartsSelector as PartsListSummary };
