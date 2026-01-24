/**
 * Insight Service
 * 
 * Generates personalized, actionable insights for user's garage vehicles.
 * 
 * Insight Categories:
 * 1. Action Items - Time-sensitive tasks (oil changes, registration, inspection)
 * 2. Build Progress - Comparing installed mods with saved projects
 * 3. Performance Summary - Total HP gains, investment across garage
 * 4. Vehicle Health - Per-vehicle status and recommendations
 * 5. Known Issues - Recalls and common problems
 * 
 * Data sources:
 * - user_vehicles - User's garage vehicles with mods, mileage, service dates
 * - user_projects - User's saved builds for comparison
 * - car_issues - Known issues for matched cars
 * - car_recalls - Recall notices
 * - vehicle_service_intervals - Maintenance schedules
 * - car_tuning_profiles - Upgrade suggestions
 * - user_preferences - User's personalization answers
 * - insight_feedback - User's thumbs up/down feedback
 * 
 * @example
 * import { getInsightsForUser } from '@/lib/insightService';
 * const insights = await getInsightsForUser(userId, vehicleId);
 */

import { createClient } from '@supabase/supabase-js';
import { resolveCarId } from './carResolver.js';
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
  
  let carsById = new Map();
  let carsBySlug = new Map();
  
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
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error && error.code !== 'PGRST116') { // Ignore "no rows returned"
    console.error('[InsightService] Error fetching preferences:', error);
  }
  
  return data || {};
}

/**
 * Get known issues for a car
 * Per SOURCE_OF_TRUTH Cardinal Rule 1: Always query by car_id
 */
async function getKnownIssues(carSlug, carId) {
  if (!supabase || (!carSlug && !carId)) return [];
  
  // Resolve car_id from slug if not provided
  let resolvedCarId = carId;
  if (!resolvedCarId && carSlug) {
    resolvedCarId = await resolveCarId(carSlug);
    if (!resolvedCarId) {
      console.warn('[InsightService] Could not resolve car_id for slug:', carSlug);
      return [];
    }
  }
  
  const { data, error } = await supabase
    .from('car_issues')
    .select('id, title, description, kind, severity, affected_years_text, fix_description, estimated_cost_text')
    .eq('car_id', resolvedCarId)
    .order('severity', { ascending: true })
    .limit(10);
  
  if (error) {
    console.error('[InsightService] Error fetching issues:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get recalls for a car
 * Per SOURCE_OF_TRUTH Cardinal Rule 1: Always query by car_id
 */
async function getRecalls(carSlug, carId) {
  if (!supabase || (!carSlug && !carId)) return [];
  
  // Resolve car_id from slug if not provided
  let resolvedCarId = carId;
  if (!resolvedCarId && carSlug) {
    resolvedCarId = await resolveCarId(carSlug);
    if (!resolvedCarId) {
      console.warn('[InsightService] Could not resolve car_id for slug:', carSlug);
      return [];
    }
  }
  
  const { data, error } = await supabase
    .from('car_recalls')
    .select('id, campaign_number, component, summary, consequence, remedy, recall_date')
    .eq('car_id', resolvedCarId)
    .order('recall_date', { ascending: false })
    .limit(5);
  
  if (error) {
    console.error('[InsightService] Error fetching recalls:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get maintenance service intervals for a car
 * Per SOURCE_OF_TRUTH Cardinal Rule 1: Always query by car_id
 */
async function getMaintenanceIntervals(carSlug, carId) {
  if (!supabase || (!carSlug && !carId)) return [];
  
  // Resolve car_id from slug if not provided
  let resolvedCarId = carId;
  if (!resolvedCarId && carSlug) {
    resolvedCarId = await resolveCarId(carSlug);
    if (!resolvedCarId) {
      console.warn('[InsightService] Could not resolve car_id for slug:', carSlug);
      return [];
    }
  }
  
  const { data, error } = await supabase
    .from('vehicle_service_intervals')
    .select('id, service_type, interval_miles, interval_months, description, estimated_cost_low, estimated_cost_high')
    .eq('car_id', resolvedCarId)
    .order('interval_miles', { ascending: true })
    .limit(10);
  
  if (error) {
    console.error('[InsightService] Error fetching intervals:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get upgrade suggestions from tuning profiles
 * Per SOURCE_OF_TRUTH Cardinal Rule 1: Always query by car_id
 */
async function getUpgradeSuggestions(carSlug, carId, preferences) {
  if (!supabase || (!carSlug && !carId)) return [];
  
  // Resolve car_id from slug if not provided
  let resolvedCarId = carId;
  if (!resolvedCarId && carSlug) {
    resolvedCarId = await resolveCarId(carSlug);
    if (!resolvedCarId) {
      console.warn('[InsightService] Could not resolve car_id for slug:', carSlug);
      return [];
    }
  }
  
  const { data, error } = await supabase
    .from('car_tuning_profiles')
    .select('id, car_slug, upgrades_by_objective, power_gains_summary')
    .eq('car_id', resolvedCarId)
    .limit(1);
  
  if (error) {
    console.error('[InsightService] Error fetching tuning profiles:', error);
    return [];
  }
  
  if (!data || data.length === 0) return [];
  
  const profile = data[0];
  const suggestions = [];
  
  // Filter upgrades based on user preferences
  const upgradesByObjective = profile.upgrades_by_objective || {};
  const userGoals = preferences.primary_goals || [];
  const userFocus = preferences.driving_focus || [];
  
  // Map user goals to tuning objectives
  const objectiveMap = {
    'more_power': ['power', 'street_power'],
    'better_handling': ['handling', 'track'],
    'track': ['track', 'handling'],
    'sound': ['exhaust', 'sound'],
  };
  
  // Get relevant objectives based on user preferences
  const relevantObjectives = new Set();
  [...userGoals, ...userFocus].forEach(pref => {
    const mapped = objectiveMap[pref];
    if (mapped) mapped.forEach(obj => relevantObjectives.add(obj));
  });
  
  // If no preferences, show general recommendations
  if (relevantObjectives.size === 0) {
    relevantObjectives.add('power');
    relevantObjectives.add('handling');
  }
  
  // Extract upgrades from relevant objectives
  relevantObjectives.forEach(objective => {
    const upgrades = upgradesByObjective[objective];
    if (upgrades && Array.isArray(upgrades)) {
      upgrades.slice(0, 2).forEach((upgrade, i) => {
        suggestions.push({
          id: `${objective}-${i}`,
          title: upgrade.name || upgrade.title || `${objective} upgrade`,
          description: upgrade.description || `Recommended ${objective} upgrade`,
          objective,
          link: `/garage/tuning-shop?objective=${objective}`,
        });
      });
    }
  });
  
  return suggestions.slice(0, 5);
}

/**
 * Get user's feedback to filter insights
 */
async function getUserFeedback(userId) {
  if (!supabase) return {};
  
  const { data, error } = await supabase
    .from('insight_feedback')
    .select('insight_type, insight_key, rating')
    .eq('user_id', userId);
    
  if (error) {
    console.error('[InsightService] Error fetching feedback:', error);
    return {};
  }
  
  // Create a map of feedback for quick lookup
  const feedbackMap = {};
  (data || []).forEach(f => {
    const key = `${f.insight_type}-${f.insight_key}`;
    feedbackMap[key] = f.rating;
  });
  
  return feedbackMap;
}

/**
 * Generate action items (time-sensitive tasks)
 * These are maintenance/admin tasks that need attention
 */
function generateActionItems(vehicles) {
  const actions = [];
  const today = new Date();
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  for (const vehicle of vehicles) {
    const vehicleName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    
    // Oil Change Due
    if (vehicle.next_oil_due_mileage && vehicle.mileage) {
      const milesUntilOilChange = vehicle.next_oil_due_mileage - vehicle.mileage;
      if (milesUntilOilChange <= 0) {
        actions.push({
          id: `oil-overdue-${vehicle.id}`,
          type: 'oil_change',
          priority: 'critical',
          vehicleId: vehicle.id,
          vehicleName,
          title: 'Oil Change Overdue',
          description: `${vehicleName} is ${Math.abs(milesUntilOilChange).toLocaleString()} miles past due for an oil change.`,
          metric: `${Math.abs(milesUntilOilChange).toLocaleString()} mi overdue`,
          link: `/garage?vehicle=${vehicle.id}`,
        });
      } else if (milesUntilOilChange <= 500) {
        actions.push({
          id: `oil-due-${vehicle.id}`,
          type: 'oil_change',
          priority: 'high',
          vehicleId: vehicle.id,
          vehicleName,
          title: 'Oil Change Due Soon',
          description: `${vehicleName} needs an oil change in ${milesUntilOilChange.toLocaleString()} miles.`,
          metric: `${milesUntilOilChange.toLocaleString()} mi left`,
          link: `/garage?vehicle=${vehicle.id}`,
        });
      }
    }
    
    // Registration Due
    if (vehicle.registration_due_date) {
      const regDate = new Date(vehicle.registration_due_date);
      if (regDate <= today) {
        actions.push({
          id: `reg-overdue-${vehicle.id}`,
          type: 'registration',
          priority: 'critical',
          vehicleId: vehicle.id,
          vehicleName,
          title: 'Registration Expired',
          description: `${vehicleName} registration expired on ${regDate.toLocaleDateString()}.`,
          metric: 'Expired',
          link: `/garage?vehicle=${vehicle.id}`,
        });
      } else if (regDate <= thirtyDaysFromNow) {
        const daysLeft = Math.ceil((regDate - today) / (1000 * 60 * 60 * 24));
        actions.push({
          id: `reg-due-${vehicle.id}`,
          type: 'registration',
          priority: 'medium',
          vehicleId: vehicle.id,
          vehicleName,
          title: 'Registration Due Soon',
          description: `${vehicleName} registration expires in ${daysLeft} days.`,
          metric: `${daysLeft} days`,
          link: `/garage?vehicle=${vehicle.id}`,
        });
      }
    }
    
    // Inspection Due
    if (vehicle.inspection_due_date) {
      const inspDate = new Date(vehicle.inspection_due_date);
      if (inspDate <= today) {
        actions.push({
          id: `insp-overdue-${vehicle.id}`,
          type: 'inspection',
          priority: 'critical',
          vehicleId: vehicle.id,
          vehicleName,
          title: 'Inspection Overdue',
          description: `${vehicleName} inspection expired on ${inspDate.toLocaleDateString()}.`,
          metric: 'Expired',
          link: `/garage?vehicle=${vehicle.id}`,
        });
      } else if (inspDate <= thirtyDaysFromNow) {
        const daysLeft = Math.ceil((inspDate - today) / (1000 * 60 * 60 * 24));
        actions.push({
          id: `insp-due-${vehicle.id}`,
          type: 'inspection',
          priority: 'medium',
          vehicleId: vehicle.id,
          vehicleName,
          title: 'Inspection Due Soon',
          description: `${vehicleName} inspection expires in ${daysLeft} days.`,
          metric: `${daysLeft} days`,
          link: `/garage?vehicle=${vehicle.id}`,
        });
      }
    }
    
    // Low tire tread warning
    if (vehicle.tire_tread_32nds !== null && vehicle.tire_tread_32nds <= 4) {
      actions.push({
        id: `tires-${vehicle.id}`,
        type: 'tires',
        priority: vehicle.tire_tread_32nds <= 2 ? 'critical' : 'medium',
        vehicleId: vehicle.id,
        vehicleName,
        title: vehicle.tire_tread_32nds <= 2 ? 'Tires Need Replacement' : 'Tires Getting Low',
        description: `${vehicleName} tires at ${vehicle.tire_tread_32nds}/32" tread depth.`,
        metric: `${vehicle.tire_tread_32nds}/32"`,
        link: `/garage?vehicle=${vehicle.id}`,
      });
    }
  }
  
  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

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

/**
 * Generate vehicle health cards with quick status
 * 
 * SOURCE OF TRUTH: Uses buildProgress to get HP gain from active build,
 * ensuring consistency with calculateBuildProgress and calculatePerformanceSummary.
 */
function generateVehicleHealth(vehicles, buildProgress = []) {
  // Create lookup for build progress by vehicle ID
  const progressByVehicle = new Map(buildProgress.map(bp => [bp.vehicleId, bp]));
  
  return vehicles.map(vehicle => {
    const vehicleName = vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    const mods = vehicle.installed_modifications || [];
    
    // Get HP gain from active build (source of truth)
    const vehicleBuildProgress = progressByVehicle.get(vehicle.id);
    const hpGain = vehicleBuildProgress?.currentHpGain || 0;
    
    // Calculate health indicators
    const indicators = [];
    
    // Mods status
    if (mods.length > 0) {
      indicators.push({
        type: 'mods',
        label: 'Modifications',
        value: mods.length,
        status: 'good',
      });
    }
    
    // HP gain - use active build HP gain
    if (hpGain > 0) {
      indicators.push({
        type: 'power',
        label: 'Power Gain',
        value: `+${hpGain} HP`,
        status: 'good',
      });
    }
    
    // Garage score
    if (vehicle.garage_score !== null) {
      indicators.push({
        type: 'score',
        label: 'Garage Score',
        value: vehicle.garage_score,
        maxValue: 100,
        status: vehicle.garage_score >= 70 ? 'good' : vehicle.garage_score >= 40 ? 'medium' : 'low',
      });
    }
    
    // Mileage
    if (vehicle.mileage) {
      indicators.push({
        type: 'mileage',
        label: 'Mileage',
        value: `${vehicle.mileage.toLocaleString()} mi`,
        status: 'neutral',
      });
    }
    
    return {
      id: vehicle.id,
      name: vehicleName,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      slug: vehicle.matched_car_slug,
      isPrimary: vehicle.is_primary,
      garageScore: vehicle.garage_score || 0,
      hpGain, // Now from active build
      modCount: mods.length,
      indicators,
    };
  });
}

/**
 * Filter out insights that user has marked as not helpful
 */
function filterByFeedback(insights, type, feedback) {
  return insights.filter(insight => {
    const key = `${type}-${insight.id}`;
    return feedback[key] !== 'down'; // Keep if not thumbs down
  });
}

/**
 * Main function to generate insights for a user
 * 
 * Returns comprehensive insights including:
 * - Action items (time-sensitive tasks)
 * - Build progress (comparing installed vs planned mods)
 * - Performance summary (total HP gains, investment)
 * - Vehicle health (per-vehicle status)
 * - Known issues and recalls
 * - Maintenance schedules
 * - Upgrade recommendations
 * 
 * @param {string} userId - User ID
 * @param {string} vehicleId - Optional specific vehicle ID to focus on
 * @returns {Object} Comprehensive insights data
 */
export async function getInsightsForUser(userId, vehicleId = null) {
  if (!supabase || !userId) {
    return { vehicles: [], insights: {}, preferences: {}, summary: null };
  }
  
  try {
    // Fetch all user data in parallel
    const [vehicles, projects, preferences, feedback] = await Promise.all([
      getUserVehicles(userId),
      getUserProjects(userId),
      getUserPreferences(userId),
      getUserFeedback(userId),
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
    
    // Generate garage-wide insights (with individual error handling)
    let actionItems = [];
    let buildProgress = [];
    let performanceSummary = {};
    let vehicleHealth = [];
    
    try {
      actionItems = generateActionItems(vehicles);
    } catch (e) {
      console.error('[InsightService] Error generating action items:', e);
    }
    
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
    
    try {
      // Pass buildProgress to get HP gain from active builds (source of truth)
      vehicleHealth = generateVehicleHealth(vehicles, buildProgress);
    } catch (e) {
      console.error('[InsightService] Error generating vehicle health:', e);
    }
    
    // Find the target vehicle for vehicle-specific insights
    const targetVehicle = vehicleId 
      ? vehicles.find(v => v.id === vehicleId)
      : vehicles[0];
    
    let knownIssues = [];
    let recallInsights = [];
    let maintenance = [];
    let recommendations = [];
    
    if (targetVehicle) {
      const carSlug = targetVehicle.matched_car_slug;
      const carId = targetVehicle.matched_car_id;
      
      // Fetch car-specific data
      const [issues, recalls, intervals, upgrades] = await Promise.all([
        getKnownIssues(carSlug, carId),
        getRecalls(carSlug, carId),
        getMaintenanceIntervals(carSlug, carId),
        getUpgradeSuggestions(carSlug, carId, preferences),
      ]);
      
      // Process and filter insights
      knownIssues = filterByFeedback(
        issues.map(issue => ({
          id: issue.id,
          title: issue.title,
          description: issue.description,
          severity: mapSeverity(issue.severity),
          kind: issue.kind,
          affectedYears: issue.affected_years_text,
          fix: issue.fix_description,
          cost: issue.estimated_cost_text,
        })),
        'known_issue',
        feedback
      );
      
      // Add recalls to known issues
      recallInsights = filterByFeedback(
        recalls.map(recall => ({
          id: `recall-${recall.id}`,
          title: `Recall: ${recall.component}`,
          description: recall.summary,
          severity: 'high',
          kind: 'recall',
          remedy: recall.remedy,
        })),
        'recall',
        feedback
      );
      
      // Process maintenance intervals
      maintenance = filterByFeedback(
        intervals.map(interval => ({
          id: interval.id,
          title: formatServiceType(interval.service_type),
          description: interval.description || `Every ${interval.interval_miles?.toLocaleString() || '?'} miles`,
          dueInfo: interval.interval_miles ? `Every ${interval.interval_miles.toLocaleString()} mi` : null,
          cost: interval.estimated_cost_low && interval.estimated_cost_high
            ? `$${interval.estimated_cost_low} - $${interval.estimated_cost_high}`
            : null,
        })),
        'maintenance_due',
        feedback
      );
      
      // Process upgrade suggestions
      recommendations = filterByFeedback(
        upgrades.map(upgrade => ({
          id: upgrade.id,
          title: upgrade.title,
          description: upgrade.description,
          link: upgrade.link,
          objective: upgrade.objective,
        })),
        'upgrade_suggestion',
        feedback
      );
    }
    
    // Combine issues and recalls
    const allKnownIssues = [...knownIssues, ...recallInsights]
      .sort((a, b) => severityOrder(a.severity) - severityOrder(b.severity));
    
    return {
      vehicles,
      insights: {
        // New actionable insights
        actionItems,
        buildProgress,
        vehicleHealth,
        // Existing insights
        knownIssues: allKnownIssues,
        maintenance,
        recommendations,
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

/**
 * Map severity string to standardized values
 */
function mapSeverity(severity) {
  const lower = (severity || '').toLowerCase();
  if (lower.includes('critical') || lower.includes('severe')) return 'critical';
  if (lower.includes('high') || lower.includes('major')) return 'high';
  if (lower.includes('medium') || lower.includes('moderate')) return 'medium';
  return 'low';
}

/**
 * Get severity order for sorting (lower = more severe)
 */
function severityOrder(severity) {
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return order[severity] ?? 4;
}

/**
 * Format service type for display
 */
function formatServiceType(serviceType) {
  if (!serviceType) return 'Service';
  return serviceType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

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
  generateVehicleHealth,
};
