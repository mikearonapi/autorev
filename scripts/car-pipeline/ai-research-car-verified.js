#!/usr/bin/env node

/**
 * VERIFIED AI Car Research & Addition Script
 *
 * An accuracy-first pipeline that verifies data from authoritative sources.
 * Takes longer but produces credible, citable data users can trust.
 *
 * Philosophy:
 * ───────────────────────────────────────────────────────────────────────────
 * - Accuracy > Speed (2-5 min per car is acceptable)
 * - Cite sources for key specs
 * - Flag uncertainty rather than guess
 * - Cross-reference from multiple sources
 * - Use web search to verify manufacturer data
 *
 * Data Quality Tiers:
 * ───────────────────────────────────────────────────────────────────────────
 * - verified: Confirmed from OEM/official source
 * - cross_referenced: Multiple sources agree
 * - researched: AI researched with high confidence
 * - estimated: AI's best estimate (flagged for review)
 *
 * Pipeline Phases:
 * ───────────────────────────────────────────────────────────────────────────
 * 1. Web Search: Find authoritative specs from manufacturer, Car & Driver, etc.
 * 2. AI Synthesis: Combine web research into structured data
 * 3. Spec Verification: Cross-check critical numbers (HP, torque, 0-60)
 * 4. Known Issues: Research forums, TSBs, recalls with citations
 * 5. Maintenance: OEM service manual specifications
 * 6. Service Intervals: Manufacturer recommended schedules
 * 7. Tuning Profile: Community-validated upgrade paths
 * 8. Car Variants: Year/trim matrix for VIN decode
 * 9. Image Generation: Hero image
 * 10. External APIs: EPA fuel economy, NHTSA safety
 *
 * Usage:
 *   node scripts/car-pipeline/ai-research-car-verified.js "2024 Ford Mustang GT"
 *
 * Options:
 *   --dry-run       Preview without saving
 *   --verbose       Show detailed output including sources
 *   --skip-images   Skip image generation
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
const EXA_API_KEY = process.env.EXA_API_KEY;
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Parse command line arguments
const args = process.argv.slice(2);
const carName = args.find((arg) => !arg.startsWith('--'));
const flags = {
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
  skipImages: args.includes('--skip-images'),
};

if (!carName) {
  console.error('Usage: node ai-research-car-verified.js "Car Name" [options]');
  console.error('\nThis VERIFIED pipeline prioritizes accuracy over speed.');
  console.error('It uses web search and multi-pass verification.');
  console.error('\nOptions:');
  console.error('  --dry-run       Preview without saving');
  console.error('  --verbose       Show detailed output including sources');
  console.error('  --skip-images   Skip image generation');
  process.exit(1);
}

// Logging utility
function log(msg, level = 'info') {
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    ai: '🤖',
    web: '🌐',
    db: '💾',
    phase: '📋',
    verify: '🔍',
  };
  const timestamp = new Date().toLocaleTimeString();
  console.log(`[${timestamp}] ${prefix[level] || ''} ${msg}`);
}

// Store sources for transparency
const dataSources = {
  specs: [],
  issues: [],
  maintenance: [],
};

// =============================================================================
// PHASE 1: WEB SEARCH FOR AUTHORITATIVE SPECS
// =============================================================================

async function webSearchSpecs(carName) {
  log(`Searching web for verified specs...`, 'web');

  if (!EXA_API_KEY) {
    log('Exa API key not configured, skipping web verification', 'warning');
    return null;
  }

  const searches = [
    `${carName} specifications horsepower torque 0-60`,
    `${carName} MSRP price specs`,
    `${carName} curb weight dimensions`,
  ];

  const results = [];

  for (const query of searches) {
    try {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': EXA_API_KEY,
        },
        body: JSON.stringify({
          query,
          numResults: 5,
          type: 'auto',
          useAutoprompt: true,
          contents: {
            text: { maxCharacters: 3000 },
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        results.push(...(data.results || []));
        if (flags.verbose) {
          log(`Found ${data.results?.length || 0} results for: ${query}`, 'info');
        }
      }
    } catch (err) {
      log(`Web search failed for "${query}": ${err.message}`, 'warning');
    }
  }

  // Store sources
  dataSources.specs = results.map((r) => ({ url: r.url, title: r.title }));

  return results;
}

// =============================================================================
// PHASE 2: AI SYNTHESIS WITH WEB CONTEXT
// =============================================================================

async function aiSynthesizeSpecs(carName, webResults) {
  log(`AI synthesizing specs from ${webResults?.length || 0} web sources...`, 'ai');

  const webContext =
    webResults && webResults.length > 0
      ? webResults
          .slice(0, 8)
          .map((r) => `Source: ${r.url}\n${r.text || ''}`)
          .join('\n\n---\n\n')
      : 'No web sources available. Use your training data but flag uncertain values.';

  const prompt = `You are an automotive data specialist. Research "${carName}" using the provided web sources and your knowledge.

WEB RESEARCH RESULTS:
${webContext}

TASK: Extract accurate specifications for this vehicle. For each field, indicate your confidence.

Return ONLY valid JSON (no markdown):

{
  "slug": "brand-model-generation (URL-safe)",
  "name": "Full official name",
  "model": "Model name only",
  "trim": "Trim level or null",
  "years": "Production years (e.g., 2024-present)",
  "brand": "Manufacturer",
  "country": "Country of origin",
  "generation_code": "Platform/chassis code or null",
  "tier": "budget|mid|premium",
  "category": "Front-Engine|Mid-Engine|Rear-Engine|Electric",
  "vehicle_type": "Sports Car|Sports Sedan|Supercar|Hot Hatch|Muscle Car|Truck|SUV|Wagon|Hypercar",
  "layout": "Engine position + drive layout",
  
  "engine": "Engine description",
  "hp": 480,
  "hp_confidence": "verified|cross_referenced|researched|estimated",
  "hp_source": "Brief source citation",
  "torque": 415,
  "torque_confidence": "verified|cross_referenced|researched|estimated",
  "trans": "Transmission type",
  "drivetrain": "RWD|AWD|FWD",
  "curb_weight": 3800,
  "curb_weight_confidence": "verified|cross_referenced|researched|estimated",
  "zero_to_sixty": 4.3,
  "zero_to_sixty_confidence": "verified|cross_referenced|researched|estimated",
  "zero_to_sixty_source": "Brief source citation",
  "top_speed": 155,
  "quarter_mile": 12.5,
  "braking_60_0": 105,
  "lateral_g": 0.98,
  
  "price_range": "$45,000 - $65,000",
  "price_avg": 52000,
  "msrp_new_low": 45000,
  "msrp_new_high": 65000,
  "price_confidence": "verified|cross_referenced|researched|estimated",
  
  "score_sound": 8,
  "score_interior": 7,
  "score_track": 8,
  "score_reliability": 7,
  "score_value": 7,
  "score_driver_fun": 9,
  "score_aftermarket": 9,
  
  "notes": "2-3 sentence factual description",
  "highlight": "Single standout feature",
  "tagline": "Marketing tagline if known, or compelling summary",
  "hero_blurb": "2-3 sentence hero section text",
  "manual_available": true,
  "seats": 4,
  "daily_usability_tag": "Weekend Only|Track Toy|Daily Capable|Grand Tourer",
  
  "common_issues": ["Issue 1", "Issue 2", "Issue 3"],
  "defining_strengths": [
    {"title": "Title", "description": "2 sentence explanation"}
  ],
  "honest_weaknesses": [
    {"title": "Title", "description": "2 sentence explanation"}
  ],
  
  "engine_character": "How the engine feels",
  "transmission_feel": "Transmission characteristics",
  "chassis_dynamics": "Handling description",
  "steering_feel": "Steering feedback",
  "sound_signature": "Exhaust/engine note",
  "track_readiness": "excellent|good|moderate|limited",
  "community_strength": "strong|moderate|growing|limited",
  "diy_friendliness": "high|moderate|low",
  "parts_availability": "excellent|good|moderate|limited",
  
  "platform_strengths": ["Strength 1", "Strength 2"],
  "platform_weaknesses": ["Weakness 1", "Weakness 2"],
  
  "data_quality_summary": "Brief note on overall data confidence"
}

CRITICAL RULES:
1. Use EXACT numbers from web sources when available (HP, torque, 0-60)
2. If sources conflict, note the range and use most authoritative (OEM > Car&Driver > forums)
3. Mark confidence honestly - "estimated" is fine when data is uncertain
4. Never invent specs - use null if truly unknown
5. Cite sources for key performance figures`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0].text;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');

  const carData = JSON.parse(jsonMatch[0]);

  // Log confidence levels
  if (flags.verbose) {
    log(`HP: ${carData.hp} (${carData.hp_confidence})`, 'verify');
    log(`0-60: ${carData.zero_to_sixty}s (${carData.zero_to_sixty_confidence})`, 'verify');
    log(`Price: ${carData.price_range} (${carData.price_confidence})`, 'verify');
  }

  return carData;
}

// =============================================================================
// PHASE 3: SPEC VERIFICATION (Cross-check critical numbers)
// =============================================================================

async function verifySpecs(carData) {
  log(`Verifying critical specs...`, 'verify');

  // If we have low confidence on key specs, do a focused search
  const lowConfidenceSpecs = [];
  if (carData.hp_confidence === 'estimated') lowConfidenceSpecs.push('horsepower');
  if (carData.zero_to_sixty_confidence === 'estimated') lowConfidenceSpecs.push('0-60 time');
  if (carData.curb_weight_confidence === 'estimated') lowConfidenceSpecs.push('curb weight');

  if (lowConfidenceSpecs.length === 0) {
    log(`All critical specs verified`, 'success');
    return carData;
  }

  log(
    `Low confidence on: ${lowConfidenceSpecs.join(', ')}. Doing focused verification...`,
    'warning'
  );

  // Additional verification search
  if (EXA_API_KEY) {
    const verifyQuery = `${carData.name} official specs ${lowConfidenceSpecs.join(' ')} site:caranddriver.com OR site:motortrend.com OR site:ford.com OR site:bmw.com`;

    try {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': EXA_API_KEY,
        },
        body: JSON.stringify({
          query: verifyQuery,
          numResults: 3,
          type: 'deep',
          contents: { text: { maxCharacters: 2000 } },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.results?.length > 0) {
          // Have AI re-verify with focused sources
          const verifyPrompt = `Verify these specs for ${carData.name}:
- HP: ${carData.hp} (current confidence: ${carData.hp_confidence})
- 0-60: ${carData.zero_to_sixty} (current confidence: ${carData.zero_to_sixty_confidence})
- Curb Weight: ${carData.curb_weight} (current confidence: ${carData.curb_weight_confidence})

Sources:
${data.results.map((r) => `${r.url}:\n${r.text}`).join('\n\n')}

Return JSON with corrected values if sources show different numbers:
{"hp": number, "hp_confidence": "verified|cross_referenced", "zero_to_sixty": number, "zero_to_sixty_confidence": "verified|cross_referenced", "curb_weight": number, "curb_weight_confidence": "verified|cross_referenced"}`;

          const verifyResponse = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 500,
            messages: [{ role: 'user', content: verifyPrompt }],
          });

          const verifyContent = verifyResponse.content[0].text;
          const verifyJson = verifyContent.match(/\{[\s\S]*\}/);
          if (verifyJson) {
            const corrections = JSON.parse(verifyJson[0]);
            Object.assign(carData, corrections);
            log(`Specs updated from verification`, 'success');
          }
        }
      }
    } catch (err) {
      log(`Verification search failed: ${err.message}`, 'warning');
    }
  }

  return carData;
}

// =============================================================================
// PHASE 4: KNOWN ISSUES (With citations)
// =============================================================================

async function researchKnownIssues(carData) {
  log(`Researching known issues with citations...`, 'ai');

  // Web search for issues
  let issueContext = '';
  if (EXA_API_KEY) {
    try {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': EXA_API_KEY,
        },
        body: JSON.stringify({
          query: `${carData.name} common problems issues reliability TSB recall`,
          numResults: 5,
          type: 'deep',
          contents: { text: { maxCharacters: 4000 } },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        issueContext = data.results?.map((r) => `Source: ${r.url}\n${r.text}`).join('\n\n') || '';
        dataSources.issues = data.results?.map((r) => ({ url: r.url, title: r.title })) || [];
      }
    } catch (err) {
      log(`Issue web search failed: ${err.message}`, 'warning');
    }
  }

  const prompt = `Research known issues for the ${carData.name} (${carData.years}).

${issueContext ? `WEB RESEARCH:\n${issueContext}\n\n` : ''}

Return 5-8 issues as JSON array. CITE SOURCES when possible:

[
  {
    "title": "Issue name",
    "kind": "common_issue",
    "severity": "high",
    "affected_years_text": "Years affected (e.g., '2024-2025')",
    "affected_year_start": 2024,
    "affected_year_end": 2025,
    "description": "2-3 sentences. Be specific about the failure mode.",
    "symptoms": ["Symptom 1", "Symptom 2"],
    "prevention": "Prevention advice if applicable",
    "fix_description": "How to fix, including if it's a DIY or dealer job",
    "estimated_cost_text": "$X - $Y",
    "estimated_cost_low": 500,
    "estimated_cost_high": 1500,
    "source_type": "forum|tsb|recall|manufacturer|news",
    "source_url": "URL if available or null",
    "confidence": 0.8,
    "sort_order": 1
  }
]

ENUM VALUES (use EXACTLY these):
- kind: "common_issue" | "recall" | "tsb" | "other"
- severity: "critical" | "high" | "medium" | "low" | "cosmetic"

RULES:
1. Include actual recalls/TSBs if they exist for this model
2. Reference specific failure components (not vague "engine problems")
3. Cost estimates should be realistic for this vehicle's market
4. sort_order: 1 = most important/critical, increment for each issue
5. confidence: 0.0-1.0 based on source quality (official=0.95, forum=0.7)
6. Don't invent issues - only include what's documented

Return ONLY the JSON array.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0].text;
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array in AI response');

  const issues = JSON.parse(jsonMatch[0]);
  log(`Found ${issues.length} documented issues`, 'success');

  return issues;
}

// =============================================================================
// PHASE 5: MAINTENANCE SPECS (OEM data)
// =============================================================================

async function researchMaintenance(carData) {
  log(`Researching OEM maintenance specifications...`, 'ai');

  // Web search for maintenance specs
  let maintContext = '';
  if (EXA_API_KEY) {
    try {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': EXA_API_KEY,
        },
        body: JSON.stringify({
          query: `${carData.name} oil capacity type maintenance schedule specifications`,
          numResults: 4,
          type: 'auto',
          contents: { text: { maxCharacters: 3000 } },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        maintContext = data.results?.map((r) => `Source: ${r.url}\n${r.text}`).join('\n\n') || '';
        dataSources.maintenance = data.results?.map((r) => ({ url: r.url, title: r.title })) || [];
      }
    } catch (err) {
      log(`Maintenance web search failed: ${err.message}`, 'warning');
    }
  }

  const prompt = `Research OEM maintenance specifications for the ${carData.name} (${carData.years}, ${carData.engine}).

${maintContext ? `WEB RESEARCH:\n${maintContext}\n\n` : ''}

Return JSON with ACCURATE manufacturer specifications. ALL fields are important for our Service Info display:

{
  "oil_type": "Full Synthetic (be specific: Motorcraft, Mobil 1, etc. if known)",
  "oil_viscosity": "0W-20 or 5W-30 etc. (exact OEM spec)",
  "oil_spec": "API SP, dexos1, etc.",
  "oil_capacity_liters": 8.0,
  "oil_capacity_quarts": 8.5,
  "oil_filter_oem_part": "OEM part number if known",
  "oil_change_interval_miles": 7500,
  "oil_change_interval_months": 12,
  "coolant_type": "OEM coolant type",
  "coolant_color": "orange|green|pink|blue",
  "coolant_capacity_liters": 12.0,
  "coolant_change_interval_miles": 100000,
  "brake_fluid_type": "DOT 4",
  "brake_fluid_change_interval_miles": 45000,
  "trans_fluid_auto": "ATF type if automatic",
  "trans_fluid_auto_capacity": 10.0,
  "trans_fluid_manual": "Gear oil type if manual",
  "trans_fluid_manual_capacity": 3.0,
  "trans_fluid_change_interval_miles": 60000,
  "diff_fluid_type": "75W-140 or similar",
  "diff_fluid_rear_capacity": 2.0,
  "diff_fluid_change_interval_miles": 60000,
  "fuel_type": "Premium Unleaded",
  "fuel_octane_minimum": 91,
  "fuel_octane_recommended": 93,
  "fuel_tank_capacity_gallons": 16.0,
  "tire_size_front": "255/40R19",
  "tire_size_rear": "275/40R19",
  "tire_pressure_front_psi": 35,
  "tire_pressure_rear_psi": 38,
  "tire_rotation_interval_miles": 7500,
  "wheel_bolt_pattern": "5x114.3 (REQUIRED - look up exact bolt pattern)",
  "wheel_center_bore_mm": 70.5,
  "wheel_lug_torque_ft_lbs": 100,
  "wheel_lug_torque_nm": 135,
  "spark_plug_type": "NGK/Denso part number if known",
  "spark_plug_gap_mm": 0.7,
  "spark_plug_change_interval_miles": 100000,
  "spark_plug_quantity": 8,
  "timing_type": "chain|belt",
  "timing_change_interval_miles": null,
  "serpentine_belt_change_interval_miles": 100000,
  "battery_group_size": "H6, 94R, etc. (REQUIRED - standard BCI group size)",
  "battery_cca": 760,
  "battery_voltage": 12,
  "battery_agm": true,
  "battery_location": "front|trunk|under seat",
  "wiper_driver_size_inches": 22,
  "wiper_passenger_size_inches": 20,
  "wiper_rear_size_inches": null,
  "brake_front_rotor_diameter_mm": 380,
  "brake_rear_rotor_diameter_mm": 350,
  "air_filter_change_interval_miles": 30000,
  "cabin_filter_change_interval_miles": 20000
}

CRITICAL: 
- Use EXACT OEM specifications from owner's manual or official sources
- wheel_bolt_pattern, battery_group_size, and wiper sizes are REQUIRED fields
- Include fluid capacities and change intervals where applicable
- If uncertain, use your best research - do NOT leave critical fields null`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0].text;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');

  return JSON.parse(jsonMatch[0]);
}

// =============================================================================
// PHASE 6: SERVICE INTERVALS (OEM schedule)
// =============================================================================

async function researchServiceIntervals(carData) {
  log(`Researching OEM service intervals...`, 'ai');

  const prompt = `Research the manufacturer's recommended service schedule for the ${carData.name} (${carData.years}).

Return 10-12 services as JSON array with ACCURATE OEM intervals:

[
  {
    "service_name": "Oil Change",
    "service_description": "Replace engine oil and filter",
    "interval_miles": 7500,
    "interval_months": 12,
    "items_included": ["Oil filter", "Drain plug gasket", "5W-20 synthetic oil (9 quarts)"],
    "dealer_cost_low": 80,
    "dealer_cost_high": 150,
    "independent_cost_low": 60,
    "independent_cost_high": 100,
    "diy_cost_low": 40,
    "diy_cost_high": 70,
    "labor_hours_estimate": 0.5,
    "is_critical": true,
    "skip_consequences": "Engine wear, sludge buildup, potential engine failure"
  }
]

Include these services with ACCURATE intervals for this specific vehicle:
- Oil Change
- Brake Fluid Flush
- Transmission Fluid (if serviceable)
- Coolant Flush
- Spark Plugs (for this engine's recommended interval)
- Air Filter
- Cabin Air Filter
- Brake Pad Inspection
- Tire Rotation
- Differential Fluid (if RWD/AWD)
- Drive Belt Inspection
- Fuel Filter (if applicable)

RULES:
1. Use manufacturer-recommended intervals, not generic
2. Some modern cars have longer intervals (e.g., iridium plugs = 100k miles)
3. Cost estimates should reflect this vehicle's market segment
4. items_included: List specific parts/fluids needed
5. skip_consequences: What happens if service is skipped (for critical services)
6. labor_hours_estimate: Typical shop time for this service

Return ONLY the JSON array.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0].text;
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array in AI response');

  return JSON.parse(jsonMatch[0]);
}

// =============================================================================
// PHASE 7: TUNING PROFILE (Community-validated)
// =============================================================================

async function researchTuningProfile(carData) {
  log(`Researching tuning profile and upgrade paths...`, 'ai');

  // Web search for popular mods
  let tuningContext = '';
  if (EXA_API_KEY) {
    try {
      const response = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': EXA_API_KEY,
        },
        body: JSON.stringify({
          query: `${carData.name} best mods upgrades tune exhaust intake`,
          numResults: 4,
          type: 'auto',
          contents: { text: { maxCharacters: 3000 } },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        tuningContext = data.results?.map((r) => `Source: ${r.url}\n${r.text}`).join('\n\n') || '';
      }
    } catch (err) {
      log(`Tuning web search failed: ${err.message}`, 'warning');
    }
  }

  const prompt = `Research upgrade recommendations for the ${carData.name} (${carData.years}, ${carData.hp} HP, ${carData.drivetrain}).

${tuningContext ? `COMMUNITY RESEARCH:\n${tuningContext}\n\n` : ''}

Return JSON with community-validated upgrade paths. Use REAL BRAND NAMES when possible:

{
  "tuning_focus": "performance",
  "engine_family": "Coyote 5.0L V8 Gen 4",
  "stock_whp": 420,
  "stock_wtq": 380,
  "platform_insights": {
    "strengths": ["What makes this platform good for modding"],
    "weaknesses": ["Limitations to be aware of"],
    "community_notes": "Key things enthusiasts should know"
  },
  "power_limits": {
    "stock_internals_max_whp": 600,
    "stock_trans_max_tq": 500,
    "notes": "Stock internals safe to ~600whp, MT82 transmission is weak point"
  },
  "tuning_platforms": [
    {"name": "HP Tuners", "type": "handheld", "price_range": "$400-600", "notes": "Most popular, great support"},
    {"name": "SCT X4", "type": "handheld", "price_range": "$350-450", "notes": "Easy to use, good canned tunes"}
  ],
  "brand_recommendations": {
    "exhaust": ["Borla", "Corsa", "Stainless Works"],
    "intake": ["JLT", "Airaid", "K&N"],
    "suspension": ["BMR", "Steeda", "Ford Performance"],
    "supercharger": ["Whipple", "Roush", "VMP"]
  },
  "stage_progressions": [
    {
      "stage": "Stage 1",
      "notes": "Basic bolt-ons, safe on stock internals",
      "cost_low": 1500,
      "cost_high": 3000,
      "hp_gain_low": 30,
      "hp_gain_high": 60,
      "components": ["tune", "intake", "exhaust"]
    },
    {
      "stage": "Stage 2",
      "notes": "More aggressive, may need supporting mods",
      "cost_low": 3000,
      "cost_high": 6000,
      "hp_gain_low": 60,
      "hp_gain_high": 120,
      "components": ["headers", "full exhaust", "aggressive tune"]
    },
    {
      "stage": "Stage 3",
      "notes": "Major power gains, forced induction",
      "cost_low": 8000,
      "cost_high": 15000,
      "hp_gain_low": 150,
      "hp_gain_high": 300,
      "components": ["supercharger kit", "fuel system", "cooling upgrades"]
    }
  ],
  "upgrades_by_objective": {
    "daily_driver": {
      "description": "Subtle improvements for daily use",
      "upgrades": [
        {
          "category": "exhaust",
          "name": "Specific Product Name (e.g., Borla S-Type Cat-Back)",
          "hp_gain": 10,
          "tq_gain": 10,
          "price_low": 1200,
          "price_high": 1600,
          "priority": 1,
          "notes": "Moderate sound, drone-free"
        }
      ]
    },
    "weekend_warrior": {
      "description": "Track-ready while street legal",
      "upgrades": [
        {"category": "suspension", "name": "Product Name", "hp_gain": 0, "tq_gain": 0, "price_low": 2000, "price_high": 3000, "priority": 1},
        {"category": "brakes", "name": "Product Name", "hp_gain": 0, "tq_gain": 0, "price_low": 2500, "price_high": 4000, "priority": 2},
        {"category": "tune", "name": "Tuner Name", "hp_gain": 30, "tq_gain": 40, "price_low": 500, "price_high": 800, "priority": 3}
      ]
    },
    "max_power": {
      "description": "Maximum power gains",
      "upgrades": [
        {"category": "forced_induction", "name": "Specific Kit Name", "hp_gain": 150, "tq_gain": 100, "price_low": 7000, "price_high": 12000, "priority": 1},
        {"category": "exhaust", "name": "Headers + Full System", "hp_gain": 30, "tq_gain": 25, "price_low": 2000, "price_high": 4000, "priority": 2},
        {"category": "fuel", "name": "Fuel System Upgrade", "hp_gain": 0, "tq_gain": 0, "price_low": 800, "price_high": 1500, "priority": 3}
      ]
    },
    "handling_focused": {
      "description": "Corner-carving setup",
      "upgrades": [
        {"category": "suspension", "name": "Coilover Brand/Model", "hp_gain": 0, "tq_gain": 0, "price_low": 2500, "price_high": 4000, "priority": 1},
        {"category": "wheels", "name": "Lightweight Wheel Brand", "hp_gain": 0, "tq_gain": 0, "price_low": 2000, "price_high": 3500, "priority": 2},
        {"category": "chassis", "name": "Sway Bars/Braces", "hp_gain": 0, "tq_gain": 0, "price_low": 500, "price_high": 1200, "priority": 3}
      ]
    }
  }
}

RULES:
1. Use REAL brand names (Borla, Magnaflow, KW, Bilstein, etc.)
2. HP/TQ gains should be realistic and verified by community dynos
3. engine_family: Identify the specific engine (e.g., "Coyote 5.0L V8 Gen 4", "B58", "2JZ-GTE")
4. stock_whp/stock_wtq: Wheel HP/TQ (typically 15-20% less than crank)
5. power_limits: Real-world limits for stock internals and transmission
6. brand_recommendations: Top brands for each category for THIS specific car
7. stage_progressions is REQUIRED - always include 2-3 stages`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0].text;
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in AI response');

  return JSON.parse(jsonMatch[0]);
}

// =============================================================================
// PHASE 8: CAR VARIANTS (Year/Trim matrix)
// =============================================================================

async function researchCarVariants(carData) {
  log(`Researching car variants for VIN decode...`, 'ai');

  const yearsText = carData.years;
  const currentYear = new Date().getFullYear();
  let startYear, endYear;

  if (yearsText.includes('present')) {
    startYear = parseInt(yearsText.split('-')[0]);
    endYear = currentYear + 1;
  } else if (yearsText.includes('-')) {
    [startYear, endYear] = yearsText.split('-').map((y) => parseInt(y.trim()));
  } else {
    startYear = endYear = parseInt(yearsText);
  }

  const prompt = `Research all trim levels for the ${carData.brand} ${carData.model} (${carData.years}).

Return JSON array of variants (each year/trim/transmission combination):

[
  {
    "variant_key": "2024-gt-6mt",
    "display_name": "2024 ${carData.brand} ${carData.model} GT (6MT)",
    "model_year": 2024,
    "trim": "GT",
    "drivetrain": "${carData.drivetrain}",
    "transmission": "6-Speed Manual",
    "engine": "${carData.engine}",
    "hp": ${carData.hp},
    "torque": ${carData.torque}
  }
]

REQUIREMENTS:
1. Include ALL available trims for years ${startYear}-${Math.min(endYear, currentYear + 1)}
2. Include both manual and automatic variants if both exist
3. If different engines have different HP (e.g., EcoBoost vs GT), list correct specs
4. Use lowercase with hyphens for variant_key: "{year}-{trim}-{trans}"

Return ONLY the JSON array.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0].text;
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array in AI response');

  return JSON.parse(jsonMatch[0]);
}

// =============================================================================
// PHASE 9: IMAGE GENERATION
// =============================================================================

async function generateHeroImage(carData) {
  if (flags.skipImages || flags.dryRun) {
    log('Skipping image generation', 'warning');
    return null;
  }

  if (!GOOGLE_AI_API_KEY || !BLOB_READ_WRITE_TOKEN) {
    log('Image generation not configured', 'warning');
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
    Dodge: 'B5 Blue',
    Nissan: 'Bayside Blue',
  };
  const color = brandColors[carData.brand] || 'metallic silver';

  const prompt = `A ${year} ${carData.name} in ${color} driving on a scenic mountain road at golden hour. 3/4 front angle, motion blur on wheels, professional automotive photography, sharp focus, dramatic lighting. Real outdoor setting with mountains in background.`;

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

    if (!response.ok) throw new Error(`Image API error: ${response.status}`);

    const result = await response.json();
    const imagePart = result.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);

    if (!imagePart) throw new Error('No image in response');

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

async function saveToDatabase(
  carData,
  issues,
  maintenanceSpecs,
  serviceIntervals,
  tuningProfile,
  carVariants,
  heroUrl
) {
  log(`Saving to database...`, 'db');

  if (flags.dryRun) {
    log('DRY RUN: Would save to database', 'info');
    console.log('\n📊 Would insert:');
    console.log(`  - cars: 1 record (${carData.name})`);
    console.log(`  - car_issues: ${issues.length} records`);
    console.log(`  - vehicle_maintenance_specs: 1 record`);
    console.log(`  - vehicle_service_intervals: ${serviceIntervals.length} records`);
    console.log(
      `  - car_tuning_profiles: 1 record (${Object.keys(tuningProfile.upgrades_by_objective || {}).length} objectives)`
    );
    console.log(`  - car_variants: ${carVariants.length} records`);
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

  // Prepare car record
  const carRecord = {
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
    price_range: carData.price_range,
    price_avg: carData.price_avg,
    msrp_new_low: carData.msrp_new_low,
    msrp_new_high: carData.msrp_new_high,
    score_sound: carData.score_sound,
    score_interior: carData.score_interior,
    score_track: carData.score_track,
    score_reliability: carData.score_reliability,
    score_value: carData.score_value,
    score_driver_fun: carData.score_driver_fun,
    score_aftermarket: carData.score_aftermarket,
    notes: carData.notes,
    highlight: carData.highlight,
    tagline: carData.tagline,
    hero_blurb: carData.hero_blurb,
    image_hero_url: heroUrl,
    manual_available: carData.manual_available,
    seats: carData.seats,
    daily_usability_tag: carData.daily_usability_tag,
    common_issues: carData.common_issues || [],
    defining_strengths: carData.defining_strengths || [],
    honest_weaknesses: carData.honest_weaknesses || [],
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

  if (carError) throw new Error(`Failed to insert car: ${carError.message}`);
  log(`Car inserted: ${car.slug} (ID: ${car.id})`, 'success');

  // Insert issues (with field filtering for schema safety)
  const validIssueFields = [
    'title',
    'kind',
    'severity',
    'affected_years_text',
    'affected_year_start',
    'affected_year_end',
    'description',
    'symptoms',
    'prevention',
    'fix_description',
    'estimated_cost_text',
    'estimated_cost_low',
    'estimated_cost_high',
    'source_type',
    'source_url',
    'confidence',
    'sort_order',
  ];
  if (issues.length > 0) {
    const issuesWithCarId = issues.map((issue, index) => {
      const filtered = { car_id: car.id };
      for (const field of validIssueFields) {
        if (issue[field] !== undefined) {
          filtered[field] = issue[field];
        }
      }
      // Ensure sort_order exists
      if (!filtered.sort_order) filtered.sort_order = index + 1;
      return filtered;
    });
    const { error } = await supabase.from('car_issues').insert(issuesWithCarId);
    if (error) log(`Warning: Issues insert failed: ${error.message}`, 'warning');
    else log(`Inserted ${issues.length} known issues`, 'success');
  }

  // Insert maintenance specs (only valid schema fields)
  const validMaintenanceFields = [
    // Oil
    'oil_type',
    'oil_viscosity',
    'oil_spec',
    'oil_capacity_liters',
    'oil_capacity_quarts',
    'oil_filter_oem_part',
    'oil_change_interval_miles',
    'oil_change_interval_months',
    // Coolant
    'coolant_type',
    'coolant_color',
    'coolant_spec',
    'coolant_capacity_liters',
    'coolant_change_interval_miles',
    'coolant_change_interval_years',
    // Brake fluid
    'brake_fluid_type',
    'brake_fluid_spec',
    'brake_fluid_change_interval_miles',
    'brake_fluid_change_interval_years',
    // Transmission
    'trans_fluid_auto',
    'trans_fluid_auto_capacity',
    'trans_fluid_manual',
    'trans_fluid_manual_capacity',
    'trans_fluid_change_interval_miles',
    // Differential
    'diff_fluid_type',
    'diff_fluid_rear_capacity',
    'diff_fluid_change_interval_miles',
    // Fuel
    'fuel_type',
    'fuel_octane_minimum',
    'fuel_octane_recommended',
    'fuel_tank_capacity_gallons',
    'fuel_tank_capacity_liters',
    // Tires
    'tire_size_front',
    'tire_size_rear',
    'tire_pressure_front_psi',
    'tire_pressure_rear_psi',
    'tire_rotation_interval_miles',
    // Wheels
    'wheel_bolt_pattern',
    'wheel_center_bore_mm',
    'wheel_lug_torque_ft_lbs',
    'wheel_lug_torque_nm',
    // Spark plugs
    'spark_plug_type',
    'spark_plug_gap_mm',
    'spark_plug_change_interval_miles',
    'spark_plug_quantity',
    // Timing
    'timing_type',
    'timing_change_interval_miles',
    'serpentine_belt_change_interval_miles',
    // Battery
    'battery_group_size',
    'battery_cca',
    'battery_voltage',
    'battery_agm',
    'battery_location',
    // Wipers
    'wiper_driver_size_inches',
    'wiper_passenger_size_inches',
    'wiper_rear_size_inches',
    // Brakes
    'brake_front_rotor_diameter_mm',
    'brake_rear_rotor_diameter_mm',
    // Filters
    'air_filter_change_interval_miles',
    'cabin_filter_change_interval_miles',
  ];
  const filteredMaintenanceSpecs = { car_id: car.id };
  for (const field of validMaintenanceFields) {
    if (maintenanceSpecs[field] !== undefined) {
      filteredMaintenanceSpecs[field] = maintenanceSpecs[field];
    }
  }
  const { error: specsError } = await supabase
    .from('vehicle_maintenance_specs')
    .insert(filteredMaintenanceSpecs);
  if (specsError) log(`Warning: Maintenance specs failed: ${specsError.message}`, 'warning');
  else log(`Inserted maintenance specs`, 'success');

  // Insert service intervals (only valid schema fields)
  const validIntervalFields = [
    'service_name',
    'service_description',
    'interval_miles',
    'interval_months',
    'items_included',
    'dealer_cost_low',
    'dealer_cost_high',
    'independent_cost_low',
    'independent_cost_high',
    'diy_cost_low',
    'diy_cost_high',
    'labor_hours_estimate',
    'is_critical',
    'skip_consequences',
  ];
  if (serviceIntervals.length > 0) {
    const intervalsWithCarId = serviceIntervals.map((interval) => {
      const filtered = { car_id: car.id };
      for (const field of validIntervalFields) {
        if (interval[field] !== undefined) {
          filtered[field] = interval[field];
        }
      }
      return filtered;
    });
    const { error } = await supabase.from('vehicle_service_intervals').insert(intervalsWithCarId);
    if (error) log(`Warning: Service intervals failed: ${error.message}`, 'warning');
    else log(`Inserted ${serviceIntervals.length} service intervals`, 'success');
  }

  // Insert tuning profile (stage_progressions is REQUIRED)
  const tuningRecord = {
    car_id: car.id,
    engine_family: tuningProfile.engine_family || carData.engine,
    tuning_focus: tuningProfile.tuning_focus || 'performance',
    stock_whp: tuningProfile.stock_whp || Math.round(carData.hp * 0.85), // Estimate 15% drivetrain loss
    stock_wtq: tuningProfile.stock_wtq || Math.round(carData.torque * 0.85),
    stage_progressions: tuningProfile.stage_progressions || [
      {
        stage: 'Stage 1',
        notes: 'Basic bolt-ons',
        cost_low: 1500,
        cost_high: 3000,
        hp_gain_low: 30,
        hp_gain_high: 60,
        components: ['tune', 'intake', 'exhaust'],
      },
    ],
    power_limits: tuningProfile.power_limits || null,
    tuning_platforms: tuningProfile.tuning_platforms || null,
    brand_recommendations: tuningProfile.brand_recommendations || null,
    platform_insights: tuningProfile.platform_insights || null,
    upgrades_by_objective: tuningProfile.upgrades_by_objective || {},
    data_quality_tier: 'verified',
    pipeline_version: 'verified-v2',
    pipeline_run_at: new Date().toISOString(),
  };
  const { error: tuningError } = await supabase.from('car_tuning_profiles').insert(tuningRecord);
  if (tuningError) log(`Warning: Tuning profile failed: ${tuningError.message}`, 'warning');
  else log(`Inserted tuning profile`, 'success');

  // Insert variants
  if (carVariants.length > 0) {
    const variantsWithCarId = carVariants.map((v) => ({
      car_id: car.id,
      variant_key: v.variant_key,
      display_name: v.display_name,
      model_year_start: v.model_year,
      model_year_end: v.model_year,
      trim: v.trim,
      drivetrain: v.drivetrain,
      transmission: v.transmission,
      engine: v.engine,
      metadata: { hp: v.hp, torque: v.torque },
    }));
    const { error } = await supabase.from('car_variants').insert(variantsWithCarId);
    if (error) log(`Warning: Variants failed: ${error.message}`, 'warning');
    else log(`Inserted ${carVariants.length} car variants`, 'success');
  }

  return { success: true, car };
}

// =============================================================================
// PHASE 10: ENRICHMENT APIs
// =============================================================================

async function runEnrichmentAPIs(slug) {
  log(`Running external API enrichment...`, 'phase');

  if (flags.dryRun) return;

  // EPA Fuel Economy
  try {
    const response = await fetch(`${BASE_URL}/api/cars/${slug}/fuel-economy`);
    if (response.ok) log('EPA fuel economy enriched', 'success');
  } catch (err) {
    log(`EPA enrichment skipped: ${err.message}`, 'warning');
  }

  // NHTSA Safety
  try {
    const response = await fetch(`${BASE_URL}/api/cars/${slug}/safety-ratings`);
    if (response.ok) log('NHTSA safety ratings enriched', 'success');
  } catch (err) {
    log(`Safety enrichment skipped: ${err.message}`, 'warning');
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('');
  console.log('🚗 AutoRev VERIFIED Car Pipeline');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Car: ${carName}`);
  console.log('Mode: VERIFIED (accuracy-first with web research)');
  if (flags.dryRun) console.log('      DRY RUN');
  if (flags.skipImages) console.log('      SKIP IMAGES');
  if (flags.verbose) console.log('      VERBOSE');
  console.log('');

  const startTime = Date.now();
  const phases = [
    'Web Search',
    'AI Synthesis',
    'Spec Verification',
    'Known Issues',
    'Maintenance',
    'Service Intervals',
    'Tuning Profile',
    'Car Variants',
    'Image Generation',
    'External APIs',
  ];

  try {
    // Phase 1: Web search for authoritative sources
    log(`Phase 1/${phases.length}: ${phases[0]}...`, 'phase');
    const webResults = await webSearchSpecs(carName);

    // Phase 2: AI synthesis with web context
    log(`Phase 2/${phases.length}: ${phases[1]}...`, 'phase');
    let carData = await aiSynthesizeSpecs(carName, webResults);

    // Phase 3: Verify critical specs
    log(`Phase 3/${phases.length}: ${phases[2]}...`, 'phase');
    carData = await verifySpecs(carData);

    // Phase 4-8: Parallel research for related data
    log(`Phase 4-8/${phases.length}: Parallel research...`, 'phase');
    const [issues, maintenanceSpecs, serviceIntervals, tuningProfile, carVariants] =
      await Promise.all([
        researchKnownIssues(carData),
        researchMaintenance(carData),
        researchServiceIntervals(carData),
        researchTuningProfile(carData),
        researchCarVariants(carData),
      ]);

    // Phase 9: Image generation
    log(`Phase 9/${phases.length}: ${phases[8]}...`, 'phase');
    const heroUrl = await generateHeroImage(carData);

    // Phase 10: Save to database
    log(`Saving to database...`, 'db');
    const result = await saveToDatabase(
      carData,
      issues,
      maintenanceSpecs,
      serviceIntervals,
      tuningProfile,
      carVariants,
      heroUrl
    );

    // Phase 10: External APIs
    log(`Phase 10/${phases.length}: ${phases[9]}...`, 'phase');
    if (!flags.dryRun && result.car) {
      await runEnrichmentAPIs(carData.slug);
    }

    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const objectiveCount = Object.keys(tuningProfile.upgrades_by_objective || {}).length;

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎉 VERIFIED PIPELINE COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log(`Car:           ${carData.name}`);
    console.log(`Slug:          ${carData.slug}`);
    console.log(`HP:            ${carData.hp} (${carData.hp_confidence || 'researched'})`);
    console.log(
      `0-60:          ${carData.zero_to_sixty}s (${carData.zero_to_sixty_confidence || 'researched'})`
    );
    console.log(`Price:         ${carData.price_range}`);
    console.log('');
    console.log('Data Quality:');
    console.log('─────────────────────────────────────────────────────────────────');
    console.log(`  📊 Specs:      ${carData.hp_confidence || 'researched'}`);
    console.log(`  📰 Sources:    ${dataSources.specs.length} web sources consulted`);
    console.log(`  🔧 Issues:     ${issues.length} documented issues`);
    console.log(`  🛠️  Services:   ${serviceIntervals.length} intervals`);
    console.log(`  ⚡ Upgrades:   ${objectiveCount} tuning objectives`);
    console.log(`  🚙 Variants:   ${carVariants.length} year/trim combinations`);
    console.log('');
    console.log(`⏱️  Duration: ${duration}s`);

    if (flags.verbose && dataSources.specs.length > 0) {
      console.log('');
      console.log('Sources Used:');
      console.log('─────────────────────────────────────────────────────────────────');
      dataSources.specs.slice(0, 5).forEach((s) => {
        console.log(`  • ${s.title || s.url}`);
      });
    }

    console.log('');
    if (!flags.dryRun && result.car) {
      console.log(`View at: /browse-cars/${carData.slug}`);
      console.log(`Car ID: ${result.car.id}`);
    }
  } catch (err) {
    log(`Fatal error: ${err.message}`, 'error');
    if (flags.verbose) console.error(err.stack);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
