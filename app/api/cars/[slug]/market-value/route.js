import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/cars/[slug]/market-value
 * 
 * Fetches market pricing data for a specific car.
 * Includes data from BaT, Cars.com, and Hagerty.
 * 
 * Response:
 * {
 *   marketValue: {
 *     avg_price: number,
 *     bat_avg: number,
 *     carscom_avg: number,
 *     hagerty_condition_2: number,
 *     trend_direction: string,
 *     confidence: string
 *   }
 * }
 */
export async function GET(request, { params }) {
  const { slug } = params;
  
  if (!slug) {
    return NextResponse.json(
      { error: 'Car slug is required', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }
  
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json(
      { marketValue: null },
      { status: 200 }
    );
  }
  
  try {
    // Fetch market pricing data
    const { data, error } = await supabase
      .from('car_market_pricing')
      .select(`
        bat_avg_price,
        bat_median_price,
        carscom_avg_price,
        carscom_median_price,
        hagerty_concours,
        hagerty_excellent,
        hagerty_good,
        hagerty_fair,
        consensus_price,
        market_trend,
        data_quality,
        updated_at
      `)
      .eq('car_slug', slug)
      .maybeSingle();
    
    if (error) {
      console.error('[API/market-value] Error:', error);
      throw error;
    }
    
    // Transform to documented response shape
    const marketValue = data ? {
      avg_price: data.consensus_price,
      bat_avg: data.bat_avg_price,
      bat_median: data.bat_median_price,
      carscom_avg: data.carscom_avg_price,
      carscom_median: data.carscom_median_price,
      hagerty_concours: data.hagerty_concours,
      hagerty_excellent: data.hagerty_excellent,
      hagerty_good: data.hagerty_good,
      hagerty_fair: data.hagerty_fair,
      trend_direction: data.market_trend || 'stable',
      confidence: data.data_quality || 'low',
      updated_at: data.updated_at,
    } : null;
    
    return NextResponse.json({ marketValue });
  } catch (err) {
    console.error('[API/market-value] Error fetching market data:', err);
    return NextResponse.json(
      { error: 'Failed to fetch market data', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}













