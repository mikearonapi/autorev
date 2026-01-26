/**
 * API Route: GET /api/parts/turbos
 * 
 * Fetches turbo models for the upgrade center's advanced mode.
 * 
 * @route /api/parts/turbos
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { errors } from '@/lib/apiErrors';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handleGet() {
  const TURBO_COLS = 'id, brand, model, frame_size, inducer_mm, exducer_mm, trim, compressor_ar, turbine_ar, bearing_type, max_hp, oil_feed, water_cooled, notes, created_at';
  
  const { data, error } = await supabaseAdmin
    .from('turbo_models')
    .select(TURBO_COLS)
    .order('brand')
    .order('model');
  
  if (error) {
    console.error('[API/parts/turbos] Error:', error);
    return errors.database('Failed to fetch turbo models');
  }
  
  return NextResponse.json({ turbos: data || [] }, {
    headers: {
      // Cache for 1 hour - turbo data rarely changes
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    }
  });
}

export const GET = withErrorLogging(handleGet, { route: 'parts/turbos', feature: 'tuning-shop' });
