/**
 * Car Identifier Resolution Utility
 * 
 * SOURCE OF TRUTH for car_slug to car_id resolution.
 * Provides efficient resolution with caching.
 * 
 * @module lib/carResolver
 * @see docs/SOURCE_OF_TRUTH.md
 */

import { supabase, isSupabaseConfigured } from './supabase.js';

// In-memory cache for slug→id resolution (TTL: 5 minutes)
const slugToIdCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Resolve a car_slug to car_id with caching
 * @param {string} carSlug - The car slug to resolve
 * @param {Object} [options] - Optional configuration
 * @param {Object} [options.client] - Supabase client to use (defaults to browser client)
 * @param {boolean} [options.skipCache] - Skip cache lookup (for server-side with service role)
 * @returns {Promise<string|null>} The car_id (UUID) or null if not found
 */
export async function resolveCarId(carSlug, options = {}) {
  const { client, skipCache = false } = options;
  const db = client || supabase;
  
  if (!carSlug) {
    return null;
  }
  
  // If no client provided, check that default supabase is configured
  if (!client && (!isSupabaseConfigured || !supabase)) {
    return null;
  }

  // Check cache first (skip for custom clients like service role)
  if (!skipCache && !client) {
    const cached = slugToIdCache.get(carSlug);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
      return cached.carId;
    }
  }

  try {
    const { data, error } = await db
      .from('cars')
      .select('id')
      .eq('slug', carSlug)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[carResolver] Error resolving car_id:', error);
      return null;
    }

    const carId = data?.id || null;

    // Cache the result (only for default client)
    if (!client) {
      slugToIdCache.set(carSlug, { carId, timestamp: Date.now() });
    }

    return carId;
  } catch (err) {
    console.error('[carResolver] Unexpected error:', err);
    return null;
  }
}

/**
 * Resolve multiple car_slugs to car_ids in a single query
 * @param {string[]} carSlugs - Array of car slugs to resolve
 * @returns {Promise<Map<string, string>>} Map of slug→id
 */
export async function resolveCarIds(carSlugs) {
  if (!carSlugs?.length || !isSupabaseConfigured || !supabase) {
    return new Map();
  }

  // Check cache for all slugs
  const result = new Map();
  const uncachedSlugs = [];

  for (const slug of carSlugs) {
    const cached = slugToIdCache.get(slug);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
      if (cached.carId) result.set(slug, cached.carId);
    } else {
      uncachedSlugs.push(slug);
    }
  }

  // Fetch uncached slugs
  if (uncachedSlugs.length > 0) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('id, slug')
        .in('slug', uncachedSlugs);

      if (!error && data) {
        for (const car of data) {
          result.set(car.slug, car.id);
          slugToIdCache.set(car.slug, { carId: car.id, timestamp: Date.now() });
        }
        // Cache misses (slugs that don't exist)
        for (const slug of uncachedSlugs) {
          if (!result.has(slug)) {
            slugToIdCache.set(slug, { carId: null, timestamp: Date.now() });
          }
        }
      }
    } catch (err) {
      console.error('[carResolver] Error batch resolving car_ids:', err);
    }
  }

  return result;
}

/**
 * Get car basic info (id, slug, name) by slug
 * Useful when you need more than just the id
 * @param {string} carSlug - The car slug
 * @returns {Promise<{id: string, slug: string, name: string}|null>}
 */
export async function getCarBasicInfo(carSlug) {
  if (!carSlug || !isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('cars')
      .select('id, slug, name, year_start, year_end, brand')
      .eq('slug', carSlug)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[carResolver] Error fetching car info:', error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error('[carResolver] Unexpected error:', err);
    return null;
  }
}

/**
 * Clear the slug→id cache (useful for testing)
 */
export function clearCache() {
  slugToIdCache.clear();
}

/**
 * Get cache statistics (useful for debugging)
 * @returns {{size: number, entries: Array}}
 */
export function getCacheStats() {
  const entries = [];
  const now = Date.now();
  for (const [slug, { carId, timestamp }] of slugToIdCache.entries()) {
    entries.push({
      slug,
      carId,
      ageMs: now - timestamp,
      expired: (now - timestamp) >= CACHE_TTL_MS,
    });
  }
  return { size: slugToIdCache.size, entries };
}

const carResolver = {
  resolveCarId,
  resolveCarIds,
  getCarBasicInfo,
  clearCache,
  getCacheStats,
};

export default carResolver;
