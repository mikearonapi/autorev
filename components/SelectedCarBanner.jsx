'use client';

/**
 * Selected Car Banner
 * 
 * A secondary header bar that displays the currently selected car.
 * Shows key stats and build summary when in Performance Hub context.
 * Provides quick actions to change or clear the selection.
 * 
 * @module components/SelectedCarBanner
 */

import { useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useCarSelection, useHasSelectedCar } from '@/components/providers/CarSelectionProvider';
import { Icons } from '@/components/ui/Icons';

import styles from './SelectedCarBanner.module.css';


/**
 * Format currency for display
 * @param {number} amount 
 * @returns {string}
 */
function formatCurrency(amount) {
  // Handle invalid values
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '$0';
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}K`;
  }
  return `$${amount}`;
}

/**
 * Selected Car Banner Component
 */
export default function SelectedCarBanner() {
  const pathname = usePathname();
  const hasSelectedCar = useHasSelectedCar();
  const { selectedCar, buildSummary, appliedUpgrades, clearCar, isHydrated } = useCarSelection();
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine if we're in a Tuning Shop context
  const isPerformanceContext = pathname?.startsWith('/tuning-shop');
  const isCarDetailPage = pathname?.startsWith('/browse-cars/');
  
  // Don't show banner if no car is selected or during SSR
  if (!isHydrated || !hasSelectedCar || !selectedCar) {
    return null;
  }

  // Check if there are any upgrades applied
  const hasUpgrades = appliedUpgrades.length > 0;

  return (
    <div className={styles.banner}>
      <div className={styles.bannerInner}>
        {/* Car Info - Always Visible */}
        <div className={styles.carInfo}>
          <div className={styles.carIdentity}>
            <span className={styles.carName}>{selectedCar?.name}</span>
            <span className={styles.carYears}>{selectedCar?.years || ''}</span>
          </div>
          
          {/* Key Stats - Desktop Only */}
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <Icons.zap size={14} />
              <span className={styles.statValue}>
                {hasUpgrades ? (
                  <>
                    <span className={styles.originalValue}>{selectedCar.hp}</span>
                    <Icons.arrowRight size={12} />
                    <span className={styles.newValue}>{buildSummary.finalHp}</span>
                  </>
                ) : (
                  selectedCar.hp
                )}
              </span>
              <span className={styles.statLabel}>hp</span>
            </div>
            
            {selectedCar.zeroToSixty && (
              <div className={styles.stat}>
                <Icons.timer size={14} />
                <span className={styles.statValue}>{selectedCar.zeroToSixty}s</span>
                <span className={styles.statLabel}>0-60</span>
              </div>
            )}
            
            {hasUpgrades && (
              <>
                <div className={styles.stat}>
                  <Icons.dollar size={14} />
                  <span className={styles.statValue}>
                    {buildSummary.totalCostLow && buildSummary.totalCostHigh && buildSummary.totalCostLow !== buildSummary.totalCostHigh
                      ? `${formatCurrency(buildSummary.totalCostLow)} - ${formatCurrency(buildSummary.totalCostHigh)}`
                      : formatCurrency(buildSummary.totalCost)
                    }
                  </span>
                  <span className={styles.statLabel}>build</span>
                </div>
                
                {buildSummary.costPerHp > 0 && (
                  <div className={styles.stat}>
                    <Icons.trendingUp size={14} />
                    <span className={styles.statValue}>${buildSummary.costPerHp}</span>
                    <span className={styles.statLabel}>$/hp</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {/* Mobile Expand Toggle */}
          <button 
            className={styles.expandToggle}
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            {isExpanded ? <Icons.chevronUp size={16} /> : <Icons.chevronDown size={16} />}
          </button>

          {/* Tuning Shop Link - if not already there */}
          {!isPerformanceContext && (
            <Link 
              href={`/tuning-shop?car=${selectedCar.slug}`}
              className={styles.actionBtn}
              title="Go to Tuning Shop"
            >
              <Icons.wrench size={14} />
              <span className={styles.actionLabel}>Build</span>
            </Link>
          )}

          {/* Change Car */}
          <Link 
            href="/garage"
            className={styles.actionBtn}
            title="Change car"
          >
            Change
          </Link>

          {/* Clear Selection */}
          <button 
            onClick={clearCar}
            className={styles.clearBtn}
            aria-label="Clear car selection"
            title="Clear selection"
          >
            <Icons.x size={14} />
          </button>
        </div>
      </div>

      {/* Mobile Expanded View */}
      {isExpanded && (
        <div className={styles.expandedContent}>
          <div className={styles.expandedStats}>
            <div className={styles.expandedStat}>
              <span className={styles.expandedStatLabel}>Power</span>
              <span className={styles.expandedStatValue}>
                {hasUpgrades ? `${selectedCar.hp} → ${buildSummary.finalHp} hp` : `${selectedCar.hp} hp`}
              </span>
            </div>
            
            {selectedCar.zeroToSixty && (
              <div className={styles.expandedStat}>
                <span className={styles.expandedStatLabel}>0-60 mph</span>
                <span className={styles.expandedStatValue}>{selectedCar.zeroToSixty}s</span>
              </div>
            )}
            
            {selectedCar.torque && (
              <div className={styles.expandedStat}>
                <span className={styles.expandedStatLabel}>Torque</span>
                <span className={styles.expandedStatValue}>
                  {hasUpgrades && buildSummary.finalTorque > selectedCar.torque
                    ? `${selectedCar.torque} → ${buildSummary.finalTorque} lb-ft`
                    : `${selectedCar.torque} lb-ft`
                  }
                </span>
              </div>
            )}
            
            <div className={styles.expandedStat}>
              <span className={styles.expandedStatLabel}>Price Range</span>
              <span className={styles.expandedStatValue}>{selectedCar?.priceRange || '—'}</span>
            </div>

            {hasUpgrades && (
              <>
                <div className={styles.expandedStat}>
                  <span className={styles.expandedStatLabel}>Build Cost</span>
                  <span className={styles.expandedStatValue}>
                    {buildSummary.totalCostLow && buildSummary.totalCostHigh && buildSummary.totalCostLow !== buildSummary.totalCostHigh
                      ? `${formatCurrency(buildSummary.totalCostLow)} - ${formatCurrency(buildSummary.totalCostHigh)}`
                      : formatCurrency(buildSummary.totalCost)
                    }
                  </span>
                </div>
                
                <div className={styles.expandedStat}>
                  <span className={styles.expandedStatLabel}>HP Gained</span>
                  <span className={styles.expandedStatValue}>+{buildSummary.totalHpGain} hp</span>
                </div>
                
                {buildSummary.costPerHp > 0 && (
                  <div className={styles.expandedStat}>
                    <span className={styles.expandedStatLabel}>Cost per HP</span>
                    <span className={styles.expandedStatValue}>${buildSummary.costPerHp}/hp</span>
                  </div>
                )}
              </>
            )}
          </div>

          {hasUpgrades && (
            <div className={styles.upgradesList}>
              <span className={styles.upgradesTitle}>Applied Upgrades ({appliedUpgrades.length})</span>
              <div className={styles.upgradesTags}>
                {appliedUpgrades.slice(0, 5).map(upgrade => (
                  <span key={upgrade.id} className={styles.upgradeTag}>
                    {upgrade.name}
                  </span>
                ))}
                {appliedUpgrades.length > 5 && (
                  <span className={styles.upgradeTag}>+{appliedUpgrades.length - 5} more</span>
                )}
              </div>
            </div>
          )}

          <div className={styles.expandedActions}>
            {!isPerformanceContext && (
              <Link 
                href={`/tuning-shop?car=${selectedCar.slug}`}
                className={styles.expandedActionBtn}
              >
                <Icons.wrench size={16} />
                Go to Tuning Shop
              </Link>
            )}
            {!isCarDetailPage && (
              <Link 
                href={`/browse-cars/${selectedCar.slug}`}
                className={styles.expandedActionBtnSecondary}
              >
                View Car Details
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
