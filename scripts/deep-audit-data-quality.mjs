#!/usr/bin/env node
/**
 * Deep Data Quality Audit
 * 
 * A comprehensive audit beyond the basic consistency checks:
 * - Electric vehicle tuning recommendations (shouldn't happen)
 * - Unrealistic power claims in stage progressions
 * - Contradictory pros/cons
 * - Missing essential data
 * - Price range anomalies
 * - Duplicate or broken data
 * 
 * Run: node scripts/deep-audit-data-quality.mjs
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const issues = {
  critical: [],
  warning: [],
  info: [],
};

function addIssue(severity, type, car, message, details = {}) {
  issues[severity].push({
    type,
    car: car?.name || 'Unknown',
    slug: car?.slug || 'unknown',
    message,
    details,
  });
}

// ============================================================================
// CHECK 1: Electric Vehicles - Should NOT recommend ECU tuning
// ============================================================================
async function checkElectricVehicles(cars, profiles) {
  console.log('\n🔌 Checking electric vehicles...');
  
  // More specific EV detection - avoid false positives like "Evo", "Evora", Chevy models
  const evSlugs = [
    'lightning', 'mach-e', 'taycan', 'plaid', 'rivian', 'ioniq', 
    'model-s', 'model-3', 'model-x', 'model-y', 'hummer-ev', 'lyriq',
    'bolt-ev', 'leaf', 'id-4', 'ariya', 'kona-electric', 'niro-ev',
    'polestar', 'lucid', 'fisker'
  ];
  
  for (const car of cars) {
    const engine = (car.engine || '').toLowerCase();
    const name = (car.name || '').toLowerCase();
    const slug = (car.slug || '').toLowerCase();
    
    // Must match "electric" as a word, or specific EV slugs, or have electric motor specs
    // EXCLUDE hybrids - they have gas engines that CAN be tuned
    const isHybrid = engine.includes('hybrid') || 
                     engine.includes('+ electric') || 
                     engine.includes('+electric') ||
                     name.toLowerCase().includes('hybrid') ||
                     slug.includes('hybrid');
    
    const isElectric = !isHybrid && (
                       engine.match(/^(dual |triple |quad )?electric/i) || // Starts with electric
                       engine.match(/\d+\s*kw\s*(motor|battery)/i) ||
                       name.match(/\belectric\b/i) ||
                       evSlugs.some(kw => slug.includes(kw)));
    
    if (isElectric) {
      const profile = profiles.find(p => p.car_id === car.id);
      
      // Check if tuning platforms suggest ECU tunes
      const platforms = profile?.tuning_platforms || [];
      const hasTuneSuggestion = platforms.some(p => {
        const notes = (p.notes || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return notes.includes('ecu') || notes.includes('tune') || 
               name.includes('tune') || name.includes('flash');
      });
      
      if (hasTuneSuggestion) {
        addIssue('critical', 'EV_ECU_TUNE', car,
          'Electric vehicle has ECU tuning platforms listed - EVs do not have traditional ECU tunes',
          { platforms: platforms.map(p => p.name) }
        );
      }
      
      // Check platform insights for "ECU tune" mentions
      const insights = profile?.platform_insights;
      if (insights) {
        const insightStr = JSON.stringify(insights).toLowerCase();
        if (insightStr.includes('ecu tune') || insightStr.includes('flash tune')) {
          addIssue('warning', 'EV_INSIGHT_TUNE_MENTION', car,
            'Electric vehicle insights mention ECU/flash tuning - may be misleading',
            {}
          );
        }
      }
    }
  }
}

// ============================================================================
// CHECK 2: Unrealistic Power Claims
// ============================================================================
async function checkUnrealisticPower(cars, profiles) {
  console.log('\n⚡ Checking for unrealistic power claims...');
  
  for (const car of cars) {
    const stockHp = car.hp || 0;
    if (stockHp === 0) continue;
    
    const profile = profiles.find(p => p.car_id === car.id);
    const stages = profile?.stage_progressions || {};
    
    for (const [stageName, stageData] of Object.entries(stages)) {
      const targetHp = stageData.estimated_whp || stageData.hp || 0;
      if (targetHp === 0) continue;
      
      const gainPercent = ((targetHp - stockHp) / stockHp) * 100;
      
      // Check for unrealistic gains
      const engine = (car.engine || '').toLowerCase();
      const isTurbo = engine.includes('turbo') || engine.includes('supercharged');
      const isNA = !isTurbo;
      
      // NA cars: Stage 1-2 should be < 20% gain, Stage 3 < 50%
      // Turbo cars: Stage 1 < 40%, Stage 2 < 60%, Stage 3 can be higher
      
      const stageNum = stageName.match(/stage\s*(\d)/i)?.[1] || '1';
      
      if (isNA) {
        if (stageNum === '1' && gainPercent > 15) {
          addIssue('warning', 'UNREALISTIC_NA_GAIN', car,
            `NA car shows ${gainPercent.toFixed(0)}% gain at ${stageName} - typically < 15% for NA Stage 1`,
            { stageName, stockHp, targetHp, gainPercent: gainPercent.toFixed(1) }
          );
        }
        if (stageNum === '2' && gainPercent > 25) {
          addIssue('warning', 'UNREALISTIC_NA_GAIN', car,
            `NA car shows ${gainPercent.toFixed(0)}% gain at ${stageName} - typically < 25% for NA Stage 2`,
            { stageName, stockHp, targetHp, gainPercent: gainPercent.toFixed(1) }
          );
        }
      }
      
      if (isTurbo) {
        if (stageNum === '1' && gainPercent > 50) {
          addIssue('warning', 'UNREALISTIC_TURBO_GAIN', car,
            `Turbo car shows ${gainPercent.toFixed(0)}% gain at ${stageName} - unusually high for Stage 1`,
            { stageName, stockHp, targetHp, gainPercent: gainPercent.toFixed(1) }
          );
        }
      }
      
      // Any car: > 200% gain is suspicious
      if (gainPercent > 200) {
        addIssue('critical', 'EXTREME_POWER_CLAIM', car,
          `Shows ${gainPercent.toFixed(0)}% power gain (${stockHp} → ${targetHp}hp) - needs verification`,
          { stageName, stockHp, targetHp, gainPercent: gainPercent.toFixed(1) }
        );
      }
    }
  }
}

// ============================================================================
// CHECK 3: Contradictory Pros/Cons  
// ============================================================================
async function checkContradictoryProsCons(cars) {
  console.log('\n📝 Checking for contradictory pros/cons...');
  
  const contradictions = [
    { proPattern: /reliable|reliability|dependable/i, conPattern: /unreliable|breaks|failures|issues/i, topic: 'reliability' },
    { proPattern: /fuel.?efficient|great.?mpg|economical/i, conPattern: /drinks.?fuel|poor.?mpg|gas.?guzzler|thirsty/i, topic: 'fuel economy' },
    { proPattern: /tuning|mod.?friendly|aftermarket/i, conPattern: /limited.?tuning|no.?aftermarket|difficult.?to.?tune/i, topic: 'tuning support' },
    { proPattern: /cheap|affordable|value|budget/i, conPattern: /expensive|costly|pricey/i, topic: 'cost' },
    { proPattern: /practical|spacious|room/i, conPattern: /cramped|impractical|no.?room|tight/i, topic: 'practicality' },
  ];
  
  for (const car of cars) {
    const pros = (car.pros || []).join(' ');
    const cons = (car.cons || []).join(' ');
    
    for (const { proPattern, conPattern, topic } of contradictions) {
      if (proPattern.test(pros) && conPattern.test(cons)) {
        addIssue('warning', 'CONTRADICTORY_PROS_CONS', car,
          `Pros and cons contradict each other on ${topic}`,
          { 
            proMatch: pros.match(proPattern)?.[0],
            conMatch: cons.match(conPattern)?.[0],
          }
        );
      }
    }
  }
}

// ============================================================================
// CHECK 4: Missing Essential Data
// ============================================================================
async function checkMissingEssentialData(cars, profiles) {
  console.log('\n📋 Checking for missing essential data...');
  
  for (const car of cars) {
    // Check for missing HP
    if (!car.hp || car.hp === 0) {
      addIssue('info', 'MISSING_HP', car, 'Car has no horsepower data', {});
    }
    
    // Check for missing engine info
    if (!car.engine || car.engine.trim() === '') {
      addIssue('info', 'MISSING_ENGINE', car, 'Car has no engine information', {});
    }
    
    const profile = profiles.find(p => p.car_id === car.id);
    
    // Tuning profile without any useful data
    if (profile) {
      const hasInsights = profile.platform_insights && 
        (profile.platform_insights.strengths?.length > 0 || 
         profile.platform_insights.weaknesses?.length > 0);
      const hasPlatforms = profile.tuning_platforms?.length > 0;
      const hasStages = profile.stage_progressions && 
        Object.keys(profile.stage_progressions).length > 0;
      
      if (!hasInsights && !hasPlatforms && !hasStages) {
        addIssue('info', 'EMPTY_TUNING_PROFILE', car, 
          'Tuning profile exists but has no insights, platforms, or stages', {});
      }
    }
  }
}

// ============================================================================
// CHECK 5: Price Range Anomalies
// ============================================================================
async function checkPriceAnomalies(profiles) {
  console.log('\n💰 Checking for price anomalies...');
  
  for (const profile of profiles) {
    const platforms = profile.tuning_platforms || [];
    
    for (const platform of platforms) {
      const low = platform.price_low || platform.priceLow || 0;
      const high = platform.price_high || platform.priceHigh || 0;
      
      // Price low higher than high
      if (low > high && high > 0) {
        addIssue('warning', 'PRICE_RANGE_INVERTED', { slug: profile.car_id },
          `Platform "${platform.name}" has inverted price range: $${low} - $${high}`,
          { platform: platform.name, low, high }
        );
      }
      
      // Suspiciously low prices for ECU tunes
      if (high > 0 && high < 50 && 
          (platform.name?.toLowerCase().includes('tune') || 
           platform.name?.toLowerCase().includes('ecu'))) {
        addIssue('warning', 'SUSPICIOUSLY_LOW_PRICE', { slug: profile.car_id },
          `Platform "${platform.name}" has very low price ($${high}) - may be incorrect`,
          { platform: platform.name, high }
        );
      }
      
      // Extreme prices (> $100k for a tune)
      if (high > 100000) {
        addIssue('info', 'EXTREME_PRICE', { slug: profile.car_id },
          `Platform "${platform.name}" has very high price ($${high.toLocaleString()}) - verify accuracy`,
          { platform: platform.name, high }
        );
      }
    }
  }
}

// ============================================================================
// CHECK 6: Duplicate/Inconsistent Community Tips
// ============================================================================
async function checkCommunityTips(profiles) {
  console.log('\n💬 Checking community tips for issues...');
  
  for (const profile of profiles) {
    const insights = profile.platform_insights;
    if (!insights) continue;
    
    const tips = insights.community_tips || [];
    
    // Check for very short tips (likely incomplete)
    for (const tip of tips) {
      const tipText = typeof tip === 'string' ? tip : tip.text || '';
      if (tipText.length < 20 && tipText.length > 0) {
        addIssue('info', 'SHORT_COMMUNITY_TIP', { slug: profile.car_id },
          `Very short community tip: "${tipText}"`,
          { tip: tipText }
        );
      }
    }
    
    // Check for duplicate tips
    const tipTexts = tips.map(t => typeof t === 'string' ? t : t.text || '').filter(Boolean);
    const uniqueTips = new Set(tipTexts.map(t => t.toLowerCase().trim()));
    if (uniqueTips.size < tipTexts.length) {
      addIssue('warning', 'DUPLICATE_TIPS', { slug: profile.car_id },
        `Has ${tipTexts.length - uniqueTips.size} duplicate community tips`,
        { totalTips: tipTexts.length, uniqueTips: uniqueTips.size }
      );
    }
  }
}

// ============================================================================
// CHECK 7: Specific Pattern Issues
// ============================================================================
async function checkSpecificPatterns(cars, profiles) {
  console.log('\n🔍 Checking for specific problematic patterns...');
  
  // Check for placeholder text that wasn't filled in
  const placeholderPatterns = [
    /\[insert\]/i,
    /\[placeholder\]/i,
    /\[TODO\]/i,
    /TBD/,
    /lorem ipsum/i,
    /\$X+/,
    /XX+hp/i,
  ];
  
  for (const profile of profiles) {
    const allText = JSON.stringify(profile);
    
    for (const pattern of placeholderPatterns) {
      if (pattern.test(allText)) {
        const car = cars.find(c => c.id === profile.car_id);
        addIssue('warning', 'PLACEHOLDER_TEXT', car || { slug: profile.car_id },
          `Contains placeholder text matching: ${pattern}`,
          { pattern: pattern.toString() }
        );
        break;
      }
    }
  }
  
  // Check for broken JSON fragments in text fields
  for (const profile of profiles) {
    const insights = profile.platform_insights;
    if (!insights) continue;
    
    // Check for arrays with malformed objects
    const checkArrays = [insights.strengths, insights.weaknesses, insights.community_tips];
    for (const arr of checkArrays) {
      if (!Array.isArray(arr)) continue;
      for (const item of arr) {
        if (typeof item === 'string') {
          // Check for JSON-like fragments that shouldn't be in plain text
          if (item.includes('{"') || item.includes('": "') || item.includes('null,')) {
            const car = cars.find(c => c.id === profile.car_id);
            addIssue('warning', 'JSON_FRAGMENT_IN_TEXT', car || { slug: profile.car_id },
              'Insight text contains JSON fragments - likely parsing error',
              { text: item.substring(0, 100) }
            );
          }
        }
      }
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DEEP DATA QUALITY AUDIT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Started: ${new Date().toISOString()}\n`);
  
  // Fetch all data
  const { data: cars, error: carsError } = await supabase
    .from('cars')
    .select('id, slug, name, brand, engine, hp, pros, cons');
  
  if (carsError) {
    console.error('Failed to fetch cars:', carsError.message);
    process.exit(1);
  }
  
  const { data: profiles, error: profilesError } = await supabase
    .from('car_tuning_profiles')
    .select('*');
  
  if (profilesError) {
    console.error('Failed to fetch profiles:', profilesError.message);
    process.exit(1);
  }
  
  console.log(`Loaded ${cars.length} cars and ${profiles.length} tuning profiles`);
  
  // Run all checks
  await checkElectricVehicles(cars, profiles);
  await checkUnrealisticPower(cars, profiles);
  await checkContradictoryProsCons(cars);
  await checkMissingEssentialData(cars, profiles);
  await checkPriceAnomalies(profiles);
  await checkCommunityTips(profiles);
  await checkSpecificPatterns(cars, profiles);
  
  // Print results
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('AUDIT RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Critical issues: ${issues.critical.length}`);
  console.log(`Warnings: ${issues.warning.length}`);
  console.log(`Info: ${issues.info.length}`);
  
  if (issues.critical.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    for (const issue of issues.critical) {
      console.log(`  ❌ [${issue.type}] ${issue.car} (${issue.slug})`);
      console.log(`     ${issue.message}`);
    }
  }
  
  if (issues.warning.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    const byType = {};
    for (const issue of issues.warning) {
      if (!byType[issue.type]) byType[issue.type] = [];
      byType[issue.type].push(issue);
    }
    for (const [type, typeIssues] of Object.entries(byType)) {
      console.log(`\n  ${type} (${typeIssues.length}):`);
      typeIssues.slice(0, 5).forEach(issue => {
        console.log(`    - ${issue.car}: ${issue.message}`);
      });
      if (typeIssues.length > 5) {
        console.log(`    ... and ${typeIssues.length - 5} more`);
      }
    }
  }
  
  if (issues.info.length > 0) {
    console.log('\n📝 INFO:');
    const byType = {};
    for (const issue of issues.info) {
      if (!byType[issue.type]) byType[issue.type] = [];
      byType[issue.type].push(issue);
    }
    for (const [type, typeIssues] of Object.entries(byType)) {
      console.log(`  ${type}: ${typeIssues.length} items`);
    }
  }
  
  // Save full report
  const reportPath = path.join(process.cwd(), 'audit', `deep-audit-${new Date().toISOString().split('T')[0]}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({ 
    timestamp: new Date().toISOString(),
    summary: {
      critical: issues.critical.length,
      warnings: issues.warning.length,
      info: issues.info.length,
    },
    issues 
  }, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  return issues;
}

main().catch(console.error);
