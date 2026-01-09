/**
 * Server-Side Cars Caching
 * 
 * Uses Next.js unstable_cache for server-side request deduplication
 * and caching. This module should only be imported in Server Components
 * or API routes.
 * 
 * Benefits:
 * - Deduplicates identical requests within a single render
 * - Caches data across requests with configurable TTL
 * - Supports cache tags for fine-grained invalidation
 * 
 * @module lib/carsCache
 */

import { unstable_cache } from 'next/cache';
import { supabase, isSupabaseConfigured } from './supabase.js';

// Cache configuration
const CACHE_REVALIDATE_SECONDS = 300; // 5 minutes

// =============================================================================
// OPTIMIZED COLUMN SELECTIONS
// =============================================================================
// Using explicit column lists instead of select('*') reduces payload by ~80%

/**
 * Columns needed for list views (reduces ~1.7MB to ~300KB)
 */
const LIST_VIEW_COLUMNS = `
  id,
  slug,
  name,
  years,
  tier,
  category,
  brand,
  country,
  engine,
  hp,
  torque,
  trans,
  drivetrain,
  price_range,
  price_avg,
  curb_weight,
  zero_to_sixty,
  top_speed,
  quarter_mile,
  msrp_new_low,
  msrp_new_high,
  score_sound,
  score_interior,
  score_track,
  score_reliability,
  score_value,
  score_driver_fun,
  score_aftermarket,
  notes,
  highlight,
  tagline,
  hero_blurb,
  image_hero_url,
  manual_available,
  seats,
  daily_usability_tag,
  common_issues,
  defining_strengths,
  honest_weaknesses
`.replace(/\s+/g, '');

/**
 * Normalize car data from Supabase to match expected format
 * (Duplicated from carsClient to avoid circular imports)
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
 * Internal function to fetch car by slug from database
 */
async function _fetchCarBySlugInternal(slug) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('[carsCache] Supabase is not configured');
  }

  const { data, error } = await supabase
    .from('cars')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    // PGRST116 means no rows found
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch car: ${error.message}`);
  }

  return normalizeCarFromSupabase(data);
}

/**
 * Internal function to fetch all cars from database
 * Uses optimized column list to reduce payload from ~1.7MB to ~300KB
 */
async function _fetchAllCarsInternal() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('[carsCache] Supabase is not configured');
  }

  const { data, error } = await supabase
    .from('cars')
    .select(LIST_VIEW_COLUMNS)
    .order('price_avg', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch cars: ${error.message}`);
  }

  return (data || []).map(normalizeCarFromSupabase);
}

/**
 * Cached version of fetchCarBySlug for Server Components
 * 
 * Uses Next.js unstable_cache for request deduplication and caching.
 * Automatically revalidates every 5 minutes.
 * 
 * @param {string} slug - The car's URL-friendly slug
 * @returns {Promise<Object|null>} - Car object or null if not found
 * 
 * @example
 * // In a Server Component
 * import { getCachedCarBySlug } from '@/lib/carsCache';
 * const car = await getCachedCarBySlug('porsche-911-gt3');
 */
export const getCachedCarBySlug = unstable_cache(
  async (slug) => {
    return _fetchCarBySlugInternal(slug);
  },
  ['car-by-slug'],
  {
    revalidate: CACHE_REVALIDATE_SECONDS,
    tags: ['cars'],
  }
);

/**
 * Cached version of fetchCars for Server Components
 * 
 * Uses Next.js unstable_cache for request deduplication and caching.
 * Automatically revalidates every 5 minutes.
 * 
 * @returns {Promise<Object[]>} - Array of car objects
 * 
 * @example
 * // In a Server Component
 * import { getCachedCars } from '@/lib/carsCache';
 * const cars = await getCachedCars();
 */
export const getCachedCars = unstable_cache(
  async () => {
    return _fetchAllCarsInternal();
  },
  ['all-cars'],
  {
    revalidate: CACHE_REVALIDATE_SECONDS,
    tags: ['cars'],
  }
);

/**
 * Cached version of fetchCarsByTier for Server Components
 * 
 * @param {string} tier - The tier to filter by
 * @returns {Promise<Object[]>} - Array of car objects
 */
export const getCachedCarsByTier = unstable_cache(
  async (tier) => {
    const allCars = await _fetchAllCarsInternal();
    return allCars.filter(car => car.tier === tier);
  },
  ['cars-by-tier'],
  {
    revalidate: CACHE_REVALIDATE_SECONDS,
    tags: ['cars'],
  }
);

/**
 * Get all car slugs (for static generation)
 * Cached to prevent redundant database calls during build
 */
export const getCachedCarSlugs = unstable_cache(
  async () => {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('cars')
      .select('slug');

    if (error) {
      console.error('[carsCache] Error fetching car slugs:', error);
      return [];
    }

    return (data || []).map(c => c.slug);
  },
  ['car-slugs'],
  {
    revalidate: 3600, // 1 hour for slugs (rarely change)
    tags: ['cars'],
  }
);

const carsCache = {
  getCachedCarBySlug,
  getCachedCars,
  getCachedCarsByTier,
  getCachedCarSlugs,
};

export default carsCache;

