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

import React, { useState, useEffect, Suspense } from 'react';
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

// Icons
const Icons = {
  gauge: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
      <circle cx="12" cy="12" r="3"/>
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
};

// Stat component for VehicleInfoBar - shows HP with optional gain
function HpStat({ hp, finalHp, hpGain }) {
  const displayHp = finalHp || hp;
  const hasGain = hpGain && hpGain > 0;
  
  return (
    <div className={styles.statBadge}>
      <span className={styles.statValue}>{displayHp || '—'}</span>
      <span className={styles.statLabel}>HP</span>
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
  
  // Get user's hero image for this car
  const { heroImageUrl } = useCarImages(selectedCar?.slug, { enabled: !!selectedCar?.slug });

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
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Icons.gauge size={48} />
          </div>
          <h2 className={styles.emptyTitle}>Select a Vehicle</h2>
          <p className={styles.emptyText}>
            Choose a vehicle from your garage to view its specifications
          </p>
          <Link href="/garage" className={styles.emptyAction}>
            <Icons.car size={18} />
            Go to My Garage
          </Link>
        </div>
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
            <h3 className={styles.cardTitle}>Performance</h3>
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
            <h3 className={styles.cardTitle}>Engine & Drivetrain</h3>
            <div className={styles.specItems}>
              {selectedCar.engine && <div className={styles.specItem}><span>Engine</span><span>{selectedCar.engine}</span></div>}
              {selectedCar.trans && <div className={styles.specItem}><span>Transmission</span><span>{selectedCar.trans}</span></div>}
              {selectedCar.drivetrain && <div className={styles.specItem}><span>Drivetrain</span><span>{selectedCar.drivetrain}</span></div>}
              {selectedCar.category && <div className={styles.specItem}><span>Layout</span><span>{selectedCar.category}</span></div>}
            </div>
          </div>

          {/* Chassis & Body */}
          <div className={styles.specCard}>
            <h3 className={styles.cardTitle}>Chassis & Body</h3>
            <div className={styles.specItems}>
              {selectedCar.curbWeight && <div className={styles.specItem}><span>Curb Weight</span><span>{selectedCar.curbWeight.toLocaleString()} lbs</span></div>}
              {selectedCar.seats && <div className={styles.specItem}><span>Seats</span><span>{selectedCar.seats}</span></div>}
              {selectedCar.country && <div className={styles.specItem}><span>Origin</span><span>{selectedCar.country}</span></div>}
              {selectedCar.years && <div className={styles.specItem}><span>Model Years</span><span>{selectedCar.years}</span></div>}
            </div>
          </div>

          {/* Ownership */}
          <div className={styles.specCard}>
            <h3 className={styles.cardTitle}>Ownership</h3>
            <div className={styles.specItems}>
              {selectedCar.priceRange && <div className={styles.specItem}><span>Price Range</span><span>{selectedCar.priceRange}</span></div>}
              {selectedCar.dailyUsabilityTag && <div className={styles.specItem}><span>Daily Use</span><span>{selectedCar.dailyUsabilityTag}</span></div>}
              {selectedCar.fuelEconomyCombined && <div className={styles.specItem}><span>MPG Combined</span><span>{selectedCar.fuelEconomyCombined}</span></div>}
            </div>
          </div>
        </div>

        {/* AutoRev Ratings */}
        <div className={styles.ratingsCard}>
          <h3 className={styles.cardTitle}>AutoRev Ratings</h3>
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
                <h3 className={styles.cardTitle}>Pros</h3>
                <ul className={styles.prosList}>
                  {selectedCar.pros.slice(0, 5).map((pro, i) => (
                    <li key={i}>✓ {pro}</li>
                  ))}
                </ul>
              </div>
            )}
            {selectedCar.cons?.length > 0 && (
              <div className={styles.consCard}>
                <h3 className={styles.cardTitle}>Cons</h3>
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
