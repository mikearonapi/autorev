'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from './SportsCarComparison.module.css';
import { carData as localCarData, categories, tierConfig, recommendationTypes } from '@/data/cars.js';
import { fetchCars } from '@/lib/carsClient.js';
import { getDescriptorForValue, priorityDescriptors } from '@/data/selectorDescriptors.js';
import { 
  calculateWeightedScore, 
  calculateMaxScore, 
  getRecommendations,
  getTopPriorities,
  getDynamicRecommendationTypes,
  DEFAULT_WEIGHTS,
} from '@/lib/scoring.js';
import CarImage from './CarImage';
import CarActionMenu from './CarActionMenu';
import ScoringInfo from './ScoringInfo';
import { savePreferences, loadPreferences } from '@/lib/stores/userPreferencesStore';

/**
 * Extract the low price from a price range string like "$55-70K" → 55000
 * Falls back to priceAvg if parsing fails
 */
function getPriceLow(car) {
  if (car.priceRange) {
    // Match patterns like "$55-70K", "$85-100K", "$12-25K"
    const match = car.priceRange.match(/\$(\d+)/);
    if (match) {
      return parseInt(match[1], 10) * 1000;
    }
  }
  return car.priceAvg;
}

// SVG Icons - Optimized for light theme
const Icons = {
  sound: ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  ),
  interior: ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  track: ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  reliability: ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  value: ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  driverFun: ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <polygon points="10 8 16 12 10 16 10 8"/>
    </svg>
  ),
  aftermarket: ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  search: ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  trophy: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
  zap: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  shield: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  tool: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  car: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  alertCircle: ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  externalLink: ({ size = 14, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  plus: ({ size = 14, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  checkCircle: ({ size = 14, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  // Requirement card icons
  wallet: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
    </svg>
  ),
  gearshift: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 21v-6"/>
      <path d="M12 9V3"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M6 6h2"/>
      <path d="M6 12h2"/>
      <path d="M16 6h2"/>
      <path d="M16 18h2"/>
    </svg>
  ),
  drivetrain: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="2"/>
      <circle cx="4" cy="12" r="2"/>
      <circle cx="20" cy="12" r="2"/>
      <path d="M6 12h4"/>
      <path d="M14 12h4"/>
    </svg>
  ),
  seat: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 18v3h3"/>
      <path d="M4 18a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4"/>
      <path d="M20 18v3h-3"/>
      <path d="M8 14V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v9"/>
    </svg>
  ),
  engine: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <path d="M6 6V4"/>
      <path d="M10 6V4"/>
      <path d="M14 6V4"/>
      <path d="M18 6V4"/>
      <path d="M6 18v2"/>
      <path d="M18 18v2"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  globe: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
      <path d="M2 12h20"/>
    </svg>
  ),
  racing: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 12c0-3 2.5-6 6-6 1 0 2 .5 2.5 1L22 5v7c0 3-2.5 6-6 6-1 0-2-.5-2.5-1L12 19v-7Z"/>
      <path d="M2 5l1.5 2c.5-.5 1.5-1 2.5-1 3.5 0 6 3 6 6v7l-1.5-2c-.5.5-1.5 1-2.5 1-3.5 0-6-3-6-6V5Z"/>
    </svg>
  ),
  verified: ({ size = 14, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
    </svg>
  )
};

// Car data, categories, and tier config are imported from src/data/cars.js

// Categories with icons for UI (extending imported categories)
const categoriesWithIcons = categories.map(cat => ({
  ...cat,
  icon: Icons[cat.key] || Icons.alertCircle
}));

// Tier configuration with CSS classes
const tierConfigWithStyles = {
  premium: { ...tierConfig.premium, className: styles.tierPremium },
  'upper-mid': { ...tierConfig['upper-mid'], className: styles.tierUpper },
  mid: { ...tierConfig.mid, className: styles.tierMid },
  budget: { ...tierConfig.budget, className: styles.tierEntry }
};

// Recommendation types with icons for UI
const recommendationTypesWithIcons = [
  { key: 'top', label: 'Top Match', icon: Icons.trophy, colorVar: '--rec-top' },
  { key: 'sound', label: 'Best Sound & Feel', icon: Icons.sound, colorVar: '--rec-sound' },
  { key: 'track', label: 'Best for Track', icon: Icons.track, colorVar: '--rec-track' },
  { key: 'value', label: 'Best Value', icon: Icons.value, colorVar: '--rec-value' },
  { key: 'reliable', label: 'Most Reliable', icon: Icons.shield, colorVar: '--rec-reliable' },
  { key: 'modder', label: 'Best Aftermarket', icon: Icons.tool, colorVar: '--rec-aftermarket' }
];

// Get score badge class
const getScoreBadgeClass = (score) => {
  if (score >= 9) return styles.scoreBadgeExcellent;
  if (score >= 7) return styles.scoreBadgeGood;
  if (score >= 5) return styles.scoreBadgeAverage;
  return styles.scoreBadgePoor;
};

// Get total score class
const getTotalScoreClass = (score, maxScore) => {
  const ratio = score / maxScore;
  if (ratio >= 0.8) return styles.tableTotalHigh;
  if (ratio >= 0.65) return styles.tableTotalMid;
  return styles.tableTotalLow;
};

export default function SportsCarComparison() {
  // State for car data (fetched from Supabase or local fallback)
  const [carData, setCarData] = useState(localCarData);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // State for user preferences
  // All categories start at "Normal" (1.0) - user adjusts from there
  const [weights, setWeights] = useState(() => DEFAULT_WEIGHTS);
  const [sortBy, setSortBy] = useState('total');
  const [priceMax, setPriceMax] = useState(100000);
  const [priceMin, setPriceMin] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  // selectedCategory removed - now using mustHaveFilters.engineLayoutFilter
  const [expandedId, setExpandedId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Must-have filters (hard constraints)
  const [mustHaveFilters, setMustHaveFilters] = useState({
    transmissionFilter: 'all', // 'all', 'manual', 'automatic'
    drivetrainFilter: 'all', // 'all', 'RWD', 'AWD', 'FWD'
    seatsFilter: 'all', // 'all', '2', '4'
    engineLayoutFilter: 'all', // 'all', 'Mid-Engine', 'Front-Engine', 'Rear-Engine'
    originFilter: 'all', // 'all', 'american', 'japanese', 'european'
    styleFilter: 'all', // 'all', 'purist', 'tuner', 'drift', 'stance'
    tierFilter: 'all', // 'all', 'premium', 'upper-mid', 'mid', 'budget'
    categoryFilter: 'all', // 'all', 'jdm', 'muscle', 'german', 'exotic', 'track', 'rally', 'hothatch'
  });
  
  // Car category definitions for filtering
  const CAR_CATEGORIES = [
    { key: 'all', label: 'All Cars', icon: Icons.car },
    { key: 'jdm', label: 'JDM Legends', icon: Icons.racing, brands: ['Toyota', 'Nissan', 'Honda', 'Mazda', 'Mitsubishi', 'Subaru', 'Lexus', 'Acura'] },
    { key: 'muscle', label: 'American Muscle', icon: Icons.zap, brands: ['Chevrolet', 'Ford', 'Dodge'] },
    { key: 'german', label: 'German Performance', icon: Icons.shield, brands: ['BMW', 'Mercedes-Benz', 'Mercedes-AMG', 'Audi', 'Porsche', 'Volkswagen'] },
    { key: 'exotic', label: 'Exotic & Rare', icon: Icons.trophy, brands: ['Lamborghini', 'Ferrari', 'McLaren', 'Aston Martin', 'Lotus'] },
    { key: 'track', label: 'Track Weapons', icon: Icons.track, filter: (car) => car.track >= 8 },
    { key: 'rally', label: 'Rally & AWD', icon: Icons.drivetrain, filter: (car) => car.drivetrain === 'AWD' },
  ];
  
  // Refs
  const tableRef = useRef(null);
  const rowRefs = useRef({});

  // Fetch car data on mount
  useEffect(() => {
    let isMounted = true;
    let timeoutId;
    
    async function loadCars() {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Create a timeout promise that rejects after 10 seconds
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error('Request timeout - loading took too long'));
          }, 10000);
        });
        
        // Race between the fetch and the timeout
        const cars = await Promise.race([
          fetchCars(),
          timeoutPromise
        ]);
        
        // Clear timeout if fetch succeeded
        if (timeoutId) clearTimeout(timeoutId);
        
        if (isMounted) {
          setCarData(cars);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[SportsCarComparison] Error loading cars:', err);
        if (isMounted) {
          const errorMsg = err.message?.includes('timeout') 
            ? 'Loading timed out. Using cached data.' 
            : 'Failed to load vehicle data. Using cached data.';
          setLoadError(errorMsg);
          setCarData(localCarData); // Fallback to local data
          setIsLoading(false);
        }
      }
    }
    
    loadCars();
    
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save user preferences whenever they change (for Compare Modal to reference)
  useEffect(() => {
    savePreferences({
      budgetMin: priceMin,
      budgetMax: priceMax,
      transmissionFilter: mustHaveFilters.transmissionFilter,
      drivetrainFilter: mustHaveFilters.drivetrainFilter,
      seatsFilter: mustHaveFilters.seatsFilter,
      engineLayoutFilter: mustHaveFilters.engineLayoutFilter,
      originFilter: mustHaveFilters.originFilter,
      styleFilter: mustHaveFilters.styleFilter,
      tierFilter: mustHaveFilters.tierFilter,
      weights,
    });
  }, [priceMin, priceMax, mustHaveFilters, weights]);

  // Calculate weighted total score using scoring library
  const calculateTotal = useCallback((car) => 
    calculateWeightedScore(car, weights),
    [weights]
  );

  // Maximum possible score based on current weights
  const maxScore = useMemo(() => 
    calculateMaxScore(weights),
    [weights]
  );

  // Helper to determine car origin category
  const getCarOrigin = useCallback((car) => {
    if (car.country === 'USA') return 'american';
    if (car.country === 'Japan') return 'japanese';
    if (['Germany', 'Italy', 'UK'].includes(car.country)) return 'european';
    return 'other';
  }, []);

  // Helper to determine if car matches enthusiast style
  const matchesStyle = useCallback((car, style) => {
    if (style === 'all') return true;
    
    switch (style) {
      case 'purist':
        // Purist: NA engines, high sound/driverFun, manual available
        const isNA = car.engine && !car.engine.toLowerCase().includes('turbo') && 
                     !car.engine.toLowerCase().includes('sc') && 
                     !car.engine.toLowerCase().includes('supercharg');
        return isNA && car.sound >= 8 && car.driverFun >= 8 && car.manualAvailable;
      
      case 'tuner':
        // Tuner: High aftermarket support, good platform for mods
        return car.aftermarket >= 8;
      
      case 'drift':
        // Drift: RWD, good power-to-weight, responsive
        return car.drivetrain === 'RWD' && car.hp >= 300 && car.driverFun >= 7;
      
      case 'stance':
        // Stance: Popular in car culture, good aftermarket, Japanese or German preferred
        return car.aftermarket >= 7 && ['Japan', 'Germany'].includes(car.country);
      
      default:
        return true;
    }
  }, []);

  // Filtered and sorted cars (with must-have filters)
  // Price filter uses the LOW end of the price range so cars are shown if they START under budget
  const filteredCars = useMemo(() => {
    return carData
      .filter(car => getPriceLow(car) >= priceMin && getPriceLow(car) <= priceMax)
      .filter(car => car.name.toLowerCase().includes(searchTerm.toLowerCase()))
      // Engine layout filter is now in mustHaveFilters.engineLayoutFilter
      // Must-have: Transmission filter (parse trans field like "6MT", "8AT", "6MT/7PDK")
      .filter(car => {
        if (mustHaveFilters.transmissionFilter === 'all') return true;
        const trans = (car.trans || '').toUpperCase();
        const hasManual = trans.includes('MT');
        // Check for all automatic types: AT, DCT, PDK, DSG, SMG, Auto, Tronic, Gear, Direct
        const hasAuto = trans.includes('AT') || trans.includes('DCT') || trans.includes('PDK') || 
                        trans.includes('DSG') || trans.includes('SMG') || trans.includes('AUTO') || 
                        trans.includes('TRONIC') || trans.includes('GEAR') || trans.includes('DIRECT');
        if (mustHaveFilters.transmissionFilter === 'manual') return hasManual;
        if (mustHaveFilters.transmissionFilter === 'automatic') return hasAuto;
        return true;
      })
      // Must-have: Drivetrain filter
      .filter(car => mustHaveFilters.drivetrainFilter === 'all' || car.drivetrain === mustHaveFilters.drivetrainFilter)
      // Must-have: Seats filter (graceful handling if seats data is missing)
      .filter(car => mustHaveFilters.seatsFilter === 'all' || !car.seats ||
        (mustHaveFilters.seatsFilter === '2' && car.seats <= 2) ||
        (mustHaveFilters.seatsFilter === '4' && car.seats >= 4))
      // Must-have: Engine layout filter
      .filter(car => mustHaveFilters.engineLayoutFilter === 'all' || car.category === mustHaveFilters.engineLayoutFilter)
      // Origin filter (American Muscle vs Import)
      .filter(car => mustHaveFilters.originFilter === 'all' || getCarOrigin(car) === mustHaveFilters.originFilter)
      // Enthusiast style filter (Purist, Tuner, Drift, Stance)
      .filter(car => matchesStyle(car, mustHaveFilters.styleFilter))
      // Tier filter (Premium, Upper-Mid, Mid, Budget)
      .filter(car => mustHaveFilters.tierFilter === 'all' || car.tier === mustHaveFilters.tierFilter)
      // Category filter (JDM, Muscle, German, etc.)
      .filter(car => {
        if (mustHaveFilters.categoryFilter === 'all') return true;
        const category = CAR_CATEGORIES.find(c => c.key === mustHaveFilters.categoryFilter);
        if (!category) return true;
        if (category.brands) {
          return category.brands.some(brand => 
            (car.brand || '').toLowerCase().includes(brand.toLowerCase()) ||
            (car.name || '').toLowerCase().includes(brand.toLowerCase())
          );
        }
        if (category.filter) {
          return category.filter(car);
        }
        return true;
      })
      .map(car => ({ ...car, total: calculateTotal(car) }))
      .sort((a, b) => {
        if (sortBy === 'price') return a.priceAvg - b.priceAvg;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return b[sortBy] - a[sortBy];
      });
  }, [carData, weights, sortBy, priceMin, priceMax, searchTerm, mustHaveFilters, calculateTotal, getCarOrigin, matchesStyle]);

  // Get user's top priorities for ranking display
  const topPriorities = useMemo(() => 
    getTopPriorities(weights, 3).map(p => ({
      ...p,
      ...categoriesWithIcons.find(c => c.key === p.key)
    })),
    [weights]
  );

  // Dynamic recommendation types based on user's priorities
  const dynamicRecommendationTypes = useMemo(() => 
    getDynamicRecommendationTypes(weights).map(rec => ({
      ...rec,
      icon: rec.isPrimary ? Icons.trophy : (Icons[rec.icon] || Icons.alertCircle),
      colorVar: rec.isPrimary ? '--rec-top' : `--rec-${rec.key}`,
    })),
    [weights]
  );

  // Personalized recommendations using scoring library
  const recommendations = useMemo(() => {
    return getRecommendations(filteredCars, weights);
  }, [filteredCars, weights]);

  // Active priorities for summary display (legacy, kept for potential future use)
  const activePriorities = useMemo(() => 
    categoriesWithIcons
      .filter(cat => weights[cat.key] > 1)
      .map(cat => ({ ...cat, weight: weights[cat.key] })),
    [weights]
  );

  // Check if filters are constraining results significantly
  const filterWarning = useMemo(() => {
    if (filteredCars.length === 0) return 'No matches found';
    if (filteredCars.length < 3 && carData.length > 10) return `Only ${filteredCars.length} match${filteredCars.length === 1 ? 'es' : ''} your criteria`;
    return null;
  }, [filteredCars.length, carData.length]);

  // Handle recommendation card click - expand and scroll to car
  const handleRecCardClick = useCallback((car) => {
    if (!car) return;
    setExpandedId(car.id);
    
    // Scroll to the row after a brief delay to allow expansion
    setTimeout(() => {
      const rowElement = rowRefs.current[car.id];
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, []);

  // Handle weight change
  const handleWeightChange = useCallback((key, value) => {
    setWeights(prev => ({ ...prev, [key]: parseFloat(value) }));
  }, []);

  // Handle price filter change
  const handlePriceChange = useCallback((e) => {
    const [min, max] = e.target.value.split('-').map(Number);
    setPriceMin(min);
    setPriceMax(max);
  }, []);

  // Get priority badge text and class
  const getPriorityBadge = (weight) => {
    if (weight === 0) return { text: 'Off', className: `${styles.priorityBadge} ${styles.priorityBadgeOff}` };
    if (weight === 1) return { text: 'Normal', className: styles.priorityBadge };
    return { text: `${weight}×`, className: `${styles.priorityBadge} ${styles.priorityBadgeHigh}` };
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.main}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading vehicle database...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        {/* Error notice (non-blocking) */}
        {loadError && (
          <div className={styles.errorNotice}>
            <Icons.alertCircle size={16} />
            <span>{loadError}</span>
          </div>
        )}

        {/* Step 1: What Kind of Car? */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.stepBadge}>1</div>
            <h2 className={styles.sectionTitle}>What Kind of Car Are You Looking For?</h2>
            <span className={styles.sectionMeta}>Tell us your must-haves</span>
          </div>

          <div className={styles.requirementsGrid}>
            {/* Budget Question */}
            <div className={styles.requirementCard}>
              <div className={styles.requirementQuestion}>
                <span className={styles.requirementIconSvg}><Icons.wallet size={14} /></span>
                <span className={styles.requirementLabel}>Budget</span>
              </div>
              <select 
                value={`${priceMin}-${priceMax}`} 
                onChange={handlePriceChange}
                className={styles.requirementSelect}
                aria-label="Budget range"
              >
                <option value="0-100000">Under $100K</option>
                <option value="0-75000">Under $75K</option>
                <option value="0-60000">Under $60K</option>
                <option value="0-50000">Under $50K</option>
                <option value="0-40000">Under $40K</option>
                <option value="0-30000">Under $30K</option>
              </select>
            </div>

            {/* Transmission Question */}
            <div className={styles.requirementCard}>
              <div className={styles.requirementQuestion}>
                <span className={styles.requirementIconSvg}><Icons.gearshift size={14} /></span>
                <span className={styles.requirementLabel}>Transmission</span>
              </div>
              <div className={styles.requirementToggle}>
                <button
                  className={`${styles.toggleBtn} ${mustHaveFilters.transmissionFilter === 'all' ? styles.toggleActive : ''}`}
                  onClick={() => setMustHaveFilters(prev => ({ ...prev, transmissionFilter: 'all' }))}
                >
                  Any
                </button>
                <button
                  className={`${styles.toggleBtn} ${mustHaveFilters.transmissionFilter === 'manual' ? styles.toggleActive : ''}`}
                  onClick={() => setMustHaveFilters(prev => ({ ...prev, transmissionFilter: 'manual' }))}
                >
                  Manual
                </button>
                <button
                  className={`${styles.toggleBtn} ${mustHaveFilters.transmissionFilter === 'automatic' ? styles.toggleActive : ''}`}
                  onClick={() => setMustHaveFilters(prev => ({ ...prev, transmissionFilter: 'automatic' }))}
                >
                  Auto
                </button>
              </div>
            </div>

            {/* Drivetrain Question */}
            <div className={styles.requirementCard}>
              <div className={styles.requirementQuestion}>
                <span className={styles.requirementIconSvg}><Icons.drivetrain size={14} /></span>
                <span className={styles.requirementLabel}>Drivetrain</span>
              </div>
              <div className={styles.requirementToggle}>
                <button
                  className={`${styles.toggleBtn} ${mustHaveFilters.drivetrainFilter === 'all' ? styles.toggleActive : ''}`}
                  onClick={() => setMustHaveFilters(prev => ({ ...prev, drivetrainFilter: 'all' }))}
                >
                  Any
                </button>
                <button
                  className={`${styles.toggleBtn} ${mustHaveFilters.drivetrainFilter === 'RWD' ? styles.toggleActive : ''}`}
                  onClick={() => setMustHaveFilters(prev => ({ ...prev, drivetrainFilter: 'RWD' }))}
                >
                  RWD
                </button>
                <button
                  className={`${styles.toggleBtn} ${mustHaveFilters.drivetrainFilter === 'AWD' ? styles.toggleActive : ''}`}
                  onClick={() => setMustHaveFilters(prev => ({ ...prev, drivetrainFilter: 'AWD' }))}
                >
                  AWD
                </button>
              </div>
            </div>

            {/* Seating Question */}
            <div className={styles.requirementCard}>
              <div className={styles.requirementQuestion}>
                <span className={styles.requirementIconSvg}><Icons.seat size={14} /></span>
                <span className={styles.requirementLabel}>Seats</span>
              </div>
              <div className={styles.requirementToggle}>
                <button
                  className={`${styles.toggleBtn} ${mustHaveFilters.seatsFilter === 'all' ? styles.toggleActive : ''}`}
                  onClick={() => setMustHaveFilters(prev => ({ ...prev, seatsFilter: 'all' }))}
                >
                  Any
                </button>
                <button
                  className={`${styles.toggleBtn} ${mustHaveFilters.seatsFilter === '2' ? styles.toggleActive : ''}`}
                  onClick={() => setMustHaveFilters(prev => ({ ...prev, seatsFilter: '2' }))}
                >
                  2
                </button>
                <button
                  className={`${styles.toggleBtn} ${mustHaveFilters.seatsFilter === '4' ? styles.toggleActive : ''}`}
                  onClick={() => setMustHaveFilters(prev => ({ ...prev, seatsFilter: '4' }))}
                >
                  4+
                </button>
              </div>
            </div>

            {/* Engine Layout Question */}
            <div className={styles.requirementCard}>
              <div className={styles.requirementQuestion}>
                <span className={styles.requirementIconSvg}><Icons.engine size={14} /></span>
                <span className={styles.requirementLabel}>Engine</span>
              </div>
              <select
                value={mustHaveFilters.engineLayoutFilter}
                onChange={e => setMustHaveFilters(prev => ({ ...prev, engineLayoutFilter: e.target.value }))}
                className={styles.requirementSelect}
                aria-label="Engine layout"
              >
                <option value="all">Any Position</option>
                <option value="Front-Engine">Front Engine</option>
                <option value="Mid-Engine">Mid Engine</option>
                <option value="Rear-Engine">Rear Engine</option>
              </select>
            </div>

            {/* Car Culture Question */}
            <div className={styles.requirementCard}>
              <div className={styles.requirementQuestion}>
                <span className={styles.requirementIconSvg}><Icons.globe size={14} /></span>
                <span className={styles.requirementLabel}>Origin</span>
              </div>
              <select
                value={mustHaveFilters.originFilter}
                onChange={e => setMustHaveFilters(prev => ({ ...prev, originFilter: e.target.value }))}
                className={styles.requirementSelect}
                aria-label="Car culture preference"
              >
                <option value="all">Any Origin</option>
                <option value="american">American</option>
                <option value="japanese">Japanese</option>
                <option value="european">European</option>
              </select>
            </div>

            {/* Enthusiast Style Question */}
            <div className={styles.requirementCard}>
              <div className={styles.requirementQuestion}>
                <span className={styles.requirementIconSvg}><Icons.racing size={14} /></span>
                <span className={styles.requirementLabel}>Style</span>
              </div>
              <select
                value={mustHaveFilters.styleFilter}
                onChange={e => setMustHaveFilters(prev => ({ ...prev, styleFilter: e.target.value }))}
                className={styles.requirementSelect}
                aria-label="Driving style preference"
              >
                <option value="all">Any Style</option>
                <option value="purist">Purist</option>
                <option value="tuner">Tuner</option>
                <option value="drift">Drift</option>
                <option value="stance">Stance</option>
              </select>
            </div>

          </div>

          {filterWarning && (
            <div className={styles.filterWarning}>
              <Icons.alertCircle size={14} />
              <span>{filterWarning} — try relaxing some filters</span>
            </div>
          )}
        </section>

        {/* Step 2: Define Priorities */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.stepBadge}>2</div>
            <h2 className={styles.sectionTitle}>What Matters Most to You?</h2>
            <span className={styles.sectionMeta}>Adjust importance of each category to personalize rankings</span>
          </div>

          <div className={styles.prioritiesGrid}>
            {categoriesWithIcons.map(cat => {
              const IconComponent = cat.icon;
              const isHighPriority = weights[cat.key] > 1;
              const isLowPriority = weights[cat.key] < 1;
              const badge = getPriorityBadge(weights[cat.key]);
              const descriptor = getDescriptorForValue(cat.key, weights[cat.key]);
              
              return (
                <div 
                  key={cat.key} 
                  className={`${styles.priorityCard} ${isHighPriority ? styles.priorityCardHigh : ''} ${isLowPriority ? styles.priorityCardLow : ''}`}
                >
                  <div className={styles.priorityCardHeader}>
                    <div className={styles.priorityCardIcon}>
                      <IconComponent size={16} />
                      <span className={styles.priorityCardLabel}>{cat.label}</span>
                    </div>
                    <span className={badge.className}>{badge.text}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.5"
                    value={weights[cat.key]}
                    onChange={e => handleWeightChange(cat.key, e.target.value)}
                    className={styles.prioritySlider}
                    aria-label={`${cat.label} priority weight`}
                    style={{
                      background: `linear-gradient(to right, #1a4d6e 0%, #1a4d6e ${(weights[cat.key] / 3) * 100}%, #e5e5e5 ${(weights[cat.key] / 3) * 100}%, #e5e5e5 100%)`
                    }}
                  />
                  {descriptor && (
                    <p className={styles.priorityDescriptor}>{descriptor}</p>
                  )}
                </div>
              );
            })}
          </div>

        </section>

        {/* Step 3: Recommendations */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.stepBadge}>3</div>
            <h2 className={styles.sectionTitle}>Your Personalized Recommendations</h2>
          </div>

          <div className={styles.recommendationsGrid}>
            {dynamicRecommendationTypes.map(rec => {
              const car = recommendations[rec.key];
              const IconComponent = rec.icon;
              
              return (
                <div 
                  key={rec.key}
                  className={`${styles.recCard} ${rec.isPrimary ? styles.recCardPrimary : ''}`}
                  style={{ '--rec-color': `var(${rec.colorVar})` }}
                  onClick={() => handleRecCardClick(car)}
                  onKeyDown={e => e.key === 'Enter' && handleRecCardClick(car)}
                  tabIndex={car ? 0 : -1}
                  role="button"
                  aria-label={car ? `View ${car.name} - ${rec.label}` : `${rec.label} - No match`}
                >
                  <div className={styles.recCardHeader}>
                    <div className={styles.recCardIcon}>
                      <IconComponent size={18} />
                  </div>
                    <span className={styles.recCardLabel}>{rec.label}</span>
                  </div>
                  {car ? (
                    <>
                      <div className={styles.recCardImage}>
                        <CarImage car={car} variant="thumbnail" showName={false} />
                      </div>
                      <div className={styles.recCardName}>{car.name}</div>
                      <div className={styles.recCardPrice}>{car.priceRange}</div>
                      <div className={styles.recCardScore}>
                        Score: <strong>{car.total.toFixed(1)}</strong>/{maxScore}
                      </div>
                      {car.slug && (
                        <Link 
                          href={`/browse-cars/${car.slug}`}
                          className={styles.recCardLink}
                          onClick={e => e.stopPropagation()}
                        >
                          View Profile <Icons.externalLink size={12} />
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className={styles.recCardEmpty}>No match in current filters</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* About Our Scoring & Sources */}
        <ScoringInfo variant="compact" />

        {/* Step 4: Explore All Vehicles */}
        <section className={styles.section} ref={tableRef}>
          <div className={styles.sectionHeader}>
            <div className={styles.stepBadge}>4</div>
            <h2 className={styles.sectionTitle}>Explore All Vehicles</h2>
            <span className={styles.sectionMeta}>{filteredCars.length} vehicles</span>
          </div>

          {/* Category & Tier Filters */}
          <div className={styles.exploreFilters}>
            {/* Category Pills */}
            <div className={styles.exploreCategoryRow}>
              {CAR_CATEGORIES.map(cat => {
                const IconComponent = cat.icon;
                const isActive = mustHaveFilters.categoryFilter === cat.key;
                return (
                  <button
                    key={cat.key}
                    className={`${styles.exploreCategoryBtn} ${isActive ? styles.exploreCategoryActive : ''}`}
                    onClick={() => setMustHaveFilters(prev => ({ ...prev, categoryFilter: cat.key }))}
                  >
                    <IconComponent size={14} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tier Pills */}
            <div className={styles.exploreTierRow}>
              <button
                className={`${styles.exploreTierBtn} ${mustHaveFilters.tierFilter === 'all' ? styles.exploreTierActive : ''}`}
                onClick={() => setMustHaveFilters(prev => ({ ...prev, tierFilter: 'all' }))}
              >
                All Tiers
              </button>
              <button
                className={`${styles.exploreTierBtn} ${styles.exploreTierPremium} ${mustHaveFilters.tierFilter === 'premium' ? styles.exploreTierActive : ''}`}
                onClick={() => setMustHaveFilters(prev => ({ ...prev, tierFilter: 'premium' }))}
              >
                Premium
              </button>
              <button
                className={`${styles.exploreTierBtn} ${styles.exploreTierUpper} ${mustHaveFilters.tierFilter === 'upper-mid' ? styles.exploreTierActive : ''}`}
                onClick={() => setMustHaveFilters(prev => ({ ...prev, tierFilter: 'upper-mid' }))}
              >
                Upper-Mid
              </button>
              <button
                className={`${styles.exploreTierBtn} ${styles.exploreTierMid} ${mustHaveFilters.tierFilter === 'mid' ? styles.exploreTierActive : ''}`}
                onClick={() => setMustHaveFilters(prev => ({ ...prev, tierFilter: 'mid' }))}
              >
                Mid
              </button>
              <button
                className={`${styles.exploreTierBtn} ${styles.exploreTierBudget} ${mustHaveFilters.tierFilter === 'budget' ? styles.exploreTierActive : ''}`}
                onClick={() => setMustHaveFilters(prev => ({ ...prev, tierFilter: 'budget' }))}
              >
                Budget
              </button>
            </div>
          </div>

          {/* Search & Sort Filters */}
          <div className={styles.filtersBar}>
            <div className={styles.filtersGroup}>
              <div className={styles.searchInput}>
                <div className={styles.searchInputIcon}>
                  <Icons.search size={14} />
                </div>
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  aria-label="Search vehicles"
                />
              </div>

              <select 
                value={`${priceMin}-${priceMax}`} 
                onChange={handlePriceChange}
                className={styles.filterSelect}
                aria-label="Filter by budget"
              >
                <option value="0-100000">Under $100K</option>
                <option value="0-90000">Under $90K</option>
                <option value="0-80000">Under $80K</option>
                <option value="0-70000">Under $70K</option>
                <option value="0-60000">Under $60K</option>
                <option value="0-50000">Under $50K</option>
                <option value="0-40000">Under $40K</option>
                <option value="0-30000">Under $30K</option>
              </select>

              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className={styles.filterSelect}
                aria-label="Sort vehicles by"
              >
                <option value="total">Sort by Score</option>
                <option value="price">Sort by Price</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className={styles.tableWrapper}>
            {filteredCars.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>
                  <Icons.alertCircle size={32} />
                </div>
                <h3>No vehicles found</h3>
                <p>Try adjusting your filters or widening the price range.</p>
              </div>
            ) : (
              <div className={styles.tableScrollContainer}>
                {/* Table Header - Desktop only */}
                <div className={styles.tableHeader}>
              <span>Rank</span>
              <span>Vehicle</span>
                  {categoriesWithIcons.map(cat => {
                    const IconComponent = cat.icon;
                return (
                      <div 
                        key={cat.key} 
                        className={styles.tableHeaderIcon} 
                        data-tooltip={cat.label}
                        aria-label={cat.label}
                      >
                        <IconComponent size={16} />
                  </div>
                );
              })}
              <span style={{ textAlign: 'center' }}>Score</span>
              <span style={{ textAlign: 'right' }}>Price</span>
            </div>

            {/* Table Rows */}
                {filteredCars.map((car, index) => {
              const isExpanded = expandedId === car.id;
                  const tier = tierConfigWithStyles[car.tier];
                  const isTop = index === 0;
                  const isPodium = index < 3;
              
              return (
                    <div 
                      key={car.id}
                      ref={el => rowRefs.current[car.id] = el}
                    >
                      {/* Desktop Row */}
                      {!isMobile ? (
                        <div
                          className={`${styles.tableRow} ${isTop ? styles.tableRowTop : ''}`}
                    onClick={() => setExpandedId(isExpanded ? null : car.id)}
                          onKeyDown={e => e.key === 'Enter' && setExpandedId(isExpanded ? null : car.id)}
                          tabIndex={0}
                          role="button"
                          aria-expanded={isExpanded}
                          aria-label={`${car.name}, rank ${index + 1}, score ${car.total.toFixed(1)}`}
                        >
                          <span className={`${styles.tableRank} ${isTop ? styles.tableRankTop : isPodium ? styles.tableRankPodium : ''}`}>
                            {index + 1}
                    </span>
                    
                          <div className={styles.tableVehicle}>
                            <div className={styles.tableVehicleName}>
                              <span className={styles.tableVehicleTitle}>{car.name}</span>
                              <span className={`${styles.tierChip} ${tier.className}`}>
                                {tier.label}
                        </span>
                      </div>
                            <div className={styles.tableVehicleMeta}>
                        {car.years} · {car.category}
                      </div>
                    </div>

                    {categories.map(cat => (
                            <div key={cat.key} className={styles.scoreCell}>
                              <div className={`${styles.scoreBadge} ${getScoreBadgeClass(car[cat.key])}`}>
                          {car[cat.key]}
                        </div>
                      </div>
                    ))}

                          <div className={styles.tableTotal}>
                            <span className={`${styles.tableTotalScore} ${getTotalScoreClass(car.total, maxScore)}`}>
                        {car.total.toFixed(1)}
                      </span>
                    </div>

                          <div className={styles.tablePrice}>
                      {car.priceRange}
                          </div>
                        </div>
                      ) : (
                        /* Mobile Card */
                        <div
                          className={`${styles.tableRow} ${isTop ? styles.tableRowTop : ''}`}
                          onClick={() => setExpandedId(isExpanded ? null : car.id)}
                          onKeyDown={e => e.key === 'Enter' && setExpandedId(isExpanded ? null : car.id)}
                          tabIndex={0}
                          role="button"
                          aria-expanded={isExpanded}
                        >
                          <div className={styles.mobileCard}>
                            <div className={styles.mobileCardHeader}>
                              <div className={`${styles.mobileCardRank} ${isTop ? styles.mobileCardRankTop : ''}`}>
                                {index + 1}
                              </div>
                              <div className={styles.mobileCardInfo}>
                                <div className={styles.tableVehicleName}>
                                  <span className={styles.tableVehicleTitle}>{car.name}</span>
                                  <span className={`${styles.tierChip} ${tier.className}`}>
                                    {tier.label}
                                  </span>
                                </div>
                                <div className={styles.tableVehicleMeta}>
                                  {car.years} · {car.category}
                                </div>
                              </div>
                              <div className={styles.mobileCardPrice}>
                                <div className={styles.mobileCardPriceValue}>{car.priceRange}</div>
                                <div className={styles.mobileCardPriceScore}>
                                  Score: <strong>{car.total.toFixed(1)}</strong>
                                </div>
                              </div>
                            </div>
                            <div className={styles.mobileCardScores}>
                              {categoriesWithIcons.map(cat => {
                                const IconComponent = cat.icon;
                                return (
                                  <div 
                                    key={cat.key} 
                                    className={styles.mobileScorePill}
                                    title={cat.label}
                                  >
                                    <IconComponent size={14} />
                                    <span className={getScoreBadgeClass(car[cat.key]).replace(styles.scoreBadge, '')}>
                                      {car[cat.key]}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className={styles.expandedRow}>
                          <div className={styles.expandedGrid}>
                            <div className={styles.expandedSection}>
                              <h4>Specifications</h4>
                              <div className={styles.expandedSpecs}>
                                <div><span>Engine:</span> {car.engine}</div>
                                <div><span>Power:</span> {car.hp} hp</div>
                                <div><span>Transmission:</span> {car.trans}</div>
                              </div>
                            </div>
                            <div className={styles.expandedSection}>
                              <h4>Notes</h4>
                              <p className={styles.expandedNotes}>{car.notes}</p>
                            </div>
                            <div className={styles.expandedSection}>
                              <h4>Highlight</h4>
                              <span className={styles.highlightBadge}>{car.highlight}</span>
                            </div>
                          </div>
                          {car.slug && (
                            <div className={styles.expandedActions}>
                              <CarActionMenu 
                                car={car} 
                                variant="compact" 
                                showLabels={false} 
                                theme="light"
                              />
                            </div>
                          )}
                        </div>
                      )}
                </div>
              );
            })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
