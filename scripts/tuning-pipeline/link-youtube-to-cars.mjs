#!/usr/bin/env node
/**
 * Link YouTube Videos to Cars
 * 
 * Matches youtube_videos to cars table based on title and content.
 * This unlocks 998 video transcripts for tuning insights.
 * 
 * Usage:
 *   node scripts/tuning-pipeline/link-youtube-to-cars.mjs
 *   node scripts/tuning-pipeline/link-youtube-to-cars.mjs --dry-run
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

/**
 * Build search patterns for a car
 */
function buildCarPatterns(car) {
  const patterns = [];
  const name = car.name.toLowerCase();
  
  // Full name
  patterns.push(name);
  
  // Extract key terms
  // e.g., "Volkswagen GTI Mk7" -> ["volkswagen", "gti", "mk7"]
  const terms = name.split(/\s+/);
  
  // Brand + model combinations
  if (terms.length >= 2) {
    patterns.push(`${terms[0]} ${terms[1]}`); // "volkswagen gti"
    patterns.push(terms.slice(1).join(' ')); // "gti mk7"
  }
  
  // Common abbreviations and variations
  const brandAbbrevs = {
    'volkswagen': ['vw', 'volkswagen'],
    'chevrolet': ['chevy', 'chevrolet'],
    'mercedes-amg': ['mercedes', 'amg', 'merc'],
    'bmw': ['bmw', 'bimmer'],
    'porsche': ['porsche'],
    'ford': ['ford'],
    'honda': ['honda'],
    'toyota': ['toyota'],
    'subaru': ['subaru', 'subie'],
    'nissan': ['nissan'],
    'mazda': ['mazda'],
    'audi': ['audi'],
    'lexus': ['lexus'],
    'acura': ['acura'],
    'dodge': ['dodge'],
    'jeep': ['jeep'],
    'ram': ['ram'],
  };
  
  // Model identifiers that are highly specific
  const modelIdentifiers = [
    'gti', 'golf r', 'r32', 'gli',
    'm3', 'm4', 'm2', 'm5',
    'gt3', 'gt4', 'gt2', '911', 'cayman', 'boxster',
    'mustang', 'gt350', 'gt500', 'mach 1',
    'corvette', 'c8', 'c7', 'c6', 'z06', 'zr1',
    'camaro', 'ss', 'zl1',
    'wrx', 'sti', 'brz',
    'civic type r', 'type r', 'nsx', 's2000',
    'supra', 'gr86', '86',
    'gt-r', 'gtr', '370z', '350z', 'z',
    'rs3', 'rs6', 's4', 'rs7',
    'evo', 'lancer', 'evolution',
    'miata', 'mx-5', 'rx-7', 'rx-8',
    'challenger', 'charger', 'hellcat', 'demon',
    'wrangler', 'gladiator', 'bronco',
    'f-150', 'f150', 'raptor', 'silverado', 'sierra',
    'c63', 'e63', 'amg gt',
    'is350', 'is-f', 'rc-f', 'lc500',
    'm240i', 'm340i', 'm440i',
  ];
  
  // Add model identifiers found in car name
  modelIdentifiers.forEach(model => {
    if (name.includes(model)) {
      patterns.push(model);
    }
  });
  
  // Add slug-derived patterns (e.g., "volkswagen-gti-mk7" -> "gti mk7")
  if (car.slug) {
    const slugTerms = car.slug.split('-').filter(t => t.length > 1);
    if (slugTerms.length >= 2) {
      // Skip first term if it's a generic brand
      const modelTerms = slugTerms.slice(1).join(' ');
      if (modelTerms.length > 3) {
        patterns.push(modelTerms);
      }
    }
  }
  
  // Generation identifiers
  const genPatterns = name.match(/\b(mk\d+|gen\s*\d+|e\d{2}|f\d{2}|g\d{2}|[a-z]\d{2,3})\b/gi);
  if (genPatterns) {
    patterns.push(...genPatterns.map(p => p.toLowerCase()));
  }
  
  // Dedupe and filter short patterns
  return [...new Set(patterns)].filter(p => p.length >= 3);
}

/**
 * Score how well a video matches a car
 */
function scoreMatch(video, car, patterns) {
  const title = (video.title || '').toLowerCase();
  const description = (video.description || '').toLowerCase();
  const summary = (video.summary || '').toLowerCase();
  
  let score = 0;
  let matchedPatterns = [];
  
  for (const pattern of patterns) {
    // Title matches are most important
    if (title.includes(pattern)) {
      score += pattern.length * 3;
      matchedPatterns.push(`title:${pattern}`);
    }
    // Summary matches
    if (summary.includes(pattern)) {
      score += pattern.length * 2;
      matchedPatterns.push(`summary:${pattern}`);
    }
    // Description matches
    if (description.includes(pattern)) {
      score += pattern.length;
      matchedPatterns.push(`desc:${pattern}`);
    }
  }
  
  // Bonus for exact full name match
  if (title.includes(car.name.toLowerCase())) {
    score += 50;
  }
  
  return { score, matchedPatterns };
}

/**
 * Main execution
 */
async function main() {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false }
    }
  });
  
  const dryRun = values['dry-run'];
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('LINK YOUTUBE VIDEOS TO CARS');
  console.log('═══════════════════════════════════════════════════════════════');
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be saved\n');
  }
  
  // Get all cars
  const { data: cars, error: carsError } = await supabase
    .from('cars')
    .select('id, name, slug')
    .order('name');
  
  if (carsError) {
    console.error('Error fetching cars:', carsError.message);
    process.exit(1);
  }
  
  console.log(`Found ${cars.length} cars\n`);
  
  // Build pattern map for each car
  const carPatternMap = new Map();
  cars.forEach(car => {
    carPatternMap.set(car.id, {
      car,
      patterns: buildCarPatterns(car)
    });
  });
  
  // Get all unlinked videos
  const { data: videos, error: videosError } = await supabase
    .from('youtube_videos')
    .select('id, title, description, summary')
    .is('car_id', null);
  
  if (videosError) {
    console.error('Error fetching videos:', videosError.message);
    process.exit(1);
  }
  
  console.log(`Found ${videos.length} unlinked videos\n`);
  
  // Match videos to cars
  let linkedCount = 0;
  let noMatchCount = 0;
  const matchResults = [];
  
  for (const video of videos) {
    let bestMatch = null;
    let bestScore = 0;
    let bestPatterns = [];
    
    for (const [carId, { car, patterns }] of carPatternMap) {
      const { score, matchedPatterns } = scoreMatch(video, car, patterns);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = car;
        bestPatterns = matchedPatterns;
      }
    }
    
    // Threshold: require minimum score to link
    const THRESHOLD = 15; // Requires at least a few good pattern matches
    
    if (bestMatch && bestScore >= THRESHOLD) {
      matchResults.push({
        video,
        car: bestMatch,
        score: bestScore,
        patterns: bestPatterns
      });
      
      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('youtube_videos')
          .update({ car_id: bestMatch.id })
          .eq('id', video.id);
        
        if (updateError) {
          console.log(`  ❌ Error linking video: ${updateError.message}`);
        } else {
          linkedCount++;
        }
      } else {
        linkedCount++;
      }
    } else {
      noMatchCount++;
    }
  }
  
  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Videos linked:    ${linkedCount}`);
  console.log(`No match found:   ${noMatchCount}`);
  
  // Show distribution by car
  const carCounts = {};
  matchResults.forEach(r => {
    carCounts[r.car.name] = (carCounts[r.car.name] || 0) + 1;
  });
  
  const sortedCars = Object.entries(carCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  
  console.log('\nTop 20 cars by video count:');
  sortedCars.forEach(([name, count]) => {
    console.log(`  ${count.toString().padStart(3)} - ${name}`);
  });
  
  // Show sample matches
  console.log('\nSample matches:');
  matchResults.slice(0, 5).forEach(r => {
    console.log(`  "${r.video.title?.substring(0, 50)}..."`);
    console.log(`  → ${r.car.name} (score: ${r.score})`);
    console.log(`    Patterns: ${r.patterns.slice(0, 3).join(', ')}`);
    console.log('');
  });
}

main().catch(console.error);
