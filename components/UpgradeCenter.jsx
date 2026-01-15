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
import { getPlatformDownpipeGain } from '@/data/upgradePackages.js';
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
import { 
  useTuningProfile, 
  // Unused imports after hiding Vehicle-Specific Tuning section:
  // getFormattedStages, getFormattedPlatforms, getFormattedPowerLimits, 
  // getFormattedBrands, getDataQualityInfo, getTotalUpgradeCount,
  getUpgradesByObjective,
  getPlatformInsights,
  hasObjectiveData
} from '@/hooks/useTuningProfile';
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
import UpgradeConfigPanel, { 
  calculateConfigHpModifier, 
  getDefaultConfig 
} from './UpgradeConfigPanel';
import DynamicBuildConfig from './DynamicBuildConfig';

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
  search: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
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
  car: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  shield: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  volume: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  ),
  chevronRight: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  chevronDown: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
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
  clock: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
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
  flag: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  chevronsRight: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="13 17 18 12 13 7"/>
      <polyline points="6 17 11 12 6 7"/>
    </svg>
  ),
  star: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  zap: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
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
 * 
 * Data source priority:
 * 1. car_tuning_profiles (via tuningProfile param) - SOURCE OF TRUTH
 * 2. cars.upgradeRecommendations - DEPRECATED as of 2026-01-15
 * 3. data/carUpgradeRecommendations.js - DEPRECATED (legacy fallback)
 */
function generateDetailedRecommendation(car, stockMetrics, selectedPackage, tuningProfile = null) {
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
  
  // Priority 1: Use car_tuning_profiles data (source of truth)
  if (tuningProfile) {
    const platformInsightsData = getPlatformInsights(tuningProfile);
    const strengths = platformInsightsData.strengths || [];
    const weaknesses = platformInsightsData.weaknesses || [];
    
    // Build primary recommendation from tuning profile
    let primaryRecommendation = '';
    if (tuningProfile.tuning_community_notes) {
      primaryRecommendation = tuningProfile.tuning_community_notes;
    } else if (strengths.length > 0) {
      primaryRecommendation = `This ${car.name.split(' ').slice(-2).join(' ')} platform excels at ${strengths[0].toLowerCase()}. ${strengths.length > 1 ? `It also features ${strengths[1].toLowerCase()}.` : ''}`;
    } else {
      primaryRecommendation = generateFallbackRecommendation(car, stockMetrics);
    }
    
    // Determine focus area from upgrades_by_objective
    let focusArea = null;
    if (hasObjectiveData(tuningProfile)) {
      const objectives = getUpgradesByObjective(tuningProfile);
      // Find the objective with the most upgrades
      const objectiveCounts = Object.entries(objectives)
        .map(([key, upgrades]) => ({ key, count: upgrades?.length || 0 }))
        .filter(o => o.count > 0)
        .sort((a, b) => b.count - a.count);
      
      if (objectiveCounts.length > 0) {
        const focusLabels = {
          power: 'Power & Engine',
          handling: 'Chassis & Handling',
          braking: 'Braking',
          cooling: 'Heat Management',
          sound: 'Sound & Exhaust',
          aero: 'Aerodynamics',
        };
        focusArea = focusLabels[objectiveCounts[0].key] || objectiveCounts[0].key;
      }
    }
    
    return {
      primaryText: primaryRecommendation,
      focusArea,
      platformInsights: strengths.slice(0, 2),
      watchOuts: weaknesses.slice(0, 2),
      hasDetailedData: true,
      source: 'car_tuning_profiles',
    };
  }
  
  // Fallback: Legacy data sources (used when car_tuning_profiles not available)
  // NOTE: These static file sources are DEPRECATED as of 2026-01-15
  // cars.upgrade_recommendations column has been REMOVED from the database
  const carRecs = getRecommendationsForCar(carSlug);
  const platformNotes = getPlatformNotes(carSlug);
  const knownIssues = getKnownIssues(carSlug);
  
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
  
  // Use tier-specific narrative from static carUpgradeRecommendations (legacy fallback)
  if (tierRecs?.narrative) {
    primaryRecommendation = tierRecs.narrative;
  }
  // Generate from car specs if no narrative available
  else {
    primaryRecommendation = generateFallbackRecommendation(car, stockMetrics);
  }
  
  // Gather platform strengths from static data
  if (platformNotes?.length > 0) {
    platformInsights = platformNotes.slice(0, 2);
  }
  
  // Gather watch-outs / known issues from static data
  if (knownIssues?.length > 0) {
    watchOuts = knownIssues.slice(0, 1);
  }
  
  // Get focus area from tier recommendations if available
  let focusArea = null;
  if (tierRecs?.primaryFocus) {
    const focusLabels = {
      cooling: 'Heat Management',
      handling: 'Chassis & Handling',
      braking: 'Braking',
      power: 'Power & Engine',
      sound: 'Sound & Exhaust',
    };
    focusArea = focusLabels[tierRecs.primaryFocus] || tierRecs.primaryFocus;
  }
  
  return {
    primaryText: primaryRecommendation,
    focusArea,
    platformInsights,
    watchOuts,
    hasDetailedData: !!carRecs,
    source: 'static_file',
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
 * Virtual Dyno Chart - Shows estimated HP/TQ curve
 * Uses physics model to generate RPM-based power curve
 */
function VirtualDynoChart({ stockHp, estimatedHp, stockTorque, estimatedTq, peakRpm = 6500 }) {
  // Generate dyno curve data points
  // NOTE: All values are CRANK HP for consistency (database stores crank HP)
  const generateCurve = (peakPower, peakTq, isStock = false) => {
    const points = [];
    const startRpm = 2000;
    const endRpm = 7500;
    const step = 250;

    for (let rpm = startRpm; rpm <= endRpm; rpm += step) {
      // Power curve shape (rises, peaks, falls)
      const rpmRatio = rpm / peakRpm;
      const powerFactor = rpmRatio < 1
        ? Math.pow(rpmRatio, 1.8)
        : 1 - Math.pow((rpmRatio - 1) * 2, 2) * 0.3;

      // Torque peaks earlier and stays flatter
      const torqueRpmRatio = rpm / (peakRpm * 0.75);
      const torqueFactor = torqueRpmRatio < 1
        ? Math.pow(torqueRpmRatio, 1.2)
        : 1 - Math.pow((torqueRpmRatio - 1) * 1.5, 2) * 0.2;

      points.push({
        rpm,
        hp: Math.max(0, Math.round(peakPower * Math.max(0, powerFactor))),
        tq: Math.max(0, Math.round(peakTq * Math.max(0, torqueFactor))),
      });
    }
    return points;
  };

  const stockCurve = generateCurve(stockHp, stockTorque || stockHp * 0.85, true);
  const modCurve = generateCurve(estimatedHp, estimatedTq || estimatedHp * 0.9, false);

  const maxHp = Math.max(estimatedHp, stockHp) * 1.15; // More headroom
  const hpGain = estimatedHp - stockHp;
  const gainPercent = ((hpGain / stockHp) * 100).toFixed(0);

  return (
    <div className={styles.virtualDynoLarge}>
      {/* Header with clear gain summary */}
      <div className={styles.dynoHeaderLarge}>
        <div className={styles.dynoTitleSection}>
          <span className={styles.dynoTitleLarge}>Virtual Dyno</span>
          <span className={styles.dynoSubtitle}>Estimated power curve based on your modifications</span>
        </div>
        <div className={styles.dynoGainBadge}>
          <span className={styles.dynoGainValue}>+{hpGain}</span>
          <span className={styles.dynoGainUnit}>HP</span>
          <span className={styles.dynoGainPercent}>({gainPercent}% gain)</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className={styles.dynoLegendLarge}>
        <span className={styles.dynoLegendItemLarge}>
          <span className={styles.dynoLegendLine} style={{ background: 'rgba(255,255,255,0.4)', borderStyle: 'dashed' }} />
          <span>Stock: {stockHp} HP</span>
        </span>
        <span className={styles.dynoLegendItemLarge}>
          <span className={styles.dynoLegendLine} style={{ background: '#10b981' }} />
          <span>Modified: {estimatedHp} HP</span>
        </span>
      </div>

      {/* Chart Area - Larger */}
      <div className={styles.dynoChartLarge}>
        {/* Y-Axis Labels */}
        <div className={styles.dynoYAxisLarge}>
          <span>{Math.round(maxHp)}</span>
          <span>{Math.round(maxHp * 0.75)}</span>
          <span>{Math.round(maxHp * 0.5)}</span>
          <span>{Math.round(maxHp * 0.25)}</span>
          <span>0</span>
        </div>
        
        {/* Chart Area */}
        <div className={styles.dynoChartAreaLarge}>
          {/* Grid lines */}
          <div className={styles.dynoGridLarge}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className={styles.dynoGridLineLarge} style={{ bottom: `${i * 25}%` }} />
            ))}
          </div>
          
          {/* Gain area fill between curves */}
          <svg className={styles.dynoCurveSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            {/* Fill area between curves */}
            <path
              d={
                modCurve.map((p, i) => {
                  const x = ((p.rpm - 2000) / 5500) * 100;
                  const y = 100 - (p.hp / maxHp) * 100;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ') +
                stockCurve.slice().reverse().map((p) => {
                  const x = ((p.rpm - 2000) / 5500) * 100;
                  const y = 100 - (p.hp / maxHp) * 100;
                  return `L ${x} ${y}`;
                }).join(' ') + ' Z'
              }
              fill="url(#gainGradient)"
            />
          </svg>
          
          {/* Stock HP curve */}
          <svg className={styles.dynoCurveSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d={stockCurve.map((p, i) => {
                const x = ((p.rpm - 2000) / 5500) * 100;
                const y = 100 - (p.hp / maxHp) * 100;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          </svg>
          
          {/* Modified HP curve */}
          <svg className={styles.dynoCurveSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d={modCurve.map((p, i) => {
                const x = ((p.rpm - 2000) / 5500) * 100;
                const y = 100 - (p.hp / maxHp) * 100;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
            />
          </svg>
          
          {/* Stock peak marker */}
          <div
            className={styles.dynoPeakMarkerStock}
            style={{
              left: `${((peakRpm - 2000) / 5500) * 100}%`,
              bottom: `${(stockHp / maxHp) * 100}%`
            }}
          >
            <span className={styles.dynoPeakValueStock}>{stockHp}</span>
          </div>
          
          {/* Modified peak marker */}
          <div
            className={styles.dynoPeakMarkerMod}
            style={{
              left: `${((peakRpm - 2000) / 5500) * 100}%`,
              bottom: `${(estimatedHp / maxHp) * 100}%`
            }}
          >
            <span className={styles.dynoPeakValueMod}>{estimatedHp}</span>
            <span className={styles.dynoPeakLabelMod}>HP</span>
          </div>

          {/* Gain annotation line */}
          <div
            className={styles.dynoGainLine}
            style={{
              left: `${((peakRpm - 2000) / 5500) * 100}%`,
              bottom: `${(stockHp / maxHp) * 100}%`,
              height: `${((estimatedHp - stockHp) / maxHp) * 100}%`
            }}
          >
            <span className={styles.dynoGainAnnotation}>+{hpGain}</span>
          </div>
        </div>
        
        {/* X-Axis Labels */}
        <div className={styles.dynoXAxisLarge}>
          <span>2,000</span>
          <span>3,500</span>
          <span>5,000</span>
          <span>6,500</span>
          <span>7,500 RPM</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Power Breakdown - Shows where HP gains come from
 */
function PowerBreakdown({ stockHp, specs, estimate }) {
  const breakdown = [];
  let runningTotal = stockHp;
  
  // Engine mods
  if (specs.engine?.type !== 'stock') {
    let engineGain = 0;
    if (specs.engine.cams === 'stage3') engineGain += Math.round(stockHp * 0.12);
    else if (specs.engine.cams === 'stage2') engineGain += Math.round(stockHp * 0.07);
    else if (specs.engine.cams === 'stage1') engineGain += Math.round(stockHp * 0.04);
    if (specs.engine.headWork) engineGain += Math.round(stockHp * 0.06);
    if (specs.engine.type === 'stroked' && specs.engine.displacement > 2.0) {
      engineGain += Math.round(stockHp * ((specs.engine.displacement / 2.0) - 1));
    }
    if (engineGain > 0) {
      breakdown.push({ label: 'Engine Internals', gain: engineGain, color: '#f59e0b' });
      runningTotal += engineGain;
    }
  }
  
  // Breathing mods
  let breathingGain = 0;
  if (specs.intake?.type !== 'stock') breathingGain += Math.round(stockHp * 0.02);
  if (specs.exhaust?.downpipe !== 'stock') breathingGain += Math.round(stockHp * 0.03);
  if (specs.exhaust?.headers !== 'stock') breathingGain += Math.round(stockHp * 0.03);
  if (breathingGain > 0) {
    breakdown.push({ label: 'Intake & Exhaust', gain: breathingGain, color: '#8b5cf6' });
    runningTotal += breathingGain;
  }
  
  // Turbo upgrade
  if (specs.turbo?.type !== 'stock') {
    const turboGain = Math.round((estimate?.whp || runningTotal) - runningTotal - (specs.fuel?.type === 'e85' ? stockHp * 0.15 : 0));
    if (turboGain > 0) {
      breakdown.push({ label: 'Turbo Upgrade', gain: turboGain, color: '#ef4444' });
      runningTotal += turboGain;
    }
  }
  
  // Fuel
  if (specs.fuel?.type === 'e85') {
    const fuelGain = Math.round(stockHp * 0.15);
    breakdown.push({ label: 'E85 Fuel', gain: fuelGain, color: '#10b981' });
    runningTotal += fuelGain;
  } else if (specs.fuel?.type === 'e50' || specs.fuel?.type === 'e30') {
    const fuelGain = Math.round(stockHp * (specs.fuel.type === 'e50' ? 0.10 : 0.06));
    breakdown.push({ label: `${specs.fuel.type.toUpperCase()} Fuel`, gain: fuelGain, color: '#10b981' });
    runningTotal += fuelGain;
  }
  
  // ECU
  if (specs.ecu?.type !== 'stock') {
    const ecuGain = Math.round(stockHp * 0.03);
    breakdown.push({ label: 'ECU Tuning', gain: ecuGain, color: '#3b82f6' });
  }
  
  const totalGain = (estimate?.hp || estimate?.whp || runningTotal) - stockHp;

  return (
    <div className={styles.powerBreakdown}>
      <div className={styles.breakdownHeader}>
        <span className={styles.breakdownTitle}>Power Breakdown</span>
        <span className={styles.breakdownTotal}>+{totalGain} HP</span>
      </div>
      <div className={styles.breakdownBars}>
        {breakdown.map((item, idx) => (
          <div key={idx} className={styles.breakdownRow}>
            <div className={styles.breakdownLabel}>
              <span className={styles.breakdownDot} style={{ background: item.color }} />
              <span>{item.label}</span>
            </div>
            <div className={styles.breakdownBarContainer}>
              <div 
                className={styles.breakdownBar} 
                style={{ 
                  width: `${Math.min(100, (item.gain / totalGain) * 100)}%`,
                  background: item.color 
                }} 
              />
            </div>
            <span className={styles.breakdownGain}>+{item.gain}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Calculated Performance - Physics-based 0-60, 1/4 mile
 */
function CalculatedPerformance({
  stockHp,
  estimatedHp,
  weight = 3500,
  drivetrain = 'AWD',
  tireCompound = 'summer',
  weightMod = 0, 
  driverWeight = 180, 
  finalDrive = null,
  wheelWeight = null, // lbs per wheel (stock ~25, forged ~18)
  handlingScore = 100,
  brakingScore = 100,
}) {
  // Guard against invalid inputs
  const safeStockHp = (typeof stockHp === 'number' && !isNaN(stockHp) && stockHp > 0) ? stockHp : 300;
  const safeEstimatedHp = (typeof estimatedHp === 'number' && !isNaN(estimatedHp) && estimatedHp > 0) ? estimatedHp : safeStockHp;
  const safeWeight = (typeof weight === 'number' && !isNaN(weight) && weight > 0) ? weight : 3500;
  
  // Adjust weight for modifications and driver
  const totalWeight = safeWeight + (weightMod || 0) + (driverWeight || 180);
  const stockTotalWeight = safeWeight + 180; // Stock with driver
  
  // Wheel weight affects rotational inertia (lighter wheels = faster accel)
  // Rule of thumb: 1lb of wheel weight = 4-5lbs of static weight for acceleration
  const stockWheelWeight = 25; // Average stock wheel
  const currentWheelWeight = wheelWeight || stockWheelWeight;
  const wheelWeightDiff = (stockWheelWeight - currentWheelWeight) * 4; // Effective weight savings
  const effectiveWeight = totalWeight - wheelWeightDiff;
  const stockEffectiveWeight = stockTotalWeight;
  
  // Tire grip multiplier for launch (affects 0-60 more than 1/4)
  const tireGripMap = {
    'all-season': 0.82,
    'summer': 0.90,
    'max-performance': 0.95,
    'r-comp': 1.05,
    'drag-radial': 1.25, // Massive launch advantage
    'slick': 1.35,
  };
  const tireGrip = tireGripMap[tireCompound] || 0.90;
  
  // Power to weight ratio (hp per ton, where ton = 2000 lbs)
  const powerToWeight = (safeEstimatedHp / effectiveWeight) * 2000;
  const stockPtw = (safeStockHp / stockEffectiveWeight) * 2000;
  
  // ==========================================================================
  // 0-60 MPH CALCULATION
  // ==========================================================================
  // Empirical formula validated against real-world data:
  // 0-60 = sqrt(weight/hp) * k, where k varies by drivetrain
  // AWD: k ≈ 1.2 (best launch, minimal wheelspin)
  // RWD: k ≈ 1.35 (wheelspin limited)
  // FWD: k ≈ 1.4 (torque steer, weight transfer issues)
  
  const drivetrainK = {
    'AWD': 1.20,
    'RWD': 1.35,
    'FWD': 1.40,
    '4WD': 1.25,
  };
  const baseK = drivetrainK[drivetrain] || 1.30;
  
  // Tire grip affects launch (drag radials are huge for RWD)
  const tireKMultiplier = {
    'all-season': 1.08,
    'summer': 1.0,
    'max-performance': 0.97,
    'r-comp': 0.93,
    'drag-radial': 0.85, // Massive launch improvement
    'slick': 0.82,
  };
  const kTire = tireKMultiplier[tireCompound] || 1.0;
  
  // Calculate 0-60
  const weightToHp = effectiveWeight / safeEstimatedHp;
  const stockWeightToHp = stockEffectiveWeight / safeStockHp;
  
  // Minimum realistic 0-60 times (even hypercars can't beat physics)
  const estimated060 = Math.max(2.0, Math.sqrt(weightToHp) * baseK * kTire);
  const stock060 = Math.max(2.5, Math.sqrt(stockWeightToHp) * baseK);
  
  // ==========================================================================
  // 1/4 MILE CALCULATION  
  // ==========================================================================
  // Classic empirical formula: ET = 5.825 * (weight/hp)^0.333
  // This is well-validated across many vehicles
  const tractionBonus = tireCompound === 'drag-radial' ? 0.94 : tireCompound === 'slick' ? 0.92 : 1.0;
  const estimatedQuarter = 5.825 * Math.pow(weightToHp, 0.333) * tractionBonus;
  const stockQuarter = 5.825 * Math.pow(stockWeightToHp, 0.333);

  // ==========================================================================
  // TRAP SPEED CALCULATION
  // ==========================================================================
  // Formula: Trap Speed (mph) = 234 * (hp/weight)^0.333
  // Adjusted from 224 to 234 based on modern vehicle data
  const finalDriveFactor = finalDrive ? Math.min(1.02, 3.5 / finalDrive) : 1.0;
  const estimatedTrap = 234 * Math.pow(safeEstimatedHp / effectiveWeight, 0.333) * finalDriveFactor;
  const stockTrap = 234 * Math.pow(safeStockHp / stockEffectiveWeight, 0.333);
  
  // Braking distance (60-0) estimation
  // Base: ~120ft for average car at 60mph
  // Better brakes/tires reduce this
  const stockBraking60 = 120; // feet
  const brakingImprovement = (brakingScore - 100) / 100; // percentage improvement
  const estimatedBraking60 = Math.round(stockBraking60 * (1 - brakingImprovement * 0.25));
  
  // Lateral G estimation
  // Stock sedan ~0.85g, sport car ~0.95g
  const baseG = 0.90;
  const handlingImprovement = (handlingScore - 100) / 100;
  const estimatedLateralG = (baseG * (1 + handlingImprovement * 0.3)).toFixed(2);
  const stockLateralG = baseG.toFixed(2);
  
  // Safe number formatting to prevent NaN display
  const safeFixed = (num, decimals = 1, fallback = '—') => {
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) return fallback;
    return num.toFixed(decimals);
  };
  
  const safeDelta = (from, to, decimals = 1) => {
    const diff = from - to;
    if (isNaN(diff) || !isFinite(diff)) return '0';
    return diff.toFixed(decimals);
  };

  return (
    <div className={styles.calcPerformance}>
      <div className={styles.calcHeader}>
        <span className={styles.calcTitle}>Calculated Performance</span>
        <span className={styles.calcSubtitle}>Based on {safeWeight.toLocaleString()} lbs, {drivetrain}</span>
      </div>
      <div className={styles.calcGrid}>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>0-60 mph</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{safeFixed(stock060)}s</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{safeFixed(estimated060)}s</span>
          </div>
          <div className={styles.calcDelta}>-{safeDelta(stock060, estimated060)}s</div>
        </div>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>1/4 Mile</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{safeFixed(stockQuarter)}s</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{safeFixed(estimatedQuarter)}s</span>
          </div>
          <div className={styles.calcDelta}>-{safeDelta(stockQuarter, estimatedQuarter)}s</div>
        </div>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>Trap Speed</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{safeFixed(stockTrap, 0)}</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{safeFixed(estimatedTrap, 0)} mph</span>
          </div>
          <div className={styles.calcDelta}>+{safeDelta(stockTrap, estimatedTrap, 0)} mph</div>
        </div>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>Power/Weight</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{safeFixed(stockPtw, 0)}</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{safeFixed(powerToWeight, 0)} hp/ton</span>
          </div>
          <div className={styles.calcDelta}>+{safeDelta(stockPtw, powerToWeight, 0)}</div>
        </div>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>60-0 Braking</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{stockBraking60}ft</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{estimatedBraking60} ft</span>
          </div>
          <div className={styles.calcDelta}>{estimatedBraking60 <= stockBraking60 ? '-' : '+'}{Math.abs(stockBraking60 - estimatedBraking60)} ft</div>
        </div>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>Lateral G</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{stockLateralG}g</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{estimatedLateralG}g</span>
          </div>
          <div className={styles.calcDelta}>+{safeFixed(parseFloat(estimatedLateralG) - parseFloat(stockLateralG), 2, '0.00')}g</div>
        </div>
      </div>
    </div>
  );
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
 * Lap Time Estimator - Uses physics simulation for track estimates
 */
function LapTimeEstimator({
  stockHp, estimatedHp, weight, drivetrain, tireCompound,
  suspensionSetup, brakeSetup, aeroSetup, weightMod = 0, driverWeight = 180,
  user, carSlug, modsSummary
}) {
  const [selectedTrackSlug, setSelectedTrackSlug] = useState('laguna-seca');
  const [driverSkill, setDriverSkill] = useState('intermediate');
  const [showInfo, setShowInfo] = useState(false);
  const [showLogForm, setShowLogForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTrackSelector, setShowTrackSelector] = useState(false);
  const [trackSearch, setTrackSearch] = useState('');
  const [trackHistory, setTrackHistory] = useState([]);
  const [allTracks, setAllTracks] = useState([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  
  // Form state for logging a track time
  const [logForm, setLogForm] = useState({
    lapTimeMinutes: '',
    lapTimeSeconds: '',
    sessionDate: new Date().toISOString().split('T')[0],
    conditions: 'dry',
    notes: ''
  });
  
  // Fetch tracks from database on mount
  useEffect(() => {
    async function fetchTracks() {
      try {
        const res = await fetch('/api/tracks');
        if (res.ok) {
          const data = await res.json();
          setAllTracks(data.tracks || []);
        }
      } catch (err) {
        console.error('Failed to fetch tracks:', err);
      } finally {
        setTracksLoading(false);
      }
    }
    fetchTracks();
  }, []);
  
  // Fetch track history when history panel is opened
  useEffect(() => {
    if (showHistory && user?.id && carSlug) {
      fetchTrackHistory();
    }
  }, [showHistory, user?.id, carSlug]);
  
  const fetchTrackHistory = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/track-times?carSlug=${carSlug || ''}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setTrackHistory(data.times || []);
      }
    } catch (err) {
      console.error('Failed to fetch track history:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogTime = async () => {
    if (!user?.id) return;
    
    const minutes = parseInt(logForm.lapTimeMinutes || '0', 10);
    const seconds = parseFloat(logForm.lapTimeSeconds || '0');
    const totalSeconds = (minutes * 60) + seconds;
    
    if (totalSeconds < 20 || totalSeconds > 1200) {
      alert('Please enter a valid lap time between 20 seconds and 20 minutes');
      return;
    }
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}/track-times`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackName: selectedTrack.name,
          trackSlug: selectedTrack.slug,
          trackLengthMiles: selectedTrack.length,
          lapTimeSeconds: totalSeconds,
          sessionDate: logForm.sessionDate,
          conditions: logForm.conditions,
          tireCompound: tireCompound,
          modsSummary: modsSummary || {},
          estimatedHp: estimatedHp,
          estimatedTimeSeconds: moddedLapTime,
          driverSkillLevel: driverSkill,
          notes: logForm.notes,
          carSlug: carSlug
        })
      });
      
      if (res.ok) {
        // Reset form and refresh history
        setLogForm({
          lapTimeMinutes: '',
          lapTimeSeconds: '',
          sessionDate: new Date().toISOString().split('T')[0],
          conditions: 'dry',
          notes: ''
        });
        setShowLogForm(false);
        fetchTrackHistory();
        setShowHistory(true);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save track time');
      }
    } catch (err) {
      console.error('Failed to log track time:', err);
      alert('Failed to save track time');
    } finally {
      setIsSaving(false);
    }
  };
  
  const requestAnalysis = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/track-times/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carSlug })
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.analysis);
      }
    } catch (err) {
      console.error('Failed to get analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatLapTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  // ==========================================================================
  // TRACK DEFINITIONS
  // Based on real-world lap time data from street cars (300-500hp sports cars)
  // Reference: A skilled driver in a ~400hp RWD sports car on summer tires
  // ==========================================================================
  // Fallback tracks if API fails (same structure as API response)
  const FALLBACK_TRACKS = [
    {
      slug: 'laguna-seca', name: 'Laguna Seca', shortName: 'Laguna',
      length: 2.238, corners: 11, icon: '🏁', state: 'CA', country: 'USA',
      proTime: 95, powerGainMax: 4.0, gripGainMax: 5.0, suspGainMax: 3.5,
      brakeGainMax: 2.5, aeroGainMax: 2.0, weightGainMax: 2.0,
      beginnerPenalty: 25, intermediatePenalty: 10, advancedPenalty: 3, isPopular: true,
    },
    {
      slug: 'road-atlanta', name: 'Road Atlanta', shortName: 'Road Atlanta',
      length: 2.54, corners: 12, icon: '🍑', state: 'GA', country: 'USA',
      proTime: 98, powerGainMax: 6.0, gripGainMax: 4.5, suspGainMax: 3.5,
      brakeGainMax: 3.0, aeroGainMax: 3.0, weightGainMax: 2.0,
      beginnerPenalty: 30, intermediatePenalty: 12, advancedPenalty: 4, isPopular: true,
    },
    {
      slug: 'cota', name: 'Circuit of the Americas', shortName: 'COTA',
      length: 3.426, corners: 20, icon: '⭐', state: 'TX', country: 'USA',
      proTime: 135, powerGainMax: 8.0, gripGainMax: 5.0, suspGainMax: 4.0,
      brakeGainMax: 3.5, aeroGainMax: 4.0, weightGainMax: 2.5,
      beginnerPenalty: 40, intermediatePenalty: 16, advancedPenalty: 5, isPopular: true,
    },
    {
      slug: 'autocross-standard', name: 'Autocross', shortName: 'Autocross',
      length: 0.5, corners: 20, icon: '🔀', state: null, country: 'USA',
      proTime: 48, powerGainMax: 0.5, gripGainMax: 4.0, suspGainMax: 2.5,
      brakeGainMax: 1.5, aeroGainMax: 0.3, weightGainMax: 1.5,
      beginnerPenalty: 15, intermediatePenalty: 6, advancedPenalty: 2, isPopular: true,
    },
  ];
  
  // Use database tracks or fallback
  const tracks = allTracks.length > 0 ? allTracks : FALLBACK_TRACKS;
  const popularTracks = tracks.filter(t => t.isPopular).slice(0, 6);
  
  // Get currently selected track data
  const selectedTrack = tracks.find(t => t.slug === selectedTrackSlug) || tracks[0];
  
  // Filter tracks for search
  const filteredTracks = useMemo(() => {
    if (!trackSearch.trim()) return tracks;
    const search = trackSearch.toLowerCase();
    return tracks.filter(t => 
      t.name.toLowerCase().includes(search) ||
      t.shortName?.toLowerCase().includes(search) ||
      t.state?.toLowerCase().includes(search) ||
      t.city?.toLowerCase().includes(search)
    );
  }, [tracks, trackSearch]);

  // ==========================================================================
  // DRIVER SKILL DEFINITIONS
  // Key insight: Mods raise the ceiling, skill determines how much you use
  // ==========================================================================
  const DRIVER_SKILLS = {
    beginner: {
      label: 'Beginner',
      description: '0-2 years track experience',
      // What limits them: Still learning racing lines, braking points, looking ahead
      // Mods often make things WORSE (more power = more scary/snap oversteer)
      modUtilization: {
        power: 0.10,      // More power might scare them, can't use it
        grip: 0.25,       // Better tires help catch mistakes
        suspension: 0.15, // Won't feel the difference, might upset balance
        brakes: 0.30,     // Actually helpful - more forgiving of late braking
        aero: 0.05,       // Not going fast enough for it to matter
        weight: 0.20,     // Lighter car is more forgiving
      },
      tip: '💡 The best mod for you is seat time! Consider a driving school before spending on parts.',
      insight: 'At your skill level, improving your driving will gain you 3-5x more time than any modification.',
    },
    intermediate: {
      label: 'Intermediate',
      description: '2-5 years, consistent laps',
      // What limits them: Know the basics, working on consistency and speed
      // Can feel grip differences, starting to use more power
      modUtilization: {
        power: 0.45,      // Can use more power on straights, careful in corners
        grip: 0.60,       // Really benefits from more grip
        suspension: 0.50, // Starting to feel setup differences
        brakes: 0.55,     // Can brake later with confidence
        aero: 0.35,       // Starting to feel high-speed stability
        weight: 0.50,     // Appreciates lighter car
      },
      tip: '💡 Grip mods (tires, suspension) will help you most. Consider advanced driving instruction!',
      insight: 'You can extract about half of what mods offer. More seat time will unlock the rest.',
    },
    advanced: {
      label: 'Advanced',
      description: '5+ years, pushing limits',
      // What limits them: Mostly the car now, at or near the limit
      // Can feel small differences, uses most of what mods offer
      modUtilization: {
        power: 0.80,      // Uses most power, might still lift early sometimes
        grip: 0.85,       // Maximizing corner speeds
        suspension: 0.80, // Can tune to preference
        brakes: 0.85,     // Braking at the limit
        aero: 0.75,       // Trusting downforce in high-speed corners
        weight: 0.80,     // Fully exploiting lighter weight
      },
      tip: '💡 You can extract most performance from mods. Focus on balanced upgrades.',
      insight: 'Your skill extracts 80%+ of mod potential. Fine-tuning setup is your next step.',
    },
    professional: {
      label: 'Pro',
      description: 'Instructor / racer',
      // What limits them: Only the car - they are at the absolute limit
      // This is the theoretical maximum - what the mods can truly deliver
      modUtilization: {
        power: 0.98,      // Uses everything, maybe 2% safety margin
        grip: 0.98,       // At the tire limit
        suspension: 0.95, // Perfect setup utilization
        brakes: 0.98,     // Trail braking at the limit
        aero: 0.95,       // Full trust in downforce
        weight: 0.95,     // Exploiting every advantage
      },
      tip: '💡 You\'re extracting the car\'s full potential. Mods directly translate to lap time.',
      insight: 'This represents the theoretical maximum - what the modifications can truly deliver.',
    }
  };

  // ==========================================================================
  // CALCULATE THEORETICAL MOD IMPROVEMENT
  // This is what a PROFESSIONAL driver would gain - the ceiling
  // ==========================================================================
  const calculateModImprovement = () => {
    const track = selectedTrack;
    const improvements = { power: 0, grip: 0, suspension: 0, brakes: 0, aero: 0, weight: 0 };

    // 1. POWER GAINS - More HP = faster on straights
    // Diminishing returns: first 100hp matters more than next 100hp
    const hpGain = Math.max(0, estimatedHp - stockHp);
    const powerFactor = Math.min(1.0, hpGain / 200); // 200hp = max effect
    improvements.power = powerFactor * track.powerGainMax;

    // 2. TIRE COMPOUND - Affects cornering speed significantly
    const tireLevel = {
      'all-season': 0,
      'summer': 0.15,
      'max-performance': 0.35,
      'r-comp': 0.75,
      'drag-radial': 0.10, // Not great for track, only good for launch
      'slick': 1.0
    }[tireCompound] || 0.15;
    improvements.grip = tireLevel * track.gripGainMax;

    // 3. SUSPENSION - Better turn-in, corner speed, confidence
    const suspLevel = {
      'stock': 0,
      'lowering-springs': 0.25,
      'coilovers': 0.60,
      'coilovers-race': 1.0,
      'air': 0.10 // Not track-oriented
    }[suspensionSetup?.type] || 0;
    improvements.suspension = suspLevel * track.suspGainMax;

    // 4. BRAKES - Later braking points, better modulation
    let brakeLevel = 0;
    if (brakeSetup?.bbkFront) brakeLevel += 0.40;
    if (brakeSetup?.brakePads === 'track') brakeLevel += 0.25;
    if (brakeSetup?.brakePads === 'race') brakeLevel += 0.40;
    if (brakeSetup?.brakeFluid === 'racing') brakeLevel += 0.10;
    if (brakeSetup?.stainlessLines) brakeLevel += 0.05;
    brakeLevel = Math.min(1.0, brakeLevel);
    improvements.brakes = brakeLevel * track.brakeGainMax;

    // 5. AERO - High-speed stability and downforce
    let aeroLevel = 0;
    if (aeroSetup?.rearWing === 'lip-spoiler') aeroLevel += 0.15;
    if (aeroSetup?.rearWing === 'ducktail') aeroLevel += 0.25;
    if (aeroSetup?.rearWing === 'gt-wing-low') aeroLevel += 0.60;
    if (aeroSetup?.rearWing === 'gt-wing-high') aeroLevel += 1.0;
    if (aeroSetup?.frontSplitter === 'lip') aeroLevel += 0.15;
    if (aeroSetup?.frontSplitter === 'splitter-rods') aeroLevel += 0.40;
    if (aeroSetup?.diffuser) aeroLevel += 0.25;
    aeroLevel = Math.min(1.0, aeroLevel);
    improvements.aero = aeroLevel * track.aeroGainMax;

    // 6. WEIGHT REDUCTION - Helps everywhere
    const weightSaved = Math.abs(weightMod || 0);
    const weightLevel = Math.min(1.0, weightSaved / 200); // 200lbs = max effect
    improvements.weight = weightLevel * track.weightGainMax;

    return improvements;
  };

  // ==========================================================================
  // CALCULATE LAP TIMES
  // ==========================================================================
  const track = selectedTrack;
  const skill = DRIVER_SKILLS[driverSkill];
  
  // Get the theoretical improvements (what a pro would gain)
  const modImprovements = calculateModImprovement();
  
  // Calculate theoretical total (pro driver gains)
  const theoreticalTotal = Object.values(modImprovements).reduce((sum, val) => sum + val, 0);
  
  // Apply driver skill to each category differently
  // A beginner benefits more from brakes than power, for example
  const realizedByCategory = {
    power: modImprovements.power * skill.modUtilization.power,
    grip: modImprovements.grip * skill.modUtilization.grip,
    suspension: modImprovements.suspension * skill.modUtilization.suspension,
    brakes: modImprovements.brakes * skill.modUtilization.brakes,
    aero: modImprovements.aero * skill.modUtilization.aero,
    weight: modImprovements.weight * skill.modUtilization.weight,
  };
  const realizedTotal = Object.values(realizedByCategory).reduce((sum, val) => sum + val, 0);
  
  // Stock lap time calculation:
  // Pro reference time assumes a ~400hp car. Adjust for actual stock power.
  // Power difference affects time in an additive way (not multiplicative).
  // Real-world: ~0.02-0.03 sec per hp difference on a 3mi track
  const hpDifference = 400 - (stockHp || 400);
  const trackLengthFactor = (track.length || 3.0) / 3.0; // Scale for track length
  const powerPenalty = hpDifference * 0.025 * trackLengthFactor; // ~2.5 sec per 100hp difference
  
  // Skill penalty from database (how much slower than a pro)
  // Pro drivers have 0 penalty (they ARE the reference), others add time
  const skillPenalty = driverSkill === 'pro' 
    ? 0 
    : (track[`${driverSkill}Penalty`] || track.intermediatePenalty);
  
  // Stock lap time = pro reference + power adjustment + skill penalty
  const stockLapTime = track.proTime + powerPenalty + skillPenalty;
  
  // Modified lap time = stock - realized improvements from mods
  const moddedLapTime = stockLapTime - realizedTotal;
  
  // What they're leaving on the table
  const unrealizedGains = theoreticalTotal - realizedTotal;
  
  // Average utilization percentage
  const avgUtilization = theoreticalTotal > 0 ? (realizedTotal / theoreticalTotal) * 100 : 0;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  return (
    <div className={styles.lapTimeEstimator}>
      <div className={styles.lapTimeHeader}>
        <div className={styles.lapTimeTitleRow}>
          <Icons.flag size={18} />
          <span>Lap Time Estimator</span>
          <button 
            className={styles.lapTimeInfoBtn}
            onClick={() => setShowInfo(!showInfo)}
            title="How this works"
          >
            <Icons.info size={14} />
          </button>
        </div>
      </div>

      {/* Info Panel - How it works */}
      {showInfo && (
        <div className={styles.lapTimeInfoPanel}>
          <h4>How Lap Time Estimation Works</h4>
          <p>
            We calculate potential time gains from your modifications based on power, 
            grip, suspension, brakes, aero, and weight. <strong>But here's the key insight:</strong>
          </p>
          <p>
            Modifications raise the <em>ceiling</em> of what's possible, but your skill 
            determines how much of that potential you can actually use.
          </p>
          <ul>
            <li><strong>Beginner:</strong> ~15-25% of mod potential (skill is the limiting factor)</li>
            <li><strong>Intermediate:</strong> ~45-55% of mod potential</li>
            <li><strong>Advanced:</strong> ~75-85% of mod potential</li>
            <li><strong>Professional:</strong> ~95-98% of mod potential (theoretical max)</li>
          </ul>
          <p className={styles.lapTimeInfoHighlight}>
            💡 The fastest path to quicker lap times is often improving YOUR skills, not adding parts!
          </p>
        </div>
      )}

      {/* Driver Skill Selector */}
      <div className={styles.skillSelector}>
        <span className={styles.skillLabel}>Driver Skill:</span>
        <div className={styles.skillBtns}>
          {Object.entries(DRIVER_SKILLS).map(([key, skillDef]) => (
            <button
              key={key}
              className={`${styles.skillBtn} ${driverSkill === key ? styles.skillBtnActive : ''}`}
              onClick={() => setDriverSkill(key)}
              title={skillDef.description}
            >
              {skillDef.label}
            </button>
          ))}
        </div>
      </div>

      {/* Track Selector */}
      <div className={styles.trackSelectorWrapper}>
        <button 
          className={styles.trackSelectedBtn}
          onClick={() => setShowTrackSelector(!showTrackSelector)}
        >
          <div className={styles.trackSelectedInfo}>
            <span className={styles.trackSelectedName}>{selectedTrack?.name || 'Select Track'}</span>
            <span className={styles.trackSelectedMeta}>
              {selectedTrack?.city && selectedTrack?.state 
                ? `${selectedTrack.city}, ${selectedTrack.state}` 
                : selectedTrack?.state || selectedTrack?.country}
              {selectedTrack?.length && ` • ${selectedTrack.length} mi • ${selectedTrack.corners} turns`}
            </span>
          </div>
          <Icons.chevronDown size={16} />
        </button>
        
        {/* Track Details - Always visible when track selected */}
        {selectedTrack && (
          <div className={styles.trackDetails}>
            <div className={styles.trackDetailGrid}>
              {selectedTrack.longestStraight && (
                <div className={styles.trackDetailItem}>
                  <span className={styles.trackDetailLabel}>Straight</span>
                  <span className={styles.trackDetailValue}>{selectedTrack.longestStraight.toLocaleString()} ft</span>
                </div>
              )}
              {selectedTrack.elevationChange && (
                <div className={styles.trackDetailItem}>
                  <span className={styles.trackDetailLabel}>Elevation</span>
                  <span className={styles.trackDetailValue}>{selectedTrack.elevationChange} ft</span>
                </div>
              )}
              {selectedTrack.surfaceType && (
                <div className={styles.trackDetailItem}>
                  <span className={styles.trackDetailLabel}>Surface</span>
                  <span className={styles.trackDetailValue}>{selectedTrack.surfaceType}</span>
                </div>
              )}
            </div>
            {selectedTrack.characterTags?.length > 0 && (
              <div className={styles.trackTags}>
                {selectedTrack.characterTags.slice(0, 4).map(tag => (
                  <span key={tag} className={styles.trackTag}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Dropdown */}
        {showTrackSelector && (
          <div className={styles.trackDropdown}>
            <div className={styles.trackSearchContainer}>
              <Icons.search size={14} />
              <input
                type="text"
                className={styles.trackSearchInput}
                placeholder="Search 100 tracks..."
                value={trackSearch}
                onChange={(e) => setTrackSearch(e.target.value)}
                autoFocus
              />
              {trackSearch && (
                <button 
                  className={styles.trackClearBtn}
                  onClick={() => setTrackSearch('')}
                >
                  <Icons.x size={12} />
                </button>
              )}
            </div>
            
            {/* Popular tracks when no search */}
            {!trackSearch && (
              <div className={styles.trackQuickPicks}>
                <span className={styles.trackQuickLabel}>Popular Tracks</span>
                {popularTracks.slice(0, 6).map((t) => (
                  <button
                    key={t.slug}
                    className={`${styles.trackResultItem} ${selectedTrackSlug === t.slug ? styles.trackResultItemActive : ''}`}
                    onClick={() => { setSelectedTrackSlug(t.slug); setShowTrackSelector(false); }}
                  >
                    <div className={styles.trackResultInfo}>
                      <span className={styles.trackResultName}>{t.name}</span>
                      <span className={styles.trackResultMeta}>
                        {t.city && t.state ? `${t.city}, ${t.state}` : t.state}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* All tracks / Search results */}
            <div className={styles.trackResultsSection}>
              <span className={styles.trackQuickLabel}>
                {trackSearch ? `Results for "${trackSearch}"` : 'All Tracks'}
              </span>
              <div className={styles.trackResultsList}>
                {(trackSearch ? filteredTracks : tracks).slice(0, 20).map((t) => (
                  <button
                    key={t.slug}
                    className={`${styles.trackResultItem} ${selectedTrackSlug === t.slug ? styles.trackResultItemActive : ''}`}
                    onClick={() => { setSelectedTrackSlug(t.slug); setShowTrackSelector(false); setTrackSearch(''); }}
                  >
                    <div className={styles.trackResultInfo}>
                      <span className={styles.trackResultName}>{t.name}</span>
                      <span className={styles.trackResultMeta}>
                        {t.city && t.state ? `${t.city}, ${t.state}` : t.state || t.country}
                        {t.length && ` • ${t.length} mi`}
                      </span>
                    </div>
                  </button>
                ))}
                {trackSearch && filteredTracks.length === 0 && (
                  <div className={styles.trackNoResults}>
                    No tracks found for "{trackSearch}"
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lap Time Comparison */}
      <div className={styles.lapTimeBody}>
        <div className={styles.lapTimeComparison}>
          <div className={styles.lapTimeColumn}>
            <span className={styles.lapTimeLabel}>Stock</span>
            <span className={styles.lapTimeStock}>{formatTime(stockLapTime)}</span>
          </div>
          <div className={styles.lapTimeDelta}>
            <Icons.chevronsRight size={20} />
            <span className={`${styles.lapTimeImprovement} ${realizedTotal > 0.5 ? styles.lapTimeGood : ''}`}>
              {realizedTotal >= 0.01 ? `-${realizedTotal.toFixed(2)}s` : '0.00s'}
            </span>
          </div>
          <div className={styles.lapTimeColumn}>
            <span className={styles.lapTimeLabel}>Modified</span>
            <span className={styles.lapTimeMod}>{formatTime(moddedLapTime)}</span>
          </div>
        </div>

        <div className={styles.lapTimeTrackInfo}>
          <span>{track.name}</span>
          <span>•</span>
          <span>{track.length} mi</span>
          <span>•</span>
          <span>{track.corners} corners</span>
        </div>
      </div>

      {/* Gains Breakdown - Shows how mods translate to time */}
      {theoreticalTotal > 0.1 && (
        <div className={styles.lapTimeBreakdown}>
          <div className={styles.lapTimeBreakdownRow}>
            <span>Theoretical mod gains (Pro driver):</span>
            <span className={styles.lapTimeTheoretical}>-{theoreticalTotal.toFixed(2)}s</span>
          </div>
          <div className={styles.lapTimeBreakdownRow}>
            <span>Your realized gains ({Math.round(avgUtilization)}%):</span>
            <span className={styles.lapTimeRealized}>-{realizedTotal.toFixed(2)}s</span>
          </div>
          {unrealizedGains > 0.3 && (
            <div className={styles.lapTimeBreakdownRow}>
              <span>Left on table (skill limit):</span>
              <span className={styles.lapTimeUnrealized}>{unrealizedGains.toFixed(2)}s</span>
            </div>
          )}
        </div>
      )}

      {/* Category Breakdown - What's contributing */}
      {theoreticalTotal > 0.5 && (
        <div className={styles.lapTimeCategoryBreakdown}>
          <div className={styles.lapTimeCategoryTitle}>Where your gains come from:</div>
          <div className={styles.lapTimeCategoryGrid}>
            {modImprovements.power > 0.1 && (
              <div className={styles.lapTimeCategoryItem}>
                <span className={styles.lapTimeCategoryLabel}>Power</span>
                <span className={styles.lapTimeCategoryValue}>-{realizedByCategory.power.toFixed(1)}s</span>
              </div>
            )}
            {modImprovements.grip > 0.1 && (
              <div className={styles.lapTimeCategoryItem}>
                <span className={styles.lapTimeCategoryLabel}>Tires</span>
                <span className={styles.lapTimeCategoryValue}>-{realizedByCategory.grip.toFixed(1)}s</span>
              </div>
            )}
            {modImprovements.suspension > 0.1 && (
              <div className={styles.lapTimeCategoryItem}>
                <span className={styles.lapTimeCategoryLabel}>Suspension</span>
                <span className={styles.lapTimeCategoryValue}>-{realizedByCategory.suspension.toFixed(1)}s</span>
              </div>
            )}
            {modImprovements.brakes > 0.1 && (
              <div className={styles.lapTimeCategoryItem}>
                <span className={styles.lapTimeCategoryLabel}>Brakes</span>
                <span className={styles.lapTimeCategoryValue}>-{realizedByCategory.brakes.toFixed(1)}s</span>
              </div>
            )}
            {modImprovements.aero > 0.1 && (
              <div className={styles.lapTimeCategoryItem}>
                <span className={styles.lapTimeCategoryLabel}>Aero</span>
                <span className={styles.lapTimeCategoryValue}>-{realizedByCategory.aero.toFixed(1)}s</span>
              </div>
            )}
            {modImprovements.weight > 0.1 && (
              <div className={styles.lapTimeCategoryItem}>
                <span className={styles.lapTimeCategoryLabel}>Weight</span>
                <span className={styles.lapTimeCategoryValue}>-{realizedByCategory.weight.toFixed(1)}s</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Driver Skill Insight */}
      <div className={styles.lapTimeTip}>
        <span>{skill.tip}</span>
      </div>
      
      {/* Additional insight when leaving gains on table */}
      {unrealizedGains > 1.0 && driverSkill !== 'professional' && (
        <div className={styles.lapTimeInsight}>
          <Icons.info size={12} />
          <span>{skill.insight}</span>
        </div>
      )}
      
      {/* ========== TRACK TIME LOGGING SECTION ========== */}
      {user && (
        <div className={styles.trackTimeLogging}>
          <div className={styles.trackTimeActions}>
            <button 
              className={`${styles.trackTimeBtn} ${showLogForm ? styles.trackTimeBtnActive : ''}`}
              onClick={() => { setShowLogForm(!showLogForm); setShowHistory(false); }}
            >
              <Icons.plus size={14} />
              Log Your Time
            </button>
            <button 
              className={`${styles.trackTimeBtn} ${showHistory ? styles.trackTimeBtnActive : ''}`}
              onClick={() => { setShowHistory(!showHistory); setShowLogForm(false); }}
            >
              <Icons.clock size={14} />
              History
            </button>
          </div>
          
          {/* Log Form */}
          {showLogForm && (
            <div className={styles.logTimeForm}>
              <div className={styles.logTimeHeader}>
                <h4>Log Track Time at {selectedTrack.name}</h4>
                <p>Record your actual lap time to compare with estimates</p>
              </div>
              
              <div className={styles.logTimeFields}>
                <div className={styles.logTimeRow}>
                  <label className={styles.logTimeLabel}>Lap Time</label>
                  <div className={styles.logTimeInputGroup}>
                    <input
                      type="number"
                      className={styles.logTimeInput}
                      placeholder="0"
                      min="0"
                      max="20"
                      value={logForm.lapTimeMinutes}
                      onChange={(e) => setLogForm({ ...logForm, lapTimeMinutes: e.target.value })}
                    />
                    <span className={styles.logTimeInputLabel}>min</span>
                    <input
                      type="number"
                      className={styles.logTimeInput}
                      placeholder="00.00"
                      min="0"
                      max="59.99"
                      step="0.01"
                      value={logForm.lapTimeSeconds}
                      onChange={(e) => setLogForm({ ...logForm, lapTimeSeconds: e.target.value })}
                    />
                    <span className={styles.logTimeInputLabel}>sec</span>
                  </div>
                </div>
                
                <div className={styles.logTimeRow}>
                  <label className={styles.logTimeLabel}>Date</label>
                  <input
                    type="date"
                    className={styles.logTimeDateInput}
                    value={logForm.sessionDate}
                    onChange={(e) => setLogForm({ ...logForm, sessionDate: e.target.value })}
                  />
                </div>
                
                <div className={styles.logTimeRow}>
                  <label className={styles.logTimeLabel}>Conditions</label>
                  <select
                    className={styles.logTimeSelect}
                    value={logForm.conditions}
                    onChange={(e) => setLogForm({ ...logForm, conditions: e.target.value })}
                  >
                    <option value="dry">Dry</option>
                    <option value="damp">Damp</option>
                    <option value="wet">Wet</option>
                    <option value="cold">Cold Track</option>
                    <option value="hot">Hot Track</option>
                    <option value="optimal">Optimal</option>
                  </select>
                </div>
                
                <div className={styles.logTimeRow}>
                  <label className={styles.logTimeLabel}>Notes</label>
                  <textarea
                    className={styles.logTimeTextarea}
                    placeholder="How did the car feel? Any issues? What worked well?"
                    value={logForm.notes}
                    onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>
              
              <div className={styles.logTimeCompare}>
                <div className={styles.logTimeCompareItem}>
                  <span className={styles.logTimeCompareLabel}>Estimated time:</span>
                  <span className={styles.logTimeCompareValue}>{formatTime(moddedLapTime)}</span>
                </div>
                {logForm.lapTimeMinutes || logForm.lapTimeSeconds ? (
                  <div className={styles.logTimeCompareItem}>
                    <span className={styles.logTimeCompareLabel}>Your time:</span>
                    <span className={styles.logTimeCompareValue}>
                      {formatLapTime((parseInt(logForm.lapTimeMinutes || '0', 10) * 60) + parseFloat(logForm.lapTimeSeconds || '0'))}
                    </span>
                  </div>
                ) : null}
              </div>
              
              <button 
                className={styles.logTimeSaveBtn}
                onClick={handleLogTime}
                disabled={isSaving || (!logForm.lapTimeMinutes && !logForm.lapTimeSeconds)}
              >
                {isSaving ? 'Saving...' : 'Save Track Time'}
              </button>
            </div>
          )}
          
          {/* History Panel */}
          {showHistory && (
            <div className={styles.trackHistoryPanel}>
              <div className={styles.trackHistoryHeader}>
                <h4>Your Track Times</h4>
                {trackHistory.length >= 2 && (
                  <button 
                    className={styles.trackAnalyzeBtn}
                    onClick={requestAnalysis}
                    disabled={isLoading}
                  >
                    <Icons.brain size={14} />
                    {isLoading ? 'Analyzing...' : 'Get AL Insights'}
                  </button>
                )}
              </div>
              
              {isLoading && trackHistory.length === 0 ? (
                <div className={styles.trackHistoryLoading}>Loading...</div>
              ) : trackHistory.length === 0 ? (
                <div className={styles.trackHistoryEmpty}>
                  <p>No track times logged yet.</p>
                  <p>Log your first time to start tracking your progress!</p>
                </div>
              ) : (
                <div className={styles.trackHistoryList}>
                  {trackHistory.map((time, idx) => (
                    <div key={time.id || idx} className={styles.trackHistoryItem}>
                      <div className={styles.trackHistoryItemMain}>
                        <span className={styles.trackHistoryTrack}>{time.track_name}</span>
                        <span className={styles.trackHistoryTime}>{formatLapTime(time.lap_time_seconds)}</span>
                      </div>
                      <div className={styles.trackHistoryItemMeta}>
                        <span>{new Date(time.session_date).toLocaleDateString()}</span>
                        {time.conditions && time.conditions !== 'dry' && (
                          <span className={styles.trackHistoryCondition}>{time.conditions}</span>
                        )}
                        {time.improvement_from_previous > 0 && (
                          <span className={styles.trackHistoryImprovement}>
                            ↓ {time.improvement_from_previous.toFixed(2)}s
                          </span>
                        )}
                      </div>
                      {time.notes && (
                        <div className={styles.trackHistoryNotes}>{time.notes}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* AL Analysis Results */}
              {analysis && (
                <div className={styles.trackAnalysis}>
                  <div className={styles.trackAnalysisHeader}>
                    <Icons.brain size={16} />
                    <span>AL Analysis</span>
                  </div>
                  
                  {analysis.insights && analysis.insights.length > 0 && (
                    <div className={styles.trackAnalysisSection}>
                      <h5>Insights</h5>
                      {analysis.insights.map((insight, idx) => (
                        <div key={idx} className={`${styles.trackAnalysisItem} ${styles[`trackAnalysis${insight.type}`]}`}>
                          {insight.message}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {analysis.recommendations && analysis.recommendations.length > 0 && (
                    <div className={styles.trackAnalysisSection}>
                      <h5>Recommendations</h5>
                      {analysis.recommendations.map((rec, idx) => (
                        <div key={idx} className={styles.trackAnalysisRec}>
                          <strong>{rec.title}</strong>
                          <p>{rec.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {analysis.skillAssessment?.estimatedVsActual && (
                    <div className={styles.trackAnalysisSection}>
                      <h5>Skill Assessment</h5>
                      <p>{analysis.skillAssessment.estimatedVsActual.message}</p>
                      {analysis.skillAssessment.estimatedVsActual.suggestedSkillLevel && (
                        <p className={styles.trackAnalysisSuggestion}>
                          Suggested skill level: <strong>{analysis.skillAssessment.estimatedVsActual.suggestedSkillLevel}</strong>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Handling Balance Indicator - Shows understeer/oversteer tendency
 */
function HandlingBalanceIndicator({ suspensionSetup, aeroSetup, tireCompound, drivetrain }) {
  // Calculate handling balance based on setup
  const calculateBalance = () => {
    let balance = 0; // -100 = understeer, +100 = oversteer, 0 = neutral
    
    // Drivetrain base tendency
    const drivetrainEffect = { 'FWD': -20, 'RWD': 15, 'AWD': -5 }[drivetrain] || 0;
    balance += drivetrainEffect;
    
    // Sway bar balance
    if (suspensionSetup?.swayBarFront === 'adjustable' && suspensionSetup?.swayBarRear !== 'adjustable') {
      balance -= 10; // Stiffer front = understeer
    }
    if (suspensionSetup?.swayBarRear === 'adjustable' && suspensionSetup?.swayBarFront !== 'adjustable') {
      balance += 10; // Stiffer rear = oversteer
    }
    if (suspensionSetup?.swayBarRear === 'removed') {
      balance -= 15; // No rear sway = understeer
    }
    
    // Aero balance
    if (aeroSetup?.rearWing?.includes('gt-wing')) {
      balance -= 8; // Rear downforce = understeer at high speed
    }
    if (aeroSetup?.frontSplitter === 'splitter-rods') {
      balance += 5; // Front downforce = more rotation
    }
    
    // Alignment
    const alignmentEffect = {
      'stock': 0, 'street': -5, 'aggressive': -10, 'track': -15
    }[suspensionSetup?.alignment] || 0;
    balance += alignmentEffect;
    
    return Math.max(-100, Math.min(100, balance));
  };
  
  const balance = calculateBalance();
  const balanceLabel = balance < -30 ? 'Understeer' : balance > 30 ? 'Oversteer' : 'Neutral';
  const balanceColor = Math.abs(balance) < 30 ? '#10b981' : Math.abs(balance) < 60 ? '#f59e0b' : '#ef4444';
  
  return (
    <div className={styles.handlingBalance}>
      <div className={styles.handlingBalanceHeader}>
        <Icons.target size={16} />
        <span>Handling Balance</span>
        <span className={styles.handlingBalanceLabel} style={{ color: balanceColor }}>
          {balanceLabel}
        </span>
      </div>
      
      <div className={styles.balanceTrack}>
        <span className={styles.balanceEndLabel}>Understeer</span>
        <div className={styles.balanceBar}>
          <div 
            className={styles.balanceIndicator}
            style={{ 
              left: `${50 + (balance / 2)}%`,
              backgroundColor: balanceColor 
            }}
          />
          <div className={styles.balanceCenter} />
        </div>
        <span className={styles.balanceEndLabel}>Oversteer</span>
      </div>
      
      <div className={styles.balanceTips}>
        {balance < -40 && (
          <span><Icons.info size={12} /> Stiffen rear sway bar or soften front to reduce understeer</span>
        )}
        {balance > 40 && (
          <span><Icons.info size={12} /> Stiffen front sway bar or add rear aero to reduce oversteer</span>
        )}
        {Math.abs(balance) <= 40 && (
          <span><Icons.check size={12} /> Well-balanced setup for spirited driving</span>
        )}
      </div>
    </div>
  );
}

/**
 * Aero Balance Chart - Shows downforce at different speeds
 */
function AeroBalanceChart({ aeroSetup, weight }) {
  const speeds = [60, 80, 100, 120, 140];
  
  // Calculate downforce at speed (simplified)
  const calculateDownforce = (speed, setup) => {
    // Base drag coefficient
    let cd = 0.32;
    let cl = 0; // Lift coefficient (negative = downforce)
    
    if (setup?.frontSplitter === 'lip') cl -= 0.02;
    if (setup?.frontSplitter === 'splitter') cl -= 0.05;
    if (setup?.frontSplitter === 'splitter-rods') cl -= 0.08;
    
    if (setup?.rearWing === 'lip-spoiler') cl -= 0.02;
    if (setup?.rearWing === 'duckbill') cl -= 0.04;
    if (setup?.rearWing === 'gt-wing-low') cl -= 0.12;
    if (setup?.rearWing === 'gt-wing-high') cl -= 0.18;
    
    if (setup?.diffuser) cl -= 0.04;
    if (setup?.flatBottom) { cl -= 0.03; cd -= 0.02; }
    if (setup?.canards) cl -= 0.02;
    
    // Downforce in lbs: F = 0.5 * rho * v^2 * A * Cl
    // Simplified: ~0.0026 * v^2 * Cl * frontalArea(22 sqft)
    const frontalArea = 22;
    const speedMs = speed * 0.44704; // mph to m/s
    const downforceLbs = 0.5 * 1.225 * speedMs * speedMs * frontalArea * Math.abs(cl) * 2.205;
    
    // Drag power loss in hp: P = F * v
    const dragForce = 0.5 * 1.225 * speedMs * speedMs * frontalArea * cd;
    const dragPowerHp = (dragForce * speedMs) / 745.7;
    
    return { downforce: Math.round(downforceLbs), dragHp: Math.round(dragPowerHp) };
  };
  
  const aeroData = speeds.map(speed => ({
    speed,
    ...calculateDownforce(speed, aeroSetup)
  }));
  
  const maxDownforce = Math.max(...aeroData.map(d => d.downforce), 1);
  const hasAero = aeroSetup && (aeroSetup.frontSplitter !== 'none' || aeroSetup.rearWing !== 'none');
  
  return (
    <div className={styles.aeroBalance}>
      <div className={styles.aeroBalanceHeader}>
        <Icons.wind size={16} />
        <span>Aero at Speed</span>
      </div>
      
      {!hasAero ? (
        <div className={styles.aeroEmpty}>
          <Icons.alertCircle size={24} />
          <span>No aero modifications selected</span>
          <span className={styles.aeroEmptyHint}>Add splitter, wing, or diffuser to see downforce data</span>
        </div>
      ) : (
        <>
          <div className={styles.aeroChart}>
            {aeroData.map((data, i) => (
              <div key={data.speed} className={styles.aeroBar}>
                <div className={styles.aeroBarLabel}>{data.speed}</div>
                <div className={styles.aeroBarTrack}>
                  <div 
                    className={styles.aeroBarFill}
                    style={{ height: `${(data.downforce / maxDownforce) * 100}%` }}
                  />
                </div>
                <div className={styles.aeroBarValue}>{data.downforce} lbs</div>
              </div>
            ))}
          </div>
          
          <div className={styles.aeroStats}>
            <div className={styles.aeroStat}>
              <span className={styles.aeroStatValue}>{aeroData[4]?.downforce || 0}</span>
              <span className={styles.aeroStatLabel}>lbs @ 140mph</span>
            </div>
            <div className={styles.aeroStat}>
              <span className={styles.aeroStatValue}>{aeroData[4]?.dragHp || 0}</span>
              <span className={styles.aeroStatLabel}>hp drag loss</span>
            </div>
            <div className={styles.aeroStat}>
              <span className={styles.aeroStatValue}>
                {((aeroData[4]?.downforce || 0) / (weight || 3500) * 100).toFixed(1)}%
              </span>
              <span className={styles.aeroStatLabel}>of vehicle weight</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Power Limits Advisory - Shows component limits from database
 * 
 * CONFIDENCE: This is community-reported data, NOT OEM engineering specs.
 * Should be treated as rough estimates based on enthusiast experience.
 */
function PowerLimitsAdvisory({ powerLimits, currentHp }) {
  if (!powerLimits || Object.keys(powerLimits).length === 0) return null;
  
  // Sort limits by value ascending (weakest first)
  const sortedLimits = Object.entries(powerLimits)
    .filter(([_, value]) => typeof value === 'number')
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5);
  
  if (sortedLimits.length === 0) return null;
  
  // User-friendly labels for component limits
  // Maps both snake_case keys and their _hp/_tq/_whp variants
  const limitLabels = {
    // Drivetrain
    stock_transmission: 'Transmission',
    stock_transmission_tq: 'Transmission',
    stock_dsg: 'DSG Gearbox',
    stock_dsg_tq: 'DSG Gearbox',
    stock_clutch: 'Clutch',
    stock_clutch_tq: 'Clutch',
    stock_driveshaft: 'Driveshaft',
    stock_driveshaft_tq: 'Driveshaft',
    stock_axles: 'Axles (CV Shafts)',
    stock_axles_tq: 'Axles (CV Shafts)',
    stock_differential: 'Differential',
    stock_differential_tq: 'Differential',
    // Engine internals
    stock_internals: 'Engine Internals',
    stock_internals_hp: 'Engine Internals',
    stock_internals_whp: 'Engine Internals',
    stock_rods: 'Connecting Rods',
    stock_rods_hp: 'Connecting Rods',
    stock_pistons: 'Pistons',
    stock_pistons_hp: 'Pistons',
    stock_head_gasket: 'Head Gasket',
    stock_valvetrain: 'Valvetrain',
    stock_block: 'Engine Block',
    block: 'Engine Block',
    internals: 'Engine Internals',
    // Forced induction
    stock_turbo: 'Stock Turbo',
    stock_turbo_whp: 'Stock Turbo',
    is38_turbo: 'IS38 Turbo',
    // Fuel system
    stock_fuel_system: 'Fuel System',
    stock_fuel_system_hp: 'Fuel System',
    stock_injectors: 'Fuel Injectors',
    stock_fuel_pump: 'Fuel Pump',
  };
  
  // Get clean label for a key
  const getLabel = (key) => {
    if (limitLabels[key]) return limitLabels[key];
    // Fallback: clean up key for display
    return key
      .replace(/^stock_/, '')
      .replace(/_(hp|tq|whp)$/, '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };
  
  return (
    <div className={styles.powerLimits}>
      <div className={styles.powerLimitsHeader}>
        <Icons.alertTriangle size={16} />
        <span>Estimated Component Limits</span>
        <span className={styles.powerLimitsDisclaimer}>Community estimates</span>
      </div>
      
      <div className={styles.powerLimitsList}>
        {sortedLimits.map(([key, limit]) => {
          const isAtRisk = currentHp >= limit * 0.9;
          const isOverLimit = currentHp >= limit;
          
          return (
            <div 
              key={key} 
              className={`${styles.powerLimitItem} ${isOverLimit ? styles.overLimit : isAtRisk ? styles.atRisk : ''}`}
            >
              <span className={styles.powerLimitLabel}>
                {getLabel(key)}
              </span>
              <div className={styles.powerLimitBar}>
                <div 
                  className={styles.powerLimitFill}
                  style={{ width: `${Math.min(100, (currentHp / limit) * 100)}%` }}
                />
              </div>
              <span className={styles.powerLimitValue}>
                ~{limit} hp
                {isOverLimit && <Icons.alertTriangle size={12} />}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className={styles.powerLimitsFooter}>
        <Icons.info size={12} />
        Based on community reports. Actual limits vary by driving style, tune quality, and supporting mods.
      </div>
    </div>
  );
}

/**
 * Brand Recommendations - Shows popular brands from database
 */
function BrandRecommendations({ brandRecs, category = 'all' }) {
  if (!brandRecs || Object.keys(brandRecs).length === 0) return null;
  
  // Map category keys to display names
  const categoryLabels = {
    turbo: 'Turbo/SC', exhaust: 'Exhaust', intake: 'Intake',
    suspension: 'Suspension', brakes: 'Brakes', wheels: 'Wheels',
    ecu: 'ECU Tuning', fuel: 'Fuel System', clutch: 'Clutch',
  };
  
  const filteredRecs = category === 'all' 
    ? brandRecs 
    : { [category]: brandRecs[category] };
  
  return (
    <div className={styles.brandRecs}>
      <div className={styles.brandRecsHeader}>
        <Icons.star size={16} />
        <span>Popular Brands</span>
      </div>
      
      <div className={styles.brandRecsList}>
        {Object.entries(filteredRecs).map(([cat, brands]) => {
          if (!brands || !Array.isArray(brands) || brands.length === 0) return null;
          
          return (
            <div key={cat} className={styles.brandRecCategory}>
              <span className={styles.brandRecCategoryLabel}>
                {categoryLabels[cat] || cat}
              </span>
              <div className={styles.brandRecBrands}>
                {brands.slice(0, 4).map(brand => (
                  <span key={brand} className={styles.brandRecBrand}>{brand}</span>
                ))}
              </div>
            </div>
          );
        })}
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
 * Shows inline configuration panel for upgrades with configOptions
 */
function CategoryPopup({ 
  category, 
  upgrades, 
  selectedModules, 
  onToggle, 
  onClose, 
  onInfoClick, 
  isCustomMode, 
  allUpgrades,
  upgradeConfigs,       // Config state for all upgrades
  onConfigChange,       // Handler for config changes
}) {
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
            const hasConfigOptions = upgrade.configOptions && Object.keys(upgrade.configOptions).length > 0;
            const currentConfig = upgradeConfigs?.[upgrade.key] || {};
            
            // Calculate HP modifier from config
            const configHpMod = isSelected && hasConfigOptions 
              ? calculateConfigHpModifier(upgrade.configOptions, currentConfig)
              : 0;
            const baseHpGain = upgrade.metricChanges?.hpGain || 0;
            const totalHpGain = baseHpGain + configHpMod;
            
            return (
              <div 
                key={upgrade.key} 
                className={`${styles.upgradeRow} ${isSelected ? styles.upgradeRowSelected : ''} ${hasConflict ? styles.upgradeRowConflict : ''}`}
              >
                <div className={styles.upgradeMainRow}>
                  <button
                    type="button"
                    className={styles.upgradeToggle}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Pass the full upgrade object so we can check for configOptions
                      onToggle(upgrade.key, upgrade.name, replacementInfo, upgrade);
                    }}
                    aria-label={`${isSelected ? 'Deselect' : 'Select'} ${upgrade.name}`}
                    aria-checked={isSelected}
                    role="checkbox"
                  >
                    <span className={styles.checkbox} aria-hidden="true">
                      {isSelected && <Icons.check size={10} />}
                    </span>
                    <span className={styles.upgradeName}>{upgrade.name}</span>
                    {totalHpGain > 0 && (
                      <span className={`${styles.upgradeGain} ${configHpMod > 0 ? styles.upgradeGainBoosted : ''}`}>
                        +{totalHpGain}hp
                        {configHpMod > 0 && <span className={styles.configBoost}>*</span>}
                      </span>
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
                
                {/* Inline config panel - shows when upgrade is selected and has configOptions */}
                {isSelected && hasConfigOptions && (
                  <UpgradeConfigPanel
                    upgradeKey={upgrade.key}
                    configOptions={upgrade.configOptions}
                    currentConfig={currentConfig}
                    onChange={onConfigChange}
                    selectedUpgrades={selectedModules}
                  />
                )}
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
  
  // Vehicle-specific tuning profile (safe additive enhancement)
  const { profile: tuningProfile, hasProfile: hasTuningProfile, loading: tuningProfileLoading } = useTuningProfile(car);
  
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
  
  // Upgrade configurations - stores config for upgrades with configOptions
  // e.g., { 'downpipe': { type: 'catless' }, 'coilovers': { springRate: 'sport' } }
  const [upgradeConfigs, setUpgradeConfigs] = useState({});
  
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
  
  // Tuner Mode: 'basic' or 'advanced' - advanced shows physics-based projections
  const [tunerMode, setTunerMode] = useState('basic');
  
  // Advanced Tuning section collapsed state (for power users who want deep customization)
  const [advancedTuningExpanded, setAdvancedTuningExpanded] = useState(false);

  // Advanced mode state - detailed build specs for physics model
  const [advancedSpecs, setAdvancedSpecs] = useState({
    engine: { 
      type: 'stock', // stock, built, stroked
      cams: 'stock', // stock, stage1, stage2, stage3
      camDuration: null, // intake duration @ 0.050" (for advanced users)
      headWork: false, 
      displacement: 2.0,
      internals: 'stock', // stock, forged
      compression: null, // compression ratio
      valvetrain: 'stock', // stock, upgraded, titanium
      blockType: 'stock', // stock, closed-deck, sleeved
    },
    intake: {
      type: 'stock', // stock, cold-air, short-ram
      throttleBody: 'stock', // stock, ported, oversized
      throttleBodyMm: null, // specific size if known
      manifold: 'stock', // stock, ported, aftermarket
    },
    exhaust: {
      headers: 'stock', // stock, equal-length, long-tube
      downpipe: 'stock', // stock, catted, catless
      downpipeDiameter: null, // 3", 3.5", 4" etc
      catback: 'stock', // stock, axleback, catback, turboback
      exhaustDiameter: null, // main exhaust diameter
    },
    turbo: { 
      type: 'stock', // stock, upgraded, custom
      modelId: null, 
      customModel: '', 
      inducerMm: null, 
      exducerMm: null,
      targetBoostPsi: null,
      peakBoostPsi: null, // peak vs target (taper)
      compressorAR: null, // compressor A/R
      turbineAR: null, // turbine A/R
      twinScroll: false,
      ballBearing: true, // ball bearing vs journal
      wastegate: 'stock', // stock, upgraded, external
      wastegateSpring: null, // spring pressure in PSI
      intercooler: 'stock', // stock, fmic, tmic, air-to-water
      intercoolerSize: null, // core volume in liters
      boostController: 'none', // none, manual, electronic
    },
    fuel: { 
      type: '93', 
      injectorCc: null, 
      fuelPump: '',
      fuelPumpLph: null, // liters per hour flow
      fuelRails: false,
      flexFuel: false,
      baseFuelPressure: null, // base fuel pressure PSI
      returnStyle: false, // return style fuel system
    },
    power_adders: {
      methanol: false, // methanol/water injection
      methanolRatio: null, // methanol percentage (50%, 100%)
      methanolNozzleSize: null, // nozzle size
      nitrous: false,
      nitrousType: 'none', // none, dry, wet
      nitrousShot: null, // shot size in HP
    },
    ecu: {
      type: 'stock', // stock, flash, standalone, piggyback
      ecuBrand: '', // Haltech, AEM, Link, MoTeC, etc.
      tuner: '', // tuner name/company
      dynoTuned: false,
      flexFuelTuned: false,
      boostByGear: false,
      launchControl: false,
      antiLag: false,
    },
    drivetrain: {
      clutch: 'stock', // stock, stage1, stage2, stage3, twin-disc
      flywheel: 'stock', // stock, lightweight, single-mass
      transmission: 'stock', // stock, built, swap
      transType: 'manual', // manual, dct, auto, cvt
      finalDrive: null, // final drive ratio
      differential: 'stock', // stock, lsd, upgraded
      drivetrainLoss: null, // override drivetrain loss %
      torqueConverter: 'stock', // for auto (stock, stall converter)
      stallSpeed: null, // stall converter RPM
    },
    weight: {
      stockWeight: null, // override stock weight
      weightReduction: 0, // lbs removed (negative = added)
      hasRollCage: false,
      strippedInterior: false,
      carbonParts: [], // hood, trunk, roof, fenders
      driverWeight: 180, // driver weight for calcs
    },
    suspension: {
      type: 'stock', // stock, lowering-springs, coilovers, air
      rideHeightDrop: 0, // inches dropped from stock
      springRateFront: null, // lbs/in
      springRateRear: null, // lbs/in
      damperAdjustable: false,
      swayBarFront: 'stock', // stock, upgraded, adjustable
      swayBarRear: 'stock', // stock, upgraded, adjustable, removed
      strutBar: false, // front strut bar
      rearStrutBar: false,
      subframeBrace: false,
      alignment: 'stock', // stock, street, aggressive, track
      camberFront: null, // degrees negative
      camberRear: null,
    },
    brakes: {
      padCompound: 'stock', // stock, street-performance, track, race
      rotorType: 'stock', // stock, slotted, drilled, slotted-drilled, 2-piece
      rotorSizeFront: null, // diameter in mm
      bbkFront: false, // big brake kit
      bbkRear: false,
      caliperPistons: null, // 4, 6, 8 piston
      brakeLine: 'stock', // stock, stainless
      brakeFluid: 'dot3', // dot3, dot4, dot5.1, racing
      brakeDuct: false, // brake cooling ducts
    },
    aero: {
      frontSplitter: 'none', // none, lip, splitter, splitter-rods
      rearWing: 'none', // none, lip-spoiler, duckbill, gt-wing-low, gt-wing-high
      diffuser: false,
      sideSkirts: false,
      canards: false,
      flatBottom: false, // underbody panels
      downforceLevel: 'stock', // stock, mild, moderate, aggressive, max
    },
    wheels: {
      type: 'stock', // stock, aftermarket, forged
      weightPerWheel: null, // lbs per wheel
      widthFront: null, // inches
      widthRear: null, // inches
      diameterFront: null, // inches
      diameterRear: null, // inches
      offsetFront: null, // mm
      offsetRear: null,
      spacers: false,
    },
    tires: {
      compound: 'summer', // all-season, summer, max-performance, r-comp, drag-radial, slick
      width: null, // tire width mm
      aspect: null, // aspect ratio
      diameter: null, // wheel diameter
      tirePressure: null, // hot pressure PSI
    },
    environment: {
      altitude: 0, // feet above sea level
      ambientTemp: 70, // degrees F
      humidity: 50, // percentage
      densityAltitude: null, // calculated or override
    },
    cooling: {
      radiator: 'stock', // stock, aluminum, dual-pass
      radiatorRows: null, // number of rows
      oilCooler: false,
      oilCoolerSize: null, // plate count
      transCooler: false,
      icSprayer: false, // intercooler sprayer
    },
    verified: {
      hasDyno: false,
      whp: null,
      wtq: null,
      dynoType: 'dynojet', // dynojet, mustang, hub
      correctionFactor: 'SAE', // SAE, STD, uncorrected
      dynoShop: '',
      dynoDate: null,
      quarterMile: null,
      quarterMileTrap: null, // trap speed MPH
      sixtyFoot: null, // 60ft time
      zeroToSixty: null,
      zeroToHundred: null,
      rollRace: null, // 40-140, 60-130, etc format
    },
  });
  
  // Turbo library options (loaded from database)
  const [turboOptions, setTurboOptions] = useState([]);
  const [loadingTurbos, setLoadingTurbos] = useState(false);
  
  // Expandable detail sections in Advanced mode
  const [expandedSections, setExpandedSections] = useState({
    engineDetails: false,
    turboDetails: false,
    fuelDetails: false,
    drivetrainDetails: false,
    verifiedDetails: false,
  });
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Defensive: use safe car slug for effects - prevents crashes if car is undefined
  const safeCarSlug = car?.slug || '';

  // Reset upgrade state when car changes
  useEffect(() => {
    setSelectedModules([]);
    setSelectedPackage('stock');
    setCurrentBuildId(null);
    setActiveCategory(null);
    // Reset advanced specs but keep mode
    setAdvancedSpecs({
      engine: { type: 'stock', cams: 'stock', camDuration: null, headWork: false, displacement: 2.0, internals: 'stock', compression: null, valvetrain: 'stock', blockType: 'stock' },
      intake: { type: 'stock', throttleBody: 'stock', throttleBodyMm: null, manifold: 'stock' },
      exhaust: { headers: 'stock', downpipe: 'stock', downpipeDiameter: null, catback: 'stock', exhaustDiameter: null },
      turbo: { type: 'stock', modelId: null, customModel: '', inducerMm: null, exducerMm: null, targetBoostPsi: null, peakBoostPsi: null, compressorAR: null, turbineAR: null, twinScroll: false, ballBearing: true, wastegate: 'stock', wastegateSpring: null, intercooler: 'stock', intercoolerSize: null, boostController: 'none' },
      fuel: { type: '93', injectorCc: null, fuelPump: '', fuelPumpLph: null, fuelRails: false, flexFuel: false, baseFuelPressure: null, returnStyle: false },
      power_adders: { methanol: false, methanolRatio: null, methanolNozzleSize: null, nitrous: false, nitrousType: 'none', nitrousShot: null },
      ecu: { type: 'stock', ecuBrand: '', tuner: '', dynoTuned: false, flexFuelTuned: false, boostByGear: false, launchControl: false, antiLag: false },
      drivetrain: { clutch: 'stock', flywheel: 'stock', transmission: 'stock', transType: 'manual', finalDrive: null, differential: 'stock', drivetrainLoss: null, torqueConverter: 'stock', stallSpeed: null },
      weight: { stockWeight: null, weightReduction: 0, hasRollCage: false, strippedInterior: false, carbonParts: [], driverWeight: 180 },
      suspension: { type: 'stock', rideHeightDrop: 0, springRateFront: null, springRateRear: null, damperAdjustable: false, swayBarFront: 'stock', swayBarRear: 'stock', strutBar: false, rearStrutBar: false, subframeBrace: false, alignment: 'stock', camberFront: null, camberRear: null },
      brakes: { padCompound: 'stock', rotorType: 'stock', rotorSizeFront: null, bbkFront: false, bbkRear: false, caliperPistons: null, brakeLine: 'stock', brakeFluid: 'dot3', brakeDuct: false },
      aero: { frontSplitter: 'none', rearWing: 'none', diffuser: false, sideSkirts: false, canards: false, flatBottom: false, downforceLevel: 'stock' },
      wheels: { type: 'stock', weightPerWheel: null, widthFront: null, widthRear: null, diameterFront: null, diameterRear: null, offsetFront: null, offsetRear: null, spacers: false },
      tires: { compound: 'summer', width: null, aspect: null, diameter: null, tirePressure: null },
      environment: { altitude: 0, ambientTemp: 70, humidity: 50, densityAltitude: null },
      cooling: { radiator: 'stock', radiatorRows: null, oilCooler: false, oilCoolerSize: null, transCooler: false, icSprayer: false },
      verified: { hasDyno: false, whp: null, wtq: null, dynoType: 'dynojet', correctionFactor: 'SAE', dynoShop: '', dynoDate: null, quarterMile: null, quarterMileTrap: null, sixtyFoot: null, zeroToSixty: null, zeroToHundred: null, rollRace: null },
    });
  }, [safeCarSlug]);
  
  // Load turbo options from database when advanced mode is enabled
  useEffect(() => {
    if (tunerMode !== 'advanced' || turboOptions.length > 0) return;
    
    async function loadTurboOptions() {
      setLoadingTurbos(true);
      try {
        const { data, error } = await supabase
          .from('turbo_models')
          .select('*')
          .order('brand')
          .order('model');
        
        if (!error && data) {
          setTurboOptions(data);
        }
      } catch (err) {
        console.error('[UpgradeCenter] Error loading turbo options:', err);
      } finally {
        setLoadingTurbos(false);
      }
    }
    
    loadTurboOptions();
  }, [tunerMode, turboOptions.length]);
  
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
        // Load upgrade configurations (e.g., catless downpipe, coilover spring rates)
        if (build.upgradeConfigs) {
          setUpgradeConfigs(build.upgradeConfigs);
        }
      }
    }
  }, [initialBuildId, getBuildById, safeCarSlug]);
  
  // Load build images when build ID changes
  // Also attempts to load images by car_slug for sharing between garage and tuning shop
  // (car_slug sharing requires migration 089_shared_car_images.sql to be run)
  useEffect(() => {
    async function loadBuildImages() {
      if (!currentBuildId || !supabase) {
        setBuildImages([]);
        return;
      }
      
      try {
        // Fetch images linked to this build (original query - always works)
        const { data: buildData, error: buildError } = await supabase
          .from('user_uploaded_images')
          .select('id, blob_url, thumbnail_url, caption, is_primary, display_order, width, height, media_type, duration_seconds, video_thumbnail_url')
          .eq('user_build_id', currentBuildId)
          .order('is_primary', { ascending: false })
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true });
        
        if (buildError) {
          console.error('[UpgradeCenter] Error loading build images:', buildError);
          setBuildImages([]);
          return;
        }
        
        let allImages = buildData || [];
        const imageIds = new Set(allImages.map(img => img.id));
        
        // Try to also fetch images linked by car_slug (for cross-feature sharing with garage)
        // This query may fail if the migration hasn't been run yet - that's OK
        if (safeCarSlug && user?.id) {
          try {
            const { data: carSlugData, error: carSlugError } = await supabase
              .from('user_uploaded_images')
              .select('id, blob_url, thumbnail_url, caption, is_primary, display_order, width, height, media_type, duration_seconds, video_thumbnail_url')
              .eq('user_id', user.id)
              .eq('car_slug', safeCarSlug)
              .order('is_primary', { ascending: false })
              .order('display_order', { ascending: true })
              .order('created_at', { ascending: true });
            
            // Only add images not already in the list (avoid duplicates)
            if (!carSlugError && carSlugData) {
              carSlugData.forEach(img => {
                if (!imageIds.has(img.id)) {
                  allImages.push(img);
                  imageIds.add(img.id);
                }
              });
            }
          } catch (carSlugErr) {
            // car_slug column may not exist yet - migration not run, ignore
            console.log('[UpgradeCenter] car_slug query skipped (migration not run)');
          }
        }
        
        // Sort by is_primary DESC, then display_order ASC
        allImages.sort((a, b) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;
          return (a.display_order || 0) - (b.display_order || 0);
        });
        
        setBuildImages(allImages);
      } catch (err) {
        console.error('[UpgradeCenter] Error loading build images:', err);
      }
    }
    
    loadBuildImages();
  }, [currentBuildId, safeCarSlug, user?.id]);

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
    
    // Calculate HP bonus from upgrade configurations (e.g., catless downpipe vs catted)
    let configHpBonus = 0;
    effectiveModules.forEach(moduleKey => {
      const upgrade = getUpgradeByKey(moduleKey);
      if (upgrade?.configOptions && upgradeConfigs[moduleKey]) {
        configHpBonus += calculateConfigHpModifier(upgrade.configOptions, upgradeConfigs[moduleKey]);
      }
    });
    
    // Apply config HP bonus to upgraded metrics
    if (configHpBonus > 0) {
      baseProfile.upgradedMetrics = {
        ...baseProfile.upgradedMetrics,
        hp: (baseProfile.upgradedMetrics.hp || 0) + configHpBonus,
      };
    }
    
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
  }, [car, effectiveModules, selectedWheelFitment, upgradeConfigs]);
  
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
  
  // Calculate physics-based HP estimate for advanced mode
  const advancedHpEstimate = useMemo(() => {
    if (tunerMode !== 'advanced') return null;
    
    const stockHp = car?.hp || 300;
    const stockBoost = 21; // Typical turbo car stock boost
    
    // If user has verified dyno results, use them (Tier 1)
    if (advancedSpecs.verified?.hasDyno && advancedSpecs.verified?.whp) {
      return {
        whp: advancedSpecs.verified.whp,
        gain: advancedSpecs.verified.whp - stockHp,
        range: null,
        confidence: 'high',
        confidenceLabel: 'User verified dyno data',
        tier: 1,
      };
    }
    
    // Find selected turbo data
    const selectedTurbo = turboOptions.find(t => t.id === advancedSpecs.turbo?.modelId);
    
    let estimatedWhp = stockHp;
    let range = null;
    let confidence = 'medium';
    let confidenceLabel = 'Physics estimate';
    let calculations = [];
    
    // === ENGINE MULTIPLIER ===
    let engineMultiplier = 1.0;
    if (advancedSpecs.engine?.type === 'built' || advancedSpecs.engine?.type === 'stroked') {
      // Built internals allow more power but don't add directly
      engineMultiplier += 0.02;
      
      // Cams
      if (advancedSpecs.engine.cams === 'stage3') engineMultiplier += 0.12;
      else if (advancedSpecs.engine.cams === 'stage2') engineMultiplier += 0.07;
      else if (advancedSpecs.engine.cams === 'stage1') engineMultiplier += 0.04;
      
      // Valvetrain
      if (advancedSpecs.engine.valvetrain === 'titanium') engineMultiplier += 0.03;
      else if (advancedSpecs.engine.valvetrain === 'upgraded') engineMultiplier += 0.01;
      
      // Head work
      if (advancedSpecs.engine.headWork) engineMultiplier += 0.06;
      
      // Displacement (stroked)
      if (advancedSpecs.engine.type === 'stroked' && advancedSpecs.engine.displacement) {
        const stockDisplacement = 2.0; // Default, ideally from car data
        engineMultiplier *= advancedSpecs.engine.displacement / stockDisplacement;
      }
    }
    
    // === INTAKE & EXHAUST MULTIPLIER ===
    let breathingMultiplier = 1.0;
    
    // Intake
    if (advancedSpecs.intake?.type === 'cold-air') breathingMultiplier += 0.02;
    else if (advancedSpecs.intake?.type === 'short-ram') breathingMultiplier += 0.01;
    
    if (advancedSpecs.intake?.throttleBody === 'oversized') breathingMultiplier += 0.02;
    else if (advancedSpecs.intake?.throttleBody === 'ported') breathingMultiplier += 0.01;
    
    // Exhaust - more significant for power
    if (advancedSpecs.exhaust?.headers === 'long-tube') breathingMultiplier += 0.04;
    else if (advancedSpecs.exhaust?.headers === 'equal-length') breathingMultiplier += 0.02;
    
    // Platform-specific downpipe gains (forum-validated)
    // Some platforms (RS5 2.9T) have efficient factory DPs with minimal gain
    // Others (B58, Evo X) have restrictive factory DPs with good gains
    if (advancedSpecs.exhaust?.downpipe !== 'stock') {
      const platformDpGain = getPlatformDownpipeGain(car);
      const dpMultiplier = platformDpGain / stockHp;
      // Catless adds ~20% more than catted
      if (advancedSpecs.exhaust?.downpipe === 'catless') {
        breathingMultiplier += dpMultiplier * 1.2;
      } else {
        breathingMultiplier += dpMultiplier;
      }
    }
    
    if (advancedSpecs.exhaust?.catback === 'turboback') breathingMultiplier += 0.02;
    else if (advancedSpecs.exhaust?.catback === 'catback') breathingMultiplier += 0.01;
    
    // === FUEL MULTIPLIER ===
    let fuelMultiplier = 1.0;
    if (advancedSpecs.fuel?.type === 'e85') fuelMultiplier = 1.15;
    else if (advancedSpecs.fuel?.type === 'e50') fuelMultiplier = 1.10;
    else if (advancedSpecs.fuel?.type === 'e30') fuelMultiplier = 1.06;
    else if (advancedSpecs.fuel?.type === '91') fuelMultiplier = 0.97;
    
    // Flex fuel with proper injectors enables full E85 potential
    if (advancedSpecs.fuel?.flexFuel && advancedSpecs.fuel?.injectorCc >= 1000) {
      fuelMultiplier *= 1.02; // Additional headroom
    }
    
    // === ECU/TUNING BONUS ===
    let tuneMultiplier = 1.0;
    if (advancedSpecs.ecu?.type === 'standalone') tuneMultiplier += 0.05;
    else if (advancedSpecs.ecu?.type === 'flash') tuneMultiplier += 0.02;
    if (advancedSpecs.ecu?.dynoTuned) tuneMultiplier += 0.02;
    if (advancedSpecs.ecu?.antiLag) tuneMultiplier += 0.02; // Better spool
    
    // === INTERCOOLER EFFICIENCY ===
    let icMultiplier = 1.0;
    if (advancedSpecs.turbo?.intercooler === 'air-to-water') icMultiplier = 1.05;
    else if (advancedSpecs.turbo?.intercooler === 'fmic') icMultiplier = 1.03;
    else if (advancedSpecs.turbo?.intercooler === 'tmic') icMultiplier = 1.01;
    if (advancedSpecs.cooling?.icSprayer) icMultiplier *= 1.02; // IC sprayer bonus
    
    // === POWER ADDERS ===
    let powerAdderHp = 0;
    
    // Methanol injection: +8-15% depending on concentration
    if (advancedSpecs.power_adders?.methanol) {
      const methRatio = advancedSpecs.power_adders.methanolRatio || '50';
      if (methRatio === '100') powerAdderHp += stockHp * 0.15;
      else if (methRatio === '50') powerAdderHp += stockHp * 0.10;
      else if (methRatio === '30') powerAdderHp += stockHp * 0.06;
      else powerAdderHp += stockHp * 0.03; // Water only - cooling benefit
    }
    
    // Nitrous: direct HP addition
    if (advancedSpecs.power_adders?.nitrous && advancedSpecs.power_adders.nitrousShot) {
      powerAdderHp += advancedSpecs.power_adders.nitrousShot;
    }
    
    // === ENVIRONMENT CORRECTION ===
    let environmentMultiplier = 1.0;
    const altitude = advancedSpecs.environment?.altitude || 0;
    const ambientTemp = advancedSpecs.environment?.ambientTemp || 70;
    
    // Altitude correction: ~3% loss per 1000ft for turbo cars (less than NA)
    // Turbo can compensate somewhat, but intercooler efficiency drops
    if (altitude > 0) {
      const altitudeLoss = (altitude / 1000) * 0.02; // 2% per 1000ft for turbo
      environmentMultiplier *= (1 - altitudeLoss);
    }
    
    // Temperature correction: ~1% loss per 10°F above 60°F
    if (ambientTemp > 60) {
      const tempLoss = ((ambientTemp - 60) / 10) * 0.01;
      environmentMultiplier *= (1 - Math.min(tempLoss, 0.15)); // Cap at 15% loss
    }
    
    // === TURBO CALCULATION ===
    if (advancedSpecs.turbo?.type === 'upgraded' || advancedSpecs.turbo?.type === 'custom') {
      // Method 1: Turbo library data (best)
      if (selectedTurbo && selectedTurbo.flow_hp_min && selectedTurbo.flow_hp_max) {
        const turboEfficiency = advancedSpecs.turbo?.ballBearing !== false ? 0.78 : 0.72; // Journal bearing less efficient
        const allMultipliers = engineMultiplier * breathingMultiplier * fuelMultiplier * tuneMultiplier * icMultiplier * environmentMultiplier;
        const flowMidpoint = (selectedTurbo.flow_hp_min + selectedTurbo.flow_hp_max) / 2;
        const turboHp = Math.round((flowMidpoint * turboEfficiency * allMultipliers) + powerAdderHp);
        
        calculations.push({ method: 'turbo_flow', hp: turboHp, weight: 0.4 });
        
        range = {
          low: Math.round((selectedTurbo.flow_hp_min * turboEfficiency * fuelMultiplier * 0.95 * environmentMultiplier) + powerAdderHp),
          high: Math.round((selectedTurbo.flow_hp_max * turboEfficiency * allMultipliers) + powerAdderHp),
        };
        confidence = 'high';
        confidenceLabel = `Based on ${selectedTurbo.model} flow`;
      }
      
      // Method 2: Inducer size
      if (advancedSpecs.turbo.inducerMm) {
        const inducer = advancedSpecs.turbo.inducerMm;
        const hpPotential = Math.pow(inducer / 50, 2.3) * 400;
        const allMultipliers = engineMultiplier * breathingMultiplier * fuelMultiplier * tuneMultiplier * icMultiplier * environmentMultiplier;
        const inducerHp = Math.round((hpPotential * allMultipliers * 0.85) + powerAdderHp);
        calculations.push({ method: 'inducer', hp: inducerHp, weight: 0.25 });
        
        if (!range) {
          range = { low: Math.round(inducerHp * 0.88), high: Math.round(inducerHp * 1.08) };
        }
        
        if (confidence !== 'high') {
          confidenceLabel = `${inducer}mm inducer estimate`;
        }
      }
      
      // Method 3: Target boost pressure ratio
      if (advancedSpecs.turbo.targetBoostPsi) {
        const pr = (14.7 + advancedSpecs.turbo.targetBoostPsi) / (14.7 + stockBoost);
        const boostGain = (pr - 1) * 0.70;
        const allMultipliers = engineMultiplier * breathingMultiplier * fuelMultiplier * tuneMultiplier * icMultiplier * environmentMultiplier;
        const boostHp = Math.round((stockHp * (1 + boostGain) * allMultipliers) + powerAdderHp);
        calculations.push({ method: 'boost', hp: boostHp, weight: 0.25 });
        
        if (confidence !== 'high') {
          confidenceLabel = `@ ${advancedSpecs.turbo.targetBoostPsi} PSI`;
        }
      }
      
      // Generic fallback
      if (calculations.length === 0) {
        const genericMult = advancedSpecs.turbo.type === 'custom' ? 1.8 : 1.5;
        const allMultipliers = engineMultiplier * breathingMultiplier * fuelMultiplier * tuneMultiplier * icMultiplier * environmentMultiplier;
        estimatedWhp = Math.round((stockHp * genericMult * allMultipliers) + powerAdderHp);
        confidence = 'low';
        confidenceLabel = 'Select turbo for better estimate';
      }
    } else {
      // No turbo upgrade - use actual module HP gains from selected upgrades
      const allMultipliers = engineMultiplier * breathingMultiplier * fuelMultiplier * tuneMultiplier * environmentMultiplier;
      
      // Calculate actual HP gains from selected modules
      let moduleHpGain = 0;
      effectiveModules.forEach(moduleKey => {
        const upgrade = getUpgradeByKey(moduleKey);
        if (upgrade?.metricChanges?.hpGain) {
          moduleHpGain += upgrade.metricChanges.hpGain;
        }
      });
      
      // Apply multipliers to the gains (e.g., E85 makes tune more effective)
      const adjustedModuleGain = Math.round(moduleHpGain * allMultipliers);
      estimatedWhp = Math.round(stockHp + adjustedModuleGain + powerAdderHp);
      
      if (moduleHpGain > 0) {
        confidenceLabel = `${effectiveModules.length} mods selected`;
        confidence = 'medium';
      } else {
        confidenceLabel = 'Select mods';
        confidence = 'low';
      }
    }
    
    // Weighted average of calculations
    if (calculations.length > 0) {
      const totalWeight = calculations.reduce((sum, c) => sum + c.weight, 0);
      estimatedWhp = Math.round(calculations.reduce((sum, c) => sum + c.hp * c.weight, 0) / totalWeight);
      
      // Improve confidence if multiple methods agree
      if (calculations.length >= 2) {
        const variance = Math.max(...calculations.map(c => c.hp)) - Math.min(...calculations.map(c => c.hp));
        if (variance < estimatedWhp * 0.1) {
          confidence = 'high';
        }
      }
    }
    
    // Build environment context for label
    let envNote = '';
    if (altitude > 1000 || ambientTemp > 85) {
      envNote = ` (${altitude > 1000 ? altitude.toLocaleString() + 'ft' : ''}${altitude > 1000 && ambientTemp > 85 ? ', ' : ''}${ambientTemp > 85 ? ambientTemp + '°F' : ''})`;
    }
    
    // === HANDLING SCORE CALCULATION ===
    let handlingScore = 100; // Base score (stock)
    
    // Suspension improvements
    const suspType = advancedSpecs.suspension?.type || 'stock';
    if (suspType === 'lowering-springs') handlingScore += 8;
    else if (suspType === 'coilovers') handlingScore += 15;
    else if (suspType === 'coilovers-race') handlingScore += 25;
    
    // Sway bars
    if (advancedSpecs.suspension?.swayBarFront === 'upgraded') handlingScore += 3;
    else if (advancedSpecs.suspension?.swayBarFront === 'adjustable') handlingScore += 5;
    if (advancedSpecs.suspension?.swayBarRear === 'upgraded') handlingScore += 2;
    else if (advancedSpecs.suspension?.swayBarRear === 'adjustable') handlingScore += 4;
    
    // Chassis bracing
    if (advancedSpecs.suspension?.strutBar) handlingScore += 3;
    if (advancedSpecs.suspension?.subframeBrace) handlingScore += 4;
    
    // Alignment (more camber = more grip in corners)
    const alignment = advancedSpecs.suspension?.alignment || 'stock';
    if (alignment === 'street') handlingScore += 5;
    else if (alignment === 'aggressive') handlingScore += 10;
    else if (alignment === 'track') handlingScore += 15;
    
    // Tires (huge impact)
    const tireCompound = advancedSpecs.tires?.compound || 'summer';
    const tireHandlingBonus = {
      'all-season': -10,
      'summer': 0,
      'max-performance': 10,
      'r-comp': 25,
      'drag-radial': 5, // Good straight line, not corners
      'slick': 35,
    };
    handlingScore += tireHandlingBonus[tireCompound] || 0;
    
    // Aero (more downforce = better cornering at speed)
    const frontAero = advancedSpecs.aero?.frontSplitter || 'none';
    if (frontAero === 'lip') handlingScore += 2;
    else if (frontAero === 'splitter') handlingScore += 5;
    else if (frontAero === 'splitter-rods') handlingScore += 8;
    
    const rearAero = advancedSpecs.aero?.rearWing || 'none';
    if (rearAero === 'lip-spoiler') handlingScore += 2;
    else if (rearAero === 'duckbill') handlingScore += 4;
    else if (rearAero === 'gt-wing-low') handlingScore += 8;
    else if (rearAero === 'gt-wing-high') handlingScore += 12;
    
    if (advancedSpecs.aero?.diffuser) handlingScore += 6;
    if (advancedSpecs.aero?.canards) handlingScore += 3;
    if (advancedSpecs.aero?.flatBottom) handlingScore += 4;
    
    // Wheels (lighter = better response)
    const wheelType = advancedSpecs.wheels?.type || 'stock';
    if (wheelType === 'aftermarket') handlingScore += 2;
    else if (wheelType === 'flow-formed') handlingScore += 4;
    else if (wheelType === 'forged') handlingScore += 7;
    
    // === BRAKING SCORE CALCULATION ===
    let brakingScore = 100; // Base score (stock)
    
    // Pad compound
    const padCompound = advancedSpecs.brakes?.padCompound || 'stock';
    if (padCompound === 'street-performance') brakingScore += 10;
    else if (padCompound === 'track') brakingScore += 20;
    else if (padCompound === 'race') brakingScore += 30;
    
    // Rotors
    const rotorType = advancedSpecs.brakes?.rotorType || 'stock';
    if (rotorType === 'slotted' || rotorType === 'drilled') brakingScore += 5;
    else if (rotorType === 'slotted-drilled') brakingScore += 7;
    else if (rotorType === '2-piece') brakingScore += 12;
    
    // Big brake kit
    if (advancedSpecs.brakes?.bbkFront) brakingScore += 20;
    if (advancedSpecs.brakes?.bbkRear) brakingScore += 10;
    
    // Fluid & lines
    const brakeFluid = advancedSpecs.brakes?.brakeFluid || 'dot3';
    if (brakeFluid === 'dot4') brakingScore += 3;
    else if (brakeFluid === 'dot5.1') brakingScore += 5;
    else if (brakeFluid === 'racing') brakingScore += 8;
    
    if (advancedSpecs.brakes?.brakeLine === 'stainless') brakingScore += 5;
    if (advancedSpecs.brakes?.brakeDuct) brakingScore += 5;
    
    // Tires affect braking too
    const tireBrakingBonus = {
      'all-season': -15,
      'summer': 0,
      'max-performance': 10,
      'r-comp': 20,
      'drag-radial': 5,
      'slick': 25,
    };
    brakingScore += tireBrakingBonus[tireCompound] || 0;
    
    // === TOP SPEED EFFECT (Aero drag) ===
    let topSpeedDelta = 0; // mph change from stock
    // More aero = more drag = lower top speed (but better cornering)
    if (frontAero === 'splitter') topSpeedDelta -= 2;
    else if (frontAero === 'splitter-rods') topSpeedDelta -= 4;
    if (rearAero === 'gt-wing-low') topSpeedDelta -= 5;
    else if (rearAero === 'gt-wing-high') topSpeedDelta -= 12;
    if (advancedSpecs.aero?.diffuser) topSpeedDelta -= 2;
    // More power can offset
    const powerBonus = Math.floor((estimatedWhp - stockHp) / 20);
    topSpeedDelta += powerBonus;
    
    return {
      whp: estimatedWhp,
      gain: estimatedWhp - stockHp,
      range,
      confidence,
      confidenceLabel: confidenceLabel + envNote,
      tier: confidence === 'high' ? 2 : confidence === 'medium' ? 3 : 4,
      powerAdderHp,
      environmentMultiplier,
      // New handling/braking metrics
      handlingScore: Math.round(handlingScore),
      brakingScore: Math.round(brakingScore),
      topSpeedDelta,
    };
  }, [tunerMode, car, advancedSpecs, turboOptions, effectiveModules]);
  
  // Tunability & Recommendations (with guards for missing car)
  const tunability = useMemo(() => {
    if (!car) return { score: 0, label: 'Unknown' };
    return calculateTunability(car);
  }, [car]);
  
  const detailedRecommendation = useMemo(() => {
    // Pass tuningProfile as the preferred data source (car_tuning_profiles is source of truth)
    return generateDetailedRecommendation(car, profile.stockMetrics, selectedPackage, tuningProfile);
  }, [car, profile.stockMetrics, selectedPackage, tuningProfile]);
  
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
  
  const handleModuleToggle = useCallback((moduleKey, moduleName, replacementInfo, upgrade) => {
    // When switching from a package to Custom, preserve the package's upgrades
    const switchingToCustom = !isCustomMode;
    
    setSelectedModules(prev => {
      // If switching from a package, start with the package's upgrades instead of empty array
      let baseModules = switchingToCustom && packageUpgrades.length > 0 
        ? [...packageUpgrades] 
        : [...prev];
      
      // If already selected, remove it
      if (baseModules.includes(moduleKey)) {
        // Also clear the config for this upgrade
        setUpgradeConfigs(prevConfigs => {
          const newConfigs = { ...prevConfigs };
          delete newConfigs[moduleKey];
          return newConfigs;
        });
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
        
        // Also clear configs for conflicting upgrades
        setUpgradeConfigs(prevConfigs => {
          const newConfigs = { ...prevConfigs };
          conflictingKeys.forEach(key => delete newConfigs[key]);
          return newConfigs;
        });
      }
      
      // If the upgrade has configOptions, initialize with defaults
      if (upgrade?.configOptions) {
        const defaultConfig = getDefaultConfig(upgrade.configOptions);
        if (Object.keys(defaultConfig).length > 0) {
          setUpgradeConfigs(prevConfigs => ({
            ...prevConfigs,
            [moduleKey]: defaultConfig,
          }));
        }
      }
      
      return [...baseModules, moduleKey];
    });
    
    // Switch to custom mode after updating modules
    if (switchingToCustom) {
      setSelectedPackage('custom');
    }
  }, [isCustomMode, packageUpgrades]);
  
  // Handler for upgrade configuration changes
  const handleUpgradeConfigChange = useCallback((upgradeKey, config) => {
    setUpgradeConfigs(prev => ({
      ...prev,
      [upgradeKey]: config,
    }));
  }, []);
  
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
        upgradeConfigs: upgradeConfigs,  // Include upgrade configurations (catless, etc.)
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
                <span className={styles.tunabilityLabel}>Tunability</span>
              </div>
            </div>
            
            {/* Quick Stats Grid - Shows physics estimate in advanced mode */}
            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatValue}>{car.hp || 'N/A'}</span>
                <span className={styles.heroStatLabel}>Stock HP</span>
              </div>
              {tunerMode === 'advanced' && advancedHpEstimate ? (
                <>
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatValue} style={{ color: '#10b981' }}>
                      +{advancedHpEstimate.gain}
                    </span>
                    <span className={styles.heroStatLabel}>HP Gain</span>
                  </div>
                  <div className={styles.heroStat}>
                    {advancedHpEstimate.range ? (
                      <>
                        <span className={styles.heroStatValue}>
                          {advancedHpEstimate.range.low}-{advancedHpEstimate.range.high}
                        </span>
                        <span className={styles.heroStatLabel}>Est. HP Range</span>
                      </>
                    ) : (
                      <>
                        <span className={styles.heroStatValue}>{advancedHpEstimate.whp}</span>
                        <span className={styles.heroStatLabel}>Est. HP</span>
                      </>
                    )}
                  </div>
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatValue}>${(totalCost.low || 0).toLocaleString()}</span>
                    <span className={styles.heroStatLabel}>Est. Cost</span>
                  </div>
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          MODE TOGGLE - User chooses their experience level FIRST
          ═══════════════════════════════════════════════════════════════════════ */}
      {/* Tuning Mode Toggle - Full Width */}
      <div className={styles.modeToggleSection}>
        <div className={styles.modeToggleFullWidth}>
          <button
            className={`${styles.modeToggleBtn} ${tunerMode === 'basic' ? styles.modeToggleBtnActive : ''}`}
            onClick={() => setTunerMode('basic')}
          >
            <Icons.settings size={18} />
            <div className={styles.modeToggleBtnContent}>
              <span className={styles.modeToggleBtnTitle}>Basic Tuning</span>
              <span className={styles.modeToggleBtnDesc}>Presets & category-based upgrades</span>
            </div>
          </button>
          <button
            className={`${styles.modeToggleBtn} ${tunerMode === 'advanced' ? styles.modeToggleBtnActive : ''}`}
            onClick={() => setTunerMode('advanced')}
          >
            <Icons.brain size={18} />
            <div className={styles.modeToggleBtnContent}>
              <span className={styles.modeToggleBtnTitle}>Advanced Tuning</span>
              <span className={styles.modeToggleBtnDesc}>Physics-based with virtual dyno</span>
            </div>
          </button>
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          WORKSPACE - Main build configuration and results
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className={styles.workspace}>
        {/* Left Sidebar - Build Configuration */}
        <div className={styles.sidebar}>
          
          {/* ═══════════════════════════════════════════════════════════════
              AUTOREV RECOMMENDATION - Platform insights at the top
              ═══════════════════════════════════════════════════════════════ */}
          {showUpgrade && (
            <div className={styles.sidebarCard}>
              <div className={styles.recommendationBannerCompact}>
                <div className={styles.recommendationHeader}>
                  <span className={styles.recommendationTitle}>AutoRev Recommendation</span>
                  {detailedRecommendation.focusArea && (
                    <span className={styles.focusTag}>Focus: {detailedRecommendation.focusArea}</span>
                  )}
                </div>
                <p className={styles.recommendationText}>{detailedRecommendation.primaryText}</p>
                
                {/* Platform Insights & Watch Outs */}
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
          )}
          
          {/* ═══════════════════════════════════════════════════════════════
              VEHICLE SETUP - Always visible (both modes)
              ═══════════════════════════════════════════════════════════════ */}
          
          {/* Factory Configuration */}
          <div className={styles.sidebarCard}>
            <FactoryConfig
              car={car}
              initialConfig={factoryConfig}
              onChange={onFactoryConfigChange}
              defaultExpanded={false}
              compact={true}
            />
          </div>
          
          {/* Wheel & Tire Setup */}
          <div className={styles.sidebarCard}>
            <WheelTireConfigurator
              car={car}
              selectedFitment={selectedWheelFitment}
              onSelect={onWheelFitmentChange}
              showCostEstimates={true}
              defaultExpanded={false}
              compact={true}
              selectedUpgrades={effectiveModules}
              onUpgradeToggle={(key) => handleModuleToggle(key, 'Lightweight Wheels', null)}
            />
          </div>
          
          {/* ═══════════════════════════════════════════════════════════════
              ADVANCED MODE - Add Upgrades FIRST, then Configure
              ═══════════════════════════════════════════════════════════════ */}
          
          {/* Step 1: Add Upgrades - Advanced Mode (MOVED UP - users select first) */}
          {tunerMode === 'advanced' && (
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarCardHeader}>
                <Icons.bolt size={16} />
                <span className={styles.sidebarCardTitle}>Add Upgrades</span>
              </div>
              <div className={styles.sidebarCardContent}>
                <div className={styles.categoryList}>
                  {UPGRADE_CATEGORIES.filter(cat => 
                    cat.key !== 'wheels' && 
                    (upgradesByCategory[cat.key]?.length || 0) > 0
                  ).map(cat => {
                    const Icon = cat.icon;
                    const count = selectedByCategory[cat.key] || 0;
                    
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
          )}
          
          {/* Step 2: Configure Selected Upgrades - Advanced Mode (Dynamic based on selections) */}
          {tunerMode === 'advanced' && effectiveModules.length > 0 && (
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarCardHeader}>
                <Icons.settings size={16} />
                <span className={styles.sidebarCardTitle}>Configure Upgrades</span>
              </div>
              <div className={styles.sidebarCardContent}>
                <DynamicBuildConfig
                  selectedUpgrades={effectiveModules}
                  upgradeConfigs={upgradeConfigs}
                  onConfigChange={handleUpgradeConfigChange}
                />
              </div>
            </div>
          )}
          
          {/* ═══════════════════════════════════════════════════════════════
              BASIC MODE - Presets & Categories
              ═══════════════════════════════════════════════════════════════ */}
          
          {/* Build Presets Card - Basic Mode Only */}
          {tunerMode === 'basic' && (
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
          )}
          
          {/* Upgrade Categories Card - Basic Mode */}
          {tunerMode === 'basic' && (
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarCardHeader}>
                <Icons.bolt size={16} />
                <span className={styles.sidebarCardTitle}>Upgrade Categories</span>
              </div>
              <div className={styles.sidebarCardContent}>
                <div className={styles.categoryList}>
                  {UPGRADE_CATEGORIES.filter(cat => 
                    cat.key !== 'wheels' && 
                    (upgradesByCategory[cat.key]?.length || 0) > 0
                  ).map(cat => {
                    const Icon = cat.icon;
                    const count = selectedByCategory[cat.key] || 0;
                    
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
          )}
          
          {/* Advanced Tuning - Collapsible deep-dive options for power users */}
          {tunerMode === 'advanced' && (
            <div className={styles.sidebarCard}>
              <button 
                className={styles.sidebarCardHeaderCollapsible}
                onClick={() => setAdvancedTuningExpanded(!advancedTuningExpanded)}
              >
                <Icons.brain size={16} />
                <span className={styles.sidebarCardTitle}>Advanced Tuning</span>
                <span className={styles.advancedTuningHint}>Engine builds, turbo sizing, fuel...</span>
                <Icons.chevronRight 
                  size={14} 
                  className={`${styles.collapseChevron} ${advancedTuningExpanded ? styles.collapseChevronExpanded : ''}`} 
                />
              </button>
              {advancedTuningExpanded && (
              <div className={`${styles.sidebarCardContent} ${styles.advancedScrollable}`}>
                
                {/* ENGINE SECTION */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.bolt size={14} />
                    <span>Engine</span>
                  </div>
                  <div className={styles.advancedField}>
                    <label className={styles.advancedLabel}>Build Type</label>
                    <select
                      className={styles.advancedSelect}
                      value={advancedSpecs.engine.type}
                      onChange={e => setAdvancedSpecs(prev => ({
                        ...prev,
                        engine: { ...prev.engine, type: e.target.value }
                      }))}
                    >
                      <option value="stock">Stock Internals</option>
                      <option value="built">Built (Forged Internals)</option>
                      <option value="stroked">Stroked / Destroked</option>
                    </select>
                  </div>
                  
                  {(advancedSpecs.engine.type === 'built' || advancedSpecs.engine.type === 'stroked') && (
                    <>
                      <div className={styles.advancedFieldRow}>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Cams</label>
                          <select
                            className={styles.advancedSelect}
                            value={advancedSpecs.engine.cams}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              engine: { ...prev.engine, cams: e.target.value }
                            }))}
                          >
                            <option value="stock">Stock</option>
                            <option value="stage1">Stage 1 (+4%)</option>
                            <option value="stage2">Stage 2 (+7%)</option>
                            <option value="stage3">Stage 3 (+12%)</option>
                          </select>
                        </div>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Valvetrain</label>
                          <select
                            className={styles.advancedSelect}
                            value={advancedSpecs.engine.valvetrain}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              engine: { ...prev.engine, valvetrain: e.target.value }
                            }))}
                          >
                            <option value="stock">Stock</option>
                            <option value="upgraded">Upgraded Springs</option>
                            <option value="titanium">Titanium Retainers</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className={styles.advancedCheckbox}>
                        <label>
                          <input
                            type="checkbox"
                            checked={advancedSpecs.engine.headWork}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              engine: { ...prev.engine, headWork: e.target.checked }
                            }))}
                          />
                          <span>Ported Head (+6% flow)</span>
                        </label>
                      </div>
                    </>
                  )}
                  
                  {advancedSpecs.engine.type === 'stroked' && (
                    <div className={styles.advancedFieldRow}>
                      <div className={styles.advancedFieldHalf}>
                        <label className={styles.advancedLabel}>Displacement (L)</label>
                        <input
                          type="number"
                          className={styles.advancedInput}
                          value={advancedSpecs.engine.displacement}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            engine: { ...prev.engine, displacement: parseFloat(e.target.value) || 2.0 }
                          }))}
                          step="0.1"
                          min="1.5"
                          max="4.5"
                        />
                      </div>
                      <div className={styles.advancedFieldHalf}>
                        <label className={styles.advancedLabel}>Compression</label>
                        <input
                          type="number"
                          className={styles.advancedInput}
                          placeholder="9.0"
                          value={advancedSpecs.engine.compression || ''}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            engine: { ...prev.engine, compression: parseFloat(e.target.value) || null }
                          }))}
                          step="0.1"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* FORCED INDUCTION SECTION - Biggest power gains first */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.turbo size={14} />
                    <span>Forced Induction</span>
                  </div>
                  <div className={styles.advancedField}>
                    <label className={styles.advancedLabel}>Turbo Setup</label>
                    <select
                      className={styles.advancedSelect}
                      value={advancedSpecs.turbo.type}
                      onChange={e => setAdvancedSpecs(prev => ({
                        ...prev,
                        turbo: { ...prev.turbo, type: e.target.value, modelId: null }
                      }))}
                    >
                      <option value="stock">Stock Turbo</option>
                      <option value="upgraded">Bolt-On Upgrade</option>
                      <option value="custom">Big Turbo / Custom</option>
                    </select>
                  </div>
                  
                  {(advancedSpecs.turbo.type === 'upgraded' || advancedSpecs.turbo.type === 'custom') && (
                    <>
                      <div className={styles.advancedField}>
                        <label className={styles.advancedLabel}>
                          Turbo Model
                          {loadingTurbos && <span className={styles.loadingDot}>...</span>}
                        </label>
                        <select
                          className={styles.advancedSelect}
                          value={advancedSpecs.turbo.modelId || ''}
                          onChange={e => {
                            const turboId = e.target.value || null;
                            const turbo = turboOptions.find(t => t.id === turboId);
                            setAdvancedSpecs(prev => ({
                              ...prev,
                              turbo: { 
                                ...prev.turbo, 
                                modelId: turboId,
                                customModel: turbo ? `${turbo.brand} ${turbo.model}` : '',
                                inducerMm: turbo?.inducer_mm || prev.turbo.inducerMm,
                              }
                            }));
                          }}
                        >
                          <option value="">Select from library...</option>
                          {turboOptions.map(turbo => (
                            <option key={turbo.id} value={turbo.id}>
                              {turbo.brand} {turbo.model} ({turbo.flow_hp_min}-{turbo.flow_hp_max} HP)
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {!advancedSpecs.turbo.modelId && (
                        <div className={styles.advancedField}>
                          <label className={styles.advancedLabel}>Or Enter Custom</label>
                          <input
                            type="text"
                            className={styles.advancedInput}
                            placeholder="e.g., GTX3582R Gen 2"
                            value={advancedSpecs.turbo.customModel}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              turbo: { ...prev.turbo, customModel: e.target.value }
                            }))}
                          />
                        </div>
                      )}
                      
                      <div className={styles.advancedFieldRow}>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Inducer (mm)</label>
                          <input
                            type="number"
                            className={styles.advancedInput}
                            placeholder="58"
                            value={advancedSpecs.turbo.inducerMm || ''}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              turbo: { ...prev.turbo, inducerMm: parseFloat(e.target.value) || null }
                            }))}
                          />
                        </div>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Target PSI</label>
                          <input
                            type="number"
                            className={styles.advancedInput}
                            placeholder="30"
                            value={advancedSpecs.turbo.targetBoostPsi || ''}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              turbo: { ...prev.turbo, targetBoostPsi: parseFloat(e.target.value) || null }
                            }))}
                          />
                        </div>
                      </div>
                      
                      <div className={styles.advancedFieldRow}>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Wastegate</label>
                          <select
                            className={styles.advancedSelect}
                            value={advancedSpecs.turbo.wastegate}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              turbo: { ...prev.turbo, wastegate: e.target.value }
                            }))}
                          >
                            <option value="stock">Stock / Internal</option>
                            <option value="upgraded">Upgraded IWG</option>
                            <option value="external">External WG</option>
                          </select>
                        </div>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Intercooler</label>
                          <select
                            className={styles.advancedSelect}
                            value={advancedSpecs.turbo.intercooler}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              turbo: { ...prev.turbo, intercooler: e.target.value }
                            }))}
                          >
                            <option value="stock">Stock</option>
                            <option value="tmic">Upgraded TMIC</option>
                            <option value="fmic">FMIC</option>
                            <option value="air-to-water">Air-to-Water</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* INTAKE & EXHAUST - Now configured in "Configure Upgrades" section above */}
                {/* Removed to eliminate duplicate configuration options */}
                
                {/* FUEL SYSTEM SECTION */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.thermometer size={14} />
                    <span>Fuel System</span>
                  </div>
                  <div className={styles.advancedField}>
                    <label className={styles.advancedLabel}>Fuel Type</label>
                    <div className={styles.fuelTypeGrid}>
                      {['91', '93', 'e30', 'e50', 'e85'].map(fuel => (
                        <button
                          key={fuel}
                          type="button"
                          className={`${styles.fuelTypeBtn} ${advancedSpecs.fuel.type === fuel ? styles.fuelTypeBtnActive : ''}`}
                          onClick={() => setAdvancedSpecs(prev => ({
                            ...prev,
                            fuel: { ...prev.fuel, type: fuel }
                          }))}
                        >
                          {fuel.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Injectors (cc)</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="1000"
                        value={advancedSpecs.fuel.injectorCc || ''}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          fuel: { ...prev.fuel, injectorCc: parseInt(e.target.value) || null }
                        }))}
                      />
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Fuel Pump</label>
                      <input
                        type="text"
                        className={styles.advancedInput}
                        placeholder="Walbro 450"
                        value={advancedSpecs.fuel.fuelPump}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          fuel: { ...prev.fuel, fuelPump: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div className={styles.advancedCheckboxRow}>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.fuel.fuelRails}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          fuel: { ...prev.fuel, fuelRails: e.target.checked }
                        }))}
                      />
                      <span>Fuel Rails</span>
                    </label>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.fuel.flexFuel}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          fuel: { ...prev.fuel, flexFuel: e.target.checked }
                        }))}
                      />
                      <span>Flex Fuel Kit</span>
                    </label>
                  </div>
                </div>
                
                {/* ECU / TUNING SECTION */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.brain size={14} />
                    <span>ECU & Tuning</span>
                  </div>
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>ECU Type</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.ecu.type}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          ecu: { ...prev.ecu, type: e.target.value }
                        }))}
                      >
                        <option value="stock">Stock ECU</option>
                        <option value="flash">Flash Tune</option>
                        <option value="piggyback">Piggyback</option>
                        <option value="standalone">Standalone</option>
                      </select>
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Tuner / Brand</label>
                      <input
                        type="text"
                        className={styles.advancedInput}
                        placeholder="e.g., EcuTek, AMS"
                        value={advancedSpecs.ecu.tuner}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          ecu: { ...prev.ecu, tuner: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div className={styles.advancedCheckbox}>
                    <label>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.ecu.dynoTuned}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          ecu: { ...prev.ecu, dynoTuned: e.target.checked }
                        }))}
                      />
                      <span>Dyno Tuned (vs E-Tune)</span>
                    </label>
                  </div>
                </div>
                
                {/* POWER ADDERS SECTION - Critical for HP */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.bolt size={14} />
                    <span>Power Adders</span>
                    <span className={styles.sectionHint}>+10-300 HP</span>
                  </div>
                  
                  {/* Methanol/Water Injection */}
                  <div className={styles.advancedCheckbox}>
                    <label>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.power_adders?.methanol || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          power_adders: { ...prev.power_adders, methanol: e.target.checked }
                        }))}
                      />
                      <span>Methanol / Water Injection</span>
                    </label>
                  </div>
                  
                  {advancedSpecs.power_adders?.methanol && (
                    <div className={styles.advancedFieldRow}>
                      <div className={styles.advancedFieldHalf}>
                        <label className={styles.advancedLabel}>Meth %</label>
                        <select
                          className={styles.advancedSelect}
                          value={advancedSpecs.power_adders.methanolRatio || '50'}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            power_adders: { ...prev.power_adders, methanolRatio: e.target.value }
                          }))}
                        >
                          <option value="water">Water Only</option>
                          <option value="30">30% Meth</option>
                          <option value="50">50% Meth</option>
                          <option value="100">100% Meth</option>
                        </select>
                      </div>
                      <div className={styles.advancedFieldHalf}>
                        <label className={styles.advancedLabel}>Nozzle Size</label>
                        <input
                          type="number"
                          className={styles.advancedInput}
                          placeholder="1000cc"
                          value={advancedSpecs.power_adders.methanolNozzleSize || ''}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            power_adders: { ...prev.power_adders, methanolNozzleSize: parseInt(e.target.value) || null }
                          }))}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Nitrous */}
                  <div className={styles.advancedCheckbox}>
                    <label>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.power_adders?.nitrous || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          power_adders: { ...prev.power_adders, nitrous: e.target.checked, nitrousType: e.target.checked ? 'wet' : 'none' }
                        }))}
                      />
                      <span>Nitrous Oxide</span>
                    </label>
                  </div>
                  
                  {advancedSpecs.power_adders?.nitrous && (
                    <div className={styles.advancedFieldRow}>
                      <div className={styles.advancedFieldHalf}>
                        <label className={styles.advancedLabel}>Type</label>
                        <select
                          className={styles.advancedSelect}
                          value={advancedSpecs.power_adders.nitrousType || 'wet'}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            power_adders: { ...prev.power_adders, nitrousType: e.target.value }
                          }))}
                        >
                          <option value="dry">Dry</option>
                          <option value="wet">Wet</option>
                          <option value="direct-port">Direct Port</option>
                        </select>
                      </div>
                      <div className={styles.advancedFieldHalf}>
                        <label className={styles.advancedLabel}>Shot Size (HP)</label>
                        <input
                          type="number"
                          className={styles.advancedInput}
                          placeholder="100"
                          value={advancedSpecs.power_adders.nitrousShot || ''}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            power_adders: { ...prev.power_adders, nitrousShot: parseInt(e.target.value) || null }
                          }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* COOLING SECTION - Supports power mods */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.thermometer size={14} />
                    <span>Cooling</span>
                  </div>
                  <div className={styles.advancedField}>
                    <label className={styles.advancedLabel}>Radiator</label>
                    <select
                      className={styles.advancedSelect}
                      value={advancedSpecs.cooling?.radiator || 'stock'}
                      onChange={e => setAdvancedSpecs(prev => ({
                        ...prev,
                        cooling: { ...prev.cooling, radiator: e.target.value }
                      }))}
                    >
                      <option value="stock">Stock</option>
                      <option value="aluminum">Aluminum Upgrade</option>
                      <option value="dual-pass">Dual Pass</option>
                    </select>
                  </div>
                  <div className={styles.advancedCheckboxRow}>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.cooling?.oilCooler || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          cooling: { ...prev.cooling, oilCooler: e.target.checked }
                        }))}
                      />
                      <span>Oil Cooler</span>
                    </label>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.cooling?.transCooler || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          cooling: { ...prev.cooling, transCooler: e.target.checked }
                        }))}
                      />
                      <span>Trans Cooler</span>
                    </label>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.cooling?.icSprayer || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          cooling: { ...prev.cooling, icSprayer: e.target.checked }
                        }))}
                      />
                      <span>IC Sprayer</span>
                    </label>
                  </div>
                </div>
                
                {/* ═══════════════════════════════════════════════════════════════
                    DRIVETRAIN & WEIGHT - Power Transfer
                    ═══════════════════════════════════════════════════════════════ */}
                
                {/* DRIVETRAIN SECTION */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.settings size={14} />
                    <span>Drivetrain</span>
                  </div>
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Clutch</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.drivetrain.clutch}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          drivetrain: { ...prev.drivetrain, clutch: e.target.value }
                        }))}
                      >
                        <option value="stock">Stock</option>
                        <option value="stage1">Stage 1</option>
                        <option value="stage2">Stage 2</option>
                        <option value="stage3">Stage 3</option>
                        <option value="twin-disc">Twin Disc</option>
                      </select>
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Flywheel</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.drivetrain.flywheel}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          drivetrain: { ...prev.drivetrain, flywheel: e.target.value }
                        }))}
                      >
                        <option value="stock">Stock DMF</option>
                        <option value="lightweight">Lightweight</option>
                        <option value="single-mass">Single Mass</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Transmission</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.drivetrain.transmission}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          drivetrain: { ...prev.drivetrain, transmission: e.target.value }
                        }))}
                      >
                        <option value="stock">Stock</option>
                        <option value="built">Built / Upgraded</option>
                        <option value="swap">Swap</option>
                      </select>
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Differential</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.drivetrain.differential}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          drivetrain: { ...prev.drivetrain, differential: e.target.value }
                        }))}
                      >
                        <option value="stock">Stock</option>
                        <option value="lsd">LSD</option>
                        <option value="upgraded">Upgraded LSD</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* ═══════════════════════════════════════════════════════════════
                    CHASSIS - Handling & Braking
                    ═══════════════════════════════════════════════════════════════ */}
                
                {/* SUSPENSION SECTION - Affects handling */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.target size={14} />
                    <span>Suspension</span>
                    <span className={styles.sectionHint}>Handling</span>
                  </div>
                  
                  <div className={styles.advancedField}>
                    <label className={styles.advancedLabel}>Setup Type</label>
                    <select
                      className={styles.advancedSelect}
                      value={advancedSpecs.suspension?.type || 'stock'}
                      onChange={e => setAdvancedSpecs(prev => ({
                        ...prev,
                        suspension: { ...prev.suspension, type: e.target.value }
                      }))}
                    >
                      <option value="stock">Stock</option>
                      <option value="lowering-springs">Lowering Springs</option>
                      <option value="coilovers">Coilovers</option>
                      <option value="coilovers-race">Race Coilovers</option>
                      <option value="air">Air Suspension</option>
                    </select>
                  </div>
                  
                  {advancedSpecs.suspension?.type !== 'stock' && (
                    <>
                      <div className={styles.advancedFieldRow}>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Drop (inches)</label>
                          <input
                            type="number"
                            className={styles.advancedInput}
                            placeholder="1.5"
                            step="0.25"
                            value={advancedSpecs.suspension?.rideHeightDrop || ''}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              suspension: { ...prev.suspension, rideHeightDrop: parseFloat(e.target.value) || 0 }
                            }))}
                          />
                        </div>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Alignment</label>
                          <select
                            className={styles.advancedSelect}
                            value={advancedSpecs.suspension?.alignment || 'stock'}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              suspension: { ...prev.suspension, alignment: e.target.value }
                            }))}
                          >
                            <option value="stock">Stock Specs</option>
                            <option value="street">Street (-1.5° front)</option>
                            <option value="aggressive">Aggressive (-2.5° front)</option>
                            <option value="track">Track (-3°+ front)</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className={styles.advancedFieldRow}>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Front Sway</label>
                          <select
                            className={styles.advancedSelect}
                            value={advancedSpecs.suspension?.swayBarFront || 'stock'}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              suspension: { ...prev.suspension, swayBarFront: e.target.value }
                            }))}
                          >
                            <option value="stock">Stock</option>
                            <option value="upgraded">Upgraded</option>
                            <option value="adjustable">Adjustable</option>
                          </select>
                        </div>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Rear Sway</label>
                          <select
                            className={styles.advancedSelect}
                            value={advancedSpecs.suspension?.swayBarRear || 'stock'}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              suspension: { ...prev.suspension, swayBarRear: e.target.value }
                            }))}
                          >
                            <option value="removed">Removed</option>
                            <option value="stock">Stock</option>
                            <option value="upgraded">Upgraded</option>
                            <option value="adjustable">Adjustable</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className={styles.advancedCheckboxRow}>
                        <label className={styles.advancedCheckbox}>
                          <input
                            type="checkbox"
                            checked={advancedSpecs.suspension?.strutBar || false}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              suspension: { ...prev.suspension, strutBar: e.target.checked }
                            }))}
                          />
                          <span>Front Strut Bar</span>
                        </label>
                        <label className={styles.advancedCheckbox}>
                          <input
                            type="checkbox"
                            checked={advancedSpecs.suspension?.subframeBrace || false}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              suspension: { ...prev.suspension, subframeBrace: e.target.checked }
                            }))}
                          />
                          <span>Subframe Brace</span>
                        </label>
                      </div>
                    </>
                  )}
                </div>

                {/* BRAKES SECTION - Affects stopping */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.disc size={14} />
                    <span>Brakes</span>
                    <span className={styles.sectionHint}>Stopping power</span>
                  </div>
                  
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Pad Compound</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.brakes?.padCompound || 'stock'}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          brakes: { ...prev.brakes, padCompound: e.target.value }
                        }))}
                      >
                        <option value="stock">Stock/OEM</option>
                        <option value="street-performance">Street Performance</option>
                        <option value="track">Track Day</option>
                        <option value="race">Race Compound</option>
                      </select>
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Rotor Type</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.brakes?.rotorType || 'stock'}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          brakes: { ...prev.brakes, rotorType: e.target.value }
                        }))}
                      >
                        <option value="stock">Stock/Blank</option>
                        <option value="slotted">Slotted</option>
                        <option value="drilled">Drilled</option>
                        <option value="slotted-drilled">Slotted & Drilled</option>
                        <option value="2-piece">2-Piece Floating</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Brake Fluid</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.brakes?.brakeFluid || 'dot3'}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          brakes: { ...prev.brakes, brakeFluid: e.target.value }
                        }))}
                      >
                        <option value="dot3">DOT 3</option>
                        <option value="dot4">DOT 4</option>
                        <option value="dot5.1">DOT 5.1</option>
                        <option value="racing">Racing (Motul RBF)</option>
                      </select>
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Lines</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.brakes?.brakeLine || 'stock'}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          brakes: { ...prev.brakes, brakeLine: e.target.value }
                        }))}
                      >
                        <option value="stock">Stock Rubber</option>
                        <option value="stainless">Stainless Braided</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className={styles.advancedCheckboxRow}>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.brakes?.bbkFront || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          brakes: { ...prev.brakes, bbkFront: e.target.checked }
                        }))}
                      />
                      <span>BBK Front</span>
                    </label>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.brakes?.bbkRear || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          brakes: { ...prev.brakes, bbkRear: e.target.checked }
                        }))}
                      />
                      <span>BBK Rear</span>
                    </label>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.brakes?.brakeDuct || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          brakes: { ...prev.brakes, brakeDuct: e.target.checked }
                        }))}
                      />
                      <span>Brake Ducts</span>
                    </label>
                  </div>
                </div>

                {/* AERO SECTION - Affects downforce & top speed */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.wind size={14} />
                    <span>Aerodynamics</span>
                    <span className={styles.sectionHint}>Grip vs speed</span>
                  </div>
                  
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Front</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.aero?.frontSplitter || 'none'}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          aero: { ...prev.aero, frontSplitter: e.target.value }
                        }))}
                      >
                        <option value="none">Stock</option>
                        <option value="lip">Front Lip</option>
                        <option value="splitter">Splitter</option>
                        <option value="splitter-rods">Splitter + Rods</option>
                      </select>
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Rear</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.aero?.rearWing || 'none'}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          aero: { ...prev.aero, rearWing: e.target.value }
                        }))}
                      >
                        <option value="none">Stock</option>
                        <option value="lip-spoiler">Lip Spoiler</option>
                        <option value="duckbill">Duckbill</option>
                        <option value="gt-wing-low">GT Wing (Low)</option>
                        <option value="gt-wing-high">GT Wing (High)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className={styles.advancedCheckboxRow}>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.aero?.diffuser || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          aero: { ...prev.aero, diffuser: e.target.checked }
                        }))}
                      />
                      <span>Rear Diffuser</span>
                    </label>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.aero?.canards || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          aero: { ...prev.aero, canards: e.target.checked }
                        }))}
                      />
                      <span>Canards</span>
                    </label>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.aero?.flatBottom || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          aero: { ...prev.aero, flatBottom: e.target.checked }
                        }))}
                      />
                      <span>Flat Underbody</span>
                    </label>
                  </div>
                </div>

                {/* WHEELS SECTION - Affects rotational mass */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.circle size={14} />
                    <span>Wheels</span>
                    <span className={styles.sectionHint}>Rotational mass</span>
                  </div>
                  
                  <div className={styles.advancedField}>
                    <label className={styles.advancedLabel}>Wheel Type</label>
                    <select
                      className={styles.advancedSelect}
                      value={advancedSpecs.wheels?.type || 'stock'}
                      onChange={e => setAdvancedSpecs(prev => ({
                        ...prev,
                        wheels: { ...prev.wheels, type: e.target.value }
                      }))}
                    >
                      <option value="stock">Stock (Heavy)</option>
                      <option value="aftermarket">Aftermarket Cast</option>
                      <option value="flow-formed">Flow Formed</option>
                      <option value="forged">Forged (Lightest)</option>
                    </select>
                  </div>
                  
                  {advancedSpecs.wheels?.type !== 'stock' && (
                    <div className={styles.advancedFieldRow}>
                      <div className={styles.advancedFieldHalf}>
                        <label className={styles.advancedLabel}>Weight/wheel (lbs)</label>
                        <input
                          type="number"
                          className={styles.advancedInput}
                          placeholder="18"
                          value={advancedSpecs.wheels?.weightPerWheel || ''}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            wheels: { ...prev.wheels, weightPerWheel: parseFloat(e.target.value) || null }
                          }))}
                        />
                      </div>
                      <div className={styles.advancedFieldHalf}>
                        <label className={styles.advancedLabel}>Width (inches)</label>
                        <input
                          type="number"
                          className={styles.advancedInput}
                          placeholder="9.5"
                          step="0.5"
                          value={advancedSpecs.wheels?.widthFront || ''}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            wheels: { ...prev.wheels, widthFront: parseFloat(e.target.value) || null, widthRear: parseFloat(e.target.value) || null }
                          }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* WEIGHT & TIRES SECTION - Critical for performance */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.car size={14} />
                    <span>Weight & Tires</span>
                    <span className={styles.sectionHint}>Affects 0-60, 1/4</span>
                  </div>
                  
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Weight Change (lbs)</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="-150"
                        value={advancedSpecs.weight?.weightReduction || ''}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          weight: { ...prev.weight, weightReduction: parseInt(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Driver (lbs)</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="180"
                        value={advancedSpecs.weight?.driverWeight || 180}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          weight: { ...prev.weight, driverWeight: parseInt(e.target.value) || 180 }
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div className={styles.advancedCheckboxRow}>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.weight?.strippedInterior || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          weight: { ...prev.weight, strippedInterior: e.target.checked, weightReduction: e.target.checked ? (prev.weight?.weightReduction || 0) - 150 : (prev.weight?.weightReduction || 0) + 150 }
                        }))}
                      />
                      <span>Stripped Interior</span>
                    </label>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.weight?.hasRollCage || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          weight: { ...prev.weight, hasRollCage: e.target.checked, weightReduction: e.target.checked ? (prev.weight?.weightReduction || 0) + 80 : (prev.weight?.weightReduction || 0) - 80 }
                        }))}
                      />
                      <span>Roll Cage (+80 lbs)</span>
                    </label>
                  </div>
                  
                  <div className={styles.advancedField}>
                    <label className={styles.advancedLabel}>Tire Compound</label>
                    <select
                      className={styles.advancedSelect}
                      value={advancedSpecs.tires?.compound || 'summer'}
                      onChange={e => setAdvancedSpecs(prev => ({
                        ...prev,
                        tires: { ...prev.tires, compound: e.target.value }
                      }))}
                    >
                      <option value="all-season">All-Season (0.85g)</option>
                      <option value="summer">Summer Performance (0.95g)</option>
                      <option value="max-performance">Max Performance (1.02g)</option>
                      <option value="r-comp">R-Compound (1.15g)</option>
                      <option value="drag-radial">Drag Radial (1.4g launch)</option>
                      <option value="slick">Slicks (1.5g+)</option>
                    </select>
                  </div>
                  
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Tire Width (mm)</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="275"
                        value={advancedSpecs.tires?.width || ''}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          tires: { ...prev.tires, width: parseInt(e.target.value) || null }
                        }))}
                      />
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Final Drive</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="3.73"
                        step="0.01"
                        value={advancedSpecs.drivetrain?.finalDrive || ''}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          drivetrain: { ...prev.drivetrain, finalDrive: parseFloat(e.target.value) || null }
                        }))}
                      />
                    </div>
                  </div>
                </div>
                
                {/* ENVIRONMENT SECTION - Critical for accuracy */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.wind size={14} />
                    <span>Environment</span>
                    <span className={styles.sectionHint}>Affects power</span>
                  </div>
                  
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Altitude (ft)</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="0"
                        value={advancedSpecs.environment?.altitude || 0}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          environment: { ...prev.environment, altitude: parseInt(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Temp (°F)</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="70"
                        value={advancedSpecs.environment?.ambientTemp || 70}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          environment: { ...prev.environment, ambientTemp: parseInt(e.target.value) || 70 }
                        }))}
                      />
                    </div>
                  </div>
                  <p className={styles.advancedHint}>
                    At 5,000ft & 90°F, expect ~15% power loss vs sea level
                  </p>
                </div>
                
                {/* VERIFIED RESULTS SECTION */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.check size={14} />
                    <span>Verified Results</span>
                    <span className={styles.sectionHint}>Tier 1 data</span>
                  </div>
                  <div className={styles.advancedCheckbox}>
                    <label>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.verified.hasDyno}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          verified: { ...prev.verified, hasDyno: e.target.checked }
                        }))}
                      />
                      <span>I have dyno results</span>
                    </label>
                  </div>
                  
                  {advancedSpecs.verified.hasDyno && (
                    <>
                      <div className={styles.advancedFieldRow}>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>WHP</label>
                          <input
                            type="number"
                            className={styles.advancedInput}
                            placeholder="450"
                            value={advancedSpecs.verified.whp || ''}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              verified: { ...prev.verified, whp: parseInt(e.target.value) || null }
                            }))}
                          />
                        </div>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>WTQ</label>
                          <input
                            type="number"
                            className={styles.advancedInput}
                            placeholder="400"
                            value={advancedSpecs.verified.wtq || ''}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              verified: { ...prev.verified, wtq: parseInt(e.target.value) || null }
                            }))}
                          />
                        </div>
                      </div>
                      <div className={styles.advancedField}>
                        <label className={styles.advancedLabel}>Dyno Shop</label>
                        <input
                          type="text"
                          className={styles.advancedInput}
                          placeholder="Shop name & location"
                          value={advancedSpecs.verified.dynoShop}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            verified: { ...prev.verified, dynoShop: e.target.value }
                          }))}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>1/4 Mile (sec)</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="11.5"
                        step="0.1"
                        value={advancedSpecs.verified.quarterMile || ''}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          verified: { ...prev.verified, quarterMile: parseFloat(e.target.value) || null }
                        }))}
                      />
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>0-60 (sec)</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="4.2"
                        step="0.1"
                        value={advancedSpecs.verified.zeroToSixty || ''}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          verified: { ...prev.verified, zeroToSixty: parseFloat(e.target.value) || null }
                        }))}
                      />
                    </div>
                  </div>
                </div>
                
                {/* PHYSICS ESTIMATE SUMMARY */}
                {advancedHpEstimate && (
                  <div className={styles.physicsEstimate}>
                    <div className={styles.physicsEstimateHeader}>
                      <Icons.brain size={14} />
                      <span>Best Estimate</span>
                      <span className={`${styles.tierBadge} ${styles[`tier${advancedHpEstimate.tier}`]}`}>
                        Tier {advancedHpEstimate.tier}
                      </span>
                    </div>
                    <div className={styles.physicsEstimateValue}>
                      {advancedSpecs.verified.hasDyno && advancedSpecs.verified.whp ? (
                        <span className={styles.hpSingle}>
                          {advancedSpecs.verified.whp} <span className={styles.hpUnit}>WHP (Verified)</span>
                        </span>
                      ) : advancedHpEstimate.range ? (
                        <span className={styles.hpRange}>
                          {advancedHpEstimate.range.low} - {advancedHpEstimate.range.high} <span className={styles.hpUnit}>HP</span>
                        </span>
                      ) : (
                        <span className={styles.hpSingle}>
                          {advancedHpEstimate.whp} <span className={styles.hpUnit}>HP</span>
                        </span>
                      )}
                    </div>
                    <div className={styles.physicsEstimateLabel}>
                      {advancedSpecs.verified.hasDyno && advancedSpecs.verified.whp 
                        ? 'User verified dyno data'
                        : advancedHpEstimate.confidenceLabel
                      }
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>
          )}
          
        </div>
        
        {/* Main Panel - Performance Metrics */}
        <div className={styles.mainPanel}>
          
          {/* === BASIC MODE: Simple Performance Card === */}
          {tunerMode === 'basic' && (
            <>
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
              
              {/* Experience Scores - Basic Mode */}
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Experience Scores</h4>
                <ScoreBar label="Comfort" stockScore={profile?.stockScores?.drivability ?? 7} upgradedScore={profile?.upgradedScores?.drivability ?? 7} />
                <ScoreBar label="Reliability" stockScore={profile?.stockScores?.reliabilityHeat ?? 7.5} upgradedScore={profile?.upgradedScores?.reliabilityHeat ?? 7.5} />
                <ScoreBar label="Sound" stockScore={profile?.stockScores?.soundEmotion ?? 8} upgradedScore={profile?.upgradedScores?.soundEmotion ?? 8} />
              </div>
            </>
          )}
          
          {/* === ADVANCED MODE: Physics-Based Performance Analysis === */}
          {/* OUTPUT ORDER: Headline → Performance → Details → Track → Recommendations */}
          {tunerMode === 'advanced' && (
            <>
              {/* Performance Metrics - Same visual style as Basic Mode */}
              {(() => {
                // Calculate physics-based values for Advanced Mode
                const stockHp = car?.hp || profile.stockMetrics.hp || 300;
                const advGain = advancedHpEstimate?.gain;
                const validGain = (typeof advGain === 'number' && !isNaN(advGain)) ? advGain : (hpGain || 0);
                const estimatedHp = stockHp + validGain;
                const weight = car?.curb_weight || car?.weight || 3500;
                const drivetrain = car?.drivetrain || 'AWD';
                const tireCompound = advancedSpecs.tires?.compound || 'summer';
                const weightMod = advancedSpecs.weight?.weightReduction || 0;
                const driverWeight = advancedSpecs.weight?.driverWeight || 180;
                
                // Physics calculations (same as CalculatedPerformance)
                const totalWeight = weight + (weightMod || 0) + (driverWeight || 180);
                const stockTotalWeight = weight + 180;
                const stockWheelWeight = 25;
                const currentWheelWeight = advancedSpecs.wheels?.weightPerWheel || stockWheelWeight;
                const wheelWeightDiff = (stockWheelWeight - currentWheelWeight) * 4;
                const effectiveWeight = totalWeight - wheelWeightDiff;
                const stockEffectiveWeight = stockTotalWeight;
                
                // Drivetrain factor for 0-60
                const drivetrainK = { 'AWD': 1.20, 'RWD': 1.35, 'FWD': 1.40, '4WD': 1.25 };
                const baseK = drivetrainK[drivetrain] || 1.30;
                const tireKMultiplier = { 'all-season': 1.08, 'summer': 1.0, 'max-performance': 0.97, 'r-comp': 0.93, 'drag-radial': 0.85, 'slick': 0.82 };
                const kTire = tireKMultiplier[tireCompound] || 1.0;
                
                // 0-60 times
                const weightToHp = effectiveWeight / estimatedHp;
                const stockWeightToHp = stockEffectiveWeight / stockHp;
                const estimated060 = Math.max(2.0, Math.sqrt(weightToHp) * baseK * kTire);
                const stock060 = Math.max(2.5, Math.sqrt(stockWeightToHp) * baseK);
                
                // Braking (60-0)
                const stockBraking60 = profile.stockMetrics.braking60To0 || 120;
                const brakingScore = advancedHpEstimate?.brakingScore || 100;
                const brakingImprovement = (brakingScore - 100) / 100;
                const estimatedBraking60 = Math.round(stockBraking60 * (1 - brakingImprovement * 0.25));
                
                // Lateral G
                const baseG = profile.stockMetrics.lateralG || 0.90;
                const handlingScore = advancedHpEstimate?.handlingScore || 100;
                const handlingImprovement = (handlingScore - 100) / 100;
                const estimatedLateralG = parseFloat((baseG * (1 + handlingImprovement * 0.3)).toFixed(2));
                
                // 1/4 Mile (Advanced-only metric)
                const tractionBonus = tireCompound === 'drag-radial' ? 0.94 : tireCompound === 'slick' ? 0.92 : 1.0;
                const estimatedQuarter = 5.825 * Math.pow(weightToHp, 0.333) * tractionBonus;
                const stockQuarter = 5.825 * Math.pow(stockWeightToHp, 0.333);
                
                // Trap Speed (Advanced-only metric)
                const finalDriveFactor = advancedSpecs.drivetrain?.finalDrive ? Math.min(1.02, 3.5 / advancedSpecs.drivetrain.finalDrive) : 1.0;
                const estimatedTrap = 234 * Math.pow(estimatedHp / effectiveWeight, 0.333) * finalDriveFactor;
                const stockTrap = 234 * Math.pow(stockHp / stockEffectiveWeight, 0.333);
                
                // Power/Weight Ratio (Advanced-only metric)
                const powerToWeight = Math.round((estimatedHp / effectiveWeight) * 2000);
                const stockPtw = Math.round((stockHp / stockEffectiveWeight) * 2000);
                
                // Build cost
                const buildCost = totalCost?.low || 0;
                
                return (
                  <div className={styles.performanceCard}>
                    <div className={styles.performanceHeader}>
                      <h3 className={styles.performanceTitle}>
                        <Icons.bolt size={18} />
                        Performance Metrics
                      </h3>
                      {buildCost > 0 && (
                        <div className={styles.buildStats}>
                          <span 
                            className={`${styles.costBadge} ${totalCost.confidence === 'verified' ? styles.costVerified : totalCost.confidence === 'high' ? styles.costHigh : styles.costEstimated}`}
                            title={`${totalCost.confidence === 'verified' ? 'Verified pricing' : totalCost.confidence === 'high' ? 'High confidence estimate' : 'Estimated pricing'}`}
                          >
                            ${buildCost.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={styles.performanceMetrics}>
                      <MetricRow 
                        icon={Icons.bolt} 
                        label="HP" 
                        stockValue={stockHp} 
                        upgradedValue={estimatedHp} 
                        unit=" hp" 
                      />
                      <MetricRow 
                        icon={Icons.stopwatch} 
                        label="0-60" 
                        stockValue={parseFloat(stock060.toFixed(1))} 
                        upgradedValue={parseFloat(estimated060.toFixed(1))} 
                        unit="s" 
                        isLowerBetter 
                      />
                      <MetricRow 
                        icon={Icons.disc} 
                        label="Braking" 
                        stockValue={stockBraking60} 
                        upgradedValue={estimatedBraking60} 
                        unit="ft" 
                        isLowerBetter 
                      />
                      <MetricRow 
                        icon={Icons.target} 
                        label="Grip" 
                        stockValue={baseG} 
                        upgradedValue={estimatedLateralG} 
                        unit="g" 
                      />
                      {/* Advanced-only metrics */}
                      <MetricRow 
                        icon={Icons.chevronsRight} 
                        label="1/4 Mile" 
                        stockValue={parseFloat(stockQuarter.toFixed(1))} 
                        upgradedValue={parseFloat(estimatedQuarter.toFixed(1))} 
                        unit="s" 
                        isLowerBetter 
                      />
                      <MetricRow 
                        icon={Icons.flag} 
                        label="Trap Speed" 
                        stockValue={Math.round(stockTrap)} 
                        upgradedValue={Math.round(estimatedTrap)} 
                        unit=" mph" 
                      />
                      <MetricRow 
                        icon={Icons.zap} 
                        label="Power/Weight" 
                        stockValue={stockPtw} 
                        upgradedValue={powerToWeight} 
                        unit=" hp/ton" 
                      />
                    </div>
                  </div>
                );
              })()}
              
              {/* Experience Scores - Same as Basic Mode */}
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Experience Scores</h4>
                <ScoreBar label="Comfort" stockScore={profile?.stockScores?.drivability ?? 7} upgradedScore={profile?.upgradedScores?.drivability ?? 7} />
                <ScoreBar label="Reliability" stockScore={profile?.stockScores?.reliabilityHeat ?? 7.5} upgradedScore={profile?.upgradedScores?.reliabilityHeat ?? 7.5} />
                <ScoreBar label="Sound" stockScore={profile?.stockScores?.soundEmotion ?? 8} upgradedScore={profile?.upgradedScores?.soundEmotion ?? 8} />
              </div>
              
              {/* ═══════════════════════════════════════════════════════════════
                  TIER 2: POWER DETAILS - Deep dive into power gains
                  ═══════════════════════════════════════════════════════════════ */}
              
              {/* Virtual Dyno Chart - Power curve visualization */}
              <VirtualDynoChart
                stockHp={car?.hp || profile.stockMetrics.hp || 300}
                estimatedHp={(() => {
                  const stock = car?.hp || profile.stockMetrics.hp || 300;
                  const gain = advancedHpEstimate?.gain;
                  const validGain = (typeof gain === 'number' && !isNaN(gain)) ? gain : (hpGain || 0);
                  return stock + validGain;
                })()}
                stockTorque={car?.torque || Math.round((car?.hp || 300) * 0.85)}
                estimatedTq={advancedHpEstimate?.whp ? Math.round(advancedHpEstimate.whp * 0.9) : null}
                peakRpm={car?.redline || 6500}
              />
              
              {/* Power Limits Advisory - Warnings about component limits */}
              {tuningProfile?.power_limits && (
                <PowerLimitsAdvisory
                  powerLimits={tuningProfile.power_limits}
                  currentHp={(() => {
                    const stock = car?.hp || profile.stockMetrics.hp || 300;
                    const gain = advancedHpEstimate?.gain;
                    const validGain = (typeof gain === 'number' && !isNaN(gain)) ? gain : (hpGain || 0);
                    return stock + validGain;
                  })()}
                />
              )}
              
              {/* ═══════════════════════════════════════════════════════════════
                  TIER 3: HANDLING & TRACK - Dynamics and lap performance
                  ═══════════════════════════════════════════════════════════════ */}
              
              {/* Lap Time Estimator - Track performance estimates */}
              <LapTimeEstimator
                stockHp={car?.hp || profile.stockMetrics.hp || 300}
                estimatedHp={(() => {
                  const stock = car?.hp || profile.stockMetrics.hp || 300;
                  const gain = advancedHpEstimate?.gain;
                  const validGain = (typeof gain === 'number' && !isNaN(gain)) ? gain : (hpGain || 0);
                  return stock + validGain;
                })()}
                weight={car?.curb_weight || car?.weight || 3500}
                drivetrain={car?.drivetrain || 'AWD'}
                tireCompound={advancedSpecs.tires?.compound || 'summer'}
                suspensionSetup={advancedSpecs.suspension}
                brakeSetup={advancedSpecs.brakes}
                aeroSetup={advancedSpecs.aero}
                weightMod={advancedSpecs.weight?.weightReduction || 0}
                driverWeight={advancedSpecs.weight?.driverWeight || 180}
                user={user}
                carSlug={safeCarSlug}
                modsSummary={advancedSpecs}
              />
              
              {/* Handling Balance - Understeer/oversteer tendency */}
              <HandlingBalanceIndicator
                suspensionSetup={advancedSpecs.suspension}
                aeroSetup={advancedSpecs.aero}
                tireCompound={advancedSpecs.tires?.compound || 'summer'}
                drivetrain={car?.drivetrain || 'AWD'}
              />
              
              {/* Aero Balance at Speed - Downforce visualization */}
              <AeroBalanceChart
                aeroSetup={advancedSpecs.aero}
                weight={car?.curb_weight || car?.weight || 3500}
              />
              
              {/* ═══════════════════════════════════════════════════════════════
                  TIER 4: RECOMMENDATIONS - Shopping guidance
                  ═══════════════════════════════════════════════════════════════ */}
              
              {/* Brand Recommendations - Popular brands for this platform */}
              {tuningProfile?.brand_recommendations && (
                <BrandRecommendations
                  brandRecs={tuningProfile.brand_recommendations}
                />
              )}
            </>
          )}

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
              carSlug={car.slug}
              existingImages={buildImages}
              disabled={!user}
              showPreviews={false}
            />
            
            {/* Gallery with Hero Selection - tap any image to make it the hero */}
            {/* Uses car_slug-based API for syncing hero across garage and tuning shop */}
            <BuildMediaGallery
              car={car}
              media={buildImages}
              onVideoClick={(video) => setSelectedVideo(video)}
              onSetPrimary={async (imageId) => {
                // Set hero image by car_slug - this syncs across garage and tuning shop
                if (!user?.id || !safeCarSlug) {
                  console.warn('[UpgradeCenter] Cannot set hero: missing user or car slug');
                  return;
                }
                
                // Optimistic update
                setBuildImages(prev => prev.map(img => ({
                  ...img,
                  is_primary: img.id === imageId,
                })));
                
                try {
                  const response = await fetch(`/api/users/${user.id}/car-images`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ carSlug: safeCarSlug, imageId }),
                  });
                  
                  if (!response.ok) {
                    // Revert on failure - reload images
                    console.error('[UpgradeCenter] Failed to set hero image');
                  }
                } catch (err) {
                  console.error('[UpgradeCenter] Error setting hero image:', err);
                }
              }}
              onSetStockHero={async () => {
                // Clear hero image by car_slug - reverts to stock across all features
                if (!user?.id || !safeCarSlug) {
                  console.warn('[UpgradeCenter] Cannot clear hero: missing user or car slug');
                  return;
                }
                
                // Optimistic update
                setBuildImages(prev => prev.map(img => ({
                  ...img,
                  is_primary: false,
                })));
                
                try {
                  const response = await fetch(`/api/users/${user.id}/car-images`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ carSlug: safeCarSlug, imageId: null }),
                  });
                  
                  if (!response.ok) {
                    console.error('[UpgradeCenter] Failed to clear hero image');
                  }
                } catch (err) {
                  console.error('[UpgradeCenter] Error clearing hero image:', err);
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
          upgradeConfigs={upgradeConfigs}
          onConfigChange={handleUpgradeConfigChange}
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
