/**
 * Feed Preferences Recalculation API
 * 
 * POST /api/community/feed/recalculate - Recalculate user preferences
 * 
 * Can be called:
 * - By a cron job (for all active users)
 * - By authenticated user (for themselves)
 * - By admin (for any user)
 * 
 * @route /api/community/feed/recalculate
 */

import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { createClient } from '@supabase/supabase-js';
import { recalculateUserPreferences } from '@/lib/feedAlgorithm';
import { withErrorLogging } from '@/lib/serverErrorLogger';

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST /api/community/feed/recalculate
 * Recalculate user feed preferences
 */
async function handlePost(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { userId: targetUserId, batchAll } = body;
    
    // Get requesting user
    let requestingUserId = null;
    let isAdmin = false;
    
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      requestingUserId = user?.id;
      
      // Check if admin
      if (requestingUserId) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('tier')
          .eq('id', requestingUserId)
          .single();
        isAdmin = profile?.tier === 'admin';
      }
    }
    
    // Check for cron secret (for batch jobs)
    const cronSecret = request.headers.get('x-cron-secret');
    const isCronJob = cronSecret === process.env.CRON_SECRET;
    
    // Batch recalculation for all active users (cron only)
    if (batchAll && (isCronJob || isAdmin)) {
      // Get users with recent interactions (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: activeUsers, error } = await supabaseAdmin
        .from('feed_interactions')
        .select('user_id')
        .gte('created_at', sevenDaysAgo)
        .not('user_id', 'is', null);
      
      if (error) {
        return NextResponse.json({ error: 'Failed to fetch active users' }, { status: 500 });
      }
      
      // Get unique user IDs
      const uniqueUserIds = [...new Set(activeUsers.map(u => u.user_id))];
      
      console.log(`[FeedRecalculate] Processing ${uniqueUserIds.length} active users`);
      
      // Process in batches to avoid overwhelming the database
      const results = { success: 0, failed: 0 };
      
      for (const userId of uniqueUserIds) {
        try {
          await recalculateUserPreferences(userId);
          results.success++;
        } catch (err) {
          console.error(`[FeedRecalculate] Failed for user ${userId}:`, err);
          results.failed++;
        }
      }
      
      return NextResponse.json({
        success: true,
        processed: uniqueUserIds.length,
        results,
      });
    }
    
    // Single user recalculation
    const userToRecalculate = targetUserId || requestingUserId;
    
    // Authorization check
    if (!userToRecalculate) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }
    
    // Only allow users to recalculate their own preferences (unless admin)
    if (targetUserId && targetUserId !== requestingUserId && !isAdmin && !isCronJob) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const preferences = await recalculateUserPreferences(userToRecalculate);
    
    if (!preferences) {
      return NextResponse.json({ 
        success: true, 
        message: 'No interactions found to calculate preferences' 
      });
    }
    
    return NextResponse.json({
      success: true,
      preferences: {
        confidence_score: preferences.confidence_score,
        total_interactions: preferences.total_interactions,
        preferred_makes: preferences.preferred_makes?.length || 0,
        preferred_cars: preferences.preferred_car_slugs?.length || 0,
      },
    });
    
  } catch (error) {
    console.error('[FeedRecalculate] Error:', error);
    return NextResponse.json({ error: 'Failed to recalculate preferences' }, { status: 500 });
  }
}

export const POST = withErrorLogging(handlePost, {
  route: 'community/feed/recalculate',
  feature: 'feed-preferences',
});
