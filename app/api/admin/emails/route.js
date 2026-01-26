/**
 * Admin Email Management API
 * 
 * Endpoints:
 * - GET: Get email logs, analytics, and queue status
 * - POST: Send test emails, trigger campaigns
 * 
 * Auth: Admin only (Bearer token)
 */

import { NextResponse } from 'next/server';
import { getEmailAnalytics, sendTemplateEmail, processEmailQueue } from '@/lib/emailService';
import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '@/lib/adminAccess';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Admin client for querying
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey,
  { auth: { persistSession: false } }
);

/**
 * GET /api/admin/emails
 * 
 * Query params:
 * - view: 'analytics' | 'logs' | 'queue' | 'templates'
 * - days: number of days for analytics (default 30)
 * - limit: max logs to return (default 50)
 * - status: filter logs by status
 */
async function handleGet(request) {
  try {
    // Verify admin access
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'analytics';
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');

    switch (view) {
      case 'analytics': {
        const analytics = await getEmailAnalytics(days);
        return NextResponse.json({ analytics });
      }

      case 'logs': {
        let query = supabaseAdmin
          .from('email_logs')
          .select(`
            id,
            recipient_email,
            template_slug,
            subject,
            status,
            error_message,
            created_at,
            sent_at,
            delivered_at,
            opened_at,
            clicked_at,
            metadata
          `)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (status) {
          query = query.eq('status', status);
        }

        const { data: logs, error } = await query;
        
        if (error) {
          console.error('[Admin/Emails] Logs query error:', error);
          return NextResponse.json({ error: 'Failed to fetch email logs' }, { status: 500 });
        }

        return NextResponse.json({ logs });
      }

      case 'queue': {
        const QUEUE_COLS = 'id, user_id, email_type, to_email, subject, status, priority, scheduled_for, attempts, last_error, sent_at, created_at';
        
        const { data: queue, error } = await supabaseAdmin
          .from('email_queue')
          .select(QUEUE_COLS)
          .order('scheduled_for', { ascending: true })
          .limit(limit);

        if (error) {
          console.error('[Admin/Emails] Queue query error:', error);
          return NextResponse.json({ error: 'Failed to fetch email queue' }, { status: 500 });
        }

        // Get queue stats
        const { data: stats } = await supabaseAdmin
          .from('email_queue')
          .select('status')
          .then(({ data }) => ({
            data: {
              pending: data?.filter(e => e.status === 'pending').length || 0,
              processing: data?.filter(e => e.status === 'processing').length || 0,
              sent: data?.filter(e => e.status === 'sent').length || 0,
              failed: data?.filter(e => e.status === 'failed').length || 0,
            }
          }));

        return NextResponse.json({ queue, stats });
      }

      case 'templates': {
        const TEMPLATE_COLS = 'id, name, category, subject, html_template, text_template, variables, is_active, created_at, updated_at';
        
        const { data: templates, error } = await supabaseAdmin
          .from('email_templates')
          .select(TEMPLATE_COLS)
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (error) {
          console.error('[Admin/Emails] Templates query error:', error);
          return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 });
        }

        return NextResponse.json({ templates });
      }

      case 'automations': {
        // Automations are defined in the frontend component
        // This endpoint just confirms the API is accessible
        // In the future, this could fetch automation configs from the database
        const automations = [
          {
            id: 'welcome',
            name: 'Welcome Email',
            trigger: 'user_signup',
            timing: 'instant',
            template: 'welcome',
            status: 'active',
            description: 'Sent immediately when a new user creates an account'
          },
          {
            id: 'inactivity-7d',
            name: 'Inactivity Reminder (7 Day)',
            trigger: 'inactivity',
            timing: '7_days',
            template: 'inactivity-7d',
            status: 'active',
            description: 'Sent when a user hasn\'t logged in for 7 days'
          },
          {
            id: 'referral-reward',
            name: 'Referral Reward',
            trigger: 'referral_completed',
            timing: 'instant',
            template: 'referral-reward',
            status: 'active',
            description: 'Sent when a referred friend completes signup'
          }
        ];
        
        return NextResponse.json({ automations });
      }

      default:
        return NextResponse.json({ error: 'Invalid view parameter' }, { status: 400 });
    }

  } catch (err) {
    console.error('[Admin/Emails] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/emails
 * 
 * Body:
 * - action: 'send_test' | 'process_queue' | 'send_campaign'
 * - ... action-specific params
 */
async function handlePost(request) {
  try {
    // Verify admin access
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'send_test': {
        // Send a test email to admin
        const { templateSlug, to } = body;
        
        if (!templateSlug || !to) {
          return NextResponse.json({ error: 'templateSlug and to are required' }, { status: 400 });
        }

        const result = await sendTemplateEmail({
          to,
          templateSlug,
          variables: {
            user_name: 'Test User',
            login_url: process.env.NEXT_PUBLIC_SITE_URL,
          },
          metadata: { test: true },
        });

        return NextResponse.json(result);
      }

      case 'process_queue': {
        // Manually trigger queue processing
        const result = await processEmailQueue(body.limit || 50);
        return NextResponse.json(result);
      }

      case 'send_campaign': {
        // TODO: Implement campaign sending
        return NextResponse.json({ error: 'Campaign sending not yet implemented' }, { status: 501 });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (err) {
    console.error('[Admin/Emails] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'admin/emails', feature: 'admin' });
export const POST = withErrorLogging(handlePost, { route: 'admin/emails', feature: 'admin' });
