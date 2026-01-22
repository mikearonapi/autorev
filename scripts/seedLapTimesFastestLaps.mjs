/**
 * Seed track lap times from FastestLaps test pages (citeable URLs).
 *
 * This intentionally marks rows as unverified (verified=false) with moderate confidence.
 * Use /internal/lap-times and /api/internal/track/lap-times (admin) to review/verify.
 * 
 * UPDATED 2026-01-21: Uses centralized data validation layer
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { 
  validateCarReference, 
  validateTrackBySlug,
  DataValidationError,
  logValidationResults 
} from '../lib/dataValidation.js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

function slugify(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseLapTimeToMs(input) {
  if (input === null || input === undefined) return null;
  const s = String(input).trim();
  if (!s) return null;

  if (/^\d+$/.test(s)) {
    const ms = Number(s);
    if (ms > 0) return ms;
  }

  const parts = s.split(':');
  if (parts.length === 1) {
    const seconds = Number(parts[0]);
    if (!Number.isFinite(seconds) || seconds <= 0) return null;
    return Math.round(seconds * 1000);
  }
  if (parts.length === 2) {
    const minutes = Number(parts[0]);
    const seconds = Number(parts[1]);
    if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return null;
    if (minutes < 0 || seconds < 0 || seconds >= 60) return null;
    return Math.round((minutes * 60 + seconds) * 1000);
  }
  return null;
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

function parseFastestLapsTestPage(html) {
  const title = extractTitle(html);
  if (!title) throw new Error('Missing <title>');

  const t = title.replace(/\s+/g, ' ').trim();
  // Format: "<Car> lap time at <Track> - FastestLaps.com"
  const m = t.match(/^(.*?)\s+lap time at\s+(.*?)\s+-\s+FastestLaps\.com$/i);
  const carName = m?.[1]?.trim() || null;
  const trackName = m?.[2]?.trim() || null;

  // Prefer the highlighted reference row in the embedded segment table.
  const ref = html.match(/<tr[^>]*data-reference[^>]*>[\s\S]*?<td>\s*<b>[\s\S]*?<\/b>\s*<\/td>\s*<td>\s*<b>([^<]+)<\/b>/i);
  const lapTimeText = ref?.[1]?.trim() || null;

  return { title: t, carName, trackName, lapTimeText };
}

/**
 * Resolve car ID using centralized validation layer
 * @param {string} carSlug 
 * @returns {Promise<string>} car_id
 * @throws {DataValidationError} if car not found
 */
async function resolveCarIdValidated(carSlug) {
  return validateCarReference(carSlug, { throwOnNotFound: true });
}

/**
 * Upsert track to the unified tracks table (formerly track_venues)
 * NOTE: As of 2026-01-21, tracks and track_venues are consolidated.
 * @param {string} trackName 
 * @returns {Promise<{id: string, slug: string, name: string}>}
 */
async function upsertTrack(trackName) {
  const trackSlug = slugify(trackName);
  const { data, error } = await supabase
    .from('tracks')
    .upsert({ 
      slug: trackSlug, 
      name: trackName,
      is_active: true,
      data_source: 'fastestlaps'
    }, { onConflict: 'slug' })
    .select('id,slug,name')
    .single();
  if (error) throw error;
  return data;
}

async function maybeUpsertLayout(trackId, trackName) {
  // If trackName looks like "Virginia International Raceway Grand West Course (post 01/2014)",
  // treat the parenthetical as layout.
  const m = String(trackName || '').match(/^(.*?)\s*\\(([^)]+)\\)\\s*$/);
  if (!m) return { trackLayoutId: null, trackName: trackName || null, layoutName: null };

  const baseTrackName = m[1].trim();
  const layoutName = m[2].trim();
  const layoutKey = slugify(layoutName);
  if (!layoutKey) return { trackLayoutId: null, trackName: baseTrackName, layoutName };

  const { data, error } = await supabase
    .from('track_layouts')
    .upsert({ track_id: trackId, layout_key: layoutKey, name: layoutName }, { onConflict: 'track_id,layout_key' })
    .select('id')
    .single();
  if (error) throw error;
  return { trackLayoutId: data?.id || null, trackName: baseTrackName, layoutName };
}

async function alreadyExists({ carSlug, trackId, trackLayoutId, lapTimeMs, sourceUrl }) {
  let q = supabase
    .from('car_track_lap_times')
    .select('id')
    .eq('car_slug', carSlug)
    .eq('track_id', trackId)
    .eq('lap_time_ms', lapTimeMs)
    .limit(1);

  if (trackLayoutId) q = q.eq('track_layout_id', trackLayoutId);
  else q = q.is('track_layout_id', null);

  if (sourceUrl) q = q.eq('source_url', sourceUrl);
  else q = q.is('source_url', null);

  const { data, error } = await q;
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

const SEEDS = [
  // Porsche 718 Cayman GT4
  { carSlug: '718-cayman-gt4', url: 'https://fastestlaps.com/tests/n5iim3i1t3dc' },
  { carSlug: '718-cayman-gt4', url: 'https://fastestlaps.com/tests/hshp4vs69lan' },
  { carSlug: '718-cayman-gt4', url: 'https://fastestlaps.com/tests/t80svkr0l6dm' },
  { carSlug: '718-cayman-gt4', url: 'https://fastestlaps.com/tests/i88t2rli1ij1' },
  { carSlug: '718-cayman-gt4', url: 'https://fastestlaps.com/tests/b2ofgndft19j' },

  // Chevrolet C8 Corvette Stingray
  { carSlug: 'c8-corvette-stingray', url: 'https://fastestlaps.com/tests/nalc6iroivps' },
  { carSlug: 'c8-corvette-stingray', url: 'https://fastestlaps.com/tests/hh1ljd84bgp4' },
  { carSlug: 'c8-corvette-stingray', url: 'https://fastestlaps.com/tests/clvcv0464mj8' },
  { carSlug: 'c8-corvette-stingray', url: 'https://fastestlaps.com/tests/pbvrrn27alob' },
  { carSlug: 'c8-corvette-stingray', url: 'https://fastestlaps.com/tests/31o9f85b9eae' },
  { carSlug: 'c8-corvette-stingray', url: 'https://fastestlaps.com/tests/i49h9n4zach9' },
  { carSlug: 'c8-corvette-stingray', url: 'https://fastestlaps.com/tests/iia751jf1zle' },
  { carSlug: 'c8-corvette-stingray', url: 'https://fastestlaps.com/tests/4sestsg39077' },

  // Audi RS3
  { carSlug: 'audi-rs3-8v', url: 'https://fastestlaps.com/tests/3i0ljdp9d45z' },
  { carSlug: 'audi-rs3-8v', url: 'https://fastestlaps.com/tests/szafnshcazje' },
  { carSlug: 'audi-rs3-8v', url: 'https://fastestlaps.com/tests/tta77l96ohgh' },
  { carSlug: 'audi-rs3-8y', url: 'https://fastestlaps.com/tests/fmaosmcmp3ek' },
  { carSlug: 'audi-rs3-8y', url: 'https://fastestlaps.com/tests/bbi7loooi171' },

  // Volkswagen GTI Mk7
  { carSlug: 'volkswagen-gti-mk7', url: 'https://fastestlaps.com/tests/1l8ib7sri7hm' },
  { carSlug: 'volkswagen-gti-mk7', url: 'https://fastestlaps.com/tests/eu3272p4e2kt' },
];

async function main() {
  console.log(`Seeding ${SEEDS.length} lap times from FastestLaps…`);

  let inserted = 0;
  let skipped = 0;
  let validationErrors = [];

  for (const seed of SEEDS) {
    const { carSlug, url } = seed;

    try {
      // Validate car reference using centralized validation layer
      const carId = await resolveCarIdValidated(carSlug);
      
      const res = await fetch(url, { headers: { 'User-Agent': 'AutoRev/1.0' } });
      if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
      const html = await res.text();

      const parsed = parseFastestLapsTestPage(html);
      if (!parsed.trackName || !parsed.lapTimeText) {
        throw new Error(`Could not parse trackName/lapTimeText for ${url}`);
      }

      // Track + layout - using unified tracks table
      const track = await upsertTrack(parsed.trackName);
      const { trackLayoutId } = await maybeUpsertLayout(track.id, parsed.trackName);

      const lapTimeMs = parseLapTimeToMs(parsed.lapTimeText);
      if (!lapTimeMs) throw new Error(`Could not parse lap time "${parsed.lapTimeText}" for ${url}`);

      const exists = await alreadyExists({
        carSlug,
        trackId: track.id,
        trackLayoutId,
        lapTimeMs,
        sourceUrl: url,
      });
      if (exists) {
        skipped++;
        continue;
      }

      const notes = [
        'Seeded from FastestLaps test page.',
        parsed.carName ? `Page car: ${parsed.carName}` : null,
        parsed.title ? `Page title: ${parsed.title}` : null,
      ].filter(Boolean).join(' ');

      const { error } = await supabase.from('car_track_lap_times').insert({
        car_id: carId,
        car_slug: carSlug,
        car_variant_id: null,
        track_id: track.id,
        track_layout_id: trackLayoutId,
        lap_time_ms: lapTimeMs,
        lap_time_text: parsed.lapTimeText,
        session_date: null,
        is_stock: true,
        tires: null,
        fuel: null,
        transmission: null,
        conditions: { source: 'fastestlaps', fetched_at: new Date().toISOString() },
        modifications: {},
        notes,
        source_url: url,
        source_document_id: null,
        confidence: 0.65,
        verified: false,
      });
      if (error) throw error;
      inserted++;
    } catch (err) {
      if (err instanceof DataValidationError) {
        validationErrors.push({ carSlug, url, reason: err.message });
        console.warn(`[Validation] Skipped ${carSlug}: ${err.message}`);
      } else {
        throw err;
      }
    }
  }

  // Log validation results
  logValidationResults('seedLapTimesFastestLaps', {
    total: SEEDS.length,
    valid: SEEDS.filter((_, i) => !validationErrors.find(e => e.carSlug === SEEDS[i].carSlug)),
    invalid: validationErrors,
  });

  console.log(`Done. Inserted: ${inserted}. Skipped (already existed): ${skipped}. Validation errors: ${validationErrors.length}`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});















