'use client';

/**
 * Retention Metrics Component
 * 
 * Displays D1, D7, D30 retention rates with trend visualization.
 * 
 * Per data visualization rules:
 * - Progress rings for goal-based metrics (Rule 1.1)
 * - Interpretive title (Rule 4.1)
 * - Horizontal bars for engagement funnel (Rule 1.1)
 */

import { useMemo } from 'react';
import styles from './RetentionMetrics.module.css';

// Generate interpretive title based on retention data (Rule 4.1)
function generateInterpretiveTitle(retention) {
  if (!retention?.current) return 'No retention data yet';
  
  const { d7, d30, mau } = retention.current;
  const d30Rate = parseFloat(d30?.rate || 0);
  const d7Rate = parseFloat(d7?.rate || 0);
  
  if (d30Rate >= 50) {
    return `Strong retention: ${d30Rate}% of users active after 30 days`;
  } else if (d7Rate >= 50) {
    return `${d7Rate}% of users return within a week, ${mau || 0} monthly active`;
  } else if (mau > 0) {
    return `${mau} monthly active users with ${d30Rate}% long-term retention`;
  }
  return `Building user base — tracking retention across ${retention.current?.d1?.cohortSize || 0} users`;
}

function RetentionRing({ label, rate, cohortSize, retained, color }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (parseFloat(rate) / 100) * circumference;
  
  return (
    <div className={styles.ringContainer}>
      <svg className={styles.ringSvg} viewBox="0 0 80 80">
        <circle
          className={styles.ringBg}
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="6"
        />
        <circle
          className={styles.ringFill}
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ stroke: color }}
        />
        <text x="40" y="36" className={styles.ringValue}>
          {rate}%
        </text>
        <text x="40" y="50" className={styles.ringLabel}>
          {label}
        </text>
      </svg>
      <div className={styles.ringMeta}>
        <span>{retained}/{cohortSize}</span>
      </div>
    </div>
  );
}

function FunnelBar({ label, count, total, percentage }) {
  return (
    <div className={styles.funnelItem}>
      <div className={styles.funnelHeader}>
        <span className={styles.funnelLabel}>{label}</span>
        <span className={styles.funnelCount}>{count}</span>
      </div>
      <div className={styles.funnelBarBg}>
        <div 
          className={styles.funnelBarFill} 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={styles.funnelPercentage}>{percentage}%</span>
    </div>
  );
}

export function RetentionMetrics({ retention, loading = false }) {
  // Generate interpretive title
  const interpretiveTitle = useMemo(() => {
    return generateInterpretiveTitle(retention);
  }, [retention]);
  
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Calculating retention...</h3>
        </div>
        <div className={styles.loading}>Analyzing user cohorts</div>
      </div>
    );
  }
  
  if (!retention) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>No retention data yet</h3>
        </div>
        <div className={styles.emptyState}>Retention metrics will appear as users return</div>
      </div>
    );
  }
  
  const { current, funnel } = retention;
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{interpretiveTitle}</h3>
        <span className={styles.subtitle}>User Retention & Engagement</span>
      </div>
      
      {/* Retention Rings */}
      <div className={styles.retentionSection}>
        <h4 className={styles.sectionTitle}>Retention Rates</h4>
        <div className={styles.ringsRow}>
          <RetentionRing 
            label="D1"
            rate={current?.d1?.rate || 0}
            cohortSize={current?.d1?.cohortSize || 0}
            retained={current?.d1?.retained || 0}
            color="#22c55e"
          />
          <RetentionRing 
            label="D7"
            rate={current?.d7?.rate || 0}
            cohortSize={current?.d7?.cohortSize || 0}
            retained={current?.d7?.retained || 0}
            color="#3b82f6"
          />
          <RetentionRing 
            label="D30"
            rate={current?.d30?.rate || 0}
            cohortSize={current?.d30?.cohortSize || 0}
            retained={current?.d30?.retained || 0}
            color="#8b5cf6"
          />
        </div>
        
        {/* Active Users */}
        <div className={styles.activeUsers}>
          <div className={styles.activeUserItem}>
            <span className={styles.activeLabel}>DAU</span>
            <span className={styles.activeValue}>{current?.dau || 0}</span>
          </div>
          <div className={styles.activeUserItem}>
            <span className={styles.activeLabel}>WAU</span>
            <span className={styles.activeValue}>{current?.wau || 0}</span>
          </div>
          <div className={styles.activeUserItem}>
            <span className={styles.activeLabel}>MAU</span>
            <span className={styles.activeValue}>{current?.mau || 0}</span>
          </div>
        </div>
      </div>
      
      {/* Engagement Funnel */}
      <div className={styles.funnelSection}>
        <h4 className={styles.sectionTitle}>Engagement Funnel</h4>
        <div className={styles.funnelList}>
          <FunnelBar 
            label="Signed Up"
            count={funnel?.totalUsers || 0}
            total={funnel?.totalUsers || 1}
            percentage={100}
          />
          <FunnelBar 
            label="Used AL Assistant"
            count={funnel?.usersWithAL || 0}
            total={funnel?.totalUsers || 1}
            percentage={funnel?.conversionRates?.al || 0}
          />
          <FunnelBar 
            label="Added Favorites"
            count={funnel?.usersWithFavorites || 0}
            total={funnel?.totalUsers || 1}
            percentage={funnel?.conversionRates?.favorites || 0}
          />
          <FunnelBar 
            label="Created Projects"
            count={funnel?.usersWithProjects || 0}
            total={funnel?.totalUsers || 1}
            percentage={funnel?.conversionRates?.projects || 0}
          />
          <FunnelBar 
            label="Added Vehicles"
            count={funnel?.usersWithVehicles || 0}
            total={funnel?.totalUsers || 1}
            percentage={funnel?.conversionRates?.vehicles || 0}
          />
        </div>
      </div>
    </div>
  );
}

export default RetentionMetrics;

