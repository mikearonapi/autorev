# PAGE AUDIT: /garage/my-specs - Vehicle Specifications

> **Audit ID:** Page-15  
> **Category:** Core App Page (Garage Sub-Page)  
> **Priority:** 14 of 36  
> **Route:** `/garage/my-specs`  
> **Auth Required:** Yes  
> **Parent:** `/garage`

---

## PAGE OVERVIEW

The My Specs page displays comprehensive vehicle specifications for the selected vehicle. This is a data-heavy page showing factory specs, performance numbers, and technical details.

**Key Features:**
- Full vehicle specifications display
- Engine/powertrain details
- Performance figures (HP, torque, 0-60, etc.)
- Dimensions and weights
- Stock vs modified comparison (if mods installed)

---

## FILES TO EXAMINE

### Page Files

| File | Purpose |
|------|---------|
| `app/(app)/garage/my-specs/page.jsx` | Main page component |
| `app/(app)/garage/my-specs/page.module.css` | Page styles |

### Related Components

| File | Purpose |
|------|---------|
| `components/SpecsTable.jsx` | Specs display table |
| `components/SpecRow.jsx` | Individual spec row |
| `components/SelectedCarBanner.jsx` | Shows selected vehicle |

### Related Services

| File | Purpose |
|------|---------|
| `lib/carsClient.js` | Car data fetching |
| `hooks/useCarData.js` | Car data hook |
| `lib/performanceCalculator/` | Modified values calculation |

---

## CRITICAL: Read These First

Before making ANY changes:

1. `docs/SOURCE_OF_TRUTH.md` - Cardinal Rule 4 (Stock vs Modified data)
2. Cross-cutting audit findings:
   - D (UI/UX) - Blue for stock, teal for modified
   - C (Database) - car_id resolution
   - A (Performance) - Data fetching patterns

---

## IMPORTANT: INVESTIGATE BEFORE FIX

Before changing ANY code:

1. ✅ Verify selected vehicle context is working
2. ✅ Test specs display for different vehicle types
3. ✅ Verify stock vs modified comparison works
4. ❌ Do NOT change spec data sources without understanding
5. ❓ If specs seem wrong, check `cars` table data

---

## CHECKLIST

### A. Functionality

- [ ] Page loads with selected vehicle specs
- [ ] Redirects/handles no vehicle selected
- [ ] All spec categories display
- [ ] Engine specs accurate
- [ ] Performance specs accurate
- [ ] Dimensions accurate
- [ ] Stock vs modified shows correctly (if applicable)

### B. Data Flow

- [ ] Uses `useSelectedCar()` for vehicle context
- [ ] Specs fetched using car_id (not slug in query)
- [ ] Uses `useCarData()` or appropriate hook
- [ ] Stock data from `cars` table
- [ ] Modified data calculated from installed mods

### C. UI/UX Design System

- [ ] Colors follow stock/modified pattern:
  - [ ] Stock values in **blue** (`--color-accent-blue`)
  - [ ] Modified values in **teal** (`--color-accent-teal`)
  - [ ] Gain badges in teal
- [ ] No hardcoded hex colors
- [ ] Numbers use monospace font
- [ ] Table styling consistent

### D. Spec Display

- [ ] Specs organized by category (Engine, Performance, Dimensions)
- [ ] Labels are clear and automotive-accurate
- [ ] Units displayed correctly (HP, lb-ft, mph, lbs, in)
- [ ] Null/missing values handled gracefully (show "—")
- [ ] Numbers formatted appropriately (commas, decimals)

### E. Stock vs Modified Comparison

```
Example format:
Horsepower: 444 HP → 543 HP (+99)
            (blue)    (teal)   (teal badge)
```

- [ ] Stock values in blue
- [ ] Modified values in teal
- [ ] Gain shown with "+" prefix
- [ ] Only shows comparison if mods installed
- [ ] Uses `calculateAllModificationGains()` from performanceCalculator

### F. Loading States

- [ ] Skeleton loader for specs table
- [ ] Skeleton matches table structure
- [ ] No layout shift on load

### G. Error States

- [ ] Handles missing vehicle gracefully
- [ ] Handles failed data fetch
- [ ] Shows error with retry option

### H. Empty/Edge States

- [ ] Handles vehicle with minimal specs
- [ ] Handles vehicle without image
- [ ] Shows message for unknown specs

### I. Accessibility

- [ ] Table is semantically correct (`<table>`, `<thead>`, `<tbody>`)
- [ ] Table headers have scope
- [ ] Units accessible to screen readers
- [ ] Contrast meets requirements
- [ ] Focus visible on interactive elements

### J. Performance

- [ ] Specs data fetched efficiently
- [ ] No duplicate queries
- [ ] Page loads in <2.5s

### K. Mobile Responsiveness

- [ ] Table scrolls horizontally if needed
- [ ] Or table adapts to card layout on mobile
- [ ] Readable on 320px width
- [ ] No text truncation issues

---

## SPECIFIC CHECKS FOR SPECS

### Spec Categories to Verify

| Category | Example Specs |
|----------|---------------|
| **Engine** | Displacement, Configuration, Aspiration, Compression |
| **Power** | Horsepower, Torque, Redline, Power-to-Weight |
| **Performance** | 0-60, Quarter Mile, Top Speed |
| **Transmission** | Type, Gears, Final Drive |
| **Chassis** | Curb Weight, Weight Distribution, Layout |
| **Dimensions** | Length, Width, Height, Wheelbase |
| **Fuel** | Tank Capacity, MPG |

### Stock Data Source Verification

```javascript
// Stock values should come from cars table
const stockHp = car.hp;  // From cars table
const stockTorque = car.torque;  // From cars table

// NOT from user_vehicles (that's for user-specific data)
```

### Modified Value Calculation

```javascript
// Modified values should be CALCULATED, not stored
import { calculateAllModificationGains } from '@/lib/performanceCalculator';

const installedMods = vehicle.installedModifications;
const { hpGain, tqGain } = calculateAllModificationGains(installedMods, car);

const modifiedHp = stockHp + hpGain;  // Calculated!
```

---

## TESTING SCENARIOS

### Test Case 1: Stock Vehicle (No Mods)

1. Select vehicle with no modifications
2. Navigate to /garage/my-specs
3. **Expected:** All specs shown in normal display (no comparison)
4. **Verify:** Values match known specs for vehicle

### Test Case 2: Modified Vehicle

1. Select vehicle with installed modifications
2. Navigate to /garage/my-specs
3. **Expected:** Stock → Modified comparison with gains
4. **Verify:** Stock=blue, Modified=teal, gains calculated correctly

### Test Case 3: No Vehicle Selected

1. Clear vehicle selection (if possible)
2. Navigate to /garage/my-specs directly
3. **Expected:** Redirect to /garage or show "Select a vehicle"
4. **Verify:** Doesn't error/crash

### Test Case 4: Missing Spec Data

1. Find vehicle with incomplete specs in database
2. Navigate to /garage/my-specs
3. **Expected:** Missing specs show "—" or "N/A"
4. **Verify:** Page doesn't break

### Test Case 5: Different Vehicle Types

1. Test with sedan, sports car, truck
2. Navigate to /garage/my-specs for each
3. **Expected:** Appropriate specs for each type
4. **Verify:** Layout handles different spec counts

---

## AUTOMATED CHECKS

```bash
# 1. Check for hardcoded colors
grep -rn "#[0-9a-fA-F]\{3,6\}" app/\(app\)/garage/my-specs/*.jsx app/\(app\)/garage/my-specs/*.css

# 2. Check for stock/modified color usage
grep -rn "accent-blue\|accent-teal" app/\(app\)/garage/my-specs/*.jsx

# 3. Check for performanceCalculator usage
grep -rn "calculateAllModificationGains\|performanceCalculator" app/\(app\)/garage/my-specs/*.jsx

# 4. Check for proper table semantics
grep -rn "<table\|<thead\|<tbody\|<th\|<tr\|<td" app/\(app\)/garage/my-specs/*.jsx

# 5. Check for car_id usage
grep -rn "car_id\|carId\|car\.id" app/\(app\)/garage/my-specs/*.jsx

# 6. Check for console.log
grep -rn "console\.log" app/\(app\)/garage/my-specs/*.jsx
```

---

## CROSS-REFERENCE WITH FOUNDATION AUDITS

| Audit | Check On This Page |
|-------|-------------------|
| D. UI/UX | Stock=blue, Modified=teal, monospace for numbers |
| E. Accessibility | Table semantics, screen reader support |
| C. Database | Stock from cars table, mods calculated |
| I. State Management | SelectedCarProvider usage |
| A. Performance | Efficient data fetching |

---

## DELIVERABLES

### 1. Functionality Report

| Feature | Works | Issues |
|---------|-------|--------|
| Specs display | ✅/❌ | |
| Stock values | ✅/❌ | |
| Modified comparison | ✅/❌ | |
| Data accuracy | ✅/❌ | |

### 2. Compliance Report

| Category | Pass | Issues |
|----------|------|--------|
| UI/UX (stock/mod colors) | ✅/❌ | |
| Accessibility | ✅/❌ | |
| Performance | ✅/❌ | |
| Data Flow | ✅/❌ | |

### 3. Issues Found

| Severity | Issue | File:Line | Fix |
|----------|-------|-----------|-----|
| | | | |

---

## VERIFICATION

- [ ] All spec categories display correctly
- [ ] Stock values from cars table (blue)
- [ ] Modified values calculated (teal)
- [ ] Table is accessible
- [ ] Handles edge cases gracefully
- [ ] Mobile responsive

---

## SUCCESS CRITERIA

| # | Criterion |
|---|-----------|
| 1 | All vehicle specs display correctly |
| 2 | Stock values in blue, modified in teal |
| 3 | Gains calculated using performanceCalculator |
| 4 | Table is semantically accessible |
| 5 | Handles missing specs gracefully |
| 6 | Numbers use monospace font |
| 7 | No critical/high issues remaining |

---

## OUTPUT FORMAT

```
📊 PAGE AUDIT: /garage/my-specs

**Status:** ✅ Pass / ⚠️ Issues / ❌ Fail

**Functionality:**
- [x] Specs display correctly
- [x] Stock values accurate
- [ ] Modified comparison needs fix (issue #1)

**Issues Found:**
1. [High] Modified values hardcoded → Use calculateAllModificationGains()
2. [Medium] Horsepower missing blue color → Add var(--color-accent-blue)
...

**Spec Categories:**
- Engine: ✅ Complete
- Performance: ⚠️ Missing 0-60
- Dimensions: ✅ Complete

**Test Results:**
- Stock vehicle: ✅
- Modified vehicle: ⚠️
- No vehicle: ✅
- Missing specs: ✅
```

---

## AUDIT EXECUTION LOG

| Date | Auditor | Status | Issues | Notes |
|------|---------|--------|--------|-------|
| | | | | |

---

*Audit prompt generated: January 25, 2026*  
*Part of AutoRev Systematic Audit Suite (36 total audits)*
