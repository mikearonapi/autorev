import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/cars/[slug]/lap-times
 * 
 * Fetches track lap time data for a specific car.
 * Uses the get_car_track_lap_times RPC function.
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
      { lapTimes: [], message: 'Database not configured' },
      { status: 200 }
    );
  }
  
  try {
    // Use the RPC function to get lap times with track/layout info
    const { data, error } = await supabase.rpc('get_car_track_lap_times', {
      p_car_slug: slug,
    });
    
    if (error) {
      console.error('[API/lap-times] RPC error:', error);
      
      // Fallback to direct query with joins if RPC doesn't exist
      const { data: directData, error: directError } = await supabase
        .from('car_track_lap_times')
        .select(`
          *,
          track_layouts!inner (
            name,
            length_miles,
            track_venues!inner (
              name,
              location,
              country
            )
          )
        `)
        .eq('car_slug', slug)
        .order('lap_time_seconds', { ascending: true });
      
      if (directError) {
        // Try simpler query without joins
        const { data: simpleData, error: simpleError } = await supabase
          .from('car_track_lap_times')
          .select('*')
          .eq('car_slug', slug)
          .order('lap_time_seconds', { ascending: true });
        
        if (simpleError) {
          throw simpleError;
        }
        
        return NextResponse.json({ lapTimes: simpleData || [] });
      }
      
      // Transform the nested data
      const transformed = (directData || []).map(row => ({
        id: row.id,
        car_slug: row.car_slug,
        lap_time_seconds: row.lap_time_seconds,
        driver_name: row.driver_name,
        source: row.source,
        source_url: row.source_url,
        conditions: row.conditions,
        tires: row.tires,
        mod_level: row.mod_level,
        notes: row.notes,
        recorded_at: row.recorded_at,
        layout_name: row.track_layouts?.name,
        layout_length: row.track_layouts?.length_miles,
        track_name: row.track_layouts?.track_venues?.name,
        track_location: row.track_layouts?.track_venues?.location,
        track_country: row.track_layouts?.track_venues?.country,
      }));
      
      return NextResponse.json({ lapTimes: transformed });
    }
    
    return NextResponse.json({ lapTimes: data || [] });
  } catch (err) {
    console.error('[API/lap-times] Error fetching lap times:', err);
    return NextResponse.json(
      { error: 'Failed to fetch lap times', details: err.message },
      { status: 500 }
    );
  }
}

