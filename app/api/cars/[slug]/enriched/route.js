/**
 * Enriched Car Data API Route
 * 
 * GET /api/cars/[slug]/enriched
 * 
 * Fetches comprehensive data from all external sources for a car.
 * 
 * Query Parameters:
 * - sources: Comma-separated list of sources (epa,nhtsa,iihs,bat,hagerty,carscom,cad,motortrend)
 * - fast: If "true", only fetch free API data (EPA, NHTSA)
 * - pricing: If "true", only fetch pricing data
 * - safety: If "true", only fetch safety data
 * - reviews: If "true", only fetch review data
 * 
 * @module app/api/cars/[slug]/enriched
 */

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { carData } from '@/data/cars';
import * as dataAggregator from '@/lib/dataAggregator';

/**
 * GET /api/cars/[slug]/enriched
 * Fetch enriched data for a car from all external sources
 */
export async function GET(request, { params }) {
  const { slug } = params;
  
  if (!slug) {
    return NextResponse.json(
      { error: 'Slug is required' },
      { status: 400 }
    );
  }
  
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const sourcesParam = searchParams.get('sources');
    const fast = searchParams.get('fast') === 'true';
    const pricingOnly = searchParams.get('pricing') === 'true';
    const safetyOnly = searchParams.get('safety') === 'true';
    const reviewsOnly = searchParams.get('reviews') === 'true';
    
    // Find the car in our database
    let car = carData.find(c => c.slug === slug);
    
    // Try Supabase for more complete data
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (!error && data) {
          car = { ...car, ...data };
        }
      } catch (err) {
        console.warn('[Enriched API] Supabase fetch failed:', err.message);
      }
    }
    
    if (!car) {
      return NextResponse.json(
        { error: 'Car not found', slug },
        { status: 404 }
      );
    }
    
    // Determine which aggregation function to use
    let enrichedData;
    
    if (fast) {
      // Only free APIs - fast and reliable
      enrichedData = await dataAggregator.fetchFreeApiData(car);
    } else if (pricingOnly) {
      // Only pricing sources
      enrichedData = await dataAggregator.fetchPricingData(car);
    } else if (safetyOnly) {
      // Only safety data
      enrichedData = await dataAggregator.fetchSafetyData(car);
    } else if (reviewsOnly) {
      // Only expert reviews
      enrichedData = await dataAggregator.fetchReviewData(car);
    } else {
      // Full aggregation with optional source filtering
      const options = {};
      
      if (sourcesParam) {
        options.sources = sourcesParam.split(',').map(s => s.trim());
      }
      
      enrichedData = await dataAggregator.aggregateCarData(car, options);
    }
    
    // Add data quality assessment
    const quality = dataAggregator.assessDataQuality(enrichedData);
    
    return NextResponse.json({
      success: true,
      slug,
      data: enrichedData,
      quality,
    });
  } catch (err) {
    console.error('[Enriched API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch enriched data', message: err.message },
      { status: 500 }
    );
  }
}
