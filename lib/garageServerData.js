/**
 * Server-Side Data Fetching for Garage Page
 * 
 * Fetches user data during SSR for the /garage page to enable
 * near-instant content visibility (<300ms).
 * 
 * This module uses @supabase/ssr to read cookies and fetch authenticated
 * user data on the server, passing it as initialData to client components.
 * 
 * @module lib/garageServerData
 */

import { createServerSupabaseClient, getAuthenticatedUser } from './supabaseServer';

/**
 * Transform favorites from DB format to client format
 */
function transformFavorites(rows) {
  return rows.map(f => ({
    slug: f.car_slug,
    name: f.car_name,
    years: f.car_years,
    hp: f.car_hp,
    priceRange: f.car_price_range,
    addedAt: new Date(f.created_at).getTime(),
  }));
}

/**
 * Transform vehicles from DB format to client format
 */
function transformVehicles(rows) {
  return rows.map(row => {
    const installedMods = row.installed_modifications || [];
    const customSpecs = row.custom_specs || {};
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
      installedModifications: installedMods,
      activeBuildId: row.active_build_id,
      totalHpGain: row.total_hp_gain || 0,
      modifiedAt: row.modified_at,
      isModified: Array.isArray(installedMods) && installedMods.length > 0,
      customSpecs: customSpecs,
      hasCustomSpecs: Object.keys(customSpecs).length > 0,
    };
  });
}

/**
 * Transform builds from DB format to client format
 */
function transformBuilds(rows) {
  return rows.map(build => ({
    id: build.id,
    carSlug: build.car_slug,
    carName: build.car_name,
    name: build.project_name,
    upgrades: Array.isArray(build.selected_upgrades) 
      ? build.selected_upgrades 
      : (build.selected_upgrades?.upgrades || []),
    factoryConfig: build.selected_upgrades?.factoryConfig || null,
    wheelFitment: build.selected_upgrades?.wheelFitment || null,
    sizeSelections: build.selected_upgrades?.sizeSelections || null,
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
}

/**
 * Fetch all garage data for a user during SSR
 * 
 * This function runs on the server during SSR and fetches:
 * - User's favorites
 * - User's owned vehicles
 * - User's saved builds
 * - User's profile (for tier checks)
 * 
 * Returns null values for anonymous users (no error, just empty data).
 * 
 * @returns {Promise<{
 *   user: object|null,
 *   profile: object|null,
 *   favorites: Array,
 *   vehicles: Array,
 *   builds: Array,
 *   error: Error|null
 * }>}
 */
export async function getGarageServerData() {
  const startTime = Date.now();
  
  try {
    const supabase = await createServerSupabaseClient();
    
    if (!supabase) {
      console.log('[garageServerData] Supabase not configured, returning empty data');
      return {
        user: null,
        profile: null,
        favorites: [],
        vehicles: [],
        builds: [],
        error: null,
      };
    }

    // Get authenticated user (validates JWT on server - secure)
    const { user, error: userError } = await getAuthenticatedUser();
    
    if (userError || !user) {
      console.log('[garageServerData] No authenticated user, returning empty data');
      return {
        user: null,
        profile: null,
        favorites: [],
        vehicles: [],
        builds: [],
        error: null, // Not an error - just anonymous
      };
    }

    console.log('[garageServerData] Fetching data for user:', user.id.slice(0, 8) + '...');

    // Fetch all data in parallel for maximum speed
    const [
      favoritesResult,
      vehiclesResult,
      buildsResult,
      profileResult,
    ] = await Promise.all([
      supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      
      supabase
        .from('user_owned_vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      
      supabase
        .from('user_projects')
        .select(`
          *,
          user_project_parts(*)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false }),
      
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
    ]);

    const duration = Date.now() - startTime;
    console.log('[garageServerData] SSR data fetch complete:', {
      durationMs: duration,
      favorites: favoritesResult.data?.length || 0,
      vehicles: vehiclesResult.data?.length || 0,
      builds: buildsResult.data?.length || 0,
      hasProfile: !!profileResult.data,
    });

    // Transform data to client format
    const favorites = favoritesResult.data ? transformFavorites(favoritesResult.data) : [];
    const vehicles = vehiclesResult.data ? transformVehicles(vehiclesResult.data) : [];
    const builds = buildsResult.data ? transformBuilds(buildsResult.data) : [];

    return {
      user,
      profile: profileResult.data || null,
      favorites,
      vehicles,
      builds,
      error: null,
    };
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error('[garageServerData] SSR fetch error:', {
      error: err.message,
      durationMs: duration,
    });
    
    // Return empty data on error - client will fallback to normal fetch
    return {
      user: null,
      profile: null,
      favorites: [],
      vehicles: [],
      builds: [],
      error: err,
    };
  }
}

/**
 * Serialize SSR data for passing to client components
 * 
 * Ensures data is safe to serialize to JSON (removes functions, symbols, etc.)
 * 
 * @param {object} data - The data from fetchGarageDataSSR
 * @returns {object} - Serializable data
 */
export function serializeGarageData(data) {
  return {
    user: data.user ? {
      id: data.user.id,
      email: data.user.email,
      // Include only serializable user metadata
      user_metadata: data.user.user_metadata || {},
    } : null,
    profile: data.profile,
    favorites: data.favorites,
    vehicles: data.vehicles,
    builds: data.builds,
    // Don't serialize error objects - just note if there was one
    hadError: !!data.error,
    fetchedAt: Date.now(),
  };
}

