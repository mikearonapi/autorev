/**
 * Inactivity Email Scheduling Cron Job
 * 
 * Checks for inactive users and queues reminder emails.
 * Should run daily at 6am UTC.
 * 
 * @route GET /api/cron/schedule-inactivity-emails
 */

import { NextResponse } from 'next/server';
import { queueEmail } from '@/lib/email';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const CRON_SECRET = process.env.CRON_SECRET;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app';

// Inactivity thresholds
const INACTIVITY_7D = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const INACTIVITY_21D = 21 * 24 * 60 * 60 * 1000; // 21 days in ms (3 weeks)

export async function GET(request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    
    if (!isVercelCron && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron/Inactivity] Starting inactivity email scheduling...');
    
    // Get current car and event counts for email templates
    const [{ count: carCount }, { count: eventCount }] = await Promise.all([
      supabaseAdmin.from('cars').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('events').select('*', { count: 'exact', head: true })
    ]);
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - INACTIVITY_7D);
    const twentyOneDaysAgo = new Date(now.getTime() - INACTIVITY_21D);

    let queued7d = 0;
    let queued21d = 0;
    let skipped = 0;

    // Get users who:
    // 1. Haven't logged in recently (check auth metadata)
    // 2. Have opted in to feature emails
    // 3. Haven't received this email recently
    // 4. Haven't unsubscribed
    const { data: users, error } = await supabaseAdmin
      .from('user_profiles')
      .select(`
        id,
        display_name,
        email_opt_in_features,
        email_unsubscribed_at,
        last_email_sent_at,
        updated_at
      `)
      .eq('email_opt_in_features', true)
      .is('email_unsubscribed_at', null)
      .lt('updated_at', sevenDaysAgo.toISOString());

    if (error) {
      console.error('[Cron/Inactivity] Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    for (const user of users || []) {
      // Get user's email from auth
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id);
      
      if (!authUser?.user?.email) {
        skipped++;
        continue;
      }

      const lastActivity = new Date(user.updated_at);
      const lastEmail = user.last_email_sent_at ? new Date(user.last_email_sent_at) : null;
      
      // Don't send if we emailed them in the last 7 days
      if (lastEmail && (now.getTime() - lastEmail.getTime()) < INACTIVITY_7D) {
        skipped++;
        continue;
      }

      // Check if already queued
      const { data: existingQueue } = await supabaseAdmin
        .from('email_queue')
        .select('id')
        .eq('user_id', user.id)
        .in('template_slug', ['inactivity-7d', 'inactivity-21d'])
        .eq('status', 'pending')
        .limit(1);

      if (existingQueue?.length > 0) {
        skipped++;
        continue;
      }

      // Determine which email to send
      const inactivityTime = now.getTime() - lastActivity.getTime();
      let templateSlug = null;

      if (inactivityTime >= INACTIVITY_21D) {
        templateSlug = 'inactivity-21d';
      } else if (inactivityTime >= INACTIVITY_7D) {
        templateSlug = 'inactivity-7d';
      }

      if (!templateSlug) {
        skipped++;
        continue;
      }

      // Queue the email
      const result = await queueEmail({
        userId: user.id,
        email: authUser.user.email,
        templateSlug,
        variables: {
          user_name: user.display_name || authUser.user.user_metadata?.full_name?.split(' ')[0],
          login_url: SITE_URL,
          email: authUser.user.email,
          car_count: carCount || 98,
          event_count: eventCount || 940,
        },
        scheduledFor: new Date(now.getTime() + 60000).toISOString(), // 1 minute from now
        priority: templateSlug === 'inactivity-21d' ? 1 : 0,
        metadata: { trigger: 'inactivity_check' },
      });

      if (result.success) {
        if (templateSlug === 'inactivity-7d') queued7d++;
        else queued21d++;
      } else {
        console.error(`[Cron/Inactivity] Failed to queue for ${user.id}:`, result.error);
        skipped++;
      }
    }

    console.log(`[Cron/Inactivity] Completed: ${queued7d} 7-day, ${queued21d} 21-day, ${skipped} skipped`);

    return NextResponse.json({
      success: true,
      queued: {
        '7d': queued7d,
        '21d': queued21d,
      },
      skipped,
      timestamp: now.toISOString(),
    });

  } catch (err) {
    console.error('[Cron/Inactivity] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export { GET as POST };

