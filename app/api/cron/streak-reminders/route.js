/**
 * Streak Reminders Cron Job
 * 
 * Runs daily to send notifications to users whose streaks are at risk.
 * Scheduled to run around 6 PM to give users time to maintain their streak.
 * 
 * Endpoint: POST /api/cron/streak-reminders
 * Authorization: Bearer CRON_SECRET
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { getStreakReminderCopy, STREAK_MILESTONES } from '@/lib/engagementService';
import { createNotification, NOTIFICATION_CATEGORIES } from '@/lib/notificationService';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Minimum streak length to send reminders (don't spam new users)
const MIN_STREAK_FOR_REMINDER = 3;

async function handlePost(request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service role client for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get users with at-risk streaks
    const { data: atRiskUsers, error: fetchError } = await supabase.rpc(
      'get_users_with_at_risk_streaks',
      { p_min_streak: MIN_STREAK_FOR_REMINDER }
    );

    if (fetchError) {
      console.error('[Streak Reminders] Error fetching at-risk users:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    if (!atRiskUsers || atRiskUsers.length === 0) {
      console.log('[Streak Reminders] No users with at-risk streaks');
      return NextResponse.json({
        success: true,
        message: 'No reminders to send',
        count: 0,
      });
    }

    console.log(`[Streak Reminders] Found ${atRiskUsers.length} users with at-risk streaks`);

    // Send notifications
    let sentCount = 0;
    let failedCount = 0;

    for (const user of atRiskUsers) {
      try {
        const reminderCopy = getStreakReminderCopy(
          user.current_streak,
          Math.floor(user.hours_remaining)
        );

        // Check if user is approaching a milestone (extra motivation)
        const nextMilestone = STREAK_MILESTONES.find(m => m > user.current_streak);
        let body = reminderCopy.body;
        if (nextMilestone && user.current_streak >= nextMilestone - 3) {
          body = `You're only ${nextMilestone - user.current_streak} day${nextMilestone - user.current_streak !== 1 ? 's' : ''} away from the ${nextMilestone}-day milestone! ${body}`;
        }

        const { data, error } = await createNotification({
          userId: user.user_id,
          category: NOTIFICATION_CATEGORIES.ENGAGEMENT,
          title: reminderCopy.title,
          body,
          actionUrl: '/dashboard',
          metadata: {
            type: 'streak_reminder',
            currentStreak: user.current_streak,
            hoursRemaining: user.hours_remaining,
            urgency: reminderCopy.urgency,
          },
          isUrgent: reminderCopy.urgency === 'critical',
        });

        if (!error) {
          sentCount++;
        } else {
          console.warn(`[Streak Reminders] Failed to notify user ${user.user_id}:`, error);
          failedCount++;
        }
      } catch (err) {
        console.error(`[Streak Reminders] Error processing user ${user.user_id}:`, err);
        failedCount++;
      }
    }

    console.log(`[Streak Reminders] Sent ${sentCount} reminders, ${failedCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Sent ${sentCount} streak reminders`,
      count: sentCount,
      failed: failedCount,
      total: atRiskUsers.length,
    });
  } catch (err) {
    console.error('[Streak Reminders] Cron job error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support GET for testing
async function handleGet(request) {
  // For testing - show status without sending
  return NextResponse.json({
    message: 'Streak reminders cron job endpoint',
    method: 'Use POST with Authorization: Bearer CRON_SECRET to trigger',
  });
}

export const POST = withErrorLogging(handlePost, { route: 'cron/streak-reminders', feature: 'cron-jobs' });
export const GET = withErrorLogging(handleGet, { route: 'cron/streak-reminders', feature: 'cron-jobs' });
