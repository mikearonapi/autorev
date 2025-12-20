import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/cars/[slug]/dyno
 * 
 * Fetches dyno run data for a specific car.
 * Uses the get_car_dyno_runs RPC function.
 */
export async function GET(request, { params }) {
  const { slug } = params;
  
  if (!slug) {
    return NextResponse.json(
      { error: 'Car slug is required' },
      { status: 400 }
    );
  }
  
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(
      { runs: [], message: 'Database not configured' },
      { status: 200 }
    );
  }
  
  try {
    // Use the RPC function to get dyno runs
    const { data, error } = await supabase.rpc('get_car_dyno_runs', {
      p_car_slug: slug,
    });
    
    if (error) {
      console.error('[API/dyno] RPC error:', error);
      
      // Fallback to direct query if RPC doesn't exist
      const { data: directData, error: directError } = await supabase
        .from('car_dyno_runs')
        .select('*')
        .eq('car_slug', slug)
        .order('peak_whp', { ascending: false, nullsFirst: false });
      
      if (directError) {
        throw directError;
      }
      
      return NextResponse.json({ runs: directData || [] });
    }
    
    return NextResponse.json({ runs: data || [] });
  } catch (err) {
    console.error('[API/dyno] Error fetching dyno data:', err);
    return NextResponse.json(
      { error: 'Failed to fetch dyno data', details: err.message },
      { status: 500 }
    );
  }
}













