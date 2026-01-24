/**
 * GDPR Data Deletion API (Right to be Forgotten)
 * 
 * Allows users to request deletion of all their personal data.
 * This endpoint:
 * 1. Verifies the user is authenticated
 * 2. Deletes user data from PostHog
 * 3. Deletes all user data from Supabase tables
 * 4. Deletes the user account from Supabase Auth
 * 
 * POST /api/user/delete-data
 * 
 * @module app/api/user/delete-data
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase/server';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Tables containing user data (order matters for foreign key constraints)
 */
const USER_DATA_TABLES = [
  // Analytics and activity
  'user_activity',
  'page_views',
  'engagement_metrics',
  'click_tracking',
  
  // User content
  'al_conversations',
  'al_messages',
  'saved_builds',
  'build_upgrades',
  'garage_vehicles',
  'user_favorites',
  'saved_events',
  
  // Engagement
  'weekly_engagement',
  'user_feedback',
  
  // User profile (last, as other tables may reference it)
  'profiles',
];

/**
 * Delete user data from PostHog
 * @param {string} userId 
 */
async function deleteFromPostHog(userId) {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!apiKey) {
    console.warn('[Delete Data] PostHog Personal API Key not configured, skipping PostHog deletion');
    return { skipped: true };
  }

  try {
    // PostHog uses the distinct_id (which is our user_id) for person deletion
    const response = await fetch(
      `https://app.posthog.com/api/person/${userId}/`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok || response.status === 404) {
      // 404 is ok - user may not exist in PostHog
      return { success: true };
    }

    const error = await response.text();
    console.error('[Delete Data] PostHog deletion failed:', error);
    return { error };
  } catch (error) {
    console.error('[Delete Data] PostHog deletion error:', error);
    return { error: error.message };
  }
}

/**
 * Delete user data from Supabase tables
 * @param {string} userId 
 */
async function deleteFromSupabase(userId) {
  const results = {};

  for (const table of USER_DATA_TABLES) {
    try {
      const { error, count } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('user_id', userId);

      if (error) {
        // Table may not exist or have different column name
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          results[table] = { skipped: true, reason: 'table not found' };
        } else if (error.message.includes('user_id')) {
          results[table] = { skipped: true, reason: 'no user_id column' };
        } else {
          results[table] = { error: error.message };
        }
      } else {
        results[table] = { deleted: count || 0 };
      }
    } catch (error) {
      results[table] = { error: error.message };
    }
  }

  return results;
}

/**
 * POST /api/user/delete-data
 * 
 * Request deletion of all user data (GDPR Right to be Forgotten)
 * 
 * Requires authentication. User can only delete their own data.
 * 
 * Body (optional):
 * {
 *   confirmation: "DELETE MY DATA" // Required confirmation string
 * }
 */
async function handlePost(request) {
  // Get authenticated user
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Parse request body
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Require confirmation string
  if (body.confirmation !== 'DELETE MY DATA') {
    return NextResponse.json(
      { 
        error: 'Confirmation required',
        message: 'Please send { "confirmation": "DELETE MY DATA" } to confirm deletion',
      },
      { status: 400 }
    );
  }

  const userId = user.id;
  console.log(`[Delete Data] Starting data deletion for user: ${userId.slice(0, 8)}...`);

  // Track deletion results
  const results = {
    userId: userId.slice(0, 8) + '...',
    timestamp: new Date().toISOString(),
    posthog: null,
    supabase: null,
    auth: null,
  };

  // 1. Delete from PostHog
  results.posthog = await deleteFromPostHog(userId);

  // 2. Delete from Supabase tables
  results.supabase = await deleteFromSupabase(userId);

  // 3. Delete user from Supabase Auth (this also signs them out)
  try {
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      results.auth = { error: deleteError.message };
      console.error('[Delete Data] Auth deletion failed:', deleteError);
    } else {
      results.auth = { deleted: true };
      console.log(`[Delete Data] User deleted: ${userId.slice(0, 8)}...`);
    }
  } catch (error) {
    results.auth = { error: error.message };
    console.error('[Delete Data] Auth deletion error:', error);
  }

  // Return summary
  const allSuccessful = 
    !results.posthog?.error &&
    !results.auth?.error &&
    !Object.values(results.supabase || {}).some(r => r?.error);

  return NextResponse.json({
    success: allSuccessful,
    message: allSuccessful 
      ? 'All user data has been deleted' 
      : 'Data deletion completed with some errors',
    results,
  }, { status: allSuccessful ? 200 : 207 }); // 207 Multi-Status if partial success
}

export const POST = withErrorLogging(handlePost, { 
  route: 'user/delete-data', 
  feature: 'gdpr' 
});
