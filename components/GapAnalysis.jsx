'use client';

/**
 * Gap Analysis Component
 * 
 * Core feedback loop component that:
 * - Analyzes the gap between predicted and actual performance
 * - Suggests possible causes for discrepancies
 * - Provides actionable recommendations
 * 
 * Brand Colors:
 * - Teal (#10b981): Positive outcomes, "beat predictions"
 * - Blue (#3b82f6): Informational, baseline
 * - Amber (#f59e0b): Warnings, underperformance (sparingly)
 */

import React, { useMemo } from 'react';

import styles from './GapAnalysis.module.css';

// Icons
const LightbulbIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-4 12.9V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.1A7 7 0 0 0 12 2z" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const WrenchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

/**
 * Analyze the gap and determine causes/recommendations
 */
function analyzeGap(predicted, actual, type, _context = {}) {
  if (!actual || !predicted) return null;
  
  const difference = actual - predicted;
  const percentDiff = Math.abs((difference / predicted) * 100);
  const lowerIsBetter = type === 'laptime';
  const isPositive = lowerIsBetter ? difference < 0 : difference > 0;
  const isNeutral = percentDiff < 3; // Within 3% is considered on-target
  
  // Determine status
  let status = 'neutral';
  if (!isNeutral) {
    status = isPositive ? 'positive' : 'negative';
  }
  
  // Generate causes and recommendations based on type and gap
  const causes = [];
  const recommendations = [];
  
  if (type === 'power') {
    if (status === 'negative') {
      // Underperforming HP
      if (percentDiff > 10) {
        causes.push({ text: 'Tune may not be optimized for current mods', severity: 'warning' });
        causes.push({ text: 'Possible boost leak or vacuum leak', severity: 'warning' });
        causes.push({ text: 'Fuel quality below expectation (E85 blend percentage)', severity: 'info' });
        recommendations.push({ text: 'Verify fuel ethanol content with a tester', icon: 'wrench' });
        recommendations.push({ text: 'Check for boost leaks with smoke test', icon: 'wrench' });
        recommendations.push({ text: 'Consider a custom dyno tune', icon: 'lightbulb' });
      } else if (percentDiff > 5) {
        causes.push({ text: 'Normal dyno variance between facilities', severity: 'info' });
        causes.push({ text: 'Ambient temperature/altitude affecting power', severity: 'info' });
        causes.push({ text: 'Dyno correction factor differences', severity: 'info' });
        recommendations.push({ text: 'Baseline is still strong - minor gap is normal', icon: 'check' });
      }
    } else if (status === 'positive') {
      // Exceeding predictions
      causes.push({ text: 'Car is responding well to modifications', severity: 'positive' });
      causes.push({ text: 'Tune may be more aggressive than baseline', severity: 'positive' });
      recommendations.push({ text: 'Great results! Consider logging under different conditions', icon: 'check' });
    }
  } else if (type === 'laptime') {
    if (status === 'negative') {
      // Slower than predicted
      if (percentDiff > 5) {
        causes.push({ text: 'Track conditions may have been suboptimal', severity: 'info' });
        causes.push({ text: 'Tire temperatures not optimal', severity: 'info' });
        causes.push({ text: 'Driver experience/familiarity with track', severity: 'info' });
        recommendations.push({ text: 'Review onboard footage for improvement areas', icon: 'lightbulb' });
        recommendations.push({ text: 'Check tire pressures for your setup', icon: 'wrench' });
        recommendations.push({ text: 'More seat time usually yields improvement', icon: 'lightbulb' });
      } else {
        causes.push({ text: 'Close to predicted - minor variance is normal', severity: 'info' });
        recommendations.push({ text: 'Keep logging sessions to track improvement', icon: 'check' });
      }
    } else if (status === 'positive') {
      // Faster than predicted
      causes.push({ text: 'Driver skill exceeding average assumption', severity: 'positive' });
      causes.push({ text: 'Track conditions were favorable', severity: 'positive' });
      causes.push({ text: 'Setup dialed in well', severity: 'positive' });
      recommendations.push({ text: 'Excellent result! You beat the prediction', icon: 'check' });
      recommendations.push({ text: 'Record your setup for future reference', icon: 'lightbulb' });
    }
  }
  
  return {
    difference,
    percentDiff: percentDiff.toFixed(1),
    status,
    isPositive,
    isNeutral,
    causes,
    recommendations,
  };
}

/**
 * Gap Analysis Component
 * 
 * @param {string} type - 'power' | 'laptime'
 * @param {number} predicted - Predicted value
 * @param {number} actual - Actual measured value
 * @param {string} unit - Unit label
 * @param {Object} context - Additional context (mods, conditions, etc.)
 */
export default function GapAnalysis({
  type = 'power',
  predicted,
  actual,
  unit = '',
  context = {},
}) {
  const analysis = useMemo(() => {
    return analyzeGap(predicted, actual, type, context);
  }, [predicted, actual, type, context]);
  
  if (!analysis) {
    return null;
  }
  
  const { status, difference, percentDiff, causes, recommendations, isPositive } = analysis;
  
  // Format the value display based on type
  const formatDiff = () => {
    if (type === 'laptime') {
      const absDiff = Math.abs(difference);
      return `${isPositive ? '' : '+'}${absDiff.toFixed(2)}s`;
    }
    return `${difference > 0 ? '+' : ''}${Math.round(difference)} ${unit}`;
  };
  
  return (
    <div className={`${styles.gapAnalysis} ${styles[status]}`}>
      {/* Header with status */}
      <div className={styles.header}>
        <div className={styles.statusIcon}>
          {status === 'positive' && <CheckCircleIcon />}
          {status === 'negative' && <AlertTriangleIcon />}
          {status === 'neutral' && <CheckCircleIcon />}
        </div>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>
            {status === 'positive' && 'Exceeding Predictions'}
            {status === 'negative' && 'Below Predictions'}
            {status === 'neutral' && 'On Target'}
          </h3>
          <span className={styles.gapSummary}>
            {formatDiff()} ({percentDiff}% {status === 'neutral' ? 'variance' : (isPositive ? 'better' : 'gap')})
          </span>
        </div>
      </div>
      
      {/* Causes Section */}
      {causes.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Possible Factors</h4>
          <ul className={styles.causesList}>
            {causes.map((cause, idx) => (
              <li key={idx} className={`${styles.causeItem} ${styles[cause.severity]}`}>
                <span className={styles.causeBullet}>•</span>
                <span>{cause.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Recommendations</h4>
          <ul className={styles.recommendationsList}>
            {recommendations.map((rec, idx) => (
              <li key={idx} className={styles.recommendationItem}>
                <span className={styles.recIcon}>
                  {rec.icon === 'wrench' && <WrenchIcon />}
                  {rec.icon === 'lightbulb' && <LightbulbIcon />}
                  {rec.icon === 'check' && <CheckCircleIcon />}
                </span>
                <span>{rec.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline gap indicator
 */
export function GapIndicator({ predicted, actual, lowerIsBetter = false }) {
  if (!actual || !predicted) return null;
  
  const difference = actual - predicted;
  const percentDiff = ((Math.abs(difference) / predicted) * 100).toFixed(1);
  const isPositive = lowerIsBetter ? difference < 0 : difference > 0;
  const isNeutral = Math.abs(difference / predicted) < 0.03;
  
  const status = isNeutral ? 'neutral' : (isPositive ? 'positive' : 'negative');
  
  return (
    <span className={`${styles.indicator} ${styles[status]}`}>
      {difference > 0 ? '+' : ''}{Math.round(difference)}
      <span className={styles.indicatorPercent}>({percentDiff}%)</span>
    </span>
  );
}
