'use client';

/**
 * My Specs Page - Vehicle Specifications
 * 
 * Shows full vehicle specifications for a selected vehicle.
 * Part of the My Garage suite:
 * - Specs: Vehicle specifications (this page)
 * - Build: Configure upgrades
 * - Performance: See performance impact
 * - Parts: Research and buy parts
 * - Photos: Manage vehicle photos
 * 
 * URL: /garage/my-specs?car=<carSlug> or ?build=<buildId>
 */

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

import styles from './page.module.css';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { MyGarageSubNav, VehicleInfoBar } from '@/components/garage';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import { fetchCars } from '@/lib/carsClient';
import { useCarImages } from '@/hooks/useCarImages';
import { useAIChat } from '@/components/AIChatContext';
import { Icons } from '@/components/ui/Icons';
import EmptyState from '@/components/ui/EmptyState';

// Local alias for sparkle (used with fill instead of stroke)
const LocalIcons = {
  sparkle: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2Z"/>
    </svg>
  ),
};

/**
 * AskALSectionButton - Opens AL chat with a section-specific prompt
 * For use in card headers on specs pages
 */
function AskALSectionButton({ prompt, category, carName, onClick }) {
  return (
    <button 
      className={styles.askAlBtn}
      onClick={onClick}
      title={`Ask AL about ${category}`}
    >
      <LocalIcons.sparkle size={12} />
      Ask AL
    </button>
  );
}

// Stat component for VehicleInfoBar - shows HP with optional gain
function HpStat({ hp, finalHp, hpGain }) {
  const displayHp = finalHp || hp;
  const hasGain = hpGain && hpGain > 0;
  
  return (
    <div className={styles.statBadge}>
      <div className={styles.statRow}>
        <span className={styles.statValue}>{displayHp || '—'}</span>
        <span className={styles.statLabel}>HP</span>
      </div>
      {hasGain && (
        <span className={styles.statGain}>+{hpGain}</span>
      )}
    </div>
  );
}

// Rating bar component
function RatingBar({ value, label, maxValue = 10 }) {
  if (value === undefined || value === null) return null;
  const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);
  
  return (
    <div className={styles.ratingRow}>
      <span className={styles.ratingLabel}>{label}</span>
      <div className={styles.ratingTrack}>
        <div className={styles.ratingFill} style={{ width: `${percentage}%` }} />
      </div>
      <span className={styles.ratingValue}>{value}/{maxValue}</span>
    </div>
  );
}

function MySpecsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedCar, setSelectedCar] = useState(null);
  const [currentBuildId, setCurrentBuildId] = useState(null);
  const [allCars, setAllCars] = useState([]);
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const authModal = useAuthModal();
  const { builds, isLoading: buildsLoading } = useSavedBuilds();
  const { openChatWithPrompt } = useAIChat();
  
  // Get user's hero image for this car
  const { heroImageUrl } = useCarImages(selectedCar?.slug, { enabled: !!selectedCar?.slug });
  
  // Create contextualized AL prompt handlers for each section
  // Each section has a detailed prompt (sent to AL) and a short displayMessage (shown to user)
  const askALAboutSection = useCallback((section) => {
    if (!selectedCar) return;
    
    const carName = selectedCar.name;
    
    // Detailed prompts sent to AL
    const prompts = {
      performance: `Tell me about the performance specs of my ${carName}. What makes it special, and how does it compare to competitors? What should I know about its acceleration, handling, and track potential?`,
      engine: `Tell me about the ${selectedCar.engine || 'engine'} in my ${carName}. What are its strengths, common maintenance items, and tuning potential? Any reliability concerns I should know about?`,
      chassis: `Tell me about the chassis and body of my ${carName}. How does the weight distribution affect handling? What makes the platform special?`,
      ownership: `What should I know about owning a ${carName}? What are typical maintenance costs, common issues to watch for, and ownership tips from experienced owners?`,
      ratings: `Explain the AutoRev ratings for my ${carName}. Why does it score the way it does for driver fun, track capability, sound, reliability, and value?`,
    };
    
    // Short, clear questions shown to user in the confirmation card
    const displayMessages = {
      performance: `How does the ${carName} perform? How fast is it, and what's it like on track?`,
      engine: `What should I know about the ${selectedCar.engine || 'engine'}? Reliability, maintenance, tuning potential?`,
      chassis: `How does the ${carName}'s weight and chassis affect handling?`,
      ownership: `What are the real costs and common issues with owning a ${carName}?`,
      ratings: `Why does the ${carName} score the way it does in AutoRev ratings?`,
    };
    
    const prompt = prompts[section] || `Tell me more about ${section} for my ${carName}`;
    const displayMessage = displayMessages[section] || prompt;
    
    openChatWithPrompt(prompt, {
      category: section.charAt(0).toUpperCase() + section.slice(1),
      carSlug: selectedCar.slug,
      carName: carName,
    }, displayMessage);
  }, [selectedCar, openChatWithPrompt]);

  // Fetch all cars
  useEffect(() => {
    let cancelled = false;
    fetchCars().then(cars => {
      if (!cancelled && Array.isArray(cars)) {
        setAllCars(cars);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Get URL params
  const buildIdParam = searchParams.get('build');
  const carSlugParam = searchParams.get('car');

  // Handle URL params - load build or car
  useEffect(() => {
    if (allCars.length === 0) return;

    if (buildIdParam) {
      if (buildsLoading) return;
      const build = builds.find(b => b.id === buildIdParam);
      if (build) {
        const car = allCars.find(c => c.slug === build.carSlug);
        if (car) {
          setSelectedCar(car);
          setCurrentBuildId(buildIdParam);
        }
      }
    } else if (carSlugParam) {
      const car = allCars.find(c => c.slug === carSlugParam);
      if (car) {
        setSelectedCar(car);
        setCurrentBuildId(null);
      }
    }
  }, [buildIdParam, carSlugParam, allCars, builds, buildsLoading]);

  const handleBack = () => {
    router.push('/garage');
  };

  // Loading state
  const isLoadingBuild = buildIdParam && (buildsLoading || allCars.length === 0);
  if (authLoading || isLoadingBuild) {
    return (
      <div className={styles.page}>
        <LoadingSpinner 
          variant="branded" 
          text="Loading Specs" 
          subtext="Fetching vehicle specifications..."
          fullPage 
        />
      </div>
    );
  }

  // Get current build for display
  const currentBuild = builds.find(b => b.id === currentBuildId);
  const buildName = currentBuild?.name;
  
  // Get build performance data
  const hpGain = currentBuild?.totalHpGain || 0;
  const finalHp = currentBuild?.finalHp || (selectedCar?.hp ? selectedCar.hp + hpGain : null);
  const hasBuildUpgrades = hpGain > 0;

  // No car selected
  if (!selectedCar) {
    return (
      <div className={styles.page}>
        <MyGarageSubNav 
          carSlug={carSlugParam}
          buildId={buildIdParam}
          onBack={handleBack}
        />
        <EmptyState
          icon={Icons.gauge}
          title="Select a Vehicle"
          description="Choose a vehicle from your garage to view its specifications"
          action={{ label: "Go to My Garage", href: "/garage" }}
          variant="centered"
          size="lg"
        />
        <AuthModal {...authModal.props} />
      </div>
    );
  }

  // Car selected - show specs
  return (
    <div className={styles.page}>
      <MyGarageSubNav 
        carSlug={selectedCar.slug}
        buildId={currentBuildId}
        onBack={handleBack}
      />
      
      <VehicleInfoBar
        car={selectedCar}
        buildName={buildName}
        stat={<HpStat hp={selectedCar.hp} finalHp={finalHp} hpGain={hpGain} />}
        heroImageUrl={heroImageUrl}
      />

      <div className={styles.content}>
        {/* Specs Grid */}
        <div className={styles.specsGrid}>
          {/* Performance */}
          <div className={styles.specCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Performance</h3>
              <button 
                className={styles.askAlBtn}
                onClick={() => askALAboutSection('performance')}
                title="Ask AL about performance"
              >
                <LocalIcons.sparkle size={12} />
                Ask AL
              </button>
            </div>
            <div className={styles.specItems}>
              {selectedCar.hp && (
                <div className={styles.specItem}>
                  <span>Horsepower</span>
                  {hasBuildUpgrades ? (
                    <span className={styles.specValueWithGain}>
                      <span className={styles.stockValue}>{selectedCar.hp}</span>
                      <span className={styles.arrow}>→</span>
                      <span className={styles.upgradedValue}>{finalHp} HP</span>
                      <span className={styles.gainBadge}>+{hpGain}</span>
                    </span>
                  ) : (
                    <span>{selectedCar.hp} HP</span>
                  )}
                </div>
              )}
              {selectedCar.torque && <div className={styles.specItem}><span>Torque</span><span>{selectedCar.torque} lb-ft</span></div>}
              {selectedCar.zeroToSixty && <div className={styles.specItem}><span>0-60 mph</span><span>{selectedCar.zeroToSixty}s</span></div>}
              {selectedCar.quarterMile && <div className={styles.specItem}><span>1/4 Mile</span><span>{selectedCar.quarterMile}s</span></div>}
              {selectedCar.topSpeed && <div className={styles.specItem}><span>Top Speed</span><span>{selectedCar.topSpeed} mph</span></div>}
              {selectedCar.braking60To0 && <div className={styles.specItem}><span>60-0 Braking</span><span>{selectedCar.braking60To0} ft</span></div>}
              {selectedCar.lateralG && <div className={styles.specItem}><span>Lateral G</span><span>{selectedCar.lateralG}g</span></div>}
            </div>
          </div>

          {/* Engine & Drivetrain */}
          <div className={styles.specCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Engine & Drivetrain</h3>
              <button 
                className={styles.askAlBtn}
                onClick={() => askALAboutSection('engine')}
                title="Ask AL about engine & drivetrain"
              >
                <LocalIcons.sparkle size={12} />
                Ask AL
              </button>
            </div>
            <div className={styles.specItems}>
              {selectedCar.engine && <div className={styles.specItem}><span>Engine</span><span>{selectedCar.engine}</span></div>}
              {selectedCar.trans && <div className={styles.specItem}><span>Transmission</span><span>{selectedCar.trans}</span></div>}
              {selectedCar.drivetrain && <div className={styles.specItem}><span>Drivetrain</span><span>{selectedCar.drivetrain}</span></div>}
              {selectedCar.category && <div className={styles.specItem}><span>Layout</span><span>{selectedCar.category}</span></div>}
            </div>
          </div>

          {/* Chassis & Body */}
          <div className={styles.specCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Chassis & Body</h3>
              <button 
                className={styles.askAlBtn}
                onClick={() => askALAboutSection('chassis')}
                title="Ask AL about chassis & body"
              >
                <LocalIcons.sparkle size={12} />
                Ask AL
              </button>
            </div>
            <div className={styles.specItems}>
              {selectedCar.curbWeight && <div className={styles.specItem}><span>Curb Weight</span><span>{selectedCar.curbWeight.toLocaleString()} lbs</span></div>}
              {selectedCar.seats && <div className={styles.specItem}><span>Seats</span><span>{selectedCar.seats}</span></div>}
              {selectedCar.country && <div className={styles.specItem}><span>Origin</span><span>{selectedCar.country}</span></div>}
              {selectedCar.years && <div className={styles.specItem}><span>Model Years</span><span>{selectedCar.years}</span></div>}
            </div>
          </div>

          {/* Ownership */}
          <div className={styles.specCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Ownership</h3>
              <button 
                className={styles.askAlBtn}
                onClick={() => askALAboutSection('ownership')}
                title="Ask AL about ownership"
              >
                <LocalIcons.sparkle size={12} />
                Ask AL
              </button>
            </div>
            <div className={styles.specItems}>
              {selectedCar.priceRange && <div className={styles.specItem}><span>Price Range</span><span>{selectedCar.priceRange}</span></div>}
              {selectedCar.dailyUsabilityTag && <div className={styles.specItem}><span>Daily Use</span><span>{selectedCar.dailyUsabilityTag}</span></div>}
              {selectedCar.fuelEconomyCombined && <div className={styles.specItem}><span>MPG Combined</span><span>{selectedCar.fuelEconomyCombined}</span></div>}
            </div>
          </div>
        </div>

        {/* AutoRev Ratings */}
        <div className={styles.ratingsCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>AutoRev Ratings</h3>
            <button 
              className={styles.askAlBtn}
              onClick={() => askALAboutSection('ratings')}
              title="Ask AL about ratings"
            >
              <LocalIcons.sparkle size={12} />
              Ask AL
            </button>
          </div>
          <div className={styles.ratingsGrid}>
            <RatingBar value={selectedCar.driverFun} label="Driver Fun" />
            <RatingBar value={selectedCar.track} label="Track" />
            <RatingBar value={selectedCar.sound} label="Sound" />
            <RatingBar value={selectedCar.reliability} label="Reliability" />
            <RatingBar value={selectedCar.interior} label="Interior" />
            <RatingBar value={selectedCar.value} label="Value" />
            <RatingBar value={selectedCar.aftermarket} label="Aftermarket" />
          </div>
        </div>

        {/* Pros & Cons */}
        {(selectedCar.pros?.length > 0 || selectedCar.cons?.length > 0) && (
          <div className={styles.prosConsRow}>
            {selectedCar.pros?.length > 0 && (
              <div className={styles.prosCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Pros</h3>
                </div>
                <ul className={styles.prosList}>
                  {selectedCar.pros.slice(0, 5).map((pro, i) => (
                    <li key={i}>✓ {pro}</li>
                  ))}
                </ul>
              </div>
            )}
            {selectedCar.cons?.length > 0 && (
              <div className={styles.consCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Cons</h3>
                </div>
                <ul className={styles.consList}>
                  {selectedCar.cons.slice(0, 5).map((con, i) => (
                    <li key={i}>✗ {con}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      <AuthModal {...authModal.props} />
    </div>
  );
}

function MySpecsLoading() {
  return (
    <div className={styles.page}>
      <LoadingSpinner 
        variant="branded" 
        text="Loading Specs" 
        subtext="Fetching vehicle specifications..."
        fullPage 
      />
    </div>
  );
}

export default function MySpecsPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<MySpecsLoading />}>
        <MySpecsContent />
      </Suspense>
    </ErrorBoundary>
  );
}
