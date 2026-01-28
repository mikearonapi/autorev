'use client';

/**
 * Parts Shopping List Component
 *
 * Shows the selected upgrades as a shopping list - items the user needs to buy.
 * Users can:
 * - See all upgrades they've selected as line items
 * - Use "Find with AL" for one-click part recommendations
 * - Add/edit specific part details (brand, model, price, etc.)
 * - Get AL to review the entire build for compatibility and suggestions
 * - Link to Install page for installation help
 *
 * @module components/tuning-shop/PartsSelector
 */

import { useState, useMemo, useCallback } from 'react';

import Image from 'next/image';

import { useAIChat } from '@/components/AIChatContext';
import { Icons } from '@/components/ui/Icons';
import {
  usePartRecommendations,
  getRecommendationsForUpgrade,
} from '@/hooks/usePartRecommendations';
import { UI_IMAGES } from '@/lib/images';
import { getUpgradeByKey } from '@/lib/upgrades';

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
  onSeeOptions,
  onSelectRecommendation,
  carSlug,
  recommendations = [],
}) {
  const [isEditing, setIsEditing] = useState(false);

  const [editData, setEditData] = useState({
    brandName: partDetails?.brandName || '',
    partName: partDetails?.partName || '',
    partNumber: partDetails?.partNumber || '',
    price: partDetails?.price || partDetails?.priceCents ? partDetails.priceCents / 100 : '',
    productUrl: partDetails?.productUrl || '',
    vendorName: partDetails?.vendorName || '',
    notes: partDetails?.notes || '',
  });

  const hasPartDetails = partDetails?.brandName || partDetails?.partName;
  // Show all recommendations, use manufacturerUrl as fallback if no productUrl
  const recommendationsToShow = recommendations
    .map((rec) => ({
      ...rec,
      // Use productUrl if available, otherwise fall back to manufacturerUrl
      displayUrl: rec.productUrl || rec.manufacturerUrl,
      urlType: rec.productUrl ? 'buy' : rec.manufacturerUrl ? 'manufacturer' : null,
    }))
    .filter((rec) => rec.displayUrl); // Only show if we have SOME url
  const hasRecommendations = recommendationsToShow.length > 0;

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
      price: partDetails?.price || partDetails?.priceCents ? partDetails.priceCents / 100 : '',
      productUrl: partDetails?.productUrl || '',
      vendorName: partDetails?.vendorName || '',
      notes: partDetails?.notes || '',
    });
    setIsEditing(false);
  };

  const handleSeeOptions = () => {
    onSeeOptions?.(upgrade, carSlug);
  };

  return (
    <div className={styles.listItem} role="listitem" aria-label={upgrade.name}>
      <div className={styles.itemHeader}>
        {/* Top row: Name and AL's top picks button */}
        <div className={styles.itemTopRow}>
          <div className={styles.itemInfo}>
            <span className={styles.itemName}>{upgrade.name}</span>
          </div>

          {/* AL's top picks - always show for live research */}
          {!isEditing && (
            <button
              className={styles.seeOptionsInline}
              onClick={handleSeeOptions}
              aria-label={`See ${upgrade.name} options with AL recommendations`}
            >
              <span>AL's top picks</span>
              <ALAvatar size={18} />
            </button>
          )}
        </div>

        {/* Inline recommendations - always show when available, highlight selected */}
        {hasRecommendations && !isEditing && (
          <div className={styles.recommendationsList}>
            {recommendationsToShow.slice(0, 5).map((rec) => {
              // Use manufacturerName if available, fall back to brandName
              const displayBrand = rec.manufacturerName || rec.brandName;
              const vendorInfo = rec.vendorName ? `from ${rec.vendorName}` : '';
              const buttonText = rec.urlType === 'buy' ? 'BUY' : 'VIEW';
              const buttonTitle =
                rec.urlType === 'buy'
                  ? vendorInfo || 'Buy from retailer'
                  : 'View on manufacturer site';
              // Check if this recommendation is currently selected
              const isSelected = partDetails?.partId === rec.partId;

              return (
                <label
                  key={rec.partId}
                  className={`${styles.recommendationItem} ${isSelected ? styles.recommendationItemSelected : ''}`}
                >
                  <input
                    type="radio"
                    name={`rec-${upgrade.key}`}
                    className={styles.recommendationRadio}
                    checked={isSelected}
                    onChange={() => onSelectRecommendation?.(rec, upgrade)}
                    aria-label={`Select ${displayBrand} ${rec.name}`}
                  />
                  <span className={styles.recBrand} title={vendorInfo || 'Manufacturer'}>
                    {displayBrand}
                  </span>
                  <span className={styles.recName}>{rec.name}</span>
                  <a
                    href={rec.displayUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.recBuyBtn}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${buttonText} ${displayBrand} ${rec.name}`}
                    title={buttonTitle}
                  >
                    {buttonText}
                  </a>
                </label>
              );
            })}
          </div>
        )}

        {/* Bottom row: Manual add option */}
        <div className={styles.itemBottomRow}>
          {/* Left side: Add manually link (always available as fallback) */}
          <div className={styles.itemSubInfo}>
            {!isEditing && (
              <button
                className={styles.addManuallyBtn}
                onClick={() => setIsEditing(true)}
                aria-label={`Add part details for ${upgrade.name} manually`}
              >
                or add manually
              </button>
            )}
          </div>

          {/* Right side: Edit button when part is selected */}
          <div className={styles.itemActions}>
            {!isEditing && hasPartDetails && (
              <button
                className={styles.editPartInline}
                onClick={() => setIsEditing(true)}
                title="Edit part details"
                aria-label={`Edit ${upgrade.name} part details`}
              >
                <Icons.edit size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <div
          className={styles.editForm}
          role="form"
          aria-label={`Edit part details for ${upgrade.name}`}
        >
          <div className={styles.editRow}>
            <input
              type="text"
              placeholder="Brand (e.g., AWE, Borla)"
              value={editData.brandName}
              onChange={(e) => setEditData({ ...editData, brandName: e.target.value })}
              className={styles.input}
              aria-label="Brand name"
              autoComplete="off"
            />
            <input
              type="text"
              placeholder="Part Name"
              value={editData.partName}
              onChange={(e) => setEditData({ ...editData, partName: e.target.value })}
              className={styles.input}
              aria-label="Part name"
              autoComplete="off"
            />
          </div>
          <div className={styles.editRow}>
            <input
              type="text"
              placeholder="Part #"
              value={editData.partNumber}
              onChange={(e) => setEditData({ ...editData, partNumber: e.target.value })}
              className={`${styles.input} ${styles.inputSmall}`}
              aria-label="Part number (optional)"
              autoComplete="off"
            />
            <input
              type="number"
              placeholder="Price"
              value={editData.price}
              onChange={(e) => setEditData({ ...editData, price: e.target.value })}
              className={`${styles.input} ${styles.inputSmall}`}
              aria-label="Price in dollars"
              min="0"
              step="0.01"
              inputMode="decimal"
            />
            <input
              type="text"
              placeholder="Vendor"
              value={editData.vendorName}
              onChange={(e) => setEditData({ ...editData, vendorName: e.target.value })}
              className={`${styles.input} ${styles.inputSmall}`}
              aria-label="Vendor name"
              autoComplete="off"
            />
          </div>
          <div className={styles.editRow}>
            <input
              type="url"
              placeholder="Product URL (optional)"
              value={editData.productUrl}
              onChange={(e) => setEditData({ ...editData, productUrl: e.target.value })}
              className={styles.input}
              aria-label="Product URL (optional)"
              autoComplete="off"
            />
          </div>
          <div className={styles.editActions}>
            <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
              Cancel
            </button>
            <button type="button" className={styles.saveBtn} onClick={handleSave}>
              Save Part
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
 * Shows upgrades from the build as a shopping list for selecting specific parts.
 */
export default function PartsSelector({
  selectedUpgrades = [],
  selectedParts = [],
  onPartsChange,
  carName,
  carSlug,
  carBrand = null, // Brand name for constructing full display name
  buildId: _buildId = null, // Optional build ID for linking to install page
  totalHpGain = 0,
  totalCostRange = null, // { low, high }
  hideALRecommendations = false, // Hide AL button when rendered at page level
}) {
  const { openChatWithPrompt } = useAIChat();

  // Construct full display name with brand if available (e.g., "Ford Mustang SVT Cobra")
  // This ensures the AI knows the exact make/model for parts research
  const fullCarName =
    carBrand && carName && !carName.toLowerCase().startsWith(carBrand.toLowerCase())
      ? `${carBrand} ${carName}`
      : carName;

  // Fetch AL recommendations for all upgrade types (up to 5 per category)
  const { data: recommendations = {} } = usePartRecommendations(carSlug, {
    upgradeKeys: selectedUpgrades,
    limit: 5,
    enabled: !!carSlug && selectedUpgrades.length > 0,
  });

  // Get full upgrade objects from keys
  const upgrades = useMemo(() => {
    return selectedUpgrades
      .map((key) => {
        const upgrade = getUpgradeByKey(key);
        return (
          upgrade || {
            key,
            name: key
              .split('-')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' '),
          }
        );
      })
      .filter(Boolean);
  }, [selectedUpgrades]);

  // Map parts to upgrades
  const partsByUpgrade = useMemo(() => {
    const map = {};
    selectedParts.forEach((part) => {
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

  const handleUpdatePart = useCallback(
    (partData) => {
      const existingIndex = selectedParts.findIndex((p) => p.upgradeKey === partData.upgradeKey);

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
    },
    [selectedParts, onPartsChange]
  );

  /**
   * Handle selecting a recommendation - converts to part data
   * This allows one-click selection from AL recommendations
   */
  const handleSelectRecommendation = useCallback(
    (rec, upgrade) => {
      // Use manufacturerName if available (new schema), fall back to brandName (legacy)
      const manufacturerName = rec.manufacturerName || rec.brandName;

      const partData = {
        upgradeKey: upgrade.key,
        upgradeName: upgrade.name,
        category: upgrade.category,
        // Part details from recommendation
        partId: rec.partId,
        brandName: manufacturerName, // Display name (manufacturer)
        manufacturerName: manufacturerName, // Explicit manufacturer field
        manufacturerUrl: rec.manufacturerUrl || null, // Manufacturer website
        partName: rec.name,
        partNumber: rec.partNumber || '',
        price: rec.price || '',
        priceCents: rec.priceCents || null,
        productUrl: rec.productUrl || '',
        vendorName: rec.vendorName || '', // Retailer name (who sells it)
        // Track that this came from AL recommendation
        source: 'al_recommendation',
      };

      handleUpdatePart(partData);
    },
    [handleUpdatePart]
  );

  /**
   * Handle "See Options" - uses research_parts_live for real vendor search
   * This triggers a live search across Summit Racing, Amazon, manufacturer sites, etc.
   * and returns structured results with actual purchase links.
   */
  const handleSeeOptions = useCallback(
    (upgrade, slug) => {
      // Use upgrade.key for consistent database storage/retrieval
      const upgradeKey = upgrade.key || upgrade.name.toLowerCase().replace(/\s+/g, '-');

      const prompt = `Find me the best ${upgrade.name.toLowerCase()} options for my ${fullCarName}.

USE THE research_parts_live TOOL with these parameters:
- car_slug: "${slug}"
- upgrade_type: "${upgradeKey}"

Then format the results as a Top 5 list like this:

## Top 5 ${upgrade.name} Picks for ${fullCarName}

For each pick, include:

**1) [Brand] [Product Name]**

**Why it's recommended:** [1-2 sentences based on what you found]

**What differentiates it:** [What makes this unique vs others]

**Price:** $XXX (from the search results)

**Buy from:** [Vendor Name](actual_url_from_results) - include multiple vendors if available

---

[Continue for picks 2-5]

---

### Quick Buying Guide
- **Best overall:** [Pick name] - [one line why]
- **Best value:** [Pick name] - [one line why]
- **Best for performance:** [Pick name] - [one line why]

IMPORTANT:
1. Use the ACTUAL URLs from research_parts_live results for "Buy from" links
2. Use the ACTUAL prices from the search results
3. Focus on parts from reputable vendors (Summit Racing, manufacturer direct, etc.)
4. Include a mix of price points if available
5. Mention if fitment should be verified on the vendor's website

REQUIRED: After your user-facing response, include a <parts_to_save> JSON block at the very end (this gets saved to the database and is stripped before display):
<parts_to_save>
{
  "car_slug": "${slug}",
  "upgrade_key": "${upgradeKey}",
  "parts": [
    {
      "brand_name": "...",
      "product_name": "...",
      "price": 1299,
      "source_url": "https://...",
      "rank": 1,
      "why_recommended": "...",
      "best_for": "Stage 1-2 builds",
      "fitment_confidence": "confirmed"
    }
  ]
}
</parts_to_save>`;

      openChatWithPrompt(
        prompt,
        {
          category: `${upgrade.name} for ${fullCarName}`,
          carSlug: slug,
        },
        `Top 5 ${upgrade.name} for ${fullCarName}`,
        { autoSend: true }
      );
    },
    [fullCarName, openChatWithPrompt]
  );

  // AL Build Review - comprehensive analysis of the entire build
  const handleALBuildReview = useCallback(() => {
    const buildSummary = buildContextSummary(upgrades);
    const specifiedParts = selectedParts
      .filter((p) => p.brandName || p.partName)
      .map((p) => `- ${p.upgradeName}: ${p.brandName || ''} ${p.partName || ''}`.trim())
      .join('\n');

    const costInfo = totalCostRange
      ? `Estimated cost: $${totalCostRange.low?.toLocaleString()} - $${totalCostRange.high?.toLocaleString()}`
      : totalCost > 0
        ? `Parts cost so far: $${totalCost.toLocaleString()}`
        : '';

    const reviewPrompt = `Please review my ${fullCarName} build and provide expert feedback.

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

Be specific to my ${fullCarName} and this exact build configuration.`;

    openChatWithPrompt(
      reviewPrompt,
      {
        category: `Build Review for ${fullCarName}`,
        carSlug,
      },
      `Review my ${fullCarName} build (${upgrades.length} mods, +${totalHpGain} HP)`
    );
  }, [
    upgrades,
    selectedParts,
    fullCarName,
    carSlug,
    totalHpGain,
    totalCost,
    totalCostRange,
    openChatWithPrompt,
  ]);

  if (upgrades.length === 0) {
    return null;
  }

  return (
    <div className={styles.container} role="region" aria-label="Parts Shopping List">
      {/* AL Parts Recommendations CTA - Only show if not rendered at page level */}
      {!hideALRecommendations && (
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
      )}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Icons.shoppingCart size={20} />
          <span className={styles.title}>Parts Shopping List</span>
        </div>
        {/* Estimated Cost - inline with header */}
        {totalCostRange && (totalCostRange.low > 0 || totalCostRange.high > 0) && (
          <div className={styles.headerCost}>
            <span className={styles.headerCostValue}>
              ${totalCostRange.low.toLocaleString()} - ${totalCostRange.high.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      <div className={styles.list}>
        {upgrades.map((upgrade) => (
          <ShoppingListItem
            key={upgrade.key}
            upgrade={upgrade}
            partDetails={partsByUpgrade[upgrade.key]}
            onUpdatePart={handleUpdatePart}
            onSeeOptions={handleSeeOptions}
            onSelectRecommendation={handleSelectRecommendation}
            carSlug={carSlug}
            recommendations={getRecommendationsForUpgrade(recommendations, upgrade.key)}
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
