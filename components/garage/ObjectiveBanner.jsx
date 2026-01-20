'use client';

/**
 * ObjectiveBanner Component
 * 
 * Displays the active build goal and allows changing it.
 * Shows data coverage indicator for the current car.
 * 
 * @module components/garage/ObjectiveBanner
 */

import React, { useState } from 'react';
import styles from './ObjectiveBanner.module.css';
import { GOAL_CATEGORY_MAP } from '@/lib/upgradeCategories';

// Goal icons
const GOAL_ICONS = {
  track: '🏁',
  street: '🔥',
  show: '✨',
  daily: '🚗',
};

// Goal metadata
const GOALS = [
  { id: 'track', label: 'Track Ready', description: 'Optimized for lap times', icon: '🏁' },
  { id: 'street', label: 'Street Performance', description: 'Spirited driving capability', icon: '🔥' },
  { id: 'show', label: 'Show Car', description: 'Aesthetics and presence', icon: '✨' },
  { id: 'daily', label: 'Daily+', description: 'Reliable with upgrades', icon: '🚗' },
];

/**
 * ObjectiveBanner - Shows active goal with change option
 * 
 * @param {Object} props
 * @param {string|null} props.goal - Current goal (track, street, show, daily)
 * @param {function} props.onGoalChange - Callback when goal changes
 * @param {Object} [props.dataCoverage] - Optional data coverage info { tier, label }
 * @param {number} [props.upgradeProgress] - Number of recommended upgrades completed
 * @param {number} [props.totalRecommended] - Total recommended upgrades for goal
 */
export default function ObjectiveBanner({ 
  goal, 
  onGoalChange,
  dataCoverage = null,
  upgradeProgress = 0,
  totalRecommended = 0,
}) {
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  
  const goalInfo = goal ? GOAL_CATEGORY_MAP[goal] : null;
  const goalIcon = goal ? GOAL_ICONS[goal] : null;
  
  // If no goal is set, show a prompt to set one
  if (!goal) {
    return (
      <div className={styles.banner}>
        <div className={styles.noGoalPrompt}>
          <span className={styles.promptText}>Set a build goal to see prioritized upgrades</span>
          <div className={styles.goalQuickPicks}>
            {GOALS.map(g => (
              <button
                key={g.id}
                className={styles.goalPill}
                onClick={() => onGoalChange?.(g.id)}
                title={g.description}
              >
                <span className={styles.goalPillIcon}>{g.icon}</span>
                <span>{g.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.banner}>
      <div className={styles.goalDisplay}>
        <span className={styles.goalIcon}>{goalIcon}</span>
        <div className={styles.goalInfo}>
          <span className={styles.goalLabel}>{goalInfo?.label || goal.toUpperCase()}</span>
          {totalRecommended > 0 && (
            <span className={styles.progressText}>
              {upgradeProgress} of {totalRecommended} recommended upgrades
            </span>
          )}
        </div>
      </div>
      
      <div className={styles.actions}>
        {dataCoverage && (
          <span className={`${styles.dataBadge} ${styles[`tier${dataCoverage.tier}`]}`}>
            {dataCoverage.label}
          </span>
        )}
        <button 
          className={styles.changeBtn}
          onClick={() => setShowGoalPicker(!showGoalPicker)}
        >
          Change
        </button>
      </div>
      
      {/* Goal Picker Dropdown */}
      {showGoalPicker && (
        <div className={styles.goalPicker}>
          {GOALS.map(g => (
            <button
              key={g.id}
              className={`${styles.goalOption} ${g.id === goal ? styles.goalOptionActive : ''}`}
              onClick={() => {
                onGoalChange?.(g.id);
                setShowGoalPicker(false);
              }}
            >
              <span className={styles.goalOptionIcon}>{g.icon}</span>
              <div className={styles.goalOptionText}>
                <span className={styles.goalOptionLabel}>{g.label}</span>
                <span className={styles.goalOptionDesc}>{g.description}</span>
              </div>
              {g.id === goal && (
                <span className={styles.checkmark}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
