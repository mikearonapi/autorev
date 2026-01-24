'use client';

/**
 * Predicted vs Actual Comparison Component
 * 
 * Core of the "My Data" feedback loop vision:
 * - Shows predicted value from tuning calculations
 * - Allows user to log actual measured value
 * - Displays gap analysis with insights
 * 
 * Brand Colors:
 * - Teal (#10b981): Positive/improvements
 * - Blue (#3b82f6): Baseline/predicted
 * - Amber (#f59e0b): Warnings only (sparingly)
 */

import React, { useState } from 'react';
import GapAnalysis from './GapAnalysis';
import { formatDateSimple } from '@/lib/dateUtils';
import styles from './PredictedVsActual.module.css';

// Icons
const TargetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const TrendUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const TrendDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

/**
 * Calculate gap percentage and determine status
 */
function calculateGap(predicted, actual, lowerIsBetter = false) {
  if (!actual || !predicted) return null;
  
  const difference = actual - predicted;
  const percentDiff = ((difference / predicted) * 100).toFixed(1);
  
  // For things like lap times, lower is better
  // For things like HP, higher is better
  const isPositive = lowerIsBetter ? difference < 0 : difference > 0;
  const isNeutral = Math.abs(difference) < (predicted * 0.02); // Within 2% is considered neutral
  
  return {
    difference,
    percentDiff,
    isPositive,
    isNeutral,
    status: isNeutral ? 'neutral' : (isPositive ? 'positive' : 'negative'),
  };
}

/**
 * PredictedVsActual Component
 * 
 * @param {string} type - 'power' | 'laptime' - determines formatting and comparison logic
 * @param {string} label - Display label (e.g., "Wheel Horsepower", "Laguna Seca")
 * @param {number} predicted - Predicted/estimated value
 * @param {number|null} actual - Actual measured value (null if not logged)
 * @param {string} unit - Unit label (e.g., "WHP", "seconds")
 * @param {function} onLogActual - Callback to open logging modal
 * @param {boolean} lowerIsBetter - For lap times, lower is better
 * @param {string} lastLogged - Date string of last logged value
 */
export default function PredictedVsActual({
  type = 'power',
  label,
  predicted,
  actual,
  unit = '',
  onLogActual,
  lowerIsBetter = false,
  lastLogged,
  insight,
}) {
  const gap = calculateGap(predicted, actual, lowerIsBetter);
  const hasActual = actual !== null && actual !== undefined;
  
  // Format values based on type
  const formatValue = (val) => {
    if (type === 'laptime') {
      // Convert seconds to MM:SS.mmm
      const mins = Math.floor(val / 60);
      const secs = (val % 60).toFixed(3);
      return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : `${secs}s`;
    }
    return Math.round(val);
  };
  
  return (
    <div className={styles.comparisonCard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.labelSection}>
          <span className={styles.typeIcon}>
            {hasActual ? <CheckCircleIcon /> : <TargetIcon />}
          </span>
          <span className={styles.label}>{label}</span>
        </div>
        {hasActual && gap && (
          <div className={`${styles.gapBadge} ${styles[gap.status]}`}>
            <span className={styles.gapIcon}>
              {gap.isPositive ? <TrendUpIcon /> : <TrendDownIcon />}
            </span>
            <span className={styles.gapValue}>
              {gap.difference > 0 ? '+' : ''}{formatValue(Math.abs(gap.difference))} {unit}
            </span>
            <span className={styles.gapPercent}>({gap.percentDiff}%)</span>
          </div>
        )}
      </div>
      
      {/* Values Row */}
      <div className={styles.valuesRow}>
        {/* Predicted Column */}
        <div className={styles.valueColumn}>
          <span className={styles.valueLabel}>Predicted</span>
          <span className={styles.predictedValue}>
            {formatValue(predicted)}
            <span className={styles.unit}>{unit}</span>
          </span>
        </div>
        
        {/* Arrow */}
        <div className={styles.arrow}>→</div>
        
        {/* Actual Column */}
        <div className={styles.valueColumn}>
          <span className={styles.valueLabel}>Actual</span>
          {hasActual ? (
            <span className={`${styles.actualValue} ${gap ? styles[gap.status] : ''}`}>
              {formatValue(actual)}
              <span className={styles.unit}>{unit}</span>
            </span>
          ) : (
            <button 
              className={styles.logButton}
              onClick={onLogActual}
              type="button"
            >
              <PlusIcon />
              <span>Log Result</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Gap Analysis - Shows detailed feedback when actual data exists */}
      {hasActual && gap && !gap.isNeutral && (
        <div className={styles.gapAnalysisSection}>
          <GapAnalysis
            type={type}
            predicted={predicted}
            actual={actual}
            unit={unit}
          />
        </div>
      )}
      
      {/* Insight/Recommendation (custom override) */}
      {hasActual && insight && (
        <div className={styles.insightSection}>
          <p className={styles.insightText}>{insight}</p>
        </div>
      )}
      
      {/* Last logged date */}
      {hasActual && lastLogged && (
        <div className={styles.footer}>
          <span className={styles.lastLogged}>
            Last logged: {formatDateSimple(lastLogged)}
          </span>
        </div>
      )}
      
      {/* Empty state CTA */}
      {!hasActual && (
        <div className={styles.emptyPrompt}>
          <p>Log your actual results to see how your build performs vs predictions</p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function PredictedVsActualCompact({
  label,
  predicted,
  actual,
  unit = '',
  lowerIsBetter = false,
}) {
  const gap = calculateGap(predicted, actual, lowerIsBetter);
  const hasActual = actual !== null && actual !== undefined;
  
  return (
    <div className={styles.compactCard}>
      <span className={styles.compactLabel}>{label}</span>
      <div className={styles.compactValues}>
        <span className={styles.compactPredicted}>{Math.round(predicted)}</span>
        {hasActual && (
          <>
            <span className={styles.compactArrow}>→</span>
            <span className={`${styles.compactActual} ${gap ? styles[gap.status] : ''}`}>
              {Math.round(actual)}
            </span>
            {gap && (
              <span className={`${styles.compactGap} ${styles[gap.status]}`}>
                ({gap.difference > 0 ? '+' : ''}{gap.difference})
              </span>
            )}
          </>
        )}
        <span className={styles.compactUnit}>{unit}</span>
      </div>
    </div>
  );
}
