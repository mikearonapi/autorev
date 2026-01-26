/**
 * User Data Prefetching Utilities
 * 
 * Prefetches user data when hovering over navigation links
 * to make page loads feel instant.
 * 
 * Includes sessionStorage persistence for instant page refreshes.
 * Uses storage abstraction for cross-platform support (PWA/iOS/Android).
 * 
 * @module lib/prefetch
 */

import { fetchUserFavorites, fetchUserVehicles, fetchUserProjects, fetchUserCompareLists } from './userDataService';
import { sessionStore } from './storage';
import { supabase, isSupabaseConfigured } from './supabase';

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
// OPTIMIZED: Reduced timeouts to fail faster on slow connections
const PREFETCH_TIMEOUTS = {
  favorites: 4000,   // Reduced from 8000
  vehicles: 4000,    // Reduced from 8000
  builds: 5000,      // Reduced from 10000
  compareLists: 4000, // Reduced from 8000
  all: 6000,         // Reduced from 12000
};

// SessionStorage persistence configuration (storage abstraction adds 'autorev_' prefix)
const CACHE_KEY = 'prefetch_cache';
const SSR_CACHE_KEY = 'ssr_data';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cache prefetched data for use by providers
const prefetchCache = {
  favorites: null,
  vehicles: null,
  builds: null,
  compareLists: null,
  heroImages: null, // Map of carSlug -> heroImageUrl
  carsList: null, // Cars list for garage vehicle matching
  dashboard: null, // Dashboard data
  lastUserId: null,
};

/**
 * Load cache from sessionStorage on module initialization
 * Validates timestamp and user ID before hydrating cache
 */
function loadCacheFromStorage() {
  const stored = sessionStore.get(CACHE_KEY);
  if (!stored) {
    console.log('[Prefetch] No cached data found in sessionStorage');
    return;
  }

  const now = Date.now();
  
  // Validate cache structure
  if (!stored.timestamp || !stored.userId || !stored.data) {
    console.log('[Prefetch] Invalid cache structure, clearing');
    sessionStore.remove(CACHE_KEY);
    return;
  }

  // Check if cache is stale
  if (now - stored.timestamp > CACHE_TTL_MS) {
    console.log('[Prefetch] Cache expired (age:', Math.round((now - stored.timestamp) / 1000), 'seconds), clearing');
    sessionStore.remove(CACHE_KEY);
    return;
  }

  // Hydrate cache from storage
  prefetchCache.favorites = stored.data.favorites || null;
  prefetchCache.vehicles = stored.data.vehicles || null;
  prefetchCache.builds = stored.data.builds || null;
  prefetchCache.compareLists = stored.data.compareLists || null;
  prefetchCache.heroImages = stored.data.heroImages || null;
  prefetchCache.lastUserId = stored.userId;

  // Mark resources as prefetched
  if (stored.data.favorites) prefetchedResources.add('favorites');
  if (stored.data.vehicles) prefetchedResources.add('vehicles');
  if (stored.data.builds) prefetchedResources.add('builds');
  if (stored.data.compareLists) prefetchedResources.add('compareLists');
  if (stored.data.heroImages) prefetchedResources.add('heroImages');

  const age = Math.round((now - stored.timestamp) / 1000);
  console.log('[Prefetch] Cache loaded from sessionStorage (age:', age, 'seconds, user:', stored.userId, ')');
}

/**
 * Save cache to sessionStorage after successful prefetch
 * Includes timestamp and user ID for validation
 */
function saveCacheToStorage() {
  // Don't save if we don't have a user ID
  if (!prefetchCache.lastUserId) {
    return;
  }

  const cacheData = {
    timestamp: Date.now(),
    userId: prefetchCache.lastUserId,
    data: {
      favorites: prefetchCache.favorites,
      vehicles: prefetchCache.vehicles,
      builds: prefetchCache.builds,
      compareLists: prefetchCache.compareLists,
      heroImages: prefetchCache.heroImages,
    },
  };

  sessionStore.set(CACHE_KEY, cacheData);
  console.log('[Prefetch] Cache saved to sessionStorage (user:', prefetchCache.lastUserId, ')');
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
    sessionStore.remove(CACHE_KEY);
  }

  console.log('[Prefetch] Prefetching all user data...');
  
  // Prefetch all in parallel (best-effort) with a hard cap so auth/login can't hang forever.
  // Includes cars list and dashboard for instant garage rendering after splash
  await withTimeout(
    Promise.allSettled([
      prefetchFavorites(userId),
      prefetchVehicles(userId),
      prefetchBuilds(userId),
      prefetchCompareLists(userId),
      prefetchHeroImages(userId), // Also prefetch and preload hero images
      prefetchCarsList(), // Cars list for garage vehicle matching
      prefetchDashboard(userId), // Dashboard data for instant dashboard rendering
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
 * Prefetch hero images for all user vehicles
 * This fetches the hero image URLs and preloads them into the browser cache
 */
async function prefetchHeroImages(userId) {
  if (prefetchedResources.has('heroImages')) return;
  if (!isSupabaseConfigured || !supabase) return;
  
  try {
    const { data, error } = await withTimeout(
      supabase.rpc('get_user_hero_images', { p_user_id: userId }),
      PREFETCH_TIMEOUTS.vehicles,
      '[Prefetch] Hero images prefetch'
    );
    
    if (error) {
      console.warn('[Prefetch] Hero images query error:', error);
      return;
    }
    
    if (!data || data.length === 0) {
      console.log('[Prefetch] No hero images to prefetch');
      prefetchedResources.add('heroImages');
      return;
    }
    
    // Build a map of carSlug -> heroImageUrl
    const heroImagesMap = {};
    const imagesToPreload = [];
    
    for (const row of data) {
      if (row.hero_image_url && row.car_slug) {
        heroImagesMap[row.car_slug] = {
          url: row.hero_image_url,
          thumbnail: row.thumbnail_url,
          vehicleId: row.vehicle_id,
        };
        imagesToPreload.push(row.hero_image_url);
        // Also preload thumbnail for faster initial display
        if (row.thumbnail_url) {
          imagesToPreload.push(row.thumbnail_url);
        }
      }
    }
    
    prefetchCache.heroImages = heroImagesMap;
    prefetchedResources.add('heroImages');
    console.log('[Prefetch] Hero images prefetched:', Object.keys(heroImagesMap).length);
    
    // Preload images into browser cache (fire and forget)
    if (imagesToPreload.length > 0 && typeof window !== 'undefined') {
      preloadImages(imagesToPreload);
    }
  } catch (err) {
    console.warn('[Prefetch] Hero images prefetch failed:', err);
  }
}

/**
 * Prefetch the cars list for garage vehicle matching
 * This is critical for instant garage rendering - without it,
 * the garage page has to wait for the cars list to load.
 */
async function prefetchCarsList() {
  if (prefetchedResources.has('carsList')) return;
  
  try {
    const response = await withTimeout(
      fetch('/api/cars'),
      PREFETCH_TIMEOUTS.vehicles, // Use same timeout as vehicles
      '[Prefetch] Cars list prefetch'
    );
    
    if (!response.ok) {
      console.warn('[Prefetch] Cars list fetch failed:', response.status);
      return;
    }
    
    const data = await response.json();
    const cars = data.cars || data;
    
    if (Array.isArray(cars)) {
      prefetchCache.carsList = cars;
      prefetchedResources.add('carsList');
      console.log('[Prefetch] Cars list prefetched:', cars.length);
    }
  } catch (err) {
    console.warn('[Prefetch] Cars list prefetch failed:', err);
  }
}

/**
 * Prefetch dashboard data for instant dashboard rendering
 * @param {string} userId - User ID
 */
async function prefetchDashboard(userId) {
  if (prefetchedResources.has('dashboard')) return;
  if (!userId) return;
  
  try {
    const response = await withTimeout(
      fetch(`/api/users/${userId}/dashboard`),
      PREFETCH_TIMEOUTS.vehicles, // Use same timeout as vehicles
      '[Prefetch] Dashboard prefetch'
    );
    
    if (!response.ok) {
      console.warn('[Prefetch] Dashboard fetch failed:', response.status);
      return;
    }
    
    const result = await response.json();
    
    if (result.data) {
      prefetchCache.dashboard = result.data;
      prefetchedResources.add('dashboard');
      console.log('[Prefetch] Dashboard prefetched');
    }
  } catch (err) {
    console.warn('[Prefetch] Dashboard prefetch failed:', err);
  }
}

/**
 * Preload images into the browser cache
 * Uses the Image constructor to trigger browser caching
 * 
 * @param {string[]} urls - Array of image URLs to preload
 */
function preloadImages(urls) {
  if (typeof window === 'undefined') return;
  
  console.log('[Prefetch] Preloading', urls.length, 'images into browser cache');
  
  urls.forEach(url => {
    if (!url) return;
    
    // Use Image constructor for cross-origin compatible preloading
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS for Vercel Blob images
    img.src = url;
    
    // Optional: Track when loaded (for debugging)
    img.onload = () => {
      console.log('[Prefetch] Image cached:', url.substring(0, 50) + '...');
    };
    img.onerror = () => {
      console.warn('[Prefetch] Image preload failed:', url.substring(0, 50) + '...');
    };
  });
}

/**
 * Check for SSR-fetched data in sessionStorage
 * This may be populated by Server Components that pre-fetch user data
 */
function getSSRData(type, userId) {
  const stored = sessionStore.get(SSR_CACHE_KEY);
  if (!stored) return null;
  
  // Validate user ID matches
  if (stored.userId !== userId) {
    return null;
  }
  
  // Check if data is fresh (< 30 seconds old for SSR data)
  const age = Date.now() - stored.timestamp;
  if (age > 30000) {
    // Clear stale data
    sessionStore.remove(SSR_CACHE_KEY);
    return null;
  }
  
  return stored.data?.[type] || null;
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
  
  // Cars list is global (not user-specific), so check it first
  if (type === 'carsList') {
    return prefetchCache.carsList;
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
    case 'heroImages':
      return prefetchCache.heroImages;
    case 'dashboard':
      return prefetchCache.dashboard;
    default:
      return null;
  }
}

/**
 * Get prefetched hero image URL for a specific car
 * @param {string} carSlug - The car slug to look up
 * @param {string} userId - The user ID (for validation)
 * @returns {Object|null} - { url, thumbnail, vehicleId } or null
 */
export function getPrefetchedHeroImage(carSlug, userId) {
  // Validate user ID matches cache
  if (prefetchCache.lastUserId !== userId) {
    return null;
  }
  
  if (!prefetchCache.heroImages) {
    return null;
  }
  
  return prefetchCache.heroImages[carSlug] || null;
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
  prefetchCache.heroImages = null;
  prefetchCache.lastUserId = null;
  
  // Clear sessionStorage caches (both regular prefetch and SSR data)
  sessionStore.remove(CACHE_KEY);
  sessionStore.remove(SSR_CACHE_KEY);
  console.log('[Prefetch] Cache cleared (including sessionStorage)');
}

/**
 * Invalidate a specific type of prefetch cache
 * Call this after mutations (e.g., reordering vehicles) to ensure
 * fresh data is fetched on next page load.
 * 
 * @param {'favorites' | 'vehicles' | 'builds' | 'compareLists' | 'heroImages'} type - The cache type to invalidate
 */
export function invalidatePrefetchCache(type) {
  // Invalidate memory cache
  if (type in prefetchCache) {
    prefetchCache[type] = null;
    prefetchedResources.delete(type);
    console.log(`[Prefetch] Invalidated ${type} cache`);
    
    // Update sessionStorage to reflect the change
    saveCacheToStorage();
  } else {
    console.warn(`[Prefetch] Unknown cache type: ${type}`);
  }
}

