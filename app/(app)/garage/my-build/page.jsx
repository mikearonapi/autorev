'use client';

/**
 * My Build Page - Upgrade Configuration Center
 * 
 * Focused modification workflow for a specific vehicle/build.
 * Users configure upgrades here and see how they affect performance.
 * 
 * AUTO-SAVE: All changes are automatically saved - no manual save needed.
 * Share button controls community visibility (see share-toggle todo).
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
import { MyGarageSubNav, GarageVehicleSelector } from '@/components/garage';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import UpgradeCenter from '@/components/UpgradeCenter';
import BuildWizard from '@/components/BuildWizard';
import CarPickerFullscreen from '@/components/CarPickerFullscreen';
import AddVehicleModal from '@/components/AddVehicleModal';
import { useCarsList, useCarBySlug } from '@/hooks/useCarData';
import { useCarImages } from '@/hooks/useCarImages';
import ShareBuildButton from '@/components/ShareBuildButton';

// Tuning shop components
import { useWheelTireSelection } from '@/components/tuning-shop';
import { Icons } from '@/components/ui/Icons';

// Auto-save Status Indicator - removed per user request
// function AutoSaveIndicator({ status }) { ... }

function MyBuildContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedCar, setSelectedCar] = useState(null);
  const [currentBuildId, setCurrentBuildId] = useState(null);
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
  const { builds, isLoading: buildsLoading, autoSaveBuild, autoSaveStatus } = useSavedBuilds();
  const { vehicles } = useOwnedVehicles();
  
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

  const isMountedRef = useRef(true);

  // Track if we've already loaded this build (to avoid re-running)
  const loadedBuildRef = useRef(null);

  // Handle URL params - load build or car (with fallback support)
  useLayoutEffect(() => {
    if (allCars.length > 0) {
      if (buildIdParam) {
        if (buildsLoading) return;
        
        if (loadedBuildRef.current === buildIdParam) return;
        
        const build = builds.find(b => b.id === buildIdParam);
        if (build) {
          const car = allCars.find(c => c.slug === build.carSlug);
          if (car) {
            loadedBuildRef.current = buildIdParam;
            // Reset auto-save protection - we're loading an existing build
            // Set initial load as NOT complete until UpgradeCenter loads the upgrades
            initialLoadCompleteRef.current = false;
            expectedUpgradeCountRef.current = build.upgrades?.length || 0;
            lastAutoSaveRef.current = null;
            
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
          // New car, no existing build - mark as ready for auto-save
          initialLoadCompleteRef.current = true;
          expectedUpgradeCountRef.current = null;
          lastAutoSaveRef.current = null;
          
          flushSync(() => {
            setSelectedCar(car);
          });
        }
      }
    } else if (fallbackCar && carSlugParam) {
      // Fallback: use directly fetched car when list is unavailable
      initialLoadCompleteRef.current = true;
      expectedUpgradeCountRef.current = null;
      lastAutoSaveRef.current = null;
      
      flushSync(() => {
        setSelectedCar(fallbackCar);
      });
    }
  }, [buildIdParam, carSlugParam, builds, buildsLoading, allCars, selectFitment, fallbackCar]);

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const handleSelectCar = useCallback((car) => {
    setSelectedCar(car);
    setCurrentBuildId(null);
    setFactoryConfig(null);
    setCurrentGoal(null);
    clearFitmentSelection();
    // Reset auto-save protection refs for new car (no existing build to protect)
    initialLoadCompleteRef.current = true;
    expectedUpgradeCountRef.current = null;
    lastAutoSaveRef.current = null;
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

  // Track the last auto-save to avoid redundant saves
  const lastAutoSaveRef = useRef(null);
  
  // Track whether the initial build load is complete
  // This prevents auto-save from firing with empty upgrades before data loads
  // These refs are set in the useLayoutEffect above when loading builds from URL params
  const initialLoadCompleteRef = useRef(false);
  const expectedUpgradeCountRef = useRef(null);
  
  const handleBuildSummaryUpdate = useCallback((summary) => {
    setBuildSummary(summary);
    
    // Auto-save when build changes (only if we have a car selected)
    if (selectedCar && summary.upgradeCount >= 0) {
      // SAFETY CHECK: If editing an existing build, don't auto-save with empty upgrades
      // unless the initial load is complete. This prevents data loss when the page loads
      // and UpgradeCenter fires an update before loading the saved upgrades.
      if (currentBuildId && !initialLoadCompleteRef.current) {
        const expectedCount = expectedUpgradeCountRef.current;
        
        // If we expected upgrades but got none, this is likely the initial empty state
        // before the build data has loaded into UpgradeCenter - skip this save
        if (expectedCount > 0 && summary.upgradeCount === 0) {
          console.log('[MyBuild] Skipping auto-save: waiting for initial build load (expected', expectedCount, 'upgrades)');
          return;
        }
        
        // Once we see the expected number of upgrades (or any non-zero count),
        // mark the initial load as complete
        if (summary.upgradeCount >= expectedCount || summary.upgradeCount > 0) {
          initialLoadCompleteRef.current = true;
        }
      }
      
      // Calculate final HP from stock + gain
      const stockHp = selectedCar.hp || 0;
      const hpGain = summary.totalHpGain || 0;
      const finalHp = stockHp + hpGain;
      
      const buildData = {
        carSlug: selectedCar.slug,
        carName: selectedCar.name,
        name: currentBuildId ? builds.find(b => b.id === currentBuildId)?.name : `${selectedCar.name} Build`,
        goal: currentGoal,
        selectedUpgrades: summary.selectedUpgrades?.map(u => u.key) || [],
        totalHpGain: hpGain,
        finalHp: finalHp,
        stockHp: stockHp,
        totalCostLow: summary.totalCost || 0,
        totalCostHigh: summary.totalCost || 0,
        factoryConfig,
        wheelFitment: selectedFitment,
      };
      
      // Create a simple hash to avoid duplicate saves
      const buildHash = JSON.stringify({
        upgrades: buildData.selectedUpgrades,
        goal: buildData.goal,
      });
      
      if (lastAutoSaveRef.current !== buildHash) {
        lastAutoSaveRef.current = buildHash;
        autoSaveBuild(currentBuildId, buildData);
      }
    }
  }, [selectedCar, currentBuildId, currentGoal, factoryConfig, selectedFitment, autoSaveBuild, builds]);

  const handleBack = () => {
    router.push('/garage');
  };

  // Check if we're loading a specific build
  const isLoadingBuild = buildIdParam && (buildsLoading || carsLoading);

  // Loading state
  if (authLoading || carsLoading || isLoadingBuild) {
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
  // Get current build's images for ShareBuildButton
  const uploadedImages = currentBuild?.uploadedImages || [];
  
  return (
    <div className={styles.page}>
      <MyGarageSubNav 
        carSlug={selectedCar.slug}
        buildId={currentBuildId}
        onBack={handleBack}
        leftAction={null}
        rightAction={
          isAuthenticated && currentBuildId && (
            <ShareBuildButton
              build={currentBuild}
              vehicle={vehicles?.find(v => v.matched_car_slug === selectedCar?.slug)}
              car={selectedCar}
              existingImages={uploadedImages}
            />
          )
        }
      />
      
      <GarageVehicleSelector 
        selectedCarSlug={selectedCar.slug}
        buildId={currentBuildId}
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
      
      {/* Continue to Performance CTA - shown when upgrades are selected */}
      {buildSummary.upgradeCount > 0 && (
        <div className={styles.continueCtaContainer}>
          <Link 
            href={currentBuildId ? `/garage/my-performance?build=${currentBuildId}` : `/garage/my-performance?car=${selectedCar.slug}`}
            className={styles.continueCta}
          >
            <div className={styles.ctaContent}>
              <span className={styles.ctaTitle}>See how your build performs</span>
            </div>
            <div className={styles.ctaAction}>
              <span>Continue to Performance</span>
              <Icons.chevronRight size={18} />
            </div>
          </Link>
        </div>
      )}

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
