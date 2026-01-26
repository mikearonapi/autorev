/**
 * Admin Notification Metrics API
 * GET /api/admin/notifications/metrics
 */

import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/adminAccess';
import { getFatigueMetrics } from '@/lib/notificationFatigueService';
import { withErrorLogging } from '@/lib/serverErrorLogger';

async function handleGet(request) {
  try {
    // Auth check
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const { data, error } = await getFatigueMetrics();

    if (error) {
      console.error('[Admin API] Error fetching notification metrics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[Admin API] Exception:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/notifications/metrics', feature: 'admin' });
