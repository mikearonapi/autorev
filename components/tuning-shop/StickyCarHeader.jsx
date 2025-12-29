'use client';

/**
 * Sticky Car Header Component
 * 
 * After car selection, collapses to a sticky header showing:
 * - Car thumbnail
 * - Car name
 * - Quick stats (+HP, $Cost)
 * - Tap to expand full details or change car
 * 
 * Mobile-first: Becomes sticky when scrolling past car selection.
 * 
 * @module components/tuning-shop/StickyCarHeader
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import styles from './StickyCarHeader.module.css';

const ChevronIcon = ({ direction = 'down' }) => (
  <svg 
    width={14} 
    height={14} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ transform: direction === 'up' ? 'rotate(180deg)' : undefined }}
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const EditIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

/**
 * @typedef {Object} StickyCarHeaderProps
 * @property {Object} car - Selected car object
 * @property {number} totalHpGain - Total HP gain from selected upgrades
 * @property {number} totalCost - Total cost of selected upgrades
 * @property {function} onChangeCar - Callback to change/deselect car
 * @property {boolean} [showExpanded] - Force expanded view
 * @property {string} [carImageUrl] - Car image URL
 */

/**
 * Sticky Car Header
 * @param {StickyCarHeaderProps} props
 */
export default function StickyCarHeader({
  car,
  totalHpGain = 0,
  totalCost = 0,
  onChangeCar,
  showExpanded = false,
  carImageUrl,
}) {
  const [isSticky, setIsSticky] = useState(false);
  const [isExpanded, setIsExpanded] = useState(showExpanded);
  const headerRef = useRef(null);
  const sentinelRef = useRef(null);

  // Set up intersection observer for sticky behavior
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // When sentinel goes out of view, make header sticky
        setIsSticky(!entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '-1px 0px 0px 0px',
      }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Handle escape key to collapse
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  if (!car) return null;

  // Get car image (fallback to placeholder)
  const imageUrl = carImageUrl || car.hero_image_url || car.thumbnail_url || `/images/cars/${car.slug}.png`;

  return (
    <>
      {/* Sentinel for intersection observer */}
      <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />

      {/* Main Header */}
      <div 
        ref={headerRef}
        className={`${styles.header} ${isSticky ? styles.headerSticky : ''} ${isExpanded ? styles.headerExpanded : ''}`}
      >
        <div className={styles.headerContent}>
          {/* Car Info (Always Visible) */}
          <button className={styles.carInfo} onClick={toggleExpanded}>
            <div className={styles.carImage}>
              <Image 
                src={imageUrl || '/images/car-placeholder.png'} 
                alt={car.name}
                width={60}
                height={40}
                style={{ objectFit: 'cover' }}
                unoptimized={imageUrl?.includes('blob.vercel-storage.com')}
              />
            </div>
            <div className={styles.carDetails}>
              <span className={styles.carName}>{car.name}</span>
              <span className={styles.carYear}>{car.year || car.years}</span>
            </div>
            <ChevronIcon direction={isExpanded ? 'up' : 'down'} />
          </button>

          {/* Stats (Visible when not expanded) */}
          {!isExpanded && (
            <div className={styles.quickStats}>
              {totalHpGain > 0 && (
                <div className={styles.stat}>
                  <span className={styles.statValue}>+{totalHpGain}</span>
                  <span className={styles.statLabel}>HP</span>
                </div>
              )}
              {totalCost > 0 && (
                <div className={styles.stat}>
                  <span className={styles.statValue}>${totalCost.toLocaleString()}</span>
                  <span className={styles.statLabel}>Cost</span>
                </div>
              )}
            </div>
          )}

          {/* Change Car Button */}
          <button 
            className={styles.changeCarBtn}
            onClick={(e) => {
              e.stopPropagation();
              onChangeCar?.();
            }}
            title="Change car"
          >
            <EditIcon />
            <span className={styles.changeCarText}>Change</span>
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className={styles.expandedContent}>
            <div className={styles.expandedStats}>
              <div className={styles.expandedStatRow}>
                <span className={styles.expandedStatLabel}>Stock HP</span>
                <span className={styles.expandedStatValue}>{car.horsepower || car.hp || 'N/A'}</span>
              </div>
              <div className={styles.expandedStatRow}>
                <span className={styles.expandedStatLabel}>Stock Torque</span>
                <span className={styles.expandedStatValue}>{car.torque || 'N/A'}</span>
              </div>
              <div className={styles.expandedStatRow}>
                <span className={styles.expandedStatLabel}>Engine</span>
                <span className={styles.expandedStatValue}>{car.engine || 'N/A'}</span>
              </div>
              <div className={styles.expandedStatRow}>
                <span className={styles.expandedStatLabel}>Drivetrain</span>
                <span className={styles.expandedStatValue}>{car.drivetrain || 'N/A'}</span>
              </div>
            </div>
            {totalHpGain > 0 && (
              <div className={styles.buildSummary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Build Total</span>
                  <span className={styles.summaryValue}>
                    {(car.horsepower || car.hp || 0) + totalHpGain} HP 
                    <span className={styles.summaryGain}>(+{totalHpGain})</span>
                  </span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Estimated Cost</span>
                  <span className={styles.summaryValue}>${totalCost.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Spacer when sticky to prevent content jump */}
      {isSticky && <div className={styles.spacer} aria-hidden="true" />}
    </>
  );
}

