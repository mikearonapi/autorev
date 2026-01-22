import { NextResponse } from 'next/server';
import { errors } from '@/lib/apiErrors';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { resolveCarId } from '@/lib/carResolver';

/**
 * GET /api/cars/[slug]/enriched
 * 
 * Bundles all enriched data for a car into a single request.
 * This reduces network round trips from 4+ to 1.
 * 
 * Returns:
 * - efficiency: Fuel economy data
 * - safety: NHTSA/IIHS ratings
 * - priceByYear: Price history by model year
 * - popularParts: Top parts with fitment
 * 
 * Cache: 1 hour, stale-while-revalidate for 2 hours
 * 
 * Updated 2026-01-11: Uses car_id for all queries (car_slug columns removed from most tables)
 */
async function handleGet(request, { params }) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Car slug is required' },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        efficiency: null,
        safety: null,
        priceByYear: null,
        popularParts: [],
        message: 'Database not configured',
      });
    }

    // Resolve car_id once for efficient queries
    // NOTE: All these tables use car_id ONLY (car_slug columns were removed)
    const carId = await resolveCarId(slug);
    
    if (!carId) {
      return NextResponse.json({
        efficiency: null,
        safety: null,
        priceByYear: null,
        popularParts: [],
        message: 'Car not found',
      });
    }

    // Fetch all enriched data in parallel using car_id
    const [
      efficiencyResult,
      safetyResult,
      priceByYearResult,
      partsResult,
    ] = await Promise.all([
      // Fuel economy (uses car_id)
      supabase
        .from('car_fuel_economy')
        .select('*')
        .eq('car_id', carId)
        .single(),
      
      // Safety ratings (uses car_id)
      supabase
        .from('car_safety_data')
        .select('*')
        .eq('car_id', carId)
        .single(),
      
      // Price by year (uses car_id)
      supabase
        .from('car_market_pricing_years')
        .select('*')
        .eq('car_id', carId)
        .order('year', { ascending: false }),
      
      // Popular parts with fitment (uses car_id)
      supabase
        .from('parts')
        .select(`
          id,
          name,
          brand_name,
          part_number,
          category,
          part_fitments!inner (
            car_id,
            confidence,
            verified,
            requires_tune,
            install_difficulty,
            fitment_notes
          ),
          part_prices (
            price_cents,
            product_url,
            fetched_at
          )
        `)
        .eq('part_fitments.car_id', carId)
        .order('name')
        .limit(8),
    ]);

    // Process efficiency data
    const efficiency = efficiencyResult.error ? null : efficiencyResult.data;

    // Process safety data
    const safety = safetyResult.error ? null : safetyResult.data;

    // Process price by year data
    let priceByYear = null;
    if (!priceByYearResult.error && priceByYearResult.data?.length > 0) {
      const prices = priceByYearResult.data;
      
      // Calculate best value year (lowest price per year with reasonable sample)
      let bestValueYear = null;
      let bestValuePrice = Infinity;
      
      for (const row of prices) {
        if (row.sample_size >= 3 && row.avg_price < bestValuePrice) {
          bestValuePrice = row.avg_price;
          bestValueYear = row.model_year;
        }
      }
      
      priceByYear = {
        pricesByYear: prices,
        bestValueYear,
        bestValuePrice: bestValueYear ? bestValuePrice : null,
      };
    }

    // Process parts data
    let popularParts = [];
    if (!partsResult.error && partsResult.data?.length > 0) {
      popularParts = partsResult.data.map(part => {
        // Get latest price
        const latestPrice = part.part_prices?.sort(
          (a, b) => new Date(b.fetched_at) - new Date(a.fetched_at)
        )[0] || null;
        
        // Get fitment info
        const fitment = part.part_fitments?.[0] || null;
        
        return {
          id: part.id,
          name: part.name,
          brand_name: part.brand_name,
          part_number: part.part_number,
          category: part.category,
          latest_price: latestPrice,
          fitment: fitment ? {
            confidence: fitment.confidence,
            verified: fitment.verified,
            requires_tune: fitment.requires_tune,
            install_difficulty: fitment.install_difficulty,
            fitment_notes: fitment.fitment_notes,
          } : null,
        };
      });
    }

    const response = NextResponse.json({
      efficiency,
      safety,
      priceByYear,
      popularParts,
    });

    // Cache for 1 hour, allow stale responses for 2 more hours
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=7200'
    );

    return response;
  } catch (error) {
    console.error('[enriched] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enriched data' },
      { status: 500 }
    );
  }
}

export const GET = withErrorLogging(handleGet, { route: 'cars/[slug]/enriched', feature: 'browse-cars' });
