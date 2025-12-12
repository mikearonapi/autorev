'use client';

/**
 * Compare Modal
 * 
 * Full-screen modal for side-by-side car comparison.
 * Shows specs, highlights winners, and provides recommendations.
 * Uses React Portal to render at document body level for proper centering.
 */

import { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import styles from './CompareModal.module.css';
import { useCompare } from '@/components/providers/CompareProvider';
import { getCarHeroImage } from '@/lib/images';
import { carData } from '@/data/cars.js';
import { loadPreferences, hasUserPreferences, checkCarAgainstPreferences } from '@/lib/stores/userPreferencesStore';
import { calculateWeightedScore } from '@/lib/scoring';

// Icons
const Icons = {
  x: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  trophy: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
  star: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  externalLink: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  trash: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  alert: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  check: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

// Comparison attributes with formatting and scoring
const COMPARE_ATTRIBUTES = [
  // Basic Info
  { key: 'years', label: 'Years', category: 'basic', format: (v) => v || '—' },
  { key: 'priceRange', label: 'Price Range', category: 'basic', format: (v) => v || '—' },
  { key: 'drivetrain', label: 'Drivetrain', category: 'basic', format: (v) => v || '—' },
  
  // Performance - the key metrics enthusiasts care about
  { key: 'hp', label: 'Horsepower', category: 'performance', format: (v) => v ? `${v} hp` : '—', higherIsBetter: true },
  { key: 'torque', label: 'Torque', category: 'performance', format: (v) => v ? `${v} lb-ft` : '—', higherIsBetter: true },
  { key: 'curbWeight', label: 'Weight', category: 'performance', format: (v) => v ? `${v.toLocaleString()} lbs` : '—', higherIsBetter: false },
  { key: 'powerToWeight', label: 'Power/Weight', category: 'performance', format: (v) => v ? `${v.toFixed(1)} hp/ton` : '—', higherIsBetter: true },
  { key: 'zeroToSixty', label: '0-60 mph', category: 'performance', format: (v) => v ? `${v}s` : '—', higherIsBetter: false },
  { key: 'topSpeed', label: 'Top Speed', category: 'performance', format: (v) => v ? `${v} mph` : '—', higherIsBetter: true },
  
  // Technical Specifications
  { key: 'engine', label: 'Engine', category: 'specs', format: (v) => v || '—' },
  { key: 'trans', label: 'Transmission', category: 'specs', format: (v) => v || '—' },
  { key: 'category', label: 'Layout', category: 'specs', format: (v) => v || '—' },
  
  // AutoRev Scores - what makes each car special
  { key: 'driverFun', label: 'Driver Fun', category: 'scores', format: (v) => v ? `${v}/10` : '—', higherIsBetter: true, isScore: true },
  { key: 'sound', label: 'Sound', category: 'scores', format: (v) => v ? `${v}/10` : '—', higherIsBetter: true, isScore: true },
  { key: 'track', label: 'Track', category: 'scores', format: (v) => v ? `${v}/10` : '—', higherIsBetter: true, isScore: true },
  { key: 'reliability', label: 'Reliability', category: 'scores', format: (v) => v ? `${v}/10` : '—', higherIsBetter: true, isScore: true },
  { key: 'value', label: 'Value', category: 'scores', format: (v) => v ? `${v}/10` : '—', higherIsBetter: true, isScore: true },
  { key: 'interior', label: 'Interior', category: 'scores', format: (v) => v ? `${v}/10` : '—', higherIsBetter: true, isScore: true },
  { key: 'aftermarket', label: 'Aftermarket', category: 'scores', format: (v) => v ? `${v}/10` : '—', higherIsBetter: true, isScore: true },
];

// Category labels
const CATEGORIES = {
  basic: 'Basic Info',
  performance: 'Performance',
  specs: 'Specifications',
  scores: 'AutoRev Scores',
};

/**
 * Get the best value for an attribute among compared cars
 */
function getBestForAttribute(cars, attribute) {
  if (attribute.higherIsBetter === undefined || cars.length < 2) return null;

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

/**
 * Calculate overall recommendation based on scores
 * Uses personalized scores if available, otherwise falls back to default scoring
 */
function getRecommendation(cars, personalizedScores = {}) {
  if (cars.length < 2) return null;
  
  const scores = cars.map(car => {
    // Use personalized score if available, otherwise calculate default
    let avgScore;
    if (personalizedScores[car.slug] !== undefined) {
      avgScore = personalizedScores[car.slug];
    } else {
      // Fallback: weight scores based on what enthusiasts typically care about
      const scoreKeys = ['driverFun', 'sound', 'track', 'value', 'reliability'];
      let total = 0;
      let count = 0;
      
      scoreKeys.forEach(key => {
        if (car[key]) {
          total += parseFloat(car[key]);
          count++;
        }
      });
      avgScore = count > 0 ? total / count : 0;
    }
    
    return {
      slug: car.slug,
      name: car.name,
      avgScore,
      bestFor: [],
    };
  });
  
  // Determine what each car is best for based on standout attributes
  cars.forEach((car, i) => {
    if (car.driverFun && parseFloat(car.driverFun) >= 8.5) scores[i].bestFor.push('Driver Engagement');
    if (car.track && parseFloat(car.track) >= 8) scores[i].bestFor.push('Track Days');
    if (car.sound && parseFloat(car.sound) >= 8.5) scores[i].bestFor.push('Sound');
    if (car.reliability && parseFloat(car.reliability) >= 8) scores[i].bestFor.push('Reliability');
    if (car.value && parseFloat(car.value) >= 8) scores[i].bestFor.push('Value');
    if (car.zeroToSixty && parseFloat(car.zeroToSixty) < 4) scores[i].bestFor.push('Straight-Line Speed');
    if (car.interior && parseFloat(car.interior) >= 8) scores[i].bestFor.push('Daily Comfort');
    if (car.aftermarket && parseFloat(car.aftermarket) >= 8) scores[i].bestFor.push('Modding');
  });
  
  // Sort by score (personalized or default)
  scores.sort((a, b) => b.avgScore - a.avgScore);
  
  return scores;
}

export default function CompareModal({ isOpen, onClose }) {
  const { cars: compareCars, removeFromCompare, clearAll, maxCars } = useCompare();
  const [mounted, setMounted] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);
  const [hasPrefs, setHasPrefs] = useState(false);

  // Ensure we only render portal on client side
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Load user preferences when modal opens
  useEffect(() => {
    if (isOpen && mounted) {
      const prefs = loadPreferences();
      setUserPreferences(prefs);
      setHasPrefs(hasUserPreferences());
    }
  }, [isOpen, mounted]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Get full car data for images and additional info
  const carsWithFullData = useMemo(() => {
    return compareCars.map(car => {
      const fullCar = carData.find(c => c.slug === car.slug);
      return fullCar || car;
    });
  }, [compareCars]);

  // Check each car against user preferences
  const carPreferenceMatches = useMemo(() => {
    if (!hasPrefs || !userPreferences) return {};
    
    const matches = {};
    carsWithFullData.forEach(car => {
      matches[car.slug] = checkCarAgainstPreferences(car, userPreferences);
    });
    return matches;
  }, [carsWithFullData, userPreferences, hasPrefs]);

  // Calculate personalized scores using user's weights
  const personalizedScores = useMemo(() => {
    if (!userPreferences?.weights) return {};
    
    const scores = {};
    carsWithFullData.forEach(car => {
      scores[car.slug] = calculateWeightedScore(car, userPreferences.weights);
    });
    return scores;
  }, [carsWithFullData, userPreferences]);

  // Calculate best values for each attribute
  const bestValues = useMemo(() => {
    const bests = {};
    COMPARE_ATTRIBUTES.forEach(attr => {
      bests[attr.key] = getBestForAttribute(carsWithFullData, attr);
    });
    return bests;
  }, [carsWithFullData]);

  // Calculate recommendations (using personalized scores if available)
  const recommendations = useMemo(() => {
    return getRecommendation(carsWithFullData, personalizedScores);
  }, [carsWithFullData, personalizedScores]);

  // Group attributes by category
  const groupedAttributes = useMemo(() => {
    const groups = {};
    COMPARE_ATTRIBUTES.forEach(attr => {
      if (!groups[attr.category]) {
        groups[attr.category] = [];
      }
      groups[attr.category].push(attr);
    });
    return groups;
  }, []);

  // Don't render until mounted (client-side) or if not open
  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>Compare Cars</h2>
            <span className={styles.carCount}>{carsWithFullData.length}/{maxCars} cars</span>
          </div>
          <div className={styles.headerActions}>
            <button onClick={clearAll} className={styles.clearButton}>
              Clear All
            </button>
            <button onClick={onClose} className={styles.closeButton}>
              <Icons.x size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {carsWithFullData.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No cars to compare. Add cars from the catalog to get started.</p>
            </div>
          ) : (
            <>
              {/* Recommendation Banner */}
              {recommendations && recommendations.length >= 2 && (
                <div className={styles.recommendationBanner}>
                  <div className={styles.recommendationIcon}>
                    <Icons.star size={20} />
                  </div>
                  <div className={styles.recommendationContent}>
                    <h3 className={styles.recommendationTitle}>
                      {hasPrefs ? 'Your Best Match' : 'Our Pick'}: {recommendations[0].name}
                    </h3>
                    <p className={styles.recommendationText}>
                      {hasPrefs 
                        ? `Based on your priorities (Score: ${recommendations[0].avgScore.toFixed(1)})`
                        : `Highest overall score (${recommendations[0].avgScore.toFixed(1)}/10)`
                      }
                      {recommendations[0].bestFor.length > 0 && (
                        <> • Best for: {recommendations[0].bestFor.join(', ')}</>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Car Headers - Sticky */}
              <div className={styles.carHeaders}>
                <div className={styles.attributeColumn}>
                  {/* Empty - label not needed */}
                </div>
                {carsWithFullData.map((car, index) => {
                  const imageUrl = getCarHeroImage(car);
                  const isRecommended = recommendations && recommendations[0]?.slug === car.slug;
                  const prefMatch = carPreferenceMatches[car.slug];
                  const hasMismatches = hasPrefs && prefMatch && !prefMatch.matches;
                  
                  return (
                    <div 
                      key={car.slug} 
                      className={`${styles.carHeader} ${isRecommended ? styles.recommended : ''} ${hasMismatches ? styles.hasMismatches : ''}`}
                    >
                      {isRecommended && (
                        <div className={styles.recommendedBadge}>
                          <Icons.trophy size={12} />
                          Top Pick
                        </div>
                      )}
                      <div className={styles.carHeaderImage}>
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={car.name}
                            fill
                            sizes="150px"
                            className={styles.carImage}
                          />
                        ) : (
                          <div className={styles.imagePlaceholder}>{car.name?.charAt(0)}</div>
                        )}
                      </div>
                      <h3 className={styles.carHeaderName}>{car.name}</h3>
                      
                      {/* Preference match/mismatch indicator */}
                      {hasPrefs && prefMatch && (
                        <div className={prefMatch.matches ? styles.prefMatchBadge : styles.prefMismatchBadge}>
                          {prefMatch.matches ? (
                            <>
                              <Icons.check size={12} />
                              <span>Matches your criteria</span>
                            </>
                          ) : (
                            <>
                              <Icons.alert size={12} />
                              <span>{prefMatch.mismatches.length} mismatch{prefMatch.mismatches.length > 1 ? 'es' : ''}</span>
                            </>
                          )}
                        </div>
                      )}
                      
                      {/* Show mismatch details */}
                      {hasMismatches && (
                        <div className={styles.mismatchList}>
                          {prefMatch.mismatches.slice(0, 2).map((m, i) => (
                            <div key={i} className={styles.mismatchItem}>
                              <Icons.alert size={10} />
                              <span>{m}</span>
                            </div>
                          ))}
                          {prefMatch.mismatches.length > 2 && (
                            <div className={styles.mismatchMore}>
                              +{prefMatch.mismatches.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className={styles.carHeaderActions}>
                        <Link href={`/cars/${car.slug}`} className={styles.viewButton}>
                          View
                          <Icons.externalLink size={12} />
                        </Link>
                        <button
                          onClick={() => removeFromCompare(car.slug)}
                          className={styles.removeButton}
                          title="Remove"
                        >
                          <Icons.trash size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comparison Table */}
              <div className={styles.tableContainer}>
                {Object.entries(groupedAttributes).map(([category, attrs]) => (
                  <div key={category} className={styles.categorySection}>
                    <div className={styles.categoryHeader}>
                      <h4 className={styles.categoryTitle}>{CATEGORIES[category]}</h4>
                    </div>
                    
                    {attrs.map(attr => (
                      <div key={attr.key} className={styles.row}>
                        <div className={styles.attributeColumn}>
                          <span className={styles.attributeName}>{attr.label}</span>
                        </div>
                        {carsWithFullData.map(car => {
                          const isBest = bestValues[attr.key] === car.slug;
                          const value = car[attr.key];
                          return (
                            <div 
                              key={car.slug} 
                              className={`${styles.valueColumn} ${isBest ? styles.bestValue : ''}`}
                            >
                              {isBest && <Icons.trophy size={14} className={styles.trophyIcon} />}
                              <span className={styles.value}>{attr.format(value)}</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  // This ensures it's not constrained by the CompareBar's fixed positioning
  return createPortal(modalContent, document.body);
}
