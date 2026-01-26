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

import { Icons } from '@/components/ui/Icons';
import { GOAL_CATEGORY_MAP } from '@/lib/upgradeCategories';

import styles from './BuildGuidanceCard.module.css';

// Local icons for trust signals with YouTube and chart that don't exist in shared lib
const LocalIcons = {
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
  alert: Icons.alertTriangle,
  parts: Icons.settings,
  sparkles: Icons.sparkles,
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
          <LocalIcons.sparkles size={20} />
          <p>Select a build goal above to see tailored guidance for your {car?.name}.</p>
        </div>
      </div>
    );
  }
  
  // Build trust signal badges (only for data that exists)
  const trustBadges = [];
  
  if (youtubeVideoCount > 0) {
    trustBadges.push({
      icon: <LocalIcons.youtube size={12} />,
      text: `${youtubeVideoCount} expert videos`,
      type: 'youtube',
    });
  }
  
  if (dynoRunCount > 0) {
    trustBadges.push({
      icon: <LocalIcons.chart size={12} />,
      text: `${dynoRunCount} dyno runs`,
      type: 'dyno',
    });
  }
  
  // Issues are always available (100% coverage)
  if (issueCount > 0) {
    trustBadges.push({
      icon: <LocalIcons.alert size={12} />,
      text: `${issueCount} issues documented`,
      type: 'issues',
    });
  }
  
  if (fitmentCount >= 5) {
    trustBadges.push({
      icon: <LocalIcons.parts size={12} />,
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
          <p>Browse upgrade categories below for personalized recommendations.</p>
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
