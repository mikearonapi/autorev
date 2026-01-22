/**
 * Vehicle Garage Score API
 * 
 * Endpoints:
 * - GET: Get current garage score and breakdown
 * - POST: Force recalculate garage score
 * 
 * Auth: User must be authenticated and can only access their own vehicles
 */

import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { 
  getVehicleScore, 
  calculateScore, 
  recalculateScore,
  getScoreChecklist,
  getImprovementTips,
  getScoreLevel,
} from '@/lib/garageScoreService';

/**
 * GET /api/users/[userId]/vehicles/[vehicleId]/score
 * Get current garage score with breakdown and improvement tips
 */
async function handleGet(request, { params }) {
  const { userId, vehicleId } = await params;
  
  if (!userId || !vehicleId) {
    return errors.missingField('userId and vehicleId');
  }
  
  // Get authenticated user
  const bearerToken = getBearerToken(request);
  const supabase = bearerToken 
    ? createAuthenticatedClient(bearerToken) 
    : await createServerSupabaseClient();

  if (!supabase) {
    return errors.serviceUnavailable('Authentication service');
  }

  const { data: { user }, error: authError } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();
  
  if (authError || !user) {
    return errors.unauthorized();
  }
  
  // Verify the authenticated user matches the userId param
  if (user.id !== userId) {
    return errors.forbidden('Not authorized to view this vehicle');
  }

  // Verify vehicle belongs to user
  const { data: vehicle, error: vehicleError } = await supabase
    .from('user_vehicles')
    .select('id, nickname, year, make, model')
    .eq('id', vehicleId)
    .eq('user_id', userId)
    .single();

  if (vehicleError || !vehicle) {
    return errors.notFound('Vehicle');
  }

  // Get score data
  const scoreData = await getVehicleScore(vehicleId);
  const checklist = getScoreChecklist(scoreData.breakdown);
  const tips = getImprovementTips(scoreData.breakdown);
  const level = getScoreLevel(scoreData.totalScore);

  return NextResponse.json({
    vehicleId,
    vehicleName: vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    score: scoreData.totalScore,
    breakdown: scoreData.breakdown,
    updatedAt: scoreData.updatedAt,
    level,
    checklist,
    tips,
  });
}

/**
 * POST /api/users/[userId]/vehicles/[vehicleId]/score
 * Force recalculate garage score
 * 
 * Query params:
 * - preview=true: Calculate without saving (dry run)
 */
async function handlePost(request, { params }) {
  const { userId, vehicleId } = await params;
  const { searchParams } = new URL(request.url);
  const preview = searchParams.get('preview') === 'true';
  
  if (!userId || !vehicleId) {
    return errors.missingField('userId and vehicleId');
  }
  
  // Get authenticated user
  const bearerToken = getBearerToken(request);
  const supabase = bearerToken 
    ? createAuthenticatedClient(bearerToken) 
    : await createServerSupabaseClient();

  if (!supabase) {
    return errors.serviceUnavailable('Authentication service');
  }

  const { data: { user }, error: authError } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();
  
  if (authError || !user) {
    return errors.unauthorized();
  }
  
  // Verify the authenticated user matches the userId param
  if (user.id !== userId) {
    return errors.forbidden('Not authorized to modify this vehicle');
  }

  // Verify vehicle belongs to user
  const { data: vehicle, error: vehicleError } = await supabase
    .from('user_vehicles')
    .select('id, nickname, year, make, model, garage_score')
    .eq('id', vehicleId)
    .eq('user_id', userId)
    .single();

  if (vehicleError || !vehicle) {
    return errors.notFound('Vehicle');
  }

  const previousScore = vehicle.garage_score || 0;

  if (preview) {
    // Calculate without saving
    const calculated = await calculateScore(vehicleId);
    const checklist = getScoreChecklist(calculated.breakdown);
    const tips = getImprovementTips(calculated.breakdown);
    const level = getScoreLevel(calculated.totalScore);

    return NextResponse.json({
      preview: true,
      vehicleId,
      vehicleName: vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      previousScore,
      newScore: calculated.totalScore,
      change: calculated.totalScore - previousScore,
      breakdown: calculated.breakdown,
      level,
      checklist,
      tips,
    });
  }

  // Recalculate and save
  const newScore = await recalculateScore(vehicleId);
  
  // Get full updated data
  const scoreData = await getVehicleScore(vehicleId);
  const checklist = getScoreChecklist(scoreData.breakdown);
  const tips = getImprovementTips(scoreData.breakdown);
  const level = getScoreLevel(scoreData.totalScore);

  return NextResponse.json({
    success: true,
    vehicleId,
    vehicleName: vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    previousScore,
    newScore,
    change: newScore - previousScore,
    breakdown: scoreData.breakdown,
    updatedAt: scoreData.updatedAt,
    level,
    checklist,
    tips,
  });
}

// Export wrapped handlers with error logging
export const GET = withErrorLogging(handleGet, { route: 'users/vehicles/[vehicleId]/score', feature: 'garage' });
export const POST = withErrorLogging(handlePost, { route: 'users/vehicles/[vehicleId]/score', feature: 'garage' });
