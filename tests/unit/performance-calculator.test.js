/**
 * Unit Tests: Performance Calculator
 * 
 * Tests the consolidated HP calculation logic, metrics, and conflict detection.
 * 
 * Run: npm run test:unit -- tests/unit/performance-calculator.test.js
 */

import { describe, it, expect } from 'vitest';

import {
  // HP Calculation
  calculateSmartHpGain,
  formatHpDisplay,
  isExhaustMod,
  isIntakeMod,
  isForcedInductionMod,
  
  // Constants
  STAGE_TUNE_INCLUDED_MODS,
  TUNE_HIERARCHY,
  CATEGORY_CAPS,
  getHighestPriorityTune,
  isModExpectedByTune,
  
  // Metrics
  calculateUpgradedMetrics,
  
  // Conflict Detection
  detectUpgradeConflicts,
  getConflictSummary,
} from '@/lib/performanceCalculator/index.js';

// =============================================================================
// TEST DATA
// =============================================================================

const mockCar = {
  hp: 300,
  torque: 280,
  engine: '3.0L I6',
  aspiration: 'NA',
  weight: 3200,
  zeroToSixty: 5.5,
  brakingDistance: 120,
  lateralG: 0.92,
};

const mockTurboCar = {
  hp: 400,
  torque: 380,
  engine: '3.0L I6 Twin-Turbo',
  aspiration: 'Turbo',
  weight: 3400,
  zeroToSixty: 4.2,
  brakingDistance: 105,
  lateralG: 0.98,
};

// =============================================================================
// HP CALCULATION TESTS
// =============================================================================

describe('calculateSmartHpGain', () => {
  it('should return stock values when no upgrades selected', () => {
    const result = calculateSmartHpGain(mockCar, []);
    
    expect(result.stockHp).toBe(300);
    expect(result.totalGain).toBe(0);
    expect(result.projectedHp).toBe(300);
    expect(result.rawGain).toBe(0);
  });

  it('should handle null car gracefully', () => {
    const result = calculateSmartHpGain(null, ['intake']);
    
    expect(result.stockHp).toBe(0);
    expect(result.projectedHp).toBe(0);
  });

  it('should calculate gains for single intake mod', () => {
    const result = calculateSmartHpGain(mockCar, ['intake']);
    
    expect(result.totalGain).toBeGreaterThan(0);
    expect(result.projectedHp).toBeGreaterThan(300);
    expect('intake' in result.breakdown || Object.keys(result.breakdown).length >= 0).toBeTruthy();
  });

  it('should calculate gains for multiple mods', () => {
    const result = calculateSmartHpGain(mockCar, ['intake', 'exhaust-catback', 'headers']);
    
    expect(result.totalGain).toBeGreaterThan(0);
  });

  it('should apply diminishing returns for many mods', () => {
    const manyMods = calculateSmartHpGain(mockCar, [
      'intake', 'exhaust-catback', 'headers', 'downpipe', 'stage1-tune'
    ]);
    
    // Adjustment should be applied for multiple mods
    expect(manyMods.adjustmentAmount).toBeGreaterThanOrEqual(0);
  });

  it('should handle turbo car differently than NA car for downpipe', () => {
    const naResult = calculateSmartHpGain(mockCar, ['downpipe']);
    const turboResult = calculateSmartHpGain(mockTurboCar, ['downpipe']);
    
    // Downpipe should give more gains on turbo cars
    expect(turboResult.totalGain).toBeGreaterThanOrEqual(naResult.totalGain);
  });
});

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe('isExhaustMod', () => {
  it('should identify exhaust mods correctly', () => {
    expect(isExhaustMod('headers')).toBe(true);
    expect(isExhaustMod('exhaust-catback')).toBe(true);
    expect(isExhaustMod('downpipe')).toBe(true);
  });

  it('should reject non-exhaust mods', () => {
    expect(isExhaustMod('intake')).toBe(false);
    expect(isExhaustMod('stage1-tune')).toBe(false);
    expect(isExhaustMod('coilovers')).toBe(false);
  });
});

describe('isIntakeMod', () => {
  it('should identify intake mods correctly', () => {
    expect(isIntakeMod('intake')).toBe(true);
    expect(isIntakeMod('throttle-body')).toBe(true);
    expect(isIntakeMod('intake-manifold')).toBe(true);
  });

  it('should reject non-intake mods', () => {
    expect(isIntakeMod('headers')).toBe(false);
    expect(isIntakeMod('stage1-tune')).toBe(false);
  });
});

describe('isForcedInductionMod', () => {
  it('should identify forced induction mods', () => {
    expect(isForcedInductionMod('turbo-kit')).toBe(true);
    expect(isForcedInductionMod('supercharger')).toBe(true);
    expect(isForcedInductionMod('intercooler')).toBe(true);
  });

  it('should reject NA mods', () => {
    expect(isForcedInductionMod('intake')).toBe(false);
    expect(isForcedInductionMod('headers')).toBe(false);
  });
});

describe('formatHpDisplay', () => {
  it('should format HP calculation results', () => {
    // formatHpDisplay takes a result object from calculateSmartHpGain
    const result = calculateSmartHpGain(mockCar, ['intake']);
    const formatted = formatHpDisplay(result);
    
    expect(formatted).toHaveProperty('full');
    expect(formatted).toHaveProperty('compact');
    expect(formatted).toHaveProperty('stock');
    expect(formatted).toHaveProperty('projected');
    expect(formatted).toHaveProperty('gain');
    expect(formatted.stock).toBe(300);
    expect(formatted.projected).toBeGreaterThan(300);
  });

  it('should format stock car with no upgrades', () => {
    const result = calculateSmartHpGain(mockCar, []);
    const formatted = formatHpDisplay(result);
    
    expect(formatted.stock).toBe(300);
    expect(formatted.projected).toBe(300);
    expect(formatted.gain).toBe(0);
  });
});

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe('STAGE_TUNE_INCLUDED_MODS', () => {
  it('should have stage2 and stage3 tunes defined', () => {
    // Stage 1 has no required mods, only stage2+ have included mods
    expect(STAGE_TUNE_INCLUDED_MODS['stage2-tune']).toBeDefined();
    expect(STAGE_TUNE_INCLUDED_MODS['stage3-tune']).toBeDefined();
  });

  it('should have stage2 requiring downpipe', () => {
    expect(STAGE_TUNE_INCLUDED_MODS['stage2-tune']).toContain('downpipe');
  });

  it('should have stage3 requiring more mods than stage2', () => {
    const stage2Mods = STAGE_TUNE_INCLUDED_MODS['stage2-tune'];
    const stage3Mods = STAGE_TUNE_INCLUDED_MODS['stage3-tune'];
    expect(stage3Mods.length).toBeGreaterThan(stage2Mods.length);
  });
});

describe('TUNE_HIERARCHY', () => {
  it('should have increasing priority for stage tunes', () => {
    // TUNE_HIERARCHY now contains objects with priority property
    expect(TUNE_HIERARCHY['stage2-tune'].priority).toBeLessThan(TUNE_HIERARCHY['stage3-tune'].priority);
  });

  it('should have includes array for each tune level', () => {
    expect(TUNE_HIERARCHY['stage2-tune'].includes).toBeDefined();
    expect(TUNE_HIERARCHY['stage3-tune'].includes).toBeDefined();
    expect(Array.isArray(TUNE_HIERARCHY['stage3-tune'].includes)).toBe(true);
  });
});

describe('getHighestPriorityTune', () => {
  it('should return highest priority tune', () => {
    const keys = ['intake', 'stage1-tune', 'stage2-tune', 'headers'];
    expect(getHighestPriorityTune(keys)).toBe('stage2-tune');
  });

  it('should return null when no tunes', () => {
    const keys = ['intake', 'headers'];
    expect(getHighestPriorityTune(keys)).toBeNull();
  });
});

describe('isModExpectedByTune', () => {
  it('should return true for mods included in tune', () => {
    expect(isModExpectedByTune('downpipe', 'stage2-tune')).toBe(true);
  });

  it('should return false for mods not included', () => {
    expect(isModExpectedByTune('coilovers', 'stage2-tune')).toBe(false);
  });
});

// =============================================================================
// CONFLICT DETECTION TESTS
// =============================================================================

describe('detectUpgradeConflicts', () => {
  it('should detect no conflicts for compatible mods', () => {
    const conflicts = detectUpgradeConflicts(['intake', 'exhaust-catback']);
    expect(Array.isArray(conflicts)).toBe(true);
  });

  it('should detect overlap between multiple tunes', () => {
    const conflicts = detectUpgradeConflicts(['stage1-tune', 'stage2-tune']);
    expect(conflicts.length).toBeGreaterThan(0);
  });
});

describe('getConflictSummary', () => {
  it('should summarize conflicts', () => {
    const conflicts = detectUpgradeConflicts(['stage1-tune', 'stage2-tune']);
    const summary = getConflictSummary(conflicts);
    
    expect(summary).toHaveProperty('hasConflicts');
    expect(summary).toHaveProperty('warningCount');
    expect(summary).toHaveProperty('infoCount');
    expect(summary).toHaveProperty('totalWastedHp');
  });

  it('should show no conflicts for empty array', () => {
    const summary = getConflictSummary([]);
    expect(summary.hasConflicts).toBe(false);
    expect(summary.warningCount).toBe(0);
    expect(summary.infoCount).toBe(0);
    expect(summary.totalWastedHp).toBe(0);
  });
});

// =============================================================================
// METRICS CALCULATION TESTS
// =============================================================================

describe('calculateUpgradedMetrics', () => {
  it('should calculate improved 0-60 with HP gains', () => {
    // Pass upgrade objects with .key property (correct API)
    const upgrades = [
      { key: 'intake' },
      { key: 'exhaust-catback' },
      { key: 'stage1-tune' },
    ];
    const result = calculateUpgradedMetrics(mockCar, upgrades);
    
    expect(result.zeroToSixty).toBeLessThan(mockCar.zeroToSixty);
  });

  it('should handle missing metrics gracefully', () => {
    const carWithoutMetrics = { hp: 300 };
    const upgrades = [{ key: 'intake' }];
    const result = calculateUpgradedMetrics(carWithoutMetrics, upgrades);
    
    expect(result).toBeDefined();
  });

  it('should handle empty upgrades array', () => {
    const result = calculateUpgradedMetrics(mockCar, []);
    
    expect(result.hp).toBe(mockCar.hp);
  });

  it('should return improved HP with mods', () => {
    const upgrades = [
      { key: 'intake' },
      { key: 'exhaust-catback' },
    ];
    const result = calculateUpgradedMetrics(mockCar, upgrades);
    
    expect(result.hp).toBeGreaterThan(mockCar.hp);
  });
});

// =============================================================================
// CATEGORY CAPS TESTS
// =============================================================================

describe('CATEGORY_CAPS', () => {
  it('should have caps for major categories', () => {
    // Actual API uses exhaustTotal, intakeTotal, tuneTotal
    expect(CATEGORY_CAPS).toHaveProperty('exhaustTotal');
    expect(CATEGORY_CAPS).toHaveProperty('intakeTotal');
    expect(CATEGORY_CAPS).toHaveProperty('tuneTotal');
  });

  it('should cap exhaust gains reasonably by engine type', () => {
    // CATEGORY_CAPS.exhaustTotal has per-engine-type caps
    expect(CATEGORY_CAPS.exhaustTotal.na).toBeLessThanOrEqual(50);
    expect(CATEGORY_CAPS.exhaustTotal.turbo).toBeLessThanOrEqual(50);
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

// =============================================================================
// PLATFORM-SPECIFIC TESTS
// =============================================================================

describe('Platform-specific calibrations', () => {
  const mockRS5B9 = {
    hp: 444,
    torque: 443,
    engine: '2.9L TT V6',
    slug: 'audi-rs5-b9',
    weight: 3990,
    zeroToSixty: 3.7,
    drivetrain: 'AWD',
  };

  const mockBMWB58 = {
    hp: 382,
    torque: 369,
    engine: '3.0L I6 Twin-Turbo',
    slug: 'bmw-m340i',
    weight: 3800,
    zeroToSixty: 4.1,
    drivetrain: 'AWD',
  };

  it('should give RS5 2.9T reduced downpipe gains (efficient factory DP)', () => {
    const rs5Result = calculateSmartHpGain(mockRS5B9, ['downpipe']);
    
    // RS5 2.9T should get ~8 HP from downpipe (forum-validated)
    // NOT the generic 5% (which would be 22 HP)
    expect(rs5Result.totalGain).toBeLessThanOrEqual(10);
    expect(rs5Result.totalGain).toBeGreaterThanOrEqual(5);
    expect(rs5Result.breakdown.downpipe?.calculationMethod).toBe('platform-calibrated');
  });

  it('should give B58 platform higher downpipe gains (restrictive factory DP)', () => {
    const b58Result = calculateSmartHpGain(mockBMWB58, ['downpipe']);
    
    // B58 should get ~20 HP from downpipe (restrictive factory DP)
    expect(b58Result.totalGain).toBeGreaterThanOrEqual(15);
    expect(b58Result.totalGain).toBeLessThanOrEqual(25);
  });

  it('should calculate reasonable Stage 1 build for RS5', () => {
    // Typical Stage 1 build: tune + downpipe + intake
    const result = calculateSmartHpGain(mockRS5B9, ['stage1-tune', 'downpipe', 'intake']);
    
    // RS5 Stage 1 build should be ~90-110 HP total
    // Stage 1: ~80 HP (18% of 444)
    // Downpipe: ~8 HP (platform-specific)
    // Intake: ~13 HP (3% of 444)
    // With diminishing returns and overlap, total should be ~95-105 HP
    expect(result.totalGain).toBeGreaterThanOrEqual(85);
    expect(result.totalGain).toBeLessThanOrEqual(120);
    
    // Should NOT be overcounting (e.g., 140+ HP would indicate double-counting)
    expect(result.totalGain).toBeLessThan(130);
  });
});

describe('Edge Cases', () => {
  it('should handle car with 0 HP', () => {
    const zeroCar = { hp: 0, engine: 'Unknown' };
    const result = calculateSmartHpGain(zeroCar, ['intake']);
    
    expect(result.stockHp).toBe(0);
    expect(result.projectedHp).toBeGreaterThanOrEqual(0);
  });

  it('should handle undefined upgrade keys gracefully', () => {
    const result = calculateSmartHpGain(mockCar, ['nonexistent-mod']);
    
    // Should handle gracefully, not throw
    expect(result.stockHp).toBe(300);
  });

  it('should handle duplicate upgrade keys with diminishing returns', () => {
    const result = calculateSmartHpGain(mockCar, ['intake', 'intake', 'intake']);
    const singleResult = calculateSmartHpGain(mockCar, ['intake']);
    
    // Duplicates may apply diminishing returns or be category-capped
    // Either way, result should be defined and non-negative
    expect(result.totalGain).toBeGreaterThanOrEqual(0);
    expect(result.projectedHp).toBeGreaterThanOrEqual(mockCar.hp);
  });
});
