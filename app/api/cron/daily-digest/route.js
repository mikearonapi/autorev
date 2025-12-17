import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { postDailyDigest } from '@/lib/discord';

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
      alResult,
      eventSubmissionsResult,
      unresolvedBugsResult,
      feedbackCategoriesResult,
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
      
      // AL conversations
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
        .eq('resolved', false),
      
      // Top feedback categories (yesterday)
      supabase
        .from('user_feedback')
        .select('category')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', todayStart.toISOString()),
    ]);

    // Calculate top categories
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

    const stats = {
      signups: signupsResult.count || 0,
      feedback: feedbackResult.count || 0,
      contacts: contactsResult.count || 0,
      alConversations: alResult.count || 0,
      eventSubmissions: eventSubmissionsResult.count || 0,
      unresolvedBugs: unresolvedBugsResult.count || 0,
      topFeedbackCategories: topCategories,
      errors: 0, // Could track from a separate errors table if you add one
    };

    // Post to Discord
    await postDailyDigest(stats);

    return NextResponse.json({
      success: true,
      stats,
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

