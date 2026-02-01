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
// Updated for Teoalida schema (Jan 2026)

/**
 * Columns needed for list views
 * Key changes from legacy schema:
 * - year (integer) instead of years (text range)
 * - make instead of brand
 * - engine_type instead of engine
 * - transmission instead of trans
 * - drive_type instead of drivetrain
 * - msrp instead of price_range/price_avg
 */
const LIST_VIEW_COLUMNS = `
  id,
  slug,
  name,
  model,
  trim,
  year,
  tier,
  category,
  make,
  country_of_origin,
  engine_type,
  engine_size,
  cylinders,
  hp,
  hp_rpm,
  torque,
  torque_rpm,
  transmission,
  drive_type,
  msrp,
  curb_weight,
  body_type,
  fuel_type,
  mpg_city,
  mpg_highway,
  mpg_combined,
  image_url,
  is_selectable,
  generation_id
`.replace(/\s+/g, '');

/**
 * Normalize car data from Supabase to match expected format
 * Updated for Teoalida schema (Jan 2026)
 * (Duplicated from carsClient to avoid circular imports)
 */
function normalizeCarFromSupabase(car) {
  if (!car) return null;

  return {
    // Core identifiers
    id: car.id,
    name: car.name,
    slug: car.slug,
    teoalidaId: car.teoalida_id,

    // YMMT (Year/Make/Model/Trim) - Teoalida schema
    year: car.year,
    make: car.make,
    model: car.model,
    trim: car.trim,
    trimDescription: car.trim_description,

    // Classification (derived from body_type and msrp)
    tier: car.tier,
    category: car.category,
    bodyType: car.body_type,
    carClassification: car.car_classification,
    isSelectable: car.is_selectable ?? true,
    generationId: car.generation_id,

    // Engine specs (Teoalida provides detailed data)
    hp: car.hp,
    hpRpm: car.hp_rpm,
    torque: car.torque,
    torqueRpm: car.torque_rpm,
    engineSize: car.engine_size ? parseFloat(car.engine_size) : null,
    cylinders: car.cylinders,
    engineType: car.engine_type,
    fuelType: car.fuel_type,

    // Transmission & drivetrain
    transmission: car.transmission,
    driveType: car.drive_type,

    // Dimensions & weight
    curbWeight: car.curb_weight,
    lengthIn: car.length_in ? parseFloat(car.length_in) : null,
    widthIn: car.width_in ? parseFloat(car.width_in) : null,
    heightIn: car.height_in ? parseFloat(car.height_in) : null,
    wheelbaseIn: car.wheelbase_in ? parseFloat(car.wheelbase_in) : null,
    groundClearanceIn: car.ground_clearance_in ? parseFloat(car.ground_clearance_in) : null,

    // Pricing
    msrp: car.msrp,

    // Fuel economy
    mpgCity: car.mpg_city,
    mpgHighway: car.mpg_highway,
    mpgCombined: car.mpg_combined,
    fuelTankCapacity: car.fuel_tank_capacity ? parseFloat(car.fuel_tank_capacity) : null,

    // Towing & payload (for trucks)
    maxTowing: car.max_towing,
    maxPayload: car.max_payload,

    // Origin & platform
    countryOfOrigin: car.country_of_origin,
    platformCode: car.platform_code,

    // Media
    imageUrl: car.image_url,
    sourceUrl: car.source_url,
  };
}

/**
 * Internal function to fetch car by slug from database
 */
async function _fetchCarBySlugInternal(slug) {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('[carsCache] Supabase is not configured');
  }

  const { data, error } = await supabase.from('cars').select('*').eq('slug', slug).single();

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
 * Uses optimized column list - Teoalida schema (Jan 2026)
 */
async function _fetchAllCarsInternal() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('[carsCache] Supabase is not configured');
  }

  const { data, error } = await supabase
    .from('cars')
    .select(LIST_VIEW_COLUMNS)
    .eq('is_selectable', true)
    .order('msrp', { ascending: true, nullsFirst: false });

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
    return allCars.filter((car) => car.tier === tier);
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

    const { data, error } = await supabase.from('cars').select('slug');

    if (error) {
      console.error('[carsCache] Error fetching car slugs:', error);
      return [];
    }

    return (data || []).map((c) => c.slug);
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
