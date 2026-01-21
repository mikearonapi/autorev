'use client';

/**
 * My Parts Page - Vehicle-Specific Parts Shopping List
 * 
 * EXACT LIFT from UpgradeCenter's PartsSelector component.
 * Shows the parts shopping list based on selected upgrades:
 * - List of parts needed for the build
 * - AL recommendations for each part
 * - Add/edit specific part details
 * - Copy shopping list functionality
 */

import React, { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { MyGarageSubNav, VehicleInfoBar, PartsCountStat } from '@/components/garage';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import { fetchCars } from '@/lib/carsClient';
import { useCarImages } from '@/hooks/useCarImages';
import PartsSelector from '@/components/tuning-shop/PartsSelector';
import { getPerformanceProfile, calculateTotalCost } from '@/lib/performance.js';
import { Icons } from '@/components/ui/Icons';
import EmptyState from '@/components/ui/EmptyState';

// Empty State - no vehicle selected  
function NoVehicleSelectedState() {
  return (
    <EmptyState
      icon={Icons.box}
      title="No Vehicle Selected"
      description="Select a vehicle to see your parts shopping list based on your build configuration."
      action={{ label: "Go to My Garage", href: "/garage" }}
      variant="centered"
      size="lg"
    />
  );
}

// No Build State - vehicle selected but no build
function NoBuildState({ carSlug, carName }) {
  return (
    <div className={styles.noBuildState}>
      <div className={styles.noBuildIcon}>
        <Icons.shoppingCart size={48} />
      </div>
      <h3 className={styles.noBuildTitle}>No Upgrades Selected</h3>
      <p className={styles.noBuildDescription}>
        Configure a build for your {carName} to see your parts shopping list.
      </p>
      <Link href={`/garage/my-build?car=${carSlug}`} className={styles.noBuildAction}>
        <Icons.wrench size={18} />
        Configure Build
      </Link>
    </div>
  );
}

function MyPartsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCar, setSelectedCar] = useState(null);
  const [currentBuildId, setCurrentBuildId] = useState(null);
  const [allCars, setAllCars] = useState([]);
  
  // Parts state - for PartsSelector component
  const [selectedParts, setSelectedParts] = useState([]);
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const authModal = useAuthModal();
  const { builds, isLoading: buildsLoading, updateBuild } = useSavedBuilds();
  
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
          // Load saved parts from build
          if (build.parts || build.selectedParts) {
            setSelectedParts(build.parts || build.selectedParts || []);
          }
        }
      }
    } else if (carSlugParam) {
      const car = allCars.find(c => c.slug === carSlugParam);
      if (car) {
        setSelectedCar(car);
        // Find the most recent build for this car
        const carBuilds = builds.filter(b => b.carSlug === carSlugParam);
        if (carBuilds.length > 0) {
          const latestBuild = carBuilds[carBuilds.length - 1];
          setCurrentBuildId(latestBuild.id);
          if (latestBuild.parts || latestBuild.selectedParts) {
            setSelectedParts(latestBuild.parts || latestBuild.selectedParts || []);
          }
        }
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
  
  // Calculate performance profile for HP gain display
  const profile = useMemo(() => {
    if (!selectedCar) {
      return {
        stockMetrics: { hp: 0 },
        upgradedMetrics: { hp: 0 },
        selectedUpgrades: [],
      };
    }
    return getPerformanceProfile(selectedCar, effectiveModules);
  }, [selectedCar, effectiveModules]);
  
  // Calculate total cost
  const totalCost = useMemo(() => {
    if (!selectedCar) return { low: 0, high: 0 };
    return calculateTotalCost(profile.selectedUpgrades, selectedCar);
  }, [profile.selectedUpgrades, selectedCar]);
  
  const hpGain = profile.upgradedMetrics.hp - profile.stockMetrics.hp;
  
  // Handle parts change - save to build
  const handlePartsChange = useCallback((newParts) => {
    setSelectedParts(newParts);
    // Optionally auto-save to build
    if (currentBuildId && updateBuild) {
      // Note: This would need to be implemented in SavedBuildsProvider
      // For now, parts are saved when the user saves the build in My Build
    }
  }, [currentBuildId, updateBuild]);
  
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
          text="Loading Parts" 
          subtext="Fetching your parts list..."
          fullPage 
        />
      </div>
    );
  }
  
  // Calculate parts specified count
  const partsSpecifiedCount = selectedParts.filter(p => p.brandName || p.partName).length;
  
  // No car selected
  if (!selectedCar) {
    return (
      <div className={styles.page}>
        <MyGarageSubNav 
          carSlug={carSlugParam}
          buildId={buildIdParam}
          onBack={handleBack}
        />
        <NoVehicleSelectedState />
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
        stat={effectiveModules.length > 0 ? <PartsCountStat count={partsSpecifiedCount} total={effectiveModules.length} /> : null}
        heroImageUrl={heroImageUrl}
      />
      
      {/* Parts Content */}
      <div className={styles.content}>
        
        {/* If no upgrades, show prompt to configure build */}
        {effectiveModules.length === 0 ? (
          <NoBuildState carSlug={selectedCar.slug} carName={selectedCar.name} />
        ) : (
          /* EXACT PartsSelector from UpgradeCenter */
          <PartsSelector
            selectedUpgrades={effectiveModules}
            selectedParts={selectedParts}
            onPartsChange={handlePartsChange}
            carName={selectedCar.name}
            carSlug={selectedCar.slug}
            totalHpGain={hpGain}
            totalCostRange={{ low: totalCost.low, high: totalCost.high }}
          />
        )}
      </div>
      
      <AuthModal {...authModal.props} />
    </div>
  );
}

function MyPartsLoading() {
  return (
    <div className={styles.page}>
      <LoadingSpinner 
        variant="branded" 
        text="Loading Parts" 
        subtext="Fetching your parts list..."
        fullPage 
      />
    </div>
  );
}

export default function MyPartsPage() {
  return (
    <ErrorBoundary name="MyPartsPage" featureContext="garage-my-parts">
      <Suspense fallback={<MyPartsLoading />}>
        <MyPartsContent />
      </Suspense>
    </ErrorBoundary>
  );
}
