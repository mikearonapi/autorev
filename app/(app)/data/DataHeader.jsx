'use client';

/**
 * DataHeader - Shared header for Data pages
 * 
 * Contains:
 * - Page title with user's first name
 * - Vehicle selector dropdown
 * - Tab bar navigation (DataNav)
 * 
 * CRITICAL: Vehicle selection state is persisted via URL params (?vehicle=123)
 * to maintain selection across route changes (Dyno ↔ Track).
 */

import { useState, useMemo, useEffect, useRef, useLayoutEffect, useCallback, Suspense } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import { useCarsList } from '@/hooks/useCarData';
import DataNav from './DataNav';
import styles from './DataHeader.module.css';

// Icons
const CarIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-5.5c-.4-.7-1.1-1.5-2.3-1.5H11c-1.2 0-1.9.8-2.3 1.5L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
);

const CheckIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

function DataHeaderContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, profile } = useAuth();
  const { vehicles, isLoading: vehiclesLoading } = useOwnedVehicles();
  const { data: carsData } = useCarsList();
  const allCars = useMemo(() => carsData || [], [carsData]);
  
  // Get user's first name for personalized title
  const firstName = profile?.display_name?.split(' ')[0] || 
                    user?.user_metadata?.full_name?.split(' ')[0] ||
                    user?.email?.split('@')[0] || 
                    'My';
  
  // Dropdown state
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  
  // Mark as mounted for portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);
  
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
  
  // Get vehicle ID from URL params or localStorage
  const vehicleIdFromUrl = searchParams.get('vehicle');
  
  // Determine selected vehicle ID with fallback logic
  const selectedVehicleId = useMemo(() => {
    if (userVehicles.length === 0) return null;
    
    // Check if URL param vehicle exists
    if (vehicleIdFromUrl) {
      const vehicleExists = userVehicles.some(v => v.id === vehicleIdFromUrl);
      if (vehicleExists) return vehicleIdFromUrl;
    }
    
    // Check localStorage
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('autorev_data_selected_vehicle');
      if (storedId) {
        const vehicleExists = userVehicles.some(v => v.id === storedId);
        if (vehicleExists) return storedId;
      }
    }
    
    // Default to first vehicle
    return userVehicles[0]?.id || null;
  }, [userVehicles, vehicleIdFromUrl]);
  
  // Get selected vehicle data
  const selectedVehicle = useMemo(() => {
    if (!selectedVehicleId) return null;
    return userVehicles.find(v => v.id === selectedVehicleId) || null;
  }, [userVehicles, selectedVehicleId]);
  
  // Sync URL with selected vehicle (if not already in URL)
  useEffect(() => {
    if (selectedVehicleId && !vehicleIdFromUrl && isAuthenticated && userVehicles.length > 0) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('vehicle', selectedVehicleId);
      router.replace(newUrl.pathname + newUrl.search, { scroll: false });
    }
  }, [selectedVehicleId, vehicleIdFromUrl, isAuthenticated, userVehicles.length, router]);
  
  // Handler for selecting a vehicle - updates URL and localStorage
  const handleSelectVehicle = useCallback((vehicleId) => {
    if (!vehicleId) return;
    
    // Update URL with current pathname (preserve current tab)
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('vehicle', vehicleId);
    router.replace(newUrl.pathname + newUrl.search, { scroll: false });
    
    // Store in localStorage
    localStorage.setItem('autorev_data_selected_vehicle', vehicleId);
    
    setShowVehicleDropdown(false);
  }, [router]);
  
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
  
  // Close dropdown when clicking outside
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
  
  // Don't render header content if not authenticated or loading
  if (!isAuthenticated) {
    return (
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <h1 className={styles.title}>Data Hub</h1>
          <DataNav />
        </div>
      </header>
    );
  }
  
  // No vehicles - show simplified header (title + subtitle, no tab bar)
  // This matches the original page behavior
  if (isAuthenticated && !vehiclesLoading && userVehicles.length === 0) {
    return (
      <header className={styles.header}>
        <div className={styles.headerSimple}>
          <h1 className={styles.title}>{firstName}&apos;s Data</h1>
          <p className={styles.subtitle}>Performance insights for your vehicles</p>
        </div>
      </header>
    );
  }
  
  return (
    <header className={styles.header}>
      {/* Title Row with Tab Bar */}
      <div className={styles.headerRow}>
        <h1 className={styles.title}>{firstName}&apos;s Data</h1>
        <DataNav />
      </div>
      
      {/* Vehicle Selector */}
      {userVehicles.length > 0 && (
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
          
          {/* Dropdown Portal */}
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
              
              {/* Add Vehicle Link */}
              <Link href="/garage" className={styles.selectorAddLink}>
                <PlusIcon />
                <span>Add Vehicle</span>
              </Link>
            </div>,
            document.body
          )}
        </section>
      )}
    </header>
  );
}

// Wrap in Suspense for useSearchParams
export default function DataHeader() {
  return (
    <Suspense fallback={
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.titleSkeleton} />
          <div className={styles.navSkeleton} />
        </div>
      </header>
    }>
      <DataHeaderContent />
    </Suspense>
  );
}
