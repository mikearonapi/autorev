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

import { useState, useMemo, useEffect, useRef, useCallback, Suspense, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { usePointsNotification } from '@/components/providers/PointsNotificationProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { useCarsList } from '@/hooks/useCarData';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import VirtualDynoChart from '@/components/VirtualDynoChart';
import LapTimeEstimator from '@/components/LapTimeEstimator';
import CalculatedPerformance from '@/components/CalculatedPerformance';
import PowerBreakdown from '@/components/PowerBreakdown';
import DynoLogModal from '@/components/DynoLogModal';
import TrackTimeLogModal from '@/components/TrackTimeLogModal';
// NOTE: Analysis components (BuildProgressAnalysis, BuildValueAnalysis, PlatformInsights, 
// NextUpgradeRecommendation) moved to Insights page (Jan 2026)
import { useCarImages } from '@/hooks/useCarImages';
import { useUserTrackTimes, useAddTrackTime, useDynoResults } from '@/hooks/useUserData';
import LoadingSpinner from '@/components/LoadingSpinner';
import OnboardingPopup, { dataOnboardingSteps } from '@/components/OnboardingPopup';
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

const FlagIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
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

const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// Data filter categories - focused on what's available now
// NOTE: Analysis tab moved to Insights page (Jan 2026)
const DATA_CATEGORIES = [
  { id: 'power', label: 'Dyno' },           // Virtual Dyno, Calculated Performance, Power Breakdown
  { id: 'track', label: 'Track' },          // Lap Time Estimator, Track Sessions
];

function DataPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading, isDataFetchReady, profile } = useAuth();
  const { showPointsEarned } = usePointsNotification();
  const { vehicles, isLoading: vehiclesLoading, refreshVehicles } = useOwnedVehicles();
  
  // Get user's first name for personalized title
  const firstName = profile?.display_name?.split(' ')[0] || 
                    user?.user_metadata?.full_name?.split(' ')[0] ||
                    user?.email?.split('@')[0] || 
                    'My';
  const { builds, getBuildsByCarSlug, isLoading: buildsLoading } = useSavedBuilds();
  const { data: carsData } = useCarsList();
  // NOTE: useCarsList returns the cars array directly, not { cars: [...] }
  const allCars = useMemo(() => carsData || [], [carsData]);
  const authModal = useAuthModal();
  
  
  // Get URL params for action handling
  const filterFromUrl = searchParams.get('filter');
  const actionFromUrl = searchParams.get('action');
  
  const [activeFilter, setActiveFilter] = useState(filterFromUrl || 'power');
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  // NOTE: selectedCar state removed - tuning profile now fetched on Insights page
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  
  // Dyno logging state
  const [showDynoModal, setShowDynoModal] = useState(false);
  const [editingDynoResult, setEditingDynoResult] = useState(null);
  
  // Track time logging state
  const [showTrackTimeModal, setShowTrackTimeModal] = useState(false);
  const [editingTrackTime, setEditingTrackTime] = useState(null);
  
  // Track if we've processed the action param (to avoid re-opening modal on re-renders)
  const [actionProcessed, setActionProcessed] = useState(false);
  
  // Get vehicle ID from URL params or localStorage for persistence
  const vehicleIdFromUrl = searchParams.get('vehicle');
  
  // Get user's vehicles with matched car data FIRST
  // Note: vehicles from provider are flat objects with year, make, model directly on them
  // PRIORITY: Prefer matchedCarId (UUID) over matchedCarSlug for reliable lookups
  const userVehicles = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];
    
    return vehicles.map(vehicle => {
      // Find matched car in catalog for additional specs (hp, weight, etc.)
      // PRIORITY 1: Match by car ID (most reliable)
      // PRIORITY 2: Match by slug (fallback for legacy data)
      let matchedCar = null;
      if (vehicle.matchedCarId) {
        matchedCar = allCars.find(c => c.id === vehicle.matchedCarId);
      }
      if (!matchedCar && vehicle.matchedCarSlug) {
        matchedCar = allCars.find(c => c.slug === vehicle.matchedCarSlug);
      }
      
      return {
        ...vehicle,
        // Attach the matched car for specs like hp, weight, drivetrain
        matchedCar,
        // Flag if car resolution failed (for error states)
        matchedCarResolved: !!matchedCar,
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
  
  // Dyno results via React Query - MUST be after selectedVehicleId is defined
  const { 
    data: dynoResults = [], 
    isLoading: dynoResultsLoading,
    refetch: refetchDynoResults,
  } = useDynoResults(selectedVehicleId, { enabled: isAuthenticated && !!selectedVehicleId });
  
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
  
  // Mark as mounted for portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Position dropdown below button
  useLayoutEffect(() => {
    if (showVehicleDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({ 
        top: rect.bottom + 6, 
        left: rect.left, 
        width: rect.width 
      });
    }
  }, [showVehicleDropdown]);
  
  // Close dropdown when clicking/tapping outside
  useEffect(() => {
    if (!showVehicleDropdown) return;
    
    const handleClickOutside = (e) => {
      const dropdown = document.getElementById('data-vehicle-selector-dropdown');
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target) && 
        (!dropdown || !dropdown.contains(e.target))
      ) {
        setShowVehicleDropdown(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showVehicleDropdown]);
  
  // Close on escape key
  useEffect(() => {
    if (!showVehicleDropdown) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowVehicleDropdown(false);
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showVehicleDropdown]);
  
  // Get selected vehicle data - derived from selectedVehicleId
  // userVehicles already has matchedCar attached via the useMemo above
  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId) return null;
    // userVehicles already has matchedCar, matchedCarResolved attached
    return userVehicles.find(v => v.id === selectedVehicleId) || null;
  }, [userVehicles, selectedVehicleId]);
  
  // Handle action=log param to auto-open track time modal
  // This runs when the page loads with ?action=log&filter=track
  useEffect(() => {
    if (actionFromUrl === 'log' && !actionProcessed && selectedVehicle && isAuthenticated) {
      // Set filter to track if specified
      if (filterFromUrl === 'track') {
        setActiveFilter('track');
      }
      
      // Slight delay to ensure everything is mounted
      const timer = setTimeout(() => {
        setShowTrackTimeModal(true);
        setActionProcessed(true);
        
        // Clear the action param from URL to prevent re-opening on navigation
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('action');
        router.replace(newUrl.pathname + newUrl.search, { scroll: false });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [actionFromUrl, filterFromUrl, actionProcessed, selectedVehicle, isAuthenticated, router]);
  
  // Get user's hero image for the selected vehicle's matched car
  const { heroImageUrl: userHeroImageUrl } = useCarImages(
    selectedVehicle?.matchedCarSlug, 
    { enabled: !!selectedVehicle?.matchedCarSlug }
  );
  
  // Get build data for selected vehicle
  // PRIORITY ORDER:
  // 1. Vehicle's installedModifications (what's actually on the car via OwnedVehiclesProvider)
  // 2. Active build linked to vehicle (activeBuildId)
  // 3. Most recent build for this car slug
  // 4. Default stock values
  const vehicleBuildData = useMemo(() => {
    if (!selectedVehicle) return null;
    
    const matchedCar = selectedVehicle.matchedCar;
    const carSlug = selectedVehicle.matchedCarSlug;
    const carId = selectedVehicle.matchedCarId;
    
    // WARNING: If we have a slug/id but no resolved car, data will be incorrect
    // This indicates a database or catalog mismatch
    const hasCarReference = !!(carSlug || carId);
    const matchedCarNotFound = hasCarReference && !matchedCar;
    
    if (matchedCarNotFound) {
      console.warn(`[Data Page] Vehicle ${selectedVehicle.id} has car reference (slug: ${carSlug}, id: ${carId}) but matchedCar not found in catalog. Using fallback values.`);
    }
    
    // Use actual values when available, with explicit fallbacks for missing data
    // NOTE: Fallbacks are only used when matchedCar is missing - this is a data issue
    const stockHp = matchedCar?.hp || (matchedCarNotFound ? null : 300);
    const weight = matchedCar?.curb_weight || matchedCar?.weight || (matchedCarNotFound ? null : 3500);
    const drivetrain = matchedCar?.drivetrain || (matchedCarNotFound ? null : 'RWD');
    
    // 1. PRIORITY: Check if vehicle has direct installed modifications
    // This is the source of truth for "what's actually on this car"
    const vehicleMods = selectedVehicle.installedModifications || [];
    const vehicleHpGain = selectedVehicle.totalHpGain || 0;
    const vehicleActiveBuildId = selectedVehicle.activeBuildId;
    
    if (vehicleMods.length > 0 || vehicleHpGain > 0) {
      // Vehicle has direct modifications - use these as primary source
      // If there's an active build, get additional data from it
      let buildData = null;
      if (vehicleActiveBuildId) {
        buildData = builds.find(b => b.id === vehicleActiveBuildId);
      }
      
      return {
        id: vehicleActiveBuildId,
        projectName: buildData?.name || 'My Build',
        // Use vehicle's installed mods as the primary source
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
        // Mark that this data comes from the vehicle directly
        sourceType: 'vehicle',
        // Flag when car baseline data is missing (for error states)
        matchedCarNotFound,
      };
    }
    
    // 2. No direct mods on vehicle - try to find a build for this car
    if (carSlug) {
      const carBuilds = getBuildsByCarSlug(carSlug);
      
      if (carBuilds && carBuilds.length > 0) {
        // Use the most recent build for this car
        const latestBuild = carBuilds[0]; // Already sorted by created_at desc
        
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
    
    // 3. No modifications or builds found - return stock values
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
  
  // Get HP values - calculate dynamically using performanceCalculator as SOURCE OF TRUTH
  // NOTE: When matchedCarNotFound is true, stockHp may be null - use 0 to avoid NaN
  // The UI should display an error state in this case
  const stockHp = vehicleBuildData?.stockHp ?? selectedVehicle?.matchedCar?.hp ?? 300;
  
  // Flag for UI to show warning when car baseline data couldn't be resolved
  const hasDataIssue = vehicleBuildData?.matchedCarNotFound === true;
  
  // Get tire compound from build - stored in wheelFitment or suspension
  const tireCompound = useMemo(() => {
    const wheelFitment = vehicleBuildData?.selectedUpgrades?.wheelFitment;
    return wheelFitment?.tireCompound || vehicleBuildData?.specs?.suspension?.tireCompound || 'summer';
  }, [vehicleBuildData]);
  
  // Get list of installed upgrades from build
  const installedUpgrades = useMemo(() => {
    return vehicleBuildData?.selectedUpgrades?.upgrades || [];
  }, [vehicleBuildData]);
  
  // Calculate ALL gains using performanceCalculator as the SINGLE SOURCE OF TRUTH
  // SOURCE OF TRUTH: lib/performanceCalculator/hpCalculator.js::calculateAllModificationGains
  // NOTE: Must be after installedUpgrades is defined
  const stockTorque = selectedVehicle?.matchedCar?.torque || Math.round(stockHp * 0.85);
  const modificationGains = useMemo(() => {
    const modKeys = installedUpgrades.map(u => typeof u === 'string' ? u : u?.key).filter(Boolean);
    return calculateAllModificationGains(modKeys, selectedVehicle?.matchedCar);
  }, [installedUpgrades, selectedVehicle?.matchedCar]);
  
  // HP gain - use dynamically calculated value from performanceCalculator (not stored value)
  // This ensures consistency: both HP and torque come from the same source of truth
  const hpGain = modificationGains.hpGain || 0;
  const estimatedHp = stockHp + hpGain;
  
  // Torque gain
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
  
  // DIAGNOSTIC: Log data flow for debugging (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && selectedVehicle) {
      console.group('[MyData] Data Flow Diagnostics');
      console.log('Selected Vehicle:', {
        id: selectedVehicle.id,
        year: selectedVehicle.year,
        make: selectedVehicle.make,
        model: selectedVehicle.model,
        matchedCarSlug: selectedVehicle.matchedCarSlug,
        // CRITICAL: Check if matchedCar was found from catalog
        matchedCarFound: !!selectedVehicle.matchedCar,
        matchedCarHp: selectedVehicle.matchedCar?.hp || 'NOT FOUND - using fallback',
        matchedCarTorque: selectedVehicle.matchedCar?.torque || 'NOT FOUND',
        installedModifications: selectedVehicle.installedModifications,
        totalHpGain: selectedVehicle.totalHpGain,
        activeBuildId: selectedVehicle.activeBuildId,
      });
      console.log('Cars Catalog Status:', {
        carsLoaded: allCars.length,
        carLookupAttempted: !!selectedVehicle.matchedCarSlug,
      });
      console.log('Vehicle Build Data:', {
        sourceType: vehicleBuildData?.sourceType,
        id: vehicleBuildData?.id,
        projectName: vehicleBuildData?.projectName,
        stockHp: vehicleBuildData?.stockHp,
        totalHpGain: vehicleBuildData?.totalHpGain,
        finalHp: vehicleBuildData?.finalHp,
        upgradeCount: vehicleBuildData?.selectedUpgrades?.upgrades?.length || 0,
        upgrades: vehicleBuildData?.selectedUpgrades?.upgrades?.map(u => typeof u === 'string' ? u : u?.key),
      });
      console.log('Derived Values:', {
        stockHp,
        hpGain,
        estimatedHp,
        installedUpgradesCount: installedUpgrades.length,
        installedUpgradeKeys: installedUpgrades.map(u => typeof u === 'string' ? u : u?.key),
        upgradeCategories,
      });
      console.groupEnd();
    }
  }, [selectedVehicle, vehicleBuildData, stockHp, hpGain, estimatedHp, installedUpgrades, upgradeCategories, allCars]);
  
  // Note: Dyno results are now fetched via useDynoResults hook above
  
  // Save dyno result handler
  const handleSaveDynoResult = useCallback(async (dynoData) => {
    if (!selectedVehicleId) return;
    
    try {
      const payload = {
        userVehicleId: selectedVehicleId,
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
      
      // Refresh dyno results
      await refetchDynoResults();
      
      // Show points notification for new dyno logs (not edits)
      if (!editingDynoResult) {
        showPointsEarned(50, 'Dyno logged');
      }
      
      setShowDynoModal(false);
      setEditingDynoResult(null);
    } catch (err) {
      console.error('[DataPage] Error saving dyno result:', err);
      throw err; // Re-throw so modal can show error
    }
  }, [selectedVehicleId, editingDynoResult, refetchDynoResults, showPointsEarned]);
  
  // Get the latest dyno result for comparison
  const latestDynoResult = useMemo(() => {
    return dynoResults.length > 0 ? dynoResults[0] : null;
  }, [dynoResults]);
  
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
      
      // Show points notification for new track times
      showPointsEarned(50, 'Track time logged');
      
      setShowTrackTimeModal(false);
      setEditingTrackTime(null);
    } catch (err) {
      console.error('[DataPage] Error saving track time:', err);
      throw err; // Re-throw so modal can show error
    }
  }, [user?.id, selectedVehicle, estimatedHp, vehicleBuildData, addTrackTime, showPointsEarned]);
  
  // Calculate predicted WHP (with ~15% drivetrain loss)
  const predictedWhp = useMemo(() => {
    return Math.round(estimatedHp * 0.85);
  }, [estimatedHp]);
  
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
          <h1 className={styles.title}>{firstName}&apos;s Data</h1>
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
      {/* Header with Tab Bar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>{firstName}&apos;s Data</h1>
        </div>
        <div className={styles.tabBar}>
          {DATA_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`${styles.tab} ${activeFilter === cat.id ? styles.tabActive : ''}`}
              onClick={() => setActiveFilter(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </header>
      
      {/* Vehicle Selector - Full width bar matching garage pages */}
      <section className={styles.vehicleSelector} ref={dropdownRef}>
        <button 
          ref={buttonRef}
          type="button"
          className={styles.selectorButton}
          onClick={() => setShowVehicleDropdown(prev => !prev)}
          aria-expanded={showVehicleDropdown}
          aria-haspopup="listbox"
        >
          <div className={styles.selectorLeft}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.selectorIcon}>
              <path d="M2 20v-8l10-6 10 6v8"/>
              <path d="M4 20v-4a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4"/>
              <path d="M4 20h16"/>
            </svg>
            <span className={styles.selectorValue}>
              {selectedVehicle 
                ? (selectedVehicle.nickname || `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`)
                : 'Select Vehicle'
              }
            </span>
          </div>
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${styles.selectorChevron} ${showVehicleDropdown ? styles.selectorChevronOpen : ''}`}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        
        {/* Inline Dropdown Portal - matches garage page style */}
        {showVehicleDropdown && mounted && createPortal(
          <div 
            id="data-vehicle-selector-dropdown"
            className={styles.selectorDropdownPortal} 
            role="listbox"
            style={{
              position: 'fixed',
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
          >
            {userVehicles.map(vehicle => (
              <button
                type="button"
                role="option"
                aria-selected={selectedVehicleId === vehicle.id}
                key={vehicle.id}
                className={`${styles.selectorOption} ${selectedVehicleId === vehicle.id ? styles.selectorOptionActive : ''}`}
                onClick={() => handleSelectVehicle(vehicle.id)}
              >
                {selectedVehicleId === vehicle.id ? (
                  <CheckIcon size={16} />
                ) : (
                  <CarIcon size={16} />
                )}
                <span className={styles.selectorOptionText}>
                  {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                </span>
              </button>
            ))}
          </div>,
          document.body
        )}
      </section>
      
      
      {/* How Estimates Work - Single explanation for the whole page */}
      {selectedVehicle && !buildsLoading && (
        <div className={styles.estimateExplainer}>
          <span className={styles.estimateExplainerIcon}>ⓘ</span>
          <span className={styles.estimateExplainerText}>
            All figures are <strong>estimates</strong> for <em>relative comparison</em>—actual results vary with tune quality and conditions.
          </span>
        </div>
      )}
      
      {/* POWER TAB - Virtual Dyno, Calculated Performance, Power Breakdown */}
      {activeFilter === 'power' && selectedVehicle && (
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
              
              {/* Calculated Performance - All metrics + experience scores */}
              <CalculatedPerformance
                stockHp={stockHp}
                estimatedHp={estimatedHp}
                weight={selectedVehicle.matchedCar?.curbWeight || selectedVehicle.matchedCar?.weight || 3500}
                drivetrain={selectedVehicle.matchedCar?.drivetrain || 'RWD'}
                tireCompound={tireCompound}
                weightMod={vehicleBuildData?.specs?.weight?.reduction || 0}
                // Pass ACTUAL stock metrics from database
                stockZeroToSixty={selectedVehicle.matchedCar?.zeroToSixty}
                stockQuarterMile={selectedVehicle.matchedCar?.quarterMile}
                stockBraking={selectedVehicle.matchedCar?.braking60To0}
                stockLateralG={selectedVehicle.matchedCar?.lateralG}
                stockTrapSpeed={null} // Not in cars table
                hasExhaust={upgradeCategories.hasExhaust}
                hasIntake={upgradeCategories.hasIntake}
                hasTune={upgradeCategories.hasTune}
                hasSuspension={upgradeCategories.hasSuspension}
                carName={`${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`}
                carSlug={selectedVehicle.matchedCarSlug}
              />
              
              {/* Power Breakdown - Where HP gains come from */}
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
              
              {/* ============================================
                  LOG YOUR DYNO DATA SECTION
                  Users can submit their actual dyno results
                  ============================================ */}
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
                
                {/* Show logged dyno results if any */}
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
      
      {/* TRACK TAB - Lap Time Estimator + Track Time Logging */}
      {activeFilter === 'track' && selectedVehicle && (
        <section className={styles.syntheticDataSection}>
          {buildsLoading ? (
            <div className={styles.loadingCard}>
              <div className={styles.spinner} />
              <span>Loading build data...</span>
            </div>
          ) : (
            <>
              {/* Lap Time Estimator - Predictions only */}
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
              
              {/* ============================================
                  LOG YOUR TRACK TIMES SECTION
                  Users can submit their actual lap times
                  ============================================ */}
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
                
                {/* Show logged track times if any */}
                {trackTimesLoading ? (
                  <div className={styles.logDataLoading}>
                    <div className={styles.spinner} />
                    <span>Loading lap times...</span>
                  </div>
                ) : trackTimes.length > 0 ? (
                  <div className={styles.trackTimesList}>
                    {trackTimes.slice(0, 3).map((time) => (
                      <div key={time.id} className={styles.trackTimeItem}>
                        <div className={styles.trackTimeMain}>
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
                      </div>
                    ))}
                    {trackTimes.length > 3 && (
                      <div className={styles.trackTimesMore}>
                        +{trackTimes.length - 3} more lap times
                      </div>
                    )}
                  </div>
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

// Wrap in Suspense for useSearchParams (required for Next.js 14 static generation)
export default function DataPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <LoadingSpinner 
          variant="branded" 
          text="Loading Your Data" 
          subtext="Fetching performance insights..."
          fullPage 
        />
      </div>
    }>
      <DataPageContent />
    </Suspense>
  );
}
