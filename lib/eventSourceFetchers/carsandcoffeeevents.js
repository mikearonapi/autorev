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

async function fetchText(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://carsandcoffeeevents.com/',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      // Wait before retry
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
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

/**
 * Discover state/category pages from the site
 * 
 * carsandcoffeeevents.com uses /events/category/{state}/ URLs (not /state/)
 * We look for links to state category pages in the navigation/footer.
 */
function discoverStatePages(html, baseUrl) {
  const $ = load(html);
  const links = new Set();
  
  // US state names and abbreviations for matching
  const statePatterns = [
    'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
    'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
    'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana',
    'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota',
    'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
    'new-hampshire', 'new-jersey', 'new-mexico', 'new-york',
    'north-carolina', 'north-dakota', 'ohio', 'oklahoma', 'oregon',
    'pennsylvania', 'rhode-island', 'south-carolina', 'south-dakota',
    'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington',
    'west-virginia', 'wisconsin', 'wyoming'
  ];
  
  $('a[href]').each((_, a) => {
    const href = $(a).attr('href');
    if (!href) return;
    
    // Match /events/category/{state}/ pattern (the actual site structure)
    if (href.includes('/events/category/')) {
      const u = absUrl(baseUrl, href);
      if (u) links.add(u.split('#')[0].split('?')[0]);
      return;
    }
    
    // Also check for /state/ pattern as fallback
    if (href.includes('/state/')) {
      const u = absUrl(baseUrl, href);
      if (u) links.add(u.split('#')[0].split('?')[0]);
      return;
    }
  });
  
  // If no category links found, construct them manually for key states
  if (links.size === 0) {
    const priorityStates = [
      'virginia', 'california', 'texas', 'florida', 'new-york', 
      'georgia', 'north-carolina', 'arizona', 'colorado', 'ohio',
      'michigan', 'pennsylvania', 'illinois', 'washington', 'tennessee'
    ];
    for (const state of priorityStates) {
      links.add(`${baseUrl.replace(/\/$/, '')}/events/category/${state}/`);
    }
  }
  
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


