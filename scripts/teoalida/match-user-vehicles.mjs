#!/usr/bin/env node

/**
 * Match User Vehicles to Teoalida Cars
 * 
 * This script matches existing user_vehicles records to the new Teoalida
 * cars database based on their stored year, make, model, trim data.
 * 
 * Usage:
 *   node scripts/teoalida/match-user-vehicles.mjs --analyze   # Preview matches
 *   node scripts/teoalida/match-user-vehicles.mjs --execute   # Apply matches
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Normalize string for comparison
 */
function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Model name mappings to handle AutoRev vs Teoalida naming differences
 * Format: { autorevModel: [{ teoalidaModel, teoalidaTrim? }] }
 */
const MODEL_MAPPINGS = {
  // VW GTI - Teoalida uses "Golf GTI" as the model
  'gti mk6': [{ model: 'golf gti' }],
  'gti mk7': [{ model: 'golf gti' }],
  'gti mk8': [{ model: 'golf gti' }],
  'mk6 gti': [{ model: 'golf gti' }],
  'mk7 gti': [{ model: 'golf gti' }],
  'mk8 gti': [{ model: 'golf gti' }],
  'volkswagen gti': [{ model: 'golf gti' }],
  
  // VW Golf R - Teoalida uses "Golf R" as the model
  'golf r mk7': [{ model: 'golf r' }],
  'golf r mk8': [{ model: 'golf r' }],
  'mk7 golf r': [{ model: 'golf r' }],
  'mk8 golf r': [{ model: 'golf r' }],
  
  // VW Golf TSI
  'golf tsi': [{ model: 'golf' }],
  'mk7 golf tsi': [{ model: 'golf' }],
  
  // VW Jetta
  'jetta gli': [{ model: 'jetta gli' }, { model: 'jetta', trim: 'gli' }],
  'mk7 jetta gli': [{ model: 'jetta gli' }, { model: 'jetta', trim: 'gli' }],
  
  // BMW M cars - Teoalida uses "3 Series" model with "M3" trim
  'm3 e46': [{ model: '3 series', trim: 'm3' }],
  'm3 e90': [{ model: '3 series', trim: 'm3' }],
  'm3 e92': [{ model: '3 series', trim: 'm3' }],
  'm3 f80': [{ model: '3 series', trim: 'm3' }],
  'm3 g80': [{ model: '3 series', trim: 'm3' }],
  'm2 f87': [{ model: '2 series', trim: 'm2' }, { model: 'm2' }],
  'm2 g87': [{ model: '2 series', trim: 'm2' }, { model: 'm2' }],
  'm4 f82': [{ model: '4 series', trim: 'm4' }],
  'm4 g82': [{ model: '4 series', trim: 'm4' }],
  'm5 e60': [{ model: '5 series', trim: 'm5' }],
  'm5 f90': [{ model: '5 series', trim: 'm5' }],
  'bmw m3': [{ model: '3 series', trim: 'm3' }],
  'bmw m2': [{ model: '2 series', trim: 'm2' }, { model: 'm2' }],
  
  // Ford Mustang variations
  'mustang shelby gt350': [{ model: 'mustang', trim: 'shelby gt350' }, { model: 'mustang shelby', trim: 'gt350' }],
  'mustang shelby gt500': [{ model: 'mustang', trim: 'shelby gt500' }, { model: 'mustang shelby', trim: 'gt500' }],
  'mustang gt pp2': [{ model: 'mustang', trim: 'gt' }],
  'mustang gt pp1': [{ model: 'mustang', trim: 'gt' }],
  'mustang ecoboost': [{ model: 'mustang', trim: 'ecoboost' }],
  'mustang svt cobra': [{ model: 'mustang', trim: 'svt cobra' }, { model: 'mustang', trim: 'cobra' }],
  
  // Mazda naming
  '6 2.5 turbo': [{ model: '6' }, { model: 'mazda6' }],
  'gj 6': [{ model: '6' }, { model: 'mazda6' }],
  'mazda 6': [{ model: '6' }, { model: 'mazda6' }],
  
  // Porsche naming
  '911 gt3 996': [{ model: '911', trim: 'gt3' }],
  '911 gt3 997': [{ model: '911', trim: 'gt3' }],
  '911 gt3 991': [{ model: '911', trim: 'gt3' }],
  '911 gt3 992': [{ model: '911', trim: 'gt3' }],
  '911 gt3 rs': [{ model: '911', trim: 'gt3 rs' }],
  '718 cayman gt4': [{ model: '718 cayman', trim: 'gt4' }],
  'cayman gt4': [{ model: '718 cayman', trim: 'gt4' }, { model: 'cayman', trim: 'gt4' }],
  'panamera turbo': [{ model: 'panamera', trim: 'turbo' }],
  
  // Toyota naming
  'supra mk4': [{ model: 'supra' }],
  'supra a80': [{ model: 'supra' }],
  'supra mk4 a80 turbo': [{ model: 'supra', trim: 'turbo' }],
  
  // Audi naming
  's4 b8': [{ model: 's4' }],
  's5 b9': [{ model: 's5' }],
  'rs5': [{ model: 'rs 5' }, { model: 'rs5' }],
  'rs7': [{ model: 'rs 7' }, { model: 'rs7' }],
  'a4 b8': [{ model: 'a4' }],
  'a4 2.0t': [{ model: 'a4', trim: '2.0t' }],
  
  // Mitsubishi
  'lancer evolution': [{ model: 'lancer', trim: 'evolution' }, { model: 'lancer evolution' }],
  'lancer evo': [{ model: 'lancer', trim: 'evolution' }, { model: 'lancer evolution' }],
  
  // Honda
  'civic type r fl5': [{ model: 'civic type r' }, { model: 'civic', trim: 'type r' }],
  'civic type r fk8': [{ model: 'civic type r' }, { model: 'civic', trim: 'type r' }],
  'civic si em1': [{ model: 'civic', trim: 'si' }],
  'prelude si vtec': [{ model: 'prelude', trim: 'si' }],
  
  // Hyundai
  'elantra n': [{ model: 'elantra n' }, { model: 'elantra', trim: 'n' }],
  
  // Infiniti
  'q50 red sport': [{ model: 'q50', trim: 'red sport' }],
  
  // Nissan
  'maxima': [{ model: 'maxima' }],
  
  // Mercedes
  'e63 s': [{ model: 'e-class', trim: 'amg e 63 s' }, { model: 'amg e 63' }],
  'mercedes-amg e63': [{ model: 'e-class', trim: 'amg e 63' }, { model: 'amg e 63' }],
  
  // Ram
  'ram 1500': [{ model: '1500' }],
  '1500 trx': [{ model: '1500', trim: 'trx' }],
  '1500 rebel': [{ model: '1500', trim: 'rebel' }],
};

/**
 * Get alternative model/trim combinations for matching
 * Returns array of { model, trim } objects
 */
function getModelVariants(userModel, userTrim) {
  const normalizedModel = normalize(userModel);
  const normalizedTrim = normalize(userTrim);
  const fullUserName = normalize(`${userModel} ${userTrim || ''}`);
  const variants = [{ model: normalizedModel, trim: normalizedTrim }];
  
  // Check direct mappings - use word boundary matching for precision
  for (const [key, mappings] of Object.entries(MODEL_MAPPINGS)) {
    // Key must be a substantial match - either contains key or key contains model
    const keyMatch = 
      normalizedModel === key ||
      fullUserName === key ||
      normalizedModel.includes(key) ||
      fullUserName.includes(key);
    
    if (keyMatch) {
      for (const mapping of mappings) {
        variants.push({
          model: mapping.model,
          trim: mapping.trim || normalizedTrim,
          requiresTrimMatch: !!mapping.trim,
          priority: mapping.trim ? 2 : 1,  // Higher priority for trim-specific matches
        });
      }
    }
  }
  
  // Strip common suffixes (chassis codes, generation markers)
  const stripped = normalizedModel
    .replace(/\b(mk\d+|e\d{2}|f\d{2}|g\d{2}|b\d\.?\d?|em\d|fk\d|fl\d|nc\d|a\d{2}|w213|971|996|997|991|992)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (stripped && stripped !== normalizedModel) {
    variants.push({ model: stripped, trim: normalizedTrim, priority: 0 });
  }
  
  // Sort by priority (higher first)
  variants.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  return variants;
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function similarity(a, b) {
  const normA = normalize(a);
  const normB = normalize(b);
  
  if (normA === normB) return 1;
  if (!normA || !normB) return 0;
  
  // Check if one contains the other
  if (normA.includes(normB) || normB.includes(normA)) {
    return 0.9;
  }
  
  // Word overlap
  const wordsA = new Set(normA.split(' '));
  const wordsB = new Set(normB.split(' '));
  const intersection = [...wordsA].filter(w => wordsB.has(w));
  const union = new Set([...wordsA, ...wordsB]);
  
  return intersection.length / union.size;
}

/**
 * Fetch all user vehicles with their current matches
 */
async function fetchUserVehicles() {
  const { data, error } = await supabase
    .from('user_vehicles')
    .select(`
      id,
      user_id,
      year,
      make,
      model,
      trim,
      matched_car_id,
      matched_car_slug,
      cars:matched_car_id (
        id,
        slug,
        brand,
        model,
        trim,
        years,
        structure_version
      )
    `)
    .order('make')
    .order('model')
    .order('year');
  
  if (error) throw error;
  return data;
}

/**
 * Fetch Teoalida cars for matching (paginated to handle 75K+ records)
 */
async function fetchTeoalidaCars() {
  const allData = [];
  const pageSize = 1000;
  let page = 0;
  let hasMore = true;
  
  console.log('Loading Teoalida cars...');
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('cars_teoalida')
      .select('id, year, make, model, trim, slug, name, hp, platform_code')
      .range(page * pageSize, (page + 1) * pageSize - 1);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      allData.push(...data);
      page++;
      hasMore = data.length === pageSize;
      
      if (page % 10 === 0) {
        process.stdout.write(`  Loaded ${allData.length.toLocaleString()} cars...\r`);
      }
    } else {
      hasMore = false;
    }
  }
  
  console.log(`  Loaded ${allData.length.toLocaleString()} total cars`);
  return allData;
}

/**
 * Find best matching Teoalida car for a user vehicle
 */
function findBestMatch(userVehicle, teoalidaCars) {
  const uvYear = userVehicle.year;
  const uvMake = normalize(userVehicle.make);
  const uvModel = normalize(userVehicle.model);
  const uvTrim = normalize(userVehicle.trim);
  
  // Get model/trim variants for flexible matching
  const modelVariants = getModelVariants(userVehicle.model, userVehicle.trim);
  
  // First pass: exact year + make match (case insensitive)
  let candidates = teoalidaCars.filter(tc => {
    const tcMake = normalize(tc.make);
    // Handle make variations
    const makeMatch = tc.year === uvYear && (
      tcMake === uvMake ||
      tcMake.includes(uvMake.replace(/[^a-z]/g, '')) ||
      uvMake.includes(tcMake.replace(/[^a-z]/g, '')) ||
      // Handle brand variations
      (uvMake.includes('mercedes') && tcMake.includes('mercedes')) ||
      (uvMake.includes('ram') && tcMake === 'ram') ||
      (uvMake.includes('volkswagen') && tcMake === 'volkswagen') ||
      (uvMake.includes('infiniti') && tcMake.includes('infiniti'))
    );
    return makeMatch;
  });
  
  if (candidates.length === 0) {
    // Try fuzzy make match
    const fuzzyMakeCandidates = teoalidaCars.filter(tc => {
      return tc.year === uvYear && similarity(tc.make, userVehicle.make) > 0.5;
    });
    
    if (fuzzyMakeCandidates.length === 0) {
      return { match: null, confidence: 0, reason: 'No year+make match' };
    }
    
    candidates = fuzzyMakeCandidates;
  }
  
  // Score each candidate using model variants
  const scored = candidates.map(tc => {
    const tcModel = normalize(tc.model);
    const tcTrim = normalize(tc.trim);
    const tcFullName = normalize(`${tc.model} ${tc.trim || ''}`);
    
    let bestScore = 0;
    let matchedVariant = null;
    
    for (const variant of modelVariants) {
      let variantScore = 0;
      
      // Check if this variant requires a specific trim match
      if (variant.requiresTrimMatch && variant.trim) {
        // For trim-required matches (like M3, GTI, etc.)
        const modelMatch = tcModel === variant.model || tcModel.includes(variant.model);
        const trimMatch = tcTrim && (tcTrim === variant.trim || tcTrim.includes(variant.trim));
        
        if (modelMatch && trimMatch) {
          // Perfect match - model and trim both match
          variantScore = 0.98;
        } else if (modelMatch && !trimMatch) {
          // Model matches but trim doesn't - very low score
          variantScore = 0.2;
        }
      } else {
        // Standard matching for non-trim-specific variants
        
        // Direct model match
        if (tcModel === variant.model) {
          variantScore = Math.max(variantScore, 0.95);
        } else {
          const modelSim = similarity(variant.model, tcModel);
          variantScore = Math.max(variantScore, modelSim);
        }
        
        // Full name match
        const fullNameSim = similarity(variant.model, tcFullName);
        variantScore = Math.max(variantScore, fullNameSim);
        
        // Check word overlap
        const variantWords = variant.model.split(' ').filter(w => w.length > 1);
        const matchingWords = variantWords.filter(w => tcModel.includes(w) || tcFullName.includes(w));
        if (variantWords.length > 0) {
          const wordScore = matchingWords.length / variantWords.length * 0.85;
          variantScore = Math.max(variantScore, wordScore);
        }
      }
      
      if (variantScore > bestScore) {
        bestScore = variantScore;
        matchedVariant = variant;
      }
    }
    
    // Performance variant matching - additional check
    const perfKeywords = ['gt', 'gti', 'r', 'rs', 'm3', 'm4', 'm5', 'amg', 'type r', 'sti', 'hellcat', 'z06', 'zl1', 'trx', 'raptor', 'shelby', 'cobra', 'gt3', 'gt4', 'turbo', 'n'];
    const uvHasPerf = perfKeywords.some(k => {
      const kRegex = new RegExp(`\\b${k}\\b`, 'i');
      return kRegex.test(uvModel) || (uvTrim && kRegex.test(uvTrim));
    });
    const tcHasPerf = perfKeywords.some(k => {
      const kRegex = new RegExp(`\\b${k}\\b`, 'i');
      return kRegex.test(tcModel) || (tcTrim && kRegex.test(tcTrim));
    });
    
    // Strong penalize if user has performance model but candidate doesn't
    if (uvHasPerf && !tcHasPerf && bestScore < 0.9) {
      bestScore *= 0.3;
    }
    // Boost if both have matching performance
    if (uvHasPerf && tcHasPerf) {
      bestScore = Math.min(1, bestScore * 1.05);
    }
    
    return {
      car: tc,
      score: bestScore,
      matchedVariant,
    };
  });
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  const best = scored[0];
  
  if (!best || best.score < 0.3) {
    return { match: null, confidence: 0, reason: 'No good model match' };
  }
  
  // Determine confidence
  let confidence = best.score;
  let reason = '';
  
  if (best.score >= 0.9) {
    reason = 'Exact match';
  } else if (best.score >= 0.7) {
    reason = 'Good match';
  } else if (best.score >= 0.5) {
    reason = 'Partial match - needs review';
  } else {
    reason = 'Low confidence - needs review';
  }
  
  return {
    match: best.car,
    confidence,
    reason,
    alternatives: scored.slice(1, 4).map(s => s.car),
  };
}

/**
 * Analyze matches without applying
 */
async function analyzeMatches() {
  console.log('🔍 Analyzing user vehicle matches...\n');
  
  const userVehicles = await fetchUserVehicles();
  console.log(`Found ${userVehicles.length} user vehicles\n`);
  
  // Check if Teoalida table exists
  const { data: teoalidaCars, error } = await supabase
    .from('cars_teoalida')
    .select('id, year, make, model, trim, slug, name, hp, platform_code')
    .limit(1);
  
  if (error) {
    console.log('⚠️  cars_teoalida table not found. Run import first.');
    console.log('\nShowing current user vehicles and what they need to match:\n');
    
    // Show what needs matching
    const summary = {};
    for (const uv of userVehicles) {
      const key = `${uv.year} ${uv.make} ${uv.model} ${uv.trim || ''}`.trim();
      if (!summary[key]) {
        summary[key] = { count: 0, currentMatch: uv.cars?.slug || 'NONE' };
      }
      summary[key].count++;
    }
    
    console.log('User Vehicles to Match:');
    console.log('-'.repeat(80));
    for (const [key, info] of Object.entries(summary).sort((a, b) => b[1].count - a[1].count)) {
      const status = info.currentMatch === 'NONE' ? '❌' : '✅';
      console.log(`${status} ${key} (${info.count} users) → Currently: ${info.currentMatch}`);
    }
    
    return;
  }
  
  // Full analysis with Teoalida data
  const allTeoalidaCars = await fetchTeoalidaCars();
  console.log(`Teoalida database: ${allTeoalidaCars.length.toLocaleString()} cars\n`);
  
  const results = {
    exact: [],
    good: [],
    needsReview: [],
    noMatch: [],
  };
  
  for (const uv of userVehicles) {
    const result = findBestMatch(uv, allTeoalidaCars);
    
    const entry = {
      userVehicle: {
        id: uv.id,
        ymmt: `${uv.year} ${uv.make} ${uv.model} ${uv.trim || ''}`.trim(),
        currentSlug: uv.cars?.slug || 'NONE',
      },
      match: result.match ? {
        id: result.match.id,
        name: result.match.name,
        slug: result.match.slug,
        hp: result.match.hp,
      } : null,
      confidence: result.confidence,
      reason: result.reason,
    };
    
    if (result.confidence >= 0.9) {
      results.exact.push(entry);
    } else if (result.confidence >= 0.7) {
      results.good.push(entry);
    } else if (result.match) {
      results.needsReview.push(entry);
    } else {
      results.noMatch.push(entry);
    }
  }
  
  // Print results
  console.log('='.repeat(80));
  console.log('MATCHING RESULTS');
  console.log('='.repeat(80));
  
  console.log(`\n✅ EXACT MATCHES (${results.exact.length}):`);
  for (const r of results.exact.slice(0, 10)) {
    console.log(`  ${r.userVehicle.ymmt} → ${r.match.name} (${r.match.hp} HP)`);
  }
  if (results.exact.length > 10) console.log(`  ... and ${results.exact.length - 10} more`);
  
  console.log(`\n🟡 GOOD MATCHES (${results.good.length}):`);
  for (const r of results.good) {
    console.log(`  ${r.userVehicle.ymmt} → ${r.match.name}`);
    console.log(`    Confidence: ${(r.confidence * 100).toFixed(0)}% - ${r.reason}`);
  }
  
  console.log(`\n⚠️  NEEDS REVIEW (${results.needsReview.length}):`);
  for (const r of results.needsReview) {
    console.log(`  ${r.userVehicle.ymmt} → ${r.match?.name || 'N/A'}`);
    console.log(`    Confidence: ${(r.confidence * 100).toFixed(0)}% - ${r.reason}`);
  }
  
  console.log(`\n❌ NO MATCH (${results.noMatch.length}):`);
  for (const r of results.noMatch) {
    console.log(`  ${r.userVehicle.ymmt} - ${r.reason}`);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`  Exact matches:    ${results.exact.length} (${(results.exact.length/userVehicles.length*100).toFixed(0)}%)`);
  console.log(`  Good matches:     ${results.good.length} (${(results.good.length/userVehicles.length*100).toFixed(0)}%)`);
  console.log(`  Needs review:     ${results.needsReview.length} (${(results.needsReview.length/userVehicles.length*100).toFixed(0)}%)`);
  console.log(`  No match:         ${results.noMatch.length} (${(results.noMatch.length/userVehicles.length*100).toFixed(0)}%)`);
  
  return results;
}

/**
 * Main
 */
async function main() {
  const args = process.argv.slice(2);
  const shouldExecute = args.includes('--execute');
  
  try {
    const results = await analyzeMatches();
    
    if (shouldExecute) {
      console.log('\n⚠️  Execute mode not yet implemented.');
      console.log('Review the matches above first, then we can proceed with migration.');
    } else {
      console.log('\n💡 Run with --execute to apply matches (after review)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
