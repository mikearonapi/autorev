/**
 * Unread Count API Route
 * GET /api/notifications/unread-count - Get unread notification count
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getUnreadCount } from '@/lib/notificationService';
import { withErrorLogging } from '@/lib/serverErrorLogger';

async function handleGet(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await getUnreadCount(user.id);

    if (error) {
      console.error('[API] Error fetching unread count:', error);
      return NextResponse.json(
        { error: 'Failed to fetch unread count' },
        { status: 500 }
      );
    }

    return NextResponse.json({ count: data });
  } catch (err) {
    console.error('[API] Exception in unread-count GET:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withErrorLogging(handleGet, { route: 'notifications-unread-count', feature: 'notifications' });
