/**
 * Admin Notification Metrics API
 * GET /api/admin/notifications/metrics
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { isAdminEmail } from '@/lib/adminAccess';
import { getFatigueMetrics } from '@/lib/notificationFatigueService';

export async function GET(request) {
  try {
    // Auth check
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !isAdminEmail(user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
