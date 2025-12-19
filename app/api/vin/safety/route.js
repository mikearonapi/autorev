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
import { fetchAllSafetyData } from '@/lib/nhtsaSafetyService';
import { isValidVIN, cleanVIN } from '@/lib/vinDecoder';

export async function POST(request) {
  try {
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
  } catch (err) {
    console.error('[vin/safety] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch VIN safety data', code: 'SERVER_ERROR' }, { status: 500 });
  }
}






