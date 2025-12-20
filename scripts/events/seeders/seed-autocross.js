#!/usr/bin/env node
/**
 * Seed SCCA Solo (Autocross) events for 2026
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

async function loadEventData() {
  const dataPath = join(__dirname, '..', 'data', 'autocross-2026.json');
  const content = await readFile(dataPath, 'utf-8');
  return JSON.parse(content);
}

async function main() {
  const client = createClientOrThrow();
  console.log('🏁 Seeding autocross events for 2026...\n');

  const { events } = await loadEventData();
  const typeCache = new Map();
  let created = 0;
  let updated = 0;

  for (const event of events) {
    const { event_type, ...eventData } = event;
    const slug = buildEventSlug(event.name, event.city, event.start_date);
    const region = mapRegion(event.state);

    if (!typeCache.has(event_type)) {
      typeCache.set(event_type, await getEventTypeId(client, event_type));
    }
    const event_type_id = typeCache.get(event_type);

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
      country: eventData.country || 'USA',
    };

    await upsertEvent(client, payload);

    if (existing?.id) {
      updated += 1;
      console.log(`🔄 Updated ${event.name}`);
    } else {
      created += 1;
      console.log(`✅ Inserted ${event.name}`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Total: ${events.length}`);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});








