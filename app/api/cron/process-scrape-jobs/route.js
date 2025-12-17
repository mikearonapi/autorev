/**
 * Scrape Jobs Cron API
 * 
 * GET /api/cron/process-scrape-jobs
 * 
 * Processes pending scrape jobs from the queue.
 * Should be called by a cron job (e.g., Vercel Cron or external service).
 * 
 * Headers:
 * - Authorization: Bearer <CRON_SECRET>
 * 
 * Query Parameters:
 * - max: Max jobs to process (default: 5)
 * 
 * @module app/api/cron/process-scrape-jobs
 */

import { NextResponse } from 'next/server';
import * as scrapeJobService from '@/lib/scrapeJobService';
import { notifyCronCompletion, notifyCronFailure } from '@/lib/discord';

// Cron secret for authorization
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/process-scrape-jobs
 * Process pending scrape jobs
 */
export async function GET(request) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    // Also check Vercel's cron authorization
    const vercelCron = request.headers.get('x-vercel-cron');
    if (vercelCron !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  
  const startTime = Date.now();

  try {
    // Parse parameters
    const { searchParams } = new URL(request.url);
    const maxJobs = parseInt(searchParams.get('max')) || 5;
    const delayBetweenJobs = parseInt(searchParams.get('delay')) || 30000;
    
    console.log(`[Cron] Processing up to ${maxJobs} scrape jobs...`);
    
    // Process jobs
    const result = await scrapeJobService.processPendingJobs({
      maxJobs,
      delayBetweenJobs,
    });
    
    notifyCronCompletion('Process Scrape Jobs', {
      duration: Date.now() - startTime,
      processed: result.processed || result.jobsProcessed || 0,
      succeeded: result.succeeded || result.completed || 0,
      failed: result.failed || (result.errors ? result.errors.length : 0),
      errors: result.errors ? result.errors.length : 0,
    });

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron] Error processing jobs:', err);
    notifyCronFailure('Process Scrape Jobs', err, { phase: 'processing' });
    return NextResponse.json(
      { error: 'Failed to process jobs', message: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/process-scrape-jobs
 * Schedule stale data refresh
 */
export async function POST(request) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const vercelCron = request.headers.get('x-vercel-cron');

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    if (vercelCron !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
  
  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body;
    
    if (action === 'schedule_refresh') {
      const result = await scrapeJobService.scheduleStaleDataRefresh({
        maxAge: body.maxAge || 7,
        limit: body.limit || 50,
        priority: body.priority || 7,
      });
      
      return NextResponse.json({
        success: true,
        action: 'schedule_refresh',
        ...result,
      });
    }
    
    if (action === 'cleanup') {
      const result = await scrapeJobService.cleanupOldJobs(body.daysOld || 30);
      
      return NextResponse.json({
        success: true,
        action: 'cleanup',
        ...result,
      });
    }
    
    if (action === 'schedule_parts_ingest') {
      const vendorKeys = Array.isArray(body.vendorKeys) ? body.vendorKeys : ['performancebyie', 'eqtuning', 'bmptuning'];
      const result = await scrapeJobService.schedulePartsVendorIngestJobs({
        vendorKeys,
        priority: body.priority || 6,
        offPeakOnly: body.offPeakOnly !== false,
        spreadOverHours: body.spreadOverHours ?? 24,
        payload: body.payload || { maxPages: 20, pageSize: 250, sleepMs: 250, maxProducts: 2500 },
      });

      return NextResponse.json({
        success: true,
        action: 'schedule_parts_ingest',
        ...result,
      });
    }

    if (action === 'schedule_knowledge_index') {
      // Default: index our own repo docs/audit so AL has reliable, citeable internal sources.
      const result = await scrapeJobService.createJob({
        carSlug: null,
        jobType: scrapeJobService.JOB_TYPES.KNOWLEDGE_INDEX,
        priority: body.priority || 7,
        scheduledFor: new Date(),
        sourceKey: body.sourceKey || 'internal_docs',
        payload: body.payload || { mode: 'internal_docs', includeDirs: ['docs', 'audit'], maxFiles: 40, maxCharsPerFile: 25000 },
      });

      return NextResponse.json({
        success: true,
        action: 'schedule_knowledge_index',
        ...result,
      });
    }

    if (action === 'stats') {
      const stats = await scrapeJobService.getJobStats();
      
      return NextResponse.json({
        success: true,
        action: 'stats',
        stats,
      });
    }
    
    return NextResponse.json(
      { error: 'Unknown action', validActions: ['schedule_refresh', 'schedule_parts_ingest', 'schedule_knowledge_index', 'cleanup', 'stats'] },
      { status: 400 }
    );
  } catch (err) {
    console.error('[Cron] Error:', err);
    return NextResponse.json(
      { error: 'Failed', message: err.message },
      { status: 500 }
    );
  }
}



