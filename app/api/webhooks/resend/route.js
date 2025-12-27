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

import { NextResponse } from 'next/server';
import { handleResendWebhook } from '@/lib/email';
import crypto from 'crypto';

// Resend webhook signing secret (set in Resend dashboard)
const WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET;

/**
 * Verify webhook signature from Resend
 */
function verifySignature(payload, signature, secret) {
  if (!secret) {
    console.warn('[Resend Webhook] No webhook secret configured, skipping verification');
    return true;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature || ''),
    Buffer.from(expectedSignature)
  );
}

export async function POST(request) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('svix-signature');

    // Verify signature (if secret is configured)
    if (WEBHOOK_SECRET && !verifySignature(rawBody, signature, WEBHOOK_SECRET)) {
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
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Resend may send GET requests to verify the endpoint
export async function GET() {
  return NextResponse.json({ status: 'Resend webhook endpoint active' });
}

