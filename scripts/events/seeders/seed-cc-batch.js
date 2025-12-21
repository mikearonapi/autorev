#!/usr/bin/env node
/**
 * Batch Cars & Coffee Seeder
 * 
 * Reads venue data from a JSON file and generates all 2026 recurring events.
 * 
 * Usage: 
 *   node scripts/events/seeders/seed-cc-batch.js [json-file]
 *   node scripts/events/seeders/seed-cc-batch.js scripts/events/data/cc-batch-texas.json
 * 
 * JSON Format:
 * {
 *   "batch": "Texas Cities",
 *   "venues": [
 *     {
 *       "name": "Cars & Coffee Austin",
 *       "city": "Austin",
 *       "state": "TX",
 *       "venue_name": "The Domain",
 *       "address": "11600 Century Oaks Terrace",
 *       "zip": "78758",
 *       "lat": 30.4021,
 *       "lng": -97.7254,
 *       "recurrence": "1st Saturday monthly",
 *       "source_url": "https://example.com"
 *     }
 *   ]
 * }
 */

import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '..', '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '..', '..', '.env') });

import {
  buildEventSlug,
  mapRegion,
  getEventTypeId,
  upsertEvent,
  createClientOrThrow,
} from '../lib/event-helpers.js';

/**
 * Generate dates for a recurrence pattern in 2026
 */
function generateDates(recurrence, year = 2026) {
  const dates = [];
  const rec = recurrence.toLowerCase();
  
  // Every Saturday
  if (rec.includes('every saturday')) {
    let date = new Date(year, 0, 1);
    while (date.getDay() !== 6) date.setDate(date.getDate() + 1);
    while (date.getFullYear() === year) {
      dates.push(new Date(date));
      date.setDate(date.getDate() + 7);
    }
    return dates;
  }
  
  // Every Sunday
  if (rec.includes('every sunday')) {
    let date = new Date(year, 0, 1);
    while (date.getDay() !== 0) date.setDate(date.getDate() + 1);
    while (date.getFullYear() === year) {
      dates.push(new Date(date));
      date.setDate(date.getDate() + 7);
    }
    return dates;
  }
  
  // Bi-weekly patterns
  if (rec.includes('1st and 3rd')) {
    const weekday = rec.includes('saturday') ? 6 : rec.includes('sunday') ? 0 : 6;
    for (let month = 0; month < 12; month++) {
      [1, 3].forEach(week => {
        const d = getNthWeekdayOfMonth(year, month, weekday, week);
        if (d) dates.push(d);
      });
    }
    return dates;
  }
  
  if (rec.includes('2nd and 4th')) {
    const weekday = rec.includes('saturday') ? 6 : rec.includes('sunday') ? 0 : 6;
    for (let month = 0; month < 12; month++) {
      [2, 4].forEach(week => {
        const d = getNthWeekdayOfMonth(year, month, weekday, week);
        if (d) dates.push(d);
      });
    }
    return dates;
  }
  
  // Monthly patterns
  const monthlyPatterns = [
    { pattern: /1st saturday/i, weekday: 6, week: 1 },
    { pattern: /2nd saturday/i, weekday: 6, week: 2 },
    { pattern: /3rd saturday/i, weekday: 6, week: 3 },
    { pattern: /4th saturday/i, weekday: 6, week: 4 },
    { pattern: /last saturday/i, weekday: 6, week: -1 },
    { pattern: /1st sunday/i, weekday: 0, week: 1 },
    { pattern: /2nd sunday/i, weekday: 0, week: 2 },
    { pattern: /3rd sunday/i, weekday: 0, week: 3 },
    { pattern: /4th sunday/i, weekday: 0, week: 4 },
    { pattern: /last sunday/i, weekday: 0, week: -1 },
  ];
  
  for (const mp of monthlyPatterns) {
    if (mp.pattern.test(rec)) {
      for (let month = 0; month < 12; month++) {
        const d = getNthWeekdayOfMonth(year, month, mp.weekday, mp.week);
        if (d) dates.push(d);
      }
      return dates;
    }
  }
  
  console.warn(`⚠️  Unknown recurrence pattern: "${recurrence}"`);
  return dates;
}

function getNthWeekdayOfMonth(year, month, weekday, n) {
  if (n === -1) {
    // Last weekday of month
    const lastDay = new Date(year, month + 1, 0);
    while (lastDay.getDay() !== weekday) {
      lastDay.setDate(lastDay.getDate() - 1);
    }
    return lastDay;
  }
  
  let count = 0;
  for (let day = 1; day <= 31; day++) {
    const d = new Date(year, month, day);
    if (d.getMonth() !== month) break;
    if (d.getDay() === weekday) {
      count++;
      if (count === n) return d;
    }
  }
  return null;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node seed-cc-batch.js <json-file>');
    console.log('Example: node seed-cc-batch.js ../data/cc-batch-texas.json');
    process.exit(1);
  }
  
  const jsonPath = args[0].startsWith('/') ? args[0] : join(process.cwd(), args[0]);
  
  console.log('🚀 Batch Cars & Coffee Seeder\n');
  console.log('═'.repeat(60));
  
  const raw = await readFile(jsonPath, 'utf-8');
  const { batch, venues } = JSON.parse(raw);
  
  console.log(`📋 Batch: ${batch}`);
  console.log(`📍 Venues to process: ${venues.length}\n`);
  
  const client = createClientOrThrow();
  const ccTypeId = await getEventTypeId(client, 'cars-and-coffee');
  
  if (!ccTypeId) {
    throw new Error('Could not find cars-and-coffee event type');
  }
  
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  
  for (const venue of venues) {
    const dates = generateDates(venue.recurrence);
    
    if (dates.length === 0) {
      console.warn(`⚠️  No dates for: ${venue.name} (${venue.recurrence})`);
      continue;
    }
    
    console.log(`\n📍 ${venue.name} (${venue.city}, ${venue.state})`);
    console.log(`   ${venue.recurrence} → ${dates.length} events`);
    
    let created = 0, updated = 0, errors = 0;
    
    for (const date of dates) {
      const dateStr = formatDate(date);
      
      try {
        const slug = buildEventSlug(venue.name, venue.city, dateStr);
        const region = mapRegion(venue.state);
        
        const { data: existing } = await client
          .from('events')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();
        
        await upsertEvent(client, {
          name: venue.name,
          slug,
          city: venue.city,
          state: venue.state,
          venue_name: venue.venue_name,
          address: venue.address,
          zip: venue.zip,
          latitude: venue.lat,
          longitude: venue.lng,
          start_date: dateStr,
          end_date: dateStr,
          source_url: venue.source_url,
          cost_text: 'Free',
          is_free: true,
          scope: 'regional',
          featured: false,
          description: venue.description || 'Cars & Coffee gathering. All vehicles welcome.',
          event_type_id: ccTypeId,
          region,
          country: 'USA',
        }, { carAffinities: [] });
        
        if (existing?.id) updated++;
        else created++;
      } catch (err) {
        errors++;
      }
    }
    
    totalCreated += created;
    totalUpdated += updated;
    totalErrors += errors;
    
    console.log(`   ✅ Created: ${created} | 🔄 Updated: ${updated} | ❌ Errors: ${errors}`);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 BATCH SUMMARY:');
  console.log('═'.repeat(60));
  console.log(`  Venues: ${venues.length}`);
  console.log(`  Created: ${totalCreated}`);
  console.log(`  Updated: ${totalUpdated}`);
  console.log(`  Errors: ${totalErrors}`);
  
  const { count } = await client
    .from('events')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📈 Total events in database: ${count}`);
}

main().catch((err) => {
  console.error('❌ Seeder failed:', err);
  process.exit(1);
});









