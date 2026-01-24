'use client';

/**
 * Car Detail Page Async Sections
 *
 * Suspense-ready async components for streaming enriched data.
 * Each section fetches its own data and can load independently.
 *
 * @module app/browse-cars/[slug]/CarDetailSections
 */

/* eslint-disable @typescript-eslint/no-var-requires */

import { Suspense } from 'react';

import styles from './page.module.css';

// Loading skeleton components
function SectionSkeleton({ title: _title, icon }) {
  return (
    <div className={styles.contentSection}>
      <div className={styles.sectionHeader}>
        {icon}
        <div className={styles.skeletonSectionHeader} />
      </div>
      <div className={styles.skeletonParagraph} />
      <div className={styles.skeletonParagraph} />
      <div className={styles.skeletonParagraph} style={{ width: '60%' }} />
    </div>
  );
}

/**
 * Async Fuel Economy Section Wrapper
 * Provides Suspense boundary for streaming
 */
export function AsyncFuelEconomySection({ carSlug }) {
  const { FuelEconomySection } = require('@/components/CarDetailSections');

  return (
    <Suspense fallback={<SectionSkeleton title="Fuel Economy" />}>
      <FuelEconomySection carSlug={carSlug} />
    </Suspense>
  );
}

/**
 * Async Safety Ratings Section Wrapper
 * Provides Suspense boundary for streaming
 */
export function AsyncSafetySection({ carSlug }) {
  const { SafetyRatingsSection } = require('@/components/CarDetailSections');

  return (
    <Suspense fallback={<SectionSkeleton title="Safety Ratings" />}>
      <SafetyRatingsSection carSlug={carSlug} />
    </Suspense>
  );
}

/**
 * Async Price By Year Section Wrapper
 * Provides Suspense boundary for streaming
 */
export function AsyncPriceByYearSection({ carSlug, carName }) {
  const { PriceByYearSection } = require('@/components/CarDetailSections');

  return (
    <Suspense fallback={<SectionSkeleton title="Price by Model Year" />}>
      <PriceByYearSection carSlug={carSlug} carName={carName} />
    </Suspense>
  );
}

/**
 * Async Expert Reviews Section Wrapper
 * Provides Suspense boundary for streaming
 */
export function AsyncExpertReviewsSection({ carSlug, car }) {
  const ExpertReviews = require('@/components/ExpertReviews').default;

  return (
    <Suspense fallback={<SectionSkeleton title="Expert Reviews" />}>
      <ExpertReviews carSlug={carSlug} car={car} />
    </Suspense>
  );
}

/**
 * Async Lap Times Section Wrapper
 * Provides Suspense boundary for streaming
 */
export function AsyncLapTimesSection({ carSlug, carName, isTeaser }) {
  const { LapTimesSection } = require('@/components/PerformanceData');

  return (
    <Suspense fallback={<SectionSkeleton title="Track Lap Times" />}>
      <LapTimesSection carSlug={carSlug} carName={carName} isTeaser={isTeaser} />
    </Suspense>
  );
}

const CarDetailSections = {
  AsyncFuelEconomySection,
  AsyncSafetySection,
  AsyncPriceByYearSection,
  AsyncExpertReviewsSection,
  AsyncLapTimesSection,
};

export default CarDetailSections;
