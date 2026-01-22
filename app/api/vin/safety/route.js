/**
 * VIN Safety Proxy (server-side NHTSA fetch to avoid browser CORS).
 *
 * POST /api/vin/safety
 * Body:
 *  - { vin?: string, year: number, make: string, model: string }
 *
 * Returns:
 *  - { recalls: [], complaints: [], investigations: [], safetyRatings: null, error: null|string }
 */

import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { fetchAllSafetyData } from '@/lib/nhtsaSafetyService';
import { isValidVIN, cleanVIN } from '@/lib/vinDecoder';
import { withErrorLogging } from '@/lib/serverErrorLogger';

async function handlePost(request) {
  const body = await request.json().catch(() => ({}));
  const vinRaw = body?.vin || null;
  const year = body?.year ?? null;
  const make = body?.make ?? null;
  const model = body?.model ?? null;

  let vin = null;
  if (vinRaw) {
    const cleaned = cleanVIN(String(vinRaw));
    if (!isValidVIN(cleaned)) {
      return NextResponse.json({ error: 'Invalid VIN format', code: 'BAD_REQUEST' }, { status: 400 });
    }
    vin = cleaned;
  }

  if (!year || !make || !model) {
    return NextResponse.json({ error: 'year, make, and model are required', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const data = await fetchAllSafetyData({ vin, year, make, model });
  return NextResponse.json(data);
}

export const POST = withErrorLogging(handlePost, { route: 'vin/safety', feature: 'garage' });















