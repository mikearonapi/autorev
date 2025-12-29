/**
 * Location Search API
 * 
 * Provides location autocomplete suggestions using OpenStreetMap Nominatim.
 * Used as fallback when Google Places API is not available.
 * 
 * GET /api/locations/search?q=leesburg&limit=5
 */

import { NextResponse } from 'next/server';

// US State name to abbreviation mapping
const STATE_ABBREVIATIONS = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC',
  'puerto rico': 'PR', 'guam': 'GU', 'virgin islands': 'VI',
};

// Reverse mapping for validation
const VALID_STATE_ABBREVS = new Set(Object.values(STATE_ABBREVIATIONS));

// User agent for Nominatim (required by ToS)
const USER_AGENT = 'AutoRev/1.0 (https://autorev.app; contact@autorev.app)';

// Rate limiting - simple in-memory tracker
let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1100; // Nominatim requires 1 request/second max

/**
 * Extract state abbreviation from Nominatim address parts
 */
function extractStateAbbrev(addressParts) {
  if (!addressParts) return null;
  
  // Nominatim returns state in address.state field
  const stateName = addressParts.state?.toLowerCase();
  if (stateName && STATE_ABBREVIATIONS[stateName]) {
    return STATE_ABBREVIATIONS[stateName];
  }
  
  // Check if already an abbreviation
  const stateValue = addressParts.state?.toUpperCase();
  if (stateValue && VALID_STATE_ABBREVS.has(stateValue)) {
    return stateValue;
  }
  
  return null;
}

/**
 * Parse display name to extract city and state
 */
function parseDisplayName(displayName, addressParts) {
  const stateAbbrev = extractStateAbbrev(addressParts);
  
  // City is typically in addressParts.city, addressParts.town, or addressParts.village
  const city = addressParts?.city || addressParts?.town || addressParts?.village || 
               addressParts?.hamlet || addressParts?.municipality || null;
  
  return { city, stateAbbrev };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '5', 10), 10);
  
  if (!query || query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }
  
  // Rate limiting check
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < MIN_INTERVAL_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL_MS - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
  
  try {
    // Build Nominatim search query
    const nominatimParams = new URLSearchParams({
      format: 'json',
      countrycodes: 'us',
      limit: String(limit),
      addressdetails: '1', // Include address breakdown
      q: query,
      // Prioritize populated places (cities/towns)
      featuretype: 'city',
    });
    
    const url = `https://nominatim.openstreetmap.org/search?${nominatimParams.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('[LocationSearch] Nominatim error:', response.status);
      return NextResponse.json({ suggestions: [], error: 'Search service unavailable' }, { status: 503 });
    }
    
    const data = await response.json();
    
    // If no results with featuretype=city, try without the restriction
    if (!data || data.length === 0) {
      const fallbackParams = new URLSearchParams({
        format: 'json',
        countrycodes: 'us',
        limit: String(limit),
        addressdetails: '1',
        q: query,
      });
      
      const fallbackUrl = `https://nominatim.openstreetmap.org/search?${fallbackParams.toString()}`;
      
      // Need to respect rate limit again
      await new Promise(resolve => setTimeout(resolve, MIN_INTERVAL_MS));
      lastRequestTime = Date.now();
      
      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
        },
      });
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        if (fallbackData && fallbackData.length > 0) {
          return formatSuggestions(fallbackData);
        }
      }
      
      return NextResponse.json({ suggestions: [] });
    }
    
    return formatSuggestions(data);
    
  } catch (err) {
    console.error('[LocationSearch] Error:', err);
    return NextResponse.json({ suggestions: [], error: 'Search failed' }, { status: 500 });
  }
}

function formatSuggestions(data) {
  // Dedupe by city + state combination
  const seen = new Set();
  
  const suggestions = data
    .map(place => {
      const { city, stateAbbrev } = parseDisplayName(place.display_name, place.address);
      
      if (!city || !stateAbbrev) return null;
      
      const key = `${city.toLowerCase()}-${stateAbbrev}`;
      if (seen.has(key)) return null;
      seen.add(key);
      
      // County info for disambiguation
      const county = place.address?.county?.replace(' County', '') || null;
      
      return {
        placeId: `nominatim-${place.place_id}`,
        city: city,
        state: stateAbbrev,
        displayName: `${city}, ${stateAbbrev}`,
        county: county,
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
      };
    })
    .filter(Boolean);
  
  return NextResponse.json({ suggestions });
}

