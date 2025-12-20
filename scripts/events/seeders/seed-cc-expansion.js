#!/usr/bin/env node
/**
 * Seed additional Cars & Coffee events for underserved cities
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
  generateRecurringDates,
  createClientOrThrow,
} from '../lib/event-helpers.js';

const YEAR = 2026;
const EVENT_TYPE_SLUG = 'cars-and-coffee';

async function loadEventData() {
  const dataPath = join(__dirname, '..', 'data', 'cars-and-coffee-expansion.json');
  const content = await readFile(dataPath, 'utf-8');
  return JSON.parse(content);
}

async function main() {
  const client = createClientOrThrow();
  console.log(`☕ Seeding expanded Cars & Coffee events for ${YEAR}...\n`);

  const { events } = await loadEventData();
  const event_type_id = await getEventTypeId(client, EVENT_TYPE_SLUG);
  
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const baseEvent of events) {
    const { recurrence, ...eventData } = baseEvent;
    
    // Generate dates for the recurrence pattern
    const dates = generateRecurringDates(recurrence, YEAR);
    
    if (dates.length === 0) {
      console.warn(`⚠️  No dates parsed for ${baseEvent.name} (${recurrence})`);
      skipped++;
      continue;
    }

    // Create event for each date
    for (const start_date of dates) {
      const slug = buildEventSlug(baseEvent.name, baseEvent.city, start_date);
      const region = mapRegion(baseEvent.state);

      const eventPayload = {
        ...eventData,
        slug,
        start_date,
        end_date: start_date,
        event_type_id,
        region,
        scope: 'local',
        featured: false,
        cost_text: 'Free',
        is_free: true,
      };

      const { data: existing } = await client
        .from('events')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      await upsertEvent(client, eventPayload);

      if (existing?.id) {
        updated++;
      } else {
        created++;
      }
    }

    console.log(`✅ ${baseEvent.name} - ${baseEvent.city}, ${baseEvent.state} (${dates.length} dates)`);
  }

  console.log('\n📊 Summary:');
  console.log(`  Venues processed: ${events.length}`);
  console.log(`  Events created: ${created}`);
  console.log(`  Events updated: ${updated}`);
  console.log(`  Skipped (no dates): ${skipped}`);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});







