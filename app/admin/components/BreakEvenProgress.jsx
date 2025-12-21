'use client';

/**
 * BreakEvenProgress Component
 * 
 * Progress ring showing current users vs users needed for break-even.
 * Supports compact mode for sidebar display.
 * 
 * Per data visualization rules:
 * - Progress ring for goal-based metrics (Rule 1.1)
 * - Interpretive title (Rule 4.1)
 */

import { useMemo } from 'react';
import styles from './BreakEvenProgress.module.css';
import { InfoIcon } from './Icons';

// Generate interpretive title (Rule 4.1)
function generateInterpretiveTitle(breakEven) {
  if (!breakEven) return 'No break-even data yet';
  
  const { currentUsers, usersNeeded, progressPercent } = breakEven;
  const remaining = Math.max(usersNeeded - currentUsers, 0);
  
  if (progressPercent >= 100) {
    return 'Break-even achieved! 🎉';
  }
  if (progressPercent >= 75) {
    return `Almost there: ${remaining} user${remaining !== 1 ? 's' : ''} to break-even`;
  }
  if (progressPercent >= 25) {
    return `${progressPercent}% to break-even — ${remaining} user${remaining !== 1 ? 's' : ''} needed`;
  }
  return `Early stage: ${remaining} paying user${remaining !== 1 ? 's' : ''} to break-even`;
}

export function BreakEvenProgress({ breakEven, title = 'Path to Break-Even', compact = false }) {
  // Generate interpretive title
  const interpretiveTitle = useMemo(() => {
    return generateInterpretiveTitle(breakEven);
  }, [breakEven]);
  
  if (!breakEven) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <h3 className={styles.title}>No break-even data yet</h3>
        <div className={styles.emptyState}>Data will appear when costs are recorded</div>
      </div>
    );
  }
  
  const { currentUsers, usersNeeded, progressPercent } = breakEven;
  const usersRemaining = Math.max(usersNeeded - currentUsers, 0);
  
  // SVG progress ring calculations
  const size = compact ? 60 : 100;
  const strokeWidth = compact ? 4 : 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progressPercent / 100) * circumference;
  
  // Calculate color based on progress
  const getProgressColor = (percent) => {
    if (percent >= 75) return '#22c55e'; // Green
    if (percent >= 50) return '#06b6d4'; // Cyan
    if (percent >= 25) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };
  
  const progressColor = getProgressColor(progressPercent);
  
  // Compact mode: inline horizontal layout
  if (compact) {
    return (
      <div className={`${styles.container} ${styles.compact}`}>
        <h3 className={styles.title}>{interpretiveTitle}</h3>
        <span className={styles.subtitle}>Break-Even Progress</span>
        
        <div className={styles.compactContent}>
          <div className={styles.compactRing}>
            <svg 
              width={size} 
              height={size} 
              aria-label={`${progressPercent}% progress to break-even`}
            >
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={progressColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="14"
                fontWeight="700"
                fill="#f8fafc"
              >
                {progressPercent}%
              </text>
            </svg>
          </div>
          
          <div className={styles.compactStats}>
            <div className={styles.compactStatRow}>
              <span className={styles.compactLabel}>Current</span>
              <span className={styles.compactValue}>{currentUsers}</span>
            </div>
            <div className={styles.compactStatRow}>
              <span className={styles.compactLabel}>Needed</span>
              <span className={styles.compactValue}>{usersNeeded}</span>
            </div>
            <div className={styles.compactStatRow}>
              <span className={styles.compactLabel}>Remaining</span>
              <span className={`${styles.compactValue} ${styles.remaining}`}>{usersRemaining}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Full mode: larger ring with detailed layout
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{interpretiveTitle}</h3>
      <span className={styles.subtitle}>Break-Even Progress</span>
      
      <div className={styles.content}>
        <div className={styles.ringContainer}>
          <svg 
            width={size} 
            height={size} 
            className={styles.ring}
            aria-label={`${progressPercent}% progress to break-even`}
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth={strokeWidth}
            />
            
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={progressColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{
                transition: 'stroke-dashoffset 0.5s ease',
                filter: `drop-shadow(0 0 8px ${progressColor}40)`,
              }}
            />
            
            {/* Center text */}
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              className={styles.ringText}
            >
              <tspan 
                x="50%" 
                dy="-6" 
                fontSize="22" 
                fontWeight="700"
                fill="#f8fafc"
              >
                {progressPercent}%
              </tspan>
              <tspan 
                x="50%" 
                dy="18" 
                fontSize="10"
                fill="#64748b"
              >
                complete
              </tspan>
            </text>
          </svg>
        </div>
        
        <div className={styles.stats}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Current Users</span>
            <span className={styles.statValue}>{currentUsers.toLocaleString()}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Users Needed</span>
            <span className={styles.statValue}>{usersNeeded.toLocaleString()}</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Users Remaining</span>
            <span className={`${styles.statValue} ${styles.remaining}`}>{usersRemaining.toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      <div className={styles.assumption}>
        <div className={styles.assumptionIcon}>
          <InfoIcon size={14} />
        </div>
        <span className={styles.assumptionText}>
          Based on 10% conversion rate at $7.50/user blended ARPU
        </span>
      </div>
    </div>
  );
}

export default BreakEvenProgress;
