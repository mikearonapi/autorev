/**
 * Location Geocode API
 * 
 * Geocodes a location string (ZIP code, city/state, or address) to coordinates.
 * Uses Google Geocoding API with fallback to OpenStreetMap Nominatim.
 * 
 * POST /api/locations/geocode
 * Body: { location: "20175" } or { location: "Leesburg, VA" }
 * 
 * Returns: { lat, lng, formattedAddress } or { error }
 */

import { NextResponse } from 'next/server';

import { withErrorLogging } from '@/lib/serverErrorLogger';

// Google API key for server-side geocoding - prioritize GOOGLE_AI_API_KEY
const GOOGLE_API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// User agent for Nominatim fallback
const USER_AGENT = 'AutoRev/1.0 (https://autorev.app; contact@autorev.app)';

/**
 * Check if string is a valid US ZIP code
 */
function isZipCode(str) {
  return /^\d{5}(-\d{4})?$/.test(str?.trim() || '');
}

/**
 * Geocode using Google Geocoding API
 */
async function geocodeWithGoogle(location) {
  if (!GOOGLE_API_KEY) {
    return null;
  }
  
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', location);
    url.searchParams.set('key', GOOGLE_API_KEY);
    
    // Restrict to US for better results
    url.searchParams.set('components', 'country:US');
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error('[Geocode] Google API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === 'REQUEST_DENIED') {
      console.error('[Geocode] Google API request denied:', data.error_message);
      return null;
    }
    
    if (data.status !== 'OK' || !data.results?.length) {
      console.warn('[Geocode] No Google results for:', location);
      return null;
    }
    
    const result = data.results[0];
    
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
    };
  } catch (err) {
    console.error('[Geocode] Google geocoding error:', err);
    return null;
  }
}

/**
 * Geocode using OpenStreetMap Nominatim (fallback)
 */
async function geocodeWithNominatim(location) {
  try {
    const queryParams = new URLSearchParams({
      format: 'json',
      limit: '1',
      countrycodes: 'us',
    });
    
    // If it's a ZIP code, use postalcode parameter
    if (isZipCode(location)) {
      queryParams.set('postalcode', location.trim().substring(0, 5));
    } else {
      queryParams.set('q', location);
    }
    
    const url = `https://nominatim.openstreetmap.org/search?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('[Geocode] Nominatim error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.warn('[Geocode] No Nominatim results for:', location);
      return null;
    }
    
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      formattedAddress: data[0].display_name,
    };
  } catch (err) {
    console.error('[Geocode] Nominatim error:', err);
    return null;
  }
}

async function handlePost(request) {
  try {
    const body = await request.json();
    const { location } = body;
    
    if (!location || typeof location !== 'string' || location.trim().length < 2) {
      return NextResponse.json(
        { error: 'Please provide a valid location (ZIP code, city, or address)' },
        { status: 400 }
      );
    }
    
    const trimmedLocation = location.trim();
    
    // Try Google first (if key is available), then fall back to Nominatim
    let result = await geocodeWithGoogle(trimmedLocation);
    
    if (!result) {
      console.info('[Geocode] Falling back to Nominatim for:', trimmedLocation);
      result = await geocodeWithNominatim(trimmedLocation);
    }
    
    if (!result) {
      return NextResponse.json(
        { error: 'Unable to find that location. Please try a different search.' },
        { status: 404 }
      );
    }
    
    // Validate coordinates
    if (isNaN(result.lat) || isNaN(result.lng)) {
      return NextResponse.json(
        { error: 'Invalid coordinates returned' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result);
    
  } catch (err) {
    console.error('[Geocode] Handler error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const POST = withErrorLogging(handlePost, { 
  route: 'locations/geocode', 
  feature: 'garage' 
});
