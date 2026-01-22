/**
 * Tuning Profiles Library
 * 
 * Provides access to vehicle-specific tuning data from the car_tuning_profiles table.
 * Falls back to generic upgrade packages when no profile exists.
 */

import { supabase, supabaseServiceRole } from './supabase';

/**
 * Get tuning profile for a car
 * @param {string} carSlug - The car slug
 * @param {Object} options - Optional parameters
 * @param {string} options.carId - Car UUID (skips slug lookup if provided)
 * @param {string} options.variantId - Optional variant UUID
 * @param {string} options.tuningFocus - Optional focus (performance, off-road, towing)
 * @returns {Object|null} - Tuning profile or null if not found
 */
export async function getTuningProfile(carSlug, options = {}) {
  const { carId = null, variantId = null, tuningFocus = 'performance' } = options;
  const client = supabaseServiceRole || supabase;
  if (!client) return null;

  // Use provided carId or look up from slug
  let resolvedCarId = carId;
  if (!resolvedCarId && carSlug) {
    const { data: car } = await client
      .from('cars')
      .select('id')
      .eq('slug', carSlug)
      .single();
    
    if (!car) return null;
    resolvedCarId = car.id;
  }

  if (!resolvedCarId) return null;

  // Query for profile
  let query = client
    .from('car_tuning_profiles')
    .select('*')
    .eq('car_id', resolvedCarId)
    .eq('tuning_focus', tuningFocus);

  if (variantId) {
    query = query.eq('car_variant_id', variantId);
  }

  const { data: profiles } = await query.limit(1);

  return profiles?.[0] || null;
}

/**
 * Get tuning profile by car ID
 * @param {string} carId - The car UUID
 * @param {string} variantId - Optional variant UUID
 * @param {string} tuningFocus - Optional focus
 * @returns {Object|null} - Tuning profile or null
 */
export async function getTuningProfileByCarId(carId, variantId = null, tuningFocus = 'performance') {
  const client = supabaseServiceRole || supabase;
  if (!client) return null;

  let query = client
    .from('car_tuning_profiles')
    .select('*')
    .eq('car_id', carId)
    .eq('tuning_focus', tuningFocus);

  if (variantId) {
    query = query.eq('car_variant_id', variantId);
  }

  const { data: profiles } = await query.limit(1);

  return profiles?.[0] || null;
}

/**
 * Get all tuning profiles for a car (all variants and focuses)
 * @param {string} carId - The car UUID
 * @returns {Object[]} - Array of tuning profiles
 */
export async function getAllTuningProfiles(carId) {
  const client = supabaseServiceRole || supabase;
  if (!client) return [];

  const { data: profiles } = await client
    .from('car_tuning_profiles')
    .select(`
      *,
      car_variants:car_variant_id (
        id,
        display_name,
        engine
      )
    `)
    .eq('car_id', carId);

  return profiles || [];
}

/**
 * Check if a car has a tuning profile
 * @param {string} carId - The car UUID
 * @returns {boolean}
 */
export async function hasTuningProfile(carId) {
  const client = supabaseServiceRole || supabase;
  if (!client) return false;

  const { data, count } = await client
    .from('car_tuning_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('car_id', carId);

  return count > 0;
}

/**
 * Get stage progressions from profile with computed totals
 * @param {Object} profile - The tuning profile
 * @returns {Object[]} - Stage progressions with computed fields
 */
export function getStageProgressions(profile) {
  if (!profile?.stage_progressions) return [];

  return profile.stage_progressions.map((stage, index) => ({
    ...stage,
    // Compute average HP gain
    avgHpGain: stage.hpGainLow && stage.hpGainHigh 
      ? Math.round((stage.hpGainLow + stage.hpGainHigh) / 2) 
      : null,
    // Compute average cost
    avgCost: stage.costLow && stage.costHigh 
      ? Math.round((stage.costLow + stage.costHigh) / 2) 
      : null,
    // Compute total HP at this stage
    totalHp: profile.stock_whp && stage.hpGainHigh 
      ? profile.stock_whp + stage.hpGainHigh 
      : null,
    // Stage number for display
    stageNumber: index + 1
  }));
}

/**
 * Get tuning platforms formatted for display
 * @param {Object} profile - The tuning profile
 * @returns {Object[]} - Tuning platforms
 */
export function getTuningPlatforms(profile) {
  if (!profile?.tuning_platforms) return [];

  return profile.tuning_platforms.map(platform => ({
    ...platform,
    // Format price range for display
    priceRange: platform.priceLow && platform.priceHigh
      ? `$${platform.priceLow.toLocaleString()} - $${platform.priceHigh.toLocaleString()}`
      : platform.priceLow
        ? `$${platform.priceLow.toLocaleString()}+`
        : 'Contact for pricing'
  }));
}

/**
 * Get power limits formatted for display
 * @param {Object} profile - The tuning profile
 * @returns {Object[]} - Power limits as array
 */
export function getPowerLimits(profile) {
  if (!profile?.power_limits) return [];

  return Object.entries(profile.power_limits).map(([key, limit]) => ({
    component: formatComponentName(key),
    key,
    ...limit,
    // Format power value
    powerValue: limit.whp 
      ? `${limit.whp} WHP` 
      : limit.hp 
        ? `${limit.hp} HP`
        : limit.tq
          ? `${limit.tq} lb-ft`
          : 'N/A'
  }));
}

/**
 * Get brand recommendations as flat array for display
 * @param {Object} profile - The tuning profile
 * @returns {Object[]} - Brand recommendations by category
 */
export function getBrandRecommendations(profile) {
  if (!profile?.brand_recommendations) return [];

  return Object.entries(profile.brand_recommendations).map(([category, brands]) => ({
    category: formatComponentName(category),
    key: category,
    brands: Array.isArray(brands) ? brands : []
  }));
}

/**
 * Get YouTube insights summary
 * @param {Object} profile - The tuning profile
 * @returns {Object} - YouTube insights
 */
export function getYouTubeInsights(profile) {
  const insights = profile?.youtube_insights || {};
  
  return {
    videoCount: insights.videoCount || 0,
    hasData: (insights.videoCount || 0) > 0,
    sentiment: insights.avgAftermarketSentiment 
      ? Math.round(insights.avgAftermarketSentiment * 100) 
      : null,
    sentimentLabel: getSentimentLabel(insights.avgAftermarketSentiment),
    commonPros: insights.commonPros || [],
    commonCons: insights.commonCons || [],
    tunerMentions: insights.tunerMentions || [],
    brandMentions: insights.brandMentions || [],
    keyQuotes: insights.keyQuotes || []
  };
}

/**
 * Format component key to display name
 */
function formatComponentName(key) {
  const nameMap = {
    stockTurbo: 'Stock Turbo',
    stockFuelSystem: 'Stock Fuel System',
    stockTransmission: 'Stock Transmission',
    stockInternals: 'Stock Internals',
    is38Turbo: 'IS38 (R Turbo)',
    stockDSG: 'Stock DSG',
    stockEngine: 'Stock Engine',
    intakes: 'Intakes',
    exhausts: 'Exhausts',
    intercoolers: 'Intercoolers',
    superchargers: 'Superchargers',
    tuners: 'Tuners',
    downpipes: 'Downpipes',
    suspension: 'Suspension',
    brakes: 'Brakes',
    wheels: 'Wheels',
    lifts: 'Lift Kits',
    bumpers: 'Bumpers/Armor',
    winches: 'Winches',
    tires: 'Tires',
    armor: 'Armor/Skid Plates'
  };
  
  return nameMap[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
}

/**
 * Get sentiment label from score
 */
function getSentimentLabel(score) {
  if (score === null || score === undefined) return null;
  if (score >= 0.8) return 'Excellent';
  if (score >= 0.6) return 'Good';
  if (score >= 0.4) return 'Fair';
  return 'Limited';
}

/**
 * Create a summary object for display
 * @param {Object} profile - The tuning profile
 * @returns {Object} - Summary for UI
 */
export function getProfileSummary(profile) {
  if (!profile) return null;

  const stages = profile.stage_progressions || [];
  const maxStage = stages[stages.length - 1];
  
  return {
    engineFamily: profile.engine_family,
    tuningFocus: profile.tuning_focus,
    stockWhp: profile.stock_whp,
    stockWtq: profile.stock_wtq,
    stageCount: stages.length,
    maxHpGain: maxStage?.hpGainHigh || 0,
    maxTotalHp: profile.stock_whp && maxStage?.hpGainHigh 
      ? profile.stock_whp + maxStage.hpGainHigh 
      : null,
    platformCount: (profile.tuning_platforms || []).length,
    hasPowerLimits: Object.keys(profile.power_limits || {}).length > 0,
    hasBrandRecs: Object.keys(profile.brand_recommendations || {}).length > 0,
    youtubeVideoCount: profile.youtube_insights?.videoCount || 0,
    verified: profile.verified,
    pipelineVersion: profile.pipeline_version
  };
}

const tuningProfiles = {
  getTuningProfile,
  getTuningProfileByCarId,
  getAllTuningProfiles,
  hasTuningProfile,
  getStageProgressions,
  getTuningPlatforms,
  getPowerLimits,
  getBrandRecommendations,
  getYouTubeInsights,
  getProfileSummary
};

export default tuningProfiles;
