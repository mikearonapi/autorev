/**
 * Events ingestion helpers (pure functions)
 *
 * Goal: build DB-ready event rows with provenance + verification timestamps.
 */

import { getRegionFromState } from '../eventSourceFetchers/index.js';

/**
 * Generate a short random suffix for slug uniqueness.
 * Uses alphanumeric chars for URL-friendliness.
 * @returns {string} 4-character random suffix
 */
function generateShortId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a stable slug for an event.
 * Includes full date (YYYYMMDD) and a short random suffix to minimize collisions.
 * The random suffix ensures uniqueness even for events with identical names/dates.
 */
export function generateEventSlug(name, city, startDate) {
  const base = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40); // Shorter to leave room for date + suffix

  const location = String(city || 'usa')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 12);

  // Use full date (YYYYMMDD) for better uniqueness on recurring events
  const date = String(startDate || '').replace(/-/g, '').substring(0, 8);
  
  // Add short random suffix to ensure uniqueness across concurrent inserts
  const suffix = generateShortId();
  
  // Build slug and ensure it's clean
  const slug = `${base}-${location}-${date}-${suffix}`
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
    
  return slug || `event-${Date.now()}-${suffix}`;
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

    // Use existing slug for updates, or generate new one with random suffix
    let finalSlug = preexistingSlug || generateEventSlug(event?.name, event?.city, event?.start_date);
    
    // Even with random suffixes, check for collisions and regenerate if needed
    let attempts = 0;
    const maxAttempts = 10;
    while (existingSlugs?.has(finalSlug) && attempts < maxAttempts) {
      // Regenerate with new random suffix
      finalSlug = generateEventSlug(event?.name, event?.city, event?.start_date);
      attempts++;
    }
    
    // Ultimate fallback: timestamp-based slug (virtually guaranteed unique)
    if (existingSlugs?.has(finalSlug)) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 6);
      finalSlug = `event-${timestamp}-${random}`.substring(0, 80);
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


