/**
 * Feed Interaction Tracking API
 *
 * POST /api/community/feed/track - Track user interactions with feed content
 *
 * Used by the frontend to report:
 * - impressions (posts shown)
 * - views (user swiped to this post)
 * - dwell time (time spent on post)
 * - detail views (tapped to expand)
 * - likes, comments, shares
 *
 * @route /api/community/feed/track
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import {
  trackEngagement,
  trackFeedImpression,
  recalculateUserPreferences,
} from '@/lib/feedAlgorithm';
import { withErrorLogging } from '@/lib/serverErrorLogger';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/community/feed/track
 * Track feed interactions
 */
async function handlePost(request) {
  try {
    const body = await request.json();
    const {
      action,
      sessionId,
      postId,
      posts, // For batch impressions
      car_id, // Preferred: use car_id directly
      carMake,
      feedPosition,
      dwellTimeMs,
    } = body;

    // Get user ID from auth if available
    let userId = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id;
    }

    // Validate required fields
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Handle batch impressions
    if (action === 'impression' && posts && Array.isArray(posts)) {
      await trackFeedImpression(userId, posts, sessionId);
      return NextResponse.json({ success: true, tracked: posts.length });
    }

    // Handle single interaction
    if (!postId || !action) {
      return NextResponse.json({ error: 'postId and action are required' }, { status: 400 });
    }

    // Validate action type
    const validActions = [
      'impression',
      'view',
      'dwell',
      'like',
      'unlike',
      'comment',
      'share',
      'detail_view',
      'swipe_past',
      'image_swipe',
    ];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action type' }, { status: 400 });
    }

    // Track the engagement
    await trackEngagement({
      userId,
      sessionId,
      postId,
      carId: car_id || null, // Use car_id (carSlug removed)
      carMake,
      action,
      feedPosition,
      dwellTimeMs,
    });

    // If this is a significant engagement, queue preference recalculation
    const significantActions = ['like', 'comment', 'share', 'detail_view'];
    if (userId && significantActions.includes(action)) {
      // Recalculate preferences in background (don't await)
      recalculateUserPreferences(userId).catch((err) => {
        console.error('[FeedTrack] Background preference update failed:', err);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[FeedTrack] Error:', error);
    return NextResponse.json({ error: 'Failed to track interaction' }, { status: 500 });
  }
}

export const POST = withErrorLogging(handlePost, {
  route: 'community/feed/track',
  feature: 'feed-tracking',
});
