/**
 * API Route: GET /api/parts/turbos
 * 
 * Fetches turbo models for the upgrade center's advanced mode.
 * Note: The turbo_models table may not exist yet - returns empty array if not.
 * 
 * @route /api/parts/turbos
 */

import { NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { withErrorLogging } from '@/lib/serverErrorLogger';

// Force dynamic to prevent static prerendering
export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handleGet() {
  // Use only columns that are likely to exist
  const TURBO_COLS = 'id, brand, model, inducer_mm, exducer_mm, trim, compressor_ar, turbine_ar, bearing_type, max_hp, oil_feed, water_cooled, notes, created_at';
  
  try {
    const { data, error } = await supabaseAdmin
      .from('turbo_models')
      .select(TURBO_COLS)
      .order('brand')
      .order('model');
    
    if (error) {
      // If table doesn't exist or column missing, return empty array gracefully
      if (error.code === '42P01' || error.code === '42703') {
        console.warn('[API/parts/turbos] Table or column not found, returning empty array');
        return NextResponse.json({ turbos: [] }, {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          }
        });
      }
      console.error('[API/parts/turbos] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch turbo models', turbos: [] }, { status: 500 });
    }
    
    return NextResponse.json({ turbos: data || [] }, {
      headers: {
        // Cache for 1 hour - turbo data rarely changes
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      }
    });
  } catch (err) {
    console.error('[API/parts/turbos] Unexpected error:', err);
    return NextResponse.json({ turbos: [] });
  }
}

export const GET = withErrorLogging(handleGet, { route: 'parts/turbos', feature: 'tuning-shop' });
