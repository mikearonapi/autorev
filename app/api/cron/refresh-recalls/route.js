/**
 * Cron: Refresh NHTSA recalls into car_recalls.
 *
 * GET /api/cron/refresh-recalls
 *
 * Auth:
 * - Authorization: Bearer <CRON_SECRET> OR x-vercel-cron: true
 *
 * Query params:
 * - limitCars (default all)
 * - skipCars (default 0)
 * - maxYearsPerCar (default 25)
 * - concurrency (default 3, max 8)
 */

import { NextResponse } from 'next/server';
import { supabaseServiceRole, isSupabaseConfigured } from '@/lib/supabase';
import { fetchRecallRowsForCar, upsertRecallRows } from '@/lib/recallService';
import { notifyCronEnrichment, notifyCronFailure } from '@/lib/discord';

const CRON_SECRET = process.env.CRON_SECRET;

function isAuthorized(request) {
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;
  const vercelCron = request.headers.get('x-vercel-cron');
  return vercelCron === 'true';
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = [];
  let idx = 0;

  const workers = Array.from({ length: concurrency }).map(async () => {
    while (idx < items.length) {
      const myIdx = idx;
      idx += 1;
      // eslint-disable-next-line no-await-in-loop
      const r = await mapper(items[myIdx], myIdx);
      results[myIdx] = r;
    }
  });

  await Promise.all(workers);
  return results;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (!isSupabaseConfigured || !supabaseServiceRole) {
    return NextResponse.json({ error: 'Database not configured', code: 'DB_NOT_CONFIGURED' }, { status: 503 });
  }

  const startedAt = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const skipCars = Math.max(0, Number(searchParams.get('skipCars') || 0));
    const limitCarsRaw = searchParams.get('limitCars');
    const limitCars = limitCarsRaw ? Math.max(1, Number(limitCarsRaw)) : null;

    const maxYearsPerCar = Math.max(1, Math.min(Number(searchParams.get('maxYearsPerCar') || 25), 50));
    const concurrency = Math.max(1, Math.min(Number(searchParams.get('concurrency') || 3), 8));

    const { data: cars, error: carsErr } = await supabaseServiceRole
      .from('cars')
      .select('slug,name,brand,years')
      .order('name', { ascending: true });

    if (carsErr) throw carsErr;

    const allCars = Array.isArray(cars) ? cars : [];
    let carsToProcess = allCars.slice(skipCars);
    if (limitCars) carsToProcess = carsToProcess.slice(0, limitCars);

    const perCar = await mapWithConcurrency(carsToProcess, concurrency, async (car) => {
      const fetched = await fetchRecallRowsForCar({
        car,
        maxYears: maxYearsPerCar,
        perRequestTimeoutMs: 12_000,
        retries: 2,
      });

      const upsert = await upsertRecallRows({ client: supabaseServiceRole, rows: fetched.rows });

      return {
        car_slug: car.slug,
        fetched: fetched.rows.length,
        upserted: upsert.upserted,
        errors: fetched.errors,
        upsertError: upsert.success ? null : upsert.error,
      };
    });

    const durationMs = Date.now() - startedAt;

    const summary = {
      carsTotal: allCars.length,
      carsProcessed: perCar.length,
      totalFetched: perCar.reduce((sum, r) => sum + (r?.fetched || 0), 0),
      totalUpserted: perCar.reduce((sum, r) => sum + (r?.upserted || 0), 0),
      carsWithErrors: perCar.filter((r) => (r?.errors?.length || 0) > 0 || r?.upsertError).length,
      durationMs,
    };

    notifyCronEnrichment('Recall Data Refresh', {
      duration: durationMs,
      table: 'car_recalls',
      recordsAdded: summary.totalUpserted,
      recordsProcessed: summary.totalFetched,
      sourcesChecked: summary.carsProcessed,
      errors: summary.carsWithErrors,
      details: [
        { label: '🚗 Cars Checked', value: summary.carsProcessed },
        { label: '📥 From NHTSA', value: summary.totalFetched },
      ],
    });

    return NextResponse.json({
      success: true,
      summary,
      results: perCar,
      ranAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron] refresh-recalls error:', err);
    notifyCronFailure('Refresh Recalls', err, { phase: 'processing' });
    return NextResponse.json({ error: 'Failed', message: err.message }, { status: 500 });
  }
}






