'use client';

/**
 * Compare Modal
 *
 * Full-screen modal for side-by-side car comparison.
 * Shows specs, highlights winners, and provides recommendations.
 * Uses React Portal to render at document body level for proper centering.
 *
 * Now fetches car data from database via carsClient.
 */

import { useMemo, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { useCompare } from '@/components/providers/CompareProvider';
import EmptyState from '@/components/ui/EmptyState';
import { Icons } from '@/components/ui/Icons';
import Modal from '@/components/ui/Modal';
import { fetchCars } from '@/lib/carsClient';
import { getCarHeroImage } from '@/lib/images';
import { calculateWeightedScore } from '@/lib/scoring';
import {
  loadPreferences,
  hasUserPreferences,
  checkCarAgainstPreferences,
} from '@/lib/stores/userPreferencesStore';

import styles from './CompareModal.module.css';

// Comparison attributes with formatting and scoring
const COMPARE_ATTRIBUTES = [
  // Basic Info
  { key: 'year', label: 'Year', category: 'basic', format: (v) => v || '—' },
  {
    key: 'msrp',
    label: 'MSRP',
    category: 'basic',
    format: (v) => (v ? `$${v.toLocaleString()}` : '—'),
  },
  { key: 'driveType', label: 'Drivetrain', category: 'basic', format: (v) => v || '—' },

  // Performance - the key metrics enthusiasts care about
  {
    key: 'hp',
    label: 'Horsepower',
    category: 'performance',
    format: (v) => (v ? `${v} hp` : '—'),
    higherIsBetter: true,
  },
  {
    key: 'torque',
    label: 'Torque',
    category: 'performance',
    format: (v) => (v ? `${v} lb-ft` : '—'),
    higherIsBetter: true,
  },
  {
    key: 'curbWeight',
    label: 'Weight',
    category: 'performance',
    format: (v) => (v ? `${v.toLocaleString()} lbs` : '—'),
    higherIsBetter: false,
  },
  {
    key: 'powerToWeight',
    label: 'Power/Weight',
    category: 'performance',
    format: (v) => (v ? `${v.toFixed(1)} hp/ton` : '—'),
    higherIsBetter: true,
  },
  {
    key: 'zeroToSixty',
    label: '0-60 mph',
    category: 'performance',
    format: (v) => (v ? `${v}s` : '—'),
    higherIsBetter: false,
  },
  {
    key: 'topSpeed',
    label: 'Top Speed',
    category: 'performance',
    format: (v) => (v ? `${v} mph` : '—'),
    higherIsBetter: true,
  },

  // Technical Specifications
  { key: 'engineType', label: 'Engine', category: 'specs', format: (v) => v || '—' },
  { key: 'transmission', label: 'Transmission', category: 'specs', format: (v) => v || '—' },
  { key: 'category', label: 'Layout', category: 'specs', format: (v) => v || '—' },

  // AutoRev Scores - what makes each car special
  {
    key: 'driverFun',
    label: 'Driver Fun',
    category: 'scores',
    format: (v) => (v ? `${v}/10` : '—'),
    higherIsBetter: true,
    isScore: true,
  },
  {
    key: 'sound',
    label: 'Sound',
    category: 'scores',
    format: (v) => (v ? `${v}/10` : '—'),
    higherIsBetter: true,
    isScore: true,
  },
  {
    key: 'track',
    label: 'Track',
    category: 'scores',
    format: (v) => (v ? `${v}/10` : '—'),
    higherIsBetter: true,
    isScore: true,
  },
  {
    key: 'reliability',
    label: 'Reliability',
    category: 'scores',
    format: (v) => (v ? `${v}/10` : '—'),
    higherIsBetter: true,
    isScore: true,
  },
  {
    key: 'value',
    label: 'Value',
    category: 'scores',
    format: (v) => (v ? `${v}/10` : '—'),
    higherIsBetter: true,
    isScore: true,
  },
  {
    key: 'interior',
    label: 'Interior',
    category: 'scores',
    format: (v) => (v ? `${v}/10` : '—'),
    higherIsBetter: true,
    isScore: true,
  },
  {
    key: 'aftermarket',
    label: 'Aftermarket',
    category: 'scores',
    format: (v) => (v ? `${v}/10` : '—'),
    higherIsBetter: true,
    isScore: true,
  },
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

  cars.forEach((car) => {
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

  const scores = cars.map((car) => {
    // Use personalized score if available, otherwise calculate default
    let avgScore;
    if (personalizedScores[car.slug] !== undefined) {
      avgScore = personalizedScores[car.slug];
    } else {
      // Fallback: weight scores based on what enthusiasts typically care about
      const scoreKeys = ['driverFun', 'sound', 'track', 'value', 'reliability'];
      let total = 0;
      let count = 0;

      scoreKeys.forEach((key) => {
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
    if (car.driverFun && parseFloat(car.driverFun) >= 8.5)
      scores[i].bestFor.push('Driver Engagement');
    if (car.track && parseFloat(car.track) >= 8) scores[i].bestFor.push('Track Days');
    if (car.sound && parseFloat(car.sound) >= 8.5) scores[i].bestFor.push('Sound');
    if (car.reliability && parseFloat(car.reliability) >= 8) scores[i].bestFor.push('Reliability');
    if (car.value && parseFloat(car.value) >= 8) scores[i].bestFor.push('Value');
    if (car.zeroToSixty && parseFloat(car.zeroToSixty) < 4)
      scores[i].bestFor.push('Straight-Line Speed');
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
  const [allCars, setAllCars] = useState([]);

  // Fetch car data from database on mount
  useEffect(() => {
    fetchCars().then(setAllCars).catch(console.error);
  }, []);

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

  // Get full car data for images and additional info (from database)
  const carsWithFullData = useMemo(() => {
    return compareCars.map((car) => {
      const fullCar = allCars.find((c) => c.slug === car.slug);
      return fullCar || car;
    });
  }, [compareCars, allCars]);

  // Check each car against user preferences
  const carPreferenceMatches = useMemo(() => {
    if (!hasPrefs || !userPreferences) return {};

    const matches = {};
    carsWithFullData.forEach((car) => {
      matches[car.slug] = checkCarAgainstPreferences(car, userPreferences);
    });
    return matches;
  }, [carsWithFullData, userPreferences, hasPrefs]);

  // Calculate personalized scores using user's weights
  const personalizedScores = useMemo(() => {
    if (!userPreferences?.weights) return {};

    const scores = {};
    carsWithFullData.forEach((car) => {
      scores[car.slug] = calculateWeightedScore(car, userPreferences.weights);
    });
    return scores;
  }, [carsWithFullData, userPreferences]);

  // Calculate best values for each attribute
  const bestValues = useMemo(() => {
    const bests = {};
    COMPARE_ATTRIBUTES.forEach((attr) => {
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
    COMPARE_ATTRIBUTES.forEach((attr) => {
      if (!groups[attr.category]) {
        groups[attr.category] = [];
      }
      groups[attr.category].push(attr);
    });
    return groups;
  }, []);

  // Don't render until mounted (client-side)
  if (!mounted) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      showCloseButton={false}
      className={styles.modal}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Compare Cars</h2>
          <span className={styles.carCount}>
            {carsWithFullData.length}/{maxCars} cars
          </span>
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
          <EmptyState
            icon={Icons.car}
            title="No cars to compare"
            description="Add cars from the catalog to get started."
            variant="centered"
          />
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
                      : `Highest overall score (${recommendations[0].avgScore.toFixed(1)}/10)`}
                    {recommendations[0].bestFor.length > 0 && (
                      <> • Best for: {recommendations[0].bestFor.join(', ')}</>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Car Headers - Sticky */}
            <div className={styles.carHeaders}>
              <div className={styles.attributeColumn}>{/* Empty - label not needed */}</div>
              {carsWithFullData.map((car, _index) => {
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
                      <div
                        className={
                          prefMatch.matches ? styles.prefMatchBadge : styles.prefMismatchBadge
                        }
                      >
                        {prefMatch.matches ? (
                          <>
                            <Icons.check size={12} />
                            <span>Matches your criteria</span>
                          </>
                        ) : (
                          <>
                            <Icons.alert size={12} />
                            <span>
                              {prefMatch.mismatches.length} mismatch
                              {prefMatch.mismatches.length > 1 ? 'es' : ''}
                            </span>
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
                      <Link href={`/browse-cars/${car.slug}`} className={styles.viewButton}>
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

                  {attrs.map((attr) => (
                    <div key={attr.key} className={styles.row}>
                      <div className={styles.attributeColumn}>
                        <span className={styles.attributeName}>{attr.label}</span>
                      </div>
                      {carsWithFullData.map((car) => {
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
    </Modal>
  );
}
