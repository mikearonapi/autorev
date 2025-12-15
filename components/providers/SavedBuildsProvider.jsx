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

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  fetchUserProjects,
  saveUserProject,
  updateUserProject,
  deleteUserProject,
} from '@/lib/userDataService';
import { hasAccess, IS_BETA } from '@/lib/tierAccess';

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
 * @typedef {Object} SavedBuild
 * @property {string} id - Database ID
 * @property {string} carSlug - Car slug
 * @property {string} carName - Car display name
 * @property {string} name - Build name
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
 */

const SavedBuildsContext = createContext(null);

/**
 * Saved Builds Provider Component
 */
export function SavedBuildsProvider({ children }) {
  const { user, isAuthenticated, isLoading: authLoading, profile } = useAuth();
  const userTier = profile?.subscription_tier || 'free';
  const [builds, setBuilds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const syncedRef = useRef(false);

  // Hydrate from localStorage initially (for SSR/guest users)
  useEffect(() => {
    const localBuilds = loadLocalBuilds();
    setBuilds(localBuilds);
    setIsHydrated(true);
  }, []);

  /**
   * Fetch builds from Supabase
   */
  const fetchBuilds = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      // Not authenticated - load from localStorage
      const localBuilds = loadLocalBuilds();
      setBuilds(localBuilds);
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await fetchUserProjects(user.id);
      
      if (error) {
        console.error('[SavedBuildsProvider] Error fetching builds:', error);
        // Fall back to localStorage
        const localBuilds = loadLocalBuilds();
        setBuilds(localBuilds);
      } else if (data) {
        const transformedBuilds = data.map(build => ({
          id: build.id,
          carSlug: build.car_slug,
          carName: build.car_name,
          name: build.build_name,
          upgrades: build.selected_upgrades || [],
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
            createdAt: p.created_at,
            updatedAt: p.updated_at,
          })) : [],
          totalHpGain: build.total_hp_gain || 0,
          totalCostLow: build.total_cost_low || 0,
          totalCostHigh: build.total_cost_high || 0,
          finalHp: build.final_hp,
          notes: build.notes,
          isFavorite: build.is_favorite || false,
          createdAt: build.created_at,
          updatedAt: build.updated_at,
        }));
        
        setBuilds(transformedBuilds);
        syncedRef.current = true;
      }
    } catch (err) {
      console.error('[SavedBuildsProvider] Unexpected error:', err);
      // Fall back to localStorage
      const localBuilds = loadLocalBuilds();
      setBuilds(localBuilds);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Fetch builds when auth state changes
  useEffect(() => {
    if (authLoading || !isHydrated) return;
    fetchBuilds();
  }, [fetchBuilds, authLoading, isHydrated]);

  // Save to localStorage when builds change (for guests)
  useEffect(() => {
    if (!isHydrated) return;
    
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
          name: data.build_name,
          upgrades: data.selected_upgrades || [],
          parts: Array.isArray(buildData?.selectedParts) ? buildData.selectedParts : [],
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
      upgrades: buildData.selectedUpgrades || buildData.upgrades || [],
      parts: buildData.selectedParts || buildData.parts || [],
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
              name: data.build_name,
              upgrades: data.selected_upgrades || [],
              parts: updates?.selectedParts ? updates.selectedParts : build.parts,
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

  const value = {
    builds,
    isLoading,
    canSave: canSaveBuilds, // Tier-gated (Tuner tier required, free during beta)
    saveBuild,
    updateBuild: updateBuildHandler,
    deleteBuild: deleteBuildHandler,
    getBuildById,
    getBuildsByCarSlug,
    refreshBuilds: fetchBuilds,
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
