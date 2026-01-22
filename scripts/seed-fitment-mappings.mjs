#!/usr/bin/env node
/**
 * Seed Fitment Tag Mappings
 *
 * Generates and seeds fitment_tag_mappings for all cars in the database.
 * Creates common tag patterns that vendors typically use.
 *
 * Usage:
 *   node scripts/seed-fitment-mappings.mjs [--dry-run] [--vendor <key>]
 *
 * @module scripts/seed-fitment-mappings
 */

import 'dotenv/config';
import { supabaseServiceRole, isSupabaseConfigured } from '../lib/supabase.js';

// ============================================================================
// TAG GENERATION PATTERNS
// ============================================================================

/**
 * Generate common vendor tags for a car
 * @param {Object} car - Car from database
 * @returns {Array<{ tag: string, confidence: number }>}
 */
function generateTagsForCar(car) {
  const tags = [];
  const { slug, name } = car;
  const lowerName = name.toLowerCase();
  const lowerSlug = slug.toLowerCase();

  // Extract year info
  const yearMatch = name.match(/(\d{4})[-–]?(\d{4})?/);
  const startYear = yearMatch ? yearMatch[1] : null;
  const endYear = yearMatch ? yearMatch[2] || yearMatch[1] : null;

  // BMW patterns
  if (lowerSlug.includes('bmw') || lowerName.includes('bmw')) {
    const chassisMatch = slug.match(/([efg]\d{2})/i);
    if (chassisMatch) {
      const chassis = chassisMatch[1].toUpperCase();
      tags.push({ tag: chassis, confidence: 0.85 });
      tags.push({ tag: `${chassis} M3`, confidence: 0.85 });
      tags.push({ tag: `${chassis} M4`, confidence: 0.85 });
      tags.push({ tag: `BMW ${chassis}`, confidence: 0.85 });
    }
    if (lowerSlug.includes('m3')) {
      tags.push({ tag: 'M3', confidence: 0.70 });
      tags.push({ tag: 'BMW M3', confidence: 0.80 });
    }
    if (lowerSlug.includes('m4')) {
      tags.push({ tag: 'M4', confidence: 0.70 });
      tags.push({ tag: 'BMW M4', confidence: 0.80 });
    }
    if (lowerSlug.includes('m5')) {
      tags.push({ tag: 'M5', confidence: 0.70 });
      tags.push({ tag: 'BMW M5', confidence: 0.80 });
    }
    if (lowerSlug.includes('m2')) {
      tags.push({ tag: 'M2', confidence: 0.70 });
      tags.push({ tag: 'M2 Competition', confidence: 0.80 });
    }
  }

  // Audi patterns
  if (lowerSlug.includes('audi')) {
    const chassisMatch = slug.match(/(8[vys]|b[89])/i);
    if (chassisMatch) {
      const chassis = chassisMatch[1].toUpperCase();
      tags.push({ tag: chassis, confidence: 0.85 });
      tags.push({ tag: `Audi ${chassis}`, confidence: 0.85 });
    }
    if (lowerSlug.includes('rs3')) {
      tags.push({ tag: 'RS3', confidence: 0.75 });
      tags.push({ tag: 'Audi RS3', confidence: 0.80 });
    }
    if (lowerSlug.includes('rs5')) {
      tags.push({ tag: 'RS5', confidence: 0.75 });
      tags.push({ tag: 'Audi RS5', confidence: 0.80 });
    }
    if (lowerSlug.includes('tt-rs')) {
      tags.push({ tag: 'TTRS', confidence: 0.80 });
      tags.push({ tag: 'TT RS', confidence: 0.80 });
    }
    if (lowerSlug.includes('r8')) {
      tags.push({ tag: 'R8', confidence: 0.75 });
      tags.push({ tag: 'Audi R8', confidence: 0.80 });
    }
  }

  // Volkswagen patterns
  if (lowerSlug.includes('volkswagen') || lowerSlug.includes('gti') || lowerSlug.includes('golf-r')) {
    const mkMatch = slug.match(/mk(\d)/i);
    if (mkMatch) {
      const mk = mkMatch[1];
      tags.push({ tag: `MK${mk}`, confidence: 0.85 });
      tags.push({ tag: `Mk${mk}`, confidence: 0.85 });
    }
    if (lowerSlug.includes('gti')) {
      tags.push({ tag: 'GTI', confidence: 0.70 });
      tags.push({ tag: 'VW GTI', confidence: 0.80 });
      tags.push({ tag: 'Golf GTI', confidence: 0.80 });
    }
    if (lowerSlug.includes('golf-r')) {
      tags.push({ tag: 'Golf R', confidence: 0.80 });
      tags.push({ tag: 'VW Golf R', confidence: 0.80 });
    }
  }

  // Porsche patterns
  if (lowerSlug.includes('porsche')) {
    const genMatch = slug.match(/(991|997|996|718|981|987)/);
    if (genMatch) {
      tags.push({ tag: genMatch[1], confidence: 0.85 });
      tags.push({ tag: `Porsche ${genMatch[1]}`, confidence: 0.85 });
    }
    if (lowerSlug.includes('911')) {
      tags.push({ tag: '911', confidence: 0.75 });
      tags.push({ tag: 'Porsche 911', confidence: 0.80 });
    }
    if (lowerSlug.includes('cayman')) {
      tags.push({ tag: 'Cayman', confidence: 0.80 });
      tags.push({ tag: 'Porsche Cayman', confidence: 0.80 });
    }
    if (lowerSlug.includes('boxster')) {
      tags.push({ tag: 'Boxster', confidence: 0.80 });
    }
    if (lowerSlug.includes('gt3')) {
      tags.push({ tag: 'GT3', confidence: 0.80 });
      tags.push({ tag: '911 GT3', confidence: 0.80 });
    }
    if (lowerSlug.includes('gt4')) {
      tags.push({ tag: 'GT4', confidence: 0.80 });
      tags.push({ tag: 'Cayman GT4', confidence: 0.80 });
    }
  }

  // Subaru patterns
  if (lowerSlug.includes('subaru') || lowerSlug.includes('wrx') || lowerSlug.includes('sti') || lowerSlug.includes('brz')) {
    const genMatch = slug.match(/(va|gr|gv|gd|gc)/i);
    if (genMatch) {
      tags.push({ tag: genMatch[1].toUpperCase(), confidence: 0.85 });
    }
    if (lowerSlug.includes('sti')) {
      tags.push({ tag: 'STI', confidence: 0.75 });
      tags.push({ tag: 'WRX STI', confidence: 0.80 });
      tags.push({ tag: 'Subaru STI', confidence: 0.80 });
    }
    if (lowerSlug.includes('wrx') && !lowerSlug.includes('sti')) {
      tags.push({ tag: 'WRX', confidence: 0.75 });
      tags.push({ tag: 'Subaru WRX', confidence: 0.80 });
    }
    if (lowerSlug.includes('brz')) {
      tags.push({ tag: 'BRZ', confidence: 0.80 });
      tags.push({ tag: 'Subaru BRZ', confidence: 0.80 });
    }
  }

  // Toyota patterns
  if (lowerSlug.includes('toyota') || lowerSlug.includes('supra') || lowerSlug.includes('gr86')) {
    if (lowerSlug.includes('supra') || lowerSlug.includes('gr-supra')) {
      if (lowerSlug.includes('mk4') || lowerSlug.includes('a80')) {
        tags.push({ tag: 'MK4 Supra', confidence: 0.85 });
        tags.push({ tag: 'A80', confidence: 0.85 });
        tags.push({ tag: 'A80 Supra', confidence: 0.85 });
        tags.push({ tag: '2JZ', confidence: 0.75 });
      } else {
        tags.push({ tag: 'GR Supra', confidence: 0.85 });
        tags.push({ tag: 'A90', confidence: 0.85 });
        tags.push({ tag: 'A90 Supra', confidence: 0.85 });
        tags.push({ tag: 'MK5 Supra', confidence: 0.85 });
        tags.push({ tag: 'B58', confidence: 0.70 });
      }
    }
    if (lowerSlug.includes('gr86') || lowerSlug.includes('86')) {
      tags.push({ tag: 'GR86', confidence: 0.85 });
      tags.push({ tag: 'Toyota GR86', confidence: 0.85 });
      tags.push({ tag: '86', confidence: 0.70 });
      tags.push({ tag: 'FA24', confidence: 0.70 });
    }
    if (lowerSlug.includes('gr-corolla')) {
      tags.push({ tag: 'GR Corolla', confidence: 0.85 });
    }
  }

  // Honda/Acura patterns
  if (lowerSlug.includes('honda') || lowerSlug.includes('acura') || lowerSlug.includes('civic') || lowerSlug.includes('integra')) {
    if (lowerSlug.includes('type-r') || lowerSlug.includes('civic-type')) {
      const genMatch = slug.match(/(fk8|fl5)/i);
      if (genMatch) {
        tags.push({ tag: genMatch[1].toUpperCase(), confidence: 0.85 });
      }
      tags.push({ tag: 'Type R', confidence: 0.75 });
      tags.push({ tag: 'Civic Type R', confidence: 0.80 });
      tags.push({ tag: 'CTR', confidence: 0.75 });
    }
    if (lowerSlug.includes('s2000')) {
      tags.push({ tag: 'S2000', confidence: 0.85 });
      tags.push({ tag: 'AP1', confidence: 0.80 });
      tags.push({ tag: 'AP2', confidence: 0.80 });
    }
    if (lowerSlug.includes('integra')) {
      const genMatch = slug.match(/(dc2|dc5)/i);
      if (genMatch) {
        tags.push({ tag: genMatch[1].toUpperCase(), confidence: 0.85 });
      }
      tags.push({ tag: 'Integra', confidence: 0.70 });
    }
    if (lowerSlug.includes('rsx')) {
      tags.push({ tag: 'RSX', confidence: 0.80 });
      tags.push({ tag: 'RSX Type-S', confidence: 0.80 });
      tags.push({ tag: 'DC5', confidence: 0.80 });
    }
    if (lowerSlug.includes('civic-si')) {
      tags.push({ tag: 'Civic Si', confidence: 0.80 });
    }
  }

  // Nissan patterns
  if (lowerSlug.includes('nissan') || lowerSlug.includes('gt-r') || lowerSlug.includes('370z') || lowerSlug.includes('350z')) {
    if (lowerSlug.includes('gt-r')) {
      tags.push({ tag: 'GT-R', confidence: 0.85 });
      tags.push({ tag: 'GTR', confidence: 0.80 });
      tags.push({ tag: 'R35', confidence: 0.85 });
      tags.push({ tag: 'Nissan GT-R', confidence: 0.85 });
      tags.push({ tag: 'VR38', confidence: 0.75 });
    }
    if (lowerSlug.includes('370z')) {
      tags.push({ tag: '370Z', confidence: 0.85 });
      tags.push({ tag: 'Z34', confidence: 0.85 });
      tags.push({ tag: 'VQ37', confidence: 0.75 });
    }
    if (lowerSlug.includes('350z')) {
      tags.push({ tag: '350Z', confidence: 0.85 });
      tags.push({ tag: 'Z33', confidence: 0.85 });
      tags.push({ tag: 'VQ35', confidence: 0.75 });
    }
  }

  // Ford/Mustang patterns
  if (lowerSlug.includes('ford') || lowerSlug.includes('mustang') || lowerSlug.includes('focus') || lowerSlug.includes('shelby')) {
    if (lowerSlug.includes('gt350')) {
      tags.push({ tag: 'GT350', confidence: 0.85 });
      tags.push({ tag: 'Shelby GT350', confidence: 0.85 });
    }
    if (lowerSlug.includes('gt500')) {
      tags.push({ tag: 'GT500', confidence: 0.85 });
      tags.push({ tag: 'Shelby GT500', confidence: 0.85 });
    }
    if (lowerSlug.includes('mustang')) {
      const genMatch = slug.match(/(s550|s197)/i);
      if (genMatch) {
        tags.push({ tag: genMatch[1].toUpperCase(), confidence: 0.85 });
      }
      tags.push({ tag: 'Mustang', confidence: 0.70 });
      tags.push({ tag: 'Mustang GT', confidence: 0.75 });
      if (lowerSlug.includes('coyote') || lowerName.includes('coyote')) {
        tags.push({ tag: 'Coyote', confidence: 0.75 });
      }
    }
    if (lowerSlug.includes('focus-rs')) {
      tags.push({ tag: 'Focus RS', confidence: 0.85 });
      tags.push({ tag: 'Ford Focus RS', confidence: 0.85 });
    }
    if (lowerSlug.includes('focus-st')) {
      tags.push({ tag: 'Focus ST', confidence: 0.85 });
    }
  }

  // Chevy/Corvette/Camaro patterns
  if (lowerSlug.includes('chevrolet') || lowerSlug.includes('corvette') || lowerSlug.includes('camaro')) {
    if (lowerSlug.includes('corvette')) {
      const genMatch = slug.match(/(c[5678])/i);
      if (genMatch) {
        tags.push({ tag: genMatch[1].toUpperCase(), confidence: 0.85 });
        tags.push({ tag: `${genMatch[1].toUpperCase()} Corvette`, confidence: 0.85 });
      }
      if (lowerSlug.includes('z06')) {
        tags.push({ tag: 'Z06', confidence: 0.85 });
        tags.push({ tag: 'Corvette Z06', confidence: 0.85 });
      }
    }
    if (lowerSlug.includes('camaro')) {
      if (lowerSlug.includes('zl1')) {
        tags.push({ tag: 'ZL1', confidence: 0.85 });
        tags.push({ tag: 'Camaro ZL1', confidence: 0.85 });
      }
      if (lowerSlug.includes('ss') || lowerSlug.includes('1le')) {
        tags.push({ tag: 'Camaro SS', confidence: 0.80 });
        tags.push({ tag: '1LE', confidence: 0.80 });
      }
    }
  }

  // Dodge patterns
  if (lowerSlug.includes('dodge') || lowerSlug.includes('challenger') || lowerSlug.includes('charger')) {
    if (lowerSlug.includes('hellcat')) {
      tags.push({ tag: 'Hellcat', confidence: 0.85 });
    }
    if (lowerSlug.includes('challenger')) {
      tags.push({ tag: 'Challenger', confidence: 0.75 });
      if (lowerSlug.includes('392') || lowerSlug.includes('srt')) {
        tags.push({ tag: 'Challenger SRT', confidence: 0.80 });
        tags.push({ tag: 'Challenger 392', confidence: 0.80 });
      }
    }
    if (lowerSlug.includes('charger')) {
      tags.push({ tag: 'Charger', confidence: 0.75 });
    }
  }

  // Mitsubishi Evo patterns
  if (lowerSlug.includes('mitsubishi') || lowerSlug.includes('evo') || lowerSlug.includes('lancer')) {
    if (lowerSlug.includes('evo-x') || lowerSlug.includes('evo-10')) {
      tags.push({ tag: 'Evo X', confidence: 0.85 });
      tags.push({ tag: 'Evo 10', confidence: 0.85 });
      tags.push({ tag: 'CZ4A', confidence: 0.85 });
      tags.push({ tag: '4B11', confidence: 0.75 });
    }
    if (lowerSlug.includes('evo-8') || lowerSlug.includes('evo-9') || lowerSlug.includes('evo-viii') || lowerSlug.includes('evo-ix')) {
      tags.push({ tag: 'Evo 8', confidence: 0.85 });
      tags.push({ tag: 'Evo 9', confidence: 0.85 });
      tags.push({ tag: 'CT9A', confidence: 0.85 });
    }
  }

  // Mazda patterns
  if (lowerSlug.includes('mazda') || lowerSlug.includes('miata') || lowerSlug.includes('mx5') || lowerSlug.includes('rx7')) {
    if (lowerSlug.includes('miata') || lowerSlug.includes('mx-5') || lowerSlug.includes('mx5')) {
      const genMatch = slug.match(/(na|nb|nc|nd)/i);
      if (genMatch) {
        tags.push({ tag: genMatch[1].toUpperCase(), confidence: 0.85 });
        tags.push({ tag: `${genMatch[1].toUpperCase()} Miata`, confidence: 0.85 });
      }
      tags.push({ tag: 'Miata', confidence: 0.70 });
      tags.push({ tag: 'MX-5', confidence: 0.75 });
    }
    if (lowerSlug.includes('rx7') || lowerSlug.includes('rx-7')) {
      tags.push({ tag: 'RX-7', confidence: 0.85 });
      tags.push({ tag: 'FD', confidence: 0.80 });
      tags.push({ tag: 'FD3S', confidence: 0.85 });
    }
  }

  // Add year-based tags
  if (startYear && endYear) {
    tags.push({ tag: `${startYear}-${endYear}`, confidence: 0.75 });
    tags.push({ tag: `${startYear}+`, confidence: 0.70 });
  } else if (startYear) {
    tags.push({ tag: startYear, confidence: 0.70 });
  }

  // Deduplicate
  const seen = new Set();
  return tags.filter((t) => {
    const key = t.tag.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const vendorIdx = args.indexOf('--vendor');
  const vendorKey = vendorIdx !== -1 ? args[vendorIdx + 1] : 'universal';

  if (!isSupabaseConfigured) {
    console.error('Supabase not configured');
    process.exit(1);
  }

  console.log(`[Seed Mappings] Starting (dry-run: ${dryRun})`);
  console.log(`[Seed Mappings] Vendor key: ${vendorKey}`);

  // Fetch all cars
  const { data: cars, error: carErr } = await supabaseServiceRole
    .from('cars')
    .select('id, slug, name')
    .order('name');

  if (carErr) {
    console.error('Failed to fetch cars:', carErr.message);
    process.exit(1);
  }

  console.log(`[Seed Mappings] Found ${cars.length} cars`);

  let totalMappings = 0;
  let insertedMappings = 0;

  for (const car of cars) {
    const tags = generateTagsForCar(car);

    if (dryRun && tags.length > 0) {
      console.log(`\n${car.name} (${car.slug}):`);
      for (const t of tags.slice(0, 5)) {
        console.log(`  - "${t.tag}" (${t.confidence})`);
      }
      if (tags.length > 5) {
        console.log(`  ... and ${tags.length - 5} more`);
      }
    }

    totalMappings += tags.length;

    if (!dryRun && tags.length > 0) {
      // Upsert mappings
      const mappings = tags.map((t) => ({
        vendor_key: vendorKey,
        vendor_tag: t.tag,
        car_slug: car.slug,
        confidence: t.confidence,
        verified: false,
        metadata: {
          seeded_at: new Date().toISOString(),
          car_name: car.name,
        },
      }));

      const { error: insertErr } = await supabaseServiceRole
        .from('fitment_tag_mappings')
        .upsert(mappings, { onConflict: 'vendor_key,vendor_tag' });

      if (insertErr) {
        console.warn(`Failed to insert mappings for ${car.slug}: ${insertErr.message}`);
      } else {
        insertedMappings += tags.length;
      }
    }
  }

  console.log('\n========================================');
  console.log('Seeding Complete');
  console.log('========================================');
  console.log(`Total Cars: ${cars.length}`);
  console.log(`Total Mappings Generated: ${totalMappings}`);
  if (!dryRun) {
    console.log(`Mappings Inserted: ${insertedMappings}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
