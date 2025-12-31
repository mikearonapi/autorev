'use client';

/**
 * Build Summary Bottom Bar Component
 * 
 * Sticky bottom bar showing:
 * - HP gain summary
 * - Total cost
 * - Save Build CTA
 * - Expand to see full build summary
 * 
 * Mobile-first: Fixed at bottom on mobile, inline on desktop.
 * 
 * @module components/tuning-shop/BuildSummaryBar
 */

import { useState, useCallback, useMemo } from 'react';
import styles from './BuildSummaryBar.module.css';

const ChevronIcon = ({ direction = 'up' }) => (
  <svg 
    width={16} 
    height={16} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ transform: direction === 'down' ? 'rotate(180deg)' : undefined }}
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const SaveIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const BoltIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const DollarIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const WrenchIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

/**
 * @typedef {Object} BuildItem
 * @property {string} key - Upgrade key
 * @property {string} name - Display name
 * @property {number} hpGain - HP gain
 * @property {number} cost - Cost
 * @property {string} category - Category
 */

/**
 * @typedef {Object} BuildSummaryBarProps
 * @property {BuildItem[]} selectedUpgrades - Selected upgrades
 * @property {number} totalHpGain - Total HP gain
 * @property {number} totalTqGain - Total torque gain
 * @property {number} totalCost - Total cost
 * @property {number} upgradeCount - Number of upgrades
 * @property {function} onSaveBuild - Callback to save build
 * @property {function} onClearBuild - Callback to clear all selections
 * @property {boolean} [canSave] - Whether save is enabled
 * @property {boolean} [isSaving] - Whether save is in progress
 * @property {boolean} [disabled] - Disable all actions
 * @property {boolean} [showExpanded] - Force expanded view
 */

/**
 * Build Summary Bottom Bar
 * @param {BuildSummaryBarProps} props
 */
export default function BuildSummaryBar({
  selectedUpgrades = [],
  totalHpGain = 0,
  totalTqGain = 0,
  totalCost = 0,
  upgradeCount = 0,
  onSaveBuild,
  onClearBuild,
  canSave = true,
  isSaving = false,
  disabled = false,
  showExpanded = false,
}) {
  const [isExpanded, setIsExpanded] = useState(showExpanded);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Group upgrades by category for expanded view
  const groupedUpgrades = useMemo(() => {
    const groups = {};
    selectedUpgrades.forEach(upgrade => {
      const category = upgrade.category || 'other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(upgrade);
    });
    return groups;
  }, [selectedUpgrades]);

  // Don't render if no upgrades selected
  if (upgradeCount === 0) {
    return null;
  }

  return (
    <div className={`${styles.container} ${isExpanded ? styles.containerExpanded : ''}`}>
      {/* Expanded Content (above the bar) */}
      {isExpanded && (
        <div className={styles.expandedContent}>
          <div className={styles.expandedHeader}>
            <h4 className={styles.expandedTitle}>Build Summary</h4>
            {onClearBuild && (
              <button 
                className={styles.clearBtn}
                onClick={onClearBuild}
                disabled={disabled}
              >
                Clear All
              </button>
            )}
          </div>
          
          <div className={styles.upgradesList}>
            {Object.entries(groupedUpgrades).map(([category, upgrades]) => (
              <div key={category} className={styles.categoryGroup}>
                <h5 className={styles.categoryName}>{formatCategoryName(category)}</h5>
                {upgrades.map(upgrade => (
                  <div key={upgrade.key} className={styles.upgradeItem}>
                    <span className={styles.upgradeName}>{upgrade.name}</span>
                    <div className={styles.upgradeStats}>
                      {upgrade.hpGain > 0 && (
                        <span className={styles.upgradeHp}>+{upgrade.hpGain} HP</span>
                      )}
                      {upgrade.cost > 0 && (
                        <span className={styles.upgradeCost}>${upgrade.cost.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className={styles.totalsRow}>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Total Power</span>
              <span className={styles.totalValue}>+{totalHpGain} HP</span>
            </div>
            {totalTqGain > 0 && (
              <div className={styles.totalItem}>
                <span className={styles.totalLabel}>Torque</span>
                <span className={styles.totalValue}>+{totalTqGain} ft-lb</span>
              </div>
            )}
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Total Cost</span>
              <span className={styles.totalValue}>${totalCost.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className={styles.bar}>
        {/* Expand Toggle */}
        <button 
          className={styles.expandBtn}
          onClick={toggleExpanded}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse build summary' : 'Expand build summary'}
        >
          <ChevronIcon direction={isExpanded ? 'down' : 'up'} />
        </button>

        {/* Stats Summary */}
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <BoltIcon />
            <span className={styles.statValue}>+{totalHpGain}</span>
            <span className={styles.statLabel}>HP</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <DollarIcon />
            <span className={styles.statValue}>${totalCost.toLocaleString()}</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statItem}>
            <WrenchIcon />
            <span className={styles.statValue}>{upgradeCount}</span>
            <span className={styles.statLabel}>mod{upgradeCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Save Button */}
        <button
          className={styles.saveBtn}
          onClick={onSaveBuild}
          disabled={disabled || !canSave || isSaving}
        >
          {isSaving ? (
            <span className={styles.spinner} />
          ) : (
            <SaveIcon />
          )}
          <span className={styles.saveBtnText}>
            {isSaving ? 'Saving...' : 'Save Build'}
          </span>
        </button>
      </div>
    </div>
  );
}

/**
 * Format category key to display name
 */
function formatCategoryName(category) {
  const names = {
    power: 'Power',
    turbo: 'Turbo/Supercharger',
    chassis: 'Chassis',
    suspension: 'Suspension',
    brakes: 'Brakes',
    drivetrain: 'Drivetrain',
    exterior: 'Exterior',
    interior: 'Interior',
    engine: 'Engine',
    intake: 'Intake',
    exhaust: 'Exhaust',
    cooling: 'Cooling',
    fuel: 'Fuel System',
    wheels_tires: 'Wheels & Tires',
    forced_induction: 'Forced Induction',
    other: 'Other',
  };
  return names[category] || category;
}

/**
 * Minimal version for inline use (not sticky)
 */
export function InlineBuildSummary({
  totalHpGain = 0,
  totalCost = 0,
  upgradeCount = 0,
}) {
  if (upgradeCount === 0) return null;

  return (
    <div className={styles.inlineSummary}>
      <div className={styles.inlineStat}>
        <BoltIcon />
        <span>+{totalHpGain} HP</span>
      </div>
      <div className={styles.inlineStat}>
        <DollarIcon />
        <span>${totalCost.toLocaleString()}</span>
      </div>
      <div className={styles.inlineStat}>
        <WrenchIcon />
        <span>{upgradeCount} mods</span>
      </div>
    </div>
  );
}




