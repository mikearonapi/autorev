/**
 * User Data Service
 *
 * Handles CRUD operations for user data in Supabase.
 * Used by providers when user is authenticated.
 *
 * Features:
 * - Request deduplication to prevent duplicate API calls
 * - Optimized for fast garage loading
 *
 * @module lib/userDataService
 * @see docs/SOURCE_OF_TRUTH.md
 */

import { resolveCarId } from './carResolver';
import { supabase, isSupabaseConfigured } from './supabase';

// ============================================================================
// CAR ID NORMALIZATION - SOURCE OF TRUTH: lib/carResolver.js
// ============================================================================
// car_id (UUID) is the ONLY foreign key reference to the cars table.
// All user tables store car_id, never car_slug.
// To get slug: JOIN to cars table via car_id.
// This ensures data integrity and prevents sync issues.

// ============================================================================
// REQUEST DEDUPLICATION
// Prevents multiple simultaneous requests for the same user's data
// ============================================================================
const inFlightRequests = {
  favorites: new Map(), // userId -> Promise
  vehicles: new Map(),
  projects: new Map(),
  compareLists: new Map(),
};

// ============================================================================
// FAVORITES
// ============================================================================

/**
 * Fetch user's favorites from Supabase
 * Uses request deduplication to prevent duplicate API calls
 * Uses JOIN to cars table to get slug (normalized data model)
 * @param {string} userId
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchUserFavorites(userId) {
  const startTime = Date.now();
  console.log('[userDataService] fetchUserFavorites called:', {
    isSupabaseConfigured,
    hasSupabase: !!supabase,
    userId: userId?.slice(0, 8),
  });

  if (!isSupabaseConfigured || !supabase || !userId) {
    console.warn('[userDataService] fetchUserFavorites early return - not configured');
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  // Check for in-flight request (deduplication)
  if (inFlightRequests.favorites.has(userId)) {
    console.log('[userDataService] Waiting for existing favorites request...');
    return inFlightRequests.favorites.get(userId);
  }

  console.log('[userDataService] Making Supabase request for favorites...');

  const requestPromise = (async () => {
    try {
      // JOIN to cars table to get slug (normalized - slug lives only in cars table)
      const { data, error } = await supabase
        .from('user_favorites')
        .select(
          `
          id, user_id, car_id, car_name, car_year, car_hp, car_msrp, created_at,
          cars:car_id (slug, name, year, hp, msrp)
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Flatten the joined data for backward compatibility
      const flattenedData = data?.map((fav) => ({
        ...fav,
        car_slug: fav.cars?.slug || null,
        // Use joined data as fallback for denormalized cache fields
        car_name: fav.car_name || fav.cars?.name,
        car_year: fav.car_year || fav.cars?.year,
        car_hp: fav.car_hp || fav.cars?.hp,
        car_msrp: fav.car_msrp || fav.cars?.msrp,
      }));

      const duration = Date.now() - startTime;
      console.log('[userDataService] fetchUserFavorites result:', {
        dataCount: flattenedData?.length,
        hasError: !!error,
        error: error?.message,
        durationMs: duration,
      });
      return { data: flattenedData, error };
    } catch (err) {
      const duration = Date.now() - startTime;
      console.error('[userDataService] fetchUserFavorites exception:', {
        error: err.message,
        durationMs: duration,
      });
      return { data: null, error: err };
    } finally {
      // Clear from in-flight map when done
      inFlightRequests.favorites.delete(userId);
    }
  })();

  inFlightRequests.favorites.set(userId, requestPromise);
  return requestPromise;
}

/**
 * Add a favorite to Supabase
 * @param {string} userId
 * @param {Object} car - Car data (should include id for best performance)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function addUserFavorite(userId, car) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  // Resolve car_id - use provided id or lookup from slug
  // car_id is the ONLY reference to cars table (normalized)
  const carId = car.id || (await resolveCarId(car.slug));
  if (!carId) {
    console.error('[userDataService] addUserFavorite: Could not resolve car_id');
    return { data: null, error: new Error('Could not resolve car_id') };
  }

  const { data, error } = await supabase
    .from('user_favorites')
    .insert({
      user_id: userId,
      car_id: carId, // car_id is the single source of truth (JOIN for slug/name)
      // Denormalized cache fields for display (optional, can be removed later)
      car_name: car.name,
      car_year: car.year,
      car_hp: car.hp,
      car_msrp: car.msrp,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Remove a favorite from Supabase
 * @param {string} userId
 * @param {string} carSlugOrId - Can be slug (string) or car_id (UUID)
 * @returns {Promise<{error: Error|null}>}
 */
export async function removeUserFavorite(userId, carSlugOrId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { error: new Error('Not configured or not authenticated') };
  }

  // Resolve to car_id (handles both slug and UUID input)
  const carId = await resolveCarId(carSlugOrId);
  if (!carId) {
    console.error(
      '[userDataService] removeUserFavorite: Could not resolve car_id for:',
      carSlugOrId
    );
    return { error: new Error('Could not resolve car_id') };
  }

  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('car_id', carId);

  return { error };
}

/**
 * Sync local favorites to Supabase (on sign in)
 * @param {string} userId
 * @param {Array} localFavorites
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function syncFavoritesToSupabase(userId, localFavorites) {
  if (!isSupabaseConfigured || !supabase || !userId || !localFavorites?.length) {
    return { data: null, error: null };
  }

  // Get existing favorites to avoid duplicates (check by car_id)
  const { data: existing } = await fetchUserFavorites(userId);
  const existingCarIds = new Set(existing?.map((f) => f.car_id).filter(Boolean) || []);

  // Resolve car_ids for all local favorites and filter duplicates
  const newFavorites = [];
  for (const fav of localFavorites) {
    const carId = fav.id || (await resolveCarId(fav.slug));
    if (!carId) {
      console.warn('[userDataService] syncFavorites: Could not resolve car_id for:', fav.slug);
      continue;
    }
    if (existingCarIds.has(carId)) {
      continue; // Already exists
    }
    newFavorites.push({
      user_id: userId,
      car_id: carId, // car_id is the single source of truth
      car_name: fav.name,
      car_year: fav.year,
      car_hp: fav.hp,
      car_msrp: fav.msrp,
    });
  }

  if (newFavorites.length === 0) {
    return { data: existing, error: null };
  }

  const { data, error } = await supabase.from('user_favorites').insert(newFavorites).select();

  if (error) {
    console.error('[UserDataService] Error syncing favorites:', error);
    return { data: existing, error };
  }

  // Return all favorites (existing + new)
  return { data: [...(existing || []), ...(data || [])], error: null };
}

// ============================================================================
// COMPARE LISTS
// ============================================================================

/**
 * Fetch user's compare lists from Supabase
 * @param {string} userId
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchUserCompareLists(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  const { data, error } = await supabase
    .from('user_compare_lists')
    .select('id, user_id, name, car_ids, car_names, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Save a compare list to Supabase
 * @param {string} userId
 * @param {Object} compareList - { name, cars }
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function saveUserCompareList(userId, compareList) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  // Resolve all car_ids from slugs or use provided ids
  const carIds = [];
  for (const car of compareList.cars) {
    const carId = car.id || (await resolveCarId(car.slug));
    if (carId) {
      carIds.push(carId);
    } else {
      console.warn(
        '[userDataService] saveUserCompareList: Could not resolve car_id for:',
        car.slug
      );
    }
  }

  const { data, error } = await supabase
    .from('user_compare_lists')
    .insert({
      user_id: userId,
      name: compareList.name || 'My Comparison',
      car_ids: carIds, // car_ids is the single source of truth
      car_names: compareList.cars.map((c) => c.name), // Denormalized cache for display
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a compare list from Supabase
 * @param {string} userId
 * @param {string} listId
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteUserCompareList(userId, listId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { error: new Error('Not configured or not authenticated') };
  }

  const { error } = await supabase
    .from('user_compare_lists')
    .delete()
    .eq('user_id', userId)
    .eq('id', listId);

  return { error };
}

// ============================================================================
// PROJECTS (formerly SAVED BUILDS)
// ============================================================================

/**
 * Fetch user's projects from Supabase
 * Uses request deduplication to prevent duplicate API calls
 * @param {string} userId
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchUserProjects(userId) {
  console.log('[userDataService] fetchUserProjects called:', {
    isSupabaseConfigured,
    hasSupabase: !!supabase,
    userId: userId?.slice(0, 8),
  });

  if (!isSupabaseConfigured || !supabase || !userId) {
    console.warn('[userDataService] fetchUserProjects early return - not configured');
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  // Check for in-flight request (deduplication)
  if (inFlightRequests.projects.has(userId)) {
    console.log('[userDataService] Waiting for existing projects request...');
    return inFlightRequests.projects.get(userId);
  }

  console.log('[userDataService] Making Supabase request for projects...');

  const requestPromise = (async () => {
    try {
      // Fetch projects with parts, uploaded images, and JOIN to cars for slug
      const { data, error } = await supabase
        .from('user_projects')
        .select(
          `
          *,
          user_project_parts(*),
          user_uploaded_images!user_uploaded_images_user_build_id_fkey(
            id,
            blob_url,
            thumbnail_url,
            is_primary,
            display_order,
            media_type
          ),
          cars:car_id (slug, name)
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Flatten joined data for backward compatibility
      const flattenedData = data?.map((project) => ({
        ...project,
        car_slug: project.cars?.slug || null,
      }));

      console.log('[userDataService] fetchUserProjects result:', {
        dataCount: flattenedData?.length,
        hasError: !!error,
        error: error?.message,
      });
      return { data: flattenedData, error };
    } catch (err) {
      console.error('[userDataService] fetchUserProjects exception:', err.message);
      return { data: null, error: err };
    } finally {
      inFlightRequests.projects.delete(userId);
    }
  })();

  inFlightRequests.projects.set(userId, requestPromise);
  return requestPromise;
}

/**
 * Map UI upgrade categories to valid database part_category enum values.
 * The UI uses simplified categories like 'power', 'chassis', etc.
 * The DB enum has: 'intake', 'exhaust', 'tune', 'forced_induction', 'cooling',
 * 'suspension', 'brakes', 'wheels_tires', 'aero', 'drivetrain', 'fuel_system',
 * 'engine_internal', 'electronics', 'fluids_filters', 'maintenance', 'other'
 */
function mapUiCategoryToDbEnum(uiCategory) {
  if (!uiCategory) return null;

  const categoryMap = {
    // UI category → DB enum
    power: 'engine_internal', // Power category includes engine mods
    forcedInduction: 'forced_induction',
    chassis: 'suspension', // Chassis maps to suspension
    brakes: 'brakes',
    cooling: 'cooling',
    wheels: 'wheels_tires',
    aero: 'aero',
    drivetrain: 'drivetrain',
    // Direct matches (already valid enum values)
    intake: 'intake',
    exhaust: 'exhaust',
    tune: 'tune',
    forced_induction: 'forced_induction',
    suspension: 'suspension',
    wheels_tires: 'wheels_tires',
    fuel_system: 'fuel_system',
    engine_internal: 'engine_internal',
    electronics: 'electronics',
    fluids_filters: 'fluids_filters',
    maintenance: 'maintenance',
    other: 'other',
  };

  const normalized = uiCategory.toLowerCase().replace(/[_-]/g, '');

  // Check direct mapping first
  if (categoryMap[uiCategory]) {
    return categoryMap[uiCategory];
  }

  // Check normalized version
  for (const [key, value] of Object.entries(categoryMap)) {
    if (key.toLowerCase().replace(/[_-]/g, '') === normalized) {
      return value;
    }
  }

  // Default to 'other' for unknown categories
  return 'other';
}

function normalizeSelectedPartsForDb(selectedParts, projectId) {
  if (!Array.isArray(selectedParts) || selectedParts.length === 0) return [];

  return selectedParts
    .map((p) => {
      // For user-entered parts (from PartsSelector), set part_id to null
      // The part_id FK constraint requires it to exist in the parts table,
      // so user-entered parts use null and rely on snapshot fields instead
      let partId = p?.part_id || p?.partId;
      if (!partId || (typeof partId === 'string' && partId.startsWith('temp_'))) {
        // User-entered part - set to null (part details stored in snapshot fields)
        partId = null;
      }

      const latestPrice = p?.latest_price || p?.latestPrice || p?.price || p?.pricing || null;
      const fitment = p?.fitment || p?.fitmentSnapshot || null;

      // Convert price from dollars to cents if needed
      let priceCents = null;
      if (Number.isFinite(Number(latestPrice?.price_cents))) {
        priceCents = Math.trunc(Number(latestPrice.price_cents));
      } else if (Number.isFinite(Number(p?.price_cents))) {
        priceCents = Math.trunc(Number(p.price_cents));
      } else if (Number.isFinite(Number(p?.price))) {
        // Convert dollars to cents
        priceCents = Math.trunc(Number(p.price) * 100);
      }

      return {
        project_id: projectId,
        part_id: partId,
        quantity: Number.isFinite(Number(p?.quantity))
          ? Math.max(1, Math.trunc(Number(p.quantity)))
          : 1,

        part_name: p?.part_name || p?.partName || p?.name || null,
        brand_name: p?.brand_name || p?.brandName || null,
        part_number: p?.part_number || p?.partNumber || null,
        category: mapUiCategoryToDbEnum(p?.category || p?.upgradeKey),

        vendor_name:
          latestPrice?.vendor_name ||
          latestPrice?.vendorName ||
          p?.vendor_name ||
          p?.vendorName ||
          null,
        product_url:
          latestPrice?.product_url ||
          latestPrice?.productUrl ||
          p?.product_url ||
          p?.productUrl ||
          null,
        currency: latestPrice?.currency || p?.currency || 'USD',
        price_cents: priceCents,
        price_recorded_at:
          latestPrice?.recorded_at ||
          latestPrice?.recordedAt ||
          p?.price_recorded_at ||
          p?.priceRecordedAt ||
          null,

        requires_tune:
          typeof fitment?.requires_tune === 'boolean'
            ? fitment.requires_tune
            : typeof p?.requires_tune === 'boolean'
              ? p.requires_tune
              : null,
        install_difficulty: fitment?.install_difficulty || p?.install_difficulty || null,
        estimated_labor_hours: fitment?.estimated_labor_hours ?? p?.estimated_labor_hours ?? null,
        fitment_verified:
          typeof fitment?.verified === 'boolean'
            ? fitment.verified
            : typeof p?.fitment_verified === 'boolean'
              ? p.fitment_verified
              : null,
        fitment_confidence: fitment?.confidence ?? p?.fitment_confidence ?? null,
        fitment_notes: p?.notes || fitment?.fitment_notes || p?.fitment_notes || null,
        fitment_source_url: fitment?.source_url || p?.fitment_source_url || null,

        metadata:
          p?.metadata && typeof p.metadata === 'object'
            ? p.metadata
            : { upgradeKey: p?.upgradeKey, upgradeName: p?.upgradeName },
      };
    })
    .filter(Boolean);
}

async function replaceUserProjectParts(userId, projectId, selectedParts) {
  if (!isSupabaseConfigured || !supabase || !userId || !projectId) {
    console.error('[userDataService] replaceUserProjectParts - not configured');
    return { error: new Error('Not configured or not authenticated') };
  }

  console.log('[userDataService] replaceUserProjectParts:', {
    projectId,
    inputPartsCount: selectedParts?.length,
  });

  const rows = normalizeSelectedPartsForDb(selectedParts, projectId);

  console.log('[userDataService] Normalized rows:', {
    count: rows.length,
    upgradeKeys: rows.map((r) => r.metadata?.upgradeKey),
  });

  // Replace strategy (simple + deterministic):
  // - delete existing project parts
  // - insert the new selection
  const { error: delErr } = await supabase
    .from('user_project_parts')
    .delete()
    .eq('project_id', projectId);
  if (delErr) {
    console.error('[userDataService] Failed to delete existing parts:', delErr);
    return { error: delErr };
  }

  if (rows.length === 0) {
    console.log('[userDataService] No rows to insert, returning');
    return { error: null };
  }

  const { error: insErr } = await supabase.from('user_project_parts').insert(rows);
  if (insErr) {
    console.error('[userDataService] Failed to insert parts:', insErr);
    return { error: insErr };
  }

  console.log('[userDataService] Parts saved successfully');
  return { error: null };
}

/**
 * Save a project to Supabase
 * @param {string} userId
 * @param {Object} project
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function saveUserProject(userId, project) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  // Resolve car_id - use provided id or lookup from slug
  // car_id is the ONLY reference to cars table (normalized)
  const carId = project.carId || project.car_id || (await resolveCarId(project.carSlug));
  if (!carId) {
    console.error('[userDataService] saveUserProject: Could not resolve car_id');
    return { data: null, error: new Error('Could not resolve car_id') };
  }

  // Build the selected_upgrades JSONB with factory config, wheel fitment, and upgrade keys
  const selectedUpgradesData = {
    upgrades: project.selectedUpgrades || project.upgrades || [],
    // Build objective (track, street, show, daily)
    goal: project.goal || null,
    // Factory configuration (transmission, drivetrain, wheel package, etc.)
    factoryConfig: project.factoryConfig || null,
    // Selected wheel/tire fitment
    wheelFitment: project.wheelFitment || null,
    // Size selections for parts with variants
    sizeSelections: project.sizeSelections || null,
    // Hero image settings - 'stock' or 'uploaded'
    heroSource: project.heroSource || 'stock',
    heroImageId: project.heroImageId || null,
    // Tuner mode: 'basic' or 'advanced' - determines which HP calculation was used
    tunerMode: project.tunerMode || 'basic',
    // Advanced specs if user was in advanced mode (for recalculation reference)
    advancedSpecs: project.advancedSpecs || null,
  };

  const { data, error } = await supabase
    .from('user_projects')
    .insert({
      user_id: userId,
      car_id: carId, // car_id is the single source of truth (JOIN for slug/name)
      car_name: project.carName, // Denormalized cache for display
      project_name: project.name || 'Untitled Project',
      selected_upgrades: selectedUpgradesData,
      total_hp_gain: project.totalHpGain || 0,
      total_cost_low: project.totalCostLow || 0,
      total_cost_high: project.totalCostHigh || 0,
      final_hp: project.finalHp,
      notes: project.notes,
      // Performance metrics snapshot (for consistent community display)
      stock_hp: project.stockHp || null,
      stock_zero_to_sixty: project.stockZeroToSixty || null,
      stock_braking_60_0: project.stockBraking60To0 || null,
      stock_lateral_g: project.stockLateralG || null,
      final_zero_to_sixty: project.finalZeroToSixty || null,
      final_braking_60_0: project.finalBraking60To0 || null,
      final_lateral_g: project.finalLateralG || null,
      zero_to_sixty_improvement: project.zeroToSixtyImprovement || null,
      braking_improvement: project.brakingImprovement || null,
      lateral_g_improvement: project.lateralGImprovement || null,
    })
    .select()
    .single();

  if (!error && data && project?.selectedParts) {
    const { error: partsErr } = await replaceUserProjectParts(
      userId,
      data.id,
      project.selectedParts
    );
    if (partsErr) {
      console.warn('[userDataService] Saved project but failed to save selected parts:', partsErr);
      return { data, error: partsErr };
    }
  }

  return { data, error };
}

/**
 * Update a project
 * Merges updates with existing data to prevent race conditions between concurrent saves.
 *
 * @param {string} userId
 * @param {string} projectId
 * @param {Object} updates
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateUserProject(userId, projectId, updates) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  // RACE CONDITION FIX: Fetch existing project data to merge with updates
  // This prevents MyBuild and MyParts from overwriting each other's changes
  let existingSelectedUpgrades = {};
  if (
    updates.selectedUpgrades ||
    updates.upgrades ||
    updates.goal !== undefined ||
    updates.factoryConfig !== undefined ||
    updates.wheelFitment !== undefined
  ) {
    const { data: existing } = await supabase
      .from('user_projects')
      .select('selected_upgrades')
      .eq('user_id', userId)
      .eq('id', projectId)
      .single();

    if (existing?.selected_upgrades) {
      existingSelectedUpgrades = existing.selected_upgrades;
    }
  }

  // Build the selected_upgrades JSONB by merging existing data with updates
  // Only include fields that are explicitly provided in updates
  const selectedUpgradesData =
    updates.selectedUpgrades ||
    updates.upgrades ||
    updates.goal !== undefined ||
    updates.factoryConfig !== undefined ||
    updates.wheelFitment !== undefined ||
    updates.sizeSelections !== undefined ||
    updates.heroSource !== undefined ||
    updates.heroImageId !== undefined ||
    updates.tunerMode !== undefined ||
    updates.advancedSpecs !== undefined
      ? {
          // Start with existing data
          ...existingSelectedUpgrades,
          // Override only fields that are explicitly provided
          ...(updates.selectedUpgrades || updates.upgrades
            ? { upgrades: updates.selectedUpgrades || updates.upgrades }
            : {}),
          ...(updates.goal !== undefined ? { goal: updates.goal } : {}),
          ...(updates.factoryConfig !== undefined ? { factoryConfig: updates.factoryConfig } : {}),
          ...(updates.wheelFitment !== undefined ? { wheelFitment: updates.wheelFitment } : {}),
          ...(updates.sizeSelections !== undefined
            ? { sizeSelections: updates.sizeSelections }
            : {}),
          ...(updates.heroSource !== undefined ? { heroSource: updates.heroSource } : {}),
          ...(updates.heroImageId !== undefined ? { heroImageId: updates.heroImageId } : {}),
          ...(updates.tunerMode !== undefined ? { tunerMode: updates.tunerMode } : {}),
          ...(updates.advancedSpecs !== undefined ? { advancedSpecs: updates.advancedSpecs } : {}),
        }
      : undefined;

  // Build update object with ONLY defined fields
  // This prevents accidentally setting fields to NULL when they weren't provided
  const updateData = {};

  if (updates.name !== undefined) updateData.project_name = updates.name;
  if (selectedUpgradesData !== undefined) updateData.selected_upgrades = selectedUpgradesData;
  if (updates.totalHpGain !== undefined) updateData.total_hp_gain = updates.totalHpGain;
  if (updates.totalCostLow !== undefined) updateData.total_cost_low = updates.totalCostLow;
  if (updates.totalCostHigh !== undefined) updateData.total_cost_high = updates.totalCostHigh;
  if (updates.finalHp !== undefined) updateData.final_hp = updates.finalHp;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.isFavorite !== undefined) updateData.is_favorite = updates.isFavorite;
  // Performance metrics snapshot
  if (updates.stockHp !== undefined) updateData.stock_hp = updates.stockHp;
  if (updates.stockZeroToSixty !== undefined)
    updateData.stock_zero_to_sixty = updates.stockZeroToSixty;
  if (updates.stockBraking60To0 !== undefined)
    updateData.stock_braking_60_0 = updates.stockBraking60To0;
  if (updates.stockLateralG !== undefined) updateData.stock_lateral_g = updates.stockLateralG;
  if (updates.finalZeroToSixty !== undefined)
    updateData.final_zero_to_sixty = updates.finalZeroToSixty;
  if (updates.finalBraking60To0 !== undefined)
    updateData.final_braking_60_0 = updates.finalBraking60To0;
  if (updates.finalLateralG !== undefined) updateData.final_lateral_g = updates.finalLateralG;
  if (updates.zeroToSixtyImprovement !== undefined)
    updateData.zero_to_sixty_improvement = updates.zeroToSixtyImprovement;
  if (updates.brakingImprovement !== undefined)
    updateData.braking_improvement = updates.brakingImprovement;
  if (updates.lateralGImprovement !== undefined)
    updateData.lateral_g_improvement = updates.lateralGImprovement;

  // If ONLY selectedParts was provided (no other fields to update),
  // skip the main table update and go directly to parts update
  const hasMainTableUpdates = Object.keys(updateData).length > 0;

  let data = null;
  let error = null;

  if (hasMainTableUpdates) {
    const result = await supabase
      .from('user_projects')
      .update(updateData)
      .eq('user_id', userId)
      .eq('id', projectId)
      .select()
      .single();

    data = result.data;
    error = result.error;
  }

  if (!error && updates?.selectedParts) {
    const { error: partsErr } = await replaceUserProjectParts(
      userId,
      projectId,
      updates.selectedParts
    );
    if (partsErr) {
      console.warn(
        '[userDataService] Updated project but failed to save selected parts:',
        partsErr
      );
      return { data, error: partsErr };
    }
  }

  return { data, error };
}

/**
 * Delete a project
 * @param {string} userId
 * @param {string} projectId
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteUserProject(userId, projectId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { error: new Error('Not configured or not authenticated') };
  }

  const { error } = await supabase
    .from('user_projects')
    .delete()
    .eq('user_id', userId)
    .eq('id', projectId);

  return { error };
}

// ============================================================================
// USER VEHICLES
// ============================================================================

/**
 * Fetch user's vehicles from Supabase
 * Uses request deduplication to prevent duplicate API calls
 * @param {string} userId
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchUserVehicles(userId) {
  console.log('[userDataService] fetchUserVehicles called:', {
    isSupabaseConfigured,
    hasSupabase: !!supabase,
    userId: userId?.slice(0, 8),
  });

  if (!isSupabaseConfigured || !supabase || !userId) {
    console.warn('[userDataService] fetchUserVehicles early return - not configured');
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  // Check for in-flight request (deduplication)
  if (inFlightRequests.vehicles.has(userId)) {
    console.log('[userDataService] Waiting for existing vehicles request...');
    return inFlightRequests.vehicles.get(userId);
  }

  console.log('[userDataService] Making Supabase request for vehicles...');

  const requestPromise = (async () => {
    try {
      // JOIN to cars table to get slug (normalized - slug lives only in cars table)
      const { data, error } = await supabase
        .from('user_vehicles')
        .select(
          `
          *,
          daily_driver_enrichments (
            id,
            maintenance_specs,
            service_intervals,
            known_issues,
            image_url,
            status
          ),
          cars:matched_car_id (slug, name)
        `
        )
        .eq('user_id', userId)
        // Note: Final sort order is applied client-side in OwnedVehiclesProvider
        // to handle display_order=0 (unordered) vehicles correctly
        .order('created_at', { ascending: false });

      // Flatten the joined data for backward compatibility
      const flattenedData = data?.map((vehicle) => ({
        ...vehicle,
        matched_car_slug: vehicle.cars?.slug || null,
      }));

      console.log('[userDataService] fetchUserVehicles result:', {
        dataCount: flattenedData?.length,
        hasError: !!error,
        error: error?.message,
      });
      return { data: flattenedData, error };
    } catch (err) {
      console.error('[userDataService] fetchUserVehicles exception:', err.message);
      return { data: null, error: err };
    } finally {
      inFlightRequests.vehicles.delete(userId);
    }
  })();

  inFlightRequests.vehicles.set(userId, requestPromise);
  return requestPromise;
}

/**
 * Add a vehicle to user's garage
 * @param {string} userId
 * @param {Object} vehicle
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function addUserVehicle(userId, vehicle) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  // Resolve matched_car_id - use provided id or lookup from slug
  // matched_car_id is the ONLY reference to cars table (normalized)
  const matchedCarId =
    vehicle.matchedCarId || vehicle.matched_car_id || (await resolveCarId(vehicle.matchedCarSlug));
  // Note: matchedCarId can be null for vehicles without a match yet

  const { data, error } = await supabase
    .from('user_vehicles')
    .insert({
      user_id: userId,
      vin: vehicle.vin,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      matched_car_id: matchedCarId, // car_id is the single source of truth (JOIN for slug/name)
      matched_car_variant_id: vehicle.matchedCarVariantId,
      matched_car_variant_key: vehicle.matchedCarVariantKey,
      vin_match_confidence: vehicle.vinMatchConfidence,
      vin_match_notes: vehicle.vinMatchNotes,
      vin_matched_at: vehicle.vinMatchedAt,
      nickname: vehicle.nickname,
      color: vehicle.color,
      mileage: vehicle.mileage,
      purchase_date: vehicle.purchaseDate,
      purchase_price: vehicle.purchasePrice,
      is_primary: vehicle.isPrimary || false,
      notes: vehicle.notes,
      vin_decode_data: vehicle.vinDecodeData,
      vin_decoded_at: vehicle.vinDecodeData ? new Date().toISOString() : null,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Update a user vehicle
 * @param {string} userId
 * @param {string} vehicleId
 * @param {Object} updates
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateUserVehicle(userId, vehicleId, updates) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  const { data, error } = await supabase
    .from('user_vehicles')
    .update(updates)
    .eq('user_id', userId)
    .eq('id', vehicleId)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a user vehicle
 * @param {string} userId
 * @param {string} vehicleId
 * @returns {Promise<{error: Error|null}>}
 */
export async function deleteUserVehicle(userId, vehicleId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { error: new Error('Not configured or not authenticated') };
  }

  const { error } = await supabase
    .from('user_vehicles')
    .delete()
    .eq('user_id', userId)
    .eq('id', vehicleId);

  return { error };
}

// ============================================================================
// VEHICLE MODIFICATIONS
// ============================================================================

/**
 * Apply modifications to a user vehicle
 * @param {string} userId
 * @param {string} vehicleId
 * @param {Object} modifications - { upgrades: string[], totalHpGain: number, buildId?: string }
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function applyVehicleModifications(userId, vehicleId, modifications) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  const { upgrades = [], totalHpGain = 0, buildId = null } = modifications;

  const { data, error } = await supabase
    .from('user_vehicles')
    .update({
      installed_modifications: upgrades,
      total_hp_gain: totalHpGain,
      active_build_id: buildId,
      modified_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('id', vehicleId)
    .select()
    .single();

  return { data, error };
}

/**
 * Clear all modifications from a vehicle (reset to stock)
 * @param {string} userId
 * @param {string} vehicleId
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function clearVehicleModifications(userId, vehicleId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  const { data, error } = await supabase
    .from('user_vehicles')
    .update({
      installed_modifications: [],
      total_hp_gain: 0,
      active_build_id: null,
      modified_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('id', vehicleId)
    .select()
    .single();

  return { data, error };
}

/**
 * Apply a saved build/project to a vehicle
 * Fetches the build's upgrades and applies them to the vehicle
 * @param {string} userId
 * @param {string} vehicleId
 * @param {string} buildId - user_projects.id
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function applyBuildToVehicle(userId, vehicleId, buildId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  // First, fetch the build to get upgrades and HP gain
  const { data: build, error: buildError } = await supabase
    .from('user_projects')
    .select('selected_upgrades, total_hp_gain')
    .eq('user_id', userId)
    .eq('id', buildId)
    .single();

  if (buildError || !build) {
    return { data: null, error: buildError || new Error('Build not found') };
  }

  // Extract upgrade keys from build
  // selected_upgrades can be:
  // - { upgrades: [...], wheelFitment: {...} } (object format)
  // - [...] (array format, legacy)
  // installed_modifications should ALWAYS be an array of upgrade keys (strings)
  const selectedUpgrades = build.selected_upgrades;
  const upgradeKeys = Array.isArray(selectedUpgrades)
    ? selectedUpgrades
    : selectedUpgrades?.upgrades || [];

  // Apply the build's upgrades to the vehicle
  const { data, error } = await supabase
    .from('user_vehicles')
    .update({
      installed_modifications: upgradeKeys,
      total_hp_gain: build.total_hp_gain || 0,
      active_build_id: buildId,
      modified_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('id', vehicleId)
    .select()
    .single();

  return { data, error };
}

/**
 * Get a vehicle with its modifications
 * @param {string} userId
 * @param {string} vehicleId
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function fetchVehicleWithModifications(userId, vehicleId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  const { data, error } = await supabase
    .from('user_vehicles')
    .select(
      `
      *,
      active_build:user_projects(id, project_name, selected_upgrades, total_hp_gain)
    `
    )
    .eq('user_id', userId)
    .eq('id', vehicleId)
    .single();

  return { data, error };
}

// ============================================================================
// CUSTOM SPECS (User-Specific Modification Details)
// ============================================================================

/**
 * Update custom specs for a user vehicle
 * Custom specs override stock values when displaying vehicle information.
 *
 * @param {string} userId
 * @param {string} vehicleId
 * @param {Object} customSpecs - Object containing user-specific specs
 * @param {Object} [customSpecs.wheels] - Wheel specifications
 * @param {Object} [customSpecs.tires] - Tire specifications
 * @param {Object} [customSpecs.suspension] - Suspension specs
 * @param {Object} [customSpecs.brakes] - Brake specs
 * @param {Object} [customSpecs.engine] - Engine/fluid specs
 * @param {Object} [customSpecs.other] - Other custom specs
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 *
 * @example
 * await updateVehicleCustomSpecs(userId, vehicleId, {
 *   wheels: {
 *     front: { size: '19x9.5', offset: '+22', brand: 'Volk', model: 'TE37' },
 *     rear: { size: '19x10.5', offset: '+25', brand: 'Volk', model: 'TE37' }
 *   },
 *   tires: {
 *     front: { size: '265/35R19', brand: 'Michelin', model: 'PS4S', pressure: '36' },
 *     rear: { size: '295/35R19', brand: 'Michelin', model: 'PS4S', pressure: '38' }
 *   }
 * });
 */
export async function updateVehicleCustomSpecs(userId, vehicleId, customSpecs) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  // Clean empty strings and null values from the specs object
  const cleanedSpecs = cleanCustomSpecs(customSpecs);

  const { data, error } = await supabase
    .from('user_vehicles')
    .update({
      custom_specs: cleanedSpecs,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('id', vehicleId)
    .select()
    .single();

  return { data, error };
}

/**
 * Update a specific section of custom specs (merge with existing)
 *
 * @param {string} userId
 * @param {string} vehicleId
 * @param {string} section - Section key (wheels, tires, suspension, brakes, engine, other)
 * @param {Object} sectionData - Data to merge into that section
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateVehicleCustomSpecsSection(userId, vehicleId, section, sectionData) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  // First fetch existing custom_specs
  const { data: existing, error: fetchError } = await supabase
    .from('user_vehicles')
    .select('custom_specs')
    .eq('user_id', userId)
    .eq('id', vehicleId)
    .single();

  if (fetchError) {
    return { data: null, error: fetchError };
  }

  // Merge the section data
  const currentSpecs = existing?.custom_specs || {};
  const updatedSpecs = {
    ...currentSpecs,
    [section]: {
      ...(currentSpecs[section] || {}),
      ...sectionData,
    },
  };

  // Clean and save
  const cleanedSpecs = cleanCustomSpecs(updatedSpecs);

  const { data, error } = await supabase
    .from('user_vehicles')
    .update({
      custom_specs: cleanedSpecs,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('id', vehicleId)
    .select()
    .single();

  return { data, error };
}

/**
 * Clear custom specs for a vehicle (reset to showing stock specs)
 *
 * @param {string} userId
 * @param {string} vehicleId
 * @param {string} [section] - Optional: clear only a specific section
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function clearVehicleCustomSpecs(userId, vehicleId, section = null) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  let newSpecs = {};

  if (section) {
    // Clear only the specified section
    const { data: existing, error: fetchError } = await supabase
      .from('user_vehicles')
      .select('custom_specs')
      .eq('user_id', userId)
      .eq('id', vehicleId)
      .single();

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    newSpecs = { ...(existing?.custom_specs || {}) };
    delete newSpecs[section];
  }

  const { data, error } = await supabase
    .from('user_vehicles')
    .update({
      custom_specs: newSpecs,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('id', vehicleId)
    .select()
    .single();

  return { data, error };
}

/**
 * Get merged specs for a vehicle (stock + custom)
 * Uses the database function for consistent results
 *
 * @param {string} vehicleId
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function getVehicleMergedSpecs(vehicleId) {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase not configured') };
  }

  const { data, error } = await supabase.rpc('get_vehicle_merged_specs', {
    p_vehicle_id: vehicleId,
  });

  return { data, error };
}

/**
 * Clean custom specs object - remove empty strings and null values recursively
 * @param {Object} specs
 * @returns {Object}
 */
function cleanCustomSpecs(specs) {
  if (!specs || typeof specs !== 'object') return {};

  const cleaned = {};

  for (const [key, value] of Object.entries(specs)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      const cleanedNested = cleanCustomSpecs(value);
      if (Object.keys(cleanedNested).length > 0) {
        cleaned[key] = cleanedNested;
      }
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

// ============================================================================
// ACTIVITY TRACKING
// ============================================================================

/**
 * Log user activity
 * @param {Object} activity
 * @returns {Promise<{error: Error|null}>}
 */
export async function logActivity(activity) {
  if (!isSupabaseConfigured || !supabase) {
    return { error: null }; // Silently fail if not configured
  }

  const { error } = await supabase.from('user_activity').insert({
    user_id: activity.userId || null,
    session_id: activity.sessionId,
    event_type: activity.eventType,
    event_data: activity.eventData || {},
  });

  if (error) {
    console.warn('[UserDataService] Failed to log activity:', error);
  }

  return { error };
}

/**
 * Fetch user activity stats
 * @param {string} userId
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function fetchUserActivityStats(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  // Get counts by event type
  const { data, error } = await supabase
    .from('user_activity')
    .select('event_type')
    .eq('user_id', userId);

  if (error) {
    return { data: null, error };
  }

  // Aggregate counts
  const stats = {
    carsViewed: 0,
    carsFavorited: 0,
    comparisons: 0,
    buildsSaved: 0,
    total: data?.length || 0,
  };

  data?.forEach((activity) => {
    switch (activity.event_type) {
      case 'car_viewed':
        stats.carsViewed++;
        break;
      case 'car_favorited':
        stats.carsFavorited++;
        break;
      case 'comparison_completed':
        stats.comparisons++;
        break;
      case 'build_saved':
        stats.buildsSaved++;
        break;
    }
  });

  return { data: stats, error: null };
}
