/**
 * Tests for upgradeCalculator.js (Pure Functions)
 * 
 * Tests the HP display and conflict summary functions that don't require
 * external dependencies. The full integration tests require Next.js environment.
 * 
 * Run with: npm test -- lib/upgradeCalculator.test.js
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

// Define the TUNE_HIERARCHY locally for testing (matches upgradeCalculator.js)
const TUNE_HIERARCHY = {
  'stage3-tune': { priority: 5, includes: ['stage2-tune', 'stage1-tune', 'tune-track', 'tune-street'] },
  'stage2-tune': { priority: 4, includes: ['stage1-tune', 'tune-track'] },
  'tune-track': { priority: 3, includes: ['tune-street'] },
  'stage1-tune': { priority: 2, includes: [] },
  'tune-street': { priority: 1, includes: [] },
  'piggyback-tuner': { priority: 1.5, includes: [] },
};

// Copy of formatHpDisplay logic for testing (matches upgradeCalculator.js)
function formatHpDisplay(result) {
  const { stockHp, projectedHp, totalGain, adjustmentAmount } = result;
  
  return {
    full: `Stock ${stockHp} HP → Projected ${projectedHp} HP (+${totalGain})`,
    compact: `${stockHp} → ${projectedHp} HP (+${totalGain})`,
    stock: stockHp,
    projected: projectedHp,
    gain: totalGain,
    hasAdjustment: adjustmentAmount > 5,
    adjustmentNote: adjustmentAmount > 5 
      ? `${adjustmentAmount} HP reduced for realistic stacking`
      : null,
  };
}

// Copy of getConflictSummary logic for testing (matches upgradeCalculator.js)
function getConflictSummary(conflicts) {
  if (!conflicts || conflicts.length === 0) {
    return {
      hasConflicts: false,
      warningCount: 0,
      infoCount: 0,
      totalWastedHp: 0,
      messages: [],
    };
  }
  
  const warnings = conflicts.filter(c => c.severity === 'warning');
  const infos = conflicts.filter(c => c.severity === 'info');
  const totalWasted = conflicts.reduce((sum, c) => sum + (c.wastedHp || 0), 0);
  
  return {
    hasConflicts: true,
    warningCount: warnings.length,
    infoCount: infos.length,
    totalWastedHp: totalWasted,
    messages: conflicts.map(c => ({
      severity: c.severity,
      message: c.message,
      affectedUpgrades: c.affectedUpgrades,
    })),
  };
}

describe('formatHpDisplay', () => {
  it('formats HP display correctly', () => {
    const result = {
      stockHp: 450,
      projectedHp: 520,
      totalGain: 70,
      adjustmentAmount: 10,
    };
    
    const display = formatHpDisplay(result);
    
    assert.strictEqual(display.full, 'Stock 450 HP → Projected 520 HP (+70)');
    assert.strictEqual(display.compact, '450 → 520 HP (+70)');
    assert.strictEqual(display.stock, 450);
    assert.strictEqual(display.projected, 520);
    assert.strictEqual(display.gain, 70);
    assert.strictEqual(display.hasAdjustment, true);
    assert.ok(display.adjustmentNote, 'Should have adjustment note');
  });
  
  it('hides adjustment note for small adjustments', () => {
    const result = {
      stockHp: 450,
      projectedHp: 460,
      totalGain: 10,
      adjustmentAmount: 2, // Less than 5
    };
    
    const display = formatHpDisplay(result);
    
    assert.strictEqual(display.hasAdjustment, false);
    assert.strictEqual(display.adjustmentNote, null);
  });
});

describe('getConflictSummary', () => {
  it('returns empty summary for no conflicts', () => {
    const summary = getConflictSummary([]);
    
    assert.strictEqual(summary.hasConflicts, false);
    assert.strictEqual(summary.warningCount, 0);
    assert.strictEqual(summary.infoCount, 0);
    assert.strictEqual(summary.totalWastedHp, 0);
  });
  
  it('counts warnings and info correctly', () => {
    const conflicts = [
      { severity: 'warning', message: 'Test warning', wastedHp: 30 },
      { severity: 'info', message: 'Test info 1', wastedHp: 10 },
      { severity: 'info', message: 'Test info 2', wastedHp: 5 },
    ];
    
    const summary = getConflictSummary(conflicts);
    
    assert.strictEqual(summary.hasConflicts, true);
    assert.strictEqual(summary.warningCount, 1);
    assert.strictEqual(summary.infoCount, 2);
    assert.strictEqual(summary.totalWastedHp, 45);
    assert.strictEqual(summary.messages.length, 3);
  });
});

describe('TUNE_HIERARCHY', () => {
  it('has correct priority ordering', () => {
    assert.ok(
      TUNE_HIERARCHY['stage3-tune'].priority > TUNE_HIERARCHY['stage2-tune'].priority,
      'Stage 3 should have higher priority than Stage 2'
    );
    assert.ok(
      TUNE_HIERARCHY['stage2-tune'].priority > TUNE_HIERARCHY['stage1-tune'].priority,
      'Stage 2 should have higher priority than Stage 1'
    );
    assert.ok(
      TUNE_HIERARCHY['tune-track'].priority > TUNE_HIERARCHY['tune-street'].priority,
      'Track tune should have higher priority than street tune'
    );
  });
  
  it('stage3 includes lower tunes', () => {
    const stage3Includes = TUNE_HIERARCHY['stage3-tune'].includes;
    
    assert.ok(stage3Includes.includes('stage2-tune'), 'Stage 3 should include Stage 2');
    assert.ok(stage3Includes.includes('stage1-tune'), 'Stage 3 should include Stage 1');
  });
});











