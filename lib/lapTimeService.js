/**
 * Lap Time Service
 * 
 * Data-driven lap time estimation using real lap time data from car_track_lap_times.
 * Replaces the previous hardcoded physics simulation approach.
 * 
 * This is the SINGLE SOURCE OF TRUTH for lap time estimation.
 * 
 * @module lib/lapTimeService
 */

import { createClient } from '@supabase/supabase-js';

// =============================================================================
// SUPABASE CLIENT
// =============================================================================

let _supabaseClient = null;

function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) return null;
  
  _supabaseClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  
  return _supabaseClient;
}

// =============================================================================
// DRIVER SKILL MODIFIERS
// =============================================================================

/**
 * Driver skill affects how much of the car's potential they can extract.
 * These percentiles represent where in the lap time distribution they'd fall.
 */
export const DRIVER_SKILLS = {
  beginner: {
    label: 'Beginner',
    description: '0-2 years track experience',
    percentile: 0.90, // 90th percentile (slower)
    modUtilization: 0.20, // Only extract 20% of mod potential
  },
  intermediate: {
    label: 'Intermediate', 
    description: '2-5 years, consistent laps',
    percentile: 0.65, // 65th percentile
    modUtilization: 0.50,
  },
  advanced: {
    label: 'Advanced',
    description: '5+ years, pushing limits',
    percentile: 0.25, // 25th percentile (faster)
    modUtilization: 0.80,
  },
  professional: {
    label: 'Pro',
    description: 'Instructor / racer',
    percentile: 0.05, // Top 5%
    modUtilization: 0.95,
  },
};

// =============================================================================
// MODIFICATION IMPACT FACTORS
// =============================================================================

/**
 * How much each mod category affects lap time (as percentage improvement)
 * Based on empirical data and track testing
 */
const MOD_IMPACT = {
  // Power mods - percentage improvement per 50hp gain
  power: {
    perHpGain: 0.015, // 1.5% per 50hp
    maxImprovement: 0.08, // Cap at 8%
  },
  
  // Tire compound improvements over all-season baseline
  tires: {
    'all-season': 0,
    'summer': 0.02,      // 2% faster
    'max-performance': 0.04,
    'r-comp': 0.07,
    'slick': 0.10,       // 10% faster
  },
  
  // Suspension improvements
  suspension: {
    'stock': 0,
    'lowering-springs': 0.01,
    'coilovers': 0.025,
    'coilovers-race': 0.04,
  },
  
  // Brake improvements
  brakes: {
    bbkFront: 0.005,
    trackPads: 0.01,
    racePads: 0.015,
    racingFluid: 0.003,
    stainlessLines: 0.002,
  },
  
  // Aero improvements
  aero: {
    lipSpoiler: 0.005,
    gtWingLow: 0.015,
    gtWingHigh: 0.025,
    frontSplitter: 0.01,
    diffuser: 0.01,
  },
  
  // Weight reduction - percentage per 100lbs saved
  weight: {
    perLbsSaved: 0.0001, // 1% per 100lbs
    maxImprovement: 0.05,
  },
};

// =============================================================================
// TRACK DATA CACHE
// =============================================================================

let _trackStatsCache = new Map();
let _cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached track statistics or refresh if stale
 * 
 * NOTE: As of 2026-01-21, tracks and track_venues are now unified.
 * The tracks table contains all track data including physics parameters.
 */
async function getTrackStats(trackSlug) {
  const now = Date.now();
  
  // Return cached if fresh
  if (_trackStatsCache.has(trackSlug) && (now - _cacheTimestamp) < CACHE_TTL) {
    return _trackStatsCache.get(trackSlug);
  }
  
  const client = getSupabaseClient();
  if (!client) return null;
  
  // Get track ID from unified tracks table
  const { data: trackData } = await client
    .from('tracks')
    .select('id, name')
    .eq('slug', trackSlug)
    .single();
  
  if (!trackData) return null;
  
  return getTrackStatsById(trackData.id, trackSlug);
}

/**
 * Internal helper to get stats by track_id
 */
async function getTrackStatsById(trackId, cacheKey) {
  const client = getSupabaseClient();
  const now = Date.now();
  
  const { data: lapData, error: lapError } = await client
    .from('car_track_lap_times')
    .select(`
      lap_time_ms,
      is_stock,
      car_id
    `)
    .eq('track_id', trackId)
    .not('lap_time_ms', 'is', null)
    .order('lap_time_ms', { ascending: true });
  
  if (lapError || !lapData || lapData.length === 0) return null;
  
  // Get car data separately for HP correlation
  const carIds = [...new Set(lapData.filter(l => l.car_id).map(l => l.car_id))];
  let carsMap = new Map();
  
  if (carIds.length > 0) {
    const { data: carsData } = await client
      .from('cars')
      .select('id, slug, name, hp, curb_weight')
      .in('id', carIds);
    
    carsMap = new Map((carsData || []).map(c => [c.id, c]));
  }
  
  const enrichedData = lapData.map(lap => ({
    ...lap,
    car: carsMap.get(lap.car_id) || null,
  }));
  
  const stats = computeTrackStats(enrichedData);
  _trackStatsCache.set(cacheKey, stats);
  _cacheTimestamp = now;
  return stats;
}

/**
 * Compute statistics from lap time data
 */
function computeTrackStats(lapData) {
  if (!lapData || lapData.length === 0) return null;
  
  const times = lapData.map(l => l.lap_time_ms / 1000).sort((a, b) => a - b);
  const stockTimes = lapData
    .filter(l => l.is_stock)
    .map(l => l.lap_time_ms / 1000)
    .sort((a, b) => a - b);
  
  // Build HP to lap time correlation
  const hpTimePairs = lapData
    .filter(l => l.car?.hp)
    .map(l => ({ hp: l.car.hp, time: l.lap_time_ms / 1000 }));
  
  return {
    count: times.length,
    stockCount: stockTimes.length,
    
    // Overall statistics
    fastest: times[0],
    slowest: times[times.length - 1],
    median: percentile(times, 0.5),
    mean: times.reduce((a, b) => a + b, 0) / times.length,
    stdDev: standardDeviation(times),
    
    // Percentiles for skill-based estimation
    p5: percentile(times, 0.05),   // Pro
    p25: percentile(times, 0.25),  // Advanced  
    p50: percentile(times, 0.50),  // Median
    p65: percentile(times, 0.65),  // Intermediate
    p90: percentile(times, 0.90),  // Beginner
    
    // Stock car statistics (for baseline)
    stockMedian: stockTimes.length > 0 ? percentile(stockTimes, 0.5) : null,
    stockP25: stockTimes.length > 0 ? percentile(stockTimes, 0.25) : null,
    stockP75: stockTimes.length > 0 ? percentile(stockTimes, 0.75) : null,
    
    // HP correlation
    hpCorrelation: computeHpCorrelation(hpTimePairs),
    
    // Raw data for advanced queries
    times,
    stockTimes,
    hpTimePairs,
  };
}

/**
 * Compute HP to time correlation coefficient
 */
function computeHpCorrelation(pairs) {
  if (pairs.length < 5) return null;
  
  const n = pairs.length;
  const sumX = pairs.reduce((a, p) => a + p.hp, 0);
  const sumY = pairs.reduce((a, p) => a + p.time, 0);
  const sumXY = pairs.reduce((a, p) => a + p.hp * p.time, 0);
  const sumX2 = pairs.reduce((a, p) => a + p.hp * p.hp, 0);
  const sumY2 = pairs.reduce((a, p) => a + p.time * p.time, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  if (denominator === 0) return null;
  
  const r = numerator / denominator;
  
  // Linear regression coefficients: time = slope * hp + intercept
  const slope = numerator / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { r, slope, intercept, n };
}

/**
 * Calculate percentile value
 */
function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  if (sortedArr.length === 1) return sortedArr[0];
  
  const index = p * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;
  
  return sortedArr[lower] + fraction * (sortedArr[upper] - sortedArr[lower]);
}

/**
 * Calculate standard deviation
 */
function standardDeviation(arr) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const squaredDiffs = arr.map(x => Math.pow(x - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / arr.length);
}

// =============================================================================
// MAIN ESTIMATION FUNCTIONS
// =============================================================================

/**
 * Get lap time baseline for a track
 * Uses real data when available, falls back to estimation
 * 
 * @param {string} trackSlug - Track identifier
 * @param {Object} carSpecs - Car specifications { hp, weight }
 * @returns {Object} Baseline times and statistics
 */
export async function getTrackBaseline(trackSlug, carSpecs = {}) {
  const stats = await getTrackStats(trackSlug);
  
  if (stats && stats.count >= 5) {
    // We have real data - use it
    return {
      source: 'real_data',
      sampleSize: stats.count,
      
      // Skill-based baselines from real data
      proTime: stats.p5,
      advancedTime: stats.p25,
      intermediateTime: stats.p65,
      beginnerTime: stats.p90,
      
      // Stock baselines
      stockMedian: stats.stockMedian || stats.median,
      stockRange: stats.stockP75 && stats.stockP25 
        ? [stats.stockP25, stats.stockP75]
        : [stats.p25, stats.p75],
      
      // Statistics
      fastest: stats.fastest,
      median: stats.median,
      variance: stats.stdDev,
      
      // HP correlation for power adjustments
      hpCorrelation: stats.hpCorrelation,
    };
  }
  
  // No real data - use fallback estimation
  return {
    source: 'estimated',
    sampleSize: 0,
    proTime: null,
    advancedTime: null,
    intermediateTime: null,
    beginnerTime: null,
    stockMedian: null,
    note: 'No lap time data available for this track',
  };
}

/**
 * Estimate lap time for a car at a track
 * 
 * @param {Object} params - Estimation parameters
 * @param {string} params.trackSlug - Track identifier
 * @param {number} params.stockHp - Stock horsepower
 * @param {number} params.currentHp - Current horsepower (with mods)
 * @param {number} params.weight - Vehicle weight in lbs
 * @param {string} params.driverSkill - Driver skill level
 * @param {Object} params.mods - Modification summary
 * @returns {Object} Estimated lap times
 */
export async function estimateLapTime({
  trackSlug,
  stockHp = 300,
  currentHp = null,
  weight = 3500,
  driverSkill = 'intermediate',
  mods = {},
}) {
  const hp = currentHp || stockHp;
  const hpGain = Math.max(0, hp - stockHp);
  
  const baseline = await getTrackBaseline(trackSlug, { hp: stockHp, weight });
  const skill = DRIVER_SKILLS[driverSkill] || DRIVER_SKILLS.intermediate;
  
  // If we have real data, use percentile-based estimation
  if (baseline.source === 'real_data') {
    // Get the baseline time for this skill level
    let stockTime;
    switch (driverSkill) {
      case 'professional': stockTime = baseline.proTime; break;
      case 'advanced': stockTime = baseline.advancedTime; break;
      case 'intermediate': stockTime = baseline.intermediateTime; break;
      case 'beginner': stockTime = baseline.beginnerTime; break;
      default: stockTime = baseline.intermediateTime;
    }
    
    // Calculate modification improvements
    const modImprovement = calculateModImprovement(stockTime, {
      hpGain,
      tireCompound: mods.tireCompound,
      suspension: mods.suspension,
      brakes: mods.brakes,
      aero: mods.aero,
      weightReduction: mods.weightReduction || 0,
    });
    
    // Apply skill-based utilization
    const realizedImprovement = modImprovement.totalSeconds * skill.modUtilization;
    const moddedTime = stockTime - realizedImprovement;
    
    return {
      source: baseline.source,
      sampleSize: baseline.sampleSize,
      
      stockLapTime: stockTime,
      moddedLapTime: moddedTime,
      improvement: realizedImprovement,
      
      // Breakdown
      theoreticalImprovement: modImprovement.totalSeconds,
      utilization: skill.modUtilization,
      skillLabel: skill.label,
      
      // Mod breakdown
      modBreakdown: {
        power: modImprovement.power * skill.modUtilization,
        tires: modImprovement.tires * skill.modUtilization,
        suspension: modImprovement.suspension * skill.modUtilization,
        brakes: modImprovement.brakes * skill.modUtilization,
        aero: modImprovement.aero * skill.modUtilization,
        weight: modImprovement.weight * skill.modUtilization,
      },
      
      // Reference data
      trackFastest: baseline.fastest,
      trackMedian: baseline.median,
      
      formatted: {
        stock: formatLapTime(stockTime),
        modded: formatLapTime(moddedTime),
        improvement: `-${realizedImprovement.toFixed(2)}s`,
      },
    };
  }
  
  // No real data - return null/unavailable
  return {
    source: 'unavailable',
    sampleSize: 0,
    stockLapTime: null,
    moddedLapTime: null,
    improvement: null,
    note: 'Insufficient lap time data for this track. Log your times to help build the database!',
  };
}

/**
 * Calculate modification improvement in seconds
 */
function calculateModImprovement(baseTime, mods) {
  const improvements = {
    power: 0,
    tires: 0,
    suspension: 0,
    brakes: 0,
    aero: 0,
    weight: 0,
  };
  
  // Power improvement
  if (mods.hpGain > 0) {
    const powerPercent = Math.min(
      (mods.hpGain / 50) * MOD_IMPACT.power.perHpGain,
      MOD_IMPACT.power.maxImprovement
    );
    improvements.power = baseTime * powerPercent;
  }
  
  // Tire improvement
  const tirePercent = MOD_IMPACT.tires[mods.tireCompound] || 0;
  improvements.tires = baseTime * tirePercent;
  
  // Suspension improvement
  const suspPercent = MOD_IMPACT.suspension[mods.suspension?.type] || 0;
  improvements.suspension = baseTime * suspPercent;
  
  // Brake improvement
  let brakePercent = 0;
  if (mods.brakes?.bbkFront) brakePercent += MOD_IMPACT.brakes.bbkFront;
  if (mods.brakes?.pads === 'track') brakePercent += MOD_IMPACT.brakes.trackPads;
  if (mods.brakes?.pads === 'race') brakePercent += MOD_IMPACT.brakes.racePads;
  if (mods.brakes?.fluid === 'racing') brakePercent += MOD_IMPACT.brakes.racingFluid;
  if (mods.brakes?.stainlessLines) brakePercent += MOD_IMPACT.brakes.stainlessLines;
  improvements.brakes = baseTime * brakePercent;
  
  // Aero improvement
  let aeroPercent = 0;
  if (mods.aero?.rearWing === 'lip-spoiler') aeroPercent += MOD_IMPACT.aero.lipSpoiler;
  if (mods.aero?.rearWing === 'gt-wing-low') aeroPercent += MOD_IMPACT.aero.gtWingLow;
  if (mods.aero?.rearWing === 'gt-wing-high') aeroPercent += MOD_IMPACT.aero.gtWingHigh;
  if (mods.aero?.frontSplitter) aeroPercent += MOD_IMPACT.aero.frontSplitter;
  if (mods.aero?.diffuser) aeroPercent += MOD_IMPACT.aero.diffuser;
  improvements.aero = baseTime * aeroPercent;
  
  // Weight improvement
  if (mods.weightReduction > 0) {
    const weightPercent = Math.min(
      mods.weightReduction * MOD_IMPACT.weight.perLbsSaved,
      MOD_IMPACT.weight.maxImprovement
    );
    improvements.weight = baseTime * weightPercent;
  }
  
  improvements.totalSeconds = Object.values(improvements).reduce((a, b) => a + b, 0);
  
  return improvements;
}

/**
 * Format seconds to lap time string (M:SS.ss)
 */
function formatLapTime(seconds) {
  if (!seconds || isNaN(seconds)) return '--:--.--';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2).padStart(5, '0');
  return `${mins}:${secs}`;
}

/**
 * Get track statistics summary for UI
 */
export async function getTrackStatsSummary(trackSlug) {
  const stats = await getTrackStats(trackSlug);
  
  if (!stats || stats.count === 0) {
    return {
      hasData: false,
      count: 0,
      message: 'No lap time data available',
    };
  }
  
  return {
    hasData: true,
    count: stats.count,
    stockCount: stats.stockCount,
    
    fastest: formatLapTime(stats.fastest),
    median: formatLapTime(stats.median),
    slowest: formatLapTime(stats.slowest),
    
    fastestSeconds: stats.fastest,
    medianSeconds: stats.median,
    
    // Percentile distribution
    distribution: {
      pro: formatLapTime(stats.p5),
      advanced: formatLapTime(stats.p25),
      intermediate: formatLapTime(stats.p65),
      beginner: formatLapTime(stats.p90),
    },
    
    // Time spread
    spread: stats.slowest - stats.fastest,
    variance: stats.stdDev,
  };
}

/**
 * Find similar cars to a given spec for comparison
 */
export async function findSimilarCars(trackSlug, { hp, weight }) {
  const client = getSupabaseClient();
  if (!client) return [];
  
  // Get track ID from unified tracks table
  const { data: trackData } = await client
    .from('tracks')
    .select('id')
    .eq('slug', trackSlug)
    .single();
  
  if (!trackData) return [];
  
  // Find lap times for this track
  const { data: lapData, error: lapError } = await client
    .from('car_track_lap_times')
    .select('lap_time_ms, lap_time_text, is_stock, source_url, car_id')
    .eq('track_id', trackData.id)
    .not('lap_time_ms', 'is', null)
    .order('lap_time_ms', { ascending: true })
    .limit(100);
  
  if (lapError || !lapData || lapData.length === 0) return [];
  
  // Get car data
  const carIds = [...new Set(lapData.filter(l => l.car_id).map(l => l.car_id))];
  if (carIds.length === 0) return [];
  
  const { data: carsData } = await client
    .from('cars')
    .select('id, slug, name, hp, curb_weight')
    .in('id', carIds);
  
  const carsMap = new Map((carsData || []).map(c => [c.id, c]));
  
  // Filter for similar HP range
  const hpRange = [hp * 0.8, hp * 1.2]; // ±20% HP
  
  const results = lapData
    .map(lap => {
      const car = carsMap.get(lap.car_id);
      return {
        ...lap,
        car,
      };
    })
    .filter(d => d.car && d.car.hp >= hpRange[0] && d.car.hp <= hpRange[1])
    .slice(0, 10)
    .map(d => ({
      carName: d.car?.name,
      carSlug: d.car?.slug,
      hp: d.car?.hp,
      weight: d.car?.curb_weight,
      lapTime: formatLapTime(d.lap_time_ms / 1000),
      lapTimeSeconds: d.lap_time_ms / 1000,
      isStock: d.is_stock,
      sourceUrl: d.source_url,
    }));
  
  return results;
}

// =============================================================================
// EXPORTS
// =============================================================================

const lapTimeService = {
  // Core functions
  estimateLapTime,
  getTrackBaseline,
  getTrackStatsSummary,
  findSimilarCars,
  
  // Constants
  DRIVER_SKILLS,
  MOD_IMPACT,
  
  // Utilities
  formatLapTime,
};

export default lapTimeService;
