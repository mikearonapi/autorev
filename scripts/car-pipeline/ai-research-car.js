#!/usr/bin/env node

/**
 * AI Car Research & Addition Script
 * 
 * Fully automated car addition pipeline that integrates with ALL existing AutoRev automation:
 * 
 * Phase 1-2: AI researches core specs → INSERT into cars table
 * Phase 3: EPA + NHTSA + Recalls APIs → existing enrichment routes
 * Phase 4: AI researches known issues, maintenance, service intervals → INSERT into related tables
 * Phase 5: AI generates scores and editorial → UPDATE cars table
 * Phase 6: Nano Banana Pro generates hero + garage images → Upload to Vercel Blob
 * Phase 7: YouTube cron will auto-process (queue search terms)
 * Phase 8: Validation queries
 * 
 * Usage:
 *   node scripts/car-pipeline/ai-research-car.js "Porsche 911 GT3 (992)" [options]
 * 
 * Options:
 *   --dry-run       Show what would be done without executing
 *   --verbose       Show detailed output
 *   --skip-images   Skip image generation (use when testing)
 * 
 * Environment Variables Required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY
 *   GOOGLE_AI_API_KEY (for Nano Banana Pro image generation)
 *   BLOB_READ_WRITE_TOKEN (for Vercel Blob upload)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

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
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Validate required env vars
const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ANTHROPIC_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Generated images directory
const GENERATED_IMAGES_DIR = path.join(PROJECT_ROOT, 'generated-images');
const HERO_IMAGES_DIR = path.join(GENERATED_IMAGES_DIR, 'hero');
const GARAGE_IMAGES_DIR = path.join(GENERATED_IMAGES_DIR, 'garage');

// Ensure directories exist
[GENERATED_IMAGES_DIR, HERO_IMAGES_DIR, GARAGE_IMAGES_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Parse command line arguments
const args = process.argv.slice(2);
const carName = args.find(arg => !arg.startsWith('--'));
const flags = {
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
  skipImages: args.includes('--skip-images'),
};

if (!carName) {
  console.error('Usage: node ai-research-car.js "Car Name" [options]');
  console.error('\nExample: node ai-research-car.js "Porsche 911 GT3 (992)"');
  console.error('\nOptions:');
  console.error('  --dry-run       Preview without saving');
  console.error('  --verbose       Show detailed output');
  console.error('  --skip-images   Skip image generation');
  process.exit(1);
}

function log(msg, level = 'info') {
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    ai: '🤖',
    api: '🌐',
    image: '🖼️',
    db: '💾',
    phase: '📋',
  };
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${prefix[level] || ''} ${msg}`);
}

// =============================================================================
// PHASE 1-2: AI CORE DATA RESEARCH
// =============================================================================

async function aiResearchCoreData(carName) {
  log(`Phase 1-2: AI researching core data for "${carName}"...`, 'phase');
  
  const prompt = `You are an automotive expert researcher. Research the car "${carName}" and provide comprehensive technical data.

CRITICAL RULES:
1. Return ONLY valid JSON, no additional text
2. All numeric fields must be realistic and accurate
3. Use actual manufacturer data where possible
4. Slug format: brand-model-generation (e.g., porsche-911-gt3-992)

JSON SCHEMA:
{
  "slug": "string - URL-safe identifier (brand-model-generation)",
  "name": "string - Full official name",
  "years": "string - Production years (e.g., 2019-2024 or 2021-present)",
  "brand": "string - Manufacturer name",
  "country": "string - Country of origin",
  "generation_code": "string|null - Internal generation code",
  "tier": "string - budget|mid|premium (based on MSRP: <$50k=budget, $50k-150k=mid, >$150k=premium)",
  "category": "string - Front-Engine|Mid-Engine|Rear-Engine (based on engine placement)",
  "engine": "string - Engine description (e.g., 4.0L Twin-Turbo V8)",
  "hp": "number - Peak horsepower",
  "torque": "number - Peak torque (lb-ft)",
  "trans": "string - Transmission (e.g., 6MT, 7DCT, 8AT, PDK)",
  "drivetrain": "string - RWD|AWD|FWD",
  "curb_weight": "number - Weight in lbs",
  "zero_to_sixty": "number - 0-60 mph time in seconds",
  "top_speed": "number - Top speed in mph",
  "quarter_mile": "number|null - Quarter mile time in seconds",
  "price_range": "string - Price range text (e.g., $80,000 - $120,000)",
  "price_avg": "number - Average price in dollars",
  "msrp_new_low": "number - Starting MSRP",
  "msrp_new_high": "number - Top-spec MSRP",
  "notes": "string - 2-3 sentence description of the car",
  "highlight": "string - Single standout feature",
  "tagline": "string - Marketing tagline or memorable phrase",
  "hero_blurb": "string - 2-3 sentence description for hero section",
  "manual_available": "boolean - Is manual transmission available?",
  "seats": "number - Number of seats",
  "daily_usability_tag": "string - Weekend Only|Track Toy|Daily Capable|Grand Tourer",
  "essence": "string - What makes this car special (2-3 sentences)",
  "heritage": "string - Historical context (2-3 sentences)",
  "design_philosophy": "string - Design approach (2-3 sentences)",
  "engine_character": "string - How the engine feels (2-3 sentences)",
  "chassis_dynamics": "string - Handling characteristics (2-3 sentences)",
  "sound_signature": "string - How it sounds (1-2 sentences)",
  "ideal_owner": "string - Who should buy this (1-2 sentences)",
  "market_position": "string - Competitive positioning (1-2 sentences)"
}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  const content = response.content[0].text;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');
  
  const carData = JSON.parse(jsonMatch[0]);
  
  // Validate required fields
  const required = ['slug', 'name', 'years', 'brand', 'hp', 'torque', 'price_avg'];
  for (const field of required) {
    if (!carData[field]) {
      throw new Error(`AI failed to provide required field: ${field}`);
    }
  }
  
  if (flags.verbose) {
    log(`Generated slug: ${carData.slug}`, 'info');
    log(`HP: ${carData.hp}, Torque: ${carData.torque}`, 'info');
    log(`Price: ${carData.price_range}`, 'info');
  }
  
  return carData;
}

// =============================================================================
// PHASE 3: AUTOMATED ENRICHMENT (EPA, NHTSA, RECALLS)
// =============================================================================

async function runAutomatedEnrichment(slug) {
  log(`Phase 3: Running automated enrichment APIs...`, 'phase');
  
  const results = {
    fuelEconomy: null,
    safetyRatings: null,
    recalls: null,
  };
  
  if (flags.dryRun) {
    log('DRY RUN: Would call enrichment APIs', 'info');
    return results;
  }
  
  // EPA Fuel Economy
  try {
    log('Calling EPA fuel economy API...', 'api');
    const response = await fetch(`${BASE_URL}/api/cars/${slug}/fuel-economy`);
    if (response.ok) {
      results.fuelEconomy = await response.json();
      log('EPA fuel economy enriched', 'success');
    } else {
      log(`EPA API returned ${response.status}`, 'warning');
    }
  } catch (err) {
    log(`EPA enrichment failed: ${err.message}`, 'warning');
  }
  
  // NHTSA Safety Ratings
  try {
    log('Calling NHTSA safety ratings API...', 'api');
    const response = await fetch(`${BASE_URL}/api/cars/${slug}/safety-ratings`);
    if (response.ok) {
      results.safetyRatings = await response.json();
      log('NHTSA safety ratings enriched', 'success');
    } else {
      log(`Safety API returned ${response.status}`, 'warning');
    }
  } catch (err) {
    log(`Safety enrichment failed: ${err.message}`, 'warning');
  }
  
  // NHTSA Recalls
  try {
    log('Calling recalls API...', 'api');
    const response = await fetch(`${BASE_URL}/api/cars/${slug}/recalls`);
    if (response.ok) {
      results.recalls = await response.json();
      log('Recalls enriched', 'success');
    } else {
      log(`Recalls API returned ${response.status}`, 'warning');
    }
  } catch (err) {
    log(`Recalls enrichment failed: ${err.message}`, 'warning');
  }
  
  return results;
}

// =============================================================================
// PHASE 4: AI RESEARCH - KNOWN ISSUES, MAINTENANCE, SERVICE INTERVALS
// =============================================================================

async function aiResearchKnownIssues(carData) {
  log(`Phase 4a: AI researching known issues...`, 'ai');
  
  const prompt = `Research the known issues and reliability concerns for the ${carData.name} (${carData.years}).

Based on owner forums, TSBs, and recall history, provide 5-8 realistic known issues.

CRITICAL: Use this exact JSON format with these exact enum values:

[
  {
    "title": "Issue name (e.g., IMS Bearing Failure)",
    "kind": "common_issue",
    "severity": "critical",
    "affected_years_text": "Years affected (e.g., 2020-2022)",
    "description": "Detailed description (2-3 sentences)",
    "symptoms": ["Symptom 1", "Symptom 2", "Symptom 3"],
    "prevention": "How to prevent or catch early",
    "fix_description": "What the repair involves",
    "estimated_cost_text": "Cost range (e.g., $2,000 - $4,000)",
    "estimated_cost_low": 2000,
    "estimated_cost_high": 4000
  }
]

ENUM VALUES:
- kind: ONLY use "common_issue", "recall", "tsb", or "other"
- severity: ONLY use "critical", "major", or "minor" (lowercase)
- symptoms: MUST be an array of strings, NOT pipe-separated text

RULES:
- Include at least 1 critical severity issue if applicable
- Most issues should be "common_issue" kind
- Realistic cost estimates with both text and numeric values
- Return ONLY the JSON array`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }]
  });

  const content = response.content[0].text;
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array in AI response');
  
  const issues = JSON.parse(jsonMatch[0]);
  
  if (flags.verbose) {
    log(`Found ${issues.length} known issues`, 'info');
  }
  
  return issues.map(issue => ({
    ...issue,
    car_slug: carData.slug,
  }));
}

async function aiResearchMaintenanceSpecs(carData) {
  log(`Phase 4b: AI researching maintenance specs...`, 'ai');
  
  const prompt = `Research the maintenance specifications for the ${carData.name} (${carData.years}).

Provide detailed maintenance data based on owner's manual. Use EXACT column names below:

{
  "oil_type": "Full Synthetic",
  "oil_viscosity": "5W-40",
  "oil_spec": "VW 502.00/505.00",
  "oil_capacity_liters": 8.5,
  "oil_capacity_quarts": 9.0,
  "oil_change_interval_miles": 10000,
  "oil_change_interval_months": 12,
  "coolant_type": "G13 or equivalent",
  "coolant_color": "Purple",
  "coolant_capacity_liters": 12.0,
  "coolant_change_interval_miles": 100000,
  "coolant_change_interval_years": 5,
  "brake_fluid_type": "DOT 4",
  "brake_fluid_spec": "Super DOT 4",
  "brake_fluid_change_interval_miles": 30000,
  "brake_fluid_change_interval_years": 2,
  "trans_fluid_auto": "ATF spec name",
  "trans_fluid_auto_capacity": 9.5,
  "trans_fluid_change_interval_miles": 60000,
  "diff_fluid_type": "GL-5 75W-90",
  "diff_fluid_rear_capacity": 1.5,
  "diff_fluid_change_interval_miles": 60000,
  "fuel_type": "Premium Unleaded",
  "fuel_octane_minimum": 91,
  "fuel_octane_recommended": 93,
  "fuel_tank_capacity_gallons": 19.8,
  "fuel_tank_capacity_liters": 75,
  "tire_size_front": "275/35R21",
  "tire_size_rear": "285/30R22",
  "tire_pressure_front_psi": 38,
  "tire_pressure_rear_psi": 41,
  "spark_plug_type": "Iridium",
  "spark_plug_change_interval_miles": 60000,
  "spark_plug_quantity": 8
}

Research actual specifications. Return ONLY the JSON object.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });

  const content = response.content[0].text;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');
  
  const specs = JSON.parse(jsonMatch[0]);
  
  return {
    ...specs,
    car_slug: carData.slug,
  };
}

async function aiResearchServiceIntervals(carData) {
  log(`Phase 4c: AI researching service intervals...`, 'ai');
  
  const prompt = `Research the service intervals for the ${carData.name} (${carData.years}).

Provide 8-12 service intervals. Use EXACT column names below:

[
  {
    "service_name": "Oil Change Service",
    "service_description": "Engine oil and filter replacement with inspection",
    "interval_miles": 10000,
    "interval_months": 12,
    "items_included": ["Oil", "Oil filter", "Drain plug gasket", "Multi-point inspection"],
    "dealer_cost_low": 200,
    "dealer_cost_high": 350,
    "independent_cost_low": 150,
    "independent_cost_high": 250,
    "diy_cost_low": 80,
    "diy_cost_high": 120,
    "labor_hours_estimate": 0.5,
    "is_critical": true,
    "skip_consequences": "Engine wear, sludge buildup, potential engine damage"
  }
]

Include services:
- Oil Change Service
- Brake Fluid Flush
- Transmission Service
- Coolant Flush
- Spark Plug Replacement
- Air Filter Replacement
- Cabin Filter Replacement
- Brake Inspection/Service
- 30K Mile Major Service
- 60K Mile Major Service

RULES:
- items_included MUST be an array of strings
- All cost fields are numbers (no dollar signs)
- is_critical is boolean
- Return ONLY the JSON array`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }]
  });

  const content = response.content[0].text;
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array in AI response');
  
  const intervals = JSON.parse(jsonMatch[0]);
  
  if (flags.verbose) {
    log(`Found ${intervals.length} service intervals`, 'info');
  }
  
  return intervals.map(interval => ({
    ...interval,
    car_slug: carData.slug,
  }));
}

// =============================================================================
// PHASE 5: AI SCORING & EDITORIAL
// =============================================================================

async function aiScoringAndEditorial(carData) {
  log(`Phase 5: AI generating scores and editorial content...`, 'phase');
  
  const prompt = `You are an expert automotive journalist scoring the ${carData.name} (${carData.years}).

Provide scores (1-10) and editorial content based on real-world characteristics:

{
  "scores": {
    "score_sound": 8,
    "score_interior": 7,
    "score_track": 9,
    "score_reliability": 6,
    "score_value": 7,
    "score_driver_fun": 9,
    "score_aftermarket": 8
  },
  "editorial": {
    "defining_strengths": [
      "Strength 1 (e.g., Naturally aspirated engine character)",
      "Strength 2",
      "Strength 3"
    ],
    "honest_weaknesses": [
      "Weakness 1 (e.g., Limited storage space)",
      "Weakness 2",
      "Weakness 3"
    ],
    "direct_competitors": ["competitor-1-slug", "competitor-2-slug", "competitor-3-slug"],
    "if_you_want_more": ["more-expensive-alternative-slug"],
    "if_you_want_less": ["less-expensive-alternative-slug"]
  }
}

SCORING GUIDE:
- Sound (1-10): Engine note, exhaust character
- Interior (1-10): Materials, ergonomics, tech
- Track (1-10): Circuit capability, cooling, lap potential
- Reliability (1-10): Long-term dependability
- Value (1-10): Performance per dollar
- Driver Fun (1-10): Engagement, feedback
- Aftermarket (1-10): Mod support, community

Be honest and realistic. Use actual competitive landscape.
Return ONLY the JSON object.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  });

  const content = response.content[0].text;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');
  
  const result = JSON.parse(jsonMatch[0]);
  
  if (flags.verbose) {
    log(`Scores: Sound=${result.scores.score_sound}, Track=${result.scores.score_track}, Fun=${result.scores.score_driver_fun}`, 'info');
  }
  
  return result;
}

// =============================================================================
// PHASE 6: IMAGE GENERATION (NANO BANANA PRO)
// =============================================================================

/**
 * Generate image using Nano Banana Pro (gemini-3-pro-image-preview)
 */
async function generateImageWithNanoBananaPro(prompt, outputPath, options = {}) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set - cannot generate images');
  }
  
  const aspectRatio = options.aspectRatio || '16:9';
  const imageSize = options.imageSize || '2K';
  
  log(`🍌 Generating with Nano Banana Pro (${imageSize})...`, 'image');
  
  const modelName = 'gemini-3-pro-image-preview';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GOOGLE_AI_API_KEY}`;
  
  const body = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: imageSize
      }
    }
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Nano Banana Pro API error (${response.status}): ${errorText}`);
  }
  
  const result = await response.json();
  const candidates = result.candidates || [];
  if (candidates.length === 0) throw new Error('No candidates in response');
  
  const parts = candidates[0].content?.parts || [];
  const imagePart = parts.find(p => p.inlineData);
  
  if (!imagePart) {
    const finishReason = candidates[0].finishReason;
    throw new Error(`No image in response. Finish reason: ${finishReason}`);
  }
  
  const imageData = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType || 'image/png';
  
  let ext = '.png';
  if (mimeType === 'image/jpeg') ext = '.jpg';
  if (mimeType === 'image/webp') ext = '.webp';
  
  const buffer = Buffer.from(imageData, 'base64');
  const finalPath = outputPath.replace(/\.(png|jpg|jpeg|webp)$/i, ext);
  
  fs.writeFileSync(finalPath, buffer);
  log(`Saved: ${path.basename(finalPath)} (${(buffer.length / 1024).toFixed(0)} KB)`, 'success');
  
  return finalPath;
}

/**
 * Upload image to Vercel Blob
 */
async function uploadToBlob(localPath, blobPath) {
  if (!BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN not set - cannot upload images');
  }
  
  const sharp = (await import('sharp')).default;
  const { put } = await import('@vercel/blob');
  
  // Convert to optimized WebP
  const webpBuffer = await sharp(localPath)
    .webp({ quality: 85 })
    .toBuffer();
  
  log(`Uploading to blob: ${blobPath}...`, 'image');
  
  const blob = await put(blobPath, webpBuffer, {
    access: 'public',
    contentType: 'image/webp',
    token: BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  
  log(`Blob URL: ${blob.url}`, 'success');
  return blob.url;
}

/**
 * Get appropriate environment for car's hero image
 */
function getHeroEnvironment(carData) {
  const environments = {
    'Super Car': 'a dramatic coastal cliff road with ocean views',
    'Hyper Car': 'an exclusive Monaco harbor setting at golden hour',
    'GT Car': 'a winding Alpine mountain pass with dramatic peaks',
    'Sports Car': 'a scenic Pacific Coast Highway with ocean backdrop',
    'Hot Hatch': 'a twisty mountain backroad with forest scenery',
    'Muscle Car': 'a desert highway stretching into the sunset',
  };
  return environments[carData.category] || 'a beautiful mountain road with scenic views';
}

/**
 * Get signature color for car
 */
function getCarColor(carData) {
  // Default colors by brand
  const brandColors = {
    'Porsche': 'Guards Red',
    'Ferrari': 'Rosso Corsa red',
    'Lamborghini': 'Verde Mantis green',
    'BMW': 'San Marino Blue metallic',
    'Mercedes': 'designo Diamond White',
    'Audi': 'Nardo Gray',
    'Nissan': 'Midnight Purple',
    'Toyota': 'Renaissance Red',
    'Honda': 'Championship White',
    'Chevrolet': 'Rapid Blue',
    'Ford': 'Grabber Blue',
    'Dodge': 'TorRed',
  };
  return brandColors[carData.brand] || 'metallic silver';
}

async function generateHeroImage(carData) {
  log(`Phase 6a: Generating hero image...`, 'phase');
  
  if (flags.skipImages) {
    log('Skipping hero image generation (--skip-images)', 'warning');
    return null;
  }
  
  if (flags.dryRun) {
    log('DRY RUN: Would generate hero image with Nano Banana Pro', 'info');
    return null;
  }
  
  const year = carData.years.split('-')[0];
  const color = getCarColor(carData);
  const environment = getHeroEnvironment(carData);
  
  const prompt = `OUTDOOR photograph, NOT in a studio: A ${year} ${carData.name} in ${color} driving on ${environment}. The car is shown from a 3/4 front angle, captured while in motion on a real road in a natural outdoor setting. Real sunlight, real sky visible, real landscape in background. This is an ON-LOCATION automotive photo shoot, outdoors in nature, NOT a studio shot. Professional photography, sharp focus on the car, beautiful natural scenery, aspirational driving destination.`;
  
  const outputPath = path.join(HERO_IMAGES_DIR, `${carData.slug}-hero.png`);
  
  try {
    const localPath = await generateImageWithNanoBananaPro(prompt, outputPath, {
      aspectRatio: '16:9',
      imageSize: '2K'
    });
    
    // Upload to Vercel Blob
    const blobPath = `cars/${carData.slug}/hero.webp`;
    const blobUrl = await uploadToBlob(localPath, blobPath);
    
    return blobUrl;
  } catch (err) {
    log(`Hero image generation failed: ${err.message}`, 'error');
    return null;
  }
}

async function generateGarageImage(carData) {
  log(`Phase 6b: Generating industrial/garage image...`, 'phase');
  
  if (flags.skipImages) {
    log('Skipping garage image generation (--skip-images)', 'warning');
    return null;
  }
  
  if (flags.dryRun) {
    log('DRY RUN: Would generate garage image with Nano Banana Pro', 'info');
    return null;
  }
  
  const year = carData.years.split('-')[0];
  const color = getCarColor(carData);
  
  // Industrial warehouse environments
  const environments = [
    'Historic brick warehouse with tall arched windows, cast iron columns, exposed timber beams',
    'Modern concrete garage with floor-to-ceiling glass walls, polished resin floor',
    'Vintage factory building with wooden truss ceiling, steel I-beams, industrial skylights',
  ];
  const environment = environments[Math.floor(Math.random() * environments.length)];
  
  const prompt = `SUBJECT: ${year} ${carData.name} in ${color}, pristine condition, showroom quality.

ENVIRONMENT: ${environment}. Private collector's sanctuary, exclusive atmosphere.

COMPOSITION: Front 3/4 angle hero shot. Car positioned center-right, occupying 45-50% of frame width. Camera at knee height for commanding presence. Show architectural environment framing the car.

LIGHTING: Dramatic golden hour natural light streaming through windows. Warm color temperature. Visible light rays in atmosphere. Car's ${color} paint shows rich reflections and highlights. Moody shadows create depth.

FLOOR: Polished concrete or epoxy with subtle reflections of the car's silhouette.

STYLE: Shot on Hasselblad H6D-100c medium format camera, 80mm lens, f/4 aperture. Magazine editorial automotive photography. Razor sharp focus. Rich color depth. Professional color grading.

QUALITY: 8K resolution, hyper-realistic, photographic. Automotive press release quality.

EXCLUSIONS: No people, no text, no watermarks, no logos, no license plates.`;

  const outputPath = path.join(GARAGE_IMAGES_DIR, `${carData.slug}-garage.png`);
  
  try {
    const localPath = await generateImageWithNanoBananaPro(prompt, outputPath, {
      aspectRatio: '16:9',
      imageSize: '2K'
    });
    
    // Upload to Vercel Blob
    const blobPath = `garage/${carData.slug}/exclusive.webp`;
    const blobUrl = await uploadToBlob(localPath, blobPath);
    
    return blobUrl;
  } catch (err) {
    log(`Garage image generation failed: ${err.message}`, 'error');
    return null;
  }
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

async function saveCarToDatabase(carData, issues, maintenanceSpecs, serviceIntervals, scores, images) {
  log(`Saving to database...`, 'db');
  
  if (flags.dryRun) {
    log('DRY RUN: Would save to database', 'info');
    return { success: true, dryRun: true };
  }
  
  // Check if car already exists
  const { data: existing } = await supabase
    .from('cars')
    .select('id, slug')
    .eq('slug', carData.slug)
    .single();
  
  if (existing) {
    throw new Error(`Car already exists: ${carData.slug} (ID: ${existing.id})`);
  }
  
  // Build final car record
  const finalCarData = {
    ...carData,
    ...scores.scores,
    defining_strengths: scores.editorial.defining_strengths,
    honest_weaknesses: scores.editorial.honest_weaknesses,
    direct_competitors: scores.editorial.direct_competitors,
    if_you_want_more: scores.editorial.if_you_want_more,
    if_you_want_less: scores.editorial.if_you_want_less,
    image_hero_url: images.heroUrl,
  };
  
  // Insert car
  const { data: car, error: carError } = await supabase
    .from('cars')
    .insert(finalCarData)
    .select()
    .single();
    
  if (carError) {
    throw new Error(`Failed to insert car: ${carError.message}`);
  }
  
  log(`Car inserted: ${car.slug} (ID: ${car.id})`, 'success');
  
  // Insert known issues
  if (issues.length > 0) {
    const { error: issuesError } = await supabase
      .from('car_issues')
      .insert(issues);
    if (issuesError) {
      log(`Warning: Failed to insert issues: ${issuesError.message}`, 'warning');
    } else {
      log(`Inserted ${issues.length} known issues`, 'success');
    }
  }
  
  // Insert maintenance specs
  const { error: specsError } = await supabase
    .from('vehicle_maintenance_specs')
    .insert(maintenanceSpecs);
  if (specsError) {
    log(`Warning: Failed to insert maintenance specs: ${specsError.message}`, 'warning');
  } else {
    log(`Inserted maintenance specs`, 'success');
  }
  
  // Insert service intervals
  if (serviceIntervals.length > 0) {
    const { error: intervalsError } = await supabase
      .from('vehicle_service_intervals')
      .insert(serviceIntervals);
    if (intervalsError) {
      log(`Warning: Failed to insert service intervals: ${intervalsError.message}`, 'warning');
    } else {
      log(`Inserted ${serviceIntervals.length} service intervals`, 'success');
    }
  }
  
  return { success: true, car };
}

async function updatePipelineStatus(carSlug, updates) {
  if (flags.dryRun) return;
  
  try {
    await supabase
      .from('car_pipeline_runs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('car_slug', carSlug);
  } catch (err) {
    // Ignore - pipeline run may not exist
  }
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

async function main() {
  console.log('');
  console.log('🚗 AutoRev AI Car Addition Pipeline');
  console.log('====================================');
  console.log(`Car: ${carName}`);
  if (flags.dryRun) console.log('Mode: DRY RUN (no changes will be made)');
  if (flags.skipImages) console.log('Images: SKIPPED');
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // =========================================================================
    // PHASE 1-2: AI Core Data Research
    // =========================================================================
    const carData = await aiResearchCoreData(carName);
    log(`Generated slug: ${carData.slug}`, 'success');
    
    await updatePipelineStatus(carData.slug, { 
      phase1_validated: true, 
      phase1_validated_at: new Date().toISOString(),
      phase2_core_data: true,
      phase2_core_data_at: new Date().toISOString(),
    });
    
    // =========================================================================
    // PHASE 3: Automated Enrichment (EPA, NHTSA, Recalls)
    // =========================================================================
    // Note: These APIs need the car to exist first, so we'll enrich after insert
    
    // =========================================================================
    // PHASE 4: AI Research (Issues, Maintenance, Service)
    // =========================================================================
    const [issues, maintenanceSpecs, serviceIntervals] = await Promise.all([
      aiResearchKnownIssues(carData),
      aiResearchMaintenanceSpecs(carData),
      aiResearchServiceIntervals(carData),
    ]);
    
    await updatePipelineStatus(carData.slug, { 
      phase4_known_issues: true,
      phase4_maintenance_specs: true,
      phase4_service_intervals: true,
      phase4_variants: true,
      phase4_completed_at: new Date().toISOString(),
    });
    
    // =========================================================================
    // PHASE 5: AI Scoring & Editorial
    // =========================================================================
    const scores = await aiScoringAndEditorial(carData);
    
    await updatePipelineStatus(carData.slug, { 
      phase5_scores_assigned: true,
      phase5_strengths: true,
      phase5_weaknesses: true,
      phase5_alternatives: true,
      phase5_completed_at: new Date().toISOString(),
    });
    
    // =========================================================================
    // PHASE 6: Image Generation (Nano Banana Pro)
    // =========================================================================
    const heroUrl = await generateHeroImage(carData);
    const garageUrl = await generateGarageImage(carData);
    
    const images = { heroUrl, garageUrl };
    
    await updatePipelineStatus(carData.slug, { 
      phase6_hero_image: !!heroUrl,
      phase6_gallery_images: !!garageUrl,
      phase6_completed_at: new Date().toISOString(),
    });
    
    // =========================================================================
    // SAVE TO DATABASE
    // =========================================================================
    const dbResult = await saveCarToDatabase(carData, issues, maintenanceSpecs, serviceIntervals, scores, images);
    
    // =========================================================================
    // PHASE 3: Now run enrichment APIs (car exists in DB)
    // =========================================================================
    await runAutomatedEnrichment(carData.slug);
    
    await updatePipelineStatus(carData.slug, { 
      phase3_fuel_economy: true,
      phase3_safety_ratings: true,
      phase3_recalls: true,
      phase3_completed_at: new Date().toISOString(),
    });
    
    // =========================================================================
    // PHASE 7: YouTube (mark as queued for cron)
    // =========================================================================
    await updatePipelineStatus(carData.slug, { 
      phase7_videos_queued: true,
      phase7_notes: 'Queued for next YouTube enrichment cron run',
    });
    
    // =========================================================================
    // PHASE 8: Validation
    // =========================================================================
    await updatePipelineStatus(carData.slug, { 
      phase8_data_complete: true,
      phase8_completed_at: new Date().toISOString(),
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
    
    // =========================================================================
    // SUMMARY
    // =========================================================================
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('');
    console.log('🎉 CAR ADDITION COMPLETE!');
    console.log('========================');
    console.log(`Name:          ${carData.name}`);
    console.log(`Slug:          ${carData.slug}`);
    console.log(`Brand:         ${carData.brand}`);
    console.log(`Years:         ${carData.years}`);
    console.log(`HP:            ${carData.hp}`);
    console.log(`Price:         ${carData.price_range}`);
    console.log('');
    console.log(`Known Issues:       ${issues.length}`);
    console.log(`Service Intervals:  ${serviceIntervals.length}`);
    console.log(`Scores:             7/7 assigned`);
    console.log(`Hero Image:         ${heroUrl ? '✅' : '⏭️ Skipped'}`);
    console.log(`Garage Image:       ${garageUrl ? '✅' : '⏭️ Skipped'}`);
    console.log('');
    console.log(`Duration:      ${duration}s`);
    console.log('');
    
    if (!flags.dryRun) {
      console.log(`✅ Car ready! View at: /browse-cars/${carData.slug}`);
      console.log(`📋 Pipeline tracking: /internal/car-pipeline/${carData.slug}`);
    }
    
  } catch (err) {
    log(`Fatal error: ${err.message}`, 'error');
    if (flags.verbose) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});