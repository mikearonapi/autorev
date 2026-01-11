#!/usr/bin/env node
/**
 * AI Research Tuning Data
 * 
 * Uses Claude AI to research and generate tuning upgrade recommendations
 * for cars that don't have data from other sources.
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

/**
 * Research tuning upgrades using Claude
 */
async function researchTuningUpgrades(car) {
  console.log('   🔬 Researching tuning upgrades with Claude...');

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
 */
async function researchPlatformInsights(car) {
  console.log('   🔬 Researching platform insights...');

  const prompt = `You are an automotive expert. Provide platform insights for the ${car.name} (${car.years}).

Return a JSON object with:
{
  "strengths": ["strength 1", "strength 2", ...],  // 3-5 platform strengths
  "weaknesses": ["weakness 1", "weakness 2", ...], // 3-5 known weaknesses or limitations
  "community_tips": ["tip 1", "tip 2", ...],       // 3-5 tips from the tuning community
  "tuning_platforms": [                            // Popular tuning software/hardware
    { "name": "Platform Name", "notes": "What it's used for" }
  ],
  "power_limits": {                                // Stock component limits
    "stock_turbo": "XXX whp",
    "stock_fuel": "XXX whp", 
    "stock_trans": "XXX lb-ft"
  }
}

Be specific to this car's platform. Include real tuning platform names (COBB, APR, Hondata, etc.) if applicable.

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

  // Fetch car
  const { data: car, error: carError } = await supabase
    .from('cars')
    .select('id, slug, name, years, hp, torque, engine, drivetrain, category')
    .eq('slug', slug)
    .single();

  if (carError || !car) {
    console.error(`❌ Car not found: ${slug}`);
    process.exit(1);
  }

  console.log(`🚗 ${car.name} (${car.years})`);
  console.log(`   HP: ${car.hp || 'unknown'}, Torque: ${car.torque || 'unknown'}`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

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

  // Research upgrades
  const upgrades = await researchTuningUpgrades(car);
  const insights = await researchPlatformInsights(car);

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
