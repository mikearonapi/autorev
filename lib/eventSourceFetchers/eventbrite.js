/**
 * Eventbrite Event Fetcher
 *
 * Uses the Eventbrite API to search for public events.
 * IMPORTANT: Requires an OAuth token via env var EVENTBRITE_API_TOKEN.
 *
 * We intentionally keep this fetcher driven by `event_sources.api_config`
 * so we can iterate on queries/coverage without code changes.
 */

import { mapEventType, getRegionFromState } from './index.js';

// NOTE: Eventbrite removed public access to global event search.
// We use organization-scoped listing endpoints instead.
const BASE_URL = 'https://www.eventbriteapi.com/v3/organizations';

function toIsoOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseUtcToDateTimeParts(iso) {
  if (!iso) return { date: null, time: null };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: null, time: null };
  const yyyyMmDd = d.toISOString().slice(0, 10);
  const hhMm = d.toISOString().slice(11, 16);
  return { date: yyyyMmDd, time: hhMm === '00:00' ? null : `${hhMm}:00` };
}

export function normalizeEventbriteEvent(raw) {
  if (!raw) return null;

  const name = raw?.name?.text || raw?.name?.html || raw?.name || null;
  const description = raw?.description?.text || null;
  const url = raw?.url || null;

  // Eventbrite includes start/end as objects. Prefer UTC for consistent parsing.
  const startUtc = raw?.start?.utc || raw?.start?.local || null;
  const endUtc = raw?.end?.utc || raw?.end?.local || null;

  const startParts = parseUtcToDateTimeParts(startUtc);
  const endParts = parseUtcToDateTimeParts(endUtc);

  const timezone = raw?.start?.timezone || raw?.timezone || 'America/New_York';

  const venue = raw?.venue || null;
  const venueName = venue?.name || null;
  const address = venue?.address?.address_1 || venue?.address?.localized_address_display || null;
  const city = venue?.address?.city || null;
  const state = venue?.address?.region || venue?.address?.region_code || null;
  const zip = venue?.address?.postal_code || null;
  const country = venue?.address?.country || 'USA';

  const latitude = venue?.latitude ? Number(venue.latitude) : (venue?.address?.latitude ? Number(venue.address.latitude) : null);
  const longitude = venue?.longitude ? Number(venue.longitude) : (venue?.address?.longitude ? Number(venue.address.longitude) : null);

  const eventTypeSlug = mapEventType(`${name || ''} ${description || ''}`, 'eventbrite');

  if (!name || !url || !startParts.date || !city) return null;

  return {
    name,
    description,
    event_type_slug: eventTypeSlug,
    start_date: startParts.date,
    end_date: endParts.date,
    start_time: startParts.time,
    end_time: endParts.time,
    timezone,
    venue_name: venueName,
    address,
    city,
    state,
    zip,
    country,
    region: state ? getRegionFromState(state) : null,
    scope: 'local',
    source_url: url,
    registration_url: url,
    image_url: raw?.logo?.url || null,
    cost_text: raw?.is_free ? 'Free' : null,
    is_free: Boolean(raw?.is_free),
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
  };
}

/**
 * Build Eventbrite search URLSearchParams from api_config.
 *
 * Supported api_config:
 * {
 *   "searches": [
 *     {
 *       "q": "cars and coffee",
 *       "location_address": "Austin, TX",
 *       "location_within": "50mi",
 *       "start_range": "2026-01-01T00:00:00Z",
 *       "end_range": "2026-12-31T23:59:59Z"
 *     }
 *   ],
 *   "max_pages_per_search": 3
 * }
 */
function buildSearchParams(search, { rangeStartIso, rangeEndIso, page } = {}) {
  const params = new URLSearchParams();

  // Always request venue expansion so we can fill city/state.
  params.set('expand', 'venue');

  if (search?.q) params.set('q', String(search.q));
  if (search?.location_address) params.set('location.address', String(search.location_address));
  if (search?.location_within) params.set('location.within', String(search.location_within));

  const startIso = toIsoOrNull(search?.start_range) || rangeStartIso;
  const endIso = toIsoOrNull(search?.end_range) || rangeEndIso;
  if (startIso) params.set('start_date.range_start', startIso);
  if (endIso) params.set('start_date.range_end', endIso);

  if (page) params.set('page', String(page));
  return params;
}

export async function fetchEventbriteEvents(source, options = {}) {
  const { limit = 100, dryRun = false, rangeStart, rangeEnd } = options;
  const events = [];
  const errors = [];

  if (dryRun) {
    return { events: [], errors: [] };
  }

  const token = process.env.EVENTBRITE_API_TOKEN;
  if (!token) {
    return { events: [], errors: ['Missing EVENTBRITE_API_TOKEN env var'] };
  }

  // Supported config:
  // api_config.organizations: [{ org_id: "123", label?: "..." }, ...]
  const orgs = Array.isArray(source?.api_config?.organizations) ? source.api_config.organizations : [];
  if (orgs.length === 0) {
    return { events: [], errors: ['Eventbrite source missing api_config.organizations (global search is not available)'] };
  }

  const maxPagesPerOrg = Number(source?.api_config?.max_pages_per_org ?? 3);
  const rangeStartIso = toIsoOrNull(rangeStart);
  const rangeEndIso = toIsoOrNull(rangeEnd);

  // Round-robin paging across orgs
  const states = orgs.map((org) => ({
    org,
    page: 1,
    pagesFetched: 0,
    done: false,
  }));
  const seenUrls = new Set();

  while (events.length < limit && states.some((s) => !s.done)) {
    for (const state of states) {
      if (events.length >= limit) break;
      if (state.done) continue;

      if (state.pagesFetched >= maxPagesPerOrg) {
        state.done = true;
        continue;
      }

      const orgId = state.org?.org_id || state.org?.orgId || state.org?.id || null;
      if (!orgId) {
        errors.push('Eventbrite organization entry missing org_id');
        state.done = true;
        continue;
      }

      const params = new URLSearchParams();
      params.set('expand', 'venue');
      params.set('page', String(state.page));
      // Ask for live events (includes future). We filter client-side into the range.
      params.set('status', 'live');

      const url = `${BASE_URL}/${encodeURIComponent(String(orgId))}/events/?${params.toString()}`;

      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'User-Agent': 'AutoRev/1.0 (https://autorev.app)',
          },
        });

        if (!res.ok) {
          errors.push(`Eventbrite HTTP ${res.status} for ${url}`);
          state.done = true;
          continue;
        }

        const json = await res.json();
        const rawEvents = Array.isArray(json?.events) ? json.events : [];

        for (const raw of rawEvents) {
          if (events.length >= limit) break;
          const normalized = normalizeEventbriteEvent(raw);
          if (!normalized) continue;

          // Date range filter (client-side)
          if (rangeStartIso && normalized.start_date) {
            const start = new Date(`${normalized.start_date}T00:00:00Z`);
            if (!Number.isNaN(start.getTime()) && start < new Date(rangeStartIso)) continue;
          }
          if (rangeEndIso && normalized.start_date) {
            const start = new Date(`${normalized.start_date}T00:00:00Z`);
            if (!Number.isNaN(start.getTime()) && start > new Date(rangeEndIso)) continue;
          }

          const normalizedUrl = normalized.source_url?.toLowerCase().replace(/\/$/, '');
          if (!normalizedUrl || seenUrls.has(normalizedUrl)) continue;
          seenUrls.add(normalizedUrl);
          events.push(normalized);
        }

        const pagination = json?.pagination || null;
        const hasMore = Boolean(pagination?.has_more_items);
        state.pagesFetched += 1;
        state.page += 1;
        if (!hasMore) state.done = true;
      } catch (err) {
        errors.push(`Eventbrite fetch error: ${err.message}`);
        state.done = true;
      }
    }
  }

  return { events, errors };
}

export default fetchEventbriteEvents;


