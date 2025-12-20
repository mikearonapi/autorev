'use client';

/**
 * Performance Data Components
 * 
 * Displays dyno runs and lap times data from the database.
 * Tuner tier feature - shows real performance data from actual cars.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PremiumGate, { TeaserPrompt, usePremiumAccess } from './PremiumGate';
import { TEASER_LIMITS } from '@/lib/tierAccess';
import styles from './PerformanceData.module.css';

// Icons
const Icons = {
  gauge: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  flag: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  zap: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  activity: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  externalLink: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  loader: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
    </svg>
  ),
  info: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

/**
 * Dyno Data Section
 * Shows real HP/torque measurements from dynamometer runs
 */
export function DynoDataSection({ carSlug, carName, limit = null }) {
  const [dynoRuns, setDynoRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { hasAccess, showUpgradePrompt } = usePremiumAccess('dynoDatabase');
  
  useEffect(() => {
    let isCancelled = false;
    
    const fetchDynoData = async () => {
      if (!carSlug) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Use the RPC function we created
        const response = await fetch(`/api/cars/${carSlug}/dyno`);
        if (!response.ok) throw new Error('Failed to fetch dyno data');
        
        const data = await response.json();
        if (!isCancelled) setDynoRuns(data.runs || []);
      } catch (err) {
        console.error('[DynoDataSection] Error:', err);
        if (!isCancelled) setError(err.message);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    
    fetchDynoData();
    return () => { isCancelled = true; };
  }, [carSlug]);
  
  // Determine how many to show
  const displayLimit = hasAccess ? (limit || dynoRuns.length) : TEASER_LIMITS.dynoRuns;
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
  
  // Refetch function for retry
  const refetchDyno = () => {
    setError(null);
    setLoading(true);
    fetch(`/api/cars/${carSlug}/dyno`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch dyno data');
        return res.json();
      })
      .then(data => setDynoRuns(data.runs || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

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
          <button className={styles.retryButton} onClick={refetchDyno}>
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
          <span className={styles.emptyHint}>
            Community dyno submissions coming soon
          </span>
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
                  <div className={styles.dynoMods}>
                    {run.mod_level || 'Stock'}
                  </div>
                  {run.verified && (
                    <span className={styles.verifiedBadge}>Verified</span>
                  )}
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
                
                {run.mods_description && (
                  <p className={styles.dynoMods}>{run.mods_description}</p>
                )}
                
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
 */
export function LapTimesSection({ carSlug, carName, limit = null, isTeaser = false }) {
  const [lapTimes, setLapTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { hasAccess, showUpgradePrompt } = usePremiumAccess('fullLapTimes');
  
  useEffect(() => {
    let isCancelled = false;
    
    const fetchLapTimes = async () => {
      if (!carSlug) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/cars/${carSlug}/lap-times`);
        if (!response.ok) throw new Error('Failed to fetch lap times');
        
        const data = await response.json();
        if (!isCancelled) setLapTimes(data.lapTimes || []);
      } catch (err) {
        console.error('[LapTimesSection] Error:', err);
        if (!isCancelled) setError(err.message);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    
    fetchLapTimes();
    return () => { isCancelled = true; };
  }, [carSlug]);
  
  // Determine display limit based on context and access
  const effectiveLimit = isTeaser 
    ? TEASER_LIMITS.lapTimes 
    : (hasAccess ? (limit || lapTimes.length) : TEASER_LIMITS.lapTimes);
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
  
  // Refetch function for retry
  const refetchLapTimes = () => {
    setError(null);
    setLoading(true);
    fetch(`/api/cars/${carSlug}/lap-times`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch lap times');
        return res.json();
      })
      .then(data => setLapTimes(data.lapTimes || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

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
          <button className={styles.retryButton} onClick={refetchLapTimes}>
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
          <span className={styles.emptyHint}>
            Track data is being added regularly
          </span>
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
            <span className={styles.trackName}>
              {lap.track_name || lap.venue_name}
            </span>
            <span className={styles.layoutName}>
              {lap.layout_name || 'Full Course'}
            </span>
            <span className={styles.lapTime}>
              {formatLapTime(lap.lap_time_seconds)}
            </span>
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
      
      {hasMore && (
        isTeaser ? (
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
        ) : null
      )}
    </div>
  );
}

/**
 * Combined Performance Data Panel
 * Shows both dyno and lap times in a unified view
 */
export default function PerformanceDataPanel({ carSlug, carName }) {
  const { hasAccess } = usePremiumAccess('dynoDatabase');
  
  return (
    <PremiumGate 
      feature="dynoDatabase" 
      fallback={
        <div className={styles.premiumFallback}>
          <div className={styles.fallbackHeader}>
            <Icons.zap size={24} />
            <h3>Performance Intelligence</h3>
          </div>
          <p>
            Get real dyno numbers and track lap times from actual {carName || 'cars'}.
          </p>
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
        <DynoDataSection carSlug={carSlug} carName={carName} />
        <LapTimesSection carSlug={carSlug} carName={carName} />
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













