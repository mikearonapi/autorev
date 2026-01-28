'use client';

/**
 * DataSourceBadge - Indicates whether data is measured/verified vs estimated
 *
 * Used throughout the app to clearly communicate to users when they're seeing
 * their actual dyno data vs calculated/estimated values.
 *
 * Design follows SOURCE_OF_TRUTH.md color guidelines:
 * - Teal: Verified user data (highest confidence)
 * - Lime: Measured/user-provided data
 * - Blue: Calibrated estimates
 * - Neutral: Generic estimates
 */

import React from 'react';

import styles from './DataSourceBadge.module.css';
import { Icons } from './Icons';

/**
 * Data source types and their display configuration
 */
const SOURCE_CONFIG = {
  verified: {
    label: 'Verified',
    shortLabel: 'V',
    icon: 'checkCircle',
    color: 'teal',
    description: 'Admin-verified user data',
  },
  measured: {
    label: 'Measured',
    shortLabel: 'M',
    icon: 'activity',
    color: 'lime',
    description: 'Your dyno data',
  },
  calibrated: {
    label: 'Calibrated',
    shortLabel: 'C',
    icon: 'target',
    color: 'blue',
    description: 'Platform-tuned estimate',
  },
  estimated: {
    label: 'Estimated',
    shortLabel: 'E',
    icon: 'calculator',
    color: 'neutral',
    description: 'Physics-based calculation',
  },
};

/**
 * DataSourceBadge Component
 *
 * @param {Object} props
 * @param {string} props.source - Data source: 'verified' | 'measured' | 'calibrated' | 'estimated'
 * @param {'minimal' | 'compact' | 'full'} props.variant - Display variant
 * @param {boolean} props.showIcon - Whether to show icon (default: true for full/compact)
 * @param {string} props.detail - Additional detail text (e.g., "Dynojet @ Cobb Tuning")
 * @param {string} props.className - Additional CSS class
 */
export function DataSourceBadge({
  source = 'estimated',
  variant = 'compact',
  showIcon = null,
  detail = null,
  className = '',
}) {
  const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.estimated;
  const IconComponent = Icons[config.icon] || Icons.info;

  // Default showIcon based on variant
  const shouldShowIcon = showIcon ?? variant !== 'minimal';

  // Don't render badge for estimated data in minimal variant
  if (variant === 'minimal' && source === 'estimated') {
    return null;
  }

  return (
    <span
      className={`${styles.badge} ${styles[`badge--${config.color}`]} ${styles[`badge--${variant}`]} ${className}`}
      title={detail || config.description}
      aria-label={`Data source: ${config.label}${detail ? ` - ${detail}` : ''}`}
    >
      {shouldShowIcon && <IconComponent size={variant === 'full' ? 14 : 12} aria-hidden="true" />}
      <span className={styles.label}>
        {variant === 'minimal' ? config.shortLabel : config.label}
      </span>
    </span>
  );
}

/**
 * DataSourceIndicator - Inline indicator for a single metric
 *
 * Shows a small colored indicator next to a metric value to indicate its source.
 * For measured/verified data, shows "DYNO" label to clearly communicate the source.
 * Less prominent than the badge, good for tables and dense layouts.
 *
 * @param {Object} props
 * @param {string} props.source - Data source type
 * @param {string} props.variant - 'dot' (default) or 'label' for explicit "DYNO" text
 * @param {string} props.className - Additional CSS class
 */
export function DataSourceIndicator({ source = 'estimated', variant = 'label', className = '' }) {
  const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.estimated;

  // Don't show indicator for estimated data (it's the default)
  if (source === 'estimated') {
    return null;
  }

  // For measured/verified sources, show "DYNO" label instead of dot
  const showLabel = variant === 'label' && (source === 'measured' || source === 'verified');

  if (showLabel) {
    return (
      <span
        className={`${styles.indicatorLabel} ${styles[`indicatorLabel--${config.color}`]} ${className}`}
        title={config.description}
        aria-label={`${config.label} data`}
      >
        DYNO
      </span>
    );
  }

  return (
    <span
      className={`${styles.indicator} ${styles[`indicator--${config.color}`]} ${className}`}
      title={config.description}
      aria-label={`${config.label} data`}
    >
      <span className={styles.indicatorDot} aria-hidden="true" />
    </span>
  );
}

/**
 * MetricWithSource - Display a metric value with its data source
 *
 * Convenience component that combines a value display with source indication.
 *
 * @param {Object} props
 * @param {number|string} props.value - The metric value
 * @param {string} props.unit - Unit label (e.g., 'HP', 'lb-ft')
 * @param {string} props.source - Data source type
 * @param {string} props.sourceDetail - Additional source detail
 * @param {'inline' | 'stacked'} props.layout - Layout style
 * @param {string} props.className - Additional CSS class
 */
export function MetricWithSource({
  value,
  unit = '',
  source = 'estimated',
  sourceDetail = null,
  layout = 'inline',
  className = '',
}) {
  if (value === null || value === undefined) {
    return <span className={styles.metricEmpty}>—</span>;
  }

  const formattedValue = typeof value === 'number' ? value.toLocaleString() : value;
  const showBadge = source !== 'estimated';

  return (
    <span className={`${styles.metricWithSource} ${styles[`metric--${layout}`]} ${className}`}>
      <span className={styles.metricValue}>
        {formattedValue}
        {unit && <span className={styles.metricUnit}>{unit}</span>}
      </span>
      {showBadge && <DataSourceBadge source={source} variant="minimal" detail={sourceDetail} />}
    </span>
  );
}

/**
 * PerformanceSourceSummary - Summary of data sources for a vehicle
 *
 * Shows an overview of where the performance data comes from.
 * Useful at the top of performance displays.
 *
 * @param {Object} props
 * @param {boolean} props.hasUserData - Whether user has provided any data
 * @param {string} props.primarySource - Primary data source for power metrics
 * @param {string} props.dynoShop - Dyno shop name if available
 * @param {string} props.dynoDate - Dyno date if available
 */
export function PerformanceSourceSummary({
  hasUserData = false,
  primarySource = 'estimated',
  dynoShop = null,
  dynoDate = null,
}) {
  const config = SOURCE_CONFIG[primarySource] || SOURCE_CONFIG.estimated;
  const IconComponent = Icons[config.icon] || Icons.info;

  if (!hasUserData && primarySource === 'estimated') {
    return (
      <div className={styles.sourceSummary}>
        <Icons.info size={16} aria-hidden="true" />
        <span>Performance values are estimated based on your modifications</span>
      </div>
    );
  }

  return (
    <div className={`${styles.sourceSummary} ${styles[`summary--${config.color}`]}`}>
      <IconComponent size={16} aria-hidden="true" />
      <span>
        {hasUserData ? (
          <>
            Performance data from <strong>{dynoShop || 'your dyno results'}</strong>
            {dynoDate && <span className={styles.summaryDate}> ({dynoDate})</span>}
          </>
        ) : (
          <>Performance values are {config.label.toLowerCase()}</>
        )}
      </span>
    </div>
  );
}

export default DataSourceBadge;
