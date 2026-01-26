/**
 * Engagement Analytics API
 * 
 * POST /api/analytics/engagement
 * 
 * Tracks detailed engagement metrics:
 * - Time on page (total and engaged)
 * - Scroll depth and milestones
 * - Click interactions
 * - Engagement score and tier
 */

import { headers } from 'next/headers';

import { createClient } from '@supabase/supabase-js';

import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handlePost(request) {
  const body = await request.json();
    
    const {
      pageViewId,
      sessionId,
      path,
      timeOnPageSeconds,
      engagedTimeSeconds,
      maxScrollDepthPercent,
      scrollMilestones,
      clickCount,
      copyCount,
      formInteractions,
      engagementScore,
      engagementTier
    } = body;
    
    // Validate required fields
    if (!sessionId || !path) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Skip very short visits (less than 1 second)
    if (timeOnPageSeconds < 1) {
      return Response.json({ success: true, skipped: true });
    }
    
    // Insert engagement record
    const { error } = await supabase
      .from('page_engagement')
      .insert({
        page_view_id: pageViewId || null,
        session_id: sessionId,
        path,
        time_on_page_seconds: timeOnPageSeconds || 0,
        engaged_time_seconds: engagedTimeSeconds || 0,
        max_scroll_depth_percent: maxScrollDepthPercent || 0,
        scroll_milestones: scrollMilestones || [],
        click_count: clickCount || 0,
        copy_count: copyCount || 0,
        form_interactions: formInteractions || 0,
        engagement_score: engagementScore || 0,
        engagement_tier: engagementTier || 'light'
      });
    
    if (error) {
      console.error('[Engagement API] Insert error:', error);
      // Don't fail - analytics shouldn't break the app
    }
    
    // Check for goal completions based on engagement
    if (engagementTier === 'deep') {
      // Track deep engagement goal
      await supabase
        .from('goal_completions')
        .insert({
          goal_id: (await supabase
            .from('analytics_goals')
            .select('id')
            .eq('goal_key', 'deep_engagement')
            .single()).data?.id,
          session_id: sessionId,
          page_path: path
        })
        .catch(() => {}); // Ignore errors
    }
    
    return Response.json({ success: true });
}

export const POST = withErrorLogging(handlePost, { route: 'analytics/engagement', feature: 'analytics' });

