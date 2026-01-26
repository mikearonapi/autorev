'use client';

/**
 * CategoryProgress Component
 * 
 * Shows progress bar for a single questionnaire category.
 * Expandable to show questions within the category.
 */

import { useState } from 'react';

import styles from './CategoryProgress.module.css';

// Category icons
const CATEGORY_ICONS = {
  star: '⭐',
  steering: '🏎️',
  wrench: '🔧',
  flag: '🏁',
  calendar: '📅',
  book: '📚',
  users: '👥',
  dollar: '💰',
};

export default function CategoryProgress({
  category,
  answered = 0,
  total = 0,
  color = '#10b981',
  expandable = false,
  expanded = false,
  onToggle,
  children,
}) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0;
  const isComplete = percentage === 100;
  
  const handleToggle = () => {
    if (!expandable) return;
    setIsExpanded(!isExpanded);
    if (onToggle) onToggle(!isExpanded);
  };
  
  return (
    <div className={`${styles.container} ${isComplete ? styles.complete : ''}`}>
      <button
        type="button"
        className={styles.header}
        onClick={handleToggle}
        disabled={!expandable}
        aria-expanded={expandable ? isExpanded : undefined}
      >
        <span className={styles.icon} style={{ '--category-color': color }}>
          {CATEGORY_ICONS[category.icon] || '📋'}
        </span>
        
        <div className={styles.info}>
          <span className={styles.name}>{category.name}</span>
          <span className={styles.description}>{category.description}</span>
        </div>
        
        <div className={styles.stats}>
          <span className={styles.count}>
            {answered}/{total}
          </span>
          <span className={styles.percentage}>{percentage}%</span>
        </div>
        
        {expandable && (
          <span className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        )}
      </button>
      
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill} 
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color,
          }} 
        />
      </div>
      
      {/* Expandable content */}
      {expandable && isExpanded && children && (
        <div className={styles.content}>
          {children}
        </div>
      )}
    </div>
  );
}
