/**
 * Facebook Events Fetcher (FOUNDATION ONLY)
 *
 * Official Graph API access to Events on Users/Pages is restricted (generally only
 * available to Facebook Marketing Partners). Because of that, we do NOT attempt
 * a broad Facebook Events crawler here.
 *
 * Instead, this fetcher supports a *curated list* of public event URLs
 * in `event_sources.scrape_config.eventUrls`.
 *
 * Expectation: Many URLs will return login/blocked pages; we treat those as
 * "blocked" and report them so we can decide whether to pursue a compliant
 * integration later.
 */

import { load } from 'cheerio';
import { mapEventType } from './index.js';

function extractFromHtml(html) {
  const $ = load(html);
  const name = $('meta[property="og:title"]').attr('content')?.trim() || null;
  const canonical = $('meta[property="og:url"]').attr('content')?.trim() || null;

  // Heuristic: Facebook embeds start_time in JSON; this often fails when blocked.
  const startTimeMatch = html.match(/\"start_time\"\\s*:\\s*\"([^\"]+)\"/);
  const startIso = startTimeMatch ? startTimeMatch[1] : null;
  const startDate = startIso ? new Date(startIso) : null;
  const start_date = startDate && !Number.isNaN(startDate.getTime()) ? startDate.toISOString().slice(0, 10) : null;

  // Location is highly variable. We’ll leave city/state null if not found; caller will drop those.
  const locationMatch = html.match(/\"city\"\\s*:\\s*\"([^\"]+)\"/);
  const city = locationMatch ? locationMatch[1] : null;
  const stateMatch = html.match(/\"state\"\\s*:\\s*\"([^\"]+)\"/);
  const state = stateMatch ? stateMatch[1] : null;

  return { name, canonical, start_date, city, state };
}

async function fetchHtml(url) {
  async function doFetch(u) {
    const res = await fetch(u, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'AutoRev/1.0 (https://autorev.app)',
        Accept: 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    return res;
  }

  const first = await doFetch(url);
  if (first.ok) {
    return { finalUrl: first.url, text: await first.text() };
  }

  // Facebook often blocks non-browser fetches; try mobile/mbasic variants as a best-effort fallback.
  if (first.status === 400 || first.status === 403) {
    try {
      const u = new URL(url);
      const candidates = ['m.facebook.com', 'mbasic.facebook.com']
        .map((host) => {
          const c = new URL(u.toString());
          c.hostname = host;
          return c.toString();
        });

      for (const candidate of candidates) {
        const res = await doFetch(candidate);
        if (res.ok) {
          return { finalUrl: res.url, text: await res.text() };
        }
      }
    } catch {
      // ignore URL parse errors
    }
  }

  throw new Error(`HTTP ${first.status}`);
}

export async function fetchFacebookEvents(source, options = {}) {
  const { limit = 50, dryRun = false, rangeStart, rangeEnd } = options;
  const events = [];
  const errors = [];

  if (dryRun) return { events: [], errors: [] };

  const urls = Array.isArray(source?.scrape_config?.eventUrls) ? source.scrape_config.eventUrls : [];
  if (urls.length === 0) {
    return { events: [], errors: ['FacebookEvents missing scrape_config.eventUrls (curated list required)'] };
  }

  for (const url of urls.slice(0, limit)) {
    try {
      const { finalUrl, text } = await fetchHtml(url);
      if (finalUrl.includes('login') || text.toLowerCase().includes('log in') || text.toLowerCase().includes('login')) {
        errors.push(`FacebookEvents blocked (login required): ${url}`);
        continue;
      }

      const parsed = extractFromHtml(text);
      if (!parsed.name || !parsed.start_date || !parsed.city) {
        errors.push(`FacebookEvents parse incomplete: ${url}`);
        continue;
      }

      // Optional range filter (useful when enriching 2026 only)
      if (rangeStart) {
        const rs = new Date(rangeStart);
        const sd = new Date(`${parsed.start_date}T00:00:00Z`);
        if (!Number.isNaN(rs.getTime()) && !Number.isNaN(sd.getTime()) && sd < rs) continue;
      }
      if (rangeEnd) {
        const re = new Date(rangeEnd);
        const sd = new Date(`${parsed.start_date}T00:00:00Z`);
        if (!Number.isNaN(re.getTime()) && !Number.isNaN(sd.getTime()) && sd > re) continue;
      }

      events.push({
        name: parsed.name,
        description: null,
        event_type_slug: mapEventType(parsed.name, 'facebook'),
        start_date: parsed.start_date,
        end_date: null,
        start_time: null,
        end_time: null,
        timezone: 'America/New_York',
        venue_name: null,
        address: null,
        city: parsed.city,
        state: parsed.state,
        zip: null,
        country: 'USA',
        region: null,
        scope: 'local',
        source_url: parsed.canonical || url,
        registration_url: parsed.canonical || url,
        image_url: null,
        cost_text: null,
        is_free: false,
        latitude: null,
        longitude: null,
      });
    } catch (err) {
      errors.push(`FacebookEvents fetch failed (${url}): ${err.message}`);
    }
  }

  return { events, errors };
}

export default fetchFacebookEvents;


