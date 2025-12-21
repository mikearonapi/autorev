#!/usr/bin/env node
/**
 * Seed Missing Major Events
 * 
 * Adds major events that were identified as missing from gap analysis
 * 
 * Run: node scripts/events/seeders/seed-missing-major.js
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
  console.log('🔧 Seeding Missing Major Events\n');
  
  const dataPath = join(__dirname, '..', 'data', 'missing-major-events-2026.json');
  const raw = await readFile(dataPath, 'utf-8');
  const { events, description } = JSON.parse(raw);
  
  console.log(`📋 ${description}`);
  console.log(`📊 Events to add: ${events.length}\n`);
  
  const client = createClientOrThrow();
  const typeCache = new Map();
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const event of events) {
    try {
      const { event_type, brand_affinity, verified, ...eventData } = event;
      
      if (!typeCache.has(event_type)) {
        typeCache.set(event_type, await getEventTypeId(client, event_type));
      }
      const event_type_id = typeCache.get(event_type);
      
      if (!event_type_id) {
        console.warn(`⚠️  Unknown event type: ${event_type} for "${event.name}"`);
        errors++;
        continue;
      }
      
      const slug = buildEventSlug(event.name, event.city, event.start_date);
      const region = mapRegion(event.state);
      
      // Check if exists
      const { data: existing } = await client
        .from('events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      
      const payload = {
        ...eventData,
        slug,
        event_type_id,
        region,
        country: 'USA',
      };
      
      const carAffinities = brand_affinity
        ? [{ brand: brand_affinity, affinity_type: 'featured' }]
        : [];
      
      await upsertEvent(client, payload, { carAffinities });
      
      if (existing?.id) {
        updated++;
        console.log(`🔄 Updated: ${event.name}`);
      } else {
        created++;
        console.log(`✅ Created: ${event.name} (${event.start_date})`);
      }
    } catch (err) {
      errors++;
      console.error(`❌ Error: ${event.name} - ${err.message}`);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Errors: ${errors}`);
  
  const { count } = await client
    .from('events')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\n📈 Total events in database: ${count}`);
}

main().catch((err) => {
  console.error('❌ Seeder failed:', err);
  process.exit(1);
});









