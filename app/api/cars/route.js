import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { withErrorLogging } from '@/lib/serverErrorLogger';

// Force dynamic rendering - this route uses request.url for query params
export const dynamic = 'force-dynamic';

/**
 * GET /api/cars
 * 
 * Returns a list of all cars with basic info.
 * Public endpoint - no auth required.
 * 
 * Query params:
 *   - limit: Max number of results (default: all)
 *   - brand: Filter by brand (e.g., "Porsche")
 *   - tier: Filter by tier (e.g., "premium", "upper-mid", "mid", "budget")
 */
async function handleGet(request) {
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ cars: [] }, { status: 200 });
  }

  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit');
  const brand = searchParams.get('brand');
  const tier = searchParams.get('tier');

  let query = supabase
    .from('cars')
    .select(`
      id,
      slug,
      name,
      brand,
      tier,
      category,
      hp,
      price_avg
    `)
    .order('name', { ascending: true });

  // Apply optional filters
  if (brand) {
    query = query.eq('brand', brand);
  }
  if (tier) {
    query = query.eq('tier', tier);
  }
  if (limit) {
    const parsedLimit = parseInt(limit, 10);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      query = query.limit(parsedLimit);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('[API/cars] Supabase error:', error);
    throw error;
  }

  // Cache car list for 5 minutes, allow stale for 10 minutes while revalidating
  return new NextResponse(JSON.stringify({ cars: data || [] }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}

export const GET = withErrorLogging(handleGet, { route: 'cars', feature: 'browse-cars' });












