/**
 * Cron: Schedule ingestion jobs into scrape_jobs.
 *
 * GET /api/cron/schedule-ingestion
 *
 * - Enqueues recurring jobs (parts vendors + knowledge index) to be executed by
 *   /api/cron/process-scrape-jobs.
 *
 * Auth:
 * - Authorization: Bearer <CRON_SECRET> OR x-vercel-cron: true
 */

import { NextResponse } from 'next/server';
import * as scrapeJobService from '@/lib/scrapeJobService';
import { notifyCronCompletion, notifyCronFailure } from '@/lib/discord';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const CRON_SECRET = process.env.CRON_SECRET;

function isAuthorized(request) {
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;
  const vercelCron = request.headers.get('x-vercel-cron');
  return vercelCron === 'true';
}

async function handleGet(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    const vendorKeysParam = searchParams.get('vendorKeys');
    const vendorKeys = vendorKeysParam
      ? vendorKeysParam.split(',').map((s) => s.trim()).filter(Boolean)
      : ['performancebyie', 'eqtuning', 'bmptuning'];

    const offPeakOnly = searchParams.get('offPeakOnly') !== 'false';
    const spreadOverHours = Number(searchParams.get('spreadOverHours') || 24);

    const partsPriority = Number(searchParams.get('partsPriority') || 6);
    const knowledgePriority = Number(searchParams.get('knowledgePriority') || 7);

    const partsPayload = {
      // Keep each vendor job bounded for serverless execution; ingestion is incremental.
      maxPages: Number(searchParams.get('maxPages') || 5),
      pageSize: Number(searchParams.get('pageSize') || 250),
      sleepMs: Number(searchParams.get('sleepMs') || 250),
      maxProducts: Number(searchParams.get('maxProducts') || 400),
    };

    const knowledgePayload = {
      mode: 'internal_docs',
      includeDirs: ['docs', 'audit'],
      // Bound runtime; schedule can be repeated.
      maxFiles: Number(searchParams.get('maxFiles') || 10),
      maxCharsPerFile: Number(searchParams.get('maxCharsPerFile') || 25000),
    };

    const partsResult = await scrapeJobService.schedulePartsVendorIngestJobs({
      vendorKeys,
      priority: partsPriority,
      offPeakOnly,
      spreadOverHours,
      payload: partsPayload,
    });

    const knowledgeResult = await scrapeJobService.createJob({
      carSlug: null,
      jobType: scrapeJobService.JOB_TYPES.KNOWLEDGE_INDEX,
      priority: knowledgePriority,
      scheduledFor: new Date(),
      sourceKey: 'internal_docs',
      payload: knowledgePayload,
    });

    notifyCronCompletion('Schedule Ingestion', {
      duration: Date.now() - startTime,
      processed: (partsResult?.jobs?.length || partsResult?.scheduledJobs || 0) + 1,
      succeeded: 2,
      failed: 0,
      created: (partsResult?.jobs?.length || partsResult?.scheduledJobs || 0) + 1,
    });

    return NextResponse.json({
      success: true,
      scheduledAt: new Date().toISOString(),
      parts: partsResult,
      knowledge: knowledgeResult,
    });
  } catch (err) {
    console.error('[Cron] schedule-ingestion error:', err);
    notifyCronFailure('Schedule Ingestion', err, { phase: 'processing' });
    return NextResponse.json({ error: 'Schedule ingestion cron job failed' }, { status: 500 });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'cron/schedule-ingestion', feature: 'cron' });











