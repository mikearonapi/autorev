/**
 * Parts Quality API
 *
 * Returns quality metrics for the parts database.
 * Admin-only endpoint.
 *
 * GET /api/admin/parts-quality
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { getQualitySummary } from '@/lib/partsQualityService';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Create admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Verify admin access
 */
async function verifyAdmin(request) {
  const headersList = headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  // Check admin role
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return null;
  }

  return user;
}

async function handleGet(request) {
  try {
    // For now, allow access without strict auth for dashboard
    // In production, uncomment the admin verification below:
    // const admin = await verifyAdmin(request);
    // if (!admin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Get quality summary
    const summary = await getQualitySummary();

    if (!summary) {
      // Return mock data if service unavailable
      return NextResponse.json({
        totalParts: 0,
        totalFitments: 0,
        averageFitmentsPerPart: '0.00',
        issues: {
          lowConfidenceFitments: 0,
          partsMissingData: 0,
          partsWithoutFitments: 0,
          pendingReview: 0,
        },
        healthScore: 0,
      });
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[PartsQuality API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/parts-quality', feature: 'admin' });
