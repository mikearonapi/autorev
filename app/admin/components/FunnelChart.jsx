'use client';

/**
 * FunnelChart Component
 * 
 * Horizontal funnel visualization for conversion stages.
 * Shows count and conversion rate at each stage.
 */

import { useMemo } from 'react';
import styles from './FunnelChart.module.css';

const STAGE_COLORS = {
  signups: { bg: '#3b82f6', fill: 'rgba(59, 130, 246, 0.15)' },
  activeUsers: { bg: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.15)' },
  alUsers: { bg: '#06b6d4', fill: 'rgba(6, 182, 212, 0.15)' },
  paid: { bg: '#22c55e', fill: 'rgba(34, 197, 94, 0.15)' },
};

const STAGE_LABELS = {
  signups: 'Total Signups',
  activeUsers: 'Active (7d)',
  alUsers: 'AL Users',
  paid: 'Paid (Projected)',
};

export function FunnelChart({ funnel, title = 'Conversion Funnel' }) {
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
  
  if (!funnel) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.emptyState}>No funnel data available</div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      
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

