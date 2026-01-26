'use client';

/**
 * WeeklyPointsSummary Component
 * 
 * Simplified points-focused hero card showing:
 * - Weekly points as the hero number
 * - Streak badge
 * - Weekly/monthly/lifetime breakdown
 * - "earn points" link to open points explainer
 */

import { useEffect, useState } from 'react';

import { FlameIcon } from './DashboardIcons';
import PointsExplainerModal from './PointsExplainerModal';
import styles from './WeeklyPointsSummary.module.css';

export default function WeeklyPointsSummary({
  points = { weekly: 0, monthly: 0, lifetime: 0 },
  currentStreak = 0,
  animated = true,
}) {
  const [animatedWeeklyPoints, setAnimatedWeeklyPoints] = useState(animated ? 0 : points.weekly);
  const [showExplainer, setShowExplainer] = useState(false);

  // Animate weekly points count-up
  useEffect(() => {
    if (!animated || points.weekly === 0) {
      setAnimatedWeeklyPoints(points.weekly);
      return;
    }

    const duration = 1200;
    const startTime = Date.now();
    const startValue = 0;

    const animatePoints = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedWeeklyPoints(Math.round(startValue + (points.weekly - startValue) * eased));

      if (progress < 1) requestAnimationFrame(animatePoints);
    };

    requestAnimationFrame(animatePoints);
  }, [points.weekly, animated]);

  // Format points for display
  const formatPoints = (pts) => {
    if (pts >= 1000) {
      return (pts / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return pts.toLocaleString();
  };

  return (
    <div className={styles.container}>
      {/* Main content row */}
      <div className={styles.mainRow}>
        {/* Center - Hero points */}
        <div className={styles.heroSection}>
          <span className={styles.heroValue}>{formatPoints(animatedWeeklyPoints)}</span>
          <span className={styles.heroLabel}>this week</span>
        </div>

        {/* Streak badge */}
        {currentStreak > 0 && (
          <div className={styles.streakBadge}>
            <FlameIcon size={14} />
            <span className={styles.streakCount}>{currentStreak}</span>
            <span className={styles.streakUnit}>wk</span>
          </div>
        )}
      </div>

      {/* Points breakdown row */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatPoints(points.weekly)}</span>
          <span className={styles.statLabel}>weekly</span>
        </div>
        <span className={styles.statDivider}>·</span>
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatPoints(points.monthly)}</span>
          <span className={styles.statLabel}>monthly</span>
        </div>
        <span className={styles.statDivider}>·</span>
        <div className={styles.stat}>
          <span className={styles.statValue}>{formatPoints(points.lifetime)}</span>
          <span className={styles.statLabel}>lifetime</span>
        </div>
      </div>

      {/* Earn points link */}
      <button 
        className={styles.earnPointsLink}
        onClick={() => setShowExplainer(true)}
        aria-label="Learn how to earn points"
      >
        earn points
      </button>

      {/* Points Explainer Modal */}
      <PointsExplainerModal 
        isOpen={showExplainer} 
        onClose={() => setShowExplainer(false)} 
      />
    </div>
  );
}
