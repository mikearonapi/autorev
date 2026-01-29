# AutoRev Database Deep Dive Audit
## Data Quality & Integration Report

**Date:** January 21, 2026  
**Auditor:** Automated Database Analysis  
**Scope:** Parts, Fitments, Performance Data, Community Insights, Feature Integration

---

## Executive Summary

### Key Metrics Overview

| Data Type | Current Count | Cars Covered | Coverage % |
|-----------|---------------|--------------|------------|
| Cars | 310 | - | - |
| Parts | 5,620 | - | - |
| Part Fitments | 7,904 | 111 | **35.8%** |
| Dyno Runs | 29 | 25 | **8.1%** |
| Lap Times | 1,232 | 58 | **18.7%** |
| Community Insights | 1,605 | 19 | **6.1%** |
| Known Issues | 9,104 | 310 | **100%** |
| Recalls | 1,365 | - | - |
| YouTube Videos | 2,306 | 285+ | **92%+** |
| Tuning Profiles | 323 | 310 | **100%** |
| Pricing Snapshots | 6,212 | - | - |

### Critical Findings Summary

| Severity | Issue | Impact |
|----------|-------|--------|
| 🔴 **P0** | All 1,232 lap times have orphaned track_ids (260 unique IDs, 0 match tracks table) | Lap time features broken |
| 🔴 **P0** | upgrade_key_parts table is empty (0 rows) | Upgrade → Part linking broken |
| 🟠 **P1** | 199 cars (64.2%) have zero part fitments | Tuning Shop limited |
| 🟠 **P1** | Only 29 dyno runs for 25 cars (8.1% coverage) | Performance data sparse |
| 🟠 **P1** | 68 community insights missing car_id | Data linkage incomplete |
| 🟡 **P2** | 7,902 of 7,904 fitments unverified (99.97%) | Confidence issue |
| 🟡 **P2** | Vendor fitments concentrated on limited cars | Uneven coverage |

---

## Phase 1: Core Inventory Analysis

### 1.1 Table Row Counts (Sorted by Volume)

| Table | Rows | Status |
|-------|------|--------|
| car_issues | 9,104 | ✅ Excellent |
| part_fitments | 7,904 | ⚠️ Coverage limited |
| part_pricing_snapshots | 6,212 | ✅ Good |
| parts | 5,620 | ✅ Good |
| youtube_video_car_links | 2,306 | ✅ Good |
| community_insights | 1,605 | ⚠️ Limited coverage |
| car_recalls | 1,365 | ✅ Good |
| car_track_lap_times | 1,232 | 🔴 Track linkage broken |
| car_tuning_profiles | 323 | ✅ Full coverage |
| cars | 310 | ✅ Base inventory |
| tracks | 99 | ✅ Good |
| upgrade_keys | 49 | ✅ Defined |
| upgrade_packages | 42 | ✅ Defined |
| car_dyno_runs | 29 | ⚠️ Very limited |
| **upgrade_key_parts** | **0** | 🔴 **EMPTY** |

### 1.2 car_id Linkage Audit Results

| Table | Total | Has car_id | Missing | Orphaned |
|-------|-------|------------|---------|----------|
| car_tuning_profiles | 323 | 323 (100%) | 0 | 0 |
| part_fitments | 7,904 | 7,904 (100%) | 0 | 0 |
| car_dyno_runs | 29 | 29 (100%) | 0 | 0 |
| car_track_lap_times | 1,232 | 1,232 (100%) | 0 | 0 |
| community_insights | 1,605 | 1,537 (95.8%) | **68** | 0 |

**Finding:** All car_id references are valid (no orphans), but 68 community insights are missing car_id linkage.

---

## Phase 2: Parts & Fitments Analysis

### 2.1 Parts by Category

| Category | Parts | Brands | Notes |
|----------|-------|--------|-------|
| other | 2,207 | 7 | Needs categorization review |
| suspension | 1,018 | 9 | ✅ Good coverage |
| wheels_tires | 576 | 4 | ✅ Good |
| brakes | 446 | 7 | ✅ Good |
| exhaust | 350 | 7 | ✅ Good |
| intake | 338 | 7 | ✅ Good |
| tune | 239 | 10 | ✅ Good |
| cooling | 200 | 7 | ⚠️ Could expand |
| fuel_system | 149 | 4 | ⚠️ Could expand |
| forced_induction | 97 | 6 | ⚠️ Limited |

**Issue:** 2,207 parts categorized as "other" (39.3%) need review and proper categorization.

### 2.2 Parts by Vendor/Brand

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

**Critical Issue:** FT Speed has 2,947 parts but they only map to **2 cars** (Subaru BRZ and Toyota 86). Expected coverage for WRX/STI/Evo is missing.

### 2.3 Fitment Coverage by Brand

**Top Coverage (>50%):**
| Brand | Total Cars | Cars w/ Fitments | Coverage |
|-------|------------|------------------|----------|
| Alfa Romeo | 2 | 2 | 100% |
| Lotus | 5 | 5 | 100% |
| Dodge | 6 | 5 | 83.3% |
| Honda | 10 | 8 | 80.0% |
| Jaguar | 3 | 2 | 66.7% |
| Subaru | 10 | 6 | 60.0% |
| Chevrolet | 17 | 9 | 52.9% |
| BMW | 21 | 11 | 52.4% |

**Zero Coverage (0%):**
| Brand | Total Cars | Gap |
|-------|------------|-----|
| McLaren | 7 | 7 cars |
| Hyundai | 3 | 3 cars |
| MINI | 3 | 3 cars |
| Infiniti | 5 | 5 cars |
| GMC | 4 | 4 cars |
| Pontiac | 3 | 3 cars |
| Genesis | 1 | 1 car |
| Ram | 5 | 5 cars |
| Rivian | 2 | 2 cars |
| Jeep | 8 | 8 cars |
| Ferrari | 10 | 10 cars |
| Buick | 1 | 1 car |
| Kia | 2 | 2 cars |

### 2.4 Top 15 Cars by Fitment Count

| Rank | Car | Fitments | Categories |
|------|-----|----------|------------|
| 1 | Subaru BRZ | 2,891 | 10 |
| 2 | Toyota 86 / Scion FR-S | 1,633 | 10 |
| 3 | Acura TSX CU2 | 730 | 10 |
| 4 | Honda S2000 | 408 | 10 |
| 5 | Volkswagen GTI Mk7 | 352 | 10 |
| 6 | Volkswagen Golf R Mk7 | 333 | 10 |
| 7 | Honda Civic Si EM1 | 266 | 10 |
| 8 | Volkswagen Golf R Mk8 | 197 | 10 |
| 9 | Honda Civic Type R FL5 | 183 | 10 |
| 10 | Acura Integra Type S | 122 | 10 |

### 2.5 Parts Data Quality

| Metric | Count | Percentage |
|--------|-------|------------|
| Total Parts | 5,620 | 100% |
| Missing Part Number | 0 | 0% ✅ |
| Missing Category | 0 | 0% ✅ |
| Poor Description (<20 chars) | 115 | 2.0% ⚠️ |

### 2.6 Fitment Quality

| Metric | Count | Percentage |
|--------|-------|------------|
| High Confidence (90%+) | 0 | 0% |
| Medium Confidence (70-89%) | 7,065 | 89.4% |
| Low Confidence (50-69%) | 839 | 10.6% |
| **Verified** | **2** | **0.03%** 🔴 |
| **Unverified** | **7,902** | **99.97%** |

---

## Phase 3: Performance Data Audit

### 3.1 Dyno Data Analysis

**Coverage:** 29 runs across 25 cars (8.1% of fleet)

**Runs by Brand (brands with data):**
| Brand | Cars w/ Dyno | Total Runs |
|-------|--------------|------------|
| Chevrolet | 5 | 5 |
| Ford | 4 | 4 |
| Audi | 3 | 5 |
| BMW | 3 | 4 |
| Volkswagen | 3 | 4 |
| Honda | 2 | 2 |
| Nissan | 1 | 1 |
| Porsche | 1 | 1 |
| Subaru | 1 | 1 |
| Toyota | 1 | 1 |
| Dodge | 1 | 1 |

**Quality Assessment:**
- 22 of 29 runs (76%) have verified status
- Most runs have source_url from reputable sources (Car and Driver, Motor Trend, manufacturer)
- Mix of baseline (stock) and modded runs
- Some runs missing torque data (peak_tq = null)

### 3.2 Lap Time Data Analysis

**🔴 CRITICAL: Track Linkage Broken**

| Metric | Value |
|--------|-------|
| Total Lap Times | 1,232 |
| Unique Cars | 58 (18.7%) |
| Unique track_ids | 260 |
| Tracks in tracks table | 99 |
| **Matched track_ids** | **0** |
| **Orphaned track_ids** | **260 (100%)** |

**Impact:** All lap times have track_ids that don't exist in the `tracks` table. This breaks any track-based queries and displays.

**Additional Findings:**
- All 1,232 lap times are marked `is_stock = true`
- 0 modified/upgraded lap times exist
- Missing source validation for comparison

### 3.3 Brands with Most Lap Time Data

Based on car_track_lap_times by brand (despite broken track links):
- BMW: 9 cars with laps
- Chevrolet: 6 cars with laps
- Ford: 5 cars with laps
- Subaru: 4 cars with laps
- Honda, Lexus: 3 cars each

---

## Phase 4: Community Insights Audit

### 4.1 Source Distribution

| Forum | Insights | Percentage |
|-------|----------|------------|
| rennlist | 1,354 | 84.4% |
| my350z | 97 | 6.0% |
| ft86club | 79 | 4.9% |
| s2ki | 31 | 1.9% |
| mbworld | 21 | 1.3% |
| reddit:unknown | 12 | 0.7% |
| bimmerpost | 11 | 0.7% |

**Finding:** Heavy skew toward Porsche/Rennlist content (84%). Need more diverse forum coverage.

### 4.2 Car Coverage

Only **19 cars** have community insights (6.1% of fleet).

**Top Cars:**
| Car | Insights |
|-----|----------|
| 987.2 Cayman S | 300 |
| Porsche 911 GT3 996 | 290 |
| 718 Cayman GT4 | 188 |
| 997.2 Carrera S | 150 |
| 981 Cayman S | 125 |
| 991.1 Carrera S | 111 |
| Porsche 911 GT3 997 | 107 |
| Nissan 350Z | 97 |
| 718 Cayman GTS 4.0 | 49 |

### 4.3 Missing car_id Analysis

68 insights missing car_id (4.2%). Sample titles suggest these are generic/wheel-related content that couldn't map to specific cars:
- "GT-Radial Champiro SX2 has different tread wear ratings by size"
- "APEX SM-10RS Forged Wheel Features"
- Generic fitment guidance

---

## Phase 5: Tuning Profile Analysis

### 5.1 Coverage

**✅ 100% Coverage:** All 310 cars have tuning profiles.

### 5.2 Data Quality Tiers

| Quality Tier | Count | Percentage |
|--------------|-------|------------|
| enriched | 124 | 38.4% |
| researched | 93 | 28.8% |
| skeleton | 57 | 17.6% |
| templated | 36 | 11.1% |
| unknown | 12 | 3.7% |
| verified | 1 | 0.3% |

**Finding:** 67.2% of profiles are "enriched" or "researched" quality. 17.6% are skeleton profiles needing enrichment.

### 5.3 Upgrade Keys → Parts Linkage

**🔴 CRITICAL: upgrade_key_parts table is EMPTY (0 rows)**

This means:
- No parts are linked to upgrade keys
- Tuning Shop cannot suggest specific parts for upgrade types
- Must rely only on category-based matching

---

## Phase 6: Feature Integration Readiness

### 6.1 Sample Car Analysis: BMW M3 G80

| Data Type | Available | Status |
|-----------|-----------|--------|
| Tuning Profile | 1 | ✅ |
| Part Fitments | 0 | ❌ |
| Dyno Runs | 0 | ❌ |
| Lap Times | 0 | ❌ |
| Community Insights | 0 | ❌ |
| Known Issues | 19 | ✅ |
| YouTube Videos | 1 | ✅ |

**Impact:** BMW M3 G80 (a flagship performance car) has only issues and tuning profile data. No parts, dyno, laps, or community data.

### 6.2 Tuning Shop Readiness (Top 30 Cars)

All top 30 cars by fitment count have:
- ✅ Tuning profiles
- ✅ upgrades_by_objective data
- ✅ Part fitments

But coverage drops sharply after top 30.

### 6.3 AL Assistant Data Readiness by Brand

| Brand | Cars | Has Parts | Has Dyno | Has Laps | Has Issues |
|-------|------|-----------|----------|----------|------------|
| Ford | 27 | 5 (19%) | 4 (15%) | 5 (19%) | 27 (100%) |
| Porsche | 24 | 11 (46%) | 1 (4%) | 2 (8%) | 24 (100%) |
| BMW | 21 | 11 (52%) | 3 (14%) | 9 (43%) | 21 (100%) |
| Audi | 20 | 8 (40%) | 3 (15%) | 1 (5%) | 20 (100%) |
| Chevrolet | 17 | 9 (53%) | 5 (29%) | 6 (35%) | 17 (100%) |

---

## Phase 7: Vendor Fitment Mapping Issues

### 7.1 FT Speed Coverage Gap

**Expected:** Subaru WRX/STI, Mitsubishi Evo
**Actual:** Only Subaru BRZ (2,885) and Toyota 86 (1,612)

| Expected Car | FT Speed Fitments |
|--------------|-------------------|
| Subaru BRZ | 2,885 ✅ |
| Toyota 86 | 1,612 ✅ |
| Subaru WRX STI GR/GV | 0 ❌ |
| Subaru WRX STI GD | 0 ❌ |
| Subaru WRX STI VA | 0 ❌ |
| Mitsubishi Evo 8/9 | 0 ❌ |
| Mitsubishi Evo X | 0 ❌ |

### 7.2 EQTuning/IE Coverage

**Expected:** VW/Audi EA888 platform cars
**Actual:** Good for Golf/GTI Mk7+, gaps in older models

| Car | EQTuning | IE | Total |
|-----|----------|-----|-------|
| VW GTI Mk7 | 283 | 41 | 324 ✅ |
| VW Golf R Mk7 | 275 | 41 | 316 ✅ |
| VW Golf R Mk8 | 165 | 20 | 185 ✅ |
| Audi RS3 8V | 6 | 17 | 23 ✅ |
| VW GTI Mk5 | 0 | 0 | 0 ❌ |
| VW GTI Mk6 | 0 | 0 | 0 ❌ |
| Audi S4 B8/B9 | 0 | 0 | 0 ❌ |

### 7.3 BMP Tuning Coverage

**Expected:** BMW platform focus
**Actual:** VW/Audi focus instead

| Car | BMP Fitments |
|-----|--------------|
| VW GTI Mk7 | 28 |
| VW Golf R Mk7 | 17 |
| VW Golf R Mk8 | 12 |
| Audi RS3 8V | 7 |
| **BMW M3 G80** | **0** ❌ |
| **BMW M4 F82** | **0** ❌ |

---

## Data Coverage Summary Table

| Data Type | Current | Target (Beta) | Gap | Priority |
|-----------|---------|---------------|-----|----------|
| Cars | 310 | 310 | 0 | - |
| Tuning Profiles | 323 (100%) | 310 (100%) | 0 | - |
| Known Issues | 9,104 (100%) | 310+ cars | 0 | - |
| Parts | 5,620 | 6,000+ | ~400 | P2 |
| Fitments | 7,904 / 111 cars | 200+ cars | 89 cars | **P1** |
| Dyno Runs | 29 / 25 cars | 100+ cars | 75+ cars | **P1** |
| Lap Times | 1,232 / 58 cars | 100+ cars | 42+ cars | P2 |
| Community Insights | 1,605 / 19 cars | 50+ cars | 31+ cars | P2 |
| YouTube Links | 2,306 / 285 cars | 290+ cars | ~25 cars | P3 |
| Track Linkage | 0% | 100% | **100%** | **P0** |
| Upgrade Key Parts | 0 | 200+ | **200+** | **P0** |

---

## Data Quality Issues List

### Critical (P0)

| ID | Table | Issue | Count | Impact | Fix |
|----|-------|-------|-------|--------|-----|
| DQ-001 | car_track_lap_times | All track_ids orphaned | 1,232 rows | Lap time features broken | Regenerate track_ids or rebuild track reference |
| DQ-002 | upgrade_key_parts | Table empty | 0 rows | Upgrade → Part linking broken | Populate from existing fitments |

### High (P1)

| ID | Table | Issue | Count | Impact | Fix |
|----|-------|-------|-------|--------|-----|
| DQ-003 | part_fitments | 64% of cars have zero fitments | 199 cars | Tuning Shop limited | Expand vendor imports |
| DQ-004 | car_dyno_runs | Only 8% coverage | 285 missing | Performance data sparse | Scrape additional sources |
| DQ-005 | community_insights | Missing car_id | 68 rows | Unlinkable insights | Manual mapping or deletion |
| DQ-006 | part_fitments | 99.97% unverified | 7,902 rows | Trust issue | Implement verification workflow |

### Medium (P2)

| ID | Table | Issue | Count | Impact | Fix |
|----|-------|-------|-------|--------|-----|
| DQ-007 | parts | Categorized as "other" | 2,207 | Poor categorization | Review and recategorize |
| DQ-008 | parts | Poor description | 115 | UX issue | Enrich descriptions |
| DQ-009 | community_insights | Heavy Porsche skew | 84% | Limited coverage | Scrape more forums |
| DQ-010 | car_tuning_profiles | Skeleton quality | 57 | Limited data | Enrich profiles |

---

## Prioritized To-Do List

### [P0] Fix Lap Time Track Linkage

**Problem:** All 1,232 lap times have track_ids that don't exist in the tracks table (260 orphaned IDs vs 99 tracks).

**Impact:** 
- Lap time pages/features completely broken
- Track comparison features non-functional
- AL `get_lap_times` tool returns data without track context

**Records Affected:** 1,232 rows (100% of lap times)

**Suggested Fix:**
1. Export current lap_time data with track context (if stored elsewhere)
2. Audit where these track_ids came from (likely different migration/import)
3. Either:
   a. Create missing track entries for the 260 IDs
   b. Map the 260 IDs to existing 99 tracks
   c. Re-import lap times with correct track_ids

**Estimated Effort:** 1-2 days

---

### [P0] Populate upgrade_key_parts Table

**Problem:** The table linking upgrade_keys to parts is completely empty.

**Impact:**
- Tuning Shop cannot recommend specific parts by upgrade type
- "Stage 1 tune" can't suggest actual tuning products
- upgrade_keys feature is decorative only

**Records Affected:** 0 rows (needs 200+ rows)

**Suggested Fix:**
1. For each of the 49 upgrade_keys, query parts by matching category
2. Create upgrade_key_parts entries with:
   - upgrade_key reference
   - part_id reference
   - relevance_score (how well part matches the upgrade)
3. Prioritize high-confidence fitments

```sql
-- Example: Link "intake" upgrade key to intake parts
INSERT INTO upgrade_key_parts (upgrade_key, part_id, relevance_score)
SELECT 
  'intake_upgrade' as upgrade_key,
  p.id as part_id,
  0.8 as relevance_score
FROM parts p
WHERE p.category = 'intake' AND p.is_active = true;
```

**Estimated Effort:** 1 day

---

### [P1] Expand Part Fitments Coverage

**Problem:** 199 of 310 cars (64.2%) have zero part fitments.

**Impact:**
- Tuning Shop shows empty for most cars
- AL parts search returns nothing for popular vehicles
- Major brands (Ferrari, McLaren, Jeep, etc.) completely missing

**Records Affected:** 199 cars with 0 fitments

**Suggested Fix:**
1. Prioritize popular cars without fitments:
   - BMW M3 G80, M4 F82 (0 fitments)
   - Hyundai Elantra N, Veloster N (0 fitments)
   - All Ferrari/McLaren (0 fitments)
2. Import from additional vendors:
   - Turner Motorsport (BMW)
   - Mountune (Ford)
   - AWE Tuning (multi-platform)
3. Use "universal" parts approach for categories like brakes, suspension

**Estimated Effort:** 3-5 days per vendor

---

### [P1] Expand Dyno Data Coverage

**Problem:** Only 29 dyno runs for 25 cars (8.1% coverage).

**Impact:**
- Most car pages show no dyno data
- Power gains can't be validated
- Tuning expectations can't be set

**Records Affected:** 285 cars missing dyno data

**Suggested Fix:**
1. Scrape established dyno databases:
   - DynoJet results
   - Dragtimes.com
   - Car and Driver tested data
2. Focus on cars with existing tuning profiles
3. Prioritize baseline (stock) runs first, then modded

**Sources to Consider:**
- caranddriver.com (tested reviews)
- motortrend.com (First Test articles)
- YouTube dyno runs (with timestamps)
- Forum dyno threads

**Estimated Effort:** 2-3 days for scraper + ongoing enrichment

---

### [P1] Fix Community Insights car_id Gaps

**Problem:** 68 community insights (4.2%) have NULL car_id.

**Impact:**
- These insights don't appear on any car page
- Reduces available community data

**Records Affected:** 68 rows

**Suggested Fix:**
1. Review the 68 insights for car context
2. For car-specific content: map to appropriate car_id
3. For generic content (wheel specs, etc.): either:
   - Delete if not useful
   - Keep as "universal" insights (requires schema change)

**Estimated Effort:** 2-4 hours

---

### [P2] Implement Fitment Verification Workflow

**Problem:** 99.97% of fitments are unverified (only 2 verified).

**Impact:**
- Users can't trust fitment data
- No quality differentiation
- Potential compatibility issues

**Records Affected:** 7,902 rows

**Suggested Fix:**
1. Create admin verification interface
2. Prioritize high-confidence fitments (90%+) for verification
3. Track verification source (user report, manufacturer confirm, etc.)
4. Add verification badge to UI

**Estimated Effort:** 3-5 days

---

### [P2] Expand FT Speed to WRX/STI/Evo

**Problem:** FT Speed has 2,947 parts but only maps to BRZ/86. Expected coverage for WRX/STI/Evo missing.

**Impact:**
- Popular Subaru/Mitsubishi cars have no FT Speed parts
- Known vendor specialty not utilized

**Records Affected:** ~10 cars expected

**Suggested Fix:**
1. Review FT Speed catalog for WRX/STI/Evo applications
2. Create fitments for:
   - Subaru WRX STI GD/GR/VA
   - Mitsubishi Evo 8/9/X
3. Re-run fitment matcher with broader car mapping

**Estimated Effort:** 1-2 days

---

### [P2] Diversify Community Insights Sources

**Problem:** 84.4% of insights from Rennlist (Porsche-focused).

**Impact:**
- Only 19 cars have community data
- Non-Porsche brands severely underrepresented

**Records Affected:** 291 cars missing insights

**Suggested Fix:**
1. Expand forum scrapers to:
   - MustangForums.com (Ford)
   - CamaroForums.com (Chevrolet)
   - AudiWorld.com (Audi)
   - HondaTech.com (Honda)
   - NASIOC.com (Subaru)
2. Reddit communities:
   - r/BMW
   - r/Mustang
   - r/GolfGTI

**Estimated Effort:** 1-2 days per forum

---

### [P3] Recategorize "Other" Parts

**Problem:** 2,207 parts (39.3%) categorized as "other".

**Impact:**
- Poor filtering/search experience
- Category-based recommendations don't include these parts

**Records Affected:** 2,207 rows

**Suggested Fix:**
1. Review "other" parts by name/description patterns
2. Create sub-categories if needed (engine internals, electronics, etc.)
3. Batch update based on keyword matching

**Estimated Effort:** 4-8 hours

---

## Recommendations for Dyno Data

### Current State
- 29 runs across 25 cars
- Most are "baseline" (stock) runs
- Good source attribution (Car and Driver, Motor Trend, YouTube)

### Sources to Pursue

1. **Magazine/Review Sites (High Credibility)**
   - Car and Driver tested reviews
   - Motor Trend First Test
   - Road & Track
   - Automobile Magazine

2. **Dyno Databases (Volume)**
   - DragtimesDB
   - SAE J1349 corrected results
   - YouTube dyno channels (1320video, Hennessey, etc.)

3. **Vendor Data (Mod Verification)**
   - APR stage results
   - COBB AccessPort logs
   - ECU tune before/after

### Minimum Viable Dataset for Beta

| Priority | Cars | Target Runs |
|----------|------|-------------|
| P1 | Top 50 popular cars | 100 baseline runs |
| P2 | All cars with fitments | 200 baseline runs |
| P3 | Modded comparison runs | 100 modded runs |

### Validation Requirements
- Source URL required
- Dyno type documented (Mustang, Dynojet, hub)
- Correction factor noted (SAE, STD, etc.)
- Confidence score based on source credibility

---

## Success Criteria Checklist

After implementing P0 and P1 fixes:

- [x] Exact row counts documented for all tables
- [ ] All lap times have valid track_ids (currently 0%)
- [ ] upgrade_key_parts populated (currently 0 rows)
- [ ] 50%+ of cars have part fitments (currently 35.8%)
- [ ] 50+ cars have dyno data (currently 25)
- [ ] 68 community insights linked to cars (currently NULL)
- [ ] Fitment verification workflow in place
- [ ] Prioritized action list complete

---

## Appendix A: Cars with Zero Fitments by Brand

| Brand | Count | Example Cars |
|-------|-------|--------------|
| Ford | 22 | F-150, Bronco, Mustang variants |
| Porsche | 13 | 911 GT3 RS 992, Cayenne, 918 |
| Toyota | 12 | GR Corolla, Land Cruiser, Tundra |
| Audi | 12 | S4 B5-B9, A3, A4 |
| Ferrari | 10 | 488, F8, SF90 (all) |
| BMW | 10 | M2 G87, M3 E30/E36, i4 M50 |

## Appendix B: Tuning Shop Ready Cars

Top 30 cars with complete Tuning Shop data:
1. Subaru BRZ (2,891 fitments)
2. Toyota 86 (1,633 fitments)
3. Acura TSX CU2 (730 fitments)
4. Honda S2000 (408 fitments)
5. VW GTI Mk7 (352 fitments)
6. VW Golf R Mk7 (333 fitments)
7. Honda Civic Si EM1 (266 fitments)
8. VW Golf R Mk8 (197 fitments)
9. Honda Civic Type R FL5 (183 fitments)
10. Acura Integra Type S (122 fitments)

---

*Report generated: January 21, 2026*
*Next audit recommended: February 2026*
