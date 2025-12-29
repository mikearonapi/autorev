'use client';

/**
 * Category Navigation Component
 * 
 * Mobile-first segmented control/tab bar with icons for upgrade categories.
 * Replaces horizontal scrolling pills with a more visible navigation.
 * 
 * Features:
 * - Icons for each category
 * - Badge showing selected count per category
 * - Smooth horizontal scroll on mobile
 * - Desktop: horizontal row / Mobile: scrollable tabs
 * 
 * @module components/tuning-shop/CategoryNav
 */

import { useRef, useCallback, useEffect } from 'react';
import styles from './CategoryNav.module.css';

// Category icons (inline SVGs for performance)
const categoryIcons = {
  power: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  turbo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16V8"/>
      <path d="M8 12h8"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  forced_induction: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16V8"/>
      <path d="M8 12h8"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  chassis: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <circle cx="7" cy="21" r="1"/>
      <circle cx="17" cy="21" r="1"/>
      <path d="M3 11V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/>
    </svg>
  ),
  suspension: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18"/>
      <path d="M8 7l4-4 4 4"/>
      <path d="M8 17l4 4 4-4"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  brakes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v4"/>
      <path d="M12 18v4"/>
      <path d="M2 12h4"/>
      <path d="M18 12h4"/>
    </svg>
  ),
  drivetrain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="3"/>
      <circle cx="19" cy="12" r="3"/>
      <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
  ),
  intake: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v6"/>
      <path d="M12 22v-6"/>
      <path d="M4.93 4.93l4.24 4.24"/>
      <path d="M14.83 14.83l4.24 4.24"/>
      <path d="M2 12h6"/>
      <path d="M16 12h6"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  exhaust: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18"/>
      <path d="M6 6l12 12"/>
      <circle cx="12" cy="12" r="9"/>
    </svg>
  ),
  cooling: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20"/>
      <path d="M2 12h20"/>
      <path d="M6 6l12 12"/>
      <path d="M18 6L6 18"/>
    </svg>
  ),
  fuel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v13"/>
      <path d="M11 14h3"/>
      <path d="M11 18h5"/>
      <path d="M18 8h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-1"/>
      <path d="M7 7V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v3"/>
    </svg>
  ),
  fuel_system: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22V9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v13"/>
      <path d="M11 14h3"/>
      <path d="M11 18h5"/>
      <path d="M18 8h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-1"/>
      <path d="M7 7V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v3"/>
    </svg>
  ),
  tune: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V10"/>
      <path d="M18 20V4"/>
      <path d="M6 20v-4"/>
      <circle cx="12" cy="7" r="3"/>
      <circle cx="6" cy="13" r="3"/>
      <circle cx="18" cy="7" r="3"/>
    </svg>
  ),
  engine: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <path d="M9 9h6v6H9z"/>
      <path d="M4 12h2"/>
      <path d="M18 12h2"/>
      <path d="M12 4v2"/>
      <path d="M12 18v2"/>
    </svg>
  ),
  wheels_tires: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3"/>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
    </svg>
  ),
  exterior: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  interior: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12a7 7 0 0 1 14 0"/>
      <path d="M12 12v7"/>
      <path d="M8 19h8"/>
    </svg>
  ),
  other: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/>
      <circle cx="12" cy="5" r="1"/>
      <circle cx="12" cy="19" r="1"/>
    </svg>
  ),
};

// Category display names
const categoryNames = {
  power: 'Power',
  turbo: 'Turbo',
  forced_induction: 'Forced Induction',
  chassis: 'Chassis',
  suspension: 'Suspension',
  brakes: 'Brakes',
  drivetrain: 'Drivetrain',
  intake: 'Intake',
  exhaust: 'Exhaust',
  cooling: 'Cooling',
  fuel: 'Fuel',
  fuel_system: 'Fuel System',
  tune: 'Tune',
  engine: 'Engine',
  wheels_tires: 'Wheels',
  exterior: 'Exterior',
  interior: 'Interior',
  other: 'Other',
};

/**
 * @typedef {Object} CategoryNavProps
 * @property {string[]} categories - Array of category keys to display
 * @property {string} activeCategory - Currently active category
 * @property {function} onCategoryChange - Callback when category is changed
 * @property {Object<string, number>} [selectedCounts] - Map of category -> selected count
 * @property {boolean} [disabled] - Disable all navigation
 * @property {boolean} [showAll] - Show "All" option
 */

/**
 * Category Navigation
 * @param {CategoryNavProps} props
 */
export default function CategoryNav({
  categories = [],
  activeCategory,
  onCategoryChange,
  selectedCounts = {},
  disabled = false,
  showAll = false,
}) {
  const scrollRef = useRef(null);
  const activeRef = useRef(null);

  // Scroll active item into view
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const activeEl = activeRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      
      // Check if active item is fully visible
      const isVisible = 
        activeRect.left >= containerRect.left &&
        activeRect.right <= containerRect.right;
      
      if (!isVisible) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [activeCategory]);

  const handleCategoryClick = useCallback((category) => {
    if (disabled) return;
    onCategoryChange?.(category);
  }, [disabled, onCategoryChange]);

  // Get icon for category
  const getIcon = (category) => {
    return categoryIcons[category] || categoryIcons.other;
  };

  // Get display name for category
  const getName = (category) => {
    return categoryNames[category] || category;
  };

  return (
    <nav className={styles.container} role="tablist" aria-label="Upgrade categories">
      <div className={styles.scroll} ref={scrollRef}>
        {/* All option */}
        {showAll && (
          <button
            role="tab"
            aria-selected={activeCategory === 'all'}
            className={`${styles.tab} ${activeCategory === 'all' ? styles.tabActive : ''}`}
            onClick={() => handleCategoryClick('all')}
            disabled={disabled}
            ref={activeCategory === 'all' ? activeRef : null}
          >
            <span className={styles.tabIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </span>
            <span className={styles.tabName}>All</span>
          </button>
        )}
        
        {/* Category tabs */}
        {categories.map(category => {
          const isActive = activeCategory === category;
          const count = selectedCounts[category] || 0;
          
          return (
            <button
              key={category}
              role="tab"
              aria-selected={isActive}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''} ${count > 0 ? styles.tabHasSelection : ''}`}
              onClick={() => handleCategoryClick(category)}
              disabled={disabled}
              ref={isActive ? activeRef : null}
            >
              <span className={styles.tabIcon}>{getIcon(category)}</span>
              <span className={styles.tabName}>{getName(category)}</span>
              {count > 0 && (
                <span className={styles.tabBadge}>{count}</span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Scroll indicators */}
      <div className={styles.fadeLeft} aria-hidden="true" />
      <div className={styles.fadeRight} aria-hidden="true" />
    </nav>
  );
}

/**
 * Vertical category navigation for sidebar use
 */
export function CategoryNavVertical({
  categories = [],
  activeCategory,
  onCategoryChange,
  selectedCounts = {},
  disabled = false,
  showAll = false,
}) {
  const handleCategoryClick = useCallback((category) => {
    if (disabled) return;
    onCategoryChange?.(category);
  }, [disabled, onCategoryChange]);

  const getIcon = (category) => categoryIcons[category] || categoryIcons.other;
  const getName = (category) => categoryNames[category] || category;

  return (
    <nav className={styles.verticalContainer} role="tablist" aria-label="Upgrade categories">
      {showAll && (
        <button
          role="tab"
          aria-selected={activeCategory === 'all'}
          className={`${styles.verticalTab} ${activeCategory === 'all' ? styles.verticalTabActive : ''}`}
          onClick={() => handleCategoryClick('all')}
          disabled={disabled}
        >
          <span className={styles.verticalIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </span>
          <span className={styles.verticalName}>All Categories</span>
        </button>
      )}
      
      {categories.map(category => {
        const isActive = activeCategory === category;
        const count = selectedCounts[category] || 0;
        
        return (
          <button
            key={category}
            role="tab"
            aria-selected={isActive}
            className={`${styles.verticalTab} ${isActive ? styles.verticalTabActive : ''} ${count > 0 ? styles.verticalTabHasSelection : ''}`}
            onClick={() => handleCategoryClick(category)}
            disabled={disabled}
          >
            <span className={styles.verticalIcon}>{getIcon(category)}</span>
            <span className={styles.verticalName}>{getName(category)}</span>
            {count > 0 && (
              <span className={styles.verticalBadge}>{count}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

