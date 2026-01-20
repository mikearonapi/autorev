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
import { Icons } from '@/components/ui/Icons';

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

  // Don't show on car detail pages or tuning shop (redundant)
  const hiddenPaths = ['/browse-cars/', '/tuning-shop'];
  const shouldHide = hiddenPaths.some(path => pathname.startsWith(path));

  // Handle scroll to hide when scrolling down
  useEffect(() => {
  if (typeof window === 'undefined') return;
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
              href={`/tuning-shop?car=${selectedCar.slug}`}
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
