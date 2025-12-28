/**
 * Events ingestion helpers (pure functions)
 *
 * Goal: build DB-ready event rows with provenance + verification timestamps.
 */

import { getRegionFromState } from '../eventSourceFetchers/index.js';

/**
 * Generate a stable slug for an event.
 * Includes full date (YYYYMMDD) to minimize collisions for recurring events.
 * (We still collision-resolve in the caller.)
 */
export function generateEventSlug(name, city, startDate) {
  const base = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 45); // Shorter to leave room for date + counter

  const location = String(city || 'usa')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 15);

  // Use full date (YYYYMMDD) for better uniqueness on recurring events
  const date = String(startDate || '').replace(/-/g, '').substring(0, 8);
  
  // Build slug and ensure it's clean
  const slug = `${base}-${location}-${date}`
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
    
  return slug || `event-${Date.now()}`;
}

function buildConflictKey({ source_url, start_date }) {
  const u = String(source_url || '').trim();
  const d = String(start_date || '').trim();
  return `${u}|${d}`;
}

/**
 * Build event rows for insert/upsert into `events`.
 *
 * @param {object} args
 * @param {Array<object>} args.events - normalized events from fetchers
 * @param {object} args.source - row from event_sources
 * @param {Map<string,string>} args.eventTypeIdBySlug - event_type slug -> id
 * @param {string|null} args.otherTypeId - fallback type id
 * @param {Set<string>} args.existingSlugs - slugs already in use (db + batch)
 * @param {Map<string,string>} [args.existingSlugByConflictKey] - conflictKey -> existing slug (prevents slug churn on upsert)
 * @param {string} args.verifiedAtIso - ISO timestamp
 * @param {string} args.scrapeJobId - scrape_jobs.id for provenance
 */
export function buildEventRows({
  events,
  source,
  eventTypeIdBySlug,
  otherTypeId,
  existingSlugs,
  existingSlugByConflictKey,
  verifiedAtIso,
  scrapeJobId,
}) {
  if (!Array.isArray(events)) return [];
  if (!source?.id || !source?.name) return [];
  if (!verifiedAtIso) return [];
  if (!scrapeJobId) return [];

  const rows = [];

  for (const event of events) {
    const eventTypeId =
      (event?.event_type_slug && eventTypeIdBySlug.get(event.event_type_slug)) || otherTypeId || null;

    const region = event?.region || getRegionFromState(event?.state);

    const conflictKey = buildConflictKey({
      source_url: event?.source_url,
      start_date: event?.start_date,
    });

    const preexistingSlug =
      existingSlugByConflictKey && conflictKey ? existingSlugByConflictKey.get(conflictKey) : null;

    const baseSlug = preexistingSlug || generateEventSlug(event?.name, event?.city, event?.start_date);
    let finalSlug = baseSlug;
    let counter = 1;
    const maxAttempts = 100; // Prevent infinite loop
    while (existingSlugs?.has(finalSlug) && counter < maxAttempts) {
      // Use more descriptive suffix for uniqueness
      finalSlug = `${baseSlug}-v${counter}`;
      counter += 1;
    }
    // If still colliding after maxAttempts, add timestamp for guaranteed uniqueness
    if (existingSlugs?.has(finalSlug)) {
      finalSlug = `${baseSlug}-${Date.now()}`.substring(0, 80);
    }
    existingSlugs?.add(finalSlug);

    rows.push({
      slug: finalSlug,
      name: event?.name,
      description: event?.description ?? null,
      event_type_id: eventTypeId,
      start_date: event?.start_date,
      end_date: event?.end_date ?? null,
      start_time: event?.start_time ?? null,
      end_time: event?.end_time ?? null,
      timezone: event?.timezone || 'America/New_York',
      venue_name: event?.venue_name ?? null,
      address: event?.address ?? null,
      city: event?.city,
      state: event?.state ?? null,
      zip: event?.zip ?? null,
      country: event?.country || 'USA',
      latitude: event?.latitude ?? null,
      longitude: event?.longitude ?? null,
      region,
      scope: event?.scope || 'local',
      source_url: event?.source_url,
      source_name: source.name, // canonical ingestion source name (not organizer)
      registration_url: event?.registration_url ?? null,
      image_url: event?.image_url ?? null,
      cost_text: event?.cost_text ?? null,
      is_free: Boolean(event?.is_free),
      status: 'approved',
      featured: false,
      approved_at: verifiedAtIso,
      last_verified_at: verifiedAtIso,
      ingested_source_id: source.id,
      ingested_by_job_id: scrapeJobId,
    });
  }

  return rows;
}


