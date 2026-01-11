#!/usr/bin/env node
/**
 * Tuning Shop Enhancement Pipeline - Step 5: Validate Profile
 * 
 * Runs quality checks on a tuning profile to ensure data quality:
 * - Required fields populated
 * - Valid HP/cost ranges
 * - Consistent data structure
 * - No obvious errors
 * 
 * Usage:
 *   node scripts/tuning-pipeline/validate-profile.mjs --car-slug ford-f150-thirteenth
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

/**
 * Validation rules and checks
 */
const VALIDATION_RULES = {
  // Stage progression rules
  stage: {
    minHpGain: 0,
    maxHpGain: 1000,
    minCost: 0,
    maxCost: 100000,
    requiredFields: ['stage', 'key', 'components', 'costLow', 'costHigh']
  },
  // Platform rules
  platform: {
    minPrice: 0,
    maxPrice: 5000,
    requiredFields: ['name']
  },
  // Power limit rules
  powerLimit: {
    minWhp: 50,
    maxWhp: 2000
  }
};

/**
 * Validate a tuning profile
 * @param {Object} profile - The profile to validate
 * @returns {Object} - Validation result with errors and warnings
 */
export function validateProfile(profile) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    score: 100,
    details: {}
  };

  if (!profile) {
    result.valid = false;
    result.errors.push({ field: 'profile', message: 'Profile is null or undefined' });
    result.score = 0;
    return result;
  }

  // === REQUIRED FIELDS ===
  
  if (!profile.car_id) {
    result.errors.push({ field: 'car_id', message: 'car_id is required' });
    result.valid = false;
    result.score -= 20;
  }

  if (!profile.tuning_focus) {
    result.errors.push({ field: 'tuning_focus', message: 'tuning_focus is required' });
    result.valid = false;
    result.score -= 10;
  }

  // === UPGRADES BY OBJECTIVE (SOURCE OF TRUTH per DATABASE.md) ===
  
  const upgradesByObjective = profile.upgrades_by_objective || {};
  const totalUpgrades = Object.values(upgradesByObjective).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
  result.details.totalUpgrades = totalUpgrades;
  result.details.upgradesByCategory = {
    power: upgradesByObjective.power?.length || 0,
    handling: upgradesByObjective.handling?.length || 0,
    braking: upgradesByObjective.braking?.length || 0,
    cooling: upgradesByObjective.cooling?.length || 0,
    sound: upgradesByObjective.sound?.length || 0,
    aero: upgradesByObjective.aero?.length || 0
  };

  if (totalUpgrades === 0) {
    result.warnings.push({ field: 'upgrades_by_objective', message: 'No upgrades defined (source of truth column is empty)' });
    result.score -= 20;
  } else {
    // Validate upgrade structure
    for (const [category, upgrades] of Object.entries(upgradesByObjective)) {
      if (!Array.isArray(upgrades)) continue;
      for (let i = 0; i < upgrades.length; i++) {
        const upgrade = upgrades[i];
        if (!upgrade.name) {
          result.warnings.push({ 
            field: `upgrades_by_objective.${category}[${i}]`, 
            message: 'Upgrade missing name' 
          });
          result.score -= 2;
        }
      }
    }
  }

  // === STAGE PROGRESSIONS (Legacy - optional but validated if present) ===
  
  const stages = profile.stage_progressions || [];
  result.details.stagesCount = stages.length;

  // Only warn if no stages AND no upgrades_by_objective
  if (stages.length === 0 && totalUpgrades === 0) {
    result.errors.push({ field: 'stage_progressions', message: 'No stage progressions AND no upgrades_by_objective defined' });
    result.valid = false;
    result.score -= 30;
  } else if (stages.length > 0) {
    let prevHpHigh = 0;
    
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const stageLabel = stage.stage || `Stage ${i + 1}`;

      // Check required fields
      for (const field of VALIDATION_RULES.stage.requiredFields) {
        if (stage[field] === undefined || stage[field] === null) {
          result.warnings.push({ 
            field: `stage_progressions[${i}].${field}`, 
            message: `${stageLabel}: Missing ${field}` 
          });
          result.score -= 2;
        }
      }

      // Validate HP gains
      const hpLow = stage.hpGainLow;
      const hpHigh = stage.hpGainHigh;
      
      if (hpLow !== undefined && hpHigh !== undefined) {
        if (hpLow > hpHigh) {
          result.errors.push({ 
            field: `stage_progressions[${i}].hpGain`, 
            message: `${stageLabel}: hpGainLow (${hpLow}) > hpGainHigh (${hpHigh})` 
          });
          result.valid = false;
          result.score -= 10;
        }
        
        if (hpLow < VALIDATION_RULES.stage.minHpGain || hpHigh > VALIDATION_RULES.stage.maxHpGain) {
          result.warnings.push({ 
            field: `stage_progressions[${i}].hpGain`, 
            message: `${stageLabel}: HP gain outside normal range (${hpLow}-${hpHigh})` 
          });
          result.score -= 5;
        }

        // Check that stages are progressive (later stages have higher gains)
        if (hpHigh < prevHpHigh && i > 0) {
          result.warnings.push({ 
            field: `stage_progressions[${i}].hpGain`, 
            message: `${stageLabel}: HP gain (${hpHigh}) is less than previous stage (${prevHpHigh})` 
          });
          result.score -= 3;
        }
        prevHpHigh = hpHigh;
      }

      // Validate costs
      const costLow = stage.costLow;
      const costHigh = stage.costHigh;
      
      if (costLow !== undefined && costHigh !== undefined) {
        if (costLow > costHigh) {
          result.errors.push({ 
            field: `stage_progressions[${i}].cost`, 
            message: `${stageLabel}: costLow (${costLow}) > costHigh (${costHigh})` 
          });
          result.valid = false;
          result.score -= 10;
        }
        
        if (costLow < VALIDATION_RULES.stage.minCost || costHigh > VALIDATION_RULES.stage.maxCost) {
          result.warnings.push({ 
            field: `stage_progressions[${i}].cost`, 
            message: `${stageLabel}: Cost outside normal range ($${costLow}-${costHigh})` 
          });
          result.score -= 3;
        }
      }

      // Check components array
      if (!Array.isArray(stage.components) || stage.components.length === 0) {
        result.warnings.push({ 
          field: `stage_progressions[${i}].components`, 
          message: `${stageLabel}: No components listed` 
        });
        result.score -= 5;
      }
    }
  }

  // === TUNING PLATFORMS ===
  
  const platforms = profile.tuning_platforms || [];
  result.details.platformsCount = platforms.length;

  if (platforms.length === 0) {
    result.warnings.push({ field: 'tuning_platforms', message: 'No tuning platforms defined' });
    result.score -= 10;
  } else {
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      
      if (!platform.name) {
        result.errors.push({ 
          field: `tuning_platforms[${i}].name`, 
          message: 'Platform missing name' 
        });
        result.valid = false;
        result.score -= 5;
      }

      // Validate price range
      if (platform.priceLow !== null && platform.priceHigh !== null) {
        if (platform.priceLow > platform.priceHigh) {
          result.warnings.push({ 
            field: `tuning_platforms[${i}].price`, 
            message: `${platform.name}: priceLow > priceHigh` 
          });
          result.score -= 3;
        }
      }
    }
  }

  // === POWER LIMITS ===
  
  const powerLimits = profile.power_limits || {};
  result.details.powerLimitsCount = Object.keys(powerLimits).length;

  if (Object.keys(powerLimits).length === 0) {
    result.warnings.push({ field: 'power_limits', message: 'No power limits defined' });
    result.score -= 10;
  } else {
    for (const [key, limit] of Object.entries(powerLimits)) {
      if (limit?.whp || limit?.hp) {
        const value = limit.whp || limit.hp;
        if (value < VALIDATION_RULES.powerLimit.minWhp || value > VALIDATION_RULES.powerLimit.maxWhp) {
          result.warnings.push({ 
            field: `power_limits.${key}`, 
            message: `${key}: Power value ${value} outside normal range` 
          });
          result.score -= 3;
        }
      }
    }
  }

  // === BRAND RECOMMENDATIONS ===
  
  const brands = profile.brand_recommendations || {};
  result.details.brandCategoriesCount = Object.keys(brands).length;

  if (Object.keys(brands).length === 0) {
    result.warnings.push({ field: 'brand_recommendations', message: 'No brand recommendations defined' });
    result.score -= 5;
  } else {
    for (const [category, brandList] of Object.entries(brands)) {
      if (!Array.isArray(brandList) || brandList.length === 0) {
        result.warnings.push({ 
          field: `brand_recommendations.${category}`, 
          message: `${category}: Empty or invalid brand list` 
        });
        result.score -= 2;
      } else if (brandList.length < 3) {
        result.warnings.push({ 
          field: `brand_recommendations.${category}`, 
          message: `${category}: Only ${brandList.length} brands (recommend 3+)` 
        });
        result.score -= 1;
      }
    }
  }

  // === STOCK BASELINE ===
  
  if (!profile.stock_whp && !profile.stock_wtq) {
    result.warnings.push({ field: 'stock_baseline', message: 'No stock baseline WHP/WTQ defined' });
    result.score -= 5;
  }

  // === YOUTUBE INSIGHTS ===
  
  const youtube = profile.youtube_insights || {};
  result.details.youtubeVideoCount = youtube.videoCount || 0;

  if (youtube.videoCount === 0) {
    result.warnings.push({ field: 'youtube_insights', message: 'No YouTube data linked' });
    result.score -= 3;
  }

  // === PIPELINE METADATA ===
  
  if (!profile.pipeline_version) {
    result.warnings.push({ field: 'pipeline_version', message: 'No pipeline version recorded' });
    result.score -= 2;
  }

  // Ensure score doesn't go below 0
  result.score = Math.max(0, result.score);

  return result;
}

/**
 * Format validation result for console output
 */
export function formatValidationResult(result, profileName = 'Profile') {
  const lines = [];
  
  lines.push('═'.repeat(60));
  lines.push(`VALIDATION REPORT: ${profileName}`);
  lines.push('═'.repeat(60));
  
  const statusIcon = result.valid ? '✅' : '❌';
  const statusText = result.valid ? 'VALID' : 'INVALID';
  lines.push(`\n${statusIcon} Status: ${statusText}`);
  lines.push(`📊 Quality Score: ${result.score}/100`);
  
  lines.push('\n📈 Data Coverage:');
  lines.push(`   Total Upgrades:  ${result.details.totalUpgrades || 0}`);
  if (result.details.upgradesByCategory) {
    lines.push(`     - Power:       ${result.details.upgradesByCategory.power || 0}`);
    lines.push(`     - Handling:    ${result.details.upgradesByCategory.handling || 0}`);
    lines.push(`     - Braking:     ${result.details.upgradesByCategory.braking || 0}`);
    lines.push(`     - Cooling:     ${result.details.upgradesByCategory.cooling || 0}`);
  }
  lines.push(`   Stages (legacy): ${result.details.stagesCount || 0}`);
  lines.push(`   Platforms:       ${result.details.platformsCount || 0}`);
  lines.push(`   Power Limits:    ${result.details.powerLimitsCount || 0}`);
  lines.push(`   Brand Categories: ${result.details.brandCategoriesCount || 0}`);
  lines.push(`   YouTube Videos:  ${result.details.youtubeVideoCount || 0}`);
  
  if (result.errors.length > 0) {
    lines.push('\n❌ ERRORS:');
    for (const err of result.errors) {
      lines.push(`   • ${err.field}: ${err.message}`);
    }
  }
  
  if (result.warnings.length > 0) {
    lines.push('\n⚠️  WARNINGS:');
    for (const warn of result.warnings) {
      lines.push(`   • ${warn.field}: ${warn.message}`);
    }
  }
  
  if (result.errors.length === 0 && result.warnings.length === 0) {
    lines.push('\n✨ No issues found!');
  }
  
  lines.push('\n' + '═'.repeat(60));
  
  return lines.join('\n');
}

/**
 * Get profile from database and validate
 */
export async function validateCarProfile(carSlug, carId = null) {
  // Get car
  const carQuery = carId
    ? supabase.from('cars').select('id, slug, name').eq('id', carId).single()
    : supabase.from('cars').select('id, slug, name').eq('slug', carSlug).single();
  
  const { data: car, error: carError } = await carQuery;
  
  if (carError || !car) {
    throw new Error(`Car not found: ${carSlug || carId}`);
  }

  // Get all profiles for this car
  const { data: profiles, error: profileError } = await supabase
    .from('car_tuning_profiles')
    .select('*')
    .eq('car_id', car.id);

  if (profileError) {
    throw new Error(`Error fetching profiles: ${profileError.message}`);
  }

  if (!profiles || profiles.length === 0) {
    return {
      car,
      profiles: [],
      results: [],
      summary: { totalProfiles: 0, validProfiles: 0, avgScore: 0 }
    };
  }

  // Validate each profile
  const results = profiles.map(profile => ({
    profile,
    validation: validateProfile(profile),
    name: `${car.name} - ${profile.engine_family || 'Default'} (${profile.tuning_focus})`
  }));

  const validCount = results.filter(r => r.validation.valid).length;
  const avgScore = results.reduce((sum, r) => sum + r.validation.score, 0) / results.length;

  return {
    car,
    profiles,
    results,
    summary: {
      totalProfiles: profiles.length,
      validProfiles: validCount,
      avgScore: Math.round(avgScore)
    }
  };
}

// CLI execution
async function main() {
  const { values } = parseArgs({
    options: {
      'car-slug': { type: 'string' },
      'car-id': { type: 'string' },
      'json': { type: 'boolean', default: false },
      'help': { type: 'boolean', short: 'h' }
    }
  });

  if (values.help || (!values['car-slug'] && !values['car-id'])) {
    console.log(`
Tuning Shop Enhancement Pipeline - Profile Validation

Usage:
  node validate-profile.mjs --car-slug <slug>
  node validate-profile.mjs --car-id <uuid>

Options:
  --car-slug    Car slug to validate profiles for
  --car-id      Car UUID to validate profiles for
  --json        Output as JSON instead of formatted report
  -h, --help    Show this help message
`);
    process.exit(0);
  }

  try {
    const result = await validateCarProfile(values['car-slug'], values['car-id']);

    if (values.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(`\n🔍 Validating profiles for: ${result.car.name}\n`);

    if (result.profiles.length === 0) {
      console.log('⚠️  No tuning profiles found for this car.');
      console.log('   Run create-profile.mjs first to create a profile.');
      return;
    }

    for (const { validation, name } of result.results) {
      console.log(formatValidationResult(validation, name));
    }

    console.log('\n📊 SUMMARY:');
    console.log(`   Total Profiles: ${result.summary.totalProfiles}`);
    console.log(`   Valid Profiles: ${result.summary.validProfiles}/${result.summary.totalProfiles}`);
    console.log(`   Average Score:  ${result.summary.avgScore}/100`);

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMainModule) {
  main().catch(console.error);
}
