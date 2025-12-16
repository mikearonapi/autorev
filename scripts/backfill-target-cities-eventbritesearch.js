/**
 * Backfill events for target cities using EventbriteSearch (public search scraping).
 *
 * Goals:
 * - Increase REAL events coverage for top-500 cities, especially Cars & Coffee.
 * - Keep provenance: every insert is linked to a scrape_jobs run + event_sources row.
 *
 * Usage examples:
 *   node scripts/backfill-target-cities-eventbritesearch.js --only=Leesburg,VA --rangeStart=2025-12-01T00:00:00Z --rangeEnd=2026-03-31T23:59:59Z --limitPerCity=25
 *   node scripts/backfill-target-cities-eventbritesearch.js --priorityTier=1 --cityLimit=25 --rangeStart=2025-12-01T00:00:00Z --rangeEnd=2026-12-31T23:59:59Z
 */

import 'dotenv/config';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fetchFromSource } from '../lib/eventSourceFetchers/index.js';
import { deduplicateBatch } from '../lib/eventDeduplication.js';
import { buildEventRows } from '../lib/eventsIngestion/buildEventRows.js';

dotenv.config({ path: '.env.local' });

function parseArgs(argv) {
  const args = {};
  for (const a of argv.slice(2)) {
    const [k, ...rest] = a.replace(/^--/, '').split('=');
    args[k] = rest.length ? rest.join('=') : true;
  }
  return args;
}

function parseCityListOnly(str) {
  // "Leesburg,VA;Austin,TX"
  if (!str) return [];
  return String(str)
    .split(';')
    .map((x) => x.trim())
    .filter(Boolean)
    .map((pair) => {
      const [cityRaw, stateRaw] = pair.split(',').map((p) => p.trim());
      return { city: cityRaw, state: stateRaw?.toUpperCase() };
    })
    .filter((x) => x.city && x.state && x.state.length === 2);
}

async function main() {
  const args = parseArgs(process.argv);

  const rangeStart = args.rangeStart || null;
  const rangeEnd = args.rangeEnd || null;
  const dryRun = args.dryRun === 'true' || args.dryRun === true;
  const cityLimit = args.cityLimit ? Number(args.cityLimit) : 10;
  const limitPerCity = args.limitPerCity ? Number(args.limitPerCity) : 30;
  const priorityTier = args.priorityTier ? Number(args.priorityTier) : null;
  const only = parseCityListOnly(args.only);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Load event types
  const { data: eventTypes, error: eventTypesErr } = await supabase.from('event_types').select('id, slug');
  if (eventTypesErr) throw new Error(`Failed to fetch event_types: ${eventTypesErr.message}`);
  const eventTypeIdBySlug = new Map((eventTypes || []).map((t) => [t.slug, t.id]));
  const otherTypeId = eventTypeIdBySlug.get('other') || null;

  // Load EventbriteSearch source row
  const { data: source, error: sourceErr } = await supabase
    .from('event_sources')
    .select('*')
    .eq('name', 'EventbriteSearch')
    .single();
  if (sourceErr) throw new Error(`Missing event_sources row EventbriteSearch: ${sourceErr.message}`);

  // Select cities
  let cities = [];
  if (only.length > 0) {
    cities = only;
  } else {
    let q = supabase.from('target_cities').select('city,state,priority_tier,population_rank').order('priority_tier', { ascending: true }).order('population_rank', { ascending: true });
    if (priorityTier) q = q.eq('priority_tier', priorityTier);
    const { data, error } = await q.limit(cityLimit);
    if (error) throw new Error(`Failed to fetch target_cities: ${error.message}`);
    cities = (data || []).map((r) => ({ city: r.city, state: r.state }));
  }

  // Existing events for stable slugs + dedupe
  const { data: existingEvents, error: existingErr } = await supabase
    .from('events')
    .select('id, slug, source_url, start_date, city, state')
    .gte('start_date', '2025-01-01');
  if (existingErr) throw new Error(`Failed to fetch existing events: ${existingErr.message}`);

  const existingEventsList = existingEvents || [];
  const existingSlugs = new Set(existingEventsList.map((e) => e.slug));
  const existingSlugByConflictKey = new Map(
    existingEventsList.map((e) => [`${String(e.source_url || '').trim()}|${String(e.start_date || '').trim()}`, e.slug])
  );

  let discoveredTotal = 0;
  let upsertedTotal = 0;
  const allErrors = [];

  for (const city of cities) {
    const nowIso = new Date().toISOString();
    console.log(`\n=== City: ${city.city}, ${city.state} ===`);

    // Create a scrape job per city so provenance is explicit
    const { data: jobRow, error: jobErr } = await supabase
      .from('scrape_jobs')
      .insert({
        job_type: 'events_city_backfill',
        status: 'running',
        priority: 5,
        source_key: source.name,
        started_at: nowIso,
        sources_attempted: [source.name],
        job_payload: {
          kind: 'events_city_backfill',
          source_id: source.id,
          source_name: source.name,
          city: city.city,
          state: city.state,
          rangeStart,
          rangeEnd,
          limitPerCity,
          dryRun,
        },
      })
      .select('id')
      .single();
    if (jobErr || !jobRow?.id) {
      allErrors.push(`[${city.city},${city.state}] scrape_job create failed: ${jobErr?.message || 'unknown'}`);
      continue;
    }
    const scrapeJobId = jobRow.id;

    const { events: rawEvents, errors } = await fetchFromSource(source, {
      limit: limitPerCity,
      dryRun: false,
      rangeStart,
      rangeEnd,
      location: city,
    });

    discoveredTotal += rawEvents.length;
    if (errors?.length) allErrors.push(...errors.map((e) => `[${city.city},${city.state}] ${e}`));

    // Deduplicate only within batch so we can upsert
    const { unique: uniqueWithinBatch } = deduplicateBatch(rawEvents, []);
    console.log(`discovered=${rawEvents.length}, uniqueWithinBatch=${uniqueWithinBatch.length}`);

    const rows = buildEventRows({
      events: uniqueWithinBatch,
      source,
      eventTypeIdBySlug,
      otherTypeId,
      existingSlugs,
      existingSlugByConflictKey,
      verifiedAtIso: nowIso,
      scrapeJobId,
    });

    if (dryRun) {
      console.log(`[DRY RUN] Would upsert ${rows.length} events for ${city.city}, ${city.state}`);
      await supabase
        .from('scrape_jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString(), sources_succeeded: [source.name] })
        .eq('id', scrapeJobId);
      continue;
    }

    if (rows.length === 0) {
      await supabase
        .from('scrape_jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString(), sources_succeeded: [source.name] })
        .eq('id', scrapeJobId);
      continue;
    }

    const { data: upserted, error: upsertErr } = await supabase
      .from('events')
      .upsert(rows, { onConflict: 'source_url,start_date' })
      .select('id');

    if (upsertErr) {
      allErrors.push(`[${city.city},${city.state}] upsert failed: ${upsertErr.message}`);
      await supabase
        .from('scrape_jobs')
        .update({ status: 'failed', completed_at: new Date().toISOString(), sources_failed: [source.name], error_message: upsertErr.message })
        .eq('id', scrapeJobId);
      continue;
    }

    const count = upserted?.length || 0;
    upsertedTotal += count;
    console.log(`upserted=${count}`);

    await supabase
      .from('scrape_jobs')
      .update({ status: 'completed', completed_at: new Date().toISOString(), sources_succeeded: [source.name] })
      .eq('id', scrapeJobId);
  }

  console.log('\nSUMMARY');
  console.log('discovered:', discoveredTotal);
  console.log('upserted:', upsertedTotal);
  console.log('errors:', allErrors.length);
  if (allErrors.length) {
    console.log(allErrors.slice(0, 30).join('\n'));
  }
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});


