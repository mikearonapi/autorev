'use client';

/**
 * Compare Page
 * 
 * Side-by-side comparison of selected cars.
 * 
 * @module app/garage/compare/page
 */

import { useMemo } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { useCompare } from '@/components/providers/CompareProvider';
import LoadingSpinner from '@/components/LoadingSpinner';

// Icons
const Icons = {
  arrowLeft: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  x: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  plus: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  trophy: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
};

// Comparison attributes
const COMPARE_ATTRIBUTES = [
  { key: 'years', label: 'Years', format: (v) => v || '—' },
  { key: 'hp', label: 'Horsepower', format: (v) => v ? `${v} hp` : '—', higherIsBetter: true },
  { key: 'torque', label: 'Torque', format: (v) => v ? `${v} lb-ft` : '—', higherIsBetter: true },
  { key: 'zeroToSixty', label: '0-60 mph', format: (v) => v ? `${v}s` : '—', higherIsBetter: false },
  { key: 'priceRange', label: 'Price Range', format: (v) => v || '—' },
  { key: 'engine', label: 'Engine', format: (v) => v || '—' },
  { key: 'trans', label: 'Transmission', format: (v) => v || '—' },
  { key: 'category', label: 'Layout', format: (v) => v || '—' },
  { key: 'sound', label: 'Sound Score', format: (v) => v ? `${v}/10` : '—', higherIsBetter: true },
  { key: 'track', label: 'Track Score', format: (v) => v ? `${v}/10` : '—', higherIsBetter: true },
  { key: 'value', label: 'Value Score', format: (v) => v ? `${v}/10` : '—', higherIsBetter: true },
  { key: 'reliability', label: 'Reliability', format: (v) => v ? `${v}/10` : '—', higherIsBetter: true },
];

/**
 * Get the best value for an attribute among compared cars
 * @param {Object[]} cars 
 * @param {Object} attribute 
 * @returns {string|null} - Slug of car with best value, or null
 */
function getBestForAttribute(cars, attribute) {
  if (!attribute.higherIsBetter || cars.length < 2) return null;

  let bestSlug = null;
  let bestValue = attribute.higherIsBetter === false ? Infinity : -Infinity;

  cars.forEach(car => {
    const value = car[attribute.key];
    if (value === undefined || value === null) return;
    
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(numValue)) return;

    if (attribute.higherIsBetter === false) {
      if (numValue < bestValue) {
        bestValue = numValue;
        bestSlug = car.slug;
      }
    } else {
      if (numValue > bestValue) {
        bestValue = numValue;
        bestSlug = car.slug;
      }
    }
  });

  return bestSlug;
}

export default function ComparePage() {
  const { cars, removeFromCompare, clearAll, isHydrated, maxCars } = useCompare();

  // Calculate which car is best for each attribute
  const bestValues = useMemo(() => {
    const bests = {};
    COMPARE_ATTRIBUTES.forEach(attr => {
      bests[attr.key] = getBestForAttribute(cars, attr);
    });
    return bests;
  }, [cars]);

  if (!isHydrated) {
    return (
      <div className={styles.page}>
        <LoadingSpinner 
          text="Loading comparison..." 
          size="large"
          fullPage 
        />
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <h1 className={styles.emptyTitle}>No Cars to Compare</h1>
          <p className={styles.emptyText}>
            Add cars to your compare list to see a side-by-side comparison.
          </p>
          <Link href="/garage" className={styles.browseBtn}>
            Browse Cars
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/garage" className={styles.backLink}>
          <Icons.arrowLeft size={18} />
          Back to Garage
        </Link>
        <h1 className={styles.title}>Compare Cars</h1>
        <div className={styles.headerActions}>
          <span className={styles.countLabel}>{cars.length}/{maxCars} cars</span>
          <button onClick={clearAll} className={styles.clearBtn}>
            Clear All
          </button>
        </div>
      </div>

      {/* Compare Table */}
      <div className={styles.compareContainer}>
        <table className={styles.compareTable}>
          <thead>
            <tr>
              <th className={styles.attributeHeader}>Attribute</th>
              {cars.map(car => (
                <th key={car.slug} className={styles.carHeader}>
                  <div className={styles.carHeaderContent}>
                    <span className={styles.carName}>{car.name}</span>
                    <div className={styles.carHeaderActions}>
                      <Link href={`/browse-cars/${car.slug}`} className={styles.viewLink}>
                        View
                      </Link>
                      <button
                        onClick={() => removeFromCompare(car.slug)}
                        className={styles.removeBtn}
                        title="Remove from compare"
                      >
                        <Icons.x size={16} />
                      </button>
                    </div>
                  </div>
                </th>
              ))}
              {cars.length < maxCars && (
                <th className={styles.addMoreHeader}>
                  <Link href="/garage" className={styles.addMoreBtn}>
                    <Icons.plus size={20} />
                    <span>Add Car</span>
                  </Link>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ATTRIBUTES.map(attr => (
              <tr key={attr.key}>
                <td className={styles.attributeLabel}>{attr.label}</td>
                {cars.map(car => {
                  const isBest = bestValues[attr.key] === car.slug;
                  return (
                    <td 
                      key={car.slug} 
                      className={`${styles.valueCell} ${isBest ? styles.bestValue : ''}`}
                    >
                      {isBest && <Icons.trophy size={14} className={styles.trophyIcon} />}
                      {attr.format(car[attr.key])}
                    </td>
                  );
                })}
                {cars.length < maxCars && <td className={styles.emptyCell}>—</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <Link href="/garage" className={styles.actionBtn}>
          <Icons.plus size={18} />
          Add More Cars
        </Link>
      </div>
    </div>
  );
}
