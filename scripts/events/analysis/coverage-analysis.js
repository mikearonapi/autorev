#!/usr/bin/env node
/**
 * Event Coverage Analysis
 * 
 * Analyzes event coverage across top US cities to identify gaps.
 * 
 * Usage:
 *   node scripts/events/analysis/coverage-analysis.js
 *   node scripts/events/analysis/coverage-analysis.js --category=cars-and-coffee
 *   node scripts/events/analysis/coverage-analysis.js --top=100
 */
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '..', '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '..', '..', '.env') });

import { createClientOrThrow } from '../lib/event-helpers.js';

// Haversine formula for distance calculation
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    category: null,
    top: 500,
    radius: 30, // miles
  };
  
  for (const arg of args) {
    if (arg.startsWith('--category=')) {
      options.category = arg.split('=')[1];
    } else if (arg.startsWith('--top=')) {
      options.top = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--radius=')) {
      options.radius = parseInt(arg.split('=')[1], 10);
    }
  }
  
  return options;
}

async function loadCities() {
  const dataPath = join(__dirname, '..', 'data', 'top-500-cities.json');
  const content = await readFile(dataPath, 'utf-8');
  return JSON.parse(content).cities;
}

async function loadEvents(client, category) {
  let query = client
    .from('events')
    .select(`
      id,
      name,
      city,
      state,
      latitude,
      longitude,
      start_date,
      event_types!inner(slug, name)
    `)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);
  
  if (category) {
    query = query.eq('event_types.slug', category);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw new Error(`Failed to load events: ${error.message}`);
  }
  
  return data || [];
}

async function main() {
  const options = parseArgs();
  const client = createClientOrThrow();
  
  console.log('📊 Event Coverage Analysis\n');
  console.log(`Options: top=${options.top} cities, radius=${options.radius}mi${options.category ? `, category=${options.category}` : ''}\n`);
  
  // Load data
  const allCities = await loadCities();
  const cities = allCities.slice(0, options.top);
  const events = await loadEvents(client, options.category);
  
  console.log(`Loaded ${cities.length} cities and ${events.length} events\n`);
  
  // Analyze coverage
  const coverage = [];
  let wellCovered = 0;
  let underserved = 0;
  let noCoverage = 0;
  
  for (const city of cities) {
    // Find events within radius
    const nearbyEvents = events.filter(event => {
      if (!event.latitude || !event.longitude) return false;
      const distance = haversineDistance(
        city.lat, city.lng,
        event.latitude, event.longitude
      );
      return distance <= options.radius;
    });
    
    // Count unique venues (by name + city)
    const uniqueVenues = new Set(
      nearbyEvents.map(e => `${e.name}-${e.city}`)
    );
    
    const result = {
      rank: city.rank,
      city: city.city,
      state: city.state,
      population: city.population,
      eventsNearby: nearbyEvents.length,
      uniqueVenues: uniqueVenues.size,
      status: 'unknown',
    };
    
    if (uniqueVenues.size >= 2) {
      result.status = 'covered';
      wellCovered++;
    } else if (uniqueVenues.size === 1) {
      result.status = 'underserved';
      underserved++;
    } else {
      result.status = 'no_coverage';
      noCoverage++;
    }
    
    coverage.push(result);
  }
  
  // Summary
  console.log('━'.repeat(60));
  console.log('SUMMARY');
  console.log('━'.repeat(60));
  console.log(`✅ Well covered (2+ venues within ${options.radius}mi): ${wellCovered} cities`);
  console.log(`⚠️  Underserved (1 venue): ${underserved} cities`);
  console.log(`❌ No coverage: ${noCoverage} cities`);
  console.log(`\nCoverage rate: ${((wellCovered / cities.length) * 100).toFixed(1)}%`);
  
  // Top underserved cities
  console.log('\n━'.repeat(60));
  console.log('TOP UNDERSERVED CITIES (by population)');
  console.log('━'.repeat(60));
  
  const underservedCities = coverage
    .filter(c => c.status !== 'covered')
    .sort((a, b) => b.population - a.population)
    .slice(0, 20);
  
  console.log('\n| Rank | City | State | Pop | Venues | Status |');
  console.log('|------|------|-------|-----|--------|--------|');
  
  for (const city of underservedCities) {
    const pop = city.population >= 1000000 
      ? `${(city.population / 1000000).toFixed(1)}M`
      : `${(city.population / 1000).toFixed(0)}K`;
    console.log(`| ${city.rank} | ${city.city} | ${city.state} | ${pop} | ${city.uniqueVenues} | ${city.status} |`);
  }
  
  // Well covered cities sample
  console.log('\n━'.repeat(60));
  console.log('WELL COVERED CITIES (sample)');
  console.log('━'.repeat(60));
  
  const coveredSample = coverage
    .filter(c => c.status === 'covered')
    .slice(0, 10);
  
  console.log('\n| Rank | City | State | Venues | Events |');
  console.log('|------|------|-------|--------|--------|');
  
  for (const city of coveredSample) {
    console.log(`| ${city.rank} | ${city.city} | ${city.state} | ${city.uniqueVenues} | ${city.eventsNearby} |`);
  }
  
  // Category breakdown (if no category filter)
  if (!options.category) {
    console.log('\n━'.repeat(60));
    console.log('EVENTS BY CATEGORY');
    console.log('━'.repeat(60));
    
    const { data: categoryData } = await client
      .from('events')
      .select('event_types!inner(slug, name)')
      .not('latitude', 'is', null);
    
    const categoryCounts = {};
    for (const event of categoryData || []) {
      const slug = event.event_types?.slug || 'unknown';
      categoryCounts[slug] = (categoryCounts[slug] || 0) + 1;
    }
    
    console.log('\n| Category | Count |');
    console.log('|----------|-------|');
    for (const [slug, count] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
      console.log(`| ${slug} | ${count} |`);
    }
  }
  
  // Virginia focus (user's example)
  console.log('\n━'.repeat(60));
  console.log('VIRGINIA COVERAGE (user example)');
  console.log('━'.repeat(60));
  
  const vaCities = coverage.filter(c => c.state === 'VA');
  const vaCovered = vaCities.filter(c => c.status === 'covered').length;
  const vaUnderserved = vaCities.filter(c => c.status !== 'covered').length;
  
  console.log(`\nVirginia cities in top ${options.top}: ${vaCities.length}`);
  console.log(`  ✅ Covered: ${vaCovered}`);
  console.log(`  ⚠️  Underserved/None: ${vaUnderserved}`);
  
  if (vaUnderserved > 0) {
    console.log('\nUnderserved VA cities:');
    vaCities
      .filter(c => c.status !== 'covered')
      .forEach(c => console.log(`  - ${c.city} (${c.uniqueVenues} venues)`));
  }
}

main().catch((err) => {
  console.error('❌ Analysis failed:', err);
  process.exit(1);
});








