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
  totalVehicles = 0,
  totalHpGain = 0,
  totalMods = 0,
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
          <span className={styles.scoreLabel}>GARAGE HEALTH</span>
        </div>
      </div>
      
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{totalVehicles}</span>
          <span className={styles.statLabel}>Vehicles</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue} style={{ color: totalHpGain > 0 ? '#10b981' : undefined }}>
            {totalHpGain > 0 ? `+${totalHpGain}` : '—'}
          </span>
          <span className={styles.statLabel}>HP Gained</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>{totalMods}</span>
          <span className={styles.statLabel}>Mods</span>
        </div>
      </div>
    </div>
  );
}
