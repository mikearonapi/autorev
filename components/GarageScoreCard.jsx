/**
 * GarageScoreCard Component
 * 
 * Displays a vehicle's garage completeness score (0-100) with:
 * - Circular progress ring visualization
 * - Score breakdown checklist
 * - Improvement tips
 * - Level/tier indicator
 * 
 * @example
 * <GarageScoreCard
 *   score={60}
 *   breakdown={{ specs: 20, photos: 10, mods: 20, goals: 0, parts: 10 }}
 *   vehicleName="2019 BMW M3"
 *   onAction={(action) => console.log(action)}
 * />
 */

import { useState } from 'react';
import styles from './GarageScoreCard.module.css';

// Score categories with icons and labels
// Updated 2026-01-21: Descriptions now reflect auto-credited data
const CATEGORIES = {
  specs: { 
    label: 'Specs', 
    fullLabel: 'Vehicle Specs',
    description: 'Auto-credited from VIN. Add color & mileage.',
    icon: '📋',
    action: 'edit-specs',
  },
  photos: { 
    label: 'Photos', 
    fullLabel: 'Vehicle Photos',
    description: '10pts auto if matched. Upload yours for 20.',
    icon: '📷',
    action: 'upload-photo',
  },
  mods: { 
    label: 'Mods', 
    fullLabel: 'Modifications',
    description: 'Document your installed mods',
    icon: '🔧',
    action: 'add-mod',
  },
  goals: { 
    label: 'Goals', 
    fullLabel: 'Build Goals',
    description: 'Create a build project',
    icon: '🎯',
    action: 'create-project',
  },
  parts: { 
    label: 'Parts', 
    fullLabel: 'Parts List',
    description: 'Select upgrades in your build project',
    icon: '🛒',
    action: 'add-parts',
  },
};

// Get level info based on score
function getLevel(score) {
  if (score >= 100) return { name: 'Complete', color: 'teal', emoji: '🏆' };
  if (score >= 80) return { name: 'Advanced', color: 'teal', emoji: '⭐' };
  if (score >= 60) return { name: 'Intermediate', color: 'blue', emoji: '🔥' };
  if (score >= 40) return { name: 'Getting Started', color: 'blue', emoji: '💪' };
  if (score >= 20) return { name: 'Beginner', color: 'secondary', emoji: '🌱' };
  return { name: 'New', color: 'secondary', emoji: '🆕' };
}

// Circular progress component
function CircularProgress({ score, size = 120, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  // Color based on score
  const getColor = () => {
    if (score >= 80) return 'var(--color-accent-teal, #10b981)';
    if (score >= 40) return 'var(--color-accent-blue, #3b82f6)';
    return 'var(--color-text-secondary, #94a3b8)';
  };

  return (
    <div className={styles.progressRing} style={{ width: size, height: size }}>
      <svg width={size} height={size} className={styles.progressSvg}>
        {/* Background circle */}
        <circle
          className={styles.progressBg}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          className={styles.progressFill}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ stroke: getColor() }}
        />
      </svg>
      <div className={styles.progressCenter}>
        <span className={styles.scoreNumber}>{score}</span>
        <span className={styles.scoreLabel}>/ 100</span>
      </div>
    </div>
  );
}

// Checklist item component
function ChecklistItem({ category, points, maxPoints, onAction }) {
  const cat = CATEGORIES[category];
  const isComplete = points >= maxPoints;
  const isPartial = points > 0 && points < maxPoints;
  
  return (
    <button
      className={`${styles.checklistItem} ${isComplete ? styles.complete : ''} ${isPartial ? styles.partial : ''}`}
      onClick={() => !isComplete && onAction?.(cat.action)}
      disabled={isComplete}
    >
      <span className={styles.checklistIcon}>
        {isComplete ? '✓' : cat.icon}
      </span>
      <span className={styles.checklistLabel}>{cat.label}</span>
      <span className={styles.checklistPoints}>
        {points}/{maxPoints}
      </span>
    </button>
  );
}

// Main component
export default function GarageScoreCard({
  score = 0,
  breakdown = { specs: 0, photos: 0, mods: 0, goals: 0, parts: 0 },
  vehicleName,
  compact = false,
  showChecklist = true,
  showTips = true,
  onAction,
  className = '',
}) {
  const [expanded, setExpanded] = useState(false);
  const level = getLevel(score);
  
  // Get first incomplete category for tip (updated for auto-credited data)
  const getNextTip = () => {
    if (breakdown.specs < 20) return { category: 'specs', tip: 'Add color & mileage' };
    if (breakdown.photos < 20) return { category: 'photos', tip: breakdown.photos === 10 ? 'Upload a photo of YOUR car' : 'Upload a photo' };
    if (breakdown.mods < 20) return { category: 'mods', tip: breakdown.mods === 0 ? 'Document your first mod' : 'Add more mods' };
    if (breakdown.goals < 20) return { category: 'goals', tip: 'Create a build project' };
    if (breakdown.parts < 20) return { category: 'parts', tip: breakdown.parts === 0 ? 'Select upgrades in your project' : 'Select more upgrades' };
    return null;
  };
  
  const nextTip = getNextTip();

  // Empty state
  if (score === 0) {
    return (
      <div className={`${styles.card} ${styles.emptyState} ${className}`}>
        <div className={styles.emptyContent}>
          <span className={styles.emptyIcon}>🚗</span>
          <h3 className={styles.emptyTitle}>Start Building Your Score</h3>
          <p className={styles.emptyText}>
            Complete your vehicle profile to track your build progress
          </p>
          <button 
            className={styles.emptyButton}
            onClick={() => onAction?.('edit-specs')}
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  // Compact mode (for cards in lists)
  if (compact) {
    return (
      <div className={`${styles.cardCompact} ${className}`}>
        <CircularProgress score={score} size={48} strokeWidth={4} />
        <div className={styles.compactInfo}>
          <span className={styles.compactScore}>{score}%</span>
          <span className={styles.compactLevel}>{level.name}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.card} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h3 className={styles.title}>Garage Score</h3>
          {vehicleName && (
            <span className={styles.vehicleName}>{vehicleName}</span>
          )}
        </div>
        <div className={`${styles.levelBadge} ${styles[`level${level.color}`]}`}>
          {level.emoji} {level.name}
        </div>
      </div>

      {/* Main content */}
      <div className={styles.content}>
        {/* Progress ring */}
        <div className={styles.progressSection}>
          <CircularProgress score={score} />
          {score === 100 ? (
            <p className={styles.completeMessage}>🎉 Garage complete!</p>
          ) : nextTip && showTips ? (
            <button 
              className={styles.tipButton}
              onClick={() => onAction?.(CATEGORIES[nextTip.category].action)}
            >
              <span className={styles.tipIcon}>💡</span>
              <span className={styles.tipText}>{nextTip.tip}</span>
              <span className={styles.tipArrow}>→</span>
            </button>
          ) : null}
        </div>

        {/* Checklist */}
        {showChecklist && (
          <div className={styles.checklistSection}>
            <button 
              className={styles.checklistToggle}
              onClick={() => setExpanded(!expanded)}
            >
              <span>Score Breakdown</span>
              <span className={`${styles.toggleIcon} ${expanded ? styles.expanded : ''}`}>
                ▼
              </span>
            </button>
            
            {expanded && (
              <div className={styles.checklist}>
                {Object.entries(CATEGORIES).map(([key]) => (
                  <ChecklistItem
                    key={key}
                    category={key}
                    points={breakdown[key] || 0}
                    maxPoints={20}
                    onAction={onAction}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Export sub-components for flexible usage
GarageScoreCard.CircularProgress = CircularProgress;
GarageScoreCard.ChecklistItem = ChecklistItem;
