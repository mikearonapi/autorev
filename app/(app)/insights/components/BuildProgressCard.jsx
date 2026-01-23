'use client';

/**
 * BuildProgressCard Component
 * 
 * Shows build progress for a vehicle - comparing installed mods
 * with saved project plan. Whoop-inspired progress visualization.
 */

import Link from 'next/link';
import styles from './BuildProgressCard.module.css';

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const BoltIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

export default function BuildProgressCard({ build }) {
  const {
    vehicleId,
    vehicleName,
    projectName,
    progress,
    installedCount,
    totalPlanned,
    currentHpGain,
    targetHpGain,
    nextMod,
    status,
  } = build;
  
  // Determine visual style based on status
  const getStatusStyle = () => {
    if (status === 'complete') {
      return { color: '#10b981', label: 'Complete' };
    }
    if (status === 'in_progress') {
      return { color: '#10b981', label: 'In Progress' };
    }
    if (status === 'custom') {
      return { color: '#3b82f6', label: 'Custom Build' };
    }
    return { color: '#64748b', label: 'Planned' };
  };
  
  const statusStyle = getStatusStyle();
  const progressPercent = progress ?? 0;
  const hpProgress = targetHpGain > 0 
    ? Math.round((currentHpGain / targetHpGain) * 100)
    : null;
  
  return (
    <Link href={`/garage?vehicle=${vehicleId}`} className={styles.link}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.vehicleInfo}>
            <h3 className={styles.vehicleName}>{vehicleName}</h3>
            {projectName && (
              <span className={styles.projectName}>{projectName}</span>
            )}
          </div>
          <div 
            className={styles.statusBadge}
            style={{ 
              color: statusStyle.color,
              background: `${statusStyle.color}15`,
            }}
          >
            {statusStyle.label}
          </div>
        </div>
        
        {/* Progress Bar */}
        {progress !== null && (
          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ 
                  width: `${progressPercent}%`,
                  background: progressPercent >= 100 
                    ? '#10b981' 
                    : 'linear-gradient(90deg, #10b981, #22d3ee)',
                }}
              />
            </div>
            <div className={styles.progressStats}>
              <span className={styles.progressText}>
                {installedCount}/{totalPlanned} mods installed
              </span>
              <span className={styles.progressPercent}>{progressPercent}%</span>
            </div>
          </div>
        )}
        
        {/* HP Stats */}
        <div className={styles.hpSection}>
          <div className={styles.hpStat}>
            <span className={styles.hpLabel}>Current Gain</span>
            <span className={styles.hpValue} style={{ color: currentHpGain > 0 ? '#10b981' : '#64748b' }}>
              {currentHpGain > 0 ? (
                <>
                  <BoltIcon /> +{currentHpGain} HP
                </>
              ) : (
                '—'
              )}
            </span>
          </div>
          {targetHpGain > 0 && (
            <div className={styles.hpStat}>
              <span className={styles.hpLabel}>Target</span>
              <span className={styles.hpValue} style={{ color: '#3b82f6' }}>
                <BoltIcon /> +{targetHpGain} HP
              </span>
            </div>
          )}
        </div>
        
        {/* Next Mod Suggestion */}
        {nextMod && (
          <div className={styles.nextMod}>
            <span className={styles.nextModLabel}>Next Step</span>
            <div className={styles.nextModContent}>
              <span className={styles.nextModName}>{nextMod.name}</span>
              {nextMod.hpGain > 0 && (
                <span className={styles.nextModGain}>+{nextMod.hpGain} HP</span>
              )}
            </div>
          </div>
        )}
        
        <div className={styles.chevron}>
          <ChevronRight />
        </div>
      </div>
    </Link>
  );
}
