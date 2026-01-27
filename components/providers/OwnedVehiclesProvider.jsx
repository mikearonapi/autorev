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

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react';

import { useAuth } from '@/components/providers/AuthProvider';
import { getPrefetchedData, invalidatePrefetchCache } from '@/lib/prefetch';
import {
  fetchUserVehicles,
  addUserVehicle,
  updateUserVehicle,
  deleteUserVehicle,
  applyVehicleModifications,
  clearVehicleModifications,
  applyBuildToVehicle,
  updateVehicleCustomSpecs,
  updateVehicleCustomSpecsSection,
  clearVehicleCustomSpecs,
} from '@/lib/userDataService';

import { useLoadingProgress } from './LoadingProgressProvider';

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
 * @property {string[]} [installedModifications] - Array of upgrade keys installed on this vehicle
 * @property {string} [activeBuildId] - FK to user_projects if mods came from a build
 * @property {number} [totalHpGain] - @deprecated STALE! Use useVehiclePerformance(vehicle, car) hook instead
 * @property {string} [modifiedAt] - When modifications were last updated
 * @property {boolean} isModified - Computed: whether vehicle has any mods
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
 * Sort vehicles by display order
 * - Vehicles with displayOrder > 0 come first (user's custom order)
 * - Vehicles with displayOrder = 0 come after (sorted by createdAt, newest first)
 */
function sortVehiclesByDisplayOrder(vehicles) {
  return [...vehicles].sort((a, b) => {
    // Both have custom order (displayOrder > 0)
    if (a.displayOrder > 0 && b.displayOrder > 0) {
      return a.displayOrder - b.displayOrder;
    }
    // Only a has custom order - a comes first
    if (a.displayOrder > 0) return -1;
    // Only b has custom order - b comes first
    if (b.displayOrder > 0) return 1;
    // Neither has custom order - sort by createdAt descending (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

/**
 * Transform Supabase row to client format
 */
function transformVehicle(row) {
  const installedMods = row.installed_modifications || [];
  const customSpecs = row.custom_specs || {};
  const enrichment = row.daily_driver_enrichments;

  return {
    id: row.id,
    vin: row.vin,
    year: row.year,
    make: row.make,
    model: row.model,
    trim: row.trim,
    matchedCarSlug: row.matched_car_slug,
    matchedCarId: row.matched_car_id, // UUID for reliable car lookups
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
    // Modification fields
    installedModifications: installedMods,
    activeBuildId: row.active_build_id,
    // @deprecated - DO NOT USE totalHpGain for display! This value is stale.
    // Always calculate HP dynamically using useVehiclePerformance hook:
    //   import { useVehiclePerformance } from '@/hooks/useVehiclePerformance';
    //   const { hpGain, finalHp } = useVehiclePerformance(vehicle, car);
    // See docs/SOURCE_OF_TRUTH.md Rule 4 and "Performance Calculations" section.
    totalHpGain: row.total_hp_gain || 0, // DEPRECATED - use useVehiclePerformance hook
    _cachedHpGain: row.total_hp_gain || 0, // Internal alias
    modifiedAt: row.modified_at,
    isModified: Array.isArray(installedMods) && installedMods.length > 0,
    // Custom specs (user-specific modification details)
    customSpecs: customSpecs,
    hasCustomSpecs: Object.keys(customSpecs).length > 0,
    // Daily driver enrichment data
    enrichmentId: row.enrichment_id,
    enrichmentStatus: row.enrichment_status || 'none',
    enrichment: enrichment
      ? {
          id: enrichment.id,
          maintenanceSpecs: enrichment.maintenance_specs,
          serviceIntervals: enrichment.service_intervals,
          knownIssues: enrichment.known_issues,
          imageUrl: enrichment.image_url,
          status: enrichment.status,
        }
      : null,
    // Display order for custom garage sorting
    displayOrder: row.display_order ?? 0,
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
        vehicles: state.vehicles.map((v) =>
          v.id === action.payload.id ? { ...v, ...action.payload } : v
        ),
      };

    case ActionTypes.REMOVE:
      return {
        vehicles: state.vehicles.filter((v) => v.id !== action.payload),
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
  const {
    user,
    isAuthenticated,
    isLoading: authLoading,
    isDataFetchReady,
    refreshSession,
  } = useAuth();
  const { markComplete, markStarted, markFailed } = useLoadingProgress();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // OPTIMISTIC LOAD: Initialize reducer with localStorage data synchronously
  // This makes guest vehicles visible immediately on page load (like FavoritesProvider)
  const [state, dispatch] = useReducer(vehiclesReducer, null, () => {
    // Use lazy initializer to read localStorage once during mount
    // This is SSR-safe because loadLocalVehicles() checks typeof window
    const localVehicles = loadLocalVehicles();
    return { vehicles: localVehicles };
  });

  const syncedRef = useRef(false);
  const lastUserIdRef = useRef(null);

  // Mark as hydrated immediately since we loaded synchronously
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  /**
   * Fetch vehicles from server
   * Extracted so it can be used as a retry callback
   * @param {string} userId - User ID to fetch vehicles for
   * @param {number} timeout - Timeout in ms (default 4000 - reduced for faster failures)
   */
  const fetchVehicles = useCallback(
    async (userId, timeout = 4000) => {
      console.log(
        '[OwnedVehiclesProvider] Fetching vehicles for user:',
        userId?.slice(0, 8) + '...'
      );

      // OPTIMIZATION: Check for prefetched data FIRST before any async work
      const prefetchedVehicles = getPrefetchedData('vehicles', userId);
      if (prefetchedVehicles) {
        console.log('[OwnedVehiclesProvider] Using prefetched data (instant)');
        const vehicles = sortVehiclesByDisplayOrder(prefetchedVehicles.map(transformVehicle));
        dispatch({ type: ActionTypes.SET, payload: vehicles });
        syncedRef.current = true;
        // Clear localStorage - server data is source of truth for authenticated users
        saveLocalVehicles([]);
        markComplete('vehicles');
        setIsLoading(false);
        return;
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('[OwnedVehiclesProvider] Fetch timeout after', timeout, 'ms');
        controller.abort();
      }, timeout);

      try {
        // Fetch with timeout
        const fetchPromise = fetchUserVehicles(userId);
        const timeoutPromise = new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('Request timed out'));
          });
        });

        const result = await Promise.race([fetchPromise, timeoutPromise]);
        const { data, error } = result;

        // Clear timeout since fetch completed
        clearTimeout(timeoutId);

        if (error) {
          console.error('[OwnedVehiclesProvider] Error fetching vehicles:', error);

          // Handle 401 errors by triggering session refresh
          if (
            error.status === 401 ||
            error.message?.includes('JWT') ||
            error.message?.includes('session')
          ) {
            console.warn('[OwnedVehiclesProvider] Auth error, attempting session refresh...');
            try {
              await refreshSession?.();
            } catch (refreshErr) {
              console.error('[OwnedVehiclesProvider] Session refresh failed:', refreshErr);
            }
          }

          // Mark as failed with error message
          markFailed('vehicles', error.message || 'Failed to load vehicles');
          return;
        }

        if (data) {
          const vehicles = sortVehiclesByDisplayOrder(data.map(transformVehicle));
          console.log('[OwnedVehiclesProvider] Fetched', vehicles.length, 'vehicles from server');
          dispatch({ type: ActionTypes.SET, payload: vehicles });
          syncedRef.current = true;

          // CRITICAL: Clear localStorage when authenticated to prevent stale data on refresh
          // Server data is the source of truth for authenticated users
          saveLocalVehicles([]);
          console.log('[OwnedVehiclesProvider] Cleared localStorage (server is source of truth)');
        }

        // Mark as complete on success
        markComplete('vehicles');
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('[OwnedVehiclesProvider] Error:', err);
        const errorMessage =
          err.message === 'Request timed out'
            ? 'Request timed out - please try again'
            : err.message || 'Unexpected error loading vehicles';
        markFailed('vehicles', errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [markComplete, markFailed, refreshSession]
  );

  // When user ID becomes available AND data fetch is ready, fetch data
  // IMPORTANT: Wait for isDataFetchReady to avoid race conditions with prefetch
  useEffect(() => {
    // Skip if not hydrated yet
    if (!isHydrated) return;

    const handleAuthChange = async () => {
      const currentUserId = user?.id || null;
      const wasAuthenticated = lastUserIdRef.current !== null;
      const isNowAuthenticated = isAuthenticated && currentUserId;

      // Detect auth recovery scenario
      const isAuthRecovery = !wasAuthenticated && isNowAuthenticated;

      // Track the current user ID for next comparison
      lastUserIdRef.current = isNowAuthenticated ? currentUserId : null;

      if (isNowAuthenticated) {
        // IMPORTANT: Wait for AuthProvider to signal that prefetch is complete
        // This prevents race conditions where we start fetching before prefetch data is ready
        if (!isDataFetchReady) {
          console.log('[OwnedVehiclesProvider] Waiting for isDataFetchReady...');
          return;
        }

        // Only skip if we've already synced for THIS user
        // This ensures we refetch if auth recovered after failure
        if (syncedRef.current && wasAuthenticated && !isAuthRecovery) {
          console.log('[OwnedVehiclesProvider] Already synced for user, skipping fetch');
          return;
        }

        // OPTIMIZATION: Show loading only if we don't have cached data
        // This implements stale-while-revalidate pattern
        if (state.vehicles.length === 0) {
          setIsLoading(true);
        }

        // Mark step as started with retry callback
        markStarted('vehicles', () => fetchVehicles(currentUserId));

        // Fetch vehicles (will use prefetched data if available)
        await fetchVehicles(currentUserId);
      } else if (!authLoading && isDataFetchReady) {
        // Only reset on explicit logout (authLoading false + no user)
        // This prevents flickering during auth recovery
        console.log('[OwnedVehiclesProvider] Not authenticated, clearing user data');
        console.log('[OwnedVehiclesProvider] Auth state:', {
          isAuthenticated,
          authLoading,
          isDataFetchReady,
          userId: user?.id,
        });
        syncedRef.current = false;

        // CRITICAL: If user WAS authenticated (had data loaded), we must clear state
        // and localStorage to prevent showing stale user data
        if (wasAuthenticated) {
          console.log('[OwnedVehiclesProvider] User just logged out - clearing all data');
          saveLocalVehicles([]); // Clear localStorage first
          dispatch({ type: ActionTypes.SET, payload: [] }); // Clear state
        } else {
          // User was never logged in this session, load from localStorage
          const localVehicles = loadLocalVehicles();
          console.log('[OwnedVehiclesProvider] Loading guest data, count:', localVehicles.length);
          dispatch({ type: ActionTypes.SET, payload: localVehicles });
        }
        // Always mark as complete
        markComplete('vehicles');
      } else {
        // Debug: Log why we didn't clear
        console.log('[OwnedVehiclesProvider] Auth change - no action taken:', {
          isAuthenticated,
          authLoading,
          isDataFetchReady,
          isNowAuthenticated,
          userId: user?.id,
        });
      }
    };

    handleAuthChange();
  }, [
    isAuthenticated,
    user?.id,
    authLoading,
    isHydrated,
    isDataFetchReady,
    state.vehicles.length,
    markComplete,
    markStarted,
    fetchVehicles,
  ]);

  // Save to localStorage when state changes (for guests only)
  // IMPORTANT: We track the previous auth state to avoid saving user data to localStorage
  // during the logout transition (race condition where save effect fires before clear effect)
  const wasAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    if (!isHydrated) return;

    // If user just logged out (was authenticated, now isn't), clear localStorage
    // instead of saving - this prevents the race condition where user data gets saved
    if (wasAuthenticatedRef.current && !isAuthenticated) {
      console.log('[OwnedVehiclesProvider] User logged out - clearing localStorage');
      saveLocalVehicles([]); // Clear instead of saving stale user data
      wasAuthenticatedRef.current = false;
      return;
    }

    wasAuthenticatedRef.current = isAuthenticated;

    // Only save to localStorage if not authenticated
    if (!isAuthenticated) {
      saveLocalVehicles(state.vehicles);
    }
  }, [state.vehicles, isHydrated, isAuthenticated]);

  /**
   * Add a new vehicle
   */
  const addVehicle = useCallback(
    async (vehicle) => {
      console.log('[OwnedVehiclesProvider] addVehicle called:', {
        isAuthenticated,
        hasUserId: !!user?.id,
        vehicle: {
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          matchedCarSlug: vehicle.matchedCarSlug,
        },
      });

      // If authenticated, save to Supabase
      if (isAuthenticated && user?.id) {
        setIsLoading(true);
        console.log(
          '[OwnedVehiclesProvider] Saving vehicle to Supabase for user:',
          user.id?.slice(0, 8) + '...'
        );
        const { data, error } = await addUserVehicle(user.id, vehicle);
        setIsLoading(false);

        if (error) {
          console.error('[OwnedVehiclesProvider] Error saving vehicle to Supabase:', error);
        }

        if (!error && data) {
          console.log('[OwnedVehiclesProvider] Vehicle saved successfully:', data.id);
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
              const canApplyVariant =
                !transformed.matchedCarSlug || transformed.matchedCarSlug === match.carSlug;
              if (canApplyVariant) {
                const { data: updatedRow, error: updErr } = await updateUserVehicle(
                  user.id,
                  transformed.id,
                  {
                    matched_car_slug: nextCarSlug,
                    matched_car_variant_id: match.carVariantId,
                    matched_car_variant_key: match.carVariantKey,
                    vin_match_confidence: match.confidence,
                    vin_match_notes: Array.isArray(match.reasons) ? match.reasons.join(', ') : null,
                    vin_matched_at: new Date().toISOString(),
                  }
                );
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
    },
    [isAuthenticated, user?.id]
  );

  /**
   * Update an existing vehicle
   */
  const updateVehicle = useCallback(
    async (vehicleId, updates) => {
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
          // Modification fields
          installed_modifications: updates.installedModifications,
          active_build_id: updates.activeBuildId,
          // Note: total_hp_gain is stored for historical/audit purposes only.
          // Display should always calculate from installed_modifications.
          total_hp_gain: updates._cachedHpGain ?? updates.totalHpGain,
          modified_at: updates.modifiedAt,
        };

        // Remove undefined values
        Object.keys(dbUpdates).forEach((key) => {
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
    },
    [isAuthenticated, user?.id]
  );

  /**
   * Remove a vehicle
   */
  const removeVehicle = useCallback(
    async (vehicleId) => {
      // If authenticated, remove from Supabase
      if (isAuthenticated && user?.id) {
        const { error } = await deleteUserVehicle(user.id, vehicleId);

        if (!error) {
          dispatch({ type: ActionTypes.REMOVE, payload: vehicleId });
          // Invalidate prefetch cache so fresh data is fetched on next page load
          // This prevents the deleted vehicle from reappearing after refresh
          invalidatePrefetchCache('vehicles');
        }

        return { error };
      }

      // Not authenticated - remove from localStorage
      dispatch({ type: ActionTypes.REMOVE, payload: vehicleId });
      return { error: null };
    },
    [isAuthenticated, user?.id]
  );

  /**
   * Get primary vehicle
   */
  const getPrimaryVehicle = useCallback(() => {
    return state.vehicles.find((v) => v.isPrimary) || state.vehicles[0] || null;
  }, [state.vehicles]);

  /**
   * Set a vehicle as primary
   */
  const setPrimaryVehicle = useCallback(
    async (vehicleId) => {
      // First, unset current primary
      const currentPrimary = state.vehicles.find((v) => v.isPrimary);
      if (currentPrimary && currentPrimary.id !== vehicleId) {
        await updateVehicle(currentPrimary.id, { isPrimary: false });
      }

      // Set new primary
      return updateVehicle(vehicleId, { isPrimary: true });
    },
    [state.vehicles, updateVehicle]
  );

  /**
   * Apply modifications to a vehicle
   * @param {string} vehicleId
   * @param {Object} modifications - { upgrades: string[], totalHpGain: number (for DB storage only), buildId?: string }
   */
  const applyModifications = useCallback(
    async (vehicleId, modifications) => {
      if (!isAuthenticated || !user?.id) {
        // For guests, update locally
        const vehicle = state.vehicles.find((v) => v.id === vehicleId);
        if (!vehicle) return { data: null, error: new Error('Vehicle not found') };

        const updatedVehicle = {
          ...vehicle,
          installedModifications: modifications.upgrades || [],
          totalHpGain: modifications.totalHpGain || 0, // DEPRECATED - use useVehiclePerformance
          _cachedHpGain: modifications.totalHpGain || 0,
          activeBuildId: modifications.buildId || null,
          modifiedAt: new Date().toISOString(),
          isModified: (modifications.upgrades?.length || 0) > 0,
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: ActionTypes.UPDATE, payload: updatedVehicle });
        return { data: updatedVehicle, error: null };
      }

      setIsLoading(true);
      const { data, error } = await applyVehicleModifications(user.id, vehicleId, modifications);
      setIsLoading(false);

      if (!error && data) {
        const transformed = transformVehicle(data);
        dispatch({ type: ActionTypes.UPDATE, payload: transformed });
        return { data: transformed, error: null };
      }

      return { data: null, error };
    },
    [isAuthenticated, user?.id, state.vehicles]
  );

  /**
   * Clear all modifications from a vehicle (reset to stock)
   * @param {string} vehicleId
   */
  const clearModifications = useCallback(
    async (vehicleId) => {
      if (!isAuthenticated || !user?.id) {
        // For guests, update locally
        const vehicle = state.vehicles.find((v) => v.id === vehicleId);
        if (!vehicle) return { data: null, error: new Error('Vehicle not found') };

        const updatedVehicle = {
          ...vehicle,
          installedModifications: [],
          totalHpGain: 0, // DEPRECATED - use useVehiclePerformance
          _cachedHpGain: 0,
          activeBuildId: null,
          modifiedAt: new Date().toISOString(),
          isModified: false,
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: ActionTypes.UPDATE, payload: updatedVehicle });
        return { data: updatedVehicle, error: null };
      }

      setIsLoading(true);
      const { data, error } = await clearVehicleModifications(user.id, vehicleId);
      setIsLoading(false);

      if (!error && data) {
        const transformed = transformVehicle(data);
        dispatch({ type: ActionTypes.UPDATE, payload: transformed });
        return { data: transformed, error: null };
      }

      return { data: null, error };
    },
    [isAuthenticated, user?.id, state.vehicles]
  );

  /**
   * Apply a saved build to a vehicle
   * @param {string} vehicleId
   * @param {string} buildId - user_projects.id
   */
  const applyBuild = useCallback(
    async (vehicleId, buildId) => {
      if (!isAuthenticated || !user?.id) {
        return { data: null, error: new Error('Must be authenticated to apply builds') };
      }

      setIsLoading(true);
      const { data, error } = await applyBuildToVehicle(user.id, vehicleId, buildId);
      setIsLoading(false);

      if (!error && data) {
        const transformed = transformVehicle(data);
        dispatch({ type: ActionTypes.UPDATE, payload: transformed });
        return { data: transformed, error: null };
      }

      return { data: null, error };
    },
    [isAuthenticated, user?.id]
  );

  // ============================================================================
  // CUSTOM SPECS (User-Specific Modification Details)
  // ============================================================================

  /**
   * Update custom specs for a vehicle
   * Custom specs allow users to record their actual wheel sizes, tire specs, etc.
   * that override the stock values when displaying vehicle information.
   *
   * @param {string} vehicleId
   * @param {Object} customSpecs - See updateVehicleCustomSpecs for structure
   */
  const updateCustomSpecs = useCallback(
    async (vehicleId, customSpecs) => {
      if (!isAuthenticated || !user?.id) {
        // For guests, update locally
        const vehicle = state.vehicles.find((v) => v.id === vehicleId);
        if (!vehicle) return { data: null, error: new Error('Vehicle not found') };

        const updatedVehicle = {
          ...vehicle,
          customSpecs: customSpecs,
          hasCustomSpecs: Object.keys(customSpecs).length > 0,
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: ActionTypes.UPDATE, payload: updatedVehicle });
        return { data: updatedVehicle, error: null };
      }

      setIsLoading(true);
      const { data, error } = await updateVehicleCustomSpecs(user.id, vehicleId, customSpecs);
      setIsLoading(false);

      if (!error && data) {
        const transformed = transformVehicle(data);
        dispatch({ type: ActionTypes.UPDATE, payload: transformed });
        return { data: transformed, error: null };
      }

      return { data: null, error };
    },
    [isAuthenticated, user?.id, state.vehicles]
  );

  /**
   * Update a specific section of custom specs (merge with existing)
   * Useful for updating just wheels or just tires without affecting other sections.
   *
   * @param {string} vehicleId
   * @param {string} section - 'wheels', 'tires', 'suspension', 'brakes', 'engine', 'other'
   * @param {Object} sectionData - Data to merge into that section
   */
  const updateCustomSpecsSection = useCallback(
    async (vehicleId, section, sectionData) => {
      if (!isAuthenticated || !user?.id) {
        // For guests, update locally
        const vehicle = state.vehicles.find((v) => v.id === vehicleId);
        if (!vehicle) return { data: null, error: new Error('Vehicle not found') };

        const currentSpecs = vehicle.customSpecs || {};
        const updatedSpecs = {
          ...currentSpecs,
          [section]: {
            ...(currentSpecs[section] || {}),
            ...sectionData,
          },
        };

        const updatedVehicle = {
          ...vehicle,
          customSpecs: updatedSpecs,
          hasCustomSpecs: Object.keys(updatedSpecs).length > 0,
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: ActionTypes.UPDATE, payload: updatedVehicle });
        return { data: updatedVehicle, error: null };
      }

      setIsLoading(true);
      const { data, error } = await updateVehicleCustomSpecsSection(
        user.id,
        vehicleId,
        section,
        sectionData
      );
      setIsLoading(false);

      if (!error && data) {
        const transformed = transformVehicle(data);
        dispatch({ type: ActionTypes.UPDATE, payload: transformed });
        return { data: transformed, error: null };
      }

      return { data: null, error };
    },
    [isAuthenticated, user?.id, state.vehicles]
  );

  /**
   * Clear custom specs for a vehicle (reset to showing stock specs)
   *
   * @param {string} vehicleId
   * @param {string} [section] - Optional: clear only a specific section
   */
  const clearCustomSpecs = useCallback(
    async (vehicleId, section = null) => {
      if (!isAuthenticated || !user?.id) {
        // For guests, update locally
        const vehicle = state.vehicles.find((v) => v.id === vehicleId);
        if (!vehicle) return { data: null, error: new Error('Vehicle not found') };

        let newSpecs = {};
        if (section) {
          newSpecs = { ...(vehicle.customSpecs || {}) };
          delete newSpecs[section];
        }

        const updatedVehicle = {
          ...vehicle,
          customSpecs: newSpecs,
          hasCustomSpecs: Object.keys(newSpecs).length > 0,
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: ActionTypes.UPDATE, payload: updatedVehicle });
        return { data: updatedVehicle, error: null };
      }

      setIsLoading(true);
      const { data, error } = await clearVehicleCustomSpecs(user.id, vehicleId, section);
      setIsLoading(false);

      if (!error && data) {
        const transformed = transformVehicle(data);
        dispatch({ type: ActionTypes.UPDATE, payload: transformed });
        return { data: transformed, error: null };
      }

      return { data: null, error };
    },
    [isAuthenticated, user?.id, state.vehicles]
  );

  /**
   * Reorder vehicles in the garage
   * @param {string[]} vehicleIds - Array of vehicle IDs in desired order
   */
  const reorderVehicles = useCallback(
    async (vehicleIds) => {
      if (!isAuthenticated || !user?.id) {
        // For guests, reorder locally
        const reordered = vehicleIds
          .map((id, index) => {
            const vehicle = state.vehicles.find((v) => v.id === id);
            return vehicle ? { ...vehicle, displayOrder: index + 1 } : null;
          })
          .filter(Boolean);
        dispatch({ type: ActionTypes.SET, payload: reordered });
        return { success: true, error: null };
      }

      // Optimistically update the UI
      const optimisticOrder = vehicleIds
        .map((id, index) => {
          const vehicle = state.vehicles.find((v) => v.id === id);
          return vehicle ? { ...vehicle, displayOrder: index + 1 } : null;
        })
        .filter(Boolean);
      dispatch({ type: ActionTypes.SET, payload: optimisticOrder });

      try {
        const response = await fetch(`/api/users/${user.id}/vehicles/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicleIds }),
        });

        const result = await response.json();

        if (!response.ok) {
          // Rollback on error
          console.error('[OwnedVehiclesProvider] Reorder failed:', result.error);
          // Re-fetch to restore correct state
          await fetchVehicles(user.id);
          return { success: false, error: result.error || 'Failed to reorder vehicles' };
        }

        // Invalidate prefetch cache so fresh data is fetched on next page load
        invalidatePrefetchCache('vehicles');

        return { success: true, error: null };
      } catch (err) {
        console.error('[OwnedVehiclesProvider] Reorder error:', err);
        // Re-fetch to restore correct state
        await fetchVehicles(user.id);
        return { success: false, error: err.message || 'Failed to reorder vehicles' };
      }
    },
    [isAuthenticated, user?.id, state.vehicles, fetchVehicles]
  );

  /**
   * Get a vehicle by ID
   * @param {string} vehicleId
   */
  const getVehicleById = useCallback(
    (vehicleId) => {
      return state.vehicles.find((v) => v.id === vehicleId) || null;
    },
    [state.vehicles]
  );

  /**
   * Get vehicles matching a car slug (for Tuning Shop integration)
   * @param {string} carSlug
   */
  const getVehiclesByCarSlug = useCallback(
    (carSlug) => {
      if (!carSlug) return [];
      return state.vehicles.filter((v) => v.matchedCarSlug === carSlug);
    },
    [state.vehicles]
  );

  /**
   * Refresh/refetch vehicles from the server
   * Useful for pull-to-refresh functionality
   */
  const refresh = useCallback(async () => {
    if (!user?.id) return;
    await fetchVehicles(user.id);
  }, [user?.id, fetchVehicles]);

  const value = useMemo(
    () => ({
      vehicles: state.vehicles,
      count: state.vehicles.length,
      isHydrated,
      isLoading,
      // CRUD operations
      addVehicle,
      updateVehicle,
      removeVehicle,
      // Primary vehicle
      getPrimaryVehicle,
      setPrimaryVehicle,
      // Reordering
      reorderVehicles,
      // Modification operations (upgrade keys)
      applyModifications,
      clearModifications,
      applyBuild,
      // Custom specs operations (user-specific details)
      updateCustomSpecs,
      updateCustomSpecsSection,
      clearCustomSpecs,
      // Helpers
      getVehicleById,
      getVehiclesByCarSlug,
      // Refresh
      refresh,
    }),
    [
      state.vehicles,
      isHydrated,
      isLoading,
      addVehicle,
      updateVehicle,
      removeVehicle,
      getPrimaryVehicle,
      setPrimaryVehicle,
      reorderVehicles,
      applyModifications,
      clearModifications,
      applyBuild,
      updateCustomSpecs,
      updateCustomSpecsSection,
      clearCustomSpecs,
      getVehicleById,
      getVehiclesByCarSlug,
      refresh,
    ]
  );

  return <OwnedVehiclesContext.Provider value={value}>{children}</OwnedVehiclesContext.Provider>;
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
