import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/cars/[slug]/price-by-year
 * 
 * Fetches year-by-year pricing data for a specific car.
 * FREE tier - helps buyers find best value years.
 */
export async function GET(request, { params }) {
  const { slug } = params;
  
  if (!slug) {
    return NextResponse.json({ error: 'Car slug is required' }, { status: 400 });
  }
  
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ pricesByYear: [], priceHistory: [] }, { status: 200 });
  }
  
  try {
    // Get year-by-year pricing
    const { data: yearData, error: yearError } = await supabase
      .from('car_market_pricing_years')
      .select(`
        model_year,
        avg_price,
        min_price,
        max_price,
        sample_size,
        avg_mileage,
        source,
        fetched_at
      `)
      .eq('car_slug', slug)
      .order('model_year', { ascending: false });
    
    if (yearError) {
      console.error('[API/price-by-year] Year data error:', yearError);
    }
    
    // Get price history (for trends)
    const { data: historyData, error: historyError } = await supabase
      .from('car_price_history')
      .select(`
        recorded_at,
        avg_price,
        min_price,
        max_price,
        sample_size,
        source
      `)
      .eq('car_slug', slug)
      .order('recorded_at', { ascending: true });
    
    if (historyError) {
      console.error('[API/price-by-year] History error:', historyError);
    }
    
    // Calculate best value year (lowest avg price with decent sample)
    let bestValueYear = null;
    if (yearData && yearData.length > 0) {
      const validYears = yearData.filter(y => y.sample_size >= 3 && y.avg_price > 0);
      if (validYears.length > 0) {
        bestValueYear = validYears.reduce((best, curr) => 
          curr.avg_price < best.avg_price ? curr : best
        );
      }
    }
    
    return NextResponse.json({
      pricesByYear: yearData || [],
      priceHistory: historyData || [],
      bestValueYear: bestValueYear?.model_year || null,
      bestValuePrice: bestValueYear?.avg_price || null,
    });
  } catch (err) {
    console.error('[API/price-by-year] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch pricing data' }, { status: 500 });
  }
}






