#!/usr/bin/env node

/**
 * Audit YouTube Video-Car Mappings
 * 
 * This script audits the youtube_video_car_links table to find incorrect mappings
 * where videos are associated with the wrong cars.
 * 
 * Usage:
 *   node scripts/audit-youtube-mappings.js [options]
 * 
 * Options:
 *   --fix              Automatically fix incorrect mappings
 *   --dry-run          Show what would be fixed without making changes
 *   --verbose          Enable verbose logging
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Parse arguments
const args = process.argv.slice(2);
const options = {
  fix: args.includes('--fix'),
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose')
};

const log = (...args) => console.log('[audit]', ...args);
const logVerbose = (...args) => options.verbose && console.log('[audit:verbose]', ...args);
const logError = (...args) => console.error('[audit:error]', ...args);

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Common model aliases and patterns
const MODEL_ALIASES = {
  '991': ['991.1', '991.2'],
  '997': ['997.1', '997.2'],
  '996': ['996'],
  'r8': ['r8 v8', 'r8 v10'],
  '1m': ['1 series m', '1m coupe'],
  'evo': ['lancer evolution', 'evo viii', 'evo ix', 'evo 8', 'evo 9'],
  'golf r': ['golf r mk7', 'golf r mk8'],
  'gti': ['gti mk7', 'gti mk8'],
  'rs3': ['rs3 8v', 'rs3 8y'],
  'rs5': ['rs5 b8', 'rs5 b9'],
  'tt rs': ['tt rs 8j', 'tt rs 8s'],
  'brz': ['brz zc6', 'brz zd8'],
  'gr86': ['86', 'gt86', 'frs', 'fr-s'],
  'supra': ['gr supra', 'supra mk4', 'supra a80'],
  'miata': ['mx-5', 'miata na', 'miata nb', 'miata nc', 'miata nd'],
  'm3': ['m3 e46', 'm3 e92', 'm3 f80'],
  'm5': ['m5 e39', 'm5 e60', 'm5 f10', 'm5 f90'],
  'c63': ['c63 w204', 'c63 w205'],
  'e63': ['e63 w212', 'e63 w213'],
  'gt3': ['911 gt3 996', '911 gt3 997'],
  'turbo': ['911 turbo 997.1', '911 turbo 997.2'],
  'cayman': ['cayman gt4', 'cayman gts', 'cayman s'],
};

// Sister cars - videos about one might legitimately be assigned to either
const SISTER_CARS = [
  // Gen 1 triplets (2012-2020)
  ['subaru-brz-zc6', 'toyota-86-scion-frs'],
  // Gen 2 triplets (2022+)
  ['subaru-brz-zd8', 'toyota-gr86'],
  // Cross-gen (videos comparing generations)
  ['subaru-brz-zc6', 'subaru-brz-zd8'],
  ['toyota-86-scion-frs', 'toyota-gr86'],
  // All 4 together for videos about "BRZ/86/GR86/FRS"
  ['subaru-brz-zc6', 'toyota-gr86'],
  ['toyota-86-scion-frs', 'subaru-brz-zd8'],
];

/**
 * Check if two car slugs are sister cars
 */
function areSisterCars(slug1, slug2) {
  return SISTER_CARS.some(group => group.includes(slug1) && group.includes(slug2));
}

/**
 * Extract year from video title
 */
function extractYear(title) {
  const yearMatch = title.match(/\b(19\d{2}|20\d{2})\b/);
  return yearMatch ? parseInt(yearMatch[1], 10) : null;
}

/**
 * Check if a video title matches a car
 */
function titleMatchesCar(title, car) {
  const titleLower = title.toLowerCase();
  const carNameLower = car.name.toLowerCase();
  const carBrand = (car.brand || '').toLowerCase();
  const carSlug = car.slug.toLowerCase().replace(/-/g, ' ');
  
  // Strong match patterns
  const strongMatches = [
    // Exact car name
    titleLower.includes(carNameLower),
    // Slug-based match
    titleLower.includes(carSlug),
  ];
  
  if (strongMatches.some(m => m)) return { match: true, confidence: 'high' };
  
  // Check for generation-specific matches
  // e.g., "991" should match "991.1 Carrera S"
  const generationPatterns = [
    { pattern: /\b991\.?1\b/i, slug: '991-1' },
    { pattern: /\b991\.?2\b/i, slug: '991-2' },
    { pattern: /\bporsche\s*991\b/i, slugPart: '991' },  // Generic "991" matches 991.1
    { pattern: /\b997\.?1\b/i, slug: '997-1' },
    { pattern: /\b997\.?2\b/i, slug: '997-2' },
    { pattern: /\bporsche\s*997\b/i, slugPart: '997' },  // Generic "997" matches 997.2
    { pattern: /\b8v\b/i, slugPart: '8v' },
    { pattern: /\b8y\b/i, slugPart: '8y' },
    { pattern: /\bb8\b/i, slugPart: 'b8' },
    { pattern: /\bb9\b/i, slugPart: 'b9' },
    { pattern: /\b8j\b/i, slugPart: '8j' },
    { pattern: /\b8s\b/i, slugPart: '8s' },
    { pattern: /\bmk7\b|mk\.?7\b|mk\.?\s*vii\b/i, slugPart: 'mk7' },
    { pattern: /\bmk8\b|mk\.?8\b|mk\.?\s*viii\b/i, slugPart: 'mk8' },
    { pattern: /\be46\b/i, slugPart: 'e46' },
    { pattern: /\be92\b/i, slugPart: 'e92' },
    { pattern: /\bf80\b/i, slugPart: 'f80' },
    { pattern: /\be39\b/i, slugPart: 'e39' },
    { pattern: /\be60\b/i, slugPart: 'e60' },
    { pattern: /\bf10\b/i, slugPart: 'f10' },
    { pattern: /\bf90\b/i, slugPart: 'f90' },
    { pattern: /\bw204\b/i, slugPart: 'w204' },
    { pattern: /\bw205\b/i, slugPart: 'w205' },
    { pattern: /\bw212\b/i, slugPart: 'w212' },
    { pattern: /\bw213\b/i, slugPart: 'w213' },
    { pattern: /\b981\b/i, slugPart: '981' },
    { pattern: /\b987\b/i, slugPart: '987' },
    { pattern: /\b718\b/i, slugPart: '718' },
    { pattern: /\bfk8\b/i, slugPart: 'fk8' },
    { pattern: /\bfl5\b/i, slugPart: 'fl5' },
    { pattern: /\bna\b.*miata|miata.*\bna\b/i, slugPart: 'na' },
    { pattern: /\bnb\b.*miata|miata.*\bnb\b/i, slugPart: 'nb' },
    { pattern: /\bnc\b.*miata|miata.*\bnc\b/i, slugPart: 'nc' },
    { pattern: /\bnd\b.*miata|miata.*\bnd\b/i, slugPart: 'nd' },
    { pattern: /\b2022\b.*brz|brz.*\b2022\b/i, slugPart: 'zd8' },  // 2022+ is 2nd gen
    { pattern: /\b2nd gen\b.*brz|brz.*\b2nd gen\b/i, slugPart: 'zd8' },
    { pattern: /\bgr\s*supra\b/i, slug: 'toyota-gr-supra' },
    { pattern: /\bgr\s*86\b/i, slug: 'toyota-gr86' },
    // Model-specific patterns that should match
    { pattern: /\br8\b.*supercar|\baudi\s*r8\b/i, slugPart: 'r8' },
    { pattern: /\bbmw\s*1m\b|\b1\s*series\s*m\b/i, slugPart: '1m' },
    { pattern: /\bevo\s*8|evo\s*9|evo\s*viii|evo\s*ix/i, slugPart: 'evo' },
    { pattern: /\bgolf\s*r\b/i, slugPart: 'golf-r' },
    { pattern: /\bgti\s*mk/i, slugPart: 'gti' },
    // RS 3 should NOT match TT RS (different cars)
    { pattern: /\brs\s*3\b/i, slugPart: 'rs3' },
    { pattern: /\btt\s*rs\b/i, slugPart: 'tt-rs' },
  ];
  
  for (const gp of generationPatterns) {
    if (gp.pattern.test(title)) {
      if (gp.slug && car.slug === gp.slug) {
        return { match: true, confidence: 'high' };
      }
      if (gp.slugPart && car.slug.includes(gp.slugPart)) {
        return { match: true, confidence: 'high' };
      }
    }
  }
  
  // Check if title mentions a specific different generation
  // e.g., "991" in title should NOT match "997.2 Carrera S"
  const titleGenerations = title.match(/\b(991|997|996|987|981|718|e46|e92|f80|e39|e60|f10|f90|mk7|mk8|8v|8y|b8|b9|8j|8s|fk8|fl5|w204|w205|w212|w213)\b/gi);
  if (titleGenerations) {
    for (const gen of titleGenerations) {
      const genLower = gen.toLowerCase().replace('.', '');
      // If title specifies a generation and car slug doesn't contain it, reduce confidence
      if (!car.slug.toLowerCase().includes(genLower)) {
        // Check if it's a different generation of same model
        const sameModel = car.slug.replace(/-/g, '').includes(genLower.replace(/[.]/g, ''));
        if (!sameModel) {
          // Different model entirely, this could still match
        }
      }
    }
  }
  
  // Extract key identifiers from car name
  const carTokens = carNameLower.split(/[\s-]+/).filter(t => t.length > 1);
  
  // Count how many tokens match
  const tokenMatches = carTokens.filter(token => 
    titleLower.includes(token) && 
    // Exclude very common words
    !['the', 'and', 'for', 'with', 'new', 'review', 'test', 'drive'].includes(token)
  );
  
  // Need at least 2 significant tokens or brand + 1 unique token
  const hasBrand = titleLower.includes(carBrand);
  const uniqueTokens = tokenMatches.filter(t => t !== carBrand);
  
  if (hasBrand && uniqueTokens.length >= 1) {
    return { match: true, confidence: 'medium' };
  }
  
  if (tokenMatches.length >= 2) {
    return { match: true, confidence: 'medium' };
  }
  
  return { match: false, confidence: 'none' };
}

/**
 * Find which car a video title actually matches
 */
function findActualCarMatch(title, allCars) {
  const matches = [];
  
  for (const car of allCars) {
    const result = titleMatchesCar(title, car);
    if (result.match) {
      matches.push({ car, confidence: result.confidence });
    }
  }
  
  // Sort by confidence (high first)
  matches.sort((a, b) => {
    if (a.confidence === 'high' && b.confidence !== 'high') return -1;
    if (b.confidence === 'high' && a.confidence !== 'high') return 1;
    return 0;
  });
  
  return matches;
}

async function main() {
  log('========================================');
  log('YouTube Video-Car Mapping Audit');
  log('========================================');
  log('Options:', options);
  log('');

  // Fetch all cars
  log('Fetching cars...');
  const { data: cars, error: carsError } = await supabase
    .from('cars')
    .select('id, slug, name, brand, years')
    .order('name');
  
  if (carsError) {
    logError('Failed to fetch cars:', carsError);
    process.exit(1);
  }
  log(`Found ${cars.length} cars`);

  // Build lookup map
  const carsBySlug = {};
  for (const car of cars) {
    carsBySlug[car.slug] = car;
  }

  // Fetch all video-car links with video info
  log('Fetching video-car links...');
  const { data: links, error: linksError } = await supabase
    .from('youtube_video_car_links')
    .select(`
      video_id,
      car_slug,
      role,
      match_confidence,
      youtube_videos!inner (
        video_id,
        title,
        channel_name,
        processing_status
      )
    `)
    .order('car_slug');

  if (linksError) {
    logError('Failed to fetch links:', linksError);
    process.exit(1);
  }
  log(`Found ${links.length} video-car links`);
  log('');

  // Audit each link
  const issues = [];
  const correct = [];
  const uncertain = [];

  for (const link of links) {
    const videoTitle = link.youtube_videos?.title || '';
    const assignedCar = carsBySlug[link.car_slug];
    
    if (!assignedCar) {
      issues.push({
        type: 'missing_car',
        link,
        message: `Car slug "${link.car_slug}" not found in database`
      });
      continue;
    }

    // Check if title matches assigned car
    const assignedMatch = titleMatchesCar(videoTitle, assignedCar);
    
    // Find all possible matches
    const allMatches = findActualCarMatch(videoTitle, cars);
    
    if (!assignedMatch.match) {
      // Title doesn't match assigned car at all
      const bestMatch = allMatches[0];
      
      // Skip if best match is a sister car of assigned car
      if (bestMatch && areSisterCars(link.car_slug, bestMatch.car.slug)) {
        uncertain.push({ 
          link, 
          videoTitle, 
          assignedCar: assignedCar.name, 
          matches: allMatches,
          note: 'Sister cars - mapping acceptable'
        });
      } else {
        issues.push({
          type: 'wrong_car',
          link,
          videoTitle,
          assignedCar: assignedCar.name,
          assignedSlug: link.car_slug,
          suggestedCar: bestMatch?.car.name || 'Unknown',
          suggestedSlug: bestMatch?.car.slug || null,
          confidence: bestMatch?.confidence || 'none',
          message: `"${videoTitle.slice(0, 60)}..." assigned to ${assignedCar.name} but seems to be about ${bestMatch?.car.name || 'unknown car'}`
        });
      }
    } else if (assignedMatch.confidence === 'medium' && allMatches.length > 1) {
      // Multiple matches, might be assigned to wrong one
      const highConfidenceMatch = allMatches.find(m => m.confidence === 'high');
      
      // Don't suggest moves between sister cars
      if (highConfidenceMatch && 
          highConfidenceMatch.car.slug !== link.car_slug && 
          !areSisterCars(link.car_slug, highConfidenceMatch.car.slug)) {
        
        // Check if title year matches assigned car's years
        const titleYear = extractYear(videoTitle);
        const assignedYears = assignedCar.years || '';
        const assignedYearMatch = assignedYears.match(/(\d{4})/);
        const assignedStartYear = assignedYearMatch ? parseInt(assignedYearMatch[1], 10) : null;
        
        // If title mentions a year that matches the assigned car, keep it
        if (titleYear && assignedStartYear && 
            Math.abs(titleYear - assignedStartYear) <= 2) {
          uncertain.push({ 
            link, 
            videoTitle, 
            assignedCar: assignedCar.name, 
            matches: allMatches,
            note: `Year ${titleYear} matches assigned car`
          });
        } else {
          issues.push({
            type: 'better_match',
            link,
            videoTitle,
            assignedCar: assignedCar.name,
            assignedSlug: link.car_slug,
            suggestedCar: highConfidenceMatch.car.name,
            suggestedSlug: highConfidenceMatch.car.slug,
            confidence: highConfidenceMatch.confidence,
            message: `"${videoTitle.slice(0, 60)}..." assigned to ${assignedCar.name} but better matches ${highConfidenceMatch.car.name}`
          });
        }
      } else {
        uncertain.push({ link, videoTitle, assignedCar: assignedCar.name, matches: allMatches });
      }
    } else {
      correct.push({ link, videoTitle, assignedCar: assignedCar.name });
    }
  }

  // Report findings
  log('========================================');
  log('AUDIT RESULTS');
  log('========================================');
  log(`✅ Correct mappings:   ${correct.length}`);
  log(`⚠️ Uncertain mappings: ${uncertain.length}`);
  log(`❌ Incorrect mappings: ${issues.length}`);
  log('');

  // Show issues
  if (issues.length > 0) {
    log('========================================');
    log('INCORRECT MAPPINGS');
    log('========================================');
    
    for (const issue of issues) {
      log('');
      log(`❌ ${issue.type.toUpperCase()}`);
      log(`   Video: "${issue.videoTitle?.slice(0, 70)}..."`);
      log(`   Video ID: ${issue.link.video_id}`);
      log(`   Assigned to: ${issue.assignedCar} (${issue.assignedSlug})`);
      log(`   Should be: ${issue.suggestedCar} (${issue.suggestedSlug})`);
      log(`   Confidence: ${issue.confidence}`);
    }
  }

  // Show uncertain if verbose
  if (options.verbose && uncertain.length > 0) {
    log('');
    log('========================================');
    log('UNCERTAIN MAPPINGS');
    log('========================================');
    
    for (const item of uncertain) {
      log('');
      log(`⚠️ "${item.videoTitle?.slice(0, 70)}..."`);
      log(`   Assigned: ${item.assignedCar}`);
      log(`   Matches: ${item.matches.map(m => `${m.car.name} (${m.confidence})`).join(', ')}`);
    }
  }

  // Fix issues if requested
  if (options.fix && issues.length > 0) {
    log('');
    log('========================================');
    log('FIXING INCORRECT MAPPINGS');
    log('========================================');

    let fixed = 0;
    let deleted = 0;
    let skipped = 0;

    for (const issue of issues) {
      if (issue.type === 'missing_car') {
        // Delete orphaned links
        if (!options.dryRun) {
          await supabase
            .from('youtube_video_car_links')
            .delete()
            .eq('video_id', issue.link.video_id)
            .eq('car_slug', issue.link.car_slug);
        }
        log(`  🗑️ Deleted orphaned link for ${issue.link.video_id}`);
        deleted++;
        continue;
      }

      if (!issue.suggestedSlug) {
        log(`  ⏭️ Skipping ${issue.link.video_id} - no suggested car found`);
        skipped++;
        continue;
      }

      if (options.dryRun) {
        log(`  [DRY RUN] Would update ${issue.link.video_id}: ${issue.assignedSlug} → ${issue.suggestedSlug}`);
        fixed++;
      } else {
        // Delete old link
        const { error: deleteError } = await supabase
          .from('youtube_video_car_links')
          .delete()
          .eq('video_id', issue.link.video_id)
          .eq('car_slug', issue.link.car_slug);

        if (deleteError) {
          logError(`  Failed to delete old link:`, deleteError);
          skipped++;
          continue;
        }

        // Check if a link already exists for the correct car
        const { data: existing } = await supabase
          .from('youtube_video_car_links')
          .select('*')
          .eq('video_id', issue.link.video_id)
          .eq('car_slug', issue.suggestedSlug)
          .single();

        if (existing) {
          log(`  ✓ Link already exists for ${issue.suggestedSlug}, deleted duplicate`);
          deleted++;
          continue;
        }

        // Create new link
        const { error: insertError } = await supabase
          .from('youtube_video_car_links')
          .insert({
            video_id: issue.link.video_id,
            car_slug: issue.suggestedSlug,
            role: issue.link.role,
            match_confidence: issue.confidence === 'high' ? 0.95 : 0.8,
            match_method: 'title_audit_fix'
          });

        if (insertError) {
          logError(`  Failed to insert new link:`, insertError);
          skipped++;
          continue;
        }

        log(`  ✓ Updated ${issue.link.video_id}: ${issue.assignedSlug} → ${issue.suggestedSlug}`);
        fixed++;
      }
    }

    log('');
    log('Fix Summary:');
    log(`  Fixed:   ${fixed}`);
    log(`  Deleted: ${deleted}`);
    log(`  Skipped: ${skipped}`);
  }

  // Summary
  log('');
  log('========================================');
  log('AUDIT COMPLETE');
  log('========================================');
  
  if (issues.length > 0 && !options.fix) {
    log('');
    log('To fix issues, run with --fix flag:');
    log('  node scripts/audit-youtube-mappings.js --fix');
    log('');
    log('Or preview fixes with --dry-run:');
    log('  node scripts/audit-youtube-mappings.js --fix --dry-run');
  }
}

main().catch(error => {
  logError('Fatal error:', error);
  process.exit(1);
});
