/**
 * CarsAndCoffeeEvents.com Fetcher
 *
 * Site appears to be powered by The Events Calendar; we scrape list pages.
 * This is intentionally conservative: it fetches a small number of pages per run.
 *
 * Config expected in event_sources.scrape_config:
 * {
 *   "statePages": true,
 *   "eventSelector": ".tribe-events-calendar-list__event"
 * }
 */

import { load } from 'cheerio';
import { mapEventType, getRegionFromState } from './index.js';

function absUrl(base, href) {
  if (!href) return null;
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function parseDateToIsoDate(maybeDate) {
  if (!maybeDate) return null;
  const d = new Date(maybeDate);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function normalizeCityState(text) {
  if (!text) return { city: null, state: null };
  const cleaned = String(text).replace(/\s+/g, ' ').trim();

  // Prefer US format "... , City, ST, ..." (take last plausible pair)
  const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) {
    const stateCandidate = parts[parts.length - 2];
    const cityCandidate = parts[parts.length - 3];
    if (/^[A-Z]{2}$/.test(stateCandidate) && cityCandidate && cityCandidate.length >= 2) {
      return { city: cityCandidate, state: stateCandidate.toUpperCase() };
    }
  }

  // Fallback: find any "City, ST" occurrence
  const m = cleaned.match(/([^,]+),\s*([A-Z]{2})\b/);
  if (!m) return { city: null, state: null };
  return { city: m[1].trim(), state: m[2].toUpperCase() };
}

export function parseTribeEventsListHtml(html, baseUrl, selector = '.tribe-events-calendar-list__event') {
  const $ = load(html);
  const events = [];

  $(selector).each((_, el) => {
    const $el = $(el);

    const primaryTitleLink = $el.find('.tribe-events-calendar-list__event-title a').first();
    const titleLink =
      primaryTitleLink && primaryTitleLink.length > 0
        ? primaryTitleLink
        : $el.find('a.tribe-events-calendar-list__event-title-link').first();
    const name = titleLink.text().trim() || null;
    const sourceUrl = absUrl(baseUrl, titleLink.attr('href')) || null;

    // The Events Calendar: prefer <time datetime="YYYY-MM-DD"> on the datetime element.
    const startAttr =
      $el.find('time.tribe-events-calendar-list__event-datetime').attr('datetime') ||
      $el.find('time[datetime]').first().attr('datetime') ||
      $el.attr('data-tribe-event-date-start') ||
      $el.find('[data-tribe-event-date-start]').attr('data-tribe-event-date-start') ||
      null;

    const endAttr =
      $el.attr('data-tribe-event-date-end') ||
      $el.find('[data-tribe-event-date-end]').attr('data-tribe-event-date-end') ||
      null;

    const startDate = parseDateToIsoDate(startAttr);
    const endDate = parseDateToIsoDate(endAttr);

    const venueName =
      $el.find('.tribe-events-calendar-list__event-venue-title').text().trim() ||
      $el.find('.tribe-events-venue-details .tribe-events-venue-details__venue-name').text().trim() ||
      null;

    const cityStateText =
      $el.find('.tribe-events-calendar-list__event-venue-address').text().trim() ||
      $el.find('.tribe-events-venue-details__address').text().trim() ||
      null;

    const { city, state } = normalizeCityState(cityStateText);

    // Minimal viability checks (we can't insert without these).
    if (!name || !sourceUrl || !startDate || !city) return;

    const eventTypeSlug = mapEventType(name, 'carsandcoffeeevents');

    events.push({
      name,
      description: null,
      event_type_slug: eventTypeSlug,
      start_date: startDate,
      end_date: endDate,
      start_time: null,
      end_time: null,
      timezone: 'America/New_York',
      venue_name: venueName,
      address: null,
      city,
      state,
      zip: null,
      country: 'USA',
      region: state ? getRegionFromState(state) : null,
      scope: 'local',
      source_url: sourceUrl,
      registration_url: sourceUrl,
      image_url: null,
      cost_text: 'Free',
      is_free: true,
      latitude: null,
      longitude: null,
    });
  });

  return events;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'AutoRev/1.0 (https://autorev.app)',
      Accept: 'text/html',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

function* iterateMonthsInclusive(rangeStart, rangeEnd) {
  // Yields YYYY-MM-01 dates (UTC) spanning the range.
  const start = new Date(rangeStart);
  const end = new Date(rangeEnd);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
  const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  while (cur <= endMonth) {
    const yyyy = cur.getUTCFullYear();
    const mm = String(cur.getUTCMonth() + 1).padStart(2, '0');
    yield `${yyyy}-${mm}-01`;
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
}

function discoverStatePages(html, baseUrl) {
  const $ = load(html);
  const links = new Set();
  $('a[href]').each((_, a) => {
    const href = $(a).attr('href');
    if (!href) return;
    if (!href.includes('/state/')) return;
    const u = absUrl(baseUrl, href);
    if (u) links.add(u.split('#')[0]);
  });
  return Array.from(links);
}

export async function fetchCarsAndCoffeeEvents(source, options = {}) {
  const { limit = 100, dryRun = false, rangeStart, rangeEnd } = options;
  const events = [];
  const errors = [];

  if (dryRun) return { events: [], errors: [] };

  const baseUrl = source?.base_url || 'https://carsandcoffeeevents.com';
  const selector = source?.scrape_config?.eventSelector || '.tribe-events-calendar-list__event';
  const useStatePages = Boolean(source?.scrape_config?.statePages);
  const maxMonthsPerRun = Number(source?.scrape_config?.maxMonthsPerRun ?? 3);

  try {
    const homeHtml = await fetchText(baseUrl);

    const pages = [];

    // If range is provided, fetch list pages anchored to that calendar month.
    // TEC supports tribe-bar-date to navigate months server-side.
    if (rangeStart && rangeEnd) {
      let months = 0;
      for (const monthStart of iterateMonthsInclusive(rangeStart, rangeEnd)) {
        if (months >= maxMonthsPerRun) break;
        const listUrl = `${baseUrl.replace(/\/$/, '')}/events/list/?tribe-bar-date=${monthStart}`;
        pages.push(listUrl);
        months += 1;
      }
    } else {
      pages.push(baseUrl);
    }

    if (useStatePages) {
      const discovered = discoverStatePages(homeHtml, baseUrl);
      // Limit to a handful per cron run to avoid hammering the site.
      pages.push(...discovered.slice(0, 10));
    }

    for (const pageUrl of pages) {
      if (events.length >= limit) break;
      try {
        const html = pageUrl === baseUrl ? homeHtml : await fetchText(pageUrl);
        const parsed = parseTribeEventsListHtml(html, pageUrl, selector);
        for (const e of parsed) {
          if (events.length >= limit) break;
          if (rangeStart) {
            const rs = new Date(rangeStart);
            const sd = new Date(`${e.start_date}T00:00:00Z`);
            if (!Number.isNaN(rs.getTime()) && !Number.isNaN(sd.getTime()) && sd < rs) continue;
          }
          if (rangeEnd) {
            const re = new Date(rangeEnd);
            const sd = new Date(`${e.start_date}T00:00:00Z`);
            if (!Number.isNaN(re.getTime()) && !Number.isNaN(sd.getTime()) && sd > re) continue;
          }
          events.push(e);
        }
      } catch (err) {
        errors.push(`CarsAndCoffeeEvents page failed (${pageUrl}): ${err.message}`);
      }
    }
  } catch (err) {
    errors.push(`CarsAndCoffeeEvents fetch failed: ${err.message}`);
  }

  return { events, errors };
}

export default fetchCarsAndCoffeeEvents;


