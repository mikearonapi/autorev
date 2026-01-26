'use client';

/**
 * BuildDashboard Component
 * 
 * High-level visual summary of the current build configuration.
 * Inspired by fitness tracking dashboards (Whoop-style).
 * 
 * IMPORTANT: This component displays metrics from the performanceCalculator.
 * It does NOT calculate any metrics itself - all values are passed from parent.
 * See docs/SOURCE_OF_TRUTH.md for performance calculation rules.
 * 
 * Displays:
 * - Power Potential (HP Gain / Max Potential)
 * - Build Health (Reliability from performanceCalculator)
 * - Daily Drivability (Comfort/handling score)
 */

import React from 'react';

import { Icons } from '@/components/ui/Icons';

import styles from './BuildDashboard.module.css';

function RingGauge({ value, max = 100, label, sublabel, color = '#10b981', size = 120, numericValue = null }) {
  const radius = (size - 10) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use numericValue for progress if provided (allows string display with numeric progress)
  const progressValue = numericValue !== null ? numericValue : (typeof value === 'number' ? value : 0);
  const progress = Math.min(progressValue, max) / max;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className={styles.gaugeContainer} style={{ width: size, height: size }}>
      <svg className={styles.gauge} width={size} height={size}>
        {/* Background Circle */}
        <circle
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="6"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Circle */}
        <circle
          className={styles.gaugeProgress}
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className={styles.gaugeContent}>
        <span className={styles.gaugeValue} style={{ color }}>{value}</span>
        <span className={styles.gaugeLabel}>{label}</span>
        {sublabel && <span className={styles.gaugeSublabel}>{sublabel}</span>}
      </div>
    </div>
  );
}

/**
 * BuildDashboard - Whoop-style analytics display
 * 
 * @param {Object} props
 * @param {Object} props.performanceMetrics - Calculated metrics from performanceCalculator
 * @param {number} props.performanceMetrics.stockHp - Stock HP
 * @param {number} props.performanceMetrics.finalHp - Final HP after upgrades
 * @param {number} props.performanceMetrics.hpGain - HP gained
 * @param {number} props.performanceMetrics.stockZeroToSixty - Stock 0-60 time
 * @param {number} props.performanceMetrics.finalZeroToSixty - 0-60 time after upgrades
 * @param {number} props.performanceMetrics.reliabilityScore - Reliability score (0-100)
 * @param {number} props.performanceMetrics.handlingScore - Handling/drivability score (0-100)
 * @param {number} props.totalCost - Total build cost
 * @param {number} props.upgradeCount - Number of upgrades selected
 * @param {Object} props.car - Car object (for display)
 */
export default function BuildDashboard({ 
  performanceMetrics = {},
  totalCost = 0,
  upgradeCount = 0,
  car,
}) {
  const { 
    stockHp = car?.hp || 0,
    finalHp = car?.hp || 0,
    hpGain = 0,
    stockZeroToSixty = car?.zeroToSixty || null,
    finalZeroToSixty = null,
    reliabilityScore = 100,
    handlingScore = 0,
  } = performanceMetrics;

  // Calculate 0-60 improvement
  const zeroToSixtyImprovement = (stockZeroToSixty && finalZeroToSixty) 
    ? Math.round((stockZeroToSixty - finalZeroToSixty) * 10) / 10
    : 0;

  // Determine stage based on HP gain percentage (more meaningful than upgrade count)
  const hpGainPercent = stockHp > 0 ? (hpGain / stockHp) * 100 : 0;
  const stage = hpGainPercent > 50 ? 3 : hpGainPercent > 20 ? 2 : 1;

  // Reliability color based on score
  const getReliabilityColor = (score) => {
    if (score >= 80) return '#10b981'; // Green - healthy
    if (score >= 60) return '#f59e0b'; // Amber - caution
    return '#ef4444'; // Red - stressed
  };

  // Handling color based on score
  const getHandlingColor = (score) => {
    if (score >= 50) return '#8b5cf6'; // Purple - good
    if (score >= 25) return '#3b82f6'; // Blue - moderate
    return 'rgba(255, 255, 255, 0.5)'; // Gray - minimal
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h2 className={styles.title}>Build Analytics</h2>
        <div className={styles.badges}>
          <div className={styles.badge}>
            <Icons.bolt size={14} />
            <span>Stage {stage}</span>
          </div>
        </div>
      </div>

      <div className={styles.ringsGrid}>
        {/* Power Ring - shows HP gain with total HP as sublabel */}
        <div className={styles.metricCard}>
          <RingGauge 
            value={hpGain > 0 ? `+${hpGain}` : 'Stock'} 
            numericValue={hpGain}
            max={Math.max(stockHp, 200)} // Max potential based on stock HP
            label="HP GAIN" 
            sublabel={`${finalHp} Total HP`}
            color="#10b981"
          />
        </div>

        {/* Reliability Ring - from performanceCalculator.calculateReliabilityScore */}
        <div className={styles.metricCard}>
          <RingGauge 
            value={`${Math.round(reliabilityScore)}%`}
            numericValue={reliabilityScore}
            max={100} 
            label="HEALTH" 
            sublabel="Reliability"
            color={getReliabilityColor(reliabilityScore)}
          />
        </div>

        {/* Handling Ring - from performanceCalculator.calculateHandlingScore */}
        <div className={styles.metricCard}>
          <RingGauge 
            value={handlingScore > 0 ? `${Math.round(handlingScore)}%` : '—'}
            numericValue={handlingScore}
            max={100} 
            label="HANDLING" 
            sublabel="Chassis Score"
            color={getHandlingColor(handlingScore)}
          />
        </div>
      </div>
      
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>0-60 mph</span>
          <span className={styles.statValue}>
            {finalZeroToSixty ? `${finalZeroToSixty.toFixed(1)}s` : (stockZeroToSixty ? `${stockZeroToSixty.toFixed(1)}s` : '—')}
          </span>
          {zeroToSixtyImprovement > 0 && (
            <span className={styles.statDelta} data-type="positive">
              -{zeroToSixtyImprovement.toFixed(1)}s
            </span>
          )}
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Est. Cost</span>
          <span className={styles.statValue}>
            ${totalCost.toLocaleString()}
          </span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Upgrades</span>
          <span className={styles.statValue}>{upgradeCount}</span>
        </div>
      </div>
    </div>
  );
}
