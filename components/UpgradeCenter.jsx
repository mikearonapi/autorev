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
import styles from './UpgradeCenter.module.css';
import {
  getPerformanceProfile,
  getAvailableUpgrades,
  calculateTotalCost,
} from '@/lib/performance.js';
import { getUpgradeByKey } from '@/lib/upgrades.js';
import { tierConfig } from '@/data/cars.js';
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
// TEMPORARILY HIDDEN: Dyno & Lap Times components hidden from UI per product decision.
// To restore, uncomment: import { DynoDataSection, LapTimesSection } from './PerformanceData';

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
  swap: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3l4 4-4 4"/>
      <path d="M20 7H4"/>
      <path d="M8 21l-4-4 4-4"/>
      <path d="M4 17h16"/>
    </svg>
  ),
};

// Package & Category configs
const PACKAGES = [
  { key: 'stock', label: 'Stock' },
  { key: 'streetSport', label: 'Street' },
  { key: 'trackPack', label: 'Track' },
  { key: 'timeAttack', label: 'Time Atk' },
  { key: 'ultimatePower', label: 'Power' },
  { key: 'custom', label: 'Custom' },
];

const UPGRADE_CATEGORIES = [
  { key: 'power', label: 'Power', icon: Icons.bolt, color: '#f59e0b' },
  { key: 'forcedInduction', label: 'Turbo/SC', icon: Icons.turbo, color: '#ef4444' },
  { key: 'chassis', label: 'Chassis', icon: Icons.target, color: '#10b981' },
  { key: 'brakes', label: 'Brakes', icon: Icons.disc, color: '#dc2626' },
  { key: 'cooling', label: 'Cooling', icon: Icons.thermometer, color: '#3b82f6' },
  { key: 'wheels', label: 'Wheels', icon: Icons.circle, color: '#8b5cf6' },
  { key: 'aero', label: 'Aero', icon: Icons.wind, color: '#06b6d4' },
  { key: 'drivetrain', label: 'Drivetrain', icon: Icons.settings, color: '#f97316' },
];

const PART_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'intake', label: 'Intake' },
  { value: 'exhaust', label: 'Exhaust' },
  { value: 'tune', label: 'Tune' },
  { value: 'forced_induction', label: 'Forced Induction' },
  { value: 'cooling', label: 'Cooling' },
  { value: 'suspension', label: 'Suspension' },
  { value: 'brakes', label: 'Brakes' },
  { value: 'wheels_tires', label: 'Wheels & Tires' },
  { value: 'aero', label: 'Aero' },
  { value: 'drivetrain', label: 'Drivetrain' },
  { value: 'fuel_system', label: 'Fuel System' },
  { value: 'engine_internal', label: 'Engine Internal' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'fluids_filters', label: 'Fluids & Filters' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
];

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
  const hasImproved = isLowerBetter ? upgradedValue < stockValue : upgradedValue > stockValue;
  const improvement = Math.abs(upgradedValue - stockValue);
  
  const formatValue = (val) => {
    if (unit === 'g') return val.toFixed(2);
    if (unit === 's') return val.toFixed(1);
    return Math.round(val);
  };
  
  const maxValues = { hp: 1200, s: 8, ft: 150, g: 1.6 };
  const maxValue = maxValues[unit === ' hp' ? 'hp' : unit] || 1200;
  
  const stockPercent = isLowerBetter 
    ? ((maxValue - stockValue) / maxValue) * 100 
    : (stockValue / maxValue) * 100;
  const upgradedPercent = isLowerBetter 
    ? ((maxValue - upgradedValue) / maxValue) * 100 
    : (upgradedValue / maxValue) * 100;
  
  return (
    <div className={styles.metricRow}>
      <div className={styles.metricHeader}>
        <span className={styles.metricLabel}><Icon size={12} />{label}</span>
        <span className={styles.metricValues}>
          {hasImproved ? (
            <>
              <span className={styles.stockVal}>{formatValue(stockValue)}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.upgradedVal}>{formatValue(upgradedValue)}{unit}</span>
              <span className={styles.gain}>{isLowerBetter ? '-' : '+'}{formatValue(improvement)}</span>
            </>
          ) : (
            <span className={styles.currentVal}>{formatValue(stockValue)}{unit}</span>
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
  const hasImproved = upgradedScore > stockScore;
  const delta = upgradedScore - stockScore;
  
  return (
    <div className={styles.scoreRow}>
      <div className={styles.scoreHeader}>
        <span className={styles.scoreLabel}>{label}</span>
        <span className={styles.scoreValues}>
          {hasImproved ? (
            <>
              <span className={styles.stockVal}>{stockScore.toFixed(1)}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.upgradedVal}>{upgradedScore.toFixed(1)}</span>
            </>
          ) : (
            <span className={styles.currentVal}>{stockScore.toFixed(1)}/10</span>
          )}
        </span>
      </div>
      <div className={styles.track}>
        <div className={styles.fillStock} style={{ width: `${(stockScore / 10) * 100}%` }} />
        {hasImproved && (
          <div className={styles.fillUpgrade} style={{ left: `${(stockScore / 10) * 100}%`, width: `${(delta / 10) * 100}%` }} />
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
            <Icon size={18} />
            <span>{category.label}</span>
            <span className={styles.popupCount}>{upgrades.length}</span>
          </div>
          <button className={styles.popupClose} onClick={onClose}><Icons.x size={16} /></button>
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
export default function UpgradeCenter({ car, initialBuildId = null, onChangeCar = null }) {
  const { isAuthenticated } = useAuth();
  const { saveBuild, updateBuild, getBuildById, canSave } = useSavedBuilds();
  
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
  const [conflictNotification, setConflictNotification] = useState(null);

  // Parts Finder state (beta)
  const [partsQuery, setPartsQuery] = useState('');
  const [partsCategory, setPartsCategory] = useState('');
  // Default to false since only ~1% of fitments are currently verified
  // Users can opt-in to verified-only filtering
  const [partsVerifiedOnly, setPartsVerifiedOnly] = useState(false);
  const [partsLoading, setPartsLoading] = useState(false);
  const [partsError, setPartsError] = useState(null);
  const [partsResults, setPartsResults] = useState([]);
  const [selectedParts, setSelectedParts] = useState([]);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState(null);
  const [graphEdges, setGraphEdges] = useState([]);

  // Defensive: use safe car slug for effects - prevents crashes if car is undefined
  const safeCarSlug = car?.slug || '';

  // -----------------------------------------------------------------------------
  // Parts Finder (beta) - uses RLS-safe /api/parts/search
  // Reset parts state when car changes
  // -----------------------------------------------------------------------------

  useEffect(() => {
    setPartsQuery('');
    setPartsCategory('');
    setPartsVerifiedOnly(false); // Match initial default
    setPartsError(null);
    setPartsResults([]);
    setSelectedParts([]);
    setGraphError(null);
    setGraphEdges([]);
  }, [safeCarSlug]);

  useEffect(() => {
    let cancelled = false;
    const q = partsQuery.trim();
    // Guard: skip fetch if no car
  const hasWindow = typeof window !== 'undefined';
  const shouldFetch = hasWindow && safeCarSlug && (q.length >= 2 || Boolean(partsCategory));

    if (!shouldFetch) {
      setPartsResults([]);
      setPartsError(null);
      return () => { cancelled = true; };
    }

    const timer = setTimeout(async () => {
      setPartsLoading(true);
      setPartsError(null);
      try {
        const url = new URL('/api/parts/search', window.location.origin);
        if (q) url.searchParams.set('q', q);
        url.searchParams.set('carSlug', safeCarSlug);
        if (partsCategory) url.searchParams.set('category', partsCategory);
        if (partsVerifiedOnly) url.searchParams.set('verified', 'true');
        url.searchParams.set('limit', '10');

        const res = await fetch(url.toString());
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || 'Failed to search parts');

        const results = Array.isArray(json?.results) ? json.results : [];
        if (!cancelled) setPartsResults(results);
      } catch (err) {
        if (!cancelled) setPartsError(err.message || 'Failed to search parts');
      } finally {
        if (!cancelled) setPartsLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [safeCarSlug, partsQuery, partsCategory, partsVerifiedOnly]);

  const addPartToSelection = useCallback((part) => {
    if (!part?.id) return;
    setSelectedParts((prev) => {
      if (prev.some((p) => p.id === part.id)) return prev;
      return [...prev, part];
    });
  }, []);

  const removeSelectedPart = useCallback((partId) => {
    setSelectedParts((prev) => prev.filter((p) => p.id !== partId));
  }, []);

  // Fetch relationship edges for selected parts and compute warnings.
  useEffect(() => {
    let cancelled = false;
    const ids = selectedParts.map((p) => p.id).filter(Boolean);
    if (ids.length === 0) {
      setGraphEdges([]);
      setGraphError(null);
      return () => { cancelled = true; };
    }

    const timer = setTimeout(async () => {
      setGraphLoading(true);
      setGraphError(null);
      try {
        const res = await fetch('/api/parts/relationships', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partIds: ids }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || 'Failed to load part relationships');
        if (!cancelled) setGraphEdges(Array.isArray(json?.edges) ? json.edges : []);
      } catch (err) {
        if (!cancelled) setGraphError(err.message || 'Failed to load part relationships');
      } finally {
        if (!cancelled) setGraphLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [selectedParts]);

  const buildChecks = useMemo(() => {
    const selectedIds = new Set(selectedParts.map((p) => p.id));
    const conflicts = [];
    const missing = [];
    const recommended = [];

    const seen = new Set();
    for (const e of graphEdges || []) {
      const a = e?.part?.id;
      const b = e?.related_part?.id;
      if (!a || !b) continue;
      const key = `${e.relation_type}:${a}:${b}`;
      if (seen.has(key)) continue;
      seen.add(key);

      if (e.relation_type === 'conflicts_with') {
        if (selectedIds.has(a) && selectedIds.has(b)) conflicts.push(e);
      } else if (e.relation_type === 'requires') {
        if (selectedIds.has(a) && !selectedIds.has(b)) missing.push(e);
      } else if (e.relation_type === 'recommended_with') {
        if (selectedIds.has(a) && !selectedIds.has(b)) recommended.push(e);
      }
    }

    return { conflicts, missing, recommended };
  }, [graphEdges, selectedParts]);
  
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
      }
    }
  }, [initialBuildId, getBuildById, safeCarSlug]);
  
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
    return getPerformanceProfile(car, effectiveModules);
  }, [car, effectiveModules]);
  
  const totalCost = useMemo(() => {
    if (!car) return { low: 0, high: 0, confidence: 'estimated', confidencePercent: 0 };
    return calculateTotalCost(profile.selectedUpgrades, car);
  }, [profile.selectedUpgrades, car]);
  
  const hpGain = profile.upgradedMetrics.hp - profile.stockMetrics.hp;
  const showUpgrade = selectedPackage !== 'stock';
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
    if (!buildName.trim()) { setSaveError('Enter a name'); return; }
    
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
      };
      
      const result = currentBuildId 
        ? await updateBuild(currentBuildId, buildData)
        : await saveBuild(buildData);
      
      if (result.error) {
        setSaveError(result.error.message || 'Failed to save');
      } else {
        if (result.data && !currentBuildId) setCurrentBuildId(result.data.id);
        setShowSaveModal(false);
        setBuildName('');
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
  
  return (
    <div className={styles.upgradeCenter}>
      {/* Compact Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          {onChangeCar && (
            <button className={styles.backBtn} onClick={onChangeCar}><Icons.arrowLeft size={16} /></button>
          )}
          <div className={styles.carThumb}>
            <CarImage car={car} variant="thumbnail" showName={false} />
          </div>
          <div className={styles.carInfo}>
            <div className={styles.carNameRow}>
              <h2 className={styles.carName}>{car.name}</h2>
              <span className={styles.tunability} style={{ '--score-color': getTunabilityColor(tunability.score) }}>
                {tunability.score}/10
              </span>
            </div>
            <div className={styles.carSpecs}>{car.hp} hp • {car.drivetrain || 'RWD'}</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          {showUpgrade && (
            <div className={styles.buildStats}>
              <span className={styles.hpBadge}>+{hpGain} HP</span>
              <span 
                className={`${styles.costBadge} ${totalCost.confidence === 'verified' ? styles.costVerified : totalCost.confidence === 'high' ? styles.costHigh : styles.costEstimated}`}
                title={`${totalCost.confidence === 'verified' ? 'Verified pricing from market data' : totalCost.confidence === 'high' ? 'High confidence estimate' : 'Estimated pricing'} (${totalCost.confidencePercent || 0}% verified)`}
              >
                ${(totalCost.low || 0).toLocaleString()}
              </span>
            </div>
          )}
          <button
            className={styles.saveBtn}
            onClick={() => { setBuildName(`${car.name} Build`); setShowSaveModal(true); }}
            disabled={!showUpgrade}
          >
            <Icons.save size={14} />
          </button>
        </div>
      </div>
      
      {/* AutoRev Recommendation Banner */}
      <div className={styles.recommendationBanner}>
        <div className={styles.recommendationHeader}>
          <span className={styles.recommendationTitle}>AutoRev Recommendation</span>
          {detailedRecommendation.focusArea && (
            <span className={styles.focusTag}>Focus: {detailedRecommendation.focusArea}</span>
          )}
        </div>
        <p className={styles.recommendationText}>{detailedRecommendation.primaryText}</p>
        {(detailedRecommendation.platformInsights.length > 0 || detailedRecommendation.watchOuts.length > 0) && (
          <div className={styles.recommendationDetails}>
            {detailedRecommendation.platformInsights.length > 0 && (
              <div className={styles.insightsList}>
                <span className={styles.insightsLabel}>Platform Insights:</span>
                {detailedRecommendation.platformInsights.map((insight, idx) => (
                  <span key={idx} className={styles.insightItem}>• {insight}</span>
                ))}
              </div>
            )}
            {detailedRecommendation.watchOuts.length > 0 && (
              <div className={styles.watchOutsList}>
                <span className={styles.watchOutsLabel}>Watch Out:</span>
                {detailedRecommendation.watchOuts.map((watchOut, idx) => (
                  <span key={idx} className={styles.watchOutItem}>• {watchOut}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Left: Packages & Categories */}
        <div className={styles.leftPanel}>
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
          <div className={styles.categoryList}>
            {UPGRADE_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const count = upgradesByCategory[cat.key]?.length || 0;
              const selected = selectedByCategory[cat.key] || 0;
              return (
                <button
                  key={cat.key}
                  className={`${styles.catBtn} ${selected > 0 ? styles.catBtnActive : ''}`}
                  onClick={() => setActiveCategory(cat.key)}
                  disabled={count === 0}
                  style={{ '--cat-color': cat.color }}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                  {selected > 0 && <span className={styles.catBadge}>{selected}</span>}
                  <Icons.chevronRight size={12} className={styles.catArrow} />
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Right: Analytics */}
        <div className={styles.rightPanel}>
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Performance</h4>
            <MetricRow icon={Icons.bolt} label="HP" stockValue={profile.stockMetrics.hp} upgradedValue={profile.upgradedMetrics.hp} unit=" hp" />
            <MetricRow icon={Icons.stopwatch} label="0-60" stockValue={profile.stockMetrics.zeroToSixty} upgradedValue={profile.upgradedMetrics.zeroToSixty} unit="s" isLowerBetter />
            <MetricRow icon={Icons.disc} label="Braking" stockValue={profile.stockMetrics.braking60To0} upgradedValue={profile.upgradedMetrics.braking60To0} unit="ft" isLowerBetter />
            <MetricRow icon={Icons.target} label="Grip" stockValue={profile.stockMetrics.lateralG} upgradedValue={profile.upgradedMetrics.lateralG} unit="g" />
          </div>
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Experience</h4>
            <ScoreBar label="Comfort" stockScore={profile.stockScores.drivability || 7} upgradedScore={profile.upgradedScores.drivability || 7} />
            <ScoreBar label="Reliability" stockScore={profile.stockScores.reliabilityHeat || 7.5} upgradedScore={profile.upgradedScores.reliabilityHeat || 7.5} />
            <ScoreBar label="Sound" stockScore={profile.stockScores.soundEmotion || 8} upgradedScore={profile.upgradedScores.soundEmotion || 8} />
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Parts Finder (Beta)</h4>

            <div className={styles.partsControls}>
              <div className={styles.partsSearch}>
                <input
                  className={styles.partsInput}
                  value={partsQuery}
                  onChange={(e) => setPartsQuery(e.target.value)}
                  placeholder="Search parts (brand, name, part #)…"
                />
              </div>
              <div className={styles.partsFilters}>
                <select className={styles.partsSelect} value={partsCategory} onChange={(e) => setPartsCategory(e.target.value)}>
                  {PART_CATEGORIES.map((c) => (
                    <option key={c.value || 'all'} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <label className={styles.partsCheckbox}>
                  <input
                    type="checkbox"
                    checked={partsVerifiedOnly}
                    onChange={(e) => setPartsVerifiedOnly(e.target.checked)}
                  />
                  <span>Verified only</span>
                </label>
              </div>
            </div>

            {partsError && <div className={styles.partsError}>{partsError}</div>}
            {partsLoading && <div className={styles.partsHint}>Searching…</div>}
            {!partsLoading && !partsError && partsResults.length === 0 && (
              <div className={styles.partsHint}>
                Type 2+ characters or pick a category to see fitment-aware parts for this car.
              </div>
            )}

            {partsResults.length > 0 && (
              <div className={styles.partsList}>
                {partsResults.map((p) => {
                  const price = p?.latest_price?.price_cents ? `$${(p.latest_price.price_cents / 100).toFixed(0)}` : null;
                  const fit = p?.fitment || null;
                  const conf = typeof fit?.confidence === 'number' ? Math.round(fit.confidence * 100) : null;
                  const isSelected = selectedParts.some((sp) => sp?.id === p?.id);

                  return (
                    <div key={p?.id || Math.random()} className={styles.partsItem}>
                      <div className={styles.partsMain}>
                        <div className={styles.partsName}>{p?.name || 'Unknown part'}</div>
                        <div className={styles.partsMeta}>
                          <span>{p?.brand_name || '—'}</span>
                          {p?.part_number && <span className={styles.partsDot}>•</span>}
                          {p?.part_number && <span>PN {p.part_number}</span>}
                          {p?.category && <span className={styles.partsDot}>•</span>}
                          {p?.category && <span>{p.category}</span>}
                        </div>
                        <div className={styles.partsBadges}>
                          {fit?.verified && <span className={styles.partsBadgeVerified}>Verified</span>}
                          {conf !== null && <span className={styles.partsBadge}>Conf {conf}%</span>}
                          {fit?.requires_tune && <span className={styles.partsBadgeWarn}>Requires tune</span>}
                          {fit?.install_difficulty && <span className={styles.partsBadge}>{fit.install_difficulty}</span>}
                          {price && <span className={styles.partsBadgePrice}>{price}</span>}
                        </div>
                      </div>
                      <div className={styles.partsActions}>
                        {p?.latest_price?.product_url && (
                          <a className={styles.partsLink} href={p.latest_price.product_url} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        )}
                        <button
                          className={styles.partsAddBtn}
                          onClick={() => addPartToSelection(p)}
                          disabled={isSelected}
                          title={isSelected ? 'Already added' : 'Add to selection'}
                        >
                          {isSelected ? 'Added' : 'Add'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedParts.length > 0 && (
              <div className={styles.partsSelected}>
                <div className={styles.partsSelectedHeader}>
                  <span>Selected parts ({selectedParts.length})</span>
                  <span className={styles.partsSelectedNote}>Saving to builds is next.</span>
                </div>
                <div className={styles.partsSelectedList}>
                  {selectedParts.map((p) => (
                    <div key={p.id} className={styles.partsSelectedItem}>
                      <span className={styles.partsSelectedName}>{p.name}</span>
                      <button className={styles.partsRemoveBtn} onClick={() => removeSelectedPart(p.id)} title="Remove">
                        <Icons.x size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className={styles.partsChecks}>
                  <div className={styles.partsChecksHeader}>
                    <span>Build checks</span>
                    {graphLoading && <span className={styles.partsSelectedNote}>Checking…</span>}
                  </div>

                  {graphError && <div className={styles.partsError}>{graphError}</div>}

                  {!graphLoading && !graphError && buildChecks.conflicts.length === 0 && buildChecks.missing.length === 0 && (
                    <div className={styles.partsCheckOk}>No known conflicts/requirements detected (for selected parts).</div>
                  )}

                  {buildChecks.conflicts.length > 0 && (
                    <div className={styles.partsCheckBlock}>
                      <div className={styles.partsCheckTitleBad}>Conflicts</div>
                      {buildChecks.conflicts.slice(0, 6).map((e) => (
                        <div key={e.id} className={styles.partsCheckItem}>
                          <span className={styles.partsCheckPart}>{e.part?.name || 'Part A'}</span>
                          <span className={styles.partsCheckArrow}>×</span>
                          <span className={styles.partsCheckPart}>{e.related_part?.name || 'Part B'}</span>
                          {e.reason && <span className={styles.partsCheckReason}>— {e.reason}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {buildChecks.missing.length > 0 && (
                    <div className={styles.partsCheckBlock}>
                      <div className={styles.partsCheckTitleWarn}>Requirements</div>
                      {buildChecks.missing.slice(0, 8).map((e) => (
                        <div key={e.id} className={styles.partsCheckItem}>
                          <span className={styles.partsCheckPart}>{e.part?.name || 'Part'}</span>
                          <span className={styles.partsCheckArrow}>→</span>
                          <span className={styles.partsCheckPart}>{e.related_part?.name || 'Required part'}</span>
                          {e.reason && <span className={styles.partsCheckReason}>— {e.reason}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {buildChecks.recommended.length > 0 && (
                    <div className={styles.partsCheckBlock}>
                      <div className={styles.partsCheckTitle}>Recommended</div>
                      {buildChecks.recommended.slice(0, 6).map((e) => (
                        <div key={e.id} className={styles.partsCheckItem}>
                          <span className={styles.partsCheckPart}>{e.part?.name || 'Part'}</span>
                          <span className={styles.partsCheckArrow}>+</span>
                          <span className={styles.partsCheckPart}>{e.related_part?.name || 'Recommended part'}</span>
                          {e.reason && <span className={styles.partsCheckReason}>— {e.reason}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Performance Intelligence - Dyno & Lap Times (Tuner tier)
              TEMPORARILY HIDDEN: Keeping code intact for future re-enablement.
              To restore, uncomment the following lines:
          <DynoDataSection carSlug={car?.slug} carName={car?.name} />
          <LapTimesSection carSlug={car?.slug} carName={car?.name} />
          */}
        </div>
      </div>
      
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
      
      {showSaveModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSaveModal(false)}>
          <div className={styles.saveModal} onClick={e => e.stopPropagation()}>
            <div className={styles.saveModalHeader}>
              <span>Save Build</span>
              <button onClick={() => setShowSaveModal(false)}><Icons.x size={14} /></button>
            </div>
            <input
              type="text"
              className={styles.saveInput}
              value={buildName}
              onChange={e => setBuildName(e.target.value)}
              placeholder="Build name"
              autoFocus
            />
            {saveError && <div className={styles.saveError}>{saveError}</div>}
            <div className={styles.saveActions}>
              <button onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button onClick={handleSaveBuild} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
