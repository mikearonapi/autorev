'use client';

/**
 * Performance Comparison - Professional Design
 * 
 * Matches the Tuning Shop's Performance Metrics component style.
 * Shows stock vs modified metrics with calculated improvements.
 */

import { useMemo } from 'react';
import { getUpgradeByKey } from '@/lib/upgrades';
import styles from './PerformanceComparison.module.css';

// SVG Icons matching the Tuning Shop style
const Icons = {
  bolt: ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  stopwatch: ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="14" r="8"/>
      <line x1="12" y1="14" x2="12" y2="10"/>
      <line x1="12" y1="2" x2="12" y2="4"/>
      <line x1="8" y1="2" x2="16" y2="2"/>
    </svg>
  ),
  flag: ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  brake: ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3"/>
      <line x1="12" y1="5" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  gauge: ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 10 10"/>
      <path d="M12 12l3-3"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
};

// Format value for display
function formatMetricValue(value, unit) {
  if (value === null || value === undefined) return '-';
  
  if (unit === 's' || unit === 'g') {
    return value.toFixed(1);
  }
  if (unit === 'ft') {
    return Math.round(value);
  }
  return Math.round(value).toLocaleString();
}

/**
 * Calculate performance improvements from upgrades
 * Matches the logic in lib/performance.js calculateUpgradedMetrics
 */
function calculatePerformanceImprovements(carData, selectedUpgrades) {
  let totalHpGain = 0;
  let totalZeroToSixtyImprovement = 0;
  let totalBrakingImprovement = 0;
  let totalLateralGImprovement = 0;
  
  // Sum all metric changes from selected upgrades
  for (const upgrade of selectedUpgrades) {
    if (upgrade.metricChanges) {
      totalHpGain += upgrade.metricChanges.hpGain || 0;
      totalZeroToSixtyImprovement += upgrade.metricChanges.zeroToSixtyImprovement || 0;
      totalBrakingImprovement += upgrade.metricChanges.brakingImprovement || 0;
      totalLateralGImprovement += upgrade.metricChanges.lateralGImprovement || 0;
    }
  }
  
  const newHp = (carData.hp || 0) + totalHpGain;
  
  return {
    hp: newHp,
    zeroToSixty: carData.zero_to_sixty ? Math.max(2.0, carData.zero_to_sixty - totalZeroToSixtyImprovement) : null,
    braking60To0: carData.braking_60_0 ? Math.max(70, carData.braking_60_0 - totalBrakingImprovement) : null,
    lateralG: carData.lateral_g ? Math.min(1.6, parseFloat(carData.lateral_g) + totalLateralGImprovement) : null,
  };
}

/**
 * Real Metric Row - Matches Tuning Shop UpgradeCenter exactly
 */
function MetricRow({ 
  icon: IconComponent, 
  label, 
  stockValue, 
  upgradedValue, 
  unit, 
  improvementPrefix = '+', 
  isLowerBetter = false 
}) {
  const hasImproved = isLowerBetter 
    ? upgradedValue < stockValue 
    : upgradedValue > stockValue;
  const improvementVal = Math.abs(upgradedValue - stockValue);
  
  // Format values
  const formattedStock = formatMetricValue(stockValue, unit);
  const formattedUpgraded = formatMetricValue(upgradedValue, unit);
  const formattedImprovement = formatMetricValue(improvementVal, unit);
  
  // Calculate bar percentages
  const maxValues = {
    hp: 1200,
    s: 8,
    ft: 150,
    g: 1.6,
  };
  
  const maxValue = maxValues[unit.trim()] || maxValues.hp;
  
  // For time (lower is better), invert the percentage
  const stockPercent = isLowerBetter 
    ? ((maxValue - stockValue) / maxValue) * 100 
    : (stockValue / maxValue) * 100;
  const upgradedPercent = isLowerBetter 
    ? ((maxValue - upgradedValue) / maxValue) * 100 
    : (upgradedValue / maxValue) * 100;
  
  return (
    <div className={styles.metricRow}>
      <div className={styles.metricHeader}>
        <div className={styles.metricLabel}>
          <IconComponent size={12} />
          {label}
        </div>
        <div className={styles.metricValues}>
          {hasImproved ? (
            <>
              <span className={styles.stockValue}>{formattedStock}</span>
              <span className={styles.metricArrow}>→</span>
              <span className={styles.upgradedValue}>{formattedUpgraded}{unit}</span>
              <span className={styles.metricDelta}>
                {improvementPrefix}{formattedImprovement}
              </span>
            </>
          ) : (
            <span className={styles.currentValue}>{formattedStock}{unit}</span>
          )}
        </div>
      </div>
      <div className={styles.metricTrack}>
        <div 
          className={styles.metricFillStock}
          style={{ width: `${Math.min(100, stockPercent)}%` }}
        />
        {hasImproved && upgradedPercent > stockPercent && (
          <div 
            className={styles.metricFillUpgrade}
            style={{ 
              left: `${Math.min(100, stockPercent)}%`,
              width: `${Math.min(100 - stockPercent, upgradedPercent - stockPercent)}%` 
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function PerformanceComparison({ 
  carData = {},
  buildData = {},
  totalCost = 0,
}) {
  // Load actual upgrade data with metricChanges
  const selectedUpgrades = useMemo(() => {
    if (!buildData?.selected_upgrades) return [];
    
    // Handle both array format and object with upgrades property
    const upgradeKeys = Array.isArray(buildData.selected_upgrades)
      ? buildData.selected_upgrades
      : buildData.selected_upgrades?.upgrades || [];
    
    // Map keys to actual upgrade objects
    return upgradeKeys
      .map(key => typeof key === 'string' ? getUpgradeByKey(key) : key)
      .filter(Boolean);
  }, [buildData]);

  // Calculate actual improvements based on upgrade deltas
  const calculatedMetrics = useMemo(() => {
    if (selectedUpgrades.length === 0 || !carData.hp) return null;
    
    return calculatePerformanceImprovements(carData, selectedUpgrades);
  }, [carData, selectedUpgrades]);

  // Don't render if no meaningful data
  if (!calculatedMetrics || !carData.hp) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <Icons.gauge size={20} />
          Performance Metrics
        </h2>
        {totalCost > 0 && (
          <span className={styles.costBadge}>
            ${totalCost.toLocaleString()}
          </span>
        )}
      </div>

      <div className={styles.metricsGrid}>
        {/* HP */}
        <MetricRow
          icon={Icons.bolt}
          label="HP"
          stockValue={carData.hp}
          upgradedValue={calculatedMetrics.hp}
          unit=" hp"
          improvementPrefix="+"
          isLowerBetter={false}
        />

        {/* 0-60 */}
        {carData.zero_to_sixty && (
          <MetricRow
            icon={Icons.stopwatch}
            label="0-60"
            stockValue={carData.zero_to_sixty}
            upgradedValue={calculatedMetrics.zeroToSixty}
            unit="s"
            improvementPrefix="-"
            isLowerBetter={true}
          />
        )}

        {/* Braking */}
        {carData.braking_60_0 && (
          <MetricRow
            icon={Icons.brake}
            label="BRAKING"
            stockValue={carData.braking_60_0}
            upgradedValue={calculatedMetrics.braking60To0}
            unit="ft"
            improvementPrefix="-"
            isLowerBetter={true}
          />
        )}

        {/* Grip (Lateral G) */}
        {carData.lateral_g && (
          <MetricRow
            icon={Icons.gauge}
            label="GRIP"
            stockValue={carData.lateral_g}
            upgradedValue={calculatedMetrics.lateralG}
            unit="g"
            improvementPrefix="+"
            isLowerBetter={false}
          />
        )}
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={styles.legendStock}></span>
          Stock
        </div>
        <div className={styles.legendItem}>
          <span className={styles.legendUpgrade}></span>
          Modified
        </div>
      </div>
    </div>
  );
}
