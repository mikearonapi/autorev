/**
 * Error Aggregate Flush Cron Job
 * 
 * Runs every 5 minutes to flush aggregated errors to Discord.
 * This prevents spam while still providing timely error notifications.
 * 
 * Critical errors (affecting many users) are sent immediately via the feedback API.
 * This job handles the less urgent aggregates.
 */

import { NextResponse } from 'next/server';
import { getAggregatesReadyToFlush, formatAggregateForDiscord } from '@/lib/errorAggregator';
import { notifyAggregatedError } from '@/lib/discord';
import { logCronError } from '@/lib/serverErrorLogger';

const CRON_SECRET = process.env.CRON_SECRET;

async function handleFlush(request) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const vercelCron = request.headers.get('x-vercel-cron');

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    if (vercelCron !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const aggregates = getAggregatesReadyToFlush();
    
    if (aggregates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No aggregates ready to flush',
        count: 0,
      });
    }

    console.log(`[ErrorFlush] Flushing ${aggregates.length} error aggregates`);

    // Send notifications for each aggregate
    const results = await Promise.allSettled(
      aggregates.map(async (aggregate) => {
        const formatted = formatAggregateForDiscord(aggregate);
        return notifyAggregatedError(formatted);
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      flushed: aggregates.length,
      succeeded,
      failed,
      aggregates: aggregates.map(agg => ({
        message: agg.errorData.message,
        count: agg.count,
        users: agg.affectedUsers.size,
      })),
    });
  } catch (error) {
    console.error('[ErrorFlush] Error flushing aggregates:', error);
    await logCronError('flush-error-aggregates', error, { phase: 'flush' });
    return NextResponse.json({
      error: 'Failed to flush error aggregates',
      details: error.message,
    }, { status: 500 });
  }
}

export async function GET(request) {
  return handleFlush(request);
}

// Also support POST for manual triggers
export async function POST(request) {
  return handleFlush(request);
}

