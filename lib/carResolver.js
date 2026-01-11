/**
 * Car Identifier Resolution Utility
 * 
 * Provides efficient car_slug to car_id resolution with caching.
 * Use this to ensure consistent car_id usage across the codebase.
 * 
 * @module lib/carResolver
 */

import { supabase, isSupabaseConfigured } from './supabase';

// In-memory cache for slug→id resolution (TTL: 5 minutes)
const slugToIdCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Resolve a car_slug to car_id with caching
 * @param {string} carSlug - The car slug to resolve
 * @returns {Promise<string|null>} The car_id (UUID) or null if not found
 */
export async function resolveCarId(carSlug) {
  if (!carSlug || !isSupabaseConfigured || !supabase) {
    return null;
  }

  // Check cache first
  const cached = slugToIdCache.get(carSlug);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached.carId;
  }

  try {
    const { data, error } = await supabase
      .from('cars')
      .select('id')
      .eq('slug', carSlug)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[carResolver] Error resolving car_id:', error);
      return null;
    }

    const carId = data?.id || null;

    // Cache the result
    slugToIdCache.set(carSlug, { carId, timestamp: Date.now() });

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

export default {
  resolveCarId,
  resolveCarIds,
  getCarBasicInfo,
  clearCache,
  getCacheStats,
};
