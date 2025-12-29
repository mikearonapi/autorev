/**
 * User Data Prefetching Utilities
 * 
 * Prefetches user data when hovering over navigation links
 * to make page loads feel instant.
 * 
 * Includes sessionStorage persistence for instant page refreshes.
 * 
 * @module lib/prefetch
 */

import { fetchUserFavorites, fetchUserVehicles, fetchUserProjects, fetchUserCompareLists } from './userDataService';

// Track what's already been prefetched to avoid duplicate calls
const prefetchedResources = new Set();

// Prefetch should never be able to block the app from becoming usable.
// Supabase client requests can hang indefinitely in some edge network conditions,
// so we wrap each fetch in a hard timeout and treat timeouts as best-effort failures.
function withTimeout(promise, ms, label) {
  if (!ms || ms <= 0) return promise;
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

// Keep aligned with LoadingProgressProvider step timeouts (slightly under to avoid UI stalls)
const PREFETCH_TIMEOUTS = {
  favorites: 8000,
  vehicles: 8000,
  builds: 10000,
  compareLists: 8000,
  all: 12000,
};

// SessionStorage persistence configuration
const CACHE_KEY = 'autorev_prefetch_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cache prefetched data for use by providers
const prefetchCache = {
  favorites: null,
  vehicles: null,
  builds: null,
  compareLists: null,
  lastUserId: null,
};

/**
 * Check if sessionStorage is available
 * Returns false in private browsing mode or when quota exceeded
 */
function isSessionStorageAvailable() {
  try {
    const test = '__storage_test__';
    sessionStorage.setItem(test, test);
    sessionStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Load cache from sessionStorage on module initialization
 * Validates timestamp and user ID before hydrating cache
 */
function loadCacheFromStorage() {
  if (typeof window === 'undefined' || !isSessionStorageAvailable()) {
    console.log('[Prefetch] sessionStorage not available, skipping cache load');
    return;
  }

  try {
    const stored = sessionStorage.getItem(CACHE_KEY);
    if (!stored) {
      console.log('[Prefetch] No cached data found in sessionStorage');
      return;
    }

    const parsed = JSON.parse(stored);
    const now = Date.now();
    
    // Validate cache structure
    if (!parsed || !parsed.timestamp || !parsed.userId || !parsed.data) {
      console.log('[Prefetch] Invalid cache structure, clearing');
      sessionStorage.removeItem(CACHE_KEY);
      return;
    }

    // Check if cache is stale
    if (now - parsed.timestamp > CACHE_TTL_MS) {
      console.log('[Prefetch] Cache expired (age:', Math.round((now - parsed.timestamp) / 1000), 'seconds), clearing');
      sessionStorage.removeItem(CACHE_KEY);
      return;
    }

    // Hydrate cache from storage
    prefetchCache.favorites = parsed.data.favorites || null;
    prefetchCache.vehicles = parsed.data.vehicles || null;
    prefetchCache.builds = parsed.data.builds || null;
    prefetchCache.compareLists = parsed.data.compareLists || null;
    prefetchCache.lastUserId = parsed.userId;

    // Mark resources as prefetched
    if (parsed.data.favorites) prefetchedResources.add('favorites');
    if (parsed.data.vehicles) prefetchedResources.add('vehicles');
    if (parsed.data.builds) prefetchedResources.add('builds');
    if (parsed.data.compareLists) prefetchedResources.add('compareLists');

    const age = Math.round((now - parsed.timestamp) / 1000);
    console.log('[Prefetch] Cache loaded from sessionStorage (age:', age, 'seconds, user:', parsed.userId, ')');
  } catch (err) {
    console.warn('[Prefetch] Failed to load cache from sessionStorage:', err);
    // Clear potentially corrupted data
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Save cache to sessionStorage after successful prefetch
 * Includes timestamp and user ID for validation
 */
function saveCacheToStorage() {
  if (typeof window === 'undefined' || !isSessionStorageAvailable()) {
    return;
  }

  // Don't save if we don't have a user ID
  if (!prefetchCache.lastUserId) {
    return;
  }

  try {
    const cacheData = {
      timestamp: Date.now(),
      userId: prefetchCache.lastUserId,
      data: {
        favorites: prefetchCache.favorites,
        vehicles: prefetchCache.vehicles,
        builds: prefetchCache.builds,
        compareLists: prefetchCache.compareLists,
      },
    };

    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log('[Prefetch] Cache saved to sessionStorage (user:', prefetchCache.lastUserId, ')');
  } catch (err) {
    // Storage quota exceeded or other error
    console.warn('[Prefetch] Failed to save cache to sessionStorage:', err);
    // Try to clear old cache to free space
    try {
      sessionStorage.removeItem(CACHE_KEY);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

// Load cache on module initialization (client-side only)
if (typeof window !== 'undefined') {
  loadCacheFromStorage();
}

/**
 * Prefetch user data for a specific route
 * @param {string} route - The route to prefetch for
 * @param {string} userId - The authenticated user's ID
 */
export async function prefetchForRoute(route, userId) {
  if (!userId) return;
  
  // Clear cache if user changed
  if (prefetchCache.lastUserId !== userId) {
    prefetchedResources.clear();
    prefetchCache.favorites = null;
    prefetchCache.vehicles = null;
    prefetchCache.builds = null;
    prefetchCache.compareLists = null;
    prefetchCache.lastUserId = userId;
  }

  // Determine what to prefetch based on route
  const prefetchPromises = [];

  if (route === '/garage' || route === '/tuning-shop') {
    // Garage needs favorites, vehicles, and builds
    if (!prefetchedResources.has('favorites')) {
      prefetchPromises.push(prefetchFavorites(userId));
    }
    if (!prefetchedResources.has('vehicles')) {
      prefetchPromises.push(prefetchVehicles(userId));
    }
    if (!prefetchedResources.has('builds')) {
      prefetchPromises.push(prefetchBuilds(userId));
    }
  } else if (route.startsWith('/browse-cars')) {
    // Browse cars mainly needs favorites
    if (!prefetchedResources.has('favorites')) {
      prefetchPromises.push(prefetchFavorites(userId));
    }
  } else if (route === '/mod-planner') {
    // Mod planner needs favorites and vehicles
    if (!prefetchedResources.has('favorites')) {
      prefetchPromises.push(prefetchFavorites(userId));
    }
    if (!prefetchedResources.has('vehicles')) {
      prefetchPromises.push(prefetchVehicles(userId));
    }
  } else if (route === '/profile') {
    // Profile needs all user data
    if (!prefetchedResources.has('favorites')) {
      prefetchPromises.push(prefetchFavorites(userId));
    }
    if (!prefetchedResources.has('vehicles')) {
      prefetchPromises.push(prefetchVehicles(userId));
    }
    if (!prefetchedResources.has('builds')) {
      prefetchPromises.push(prefetchBuilds(userId));
    }
  }

  // Execute all prefetches in parallel
  if (prefetchPromises.length > 0) {
    console.log(`[Prefetch] Prefetching data for ${route}:`, prefetchPromises.length, 'resources');
    await Promise.all(prefetchPromises);
  }
}

/**
 * Prefetch all user data at once
 * Call this after successful authentication
 * @param {string} userId - The authenticated user's ID
 */
export async function prefetchAllUserData(userId) {
  if (!userId) return;
  
  // Clear cache if user changed (prevents cross-user data leaks)
  if (prefetchCache.lastUserId !== userId) {
    console.log('[Prefetch] User changed, clearing cache');
    prefetchedResources.clear();
    prefetchCache.favorites = null;
    prefetchCache.vehicles = null;
    prefetchCache.builds = null;
    prefetchCache.compareLists = null;
    prefetchCache.lastUserId = userId;
    
    // Clear sessionStorage cache for previous user
    if (typeof window !== 'undefined' && isSessionStorageAvailable()) {
      try {
        sessionStorage.removeItem(CACHE_KEY);
      } catch (err) {
        console.warn('[Prefetch] Failed to clear sessionStorage:', err);
      }
    }
  }

  console.log('[Prefetch] Prefetching all user data...');
  
  // Prefetch all in parallel (best-effort) with a hard cap so auth/login can't hang forever.
  await withTimeout(
    Promise.allSettled([
      prefetchFavorites(userId),
      prefetchVehicles(userId),
      prefetchBuilds(userId),
      prefetchCompareLists(userId),
    ]),
    PREFETCH_TIMEOUTS.all,
    '[Prefetch] prefetchAllUserData'
  ).catch(err => {
    console.warn('[Prefetch] Prefetch all timed out / failed (non-fatal):', err);
  });
  
  console.log('[Prefetch] All user data prefetched');
  
  // Persist to sessionStorage after successful prefetch
  saveCacheToStorage();
}

/**
 * Prefetch favorites
 */
async function prefetchFavorites(userId) {
  if (prefetchedResources.has('favorites')) return;
  
  try {
    const { data, error } = await withTimeout(
      fetchUserFavorites(userId),
      PREFETCH_TIMEOUTS.favorites,
      '[Prefetch] Favorites prefetch'
    );
    if (!error && data) {
      prefetchCache.favorites = data;
      prefetchedResources.add('favorites');
      console.log('[Prefetch] Favorites prefetched:', data.length);
    }
  } catch (err) {
    console.warn('[Prefetch] Favorites prefetch failed:', err);
  }
}

/**
 * Prefetch vehicles
 */
async function prefetchVehicles(userId) {
  if (prefetchedResources.has('vehicles')) return;
  
  try {
    const { data, error } = await withTimeout(
      fetchUserVehicles(userId),
      PREFETCH_TIMEOUTS.vehicles,
      '[Prefetch] Vehicles prefetch'
    );
    if (!error && data) {
      prefetchCache.vehicles = data;
      prefetchedResources.add('vehicles');
      console.log('[Prefetch] Vehicles prefetched:', data.length);
    }
  } catch (err) {
    console.warn('[Prefetch] Vehicles prefetch failed:', err);
  }
}

/**
 * Prefetch builds/projects
 */
async function prefetchBuilds(userId) {
  if (prefetchedResources.has('builds')) return;
  
  try {
    const { data, error } = await withTimeout(
      fetchUserProjects(userId),
      PREFETCH_TIMEOUTS.builds,
      '[Prefetch] Builds prefetch'
    );
    if (!error && data) {
      prefetchCache.builds = data;
      prefetchedResources.add('builds');
      console.log('[Prefetch] Builds prefetched:', data.length);
    }
  } catch (err) {
    console.warn('[Prefetch] Builds prefetch failed:', err);
  }
}

/**
 * Prefetch compare lists
 */
async function prefetchCompareLists(userId) {
  if (prefetchedResources.has('compareLists')) return;
  
  try {
    const { data, error } = await withTimeout(
      fetchUserCompareLists(userId),
      PREFETCH_TIMEOUTS.compareLists,
      '[Prefetch] Compare lists prefetch'
    );
    if (!error && data) {
      prefetchCache.compareLists = data;
      prefetchedResources.add('compareLists');
      console.log('[Prefetch] Compare lists prefetched:', data.length);
    }
  } catch (err) {
    console.warn('[Prefetch] Compare lists prefetch failed:', err);
  }
}

/**
 * Check for SSR-fetched data in sessionStorage
 * This is populated by SSRDataProvider when a Server Component fetches data
 */
function getSSRData(type, userId) {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = sessionStorage.getItem('autorev_ssr_data');
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    
    // Validate user ID matches
    if (parsed.userId !== userId) {
      return null;
    }
    
    // Check if data is fresh (< 30 seconds old for SSR data)
    const age = Date.now() - parsed.timestamp;
    if (age > 30000) {
      // Clear stale data
      sessionStorage.removeItem('autorev_ssr_data');
      return null;
    }
    
    return parsed.data?.[type] || null;
  } catch (err) {
    return null;
  }
}

/**
 * Get cached prefetch data
 * Used by providers to check if data was already prefetched
 * 
 * Priority:
 * 1. SSR data (from Server Component fetch) - highest priority, freshest
 * 2. Memory cache (from client-side prefetch)
 * 3. SessionStorage cache (from previous page load)
 */
export function getPrefetchedData(type, userId) {
  // First check for SSR data (highest priority - just fetched on server)
  const ssrData = getSSRData(type, userId);
  if (ssrData) {
    console.log(`[Prefetch] Using SSR data for ${type}:`, ssrData.length);
    return ssrData;
  }
  
  // Fall back to memory cache
  // Only return cached data if it's for the same user
  if (prefetchCache.lastUserId !== userId) {
    return null;
  }
  
  switch (type) {
    case 'favorites':
      return prefetchCache.favorites;
    case 'vehicles':
      return prefetchCache.vehicles;
    case 'builds':
      return prefetchCache.builds;
    case 'compareLists':
      return prefetchCache.compareLists;
    default:
      return null;
  }
}

/**
 * Clear the prefetch cache
 * Call this on logout
 */
export function clearPrefetchCache() {
  prefetchedResources.clear();
  prefetchCache.favorites = null;
  prefetchCache.vehicles = null;
  prefetchCache.builds = null;
  prefetchCache.compareLists = null;
  prefetchCache.lastUserId = null;
  
  // Clear sessionStorage caches (both regular prefetch and SSR data)
  if (typeof window !== 'undefined' && isSessionStorageAvailable()) {
    try {
      sessionStorage.removeItem(CACHE_KEY);
      sessionStorage.removeItem('autorev_ssr_data'); // Also clear SSR data
      console.log('[Prefetch] Cache cleared (including sessionStorage)');
    } catch (err) {
      console.warn('[Prefetch] Failed to clear sessionStorage:', err);
      console.log('[Prefetch] Cache cleared (memory only)');
    }
  } else {
    console.log('[Prefetch] Cache cleared');
  }
}

