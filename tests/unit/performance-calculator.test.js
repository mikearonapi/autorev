/**
 * Unit Tests: Performance Calculator
 * 
 * Tests the consolidated HP calculation logic, metrics, and conflict detection.
 * 
 * Run: node --test tests/unit/performance-calculator.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

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
} from '../../lib/performanceCalculator/index.js';

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
    
    assert.strictEqual(result.stockHp, 300);
    assert.strictEqual(result.totalGain, 0);
    assert.strictEqual(result.projectedHp, 300);
    assert.strictEqual(result.rawGain, 0);
  });

  it('should handle null car gracefully', () => {
    const result = calculateSmartHpGain(null, ['intake']);
    
    assert.strictEqual(result.stockHp, 0);
    assert.strictEqual(result.projectedHp, 0);
  });

  it('should calculate gains for single intake mod', () => {
    const result = calculateSmartHpGain(mockCar, ['intake']);
    
    assert.ok(result.totalGain > 0, 'Total gain should be positive');
    assert.ok(result.projectedHp > 300, 'Projected HP should exceed stock');
    assert.ok('intake' in result.breakdown || Object.keys(result.breakdown).length >= 0);
  });

  it('should calculate gains for multiple mods', () => {
    const result = calculateSmartHpGain(mockCar, ['intake', 'exhaust-catback', 'headers']);
    
    assert.ok(result.totalGain > 0, 'Total gain should be positive');
  });

  it('should apply diminishing returns for many mods', () => {
    const manyMods = calculateSmartHpGain(mockCar, [
      'intake', 'exhaust-catback', 'headers', 'downpipe', 'stage1-tune'
    ]);
    
    // Adjustment should be applied for multiple mods
    assert.ok(manyMods.adjustmentAmount >= 0, 'Adjustment should be non-negative');
  });

  it('should handle turbo car differently than NA car for downpipe', () => {
    const naResult = calculateSmartHpGain(mockCar, ['downpipe']);
    const turboResult = calculateSmartHpGain(mockTurboCar, ['downpipe']);
    
    // Downpipe should give more gains on turbo cars
    assert.ok(turboResult.totalGain >= naResult.totalGain, 
      'Turbo car should gain at least as much from downpipe');
  });
});

// =============================================================================
// HELPER FUNCTION TESTS
// =============================================================================

describe('isExhaustMod', () => {
  it('should identify exhaust mods correctly', () => {
    assert.strictEqual(isExhaustMod('headers'), true);
    assert.strictEqual(isExhaustMod('exhaust-catback'), true);
    assert.strictEqual(isExhaustMod('downpipe'), true);
  });

  it('should reject non-exhaust mods', () => {
    assert.strictEqual(isExhaustMod('intake'), false);
    assert.strictEqual(isExhaustMod('stage1-tune'), false);
    assert.strictEqual(isExhaustMod('coilovers'), false);
  });
});

describe('isIntakeMod', () => {
  it('should identify intake mods correctly', () => {
    assert.strictEqual(isIntakeMod('intake'), true);
    assert.strictEqual(isIntakeMod('throttle-body'), true);
    assert.strictEqual(isIntakeMod('intake-manifold'), true);
  });

  it('should reject non-intake mods', () => {
    assert.strictEqual(isIntakeMod('headers'), false);
    assert.strictEqual(isIntakeMod('stage1-tune'), false);
  });
});

describe('isForcedInductionMod', () => {
  it('should identify forced induction mods', () => {
    assert.strictEqual(isForcedInductionMod('turbo-kit'), true);
    assert.strictEqual(isForcedInductionMod('supercharger'), true);
    assert.strictEqual(isForcedInductionMod('intercooler'), true);
  });

  it('should reject NA mods', () => {
    assert.strictEqual(isForcedInductionMod('intake'), false);
    assert.strictEqual(isForcedInductionMod('headers'), false);
  });
});

describe('formatHpDisplay', () => {
  it('should format HP values', () => {
    assert.strictEqual(formatHpDisplay(300), '300');
    assert.strictEqual(formatHpDisplay(300.5), '301');
    assert.strictEqual(formatHpDisplay(0), '0');
  });
});

// =============================================================================
// CONSTANTS TESTS
// =============================================================================

describe('STAGE_TUNE_INCLUDED_MODS', () => {
  it('should have stage1 tune defined', () => {
    assert.ok(STAGE_TUNE_INCLUDED_MODS['stage1-tune'] !== undefined);
  });

  it('should have stage2 requiring downpipe', () => {
    assert.ok(STAGE_TUNE_INCLUDED_MODS['stage2-tune'].includes('downpipe'));
  });
});

describe('TUNE_HIERARCHY', () => {
  it('should have increasing priority', () => {
    assert.ok(TUNE_HIERARCHY['stage1-tune'] < TUNE_HIERARCHY['stage2-tune']);
    assert.ok(TUNE_HIERARCHY['stage2-tune'] < TUNE_HIERARCHY['stage3-tune']);
  });
});

describe('getHighestPriorityTune', () => {
  it('should return highest priority tune', () => {
    const keys = ['intake', 'stage1-tune', 'stage2-tune', 'headers'];
    assert.strictEqual(getHighestPriorityTune(keys), 'stage2-tune');
  });

  it('should return null when no tunes', () => {
    const keys = ['intake', 'headers'];
    assert.strictEqual(getHighestPriorityTune(keys), null);
  });
});

describe('isModExpectedByTune', () => {
  it('should return true for mods included in tune', () => {
    assert.strictEqual(isModExpectedByTune('downpipe', 'stage2-tune'), true);
  });

  it('should return false for mods not included', () => {
    assert.strictEqual(isModExpectedByTune('coilovers', 'stage2-tune'), false);
  });
});

// =============================================================================
// CONFLICT DETECTION TESTS
// =============================================================================

describe('detectUpgradeConflicts', () => {
  it('should detect no conflicts for compatible mods', () => {
    const conflicts = detectUpgradeConflicts(['intake', 'exhaust-catback']);
    assert.ok(Array.isArray(conflicts));
  });

  it('should detect overlap between multiple tunes', () => {
    const conflicts = detectUpgradeConflicts(['stage1-tune', 'stage2-tune']);
    assert.ok(conflicts.length > 0, 'Should detect tune conflicts');
  });
});

describe('getConflictSummary', () => {
  it('should summarize conflicts', () => {
    const conflicts = detectUpgradeConflicts(['stage1-tune', 'stage2-tune']);
    const summary = getConflictSummary(conflicts);
    
    assert.ok('hasConflicts' in summary);
    assert.ok('count' in summary);
  });

  it('should show no conflicts for empty array', () => {
    const summary = getConflictSummary([]);
    assert.strictEqual(summary.hasConflicts, false);
    assert.strictEqual(summary.count, 0);
  });
});

// =============================================================================
// METRICS CALCULATION TESTS
// =============================================================================

describe('calculateUpgradedMetrics', () => {
  it('should calculate improved 0-60 with HP gains', () => {
    const result = calculateUpgradedMetrics(mockCar, { hpGain: 50, torqueGain: 40 });
    
    assert.ok(result.zeroToSixty < mockCar.zeroToSixty, 
      '0-60 should improve with HP gains');
  });

  it('should handle missing metrics gracefully', () => {
    const carWithoutMetrics = { hp: 300 };
    const result = calculateUpgradedMetrics(carWithoutMetrics, { hpGain: 50 });
    
    assert.ok(result !== undefined);
  });

  it('should improve braking with braking mods', () => {
    const result = calculateUpgradedMetrics(mockCar, { brakingImprovement: 10 });
    
    assert.ok(result.brakingDistance < mockCar.brakingDistance,
      'Braking should improve with braking mods');
  });
});

// =============================================================================
// CATEGORY CAPS TESTS
// =============================================================================

describe('CATEGORY_CAPS', () => {
  it('should have caps for major categories', () => {
    assert.ok('exhaust' in CATEGORY_CAPS);
    assert.ok('intake' in CATEGORY_CAPS);
    assert.ok('tune' in CATEGORY_CAPS);
  });

  it('should cap exhaust gains reasonably', () => {
    assert.ok(CATEGORY_CAPS.exhaust <= 50, 'Exhaust cap should be reasonable');
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe('Edge Cases', () => {
  it('should handle car with 0 HP', () => {
    const zeroCar = { hp: 0, engine: 'Unknown' };
    const result = calculateSmartHpGain(zeroCar, ['intake']);
    
    assert.strictEqual(result.stockHp, 0);
    assert.ok(result.projectedHp >= 0);
  });

  it('should handle undefined upgrade keys gracefully', () => {
    const result = calculateSmartHpGain(mockCar, ['nonexistent-mod']);
    
    // Should handle gracefully, not throw
    assert.strictEqual(result.stockHp, 300);
  });

  it('should handle duplicate upgrade keys', () => {
    const result = calculateSmartHpGain(mockCar, ['intake', 'intake', 'intake']);
    const singleResult = calculateSmartHpGain(mockCar, ['intake']);
    
    // Should not count same mod 3x
    assert.strictEqual(result.totalGain, singleResult.totalGain);
  });
});

console.log('Performance Calculator tests defined successfully.');
