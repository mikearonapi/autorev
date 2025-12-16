import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * GET /api/cars/[slug]/market-value
 * 
 * Fetches market pricing data for a specific car.
 * Includes data from BaT, Cars.com, and Hagerty.
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
      { pricing: null, message: 'Database not configured' },
      { status: 200 }
    );
  }
  
  try {
    // Fetch market pricing data
    const { data, error } = await supabase
      .from('car_market_pricing')
      .select('*')
      .eq('car_slug', slug)
      .maybeSingle();
    
    if (error) {
      console.error('[API/market-value] Error:', error);
      throw error;
    }
    
    return NextResponse.json({ 
      pricing: data,
      updatedAt: data?.updated_at || null,
    });
  } catch (err) {
    console.error('[API/market-value] Error fetching market data:', err);
    return NextResponse.json(
      { error: 'Failed to fetch market data', details: err.message },
      { status: 500 }
    );
  }
}


