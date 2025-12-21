#!/usr/bin/env node
/**
 * Massive Cars & Coffee Seeder
 * 
 * Takes C&C venues and generates all recurring 2026 events
 * 
 * Run: node scripts/events/seeders/seed-cc-massive.js
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
    // Find first Saturday
    while (date.getDay() !== 6) {
      date.setDate(date.getDate() + 1);
    }
    while (date.getFullYear() === year) {
      dates.push(new Date(date));
      date.setDate(date.getDate() + 7);
    }
    return dates;
  }
  
  // Every Sunday
  if (rec.includes('every sunday')) {
    let date = new Date(year, 0, 1);
    // Find first Sunday
    while (date.getDay() !== 0) {
      date.setDate(date.getDate() + 1);
    }
    while (date.getFullYear() === year) {
      dates.push(new Date(date));
      date.setDate(date.getDate() + 7);
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
  
  const firstDay = new Date(year, month, 1);
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
  console.log('🚀 Massive Cars & Coffee Seeder\n');
  console.log('═'.repeat(60));
  
  const dataPath = join(__dirname, '..', 'data', 'cars-coffee-massive-expansion.json');
  const raw = await readFile(dataPath, 'utf-8');
  const { venues, description } = JSON.parse(raw);
  
  console.log(`📋 ${description}`);
  console.log(`📍 Venues to process: ${venues.length}\n`);
  
  const client = createClientOrThrow();
  const ccTypeId = await getEventTypeId(client, 'cars-and-coffee');
  
  if (!ccTypeId) {
    throw new Error('Could not find cars-and-coffee event type');
  }
  
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  let totalEvents = 0;
  
  for (const venue of venues) {
    const dates = generateDates(venue.recurrence);
    
    if (dates.length === 0) {
      console.warn(`⚠️  No dates parsed for: ${venue.name} (${venue.recurrence})`);
      continue;
    }
    
    console.log(`\n📍 ${venue.name} (${venue.city}, ${venue.state})`);
    console.log(`   Recurrence: ${venue.recurrence} → ${dates.length} events`);
    
    let venueCreated = 0;
    let venueUpdated = 0;
    let venueErrors = 0;
    
    for (const date of dates) {
      totalEvents++;
      const dateStr = formatDate(date);
      
      try {
        const slug = buildEventSlug(venue.name, venue.city, dateStr);
        const region = mapRegion(venue.state);
        
        const { data: existing } = await client
          .from('events')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();
        
        const payload = {
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
          description: `Weekly/monthly Cars & Coffee gathering. All vehicles welcome.`,
          event_type_id: ccTypeId,
          region,
          country: 'USA',
        };
        
        await upsertEvent(client, payload, { carAffinities: [] });
        
        if (existing?.id) {
          venueUpdated++;
        } else {
          venueCreated++;
        }
      } catch (err) {
        venueErrors++;
        // Don't log every error, just count them
      }
    }
    
    totalCreated += venueCreated;
    totalUpdated += venueUpdated;
    totalErrors += venueErrors;
    
    console.log(`   ✅ Created: ${venueCreated} | 🔄 Updated: ${venueUpdated} | ❌ Errors: ${venueErrors}`);
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 FINAL SUMMARY:');
  console.log('═'.repeat(60));
  console.log(`  Venues processed: ${venues.length}`);
  console.log(`  Total events attempted: ${totalEvents}`);
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









