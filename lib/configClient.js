/**
 * Config API Client
 * 
 * Fetches configuration data from Supabase app_config table.
 * All configuration data is now stored in the database for single source of truth.
 * 
 * Features:
 * - In-memory cache with TTL for fast repeated access
 * - Batch fetching for multiple configs at once
 * - Category-based fetching
 * 
 * Available Configs:
 * - tierConfig: Price tier definitions
 * - categories: Car advisory priority categories
 * - recommendationTypes: Recommendation badge types
 * - priorityDescriptors: UI slider descriptors
 * - performanceCategories: Performance HUB categories
 * - upgradeTiers: Upgrade tier definitions
 * - upgradeModuleCategories: Upgrade module categories
 * 
 * @module lib/configClient
 */

import { supabase, isSupabaseConfigured } from './supabase.js';

// Configuration
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache (configs rarely change)
const REQUEST_TIMEOUT_MS = 5000; // 5 second timeout

// In-memory cache
const cache = {
  configs: new Map(), // key -> { value, timestamp }
  byCategory: new Map(), // category -> { configs, timestamp }
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
    setTimeout(() => reject(new Error('Config request timeout')), ms);
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
 * Fetch a single config value by key
 * @param {string} key - Config key
 * @returns {Promise<any>} - Config value (parsed JSON)
 */
export async function fetchConfig(key) {
  if (!key) return null;

  // Check cache first
  const cached = cache.configs.get(key);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.value;
  }

  // Require Supabase - no fallback for configs
  if (!isSupabaseConfigured || !supabase) {
    console.error('[configClient] Supabase not configured, cannot fetch config:', key);
    return null;
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('app_config')
        .select('value')
        .eq('key', key)
        .single()
    );

    if (error) {
      console.error(`[configClient] Error fetching config '${key}':`, error.message);
      // Return stale cache if available
      if (cached?.value) {
        console.log(`[configClient] Returning stale cache for '${key}'`);
        return cached.value;
      }
      return null;
    }

    const value = data?.value;
    cache.configs.set(key, { value, timestamp: Date.now() });
    return value;
  } catch (err) {
    console.error(`[configClient] Exception fetching config '${key}':`, err.message);
    if (cached?.value) {
      return cached.value;
    }
    return null;
  }
}

/**
 * Fetch multiple configs at once (more efficient than individual fetches)
 * @param {string[]} keys - Array of config keys
 * @returns {Promise<Object>} - Object with key -> value mappings
 */
export async function fetchConfigs(keys) {
  if (!keys || keys.length === 0) return {};

  // Check which keys are not cached
  const result = {};
  const keysToFetch = [];

  for (const key of keys) {
    const cached = cache.configs.get(key);
    if (cached && isCacheValid(cached.timestamp)) {
      result[key] = cached.value;
    } else {
      keysToFetch.push(key);
    }
  }

  // If all cached, return early
  if (keysToFetch.length === 0) {
    return result;
  }

  // Require Supabase
  if (!isSupabaseConfigured || !supabase) {
    console.error('[configClient] Supabase not configured');
    return result;
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('app_config')
        .select('key, value')
        .in('key', keysToFetch)
    );

    if (error) {
      console.error('[configClient] Error batch fetching configs:', error.message);
      return result;
    }

    const now = Date.now();
    for (const row of (data || [])) {
      result[row.key] = row.value;
      cache.configs.set(row.key, { value: row.value, timestamp: now });
    }

    return result;
  } catch (err) {
    console.error('[configClient] Exception batch fetching configs:', err.message);
    return result;
  }
}

/**
 * Fetch all configs in a category
 * @param {string} category - Config category (e.g., 'cars', 'performance', 'ui')
 * @returns {Promise<Object>} - Object with key -> value mappings
 */
export async function fetchConfigsByCategory(category) {
  if (!category) return {};

  // Check cache
  const cached = cache.byCategory.get(category);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.configs;
  }

  if (!isSupabaseConfigured || !supabase) {
    console.error('[configClient] Supabase not configured');
    return {};
  }

  try {
    const { data, error } = await withTimeout(
      supabase
        .from('app_config')
        .select('key, value')
        .eq('category', category)
    );

    if (error) {
      console.error(`[configClient] Error fetching category '${category}':`, error.message);
      if (cached?.configs) {
        return cached.configs;
      }
      return {};
    }

    const configs = {};
    const now = Date.now();
    for (const row of (data || [])) {
      configs[row.key] = row.value;
      cache.configs.set(row.key, { value: row.value, timestamp: now });
    }

    cache.byCategory.set(category, { configs, timestamp: now });
    return configs;
  } catch (err) {
    console.error(`[configClient] Exception fetching category '${category}':`, err.message);
    if (cached?.configs) {
      return cached.configs;
    }
    return {};
  }
}

// ============================================================================
// CONVENIENCE EXPORTS - Pre-defined config fetchers for common configs
// ============================================================================

/**
 * Get tier configuration
 * @returns {Promise<Object>} - { premium: {...}, 'upper-mid': {...}, ... }
 */
export async function getTierConfig() {
  return await fetchConfig('tierConfig') || {};
}

/**
 * Get advisory categories
 * @returns {Promise<Array>} - Array of category objects
 */
export async function getCategories() {
  return await fetchConfig('categories') || [];
}

/**
 * Get recommendation types
 * @returns {Promise<Array>} - Array of recommendation type objects
 */
export async function getRecommendationTypes() {
  return await fetchConfig('recommendationTypes') || [];
}

/**
 * Get priority descriptors for selector UI
 * @returns {Promise<Object>} - { sound: {...}, track: {...}, ... }
 */
export async function getPriorityDescriptors() {
  return await fetchConfig('priorityDescriptors') || {};
}

/**
 * Get descriptor text for a specific priority and value
 * @param {string} key - Priority key (e.g., 'sound', 'track')
 * @param {number} value - Slider value (0-3)
 * @returns {Promise<string>} - Descriptor text
 */
export async function getDescriptorForValue(key, value) {
  const descriptors = await getPriorityDescriptors();
  const descriptor = descriptors[key];
  if (!descriptor?.levels) return '';

  // Find the closest matching level
  const levels = Object.keys(descriptor.levels)
    .map(Number)
    .sort((a, b) => a - b);
  
  const closestLevel = levels.reduce((prev, curr) => 
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );

  return descriptor.levels[closestLevel] || '';
}

/**
 * Get performance categories for Performance HUB
 * @returns {Promise<Array>} - Array of performance category objects
 */
export async function getPerformanceCategories() {
  return await fetchConfig('performanceCategories') || [];
}

/**
 * Get upgrade tiers
 * @returns {Promise<Object>} - { stock: {...}, streetSport: {...}, ... }
 */
export async function getUpgradeTiers() {
  return await fetchConfig('upgradeTiers') || {};
}

/**
 * Get upgrade module categories
 * @returns {Promise<Array>} - Array of module category objects
 */
export async function getUpgradeModuleCategories() {
  return await fetchConfig('upgradeModuleCategories') || [];
}

/**
 * Get all car-related configs at once
 * @returns {Promise<Object>} - { tierConfig, categories, recommendationTypes }
 */
export async function getCarConfigs() {
  return await fetchConfigsByCategory('cars');
}

/**
 * Get all performance-related configs at once
 * @returns {Promise<Object>} - { performanceCategories, upgradeTiers, upgradeModuleCategories }
 */
export async function getPerformanceConfigs() {
  return await fetchConfigsByCategory('performance');
}

/**
 * Get all UI-related configs at once
 * @returns {Promise<Object>} - { priorityDescriptors }
 */
export async function getUIConfigs() {
  return await fetchConfigsByCategory('ui');
}

/**
 * Clear config cache (useful after admin updates)
 */
export function clearConfigCache() {
  cache.configs.clear();
  cache.byCategory.clear();
}

/**
 * Preload commonly used configs into cache
 * Call this on app initialization for faster subsequent access
 */
export async function preloadConfigs() {
  try {
    // Fetch all public configs in one query
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    const { data, error } = await supabase
      .from('app_config')
      .select('key, value, category')
      .eq('is_public', true);

    if (error) {
      console.error('[configClient] Error preloading configs:', error.message);
      return;
    }

    const now = Date.now();
    const byCategory = new Map();

    for (const row of (data || [])) {
      cache.configs.set(row.key, { value: row.value, timestamp: now });
      
      // Also group by category
      if (!byCategory.has(row.category)) {
        byCategory.set(row.category, {});
      }
      byCategory.get(row.category)[row.key] = row.value;
    }

    // Cache by category
    for (const [category, configs] of byCategory) {
      cache.byCategory.set(category, { configs, timestamp: now });
    }

    console.log(`[configClient] Preloaded ${data?.length || 0} configs`);
  } catch (err) {
    console.error('[configClient] Exception preloading configs:', err.message);
  }
}

export default {
  fetchConfig,
  fetchConfigs,
  fetchConfigsByCategory,
  getTierConfig,
  getCategories,
  getRecommendationTypes,
  getPriorityDescriptors,
  getDescriptorForValue,
  getPerformanceCategories,
  getUpgradeTiers,
  getUpgradeModuleCategories,
  getCarConfigs,
  getPerformanceConfigs,
  getUIConfigs,
  clearConfigCache,
  preloadConfigs,
};

