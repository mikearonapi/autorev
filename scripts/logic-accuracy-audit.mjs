#!/usr/bin/env node
/**
 * Logic & Accuracy Audit
 * 
 * Checks that the CONTENT makes sense for each specific vehicle:
 * 
 * 1. Aspiration-Specific Logic
 *    - NA cars shouldn't have intercooler/downpipe recommendations
 *    - Turbo cars should have boost-related content
 *    - Supercharged cars shouldn't get turbo-specific advice
 * 
 * 2. Drivetrain-Specific Logic
 *    - AWD cars shouldn't get "RWD burnout" tips
 *    - FWD cars shouldn't get "rear diff upgrade" recommendations
 * 
 * 3. Platform-Specific Tuning
 *    - Hondata only works on Honda/Acura
 *    - Cobb only works on certain platforms
 *    - BMW-specific tools shouldn't be on other brands
 * 
 * 4. Stage Progression Logic
 *    - Stage 2 shouldn't be achievable without Stage 1 mods mentioned
 *    - HP gains should be realistic for the engine type
 * 
 * 5. Self-Contradiction Detection
 *    - Strengths shouldn't contradict weaknesses on same topic
 *    - Tips shouldn't contradict platform insights
 * 
 * Run: node scripts/logic-accuracy-audit.mjs
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

const issues = [];

function addIssue(severity, category, car, message, details = {}) {
  issues.push({
    severity, // 'critical', 'warning', 'info'
    category,
    car: car.name,
    slug: car.slug,
    message,
    details,
  });
}

// ============================================================================
// HELPER: Extract text from all content fields
// ============================================================================
function getAllText(profile) {
  const texts = [];
  
  // Platform insights
  const insights = profile.platform_insights || {};
  (insights.strengths || []).forEach(s => texts.push(typeof s === 'string' ? s : s.title || s.description || ''));
  (insights.weaknesses || []).forEach(w => texts.push(typeof w === 'string' ? w : w.title || w.description || ''));
  (insights.community_tips || []).forEach(t => texts.push(typeof t === 'string' ? t : t.text || ''));
  
  // Tuning platforms
  (profile.tuning_platforms || []).forEach(p => {
    texts.push(p.name || '');
    texts.push(p.notes || '');
  });
  
  // Stage progressions
  Object.values(profile.stage_progressions || {}).forEach(stage => {
    texts.push(stage.description || '');
    texts.push(stage.notes || '');
    (stage.mods || []).forEach(m => texts.push(typeof m === 'string' ? m : m.name || ''));
  });
  
  return texts.join(' ').toLowerCase();
}

// ============================================================================
// CHECK 1: Aspiration-Specific Logic
// ============================================================================
async function checkAspirationLogic(car, profile) {
  const engine = (car.engine || '').toLowerCase();
  const allText = getAllText(profile);
  
  const isTurbo = engine.includes('turbo') || engine.includes('twin-turbo') || engine.includes('biturbo');
  const isSupercharged = engine.includes('supercharged') || engine.includes('kompressor');
  const isNA = !isTurbo && !isSupercharged && !engine.includes('electric');
  
  // NA cars shouldn't have turbo-specific mod recommendations
  if (isNA) {
    const turboMods = ['intercooler', 'downpipe', 'blow-off valve', 'bov', 'wastegate', 'boost controller', 'boost gauge'];
    for (const mod of turboMods) {
      if (allText.includes(mod) && !allText.includes('turbo kit') && !allText.includes('add turbo')) {
        addIssue('critical', 'NA_CAR_TURBO_MOD', car,
          `NA car has "${mod}" recommendation without turbo kit context`,
          { engine: car.engine, foundTerm: mod }
        );
      }
    }
    
    // NA cars shouldn't mention "boost" gains unless discussing forced induction conversion
    if (allText.includes('boost') && !allText.includes('turbo') && !allText.includes('supercharger')) {
      addIssue('warning', 'NA_CAR_BOOST_MENTION', car,
        'NA car content mentions "boost" without forced induction context',
        { engine: car.engine }
      );
    }
  }
  
  // Turbo cars SHOULD have boost-related content
  if (isTurbo) {
    const hasBoostContent = allText.includes('boost') || allText.includes('turbo') || 
                           allText.includes('intercooler') || allText.includes('downpipe');
    if (!hasBoostContent && profile.platform_insights) {
      addIssue('info', 'TURBO_NO_BOOST_CONTENT', car,
        'Turbo car has no boost-related tuning content',
        { engine: car.engine }
      );
    }
  }
  
  // Supercharged cars shouldn't get turbo-specific advice
  if (isSupercharged && !isTurbo) {
    if (allText.includes('wastegate') || allText.includes('blow-off') || allText.includes('bov')) {
      addIssue('critical', 'SUPERCHARGED_TURBO_ADVICE', car,
        'Supercharged car has turbo-specific advice (wastegate/BOV)',
        { engine: car.engine }
      );
    }
  }
}

// ============================================================================
// CHECK 2: Drivetrain-Specific Logic
// ============================================================================
async function checkDrivetrainLogic(car, profile) {
  const drivetrain = (car.drivetrain || '').toLowerCase();
  const allText = getAllText(profile);
  
  const isAWD = drivetrain.includes('awd') || drivetrain.includes('4wd') || drivetrain.includes('all-wheel');
  const isFWD = drivetrain.includes('fwd') || drivetrain.includes('front-wheel');
  const isRWD = drivetrain.includes('rwd') || drivetrain.includes('rear-wheel');
  
  // FWD cars shouldn't get rear diff/RWD-specific recommendations
  if (isFWD) {
    if (allText.includes('rear diff') || allText.includes('rear differential')) {
      addIssue('critical', 'FWD_REAR_DIFF', car,
        'FWD car has rear differential upgrade recommendation',
        { drivetrain: car.drivetrain }
      );
    }
    if (allText.includes('drift') && !allText.includes('lift-off') && !allText.includes('scandinavian')) {
      addIssue('warning', 'FWD_DRIFT_MENTION', car,
        'FWD car mentions drifting without FWD-specific context',
        { drivetrain: car.drivetrain }
      );
    }
  }
  
  // AWD cars - check for RWD-only advice
  if (isAWD) {
    if (allText.includes('burnout') && !allText.includes('awd burnout')) {
      // This might be okay, just flag for review
      addIssue('info', 'AWD_BURNOUT_MENTION', car,
        'AWD car mentions burnouts - verify context is appropriate',
        { drivetrain: car.drivetrain }
      );
    }
  }
}

// ============================================================================
// CHECK 3: Platform-Specific Tuning Tool Validation
// ============================================================================
async function checkTuningPlatformCompatibility(car, profile) {
  const brand = (car.brand || car.name.split(' ')[0] || '').toLowerCase();
  const platforms = profile.tuning_platforms || [];
  
  // Define which tuning platforms work with which brands
  const platformBrandMap = {
    'hondata': ['honda', 'acura'],
    'ktuner': ['honda', 'acura'],
    'flashpro': ['honda', 'acura'],
    'cobb': ['subaru', 'ford', 'mazda', 'volkswagen', 'audi', 'porsche', 'bmw', 'nissan', 'mitsubishi'],
    'accessport': ['subaru', 'ford', 'mazda', 'volkswagen', 'audi', 'porsche', 'bmw', 'nissan', 'mitsubishi'],
    'ecutek': ['subaru', 'nissan', 'toyota', 'mazda', 'mitsubishi', 'honda'],
    'hp tuners': ['gm', 'chevrolet', 'chevy', 'gmc', 'cadillac', 'buick', 'ford', 'dodge', 'chrysler', 'jeep', 'ram'],
    'sct': ['ford', 'lincoln', 'mercury'],
    'diablo': ['ford', 'gm', 'chevrolet', 'dodge', 'chrysler'],
    'bimmercode': ['bmw', 'mini'],
    'xhp': ['bmw', 'mini'],
    'mhd': ['bmw'],
    'bootmod3': ['bmw'],
    'jb4': ['bmw', 'audi', 'volkswagen', 'porsche', 'infiniti', 'mercedes', 'kia', 'hyundai', 'genesis'],
    'apr': ['audi', 'volkswagen', 'porsche'],
    'unitronic': ['audi', 'volkswagen'],
    'revo': ['audi', 'volkswagen', 'ford', 'seat', 'skoda'],
    'eurocharged': ['mercedes', 'ferrari', 'mclaren', 'porsche', 'bmw', 'audi'],
    'novitec': ['ferrari', 'lamborghini', 'maserati', 'mclaren', 'rolls-royce'],
    'apexi': ['toyota', 'nissan', 'honda', 'mitsubishi', 'subaru', 'mazda'],
    'haltech': ['universal'], // Standalone ECU, works on anything
    'aem': ['universal'],
    'link': ['universal'],
    'motec': ['universal'],
  };
  
  for (const platform of platforms) {
    const platformName = (platform.name || '').toLowerCase();
    
    for (const [tunerKey, validBrands] of Object.entries(platformBrandMap)) {
      if (platformName.includes(tunerKey)) {
        if (validBrands[0] !== 'universal') {
          const brandMatches = validBrands.some(b => brand.includes(b) || (car.name || '').toLowerCase().includes(b));
          if (!brandMatches) {
            addIssue('critical', 'INCOMPATIBLE_TUNING_PLATFORM', car,
              `"${platform.name}" is listed but typically only works with ${validBrands.join('/')}, not ${car.brand || brand}`,
              { platform: platform.name, carBrand: car.brand || brand, validBrands }
            );
          }
        }
        break;
      }
    }
  }
}

// ============================================================================
// CHECK 4: Stage Progression Realism
// ============================================================================
async function checkStageProgressionRealism(car, profile) {
  const engine = (car.engine || '').toLowerCase();
  const stockHp = car.hp || 0;
  const stages = profile.stage_progressions || {};
  
  if (Object.keys(stages).length === 0 || stockHp === 0) return;
  
  const isTurbo = engine.includes('turbo');
  const isNA = !isTurbo && !engine.includes('supercharged') && !engine.includes('electric');
  
  // Get displacement for per-liter calculations
  const displacement = parseFloat(engine.match(/(\d+\.?\d*)\s*l/i)?.[1] || '0');
  
  for (const [stageName, stageData] of Object.entries(stages)) {
    const targetHp = stageData.estimated_whp || stageData.hp || 0;
    if (targetHp === 0) continue;
    
    const gainHp = targetHp - stockHp;
    const gainPercent = (gainHp / stockHp) * 100;
    
    // Stage 1 realism checks
    if (stageName.toLowerCase().includes('stage 1') || stageName.toLowerCase() === 'stage1') {
      // NA Stage 1 typically 5-15% gain
      if (isNA && gainPercent > 20) {
        addIssue('warning', 'UNREALISTIC_NA_STAGE1', car,
          `NA Stage 1 claims ${gainPercent.toFixed(0)}% gain (${stockHp} → ${targetHp}hp) - typically 5-15% for NA`,
          { stockHp, targetHp, gainPercent: gainPercent.toFixed(1) }
        );
      }
      // Turbo Stage 1 typically 15-40% gain
      if (isTurbo && gainPercent > 50) {
        addIssue('warning', 'UNREALISTIC_TURBO_STAGE1', car,
          `Turbo Stage 1 claims ${gainPercent.toFixed(0)}% gain (${stockHp} → ${targetHp}hp) - typically 15-40%`,
          { stockHp, targetHp, gainPercent: gainPercent.toFixed(1) }
        );
      }
    }
    
    // Check for impossibly high HP per liter (without FI upgrade)
    if (displacement > 0 && targetHp > 0) {
      const hpPerLiter = targetHp / displacement;
      
      // NA engines rarely exceed 140 hp/L without significant work
      if (isNA && hpPerLiter > 160 && !stageName.toLowerCase().includes('forced') && !stageName.toLowerCase().includes('turbo')) {
        addIssue('warning', 'UNREALISTIC_NA_HP_PER_LITER', car,
          `${stageName} claims ${hpPerLiter.toFixed(0)} hp/L on NA engine - verify accuracy`,
          { targetHp, displacement, hpPerLiter: hpPerLiter.toFixed(0) }
        );
      }
    }
  }
}

// ============================================================================
// CHECK 5: Self-Contradiction Detection
// ============================================================================
async function checkSelfContradictions(car, profile) {
  const insights = profile.platform_insights || {};
  const strengths = (insights.strengths || []).map(s => typeof s === 'string' ? s : s.title || s.description || '').join(' ').toLowerCase();
  const weaknesses = (insights.weaknesses || []).map(w => typeof w === 'string' ? w : w.title || w.description || '').join(' ').toLowerCase();
  const tips = (insights.community_tips || []).map(t => typeof t === 'string' ? t : t.text || '').join(' ').toLowerCase();
  
  // Define contradiction pairs
  const contradictionPairs = [
    { 
      positive: /excellent.*(reliability|reliable)|bulletproof|rock.?solid|indestructible/i,
      negative: /unreliable|known.*(failure|issue|problem)|prone.*(break|fail)|notorious/i,
      topic: 'reliability'
    },
    {
      positive: /excellent.*(tuning|tunability)|highly.?tunable|great.?aftermarket/i,
      negative: /limited.?tuning|no.?tuning|impossible.?to.?tune|locked.?ecu/i,
      topic: 'tunability'
    },
    {
      positive: /fuel.?efficient|great.?(mpg|fuel.?economy)|economical/i,
      negative: /poor.?(mpg|fuel)|gas.?guzzler|thirsty|drinks.?fuel/i,
      topic: 'fuel economy'
    },
    {
      positive: /lightweight|low.?weight|featherweight/i,
      negative: /heavy|overweight|portly|obese/i,
      topic: 'weight'
    },
  ];
  
  for (const { positive, negative, topic } of contradictionPairs) {
    const strengthMatch = positive.test(strengths);
    const weaknessMatch = negative.test(weaknesses);
    
    if (strengthMatch && weaknessMatch) {
      addIssue('warning', 'SELF_CONTRADICTION', car,
        `Strengths and weaknesses contradict on ${topic}`,
        { topic }
      );
    }
  }
  
  // Check if tips contradict insights
  // Example: Tip says "ECU tune is the best first mod" but weakness says "ECU tuning is impossible"
  if (tips.includes('ecu tune') || tips.includes('flash tune') || tips.includes('tune is')) {
    if (weaknesses.includes('no tuning') || weaknesses.includes('impossible') || weaknesses.includes('locked ecu')) {
      addIssue('critical', 'TIP_CONTRADICTS_WEAKNESS', car,
        'Community tip recommends ECU tuning but weaknesses say tuning is limited/impossible',
        {}
      );
    }
  }
}

// ============================================================================
// CHECK 6: Electric Vehicle Logic
// ============================================================================
async function checkElectricVehicleLogic(car, profile) {
  const engine = (car.engine || '').toLowerCase();
  const allText = getAllText(profile);
  
  const isEV = engine.includes('electric') || engine.match(/\d+\s*kw\s*motor/i);
  const isHybrid = engine.includes('hybrid') || engine.includes('+ electric');
  
  if (isEV && !isHybrid) {
    // Pure EVs shouldn't have ICE-specific recommendations
    const iceTerms = ['exhaust', 'intake', 'headers', 'turbo', 'supercharger', 'fuel pump', 'injector', 'spark plug', 'oil change interval'];
    
    for (const term of iceTerms) {
      if (allText.includes(term)) {
        addIssue('critical', 'EV_ICE_RECOMMENDATION', car,
          `Pure EV has ICE-specific recommendation: "${term}"`,
          { engine: car.engine, foundTerm: term }
        );
      }
    }
    
    // EVs shouldn't mention "ECU tune" for power gains
    if (allText.includes('ecu tune') || allText.includes('flash tune')) {
      if (!allText.includes('coding') && !allText.includes('not available') && !allText.includes('no traditional')) {
        addIssue('critical', 'EV_ECU_TUNE_RECOMMENDATION', car,
          'Pure EV mentions ECU tuning for performance - EVs cannot be traditionally ECU tuned',
          { engine: car.engine }
        );
      }
    }
  }
}

// ============================================================================
// CHECK 7: Model-Specific Accuracy
// ============================================================================
async function checkModelSpecificAccuracy(car, profile) {
  const name = (car.name || '').toLowerCase();
  const engine = (car.engine || '').toLowerCase();
  const allText = getAllText(profile);
  
  // Check for engine-specific mistakes
  
  // 2JZ should mention inline-6, not V6
  if (engine.includes('2jz') || name.includes('supra')) {
    if (allText.includes('v6') && !allText.includes('inline') && !allText.includes('i6') && !allText.includes('straight-6')) {
      addIssue('warning', 'ENGINE_TYPE_MISMATCH', car,
        '2JZ-equipped car mentions V6 instead of inline-6',
        { engine: car.engine }
      );
    }
  }
  
  // RB26 is inline-6, not V6
  if (engine.includes('rb26') || name.includes('gt-r r3')) {
    if (allText.includes('v6') && !allText.includes('inline') && !allText.includes('i6')) {
      addIssue('warning', 'ENGINE_TYPE_MISMATCH', car,
        'RB26-equipped car mentions V6 instead of inline-6',
        { engine: car.engine }
      );
    }
  }
  
  // LS engines are V8, not V6
  if (engine.includes('ls1') || engine.includes('ls2') || engine.includes('ls3') || engine.includes('lt1') || engine.includes('lt4')) {
    if (allText.includes('v6') && !allText.includes('v8')) {
      addIssue('warning', 'ENGINE_TYPE_MISMATCH', car,
        'LS/LT-equipped car mentions V6 instead of V8',
        { engine: car.engine }
      );
    }
  }
  
  // Rotary engines - specific considerations
  if (engine.includes('rotary') || engine.includes('wankel') || engine.includes('13b') || engine.includes('20b')) {
    // Rotaries shouldn't get piston-specific advice
    if (allText.includes('piston ring') || allText.includes('connecting rod') || allText.includes('valve adjustment')) {
      addIssue('critical', 'ROTARY_PISTON_ADVICE', car,
        'Rotary engine car has piston-engine-specific advice',
        { engine: car.engine }
      );
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('LOGIC & ACCURACY AUDIT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('\nThis audit checks if the CONTENT makes sense for each vehicle.\n');
  
  // Fetch all data
  const { data: cars, error: carsError } = await supabase
    .from('cars')
    .select('id, slug, name, brand, engine, hp, drivetrain, years');
  
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
  
  // Index profiles by car_id
  const profileMap = new Map(profiles.map(p => [p.car_id, p]));
  
  console.log(`Analyzing ${cars.length} cars for logical accuracy...\n`);
  
  let processed = 0;
  for (const car of cars) {
    const profile = profileMap.get(car.id);
    if (!profile) continue;
    
    await checkAspirationLogic(car, profile);
    await checkDrivetrainLogic(car, profile);
    await checkTuningPlatformCompatibility(car, profile);
    await checkStageProgressionRealism(car, profile);
    await checkSelfContradictions(car, profile);
    await checkElectricVehicleLogic(car, profile);
    await checkModelSpecificAccuracy(car, profile);
    
    processed++;
    if (processed % 50 === 0) {
      process.stdout.write(`\rProcessed: ${processed}/${cars.length}`);
    }
  }
  
  console.log(`\rProcessed: ${processed}/${cars.length}\n`);
  
  // Summarize results
  const critical = issues.filter(i => i.severity === 'critical');
  const warnings = issues.filter(i => i.severity === 'warning');
  const info = issues.filter(i => i.severity === 'info');
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('RESULTS');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Critical (must fix): ${critical.length}`);
  console.log(`Warnings (should review): ${warnings.length}`);
  console.log(`Info (minor): ${info.length}`);
  
  if (critical.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES (Incorrect/Contradictory Information):');
    const byCategory = {};
    critical.forEach(i => {
      if (!byCategory[i.category]) byCategory[i.category] = [];
      byCategory[i.category].push(i);
    });
    
    for (const [cat, items] of Object.entries(byCategory)) {
      console.log(`\n  ${cat} (${items.length}):`);
      items.slice(0, 10).forEach(i => {
        console.log(`    ❌ ${i.car} (${i.slug})`);
        console.log(`       ${i.message}`);
      });
      if (items.length > 10) console.log(`    ... and ${items.length - 10} more`);
    }
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS (Review for Accuracy):');
    const byCategory = {};
    warnings.forEach(i => {
      if (!byCategory[i.category]) byCategory[i.category] = [];
      byCategory[i.category].push(i);
    });
    
    for (const [cat, items] of Object.entries(byCategory)) {
      console.log(`\n  ${cat} (${items.length}):`);
      items.slice(0, 5).forEach(i => {
        console.log(`    ⚠️  ${i.car}: ${i.message}`);
      });
      if (items.length > 5) console.log(`    ... and ${items.length - 5} more`);
    }
  }
  
  // Save full report
  const reportPath = path.join(process.cwd(), 'audit', `logic-accuracy-audit-${new Date().toISOString().split('T')[0]}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: { critical: critical.length, warnings: warnings.length, info: info.length },
    issues
  }, null, 2));
  
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  if (critical.length > 0) {
    console.log('\n⚠️  Found critical logical inconsistencies that need fixing!');
    process.exit(1);
  }
}

main().catch(console.error);
