#!/usr/bin/env node
/**
 * Enrich Existing Car
 * 
 * Adds missing data to an existing car WITHOUT recreating it.
 * This fills gaps in: issues, service intervals, fuel economy, safety data.
 * 
 * Usage:
 *   node scripts/car-pipeline/enrich-existing-car.mjs --slug bmw-m3-g80
 *   node scripts/car-pipeline/enrich-existing-car.mjs --slug bmw-m3-g80 --dry-run
 *   node scripts/car-pipeline/enrich-existing-car.mjs --slug bmw-m3-g80 --force
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { parseArgs } from 'util';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);
const anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;

const { values } = parseArgs({
  options: {
    'slug': { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    'force': { type: 'boolean', default: false },
    'verbose': { type: 'boolean', default: false },
  },
});

const slug = values['slug'];
const dryRun = values['dry-run'];
const force = values['force'];
const verbose = values['verbose'];

if (!slug) {
  console.error('Usage: node enrich-existing-car.mjs --slug <car-slug>');
  process.exit(1);
}

const QUALITY_THRESHOLDS = {
  issues: 3,
  intervals: 5,
};

/**
 * Research known issues using Claude
 */
async function researchKnownIssues(car) {
  if (!anthropic) {
    console.log('   ⚠️  No Anthropic API key - skipping issues research');
    return [];
  }

  console.log('   🔬 Researching known issues with Claude...');

  const prompt = `Research the most common problems, issues, and reliability concerns for the ${car.name} (${car.years}).

Return a JSON array of issues. Each issue should have:
- title: Short descriptive title
- kind: One of "mechanical", "electrical", "body", "interior", "drivetrain", "suspension", "cooling", "fuel", "other"
- severity: "low", "medium", "high", or "critical"
- affected_years_text: e.g., "2015-2018" or "All years"
- description: Detailed description of the issue
- symptoms: Array of common symptoms
- prevention: How to prevent or detect early
- fix_description: How to fix
- estimated_cost_text: e.g., "$500-$1500" or "Warranty covered"

Focus on well-documented issues from forums, TSBs, and owner reports. Include 5-15 issues depending on how problematic the car is.

Return ONLY valid JSON array, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('   ⚠️  Could not parse issues response');
      return [];
    }

    const issues = JSON.parse(jsonMatch[0]);
    console.log(`   ✅ Found ${issues.length} issues`);
    return issues;
  } catch (error) {
    console.log(`   ⚠️  Issues research failed: ${error.message}`);
    return [];
  }
}

/**
 * Research service intervals using Claude
 */
async function researchServiceIntervals(car) {
  if (!anthropic) {
    console.log('   ⚠️  No Anthropic API key - skipping intervals research');
    return [];
  }

  console.log('   🔬 Researching service intervals with Claude...');

  const prompt = `Research the recommended maintenance schedule for the ${car.name} (${car.years}).

Return a JSON array of service intervals. Each should have:
- service_name: Name of the service (e.g., "Oil Change", "Brake Fluid Flush")
- service_description: What's involved
- interval_miles: Miles between service (number or null)
- interval_months: Months between service (number or null)
- is_critical: true/false
- dealer_cost_low: Typical dealer cost low estimate (number)
- dealer_cost_high: Typical dealer cost high estimate (number)
- diy_cost_low: DIY cost low (number)
- diy_cost_high: DIY cost high (number)
- notes: Any special notes

Include all major services: oil changes, transmission service, brake fluid, coolant, spark plugs, timing belt/chain (if applicable), differential fluid, etc.

Return ONLY valid JSON array, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log('   ⚠️  Could not parse intervals response');
      return [];
    }

    const intervals = JSON.parse(jsonMatch[0]);
    console.log(`   ✅ Found ${intervals.length} service intervals`);
    return intervals;
  } catch (error) {
    console.log(`   ⚠️  Intervals research failed: ${error.message}`);
    return [];
  }
}

/**
 * Main enrichment function
 */
async function enrichCar() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              ENRICH EXISTING CAR                                              ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Fetch car
  const { data: car, error: carError } = await supabase
    .from('cars')
    .select('id, slug, name, brand, years, hp, torque')
    .eq('slug', slug)
    .single();

  if (carError || !car) {
    console.error(`❌ Car not found: ${slug}`);
    process.exit(1);
  }

  console.log(`🚗 ${car.name} (${car.years})`);
  console.log(`   ID: ${car.id}`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  // Check current data
  const [issuesResult, intervalsResult, fuelResult, safetyResult] = await Promise.all([
    supabase.from('car_issues').select('id').eq('car_id', car.id),
    supabase.from('vehicle_service_intervals').select('id').eq('car_id', car.id),
    supabase.from('car_fuel_economy').select('id').eq('car_id', car.id),
    supabase.from('car_safety_data').select('id').eq('car_id', car.id),
  ]);

  const currentIssues = issuesResult.data?.length || 0;
  const currentIntervals = intervalsResult.data?.length || 0;
  const hasFuel = (fuelResult.data?.length || 0) > 0;
  const hasSafety = (safetyResult.data?.length || 0) > 0;

  console.log('CURRENT DATA');
  console.log('─────────────────────────────────────────────────────────────────────────────────');
  console.log(`   Known issues:      ${currentIssues} ${currentIssues < QUALITY_THRESHOLDS.issues ? '⚠️' : '✅'}`);
  console.log(`   Service intervals: ${currentIntervals} ${currentIntervals < QUALITY_THRESHOLDS.intervals ? '⚠️' : '✅'}`);
  console.log(`   Fuel economy:      ${hasFuel ? '✅' : '⚠️'}`);
  console.log(`   Safety data:       ${hasSafety ? '✅' : '⚠️'}`);
  console.log('');

  const needsIssues = force || currentIssues < QUALITY_THRESHOLDS.issues;
  const needsIntervals = force || currentIntervals < QUALITY_THRESHOLDS.intervals;

  if (!needsIssues && !needsIntervals && !force) {
    console.log('✅ Car data is already good quality. Use --force to re-enrich anyway.');
    return;
  }

  console.log('ENRICHMENT');
  console.log('─────────────────────────────────────────────────────────────────────────────────');

  // Research and add issues
  if (needsIssues) {
    const issues = await researchKnownIssues(car);
    
    if (issues.length > 0 && !dryRun) {
      // Add car_id to each issue
      const issuesWithCarId = issues.map(issue => ({
        ...issue,
        car_id: car.id,
        symptoms: Array.isArray(issue.symptoms) ? issue.symptoms : [issue.symptoms].filter(Boolean),
      }));

      const { error: insertError } = await supabase
        .from('car_issues')
        .insert(issuesWithCarId);

      if (insertError) {
        console.log(`   ❌ Failed to insert issues: ${insertError.message}`);
      } else {
        console.log(`   ✅ Added ${issues.length} issues to database`);
      }
    } else if (dryRun) {
      console.log(`   [DRY RUN] Would add ${issues.length} issues`);
    }
  }

  // Research and add service intervals
  if (needsIntervals) {
    const intervals = await researchServiceIntervals(car);
    
    if (intervals.length > 0 && !dryRun) {
      const intervalsWithCarId = intervals.map(interval => ({
        ...interval,
        car_id: car.id,
      }));

      const { error: insertError } = await supabase
        .from('vehicle_service_intervals')
        .insert(intervalsWithCarId);

      if (insertError) {
        console.log(`   ❌ Failed to insert intervals: ${insertError.message}`);
      } else {
        console.log(`   ✅ Added ${intervals.length} service intervals to database`);
      }
    } else if (dryRun) {
      console.log(`   [DRY RUN] Would add ${intervals.length} intervals`);
    }
  }

  // Try EPA/NHTSA APIs for fuel and safety
  if (!hasFuel || !hasSafety) {
    console.log('   📡 Fetching EPA/NHTSA data via APIs...');
    
    // These are handled by the existing API endpoints
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    if (!hasFuel) {
      try {
        const response = await fetch(`${baseUrl}/api/cars/${slug}/fuel-economy`);
        if (response.ok) {
          console.log('   ✅ EPA fuel economy data fetched');
        }
      } catch (e) {
        if (verbose) console.log(`   ⚠️  EPA fetch failed: ${e.message}`);
      }
    }
    
    if (!hasSafety) {
      try {
        const response = await fetch(`${baseUrl}/api/cars/${slug}/safety-ratings`);
        if (response.ok) {
          console.log('   ✅ NHTSA safety data fetched');
        }
      } catch (e) {
        if (verbose) console.log(`   ⚠️  NHTSA fetch failed: ${e.message}`);
      }
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('ENRICHMENT COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════════════════');

  // Show final counts
  if (!dryRun) {
    const [finalIssues, finalIntervals] = await Promise.all([
      supabase.from('car_issues').select('id').eq('car_id', car.id),
      supabase.from('vehicle_service_intervals').select('id').eq('car_id', car.id),
    ]);

    console.log(`   Issues:    ${currentIssues} → ${finalIssues.data?.length || 0}`);
    console.log(`   Intervals: ${currentIntervals} → ${finalIntervals.data?.length || 0}`);
  }
  console.log('');
}

enrichCar().catch(console.error);
