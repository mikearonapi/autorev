/**
 * Subscription Metrics Cron Job
 * 
 * Calculates and stores daily subscription metrics snapshots.
 * Run daily via Vercel Cron or similar scheduler.
 * 
 * Metrics calculated:
 * - MRR (Monthly Recurring Revenue)
 * - ARR (Annual Recurring Revenue)
 * - Churn Rate
 * - Trial-to-Paid Conversion Rate
 * - LTV (Lifetime Value)
 * - Subscriber counts by tier
 * 
 * @route POST /api/cron/subscription-metrics
 * 
 * Vercel Cron config (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/subscription-metrics",
 *     "schedule": "0 6 * * *"  // Daily at 6 AM UTC
 *   }]
 * }
 */

import { NextResponse } from 'next/server';

import { notifyCronEnrichment } from '@/lib/discord';
import { withErrorLogging, logCronError } from '@/lib/serverErrorLogger';
import { saveDailySnapshot, getAllMetrics } from '@/lib/subscriptionMetricsService';

/**
 * Verify cron secret for security
 */
function verifyCronSecret(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Allow requests from Vercel Cron (no auth header but special IP)
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  
  // Or verify bearer token
  const isValidToken = cronSecret && authHeader === `Bearer ${cronSecret}`;
  
  return isVercelCron || isValidToken;
}

async function handlePost(request) {
  // Verify this is an authorized cron request
  if (!verifyCronSecret(request)) {
    console.warn('[SubscriptionMetrics Cron] Unauthorized request');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log('[SubscriptionMetrics Cron] Starting daily metrics calculation...');
  const startTime = Date.now();

  try {
    // Calculate and save daily snapshot
    const success = await saveDailySnapshot();
    
    if (!success) {
      throw new Error('Failed to save metrics snapshot');
    }

    // Also get the calculated metrics to return
    const metrics = await getAllMetrics();
    
    const duration = Date.now() - startTime;
    console.log('[SubscriptionMetrics Cron] Completed in', duration, 'ms');
    console.log('[SubscriptionMetrics Cron] MRR:', metrics.mrr_cents / 100);
    console.log('[SubscriptionMetrics Cron] Total subscribers:', metrics.total_subscribers);
    console.log('[SubscriptionMetrics Cron] Churn rate:', metrics.monthly_churn_rate, '%');

    // Send success notification to Discord
    notifyCronEnrichment('Subscription Metrics', {
      duration,
      table: 'subscription_metrics_snapshots',
      recordsAdded: 1,
      details: [
        { label: '💰 MRR', value: `$${(metrics.mrr_cents / 100).toFixed(2)}` },
        { label: '👥 Subscribers', value: metrics.total_subscribers },
        { label: '📉 Churn', value: `${metrics.monthly_churn_rate}%` },
      ],
    }).catch(() => {}); // Don't fail if Discord fails

    return NextResponse.json({
      success: true,
      duration_ms: duration,
      metrics: {
        mrr: metrics.mrr_cents / 100,
        arr: metrics.arr_cents / 100,
        total_subscribers: metrics.total_subscribers,
        churn_rate: metrics.monthly_churn_rate,
        trial_conversion_rate: metrics.trial_conversion_rate,
        ltv: metrics.ltv_cents / 100,
        subscribers_by_tier: metrics.subscribers_by_tier,
      },
    });
  } catch (error) {
    console.error('[SubscriptionMetrics Cron] Error:', error);
    
    // Log to error tracking and Discord
    await logCronError('subscription-metrics', error, { phase: 'metrics_calculation' });
    
    return NextResponse.json(
      { 
        error: 'Failed to calculate subscription metrics',
      },
      { status: 500 }
    );
  }
}

// Also support GET for manual testing
async function handleGet(_request) {
  // For GET requests, just return current metrics without saving
  // (useful for admin dashboard)
  try {
    const metrics = await getAllMetrics();
    
    return NextResponse.json({
      success: true,
      metrics: {
        mrr: metrics.mrr_cents / 100,
        arr: metrics.arr_cents / 100,
        total_subscribers: metrics.total_subscribers,
        churn_rate: metrics.monthly_churn_rate,
        trial_conversion_rate: metrics.trial_conversion_rate,
        ltv: metrics.ltv_cents / 100,
        arpu: metrics.arpu_cents / 100,
        subscribers_by_tier: metrics.subscribers_by_tier,
        calculated_at: metrics.calculated_at,
      },
    });
  } catch (error) {
    console.error('[SubscriptionMetrics] Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to calculate metrics' },
      { status: 500 }
    );
  }
}

export const GET = withErrorLogging(handleGet, { route: 'cron/subscription-metrics', feature: 'cron' });
export const POST = withErrorLogging(handlePost, { route: 'cron/subscription-metrics', feature: 'cron' });
