'use client';

/**
 * Data Page - Virtual Dyno (Primary Tab)
 * 
 * This page shows dyno-related performance data for the selected vehicle:
 * - Virtual Dyno Chart (estimated HP/TQ curves)
 * - Calculated Performance (0-60, 1/4 mile, etc.)
 * - Power Breakdown (where HP gains come from)
 * - Dyno logging (user-recorded dyno results)
 * 
 * Vehicle selection is handled by the shared DataHeader in layout.jsx.
 * Vehicle ID comes from URL params (?vehicle=123).
 * 
 * Legacy URL handling:
 * - /data?filter=track → redirects to /data/track
 * - /data?action=log&filter=track → redirects to /data/track?action=log
 */

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';

import Link from 'next/link';
import { useRouter, useSearchParams , redirect } from 'next/navigation';

import AuthModal, { useAuthModal } from '@/components/AuthModal';
import CalculatedPerformance from '@/components/CalculatedPerformance';
import DynoLogModal from '@/components/DynoLogModal';
import OnboardingPopup, { dataOnboardingSteps } from '@/components/OnboardingPopup';
import PowerBreakdown from '@/components/PowerBreakdown';
import { useAuth } from '@/components/providers/AuthProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import { usePointsNotification } from '@/components/providers/PointsNotificationProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { DataPageSkeleton } from '@/components/ui/Skeleton';
import VirtualDynoChart from '@/components/VirtualDynoChart';
import { useCarsList } from '@/hooks/useCarData';
import { useDynoResults } from '@/hooks/useUserData';
import { calculateAllModificationGains } from '@/lib/performanceCalculator';

import styles from './page.module.css';

// Icons
const ChartIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 3v18h18"/>
    <path d="M18 17V9"/>
    <path d="M13 17V5"/>
    <path d="M8 17v-3"/>
  </svg>
);

const CarIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-5.5c-.4-.7-1.1-1.5-2.3-1.5H11c-1.2 0-1.9.8-2.3 1.5L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const GaugeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);

function DynoPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading, isDataFetchReady } = useAuth();
  const { showPointsEarned } = usePointsNotification();
  const { vehicles, isLoading: vehiclesLoading } = useOwnedVehicles();
  const { builds, getBuildsByCarSlug, isLoading: buildsLoading } = useSavedBuilds();
  const { data: carsData } = useCarsList();
  const allCars = useMemo(() => carsData || [], [carsData]);
  const authModal = useAuthModal();
  
  // Handle legacy URL redirects
  const filterFromUrl = searchParams.get('filter');
  const actionFromUrl = searchParams.get('action');
  
  useEffect(() => {
    // Redirect legacy ?filter=track URLs to /data/track
    if (filterFromUrl === 'track') {
      const redirectUrl = actionFromUrl 
        ? `/data/track?action=${actionFromUrl}` 
        : '/data/track';
      router.replace(redirectUrl);
    }
  }, [filterFromUrl, actionFromUrl, router]);
  
  // Dyno logging state
  const [showDynoModal, setShowDynoModal] = useState(false);
  const [editingDynoResult, setEditingDynoResult] = useState(null);
  
  // Track if we've processed the action param
  const [actionProcessed, setActionProcessed] = useState(false);
  
  // Safety timeout to prevent infinite loading
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  useEffect(() => {
    if (!authLoading && isDataFetchReady && !vehiclesLoading) {
      setLoadingTimedOut(false);
      return;
    }
    const timeout = setTimeout(() => {
      console.warn('[Data] Loading timeout - showing content');
      setLoadingTimedOut(true);
    }, 6000);
    return () => clearTimeout(timeout);
  }, [authLoading, isDataFetchReady, vehiclesLoading]);
  
  // Get vehicle ID from URL params (shared with layout)
  const vehicleIdFromUrl = searchParams.get('vehicle');
  
  // Get user's vehicles with matched car data
  const userVehicles = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];
    
    return vehicles.map(vehicle => {
      let matchedCar = null;
      if (vehicle.matchedCarId) {
        matchedCar = allCars.find(c => c.id === vehicle.matchedCarId);
      }
      if (!matchedCar && vehicle.matchedCarSlug) {
        matchedCar = allCars.find(c => c.slug === vehicle.matchedCarSlug);
      }
      
      return {
        ...vehicle,
        matchedCar,
        matchedCarResolved: !!matchedCar,
      };
    });
  }, [vehicles, allCars]);
  
  // Determine selected vehicle ID with fallback logic
  const selectedVehicleId = useMemo(() => {
    if (userVehicles.length === 0) return null;
    
    if (vehicleIdFromUrl) {
      const vehicleExists = userVehicles.some(v => v.id === vehicleIdFromUrl);
      if (vehicleExists) return vehicleIdFromUrl;
    }
    
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('autorev_data_selected_vehicle');
      if (storedId) {
        const vehicleExists = userVehicles.some(v => v.id === storedId);
        if (vehicleExists) return storedId;
      }
    }
    
    return userVehicles[0]?.id || null;
  }, [userVehicles, vehicleIdFromUrl]);
  
  // Dyno results via React Query
  const { 
    data: dynoResults = [], 
    isLoading: dynoResultsLoading,
    refetch: refetchDynoResults,
  } = useDynoResults(selectedVehicleId, { enabled: isAuthenticated && !!selectedVehicleId });
  
  // Get selected vehicle data
  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId) return null;
    return userVehicles.find(v => v.id === selectedVehicleId) || null;
  }, [userVehicles, selectedVehicleId]);
  
  // Handle action=log param to auto-open dyno modal
  useEffect(() => {
    if (actionFromUrl === 'log' && filterFromUrl !== 'track' && !actionProcessed && selectedVehicle && isAuthenticated) {
      const timer = setTimeout(() => {
        setShowDynoModal(true);
        setActionProcessed(true);
        
        // Clear the action param from URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('action');
        router.replace(newUrl.pathname + newUrl.search, { scroll: false });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [actionFromUrl, filterFromUrl, actionProcessed, selectedVehicle, isAuthenticated, router]);
  
  // Get build data for selected vehicle
  const vehicleBuildData = useMemo(() => {
    if (!selectedVehicle) return null;
    
    const matchedCar = selectedVehicle.matchedCar;
    const carSlug = selectedVehicle.matchedCarSlug;
    const carId = selectedVehicle.matchedCarId;
    
    const hasCarReference = !!(carSlug || carId);
    const matchedCarNotFound = hasCarReference && !matchedCar;
    
    if (matchedCarNotFound) {
      console.warn(`[Data Page] Vehicle ${selectedVehicle.id} has car reference but matchedCar not found in catalog.`);
    }
    
    const stockHp = matchedCar?.hp || (matchedCarNotFound ? null : 300);
    const weight = matchedCar?.curb_weight || matchedCar?.weight || (matchedCarNotFound ? null : 3500);
    const drivetrain = matchedCar?.drivetrain || (matchedCarNotFound ? null : 'RWD');
    
    const vehicleMods = selectedVehicle.installedModifications || [];
    const vehicleHpGain = selectedVehicle.totalHpGain || 0;
    const vehicleActiveBuildId = selectedVehicle.activeBuildId;
    
    if (vehicleMods.length > 0 || vehicleHpGain > 0) {
      let buildData = null;
      if (vehicleActiveBuildId) {
        buildData = builds.find(b => b.id === vehicleActiveBuildId);
      }
      
      return {
        id: vehicleActiveBuildId,
        projectName: buildData?.name || 'My Build',
        selectedUpgrades: {
          upgrades: vehicleMods,
          wheelFitment: buildData?.wheelFitment || selectedVehicle.customSpecs?.wheels,
          factoryConfig: buildData?.factoryConfig,
        },
        specs: selectedVehicle.customSpecs || {},
        stockHp,
        totalHpGain: vehicleHpGain,
        finalHp: stockHp !== null ? stockHp + vehicleHpGain : null,
        weight,
        drivetrain,
        sourceType: 'vehicle',
        matchedCarNotFound,
      };
    }
    
    if (carSlug) {
      const carBuilds = getBuildsByCarSlug(carSlug);
      
      if (carBuilds && carBuilds.length > 0) {
        const latestBuild = carBuilds[0];
        
        return {
          id: latestBuild.id,
          projectName: latestBuild.name,
          selectedUpgrades: {
            upgrades: latestBuild.upgrades || [],
            wheelFitment: latestBuild.wheelFitment,
            factoryConfig: latestBuild.factoryConfig,
          },
          specs: {},
          stockHp,
          totalHpGain: latestBuild.totalHpGain || 0,
          finalHp: latestBuild.finalHp || stockHp,
          weight,
          drivetrain,
          sourceType: 'build',
          matchedCarNotFound,
        };
      }
    }
    
    return {
      specs: selectedVehicle.customSpecs || {},
      selectedUpgrades: { upgrades: [] },
      stockHp,
      totalHpGain: 0,
      finalHp: stockHp,
      weight,
      drivetrain,
      sourceType: 'stock',
      matchedCarNotFound,
    };
  }, [selectedVehicle, getBuildsByCarSlug, builds]);
  
  // Get HP values
  const stockHp = vehicleBuildData?.stockHp ?? selectedVehicle?.matchedCar?.hp ?? 300;
  
  // Get tire compound from build
  const tireCompound = useMemo(() => {
    const wheelFitment = vehicleBuildData?.selectedUpgrades?.wheelFitment;
    return wheelFitment?.tireCompound || vehicleBuildData?.specs?.suspension?.tireCompound || 'summer';
  }, [vehicleBuildData]);
  
  // Get list of installed upgrades
  const installedUpgrades = useMemo(() => {
    return vehicleBuildData?.selectedUpgrades?.upgrades || [];
  }, [vehicleBuildData]);
  
  // Calculate ALL gains using performanceCalculator
  const stockTorque = selectedVehicle?.matchedCar?.torque || Math.round(stockHp * 0.85);
  const modificationGains = useMemo(() => {
    const modKeys = installedUpgrades.map(u => typeof u === 'string' ? u : u?.key).filter(Boolean);
    return calculateAllModificationGains(modKeys, selectedVehicle?.matchedCar);
  }, [installedUpgrades, selectedVehicle?.matchedCar]);
  
  const hpGain = modificationGains.hpGain || 0;
  const estimatedHp = stockHp + hpGain;
  
  const torqueGain = modificationGains.torqueGain || 0;
  const estimatedTorque = stockTorque + torqueGain;
  
  // Detect upgrade categories for experience score calculations
  const upgradeCategories = useMemo(() => {
    const upgrades = installedUpgrades.map(u => typeof u === 'string' ? u : u?.key).filter(Boolean);
    return {
      hasExhaust: upgrades.some(k => k.includes('exhaust') || k === 'headers' || k === 'downpipe'),
      hasIntake: upgrades.some(k => k.includes('intake') || k === 'throttle-body'),
      hasTune: upgrades.some(k => k.includes('tune') || k.includes('ecu') || k === 'piggyback-tuner'),
      hasSuspension: upgrades.some(k => k.includes('coilover') || k.includes('spring') || k.includes('sway')),
    };
  }, [installedUpgrades]);
  
  // Save dyno result handler
  const handleSaveDynoResult = useCallback(async (dynoData) => {
    if (!selectedVehicleId) return;
    
    try {
      const modsSnapshot = {
        upgrades: installedUpgrades.map(u => typeof u === 'string' ? u : u?.key).filter(Boolean),
        totalHpGain: hpGain,
        estimatedHp,
        stockHp,
      };
      
      const payload = {
        userVehicleId: selectedVehicleId,
        modsSummary: modsSnapshot,
        ...dynoData,
      };
      
      const response = await fetch('/api/dyno-results', {
        method: editingDynoResult ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingDynoResult ? { id: editingDynoResult.id, ...dynoData } : payload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save dyno result');
      }
      
      await refetchDynoResults();
      
      if (!editingDynoResult) {
        showPointsEarned(50, 'Dyno logged');
      }
      
      setShowDynoModal(false);
      setEditingDynoResult(null);
    } catch (err) {
      console.error('[DataPage] Error saving dyno result:', err);
      throw err;
    }
  }, [selectedVehicleId, editingDynoResult, refetchDynoResults, showPointsEarned, installedUpgrades, hpGain, estimatedHp, stockHp]);
  
  // Get the latest dyno result for comparison
  const latestDynoResult = useMemo(() => {
    return dynoResults.length > 0 ? dynoResults[0] : null;
  }, [dynoResults]);
  
  // Calculate predicted WHP (with ~15% drivetrain loss)
  const predictedWhp = useMemo(() => {
    return Math.round(estimatedHp * 0.85);
  }, [estimatedHp]);
  
  // Loading state
  const isDataLoading = useMemo(() => {
    if (loadingTimedOut) return false;
    if (authLoading) return true;
    if (!isAuthenticated) return false;
    if (!isDataFetchReady) return true;
    return vehiclesLoading;
  }, [authLoading, isAuthenticated, isDataFetchReady, vehiclesLoading, loadingTimedOut]);
  
  // Not authenticated - show sign in prompt
  // NOTE: Keep messaging consistent with original combined page
  if (!authLoading && !isAuthenticated) {
    return (
      <div className={styles.pageContent}>
        <div className={styles.emptyState}>
          <ChartIcon />
          <h2>Your Data Hub</h2>
          <p>Track sessions, performance estimates, and data logs—all in one place.</p>
          <button className={styles.primaryBtn} onClick={() => authModal.openSignIn()}>
            Sign In to Get Started
          </button>
        </div>
        <AuthModal 
          isOpen={authModal.isOpen} 
          onClose={authModal.close}
          defaultMode={authModal.defaultMode}
        />
      </div>
    );
  }
  
  // Loading state - use skeleton that matches content shape
  if (isDataLoading) {
    return (
      <div className={styles.pageContent}>
        <DataPageSkeleton />
      </div>
    );
  }
  
  // No vehicles - show centered prompt matching original page layout
  if (userVehicles.length === 0) {
    return (
      <div className={styles.pageContent}>
        <div className={styles.noVehicles}>
          <CarIcon size={48} />
          <p>Add a vehicle to your garage to see performance data</p>
          <Link href="/garage" className={styles.addVehicleBtn}>
            <PlusIcon />
            Add Vehicle
          </Link>
        </div>
        
        <AuthModal 
          isOpen={authModal.isOpen} 
          onClose={authModal.close}
          defaultMode={authModal.defaultMode}
        />
      </div>
    );
  }
  
  return (
    <div className={styles.pageContent}>
      {/* How Estimates Work - Single explanation */}
      {selectedVehicle && !buildsLoading && (
        <div className={styles.estimateExplainer}>
          <span className={styles.estimateExplainerIcon}>ⓘ</span>
          <span className={styles.estimateExplainerText}>
            All figures are <strong>estimates</strong> for <em>relative comparison</em>—actual results vary with tune quality and conditions.
          </span>
        </div>
      )}
      
      {/* Dyno Content */}
      {selectedVehicle && (
        <section className={styles.syntheticDataSection}>
          {buildsLoading ? (
            <div className={styles.loadingCard}>
              <div className={styles.spinner} />
              <span>Loading build data...</span>
            </div>
          ) : (
            <>
              {/* Virtual Dyno */}
              <div className={styles.dataCard}>
                <VirtualDynoChart
                  stockHp={stockHp}
                  estimatedHp={estimatedHp}
                  stockTorque={stockTorque}
                  estimatedTq={estimatedTorque}
                  peakRpm={selectedVehicle.matchedCar?.peak_hp_rpm || 6500}
                  carName={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
                  carSlug={selectedVehicle.matchedCarSlug}
                  car={selectedVehicle.matchedCar}
                  selectedUpgrades={installedUpgrades}
                />
              </div>
              
              {/* Calculated Performance */}
              <CalculatedPerformance
                stockHp={stockHp}
                estimatedHp={estimatedHp}
                weight={selectedVehicle.matchedCar?.curbWeight || selectedVehicle.matchedCar?.weight || 3500}
                drivetrain={selectedVehicle.matchedCar?.drivetrain || 'RWD'}
                tireCompound={tireCompound}
                weightMod={vehicleBuildData?.specs?.weight?.reduction || 0}
                stockZeroToSixty={selectedVehicle.matchedCar?.zeroToSixty}
                stockQuarterMile={selectedVehicle.matchedCar?.quarterMile}
                stockBraking={selectedVehicle.matchedCar?.braking60To0}
                stockLateralG={selectedVehicle.matchedCar?.lateralG}
                stockTrapSpeed={null}
                hasExhaust={upgradeCategories.hasExhaust}
                hasIntake={upgradeCategories.hasIntake}
                hasTune={upgradeCategories.hasTune}
                hasSuspension={upgradeCategories.hasSuspension}
                carName={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
                carSlug={selectedVehicle.matchedCarSlug}
              />
              
              {/* Power Breakdown */}
              <div className={styles.dataCard}>
                <PowerBreakdown
                  upgrades={installedUpgrades}
                  car={selectedVehicle.matchedCar}
                  totalHpGain={hpGain}
                  carName={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
                  carSlug={selectedVehicle.matchedCarSlug}
                />
              </div>
              
              {/* Quick Build Link if no build configured */}
              {(!vehicleBuildData?.selectedUpgrades?.upgrades?.length) && (
                <div className={styles.buildPrompt}>
                  <p>Configure your build to see accurate power estimates</p>
                  <Link href={`/garage?tab=build&vehicle=${selectedVehicle.id}`} className={styles.buildPromptBtn}>
                    Configure Build
                    <ChevronRightIcon />
                  </Link>
                </div>
              )}
              
              {/* Log Your Dyno Data Section */}
              <div className={styles.logDataSection}>
                <div className={styles.logDataHeader}>
                  <div className={styles.logDataTitleRow}>
                    <span className={styles.logDataIcon}>
                      <GaugeIcon />
                    </span>
                    <h3 className={styles.logDataTitle}>Your Dyno Results</h3>
                  </div>
                  <p className={styles.logDataSubtitle}>
                    Log your actual dyno numbers to compare against estimates and help us improve predictions for your car
                  </p>
                </div>
                
                {/* Show logged dyno results */}
                {dynoResultsLoading ? (
                  <div className={styles.logDataLoading}>
                    <div className={styles.spinner} />
                    <span>Loading results...</span>
                  </div>
                ) : dynoResults.length > 0 ? (
                  <div className={styles.dynoResultsList}>
                    {dynoResults.slice(0, 3).map((result) => (
                      <div key={result.id} className={styles.dynoResultItem}>
                        <div className={styles.dynoResultMain}>
                          <div className={styles.dynoResultPower}>
                            <span className={styles.dynoResultWhp}>{result.whp}</span>
                            <span className={styles.dynoResultUnit}>WHP</span>
                          </div>
                          {result.wtq && (
                            <div className={styles.dynoResultTorque}>
                              <span>{result.wtq}</span>
                              <span className={styles.dynoResultUnit}>WTQ</span>
                            </div>
                          )}
                        </div>
                        <div className={styles.dynoResultMeta}>
                          <span className={styles.dynoResultDate}>
                            {new Date(result.dyno_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: result.dyno_date?.startsWith(new Date().getFullYear()) ? undefined : 'numeric'
                            })}
                          </span>
                          <span className={styles.dynoResultDyno}>
                            {result.dyno_type?.replace('_', ' ')}
                          </span>
                        </div>
                        {predictedWhp && (
                          <div className={`${styles.dynoResultDiff} ${result.whp >= predictedWhp ? styles.positive : styles.negative}`}>
                            {result.whp >= predictedWhp ? '+' : ''}{result.whp - predictedWhp} vs estimate
                          </div>
                        )}
                        <button 
                          className={styles.dynoResultEditBtn}
                          onClick={() => {
                            setEditingDynoResult(result);
                            setShowDynoModal(true);
                          }}
                          aria-label="Edit dyno result"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                    {dynoResults.length > 3 && (
                      <div className={styles.dynoResultsMore}>
                        +{dynoResults.length - 3} more results
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.logDataEmpty}>
                    <p>No dyno results logged yet</p>
                    <span>Your data helps refine estimates for this model</span>
                  </div>
                )}
                
                {/* Log Dyno CTA Button */}
                <button 
                  className={styles.logDataCta}
                  onClick={() => {
                    setEditingDynoResult(null);
                    setShowDynoModal(true);
                  }}
                >
                  <PlusIcon />
                  Log Dyno Result
                </button>
              </div>
            </>
          )}
        </section>
      )}
      
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />
      
      {/* Dyno Log Modal */}
      <DynoLogModal
        isOpen={showDynoModal}
        onClose={() => {
          setShowDynoModal(false);
          setEditingDynoResult(null);
        }}
        onSave={handleSaveDynoResult}
        vehicleInfo={selectedVehicle ? {
          year: selectedVehicle.year,
          make: selectedVehicle.make,
          model: selectedVehicle.model,
        } : null}
        predictedWhp={predictedWhp}
        editingResult={editingDynoResult}
        currentBuildInfo={{
          upgrades: installedUpgrades.map(u => typeof u === 'string' ? u : u?.key).filter(Boolean),
          totalHpGain: hpGain,
          estimatedHp,
        }}
      />
      
      {/* Onboarding Popup */}
      <OnboardingPopup 
        storageKey="autorev_data_onboarding_dismissed"
        steps={dataOnboardingSteps}
        accentColor="var(--sn-accent)"
      />
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function DataPage() {
  return (
    <Suspense fallback={
      <div className={styles.pageContent}>
        <DataPageSkeleton />
      </div>
    }>
      <DynoPageContent />
    </Suspense>
  );
}
