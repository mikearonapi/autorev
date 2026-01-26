/**
 * User Insights API Route
 * 
 * GET /api/users/:userId/insights
 * Returns personalized insights for user's garage vehicles
 * 
 * Query params:
 * - vehicleId: Optional specific vehicle to get insights for
 * 
 * Auth: User must be authenticated and can only access their own insights
 */

import { NextResponse } from 'next/server';

import { errors } from '@/lib/apiErrors';
import { getInsightsForUser } from '@/lib/insightService';
import { rateLimit } from '@/lib/rateLimit';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';

async function handleGet(request, { params }) {
  // Rate limit - api preset (60 req/min)
  const limited = rateLimit(request, 'api');
  if (limited) return limited;

  const startTime = Date.now();
  const { userId } = await params;
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('vehicleId');

  if (!userId) {
    return errors.missingField('userId');
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
    return errors.forbidden('Not authorized to view this user\'s insights');
  }

  console.log('[Insights API] Fetching insights for user:', userId, 'vehicleId:', vehicleId);
  const data = await getInsightsForUser(userId, vehicleId);
  console.log('[Insights API] Result:', {
    vehicleCount: data?.vehicles?.length || 0,
    hasInsights: !!data?.insights,
    hasSummary: !!data?.summary,
  });

  return NextResponse.json({
    success: true,
    data,
    meta: {
      requestTime: Date.now() - startTime,
    },
  });
}

export const GET = withErrorLogging(handleGet, { route: 'users/insights', feature: 'insights' });
