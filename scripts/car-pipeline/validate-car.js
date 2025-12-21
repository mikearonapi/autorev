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

// Load environment variables
config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
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
        .select('id, slug, name, hp, torque, price_avg, zero_to_sixty, image_hero_url')
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
      if (!car.price_avg) missing.push('price_avg');
      if (!car.zero_to_sixty) missing.push('zero_to_sixty');
      
      if (missing.length > 0) {
        return { pass: false, message: `Missing: ${missing.join(', ')}` };
      }
      
      return { pass: true };
    },
    fixHint: 'Update cars table with missing performance/pricing data',
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
    async check(slug) {
      const { data, error } = await supabase
        .from('car_fuel_economy')
        .select('car_slug, city_mpg, highway_mpg, combined_mpg')
        .eq('car_slug', slug)
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
    async check(slug) {
      const { data, error } = await supabase
        .from('car_safety_data')
        .select('car_slug, nhtsa_overall_rating, safety_score')
        .eq('car_slug', slug)
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
    async check(slug) {
      const { data, error } = await supabase
        .from('vehicle_maintenance_specs')
        .select('car_slug, oil_type, oil_viscosity, oil_capacity_liters')
        .eq('car_slug', slug)
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
    async check(slug) {
      const { data, error } = await supabase
        .from('car_issues')
        .select('id, title')
        .eq('car_slug', slug);
      
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
    async check(slug) {
      const { data, error } = await supabase
        .from('vehicle_service_intervals')
        .select('id, service_name')
        .eq('car_slug', slug);
      
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
    async check(slug) {
      // First get car ID
      const { data: car } = await supabase
        .from('cars')
        .select('id')
        .eq('slug', slug)
        .single();
      
      if (!car) {
        return { pass: false, message: 'Car not found' };
      }
      
      const { data, error } = await supabase
        .from('youtube_video_car_links')
        .select('id, video_id')
        .eq('car_id', car.id);
      
      if (error) {
        return { pass: false, message: 'Could not fetch video links' };
      }
      
      const count = data?.length || 0;
      if (count < 2) {
        return { pass: false, message: `Only ${count} videos (recommend at least 2)` };
      }
      
      return { pass: true, data: { count } };
    },
    fixHint: 'Queue videos in youtube_ingestion_queue or wait for weekly cron',
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

