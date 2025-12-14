'use client';

/**
 * Owned Vehicles Provider
 * 
 * React Context provider for managing user's owned vehicles.
 * These are actual vehicles the user owns, with maintenance tracking,
 * service history, and personalized recommendations.
 * 
 * - Uses Supabase for authenticated users
 * - Falls back to localStorage for guests (for testing/demo purposes)
 * - Syncs localStorage vehicles to Supabase on sign in
 * 
 * @module components/providers/OwnedVehiclesProvider
 */

import { createContext, useContext, useReducer, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  fetchUserVehicles,
  addUserVehicle,
  updateUserVehicle,
  deleteUserVehicle,
} from '@/lib/userDataService';

// LocalStorage key for guest vehicles
const STORAGE_KEY = 'autorev_owned_vehicles';

/**
 * Load vehicles from localStorage
 */
function loadLocalVehicles() {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.warn('[OwnedVehiclesProvider] Failed to load local vehicles:', err);
  }
  return [];
}

/**
 * Save vehicles to localStorage
 */
function saveLocalVehicles(vehicles) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
  } catch (err) {
    console.warn('[OwnedVehiclesProvider] Failed to save local vehicles:', err);
  }
}

/**
 * @typedef {Object} OwnedVehicle
 * @property {string} id - UUID
 * @property {string} [vin] - Vehicle Identification Number
 * @property {number} year - Model year
 * @property {string} make - Manufacturer
 * @property {string} model - Model name
 * @property {string} [trim] - Trim level
 * @property {string} [matchedCarSlug] - Link to cars table if in our database
 * @property {string} [nickname] - User's name for the car
 * @property {string} [color] - Vehicle color
 * @property {number} [mileage] - Current odometer reading
 * @property {string} [purchaseDate] - When purchased
 * @property {number} [purchasePrice] - Purchase price
 * @property {boolean} isPrimary - Is this the user's primary vehicle
 * @property {string} ownershipStatus - 'owned' | 'sold' | 'shopping'
 * @property {string} [notes] - User notes
 * @property {Object} [vinDecodeData] - Cached VIN decode data
 * @property {string} createdAt - When added
 * @property {string} updatedAt - Last modified
 */

/**
 * @typedef {Object} OwnedVehiclesState
 * @property {OwnedVehicle[]} vehicles - Array of owned vehicles
 */

const OwnedVehiclesContext = createContext(null);

const ActionTypes = {
  SET: 'SET_VEHICLES',
  ADD: 'ADD_VEHICLE',
  UPDATE: 'UPDATE_VEHICLE',
  REMOVE: 'REMOVE_VEHICLE',
  HYDRATE: 'HYDRATE_VEHICLES',
};

const defaultState = {
  vehicles: [],
};

/**
 * Transform Supabase row to client format
 */
function transformVehicle(row) {
  return {
    id: row.id,
    vin: row.vin,
    year: row.year,
    make: row.make,
    model: row.model,
    trim: row.trim,
    matchedCarSlug: row.matched_car_slug,
    matchedCarVariantId: row.matched_car_variant_id,
    matchedCarVariantKey: row.matched_car_variant_key,
    vinMatchConfidence: row.vin_match_confidence,
    vinMatchNotes: row.vin_match_notes,
    vinMatchedAt: row.vin_matched_at,
    nickname: row.nickname,
    color: row.color,
    mileage: row.mileage,
    purchaseDate: row.purchase_date,
    purchasePrice: row.purchase_price,
    isPrimary: row.is_primary,
    ownershipStatus: row.ownership_status,
    notes: row.notes,
    vinDecodeData: row.vin_decode_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Reducer for vehicles state
 */
function vehiclesReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET:
      return { vehicles: action.payload };
    
    case ActionTypes.ADD:
      return { vehicles: [action.payload, ...state.vehicles] };
    
    case ActionTypes.UPDATE:
      return {
        vehicles: state.vehicles.map(v => 
          v.id === action.payload.id ? { ...v, ...action.payload } : v
        ),
      };
    
    case ActionTypes.REMOVE:
      return {
        vehicles: state.vehicles.filter(v => v.id !== action.payload),
      };
    
    case ActionTypes.HYDRATE:
      return action.payload || defaultState;
    
    default:
      return state;
  }
}

/**
 * Owned Vehicles Provider Component
 */
export function OwnedVehiclesProvider({ children }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [state, dispatch] = useReducer(vehiclesReducer, defaultState);
  const syncedRef = useRef(false);

  // Hydrate from localStorage initially (for SSR/guest users)
  useEffect(() => {
    const localVehicles = loadLocalVehicles();
    dispatch({ type: ActionTypes.SET, payload: localVehicles });
    setIsHydrated(true);
  }, []);

  // When auth state changes, handle sync
  useEffect(() => {
    if (authLoading || !isHydrated) return;

    const handleAuthChange = async () => {
      if (isAuthenticated && user?.id) {
        setIsLoading(true);
        
        try {
          // If we have local vehicles and haven't synced yet, we could sync them
          // For now, just fetch from Supabase
          const { data, error } = await fetchUserVehicles(user.id);
          
          if (error) {
            console.error('[OwnedVehiclesProvider] Error fetching vehicles:', error);
          } else if (data) {
            const vehicles = data.map(transformVehicle);
            dispatch({ type: ActionTypes.SET, payload: vehicles });
            syncedRef.current = true;
          }
        } catch (err) {
          console.error('[OwnedVehiclesProvider] Error:', err);
        } finally {
          setIsLoading(false);
        }
      } else {
        // User signed out or not authenticated - reload from localStorage
        syncedRef.current = false;
        const localVehicles = loadLocalVehicles();
        dispatch({ type: ActionTypes.SET, payload: localVehicles });
      }
    };

    handleAuthChange();
  }, [isAuthenticated, user?.id, authLoading, isHydrated]);

  // Save to localStorage when state changes (for guests)
  useEffect(() => {
    if (!isHydrated) return;
    
    // Only save to localStorage if not authenticated
    if (!isAuthenticated) {
      saveLocalVehicles(state.vehicles);
    }
  }, [state.vehicles, isHydrated, isAuthenticated]);

  /**
   * Add a new vehicle
   */
  const addVehicle = useCallback(async (vehicle) => {
    // If authenticated, save to Supabase
    if (isAuthenticated && user?.id) {
      setIsLoading(true);
      const { data, error } = await addUserVehicle(user.id, vehicle);
      setIsLoading(false);

      if (!error && data) {
        const transformed = transformVehicle(data);
        dispatch({ type: ActionTypes.ADD, payload: transformed });

        // Best-effort: resolve a precise car_variant for this vehicle (even without VIN).
        // This makes downstream fitment/maintenance/recalls much more accurate.
        try {
          const res = await fetch('/api/vin/resolve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              decoded: {
                success: true,
                year: transformed.year,
                make: transformed.make,
                model: transformed.model,
                trim: transformed.trim,
                driveType: null,
                transmission: null,
              },
            }),
          });
          const json = await res.json();
          const match = json?.match || null;
          if (match?.carVariantId) {
            // Only accept carSlug overwrite if we don't already have one.
            const nextCarSlug = transformed.matchedCarSlug || match.carSlug;
            // If we *do* have a matchedCarSlug, ensure the resolver agrees before applying variant.
            const canApplyVariant = !transformed.matchedCarSlug || transformed.matchedCarSlug === match.carSlug;
            if (canApplyVariant) {
              const { data: updatedRow, error: updErr } = await updateUserVehicle(user.id, transformed.id, {
                matched_car_slug: nextCarSlug,
                matched_car_variant_id: match.carVariantId,
                matched_car_variant_key: match.carVariantKey,
                vin_match_confidence: match.confidence,
                vin_match_notes: Array.isArray(match.reasons) ? match.reasons.join(', ') : null,
                vin_matched_at: new Date().toISOString(),
              });
              if (!updErr && updatedRow) {
                dispatch({ type: ActionTypes.UPDATE, payload: transformVehicle(updatedRow) });
              }
            }
          }
        } catch (err) {
          console.warn('[OwnedVehiclesProvider] VIN/variant auto-resolve failed:', err);
        }

        return { data: transformed, error: null };
      }

      return { data: null, error };
    }

    // Not authenticated - save to localStorage
    const localVehicle = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vin: vehicle.vin,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      matchedCarSlug: vehicle.matchedCarSlug,
      nickname: vehicle.nickname,
      color: vehicle.color,
      mileage: vehicle.mileage,
      purchaseDate: vehicle.purchaseDate,
      purchasePrice: vehicle.purchasePrice,
      isPrimary: vehicle.isPrimary || false,
      ownershipStatus: vehicle.ownershipStatus || 'owned',
      notes: vehicle.notes,
      vinDecodeData: vehicle.vinDecodeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch({ type: ActionTypes.ADD, payload: localVehicle });
    return { data: localVehicle, error: null };
  }, [isAuthenticated, user?.id]);

  /**
   * Update an existing vehicle
   */
  const updateVehicle = useCallback(async (vehicleId, updates) => {
    // If authenticated, update in Supabase
    if (isAuthenticated && user?.id) {
      // Transform client format to database format
      const dbUpdates = {
        vin: updates.vin,
        year: updates.year,
        make: updates.make,
        model: updates.model,
        trim: updates.trim,
        matched_car_slug: updates.matchedCarSlug,
        matched_car_variant_id: updates.matchedCarVariantId,
        matched_car_variant_key: updates.matchedCarVariantKey,
        vin_match_confidence: updates.vinMatchConfidence,
        vin_match_notes: updates.vinMatchNotes,
        vin_matched_at: updates.vinMatchedAt,
        nickname: updates.nickname,
        color: updates.color,
        mileage: updates.mileage,
        purchase_date: updates.purchaseDate,
        purchase_price: updates.purchasePrice,
        is_primary: updates.isPrimary,
        ownership_status: updates.ownershipStatus,
        notes: updates.notes,
        vin_decode_data: updates.vinDecodeData,
        vin_decoded_at: updates.vinDecodeData ? new Date().toISOString() : undefined,
      };

      // Remove undefined values
      Object.keys(dbUpdates).forEach(key => {
        if (dbUpdates[key] === undefined) {
          delete dbUpdates[key];
        }
      });

      const { data, error } = await updateUserVehicle(user.id, vehicleId, dbUpdates);

      if (!error && data) {
        const transformed = transformVehicle(data);
        dispatch({ type: ActionTypes.UPDATE, payload: transformed });
        return { data: transformed, error: null };
      }

      return { data: null, error };
    }

    // Not authenticated - update in localStorage
    const updatedVehicle = {
      id: vehicleId,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: ActionTypes.UPDATE, payload: updatedVehicle });
    return { data: updatedVehicle, error: null };
  }, [isAuthenticated, user?.id]);

  /**
   * Remove a vehicle
   */
  const removeVehicle = useCallback(async (vehicleId) => {
    // If authenticated, remove from Supabase
    if (isAuthenticated && user?.id) {
      const { error } = await deleteUserVehicle(user.id, vehicleId);

      if (!error) {
        dispatch({ type: ActionTypes.REMOVE, payload: vehicleId });
      }

      return { error };
    }

    // Not authenticated - remove from localStorage
    dispatch({ type: ActionTypes.REMOVE, payload: vehicleId });
    return { error: null };
  }, [isAuthenticated, user?.id]);

  /**
   * Get primary vehicle
   */
  const getPrimaryVehicle = useCallback(() => {
    return state.vehicles.find(v => v.isPrimary) || state.vehicles[0] || null;
  }, [state.vehicles]);

  /**
   * Set a vehicle as primary
   */
  const setPrimaryVehicle = useCallback(async (vehicleId) => {
    // First, unset current primary
    const currentPrimary = state.vehicles.find(v => v.isPrimary);
    if (currentPrimary && currentPrimary.id !== vehicleId) {
      await updateVehicle(currentPrimary.id, { isPrimary: false });
    }
    
    // Set new primary
    return updateVehicle(vehicleId, { isPrimary: true });
  }, [state.vehicles, updateVehicle]);

  const value = {
    vehicles: state.vehicles,
    count: state.vehicles.length,
    isHydrated,
    isLoading,
    addVehicle,
    updateVehicle,
    removeVehicle,
    getPrimaryVehicle,
    setPrimaryVehicle,
  };

  return (
    <OwnedVehiclesContext.Provider value={value}>
      {children}
    </OwnedVehiclesContext.Provider>
  );
}

/**
 * Hook to access owned vehicles context
 */
export function useOwnedVehicles() {
  const context = useContext(OwnedVehiclesContext);
  
  if (!context) {
    throw new Error('useOwnedVehicles must be used within an OwnedVehiclesProvider');
  }
  
  return context;
}

/**
 * Hook to get vehicle count
 */
export function useOwnedVehicleCount() {
  const { count } = useOwnedVehicles();
  return count;
}

export default OwnedVehiclesProvider;
