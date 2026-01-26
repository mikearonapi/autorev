/**
 * Admin Fatigued Users API
 * GET /api/admin/notifications/fatigued-users
 */

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAccess';
import { getFatiguedUsers } from '@/lib/notificationFatigueService';
import { withErrorLogging } from '@/lib/serverErrorLogger';

async function handleGet(request) {
  try {
    // Auth check
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const { data, error } = await getFatiguedUsers(Math.min(limit, 100));

    if (error) {
      console.error('[Admin API] Error fetching fatigued users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    return NextResponse.json({ users: data });
  } catch (err) {
    console.error('[Admin API] Exception:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/notifications/fatigued-users', feature: 'admin' });
