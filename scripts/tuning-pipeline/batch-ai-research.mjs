#!/usr/bin/env node
/**
 * Batch AI Research for Tuning Profiles
 * 
 * Processes multiple cars through AI-powered tuning research to populate:
 * - upgrades_by_objective (power, handling, braking, cooling, sound, aero)
 * - platform_insights (strengths, weaknesses, community_tips)
 * - tuning_platforms
 * - power_limits
 * 
 * Usage:
 *   node scripts/tuning-pipeline/batch-ai-research.mjs --tier 1 --dry-run
 *   node scripts/tuning-pipeline/batch-ai-research.mjs --tier 1 --limit 5
 *   node scripts/tuning-pipeline/batch-ai-research.mjs --slugs camaro-ss-1le,corvette-c5-z06
 *   node scripts/tuning-pipeline/batch-ai-research.mjs --missing --limit 20
 * 
 * Options:
 *   --tier <1|2|3>    Process cars from priority tier
 *   --slugs <list>    Comma-separated list of car slugs
 *   --missing         Process cars missing upgrade data
 *   --limit <n>       Max cars to process (default: 10)
 *   --delay <ms>      Delay between cars in ms (default: 5000)
 *   --dry-run         Don't write to DB
 *   --verbose         Show detailed output
 * 
 * @module scripts/tuning-pipeline/batch-ai-research
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

if (!anthropicKey) {
  console.error('❌ Missing ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);
const anthropic = new Anthropic({ apiKey: anthropicKey });

// Priority car tiers based on popularity + aftermarket potential
const TIER_1_SLUGS = [
  'camaro-ss-1le',
  'chevrolet-corvette-c5-z06',
  'dodge-charger-srt-392',
  'chevrolet-camaro-ss-ls1',
  'chevrolet-corvette-c6-grand-sport',
  'bmw-z4m-e85-e86',
  'chevrolet-corvette-c6-z06',
  'ford-focus-rs',
  'audi-s4-b6',
  'bmw-m3-e36',
  'audi-s5-b9',
  'bmw-m3-e46',
  'bmw-m5-e39',
  'audi-s4-b8',
  'bmw-m5-e60',
  'chevrolet-corvette-z06-c8',
  'audi-s4-b7',
  'honda-s2000',
  'ford-mustang-svt-cobra-sn95',
  'bmw-m4-f82',
];

const TIER_2_SLUGS = [
  'dodge-challenger-srt-392',
  'nissan-350z',
  'mazda-mx5-miata-nb',
  'lotus-elise-s2',
  'dodge-viper',
  'bmw-m5-f90-competition',
  'mazda-rx7-fd3s',
  'toyota-gr86',
  'toyota-supra-a90',
  'hyundai-elantra-n',
  'subaru-brz-gen2',
  'bmw-m2-g87',
  'nissan-z-z34',
  'honda-civic-type-r-fl5',
  'ford-mustang-gt-s650',
];

const TIER_3_SLUGS = [
  'porsche-cayman-gt4-981',
  'alfa-romeo-4c',
  'lexus-lc500',
  'maserati-granturismo',
  'jaguar-f-type-r',
  'genesis-g70',
  'kia-stinger-gt',
  'infiniti-q60-red-sport',
  'acura-nsx-nc1',
  'aston-martin-v8-vantage',
];

// Parse CLI args
const { values } = parseArgs({
  options: {
    'tier': { type: 'string' },
    'slugs': { type: 'string' },
    'missing': { type: 'boolean', default: false },
    'limit': { type: 'string', default: '10' },
    'delay': { type: 'string', default: '5000' },
    'dry-run': { type: 'boolean', default: false },
    'verbose': { type: 'boolean', default: false },
  },
});

const tier = values['tier'];
const slugsArg = values['slugs'];
const findMissing = values['missing'];
const limit = parseInt(values['limit'], 10);
const delay = parseInt(values['delay'], 10);
const dryRun = values['dry-run'];
const verbose = values['verbose'];

/**
 * Research tuning upgrades using Claude
 */
async function researchTuningUpgrades(car) {
  const prompt = `You are an automotive tuning expert. Research the most popular and effective aftermarket upgrades for the ${car.name} (${car.years}).

The car has these stock specs:
- HP: ${car.hp || 'unknown'}
- Torque: ${car.torque || 'unknown'}
- Engine: ${car.engine || 'unknown'}
- Drivetrain: ${car.drivetrain || 'unknown'}

Return a JSON object with upgrades organized by objective. Each upgrade should include:
- name: Upgrade name (e.g., "Cold Air Intake", "Coilover Suspension")
- gains: Expected gains (e.g., { "hp": { "low": 5, "high": 15 } } or { "handling": "improved" })
- cost: Price range (e.g., { "low": 300, "high": 600 })
- difficulty: "easy", "moderate", "advanced", or "professional"
- brands: Array of 2-4 recommended brands that actually make parts for this car
- notes: Any important notes specific to this platform

Structure the response as:
{
  "power": [...],      // Engine/power upgrades (intake, exhaust, tune, turbo, etc.)
  "handling": [...],   // Suspension, chassis, wheels
  "braking": [...],    // Brake upgrades
  "cooling": [...],    // Cooling system upgrades
  "sound": [...],      // Exhaust sound improvements
  "aero": [...]        // Aerodynamic upgrades
}

Include 3-8 upgrades per category that are REALISTIC and POPULAR for this specific car.
Only include upgrades that are actually available and commonly done on this platform.
Be specific with brands - only list brands that actually make parts for this car.

Return ONLY valid JSON, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return null;
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.log(`   ❌ Upgrade research failed: ${error.message}`);
    return null;
  }
}

/**
 * Research platform insights using Claude
 */
async function researchPlatformInsights(car) {
  const prompt = `You are an automotive expert. Provide platform insights for the ${car.name} (${car.years}).

This car has:
- Engine: ${car.engine || 'unknown'}
- HP: ${car.hp || 'unknown'}
- Drivetrain: ${car.drivetrain || 'unknown'}

Return a JSON object with:
{
  "strengths": ["strength 1", "strength 2", ...],  // 3-5 platform strengths (be specific to this car)
  "weaknesses": ["weakness 1", "weakness 2", ...], // 3-5 known weaknesses or limitations (be specific)
  "community_tips": ["tip 1", "tip 2", ...],       // 3-5 tips from the tuning community
  "tuning_platforms": [                            // Popular tuning software/hardware FOR THIS CAR
    { "name": "Platform Name", "url": "https://...", "priceLow": 400, "priceHigh": 600, "notes": "What it's used for" }
  ],
  "power_limits": {                                // Stock component limits (if turbocharged)
    "stock_turbo": "XXX whp",
    "stock_internals": "XXX whp",
    "stock_fuel": "XXX whp", 
    "stock_transmission": "XXX lb-ft"
  }
}

Be SPECIFIC to this car's platform. Include:
- Real tuning platform names (COBB, APR, Hondata, HP Tuners, MHD, etc.) that work with this car
- Actual power limits based on real-world data
- Known issues specific to this generation/engine

Return ONLY valid JSON, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return null;
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.log(`   ⚠️ Insights research failed: ${error.message}`);
    return null;
  }
}

/**
 * Process a single car
 */
async function processCar(slug, index, total) {
  console.log(`\n[${index + 1}/${total}] Processing: ${slug}`);
  
  // Fetch car data
  const { data: car, error: carError } = await supabase
    .from('cars')
    .select('*')
    .eq('slug', slug)
    .single();

  if (carError || !car) {
    console.log(`   ❌ Car not found: ${slug}`);
    return { slug, success: false, error: 'Car not found' };
  }

  console.log(`   📍 ${car.name} (${car.years})`);
  console.log(`   🔧 ${car.engine || 'Unknown engine'} | ${car.hp || '?'} HP | ${car.drivetrain || '?'}`);

  // Check existing profile
  const { data: existingProfile } = await supabase
    .from('car_tuning_profiles')
    .select('*')
    .eq('car_id', car.id)
    .single();

  const hasUpgrades = existingProfile?.upgrades_by_objective && 
    Object.values(existingProfile.upgrades_by_objective).some(arr => arr?.length > 0);

  if (hasUpgrades && !values['force']) {
    console.log(`   ⏭️  Already has upgrade data, skipping (use --force to override)`);
    return { slug, success: true, skipped: true };
  }

  // Research upgrades
  console.log(`   🔬 Researching upgrades...`);
  const upgrades = await researchTuningUpgrades(car);
  
  if (!upgrades) {
    return { slug, success: false, error: 'Failed to research upgrades' };
  }

  const upgradeCount = Object.values(upgrades).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
  console.log(`   ✅ Generated ${upgradeCount} upgrades`);

  if (verbose) {
    Object.entries(upgrades).forEach(([key, arr]) => {
      if (arr?.length > 0) {
        console.log(`      ${key}: ${arr.length}`);
      }
    });
  }

  // Research platform insights
  console.log(`   🔬 Researching platform insights...`);
  const insights = await researchPlatformInsights(car);
  
  if (insights) {
    console.log(`   ✅ Generated platform insights`);
    if (verbose) {
      console.log(`      Strengths: ${insights.strengths?.length || 0}`);
      console.log(`      Weaknesses: ${insights.weaknesses?.length || 0}`);
      console.log(`      Tips: ${insights.community_tips?.length || 0}`);
    }
  }

  if (dryRun) {
    console.log(`   [DRY RUN] Would update profile`);
    return { slug, success: true, dryRun: true, upgradeCount };
  }

  // Update database
  const updateData = {
    upgrades_by_objective: upgrades,
    data_quality_tier: 'researched',
    data_sources: {
      ...existingProfile?.data_sources,
      has_ai_research: true,
      ai_research_date: new Date().toISOString(),
      ai_model: 'claude-sonnet-4-20250514',
    },
    pipeline_version: '1.2.0-batch',
    pipeline_run_at: new Date().toISOString(),
  };

  if (insights) {
    updateData.platform_insights = {
      strengths: insights.strengths || [],
      weaknesses: insights.weaknesses || [],
      community_tips: insights.community_tips || [],
    };
    
    if (insights.tuning_platforms?.length > 0) {
      updateData.tuning_platforms = insights.tuning_platforms;
    }
    
    if (insights.power_limits && Object.keys(insights.power_limits).length > 0) {
      updateData.power_limits = insights.power_limits;
    }
  }

  if (existingProfile?.id) {
    const { error: updateError } = await supabase
      .from('car_tuning_profiles')
      .update(updateData)
      .eq('id', existingProfile.id);

    if (updateError) {
      console.log(`   ❌ Update failed: ${updateError.message}`);
      return { slug, success: false, error: updateError.message };
    }
  } else {
    // Create new profile
    const { error: insertError } = await supabase
      .from('car_tuning_profiles')
      .insert({
        car_id: car.id,
        tuning_focus: 'performance',
        ...updateData,
      });

    if (insertError) {
      console.log(`   ❌ Insert failed: ${insertError.message}`);
      return { slug, success: false, error: insertError.message };
    }
  }

  console.log(`   ✅ Profile saved`);
  return { slug, success: true, upgradeCount };
}

/**
 * Get cars missing upgrade data
 */
async function getMissingCars(maxLimit) {
  // Query for cars that are sports/performance focused but missing upgrade data
  const { data, error } = await supabase
    .from('cars')
    .select(`
      slug,
      name,
      vehicle_type,
      car_tuning_profiles!left(upgrades_by_objective)
    `)
    .in('vehicle_type', ['Sports Car', 'Sports Sedan', 'Hot Hatch', 'Muscle Car', 'Supercar'])
    .limit(500);

  if (error) {
    console.error('Error fetching cars:', error);
    return [];
  }

  // Filter to cars missing upgrade data
  const missing = data.filter(car => {
    const profile = car.car_tuning_profiles?.[0];
    if (!profile?.upgrades_by_objective) return true;
    const hasData = Object.values(profile.upgrades_by_objective).some(arr => arr?.length > 0);
    return !hasData;
  });

  return missing.slice(0, maxLimit).map(c => c.slug);
}

/**
 * Main function
 */
async function main() {
  console.log('');
  console.log('🚀 Batch AI Research for Tuning Profiles');
  console.log('=========================================');
  
  // Determine which slugs to process
  let slugs = [];
  
  if (slugsArg) {
    slugs = slugsArg.split(',').map(s => s.trim());
    console.log(`Processing ${slugs.length} specified cars`);
  } else if (tier) {
    const tierMap = { '1': TIER_1_SLUGS, '2': TIER_2_SLUGS, '3': TIER_3_SLUGS };
    slugs = tierMap[tier] || [];
    console.log(`Processing Tier ${tier} (${slugs.length} cars)`);
  } else if (findMissing) {
    console.log(`Finding cars missing upgrade data...`);
    slugs = await getMissingCars(limit);
    console.log(`Found ${slugs.length} cars missing data`);
  } else {
    console.log('');
    console.log('Usage:');
    console.log('  --tier <1|2|3>    Process cars from priority tier');
    console.log('  --slugs <list>    Comma-separated list of car slugs');
    console.log('  --missing         Process cars missing upgrade data');
    console.log('  --limit <n>       Max cars to process (default: 10)');
    console.log('  --delay <ms>      Delay between cars (default: 5000)');
    console.log('  --dry-run         Don\'t write to DB');
    console.log('  --verbose         Show detailed output');
    process.exit(0);
  }

  // Apply limit
  if (slugs.length > limit) {
    slugs = slugs.slice(0, limit);
    console.log(`Limited to ${limit} cars`);
  }

  if (slugs.length === 0) {
    console.log('No cars to process');
    process.exit(0);
  }

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
  }

  console.log(`Delay between cars: ${delay}ms`);
  console.log('');

  // Process each car
  const results = [];
  
  for (let i = 0; i < slugs.length; i++) {
    const result = await processCar(slugs[i], i, slugs.length);
    results.push(result);
    
    // Delay between cars to avoid rate limits
    if (i < slugs.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Summary
  console.log('');
  console.log('=========================================');
  console.log('📊 Summary');
  console.log('=========================================');
  
  const successful = results.filter(r => r.success && !r.skipped && !r.dryRun);
  const skipped = results.filter(r => r.skipped);
  const failed = results.filter(r => !r.success);
  const dryRunResults = results.filter(r => r.dryRun);
  
  console.log(`✅ Processed: ${successful.length}`);
  console.log(`⏭️  Skipped (already has data): ${skipped.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (dryRunResults.length > 0) {
    console.log(`🔍 Dry run: ${dryRunResults.length}`);
  }
  
  if (failed.length > 0) {
    console.log('');
    console.log('Failed cars:');
    failed.forEach(r => console.log(`  - ${r.slug}: ${r.error}`));
  }

  const totalUpgrades = successful.reduce((sum, r) => sum + (r.upgradeCount || 0), 0);
  console.log('');
  console.log(`Total upgrades generated: ${totalUpgrades}`);
}

main().catch(console.error);
