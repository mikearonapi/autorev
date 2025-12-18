#!/usr/bin/env node
/**
 * Seed Verified 2026 Events
 * 
 * Populates/updates database with VERIFIED 2026 events that have
 * officially confirmed dates from authoritative sources.
 * 
 * Run: node scripts/events/seeders/seed-verified-2026.js
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

async function main() {
  console.log('🔒 Seeding VERIFIED 2026 Events\n');
  console.log('These events have officially confirmed dates from authoritative sources.\n');
  
  // Load verified events
  const dataPath = join(__dirname, '..', 'data', 'verified-2026-events.json');
  const raw = await readFile(dataPath, 'utf-8');
  const { events, verified_date, description } = JSON.parse(raw);
  
  console.log(`📅 Data verified: ${verified_date}`);
  console.log(`📊 Total events to process: ${events.length}\n`);
  
  const client = createClientOrThrow();
  const typeCache = new Map();
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const event of events) {
    try {
      const { event_type, brand_affinity, verified, source_verified, ...eventData } = event;
      
      // Get event type ID
      if (!typeCache.has(event_type)) {
        typeCache.set(event_type, await getEventTypeId(client, event_type));
      }
      const event_type_id = typeCache.get(event_type);
      
      if (!event_type_id) {
        console.warn(`⚠️  Unknown event type: ${event_type} for "${event.name}"`);
        errors++;
        continue;
      }
      
      // Build slug
      const slug = buildEventSlug(event.name, event.city, event.start_date);
      const region = mapRegion(event.state);
      
      // Check if event already exists by name pattern (to update projected dates)
      const baseName = event.name.replace(/\s*2026\s*/i, '').trim();
      const { data: existing } = await client
        .from('events')
        .select('id, name, start_date')
        .ilike('name', `%${baseName}%`)
        .gte('start_date', '2026-01-01')
        .lte('start_date', '2026-12-31')
        .maybeSingle();
      
      const payload = {
        ...eventData,
        slug,
        event_type_id,
        region,
        country: 'USA',
      };
      
      // Add car affinity if specified
      const carAffinities = brand_affinity
        ? [{ brand: brand_affinity, affinity_type: 'featured' }]
        : [];
      
      await upsertEvent(client, payload, { carAffinities });
      
      if (existing?.id) {
        // Check if dates changed
        if (existing.start_date !== event.start_date) {
          console.log(`🔄 Updated: ${event.name}`);
          console.log(`   Old date: ${existing.start_date} → New date: ${event.start_date}`);
        } else {
          console.log(`✓  Verified: ${event.name} (${event.start_date})`);
        }
        updated++;
      } else {
        console.log(`✅ Created: ${event.name} (${event.start_date} - ${event.end_date})`);
        created++;
      }
    } catch (err) {
      console.error(`❌ Error processing "${event.name}": ${err.message}`);
      errors++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`  Created: ${created}`);
  console.log(`  Updated/Verified: ${updated}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total: ${events.length}`);
  
  // Get total event count
  const { count } = await client
    .from('events')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📈 Total events in database: ${count}`);
}

main().catch((err) => {
  console.error('❌ Seeder failed:', err);
  process.exit(1);
});
