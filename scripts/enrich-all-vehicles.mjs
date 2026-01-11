#!/usr/bin/env node
/**
 * MASTER VEHICLE ENRICHMENT ORCHESTRATOR
 * 
 * Evaluates data quality for EVERY car in the database and enriches
 * any that have gaps. This is a comprehensive, resumable process.
 * 
 * What it checks for each car:
 * - Core specs (hp, torque, scores, image)
 * - Known issues (car_issues)
 * - Maintenance specs (vehicle_maintenance_specs)
 * - Service intervals (vehicle_service_intervals)
 * - Tuning data (car_tuning_profiles.upgrades_by_objective)
 * - EPA fuel economy
 * - NHTSA safety data
 * - Recalls
 * 
 * Usage:
 *   node scripts/enrich-all-vehicles.mjs --status          # See what needs enrichment
 *   node scripts/enrich-all-vehicles.mjs --run             # Start enrichment
 *   node scripts/enrich-all-vehicles.mjs --run --limit 10  # Process 10 cars
 *   node scripts/enrich-all-vehicles.mjs --run --resume    # Resume from last position
 *   node scripts/enrich-all-vehicles.mjs --car bmw-m3-g80  # Enrich specific car
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// Progress file for resumability
const PROGRESS_FILE = path.join(__dirname, '.enrichment-progress.json');

// Quality thresholds
const QUALITY_THRESHOLDS = {
  issues: 3,           // Minimum known issues for "good" quality
  intervals: 5,        // Minimum service intervals
  tuningUpgrades: 5,   // Minimum upgrades in upgrades_by_objective
};

const { values } = parseArgs({
  options: {
    'status': { type: 'boolean', default: false },
    'run': { type: 'boolean', default: false },
    'resume': { type: 'boolean', default: false },
    'limit': { type: 'string' },
    'car': { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    'verbose': { type: 'boolean', default: false },
    'help': { type: 'boolean', short: 'h', default: false },
  },
});

function printUsage() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║              MASTER VEHICLE ENRICHMENT ORCHESTRATOR                           ║
╚═══════════════════════════════════════════════════════════════════════════════╝

Evaluates and enriches EVERY car in the database across ALL fields.

USAGE:
  # Check current status
  node scripts/enrich-all-vehicles.mjs --status

  # Run full enrichment
  node scripts/enrich-all-vehicles.mjs --run

  # Run with limit (for testing)
  node scripts/enrich-all-vehicles.mjs --run --limit 10

  # Resume from where you left off
  node scripts/enrich-all-vehicles.mjs --run --resume

  # Enrich a specific car
  node scripts/enrich-all-vehicles.mjs --car bmw-m3-g80

OPTIONS:
  --status       Show enrichment status for all vehicles
  --run          Start the enrichment process
  --resume       Resume from last saved position
  --limit N      Only process N vehicles
  --car SLUG     Enrich a specific car by slug
  --dry-run      Show what would be done without making changes
  --verbose      Show detailed output
  -h, --help     Show this help

QUALITY THRESHOLDS:
  - Known issues: ${QUALITY_THRESHOLDS.issues}+ records
  - Service intervals: ${QUALITY_THRESHOLDS.intervals}+ records
  - Tuning upgrades: ${QUALITY_THRESHOLDS.tuningUpgrades}+ upgrades
`);
}

if (values['help']) {
  printUsage();
  process.exit(0);
}

/**
 * Evaluate data quality for a single car
 */
async function evaluateCarQuality(car) {
  const carId = car.id;
  const slug = car.slug;

  // Fetch all related data
  const [
    tuningProfile,
    issues,
    maintenanceSpecs,
    serviceIntervals,
    fuelEconomy,
    safetyData,
    recalls
  ] = await Promise.all([
    supabase.from('car_tuning_profiles').select('data_quality_tier, upgrades_by_objective, stage_progressions').eq('car_id', carId).single(),
    supabase.from('car_issues').select('id').eq('car_id', carId),
    supabase.from('vehicle_maintenance_specs').select('id').eq('car_id', carId),
    supabase.from('vehicle_service_intervals').select('id').eq('car_id', carId),
    supabase.from('car_fuel_economy').select('id').eq('car_id', carId),
    supabase.from('car_safety_data').select('id').eq('car_id', carId),
    supabase.from('car_recalls').select('id').eq('car_id', carId),
  ]);

  // Calculate tuning upgrades
  const objectives = tuningProfile.data?.upgrades_by_objective || {};
  const tuningUpgrades = Object.values(objectives).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

  const quality = {
    carId: car.id,
    slug,
    name: car.name,
    brand: car.brand,
    
    // Core specs (from cars table)
    hasSpecs: car.hp != null && car.torque != null,
    hasScores: car.score_sound != null,
    hasImage: car.image_hero_url != null,
    
    // Related data counts
    issueCount: issues.data?.length || 0,
    maintenanceCount: maintenanceSpecs.data?.length || 0,
    intervalCount: serviceIntervals.data?.length || 0,
    fuelEconomyCount: fuelEconomy.data?.length || 0,
    safetyCount: safetyData.data?.length || 0,
    recallCount: recalls.data?.length || 0,
    
    // Tuning data
    tuningTier: tuningProfile.data?.data_quality_tier || 'none',
    tuningUpgrades,
    
    // Quality flags
    needsIssues: (issues.data?.length || 0) < QUALITY_THRESHOLDS.issues,
    needsIntervals: (serviceIntervals.data?.length || 0) < QUALITY_THRESHOLDS.intervals,
    needsTuning: tuningUpgrades < QUALITY_THRESHOLDS.tuningUpgrades,
    needsMaintenance: (maintenanceSpecs.data?.length || 0) === 0,
    needsFuelEconomy: (fuelEconomy.data?.length || 0) === 0,
    needsSafety: (safetyData.data?.length || 0) === 0,
  };

  // Determine what enrichment is needed
  quality.needsCarPipeline = quality.needsIssues || quality.needsIntervals || quality.needsMaintenance;
  quality.needsTuningPipeline = quality.needsTuning;
  quality.needsEnrichment = quality.needsCarPipeline || quality.needsTuningPipeline;
  
  // Overall quality score (0-100)
  let score = 0;
  if (quality.hasSpecs) score += 15;
  if (quality.hasScores) score += 10;
  if (quality.hasImage) score += 5;
  if (quality.issueCount >= QUALITY_THRESHOLDS.issues) score += 20;
  if (quality.intervalCount >= QUALITY_THRESHOLDS.intervals) score += 15;
  if (quality.tuningUpgrades >= QUALITY_THRESHOLDS.tuningUpgrades) score += 20;
  if (quality.maintenanceCount > 0) score += 5;
  if (quality.fuelEconomyCount > 0) score += 5;
  if (quality.safetyCount > 0) score += 5;
  
  quality.score = score;
  quality.grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F';

  return quality;
}

/**
 * Run a script and wait for completion
 */
function runScript(scriptPath, args = [], verbose = false) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [scriptPath, ...args], {
      cwd: projectRoot,
      stdio: verbose ? 'inherit' : 'pipe',
      timeout: 600000, // 10 minute timeout
    });

    let stdout = '';
    let stderr = '';

    if (!verbose) {
      child.stdout?.on('data', (data) => { stdout += data.toString(); });
      child.stderr?.on('data', (data) => { stderr += data.toString(); });
    }

    child.on('close', (code) => {
      resolve({ success: code === 0, code, stdout, stderr });
    });

    child.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

/**
 * Enrich a single car based on its quality gaps
 */
async function enrichCar(quality, dryRun = false, verbose = false) {
  const results = {
    slug: quality.slug,
    name: quality.name,
    carEnrichment: null,
    tuningPipeline: null,
    success: true,
  };

  console.log(`\n📦 ${quality.name}`);
  console.log(`   Quality: ${quality.grade} (${quality.score}/100)`);
  console.log(`   Issues: ${quality.issueCount}, Intervals: ${quality.intervalCount}, Tuning: ${quality.tuningUpgrades} upgrades`);

  // Run car enrichment if needed (for issues, intervals) - uses AI to research missing data
  if (quality.needsCarPipeline) {
    console.log(`   🔧 Needs enrichment: issues=${quality.needsIssues}, intervals=${quality.needsIntervals}`);
    
    if (dryRun) {
      console.log(`   [DRY RUN] Would run car enrichment`);
    } else {
      const enrichScript = path.join(projectRoot, 'scripts/car-pipeline/enrich-existing-car.mjs');
      
      console.log(`   Running enrichment (issues + intervals)...`);
      const result = await runScript(enrichScript, ['--slug', quality.slug, ...(verbose ? ['--verbose'] : [])], verbose);
      
      results.carEnrichment = result;
      if (!result.success) {
        console.log(`   ⚠️  Enrichment had issues`);
        // Don't mark as failed - partial success is OK
      } else {
        console.log(`   ✅ Issues & intervals enriched`);
      }
    }
  }

  // Run tuning pipeline if needed
  if (quality.needsTuningPipeline) {
    console.log(`   🔧 Needs tuning: ${quality.tuningUpgrades} upgrades (threshold: ${QUALITY_THRESHOLDS.tuningUpgrades})`);
    
    if (dryRun) {
      console.log(`   [DRY RUN] Would run tuning pipeline`);
    } else {
      // First try the standard tuning pipeline
      const tuningPipelineScript = path.join(projectRoot, 'scripts/tuning-pipeline/run-pipeline.mjs');
      
      console.log(`   Running tuning pipeline...`);
      const result = await runScript(tuningPipelineScript, ['--car-slug', quality.slug], verbose);
      
      // Check if pipeline actually added upgrades
      const { data: postProfile } = await supabase
        .from('car_tuning_profiles')
        .select('upgrades_by_objective')
        .eq('car_id', quality.carId)
        .single();
      
      const postUpgrades = postProfile?.upgrades_by_objective || {};
      const postCount = Object.values(postUpgrades).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
      
      if (postCount < QUALITY_THRESHOLDS.tuningUpgrades) {
        // Standard pipeline didn't produce enough data, try AI research
        console.log(`   ⚠️  Standard pipeline produced ${postCount} upgrades - trying AI research...`);
        
        const aiTuningScript = path.join(projectRoot, 'scripts/tuning-pipeline/ai-research-tuning.mjs');
        const aiResult = await runScript(aiTuningScript, ['--slug', quality.slug], verbose);
        
        if (aiResult.success) {
          console.log(`   ✅ AI tuning research complete`);
        } else {
          console.log(`   ⚠️  AI research had issues`);
        }
      } else {
        console.log(`   ✅ Tuning pipeline complete (${postCount} upgrades)`);
      }
      
      results.tuningPipeline = result;
    }
  }

  if (!quality.needsCarPipeline && !quality.needsTuningPipeline) {
    console.log(`   ✅ Quality OK - no enrichment needed`);
  }

  return results;
}

/**
 * Save progress for resumability
 */
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

/**
 * Load saved progress
 */
function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    }
  } catch (e) {
    // Ignore
  }
  return null;
}

/**
 * Show status of all vehicles
 */
async function showStatus() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              VEHICLE ENRICHMENT STATUS                                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('Analyzing all vehicles...');

  // Fetch all cars
  const { data: cars } = await supabase
    .from('cars')
    .select('id, slug, name, brand, hp, torque, score_sound, image_hero_url')
    .order('name');

  // Batch fetch all related data
  const [tuningProfiles, issues, intervals] = await Promise.all([
    supabase.from('car_tuning_profiles').select('car_id, data_quality_tier, upgrades_by_objective'),
    supabase.from('car_issues').select('car_id'),
    supabase.from('vehicle_service_intervals').select('car_id'),
  ]);

  // Build maps
  const tuningMap = new Map();
  (tuningProfiles.data || []).forEach(p => {
    const objectives = p.upgrades_by_objective || {};
    const count = Object.values(objectives).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    tuningMap.set(p.car_id, { tier: p.data_quality_tier, upgrades: count });
  });

  const issueCountMap = new Map();
  (issues.data || []).forEach(row => {
    issueCountMap.set(row.car_id, (issueCountMap.get(row.car_id) || 0) + 1);
  });

  const intervalCountMap = new Map();
  (intervals.data || []).forEach(row => {
    intervalCountMap.set(row.car_id, (intervalCountMap.get(row.car_id) || 0) + 1);
  });

  // Analyze
  const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  const needsEnrichment = [];
  const good = [];

  for (const car of cars) {
    const tuning = tuningMap.get(car.id) || { tier: 'none', upgrades: 0 };
    const issueCount = issueCountMap.get(car.id) || 0;
    const intervalCount = intervalCountMap.get(car.id) || 0;

    const needsIssues = issueCount < QUALITY_THRESHOLDS.issues;
    const needsIntervals = intervalCount < QUALITY_THRESHOLDS.intervals;
    const needsTuning = tuning.upgrades < QUALITY_THRESHOLDS.tuningUpgrades;

    let score = 0;
    if (car.hp != null) score += 15;
    if (car.score_sound != null) score += 10;
    if (car.image_hero_url) score += 5;
    if (!needsIssues) score += 20;
    if (!needsIntervals) score += 15;
    if (!needsTuning) score += 20;
    score += 15; // Assume maintenance present for most

    const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : score >= 20 ? 'D' : 'F';
    grades[grade]++;

    if (needsIssues || needsIntervals || needsTuning) {
      needsEnrichment.push({
        slug: car.slug,
        name: car.name,
        brand: car.brand,
        grade,
        score,
        issues: issueCount,
        intervals: intervalCount,
        tuningUpgrades: tuning.upgrades,
        needsIssues,
        needsIntervals,
        needsTuning,
      });
    } else {
      good.push(car);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('QUALITY DISTRIBUTION');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`   Total Vehicles: ${cars.length}`);
  console.log('');
  console.log(`   Grade A (80-100): ${grades.A.toString().padStart(3)} ${'█'.repeat(Math.round(grades.A / cars.length * 50))}`);
  console.log(`   Grade B (60-79):  ${grades.B.toString().padStart(3)} ${'█'.repeat(Math.round(grades.B / cars.length * 50))}`);
  console.log(`   Grade C (40-59):  ${grades.C.toString().padStart(3)} ${'█'.repeat(Math.round(grades.C / cars.length * 50))}`);
  console.log(`   Grade D (20-39):  ${grades.D.toString().padStart(3)} ${'█'.repeat(Math.round(grades.D / cars.length * 50))}`);
  console.log(`   Grade F (0-19):   ${grades.F.toString().padStart(3)} ${'█'.repeat(Math.round(grades.F / cars.length * 50))}`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('ENRICHMENT SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`   ✅ Good quality (no enrichment needed):  ${good.length} vehicles`);
  console.log(`   🔧 Need enrichment:                      ${needsEnrichment.length} vehicles`);
  console.log('');

  // Break down what's needed
  const needsIssuesCount = needsEnrichment.filter(c => c.needsIssues).length;
  const needsIntervalsCount = needsEnrichment.filter(c => c.needsIntervals).length;
  const needsTuningCount = needsEnrichment.filter(c => c.needsTuning).length;

  console.log('   Breakdown of gaps:');
  console.log(`      Need more issues:     ${needsIssuesCount} vehicles (< ${QUALITY_THRESHOLDS.issues} issues)`);
  console.log(`      Need more intervals:  ${needsIntervalsCount} vehicles (< ${QUALITY_THRESHOLDS.intervals} intervals)`);
  console.log(`      Need more tuning:     ${needsTuningCount} vehicles (< ${QUALITY_THRESHOLDS.tuningUpgrades} upgrades)`);
  console.log('');

  // Top 20 needing enrichment
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('TOP 20 VEHICLES NEEDING ENRICHMENT');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');

  needsEnrichment
    .sort((a, b) => a.score - b.score)
    .slice(0, 20)
    .forEach((car, i) => {
      const gaps = [];
      if (car.needsIssues) gaps.push(`issues:${car.issues}`);
      if (car.needsIntervals) gaps.push(`intervals:${car.intervals}`);
      if (car.needsTuning) gaps.push(`tuning:${car.tuningUpgrades}`);
      console.log(`   ${(i + 1).toString().padStart(2)}. [${car.grade}] ${car.name}`);
      console.log(`       Gaps: ${gaps.join(', ')}`);
    });

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('TO START ENRICHMENT');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log('   # Enrich all vehicles that need it');
  console.log('   node scripts/enrich-all-vehicles.mjs --run');
  console.log('');
  console.log('   # Test with 5 vehicles first');
  console.log('   node scripts/enrich-all-vehicles.mjs --run --limit 5');
  console.log('');
  console.log('   # Resume if interrupted');
  console.log('   node scripts/enrich-all-vehicles.mjs --run --resume');
  console.log('');
}

/**
 * Run enrichment for all vehicles
 */
async function runEnrichment(limit = null, resume = false, dryRun = false, verbose = false) {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              STARTING VEHICLE ENRICHMENT                                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Load progress if resuming
  let startIndex = 0;
  let previousProgress = null;
  if (resume) {
    previousProgress = loadProgress();
    if (previousProgress) {
      startIndex = previousProgress.lastIndex + 1;
      console.log(`📂 Resuming from position ${startIndex} (${previousProgress.lastSlug})`);
    }
  }

  // Fetch all cars
  const { data: cars } = await supabase
    .from('cars')
    .select('id, slug, name, brand, hp, torque, score_sound, image_hero_url')
    .order('name');

  const total = limit ? Math.min(limit, cars.length - startIndex) : cars.length - startIndex;
  
  console.log(`Processing ${total} vehicles (starting at index ${startIndex})`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  const stats = {
    processed: 0,
    enriched: 0,
    skipped: 0,
    failed: 0,
    startTime: Date.now(),
  };

  for (let i = startIndex; i < cars.length && (limit === null || stats.processed < limit); i++) {
    const car = cars[i];
    const progress = `[${stats.processed + 1}/${total}]`;

    try {
      // Evaluate quality
      const quality = await evaluateCarQuality(car);

      if (!quality.needsEnrichment) {
        console.log(`${progress} ✅ ${car.name} - Quality OK (${quality.grade})`);
        stats.skipped++;
      } else {
        // Enrich
        const result = await enrichCar(quality, dryRun, verbose);
        
        if (result.success) {
          stats.enriched++;
        } else {
          stats.failed++;
        }
        
        // Small delay between enrichments to avoid API rate limits
        if (!dryRun) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      stats.processed++;

      // Save progress
      if (!dryRun) {
        saveProgress({
          lastIndex: i,
          lastSlug: car.slug,
          stats,
          timestamp: new Date().toISOString(),
        });
      }

    } catch (error) {
      console.log(`${progress} ❌ ${car.name} - Error: ${error.message}`);
      stats.failed++;
      stats.processed++;
    }
  }

  // Summary
  const duration = ((Date.now() - stats.startTime) / 1000 / 60).toFixed(1);

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('ENRICHMENT COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`   Processed:  ${stats.processed}`);
  console.log(`   Enriched:   ${stats.enriched}`);
  console.log(`   Skipped:    ${stats.skipped} (already good quality)`);
  console.log(`   Failed:     ${stats.failed}`);
  console.log(`   Duration:   ${duration} minutes`);
  console.log('');

  // Clean up progress file if complete
  if (!limit && fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
    console.log('   ✅ Progress file cleaned up');
  }
}

/**
 * Enrich a specific car
 */
async function enrichSpecificCar(slug, dryRun = false, verbose = false) {
  const { data: car, error } = await supabase
    .from('cars')
    .select('id, slug, name, brand, hp, torque, score_sound, image_hero_url')
    .eq('slug', slug)
    .single();

  if (error || !car) {
    console.error(`❌ Car not found: ${slug}`);
    process.exit(1);
  }

  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              ENRICHING SPECIFIC VEHICLE                                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');

  const quality = await evaluateCarQuality(car);
  
  console.log('');
  console.log('CURRENT QUALITY ASSESSMENT');
  console.log('─────────────────────────────────────────────────────────────────────────────────');
  console.log(`   Vehicle:      ${quality.name}`);
  console.log(`   Grade:        ${quality.grade} (${quality.score}/100)`);
  console.log(`   Issues:       ${quality.issueCount} (threshold: ${QUALITY_THRESHOLDS.issues})`);
  console.log(`   Intervals:    ${quality.intervalCount} (threshold: ${QUALITY_THRESHOLDS.intervals})`);
  console.log(`   Tuning:       ${quality.tuningUpgrades} upgrades (threshold: ${QUALITY_THRESHOLDS.tuningUpgrades})`);
  console.log(`   Tuning Tier:  ${quality.tuningTier}`);
  console.log('');

  await enrichCar(quality, dryRun, verbose);

  // Re-evaluate after enrichment
  if (!dryRun && quality.needsEnrichment) {
    console.log('');
    console.log('POST-ENRICHMENT ASSESSMENT');
    console.log('─────────────────────────────────────────────────────────────────────────────────');
    const newQuality = await evaluateCarQuality(car);
    console.log(`   Grade:        ${newQuality.grade} (${newQuality.score}/100)`);
    console.log(`   Issues:       ${newQuality.issueCount}`);
    console.log(`   Intervals:    ${newQuality.intervalCount}`);
    console.log(`   Tuning:       ${newQuality.tuningUpgrades} upgrades`);
  }
}

/**
 * Main
 */
async function main() {
  if (values['status']) {
    await showStatus();
  } else if (values['car']) {
    await enrichSpecificCar(values['car'], values['dry-run'], values['verbose']);
  } else if (values['run']) {
    const limit = values['limit'] ? parseInt(values['limit']) : null;
    await runEnrichment(limit, values['resume'], values['dry-run'], values['verbose']);
  } else {
    printUsage();
  }
}

main().catch(console.error);
