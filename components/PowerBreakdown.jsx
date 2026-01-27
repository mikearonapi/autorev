'use client';

/**
 * Power Breakdown - Donut chart showing where HP gains come from
 *
 * Visualizes contribution of each modification category as a percentage
 * of total power gains with an interactive donut chart.
 *
 * Brand Colors: Uses teal variations for the donut segments
 */

import React, { useState, useMemo } from 'react';

import { calculateSmartHpGain } from '@/lib/performanceCalculator';
import { getUpgradeByKey } from '@/lib/upgrades';

import styles from './PowerBreakdown.module.css';

// Color palette for donut segments (high contrast, distinct colors)
// Segment colors - matching design system tokens
const SEGMENT_COLORS = [
  '#10b981', // var(--color-accent-teal) - Teal (primary - largest segment)
  '#f59e0b', // var(--color-warning) - Amber/Orange
  '#3b82f6', // var(--color-accent-blue) - Blue
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#14b8a6', // Cyan
];

// Category display configuration
const CATEGORY_CONFIG = {
  tune: { label: 'ECU & Tuning', order: 1 },
  forcedInduction: { label: 'Forced Induction', order: 2 },
  exhaust: { label: 'Exhaust', order: 3 },
  intake: { label: 'Intake', order: 4 },
  other: { label: 'Other', order: 5 },
};

/**
 * Determine category for an upgrade key
 * Works by inspecting the key string, with fallback to upgrade registry
 */
function getCategoryForUpgrade(key) {
  if (!key) return 'other';

  const keyLower = key.toLowerCase();

  // Check key patterns first (works even if upgrade not in registry)
  if (keyLower.includes('tune') || keyLower.includes('ecu') || keyLower === 'piggyback-tuner') {
    return 'tune';
  }
  if (
    keyLower.includes('exhaust') ||
    keyLower === 'headers' ||
    keyLower.includes('downpipe') ||
    keyLower.includes('catback')
  ) {
    return 'exhaust';
  }
  if (keyLower.includes('intake') || keyLower.includes('cai')) {
    return 'intake';
  }
  if (
    keyLower.includes('turbo') ||
    keyLower.includes('supercharger') ||
    keyLower.includes('intercooler') ||
    keyLower.includes('boost')
  ) {
    return 'forcedInduction';
  }

  // Fallback to checking upgrade registry
  const upgrade = getUpgradeByKey(key);
  if (upgrade?.category === 'forcedInduction') {
    return 'forcedInduction';
  }

  return 'other';
}

/**
 * Estimate HP gain for an upgrade key when calculator doesn't have the data
 * Provides reasonable fallback values by category
 */
function estimateHpGainForCategory(category, engineType = 'na') {
  const estimates = {
    tune: { na: 15, turbo: 50, sc: 35 },
    exhaust: { na: 12, turbo: 15, sc: 10 },
    intake: { na: 8, turbo: 12, sc: 8 },
    forcedInduction: { na: 0, turbo: 30, sc: 20 },
    other: { na: 5, turbo: 5, sc: 5 },
  };

  const categoryEstimates = estimates[category] || estimates.other;
  return categoryEstimates[engineType] || categoryEstimates.na;
}

/**
 * Donut Chart SVG Component
 */
function DonutChart({ segments, totalGain, size = 140, strokeWidth = 24 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Calculate stroke-dasharray and stroke-dashoffset for each segment
  let cumulativePercent = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.donutSvg}>
      {/* Background circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="rgba(255, 255, 255, 0.08)"
        strokeWidth={strokeWidth}
      />

      {/* Segments */}
      {segments.map((segment, index) => {
        const percent = segment.percent / 100;
        const dashLength = percent * circumference;
        const dashOffset = -cumulativePercent * circumference;
        cumulativePercent += percent;

        return (
          <circle
            key={segment.key}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            className={styles.donutSegment}
            style={{
              '--segment-delay': `${index * 0.1}s`,
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
            }}
          />
        );
      })}

      {/* Center text */}
      <text x={center} y={center - 8} textAnchor="middle" className={styles.donutCenterValue}>
        +{totalGain}
      </text>
      <text x={center} y={center + 12} textAnchor="middle" className={styles.donutCenterLabel}>
        HP
      </text>
    </svg>
  );
}

export default function PowerBreakdown({
  upgrades = [],
  car,
  totalHpGain: providedTotalGain,
  carName = null,
  carSlug: _carSlug = null,
}) {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // Calculate the breakdown using the smart calculator
  // If calculator fails, create a fallback breakdown from the upgrade keys
  const calculationResult = useMemo(() => {
    // Extract upgrade keys from various formats
    const upgradeKeys = (upgrades || [])
      .map((u) => {
        if (typeof u === 'string') return u;
        if (u?.key) return u.key;
        if (u?.name) return u.name;
        return null;
      })
      .filter(Boolean);

    if (upgradeKeys.length === 0) {
      return null;
    }

    // Try the smart calculator if we have car data
    if (car && car.hp) {
      try {
        const result = calculateSmartHpGain(car, upgradeKeys);
        if (result && result.totalGain > 0) {
          return result;
        }
      } catch (e) {
        console.warn('[PowerBreakdown] Calculator failed, using fallback:', e.message);
      }
    }

    // Fallback: Create breakdown from upgrade keys without full calculation
    // This ensures SOMETHING displays even when car data is incomplete
    const engineType = car?.engine?.toLowerCase().includes('turbo')
      ? 'turbo'
      : car?.engine?.toLowerCase().includes('supercharg')
        ? 'sc'
        : 'na';

    const breakdown = {};
    let estimatedTotal = 0;

    upgradeKeys.forEach((key) => {
      const category = getCategoryForUpgrade(key);
      const estimatedGain = estimateHpGainForCategory(category, engineType);

      if (!breakdown[key]) {
        breakdown[key] = {
          name: key
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
          rawGain: estimatedGain,
          appliedGain: estimatedGain,
          conflicts: [],
        };
        estimatedTotal += estimatedGain;
      }
    });

    // If we have a provided total, scale the estimates to match
    if (providedTotalGain && providedTotalGain > 0 && estimatedTotal > 0) {
      const scaleFactor = providedTotalGain / estimatedTotal;
      Object.values(breakdown).forEach((item) => {
        item.appliedGain = Math.round(item.appliedGain * scaleFactor);
        item.rawGain = Math.round(item.rawGain * scaleFactor);
      });
      estimatedTotal = providedTotalGain;
    }

    return {
      totalGain: estimatedTotal,
      breakdown,
      isFallback: true, // Mark this as fallback data
    };
  }, [car, upgrades, providedTotalGain]);

  // Group breakdown items by category and calculate percentages
  const { categoryBreakdown: _categoryBreakdown, segments } = useMemo(() => {
    if (!calculationResult || !calculationResult.breakdown) {
      return { categoryBreakdown: [], segments: [] };
    }

    const categories = {};

    // Group each upgrade by its category
    for (const [key, data] of Object.entries(calculationResult.breakdown)) {
      if (data.appliedGain <= 0) continue;

      const category = getCategoryForUpgrade(key);
      if (!categories[category]) {
        categories[category] = {
          key: category,
          label: CATEGORY_CONFIG[category]?.label || 'Other',
          order: CATEGORY_CONFIG[category]?.order || 99,
          totalGain: 0,
          items: [],
        };
      }

      categories[category].totalGain += data.appliedGain;
      categories[category].items.push({
        key,
        name: data.name,
        gain: data.appliedGain,
      });
    }

    // Convert to array and sort by HP gain (largest first)
    const breakdown = Object.values(categories)
      .filter((cat) => cat.totalGain > 0)
      .map((cat) => ({
        ...cat,
        items: cat.items.sort((a, b) => b.gain - a.gain),
      }))
      .sort((a, b) => b.totalGain - a.totalGain);

    // Calculate total and percentages for donut chart
    const total = breakdown.reduce((sum, cat) => sum + cat.totalGain, 0);

    const chartSegments = breakdown.map((cat, index) => ({
      key: cat.key,
      label: cat.label,
      gain: cat.totalGain,
      percent: total > 0 ? (cat.totalGain / total) * 100 : 0,
      color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
      items: cat.items,
    }));

    return { categoryBreakdown: breakdown, segments: chartSegments };
  }, [calculationResult]);

  // Use provided total or calculated total
  const totalGain = providedTotalGain ?? calculationResult?.totalGain ?? 0;

  // Build contextual prompt for Ask AL
  const hasUpgrades = segments.length > 0;
  const topCategories = segments
    .slice(0, 3)
    .map((s) => s.label)
    .join(', ');

  const _powerBreakdownPrompt = carName
    ? hasUpgrades
      ? `Analyze my ${carName}'s power breakdown. I'm gaining ${totalGain} HP total, with contributions from ${topCategories}. Which modifications give the best bang for buck? Are there any synergies or conflicts I should know about?`
      : `What are the best power modifications for my ${carName}? I want to understand which mod categories (tune, exhaust, intake, forced induction) give the most HP gains and in what order I should install them.`
    : hasUpgrades
      ? `Explain this power breakdown showing +${totalGain} HP from ${topCategories}. How can I maximize my gains?`
      : 'What modifications typically provide the most horsepower gains? Explain the common categories like tune, exhaust, intake, and forced induction.';

  const _powerBreakdownDisplayMessage = hasUpgrades
    ? 'Analyze my mod contributions'
    : 'What mods give the best gains?';

  // Empty state
  if (!calculationResult || segments.length === 0) {
    return (
      <div className={styles.powerBreakdown}>
        <div className={styles.breakdownHeader}>
          <span className={styles.breakdownTitle}>Power Breakdown</span>
        </div>
        <div className={styles.breakdownEmpty}>
          <p>No power-adding modifications detected</p>
          <p className={styles.breakdownEmptyHint}>
            Configure your build to see where HP gains come from
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.powerBreakdown}>
      <div className={styles.breakdownHeader}>
        <span className={styles.breakdownTitle}>Power Breakdown</span>
      </div>

      <div className={styles.donutLayout}>
        {/* Donut Chart */}
        <div className={styles.donutContainer}>
          <DonutChart segments={segments} totalGain={totalGain} size={140} strokeWidth={22} />
        </div>

        {/* Legend */}
        <div className={styles.legendContainer}>
          {segments.map((segment) => (
            <div
              key={segment.key}
              className={`${styles.legendItem} ${hoveredSegment === segment.key ? styles.legendItemActive : ''}`}
              onMouseEnter={() => setHoveredSegment(segment.key)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className={styles.legendLeft}>
                <span className={styles.legendDot} style={{ background: segment.color }} />
                <span className={styles.legendLabel}>{segment.label}</span>
              </div>
              <div className={styles.legendRight}>
                <span className={styles.legendPercent}>{Math.round(segment.percent)}%</span>
                <span className={styles.legendGain}>+{segment.gain}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Adjustment summary if there was significant adjustment */}
      {calculationResult?.adjustmentAmount > 5 && (
        <div className={styles.adjustmentSummary}>
          <span className={styles.adjustmentLabel}>Realistic adjustment:</span>
          <span className={styles.adjustmentValue}>
            -{calculationResult.adjustmentAmount} HP (diminishing returns)
          </span>
        </div>
      )}
    </div>
  );
}
