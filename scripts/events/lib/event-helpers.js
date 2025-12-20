import { getServiceSupabase } from '../../../lib/supabaseClient.js';

const REGION_MAP = {
  Northeast: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NY', 'NJ', 'PA', 'DE', 'MD', 'DC'],
  Southeast: ['VA', 'WV', 'NC', 'SC', 'GA', 'FL', 'AL', 'MS', 'TN', 'KY', 'AR', 'LA'],
  Midwest: ['OH', 'MI', 'IN', 'IL', 'WI', 'MN', 'IA', 'MO', 'KS', 'NE', 'SD', 'ND'],
  Southwest: ['TX', 'OK', 'AZ', 'NM'],
  West: ['CA', 'NV', 'OR', 'WA', 'ID', 'MT', 'WY', 'CO', 'UT', 'AK', 'HI'],
};

const MONTH_NAME_TO_NUM = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const WEEKDAY_TO_INDEX = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export function slugifyString(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

export function buildEventSlug(name, city, startDate) {
  const parts = [name, city, startDate].filter(Boolean).map(slugifyString);
  return parts.join('-');
}

export function mapRegion(state) {
  if (!state) return null;
  const upper = state.toUpperCase();
  for (const [region, states] of Object.entries(REGION_MAP)) {
    if (states.includes(upper)) return region;
  }
  return null;
}

export async function getEventTypeId(client, slug) {
  const { data, error } = await client
    .from('event_types')
    .select('id')
    .eq('slug', slug)
    .single();
  if (error || !data) {
    throw new Error(`Missing event_type "${slug}": ${error?.message || 'not found'}`);
  }
  return data.id;
}

export async function upsertEvent(client, event, { carAffinities = [] } = {}) {
  const now = new Date().toISOString();
  const payload = {
    ...event,
    country: event.country || 'USA',
    status: 'approved',
    approved_at: event.approved_at || now,
    last_verified_at: event.last_verified_at || now,
    source_name: event.source_name || 'Manual Seed',
  };

  const { data, error } = await client
    .from('events')
    .upsert(payload, { onConflict: 'slug' })
    .select('id, slug')
    .single();

  if (error) {
    throw new Error(`Failed to upsert event "${event.name}": ${error.message}`);
  }

  if (carAffinities.length > 0) {
    await upsertCarAffinities(client, data.id, carAffinities);
  }

  return data;
}

async function upsertCarAffinities(client, eventId, affinities) {
  // Delete existing affinities for this event first
  await client
    .from('event_car_affinities')
    .delete()
    .eq('event_id', eventId);

  // Insert new affinities
  const rows = affinities.map(({ brand, car_id, affinity_type = 'featured' }) => ({
    event_id: eventId,
    brand: brand || null,
    car_id: car_id || null,
    affinity_type,
  }));

  const { error } = await client
    .from('event_car_affinities')
    .insert(rows);

  if (error) {
    throw new Error(`Failed to insert affinities for event ${eventId}: ${error.message}`);
  }
}

function getMonthsFromRecurrenceText(recurrence) {
  const rangeMatch = recurrence.match(/\(([^)]+)\)/);
  if (!rangeMatch) return Array.from({ length: 12 }, (_, i) => i + 1);

  const parts = rangeMatch[1].split('-').map(p => p.trim().toLowerCase());
  if (parts.length === 2 && MONTH_NAME_TO_NUM[parts[0]] && MONTH_NAME_TO_NUM[parts[1]]) {
    const start = MONTH_NAME_TO_NUM[parts[0]];
    const end = MONTH_NAME_TO_NUM[parts[1]];
    if (start <= end) {
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
    // handle wrap-around if ever needed
    return [...Array.from({ length: 12 - start + 1 }, (_, i) => start + i), ...Array.from({ length: end }, (_, i) => i + 1)];
  }

  return Array.from({ length: 12 }, (_, i) => i + 1);
}

export function generateRecurringDates(recurrence, year) {
  const months = getMonthsFromRecurrenceText(recurrence);
  const lower = recurrence.toLowerCase();

  // "Every Saturday" or "Every Sunday"
  if (lower.startsWith('every saturday') || lower.includes('every saturday')) {
    return generateWeeklyDates(year, months, 6);
  }
  if (lower.startsWith('every sunday') || lower.includes('every sunday')) {
    return generateWeeklyDates(year, months, 0);
  }

  // "Last Saturday monthly" or "Last Sunday monthly"
  const lastMatch = lower.match(/last\s+(saturday|sunday)\s+monthly/);
  if (lastMatch) {
    const weekday = WEEKDAY_TO_INDEX[lastMatch[1]];
    if (Number.isInteger(weekday)) {
      return generateLastWeekdayDates(year, months, weekday);
    }
  }

  // Nth weekday patterns: "1st Saturday monthly", "3rd Sunday monthly"
  const nthMatch = lower.match(/(\d)(st|nd|rd|th)\s+([a-z]+)\s+monthly/);
  if (nthMatch) {
    const nth = parseInt(nthMatch[1], 10);
    const weekday = WEEKDAY_TO_INDEX[nthMatch[3]];
    if (Number.isInteger(weekday)) {
      return generateNthWeekdayDates(year, months, weekday, nth);
    }
  }

  // Default: no recurrence parsed
  return [];
}

function generateLastWeekdayDates(year, months, weekdayIndex) {
  const dates = [];
  for (const month of months) {
    // Start from last day of month and work backwards
    const lastDay = new Date(Date.UTC(year, month, 0)); // Day 0 of next month = last day of this month
    for (let d = lastDay.getUTCDate(); d >= 1; d--) {
      const current = new Date(Date.UTC(year, month - 1, d));
      if (current.getUTCDay() === weekdayIndex) {
        dates.push(formatDate(current));
        break;
      }
    }
  }
  return dates;
}

function generateNthWeekdayDates(year, months, weekdayIndex, nth) {
  const dates = [];
  for (const month of months) {
    const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
    let count = 0;
    for (let d = 1; d <= 31; d++) {
      const current = new Date(Date.UTC(year, month - 1, d));
      if (current.getUTCMonth() + 1 !== month) break;
      if (current.getUTCDay() === weekdayIndex) {
        count += 1;
        if (count === nth) {
          dates.push(formatDate(current));
          break;
        }
      }
    }
  }
  return dates;
}

function generateWeeklyDates(year, months, weekdayIndex) {
  const dates = [];
  for (const month of months) {
    const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const firstWeekday = getFirstWeekdayOnOrAfter(firstOfMonth, weekdayIndex);
    for (
      let current = firstWeekday;
      current.getUTCMonth() + 1 === month;
      current = addDays(current, 7)
    ) {
      dates.push(formatDate(current));
    }
  }
  return dates;
}

function getFirstWeekdayOnOrAfter(date, weekdayIndex) {
  const delta = (weekdayIndex - date.getUTCDay() + 7) % 7;
  return addDays(date, delta);
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export function createClientOrThrow() {
  return getServiceSupabase();
}







