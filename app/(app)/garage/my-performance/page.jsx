'use client';

/**
 * My Performance Page - Vehicle-Specific Performance Visualization
 * 
 * EXACT LIFT from UpgradeCenter's Performance Metrics and Experience Scores.
 * Shows the performance impact of upgrades on the user's vehicle:
 * - Performance Metrics (HP, 0-60, Braking, Grip)
 * - Experience Scores (Comfort, Reliability, Sound)
 */

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { MyGarageSubNav, VehicleInfoBar, HpGainStat } from '@/components/garage';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import { fetchCars } from '@/lib/carsClient';
import { useCarImages } from '@/hooks/useCarImages';
import { 
  getPerformanceProfile, 
  calculateTotalCost 
} from '@/lib/performance.js';

// ============================================================================
// ICONS - Exact same as UpgradeCenter
// ============================================================================
const Icons = {
  bolt: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  stopwatch: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 9v4l2 2"/>
      <path d="M9 2h6"/>
    </svg>
  ),
  target: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  disc: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  car: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  gauge: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  wrench: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
};

// ============================================================================
// METRIC ROW - Exact same component as UpgradeCenter
// ============================================================================
function MetricRow({ icon: Icon, label, stockValue, upgradedValue, unit, isLowerBetter = false }) {
  const stock = stockValue ?? 0;
  const upgraded = upgradedValue ?? stock;
  
  const hasImproved = isLowerBetter ? upgraded < stock : upgraded > stock;
  const improvement = Math.abs(upgraded - stock);
  
  const formatValue = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '—';
    if (unit === 'g') return val.toFixed(2);
    if (unit === 's') return val.toFixed(1);
    return Math.round(val);
  };
  
  const maxValues = { hp: 1200, s: 8, ft: 150, g: 1.6 };
  const maxValue = maxValues[unit === ' hp' ? 'hp' : unit] || 1200;
  
  const stockPercent = isLowerBetter 
    ? ((maxValue - stock) / maxValue) * 100 
    : (stock / maxValue) * 100;
  const upgradedPercent = isLowerBetter 
    ? ((maxValue - upgraded) / maxValue) * 100 
    : (upgraded / maxValue) * 100;
  
  return (
    <div className={styles.metric}>
      <div className={styles.metricHeader}>
        <span className={styles.metricLabel}><Icon size={12} />{label}</span>
        <span className={styles.metricValues}>
          {hasImproved ? (
            <>
              <span className={styles.stockVal}>{formatValue(stock)}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.upgradedVal}>{formatValue(upgraded)}{unit}</span>
              <span className={styles.gain}>{isLowerBetter ? '-' : '+'}{formatValue(improvement)}</span>
            </>
          ) : (
            <span className={styles.currentVal}>{formatValue(stock)}{unit}</span>
          )}
        </span>
      </div>
      <div className={styles.track}>
        <div className={styles.fillStock} style={{ width: `${Math.min(100, stockPercent)}%` }} />
        {hasImproved && (
          <div className={styles.fillUpgrade} style={{ left: `${stockPercent}%`, width: `${Math.abs(upgradedPercent - stockPercent)}%` }} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SCORE BAR - Exact same component as UpgradeCenter
// ============================================================================
function ScoreBar({ label, stockScore, upgradedScore }) {
  const safeStockScore = stockScore ?? 7;
  const safeUpgradedScore = upgradedScore ?? safeStockScore;
  const hasImproved = safeUpgradedScore > safeStockScore;
  const delta = safeUpgradedScore - safeStockScore;
  
  return (
    <div className={styles.scoreRow}>
      <div className={styles.scoreHeader}>
        <span className={styles.scoreLabel}>{label}</span>
        <span className={styles.scoreValues}>
          {hasImproved ? (
            <>
              <span className={styles.stockVal}>{safeStockScore.toFixed(1)}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.upgradedVal}>{safeUpgradedScore.toFixed(1)}</span>
            </>
          ) : (
            <span className={styles.currentVal}>{safeStockScore.toFixed(1)}/10</span>
          )}
        </span>
      </div>
      <div className={styles.track}>
        <div className={styles.fillStock} style={{ width: `${(safeStockScore / 10) * 100}%` }} />
        {hasImproved && (
          <div className={styles.fillUpgrade} style={{ left: `${(safeStockScore / 10) * 100}%`, width: `${(delta / 10) * 100}%` }} />
        )}
      </div>
    </div>
  );
}

// Empty State
function EmptyState() {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Icons.gauge size={64} />
      </div>
      <h2 className={styles.emptyTitle}>No Vehicle Selected</h2>
      <p className={styles.emptyDescription}>
        Select a vehicle to see performance predictions based on your build configuration.
      </p>
      <Link href="/garage" className={styles.emptyAction}>
        <Icons.car size={18} />
        Go to My Garage
      </Link>
    </div>
  );
}

function MyPerformanceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCar, setSelectedCar] = useState(null);
  const [currentBuildId, setCurrentBuildId] = useState(null);
  const [allCars, setAllCars] = useState([]);
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const authModal = useAuthModal();
  const { builds, isLoading: buildsLoading, getBuildById } = useSavedBuilds();
  
  // Get user's hero image for this car
  const { heroImageUrl } = useCarImages(selectedCar?.slug, { enabled: !!selectedCar?.slug });
  
  // Get URL params
  const buildIdParam = searchParams.get('build');
  const carSlugParam = searchParams.get('car');
  
  // Fetch all cars
  useEffect(() => {
    fetchCars().then(cars => {
      if (Array.isArray(cars)) setAllCars(cars);
    });
  }, []);
  
  // Load build or car from URL params
  useEffect(() => {
    if (allCars.length === 0) return;
    
    if (buildIdParam && !buildsLoading) {
      const build = builds.find(b => b.id === buildIdParam);
      if (build) {
        const car = allCars.find(c => c.slug === build.carSlug);
        if (car) {
          setSelectedCar(car);
          setCurrentBuildId(build.id);
        }
      }
    } else if (carSlugParam) {
      const car = allCars.find(c => c.slug === carSlugParam);
      if (car) {
        setSelectedCar(car);
      }
    }
  }, [buildIdParam, carSlugParam, builds, buildsLoading, allCars]);
  
  // Get current build data
  const currentBuild = useMemo(() => {
    if (!currentBuildId) return null;
    return builds.find(b => b.id === currentBuildId);
  }, [currentBuildId, builds]);
  
  // Get selected upgrades from build
  const effectiveModules = useMemo(() => {
    if (!currentBuild?.upgrades) return [];
    return currentBuild.upgrades;
  }, [currentBuild]);
  
  // Calculate BASIC performance profile (used as baseline)
  const basicProfile = useMemo(() => {
    if (!selectedCar) {
      return {
        stockMetrics: { hp: 0, zeroToSixty: 0, braking60To0: 0, lateralG: 0 },
        upgradedMetrics: { hp: 0, zeroToSixty: 0, braking60To0: 0, lateralG: 0 },
        stockScores: { drivability: 7, reliabilityHeat: 7.5, soundEmotion: 8 },
        upgradedScores: { drivability: 7, reliabilityHeat: 7.5, soundEmotion: 8 },
        selectedUpgrades: [],
      };
    }
    return getPerformanceProfile(selectedCar, effectiveModules);
  }, [selectedCar, effectiveModules]);
  
  // Use SAVED HP values from the build (includes advanced calculations if used)
  // This ensures Performance page shows the same values as when the build was saved
  const profile = useMemo(() => {
    const stockHp = selectedCar?.hp || basicProfile.stockMetrics.hp || 0;
    
    // If build has saved finalHp and totalHpGain, use those (more accurate)
    if (currentBuild?.finalHp && currentBuild?.totalHpGain !== undefined) {
      return {
        ...basicProfile,
        stockMetrics: {
          ...basicProfile.stockMetrics,
          hp: stockHp,
        },
        upgradedMetrics: {
          ...basicProfile.upgradedMetrics,
          hp: currentBuild.finalHp,
        },
      };
    }
    
    return basicProfile;
  }, [currentBuild, selectedCar, basicProfile]);
  
  // Calculate total cost
  const totalCost = useMemo(() => {
    if (!selectedCar) return { low: 0, high: 0, confidence: 'estimated', confidencePercent: 0 };
    // Use saved cost if available
    if (currentBuild?.totalCostLow) {
      return { 
        low: currentBuild.totalCostLow, 
        high: currentBuild.totalCostHigh || currentBuild.totalCostLow,
        confidence: 'saved',
        confidencePercent: 100 
      };
    }
    return calculateTotalCost(basicProfile.selectedUpgrades, selectedCar);
  }, [currentBuild, basicProfile.selectedUpgrades, selectedCar]);
  
  // Use saved HP gain if available, otherwise calculate
  const hpGain = currentBuild?.totalHpGain ?? (profile.upgradedMetrics.hp - profile.stockMetrics.hp);
  const showUpgrade = effectiveModules.length > 0 || hpGain > 0;
  
  const handleBack = () => {
    router.push('/garage');
  };
  
  // Loading state
  const isLoading = authLoading || buildsLoading || (buildIdParam && allCars.length === 0);
  
  if (isLoading) {
    return (
      <div className={styles.page}>
        <LoadingSpinner 
          variant="branded" 
          text="Loading Performance" 
          subtext="Calculating your numbers..."
          fullPage 
        />
      </div>
    );
  }
  
  // No car selected
  if (!selectedCar) {
    return (
      <div className={styles.page}>
        <MyGarageSubNav 
          carSlug={carSlugParam}
          buildId={buildIdParam}
          onBack={handleBack}
        />
        <EmptyState />
        <AuthModal {...authModal.props} />
      </div>
    );
  }
  
  return (
    <div className={styles.page}>
      <MyGarageSubNav 
        carSlug={selectedCar.slug}
        buildId={currentBuildId}
        onBack={handleBack}
      />
      
      {/* Vehicle Info Bar */}
      <VehicleInfoBar
        car={selectedCar}
        buildName={currentBuild?.name}
        stat={<HpGainStat hpGain={hpGain} totalHp={currentBuild?.finalHp || profile.upgradedMetrics.hp} />}
        heroImageUrl={heroImageUrl}
      />
      
      {/* Performance Content - EXACT same layout as UpgradeCenter */}
      <div className={styles.content}>
        
        {/* === PERFORMANCE METRICS CARD - Exact copy from UpgradeCenter === */}
        <div className={styles.performanceCard}>
          <div className={styles.performanceHeader}>
            <h3 className={styles.performanceTitle}>
              <Icons.bolt size={18} />
              Performance Metrics
            </h3>
            {showUpgrade && totalCost.low > 0 && (
              <div className={styles.buildStats}>
                <span 
                  className={`${styles.costBadge} ${totalCost.confidence === 'verified' ? styles.costVerified : totalCost.confidence === 'high' ? styles.costHigh : styles.costEstimated}`}
                  title={`${totalCost.confidence === 'verified' ? 'Verified pricing' : totalCost.confidence === 'high' ? 'High confidence estimate' : 'Estimated pricing'}`}
                >
                  ${(totalCost.low || 0).toLocaleString()}
                </span>
              </div>
            )}
          </div>
          <div className={styles.performanceMetrics}>
            <MetricRow 
              icon={Icons.bolt} 
              label="HP" 
              stockValue={profile.stockMetrics.hp} 
              upgradedValue={profile.upgradedMetrics.hp} 
              unit=" hp" 
            />
            <MetricRow 
              icon={Icons.stopwatch} 
              label="0-60" 
              stockValue={profile.stockMetrics.zeroToSixty} 
              upgradedValue={profile.upgradedMetrics.zeroToSixty} 
              unit="s" 
              isLowerBetter 
            />
            <MetricRow 
              icon={Icons.disc} 
              label="Braking" 
              stockValue={profile.stockMetrics.braking60To0} 
              upgradedValue={profile.upgradedMetrics.braking60To0} 
              unit="ft" 
              isLowerBetter 
            />
            <MetricRow 
              icon={Icons.target} 
              label="Grip" 
              stockValue={profile.stockMetrics.lateralG} 
              upgradedValue={profile.upgradedMetrics.lateralG} 
              unit="g" 
            />
          </div>
        </div>
        
        {/* === EXPERIENCE SCORES - Exact copy from UpgradeCenter === */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Experience Scores</h4>
          <ScoreBar label="Comfort" stockScore={profile?.stockScores?.drivability ?? 7} upgradedScore={profile?.upgradedScores?.drivability ?? 7} />
          <ScoreBar label="Reliability" stockScore={profile?.stockScores?.reliabilityHeat ?? 7.5} upgradedScore={profile?.upgradedScores?.reliabilityHeat ?? 7.5} />
          <ScoreBar label="Sound" stockScore={profile?.stockScores?.soundEmotion ?? 8} upgradedScore={profile?.upgradedScores?.soundEmotion ?? 8} />
        </div>
        
        {/* CTA to Build - if no upgrades configured */}
        {!showUpgrade && (
          <section className={styles.ctaSection}>
            <p className={styles.ctaText}>
              Configure upgrades to see projected performance gains
            </p>
            <Link 
              href={`/garage/my-build?car=${selectedCar.slug}`}
              className={styles.ctaButton}
            >
              <Icons.wrench size={18} />
              Configure Build
            </Link>
          </section>
        )}
      </div>
      
      <AuthModal {...authModal.props} />
    </div>
  );
}

function MyPerformanceLoading() {
  return (
    <div className={styles.page}>
      <LoadingSpinner 
        variant="branded" 
        text="Loading Performance" 
        subtext="Calculating your numbers..."
        fullPage 
      />
    </div>
  );
}

export default function MyPerformancePage() {
  return (
    <ErrorBoundary name="MyPerformancePage" featureContext="garage-my-performance">
      <Suspense fallback={<MyPerformanceLoading />}>
        <MyPerformanceContent />
      </Suspense>
    </ErrorBoundary>
  );
}
