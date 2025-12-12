'use client';

/**
 * Selected Car Floating Widget
 * 
 * A floating action button/panel that appears when a car is selected.
 * Provides quick access to common actions for the selected car.
 * 
 * @module components/SelectedCarFloatingWidget
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCarSelection, useHasSelectedCar } from '@/components/providers/CarSelectionProvider';
import styles from './SelectedCarFloatingWidget.module.css';

// Icons
const Icons = {
  car: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  zap: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  info: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  x: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  chevronUp: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
  chevronDown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
};

/**
 * Selected Car Floating Widget
 * Shows a floating button/panel for quick car actions
 */
export default function SelectedCarFloatingWidget() {
  const pathname = usePathname();
  const hasSelectedCar = useHasSelectedCar();
  const { selectedCar, buildSummary, appliedUpgrades, clearCar, isHydrated } = useCarSelection();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Don't show on car detail pages or mod planner (redundant)
  const hiddenPaths = ['/browse-cars/', '/mod-planner'];
  const shouldHide = hiddenPaths.some(path => pathname.startsWith(path));

  // Handle scroll to hide when scrolling down
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          // Hide when scrolling down past threshold
          if (currentScrollY > lastScrollY && currentScrollY > 300) {
            setIsVisible(false);
          } else {
            setIsVisible(true);
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Don't render if not hydrated or no selected car
  if (!isHydrated || !hasSelectedCar || !selectedCar || shouldHide) {
    return null;
  }

  const hasUpgrades = appliedUpgrades.length > 0;

  return (
    <div className={`${styles.widget} ${isVisible ? styles.visible : styles.hidden}`}>
      {/* Collapsed state - just a floating button */}
      {!isExpanded && (
        <button 
          className={styles.floatingBtn}
          onClick={() => setIsExpanded(true)}
          aria-label="View selected car actions"
        >
          <Icons.car size={20} />
          <span className={styles.floatingBtnLabel}>
            {selectedCar.name.length > 20 
              ? selectedCar.name.slice(0, 17) + '...' 
              : selectedCar.name}
          </span>
          {hasUpgrades && (
            <span className={styles.upgradeBadge}>{appliedUpgrades.length}</span>
          )}
        </button>
      )}

      {/* Expanded state - full panel */}
      {isExpanded && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <Icons.car size={18} />
              <span>{selectedCar.name}</span>
            </div>
            <button 
              onClick={() => setIsExpanded(false)}
              className={styles.collapseBtn}
              aria-label="Collapse panel"
            >
              <Icons.chevronDown size={18} />
            </button>
          </div>

          {/* Car Quick Stats */}
          <div className={styles.quickStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{selectedCar.hp}</span>
              <span className={styles.statLabel}>HP</span>
            </div>
            {selectedCar.zeroToSixty && (
              <div className={styles.stat}>
                <span className={styles.statValue}>{selectedCar.zeroToSixty}s</span>
                <span className={styles.statLabel}>0-60</span>
              </div>
            )}
            {hasUpgrades && (
              <div className={styles.stat}>
                <span className={styles.statValue}>+{buildSummary.totalHpGain}</span>
                <span className={styles.statLabel}>HP Gain</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className={styles.actions}>
            <Link 
              href={`/browse-cars/${selectedCar.slug}`}
              className={styles.actionBtn}
              onClick={() => setIsExpanded(false)}
            >
              <Icons.info size={16} />
              View Details
            </Link>
            <Link 
              href={`/mod-planner?car=${selectedCar.slug}`}
              className={`${styles.actionBtn} ${styles.primaryAction}`}
              onClick={() => setIsExpanded(false)}
            >
              <Icons.zap size={16} />
              {hasUpgrades ? 'Continue Build' : 'Start Build'}
            </Link>
          </div>

          {/* Clear Car */}
          <button 
            onClick={() => {
              clearCar();
              setIsExpanded(false);
            }}
            className={styles.clearBtn}
          >
            <Icons.x size={14} />
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
}
