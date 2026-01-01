'use client';

/**
 * KPICard Component
 * 
 * Hero metric card with sparkline, trend indicator, and interpretive title.
 * Follows the metric card anatomy from data-visualization-ui-ux.mdc:
 * - Label (top)
 * - Primary Value (large number)
 * - Interpretive Title (human-readable insight)
 * - Sparkline (if data provided)
 * - Trend indicator (comparison arrow)
 */

import { useMemo } from 'react';
import styles from './KPICard.module.css';
import { Tooltip } from './Tooltip';

// Simple SVG sparkline component
function Sparkline({ data, color = '#3b82f6', height = 40 }) {
  // All hooks must be called before any conditional returns
  const { points, areaPath } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: '', areaPath: '' };
    }
    
    const values = data.map(d => d.count);
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    
    const width = 100;
    const xStep = width / Math.max(values.length - 1, 1);
    
    const pointsStr = values.map((val, i) => {
      const x = i * xStep;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    }).join(' ');
    
    // Calculate area path
    let area = '';
    if (pointsStr) {
      const pointsArray = pointsStr.split(' ');
      if (pointsArray.length >= 2) {
        const firstPoint = pointsArray[0].split(',');
        const lastPoint = pointsArray[pointsArray.length - 1].split(',');
        area = `M ${firstPoint[0]},${height} L ${pointsStr} L ${lastPoint[0]},${height} Z`;
      }
    }
    
    return { points: pointsStr, areaPath: area };
  }, [data, height]);
  
  // Now safe to do conditional return
  if (!data || data.length === 0) {
    return null;
  }
  
  return (
    <div className={styles.sparklineContainer}>
      <svg 
        viewBox={`0 0 100 ${height}`} 
        className={styles.sparkline}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`sparklineGradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path
          d={areaPath}
          fill={`url(#sparklineGradient-${color.replace('#', '')})`}
        />
        
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* End point dot */}
        {points && (
          <circle
            cx={points.split(' ').pop()?.split(',')[0]}
            cy={points.split(' ').pop()?.split(',')[1]}
            r="3"
            fill={color}
          />
        )}
      </svg>
      
      {/* Period labels */}
      {data && data.length > 0 && (
        <div className={styles.sparklineLabels}>
          <span>{data[0].count}</span>
          <span>{data[data.length - 1].count}</span>
        </div>
      )}
    </div>
  );
}

// Trend indicator arrow
function TrendIndicator({ value, suffix = '%' }) {
  if (value === null || value === undefined) return null;
  
  const isPositive = value > 0;
  const isNeutral = value === 0;
  
  return (
    <span className={`${styles.trend} ${isPositive ? styles.trendUp : isNeutral ? styles.trendNeutral : styles.trendDown}`}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        {isPositive ? (
          <path d="M18 15l-6-6-6 6" />
        ) : isNeutral ? (
          <path d="M5 12h14" />
        ) : (
          <path d="M6 9l6 6 6-6" />
        )}
      </svg>
      {Math.abs(value)}{suffix}
    </span>
  );
}

export function KPICard({
  label,
  value,
  valuePrefix = '',
  valueSuffix = '',
  interpretation,
  subtext,     // Optional small secondary text below interpretation
  sparklineData,
  sparklineColor,
  trend,
  trendSuffix = '%',
  icon,
  loading = false,
  compact = false,
  tooltip,  // { label: string, description: string } or metric key from METRIC_DEFINITIONS
}) {
  if (loading) {
    return (
      <div className={`${styles.card} ${styles.loading} ${compact ? styles.compact : ''}`}>
        <div className={styles.header}>
          <div className={styles.skeletonIcon} />
          <div className={styles.skeletonLabel} />
        </div>
        <div className={styles.skeletonValue} />
        {!compact && <div className={styles.skeletonInterpretation} />}
        {!compact && <div className={styles.skeletonSparkline} />}
      </div>
    );
  }
  
  return (
    <div className={`${styles.card} ${compact ? styles.compact : ''}`}>
      <div className={styles.header}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.label}>
          {tooltip ? (
            <Tooltip 
              metric={typeof tooltip === 'string' ? tooltip : undefined}
              customLabel={typeof tooltip === 'object' ? tooltip.label : undefined}
              customDescription={typeof tooltip === 'object' ? tooltip.description : undefined}
            >
              {label}
            </Tooltip>
          ) : label}
        </span>
        {trend !== undefined && trend !== null && (
          <TrendIndicator value={trend} suffix={trendSuffix} />
        )}
      </div>
      
      <div className={styles.valueContainer}>
        <span className={styles.value}>
          {valuePrefix}{typeof value === 'number' ? value.toLocaleString() : value}{valueSuffix}
        </span>
      </div>
      
      {interpretation && (
        <p className={styles.interpretation}>{interpretation}</p>
      )}
      
      {subtext && (
        <p className={styles.subtext}>{subtext}</p>
      )}
      
      {!compact && sparklineData && sparklineData.length > 0 && (
        <Sparkline 
          data={sparklineData} 
          color={sparklineColor || '#3b82f6'} 
        />
      )}
    </div>
  );
}

export default KPICard;
