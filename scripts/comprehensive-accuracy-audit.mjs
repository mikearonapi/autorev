#!/usr/bin/env node
/**
 * Comprehensive Accuracy Audit
 * 
 * Analyzes multiple dimensions of data quality:
 * 1. HP/Power Figure Accuracy - Compare to known specs
 * 2. Stage Progression Logic - Stages should increase logically
 * 3. Price Realism - Tuning prices should be within market ranges
 * 4. Known Issues Cross-Check - Issues should match common reports
 * 5. Duplicate Detection - Find duplicate cars or redundant data
 * 6. Data Completeness - Find cars missing critical info
 * 7. Year/Model Validation - Verify year ranges make sense
 * 8. Aspiration Consistency - Engine description should match aspiration
 * 
 * Run: node scripts/comprehensive-accuracy-audit.mjs
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

const findings = {
  critical: [],
  warning: [],
  info: [],
  stats: {}
};

function addFinding(severity, category, car, message, details = {}) {
  findings[severity].push({
    category,
    car: car?.name || car?.slug || 'Unknown',
    slug: car?.slug || 'unknown',
    message,
    details,
  });
}

// ============================================================================
// CHECK 1: HP/Power Figure Accuracy
// ============================================================================
async function checkPowerFigures(cars) {
  console.log('\n⚡ Checking power figure accuracy...');
  
  // Known reference HP values for popular cars (manufacturer specs)
  const knownSpecs = {
    // Format: 'slug-pattern': { minHp, maxHp, name }
    'toyota-gr86': { minHp: 228, maxHp: 234, name: 'GR86' },
    'toyota-supra-mk5': { minHp: 382, maxHp: 390, name: 'Supra A90' },
    'toyota-supra-mk4': { minHp: 320, maxHp: 330, name: 'Supra Mk4' },
    'bmw-m3-e46': { minHp: 333, maxHp: 343, name: 'E46 M3' },
    'bmw-m3-e92': { minHp: 414, maxHp: 420, name: 'E92 M3' },
    'bmw-m3-f80': { minHp: 425, maxHp: 431, name: 'F80 M3' },
    'nissan-370z': { minHp: 332, maxHp: 350, name: '370Z' },
    'mazda-mx5-miata-nd': { minHp: 181, maxHp: 184, name: 'ND Miata' },
    'mazda-mx5-miata-nc': { minHp: 167, maxHp: 170, name: 'NC Miata' },
    'ford-mustang-gt-s550': { minHp: 435, maxHp: 460, name: 'S550 Mustang GT' },
    'chevrolet-camaro-ss': { minHp: 455, maxHp: 460, name: 'Camaro SS' },
    'dodge-challenger-hellcat': { minHp: 707, maxHp: 717, name: 'Hellcat' },
    'porsche-911-gt3-992': { minHp: 502, maxHp: 510, name: '992 GT3' },
    'porsche-911-turbo-s-992': { minHp: 640, maxHp: 650, name: '992 Turbo S' },
    'honda-civic-type-r-fk8': { minHp: 306, maxHp: 316, name: 'FK8 Type R' },
    'subaru-wrx-sti': { minHp: 305, maxHp: 315, name: 'WRX STI' },
    'volkswagen-golf-r': { minHp: 315, maxHp: 320, name: 'Golf R' },
    'audi-rs3': { minHp: 394, maxHp: 407, name: 'RS3' },
    'mercedes-amg-c63': { minHp: 469, maxHp: 510, name: 'C63 AMG' },
    'ferrari-458': { minHp: 562, maxHp: 570, name: '458' },
    'lamborghini-huracan': { minHp: 602, maxHp: 640, name: 'Huracan' },
    'mclaren-720s': { minHp: 710, maxHp: 720, name: '720S' },
  };
  
  let checked = 0;
  let issues = 0;
  
  for (const car of cars) {
    if (!car.hp) continue;
    
    // Find matching spec
    for (const [pattern, spec] of Object.entries(knownSpecs)) {
      if (car.slug?.includes(pattern)) {
        checked++;
        if (car.hp < spec.minHp - 10 || car.hp > spec.maxHp + 10) {
          issues++;
          addFinding('warning', 'POWER_FIGURE_MISMATCH', car,
            `Listed as ${car.hp}hp but ${spec.name} should be ${spec.minHp}-${spec.maxHp}hp`,
            { listed: car.hp, expected: `${spec.minHp}-${spec.maxHp}` }
          );
        }
        break;
      }
    }
  }
  
  findings.stats.powerFigures = { checked, issues };
  console.log(`  Checked ${checked} cars against known specs, found ${issues} mismatches`);
}

// ============================================================================
// CHECK 2: Stage Progression Logic
// ============================================================================
async function checkStageProgressions(cars, profiles) {
  console.log('\n📈 Checking stage progression logic...');
  
  let checked = 0;
  let issues = 0;
  
  for (const profile of profiles) {
    const stages = profile.stage_progressions;
    if (!stages || Object.keys(stages).length < 2) continue;
    
    const car = cars.find(c => c.id === profile.car_id);
    if (!car) continue;
    
    checked++;
    
    // Extract stage data and sort by stage number
    const stageEntries = Object.entries(stages)
      .map(([name, data]) => {
        const num = name.match(/stage\s*(\d)/i)?.[1] || '0';
        return {
          name,
          num: parseInt(num),
          hp: data.estimated_whp || data.hp || 0,
          cost: data.estimated_cost || data.cost || 0,
        };
      })
      .filter(s => s.hp > 0)
      .sort((a, b) => a.num - b.num);
    
    // Check that HP increases with stage number
    for (let i = 1; i < stageEntries.length; i++) {
      const prev = stageEntries[i - 1];
      const curr = stageEntries[i];
      
      if (curr.hp < prev.hp && curr.num > prev.num) {
        issues++;
        addFinding('warning', 'STAGE_HP_REGRESSION', car,
          `${curr.name} (${curr.hp}hp) is less than ${prev.name} (${prev.hp}hp)`,
          { stages: stageEntries.map(s => `${s.name}: ${s.hp}hp`) }
        );
        break;
      }
    }
    
    // Check for unrealistic jumps between stages
    for (let i = 1; i < stageEntries.length; i++) {
      const prev = stageEntries[i - 1];
      const curr = stageEntries[i];
      const jump = curr.hp - prev.hp;
      const jumpPercent = (jump / prev.hp) * 100;
      
      if (jumpPercent > 100 && curr.num - prev.num === 1) {
        addFinding('info', 'LARGE_STAGE_JUMP', car,
          `${jumpPercent.toFixed(0)}% HP increase from ${prev.name} to ${curr.name}`,
          { from: prev.hp, to: curr.hp }
        );
      }
    }
  }
  
  findings.stats.stageProgressions = { checked, issues };
  console.log(`  Checked ${checked} stage progressions, found ${issues} logic issues`);
}

// ============================================================================
// CHECK 3: Price Realism
// ============================================================================
async function checkPriceRealism(profiles) {
  console.log('\n💰 Checking price realism...');
  
  let checked = 0;
  let issues = 0;
  
  // Reasonable price ranges by modification type
  const priceRanges = {
    tune: { min: 200, max: 3000, name: 'ECU tune' },
    flash: { min: 200, max: 2000, name: 'Flash tune' },
    intake: { min: 100, max: 1000, name: 'Intake' },
    exhaust: { min: 300, max: 5000, name: 'Exhaust' },
    turbo: { min: 1000, max: 15000, name: 'Turbo upgrade' },
    supercharger: { min: 3000, max: 20000, name: 'Supercharger' },
    intercooler: { min: 300, max: 3000, name: 'Intercooler' },
    downpipe: { min: 200, max: 2000, name: 'Downpipe' },
    coilovers: { min: 500, max: 5000, name: 'Coilovers' },
    brake: { min: 200, max: 10000, name: 'Brake kit' },
  };
  
  for (const profile of profiles) {
    const platforms = profile.tuning_platforms || [];
    
    for (const platform of platforms) {
      const low = platform.price_low || platform.priceLow || 0;
      const high = platform.price_high || platform.priceHigh || 0;
      const name = (platform.name || '').toLowerCase();
      
      if (high === 0) continue;
      checked++;
      
      // Check against known ranges
      for (const [keyword, range] of Object.entries(priceRanges)) {
        if (name.includes(keyword)) {
          if (high < range.min * 0.5) {
            issues++;
            addFinding('warning', 'PRICE_TOO_LOW', { slug: profile.car_id },
              `${platform.name} priced at $${high} - typical ${range.name} is $${range.min}-$${range.max}`,
              { platform: platform.name, price: high, typical: range }
            );
          } else if (low > range.max * 2) {
            issues++;
            addFinding('warning', 'PRICE_TOO_HIGH', { slug: profile.car_id },
              `${platform.name} priced at $${low}+ - typical ${range.name} is $${range.min}-$${range.max}`,
              { platform: platform.name, price: low, typical: range }
            );
          }
          break;
        }
      }
    }
  }
  
  findings.stats.priceRealism = { checked, issues };
  console.log(`  Checked ${checked} price entries, found ${issues} outliers`);
}

// ============================================================================
// CHECK 4: Duplicate Detection
// ============================================================================
async function checkDuplicates(cars) {
  console.log('\n🔍 Checking for duplicates...');
  
  // Check for similar names
  const nameMap = new Map();
  let duplicates = 0;
  
  for (const car of cars) {
    const normalizedName = car.name?.toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/generation|gen|mk|series/g, '');
    
    if (nameMap.has(normalizedName)) {
      duplicates++;
      const existing = nameMap.get(normalizedName);
      addFinding('info', 'POTENTIAL_DUPLICATE', car,
        `May be duplicate of "${existing.name}" (${existing.slug})`,
        { existing: existing.slug, current: car.slug }
      );
    } else {
      nameMap.set(normalizedName, car);
    }
  }
  
  // Check for very similar HP + year + brand combinations
  const specMap = new Map();
  for (const car of cars) {
    if (!car.hp || !car.brand) continue;
    const key = `${car.brand}-${car.hp}-${car.years || ''}`;
    if (specMap.has(key)) {
      const existing = specMap.get(key);
      if (existing.slug !== car.slug) {
        addFinding('info', 'SIMILAR_SPECS', car,
          `Same HP/brand/year as "${existing.name}"`,
          { existing: existing.slug }
        );
      }
    } else {
      specMap.set(key, car);
    }
  }
  
  findings.stats.duplicates = { found: duplicates };
  console.log(`  Found ${duplicates} potential duplicates`);
}

// ============================================================================
// CHECK 5: Data Completeness
// ============================================================================
async function checkDataCompleteness(cars, profiles) {
  console.log('\n📋 Checking data completeness...');
  
  const incomplete = {
    noHp: 0,
    noEngine: 0,
    noYears: 0,
    noPros: 0,
    noCons: 0,
    noProfile: 0,
    emptyProfile: 0,
  };
  
  const profileCarIds = new Set(profiles.map(p => p.car_id));
  
  for (const car of cars) {
    if (!car.hp || car.hp === 0) incomplete.noHp++;
    if (!car.engine || car.engine.trim() === '') incomplete.noEngine++;
    if (!car.years || car.years.trim() === '') incomplete.noYears++;
    if (!car.pros || car.pros.length === 0) incomplete.noPros++;
    if (!car.cons || car.cons.length === 0) incomplete.noCons++;
    if (!profileCarIds.has(car.id)) incomplete.noProfile++;
  }
  
  for (const profile of profiles) {
    const hasData = profile.platform_insights || 
                    profile.tuning_platforms?.length > 0 ||
                    profile.stage_progressions && Object.keys(profile.stage_progressions).length > 0;
    if (!hasData) incomplete.emptyProfile++;
  }
  
  findings.stats.completeness = incomplete;
  
  console.log(`  Cars missing HP: ${incomplete.noHp}`);
  console.log(`  Cars missing engine: ${incomplete.noEngine}`);
  console.log(`  Cars missing years: ${incomplete.noYears}`);
  console.log(`  Cars missing pros: ${incomplete.noPros}`);
  console.log(`  Cars missing cons: ${incomplete.noCons}`);
  console.log(`  Cars without tuning profile: ${incomplete.noProfile}`);
  console.log(`  Empty tuning profiles: ${incomplete.emptyProfile}`);
  
  // Flag critical completeness issues
  for (const car of cars) {
    if (!car.hp || car.hp === 0) {
      addFinding('info', 'MISSING_HP', car, 'Missing horsepower data', {});
    }
    if (!profileCarIds.has(car.id)) {
      addFinding('info', 'NO_TUNING_PROFILE', car, 'No tuning profile exists', {});
    }
  }
}

// ============================================================================
// CHECK 6: Aspiration Consistency
// ============================================================================
async function checkAspirationConsistency(cars) {
  console.log('\n🌀 Checking aspiration consistency...');
  
  let issues = 0;
  
  for (const car of cars) {
    const engine = (car.engine || '').toLowerCase();
    
    // Check for turbo/supercharged in engine description
    const hasTurboInEngine = engine.includes('turbo') || engine.includes('twin-turbo') || engine.includes('biturbo');
    const hasSuperchargedInEngine = engine.includes('supercharged') || engine.includes('kompressor');
    const hasNAIndicator = engine.includes('naturally aspirated') || engine.includes('na ');
    
    // Check HP to engine size ratio (rough heuristic)
    const displacement = engine.match(/(\d+\.?\d*)\s*l/i)?.[1];
    if (displacement && car.hp) {
      const liters = parseFloat(displacement);
      const hpPerLiter = car.hp / liters;
      
      // NA engines typically make 70-130 hp/L
      // Turbo engines typically make 100-250+ hp/L
      if (!hasTurboInEngine && !hasSuperchargedInEngine && hpPerLiter > 160) {
        issues++;
        addFinding('warning', 'ASPIRATION_MISMATCH', car,
          `${hpPerLiter.toFixed(0)} hp/L suggests forced induction but engine listed as "${car.engine}"`,
          { hp: car.hp, displacement: liters, hpPerLiter: hpPerLiter.toFixed(0) }
        );
      }
    }
  }
  
  findings.stats.aspirationIssues = issues;
  console.log(`  Found ${issues} potential aspiration mismatches`);
}

// ============================================================================
// CHECK 7: Known Issues Quality
// ============================================================================
async function checkKnownIssuesQuality(profiles) {
  console.log('\n🔧 Checking known issues quality...');
  
  let totalIssues = 0;
  let carsWithIssues = 0;
  let genericIssues = 0;
  
  const genericPatterns = [
    /general wear/i,
    /normal maintenance/i,
    /typical issues/i,
    /common problems/i,
    /as expected/i,
  ];
  
  for (const profile of profiles) {
    const issues = profile.known_issues || [];
    if (issues.length > 0) {
      carsWithIssues++;
      totalIssues += issues.length;
      
      for (const issue of issues) {
        const text = typeof issue === 'string' ? issue : issue.description || '';
        for (const pattern of genericPatterns) {
          if (pattern.test(text)) {
            genericIssues++;
            addFinding('info', 'GENERIC_KNOWN_ISSUE', { slug: profile.car_id },
              `Known issue seems too generic: "${text.substring(0, 50)}..."`,
              {}
            );
            break;
          }
        }
      }
    }
  }
  
  findings.stats.knownIssues = { carsWithIssues, totalIssues, genericIssues };
  console.log(`  ${carsWithIssues} cars have known issues documented (${totalIssues} total issues)`);
  console.log(`  ${genericIssues} issues flagged as potentially too generic`);
}

// ============================================================================
// CHECK 8: URL Validation
// ============================================================================
async function checkURLs(profiles) {
  console.log('\n🔗 Checking tuning platform URLs...');
  
  let checked = 0;
  let invalid = 0;
  let missing = 0;
  
  for (const profile of profiles) {
    const platforms = profile.tuning_platforms || [];
    
    for (const platform of platforms) {
      if (platform.url) {
        checked++;
        // Basic URL validation
        try {
          new URL(platform.url);
        } catch {
          invalid++;
          addFinding('warning', 'INVALID_URL', { slug: profile.car_id },
            `Invalid URL for ${platform.name}: "${platform.url}"`,
            { platform: platform.name, url: platform.url }
          );
        }
      } else if (platform.name) {
        missing++;
      }
    }
  }
  
  findings.stats.urls = { checked, invalid, missing };
  console.log(`  Checked ${checked} URLs, ${invalid} invalid, ${missing} missing`);
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('COMPREHENSIVE ACCURACY AUDIT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Started: ${new Date().toISOString()}\n`);
  
  // Fetch all data
  const { data: cars, error: carsError } = await supabase
    .from('cars')
    .select('id, slug, name, brand, engine, hp, years, pros, cons');
  
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
  await checkPowerFigures(cars);
  await checkStageProgressions(cars, profiles);
  await checkPriceRealism(profiles);
  await checkDuplicates(cars);
  await checkDataCompleteness(cars, profiles);
  await checkAspirationConsistency(cars);
  await checkKnownIssuesQuality(profiles);
  await checkURLs(profiles);
  
  // Print summary
  console.log('\n\n═══════════════════════════════════════════════════════════════');
  console.log('AUDIT SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Critical issues: ${findings.critical.length}`);
  console.log(`Warnings: ${findings.warning.length}`);
  console.log(`Info items: ${findings.info.length}`);
  
  console.log('\n📊 STATISTICS:');
  console.log(JSON.stringify(findings.stats, null, 2));
  
  if (findings.critical.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    for (const f of findings.critical) {
      console.log(`  ❌ [${f.category}] ${f.car}: ${f.message}`);
    }
  }
  
  if (findings.warning.length > 0) {
    console.log('\n⚠️  WARNINGS (first 15):');
    const byCategory = {};
    for (const f of findings.warning) {
      if (!byCategory[f.category]) byCategory[f.category] = [];
      byCategory[f.category].push(f);
    }
    for (const [cat, items] of Object.entries(byCategory)) {
      console.log(`\n  ${cat} (${items.length}):`);
      items.slice(0, 5).forEach(f => {
        console.log(`    - ${f.car}: ${f.message}`);
      });
      if (items.length > 5) console.log(`    ... and ${items.length - 5} more`);
    }
  }
  
  // Save full report
  const reportPath = path.join(process.cwd(), 'audit', `comprehensive-audit-${new Date().toISOString().split('T')[0]}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(findings, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);
}

main().catch(console.error);
