'use client';

import Link from 'next/link';

import { useExpertReviewedCars } from '@/hooks/useCarData';

import CarImage from './CarImage';
import styles from './ExpertReviewedStrip.module.css';

// Icons
const VerifiedIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
  </svg>
);

const ArrowRightIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const PlayIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

/**
 * ExpertReviewedStrip Component
 * 
 * Displays a horizontal strip of cars with expert reviews for the homepage.
 * Shows 6-8 cars with the highest expert review count.
 * 
 * Uses React Query for cached data fetching.
 */
export default function ExpertReviewedStrip() {
  const { data: cars = [], isLoading } = useExpertReviewedCars(8);

  // Don't render if no data or loading
  if (isLoading || cars.length === 0) {
    return null;
  }

  return (
    <section className={styles.strip}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <VerifiedIcon size={24} />
          <div>
            <h2 className={styles.title}>Expert-Reviewed Cars</h2>
            <p className={styles.subtitle}>
              Scores backed by {cars.reduce((sum, c) => sum + (c.expertReviewCount || 0), 0)}+ trusted video reviews
            </p>
          </div>
        </div>
        <Link href="/garage" className={styles.viewAll}>
          View All Cars
          <ArrowRightIcon size={14} />
        </Link>
      </div>

      <div className={styles.cardsContainer}>
        <div className={styles.cardsTrack}>
          {cars.map((car) => (
            <Link 
              key={car.slug} 
              href={`/browse-cars/${car.slug}#expert-reviews`}
              className={styles.card}
            >
              <div className={styles.cardImage}>
                <CarImage car={car} variant="thumbnail" showName={false} />
                <div className={styles.cardBadge}>
                  <PlayIcon size={10} />
                  {car.expertReviewCount} reviews
                </div>
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardName}>{car.name}</h3>
                <div className={styles.cardMeta}>
                  <span className={styles.cardScore}>
                    Score: {((car.sound + car.track + car.driverFun + car.value + car.reliability + car.interior + car.aftermarket) / 7).toFixed(1)}
                  </span>
                  <span className={styles.cardPrice}>{car.priceRange}</span>
                </div>
                {car.consensusQuote && (
                  <p className={styles.cardQuote}>"{car.consensusQuote}"</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.trustLine}>
        <VerifiedIcon size={14} />
        <span>
          Reviews from Throttle House, carwow, SavageGeese, Doug DeMuro, and more trusted channels
        </span>
      </div>
    </section>
  );
}

