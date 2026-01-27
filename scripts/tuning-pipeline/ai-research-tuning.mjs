#!/usr/bin/env node
/**
 * AI Research Tuning Data
 * 
 * Uses Claude AI to research and generate tuning upgrade recommendations
 * for cars that don't have data from other sources.
 * 
 * IMPORTANT: This script now includes tunability validation to prevent
 * generating contradictory data (e.g., ECU tune recommendations for
 * platforms where tuning is impossible like Ferrari/McLaren).
 * 
 * Usage:
 *   node scripts/tuning-pipeline/ai-research-tuning.mjs --slug bmw-m3-g80
 *   node scripts/tuning-pipeline/ai-research-tuning.mjs --slug bmw-m3-g80 --dry-run
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

const { values } = parseArgs({
  options: {
    'slug': { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    'verbose': { type: 'boolean', default: false },
  },
});

const slug = values['slug'];
const dryRun = values['dry-run'];
const verbose = values['verbose'];

if (!slug) {
  console.error('Usage: node ai-research-tuning.mjs --slug <car-slug>');
  process.exit(1);
}

// ============================================================================
// TUNABILITY VALIDATION
// Prevents generating contradictory data for platforms with limited tuning
// ============================================================================

const PLATFORM_AFTERMARKET_SCORES = {
  'ferrari': 3,
  'lamborghini': 3,
  'mclaren': 4,
  'aston-martin': 4,
  'bentley': 3,
  'rolls-royce': 2,
  'bugatti': 2,
  'pagani': 2,
  'koenigsegg': 2,
  'lexus': 5,
  'genesis': 5,
  'alfa-romeo': 5,
  'lotus': 5,
  'mercedes-amg': 6,
  'bmw-m': 8,
  'audi-rs': 8,
  'porsche': 7,
  'nissan-gt-r': 10,
  'toyota-supra': 9,
  'subaru-wrx-sti': 9,
  'mitsubishi-evo': 10,
  'ford-mustang': 9,
  'chevrolet-camaro': 9,
  'mazda-miata': 9,
};

const LIMITED_TUNING_PLATFORMS = ['ferrari', 'lamborghini', 'mclaren', 'bugatti', 'pagani', 'koenigsegg'];

function calculateTunabilityForScript(car) {
  const nameLower = (car.name || '').toLowerCase();
  const brand = (car.brand || '').toLowerCase();
  
  let baseScore = 5;
  
  // Engine type factor
  const engine = (car.engine || '').toLowerCase();
  if (engine.includes('twin-turbo') || engine.includes('twin turbo')) {
    baseScore += 2;
  } else if (engine.includes('turbo')) {
    baseScore += 2;
  } else if (engine.includes('supercharged')) {
    baseScore += 1.5;
  }
  
  // Platform aftermarket score
  for (const [platform, score] of Object.entries(PLATFORM_AFTERMARKET_SCORES)) {
    if (brand.includes(platform) || nameLower.includes(platform)) {
      const adjustment = (score - 5) / 2;
      baseScore += adjustment;
      break;
    }
  }
  
  // Check if it's a limited tuning platform
  const isLimitedPlatform = LIMITED_TUNING_PLATFORMS.some(p => 
    brand.includes(p) || nameLower.includes(p)
  );
  
  return {
    score: Math.max(1, Math.min(10, Math.round(baseScore * 10) / 10)),
    isLimitedPlatform,
  };
}

function getTuningContextForPrompt(tunability) {
  if (tunability.isLimitedPlatform) {
    return `
IMPORTANT PLATFORM CONTEXT:
This is a LIMITED TUNING PLATFORM. The ECU is likely encrypted/locked.
- DO NOT suggest ECU tuning or flash tuning as primary options
- Focus recommendations on bolt-on modifications (exhaust, intake, wheels, suspension)
- If tuning IS possible, mention it comes from specialized shops at premium prices
- Include "ECU Tuning Constraints" as a weakness explaining the limitations
- Use phrases like "bolt-on focused" instead of "great tuning potential"
`;
  }
  
  if (tunability.score < 5) {
    return `
PLATFORM CONTEXT:
This platform has LIMITED aftermarket support (tunability score: ${tunability.score}/10).
- Be realistic about available modifications
- Don't oversell tuning potential
- Focus on bolt-on modifications that are actually available
`;
  }
  
  return '';
}

/**
 * Research tuning upgrades using Claude
 * @param {Object} car - Car object
 * @param {Object} tunability - Tunability calculation result
 */
async function researchTuningUpgrades(car, tunability) {
  console.log('   🔬 Researching tuning upgrades with Claude...');
  
  const tuningContext = getTuningContextForPrompt(tunability);

  const prompt = `You are an automotive tuning expert. Research the most popular and effective aftermarket upgrades for the ${car.name} (${car.years}).
${tuningContext}
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
- brands: Array of recommended brands
- notes: Any important notes

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
For limited tuning platforms, focus on bolt-on modifications and be honest about ECU tuning constraints.

Return ONLY valid JSON, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text;
    
    // Try to extract JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log('   ⚠️  Could not parse response');
      if (verbose) console.log('   Response:', text.substring(0, 500));
      return null;
    }

    const upgrades = JSON.parse(jsonMatch[0]);
    
    // Count total upgrades
    const totalCount = Object.values(upgrades).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
    console.log(`   ✅ Generated ${totalCount} upgrades`);
    
    if (verbose) {
      Object.entries(upgrades).forEach(([key, arr]) => {
        if (arr?.length > 0) {
          console.log(`      ${key}: ${arr.length}`);
        }
      });
    }

    return upgrades;
  } catch (error) {
    console.log(`   ❌ Research failed: ${error.message}`);
    return null;
  }
}

/**
 * Research platform insights using Claude
 * @param {Object} car - Car object
 * @param {Object} tunability - Tunability calculation result
 */
async function researchPlatformInsights(car, tunability) {
  console.log('   🔬 Researching platform insights...');
  
  const tuningContext = getTuningContextForPrompt(tunability);

  const prompt = `You are an automotive expert. Provide platform insights for the ${car.name} (${car.years}).
${tuningContext}
Return a JSON object with:
{
  "strengths": ["strength 1", "strength 2", ...],  // 3-5 platform strengths
  "weaknesses": [                                   // 3-5 known weaknesses or limitations
    { "title": "Short title", "description": "Detailed explanation" }
  ],
  "community_tips": ["tip 1", "tip 2", ...],       // 3-5 tips from the tuning community
  "tuning_platforms": [                            // Popular tuning software/hardware (leave empty if truly limited)
    { "name": "Platform Name", "notes": "What it's used for" }
  ],
  "power_limits": {                                // Stock component limits (if applicable)
    "stock_turbo": "XXX whp",
    "stock_fuel": "XXX whp", 
    "stock_trans": "XXX lb-ft"
  }
}

Be specific to this car's platform. Include real tuning platform names (COBB, APR, Hondata, etc.) if applicable.
For limited tuning platforms, focus weaknesses on ECU constraints and emphasize bolt-on modifications.

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

    const insights = JSON.parse(jsonMatch[0]);
    console.log(`   ✅ Generated platform insights`);
    return insights;
  } catch (error) {
    console.log(`   ⚠️  Insights research failed: ${error.message}`);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║              AI TUNING RESEARCH                                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('');

  // Fetch car (including brand for tunability calculation)
  const { data: car, error: carError } = await supabase
    .from('cars')
    .select('id, slug, name, years, hp, torque, engine, drivetrain, category, brand')
    .eq('slug', slug)
    .single();

  if (carError || !car) {
    console.error(`❌ Car not found: ${slug}`);
    process.exit(1);
  }

  // Calculate tunability FIRST to inform research prompts
  const tunability = calculateTunabilityForScript(car);
  
  console.log(`🚗 ${car.name} (${car.years})`);
  console.log(`   HP: ${car.hp || 'unknown'}, Torque: ${car.torque || 'unknown'}`);
  console.log(`   Tunability: ${tunability.score}/10${tunability.isLimitedPlatform ? ' (LIMITED PLATFORM)' : ''}`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');
  
  if (tunability.isLimitedPlatform) {
    console.log('   ⚠️  LIMITED TUNING PLATFORM DETECTED');
    console.log('   → Will focus on bolt-on modifications');
    console.log('   → ECU tuning will be marked as constrained');
    console.log('');
  }

  // Check existing profile
  const { data: existingProfile } = await supabase
    .from('car_tuning_profiles')
    .select('id, upgrades_by_objective, platform_insights')
    .eq('car_id', car.id)
    .single();

  const existingUpgrades = existingProfile?.upgrades_by_objective || {};
  const existingCount = Object.values(existingUpgrades).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
  
  console.log(`   Existing upgrades: ${existingCount}`);
  console.log('');

  // Research upgrades (with tunability context)
  const upgrades = await researchTuningUpgrades(car, tunability);
  const insights = await researchPlatformInsights(car, tunability);

  if (!upgrades) {
    console.log('❌ Failed to generate tuning data');
    process.exit(1);
  }

  const newCount = Object.values(upgrades).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

  if (dryRun) {
    console.log('');
    console.log('[DRY RUN] Would update profile with:');
    console.log(`   Upgrades: ${newCount}`);
    Object.entries(upgrades).forEach(([key, arr]) => {
      if (arr?.length > 0) {
        console.log(`     ${key}: ${arr.length}`);
      }
    });
    return;
  }

  // Update profile
  console.log('');
  console.log('   Updating tuning profile...');

  const updateData = {
    upgrades_by_objective: upgrades,
    data_quality_tier: 'researched',
    data_sources: {
      ...existingProfile?.data_sources,
      has_ai_research: true,
      ai_research_date: new Date().toISOString(),
      ai_model: 'claude-sonnet-4-20250514',
    },
    pipeline_version: '1.2.0-ai',
    pipeline_run_at: new Date().toISOString(),
  };

  if (insights) {
    updateData.platform_insights = {
      strengths: insights.strengths || [],
      weaknesses: insights.weaknesses || [],
      community_tips: insights.community_tips || [],
    };
    
    if (insights.tuning_platforms) {
      updateData.tuning_platforms = insights.tuning_platforms;
    }
    
    if (insights.power_limits) {
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
      process.exit(1);
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
      process.exit(1);
    }
  }

  console.log(`   ✅ Profile updated with ${newCount} upgrades`);
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log('AI RESEARCH COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  console.log(`   Upgrades: ${existingCount} → ${newCount}`);
  console.log(`   Quality tier: researched`);
  console.log('');
}

main().catch(console.error);
