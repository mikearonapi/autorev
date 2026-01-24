'use client';

/**
 * My Parts Page - Vehicle-Specific Parts Shopping List
 * 
 * SCOPE: Shopping/purchasing workflow (planned → purchased)
 * Installation tracking is handled by the Install page (/garage/my-install)
 * 
 * Shows the parts shopping list based on selected upgrades:
 * - List of parts needed for the build (planned status)
 * - Parts you've purchased and are ready to install (purchased status)
 * - AL recommendations for finding the right parts
 * - Add/edit specific part details (brand, model, price, vendor)
 * - Link to Install page when parts are ready for installation
 */

import React, { useState, useEffect, useMemo, Suspense, useCallback, useRef } from 'react';
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
import PartsSelector from '@/components/tuning-shop/PartsSelector';
import { getPerformanceProfile } from '@/lib/performanceCalculator';
import { calculateTotalCost } from '@/lib/performance.js';
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
  const partsSelectorRef = useRef(null);
  
  // Parts state - for PartsSelector component
  const [selectedParts, setSelectedParts] = useState([]);
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const authModal = useAuthModal();
  const { builds, isLoading: buildsLoading, updateBuild } = useSavedBuilds();
  const { vehicles } = useOwnedVehicles();
  
  // Use cached cars data from React Query hook
  const { data: allCars = [], isLoading: carsLoading } = useCarsList();
  
  // Get URL params
  const buildIdParam = searchParams.get('build');
  const carSlugParam = searchParams.get('car');
  const actionParam = searchParams.get('action');
  
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
            // Load saved parts from build
            const partsToLoad = build.parts || build.selectedParts || [];
            console.log('[MyParts] Loading parts from build:', {
              buildId: build.id,
              partsCount: partsToLoad.length,
              partsWithStatus: partsToLoad.filter(p => p.status).map(p => ({ upgradeKey: p.upgradeKey, status: p.status })),
            });
            setSelectedParts(partsToLoad);
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
            const partsToLoad = latestBuild.parts || latestBuild.selectedParts || [];
            console.log('[MyParts] Loading parts from latest build:', {
              buildId: latestBuild.id,
              partsCount: partsToLoad.length,
              partsWithStatus: partsToLoad.filter(p => p.status).map(p => ({ upgradeKey: p.upgradeKey, status: p.status })),
            });
            setSelectedParts(partsToLoad);
          }
        }
      }
    } else if (fallbackCar && carSlugParam) {
      // Fallback: use directly fetched car when list is unavailable
      setSelectedCar(fallbackCar);
      // Find builds for this car
      const carBuilds = builds.filter(b => b.carSlug === carSlugParam);
      if (carBuilds.length > 0) {
        const latestBuild = carBuilds[carBuilds.length - 1];
        setCurrentBuildId(latestBuild.id);
        const partsToLoad = latestBuild.parts || latestBuild.selectedParts || [];
        setSelectedParts(partsToLoad);
      }
    }
  }, [buildIdParam, carSlugParam, builds, buildsLoading, allCars, fallbackCar]);
  
  // Get current build data
  const currentBuild = useMemo(() => {
    if (!currentBuildId) return null;
    return builds.find(b => b.id === currentBuildId);
  }, [currentBuildId, builds]);
  
  // Get selected upgrades from build
  // IMPORTANT: Normalize to string keys - getPerformanceProfile expects ['intake', 'stage1-tune', ...]
  // The database may store full objects or just keys depending on how the build was saved
  const effectiveModules = useMemo(() => {
    if (!currentBuild?.upgrades) return [];
    
    // Normalize: if upgrades are objects, extract keys; if strings, use directly
    return currentBuild.upgrades.map(u => typeof u === 'string' ? u : u.key).filter(Boolean);
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
  
  // Handle parts change - save to build with auto-save
  const handlePartsChange = useCallback(async (newParts) => {
    console.log('[MyParts] handlePartsChange called:', {
      partsCount: newParts.length,
      partsWithStatus: newParts.filter(p => p.status).map(p => ({ upgradeKey: p.upgradeKey, status: p.status })),
      currentBuildId,
    });
    
    setSelectedParts(newParts);
    
    // Auto-save to build if we have a build ID
    if (currentBuildId && updateBuild) {
      try {
        const result = await updateBuild(currentBuildId, {
          selectedParts: newParts,
        });
        console.log('[MyParts] Parts save result:', { 
          success: !result?.error, 
          error: result?.error?.message,
          dataReturned: !!result?.data,
        });
      } catch (err) {
        console.error('[MyParts] Failed to save parts:', err);
      }
    }
  }, [currentBuildId, updateBuild]);
  
  // Handle action=add to scroll to and highlight parts selector
  useEffect(() => {
    if (actionParam === 'add' && selectedCar && partsSelectorRef.current) {
      // Wait for content to render
      setTimeout(() => {
        partsSelectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Add highlight class for visual feedback
        partsSelectorRef.current?.classList.add(styles.highlight);
        setTimeout(() => {
          partsSelectorRef.current?.classList.remove(styles.highlight);
        }, 2000);
      }, 500);
    }
  }, [actionParam, selectedCar]);

  const handleBack = () => {
    router.push('/garage');
  };
  
  // Calculate parts specified count (must be before loading return for hooks rules)
  const partsSpecifiedCount = selectedParts.filter(p => p.brandName || p.partName).length;
  
  // Calculate cost summary for parts page header (must be before loading return for hooks rules)
  const costSummary = useMemo(() => {
    const specifiedParts = selectedParts.filter(p => p.actualPrice && !isNaN(parseFloat(p.actualPrice)));
    const specifiedTotal = specifiedParts.reduce((sum, p) => sum + parseFloat(p.actualPrice), 0);
    const purchasedParts = specifiedParts.filter(p => p.status === 'purchased');
    const purchasedTotal = purchasedParts.reduce((sum, p) => sum + parseFloat(p.actualPrice), 0);
    const plannedParts = specifiedParts.filter(p => !p.status || p.status === 'planned');
    const plannedTotal = plannedParts.reduce((sum, p) => sum + parseFloat(p.actualPrice), 0);
    
    return {
      estimated: totalCost,
      specifiedTotal,
      specifiedCount: specifiedParts.length,
      purchasedTotal,
      purchasedCount: purchasedParts.length,
      plannedTotal,
      plannedCount: plannedParts.length,
      unspecifiedCount: effectiveModules.length - specifiedParts.length,
    };
  }, [selectedParts, totalCost, effectiveModules.length]);
  
  // Loading state
  const isLoading = authLoading || buildsLoading || carsLoading;
  
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
        rightAction={
          isAuthenticated && currentBuildId && (
            <ShareBuildButton
              build={currentBuild}
              vehicle={vehicles?.find(v => v.matchedCarSlug === selectedCar?.slug)}
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
      
      {/* Cost Summary Header - shows when there are upgrades */}
      {effectiveModules.length > 0 && (
        <div className={styles.costSummary}>
          <div className={styles.costRow}>
            <div className={styles.costItem}>
              <span className={styles.costLabel}>Estimated Cost</span>
              <span className={styles.costValue}>
                ${totalCost.low.toLocaleString()} - ${totalCost.high.toLocaleString()}
              </span>
            </div>
            {costSummary.specifiedCount > 0 && (
              <div className={styles.costItem}>
                <span className={styles.costLabel}>Your Selections</span>
                <span className={styles.costValueActual}>
                  ${costSummary.specifiedTotal.toLocaleString()}
                </span>
              </div>
            )}
          </div>
          
          {(costSummary.purchasedCount > 0 || costSummary.plannedCount > 0) && (
            <div className={styles.costBreakdown}>
              {costSummary.purchasedCount > 0 && (
                <div className={styles.costBadge}>
                  <Icons.checkCircle size={14} />
                  <span>{costSummary.purchasedCount} purchased (${costSummary.purchasedTotal.toLocaleString()})</span>
                </div>
              )}
              {costSummary.plannedCount > 0 && (
                <div className={styles.costBadgePlanned}>
                  <Icons.shoppingCart size={14} />
                  <span>{costSummary.plannedCount} to purchase (${costSummary.plannedTotal.toLocaleString()})</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Parts Content */}
      <div className={styles.content} ref={partsSelectorRef}>
        
        {/* If no upgrades, show prompt to configure build */}
        {effectiveModules.length === 0 ? (
          <NoBuildState carSlug={selectedCar.slug} carName={selectedCar.name} />
        ) : (
          /* PartsSelector - Shopping focused (planned/purchased) */
          <PartsSelector
            selectedUpgrades={effectiveModules}
            selectedParts={selectedParts}
            onPartsChange={handlePartsChange}
            carName={selectedCar.name}
            carSlug={selectedCar.slug}
            buildId={currentBuildId}
            totalHpGain={hpGain}
            totalCostRange={{ low: totalCost.low, high: totalCost.high }}
          />
        )}
      </div>
      
      {/* Continue to Install CTA - shown when parts are selected */}
      {effectiveModules.length > 0 && (
        <div className={styles.continueCtaContainer}>
          <Link 
            href={currentBuildId ? `/garage/my-install?build=${currentBuildId}` : `/garage/my-install?car=${selectedCar.slug}`}
            className={styles.continueCta}
          >
            <div className={styles.ctaContent}>
              <span className={styles.ctaTitle}>Ready to install?</span>
            </div>
            <div className={styles.ctaAction}>
              <span>Continue to Install</span>
              <Icons.chevronRight size={18} />
            </div>
          </Link>
        </div>
      )}
      
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
