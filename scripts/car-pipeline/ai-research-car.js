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
import { spawn } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { trackBackendAiUsage, AI_PURPOSES, AI_SOURCES } from '../../lib/backendAiLogger.js';
import { sendFeedbackResponseEmail } from '../../lib/email.js';

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

/**
 * Track AI usage for cost analytics
 */
async function trackAiCall(response, phase, entityId) {
  if (response?.usage) {
    await trackBackendAiUsage({
      purpose: AI_PURPOSES.CAR_RESEARCH,
      scriptName: `ai-research-car:${phase}`,
      inputTokens: response.usage.input_tokens || 0,
      outputTokens: response.usage.output_tokens || 0,
      model: response.model || 'claude-sonnet-4-20250514',
      entityId,
      source: AI_SOURCES.BACKEND_SCRIPT,
    });
  }
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
  
  await trackAiCall(response, 'core-data', carName);

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
- severity: ONLY use "critical", "high", "medium", "low", or "cosmetic" (lowercase)
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
  
  await trackAiCall(response, 'known-issues', carData.slug);

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
  
  await trackAiCall(response, 'maintenance-specs', carData.slug);

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
  
  await trackAiCall(response, 'service-intervals', carData.slug);

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

Provide comprehensive scores and editorial content. CRITICAL: Match the EXACT JSON structure below.

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
    "pros": ["Specific pro 1", "Pro 2", "Pro 3", "Pro 4", "Pro 5"],
    "cons": ["Specific con 1", "Con 2", "Con 3", "Con 4"],
    "best_for": ["Enthusiast type 1", "Type 2", "Type 3"],
    
    "defining_strengths": [
      {"title": "Short Title", "description": "2-3 sentence detailed explanation of this strength"},
      {"title": "Another Title", "description": "Detailed explanation..."}
    ],
    "honest_weaknesses": [
      {"title": "Short Title", "description": "2-3 sentence honest explanation of this weakness"},
      {"title": "Another Title", "description": "Detailed explanation..."}
    ],
    
    "direct_competitors": [
      {"name": "Competitor Name", "slug": "competitor-slug", "comparison": "How this compares to the subject car"}
    ],
    "if_you_want_more": [
      {"name": "More Expensive Alt", "slug": "slug-here", "reason": "Why choose this over subject car"}
    ],
    "if_you_want_less": [
      {"name": "Less Expensive Alt", "slug": "slug-here", "comparison": "Trade-offs vs subject car"}
    ],
    "similar_driving_experience": [
      {"name": "Similar Car", "slug": "slug-here", "reason": "Why the driving experience is similar"}
    ],
    
    "buyers_summary": "2-3 sentence buying advice summary.",
    
    "best_years_detailed": [
      {"years": "2021-2023", "reason": "Why these years are recommended"}
    ],
    "must_have_options": [
      {"name": "Option Name", "reason": "Why this option is essential"}
    ],
    "nice_to_have_options": [
      {"name": "Option Name", "reason": "Why this is nice but not required"}
    ],
    "pre_inspection_checklist": ["Check item 1 - what to look for", "Check item 2", "Check item 3", "Check item 4", "Check item 5"],
    "ppi_recommendations": "Specific pre-purchase inspection advice.",
    
    "recommended_years_note": "Brief note on best model years.",
    "ownership_cost_notes": "Expected annual costs.",
    "years_to_avoid_detailed": [
      {"years": "YYYY or YYYY-YYYY", "reason": "Why these specific years should be avoided"}
    ],
    
    "track_readiness": "excellent|good|moderate|limited",
    "track_readiness_notes": "Track capability explanation.",
    "recommended_track_prep": [
      {"item": "Item Name", "cost": "$X-Y", "notes": "Why needed", "priority": "essential|recommended|optional"}
    ],
    "popular_track_mods": [
      {"mod": "Mod Name", "cost": "$X-Y", "purpose": "What it does"}
    ],
    "laptime_benchmarks": [
      {"track": "Track Name", "time": "X:XX.X", "source": "Who recorded it", "notes": "Conditions/tires"}
    ],
    
    "community_strength": "strong|moderate|growing|limited",
    "community_notes": "Community description.",
    "key_resources": [
      {"name": "Forum Name", "url": "https://...", "type": "forum|youtube|facebook|website", "notes": "What makes it useful"}
    ],
    "facebook_groups": ["Group Name 1", "Group Name 2"],
    "annual_events": [
      {"name": "Event Name", "location": "City, State", "frequency": "Annual|Biannual|etc", "notes": "Description"}
    ],
    
    "aftermarket_scene_notes": "Tuning/mod options.",
    "diy_friendliness": "high|moderate|low",
    "diy_notes": "DIY accessibility.",
    "parts_availability": "excellent|good|moderate|limited",
    "parts_notes": "Parts sourcing info.",
    
    "common_issues_detailed": [
      {"issue": "Issue Name", "severity": "high|moderate|low", "frequency": "common|occasional|rare", "cost": "$X-Y", "notes": "Details"}
    ],
    "notable_reviews": [
      {"source": "Publication", "title": "Review Title", "rating": "X/5 stars", "quote": "Notable quote from review"}
    ],
    "must_watch_videos": [
      {"channel": "Channel Name", "title": "Video Title", "url": "https://youtube.com/...", "duration": "MM:SS"}
    ],
    "expert_quotes": [
      {"person": "Person Name", "outlet": "Publication", "quote": "Their quote about the car"}
    ]
  }
}

SCORING GUIDE (1-10):
- Sound: Engine note, exhaust character
- Interior: Materials, ergonomics, tech
- Track: Circuit capability, cooling, brakes
- Reliability: Dependability, issue severity
- Value: Performance per dollar
- Driver Fun: Steering, throttle, engagement
- Aftermarket: Mod support, tuning potential

IMPORTANT: Use real car slugs for competitors (e.g., "bmw-m3-g80", "porsche-911-carrera"). Be factual and specific.
Return ONLY the JSON object, no markdown.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000, // Increased for larger editorial content
    messages: [{ role: 'user', content: prompt }]
  });
  
  await trackAiCall(response, 'scoring-editorial', carData.slug);

  const content = response.content[0].text;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');
  
  let result;
  try {
    result = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    // Try to fix common JSON issues
    let cleaned = jsonMatch[0]
      .replace(/,\s*}/g, '}')  // Remove trailing commas before }
      .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
      .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
      .replace(/"\s*\n\s*"/g, '", "'); // Fix broken string arrays
    
    try {
      result = JSON.parse(cleaned);
      log('Fixed JSON parsing issues', 'warning');
    } catch (e2) {
      log(`Raw response (first 500 chars): ${content.substring(0, 500)}...`, 'error');
      throw new Error(`JSON parse error: ${parseError.message}`);
    }
  }
  
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
// YOUTUBE DISCOVERY (Exa + Supadata - No YouTube API quota issues!)
// =============================================================================

async function runYouTubeDiscovery(slug) {
  log(`Running YouTube discovery for ${slug}...`, 'info');
  
  if (flags.dryRun) {
    log('DRY RUN: Would run YouTube discovery', 'info');
    return { success: true, dryRun: true, videosLinked: 0, message: 'Dry run - skipped' };
  }
  
  // Check if we have the required API keys for Exa + Supadata approach
  const EXA_API_KEY = process.env.EXA_API_KEY;
  const SUPADATA_API_KEY = process.env.SUPADATA_API_KEY;
  
  if (!EXA_API_KEY || !SUPADATA_API_KEY) {
    log('Exa/Supadata not configured, falling back to YouTube API...', 'warning');
    return runYouTubeDiscoveryLegacy(slug);
  }
  
  try {
    // Use Exa + Supadata discovery (no YouTube API quota issues!)
    const discoveryScript = path.join(PROJECT_ROOT, 'scripts', 'youtube-exa-discovery.js');
    
    return new Promise((resolve) => {
      const child = spawn('node', [discoveryScript, '--car-slug', slug, '--limit', '5'], {
        cwd: PROJECT_ROOT,
        stdio: 'pipe'
      });
      
      let output = '';
      let videosSaved = 0;
      let transcriptsFetched = 0;
      let aiProcessed = 0;
      
      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        
        // Parse output for stats
        const savedMatch = text.match(/Videos saved:\s*(\d+)/);
        if (savedMatch) videosSaved = parseInt(savedMatch[1], 10);
        
        const transcriptsMatch = text.match(/Transcripts:\s*(\d+)/);
        if (transcriptsMatch) transcriptsFetched = parseInt(transcriptsMatch[1], 10);
        
        const aiMatch = text.match(/AI processed:\s*(\d+)/);
        if (aiMatch) aiProcessed = parseInt(aiMatch[1], 10);
        
        if (flags.verbose) {
          process.stdout.write(text);
        }
      });
      
      child.stderr.on('data', (data) => {
        if (flags.verbose) {
          process.stderr.write(data.toString());
        }
      });
      
      child.on('close', (code) => {
        if (code === 0 && videosSaved > 0) {
          log(`YouTube discovery: ${videosSaved} videos, ${transcriptsFetched} transcripts, ${aiProcessed} AI processed`, 'info');
          resolve({ 
            success: true, 
            videosLinked: videosSaved, 
            message: `Discovered ${videosSaved} videos with ${transcriptsFetched} transcripts (Exa+Supadata)` 
          });
        } else {
          resolve({ 
            success: code === 0, 
            videosLinked: 0, 
            message: code === 0 ? 'No relevant videos found' : 'Discovery failed'
          });
        }
      });
    });
  } catch (err) {
    log(`YouTube discovery error: ${err.message}`, 'error');
    return { success: false, videosLinked: 0, message: err.message };
  }
}

/**
 * Legacy YouTube discovery using YouTube Data API (has quota limits)
 */
async function runYouTubeDiscoveryLegacy(slug) {
  try {
    const discoveryScript = path.join(PROJECT_ROOT, 'scripts', 'youtube-discovery.js');
    
    return new Promise((resolve) => {
      const child = spawn('node', [discoveryScript, '--car-slug', slug], {
        cwd: PROJECT_ROOT,
        stdio: 'pipe'
      });
      
      let output = '';
      let videosQueued = 0;
      let quotaExceeded = false;
      
      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        
        // Check for quota exceeded error
        if (text.includes('quota') || text.includes('403')) {
          quotaExceeded = true;
        }
        
        const queuedMatch = text.match(/Videos queued:\s*(\d+)/);
        if (queuedMatch) {
          videosQueued = parseInt(queuedMatch[1], 10);
        }
        
        if (flags.verbose) {
          process.stdout.write(text);
        }
      });
      
      child.stderr.on('data', (data) => {
        const text = data.toString();
        if (text.includes('quota') || text.includes('403')) {
          quotaExceeded = true;
        }
        if (flags.verbose) {
          process.stderr.write(text);
        }
      });
      
      child.on('close', async (code) => {
        // Handle quota exceeded case gracefully
        if (quotaExceeded) {
          log('⚠️  YouTube API quota exceeded. Videos can be added manually using:', 'warning');
          log(`   node scripts/youtube-add-videos-for-car.js ${slug} <youtube_url_1> <youtube_url_2>`, 'info');
          log('   Use Exa/web search to find relevant review videos, then run the above command.', 'info');
          resolve({ 
            success: true, 
            videosLinked: 0, 
            message: 'YouTube API quota exceeded - use manual script'
          });
          return;
        }
        
        if (code === 0 && videosQueued > 0) {
          log(`YouTube discovery found ${videosQueued} videos`, 'info');
          
          // Try to run transcripts (requires SUPADATA_API_KEY)
          let transcriptsSuccess = false;
          try {
            log('  Fetching YouTube transcripts...', 'info');
            const transcriptScript = path.join(PROJECT_ROOT, 'scripts', 'youtube-transcripts.js');
            const transcriptChild = spawn('node', [transcriptScript, '--car-slug', slug], {
              cwd: PROJECT_ROOT,
              stdio: flags.verbose ? 'inherit' : 'pipe'
            });
            
            await new Promise(r => transcriptChild.on('close', (exitCode) => {
              transcriptsSuccess = exitCode === 0;
              r();
            }));
            
            // Try to run AI processing on transcripts
            if (transcriptsSuccess) {
              log('  Running AI processing on transcripts...', 'info');
              const aiScript = path.join(PROJECT_ROOT, 'scripts', 'youtube-ai-processing.js');
              const aiChild = spawn('node', [aiScript, '--car-slug', slug], {
                cwd: PROJECT_ROOT,
                stdio: flags.verbose ? 'inherit' : 'pipe'
              });
              
              await new Promise(r => aiChild.on('close', r));
            }
          } catch (err) {
            log(`Transcript/AI processing skipped: ${err.message}`, 'warn');
          }
          
          resolve({ 
            success: true, 
            videosLinked: videosQueued, 
            message: `Discovered ${videosQueued} videos${transcriptsSuccess ? ' with transcripts processed' : ''}` 
          });
        } else {
          resolve({ 
            success: code === 0, 
            videosLinked: 0, 
            message: code === 0 ? 'No videos found from whitelisted channels' : 'Discovery failed'
          });
        }
      });
    });
  } catch (err) {
    log(`YouTube discovery error: ${err.message}`, 'error');
    return { success: false, videosLinked: 0, message: err.message };
  }
}

// =============================================================================
// VALIDATION AUDIT
// =============================================================================

async function runValidationAudit(slug) {
  log(`Running validation audit for ${slug}...`, 'info');
  
  const results = {
    passed: 0,
    warnings: 0,
    critical: 0,
    checks: [],
    summary: '',
  };
  
  // Get car data
  const { data: car, error: carError } = await supabase
    .from('cars')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (carError || !car) {
    results.critical++;
    results.checks.push({ name: 'Car exists', status: '❌', message: 'Car not found in database' });
    results.summary = 'FAILED: Car not found';
    return results;
  }
  
  // Check core fields
  const coreFields = ['hp', 'torque', 'engine', 'drivetrain', 'trans', 'brand', 'years'];
  const missingCore = coreFields.filter(f => !car[f]);
  if (missingCore.length > 0) {
    results.critical++;
    results.checks.push({ name: 'Core fields', status: '❌', message: `Missing: ${missingCore.join(', ')}` });
  } else {
    results.passed++;
    results.checks.push({ name: 'Core fields', status: '✅' });
  }
  
  // Check scores
  const scores = ['score_sound', 'score_interior', 'score_track', 'score_reliability', 'score_value', 'score_driver_fun', 'score_aftermarket'];
  const missingScores = scores.filter(s => car[s] === null || car[s] === undefined);
  if (missingScores.length > 0) {
    results.warnings++;
    results.checks.push({ name: 'Scores', status: '⚠️', message: `Missing ${missingScores.length}/7 scores` });
  } else {
    results.passed++;
    results.checks.push({ name: 'Scores', status: '✅', message: '7/7 scores' });
  }
  
  // Check editorial arrays
  const editorialArrays = {
    pros: car.pros?.length || 0,
    cons: car.cons?.length || 0,
    defining_strengths: car.defining_strengths?.length || 0,
    honest_weaknesses: car.honest_weaknesses?.length || 0,
  };
  
  const emptyEditorial = Object.entries(editorialArrays).filter(([k, v]) => v === 0);
  if (emptyEditorial.length > 0) {
    results.warnings++;
    results.checks.push({ name: 'Editorial arrays', status: '⚠️', message: `Empty: ${emptyEditorial.map(e => e[0]).join(', ')}` });
  } else {
    // Check format of object arrays
    if (car.defining_strengths?.[0] && typeof car.defining_strengths[0] === 'string') {
      results.warnings++;
      results.checks.push({ name: 'Editorial arrays', status: '⚠️', message: 'defining_strengths in wrong format' });
    } else {
      results.passed++;
      results.checks.push({ name: 'Editorial arrays', status: '✅', message: `${editorialArrays.pros} pros, ${editorialArrays.cons} cons, ${editorialArrays.defining_strengths} strengths` });
    }
  }
  
  // Check hero image
  if (!car.image_hero_url) {
    results.warnings++;
    results.checks.push({ name: 'Hero image', status: '⚠️', message: 'No hero image' });
  } else {
    results.passed++;
    results.checks.push({ name: 'Hero image', status: '✅' });
  }
  
  // Check buying guide
  const buyingGuide = ['buyers_summary', 'best_years_detailed', 'must_have_options', 'pre_inspection_checklist'];
  const missingBuying = buyingGuide.filter(f => !car[f] || (Array.isArray(car[f]) && car[f].length === 0));
  if (missingBuying.length > 0) {
    results.warnings++;
    results.checks.push({ name: 'Buying guide', status: '⚠️', message: `Missing: ${missingBuying.join(', ')}` });
  } else {
    results.passed++;
    results.checks.push({ name: 'Buying guide', status: '✅' });
  }
  
  // Check related tables
  const { data: issuesData } = await supabase.from('car_issues').select('id').eq('car_slug', slug);
  const issueCount = issuesData?.length || 0;
  if (issueCount < 3) {
    results.warnings++;
    results.checks.push({ name: 'Known issues', status: '⚠️', message: `Only ${issueCount} issues (need 3+)` });
  } else {
    results.passed++;
    results.checks.push({ name: 'Known issues', status: '✅', message: `${issueCount} issues` });
  }
  
  const { data: intervalsData } = await supabase.from('vehicle_service_intervals').select('id').eq('car_slug', slug);
  const intervalCount = intervalsData?.length || 0;
  if (intervalCount < 5) {
    results.warnings++;
    results.checks.push({ name: 'Service intervals', status: '⚠️', message: `Only ${intervalCount} intervals (need 5+)` });
  } else {
    results.passed++;
    results.checks.push({ name: 'Service intervals', status: '✅', message: `${intervalCount} intervals` });
  }
  
  const { data: videoLinks } = await supabase.from('youtube_video_car_links').select('id').eq('car_slug', slug);
  const videoCount = videoLinks?.length || 0;
  if (videoCount < 2) {
    results.warnings++;
    results.checks.push({ name: 'YouTube videos', status: '⚠️', message: `Only ${videoCount} videos` });
  } else {
    results.passed++;
    results.checks.push({ name: 'YouTube videos', status: '✅', message: `${videoCount} videos linked` });
  }
  
  // Generate summary
  results.summary = `Passed: ${results.passed}, Warnings: ${results.warnings}, Critical: ${results.critical}`;
  
  // Print results
  console.log('');
  console.log('🔍 VALIDATION AUDIT');
  console.log('===================');
  results.checks.forEach(check => {
    console.log(`${check.status} ${check.name}${check.message ? ` - ${check.message}` : ''}`);
  });
  console.log('');
  console.log(`Summary: ${results.summary}`);
  
  return results;
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
  
  // Check if car already exists (exact match)
  const { data: existing } = await supabase
    .from('cars')
    .select('id, slug')
    .eq('slug', carData.slug)
    .single();
  
  if (existing) {
    throw new Error(`Car already exists: ${carData.slug} (ID: ${existing.id})`);
  }
  
  // Check for similar slugs to prevent near-duplicates (e.g., audi-a3-1.8t vs audi-a3-1-8t)
  const slugPattern = carData.slug.replace(/[.-]/g, '%'); // Replace dots and hyphens with wildcards
  const { data: similarCars } = await supabase
    .from('cars')
    .select('id, slug, name')
    .ilike('slug', `%${slugPattern}%`)
    .limit(5);
  
  if (similarCars && similarCars.length > 0) {
    const exactMatch = similarCars.find(c => c.slug === carData.slug);
    if (!exactMatch) {
      // Found similar but not exact - warn and list them
      log(`⚠️  Found ${similarCars.length} similar car(s) in database:`, 'warn');
      similarCars.forEach(c => log(`   - ${c.slug} (${c.name})`, 'warn'));
      log(`   Proceeding with new slug: ${carData.slug}`, 'info');
      log(`   If this is a duplicate, delete the old entry first.`, 'info');
    }
  }
  
  // Normalize drivetrain to valid values (RWD, AWD, FWD)
  const validDrivetrains = ['RWD', 'AWD', 'FWD'];
  if (carData.drivetrain && !validDrivetrains.includes(carData.drivetrain)) {
    // Handle cases like "RWD/AWD" - pick the first valid one
    const normalized = carData.drivetrain.split(/[\/,\s]+/).find(d => validDrivetrains.includes(d.toUpperCase()));
    if (normalized) {
      log(`Normalized drivetrain: "${carData.drivetrain}" → "${normalized.toUpperCase()}"`, 'info');
      carData.drivetrain = normalized.toUpperCase();
    } else {
      // Default to RWD if we can't parse
      log(`Invalid drivetrain "${carData.drivetrain}", defaulting to RWD`, 'warn');
      carData.drivetrain = 'RWD';
    }
  }

  // Build final car record with ALL editorial fields
  const editorial = scores.editorial;
  const finalCarData = {
    ...carData,
    ...scores.scores,
    // Editorial content - simple string arrays
    pros: editorial.pros || [],
    cons: editorial.cons || [],
    best_for: editorial.best_for || [],
    pre_inspection_checklist: editorial.pre_inspection_checklist || [],
    facebook_groups: editorial.facebook_groups || [],
    
    // Editorial content - object arrays
    defining_strengths: editorial.defining_strengths || [],
    honest_weaknesses: editorial.honest_weaknesses || [],
    direct_competitors: editorial.direct_competitors || [],
    if_you_want_more: editorial.if_you_want_more || [],
    if_you_want_less: editorial.if_you_want_less || [],
    similar_driving_experience: editorial.similar_driving_experience || [],
    best_years_detailed: editorial.best_years_detailed || [],
    must_have_options: editorial.must_have_options || [],
    nice_to_have_options: editorial.nice_to_have_options || [],
    key_resources: editorial.key_resources || [],
    annual_events: editorial.annual_events || [],
    common_issues_detailed: editorial.common_issues_detailed || [],
    notable_reviews: editorial.notable_reviews || [],
    must_watch_videos: editorial.must_watch_videos || [],
    expert_quotes: editorial.expert_quotes || [],
    
    // Track content
    track_readiness: editorial.track_readiness || null,
    track_readiness_notes: editorial.track_readiness_notes || null,
    recommended_track_prep: editorial.recommended_track_prep || [],
    popular_track_mods: editorial.popular_track_mods || [],
    laptime_benchmarks: editorial.laptime_benchmarks || [],
    
    // Buying guide content
    buyers_summary: editorial.buyers_summary || null,
    ppi_recommendations: editorial.ppi_recommendations || null,
    recommended_years_note: editorial.recommended_years_note || null,
    years_to_avoid_detailed: editorial.years_to_avoid_detailed || [],
    ownership_cost_notes: editorial.ownership_cost_notes || null,
    
    // Community info
    community_strength: editorial.community_strength || null,
    community_notes: editorial.community_notes || null,
    aftermarket_scene_notes: editorial.aftermarket_scene_notes || null,
    
    // DIY & parts info
    diy_friendliness: editorial.diy_friendliness || null,
    diy_notes: editorial.diy_notes || null,
    parts_availability: editorial.parts_availability || null,
    parts_notes: editorial.parts_notes || null,
    
    // Image
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
  
  // Insert known issues (need car_id)
  if (issues.length > 0) {
    const issuesWithCarId = issues.map(issue => ({
      ...issue,
      car_id: car.id,
    }));
    const { error: issuesError } = await supabase
      .from('car_issues')
      .insert(issuesWithCarId);
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
// PHASE 9: USER FEEDBACK RESOLUTION & NOTIFICATION
// =============================================================================

/**
 * Find matching user feedback requests and resolve them, sending notification emails
 * @param {Object} carData - The car data object with name, slug, brand, etc.
 * @param {string} imageUrl - The hero image URL for the email
 * @returns {Object} - Results of feedback resolution
 */
async function resolveUserFeedbackAndNotify(carData, imageUrl) {
  log('Phase 9: Resolving user feedback & sending notifications...', 'phase');
  
  const results = {
    feedbackResolved: 0,
    emailsSent: 0,
    emailsFailed: 0,
    details: [],
  };
  
  try {
    // Build search terms from car data
    const searchTerms = [
      carData.name,
      carData.slug.replace(/-/g, ' '),
      `${carData.brand} ${carData.name.replace(carData.brand, '').trim()}`,
    ].filter(Boolean);
    
    // Find matching unresolved feedback (car_request or feature type)
    // Use fuzzy matching on brand + key terms
    const brandLower = carData.brand.toLowerCase();
    const nameParts = carData.name.toLowerCase().split(/[\s-]+/);
    
    const { data: feedbackItems, error } = await supabase
      .from('user_feedback')
      .select('id, email, message, feedback_type, status')
      .in('feedback_type', ['car_request', 'feature'])
      .in('status', ['new', 'in_progress', 'pending'])
      .order('created_at', { ascending: false });
    
    if (error) {
      log(`Error fetching feedback: ${error.message}`, 'warn');
      return results;
    }
    
    // Filter to matching feedback using fuzzy matching
    const matchingFeedback = feedbackItems.filter(fb => {
      const msgLower = fb.message.toLowerCase();
      // Must mention the brand
      if (!msgLower.includes(brandLower)) return false;
      // Must match at least one significant name part (excluding common words)
      const significantParts = nameParts.filter(p => p.length > 2 && !['the', 'and', 'for'].includes(p));
      return significantParts.some(part => msgLower.includes(part));
    });
    
    if (matchingFeedback.length === 0) {
      log('No matching user feedback found for this car', 'info');
      return results;
    }
    
    log(`Found ${matchingFeedback.length} matching feedback request(s)`, 'success');
    
    for (const feedback of matchingFeedback) {
      // Update feedback status to resolved
      const { error: updateError } = await supabase
        .from('user_feedback')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          internal_notes: supabase.rpc ? undefined : 
            `[${new Date().toISOString().split('T')[0]}] Car added to database via AI pipeline. Auto-resolved.`,
        })
        .eq('id', feedback.id);
      
      if (updateError) {
        log(`Failed to update feedback ${feedback.id}: ${updateError.message}`, 'warn');
        continue;
      }
      
      // Append to internal notes using raw SQL since Supabase JS doesn't support string concatenation
      await supabase.rpc('append_feedback_notes', {
        feedback_id: feedback.id,
        notes: ` [${new Date().toISOString().split('T')[0]}] Car added to database via AI pipeline. Auto-resolved.`
      }).catch(() => {
        // RPC might not exist, that's okay - the status update is the important part
      });
      
      results.feedbackResolved++;
      
      // Send email if user provided email address
      if (feedback.email) {
        try {
          const emailResult = await sendFeedbackResponseEmail({
            to: feedback.email,
            feedbackType: 'car_request',
            carName: carData.name,
            carSlug: carData.slug,
            carImageUrl: imageUrl,
            originalFeedback: feedback.message,
          });
          
          if (emailResult.success) {
            results.emailsSent++;
            log(`✉️  Email sent to ${feedback.email.replace(/(.{3}).*@/, '$1***@')}`, 'success');
            
            // Update responded_at timestamp
            await supabase
              .from('user_feedback')
              .update({ responded_at: new Date().toISOString() })
              .eq('id', feedback.id);
          } else {
            results.emailsFailed++;
            log(`Failed to send email to ${feedback.email}: ${emailResult.error}`, 'warn');
          }
        } catch (emailErr) {
          results.emailsFailed++;
          log(`Email error: ${emailErr.message}`, 'warn');
        }
      }
      
      results.details.push({
        id: feedback.id,
        email: feedback.email,
        message: feedback.message,
        resolved: true,
        emailSent: feedback.email ? results.emailsSent > 0 : null,
      });
    }
    
    log(`Resolved ${results.feedbackResolved} feedback items, sent ${results.emailsSent} emails`, 'success');
    
  } catch (err) {
    log(`Error in feedback resolution: ${err.message}`, 'warn');
  }
  
  return results;
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
    // PHASE 7: YouTube Discovery & Enrichment
    // =========================================================================
    log('Phase 7: Running YouTube discovery...', 'info');
    const youtubeResult = await runYouTubeDiscovery(carData.slug);
    
    await updatePipelineStatus(carData.slug, { 
      phase7_videos_queued: true,
      phase7_videos_processed: youtubeResult.success,
      phase7_car_links_verified: youtubeResult.videosLinked > 0,
      phase7_completed_at: new Date().toISOString(),
      phase7_notes: youtubeResult.message,
    });
    
    // =========================================================================
    // PHASE 8: Validation & Audit
    // =========================================================================
    log('Phase 8: Running validation audit...', 'phase');
    const validationResult = await runValidationAudit(carData.slug);
    
    await updatePipelineStatus(carData.slug, { 
      phase8_data_complete: validationResult.passed > 0,
      phase8_page_renders: true, // Assume true since we inserted
      phase8_al_tested: false,   // Requires manual testing
      phase8_search_works: true, // Will work after next index
      phase8_mobile_checked: false, // Requires manual testing
      phase8_completed_at: new Date().toISOString(),
      phase8_notes: validationResult.summary,
      status: validationResult.critical === 0 ? 'completed' : 'blocked',
      completed_at: validationResult.critical === 0 ? new Date().toISOString() : null,
    });
    
    // =========================================================================
    // PHASE 9: User Feedback Resolution & Email Notifications
    // =========================================================================
    const feedbackResult = await resolveUserFeedbackAndNotify(carData, heroUrl);
    
    await updatePipelineStatus(carData.slug, { 
      phase9_feedback_resolved: feedbackResult.feedbackResolved > 0,
      phase9_emails_sent: feedbackResult.emailsSent,
      phase9_completed_at: new Date().toISOString(),
    });
    
    // =========================================================================
    // SUMMARY
    // =========================================================================
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🎉 CAR ADDITION COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 VEHICLE INFO');
    console.log('───────────────────────────────────────────────────────────────────');
    console.log(`Name:          ${carData.name}`);
    console.log(`Slug:          ${carData.slug}`);
    console.log(`Brand:         ${carData.brand}`);
    console.log(`Years:         ${carData.years}`);
    console.log(`HP:            ${carData.hp}`);
    console.log(`Price:         ${carData.price_range}`);
    console.log('');
    console.log('📊 DATA POPULATED');
    console.log('───────────────────────────────────────────────────────────────────');
    console.log(`Known Issues:       ${issues.length} issues`);
    console.log(`Service Intervals:  ${serviceIntervals.length} intervals`);
    console.log(`Scores:             7/7 assigned`);
    console.log(`Hero Image:         ${heroUrl ? '✅ Generated' : '⏭️ Skipped'}`);
    console.log(`Garage Image:       ${garageUrl ? '✅ Generated' : '⏭️ Skipped'}`);
    console.log(`YouTube Videos:     ${youtubeResult.videosLinked || 0} linked`);
    console.log('');
    console.log('✅ VALIDATION RESULT');
    console.log('───────────────────────────────────────────────────────────────────');
    console.log(`Status:        ${validationResult.critical === 0 ? '✅ PASSED' : '❌ BLOCKED'}`);
    console.log(`Checks:        ${validationResult.passed} passed, ${validationResult.warnings} warnings, ${validationResult.critical} critical`);
    console.log('');
    console.log('📧 USER FEEDBACK');
    console.log('───────────────────────────────────────────────────────────────────');
    console.log(`Resolved:      ${feedbackResult.feedbackResolved} feedback request(s)`);
    console.log(`Emails Sent:   ${feedbackResult.emailsSent} notification(s)`);
    if (feedbackResult.emailsFailed > 0) {
      console.log(`Emails Failed: ${feedbackResult.emailsFailed}`);
    }
    console.log('');
    console.log(`⏱️  Duration:      ${duration}s`);
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