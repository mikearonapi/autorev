/**
 * Mark All Notifications Read API Route
 * POST /api/notifications/read-all - Mark all notifications as read
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { markAllAsRead } from '@/lib/notificationService';

export async function POST(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await markAllAsRead(user.id);

    if (error) {
      console.error('[API] Error marking all notifications as read:', error);
      return NextResponse.json(
        { error: 'Failed to mark notifications as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      markedCount: data?.count || 0 
    });
  } catch (err) {
    console.error('[API] Exception in read-all POST:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
