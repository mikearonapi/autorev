'use client';

/**
 * Upgrade Aggregator Component
 * 
 * A sticky summary panel that shows the current build's total stats:
 * - Stock HP → Projected HP (+gain) format
 * - Total cost
 * - $/HP efficiency
 * - Number of upgrades
 * - Conflict warnings for overlapping mods
 * - Quick actions (Save Build, Clear All)
 * 
 * Uses smart HP calculation with:
 * - Diminishing returns for same-category mods
 * - Stage tune overlap detection
 * - Category-based gain caps
 * 
 * Designed to work with the Performance Hub and global car selection state.
 * 
 * @module components/UpgradeAggregator
 */

import { useMemo } from 'react';
import Link from 'next/link';
import styles from './UpgradeAggregator.module.css';
import { useCarSelection, useBuildSummary } from '@/components/providers/CarSelectionProvider';
import { calculateSmartHpGain, formatHpDisplay, getConflictSummary } from '@/lib/upgradeCalculator.js';

// Icons
const Icons = {
  zap: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  dollar: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  trendingUp: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  wrench: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  save: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  trash: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  check: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  arrowRight: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  alertTriangle: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  info: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

/**
 * Format currency for display
 * @param {number} amount 
 * @returns {string}
 */
function formatCurrency(amount) {
  if (!amount || amount === 0) return '$0';
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

/**
 * Format HP for display
 * @param {number} hp 
 * @returns {string}
 */
function formatHP(hp) {
  if (!hp || hp === 0) return '0';
  return `+${hp.toLocaleString()}`;
}

/**
 * Upgrade Aggregator Component
 * 
 * @param {Object} props
 * @param {Object} props.car - The car being built
 * @param {Object[]} props.selectedUpgrades - Array of selected upgrade objects
 * @param {Object} props.totalCost - Cost object from calculateTotalCost
 * @param {Function} [props.onClearAll] - Callback when clear all is clicked
 * @param {Function} [props.onSaveBuild] - Callback when save build is clicked
 * @param {'compact'|'expanded'} [props.variant='compact'] - Display variant
 * @param {string} [props.className] - Additional CSS class
 */
export default function UpgradeAggregator({
  car,
  selectedUpgrades = [],
  totalCost = { low: 0, high: 0 },
  onClearAll,
  onSaveBuild,
  variant = 'compact',
  className = '',
}) {
  // Calculate totals from upgrades using smart HP calculation
  const buildStats = useMemo(() => {
    // Get upgrade keys for smart calculation
    const upgradeKeys = selectedUpgrades.map(u => u.key).filter(Boolean);
    
    // Use smart HP calculation with diminishing returns and overlap handling
    const hpResult = calculateSmartHpGain(car, upgradeKeys);
    
    // Still calculate torque the simple way (no complex overlap for torque)
    let totalTorqueGain = 0;
    selectedUpgrades.forEach(upgrade => {
      if (upgrade.metricChanges?.torqueGain) {
        totalTorqueGain += upgrade.metricChanges.torqueGain;
      }
    });

    const avgCost = (totalCost.low + totalCost.high) / 2;
    const costPerHp = hpResult.totalGain > 0 ? Math.round(avgCost / hpResult.totalGain) : 0;
    
    // Get conflict summary for UI
    const conflictSummary = getConflictSummary(hpResult.conflicts);
    
    // Format HP display strings
    const hpDisplay = formatHpDisplay(hpResult);

    return {
      // Smart HP values
      totalHpGain: hpResult.totalGain,
      rawHpGain: hpResult.rawGain, // Unadjusted for comparison
      adjustmentAmount: hpResult.adjustmentAmount,
      stockHp: hpResult.stockHp,
      finalHp: hpResult.projectedHp,
      hpDisplay, // Formatted strings for UI
      
      // Torque (simple sum)
      totalTorqueGain,
      finalTorque: (car?.torque || 0) + totalTorqueGain,
      
      // Costs
      avgCost,
      costPerHp,
      
      // Counts
      upgradeCount: selectedUpgrades.length,
      
      // Conflicts
      conflicts: hpResult.conflicts,
      conflictSummary,
      hasConflicts: conflictSummary.hasConflicts,
      
      // Per-upgrade breakdown
      breakdown: hpResult.breakdown,
    };
  }, [selectedUpgrades, totalCost, car]);

  // Don't render if no upgrades
  if (selectedUpgrades.length === 0) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div className={`${styles.aggregatorCompact} ${className}`}>
        <div className={styles.compactStats}>
          {/* Stock → Projected HP format */}
          <div className={styles.compactStat}>
            <Icons.zap size={16} />
            <span className={styles.compactValue}>
              {buildStats.stockHp} → {buildStats.finalHp}
            </span>
            <span className={styles.compactLabel}>HP</span>
            <span className={styles.compactGain}>(+{buildStats.totalHpGain})</span>
          </div>
          <div className={styles.compactDivider} />
          <div className={styles.compactStat}>
            <Icons.dollar size={16} />
            <span className={styles.compactValue}>{formatCurrency(totalCost.low)}-{formatCurrency(totalCost.high)}</span>
          </div>
          <div className={styles.compactDivider} />
          {buildStats.costPerHp > 0 && !isNaN(buildStats.costPerHp) && (
            <div className={styles.compactStat}>
              <Icons.trendingUp size={16} />
              <span className={styles.compactValue}>${buildStats.costPerHp}</span>
              <span className={styles.compactLabel}>/HP</span>
            </div>
          )}
        </div>
        {/* Conflict warning badge */}
        {buildStats.hasConflicts && buildStats.conflictSummary.warningCount > 0 && (
          <div className={styles.compactConflictBadge} title={buildStats.conflicts[0]?.message}>
            <Icons.alertTriangle size={14} />
            <span>{buildStats.conflictSummary.warningCount} overlap{buildStats.conflictSummary.warningCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.aggregator} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Icons.wrench size={18} />
          <span>Build Summary</span>
        </div>
        <span className={styles.upgradeCount}>{buildStats.upgradeCount} upgrades</span>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {/* Power - Stock → Projected format */}
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ '--stat-color': '#e74c3c' }}>
            <Icons.zap size={20} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Projected Power</span>
            <span className={styles.statValue}>
              <span className={styles.stockValue}>{buildStats.stockHp}</span>
              <span className={styles.arrowSeparator}>→</span>
              <span className={styles.projectedValue}>{buildStats.finalHp} hp</span>
            </span>
            <span className={styles.statSubtext}>
              +{buildStats.totalHpGain} hp gain
              {buildStats.adjustmentAmount > 5 && (
                <span className={styles.adjustmentNote}>
                  ({buildStats.adjustmentAmount} hp adjusted for overlap)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Cost */}
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ '--stat-color': '#3498db' }}>
            <Icons.dollar size={20} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Est. Investment</span>
            <span className={styles.statValue}>
              {formatCurrency(totalCost.low)} - {formatCurrency(totalCost.high)}
            </span>
            <span className={styles.statSubtext}>Parts + labor</span>
          </div>
        </div>

        {/* Efficiency */}
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ '--stat-color': '#2ecc71' }}>
            <Icons.trendingUp size={20} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statLabel}>Cost Efficiency</span>
            <span className={styles.statValue}>${buildStats.costPerHp}/hp</span>
            <span className={styles.statSubtext}>
              {buildStats.costPerHp < 50 ? 'Excellent value' : 
               buildStats.costPerHp < 100 ? 'Good value' : 
               buildStats.costPerHp < 150 ? 'Average' : 'Premium'}
            </span>
          </div>
        </div>
      </div>

      {/* Conflict Warnings */}
      {buildStats.hasConflicts && (
        <div className={styles.conflictWarnings}>
          {buildStats.conflicts.map((conflict, idx) => (
            <div 
              key={idx} 
              className={`${styles.conflictItem} ${styles[conflict.severity]}`}
            >
              {conflict.severity === 'warning' ? (
                <Icons.alertTriangle size={14} />
              ) : (
                <Icons.info size={14} />
              )}
              <span className={styles.conflictMessage}>{conflict.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Torque (if applicable) */}
      {buildStats.totalTorqueGain > 0 && (
        <div className={styles.torqueNote}>
          <span>+ {buildStats.totalTorqueGain} lb-ft torque</span>
          <span className={styles.torqueArrow}>({car?.torque || 0} → {buildStats.finalTorque})</span>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        {onSaveBuild && (
          <button 
            onClick={onSaveBuild} 
            className={styles.saveBtn}
            disabled
            title="Coming Soon - Sign up to save builds"
          >
            <Icons.save size={16} />
            Save Build
          </button>
        )}
        {onClearAll && (
          <button onClick={onClearAll} className={styles.clearBtn}>
            <Icons.trash size={16} />
            Clear All
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Mini inline version for use in headers/banners
 */
export function UpgradeAggregatorInline({ totalHpGain, totalCost, costPerHp }) {
  if (!totalHpGain && !totalCost) return null;

  return (
    <div className={styles.inlineAggregator}>
      {totalHpGain > 0 && (
        <span className={styles.inlineStat}>
          <Icons.zap size={14} />
          +{totalHpGain} hp
        </span>
      )}
      {totalCost > 0 && (
        <span className={styles.inlineStat}>
          <Icons.dollar size={14} />
          {formatCurrency(totalCost)}
        </span>
      )}
      {costPerHp > 0 && (
        <span className={styles.inlineStat}>
          ${costPerHp}/hp
        </span>
      )}
    </div>
  );
}

/**
 * Global Build Summary - Uses global car selection state
 * This version doesn't need props - it reads from context
 */
export function GlobalBuildSummary({ className = '' }) {
  const { selectedCar, appliedUpgrades, buildSummary, clearUpgrades, isHydrated } = useCarSelection();

  if (!isHydrated || !selectedCar || appliedUpgrades.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.globalSummary} ${className}`}>
      <div className={styles.globalHeader}>
        <span className={styles.globalTitle}>
          <Icons.wrench size={16} />
          Current Build: {selectedCar.name}
        </span>
        <span className={styles.globalCount}>{appliedUpgrades.length} upgrades</span>
      </div>
      
      <div className={styles.globalStats}>
        <div className={styles.globalStat}>
          <span className={styles.globalStatValue}>{selectedCar.hp} → {buildSummary.finalHp}</span>
          <span className={styles.globalStatLabel}>HP</span>
        </div>
        <div className={styles.globalStat}>
          <span className={styles.globalStatValue}>{formatCurrency(buildSummary.totalCost)}</span>
          <span className={styles.globalStatLabel}>Cost</span>
        </div>
        {buildSummary.costPerHp > 0 && !isNaN(buildSummary.costPerHp) && (
          <div className={styles.globalStat}>
            <span className={styles.globalStatValue}>${buildSummary.costPerHp}</span>
            <span className={styles.globalStatLabel}>$/HP</span>
          </div>
        )}
      </div>

      <div className={styles.globalActions}>
        <button onClick={clearUpgrades} className={styles.globalClearBtn}>
          <Icons.trash size={14} />
          Clear Build
        </button>
      </div>
    </div>
  );
}
