'use client';

/**
 * BuildGuidanceCard Component
 * 
 * Displays guidance for a build based on the selected goal.
 * CRITICAL: Only shows trust signals for data that ACTUALLY EXISTS for this car.
 * 
 * Trust signals shown conditionally:
 * - YouTube videos (if youtube_video_count > 0)
 * - Dyno runs (if dynoRunCount > 0)
 * - Issues (ALWAYS - 100% coverage)
 * - Part fitments (if fitmentCount >= 5)
 * - Platform strengths/weaknesses (if data exists)
 * 
 * @module components/garage/BuildGuidanceCard
 */

import React from 'react';
import styles from './BuildGuidanceCard.module.css';
import { GOAL_CATEGORY_MAP } from '@/lib/upgradeCategories';

// Icons for trust signals
const Icons = {
  youtube: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
    </svg>
  ),
  chart: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/>
      <path d="M18 17V9"/>
      <path d="M13 17V5"/>
      <path d="M8 17v-3"/>
    </svg>
  ),
  alert: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  parts: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  sparkles: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
      <path d="M5 15l.5 1.5L7 17l-1.5.5L5 19l-.5-1.5L3 17l1.5-.5L5 15z"/>
      <path d="M19 12l.5 1.5L21 14l-1.5.5L19 16l-.5-1.5L17 14l1.5-.5L19 12z"/>
    </svg>
  ),
};

/**
 * BuildGuidanceCard - Conditional trust signals and guidance
 * 
 * @param {Object} props
 * @param {Object} props.car - Car data
 * @param {Object} props.tuningProfile - Tuning profile from car_tuning_profiles
 * @param {string} props.goal - Build goal (track, street, show, daily)
 * @param {number} [props.dynoRunCount] - Number of dyno runs for this car
 * @param {number} [props.issueCount] - Number of documented issues
 * @param {number} [props.fitmentCount] - Number of verified part fitments
 * @param {function} [props.onAskAL] - Callback to open AL chat
 */
export default function BuildGuidanceCard({ 
  car, 
  tuningProfile, 
  goal,
  dynoRunCount = 0,
  issueCount = 0,
  fitmentCount = 0,
  onAskAL,
}) {
  const goalInfo = goal ? GOAL_CATEGORY_MAP[goal] : null;
  
  // Extract data availability flags
  const hasUpgradeData = tuningProfile?.upgrades_by_objective && 
    Object.values(tuningProfile.upgrades_by_objective).some(arr => arr?.length > 0);
  const hasStrengths = tuningProfile?.platform_insights?.strengths?.length > 0;
  const hasWeaknesses = tuningProfile?.platform_insights?.weaknesses?.length > 0;
  const hasCommunityTips = tuningProfile?.platform_insights?.community_tips?.length > 0;
  const hasYouTubeInsights = tuningProfile?.platform_insights?.youtube_insights?.key_points?.length > 0;
  const youtubeVideoCount = tuningProfile?.platform_insights?.youtube_insights?.youtube_video_count || 0;
  
  // If no goal set, show a minimal prompt
  if (!goal) {
    return (
      <div className={styles.card}>
        <div className={styles.fallback}>
          <Icons.sparkles size={20} />
          <p>Select a build goal above to see tailored guidance for your {car?.name}.</p>
        </div>
      </div>
    );
  }
  
  // Build trust signal badges (only for data that exists)
  const trustBadges = [];
  
  if (youtubeVideoCount > 0) {
    trustBadges.push({
      icon: <Icons.youtube size={12} />,
      text: `${youtubeVideoCount} expert videos`,
      type: 'youtube',
    });
  }
  
  if (dynoRunCount > 0) {
    trustBadges.push({
      icon: <Icons.chart size={12} />,
      text: `${dynoRunCount} dyno runs`,
      type: 'dyno',
    });
  }
  
  // Issues are always available (100% coverage)
  if (issueCount > 0) {
    trustBadges.push({
      icon: <Icons.alert size={12} />,
      text: `${issueCount} issues documented`,
      type: 'issues',
    });
  }
  
  if (fitmentCount >= 5) {
    trustBadges.push({
      icon: <Icons.parts size={12} />,
      text: `${fitmentCount} verified parts`,
      type: 'parts',
    });
  }
  
  // If we have weaknesses, show them as priorities (but styled as opportunities, not warnings)
  const priorities = hasWeaknesses 
    ? tuningProfile.platform_insights.weaknesses.slice(0, 3)
    : [];
  
  // If we have very little data, show fallback with AL prompt
  const hasMinimalData = !hasUpgradeData && !hasWeaknesses && !hasStrengths;
  
  if (hasMinimalData) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.headerLabel}>For Your Goal: {goalInfo?.label || goal.toUpperCase()}</span>
        </div>
        
        {trustBadges.length > 0 && (
          <div className={styles.badges}>
            {trustBadges.map((badge, i) => (
              <span key={i} className={`${styles.badge} ${styles[badge.type]}`}>
                {badge.icon}
                {badge.text}
              </span>
            ))}
          </div>
        )}
        
        <div className={styles.fallback}>
          <p>We're still gathering detailed tuning data for the {car?.name}.</p>
          <p>Browse upgrade categories below, or ask AL for personalized recommendations.</p>
          {onAskAL && (
            <button className={styles.askAlBtn} onClick={onAskAL}>
              <Icons.sparkles size={14} />
              Ask AL for recommendations
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.headerLabel}>For Your Goal: {goalInfo?.label || goal.toUpperCase()}</span>
      </div>
      
      {/* Trust signal badges */}
      {trustBadges.length > 0 && (
        <div className={styles.badges}>
          {trustBadges.map((badge, i) => (
            <span key={i} className={`${styles.badge} ${styles[badge.type]}`}>
              {badge.icon}
              {badge.text}
            </span>
          ))}
        </div>
      )}
      
      {/* Platform strengths (positive) */}
      {hasStrengths && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Platform Strengths</span>
          <ul className={styles.strengthsList}>
            {tuningProfile.platform_insights.strengths.slice(0, 3).map((strength, i) => (
              <li key={i} className={styles.strengthItem}>
                <span className={styles.strengthBullet}>✓</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Top priorities (from weaknesses, framed as opportunities) */}
      {priorities.length > 0 && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Top Priorities for {car?.name?.split(' ').slice(-2).join(' ')}</span>
          <div className={styles.prioritiesList}>
            {priorities.map((priority, i) => (
              <div key={i} className={styles.priorityItem}>
                <span className={styles.priorityNumber}>{i + 1}</span>
                <span className={styles.priorityText}>{priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Community tips if available */}
      {hasCommunityTips && (
        <div className={styles.section}>
          <span className={styles.sectionLabel}>Community Tips</span>
          <ul className={styles.tipsList}>
            {tuningProfile.platform_insights.community_tips.slice(0, 2).map((tip, i) => (
              <li key={i} className={styles.tipItem}>💡 {tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
