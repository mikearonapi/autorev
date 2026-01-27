#!/usr/bin/env node
/**
 * Data Consistency Audit Script
 * 
 * Scans the database for contradictions between different data sources:
 * - Recommendations vs Platform Insights (ECU tune contradictions)
 * - Stage progressions vs Power limits
 * - Editorial content (pros/cons) vs Platform insights
 * - Known issues vs Recommendations
 * 
 * Usage:
 *   node scripts/audit-data-consistency.mjs
 *   node scripts/audit-data-consistency.mjs --fix  # Generate fix suggestions
 *   node scripts/audit-data-consistency.mjs --car ferrari-458  # Audit single car
 * 
 * Output:
 *   - Console report of all contradictions found
 *   - Optional: audit/data-consistency-audit-{date}.json
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// ============================================================================
// TUNABILITY CALCULATION (Matches lib/tunabilityCalculator.js)
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
  'porsche-gt': 5, // GT3, GT4, GT2 models
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

const TUNING_DIFFICULTY_KEYWORDS = [
  'impossible',
  'nearly impossible',
  'not possible',
  'cannot be tuned',
  'no tuning',
  'locked ecu',
  'ecu locked',
  'encrypted ecu',
  'no flash',
  'can\'t flash',
  'cannot flash',
  'no aftermarket tune',
  'no ecu tune',
  'tuning not available',
  'no tuning options',
  'limited tuning',
  'very limited tuning',
  'extremely limited',
  'no software available',
  'no tuners support',
  'bolt-on only',
  'bolt-ons only',
  'hardware only',
];

function calculateTunabilityScore(car) {
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
  
  // Use car's aftermarket support score if available
  if (car.score_aftermarket !== undefined && car.score_aftermarket !== null) {
    const aftermarketAdj = (car.score_aftermarket - 5) / 2;
    baseScore += aftermarketAdj;
  }
  
  return Math.max(1, Math.min(10, Math.round(baseScore * 10) / 10));
}

function checkTuningDifficultyInInsights(platformInsights) {
  if (!platformInsights) return { hasDifficulty: false, matchedTerms: [] };
  
  const matchedTerms = [];
  
  const weaknesses = platformInsights.weaknesses || [];
  const communityTips = platformInsights.community_tips || [];
  const allText = [
    ...weaknesses.map(w => typeof w === 'string' ? w : w.title || w.description || ''),
    ...communityTips.map(t => typeof t === 'string' ? t : t.text || ''),
  ].join(' ').toLowerCase();
  
  for (const keyword of TUNING_DIFFICULTY_KEYWORDS) {
    // Use word boundary regex to avoid false positives like "dyno tuning" matching "no tuning"
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');
    if (regex.test(allText)) {
      matchedTerms.push(keyword);
    }
  }
  
  return {
    hasDifficulty: matchedTerms.length > 0,
    matchedTerms,
  };
}

// ============================================================================
// AUDIT CHECKS
// ============================================================================

const auditResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalCarsAudited: 0,
    contradictionsFound: 0,
    criticalIssues: 0,
    warnings: 0,
  },
  contradictions: [],
  warnings: [],
  recommendations: [],
};

/**
 * Check 1: ECU Tune Contradiction
 * Platform says tuning is impossible but car would get tune recommendation
 */
async function checkEcuTuneContradiction(car, tuningProfile) {
  const issues = [];
  
  const tunabilityScore = calculateTunabilityScore(car);
  const platformInsights = tuningProfile?.platform_insights;
  const insightsCheck = checkTuningDifficultyInInsights(platformInsights);
  
  // Is this a forced-induction car that would get ECU tune recommendation?
  const engine = (car.engine || '').toLowerCase();
  const isForcedInduction = engine.includes('turbo') || engine.includes('supercharged');
  
  // Check for contradiction: would recommend tune but insights say impossible
  if (isForcedInduction && insightsCheck.hasDifficulty) {
    issues.push({
      type: 'ECU_TUNE_CONTRADICTION',
      severity: 'critical',
      car: car.name,
      carSlug: car.slug,
      message: `Would recommend ECU tune (forced induction) but platform insights mention: "${insightsCheck.matchedTerms.join(', ')}"`,
      details: {
        tunabilityScore,
        engine: car.engine,
        matchedTerms: insightsCheck.matchedTerms,
      },
      fix: 'Remove or update platform insights, or suppress ECU tune recommendation for this platform',
    });
  }
  
  // Check for low tunability platforms
  if (isForcedInduction && tunabilityScore < 5) {
    issues.push({
      type: 'LOW_TUNABILITY_WITH_FI',
      severity: 'warning',
      car: car.name,
      carSlug: car.slug,
      message: `Forced induction car with low tunability score (${tunabilityScore}/10) - ECU tune may be problematic`,
      details: {
        tunabilityScore,
        brand: car.brand,
      },
      fix: 'Verify ECU tuning options exist for this platform before recommending',
    });
  }
  
  return issues;
}

/**
 * Check 2: Stage Progression vs Power Limits
 * Stage targets exceed documented power limits
 */
async function checkStageVsPowerLimits(car, tuningProfile) {
  const issues = [];
  
  const stageProgressions = tuningProfile?.stage_progressions;
  const powerLimits = tuningProfile?.power_limits;
  
  if (!stageProgressions || !powerLimits) return issues;
  
  const stockInternalsLimit = powerLimits.stockInternals;
  const stockHp = car.hp || 0;
  
  for (const [stageName, stageData] of Object.entries(stageProgressions)) {
    const targetHp = stageData.estimated_whp || stageData.hp || 0;
    
    if (stockInternalsLimit && targetHp > stockInternalsLimit) {
      // Stage 3+ is expected to exceed, warn but don't flag as critical
      const isCritical = !stageName.toLowerCase().includes('stage 3') && 
                        !stageName.toLowerCase().includes('big turbo');
      
      issues.push({
        type: 'STAGE_EXCEEDS_LIMIT',
        severity: isCritical ? 'critical' : 'warning',
        car: car.name,
        carSlug: car.slug,
        message: `${stageName} targets ${targetHp}hp but stock internals limit is ${stockInternalsLimit}hp`,
        details: {
          stageName,
          targetHp,
          stockInternalsLimit,
          stockHp,
        },
        fix: isCritical 
          ? 'Reduce stage target HP or add warning about internals upgrade requirement'
          : 'Consider adding note about internals upgrade for this stage',
      });
    }
  }
  
  return issues;
}

/**
 * Check 3: Editorial Consistency
 * Pros/cons contradict platform insights
 */
async function checkEditorialConsistency(car, tuningProfile) {
  const issues = [];
  
  const pros = car.pros || [];
  const cons = car.cons || [];
  const platformInsights = tuningProfile?.platform_insights;
  
  if (!platformInsights) return issues;
  
  const weaknesses = platformInsights.weaknesses || [];
  const strengths = platformInsights.strengths || [];
  
  // Pattern checks
  const prosText = pros.join(' ').toLowerCase();
  const consText = cons.join(' ').toLowerCase();
  const weaknessText = weaknesses.map(w => typeof w === 'string' ? w : w.title || '').join(' ').toLowerCase();
  const strengthText = strengths.map(s => typeof s === 'string' ? s : s.title || '').join(' ').toLowerCase();
  
  // Pro mentions aftermarket, weakness mentions limited tuning
  if (/aftermarket|tuning support|tuneable|mod friendly/i.test(prosText) && 
      /limited tuning|no tuning|hard to tune|difficult to tune/i.test(weaknessText)) {
    issues.push({
      type: 'EDITORIAL_CONTRADICTION',
      severity: 'warning',
      car: car.name,
      carSlug: car.slug,
      message: 'Pros mention aftermarket support, but weaknesses mention limited tuning',
      details: {
        prosExcerpt: pros.find(p => /aftermarket|tuning/i.test(p)),
        weaknessExcerpt: weaknesses.find(w => {
          const text = typeof w === 'string' ? w : w.title || '';
          return /limited|hard|difficult/i.test(text);
        }),
      },
      fix: 'Align pros/cons with platform insights or clarify the nuance',
    });
  }
  
  // Pro mentions reliability, weakness mentions reliability issues
  if (/reliable|reliability|dependable/i.test(prosText) && 
      /unreliable|reliability issues|common failures|known issues/i.test(weaknessText)) {
    issues.push({
      type: 'EDITORIAL_CONTRADICTION',
      severity: 'warning',
      car: car.name,
      carSlug: car.slug,
      message: 'Pros mention reliability, but weaknesses mention reliability issues',
      details: {},
      fix: 'Reconcile reliability claims with known issues',
    });
  }
  
  return issues;
}

/**
 * Check 4: Data Quality Gating
 * Low quality data generating confident recommendations
 */
async function checkDataQuality(car, tuningProfile) {
  const issues = [];
  
  const dataQuality = tuningProfile?.data_quality_tier;
  const hasStageProgressions = tuningProfile?.stage_progressions && 
    Object.keys(tuningProfile.stage_progressions).length > 0;
  const hasUpgradesByObjective = tuningProfile?.upgrades_by_objective &&
    Object.values(tuningProfile.upgrades_by_objective).some(arr => arr?.length > 0);
  
  if ((dataQuality === 'skeleton' || dataQuality === 'minimal') && 
      (hasStageProgressions || hasUpgradesByObjective)) {
    issues.push({
      type: 'LOW_QUALITY_WITH_RECOMMENDATIONS',
      severity: 'warning',
      car: car.name,
      carSlug: car.slug,
      message: `Data quality is "${dataQuality}" but has stage progressions or upgrades - recommendations may be unreliable`,
      details: {
        dataQuality,
        hasStageProgressions,
        hasUpgradesByObjective,
      },
      fix: 'Either improve data quality tier or add disclaimer to recommendations',
    });
  }
  
  return issues;
}

/**
 * Check 5: Tuning Platforms vs Insights
 * Has tuning platforms listed but insights say tuning is impossible
 */
async function checkTuningPlatformsVsInsights(car, tuningProfile) {
  const issues = [];
  
  const tuningPlatforms = tuningProfile?.tuning_platforms || [];
  const platformInsights = tuningProfile?.platform_insights;
  const insightsCheck = checkTuningDifficultyInInsights(platformInsights);
  
  if (tuningPlatforms.length > 0 && insightsCheck.hasDifficulty) {
    issues.push({
      type: 'TUNING_PLATFORMS_CONTRADICTION',
      severity: 'critical',
      car: car.name,
      carSlug: car.slug,
      message: `Has ${tuningPlatforms.length} tuning platforms listed but insights say tuning is difficult: "${insightsCheck.matchedTerms.join(', ')}"`,
      details: {
        platforms: tuningPlatforms,
        matchedTerms: insightsCheck.matchedTerms,
      },
      fix: 'Either remove tuning platforms or update insights to be more accurate',
    });
  }
  
  return issues;
}

// ============================================================================
// MAIN AUDIT FUNCTION
// ============================================================================

async function runAudit(targetSlug = null) {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DATA CONSISTENCY AUDIT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Started: ${new Date().toISOString()}`);
  if (targetSlug) {
    console.log(`Target: ${targetSlug}`);
  }
  console.log('');
  
  // Fetch all cars with their tuning profiles
  // Note: aspiration is derived from engine field, not a separate column
  let query = supabase
    .from('cars')
    .select(`
      id, slug, name, brand, engine, hp,
      pros, cons, score_aftermarket, tier,
      defining_strengths, honest_weaknesses
    `);
  
  if (targetSlug) {
    query = query.eq('slug', targetSlug);
  }
  
  const { data: cars, error: carsError } = await query;
  
  if (carsError) {
    console.error('Failed to fetch cars:', carsError.message);
    process.exit(1);
  }
  
  console.log(`Found ${cars.length} cars to audit\n`);
  
  // Fetch all tuning profiles
  const { data: tuningProfiles, error: profilesError } = await supabase
    .from('car_tuning_profiles')
    .select('*');
  
  if (profilesError) {
    console.error('Failed to fetch tuning profiles:', profilesError.message);
    process.exit(1);
  }
  
  // Index profiles by car_id
  const profilesByCarId = {};
  tuningProfiles?.forEach(p => {
    profilesByCarId[p.car_id] = p;
  });
  
  console.log(`Found ${tuningProfiles?.length || 0} tuning profiles\n`);
  
  // Run audit checks
  let processed = 0;
  
  for (const car of cars) {
    processed++;
    const tuningProfile = profilesByCarId[car.id];
    
    // Run all checks
    const allIssues = [
      ...await checkEcuTuneContradiction(car, tuningProfile),
      ...await checkStageVsPowerLimits(car, tuningProfile),
      ...await checkEditorialConsistency(car, tuningProfile),
      ...await checkDataQuality(car, tuningProfile),
      ...await checkTuningPlatformsVsInsights(car, tuningProfile),
    ];
    
    // Categorize issues
    const criticalIssues = allIssues.filter(i => i.severity === 'critical');
    const warnings = allIssues.filter(i => i.severity === 'warning');
    
    if (allIssues.length > 0) {
      auditResults.contradictions.push(...criticalIssues);
      auditResults.warnings.push(...warnings);
      auditResults.summary.contradictionsFound += criticalIssues.length;
      auditResults.summary.warnings += warnings.length;
      auditResults.summary.criticalIssues += criticalIssues.length;
    }
    
    // Progress indicator
    if (processed % 50 === 0 || processed === cars.length) {
      process.stdout.write(`\rProcessed: ${processed}/${cars.length} cars`);
    }
  }
  
  auditResults.summary.totalCarsAudited = cars.length;
  
  console.log('\n\n');
  
  // Print results
  printResults();
  
  // Save to file
  const dateStr = new Date().toISOString().split('T')[0];
  const outputPath = path.join(process.cwd(), 'audit', `data-consistency-audit-${dateStr}.json`);
  
  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(auditResults, null, 2));
    console.log(`\n📄 Full report saved to: ${outputPath}`);
  } catch (err) {
    console.warn(`\n⚠️  Could not save report: ${err.message}`);
  }
  
  return auditResults;
}

function printResults() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('AUDIT RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total cars audited: ${auditResults.summary.totalCarsAudited}`);
  console.log(`Critical issues found: ${auditResults.summary.criticalIssues}`);
  console.log(`Warnings found: ${auditResults.summary.warnings}`);
  console.log('');
  
  if (auditResults.contradictions.length > 0) {
    console.log('─────────────────────────────────────────────────────────────');
    console.log('🚨 CRITICAL CONTRADICTIONS');
    console.log('─────────────────────────────────────────────────────────────');
    
    // Group by type
    const byType = {};
    auditResults.contradictions.forEach(c => {
      if (!byType[c.type]) byType[c.type] = [];
      byType[c.type].push(c);
    });
    
    for (const [type, issues] of Object.entries(byType)) {
      console.log(`\n${type} (${issues.length} issues):`);
      issues.slice(0, 10).forEach(issue => {
        console.log(`  ❌ ${issue.car} (${issue.carSlug})`);
        console.log(`     ${issue.message}`);
        console.log(`     Fix: ${issue.fix}`);
      });
      if (issues.length > 10) {
        console.log(`  ... and ${issues.length - 10} more`);
      }
    }
  }
  
  if (auditResults.warnings.length > 0) {
    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('⚠️  WARNINGS');
    console.log('─────────────────────────────────────────────────────────────');
    
    // Group by type
    const byType = {};
    auditResults.warnings.forEach(w => {
      if (!byType[w.type]) byType[w.type] = [];
      byType[w.type].push(w);
    });
    
    for (const [type, issues] of Object.entries(byType)) {
      console.log(`\n${type} (${issues.length} issues):`);
      issues.slice(0, 5).forEach(issue => {
        console.log(`  ⚠️  ${issue.car} (${issue.carSlug})`);
        console.log(`     ${issue.message}`);
      });
      if (issues.length > 5) {
        console.log(`  ... and ${issues.length - 5} more`);
      }
    }
  }
  
  if (auditResults.contradictions.length === 0 && auditResults.warnings.length === 0) {
    console.log('✅ No contradictions or warnings found!');
  }
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

const args = process.argv.slice(2);
let targetSlug = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--car' && args[i + 1]) {
    targetSlug = args[i + 1];
    i++;
  }
}

runAudit(targetSlug).then(() => {
  console.log('\n✅ Audit complete');
  process.exit(auditResults.summary.criticalIssues > 0 ? 1 : 0);
}).catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
