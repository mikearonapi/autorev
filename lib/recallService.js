/**
 * Recall Service
 *
 * Responsibilities:
 * - Map our car records (slug/name/brand/years) to NHTSA recallsByVehicle queries
 * - Normalize NHTSA recall payloads into `car_recalls` rows
 * - Upsert batches efficiently
 *
 * @module lib/recallService
 */

import { fetchRecallsByVehicle as fetchRecallsByVehicleNhtsa, buildRecallsByVehicleUrl } from './nhtsaClient.js';

/**
 * @typedef {Object} CarIdentifier
 * @property {number} modelYear
 * @property {string} make
 * @property {string} model
 * @property {string} sourceUrl
 */

/**
 * Parse a `cars.years` string like:
 * - "2016-2019"
 * - "2016"
 * Returns inclusive [start,end] or null if unparsable.
 *
 * @param {string|null|undefined} yearsText
 * @returns {{start:number,end:number}|null}
 */
export function parseYearsRange(yearsText) {
  if (!yearsText || typeof yearsText !== 'string') return null;
  const m = yearsText.match(/(\d{4})(?:\s*-\s*(\d{4}))?/);
  if (!m) return null;
  const start = Number(m[1]);
  const end = Number(m[2] || m[1]);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start < 1970 || end > 2100) return null;
  return { start: Math.min(start, end), end: Math.max(start, end) };
}

/**
 * Known mappings from our car names to NHTSA model names.
 * Keys are lowercase patterns, values are NHTSA model names.
 */
const MODEL_NAME_MAP = {
  // BMW
  'm3': 'M3',
  'm4': 'M4',
  'm5': 'M5',
  'm2': 'M2',
  '1 series m': 'M2', // closest NHTSA equivalent
  'z4': 'Z4',
  'z4 m': 'Z4',
  // Porsche - NHTSA uses simple names
  '911': '911',
  'cayman': '718 Cayman', // try with 718 prefix
  'boxster': '718 Boxster',
  'cayenne': 'Cayenne',
  'panamera': 'Panamera',
  'taycan': 'Taycan',
  'macan': 'Macan',
  '718': '718', // fallback
  // Chevrolet
  'corvette': 'Corvette',
  'camaro': 'Camaro',
  // Toyota
  'supra': 'Supra',
  'gr86': '86', // NHTSA uses "86"
  '86': '86',
  // Nissan
  '370z': '370Z',
  '350z': '350Z',
  'gt-r': 'GT-R',
  'gtr': 'GT-R',
  'z': 'Z',
  // Ford
  'mustang': 'Mustang',
  'gt': 'GT',
  // Dodge
  'challenger': 'Challenger',
  'charger': 'Charger',
  'viper': 'Viper',
  // Honda/Acura
  'civic': 'Civic',
  'integra': 'Integra',
  'nsx': 'NSX',
  's2000': 'S2000',
  // Subaru
  'wrx': 'WRX',
  'brz': 'BRZ',
  'impreza': 'Impreza',
  // Mazda
  'miata': 'MX-5 Miata',
  'mx-5': 'MX-5 Miata',
  'rx-7': 'RX-7',
  'rx-8': 'RX-8',
  // Mercedes
  'amg gt': 'AMG GT',
  'c63': 'C-Class',
  'e63': 'E-Class',
  // Audi
  'r8': 'R8',
  'rs3': 'RS 3',
  'rs5': 'RS 5',
  'tt rs': 'TT RS',
  'tt': 'TT',
  // Alfa Romeo
  '4c': '4C',
  'giulia': 'Giulia',
  // Lexus
  'lfa': 'LFA',
  'is f': 'IS F',
  'rc f': 'RC F',
  'lc 500': 'LC',
  // Lotus
  'elise': 'Elise',
  'exige': 'Exige',
  'evora': 'Evora',
  'emira': 'Emira',
  // Cadillac
  'cts-v': 'CTS-V',
  'ct5-v': 'CT5-V',
  'ats-v': 'ATS-V',
  // Aston Martin
  'vantage': 'Vantage',
  'db9': 'DB9',
  'db11': 'DB11',
  // Lamborghini
  'huracan': 'Huracan',
  'gallardo': 'Gallardo',
  // McLaren
  '570s': '570S',
  '720s': '720S',
  'gt': 'GT',
  // Mitsubishi
  'evo': 'Lancer Evolution',
  'lancer evolution': 'Lancer Evolution',
};

/**
 * Extract NHTSA-compatible model name from our car name.
 * Uses pattern matching against known model names.
 *
 * @param {string} carName - Full car name like "BMW M3 E46" or "C8 Corvette Stingray"
 * @returns {string} NHTSA model name or best guess
 */
export function normalizeModelName(carName) {
  const s = String(carName || '').toLowerCase();
  
  // Try exact/prefix matches against our map (longest match first)
  const sortedKeys = Object.keys(MODEL_NAME_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (s.includes(key)) {
      return MODEL_NAME_MAP[key];
    }
  }
  
  // Fallback: strip chassis codes, parentheticals, and trim variants
  const cleaned = String(carName || '')
    .replace(/\([^)]+\)/g, '') // remove parenthetical annotations
    .replace(/\b[CEFGW]\d{1,3}\b/gi, '') // chassis codes like E46, F80, C8
    .replace(/\b(Competition|Type R|Type S|Nismo|GT4|GTS|RS|SS|1LE|ZL1|Z06|Grand Sport|Stingray|Quadrifoglio)\b/gi, '')
    .replace(/\bGen\s*\d+\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  // If cleaned has multiple words, try to find the base model (usually 2nd word after brand)
  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    // Skip brand-like first word, return second
    return parts[1];
  }
  
  return cleaned || String(carName || '').trim();
}

/**
 * NHTSA tends to prefer "Mercedes-Benz" while our UI/brands often use "Mercedes".
 * Keep this conservative; add overrides only when known.
 *
 * @param {string} makeRaw
 * @returns {string}
 */
export function normalizeMakeName(makeRaw) {
  const s = String(makeRaw || '').trim();
  if (!s) return s;
  const lower = s.toLowerCase();
  if (lower === 'mercedes') return 'Mercedes-Benz';
  return s;
}

/**
 * Build NHTSA queries for a car record.
 * Uses the full year range (inclusive). This is important because recalls are year-specific.
 *
 * @param {{slug:string, name?:string|null, brand?:string|null, years?:string|null}} car
 * @param {object} [options]
 * @param {number} [options.maxYears] - safety cap to avoid huge ranges
 * @returns {{error:string|null, carSlug:string, identifiers: CarIdentifier[]}}
 */
export function buildCarRecallIdentifiers(car, options = {}) {
  const carSlug = car?.slug;
  if (!carSlug) return { error: 'car.slug is required', carSlug: '', identifiers: [] };

  const yearsRange = parseYearsRange(car?.years || null);
  if (!yearsRange) {
    return { error: `Unable to parse years for ${carSlug}`, carSlug, identifiers: [] };
  }

  const maxYears = Math.max(1, Math.min(Number(options.maxYears ?? 25), 50));
  const span = (yearsRange.end - yearsRange.start) + 1;
  if (span > maxYears) {
    return { error: `Year range too large for ${carSlug} (${yearsRange.start}-${yearsRange.end})`, carSlug, identifiers: [] };
  }

  // Use brand column directly for make (with normalization for Mercedes etc.)
  const make = normalizeMakeName(car?.brand || '');
  // Extract NHTSA-compatible model from the full car name
  const model = normalizeModelName(car?.name || '');

  if (!make || !model) {
    return { error: `Unable to parse make/model for ${carSlug}`, carSlug, identifiers: [] };
  }

  /** @type {CarIdentifier[]} */
  const identifiers = [];
  for (let y = yearsRange.start; y <= yearsRange.end; y++) {
    const sourceUrl = buildRecallsByVehicleUrl({ make, model, modelYear: y });
    identifiers.push({ modelYear: y, make, model, sourceUrl });
  }

  return { error: null, carSlug, identifiers };
}

/**
 * Convert NHTSA date format (DD/MM/YYYY) to ISO (YYYY-MM-DD).
 * Returns null if unparseable.
 *
 * @param {string|null|undefined} nhtsaDate
 * @returns {string|null}
 */
function parseNhtsaDate(nhtsaDate) {
  if (!nhtsaDate || typeof nhtsaDate !== 'string') return null;
  
  // NHTSA uses DD/MM/YYYY format
  const match = nhtsaDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  
  // Try ISO format if already correct
  if (/^\d{4}-\d{2}-\d{2}$/.test(nhtsaDate)) {
    return nhtsaDate;
  }
  
  return null;
}

/**
 * Map NHTSA recall object into our `car_recalls` table row.
 *
 * We populate BOTH:
 * - existing columns: campaign_number, report_received_date, is_incomplete
 * - forward-facing columns: recall_campaign_number, recall_date, manufacturer, notes, source_url
 *   (added via a schema migration in this feature)
 *
 * @param {string} carSlug
 * @param {any} recall
 * @param {string} sourceUrl
 * @returns {object|null}
 */
export function mapNhtsaRecallToCarRecallsRow(carSlug, recall, sourceUrl) {
  if (!carSlug) return null;

  const campaign =
    recall?.NHTSACampaignNumber ||
    recall?.CampaignNumber ||
    recall?.campaignNumber ||
    null;

  if (!campaign || typeof campaign !== 'string') return null;

  const reportReceivedDateRaw =
    recall?.ReportReceivedDate ||
    recall?.reportReceivedDate ||
    null;
  
  const reportReceivedDate = parseNhtsaDate(reportReceivedDateRaw);

  const isIncomplete = Boolean(
    recall?.VINInfoSummary?.includes?.('INCOMPLETE') ||
    recall?.incomplete === true
  );

  const manufacturer = recall?.Manufacturer || recall?.manufacturer || null;
  const component = recall?.Component || recall?.component || null;
  const summary = recall?.Summary || recall?.summary || null;
  const consequence = recall?.Consequence || recall?.consequence || null;
  const remedy = recall?.Remedy || recall?.remedy || null;
  const notes = recall?.Notes || recall?.notes || null;

  return {
    car_slug: carSlug,

    // Existing schema
    campaign_number: campaign,
    component,
    summary,
    consequence,
    remedy,
    report_received_date: reportReceivedDate,
    is_incomplete: isIncomplete,

    // Schema reminder fields (added by migration for feature parity)
    recall_campaign_number: campaign,
    recall_date: reportReceivedDate,
    manufacturer,
    notes,
    source_url: sourceUrl || null,
  };
}

/**
 * Fetch recalls for a single car and return normalized DB rows.
 *
 * @param {object} params
 * @param {{slug:string,name?:string|null,brand?:string|null,years?:string|null}} params.car
 * @param {number} [params.maxYears]
 * @param {number} [params.perRequestTimeoutMs]
 * @param {number} [params.retries]
 * @returns {Promise<{car_slug:string, rows: object[], errors: string[]}>}
 */
export async function fetchRecallRowsForCar(params) {
  const car = params?.car;
  const carSlug = car?.slug || '';
  const { error, identifiers } = buildCarRecallIdentifiers(car, { maxYears: params?.maxYears });

  if (error) return { car_slug: carSlug, rows: [], errors: [error] };

  /** @type {object[]} */
  const allRows = [];
  /** @type {string[]} */
  const errors = [];

  for (const id of identifiers) {
    const res = await fetchRecallsByVehicleNhtsa(
      { make: id.make, model: id.model, modelYear: id.modelYear },
      {
        timeoutMs: params?.perRequestTimeoutMs ?? 12_000,
        retries: params?.retries ?? 2,
        logWarn: (msg, meta) => console.warn('[recallService] NHTSA warn:', msg, meta || {}),
      }
    );

    if (!res.ok) {
      errors.push(`${carSlug}:${id.modelYear}:${res.error || 'nhtsa_error'}`);
      continue;
    }

    const results = Array.isArray(res.data?.results) ? res.data.results : [];
    for (const r of results) {
      const row = mapNhtsaRecallToCarRecallsRow(carSlug, r, id.sourceUrl);
      if (row) allRows.push(row);
    }
  }

  // Deduplicate within this batch by campaign_number.
  const dedup = new Map();
  for (const row of allRows) {
    const key = `${row.car_slug}:${row.campaign_number}`;
    if (!dedup.has(key)) dedup.set(key, row);
  }

  return { car_slug: carSlug, rows: [...dedup.values()], errors };
}

/**
 * Upsert recall rows into `car_recalls` (single statement).
 *
 * @param {object} params
 * @param {import('@supabase/supabase-js').SupabaseClient} params.client - service role recommended
 * @param {object[]} params.rows
 * @returns {Promise<{success:boolean, upserted:number, error?:string}>}
 */
export async function upsertRecallRows({ client, rows }) {
  if (!client) return { success: false, upserted: 0, error: 'client is required' };
  if (!Array.isArray(rows) || rows.length === 0) return { success: true, upserted: 0 };

  try {
    const { error } = await client
      .from('car_recalls')
      .upsert(rows, { onConflict: 'car_slug,campaign_number' });

    if (error) throw error;
    return { success: true, upserted: rows.length };
  } catch (err) {
    console.error('[recallService] upsertRecallRows failed:', err);
    return { success: false, upserted: 0, error: err?.message || 'upsert failed' };
  }
}

