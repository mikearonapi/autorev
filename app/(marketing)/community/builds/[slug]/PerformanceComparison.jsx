'use client';

/**
 * Performance Comparison - Professional Design
 * 
 * Matches the Tuning Shop's Performance Metrics component style.
 * Shows stock vs modified metrics using the SINGLE SOURCE OF TRUTH calculator
 * (`lib/performanceCalculator`). Stored final_* fields can become stale as the
 * model improves, so we compute from (car specs + selected upgrades).
 */

import { getPerformanceProfile } from '@/lib/performanceCalculator';

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

// NOTE: No calculation here. We use STORED values from user_projects.
// These values were saved when the user created/updated their build.

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
  // Normalize car shape (DB uses snake_case, calculator expects camelCase)
  const normalizedCar = {
    ...carData,
    zeroToSixty: carData.zeroToSixty ?? carData.zero_to_sixty,
    braking60To0: carData.braking60To0 ?? carData.braking_60_0,
    lateralG: carData.lateralG ?? carData.lateral_g,
    quarterMile: carData.quarterMile ?? carData.quarter_mile,
    curbWeight: carData.curbWeight ?? carData.curb_weight,
  };

  // Normalize selected upgrades -> array of keys
  const rawSelected = buildData?.selected_upgrades ?? buildData?.selectedUpgrades ?? buildData?.upgrades ?? [];
  const rawKeys = Array.isArray(rawSelected) ? rawSelected : (rawSelected?.upgrades || []);
  const upgradeKeys = (rawKeys || []).map(u => (typeof u === 'string' ? u : u?.key)).filter(Boolean);

  const profile = normalizedCar?.hp
    ? getPerformanceProfile(normalizedCar, upgradeKeys)
    : null;

  const stockHp = profile?.stockMetrics?.hp ?? buildData?.stock_hp ?? carData.hp ?? 0;
  const finalHp = profile?.upgradedMetrics?.hp ?? buildData?.final_hp ?? stockHp;
  
  const stockZeroToSixty = profile?.stockMetrics?.zeroToSixty ?? buildData?.stock_zero_to_sixty ?? carData.zero_to_sixty ?? null;
  const finalZeroToSixty = profile?.upgradedMetrics?.zeroToSixty ?? buildData?.final_zero_to_sixty ?? stockZeroToSixty;
  
  const stockBraking = profile?.stockMetrics?.braking60To0 ?? buildData?.stock_braking_60_0 ?? carData.braking_60_0 ?? null;
  const finalBraking = profile?.upgradedMetrics?.braking60To0 ?? buildData?.final_braking_60_0 ?? stockBraking;
  
  const stockLateralG = profile?.stockMetrics?.lateralG ?? buildData?.stock_lateral_g ?? carData.lateral_g ?? null;
  const finalLateralG = profile?.upgradedMetrics?.lateralG ?? buildData?.final_lateral_g ?? stockLateralG;
  
  // Don't render if no meaningful data
  if (!stockHp) {
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
          stockValue={stockHp}
          upgradedValue={finalHp}
          unit=" hp"
          improvementPrefix="+"
          isLowerBetter={false}
        />

        {/* 0-60 */}
        {stockZeroToSixty && (
          <MetricRow
            icon={Icons.stopwatch}
            label="0-60"
            stockValue={parseFloat(stockZeroToSixty)}
            upgradedValue={parseFloat(finalZeroToSixty)}
            unit="s"
            improvementPrefix="-"
            isLowerBetter={true}
          />
        )}

        {/* Braking */}
        {stockBraking && (
          <MetricRow
            icon={Icons.brake}
            label="BRAKING"
            stockValue={stockBraking}
            upgradedValue={finalBraking}
            unit="ft"
            improvementPrefix="-"
            isLowerBetter={true}
          />
        )}

        {/* Grip (Lateral G) */}
        {stockLateralG && (
          <MetricRow
            icon={Icons.gauge}
            label="GRIP"
            stockValue={parseFloat(stockLateralG)}
            upgradedValue={parseFloat(finalLateralG)}
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
