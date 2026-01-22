/**
 * User Preferences Store
 * 
 * Global state management for user's car shopping preferences from "Find Your Car".
 * This allows the Compare Modal to check if cars match user's stated requirements.
 * Uses storage abstraction for cross-platform support (PWA/iOS/Android).
 * 
 * @module lib/stores/userPreferencesStore
 */

import { storage } from '@/lib/storage';

const STORAGE_KEY = 'user_preferences'; // Storage abstraction adds 'autorev_' prefix

/**
 * @typedef {Object} UserPreferences
 * @property {number} budgetMin - Minimum budget
 * @property {number} budgetMax - Maximum budget
 * @property {string} transmissionFilter - 'all' | 'manual' | 'automatic'
 * @property {string} drivetrainFilter - 'all' | 'RWD' | 'AWD' | 'FWD'
 * @property {string} seatsFilter - 'all' | '2' | '4'
 * @property {string} engineLayoutFilter - 'all' | 'Mid-Engine' | 'Front-Engine' | 'Rear-Engine'
 * @property {string} originFilter - 'all' | 'american' | 'japanese' | 'european'
 * @property {string} styleFilter - 'all' | 'purist' | 'tuner' | 'drift' | 'stance'
 * @property {string} tierFilter - 'all' | 'premium' | 'upper-mid' | 'mid' | 'budget'
 * @property {Object} weights - Priority weights for scoring
 * @property {number} lastUpdated - Timestamp of last update
 */

/**
 * Default preferences when nothing is set
 * @type {UserPreferences}
 */
export const defaultPreferences = {
  budgetMin: 0,
  budgetMax: 100000,
  transmissionFilter: 'all',
  drivetrainFilter: 'all',
  seatsFilter: 'all',
  engineLayoutFilter: 'all',
  originFilter: 'all',
  styleFilter: 'all',
  tierFilter: 'all',
  weights: {
    sound: 1.5,
    interior: 1,
    track: 1,
    reliability: 1.5,
    value: 1.5,
    driverFun: 2,
    aftermarket: 1,
  },
  lastUpdated: null,
};

/**
 * Load preferences from storage
 * @returns {UserPreferences}
 */
export function loadPreferences() {
  const stored = storage.get(STORAGE_KEY);
  if (stored) {
    return { ...defaultPreferences, ...stored };
  }
  return defaultPreferences;
}

/**
 * Save preferences to storage
 * @param {Partial<UserPreferences>} preferences 
 */
export function savePreferences(preferences) {
  const current = loadPreferences();
  const updated = {
    ...current,
    ...preferences,
    lastUpdated: Date.now(),
  };
  storage.set(STORAGE_KEY, updated);
}

/**
 * Check if user has set any preferences (not just defaults)
 * @returns {boolean}
 */
export function hasUserPreferences() {
  const prefs = loadPreferences();
  return prefs.lastUpdated !== null;
}

/**
 * Get the low price from a price range string like "$55-70K" → 55000
 * @param {Object} car 
 * @returns {number}
 */
function getPriceLow(car) {
  if (car.priceRange) {
    const match = car.priceRange.match(/\$(\d+)/);
    if (match) {
      return parseInt(match[1], 10) * 1000;
    }
  }
  return car.priceAvg || 0;
}

/**
 * Check if a car matches user preferences and return mismatches
 * @param {Object} car - Car data
 * @param {UserPreferences} preferences - User preferences
 * @returns {Object} - { matches: boolean, mismatches: string[] }
 */
export function checkCarAgainstPreferences(car, preferences) {
  const mismatches = [];
  
  // Check budget
  const carPrice = getPriceLow(car);
  if (carPrice > preferences.budgetMax) {
    mismatches.push(`Over budget ($${(carPrice / 1000).toFixed(0)}K vs $${(preferences.budgetMax / 1000).toFixed(0)}K max)`);
  }
  
  // Check transmission
  if (preferences.transmissionFilter !== 'all') {
    const trans = (car.trans || '').toUpperCase();
    const hasManual = trans.includes('MT');
    const hasAuto = trans.includes('AT') || trans.includes('DCT') || trans.includes('PDK') || 
                    trans.includes('DSG') || trans.includes('SMG') || trans.includes('AUTO') ||
                    trans.includes('TRONIC');
    
    if (preferences.transmissionFilter === 'manual' && !hasManual) {
      mismatches.push('No manual transmission option');
    }
    if (preferences.transmissionFilter === 'automatic' && !hasAuto) {
      mismatches.push('No automatic transmission option');
    }
  }
  
  // Check drivetrain
  if (preferences.drivetrainFilter !== 'all' && car.drivetrain !== preferences.drivetrainFilter) {
    mismatches.push(`${car.drivetrain || 'Unknown'} drivetrain (wanted ${preferences.drivetrainFilter})`);
  }
  
  // Check seats
  if (preferences.seatsFilter !== 'all' && car.seats) {
    if (preferences.seatsFilter === '2' && car.seats > 2) {
      mismatches.push(`${car.seats} seats (wanted 2-seater)`);
    }
    if (preferences.seatsFilter === '4' && car.seats < 4) {
      mismatches.push(`${car.seats} seats (wanted 4+)`);
    }
  }
  
  // Check engine layout
  if (preferences.engineLayoutFilter !== 'all' && car.category !== preferences.engineLayoutFilter) {
    mismatches.push(`${car.category || 'Unknown'} layout (wanted ${preferences.engineLayoutFilter})`);
  }
  
  // Check tier
  if (preferences.tierFilter !== 'all' && car.tier !== preferences.tierFilter) {
    const tierLabels = {
      'premium': 'Premium',
      'upper-mid': 'Upper-Mid',
      'mid': 'Mid',
      'budget': 'Budget'
    };
    mismatches.push(`${tierLabels[car.tier] || car.tier} tier (wanted ${tierLabels[preferences.tierFilter]})`);
  }
  
  return {
    matches: mismatches.length === 0,
    mismatches,
  };
}

/**
 * Clear all stored preferences
 */
export function clearPreferences() {
  storage.remove(STORAGE_KEY);
}





















