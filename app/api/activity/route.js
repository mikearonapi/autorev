import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Use service role for server-side activity logging
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Valid event types (must match database CHECK constraint)
 */
const VALID_EVENT_TYPES = [
  'car_viewed',
  'car_favorited',
  'car_unfavorited',
  'comparison_started',
  'comparison_completed',
  'build_started',
  'build_saved',
  'build_deleted',
  'vehicle_added',
  'ai_mechanic_used',
  'search_performed',
  'filter_applied',
  'event_saved',       // New: for engagement tracking
  'parts_search',      // New: for engagement tracking
];

/**
 * Map activity types to engagement activity types
 * Only certain activities count toward engagement score
 */
const ENGAGEMENT_ACTIVITY_MAP = {
  vehicle_added: 'garage_car',
  ai_mechanic_used: 'al_conversation',
  build_saved: 'build_saved',
  comparison_completed: 'comparison',
  event_saved: 'event_saved',
  parts_search: 'parts_search',
};

/**
 * POST /api/activity
 * 
 * Lightweight endpoint for tracking user activity.
 * Designed to be fire-and-forget from the client.
 * 
 * Body: {
 *   event_type: string (required),
 *   event_data?: object,
 *   user_id?: string,
 *   session_id?: string
 * }
 */
async function handlePost(request) {
  const body = await request.json();
  const { event_type, event_data = {}, user_id, session_id } = body;

  // Validate event type
  if (!event_type || !VALID_EVENT_TYPES.includes(event_type)) {
    return NextResponse.json(
      { error: 'Invalid event_type', valid_types: VALID_EVENT_TYPES },
      { status: 400 }
    );
  }

  // Get client info from headers
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || null;
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null;

  // Insert activity record
  const { error } = await supabase
    .from('user_activity')
    .insert({
      user_id: user_id || null,
      session_id: session_id || null,
      event_type,
      event_data,
      user_agent: userAgent,
      ip_address: ipAddress,
    });

  if (error) {
    console.error('[Activity API] Error logging activity:', error);
    throw error; // Let the wrapper handle it
  }

  // Update engagement score if this activity counts and user is authenticated
  if (user_id && ENGAGEMENT_ACTIVITY_MAP[event_type]) {
    const engagementType = ENGAGEMENT_ACTIVITY_MAP[event_type];
    
    // Fire and forget - don't block on engagement update
    supabase.rpc('increment_engagement_activity', {
      p_user_id: user_id,
      p_activity_type: engagementType,
    }).catch((engageError) => {
      // Log but don't fail the request
      console.warn('[Activity API] Engagement update failed:', engageError.message);
    });
  }

  return NextResponse.json({ success: true });
}

export const POST = withErrorLogging(handlePost, { route: 'activity', feature: 'analytics' });

