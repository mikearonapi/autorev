/**
 * User Insights API Route
 * 
 * GET /api/users/:userId/insights
 * Returns personalized insights for user's garage vehicles
 * 
 * Query params:
 * - vehicleId: Optional specific vehicle to get insights for
 */

import { NextResponse } from 'next/server';
import { getInsightsForUser } from '@/lib/insightService';

export async function GET(request, { params }) {
  const startTime = Date.now();
  const { userId } = await params;
  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('vehicleId');

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
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
  } catch (error) {
    console.error('[Insights API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights', details: error.message },
      { status: 500 }
    );
  }
}
