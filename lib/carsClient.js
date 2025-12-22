/**
 * Cars API Client
 * 
 * Provides functions to fetch car data from Supabase.
 * Supabase is the SINGLE SOURCE OF TRUTH - no local fallbacks.
 * 
 * Features:
 * - Request timeout to prevent infinite loading
 * - In-memory cache with TTL for fast repeated access
 * - Proper error handling (no silent fallbacks)
 * 
 * For server-side caching with Next.js unstable_cache, see lib/carsCache.js
 * 
 * IMPORTANT: Configuration (tierConfig, categories) comes from configClient.js
 * Use: import { getTierConfig, getCategories } from '@/lib/configClient.js'
 */

import { supabase, isSupabaseConfigured } from './supabase.js';
// Re-export config functions from configClient for backwards compatibility
export { getTierConfig, getCategories } from './configClient.js';

// Configuration
const REQUEST_TIMEOUT_MS = 8000; // 8 second timeout
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache (shorter for faster updates)

// In-memory cache for car data
const cache = {
  allCars: { data: null, timestamp: 0 },
  bySlug: new Map(), // slug -> { data, timestamp }
};

/**
 * Check if cached data is still valid
 * @param {number} timestamp - Cache timestamp
 * @returns {boolean}
 */
function isCacheValid(timestamp) {
  return Date.now() - timestamp < CACHE_TTL_MS;
}

/**
 * Create a promise that rejects after a timeout
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise}
 */
function createTimeoutPromise(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout')), ms);
  });
}

/**
 * Wrap a Supabase query with timeout
 * @param {Promise} queryPromise - Supabase query promise
 * @param {number} timeoutMs - Timeout in ms
 * @returns {Promise}
 */
async function withTimeout(queryPromise, timeoutMs = REQUEST_TIMEOUT_MS) {
  return Promise.race([
    queryPromise,
    createTimeoutPromise(timeoutMs),
  ]);
}

/**
 * Normalize car data from Supabase to match expected format
 * Supabase uses snake_case, app uses camelCase
 * @param {Object} car - Car object from Supabase
 * @returns {Object} - Normalized car object
 */
function normalizeCarFromSupabase(car) {
  if (!car) return null;
  
  return {
    id: car.id,
    name: car.name,
    slug: car.slug,
    years: car.years,
    tier: car.tier,
    category: car.category,
    
    // Advisory Scores (1-10)
    sound: car.score_sound,
    interior: car.score_interior,
    track: car.score_track,
    reliability: car.score_reliability,
    value: car.score_value,
    driverFun: car.score_driver_fun,
    aftermarket: car.score_aftermarket,
    
    // Core Specs
    engine: car.engine,
    hp: car.hp,
    trans: car.trans,
    priceRange: car.price_range,
    priceAvg: car.price_avg,
    drivetrain: car.drivetrain,
    
    // Extended Specs (Performance HUB)
    curbWeight: car.curb_weight,
    zeroToSixty: car.zero_to_sixty ? parseFloat(car.zero_to_sixty) : null,
    topSpeed: car.top_speed,
    layout: car.layout,
    msrpNewLow: car.msrp_new_low,
    msrpNewHigh: car.msrp_new_high,
    torque: car.torque,
    quarterMile: car.quarter_mile ? parseFloat(car.quarter_mile) : null,
    braking60To0: car.braking_60_0,
    lateralG: car.lateral_g ? parseFloat(car.lateral_g) : null,
    
    // Performance HUB Scores (1-10)
    perfPowerAccel: car.perf_power_accel,
    perfGripCornering: car.perf_grip_cornering,
    perfBraking: car.perf_braking,
    perfTrackPace: car.perf_track_pace,
    perfDrivability: car.perf_drivability,
    perfReliabilityHeat: car.perf_reliability_heat,
    perfSoundEmotion: car.perf_sound_emotion,
    
    // Content
    notes: car.notes,
    highlight: car.highlight,
    tagline: car.tagline,
    heroBlurb: car.hero_blurb,
    ownerNotesLong: car.owner_notes_long,
    pros: car.pros || [],
    cons: car.cons || [],
    bestFor: car.best_for || [],
    recommendationHighlight: car.recommendation_highlight,
    
    // Media
    imageHeroUrl: car.image_hero_url,
    imageGallery: car.image_gallery || [],
    videoUrl: car.video_url,
    
    // CTA
    ctaCopy: car.cta_copy,
    
    // Brand & Platform Info
    brand: car.brand,
    country: car.country,
    platformCostTier: car.platform_cost_tier,
    
    // Ownership & Usability
    manualAvailable: car.manual_available,
    seats: car.seats,
    dailyUsabilityTag: car.daily_usability_tag,
    maintenanceCostIndex: car.maintenance_cost_index,
    insuranceCostIndex: car.insurance_cost_index,
    fuelEconomyCombined: car.fuel_economy_combined,
    commonIssues: car.common_issues || [],
    yearsToAvoid: car.years_to_avoid,
    recommendedYearsNote: car.recommended_years_note,
    ownershipCostNotes: car.ownership_cost_notes,
    
    // Identity & Story
    essence: car.essence,
    heritage: car.heritage,
    designPhilosophy: car.design_philosophy,
    motorsportHistory: car.motorsport_history,
    generationCode: car.generation_code,
    predecessors: car.predecessors || [],
    successors: car.successors || [],
    
    // Driving Experience
    engineCharacter: car.engine_character,
    transmissionFeel: car.transmission_feel,
    chassisDynamics: car.chassis_dynamics,
    steeringFeel: car.steering_feel,
    brakeConfidence: car.brake_confidence,
    soundSignature: car.sound_signature,
    comfortTrackBalance: car.comfort_track_balance,
    comfortNotes: car.comfort_notes,
    
    // Enhanced Strengths & Weaknesses
    definingStrengths: car.defining_strengths || [],
    honestWeaknesses: car.honest_weaknesses || [],
    idealOwner: car.ideal_owner,
    notIdealFor: car.not_ideal_for,
    
    // Buyer's Guide
    buyersSummary: car.buyers_summary,
    bestYearsDetailed: car.best_years_detailed || [],
    yearsToAvoidDetailed: car.years_to_avoid_detailed || [],
    mustHaveOptions: car.must_have_options || [],
    niceToHaveOptions: car.nice_to_have_options || [],
    preInspectionChecklist: car.pre_inspection_checklist || [],
    ppiRecommendations: car.ppi_recommendations,
    marketPosition: car.market_position,
    marketCommentary: car.market_commentary,
    priceGuide: car.price_guide,
    
    // Ownership Reality
    annualOwnershipCost: car.annual_ownership_cost,
    majorServiceCosts: car.major_service_costs,
    commonIssuesDetailed: car.common_issues_detailed || [],
    partsAvailability: car.parts_availability,
    partsNotes: car.parts_notes,
    dealerVsIndependent: car.dealer_vs_independent,
    dealerNotes: car.dealer_notes,
    diyFriendliness: car.diy_friendliness,
    diyNotes: car.diy_notes,
    warrantyInfo: car.warranty_info,
    insuranceNotes: car.insurance_notes,
    
    // Track & Performance
    trackReadiness: car.track_readiness,
    trackReadinessNotes: car.track_readiness_notes,
    coolingCapacity: car.cooling_capacity,
    brakeFadeResistance: car.brake_fade_resistance,
    recommendedTrackPrep: car.recommended_track_prep || [],
    popularTrackMods: car.popular_track_mods || [],
    laptimeBenchmarks: car.laptime_benchmarks || [],
    
    // Alternatives
    directCompetitors: car.direct_competitors || [],
    ifYouWantMore: car.if_you_want_more || [],
    ifYouWantLess: car.if_you_want_less || [],
    similarDrivingExperience: car.similar_driving_experience || [],
    
    // Community & Culture
    communityStrength: car.community_strength,
    communityNotes: car.community_notes,
    keyResources: car.key_resources || [],
    facebookGroups: car.facebook_groups || [],
    annualEvents: car.annual_events || [],
    aftermarketSceneNotes: car.aftermarket_scene_notes,
    resaleReputation: car.resale_reputation,
    
    // Media & Reviews
    notableReviews: car.notable_reviews || [],
    mustWatchVideos: car.must_watch_videos || [],
    expertQuotes: car.expert_quotes || [],
    
    // Expert Review Data (from YouTube enrichment)
    expertReviewCount: car.expert_review_count ?? 0,
    expertConsensusSummary: car.expert_consensus_summary,
    externalConsensus: car.external_consensus,
    
    // Car-Specific Upgrade Recommendations
    upgradeRecommendations: car.upgrade_recommendations,
  };
}

/**
 * Fetch all cars from Supabase
 * Uses in-memory cache for fast repeated access
 * @returns {Promise<Object[]>} - Array of car objects
 * @throws {Error} - If Supabase is not configured or query fails
 */
export async function fetchCars() {
  // Check cache first
  if (cache.allCars.data && isCacheValid(cache.allCars.timestamp)) {
    return cache.allCars.data;
  }

  // Supabase must be configured - no fallbacks
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('[carsClient] Supabase is not configured. Check environment variables.');
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('cars')
        .select('*')
        .order('price_avg', { ascending: true })
    );

    if (error) {
      console.error('[carsClient] Error fetching cars from Supabase:', error);
      // Return stale cache if available
      if (cache.allCars.data) {
        console.warn('[carsClient] Returning stale cached data');
        return cache.allCars.data;
      }
      throw new Error(`Failed to fetch cars: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.warn('[carsClient] No cars found in Supabase database');
      return [];
    }

    // Normalize all cars from Supabase format
    const normalizedCars = data.map(normalizeCarFromSupabase);
    
    // Update cache
    cache.allCars = { data: normalizedCars, timestamp: Date.now() };
    
    return normalizedCars;
  } catch (err) {
    console.error('[carsClient] Unexpected error fetching cars:', err);
    // Return stale cache if available
    if (cache.allCars.data) {
      console.warn('[carsClient] Returning stale cached data');
      return cache.allCars.data;
    }
    throw err;
  }
}

/**
 * Fetch a single car by its slug
 * Uses in-memory cache with timeout
 * @param {string} slug - The car's URL-friendly slug
 * @returns {Promise<Object|null>} - Car object or null if not found
 * @throws {Error} - If Supabase is not configured
 */
export async function fetchCarBySlug(slug) {
  if (!slug) return null;
  
  // Check cache first
  const cachedEntry = cache.bySlug.get(slug);
  if (cachedEntry && isCacheValid(cachedEntry.timestamp)) {
    return cachedEntry.data;
  }

  // Supabase must be configured - no fallbacks
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('[carsClient] Supabase is not configured. Check environment variables.');
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('cars')
        .select('*')
        .eq('slug', slug)
        .single()
    );

    if (error) {
      // PGRST116 means no rows found - this is not an error, just return null
      if (error.code === 'PGRST116') {
        cache.bySlug.set(slug, { data: null, timestamp: Date.now() });
        return null;
      }
      console.error('[carsClient] Error fetching car by slug:', error);
      // Return stale cache if available
      if (cachedEntry?.data) {
        console.warn('[carsClient] Returning stale cached data for', slug);
        return cachedEntry.data;
      }
      throw new Error(`Failed to fetch car: ${error.message}`);
    }

    const normalizedCar = normalizeCarFromSupabase(data);
    
    // Update cache
    cache.bySlug.set(slug, { data: normalizedCar, timestamp: Date.now() });
    
    return normalizedCar;
  } catch (err) {
    // Handle timeout or network errors
    const isTimeout = err.message === 'Request timeout';
    console.error(`[carsClient] ${isTimeout ? 'Timeout' : 'Error'} fetching car by slug:`, err.message);
    
    // Return stale cache if available
    if (cachedEntry?.data) {
      console.warn('[carsClient] Returning stale cached data for', slug);
      return cachedEntry.data;
    }
    
    throw err;
  }
}

/**
 * Clear the cars cache (useful after mutations)
 */
export function clearCarsCache() {
  cache.allCars = { data: null, timestamp: 0 };
  cache.bySlug.clear();
}

/**
 * Fetch cars by tier
 * @param {string} tier - The tier to filter by (premium, upper-mid, mid, budget)
 * @returns {Promise<Object[]>} - Array of car objects
 */
export async function fetchCarsByTier(tier) {
  const allCars = await fetchCars();
  return allCars.filter(car => car.tier === tier);
}

/**
 * Fetch cars by category (chassis layout)
 * @param {string} category - The category to filter by (Mid-Engine, Front-Engine, Rear-Engine)
 * @returns {Promise<Object[]>} - Array of car objects
 */
export async function fetchCarsByCategory(category) {
  const allCars = await fetchCars();
  return allCars.filter(car => car.category === category);
}

/**
 * Search cars by name
 * @param {string} query - Search query
 * @returns {Promise<Object[]>} - Array of matching car objects
 */
export async function searchCars(query) {
  const allCars = await fetchCars();
  const lowerQuery = query.toLowerCase();
  return allCars.filter(car => 
    car.name.toLowerCase().includes(lowerQuery) ||
    (car.engine && car.engine.toLowerCase().includes(lowerQuery)) ||
    (car.notes && car.notes.toLowerCase().includes(lowerQuery))
  );
}

export default {
  fetchCars,
  fetchCarBySlug,
  fetchCarsByTier,
  fetchCarsByCategory,
  searchCars,
  clearCarsCache,
};
