# Car Selector Domain Audit Report
## SuperNatural Motorsports - OEM-Spec Validation

> **Audit Date:** December 8, 2024  
> **Auditor:** Automated Audit System + Manual Review  
> **Reference Standard:** OEM Specifications  
> **Status:** 🔄 IN PROGRESS

---

## 1. Executive Summary

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Total Vehicles** | 98 | - | - |
| **Vehicles with OEM Reference** | 17 | 98 | 🔄 17.3% |
| **Pass Rate (Audited)** | 82.4% | ≥95% | ⚠️ Below Target |
| **Critical Failures** | 3 | 0 | ❌ Needs Fix |
| **Minor Variances** | 0 | <5 | ✅ Pass |

---

## 2. Data Accuracy Findings

### 2.1 Vehicles Passing All Checks (14)

| Vehicle | HP | Torque | Weight | 0-60 | Status |
|---------|----|----|--------|------|--------|
| Porsche 718 Cayman GT4 | ✅ 414 | ✅ 309 | ✅ 3227 | ✅ 4.2 | PASS |
| Porsche 718 Cayman GTS 4.0 | ✅ 394 | ✅ 309 | ✅ 3153 | ✅ 4.3 | PASS |
| Audi R8 V10 | ✅ 525 | ✅ 398 | ✅ 3660 | ✅ 3.4 | PASS |
| Dodge Viper | ✅ 645 | ✅ 600 | ✅ 3374 | ✅ 3.3 | PASS |
| Chevrolet C8 Corvette Stingray | ✅ 490 | ✅ 465/470 | ✅ 3535 | ✅ 2.9 | PASS |
| Ford Shelby GT500 | ✅ 760 | ✅ 625 | ✅ 4171 | ✅ 3.3 | PASS |
| Ford Shelby GT350 | ✅ 526 | ✅ 429 | ✅ 3760 | ✅ 4.3 | PASS |
| Chevrolet C7 Corvette Grand Sport | ✅ 460 | ✅ 465 | ✅ 3524 | ✅ 3.6 | PASS |
| Chevrolet C7 Corvette Z06 | ✅ 650 | ✅ 650 | ✅ 3599 | ✅ 3.2 | PASS |
| Chevrolet Camaro ZL1 | ✅ 650 | ✅ 650 | ✅ 4078 | ✅ 3.5 | PASS |
| BMW M2 Competition | ✅ 405 | ✅ 406 | ✅ 3655 | ✅ 4.0 | PASS |
| BMW M4 F82 | ✅ 425 | ✅ 406 | ✅ | ✅ 4.1 | PASS |
| Toyota GR Supra | ✅ 382 | ✅ 368 | ✅ 3397 | ✅ 3.9 | PASS |
| BMW M3 E46 | ✅ 333 | ✅ 262 | ✅ 3415 | ✅ 4.8 | PASS |

### 2.2 Vehicles Requiring Review (3)

#### 2.2.1 Nissan GT-R ❌ HP VARIANCE

| Field | Database | OEM Reference | Variance | Threshold | Status |
|-------|----------|---------------|----------|-----------|--------|
| **Horsepower** | 545 | 565 | -20 hp (-3.5%) | ±5 hp or ±1% | ❌ FAIL |
| Torque | 463 | 467 | -4 lb-ft | ±5 lb-ft | ✅ |
| Curb Weight | 3933 | 3933 | 0 | ±50 lbs | ✅ |
| 0-60 | 2.9 | 2.9 | 0 | ±0.3s | ✅ |

**Analysis:** The GT-R has received multiple power upgrades over its production run:
- 2009-2011: 485 hp
- 2012: 530 hp  
- 2013-2016: 545 hp
- 2017-2024: 565 hp

**Root Cause:** Database appears to reference 2013-2016 spec (545 hp). OEM reference uses 2019+ spec (565 hp).

**Recommendation:** 
1. Add model year ranges to vehicle entries
2. Update to 565 hp for current/latest spec OR
3. Document that 545 hp represents mid-cycle refresh

---

#### 2.2.2 Honda S2000 ⚠️ 0-60 VARIANCE

| Field | Database | OEM Reference | Variance | Threshold | Status |
|-------|----------|---------------|----------|-----------|--------|
| Horsepower | 237 | 237 | 0 | ±5 hp | ✅ |
| Torque | 162 | 162 | 0 | ±5 lb-ft | ✅ |
| Curb Weight | 2864 | 2864 | 0 | ±50 lbs | ✅ |
| **0-60** | 5.4 | 6.0 | -0.6s | ±0.3s | ❌ FAIL |

**Analysis:** 
- OEM claimed 0-60: ~6.0 seconds (Honda conservative estimate)
- Magazine test results: 5.4-5.6 seconds (Car & Driver, Motor Trend)
- The DB value appears to use real-world test data

**Root Cause:** Database uses magazine/tested 0-60 times rather than OEM-claimed times.

**Recommendation:**
1. **Option A:** Keep 5.4s but document as "tested" not "OEM claimed"
2. **Option B:** Change to 6.0s to match OEM spec
3. **Option C:** Add both fields: `zeroToSixtyOem` and `zeroToSixtyTested`

**Suggested Resolution:** Document methodology - if DB uses tested times consistently, this is acceptable. Add a `speedSource` field to indicate "OEM" vs "Tested".

---

#### 2.2.3 Toyota GR86 ⚠️ 0-60 VARIANCE

| Field | Database | OEM Reference | Variance | Threshold | Status |
|-------|----------|---------------|----------|-----------|--------|
| Horsepower | 228 | 228 | 0 | ±5 hp | ✅ |
| Torque | 184 | 184 | 0 | ±5 lb-ft | ✅ |
| Curb Weight | 2811 | 2811 | 0 | ±50 lbs | ✅ |
| **0-60** | 5.4 | 6.1 | -0.7s | ±0.3s | ❌ FAIL |

**Analysis:**
- Toyota OEM claimed: 6.1 seconds
- Magazine tests: 5.4-5.7 seconds (Car & Driver got 5.4s)
- Same pattern as S2000 - DB uses tested times

**Root Cause:** Same as S2000 - database uses tested 0-60 vs OEM claimed.

**Recommendation:** Same as S2000 - document methodology consistently.

---

## 3. Schema & Data Model Review

### 3.1 Vehicle Entity Schema Analysis

Based on review of `data/cars.js`:

```javascript
// Current vehicle schema
{
  id: number,          // ✅ Unique identifier
  name: string,        // ✅ Display name
  slug: string,        // ✅ URL-safe identifier  
  brand: string,       // ✅ Manufacturer
  years: string,       // ⚠️ Free text - should be structured
  category: string,    // ✅ Vehicle category
  hp: number,          // ✅ Horsepower
  torque: number,      // ✅ Torque (lb-ft)
  curbWeight: number,  // ✅ Curb weight (lbs)
  zeroToSixty: number, // ⚠️ Needs source documentation
  engine: string,      // ✅ Engine description
  drivetrain: string,  // ✅ RWD/AWD/FWD
  // ... additional fields
}
```

### 3.2 Schema Recommendations

| Issue | Current State | Recommended Change | Priority |
|-------|---------------|-------------------|----------|
| Model year handling | Free text "2020-2024" | Structured `yearStart`, `yearEnd` | HIGH |
| 0-60 source | Undocumented | Add `zeroToSixtySource` enum | HIGH |
| HP by year | Single value | Add `hpHistory` array for cars with updates | MEDIUM |
| Unit consistency | Implied | Add explicit unit fields or documentation | LOW |

---

## 4. Car Selector Algorithm Review

### 4.1 Scoring Algorithm (`lib/scoring.js`)

The scoring algorithm maps user preferences to vehicle attributes:

| Preference Dimension | Algorithm Weight | Vehicle Attribute | Status |
|---------------------|------------------|-------------------|--------|
| Performance | Dynamic | hp, torque, zeroToSixty | ✅ Correctly weighted |
| Handling | Dynamic | curbWeight, drivetrain | ✅ Correctly weighted |
| Value | Dynamic | msrp, hp/$ ratio | ✅ Correctly weighted |
| Daily Drivability | Dynamic | category, comfort score | ✅ Correctly weighted |
| Track Capability | Dynamic | brakingScore, coolingScore | ✅ Correctly weighted |

### 4.2 Scoring Validation Tests

```javascript
// Test Case 1: Track-focused preference
Input: { trackUse: 5, dailyDriving: 1, budget: 'unlimited' }
Expected Top Results: 718 GT4, C7 Z06, GT350
Actual: ✅ PASS - Correct ranking

// Test Case 2: Daily driver preference  
Input: { trackUse: 1, dailyDriving: 5, comfort: 5 }
Expected Top Results: GR Supra, M2 Competition, Camaro SS
Actual: ✅ PASS - Correct ranking

// Test Case 3: Budget-conscious performance
Input: { trackUse: 3, dailyDriving: 3, budget: 'under50k' }
Expected Top Results: Miata ND, GR86, 370Z
Actual: ✅ PASS - Correct ranking
```

---

## 5. Fitment Data Review

### 5.1 Engine Code Consistency

| Vehicle | Engine Code in DB | OEM Engine Code | Match |
|---------|------------------|-----------------|-------|
| 718 GT4 | 4.0L Flat-6 | 4.0L (9A2 Evo) | ⚠️ Partial |
| GT350 | 5.2L Voodoo | 5.2L (Voodoo) | ✅ |
| GT-R | 3.8L TT V6 | VR38DETT | ⚠️ Partial |
| M4 F82 | S55 | S55B30 | ⚠️ Partial |

**Recommendation:** Standardize engine codes to full OEM designations for upgrade compatibility matching.

---

## 6. Data Quality Metrics

### 6.1 Completeness

| Field | Vehicles with Data | % Complete |
|-------|-------------------|------------|
| name | 98/98 | 100% |
| hp | 98/98 | 100% |
| torque | 98/98 | 100% |
| curbWeight | 98/98 | 100% |
| zeroToSixty | 98/98 | 100% |
| engine | 98/98 | 100% |
| drivetrain | 98/98 | 100% |
| quarterMile | 45/98 | 46% |
| brakingDistance | 32/98 | 33% |

### 6.2 Consistency Checks

| Check | Status | Notes |
|-------|--------|-------|
| HP values > 0 | ✅ PASS | All positive |
| Torque values > 0 | ✅ PASS | All positive |
| Weight values reasonable (1500-6000 lbs) | ✅ PASS | All within range |
| 0-60 times reasonable (2.0-10.0s) | ✅ PASS | All within range |
| No duplicate slugs | ✅ PASS | All unique |
| Brand names consistent | ✅ PASS | Standardized |

---

## 7. Action Items

### 7.1 Critical (Fix Immediately)

| ID | Issue | Vehicle | Fix |
|----|-------|---------|-----|
| CAR-001 | HP variance exceeds threshold | Nissan GT-R | Update to 565 hp + document model year |
| CAR-002 | 0-60 methodology unclear | Honda S2000 | Add source documentation |
| CAR-003 | 0-60 methodology unclear | Toyota GR86 | Add source documentation |

### 7.2 High Priority (Fix This Sprint)

| ID | Issue | Fix |
|----|-------|-----|
| CAR-004 | Model year is free text | Add structured yearStart/yearEnd fields |
| CAR-005 | 0-60 source undocumented | Add zeroToSixtySource field |
| CAR-006 | Engine codes inconsistent | Standardize to full OEM codes |

### 7.3 Medium Priority (Backlog)

| ID | Issue | Fix |
|----|-------|-----|
| CAR-007 | quarterMile only 46% complete | Research and add missing values |
| CAR-008 | brakingDistance only 33% complete | Research and add missing values |
| CAR-009 | No HP history for updated models | Add hpHistory array for models with mid-cycle updates |

---

## 8. Audit Evidence

All audit results are stored in:
- `/audit/vehicle-audit-results.json` - Detailed per-vehicle results
- `/audit/OEM_REFERENCE_DATASET.json` - Source reference data
- `/audit/ACCURACY_THRESHOLDS.md` - Threshold definitions

---

## 9. Sign-Off

| Role | Name | Date | Status |
|------|------|------|--------|
| Automated Audit | System | 2024-12-08 | ✅ Complete |
| Manual Review | Pending | - | 🔄 In Progress |
| SME Validation | Pending | - | ⏳ Pending |

---

*Report generated as part of SuperNatural Motorsports Data Audit Initiative*

