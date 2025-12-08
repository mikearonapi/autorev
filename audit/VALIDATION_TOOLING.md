# Validation Tooling Documentation

## Overview

This document describes the automated validation tooling created as part of the comprehensive data audit. These tools ensure ongoing data quality, algorithm consistency, and content accuracy.

## Quick Start

```bash
# Run all validations
node scripts/run-all-validations.js

# Run quick validations (skips OEM comparison)
node scripts/run-all-validations.js --quick

# Run individual validation scripts
node scripts/data-quality-queries.js
node scripts/algorithm-regression-tests.js
node scripts/content-linter.js
node scripts/validation-suite.js
node scripts/audit-vehicle-data.js
```

## Validation Scripts

### 1. `run-all-validations.js` - Master Runner

**Purpose**: Orchestrates all validation scripts and generates a consolidated report.

**Output**: `audit/validation-summary.json`

**Exit Codes**:
- `0` - All critical validations passed
- `1` - Critical validation failed

---

### 2. `data-quality-queries.js` - Database Quality Checks

**Purpose**: Validates data integrity and consistency in the vehicle database.

**Checks Performed**:
- **Impossible Combinations**: Negative values, impossible HP/torque/weight
- **Missing Required Fields**: id, name, slug, brand, hp, torque, curbWeight, etc.
- **Enum Validations**: Valid drivetrain values (RWD/AWD/FWD/4WD)
- **Duplicate Detection**: Duplicate slugs or IDs
- **Consistency Checks**: HP/torque ratios, power-to-weight vs 0-60 correlation
- **Completeness**: Missing descriptions, images, year ranges

**Output**: `audit/data-quality-report.json`

**Example Output**:
```
✅ Negative HP: PASS
✅ Missing id: PASS
✅ Duplicate Slugs: PASS
⚠️ Missing Image: 98 issues
```

---

### 3. `algorithm-regression-tests.js` - Golden Test Set

**Purpose**: Ensures algorithms don't change behavior unexpectedly. Uses frozen "golden" test data.

**Test Categories**:

1. **Vehicle Specification Tests**
   - Validates HP, torque, weight, 0-60, drivetrain, brand for key vehicles
   - Catches unintended data changes
   
2. **Engine Type Classification Tests**
   - Verifies `getEngineType()` correctly identifies: NA V8, Turbo I6, SC V8, etc.
   
3. **Dependency Rule Tests**
   - Track tires → brake fluid warning
   - Headers → tune requirement
   - Supercharger → fuel/cooling warnings
   
4. **Score Range Tests**
   - Verifies scoring algorithms produce expected ranges for specific vehicles
   
5. **Boundary Tests**
   - Tests edge cases: lightest car, heaviest car, most powerful, least powerful
   
6. **System Integrity Tests**
   - All nodes have required fields
   - All edges reference valid nodes
   - Upgrade-to-node mappings are valid

**Output**: `audit/regression-test-results.json`

**Golden Data Vehicles**:
- Shelby GT350, C8 Corvette Stingray, Nissan GT-R
- 718 Cayman GT4, Toyota GR Supra

---

### 4. `content-linter.js` - Content Quality Validation

**Purpose**: Validates educational content, descriptions, and metadata.

**Checks Performed**:

1. **Car Data Linting**
   - Required fields present
   - Description length minimums
   - Slug format validation (lowercase, hyphens only)
   - HP/torque identical warning (possible data entry error)

2. **System Linting**
   - All systems have names and descriptions
   - Minimum description length

3. **Node Linting**
   - All nodes have names and system references
   - System references are valid
   - Edge validation (all edges reference valid nodes)

4. **Upgrade Education Linting**
   - Category names and descriptions present
   - Tier information complete

5. **Performance Categories**
   - No duplicate keys
   - Required fields (key, label, description)

**Prohibited Content Patterns**:
- "guaranteed", "100% safe", "no risk" - Avoid absolute claims
- Informal language like "ez", "noob", "trust me bro"

**Output**: `audit/content-lint-results.json`

---

### 5. `validation-suite.js` - Comprehensive Validation

**Purpose**: All-in-one validation covering data quality, algorithms, and content.

**Sections**:
- Data Quality Checks (required fields, duplicates, sanity checks)
- Algorithm Regression Tests (scoring, dependency rules)
- Content Validation (upgrade mappings, system descriptions)
- Cross-Domain Consistency (car references, drivetrain compatibility)
- Golden Test Set (specific vehicle specs, system counts)

**Output**: `audit/validation-results.json`

---

### 6. `audit-vehicle-data.js` - OEM Reference Comparison

**Purpose**: Compares internal vehicle data against the OEM reference dataset.

**Requires**: `audit/OEM_REFERENCE_DATASET.json`

**Compares**:
- HP, torque, curb weight, 0-60 times, drivetrain
- Uses configurable tolerance thresholds

**Output**: Logs discrepancies for manual review

---

## Output Files

All validation results are stored in the `audit/` directory:

| File | Description |
|------|-------------|
| `validation-summary.json` | Consolidated report from master runner |
| `data-quality-report.json` | DB quality check results |
| `regression-test-results.json` | Algorithm regression test results |
| `content-lint-results.json` | Content linting results |
| `validation-results.json` | Comprehensive validation results |
| `OEM_REFERENCE_DATASET.json` | Source of truth for OEM specs |

---

## CI/CD Integration

Add to your CI pipeline:

```yaml
# GitHub Actions example
validation:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm install
    - run: node scripts/run-all-validations.js
      name: Run Data Validations
```

---

## Recommended Maintenance Schedule

| Validation | Frequency | Trigger |
|------------|-----------|---------|
| Data Quality | Every commit | Pre-commit hook or CI |
| Algorithm Regression | Every commit | CI |
| Content Linter | Weekly | Manual or scheduled |
| OEM Comparison | Monthly | After data imports |
| Full Suite | Before releases | Manual |

---

## Adding New Tests

### Adding a Golden Test Vehicle

Edit `scripts/algorithm-regression-tests.js`:

```javascript
const GOLDEN_VEHICLE_SPECS = {
  // Add new vehicle
  'new-vehicle-slug': {
    hp: 500,
    torque: 450,
    curbWeight: 3500,
    zeroToSixty: 4.0,
    drivetrain: 'RWD',
    brand: 'Brand',
  },
};
```

### Adding a Data Quality Check

Edit `scripts/data-quality-queries.js`:

```javascript
check(
  'Check Name',
  'Check description',
  (data) => data.filter(c => /* condition */).map(c => c.name),
  'error' // or 'warning' or 'info'
);
```

### Adding a Content Lint Rule

Edit `scripts/content-linter.js`:

```javascript
LINT_RULES.prohibitedPhrases.push({
  pattern: /your regex/i,
  message: 'Your warning message',
});
```

---

## Troubleshooting

### "Module not found" errors

Ensure you're running from the project root:
```bash
cd "/path/to/Sports Car Advisory"
node scripts/run-all-validations.js
```

### "Cannot find OEM reference dataset"

The OEM comparison script requires `audit/OEM_REFERENCE_DATASET.json`. Run in quick mode to skip:
```bash
node scripts/run-all-validations.js --quick
```

### Test failures after data update

If a test fails because data was intentionally changed:
1. Verify the change is correct
2. Update the golden test data to reflect the new correct values
3. Document the change in commit message

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-12-08 | Initial validation tooling suite |

