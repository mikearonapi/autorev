/**
 * AI Mechanic Service
 * 
 * Centralized service for the AI Mechanic feature.
 * Handles:
 * - Database queries for context enrichment
 * - Car data, maintenance specs, user vehicle data
 * - Forum/web search integration
 * - Context building for Anthropic API
 */

import { supabase, supabaseServiceRole, isSupabaseConfigured } from './supabase';
import { carData } from '@/data/cars';

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
 * Find car data from local data or database
 * @param {string} slug - Car slug
 * @returns {Object|null} Car data
 */
export async function getCarBySlug(slug) {
  if (!slug) return null;
  
  // First, check local data (always available)
  const localCar = carData.find(c => c.slug === slug);
  
  // If Supabase is configured, prefer one-call AI context (faster + richer)
  const aiContext = await getCarAiContextBlob(slug);
  if (aiContext?.car) {
    return { ...localCar, ...aiContext.car };
  }
  
  return localCar || null;
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
    const fallback = await client
      .from('vehicle_maintenance_specs')
      .select('*')
      .eq('car_slug', carSlug)
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
 * @param {string} carSlug - Car slug
 * @returns {Array} Upgrade recommendations
 */
export async function getUpgradeRecommendations(carSlug) {
  const client = getServerDbClient();
  if (!carSlug || !isSupabaseConfigured || !client) return [];
  
  try {
    // Project DB does not consistently have a dedicated car_upgrade_recommendations table.
    // Canonical is cars.upgrade_recommendations JSONB.
    const { data, error } = await client
      .from('cars')
      .select('upgrade_recommendations')
      .eq('slug', carSlug)
      .single();

    if (error) return [];
    return data?.upgrade_recommendations || [];
  } catch (err) {
    console.warn('[AI Mechanic] Upgrade recommendations fetch failed:', err);
    return [];
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
      query = query.eq('is_primary', true);
    }
    
    const { data, error } = await query.single();
    
    if (error) return null;
    return data;
  } catch (err) {
    console.warn('[AI Mechanic] User vehicle fetch failed:', err);
    return null;
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
 * @returns {Array} User projects
 */
export async function getUserProjects(userId, carSlug = null) {
  const client = getServerDbClient();
  if (!userId || !isSupabaseConfigured || !client) return [];
  
  try {
    let query = client
      .from('user_projects')
      .select('*')
      .eq('user_id', userId);
    
    if (carSlug) {
      query = query.eq('car_slug', carSlug);
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
 * Search cars by query
 * @param {string} query - Search query
 * @returns {Array} Matching cars
 */
export function searchCars(query) {
  if (!query) return [];
  
  const searchLower = query.toLowerCase();
  return carData.filter(car => 
    car.name?.toLowerCase().includes(searchLower) ||
    car.brand?.toLowerCase().includes(searchLower) ||
    car.category?.toLowerCase().includes(searchLower) ||
    car.engine?.toLowerCase().includes(searchLower)
  ).slice(0, 10);
}

/**
 * Find similar cars for comparison
 * @param {string} carSlug - Base car slug
 * @returns {Array} Similar cars
 */
export function findSimilarCars(carSlug) {
  const baseCar = carData.find(c => c.slug === carSlug);
  if (!baseCar) return [];
  
  // Find cars with similar price range and HP
  const basePrice = baseCar.priceRange ? parseInt(baseCar.priceRange.replace(/[^0-9]/g, '')) : 0;
  const baseHp = baseCar.hp || 0;
  
  return carData
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
    maintenanceSpecs: null,
    upgradeRecommendations: [],
    userVehicle: null,
    userVehicleMaintenanceSpecs: null,
    serviceLogs: [],
    userBuilds: [],
    similarCars: [],
    relevantCars: [],
    currentPage,
  };
  
  // Run database queries in parallel for efficiency
  const promises = [];
  
  // Get car data
  if (carSlug) {
    promises.push(
      getCarBySlug(carSlug).then(data => { context.car = data; }),
      getMaintenanceSpecs(carSlug).then(data => { context.maintenanceSpecs = data; }),
      getUpgradeRecommendations(carSlug).then(data => { context.upgradeRecommendations = data; }),
    );
    context.similarCars = findSimilarCars(carSlug);
  }
  
  // Get user-specific data
  if (userId) {
    promises.push(
      getUserVehicle(userId, vehicleId).then(data => { context.userVehicle = data; }),
      getUserBuilds(userId, carSlug).then(data => { context.userBuilds = data; }),
    );
  }
  
  // Search for relevant cars based on user message
  if (userMessage) {
    context.relevantCars = searchCars(userMessage);
  }
  
  // Wait for all parallel queries
  await Promise.all(promises);
  
  // If user has a vehicle, get service logs ONLY if likely relevant to query
  if (context.userVehicle?.id) {
    // Simple keyword check to avoid unnecessary DB calls
    const needsServiceHistory = !userMessage || /service|maintenance|oil|repair|history|log|record|check|due/i.test(userMessage);
    
    if (needsServiceHistory) {
      context.serviceLogs = await getServiceLogs(context.userVehicle.id);
    }
  }

  // If user is asking maintenance questions, pull maintenance specs for THEIR matched vehicle too.
  if (context.userVehicle && isSupabaseConfigured && getServerDbClient()) {
    const needsMaintenance = !userMessage || /service|maintenance|oil|coolant|brake fluid|spark plug|interval|spec|fluid|filter/i.test(userMessage);
    if (needsMaintenance) {
      const client = getServerDbClient();
      const variantKey = context.userVehicle.matched_car_variant_key || null;
      const matchedSlug = context.userVehicle.matched_car_slug || null;
      try {
        if (variantKey) {
          const { data, error } = await client.rpc('get_car_maintenance_summary_variant', { p_variant_key: variantKey });
          if (!error && data) context.userVehicleMaintenanceSpecs = data;
        } else if (matchedSlug) {
          const { data, error } = await client.rpc('get_car_maintenance_summary', { p_car_slug: matchedSlug });
          if (!error && data) context.userVehicleMaintenanceSpecs = data;
        }
      } catch (err) {
        // best-effort
      }
    }
  }
  
  return context;
}

/**
 * Format context into a text prompt for the AI
 * @param {Object} context - Context object from buildAIContext
 * @returns {string} Formatted context string
 */
export function formatContextForAI(context) {
  let contextText = '';
  
  // Current car context
  if (context.car) {
    contextText += `\n\n## Current Vehicle Context
The user is viewing/discussing: ${context.car.name}
- Year: ${context.car.years || 'N/A'}
- Power: ${context.car.hp || 'N/A'} hp
- Engine: ${context.car.engine || 'N/A'}
- 0-60: ${context.car.zeroToSixty || 'N/A'}s
- Weight: ${context.car.curbWeight || 'N/A'} lbs
- Price Range: ${context.car.priceRange || 'N/A'}`;
  }
  
  // Maintenance specs
  if (context.maintenanceSpecs) {
    const specs = context.maintenanceSpecs;

    // Shape A: old wide table row (snake_case columns)
    if (specs && (specs.oil_type || specs.fuel_octane_minimum || specs.tire_size_front)) {
      contextText += `\n\n## Maintenance Specifications
- Oil: ${specs.oil_type || 'N/A'} (${specs.oil_capacity_liters || specs.oil_capacity_quarts || 'N/A'})
- Fuel: ${specs.fuel_octane_minimum || 'N/A'} octane ${specs.fuel_type || ''}
- Coolant: ${specs.coolant_type || 'N/A'} (${specs.coolant_capacity_liters || 'N/A'})
- Brake Fluid: ${specs.brake_fluid_type || 'N/A'}
- Tire Pressure: F: ${specs.tire_pressure_front_psi || 'N/A'} / R: ${specs.tire_pressure_rear_psi || 'N/A'} PSI
- Tire Size: F: ${specs.tire_size_front || 'N/A'} / R: ${specs.tire_size_rear || 'N/A'}`;
    } else {
      // Shape B: compact summary RPC (jsonb)
      const oil = specs?.oil || {};
      const fuel = specs?.fuel || {};
      const coolant = specs?.coolant || {};
      const brake = specs?.brake_fluid || {};
      const tires = specs?.tires || {};
      contextText += `\n\n## Maintenance Specifications
- Oil: ${oil.type || 'N/A'}${oil.viscosity ? ` (${oil.viscosity})` : ''}${oil.spec ? ` — ${oil.spec}` : ''}${oil.interval_miles ? ` — interval ${oil.interval_miles} mi` : ''}
- Fuel: min ${fuel.octane_minimum || 'N/A'}${fuel.octane_recommended ? ` (rec ${fuel.octane_recommended})` : ''} ${fuel.type || ''}
- Coolant: ${coolant.type || 'N/A'}${coolant.spec ? ` — ${coolant.spec}` : ''}
- Brake Fluid: ${brake.type || 'N/A'}${brake.spec ? ` — ${brake.spec}` : ''}
- Tires: F ${tires.size_front || 'N/A'} @ ${tires.pressure_front_psi || 'N/A'} psi / R ${tires.size_rear || 'N/A'} @ ${tires.pressure_rear_psi || 'N/A'} psi`;
    }
  }
  
  // Upgrade recommendations
  if (context.upgradeRecommendations?.length > 0) {
    contextText += `\n\n## Recommended Upgrades for this car:`;
    context.upgradeRecommendations.slice(0, 5).forEach(rec => {
      contextText += `\n- ${rec.upgrade_category}: ${rec.recommendation} (${rec.difficulty || 'N/A'} difficulty)`;
    });
  }
  
  // User's owned vehicle
  if (context.userVehicle) {
    const v = context.userVehicle;
    contextText += `\n\n## User's Owned Vehicle
- ${v.year} ${v.make} ${v.model}${v.nickname ? ` ("${v.nickname}")` : ''}
- Current Mileage: ${v.current_mileage?.toLocaleString() || v.mileage?.toLocaleString() || 'N/A'} miles
- VIN: ${v.vin || 'Not provided'}
- Matched Car Slug: ${v.matched_car_slug || 'N/A'}
- Matched Variant: ${v.matched_car_variant_key || 'N/A'}`;

    if (context.userVehicleMaintenanceSpecs) {
      const s = context.userVehicleMaintenanceSpecs;
      const oil = s?.oil || {};
      const fuel = s?.fuel || {};
      const coolant = s?.coolant || {};
      contextText += `\n\n## User Vehicle Maintenance Specs (matched)
- Oil: ${oil.type || 'N/A'}${oil.viscosity ? ` (${oil.viscosity})` : ''}${oil.interval_miles ? ` — ${oil.interval_miles} mi` : ''}
- Fuel: min ${fuel.octane_minimum || 'N/A'} ${fuel.type || ''}
- Coolant: ${coolant.type || 'N/A'}${coolant.spec ? ` — ${coolant.spec}` : ''}`;
    }
  }
  
  // Recent service logs
  if (context.serviceLogs?.length > 0) {
    contextText += `\n\n## Recent Service History:`;
    context.serviceLogs.slice(0, 5).forEach(log => {
      contextText += `\n- ${log.service_date}: ${log.service_type} at ${log.mileage?.toLocaleString() || 'N/A'} miles`;
    });
  }
  
  // User's projects (Tuning Shop builds)
  if (context.userProjects?.length > 0 || context.userBuilds?.length > 0) {
    const projects = context.userProjects || context.userBuilds;
    contextText += `\n\n## User's Projects:`;
    projects.forEach(project => {
      const name = project.project_name || project.build_name;
      contextText += `\n- "${name}": +${project.total_hp_gain || 0} hp, $${project.total_cost_low?.toLocaleString() || 'N/A'}-${project.total_cost_high?.toLocaleString() || 'N/A'}`;
    });
  }
  
  // Similar cars
  if (context.similarCars?.length > 0) {
    contextText += `\n\n## Similar Cars for Comparison:`;
    context.similarCars.forEach(car => {
      contextText += `\n- ${car.name}: ${car.hp} hp, ${car.priceRange}`;
    });
  }
  
  // Current page context
  if (context.currentPage) {
    contextText += `\n\n## Current Page: ${context.currentPage}`;
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

export default {
  getCarBySlug,
  getMaintenanceSpecs,
  getUpgradeRecommendations,
  getUserVehicle,
  getServiceLogs,
  getUserBuilds,
  searchCars,
  findSimilarCars,
  buildAIContext,
  formatContextForAI,
  webSearch,
};

