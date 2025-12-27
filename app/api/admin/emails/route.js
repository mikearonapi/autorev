/**
 * Admin Email Management API
 * 
 * Endpoints:
 * - GET: Get email logs, analytics, and queue status
 * - POST: Send test emails, trigger campaigns
 * 
 * Auth: Admin only
 */

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getEmailAnalytics, sendTemplateEmail, processEmailQueue } from '@/lib/email';
import { createClient } from '@supabase/supabase-js';

// Admin client for querying
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/**
 * Check if user is admin
 */
async function isAdmin(request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) return false;
  
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();
  
  return profile?.subscription_tier === 'admin';
}

/**
 * GET /api/admin/emails
 * 
 * Query params:
 * - view: 'analytics' | 'logs' | 'queue' | 'templates'
 * - days: number of days for analytics (default 30)
 * - limit: max logs to return (default 50)
 * - status: filter logs by status
 */
export async function GET(request) {
  try {
    // Check admin auth
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

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
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ logs });
      }

      case 'queue': {
        const { data: queue, error } = await supabaseAdmin
          .from('email_queue')
          .select('*')
          .order('scheduled_for', { ascending: true })
          .limit(limit);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
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
        const { data: templates, error } = await supabaseAdmin
          .from('email_templates')
          .select('*')
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ templates });
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
export async function POST(request) {
  try {
    // Check admin auth
    if (!await isAdmin(request)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

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

