/**
 * Lap Time Service
 *
 * Data-driven lap time estimation using real lap time data from car_track_lap_times.
 * Uses a TIERED ESTIMATION approach for maximum accuracy:
 *
 * TIER 1: Statistical (>= 10 real lap times) - Percentile-based, most accurate
 * TIER 2: Reference-Scaled (Pro reference time available) - Based on professional times
 * TIER 3: Similar Car Interpolation - Based on similar vehicles with data
 * TIER 4: Insufficient Data - Honest "no reliable estimate"
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
// CONSTANTS
// =============================================================================

/**
 * Minimum samples required for each tier
 */
const TIER_THRESHOLDS = {
  STATISTICAL: 10, // Tier 1: Need 10+ times for reliable percentiles
  REFERENCE: 3, // Tier 2: Need 3+ pro times for reference-based
  SIMILAR_CAR: 5, // Tier 3: Need 5+ similar car times for interpolation
};

/**
 * Driver skill affects how much of the car's potential they can extract.
 * These percentiles represent where in the lap time distribution they'd fall.
 */
export const DRIVER_SKILLS = {
  beginner: {
    label: 'Beginner',
    description: '0-2 years track experience',
    percentile: 0.9, // 90th percentile (slower)
    modUtilization: 0.2, // Only extract 20% of mod potential
    penaltyFromPro: 0.25, // 25% slower than pro baseline
  },
  intermediate: {
    label: 'Intermediate',
    description: '2-5 years, consistent laps',
    percentile: 0.65, // 65th percentile
    modUtilization: 0.5,
    penaltyFromPro: 0.1, // 10% slower than pro
  },
  advanced: {
    label: 'Advanced',
    description: '5+ years, pushing limits',
    percentile: 0.25, // 25th percentile (faster)
    modUtilization: 0.8,
    penaltyFromPro: 0.03, // 3% slower than pro
  },
  professional: {
    label: 'Pro',
    description: 'Instructor / racer',
    percentile: 0.05, // Top 5%
    modUtilization: 0.95,
    penaltyFromPro: 0, // Baseline
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
    summer: 0.02, // 2% faster
    'max-performance': 0.04,
    'r-comp': 0.07,
    slick: 0.1, // 10% faster
  },

  // Suspension improvements
  suspension: {
    stock: 0,
    'lowering-springs': 0.01,
    coilovers: 0.025,
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

const _trackStatsCache = new Map();
let _cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Determine if a lap time is from a professional source
 * Professional sources include automotive publications (Car and Driver, Motor Trend, etc.)
 * which are aggregated by FastestLaps.com
 */
function isProfessionalLapTime(lapRecord) {
  const sourceUrl = lapRecord.source_url || '';
  // FastestLaps aggregates times from automotive publications
  if (sourceUrl.includes('fastestlaps.com')) return true;
  // Check conditions metadata if available
  if (lapRecord.conditions?.driver_type === 'professional') return true;
  // Default to unknown/amateur
  return false;
}

/**
 * Get cached track statistics or refresh if stale
 */
async function getTrackStats(trackSlug) {
  const now = Date.now();

  // Return cached if fresh
  if (_trackStatsCache.has(trackSlug) && now - _cacheTimestamp < CACHE_TTL) {
    return _trackStatsCache.get(trackSlug);
  }

  const client = getSupabaseClient();
  if (!client) return null;

  // Get track ID from unified tracks table
  const { data: trackData } = await client
    .from('tracks')
    .select('id, name, pro_reference_time')
    .eq('slug', trackSlug)
    .single();

  if (!trackData) return null;

  return getTrackStatsById(trackData.id, trackSlug, trackData.pro_reference_time);
}

/**
 * Internal helper to get stats by track_id
 * Now separates professional and amateur times for tiered estimation
 */
async function getTrackStatsById(trackId, cacheKey, proReferenceTime = null) {
  const client = getSupabaseClient();
  const now = Date.now();

  const { data: lapData, error: lapError } = await client
    .from('car_track_lap_times')
    .select(
      `
      lap_time_ms,
      is_stock,
      car_id,
      source_url,
      conditions
    `
    )
    .eq('track_id', trackId)
    .not('lap_time_ms', 'is', null)
    .order('lap_time_ms', { ascending: true });

  if (lapError || !lapData || lapData.length === 0) {
    // Return stats with just the pro reference time if available
    if (proReferenceTime) {
      const stats = {
        count: 0,
        proCount: 0,
        proReferenceTime: parseFloat(proReferenceTime),
        hasProReference: true,
        times: [],
        proTimes: [],
      };
      _trackStatsCache.set(cacheKey, stats);
      _cacheTimestamp = now;
      return stats;
    }
    return null;
  }

  // Get car data separately for HP correlation
  const carIds = [...new Set(lapData.filter((l) => l.car_id).map((l) => l.car_id))];
  let carsMap = new Map();

  if (carIds.length > 0) {
    const { data: carsData } = await client
      .from('cars')
      .select('id, slug, name, hp, curb_weight')
      .in('id', carIds);

    carsMap = new Map((carsData || []).map((c) => [c.id, c]));
  }

  // Separate professional and amateur times
  const proLaps = [];
  const amateurLaps = [];

  for (const lap of lapData) {
    const enrichedLap = {
      ...lap,
      car: carsMap.get(lap.car_id) || null,
    };

    if (isProfessionalLapTime(lap)) {
      proLaps.push(enrichedLap);
    } else {
      amateurLaps.push(enrichedLap);
    }
  }

  const allTimes = lapData.map((l) => l.lap_time_ms / 1000).sort((a, b) => a - b);
  const proTimes = proLaps.map((l) => l.lap_time_ms / 1000).sort((a, b) => a - b);
  const amateurTimes = amateurLaps.map((l) => l.lap_time_ms / 1000).sort((a, b) => a - b);
  const stockTimes = lapData
    .filter((l) => l.is_stock)
    .map((l) => l.lap_time_ms / 1000)
    .sort((a, b) => a - b);

  // Filter outliers for skill-based estimation
  const filteredTimes = filterOutliers(allTimes, 1.5);
  const filteredProTimes = filterOutliers(proTimes, 1.5);

  // Use filtered times for percentiles if we have enough data
  const timesForPercentiles = filteredTimes.length >= 5 ? filteredTimes : allTimes;

  // Build HP to lap time correlation (using all data for better correlation)
  const hpTimePairs = lapData
    .filter((l) => carsMap.get(l.car_id)?.hp)
    .map((l) => ({
      hp: carsMap.get(l.car_id).hp,
      time: l.lap_time_ms / 1000,
      weight: carsMap.get(l.car_id).curb_weight,
    }));

  const stats = {
    count: allTimes.length,
    proCount: proTimes.length,
    amateurCount: amateurTimes.length,
    filteredCount: filteredTimes.length,
    stockCount: stockTimes.length,

    // Pro reference time from track data or fastest pro time
    proReferenceTime: proReferenceTime
      ? parseFloat(proReferenceTime)
      : filteredProTimes.length > 0
        ? filteredProTimes[0]
        : null,
    hasProReference: !!(proReferenceTime || filteredProTimes.length > 0),

    // Overall statistics (from filtered data)
    fastest: allTimes[0],
    slowest: allTimes[allTimes.length - 1],
    median: percentile(allTimes, 0.5),
    mean: allTimes.reduce((a, b) => a + b, 0) / allTimes.length,
    stdDev: standardDeviation(allTimes),

    // Professional times statistics
    proFastest: proTimes.length > 0 ? proTimes[0] : null,
    proMedian: proTimes.length > 0 ? percentile(proTimes, 0.5) : null,
    proP10: filteredProTimes.length >= 3 ? percentile(filteredProTimes, 0.1) : null,

    // Percentiles for skill-based estimation (from filtered data to exclude race cars)
    p5: percentile(timesForPercentiles, 0.05), // Pro
    p25: percentile(timesForPercentiles, 0.25), // Advanced
    p50: percentile(timesForPercentiles, 0.5), // Median
    p65: percentile(timesForPercentiles, 0.65), // Intermediate
    p90: percentile(timesForPercentiles, 0.9), // Beginner

    // Stock car statistics (for baseline)
    stockMedian: stockTimes.length > 0 ? percentile(stockTimes, 0.5) : null,
    stockP25: stockTimes.length > 0 ? percentile(stockTimes, 0.25) : null,
    stockP75: stockTimes.length > 0 ? percentile(stockTimes, 0.75) : null,

    // HP correlation
    hpCorrelation: computeHpCorrelation(hpTimePairs),

    // Raw data for advanced queries
    times: allTimes,
    filteredTimes,
    proTimes,
    amateurTimes,
    stockTimes,
    hpTimePairs,
  };

  _trackStatsCache.set(cacheKey, stats);
  _cacheTimestamp = now;
  return stats;
}

/**
 * Filter outliers using IQR method
 */
function filterOutliers(sortedTimes, multiplier = 1.5) {
  if (sortedTimes.length < 4) return sortedTimes;

  const q1 = percentile(sortedTimes, 0.25);
  const q3 = percentile(sortedTimes, 0.75);
  const iqr = q3 - q1;

  if (iqr < 1) return sortedTimes;

  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;

  return sortedTimes.filter((t) => t >= lowerBound && t <= upperBound);
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
  if (arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const squaredDiffs = arr.map((x) => Math.pow(x - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / arr.length);
}

// =============================================================================
// SIMILAR CAR LOOKUP
// =============================================================================

/**
 * Find similar cars with lap times at this track
 * Used for Tier 3 estimation when we don't have data for the exact car
 */
async function findSimilarCarsWithTimes(trackId, carSpecs) {
  const client = getSupabaseClient();
  if (!client || !carSpecs.hp) return [];

  const hpRange = [carSpecs.hp * 0.8, carSpecs.hp * 1.2]; // ±20% HP
  const weightRange = carSpecs.weight
    ? [carSpecs.weight * 0.85, carSpecs.weight * 1.15] // ±15% weight
    : [2000, 6000]; // Default range

  // Get lap times with car data
  const { data: lapData } = await client
    .from('car_track_lap_times')
    .select('lap_time_ms, is_stock, source_url, car_id')
    .eq('track_id', trackId)
    .not('lap_time_ms', 'is', null)
    .limit(200);

  if (!lapData || lapData.length === 0) return [];

  // Get car specs for these lap times
  const carIds = [...new Set(lapData.map((l) => l.car_id).filter(Boolean))];
  if (carIds.length === 0) return [];

  const { data: carsData } = await client
    .from('cars')
    .select('id, slug, name, hp, curb_weight')
    .in('id', carIds)
    .gte('hp', hpRange[0])
    .lte('hp', hpRange[1]);

  if (!carsData || carsData.length === 0) return [];

  // Filter by weight if available
  const similarCars = carsData.filter((car) => {
    if (!car.curb_weight) return true; // Include if no weight data
    return car.curb_weight >= weightRange[0] && car.curb_weight <= weightRange[1];
  });

  // Match lap times to similar cars
  const similarCarIds = new Set(similarCars.map((c) => c.id));
  const matchingLaps = lapData.filter((l) => similarCarIds.has(l.car_id));

  return matchingLaps.map((lap) => {
    const car = similarCars.find((c) => c.id === lap.car_id);
    return {
      lapTimeMs: lap.lap_time_ms,
      lapTimeSeconds: lap.lap_time_ms / 1000,
      isStock: lap.is_stock,
      isPro: isProfessionalLapTime(lap),
      car: car ? { name: car.name, hp: car.hp, weight: car.curb_weight } : null,
    };
  });
}

// =============================================================================
// MAIN ESTIMATION FUNCTIONS
// =============================================================================

/**
 * Determine which estimation tier to use based on available data
 */
function determineEstimationTier(stats, similarCarData = []) {
  if (!stats) {
    return { tier: 4, reason: 'no_track_data' };
  }

  // Tier 1: Statistical - need 10+ times with good distribution
  if (stats.count >= TIER_THRESHOLDS.STATISTICAL && stats.filteredCount >= 5) {
    return {
      tier: 1,
      reason: 'statistical',
      confidence: 0.9,
      label: 'Based on real lap time data',
    };
  }

  // Tier 2: Reference-Scaled - need pro reference time
  if (stats.hasProReference && stats.proReferenceTime) {
    return {
      tier: 2,
      reason: 'reference_scaled',
      confidence: 0.8,
      label: 'Based on professional reference time',
    };
  }

  // Tier 3: Similar Car Interpolation
  const proSimilarTimes = similarCarData.filter((d) => d.isPro);
  if (proSimilarTimes.length >= TIER_THRESHOLDS.SIMILAR_CAR) {
    return {
      tier: 3,
      reason: 'similar_car',
      confidence: 0.65,
      label: 'Estimated from similar vehicles',
    };
  }

  // Tier 4: Insufficient Data
  return {
    tier: 4,
    reason: 'insufficient_data',
    confidence: 0,
    label: 'Insufficient data for reliable estimate',
  };
}

/**
 * Estimate lap time for a car at a track
 * Uses tiered approach for maximum accuracy
 *
 * @param {Object} params - Estimation parameters
 * @param {string} params.trackSlug - Track identifier
 * @param {number} params.stockHp - Stock horsepower
 * @param {number} params.currentHp - Current horsepower (with mods)
 * @param {number} params.weight - Vehicle weight in lbs
 * @param {string} params.driverSkill - Driver skill level
 * @param {Object} params.mods - Modification summary
 * @returns {Object} Estimated lap times with tier and confidence info
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
  const skill = DRIVER_SKILLS[driverSkill] || DRIVER_SKILLS.intermediate;

  // Get track statistics
  const stats = await getTrackStats(trackSlug);

  // Get similar car data for Tier 3 fallback
  let similarCarData = [];
  if (stats) {
    // Get track ID for similar car lookup
    const client = getSupabaseClient();
    const { data: trackData } = await client
      .from('tracks')
      .select('id')
      .eq('slug', trackSlug)
      .single();

    if (trackData) {
      similarCarData = await findSimilarCarsWithTimes(trackData.id, { hp: stockHp, weight });
    }
  }

  // Determine estimation tier
  const tierInfo = determineEstimationTier(stats, similarCarData);

  // TIER 4: Insufficient Data
  if (tierInfo.tier === 4) {
    return {
      source: 'insufficient_data',
      tier: 4,
      tierLabel: 'Insufficient data for reliable estimate',
      confidence: 0,
      sampleSize: stats?.count || 0,
      stockLapTime: null,
      moddedLapTime: null,
      improvement: null,
      note: 'Not enough data for a reliable estimate. Log your times to help build the database!',
      dataAvailable: {
        totalTimes: stats?.count || 0,
        proTimes: stats?.proCount || 0,
        similarCarTimes: similarCarData.length,
      },
      formatted: {
        stock: '--:--.---',
        modded: '--:--.---',
        improvement: '0.00s',
      },
    };
  }

  // Calculate base time based on tier
  let stockTime;
  let estimationSource;

  if (tierInfo.tier === 1) {
    // TIER 1: Statistical - use percentile-based estimation
    switch (driverSkill) {
      case 'professional':
        stockTime = stats.p5;
        break;
      case 'advanced':
        stockTime = stats.p25;
        break;
      case 'intermediate':
        stockTime = stats.p65;
        break;
      case 'beginner':
        stockTime = stats.p90;
        break;
      default:
        stockTime = stats.p65;
    }
    estimationSource = 'statistical';
  } else if (tierInfo.tier === 2) {
    // TIER 2: Reference-Scaled - use pro reference time with skill penalty
    const proTime = stats.proReferenceTime;
    stockTime = proTime * (1 + skill.penaltyFromPro);
    estimationSource = 'reference_scaled';
  } else {
    // TIER 3: Similar Car Interpolation
    const proTimes = similarCarData
      .filter((d) => d.isPro && d.isStock)
      .map((d) => d.lapTimeSeconds)
      .sort((a, b) => a - b);

    // Use median of similar car pro times as reference
    const referenceTime =
      proTimes.length > 0 ? percentile(proTimes, 0.5) : similarCarData[0]?.lapTimeSeconds;

    stockTime = referenceTime * (1 + skill.penaltyFromPro);
    estimationSource = 'similar_car';
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
    source: estimationSource,
    tier: tierInfo.tier,
    tierLabel: tierInfo.label,
    confidence: tierInfo.confidence,
    sampleSize: stats?.count || 0,

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
    trackFastest: stats?.fastest,
    trackMedian: stats?.median,
    proReferenceTime: stats?.proReferenceTime,

    // Data quality info
    dataQuality: {
      totalTimes: stats?.count || 0,
      proTimes: stats?.proCount || 0,
      filteredTimes: stats?.filteredCount || 0,
      similarCarTimes: similarCarData.length,
    },

    formatted: {
      stock: formatLapTime(stockTime),
      modded: formatLapTime(moddedTime),
      improvement: `-${realizedImprovement.toFixed(2)}s`,
    },
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
 * Format seconds to lap time string (M:SS.mmm)
 */
function formatLapTime(seconds) {
  if (!seconds || isNaN(seconds)) return '--:--.---';
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${mins}:${secs}`;
}

/**
 * Get track baseline for legacy compatibility
 */
export async function getTrackBaseline(trackSlug, carSpecs = {}) {
  const stats = await getTrackStats(trackSlug);

  // Get similar car data if we have car specs
  let similarCarData = [];
  if (carSpecs.hp && stats) {
    const client = getSupabaseClient();
    const { data: trackData } = await client
      .from('tracks')
      .select('id')
      .eq('slug', trackSlug)
      .single();

    if (trackData) {
      similarCarData = await findSimilarCarsWithTimes(trackData.id, carSpecs);
    }
  }

  const tierInfo = determineEstimationTier(stats, similarCarData);

  if (tierInfo.tier === 4) {
    return {
      source: 'insufficient_data',
      tier: 4,
      sampleSize: 0,
      proTime: null,
      advancedTime: null,
      intermediateTime: null,
      beginnerTime: null,
      stockMedian: null,
      note: 'Insufficient lap time data for this track',
    };
  }

  if (tierInfo.tier === 1) {
    // Statistical baseline
    return {
      source: 'statistical',
      tier: 1,
      sampleSize: stats.count,
      proTime: stats.p5,
      advancedTime: stats.p25,
      intermediateTime: stats.p65,
      beginnerTime: stats.p90,
      stockMedian: stats.stockMedian || stats.median,
      stockRange:
        stats.stockP75 && stats.stockP25
          ? [stats.stockP25, stats.stockP75]
          : [stats.p25, stats.p75],
      fastest: stats.fastest,
      median: stats.median,
      variance: stats.stdDev,
      hpCorrelation: stats.hpCorrelation,
    };
  }

  // Tier 2 or 3: Reference-based
  const proTime =
    stats?.proReferenceTime ||
    similarCarData
      .filter((d) => d.isPro)
      .map((d) => d.lapTimeSeconds)
      .sort((a, b) => a - b)[0];

  if (!proTime) {
    return {
      source: 'insufficient_data',
      tier: 4,
      sampleSize: stats?.count || 0,
      note: 'No reliable reference time available',
    };
  }

  return {
    source: tierInfo.tier === 2 ? 'reference_scaled' : 'similar_car',
    tier: tierInfo.tier,
    sampleSize: stats?.count || similarCarData.length,
    proTime: proTime,
    advancedTime: proTime * (1 + DRIVER_SKILLS.advanced.penaltyFromPro),
    intermediateTime: proTime * (1 + DRIVER_SKILLS.intermediate.penaltyFromPro),
    beginnerTime: proTime * (1 + DRIVER_SKILLS.beginner.penaltyFromPro),
    stockMedian: stats?.stockMedian,
    fastest: stats?.fastest,
    median: stats?.median,
  };
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
    proCount: stats.proCount,
    stockCount: stats.stockCount,

    fastest: formatLapTime(stats.fastest),
    median: formatLapTime(stats.median),
    slowest: formatLapTime(stats.slowest),

    fastestSeconds: stats.fastest,
    medianSeconds: stats.median,

    // Pro reference
    hasProReference: stats.hasProReference,
    proReferenceTime: stats.proReferenceTime ? formatLapTime(stats.proReferenceTime) : null,

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

  const { data: trackData } = await client
    .from('tracks')
    .select('id')
    .eq('slug', trackSlug)
    .single();

  if (!trackData) return [];

  const similarCarData = await findSimilarCarsWithTimes(trackData.id, { hp, weight });

  return similarCarData
    .filter((d) => d.car)
    .slice(0, 10)
    .map((d) => ({
      carName: d.car.name,
      hp: d.car.hp,
      weight: d.car.weight,
      lapTime: formatLapTime(d.lapTimeSeconds),
      lapTimeSeconds: d.lapTimeSeconds,
      isStock: d.isStock,
      isProfessional: d.isPro,
    }));
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
  TIER_THRESHOLDS,

  // Utilities
  formatLapTime,
};

export default lapTimeService;
