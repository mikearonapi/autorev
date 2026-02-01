'use client';

/**
 * Performance Data Components
 *
 * Displays dyno runs and lap times data from the database.
 * Tuner tier feature - shows real performance data from actual cars.
 * Uses React Query for caching and automatic deduplication.
 */

import React from 'react';

import { Icons } from '@/components/ui/Icons';
import { useCarDynoRuns, useCarLapTimes } from '@/hooks/useCarData';
import { TEASER_LIMITS } from '@/lib/tierAccess';

import styles from './PerformanceData.module.css';
import PremiumGate, { TeaserPrompt, usePremiumAccess } from './PremiumGate';

/**
 * Dyno Data Section
 * Shows real HP/torque measurements from dynamometer runs
 * Uses React Query for caching
 */
export function DynoDataSection({ carId: _carId, car, carSlug: _carSlug, carName, limit = null }) {
  const { hasAccess, showUpgradePrompt } = usePremiumAccess('dynoDatabase');

  // Derive slug from car object if available
  const slugForApi = car?.slug || _carSlug;

  // Use React Query for dyno data
  const {
    data: dynoData,
    isLoading: loading,
    error,
    refetch,
  } = useCarDynoRuns(slugForApi, { limit: 20 });

  const dynoRuns = dynoData?.runs || [];

  // Determine how many to show
  const displayLimit = hasAccess ? limit || dynoRuns.length : TEASER_LIMITS.dynoRuns;
  const displayedRuns = dynoRuns.slice(0, displayLimit);
  const hasMore = dynoRuns.length > displayLimit;

  if (loading) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icons.activity size={20} />
          <h3>Dyno Results</h3>
        </div>
        <div className={styles.loadingState}>
          <Icons.loader size={24} className={styles.spinner} />
          <span>Loading dyno data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icons.activity size={20} />
          <h3>Dyno Results</h3>
        </div>
        <div className={styles.errorState}>
          <Icons.info size={20} />
          <span>Unable to load dyno data</span>
          <button className={styles.retryButton} onClick={() => refetch()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (dynoRuns.length === 0) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icons.activity size={20} />
          <h3>Dyno Results</h3>
        </div>
        <div className={styles.emptyState}>
          <Icons.activity size={32} />
          <p>No dyno data available yet for {carName || 'this car'}</p>
          <span className={styles.emptyHint}>Community dyno submissions coming soon</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <Icons.activity size={20} />
        <h3>Dyno Results</h3>
        <span className={styles.badge}>{dynoRuns.length} runs</span>
      </div>

      <p className={styles.sectionDescription}>
        Real horsepower and torque measurements from actual {carName || 'cars'} on the dyno.
      </p>

      {showUpgradePrompt && displayLimit === 0 ? (
        <PremiumGate feature="dynoDatabase" variant="compact" />
      ) : (
        <>
          <div className={styles.dynoGrid}>
            {displayedRuns.map((run, idx) => (
              <div key={run.id || idx} className={styles.dynoCard}>
                <div className={styles.dynoHeader}>
                  <div className={styles.dynoMods}>{run.mod_level || 'Stock'}</div>
                  {run.verified && <span className={styles.verifiedBadge}>Verified</span>}
                </div>

                <div className={styles.dynoStats}>
                  <div className={styles.dynoStat}>
                    <span className={styles.dynoValue}>{run.peak_whp || run.peak_hp}</span>
                    <span className={styles.dynoLabel}>{run.peak_whp ? 'WHP' : 'HP'}</span>
                  </div>
                  <div className={styles.dynoStat}>
                    <span className={styles.dynoValue}>{run.peak_wtq || run.peak_tq}</span>
                    <span className={styles.dynoLabel}>{run.peak_wtq ? 'WTQ' : 'TQ'}</span>
                  </div>
                </div>

                {run.mods_description && <p className={styles.dynoMods}>{run.mods_description}</p>}

                <div className={styles.dynoMeta}>
                  {run.dyno_type && <span>{run.dyno_type}</span>}
                  {run.source_url && (
                    <a
                      href={run.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.sourceLink}
                    >
                      Source <Icons.externalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasMore && showUpgradePrompt && (
            <TeaserPrompt
              message={`Showing ${displayLimit} of ${dynoRuns.length} dyno runs`}
              totalCount={dynoRuns.length}
              shownCount={displayLimit}
              targetTier="tuner"
            />
          )}
        </>
      )}
    </div>
  );
}

/**
 * Lap Times Section
 * Shows track benchmark times from various venues
 * Uses React Query for caching
 */
export function LapTimesSection({
  carId: _carId,
  car,
  carSlug: _carSlug,
  carName,
  limit = null,
  isTeaser = false,
}) {
  const { hasAccess, showUpgradePrompt } = usePremiumAccess('fullLapTimes');

  // Derive slug from car object if available
  const slugForApi = car?.slug || _carSlug;

  // Use React Query for lap times
  const {
    data: lapTimesData,
    isLoading: loading,
    error,
    refetch,
  } = useCarLapTimes(slugForApi, { limit: 20 });

  const lapTimes = lapTimesData?.lapTimes || [];

  // Determine display limit based on context and access
  const effectiveLimit = isTeaser
    ? TEASER_LIMITS.lapTimes
    : hasAccess
      ? limit || lapTimes.length
      : TEASER_LIMITS.lapTimes;
  const displayedTimes = lapTimes.slice(0, effectiveLimit);
  const hasMore = lapTimes.length > effectiveLimit;

  if (loading) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icons.flag size={20} />
          <h3>Track Lap Times</h3>
        </div>
        <div className={styles.loadingState}>
          <Icons.loader size={24} className={styles.spinner} />
          <span>Loading lap times...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icons.flag size={20} />
          <h3>Track Lap Times</h3>
        </div>
        <div className={styles.errorState}>
          <Icons.info size={20} />
          <span>Unable to load lap times</span>
          <button className={styles.retryButton} onClick={() => refetch()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (lapTimes.length === 0) {
    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Icons.flag size={20} />
          <h3>Track Lap Times</h3>
        </div>
        <div className={styles.emptyState}>
          <Icons.flag size={32} />
          <p>No lap time data available yet for {carName || 'this car'}</p>
          <span className={styles.emptyHint}>Track data is being added regularly</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <Icons.flag size={20} />
        <h3>Track Lap Times</h3>
        <span className={styles.badge}>{lapTimes.length} tracks</span>
      </div>

      {!isTeaser && (
        <p className={styles.sectionDescription}>
          Benchmark lap times from real track sessions with {carName || 'this car'}.
        </p>
      )}

      <div className={styles.lapTimesTable}>
        <div className={styles.tableHeader}>
          <span>Track</span>
          <span>Layout</span>
          <span>Time</span>
          <span>Driver/Source</span>
        </div>

        {displayedTimes.map((lap, idx) => (
          <div key={lap.id || idx} className={styles.tableRow}>
            <span className={styles.trackName}>{lap.track_name || lap.venue_name}</span>
            <span className={styles.layoutName}>{lap.layout_name || 'Full Course'}</span>
            <span className={styles.lapTime}>{formatLapTime(lap.lap_time_seconds)}</span>
            <span className={styles.source}>
              {lap.driver_name || lap.source || '—'}
              {lap.source_url && (
                <a
                  href={lap.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.sourceLink}
                >
                  <Icons.externalLink size={12} />
                </a>
              )}
            </span>
          </div>
        ))}
      </div>

      {hasMore &&
        (isTeaser ? (
          <TeaserPrompt
            message={`${lapTimes.length - effectiveLimit} more lap times available`}
            totalCount={lapTimes.length}
            shownCount={effectiveLimit}
            targetTier="tuner"
            variant="subtle"
          />
        ) : showUpgradePrompt ? (
          <TeaserPrompt
            message={`Showing ${effectiveLimit} of ${lapTimes.length} lap times`}
            totalCount={lapTimes.length}
            shownCount={effectiveLimit}
            targetTier="tuner"
          />
        ) : null)}
    </div>
  );
}

/**
 * Combined Performance Data Panel
 * Shows both dyno and lap times in a unified view
 */
export default function PerformanceDataPanel({ carId: _carId, car, carSlug: _carSlug, carName }) {
  const { hasAccess: _hasAccess } = usePremiumAccess('dynoDatabase');

  return (
    <PremiumGate
      feature="dynoDatabase"
      fallback={
        <div className={styles.premiumFallback}>
          <div className={styles.fallbackHeader}>
            <Icons.zap size={24} />
            <h3>Performance Intelligence</h3>
          </div>
          <p>Get real dyno numbers and track lap times from actual {carName || 'cars'}.</p>
          <div className={styles.fallbackFeatures}>
            <div className={styles.fallbackFeature}>
              <Icons.activity size={18} />
              <span>Dyno Results</span>
            </div>
            <div className={styles.fallbackFeature}>
              <Icons.flag size={18} />
              <span>Track Lap Times</span>
            </div>
          </div>
          <PremiumGate feature="dynoDatabase" variant="compact" />
        </div>
      }
    >
      <div className={styles.performancePanel}>
        <DynoDataSection carId={_carId} car={car} carName={carName} />
        <LapTimesSection carId={_carId} car={car} carName={carName} />
      </div>
    </PremiumGate>
  );
}

// Helper to format lap time in seconds to MM:SS.mmm
function formatLapTime(seconds) {
  if (!seconds) return '—';

  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);

  if (mins > 0) {
    return `${mins}:${secs.padStart(6, '0')}`;
  }
  return `${secs}s`;
}
