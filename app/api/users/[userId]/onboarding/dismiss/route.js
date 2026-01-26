/**
 * Onboarding Dismissal API
 * 
 * Tracks when users dismiss the onboarding modal.
 * After 3 dismissals, permanently opts them out.
 * 
 * POST /api/users/[userId]/onboarding/dismiss
 */

import { NextResponse } from 'next/server';

import { withErrorLogging } from '@/lib/serverErrorLogger';
import { createAuthenticatedClient, getBearerToken, createServerSupabaseClient } from '@/lib/supabaseServer';

const MAX_DISMISSALS = 3;

/**
 * POST /api/users/[userId]/onboarding/dismiss
 * Track a dismissal and optionally opt out permanently
 */
async function handlePost(request, { params }) {
  const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Get authenticated user - try bearer token first, then cookie-based session
    const bearerToken = getBearerToken(request);
    const supabase = bearerToken 
      ? createAuthenticatedClient(bearerToken) 
      : await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication service not configured' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('[API/onboarding/dismiss] Auth failed:', authError?.message || 'No user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the authenticated user matches the userId param
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to dismiss onboarding for this user' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { optOut } = body;

    // First, get current dismissal count
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('onboarding_dismissed_count, onboarding_opted_out')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('[API/onboarding/dismiss] Error fetching profile:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // If already opted out, just return current state
    if (profile?.onboarding_opted_out) {
      return NextResponse.json({
        success: true,
        dismissedCount: profile.onboarding_dismissed_count || 0,
        optedOut: true,
      });
    }

    // Increment dismissal count
    const currentCount = profile?.onboarding_dismissed_count || 0;
    const newCount = currentCount + 1;
    const shouldOptOut = optOut === true || newCount >= MAX_DISMISSALS;

    // Build update
    const updates = {
      onboarding_dismissed_count: newCount,
    };

    if (shouldOptOut) {
      updates.onboarding_opted_out = true;
      console.log('[API/onboarding/dismiss] User opted out after', newCount, 'dismissals');
    }

    // Update profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select('onboarding_dismissed_count, onboarding_opted_out')
      .single();

    if (error) {
      console.error('[API/onboarding/dismiss] Error updating profile:', error);
      return NextResponse.json(
        { error: 'Failed to track dismissal' },
        { status: 500 }
      );
    }

    console.log('[API/onboarding/dismiss] Tracked dismissal for user:', userId.slice(0, 8) + '...', {
      count: data?.onboarding_dismissed_count,
      optedOut: data?.onboarding_opted_out,
    });

    return NextResponse.json({
      success: true,
      dismissedCount: data?.onboarding_dismissed_count || newCount,
      optedOut: data?.onboarding_opted_out || false,
    });
}

export const POST = withErrorLogging(handlePost, { route: 'users/onboarding/dismiss', feature: 'onboarding' });













