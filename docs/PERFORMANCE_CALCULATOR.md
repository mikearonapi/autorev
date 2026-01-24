# Performance Calculator Guide

> **SINGLE SOURCE OF TRUTH**: `lib/performanceCalculator/`
> 
> ALL performance calculations (HP gains, metrics, scores) MUST use this module.

---

## Quick Start

```javascript
// ✅ CORRECT - Import from the unified module
import {
  calculateHpGain,
  calculateUpgradedMetrics,
  detectUpgradeConflicts,
  CATEGORY_CAPS,
  TUNE_HIERARCHY,
} from '@/lib/performanceCalculator';

// ❌ WRONG - Don't import from deprecated files
import { calculateSmartHpGain } from '@/lib/upgradeCalculator';  // DEPRECATED
import { calculateUpgradedMetrics } from '@/lib/performance';     // DEPRECATED
```

---

## Module Structure

```
lib/performanceCalculator/
├── index.js          # Public API - import from here
├── constants.js      # CATEGORY_CAPS, TUNE_HIERARCHY, etc.
├── hpCalculator.js   # calculateHpGain()
├── metricsCalculator.js  # calculateUpgradedMetrics()
├── scoreCalculator.js    # Performance scores
└── conflictDetector.js   # Upgrade conflict detection
```

---

## Key Functions

### 1. Calculate HP Gain

Use `calculateHpGain()` for ALL horsepower calculations:

```javascript
import { calculateHpGain } from '@/lib/performanceCalculator';

const result = calculateHpGain({
  stockHp: 310,           // Base horsepower
  stockTorque: 295,       // Base torque (optional)
  aspirationType: 'turbo', // 'turbo', 'naturally-aspirated', 'supercharged'
  upgrades: [
    { key: 'stage1-tune', hpGain: 50 },
    { key: 'intake', hpGain: 15 },
  ],
});

// Returns:
// {
//   totalHpGain: 65,
//   totalTorqueGain: 45,
//   finalHp: 375,
//   finalTorque: 340,
//   breakdown: [...]
// }
```

### 2. Calculate Upgraded Metrics

Use `calculateUpgradedMetrics()` for 0-60, quarter mile, etc.:

```javascript
import { calculateUpgradedMetrics } from '@/lib/performanceCalculator';

const metrics = calculateUpgradedMetrics({
  stockMetrics: {
    zeroToSixty: 5.2,
    quarterMile: 13.4,
  },
  stockHp: 310,
  hpGain: 65,
  weightReduction: 0, // lbs removed
});

// Returns:
// {
//   zeroToSixty: { stock: 5.2, upgraded: 4.6, improvement: 0.6 },
//   quarterMile: { stock: 13.4, upgraded: 12.8, improvement: 0.6 }
// }
```

### 3. Detect Upgrade Conflicts

Use `detectUpgradeConflicts()` to check for incompatible upgrades:

```javascript
import { detectUpgradeConflicts } from '@/lib/performanceCalculator';

const conflicts = detectUpgradeConflicts([
  { key: 'stage1-tune', category: 'tune' },
  { key: 'stage2-tune', category: 'tune' }, // Conflict!
]);

// Returns:
// [{ type: 'tune-overlap', items: ['stage1-tune', 'stage2-tune'] }]
```

---

## Constants Reference

### CATEGORY_CAPS

Maximum allowed upgrades per category:

```javascript
import { CATEGORY_CAPS } from '@/lib/performanceCalculator';

// {
//   tune: 1,      // Only one tune at a time
//   intake: 1,
//   exhaust: 1,
//   turbo: 1,
//   suspension: 2, // Coilovers + sway bars OK
//   wheels: 1,
//   brakes: 2,
// }
```

### TUNE_HIERARCHY

Tune stages and their included modifications:

```javascript
import { TUNE_HIERARCHY } from '@/lib/performanceCalculator';

// Stage 2 includes Stage 1
// Stage 3 includes Stage 2 and Stage 1
```

### DIMINISHING_RETURNS_FACTOR

Factor applied when stacking similar upgrades:

```javascript
import { DIMINISHING_RETURNS_FACTOR } from '@/lib/performanceCalculator';

// 0.85 - each additional upgrade in same category gets 85% of listed gain
```

---

## Common Use Cases

### Tuning Shop: Calculate Build Performance

```javascript
import { 
  calculateHpGain, 
  calculateUpgradedMetrics,
  detectUpgradeConflicts 
} from '@/lib/performanceCalculator';

function calculateBuildPerformance(car, selectedUpgrades) {
  // Check for conflicts first
  const conflicts = detectUpgradeConflicts(selectedUpgrades);
  if (conflicts.length > 0) {
    return { error: 'Conflicting upgrades selected', conflicts };
  }

  // Calculate HP
  const hpResult = calculateHpGain({
    stockHp: car.hp,
    stockTorque: car.torque,
    aspirationType: car.aspirationType,
    upgrades: selectedUpgrades,
  });

  // Calculate metrics
  const metrics = calculateUpgradedMetrics({
    stockMetrics: {
      zeroToSixty: car.zeroToSixty,
      quarterMile: car.quarterMile,
    },
    stockHp: car.hp,
    hpGain: hpResult.totalHpGain,
  });

  return { ...hpResult, metrics };
}
```

### Virtual Dyno Chart: Get Power Curve

```javascript
import { calculateHpGain } from '@/lib/performanceCalculator';

function generateDynoCurve(car, upgrades) {
  const result = calculateHpGain({
    stockHp: car.hp,
    aspirationType: car.aspirationType,
    upgrades,
  });

  // Generate curve points from result.breakdown
  return result.breakdown.map((point, i) => ({
    rpm: 2000 + (i * 500),
    stockHp: point.stockHp,
    modifiedHp: point.modifiedHp,
  }));
}
```

---

## Aspiration Type Effects

Different aspiration types have different gain potentials:

| Aspiration Type | Tune Multiplier | Notes |
|-----------------|-----------------|-------|
| `turbo` | 1.0x - 1.5x | Highest gains from tune |
| `naturally-aspirated` | 0.3x - 0.5x | Limited by displacement |
| `supercharged` | 0.8x - 1.2x | Good gains, less than turbo |
| `twin-turbo` | 1.0x - 1.5x | Treated same as turbo |

---

## Deprecated Files (DO NOT USE)

| File | Status | Notes |
|------|--------|-------|
| `lib/upgradeCalculator.js` | ⚠️ Deprecated | Re-exports from performanceCalculator |
| `lib/performance.js` | ⚠️ Deprecated | Partial wrapper |
| `lib/buildPerformanceCalculator.js` | ⚠️ Deprecated | Legacy |
| `lib/performanceCalculatorV2.js` | 📋 Future | Not in production |

---

## Migration Guide

If you find code using old imports:

```javascript
// OLD (deprecated)
import { calculateSmartHpGain } from '@/lib/upgradeCalculator';
import { calculateUpgradedMetrics } from '@/lib/performance';

// NEW (correct)
import { 
  calculateHpGain, 
  calculateUpgradedMetrics 
} from '@/lib/performanceCalculator';
```

The function signatures are compatible - just update the imports.

---

*Last Updated: 2026-01-22*
