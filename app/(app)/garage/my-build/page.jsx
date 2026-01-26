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
import { Skeleton, ListSkeleton } from '@/components/ui';
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
  const { vehicles, applyModifications, addVehicle, isHydrated: vehiclesHydrated, isLoading: vehiclesLoading } = useOwnedVehicles();
  
  // Use cached cars data from React Query hook
  const { data: allCars = [], isLoading: carsLoading } = useCarsList();
  
  // Get URL params
  const buildIdParam = searchParams.get('build');
  const carSlugParam = searchParams.get('car');
  
  // Fallback: fetch single car in parallel with full list
  // This provides faster data when the full list is slow or unavailable
  const carFromList = carSlugParam ? allCars.find(c => c.slug === carSlugParam) : null;
  const { data: fallbackCar, isLoading: fallbackLoading } = useCarBySlug(carSlugParam, {
    enabled: !!carSlugParam && !carFromList && !selectedCar,
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
            // Reset save protection - we're loading an existing build
            // Set initial load as NOT complete until UpgradeCenter loads the upgrades
            initialLoadCompleteRef.current = false;
            expectedUpgradeCountRef.current = build.upgrades?.length || 0;
            lastSavedStateRef.current = null;
            
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
          // FIX: Check if there's an existing build for this car
          // This prevents duplicate builds and ensures we load the user's existing upgrades
          if (!buildsLoading) {
            const existingBuild = builds.find(b => b.carSlug === carSlugParam);
            if (existingBuild) {
              // Skip if we've already loaded this build
              if (loadedBuildRef.current === existingBuild.id) return;
              
              console.log('[MyBuild] Found existing build for car, loading it:', existingBuild.id);
              loadedBuildRef.current = existingBuild.id;
              // Set protection for existing build
              initialLoadCompleteRef.current = false;
              expectedUpgradeCountRef.current = existingBuild.upgrades?.length || 0;
              lastSavedStateRef.current = null;
              
              flushSync(() => {
                setSelectedCar(car);
                setCurrentBuildId(existingBuild.id);
                if (existingBuild.factoryConfig) setFactoryConfig(existingBuild.factoryConfig);
                if (existingBuild.wheelFitment) selectFitment(existingBuild.wheelFitment);
                if (existingBuild.goal) setCurrentGoal(existingBuild.goal);
              });
              return;
            }
          }
          
          // No existing build - mark as ready to save (but see guard in handleBuildSummaryUpdate)
          initialLoadCompleteRef.current = true;
          expectedUpgradeCountRef.current = null;
          lastSavedStateRef.current = null;
          
          flushSync(() => {
            setSelectedCar(car);
          });
        }
      }
    } else if (fallbackCar && carSlugParam) {
      // Fallback: use directly fetched car when list is unavailable
      initialLoadCompleteRef.current = true;
      expectedUpgradeCountRef.current = null;
      lastSavedStateRef.current = null;
      
      flushSync(() => {
        setSelectedCar(fallbackCar);
      });
    }
  }, [buildIdParam, carSlugParam, builds, buildsLoading, allCars, selectFitment, fallbackCar]);

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  // Unsaved changes warning - prompt user before leaving with pending changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Only warn if there are upgrades and auto-save hasn't completed
      if (buildSummary.upgradeCount > 0 && autoSaveStatus === 'saving') {
        e.preventDefault();
        // Modern browsers ignore custom messages, but we must set returnValue
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [buildSummary.upgradeCount, autoSaveStatus]);

  const handleSelectCar = useCallback((car) => {
    setSelectedCar(car);
    setCurrentBuildId(null);
    setFactoryConfig(null);
    setCurrentGoal(null);
    clearFitmentSelection();
    // Reset save protection refs for new car (no existing build to protect)
    initialLoadCompleteRef.current = true;
    expectedUpgradeCountRef.current = null;
    lastSavedStateRef.current = null;
    hasUserInteractedRef.current = false; // Reset interaction tracking for new car
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

  // Track whether the initial build load is complete
  // This prevents auto-save from firing with empty upgrades before data loads
  // These refs are set in the useLayoutEffect above when loading builds from URL params
  const initialLoadCompleteRef = useRef(false);
  const expectedUpgradeCountRef = useRef(null);
  
  // Track last saved state to avoid duplicate writes
  const lastSavedStateRef = useRef(null);
  
  // Track if user has ever selected an upgrade (prevents saving empty on mount)
  const hasUserInteractedRef = useRef(false);
  
  const handleBuildSummaryUpdate = useCallback((summary) => {
    setBuildSummary(summary);
    
    // DIRECT WRITE: Save upgrades immediately to user_vehicles.installed_modifications
    // This is simpler and more reliable than the auto-save → sync chain
    if (!selectedCar?.slug) return;
    if (!isAuthenticated) return;
    
    // FIX: Prevent saving empty upgrades on initial mount
    // Only save if user has selected at least one upgrade OR is loading an existing build
    if (summary.upgradeCount === 0 && !hasUserInteractedRef.current && !currentBuildId) {
      console.log('[MyBuild] Skipping save - no upgrades and user has not interacted yet');
      return;
    }
    
    // Track that user has interacted once they select any upgrades
    if (summary.upgradeCount > 0) {
      hasUserInteractedRef.current = true;
    }
    
    // SAFETY CHECK: If editing an existing build, don't save with empty upgrades
    // unless the initial load is complete. This prevents data loss when the page loads.
    if (currentBuildId && !initialLoadCompleteRef.current) {
      const expectedCount = expectedUpgradeCountRef.current;
      
      if (expectedCount > 0 && summary.upgradeCount === 0) {
        // Skip save until initial build loads (prevents data loss)
        return;
      }
      
      if (summary.upgradeCount >= expectedCount || summary.upgradeCount > 0) {
        initialLoadCompleteRef.current = true;
      }
    }
    
    // FIX: Wait for vehicles to load before deciding whether to save to vehicle or just build
    // This prevents the race condition where we save to build but skip vehicle update
    // because vehicles array was empty during initial load
    if (!vehiclesHydrated || vehiclesLoading) {
      console.log('[MyBuild] Waiting for vehicles to load before saving...');
      return; // Don't save yet - let the next summary update trigger the save
    }
    
    // Find the user's owned vehicle that matches this car
    const matchingVehicle = vehicles?.find(v => v.matchedCarSlug === selectedCar.slug);
    if (!matchingVehicle) {
      // No owned vehicle - still save to build for users browsing cars they don't own
      const buildData = {
        carSlug: selectedCar.slug,
        carName: selectedCar.name,
        name: currentBuildId ? builds.find(b => b.id === currentBuildId)?.name : `${selectedCar.name} Build`,
        goal: currentGoal,
        selectedUpgrades: summary.selectedUpgrades?.map(u => u.key) || [],
        totalHpGain: summary.totalHpGain || 0,
        factoryConfig,
        wheelFitment: selectedFitment,
      };
      autoSaveBuild(currentBuildId, buildData);
      return;
    }
    
    // Get upgrade keys from summary
    const upgradeKeys = summary.selectedUpgrades?.map(u => u.key) || [];
    const hpGain = summary.totalHpGain || 0;
    
    // Create a hash to avoid duplicate saves
    const saveHash = JSON.stringify({ vehicleId: matchingVehicle.id, upgrades: upgradeKeys });
    if (lastSavedStateRef.current === saveHash) {
      return; // Already saved this exact state
    }
    
    // Update ref BEFORE async call to prevent race conditions
    lastSavedStateRef.current = saveHash;
    
    // DIRECT WRITE to user_vehicles - simple, immediate, reliable
    applyModifications(matchingVehicle.id, {
      upgrades: upgradeKeys,
      totalHpGain: hpGain,
      buildId: currentBuildId || null,
    }).then(({ error }) => {
      if (error) {
        console.error('[MyBuild] Failed to save upgrades:', error);
        lastSavedStateRef.current = null; // Allow retry
      }
    }).catch(err => {
      console.error('[MyBuild] Error saving upgrades:', err);
      lastSavedStateRef.current = null;
    });
    
    // Also save to user_projects for build tracking/community sharing (secondary)
    const buildData = {
      carSlug: selectedCar.slug,
      carName: selectedCar.name,
      name: currentBuildId ? builds.find(b => b.id === currentBuildId)?.name : `${selectedCar.name} Build`,
      goal: currentGoal,
      selectedUpgrades: upgradeKeys,
      totalHpGain: hpGain,
      factoryConfig,
      wheelFitment: selectedFitment,
    };
    autoSaveBuild(currentBuildId, buildData);
  }, [selectedCar, currentBuildId, currentGoal, factoryConfig, selectedFitment, vehicles, vehiclesHydrated, vehiclesLoading, isAuthenticated, applyModifications, autoSaveBuild, builds]);

  const handleBack = () => {
    router.push('/garage');
  };

  // Check if we're loading a specific build
  // NOTE: Removed carsLoading - fallback car fetch provides data when full list is slow
  const isLoadingBuild = buildIdParam && buildsLoading;

  // Loading state - only block on auth and build loading, NOT carsLoading
  // The fallbackCar mechanism ensures we have car data when needed
  if (authLoading || isLoadingBuild) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingSkeleton}>
          {/* Nav skeleton */}
          <div className={styles.navSkeleton}>
            <Skeleton width={40} height={40} variant="rounded" />
            <Skeleton width={180} height={24} variant="rounded" />
            <Skeleton width={40} height={40} variant="rounded" />
          </div>
          
          {/* Vehicle selector skeleton */}
          <div className={styles.vehicleSelectorSkeleton}>
            <Skeleton width="100%" height={56} variant="rounded" />
          </div>
          
          {/* Build recommendations skeleton */}
          <div className={styles.buildRecsSkeleton}>
            <Skeleton width={180} height={20} variant="rounded" />
            <div className={styles.buildRecsGrid}>
              <Skeleton width="100%" height={44} variant="rounded" />
              <Skeleton width="100%" height={44} variant="rounded" />
              <Skeleton width="100%" height={44} variant="rounded" />
            </div>
          </div>
          
          {/* Upgrade categories skeleton */}
          <div className={styles.categoriesSkeleton}>
            <Skeleton width={160} height={20} variant="rounded" />
            <ListSkeleton count={6} hasAvatar={false} />
          </div>
        </div>
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
            // Use OwnedVehiclesProvider.addVehicle() - the single source of truth
            await addVehicle(vehicleData);
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
          // Use OwnedVehiclesProvider.addVehicle() - the single source of truth
          await addVehicle(vehicleData);
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
      <div className={styles.loadingSkeleton}>
        {/* Nav skeleton */}
        <div className={styles.navSkeleton}>
          <Skeleton width={40} height={40} variant="rounded" />
          <Skeleton width={180} height={24} variant="rounded" />
          <Skeleton width={40} height={40} variant="rounded" />
        </div>
        
        {/* Vehicle selector skeleton */}
        <div className={styles.vehicleSelectorSkeleton}>
          <Skeleton width="100%" height={56} variant="rounded" />
        </div>
        
        {/* Build recommendations skeleton */}
        <div className={styles.buildRecsSkeleton}>
          <Skeleton width={180} height={20} variant="rounded" />
          <div className={styles.buildRecsGrid}>
            <Skeleton width="100%" height={44} variant="rounded" />
            <Skeleton width="100%" height={44} variant="rounded" />
            <Skeleton width="100%" height={44} variant="rounded" />
          </div>
        </div>
        
        {/* Upgrade categories skeleton */}
        <div className={styles.categoriesSkeleton}>
          <Skeleton width={160} height={20} variant="rounded" />
          <ListSkeleton count={6} hasAvatar={false} />
        </div>
      </div>
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
