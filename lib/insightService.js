/**
 * Insight Service
 * 
 * Generates personalized build insights for user's garage vehicles.
 * Focused on modification enthusiasts - build progress and performance data.
 * 
 * NOTE: This service was redesigned in Jan 2026 to focus on Build Insights.
 * Maintenance reminders, action items, and generic vehicle health features
 * were intentionally removed to serve the modification market.
 * 
 * Current Features:
 * 1. Build Progress - Comparing installed mods with saved projects
 * 2. Performance Summary - Total HP gains, investment across garage
 * 
 * Data sources:
 * - user_vehicles - User's garage vehicles with mods
 * - user_projects - User's saved builds for comparison
 * - user_preferences - User's personalization answers
 * - insight_feedback - User's thumbs up/down feedback
 * 
 * @example
 * import { getInsightsForUser } from '@/lib/insightService';
 * const insights = await getInsightsForUser(userId, vehicleId);
 */

import { createClient } from '@supabase/supabase-js';

import { calculateAllModificationGains } from './performanceCalculator/index.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Get user's garage vehicles with full details for insights
 * 
 * Also fetches matched car data (stock HP, engine) for HP calculation.
 * This ensures HP gains are calculated dynamically using the same
 * SOURCE OF TRUTH as the rest of the app (performanceCalculator).
 */
async function getUserVehicles(userId) {
  if (!supabase) {
    console.error('[InsightService] Supabase client not initialized');
    return [];
  }
  
  console.log('[InsightService] Fetching vehicles for user:', userId);
  
  const { data, error } = await supabase
    .from('user_vehicles')
    .select(`
      id, 
      year, 
      make, 
      model, 
      trim, 
      matched_car_slug, 
      matched_car_id,
      mileage,
      mileage_updated_at,
      nickname, 
      is_primary,
      total_hp_gain,
      installed_modifications,
      last_oil_change_date,
      last_oil_change_mileage,
      next_oil_due_mileage,
      registration_due_date,
      inspection_due_date,
      battery_status,
      tire_tread_32nds,
      garage_score,
      score_breakdown,
      usage_type,
      active_build_id
    `)
    .eq('user_id', userId)
    .eq('ownership_status', 'owned')
    .is('deleted_at', null)
    .order('is_primary', { ascending: false })
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('[InsightService] Error fetching vehicles:', error);
    return [];
  }
  
  if (!data || data.length === 0) {
    return [];
  }
  
  // Fetch car data for HP calculation
  // SOURCE OF TRUTH: We need stock HP and engine type for accurate HP gain calculation
  const carSlugs = [...new Set(data.map(v => v.matched_car_slug).filter(Boolean))];
  const carIds = [...new Set(data.map(v => v.matched_car_id).filter(Boolean))];
  
  const carsById = new Map();
  const carsBySlug = new Map();
  
  if (carSlugs.length > 0 || carIds.length > 0) {
    // Fetch cars via two safe queries (avoid fragile PostgREST .or syntax)
    const carSelect = 'id, slug, hp, engine, drivetrain, curb_weight';
    const combined = [];
    
    if (carSlugs.length > 0) {
      const { data: carsBySlugData, error: carsBySlugError } = await supabase
        .from('cars')
        .select(carSelect)
        .in('slug', carSlugs);
      
      if (carsBySlugError) {
        console.error('[InsightService] Error fetching car data by slug:', carsBySlugError);
      } else if (carsBySlugData) {
        combined.push(...carsBySlugData);
      }
    }
    
    if (carIds.length > 0) {
      const { data: carsByIdData, error: carsByIdError } = await supabase
        .from('cars')
        .select(carSelect)
        .in('id', carIds);
      
      if (carsByIdError) {
        console.error('[InsightService] Error fetching car data by id:', carsByIdError);
      } else if (carsByIdData) {
        combined.push(...carsByIdData);
      }
    }
    
    for (const car of combined) {
      if (car?.id) carsById.set(car.id, car);
      if (car?.slug) carsBySlug.set(car.slug, car);
    }
  }
  
  // Enrich vehicles with matched car data
  const enrichedVehicles = data.map(vehicle => {
    const matchedCar = vehicle.matched_car_id 
      ? carsById.get(vehicle.matched_car_id) 
      : carsBySlug.get(vehicle.matched_car_slug);
    
    return {
      ...vehicle,
      matched_car: matchedCar || null,
    };
  });
  
  console.log('[InsightService] Found vehicles:', enrichedVehicles.length);
  return enrichedVehicles;
}

/**
 * Get user's saved projects for build comparison
 */
async function getUserProjects(userId) {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('user_projects')
    .select(`
      id,
      car_slug,
      project_name,
      selected_upgrades,
      total_hp_gain,
      total_cost_low,
      total_cost_high,
      final_hp,
      stock_hp,
      is_favorite,
      created_at
    `)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('[InsightService] Error fetching projects:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get user preferences
 */
async function getUserPreferences(userId) {
  if (!supabase) return {};
  
  const { data, error } = await supabase
    .from('user_preferences')
    .select('user_id, driving_focus, work_preference, budget_comfort, mod_experience, primary_goals, track_frequency, detail_level')
    .eq('user_id', userId)
    .single();
    
  if (error && error.code !== 'PGRST116') { // Ignore "no rows returned"
    console.error('[InsightService] Error fetching preferences:', error);
  }
  
  return data || {};
}

// NOTE: The following functions were removed in Jan 2026 cleanup:
// - getKnownIssues() - Issues fetched separately via /api/cars/[slug]/issues
// - getRecalls() - Not part of Build Insights focus
// - getMaintenanceIntervals() - Not part of Build Insights focus  
// - getUpgradeSuggestions() - Handled by tuning profile hooks
// - getUserFeedback() - Was only used for filtering removed insights
// - generateActionItems() - Maintenance reminders removed by design
// See file header for design rationale.

/**
 * Normalize selected_upgrades to an array of upgrade keys
 * Handles both array format and object format { upgrades: [...] }
 */
function normalizeUpgradeKeys(selectedUpgrades) {
  if (!selectedUpgrades) return [];
  if (Array.isArray(selectedUpgrades)) return selectedUpgrades;
  if (selectedUpgrades.upgrades && Array.isArray(selectedUpgrades.upgrades)) {
    return selectedUpgrades.upgrades;
  }
  return [];
}

/**
 * Calculate build progress for each vehicle
 * 
 * SOURCE OF TRUTH: HP gains are calculated dynamically using calculateAllModificationGains
 * from lib/performanceCalculator. This ensures consistency with all other HP displays
 * throughout the app. See docs/SOURCE_OF_TRUTH.md Rule 8.
 * 
 * Build matching: Uses vehicle.active_build_id to find the canonical build.
 * Fallback: If no active_build_id, matches by car_slug (legacy behavior).
 */
function calculateBuildProgress(vehicles, projects) {
  const buildProgress = [];
  
  // Create lookup maps for efficient project finding
  const projectById = new Map(projects.map(p => [p.id, p]));
  const projectsBySlug = new Map();
  for (const p of projects) {
    if (!projectsBySlug.has(p.car_slug)) {
      projectsBySlug.set(p.car_slug, []);
    }
    projectsBySlug.get(p.car_slug).push(p);
  }
  
  for (const vehicle of vehicles) {
    const vehicleName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    // installed_modifications can be array of strings or array of objects
    const installedMods = Array.isArray(vehicle.installed_modifications) 
      ? vehicle.installed_modifications 
      : [];
    
    // Get matched car for HP calculation (enriched in getUserVehicles)
    const matchedCar = vehicle.matched_car || null;
    
    // PRIORITY 1: Find project by active_build_id (source of truth)
    let matchingProject = null;
    if (vehicle.active_build_id) {
      matchingProject = projectById.get(vehicle.active_build_id);
      if (!matchingProject) {
        console.warn(`[InsightService] Vehicle ${vehicle.id} has active_build_id=${vehicle.active_build_id} but project not found`);
      }
    }
    
    // PRIORITY 2: Fallback to car_slug match (most recent project for this car)
    if (!matchingProject && vehicle.matched_car_slug) {
      const slugProjects = projectsBySlug.get(vehicle.matched_car_slug) || [];
      // Projects are ordered by created_at desc, so first is most recent
      matchingProject = slugProjects[0] || null;
    }
    
    // Warn if vehicle has no way to match a project
    if (!vehicle.active_build_id && !vehicle.matched_car_slug && !vehicle.matched_car_id) {
      console.warn(`[InsightService] Vehicle ${vehicle.id} has no active_build_id, matched_car_slug, or matched_car_id`);
    }
    
    // SOURCE OF TRUTH: Calculate HP gain dynamically from installed mods
    // This uses the same calculator as Garage, Data, and all other HP displays
    // Never use stored values (total_hp_gain) as they can become stale
    const modificationGains = calculateAllModificationGains(installedMods, matchedCar);
    const currentHpGain = modificationGains.hpGain || 0;
    
    if (matchingProject) {
      // Normalize selected_upgrades to array of upgrade keys
      const projectMods = normalizeUpgradeKeys(matchingProject.selected_upgrades);
      
      const installedCount = installedMods.filter(mod => projectMods.includes(mod)).length;
      const totalPlanned = projectMods.length;
      const progressPercent = totalPlanned > 0 ? Math.round((installedCount / totalPlanned) * 100) : 0;
      
      // Find next recommended mod (first one not installed)
      const nextModId = projectMods.find(modId => !installedMods.includes(modId));
      
      // Calculate target HP gain from all project mods (what the build will achieve when complete)
      const targetModificationGains = calculateAllModificationGains(projectMods, matchedCar);
      const targetHpGain = targetModificationGains.hpGain || 0;
      
      // Final HP = stock HP + target HP gain
      const stockHp = matchedCar?.hp || 0;
      const targetHp = stockHp > 0 ? stockHp + targetHpGain : null;
      
      buildProgress.push({
        id: `build-${vehicle.id}`,
        vehicleId: vehicle.id,
        vehicleName,
        projectName: matchingProject.project_name,
        projectId: matchingProject.id,
        progress: progressPercent,
        installedCount,
        totalPlanned,
        // HP gains calculated dynamically - SOURCE OF TRUTH
        currentHpGain,
        targetHpGain,
        targetHp,
        nextMod: nextModId ? {
          name: formatModName(nextModId),
          hpGain: 0, // We don't have per-mod HP data in the project
          cost: null
        } : null,
        status: progressPercent >= 100 ? 'complete' : progressPercent > 0 ? 'in_progress' : 'planned',
      });
    } else if (installedMods.length > 0) {
      // Has mods but no project - show current progress
      buildProgress.push({
        id: `build-${vehicle.id}`,
        vehicleId: vehicle.id,
        vehicleName,
        projectName: null,
        progress: null, // No target to compare against
        installedCount: installedMods.length,
        totalPlanned: null,
        // HP gain calculated dynamically - SOURCE OF TRUTH
        currentHpGain,
        targetHpGain: null,
        nextMod: null,
        status: 'custom',
      });
    }
  }
  
  return buildProgress;
}

/**
 * Calculate overall performance summary across garage
 * 
 * SOURCE OF TRUTH: HP gain is calculated dynamically using calculateAllModificationGains
 * from lib/performanceCalculator. This ensures consistency with all HP displays.
 * See docs/SOURCE_OF_TRUTH.md Rule 8.
 */
function calculatePerformanceSummary(vehicles, projects) {
  // Create lookup for projects by ID for efficient active_build resolution
  const projectById = new Map(projects.map(p => [p.id, p]));
  const projectsBySlug = new Map();
  for (const p of projects) {
    if (!projectsBySlug.has(p.car_slug)) {
      projectsBySlug.set(p.car_slug, []);
    }
    projectsBySlug.get(p.car_slug).push(p);
  }
  
  // Calculate total HP gain from installed mods (SOURCE OF TRUTH: dynamic calculation)
  let totalHpGain = 0;
  const activeProjects = new Set(); // Track which projects are counted for investment
  
  for (const vehicle of vehicles) {
    // Get installed mods and matched car
    const installedMods = Array.isArray(vehicle.installed_modifications) 
      ? vehicle.installed_modifications 
      : [];
    const matchedCar = vehicle.matched_car || null;
    
    // SOURCE OF TRUTH: Calculate HP gain dynamically from installed mods
    // This is the ONLY way HP should be calculated - never use stored values
    if (installedMods.length > 0) {
      const modificationGains = calculateAllModificationGains(installedMods, matchedCar);
      totalHpGain += modificationGains.hpGain || 0;
    }
    
    // Track active projects for investment calculation
    let activeProject = null;
    if (vehicle.active_build_id) {
      activeProject = projectById.get(vehicle.active_build_id);
    }
    if (!activeProject && vehicle.matched_car_slug) {
      const slugProjects = projectsBySlug.get(vehicle.matched_car_slug) || [];
      activeProject = slugProjects[0] || null;
    }
    if (activeProject) {
      activeProjects.add(activeProject.id);
    }
  }
  
  const modifiedVehicles = vehicles.filter(v => (v.installed_modifications || []).length > 0);
  const totalMods = vehicles.reduce((sum, v) => sum + (v.installed_modifications || []).length, 0);
  
  // Calculate estimated investment from active projects only
  let estimatedInvestmentLow = 0;
  let estimatedInvestmentHigh = 0;
  for (const projectId of activeProjects) {
    const project = projectById.get(projectId);
    if (project) {
      estimatedInvestmentLow += project.total_cost_low || 0;
      estimatedInvestmentHigh += project.total_cost_high || 0;
    }
  }
  
  // Calculate average garage score
  const scoredVehicles = vehicles.filter(v => v.garage_score !== null && v.garage_score !== undefined);
  const avgGarageScore = scoredVehicles.length > 0
    ? Math.round(scoredVehicles.reduce((sum, v) => sum + v.garage_score, 0) / scoredVehicles.length)
    : 0;
  
  // Calculate "garage health" - a composite score
  // Factors: garage scores, action items count, build progress
  const maxScore = 100;
  const garageHealth = Math.min(maxScore, avgGarageScore + (totalMods > 0 ? 10 : 0));
  
  return {
    totalVehicles: vehicles.length,
    modifiedVehicles: modifiedVehicles.length,
    totalHpGain,
    totalMods,
    avgGarageScore,
    garageHealth,
    estimatedInvestment: estimatedInvestmentLow > 0 ? {
      low: estimatedInvestmentLow,
      high: estimatedInvestmentHigh,
    } : null,
  };
}

// NOTE: generateVehicleHealth() was removed in Jan 2026 cleanup.
// Vehicle health cards are not part of the Build Insights focus.

// NOTE: filterByFeedback() was removed - only used for the removed insights.

/**
 * Main function to generate build insights for a user
 * 
 * Returns build-focused insights:
 * - Build progress (comparing installed mods with saved projects)
 * - Performance summary (total HP gains, investment)
 * 
 * NOTE: Maintenance reminders, action items, and generic vehicle health
 * were intentionally removed in Jan 2026 to focus on modification enthusiasts.
 * 
 * @param {string} userId - User ID
 * @param {string} vehicleId - Optional specific vehicle ID to focus on
 * @returns {Object} Build insights data
 */
export async function getInsightsForUser(userId, _vehicleId = null) {
  if (!supabase || !userId) {
    return { vehicles: [], insights: {}, preferences: {}, summary: null };
  }
  
  try {
    // Fetch user data in parallel
    const [vehicles, projects, preferences] = await Promise.all([
      getUserVehicles(userId),
      getUserProjects(userId),
      getUserPreferences(userId),
    ]);
    
    // If no vehicles, return minimal data
    if (vehicles.length === 0) {
      return { 
        vehicles: [], 
        insights: {}, 
        preferences,
        summary: null,
      };
    }
    
    // Generate build-focused insights (with individual error handling)
    let buildProgress = [];
    let performanceSummary = {};
    
    try {
      buildProgress = calculateBuildProgress(vehicles, projects);
    } catch (e) {
      console.error('[InsightService] Error calculating build progress:', e);
    }
    
    try {
      performanceSummary = calculatePerformanceSummary(vehicles, projects);
    } catch (e) {
      console.error('[InsightService] Error calculating performance summary:', e);
    }
    
    return {
      vehicles,
      insights: {
        buildProgress,
      },
      preferences,
      summary: performanceSummary,
      projects: projects.length,
    };
    
  } catch (err) {
    console.error('[InsightService] Error generating insights:', err);
    return { vehicles: [], insights: {}, preferences: {}, summary: null };
  }
}

// NOTE: mapSeverity(), severityOrder(), formatServiceType() were removed
// in Jan 2026 cleanup - only used by the removed insights code.

/**
 * Format mod ID to display name
 * e.g., "supercharger-centrifugal" -> "Supercharger Centrifugal"
 */
function formatModName(modId) {
  if (!modId) return 'Upgrade';
  return modId
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Export internal functions for testing
export const _testExports = {
  normalizeUpgradeKeys,
  calculateBuildProgress,
  calculatePerformanceSummary,
};
