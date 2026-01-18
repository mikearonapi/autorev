/**
 * Specification Verification Module
 * 
 * Provides pre-write verification for critical maintenance specs.
 * Uses web search to validate AI-generated data before committing to database.
 * 
 * Key Learnings from QA (Jan 2026):
 * - Brand-level assumptions are risky (e.g., Audi B8 vs B9 use different oil specs)
 * - Model year matters significantly for oil specs
 * - Engine family matters more than brand
 * - Batch updates cause errors when not individually verified
 */

import Anthropic from '@anthropic-ai/sdk';

// Critical fields that require verification before writing
const CRITICAL_FIELDS = [
  'oil_viscosity',
  'oil_spec', 
  'spark_plug_gap_mm',
  'fuel_octane_minimum',
  'wheel_bolt_pattern',
  'wheel_lug_torque_ft_lbs',
  'brake_front_caliper_type',
  'brake_rear_caliper_type'
];

// Known brand/model exceptions that break "brand-level" rules
const KNOWN_EXCEPTIONS = {
  // Audi VW 508.00 vs 502.00 split
  'audi_oil_spec': {
    description: 'Audi B9 platform (2017+) uses VW 508.00 with 0W-20, older B8 uses VW 502.00 with 5W-40',
    check: (car) => {
      const name = (car.name || '').toLowerCase();
      const isB9 = name.includes('b9') || /201[789]|202[0-9]/.test(car.years || '');
      const isS4S5 = /s[45]/.test(name);
      if (isS4S5 && isB9) {
        return { oil_viscosity: '0W-20', oil_spec: 'VW 508.00' };
      }
      if (isS4S5) {
        return { oil_viscosity: '5W-40', oil_spec: 'VW 502.00' };
      }
      return null;
    }
  },
  
  // Honda Civic Type R uses 5x120, not 5x114.3 like other Hondas
  'honda_type_r_wheels': {
    description: 'Civic Type R (FK8, FL5) uses 5x120 bolt pattern, not 5x114.3',
    check: (car) => {
      const name = (car.name || '').toLowerCase();
      if (name.includes('type r') || name.includes('fk8') || name.includes('fl5')) {
        return { wheel_bolt_pattern: '5x120', wheel_center_bore_mm: 64.1 };
      }
      return null;
    }
  },
  
  // Cadillac LF4 vs LT4 - different oils
  'cadillac_engine_oil': {
    description: 'ATS-V (LF4) uses Dexos1 5W-30, CT5-V Blackwing (LT4) uses DexosR 0W-40',
    check: (car) => {
      const name = (car.name || '').toLowerCase();
      if (name.includes('ats-v') || name.includes('ats v')) {
        return { oil_viscosity: '5W-30', oil_spec: 'Dexos1 Gen 2' };
      }
      if (name.includes('ct5-v') || name.includes('ct5 v')) {
        return { oil_viscosity: '0W-40', oil_spec: 'DexosR' };
      }
      return null;
    }
  },
  
  // Ferrari modern uses 5x114.3, not 5x108
  'ferrari_wheels': {
    description: 'Modern Ferrari (458+) uses 5x114.3 bolt pattern',
    check: (car) => {
      const name = (car.name || '').toLowerCase();
      if (car.brand === 'Ferrari') {
        return { wheel_bolt_pattern: '5x114.3', wheel_center_bore_mm: 67.1 };
      }
      return null;
    }
  },
  
  // BMW lug torque is 103 ft-lbs, not 88
  'bmw_lug_torque': {
    description: 'BMW uses 103 ft-lbs (140 Nm) lug torque',
    check: (car) => {
      if (car.brand === 'BMW') {
        return { wheel_lug_torque_ft_lbs: 103, wheel_lug_torque_nm: 140 };
      }
      return null;
    }
  }
};

/**
 * Check if the proposed data matches known exceptions
 */
export function checkKnownExceptions(car, proposedData) {
  const corrections = [];
  
  for (const [ruleName, rule] of Object.entries(KNOWN_EXCEPTIONS)) {
    const override = rule.check(car);
    if (override) {
      for (const [field, correctValue] of Object.entries(override)) {
        if (proposedData[field] && proposedData[field] !== correctValue) {
          corrections.push({
            field,
            proposed: proposedData[field],
            corrected: correctValue,
            rule: ruleName,
            reason: rule.description
          });
        }
      }
    }
  }
  
  return corrections;
}

/**
 * Generate a verification summary for human review
 */
export function generateVerificationSummary(car, proposedData, engineFamilyMatch, corrections) {
  const lines = [];
  
  lines.push('═'.repeat(60));
  lines.push(`  VERIFICATION SUMMARY: ${car.name}`);
  lines.push('═'.repeat(60));
  lines.push('');
  
  // Engine family detection
  if (engineFamilyMatch) {
    lines.push(`✅ Engine Family Detected: ${engineFamilyMatch.family}`);
    lines.push(`   ${engineFamilyMatch.notes}`);
    lines.push('');
  } else {
    lines.push('⚠️  No engine family match - data not cross-validated');
    lines.push('   Consider verifying critical specs manually');
    lines.push('');
  }
  
  // Show critical fields
  lines.push('📋 Critical Fields:');
  for (const field of CRITICAL_FIELDS) {
    const value = proposedData[field];
    if (value !== undefined && value !== null) {
      const correction = corrections.find(c => c.field === field);
      if (correction) {
        lines.push(`   ❌ ${field}: ${value} → ${correction.corrected}`);
        lines.push(`      Reason: ${correction.reason}`);
      } else {
        lines.push(`   ✓ ${field}: ${value}`);
      }
    }
  }
  lines.push('');
  
  // Show corrections needed
  if (corrections.length > 0) {
    lines.push(`🔧 ${corrections.length} corrections will be applied:`);
    for (const c of corrections) {
      lines.push(`   ${c.field}: "${c.proposed}" → "${c.corrected}"`);
    }
    lines.push('');
  }
  
  lines.push('═'.repeat(60));
  
  return lines.join('\n');
}

/**
 * Calculate confidence score for proposed data
 * Returns 0-100 based on validation checks
 */
export function calculateConfidenceScore(car, proposedData, engineFamilyMatch) {
  let score = 50; // Base score
  
  // Engine family match gives confidence
  if (engineFamilyMatch) {
    score += 25;
  }
  
  // Check for suspicious patterns
  const engine = (car.engine || '').toLowerCase();
  const isTurbo = engine.includes('turbo') || engine.includes('sc ') || engine.includes('supercharged');
  
  // Suspicious: 0W-20 on turbo (unless known exception)
  if (isTurbo && proposedData.oil_viscosity === '0W-20') {
    const isKnownThinOilTurbo = 
      car.brand === 'Honda' || car.brand === 'Acura' ||
      car.brand === 'Toyota' || car.brand === 'Lexus' ||
      car.brand === 'Mazda' ||
      engine.includes('vr30'); // Nissan VR30DDTT
    
    if (!isKnownThinOilTurbo) {
      score -= 20;
    }
  }
  
  // Suspicious: Large spark plug gap on boosted engine
  if (isTurbo && proposedData.spark_plug_gap_mm > 0.9) {
    score -= 15;
  }
  
  // Good: Has OEM part numbers
  if (proposedData.oil_filter_oem_part_number) score += 5;
  if (proposedData.spark_plug_oem_part_number) score += 5;
  if (proposedData.air_filter_oem_part_number) score += 5;
  
  // Good: Has wheel specs
  if (proposedData.wheel_bolt_pattern) score += 5;
  if (proposedData.wheel_lug_torque_ft_lbs) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Verify maintenance data with AI cross-check
 * Uses Claude to validate critical specs against known information
 */
export async function verifyWithAI(anthropic, car, proposedData) {
  if (!anthropic) return { verified: true, warnings: [] };
  
  const prompt = `You are a vehicle maintenance expert. Verify if these specifications are CORRECT for the ${car.name} (${car.years || 'unknown years'}):

Engine: ${car.engine || 'unknown'}

Proposed Specifications:
- Oil Viscosity: ${proposedData.oil_viscosity || 'not specified'}
- Oil Spec: ${proposedData.oil_spec || 'not specified'}
- Spark Plug Gap: ${proposedData.spark_plug_gap_mm || 'not specified'} mm
- Fuel Octane: ${proposedData.fuel_octane_minimum || 'not specified'} minimum
- Wheel Bolt Pattern: ${proposedData.wheel_bolt_pattern || 'not specified'}
- Lug Torque: ${proposedData.wheel_lug_torque_ft_lbs || 'not specified'} ft-lbs

Respond in JSON format:
{
  "verified": true/false,
  "confidence": 0-100,
  "warnings": ["list of potential issues"],
  "corrections": [{"field": "field_name", "proposed": "value", "correct": "value", "reason": "why"}]
}

Be especially careful about:
1. Turbo/supercharged engines usually need thicker oil (0W-40 or 5W-40), NOT 0W-20
2. Model years matter - newer Audis use VW 508.00, older use VW 502.00
3. Spark plug gaps for boosted engines are typically 0.6-0.8mm, not 1.0+
4. Performance cars often have specific lug torque specs (BMW = 103 ft-lbs, not 88)`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });
    
    const text = response.content[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.warn('AI verification failed:', err.message);
  }
  
  return { verified: true, warnings: [], confidence: 50 };
}

/**
 * Apply all corrections to the proposed data
 */
export function applyCorrections(proposedData, corrections) {
  const corrected = { ...proposedData };
  
  for (const correction of corrections) {
    corrected[correction.field] = correction.corrected || correction.correct;
  }
  
  return corrected;
}

/**
 * Main verification function - checks all layers
 */
export async function verifyMaintenanceData(car, proposedData, options = {}) {
  const { anthropic, engineFamilyMatch, verbose = false } = options;
  
  // Layer 1: Check known exceptions
  const exceptionCorrections = checkKnownExceptions(car, proposedData);
  
  // Layer 2: Calculate confidence
  const confidence = calculateConfidenceScore(car, proposedData, engineFamilyMatch);
  
  // Layer 3: AI verification (if enabled and confidence is low)
  let aiResult = { verified: true, warnings: [], corrections: [] };
  if (anthropic && confidence < 70) {
    aiResult = await verifyWithAI(anthropic, car, proposedData);
  }
  
  // Combine all corrections
  const allCorrections = [
    ...exceptionCorrections,
    ...(aiResult.corrections || [])
  ];
  
  // Generate summary
  const summary = generateVerificationSummary(car, proposedData, engineFamilyMatch, allCorrections);
  
  if (verbose) {
    console.log(summary);
  }
  
  return {
    verified: allCorrections.length === 0 && aiResult.verified,
    confidence: Math.min(confidence, aiResult.confidence || 100),
    corrections: allCorrections,
    warnings: aiResult.warnings || [],
    summary,
    correctedData: applyCorrections(proposedData, allCorrections)
  };
}

export default {
  verifyMaintenanceData,
  checkKnownExceptions,
  calculateConfidenceScore,
  generateVerificationSummary,
  applyCorrections,
  CRITICAL_FIELDS,
  KNOWN_EXCEPTIONS
};
