#!/usr/bin/env node
/**
 * Engine Family Mapper
 * 
 * Maps cars to their engine families for the physics + calibration performance model.
 * Uses the existing car_tuning_profiles.engine_family TEXT field to match to 
 * the normalized engine_families table.
 * 
 * Usage:
 *   node scripts/map-engine-families.mjs
 *   node scripts/map-engine-families.mjs --dry-run
 *   node scripts/map-engine-families.mjs --car=volkswagen-gti-mk7
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ============================================================================
// ENGINE FAMILY MATCHING RULES
// ============================================================================

/**
 * Mapping rules from tuning profile engine_family text to engine_families.family_code
 * Order matters - more specific matches should come first
 */
const ENGINE_FAMILY_MAPPINGS = [
  // VAG EA888 variants
  { pattern: /EA888.*Gen\s*3|2\.0.*TSI.*MQB|2\.0T.*EA888/i, familyCode: 'EA888_Gen3' },
  { pattern: /EA888.*Gen\s*1|2\.0.*TSI.*PQ35|2\.0T.*CCTA/i, familyCode: 'EA888_Gen1' },
  { pattern: /EA888|2\.0.*TSI|2\.0T.*turbo.*I4/i, familyCode: 'EA888_Gen3' }, // Default to Gen3
  
  // VAG 2.5T 5-cylinder
  { pattern: /EA855|2\.5.*TFSI|RS3|TTRS|2\.5T.*5.?cyl/i, familyCode: 'EA855_RS3' },
  
  // BMW Turbo I6
  { pattern: /B58|3\.0.*B58/i, familyCode: 'B58' },
  { pattern: /N55|3\.0.*N55/i, familyCode: 'N55' },
  { pattern: /N54|3\.0.*N54|twin.*turbo.*N54/i, familyCode: 'N54' },
  { pattern: /S55|3\.0.*S55|M3.*F80|M4.*F82/i, familyCode: 'S55' },
  { pattern: /S58|3\.0.*S58|M3.*G80|M4.*G82/i, familyCode: 'S58' },
  
  // Ford Coyote/Voodoo
  { pattern: /Voodoo|5\.2.*flat.*plane|GT350/i, familyCode: 'Voodoo' },
  { pattern: /Predator|5\.2.*SC|GT500.*2020/i, familyCode: 'Predator' },
  { pattern: /Coyote.*Gen\s*3|5\.0.*2018|5\.0.*Gen\s*3/i, familyCode: 'Coyote_Gen3' },
  { pattern: /Coyote.*Gen\s*2|5\.0.*2015|5\.0.*Gen\s*2/i, familyCode: 'Coyote_Gen2' },
  { pattern: /Coyote.*Gen\s*1|5\.0.*2011|5\.0.*Gen\s*1/i, familyCode: 'Coyote_Gen1' },
  { pattern: /Coyote|5\.0L.*V8.*(?!SC)/i, familyCode: 'Coyote_Gen3' }, // Default to Gen3
  
  // GM LS/LT
  { pattern: /LT4|6\.2.*SC.*LT|ZL1|CTS-?V.*Gen\s*3/i, familyCode: 'LT4' },
  { pattern: /LT2|6\.2.*LT2|C8.*Stingray/i, familyCode: 'LT2' },
  { pattern: /LT1.*Gen\s*5|6\.2.*LT1|C7|Camaro.*SS.*6th/i, familyCode: 'LT1_Gen5' },
  { pattern: /LS3|6\.2.*LS3/i, familyCode: 'LS3' },
  
  // Chrysler Hemi
  { pattern: /Hellcat|6\.2.*SC.*Hemi|Redeye|Demon/i, familyCode: 'Hellcat' },
  { pattern: /392.*Hemi|6\.4.*Hemi|SRT.*392|Scat.*Pack/i, familyCode: 'Hemi_392' },
  
  // Subaru Boxer
  { pattern: /EJ257|2\.5.*Turbo.*Boxer|STI/i, familyCode: 'EJ257' },
  { pattern: /FA20.*DIT|FA20.*Turbo|WRX.*2015/i, familyCode: 'FA20_DIT' },
  
  // Honda/Acura
  { pattern: /K20C1|2\.0.*Turbo.*K20|Civic.*Type.*R/i, familyCode: 'K20C1' },
  { pattern: /K20A|2\.0.*VTEC.*K20|RSX.*Type.*S|Integra.*Type.*R/i, familyCode: 'K20A' },
  { pattern: /F20C|2\.[02].*VTEC.*F20|S2000/i, familyCode: 'F20C' },
  
  // Nissan
  { pattern: /VR38|3\.8.*TT|GT-?R.*R35/i, familyCode: 'VR38DETT' },
  { pattern: /VQ37|3\.7.*VQ|370Z|G37/i, familyCode: 'VQ37VHR' },
  
  // Mercedes-AMG
  { pattern: /M177|4\.0.*TT.*V8.*AMG|AMG.*GT|C63.*W205|E63/i, familyCode: 'M177' },
  { pattern: /M133|2\.0.*Turbo.*AMG|A45|CLA.*45/i, familyCode: 'M133' },
  
  // Porsche
  { pattern: /9A2.*Turbo|911.*Turbo.*3\.[08]/i, familyCode: '9A2_Turbo' },
  { pattern: /9A1.*GT3|GT3.*4\.0|Mezger/i, familyCode: '9A1_GT3' },
  { pattern: /MA1|718.*2\.[05].*Turbo/i, familyCode: 'MA1' },
];

// ============================================================================
// MAIN LOGIC
// ============================================================================

async function loadEngineFamilies() {
  const { data, error } = await supabase
    .from('engine_families')
    .select('*');
  
  if (error) {
    console.error('Failed to load engine families:', error.message);
    return new Map();
  }
  
  return new Map(data.map(ef => [ef.family_code, ef]));
}

async function loadCarsWithTuningProfiles() {
  const { data, error } = await supabase
    .from('cars')
    .select(`
      id,
      slug,
      name,
      engine,
      hp,
      engine_family_id,
      car_tuning_profiles (
        engine_family,
        tuning_focus
      )
    `)
    .order('name');
  
  if (error) {
    console.error('Failed to load cars:', error.message);
    return [];
  }
  
  return data;
}

function matchEngineFamily(car, engineFamilies) {
  const tuningProfile = car.car_tuning_profiles?.[0];
  const tuningEngineFamily = tuningProfile?.engine_family || '';
  const carEngine = car.engine || '';
  
  // Combine tuning profile and car engine for matching
  const searchText = `${tuningEngineFamily} ${carEngine}`;
  
  for (const mapping of ENGINE_FAMILY_MAPPINGS) {
    if (mapping.pattern.test(searchText)) {
      const engineFamily = engineFamilies.get(mapping.familyCode);
      if (engineFamily) {
        return {
          familyId: engineFamily.id,
          familyCode: mapping.familyCode,
          familyName: engineFamily.display_name,
          matchedOn: mapping.pattern.toString(),
          confidence: tuningEngineFamily ? 0.9 : 0.7, // Higher if we have tuning profile data
        };
      }
    }
  }
  
  return null;
}

async function updateCarEngineFamily(carId, engineFamilyId, dryRun = false) {
  if (dryRun) {
    return { success: true, dryRun: true };
  }
  
  const { error } = await supabase
    .from('cars')
    .update({ engine_family_id: engineFamilyId })
    .eq('id', carId);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const specificCar = args.find(a => a.startsWith('--car='))?.split('=')[1];
  
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║               ENGINE FAMILY MAPPER                                ║
║                                                                    ║
║  Maps cars to engine families for performance calibration         ║
╚══════════════════════════════════════════════════════════════════╝
`);

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Load engine families
  console.log('Loading engine families...');
  const engineFamilies = await loadEngineFamilies();
  console.log(`Found ${engineFamilies.size} engine families\n`);
  
  if (engineFamilies.size === 0) {
    console.error('❌ No engine families found. Run migration 099 first.');
    process.exit(1);
  }

  // Load cars
  console.log('Loading cars with tuning profiles...');
  let cars = await loadCarsWithTuningProfiles();
  
  if (specificCar) {
    cars = cars.filter(c => c.slug === specificCar);
    if (cars.length === 0) {
      console.error(`❌ Car not found: ${specificCar}`);
      process.exit(1);
    }
  }
  
  console.log(`Found ${cars.length} cars to process\n`);

  // Process cars
  const results = {
    matched: [],
    alreadyMapped: [],
    noMatch: [],
    errors: [],
  };

  console.log('Processing cars...\n');
  console.log('─'.repeat(100));
  console.log(
    'Car'.padEnd(35),
    'Tuning Engine Family'.padEnd(30),
    'Matched To'.padEnd(25),
    'Status'
  );
  console.log('─'.repeat(100));

  for (const car of cars) {
    const tuningProfile = car.car_tuning_profiles?.[0];
    const tuningEngineFamily = tuningProfile?.engine_family || '(none)';
    
    // Skip if already mapped
    if (car.engine_family_id) {
      const existing = [...engineFamilies.values()].find(ef => ef.id === car.engine_family_id);
      console.log(
        car.name.substring(0, 33).padEnd(35),
        tuningEngineFamily.substring(0, 28).padEnd(30),
        (existing?.display_name || 'Unknown').substring(0, 23).padEnd(25),
        '✓ Already mapped'
      );
      results.alreadyMapped.push(car);
      continue;
    }
    
    // Try to match
    const match = matchEngineFamily(car, engineFamilies);
    
    if (match) {
      // Update the car
      const updateResult = await updateCarEngineFamily(car.id, match.familyId, dryRun);
      
      if (updateResult.success) {
        console.log(
          car.name.substring(0, 33).padEnd(35),
          tuningEngineFamily.substring(0, 28).padEnd(30),
          match.familyName.substring(0, 23).padEnd(25),
          dryRun ? '→ Would map' : '✓ Mapped'
        );
        results.matched.push({ car, match });
      } else {
        console.log(
          car.name.substring(0, 33).padEnd(35),
          tuningEngineFamily.substring(0, 28).padEnd(30),
          match.familyName.substring(0, 23).padEnd(25),
          `❌ Error: ${updateResult.error}`
        );
        results.errors.push({ car, error: updateResult.error });
      }
    } else {
      console.log(
        car.name.substring(0, 33).padEnd(35),
        tuningEngineFamily.substring(0, 28).padEnd(30),
        ''.padEnd(25),
        '⚠ No match'
      );
      results.noMatch.push(car);
    }
  }

  console.log('─'.repeat(100));

  // Summary
  console.log(`
SUMMARY
═══════════════════════════════════════════════════════════════════
Total cars:          ${cars.length}
Already mapped:      ${results.alreadyMapped.length}
Newly matched:       ${results.matched.length}
No match found:      ${results.noMatch.length}
Errors:              ${results.errors.length}
═══════════════════════════════════════════════════════════════════
`);

  if (results.noMatch.length > 0) {
    console.log('CARS WITHOUT ENGINE FAMILY MATCH:');
    console.log('─'.repeat(60));
    for (const car of results.noMatch) {
      const tp = car.car_tuning_profiles?.[0];
      console.log(`  ${car.name}`);
      console.log(`    Engine: ${car.engine || 'N/A'}`);
      console.log(`    Tuning Profile: ${tp?.engine_family || 'N/A'}`);
      console.log('');
    }
  }

  if (dryRun) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }
}

main().catch(console.error);
