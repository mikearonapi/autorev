/**
 * Seed baseline + "modded estimate" dyno runs for key tuned platforms.
 *
 * Notes:
 * - Baseline runs use the car's stored HP/TQ as "OEM rated" (not a dyno pull).
 * - Modded runs are estimates derived from AutoRev's upgrade package model (not measured).
 * - All rows are inserted as verified=false with moderate confidence.
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { calculateRealisticHpGain, genericPackages } from '../data/upgradePackages.js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const TARGET_CAR_SLUGS = ['volkswagen-gti-mk7', 'audi-rs3-8v', 'audi-rs3-8y'];

const baselineSourceUrl = 'repo://data/cars.js';
const moddedSourceUrl = 'repo://data/upgradePackages.js';

function pickPackage(key) {
  return (genericPackages || []).find((p) => p?.key === key) || null;
}

async function alreadyExists({ carSlug, runKind, sourceUrl }) {
  const { data, error } = await supabase
    .from('car_dyno_runs')
    .select('id')
    .eq('car_slug', carSlug)
    .eq('run_kind', runKind)
    .eq('source_url', sourceUrl)
    .limit(1);
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
}

async function insertRun(payload) {
  const { error } = await supabase.from('car_dyno_runs').insert(payload);
  if (error) throw error;
}

async function main() {
  const trackPack = pickPackage('trackPack');
  if (!trackPack) throw new Error('Could not find genericPackages trackPack');

  const { data: cars, error } = await supabase
    .from('cars')
    .select('id,slug,name,hp,torque,engine')
    .in('slug', TARGET_CAR_SLUGS);
  if (error) throw error;

  const bySlug = new Map((cars || []).map((c) => [c.slug, c]));

  let inserted = 0;
  let skipped = 0;

  for (const slug of TARGET_CAR_SLUGS) {
    const car = bySlug.get(slug);
    if (!car) {
      console.warn(`Skipping missing car: ${slug}`);
      continue;
    }

    // Baseline (OEM-rated, not dyno)
    if (await alreadyExists({ carSlug: slug, runKind: 'baseline', sourceUrl: baselineSourceUrl })) {
      skipped++;
    } else {
      await insertRun({
        car_id: car.id,
        car_slug: slug,
        run_kind: 'baseline',
        recorded_at: null,
        dyno_type: 'oem_rated',
        correction: null,
        drivetrain: null,
        transmission: null,
        gear: null,
        fuel: null,
        is_wheel: false,
        peak_whp: null,
        peak_wtq: null,
        peak_hp: Number.isFinite(Number(car.hp)) ? Number(car.hp) : null,
        peak_tq: Number.isFinite(Number(car.torque)) ? Number(car.torque) : null,
        boost_psi_max: null,
        curve: {},
        conditions: { source: 'internal_specs' },
        modifications: {},
        notes: 'Seeded from internal car specs (OEM-rated; not a dyno pull).',
        source_url: baselineSourceUrl,
        confidence: 0.6,
        verified: false,
      });
      inserted++;
    }

    // Modded (estimated)
    const hpGain = calculateRealisticHpGain(
      { slug: car.slug, engine: car.engine, hp: car.hp },
      [trackPack]
    );
    const baseHp = Number.isFinite(Number(car.hp)) ? Number(car.hp) : null;
    const estHp = baseHp !== null ? baseHp + Number(hpGain || 0) : null;

    if (await alreadyExists({ carSlug: slug, runKind: 'modded', sourceUrl: moddedSourceUrl })) {
      skipped++;
    } else {
      await insertRun({
        car_id: car.id,
        car_slug: slug,
        run_kind: 'modded',
        recorded_at: null,
        dyno_type: 'estimated_from_package_model',
        correction: null,
        drivetrain: null,
        transmission: null,
        gear: null,
        fuel: null,
        is_wheel: false,
        peak_whp: null,
        peak_wtq: null,
        peak_hp: estHp,
        peak_tq: null,
        boost_psi_max: null,
        curve: {},
        conditions: { source: 'estimate', model: 'upgradePackages.trackPack' },
        modifications: {
          estimate: true,
          package: { key: trackPack.key, name: trackPack.name, hpGain },
        },
        notes: `Estimated from AutoRev upgrade package model (${trackPack.name}); not a measured dyno pull.`,
        source_url: moddedSourceUrl,
        confidence: 0.55,
        verified: false,
      });
      inserted++;
    }
  }

  console.log(`Done. Inserted: ${inserted}. Skipped (already existed): ${skipped}.`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});















