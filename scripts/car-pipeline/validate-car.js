#!/usr/bin/env node

/**
 * Car Validation Script
 * 
 * Runs validation queries and reports missing data.
 * 
 * Usage:
 *   node scripts/car-pipeline/validate-car.js <car-slug> [options]
 * 
 * Options:
 *   --verbose       Show detailed output
 *   --json          Output results as JSON
 *   --fix-hints     Show hints for fixing issues
 * 
 * Exit codes:
 *   0 - All checks pass
 *   1 - Issues found or error occurred
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        let value = valueParts.join('=');
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (key && value) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Make sure .env.local exists in the project root');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const carSlug = args.find(arg => !arg.startsWith('--'));
const flags = {
  verbose: args.includes('--verbose'),
  json: args.includes('--json'),
  fixHints: args.includes('--fix-hints'),
};

if (!carSlug) {
  console.error('Usage: node validate-car.js <car-slug> [options]');
  console.error('\nOptions:');
  console.error('  --verbose       Show detailed output');
  console.error('  --json          Output results as JSON');
  console.error('  --fix-hints     Show hints for fixing issues');
  process.exit(1);
}

// Validation checks
const CHECKS = [
  {
    id: 'car_exists',
    name: 'Car Exists',
    category: 'core',
    severity: 'critical',
    async check(slug) {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error || !data) {
        return { pass: false, message: 'Car not found in database' };
      }
      
      return { pass: true, data };
    },
    fixHint: 'Insert car into cars table using SQL template from CAR_PIPELINE.md',
  },
  {
    id: 'required_fields',
    name: 'Required Fields',
    category: 'core',
    severity: 'critical',
    async check(slug, context) {
      const car = context.car_exists?.data;
      if (!car) return { pass: false, message: 'No car data' };
      
      const missing = [];
      if (!car.hp) missing.push('hp');
      if (!car.torque) missing.push('torque');
      if (!car.price_avg && !car.price_range) missing.push('price_avg or price_range');
      if (!car.zero_to_sixty) missing.push('zero_to_sixty');
      if (!car.engine) missing.push('engine');
      if (!car.drivetrain) missing.push('drivetrain');
      if (!car.trans) missing.push('trans');
      if (!car.brand) missing.push('brand');
      if (!car.years) missing.push('years');
      
      if (missing.length > 0) {
        return { pass: false, message: `Missing: ${missing.join(', ')}` };
      }
      
      return { pass: true };
    },
    fixHint: 'Update cars table with missing performance/pricing data',
  },
  {
    id: 'editorial_arrays',
    name: 'Editorial Arrays Populated',
    category: 'editorial',
    severity: 'warning',
    async check(slug, context) {
      const car = context.car_exists?.data;
      if (!car) return { pass: false, message: 'No car data' };
      
      const issues = [];
      
      // Check simple arrays
      if (!car.pros || car.pros.length === 0) issues.push('pros (empty)');
      if (!car.cons || car.cons.length === 0) issues.push('cons (empty)');
      if (!car.best_for || car.best_for.length === 0) issues.push('best_for (empty)');
      
      // Check object arrays
      if (!car.defining_strengths || car.defining_strengths.length === 0) {
        issues.push('defining_strengths (empty)');
      } else if (typeof car.defining_strengths[0] === 'string') {
        issues.push('defining_strengths (wrong format - should be {title, description})');
      }
      
      if (!car.honest_weaknesses || car.honest_weaknesses.length === 0) {
        issues.push('honest_weaknesses (empty)');
      } else if (typeof car.honest_weaknesses[0] === 'string') {
        issues.push('honest_weaknesses (wrong format - should be {title, description})');
      }
      
      if (issues.length > 0) {
        return { pass: false, message: issues.join('; ') };
      }
      
      return { pass: true, data: { 
        pros: car.pros?.length || 0,
        cons: car.cons?.length || 0,
        strengths: car.defining_strengths?.length || 0,
        weaknesses: car.honest_weaknesses?.length || 0
      }};
    },
    fixHint: 'Run AI scoring phase or manually populate editorial arrays',
  },
  {
    id: 'buying_guide',
    name: 'Buying Guide Content',
    category: 'editorial',
    severity: 'warning',
    async check(slug, context) {
      const car = context.car_exists?.data;
      if (!car) return { pass: false, message: 'No car data' };
      
      const missing = [];
      if (!car.buyers_summary) missing.push('buyers_summary');
      if (!car.best_years_detailed || car.best_years_detailed.length === 0) missing.push('best_years_detailed');
      if (!car.must_have_options || car.must_have_options.length === 0) missing.push('must_have_options');
      if (!car.pre_inspection_checklist || car.pre_inspection_checklist.length === 0) missing.push('pre_inspection_checklist');
      
      if (missing.length > 0) {
        return { pass: false, message: `Missing: ${missing.join(', ')}` };
      }
      
      return { pass: true };
    },
    fixHint: 'Run AI editorial phase to generate buying guide content',
  },
  {
    id: 'ownership_info',
    name: 'Ownership Information',
    category: 'editorial',
    severity: 'info',
    async check(slug, context) {
      const car = context.car_exists?.data;
      if (!car) return { pass: false, message: 'No car data' };
      
      const missing = [];
      if (!car.track_readiness) missing.push('track_readiness');
      if (!car.community_strength) missing.push('community_strength');
      if (!car.diy_friendliness) missing.push('diy_friendliness');
      if (!car.parts_availability) missing.push('parts_availability');
      
      if (missing.length > 0) {
        return { pass: false, message: `Missing: ${missing.join(', ')}` };
      }
      
      return { pass: true };
    },
    fixHint: 'Add ownership info from AI editorial or manual research',
  },
  {
    id: 'hero_image',
    name: 'Hero Image',
    category: 'media',
    severity: 'warning',
    async check(slug, context) {
      const car = context.car_exists?.data;
      if (!car) return { pass: false, message: 'No car data' };
      
      if (!car.image_hero_url) {
        return { pass: false, message: 'No hero image URL' };
      }
      
      return { pass: true, data: { url: car.image_hero_url } };
    },
    fixHint: 'Upload image to Vercel Blob and update image_hero_url column',
  },
  {
    id: 'scores',
    name: 'All 7 Scores',
    category: 'editorial',
    severity: 'warning',
    async check(slug) {
      const { data, error } = await supabase
        .from('cars')
        .select('score_sound, score_interior, score_track, score_reliability, score_value, score_driver_fun, score_aftermarket')
        .eq('slug', slug)
        .single();
      
      if (error || !data) {
        return { pass: false, message: 'Could not fetch scores' };
      }
      
      const missing = [];
      const scores = ['score_sound', 'score_interior', 'score_track', 'score_reliability', 'score_value', 'score_driver_fun', 'score_aftermarket'];
      
      scores.forEach(s => {
        if (data[s] === null || data[s] === undefined) {
          missing.push(s);
        }
      });
      
      if (missing.length > 0) {
        return { pass: false, message: `Missing scores: ${missing.join(', ')}` };
      }
      
      return { pass: true, data };
    },
    fixHint: 'Assign scores using the rubric in CAR_PIPELINE.md Phase 5',
  },
  {
    id: 'fuel_economy',
    name: 'Fuel Economy Data',
    category: 'enrichment',
    severity: 'warning',
    async check(slug, context) {
      // NOTE: car_slug column was removed from car_fuel_economy (2026-01-11), use car_id
      const carId = context.car_exists?.data?.id;
      if (!carId) return { pass: false, message: 'No car_id available' };
      
      const { data, error } = await supabase
        .from('car_fuel_economy')
        .select('car_id, city_mpg, highway_mpg, combined_mpg')
        .eq('car_id', carId)
        .single();
      
      if (error || !data) {
        return { pass: false, message: 'No fuel economy data' };
      }
      
      return { pass: true, data };
    },
    fixHint: 'Run: node scripts/car-pipeline/enrich-car.js <slug> --epa-only',
  },
  {
    id: 'safety_data',
    name: 'Safety Data',
    category: 'enrichment',
    severity: 'warning',
    async check(slug, context) {
      // NOTE: car_slug column was removed from car_safety_data (2026-01-11), use car_id
      const carId = context.car_exists?.data?.id;
      if (!carId) return { pass: false, message: 'No car_id available' };
      
      const { data, error } = await supabase
        .from('car_safety_data')
        .select('car_id, nhtsa_overall_rating, safety_score')
        .eq('car_id', carId)
        .single();
      
      if (error || !data) {
        return { pass: false, message: 'No safety data' };
      }
      
      return { pass: true, data };
    },
    fixHint: 'Run: node scripts/car-pipeline/enrich-car.js <slug> --safety-only',
  },
  {
    id: 'maintenance_specs',
    name: 'Maintenance Specs',
    category: 'research',
    severity: 'warning',
    async check(slug, context) {
      // NOTE: car_slug column was removed from vehicle_maintenance_specs (2026-01-11), use car_id
      const carId = context.car_exists?.data?.id;
      if (!carId) return { pass: false, message: 'No car_id available' };
      
      const { data, error } = await supabase
        .from('vehicle_maintenance_specs')
        .select('car_id, oil_type, oil_viscosity, oil_capacity_liters')
        .eq('car_id', carId)
        .single();
      
      if (error || !data) {
        return { pass: false, message: 'No maintenance specs' };
      }
      
      return { pass: true, data };
    },
    fixHint: 'Add maintenance specs using template from CAR_PIPELINE.md Phase 4',
  },
  {
    id: 'known_issues',
    name: 'Known Issues (min 3)',
    category: 'research',
    severity: 'warning',
    async check(slug, context) {
      // NOTE: car_slug column was removed from car_issues (2026-01-11), use car_id
      const carId = context.car_exists?.data?.id;
      if (!carId) return { pass: false, message: 'No car_id available' };
      
      const { data, error } = await supabase
        .from('car_issues')
        .select('id, title')
        .eq('car_id', carId);
      
      if (error) {
        return { pass: false, message: 'Could not fetch issues' };
      }
      
      const count = data?.length || 0;
      if (count < 3) {
        return { pass: false, message: `Only ${count} issues (need at least 3)` };
      }
      
      return { pass: true, data: { count, issues: data } };
    },
    fixHint: 'Research and add issues using car_issues INSERT template',
  },
  {
    id: 'service_intervals',
    name: 'Service Intervals (min 5)',
    category: 'research',
    severity: 'warning',
    async check(slug, context) {
      // NOTE: car_slug column was removed from vehicle_service_intervals (2026-01-11), use car_id
      const carId = context.car_exists?.data?.id;
      if (!carId) return { pass: false, message: 'No car_id available' };
      
      const { data, error } = await supabase
        .from('vehicle_service_intervals')
        .select('id, service_name')
        .eq('car_id', carId);
      
      if (error) {
        return { pass: false, message: 'Could not fetch intervals' };
      }
      
      const count = data?.length || 0;
      if (count < 5) {
        return { pass: false, message: `Only ${count} intervals (need at least 5)` };
      }
      
      return { pass: true, data: { count, intervals: data } };
    },
    fixHint: 'Add service intervals using vehicle_service_intervals INSERT template',
  },
  {
    id: 'youtube_videos',
    name: 'YouTube Videos',
    category: 'content',
    severity: 'info',
    async check(slug, context) {
      // NOTE: car_slug column was removed from youtube_video_car_links (2026-01-11), use car_id
      const carId = context.car_exists?.data?.id;
      if (!carId) return { pass: false, message: 'No car_id available' };
      
      const { data, error } = await supabase
        .from('youtube_video_car_links')
        .select('id, video_id')
        .eq('car_id', carId);
      
      if (error) {
        return { pass: false, message: 'Could not fetch video links' };
      }
      
      const count = data?.length || 0;
      if (count < 2) {
        return { pass: false, message: `Only ${count} videos (recommend at least 2)` };
      }
      
      return { pass: true, data: { count } };
    },
    fixHint: 'Run YouTube discovery: node scripts/youtube-discovery.js --car-slug <slug>',
  },
  {
    id: 'youtube_video_relevance',
    name: 'YouTube Video Relevance',
    category: 'content',
    severity: 'warning',
    async check(slug, context) {
      // NOTE: car_slug column was removed from youtube_video_car_links (2026-01-11), use car_id
      const car = context.car_exists?.data;
      if (!car) {
        return { pass: false, message: 'Car not found' };
      }
      
      // Get linked videos using car_id
      const { data: links } = await supabase
        .from('youtube_video_car_links')
        .select('video_id')
        .eq('car_id', car.id);
      
      if (!links || links.length === 0) {
        return { pass: true, message: 'No videos to check' };
      }
      
      const videoIds = links.map(l => l.video_id);
      const { data: videos } = await supabase
        .from('youtube_videos')
        .select('video_id, title')
        .in('video_id', videoIds);
      
      if (!videos) {
        return { pass: false, message: 'Could not fetch video details' };
      }
      
      // Extract model designation from car name (e.g., "DB9" from "Aston Martin DB9")
      const carNameLower = car.name.toLowerCase();
      const brandLower = (car.brand || '').toLowerCase();
      
      // Try to extract model code (DB9, RS7, M3, 911, etc.)
      const modelMatch = car.name.match(/\b([A-Z]{1,3}\d{1,3}[A-Z]?|\d{3}[A-Z]?)\b/i);
      const modelCode = modelMatch ? modelMatch[1].toLowerCase() : null;
      
      // Check each video title for relevance
      const suspicious = [];
      for (const video of videos) {
        const titleLower = (video.title || '').toLowerCase();
        
        // Must contain either full car name OR (brand + model code)
        const hasFullName = titleLower.includes(carNameLower);
        const hasModelCode = modelCode && titleLower.includes(modelCode);
        const hasBrand = titleLower.includes(brandLower);
        
        if (!hasFullName && !(hasBrand && hasModelCode)) {
          suspicious.push(video.title?.substring(0, 50) + '...');
        }
      }
      
      if (suspicious.length > 0) {
        return { 
          pass: false, 
          message: `${suspicious.length} video(s) may not be about ${car.name}: ${suspicious[0]}`,
          data: { suspiciousCount: suspicious.length }
        };
      }
      
      return { pass: true, data: { checked: videos.length } };
    },
    fixHint: 'Check video titles match car model. Remove incorrect links with SQL DELETE from youtube_video_car_links',
  },
  {
    id: 'youtube_transcripts',
    name: 'YouTube Transcripts',
    category: 'content',
    severity: 'info',
    async check(slug, context) {
      // NOTE: car_slug column was removed from youtube_video_car_links (2026-01-11), use car_id
      const carId = context.car_exists?.data?.id;
      if (!carId) return { pass: false, message: 'No car_id available' };
      
      const { data: links } = await supabase
        .from('youtube_video_car_links')
        .select('video_id')
        .eq('car_id', carId);
      
      if (!links || links.length === 0) {
        return { pass: false, message: 'No videos linked' };
      }
      
      const videoIds = links.map(l => l.video_id);
      const { data: videos } = await supabase
        .from('youtube_videos')
        .select('video_id, processing_status, transcript_text')
        .in('video_id', videoIds);
      
      const withTranscripts = videos?.filter(v => v.transcript_text) || [];
      const processed = videos?.filter(v => v.processing_status === 'processed') || [];
      
      if (withTranscripts.length === 0) {
        return { pass: false, message: 'No videos have transcripts' };
      }
      
      return { 
        pass: true, 
        data: { 
          total: links.length, 
          withTranscripts: withTranscripts.length,
          aiProcessed: processed.length
        } 
      };
    },
    fixHint: 'Run: node scripts/youtube-transcripts.js && node scripts/youtube-ai-processing.js',
  },
  {
    id: 'recalls_data',
    name: 'Recalls Data',
    category: 'enrichment',
    severity: 'info',
    async check(slug, context) {
      // NOTE: car_slug column was removed from car_recalls (2026-01-11), use car_id
      const carId = context.car_exists?.data?.id;
      if (!carId) return { pass: false, message: 'No car_id available' };
      
      const { data, error } = await supabase
        .from('car_recalls')
        .select('id, recall_campaign_number')
        .eq('car_id', carId);
      
      // It's OK if there are no recalls - many cars don't have any
      if (error) {
        return { pass: false, message: `Could not fetch recalls: ${error.message}` };
      }
      
      const count = data?.length || 0;
      return { 
        pass: true, 
        data: { count },
        message: count === 0 ? 'No recalls found (may be normal)' : `${count} recalls documented`
      };
    },
    fixHint: 'Recalls are fetched automatically via enrichment API',
  },
  {
    id: 'competitors',
    name: 'Competitors & Alternatives',
    category: 'editorial',
    severity: 'info',
    async check(slug, context) {
      const car = context.car_exists?.data;
      if (!car) return { pass: false, message: 'No car data' };
      
      const missing = [];
      if (!car.direct_competitors || car.direct_competitors.length === 0) missing.push('direct_competitors');
      if (!car.if_you_want_more || car.if_you_want_more.length === 0) missing.push('if_you_want_more');
      if (!car.if_you_want_less || car.if_you_want_less.length === 0) missing.push('if_you_want_less');
      
      if (missing.length > 0) {
        return { pass: false, message: `Missing: ${missing.join(', ')}` };
      }
      
      // Check format
      if (typeof car.direct_competitors[0] === 'string') {
        return { pass: false, message: 'direct_competitors in wrong format (should be objects)' };
      }
      
      return { pass: true, data: {
        competitors: car.direct_competitors?.length || 0,
        moreOptions: car.if_you_want_more?.length || 0,
        lessOptions: car.if_you_want_less?.length || 0
      }};
    },
    fixHint: 'Run AI editorial to populate competitor comparisons',
  },
  {
    id: 'variants',
    name: 'Car Variants',
    category: 'research',
    severity: 'info',
    async check(slug) {
      const { data: car } = await supabase
        .from('cars')
        .select('id')
        .eq('slug', slug)
        .single();
      
      if (!car) {
        return { pass: false, message: 'Car not found' };
      }
      
      const { data, error } = await supabase
        .from('car_variants')
        .select('id, variant_key, display_name')
        .eq('car_id', car.id);
      
      if (error) {
        return { pass: false, message: 'Could not fetch variants' };
      }
      
      const count = data?.length || 0;
      if (count === 0) {
        return { pass: false, message: 'No variants defined' };
      }
      
      return { pass: true, data: { count, variants: data } };
    },
    fixHint: 'Add car variants for year/trim combinations',
  },
];

/**
 * Run all validation checks
 */
async function runValidation(slug) {
  const results = {
    slug,
    timestamp: new Date().toISOString(),
    checks: [],
    summary: {
      total: CHECKS.length,
      passed: 0,
      failed: 0,
      warnings: 0,
    },
  };
  
  const context = {};
  
  for (const check of CHECKS) {
    try {
      const result = await check.check(slug, context);
      context[check.id] = result;
      
      results.checks.push({
        id: check.id,
        name: check.name,
        category: check.category,
        severity: check.severity,
        pass: result.pass,
        message: result.message,
        data: flags.verbose ? result.data : undefined,
        fixHint: !result.pass && flags.fixHints ? check.fixHint : undefined,
      });
      
      if (result.pass) {
        results.summary.passed++;
      } else if (check.severity === 'critical') {
        results.summary.failed++;
      } else {
        results.summary.warnings++;
      }
    } catch (err) {
      results.checks.push({
        id: check.id,
        name: check.name,
        category: check.category,
        severity: check.severity,
        pass: false,
        message: `Error: ${err.message}`,
      });
      results.summary.failed++;
    }
  }
  
  return results;
}

/**
 * Print results
 */
function printResults(results) {
  if (flags.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }
  
  console.log('');
  console.log('🔍 Car Validation Report');
  console.log('========================');
  console.log(`Car: ${results.slug}`);
  console.log(`Time: ${results.timestamp}`);
  console.log('');
  
  // Group by category
  const byCategory = {};
  results.checks.forEach(check => {
    if (!byCategory[check.category]) {
      byCategory[check.category] = [];
    }
    byCategory[check.category].push(check);
  });
  
  const categoryOrder = ['core', 'enrichment', 'research', 'editorial', 'media', 'content'];
  const categoryNames = {
    core: '📋 Core Data',
    enrichment: '🔄 Enrichment',
    research: '🔬 Research',
    editorial: '✍️ Editorial',
    media: '🖼️ Media',
    content: '📺 Content',
  };
  
  categoryOrder.forEach(cat => {
    const checks = byCategory[cat];
    if (!checks) return;
    
    console.log(categoryNames[cat] || cat);
    console.log('-'.repeat(40));
    
    checks.forEach(check => {
      const icon = check.pass ? '✅' : (check.severity === 'critical' ? '❌' : '⚠️');
      console.log(`${icon} ${check.name}`);
      
      if (!check.pass && check.message) {
        console.log(`   ${check.message}`);
      }
      
      if (check.fixHint) {
        console.log(`   💡 ${check.fixHint}`);
      }
      
      if (flags.verbose && check.data) {
        console.log(`   Data: ${JSON.stringify(check.data)}`);
      }
    });
    
    console.log('');
  });
  
  // Summary
  console.log('📊 Summary');
  console.log('-'.repeat(40));
  console.log(`Total Checks: ${results.summary.total}`);
  console.log(`Passed:       ${results.summary.passed} ✅`);
  console.log(`Warnings:     ${results.summary.warnings} ⚠️`);
  console.log(`Failed:       ${results.summary.failed} ❌`);
  console.log('');
  
  // Final status
  if (results.summary.failed === 0 && results.summary.warnings === 0) {
    console.log('✅ All checks passed!');
  } else if (results.summary.failed === 0) {
    console.log('⚠️ Passed with warnings');
  } else {
    console.log('❌ Validation failed');
  }
}

/**
 * Main execution
 */
async function main() {
  const results = await runValidation(carSlug);
  printResults(results);
  
  // Exit code based on results
  if (results.summary.failed > 0) {
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

