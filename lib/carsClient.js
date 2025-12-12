/**
 * Cars API Client
 * 
 * Provides functions to fetch car data from Supabase.
 * Falls back to local data if Supabase is not configured.
 */

import { supabase, isSupabaseConfigured } from './supabase.js';
import { carData as localCarData, getCarBySlug as getLocalCarBySlug } from '@/data/cars.js';

/**
 * Normalize car data from Supabase to match local data format
 * Supabase uses snake_case, local uses camelCase
 * If Supabase has null Performance HUB scores, merge with local data
 * @param {Object} car - Car object from Supabase
 * @returns {Object} - Normalized car object
 */
function normalizeCarFromSupabase(car) {
  if (!car) return null;
  
  // Find matching local car for fallback data
  const localCar = localCarData.find(c => c.slug === car.slug);
  
  // Normalize the Supabase data
  const normalized = {
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
    
    // Extended Specs (Performance HUB) - use Supabase if available, else local
    curbWeight: car.curb_weight ?? localCar?.curbWeight ?? null,
    zeroToSixty: car.zero_to_sixty ? parseFloat(car.zero_to_sixty) : localCar?.zeroToSixty ?? null,
    topSpeed: car.top_speed ?? localCar?.topSpeed ?? null,
    layout: car.layout ?? localCar?.layout ?? null,
    msrpNewLow: car.msrp_new_low ?? localCar?.msrpNewLow ?? null,
    msrpNewHigh: car.msrp_new_high ?? localCar?.msrpNewHigh ?? null,
    torque: car.torque ?? localCar?.torque ?? null,
    quarterMile: car.quarter_mile ? parseFloat(car.quarter_mile) : localCar?.quarterMile ?? null,
    braking60To0: car.braking_60_0 ?? localCar?.braking60To0 ?? null,
    lateralG: car.lateral_g ? parseFloat(car.lateral_g) : localCar?.lateralG ?? null,
    
    // Performance HUB Scores (1-10) - use Supabase if available, else local
    perfPowerAccel: car.perf_power_accel ?? localCar?.perfPowerAccel ?? null,
    perfGripCornering: car.perf_grip_cornering ?? localCar?.perfGripCornering ?? null,
    perfBraking: car.perf_braking ?? localCar?.perfBraking ?? null,
    perfTrackPace: car.perf_track_pace ?? localCar?.perfTrackPace ?? null,
    perfDrivability: car.perf_drivability ?? localCar?.perfDrivability ?? null,
    perfReliabilityHeat: car.perf_reliability_heat ?? localCar?.perfReliabilityHeat ?? null,
    perfSoundEmotion: car.perf_sound_emotion ?? localCar?.perfSoundEmotion ?? null,
    
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
    
    // Media - use Supabase if available, else local (Blob URLs are in local data)
    imageHeroUrl: car.image_hero_url ?? localCar?.imageHeroUrl ?? null,
    imageGallery: car.image_gallery || localCar?.imageGallery || [],
    videoUrl: car.video_url ?? localCar?.videoUrl ?? null,
    
    // CTA
    ctaCopy: car.cta_copy,
    
    // Brand & Platform Info (from local)
    brand: car.brand ?? localCar?.brand ?? null,
    country: car.country ?? localCar?.country ?? null,
    platformCostTier: car.platform_cost_tier ?? localCar?.platformCostTier ?? null,
    
    // Ownership & Usability (from local)
    manualAvailable: car.manual_available ?? localCar?.manualAvailable ?? null,
    seats: car.seats ?? localCar?.seats ?? null,
    dailyUsabilityTag: car.daily_usability_tag ?? localCar?.dailyUsabilityTag ?? null,
    maintenanceCostIndex: car.maintenance_cost_index ?? localCar?.maintenanceCostIndex ?? null,
    insuranceCostIndex: car.insurance_cost_index ?? localCar?.insuranceCostIndex ?? null,
    fuelEconomyCombined: car.fuel_economy_combined ?? localCar?.fuelEconomyCombined ?? null,
    commonIssues: car.common_issues ?? localCar?.commonIssues ?? [],
    yearsToAvoid: car.years_to_avoid ?? localCar?.yearsToAvoid ?? null,
    recommendedYearsNote: car.recommended_years_note ?? localCar?.recommendedYearsNote ?? null,
    ownershipCostNotes: car.ownership_cost_notes ?? localCar?.ownershipCostNotes ?? null,
    
    // =========================================================================
    // CURATED EXPERIENCE FIELDS (primarily from local data until Supabase populated)
    // =========================================================================
    
    // Identity & Story
    essence: car.essence ?? localCar?.essence ?? null,
    heritage: car.heritage ?? localCar?.heritage ?? null,
    designPhilosophy: car.design_philosophy ?? localCar?.designPhilosophy ?? null,
    motorsportHistory: car.motorsport_history ?? localCar?.motorsportHistory ?? null,
    generationCode: car.generation_code ?? localCar?.generationCode ?? null,
    predecessors: car.predecessors ?? localCar?.predecessors ?? [],
    successors: car.successors ?? localCar?.successors ?? [],
    
    // Driving Experience
    engineCharacter: car.engine_character ?? localCar?.engineCharacter ?? null,
    transmissionFeel: car.transmission_feel ?? localCar?.transmissionFeel ?? null,
    chassisDynamics: car.chassis_dynamics ?? localCar?.chassisDynamics ?? null,
    steeringFeel: car.steering_feel ?? localCar?.steeringFeel ?? null,
    brakeConfidence: car.brake_confidence ?? localCar?.brakeConfidence ?? null,
    soundSignature: car.sound_signature ?? localCar?.soundSignature ?? null,
    comfortTrackBalance: car.comfort_track_balance ?? localCar?.comfortTrackBalance ?? null,
    comfortNotes: car.comfort_notes ?? localCar?.comfortNotes ?? null,
    
    // Enhanced Strengths & Weaknesses
    definingStrengths: car.defining_strengths ?? localCar?.definingStrengths ?? [],
    honestWeaknesses: car.honest_weaknesses ?? localCar?.honestWeaknesses ?? [],
    idealOwner: car.ideal_owner ?? localCar?.idealOwner ?? null,
    notIdealFor: car.not_ideal_for ?? localCar?.notIdealFor ?? null,
    
    // Buyer's Guide
    buyersSummary: car.buyers_summary ?? localCar?.buyersSummary ?? null,
    bestYearsDetailed: car.best_years_detailed ?? localCar?.bestYearsDetailed ?? [],
    yearsToAvoidDetailed: car.years_to_avoid_detailed ?? localCar?.yearsToAvoidDetailed ?? null,
    mustHaveOptions: car.must_have_options ?? localCar?.mustHaveOptions ?? [],
    niceToHaveOptions: car.nice_to_have_options ?? localCar?.niceToHaveOptions ?? [],
    preInspectionChecklist: car.pre_inspection_checklist ?? localCar?.preInspectionChecklist ?? [],
    ppiRecommendations: car.ppi_recommendations ?? localCar?.ppiRecommendations ?? null,
    marketPosition: car.market_position ?? localCar?.marketPosition ?? null,
    marketCommentary: car.market_commentary ?? localCar?.marketCommentary ?? null,
    priceGuide: car.price_guide ?? localCar?.priceGuide ?? null,
    
    // Ownership Reality
    annualOwnershipCost: car.annual_ownership_cost ?? localCar?.annualOwnershipCost ?? null,
    majorServiceCosts: car.major_service_costs ?? localCar?.majorServiceCosts ?? null,
    commonIssuesDetailed: car.common_issues_detailed ?? localCar?.commonIssuesDetailed ?? [],
    partsAvailability: car.parts_availability ?? localCar?.partsAvailability ?? null,
    partsNotes: car.parts_notes ?? localCar?.partsNotes ?? null,
    dealerVsIndependent: car.dealer_vs_independent ?? localCar?.dealerVsIndependent ?? null,
    dealerNotes: car.dealer_notes ?? localCar?.dealerNotes ?? null,
    diyFriendliness: car.diy_friendliness ?? localCar?.diyFriendliness ?? null,
    diyNotes: car.diy_notes ?? localCar?.diyNotes ?? null,
    warrantyInfo: car.warranty_info ?? localCar?.warrantyInfo ?? null,
    insuranceNotes: car.insurance_notes ?? localCar?.insuranceNotes ?? null,
    
    // Track & Performance
    trackReadiness: car.track_readiness ?? localCar?.trackReadiness ?? null,
    trackReadinessNotes: car.track_readiness_notes ?? localCar?.trackReadinessNotes ?? null,
    coolingCapacity: car.cooling_capacity ?? localCar?.coolingCapacity ?? null,
    brakeFadeResistance: car.brake_fade_resistance ?? localCar?.brakeFadeResistance ?? null,
    recommendedTrackPrep: car.recommended_track_prep ?? localCar?.recommendedTrackPrep ?? [],
    popularTrackMods: car.popular_track_mods ?? localCar?.popularTrackMods ?? [],
    laptimeBenchmarks: car.laptime_benchmarks ?? localCar?.laptimeBenchmarks ?? [],
    
    // Alternatives
    directCompetitors: car.direct_competitors ?? localCar?.directCompetitors ?? [],
    ifYouWantMore: car.if_you_want_more ?? localCar?.ifYouWantMore ?? [],
    ifYouWantLess: car.if_you_want_less ?? localCar?.ifYouWantLess ?? [],
    similarDrivingExperience: car.similar_driving_experience ?? localCar?.similarDrivingExperience ?? [],
    
    // Community & Culture
    communityStrength: car.community_strength ?? localCar?.communityStrength ?? null,
    communityNotes: car.community_notes ?? localCar?.communityNotes ?? null,
    keyResources: car.key_resources ?? localCar?.keyResources ?? [],
    facebookGroups: car.facebook_groups ?? localCar?.facebookGroups ?? [],
    annualEvents: car.annual_events ?? localCar?.annualEvents ?? [],
    aftermarketSceneNotes: car.aftermarket_scene_notes ?? localCar?.aftermarketSceneNotes ?? null,
    resaleReputation: car.resale_reputation ?? localCar?.resaleReputation ?? null,
    
    // Media & Reviews
    notableReviews: car.notable_reviews ?? localCar?.notableReviews ?? [],
    mustWatchVideos: car.must_watch_videos ?? localCar?.mustWatchVideos ?? [],
    expertQuotes: car.expert_quotes ?? localCar?.expertQuotes ?? [],
    
    // Expert Review Data (from YouTube enrichment)
    expertReviewCount: car.expert_review_count ?? 0,
    expertConsensusSummary: car.expert_consensus_summary ?? null,
    externalConsensus: car.external_consensus ?? null,
    
    // Car-Specific Upgrade Recommendations (from database)
    // Structure: { primaryFocus, focusReason, coreUpgrades, enhancementUpgrades, platformStrengths, watchOuts }
    upgradeRecommendations: car.upgrade_recommendations ?? null,
  };
  
  return normalized;
}

/**
 * Fetch all cars from Supabase or local data
 * @returns {Promise<Object[]>} - Array of car objects
 */
export async function fetchCars() {
  // If Supabase is not configured, use local data
  if (!isSupabaseConfigured || !supabase) {
    console.log('[carsClient] Using local car data fallback');
    return localCarData;
  }

  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .order('price_avg', { ascending: true });

    if (error) {
      console.error('[carsClient] Error fetching cars from Supabase:', error);
      console.log('[carsClient] Falling back to local data');
      return localCarData;
    }

    if (!data || data.length === 0) {
      console.log('[carsClient] No cars found in Supabase, using local data');
      return localCarData;
    }

    // Normalize all cars from Supabase format to local format
    return data.map(normalizeCarFromSupabase);
  } catch (err) {
    console.error('[carsClient] Unexpected error fetching cars:', err);
    return localCarData;
  }
}

/**
 * Fetch a single car by its slug
 * @param {string} slug - The car's URL-friendly slug
 * @returns {Promise<Object|null>} - Car object or null if not found
 */
export async function fetchCarBySlug(slug) {
  // If Supabase is not configured, use local data
  if (!isSupabaseConfigured || !supabase) {
    return getLocalCarBySlug(slug) || null;
  }

  try {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('[carsClient] Error fetching car by slug:', error);
      // Try local fallback
      return getLocalCarBySlug(slug) || null;
    }

    return normalizeCarFromSupabase(data);
  } catch (err) {
    console.error('[carsClient] Unexpected error fetching car by slug:', err);
    return getLocalCarBySlug(slug) || null;
  }
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
};

