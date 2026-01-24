'use client';

/**
 * GarageHealthRing Component
 * 
 * Whoop-inspired circular gauge showing overall garage health.
 * Displays a ring with progress, center stat, and supporting metrics.
 */

import styles from './GarageHealthRing.module.css';

export default function GarageHealthRing({ 
  score = 0, 
  label = 'GARAGE HEALTH',
  stats = []
}) {
  // Calculate stroke dash for the ring
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(score, 100) / 100;
  const strokeDashoffset = circumference * (1 - progress);
  
  // Determine color based on score
  const getScoreColor = (s) => {
    if (s >= 70) return '#10b981'; // Teal - good
    if (s >= 40) return '#f59e0b'; // Amber - needs attention
    return '#64748b'; // Gray - low
  };
  
  const scoreColor = getScoreColor(score);

  return (
    <div className={styles.container}>
      <div className={styles.ringContainer}>
        <svg 
          className={styles.ring} 
          viewBox="0 0 180 180"
          aria-label={`Garage health score: ${score}`}
        >
          {/* Background ring */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 90 90)"
            className={styles.progressRing}
          />
          {/* Glow effect */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 90 90)"
            opacity="0.2"
            filter="blur(4px)"
          />
        </svg>
        
        <div className={styles.centerContent}>
          <span className={styles.scoreValue}>{score}</span>
          <span className={styles.scoreLabel}>{label}</span>
        </div>
      </div>
      
      {stats.length > 0 && (
        <div className={styles.stats}>
          {stats.map((stat, index) => (
            <div key={index} style={{ display: 'contents' }}>
              <div className={styles.stat}>
                <span className={styles.statValue} style={{ color: stat.color }}>{stat.value}</span>
                <span className={styles.statLabel}>{stat.label}</span>
              </div>
              {index < stats.length - 1 && <div className={styles.statDivider} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

