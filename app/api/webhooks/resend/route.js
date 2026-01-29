/**
 * Resend Webhook Handler
 *
 * Receives events from Resend for email tracking:
 * - email.delivered
 * - email.opened
 * - email.clicked
 * - email.bounced
 * - email.complained
 *
 * Set this URL in your Resend dashboard: /api/webhooks/resend
 */

import crypto from 'crypto';

import { NextResponse } from 'next/server';

import { handleResendWebhook } from '@/lib/emailService';
import { logServerError, withErrorLogging } from '@/lib/serverErrorLogger';

// Resend webhook signing secret (set in Resend dashboard)
const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

/**
 * Verify webhook signature from Resend
 */
function verifySignature(payload, signature, secret) {
  if (!secret) {
    // SECURITY: Fail closed - require secret in production
    console.error('[Resend Webhook] RESEND_WEBHOOK_SECRET not configured');
    return false;
  }

  if (!signature) {
    console.error('[Resend Webhook] Missing svix-signature header');
    return false;
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch (err) {
    console.error('[Resend Webhook] Signature comparison failed:', err.message);
    return false;
  }
}

async function handlePost(request) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('svix-signature');

    // SECURITY: Always verify signature
    if (!verifySignature(rawBody, signature, WEBHOOK_SECRET)) {
      console.error('[Resend Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the event
    const event = JSON.parse(rawBody);

    console.log(`[Resend Webhook] Received event: ${event.type}`);

    // Handle the event
    await handleResendWebhook(event);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[Resend Webhook] Error:', err);
    await logServerError(err, request, {
      route: 'webhooks/resend',
      feature: 'email',
      errorSource: 'webhook',
      errorType: 'webhook_processing_failed',
    });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Resend may send GET requests to verify the endpoint
async function handleGet() {
  return NextResponse.json({ status: 'Resend webhook endpoint active' });
}

export const GET = withErrorLogging(handleGet, { route: 'webhooks/resend', feature: 'webhooks' });
export const POST = withErrorLogging(handlePost, { route: 'webhooks/resend', feature: 'webhooks' });