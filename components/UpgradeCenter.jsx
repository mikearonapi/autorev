'use client';

/**
 * Upgrade Center Component - Ultra Compact Layout
 * 
 * Features:
 * - Minimal scrolling with condensed UI
 * - Car-specific AI recommendations always visible
 * - Split layout: Categories left, Analytics right
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import styles from './UpgradeCenter.module.css';
import {
  getPerformanceProfile,
  getAvailableUpgrades,
  calculateTotalCost,
} from '@/lib/performance.js';
import { getUpgradeByKey } from '@/lib/upgrades.js';
import { useTierConfig } from '@/lib/hooks/useAppConfig.js';
import { 
  getRecommendationSummary, 
  getFocusLabel 
} from '@/lib/carRecommendations.js';
import { 
  calculateTunability, 
  getTunabilityColor 
} from '@/lib/tunabilityCalculator.js';
import {
  checkUpgradeConflict,
  resolveConflicts,
  getConflictingUpgrades,
} from '@/data/upgradeConflicts.js';
import {
  getRecommendationsForCar,
  getTierRecommendations,
  getPlatformNotes,
  getKnownIssues,
} from '@/data/carUpgradeRecommendations.js';
import CarImage from './CarImage';
import UpgradeDetailModal from './UpgradeDetailModal';
import { useSavedBuilds } from './providers/SavedBuildsProvider';
import { useAuth } from './providers/AuthProvider';
import { useOwnedVehicles } from './providers/OwnedVehiclesProvider';
import { supabase } from '@/lib/supabase';
// Import shared upgrade category definitions (single source of truth)
import { UPGRADE_CATEGORIES as SHARED_UPGRADE_CATEGORIES } from '@/lib/upgradeCategories.js';
// TEMPORARILY HIDDEN: Dyno & Lap Times components hidden from UI per product decision.
// To restore, uncomment: import { DynoDataSection, LapTimesSection } from './PerformanceData';

// Mobile-first tuning shop components
import { CategoryNav, FactoryConfig, WheelTireConfigurator } from './tuning-shop';
import PartsSelector from './tuning-shop/PartsSelector';
import ImageUploader from './ImageUploader';
import BuildMediaGallery from './BuildMediaGallery';
import VideoPlayer from './VideoPlayer';

// Compact Icons
const Icons = {
  bolt: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  stopwatch: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 9v4l2 2"/>
      <path d="M9 2h6"/>
    </svg>
  ),
  target: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  disc: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  thermometer: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  ),
  circle: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  ),
  wind: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
    </svg>
  ),
  settings: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  arrowLeft: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  save: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  x: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  info: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  externalLink: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  share: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  camera: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  globe: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  turbo: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a10 10 0 0 1 10 10"/>
      <path d="M12 12l4-4"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  brain: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54"/>
    </svg>
  ),
  chevronRight: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  alertTriangle: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  alertCircle: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  plus: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  swap: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3l4 4-4 4"/>
      <path d="M20 7H4"/>
      <path d="M8 21l-4-4 4-4"/>
      <path d="M4 17h16"/>
    </svg>
  ),
};

// Package configs
const PACKAGES = [
  { key: 'stock', label: 'Stock' },
  { key: 'streetSport', label: 'Street' },
  { key: 'trackPack', label: 'Track' },
  { key: 'timeAttack', label: 'Time Atk' },
  { key: 'ultimatePower', label: 'Power' },
  { key: 'custom', label: 'Custom' },
];

// Map icon names from shared categories to local Icon components
const ICON_NAME_TO_COMPONENT = {
  bolt: Icons.bolt,
  turbo: Icons.turbo,
  target: Icons.target,
  disc: Icons.disc,
  thermometer: Icons.thermometer,
  circle: Icons.circle,
  wind: Icons.wind,
  settings: Icons.settings,
  grid: Icons.settings, // fallback for 'other' category
};

/**
 * UPGRADE_CATEGORIES - derived from shared definitions
 * This ensures consistency with BuildModsList and other components.
 * Icon names are mapped to local Icon components for rendering.
 */
const UPGRADE_CATEGORIES = SHARED_UPGRADE_CATEGORIES.map(cat => ({
  ...cat,
  icon: ICON_NAME_TO_COMPONENT[cat.icon] || Icons.settings,
}));


/**
 * Generate detailed AI recommendation based on car characteristics and database data
 * Returns an object with title and detailed content
 */
function generateDetailedRecommendation(car, stockMetrics, selectedPackage) {
  // Defensive: handle missing car gracefully
  if (!car || !car.slug) {
    return {
      primaryText: 'Select a car to see upgrade recommendations.',
      focusArea: null,
      platformInsights: [],
      watchOuts: [],
      hasDetailedData: false,
    };
  }
  
  const carSlug = car.slug;
  
  // Try to get car-specific recommendations from our data file
  const carRecs = getRecommendationsForCar(carSlug);
  const platformNotes = getPlatformNotes(carSlug);
  const knownIssues = getKnownIssues(carSlug);
  
  // Also check for database upgrade_recommendations field
  const dbRecs = car.upgradeRecommendations;
  
  // Determine the tier to get narrative from
  let tierKey = selectedPackage;
  if (tierKey === 'stock' || tierKey === 'custom') {
    tierKey = carRecs?.defaultTier || 'streetSport';
  }
  const tierRecs = getTierRecommendations(carSlug, tierKey);
  
  // Build detailed recommendation
  let primaryRecommendation = '';
  let platformInsights = [];
  let watchOuts = [];
  
  // Priority 1: Use database focusReason if available (most specific)
  if (dbRecs?.focusReason) {
    primaryRecommendation = dbRecs.focusReason;
  } 
  // Priority 2: Use tier-specific narrative from carUpgradeRecommendations
  else if (tierRecs?.narrative) {
    primaryRecommendation = tierRecs.narrative;
  }
  // Priority 3: Generate from car specs (fallback)
  else {
    primaryRecommendation = generateFallbackRecommendation(car, stockMetrics);
  }
  
  // Gather platform strengths
  if (dbRecs?.platformStrengths?.length > 0) {
    platformInsights = dbRecs.platformStrengths.slice(0, 2);
  } else if (platformNotes?.length > 0) {
    platformInsights = platformNotes.slice(0, 2);
  }
  
  // Gather watch-outs / known issues
  if (dbRecs?.watchOuts?.length > 0) {
    watchOuts = dbRecs.watchOuts.slice(0, 2);
  } else if (knownIssues?.length > 0) {
    watchOuts = knownIssues.slice(0, 1);
  }
  
  // Get focus area label
  let focusArea = null;
  if (dbRecs?.primaryFocus) {
    const focusLabels = {
      cooling: 'Heat Management',
      handling: 'Chassis & Handling',
      braking: 'Braking',
      power: 'Power & Engine',
      sound: 'Sound & Exhaust',
    };
    focusArea = focusLabels[dbRecs.primaryFocus] || dbRecs.primaryFocus;
  }
  
  return {
    primaryText: primaryRecommendation,
    focusArea,
    platformInsights,
    watchOuts,
    hasDetailedData: !!(carRecs || dbRecs),
  };
}

/**
 * Fallback recommendation generator when no specific data exists
 */
function generateFallbackRecommendation(car, stockMetrics) {
  const hp = car.hp || stockMetrics?.hp || 300;
  const zeroToSixty = stockMetrics?.zeroToSixty || car.zeroToSixty || 5.0;
  const lateralG = stockMetrics?.lateralG || car.lateralG || 0.9;
  const braking = stockMetrics?.braking60To0 || car.braking60To0 || 110;
  const hasTurbo = car.engine?.toLowerCase().includes('turbo') || car.engine?.toLowerCase().includes('twin') || false;
  
  // Determine primary focus based on weakest area
  if (hp < 300 && !hasTurbo) {
    return `The ${car.name.split(' ').slice(-2).join(' ')} responds well to intake, exhaust, and ECU tuning. These bolt-on modifications can add meaningful power while maintaining reliability. Consider forced induction for significant gains.`;
  }
  
  if (lateralG < 0.9) {
    return `This platform has room for handling improvements. Focus on suspension upgrades, high-performance tires, and alignment optimization to unlock its cornering potential.`;
  }
  
  if (braking > 115) {
    return `Braking performance is the primary area for improvement. Upgraded brake pads, high-temp brake fluid, and potentially a big brake kit will significantly reduce stopping distances.`;
  }
  
  if (hp >= 450) {
    return `With ${hp}hp on tap, this platform has excellent power. Focus on chassis upgrades - coilovers, sway bars, and tires - to fully utilize that power through corners.`;
  }
  
  if (zeroToSixty <= 4.5) {
    return `Already quick off the line, this platform benefits most from handling and braking upgrades. Suspension work and better tires will make the most of its straight-line performance.`;
  }
  
  return `A balanced approach works best for this platform. Start with basic bolt-ons (intake, exhaust, tune) then progress to suspension and brakes based on your driving goals.`;
}

/**
 * Compact Metric Row
 */
function MetricRow({ icon: Icon, label, stockValue, upgradedValue, unit, isLowerBetter = false }) {
  // Defensive: handle missing values
  const stock = stockValue ?? 0;
  const upgraded = upgradedValue ?? stock;
  
  const hasImproved = isLowerBetter ? upgraded < stock : upgraded > stock;
  const improvement = Math.abs(upgraded - stock);
  
  const formatValue = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '—';
    if (unit === 'g') return val.toFixed(2);
    if (unit === 's') return val.toFixed(1);
    return Math.round(val);
  };
  
  const maxValues = { hp: 1200, s: 8, ft: 150, g: 1.6 };
  const maxValue = maxValues[unit === ' hp' ? 'hp' : unit] || 1200;
  
  const stockPercent = isLowerBetter 
    ? ((maxValue - stock) / maxValue) * 100 
    : (stock / maxValue) * 100;
  const upgradedPercent = isLowerBetter 
    ? ((maxValue - upgraded) / maxValue) * 100 
    : (upgraded / maxValue) * 100;
  
  return (
    <div className={styles.metric}>
      <div className={styles.metricHeader}>
        <span className={styles.metricLabel}><Icon size={12} />{label}</span>
        <span className={styles.metricValues}>
          {hasImproved ? (
            <>
              <span className={styles.stockVal}>{formatValue(stock)}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.upgradedVal}>{formatValue(upgraded)}{unit}</span>
              <span className={styles.gain}>{isLowerBetter ? '-' : '+'}{formatValue(improvement)}</span>
            </>
          ) : (
            <span className={styles.currentVal}>{formatValue(stock)}{unit}</span>
          )}
        </span>
      </div>
      <div className={styles.track}>
        <div className={styles.fillStock} style={{ width: `${Math.min(100, stockPercent)}%` }} />
        {hasImproved && (
          <div className={styles.fillUpgrade} style={{ left: `${stockPercent}%`, width: `${Math.abs(upgradedPercent - stockPercent)}%` }} />
        )}
      </div>
    </div>
  );
}

/**
 * Experience Score Bar
 */
function ScoreBar({ label, stockScore, upgradedScore }) {
  // Safety checks - handle null/undefined scores
  const safeStockScore = stockScore ?? 7;
  const safeUpgradedScore = upgradedScore ?? safeStockScore;
  const hasImproved = safeUpgradedScore > safeStockScore;
  const delta = safeUpgradedScore - safeStockScore;
  
  return (
    <div className={styles.scoreRow}>
      <div className={styles.scoreHeader}>
        <span className={styles.scoreLabel}>{label}</span>
        <span className={styles.scoreValues}>
          {hasImproved ? (
            <>
              <span className={styles.stockVal}>{safeStockScore.toFixed(1)}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.upgradedVal}>{safeUpgradedScore.toFixed(1)}</span>
            </>
          ) : (
            <span className={styles.currentVal}>{safeStockScore.toFixed(1)}/10</span>
          )}
        </span>
      </div>
      <div className={styles.track}>
        <div className={styles.fillStock} style={{ width: `${(safeStockScore / 10) * 100}%` }} />
        {hasImproved && (
          <div className={styles.fillUpgrade} style={{ left: `${(safeStockScore / 10) * 100}%`, width: `${(delta / 10) * 100}%` }} />
        )}
      </div>
    </div>
  );
}

/**
 * Conflict Notification Toast
 */
function ConflictNotification({ message, onDismiss, replacedUpgrade }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  return (
    <div className={styles.conflictToast}>
      <div className={styles.conflictToastIcon}>
        <Icons.swap size={16} />
      </div>
      <div className={styles.conflictToastContent}>
        <span className={styles.conflictToastTitle}>Upgrade Replaced</span>
        <span className={styles.conflictToastMessage}>{message}</span>
      </div>
      <button className={styles.conflictToastClose} onClick={onDismiss}>
        <Icons.x size={14} />
      </button>
    </div>
  );
}

/**
 * Category Popup Modal
 * Now allows toggling upgrades regardless of package - auto-switches to Custom mode
 */
function CategoryPopup({ category, upgrades, selectedModules, onToggle, onClose, onInfoClick, isCustomMode, allUpgrades }) {
  const popupRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  // Helper to get upgrade name by key
  const getUpgradeName = useCallback((key) => {
    const upgrade = allUpgrades?.find(u => u.key === key);
    return upgrade?.name || key;
  }, [allUpgrades]);
  
  // Check which upgrades would be replaced for each unselected upgrade
  // Fixed: use conflictsWith instead of conflictingUpgrades
  const getReplacementInfo = useCallback((upgradeKey) => {
    if (selectedModules.includes(upgradeKey)) return null;
    
    try {
      const conflict = checkUpgradeConflict(upgradeKey, selectedModules);
      if (!conflict) return null;
      
      // Use conflictsWith (the correct property name from checkUpgradeConflict)
      const conflictingKeys = conflict.conflictsWith || [];
      
      return {
        ...conflict,
        conflictingUpgrades: conflictingKeys,
        names: conflictingKeys.map(key => getUpgradeName(key)),
      };
    } catch {
      // Defensive: if conflict detection fails, return null
      return null;
    }
  }, [selectedModules, getUpgradeName]);
  
  const Icon = category.icon;
  
  return (
    <div className={styles.popupOverlay}>
      <div className={styles.categoryPopup} ref={popupRef} style={{ '--cat-color': category.color }}>
        <div className={styles.popupHeader}>
          <div className={styles.popupTitle}>
            <Icon size={16} />
            <span>{category.label}</span>
            <span className={styles.popupCount}>{upgrades.length}</span>
          </div>
          <button className={styles.popupClose} onClick={onClose}><Icons.x size={14} /></button>
        </div>
        <div className={styles.popupContent}>
          {upgrades.map(upgrade => {
            const isSelected = selectedModules.includes(upgrade.key);
            const replacementInfo = !isSelected ? getReplacementInfo(upgrade.key) : null;
            const hasConflict = replacementInfo !== null;
            
            return (
              <div 
                key={upgrade.key} 
                className={`${styles.upgradeRow} ${isSelected ? styles.upgradeRowSelected : ''} ${hasConflict ? styles.upgradeRowConflict : ''}`}
              >
                <button
                  type="button"
                  className={styles.upgradeToggle}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Always allow toggle - handleModuleToggle will auto-switch to Custom mode
                    onToggle(upgrade.key, upgrade.name, replacementInfo);
                  }}
                  aria-label={`${isSelected ? 'Deselect' : 'Select'} ${upgrade.name}`}
                  aria-checked={isSelected}
                  role="checkbox"
                >
                  <span className={styles.checkbox} aria-hidden="true">
                    {isSelected && <Icons.check size={10} />}
                  </span>
                  <span className={styles.upgradeName}>{upgrade.name}</span>
                  {upgrade.metricChanges?.hpGain > 0 && (
                    <span className={styles.upgradeGain}>+{upgrade.metricChanges.hpGain}hp</span>
                  )}
                </button>
                {hasConflict && (
                  <span className={styles.conflictBadge} title={`Replaces: ${replacementInfo.names.join(', ')}`}>
                    <Icons.swap size={10} />
                  </span>
                )}
                <button type="button" className={styles.learnMoreBtn} onClick={() => onInfoClick(upgrade)} aria-label={`Learn more about ${upgrade.name}`}>
                  <span>Learn more</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Upgrade Center Component
 */
export default function UpgradeCenter({ 
  car, 
  initialBuildId = null, 
  onChangeCar = null,
  onBuildSummaryUpdate = null,
  factoryConfig = null,
  onFactoryConfigChange = null,
  selectedWheelFitment = null,
  onWheelFitmentChange = null,
  openSaveModalOnMount = false,
  onSaveModalOpened = null,
}) {
  const { isAuthenticated, user } = useAuth();
  const { saveBuild, updateBuild, getBuildById, canSave } = useSavedBuilds();
  const { vehicles, applyModifications, addVehicle } = useOwnedVehicles();
  const { tierConfig } = useTierConfig();
  
  // All useState hooks must be called unconditionally (before any early returns)
  const [selectedPackage, setSelectedPackage] = useState('stock');
  const [selectedModules, setSelectedModules] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedUpgradeForModal, setSelectedUpgradeForModal] = useState(null);
  const [currentBuildId, setCurrentBuildId] = useState(initialBuildId);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [buildName, setBuildName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveToGarage, setSaveToGarage] = useState(false);
  const [selectedGarageVehicle, setSelectedGarageVehicle] = useState(null);
  const [conflictNotification, setConflictNotification] = useState(null);
  const [isAddingToGarage, setIsAddingToGarage] = useState(false);
  const [vehicleAddedSuccess, setVehicleAddedSuccess] = useState(false);

  // Selected parts for builds (loaded from saved builds, UI removed)
  const [selectedParts, setSelectedParts] = useState([]);
  
  // Build photos - stored separately and linked to build ID
  const [buildImages, setBuildImages] = useState([]);
  
  // Track if current build has a linked community post
  const [linkedCommunityPost, setLinkedCommunityPost] = useState(null);
  const [checkingCommunityPost, setCheckingCommunityPost] = useState(false);
  
  // Toggle for whether to share to / keep in community when saving
  const [shareToNewCommunity, setShareToNewCommunity] = useState(false);
  
  // Separate community title (public name like "My Stormtrooper") from build name (internal)
  const [communityTitle, setCommunityTitle] = useState('');
  
  // Video player state
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Defensive: use safe car slug for effects - prevents crashes if car is undefined
  const safeCarSlug = car?.slug || '';

  // Reset upgrade state when car changes
  useEffect(() => {
    setSelectedModules([]);
    setSelectedPackage('stock');
    setCurrentBuildId(null);
    setActiveCategory(null);
  }, [safeCarSlug]);
  
  // Load initial build if provided
  useEffect(() => {
    if (initialBuildId && safeCarSlug) {
      const build = getBuildById(initialBuildId);
      if (build && build.carSlug === safeCarSlug) {
        setSelectedModules(build.upgrades || []);
        setSelectedParts(build.parts || build.selectedParts || []);
        setSelectedPackage('custom');
        setCurrentBuildId(initialBuildId);
        // Load saved build name
        if (build.name) {
          setBuildName(build.name);
        }
      }
    }
  }, [initialBuildId, getBuildById, safeCarSlug]);
  
  // Load build images when build ID changes
  useEffect(() => {
    async function loadBuildImages() {
      if (!currentBuildId || !supabase) {
        setBuildImages([]);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('user_uploaded_images')
          .select('id, blob_url, thumbnail_url, caption, is_primary, display_order, width, height, media_type, duration_seconds, video_thumbnail_url')
          .eq('user_build_id', currentBuildId)
          .order('is_primary', { ascending: false })
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('[UpgradeCenter] Error loading build images:', error);
          return;
        }
        
        setBuildImages(data || []);
      } catch (err) {
        console.error('[UpgradeCenter] Error loading build images:', err);
      }
    }
    
    loadBuildImages();
  }, [currentBuildId]);

  // Check if current build has a linked community post
  useEffect(() => {
    async function checkLinkedPost() {
      if (!currentBuildId || !supabase) {
        setLinkedCommunityPost(null);
        return;
      }
      
      setCheckingCommunityPost(true);
      try {
        const { data, error } = await supabase
          .from('community_posts')
          .select('id, slug, title, is_published')
          .eq('user_build_id', currentBuildId)
          .maybeSingle();
        
        if (!error && data) {
          setLinkedCommunityPost(data);
          setShareToNewCommunity(data.is_published !== false); // Default to keeping shared
          // Load community title from existing post
          if (data.title) {
            setCommunityTitle(data.title);
          }
        } else {
          setLinkedCommunityPost(null);
          setShareToNewCommunity(false); // Default off for new builds
          setCommunityTitle(''); // Reset community title
        }
      } catch (err) {
        console.error('[UpgradeCenter] Error checking linked community post:', err);
        setLinkedCommunityPost(null);
      } finally {
        setCheckingCommunityPost(false);
      }
    }
    
    checkLinkedPost();
  }, [currentBuildId]);
  
  // Open save modal on mount if requested (e.g., from Projects share button)
  // This unifies sharing through the save modal's community toggle
  useEffect(() => {
    if (openSaveModalOnMount && currentBuildId && !checkingCommunityPost) {
      // Set default build name if not already set
      if (!buildName && car) {
        setBuildName(`${car.name} Build`);
      }
      setShowSaveModal(true);
      // Notify parent that modal has been opened
      onSaveModalOpened?.();
    }
  }, [openSaveModalOnMount, currentBuildId, checkingCommunityPost, buildName, car, onSaveModalOpened]);
  
  // Guard: return empty upgrades structure if no car
  const availableUpgrades = useMemo(() => {
    if (!car) return { packages: [], modulesByCategory: {} };
    return getAvailableUpgrades(car);
  }, [car]);
  
  const packageUpgrades = useMemo(() => {
    if (selectedPackage === 'stock') return [];
    if (selectedPackage === 'custom') return selectedModules;
    const pkg = availableUpgrades.packages?.find(p => p.key === selectedPackage);
    return pkg?.includedUpgradeKeys || [];
  }, [selectedPackage, selectedModules, availableUpgrades.packages]);
  
  const effectiveModules = useMemo(() => {
    if (selectedPackage === 'stock') return [];
    if (selectedPackage === 'custom') return selectedModules;
    return packageUpgrades;
  }, [selectedPackage, selectedModules, packageUpgrades]);
  
  // Guard: return safe defaults if no car
  const profile = useMemo(() => {
    if (!car) {
      return {
        stockMetrics: { hp: 0, zeroToSixty: 0, braking60To0: 0, lateralG: 0 },
        upgradedMetrics: { hp: 0, zeroToSixty: 0, braking60To0: 0, lateralG: 0 },
        stockScores: { drivability: 0, reliabilityHeat: 0, soundEmotion: 0 },
        upgradedScores: { drivability: 0, reliabilityHeat: 0, soundEmotion: 0 },
        selectedUpgrades: [],
      };
    }
    const baseProfile = getPerformanceProfile(car, effectiveModules);
    
    // Apply tire compound grip bonus to lateralG
    const tireGripBonus = selectedWheelFitment?.gripBonus || 0;
    if (tireGripBonus > 0 && baseProfile.upgradedMetrics.lateralG) {
      baseProfile.upgradedMetrics = {
        ...baseProfile.upgradedMetrics,
        lateralG: Math.min(1.6, baseProfile.upgradedMetrics.lateralG + tireGripBonus),
      };
      // Also slightly improve braking with better grip
      if (baseProfile.upgradedMetrics.braking60To0) {
        const brakingImprovement = tireGripBonus * 5; // ~5ft improvement per 0.1g grip
        baseProfile.upgradedMetrics.braking60To0 = Math.max(
          85, // minimum realistic braking distance
          baseProfile.upgradedMetrics.braking60To0 - brakingImprovement
        );
      }
    }
    
    return baseProfile;
  }, [car, effectiveModules, selectedWheelFitment]);
  
  const totalCost = useMemo(() => {
    if (!car) return { low: 0, high: 0, confidence: 'estimated', confidencePercent: 0 };
    return calculateTotalCost(profile.selectedUpgrades, car);
  }, [profile.selectedUpgrades, car]);
  
  const hpGain = profile.upgradedMetrics.hp - profile.stockMetrics.hp;
  // Show upgrades if any package selected OR if tire compound affects grip
  const tireGripBonus = selectedWheelFitment?.gripBonus || 0;
  const hasUpgradeEffects = selectedPackage !== 'stock' || tireGripBonus > 0;
  const showUpgrade = hasUpgradeEffects;
  const isCustomMode = selectedPackage === 'custom';
  
  // Tunability & Recommendations (with guards for missing car)
  const tunability = useMemo(() => {
    if (!car) return { score: 0, label: 'Unknown' };
    return calculateTunability(car);
  }, [car]);
  
  const detailedRecommendation = useMemo(() => {
    return generateDetailedRecommendation(car, profile.stockMetrics, selectedPackage);
  }, [car, profile.stockMetrics, selectedPackage]);
  
  const upgradesByCategory = useMemo(() => {
    const result = {};
    UPGRADE_CATEGORIES.forEach(cat => {
      const modules = availableUpgrades.modulesByCategory?.[cat.key] || [];
      result[cat.key] = modules;
    });
    return result;
  }, [availableUpgrades.modulesByCategory]);
  
  const selectedByCategory = useMemo(() => {
    const result = {};
    UPGRADE_CATEGORIES.forEach(cat => {
      const categoryUpgrades = upgradesByCategory[cat.key] || [];
      result[cat.key] = categoryUpgrades.filter(u => effectiveModules.includes(u.key)).length;
    });
    return result;
  }, [upgradesByCategory, effectiveModules]);
  
  // Notify parent of build summary changes
  useEffect(() => {
    if (onBuildSummaryUpdate) {
      const upgradesArray = profile.selectedUpgrades.map(key => {
        const upgrade = getUpgradeByKey(key);
        return {
          key,
          name: upgrade?.name || key,
          hpGain: upgrade?.hp || 0,
          cost: upgrade?.costLow || 0,
          category: upgrade?.category || 'other',
        };
      });
      
      onBuildSummaryUpdate({
        totalHpGain: hpGain,
        totalTqGain: 0, // Could be calculated if available
        totalCost: totalCost.low || 0,
        upgradeCount: profile.selectedUpgrades.length,
        selectedUpgrades: upgradesArray,
      });
    }
  }, [onBuildSummaryUpdate, hpGain, totalCost.low, profile.selectedUpgrades]);
  
  // Listen for save/clear events from BuildSummaryBar
  useEffect(() => {
    const handleSaveEvent = () => {
      if (profile.selectedUpgrades.length > 0) {
        setShowSaveModal(true);
      }
    };
    
    const handleClearEvent = () => {
      setSelectedPackage('stock');
      setSelectedModules([]);
    };
    
    document.addEventListener('tuning-shop:save-build', handleSaveEvent);
    document.addEventListener('tuning-shop:clear-build', handleClearEvent);
    
    return () => {
      document.removeEventListener('tuning-shop:save-build', handleSaveEvent);
      document.removeEventListener('tuning-shop:clear-build', handleClearEvent);
    };
  }, [profile.selectedUpgrades.length]);
  
  // Flatten all upgrades for name lookups
  const allUpgradesFlat = useMemo(() => {
    return Object.values(upgradesByCategory).flat();
  }, [upgradesByCategory]);
  
  const handlePackageSelect = (pkgKey) => {
    setSelectedPackage(pkgKey);
    if (pkgKey !== 'custom') setSelectedModules([]);
  };
  
  const handleModuleToggle = useCallback((moduleKey, moduleName, replacementInfo) => {
    // When switching from a package to Custom, preserve the package's upgrades
    const switchingToCustom = !isCustomMode;
    
    setSelectedModules(prev => {
      // If switching from a package, start with the package's upgrades instead of empty array
      let baseModules = switchingToCustom && packageUpgrades.length > 0 
        ? [...packageUpgrades] 
        : [...prev];
      
      // If already selected, remove it
      if (baseModules.includes(moduleKey)) {
        return baseModules.filter(k => k !== moduleKey);
      }
      
      // Check for conflicts and resolve them
      if (replacementInfo && replacementInfo.conflictingUpgrades?.length > 0) {
        const replacedNames = replacementInfo.names?.join(' and ') || '';
        if (replacedNames) {
          setConflictNotification({
            message: `"${replacedNames}" has been replaced with "${moduleName}"`,
            replacedUpgrade: replacedNames,
          });
        }
        
        // Remove conflicting upgrades and add the new one
        const conflictingKeys = replacementInfo.conflictingUpgrades || [];
        baseModules = baseModules.filter(k => !conflictingKeys.includes(k));
      }
      
      return [...baseModules, moduleKey];
    });
    
    // Switch to custom mode after updating modules
    if (switchingToCustom) {
      setSelectedPackage('custom');
    }
  }, [isCustomMode, packageUpgrades]);
  
  const handleSaveBuild = async () => {
    if (!canSave) { setSaveError('Please sign in'); return; }
    if (!buildName.trim()) { setSaveError('Enter a build name'); return; }
    if (shareToNewCommunity && !communityTitle.trim() && !buildName.trim()) { 
      setSaveError('Enter a community title'); return; 
    }
    if (saveToGarage && !selectedGarageVehicle) { setSaveError('Select a vehicle from your garage'); return; }
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      const buildData = {
        carSlug: car.slug,
        carName: car.name,
        name: buildName.trim(),
        selectedUpgrades: effectiveModules,
        selectedParts,
        totalHpGain: hpGain,
        totalCostLow: totalCost.low,
        totalCostHigh: totalCost.high,
        finalHp: profile.upgradedMetrics.hp,
        selectedPackage,
        // Include factory configuration and wheel fitment from props
        factoryConfig: factoryConfig || null,
        wheelFitment: selectedWheelFitment || null,
        // Note: Hero image is now stored as is_primary on user_uploaded_images
      };
      
      const result = currentBuildId 
        ? await updateBuild(currentBuildId, buildData)
        : await saveBuild(buildData);
      
      if (result.error) {
        setSaveError(result.error.message || 'Failed to save');
      } else {
        const savedBuildId = result.data?.id || currentBuildId;
        
        // Link uploaded images to the new build (if any were uploaded before saving)
        // This ensures images uploaded on phone show up when viewing on desktop
        if (savedBuildId && buildImages.length > 0) {
          const unlinkedImages = buildImages.filter(img => !img.user_build_id);
          if (unlinkedImages.length > 0) {
            try {
              const linkResponse = await fetch('/api/uploads', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageIds: unlinkedImages.map(img => img.id),
                  buildId: savedBuildId,
                }),
              });
              
              if (linkResponse.ok) {
                console.log(`[UpgradeCenter] Linked ${unlinkedImages.length} images to build ${savedBuildId}`);
                // Update local state to reflect the link
                setBuildImages(prev => prev.map(img => ({
                  ...img,
                  user_build_id: savedBuildId,
                })));
              } else {
                console.error('[UpgradeCenter] Failed to link images to build');
              }
            } catch (err) {
              console.error('[UpgradeCenter] Error linking images:', err);
            }
          }
        }
        
        // If saving to garage, apply the modifications to the selected vehicle
        if (saveToGarage && selectedGarageVehicle && savedBuildId) {
          const modResult = await applyModifications(selectedGarageVehicle, {
            upgrades: effectiveModules,
            totalHpGain: hpGain,
            buildId: savedBuildId,
          });
          
          if (modResult.error) {
            setSaveError('Project saved but failed to apply to garage vehicle');
          }
        }
        
        // Handle community post based on toggle state
        if (linkedCommunityPost && !shareToNewCommunity) {
          // Unpublish existing post via API (includes cache invalidation)
          try {
            const response = await fetch('/api/community/posts', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postId: linkedCommunityPost.id,
                isPublished: false,
              }),
            });
            
            if (response.ok) {
              // Clear the linked post since it's now unpublished
              setLinkedCommunityPost(null);
            } else {
              console.error('[UpgradeCenter] Error unpublishing community post');
            }
          } catch (err) {
            console.error('[UpgradeCenter] Error unpublishing community post:', err);
          }
        } else if (!linkedCommunityPost && shareToNewCommunity && savedBuildId) {
          // Create new community post - use communityTitle or fall back to buildName
          const postTitle = (communityTitle || buildName).trim();
          try {
            const response = await fetch('/api/community/posts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postType: 'build',
                title: postTitle,
                description: '',
                buildId: savedBuildId,
                carSlug: car.slug,
                carName: car.name,
                imageIds: [], // Will use images already linked to build
              }),
            });
            
            if (response.ok) {
              const postData = await response.json();
              console.log('[UpgradeCenter] Created community post:', postData);
              // Will be loaded on next check
            } else {
              console.error('[UpgradeCenter] Error creating community post');
            }
          } catch (err) {
            console.error('[UpgradeCenter] Error creating community post:', err);
          }
        } else if (linkedCommunityPost && shareToNewCommunity) {
          // Update existing post via API (includes cache invalidation)
          // Also update title if user changed it
          const postTitle = (communityTitle || buildName).trim();
          try {
            await fetch('/api/community/posts', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postId: linkedCommunityPost.id,
                isPublished: true,
                title: postTitle, // Update title in case user changed it
              }),
            });
          } catch (err) {
            console.error('[UpgradeCenter] Error updating community post:', err);
          }
        }
        
        if (result.data && !currentBuildId) setCurrentBuildId(savedBuildId);
        setShowSaveModal(false);
        setBuildName('');
        setSaveToGarage(false);
        setSelectedGarageVehicle(null);
        setVehicleAddedSuccess(false);
        setSelectedGarageVehicle(null);
      }
    } catch {
      setSaveError('Error saving build');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Early return AFTER all hooks to satisfy React Rules of Hooks
  // This ensures hooks are called in the same order on every render
  if (!car || !safeCarSlug) {
    console.warn('[UpgradeCenter] Missing or invalid car prop');
    return (
      <div className={styles.section}>
        <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '40px' }}>
          Unable to load upgrade center. Please select a car.
        </p>
        {onChangeCar && (
          <button 
            onClick={onChangeCar}
            style={{ 
              margin: '0 auto', 
              display: 'block', 
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #d4af37, #b8973a)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Select a Car
          </button>
        )}
      </div>
    );
  }

  const tierInfo = tierConfig[car.tier] || {};
  const activeCategoryData = UPGRADE_CATEGORIES.find(c => c.key === activeCategory);
  
  // Get user's selected hero image (is_primary = true) or fall back to stock
  const userHeroImage = buildImages.find(img => img.is_primary && img.media_type !== 'video');
  const hasCustomHero = !!userHeroImage;
  
  return (
    <div className={styles.upgradeCenter}>
      {/* Vehicle Hero Section - Large, Prominent Display */}
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          {/* Hero Image - Show user's selected hero if available, otherwise stock */}
          <div className={styles.heroImageContainer}>
            {hasCustomHero ? (
              <Image
                src={userHeroImage.blob_url || userHeroImage.thumbnail_url}
                alt={`${car.name} - Your Photo`}
                fill
                style={{ objectFit: 'cover' }}
                priority
              />
            ) : (
              <CarImage car={car} variant="hero" showName={false} priority />
            )}
            <div className={styles.heroImageOverlay} />
          </div>
          
          {/* Hero Info */}
          <div className={styles.heroInfo}>
            <div className={styles.heroHeader}>
              <div className={styles.heroTitleGroup}>
                <div className={styles.heroYear}>{car.years || car.year || '2024'}</div>
                <h1 className={styles.heroName}>{car.name}</h1>
                <div className={styles.heroSubtitle}>
                  <span>{car.hp} hp</span>
                  <span>{car.drivetrain || 'RWD'}</span>
                  <span>{car.engine || 'Gasoline'}</span>
                </div>
              </div>
              {/* Tunability Score - Top Right */}
              <div className={styles.tunabilityBadge} style={{ '--score-color': getTunabilityColor(tunability.score) }}>
                <span className={styles.tunabilityScore}>{tunability.score}/10</span>
                <span className={styles.tunabilityLabel}>Tunability Score</span>
              </div>
            </div>
            
            {/* Quick Stats Grid */}
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>{car.hp || 'N/A'}</span>
                <span className={styles.heroStatLabel}>Stock HP</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue} style={{ color: '#10b981' }}>+{hpGain}</span>
                <span className={styles.heroStatLabel}>HP Gain</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>{profile.upgradedMetrics.hp}</span>
                <span className={styles.heroStatLabel}>Final HP</span>
              </div>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>${(totalCost.low || 0).toLocaleString()}</span>
                <span className={styles.heroStatLabel}>Est. Cost</span>
              </div>
            </div>
            
            {/* AutoRev Recommendation - Integrated */}
            <div className={styles.recommendationBanner}>
              <div className={styles.recommendationHeader}>
                <span className={styles.recommendationTitle}>AutoRev Recommendation</span>
                {detailedRecommendation.focusArea && (
                  <span className={styles.focusTag}>Focus: {detailedRecommendation.focusArea}</span>
                )}
              </div>
              <p className={styles.recommendationText}>{detailedRecommendation.primaryText}</p>
              
              {/* Platform Insights & Watch Outs - Side by Side */}
              {(detailedRecommendation.platformInsights.length > 0 || detailedRecommendation.watchOuts.length > 0) && (
                <div className={styles.insightsGrid}>
                  {detailedRecommendation.platformInsights.length > 0 && (
                    <div className={styles.insightsCard}>
                      <div className={styles.insightsCardHeader}>
                        <Icons.info size={14} />
                        <span>Platform Insights</span>
                      </div>
                      <ul className={styles.insightsCardList}>
                        {detailedRecommendation.platformInsights.map((insight, idx) => (
                          <li key={idx}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {detailedRecommendation.watchOuts.length > 0 && (
                    <div className={styles.watchOutsCard}>
                      <div className={styles.watchOutsCardHeader}>
                        <Icons.alertTriangle size={14} />
                        <span>Watch Out</span>
                      </div>
                      <ul className={styles.watchOutsCardList}>
                        {detailedRecommendation.watchOuts.map((watchOut, idx) => (
                          <li key={idx}>{watchOut}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Vehicle Configuration Section - Factory Config & Wheels */}
      <div className={styles.configSection}>
        <div className={styles.configCard}>
          <FactoryConfig
            car={car}
            initialConfig={factoryConfig}
            onChange={onFactoryConfigChange}
            defaultExpanded={true}
            compact={false}
          />
        </div>
        <div className={styles.configCard}>
          <WheelTireConfigurator
            car={car}
            selectedFitment={selectedWheelFitment}
            onSelect={onWheelFitmentChange}
            showCostEstimates={true}
            defaultExpanded={true}
            compact={false}
            selectedUpgrades={effectiveModules}
            onUpgradeToggle={(key) => handleModuleToggle(key, 'Lightweight Wheels', null)}
          />
        </div>
      </div>
      
      {/* Modification Workspace - Build Presets, Categories & Performance */}
      <div className={styles.workspace}>
        {/* Left Sidebar - Build Configuration */}
        <div className={styles.sidebar}>
          {/* Build Presets Card */}
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarCardHeader}>
              <Icons.settings size={16} />
              <span className={styles.sidebarCardTitle}>Build Preset</span>
            </div>
            <div className={styles.sidebarCardContent}>
              <div className={styles.packageGrid}>
                {PACKAGES.map(pkg => (
                  <button
                    key={pkg.key}
                    className={`${styles.pkgBtn} ${selectedPackage === pkg.key ? styles.pkgBtnActive : ''}`}
                    onClick={() => handlePackageSelect(pkg.key)}
                  >
                    {pkg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Upgrade Categories Card */}
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarCardHeader}>
              <Icons.bolt size={16} />
              <span className={styles.sidebarCardTitle}>Upgrade Categories</span>
            </div>
            <div className={styles.sidebarCardContent}>
              <div className={styles.categoryList}>
                {UPGRADE_CATEGORIES.filter(cat => 
                  // Skip wheels category - its upgrade is in WheelTireConfigurator
                  cat.key !== 'wheels' && 
                  (upgradesByCategory[cat.key]?.length || 0) > 0
                ).map(cat => {
                  const Icon = cat.icon;
                  const count = selectedByCategory[cat.key] || 0;
                  const totalAvailable = upgradesByCategory[cat.key]?.length || 0;
                  
                  return (
                    <button
                      key={cat.key}
                      className={`${styles.catBtn} ${activeCategory === cat.key ? styles.catBtnActive : ''}`}
                      onClick={() => setActiveCategory(cat.key)}
                      style={{ '--cat-color': cat.color }}
                    >
                      <Icon size={16} />
                      <span>{cat.label}</span>
                      {count > 0 && (
                        <span className={styles.catBadge}>{count}</span>
                      )}
                      <Icons.chevronRight size={14} className={styles.catArrow} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
        </div>
        
        {/* Main Panel - Performance Metrics */}
        <div className={styles.mainPanel}>
          {/* Performance Card */}
          <div className={styles.performanceCard}>
            <div className={styles.performanceHeader}>
              <h3 className={styles.performanceTitle}>
                <Icons.bolt size={18} />
                Performance Metrics
              </h3>
              {showUpgrade && (
                <div className={styles.buildStats}>
                  <span 
                    className={`${styles.costBadge} ${totalCost.confidence === 'verified' ? styles.costVerified : totalCost.confidence === 'high' ? styles.costHigh : styles.costEstimated}`}
                    title={`${totalCost.confidence === 'verified' ? 'Verified pricing' : totalCost.confidence === 'high' ? 'High confidence estimate' : 'Estimated pricing'}`}
                  >
                    ${(totalCost.low || 0).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            <div className={styles.performanceMetrics}>
              <MetricRow 
                icon={Icons.bolt} 
                label="HP" 
                stockValue={profile.stockMetrics.hp} 
                upgradedValue={profile.upgradedMetrics.hp} 
                unit=" hp" 
              />
              <MetricRow 
                icon={Icons.stopwatch} 
                label="0-60" 
                stockValue={profile.stockMetrics.zeroToSixty} 
                upgradedValue={profile.upgradedMetrics.zeroToSixty} 
                unit="s" 
                isLowerBetter 
              />
              <MetricRow 
                icon={Icons.disc} 
                label="Braking" 
                stockValue={profile.stockMetrics.braking60To0} 
                upgradedValue={profile.upgradedMetrics.braking60To0} 
                unit="ft" 
                isLowerBetter 
              />
              <MetricRow 
                icon={Icons.target} 
                label="Grip" 
                stockValue={profile.stockMetrics.lateralG} 
                upgradedValue={profile.upgradedMetrics.lateralG} 
                unit="g" 
              />
            </div>
          </div>
          
          {/* Experience Scores */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Experience Scores</h4>
            <ScoreBar label="Comfort" stockScore={profile?.stockScores?.drivability ?? 7} upgradedScore={profile?.upgradedScores?.drivability ?? 7} />
            <ScoreBar label="Reliability" stockScore={profile?.stockScores?.reliabilityHeat ?? 7.5} upgradedScore={profile?.upgradedScores?.reliabilityHeat ?? 7.5} />
            <ScoreBar label="Sound" stockScore={profile?.stockScores?.soundEmotion ?? 8} upgradedScore={profile?.upgradedScores?.soundEmotion ?? 8} />
          </div>
          
          {/* Build Photos & Videos Section */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <Icons.camera size={14} />
              Build Photos & Videos
            </h4>
            <p className={styles.sectionHint}>
              Add photos and videos of your build. Choose which image to feature as your hero.
            </p>
            
            {/* Upload Component - previews disabled since BuildMediaGallery handles display */}
            <ImageUploader
              onUploadComplete={async (media) => {
                setBuildImages(media);
                // If this is the first uploaded image, auto-set it as hero (is_primary)
                const images = media.filter(m => m.media_type !== 'video');
                const hasHero = images.some(img => img.is_primary);
                if (images.length === 1 && !hasHero) {
                  // Auto-set first image as hero
                  try {
                    const response = await fetch('/api/uploads', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ imageId: images[0].id, isPrimary: true }),
                    });
                    if (response.ok) {
                      setBuildImages(prev => prev.map(img => ({
                        ...img,
                        is_primary: img.id === images[0].id,
                      })));
                    }
                  } catch (err) {
                    console.error('[UpgradeCenter] Error auto-setting hero:', err);
                  }
                }
              }}
              onUploadError={(err) => console.error('[UpgradeCenter] Media upload error:', err)}
              onVideoClick={(video) => setSelectedVideo(video)}
              maxFiles={10}
              buildId={currentBuildId}
              existingImages={buildImages}
              disabled={!user}
              showPreviews={false}
            />
            
            {/* Gallery with Hero Selection - tap any image to make it the hero */}
            <BuildMediaGallery
              car={car}
              media={buildImages}
              onVideoClick={(video) => setSelectedVideo(video)}
              onSetPrimary={async (imageId) => {
                // Update primary in database - this sets is_primary = true for selected, false for others
                try {
                  const response = await fetch('/api/uploads', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageId, isPrimary: true }),
                  });
                  if (response.ok) {
                    // Update local state - the selected image becomes hero, shown at top
                    setBuildImages(prev => prev.map(img => ({
                      ...img,
                      is_primary: img.id === imageId,
                    })));
                  }
                } catch (err) {
                  console.error('[UpgradeCenter] Error setting hero image:', err);
                }
              }}
              onSetStockHero={async () => {
                // Clear is_primary on all images to revert to stock hero
                try {
                  // Clear primary on all images for this build
                  for (const img of buildImages.filter(i => i.is_primary)) {
                    await fetch('/api/uploads', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ imageId: img.id, isPrimary: false }),
                    });
                  }
                  // Update local state
                  setBuildImages(prev => prev.map(img => ({
                    ...img,
                    is_primary: false,
                  })));
                } catch (err) {
                  console.error('[UpgradeCenter] Error setting stock hero:', err);
                }
              }}
              readOnly={!user}
            />
            
            {!user && (
              <p className={styles.loginHint}>
                Sign in to upload photos and videos of your build
              </p>
            )}
          </div>
          
          {/* Parts Shopping List - Based on selected upgrades */}
          {effectiveModules.length > 0 && (
            <PartsSelector
              selectedUpgrades={effectiveModules}
              selectedParts={selectedParts}
              onPartsChange={setSelectedParts}
              carName={car?.name}
              carSlug={car?.slug}
              totalHpGain={hpGain}
              totalCostRange={{ low: totalCost.low, high: totalCost.high }}
            />
          )}
        </div>
      </div>
      
      {/* Save Build Button - Outside workspace for proper fixed positioning on mobile */}
      <button
        className={styles.saveBtn}
        onClick={() => { 
          // Use existing build name if editing, otherwise default to car name
          if (!buildName) {
            setBuildName(`${car.name} Build`);
          }
          setShowSaveModal(true); 
        }}
        disabled={!showUpgrade}
      >
        <Icons.save size={16} />
        <span>Save Build</span>
      </button>
      
      {/* Popups */}
      {activeCategory && activeCategoryData && (
        <CategoryPopup
          category={activeCategoryData}
          upgrades={upgradesByCategory[activeCategory] || []}
          selectedModules={effectiveModules}
          onToggle={handleModuleToggle}
          onClose={() => setActiveCategory(null)}
          onInfoClick={(u) => setSelectedUpgradeForModal(getUpgradeByKey(u.key) || u)}
          isCustomMode={isCustomMode}
          allUpgrades={allUpgradesFlat}
        />
      )}
      
      {conflictNotification && (
        <ConflictNotification
          message={conflictNotification.message}
          replacedUpgrade={conflictNotification.replacedUpgrade}
          onDismiss={() => setConflictNotification(null)}
        />
      )}
      
      {selectedUpgradeForModal && (
        <UpgradeDetailModal
          upgrade={selectedUpgradeForModal}
          onClose={() => setSelectedUpgradeForModal(null)}
          showAddToBuild={false}
        />
      )}
      
      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          autoPlay={true}
        />
      )}
      
      {showSaveModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSaveModal(false)}>
          <div className={styles.saveModal} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.saveModalHeader}>
              <div className={styles.saveModalTitleGroup}>
                <Icons.save size={20} className={styles.saveModalIcon} />
                <h3 className={styles.saveModalTitle}>Save Build</h3>
              </div>
              <button className={styles.saveModalClose} onClick={() => setShowSaveModal(false)}>
                <Icons.x size={16} />
              </button>
            </div>
            
            {/* Body */}
            <div className={styles.saveModalBody}>
              {/* Build Name Input */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Build Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={buildName}
                  onChange={e => setBuildName(e.target.value)}
                  placeholder="e.g., Street Build, Track Setup"
                  autoFocus
                />
              </div>
              
              {/* Build Summary */}
              <div className={styles.buildSummaryCard}>
                <div className={styles.buildSummaryRow}>
                  <span className={styles.buildSummaryLabel}>Vehicle</span>
                  <span className={styles.buildSummaryValue}>{car?.name}</span>
                </div>
                <div className={styles.buildSummaryRow}>
                  <span className={styles.buildSummaryLabel}>Upgrades</span>
                  <span className={styles.buildSummaryValue}>{effectiveModules.length} selected</span>
                </div>
                {hpGain > 0 && (
                  <div className={styles.buildSummaryRow}>
                    <span className={styles.buildSummaryLabel}>HP Gain</span>
                    <span className={styles.buildSummaryValueGain}>+{hpGain} hp</span>
                  </div>
                )}
                <div className={styles.buildSummaryRow}>
                  <span className={styles.buildSummaryLabel}>Est. Cost</span>
                  <span className={styles.buildSummaryValue}>${(totalCost.low || 0).toLocaleString()}</span>
                </div>
              </div>
              
              {/* Save to Garage Option - Always show */}
              <div className={styles.garageOptionSection}>
                <label className={styles.garageCheckboxLabel} onClick={() => setSaveToGarage(!saveToGarage)}>
                  <div className={`${styles.customCheckbox} ${saveToGarage ? styles.customCheckboxChecked : ''}`}>
                    {saveToGarage && <Icons.check size={12} />}
                  </div>
                  <span>Apply to a vehicle in my garage</span>
                </label>
                
                {saveToGarage && (() => {
                  const matchingVehicles = vehicles?.filter(v => v.matchedCarSlug === car.slug) || [];
                  
                  // Show select if we have matching vehicles OR if we already selected one (just added)
                  if (matchingVehicles.length > 0 || selectedGarageVehicle) {
                    return (
                      <>
                        <select
                          className={styles.garageVehicleSelect}
                          value={selectedGarageVehicle || ''}
                          onChange={(e) => setSelectedGarageVehicle(e.target.value)}
                        >
                          <option value="">Select vehicle...</option>
                          {matchingVehicles.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.nickname || `${v.year} ${v.make} ${v.model}`}
                              {v.trim ? ` ${v.trim}` : ''}
                            </option>
                          ))}
                          {/* If selectedGarageVehicle is set but not in the list yet, show it */}
                          {selectedGarageVehicle && !matchingVehicles.find(v => v.id === selectedGarageVehicle) && (
                            <option value={selectedGarageVehicle}>
                              {car.year} {car.make} {car.model} (just added)
                            </option>
                          )}
                        </select>
                        {vehicleAddedSuccess && (
                          <div className={styles.vehicleAddedSuccess}>
                            <Icons.check size={12} />
                            Vehicle added to garage!
                          </div>
                        )}
                      </>
                    );
                  }
                  
                  // No matching vehicles - show add button
                  return (
                    <div className={styles.addToGaragePrompt}>
                      <p className={styles.addToGarageText}>
                        No {car.name} in your garage yet
                      </p>
                      <button
                        className={styles.addToGarageBtn}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsAddingToGarage(true);
                          setSaveError(null);
                          try {
                            // Parse year from car.years field (e.g., "2017-2024")
                            const yearMatch = car.years?.match(/(\d{4})/);
                            const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
                            
                            // Extract make and model from car.name (e.g., "Nissan GT-R")
                            let make = '';
                            let model = car.name || '';
                            
                            // Handle Porsche models that start with numbers
                            if (car.name?.startsWith('718') || car.name?.startsWith('911') || 
                                car.name?.startsWith('981') || car.name?.startsWith('997') || 
                                car.name?.startsWith('987') || car.name?.startsWith('991') || 
                                car.name?.startsWith('992')) {
                              make = 'Porsche';
                            } else if (car.name) {
                              const parts = car.name.split(' ');
                              make = parts[0] || '';
                              model = parts.slice(1).join(' ') || car.name;
                            }
                            
                            const newVehicle = {
                              year,
                              make,
                              model,
                              matchedCarSlug: car.slug,
                              nickname: '',
                            };
                            console.log('[SaveModal] Adding vehicle:', newVehicle);
                            const result = await addVehicle(newVehicle);
                            console.log('[SaveModal] Add vehicle result:', result);
                            
                            if (result?.error) {
                              setSaveError(result.error.message || 'Failed to add vehicle');
                            } else if (result?.data) {
                              const vehicleId = result.data.id;
                              console.log('[SaveModal] Setting selected vehicle:', vehicleId);
                              setSelectedGarageVehicle(vehicleId);
                              setVehicleAddedSuccess(true);
                              // Clear success after 3 seconds
                              setTimeout(() => setVehicleAddedSuccess(false), 3000);
                            } else {
                              setSaveError('Vehicle added but no ID returned');
                            }
                          } catch (err) {
                            console.error('[SaveModal] Failed to add vehicle:', err);
                            setSaveError('Failed to add vehicle to garage');
                          }
                          setIsAddingToGarage(false);
                        }}
                        disabled={isAddingToGarage}
                        type="button"
                      >
                        {isAddingToGarage ? (
                          <>
                            <span className={styles.savingSpinner} />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Icons.plus size={14} />
                            Add {car.name} to Garage
                          </>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </div>
              
              {/* Community Sharing Toggle - Always show */}
              <div className={styles.communityToggleSection}>
                <div className={styles.communityToggleRow}>
                  <div className={styles.communityToggleInfo}>
                    <Icons.globe size={16} />
                    <div className={styles.communityToggleText}>
                      <span className={styles.communityToggleLabel}>
                        {linkedCommunityPost ? 'Shared to Community' : 'Share to Community'}
                      </span>
                      {linkedCommunityPost && (
                        <a 
                          href={`/community/builds/${linkedCommunityPost.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.communityToggleLink}
                        >
                          View Post <Icons.externalLink size={10} />
                        </a>
                      )}
                      {!linkedCommunityPost && (
                        <span className={styles.communityToggleHint}>
                          Make this build visible to everyone
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    type="button"
                    className={`${styles.toggleSwitch} ${shareToNewCommunity ? styles.toggleSwitchOn : ''}`}
                    onClick={() => {
                      const newValue = !shareToNewCommunity;
                      setShareToNewCommunity(newValue);
                      // Default community title to build name if enabling and title is empty
                      if (newValue && !communityTitle) {
                        setCommunityTitle(buildName);
                      }
                    }}
                    aria-pressed={shareToNewCommunity}
                  >
                    <span className={styles.toggleKnob} />
                  </button>
                </div>
                
                {/* Community Title Input - shown when sharing is enabled */}
                {shareToNewCommunity && (
                  <div className={styles.communityTitleInput}>
                    <label className={styles.communityTitleLabel}>Community Title</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={communityTitle}
                      onChange={e => setCommunityTitle(e.target.value)}
                      placeholder="e.g., My Stormtrooper, Weekend Track Weapon"
                    />
                    <span className={styles.communityTitleHint}>
                      This is the public name shown on Community Builds
                    </span>
                  </div>
                )}
                
                {linkedCommunityPost && !shareToNewCommunity && (
                  <p className={styles.communityToggleWarning}>
                    ⚠️ This build will be removed from the community when you save.
                  </p>
                )}
              </div>
              
              {saveError && (
                <div className={styles.saveErrorMessage}>
                  <Icons.alertCircle size={14} />
                  {saveError}
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className={styles.saveModalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button 
                className={styles.confirmBtn} 
                onClick={handleSaveBuild} 
                disabled={isSaving || !buildName.trim()}
              >
                {isSaving ? (
                  <>
                    <span className={styles.savingSpinner} />
                    Saving...
                  </>
                ) : linkedCommunityPost && shareToNewCommunity ? (
                  <>
                    <Icons.save size={14} />
                    Save & Update Community Post
                  </>
                ) : linkedCommunityPost && !shareToNewCommunity ? (
                  <>
                    <Icons.save size={14} />
                    Save & Remove from Community
                  </>
                ) : shareToNewCommunity ? (
                  <>
                    <Icons.save size={14} />
                    Save & Share to Community
                  </>
                ) : (
                  <>
                    <Icons.save size={14} />
                    Save Build
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
