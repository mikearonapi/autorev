/**
 * Eventbrite (Public Search) Scraper
 *
 * Why:
 * - Eventbrite's public global search API is no longer available.
 * - For city-by-city coverage (top 500), we scrape the public search pages and then
 *   parse each event detail page via JSON-LD (@type=Event).
 *
 * Notes:
 * - This is best-effort and may be blocked by captchas. We fail closed (return 0 events + errors).
 * - We intentionally require strong keyword matches for Cars & Coffee to avoid "coffee" non-car events.
 *
 * Config expected in event_sources.scrape_config:
 * {
 *   "maxPagesPerQuery": 2,
 *   "maxEventUrlsPerQuery": 20,
 *   "queries": [
 *     { "q": "cars and coffee", "target_event_type_slug": "cars-and-coffee" },
 *     { "q": "car show", "target_event_type_slug": "car-show" }
 *   ]
 * }
 *
 * Options:
 * - options.location: { city: "Leesburg", state: "VA" } OR "Leesburg, VA"
 * - options.rangeStart / rangeEnd: ISO strings (optional)
 */
import { mapEventType, getRegionFromState } from './index.js';

const BASE_URL = 'https://www.eventbrite.com';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function toIsoOrNull(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseIsoToDateTimeParts(iso) {
  if (!iso) return { date: null, time: null };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: null, time: null };
  const yyyyMmDd = d.toISOString().slice(0, 10);
  const hhMm = d.toISOString().slice(11, 16);
  return { date: yyyyMmDd, time: hhMm === '00:00' ? null : `${hhMm}:00` };
}

function normalizeLocationInput(location) {
  if (!location) return { city: null, state: null };
  if (typeof location === 'string') {
    const parts = location.split(',').map((p) => p.trim()).filter(Boolean);
    const city = parts[0] || null;
    const state = parts[1] ? parts[1].toUpperCase() : null;
    return { city, state };
  }
  const city = location.city ? String(location.city).trim() : null;
  const state = location.state ? String(location.state).trim().toUpperCase() : null;
  return { city, state };
}

function slugifyCityForEventbrite(city) {
  if (!city) return null;
  return String(city)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function buildEventbriteLocationSlug(city, state) {
  if (!city || !state || state.length !== 2) return null;
  const citySlug = slugifyCityForEventbrite(city);
  if (!citySlug) return null;
  return `${state.toLowerCase()}--${citySlug}`;
}

function buildSearchUrl({ locationSlug, query, page }) {
  const qSlug = slugifyCityForEventbrite(query) || 'events';
  const base = `${BASE_URL}/d/${locationSlug}/${qSlug}/`;
  const params = new URLSearchParams();
  if (page && page > 1) params.set('page', String(page));
  return params.toString() ? `${base}?${params.toString()}` : base;
}

function looksBotBlocked(html) {
  const lower = String(html || '').toLowerCase();
  // Eventbrite frequently embeds captcha markers even on normal pages, so we use a conservative set.
  return (
    lower.includes('px-captcha') ||
    lower.includes('perimeterx') ||
    lower.includes('please verify you are a human') ||
    lower.includes('access denied') ||
    lower.includes('request unsuccessful') ||
    lower.includes('cloudflare') ||
    lower.includes('cf-chl') ||
    lower.includes('captcha') && lower.includes('verify')
  );
}

function extractEventUrlsFromSearchHtml(html) {
  const urls = new Set();
  const scripts = [...String(html || '').matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const all = scripts.join('\n');
  for (const m of all.matchAll(/https:\/\/www\.eventbrite\.com\/e\/[^"'\\\s<]+/g)) {
    const u = m[0];
    // Strip trailing punctuation or escape artifacts
    const clean = u.replace(/[),.;]+$/g, '');
    urls.add(clean);
  }
  return Array.from(urls);
}

function normalizeJsonLdEvent(jsonLdEvent, sourceUrl) {
  if (!jsonLdEvent || jsonLdEvent['@type'] !== 'Event') return null;

  const name = jsonLdEvent.name || null;
  const description = typeof jsonLdEvent.description === 'string' ? jsonLdEvent.description : null;

  const startIso = jsonLdEvent.startDate || null;
  const endIso = jsonLdEvent.endDate || null;

  const startParts = parseIsoToDateTimeParts(startIso);
  const endParts = parseIsoToDateTimeParts(endIso);

  const location = jsonLdEvent.location || null;
  const venueName = location?.name || null;
  const addr = location?.address || null;

  const city = addr?.addressLocality || null;
  const state = addr?.addressRegion ? String(addr.addressRegion).trim().toUpperCase() : null;
  const zip = addr?.postalCode ? String(addr.postalCode).trim() : null;
  const address = addr?.streetAddress ? String(addr.streetAddress).trim() : null;
  const country = addr?.addressCountry || 'USA';

  const eventTypeSlug = mapEventType(`${name || ''} ${description || ''}`, 'eventbritesearch');

  if (!name || !sourceUrl || !startParts.date || !city) return null;

  return {
    name,
    description,
    event_type_slug: eventTypeSlug,
    start_date: startParts.date,
    end_date: endParts.date,
    start_time: startParts.time,
    end_time: endParts.time,
    timezone: 'America/New_York', // Eventbrite is multi-timezone; JSON-LD doesn't reliably include tz. We can improve later.
    venue_name: venueName,
    address,
    city,
    state,
    zip,
    country,
    region: state ? getRegionFromState(state) : null,
    scope: 'local',
    source_url: sourceUrl,
    registration_url: sourceUrl,
    image_url: null,
    cost_text: null,
    is_free: false,
    latitude: null,
    longitude: null,
  };
}

function findJsonLdEventObject(html) {
  const blocks = [...String(html || '').matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map(
    (m) => m[1]
  );
  const parsed = [];
  for (const b of blocks) {
    try {
      parsed.push(JSON.parse(b));
    } catch {
      // ignore
    }
  }

  const flatten = (x) => {
    if (!x) return [];
    if (Array.isArray(x)) return x.flatMap(flatten);
    if (typeof x === 'object' && Array.isArray(x['@graph'])) return x['@graph'].flatMap(flatten);
    return [x];
  };

  const all = parsed.flatMap(flatten).filter(Boolean);
  return all.find((o) => o && o['@type'] === 'Event') || null;
}

function passesTargetTypeHeuristic(name, targetSlug) {
  if (!targetSlug) return true;
  const n = String(name || '').toLowerCase();

  const hasCar = /\bcar(s)?\b/.test(n) || n.includes('auto ') || n.includes('automotive');
  const hasCoffee = n.includes('coffee');

  if (targetSlug === 'cars-and-coffee') {
    // Require car + coffee to avoid "coffee" political/social events.
    return hasCar && hasCoffee;
  }
  if (targetSlug === 'car-show') {
    return hasCar && (n.includes('car show') || n.includes('show') || n.includes('concours'));
  }
  if (targetSlug === 'club-meetup') {
    return n.includes('club') || n.includes('meetup') || n.includes('meet up') || n.includes('chapter');
  }
  if (targetSlug === 'cruise') {
    return n.includes('cruise') || n.includes('drive') || n.includes('rally') || n.includes('tour');
  }
  if (targetSlug === 'autocross') {
    return n.includes('autocross') || n.includes('auto-x') || n.includes('autox') || n.includes('solo');
  }
  if (targetSlug === 'track-day') {
    return n.includes('track day') || n.includes('hpde') || n.includes('open lapping') || n.includes('track');
  }
  if (targetSlug === 'time-attack') {
    return n.includes('time attack') || n.includes('time-attack');
  }
  return true;
}

function isWithinRange(startDate, rangeStartIso, rangeEndIso) {
  if (!startDate) return true;
  const sd = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(sd.getTime())) return true;
  if (rangeStartIso) {
    const rs = new Date(rangeStartIso);
    if (!Number.isNaN(rs.getTime()) && sd < rs) return false;
  }
  if (rangeEndIso) {
    const re = new Date(rangeEndIso);
    if (!Number.isNaN(re.getTime()) && sd > re) return false;
  }
  return true;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

export async function fetchEventbriteSearchEvents(source, options = {}) {
  const { limit = 100, dryRun = false, rangeStart, rangeEnd, location } = options;
  const errors = [];
  const events = [];

  if (dryRun) return { events: [], errors: [] };

  const { city, state } = normalizeLocationInput(location);
  const locationSlug = buildEventbriteLocationSlug(city, state);
  if (!locationSlug) {
    return { events: [], errors: ['EventbriteSearch requires options.location with City, ST'] };
  }

  const cfg = source?.scrape_config || {};
  const queries = Array.isArray(cfg.queries) ? cfg.queries : [{ q: 'cars and coffee', target_event_type_slug: 'cars-and-coffee' }];
  const maxPagesPerQuery = Number(cfg.maxPagesPerQuery ?? 2);
  const maxEventUrlsPerQuery = Number(cfg.maxEventUrlsPerQuery ?? 20);
  const perEventDelayMs = Number(cfg.perEventDelayMs ?? 500);
  const perPageDelayMs = Number(cfg.perPageDelayMs ?? 500);

  const rangeStartIso = toIsoOrNull(rangeStart);
  const rangeEndIso = toIsoOrNull(rangeEnd);

  const seenEventUrls = new Set();

  for (const q of queries) {
    if (events.length >= limit) break;
    const query = q?.q ? String(q.q) : null;
    if (!query) continue;
    const targetSlug = q?.target_event_type_slug || null;

    for (let page = 1; page <= maxPagesPerQuery; page += 1) {
      if (events.length >= limit) break;

      const searchUrl = buildSearchUrl({ locationSlug, query, page });
      try {
        const html = await fetchText(searchUrl);
        if (looksBotBlocked(html)) {
          errors.push(`EventbriteSearch blocked (captcha) for ${searchUrl}`);
          break;
        }

        const urls = extractEventUrlsFromSearchHtml(html).slice(0, maxEventUrlsPerQuery);
        if (urls.length === 0) {
          // No results on this page; stop paging this query early.
          break;
        }

        for (const eventUrl of urls) {
          if (events.length >= limit) break;
          const normalizedUrl = String(eventUrl).toLowerCase().replace(/\/$/, '');
          if (seenEventUrls.has(normalizedUrl)) continue;
          seenEventUrls.add(normalizedUrl);

          try {
            await sleep(perEventDelayMs);
            const detailHtml = await fetchText(eventUrl);
            if (looksBotBlocked(detailHtml)) {
              errors.push(`EventbriteSearch blocked (captcha) for event detail ${eventUrl}`);
              continue;
            }

            const evObj = findJsonLdEventObject(detailHtml);
            if (!evObj) continue;

            const normalized = normalizeJsonLdEvent(evObj, eventUrl);
            if (!normalized) continue;
            if (!passesTargetTypeHeuristic(normalized.name, targetSlug)) continue;
            if (!isWithinRange(normalized.start_date, rangeStartIso, rangeEndIso)) continue;

            // If a target type was requested, enforce it (best-effort) to avoid drift.
            if (targetSlug && normalized.event_type_slug !== targetSlug) {
              // Allow "car-show" and "cars-and-coffee" to pass if title strongly matches target.
              // Otherwise, drop.
              if (!passesTargetTypeHeuristic(normalized.name, targetSlug)) continue;
              normalized.event_type_slug = targetSlug;
            }

            events.push(normalized);
          } catch (err) {
            errors.push(`EventbriteSearch event detail failed (${eventUrl}): ${err.message}`);
          }
        }

        await sleep(perPageDelayMs);
      } catch (err) {
        errors.push(`EventbriteSearch page failed (${searchUrl}): ${err.message}`);
        break;
      }
    }
  }

  return { events: events.slice(0, limit), errors };
}

export default fetchEventbriteSearchEvents;













