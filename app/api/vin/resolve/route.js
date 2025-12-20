import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { decodeVIN, isValidVIN, cleanVIN } from '@/lib/vinDecoder';
import { withErrorLogging } from '@/lib/serverErrorLogger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * POST /api/vin/resolve
 *
 * Body can be either:
 * - { vin: string }
 * - { decoded: { year, make, model, trim, series, driveType, transmission } }
 *
 * Returns:
 * - decoded (if vin provided)
 * - best match: carSlug + carVariantId/key + confidence
 */
async function handlePost(request) {
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const body = await request.json();
  let decoded = body?.decoded || null;
  const vin = body?.vin || null;

  if (!decoded && !vin) {
    return NextResponse.json({ error: 'vin or decoded is required' }, { status: 400 });
  }

  if (!decoded && vin) {
    const cleaned = cleanVIN(vin);
    if (!isValidVIN(cleaned)) {
      return NextResponse.json({ error: 'Invalid VIN format', vin: cleaned }, { status: 400 });
    }
    decoded = await decodeVIN(cleaned);
    if (!decoded?.success) {
      return NextResponse.json({ error: decoded?.error || 'Failed to decode VIN', decoded }, { status: 422 });
    }
  }

  const make = decoded?.make || null;
  const model = decoded?.model || null;
  const year = decoded?.year || null;
  const trim = decoded?.trim || null;
  const series = decoded?.series || null;
  const driveType = decoded?.driveType || null;
  const transmission = decoded?.transmission || null;

  if (!make || !model || !year) {
    return NextResponse.json({
      error: 'Decoded VIN missing required fields (make/model/year)',
      decoded,
    }, { status: 422 });
  }

  const { data, error } = await supabase.rpc('resolve_car_and_variant_from_vin_decode', {
    p_make: make,
    p_model: model,
    p_model_year: year,
    p_trim: trim,
    p_series: series,
    p_drive_type: driveType,
    p_transmission: transmission,
  });

  if (error) {
    console.error('[vin/resolve] RPC error:', error);
    throw error;
  }

  const best = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    decoded: decoded?.success ? decoded : null,
    match: best ? {
      carSlug: best.car_slug,
      carId: best.car_id,
      carVariantId: best.car_variant_id,
      carVariantKey: best.car_variant_key,
      carVariantDisplayName: best.car_variant_display_name,
      confidence: best.confidence,
      reasons: best.reasons || [],
    } : null,
  });
}

export const POST = withErrorLogging(handlePost, { route: 'vin/resolve', feature: 'garage' });















