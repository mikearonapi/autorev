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

  // Hydrate from localStorage initially (for SSR/guest users)
  useEffect(() => {
    const storedState = loadFavorites();
    dispatch({ type: FavoriteActionTypes.HYDRATE, payload: storedState });
    setIsHydrated(true);
  }, []);

  // When auth state changes, handle sync
  useEffect(() => {
    if (authLoading || !isHydrated) return;

    const handleAuthChange = async () => {
      if (isAuthenticated && user?.id) {
        setIsLoading(true);
        
        try {
          // If we have local favorites and haven't synced yet, sync them
          const localFavorites = loadFavorites().favorites;
          
          if (localFavorites.length > 0 && !syncedRef.current) {
            await syncFavoritesToSupabase(user.id, localFavorites);
            syncedRef.current = true;
          }

          // Fetch favorites from Supabase
          const { data, error } = await fetchUserFavorites(user.id);
          
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
            
            dispatch({ type: FavoriteActionTypes.SET, payload: favorites });
          }
        } catch (err) {
          console.error('[FavoritesProvider] Sync error:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        // User signed out - reload from localStorage
        syncedRef.current = false;
        const storedState = loadFavorites();
        dispatch({ type: FavoriteActionTypes.HYDRATE, payload: storedState });
      }
    };

    handleAuthChange();
  }, [isAuthenticated, user?.id, authLoading, isHydrated]);

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
