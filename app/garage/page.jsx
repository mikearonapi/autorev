'use client';

/**
 * My Garage Page - Gran Turismo / Forza Inspired
 * 
 * Immersive vehicle showcase with:
 * - Hero display for the selected vehicle
 * - Spec overlay with key stats
 * - Bottom carousel for vehicle navigation
 * - Tab system: My Collection, Favorites, Builds
 */

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './page.module.css';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import AddVehicleModal from '@/components/AddVehicleModal';
import AddFavoritesModal from '@/components/AddFavoritesModal';
import CarImage from '@/components/CarImage';
import BuildDetailView from '@/components/BuildDetailView';
import BuildsWorkshop from '@/components/BuildsWorkshop';
import ServiceLogModal from '@/components/ServiceLogModal';
import { carData } from '@/data/cars.js';
import { fetchAllMaintenanceData, fetchUserServiceLogs, addServiceLog } from '@/lib/maintenanceService';
import { decodeVIN } from '@/lib/vinDecoder';
import { fetchAllSafetyData, getSafetySummary } from '@/lib/nhtsaSafetyService';

// Icons
const Icons = {
  car: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  chevronDown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  chevronUp: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
  x: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  heart: ({ size = 20, filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  wrench: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  arrowRight: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  arrowLeft: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  trash: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  plus: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  gauge: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  tool: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h4l13-13a2.83 2.83 0 0 0-4-4L3 17v4z"/>
      <path d="M14.5 5.5L18.5 9.5"/>
    </svg>
  ),
  settings: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  chevronLeft: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  chevronRight: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  info: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  search: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  alert: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  loader: ({ size = 16, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  ),
  shield: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  clipboard: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  book: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  calendar: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

// Brand Logo Component - displays brand name with consistent gold color
function BrandLogo({ brand }) {
  // Use consistent gold/yellow color for all brands in garage view
  const brandColor = 'var(--sn-gold, #c4a564)';

  return (
    <div className={styles.brandLogo}>
      <span className={styles.brandName} style={{ color: brandColor }}>
        {brand?.toUpperCase()}
      </span>
    </div>
  );
}

// Hero Vehicle Display Component
// Progressive disclosure: Collapsed → Expanded (key info) → Full Details/Owner Dashboard
function HeroVehicleDisplay({ item, type, onAction, onAddToMyCars, isInMyCars, onUpdateVehicle }) {
  // Panel states: 'collapsed', 'expanded', 'details'
  const [panelState, setPanelState] = useState('collapsed');
  const [showPerformance, setShowPerformance] = useState(false);
  
  // For owned vehicles: toggle between views in details mode
  // 'specs' = Details, 'reference' = Reference, 'safety' = Safety, 'service' = Service Log
  const [detailsView, setDetailsView] = useState('specs');
  
  // VIN input state
  const [vinInput, setVinInput] = useState('');
  const [vinLookupLoading, setVinLookupLoading] = useState(false);
  const [vinData, setVinData] = useState(null);
  const [vinError, setVinError] = useState(null);
  
  // Maintenance data for owned vehicles
  const [maintenanceData, setMaintenanceData] = useState({ specs: null, issues: [], intervals: [] });
  const [loadingMaintenance, setLoadingMaintenance] = useState(false);
  
  // Safety data (recalls, complaints, ratings)
  const [safetyData, setSafetyData] = useState({ recalls: [], complaints: [], investigations: [], safetyRatings: null });
  const [loadingSafety, setLoadingSafety] = useState(false);
  
  // Service logs
  const [serviceLogs, setServiceLogs] = useState([]);
  const [loadingServiceLogs, setLoadingServiceLogs] = useState(false);
  const [showServiceLogModal, setShowServiceLogModal] = useState(false);
  
  // Initialize VIN from vehicle data
  useEffect(() => {
    if (type === 'mycars' && item?.vehicle?.vin) {
      setVinInput(item.vehicle.vin);
    }
  }, [type, item?.vehicle?.vin]);
  
  // Fetch maintenance data for owned vehicles (when in expanded or details state)
  useEffect(() => {
    const loadMaintenanceData = async () => {
      if (type !== 'mycars') return;
      if (panelState !== 'expanded' && panelState !== 'details') return;
      
      const carSlug = item?.matchedCar?.slug || item?.vehicle?.matchedCarSlug;
      if (!carSlug) return;
      
      setLoadingMaintenance(true);
      try {
        const data = await fetchAllMaintenanceData(carSlug);
        setMaintenanceData(data);
      } catch (err) {
        console.error('[HeroVehicleDisplay] Error loading maintenance:', err);
      } finally {
        setLoadingMaintenance(false);
      }
    };
    
    loadMaintenanceData();
  }, [type, panelState, item?.matchedCar?.slug, item?.vehicle?.matchedCarSlug]);
  
  // Fetch safety data when vehicle info is available
  useEffect(() => {
    const loadSafetyData = async () => {
      if (type !== 'mycars') return;
      if (panelState !== 'details' || detailsView !== 'safety') return;
      
      const vehicle = item?.vehicle;
      if (!vehicle) return;
      
      setLoadingSafety(true);
      try {
        const data = await fetchAllSafetyData({
          vin: vehicle.vin,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
        });
        setSafetyData(data);
      } catch (err) {
        console.error('[HeroVehicleDisplay] Error loading safety data:', err);
      } finally {
        setLoadingSafety(false);
      }
    };
    
    loadSafetyData();
  }, [type, panelState, detailsView, item?.vehicle]);
  
  // VIN Lookup handler - uses real NHTSA API
  const handleVinLookup = async () => {
    if (!vinInput || vinInput.length !== 17) return;
    
    setVinLookupLoading(true);
    setVinError(null);
    
    try {
      const decoded = await decodeVIN(vinInput);
      
      if (!decoded.success) {
        setVinError(decoded.error || 'Failed to decode VIN');
        setVinData(null);
        return;
      }
      
      setVinData({
        vin: decoded.vin,
        decoded: true,
        manufacturer: decoded.manufacturerName,
        modelYear: decoded.year,
        make: decoded.make,
        model: decoded.model,
        trim: decoded.trim,
        engine: decoded.engineDisplacement ? `${decoded.engineDisplacement}L ${decoded.engineCylinders ? `V${decoded.engineCylinders}` : ''}` : null,
        transmission: decoded.transmission,
        drivetrain: decoded.driveType,
        bodyStyle: decoded.bodyClass,
        fuelType: decoded.fuelType,
        plantCountry: decoded.plantCountry,
        engineHP: decoded.engineHP,
        vehicleType: decoded.vehicleType,
        raw: decoded.raw,
      });
      
      // Also fetch safety data with the decoded VIN
      if (decoded.year && decoded.make && decoded.model) {
        const safety = await fetchAllSafetyData({
          vin: decoded.vin,
          year: decoded.year,
          make: decoded.make,
          model: decoded.model,
        });
        setSafetyData(safety);
      }
    } catch (err) {
      console.error('[VIN Lookup] Error:', err);
      setVinError('Failed to decode VIN. Please try again.');
    } finally {
      setVinLookupLoading(false);
    }
  };
  
  if (!item) return null;

  // Determine what data we're showing based on type
  const car = type === 'builds' ? item.car : (item.matchedCar || item);
  const isOwnedVehicle = type === 'mycars';
  const isBuild = type === 'builds';
  const isFavorite = type === 'favorites';

  // Get display name
  const displayName = isOwnedVehicle 
    ? (item.vehicle?.nickname || `${item.vehicle?.year} ${item.vehicle?.make} ${item.vehicle?.model}`)
    : isBuild 
      ? (item.name || `${car?.name} Build`)
      : car?.name;

  // Extract brand from car data or name
  const getBrand = () => {
    // Use brand from car object if available (from database)
    if (car?.brand) return car.brand;
    
    // Check owned vehicle make
    if (isOwnedVehicle && item.vehicle?.make) {
      return item.vehicle.make;
    }
    
    // Fallback to name parsing
    const name = displayName || '';
    const brandMap = {
      '718': 'Porsche', '911': 'Porsche', '981': 'Porsche', '991': 'Porsche', 
      '992': 'Porsche', '997': 'Porsche', '987': 'Porsche', 'Cayman': 'Porsche',
      'BMW': 'BMW', 'M2': 'BMW', 'M3': 'BMW', 'M4': 'BMW',
      'Audi': 'Audi', 'RS': 'Audi', 'S3': 'Audi', 'S4': 'Audi',
      'Toyota': 'Toyota', 'Supra': 'Toyota', 'GR86': 'Toyota',
      'Nissan': 'Nissan', 'GT-R': 'Nissan', '370Z': 'Nissan', 'Z': 'Nissan',
      'Subaru': 'Subaru', 'WRX': 'Subaru', 'BRZ': 'Subaru', 'STI': 'Subaru',
      'Mazda': 'Mazda', 'MX-5': 'Mazda', 'Miata': 'Mazda', 'RX-7': 'Mazda',
      'Honda': 'Honda', 'Civic': 'Honda', 'S2000': 'Honda', 'NSX': 'Honda',
      'Chevrolet': 'Chevrolet', 'Corvette': 'Chevrolet', 'Camaro': 'Chevrolet',
      'Ford': 'Ford', 'Mustang': 'Ford', 'Focus': 'Ford', 'GT': 'Ford',
      'Dodge': 'Dodge', 'Challenger': 'Dodge', 'Charger': 'Dodge', 'Viper': 'Dodge',
      'Mercedes': 'Mercedes', 'AMG': 'Mercedes',
    };
    
    for (const [key, brand] of Object.entries(brandMap)) {
      if (name.includes(key)) return brand;
    }
    return name.split(' ')[0];
  };

  const brand = getBrand();

  // Get sub-info text (year only, category in details)
  const getSubInfo = () => {
    if (isOwnedVehicle) {
      return item.vehicle?.year || '';
    }
    if (car?.years) return car.years;
    return '';
  };

  // Toggle panel state
  const togglePanel = () => {
    if (panelState === 'collapsed') {
      setPanelState('expanded');
    } else if (panelState === 'expanded') {
      setPanelState('collapsed');
    } else {
      setPanelState('expanded');
    }
  };

  return (
    <div className={styles.heroDisplay}>
      {/* Hero Image - Uses exclusive garage images (premium studio photography) */}
      <div className={styles.heroImageWrapper}>
        {car ? (
          <CarImage car={car} variant="garage" className={styles.heroImage} lazy={false} />
        ) : (
          <div className={styles.heroPlaceholder}>
            <Icons.car size={120} />
          </div>
        )}
        
        {/* Gradient overlay for readability */}
        <div className={styles.heroGradient} />
      </div>

      {/* Spec Panel - Left Side with consistent transparency */}
      <div className={`${styles.specPanel} ${styles[`specPanel_${panelState}`]}`}>
        {/* Header - Always visible */}
        <div className={styles.specPanelHeader}>
          <div className={styles.specPanelHeaderInfo}>
            <BrandLogo brand={brand} />
            <h2 className={styles.heroVehicleName}>{displayName}</h2>
            <p className={styles.heroSubInfo}>{getSubInfo()}</p>
          </div>
          <div className={styles.headerActions}>
            {/* View toggle for owned vehicles in details mode - 4 tabs */}
            {panelState === 'details' && isOwnedVehicle && (
              <div className={styles.headerViewToggle}>
                <button 
                  className={`${styles.headerToggleBtn} ${detailsView === 'specs' ? styles.headerToggleActive : ''}`}
                  onClick={() => setDetailsView('specs')}
                  title="Vehicle Details"
                >
                  <Icons.info size={12} />
                  <span>Details</span>
                </button>
                <button 
                  className={`${styles.headerToggleBtn} ${detailsView === 'reference' ? styles.headerToggleActive : ''}`}
                  onClick={() => setDetailsView('reference')}
                  title="Owner's Reference"
                >
                  <Icons.book size={12} />
                  <span>Reference</span>
                </button>
                <button 
                  className={`${styles.headerToggleBtn} ${detailsView === 'safety' ? styles.headerToggleActive : ''}`}
                  onClick={() => setDetailsView('safety')}
                  title="Safety & Recalls"
                >
                  <Icons.shield size={12} />
                  <span>Safety</span>
                </button>
                <button 
                  className={`${styles.headerToggleBtn} ${detailsView === 'service' ? styles.headerToggleActive : ''}`}
                  onClick={() => setDetailsView('service')}
                  title="Service Log"
                >
                  <Icons.clipboard size={12} />
                  <span>Service</span>
                </button>
              </div>
            )}
            {/* Quick action buttons */}
            {panelState === 'details' && car && (
              <>
                <button 
                  onClick={() => setShowPerformance(true)} 
                  className={styles.headerActionBtn}
                  title="Plan Modifications"
                >
                  <Icons.gauge size={14} />
                </button>
                {isFavorite && !isInMyCars && onAddToMyCars && (
                  <button 
                    onClick={() => onAddToMyCars(car)} 
                    className={styles.headerActionBtnOwn}
                    title="I Own This Car"
                  >
                    <Icons.car size={14} />
                  </button>
                )}
              </>
            )}
            <button 
              className={styles.collapseToggle}
              onClick={() => {
                if (panelState === 'details') setPanelState('expanded');
                else if (panelState === 'expanded') setPanelState('collapsed');
                else setPanelState('expanded');
              }}
              title={panelState === 'collapsed' ? 'Expand' : panelState === 'expanded' ? 'Collapse' : 'Back to summary'}
            >
              {panelState === 'collapsed' && <Icons.chevronDown size={16} />}
              {panelState === 'expanded' && <Icons.chevronUp size={16} />}
              {panelState === 'details' && <Icons.chevronLeft size={16} />}
            </button>
          </div>
        </div>

        {/* Expanded Content - Key Specs + Actions */}
        {panelState === 'expanded' && (
          <div className={styles.specPanelBody}>
            {/* Key Stats Grid */}
            <div className={styles.specGrid}>
              {car?.hp && (
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Power</span>
                  <span className={styles.specValue}>{car.hp} HP</span>
                </div>
              )}
              {car?.zeroToSixty && (
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>0-60</span>
                  <span className={styles.specValue}>{car.zeroToSixty}s</span>
                </div>
              )}
              {car?.torque && (
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Torque</span>
                  <span className={styles.specValue}>{car.torque} lb-ft</span>
                </div>
              )}
              {car?.drivetrain && (
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Layout</span>
                  <span className={styles.specValue}>{car.drivetrain}</span>
                </div>
              )}
              {isOwnedVehicle && item.vehicle?.mileage && (
                <div className={styles.specItem}>
                  <span className={styles.specLabel}>Miles</span>
                  <span className={styles.specValue}>{item.vehicle.mileage.toLocaleString()}</span>
                </div>
              )}
              {isBuild && (
                <>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>Mods</span>
                    <span className={styles.specValue}>{item.upgrades?.length || 0}</span>
                  </div>
                  <div className={styles.specItem}>
                    <span className={styles.specLabel}>+HP</span>
                    <span className={styles.specValue}>+{item.totalHpGain || 0}</span>
                  </div>
                </>
              )}
            </div>

            {/* Compact Action Buttons */}
            <div className={styles.heroActionsCompact}>
              {car && (
                <button onClick={() => setPanelState('details')} className={styles.miniAction}>
                  <Icons.info size={12} />
                  <span>Details</span>
                </button>
              )}
              {car && (
                <button onClick={() => setShowPerformance(true)} className={styles.miniActionPrimary}>
                  <Icons.wrench size={12} />
                  <span>Mods</span>
                </button>
              )}
              {isFavorite && !isInMyCars && onAddToMyCars && (
                <button onClick={() => onAddToMyCars(car)} className={styles.miniActionOwn}>
                  <Icons.car size={12} />
                  <span>Own</span>
                </button>
              )}
              {isBuild && (
                <button onClick={() => onAction(item)} className={styles.miniActionPrimary}>
                  <Icons.tool size={12} />
                  <span>Plan</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Full Details - Consistent view for all, with Owner's Reference toggle for My Collection */}
        {panelState === 'details' && car && (
          <div className={styles.specPanelBody}>
            {/* Vehicle Details View - Same for both My Collection and Favorites */}
            {(!isOwnedVehicle || detailsView === 'specs') && (
              <>
                {/* Summary/Tagline at top */}
                {car.tagline && (
                  <p className={styles.detailsSummary}>{car.tagline}</p>
                )}

                {/* Main Specs Grid - wider blocks */}
                <div className={styles.fullDetailsInPanel}>
                  {/* Performance */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>Performance</h4>
                    <div className={styles.detailBlockItems}>
                      {car.hp && <div className={styles.detailBlockItem}><span>Horsepower</span><span>{car.hp} HP</span></div>}
                      {car.torque && <div className={styles.detailBlockItem}><span>Torque</span><span>{car.torque} lb-ft</span></div>}
                      {car.zeroToSixty && <div className={styles.detailBlockItem}><span>0-60 mph</span><span>{car.zeroToSixty}s</span></div>}
                      {car.quarterMile && <div className={styles.detailBlockItem}><span>1/4 Mile</span><span>{car.quarterMile}s</span></div>}
                      {car.braking60To0 && <div className={styles.detailBlockItem}><span>60-0 Braking</span><span>{car.braking60To0} ft</span></div>}
                      {car.lateralG && <div className={styles.detailBlockItem}><span>Lateral G</span><span>{car.lateralG}g</span></div>}
                      {car.topSpeed && <div className={styles.detailBlockItem}><span>Top Speed</span><span>{car.topSpeed} mph</span></div>}
                    </div>
                  </div>

                  {/* Engine & Drivetrain */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>Engine & Drivetrain</h4>
                    <div className={styles.detailBlockItems}>
                      {car.engine && <div className={styles.detailBlockItem}><span>Engine</span><span>{car.engine}</span></div>}
                      {car.trans && <div className={styles.detailBlockItem}><span>Transmission</span><span>{car.trans}</span></div>}
                      {car.drivetrain && <div className={styles.detailBlockItem}><span>Drivetrain</span><span>{car.drivetrain}</span></div>}
                      {car.category && <div className={styles.detailBlockItem}><span>Layout</span><span>{car.category}</span></div>}
                      {car.manualAvailable !== undefined && <div className={styles.detailBlockItem}><span>Manual</span><span>{car.manualAvailable ? 'Yes' : 'No'}</span></div>}
                    </div>
                  </div>

                  {/* Chassis & Body */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>Chassis & Body</h4>
                    <div className={styles.detailBlockItems}>
                      {car.curbWeight && <div className={styles.detailBlockItem}><span>Curb Weight</span><span>{car.curbWeight.toLocaleString()} lbs</span></div>}
                      {car.seats && <div className={styles.detailBlockItem}><span>Seats</span><span>{car.seats}</span></div>}
                      {car.country && <div className={styles.detailBlockItem}><span>Origin</span><span>{car.country}</span></div>}
                    </div>
                  </div>

                  {/* AutoRev Ratings */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>AutoRev Ratings</h4>
                    <div className={styles.detailBlockItems}>
                      {car.driverFun && <div className={styles.detailBlockItem}><span>Driver Fun</span><span className={styles.ratingValue}>{car.driverFun}/10</span></div>}
                      {car.track && <div className={styles.detailBlockItem}><span>Track</span><span className={styles.ratingValue}>{car.track}/10</span></div>}
                      {car.sound && <div className={styles.detailBlockItem}><span>Sound</span><span className={styles.ratingValue}>{car.sound}/10</span></div>}
                      {car.reliability && <div className={styles.detailBlockItem}><span>Reliability</span><span className={styles.ratingValue}>{car.reliability}/10</span></div>}
                      {car.interior && <div className={styles.detailBlockItem}><span>Interior</span><span className={styles.ratingValue}>{car.interior}/10</span></div>}
                      {car.value && <div className={styles.detailBlockItem}><span>Value</span><span className={styles.ratingValue}>{car.value}/10</span></div>}
                      {car.aftermarket && <div className={styles.detailBlockItem}><span>Aftermarket</span><span className={styles.ratingValue}>{car.aftermarket}/10</span></div>}
                    </div>
                  </div>

                  {/* Ownership */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>Ownership</h4>
                    <div className={styles.detailBlockItems}>
                      {car.priceRange && <div className={styles.detailBlockItem}><span>Price Range</span><span>{car.priceRange}</span></div>}
                      {car.years && <div className={styles.detailBlockItem}><span>Model Years</span><span>{car.years}</span></div>}
                      {car.dailyUsabilityTag && <div className={styles.detailBlockItem}><span>Daily Use</span><span>{car.dailyUsabilityTag}</span></div>}
                      {car.fuelEconomyCombined && <div className={styles.detailBlockItem}><span>MPG Combined</span><span>{car.fuelEconomyCombined}</span></div>}
                      {car.maintenanceCostIndex && <div className={styles.detailBlockItem}><span>Maintenance</span><span>{car.maintenanceCostIndex <= 3 ? 'Low' : car.maintenanceCostIndex <= 6 ? 'Medium' : 'High'}</span></div>}
                      {car.insuranceCostIndex && <div className={styles.detailBlockItem}><span>Insurance</span><span>{car.insuranceCostIndex <= 3 ? 'Low' : car.insuranceCostIndex <= 6 ? 'Medium' : 'High'}</span></div>}
                    </div>
                  </div>

                  {/* Ownership Extras - if available */}
                  {(car.partsAvailability || car.dealerVsIndependent || car.diyFriendliness || car.trackReadiness || car.communityStrength) && (
                    <div className={styles.detailBlock}>
                      <h4 className={styles.detailBlockTitle}>Ownership Extras</h4>
                      <div className={styles.detailBlockItems}>
                        {car.partsAvailability && <div className={styles.detailBlockItem}><span>Parts</span><span style={{textTransform: 'capitalize'}}>{car.partsAvailability}</span></div>}
                        {car.dealerVsIndependent && <div className={styles.detailBlockItem}><span>Service</span><span style={{textTransform: 'capitalize'}}>{car.dealerVsIndependent.replace(/-/g, ' ')}</span></div>}
                        {car.diyFriendliness && <div className={styles.detailBlockItem}><span>DIY Friendly</span><span className={styles.ratingValue}>{car.diyFriendliness}/10</span></div>}
                        {car.trackReadiness && <div className={styles.detailBlockItem}><span>Track Ready</span><span style={{textTransform: 'capitalize'}}>{car.trackReadiness.replace(/-/g, ' ')}</span></div>}
                        {car.communityStrength && <div className={styles.detailBlockItem}><span>Community</span><span className={styles.ratingValue}>{car.communityStrength}/10</span></div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Pros & Cons Row - Below main specs */}
                {(car.pros?.length > 0 || car.cons?.length > 0) && (
                  <div className={styles.prosConsRow}>
                    {/* Pros */}
                    {car.pros && car.pros.length > 0 && (
                      <div className={styles.prosConsBlock}>
                        <h4 className={styles.detailBlockTitle}>Pros</h4>
                        <ul className={styles.proConList}>
                          {car.pros.slice(0, 4).map((pro, i) => (
                            <li key={i} className={styles.proItem}>✓ {pro}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Cons */}
                    {car.cons && car.cons.length > 0 && (
                      <div className={styles.prosConsBlock}>
                        <h4 className={styles.detailBlockTitle}>Cons</h4>
                        <ul className={styles.proConList}>
                          {car.cons.slice(0, 4).map((con, i) => (
                            <li key={i} className={styles.conItem}>✗ {con}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Owner's Reference View - Only for My Collection */}
            {isOwnedVehicle && detailsView === 'reference' && (
              <>
                {/* VIN Lookup - Compact inline */}
                <div className={styles.vinLookupCompact}>
                  <input
                    type="text"
                    value={vinInput}
                    onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                    placeholder="Enter VIN to decode vehicle info"
                    className={styles.vinInputCompact}
                    maxLength={17}
                  />
                  <button 
                    onClick={handleVinLookup}
                    disabled={vinInput.length !== 17 || vinLookupLoading}
                    className={styles.vinLookupBtnCompact}
                  >
                    {vinLookupLoading ? 'Loading...' : 'Decode VIN'}
                  </button>
                </div>

                {/* Main Reference Grid - Same layout as Details */}
                <div className={styles.fullDetailsInPanel}>
                  {/* Engine Oil */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>Engine Oil</h4>
                    <div className={styles.detailBlockItems}>
                      <div className={styles.detailBlockItem}><span>Type</span><span>{maintenanceData.specs?.oil_type || 'Full Synthetic'}</span></div>
                      <div className={styles.detailBlockItem}><span>Viscosity</span><span>{maintenanceData.specs?.oil_viscosity || '5W-30 or 5W-50'}</span></div>
                      <div className={styles.detailBlockItem}><span>Capacity</span><span>{maintenanceData.specs?.oil_capacity_quarts ? `${maintenanceData.specs.oil_capacity_quarts} qt` : '~8-10 qt'}</span></div>
                      <div className={styles.detailBlockItem}><span>Change Interval</span><span>{maintenanceData.specs?.oil_change_interval_miles ? `${maintenanceData.specs.oil_change_interval_miles.toLocaleString()} mi` : '5,000-7,500 mi'}</span></div>
                    </div>
                  </div>

                  {/* Fuel */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>Fuel</h4>
                    <div className={styles.detailBlockItems}>
                      <div className={styles.detailBlockItem}><span>Fuel Type</span><span>{maintenanceData.specs?.fuel_type || 'Premium Unleaded'}</span></div>
                      <div className={styles.detailBlockItem}><span>Min Octane</span><span>{maintenanceData.specs?.fuel_octane_minimum || '91'}</span></div>
                      <div className={styles.detailBlockItem}><span>Recommended</span><span>{maintenanceData.specs?.fuel_octane_recommended ? `${maintenanceData.specs.fuel_octane_recommended} octane` : '93 octane'}</span></div>
                      <div className={styles.detailBlockItem}><span>Tank Capacity</span><span>{maintenanceData.specs?.fuel_tank_capacity_gallons ? `${maintenanceData.specs.fuel_tank_capacity_gallons} gal` : '~16 gal'}</span></div>
                    </div>
                  </div>

                  {/* Tires */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>Tires & Wheels</h4>
                    <div className={styles.detailBlockItems}>
                      <div className={styles.detailBlockItem}><span>Front Tire</span><span>{maintenanceData.specs?.tire_size_front || '295/35R19'}</span></div>
                      <div className={styles.detailBlockItem}><span>Rear Tire</span><span>{maintenanceData.specs?.tire_size_rear || '305/35R19'}</span></div>
                      <div className={styles.detailBlockItem}><span>Front PSI</span><span>{maintenanceData.specs?.tire_pressure_front_psi ? `${maintenanceData.specs.tire_pressure_front_psi} PSI` : '35-38 PSI'}</span></div>
                      <div className={styles.detailBlockItem}><span>Rear PSI</span><span>{maintenanceData.specs?.tire_pressure_rear_psi ? `${maintenanceData.specs.tire_pressure_rear_psi} PSI` : '38-40 PSI'}</span></div>
                      <div className={styles.detailBlockItem}><span>Lug Torque</span><span>{maintenanceData.specs?.wheel_lug_torque_ft_lbs ? `${maintenanceData.specs.wheel_lug_torque_ft_lbs} ft-lbs` : '150 ft-lbs'}</span></div>
                    </div>
                  </div>

                  {/* Fluids */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>Fluids</h4>
                    <div className={styles.detailBlockItems}>
                      <div className={styles.detailBlockItem}><span>Coolant</span><span>{maintenanceData.specs?.coolant_type || 'OEM Coolant'}</span></div>
                      <div className={styles.detailBlockItem}><span>Brake Fluid</span><span>{maintenanceData.specs?.brake_fluid_type || 'DOT 4'}</span></div>
                      <div className={styles.detailBlockItem}><span>Trans Fluid</span><span>{maintenanceData.specs?.trans_fluid_auto || maintenanceData.specs?.trans_fluid_manual || 'Check manual'}</span></div>
                      <div className={styles.detailBlockItem}><span>Diff Fluid</span><span>{maintenanceData.specs?.diff_fluid_type || 'Check manual'}</span></div>
                    </div>
                  </div>

                  {/* Brakes */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>Brakes</h4>
                    <div className={styles.detailBlockItems}>
                      <div className={styles.detailBlockItem}><span>Front Caliper</span><span>{maintenanceData.specs?.brake_front_caliper_type || 'Brembo 6-piston'}</span></div>
                      <div className={styles.detailBlockItem}><span>Rear Caliper</span><span>{maintenanceData.specs?.brake_rear_caliper_type || 'Brembo 4-piston'}</span></div>
                      <div className={styles.detailBlockItem}><span>Pad Compound</span><span>Performance</span></div>
                    </div>
                  </div>

                  {/* Battery */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>Battery</h4>
                    <div className={styles.detailBlockItems}>
                      <div className={styles.detailBlockItem}><span>Group Size</span><span>{maintenanceData.specs?.battery_group_size || 'H6/48'}</span></div>
                      <div className={styles.detailBlockItem}><span>CCA</span><span>{maintenanceData.specs?.battery_cca || '750+'}</span></div>
                      <div className={styles.detailBlockItem}><span>Type</span><span>{maintenanceData.specs?.battery_agm ? 'AGM' : 'AGM Recommended'}</span></div>
                    </div>
                  </div>

                  {/* Wipers & Lights */}
                  <div className={styles.detailBlock}>
                    <h4 className={styles.detailBlockTitle}>Wipers & Lights</h4>
                    <div className={styles.detailBlockItems}>
                      <div className={styles.detailBlockItem}><span>Driver Wiper</span><span>{maintenanceData.specs?.wiper_driver_size_inches ? `${maintenanceData.specs.wiper_driver_size_inches}"` : '22"'}</span></div>
                      <div className={styles.detailBlockItem}><span>Passenger Wiper</span><span>{maintenanceData.specs?.wiper_passenger_size_inches ? `${maintenanceData.specs.wiper_passenger_size_inches}"` : '20"'}</span></div>
                      <div className={styles.detailBlockItem}><span>Low Beam</span><span>{maintenanceData.specs?.headlight_low_beam_type || 'LED'}</span></div>
                      <div className={styles.detailBlockItem}><span>High Beam</span><span>{maintenanceData.specs?.headlight_high_beam_type || 'LED'}</span></div>
                    </div>
                  </div>

                  {/* VIN Decoded Info - if available */}
                  {vinData && (
                    <div className={styles.detailBlock}>
                      <h4 className={styles.detailBlockTitle}>VIN Details</h4>
                      <div className={styles.detailBlockItems}>
                        <div className={styles.detailBlockItem}><span>VIN</span><span className={styles.vinValueSmall}>{vinData.vin}</span></div>
                        <div className={styles.detailBlockItem}><span>Plant</span><span>{vinData.plantCity}, {vinData.plantCountry}</span></div>
                        <div className={styles.detailBlockItem}><span>Body Style</span><span>{vinData.bodyStyle}</span></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recalls Section - if VIN decoded and has recalls */}
                {vinData?.recalls && vinData.recalls.length > 0 && (
                  <div className={styles.prosConsRow}>
                    <div className={styles.prosConsBlock} style={{ flex: 1 }}>
                      <h4 className={styles.detailBlockTitle}>Recalls & Campaigns</h4>
                      <ul className={styles.proConList}>
                        {vinData.recalls.map((recall, i) => (
                          <li key={i} className={styles.conItem}>
                            <span style={{ color: recall.status === 'Completed' ? '#10b981' : '#ef4444' }}>
                              {recall.status === 'Completed' ? '✓' : '!'} 
                            </span>
                            {' '}{recall.description} ({recall.status})
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Data source note */}
                <p className={styles.referenceNote}>
                  Values shown are estimates. Verify with your owner's manual or VIN decode.
                </p>
              </>
            )}

            {/* Safety View - Recalls, TSBs, Complaints, Safety Ratings */}
            {isOwnedVehicle && detailsView === 'safety' && (
              <>
                {loadingSafety ? (
                  <div className={styles.loadingState}>
                    <Icons.loader size={24} className={styles.spinnerIcon} />
                    <span>Loading safety data...</span>
                  </div>
                ) : (
                  <>
                    {/* Safety Summary */}
                    <div className={styles.safetySummary}>
                      <div className={styles.safetyStatCard}>
                        <span className={styles.safetyStatValue} style={{ color: safetyData.recalls.length > 0 ? '#ef4444' : '#10b981' }}>
                          {safetyData.recalls.length}
                        </span>
                        <span className={styles.safetyStatLabel}>Recalls</span>
                      </div>
                      <div className={styles.safetyStatCard}>
                        <span className={styles.safetyStatValue}>{safetyData.complaints.length}</span>
                        <span className={styles.safetyStatLabel}>Complaints</span>
                      </div>
                      {safetyData.safetyRatings?.overallRating && (
                        <div className={styles.safetyStatCard}>
                          <span className={styles.safetyStatValue}>{safetyData.safetyRatings.overallRating}★</span>
                          <span className={styles.safetyStatLabel}>NHTSA Rating</span>
                        </div>
                      )}
                    </div>

                    {/* Recalls Section */}
                    <div className={styles.safetySection}>
                      <h4 className={styles.detailBlockTitle}>
                        <Icons.alert size={14} />
                        Recalls ({safetyData.recalls.length})
                      </h4>
                      {safetyData.recalls.length === 0 ? (
                        <p className={styles.noDataText}>No open recalls found for this vehicle.</p>
                      ) : (
                        <div className={styles.recallList}>
                          {safetyData.recalls.map((recall, i) => (
                            <div key={i} className={styles.recallItem}>
                              <div className={styles.recallHeader}>
                                <span className={styles.recallCampaign}>{recall.campaignNumber}</span>
                                <span className={styles.recallDate}>{recall.reportReceivedDate}</span>
                              </div>
                              <p className={styles.recallComponent}>{recall.component}</p>
                              <p className={styles.recallSummary}>{recall.summary}</p>
                              {recall.remedy && (
                                <p className={styles.recallRemedy}>
                                  <strong>Remedy:</strong> {recall.remedy}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Complaints Section - Top Issues */}
                    {safetyData.complaints.length > 0 && (
                      <div className={styles.safetySection}>
                        <h4 className={styles.detailBlockTitle}>
                          <Icons.info size={14} />
                          Common Complaints ({safetyData.complaints.length} total)
                        </h4>
                        <div className={styles.complaintsList}>
                          {safetyData.complaints.slice(0, 5).map((complaint, i) => (
                            <div key={i} className={styles.complaintItem}>
                              <div className={styles.complaintHeader}>
                                <span className={styles.complaintComponent}>{complaint.component}</span>
                                {(complaint.crash || complaint.fire) && (
                                  <span className={styles.complaintWarning}>
                                    {complaint.crash && '⚠️ Crash'} {complaint.fire && '🔥 Fire'}
                                  </span>
                                )}
                              </div>
                              <p className={styles.complaintSummary}>{complaint.summary}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Safety Ratings */}
                    {safetyData.safetyRatings?.hasRatings && (
                      <div className={styles.safetySection}>
                        <h4 className={styles.detailBlockTitle}>
                          <Icons.shield size={14} />
                          NHTSA Safety Ratings
                        </h4>
                        <div className={styles.ratingsGrid}>
                          <div className={styles.ratingItem}>
                            <span className={styles.ratingLabel}>Overall</span>
                            <span className={styles.ratingStars}>{safetyData.safetyRatings.overallRating}★</span>
                          </div>
                          {safetyData.safetyRatings.overallFrontCrashRating && (
                            <div className={styles.ratingItem}>
                              <span className={styles.ratingLabel}>Front Crash</span>
                              <span className={styles.ratingStars}>{safetyData.safetyRatings.overallFrontCrashRating}★</span>
                            </div>
                          )}
                          {safetyData.safetyRatings.overallSideCrashRating && (
                            <div className={styles.ratingItem}>
                              <span className={styles.ratingLabel}>Side Crash</span>
                              <span className={styles.ratingStars}>{safetyData.safetyRatings.overallSideCrashRating}★</span>
                            </div>
                          )}
                          {safetyData.safetyRatings.rolloverRating && (
                            <div className={styles.ratingItem}>
                              <span className={styles.ratingLabel}>Rollover</span>
                              <span className={styles.ratingStars}>{safetyData.safetyRatings.rolloverRating}★</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <p className={styles.referenceNote}>
                      Safety data from NHTSA. Check nhtsa.gov for complete details.
                    </p>
                  </>
                )}
              </>
            )}

            {/* Service Log View */}
            {isOwnedVehicle && detailsView === 'service' && (
              <>
                {/* Add Service Button */}
                <div className={styles.serviceLogHeader}>
                  <h4 className={styles.detailBlockTitle}>
                    <Icons.clipboard size={14} />
                    Service History
                  </h4>
                  <button 
                    onClick={() => setShowServiceLogModal(true)}
                    className={styles.addServiceBtn}
                  >
                    <Icons.plus size={14} />
                    Log Service
                  </button>
                </div>

                {serviceLogs.length === 0 ? (
                  <div className={styles.emptyServiceLog}>
                    <Icons.clipboard size={48} />
                    <p>No service records yet</p>
                    <p className={styles.emptyServiceHint}>
                      Track oil changes, tire rotations, and other maintenance to stay on top of your vehicle's health.
                    </p>
                    <button 
                      onClick={() => setShowServiceLogModal(true)}
                      className={styles.firstServiceBtn}
                    >
                      <Icons.plus size={16} />
                      Add First Service Record
                    </button>
                  </div>
                ) : (
                  <div className={styles.serviceLogList}>
                    {serviceLogs.map((log, i) => (
                      <div key={log.id || i} className={styles.serviceLogItem}>
                        <div className={styles.serviceLogDate}>
                          <span className={styles.serviceLogMonth}>
                            {new Date(log.service_date).toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className={styles.serviceLogDay}>
                            {new Date(log.service_date).getDate()}
                          </span>
                        </div>
                        <div className={styles.serviceLogContent}>
                          <span className={styles.serviceLogType}>{log.service_type}</span>
                          {log.odometer_reading && (
                            <span className={styles.serviceLogMiles}>{log.odometer_reading.toLocaleString()} mi</span>
                          )}
                          {log.total_cost && (
                            <span className={styles.serviceLogCost}>${log.total_cost}</span>
                          )}
                          {log.notes && (
                            <p className={styles.serviceLogNotes}>{log.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className={styles.referenceNote}>
                  Keep your service records up to date for accurate maintenance reminders.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Badges */}
      {isOwnedVehicle && item.vehicle?.isPrimary && (
        <span className={styles.heroBadge}>Primary Vehicle</span>
      )}
      {isFavorite && isInMyCars && (
        <span className={styles.heroBadgeOwned}>
          <Icons.car size={12} />
          Owned
        </span>
      )}

      {/* Performance Hub Overlay */}
      {showPerformance && car && (
        <PerformanceOverlay car={car} onClose={() => setShowPerformance(false)} />
      )}

      {/* Service Log Modal */}
      {showServiceLogModal && isOwnedVehicle && (
        <ServiceLogModal
          isOpen={showServiceLogModal}
          onClose={() => setShowServiceLogModal(false)}
          vehicleInfo={{
            year: item.vehicle?.year,
            make: item.vehicle?.make,
            model: item.vehicle?.model,
            currentMileage: item.vehicle?.mileage,
          }}
          onSave={async (logData) => {
            // For now, just add to local state
            // In production, this would call addServiceLog with proper user/vehicle IDs
            const newLog = {
              id: Date.now().toString(),
              service_date: logData.serviceDate,
              service_type: logData.serviceType,
              service_category: logData.serviceCategory,
              odometer_reading: logData.mileage,
              total_cost: logData.totalCost,
              notes: logData.notes,
              performed_by: logData.performedBy,
            };
            setServiceLogs(prev => [newLog, ...prev]);
          }}
        />
      )}
    </div>
  );
}

// Performance Overlay Component - Shows Performance Hub preview within garage
function PerformanceOverlay({ car, onClose }) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.overlayContentWide} onClick={e => e.stopPropagation()}>
        <button className={styles.overlayClose} onClick={onClose}>
          <Icons.x size={24} />
        </button>
        
        <div className={styles.overlayHeader}>
          <h2 className={styles.overlayTitle}>Performance Upgrades</h2>
          <p className={styles.overlaySubtitle}>{car.name}</p>
        </div>

        <div className={styles.performanceCategories}>
          <div className={styles.perfCategory}>
            <Icons.gauge size={28} />
            <span>Power</span>
            <small>ECU, Intake, Exhaust, Turbo</small>
          </div>
          <div className={styles.perfCategory}>
            <Icons.tool size={28} />
            <span>Handling</span>
            <small>Suspension, Brakes, Wheels</small>
          </div>
          <div className={styles.perfCategory}>
            <Icons.settings size={28} />
            <span>Drivetrain</span>
            <small>Clutch, Diff, Transmission</small>
          </div>
        </div>

        <div className={styles.overlayFooter}>
          <Link href={`/performance?car=${car.slug}`} className={styles.overlayLinkPrimary}>
            <Icons.wrench size={16} />
            Open Full Performance Hub
          </Link>
        </div>
      </div>
    </div>
  );
}

// Thumbnail Strip Component
function ThumbnailStrip({ items, selectedIndex, onSelect, type, onRemove }) {
  const stripRef = useRef(null);

  const scrollToSelected = (index) => {
    if (stripRef.current) {
      const thumbnail = stripRef.current.children[index];
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  };

  const handlePrev = () => {
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
    onSelect(newIndex);
    scrollToSelected(newIndex);
  };

  const handleNext = () => {
    const newIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
    onSelect(newIndex);
    scrollToSelected(newIndex);
  };

  if (items.length === 0) return null;

  return (
    <div className={styles.thumbnailContainer}>
      {items.length > 1 && (
        <button onClick={handlePrev} className={styles.navArrow} aria-label="Previous">
          <Icons.chevronLeft size={24} />
        </button>
      )}

      <div className={styles.thumbnailStrip} ref={stripRef}>
        {items.map((item, index) => {
          const car = type === 'builds' ? item.car : (item.matchedCar || item);
          const isSelected = index === selectedIndex;
          
          // Get display name for tooltip
          const displayName = type === 'mycars' 
            ? (item.vehicle?.nickname || `${item.vehicle?.make} ${item.vehicle?.model}`)
            : type === 'builds'
              ? (item.name || car?.name)
              : car?.name;

          return (
            <button
              key={item.id || item.slug || index}
              onClick={() => onSelect(index)}
              className={`${styles.thumbnail} ${isSelected ? styles.thumbnailSelected : ''}`}
              title={displayName}
            >
              {car ? (
                <CarImage car={car} variant="garage" className={styles.thumbnailImage} />
              ) : (
                <div className={styles.thumbnailPlaceholder}>
                  <Icons.car size={24} />
                </div>
              )}
              {isSelected && <div className={styles.thumbnailIndicator} />}
            </button>
          );
        })}
      </div>

      {items.length > 1 && (
        <button onClick={handleNext} className={styles.navArrow} aria-label="Next">
          <Icons.chevronRight size={24} />
        </button>
      )}

      {/* Remove button - positioned at end of thumbnail strip */}
      {onRemove && (
        <button onClick={onRemove} className={styles.thumbnailRemoveButton} title="Remove from list">
          <Icons.trash size={18} />
        </button>
      )}
    </div>
  );
}

// Empty State Component
function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Icon size={64} />
      </div>
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyDescription}>{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className={styles.emptyAction}>
          {actionLabel}
          <Icons.arrowRight size={16} />
        </button>
      )}
    </div>
  );
}

// Main Garage Component Content
function GarageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('favorites');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddFavoritesOpen, setIsAddFavoritesOpen] = useState(false);
  const [addingFavoriteCar, setAddingFavoriteCar] = useState(null);
  const [selectedBuild, setSelectedBuild] = useState(null);
  const { isAuthenticated } = useAuth();
  const authModal = useAuthModal();
  const { favorites, addFavorite, removeFavorite } = useFavorites();
  const { builds, deleteBuild, getBuildById } = useSavedBuilds();
  const { vehicles, addVehicle, removeVehicle } = useOwnedVehicles();
  
  // Handle URL params for direct build access
  useEffect(() => {
    const buildId = searchParams.get('build');
    if (buildId && builds.length > 0) {
      const build = getBuildById(buildId);
      if (build) {
        setSelectedBuild(build);
        setActiveTab('builds');
      }
    }
  }, [searchParams, builds, getBuildById]);

  // Reset selection when tab changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [activeTab]);
  
  // Merge favorites with full car data
  const favoriteCars = favorites.map(fav => {
    const fullCarData = carData.find(c => c.slug === fav.slug);
    return fullCarData ? { ...fullCarData, addedAt: fav.addedAt } : fav;
  });
  
  // Get cars for builds
  const buildsWithCars = builds.map(build => ({
    ...build,
    car: carData.find(c => c.slug === build.carSlug)
  })).filter(b => b.car);

  // Get matched car data for owned vehicles
  const vehiclesWithCars = vehicles.map(vehicle => ({
    vehicle,
    matchedCar: vehicle.matchedCarSlug ? carData.find(c => c.slug === vehicle.matchedCarSlug) : null,
    id: vehicle.id,
  }));

  // Check if a car is already in My Collection
  const isInMyCars = (slug) => vehicles.some(v => v.matchedCarSlug === slug);

  // Get current items based on tab
  const getCurrentItems = () => {
    switch (activeTab) {
      case 'mycars':
        return vehiclesWithCars;
      case 'favorites':
        return favoriteCars;
      case 'builds':
        return buildsWithCars;
      default:
        return [];
    }
  };

  const currentItems = getCurrentItems();
  const currentItem = currentItems[selectedIndex];

  // Handle adding a favorite car to My Collection
  const handleAddFavoriteToMyCars = async (car) => {
    // Auth check removed for testing - will be re-enabled for production
    // if (!isAuthenticated) {
    //   authModal.openSignIn();
    //   return;
    // }

    if (isInMyCars(car.slug)) return;

    setAddingFavoriteCar(car.slug);

    try {
      const yearMatch = car.years?.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();

      let make = '';
      let model = car.name;

      if (car.name.startsWith('718') || car.name.startsWith('911') || car.name.startsWith('981') || 
          car.name.startsWith('997') || car.name.startsWith('987') || car.name.startsWith('991') || 
          car.name.startsWith('992')) {
        make = 'Porsche';
      } else {
        const parts = car.name.split(' ');
        make = parts[0];
        model = parts.slice(1).join(' ');
      }

      await addVehicle({
        year,
        make,
        model,
        matchedCarSlug: car.slug,
      });
    } catch (err) {
      console.error('[GaragePage] Error adding vehicle:', err);
    } finally {
      setAddingFavoriteCar(null);
    }
  };

  // Handle remove with confirmation
  const handleRemove = () => {
    if (!currentItem) return;
    
    // Get confirmation message based on tab
    let confirmMessage = '';
    switch (activeTab) {
      case 'mycars':
        confirmMessage = 'Remove this vehicle from My Collection?';
        break;
      case 'favorites':
        confirmMessage = 'Remove this car from your favorites?';
        break;
      case 'builds':
        confirmMessage = 'Delete this saved build?';
        break;
    }

    // Show confirmation dialog
    if (!window.confirm(confirmMessage)) return;
    
    switch (activeTab) {
      case 'mycars':
        removeVehicle(currentItem.vehicle.id);
        break;
      case 'favorites':
        removeFavorite(currentItem.slug);
        break;
      case 'builds':
        deleteBuild(currentItem.id);
        break;
    }

    // Adjust selection if needed
    if (selectedIndex >= currentItems.length - 1 && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  // Handle build selection
  const handleBuildAction = (build) => {
    setSelectedBuild(build);
    window.history.pushState({}, '', `/garage?build=${build.id}`);
  };
  
  const tabs = [
    { id: 'mycars', label: 'My Collection', icon: Icons.car, count: vehicles.length },
    { id: 'favorites', label: 'Favorites', icon: Icons.heart, count: favoriteCars.length },
    { id: 'builds', label: 'Builds', icon: Icons.wrench, count: buildsWithCars.length },
  ];

  const handleAddVehicle = async (vehicleData) => {
    const { error } = await addVehicle(vehicleData);
    if (error) {
      console.error('Failed to add vehicle:', error);
      throw error;
    }
  };

  // Handle adding a car to favorites from the modal
  const handleAddFavorite = async (car) => {
    await addFavorite(car);
  };

  // If viewing a build detail, show that instead
  if (selectedBuild) {
    return (
      <div className={styles.page}>
        <BuildDetailView 
          build={selectedBuild}
          car={carData.find(c => c.slug === selectedBuild.carSlug)}
          onBack={() => {
            setSelectedBuild(null);
            window.history.pushState({}, '', '/garage');
          }}
        />
      </div>
    );
  }
  
  return (
    <div className={styles.page}>
      {/* Compact Header Bar */}
      <div className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <h1 className={styles.titleCompact}>MY GARAGE</h1>
        </div>

        <div className={styles.headerCenter}>
          {/* Tab Pills */}
          <div className={styles.tabPills}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${styles.tabPill} ${activeTab === tab.id ? styles.tabPillActive : ''}`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.headerRight}>
          {/* Header actions removed - using in-page CTA buttons instead */}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        {/* Builds Tab - Uses dedicated workshop layout */}
        {activeTab === 'builds' ? (
          <BuildsWorkshop
            builds={buildsWithCars}
            cars={carData}
            onViewDetails={handleBuildAction}
            onDeleteBuild={deleteBuild}
          />
        ) : (
          /* My Collection & Favorites - Hero display layout */
          currentItems.length > 0 ? (
            <>
              {/* Hero Display */}
              <HeroVehicleDisplay
                item={currentItem}
                type={activeTab}
                onAction={handleBuildAction}
                onAddToMyCars={handleAddFavoriteToMyCars}
                isInMyCars={activeTab === 'favorites' && currentItem ? isInMyCars(currentItem.slug) : false}
              />

              {/* Thumbnail Strip at Bottom */}
              <ThumbnailStrip
                items={currentItems}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
                type={activeTab}
                onRemove={handleRemove}
              />

              {/* Vehicle Counter */}
              <div className={styles.vehicleCounter}>
                <span>{selectedIndex + 1}</span>
                <span className={styles.counterDivider}>/</span>
                <span>{currentItems.length}</span>
              </div>
            </>
          ) : (
            <EmptyState
              icon={tabs.find(t => t.id === activeTab)?.icon || Icons.car}
              title={
                activeTab === 'mycars' ? 'No Vehicles Yet' :
                activeTab === 'favorites' ? 'No Favorites Yet' :
                'No Saved Builds'
              }
              description={
                activeTab === 'mycars' 
                  ? 'Add the vehicles you own to track maintenance and get personalized recommendations.'
                  : activeTab === 'favorites'
                    ? 'Build your dream garage by adding cars you love. Browse the catalog and tap the heart icon.'
                    : 'Create and save build configurations in the Mod Planner.'
              }
              actionLabel={
                activeTab === 'mycars' ? 'Add Your First Car' :
                activeTab === 'favorites' ? 'Add Your First Favorite' :
                'Go to Mod Planner'
              }
              onAction={() => {
                if (activeTab === 'mycars') {
                  setIsAddVehicleOpen(true);
                } else if (activeTab === 'favorites') {
                  setIsAddFavoritesOpen(true);
                } else {
                  router.push('/mod-planner');
                }
              }}
            />
          )
        )}
      </div>
      
      <AuthModal 
        isOpen={authModal.isOpen}
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />

      <AddVehicleModal
        isOpen={isAddVehicleOpen}
        onClose={() => setIsAddVehicleOpen(false)}
        onAdd={handleAddVehicle}
        existingVehicles={vehicles}
      />

      <AddFavoritesModal
        isOpen={isAddFavoritesOpen}
        onClose={() => setIsAddFavoritesOpen(false)}
        onAdd={handleAddFavorite}
        existingFavorites={favorites}
      />
    </div>
  );
}

// Loading fallback
function GarageLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </div>
    </div>
  );
}

// Main export
export default function GaragePage() {
  return (
    <Suspense fallback={<GarageLoading />}>
      <GarageContent />
    </Suspense>
  );
}
