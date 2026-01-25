'use client';

/**
 * Saved Builds Provider
 * 
 * React Context provider for managing saved Performance HUB builds.
 * - Uses Supabase for authenticated users
 * - Falls back to localStorage for guests (for testing/demo purposes)
 * 
 * @module components/providers/SavedBuildsProvider
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  fetchUserProjects,
  saveUserProject,
  updateUserProject,
  deleteUserProject,
} from '@/lib/userDataService';
import { getPrefetchedData } from '@/lib/prefetch';
import { useLoadingProgress } from './LoadingProgressProvider';
import { hasAccess, IS_BETA } from '@/lib/tierAccess';

// Auto-save debounce delay (milliseconds)
const AUTO_SAVE_DEBOUNCE_MS = 500;

// LocalStorage key for guest builds
const STORAGE_KEY = 'autorev_saved_builds';

/**
 * Load builds from localStorage
 */
function loadLocalBuilds() {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.warn('[SavedBuildsProvider] Failed to load local builds:', err);
  }
  return [];
}

/**
 * Save builds to localStorage
 */
function saveLocalBuilds(builds) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
  } catch (err) {
    console.warn('[SavedBuildsProvider] Failed to save local builds:', err);
  }
}

/**
 * @typedef {'track' | 'street' | 'show' | 'daily'} BuildGoal
 */

/**
 * @typedef {Object} SavedBuild
 * @property {string} id - Database ID
 * @property {string} carSlug - Car slug
 * @property {string} carName - Car display name
 * @property {string} name - Build name
 * @property {BuildGoal|null} goal - Build objective (track, street, show, daily)
 * @property {string[]} upgrades - Array of upgrade keys
 * @property {Array} [parts] - Selected parts (snapshots)
 * @property {number} totalHpGain - Total HP gained
 * @property {number} totalCostLow - Low estimate cost
 * @property {number} totalCostHigh - High estimate cost
 * @property {number} [finalHp] - Final HP after upgrades
 * @property {string} [notes] - User notes
 * @property {boolean} isFavorite - Whether build is favorited
 * @property {string} createdAt - Creation timestamp
 * @property {string} updatedAt - Last update timestamp
 */

/**
 * @typedef {'idle' | 'saving' | 'saved' | 'error'} AutoSaveStatus
 */

/**
 * @typedef {Object} SavedBuildsContextValue
 * @property {SavedBuild[]} builds - Array of saved builds
 * @property {boolean} isLoading - Whether builds are loading
 * @property {boolean} canSave - Whether user can save builds (is authenticated)
 * @property {function(Object): Promise<Object>} saveBuild - Save a new build
 * @property {function(string, Object): Promise<Object>} updateBuild - Update a build
 * @property {function(string): Promise<Object>} deleteBuild - Delete a build
 * @property {function(string): SavedBuild|undefined} getBuildById - Get a build by ID
 * @property {function(string): SavedBuild[]} getBuildsByCarSlug - Get builds for a car
 * @property {function(): void} refreshBuilds - Refresh builds from server
 * @property {function(string, Object): void} autoSaveBuild - Auto-save build with debounce
 * @property {AutoSaveStatus} autoSaveStatus - Current auto-save status
 * @property {string|null} autoSaveError - Auto-save error message if any
 */

const SavedBuildsContext = createContext(null);

/**
 * Saved Builds Provider Component
 */
export function SavedBuildsProvider({ children }) {
  const { user, isAuthenticated, isLoading: authLoading, isDataFetchReady, profile, refreshSession } = useAuth();
  const { markComplete, markStarted, markFailed } = useLoadingProgress();
  const userTier = profile?.subscription_tier || 'free';
  
  // OPTIMISTIC LOAD: Initialize state with localStorage data synchronously
  // This makes guest builds visible immediately on page load
  const [builds, setBuilds] = useState(() => {
    // Use lazy initializer to read localStorage once during mount
    // This is SSR-safe because loadLocalBuilds() checks typeof window
    return loadLocalBuilds();
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const syncedRef = useRef(false);
  const lastUserIdRef = useRef(null);
  
  // Auto-save state
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [autoSaveError, setAutoSaveError] = useState(null);
  const autoSaveTimerRef = useRef(null);
  const autoSavePendingRef = useRef(null); // Stores pending save data

  // Mark as hydrated immediately since we loaded synchronously
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  /**
   * Fetch builds from Supabase
   * @param {Object} cancelledRef - Ref to track if effect was cancelled
   * @param {boolean} forceRefetch - Force refetch even if already synced
   * @param {number} currentBuildsCount - Current builds count for stale-while-revalidate
   * @param {number} timeout - Timeout in ms (default 10000)
   */
const fetchBuilds = useCallback(async (cancelledRef = { current: false }, forceRefetch = false, currentBuildsCount = 0, timeout = 5000) => {
  if (!isAuthenticated || !user?.id) {
    // Not authenticated - load from localStorage (clearing user data)
    console.log('[SavedBuildsProvider] Not authenticated, clearing user data and loading from localStorage');
    console.log('[SavedBuildsProvider] Auth state:', { isAuthenticated, userId: user?.id });
    const localBuilds = loadLocalBuilds();
    console.log('[SavedBuildsProvider] Local builds count:', localBuilds.length);
    if (!cancelledRef.current) {
      setBuilds(localBuilds);
      // Always mark as complete
      markComplete('builds');
    }
    return;
  }

  // Skip if already synced unless forced
  if (syncedRef.current && !forceRefetch) {
    console.log('[SavedBuildsProvider] Already synced, skipping fetch');
    return;
  }

  console.log('[SavedBuildsProvider] Fetching builds for user:', user.id?.slice(0, 8) + '...');

  // OPTIMIZATION: Check for prefetched data FIRST before any async work
  const prefetchedBuilds = getPrefetchedData('builds', user.id);
  if (prefetchedBuilds) {
    console.log('[SavedBuildsProvider] Using prefetched data (instant)');
    const transformedBuilds = prefetchedBuilds.map(build => {
      // Get hero image from uploaded images (is_primary=true, or first non-video image)
      const uploadedImages = build.user_uploaded_images || [];
      const heroImage = uploadedImages.find(img => img.is_primary && img.media_type !== 'video')
        || uploadedImages.find(img => img.media_type !== 'video')
        || null;
      
return {
          id: build.id,
          carSlug: build.car_slug,
          carName: build.car_name,
          name: build.project_name,
          // Build objective (track, street, show, daily)
          goal: build.selected_upgrades?.goal || null,
          upgrades: Array.isArray(build.selected_upgrades) 
            ? build.selected_upgrades 
            : (build.selected_upgrades?.upgrades || []),
          factoryConfig: build.selected_upgrades?.factoryConfig || null,
          wheelFitment: build.selected_upgrades?.wheelFitment || null,
          sizeSelections: build.selected_upgrades?.sizeSelections || null,
          heroSource: build.selected_upgrades?.heroSource || 'stock',
          heroImageId: build.selected_upgrades?.heroImageId || null,
          // Tuner mode ('basic' or 'advanced') - determines HP calculation source
          tunerMode: build.selected_upgrades?.tunerMode || 'basic',
          // Advanced specs if user was in advanced mode
          advancedSpecs: build.selected_upgrades?.advancedSpecs || null,
          // Include hero image URL for display in project cards
          heroImageUrl: heroImage?.blob_url || heroImage?.thumbnail_url || null,
          uploadedImages: uploadedImages,
          parts: Array.isArray(build.user_project_parts) ? build.user_project_parts.map(p => ({
            id: p.id,
            partId: p.part_id,
            quantity: p.quantity,
            partName: p.part_name,
            brandName: p.brand_name,
            partNumber: p.part_number,
            category: p.category,
            vendorName: p.vendor_name,
            productUrl: p.product_url,
            currency: p.currency,
            priceCents: p.price_cents,
            priceRecordedAt: p.price_recorded_at,
            requiresTune: p.requires_tune,
            installDifficulty: p.install_difficulty,
            estimatedLaborHours: p.estimated_labor_hours,
            fitmentVerified: p.fitment_verified,
            fitmentConfidence: p.fitment_confidence,
            fitmentNotes: p.fitment_notes,
            fitmentSourceUrl: p.fitment_source_url,
            metadata: p.metadata,
            // Status tracking fields
            status: p.status || 'planned',
            purchasedAt: p.purchased_at,
            installedAt: p.installed_at,
            installedBy: p.installed_by,
            // Extract upgradeKey from metadata if present
            upgradeKey: p.metadata?.upgradeKey || p.category,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          })) : [],
          // @deprecated - STALE value. Use useBuildPerformance(build, car) instead.
          totalHpGain: build.total_hp_gain || 0,
          totalCostLow: build.total_cost_low || 0,
          totalCostHigh: build.total_cost_high || 0,
          finalHp: build.final_hp,
          notes: build.notes,
          isFavorite: build.is_favorite || false,
          // Sharing fields
          isShared: build.is_shared || false,
          communitySlug: build.community_slug || null,
          sharedAt: build.shared_at || null,
          shareName: build.share_name || null,
          createdAt: build.created_at,
          updatedAt: build.updated_at,
        };
    });
    
    if (!cancelledRef.current) {
      setBuilds(transformedBuilds);
      syncedRef.current = true;
      // Clear localStorage - server data is source of truth for authenticated users
      saveLocalBuilds([]);
      markComplete('builds');
      setIsLoading(false);
    }
    return;
  }

  // OPTIMIZATION: Show loading only if we don't have cached data
  // This implements stale-while-revalidate pattern
  if (currentBuildsCount === 0) {
    setIsLoading(true);
  }
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn('[SavedBuildsProvider] Fetch timeout after', timeout, 'ms');
    controller.abort();
  }, timeout);
  
  try {
    // Fetch with timeout
    const fetchPromise = fetchUserProjects(user.id);
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
      console.error('[SavedBuildsProvider] Error fetching builds:', error);
      
      // Handle 401 errors by triggering session refresh
      if (error.status === 401 || error.message?.includes('JWT') || error.message?.includes('session')) {
        console.warn('[SavedBuildsProvider] Auth error, attempting session refresh...');
        try {
          await refreshSession?.();
        } catch (refreshErr) {
          console.error('[SavedBuildsProvider] Session refresh failed:', refreshErr);
        }
      }
      
      // Fall back to localStorage
      const localBuilds = loadLocalBuilds();
      if (!cancelledRef.current) {
        setBuilds(localBuilds);
        // Mark as failed but still provide fallback data
        markFailed('builds', error.message || 'Failed to load builds');
      }
      return;
    }
    
    if (data) {
      const transformedBuilds = data.map(build => {
        // Get hero image from uploaded images (is_primary=true, or first non-video image)
        const uploadedImages = build.user_uploaded_images || [];
        const heroImage = uploadedImages.find(img => img.is_primary && img.media_type !== 'video')
          || uploadedImages.find(img => img.media_type !== 'video')
          || null;
        
        return {
          id: build.id,
          carSlug: build.car_slug,
          carName: build.car_name,
          name: build.project_name,
          // Build objective (track, street, show, daily)
          goal: build.selected_upgrades?.goal || null,
          // Handle both old format (array) and new format (object with upgrades, factoryConfig, etc.)
          upgrades: Array.isArray(build.selected_upgrades) 
            ? build.selected_upgrades 
            : (build.selected_upgrades?.upgrades || []),
          factoryConfig: build.selected_upgrades?.factoryConfig || null,
          wheelFitment: build.selected_upgrades?.wheelFitment || null,
          sizeSelections: build.selected_upgrades?.sizeSelections || null,
          heroSource: build.selected_upgrades?.heroSource || 'stock',
          heroImageId: build.selected_upgrades?.heroImageId || null,
          // Tuner mode ('basic' or 'advanced') - determines HP calculation source
          tunerMode: build.selected_upgrades?.tunerMode || 'basic',
          // Advanced specs if user was in advanced mode
          advancedSpecs: build.selected_upgrades?.advancedSpecs || null,
          // Include hero image URL for display in project cards
          heroImageUrl: heroImage?.blob_url || heroImage?.thumbnail_url || null,
          uploadedImages: uploadedImages,
          parts: Array.isArray(build.user_project_parts) ? build.user_project_parts.map(p => ({
            id: p.id,
            partId: p.part_id,
            quantity: p.quantity,
            partName: p.part_name,
            brandName: p.brand_name,
            partNumber: p.part_number,
            category: p.category,
            vendorName: p.vendor_name,
            productUrl: p.product_url,
            currency: p.currency,
            priceCents: p.price_cents,
            priceRecordedAt: p.price_recorded_at,
            requiresTune: p.requires_tune,
            installDifficulty: p.install_difficulty,
            estimatedLaborHours: p.estimated_labor_hours,
            fitmentVerified: p.fitment_verified,
            fitmentConfidence: p.fitment_confidence,
            fitmentNotes: p.fitment_notes,
            fitmentSourceUrl: p.fitment_source_url,
            metadata: p.metadata,
            // Status tracking fields
            status: p.status || 'planned',
            purchasedAt: p.purchased_at,
            installedAt: p.installed_at,
            installedBy: p.installed_by,
            // Extract upgradeKey from metadata if present
            upgradeKey: p.metadata?.upgradeKey || p.category,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          })) : [],
          // @deprecated - STALE value. Use useBuildPerformance(build, car) instead.
          totalHpGain: build.total_hp_gain || 0,
          totalCostLow: build.total_cost_low || 0,
          totalCostHigh: build.total_cost_high || 0,
          finalHp: build.final_hp,
          notes: build.notes,
          isFavorite: build.is_favorite || false,
          // Sharing fields
          isShared: build.is_shared || false,
          communitySlug: build.community_slug || null,
          sharedAt: build.shared_at || null,
          shareName: build.share_name || null,
          createdAt: build.created_at,
          updatedAt: build.updated_at,
        };
      });
      
      console.log('[SavedBuildsProvider] Fetched', transformedBuilds.length, 'builds from server');
      
      if (!cancelledRef.current) {
        setBuilds(transformedBuilds);
        syncedRef.current = true;
        // CRITICAL: Clear localStorage when authenticated to prevent stale data on refresh
        // Server data is the source of truth for authenticated users
        saveLocalBuilds([]);
        console.log('[SavedBuildsProvider] Cleared localStorage (server is source of truth)');
        // Mark as complete on success
        markComplete('builds');
      }
    }
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[SavedBuildsProvider] Unexpected error:', err);
    // Fall back to localStorage
    const localBuilds = loadLocalBuilds();
    if (!cancelledRef.current) {
      setBuilds(localBuilds);
      const errorMessage = err.message === 'Request timed out' 
        ? 'Request timed out - please try again' 
        : err.message || 'Unexpected error loading builds';
      markFailed('builds', errorMessage);
    }
  } finally {
    if (!cancelledRef.current) {
      setIsLoading(false);
    }
  }
}, [isAuthenticated, user?.id, markComplete, markFailed, refreshSession]);

  // Fetch builds when user ID becomes available AND data fetch is ready
  // IMPORTANT: Wait for isDataFetchReady to avoid race conditions with prefetch
useEffect(() => {
  // Skip if not hydrated yet
  if (!isHydrated) return;
  
  const cancelledRef = { current: false };
  const currentUserId = user?.id || null;
  const wasAuthenticated = lastUserIdRef.current !== null;
  const isNowAuthenticated = isAuthenticated && currentUserId;
  
  // Detect auth recovery: was not authenticated, now is
  const isAuthRecovery = !wasAuthenticated && isNowAuthenticated;
  
  // Update tracking ref
  lastUserIdRef.current = isNowAuthenticated ? currentUserId : null;
  
  // Reset sync flag on logout (only when auth loading is complete)
  if (!isNowAuthenticated && !authLoading && isDataFetchReady) {
    syncedRef.current = false;
  }
  
  // IMPORTANT: Wait for AuthProvider to signal that prefetch is complete
  // This prevents race conditions where we start fetching before prefetch data is ready
  if (isNowAuthenticated) {
    if (!isDataFetchReady) {
      console.log('[SavedBuildsProvider] Waiting for isDataFetchReady...');
      return;
    }
    
    // Mark step as started with retry callback
    markStarted('builds', () => fetchBuilds(cancelledRef, true, builds.length));
    // Fetch builds (will use prefetched data if available)
    fetchBuilds(cancelledRef, isAuthRecovery, builds.length);
  } else if (!authLoading && isDataFetchReady) {
    // User is not authenticated
    // CRITICAL: If user WAS authenticated (had data loaded), we must clear state
    // and localStorage to prevent showing stale user data
    if (wasAuthenticated) {
      console.log('[SavedBuildsProvider] User just logged out - clearing all data');
      saveLocalBuilds([]); // Clear localStorage first
      setBuilds([]); // Clear state directly
      markComplete('builds');
    } else {
      // User was never logged in this session, load from localStorage
      fetchBuilds(cancelledRef, false, builds.length);
    }
  }
  
  return () => {
    cancelledRef.current = true;
  };
}, [fetchBuilds, authLoading, isHydrated, isAuthenticated, isDataFetchReady, user?.id, builds.length, markStarted, markComplete]);

  // Save to localStorage when builds change (for guests only)
  // IMPORTANT: We track the previous auth state to avoid saving user data to localStorage
  // during the logout transition (race condition where save effect fires before clear effect)
  const wasAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    if (!isHydrated) return;
    
    // If user just logged out (was authenticated, now isn't), clear localStorage 
    // instead of saving - this prevents the race condition where user data gets saved
    if (wasAuthenticatedRef.current && !isAuthenticated) {
      console.log('[SavedBuildsProvider] User logged out - clearing localStorage');
      saveLocalBuilds([]); // Clear instead of saving stale user data
      wasAuthenticatedRef.current = false;
      return;
    }
    
    wasAuthenticatedRef.current = isAuthenticated;
    
    // Only save to localStorage if not authenticated
    if (!isAuthenticated) {
      saveLocalBuilds(builds);
    }
  }, [builds, isHydrated, isAuthenticated]);

  /**
   * Check if user can save builds based on tier
   * Tuner tier required for saving build projects (but free during beta)
   */
  const canSaveBuilds = IS_BETA ? isAuthenticated : hasAccess(userTier, 'buildProjects', isAuthenticated);

  /**
   * Save a new build
   */
  const saveBuild = useCallback(async (buildData) => {
    // Check tier access (bypassed during beta)
    if (!IS_BETA && !canSaveBuilds) {
      return { 
        data: null, 
        error: { message: 'Upgrade to Tuner tier to save build projects' } 
      };
    }

    // If authenticated, save to Supabase
    if (isAuthenticated && user?.id) {
      setIsLoading(true);
      
      const { data, error } = await saveUserProject(user.id, buildData);
      
      if (!error && data) {
        const newBuild = {
          id: data.id,
          carSlug: data.car_slug,
          carName: data.car_name,
          name: data.project_name,
          // Build objective (track, street, show, daily)
          goal: data.selected_upgrades?.goal || buildData?.goal || null,
          // Handle both old format (array) and new format (object with upgrades, factoryConfig, etc.)
          upgrades: Array.isArray(data.selected_upgrades) 
            ? data.selected_upgrades 
            : (data.selected_upgrades?.upgrades || []),
          factoryConfig: data.selected_upgrades?.factoryConfig || buildData?.factoryConfig || null,
          wheelFitment: data.selected_upgrades?.wheelFitment || buildData?.wheelFitment || null,
          sizeSelections: data.selected_upgrades?.sizeSelections || buildData?.sizeSelections || null,
          heroSource: data.selected_upgrades?.heroSource || buildData?.heroSource || 'stock',
          heroImageId: data.selected_upgrades?.heroImageId || buildData?.heroImageId || null,
          // Tuner mode and advanced specs
          tunerMode: data.selected_upgrades?.tunerMode || buildData?.tunerMode || 'basic',
          advancedSpecs: data.selected_upgrades?.advancedSpecs || buildData?.advancedSpecs || null,
          parts: Array.isArray(buildData?.selectedParts) ? buildData.selectedParts : [],
          // @deprecated - STALE value. Use useBuildPerformance(build, car) instead.
          totalHpGain: data.total_hp_gain || 0,
          totalCostLow: data.total_cost_low || 0,
          totalCostHigh: data.total_cost_high || 0,
          finalHp: data.final_hp,
          notes: data.notes,
          isFavorite: data.is_favorite || false,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        
        setBuilds(prev => [newBuild, ...prev]);
      }
      
      setIsLoading(false);
      return { data, error };
    }

    // Not authenticated - save to localStorage
    const newBuild = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      carSlug: buildData.carSlug,
      carName: buildData.carName,
      name: buildData.name || 'Untitled Build',
      // Build objective (track, street, show, daily)
      goal: buildData.goal || null,
      upgrades: buildData.selectedUpgrades || buildData.upgrades || [],
      factoryConfig: buildData.factoryConfig || null,
      wheelFitment: buildData.wheelFitment || null,
      sizeSelections: buildData.sizeSelections || null,
      heroSource: buildData.heroSource || 'stock',
      heroImageId: buildData.heroImageId || null,
      // Tuner mode and advanced specs
      tunerMode: buildData.tunerMode || 'basic',
      advancedSpecs: buildData.advancedSpecs || null,
      parts: buildData.selectedParts || buildData.parts || [],
      // @deprecated - STALE value. Use useBuildPerformance(build, car) instead.
      totalHpGain: buildData.totalHpGain || 0,
      totalCostLow: buildData.totalCostLow || 0,
      totalCostHigh: buildData.totalCostHigh || 0,
      finalHp: buildData.finalHp,
      notes: buildData.notes,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setBuilds(prev => [newBuild, ...prev]);
    return { data: newBuild, error: null };
  }, [isAuthenticated, user?.id, canSaveBuilds]);

  /**
   * Update an existing build
   */
  const updateBuildHandler = useCallback(async (buildId, updates) => {
    // If authenticated, update in Supabase
    if (isAuthenticated && user?.id) {
      const { data, error } = await updateUserProject(user.id, buildId, updates);
      
      if (!error && data) {
        setBuilds(prev => prev.map(build => {
          if (build.id === buildId) {
            return {
              ...build,
              name: data.project_name,
              // Build objective (track, street, show, daily)
              goal: data.selected_upgrades?.goal || updates?.goal || build.goal || null,
              // Handle both old format (array) and new format (object)
              upgrades: Array.isArray(data.selected_upgrades) 
                ? data.selected_upgrades 
                : (data.selected_upgrades?.upgrades || []),
              factoryConfig: data.selected_upgrades?.factoryConfig || updates?.factoryConfig || build.factoryConfig,
              wheelFitment: data.selected_upgrades?.wheelFitment || updates?.wheelFitment || build.wheelFitment,
              sizeSelections: data.selected_upgrades?.sizeSelections || updates?.sizeSelections || build.sizeSelections,
              heroSource: data.selected_upgrades?.heroSource || updates?.heroSource || build.heroSource || 'stock',
              heroImageId: data.selected_upgrades?.heroImageId || updates?.heroImageId || build.heroImageId || null,
              parts: updates?.selectedParts ? updates.selectedParts : build.parts,
              // @deprecated - STALE value. Use useBuildPerformance(build, car) instead.
              totalHpGain: data.total_hp_gain || 0,
              totalCostLow: data.total_cost_low || 0,
              totalCostHigh: data.total_cost_high || 0,
              finalHp: data.final_hp,
              notes: data.notes,
              isFavorite: data.is_favorite || false,
              updatedAt: data.updated_at,
            };
          }
          return build;
        }));
      }
      
      return { data, error };
    }

    // Not authenticated - update in localStorage
    setBuilds(prev => prev.map(build => {
      if (build.id === buildId) {
        return {
          ...build,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return build;
    }));
    
    return { data: { id: buildId, ...updates }, error: null };
  }, [isAuthenticated, user?.id]);

  /**
   * Delete a build
   */
  const deleteBuildHandler = useCallback(async (buildId) => {
    // If authenticated, delete from Supabase
    if (isAuthenticated && user?.id) {
      const { error } = await deleteUserProject(user.id, buildId);
      
      if (!error) {
        setBuilds(prev => prev.filter(build => build.id !== buildId));
      }
      
      return { error };
    }

    // Not authenticated - delete from localStorage
    setBuilds(prev => prev.filter(build => build.id !== buildId));
    return { error: null };
  }, [isAuthenticated, user?.id]);

  /**
   * Get a build by ID
   */
  const getBuildById = useCallback((buildId) => {
    return builds.find(build => build.id === buildId);
  }, [builds]);

  /**
   * Get builds for a specific car
   */
  const getBuildsByCarSlug = useCallback((carSlug) => {
    return builds.filter(build => build.carSlug === carSlug);
  }, [builds]);

  // Wrapper for refreshBuilds that doesn't require parameters
  const refreshBuilds = useCallback(() => {
    fetchBuilds({ current: false }, true, builds.length);
  }, [fetchBuilds, builds.length]);

  /**
   * Auto-save build with debouncing
   * Called automatically when build state changes - no manual save needed
   * 
   * @param {string} buildId - Existing build ID to update
   * @param {Object} buildData - Full build data to save
   */
  const autoSaveBuild = useCallback((buildId, buildData) => {
    // Clear any pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // Store the pending data
    autoSavePendingRef.current = { buildId, buildData };
    
    // Set status to indicate save is pending
    setAutoSaveStatus('saving');
    setAutoSaveError(null);
    
    // Debounce the actual save
    autoSaveTimerRef.current = setTimeout(async () => {
      const pending = autoSavePendingRef.current;
      if (!pending) return;
      
      const { buildId: id, buildData: data } = pending;
      
      try {
        let result;
        
        if (id) {
          // Update existing build
          result = await updateBuildHandler(id, data);
        } else if (isAuthenticated && user?.id && canSaveBuilds) {
          // Create new build (only for authenticated users with save access)
          result = await saveBuild(data);
        } else {
          // Not authenticated or no save access - save to localStorage
          const localBuild = {
            id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setBuilds(prev => {
            const existing = prev.find(b => b.carSlug === data.carSlug);
            if (existing) {
              return prev.map(b => b.id === existing.id ? { ...b, ...data, updatedAt: new Date().toISOString() } : b);
            }
            return [localBuild, ...prev];
          });
          result = { data: localBuild, error: null };
        }
        
        if (result?.error) {
          console.error('[SavedBuildsProvider] Auto-save failed:', result.error);
          setAutoSaveStatus('error');
          setAutoSaveError(result.error.message || 'Failed to save');
        } else {
          setAutoSaveStatus('saved');
          // Reset status after showing "Saved" briefly
          setTimeout(() => {
            setAutoSaveStatus('idle');
          }, 2000);
        }
      } catch (err) {
        console.error('[SavedBuildsProvider] Auto-save error:', err);
        setAutoSaveStatus('error');
        setAutoSaveError(err.message || 'Unexpected error saving build');
      }
      
      autoSavePendingRef.current = null;
    }, AUTO_SAVE_DEBOUNCE_MS);
  }, [isAuthenticated, user?.id, canSaveBuilds, updateBuildHandler, saveBuild]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const value = {
    builds,
    isLoading,
    canSave: canSaveBuilds, // Tier-gated (Tuner tier required, free during beta)
    saveBuild,
    updateBuild: updateBuildHandler,
    deleteBuild: deleteBuildHandler,
    getBuildById,
    getBuildsByCarSlug,
    refreshBuilds,
    // Auto-save functionality
    autoSaveBuild,
    autoSaveStatus,
    autoSaveError,
    userTier,
    isBeta: IS_BETA,
  };

  return (
    <SavedBuildsContext.Provider value={value}>
      {children}
    </SavedBuildsContext.Provider>
  );
}

/**
 * Hook to access saved builds context
 * @returns {SavedBuildsContextValue}
 */
export function useSavedBuilds() {
  const context = useContext(SavedBuildsContext);
  
  if (!context) {
    throw new Error('useSavedBuilds must be used within a SavedBuildsProvider');
  }
  
  return context;
}

/**
 * Hook to get builds for a specific car
 * @param {string} carSlug 
 * @returns {SavedBuild[]}
 */
export function useCarBuilds(carSlug) {
  const { getBuildsByCarSlug } = useSavedBuilds();
  return getBuildsByCarSlug(carSlug);
}

/**
 * Hook to get build count
 * @returns {number}
 */
export function useSavedBuildCount() {
  const { builds } = useSavedBuilds();
  return builds.length;
}

export default SavedBuildsProvider;
