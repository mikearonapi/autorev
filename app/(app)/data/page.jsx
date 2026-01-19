'use client';

/**
 * Data Page - Performance Data Hub
 * 
 * This page is dedicated to viewing and logging performance data for your vehicles.
 * 
 * Structure:
 * 1. Vehicle Selector - Choose which car to view data for
 * 2. Synthetic Data - Estimated performance based on modifications
 *    - Virtual Dyno (estimated HP/TQ curves)
 *    - Lap Time Estimator (track time predictions)
 * 3. Logged Data - User-recorded performance data
 *    - Track sessions & lap times
 *    - Future: OBD2 data, telemetry uploads, acceleration runs
 */

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { useCarsList } from '@/hooks/useCarData';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import VehicleSelectModal from '@/components/VehicleSelectModal';
import VirtualDynoChart from '@/components/VirtualDynoChart';
import LapTimeEstimator from '@/components/LapTimeEstimator';
import CalculatedPerformance from '@/components/CalculatedPerformance';
import PowerBreakdown from '@/components/PowerBreakdown';
import PowerLimitsAdvisory from '@/components/PowerLimitsAdvisory';
import HandlingBalanceIndicator from '@/components/HandlingBalanceIndicator';
import AeroBalanceChart from '@/components/AeroBalanceChart';
import { useTuningProfile } from '@/hooks/useTuningProfile';
import { useCarImages } from '@/hooks/useCarImages';
import LoadingSpinner from '@/components/LoadingSpinner';
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

const FlagIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const PlugIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22V12"/>
    <path d="M5 12V2"/>
    <path d="M19 12V2"/>
    <path d="M5 12h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const UploadIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const TrendIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const CarIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-5.5c-.4-.7-1.1-1.5-2.3-1.5H11c-1.2 0-1.9.8-2.3 1.5L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
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

const StopwatchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="13" r="8"/>
    <path d="M12 9v4l2 2"/>
    <path d="M9 2h6"/>
  </svg>
);

// Data filter categories
const DATA_CATEGORIES = [
  { id: 'all', label: 'All Data' },
  { id: 'synthetic', label: 'Estimated' },
  { id: 'track', label: 'Track Sessions' },
  { id: 'logged', label: 'Logged Data' },
];

export default function DataPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading, isDataFetchReady } = useAuth();
  const { vehicles, isLoading: vehiclesLoading, refreshVehicles } = useOwnedVehicles();
  const { builds, getBuildsByCarSlug, isLoading: buildsLoading } = useSavedBuilds();
  const { data: carsData } = useCarsList();
  const allCars = useMemo(() => carsData?.cars || [], [carsData]);
  const authModal = useAuthModal();
  
  
  const [activeFilter, setActiveFilter] = useState('all');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const dropdownRef = useRef(null);
  
  // Get vehicle ID from URL params or localStorage for persistence
  const vehicleIdFromUrl = searchParams.get('vehicle');
  
  // Get user's vehicles with matched car data FIRST
  // Note: vehicles from provider are flat objects with year, make, model directly on them
  const userVehicles = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];
    
    return vehicles.map(vehicle => {
      // Find matched car in catalog for additional specs (hp, weight, etc.)
      const matchedCar = vehicle.matchedCarSlug 
        ? allCars.find(c => c.slug === vehicle.matchedCarSlug) 
        : null;
      
      return {
        ...vehicle,
        // Attach the matched car for specs like hp, weight, drivetrain
        matchedCar,
      };
    });
  }, [vehicles, allCars]);
  
  // Determine selected vehicle ID with proper fallback logic
  // Priority: URL param > localStorage > first vehicle
  const selectedVehicleId = useMemo(() => {
    // If we have no vehicles yet, return null
    if (userVehicles.length === 0) return null;
    
    // Check if URL param vehicle exists in our list
    if (vehicleIdFromUrl) {
      const vehicleExists = userVehicles.some(v => v.id === vehicleIdFromUrl);
      if (vehicleExists) {
        return vehicleIdFromUrl;
      }
    }
    
    // Check localStorage for last selected vehicle on this page
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('autorev_data_selected_vehicle');
      if (storedId) {
        const vehicleExists = userVehicles.some(v => v.id === storedId);
        if (vehicleExists) {
          return storedId;
        }
      }
    }
    
    // Default to first vehicle
    return userVehicles[0]?.id || null;
  }, [userVehicles, vehicleIdFromUrl]);
  
  // Handler for selecting a new vehicle - updates URL and localStorage
  const handleSelectVehicle = useCallback((vehicleId) => {
    if (!vehicleId) return;
    
    // Update URL without full navigation (shallow)
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('vehicle', vehicleId);
    router.replace(newUrl.pathname + newUrl.search, { scroll: false });
    
    // Also store in localStorage for cross-session persistence
    localStorage.setItem('autorev_data_selected_vehicle', vehicleId);
    
    // Close dropdown
    setShowVehicleDropdown(false);
  }, [router]);
  
  // Close dropdown when clicking/tapping outside
  // Uses both mousedown and touchstart for mobile compatibility
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowVehicleDropdown(false);
      }
    }
    
    if (showVehicleDropdown) {
      // Use timeout to prevent immediate close on the same click that opened it
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
      }, 10);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showVehicleDropdown]);
  
  // Get selected vehicle data - derived from selectedVehicleId
  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId) return null;
    return userVehicles.find(v => v.id === selectedVehicleId) || null;
  }, [userVehicles, selectedVehicleId]);
  
  // Update selectedCar when vehicle changes (for useTuningProfile)
  useEffect(() => {
    if (selectedVehicle?.matchedCar) {
      setSelectedCar(selectedVehicle.matchedCar);
    } else {
      setSelectedCar(null);
    }
  }, [selectedVehicle]);
  
  // Fetch tuning profile for the selected car (includes power_limits)
  const { profile: tuningProfile, loading: tuningProfileLoading } = useTuningProfile(selectedCar);
  
  // Get user's hero image for the selected vehicle's matched car
  const { heroImageUrl: userHeroImageUrl } = useCarImages(
    selectedVehicle?.matchedCarSlug, 
    { enabled: !!selectedVehicle?.matchedCarSlug }
  );
  
  // Get build data for selected vehicle from SavedBuildsProvider
  // Builds are stored by car_slug, so we match on matchedCarSlug
  const vehicleBuildData = useMemo(() => {
    if (!selectedVehicle) return null;
    
    const carSlug = selectedVehicle.matchedCarSlug;
    if (!carSlug) {
      // No matched car slug - return default data from catalog
      const matchedCar = selectedVehicle.matchedCar;
      return {
        specs: selectedVehicle.customSpecs || {},
        selectedUpgrades: { upgrades: [] },
        stockHp: matchedCar?.hp || 300,
        totalHpGain: 0,
        finalHp: matchedCar?.hp || 300,
        weight: matchedCar?.curb_weight || matchedCar?.weight || 3500,
        drivetrain: matchedCar?.drivetrain || 'RWD',
      };
    }
    
    // Find builds for this car by slug
    const carBuilds = getBuildsByCarSlug(carSlug);
    
    if (carBuilds && carBuilds.length > 0) {
      // Use the most recent build for this car
      const latestBuild = carBuilds[0]; // Already sorted by created_at desc
      const matchedCar = selectedVehicle.matchedCar;
      
      return {
        id: latestBuild.id,
        projectName: latestBuild.name,
        // Use 'upgrades' array from the transformed build
        selectedUpgrades: {
          upgrades: latestBuild.upgrades || [],
          wheelFitment: latestBuild.wheelFitment,
          factoryConfig: latestBuild.factoryConfig,
        },
        specs: {}, // Legacy format not used
        stockHp: matchedCar?.hp || 300,
        totalHpGain: latestBuild.totalHpGain || 0,
        finalHp: latestBuild.finalHp || (matchedCar?.hp || 300),
        weight: matchedCar?.curb_weight || matchedCar?.weight || 3500,
        drivetrain: matchedCar?.drivetrain || 'RWD',
      };
    }
    
    // No build found - return default data from catalog
    const matchedCar = selectedVehicle.matchedCar;
    return {
      specs: selectedVehicle.customSpecs || {},
      selectedUpgrades: { upgrades: [] },
      stockHp: matchedCar?.hp || 300,
      totalHpGain: 0,
      finalHp: matchedCar?.hp || 300,
      weight: matchedCar?.curb_weight || matchedCar?.weight || 3500,
      drivetrain: matchedCar?.drivetrain || 'RWD',
    };
  }, [selectedVehicle, getBuildsByCarSlug]);
  
  // Get HP values directly from build data (already calculated and stored)
  const stockHp = vehicleBuildData?.stockHp || selectedVehicle?.matchedCar?.hp || 300;
  const hpGain = vehicleBuildData?.totalHpGain || 0;
  const estimatedHp = vehicleBuildData?.finalHp || (stockHp + hpGain);
  
  // Get tire compound from build - stored in wheelFitment or suspension
  const tireCompound = useMemo(() => {
    const wheelFitment = vehicleBuildData?.selectedUpgrades?.wheelFitment;
    return wheelFitment?.tireCompound || vehicleBuildData?.specs?.suspension?.tireCompound || 'summer';
  }, [vehicleBuildData]);
  
  // Get list of installed upgrades from build
  const installedUpgrades = useMemo(() => {
    return vehicleBuildData?.selectedUpgrades?.upgrades || [];
  }, [vehicleBuildData]);
  
  // Proper loading state - wait for both auth AND data fetch to be ready
  // CRITICAL: isDataFetchReady ensures providers have started/completed their fetch
  // Without this, the page shows empty state before vehicles are loaded
  // NOTE: This useMemo MUST be before any conditional returns (React hooks rules)
  const isDataLoading = useMemo(() => {
    // Always show loading during auth check
    if (authLoading) return true;
    
    // Not authenticated = no loading (will show sign-in prompt)
    if (!isAuthenticated) return false;
    
    // Wait for prefetch to complete before showing any data
    // This prevents showing empty state while vehicles are being fetched
    if (!isDataFetchReady) return true;
    
    // Finally check if vehicles are still loading
    return vehiclesLoading;
  }, [authLoading, isAuthenticated, isDataFetchReady, vehiclesLoading]);
  
  // Not authenticated - show sign in prompt
  if (!authLoading && !isAuthenticated) {
    return (
      <div className={styles.container}>
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
      <div className={styles.container}>
        <LoadingSpinner 
          variant="branded" 
          text="Loading Your Data" 
          subtext="Fetching performance insights..."
          fullPage 
        />
      </div>
    );
  }
  
  // No vehicles - prompt to add one
  if (userVehicles.length === 0) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>My Data</h1>
          <p className={styles.subtitle}>Performance insights for your vehicles</p>
        </header>
        
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
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>My Data</h1>
        <p className={styles.subtitle}>Performance insights & tracking</p>
      </header>
      
      {/* Vehicle Selector */}
      <section className={styles.vehicleSelectorSection}>
        <div className={styles.vehicleSelectorWrapper} ref={dropdownRef}>
          <button 
            className={styles.vehicleSelectorBtn}
            onClick={() => setShowVehicleDropdown(prev => !prev)}
            aria-expanded={showVehicleDropdown}
            aria-haspopup="listbox"
          >
            <div className={styles.vehicleImage}>
              {(userHeroImageUrl || selectedVehicle?.matchedCar?.imageHeroUrl) ? (
                <Image
                  src={userHeroImageUrl || selectedVehicle.matchedCar.imageHeroUrl}
                  alt={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
                  fill
                  sizes="44px"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <CarIcon size={24} />
              )}
            </div>
            <div className={styles.vehicleSelectorInfo}>
              <span className={styles.vehicleSelectorLabel}>Viewing data for</span>
              <span className={styles.vehicleSelectorName}>
                {selectedVehicle 
                  ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`
                  : 'Select a vehicle'
                }
              </span>
              {selectedVehicle?.nickname && (
                <span className={styles.vehicleSelectorNickname}>{selectedVehicle.nickname}</span>
              )}
            </div>
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className={`${styles.chevron} ${showVehicleDropdown ? styles.chevronOpen : ''}`}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          
          {/* Vehicle selector modal - rendered via portal to escape stacking context */}
        </div>
      </section>
      
      {/* Filter Pills */}
      <div className={styles.filterBar}>
        {DATA_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`${styles.filterPill} ${activeFilter === cat.id ? styles.filterActive : ''}`}
            onClick={() => setActiveFilter(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>
      
      {/* Synthetic Data Section - Estimated Performance */}
      {(activeFilter === 'all' || activeFilter === 'synthetic') && selectedVehicle && (
        <section className={styles.syntheticDataSection}>
          <h2 className={styles.sectionTitle}>
            <GaugeIcon />
            Estimated Performance
          </h2>
          <p className={styles.sectionDescription}>
            Performance estimates based on your vehicle's build configuration
          </p>
          
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
                  stockHp={selectedVehicle.matchedCar?.hp || 300}
                  estimatedHp={estimatedHp}
                  stockTorque={selectedVehicle.matchedCar?.torque || (selectedVehicle.matchedCar?.hp || 300) * 0.85}
                  estimatedTq={estimatedHp * 0.9}
                  peakRpm={selectedVehicle.matchedCar?.peak_hp_rpm || 6500}
                />
              </div>
              
              {/* Calculated Performance - 0-60, 1/4 mile, etc. */}
              <div className={styles.dataCard}>
                <CalculatedPerformance
                  stockHp={selectedVehicle.matchedCar?.hp || 300}
                  estimatedHp={estimatedHp}
                  weight={selectedVehicle.matchedCar?.curb_weight || selectedVehicle.matchedCar?.weight || 3500}
                  drivetrain={selectedVehicle.matchedCar?.drivetrain || 'RWD'}
                  tireCompound={tireCompound}
                  weightMod={vehicleBuildData?.specs?.weight?.reduction || 0}
                />
              </div>
              
              {/* Lap Time Estimator */}
              <div className={styles.dataCard}>
                <LapTimeEstimator
                  stockHp={selectedVehicle.matchedCar?.hp || 300}
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
                  modsSummary={vehicleBuildData?.specs}
                />
              </div>
              
              {/* Power Breakdown - Where HP gains come from */}
              <div className={styles.dataCard}>
                <PowerBreakdown
                  stockHp={selectedVehicle.matchedCar?.hp || 300}
                  specs={vehicleBuildData?.specs || {}}
                  estimate={{ hp: estimatedHp }}
                />
              </div>
              
              {/* Component Limits */}
              {tuningProfile?.power_limits && (
                <div className={styles.dataCard}>
                  <PowerLimitsAdvisory
                    powerLimits={tuningProfile.power_limits}
                    currentHp={estimatedHp}
                  />
                </div>
              )}
              
              {/* Handling Balance */}
              <div className={styles.dataCard}>
                <HandlingBalanceIndicator
                  suspensionSetup={vehicleBuildData?.specs?.suspension}
                  aeroSetup={vehicleBuildData?.specs?.aero}
                  tireCompound={tireCompound}
                  drivetrain={selectedVehicle.matchedCar?.drivetrain || 'RWD'}
                />
              </div>
              
              {/* Aero at Speed */}
              <div className={styles.dataCard}>
                <AeroBalanceChart
                  aeroSetup={vehicleBuildData?.specs?.aero}
                  weight={selectedVehicle.matchedCar?.curb_weight || selectedVehicle.matchedCar?.weight || 3500}
                />
              </div>
              
              {/* Quick Build Link */}
              {(!vehicleBuildData?.specs || Object.keys(vehicleBuildData.specs).length === 0) && (
                <div className={styles.buildPrompt}>
                  <p>Configure your build to get more accurate estimates</p>
                  <Link href={`/garage?tab=build&vehicle=${selectedVehicle.id}`} className={styles.buildPromptBtn}>
                    Configure Build
                    <ChevronRightIcon />
                  </Link>
                </div>
              )}
            </>
          )}
        </section>
      )}
      
      {/* Logged Data Sources */}
      {(activeFilter === 'all' || activeFilter === 'track' || activeFilter === 'logged') && (
        <section className={styles.dataSources}>
          <h2 className={styles.sectionTitle}>
            <StopwatchIcon />
            Data Sources
          </h2>
          
          <div className={styles.sourceGrid}>
            {/* Track Sessions */}
            <Link href="/data/track" className={styles.sourceCard}>
              <div className={styles.sourceIcon}>
                <FlagIcon />
              </div>
              <div className={styles.sourceContent}>
                <h3>Track Sessions</h3>
                <p>Log lap times manually or via GPS</p>
              </div>
              <ChevronRightIcon />
            </Link>
            
            {/* OBD2 Connection */}
            <button className={styles.sourceCard} disabled>
              <div className={styles.sourceIcon}>
                <PlugIcon />
              </div>
              <div className={styles.sourceContent}>
                <h3>OBD2 Connect</h3>
                <p>Real-time engine & performance data</p>
              </div>
              <span className={styles.comingSoon}>Soon</span>
            </button>
            
            {/* Telemetry Upload */}
            <button className={styles.sourceCard} disabled>
              <div className={styles.sourceIcon}>
                <UploadIcon />
              </div>
              <div className={styles.sourceContent}>
                <h3>Upload Telemetry</h3>
                <p>Import from RaceCapture, AIM, etc.</p>
              </div>
              <span className={styles.comingSoon}>Soon</span>
            </button>
            
            {/* Analytics */}
            <button className={styles.sourceCard} disabled>
              <div className={styles.sourceIcon}>
                <TrendIcon />
              </div>
              <div className={styles.sourceContent}>
                <h3>Analytics</h3>
                <p>Compare runs & track progress</p>
              </div>
              <span className={styles.comingSoon}>Soon</span>
            </button>
          </div>
        </section>
      )}
      
      {/* Future Data Ideas Section */}
      <section className={styles.futureIdeas}>
        <h3 className={styles.futureIdeasTitle}>What data would help you most?</h3>
        <p className={styles.futureIdeasDescription}>
          We're building a comprehensive data platform. Some ideas we're exploring:
        </p>
        <div className={styles.futureIdeasGrid}>
          <div className={styles.futureIdea}>
            <span className={styles.futureIdeaIcon}>⏱️</span>
            <span>Acceleration runs (0-60, 1/4 mile)</span>
          </div>
          <div className={styles.futureIdea}>
            <span className={styles.futureIdeaIcon}>⛽</span>
            <span>Fuel economy tracking</span>
          </div>
          <div className={styles.futureIdea}>
            <span className={styles.futureIdeaIcon}>🔧</span>
            <span>Mod before/after comparisons</span>
          </div>
          <div className={styles.futureIdea}>
            <span className={styles.futureIdeaIcon}>📊</span>
            <span>Long-term reliability tracking</span>
          </div>
        </div>
        <Link href="/community" className={styles.feedbackLink}>
          Share your ideas in the community →
        </Link>
      </section>
      
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />
      
      {/* Vehicle Selection Modal */}
      {showVehicleDropdown && (
        <VehicleSelectModal 
          vehicles={userVehicles}
          selectedId={selectedVehicleId}
          onSelect={handleSelectVehicle}
          onClose={() => setShowVehicleDropdown(false)}
        />
      )}
    </div>
  );
}
