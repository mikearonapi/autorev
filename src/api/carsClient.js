/**
 * Cars API Client
 * 
 * Provides functions to fetch car data from Supabase.
 * Falls back to local data if Supabase is not configured.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { carData as localCarData, getCarBySlug as getLocalCarBySlug } from '../data/cars.js';

/**
 * Normalize car data from Supabase to match local data format
 * Supabase uses snake_case, local uses camelCase
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
    
    // Performance HUB Scores (1-10, nullable)
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
  };
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

