#!/usr/bin/env node
/**
 * Enrich 2026 events from configured sources (Eventbrite-first).
 *
 * Why this script exists:
 * - Lets us enrich the DB immediately without needing the Next.js server running.
 * - Uses the same event_sources + fetcher architecture as the cron route.
 *
 * Required env vars (via .env.local):
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - EVENTBRITE_API_TOKEN (only needed if Eventbrite source is used)
 *
 * Usage:
 *   node scripts/enrich-events-2026-from-sources.js --dryRun=true --limit=200
 *   node scripts/enrich-events-2026-from-sources.js --sources=Eventbrite --limit=500
 */

import 'dotenv/config';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

import { fetchFromSource, getRegionFromState } from '../lib/eventSourceFetchers/index.js';
import { deduplicateBatch } from '../lib/eventDeduplication.js';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function parseArgs(argv) {
  const out = {};
  for (const arg of argv) {
    if (!arg.startsWith('--')) continue;
    const [k, vRaw] = arg.slice(2).split('=');
    const v = vRaw === undefined ? true : vRaw;
    out[k] = v;
  }
  return out;
}

function generateSlug(name, city, startDate) {
  const base = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

  const location = String(city || 'usa')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 20);

  const date = String(startDate || '').replace(/-/g, '').substring(0, 8);
  return `${base}-${location}-${date}`.substring(0, 80);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = String(args.dryRun || 'false') === 'true';
  const limit = args.limit ? Number(args.limit) : 300;
  const sourcesArg = args.sources ? String(args.sources) : 'Eventbrite';
  const sourcesToRun = sourcesArg.split(',').map((s) => s.trim()).filter(Boolean);

  // Default range = entire 2026
  const rangeStart = args.rangeStart ? String(args.rangeStart) : '2026-01-01T00:00:00Z';
  const rangeEnd = args.rangeEnd ? String(args.rangeEnd) : '2026-12-31T23:59:59Z';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Enrich Events (2026) - Sources');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`dryRun: ${dryRun}`);
  console.log(`sources: ${sourcesToRun.join(', ')}`);
  console.log(`limit: ${limit}`);
  console.log(`range: ${rangeStart} .. ${rangeEnd}`);
  console.log('');

  // Preload event types
  const { data: eventTypes, error: eventTypesErr } = await supabase
    .from('event_types')
    .select('id, slug');
  if (eventTypesErr) {
    console.error('❌ Failed to fetch event_types:', eventTypesErr.message);
    process.exit(1);
  }
  const eventTypeIdBySlug = new Map((eventTypes || []).map((t) => [t.slug, t.id]));
  const otherTypeId = eventTypeIdBySlug.get('other') || null;

  // Load source configs
  const { data: sources, error: sourcesErr } = await supabase
    .from('event_sources')
    .select('*')
    .in('name', sourcesToRun);
  if (sourcesErr) {
    console.error('❌ Failed to fetch event_sources:', sourcesErr.message);
    process.exit(1);
  }
  const sourcesFound = sources || [];
  const missing = sourcesToRun.filter((s) => !sourcesFound.some((x) => x.name === s));
  if (missing.length > 0) {
    console.error(`❌ Missing event_sources rows: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Existing events for dedupe + slug collision detection (2026 approved + pending)
  const { data: existingEvents, error: existingErr } = await supabase
    .from('events')
    .select('id, slug, name, source_url, start_date, city, state')
    .gte('start_date', '2026-01-01')
    .lt('start_date', '2027-01-01');
  if (existingErr) {
    console.error('❌ Failed to fetch existing events:', existingErr.message);
    process.exit(1);
  }
  const existingEventsList = existingEvents || [];
  const existingSlugSet = new Set(existingEventsList.map((e) => e.slug));

  let totalDiscovered = 0;
  let totalUnique = 0;
  let totalInserted = 0;
  const allErrors = [];

  for (const source of sourcesFound) {
    console.log(`\n--- Source: ${source.name} ---`);
    const { events: rawEvents, errors } = await fetchFromSource(source, {
      limit,
      dryRun: false, // fetch even in dryRun so we can preview counts
      rangeStart,
      rangeEnd,
    });
    totalDiscovered += rawEvents.length;
    if (errors?.length) {
      for (const e of errors) allErrors.push(`[${source.name}] ${e}`);
    }

    // Deduplicate vs existing (URL/name/date/city logic)
    const { unique, duplicates } = deduplicateBatch(rawEvents, existingEventsList);
    totalUnique += unique.length;
    console.log(`discovered: ${rawEvents.length}, duplicates: ${duplicates.length}, unique: ${unique.length}`);

    // Prepare rows
    const rows = [];
    for (const ev of unique) {
      const eventTypeId =
        (ev.event_type_slug && eventTypeIdBySlug.get(ev.event_type_slug)) || otherTypeId || null;

      const region = ev.region || (ev.state ? getRegionFromState(ev.state) : null);
      const baseSlug = generateSlug(ev.name, ev.city, ev.start_date);
      let slug = baseSlug;
      let counter = 1;
      while (existingSlugSet.has(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter += 1;
      }
      existingSlugSet.add(slug);

      rows.push({
        slug,
        name: ev.name,
        description: ev.description,
        event_type_id: eventTypeId,
        start_date: ev.start_date,
        end_date: ev.end_date,
        start_time: ev.start_time,
        end_time: ev.end_time,
        timezone: ev.timezone || 'America/New_York',
        venue_name: ev.venue_name,
        address: ev.address,
        city: ev.city,
        state: ev.state,
        zip: ev.zip,
        country: ev.country || 'USA',
        latitude: ev.latitude,
        longitude: ev.longitude,
        region,
        scope: ev.scope || 'local',
        source_url: ev.source_url,
        source_name: source.name,
        registration_url: ev.registration_url,
        image_url: ev.image_url,
        cost_text: ev.cost_text,
        is_free: Boolean(ev.is_free),
        status: 'approved',
        featured: false,
      });
    }

    if (dryRun) {
      console.log(`[DRY RUN] Would insert ${rows.length} events for ${source.name}`);
      continue;
    }

    if (rows.length === 0) continue;
    const { data: inserted, error: insertErr } = await supabase.from('events').insert(rows).select('id');
    if (insertErr) {
      console.error(`❌ Insert failed for ${source.name}:`, insertErr.message);
      allErrors.push(`[${source.name}] Insert failed: ${insertErr.message}`);
      continue;
    }
    const insertedCount = inserted?.length || 0;
    totalInserted += insertedCount;
    console.log(`inserted: ${insertedCount}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`discovered: ${totalDiscovered}`);
  console.log(`unique:     ${totalUnique}`);
  console.log(`inserted:   ${totalInserted}${dryRun ? ' (dry run)' : ''}`);
  console.log(`errors:     ${allErrors.length}`);
  if (allErrors.length) {
    console.log('\nErrors (first 20):');
    allErrors.slice(0, 20).forEach((e) => console.log(`- ${e}`));
  }
}

main().catch((err) => {
  console.error('❌ Fatal:', err);
  process.exit(1);
});


