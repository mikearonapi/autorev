/**
 * Complaint Service
 *
 * Responsibilities:
 * - Map our car records (slug/name/brand/years) to NHTSA complaintsByVehicle queries
 * - Normalize NHTSA complaint payloads into `car_issues` rows (kind='complaint')
 * - Upsert batches efficiently with deduplication
 *
 * Note: NHTSA TSB API requires authentication, so we use the public Complaints API
 * which provides valuable real-world safety data reported by consumers.
 *
 * @module lib/complaintService
 */

import { fetchJsonWithRetry } from './nhtsaClient.js';
import { parseYearsRange, normalizeModelName, normalizeMakeName } from './recallService.js';

const NHTSA_API_BASE = 'https://api.nhtsa.gov';

/**
 * @typedef {Object} CarIdentifier
 * @property {number} modelYear
 * @property {string} make
 * @property {string} model
 * @property {string} sourceUrl
 */

/**
 * Build complaintsByVehicle URL for make/model/year.
 * @param {object} params
 * @param {string} params.make
 * @param {string} params.model
 * @param {number} params.modelYear
 * @returns {string}
 */
export function buildComplaintsByVehicleUrl({ make, model, modelYear }) {
  const qs = new URLSearchParams({
    make: String(make).trim(),
    model: String(model).trim(),
    modelYear: String(modelYear),
  });
  return `${NHTSA_API_BASE}/complaints/complaintsByVehicle?${qs.toString()}`;
}

/**
 * Build NHTSA queries for a car record.
 * Uses the full year range (inclusive).
 *
 * @param {{slug:string, name?:string|null, brand?:string|null, years?:string|null}} car
 * @param {object} [options]
 * @param {number} [options.maxYears] - safety cap to avoid huge ranges (default 25)
 * @returns {{error:string|null, carSlug:string, identifiers: CarIdentifier[]}}
 */
export function buildCarComplaintIdentifiers(car, options = {}) {
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
    const sourceUrl = buildComplaintsByVehicleUrl({ make, model, modelYear: y });
    identifiers.push({ modelYear: y, make, model, sourceUrl });
  }

  return { error: null, carSlug, identifiers };
}

/**
 * Component to severity mapping for complaints.
 * Based on safety-criticality of the component.
 *
 * @param {string|null|undefined} component
 * @param {object} complaint - Full complaint object for additional context
 * @returns {'critical'|'high'|'medium'|'low'|'unknown'}
 */
export function mapComponentToSeverity(component, complaint = {}) {
  // If there were deaths or injuries, always critical/high
  if (complaint.numberOfDeaths > 0) return 'critical';
  if (complaint.numberOfInjuries > 0) return 'high';
  if (complaint.crash === true) return 'high';
  if (complaint.fire === true) return 'critical';

  if (!component || typeof component !== 'string') return 'unknown';

  const c = component.toUpperCase();

  // Critical components - immediate safety risk
  if (c.includes('AIR BAG')) return 'critical';
  if (c.includes('FUEL') && (c.includes('LEAK') || c.includes('FIRE'))) return 'critical';

  // High severity - significant safety concern
  if (c.includes('BRAKE')) return 'high';
  if (c.includes('STEERING')) return 'high';
  if (c.includes('FUEL')) return 'high';
  if (c.includes('ENGINE') && c.includes('FIRE')) return 'high';
  if (c.includes('POWER TRAIN')) return 'high';
  if (c.includes('SUSPENSION')) return 'high';
  if (c.includes('WHEEL')) return 'high';
  if (c.includes('TIRE')) return 'high';

  // Medium severity - operational concerns
  if (c.includes('ENGINE')) return 'medium';
  if (c.includes('TRANSMISSION')) return 'medium';
  if (c.includes('ELECTRICAL')) return 'medium';
  if (c.includes('LIGHTING')) return 'medium';
  if (c.includes('VISIBILITY')) return 'medium';
  if (c.includes('COOLING')) return 'medium';
  if (c.includes('EXHAUST')) return 'medium';

  // Low severity - inconvenience/quality issues
  if (c.includes('INTERIOR')) return 'low';
  if (c.includes('SEAT')) return 'low';
  if (c.includes('NOISE')) return 'low';
  if (c.includes('BODY')) return 'low';
  if (c.includes('PAINT')) return 'low';
  if (c.includes('TRIM')) return 'low';
  if (c.includes('EQUIPMENT')) return 'low';

  return 'unknown';
}

/**
 * Parse NHTSA date format (MM/DD/YYYY) to ISO (YYYY-MM-DD).
 * Returns null if unparseable.
 *
 * @param {string|null|undefined} nhtsaDate
 * @returns {string|null}
 */
function parseNhtsaDate(nhtsaDate) {
  if (!nhtsaDate || typeof nhtsaDate !== 'string') return null;

  // NHTSA uses MM/DD/YYYY format for complaints
  const match = nhtsaDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
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
 * Truncate string to max length, appending "..." if truncated.
 * @param {string|null|undefined} str
 * @param {number} maxLen
 * @returns {string|null}
 */
function truncate(str, maxLen) {
  if (!str || typeof str !== 'string') return null;
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

/**
 * Map NHTSA complaint object into our `car_issues` table row.
 *
 * @param {string} carSlug
 * @param {string} carId - UUID from cars table
 * @param {any} complaint - Raw NHTSA complaint object
 * @param {number} modelYear - The model year this complaint is for
 * @returns {object|null}
 */
export function mapNhtsaComplaintToCarIssuesRow(carSlug, carId, complaint, modelYear) {
  if (!carSlug || !carId) return null;

  const odiNumber = complaint?.odiNumber;
  if (!odiNumber) return null;

  const component = complaint?.components || null;
  const summary = complaint?.summary || null;
  const dateOfIncident = parseNhtsaDate(complaint?.dateOfIncident);
  const dateComplaintFiled = parseNhtsaDate(complaint?.dateComplaintFiled);

  // Build title from component + abbreviated summary
  const titleBase = component || 'Consumer Complaint';
  const title = truncate(`${titleBase}: ${summary?.slice(0, 100) || 'Reported issue'}`, 200);

  // Build description with full details
  const description = summary || 'No description provided';

  // Severity based on component and incident details
  const severity = mapComponentToSeverity(component, complaint);

  // Build metadata with raw response
  const metadata = {
    nhtsa_odi_number: odiNumber,
    nhtsa_component: component,
    nhtsa_manufacturer: complaint?.manufacturer,
    date_of_incident: dateOfIncident,
    date_complaint_filed: dateComplaintFiled,
    crash: complaint?.crash || false,
    fire: complaint?.fire || false,
    injuries: complaint?.numberOfInjuries || 0,
    deaths: complaint?.numberOfDeaths || 0,
    vin_partial: complaint?.vin || null,
    model_year: modelYear,
    raw_response: complaint,
  };

  return {
    car_id: carId,
    car_slug: carSlug,
    kind: 'other', // Using 'other' since complaints aren't TSBs or recalls
    severity,
    title,
    description: truncate(description, 5000),
    symptoms: null, // Could parse from summary in future
    prevention: null,
    fix_description: null,
    affected_years_text: String(modelYear),
    affected_year_start: modelYear,
    affected_year_end: modelYear,
    estimated_cost_text: null,
    estimated_cost_low: null,
    estimated_cost_high: null,
    source_type: 'nhtsa_complaint',
    source_url: `https://www.nhtsa.gov/vehicle/${modelYear}/${encodeURIComponent(complaint?.products?.[0]?.productMake || '')}/${encodeURIComponent(complaint?.products?.[0]?.productModel || '')}`,
    confidence: 1.0, // Official source
    sort_order: 0,
    metadata,
  };
}

/**
 * Fetch complaints for a single car and return normalized DB rows.
 *
 * @param {object} params
 * @param {{slug:string, id:string, name?:string|null, brand?:string|null, years?:string|null}} params.car
 * @param {number} [params.maxYears] - Max years to query (default 25)
 * @param {number} [params.perRequestTimeoutMs] - Timeout per API call (default 15000)
 * @param {number} [params.retries] - Retry count (default 2)
 * @param {number} [params.delayBetweenRequests] - Delay in ms between requests (default 300)
 * @returns {Promise<{car_slug:string, rows: object[], errors: string[], totalFetched: number}>}
 */
export async function fetchComplaintRowsForCar(params) {
  const car = params?.car;
  const carSlug = car?.slug || '';
  const carId = car?.id || '';
  const { error, identifiers } = buildCarComplaintIdentifiers(car, { maxYears: params?.maxYears });

  if (error) return { car_slug: carSlug, rows: [], errors: [error], totalFetched: 0 };
  if (!carId) return { car_slug: carSlug, rows: [], errors: ['car.id is required'], totalFetched: 0 };

  /** @type {object[]} */
  const allRows = [];
  /** @type {string[]} */
  const errors = [];
  let totalFetched = 0;

  for (const id of identifiers) {
    const url = buildComplaintsByVehicleUrl({ make: id.make, model: id.model, modelYear: id.modelYear });

    const res = await fetchJsonWithRetry(url, {
      timeoutMs: params?.perRequestTimeoutMs ?? 15_000,
      retries: params?.retries ?? 2,
      logWarn: (msg, meta) => console.warn('[complaintService] NHTSA warn:', msg, meta || {}),
    });

    if (!res.ok) {
      errors.push(`${carSlug}:${id.modelYear}:${res.error || 'nhtsa_error'}`);
      continue;
    }

    const results = Array.isArray(res.data?.results) ? res.data.results : [];
    totalFetched += results.length;

    for (const r of results) {
      const row = mapNhtsaComplaintToCarIssuesRow(carSlug, carId, r, id.modelYear);
      if (row) allRows.push(row);
    }

    // Add delay between requests to be respectful to NHTSA
    if (params?.delayBetweenRequests && identifiers.indexOf(id) < identifiers.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, params.delayBetweenRequests));
    }
  }

  // Deduplicate within this batch by ODI number (unique complaint ID)
  const dedup = new Map();
  for (const row of allRows) {
    const odiNumber = row.metadata?.nhtsa_odi_number;
    const key = `${row.car_slug}:${odiNumber}`;
    if (!dedup.has(key)) dedup.set(key, row);
  }

  return { car_slug: carSlug, rows: [...dedup.values()], errors, totalFetched };
}

/**
 * Upsert complaint rows into `car_issues`.
 * Uses ODI number in metadata for deduplication via a conflict check.
 *
 * @param {object} params
 * @param {import('@supabase/supabase-js').SupabaseClient} params.client - service role recommended
 * @param {object[]} params.rows
 * @returns {Promise<{success:boolean, inserted:number, updated:number, error?:string}>}
 */
export async function upsertComplaintRows({ client, rows }) {
  if (!client) return { success: false, inserted: 0, updated: 0, error: 'client is required' };
  if (!Array.isArray(rows) || rows.length === 0) return { success: true, inserted: 0, updated: 0 };

  let inserted = 0;
  let updated = 0;

  try {
    // Since car_issues doesn't have a unique constraint on ODI number,
    // we need to check for existing records and handle upsert manually
    for (const row of rows) {
      const odiNumber = row.metadata?.nhtsa_odi_number;
      if (!odiNumber) continue;

      // Check if this complaint already exists
      const { data: existing } = await client
        .from('car_issues')
        .select('id')
        .eq('car_slug', row.car_slug)
        .eq('source_type', 'nhtsa_complaint')
        .contains('metadata', { nhtsa_odi_number: odiNumber })
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error: updateErr } = await client
          .from('car_issues')
          .update({
            ...row,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateErr) throw updateErr;
        updated++;
      } else {
        // Insert new record
        const { error: insertErr } = await client
          .from('car_issues')
          .insert(row);

        if (insertErr) throw insertErr;
        inserted++;
      }
    }

    return { success: true, inserted, updated };
  } catch (err) {
    console.error('[complaintService] upsertComplaintRows failed:', err);
    return { success: false, inserted, updated, error: err?.message || 'upsert failed' };
  }
}

/**
 * Batch upsert complaint rows - more efficient for large datasets.
 * First deletes existing complaints for the car, then inserts all new ones.
 *
 * @param {object} params
 * @param {import('@supabase/supabase-js').SupabaseClient} params.client
 * @param {string} params.carSlug
 * @param {object[]} params.rows
 * @returns {Promise<{success:boolean, deleted:number, inserted:number, error?:string}>}
 */
export async function replaceComplaintsForCar({ client, carSlug, rows }) {
  if (!client) return { success: false, deleted: 0, inserted: 0, error: 'client is required' };
  if (!carSlug) return { success: false, deleted: 0, inserted: 0, error: 'carSlug is required' };

  try {
    // Delete existing complaints for this car
    const { data: deleted, error: deleteErr } = await client
      .from('car_issues')
      .delete()
      .eq('car_slug', carSlug)
      .eq('source_type', 'nhtsa_complaint')
      .select('id');

    if (deleteErr) throw deleteErr;

    const deletedCount = deleted?.length || 0;

    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: true, deleted: deletedCount, inserted: 0 };
    }

    // Insert all new rows
    const { error: insertErr } = await client
      .from('car_issues')
      .insert(rows);

    if (insertErr) throw insertErr;

    return { success: true, deleted: deletedCount, inserted: rows.length };
  } catch (err) {
    console.error('[complaintService] replaceComplaintsForCar failed:', err);
    return { success: false, deleted: 0, inserted: 0, error: err?.message || 'replace failed' };
  }
}



