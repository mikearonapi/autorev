'use client';

/**
 * SSR Data Provider
 * 
 * Hydrates the client-side prefetch cache with data fetched during SSR.
 * This allows existing providers (FavoritesProvider, OwnedVehiclesProvider,
 * SavedBuildsProvider) to immediately use server-fetched data without
 * making redundant API calls.
 * 
 * How it works:
 * 1. Server Component fetches user data during SSR
 * 2. Data is serialized and passed to this provider as initialData prop
 * 3. On mount, this provider hydrates the prefetch cache
 * 4. Child providers check the prefetch cache first and find the data
 * 5. No client-side fetch is needed - instant content!
 * 
 * @module components/providers/SSRDataProvider
 */

import { useEffect, useRef, createContext, useContext } from 'react';

// Create context to track if SSR data was provided
const SSRDataContext = createContext({
  hadSSRData: false,
  fetchedAt: null,
});

/**
 * Hook to check if SSR data was provided
 */
export function useSSRData() {
  return useContext(SSRDataContext);
}

/**
 * Hydrate the prefetch cache with SSR data
 * 
 * This function directly updates the prefetch module's cache
 * so that providers find the data immediately.
 */
function hydratePrefetchCache(initialData) {
  if (!initialData || typeof window === 'undefined') return false;
  
  const { user, favorites, vehicles, builds, fetchedAt } = initialData;
  
  // Only hydrate if we have a user and the data is fresh (< 5 minutes old)
  if (!user?.id) {
    console.log('[SSRDataProvider] No user in initial data, skipping hydration');
    return false;
  }
  
  const age = Date.now() - (fetchedAt || 0);
  const MAX_AGE = 5 * 60 * 1000; // 5 minutes
  
  if (age > MAX_AGE) {
    console.log('[SSRDataProvider] SSR data too old, skipping hydration:', { ageMs: age });
    return false;
  }
  
  console.log('[SSRDataProvider] Hydrating prefetch cache with SSR data:', {
    userId: user.id.slice(0, 8) + '...',
    favorites: favorites?.length || 0,
    vehicles: vehicles?.length || 0,
    builds: builds?.length || 0,
    ageMs: age,
  });
  
  // Import prefetch module and hydrate
  // We need to directly set the cache values in the prefetch module
  import('@/lib/prefetch').then(({ getPrefetchedData }) => {
    // The prefetch module exposes getPrefetchedData but not setters
    // We need to update the module to support SSR hydration
    // For now, we'll use a different approach - see below
  }).catch(err => {
    console.warn('[SSRDataProvider] Failed to import prefetch module:', err);
  });
  
  return true;
}

/**
 * SSR Data Provider Component
 * 
 * Wraps the app (or a subtree) and hydrates prefetch cache with SSR data.
 * Must be rendered BEFORE FavoritesProvider, OwnedVehiclesProvider, etc.
 * 
 * IMPORTANT: Hydration happens synchronously during render (not in useEffect)
 * to ensure data is available BEFORE child providers mount and check for cached data.
 * 
 * @param {Object} props
 * @param {Object} props.initialData - Data fetched during SSR
 * @param {React.ReactNode} props.children
 */
export function SSRDataProvider({ initialData, children }) {
  const hydrationRef = useRef(false);
  
  // Hydrate SYNCHRONOUSLY during render (not in useEffect!)
  // This ensures data is available before child components mount
  // Safe to do during render since we're only writing to sessionStorage/memory
  if (typeof window !== 'undefined' && initialData && !hydrationRef.current) {
    hydrationRef.current = true;
    
    try {
      const cacheData = {
        timestamp: initialData.fetchedAt || Date.now(),
        userId: initialData.user?.id || null,
        data: {
          favorites: initialData.favorites || null,
          vehicles: initialData.vehicles || null,
          builds: initialData.builds || null,
        },
      };
      
      sessionStorage.setItem('autorev_ssr_data', JSON.stringify(cacheData));
      console.log('[SSRDataProvider] SSR data stored in sessionStorage (sync)');
    } catch (err) {
      console.warn('[SSRDataProvider] Failed to store SSR data:', err);
    }
  }
  
  const contextValue = {
    hadSSRData: !!initialData?.user,
    fetchedAt: initialData?.fetchedAt || null,
  };
  
  return (
    <SSRDataContext.Provider value={contextValue}>
      {children}
    </SSRDataContext.Provider>
  );
}

/**
 * Get SSR data from sessionStorage
 * Called by providers to check for pre-fetched data
 * 
 * @param {string} type - 'favorites' | 'vehicles' | 'builds'
 * @param {string} userId - User ID to validate against
 * @returns {Array|null} - The data if found and valid, null otherwise
 */
export function getSSRData(type, userId) {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = sessionStorage.getItem('autorev_ssr_data');
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    
    // Validate user ID matches
    if (parsed.userId !== userId) {
      console.log('[SSRDataProvider] SSR data user mismatch, ignoring');
      return null;
    }
    
    // Check if data is fresh (< 30 seconds old for SSR data)
    const age = Date.now() - parsed.timestamp;
    if (age > 30000) {
      console.log('[SSRDataProvider] SSR data too old:', { ageMs: age });
      // Clear stale data
      sessionStorage.removeItem('autorev_ssr_data');
      return null;
    }
    
    const data = parsed.data?.[type];
    if (data) {
      console.log(`[SSRDataProvider] Using SSR data for ${type}:`, data.length);
      return data;
    }
    
    return null;
  } catch (err) {
    console.warn('[SSRDataProvider] Failed to read SSR data:', err);
    return null;
  }
}

/**
 * Clear SSR data from sessionStorage
 * Called after providers have consumed the data
 */
export function clearSSRData() {
  if (typeof window === 'undefined') return;
  
  try {
    sessionStorage.removeItem('autorev_ssr_data');
    console.log('[SSRDataProvider] SSR data cleared');
  } catch (err) {
    console.warn('[SSRDataProvider] Failed to clear SSR data:', err);
  }
}

export default SSRDataProvider;

