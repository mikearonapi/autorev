/**
 * Cron: Refresh NHTSA consumer complaints into car_issues.
 *
 * GET /api/cron/refresh-complaints
 *
 * Auth:
 * - Authorization: Bearer <CRON_SECRET> OR x-vercel-cron: true
 *
 * Query params:
 * - limitCars (default all) - Max cars to process
 * - skipCars (default 0) - Skip first N cars
 * - maxYearsPerCar (default 25) - Years to search per car
 * - concurrency (default 2, max 5) - Parallel requests
 * - delay (default 500) - Delay between API calls in ms
 * - mode (default 'upsert') - 'upsert' or 'replace'
 *
 * Note: NHTSA TSB API requires authentication, so this endpoint fetches
 * consumer complaints instead, which are publicly available and provide
 * valuable real-world safety data.
 */

import { NextResponse } from 'next/server';
import { supabaseServiceRole, isSupabaseConfigured } from '@/lib/supabase';
import {
  fetchComplaintRowsForCar,
  upsertComplaintRows,
  replaceComplaintsForCar,
} from '@/lib/complaintService';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Check if request is authorized via CRON_SECRET or Vercel cron header.
 * @param {Request} request
 * @returns {boolean}
 */
function isAuthorized(request) {
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) return true;
  const vercelCron = request.headers.get('x-vercel-cron');
  return vercelCron === 'true';
}

/**
 * Map array items with concurrency limit.
 * @template T
 * @template R
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T, index: number) => Promise<R>} mapper
 * @returns {Promise<R[]>}
 */
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

/**
 * GET handler for refresh-complaints cron job.
 * @param {Request} request
 * @returns {Promise<NextResponse>}
 */
export async function GET(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  if (!isSupabaseConfigured || !supabaseServiceRole) {
    return NextResponse.json(
      { error: 'Database not configured', code: 'DB_NOT_CONFIGURED' },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const skipCars = Math.max(0, Number(searchParams.get('skipCars') || 0));
    const limitCarsRaw = searchParams.get('limitCars');
    const limitCars = limitCarsRaw ? Math.max(1, Number(limitCarsRaw)) : null;
    const maxYearsPerCar = Math.max(1, Math.min(Number(searchParams.get('maxYearsPerCar') || 25), 50));
    const concurrency = Math.max(1, Math.min(Number(searchParams.get('concurrency') || 2), 5));
    const delay = Math.max(0, Math.min(Number(searchParams.get('delay') || 500), 5000));
    const mode = searchParams.get('mode') === 'replace' ? 'replace' : 'upsert';

    console.log('[Cron] refresh-complaints starting:', {
      skipCars,
      limitCars,
      maxYearsPerCar,
      concurrency,
      delay,
      mode,
    });

    // Fetch all cars with id, slug, name, brand, years
    const { data: cars, error: carsErr } = await supabaseServiceRole
      .from('cars')
      .select('id,slug,name,brand,years')
      .order('name', { ascending: true });

    if (carsErr) throw carsErr;

    const allCars = Array.isArray(cars) ? cars : [];
    let carsToProcess = allCars.slice(skipCars);
    if (limitCars) carsToProcess = carsToProcess.slice(0, limitCars);

    console.log(`[Cron] refresh-complaints: Processing ${carsToProcess.length} of ${allCars.length} cars`);

    const startedAt = Date.now();

    // Process cars with concurrency
    const perCar = await mapWithConcurrency(carsToProcess, concurrency, async (car, index) => {
      const carStartTime = Date.now();

      try {
        // Fetch complaints from NHTSA
        const fetched = await fetchComplaintRowsForCar({
          car,
          maxYears: maxYearsPerCar,
          perRequestTimeoutMs: 15_000,
          retries: 2,
          delayBetweenRequests: delay,
        });

        // Upsert or replace based on mode
        let dbResult;
        if (mode === 'replace') {
          dbResult = await replaceComplaintsForCar({
            client: supabaseServiceRole,
            carSlug: car.slug,
            rows: fetched.rows,
          });
        } else {
          dbResult = await upsertComplaintRows({
            client: supabaseServiceRole,
            rows: fetched.rows,
          });
        }

        const durationMs = Date.now() - carStartTime;

        console.log(`[Cron] refresh-complaints: ${car.slug} - fetched ${fetched.totalFetched}, rows ${fetched.rows.length}, ${mode === 'replace' ? `deleted ${dbResult.deleted || 0}, inserted ${dbResult.inserted}` : `inserted ${dbResult.inserted || 0}, updated ${dbResult.updated || 0}`} (${durationMs}ms)`);

        return {
          car_slug: car.slug,
          fetched: fetched.totalFetched,
          rows: fetched.rows.length,
          inserted: dbResult.inserted || 0,
          updated: dbResult.updated || 0,
          deleted: dbResult.deleted || 0,
          errors: fetched.errors,
          dbError: dbResult.success ? null : dbResult.error,
          durationMs,
        };
      } catch (err) {
        console.error(`[Cron] refresh-complaints: Error processing ${car.slug}:`, err);
        return {
          car_slug: car.slug,
          fetched: 0,
          rows: 0,
          inserted: 0,
          updated: 0,
          deleted: 0,
          errors: [err?.message || 'Unknown error'],
          dbError: null,
          durationMs: Date.now() - carStartTime,
        };
      }
    });

    const durationMs = Date.now() - startedAt;

    // Build summary
    const summary = {
      carsTotal: allCars.length,
      carsProcessed: perCar.length,
      totalFetched: perCar.reduce((sum, r) => sum + (r?.fetched || 0), 0),
      totalRows: perCar.reduce((sum, r) => sum + (r?.rows || 0), 0),
      totalInserted: perCar.reduce((sum, r) => sum + (r?.inserted || 0), 0),
      totalUpdated: perCar.reduce((sum, r) => sum + (r?.updated || 0), 0),
      totalDeleted: perCar.reduce((sum, r) => sum + (r?.deleted || 0), 0),
      carsWithErrors: perCar.filter((r) => (r?.errors?.length || 0) > 0 || r?.dbError).length,
      carsWithComplaints: perCar.filter((r) => (r?.rows || 0) > 0).length,
      durationMs,
      durationMinutes: Math.round(durationMs / 60000 * 10) / 10,
    };

    console.log('[Cron] refresh-complaints completed:', summary);

    return NextResponse.json({
      success: true,
      summary,
      results: perCar,
      ranAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Cron] refresh-complaints error:', err);
    return NextResponse.json(
      { error: 'Failed', message: err.message },
      { status: 500 }
    );
  }
}


