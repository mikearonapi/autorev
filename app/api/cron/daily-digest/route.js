import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { postDailyDigest, postALIntelligence } from '@/lib/discord';
import { generateALIntelligence } from '@/lib/alIntelligence';
import { enhanceDigestStats } from '@/lib/digestEnhancer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronHeader = request.headers.get('x-vercel-cron');
  
  if (cronHeader !== 'true' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get yesterday's date range (UTC)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Query counts for the past 24 hours
    const [
      signupsResult,
      feedbackResult,
      contactsResult,
      alConversationsResult,
      eventSubmissionsResult,
      unresolvedBugsResult,
      feedbackCategoriesResult,
      // NEW: AL usage analytics
      alMessagesResult,
      alUsageStatsResult,
      // NEW: User activity analytics
      activeUsersResult,
      userActivityResult,
      // NEW: Auto-errors
      autoErrorsResult,
    ] = await Promise.all([
      // New signups
      supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),
      
      // Feedback submitted
      supabase
        .from('user_feedback')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),
      
      // Contact form submissions
      supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),
      
      // AL conversations started
      supabase
        .from('al_conversations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),
      
      // Event submissions
      supabase
        .from('event_submissions')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),
      
      // Unresolved bugs (all time)
      supabase
        .from('user_feedback')
        .select('id', { count: 'exact', head: true })
        .eq('category', 'bug')
        .or('issue_addressed.is.null,issue_addressed.eq.false'),
      
      // Top feedback categories (yesterday)
      supabase
        .from('user_feedback')
        .select('category')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),

      // AL messages sent (questions asked)
      supabase
        .from('al_messages')
        .select('id, role', { count: 'exact' })
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),

      // AL usage statistics (tokens, credits, tools)
      supabase
        .from('al_usage_logs')
        .select('credits_used, input_tokens, output_tokens, tool_calls')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),

      // Active users (unique user_ids in al_conversations, al_messages, user_feedback, or user_activity)
      supabase.rpc('get_daily_active_users', {
        p_start_date: yesterday.toISOString(),
        p_end_date: todayStart.toISOString(),
      }).then(result => {
        if (result.error) {
          console.warn('[DailyDigest] DAU function error:', result.error.message);
          return { data: [{ count: 0 }], error: null };
        }
        return result;
      }).catch(() => ({ data: [{ count: 0 }], error: null })), // Graceful fallback if RPC doesn't exist yet

      // User activity events
      supabase
        .from('user_activity')
        .select('event_type')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString())
        .catch(() => ({ data: [], error: null })), // Graceful fallback for empty table

      // Auto-errors (from yesterday)
      supabase
        .from('user_feedback')
        .select('id', { count: 'exact', head: true })
        .eq('category', 'auto-error')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),
    ]);

    // Calculate feedback categories
    const categoryCount = {};
    feedbackCategoriesResult.data?.forEach(f => {
      if (f.category) {
        categoryCount[f.category] = (categoryCount[f.category] || 0) + 1;
      }
    });
    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, count]) => `${cat} (${count})`);

    // Calculate AL usage stats
    const userQuestions = alMessagesResult.data?.filter(m => m.role === 'user').length || 0;
    const assistantResponses = alMessagesResult.data?.filter(m => m.role === 'assistant').length || 0;
    
    const totalCreditsUsed = alUsageStatsResult.data?.reduce((sum, log) => sum + (log.credits_used || 0), 0) || 0;
    const totalInputTokens = alUsageStatsResult.data?.reduce((sum, log) => sum + (log.input_tokens || 0), 0) || 0;
    const totalOutputTokens = alUsageStatsResult.data?.reduce((sum, log) => sum + (log.output_tokens || 0), 0) || 0;
    const totalToolCalls = alUsageStatsResult.data?.reduce((sum, log) => {
      const calls = Array.isArray(log.tool_calls) ? log.tool_calls.length : 0;
      return sum + calls;
    }, 0) || 0;

    // Calculate activity stats
    const activityByType = {};
    userActivityResult.data?.forEach(a => {
      if (a.event_type) {
        activityByType[a.event_type] = (activityByType[a.event_type] || 0) + 1;
      }
    });

    // Base stats
    const baseStats = {
      // User metrics
      signups: signupsResult.count || 0,
      activeUsers: activeUsersResult.count || 0,
      
      // Engagement metrics
      feedback: feedbackResult.count || 0,
      contacts: contactsResult.count || 0,
      eventSubmissions: eventSubmissionsResult.count || 0,
      
      // AL metrics
      alConversations: alConversationsResult.count || 0,
      alQuestions: userQuestions,
      alResponses: assistantResponses,
      alCreditsUsed: totalCreditsUsed,
      alTokensUsed: totalInputTokens + totalOutputTokens,
      alToolCalls: totalToolCalls,
      
      // Activity breakdown
      activity: activityByType,
      
      // Issues
      autoErrors: autoErrorsResult.count || 0,
      unresolvedBugs: unresolvedBugsResult.count || 0,
      topFeedbackCategories: topCategories,
    };

    // Get previous day's stats for trending
    const twoDaysAgo = new Date(yesterday);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);
    twoDaysAgo.setHours(0, 0, 0, 0);

    const [prevSignups, prevActiveUsers, prevALConversations] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', twoDaysAgo.toISOString())
        .lt('created_at', yesterday.toISOString()),
      
      supabase.rpc('get_daily_active_users', {
        p_start_date: twoDaysAgo.toISOString(),
        p_end_date: yesterday.toISOString(),
      }).catch(() => ({ count: 0 })),
      
      supabase
        .from('al_conversations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', twoDaysAgo.toISOString())
        .lt('created_at', yesterday.toISOString()),
    ]);

    const previousStats = {
      signups: prevSignups.count || 0,
      activeUsers: prevActiveUsers.count || 0,
      alConversations: prevALConversations.count || 0,
    };

    // Simple historical averages (could be more sophisticated with rolling averages)
    const historicalAvg = {
      signups: 2, // Default assumptions
      contacts: 2,
      alConversations: 10,
    };

    // Enhance stats with trends, alerts, wins, and actions
    const stats = enhanceDigestStats(baseStats, previousStats, historicalAvg);

    // Generate AL Intelligence Report
    let alIntelligence = null;
    try {
      alIntelligence = await generateALIntelligence(
        yesterday.toISOString(),
        todayStart.toISOString()
      );
      
      // Post AL Intelligence to Discord (separate from digest)
      await postALIntelligence(alIntelligence);
    } catch (alError) {
      console.error('[DailyDigest] AL Intelligence generation failed:', alError);
      // Continue even if AL Intelligence fails
    }

    // Post main digest to Discord
    await postDailyDigest(stats);

    return NextResponse.json({
      success: true,
      stats,
      alIntelligence,
      period: {
        start: yesterday.toISOString(),
        end: todayStart.toISOString(),
      },
    });

  } catch (error) {
    console.error('[Cron/DailyDigest] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate digest', details: error.message },
      { status: 500 }
    );
  }
}







