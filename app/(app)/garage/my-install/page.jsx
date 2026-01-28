'use client';

/**
 * My Install Page - Installation Guidance
 * 
 * Choose Your Own Adventure:
 * - DIY Path: Tools needed, install videos, step-by-step guidance
 * - Service Center Path: Find nearby shops, get directions
 * 
 * Features:
 * - Part checklist with difficulty badges and time estimates
 * - Required tools display (from upgradeTools.js)
 * - DIY video search (YouTube + Exa fallback)
 * - Service center finder (Google Places)
 */

import React, { useState, useEffect, useMemo, Suspense, useCallback } from 'react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import AuthModal, { useAuthModal } from '@/components/AuthModal';
import { DynamicServiceCenterFinder } from '@/components/dynamic';
import ErrorBoundary from '@/components/ErrorBoundary';
import { MyGarageSubNav, GarageVehicleSelector } from '@/components/garage';
import InstallChecklistItem from '@/components/garage/InstallChecklistItem';
import LoadingSpinner from '@/components/LoadingSpinner';
import PremiumGate from '@/components/PremiumGate';
import { useAuth } from '@/components/providers/AuthProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import ShareBuildButton from '@/components/ShareBuildButton';
import EmptyState from '@/components/ui/EmptyState';
import { Icons } from '@/components/ui/Icons';
import { calculateBuildComplexity } from '@/data/upgradeTools';
import { useCarsList, useCarBySlug } from '@/hooks/useCarData';
import { useCarImages } from '@/hooks/useCarImages';

// Placeholder components - will be implemented in subsequent todos

import styles from './page.module.css';

// Empty State - no vehicle selected
function NoVehicleSelectedState() {
  return (
    <EmptyState
      icon={Icons.wrench}
      title="No Vehicle Selected"
      description="Select a vehicle to track your installation progress."
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
        <Icons.wrench size={48} />
      </div>
      <h3 className={styles.noBuildTitle}>No Build Configured</h3>
      <p className={styles.noBuildDescription}>
        Configure a build for your {carName} to start tracking installations.
      </p>
      <Link href={`/garage/my-build?car=${carSlug}`} className={styles.noBuildAction}>
        <Icons.tool size={18} />
        Configure Build
      </Link>
    </div>
  );
}

function MyInstallContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCar, setSelectedCar] = useState(null);
  const [currentBuildId, setCurrentBuildId] = useState(null);
  
  // Path selection state (DIY or Service Center) - defaults to DIY
  const [activePath, setActivePath] = useState('diy'); // 'diy' | 'service'
  
  // Expanded video/tools state
  const [expandedPartId, setExpandedPartId] = useState(null);
  const [showVideosFor, setShowVideosFor] = useState(null);
  const [showToolsFor, setShowToolsFor] = useState(null);
  
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const authModal = useAuthModal();
  const { builds, isLoading: buildsLoading } = useSavedBuilds();
  const { vehicles } = useOwnedVehicles();
  
  // Use cached cars data from React Query hook
  const { data: allCars = [] } = useCarsList();
  
  // Get URL params
  const buildIdParam = searchParams.get('build');
  const carSlugParam = searchParams.get('car');
  
  // Fallback: fetch single car in parallel with full list
  // This provides faster data when the full list is slow or unavailable
  const carFromList = carSlugParam ? allCars.find(c => c.slug === carSlugParam) : null;
  const { data: fallbackCar } = useCarBySlug(carSlugParam, {
    enabled: !!carSlugParam && !carFromList && !selectedCar,
  });
  
  // Get user's hero image for this car (used by GarageVehicleSelector)
  useCarImages(selectedCar?.slug, { enabled: !!selectedCar?.slug });
  
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
          // Find most recent build for this car
          const carBuild = builds.find(b => b.carSlug === carSlugParam);
          if (carBuild) {
            setCurrentBuildId(carBuild.id);
          }
        }
      }
    } else if (fallbackCar && carSlugParam) {
      // Fallback: use directly fetched car when list is unavailable
      setSelectedCar(fallbackCar);
      // Find most recent build for this car
      const carBuild = builds.find(b => b.carSlug === carSlugParam);
      if (carBuild) {
        setCurrentBuildId(carBuild.id);
      }
    }
  }, [buildIdParam, carSlugParam, allCars, builds, buildsLoading, fallbackCar]);
  
  // Get current build
  const currentBuild = useMemo(() => {
    if (!currentBuildId) return null;
    return builds.find(b => b.id === currentBuildId);
  }, [currentBuildId, builds]);
  
  // Normalize upgrade keys to strings (handles both object and string formats)
  const normalizedUpgradeKeys = useMemo(() => {
    if (!currentBuild) return [];
    const upgrades = currentBuild.upgrades || [];
    return upgrades.map(upgrade => {
      if (typeof upgrade === 'object' && upgrade !== null) {
        return upgrade.key || upgrade.upgradeKey || '';
      }
      return upgrade || '';
    }).filter(Boolean);
  }, [currentBuild]);
  
  // Get parts from build
  const buildParts = useMemo(() => {
    if (!currentBuild) return [];
    
    // Get upgrade keys from build
    const upgradeKeys = currentBuild.upgrades || [];
    const partsData = currentBuild.parts || [];
    
    // Map upgrades to part objects with metadata
    // Handle both formats: string keys (old) and objects with key property (new)
    return upgradeKeys.map((upgrade, index) => {
      // Extract the key string - handle both object format and plain string format
      const upgradeKey = typeof upgrade === 'object' && upgrade !== null 
        ? (upgrade.key || upgrade.upgradeKey || '') 
        : (upgrade || '');
      
      // Get the display name - prefer object's name property if available
      const displayName = typeof upgrade === 'object' && upgrade?.name
        ? upgrade.name
        : (typeof upgradeKey === 'string' && upgradeKey
            ? upgradeKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
            : 'Unknown Upgrade');
      
      const partData = partsData.find(p => p.upgradeKey === upgradeKey) || {};
      
      return {
        id: `${upgradeKey}-${index}`,
        upgradeKey: upgradeKey,
        name: displayName,
        brandName: partData.brandName || null,
        partName: partData.partName || null,
        ...partData,
      };
    }).filter(part => part.upgradeKey); // Filter out any parts with empty keys
  }, [currentBuild]);
  
  // Calculate part count for display
  const partCount = buildParts.length;
  
  // Calculate total estimated install time and complexity
  const buildComplexity = useMemo(() => {
    if (normalizedUpgradeKeys.length === 0) return null;
    return calculateBuildComplexity(normalizedUpgradeKeys);
  }, [normalizedUpgradeKeys]);
  
  // Handle back button
  const handleBack = useCallback(() => {
    router.push('/garage');
  }, [router]);
  
  // Loading state - only block on auth and builds, NOT carsLoading
  // The fallbackCar mechanism ensures we have car data when needed
  if (authLoading || buildsLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
      </div>
    );
  }
  
  // No vehicle selected
  if (!selectedCar) {
    return (
      <div className={styles.page}>
        <MyGarageSubNav onBack={handleBack} />
        <NoVehicleSelectedState />
      </div>
    );
  }
  
  // No build configured
  if (!currentBuild || buildParts.length === 0) {
    return (
      <div className={styles.page}>
        <MyGarageSubNav 
          onBack={handleBack}
          carSlug={selectedCar.slug}
        />
        <GarageVehicleSelector 
          selectedCarSlug={selectedCar.slug}
        />
        <NoBuildState carSlug={selectedCar.slug} carName={selectedCar.name} />
      </div>
    );
  }
  
  return (
    <div className={styles.page}>
      <MyGarageSubNav 
        onBack={handleBack}
        carSlug={selectedCar.slug}
        buildId={currentBuildId}
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
      
      {/* Premium Gate for Install Guide */}
      <PremiumGate feature="installTracking" variant="default">
        <div className={styles.content}>
          {/* Install Guide Header */}
          <div className={styles.progressHeader}>
            <div className={styles.progressInfo}>
              <h2 className={styles.pageTitle}>Installation Guide</h2>
              <p className={styles.progressText}>
                {partCount} {partCount === 1 ? 'part' : 'parts'} to install
              </p>
            </div>
            
            {/* Estimated Total Time */}
            {buildComplexity?.timeEstimate && (
              <div className={styles.timeEstimate}>
                <Icons.clock size={14} />
                <span>Est. total install time: <strong>{buildComplexity.timeEstimate.display}</strong></span>
                {buildComplexity.diyFeasibility === 'shop-recommended' && (
                  <span className={styles.shopBadge}>Shop Recommended</span>
                )}
                {buildComplexity.diyFeasibility === 'mostly-shop' && (
                  <span className={styles.shopBadge}>Professional Install</span>
                )}
              </div>
            )}
          </div>
          
          {/* Path Selector - DIY vs Service Center (Tab Bar Toggle) */}
          <div className={styles.tabBarContainer}>
            <div className={styles.tabBar}>
              <button
                className={`${styles.tab} ${activePath === 'diy' ? styles.tabActive : ''}`}
                onClick={() => setActivePath('diy')}
              >
                DIY
              </button>
              <button
                className={`${styles.tab} ${activePath === 'service' ? styles.tabActive : ''}`}
                onClick={() => setActivePath('service')}
              >
                Service Center
              </button>
            </div>
          </div>
          
          {/* DIY Path Content */}
          {activePath === 'diy' && (
            <div className={styles.diyContent}>
              {/* Parts Checklist */}
              <div className={styles.partsList}>
                <h3 className={styles.sectionTitle}>
                  <Icons.list size={18} />
                  Parts to Install
                </h3>
                {buildParts.map(part => (
                  <InstallChecklistItem
                    key={part.id}
                    part={part}
                    carName={selectedCar.name}
                    carSlug={selectedCar.slug}
                    isExpanded={expandedPartId === part.id}
                    onToggleExpand={() => setExpandedPartId(
                      expandedPartId === part.id ? null : part.id
                    )}
                    showVideos={showVideosFor === part.id}
                    onToggleVideos={() => setShowVideosFor(
                      showVideosFor === part.id ? null : part.id
                    )}
                    showTools={showToolsFor === part.id}
                    onToggleTools={() => setShowToolsFor(
                      showToolsFor === part.id ? null : part.id
                    )}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Service Center Path Content */}
          {activePath === 'service' && (
            <div className={styles.serviceContent}>
              <DynamicServiceCenterFinder 
                carName={selectedCar.name}
                carMake={selectedCar.make}
                buildParts={buildParts}
                hideHeader={true}
                onShopSelected={(shop) => {
                  // Could open directions or show more info
                  console.log('Shop selected:', shop);
                }}
              />
            </div>
          )}
          
        </div>
      </PremiumGate>
      
      {/* Continue to Photos CTA */}
      {selectedCar && (
        <div className={styles.continueCtaContainer}>
          <Link 
            href={currentBuildId ? `/garage/my-photos?build=${currentBuildId}` : `/garage/my-photos?car=${selectedCar.slug}`}
            className={styles.continueCta}
          >
            <div className={styles.ctaContent}>
              <span className={styles.ctaTitle}>Ready to share your build?</span>
            </div>
            <div className={styles.ctaAction}>
              <span>Continue to Photos</span>
              <Icons.chevronRight size={18} />
            </div>
          </Link>
        </div>
      )}
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={authModal.close}
        initialTab={authModal.initialTab}
        returnTo={authModal.returnTo}
      />
    </div>
  );
}

export default function MyInstallPage() {
  return (
    <ErrorBoundary name="MyInstallPage" featureContext="garage-my-install">
      <Suspense fallback={<LoadingSpinner />}>
        <MyInstallContent />
      </Suspense>
    </ErrorBoundary>
  );
}
