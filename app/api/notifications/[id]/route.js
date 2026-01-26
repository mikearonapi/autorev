/**
 * Single Notification API Route
 * PATCH /api/notifications/[id] - Mark notification as read
 * DELETE /api/notifications/[id] - Delete/dismiss notification
 */

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { markAsRead, deleteNotification } from '@/lib/notificationService';
import { withErrorLogging } from '@/lib/serverErrorLogger';

async function handlePatch(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await markAsRead(id, user.id);

    if (error) {
      console.error('[API] Error marking notification as read:', error);
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, notification: data });
  } catch (err) {
    console.error('[API] Exception in notification PATCH:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleDelete(request, { params }) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const { error } = await deleteNotification(id, user.id);

    if (error) {
      console.error('[API] Error deleting notification:', error);
      return NextResponse.json(
        { error: 'Failed to delete notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[API] Exception in notification DELETE:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const PATCH = withErrorLogging(handlePatch, { route: 'notifications-id', feature: 'notifications' });
export const DELETE = withErrorLogging(handleDelete, { route: 'notifications-id', feature: 'notifications' });
