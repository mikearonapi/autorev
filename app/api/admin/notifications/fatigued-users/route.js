/**
 * Admin Fatigued Users API
 * GET /api/admin/notifications/fatigued-users
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { isAdminEmail } from '@/lib/adminAccess';
import { getFatiguedUsers } from '@/lib/notificationFatigueService';

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
