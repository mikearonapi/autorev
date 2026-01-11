/**
 * AI Mechanic Service
 * 
 * Centralized service for the AI Mechanic feature.
 * Handles:
 * - Database queries for context enrichment
 * - Car data, maintenance specs, user vehicle data
 * - Forum/web search integration
 * - Context building for Anthropic API
 * 
 * Updated 2026-01-11: Uses car_id for efficient queries where available
 */

import { supabase, supabaseServiceRole, isSupabaseConfigured } from './supabase';
import { fetchCars, fetchCarBySlug } from '@/lib/carsClient';
import { resolveCarId } from './carResolver';

function getServerDbClient() {
  // buildAIContext runs server-side; prefer service role for speed + fewer RLS surprises
  return supabaseServiceRole || supabase;
}

async function getCarAiContextBlob(carSlug) {
  const client = getServerDbClient();
  if (!carSlug || !isSupabaseConfigured || !client) return null;

  try {
    const { data, error } = await client.rpc('get_car_ai_context', { p_car_slug: carSlug });
    if (error) return null;
    return data || null;
  } catch (err) {
    console.warn('[AI Mechanic] get_car_ai_context failed:', err);
    return null;
  }
}

/**
 * Find car data from database via carsClient
 * @param {string} slug - Car slug
 * @returns {Object|null} Car data
 */
export async function getCarBySlug(slug) {
  if (!slug) return null;
  
  // Get car from database via carsClient (has fallback built-in)
  const car = await fetchCarBySlug(slug);
  
  // If Supabase is configured, try to enrich with AI context
  const aiContext = await getCarAiContextBlob(slug);
  if (aiContext?.car) {
    return { ...car, ...aiContext.car };
  }
  
  return car || null;
}

/**
 * Get maintenance specs for a car
 * @param {string} carSlug - Car slug
 * @returns {Object|null} Maintenance specifications
 */
export async function getMaintenanceSpecs(carSlug) {
  const client = getServerDbClient();
  if (!carSlug || !isSupabaseConfigured || !client) return null;
  
  try {
    // Prefer compact summary RPC (more stable than selecting dozens of columns)
    const { data, error } = await client.rpc('get_car_maintenance_summary', { p_car_slug: carSlug });
    if (!error && data) return data;

    // Fallback: raw table row if RPC isn't present
    // NOTE: vehicle_maintenance_specs uses car_id, not car_slug
    const carId = await resolveCarId(carSlug);
    if (!carId) return null;
    
    const fallback = await client
      .from('vehicle_maintenance_specs')
      .select('*')
      .eq('car_id', carId)
      .single();
    if (fallback.error) return null;
    return fallback.data;
  } catch (err) {
    console.warn('[AI Mechanic] Maintenance specs fetch failed:', err);
    return null;
  }
}

/**
 * Get upgrade recommendations for a car
 * Source of truth: car_tuning_profiles.upgrades_by_objective
 * NOTE: cars.upgrade_recommendations is DEPRECATED as of 2026-01-15
 * @param {string} carSlug - Car slug
 * @returns {Object} Upgrade recommendations by objective (streetSport, trackPack, etc.)
 */
export async function getUpgradeRecommendations(carSlug) {
  const client = getServerDbClient();
  if (!carSlug || !isSupabaseConfigured || !client) return {};
  
  try {
    // Resolve car_id first for efficient query
    const carId = await resolveCarId(carSlug);
    if (!carId) return {};
    
    // Source of truth: car_tuning_profiles.upgrades_by_objective
    const { data, error } = await client
      .from('car_tuning_profiles')
      .select('upgrades_by_objective, platform_strengths, platform_weaknesses')
      .eq('car_id', carId)
      .single();

    if (error || !data) return {};
    
    return {
      upgradesByObjective: data.upgrades_by_objective || {},
      platformStrengths: data.platform_strengths || [],
      platformWeaknesses: data.platform_weaknesses || [],
    };
  } catch (err) {
    console.warn('[AI Mechanic] Upgrade recommendations fetch failed:', err);
    return {};
  }
}

/**
 * Get user's vehicle data if authenticated
 * @param {string} userId - User ID
 * @param {string} vehicleId - Optional specific vehicle ID
 * @returns {Object|null} User vehicle data
 */
export async function getUserVehicle(userId, vehicleId = null) {
  const client = getServerDbClient();
  if (!userId || !isSupabaseConfigured || !client) return null;
  
  try {
    let query = client
      .from('user_vehicles')
      .select('*')
      .eq('user_id', userId);
    
    if (vehicleId) {
      query = query.eq('id', vehicleId);
    } else {
      // Try primary vehicle first, fall back to most recent if none is primary
      query = query.eq('is_primary', true);
    }
    
    // Use maybeSingle() to avoid 406 error when no primary vehicle exists
    const { data, error } = await query.maybeSingle();
    
    // If no primary vehicle found, try to get the most recently added vehicle
    if (!data && !vehicleId && !error) {
      const fallbackQuery = client
        .from('user_vehicles')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      if (fallbackError) return null;
      return fallbackData;
    }
    
    if (error) return null;
    return data;
  } catch (err) {
    console.warn('[AI Mechanic] User vehicle fetch failed:', err);
    return null;
  }
}

/**
 * Get comprehensive user context for AL (owned vehicles, favorites, projects)
 * Uses the get_user_context_for_al RPC for efficient single-query fetching
 * @param {string} userId - User ID
 * @returns {Object|null} User context with favorites, owned vehicles, projects
 */
export async function getUserContextForAL(userId) {
  const client = getServerDbClient();
  if (!userId || !isSupabaseConfigured || !client) return null;
  
  try {
    const { data, error } = await client.rpc('get_user_context_for_al', { 
      user_id_param: userId 
    });
    
    if (error) {
      console.warn('[AI Mechanic] get_user_context_for_al RPC failed:', error);
      return null;
    }
    
    // The RPC returns a single row with arrays
    return data?.[0] || data || null;
  } catch (err) {
    console.warn('[AI Mechanic] User context fetch failed:', err);
    return null;
  }
}

/**
 * Get user's favorite cars with details
 * @param {string} userId - User ID
 * @param {number} limit - Max favorites to return
 * @returns {Array} User favorites with car names
 */
export async function getUserFavorites(userId, limit = 10) {
  const client = getServerDbClient();
  if (!userId || !isSupabaseConfigured || !client) return [];
  
  try {
    const { data, error } = await client
      .from('user_favorites')
      .select('car_slug, car_name, car_id, notes, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) return [];
    return data || [];
  } catch (err) {
    console.warn('[AI Mechanic] User favorites fetch failed:', err);
    return [];
  }
}

/**
 * Get all user's owned vehicles (not just primary)
 * @param {string} userId - User ID
 * @returns {Array} All owned vehicles
 */
export async function getAllUserVehicles(userId) {
  const client = getServerDbClient();
  if (!userId || !isSupabaseConfigured || !client) return [];
  
  try {
    const { data, error } = await client
      .from('user_vehicles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data || [];
  } catch (err) {
    console.warn('[AI Mechanic] All user vehicles fetch failed:', err);
    return [];
  }
}

/**
 * Get user's service logs for a vehicle
 * @param {string} vehicleId - Vehicle ID
 * @returns {Array} Service logs
 */
export async function getServiceLogs(vehicleId) {
  const client = getServerDbClient();
  if (!vehicleId || !isSupabaseConfigured || !client) return [];
  
  try {
    const { data, error } = await client
      .from('user_service_logs')
      .select('*')
      .eq('user_vehicle_id', vehicleId)
      .order('service_date', { ascending: false })
      .limit(10);
    
    if (error) return [];
    return data || [];
  } catch (err) {
    console.warn('[AI Mechanic] Service logs fetch failed:', err);
    return [];
  }
}

/**
 * Get user's projects (modification projects from Tuning Shop)
 * @param {string} userId - User ID
 * @param {string} carSlug - Optional car slug filter
 * @param {string} [carId] - Optional pre-resolved car_id for efficient queries
 * @returns {Array} User projects
 */
export async function getUserProjects(userId, carSlug = null, carId = null) {
  const client = getServerDbClient();
  if (!userId || !isSupabaseConfigured || !client) return [];
  
  try {
    let query = client
      .from('user_projects')
      .select('*')
      .eq('user_id', userId);
    
    if (carSlug || carId) {
      // Resolve car_id if not provided but carSlug is
      const resolvedCarId = carId || (carSlug ? await resolveCarId(carSlug) : null);
      
      // Use car_id if available for efficient index usage
      if (resolvedCarId) {
        query = query.eq('car_id', resolvedCarId);
      } else if (carSlug) {
        query = query.eq('car_slug', carSlug);
      }
    }
    
    const { data, error } = await query
      .order('updated_at', { ascending: false })
      .limit(5);
    
    if (error) return [];
    return data || [];
  } catch (err) {
    console.warn('[AL] User projects fetch failed:', err);
    return [];
  }
}

// Legacy alias for backward compatibility
export const getUserBuilds = getUserProjects;

/**
 * Get database stats for AL system prompt
 * Cached for 5 minutes to avoid excessive queries
 */
let statsCache = { data: null, expires: 0 };

export async function getDatabaseStats() {
  // Return cached stats if still valid
  if (statsCache.data && Date.now() < statsCache.expires) {
    return statsCache.data;
  }
  
  const client = getServerDbClient();
  if (!isSupabaseConfigured || !client) {
    return null;
  }
  
  try {
    // Run count queries in parallel
    const [
      { count: carCount },
      { count: issuesCount },
      { count: insightsCount },
      { count: partsCount },
      { count: fitmentsCount },
      { count: knowledgeCount },
    ] = await Promise.all([
      client.from('cars').select('*', { count: 'exact', head: true }),
      client.from('car_issues').select('*', { count: 'exact', head: true }),
      client.from('community_insights').select('*', { count: 'exact', head: true }),
      client.from('parts').select('*', { count: 'exact', head: true }),
      client.from('part_fitments').select('*', { count: 'exact', head: true }),
      client.from('document_chunks').select('*', { count: 'exact', head: true }),
    ]);
    
    const stats = {
      cars: carCount || 188,
      issues: issuesCount || 1201,
      insights: insightsCount || 1226,
      parts: partsCount || 642,
      fitments: fitmentsCount || 836,
      knowledgeChunks: knowledgeCount || 547,
    };
    
    // Cache for 5 minutes
    statsCache = { data: stats, expires: Date.now() + 5 * 60 * 1000 };
    
    return stats;
  } catch (err) {
    console.warn('[AI Mechanic] Database stats fetch failed:', err);
    return null;
  }
}

/**
 * Search cars by query (from database)
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching cars
 */
export async function searchCars(query) {
  if (!query) return [];
  
  const allCars = await fetchCars();
  const searchLower = query.toLowerCase();
  return allCars.filter(car => 
    car.name?.toLowerCase().includes(searchLower) ||
    car.brand?.toLowerCase().includes(searchLower) ||
    car.category?.toLowerCase().includes(searchLower) ||
    car.engine?.toLowerCase().includes(searchLower)
  ).slice(0, 10);
}

/**
 * Find similar cars for comparison (from database)
 * @param {string} carSlug - Base car slug
 * @returns {Promise<Array>} Similar cars
 */
export async function findSimilarCars(carSlug) {
  const allCars = await fetchCars();
  const baseCar = allCars.find(c => c.slug === carSlug);
  if (!baseCar) return [];
  
  // Find cars with similar price range and HP
  const basePrice = baseCar.priceRange ? parseInt(baseCar.priceRange.replace(/[^0-9]/g, '')) : 0;
  const baseHp = baseCar.hp || 0;
  
  return allCars
    .filter(car => {
      if (car.slug === carSlug) return false;
      
      const carPrice = car.priceRange ? parseInt(car.priceRange.replace(/[^0-9]/g, '')) : 0;
      const priceMatch = Math.abs(carPrice - basePrice) < 30000;
      
      const hpMatch = Math.abs((car.hp || 0) - baseHp) < 100;
      
      return priceMatch && hpMatch;
    })
    .slice(0, 5);
}

/**
 * Build comprehensive context for AI Mechanic
 * 
 * OPTIMIZED: Only fetches essential context upfront.
 * Detailed data (maintenance specs, issues, reviews) are fetched via tools when needed.
 * This reduces initial latency by 200-400ms.
 * 
 * Follows priority: owned vehicles → favorites → ask user
 * @param {Object} params - Context parameters
 * @returns {Object} Enriched context
 */
export async function buildAIContext({
  carSlug,
  userId,
  vehicleId,
  currentPage,
  userMessage,
}) {
  const context = {
    car: null,
    // REMOVED: maintenanceSpecs, upgradeRecommendations - available via tools
    userVehicle: null,
    // REMOVED: userVehicleMaintenanceSpecs, serviceLogs - available via tools
    userBuilds: [],
    userFavorites: [],       // User's favorited cars
    allOwnedVehicles: [],    // All owned vehicles (not just primary)
    // REMOVED: userGarageContext - redundant with allOwnedVehicles + userFavorites
    // REMOVED: similarCars, relevantCars - available via tools
    currentPage,
    stats: null,             // Database stats for system prompt
    // Flags for context availability (used by system prompt)
    hasOwnedVehicles: false,
    hasFavorites: false,
    hasNoCarContext: true,
  };
  
  // Run ONLY essential queries in parallel
  // Detailed data is fetched via tools when AL needs it
  const promises = [];
  
  // Always fetch database stats (cached, lightweight ~0ms if cached)
  promises.push(
    getDatabaseStats().then(data => { context.stats = data; })
  );
  
  // Get basic car data ONLY (no maintenance specs, no upgrade recommendations)
  // AL will use get_car_ai_context tool for detailed data when needed
  if (carSlug) {
    promises.push(
      getCarBySlug(carSlug).then(data => { context.car = data; })
    );
    // REMOVED: getMaintenanceSpecs, getUpgradeRecommendations, findSimilarCars
    // These are available via tools and add 100-200ms each
  }
  
  // Get user context - use single RPC for efficiency
  if (userId) {
    promises.push(
      getUserVehicle(userId, vehicleId).then(data => { context.userVehicle = data; }),
      getAllUserVehicles(userId).then(data => { context.allOwnedVehicles = data; }),
      getUserFavorites(userId, 5).then(data => { context.userFavorites = data; }), // Reduced from 10 to 5
    );
    // REMOVED: getUserBuilds, getUserContextForAL - redundant or available via tools
  }
  
  // REMOVED: searchCars(userMessage) - AL has search_cars tool
  
  // Wait for all parallel queries
  await Promise.all(promises);
  
  // Set context availability flags
  context.hasOwnedVehicles = (context.allOwnedVehicles?.length > 0) || Boolean(context.userVehicle);
  context.hasFavorites = context.userFavorites?.length > 0;
  context.hasNoCarContext = !context.hasOwnedVehicles && !context.hasFavorites && !carSlug;
  
  // REMOVED: Conditional service logs and maintenance specs fetching
  // These are now fetched by AL tools when needed (analyze_vehicle_health, get_maintenance_schedule)
  
  return context;
}

/**
 * Format context into a text prompt for the AI
 * 
 * OPTIMIZED: Only includes essential context.
 * Detailed data (maintenance, issues, reviews) are fetched via tools when needed.
 * 
 * Implements priority: owned vehicles → favorites → ask user
 * @param {Object} context - Context object from buildAIContext
 * @returns {string} Formatted context string
 */
export function formatContextForAI(context) {
  let contextText = '';
  
  // =============================================================================
  // USER'S GARAGE CONTEXT (PRIORITY: owned vehicles → favorites → no context)
  // =============================================================================
  
  // Priority 1: User's owned vehicles (compact format)
  if (context.allOwnedVehicles?.length > 0) {
    contextText += `\n\n## User's Garage`;
    contextText += `\nOwns ${context.allOwnedVehicles.length} vehicle(s):`;
    context.allOwnedVehicles.slice(0, 3).forEach((v, i) => {
      const isPrimary = v.is_primary ? ' [PRIMARY]' : '';
      contextText += `\n- ${v.year} ${v.make} ${v.model}${isPrimary} (${v.current_mileage?.toLocaleString() || '?'} mi, slug: ${v.matched_car_slug || 'unmatched'})`;
    });
    if (context.allOwnedVehicles.length > 3) {
      contextText += `\n- ...and ${context.allOwnedVehicles.length - 3} more`;
    }
  } else if (context.userFavorites?.length > 0) {
    // Priority 2: User has favorites but no owned vehicles
    contextText += `\n\n## User's Favorites (No Owned Vehicles)`;
    const favNames = context.userFavorites.slice(0, 5).map(f => f.car_name || f.car_slug).join(', ');
    contextText += `\nInterested in: ${favNames}`;
    contextText += `\n**Note**: No owned vehicles. Ask which car they want help with if unclear.`;
  } else if (context.hasNoCarContext) {
    // Priority 3: No owned vehicles AND no favorites
    contextText += `\n\n## Note: User has no garage vehicles or favorites. Ask which car they're interested in if needed.`;
  }
  
  // Current car context (from page they're viewing) - compact format
  if (context.car) {
    contextText += `\n\n## Viewing: ${context.car.name}`;
    contextText += `\n${context.car.years || ''} | ${context.car.hp || '?'} hp | ${context.car.engine || ''} | ${context.car.priceRange || ''}`;
    if (context.car.slug) {
      contextText += `\nSlug: ${context.car.slug}`;
    }
  }
  
  // REMOVED: Maintenance specs, upgrade recommendations, service logs, similar cars
  // These are now fetched via tools (get_car_ai_context, get_maintenance_schedule, etc.) when needed
  
  // Primary vehicle details (compact, only if different from viewing context)
  if (context.userVehicle && context.userVehicle.matched_car_slug !== context.car?.slug) {
    const v = context.userVehicle;
    contextText += `\n\n## User's Primary Vehicle: ${v.year} ${v.make} ${v.model}`;
    contextText += `\nMileage: ${v.current_mileage?.toLocaleString() || '?'} | Slug: ${v.matched_car_slug || 'unmatched'}`;
  }
  
  // Current page context
  if (context.currentPage) {
    contextText += `\n\n## Page: ${context.currentPage}`;
  }
  
  return contextText;
}

/**
 * Web search helper (to be implemented with actual search API)
 * @param {string} query - Search query
 * @returns {Array} Search results
 */
export async function webSearch(query) {
  // Placeholder for web search integration
  // This could use Exa API, Perplexity, or custom scraper
  return [];
}

const aiMechanicService = {
  getCarBySlug,
  getMaintenanceSpecs,
  getUpgradeRecommendations,
  getUserVehicle,
  getUserContextForAL,
  getUserFavorites,
  getAllUserVehicles,
  getServiceLogs,
  getUserBuilds,
  getDatabaseStats,
  searchCars,
  findSimilarCars,
  buildAIContext,
  formatContextForAI,
  webSearch,
};

export default aiMechanicService;

