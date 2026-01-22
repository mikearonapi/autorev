#!/usr/bin/env node
/**
 * Priority Vehicle Lap Times Scraper
 * 
 * Scrapes lap times for Top 100 US Modification Market vehicles.
 * Uses optimized search terms that match FastestLaps naming conventions.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import firecrawlClient from '../lib/firecrawlClient.js';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Priority vehicles with FastestLaps-friendly search terms
// Format: { searchTerm: string, dbPatterns: string[] }
const PRIORITY_VEHICLES = [
  // Tier 1 - Market Leaders
  { search: 'Ford Mustang GT', patterns: ['%Mustang GT%'] },
  { search: 'Ford Mustang Shelby GT350', patterns: ['%GT350%', '%Shelby%'] },
  { search: 'Ford Mustang Shelby GT500', patterns: ['%GT500%'] },
  { search: 'Ford Mustang Mach 1', patterns: ['%Mach 1%'] },
  { search: 'Chevrolet Corvette Z06', patterns: ['%Corvette%Z06%'] },
  { search: 'Chevrolet Corvette ZR1', patterns: ['%Corvette%ZR1%'] },
  { search: 'Chevrolet Corvette Stingray', patterns: ['%Corvette%Stingray%'] },
  { search: 'Chevrolet Corvette Grand Sport', patterns: ['%Corvette%Grand Sport%'] },
  { search: 'Volkswagen Golf GTI', patterns: ['%Golf GTI%', '%GTI%'] },
  { search: 'Volkswagen Golf R', patterns: ['%Golf R%'] },
  { search: 'Subaru WRX STI', patterns: ['%WRX%STI%', '%STI%'] },
  { search: 'Subaru WRX', patterns: ['%WRX%'] },
  
  // Tier 2 - Major Platforms
  { search: 'Chevrolet Camaro SS', patterns: ['%Camaro SS%'] },
  { search: 'Chevrolet Camaro ZL1', patterns: ['%Camaro ZL1%', '%ZL1%'] },
  { search: 'Chevrolet Camaro Z28', patterns: ['%Camaro Z28%', '%Z28%'] },
  { search: 'Honda Civic Type R', patterns: ['%Civic Type R%', '%Type R%'] },
  { search: 'Honda Civic Si', patterns: ['%Civic Si%'] },
  { search: 'Mazda MX-5 Miata', patterns: ['%MX-5%', '%Miata%'] },
  { search: 'Dodge Challenger Hellcat', patterns: ['%Challenger%Hellcat%'] },
  { search: 'Dodge Challenger SRT', patterns: ['%Challenger SRT%'] },
  { search: 'Dodge Charger Hellcat', patterns: ['%Charger%Hellcat%'] },
  { search: 'Dodge Charger SRT', patterns: ['%Charger SRT%'] },
  { search: 'BMW M3', patterns: ['%M3%'] },
  { search: 'BMW M4', patterns: ['%M4%'] },
  { search: 'BMW M2', patterns: ['%M2%'] },
  
  // Tier 3 - Strong Enthusiast Platforms
  { search: 'Porsche 911 GT3', patterns: ['%911 GT3%'] },
  { search: 'Porsche 911 Turbo', patterns: ['%911 Turbo%'] },
  { search: 'Porsche Cayman GT4', patterns: ['%Cayman GT4%'] },
  { search: 'Porsche Cayman S', patterns: ['%Cayman S%'] },
  { search: 'Porsche Boxster S', patterns: ['%Boxster S%'] },
  { search: 'Acura RSX Type S', patterns: ['%RSX%'] },
  { search: 'Acura Integra Type R', patterns: ['%Integra Type R%'] },
  { search: 'Nissan 370Z', patterns: ['%370Z%'] },
  { search: 'Nissan 350Z', patterns: ['%350Z%'] },
  { search: 'Nissan 240SX', patterns: ['%240SX%', '%Silvia%'] },
  { search: 'Toyota Supra', patterns: ['%Supra%'] },
  { search: 'Toyota GR86', patterns: ['%GR86%', '%86%', '%GT86%'] },
  { search: 'Subaru BRZ', patterns: ['%BRZ%'] },
  { search: 'Mitsubishi Lancer Evolution', patterns: ['%Evo%', '%Evolution%'] },
  { search: 'Ford Focus RS', patterns: ['%Focus RS%'] },
  { search: 'Ford Focus ST', patterns: ['%Focus ST%'] },
  
  // Tier 4 - Established Communities  
  { search: 'Audi RS3', patterns: ['%RS3%'] },
  { search: 'Audi S4', patterns: ['%S4%'] },
  { search: 'Audi TT RS', patterns: ['%TT RS%'] },
  { search: 'Mercedes AMG C63', patterns: ['%C63%', '%C 63%'] },
  { search: 'Mercedes AMG E63', patterns: ['%E63%', '%E 63%'] },
  { search: 'Alfa Romeo Giulia Quadrifoglio', patterns: ['%Giulia%Quadrifoglio%'] },
  { search: 'Alfa Romeo 4C', patterns: ['%4C%'] },
  { search: 'Lexus IS F', patterns: ['%IS F%', '%IS-F%'] },
  { search: 'Lexus RC F', patterns: ['%RC F%', '%RC-F%'] },
  { search: 'Lexus LC 500', patterns: ['%LC 500%'] },
  { search: 'Infiniti G37', patterns: ['%G37%'] },
  { search: 'Infiniti Q60', patterns: ['%Q60%'] },
  { search: 'Hyundai Veloster N', patterns: ['%Veloster N%'] },
  { search: 'Hyundai Elantra N', patterns: ['%Elantra N%'] },
  { search: 'Kia Stinger GT', patterns: ['%Stinger%'] },
  { search: 'Genesis G70', patterns: ['%G70%'] },
  
  // Tier 5 - Active Niches
  { search: 'MINI Cooper S', patterns: ['%MINI%Cooper%', '%Cooper S%'] },
  { search: 'MINI JCW', patterns: ['%JCW%', '%John Cooper%'] },
  { search: 'Mazda RX-7', patterns: ['%RX-7%', '%RX7%'] },
  { search: 'Mazda RX-8', patterns: ['%RX-8%', '%RX8%'] },
  { search: 'Mazdaspeed 3', patterns: ['%Mazdaspeed%', '%MPS%'] },
  { search: 'Toyota GR Corolla', patterns: ['%GR Corolla%'] },
  { search: 'Toyota MR2', patterns: ['%MR2%'] },
  { search: 'Nissan Skyline GT-R', patterns: ['%Skyline%', '%R32%', '%R33%', '%R34%'] },
  { search: 'Honda S2000', patterns: ['%S2000%'] },
  { search: 'Lotus Elise', patterns: ['%Elise%'] },
  { search: 'Lotus Exige', patterns: ['%Exige%'] },
  
  // Trucks/SUVs with track times (rare but valuable)
  { search: 'Ford F-150 Raptor', patterns: ['%F-150%Raptor%', '%Raptor%'] },
  { search: 'Ram 1500 TRX', patterns: ['%TRX%'] },
  { search: 'Jeep Grand Cherokee Trackhawk', patterns: ['%Trackhawk%'] },
];

// Parse lap time to milliseconds
function parseLapTimeToMs(timeStr) {
  if (!timeStr) return null;
  const cleaned = timeStr.trim().replace(/['"]/g, ':');
  const minSecMatch = cleaned.match(/^(\d+):(\d+)\.(\d+)$/);
  if (minSecMatch) {
    const mins = parseInt(minSecMatch[1], 10);
    const secs = parseInt(minSecMatch[2], 10);
    const ms = parseInt(minSecMatch[3].padEnd(3, '0').slice(0, 3), 10);
    return (mins * 60 + secs) * 1000 + ms;
  }
  const secMatch = cleaned.match(/^(\d+)\.(\d+)$/);
  if (secMatch) {
    const secs = parseInt(secMatch[1], 10);
    const ms = parseInt(secMatch[2].padEnd(3, '0').slice(0, 3), 10);
    return secs * 1000 + ms;
  }
  return null;
}

// Normalize name for matching
function normalizeName(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Find matching car in our database
async function findMatchingCar(actualCarName, patterns) {
  // Try exact normalized match first
  const normalized = normalizeName(actualCarName);
  
  // Query cars matching any of the patterns
  let query = supabase.from('cars').select('id, name, slug');
  
  // Build OR conditions for patterns
  const orConditions = patterns.map(p => `name.ilike.${p}`).join(',');
  
  const { data: candidates } = await query.or(orConditions);
  
  if (!candidates || candidates.length === 0) return null;
  
  // Score each candidate by similarity
  let bestMatch = null;
  let bestScore = 0;
  
  for (const car of candidates) {
    const carNorm = normalizeName(car.name);
    const actualNorm = normalizeName(actualCarName);
    
    // Calculate overlap score
    let score = 0;
    
    // Exact match
    if (carNorm === actualNorm) {
      score = 100;
    } else {
      // Word overlap
      const actualWords = actualCarName.toLowerCase().split(/\s+/);
      const carWords = car.name.toLowerCase().split(/\s+/);
      const commonWords = actualWords.filter(w => 
        carWords.some(cw => cw.includes(w) || w.includes(cw))
      );
      score = (commonWords.length / Math.max(actualWords.length, carWords.length)) * 50;
      
      // Substring match bonus
      if (actualNorm.includes(carNorm) || carNorm.includes(actualNorm)) {
        score += 30;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = car;
    }
  }
  
  // Require minimum score
  return bestScore >= 30 ? bestMatch : null;
}

// Get or create track
async function getOrCreateTrack(trackName) {
  const slug = trackName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  
  // Try to find existing
  const { data: existing } = await supabase
    .from('track_venues')
    .select('id, name, slug')
    .or(`slug.eq.${slug},name.ilike.%${trackName.split(' ')[0]}%`)
    .limit(1)
    .maybeSingle();
  
  if (existing) return existing;
  
  // Create new
  const { data: created, error } = await supabase
    .from('track_venues')
    .insert({
      slug,
      name: trackName,
      metadata: { source: 'fastestlaps' }
    })
    .select()
    .single();
  
  if (error) {
    console.error(`  Failed to create track ${trackName}:`, error.message);
    return null;
  }
  
  return created;
}

// Insert lap time
async function insertLapTime(data) {
  // Check for duplicate
  const { data: existing } = await supabase
    .from('car_track_lap_times')
    .select('id')
    .eq('car_id', data.car_id)
    .eq('track_id', data.track_id)
    .eq('lap_time_ms', data.lap_time_ms)
    .maybeSingle();
  
  if (existing) return { skipped: true };
  
  const { error } = await supabase
    .from('car_track_lap_times')
    .insert(data);
  
  if (error) {
    console.error(`  Insert error:`, error.message);
    return { error };
  }
  
  return { inserted: true };
}

// Parse FastestLaps car page markdown
function parseLapTimes(markdown, sourceUrl) {
  const lapTimes = [];
  const lines = markdown.split('\n');
  
  // Pattern for markdown table rows with track links
  const tableRowPattern = /\|\s*\[([^\]]+)\]\([^)]+\)\s*\|\s*\[?(\d{1,2}:\d{2}\.\d{1,3})\]?\(?([^)|]*)\)?/;
  
  for (const line of lines) {
    const match = line.match(tableRowPattern);
    if (match) {
      const trackName = match[1].trim();
      const lapTimeText = match[2];
      const testUrl = match[3] || '';
      const lapTimeMs = parseLapTimeToMs(lapTimeText);
      
      if (lapTimeMs && trackName) {
        lapTimes.push({
          track_name: trackName,
          lap_time_text: lapTimeText,
          lap_time_ms: lapTimeMs,
          source_url: testUrl && testUrl.includes('/tests/') 
            ? (testUrl.startsWith('http') ? testUrl : `https://fastestlaps.com${testUrl}`)
            : sourceUrl,
        });
      }
    }
  }
  
  return lapTimes;
}

// Scrape a single vehicle
async function scrapeVehicle(vehicle, stats, dryRun) {
  console.log(`\n🔍 Searching: ${vehicle.search}`);
  
  // Search FastestLaps
  const searchUrl = `https://fastestlaps.com/search?query=${encodeURIComponent(vehicle.search)}`;
  
  const searchResult = await firecrawlClient.scrapeUrl(searchUrl, {
    formats: ['links'],
    onlyMainContent: true,
  });
  
  if (!searchResult.success) {
    console.log(`  ❌ Search failed`);
    stats.errors.push({ vehicle: vehicle.search, error: 'Search failed' });
    return;
  }
  
  // Find model page links
  const modelLinks = (searchResult.links || [])
    .filter(link => link.includes('/models/'))
    .map(link => {
      if (link.startsWith('http')) {
        try { return new URL(link).pathname; } catch { return link; }
      }
      return link;
    })
    .slice(0, 5); // Take top 5 matches
  
  if (modelLinks.length === 0) {
    console.log(`  ⚠️ No model pages found`);
    return;
  }
  
  console.log(`  Found ${modelLinks.length} model pages`);
  
  for (const modelLink of modelLinks) {
    const modelSlug = modelLink.replace(/^\/models\//, '').split('/')[0];
    const modelUrl = `https://fastestlaps.com/models/${modelSlug}`;
    
    // Scrape model page
    const pageResult = await firecrawlClient.scrapeUrl(modelUrl, {
      formats: ['markdown'],
      onlyMainContent: true,
    });
    
    if (!pageResult.success) continue;
    
    // Extract actual car name from title
    let actualCarName = null;
    if (pageResult.title) {
      const titleMatch = pageResult.title.match(/^(.+?)(?:\s+specs|\s+lap times|\s+-)/i);
      actualCarName = titleMatch ? titleMatch[1].trim() : pageResult.title.split('-')[0].trim();
    }
    
    if (!actualCarName) continue;
    
    // Find matching car in our database
    const car = await findMatchingCar(actualCarName, vehicle.patterns);
    
    if (!car) {
      console.log(`  ⏭️ No DB match: ${actualCarName}`);
      stats.unmatched.add(actualCarName);
      continue;
    }
    
    console.log(`  ✅ Matched: "${actualCarName}" → ${car.name}`);
    
    // Parse lap times
    const lapTimes = parseLapTimes(pageResult.markdown, modelUrl);
    stats.lapTimesFound += lapTimes.length;
    
    if (lapTimes.length === 0) {
      console.log(`     No lap times on page`);
      continue;
    }
    
    console.log(`     Found ${lapTimes.length} lap times`);
    
    // Insert lap times
    for (const lt of lapTimes) {
      const track = await getOrCreateTrack(lt.track_name);
      if (!track) continue;
      
      if (dryRun) {
        console.log(`     [DRY-RUN] ${lt.track_name}: ${lt.lap_time_text}`);
        continue;
      }
      
      const result = await insertLapTime({
        car_id: car.id,
        track_id: track.id,
        lap_time_ms: lt.lap_time_ms,
        lap_time_text: lt.lap_time_text,
        is_stock: true,
        source_url: lt.source_url,
        confidence: 0.85,
      });
      
      if (result.inserted) {
        stats.inserted++;
      } else if (result.skipped) {
        stats.skipped++;
      }
    }
    
    stats.carsProcessed++;
    
    // Rate limit between pages
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Rate limit between vehicles
  await new Promise(r => setTimeout(r, 1500));
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const startIdx = args.find(a => a.startsWith('--start='));
  const start = startIdx ? parseInt(startIdx.split('=')[1], 10) : 0;
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : PRIORITY_VEHICLES.length;
  
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     Priority Vehicle Lap Times Scraper                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log(`\nMode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Vehicles: ${start + 1} to ${Math.min(start + limit, PRIORITY_VEHICLES.length)} of ${PRIORITY_VEHICLES.length}`);
  
  if (!firecrawlClient.isFirecrawlConfigured()) {
    console.error('\n❌ FIRECRAWL_API_KEY not configured');
    process.exit(1);
  }
  
  const stats = {
    carsProcessed: 0,
    lapTimesFound: 0,
    inserted: 0,
    skipped: 0,
    unmatched: new Set(),
    errors: [],
  };
  
  const vehiclesToProcess = PRIORITY_VEHICLES.slice(start, start + limit);
  
  for (let i = 0; i < vehiclesToProcess.length; i++) {
    const vehicle = vehiclesToProcess[i];
    const progress = `[${i + 1}/${vehiclesToProcess.length}]`;
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`${progress} Processing: ${vehicle.search}`);
    
    try {
      await scrapeVehicle(vehicle, stats, dryRun);
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}`);
      stats.errors.push({ vehicle: vehicle.search, error: err.message });
    }
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('═'.repeat(60));
  console.log(`  Cars processed: ${stats.carsProcessed}`);
  console.log(`  Lap times found: ${stats.lapTimesFound}`);
  console.log(`  Inserted: ${stats.inserted}`);
  console.log(`  Skipped (duplicates): ${stats.skipped}`);
  console.log(`  Unmatched cars: ${stats.unmatched.size}`);
  console.log(`  Errors: ${stats.errors.length}`);
  
  if (stats.unmatched.size > 0) {
    console.log('\n⚠️ Unmatched cars (consider adding to DB):');
    [...stats.unmatched].slice(0, 20).forEach(name => console.log(`  - ${name}`));
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
