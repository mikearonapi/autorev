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

import { sessionStore } from './storage.js';
import { supabase, isSupabaseConfigured } from './supabase.js';
// Re-export config functions from configClient for backwards compatibility
export { getTierConfig, getCategories } from './configClient.js';

// =============================================================================
// OPTIMIZED COLUMN SELECTIONS
// =============================================================================
// Using explicit column lists instead of select('*') reduces payload by ~80%
// Full table has 100+ columns including large text fields and embeddings

/**
 * Columns needed for list views (browse-cars, car-selector, homepage cards)
 * Updated for Teoalida schema (Jan 2026)
 *
 * Key changes from legacy schema:
 * - year (integer) instead of years (text range)
 * - make instead of brand
 * - engine_type instead of engine
 * - transmission instead of trans
 * - drive_type instead of drivetrain
 * - msrp instead of price_range/price_avg
 * - country_of_origin instead of country
 * - image_url instead of image_hero_url
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
 * All columns for detail views (individual car pages)
 * This is the full data needed for car detail pages
 */
const _DETAIL_VIEW_COLUMNS = '*';

// Configuration
const REQUEST_TIMEOUT_MS = 6000; // 6 second timeout per attempt (reduced from 8s)
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minute cache (increased for performance)
const MAX_RETRIES = 2; // Retry up to 2 times (reduced from 3)
const RETRY_DELAYS = [0, 500]; // Faster retry delays

// SessionStorage key for car data persistence (storage abstraction adds 'autorev_' prefix)
const SESSION_STORAGE_KEY = 'cars_cache';
const SESSION_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes for session storage

// In-memory cache for car data
const cache = {
  allCars: { data: null, timestamp: 0 },
  bySlug: new Map(), // slug -> { data, timestamp }
};

// Request deduplication - prevent multiple simultaneous fetches
let inFlightRequest = null;

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
  return Promise.race([queryPromise, createTimeoutPromise(timeoutMs)]);
}

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff
 * @param {Function} fn - Async function to execute
 * @param {string} context - Context for logging (e.g., 'fetchCars')
 * @returns {Promise<any>}
 */
async function withRetry(fn, context = 'operation') {
  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Wait before retry (0ms for first attempt)
      if (attempt > 0) {
        const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        await sleep(delay);
      }

      return await fn();
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === MAX_RETRIES - 1;

      // Only log retries, not final failure (caller handles that)
      if (!isLastAttempt) {
        console.warn(
          `[carsClient] ${context} attempt ${attempt + 1}/${MAX_RETRIES} failed: ${err.message}, retrying...`
        );
      }
    }
  }

  throw lastError;
}

/**
 * Normalize car data from Supabase to match expected format
 * Updated for Teoalida schema (Jan 2026)
 *
 * Field mapping changes:
 * - brand → make (Teoalida uses "make")
 * - country → countryOfOrigin
 * - engine → engineType
 * - trans → transmission
 * - drivetrain → driveType
 * - price_range/price_avg → msrp (single value)
 * - image_hero_url → imageUrl
 * - years → year (now specific integer, not range)
 *
 * @param {Object} car - Car object from Supabase
 * @returns {Object} - Normalized car object
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
 * Load cars from sessionStorage (for instant page refreshes)
 * @returns {Object|null} - Cached data or null
 */
function loadFromSessionStorage() {
  const stored = sessionStore.get(SESSION_STORAGE_KEY);
  if (!stored || !stored.timestamp || !stored.data) return null;

  // Check if session cache is still valid
  if (Date.now() - stored.timestamp > SESSION_CACHE_TTL_MS) {
    sessionStore.remove(SESSION_STORAGE_KEY);
    return null;
  }

  return stored.data;
}

/**
 * Save cars to sessionStorage for instant page refreshes
 * @param {Object[]} cars - Array of normalized car objects
 */
function saveToSessionStorage(cars) {
  sessionStore.set(SESSION_STORAGE_KEY, {
    timestamp: Date.now(),
    data: cars,
  });
}

/**
 * Fetch all cars from Supabase
 * Uses in-memory cache, sessionStorage, and request deduplication for fast access
 * @returns {Promise<Object[]>} - Array of car objects
 * @throws {Error} - If Supabase is not configured or query fails
 */
export async function fetchCars() {
  // 1. Check in-memory cache first (fastest)
  if (cache.allCars.data && isCacheValid(cache.allCars.timestamp)) {
    return cache.allCars.data;
  }

  // 2. Check sessionStorage cache (instant on page refresh)
  const sessionCached = loadFromSessionStorage();
  if (sessionCached) {
    console.log('[carsClient] Using sessionStorage cache');
    cache.allCars = { data: sessionCached, timestamp: Date.now() };
    return sessionCached;
  }

  // 3. If there's already a request in flight, wait for it (deduplication)
  if (inFlightRequest) {
    console.log('[carsClient] Waiting for existing request...');
    return inFlightRequest;
  }

  // Supabase must be configured - no fallbacks
  if (!isSupabaseConfigured || !supabase) {
    if (cache.allCars.data) {
      console.warn('[carsClient] Supabase not configured, returning stale cache');
      return cache.allCars.data;
    }
    throw new Error('[carsClient] Supabase is not configured. Check environment variables.');
  }

  // 4. Start new request and track it for deduplication
  inFlightRequest = (async () => {
    try {
      const { data, error: _error } = await withRetry(async () => {
        // Use optimized column list instead of select('*')
        // Teoalida schema: all records are valid YMMT entries
        // Order by MSRP (previously price_avg)
        const result = await withTimeout(
          supabase
            .from('cars')
            .select(LIST_VIEW_COLUMNS)
            .eq('is_selectable', true)
            .order('msrp', { ascending: true, nullsFirst: false })
        );

        if (result.error) {
          throw new Error(result.error.message);
        }

        return result;
      }, 'fetchCars');

      if (!data || data.length === 0) {
        console.warn('[carsClient] No cars found in Supabase database');
        return [];
      }

      // Normalize all cars from Supabase format
      const normalizedCars = data.map(normalizeCarFromSupabase);

      // Update both in-memory and session storage caches
      cache.allCars = { data: normalizedCars, timestamp: Date.now() };
      saveToSessionStorage(normalizedCars);

      console.log('[carsClient] Fetched and cached', normalizedCars.length, 'cars');
      return normalizedCars;
    } catch (err) {
      // Return stale cache if available - recoverable situation
      if (cache.allCars.data) {
        console.warn(`[carsClient] Using stale cache after error: ${err.message}`);
        return cache.allCars.data;
      }

      // Only log as error and throw if we have no fallback
      console.error('[carsClient] Failed to fetch cars (no cache available):', err.message);
      throw err;
    } finally {
      // Clear in-flight request when done
      inFlightRequest = null;
    }
  })();

  return inFlightRequest;
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
    if (cachedEntry?.data) {
      console.warn('[carsClient] Supabase not configured, returning stale cache for', slug);
      return cachedEntry.data;
    }
    throw new Error('[carsClient] Supabase is not configured. Check environment variables.');
  }

  try {
    const { data, error } = await withRetry(async () => {
      const result = await withTimeout(supabase.from('cars').select('*').eq('slug', slug).single());

      // PGRST116 means no rows found - this is not a retry-able error
      if (result.error && result.error.code !== 'PGRST116') {
        throw new Error(result.error.message);
      }

      return result;
    }, `fetchCarBySlug('${slug}')`);

    // Handle not found case
    if (error && error.code === 'PGRST116') {
      cache.bySlug.set(slug, { data: null, timestamp: Date.now() });
      return null;
    }

    const normalizedCar = normalizeCarFromSupabase(data);

    // Update cache
    cache.bySlug.set(slug, { data: normalizedCar, timestamp: Date.now() });

    return normalizedCar;
  } catch (err) {
    // Return stale cache if available - recoverable situation
    if (cachedEntry?.data) {
      console.warn(`[carsClient] Using stale cache for '${slug}' after error: ${err.message}`);
      return cachedEntry.data;
    }

    // Only log as error and throw if we have no fallback
    console.error(`[carsClient] Failed to fetch car '${slug}' (no cache available):`, err.message);
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
  return allCars.filter((car) => car.tier === tier);
}

/**
 * Fetch cars by category (chassis layout)
 * @param {string} category - The category to filter by (Mid-Engine, Front-Engine, Rear-Engine)
 * @returns {Promise<Object[]>} - Array of car objects
 */
export async function fetchCarsByCategory(category) {
  const allCars = await fetchCars();
  return allCars.filter((car) => car.category === category);
}

/**
 * Search cars by name
 * @param {string} query - Search query
 * @returns {Promise<Object[]>} - Array of matching car objects
 */
export async function searchCars(query) {
  const allCars = await fetchCars();
  const lowerQuery = query.toLowerCase();
  return allCars.filter(
    (car) =>
      car.name.toLowerCase().includes(lowerQuery) ||
      (car.engineType && car.engineType.toLowerCase().includes(lowerQuery)) ||
      (car.notes && car.notes.toLowerCase().includes(lowerQuery))
  );
}

const carsClient = {
  fetchCars,
  fetchCarBySlug,
  fetchCarsByTier,
  fetchCarsByCategory,
  searchCars,
  clearCarsCache,
};

export default carsClient;
