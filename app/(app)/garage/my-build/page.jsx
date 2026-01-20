'use client';

/**
 * My Build Page - Upgrade Configuration Center
 * 
 * Focused modification workflow for a specific vehicle/build.
 * Users configure upgrades here and see how they affect performance.
 * 
 * Part of the My Garage trinity:
 * - My Build: Configure upgrades (this page)
 * - My Performance: See performance impact
 * - My Parts: Research and buy parts
 * 
 * URL: /garage/my-build?car=<carSlug> or ?build=<buildId>
 */

import React, { useState, useEffect, useLayoutEffect, Suspense, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

import styles from './page.module.css';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { MyGarageSubNav, VehicleInfoBar, UpgradeCountStat } from '@/components/garage';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import UpgradeCenter from '@/components/UpgradeCenter';
import BuildWizard from '@/components/BuildWizard';
import CarPickerFullscreen from '@/components/CarPickerFullscreen';
import AddVehicleModal from '@/components/AddVehicleModal';
import { fetchCars } from '@/lib/carsClient';
import { useCarImages } from '@/hooks/useCarImages';

// Tuning shop components
import { useWheelTireSelection } from '@/components/tuning-shop';

// Icons
const Icons = {
  plus: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  wrench: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  folder: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  save: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
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

// Save Button Component for right action
function SaveButton({ onClick }) {
  return (
    <button 
      className={styles.saveButton}
      onClick={onClick}
      title="Save Build"
    >
      <Icons.save size={18} />
    </button>
  );
}

function MyBuildContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedCar, setSelectedCar] = useState(null);
  const [currentBuildId, setCurrentBuildId] = useState(null);
  const [allCars, setAllCars] = useState([]);
  const [showBuildWizard, setShowBuildWizard] = useState(false);
  const [showCarPicker, setShowCarPicker] = useState(false);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  
  // Tuning state
  const [factoryConfig, setFactoryConfig] = useState(null);
  const { selectedFitment, selectFitment, clearSelection: clearFitmentSelection } = useWheelTireSelection();
  const [buildSummary, setBuildSummary] = useState({
    totalHpGain: 0,
    totalTqGain: 0,
    totalCost: 0,
    upgradeCount: 0,
    selectedUpgrades: [],
  });
  // Build goal (track, street, show, daily) - determines which upgrade categories are prioritized
  const [currentGoal, setCurrentGoal] = useState(null);

  // Hooks
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const authModal = useAuthModal();
  const { builds, isLoading: buildsLoading } = useSavedBuilds();
  const { vehicles } = useOwnedVehicles();
  
  // Get user's hero image for this car
  const { heroImageUrl } = useCarImages(selectedCar?.slug, { enabled: !!selectedCar?.slug });

  const isMountedRef = useRef(true);

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

  // Track if we've already loaded this build (to avoid re-running)
  const loadedBuildRef = useRef(null);

  // Handle URL params - load build or car
  useLayoutEffect(() => {
    if (allCars.length === 0) return;

    if (buildIdParam) {
      if (buildsLoading) return;
      
      if (loadedBuildRef.current === buildIdParam) return;
      
      const build = builds.find(b => b.id === buildIdParam);
      if (build) {
        const car = allCars.find(c => c.slug === build.carSlug);
        if (car) {
          loadedBuildRef.current = buildIdParam;
          flushSync(() => {
            setSelectedCar(car);
            setCurrentBuildId(build.id);
            if (build.factoryConfig) setFactoryConfig(build.factoryConfig);
            if (build.wheelFitment) selectFitment(build.wheelFitment);
            // Load build goal if set
            if (build.goal) setCurrentGoal(build.goal);
          });
        }
      }
    } else if (carSlugParam) {
      const car = allCars.find(c => c.slug === carSlugParam);
      if (car) {
        flushSync(() => {
          setSelectedCar(car);
        });
      }
    }
  }, [buildIdParam, carSlugParam, builds, buildsLoading, allCars, selectFitment]);

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const handleSelectCar = useCallback((car) => {
    setSelectedCar(car);
    setCurrentBuildId(null);
    setFactoryConfig(null);
    setCurrentGoal(null);
    clearFitmentSelection();
    window.history.pushState({}, '', `/garage/my-build?car=${car.slug}`);
    setShowCarPicker(false);
    setShowBuildWizard(false);
  }, [clearFitmentSelection]);

  const handleBuildWizardComplete = useCallback((result) => {
    if (result?.car) {
      setSelectedCar(result.car);
      if (result.factoryConfig) setFactoryConfig(result.factoryConfig);
      if (result.wheelFitment) selectFitment(result.wheelFitment);
      // Set the build goal if provided by the wizard
      if (result.goal) setCurrentGoal(result.goal);
      window.history.pushState({}, '', `/garage/my-build?car=${result.car.slug}`);
    }
    setShowBuildWizard(false);
  }, [selectFitment]);

  const handleBuildSummaryUpdate = useCallback((summary) => {
    setBuildSummary(summary);
  }, []);

  const handleBack = () => {
    router.push('/garage');
  };

  const handleSaveBuild = useCallback(() => {
    if (!isAuthenticated) {
      authModal.open('Sign in to save your build');
      return;
    }
    // Dispatch event that UpgradeCenter listens for to open save modal
    document.dispatchEvent(new CustomEvent('tuning-shop:save-build'));
  }, [isAuthenticated, authModal]);

  // Check if we're loading a specific build
  const isLoadingBuild = buildIdParam && (buildsLoading || allCars.length === 0);

  // Loading state
  if (authLoading || isLoadingBuild) {
    return (
      <div className={styles.page}>
        <LoadingSpinner 
          variant="branded" 
          text="Loading Build" 
          subtext="Fetching your modifications..."
          fullPage 
        />
      </div>
    );
  }

  // Get current build for display
  const currentBuild = builds.find(b => b.id === currentBuildId);
  const buildName = currentBuild?.name;

  // No car selected - show prompt
  if (!selectedCar) {
    return (
      <div className={styles.page}>
        <MyGarageSubNav 
          carSlug={carSlugParam}
          buildId={buildIdParam}
          onBack={handleBack}
        />

        {/* Empty State - No build selected */}
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Icons.wrench size={48} />
          </div>
          <h2 className={styles.emptyTitle}>Select a Vehicle</h2>
          <p className={styles.emptyText}>
            Choose a vehicle from your garage to start configuring upgrades
          </p>
          <div className={styles.emptyActions}>
            <Link href="/garage" className={styles.emptyActionPrimary}>
              <Icons.car size={18} />
              Go to My Garage
            </Link>
            <button 
              className={styles.emptyActionSecondary}
              onClick={() => setShowBuildWizard(true)}
            >
              <Icons.plus size={18} />
              Start New Build
            </button>
          </div>
        </div>

        {/* Build Wizard Modal */}
        <BuildWizard
          allCars={allCars}
          isOpen={showBuildWizard}
          onClose={() => setShowBuildWizard(false)}
          onComplete={handleBuildWizardComplete}
          onAddVehicle={() => setShowAddVehicle(true)}
        />

        {/* Add Vehicle Modal */}
        <AddVehicleModal
          isOpen={showAddVehicle}
          onClose={() => setShowAddVehicle(false)}
          onAdd={async (vehicleData) => {
            setShowAddVehicle(false);
            setShowBuildWizard(true);
          }}
          existingVehicles={vehicles}
        />

        <AuthModal {...authModal.props} />
      </div>
    );
  }

  // Car selected - show Upgrade Center with dropdown nav
  return (
    <div className={styles.page}>
      <MyGarageSubNav 
        carSlug={selectedCar.slug}
        buildId={currentBuildId}
        onBack={handleBack}
        rightAction={<SaveButton onClick={handleSaveBuild} />}
      />
      
      {/* Vehicle Info Bar */}
      <VehicleInfoBar
        car={selectedCar}
        buildName={buildName}
        stat={<UpgradeCountStat count={buildSummary.upgradeCount} />}
        heroImageUrl={heroImageUrl}
      />

      {/* Upgrade Center */}
      <div className={styles.upgradeContainer}>
        <UpgradeCenter
          car={selectedCar}
          initialBuildId={currentBuildId}
          factoryConfig={factoryConfig}
          wheelFitment={selectedFitment}
          onBuildSummaryUpdate={handleBuildSummaryUpdate}
          goal={currentGoal}
          onGoalChange={setCurrentGoal}
        />
      </div>

      {/* Car Picker Modal */}
      <CarPickerFullscreen
        isOpen={showCarPicker}
        onClose={() => setShowCarPicker(false)}
        onSelectCar={handleSelectCar}
        allCars={allCars}
      />

      {/* Build Wizard Modal */}
      <BuildWizard
        allCars={allCars}
        isOpen={showBuildWizard}
        onClose={() => setShowBuildWizard(false)}
        onComplete={handleBuildWizardComplete}
        onAddVehicle={() => setShowAddVehicle(true)}
      />

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={showAddVehicle}
        onClose={() => setShowAddVehicle(false)}
        onAdd={async (vehicleData) => {
          setShowAddVehicle(false);
          setShowBuildWizard(true);
        }}
        existingVehicles={vehicles}
      />

      <AuthModal {...authModal.props} />
    </div>
  );
}

function MyBuildLoading() {
  return (
    <div className={styles.page}>
      <LoadingSpinner 
        variant="branded" 
        text="Loading Build" 
        subtext="Fetching your modifications..."
        fullPage 
      />
    </div>
  );
}

export default function MyBuildPage() {
  return (
    <ErrorBoundary name="MyBuildPage" featureContext="garage-my-build">
      <Suspense fallback={<MyBuildLoading />}>
        <MyBuildContent />
      </Suspense>
    </ErrorBoundary>
  );
}
