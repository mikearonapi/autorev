'use client';

import { useState, useEffect } from 'react';

import { getStreakStatus, getStreakDisplayInfo, STREAK_MILESTONES } from '@/lib/engagementService';

import { useAuth } from './providers/AuthProvider';
import styles from './StreakIndicator.module.css';

/**
 * StreakIndicator Component
 * 
 * Displays the user's current streak with a flame icon and count.
 * Shows "at risk" state when the streak is about to expire.
 * Includes a tooltip with streak details.
 */
export default function StreakIndicator({ compact = false, showTooltip = true }) {
  const { user, isAuthenticated } = useAuth();
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setLoading(false);
      return;
    }

    fetchStreakData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  const fetchStreakData = async () => {
    try {
      const { data, error } = await getStreakStatus(user.id);
      if (!error && data) {
        setStreakData(data);
      }
    } catch (err) {
      console.error('Error fetching streak:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || loading) {
    return null;
  }

  if (!streakData || streakData.currentStreak === 0) {
    if (compact) return null;
    return (
      <div className={styles.container}>
        <div className={styles.noStreak}>
          <span className={styles.icon}>💤</span>
          <span className={styles.label}>Start your streak!</span>
        </div>
      </div>
    );
  }

  const displayInfo = getStreakDisplayInfo(streakData.currentStreak);
  const isAtRisk = streakData.isAtRisk;

  return (
    <div 
      className={`${styles.container} ${isAtRisk ? styles.atRisk : ''} ${compact ? styles.compact : ''}`}
      onMouseEnter={() => showTooltip && setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      <div className={styles.streakBadge} style={{ '--streak-color': displayInfo.color }}>
        <span className={`${styles.icon} ${isAtRisk ? styles.iconPulse : ''}`}>
          {displayInfo.icon}
        </span>
        <span className={styles.count}>{streakData.currentStreak}</span>
        {!compact && <span className={styles.label}>day streak</span>}
      </div>

      {isAtRisk && !compact && (
        <div className={styles.atRiskBanner}>
          <span className={styles.atRiskIcon}>⚠️</span>
          <span className={styles.atRiskText}>
            {streakData.hoursRemaining <= 2 
              ? `Expires in ${streakData.hoursRemaining}h!` 
              : `${streakData.hoursRemaining}h left today`}
          </span>
        </div>
      )}

      {showDetails && showTooltip && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipHeader}>
            <span className={styles.tooltipIcon}>{displayInfo.icon}</span>
            <div>
              <div className={styles.tooltipTitle}>{displayInfo.label}</div>
              <div className={styles.tooltipMessage}>{displayInfo.message}</div>
            </div>
          </div>
          
          <div className={styles.tooltipStats}>
            <div className={styles.tooltipStat}>
              <span className={styles.statLabel}>Current</span>
              <span className={styles.statValue}>{streakData.currentStreak} days</span>
            </div>
            <div className={styles.tooltipStat}>
              <span className={styles.statLabel}>Longest</span>
              <span className={styles.statValue}>{streakData.longestStreak} days</span>
            </div>
            {streakData.nextMilestone && (
              <div className={styles.tooltipStat}>
                <span className={styles.statLabel}>Next milestone</span>
                <span className={styles.statValue}>
                  {streakData.nextMilestone} days ({streakData.daysToNextMilestone} to go)
                </span>
              </div>
            )}
          </div>

          {streakData.isFrozen && (
            <div className={styles.frozenBadge}>
              ❄️ Streak frozen until {new Date(streakData.frozenUntil).toLocaleDateString()}
            </div>
          )}

          {isAtRisk && (
            <div className={styles.atRiskTooltip}>
              <span>⚠️</span>
              <span>Visit today to keep your streak!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * StreakProgress Component
 * Shows progress toward the next milestone
 */
export function StreakProgress({ currentStreak, nextMilestone }) {
  if (!nextMilestone) return null;
  
  const prevMilestone = STREAK_MILESTONES[STREAK_MILESTONES.indexOf(nextMilestone) - 1] || 0;
  const progress = ((currentStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100;

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill} 
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      <div className={styles.progressLabels}>
        <span>{currentStreak}</span>
        <span>{nextMilestone} day milestone</span>
      </div>
    </div>
  );
}
