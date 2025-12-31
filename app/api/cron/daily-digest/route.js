import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { postDailyDigest, postALIntelligence } from '@/lib/discord';
import { generateALIntelligence } from '@/lib/alIntelligence';
import { logCronError } from '@/lib/serverErrorLogger';

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
      signInsResult,
      feedbackResult,
      contactsResult,
      alConversationsResult,
      eventSubmissionsResult,
      unresolvedBugsResult,
      feedbackCategoriesResult,
      // AL usage analytics
      alMessagesResult,
      alUsageStatsResult,
      // User activity from user_activity table
      userActivityResult,
      // Favorites added
      favoritesResult,
      // Vehicles added
      vehiclesResult,
      // Auto-errors
      autoErrorsResult,
      // Total users (for context)
      totalUsersResult,
    ] = await Promise.all([
      // New signups (from auth.users)
      supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),
      
      // Users who signed in yesterday (from auth.users last_sign_in_at)
      supabase.rpc('get_users_signed_in_range', {
        start_date: yesterday.toISOString(),
        end_date: todayStart.toISOString(),
      }).then(result => {
        if (result.error) {
          console.warn('[DailyDigest] Sign-ins query error:', result.error.message);
          return { count: 0, data: [] };
        }
        return result;
      }).catch(() => ({ count: 0, data: [] })),
      
      // Feedback submitted (excluding auto-errors)
      supabase
        .from('user_feedback')
        .select('id', { count: 'exact', head: true })
        .neq('category', 'auto-error')
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
      
      // Top feedback categories (yesterday, excluding auto-errors)
      supabase
        .from('user_feedback')
        .select('category')
        .neq('category', 'auto-error')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),

      // AL messages sent (questions asked)
      supabase
        .from('al_messages')
        .select('id, role')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),

      // AL usage statistics (tokens, credits, tools)
      supabase
        .from('al_usage_logs')
        .select('credits_used, input_tokens, output_tokens, tool_calls')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),

      // User activity events (from new tracking)
      supabase
        .from('user_activity')
        .select('event_type, event_data')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),

      // Favorites added yesterday
      supabase
        .from('user_favorites')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),

      // Vehicles added to garages yesterday
      supabase
        .from('user_vehicles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),

      // Auto-errors (from yesterday) - only count actionable errors (not wont_fix)
      supabase
        .from('application_errors')
        .select('id, message, severity')
        .neq('status', 'wont_fix')
        .neq('status', 'resolved')
        .neq('status', 'fixed')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),

      // Total registered users (for context)
      supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true }),
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

    // Calculate activity stats from user_activity table
    const activityByType = {};
    userActivityResult.data?.forEach(a => {
      if (a.event_type) {
        activityByType[a.event_type] = (activityByType[a.event_type] || 0) + 1;
      }
    });

    // Extract unique cars viewed from activity
    const carsViewed = userActivityResult.data
      ?.filter(a => a.event_type === 'car_viewed')
      .map(a => a.event_data?.car_slug)
      .filter(Boolean);
    const uniqueCarsViewed = [...new Set(carsViewed)].length;

    // Active users = users who signed in yesterday
    const activeUsers = signInsResult.data?.length || signInsResult.count || 0;

    // Count actionable errors (deduplicated by message)
    const autoErrorsList = autoErrorsResult.data || [];
    const uniqueErrorMessages = new Set();
    autoErrorsList.forEach(err => {
      const msg = err.message || 'Unknown error';
      uniqueErrorMessages.add(msg);
    });
    const uniqueAutoErrors = uniqueErrorMessages.size;

    // Base stats
    const baseStats = {
      // User metrics
      signups: signupsResult.count || 0,
      activeUsers: activeUsers,
      totalUsers: totalUsersResult.count || 0,
      
      // Engagement metrics
      feedback: feedbackResult.count || 0,
      contacts: contactsResult.count || 0,
      eventSubmissions: eventSubmissionsResult.count || 0,
      favoritesAdded: favoritesResult.count || 0,
      vehiclesAdded: vehiclesResult.count || 0,
      
      // Page view metrics (from user_activity)
      carPageViews: activityByType['car_viewed'] || 0,
      uniqueCarsViewed: uniqueCarsViewed,
      searchesPerformed: activityByType['search_performed'] || 0,
      
      // AL metrics
      alConversations: alConversationsResult.count || 0,
      alQuestions: userQuestions,
      alResponses: assistantResponses,
      alCreditsUsed: totalCreditsUsed,
      alTokensUsed: totalInputTokens + totalOutputTokens,
      alToolCalls: totalToolCalls,
      
      // Activity breakdown (raw)
      activity: activityByType,
      
      // Issues - unique errors only (deduplicated by error message)
      autoErrors: uniqueAutoErrors,
      unresolvedBugs: unresolvedBugsResult.count || 0,
      topFeedbackCategories: topCategories,
    };

    // Get 7-day stats for weekly summary
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      weekSignupsResult,
      weekALResult,
      weekErrorsResult,
      weekActivityResult,
    ] = await Promise.all([
      // Signups in last 7 days
      supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString())
        .lt('created_at', todayStart.toISOString()),
      
      // AL conversations in last 7 days
      supabase
        .from('al_conversations')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString())
        .lt('created_at', todayStart.toISOString()),
      
      // Unique actionable errors in last 7 days (excludes noise)
      supabase
        .from('application_errors')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'wont_fix')
        .neq('status', 'resolved')
        .neq('status', 'fixed')
        .gte('created_at', weekAgo.toISOString())
        .lt('created_at', todayStart.toISOString()),
      
      // Active users (unique) in last 7 days
      supabase
        .from('user_activity')
        .select('user_id')
        .gte('created_at', weekAgo.toISOString())
        .lt('created_at', todayStart.toISOString()),
    ]);

    // Calculate unique active users for the week
    const weekActiveUsers = new Set(
      (weekActivityResult.data || [])
        .map(a => a.user_id)
        .filter(Boolean)
    ).size;

    const weekStats = {
      signups: weekSignupsResult.count || 0,
      alConversations: weekALResult.count || 0,
      errors: weekErrorsResult.count || 0,
      avgActiveUsers: Math.round(weekActiveUsers / 7), // Rough daily average
    };

    // Add week stats to base stats
    const stats = {
      ...baseStats,
      weekStats,
    };

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
    await logCronError('daily-digest', error, { phase: 'digest-generation' });
    return NextResponse.json(
      { error: 'Failed to generate digest', details: error.message },
      { status: 500 }
    );
  }
}







