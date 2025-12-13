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

import { supabase, isSupabaseConfigured } from './supabase';
import { carData } from '@/data/cars';

/**
 * Find car data from local data or database
 * @param {string} slug - Car slug
 * @returns {Object|null} Car data
 */
export async function getCarBySlug(slug) {
  if (!slug) return null;
  
  // First, check local data (always available)
  const localCar = carData.find(c => c.slug === slug);
  
  // If Supabase is configured, try to get enriched data
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (!error && data) {
        // Merge with local data for completeness
        return { ...localCar, ...data };
      }
    } catch (err) {
      console.warn('[AI Mechanic] Database car fetch failed:', err);
    }
  }
  
  return localCar || null;
}

/**
 * Get maintenance specs for a car
 * @param {string} carSlug - Car slug
 * @returns {Object|null} Maintenance specifications
 */
export async function getMaintenanceSpecs(carSlug) {
  if (!carSlug || !isSupabaseConfigured || !supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('vehicle_maintenance_specs')
      .select('*')
      .eq('car_slug', carSlug)
      .single();
    
    if (error) return null;
    return data;
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
  if (!carSlug || !isSupabaseConfigured || !supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('car_upgrade_recommendations')
      .select('*')
      .eq('car_slug', carSlug)
      .order('priority', { ascending: true });
    
    if (error) return [];
    return data || [];
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
  if (!userId || !isSupabaseConfigured || !supabase) return null;
  
  try {
    let query = supabase
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
  if (!vehicleId || !isSupabaseConfigured || !supabase) return [];
  
  try {
    const { data, error } = await supabase
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
  if (!userId || !isSupabaseConfigured || !supabase) return [];
  
  try {
    let query = supabase
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
    contextText += `\n\n## Maintenance Specifications
- Oil: ${specs.oil_type || 'N/A'} (${specs.oil_capacity || 'N/A'})
- Fuel: ${specs.fuel_octane || 'N/A'} octane ${specs.fuel_type || ''}
- Coolant: ${specs.coolant_type || 'N/A'} (${specs.coolant_capacity || 'N/A'})
- Brake Fluid: ${specs.brake_fluid_type || 'N/A'}
- Tire Pressure: F: ${specs.tire_pressure_front || 'N/A'} / R: ${specs.tire_pressure_rear || 'N/A'} PSI
- Tire Size: F: ${specs.tire_size_front || 'N/A'} / R: ${specs.tire_size_rear || 'N/A'}`;
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
- VIN: ${v.vin || 'Not provided'}`;
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

