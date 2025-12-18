#!/usr/bin/env node
/**
 * Generic Event Seeder
 * 
 * Seeds any event type from a JSON file.
 * 
 * Usage: node scripts/events/seeders/seed-generic.js <path-to-json>
 */

import dotenv from 'dotenv';
import { dirname, join, resolve } from 'path';
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
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node seed-generic.js <path-to-json>');
    process.exit(1);
  }
  
  const filePath = resolve(args[0]);
  console.log(`🚀 Generic Event Seeder\n`);
  console.log(`📁 Loading: ${filePath}\n`);
  
  const raw = await readFile(filePath, 'utf-8');
  const data = JSON.parse(raw);
  
  const events = data.events || data.venues || [];
  const batchName = data.batch || data.description || 'Unknown';
  
  console.log(`📋 Batch: ${batchName}`);
  console.log(`📊 Events to process: ${events.length}\n`);
  
  const client = createClientOrThrow();
  const typeCache = new Map();
  
  let created = 0;
  let updated = 0;
  let errors = 0;
  
  for (const event of events) {
    try {
      const { event_type, brand_affinity, verified, ...eventData } = event;
      
      if (!event_type) {
        console.warn(`⚠️  No event_type specified for "${event.name}"`);
        errors++;
        continue;
      }
      
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
        country: event.state === 'BC' || event.state === 'UK' ? (event.state === 'UK' ? 'UK' : 'Canada') : 'USA',
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
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 SUMMARY:');
  console.log('═'.repeat(60));
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
