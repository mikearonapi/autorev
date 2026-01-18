'use client';

/**
 * Performance Page - Dyno & Track Hub
 * 
 * Features:
 * 1. DYNO ESTIMATES - Projected power curves from builds
 * 2. TRACK TIMES - Lap time projections
 * 3. DATA LOGGING - Upload dyno sheets, log track sessions
 * 4. COMPARE - Estimated vs Actual performance
 * 
 * This is where builds come to life with real data.
 * Inspired by GRAVL's performance tracking features.
 */

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import CarImage from '@/components/CarImage';
import { fetchCars } from '@/lib/carsClient';

// Icons
const Icons = {
  gauge: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4"/>
      <path d="M12 18v4"/>
      <path d="M4.93 4.93l2.83 2.83"/>
      <path d="M16.24 16.24l2.83 2.83"/>
      <path d="M2 12h4"/>
      <path d="M18 12h4"/>
      <path d="M4.93 19.07l2.83-2.83"/>
      <path d="M16.24 7.76l2.83-2.83"/>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 12l2-2"/>
    </svg>
  ),
  track: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  chart: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  upload: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  plus: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  car: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  ),
};

// Sub-navigation tabs
const TABS = [
  { id: 'estimates', label: 'Estimates', Icon: Icons.gauge },
  { id: 'track', label: 'Track Log', Icon: Icons.track },
  { id: 'dyno', label: 'Dyno Log', Icon: Icons.chart },
];

// Performance Estimate Card
function EstimateCard({ build, car }) {
  const hpGain = build?.totalHpGain || 0;
  const tqGain = build?.totalTqGain || 0;
  const baseHp = car?.hp || 0;
  const baseTq = car?.torque || 0;
  
  return (
    <div className={styles.estimateCard}>
      <div className={styles.estimateCardHeader}>
        <div className={styles.estimateCarImage}>
          <CarImage car={car} variant="thumbnail" showName={false} />
        </div>
        <div className={styles.estimateCarInfo}>
          <span className={styles.estimateBuildName}>{build?.name || 'Build'}</span>
          <span className={styles.estimateCarName}>{car?.name}</span>
        </div>
      </div>
      
      <div className={styles.estimateStats}>
        <div className={styles.estimateStat}>
          <span className={styles.estimateStatLabel}>Est. Power</span>
          <span className={styles.estimateStatValue}>
            {baseHp + hpGain} <span className={styles.estimateStatUnit}>hp</span>
            {hpGain > 0 && <span className={styles.estimateStatGain}>+{hpGain}</span>}
          </span>
        </div>
        <div className={styles.estimateStat}>
          <span className={styles.estimateStatLabel}>Est. Torque</span>
          <span className={styles.estimateStatValue}>
            {baseTq + tqGain} <span className={styles.estimateStatUnit}>lb-ft</span>
            {tqGain > 0 && <span className={styles.estimateStatGain}>+{tqGain}</span>}
          </span>
        </div>
      </div>
      
      <div className={styles.estimateActions}>
        <Link href={`/build?build=${build?.id}`} className={styles.estimateActionBtn}>
          View Build
        </Link>
        <button className={styles.estimateActionBtn}>
          Log Actual
        </button>
      </div>
    </div>
  );
}

// Empty State
function EmptyState({ icon: IconComponent, title, description, actionLabel, onAction }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        {IconComponent && <IconComponent size={48} />}
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button className={styles.emptyAction} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// Track Session Card
function TrackSessionCard({ session }) {
  return (
    <div className={styles.sessionCard}>
      <div className={styles.sessionHeader}>
        <span className={styles.sessionTrack}>{session.trackName}</span>
        <span className={styles.sessionDate}>{session.date}</span>
      </div>
      <div className={styles.sessionStats}>
        <div className={styles.sessionStat}>
          <span className={styles.sessionStatLabel}>Best Lap</span>
          <span className={styles.sessionStatValue}>{session.bestLap}</span>
        </div>
        <div className={styles.sessionStat}>
          <span className={styles.sessionStatLabel}>Laps</span>
          <span className={styles.sessionStatValue}>{session.laps}</span>
        </div>
        <div className={styles.sessionStat}>
          <span className={styles.sessionStatLabel}>Conditions</span>
          <span className={styles.sessionStatValue}>{session.conditions}</span>
        </div>
      </div>
    </div>
  );
}

// Dyno Sheet Card
function DynoSheetCard({ sheet }) {
  return (
    <div className={styles.dynoCard}>
      <div className={styles.dynoHeader}>
        <span className={styles.dynoShop}>{sheet.shopName}</span>
        <span className={styles.dynoDate}>{sheet.date}</span>
      </div>
      <div className={styles.dynoStats}>
        <div className={styles.dynoStat}>
          <span className={styles.dynoStatLabel}>Peak HP</span>
          <span className={styles.dynoStatValue}>{sheet.peakHp}</span>
        </div>
        <div className={styles.dynoStat}>
          <span className={styles.dynoStatLabel}>Peak TQ</span>
          <span className={styles.dynoStatValue}>{sheet.peakTq}</span>
        </div>
      </div>
      {sheet.notes && (
        <p className={styles.dynoNotes}>{sheet.notes}</p>
      )}
    </div>
  );
}

// Main Page Component
export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState('estimates');
  const [allCars, setAllCars] = useState([]);
  
  const authState = useAuth() || {};
  const buildsState = useSavedBuilds() || {};
  const vehiclesState = useOwnedVehicles() || {};
  
  const isAuthenticated = authState.isAuthenticated || false;
  const builds = buildsState.builds || [];
  
  // Load cars
  useEffect(() => {
    let cancelled = false;
    const loadCars = async () => {
      try {
        const cars = await fetchCars();
        if (!cancelled && Array.isArray(cars)) {
          setAllCars(cars);
        }
      } catch (err) {
        console.error('[Performance] Failed to fetch cars:', err);
      }
    };
    loadCars();
    return () => { cancelled = true; };
  }, []);
  
  // Match builds with cars
  const buildsWithCars = useMemo(() => {
    if (allCars.length === 0 || builds.length === 0) return [];
    return builds.map(build => {
      const car = allCars.find(c => c.slug === build.carSlug);
      return { build, car };
    }).filter(b => b.car);
  }, [builds, allCars]);
  
  // Placeholder track sessions (would come from DB)
  const trackSessions = [];
  
  // Placeholder dyno sheets (would come from DB)
  const dynoSheets = [];
  
  return (
    <div className={styles.page}>
      {/* Page Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Performance</h1>
        <p className={styles.subtitle}>Track your builds' real-world performance</p>
      </header>
      
      {/* Tab Navigation */}
      <nav className={styles.tabNav}>
        {TABS.map(tab => {
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.id}
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <TabIcon size={18} />
              {tab.label}
            </button>
          );
        })}
      </nav>
      
      {/* Tab Content */}
      <div className={styles.content}>
        {/* Estimates Tab */}
        {activeTab === 'estimates' && (
          <div className={styles.estimatesTab}>
            {buildsWithCars.length > 0 ? (
              <>
                <div className={styles.sectionHeader}>
                  <h2>Build Estimates</h2>
                  <Link href="/build" className={styles.addLink}>
                    <Icons.plus size={16} />
                    New Build
                  </Link>
                </div>
                <div className={styles.estimatesList}>
                  {buildsWithCars.map(({ build, car }) => (
                    <EstimateCard key={build.id} build={build} car={car} />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={Icons.gauge}
                title="No Builds Yet"
                description="Create a build to see performance estimates for your vehicle"
                actionLabel="Start a Build"
                onAction={() => window.location.href = '/build'}
              />
            )}
          </div>
        )}
        
        {/* Track Log Tab */}
        {activeTab === 'track' && (
          <div className={styles.trackTab}>
            {trackSessions.length > 0 ? (
              <>
                <div className={styles.sectionHeader}>
                  <h2>Track Sessions</h2>
                  <button className={styles.addBtn}>
                    <Icons.plus size={16} />
                    Log Session
                  </button>
                </div>
                <div className={styles.sessionsList}>
                  {trackSessions.map(session => (
                    <TrackSessionCard key={session.id} session={session} />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={Icons.track}
                title="No Track Sessions"
                description="Log your track days to compare estimated vs actual performance"
                actionLabel="Log First Session"
                onAction={() => {/* Open log modal */}}
              />
            )}
          </div>
        )}
        
        {/* Dyno Log Tab */}
        {activeTab === 'dyno' && (
          <div className={styles.dynoTab}>
            {dynoSheets.length > 0 ? (
              <>
                <div className={styles.sectionHeader}>
                  <h2>Dyno Results</h2>
                  <button className={styles.addBtn}>
                    <Icons.upload size={16} />
                    Upload Sheet
                  </button>
                </div>
                <div className={styles.dynoList}>
                  {dynoSheets.map(sheet => (
                    <DynoSheetCard key={sheet.id} sheet={sheet} />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={Icons.chart}
                title="No Dyno Results"
                description="Upload dyno sheets to track your actual power numbers"
                actionLabel="Upload Dyno Sheet"
                onAction={() => {/* Open upload modal */}}
              />
            )}
          </div>
        )}
      </div>
      
      {/* Quick Stats - Always visible summary */}
      {buildsWithCars.length > 0 && (
        <div className={styles.quickStats}>
          <div className={styles.quickStat}>
            <span className={styles.quickStatValue}>{buildsWithCars.length}</span>
            <span className={styles.quickStatLabel}>Builds</span>
          </div>
          <div className={styles.quickStat}>
            <span className={styles.quickStatValue}>{trackSessions.length}</span>
            <span className={styles.quickStatLabel}>Track Days</span>
          </div>
          <div className={styles.quickStat}>
            <span className={styles.quickStatValue}>{dynoSheets.length}</span>
            <span className={styles.quickStatLabel}>Dyno Runs</span>
          </div>
        </div>
      )}
    </div>
  );
}
