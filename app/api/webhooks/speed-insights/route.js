/**
 * Speed Insights Webhook Receiver
 *
 * Receives Core Web Vitals data from Vercel Speed Insights Drain.
 * Stores metrics in Supabase for display in command center.
 *
 * @route POST /api/webhooks/speed-insights
 *
 * Setup in Vercel Dashboard:
 * 1. Go to Project Settings > Drains
 * 2. Create new drain with type "Speed Insights"
 * 3. Set URL to: https://autorev.app/api/webhooks/speed-insights
 * 4. Copy the secret and add as VERCEL_SPEED_INSIGHTS_SECRET env var
 *
 * Vercel Speed Insights Drain docs:
 * https://vercel.com/docs/drains/reference/speed-insights
 */

import crypto from 'crypto';

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRAIN_SECRET = process.env.VERCEL_SPEED_INSIGHTS_SECRET;

/**
 * Verify the webhook signature from Vercel
 */
function verifySignature(payload, signature) {
  if (!DRAIN_SECRET) return false;

  const expectedSignature = crypto.createHmac('sha256', DRAIN_SECRET).update(payload).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Determine metric rating based on Core Web Vitals thresholds
 * https://web.dev/vitals/
 */
function getMetricRating(name, value) {
  const thresholds = {
    LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint (ms)
    FID: { good: 100, poor: 300 }, // First Input Delay (ms)
    INP: { good: 200, poor: 500 }, // Interaction to Next Paint (ms)
    CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift (score)
    TTFB: { good: 800, poor: 1800 }, // Time to First Byte (ms)
    FCP: { good: 1800, poor: 3000 }, // First Contentful Paint (ms)
  };

  const threshold = thresholds[name];
  if (!threshold) return null;

  if (value <= threshold.good) return 'good';
  if (value >= threshold.poor) return 'poor';
  return 'needs-improvement';
}

/**
 * Process Speed Insights event payload
 * Vercel sends batches of events
 */
function processEvent(event) {
  // Handle the Vercel Speed Insights drain format
  // https://vercel.com/docs/drains/reference/speed-insights
  return {
    metric_name: event.name || event.metric,
    metric_value: event.value,
    metric_rating: event.rating || getMetricRating(event.name || event.metric, event.value),
    page_url: event.href || event.url,
    page_path: event.path || (event.href ? new URL(event.href).pathname : null),
    connection_type: event.connection,
    device_category: event.deviceCategory || event.device,
    country: event.geo?.country,
    deployment_id: event.deploymentId,
    project_id: event.projectId,
    event_time: event.timestamp ? new Date(event.timestamp) : new Date(),
  };
}

async function handlePost(request) {
  // Check if properly configured
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[Speed Insights Webhook] Supabase not configured');
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  try {
    const rawBody = await request.text();

    // Verify signature if secret is configured
    if (DRAIN_SECRET) {
      const signature = request.headers.get('x-vercel-signature');
      if (!signature || !verifySignature(rawBody, signature)) {
        console.warn('[Speed Insights Webhook] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Parse the payload
    let events;
    try {
      const payload = JSON.parse(rawBody);
      // Vercel can send single event or array of events
      events = Array.isArray(payload) ? payload : [payload];
    } catch (e) {
      console.error('[Speed Insights Webhook] Invalid JSON:', e);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Filter to only Core Web Vitals metrics we care about
    const validMetrics = ['LCP', 'FID', 'INP', 'CLS', 'TTFB', 'FCP'];
    const processedEvents = events
      .filter((e) => validMetrics.includes(e.name || e.metric))
      .map(processEvent);

    if (processedEvents.length === 0) {
      // No valid events, but acknowledge receipt
      return NextResponse.json({ received: 0 });
    }

    // Insert into Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: insertError } = await supabase.from('web_vitals').insert(processedEvents);

    if (insertError) {
      console.error('[Speed Insights Webhook] Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to store' }, { status: 500 });
    }

    console.log(`[Speed Insights Webhook] Stored ${processedEvents.length} metrics`);

    return NextResponse.json({
      received: processedEvents.length,
      metrics: processedEvents.map((e) => e.metric_name),
    });
  } catch (err) {
    console.error('[Speed Insights Webhook] Error:', err);
    return NextResponse.json({ error: 'Failed to process speed insights data' }, { status: 500 });
  }
}

// Also support GET for health check
async function handleGet() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'Speed Insights Webhook',
    configured: !!DRAIN_SECRET,
    docs: 'https://vercel.com/docs/drains/reference/speed-insights',
  });
}

export const GET = withErrorLogging(handleGet, {
  route: 'webhooks/speed-insights',
  feature: 'webhooks',
});
export const POST = withErrorLogging(handlePost, {
  route: 'webhooks/speed-insights',
  feature: 'webhooks',
});