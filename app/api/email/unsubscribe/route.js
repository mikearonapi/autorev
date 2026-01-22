/**
 * Email Unsubscribe API
 * 
 * Handles email unsubscribe requests:
 * - GET: Show unsubscribe confirmation (redirect to page)
 * - POST: Process unsubscribe action
 */

import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { createClient } from '@supabase/supabase-js';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/**
 * POST /api/email/unsubscribe
 * 
 * Body:
 * - email: User's email address
 * - type: 'all' | 'features' | 'events'
 */
async function handlePost(request) {
  const { email, type = 'all' } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === email);
    
    if (!user) {
      // Don't reveal if email exists or not for privacy
      return NextResponse.json({ success: true, message: 'If this email exists, it has been unsubscribed' });
    }

    // Update preferences based on type
    const updates = {};
    
    switch (type) {
      case 'all':
        updates.email_unsubscribed_at = new Date().toISOString();
        updates.email_opt_in_features = false;
        updates.email_opt_in_events = false;
        break;
      case 'features':
        updates.email_opt_in_features = false;
        break;
      case 'events':
        updates.email_opt_in_events = false;
        break;
      default:
        return NextResponse.json({ error: 'Invalid unsubscribe type' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error('[Unsubscribe] Error updating preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    // Log the unsubscribe event
    await supabaseAdmin
      .from('email_logs')
      .insert({
        user_id: user.id,
        recipient_email: email,
        subject: 'UNSUBSCRIBE',
        status: 'unsubscribed',
        metadata: { type },
      });

    console.log(`[Unsubscribe] User ${email} unsubscribed from ${type}`);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully unsubscribed from ${type === 'all' ? 'all emails' : type + ' emails'}` 
    });
}

/**
 * GET /api/email/unsubscribe
 * 
 * Redirects to unsubscribe page with email parameter
 */
async function handleGet(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  
  // Redirect to an unsubscribe confirmation page
  const redirectUrl = new URL('/unsubscribe', process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app');
  if (email) redirectUrl.searchParams.set('email', email);
  
  return NextResponse.redirect(redirectUrl);
}

export const POST = withErrorLogging(handlePost, { route: 'email/unsubscribe', feature: 'email' });
export const GET = withErrorLogging(handleGet, { route: 'email/unsubscribe', feature: 'email' });
