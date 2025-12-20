'use client';

/**
 * Compare Provider
 * 
 * React Context provider for managing car comparison list.
 * - Uses localStorage for the active comparison (temporary)
 * - Authenticated users can save comparisons to Supabase
 * 
 * @module components/providers/CompareProvider
 */

import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  loadCompare,
  saveCompare,
  extractCarForCompare,
  CompareActionTypes,
} from '@/lib/stores/compareStore';
import {
  fetchUserCompareLists,
  saveUserCompareList,
  deleteUserCompareList,
} from '@/lib/userDataService';

const MAX_COMPARE = 4;

/**
 * @typedef {Object} CompareCar
 * @property {string} slug
 * @property {string} name
 * @property {string} [years]
 * @property {number} [hp]
 * @property {string} [priceRange]
 */

/**
 * @typedef {Object} SavedCompareList
 * @property {string} id
 * @property {string} name
 * @property {string[]} carSlugs
 * @property {string[]} carNames
 * @property {string} createdAt
 */

/**
 * @typedef {Object} CompareState
 * @property {CompareCar[]} cars - Current comparison cars
 * @property {SavedCompareList[]} savedLists - Saved comparison lists (auth users)
 */

const CompareContext = createContext(null);

const defaultState = {
  cars: [],
  savedLists: [],
};

/**
 * Reducer for compare state
 */
function compareReducer(state, action) {
  switch (action.type) {
    case CompareActionTypes.SET:
      return { ...state, cars: action.payload };
    
    case CompareActionTypes.SET_SAVED_LISTS:
      return { ...state, savedLists: action.payload };
    
    case CompareActionTypes.ADD: {
      if (state.cars.some(c => c.slug === action.payload.slug)) {
        return state;
      }
      if (state.cars.length >= MAX_COMPARE) {
        return state;
      }
      const compareCar = extractCarForCompare(action.payload);
      return { ...state, cars: [...state.cars, compareCar] };
    }
    
    case CompareActionTypes.REMOVE:
      return {
        ...state,
        cars: state.cars.filter(c => c.slug !== action.payload),
      };
    
    case CompareActionTypes.CLEAR:
      return { ...state, cars: [] };
    
    case CompareActionTypes.HYDRATE:
      return { ...state, cars: action.payload?.cars || [] };
    
    default:
      return state;
  }
}

/**
 * Compare Provider Component
 */
export function CompareProvider({ children }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [state, dispatch] = useReducer(compareReducer, defaultState);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedState = loadCompare();
    dispatch({ type: CompareActionTypes.HYDRATE, payload: storedState });
    setIsHydrated(true);
  }, []);

  // Fetch saved lists when authenticated
  useEffect(() => {
    if (authLoading || !isHydrated) return;

    const fetchSavedLists = async () => {
      if (isAuthenticated && user?.id) {
        setIsLoading(true);
        
        try {
          const { data, error } = await fetchUserCompareLists(user.id);
          
          if (error) {
            console.error('[CompareProvider] Error fetching saved lists:', error);
          } else if (data) {
            const savedLists = data.map(list => ({
              id: list.id,
              name: list.name,
              carSlugs: list.car_slugs,
              carNames: list.car_names,
              createdAt: list.created_at,
            }));
            
            dispatch({ type: CompareActionTypes.SET_SAVED_LISTS, payload: savedLists });
          }
        } catch (err) {
          console.error('[CompareProvider] Error:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        // Clear saved lists when signed out
        dispatch({ type: CompareActionTypes.SET_SAVED_LISTS, payload: [] });
      }
    };

    fetchSavedLists();
  }, [isAuthenticated, user?.id, authLoading, isHydrated]);

  // Save to localStorage when cars change
  useEffect(() => {
    if (!isHydrated) return;
    saveCompare({ cars: state.cars });
  }, [state.cars, isHydrated]);

  /**
   * Add a car to compare
   */
  const addToCompare = useCallback((car) => {
    dispatch({ type: CompareActionTypes.ADD, payload: car });
  }, []);

  /**
   * Remove a car from compare
   */
  const removeFromCompare = useCallback((slug) => {
    dispatch({ type: CompareActionTypes.REMOVE, payload: slug });
  }, []);

  /**
   * Toggle a car in compare list
   */
  const toggleCompare = useCallback((car) => {
    const isIn = state.cars.some(c => c.slug === car.slug);
    if (isIn) {
      removeFromCompare(car.slug);
    } else {
      addToCompare(car);
    }
  }, [state.cars, addToCompare, removeFromCompare]);

  /**
   * Check if a car is in compare
   */
  const checkIsInCompare = useCallback((slug) => {
    return state.cars.some(c => c.slug === slug);
  }, [state.cars]);

  /**
   * Clear all cars from compare
   */
  const clearAll = useCallback(() => {
    dispatch({ type: CompareActionTypes.CLEAR });
  }, []);

  /**
   * Save current comparison as a list (authenticated users only)
   */
  const saveCurrentComparison = useCallback(async (name = 'My Comparison') => {
    if (!isAuthenticated || !user?.id || state.cars.length === 0) {
      return { error: new Error('Cannot save comparison') };
    }

    const { data, error } = await saveUserCompareList(user.id, {
      name,
      cars: state.cars,
    });

    if (!error && data) {
      const newList = {
        id: data.id,
        name: data.name,
        carSlugs: data.car_slugs,
        carNames: data.car_names,
        createdAt: data.created_at,
      };
      
      dispatch({ 
        type: CompareActionTypes.SET_SAVED_LISTS, 
        payload: [newList, ...state.savedLists] 
      });
    }

    return { data, error };
  }, [isAuthenticated, user?.id, state.cars, state.savedLists]);

  /**
   * Delete a saved comparison list
   */
  const deleteSavedList = useCallback(async (listId) => {
    if (!isAuthenticated || !user?.id) {
      return { error: new Error('Not authenticated') };
    }

    const { error } = await deleteUserCompareList(user.id, listId);

    if (!error) {
      dispatch({ 
        type: CompareActionTypes.SET_SAVED_LISTS, 
        payload: state.savedLists.filter(l => l.id !== listId) 
      });
    }

    return { error };
  }, [isAuthenticated, user?.id, state.savedLists]);

  /**
   * Load a saved comparison into the current compare list
   */
  const loadSavedList = useCallback((list) => {
    // This would need to fetch full car data from the slugs
    // For now, we just set the slugs/names
    // TODO: Implementation would require fetching car data from slugs
  }, []);

  /**
   * Set cars and open the compare modal (for AL integration)
   * @param {CompareCar[]} cars - Array of cars to compare
   */
  const openCompareWithCars = useCallback((cars) => {
    // Clear existing and set new cars
    dispatch({ type: CompareActionTypes.CLEAR });
    cars.forEach(car => {
      dispatch({ type: CompareActionTypes.ADD, payload: car });
    });
    // Open the modal
    setShowCompareModal(true);
  }, []);

  const value = {
    // Current comparison
    cars: state.cars,
    count: state.cars.length,
    maxCars: MAX_COMPARE,
    isFull: state.cars.length >= MAX_COMPARE,
    isHydrated,
    isLoading,
    
    // Actions for current comparison
    addToCompare,
    removeFromCompare,
    toggleCompare,
    isInCompare: checkIsInCompare,
    clearAll,
    
    // Modal control (for global access from AL, etc.)
    showCompareModal,
    setShowCompareModal,
    openCompareWithCars,
    
    // Saved lists (auth users only)
    savedLists: state.savedLists,
    saveCurrentComparison,
    deleteSavedList,
    loadSavedList,
    canSave: isAuthenticated && state.cars.length > 0,
  };

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
}

/**
 * Hook to access compare context
 * @returns {CompareContextValue}
 */
export function useCompare() {
  const context = useContext(CompareContext);
  
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  
  return context;
}

/**
 * Hook to check if a specific car is in compare
 * @param {string} slug 
 * @returns {boolean}
 */
export function useIsInCompare(slug) {
  const { isInCompare, isHydrated } = useCompare();
  return isHydrated ? isInCompare(slug) : false;
}

/**
 * Hook to get compare count
 * @returns {number}
 */
export function useCompareCount() {
  const { count } = useCompare();
  return count;
}

export default CompareProvider;
