/**
 * Notification Preferences API Route
 * GET /api/notifications/preferences - Fetch user's preferences
 * PUT /api/notifications/preferences - Update user's preferences
 */

// Force dynamic to prevent static prerendering (uses cookies/auth)
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { getPreferences, updatePreferences } from '@/lib/notificationService';
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

    const { data, error } = await getPreferences(user.id);

    if (error) {
      console.error('[API] Error fetching preferences:', error);
      return NextResponse.json(
        { error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[API] Exception in preferences GET:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePut(request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { data, error } = await updatePreferences(user.id, body);

    if (error) {
      console.error('[API] Error updating preferences:', error);
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('[API] Exception in preferences PUT:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const GET = withErrorLogging(handleGet, { route: 'notifications-preferences', feature: 'notifications' });
export const PUT = withErrorLogging(handlePut, { route: 'notifications-preferences', feature: 'notifications' });
