#!/usr/bin/env node
/**
 * Recategorize Parts Script
 *
 * Analyzes parts in the "other" category and recategorizes them based on
 * keyword matching in the name and description.
 *
 * Usage:
 *   node scripts/recategorizeParts.mjs [--dry-run] [--limit 1000] [--verbose]
 *
 * Options:
 *   --dry-run      Preview changes without committing to database
 *   --limit <n>    Maximum number of parts to process (default: all)
 *   --verbose      Show detailed matching info
 *
 * @module scripts/recategorizeParts
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { logValidationResults } from '../lib/dataValidation.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// ============================================================================
// CATEGORY KEYWORDS
// ============================================================================

/**
 * Keywords mapped to categories.
 * More specific keywords should have higher priority.
 * Order matters - first match wins for each part.
 */
const CATEGORY_KEYWORDS = {
  intake: {
    priority: 1,
    keywords: [
      'cold air intake', 'cai', 'air filter', 'intake system', 'intake kit',
      'air intake', 'induction', 'intake hose', 'intake pipe', 'airbox',
      'air box', 'k&n', 'aem intake', 'injen', 'short ram', 'velocity stack',
      'throttle body spacer', 'intake elbow',
    ],
    exclude: ['coolant intake', 'water intake'], // Exclude these matches
  },
  exhaust: {
    priority: 2,
    keywords: [
      'exhaust', 'catback', 'cat-back', 'axleback', 'axle-back', 'downpipe',
      'down pipe', 'header', 'headers', 'manifold', 'muffler', 'resonator',
      'mid-pipe', 'midpipe', 'test pipe', 'testpipe', 'y-pipe', 'x-pipe',
      'exhaust tip', 'exhaust clamp', 'exhaust hanger', 'turbo back',
      'turboback', 'silencer', 'heat wrap', 'exhaust wrap',
    ],
    exclude: ['exhaust valve', 'valve cover'], // EGR/valve parts
  },
  suspension: {
    priority: 3,
    keywords: [
      'coilover', 'coil over', 'lowering spring', 'lowering kit', 'spring kit',
      'sway bar', 'anti-roll', 'antiroll', 'stabilizer', 'control arm',
      'camber arm', 'toe arm', 'trailing arm', 'link', 'end link', 'endlink',
      'strut', 'shock', 'damper', 'mount', 'bushing', 'subframe',
      'chassis brace', 'strut tower', 'tie bar', 'traction bar',
      'roll center', 'ball joint', 'bearing', 'alignment', 'spacer',
      'drop link', 'lateral arm', 'dogbone',
    ],
    exclude: ['motor mount', 'engine mount', 'transmission mount'],
  },
  brakes: {
    priority: 4,
    keywords: [
      'brake pad', 'brake pads', 'rotor', 'rotors', 'brake disc', 'caliper',
      'big brake', 'bbk', 'brake kit', 'brake line', 'brake hose',
      'brake fluid', 'master cylinder', 'brake booster', 'brake upgrade',
      'slotted rotor', 'drilled rotor', 'cross drilled', 'stoptech',
      'brembo', 'ebc', 'hawk', 'ap racing', 'wilwood', 'brake bleeder',
      'brake ducting', 'brake duct', 'backing plate',
    ],
    exclude: ['parking brake cable'],
  },
  wheels_tires: {
    priority: 5,
    keywords: [
      'wheel', 'wheels', 'rim', 'rims', 'tire', 'tires', 'tyre', 'tyres',
      'wheel spacer', 'hub centric', 'lug nut', 'lug nuts', 'wheel stud',
      'center cap', 'wheel lock', 'valve stem', 'tpms', 'enkei', 'rpf1',
      'te37', 'bbs', 'oz racing', 'advan', 'michelin', 'pirelli', 'toyo',
      'bridgestone', 'nitto', 'continental', 'hankook', 'federal',
    ],
    exclude: ['steering wheel', 'flywheel'],
  },
  cooling: {
    priority: 6,
    keywords: [
      'radiator', 'intercooler', 'fmic', 'oil cooler', 'trans cooler',
      'transmission cooler', 'charge cooler', 'heat exchanger', 'coolant',
      'thermostat', 'water pump', 'fan', 'cooling fan', 'shroud',
      'silicone hose', 'coolant hose', 'expansion tank', 'overflow tank',
      'catch can', 'oil catch', 'air oil separator', 'aos',
    ],
    exclude: ['oil cooler adapter'], // Usually categorized elsewhere
  },
  tune: {
    priority: 7,
    keywords: [
      'tune', 'flash', 'ecu', 'piggyback', 'jb4', 'cobb', 'accessport',
      'ecutek', 'hp tuners', 'stage 1', 'stage 2', 'stage 3', 'remap',
      'chip', 'tuner', 'programmer', 'data logger', 'obd', 'diag',
      'unitronic', 'apr', 'apr+', 'ie tune', 'eq tune', 'mhd',
    ],
    exclude: [],
  },
  fuel_system: {
    priority: 8,
    keywords: [
      'fuel pump', 'injector', 'injectors', 'fuel rail', 'fuel filter',
      'fuel line', 'hpfp', 'lpfp', 'fuel pressure', 'regulator',
      'flex fuel', 'e85', 'ethanol', 'fuel sender', 'fuel cell',
      'fuel surge', 'bucket', 'dw', 'injector dynamics', 'bosch injector',
    ],
    exclude: [],
  },
  forced_induction: {
    priority: 9,
    keywords: [
      'turbo', 'turbocharger', 'supercharger', 'blower', 'compressor',
      'wastegate', 'blow off', 'bov', 'diverter', 'boost controller',
      'boost gauge', 'boost tap', 'silicone coupler', 'intercooler pipe',
      'charge pipe', 'turbo inlet', 'turbo outlet', 'turbo kit',
      'sc pulley', 'supercharger pulley', 'twin scroll', 'twin turbo',
      'big turbo', 'hybrid turbo', 'garrett', 'borgwarner', 'precision',
      'vortech', 'procharger', 'roush', 'whipple', 'kenne bell',
    ],
    exclude: [],
  },
  drivetrain: {
    priority: 10,
    keywords: [
      'clutch', 'flywheel', 'diff', 'differential', 'lsd', 'limited slip',
      'short shifter', 'shift knob', 'shifter', 'driveshaft', 'axle',
      'cv joint', 'half shaft', 'trans mount', 'transmission mount',
      'motor mount', 'engine mount', 'clutch line', 'throw out bearing',
      'pilot bearing', 'pressure plate', 'slave cylinder',
    ],
    exclude: [],
  },
  aero: {
    priority: 11,
    keywords: [
      'wing', 'spoiler', 'splitter', 'diffuser', 'canard', 'lip',
      'front lip', 'side skirt', 'fender flare', 'widebody', 'ducktail',
      'gurney flap', 'undertray', 'belly pan', 'aero kit', 'body kit',
      'bumper', 'hood', 'carbon fiber hood', 'cf hood', 'vented hood',
    ],
    exclude: ['spoiler delete'], // Delete kits
  },
  interior: {
    priority: 12,
    keywords: [
      'seat', 'harness', 'belt', 'roll bar', 'roll cage', 'cage',
      'steering wheel', 'quick release', 'hub adapter', 'pedal',
      'dead pedal', 'floor mat', 'shift boot', 'e-brake boot',
      'gauge pod', 'cluster', 'trim', 'dash', 'carbon interior',
    ],
    exclude: [],
  },
  lighting: {
    priority: 13,
    keywords: [
      'headlight', 'tail light', 'fog light', 'led', 'hid', 'bulb',
      'light bar', 'drl', 'turn signal', 'marker light', 'third brake',
      'projector', 'retrofit', 'angel eye', 'halo', 'smoked',
    ],
    exclude: ['check engine light'], // Not parts
  },
  electronics: {
    priority: 14,
    keywords: [
      'gauge', 'wideband', 'boost gauge', 'oil pressure gauge', 'temp gauge',
      'defi', 'prosport', 'greddy', 'autometer', 'data logger', 'aim',
      'racepak', 'camera', 'gopro mount', 'charging', 'battery',
      'optima', 'lightweight battery', 'kill switch', 'relay',
    ],
    exclude: [],
  },
  engine: {
    priority: 15,
    keywords: [
      'camshaft', 'cam', 'valve', 'valve spring', 'retainer', 'piston',
      'rod', 'connecting rod', 'crankshaft', 'crank', 'bearing',
      'timing chain', 'timing belt', 'tensioner', 'head gasket',
      'gasket', 'seal', 'oil pan', 'spark plug', 'coil pack', 'ignition',
      'intake valve', 'exhaust valve', 'port', 'ported', 'stroker',
      'bore', 'oil pump', 'timing kit', 'cylinder head',
    ],
    exclude: ['exhaust manifold', 'intake manifold'], // Already categorized
  },
};

// ============================================================================
// CATEGORIZATION LOGIC
// ============================================================================

/**
 * Determine the best category for a part based on keyword matching.
 * @param {object} part - The part object with name and description
 * @returns {{ category: string, confidence: number, matchedKeyword: string } | null}
 */
function categorizePartByKeywords(part) {
  const searchText = `${part.name || ''} ${part.description || ''}`.toLowerCase();
  
  let bestMatch = null;
  let bestPriority = Infinity;
  
  for (const [category, config] of Object.entries(CATEGORY_KEYWORDS)) {
    // Check exclusions first
    const isExcluded = config.exclude?.some(exc => searchText.includes(exc.toLowerCase()));
    if (isExcluded) continue;
    
    // Find matching keyword
    for (const keyword of config.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        // Prioritize earlier categories (lower priority number) and longer keywords
        const score = config.priority * 100 - keyword.length;
        if (score < bestPriority) {
          bestMatch = {
            category,
            confidence: 0.70 + (keyword.length / 50), // Longer keywords = higher confidence
            matchedKeyword: keyword,
          };
          bestPriority = score;
        }
        break; // Found match in this category, move to next
      }
    }
  }
  
  return bestMatch;
}

// ============================================================================
// MAIN SCRIPT
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : undefined;

  console.log('='.repeat(60));
  console.log('Recategorize Parts Script');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Limit: ${limit || 'all'}`);
  console.log('');

  // Fetch parts in 'other' category
  console.log('Fetching parts in "other" category...');
  
  let query = supabase
    .from('parts')
    .select('id, name, description, category')
    .eq('category', 'other')
    .eq('is_active', true);
  
  if (limit) {
    query = query.limit(limit);
  }
  
  const { data: parts, error } = await query;
  
  if (error) {
    console.error('Error fetching parts:', error);
    process.exit(1);
  }
  
  console.log(`Found ${parts.length} parts in "other" category`);
  console.log('');

  // Categorize parts
  const categorized = [];
  const uncategorized = [];
  const categoryStats = {};

  for (const part of parts) {
    const match = categorizePartByKeywords(part);
    
    if (match) {
      categorized.push({
        ...part,
        newCategory: match.category,
        confidence: match.confidence,
        matchedKeyword: match.matchedKeyword,
      });
      categoryStats[match.category] = (categoryStats[match.category] || 0) + 1;
      
      if (verbose) {
        console.log(`  [${match.category}] "${part.name}" (matched: ${match.matchedKeyword})`);
      }
    } else {
      uncategorized.push(part);
    }
  }

  // Report
  console.log('='.repeat(60));
  console.log('Categorization Results');
  console.log('='.repeat(60));
  console.log(`Total processed: ${parts.length}`);
  console.log(`Categorized: ${categorized.length} (${((categorized.length / parts.length) * 100).toFixed(1)}%)`);
  console.log(`Uncategorized: ${uncategorized.length}`);
  console.log('');
  
  console.log('Category Distribution:');
  const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedCategories) {
    console.log(`  ${cat}: ${count} parts`);
  }
  console.log('');

  // Sample uncategorized
  if (uncategorized.length > 0 && verbose) {
    console.log('Sample Uncategorized Parts:');
    for (const part of uncategorized.slice(0, 10)) {
      console.log(`  - "${part.name}"`);
    }
    console.log('');
  }

  // Apply changes
  if (!dryRun && categorized.length > 0) {
    console.log('Applying category updates...');
    
    let updated = 0;
    let errors = 0;
    
    // Batch updates by category for efficiency
    for (const [category, _count] of sortedCategories) {
      const partsInCategory = categorized.filter(p => p.newCategory === category);
      const ids = partsInCategory.map(p => p.id);
      
      const { error: updateError } = await supabase
        .from('parts')
        .update({ category })
        .in('id', ids);
      
      if (updateError) {
        console.error(`  Error updating ${category}:`, updateError.message);
        errors += ids.length;
      } else {
        updated += ids.length;
        console.log(`  Updated ${ids.length} parts to "${category}"`);
      }
    }
    
    console.log('');
    console.log(`Done. Updated: ${updated}. Errors: ${errors}`);
  } else if (dryRun) {
    console.log('[DRY RUN] No changes made. Run without --dry-run to apply changes.');
  }

  // Log validation results
  logValidationResults('recategorizeParts', {
    total: parts.length,
    valid: categorized,
    invalid: uncategorized.map(p => ({ record: p, reason: 'No keyword match' })),
  });
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});
