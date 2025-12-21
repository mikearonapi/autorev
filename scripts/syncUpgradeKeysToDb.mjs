/**
 * Sync Upgrade Keys (conceptual upgrades) into Supabase `upgrade_keys`.
 *
 * Why:
 * - Lets AI-AL reference a canonical upgrade catalog in the DB.
 * - Enables connecting upgrades -> concrete parts via `upgrade_key_parts`.
 *
 * Usage:
 *   OPENAI_API_KEY is NOT required.
 *   Ensure these env vars exist in .env.local:
 *     NEXT_PUBLIC_SUPABASE_URL
 *     SUPABASE_SERVICE_ROLE_KEY
 *
 * Run:
 *   node scripts/syncUpgradeKeysToDb.mjs
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

const { upgradeModules, genericPackages } = await import('../data/upgradePackages.js');

function mapUpgradeCategory({ key, category }) {
  const k = String(key || '').toLowerCase();
  const c = String(category || '').toLowerCase();

  if (k.includes('exhaust') || k.includes('catback') || k.includes('headers')) return 'exhaust_sound';
  if (k.includes('tune') || k.includes('piggyback')) return 'electronics_tuning';
  if (k.includes('coilover') || k.includes('spring') || k.includes('sway') || c === 'chassis') return 'suspension_handling';
  if (k.includes('brake') || c === 'brakes') return 'brakes';
  if (k.includes('wheel') || k.includes('tire') || c === 'wheels') return 'wheels_tires';
  if (k.includes('cooler') || k.includes('radiator') || k.includes('intercooler') || c === 'cooling') return 'cooling';
  if (k.includes('aero') || k.includes('wing') || k.includes('splitter') || c === 'aero') return 'aero';
  if (k.includes('clutch') || k.includes('diff') || c === 'drivetrain') return 'drivetrain';
  if (c === 'power') return 'power_engine';

  return 'other';
}

function toCostLowHigh(module) {
  const low = Number(module?.estimatedCostLow);
  const high = Number(module?.estimatedCostHigh);
  return {
    typical_cost_low: Number.isFinite(low) ? low : null,
    typical_cost_high: Number.isFinite(high) ? high : null,
  };
}

function collectUpgradeKeys() {
  const items = [];

  for (const m of upgradeModules || []) {
    if (!m?.key || !m?.name) continue;
    items.push({
      key: m.key,
      name: m.name,
      category: mapUpgradeCategory({ key: m.key, category: m.category }),
      description: m.description || null,
      ...toCostLowHigh(m),
      metadata: {
        source: 'data/upgradePackages.js',
        type: m.type || null,
        tier: m.tier || null,
        module_category: m.category || null,
        slug: m.slug || null,
      },
    });
  }

  // Ensure any includedUpgradeKeys from packages exist too
  for (const p of genericPackages || []) {
    for (const k of p?.includedUpgradeKeys || []) {
      if (!k) continue;
      if (items.some(i => i.key === k)) continue;
      items.push({
        key: k,
        name: k, // placeholder; can be refined later
        category: mapUpgradeCategory({ key: k, category: null }),
        description: null,
        typical_cost_low: null,
        typical_cost_high: null,
        metadata: { source: 'data/upgradePackages.js', inferred: true },
      });
    }
  }

  // De-dupe by key
  const map = new Map();
  for (const i of items) map.set(i.key, i);
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

async function main() {
  const upgrades = collectUpgradeKeys();
  console.log(`Syncing ${upgrades.length} upgrade keys...`);

  const chunkSize = 250;
  for (let i = 0; i < upgrades.length; i += chunkSize) {
    const batch = upgrades.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('upgrade_keys')
      .upsert(batch, { onConflict: 'key' });
    if (error) throw error;
    console.log(`- Upserted ${Math.min(i + chunkSize, upgrades.length)}/${upgrades.length}`);
  }

  console.log('✅ Done');
}

main().catch((err) => {
  console.error('❌ Failed:', err?.message || err);
  process.exit(1);
});















