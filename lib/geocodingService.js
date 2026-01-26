/**
 * Geocoding Service
 * 
 * Provides geocoding functionality using OpenStreetMap Nominatim (free, no API key).
 * Includes in-memory caching and rate limiting to respect Nominatim usage policy.
 * 
 * Rate limit: 1 request per second
 * User-Agent required
 * 
 * @module lib/geocodingService
 */

import crypto from 'crypto';

import { supabase, supabaseServiceRole, isSupabaseConfigured } from './supabase.js';

// In-memory cache for geocode results
const geocodeCache = new Map();

// Rate limiting: track last request time
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL_MS = 1100; // Slightly over 1 second to be safe

// User agent for Nominatim (required by their ToS)
const USER_AGENT = 'AutoRev/1.0 (https://autorev.app; contact@autorev.app)';

/**
 * Create a hash of the address for cache key
 * @param {string} address - Full address string
 * @returns {string} - MD5 hash of normalized address
 */
function createAddressHash(address) {
  const normalized = address.toLowerCase().trim().replace(/\s+/g, ' ');
  return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * Build full address string from components
 * @param {Object} params
 * @returns {string}
 */
function buildAddressString(params) {
  const { address, city, state, zip, country = 'USA' } = params;
  const parts = [];
  
  if (address) parts.push(address);
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (zip) parts.push(zip);
  if (country) parts.push(country);
  
  return parts.join(', ');
}

/**
 * Wait for rate limit
 * @returns {Promise<void>}
 */
async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL_MS) {
    const waitTime = MIN_REQUEST_INTERVAL_MS - timeSinceLastRequest;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Check in-memory cache first
 * @param {string} addressHash
 * @returns {Object|null}
 */
function checkMemoryCache(addressHash) {
  if (geocodeCache.has(addressHash)) {
    const cached = geocodeCache.get(addressHash);
    // Check if cache entry is less than 24 hours old
    if (Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return cached.result;
    }
    geocodeCache.delete(addressHash);
  }
  return null;
}

/**
 * Check database cache (optional, if table exists)
 * @param {string} addressHash
 * @returns {Promise<Object|null>}
 */
async function checkDbCache(addressHash) {
  if (!isSupabaseConfigured) return null;
  
  try {
    const client = supabaseServiceRole || supabase;
    const { data, error } = await client
      .from('geocode_cache')
      .select('latitude, longitude')
      .eq('address_hash', addressHash)
      .single();
    
    if (error || !data) return null;
    
    return {
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
    };
  } catch (err) {
    // Table might not exist yet, silently ignore
    return null;
  }
}

/**
 * Save to caches
 * @param {string} addressHash
 * @param {Object} result
 * @param {string} addressString - For debugging/logging
 */
async function saveToCache(addressHash, result, addressString) {
  // Save to memory cache
  geocodeCache.set(addressHash, {
    result,
    timestamp: Date.now(),
  });
  
  // Save to database cache (optional)
  if (isSupabaseConfigured && result) {
    try {
      const client = supabaseServiceRole || supabase;
      await client
        .from('geocode_cache')
        .upsert({
          address_hash: addressHash,
          latitude: result.latitude,
          longitude: result.longitude,
          address_string: addressString.substring(0, 500),
          created_at: new Date().toISOString(),
        }, { onConflict: 'address_hash' });
    } catch (err) {
      // Silently ignore - table might not exist
      console.debug('[Geocoding] Could not save to DB cache:', err.message);
    }
  }
}

/**
 * Geocode an address using OpenStreetMap Nominatim
 * 
 * @param {Object} params
 * @param {string} [params.address] - Street address
 * @param {string} params.city - City name
 * @param {string} params.state - State code
 * @param {string} [params.zip] - ZIP code
 * @param {string} [params.country='USA'] - Country
 * @returns {Promise<{latitude: number, longitude: number}|null>}
 */
export async function geocodeAddress(params) {
  const { address, city, state, zip, country = 'USA' } = params;
  
  // Need at least city and state for US addresses
  if (!city || !state) {
    console.debug('[Geocoding] Missing city or state');
    return null;
  }
  
  const addressString = buildAddressString({ address, city, state, zip, country });
  const addressHash = createAddressHash(addressString);
  
  // Check memory cache first
  const memoryCached = checkMemoryCache(addressHash);
  if (memoryCached) {
    console.debug('[Geocoding] Memory cache hit:', addressString);
    return memoryCached;
  }
  
  // Check database cache
  const dbCached = await checkDbCache(addressHash);
  if (dbCached) {
    // Populate memory cache
    geocodeCache.set(addressHash, { result: dbCached, timestamp: Date.now() });
    console.debug('[Geocoding] DB cache hit:', addressString);
    return dbCached;
  }
  
  // Rate limit before making request
  await waitForRateLimit();
  
  try {
    // Build Nominatim query
    const queryParams = new URLSearchParams({
      format: 'json',
      limit: '1',
      countrycodes: country === 'USA' ? 'us' : country.toLowerCase(),
    });
    
    // For better results, use structured query when possible
    if (city && state) {
      queryParams.set('city', city);
      queryParams.set('state', state);
      if (zip) queryParams.set('postalcode', zip);
      if (address) queryParams.set('street', address);
    } else {
      queryParams.set('q', addressString);
    }
    
    const url = `https://nominatim.openstreetmap.org/search?${queryParams.toString()}`;
    
    console.debug('[Geocoding] Fetching:', addressString);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('[Geocoding] Nominatim error:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.debug('[Geocoding] No results for:', addressString);
      // Cache the null result to avoid repeated lookups
      await saveToCache(addressHash, null, addressString);
      return null;
    }
    
    const result = {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
    
    // Validate coordinates
    if (isNaN(result.latitude) || isNaN(result.longitude)) {
      console.error('[Geocoding] Invalid coordinates:', data[0]);
      return null;
    }
    
    console.debug('[Geocoding] Success:', addressString, '->', result);
    
    // Save to caches
    await saveToCache(addressHash, result, addressString);
    
    return result;
  } catch (err) {
    console.error('[Geocoding] Error:', err.message);
    return null;
  }
}

/**
 * Geocode an event (convenience wrapper)
 * 
 * @param {Object} event - Event object with location fields
 * @returns {Promise<{latitude: number, longitude: number}|null>}
 */
export async function geocodeEvent(event) {
  return geocodeAddress({
    address: event.address || event.venue_name,
    city: event.city,
    state: event.state,
    zip: event.zip,
    country: event.country || 'USA',
  });
}

/**
 * Geocode a ZIP code to get center point
 * Useful for radius search
 * 
 * @param {string} zip - 5-digit ZIP code
 * @returns {Promise<{latitude: number, longitude: number}|null>}
 */
export async function geocodeZip(zip) {
  if (!zip || !/^\d{5}$/.test(zip)) {
    console.debug('[Geocoding] Invalid ZIP:', zip);
    return null;
  }
  
  const addressHash = createAddressHash(`zip:${zip}:USA`);
  
  // Check memory cache first
  const memoryCached = checkMemoryCache(addressHash);
  if (memoryCached) {
    console.debug('[Geocoding] Memory cache hit for ZIP:', zip);
    return memoryCached;
  }
  
  // Check database cache
  const dbCached = await checkDbCache(addressHash);
  if (dbCached) {
    geocodeCache.set(addressHash, { result: dbCached, timestamp: Date.now() });
    console.debug('[Geocoding] DB cache hit for ZIP:', zip);
    return dbCached;
  }
  
  // Rate limit before making request
  await waitForRateLimit();
  
  try {
    // Query Nominatim with just postalcode for US ZIPs
    const queryParams = new URLSearchParams({
      format: 'json',
      limit: '1',
      countrycodes: 'us',
      postalcode: zip,
    });
    
    const url = `https://nominatim.openstreetmap.org/search?${queryParams.toString()}`;
    
    console.debug('[Geocoding] Fetching ZIP:', zip);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('[Geocoding] Nominatim error:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.debug('[Geocoding] No results for ZIP:', zip);
      await saveToCache(addressHash, null, `ZIP:${zip}`);
      return null;
    }
    
    const result = {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
    
    // Validate coordinates
    if (isNaN(result.latitude) || isNaN(result.longitude)) {
      console.error('[Geocoding] Invalid coordinates for ZIP:', data[0]);
      return null;
    }
    
    console.debug('[Geocoding] ZIP success:', zip, '->', result);
    
    // Save to caches
    await saveToCache(addressHash, result, `ZIP:${zip}`);
    
    return result;
  } catch (err) {
    console.error('[Geocoding] Error geocoding ZIP:', err.message);
    return null;
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * 
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in miles
 */
export function calculateDistanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number}
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Batch geocode multiple events with rate limiting
 * 
 * @param {Object[]} events - Array of event objects
 * @param {Object} options
 * @param {number} [options.batchSize=10] - Number of events per batch
 * @param {Function} [options.onProgress] - Progress callback
 * @returns {Promise<Object[]>} - Events with latitude/longitude added
 */
export async function batchGeocodeEvents(events, options = {}) {
  const { batchSize = 10, onProgress } = options;
  
  const results = [];
  let geocoded = 0;
  let failed = 0;
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    
    // Skip if already has coordinates
    if (event.latitude && event.longitude) {
      results.push(event);
      continue;
    }
    
    const coords = await geocodeEvent(event);
    
    if (coords) {
      results.push({
        ...event,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      geocoded++;
    } else {
      results.push(event);
      failed++;
    }
    
    // Progress callback
    if (onProgress) {
      onProgress({
        processed: i + 1,
        total: events.length,
        geocoded,
        failed,
      });
    }
    
    // Log progress every batchSize events
    if ((i + 1) % batchSize === 0) {
      console.log(`[Geocoding] Progress: ${i + 1}/${events.length} (${geocoded} geocoded, ${failed} failed)`);
    }
  }
  
  return results;
}

/**
 * Clear the in-memory geocode cache
 * Useful for testing or when cache might be stale
 */
export function clearCache() {
  geocodeCache.clear();
  lastRequestTime = 0;
}

/**
 * Get cache statistics
 * @returns {Object}
 */
export function getCacheStats() {
  return {
    memoryCacheSize: geocodeCache.size,
    lastRequestTime: lastRequestTime > 0 ? new Date(lastRequestTime).toISOString() : null,
  };
}

/**
 * Geocode a location string that could be either a ZIP code or "City, State" format
 * Useful for user input in search fields
 * 
 * @param {string} location - ZIP code (e.g., "20175") or city/state (e.g., "Leesburg, VA")
 * @returns {Promise<{latitude: number, longitude: number}|null>}
 */
export async function geocodeLocation(location) {
  if (!location || typeof location !== 'string') {
    console.debug('[Geocoding] geocodeLocation called with invalid input:', location);
    return null;
  }
  
  const trimmed = location.trim();
  console.info('[Geocoding] geocodeLocation called:', { input: trimmed });
  
  // Check if it's a ZIP code (5 digits)
  if (/^\d{5}$/.test(trimmed)) {
    console.debug('[Geocoding] Detected ZIP code format:', trimmed);
    return geocodeZip(trimmed);
  }
  
  // Try to parse as "City, State" or "City State"
  // Common formats: "Leesburg, VA", "Leesburg VA", "Leesburg, Virginia"
  const cityStateMatch = trimmed.match(/^([^,]+),?\s+([A-Za-z]{2,})$/);
  
  if (cityStateMatch) {
    const city = cityStateMatch[1].trim();
    const state = cityStateMatch[2].trim();
    console.debug('[Geocoding] Parsed City, State format:', { city, state });
    
    return geocodeAddress({
      city,
      state,
      country: 'USA',
    });
  }
  
  // If we can't parse it, try as free-form search
  // This handles cases like "Leesburg" without state
  console.info('[Geocoding] Using free-form search for:', trimmed);
  const addressHash = createAddressHash(`freeform:${trimmed}:USA`);
  
  // Check caches
  const memoryCached = checkMemoryCache(addressHash);
  if (memoryCached) {
    console.debug('[Geocoding] Memory cache hit for free-form:', trimmed);
    return memoryCached;
  }
  
  const dbCached = await checkDbCache(addressHash);
  if (dbCached) {
    geocodeCache.set(addressHash, { result: dbCached, timestamp: Date.now() });
    console.debug('[Geocoding] DB cache hit for free-form:', trimmed);
    return dbCached;
  }
  
  // Rate limit
  await waitForRateLimit();
  
  try {
    const queryParams = new URLSearchParams({
      format: 'json',
      limit: '1',
      countrycodes: 'us',
      q: trimmed,
    });
    
    const url = `https://nominatim.openstreetmap.org/search?${queryParams.toString()}`;
    
    console.info('[Geocoding] Nominatim free-form request:', { query: trimmed, url });
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('[Geocoding] Nominatim error:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.warn('[Geocoding] No results for free-form search:', trimmed);
      await saveToCache(addressHash, null, trimmed);
      return null;
    }
    
    const result = {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
    
    if (isNaN(result.latitude) || isNaN(result.longitude)) {
      console.error('[Geocoding] Invalid coordinates in response:', data[0]);
      return null;
    }
    
    // Log the resolved location for debugging
    console.info('[Geocoding] Free-form resolved:', {
      input: trimmed,
      resolvedTo: data[0].display_name,
      coords: result
    });
    await saveToCache(addressHash, result, trimmed);
    
    return result;
  } catch (err) {
    console.error('[Geocoding] Free-form error:', err.message);
    return null;
  }
}

const geocodingService = {
  geocodeAddress,
  geocodeEvent,
  geocodeZip,
  geocodeLocation,
  calculateDistanceMiles,
  batchGeocodeEvents,
  clearCache,
  getCacheStats,
};

export default geocodingService;

