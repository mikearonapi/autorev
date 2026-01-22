/**
 * User Onboarding API
 * 
 * Endpoints:
 * - GET: Get onboarding status and progress
 * - PATCH: Save onboarding progress (partial)
 * - POST: Complete onboarding
 * 
 * Auth: User must be authenticated and can only modify their own data
 */

import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { createAuthenticatedClient, getBearerToken, createServerSupabaseClient } from '@/lib/supabaseServer';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Valid enum values - must match options in components/onboarding/steps/ReferralStep.jsx
const VALID_REFERRAL_SOURCES = [
  'google', 'youtube', 'instagram', 'facebook', 'tiktok', 'twitter', 
  'reddit', 'forum', 'podcast', 'blog', 'friend', 'social', 'other'
];
const VALID_USER_INTENTS = ['owner', 'shopping', 'learning'];

/**
 * GET /api/users/[userId]/onboarding
 * Get onboarding status and partial data for resume
 */
async function handleGet(request, { params }) {
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
      console.log('[API/users/onboarding] Auth failed:', authError?.message || 'No user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the authenticated user matches the userId param
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to view this user\'s onboarding status' },
        { status: 403 }
      );
    }

    // Fetch user profile onboarding fields
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select(`
        onboarding_completed_at,
        onboarding_step,
        referral_source,
        referral_source_other,
        user_intent,
        email_opt_in_features,
        email_opt_in_events,
        onboarding_dismissed_count,
        onboarding_opted_out
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[API/users/onboarding] Error fetching profile:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to fetch onboarding status' },
        { status: 500 }
      );
    }

    const completed = !!profile?.onboarding_completed_at;
    const optedOut = !!profile?.onboarding_opted_out;
    
    return NextResponse.json({
      completed,
      completedAt: profile?.onboarding_completed_at || null,
      currentStep: profile?.onboarding_step || 1,
      dismissedCount: profile?.onboarding_dismissed_count || 0,
      optedOut,
      partialData: (completed || optedOut) ? null : {
        referral_source: profile?.referral_source,
        referral_source_other: profile?.referral_source_other,
        user_intent: profile?.user_intent,
        email_opt_in_features: profile?.email_opt_in_features || false,
        email_opt_in_events: profile?.email_opt_in_events || false,
      },
    });
}

/**
 * PATCH /api/users/[userId]/onboarding
 * Save onboarding progress (partial update)
 */
async function handlePatch(request, { params }) {
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
      console.log('[API/users/onboarding] PATCH auth failed:', authError?.message || 'No user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the authenticated user matches the userId param
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to update this user\'s onboarding' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { step, referral_source, referral_source_other, user_intent, email_opt_in_features, email_opt_in_events } = body;

    // Validate inputs
    if (referral_source && !VALID_REFERRAL_SOURCES.includes(referral_source)) {
      return NextResponse.json(
        { error: `Invalid referral_source. Must be one of: ${VALID_REFERRAL_SOURCES.join(', ')}` },
        { status: 400 }
      );
    }

    if (user_intent && !VALID_USER_INTENTS.includes(user_intent)) {
      return NextResponse.json(
        { error: `Invalid user_intent. Must be one of: ${VALID_USER_INTENTS.join(', ')}` },
        { status: 400 }
      );
    }

    // Total onboarding steps: Welcome(1) + Referral(2) + Intent(3) + 6 Feature slides(4-9) + Final(10) = 10
    if (step !== undefined && (typeof step !== 'number' || step < 1 || step > 10)) {
      return NextResponse.json(
        { error: 'Step must be a number between 1 and 10' },
        { status: 400 }
      );
    }

    // Build update object with only provided fields
    const updates = {};
    if (step !== undefined) updates.onboarding_step = step;
    if (referral_source !== undefined) updates.referral_source = referral_source;
    if (referral_source_other !== undefined) updates.referral_source_other = referral_source_other;
    if (user_intent !== undefined) updates.user_intent = user_intent;
    if (email_opt_in_features !== undefined) updates.email_opt_in_features = email_opt_in_features;
    if (email_opt_in_events !== undefined) updates.email_opt_in_events = email_opt_in_events;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[API/users/onboarding] Error updating progress:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to save progress' },
        { status: 500 }
      );
    }

    console.log('[API/users/onboarding] Progress saved for user:', userId.slice(0, 8) + '...');

    return NextResponse.json({
      success: true,
      currentStep: data?.onboarding_step || step,
    });
}

/**
 * POST /api/users/[userId]/onboarding
 * Complete onboarding (sets completion timestamp)
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
      console.log('[API/users/onboarding] POST auth failed:', authError?.message || 'No user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Verify the authenticated user matches the userId param
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Not authorized to complete this user\'s onboarding' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { referral_source, referral_source_other, user_intent, email_opt_in_features, email_opt_in_events } = body;

    // Validate required final inputs
    if (referral_source && !VALID_REFERRAL_SOURCES.includes(referral_source)) {
      return NextResponse.json(
        { error: `Invalid referral_source. Must be one of: ${VALID_REFERRAL_SOURCES.join(', ')}` },
        { status: 400 }
      );
    }

    if (user_intent && !VALID_USER_INTENTS.includes(user_intent)) {
      return NextResponse.json(
        { error: `Invalid user_intent. Must be one of: ${VALID_USER_INTENTS.join(', ')}` },
        { status: 400 }
      );
    }

    // Build update object with completion timestamp
    const updates = {
      onboarding_completed_at: new Date().toISOString(),
      onboarding_step: 10, // Mark as completed (final step)
    };

    // Include any final data from request
    if (referral_source !== undefined) updates.referral_source = referral_source;
    if (referral_source_other !== undefined) updates.referral_source_other = referral_source_other;
    if (user_intent !== undefined) updates.user_intent = user_intent;
    if (email_opt_in_features !== undefined) updates.email_opt_in_features = email_opt_in_features;
    if (email_opt_in_events !== undefined) updates.email_opt_in_events = email_opt_in_events;

    // Update profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('[API/users/onboarding] Error completing onboarding:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to complete onboarding' },
        { status: 500 }
      );
    }

    console.log('[API/users/onboarding] Onboarding completed for user:', userId.slice(0, 8) + '...');

    return NextResponse.json({
      success: true,
      completed: true,
      completedAt: data?.onboarding_completed_at,
      userIntent: data?.user_intent,
    });
}

export const GET = withErrorLogging(handleGet, { route: 'users/onboarding', feature: 'onboarding' });
export const PATCH = withErrorLogging(handlePatch, { route: 'users/onboarding', feature: 'onboarding' });
export const POST = withErrorLogging(handlePost, { route: 'users/onboarding', feature: 'onboarding' });

