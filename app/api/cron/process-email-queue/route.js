/**
 * Email Queue Processing Cron Job
 * 
 * Processes scheduled emails from the queue.
 * Should be called every 5-15 minutes via Vercel cron or external scheduler.
 * 
 * Vercel cron config: Add to vercel.json crons array with
 * path "/api/cron/process-email-queue" and schedule "every 5 minutes"
 * 
 * @route GET /api/cron/process-email-queue
 */

import { NextResponse } from 'next/server';

import { notifyCronEnrichment } from '@/lib/discord';
import { processEmailQueue } from '@/lib/emailService';
import { withErrorLogging, logCronError } from '@/lib/serverErrorLogger';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

async function handleGet(request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    
    // Allow Vercel cron (they don't send auth header, but requests come from Vercel)
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    
    // For manual/external calls, require secret
    if (!isVercelCron && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.warn('[Cron/Email Queue] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron/Email Queue] Starting queue processing...');
    const startTime = Date.now();
    
    const result = await processEmailQueue(50);
    const duration = Date.now() - startTime;
    
    console.log(`[Cron/Email Queue] Completed: ${result.processed} sent, ${result.errors} errors`);

    // Send Discord notification if any emails were processed
    if (result.processed > 0) {
      notifyCronEnrichment('Email Queue', {
        duration,
        table: 'email_queue',
        recordsProcessed: result.processed,
        errors: result.errors,
        details: [
          { label: '📧 Sent', value: result.processed },
          { label: '❌ Errors', value: result.errors },
        ],
        skipped: result.processed === 0,
        skipReason: result.processed === 0 ? 'empty_queue' : undefined,
      }).catch(() => {}); // Don't fail if Discord fails
    }

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[Cron/Email Queue] Error:', err);
    
    // Log to error tracking and Discord
    await logCronError('process-email-queue', err, { phase: 'queue_processing' });
    
    return NextResponse.json(
      { error: 'Email queue processing failed' },
      { status: 500 }
    );
  }
}

export const GET = withErrorLogging(handleGet, { route: 'cron/process-email-queue', feature: 'cron' });
// POST is also allowed for flexibility
export const POST = withErrorLogging(handleGet, { route: 'cron/process-email-queue', feature: 'cron' });

