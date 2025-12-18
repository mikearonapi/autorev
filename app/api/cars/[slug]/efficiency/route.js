import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/cars/[slug]/efficiency
 * 
 * Fetches fuel economy data (EPA) for a specific car.
 * FREE tier - basic buying research data.
 */
export async function GET(request, { params }) {
  const { slug } = params;
  
  if (!slug) {
    return NextResponse.json({ error: 'Car slug is required' }, { status: 400 });
  }
  
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ efficiency: null }, { status: 200 });
  }
  
  try {
    const { data, error } = await supabase
      .from('car_fuel_economy')
      .select(`
        city_mpg,
        highway_mpg,
        combined_mpg,
        fuel_type,
        annual_fuel_cost,
        co2_emissions,
        ghg_score,
        is_electric,
        is_hybrid,
        ev_range,
        source,
        fetched_at
      `)
      .eq('car_slug', slug)
      .maybeSingle();
    
    if (error) {
      console.error('[API/efficiency] Error:', error);
      throw error;
    }
    
    // Fuel economy data is static - cache for 1 hour
    return new NextResponse(JSON.stringify({ efficiency: data }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (err) {
    console.error('[API/efficiency] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch efficiency data' }, { status: 500 });
  }
}





