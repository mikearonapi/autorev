/**
 * Email Unsubscribe API
 * 
 * Handles secure token-based email unsubscribe requests:
 * - GET: Validate token and redirect to page with status
 * - POST: Process unsubscribe/resubscribe action
 * 
 * Security: Uses HMAC SHA256 signed tokens - no email exposed in URL
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { withErrorLogging } from '@/lib/serverErrorLogger';
import { verifyUnsubscribeToken, generateUnsubscribeToken } from '@/lib/unsubscribeToken';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

/**
 * POST /api/email/unsubscribe
 * 
 * Body:
 * - token: Secure unsubscribe token
 * - type: 'all' | 'features' | 'events'
 * - action: 'unsubscribe' | 'resubscribe' (default: 'unsubscribe')
 */
async function handlePost(request) {
  const { token, type = 'all', action = 'unsubscribe' } = await request.json();
  
  // Validate token
  const tokenResult = verifyUnsubscribeToken(token);
  
  if (!tokenResult.valid) {
    const errorMessages = {
      invalid_token: 'This link is invalid. Please use the link from your most recent email.',
      expired_token: 'This link has expired. Please use the link from your most recent email.',
      server_error: 'Something went wrong. Please try again later.',
    };
    
    return NextResponse.json({ 
      error: errorMessages[tokenResult.error] || 'Invalid request',
      code: tokenResult.error
    }, { status: 400 });
  }

  const email = tokenResult.email;

  // Find user by email
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const user = users?.users?.find(u => u.email === email);
  
  if (!user) {
    // Don't reveal if email exists - return success anyway for privacy
    return NextResponse.json({ 
      success: true, 
      message: action === 'resubscribe' 
        ? 'If this email exists, it has been resubscribed'
        : 'If this email exists, it has been unsubscribed',
      email: maskEmail(email)
    });
  }

  // Check current status
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('email_unsubscribed_at, email_opt_in_features, email_opt_in_events')
    .eq('id', user.id)
    .single();

  if (action === 'resubscribe') {
    // Re-subscribe the user
    const { error } = await supabaseAdmin
      .from('user_profiles')
      .update({
        email_unsubscribed_at: null,
        email_opt_in_features: true,
        email_opt_in_events: true,
      })
      .eq('id', user.id);

    if (error) {
      console.error('[Unsubscribe] Error resubscribing:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    // Log the resubscribe event
    await supabaseAdmin
      .from('email_logs')
      .insert({
        user_id: user.id,
        recipient_email: email,
        subject: 'RESUBSCRIBE',
        status: 'resubscribed',
        metadata: { type: 'all' },
      });

    console.log(`[Unsubscribe] User ${maskEmail(email)} resubscribed`);

    return NextResponse.json({ 
      success: true, 
      message: 'You have been resubscribed to AutoRev emails',
      email: maskEmail(email),
      action: 'resubscribed'
    });
  }

  // Check if already unsubscribed
  if (type === 'all' && profile?.email_unsubscribed_at) {
    return NextResponse.json({ 
      success: true, 
      message: 'You are already unsubscribed from all emails',
      email: maskEmail(email),
      alreadyUnsubscribed: true
    });
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

  console.log(`[Unsubscribe] User ${maskEmail(email)} unsubscribed from ${type}`);

  const typeLabels = {
    all: 'all emails',
    features: 'feature updates & tips',
    events: 'event notifications'
  };

  return NextResponse.json({ 
    success: true, 
    message: `Successfully unsubscribed from ${typeLabels[type]}`,
    email: maskEmail(email),
    action: 'unsubscribed'
  });
}

/**
 * GET /api/email/unsubscribe
 * 
 * Validates token and redirects to unsubscribe page with status
 * Query params:
 * - token: Secure unsubscribe token
 * - email: (LEGACY - deprecated, will redirect with error)
 */
async function handleGet(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const legacyEmail = searchParams.get('email');
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://autorev.app';
  const redirectUrl = new URL('/unsubscribe', baseUrl);
  
  // Handle legacy email-based links (deprecated)
  if (legacyEmail && !token) {
    // Generate a new token for backwards compatibility
    try {
      const newToken = generateUnsubscribeToken(legacyEmail);
      redirectUrl.searchParams.set('token', newToken);
    } catch {
      redirectUrl.searchParams.set('error', 'invalid');
    }
    return NextResponse.redirect(redirectUrl);
  }
  
  if (token) {
    redirectUrl.searchParams.set('token', token);
  } else {
    redirectUrl.searchParams.set('error', 'missing_token');
  }
  
  return NextResponse.redirect(redirectUrl);
}

/**
 * Mask email for privacy (e.g., "j***@example.com")
 */
function maskEmail(email) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  
  const maskedLocal = local.length > 2 
    ? local[0] + '***' + local[local.length - 1]
    : local[0] + '***';
  
  return `${maskedLocal}@${domain}`;
}

export const POST = withErrorLogging(handlePost, { route: 'email/unsubscribe', feature: 'email' });
export const GET = withErrorLogging(handleGet, { route: 'email/unsubscribe', feature: 'email' });
