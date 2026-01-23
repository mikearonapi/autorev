/**
 * Service Centers Search API
 * 
 * Searches for nearby automotive service centers using Google Places API.
 * Results are cached to reduce API costs.
 * 
 * POST /api/service-centers/search
 * Body: { lat, lng, radius (optional, miles) }
 * 
 * Returns: { shops: [...], source: 'cache' | 'google' }
 */

import { NextResponse } from 'next/server';
import { searchNearbyShops } from '@/lib/serviceCenterService';
import { withErrorLogging } from '@/lib/serverErrorLogger';

async function handlePost(request) {
  try {
    const body = await request.json();
    const { lat, lng, radius = 25, carMake, includeReviews = false } = body;
    
    // Validate input
    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Missing required fields: lat, lng' },
        { status: 400 }
      );
    }
    
    // Validate coordinates are numbers
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid coordinates: lat and lng must be numbers' },
        { status: 400 }
      );
    }
    
    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Coordinates out of range' },
        { status: 400 }
      );
    }
    
    // Sanitize radius
    const safeRadius = Math.min(Math.max(radius, 1), 50); // 1-50 miles
    
    console.log('[service-centers/search] Searching:', { 
      lat: latitude, 
      lng: longitude, 
      radius: safeRadius,
      carMake: carMake || 'none'
    });
    
    // Search for shops
    const shops = await searchNearbyShops(latitude, longitude, safeRadius, { carMake });
    
    console.log('[service-centers/search] Found shops:', shops.length);
    
    return NextResponse.json({
      shops,
      count: shops.length,
      radius: safeRadius,
      center: { lat: latitude, lng: longitude },
    });
    
  } catch (err) {
    console.error('[service-centers/search] Handler error:', err);
    return NextResponse.json(
      { error: 'Internal server error', shops: [] },
      { status: 500 }
    );
  }
}

export const POST = withErrorLogging(handlePost, { 
  route: 'service-centers/search', 
  feature: 'garage' 
});

// Allow preflight for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
