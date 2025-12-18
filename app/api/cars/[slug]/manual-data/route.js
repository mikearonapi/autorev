/**
 * Manual Data Entry API
 * 
 * GET /api/cars/[slug]/manual-data
 * POST /api/cars/[slug]/manual-data
 * 
 * For entering data that cannot be scraped (locked sites, paywalls, etc.)
 * 
 * @module app/api/cars/[slug]/manual-data
 */

import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import * as enrichedDataService from '@/lib/enrichedDataService';

/**
 * GET /api/cars/[slug]/manual-data
 * Get manual data entries for a car
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
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get('type'); // Optional filter
    
    const manualData = await enrichedDataService.getManualData(slug, dataType);
    
    return NextResponse.json({
      success: true,
      slug,
      count: manualData.length,
      entries: manualData,
    });
  } catch (err) {
    console.error('[Manual Data API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch manual data', message: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cars/[slug]/manual-data
 * Add manual data entry
 * 
 * Body:
 * {
 *   dataType: 'pricing' | 'review' | 'safety' | 'specs',
 *   source: 'Consumer Reports' | 'KBB' | etc.,
 *   sourceUrl: 'https://...',
 *   data: { ... specific data fields ... },
 *   notes: 'Optional notes',
 *   enteredBy: 'user@example.com'
 * }
 */
export async function POST(request, { params }) {
  const { slug } = params;
  
  if (!slug) {
    return NextResponse.json(
      { error: 'Slug is required' },
      { status: 400 }
    );
  }
  
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    );
  }
  
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.dataType) {
      return NextResponse.json(
        { error: 'dataType is required (pricing, review, safety, specs)' },
        { status: 400 }
      );
    }
    
    if (!body.data || Object.keys(body.data).length === 0) {
      return NextResponse.json(
        { error: 'data object is required and must not be empty' },
        { status: 400 }
      );
    }
    
    // Verify car exists
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('slug')
      .eq('slug', slug)
      .single();
    
    if (carError || !car) {
      return NextResponse.json(
        { error: 'Car not found', slug },
        { status: 404 }
      );
    }
    
    // Save the manual entry
    const result = await enrichedDataService.saveManualData(
      slug,
      body.dataType,
      body.data,
      {
        source: body.source,
        sourceUrl: body.sourceUrl,
        notes: body.notes,
        enteredBy: body.enteredBy,
      }
    );
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    // If pricing data, also update the market pricing aggregate
    if (body.dataType === 'pricing' && body.data.price) {
      await updatePricingFromManualEntry(slug, body);
    }
    
    return NextResponse.json({
      success: true,
      slug,
      entry: result.data,
    });
  } catch (err) {
    console.error('[Manual Data API] Error:', err);
    return NextResponse.json(
      { error: 'Failed to save manual data', message: err.message },
      { status: 500 }
    );
  }
}

/**
 * Update pricing aggregate from manual entry
 */
async function updatePricingFromManualEntry(slug, entry) {
  // Get existing pricing data
  const existing = await enrichedDataService.getMarketPricing(slug);
  
  // Add the manual price to consensus calculation
  // This is a simplified approach - in production you might want
  // more sophisticated handling
  
  if (entry.data.price && entry.source) {
    // Save to price history
    await supabase
      .from('car_price_history')
      .upsert({
        car_slug: slug,
        source: `manual_${entry.source.toLowerCase().replace(/\s+/g, '_')}`,
        price: entry.data.price,
        recorded_at: new Date().toISOString().split('T')[0],
      }, { onConflict: 'car_slug,source,recorded_at' });
  }
}

/**
 * Data templates for different types
 * Returned when client needs to know what fields to collect
 */
const DATA_TEMPLATES = {
  pricing: {
    price: 'number - Estimated market value',
    condition: 'string - excellent, good, fair, poor',
    mileage: 'number - Typical mileage for this price',
    year: 'number - Model year if specific',
    notes: 'string - Any relevant notes about pricing',
  },
  review: {
    rating: 'number - Overall rating (1-10)',
    pros: 'array - List of positive points',
    cons: 'array - List of negative points',
    verdict: 'string - Summary/verdict text',
    testData: {
      zeroToSixty: 'number - 0-60 time in seconds',
      quarterMile: 'number - Quarter mile time in seconds',
      skidpad: 'number - Lateral G',
    },
  },
  safety: {
    reliabilityScore: 'number - 1-5 or 1-10',
    commonIssues: 'array - Known problems',
    maintenanceCost: 'string - low, average, high',
    repairFrequency: 'string - rare, occasional, frequent',
  },
  specs: {
    hp: 'number - Horsepower',
    torque: 'number - Torque (lb-ft)',
    weight: 'number - Curb weight (lbs)',
    fuelCapacity: 'number - Fuel tank (gallons)',
    cargoSpace: 'number - Cargo volume (cu ft)',
  },
};





