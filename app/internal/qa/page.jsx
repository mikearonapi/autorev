'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';

import styles from './page.module.css';

/**
 * Internal QA Page
 * 
 * Displays expert coverage and score discrepancies for internal review.
 * Not linked from public navigation.
 * 
 * Access at: /internal/qa
 */
export default function QAPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('discrepancies'); // 'all' | 'discrepancies' | 'missing'

  useEffect(() => {
    async function fetchReport() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/internal/qa-report');
        if (!response.ok) throw new Error('Failed to fetch QA report');
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading QA report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  const filteredCars = data?.cars?.filter(car => {
    if (filter === 'discrepancies') return car.hasDiscrepancies;
    if (filter === 'missing') return car.reviewCount === 0;
    return true;
  }) || [];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Internal QA: Expert Review Analysis</h1>
        <p className={styles.subtitle}>
          Review external consensus vs internal scores to identify potential updates
        </p>
      </header>

      {/* Summary Stats */}
      {data?.summary && (
        <div className={styles.summary}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{data.summary.totalCars}</span>
            <span className={styles.statLabel}>Total Cars</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{data.summary.carsWithReviews}</span>
            <span className={styles.statLabel}>With Reviews</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{data.summary.totalReviews}</span>
            <span className={styles.statLabel}>Total Reviews</span>
          </div>
          <div className={`${styles.stat} ${styles.alert}`}>
            <span className={styles.statValue}>{data.summary.carsWithDiscrepancies}</span>
            <span className={styles.statLabel}>Need Review</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <button 
          className={`${styles.filterBtn} ${filter === 'discrepancies' ? styles.active : ''}`}
          onClick={() => setFilter('discrepancies')}
        >
          Score Discrepancies ({data?.summary?.carsWithDiscrepancies || 0})
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === 'missing' ? styles.active : ''}`}
          onClick={() => setFilter('missing')}
        >
          Missing Reviews ({(data?.summary?.totalCars || 0) - (data?.summary?.carsWithReviews || 0)})
        </button>
        <button 
          className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          All Cars
        </button>
      </div>

      {/* Cars List */}
      <div className={styles.carsList}>
        {filteredCars.map(car => (
          <div 
            key={car.slug} 
            className={`${styles.carCard} ${car.hasDiscrepancies ? styles.hasIssues : ''}`}
          >
            <div className={styles.carHeader}>
              <div>
                <h2 className={styles.carName}>{car.name}</h2>
                <span className={styles.reviewCount}>
                  {car.reviewCount} expert review{car.reviewCount !== 1 ? 's' : ''}
                </span>
              </div>
              <Link href={`/browse-cars/${car.slug}`} className={styles.viewLink}>
                View Page →
              </Link>
            </div>

            {/* Discrepancies */}
            {car.discrepancies.length > 0 && (
              <div className={styles.discrepancies}>
                <h3>Score Discrepancies</h3>
                <div className={styles.discrepancyGrid}>
                  {car.discrepancies.map((d, i) => (
                    <div key={i} className={`${styles.discrepancy} ${styles[d.direction]}`}>
                      <span className={styles.discrepancyCategory}>{d.category}</span>
                      <div className={styles.discrepancyScores}>
                        <span>Internal: <strong>{d.internalScore}/10</strong></span>
                        <span className={styles.arrow}>{d.direction === 'up' ? '↑' : '↓'}</span>
                        <span>External: <strong>{d.externalSentiment}</strong></span>
                      </div>
                      <span className={styles.suggestion}>{d.suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Weaknesses */}
            <div className={styles.tagsRow}>
              {car.topStrengths.length > 0 && (
                <div className={styles.tagGroup}>
                  <span className={styles.tagLabel}>Praised:</span>
                  {car.topStrengths.map((s, i) => (
                    <span key={i} className={`${styles.tag} ${styles.strength}`}>
                      {s.tag} ({s.count})
                    </span>
                  ))}
                </div>
              )}
              {car.topWeaknesses.length > 0 && (
                <div className={styles.tagGroup}>
                  <span className={styles.tagLabel}>Issues:</span>
                  {car.topWeaknesses.map((w, i) => (
                    <span key={i} className={`${styles.tag} ${styles.weakness}`}>
                      {w.tag} ({w.count})
                    </span>
                  ))}
                </div>
              )}
            </div>

            {car.reviewCount === 0 && (
              <div className={styles.noReviews}>
                No expert reviews captured yet
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredCars.length === 0 && (
        <div className={styles.empty}>
          No cars match the current filter
        </div>
      )}
    </div>
  );
}

