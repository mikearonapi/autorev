'use client';

/**
 * ActivityRings Component
 * 
 * Apple-style concentric activity rings showing weekly usage across 4 features:
 * - AL (outer ring) - AI assistant usage
 * - Community (second ring) - Social engagement  
 * - Data (third ring) - Track/performance logging
 * - Garage (inner ring) - Vehicle management
 * 
 * Features:
 * - Total points displayed in center
 * - Weekly streak badge positioned top-right
 * - Info button to open points explainer
 */

import { useEffect, useState } from 'react';
import { FlameIcon, InfoIcon } from './DashboardIcons';
import PointsExplainerModal from './PointsExplainerModal';
import styles from './ConcentricRings.module.css';

// Ring configuration - outer to inner
const RINGS = [
  { key: 'al', label: 'AL', color: '#a855f7', maxWeekly: 30 },
  { key: 'community', label: 'Community', color: '#3b82f6', maxWeekly: 20 },
  { key: 'data', label: 'Data', color: '#10b981', maxWeekly: 15 },
  { key: 'garage', label: 'Garage', color: '#d4ff00', maxWeekly: 10 },
];

export default function ConcentricRings({
  weeklyActivity = { al: 0, community: 0, data: 0, garage: 0 },
  currentStreak = 0,
  longestStreak = 0,
  garageScore = 0,
  points = { weekly: 0, monthly: 0, lifetime: 0 },
  size = 180,
  animated = true,
}) {
  const [animatedProgress, setAnimatedProgress] = useState(
    animated ? { al: 0, community: 0, data: 0, garage: 0 } : weeklyActivity
  );
  const [animatedGarageScore, setAnimatedGarageScore] = useState(animated ? 0 : garageScore);
  const [animatedWeeklyPoints, setAnimatedWeeklyPoints] = useState(animated ? 0 : points.weekly);
  const [showExplainer, setShowExplainer] = useState(false);

  // Animate activity rings (AL, Community, Data, and fallback Garage activity)
  useEffect(() => {
    if (!animated) {
      setAnimatedProgress(weeklyActivity);
      return;
    }

    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedProgress({
        al: weeklyActivity.al * eased,
        community: weeklyActivity.community * eased,
        data: weeklyActivity.data * eased,
        garage: weeklyActivity.garage * eased,
      });

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [weeklyActivity, animated]);

  // Animate garage score (inner ring) - separate animation for the garage percentage
  useEffect(() => {
    if (!animated) {
      setAnimatedGarageScore(garageScore);
      return;
    }

    const duration = 1000;
    const startTime = Date.now();
    const startValue = 0; // Always animate from 0 for visual effect

    const animateGarage = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic

      setAnimatedGarageScore(startValue + (garageScore - startValue) * eased);

      if (progress < 1) requestAnimationFrame(animateGarage);
    };

    requestAnimationFrame(animateGarage);
  }, [garageScore, animated]);

  // Animate weekly points count-up
  useEffect(() => {
    if (!animated || points.weekly === 0) {
      setAnimatedWeeklyPoints(points.weekly);
      return;
    }

    const duration = 1200;
    const startTime = Date.now();
    const startValue = animatedWeeklyPoints;

    const animatePoints = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedWeeklyPoints(Math.round(startValue + (points.weekly - startValue) * eased));

      if (progress < 1) requestAnimationFrame(animatePoints);
    };

    requestAnimationFrame(animatePoints);
  }, [points.weekly, animated]);

  // Ring dimensions - each ring is progressively smaller
  const strokeWidth = 10;
  const gap = 4;
  const ringSpacing = strokeWidth + gap;

  // Calculate ring properties
  const getRingProps = (index) => {
    const radius = (size / 2) - (strokeWidth / 2) - (index * ringSpacing);
    const circumference = 2 * Math.PI * radius;
    return { radius, circumference };
  };

  // Calculate fill percentage for each ring
  const getProgress = (key) => {
    const ring = RINGS.find(r => r.key === key);
    if (!ring) return 0;
    
    // For garage, use animated garage score as percentage (0-100)
    if (key === 'garage') {
      return Math.min(animatedGarageScore, 100);
    }
    
    // For activity rings, calculate based on maxWeekly
    const value = animatedProgress[key] || 0;
    return Math.min((value / ring.maxWeekly) * 100, 100);
  };

  // Format points for display (e.g., 1,234)
  const formatPoints = (pts) => {
    if (pts >= 1000) {
      return (pts / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return pts.toLocaleString();
  };

  return (
    <div className={styles.wrapper}>
      {/* Left side - Info button */}
      <div className={styles.leftControls}>
        <button 
          className={styles.infoButton}
          onClick={() => setShowExplainer(true)}
          aria-label="How to earn points"
        >
          <InfoIcon size={16} />
        </button>
      </div>

      {/* Center - Rings with weekly points */}
      <div className={styles.ringsContainer}>
        <div className={styles.container} style={{ width: size, height: size }}>
          <svg 
            width={size} 
            height={size} 
            viewBox={`0 0 ${size} ${size}`} 
            className={styles.svg}
          >
            {RINGS.map((ring, index) => {
              const { radius, circumference } = getRingProps(index);
              const progress = getProgress(ring.key);
              const offset = circumference - (progress / 100) * circumference;
              
              return (
                <g key={ring.key}>
                  {/* Background ring */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`${ring.color}15`}
                    strokeWidth={strokeWidth}
                  />
                  
                  {/* Progress ring */}
                  <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className={styles.ringProgress}
                    style={{ filter: progress > 0 ? `drop-shadow(0 0 4px ${ring.color}40)` : 'none' }}
                  />
                </g>
              );
            })}
          </svg>

          {/* Center - Weekly Points display */}
          <div className={styles.center}>
            <div className={styles.pointsDisplay}>
              <span className={styles.pointsValue}>{formatPoints(animatedWeeklyPoints)}</span>
              <span className={styles.pointsLabel}>this week</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          {RINGS.map((ring) => (
            <div key={ring.key} className={styles.legendItem}>
              <span 
                className={styles.legendDot} 
                style={{ background: ring.color }}
              />
              <span className={styles.legendLabel}>{ring.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Streak and Points Stats */}
      <div className={styles.rightControls}>
        {/* Streak badge */}
        {currentStreak > 0 && (
          <div className={styles.streakBadge}>
            <FlameIcon size={14} />
            <span className={styles.streakCount}>{currentStreak}</span>
            <span className={styles.streakUnit}>wk</span>
          </div>
        )}
        
        {/* Points breakdown */}
        <div className={styles.pointsStats}>
          <div className={styles.pointsStat}>
            <span className={styles.pointsStatValue}>{formatPoints(points.weekly)}</span>
            <span className={styles.pointsStatLabel}>weekly</span>
          </div>
          <div className={styles.pointsStat}>
            <span className={styles.pointsStatValue}>{formatPoints(points.monthly)}</span>
            <span className={styles.pointsStatLabel}>monthly</span>
          </div>
          <div className={styles.pointsStat}>
            <span className={styles.pointsStatValue}>{formatPoints(points.lifetime)}</span>
            <span className={styles.pointsStatLabel}>lifetime</span>
          </div>
        </div>
      </div>

      {/* Points Explainer Modal */}
      <PointsExplainerModal 
        isOpen={showExplainer} 
        onClose={() => setShowExplainer(false)} 
      />
    </div>
  );
}
