/**
 * Generate initial part_relationships for the pilot dataset.
 *
 * Focus: conservative, rules-based relationships that reduce hallucinations:
 * - forced induction / turbo parts -> recommended_with tune/cooling/fuel parts
 * - downpipes -> requires tune (best-effort keyword)
 * - multiple ECU/flash tools -> conflicts_with each other (so AL doesn't recommend two)
 *
 * Env (.env.local):
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * Run:
 *   node scripts/generatePartRelationshipsPilot.mjs
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PILOT_VARIANT_KEYS = [
  'volkswagen-gti-mk7:MK7-GTI',
  'audi-rs3-8v:8V-RS3',
  'audi-rs3-8y:8Y-RS3',
];

function norm(s) {
  return String(s || '').toLowerCase();
}

function isTunePart(p) {
  const n = norm(p.name);
  const pt = norm(p?.attributes?.source?.productType);
  return (
    p.category === 'tune' ||
    n.includes('tune') ||
    n.includes('flash') ||
    n.includes('powerlink') ||
    pt.includes('tuning') ||
    pt.includes('software')
  );
}

function isDownpipe(p) {
  const n = norm(p.name);
  return n.includes('downpipe') || (n.includes('dp ') && n.includes('turbo'));
}

function pickBest(candidates, { preferBrand = null, preferKeywords = [] } = {}) {
  let best = null;
  let bestScore = -1;
  for (const c of candidates) {
    let score = 0;
    if (preferBrand && c.brand_name === preferBrand) score += 2;
    const n = norm(c.name);
    for (const kw of preferKeywords) if (n.includes(kw)) score += 1;
    score += Math.min(1, Number(c.confidence || 0)); // tiny bump if we ever store it
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

function addRel(acc, { from, to, type, reason, meta }) {
  if (!from || !to || from === to) return;
  acc.push({
    part_id: from,
    related_part_id: to,
    relation_type: type,
    reason,
    metadata: meta || {},
  });
}

async function main() {
  const { data: variants, error: vErr } = await supabase
    .from('car_variants')
    .select('id,variant_key,car_id')
    .in('variant_key', PILOT_VARIANT_KEYS);
  if (vErr) throw vErr;

  const variantIds = (variants || []).map(v => v.id);
  if (variantIds.length === 0) {
    console.log('No pilot variants found; exiting.');
    return;
  }

  const { data: fitments, error: fErr } = await supabase
    .from('part_fitments')
    .select('car_variant_id, parts(id,name,brand_name,part_number,category,attributes)')
    .in('car_variant_id', variantIds)
    .limit(2000);
  if (fErr) throw fErr;

  const byVariant = new Map();
  for (const row of fitments || []) {
    const vId = row.car_variant_id;
    const p = row.parts;
    if (!vId || !p?.id) continue;
    if (!byVariant.has(vId)) byVariant.set(vId, []);
    byVariant.get(vId).push(p);
  }

  const relations = [];

  for (const v of variants || []) {
    const parts = byVariant.get(v.id) || [];
    if (parts.length === 0) continue;

    const tune = parts.filter(isTunePart);
    const cooling = parts.filter(p => p.category === 'cooling');
    const fuel = parts.filter(p => p.category === 'fuel_system');
    const forced = parts.filter(p => p.category === 'forced_induction');
    const exhaust = parts.filter(p => p.category === 'exhaust');

    // 1) Forced induction: recommend tune + cooling + fuel (if available)
    for (const turbo of forced) {
      const bestTune = pickBest(tune, { preferBrand: turbo.brand_name, preferKeywords: ['flash', 'tune'] });
      const bestCooling = pickBest(cooling, { preferBrand: turbo.brand_name, preferKeywords: ['intercooler', 'heat exchanger'] });
      const bestFuel = pickBest(fuel, { preferBrand: turbo.brand_name, preferKeywords: ['fuel', 'ethanol', 'hpfp', 'injector'] });

      if (bestTune) {
        addRel(relations, {
          from: turbo.id,
          to: bestTune.id,
          type: 'recommended_with',
          reason: 'Forced induction often requires tuning/supporting calibration.',
          meta: { rule: 'forced_induction_recommended_with_tune', variant_key: v.variant_key },
        });
        addRel(relations, {
          from: bestTune.id,
          to: turbo.id,
          type: 'recommended_with',
          reason: 'Tuning is commonly paired with forced induction upgrades.',
          meta: { rule: 'forced_induction_recommended_with_tune_reverse', variant_key: v.variant_key },
        });
      }

      if (bestCooling) {
        addRel(relations, {
          from: turbo.id,
          to: bestCooling.id,
          type: 'recommended_with',
          reason: 'Forced induction increases heat load; cooling upgrades are commonly recommended.',
          meta: { rule: 'forced_induction_recommended_with_cooling', variant_key: v.variant_key },
        });
      }

      if (bestFuel) {
        addRel(relations, {
          from: turbo.id,
          to: bestFuel.id,
          type: 'recommended_with',
          reason: 'Higher airflow/power can require fueling upgrades depending on goals.',
          meta: { rule: 'forced_induction_recommended_with_fuel', variant_key: v.variant_key },
        });
      }
    }

    // 2) Downpipes: require tune (best-effort)
    for (const p of exhaust) {
      if (!isDownpipe(p)) continue;
      const bestTune = pickBest(tune, { preferBrand: p.brand_name, preferKeywords: ['flash', 'tune'] });
      if (!bestTune) continue;
      addRel(relations, {
        from: p.id,
        to: bestTune.id,
        type: 'requires',
        reason: 'Downpipes commonly require a tune (CEL/boost/fueling) depending on platform.',
        meta: { rule: 'downpipe_requires_tune', variant_key: v.variant_key },
      });
    }

    // 3) Tune conflicts: you generally should not run two ECU flashes at once.
    // Limit to "strong" tune products to avoid marking cables/harnesses as conflicting.
    const tuneStrong = tune.filter(p => {
      const n = norm(p.name);
      return n.includes('tune') || n.includes('flash') || n.includes('powerlink') || n.includes('stage');
    });
    for (let i = 0; i < tuneStrong.length; i++) {
      for (let j = i + 1; j < tuneStrong.length; j++) {
        addRel(relations, {
          from: tuneStrong[i].id,
          to: tuneStrong[j].id,
          type: 'conflicts_with',
          reason: 'ECU/TCU tunes typically conflict; choose one tuning solution at a time.',
          meta: { rule: 'tune_conflicts_with_tune', variant_key: v.variant_key },
        });
        addRel(relations, {
          from: tuneStrong[j].id,
          to: tuneStrong[i].id,
          type: 'conflicts_with',
          reason: 'ECU/TCU tunes typically conflict; choose one tuning solution at a time.',
          meta: { rule: 'tune_conflicts_with_tune', variant_key: v.variant_key },
        });
      }
    }
  }

  if (relations.length === 0) {
    console.log('No relationships generated.');
    return;
  }

  // De-dupe within this run to avoid "cannot affect row a second time" during upsert.
  const dedup = new Map();
  for (const r of relations) {
    const key = `${r.part_id}::${r.related_part_id}::${r.relation_type}`;
    if (!dedup.has(key)) {
      dedup.set(key, r);
    }
  }
  const uniqueRelations = [...dedup.values()];

  // Upsert in chunks
  const chunkSize = 500;
  console.log(`Upserting ${uniqueRelations.length} relationships...`);
  for (let i = 0; i < uniqueRelations.length; i += chunkSize) {
    const batch = uniqueRelations.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('part_relationships')
      .upsert(batch, { onConflict: 'part_id,related_part_id,relation_type' });
    if (error) throw error;
    console.log(`- ${Math.min(i + chunkSize, uniqueRelations.length)}/${uniqueRelations.length}`);
  }

  console.log('✅ Done.');
}

main().catch((err) => {
  console.error('❌ Failed:', err?.message || err);
  process.exit(1);
});






