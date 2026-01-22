/**
 * POST /api/lap-times/estimate
 * 
 * Estimate lap time for a car at a track using real data.
 * Uses the centralized lapTimeService.
 */

import { NextResponse } from 'next/server';
import lapTimeService from '@/lib/lapTimeService';

export async function POST(request) {
  try {
    const body = await request.json();
    
    const {
      trackSlug,
      stockHp,
      currentHp,
      weight,
      driverSkill,
      mods,
    } = body;
    
    if (!trackSlug) {
      return NextResponse.json(
        { error: 'trackSlug is required' },
        { status: 400 }
      );
    }
    
    const estimate = await lapTimeService.estimateLapTime({
      trackSlug,
      stockHp: stockHp || 300,
      currentHp: currentHp || stockHp,
      weight: weight || 3500,
      driverSkill: driverSkill || 'intermediate',
      mods: mods || {},
    });
    
    return NextResponse.json(estimate);
    
  } catch (error) {
    console.error('[API] Lap time estimate error:', error);
    return NextResponse.json(
      { error: 'Failed to estimate lap time', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/lap-times/estimate?trackSlug=xxx
 * 
 * Get track statistics and baseline data
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackSlug = searchParams.get('trackSlug');
    
    if (!trackSlug) {
      return NextResponse.json(
        { error: 'trackSlug query parameter is required' },
        { status: 400 }
      );
    }
    
    const [stats, baseline] = await Promise.all([
      lapTimeService.getTrackStatsSummary(trackSlug),
      lapTimeService.getTrackBaseline(trackSlug),
    ]);
    
    return NextResponse.json({
      trackSlug,
      stats,
      baseline,
    });
    
  } catch (error) {
    console.error('[API] Track stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get track stats', details: error.message },
      { status: 500 }
    );
  }
}
