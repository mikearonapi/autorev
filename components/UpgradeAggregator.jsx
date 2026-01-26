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

import { useCarSelection, useBuildSummary } from '@/components/providers/CarSelectionProvider';
import { Icons } from '@/components/ui/Icons';
import { calculateSmartHpGain, formatHpDisplay, getConflictSummary } from '@/lib/performanceCalculator';

import styles from './UpgradeAggregator.module.css';

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
    if (!car) {
      return null;
    }
    // Get upgrade keys for smart calculation
    const upgradeKeys = selectedUpgrades.filter(Boolean).map(u => u.key).filter(Boolean);
    
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
  if (!buildStats || selectedUpgrades.length === 0) {
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
          <div className={styles.statIcon} style={{ '--stat-color': 'var(--color-error, #ef4444)' }}>
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
          <div className={styles.statIcon} style={{ '--stat-color': 'var(--color-accent-blue, #3b82f6)' }}>
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
          <div className={styles.statIcon} style={{ '--stat-color': 'var(--color-accent-teal, #10b981)' }}>
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
