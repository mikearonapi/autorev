'use client';

/**
 * My Performance Page - Vehicle-Specific Performance Visualization
 * 
 * EXACT LIFT from UpgradeCenter's Performance Metrics and Experience Scores.
 * Shows the performance impact of upgrades on the user's vehicle:
 * - Performance Metrics (HP, 0-60, Braking, Grip)
 * - Experience Scores (Comfort, Reliability, Sound)
 */

import React, { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { MyGarageSubNav, GarageVehicleSelector } from '@/components/garage';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import { useCarsList, useCarBySlug } from '@/hooks/useCarData';
import { useCarImages } from '@/hooks/useCarImages';
import ShareBuildButton from '@/components/ShareBuildButton';
import { getPerformanceProfile } from '@/lib/performanceCalculator';
import { useAIChat } from '@/components/AIChatContext';
import { Icons } from '@/components/ui/Icons';

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
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const authModal = useAuthModal();
  const { builds, isLoading: buildsLoading, getBuildById } = useSavedBuilds();
  const { vehicles } = useOwnedVehicles();
  const { openChatWithPrompt } = useAIChat();
  
  // Use cached cars data from React Query hook
  const { data: allCars = [], isLoading: carsLoading } = useCarsList();
  
  // Get URL params
  const buildIdParam = searchParams.get('build');
  const carSlugParam = searchParams.get('car');
  
  // Fallback: fetch single car if not in list
  const { data: fallbackCar, isLoading: fallbackLoading } = useCarBySlug(carSlugParam, {
    enabled: !!carSlugParam && allCars.length === 0 && !carsLoading,
  });
  
  // Get user's hero image for this car
  const { heroImageUrl } = useCarImages(selectedCar?.slug, { enabled: !!selectedCar?.slug });
  
  // Load build or car from URL params (with fallback support)
  useEffect(() => {
    if (allCars.length > 0) {
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
    } else if (fallbackCar && carSlugParam) {
      // Fallback: use directly fetched car when list is unavailable
      setSelectedCar(fallbackCar);
    }
  }, [buildIdParam, carSlugParam, builds, buildsLoading, allCars, fallbackCar]);
  
  // Get current build data
  const currentBuild = useMemo(() => {
    if (!currentBuildId) return null;
    return builds.find(b => b.id === currentBuildId);
  }, [currentBuildId, builds]);

  // Owned vehicle for this car (SOURCE OF TRUTH for installed mods)
  const userVehicle = useMemo(() => {
    if (!selectedCar?.slug || !Array.isArray(vehicles)) return null;
    return vehicles.find(v => v.matchedCarSlug === selectedCar.slug) || null;
  }, [vehicles, selectedCar?.slug]);
  
  // Get selected upgrades from build
  // IMPORTANT: Normalize to string keys - getPerformanceProfile expects ['intake', 'stage1-tune', ...]
  // The database may store full objects or just keys depending on how the build was saved
  const effectiveModules = useMemo(() => {
    if (!currentBuild?.upgrades) return [];
    
    // Normalize: if upgrades are objects, extract keys; if strings, use directly
    return currentBuild.upgrades.map(u => typeof u === 'string' ? u : u.key).filter(Boolean);
  }, [currentBuild]);

  // SOURCE OF TRUTH:
  // - For OWNED vehicles, calculate from vehicle.installedModifications (what's actually installed)
  // - Only fall back to build upgrades when there is no owned vehicle record / no installed mods
  const calculationModules = useMemo(() => {
    const installed = userVehicle?.installedModifications || [];
    return installed.length > 0 ? installed : effectiveModules;
  }, [userVehicle?.installedModifications, effectiveModules]);
  
  // SOURCE OF TRUTH: Calculate performance profile dynamically
  // getPerformanceProfile internally uses calculateSmartHpGain for consistent HP calculations
  // Never use stored values (currentBuild?.totalHpGain) - they can become stale
  // See docs/SOURCE_OF_TRUTH.md Rule 8
  const profile = useMemo(() => {
    if (!selectedCar) {
      return {
        stockMetrics: { hp: 0, zeroToSixty: 0, braking60To0: 0, lateralG: 0 },
        upgradedMetrics: { hp: 0, zeroToSixty: 0, braking60To0: 0, lateralG: 0 },
        stockScores: { drivability: 7, reliabilityHeat: 7.5, soundEmotion: 8 },
        upgradedScores: { drivability: 7, reliabilityHeat: 7.5, soundEmotion: 8 },
        selectedUpgrades: [],
      };
    }
    return getPerformanceProfile(selectedCar, calculationModules);
  }, [selectedCar, calculationModules]);
  
  // HP gain is ALWAYS calculated dynamically - never use stored values
  const hpGain = profile.upgradedMetrics.hp - profile.stockMetrics.hp;
  const showUpgrade = calculationModules.length > 0 || hpGain > 0;
  
  const handleBack = () => {
    router.push('/garage');
  };
  
  // Create contextualized AL prompt handlers for performance sections
  const askALAboutPerformance = useCallback((section) => {
    if (!selectedCar) return;
    
    const carName = selectedCar.name;
    const upgradeCount = calculationModules.length;
    const hasUpgrades = upgradeCount > 0 || hpGain > 0;
    
    // Detailed prompts sent to AL
    const prompts = {
      metrics: hasUpgrades 
        ? `I have a ${carName} with ${upgradeCount} upgrades making +${hpGain} HP. How can I improve my performance numbers further? What upgrades give the best gains for 0-60, braking, and grip?`
        : `Tell me about the performance metrics of my stock ${carName}. What are realistic goals for 0-60, braking, and grip improvements with modifications?`,
      experience: hasUpgrades
        ? `I have a ${carName} with upgrades. How will these modifications affect comfort, reliability, and sound? Are there tradeoffs I should expect?`
        : `For my ${carName}, how do different types of upgrades (power, suspension, exhaust) typically affect comfort, reliability, and sound? What's the best balance?`,
    };
    
    // Short, clear questions shown to user in the confirmation card
    const displayMessages = {
      metrics: hasUpgrades 
        ? `With +${hpGain} HP, how can I improve 0-60, braking, and grip even more?`
        : `What are realistic performance goals for my ${carName} with mods?`,
      experience: hasUpgrades
        ? `How will my upgrades affect daily driving, reliability, and sound?`
        : `How do different mods affect comfort, reliability, and sound on my ${carName}?`,
    };
    
    const prompt = prompts[section] || `Tell me about ${section} for my ${carName}`;
    const displayMessage = displayMessages[section] || prompt;
    
    openChatWithPrompt(prompt, {
      category: section === 'metrics' ? 'Performance Metrics' : 'Experience Scores',
      carSlug: selectedCar.slug,
      carName: carName,
      upgradeCount,
      hpGain,
    }, displayMessage);
  }, [selectedCar, calculationModules, hpGain, openChatWithPrompt]);
  
  // Loading state
  const isLoading = authLoading || buildsLoading || carsLoading;
  
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
        rightAction={
          isAuthenticated && currentBuildId && (
            <ShareBuildButton
              build={currentBuild}
              vehicle={userVehicle}
              car={selectedCar}
              existingImages={currentBuild?.uploadedImages || []}
            />
          )
        }
      />
      
      <GarageVehicleSelector 
        selectedCarSlug={selectedCar.slug}
        buildId={currentBuildId}
      />
      
      {/* Performance Content - EXACT same layout as UpgradeCenter */}
      <div className={styles.content}>
        
        {/* === PERFORMANCE METRICS CARD === */}
        <div className={styles.performanceCard}>
          <div className={styles.performanceHeader}>
            <h3 className={styles.performanceTitle}>Performance Metrics</h3>
            <button 
              className={styles.askAlBtn}
              onClick={() => askALAboutPerformance('metrics')}
              title="Ask AL about performance metrics"
            >
              <Icons.sparkle size={12} />
              Ask AL
            </button>
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
        
        {/* === EXPERIENCE SCORES === */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>Experience Scores</h4>
            <button 
              className={styles.askAlBtn}
              onClick={() => askALAboutPerformance('experience')}
              title="Ask AL about experience scores"
            >
              <Icons.sparkle size={12} />
              Ask AL
            </button>
          </div>
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
      
      {/* Continue to Parts CTA - shown when upgrades are configured */}
      {showUpgrade && (
        <div className={styles.continueCtaContainer}>
          <Link 
            href={currentBuildId ? `/garage/my-parts?build=${currentBuildId}` : `/garage/my-parts?car=${selectedCar.slug}`}
            className={styles.continueCta}
          >
            <div className={styles.ctaContent}>
              <span className={styles.ctaTitle}>Ready to source parts?</span>
            </div>
            <div className={styles.ctaAction}>
              <span>Continue to Parts</span>
              <Icons.chevronRight size={18} />
            </div>
          </Link>
        </div>
      )}
      
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
