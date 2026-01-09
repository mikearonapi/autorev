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
import styles from './PartsSelector.module.css';

// Icons
const Icons = {
  plus: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  copy: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  edit: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  shoppingCart: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
  clipboard: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
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
 * Single shopping list item for an upgrade
 */
function ShoppingListItem({ 
  upgrade, 
  partDetails, 
  onUpdatePart, 
  carName,
  carSlug,
  allUpgrades, // Full build context
}) {
  const [isEditing, setIsEditing] = useState(false);
  const { openChatWithPrompt } = useAIChat();
  
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

  // Open AL chat with two prompt options - includes FULL BUILD CONTEXT
  const handleALClick = () => {
    const partName = upgrade.name || 'part';
    const buildSummary = buildContextSummary(allUpgrades);
    const otherMods = allUpgrades
      .filter(u => u.key !== upgrade.key)
      .map(u => u.name)
      .join(', ');
    
    // Build the two prompt options WITH full build context
    const findPrompt = `I'm building a ${carName} and need help finding the best ${partName}.

## My Full Build (for context):
${buildSummary}

## What I need:
Please recommend specific ${partName} products that will work well with my other modifications (${otherMods || 'stock otherwise'}).

Include for each recommendation:
- Brand and model name
- Part number if available  
- Estimated price range
- Why it's compatible with my build
- Any installation notes

Focus on quality options that complement my other mods. Consider any synergies or compatibility requirements.`;

    const comparePrompt = `I'm building a ${carName} and want to compare the top ${partName} options.

## My Full Build (for context):
${buildSummary}

## What I need:
Compare the top 3-4 ${partName} options, keeping in mind I'm also running: ${otherMods || 'mostly stock'}.

For each option include:
- Brand and model
- Price range
- Pros and cons
- How well it works with my other mods
- Best for: daily driving vs track use vs best overall value

Help me understand which option is best for MY specific build configuration.`;

    // Open chat with multi-option mode
    openChatWithPrompt(null, {
      category: `${partName} for ${carName}`,
      carSlug,
      upgradeName: upgrade.name,
    }, null, {
      options: [
        {
          prompt: findPrompt,
          displayMessage: `Find the best ${partName} for my ${carName} build`,
        },
        {
          prompt: comparePrompt,
          displayMessage: `Compare ${partName} options for my build`,
        },
      ],
    });
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
          
          {/* Add/Edit part button - inline after text for clarity */}
          {!isEditing && !hasPartDetails && (
            <button
              className={styles.addPartInline}
              onClick={() => setIsEditing(true)}
            >
              <Icons.plus size={12} />
              Add your part
            </button>
          )}
          {!isEditing && hasPartDetails && (
            <button
              className={styles.editPartInline}
              onClick={() => setIsEditing(true)}
            >
              <Icons.edit size={12} />
              Edit
            </button>
          )}
        </div>
        
        <div className={styles.itemActions}>
          {!isEditing && (
            <button
              className={styles.askAlBtn}
              onClick={handleALClick}
              title="Get AL Recommendations"
            >
              <ALAvatar size={20} />
            </button>
          )}
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

  const handleCopyList = useCallback(() => {
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

    navigator.clipboard.writeText(header + lines.join('\n\n') + footer);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
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
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Icons.shoppingCart size={16} />
          <span className={styles.title}>Parts Shopping List</span>
          <span className={styles.count}>
            {partsCount}/{upgrades.length} specified
          </span>
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

      <p className={styles.subtitle}>
        Click <ALAvatar size={16} /> to get AL&apos;s recommendations for each part
      </p>

      <div className={styles.list}>
        {upgrades.map(upgrade => (
          <ShoppingListItem
            key={upgrade.key}
            upgrade={upgrade}
            partDetails={partsByUpgrade[upgrade.key]}
            onUpdatePart={handleUpdatePart}
            carName={carName}
            carSlug={carSlug}
            allUpgrades={upgrades} // Pass full build context
          />
        ))}
      </div>

      {totalCost > 0 && (
        <div className={styles.totalRow}>
          <span>Estimated Total</span>
          <span className={styles.totalAmount}>${totalCost.toLocaleString()}</span>
        </div>
      )}

      {/* AL Build Review Button */}
      <button
        className={styles.buildReviewBtn}
        onClick={handleALBuildReview}
      >
        <ALAvatar size={22} />
        <div className={styles.buildReviewText}>
          <span className={styles.buildReviewTitle}>AL Build Review</span>
          <span className={styles.buildReviewSubtitle}>
            Check compatibility, get suggestions & identify missing parts
          </span>
        </div>
      </button>
    </div>
  );
}

// Export for backwards compatibility
export { PartsSelector as PartsListSummary };
