/**
 * Lap Times Scraper Service
 * 
 * Uses Firecrawl to scrape lap time data from public sources:
 * - FastestLaps.com
 * - LapMiner (lapminer.com)
 * 
 * Populates car_track_lap_times table with citeable, verified data.
 * 
 * @module lib/lapTimesScraper
 */

import { createClient } from '@supabase/supabase-js';

import firecrawlClient from './firecrawlClient.js';

// ============================================================================
// SUPABASE CLIENT (for scripts - bypasses browser-specific SSR client)
// ============================================================================

let _supabaseClient = null;

function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !serviceKey) {
    return null;
  }
  
  _supabaseClient = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  return _supabaseClient;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SOURCES = {
  fastestlaps: {
    name: 'FastestLaps',
    baseUrl: 'https://fastestlaps.com',
    carListUrl: 'https://fastestlaps.com/models',
    trackListUrl: 'https://fastestlaps.com/tracks',
  },
  // Note: LapMiner appears to be defunct/unavailable - fastestlaps is primary source
};

// ============================================================================
// DATABASE HELPERS
// ============================================================================

function getDbClient() {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase not configured - check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  return client;
}

/**
 * Get all cars from database for matching
 * @returns {Promise<Map>} Map of normalized name -> car record
 */
async function getCarLookup() {
  const client = getDbClient();
  const { data, error } = await client
    .from('cars')
    .select('id, slug, name, years');
  
  if (error) throw error;
  
  const lookup = new Map();
  for (const car of data || []) {
    // Index by various forms of the name
    const normalized = normalizeName(car.name);
    lookup.set(normalized, car);
    lookup.set(car.slug, car);
    // Also index without year suffix for better matching
    const nameWithoutYear = car.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
    lookup.set(normalizeName(nameWithoutYear), car);
  }
  return lookup;
}

/**
 * Get all tracks from database for matching
 * @returns {Promise<Map>} Map of normalized name -> track record
 */
async function getTrackLookup() {
  const client = getDbClient();
  const { data, error } = await client
    .from('track_venues')
    .select('id, slug, name, country, length_km');
  
  if (error) throw error;
  
  const lookup = new Map();
  for (const track of data || []) {
    lookup.set(normalizeName(track.name), track);
    lookup.set(track.slug, track);
  }
  return lookup;
}

/**
 * Normalize a name for fuzzy matching
 */
function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/porsche911/g, '911')
    .replace(/chevrolet/g, 'chevy')
    .replace(/mercedesbenz/g, 'mercedes')
    .replace(/mercedesamg/g, 'amg');
}

/**
 * Parse lap time string to milliseconds
 * Handles formats: "1:23.456", "1'23.456", "83.456"
 */
function parseLapTimeToMs(timeStr) {
  if (!timeStr) return null;
  
  const cleaned = timeStr.trim().replace(/['"]/g, ':');
  
  // Format: M:SS.mmm or MM:SS.mmm
  const minSecMatch = cleaned.match(/^(\d+):(\d+)\.(\d+)$/);
  if (minSecMatch) {
    const mins = parseInt(minSecMatch[1], 10);
    const secs = parseInt(minSecMatch[2], 10);
    const ms = parseInt(minSecMatch[3].padEnd(3, '0').slice(0, 3), 10);
    return (mins * 60 + secs) * 1000 + ms;
  }
  
  // Format: SS.mmm (seconds only)
  const secMatch = cleaned.match(/^(\d+)\.(\d+)$/);
  if (secMatch) {
    const secs = parseInt(secMatch[1], 10);
    const ms = parseInt(secMatch[2].padEnd(3, '0').slice(0, 3), 10);
    return secs * 1000 + ms;
  }
  
  return null;
}

/**
 * Format milliseconds to lap time string
 */
function formatMsToLapTime(ms) {
  if (!ms) return null;
  const totalSecs = ms / 1000;
  const mins = Math.floor(totalSecs / 60);
  const secs = (totalSecs % 60).toFixed(2);
  return mins > 0 ? `${mins}:${secs.padStart(5, '0')}` : secs;
}

/**
 * Insert or update a track venue
 */
async function upsertTrack(trackData) {
  const client = getDbClient();
  const slug = trackData.slug || normalizeName(trackData.name).replace(/[^a-z0-9]/g, '-');
  
  const { data, error } = await client
    .from('track_venues')
    .upsert({
      slug,
      name: trackData.name,
      country: trackData.country || null,
      length_km: trackData.length_km || null,
      surface: trackData.surface || 'asphalt',
      website: trackData.website || null,
      metadata: trackData.metadata || {},
    }, {
      onConflict: 'slug',
    })
    .select()
    .single();
  
  if (error) {
    console.error(`[LapTimesScraper] Error upserting track ${trackData.name}:`, error);
    return null;
  }
  return data;
}

/**
 * Insert a lap time record (skip if duplicate)
 */
async function insertLapTime(lapTimeData) {
  const client = getDbClient();
  
  // Check for existing record with same car, track, and time
  const { data: existing } = await client
    .from('car_track_lap_times')
    .select('id')
    .eq('car_id', lapTimeData.car_id)
    .eq('track_id', lapTimeData.track_id)
    .eq('lap_time_ms', lapTimeData.lap_time_ms)
    .maybeSingle();
  
  if (existing) {
    console.log(`[LapTimesScraper] Skipping duplicate: ${lapTimeData.lap_time_text} at track`);
    return { skipped: true, existing };
  }
  
  const { data, error } = await client
    .from('car_track_lap_times')
    .insert({
      car_id: lapTimeData.car_id,
      car_variant_id: lapTimeData.car_variant_id || null,
      track_id: lapTimeData.track_id,
      track_layout_id: lapTimeData.track_layout_id || null,
      lap_time_ms: lapTimeData.lap_time_ms,
      lap_time_text: lapTimeData.lap_time_text,
      session_date: lapTimeData.session_date || null,
      is_stock: lapTimeData.is_stock ?? true,
      tires: lapTimeData.tires || null,
      fuel: lapTimeData.fuel || null,
      transmission: lapTimeData.transmission || null,
      conditions: lapTimeData.conditions || null,
      modifications: lapTimeData.modifications || null,
      notes: lapTimeData.notes || null,
      source_url: lapTimeData.source_url,
      confidence: lapTimeData.confidence || 0.8,
      verified: false,
    })
    .select()
    .single();
  
  if (error) {
    console.error(`[LapTimesScraper] Error inserting lap time:`, error);
    return { error };
  }
  
  return { inserted: true, data };
}

// ============================================================================
// FASTESTLAPS SCRAPER
// ============================================================================

/**
 * Scrape lap times for a specific car from FastestLaps
 * IMPORTANT: This extracts the actual car name from the page, not from our search term
 * @param {string} carSlug - FastestLaps car slug (from URL)
 * @param {Object} options - Scrape options
 */
export async function scrapeFastestLapsCarPage(carSlug, options = {}) {
  if (!firecrawlClient.isFirecrawlConfigured()) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  const url = `https://fastestlaps.com/models/${carSlug}`;
  console.log(`[LapTimesScraper] Scraping FastestLaps car: ${url}`);
  
  const result = await firecrawlClient.scrapeUrl(url, {
    formats: ['markdown'],
    onlyMainContent: true,
  });
  
  if (!result.success) {
    return { success: false, error: result.error, url };
  }
  
  // Extract the ACTUAL car name from the page title
  // FastestLaps titles are like "Porsche 911 GT3 RS specs - FastestLaps.com"
  let actualCarName = null;
  if (result.title) {
    const titleMatch = result.title.match(/^(.+?)(?:\s+specs|\s+lap times|\s+-)/i);
    actualCarName = titleMatch ? titleMatch[1].trim() : result.title.split('-')[0].trim();
  }
  
  // Parse lap times from markdown
  const lapTimes = parseFastestLapsMarkdown(result.markdown, url);
  
  return {
    success: true,
    url,
    carSlug,
    actualCarName, // The car name from FastestLaps, not our search term
    title: result.title,
    lapTimes,
    lapTimeCount: lapTimes.length,
  };
}

/**
 * Parse FastestLaps markdown to extract lap times
 * FastestLaps format is a markdown table:
 * | Track | Time |
 * | --- | --- |
 * | [Track Name](url) | [1:23.45](url) |
 */
function parseFastestLapsMarkdown(markdown, sourceUrl) {
  const lapTimes = [];
  const lines = markdown.split('\n');
  
  // Pattern for lap times: 1:23.45 or 0:56.78
  const timePattern = /(\d{1,2}:\d{2}\.\d{1,3})/;
  
  // Pattern for markdown table rows with track links
  // | [Track Name](url) | [1:23.45](url) |
  const tableRowPattern = /\|\s*\[([^\]]+)\]\([^)]+\)\s*\|\s*\[(\d{1,2}:\d{2}\.\d{1,3})\]\(([^)]+)\)/;
  
  for (const line of lines) {
    // Try table row format first (most reliable)
    const tableMatch = line.match(tableRowPattern);
    if (tableMatch) {
      const trackName = tableMatch[1].trim();
      const lapTimeText = tableMatch[2];
      const testUrl = tableMatch[3];
      const lapTimeMs = parseLapTimeToMs(lapTimeText);
      
      if (lapTimeMs && trackName) {
        lapTimes.push({
          track_name: trackName,
          lap_time_text: lapTimeText,
          lap_time_ms: lapTimeMs,
          is_stock: true, // FastestLaps stock filter defaults
          tires: null,
          source_url: testUrl.startsWith('http') ? testUrl : `https://fastestlaps.com${testUrl}`,
          raw_line: line.trim(),
        });
        continue;
      }
    }
    
    // Fallback: simpler pattern for any line with track-looking text and time
    const timeMatch = line.match(timePattern);
    if (timeMatch) {
      // Try to extract track name from the line
      // Look for [Track Name] pattern or text before the time
      const trackLinkMatch = line.match(/\[([^\]]+)\]\([^)]*tracks[^)]*\)/);
      const trackName = trackLinkMatch ? trackLinkMatch[1] : null;
      
      if (trackName) {
        const lapTimeText = timeMatch[1];
        const lapTimeMs = parseLapTimeToMs(lapTimeText);
        
        // Extract test URL if present
        const urlMatch = line.match(/\[[\d:\.]+\]\(([^)]+)\)/);
        const testUrl = urlMatch ? urlMatch[1] : sourceUrl;
        
        if (lapTimeMs) {
          lapTimes.push({
            track_name: trackName,
            lap_time_text: lapTimeText,
            lap_time_ms: lapTimeMs,
            is_stock: true,
            tires: null,
            source_url: testUrl.startsWith('http') ? testUrl : `https://fastestlaps.com${testUrl}`,
            raw_line: line.trim(),
          });
        }
      }
    }
  }
  
  return lapTimes;
}

/**
 * Scrape a specific FastestLaps test page (direct URL to a lap time)
 */
export async function scrapeFastestLapsTestPage(testUrl) {
  if (!firecrawlClient.isFirecrawlConfigured()) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  console.log(`[LapTimesScraper] Scraping test page: ${testUrl}`);
  
  // Use structured extraction for more reliable data
  const schema = {
    type: 'object',
    properties: {
      car_name: { type: 'string', description: 'Full car name including make, model, year' },
      track_name: { type: 'string', description: 'Track/circuit name' },
      lap_time: { type: 'string', description: 'Lap time in format M:SS.mmm' },
      date: { type: 'string', description: 'Date of the lap time' },
      driver: { type: 'string', description: 'Driver name if available' },
      tires: { type: 'string', description: 'Tire compound/brand' },
      weather: { type: 'string', description: 'Weather conditions' },
      is_stock: { type: 'boolean', description: 'Whether the car was stock/unmodified' },
      source_publication: { type: 'string', description: 'Magazine or source of the test' },
    },
    required: ['car_name', 'track_name', 'lap_time'],
  };
  
  const result = await firecrawlClient.extractStructured(testUrl, schema, {
    prompt: 'Extract the lap time test data from this FastestLaps page. Include car name, track, lap time, and any available metadata.',
  });
  
  if (!result.success) {
    // Fall back to markdown scraping
    const mdResult = await firecrawlClient.scrapeUrl(testUrl, {
      formats: ['markdown'],
      onlyMainContent: true,
    });
    
    if (mdResult.success) {
      return {
        success: true,
        url: testUrl,
        markdown: mdResult.markdown,
        extracted: null,
        fallback: true,
      };
    }
    
    return { success: false, error: result.error, url: testUrl };
  }
  
  return {
    success: true,
    url: testUrl,
    extracted: result.extracted,
    metadata: result.metadata,
  };
}

/**
 * Discover and scrape lap times for cars in our database from FastestLaps
 */
export async function discoverAndScrapeFastestLaps(options = {}) {
  const {
    carSlugs = null, // If provided, only scrape these cars
    limit = 20,
    dryRun = false,
  } = options;

  if (!firecrawlClient.isFirecrawlConfigured()) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  const carLookup = await getCarLookup();
  const trackLookup = await getTrackLookup();
  
  const stats = {
    carsProcessed: 0,
    lapTimesFound: 0,
    lapTimesInserted: 0,
    lapTimesSkipped: 0,
    tracksCreated: 0,
    errors: [],
  };

  // Get cars to process
  let carsToProcess;
  if (carSlugs) {
    carsToProcess = carSlugs;
  } else {
    // Get cars from our database
    const client = getDbClient();
    const { data: cars } = await client
      .from('cars')
      .select('slug, name')
      .limit(limit);
    carsToProcess = (cars || []).map(c => ({
      ourSlug: c.slug,
      name: c.name,
    }));
  }

  console.log(`[LapTimesScraper] Processing ${carsToProcess.length} cars...`);

  for (const carInfo of carsToProcess) {
    try {
      // Convert our slug to FastestLaps search
      const searchName = typeof carInfo === 'string' ? carInfo : carInfo.name;
      const ourSlug = typeof carInfo === 'string' ? carInfo : carInfo.ourSlug;
      
      // Search FastestLaps for this car
      const searchUrl = `https://fastestlaps.com/search?query=${encodeURIComponent(searchName)}`;
      
      console.log(`[LapTimesScraper] Searching FastestLaps for: ${searchName}`);
      
      const searchResult = await firecrawlClient.scrapeUrl(searchUrl, {
        formats: ['markdown', 'links'],
        onlyMainContent: true,
      });
      
      if (!searchResult.success) {
        stats.errors.push({ car: searchName, error: searchResult.error });
        continue;
      }
      
      // Find model page links and normalize them
      const modelLinks = (searchResult.links || [])
        .filter(link => link.includes('/models/'))
        .map(link => {
          // Extract just the path if it's a full URL
          if (link.startsWith('http')) {
            try {
              const url = new URL(link);
              return url.pathname;
            } catch { return link; }
          }
          return link;
        })
        .slice(0, 3); // Take top 3 matches
      
      for (const modelLink of modelLinks) {
        // Extract slug from path like /models/porsche-911-gt3-992
        const modelSlug = modelLink.replace(/^\/models\//, '').split('/')[0];
        
        const carPageResult = await scrapeFastestLapsCarPage(modelSlug);
        
        if (!carPageResult.success) continue;
        
        stats.lapTimesFound += carPageResult.lapTimeCount;
        
        // FIXED: Use the actual car name from the FastestLaps page, not our search term
        // All lap times on this page are for this specific car
        const actualCarName = carPageResult.actualCarName;
        
        // Try to match the car from the page to our database
        let car = null;
        if (actualCarName) {
          // Try exact match
          car = carLookup.get(normalizeName(actualCarName));
          
          // Try without year suffix
          if (!car) {
            const nameNoYear = actualCarName.replace(/\s*\(\d{4}[-–]?\d{0,4}\)\s*$/g, '').replace(/\s*\d{4}\s*$/g, '').trim();
            car = carLookup.get(normalizeName(nameNoYear));
          }
          
          // Try removing engine/variant suffix (e.g., "Jeep Gladiator 3.6" -> "Jeep Gladiator")
          if (!car) {
            // Remove trailing numbers/engine specs like "3.6", "1.8 TFSI", "V8"
            const nameNoEngine = actualCarName
              .replace(/\s+\d+\.\d+\s*(L|T|TFSI|TSI|TDI|V\d+)?$/i, '')
              .replace(/\s+(V\d+|I\d+|W\d+)$/i, '')
              .replace(/\s+(TFSI|TSI|TDI|Turbo|Supercharged)$/i, '')
              .trim();
            car = carLookup.get(normalizeName(nameNoEngine));
          }
          
          // Try "Make Model" only (first 2 words)
          if (!car) {
            const parts = actualCarName.split(' ');
            if (parts.length >= 2) {
              const makeModel = parts.slice(0, 2).join(' ');
              car = carLookup.get(normalizeName(makeModel));
            }
          }
        }
        
        // CRITICAL: Do NOT fall back to search car if actual car doesn't match
        // This prevents assigning Corvette ZR1 times to McLaren 765LT
        if (!car) {
          console.log(`[LapTimesScraper] Skipping - no DB match for: ${actualCarName}`);
          continue;
        }
        
        // Extra validation: make sure the matched car is reasonably similar
        const actualNorm = normalizeName(actualCarName || '');
        const matchedNorm = normalizeName(car.name);
        const searchNorm = normalizeName(searchName);
        
        // Check if actual car name shares significant overlap with matched car
        // This prevents cross-brand matches
        const actualWords = actualCarName.toLowerCase().split(/\s+/);
        const matchedWords = car.name.toLowerCase().split(/\s+/);
        const commonWords = actualWords.filter(w => matchedWords.some(mw => mw.includes(w) || w.includes(mw)));
        
        // Require at least 2 common words (make + model) OR significant character overlap
        const hasGoodMatch = commonWords.length >= 2 || 
                            actualNorm.includes(matchedNorm.slice(0, 15)) || 
                            matchedNorm.includes(actualNorm.slice(0, 15));
        
        if (!hasGoodMatch) {
          console.log(`[LapTimesScraper] Skipping - weak match: "${actualCarName}" -> ${car.name}`);
          continue;
        }
        
        console.log(`[LapTimesScraper] Matched "${actualCarName}" -> ${car.name}`);
        
        // Match and insert lap times - ALL are for the matched car
        for (const lt of carPageResult.lapTimes) {
          // Find or create track
          let track = trackLookup.get(normalizeName(lt.track_name));
          
          if (!track && !dryRun) {
            // Create new track
            track = await upsertTrack({
              name: lt.track_name,
              metadata: { source: 'fastestlaps' },
            });
            if (track) {
              trackLookup.set(normalizeName(lt.track_name), track);
              stats.tracksCreated++;
            }
          }
          
          if (!track) {
            console.log(`[LapTimesScraper] Could not resolve track: ${lt.track_name}`);
            continue;
          }
          
          if (dryRun) {
            console.log(`[LapTimesScraper][DRY-RUN] Would insert: ${car.name} at ${lt.track_name}: ${lt.lap_time_text}`);
            stats.lapTimesSkipped++;
            continue;
          }
          
          // Insert lap time
          const insertResult = await insertLapTime({
            car_id: car.id,
            track_id: track.id,
            lap_time_ms: lt.lap_time_ms,
            lap_time_text: lt.lap_time_text,
            is_stock: lt.is_stock,
            tires: lt.tires,
            source_url: lt.source_url,
            confidence: 0.85,
          });
          
          if (insertResult.inserted) {
            stats.lapTimesInserted++;
          } else if (insertResult.skipped) {
            stats.lapTimesSkipped++;
          }
        }
      }
      
      stats.carsProcessed++;
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 1500));
      
    } catch (err) {
      console.error(`[LapTimesScraper] Error processing car:`, err);
      stats.errors.push({ car: carInfo, error: err.message });
    }
  }

  console.log(`[LapTimesScraper] Complete:`, stats);
  return stats;
}

/**
 * Scrape lap times for a specific track from FastestLaps
 * This is the PREFERRED method - track pages show car name + lap time together
 */
export async function scrapeFastestLapsTrackPage(trackSlug) {
  if (!firecrawlClient.isFirecrawlConfigured()) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  const url = `https://fastestlaps.com/tracks/${trackSlug}`;
  console.log(`[LapTimesScraper] Scraping FastestLaps track: ${url}`);
  
  const result = await firecrawlClient.scrapeUrl(url, {
    formats: ['markdown'],
    onlyMainContent: true,
  });
  
  if (!result.success) {
    return { success: false, error: result.error, url };
  }
  
  // Extract track name from page title
  // Format: "Track Name lap times - FastestLaps.com"
  let trackName = trackSlug;
  if (result.title) {
    const titleMatch = result.title.match(/^(.+?)(?:\s+lap times|\s+-)/i);
    trackName = titleMatch ? titleMatch[1].trim() : trackSlug;
  }
  
  // Parse lap times from the track page
  const lapTimes = parseTrackPageMarkdown(result.markdown, url, trackName);
  
  return {
    success: true,
    url,
    trackSlug,
    trackName,
    title: result.title,
    lapTimes,
    lapTimeCount: lapTimes.length,
  };
}

/**
 * Parse track page markdown to extract all car lap times
 * FastestLaps track pages have tables like:
 * | Rank | Car | Lap Time | PS | Year |
 * | 1 | [Porsche 911 GT3 RS](/models/xxx) | [1:23.45](/tests/xxx) | 518 | 2023 |
 */
function parseTrackPageMarkdown(markdown, sourceUrl, trackName) {
  const lapTimes = [];
  const lines = markdown.split('\n');
  
  // More robust table row pattern for FastestLaps track pages
  // Format: | Rank | [Car Name](model_url) | [Time](test_url) | ... |
  const tableRowPattern = /\|\s*\d+\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*\[?(\d{1,2}:\d{2}\.\d{1,3})\]?\(?([^)|]*)\)?/;
  
  // Alternative simpler pattern
  const simpleRowPattern = /\|\s*\d+\s*\|([^|]+)\|([^|]*\d{1,2}:\d{2}\.\d{1,3}[^|]*)\|/;
  
  for (const line of lines) {
    // Try the structured table row pattern first
    const tableMatch = line.match(tableRowPattern);
    
    if (tableMatch) {
      const carName = tableMatch[1].trim();
      const modelUrl = tableMatch[2];
      const lapTimeText = tableMatch[3];
      const testUrl = tableMatch[4] || '';
      const lapTimeMs = parseLapTimeToMs(lapTimeText);
      
      if (lapTimeMs && carName) {
        lapTimes.push({
          car_name: carName,
          car_model_url: modelUrl.startsWith('http') ? modelUrl : `https://fastestlaps.com${modelUrl}`,
          lap_time_text: lapTimeText,
          lap_time_ms: lapTimeMs,
          track_name: trackName,
          source_url: testUrl && testUrl.includes('/tests/') 
            ? (testUrl.startsWith('http') ? testUrl : `https://fastestlaps.com${testUrl}`)
            : sourceUrl,
          raw_line: line.trim(),
        });
        continue;
      }
    }
    
    // Fallback: simpler pattern for any line with car make and time
    const timeMatch = line.match(/(\d{1,2}:\d{2}\.\d{1,3})/);
    if (timeMatch) {
      // Extract car name from markdown link or plain text
      const carLinkMatch = line.match(/\[([^\]]+)\]\([^)]*models[^)]*\)/);
      const carName = carLinkMatch ? carLinkMatch[1].trim() : null;
      
      // Extract test URL if present
      const testUrlMatch = line.match(/\[[\d:\.]+\]\(([^)]+)\)/);
      const testUrl = testUrlMatch ? testUrlMatch[1] : null;
      
      if (carName) {
        const lapTimeText = timeMatch[1];
        const lapTimeMs = parseLapTimeToMs(lapTimeText);
        
        if (lapTimeMs) {
          lapTimes.push({
            car_name: carName,
            lap_time_text: lapTimeText,
            lap_time_ms: lapTimeMs,
            track_name: trackName,
            source_url: testUrl 
              ? (testUrl.startsWith('http') ? testUrl : `https://fastestlaps.com${testUrl}`)
              : sourceUrl,
            raw_line: line.trim(),
          });
        }
      }
    }
  }
  
  return lapTimes;
}

/**
 * Bulk import lap times for a track
 */
export async function importLapTimesForTrack(trackSlug, options = {}) {
  const { dryRun = false } = options;
  
  const carLookup = await getCarLookup();
  const trackLookup = await getTrackLookup();
  
  // Scrape the track page first to get data
  const scrapeResult = await scrapeFastestLapsTrackPage(trackSlug);
  
  if (!scrapeResult.success) {
    return scrapeResult;
  }
  
  // Find or create track in our database
  let track = trackLookup.get(trackSlug) || trackLookup.get(normalizeName(trackSlug));
  
  if (!track && !dryRun) {
    // Create new track from scraped data
    track = await upsertTrack({
      slug: trackSlug,
      name: scrapeResult.trackName || trackSlug,
      metadata: { source: 'fastestlaps' },
    });
    if (track) {
      trackLookup.set(trackSlug, track);
    }
  }
  
  if (!track) {
    return { success: false, error: `Could not resolve/create track: ${trackSlug}` };
  }
  
  const stats = {
    track: track.name,
    lapTimesFound: scrapeResult.lapTimeCount,
    matched: 0,
    inserted: 0,
    skipped: 0,
    unmatched: [],
  };
  
  for (const lt of scrapeResult.lapTimes) {
    // Try to match car using various normalizations
    const normalizedCarName = normalizeName(lt.car_name);
    let car = carLookup.get(normalizedCarName);
    
    // Try fuzzy matching if exact match fails
    if (!car) {
      // Try without year suffix
      const nameNoYear = lt.car_name.replace(/\s*\(\d{4}[-–]\d{4}\)\s*$/g, '').replace(/\s*\d{4}\s*$/g, '').trim();
      car = carLookup.get(normalizeName(nameNoYear));
    }
    
    if (!car) {
      stats.unmatched.push(lt.car_name);
      continue;
    }
    
    stats.matched++;
    
    if (dryRun) {
      console.log(`[LapTimesScraper][DRY-RUN] Would insert: ${car.name} (matched from "${lt.car_name}"): ${lt.lap_time_text}`);
      continue;
    }
    
    const insertResult = await insertLapTime({
      car_id: car.id,
      track_id: track.id,
      lap_time_ms: lt.lap_time_ms,
      lap_time_text: lt.lap_time_text,
      is_stock: true,
      source_url: lt.source_url,
      confidence: 0.85,
    });
    
    if (insertResult.inserted) {
      stats.inserted++;
    } else {
      stats.skipped++;
    }
  }
  
  return { success: true, stats };
}

/**
 * Discover popular tracks from FastestLaps and scrape all lap times
 * This is the RECOMMENDED approach - more reliable car-to-time mapping
 */
export async function discoverAndScrapeByTracks(options = {}) {
  const {
    trackSlugs = null, // If provided, only scrape these tracks
    limit = 50,
    dryRun = false,
  } = options;

  if (!firecrawlClient.isFirecrawlConfigured()) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  const stats = {
    tracksProcessed: 0,
    lapTimesFound: 0,
    lapTimesInserted: 0,
    lapTimesSkipped: 0,
    carsMatched: 0,
    carsUnmatched: new Set(),
    errors: [],
  };

  let tracksToProcess = trackSlugs;
  
  if (!tracksToProcess) {
    // Discover popular tracks from FastestLaps
    console.log('[LapTimesScraper] Discovering tracks from FastestLaps...');
    
    const tracksPageResult = await firecrawlClient.scrapeUrl('https://fastestlaps.com/tracks', {
      formats: ['links', 'markdown'],
      onlyMainContent: true,
    });
    
    if (!tracksPageResult.success) {
      return { success: false, error: 'Failed to fetch tracks list', stats };
    }
    
    // Extract track slugs from links
    tracksToProcess = (tracksPageResult.links || [])
      .filter(link => link.includes('/tracks/') && !link.includes('/tracks?'))
      .map(link => {
        const match = link.match(/\/tracks\/([^/?]+)/);
        return match ? match[1] : null;
      })
      .filter(Boolean)
      .filter((slug, index, self) => self.indexOf(slug) === index) // dedupe
      .slice(0, limit);
    
    console.log(`[LapTimesScraper] Found ${tracksToProcess.length} tracks to process`);
  }

  for (const trackSlug of tracksToProcess) {
    try {
      console.log(`\n[LapTimesScraper] Processing track: ${trackSlug}`);
      
      const result = await importLapTimesForTrack(trackSlug, { dryRun });
      
      if (result.success) {
        stats.tracksProcessed++;
        stats.lapTimesFound += result.stats.lapTimesFound;
        stats.lapTimesInserted += result.stats.inserted;
        stats.lapTimesSkipped += result.stats.skipped;
        stats.carsMatched += result.stats.matched;
        
        for (const unmatchedCar of result.stats.unmatched) {
          stats.carsUnmatched.add(unmatchedCar);
        }
        
        console.log(`[LapTimesScraper] ${trackSlug}: ${result.stats.lapTimesFound} found, ${result.stats.matched} matched, ${result.stats.inserted} inserted`);
      } else {
        stats.errors.push({ track: trackSlug, error: result.error });
      }
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (err) {
      console.error(`[LapTimesScraper] Error processing track ${trackSlug}:`, err);
      stats.errors.push({ track: trackSlug, error: err.message });
    }
  }

  // Convert Set to Array for output
  stats.carsUnmatched = [...stats.carsUnmatched];
  
  console.log('\n[LapTimesScraper] Track-based scrape complete:', {
    ...stats,
    carsUnmatchedCount: stats.carsUnmatched.length,
  });
  
  return { success: true, stats };
}

// ============================================================================
// EXPORTS
// ============================================================================

const lapTimesScraper = {
  // Core functions
  parseLapTimeToMs,
  formatMsToLapTime,
  
  // FastestLaps - Track-based (RECOMMENDED)
  scrapeFastestLapsTrackPage,
  importLapTimesForTrack,
  discoverAndScrapeByTracks, // NEW: Reliable track-based scraping
  
  // FastestLaps - Car-based (less reliable)
  scrapeFastestLapsCarPage,
  scrapeFastestLapsTestPage,
  discoverAndScrapeFastestLaps, // DEPRECATED: Use discoverAndScrapeByTracks instead
  
  // Database helpers
  upsertTrack,
  insertLapTime,
  getCarLookup,
  getTrackLookup,
};

export default lapTimesScraper;
