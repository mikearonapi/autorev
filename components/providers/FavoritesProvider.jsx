'use client';

/**
 * Favorites Provider
 * 
 * React Context provider for managing favorite cars.
 * - Uses Supabase for authenticated users
 * - Falls back to localStorage for guests
 * - Syncs localStorage favorites to Supabase on sign in
 * 
 * @module components/providers/FavoritesProvider
 */

import { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  loadFavorites,
  saveFavorites,
  extractCarForFavorites,
  FavoriteActionTypes,
} from '@/lib/stores/favoritesStore';
import {
  fetchUserFavorites,
  addUserFavorite,
  removeUserFavorite,
  syncFavoritesToSupabase,
} from '@/lib/userDataService';
import { getPrefetchedData } from '@/lib/prefetch';
import { useLoadingProgress } from './LoadingProgressProvider';
import { trackFavorite, trackUnfavorite } from '@/lib/activityTracker';

/**
 * @typedef {Object} FavoriteCar
 * @property {string} slug
 * @property {string} name
 * @property {string} [years]
 * @property {number} [hp]
 * @property {string} [priceRange]
 * @property {string} [tier]
 * @property {string} [category]
 * @property {string} [imageHeroUrl] - Hero image URL for consistent thumbnails
 * @property {number} [zeroToSixty] - 0-60 time in seconds
 * @property {number} [curbWeight] - Curb weight in kg
 */

/**
 * @typedef {Object} FavoritesState
 * @property {FavoriteCar[]} favorites
 */

/**
 * @typedef {Object} FavoritesContextValue
 * @property {FavoriteCar[]} favorites
 * @property {number} count
 * @property {boolean} isHydrated
 * @property {boolean} isLoading
 * @property {function(Object): void} addFavorite
 * @property {function(string): void} removeFavorite
 * @property {function(Object): void} toggleFavorite
 * @property {function(string): boolean} isFavorite
 * @property {function(): void} clearAll
 */

const FavoritesContext = createContext(null);

const defaultState = {
  favorites: [],
};

/**
 * Reducer for favorites state
 */
function favoritesReducer(state, action) {
  switch (action.type) {
    case FavoriteActionTypes.SET:
      return { favorites: action.payload };
    
    case FavoriteActionTypes.ADD: {
      if (state.favorites.some(f => f.slug === action.payload.slug)) {
        return state;
      }
      const newFavorite = extractCarForFavorites(action.payload);
      return { favorites: [newFavorite, ...state.favorites] };
    }
    
    case FavoriteActionTypes.REMOVE:
      return {
        favorites: state.favorites.filter(f => f.slug !== action.payload),
      };
    
    case FavoriteActionTypes.CLEAR:
      return { favorites: [] };
    
    case FavoriteActionTypes.HYDRATE:
      return action.payload || defaultState;
    
    default:
      return state;
  }
}

/**
 * Favorites Provider Component
 */
export function FavoritesProvider({ children }) {
  const { user, isAuthenticated, isLoading: authLoading, isDataFetchReady, refreshSession } = useAuth();
  const { markComplete, markStarted, markFailed } = useLoadingProgress();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [state, dispatch] = useReducer(favoritesReducer, defaultState);
  const syncedRef = useRef(false);
  const lastUserIdRef = useRef(null);

  // Hydrate from localStorage initially (for SSR/guest users)
  useEffect(() => {
    const storedState = loadFavorites();
    dispatch({ type: FavoriteActionTypes.HYDRATE, payload: storedState });
    setIsHydrated(true);
  }, []);

  /**
   * Fetch favorites from server
   * Extracted so it can be used as a retry callback
   * @param {string} userId - User ID to fetch favorites for
   * @param {number} timeout - Timeout in ms (default 8000)
   */
  const fetchFavorites = useCallback(async (userId, timeout = 8000) => {
    console.log('[FavoritesProvider] Fetching favorites for user:', userId?.slice(0, 8) + '...');
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('[FavoritesProvider] Fetch timeout after', timeout, 'ms');
      controller.abort();
    }, timeout);
    
    try {
      // If we have local favorites and haven't synced yet, sync them
      const localFavorites = loadFavorites().favorites;
      
      if (localFavorites.length > 0 && !syncedRef.current) {
        // Fire-and-forget sync - don't block on this
        syncFavoritesToSupabase(userId, localFavorites).catch(err => 
          console.warn('[FavoritesProvider] Background sync error:', err)
        );
      }

      // OPTIMIZATION: Check for prefetched data first
      const prefetchedFavorites = getPrefetchedData('favorites', userId);
      let data, error;
      
      if (prefetchedFavorites) {
        console.log('[FavoritesProvider] Using prefetched data');
        data = prefetchedFavorites;
        error = null;
      } else {
        // Fetch favorites from Supabase with timeout
        const fetchPromise = fetchUserFavorites(userId);
        const timeoutPromise = new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('Request timed out'));
          });
        });
        
        const result = await Promise.race([fetchPromise, timeoutPromise]);
        data = result.data;
        error = result.error;
      }
      
      // Clear timeout since fetch completed
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('[FavoritesProvider] Error fetching favorites:', error);
        
        // Handle 401 errors by triggering session refresh
        if (error.status === 401 || error.message?.includes('JWT') || error.message?.includes('session')) {
          console.warn('[FavoritesProvider] Auth error, attempting session refresh...');
          try {
            await refreshSession?.();
          } catch (refreshErr) {
            console.error('[FavoritesProvider] Session refresh failed:', refreshErr);
          }
        }
        
        // Mark as failed with error message
        markFailed('favorites', error.message || 'Failed to load favorites');
        return;
      }
      
      if (data) {
        // Transform Supabase data to our format
        const favorites = data.map(f => ({
          slug: f.car_slug,
          name: f.car_name,
          years: f.car_years,
          hp: f.car_hp,
          priceRange: f.car_price_range,
          addedAt: new Date(f.created_at).getTime(),
        }));
        
        console.log('[FavoritesProvider] Fetched', favorites.length, 'favorites');
        dispatch({ type: FavoriteActionTypes.SET, payload: favorites });
        syncedRef.current = true;
      }
      
      // Mark as complete on success
      markComplete('favorites');
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[FavoritesProvider] Sync error:', err);
      const errorMessage = err.message === 'Request timed out' 
        ? 'Request timed out - please try again' 
        : err.message || 'Unexpected error loading favorites';
      markFailed('favorites', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [markComplete, markFailed, refreshSession]);

  // When user ID becomes available AND data fetch is ready, fetch data
  // IMPORTANT: Wait for isDataFetchReady to avoid race conditions with prefetch
  useEffect(() => {
    // Skip if not hydrated yet
    if (!isHydrated) return;

    const handleAuthChange = async () => {
      const currentUserId = user?.id || null;
      const wasAuthenticated = lastUserIdRef.current !== null;
      const isNowAuthenticated = isAuthenticated && currentUserId;
      
      // Detect auth recovery: was not authenticated, now is
      const isAuthRecovery = !wasAuthenticated && isNowAuthenticated;
      
      // Track the current user ID for next comparison
      lastUserIdRef.current = isNowAuthenticated ? currentUserId : null;
      
      if (isNowAuthenticated) {
        // IMPORTANT: Wait for AuthProvider to signal that prefetch is complete
        // This prevents race conditions where we start fetching before prefetch data is ready
        if (!isDataFetchReady) {
          console.log('[FavoritesProvider] Waiting for isDataFetchReady...');
          return;
        }
        
        // Only skip if we've already synced for THIS user AND not recovering
        if (syncedRef.current && wasAuthenticated && !isAuthRecovery) {
          console.log('[FavoritesProvider] Already synced for user, skipping fetch');
          return;
        }
        
        // OPTIMIZATION: Show loading only if we don't have cached data
        // This implements stale-while-revalidate pattern
        if (state.favorites.length === 0) {
          setIsLoading(true);
        }
        
        // Mark step as started with retry callback
        markStarted('favorites', () => fetchFavorites(currentUserId));
        
        // Fetch favorites (will use prefetched data if available)
        await fetchFavorites(currentUserId);
      } else if (!authLoading && isDataFetchReady) {
        // Only reset on explicit logout (authLoading false + no user)
        // This prevents flickering during auth recovery
        console.log('[FavoritesProvider] Not authenticated, clearing user data and loading from localStorage');
        console.log('[FavoritesProvider] Auth state:', { isAuthenticated, authLoading, isDataFetchReady, userId: user?.id });
        syncedRef.current = false;
        const storedState = loadFavorites();
        console.log('[FavoritesProvider] Local favorites count:', storedState?.favorites?.length || 0);
        dispatch({ type: FavoriteActionTypes.HYDRATE, payload: storedState });
        // Always mark as complete
        markComplete('favorites');
      } else {
        // Debug: Log why we didn't clear
        console.log('[FavoritesProvider] Auth change - no action taken:', { 
          isAuthenticated, 
          authLoading, 
          isDataFetchReady,
          isNowAuthenticated,
          userId: user?.id 
        });
      }
    };

    handleAuthChange();
  }, [isAuthenticated, user?.id, authLoading, isHydrated, isDataFetchReady, state.favorites.length, markComplete, markStarted, fetchFavorites]);

  // Save to localStorage when state changes (for guests only)
  // IMPORTANT: We track the previous auth state to avoid saving user data to localStorage
  // during the logout transition (race condition where save effect fires before clear effect)
  const wasAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    if (!isHydrated) return;
    
    // If user just logged out (was authenticated, now isn't), clear localStorage 
    // instead of saving - this prevents the race condition where user data gets saved
    if (wasAuthenticatedRef.current && !isAuthenticated) {
      console.log('[FavoritesProvider] User logged out - clearing localStorage');
      saveFavorites({ favorites: [] }); // Clear instead of saving stale user data
      wasAuthenticatedRef.current = false;
      return;
    }
    
    wasAuthenticatedRef.current = isAuthenticated;
    
    // Only save to localStorage if not authenticated
    if (!isAuthenticated) {
      saveFavorites(state);
    }
  }, [state, isHydrated, isAuthenticated]);

  /**
   * Add a car to favorites
   */
  const addFavorite = useCallback(async (car) => {
    // Optimistic update
    dispatch({ type: FavoriteActionTypes.ADD, payload: car });

    // Track activity (fire-and-forget)
    trackFavorite(car.slug, car.name, user?.id);

    // If authenticated, save to Supabase
    if (isAuthenticated && user?.id) {
      const { error } = await addUserFavorite(user.id, car);
      if (error) {
        console.error('[FavoritesProvider] Error adding favorite:', error);
        // Could revert optimistic update here if needed
      }
    }
  }, [isAuthenticated, user?.id]);

  /**
   * Remove a car from favorites
   */
  const removeFavorite = useCallback(async (slug) => {
    // Optimistic update
    dispatch({ type: FavoriteActionTypes.REMOVE, payload: slug });

    // Track activity (fire-and-forget)
    trackUnfavorite(slug, user?.id);

    // If authenticated, remove from Supabase
    if (isAuthenticated && user?.id) {
      const { error } = await removeUserFavorite(user.id, slug);
      if (error) {
        console.error('[FavoritesProvider] Error removing favorite:', error);
      }
    }
  }, [isAuthenticated, user?.id]);

  /**
   * Toggle a car's favorite status
   */
  const toggleFavorite = useCallback((car) => {
    const isFav = state.favorites.some(f => f.slug === car.slug);
    if (isFav) {
      removeFavorite(car.slug);
    } else {
      addFavorite(car);
    }
  }, [state.favorites, addFavorite, removeFavorite]);

  /**
   * Check if a car is favorited
   */
  const isFavorite = useCallback((slug) => {
    return state.favorites.some(f => f.slug === slug);
  }, [state.favorites]);

  /**
   * Clear all favorites
   */
  const clearAll = useCallback(async () => {
    dispatch({ type: FavoriteActionTypes.CLEAR });

    // If authenticated, we'd need to clear from Supabase
    // For now, just clear local state
    if (!isAuthenticated) {
      saveFavorites({ favorites: [] });
    }
  }, [isAuthenticated]);

  const value = {
    favorites: state.favorites,
    count: state.favorites.length,
    isHydrated,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearAll,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

/**
 * Hook to access favorites context
 * @returns {FavoritesContextValue}
 */
export function useFavorites() {
  const context = useContext(FavoritesContext);
  
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  
  return context;
}

/**
 * Hook to check if a specific car is favorited
 * @param {string} slug
 * @returns {boolean}
 */
export function useIsFavorite(slug) {
  const { isFavorite, isHydrated } = useFavorites();
  return isHydrated ? isFavorite(slug) : false;
}

/**
 * Hook to get favorite count
 * @returns {number}
 */
export function useFavoriteCount() {
  const { count } = useFavorites();
  return count;
}

export default FavoritesProvider;
