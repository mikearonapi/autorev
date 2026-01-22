'use client';

/**
 * Parts Shopping List Component
 * 
 * Shows the selected upgrades as a shopping list - items the user needs to buy.
 * Users can:
 * - See all upgrades they've selected as line items
 * - Ask AL for specific product recommendations (with full build context)
 * - Add/edit specific part details (brand, model, price, etc.)
 * - Get AL to review the entire build for compatibility and suggestions
 * - Copy the full shopping list
 * 
 * @module components/tuning-shop/PartsSelector
 */

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { getUpgradeByKey } from '@/lib/upgrades';
import { useAIChat } from '@/components/AIChatContext';
import { UI_IMAGES } from '@/lib/images';
import { Icons } from '@/components/ui/Icons';
import { platform } from '@/lib/platform';
import styles from './PartsSelector.module.css';

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
 * Single shopping list item for an upgrade
 */
function ShoppingListItem({ 
  upgrade, 
  partDetails, 
  onUpdatePart, 
}) {
  const [isEditing, setIsEditing] = useState(false);
  
  const [editData, setEditData] = useState({
    brandName: partDetails?.brandName || '',
    partName: partDetails?.partName || '',
    partNumber: partDetails?.partNumber || '',
    price: partDetails?.price || '',
    productUrl: partDetails?.productUrl || '',
    notes: partDetails?.notes || '',
  });

  const hasPartDetails = partDetails?.brandName || partDetails?.partName;
  
  const handleSave = () => {
    onUpdatePart({
      ...editData,
      upgradeKey: upgrade.key,
      upgradeName: upgrade.name,
      category: upgrade.category,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      brandName: partDetails?.brandName || '',
      partName: partDetails?.partName || '',
      partNumber: partDetails?.partNumber || '',
      price: partDetails?.price || '',
      productUrl: partDetails?.productUrl || '',
      notes: partDetails?.notes || '',
    });
    setIsEditing(false);
  };

  return (
    <div className={`${styles.listItem} ${hasPartDetails ? styles.hasDetails : ''}`}>
      <div className={styles.itemHeader}>
        <div className={styles.itemCheckbox}>
          {hasPartDetails ? (
            <span className={styles.checkboxChecked}>
              <Icons.check size={12} />
            </span>
          ) : (
            <span className={styles.checkboxEmpty} />
          )}
        </div>
        
        <div className={styles.itemInfo}>
          <span className={styles.itemName}>{upgrade.name}</span>
          {hasPartDetails && (
            <span className={styles.itemBrand}>
              {partDetails.brandName} {partDetails.partName}
              {partDetails.price && ` • $${Number(partDetails.price).toLocaleString()}`}
            </span>
          )}
        </div>
        
        {/* Add/Edit part button - positioned right */}
        {!isEditing && !hasPartDetails && (
          <button
            className={styles.addPartInline}
            onClick={() => setIsEditing(true)}
          >
            <Icons.plus size={10} />
            Add your part
          </button>
        )}
        {!isEditing && hasPartDetails && (
          <button
            className={styles.editPartInline}
            onClick={() => setIsEditing(true)}
          >
            <Icons.edit size={10} />
            Edit
          </button>
        )}
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
 */
export default function PartsSelector({
  selectedUpgrades = [],
  selectedParts = [],
  onPartsChange,
  carName,
  carSlug,
  totalHpGain = 0,
  totalCostRange = null, // { low, high }
}) {
  const [copySuccess, setCopySuccess] = useState(false);
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
    return selectedParts.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  }, [selectedParts]);

  const partsCount = useMemo(() => {
    return selectedParts.filter(p => p.brandName || p.partName).length;
  }, [selectedParts]);

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
        },
      ];
    }
    
    onPartsChange(newParts);
  }, [selectedParts, onPartsChange]);

  const handleCopyList = useCallback(async () => {
    const lines = upgrades.map(upgrade => {
      const part = partsByUpgrade[upgrade.key];
      let line = `☐ ${upgrade.name}`;
      if (part?.brandName || part?.partName) {
        line = `☑ ${upgrade.name}`;
        if (part.brandName) line += `\n   Brand: ${part.brandName}`;
        if (part.partName) line += `\n   Part: ${part.partName}`;
        if (part.partNumber) line += `\n   Part #: ${part.partNumber}`;
        if (part.price) line += `\n   Price: $${Number(part.price).toLocaleString()}`;
        if (part.productUrl) line += `\n   URL: ${part.productUrl}`;
      }
      return line;
    });

    const header = `🛒 ${carName} Build - Parts Shopping List\n${'='.repeat(40)}\n`;
    const footer = totalCost > 0 
      ? `\n${'='.repeat(40)}\nTotal: $${totalCost.toLocaleString()} (${partsCount}/${upgrades.length} specified)`
      : `\n${'='.repeat(40)}\n${partsCount}/${upgrades.length} parts specified`;

    const success = await platform.copyToClipboard(header + lines.join('\n\n') + footer);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [upgrades, partsByUpgrade, carName, totalCost, partsCount]);

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
    <div className={styles.container}>
      {/* AL Parts Recommendations CTA - LIME glow at top */}
      <button
        className={styles.alRecommendationsBtn}
        onClick={handleALBuildReview}
      >
        <ALAvatar size={24} />
        <div className={styles.alRecommendationsText}>
          <span className={styles.alRecommendationsTitle}>AL Parts Recommendations</span>
          <span className={styles.alRecommendationsSubtitle}>
            Get compatibility checks, suggestions & find the best parts for your build
          </span>
        </div>
      </button>

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Icons.shoppingCart size={16} />
          <span className={styles.title}>Parts Shopping List</span>
        </div>
        <button
          className={styles.copyBtn}
          onClick={handleCopyList}
          title="Copy shopping list"
        >
          {copySuccess ? <Icons.check size={14} /> : <Icons.copy size={14} />}
          {copySuccess ? 'Copied!' : 'Copy List'}
        </button>
      </div>

      <div className={styles.list}>
        {upgrades.map(upgrade => (
          <ShoppingListItem
            key={upgrade.key}
            upgrade={upgrade}
            partDetails={partsByUpgrade[upgrade.key]}
            onUpdatePart={handleUpdatePart}
          />
        ))}
      </div>

      {totalCost > 0 && (
        <div className={styles.totalRow}>
          <span>Estimated Total</span>
          <span className={styles.totalAmount}>${totalCost.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

// Export for backwards compatibility
export { PartsSelector as PartsListSummary };
