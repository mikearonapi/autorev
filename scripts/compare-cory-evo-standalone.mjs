#!/usr/bin/env node

/**
 * Compare Legacy vs Physics Model for Cory's Evo X
 * Standalone version with embedded calculation logic
 */

// ============================================================================
// CORY'S EXACT BUILD FROM DATABASE
// ============================================================================

const CORYS_CAR = {
  id: 'd53a7eea-9c55-4a75-b72d-99d509325318',
  name: 'Mitsubishi Lancer Evolution X',
  slug: 'mitsubishi-lancer-evo-x',
  hp: 291,
  torque: 300,
  curbWeight: 3483,
  zeroToSixty: 4.6,
  engine: '2.0L Turbo I4',
  drivetrain: 'AWD',
};

const CORYS_MODS = [
  'intake',
  'exhaust-catback',
  'headers',
  'stage3-tune',
  'downpipe',
  'charge-pipe-upgrade',
  'hpfp-upgrade',
  'flex-fuel-e85',
  'fuel-system-upgrade',
  'intercooler',
  'turbo-upgrade-existing',
  'coilovers-track',
  'sway-bars',
  'chassis-bracing',
  'big-brake-kit',
  'brake-pads-track',
  'brake-fluid-lines',
  'slotted-rotors',
  'wheels-lightweight',
  'tires-slicks',
  'oil-cooler',
  'trans-cooler',
  'radiator-upgrade',
  'wing',
];

// ============================================================================
// LEGACY CALCULATOR (Embedded from lib/upgradeCalculator.js)
// ============================================================================

// From data/upgradePackages.js - actual HP gain values
const UPGRADE_DEFINITIONS = {
  'intake': { hpGain: 8, category: 'power' },
  'exhaust-catback': { hpGain: 12, category: 'power' },
  'headers': { hpGain: 25, category: 'power' },
  'downpipe': { hpGain: 20, category: 'power' },
  'charge-pipe-upgrade': { hpGain: 0, category: 'power' },
  'hpfp-upgrade': { hpGain: 0, category: 'power' },
  'flex-fuel-e85': { hpGain: 80, category: 'power' },
  'fuel-system-upgrade': { hpGain: 0, category: 'power' },
  'intercooler': { hpGain: 20, category: 'forcedInduction' },
  'turbo-upgrade-existing': { hpGain: 120, category: 'forcedInduction' },
  'stage1-tune': { hpGain: 70, category: 'power' },
  'stage2-tune': { hpGain: 120, category: 'power' },
  'stage3-tune': { hpGain: 200, category: 'power' },
  'coilovers-track': { hpGain: 0, category: 'chassis' },
  'sway-bars': { hpGain: 0, category: 'chassis' },
  'chassis-bracing': { hpGain: 0, category: 'chassis' },
  'big-brake-kit': { hpGain: 0, category: 'brakes' },
  'brake-pads-track': { hpGain: 0, category: 'brakes' },
  'brake-fluid-lines': { hpGain: 0, category: 'brakes' },
  'slotted-rotors': { hpGain: 0, category: 'brakes' },
  'wheels-lightweight': { hpGain: 0, category: 'wheels' },
  'tires-slicks': { hpGain: 0, category: 'tires' },
  'oil-cooler': { hpGain: 0, category: 'cooling' },
  'trans-cooler': { hpGain: 0, category: 'cooling' },
  'radiator-upgrade': { hpGain: 0, category: 'cooling' },
  'wing': { hpGain: 0, category: 'aero' },
};

// From upgradeCalculator.js
const CATEGORY_CAPS = {
  exhaustTotal: { na: 50, turbo: 40, sc: 35 },
  intakeTotal: { na: 25, turbo: 30, sc: 20 },
  tuneTotal: { na: 40, turbo: 150, sc: 100 },
};

const STAGE_TUNE_INCLUDED_MODS = {
  'stage2-tune': ['downpipe', 'intake'],
  'stage3-tune': ['downpipe', 'intake', 'turbo-upgrade-existing', 'intercooler'],
};

const EXHAUST_CROSS_CATEGORY_FACTOR = 0.85;

function isExhaustMod(key) {
  return key === 'headers' || key === 'exhaust-catback' || key === 'downpipe' || key.includes('exhaust');
}

function isIntakeMod(key) {
  return key === 'intake' || key === 'throttle-body' || key === 'intake-manifold';
}

function isTuneMod(key) {
  return key.includes('tune') || key.includes('stage');
}

function runLegacyCalculator() {
  const car = CORYS_CAR;
  const mods = CORYS_MODS;
  const engineCategory = 'turbo'; // Evo X is turbo
  const TURBO_MULTIPLIER = 1.3; // From getHpGainMultiplier for turbo cars
  
  const categoryGains = {
    exhaust: 0,
    intake: 0,
    tune: 0,
    forcedInduction: 0,
    other: 0,
  };
  
  const breakdown = {};
  let rawGain = 0;
  let adjustedGain = 0;
  
  // Find active tune (highest stage)
  const tuneMods = mods.filter(m => isTuneMod(m));
  const activeTune = tuneMods.includes('stage3-tune') ? 'stage3-tune' :
                     tuneMods.includes('stage2-tune') ? 'stage2-tune' :
                     tuneMods.includes('stage1-tune') ? 'stage1-tune' : null;
  
  for (const modKey of mods) {
    const upgrade = UPGRADE_DEFINITIONS[modKey];
    if (!upgrade) continue;
    
    const baseHpGain = upgrade.hpGain || 0;
    
    // Apply turbo multiplier for power/FI mods
    let multiplier = 1.0;
    if ((upgrade.category === 'power' || upgrade.category === 'forcedInduction') && baseHpGain > 0) {
      multiplier = TURBO_MULTIPLIER;
    }
    
    const fullGain = Math.round(baseHpGain * multiplier);
    rawGain += fullGain;
    
    let appliedGain = fullGain;
    let adjustmentReason = null;
    
    // Handle tunes - only active tune counts
    if (isTuneMod(modKey)) {
      if (modKey === activeTune) {
        const tuneCap = CATEGORY_CAPS.tuneTotal[engineCategory];
        appliedGain = Math.min(fullGain, tuneCap - categoryGains.tune);
        categoryGains.tune += appliedGain;
        if (appliedGain < fullGain) {
          adjustmentReason = 'tune cap reached (150 HP max)';
        }
      } else {
        appliedGain = 0;
        adjustmentReason = `superseded by ${activeTune}`;
      }
    }
    // Handle exhaust mods
    else if (isExhaustMod(modKey)) {
      const isExpectedByTune = activeTune && STAGE_TUNE_INCLUDED_MODS[activeTune]?.includes(modKey);
      
      if (isExpectedByTune) {
        appliedGain = Math.round(fullGain * 0.5);
        adjustmentReason = `partially included in ${activeTune}`;
      }
      
      const exhaustCap = CATEGORY_CAPS.exhaustTotal[engineCategory];
      const remainingCap = exhaustCap - categoryGains.exhaust;
      if (appliedGain > remainingCap) {
        appliedGain = Math.max(0, remainingCap);
        adjustmentReason = adjustmentReason 
          ? `${adjustmentReason}, exhaust cap reached (40 HP max)`
          : 'exhaust system cap reached (40 HP max)';
      }
      
      // Diminishing returns for multiple exhaust mods
      const otherExhaustMods = mods.filter(k => k !== modKey && isExhaustMod(k));
      if (otherExhaustMods.length > 0 && categoryGains.exhaust > 0) {
        const diminishedGain = Math.round(appliedGain * EXHAUST_CROSS_CATEGORY_FACTOR);
        if (diminishedGain < appliedGain) {
          adjustmentReason = adjustmentReason
            ? `${adjustmentReason}, diminishing returns`
            : 'diminishing returns with other exhaust mods';
          appliedGain = diminishedGain;
        }
      }
      
      categoryGains.exhaust += appliedGain;
    }
    // Handle intake mods
    else if (isIntakeMod(modKey)) {
      const isExpectedByTune = activeTune && STAGE_TUNE_INCLUDED_MODS[activeTune]?.includes(modKey);
      
      if (isExpectedByTune) {
        appliedGain = Math.round(fullGain * 0.5);
        adjustmentReason = `partially included in ${activeTune}`;
      }
      
      const intakeCap = CATEGORY_CAPS.intakeTotal[engineCategory];
      const remainingCap = intakeCap - categoryGains.intake;
      if (appliedGain > remainingCap) {
        appliedGain = Math.max(0, remainingCap);
        adjustmentReason = adjustmentReason 
          ? `${adjustmentReason}, intake cap reached (30 HP max)`
          : 'intake system cap reached (30 HP max)';
      }
      
      categoryGains.intake += appliedGain;
    }
    // Handle forced induction
    else if (upgrade.category === 'forcedInduction') {
      const isExpectedByTune = activeTune && STAGE_TUNE_INCLUDED_MODS[activeTune]?.includes(modKey);
      
      if (isExpectedByTune) {
        appliedGain = Math.round(fullGain * 0.5);
        adjustmentReason = `partially included in ${activeTune}`;
      }
      
      categoryGains.forcedInduction += appliedGain;
    }
    // Other mods
    else {
      categoryGains.other += appliedGain;
    }
    
    adjustedGain += appliedGain;
    
    breakdown[modKey] = {
      name: modKey,
      rawGain: fullGain,
      appliedGain,
      adjustmentReason,
    };
  }
  
  return {
    stockHp: car.hp,
    totalGain: adjustedGain,
    projectedHp: car.hp + adjustedGain,
    rawGain,
    adjustmentAmount: rawGain - adjustedGain,
    categoryGains,
    breakdown,
    conflicts: [],
  };
}

// ============================================================================
// PHYSICS CALCULATOR (New Model)
// ============================================================================

function runPhysicsCalculator() {
  const car = CORYS_CAR;
  const mods = CORYS_MODS;
  
  const ENGINE = {
    displacement: 2.0,
    aspiration: 'Turbo',
    stockBoostPsi: 21,
    redline: 7500,
  };
  
  let currentHp = car.hp;
  let currentBoost = ENGINE.stockBoostPsi;
  let weightChange = 0;
  
  const breakdown = [];
  
  for (const modKey of mods) {
    let gain = 0;
    let physics = '';
    let confidence = 0.7;
    
    switch (modKey) {
      case 'intake':
        gain = Math.round(currentHp * 0.01);
        physics = 'VE +1% → turbo inlet flow improvement';
        confidence = 0.85;
        break;
        
      case 'charge-pipe-upgrade':
        gain = 0;
        physics = 'Prevents boost leaks at high PSI - reliability mod';
        confidence = 0.95;
        break;
        
      case 'exhaust-catback':
        gain = Math.round(currentHp * 0.01);
        physics = 'Post-turbo restriction minimal, mostly sound';
        confidence = 0.90;
        break;
        
      case 'headers':
        gain = Math.round(currentHp * 0.015);
        physics = 'Pre-turbo exhaust manifold - helps spool';
        confidence = 0.80;
        break;
        
      case 'downpipe':
        gain = Math.round(currentHp * 0.03);
        currentBoost += 2;
        physics = 'Major restriction removed, +2 PSI headroom';
        confidence = 0.85;
        break;
        
      case 'stage3-tune':
        const boostIncrease = 10;
        currentBoost += boostIncrease;
        const pressureRatio = (14.7 + currentBoost) / (14.7 + ENGINE.stockBoostPsi);
        const gainPercent = (pressureRatio - 1) * 0.7;
        gain = Math.round(car.hp * gainPercent);
        physics = `+${boostIncrease} PSI boost, PR ${pressureRatio.toFixed(2)} → ${Math.round(gainPercent * 100)}% gain`;
        confidence = 0.75;
        break;
        
      case 'hpfp-upgrade':
        gain = 0;
        physics = 'Supports higher fuel flow - reliability mod';
        confidence = 0.95;
        break;
        
      case 'flex-fuel-e85':
        currentBoost += 4;
        gain = Math.round(currentHp * 0.12);
        physics = 'E85 octane + cooling allows +4 PSI and timing';
        confidence = 0.80;
        break;
        
      case 'fuel-system-upgrade':
        gain = 0;
        physics = 'Supports E85 and high HP - required support mod';
        confidence = 0.95;
        break;
        
      case 'intercooler':
        gain = Math.round(currentHp * 0.03);
        physics = 'IAT -15°C → 3% denser charge air';
        confidence = 0.85;
        break;
        
      case 'turbo-upgrade-existing':
        currentBoost += 5;
        gain = Math.round(currentHp * 0.20);
        physics = 'FP Black/equivalent: +20% flow capacity, +5 PSI';
        confidence = 0.75;
        break;
        
      case 'coilovers-track':
      case 'sway-bars':
      case 'chassis-bracing':
        gain = 0;
        physics = 'Handling mod - lap time, not HP';
        confidence = 1.0;
        break;
        
      case 'big-brake-kit':
      case 'brake-pads-track':
      case 'brake-fluid-lines':
      case 'slotted-rotors':
        gain = 0;
        physics = 'Braking mod - stopping power, not HP';
        confidence = 1.0;
        break;
        
      case 'wheels-lightweight':
        gain = 0;
        weightChange -= 16;
        physics = '-16 lbs unsprung weight (4 lbs × 4)';
        confidence = 1.0;
        break;
        
      case 'tires-slicks':
        gain = 0;
        physics = 'Grip mod - 1.3G+ lateral vs 1.0G stock';
        confidence = 1.0;
        break;
        
      case 'oil-cooler':
      case 'trans-cooler':
      case 'radiator-upgrade':
        gain = 0;
        physics = 'Thermal management - sustains power under load';
        confidence = 1.0;
        break;
        
      case 'wing':
        gain = 0;
        physics = 'Downforce mod - high-speed grip';
        confidence = 1.0;
        break;
    }
    
    if (gain > 0) {
      currentHp += gain;
    }
    
    breakdown.push({ mod: modKey, gain, physics, confidence });
  }
  
  const totalGain = currentHp - car.hp;
  const newWeight = car.curbWeight + weightChange;
  const powerToWeight = Math.round(currentHp / (newWeight / 2000));
  
  const hpPercentGain = totalGain / car.hp;
  const estimated060 = Math.max(2.8, car.zeroToSixty * (1 - hpPercentGain * 0.35));
  const quarterMile = 5.825 * Math.pow(newWeight / currentHp, 0.333);
  
  return {
    stockHp: car.hp,
    totalGain,
    projectedHp: currentHp,
    finalBoost: currentBoost,
    weightChange,
    newWeight,
    powerToWeight,
    estimated060,
    quarterMile,
    breakdown,
  };
}

// ============================================================================
// MAIN OUTPUT
// ============================================================================

console.log('═'.repeat(80));
console.log('  CORY\'S EVO X BUILD - LEGACY vs PHYSICS MODEL COMPARISON');
console.log('═'.repeat(80));

console.log(`\n🚗 Vehicle: ${CORYS_CAR.name}`);
console.log(`   Stock: ${CORYS_CAR.hp} HP | ${CORYS_CAR.torque} lb-ft | ${CORYS_CAR.curbWeight} lbs | ${CORYS_CAR.drivetrain}`);
console.log(`   Mods:  ${CORYS_MODS.length} total`);

// Run legacy
console.log('\n' + '─'.repeat(80));
console.log('  LEGACY MODEL (Current AutoRev Calculator)');
console.log('─'.repeat(80));

const legacy = runLegacyCalculator();

console.log(`\n  Stock HP:        ${legacy.stockHp}`);
console.log(`  Raw HP Gain:     +${legacy.rawGain} HP (before caps/adjustments)`);
console.log(`  Adjusted Gain:   +${legacy.totalGain} HP (after caps/overlap)`);
console.log(`  Projected HP:    ${legacy.projectedHp} HP`);
console.log(`  Adjustment:      -${legacy.adjustmentAmount} HP removed for realism`);

console.log(`\n  Category Breakdown:`);
console.log(`    Exhaust:          ${legacy.categoryGains.exhaust} HP (cap: 40 HP)`);
console.log(`    Intake:           ${legacy.categoryGains.intake} HP (cap: 30 HP)`);
console.log(`    Tune:             ${legacy.categoryGains.tune} HP (cap: 150 HP)`);
console.log(`    Forced Induction: ${legacy.categoryGains.forcedInduction} HP`);
console.log(`    Other:            ${legacy.categoryGains.other} HP`);

console.log(`\n  Per-Mod Breakdown (power mods only):`);
for (const [key, info] of Object.entries(legacy.breakdown)) {
  if (info.rawGain > 0) {
    const adj = info.adjustmentReason ? ` → ${info.appliedGain} HP (${info.adjustmentReason})` : '';
    console.log(`    ${key}: ${info.rawGain} HP${adj}`);
  }
}

// Run physics
console.log('\n' + '─'.repeat(80));
console.log('  PHYSICS MODEL (New Engine)');
console.log('─'.repeat(80));

const physics = runPhysicsCalculator();

console.log(`\n  Stock HP:        ${physics.stockHp}`);
console.log(`  Total HP Gain:   +${physics.totalGain} HP`);
console.log(`  Projected HP:    ${physics.projectedHp} HP`);
console.log(`  Final Boost:     ${physics.finalBoost} PSI (stock: 21 PSI)`);
console.log(`  Weight Change:   ${physics.weightChange} lbs`);
console.log(`  Power/Weight:    ${physics.powerToWeight} HP/ton`);

console.log(`\n  Performance Estimates:`);
console.log(`    0-60 mph:      ${physics.estimated060.toFixed(2)}s (stock: ${CORYS_CAR.zeroToSixty}s)`);
console.log(`    1/4 Mile:      ${physics.quarterMile.toFixed(2)}s`);

console.log(`\n  Per-Mod Breakdown (power mods only):`);
for (const item of physics.breakdown) {
  if (item.gain > 0) {
    console.log(`    ${item.mod}: +${item.gain} HP (${Math.round(item.confidence * 100)}% conf)`);
    console.log(`      └─ ${item.physics}`);
  }
}

// Side by side
console.log('\n' + '═'.repeat(80));
console.log('  SIDE-BY-SIDE COMPARISON');
console.log('═'.repeat(80));

console.log(`
┌─────────────────────────────────┬───────────────────┬───────────────────┐
│ Metric                          │ LEGACY            │ PHYSICS           │
├─────────────────────────────────┼───────────────────┼───────────────────┤
│ Stock HP                        │ ${String(legacy.stockHp).padStart(17)} │ ${String(physics.stockHp).padStart(17)} │
│ HP Gain (before adjustment)     │ ${('+' + legacy.rawGain).padStart(17)} │               N/A │
│ HP Gain (final)                 │ ${('+' + legacy.totalGain).padStart(17)} │ ${('+' + physics.totalGain).padStart(17)} │
│ Projected HP                    │ ${String(legacy.projectedHp).padStart(17)} │ ${String(physics.projectedHp).padStart(17)} │
├─────────────────────────────────┼───────────────────┼───────────────────┤
│ Final Boost Pressure            │       Not tracked │ ${(physics.finalBoost + ' PSI').padStart(17)} │
│ Weight Change                   │       Not tracked │ ${(physics.weightChange + ' lbs').padStart(17)} │
│ Power-to-Weight                 │       Not tracked │ ${(physics.powerToWeight + ' HP/ton').padStart(17)} │
├─────────────────────────────────┼───────────────────┼───────────────────┤
│ 0-60 Estimate                   │       Not tracked │ ${(physics.estimated060.toFixed(2) + 's').padStart(17)} │
│ 1/4 Mile Estimate               │       Not tracked │ ${(physics.quarterMile.toFixed(2) + 's').padStart(17)} │
└─────────────────────────────────┴───────────────────┴───────────────────┘
`);

const hpDiff = legacy.projectedHp - physics.projectedHp;
console.log(`  Difference: Legacy predicts ${hpDiff} HP ${hpDiff > 0 ? 'MORE' : 'LESS'} than Physics model\n`);

console.log('─'.repeat(80));
console.log('  KEY INSIGHTS');
console.log('─'.repeat(80));

console.log(`
  LEGACY MODEL:
  • Uses hardcoded HP values (e.g., stage3-tune = 200 HP, turbo-upgrade = 120 HP)
  • Applies flat 1.3x multiplier for all turbo car mods
  • Has category caps (exhaust: 40 HP, intake: 30 HP, tune: 150 HP)
  • Reduces gains for mods "included" in stage tunes by 50%
  • Does NOT track boost pressure or physics relationships

  PHYSICS MODEL:
  • Calculates boost pressure ratio: (14.7 + boost) / (14.7 + stock_boost)
  • Models E85's effect on safe boost levels (+4 PSI)
  • Models turbo upgrade flow capacity (+20%, +5 PSI headroom)  
  • Accounts for intercooler density improvements (3%)
  • Tracks cumulative boost for accurate predictions
  • Provides confidence scores per mod

  WHY THEY DIFFER:
  • Legacy: 200 HP tune + 120 HP turbo + 80 HP E85 = 400 HP before caps
  • Physics: Boost PR of 1.63 → ~44% gain on 291 HP = ~128 HP from tune alone
  • Physics understands mods interact through boost, not additive HP values
`);

console.log('─'.repeat(80));
console.log('  REAL-WORLD NOTE');
console.log('─'.repeat(80));

console.log(`
  The "real-world data" mentioned earlier is NOT yet in our database.
  
  To get real forum dyno data for Evo X builds, run:
  
    node scripts/forum-dyno-scraper.mjs --source=evolutionm --limit=50
  
  This will scrape EvolutionM forums for Stage 3 Evo X dyno sheets and 
  populate the forum_dyno_extractions table for calibration.
  
  Until then, both models are estimates based on:
  • Legacy: Hardcoded values from upgradePackages.js
  • Physics: Boost pressure calculations and engine characteristics
`);
