# AutoRev Database Deep Dive Audit Report

**Audit Date:** January 21, 2026  
**Auditor:** Automated Database Analysis  
**Scope:** Core performance data tables, parts/fitments, and feature integration

---

## Executive Summary

AutoRev has a solid foundation of **310 cars** with 100% coverage on tuning profiles and known issues. However, significant gaps exist in parts fitments (only 38% of cars have any parts), dyno data (9% coverage), and fitment verification (0.025% verified). The recent vendor imports (FT Speed, JHP USA, EQTuning, IE) added 5,620 parts and 7,904 fitments, but coverage is concentrated on a handful of JDM/European cars.

### Critical Findings at a Glance

| Metric | Current | Target | Gap | Priority |
|--------|---------|--------|-----|----------|
| Cars with fitments | 118/310 (38%) | 280/310 (90%) | 162 cars | **P1** |
| Dyno runs | 29 total | 620 (2/car) | 591 runs | **P1** |
| Verified fitments | 2/7,904 (0.025%) | 4,000 (50%) | 3,998 | **P1** |
| Parts in "other" category | 2,207 (39%) | <5% | 2,100 to fix | **P0** |
| Upgrade keys with parts | 23/49 (47%) | 49/49 (100%) | 26 keys | **P2** |
| Community insights coverage | 20/310 cars (6%) | 150 cars (48%) | 130 cars | **P3** |

---

## Phase 1: Schema & Relationship Analysis

### 1.1 Core Table Inventory

| Table | Row Count | Has car_id | Missing car_id | Orphans |
|-------|-----------|------------|----------------|---------|
| cars | 310 | N/A | N/A | N/A |
| car_issues | 9,104 | 9,104 | 0 | 0 |
| part_fitments | 7,904 | 7,904 | 0 | 0 |
| parts | 5,620 | N/A | N/A | N/A |
| upgrade_key_parts | 2,767 | N/A | N/A | N/A |
| youtube_video_car_links | 2,306 | 2,306 | 0 | 0 |
| youtube_videos | 2,261 | N/A | N/A | N/A |
| community_insights | 1,605 | 1,584 | **21** | 0 |
| car_track_lap_times | 1,232 | 1,232 | 0 | 0 |
| tracks | 450 | N/A | N/A | N/A |
| car_tuning_profiles | 323 | 323 | 0 | 0 |
| upgrade_keys | 49 | N/A | N/A | N/A |
| car_dyno_runs | 29 | 29 | 0 | 0 |

### 1.2 car_id Linkage Status

**GOOD:** No orphaned car_ids detected. All referenced car_ids point to existing cars.

**ISSUE:** 21 community_insights records missing car_id. These are ML350 insights from MBWorld that couldn't be matched to our cars table (we don't have Mercedes ML350 in the database).

---

## Phase 2: Parts & Fitments Deep Dive

### 2.1 Parts by Category

| Category | Parts | Brands | % of Total |
|----------|-------|--------|------------|
| **other** | 2,207 | 7 | **39.3%** ⚠️ |
| suspension | 1,018 | 9 | 18.1% |
| wheels_tires | 576 | 4 | 10.2% |
| brakes | 446 | 7 | 7.9% |
| exhaust | 350 | 7 | 6.2% |
| intake | 338 | 7 | 6.0% |
| tune | 239 | 10 | 4.3% |
| cooling | 200 | 7 | 3.6% |
| fuel_system | 149 | 4 | 2.7% |
| forced_induction | 97 | 6 | 1.7% |

**CRITICAL ISSUE:** 2,207 parts (39%) are categorized as "other" - this breaks Tuning Shop filtering and upgrade key matching.

### 2.2 Parts by Vendor

| Vendor | Parts | Fitments | Unique Cars | Avg Confidence |
|--------|-------|----------|-------------|----------------|
| FT Speed | 2,947 | 4,497 | **2** | 0.82 |
| JHP USA | 1,652 | 1,905 | 10 | 0.70 |
| EQTuning | 337 | 729 | 4 | 0.70 |
| AFE | 94 | 94 | 94 | 0.85 |
| Borla | 94 | 94 | 94 | 0.85 |
| KW | 94 | 94 | 94 | 0.85 |
| StopTech | 94 | 94 | 94 | 0.85 |
| Integrated Engineering | 88 | 138 | 7 | 0.73 |
| MAPerformance | 60 | 67 | 10 | 0.84 |
| BMP Tuning | 57 | 84 | 11 | 0.73 |
| Bilstein | 57 | 57 | 57 | 0.85 |
| EcuTek | 11 | 11 | 11 | 0.85 |
| Dinan | 11 | 11 | 11 | 0.85 |
| Titan Motorsports | 9 | 14 | 8 | 0.85 |
| APR | 8 | 8 | 8 | 0.85 |
| Hondata | 4 | 4 | 4 | 0.85 |
| COBB | 3 | 3 | 3 | 0.85 |

**CRITICAL INSIGHT:** FT Speed's 2,947 parts only fit **2 cars** (Subaru BRZ + Toyota 86). This is expected for a platform-specific vendor, but highlights concentration risk.

### 2.3 Fitment Coverage by Brand

| Brand | Total Cars | Cars w/ Fitments | Coverage % | Status |
|-------|------------|------------------|------------|--------|
| Alfa Romeo | 2 | 2 | 100% | ✅ |
| Lotus | 5 | 5 | 100% | ✅ |
| Dodge | 6 | 5 | 83% | ✅ |
| Honda | 10 | 8 | 80% | ✅ |
| Jaguar | 3 | 2 | 67% | ⚠️ |
| Subaru | 10 | 6 | 60% | ⚠️ |
| Chevrolet | 17 | 9 | 53% | ⚠️ |
| BMW | 21 | 11 | 52% | ⚠️ |
| Porsche | 24 | 11 | 46% | ⚠️ |
| Audi | 20 | 8 | 40% | ⚠️ |
| Toyota | 17 | 5 | 29% | ❌ |
| Volkswagen | 11 | 3 | 27% | ❌ |
| Mitsubishi | 8 | 2 | 25% | ❌ |
| Ford | 27 | 5 | 19% | ❌ |
| McLaren | 7 | 0 | 0% | ❌ |
| Hyundai | 3 | 0 | 0% | ❌ |
| MINI | 3 | 0 | 0% | ❌ |
| Infiniti | 5 | 0 | 0% | ❌ |
| GMC | 4 | 0 | 0% | ❌ |
| Pontiac | 3 | 0 | 0% | ❌ |
| Genesis | 1 | 0 | 0% | ❌ |
| Ram | 5 | 0 | 0% | ❌ |
| Rivian | 2 | 0 | 0% | ❌ |
| Jeep | 8 | 0 | 0% | ❌ |
| Ferrari | 10 | 0 | 0% | ❌ |
| Buick | 1 | 0 | 0% | ❌ |
| Kia | 2 | 0 | 0% | ❌ |

### 2.4 Top Cars by Fitment Count

| Car | Brand | Fitments | Categories |
|-----|-------|----------|------------|
| Subaru BRZ (ZC6) | Subaru | 2,891 | 10 |
| Toyota 86 / Scion FR-S | Toyota | 1,633 | 10 |
| Acura TSX CU2 | Acura | 730 | 10 |
| Honda S2000 | Honda | 408 | 10 |
| Volkswagen GTI Mk7 | Volkswagen | 352 | 10 |
| Volkswagen Golf R Mk7 | Volkswagen | 333 | 10 |
| Honda Civic Si EM1 | Honda | 266 | 10 |
| Volkswagen Golf R Mk8 | Volkswagen | 197 | 10 |
| Honda Civic Type R FL5 | Honda | 183 | 10 |
| Acura Integra Type S | Acura | 122 | 10 |

### 2.5 Cars with ZERO Fitments (192 cars)

**Notable gaps for popular cars:**
- BMW M3 G80, M2 G87, M340i G20, 335i E90, M3 E30/E36
- All Ferrari models (10 cars)
- All McLaren models (7 cars)
- All Jeep models (8 cars)
- All Ram trucks (5 cars)
- Most Audi S-Series (S4, S5 all generations)
- VW GTI Mk4/5/6, Jetta GLI, R32
- Hyundai N cars (Elantra N, Veloster N, Kona N)

### 2.6 Fitment Quality Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Verified fitments | 2 / 7,904 | ❌ 0.025% |
| High confidence (90%+) | 0 | ❌ None |
| Medium confidence (70-89%) | 7,065 | 89.4% |
| Low confidence (50-69%) | 839 | 10.6% |

---

## Phase 3: Performance Data Audit

### 3.1 Dyno Data Analysis

**Total dyno runs:** 29 (covering ~25 unique cars)

| Brand | Cars w/ Dyno | Total Runs | Coverage % |
|-------|--------------|------------|------------|
| Chevrolet | 5 | 5 | 29.4% |
| Volkswagen | 3 | 4 | 27.3% |
| Honda | 2 | 2 | 20.0% |
| Dodge | 1 | 1 | 16.7% |
| Audi | 3 | 5 | 15.0% |
| Ford | 4 | 4 | 14.8% |
| BMW | 3 | 4 | 14.3% |

**Dyno Data Quality:**

| Car | peak_whp | peak_wtq | Source | Verified |
|-----|----------|----------|--------|----------|
| Shelby GT500 | 658 | 595 | motortrend.com | ✅ |
| Dodge Challenger Hellcat | 615 | 580 | caranddriver.com | ✅ |
| Camaro ZL1 | 565 | 545 | caranddriver.com | ✅ |
| C7 Corvette Z06 | 565 | 560 | motortrend.com | ✅ |
| C8 Corvette Stingray | 455 | 435 | caranddriver.com | ✅ |
| ... | ... | ... | ... | ... |
| VW GTI Mk7 | NULL | NULL | repo://data/cars.js | ✅ |
| Audi RS3 8V | NULL | NULL | repo://data/cars.js | ✅ |

**ISSUE:** 6 dyno runs have NULL power values (from internal data files, not real dyno tests)

### 3.2 Lap Time Data Analysis

**Total lap times:** 1,232 (covering 57 unique cars)

**Top Tracks by Data:**

| Track | Lap Times | Unique Cars |
|-------|-----------|-------------|
| Motortrend Figure-8 | 61 | 44 |
| Nürburgring Nordschleife | 48 | 28 |
| Willow Springs | 38 | 23 |
| Hockenheim GP | 34 | 23 |
| Sachsenring | 31 | 26 |
| Laguna Seca | 26 | 22 |

**Lap Time Coverage by Brand:**

| Brand | Cars w/ Laps | Coverage % |
|-------|--------------|------------|
| Jaguar | 2/3 | 67% |
| Dodge | 3/6 | 50% |
| BMW | 9/21 | 43% |
| Subaru | 4/10 | 40% |
| Chevrolet | 6/17 | 35% |
| Honda | 3/10 | 30% |
| Volkswagen | 0/11 | 0% |
| Mazda | 0/10 | 0% |
| Acura | 0/8 | 0% |

**Data Quality:** All lap times have source_url (fastestlaps.com), confidence 0.85, but none are verified.

---

## Phase 4: Community & Insights Data

### 4.1 Community Insights Distribution

| Source Forum | Insights | % of Total |
|--------------|----------|------------|
| Rennlist (Porsche) | 1,354 | 84.4% |
| My350z.com | 97 | 6.0% |
| FT86Club | 79 | 4.9% |
| S2Ki | 31 | 1.9% |
| MBWorld | 21 | 1.3% |
| Reddit | 12 | 0.7% |
| Bimmerpost | 11 | 0.7% |

**Issues:**
- Heavy Porsche concentration (84%)
- Only 20 cars have community insights
- 21 insights missing car_id (ML350 - not in cars table)

### 4.2 Consensus Strength

All 1,605 insights have `consensus_strength = 'single_source'` - no multi-source validation yet.

---

## Phase 5: Tuning Profile & Upgrade Analysis

### 5.1 Tuning Profile Coverage

**100% coverage** - All 310 cars have tuning profiles with:
- `upgrades_by_objective`: Populated
- `stage_progressions`: Populated
- `data_quality_tier`: Set

### 5.2 Upgrade Keys Parts Linkage

| Status | Count | Percentage |
|--------|-------|------------|
| Keys with parts | 23 | 47% |
| Keys without parts | 26 | 53% |

**Keys with Most Parts:**

| Key | Name | Parts |
|-----|------|-------|
| wheels-lightweight | Lightweight Wheels | 452 |
| exhaust-catback | Cat-Back Exhaust | 350 |
| intake | Cold Air Intake | 338 |
| coilovers-street | Street Coilovers | 258 |
| stage1-tune | Stage 1 ECU Tune | 214 |
| big-brake-kit | Big Brake Kit | 156 |

**Keys with ZERO Parts (26):**

| Key | Name | Category |
|-----|------|----------|
| flex-fuel-e85 | E85/Flex Fuel Kit | power_engine |
| stage3-tune | Stage 3+ Tune | electronics_tuning |
| dct-tune | DCT/PDK Software Upgrade | electronics_tuning |
| coilovers-track | Track Coilovers | suspension_handling |
| tires-track | 200TW Track Tires | wheels_tires |
| tires-slicks | R-Compound Slicks | wheels_tires |
| turbo-kit-single | Single Turbo Kit | other |
| turbo-kit-twin | Twin Turbo Kit | other |
| supercharger-roots | Roots/TVS Supercharger | other |
| wing | Rear Wing | aero |
| splitter | Front Splitter | aero |
| camshafts | Performance Camshafts | power_engine |
| forged-internals | Forged Internals | power_engine |
| ... and 13 more |

---

## Phase 6: Feature Integration Analysis

### 6.1 Tuning Shop Readiness

For Tuning Shop to function properly, a car needs:
1. ✅ Tuning profile with `upgrades_by_objective`
2. ⚠️ Parts with fitments for that car
3. ⚠️ Parts linked to upgrade keys

**Sample Car Analysis - BMW M3 G80:**

| Data Type | Count | Status |
|-----------|-------|--------|
| Tuning profiles | 1 | ✅ |
| Part fitments | 0 | ❌ |
| Dyno runs | 0 | ❌ |
| Lap times | 0 | ❌ |
| Community insights | 0 | ❌ |
| Known issues | 19 | ✅ |
| Recalls | 3 | ✅ |
| YouTube videos | 1 | ✅ |

**Verdict:** Tuning Shop will show upgrade recommendations but NO purchasable parts for the M3 G80.

### 6.2 AL Assistant Tool Readiness

| Tool | Data Source | Coverage | Status |
|------|-------------|----------|--------|
| search_parts | part_fitments | 38% of cars | ⚠️ Degraded |
| get_dyno_data | car_dyno_runs | 8% of cars | ❌ Critical |
| get_lap_times | car_track_lap_times | 18% of cars | ⚠️ Limited |
| get_common_issues | car_issues | 100% of cars | ✅ Good |
| get_tuning_data | car_tuning_profiles | 100% of cars | ✅ Good |

### 6.3 My Garage Feature Readiness

| Feature | Data Required | Coverage | Status |
|---------|---------------|----------|--------|
| Known Issues | car_issues | 100% | ✅ |
| Tuning Recommendations | car_tuning_profiles | 100% | ✅ |
| Parts Lookup | part_fitments | 38% | ⚠️ |
| Performance Metrics | car_dyno_runs | 8% | ❌ |
| Track Times | car_track_lap_times | 18% | ⚠️ |

---

## Phase 7: Vendor Coverage Analysis

### 7.1 FT Speed (JDM Specialist)

**Expected Coverage:** Subaru, Toyota 86/BRZ, Mitsubishi Evo

| Car | Fitments | Status |
|-----|----------|--------|
| Subaru BRZ (ZC6) | 2,885 | ✅ Excellent |
| Toyota 86 / FR-S | 1,612 | ✅ Excellent |
| Mitsubishi Evo 8/9 | 13 | ⚠️ Low |
| Mitsubishi Evo X | 8 | ⚠️ Low |
| Subaru WRX STI GR/GV | 11 | ⚠️ Low |

**Gap:** FT Speed data heavily skewed to BRZ/86 twins. Need more Evo and WRX coverage.

### 7.2 EQTuning + Integrated Engineering (VAG Specialists)

**Expected Coverage:** VW, Audi

| Car | EQTuning | IE | Total |
|-----|----------|-----|-------|
| VW GTI Mk7 | 283 | 41 | 352 |
| VW Golf R Mk7 | 275 | 41 | 333 |
| VW Golf R Mk8 | 165 | 20 | 197 |
| Audi RS3 8V | 6 | 17 | 30 |
| Audi RS5 B9 | 0 | 14 | 23 |
| VW GTI Mk6 | 0 | 0 | 0 |
| VW GTI Mk5 | 0 | 0 | 0 |
| VW GTI Mk4 | 0 | 0 | 0 |
| Audi S4 (all gens) | 0 | 0 | 0 |

**Gap:** No coverage for older GTIs (Mk4-6) or S-Series Audis.

### 7.3 BMP Tuning (BMW Specialist)

**Expected Coverage:** BMW M cars

| Car | BMP | Dinan | Total |
|-----|-----|-------|-------|
| BMW M3 F80 | 0 | 1 | 5 |
| BMW M4 F82 | 0 | 1 | 5 |
| BMW M2 Competition | 0 | 1 | 5 |
| BMW M3 G80 | 0 | 0 | 0 |
| BMW M2 G87 | 0 | 0 | 0 |
| BMW 335i E90 | 0 | 0 | 0 |
| BMW 135i E82 | 0 | 0 | 0 |

**Gap:** BMP Tuning has ZERO fitments despite being a BMW specialist. Data import may have failed or didn't include car mappings.

---

## Prioritized To-Do List

### P0 - Critical (Do First)

#### 1. Recategorize Parts from "other"

**Problem:** 2,207 parts (39%) are in "other" category, breaking Tuning Shop filtering and upgrade key matching.

**Impact:** Tuning Shop, AL search_parts, Browse Cars parts display

**Records Affected:** 2,207 parts

**Suggested Fix:**
1. Export parts with `category = 'other'`
2. Create category mapping rules based on part name patterns:
   - "clutch" → drivetrain
   - "turbo", "supercharger" → forced_induction
   - "injector", "fuel pump" → fuel_system
   - "manifold" → intake OR exhaust (context-dependent)
   - "ECU", "tune" → tune
   - etc.
3. Run migration to update categories
4. Set up validation to prevent future "other" imports

**Verification:** `SELECT category, COUNT(*) FROM parts GROUP BY category` should show <5% "other"

---

### P1 - High Priority (Do Before Beta)

#### 2. Expand Fitment Coverage

**Problem:** 192 cars (62%) have ZERO fitments

**Impact:** Tuning Shop, AL search_parts, Browse Cars

**Records Affected:** 192 cars

**Suggested Fix:**
1. **Quick win:** Add generic "universal" fitments for popular upgrade keys (oil catch cans, gauge pods, shift knobs)
2. **Medium effort:** Scrape/import from Enjuku Racing for JDM coverage
3. **Medium effort:** Scrape/import from ECS Tuning for BMW/VW/Audi coverage
4. **Manual:** Create high-priority car list (top searched cars without fitments)

**Priority Cars for Beta:**
- BMW M3 G80, M2 G87, M4 F82
- Audi S4/S5 (any generation)
- VW GTI Mk6
- Hyundai Veloster N, Elantra N
- Toyota GR Corolla

**Verification:** `SELECT COUNT(DISTINCT car_id) FROM part_fitments` should be >200

---

#### 3. Increase Dyno Data Coverage

**Problem:** Only 29 dyno runs (8% of cars)

**Impact:** AL get_dyno_data, Performance Metrics, Stock/Modified comparisons

**Records Affected:** ~285 cars missing dyno data

**Suggested Fix:**
1. **Immediate:** Scrape Car & Driver / Motor Trend dyno test archives
2. **Medium:** Import from Dragy/VBox community databases
3. **Manual:** Add verified baseline dyno data from:
   - Manufacturer spec sheets (crank HP → wheel HP conversion)
   - YouTube dyno videos (DynoJet, Mustang Dyno compilations)
4. Create dyno data quality tiers:
   - Tier 1: Verified publication dyno (Car & Driver, MT)
   - Tier 2: Community dyno with video/sheet
   - Tier 3: Calculated from crank HP

**Minimum for Beta:** At least 100 cars with baseline dyno data

**Verification:** `SELECT COUNT(DISTINCT car_id) FROM car_dyno_runs WHERE peak_whp IS NOT NULL` should be >100

---

#### 4. Improve Fitment Verification

**Problem:** Only 2/7,904 fitments (0.025%) are verified

**Impact:** User trust, potential returns/complaints if wrong fitments

**Suggested Fix:**
1. Auto-verify fitments from OEM part numbers that match exactly
2. Create verification workflow in admin panel
3. Priority: Verify top 20 cars by fitment count (covers 80% of data)
4. Mark confidence >= 0.9 as "high confidence" in UI

**Verification:** `SELECT COUNT(*) FROM part_fitments WHERE verified = true` should be >2000

---

### P2 - Medium Priority (Post-Beta)

#### 5. Link Parts to Missing Upgrade Keys

**Problem:** 26 upgrade keys have ZERO linked parts

**Impact:** Tuning Shop "recommended parts" section empty for these upgrades

**Records Affected:** 26 upgrade keys

**Suggested Fix:**
1. Review "other" category parts - many may match these keys
2. Map parts by name pattern:
   - "turbo kit" → turbo-kit-single/turbo-kit-twin
   - "wing", "spoiler" → wing
   - "splitter" → splitter
   - "coilover" + "track" → coilovers-track
3. Import from specialty vendors:
   - Vivid Racing (turbo kits)
   - APR (forced induction)
   - Tire Rack (track tires)

**Verification:** `SELECT COUNT(*) FROM upgrade_keys WHERE key NOT IN (SELECT DISTINCT upgrade_key FROM upgrade_key_parts)` should be 0

---

#### 6. Expand Community Insights

**Problem:** Only 20 cars have insights, 84% from Rennlist (Porsche)

**Impact:** AL community knowledge, known issues context

**Suggested Fix:**
1. Prioritize Reddit scraping for popular cars:
   - r/WRX, r/GolfGTI, r/BMW, r/Corvette, r/Mustang
2. Target forums:
   - Bimmerpost (BMW)
   - Audizine (Audi)
   - Focus ST/RS forums
   - Civic/Integra forums
3. Run ML extraction on existing forum archives

**Verification:** `SELECT COUNT(DISTINCT car_id) FROM community_insights` should be >100

---

#### 7. Fix ML350 Community Insights

**Problem:** 21 community insights have NULL car_id (for Mercedes ML350)

**Impact:** Data orphaned, not visible in any car context

**Suggested Fix:**
1. Option A: Add Mercedes ML350 to cars table
2. Option B: Delete orphaned insights if ML350 not in scope

**Verification:** `SELECT COUNT(*) FROM community_insights WHERE car_id IS NULL` should be 0

---

### P3 - Nice to Have

#### 8. Implement Quality Tiers for Parts

**Problem:** All 5,620 parts have `quality_tier = 'standard'`

**Impact:** No differentiation between budget/premium options

**Suggested Fix:**
1. Define quality tier rules:
   - premium: Manufacturer-branded (OEM+), high-end tuners
   - performance: Mid-tier aftermarket
   - budget: Entry-level, Chinese brands
2. Map known brands to tiers
3. Add tier badges to UI

---

#### 9. Expand Lap Time Coverage

**Problem:** Only 57 cars have lap times

**Impact:** Performance comparison, track day features

**Suggested Fix:**
1. Import from FastestLaps.com (already sourced, expand scope)
2. Add user-submitted times with verification
3. Prioritize Nürburgring and Laguna Seca (most recognized)

---

## Data Quality Score Card

| Metric | Score | Grade |
|--------|-------|-------|
| car_id integrity | 99.7% | A |
| Tuning profile coverage | 100% | A+ |
| Known issues coverage | 100% | A+ |
| Parts fitment coverage | 38% | D |
| Dyno data coverage | 8% | F |
| Lap time coverage | 18% | D- |
| Community insights coverage | 6% | F |
| Fitment verification rate | 0.025% | F |
| Parts categorization quality | 61% | D+ |
| Upgrade key linkage | 47% | D |

**Overall Grade: C-**

---

## Recommendations for Beta Launch

### Minimum Viable Dataset

1. **Fitments:** Ensure top 50 searched cars have at least 20 fitments each
2. **Dyno:** Add baseline dyno for at least 100 cars (prioritize performance cars)
3. **Parts categorization:** Reduce "other" category to <10%
4. **Upgrade keys:** Link parts to at least 35/49 keys (70%)

### Feature Gating Recommendations

Consider gating these features until data improves:
- **AL dyno tool:** Show "limited data" warning if no dyno data
- **Tuning Shop parts:** Show "coming soon" for cars with <5 fitments
- **Performance comparison:** Require dyno data for comparisons

### Monitoring Dashboard

Create `/internal/data-quality` dashboard showing:
- Real-time fitment coverage by brand
- Dyno data gaps
- Parts categorization breakdown
- Unverified fitment count

---

## Appendix: Verification Queries

### Run these to verify fixes:

```sql
-- Check "other" category reduction
SELECT COUNT(*) FROM parts WHERE category = 'other';
-- Target: <280 (5%)

-- Check fitment coverage
SELECT 
  COUNT(DISTINCT c.id) as total_cars,
  COUNT(DISTINCT pf.car_id) as cars_with_fitments,
  ROUND(100.0 * COUNT(DISTINCT pf.car_id) / COUNT(DISTINCT c.id), 1) as coverage_pct
FROM cars c
LEFT JOIN part_fitments pf ON pf.car_id = c.id;
-- Target: >90%

-- Check dyno coverage
SELECT COUNT(DISTINCT car_id) FROM car_dyno_runs WHERE peak_whp IS NOT NULL;
-- Target: >100

-- Check upgrade key linkage
SELECT COUNT(*) FROM upgrade_keys 
WHERE key NOT IN (SELECT DISTINCT upgrade_key FROM upgrade_key_parts);
-- Target: 0

-- Check verified fitments
SELECT COUNT(*) FROM part_fitments WHERE verified = true;
-- Target: >2000
```

---

*Report generated: January 21, 2026*
