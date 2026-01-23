/**
 * Build Performance Calculator
 * 
 * Calculates performance estimates based on:
 * - Basic mode: installed_modifications array
 * - Advanced mode: custom_specs with detailed turbo, engine, fuel data
 * 
 * Uses physics-based calculations when detailed specs are available,
 * falls back to multiplier-based estimates for basic builds.
 */

// ============================================================================
// MAIN CALCULATOR
// ============================================================================

/**
 * Calculate performance estimates for a vehicle build
 * 
 * @param {Object} params
 * @param {number} params.stockHp - Stock horsepower
 * @param {number} params.stockTorque - Stock torque
 * @param {string} params.engineType - Engine type (e.g., 'Turbo I4', 'NA V8')
 * @param {string[]} params.installedMods - Array of mod keys
 * @param {Object} params.customSpecs - Advanced build specs
 * @param {Object} params.turboData - Turbo model data from library (if selected)
 * @returns {Object} Performance estimate with confidence
 */
export function calculateBuildPerformance({
  stockHp,
  stockTorque,
  engineType = 'unknown',
  installedMods = [],
  customSpecs = {},
  turboData = null,
}) {
  // If user has verified dyno results, use them directly
  if (customSpecs?.dyno?.hasResults && customSpecs?.dyno?.whp) {
    return {
      estimatedWhp: customSpecs.dyno.whp,
      estimatedWtq: customSpecs.dyno.wtq || null,
      hpGain: customSpecs.dyno.whp - stockHp,
      confidence: 1.0,
      confidenceLevel: 'verified',
      confidenceLabel: 'Verified dyno data',
      source: 'user_dyno',
      breakdown: {
        dyno: {
          whp: customSpecs.dyno.whp,
          wtq: customSpecs.dyno.wtq,
          boost: customSpecs.dyno.boostPsi,
          fuel: customSpecs.dyno.fuelType,
        },
      },
    };
  }

  // Determine if we have enough data for physics-based calculation
  const hasAdvancedSpecs = customSpecs?.turbo?.type && customSpecs.turbo.type !== 'stock';
  
  if (hasAdvancedSpecs) {
    return calculatePhysicsBased({
      stockHp,
      stockTorque,
      engineType,
      installedMods,
      customSpecs,
      turboData,
    });
  }
  
  // Fall back to multiplier-based calculation
  return calculateMultiplierBased({
    stockHp,
    stockTorque,
    engineType,
    installedMods,
  });
}

// ============================================================================
// PHYSICS-BASED CALCULATION (Advanced Mode)
// ============================================================================

function calculatePhysicsBased({
  stockHp,
  stockTorque,
  engineType,
  installedMods,
  customSpecs,
  turboData,
}) {
  const isTurbo = engineType?.toLowerCase().includes('turbo');
  const breakdown = {};
  
  let boostMultiplier = 1.0;
  let engineMultiplier = 1.0;
  let fuelMultiplier = 1.0;
  let confidence = 0.7;
  let confidenceLabel = 'Physics-based estimate';
  
  // === ENGINE MODIFICATIONS ===
  const engine = customSpecs.engine || {};
  
  if (engine.type === 'built' || engine.type === 'stroked') {
    breakdown.engine = { mods: [] };
    
    // Forged internals enable more power but don't add directly
    if (engine.internals === 'forged') {
      breakdown.engine.mods.push('Forged internals (enables higher boost/RPM)');
    }
    
    // Cams add VE improvement
    if (engine.cams === 'stage3') {
      engineMultiplier += 0.12;
      breakdown.engine.mods.push('Stage 3 cams (+12% VE)');
    } else if (engine.cams === 'stage2') {
      engineMultiplier += 0.07;
      breakdown.engine.mods.push('Stage 2 cams (+7% VE)');
    } else if (engine.cams === 'stage1') {
      engineMultiplier += 0.04;
      breakdown.engine.mods.push('Stage 1 cams (+4% VE)');
    }
    
    // Head work
    if (engine.headWork) {
      engineMultiplier += 0.06;
      breakdown.engine.mods.push('Head work (+6% flow)');
    }
    
    // Stroker adds displacement
    if (engine.type === 'stroked' && engine.displacement) {
      const stockDisplacement = 2.0; // Assume 2.0L base
      const displacementRatio = engine.displacement / stockDisplacement;
      engineMultiplier *= displacementRatio;
      breakdown.engine.mods.push(`Stroked to ${engine.displacement}L (+${Math.round((displacementRatio - 1) * 100)}%)`);
    }
    
    breakdown.engine.multiplier = engineMultiplier;
  }
  
  // === TURBO MODIFICATIONS ===
  const turbo = customSpecs.turbo || {};
  
  if (turbo.type === 'upgraded' || turbo.type === 'custom') {
    breakdown.turbo = {};
    
    // Use turbo library data if available
    if (turboData) {
      // Estimate based on turbo flow capacity
      const flowMidpoint = (turboData.flow_hp_min + turboData.flow_hp_max) / 2;
      boostMultiplier = flowMidpoint / stockHp;
      breakdown.turbo.model = `${turboData.brand} ${turboData.model}`;
      breakdown.turbo.flowRange = `${turboData.flow_hp_min}-${turboData.flow_hp_max} HP capable`;
      confidence = 0.75;
      confidenceLabel = `Based on ${turboData.model} flow data`;
    }
    // Use target boost if provided
    else if (turbo.targetBoostPsi && isTurbo) {
      const stockBoost = getStockBoost(engineType);
      const pressureRatio = (14.7 + turbo.targetBoostPsi) / (14.7 + stockBoost);
      boostMultiplier = 1 + (pressureRatio - 1) * 0.75; // 75% of theoretical
      breakdown.turbo.targetBoost = turbo.targetBoostPsi;
      breakdown.turbo.pressureRatio = pressureRatio.toFixed(2);
      confidence = 0.7;
      confidenceLabel = `Estimated @ ${turbo.targetBoostPsi} PSI`;
    }
    // Use inducer size as estimate
    else if (turbo.inducerMm) {
      // Rough correlation: inducer mm to HP potential
      // 50mm ~= 400HP, 60mm ~= 600HP, 70mm ~= 850HP
      const hpPotential = Math.pow(turbo.inducerMm / 50, 2.5) * 400;
      boostMultiplier = Math.min(hpPotential / stockHp, 3.0);
      breakdown.turbo.inducer = `${turbo.inducerMm}mm inducer`;
      breakdown.turbo.estimatedPotential = `~${Math.round(hpPotential)} HP potential`;
      confidence = 0.6;
      confidenceLabel = 'Estimated from turbo size';
    }
    // Generic upgrade estimate
    else {
      boostMultiplier = turbo.type === 'custom' ? 1.8 : 1.5;
      confidence = 0.5;
      confidenceLabel = 'Generic upgrade estimate';
    }
    
    // Custom turbo name
    if (turbo.customBrand && turbo.customModel) {
      breakdown.turbo.customModel = `${turbo.customBrand} ${turbo.customModel}`;
    }
    
    breakdown.turbo.multiplier = boostMultiplier;
  }
  
  // === FUEL MODIFICATIONS ===
  const fuel = customSpecs.fuel || {};
  
  if (fuel.type) {
    breakdown.fuel = { type: fuel.type };
    
    switch (fuel.type) {
      case 'e85':
      case 'flex':
        fuelMultiplier = 1.15; // E85 typically adds 15%
        breakdown.fuel.effect = '+15% (higher octane + charge cooling)';
        break;
      case 'e50':
        fuelMultiplier = 1.10;
        breakdown.fuel.effect = '+10%';
        break;
      case 'e30':
        fuelMultiplier = 1.06;
        breakdown.fuel.effect = '+6%';
        break;
      case '93':
        fuelMultiplier = 1.0;
        breakdown.fuel.effect = 'Baseline';
        break;
      case '91':
        fuelMultiplier = 0.97;
        breakdown.fuel.effect = '-3% (knock limited)';
        break;
    }
    
    breakdown.fuel.multiplier = fuelMultiplier;
  }
  
  // === CALCULATE FINAL ESTIMATE ===
  const combinedMultiplier = engineMultiplier * boostMultiplier * fuelMultiplier;
  const estimatedWhp = Math.round(stockHp * combinedMultiplier);
  const estimatedWtq = stockTorque ? Math.round(stockTorque * combinedMultiplier * 0.95) : null;
  
  // Confidence level based on score
  let confidenceLevel = 'low';
  if (confidence >= 0.8) confidenceLevel = 'high';
  else if (confidence >= 0.6) confidenceLevel = 'medium';
  
  return {
    estimatedWhp,
    estimatedWtq,
    hpGain: estimatedWhp - stockHp,
    confidence,
    confidenceLevel,
    confidenceLabel,
    source: 'physics',
    breakdown,
    multipliers: {
      engine: engineMultiplier,
      boost: boostMultiplier,
      fuel: fuelMultiplier,
      combined: combinedMultiplier,
    },
  };
}

// ============================================================================
// MULTIPLIER-BASED CALCULATION (Basic Mode)
// ============================================================================

const MOD_HP_GAINS = {
  // Power mods
  'intake': { na: 8, turbo: 10 },
  'exhaust-catback': { na: 12, turbo: 15 },
  'headers': { na: 25, turbo: 20 },
  'downpipe': { na: 0, turbo: 25 },
  'intercooler': { na: 0, turbo: 25 },
  
  // Tunes
  'stage1-tune': { na: 15, turbo: 70 },
  'stage2-tune': { na: 25, turbo: 120 },
  'stage3-tune': { na: 40, turbo: 200 },
  
  // Forced induction
  'turbo-upgrade-existing': { na: 0, turbo: 120 },
  'turbo-kit-single': { na: 200, turbo: 150 },
  'supercharger-roots': { na: 250, turbo: 0 },
  
  // Fuel
  'flex-fuel-e85': { na: 30, turbo: 80 },
  'fuel-system-upgrade': { na: 0, turbo: 10 },
  'hpfp-upgrade': { na: 0, turbo: 5 },
};

// Category caps to prevent unrealistic stacking
const CATEGORY_CAPS = {
  exhaust: { na: 50, turbo: 40 },
  tune: { na: 40, turbo: 150 },
  intake: { na: 25, turbo: 30 },
};

/**
 * What mods are typically included/assumed by stage tunes
 * Stage 2 tune gains are calibrated assuming downpipe + intake are installed
 * Stage 3 tune gains are calibrated assuming turbo upgrade, intercooler, etc.
 */
const STAGE_TUNE_INCLUDED_MODS = {
  'stage2-tune': ['downpipe', 'intake'],
  'stage3-tune': ['downpipe', 'intake', 'turbo-upgrade-existing', 'intercooler'],
};

function calculateMultiplierBased({
  stockHp,
  stockTorque,
  engineType,
  installedMods,
}) {
  const isTurbo = engineType?.toLowerCase().includes('turbo');
  const engineCategory = isTurbo ? 'turbo' : 'na';
  
  const categoryGains = {
    exhaust: 0,
    intake: 0,
    tune: 0,
    forced: 0,
    fuel: 0,
    other: 0,
  };
  
  const breakdown = { mods: [] };
  
  // Detect which tune is active (highest stage wins)
  const activeTune = installedMods.find(m => m === 'stage3-tune') ||
                     installedMods.find(m => m === 'stage2-tune') ||
                     installedMods.find(m => m === 'stage1-tune');
  
  for (const modKey of installedMods) {
    const modGains = MOD_HP_GAINS[modKey];
    if (!modGains) continue;
    
    let gain = modGains[engineCategory] || 0;
    if (gain === 0) continue;
    
    // Categorize the mod
    let category = 'other';
    if (['exhaust-catback', 'headers', 'downpipe'].includes(modKey)) {
      category = 'exhaust';
    } else if (['intake'].includes(modKey)) {
      category = 'intake';
    } else if (modKey.includes('tune')) {
      category = 'tune';
    } else if (['flex-fuel-e85', 'fuel-system-upgrade', 'hpfp-upgrade'].includes(modKey)) {
      category = 'fuel';
    } else if (['turbo-upgrade-existing', 'turbo-kit-single', 'supercharger-roots', 'intercooler'].includes(modKey)) {
      category = 'forced';
    }
    
    // Check if this mod is "expected" by the active tune (avoid double-counting)
    // e.g., Stage 3 tune is calibrated assuming turbo upgrade + intercooler are installed
    const isExpectedByTune = activeTune && 
      STAGE_TUNE_INCLUDED_MODS[activeTune]?.includes(modKey);
    
    if (isExpectedByTune) {
      // Reduce gain by 50% since tune already accounts for this hardware
      gain = Math.round(gain * 0.5);
    }
    
    // Apply category cap
    const cap = CATEGORY_CAPS[category]?.[engineCategory];
    let appliedGain = gain;
    
    if (cap && categoryGains[category] + gain > cap) {
      appliedGain = Math.max(0, cap - categoryGains[category]);
    }
    
    categoryGains[category] += appliedGain;
    
    if (appliedGain > 0) {
      breakdown.mods.push({
        mod: modKey,
        gain: appliedGain,
        capped: appliedGain < gain,
      });
    }
  }
  
  const totalGain = Object.values(categoryGains).reduce((a, b) => a + b, 0);
  const estimatedWhp = stockHp + totalGain;
  const estimatedWtq = stockTorque ? Math.round(stockTorque + totalGain * 0.9) : null;
  
  return {
    estimatedWhp,
    estimatedWtq,
    hpGain: totalGain,
    confidence: 0.5,
    confidenceLevel: 'low',
    confidenceLabel: 'Basic estimate — use Advanced mode for accuracy',
    source: 'multiplier',
    breakdown,
    categoryGains,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStockBoost(engineType) {
  // Typical stock boost levels by engine type
  const boostMap = {
    'turbo i4': 18,
    'turbo i6': 12,
    'turbo v6': 10,
    'turbo v8': 8,
    'turbo flat-6': 14,
  };
  
  const key = engineType?.toLowerCase() || '';
  for (const [pattern, boost] of Object.entries(boostMap)) {
    if (key.includes(pattern)) return boost;
  }
  
  return 15; // Default
}

/**
 * Format performance estimate for display
 */
export function formatPerformanceEstimate(estimate, stockHp) {
  if (!estimate) return null;
  
  return {
    stock: stockHp,
    estimated: estimate.estimatedWhp,
    gain: estimate.hpGain,
    gainPercent: Math.round((estimate.hpGain / stockHp) * 100),
    confidence: estimate.confidenceLevel,
    label: estimate.confidenceLabel,
    source: estimate.source,
  };
}

export default calculateBuildPerformance;
