import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { resolveCarId } from '@/lib/carResolver';
import { errors } from '@/lib/apiErrors';

/**
 * GET /api/cars/[slug]/dyno
 * 
 * Fetches dyno run data for a specific car.
 * Uses the get_car_dyno_runs RPC function.
 * 
 * Updated 2026-01-15: Uses car_id for efficient fallback queries
 */
async function handleGet(request, { params }) {
  const { slug } = await params;
  
  if (!slug) {
    return errors.missingField('slug');
  }
  
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(
      { runs: [], message: 'Database not configured' },
      { status: 200 }
    );
  }
  
  try {
    // Use the RPC function to get dyno runs (RPC handles slug→id resolution internally)
    const { data, error } = await supabase.rpc('get_car_dyno_runs', {
      p_car_slug: slug,
    });
    
    if (error) {
      console.error('[API/dyno] RPC error:', error);
      
      // Fallback to direct query if RPC doesn't exist
      // Resolve car_id (car_slug column no longer exists on car_dyno_runs)
      const carId = await resolveCarId(slug);
      if (!carId) {
        return NextResponse.json({ runs: [], message: 'Car not found' }, { status: 200 });
      }
      
      const DYNO_COLS = 'id, car_id, variant_key, tune_level, peak_whp, peak_wtq, boost_psi, fuel_type, dyno_type, source_url, source_type, notes, created_at';
      
      const { data: directData, error: directError } = await supabase
        .from('car_dyno_runs')
        .select(DYNO_COLS)
        .eq('car_id', carId)
        .order('peak_whp', { ascending: false, nullsFirst: false });
      
      if (directError) {
        throw directError;
      }
      
      return NextResponse.json({ runs: directData || [] });
    }
    
    return NextResponse.json({ runs: data || [] });
  } catch (err) {
    console.error('[API/dyno] Error fetching dyno data:', err);
    return errors.internal('Failed to fetch dyno data');
  }
}

export const GET = withErrorLogging(handleGet, { route: 'cars/[slug]/dyno', feature: 'browse-cars' });
