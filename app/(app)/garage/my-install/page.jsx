'use client';

/**
 * My Install Page - Installation Tracking & Guidance
 * 
 * SCOPE: Installation workflow (purchased → installed)
 * Shopping/purchasing is handled by the Parts page (/garage/my-parts)
 * 
 * Choose Your Own Adventure:
 * - DIY Path: Tools needed, install videos, step-by-step guidance
 * - Service Center Path: Find nearby shops, get directions
 * 
 * Features:
 * - Part checklist with status indicators (purchased vs planned)
 * - Difficulty badges and time estimates
 * - Required tools display (from upgradeTools.js)
 * - DIY video search (YouTube + Exa fallback)
 * - Service center finder (Google Places)
 * - Mark parts as installed
 * - Celebration modal on completion
 */

import React, { useState, useEffect, useMemo, Suspense, useCallback } from 'react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import AuthModal, { useAuthModal } from '@/components/AuthModal';
import CelebrationModal from '@/components/CelebrationModal';
import ErrorBoundary from '@/components/ErrorBoundary';
import { MyGarageSubNav, GarageVehicleSelector } from '@/components/garage';
import DIYVideoEmbed from '@/components/garage/DIYVideoEmbed';
import InstallChecklistItem from '@/components/garage/InstallChecklistItem';
import InstallToolsPanel from '@/components/garage/InstallToolsPanel';
import ServiceCenterFinder from '@/components/garage/ServiceCenterFinder';
import LoadingSpinner from '@/components/LoadingSpinner';
import PremiumGate from '@/components/PremiumGate';
import { useAuth } from '@/components/providers/AuthProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import { usePointsNotification } from '@/components/providers/PointsNotificationProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import ShareBuildButton from '@/components/ShareBuildButton';
import { useCarsList, useCarBySlug } from '@/hooks/useCarData';
import { useCarImages } from '@/hooks/useCarImages';
import { Icons } from '@/components/ui/Icons';
import EmptyState from '@/components/ui/EmptyState';
import { calculateBuildComplexity } from '@/data/upgradeTools';
import { useGarageScore } from '@/hooks/useGarageScore';

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
  
  // Celebration modal state
  const [celebrationData, setCelebrationData] = useState(null);
  
  // Expanded video/tools state
  const [expandedPartId, setExpandedPartId] = useState(null);
  const [showVideosFor, setShowVideosFor] = useState(null);
  const [showToolsFor, setShowToolsFor] = useState(null);
  
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { showPointsEarned } = usePointsNotification();
  const authModal = useAuthModal();
  const { builds, isLoading: buildsLoading, updateBuild } = useSavedBuilds();
  const { vehicles } = useOwnedVehicles();
  
  // Get the vehicle ID for this car to enable garage score updates
  const vehicleForCar = vehicles?.find(v => v.matchedCarSlug === selectedCar?.slug);
  const { recalculateScore } = useGarageScore(vehicleForCar?.id);
  
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
  // IMPORTANT: Uses the same data format as PartsSelector for sync between pages
  // Status can be: 'planned', 'purchased', 'installed'
  const buildParts = useMemo(() => {
    if (!currentBuild) return [];
    
    // Get upgrade keys from build
    const upgradeKeys = currentBuild.upgrades || [];
    const partsData = currentBuild.parts || [];
    
    // Debug: Log when parts data changes
    console.log('[MyInstall] buildParts recomputing:', {
      buildId: currentBuild.id,
      upgradeKeysCount: upgradeKeys.length,
      partsDataCount: partsData.length,
      installedInPartsData: partsData.filter(p => p.status === 'installed').map(p => p.upgradeKey),
    });
    
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
      
      // Determine installed status - use flat status field (standard format)
      // Legacy metadata.installed_at format is no longer used
      const isInstalled = partData.status === 'installed' || !!partData.installedAt;
      const installedAtValue = partData.installedAt || null;
      const installedByValue = partData.installedBy || null;
      
      return {
        id: `${upgradeKey}-${index}`,
        upgradeKey: upgradeKey,
        name: displayName,
        brandName: partData.brandName || null,
        partName: partData.partName || null,
        // Use consistent status field (matches PartsSelector format)
        status: isInstalled ? 'installed' : (partData.status || 'planned'),
        installed: isInstalled,
        installedAt: installedAtValue,
        installedBy: installedByValue,
        ...partData,
      };
    }).filter(part => part.upgradeKey); // Filter out any parts with empty keys
  }, [currentBuild]);
  
  // Calculate install progress
  const installProgress = useMemo(() => {
    if (buildParts.length === 0) return { installed: 0, total: 0, percent: 0, purchased: 0, planned: 0 };
    const installed = buildParts.filter(p => p.installed).length;
    const purchased = buildParts.filter(p => p.status === 'purchased' && !p.installed).length;
    const planned = buildParts.filter(p => (!p.status || p.status === 'planned') && !p.installed).length;
    return {
      installed,
      total: buildParts.length,
      percent: Math.round((installed / buildParts.length) * 100),
      purchased,
      planned,
    };
  }, [buildParts]);
  
  // Calculate total estimated install time and complexity
  const buildComplexity = useMemo(() => {
    if (normalizedUpgradeKeys.length === 0) return null;
    return calculateBuildComplexity(normalizedUpgradeKeys);
  }, [normalizedUpgradeKeys]);
  
  // Handle marking part as installed
  // IMPORTANT: Uses the same data format as PartsSelector for sync between pages
  // Sets status: 'installed' and installedAt: timestamp (not metadata.installed_at)
  const handleMarkInstalled = useCallback(async (partId, installedBy = 'self') => {
    if (!currentBuild || !user?.id) {
      console.warn('[MyInstall] Cannot mark installed - no build or user:', { hasBuild: !!currentBuild, hasUser: !!user?.id });
      return;
    }
    
    const part = buildParts.find(p => p.id === partId);
    if (!part) {
      console.warn('[MyInstall] Part not found for id:', partId);
      return;
    }
    
    console.log('[MyInstall] Marking part as installed:', { partId, upgradeKey: part.upgradeKey, partName: part.name });
    
    const now = new Date().toISOString();
    
    // Update the part with status field (matches PartsSelector format)
    const updatedParts = (currentBuild.parts || []).map(p => {
      if (p.upgradeKey === part.upgradeKey) {
        return {
          ...p,
          // Use standard status field (not nested metadata)
          status: 'installed',
          installedAt: now,
          installedBy: installedBy,
        };
      }
      return p;
    });
    
    // If part wasn't in the array, add it with proper status format
    // Include upgradeKey both at top level (for client) and in metadata (for DB reconstruction)
    if (!updatedParts.find(p => p.upgradeKey === part.upgradeKey)) {
      console.log('[MyInstall] Part not in existing parts array, adding new entry');
      updatedParts.push({
        id: `part_${Date.now()}`,
        upgradeKey: part.upgradeKey,
        upgradeName: part.name,
        status: 'installed',
        installedAt: now,
        installedBy: installedBy,
        // metadata.upgradeKey is used by SavedBuildsProvider to reconstruct upgradeKey from DB
        metadata: { upgradeKey: part.upgradeKey, upgradeName: part.name },
      });
    }
    
    console.log('[MyInstall] Updating build with parts:', { 
      buildId: currentBuild.id, 
      partsCount: updatedParts.length,
      installedParts: updatedParts.filter(p => p.status === 'installed').map(p => p.upgradeKey),
    });
    
    try {
      // Use selectedParts key (matches PartsSelector/Parts page format)
      const { error } = await updateBuild(currentBuild.id, { selectedParts: updatedParts });
      
      if (error) {
        console.error('[MyInstall] Failed to save part installation:', error);
        return;
      }
      
      console.log('[MyInstall] Build updated successfully');
      
      // Auto-collapse the expanded item after successful install
      setExpandedPartId(null);
      
      // Show points notification
      showPointsEarned(50, 'Upgrade installed');
      
      // Show celebration
      setCelebrationData({
        partName: part.name,
        installedCount: installProgress.installed + 1,
        totalCount: installProgress.total,
      });
      
      // Recalculate garage score (non-blocking)
      if (vehicleForCar?.id) {
        recalculateScore().catch(err => {
          console.warn('[MyInstall] Score recalculation failed:', err);
        });
      }
    } catch (err) {
      console.error('[MyInstall] Failed to mark part as installed:', err);
    }
  }, [currentBuild, buildParts, installProgress, updateBuild, user?.id, showPointsEarned, vehicleForCar?.id, recalculateScore, setExpandedPartId]);
  
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
      
      {/* Premium Gate for Install Tracking */}
      <PremiumGate feature="installTracking" variant="default">
        <div className={styles.content}>
          {/* Install Progress Header */}
          <div className={styles.progressHeader}>
            <div className={styles.progressInfo}>
              <h2 className={styles.pageTitle}>Installation Tracker</h2>
              <p className={styles.progressText}>
                {installProgress.installed} of {installProgress.total} parts installed
              </p>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${installProgress.percent}%` }}
              />
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
              {/* Parts Checklist - First (main focus) */}
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
                    onMarkInstalled={() => handleMarkInstalled(part.id, 'self')}
                  />
                ))}
                
                {/* Notice for parts not yet purchased */}
                {installProgress.planned > 0 && (
                  <Link 
                    href={currentBuildId ? `/garage/my-parts?build=${currentBuildId}` : `/garage/my-parts?car=${selectedCar.slug}`}
                    className={styles.needsPartsNotice}
                  >
                    <Icons.shoppingCart size={18} />
                    <div className={styles.needsPartsText}>
                      <span className={styles.needsPartsTitle}>
                        {installProgress.planned} {installProgress.planned === 1 ? 'part' : 'parts'} not yet purchased
                      </span>
                      <span className={styles.needsPartsSubtitle}>
                        Go to Parts page to find and order parts
                      </span>
                    </div>
                    <Icons.chevronRight size={18} />
                  </Link>
                )}
              </div>
              
              {/* Tools Panel - Second (supporting info) */}
              <InstallToolsPanel 
                upgradeKeys={normalizedUpgradeKeys}
                carName={selectedCar.name}
              />
            </div>
          )}
          
          {/* Service Center Path Content */}
          {activePath === 'service' && (
            <div className={styles.serviceContent}>
              <ServiceCenterFinder 
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
      
      {/* Celebration Modal */}
      {celebrationData && (
        <CelebrationModal
          isOpen={!!celebrationData}
          onClose={() => setCelebrationData(null)}
          partName={celebrationData.partName}
          installedCount={celebrationData.installedCount}
          totalCount={celebrationData.totalCount}
        />
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
