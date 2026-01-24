/**
 * Notifications API Route
 * GET /api/notifications - Fetch user's notifications
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getNotifications } from '@/lib/notificationService';

export async function GET(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const includeRead = searchParams.get('includeRead') !== 'false';
    const category = searchParams.get('category') || null;

    const { data, error } = await getNotifications(user.id, {
      limit: Math.min(limit, 100), // Cap at 100
      offset,
      includeRead,
      category,
    });

    if (error) {
      console.error('[API] Error fetching notifications:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[API] Exception in notifications GET:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
