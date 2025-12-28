/**
 * User Data Prefetching Utilities
 * 
 * Prefetches user data when hovering over navigation links
 * to make page loads feel instant.
 * 
 * @module lib/prefetch
 */

import { fetchUserFavorites, fetchUserVehicles, fetchUserProjects } from './userDataService';

// Track what's already been prefetched to avoid duplicate calls
const prefetchedResources = new Set();

// Cache prefetched data for use by providers
const prefetchCache = {
  favorites: null,
  vehicles: null,
  builds: null,
  lastUserId: null,
};

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
  
  // Clear cache if user changed
  if (prefetchCache.lastUserId !== userId) {
    prefetchedResources.clear();
    prefetchCache.favorites = null;
    prefetchCache.vehicles = null;
    prefetchCache.builds = null;
    prefetchCache.lastUserId = userId;
  }

  console.log('[Prefetch] Prefetching all user data...');
  
  // Prefetch all in parallel
  await Promise.all([
    prefetchFavorites(userId),
    prefetchVehicles(userId),
    prefetchBuilds(userId),
  ]);
  
  console.log('[Prefetch] All user data prefetched');
}

/**
 * Prefetch favorites
 */
async function prefetchFavorites(userId) {
  if (prefetchedResources.has('favorites')) return;
  
  try {
    const { data, error } = await fetchUserFavorites(userId);
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
    const { data, error } = await fetchUserVehicles(userId);
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
    const { data, error } = await fetchUserProjects(userId);
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
 * Get cached prefetch data
 * Used by providers to check if data was already prefetched
 */
export function getPrefetchedData(type, userId) {
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
  prefetchCache.lastUserId = null;
  console.log('[Prefetch] Cache cleared');
}

