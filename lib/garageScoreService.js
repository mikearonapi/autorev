/**
 * Garage Score Service
 * 
 * Calculates and manages the garage completeness score (0-100) for vehicles.
 * 
 * Scoring breakdown:
 *   +20: Specs complete (year, make, model, trim, color, mileage)
 *   +20: Has photos
 *   +20: Has modifications
 *   +20: Has build goals/projects
 *   +20: Has parts list
 * 
 * @example
 * import { getVehicleScore, recalculateScore } from '@/lib/garageScoreService';
 * 
 * // Get current score
 * const score = await getVehicleScore(vehicleId);
 * console.log(score.totalScore); // 60
 * console.log(score.breakdown); // { specs: 20, photos: 10, mods: 20, goals: 0, parts: 10 }
 * 
 * // Force recalculation
 * const newScore = await recalculateScore(vehicleId);
 */

import { supabaseServiceRole as supabase } from './supabase';

/**
 * Scoring categories and their max points
 * 
 * Updated 2026-01-21: New 5-category system focused on engagement
 * - Specs Confirmed: User validates their vehicle specs
 * - Build Saved: Complete a build in Tuning Shop
 * - Build Shared: Share to community (highest value!)
 * - Parts Specified: Add specific parts with brand/model
 * - Photos Uploaded: Upload photos of YOUR car
 */
export const SCORE_CATEGORIES = {
  specs_confirmed: { 
    max: 20, 
    label: 'Specs Confirmed', 
    description: 'Verify your vehicle specs',
    howToEarn: 'Review and confirm your vehicle specs are accurate.',
    icon: '✓',
  },
  build_saved: { 
    max: 15, 
    label: 'Build Saved', 
    description: 'Complete a build project',
    howToEarn: 'Save a build in the Tuning Shop for this vehicle.',
    icon: '🔧',
  },
  build_shared: { 
    max: 25, 
    label: 'Build Shared', 
    description: 'Share to community',
    howToEarn: 'Share your build to the community feed for 25 points!',
    icon: '📤',
  },
  parts_specified: { 
    max: 25, 
    label: 'Parts Specified', 
    description: 'Add specific parts',
    howToEarn: 'Add parts with brand/model details. 1-2 = 10pts, 3+ = 25pts.',
    icon: '🛒',
  },
  photos_uploaded: { 
    max: 15, 
    label: 'Photos Uploaded', 
    description: 'Upload your photos',
    howToEarn: 'Upload photos of YOUR actual car.',
    icon: '📷',
  },
};

/**
 * Get the current score for a vehicle (from cached column)
 * 
 * @param {string} vehicleId - UUID of the vehicle
 * @returns {Promise<{totalScore: number, breakdown: object, updatedAt: string|null}>}
 */
export async function getVehicleScore(vehicleId) {
  if (!supabase) {
    console.warn('[garageScoreService] Supabase not configured');
    return { totalScore: 0, breakdown: getEmptyBreakdown(), updatedAt: null };
  }

  const { data, error } = await supabase
    .from('user_vehicles')
    .select('garage_score, score_breakdown, score_updated_at')
    .eq('id', vehicleId)
    .single();

  if (error || !data) {
    console.error('[garageScoreService] Error fetching score:', error);
    return { totalScore: 0, breakdown: getEmptyBreakdown(), updatedAt: null };
  }

  return {
    totalScore: data.garage_score || 0,
    breakdown: data.score_breakdown || getEmptyBreakdown(),
    updatedAt: data.score_updated_at,
  };
}

/**
 * Get scores for all vehicles belonging to a user
 * 
 * @param {string} userId - UUID of the user
 * @returns {Promise<Array<{vehicleId: string, name: string, totalScore: number, breakdown: object}>>}
 */
export async function getUserVehicleScores(userId) {
  if (!supabase) {
    console.warn('[garageScoreService] Supabase not configured');
    return [];
  }

  const { data, error } = await supabase
    .from('user_vehicles')
    .select('id, nickname, year, make, model, garage_score, score_breakdown')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[garageScoreService] Error fetching user scores:', error);
    return [];
  }

  return (data || []).map(v => ({
    vehicleId: v.id,
    name: v.nickname || `${v.year} ${v.make} ${v.model}`,
    totalScore: v.garage_score || 0,
    breakdown: v.score_breakdown || getEmptyBreakdown(),
  }));
}

/**
 * Calculate score for a vehicle (calls database function)
 * Use this to preview score without saving
 * 
 * @param {string} vehicleId - UUID of the vehicle
 * @returns {Promise<{totalScore: number, breakdown: object, details: object}>}
 */
export async function calculateScore(vehicleId) {
  if (!supabase) {
    return { totalScore: 0, breakdown: getEmptyBreakdown(), details: {} };
  }

  const { data, error } = await supabase
    .rpc('calculate_garage_score', { p_vehicle_id: vehicleId });

  if (error || !data || data.length === 0) {
    console.error('[garageScoreService] Error calculating score:', error);
    return { totalScore: 0, breakdown: getEmptyBreakdown(), details: {} };
  }

  const result = data[0];
  return {
    totalScore: result.total_score,
    breakdown: result.breakdown,
    details: {
      specs: result.specs_score,
      photos: result.photos_score,
      mods: result.mods_score,
      goals: result.goals_score,
      parts: result.parts_score,
    },
  };
}

/**
 * Force recalculate and persist score for a vehicle
 * 
 * @param {string} vehicleId - UUID of the vehicle
 * @returns {Promise<number>} - New total score
 */
export async function recalculateScore(vehicleId) {
  if (!supabase) {
    return 0;
  }

  const { data, error } = await supabase
    .rpc('update_vehicle_garage_score', { p_vehicle_id: vehicleId });

  if (error) {
    console.error('[garageScoreService] Error recalculating score:', error);
    return 0;
  }

  return data || 0;
}

/**
 * Recalculate scores for all vehicles of a user
 * 
 * @param {string} userId - UUID of the user
 * @returns {Promise<Array<{vehicleId: string, name: string, newScore: number}>>}
 */
export async function recalculateAllUserScores(userId) {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .rpc('update_all_garage_scores_for_user', { p_user_id: userId });

  if (error) {
    console.error('[garageScoreService] Error recalculating all scores:', error);
    return [];
  }

  return (data || []).map(row => ({
    vehicleId: row.vehicle_id,
    name: row.vehicle_name,
    newScore: row.new_score,
  }));
}

/**
 * Get completion checklist for a vehicle
 * 
 * @param {object} breakdown - Score breakdown object
 * @returns {Array<{key: string, label: string, description: string, points: number, maxPoints: number, complete: boolean, partial: boolean}>}
 */
export function getScoreChecklist(breakdown) {
  const bd = breakdown || getEmptyBreakdown();
  
  return Object.entries(SCORE_CATEGORIES).map(([key, cat]) => {
    const points = bd[key] || 0;
    return {
      key,
      label: cat.label,
      description: cat.description,
      points,
      maxPoints: cat.max,
      complete: points >= cat.max,
      partial: points > 0 && points < cat.max,
    };
  });
}

/**
 * Get tips for improving a score
 * 
 * Updated 2026-01-21: New 5-category system
 * 
 * @param {object} breakdown - Score breakdown object
 * @returns {Array<{category: string, tip: string, potentialGain: number}>}
 */
export function getImprovementTips(breakdown) {
  const bd = breakdown || getEmptyBreakdown();
  const tips = [];

  // Specs Confirmed (20 pts)
  if (!bd.specs_confirmed || bd.specs_confirmed < 20) {
    tips.push({
      category: 'specs_confirmed',
      tip: 'Confirm your vehicle specs are accurate',
      potentialGain: 20,
      action: 'confirm-specs',
    });
  }

  // Build Shared (25 pts) - Highest value, promote first!
  if (!bd.build_shared || bd.build_shared < 25) {
    if (bd.build_saved && bd.build_saved >= 15) {
      tips.push({
        category: 'build_shared',
        tip: 'Share your build to the community for 25 points!',
        potentialGain: 25,
        action: 'share-build',
      });
    }
  }

  // Parts Specified (25 pts)
  if (!bd.parts_specified || bd.parts_specified < 25) {
    const currentParts = bd.parts_specified || 0;
    tips.push({
      category: 'parts_specified',
      tip: currentParts > 0 ? 'Add more specific parts for full points' : 'Add specific parts with brand/model details',
      potentialGain: 25 - currentParts,
      action: 'add-parts',
    });
  }

  // Build Saved (15 pts)
  if (!bd.build_saved || bd.build_saved < 15) {
    tips.push({
      category: 'build_saved',
      tip: 'Create a build in the Tuning Shop',
      potentialGain: 15,
      action: 'create-build',
    });
  }

  // Photos Uploaded (15 pts)
  if (!bd.photos_uploaded || bd.photos_uploaded < 15) {
    tips.push({
      category: 'photos_uploaded',
      tip: 'Upload photos of your car',
      potentialGain: 15,
      action: 'upload-photos',
    });
  }

  // Sort by potential gain (highest first)
  return tips.sort((a, b) => b.potentialGain - a.potentialGain);
}

/**
 * Get score level/tier based on total score
 * 
 * @param {number} score - Total score (0-100)
 * @returns {{level: string, color: string, nextLevel: string|null, pointsToNext: number}}
 */
export function getScoreLevel(score) {
  if (score >= 100) {
    return { level: 'Complete', color: 'teal', nextLevel: null, pointsToNext: 0 };
  } else if (score >= 80) {
    return { level: 'Advanced', color: 'teal', nextLevel: 'Complete', pointsToNext: 100 - score };
  } else if (score >= 60) {
    return { level: 'Intermediate', color: 'blue', nextLevel: 'Advanced', pointsToNext: 80 - score };
  } else if (score >= 40) {
    return { level: 'Getting Started', color: 'blue', nextLevel: 'Intermediate', pointsToNext: 60 - score };
  } else if (score >= 20) {
    return { level: 'Beginner', color: 'secondary', nextLevel: 'Getting Started', pointsToNext: 40 - score };
  } else {
    return { level: 'New', color: 'secondary', nextLevel: 'Beginner', pointsToNext: 20 - score };
  }
}

/**
 * Returns an empty breakdown object
 */
function getEmptyBreakdown() {
  return { 
    specs_confirmed: 0, 
    build_saved: 0, 
    build_shared: 0, 
    parts_specified: 0, 
    photos_uploaded: 0 
  };
}

// Default export for convenient importing
const garageScoreService = {
  SCORE_CATEGORIES,
  getVehicleScore,
  getUserVehicleScores,
  calculateScore,
  recalculateScore,
  recalculateAllUserScores,
  getScoreChecklist,
  getImprovementTips,
  getScoreLevel,
};

export default garageScoreService;
