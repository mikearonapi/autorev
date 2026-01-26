'use client';

/**
 * Track Times Page - Track Tab for Data Section
 * 
 * This page shows track-related performance data for the selected vehicle:
 * - Lap Time Estimator (track time predictions)
 * - Track times logging (user-recorded lap times)
 * - Personal Best tracking with progress indicators
 * 
 * Vehicle selection is handled by the shared DataHeader in layout.jsx.
 * Vehicle ID comes from URL params (?vehicle=123).
 */

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import AuthModal, { useAuthModal } from '@/components/AuthModal';
import LapTimeEstimator from '@/components/LapTimeEstimator';
import LoadingSpinner from '@/components/LoadingSpinner';
import OnboardingPopup, { dataOnboardingSteps } from '@/components/OnboardingPopup';
import { useAuth } from '@/components/providers/AuthProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import { usePointsNotification } from '@/components/providers/PointsNotificationProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import TrackTimeLogModal from '@/components/TrackTimeLogModal';
import { useCarsList } from '@/hooks/useCarData';
import { useUserTrackTimes, useAddTrackTime, useDeleteTrackTime } from '@/hooks/useUserData';
import { calculateAllModificationGains } from '@/lib/performanceCalculator';

import styles from './page.module.css';

// Icons
const FlagIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const EditIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const TrashIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const TrophyIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
  </svg>
);

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

// NOTE: Metadata is defined in layout.jsx with template pattern
// Page-specific metadata would go in a separate metadata.js if needed

function TrackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading, isDataFetchReady } = useAuth();
  const { showPointsEarned } = usePointsNotification();
  const { vehicles, isLoading: vehiclesLoading } = useOwnedVehicles();
  const { builds, getBuildsByCarSlug, isLoading: buildsLoading } = useSavedBuilds();
  const { data: carsData } = useCarsList();
  const allCars = useMemo(() => carsData || [], [carsData]);
  const authModal = useAuthModal();
  
  // Track time logging state
  const [showTrackTimeModal, setShowTrackTimeModal] = useState(false);
  const [editingTrackTime, setEditingTrackTime] = useState(null);
  
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
      console.warn('[Track] Loading timeout - showing content');
      setLoadingTimedOut(true);
    }, 6000);
    return () => clearTimeout(timeout);
  }, [authLoading, isDataFetchReady, vehiclesLoading]);
  
  // Get vehicle ID from URL params (shared with layout)
  const vehicleIdFromUrl = searchParams.get('vehicle');
  const actionFromUrl = searchParams.get('action');
  
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
  
  // Get selected vehicle data
  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId) return null;
    return userVehicles.find(v => v.id === selectedVehicleId) || null;
  }, [userVehicles, selectedVehicleId]);
  
  // Handle action=log param to auto-open track time modal
  useEffect(() => {
    if (actionFromUrl === 'log' && !actionProcessed && selectedVehicle && isAuthenticated) {
      const timer = setTimeout(() => {
        setShowTrackTimeModal(true);
        setActionProcessed(true);
        
        // Clear the action param from URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('action');
        router.replace(newUrl.pathname + newUrl.search, { scroll: false });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [actionFromUrl, actionProcessed, selectedVehicle, isAuthenticated, router]);
  
  // Get build data for selected vehicle
  const vehicleBuildData = useMemo(() => {
    if (!selectedVehicle) return null;
    
    const matchedCar = selectedVehicle.matchedCar;
    const carSlug = selectedVehicle.matchedCarSlug;
    const carId = selectedVehicle.matchedCarId;
    
    const hasCarReference = !!(carSlug || carId);
    const matchedCarNotFound = hasCarReference && !matchedCar;
    
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
  
  // Calculate HP gains
  const modificationGains = useMemo(() => {
    const modKeys = installedUpgrades.map(u => typeof u === 'string' ? u : u?.key).filter(Boolean);
    return calculateAllModificationGains(modKeys, selectedVehicle?.matchedCar);
  }, [installedUpgrades, selectedVehicle?.matchedCar]);
  
  const hpGain = modificationGains.hpGain || 0;
  const estimatedHp = stockHp + hpGain;
  
  // React Query hooks for track times
  const carSlugForTracks = selectedVehicle?.matchedCarSlug;
  const { 
    data: trackTimes = [], 
    isLoading: trackTimesLoading,
  } = useUserTrackTimes(user?.id, carSlugForTracks, { 
    enabled: isAuthenticated && !!user?.id,
    limit: 10,
  });
  
  const addTrackTime = useAddTrackTime();
  const deleteTrackTime = useDeleteTrackTime();
  
  // Calculate Personal Best (PB) and improvement trends
  const trackTimesWithPB = useMemo(() => {
    if (!trackTimes || trackTimes.length === 0) return [];
    
    // Group by track_name
    const byTrack = {};
    trackTimes.forEach(time => {
      const key = time.track_name;
      if (!byTrack[key]) byTrack[key] = [];
      byTrack[key].push(time);
    });
    
    // Sort each group by date and find PB
    const pbByTrack = {};
    const improvementByTrack = {};
    
    Object.entries(byTrack).forEach(([track, times]) => {
      const sorted = [...times].sort((a, b) => 
        new Date(a.session_date) - new Date(b.session_date)
      );
      
      const pb = Math.min(...times.map(t => t.lap_time_seconds));
      pbByTrack[track] = pb;
      
      if (sorted.length >= 2) {
        const firstTime = sorted[0].lap_time_seconds;
        const improvement = firstTime - pb;
        improvementByTrack[track] = {
          total: improvement,
          sessions: sorted.length,
          firstTime,
          pb,
        };
      }
    });
    
    return trackTimes.map(time => ({
      ...time,
      isPB: time.lap_time_seconds === pbByTrack[time.track_name],
      trackImprovement: improvementByTrack[time.track_name] || null,
      sessionsAtTrack: byTrack[time.track_name]?.length || 1,
    }));
  }, [trackTimes]);
  
  // Get summary stats for display
  const trackTimesSummary = useMemo(() => {
    if (!trackTimesWithPB || trackTimesWithPB.length === 0) return null;
    
    const uniqueTracks = [...new Set(trackTimesWithPB.map(t => t.track_name))].length;
    const totalSessions = trackTimesWithPB.length;
    
    let totalImprovement = 0;
    const tracksWithProgress = new Set();
    
    trackTimesWithPB.forEach(time => {
      if (time.trackImprovement && time.trackImprovement.total > 0) {
        if (!tracksWithProgress.has(time.track_name)) {
          totalImprovement += time.trackImprovement.total;
          tracksWithProgress.add(time.track_name);
        }
      }
    });
    
    return {
      uniqueTracks,
      totalSessions,
      totalImprovement: totalImprovement.toFixed(2),
      hasImprovement: totalImprovement > 0,
    };
  }, [trackTimesWithPB]);
  
  // Delete track time handler
  const handleDeleteTrackTime = useCallback(async (trackTimeId) => {
    if (!user?.id || !trackTimeId) return;
    
    if (!window.confirm('Delete this lap time? This cannot be undone.')) {
      return;
    }
    
    try {
      await deleteTrackTime.mutateAsync({ userId: user.id, trackTimeId });
    } catch (err) {
      console.error('[TrackPage] Error deleting track time:', err);
      alert('Failed to delete lap time. Please try again.');
    }
  }, [user?.id, deleteTrackTime]);
  
  // Save track time handler
  const handleSaveTrackTime = useCallback(async (trackData) => {
    if (!user?.id || !selectedVehicle) return;
    
    try {
      const payload = {
        ...trackData,
        carSlug: selectedVehicle.matchedCarSlug,
        userVehicleId: selectedVehicle.id,
        estimatedHp: estimatedHp,
        modsSummary: vehicleBuildData?.selectedUpgrades || {},
      };
      
      await addTrackTime.mutateAsync({ userId: user.id, trackTime: payload });
      
      showPointsEarned(50, 'Track time logged');
      
      setShowTrackTimeModal(false);
      setEditingTrackTime(null);
    } catch (err) {
      console.error('[TrackPage] Error saving track time:', err);
      throw err;
    }
  }, [user?.id, selectedVehicle, estimatedHp, vehicleBuildData, addTrackTime, showPointsEarned]);
  
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
  
  // Loading state
  if (isDataLoading) {
    return (
      <div className={styles.pageContent}>
        <LoadingSpinner 
          variant="branded" 
          text="Loading Track Data" 
          subtext="Fetching lap times..."
          fullPage 
        />
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
            Lap time estimates are <strong>approximations</strong>—actual times depend on driver skill, conditions, and car setup.
          </span>
        </div>
      )}
      
      {/* Track Content */}
      {selectedVehicle && (
        <section className={styles.syntheticDataSection}>
          {buildsLoading ? (
            <div className={styles.loadingCard}>
              <div className={styles.spinner} />
              <span>Loading build data...</span>
            </div>
          ) : (
            <>
              {/* Lap Time Estimator */}
              <div className={styles.dataCard}>
                <LapTimeEstimator
                  stockHp={stockHp}
                  estimatedHp={estimatedHp}
                  weight={selectedVehicle.matchedCar?.curb_weight || selectedVehicle.matchedCar?.weight || 3500}
                  drivetrain={selectedVehicle.matchedCar?.drivetrain || 'RWD'}
                  tireCompound={tireCompound}
                  suspensionSetup={vehicleBuildData?.specs?.suspension}
                  brakeSetup={vehicleBuildData?.specs?.brakes}
                  aeroSetup={vehicleBuildData?.specs?.aero}
                  weightMod={vehicleBuildData?.specs?.weight?.reduction || 0}
                  user={user}
                  carSlug={selectedVehicle.matchedCarSlug}
                  carName={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
                  modsSummary={vehicleBuildData?.specs}
                  hideLogging={true}
                />
              </div>
              
              {/* Log Your Track Times Section */}
              <div className={styles.logDataSection}>
                <div className={styles.logDataHeader}>
                  <div className={styles.logDataTitleRow}>
                    <span className={styles.logDataIcon}>
                      <FlagIcon />
                    </span>
                    <h3 className={styles.logDataTitle}>Your Lap Times</h3>
                  </div>
                  <p className={styles.logDataSubtitle}>
                    Log your actual track times for deeper insights and to help us improve predictions for your car
                  </p>
                </div>
                
                {/* Show logged track times */}
                {trackTimesLoading ? (
                  <div className={styles.logDataLoading}>
                    <div className={styles.spinner} />
                    <span>Loading lap times...</span>
                  </div>
                ) : trackTimesWithPB.length > 0 ? (
                  <>
                    {/* Progress Summary Banner */}
                    {trackTimesSummary && trackTimesSummary.hasImprovement && (
                      <div className={styles.trackProgressBanner}>
                        <div className={styles.trackProgressIcon}>📈</div>
                        <div className={styles.trackProgressText}>
                          <span className={styles.trackProgressValue}>
                            -{trackTimesSummary.totalImprovement}s
                          </span>
                          <span className={styles.trackProgressLabel}>
                            improvement across {trackTimesSummary.uniqueTracks} track{trackTimesSummary.uniqueTracks !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className={styles.trackTimesList}>
                    {trackTimesWithPB.slice(0, 5).map((time) => (
                      <div key={time.id} className={`${styles.trackTimeItem} ${time.isPB ? styles.trackTimeItemPB : ''}`}>
                        <div className={styles.trackTimeMain}>
                          {/* PB Badge */}
                          {time.isPB && (
                            <span className={styles.trackTimePBBadge} title="Personal Best">
                              <TrophyIcon size={12} />
                              PB
                            </span>
                          )}
                          <span className={styles.trackTimeLap}>
                            {Math.floor(time.lap_time_seconds / 60)}:{(time.lap_time_seconds % 60).toFixed(3).padStart(6, '0')}
                          </span>
                          <span className={styles.trackTimeTrack}>{time.track_name}</span>
                          {time.track_config && (
                            <span className={styles.trackTimeConfig}>({time.track_config})</span>
                          )}
                        </div>
                        <div className={styles.trackTimeMeta}>
                          <span className={styles.trackTimeDate}>
                            {new Date(time.session_date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: time.session_date?.startsWith(new Date().getFullYear().toString()) ? undefined : 'numeric'
                            })}
                          </span>
                          <span className={styles.trackTimeConditions}>
                            {time.conditions || 'dry'}
                          </span>
                        </div>
                        {time.estimated_time_seconds && (
                          <div className={`${styles.trackTimeDiff} ${time.lap_time_seconds <= time.estimated_time_seconds ? styles.positive : styles.negative}`}>
                            {time.lap_time_seconds <= time.estimated_time_seconds ? '' : '+'}
                            {(time.lap_time_seconds - time.estimated_time_seconds).toFixed(2)}s vs estimate
                          </div>
                        )}
                        {/* Track progress indicator */}
                        {time.trackImprovement && time.trackImprovement.total > 0 && time.isPB && (
                          <div className={styles.trackTimeProgress}>
                            <span className={styles.trackTimeProgressArrow}>↓</span>
                            <span className={styles.trackTimeProgressValue}>
                              {time.trackImprovement.total.toFixed(2)}s
                            </span>
                            <span className={styles.trackTimeProgressLabel}>
                              over {time.trackImprovement.sessions} sessions
                            </span>
                          </div>
                        )}
                        {/* Edit/Delete buttons */}
                        <div className={styles.trackTimeActions}>
                          <button 
                            className={styles.trackTimeEditBtn}
                            onClick={() => {
                              setEditingTrackTime(time);
                              setShowTrackTimeModal(true);
                            }}
                            aria-label="Edit lap time"
                            title="Edit"
                          >
                            <EditIcon size={14} />
                          </button>
                          <button 
                            className={styles.trackTimeDeleteBtn}
                            onClick={() => handleDeleteTrackTime(time.id)}
                            aria-label="Delete lap time"
                            title="Delete"
                            disabled={deleteTrackTime.isPending}
                          >
                            <TrashIcon size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {trackTimesWithPB.length > 5 && (
                      <div className={styles.trackTimesMore}>
                        +{trackTimesWithPB.length - 5} more lap times
                      </div>
                    )}
                  </div>
                  </>
                ) : (
                  <div className={styles.logDataEmpty}>
                    <p>No lap times logged yet</p>
                    <span>Your data helps refine track estimates for this model</span>
                  </div>
                )}
                
                {/* Log Track Time CTA Button */}
                <button 
                  className={styles.logDataCta}
                  onClick={() => {
                    setEditingTrackTime(null);
                    setShowTrackTimeModal(true);
                  }}
                >
                  <PlusIcon />
                  Log Lap Time
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
      
      {/* Track Time Log Modal */}
      <TrackTimeLogModal
        isOpen={showTrackTimeModal}
        onClose={() => {
          setShowTrackTimeModal(false);
          setEditingTrackTime(null);
        }}
        onSave={handleSaveTrackTime}
        vehicleInfo={selectedVehicle ? {
          year: selectedVehicle.year,
          make: selectedVehicle.make,
          model: selectedVehicle.model,
        } : null}
        editingResult={editingTrackTime}
        currentBuildInfo={{
          upgrades: installedUpgrades.map(u => typeof u === 'string' ? u : u?.key).filter(Boolean),
          totalHpGain: hpGain,
          estimatedHp,
        }}
      />
      
      {/* Onboarding Popup - Same as Dyno page for consistent UX */}
      <OnboardingPopup 
        storageKey="autorev_data_onboarding_dismissed"
        steps={dataOnboardingSteps}
        accentColor="var(--sn-accent)"
      />
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className={styles.pageContent}>
        <LoadingSpinner 
          variant="branded" 
          text="Loading Track Data" 
          subtext="Fetching lap times..."
          fullPage 
        />
      </div>
    }>
      <TrackPageContent />
    </Suspense>
  );
}
