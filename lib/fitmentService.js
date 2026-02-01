/**
 * Fitment Service
 *
 * Client-side service for fetching wheel/tire fitment data.
 * Used by Tuning Shop wheel configurator.
 *
 * Features:
 * - Caching to prevent redundant fetches
 * - Error handling with fallbacks
 * - Type definitions for fitment data
 *
 * @module lib/fitmentService
 */

import { getSlugFromCarId } from './carResolver.js';

/**
 * @typedef {Object} FitmentOption
 * @property {string|null} id - Database ID
 * @property {string} fitmentType - oem, oem_optional, plus_one, plus_two, square, aggressive, conservative
 * @property {string} displayName - Human-readable name
 * @property {number} wheelDiameter - Wheel diameter in inches
 * @property {number} wheelWidthFront - Front wheel width
 * @property {number} wheelWidthRear - Rear wheel width
 * @property {number} wheelOffsetFront - Front wheel offset in mm
 * @property {number} wheelOffsetRear - Rear wheel offset in mm
 * @property {string} wheelBoltPattern - e.g., "5x120"
 * @property {number} wheelCenterBore - Center bore in mm
 * @property {string} tireSizeFront - e.g., "255/35R19"
 * @property {string} tireSizeRear - e.g., "275/35R19"
 * @property {boolean} requiresFenderRoll - Whether fender modification is needed
 * @property {boolean} requiresCamberAdjustment - Whether camber adjustment is needed
 * @property {boolean} requiresSpacers - Whether spacers are needed
 * @property {number} spacerSizeFrontMm - Front spacer size if needed
 * @property {number} spacerSizeRearMm - Rear spacer size if needed
 * @property {string} clearanceNotes - Notes about clearance issues
 * @property {string[]} recommendedFor - Use case tags (daily-driving, track, show, etc.)
 * @property {string} performanceNotes - Impact on performance
 * @property {number} weightDifferenceLbs - Weight change from OEM
 * @property {number} estimatedCostLow - Low cost estimate
 * @property {number} estimatedCostHigh - High cost estimate
 * @property {boolean} verified - Whether fitment is verified
 */

/**
 * @typedef {Object} FitmentData
 * @property {string} carId - Car UUID identifier
 * @property {string} carSlug - Car slug (for backward compatibility with API response)
 * @property {FitmentOption|null} oem - OEM baseline specs
 * @property {FitmentOption[]} options - Upgrade options
 * @property {number} totalOptions - Total number of options including OEM
 * @property {string} [source] - Data source (fitment_options or maintenance_specs)
 */

// In-memory cache for fitment data (keyed by carId)
const fitmentCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch fitment options for a car
 * @param {string} carId - Car UUID identifier
 * @param {Object} options - Options
 * @param {boolean} options.skipCache - Skip cache and force fresh fetch
 * @returns {Promise<{data: FitmentData|null, error: Error|null}>}
 */
export async function fetchCarFitments(carId, { skipCache = false } = {}) {
  if (!carId) {
    return { data: null, error: new Error('Car ID is required') };
  }

  // Check cache
  if (!skipCache) {
    const cached = fitmentCache.get(carId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      console.log('[fitmentService] Cache hit for:', carId);
      return { data: cached.data, error: null };
    }
  }

  try {
    // Resolve carId to slug for API URL construction
    const carSlug = await getSlugFromCarId(carId);
    if (!carSlug) {
      return { data: null, error: new Error('Car not found') };
    }

    console.log('[fitmentService] Fetching fitments for:', carId);
    const response = await fetch(`/api/cars/${carSlug}/fitments`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Unknown error');
    }

    // Ensure carId is included in the response data
    const fitmentData = {
      ...result.data,
      carId, // Add carId to the response
    };

    // Cache the result using carId as the key
    fitmentCache.set(carId, {
      data: fitmentData,
      timestamp: Date.now(),
    });

    return { data: fitmentData, error: null };
  } catch (err) {
    console.error('[fitmentService] Error fetching fitments:', err);
    return { data: null, error: err };
  }
}

/**
 * Clear fitment cache for a specific car or all cars
 * @param {string} [carId] - Optional car UUID. If not provided, clears all cache.
 */
export function clearFitmentCache(carId = null) {
  if (carId) {
    fitmentCache.delete(carId);
  } else {
    fitmentCache.clear();
  }
}

/**
 * Get fitment warnings for a specific option
 * @param {FitmentOption} option - Fitment option to check
 * @returns {Object[]} Array of warning objects with type, message, severity
 */
export function getFitmentWarnings(option) {
  const warnings = [];

  if (option.requiresFenderRoll) {
    warnings.push({
      type: 'fender_roll',
      severity: 'warning',
      message: 'Requires fender rolling/pulling for clearance',
      icon: '⚠️',
    });
  }

  if (option.requiresCamberAdjustment) {
    warnings.push({
      type: 'camber',
      severity: 'info',
      message: 'Camber adjustment recommended for optimal tire wear',
      icon: '🔧',
    });
  }

  if (option.requiresSpacers) {
    const spacerInfo = [];
    if (option.spacerSizeFrontMm) spacerInfo.push(`${option.spacerSizeFrontMm}mm front`);
    if (option.spacerSizeRearMm) spacerInfo.push(`${option.spacerSizeRearMm}mm rear`);

    warnings.push({
      type: 'spacers',
      severity: 'info',
      message: `Spacers required: ${spacerInfo.join(', ') || 'size TBD'}`,
      icon: '📏',
    });
  }

  if (option.clearanceNotes) {
    warnings.push({
      type: 'clearance',
      severity: 'info',
      message: option.clearanceNotes,
      icon: '📝',
    });
  }

  return warnings;
}

/**
 * Get recommended use case tags with display info
 * @param {string[]} recommendedFor - Array of use case keys
 * @returns {Object[]} Array of tag objects with key, label, color
 */
export function getRecommendedForTags(recommendedFor = []) {
  const tagConfig = {
    'daily-driving': { label: 'Daily Driving', color: '#4ade80' },
    track: { label: 'Track', color: '#f97316' },
    show: { label: 'Show', color: '#a855f7' },
    autocross: { label: 'Autocross', color: '#3b82f6' },
    street: { label: 'Street+', color: '#22d3d8' },
    drag: { label: 'Drag', color: '#ef4444' },
    drift: { label: 'Drift', color: '#f59e0b' },
    stance: { label: 'Stance', color: '#ec4899' },
    'oem-plus': { label: 'OEM+', color: '#6b7280' },
  };

  return recommendedFor.map((key) => ({
    key,
    label: tagConfig[key]?.label || key,
    color: tagConfig[key]?.color || '#9ca3af',
  }));
}

/**
 * Calculate estimated total cost for a wheel/tire setup
 * @param {FitmentOption} option - Fitment option
 * @param {Object} prices - Optional price overrides
 * @returns {{ low: number, high: number, breakdown: Object }}
 */
export function estimateFitmentCost(option, prices = {}) {
  // Default estimates if not provided
  const defaults = {
    wheelSetLow: 800,
    wheelSetHigh: 3000,
    tireSetLow: 600,
    tireSetHigh: 1600,
    spacersLow: 100,
    spacersHigh: 300,
    camberKitLow: 200,
    camberKitHigh: 600,
    fenderWorkLow: 200,
    fenderWorkHigh: 800,
    installLow: 100,
    installHigh: 300,
  };

  const p = { ...defaults, ...prices };

  let low = 0;
  let high = 0;
  const breakdown = {};

  // Base wheel + tire cost
  if (option.estimatedCostLow && option.estimatedCostHigh) {
    breakdown.wheelsTires = { low: option.estimatedCostLow, high: option.estimatedCostHigh };
    low += option.estimatedCostLow;
    high += option.estimatedCostHigh;
  } else {
    breakdown.wheels = { low: p.wheelSetLow, high: p.wheelSetHigh };
    breakdown.tires = { low: p.tireSetLow, high: p.tireSetHigh };
    low += p.wheelSetLow + p.tireSetLow;
    high += p.wheelSetHigh + p.tireSetHigh;
  }

  // Add-ons based on requirements
  if (option.requiresSpacers) {
    breakdown.spacers = { low: p.spacersLow, high: p.spacersHigh };
    low += p.spacersLow;
    high += p.spacersHigh;
  }

  if (option.requiresCamberAdjustment) {
    breakdown.camberKit = { low: p.camberKitLow, high: p.camberKitHigh };
    low += p.camberKitLow;
    high += p.camberKitHigh;
  }

  if (option.requiresFenderRoll) {
    breakdown.fenderWork = { low: p.fenderWorkLow, high: p.fenderWorkHigh };
    low += p.fenderWorkLow;
    high += p.fenderWorkHigh;
  }

  // Installation
  breakdown.install = { low: p.installLow, high: p.installHigh };
  low += p.installLow;
  high += p.installHigh;

  return { low, high, breakdown };
}

/**
 * Format wheel specs for display
 * @param {FitmentOption} option - Fitment option
 * @returns {string} Formatted string like "19×8.5 +35 / 19×9.5 +38"
 */
export function formatWheelSpecs(option) {
  if (!option.wheelDiameter) return 'N/A';

  const front = `${option.wheelDiameter}×${option.wheelWidthFront}`;
  const rear = `${option.wheelDiameter}×${option.wheelWidthRear}`;

  const frontOffset = option.wheelOffsetFront ? ` +${option.wheelOffsetFront}` : '';
  const rearOffset = option.wheelOffsetRear ? ` +${option.wheelOffsetRear}` : '';

  if (
    option.wheelWidthFront === option.wheelWidthRear &&
    option.wheelOffsetFront === option.wheelOffsetRear
  ) {
    return `${front}${frontOffset} (Square)`;
  }

  return `${front}${frontOffset}F / ${rear}${rearOffset}R`;
}

/**
 * Format tire specs for display
 * @param {FitmentOption} option - Fitment option
 * @returns {string} Formatted string like "255/35R19 / 275/35R19"
 */
export function formatTireSpecs(option) {
  if (!option.tireSizeFront) return 'N/A';

  if (option.tireSizeFront === option.tireSizeRear) {
    return `${option.tireSizeFront} (Square)`;
  }

  return `${option.tireSizeFront} / ${option.tireSizeRear}`;
}

/**
 * Compare two fitment options
 * @param {FitmentOption} optionA
 * @param {FitmentOption} optionB
 * @returns {Object} Comparison object with differences
 */
export function compareFitments(optionA, optionB) {
  if (!optionA || !optionB) return null;

  return {
    wheelDiameterDiff: (optionB.wheelDiameter || 0) - (optionA.wheelDiameter || 0),
    wheelWidthFrontDiff: (optionB.wheelWidthFront || 0) - (optionA.wheelWidthFront || 0),
    wheelWidthRearDiff: (optionB.wheelWidthRear || 0) - (optionA.wheelWidthRear || 0),
    offsetFrontDiff: (optionB.wheelOffsetFront || 0) - (optionA.wheelOffsetFront || 0),
    offsetRearDiff: (optionB.wheelOffsetRear || 0) - (optionA.wheelOffsetRear || 0),
    weightDiff: optionB.weightDifferenceLbs || 0,
    additionalRequirements: {
      fenderRoll: optionB.requiresFenderRoll && !optionA.requiresFenderRoll,
      camber: optionB.requiresCamberAdjustment && !optionA.requiresCamberAdjustment,
      spacers: optionB.requiresSpacers && !optionA.requiresSpacers,
    },
  };
}

const fitmentService = {
  fetchCarFitments,
  clearFitmentCache,
  getFitmentWarnings,
  getRecommendedForTags,
  estimateFitmentCost,
  formatWheelSpecs,
  formatTireSpecs,
  compareFitments,
};

export default fitmentService;
