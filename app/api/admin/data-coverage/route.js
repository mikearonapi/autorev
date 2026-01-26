/**
 * Data Coverage API
 * 
 * Returns comprehensive data coverage statistics for monitoring.
 * Used by admin dashboard to identify data gaps.
 * 
 * GET /api/admin/data-coverage
 * 
 * Response:
 * {
 *   coverage: { market_pricing: {...}, community_insights: {...}, ... },
 *   totals: { parts, fitments, youtube_videos, ... },
 *   critical_gaps: ['market_pricing', 'community_insights']
 * }
 */

import { NextResponse } from 'next/server';

import { getUser } from '@/lib/auth';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { supabaseServiceRole, isSupabaseConfigured } from '@/lib/supabase';

async function handleGet(_request) {
  try {
    // Check authentication
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin (optional - can be removed for internal use)
    const { data: profile } = await supabaseServiceRole
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!isSupabaseConfigured || !supabaseServiceRole) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    // Call the RPC function for coverage stats
    const { data, error } = await supabaseServiceRole.rpc('get_data_coverage_stats');

    if (error) {
      console.error('[data-coverage] RPC error:', error);
      return NextResponse.json({ error: 'Failed to fetch coverage stats' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[data-coverage] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch coverage stats' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/data-coverage', feature: 'admin' });
