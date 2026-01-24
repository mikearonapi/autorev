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
import { processEmailQueue } from '@/lib/emailService';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request) {
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
    
    const result = await processEmailQueue(50);
    
    console.log(`[Cron/Email Queue] Completed: ${result.processed} sent, ${result.errors} errors`);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error('[Cron/Email Queue] Error:', err);
    return NextResponse.json(
      { error: 'Queue processing failed', message: err.message },
      { status: 500 }
    );
  }
}

// POST is also allowed for flexibility
export { GET as POST };

