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
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
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

  // When user ID becomes available, fetch data immediately
  // OPTIMIZATION: Don't wait for authLoading - start fetching as soon as we have user.id
  // This enables parallel loading with other providers
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
        console.log('[FavoritesProvider] Fetching favorites for user:', currentUserId?.slice(0, 8) + '...');
        
        try {
          // If we have local favorites and haven't synced yet, sync them
          const localFavorites = loadFavorites().favorites;
          
          if (localFavorites.length > 0 && !syncedRef.current) {
            // Fire-and-forget sync - don't block on this
            syncFavoritesToSupabase(currentUserId, localFavorites).catch(err => 
              console.warn('[FavoritesProvider] Background sync error:', err)
            );
          }

          // OPTIMIZATION: Check for prefetched data first
          const prefetchedFavorites = getPrefetchedData('favorites', currentUserId);
          let data, error;
          
          if (prefetchedFavorites) {
            console.log('[FavoritesProvider] Using prefetched data');
            data = prefetchedFavorites;
            error = null;
          } else {
            // Fetch favorites from Supabase
            const result = await fetchUserFavorites(currentUserId);
            data = result.data;
            error = result.error;
          }
          
          if (error) {
            console.error('[FavoritesProvider] Error fetching favorites:', error);
          } else if (data) {
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
        } catch (err) {
          console.error('[FavoritesProvider] Sync error:', err);
        } finally {
          setIsLoading(false);
        }
      } else if (!authLoading) {
        // Only reset on explicit logout (authLoading false + no user)
        // This prevents flickering during auth recovery
        console.log('[FavoritesProvider] Not authenticated, loading from localStorage');
        syncedRef.current = false;
        const storedState = loadFavorites();
        dispatch({ type: FavoriteActionTypes.HYDRATE, payload: storedState });
      }
    };

    handleAuthChange();
  }, [isAuthenticated, user?.id, authLoading, isHydrated, state.favorites.length]);

  // Save to localStorage when state changes (for guests)
  useEffect(() => {
    if (!isHydrated) return;
    
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
