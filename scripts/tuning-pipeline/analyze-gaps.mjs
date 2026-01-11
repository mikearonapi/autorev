#!/usr/bin/env node
/**
 * Tuning Shop Enhancement Pipeline - Step 2: Gap Analysis
 * 
 * Analyzes mined data and identifies what's missing for a complete tuning profile.
 * Generates a structured gap report with recommendations for research needed.
 * 
 * Usage:
 *   node scripts/tuning-pipeline/analyze-gaps.mjs --car-slug ford-f150-thirteenth
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'util';
import { mineDatabase } from './mine-database.mjs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

/**
 * Analyze gaps in the mined data
 * @param {Object} minedData - Data from mineDatabase()
 * @returns {Object} - Gap analysis report
 */
export function analyzeGaps(minedData) {
  const report = {
    carSlug: minedData.car?.slug,
    carName: minedData.car?.name,
    coverage: {
      youtube_videos: minedData.youtubeVideos.length,
      videos_with_transcripts: minedData.youtubeVideos.filter(v => v.transcript_text).length,
      issues_count: minedData.issues.length,
      parts_count: minedData.parts.length,
      dyno_runs: minedData.dynoRuns.length,
      variants_count: minedData.variants.length,
      has_upgrade_recommendations: Boolean(minedData.car?.upgrade_recommendations),
      has_key_resources: Boolean(minedData.car?.key_resources),
      has_existing_profile: Boolean(minedData.existingProfile)
    },
    gaps: [],
    warnings: [],
    dataQuality: {
      score: 0,
      breakdown: {}
    },
    youtubeInsights: minedData.insights,
    researchNeeded: [],
    engineVariantsNeeded: []
  };

  // Determine car type for context-aware analysis
  const carType = detectCarType(minedData.car);
  report.carType = carType;

  // === CHECK FOR GAPS ===

  // 1. Stage progressions - CRITICAL
  if (!minedData.existingProfile?.stage_progressions?.length) {
    const upgradeRecs = minedData.car?.upgrade_recommendations;
    const hasStageData = upgradeRecs && (
      Array.isArray(upgradeRecs) || 
      upgradeRecs.stageProgressions || 
      upgradeRecs.stages
    );
    
    if (!hasStageData) {
      report.gaps.push({
        category: 'stage_progressions',
        severity: 'critical',
        message: 'No stage progression data found',
        sources_checked: ['car_tuning_profiles', 'cars.upgrade_recommendations']
      });
      
      // Determine what stages to research based on car type
      if (carType === 'turbo') {
        report.researchNeeded.push('Stage 1-3 progression for turbocharged platform');
        report.researchNeeded.push('Tuner-specific stage definitions (COBB, APR, etc.)');
      } else if (carType === 'supercharged') {
        report.researchNeeded.push('Pulley/tune progression');
        report.researchNeeded.push('Supercharger upgrade path');
      } else if (carType === 'na') {
        report.researchNeeded.push('NA tuning stages (intake/exhaust/tune gains)');
        report.researchNeeded.push('Forced induction upgrade path (supercharger/turbo kit)');
      } else if (carType === 'off-road') {
        report.researchNeeded.push('Off-road build progression (lift, tires, armor)');
        report.researchNeeded.push('Gearing requirements by tire size');
      }
    }
  }

  // 2. Tuning platforms - HIGH
  const tunerMentions = minedData.insights.tunerMentions || [];
  if (!minedData.existingProfile?.tuning_platforms?.length && tunerMentions.length < 2) {
    report.gaps.push({
      category: 'tuning_platforms',
      severity: 'high',
      message: 'Insufficient tuning platform data',
      sources_checked: ['car_tuning_profiles', 'youtube_insights'],
      partial_data: tunerMentions.length > 0 ? tunerMentions : null
    });
    report.researchNeeded.push('Compatible tuning platforms with pricing');
  }

  // 3. Power limits - HIGH
  if (!minedData.existingProfile?.power_limits || Object.keys(minedData.existingProfile?.power_limits || {}).length === 0) {
    report.gaps.push({
      category: 'power_limits',
      severity: 'high',
      message: 'No power limit data found',
      sources_checked: ['car_tuning_profiles']
    });
    report.researchNeeded.push('Safe power limits for stock components');
  }

  // 4. Brand recommendations - MEDIUM
  const brandMentions = minedData.insights.brandMentions || [];
  const partsWithBrands = minedData.parts.filter(p => p.brand).length;
  if (!minedData.existingProfile?.brand_recommendations && brandMentions.length < 5 && partsWithBrands < 5) {
    report.gaps.push({
      category: 'brand_recommendations',
      severity: 'medium',
      message: 'Insufficient brand recommendation data',
      sources_checked: ['car_tuning_profiles', 'parts', 'youtube_insights'],
      partial_data: brandMentions.length > 0 ? brandMentions : null
    });
    report.researchNeeded.push('Top brands by category (intakes, exhausts, etc.)');
  }

  // 5. Known issues - MEDIUM
  if (minedData.issues.length < 3) {
    report.gaps.push({
      category: 'known_issues',
      severity: 'medium',
      message: `Only ${minedData.issues.length} issues documented`,
      sources_checked: ['car_issues']
    });
    report.researchNeeded.push('Common issues, TSBs, and failure points');
  }

  // 6. Community resources - LOW
  if (!minedData.car?.key_resources) {
    report.gaps.push({
      category: 'community_resources',
      severity: 'low',
      message: 'No community resources documented',
      sources_checked: ['cars.key_resources']
    });
    report.researchNeeded.push('Forums, subreddits, and community resources');
  }

  // 7. Dyno baseline - PREFERRED
  const hasStockDyno = minedData.dynoRuns.some(r => 
    r.run_kind === 'baseline' || r.configuration?.toLowerCase().includes('stock')
  );
  if (!hasStockDyno && minedData.dynoRuns.length === 0) {
    report.gaps.push({
      category: 'dyno_baseline',
      severity: 'low',
      message: 'No dyno baseline data',
      sources_checked: ['car_dyno_runs']
    });
    report.researchNeeded.push('Stock dyno baseline (whp/wtq)');
  }

  // 8. Engine variants - CHECK
  const car = minedData.car;
  const needsVariants = detectNeedsMultipleProfiles(car);
  
  if (needsVariants.length > 0 && minedData.variants.length === 0) {
    report.warnings.push({
      category: 'engine_variants',
      message: `This platform likely has multiple engine options that need separate profiles`,
      suggested_variants: needsVariants
    });
    report.engineVariantsNeeded = needsVariants;
  }

  // === CALCULATE DATA QUALITY SCORE ===
  
  const scoring = {
    stage_progressions: { weight: 30, has: !report.gaps.find(g => g.category === 'stage_progressions') },
    tuning_platforms: { weight: 20, has: !report.gaps.find(g => g.category === 'tuning_platforms') },
    power_limits: { weight: 15, has: !report.gaps.find(g => g.category === 'power_limits') },
    brand_recommendations: { weight: 10, has: !report.gaps.find(g => g.category === 'brand_recommendations') },
    known_issues: { weight: 10, has: minedData.issues.length >= 3 },
    community_resources: { weight: 5, has: Boolean(minedData.car?.key_resources) },
    dyno_baseline: { weight: 5, has: minedData.dynoRuns.length > 0 },
    youtube_coverage: { weight: 5, has: minedData.youtubeVideos.length >= 3 }
  };

  let totalScore = 0;
  for (const [key, { weight, has }] of Object.entries(scoring)) {
    if (has) totalScore += weight;
    report.dataQuality.breakdown[key] = { weight, has, score: has ? weight : 0 };
  }
  report.dataQuality.score = totalScore;

  // === GENERATE SUMMARY ===
  
  report.summary = generateGapSummary(report);

  return report;
}

/**
 * Detect car type for context-aware gap analysis
 */
function detectCarType(car) {
  if (!car) return 'unknown';
  
  const name = (car.name || '').toLowerCase();
  const engine = (car.engine || '').toLowerCase();
  const forcedInduction = (car.forced_induction_type || '').toLowerCase();
  
  // Off-road vehicles
  if (name.includes('wrangler') || name.includes('4runner') || 
      name.includes('tacoma') || name.includes('bronco') ||
      name.includes('gladiator') || name.includes('colorado zr2')) {
    return 'off-road';
  }
  
  // Turbocharged
  if (forcedInduction.includes('turbo') || forcedInduction.includes('twin-turbo') ||
      engine.includes('turbo') || name.includes('ecoboost') ||
      name.includes('gti') || name.includes('wrx') || name.includes('sti') ||
      name.includes('rs3') || name.includes('golf r')) {
    return 'turbo';
  }
  
  // Supercharged
  if (forcedInduction.includes('supercharg') || 
      name.includes('hellcat') || name.includes('gt500') ||
      name.includes('zl1') || name.includes('z06')) {
    return 'supercharged';
  }
  
  // Default to NA
  return 'na';
}

/**
 * Detect if a car likely needs multiple tuning profiles for different engines
 */
function detectNeedsMultipleProfiles(car) {
  if (!car) return [];
  
  const name = (car.name || '').toLowerCase();
  const variants = [];
  
  // F-150 has multiple engines
  if (name.includes('f-150') || name.includes('f150')) {
    variants.push({ engine: '3.5L EcoBoost', focus: 'performance' });
    variants.push({ engine: '5.0L Coyote', focus: 'performance' });
    variants.push({ engine: '2.7L EcoBoost', focus: 'performance' });
  }
  
  // Mustang has GT and EcoBoost
  if (name.includes('mustang') && !name.includes('gt350') && !name.includes('gt500')) {
    variants.push({ engine: '5.0L Coyote V8', focus: 'performance' });
    variants.push({ engine: '2.3L EcoBoost', focus: 'performance' });
  }
  
  // Silverado/Sierra
  if (name.includes('silverado') || name.includes('sierra')) {
    variants.push({ engine: '5.3L V8', focus: 'performance' });
    variants.push({ engine: '6.2L V8', focus: 'performance' });
    variants.push({ engine: '3.0L Duramax', focus: 'towing' });
  }
  
  // Ram 1500
  if (name.includes('ram') && name.includes('1500')) {
    variants.push({ engine: '5.7L HEMI', focus: 'performance' });
    variants.push({ engine: '3.0L EcoDiesel', focus: 'towing' });
  }
  
  return variants;
}

/**
 * Generate human-readable summary of gaps
 */
function generateGapSummary(report) {
  const lines = [];
  
  const criticalGaps = report.gaps.filter(g => g.severity === 'critical').length;
  const highGaps = report.gaps.filter(g => g.severity === 'high').length;
  const totalGaps = report.gaps.length;
  
  if (totalGaps === 0) {
    lines.push('✅ No critical data gaps found. Profile may be ready for creation.');
  } else {
    lines.push(`⚠️  Found ${totalGaps} data gaps (${criticalGaps} critical, ${highGaps} high)`);
  }
  
  lines.push(`📊 Data Quality Score: ${report.dataQuality.score}/100`);
  
  if (report.researchNeeded.length > 0) {
    lines.push(`📝 Research tasks needed: ${report.researchNeeded.length}`);
  }
  
  if (report.engineVariantsNeeded.length > 0) {
    lines.push(`🔧 Engine variants to create: ${report.engineVariantsNeeded.length}`);
  }
  
  return lines.join('\n');
}

/**
 * Format gap report for console output
 */
export function formatGapReport(report) {
  const lines = [];
  
  lines.push('═'.repeat(60));
  lines.push(`GAP ANALYSIS REPORT: ${report.carName || report.carSlug}`);
  lines.push('═'.repeat(60));
  
  lines.push(`\n📊 DATA QUALITY SCORE: ${report.dataQuality.score}/100`);
  lines.push(`   Car Type: ${report.carType}`);
  
  lines.push('\n📈 SCORE BREAKDOWN:');
  for (const [key, { weight, has, score }] of Object.entries(report.dataQuality.breakdown)) {
    const status = has ? '✓' : '✗';
    lines.push(`   ${status} ${key.padEnd(25)} ${score}/${weight}`);
  }
  
  if (report.gaps.length > 0) {
    lines.push('\n⚠️  GAPS IDENTIFIED:');
    for (const gap of report.gaps) {
      const icon = gap.severity === 'critical' ? '🔴' : gap.severity === 'high' ? '🟠' : '🟡';
      lines.push(`   ${icon} [${gap.severity.toUpperCase()}] ${gap.category}`);
      lines.push(`      ${gap.message}`);
      if (gap.partial_data) {
        lines.push(`      Partial data: ${JSON.stringify(gap.partial_data)}`);
      }
    }
  }
  
  if (report.warnings.length > 0) {
    lines.push('\n⚡ WARNINGS:');
    for (const warning of report.warnings) {
      lines.push(`   ${warning.message}`);
      if (warning.suggested_variants) {
        for (const v of warning.suggested_variants) {
          lines.push(`      - ${v.engine} (${v.focus})`);
        }
      }
    }
  }
  
  if (report.researchNeeded.length > 0) {
    lines.push('\n📝 RESEARCH NEEDED:');
    for (const item of report.researchNeeded) {
      lines.push(`   • ${item}`);
    }
  }
  
  if (report.youtubeInsights.tunerMentions?.length > 0) {
    lines.push('\n🎬 YOUTUBE INSIGHTS (can be used):');
    lines.push(`   Tuners: ${report.youtubeInsights.tunerMentions.join(', ')}`);
    if (report.youtubeInsights.brandMentions?.length > 0) {
      lines.push(`   Brands: ${report.youtubeInsights.brandMentions.slice(0, 10).join(', ')}`);
    }
    if (report.youtubeInsights.avgAftermarketSentiment !== null) {
      lines.push(`   Aftermarket Sentiment: ${(report.youtubeInsights.avgAftermarketSentiment * 100).toFixed(0)}%`);
    }
  }
  
  lines.push('\n' + '─'.repeat(60));
  lines.push(report.summary);
  lines.push('═'.repeat(60));
  
  return lines.join('\n');
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
Tuning Shop Enhancement Pipeline - Gap Analysis

Usage:
  node analyze-gaps.mjs --car-slug <slug>
  node analyze-gaps.mjs --car-id <uuid>

Options:
  --car-slug    Car slug to analyze
  --car-id      Car UUID to analyze
  --json        Output as JSON instead of formatted report
  -h, --help    Show this help message
`);
    process.exit(0);
  }

  try {
    // First mine the data
    console.log('Mining database...');
    const minedData = await mineDatabase(values['car-slug'], values['car-id']);
    
    // Then analyze gaps
    console.log('Analyzing gaps...');
    const report = analyzeGaps(minedData);
    
    if (values.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatGapReport(report));
    }
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
