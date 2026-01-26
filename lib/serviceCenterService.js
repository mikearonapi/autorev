/**
 * Service Center Service
 * 
 * Finds automotive service centers using Google Places API.
 * Caches results to reduce API costs.
 * 
 * @module lib/serviceCenterService
 */

import { calculateDistanceMiles } from './geocodingService.js';
import { supabase, isSupabaseConfigured } from './supabase.js';

// Google API key for Places API - prioritize GOOGLE_AI_API_KEY (the one with Places API enabled)
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY;

// Debug: Log which key source is being used
console.log('[serviceCenterService] API key sources:', {
  GOOGLE_AI_API_KEY: !!process.env.GOOGLE_AI_API_KEY,
  GOOGLE_API_KEY: !!process.env.GOOGLE_API_KEY,
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  usingKey: process.env.GOOGLE_AI_API_KEY ? 'GOOGLE_AI_API_KEY' : 
            process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : 
            process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY' : 'none'
});

// Cache TTL: 7 days
const CACHE_TTL_DAYS = 7;

// Default search radius in meters (25 miles = ~40km)
const DEFAULT_RADIUS_METERS = 40000;

// Place types relevant to automotive modification/performance
// NOTE: car_dealer excluded - they don't typically do modifications
const AUTOMOTIVE_TYPES = [
  'car_repair',
];

// Keywords for finding performance/modification shops
const PERFORMANCE_KEYWORDS = [
  'performance tuning shop',
  'custom exhaust muffler',
  'turbo kit installation',
  'forced induction turbo',
  'speed shop racing',
  'dyno tuning',
  'aftermarket auto parts install',
];

// Dealership chains to filter out (they don't do mods)
const EXCLUDED_CHAINS = [
  'autonation',
  'carmax',
  'carvana',
  'enterprise',
  'hertz',
  'avis',
  'budget',
  'pep boys',
  'jiffy lube',
  'valvoline',
  'take 5',
  'grease monkey',
  'firestone',
  'goodyear',
  'discount tire',
  'ntb ',
  'midas',
  'meineke',
  'maaco',
  'safelite',
  // EV charging stations (not automotive service centers)
  'tesla supercharger',
  'supercharger station',
  'charging station',
  'ev charging',
  'electric vehicle charging',
  'chargepoint',
  'electrify america',
  'evgo',
  'blink charging',
];

// Keywords that indicate a shop does performance/modifications
const PERFORMANCE_INDICATORS = [
  'performance',
  'tuning',
  'racing',
  'custom',
  'speed',
  'motorsport',
  'dyno',
  'turbo',
  'exhaust',
  'suspension',
  'fabrication',
  'fab',
  'imports',
  'euro',
  'jdm',
  'muscle',
  'hot rod',
  'forced induction',
  'boost',
  'ecu',
  'chip',
  'tune',
];

/**
 * Search for nearby automotive service centers
 * 
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radiusMiles - Search radius in miles (default: 25)
 * @param {Object} options - Additional options
 * @param {string} options.carMake - User's car make (for boosting relevant shops)
 * @returns {Promise<Array>} - Array of shop objects
 */
export async function searchNearbyShops(lat, lng, radiusMiles = 25, options = {}) {
  const { carMake } = options;
  
  if (!lat || !lng) {
    console.error('[serviceCenterService] Missing coordinates');
    return [];
  }
  
  const radiusMeters = Math.min(radiusMiles * 1609.34, 50000); // Max 50km for Google API
  
  // 1. Check cache first
  const cachedShops = await getCachedShops(lat, lng, radiusMiles);
  if (cachedShops.length > 0) {
    console.log('[serviceCenterService] Using cached results');
    const boosted = boostByCarMake(cachedShops, carMake);
    return sortByRelevanceAndDistance(boosted, lat, lng);
  }
  
  // 2. Search Google Places API
  const shops = await searchGooglePlaces(lat, lng, radiusMeters, carMake);
  
  // 3. Cache results
  if (shops.length > 0) {
    await cacheShops(lat, lng, shops);
  }
  
  // 4. Boost shops that match user's car make
  const boosted = boostByCarMake(shops, carMake);
  
  return sortByRelevanceAndDistance(boosted, lat, lng);
}

/**
 * Boost relevance score for shops that specialize in user's car make
 */
function boostByCarMake(shops, carMake) {
  if (!carMake) return shops;
  
  const makeLower = carMake.toLowerCase();
  
  // Common make-related keywords
  const makeKeywords = {
    'bmw': ['bmw', 'bimmer', 'bavarian'],
    'mercedes': ['mercedes', 'benz', 'mb'],
    'audi': ['audi', 'vw', 'volkswagen', 'vag', 'german'],
    'porsche': ['porsche'],
    'volkswagen': ['vw', 'volkswagen', 'vag', 'german'],
    'honda': ['honda', 'acura', 'japanese', 'jdm'],
    'toyota': ['toyota', 'lexus', 'japanese', 'jdm'],
    'nissan': ['nissan', 'infiniti', 'japanese', 'jdm', 'datsun'],
    'subaru': ['subaru', 'subie', 'japanese', 'jdm'],
    'mazda': ['mazda', 'miata', 'japanese', 'jdm'],
    'mitsubishi': ['mitsubishi', 'evo', 'japanese', 'jdm'],
    'ford': ['ford', 'mustang', 'american', 'domestic'],
    'chevrolet': ['chevy', 'chevrolet', 'gm', 'american', 'domestic'],
    'dodge': ['dodge', 'mopar', 'chrysler', 'american', 'domestic'],
  };
  
  const relevantKeywords = makeKeywords[makeLower] || [makeLower];
  
  return shops.map(shop => {
    const nameLower = shop.name?.toLowerCase() || '';
    let boost = 0;
    
    // Check if shop name contains relevant make keywords
    for (const keyword of relevantKeywords) {
      if (nameLower.includes(keyword)) {
        boost += 15; // Significant boost for make match
        break;
      }
    }
    
    return {
      ...shop,
      relevance_score: (shop.relevance_score || 0) + boost,
      matchesCarMake: boost > 0,
    };
  });
}

/**
 * Check cache for recent results
 */
async function getCachedShops(lat, lng, radiusMiles) {
  if (!isSupabaseConfigured) return [];
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CACHE_TTL_DAYS);
    
    // Query with a bbox approximation (rough filter)
    // 1 degree latitude ≈ 69 miles
    // 1 degree longitude ≈ 55 miles at mid-latitudes
    const latRange = radiusMiles / 69;
    const lngRange = radiusMiles / 55;
    
    const CENTER_COLS = 'id, place_id, name, address, lat, lng, rating, review_count, phone, website, hours, types, price_level, cached_at, created_at';
    
    const { data, error } = await supabase
      .from('service_center_cache')
      .select(CENTER_COLS)
      .gte('lat', lat - latRange)
      .lte('lat', lat + latRange)
      .gte('lng', lng - lngRange)
      .lte('lng', lng + lngRange)
      .gte('cached_at', cutoffDate.toISOString())
      .limit(50);
    
    if (error) {
      if (error.code === '42P01') {
        console.warn('[serviceCenterService] service_center_cache table not found');
        return [];
      }
      console.error('[serviceCenterService] Cache query error:', error);
      return [];
    }
    
    // Filter to actual radius
    const shops = (data || []).filter(shop => {
      const dist = calculateDistanceMiles(lat, lng, shop.lat, shop.lng);
      return dist <= radiusMiles;
    });
    
    return shops.map(normalizeShop);
  } catch (err) {
    console.error('[serviceCenterService] Cache error:', err);
    return [];
  }
}

/**
 * Check if a shop name matches excluded chains
 */
function isExcludedChain(shopName) {
  const nameLower = shopName.toLowerCase();
  return EXCLUDED_CHAINS.some(chain => nameLower.includes(chain));
}

/**
 * Calculate a relevance score for a shop based on name
 * Higher score = more likely to be a performance/mod shop
 */
function calculateRelevanceScore(shopName) {
  const nameLower = shopName.toLowerCase();
  let score = 0;
  
  for (const indicator of PERFORMANCE_INDICATORS) {
    if (nameLower.includes(indicator)) {
      score += 10;
    }
  }
  
  // Bonus for shops that explicitly mention key services
  if (nameLower.includes('performance')) score += 5;
  if (nameLower.includes('tuning')) score += 5;
  if (nameLower.includes('racing')) score += 5;
  if (nameLower.includes('custom')) score += 3;
  
  // Slight bonus for independent shops (no chain indicators)
  if (!nameLower.includes('auto zone') && 
      !nameLower.includes('o\'reilly') && 
      !nameLower.includes('advance auto')) {
    score += 2;
  }
  
  return score;
}

/**
 * Search Google Places API with performance-focused keywords
 */
async function searchGooglePlaces(lat, lng, radiusMeters, carMake = null) {
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('[serviceCenterService] Google Places API key not configured');
    return [];
  }
  
  console.log('[serviceCenterService] searchGooglePlaces called:', { lat, lng, radiusMeters });
  
  const allShops = [];
  const seenPlaceIds = new Set();
  
  // Helper to add places from API response
  const addPlaces = (results, source) => {
    let added = 0;
    for (const place of (results || [])) {
      if (seenPlaceIds.has(place.place_id)) continue;
      
      // Filter out excluded chains
      if (isExcludedChain(place.name)) {
        console.log(`[serviceCenterService] Excluded: ${place.name}`);
        continue;
      }
      
      seenPlaceIds.add(place.place_id);
      
      const shop = {
        place_id: place.place_id,
        name: place.name,
        address: place.vicinity || place.formatted_address,
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng,
        rating: place.rating,
        review_count: place.user_ratings_total,
        types: place.types,
        is_open: place.opening_hours?.open_now,
        photo_reference: place.photos?.[0]?.photo_reference,
        relevance_score: calculateRelevanceScore(place.name),
        source: source,
      };
      
      allShops.push(shop);
      added++;
    }
    return added;
  };
  
  // 1. Search with performance-focused keywords (prioritized)
  for (const keyword of PERFORMANCE_KEYWORDS) {
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
      url.searchParams.set('location', `${lat},${lng}`);
      url.searchParams.set('radius', String(radiusMeters));
      url.searchParams.set('keyword', keyword);
      url.searchParams.set('key', GOOGLE_PLACES_API_KEY);
      
      const response = await fetch(url.toString());
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          const added = addPlaces(data.results, `keyword:${keyword}`);
          console.log(`[serviceCenterService] Keyword "${keyword}": ${added} shops added`);
        }
      }
    } catch (err) {
      console.error(`[serviceCenterService] Keyword search error (${keyword}):`, err.message);
    }
  }
  
  // 2. Also search car_repair type for broader coverage
  for (const type of AUTOMOTIVE_TYPES) {
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
      url.searchParams.set('location', `${lat},${lng}`);
      url.searchParams.set('radius', String(radiusMeters));
      url.searchParams.set('type', type);
      url.searchParams.set('key', GOOGLE_PLACES_API_KEY);
      
      const response = await fetch(url.toString());
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          const added = addPlaces(data.results, `type:${type}`);
          console.log(`[serviceCenterService] Type "${type}": ${added} shops added`);
        }
      }
    } catch (err) {
      console.error(`[serviceCenterService] Type search error (${type}):`, err.message);
    }
  }
  
  // 3. If user has a specific car make, search for make-specific shops
  if (carMake) {
    const makeKeyword = `${carMake} performance repair specialist`;
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
      url.searchParams.set('location', `${lat},${lng}`);
      url.searchParams.set('radius', String(radiusMeters));
      url.searchParams.set('keyword', makeKeyword);
      url.searchParams.set('key', GOOGLE_PLACES_API_KEY);
      
      const response = await fetch(url.toString());
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK') {
          const added = addPlaces(data.results, `make:${carMake}`);
          console.log(`[serviceCenterService] Make "${carMake}": ${added} shops added`);
        }
      }
    } catch (err) {
      console.error(`[serviceCenterService] Make search error (${carMake}):`, err.message);
    }
  }
  
  console.log(`[serviceCenterService] Total unique shops found: ${allShops.length}`);
  
  return allShops;
}

/**
 * Cache shop results
 */
async function cacheShops(searchLat, searchLng, shops) {
  if (!isSupabaseConfigured || shops.length === 0) return;
  
  try {
    const records = shops.map(shop => ({
      place_id: shop.place_id,
      name: shop.name,
      address: shop.address,
      lat: shop.lat,
      lng: shop.lng,
      rating: shop.rating,
      review_count: shop.review_count,
      types: shop.types,
      search_lat: searchLat,
      search_lng: searchLng,
      cached_at: new Date().toISOString(),
    }));
    
    const { error } = await supabase
      .from('service_center_cache')
      .upsert(records, { 
        onConflict: 'place_id',
        ignoreDuplicates: false 
      });
    
    if (error && error.code !== '42P01') {
      console.error('[serviceCenterService] Cache save error:', error);
    }
  } catch (err) {
    console.error('[serviceCenterService] cacheShops error:', err);
  }
}

/**
 * Sort shops by relevance score first, then distance
 * Performance/tuning shops appear before generic repair shops
 */
function sortByRelevanceAndDistance(shops, userLat, userLng) {
  return [...shops].sort((a, b) => {
    const scoreA = a.relevance_score || 0;
    const scoreB = b.relevance_score || 0;
    
    // If scores differ significantly (by 5+), prioritize by score
    if (Math.abs(scoreA - scoreB) >= 5) {
      return scoreB - scoreA; // Higher score first
    }
    
    // Otherwise sort by distance
    const distA = calculateDistanceMiles(userLat, userLng, a.lat, a.lng);
    const distB = calculateDistanceMiles(userLat, userLng, b.lat, b.lng);
    return distA - distB;
  });
}

/**
 * Normalize shop object
 */
function normalizeShop(shop) {
  return {
    place_id: shop.place_id,
    name: shop.name,
    address: shop.address,
    lat: shop.lat,
    lng: shop.lng,
    rating: shop.rating,
    review_count: shop.review_count,
    types: shop.types || [],
    is_open: shop.is_open,
  };
}

/**
 * Get place details (phone, hours, etc.)
 */
export async function getPlaceDetails(placeId) {
  if (!GOOGLE_PLACES_API_KEY || !placeId) {
    return null;
  }
  
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', 'formatted_phone_number,opening_hours,website,url');
    url.searchParams.set('key', GOOGLE_PLACES_API_KEY);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error('[serviceCenterService] Place details error:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      return null;
    }
    
    return {
      phone: data.result?.formatted_phone_number,
      website: data.result?.website,
      mapsUrl: data.result?.url,
      hours: data.result?.opening_hours?.weekday_text,
      isOpen: data.result?.opening_hours?.open_now,
    };
  } catch (err) {
    console.error('[serviceCenterService] getPlaceDetails error:', err);
    return null;
  }
}

export default {
  searchNearbyShops,
  getPlaceDetails,
};
