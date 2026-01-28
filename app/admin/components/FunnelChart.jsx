'use client';

/**
 * FunnelChart Component
 * 
 * Horizontal funnel visualization for conversion stages.
 * Shows count and conversion rate at each stage.
 * 
 * Per data visualization rules:
 * - Horizontal bars for category comparison (Rule 1.1)
 * - Single-hue progression for 3-4 categories (Rule 3.3)
 * - Interpretive title (Rule 4.1)
 */

import { useMemo } from 'react';

import styles from './FunnelChart.module.css';

// Single-hue blue progression for 4 categories (Rule 3.3)
const STAGE_COLORS = {
  signups: { bg: '#1d4ed8', fill: 'rgba(29, 78, 216, 0.15)' },     // blue-700
  activeUsers: { bg: '#2563eb', fill: 'rgba(37, 99, 235, 0.15)' }, // blue-600
  alUsers: { bg: '#3b82f6', fill: 'rgba(59, 130, 246, 0.15)' },    // blue-500
  paid: { bg: '#60a5fa', fill: 'rgba(96, 165, 250, 0.15)' },       // blue-400
};

const STAGE_LABELS = {
  signups: 'Total Signups',
  activeUsers: 'Active (7d)',
  alUsers: 'AL Users',
  paid: 'Paid (Projected)',
};

// Generate interpretive title based on funnel data (Rule 4.1)
function generateInterpretiveTitle(funnel) {
  if (!funnel) return 'No funnel data yet';
  
  const signupToActive = funnel.conversionRates?.signupToActive || 0;
  const activeToAL = funnel.conversionRates?.activeToAL || 0;
  
  if (signupToActive >= 50 && activeToAL >= 50) {
    return `Strong engagement: ${signupToActive}% become active, ${activeToAL}% use AL`;
  } else if (signupToActive > 0) {
    return `${signupToActive}% of ${funnel.signups} signups become active within 7 days`;
  }
  return `${funnel.signups} total signups tracked through conversion`;
}

export function FunnelChart({ funnel, title: _title = 'Conversion Funnel' }) {
  const stages = useMemo(() => {
    if (!funnel) return [];
    
    const maxValue = funnel.signups || 1;
    
    // Calculate projected paid users at 10% conversion
    const projectedPaid = Math.round((funnel.signups || 0) * 0.1);
    
    return [
      { key: 'signups', value: funnel.signups, rate: 100, label: STAGE_LABELS.signups },
      { 
        key: 'activeUsers', 
        value: funnel.activeUsers, 
        rate: funnel.conversionRates?.signupToActive || 0,
        label: STAGE_LABELS.activeUsers 
      },
      { 
        key: 'alUsers', 
        value: funnel.alUsers, 
        rate: funnel.conversionRates?.activeToAL || 0,
        label: STAGE_LABELS.alUsers 
      },
      { 
        key: 'paid', 
        value: projectedPaid, 
        rate: 10, // 10% target conversion
        label: STAGE_LABELS.paid,
        isProjected: true 
      },
    ].map(stage => ({
      ...stage,
      width: (stage.value / maxValue) * 100,
    }));
  }, [funnel]);
  
  // Generate interpretive title
  const interpretiveTitle = useMemo(() => {
    return generateInterpretiveTitle(funnel);
  }, [funnel]);
  
  if (!funnel) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>No funnel data available</h3>
        <div className={styles.emptyState}>Users will appear here once they sign up</div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{interpretiveTitle}</h3>
      <span className={styles.subtitle}>Conversion Funnel</span>
      
      <div className={styles.funnel}>
        {stages.map((stage, index) => (
          <div key={stage.key} className={styles.stage}>
            <div className={styles.stageHeader}>
              <span className={styles.stageLabel}>{stage.label}</span>
              {stage.isProjected && <span className={styles.projectedBadge}>Projected</span>}
            </div>
            
            <div className={styles.barContainer}>
              <div 
                className={styles.bar}
                style={{ 
                  width: `${Math.max(stage.width, 5)}%`,
                  background: `linear-gradient(90deg, ${STAGE_COLORS[stage.key]?.bg || '#3b82f6'}, ${STAGE_COLORS[stage.key]?.bg || '#3b82f6'}80)`,
                }}
              >
                <span className={styles.barValue}>{stage.value.toLocaleString()}</span>
              </div>
            </div>
            
            {index < stages.length - 1 && (
              <div className={styles.conversionRate}>
                <svg className={styles.arrow} viewBox="0 0 24 24" width="16" height="16">
                  <path 
                    d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" 
                    fill="currentColor"
                  />
                </svg>
                <span className={styles.rateValue}>{stages[index + 1].rate}%</span>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Summary stats */}
      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Signup → Active</span>
          <span className={styles.summaryValue}>{funnel.conversionRates?.signupToActive || 0}%</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Active → AL</span>
          <span className={styles.summaryValue}>{funnel.conversionRates?.activeToAL || 0}%</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Target Paid</span>
          <span className={styles.summaryValue}>10%</span>
        </div>
      </div>
    </div>
  );
}

export default FunnelChart;

