/**
 * Retention Alerts Cron Job
 * 
 * Runs daily to send re-engagement emails:
 * 1. Score dropped 50%+ from peak → Re-engagement email
 * 2. Inactive 7 days → "We miss you" email
 * 3. Inactive 14 days → Personal outreach flag (Tuner+ tier)
 * 
 * Schedule: Daily at 10 AM UTC (via Vercel cron)
 * 
 * @route GET /api/cron/retention-alerts
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Verify cron secret to prevent unauthorized access
 */
function verifyCronAuth(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.warn('[RetentionCron] CRON_SECRET not configured');
    return false;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

/**
 * Generate re-engagement email content based on alert type
 */
function getEmailContent(alertType, user) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autorev.app';
  const displayName = user.display_name || 'there';

  switch (alertType) {
    case 'score_dropped':
      return {
        subject: `Hey ${displayName}, your cars miss you! 🚗`,
        html: `
          <h2>Hey ${displayName}!</h2>
          <p>We noticed you haven't been around lately, and your garage is getting dusty.</p>
          <p>Here's what's new on AutoRev:</p>
          <ul>
            <li>New cars added to our database</li>
            <li>Updated parts and upgrade recommendations</li>
            <li>Upcoming events in your area</li>
          </ul>
          <p><a href="${baseUrl}/garage" style="background: #e94560; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Visit Your Garage</a></p>
          <p>See you on the road!<br>— The AutoRev Team</p>
        `,
      };

    case 'inactive_7d':
      return {
        subject: `We miss you, ${displayName}! 👋`,
        html: `
          <h2>Hey ${displayName}!</h2>
          <p>It's been a week since you visited AutoRev. We've been working on some cool stuff:</p>
          <ul>
            <li><strong>AL</strong> has learned new tricks and can help with more questions</li>
            <li>New community events posted near you</li>
            <li>Fresh builds and modifications to explore</li>
          </ul>
          <p><a href="${baseUrl}" style="background: #e94560; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Come Back & Explore</a></p>
          <p>Happy driving!<br>— The AutoRev Team</p>
        `,
      };

    case 'inactive_14d':
      return {
        subject: `${displayName}, let's reconnect! 🤝`,
        html: `
          <h2>Hey ${displayName}!</h2>
          <p>It's been two weeks and we genuinely miss having you around.</p>
          <p>Is there something we could do better? We'd love to hear from you.</p>
          <p>In the meantime, here's what you're missing:</p>
          <ul>
            <li>New cars and detailed spec comparisons</li>
            <li>Community builds with real-world results</li>
            <li>Upcoming track days and Cars & Coffee events</li>
          </ul>
          <p><a href="${baseUrl}/garage" style="background: #e94560; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Return to Your Garage</a></p>
          <p>We're here when you're ready!<br>— The AutoRev Team</p>
        `,
      };

    default:
      return null;
  }
}

/**
 * Mark alert as processed so we don't send duplicate emails
 */
async function markAlertProcessed(userId, alertType) {
  const updateField = {
    score_dropped: 'alert_score_dropped',
    inactive_7d: 'alert_inactive_7d',
    inactive_14d: 'alert_inactive_14d',
  }[alertType];

  if (!updateField) return;

  // Clear the alert flag after sending email
  await supabase
    .from('user_engagement_scores')
    .update({ [updateField]: false })
    .eq('user_id', userId);
}

export async function GET(request) {
  // Verify authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results = {
    scoreDroppedEmails: 0,
    inactive7dEmails: 0,
    inactive14dEmails: 0,
    errors: [],
  };

  try {
    console.log('[RetentionCron] Starting retention alert processing...');

    // Process each alert type
    const alertTypes = ['score_dropped', 'inactive_7d', 'inactive_14d'];

    for (const alertType of alertTypes) {
      console.log(`[RetentionCron] Processing ${alertType} alerts...`);

      // Get users needing this type of re-engagement
      const { data: users, error } = await supabase.rpc('get_users_needing_reengagement', {
        p_alert_type: alertType,
        p_limit: 50, // Limit per run to avoid rate limits
      });

      if (error) {
        console.error(`[RetentionCron] Error fetching ${alertType} users:`, error);
        results.errors.push({ alertType, error: error.message });
        continue;
      }

      if (!users || users.length === 0) {
        console.log(`[RetentionCron] No users need ${alertType} emails`);
        continue;
      }

      console.log(`[RetentionCron] Found ${users.length} users for ${alertType}`);

      // Send emails to each user
      for (const user of users) {
        try {
          const emailContent = getEmailContent(alertType, user);
          
          if (!emailContent) {
            console.warn(`[RetentionCron] No email content for ${alertType}`);
            continue;
          }

          // Send the email
          await sendEmail({
            to: user.email,
            subject: emailContent.subject,
            html: emailContent.html,
          });

          // Mark as processed
          await markAlertProcessed(user.user_id, alertType);

          // Track results
          if (alertType === 'score_dropped') results.scoreDroppedEmails++;
          if (alertType === 'inactive_7d') results.inactive7dEmails++;
          if (alertType === 'inactive_14d') results.inactive14dEmails++;

          console.log(`[RetentionCron] Sent ${alertType} email to ${user.email}`);

          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (emailError) {
          console.error(`[RetentionCron] Email error for ${user.email}:`, emailError);
          results.errors.push({ 
            alertType, 
            userId: user.user_id, 
            error: emailError.message 
          });
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[RetentionCron] Completed in ${duration}ms`, results);

    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      results,
    });

  } catch (error) {
    console.error('[RetentionCron] Fatal error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      results,
    }, { status: 500 });
  }
}

