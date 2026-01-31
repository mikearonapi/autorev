#!/usr/bin/env node

/**
 * LEAN AI Car Research & Addition Script
 *
 * A streamlined version of ai-research-car.js that only populates the 55 fields
 * actually used by the app's API routes (per audit/car-fields-audit-2026-01-31.md).
 *
 * Benefits:
 * - ~50% faster execution (fewer AI prompts)
 * - ~50% lower AI costs (less token usage)
 * - Same app functionality (all displayed fields populated)
 *
 * What it populates:
 * - cars table: 55 critical fields (identity, performance, pricing, scores, content)
 * - car_issues: 5-8 known issues
 * - vehicle_maintenance_specs: Core maintenance data
 * - vehicle_service_intervals: 8-10 service intervals
 * - car_tuning_profiles: Skeleton entry
 * - Images: Hero image only (garage image skipped by default)
 *
 * What it SKIPS (unused by app):
 * - 85+ editorial fields (essence, heritage, buyers_summary, etc.)
 * - Object arrays (direct_competitors, if_you_want_more, etc.)
 * - Track content (laptime_benchmarks, recommended_track_prep)
 * - Community content (key_resources, annual_events)
 *
 * Usage:
 *   node scripts/car-pipeline/ai-research-car-lean.js "Porsche 911 GT3 (992)" [options]
 *
 * Options:
 *   --dry-run       Show what would be done without executing
 *   --verbose       Show detailed output
 *   --skip-images   Skip image generation (use when testing)
 *   --full          Use full pipeline instead (same as ai-research-car.js)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

// Load environment variables
function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        let value = valueParts.join('=');
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
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
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Validate required env vars
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ANTHROPIC_API_KEY',
];
const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Dynamic imports
const { createClient } = await import('@supabase/supabase-js');
const { default: Anthropic } = await import('@anthropic-ai/sdk');
const { trackBackendAiUsage, AI_PURPOSES, AI_SOURCES } =
  await import('../../lib/backendAiLogger.js');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Parse command line arguments
const args = process.argv.slice(2);
const carName = args.find((arg) => !arg.startsWith('--'));
const flags = {
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
  skipImages: args.includes('--skip-images'),
  full: args.includes('--full'),
};

// If --full flag, delegate to full pipeline
if (flags.full) {
  console.log('🔄 Delegating to full pipeline (ai-research-car.js)...');
  const { spawn } = await import('child_process');
  const fullScript = path.join(__dirname, 'ai-research-car.js');
  const childArgs = args.filter((a) => a !== '--full');
  spawn('node', [fullScript, ...childArgs], { stdio: 'inherit' });
  process.exit(0);
}

if (!carName) {
  console.error('Usage: node ai-research-car-lean.js "Car Name" [options]');
  console.error('\nThis LEAN pipeline only populates the 55 fields used by the app.');
  console.error('Use --full for the complete 140+ field pipeline.');
  console.error('\nOptions:');
  console.error('  --dry-run       Preview without saving');
  console.error('  --verbose       Show detailed output');
  console.error('  --skip-images   Skip image generation');
  console.error('  --full          Use full pipeline instead');
  process.exit(1);
}

function log(msg, level = 'info') {
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    ai: '🤖',
    db: '💾',
    phase: '📋',
  };
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${prefix[level] || ''} ${msg}`);
}

async function trackAiCall(response, phase, entityId) {
  if (response?.usage) {
    await trackBackendAiUsage({
      purpose: AI_PURPOSES.CAR_RESEARCH,
      scriptName: `ai-research-car-lean:${phase}`,
      inputTokens: response.usage.input_tokens || 0,
      outputTokens: response.usage.output_tokens || 0,
      model: response.model || 'claude-sonnet-4-20250514',
      entityId,
      source: AI_SOURCES.BACKEND_SCRIPT,
    });
  }
}

// =============================================================================
// LEAN AI RESEARCH: Core Data + Scores (Combined - saves 1 API call)
// =============================================================================

async function aiResearchCoreDataAndScores(carName) {
  log(`AI researching core data + scores for "${carName}"...`, 'ai');

  const prompt = `You are an automotive expert. Research "${carName}" and provide data for these 55 fields ONLY.

CRITICAL: Return ONLY valid JSON, no markdown, no additional text.

{
  "slug": "brand-model-generation (URL-safe, e.g., porsche-911-gt3-992)",
  "name": "Full official name",
  "model": "Model name only",
  "trim": "Trim level if applicable, null otherwise",
  "years": "Production years (e.g., 2019-2024 or 2021-present)",
  "brand": "Manufacturer name",
  "country": "Country of origin",
  "generation_code": "Internal generation/chassis code or null",
  "tier": "budget|mid|premium (based on MSRP: <$50k=budget, $50k-150k=mid, >$150k=premium)",
  "category": "Front-Engine|Mid-Engine|Rear-Engine|Electric",
  "vehicle_type": "Sports Car|Sports Sedan|Supercar|Hot Hatch|Muscle Car|Truck|SUV|Wagon|Hypercar",
  "layout": "Front-mid engine, rear-wheel drive (or similar)",
  
  "engine": "Engine description (e.g., 4.0L Twin-Turbo V8)",
  "hp": 500,
  "torque": 450,
  "trans": "Transmission (e.g., 6MT, 7DCT, 8AT)",
  "drivetrain": "RWD|AWD|FWD",
  "curb_weight": 3500,
  "zero_to_sixty": 3.5,
  "top_speed": 190,
  "quarter_mile": 11.5,
  "braking_60_0": 102,
  "lateral_g": 1.05,
  
  "price_range": "$80,000 - $120,000",
  "price_avg": 95000,
  "msrp_new_low": 85000,
  "msrp_new_high": 125000,
  
  "score_sound": 8,
  "score_interior": 7,
  "score_track": 9,
  "score_reliability": 7,
  "score_value": 6,
  "score_driver_fun": 9,
  "score_aftermarket": 8,
  
  "notes": "2-3 sentence description of the car",
  "highlight": "Single standout feature",
  "tagline": "Memorable phrase or marketing tagline",
  "hero_blurb": "2-3 sentence description for hero section",
  "manual_available": true,
  "seats": 2,
  "daily_usability_tag": "Weekend Only|Track Toy|Daily Capable|Grand Tourer",
  
  "common_issues": ["Issue 1 (brief)", "Issue 2 (brief)", "Issue 3 (brief)"],
  "defining_strengths": [
    {"title": "Short Title", "description": "2 sentence explanation"},
    {"title": "Another", "description": "2 sentence explanation"},
    {"title": "Third", "description": "2 sentence explanation"}
  ],
  "honest_weaknesses": [
    {"title": "Short Title", "description": "2 sentence explanation"},
    {"title": "Another", "description": "2 sentence explanation"}
  ],
  
  "engine_character": "How the engine feels (2 sentences)",
  "transmission_feel": "Transmission characteristics (2 sentences)",
  "chassis_dynamics": "Handling feel (2 sentences)",
  "steering_feel": "Steering feedback (2 sentences)",
  "sound_signature": "How it sounds (1-2 sentences)",
  "track_readiness": "excellent|good|moderate|limited",
  "community_strength": "strong|moderate|growing|limited",
  "diy_friendliness": "high|moderate|low",
  "parts_availability": "excellent|good|moderate|limited"
}

SCORING GUIDE (1-10):
- Sound: Engine note quality (10=LFA, 1=EV)
- Interior: Materials + ergonomics (10=Porsche, 5=economy car)
- Track: Circuit capability (10=GT3 RS, 5=daily driver)
- Reliability: Dependability (10=Lexus, 5=average, 1=problematic)
- Value: Performance per dollar (10=Miata, 5=fair, 1=overpriced)
- Driver Fun: Engagement (10=Lotus, 5=average)
- Aftermarket: Mod support (10=Mustang, 1=exotic)

Be accurate with specs. Use real data.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  await trackAiCall(response, 'core-scores', carName);

  const content = response.content[0].text;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');

  const carData = JSON.parse(jsonMatch[0]);

  // Validate required fields
  const required = ['slug', 'name', 'years', 'brand', 'hp', 'price_avg'];
  for (const field of required) {
    if (!carData[field]) {
      throw new Error(`AI failed to provide required field: ${field}`);
    }
  }

  // Validate vehicle_type
  const validVehicleTypes = [
    'Sports Car',
    'Sports Sedan',
    'Supercar',
    'Hot Hatch',
    'Muscle Car',
    'Truck',
    'SUV',
    'Wagon',
    'Hypercar',
  ];
  if (!validVehicleTypes.includes(carData.vehicle_type)) {
    carData.vehicle_type = 'Sports Car';
  }

  // Validate drivetrain
  const validDrivetrains = ['RWD', 'AWD', 'FWD'];
  if (!validDrivetrains.includes(carData.drivetrain)) {
    carData.drivetrain = 'RWD';
  }

  if (flags.verbose) {
    log(`Generated slug: ${carData.slug}`, 'info');
    log(`HP: ${carData.hp}, 0-60: ${carData.zero_to_sixty}s`, 'info');
  }

  return carData;
}

// =============================================================================
// LEAN AI RESEARCH: Known Issues (Simplified)
// =============================================================================

async function aiResearchKnownIssues(carData) {
  log(`AI researching known issues...`, 'ai');

  const prompt = `Research known issues for the ${carData.name} (${carData.years}).

Return 5-8 issues as JSON array:

[
  {
    "title": "Issue name",
    "kind": "common_issue",
    "severity": "critical|high|medium|low",
    "affected_years_text": "Years affected",
    "description": "2-3 sentences",
    "symptoms": ["Symptom 1", "Symptom 2"],
    "prevention": "Prevention advice",
    "fix_description": "Fix summary",
    "estimated_cost_text": "$X - $Y",
    "estimated_cost_low": 500,
    "estimated_cost_high": 1500
  }
]

Include at least 1 critical/high severity issue if applicable.
Return ONLY the JSON array, no markdown.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  await trackAiCall(response, 'issues', carData.slug);

  const content = response.content[0].text;
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array in AI response');

  return JSON.parse(jsonMatch[0]);
}

// =============================================================================
// LEAN AI RESEARCH: Maintenance (Simplified)
// =============================================================================

async function aiResearchMaintenance(carData) {
  log(`AI researching maintenance specs...`, 'ai');

  const prompt = `Research maintenance specs for the ${carData.name} (${carData.years}).

Return JSON object with these core fields:

{
  "oil_type": "Full Synthetic",
  "oil_viscosity": "5W-40",
  "oil_capacity_liters": 8.0,
  "oil_change_interval_miles": 10000,
  "coolant_type": "OAT or similar",
  "brake_fluid_type": "DOT 4",
  "trans_fluid_auto": "ATF type",
  "fuel_type": "Premium Unleaded",
  "fuel_octane_minimum": 91,
  "fuel_tank_capacity_gallons": 18.5,
  "tire_size_front": "255/35R19",
  "tire_size_rear": "295/30R20",
  "tire_pressure_front_psi": 36,
  "tire_pressure_rear_psi": 40
}

Use actual manufacturer specifications.
Return ONLY the JSON object, no markdown.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  await trackAiCall(response, 'maintenance', carData.slug);

  const content = response.content[0].text;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');

  return JSON.parse(jsonMatch[0]);
}

// =============================================================================
// LEAN AI RESEARCH: Service Intervals (Simplified)
// =============================================================================

async function aiResearchServiceIntervals(carData) {
  log(`AI researching service intervals...`, 'ai');

  const prompt = `Research service intervals for the ${carData.name} (${carData.years}).

Return 8-10 services as JSON array:

[
  {
    "service_name": "Oil Change",
    "service_description": "Brief description",
    "interval_miles": 10000,
    "interval_months": 12,
    "dealer_cost_low": 150,
    "dealer_cost_high": 300,
    "diy_cost_low": 60,
    "diy_cost_high": 100,
    "is_critical": true
  }
]

Include: Oil Change, Brake Fluid, Transmission Service, Coolant, Spark Plugs, Air Filter, Cabin Filter, Brake Inspection.
Return ONLY the JSON array, no markdown.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  await trackAiCall(response, 'intervals', carData.slug);

  const content = response.content[0].text;
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array in AI response');

  return JSON.parse(jsonMatch[0]);
}

// =============================================================================
// IMAGE GENERATION (Hero only - reuse from main script)
// =============================================================================

async function generateHeroImage(carData) {
  if (flags.skipImages || flags.dryRun) {
    log('Skipping image generation', 'warning');
    return null;
  }

  if (!GOOGLE_AI_API_KEY || !BLOB_READ_WRITE_TOKEN) {
    log('Image generation not configured (missing API keys)', 'warning');
    return null;
  }

  log(`Generating hero image...`, 'phase');

  const year = carData.years.split('-')[0];
  const brandColors = {
    Porsche: 'Guards Red',
    Ferrari: 'Rosso Corsa',
    BMW: 'San Marino Blue',
    Mercedes: 'Diamond White',
    Audi: 'Nardo Gray',
    Toyota: 'Renaissance Red',
    Ford: 'Grabber Blue',
    Chevrolet: 'Rapid Blue',
  };
  const color = brandColors[carData.brand] || 'metallic silver';

  const prompt = `A ${year} ${carData.name} in ${color} driving on a scenic coastal highway at golden hour. 3/4 front angle, motion blur on wheels, professional automotive photography, sharp focus, beautiful natural lighting. Real outdoor setting, not a studio.`;

  const modelName = 'gemini-3-pro-image-preview';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GOOGLE_AI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio: '16:9', imageSize: '2K' },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Image API error: ${response.status}`);
    }

    const result = await response.json();
    const imagePart = result.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);

    if (!imagePart) {
      throw new Error('No image in response');
    }

    // Upload to Vercel Blob
    const sharp = (await import('sharp')).default;
    const { put } = await import('@vercel/blob');

    const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
    const webpBuffer = await sharp(imageBuffer).webp({ quality: 85 }).toBuffer();

    const blobPath = `cars/${carData.slug}/hero.webp`;
    const blob = await put(blobPath, webpBuffer, {
      access: 'public',
      contentType: 'image/webp',
      token: BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    log(`Hero image uploaded: ${blob.url}`, 'success');
    return blob.url;
  } catch (err) {
    log(`Image generation failed: ${err.message}`, 'error');
    return null;
  }
}

// =============================================================================
// DATABASE SAVE
// =============================================================================

async function saveToDatabase(carData, issues, maintenanceSpecs, serviceIntervals, heroUrl) {
  log(`Saving to database...`, 'db');

  if (flags.dryRun) {
    log('DRY RUN: Would save to database', 'info');
    return { success: true, dryRun: true };
  }

  // Check for duplicates
  const { data: existing } = await supabase
    .from('cars')
    .select('id, slug')
    .eq('slug', carData.slug)
    .single();

  if (existing) {
    throw new Error(`Car already exists: ${carData.slug}`);
  }

  // Prepare car record with only the 55 critical fields
  const carRecord = {
    // Identity (11)
    slug: carData.slug,
    name: carData.name,
    model: carData.model,
    trim: carData.trim,
    years: carData.years,
    brand: carData.brand,
    country: carData.country,
    generation_code: carData.generation_code,
    tier: carData.tier,
    category: carData.category,
    vehicle_type: carData.vehicle_type,
    layout: carData.layout,

    // Performance (11)
    engine: carData.engine,
    hp: carData.hp,
    torque: carData.torque,
    trans: carData.trans,
    drivetrain: carData.drivetrain,
    curb_weight: carData.curb_weight,
    zero_to_sixty: carData.zero_to_sixty,
    top_speed: carData.top_speed,
    quarter_mile: carData.quarter_mile,
    braking_60_0: carData.braking_60_0,
    lateral_g: carData.lateral_g,

    // Pricing (4)
    price_range: carData.price_range,
    price_avg: carData.price_avg,
    msrp_new_low: carData.msrp_new_low,
    msrp_new_high: carData.msrp_new_high,

    // Scores (7)
    score_sound: carData.score_sound,
    score_interior: carData.score_interior,
    score_track: carData.score_track,
    score_reliability: carData.score_reliability,
    score_value: carData.score_value,
    score_driver_fun: carData.score_driver_fun,
    score_aftermarket: carData.score_aftermarket,

    // Content (8)
    notes: carData.notes,
    highlight: carData.highlight,
    tagline: carData.tagline,
    hero_blurb: carData.hero_blurb,
    image_hero_url: heroUrl,
    manual_available: carData.manual_available,
    seats: carData.seats,
    daily_usability_tag: carData.daily_usability_tag,

    // Editorial arrays (3)
    common_issues: carData.common_issues || [],
    defining_strengths: carData.defining_strengths || [],
    honest_weaknesses: carData.honest_weaknesses || [],

    // Detail fields (9)
    engine_character: carData.engine_character,
    transmission_feel: carData.transmission_feel,
    chassis_dynamics: carData.chassis_dynamics,
    steering_feel: carData.steering_feel,
    sound_signature: carData.sound_signature,
    track_readiness: carData.track_readiness,
    community_strength: carData.community_strength,
    diy_friendliness: carData.diy_friendliness,
    parts_availability: carData.parts_availability,
  };

  // Insert car
  const { data: car, error: carError } = await supabase
    .from('cars')
    .insert(carRecord)
    .select()
    .single();

  if (carError) {
    throw new Error(`Failed to insert car: ${carError.message}`);
  }

  log(`Car inserted: ${car.slug} (ID: ${car.id})`, 'success');

  // Insert known issues
  if (issues.length > 0) {
    const issuesWithCarId = issues.map((issue) => ({ ...issue, car_id: car.id }));
    const { error: issuesError } = await supabase.from('car_issues').insert(issuesWithCarId);
    if (issuesError) {
      log(`Warning: Issues insert failed: ${issuesError.message}`, 'warning');
    } else {
      log(`Inserted ${issues.length} known issues`, 'success');
    }
  }

  // Insert maintenance specs
  const { error: specsError } = await supabase
    .from('vehicle_maintenance_specs')
    .insert({ ...maintenanceSpecs, car_id: car.id });
  if (specsError) {
    log(`Warning: Maintenance specs insert failed: ${specsError.message}`, 'warning');
  } else {
    log(`Inserted maintenance specs`, 'success');
  }

  // Insert service intervals
  if (serviceIntervals.length > 0) {
    const intervalsWithCarId = serviceIntervals.map((i) => ({ ...i, car_id: car.id }));
    const { error: intervalsError } = await supabase
      .from('vehicle_service_intervals')
      .insert(intervalsWithCarId);
    if (intervalsError) {
      log(`Warning: Service intervals insert failed: ${intervalsError.message}`, 'warning');
    } else {
      log(`Inserted ${serviceIntervals.length} service intervals`, 'success');
    }
  }

  // Create tuning profile skeleton
  const { error: tuningError } = await supabase.from('car_tuning_profiles').insert({
    car_id: car.id,
    tuning_focus: 'performance',
    data_quality_tier: 'templated',
  });
  if (tuningError) {
    log(`Warning: Tuning profile insert failed: ${tuningError.message}`, 'warning');
  } else {
    log(`Created tuning profile skeleton`, 'success');
  }

  return { success: true, car };
}

// =============================================================================
// ENRICHMENT APIs
// =============================================================================

async function runEnrichmentAPIs(slug) {
  log(`Running enrichment APIs...`, 'phase');

  if (flags.dryRun) {
    log('DRY RUN: Would call enrichment APIs', 'info');
    return;
  }

  // EPA Fuel Economy
  try {
    const response = await fetch(`${BASE_URL}/api/cars/${slug}/fuel-economy`);
    if (response.ok) {
      log('EPA fuel economy enriched', 'success');
    }
  } catch (err) {
    log(`EPA enrichment skipped: ${err.message}`, 'warning');
  }

  // NHTSA Safety
  try {
    const response = await fetch(`${BASE_URL}/api/cars/${slug}/safety-ratings`);
    if (response.ok) {
      log('NHTSA safety ratings enriched', 'success');
    }
  } catch (err) {
    log(`Safety enrichment skipped: ${err.message}`, 'warning');
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('');
  console.log('🚗 AutoRev LEAN Car Pipeline');
  console.log('=============================');
  console.log(`Car: ${carName}`);
  console.log('Mode: LEAN (55 critical fields only)');
  if (flags.dryRun) console.log('      DRY RUN');
  if (flags.skipImages) console.log('      SKIP IMAGES');
  console.log('');

  const startTime = Date.now();

  try {
    // Step 1: AI Research (combined prompt - saves API calls)
    const carData = await aiResearchCoreDataAndScores(carName);
    log(`Generated slug: ${carData.slug}`, 'success');

    // Step 2: Parallel AI research for related data
    const [issues, maintenanceSpecs, serviceIntervals] = await Promise.all([
      aiResearchKnownIssues(carData),
      aiResearchMaintenance(carData),
      aiResearchServiceIntervals(carData),
    ]);

    // Step 3: Image generation
    const heroUrl = await generateHeroImage(carData);

    // Step 4: Save to database
    const { car: _car } = await saveToDatabase(
      carData,
      issues,
      maintenanceSpecs,
      serviceIntervals,
      heroUrl
    );

    // Step 5: Enrichment APIs
    await runEnrichmentAPIs(carData.slug);

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 LEAN PIPELINE COMPLETE');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log(`Car:        ${carData.name}`);
    console.log(`Slug:       ${carData.slug}`);
    console.log(`HP:         ${carData.hp}`);
    console.log(`Price:      ${carData.price_range}`);
    console.log('');
    console.log('Data populated:');
    console.log(`  ✅ cars table (55 fields)`);
    console.log(`  ✅ ${issues.length} known issues`);
    console.log(`  ✅ ${serviceIntervals.length} service intervals`);
    console.log(`  ✅ Maintenance specs`);
    console.log(`  ✅ Tuning profile skeleton`);
    console.log(`  ${heroUrl ? '✅' : '⏭️'} Hero image`);
    console.log('');
    console.log(`⏱️  Duration: ${duration}s`);
    console.log('');

    if (!flags.dryRun) {
      console.log(`View at: /browse-cars/${carData.slug}`);
    }
  } catch (err) {
    log(`Fatal error: ${err.message}`, 'error');
    if (flags.verbose) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
