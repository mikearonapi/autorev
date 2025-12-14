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

const CRON_SECRET = process.env.CRON_SECRET;

function isAuthorized(request) {
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;
  const vercelCron = request.headers.get('x-vercel-cron');
  return vercelCron === 'true';
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);

    const vendorKeysParam = searchParams.get('vendorKeys');
    const vendorKeys = vendorKeysParam
      ? vendorKeysParam.split(',').map((s) => s.trim()).filter(Boolean)
      : ['performancebyie', 'eqtuning', 'bmptuning'];

    const partsPriority = Number(searchParams.get('partsPriority') || 6);
    const knowledgePriority = Number(searchParams.get('knowledgePriority') || 7);

    const partsPayload = {
      maxPages: Number(searchParams.get('maxPages') || 20),
      pageSize: Number(searchParams.get('pageSize') || 250),
      sleepMs: Number(searchParams.get('sleepMs') || 250),
      maxProducts: Number(searchParams.get('maxProducts') || 2500),
    };

    const knowledgePayload = {
      mode: 'internal_docs',
      includeDirs: ['docs', 'audit'],
      maxFiles: Number(searchParams.get('maxFiles') || 40),
      maxCharsPerFile: Number(searchParams.get('maxCharsPerFile') || 25000),
    };

    const partsResult = await scrapeJobService.schedulePartsVendorIngestJobs({
      vendorKeys,
      priority: partsPriority,
      offPeakOnly: true,
      spreadOverHours: 24,
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

    return NextResponse.json({
      success: true,
      scheduledAt: new Date().toISOString(),
      parts: partsResult,
      knowledge: knowledgeResult,
    });
  } catch (err) {
    console.error('[Cron] schedule-ingestion error:', err);
    return NextResponse.json({ error: 'Failed', message: err.message }, { status: 500 });
  }
}

