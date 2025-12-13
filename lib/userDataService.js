/**
 * User Data Service
 * 
 * Handles CRUD operations for user data in Supabase.
 * Used by providers when user is authenticated.
 * 
 * @module lib/userDataService
 */

import { supabase, isSupabaseConfigured } from './supabase';

// ============================================================================
// FAVORITES
// ============================================================================

/**
 * Fetch user's favorites from Supabase
 * @param {string} userId 
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchUserFavorites(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  const { data, error } = await supabase
    .from('user_favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Add a favorite to Supabase
 * @param {string} userId 
 * @param {Object} car - Car data
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function addUserFavorite(userId, car) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  const { data, error } = await supabase
    .from('user_favorites')
    .insert({
      user_id: userId,
      car_slug: car.slug,
      car_name: car.name,
      car_years: car.years,
      car_hp: car.hp,
      car_price_range: car.priceRange,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Remove a favorite from Supabase
 * @param {string} userId 
 * @param {string} carSlug 
 * @returns {Promise<{error: Error|null}>}
 */
export async function removeUserFavorite(userId, carSlug) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { error: new Error('Not configured or not authenticated') };
  }

  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('car_slug', carSlug);

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

  // Get existing favorites to avoid duplicates
  const { data: existing } = await fetchUserFavorites(userId);
  const existingSlugs = new Set(existing?.map(f => f.car_slug) || []);

  // Filter out duplicates
  const newFavorites = localFavorites
    .filter(fav => !existingSlugs.has(fav.slug))
    .map(fav => ({
      user_id: userId,
      car_slug: fav.slug,
      car_name: fav.name,
      car_years: fav.years,
      car_hp: fav.hp,
      car_price_range: fav.priceRange,
    }));

  if (newFavorites.length === 0) {
    return { data: existing, error: null };
  }

  const { data, error } = await supabase
    .from('user_favorites')
    .insert(newFavorites)
    .select();

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
    .select('*')
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

  const { data, error } = await supabase
    .from('user_compare_lists')
    .insert({
      user_id: userId,
      name: compareList.name || 'My Comparison',
      car_slugs: compareList.cars.map(c => c.slug),
      car_names: compareList.cars.map(c => c.name),
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
 * @param {string} userId 
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchUserProjects(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  const { data, error } = await supabase
    .from('user_projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
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

  const { data, error } = await supabase
    .from('user_projects')
    .insert({
      user_id: userId,
      car_slug: project.carSlug,
      car_name: project.carName,
      project_name: project.name || 'Untitled Project',
      selected_upgrades: project.selectedUpgrades || project.upgrades || [],
      total_hp_gain: project.totalHpGain || 0,
      total_cost_low: project.totalCostLow || 0,
      total_cost_high: project.totalCostHigh || 0,
      final_hp: project.finalHp,
      notes: project.notes,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Update a project
 * @param {string} userId 
 * @param {string} projectId 
 * @param {Object} updates 
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateUserProject(userId, projectId, updates) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  const { data, error } = await supabase
    .from('user_projects')
    .update({
      project_name: updates.name,
      selected_upgrades: updates.selectedUpgrades || updates.upgrades,
      total_hp_gain: updates.totalHpGain,
      total_cost_low: updates.totalCostLow,
      total_cost_high: updates.totalCostHigh,
      final_hp: updates.finalHp,
      notes: updates.notes,
      is_favorite: updates.isFavorite,
    })
    .eq('user_id', userId)
    .eq('id', projectId)
    .select()
    .single();

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

// Legacy aliases for backward compatibility during transition
// TODO: Remove these after updating all consumers
export const fetchUserSavedBuilds = fetchUserProjects;
export const saveUserBuild = saveUserProject;
export const updateUserBuild = updateUserProject;
export const deleteUserBuild = deleteUserProject;

// ============================================================================
// USER VEHICLES
// ============================================================================

/**
 * Fetch user's vehicles from Supabase
 * @param {string} userId 
 * @returns {Promise<{data: Array|null, error: Error|null}>}
 */
export async function fetchUserVehicles(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) {
    return { data: null, error: new Error('Not configured or not authenticated') };
  }

  const { data, error } = await supabase
    .from('user_vehicles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return { data, error };
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

  const { data, error } = await supabase
    .from('user_vehicles')
    .insert({
      user_id: userId,
      vin: vehicle.vin,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      matched_car_slug: vehicle.matchedCarSlug,
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

  const { error } = await supabase
    .from('user_activity')
    .insert({
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

  data?.forEach(activity => {
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
