# AutoRev Database Audit Report

> **Audit Date:** December 14, 2024 (Morning)  
> **Auditor:** AI-Assisted via MCP Supabase Connection  
> **Scope:** Schema completeness, data population, data quality, missing opportunities
>
> ⚠️ **SUPERSEDED:** This audit was conducted in the morning. See `DOCS_SYNC_REPORT_2024-12-14.md` for the evening sync which contains updated row counts after significant data expansion.

---

## Executive Summary

| Metric | Status | Score |
|--------|--------|-------|
| **Schema Completeness** | ⚠️ Minor Issues | B+ |
| **Data Population** | ⚠️ Significant Gaps | C |
| **Data Quality** | ✅ Excellent | A |
| **Foreign Key Integrity** | ✅ Perfect | A |
| **Index Coverage** | ✅ Good | A- |

### Critical Findings

1. **51 tables exist** (docs say 53) — 2 documented tables (`upgrade_education`, `car_known_issues`) don't exist as standalone tables
2. **Market pricing gap: 90% of cars missing** — Only 10/98 cars have `car_market_pricing` data
3. **Performance data gap: 95%+ missing** — Only 3 cars have dyno data, 5 have lap times
4. **Parts fitments VAG-biased** — Only 4 cars (all VW/Audi) have part fitments

---

## Phase 1: Schema Completeness Audit

### 1.1 Table Inventory

| Category | Documented | Actual | Status |
|----------|------------|--------|--------|
| Core Car Data | 15 | 14 | ⚠️ `car_known_issues` doesn't exist |
| Parts & Upgrades | 9 | 8 | ⚠️ `upgrade_education` doesn't exist |
| User Data | 9 | 9 | ✅ Match |
| Maintenance | 3 | 3 | ✅ Match |
| AL (AI) | 5 | 5 | ✅ Match |
| Knowledge Base | 2 | 2 | ✅ Match |
| YouTube | 4 | 4 | ✅ Match |
| Track Data | 2 | 2 | ✅ Match |
| System | 4 | 4 | ✅ Match |
| **Total** | **53** | **51** | ⚠️ |

#### Undocumented Tables Found

| Table | Rows | Purpose | Action |
|-------|------|---------|--------|
| `cars_stats` | 3 | Unknown - appears to be aggregation cache | Document or remove |

#### Documented But Missing Tables

| Table | Referenced In | Actual Implementation |
|-------|---------------|----------------------|
| `upgrade_education` | `lib/educationData.js` | Data comes from `data/upgradeEducation.js` static file |
| `car_known_issues` | `lib/alTools.js` | Uses `car_issues` or `vehicle_known_issues` tables instead |

**Recommendation:** Update DATABASE.md to remove `upgrade_education` and `car_known_issues`, or create these tables for consistency.

### 1.2 Column Verification (Priority Tables)

#### `cars` Table — ✅ 139 Columns Verified

All documented columns exist. Key columns confirmed:
- Core: `id`, `slug`, `name`, `years`, `brand`, `tier`, `category`
- Performance: `engine`, `hp`, `torque`, `trans`, `drivetrain`, `curb_weight`, `zero_to_sixty`
- Pricing: `price_avg`, `price_range`, `msrp_new_low`, `msrp_new_high`
- Scores: `score_sound`, `score_interior`, `score_track`, `score_reliability`, `score_value`, `score_driver_fun`, `score_aftermarket`
- AI: `embedding`, `search_vector`, `ai_searchable_text`

#### `part_relationships` Table — ⚠️ Documentation Mismatch

| Column | DATABASE.md Says | Actual |
|--------|------------------|--------|
| Part A FK | `part_id_a` | `part_id` ✅ |
| Part B FK | `part_id_b` | `related_part_id` ✅ |
| Relation type | `relationship_type` | `relation_type` ✅ |

**Fix Required:** Update DATABASE.md line ~157.

#### `document_chunks` Table — ⚠️ Documentation Mismatch

| Column | DATABASE.md Says | Actual |
|--------|------------------|--------|
| Document FK | `source_document_id` | `document_id` ✅ |

**Fix Required:** Update DATABASE.md line ~329.

#### Other Priority Tables — ✅ Verified

| Table | Status | Notes |
|-------|--------|-------|
| `car_variants` | ✅ | 7 columns, uses `car_id` FK (not `car_slug`) |
| `parts` | ✅ | All columns match |
| `part_fitments` | ✅ | All columns match |
| `al_conversations` | ✅ | All columns match |
| `al_messages` | ✅ | All columns match |
| `user_profiles` | ✅ | All columns match |
| `user_favorites` | ✅ | All columns match |

### 1.3 Foreign Key & Index Analysis

#### Foreign Keys — ✅ 64 FK Constraints Verified

All documented foreign keys exist. Key relationships:
- `cars.id` ← `car_variants.car_id`
- `cars.slug` ← `car_fuel_economy.car_slug`
- `parts.id` ← `part_fitments.part_id`
- `parts.id` ← `part_relationships.part_id`
- `source_documents.id` ← `document_chunks.document_id`

#### Orphan Records — ✅ None Found

| Check | Orphan Count |
|-------|--------------|
| part_fitments → missing car | 0 |
| part_fitments → missing part | 0 |
| youtube_video_car_links → missing car | 0 |
| youtube_video_car_links → missing video | 0 |

---

## Phase 2: Data Population Audit

### 2.1 Row Counts vs Expected

| Table | Documented | Actual | Coverage | Status |
|-------|------------|--------|----------|--------|
| **Core Car Data** |
| `cars` | 98 | 98 | 100% | ✅ |
| `car_variants` | 102 | 102 | 104% | ✅ |
| `car_fuel_economy` | 95 | 95 | 97% | ✅ |
| `car_safety_data` | 98 | 98 | 100% | ✅ |
| `car_issues` | 89 | 89 | 35%* | ⚠️ |
| `car_market_pricing` | 10 | 10 | **10%** | 🔴 |
| `car_market_pricing_years` | 23 | 23 | ~24% | ⚠️ |
| `car_price_history` | 7 | 7 | 7% | 🔴 |
| `car_dyno_runs` | 6 | 6 | **3%** | 🔴 |
| `car_track_lap_times` | 20 | 20 | **5%** | 🔴 |
| **Parts & Upgrades** |
| `parts` | 172 | 172 | - | ✅ |
| `part_fitments` | 271 | 271 | **4%** | 🔴 |
| `part_pricing_snapshots` | 173 | 172 | 100% | ✅ |
| `part_relationships` | 38 | 38 | - | ✅ |
| `upgrade_keys` | 49 | 49 | - | ✅ |
| `upgrade_packages` | 42 | 42 | - | ✅ |
| **Maintenance** |
| `vehicle_maintenance_specs` | 98 | 98 | 100% | ✅ |
| `vehicle_service_intervals` | 976 | 976 | 100% | ✅ |
| `vehicle_known_issues` | 89 | 89 | 35%* | ⚠️ |
| **Knowledge Base** |
| `source_documents` | 54 | 54 | - | ✅ |
| `document_chunks` | 547 | 547 | - | ✅ |
| **YouTube** |
| `youtube_videos` | 289 | 289 | - | ✅ |
| `youtube_video_car_links` | 292 | 292 | 98% | ✅ |
| `youtube_channels` | 12 | 12 | - | ✅ |
| **User Data** |
| `user_profiles` | 2 | 2 | - | ✅ |
| `user_favorites` | 3 | 3 | - | ✅ |
| `user_projects` | 4 | 4 | - | ✅ |

*Coverage calculated as: cars with data / total cars

### 2.2 Coverage Gaps (Critical)

#### Market Intelligence — 🔴 MAJOR GAP

| Car Tier | Total Cars | With Market Pricing | Coverage |
|----------|------------|---------------------|----------|
| premium | 15 | 0 | 0% |
| upper-mid | 20 | 0 | 0% |
| mid | 30 | 0 | 0% |
| budget | 33 | 10 | 30% |

**10 cars with market pricing (all Porsche/Acura/Alfa):**
- 718 Cayman GT4, 718 Cayman GTS 4.0, 981 Cayman GTS, 981 Cayman S
- 987.2 Cayman S, 991.1 Carrera S, 997.2 Carrera S
- Acura Integra Type R, Alfa Romeo 4C, Alfa Romeo Giulia Quadrifoglio

**Impact:** My Garage Value tab, AL market questions broken for 90% of cars.

#### Performance Data — 🔴 MAJOR GAP

**Dyno Runs (6 total, 3 cars):**
| Car | Dyno Runs |
|-----|-----------|
| Volkswagen GTI Mk7 | 2 |
| Audi RS3 8V | 2 |
| Audi RS3 8Y | 2 |

**Lap Times (20 total, 5 cars):**
| Car | Lap Times |
|-----|-----------|
| C8 Corvette Stingray | 8 |
| 718 Cayman GT4 | 5 |
| Audi RS3 8V | 3 |
| VW GTI Mk7 | 2 |
| Audi RS3 8Y | 2 |

**Impact:** Tuning Shop Dyno Database and Lap Times features are essentially empty.

#### Part Fitments — 🔴 MAJOR GAP (VAG-Biased)

**Only 4 cars have part fitments:**
| Car | Fitments | Parts Coverage |
|-----|----------|----------------|
| VW GTI Mk7 | 141 | 82% of parts |
| VW Golf R Mk7 | 104 | 60% of parts |
| Audi RS3 8V | 23 | 13% of parts |
| Audi RS3 8Y | 3 | 2% of parts |

**Impact:** Parts search returns 0 results for 94/98 cars (96%).

#### Known Issues — ⚠️ GAP

**34/98 cars have documented issues (35%).**

Cars with LOW reliability scores but NO documented issues:
- Maserati GranTurismo (reliability: 2.0) ❌
- Aston Martin V8 Vantage (reliability: 3.5) ❌
- Jaguar F-Type R (reliability: 4.0) ❌
- Alfa Romeo 4C (reliability: 5.5) ❌
- Nissan 300ZX Twin Turbo (reliability: 5.4) ❌

**Impact:** AL `get_known_issues` tool returns empty for 64 cars.

### 2.3 Empty Tables Assessment

| Table | Rows | Future Purpose | Priority |
|-------|------|----------------|----------|
| `car_expert_reviews` | 0 | Written magazine reviews (separate from YouTube) | P3 |
| `car_manual_data` | 0 | Manual spec overrides | P2 |
| `car_recalls` | 0 | NHTSA recall data by VIN | P1 |
| `car_auction_results` | 0 | Individual auction results | P2 |
| `track_layouts` | 0 | Track configuration variants | P3 |
| `upgrade_key_parts` | 0 | Link upgrade_keys to parts | P2 |
| `user_vehicles` | 0 | Collector tier owned vehicles | P2 |
| `user_service_logs` | 0 | Collector tier service tracking | P2 |
| `user_project_parts` | 0 | Tuner tier build details | P2 |
| `user_compare_lists` | 0 | Saved comparison lists | P3 |
| `user_activity` | 0 | Usage analytics | P3 |
| `car_variant_maintenance_overrides` | 0 | Variant-specific maintenance | P2 |
| `al_credit_purchases` | 0 | Payment integration | P2 |
| `leads` | 0 | Contact form submissions | P3 |

---

## Phase 3: Data Quality Audit

### 3.1 Cars Table Quality — Grade: A

#### Completeness Check (98 cars)

| Field | Populated | Missing | Quality |
|-------|-----------|---------|---------|
| hp | 98 | 0 | ✅ 100% |
| price_avg | 98 | 0 | ✅ 100% |
| image_hero_url | 98 | 0 | ✅ 100% |
| brand | 98 | 0 | ✅ 100% |
| drivetrain | 98 | 0 | ✅ 100% |
| zero_to_sixty | 98 | 0 | ✅ 100% |
| curb_weight | 98 | 0 | ✅ 100% |
| torque | 98 | 0 | ✅ 100% |
| pros (JSONB) | 98 | 0 | ✅ 100% |
| cons (JSONB) | 98 | 0 | ✅ 100% |

#### Score Ranges (All Valid 1-10)

| Score | Min | Max | Status |
|-------|-----|-----|--------|
| score_sound | 1.0 | 9.7 | ✅ Valid |
| score_interior | 3.2 | 9.5 | ✅ Valid |
| score_track | 4.8 | 9.5 | ✅ Valid |
| score_reliability | 2.0 | 10.0 | ✅ Valid |
| score_value | 2.5 | 10.0 | ✅ Valid |
| score_driver_fun | 5.5 | 9.8 | ✅ Valid |
| score_aftermarket | 3.8 | 9.9 | ✅ Valid |

**Note:** Tesla Model 3 Performance has `score_sound: 1.0` — intentional for EV.

#### Sample Quality Check (Random 10 Cars)

All sampled cars passed validation:
- ✅ HP > 0, realistic values (276-550)
- ✅ Price avg > 0, market-appropriate ($22,000-$67,500)
- ✅ Scores in 1-10 range
- ✅ Hero images present
- ✅ Pros/cons populated

### 3.2 Parts Catalog Quality — Grade: B+

#### Parts Table (172 parts)

| Field | Populated | Missing | Quality |
|-------|-----------|---------|---------|
| name | 172 | 0 | ✅ 100% |
| brand_name | 172 | 0 | ✅ 100% |
| category | 172 | 0 | ✅ 100% |
| part_number | 172 | 0 | ✅ 100% |
| quality_tier | 172 | 0 | ✅ 100% |
| description | 165 | 7 | ⚠️ 96% |
| is_active | 172 (all true) | 0 | ✅ 100% |

#### Parts by Category

| Category | Count | % of Catalog |
|----------|-------|--------------|
| wheels_tires | 48 | 28% |
| other | 43 | 25% |
| intake | 18 | 10% |
| fuel_system | 16 | 9% |
| tune | 16 | 9% |
| suspension | 9 | 5% |
| forced_induction | 9 | 5% |
| cooling | 7 | 4% |
| exhaust | 5 | 3% |
| brakes | 1 | 1% |

**Gap:** Only 1 brake part, 5 exhaust parts — common upgrade categories underrepresented.

#### Part Fitments (271 fitments)

| Field | Populated | Missing | Quality |
|-------|-----------|---------|---------|
| confidence | 271 | 0 | ✅ 100% |
| requires_tune | 210 | 61 | ⚠️ 77% |
| install_difficulty | 0 | 271 | 🔴 0% |
| verified | 10 | 261 | ⚠️ 4% |
| source_url | 271 | 0 | ✅ 100% |

**Critical Gap:** `install_difficulty` is completely unpopulated.

#### Part Pricing (172 snapshots)

| Metric | Value |
|--------|-------|
| Total snapshots | 172 |
| Unique parts with pricing | 172 |
| Freshness (within 30d) | 100% |
| Oldest snapshot | 2024-12-14 |
| Newest snapshot | 2024-12-14 |

**Note:** All pricing was captured today — initial seeding, no historical data yet.

### 3.3 Maintenance Data Quality — Grade: A

#### Vehicle Maintenance Specs (98 rows)

| Field | Populated | Missing | Quality |
|-------|-----------|---------|---------|
| oil_type | 97 | 1 | ✅ 99% |
| oil_viscosity | 97 | 1 | ✅ 99% |
| oil_capacity_liters | 97 | 1 | ✅ 99% |
| coolant_type | 98 | 0 | ✅ 100% |
| brake_fluid_type | 98 | 0 | ✅ 100% |
| tire_size_front | 98 | 0 | ✅ 100% |
| tire_pressure_front_psi | 98 | 0 | ✅ 100% |

#### Service Intervals (976 rows)

| Metric | Value |
|--------|-------|
| Cars with intervals | 98/98 (100%) |
| Avg intervals per car | 10 |
| Min intervals per car | 6 |
| Max intervals per car | 10 |

**Quality:** Excellent coverage and consistency.

### 3.4 Knowledge Base Quality — Grade: A

#### Document Chunks (547 chunks)

| Field | Populated | Missing | Quality |
|-------|-----------|---------|---------|
| embedding | 547 | 0 | ✅ 100% |
| chunk_text (>50 chars) | 547 | 0 | ✅ 100% |
| topic | 547 | 0 | ✅ 100% |
| car_slug (car-specific) | 513 | 34 | ✅ 94% |

#### Chunk Size Statistics

| Metric | Value |
|--------|-------|
| Average chunk length | 1,323 chars |
| Min chunk length | 210 chars |
| Max chunk length | 1,400 chars |

**Quality:** Consistent, well-sized chunks suitable for RAG.

### 3.5 YouTube Data Quality — Grade: A-

#### Videos (289 total)

| Field | Populated | Missing | Quality |
|-------|-----------|---------|---------|
| summary | 283 | 6 | ✅ 98% |
| one_line_take | 283 | 6 | ✅ 98% |
| pros_mentioned | 278 | 11 | ✅ 96% |
| cons_mentioned | 277 | 12 | ✅ 96% |
| notable_quotes | 278 | 11 | ✅ 96% |
| key_points | 2 | 287 | 🔴 1% |

**Gap:** `key_points` field is almost completely empty — may be unused or deprecated.

#### Video-Car Links (292 links)

| Metric | Value |
|--------|-------|
| Cars with videos | 96/98 (98%) |
| Average videos per car | 3.0 |
| Cars without videos | 2 (likely new additions) |

---

## Phase 4: Missing Data Opportunities

### 4.1 Market Intelligence Gaps — HIGH PRIORITY

| Gap | Impact | Data Source | Effort |
|-----|--------|-------------|--------|
| 88 cars missing market pricing | My Garage Value broken | BaT, Cars.com, Hagerty scrapers | Medium |
| 91 cars missing price history | Price trends unavailable | Historical scrape accumulation | Low (time) |
| 0 auction results | No sale-by-sale analysis | BaT API/scraper | Medium |

**Recommended Action:** Run market pricing scrapers for remaining cars. Priority order:
1. Premium tier (15 cars) — highest user interest
2. Upper-mid tier (20 cars)
3. Mid tier (30 cars)
4. Budget tier (23 remaining)

### 4.2 Performance Data Gaps — HIGH PRIORITY

| Gap | Impact | Data Source | Effort |
|-----|--------|-------------|--------|
| 95 cars missing dyno data | Tuning Shop empty | Community dyno databases, YouTube | High |
| 93 cars missing lap times | Track comparison broken | Fastestlaps.com, YouTube, forums | High |

**Recommended Action:** 
- Prioritize cars with high `score_track` for lap time data
- Prioritize cars with high `score_aftermarket` for dyno data

### 4.3 Parts Catalog Gaps — HIGH PRIORITY

| Gap | Impact | Data Source | Effort |
|-----|--------|-------------|--------|
| 94 cars with no fitments | Parts search useless | Vendor API integration | High |
| VAG-only bias | Non-VW/Audi users excluded | Multi-vendor ingestion | Medium |
| 1 brake part | Common category missing | Vendor catalogs | Medium |
| 5 exhaust parts | Common category missing | Vendor catalogs | Medium |
| 0 install_difficulty values | Missing UX data | Manual research | Medium |

**Recommended Action:**
1. Ingest from non-VAG vendors (e.g., FCP Euro, Z1 Motorsports, MAP)
2. Prioritize popular cars: BMW M3/M4, Porsche 911/Cayman, Mustang, Corvette

### 4.4 Known Issues Gaps — MEDIUM PRIORITY

| Gap | Impact | Data Source | Effort |
|-----|--------|-------------|--------|
| 64 cars missing issues | AL incomplete | Forums, CarComplaints.com | Medium |
| Low-reliability cars with no issues | User safety | NHTSA, owner forums | High |

**Priority Cars for Issue Documentation:**
1. Maserati GranTurismo (reliability: 2.0)
2. Aston Martin V8 Vantage (reliability: 3.5)
3. Jaguar F-Type R (reliability: 4.0)
4. Alfa Romeo 4C (reliability: 5.5)

### 4.5 AL Enhancement Opportunities

| Gap | Impact | Data Source | Effort |
|-----|--------|-------------|--------|
| Recall data empty | VIN-specific alerts missing | NHTSA API | Low |
| `search_forums` placeholder | Real forum search unavailable | Exa API integration | Medium |
| Limited dyno/lap context | Track advice incomplete | Community data | High |

---

## Phase 5: Recommendations

### P0 — Critical (Blocking Features)

| ID | Issue | Fix | Effort |
|----|-------|-----|--------|
| P0-001 | DATABASE.md `part_relationships` columns wrong | Update docs: `part_id`/`related_part_id`/`relation_type` | 5 min |
| P0-002 | DATABASE.md `document_chunks` column wrong | Update docs: `document_id` | 5 min |
| P0-003 | API.md says `/api/parts/relationships` is GET | Update docs: it's POST | 5 min |

### P1 — High Priority (Significant User Impact)

| ID | Issue | Fix | Effort |
|----|-------|-----|--------|
| P1-001 | 88 cars missing market pricing | Run scrapers for all tiers | 4-8 hours |
| P1-002 | 94 cars missing part fitments | Ingest from additional vendors | 8-16 hours |
| P1-003 | 64 cars missing known issues | Manual research + AI assist | 4-8 hours |
| P1-004 | `install_difficulty` completely empty | Populate for 271 fitments | 2-4 hours |
| P1-005 | Dyno/lap times severely limited | Source from fastestlaps.com, forums | 8-16 hours |
| P1-006 | Remove/document `upgrade_education` table reference | Update DATABASE.md | 15 min |
| P1-007 | Remove/document `car_known_issues` table reference | Update DATABASE.md | 15 min |

### P2 — Medium Priority (Incremental Improvement)

| ID | Issue | Fix | Effort |
|----|-------|-----|--------|
| P2-001 | `youtube_videos.key_points` 99% empty | Either populate or remove field | 1 hour |
| P2-002 | `cars_stats` undocumented | Document purpose or remove | 30 min |
| P2-003 | `requires_tune` 23% empty in fitments | Populate missing values | 2 hours |
| P2-004 | Only 10 verified fitments (4%) | Increase verification rate | 4 hours |
| P2-005 | Brake/exhaust parts underrepresented | Add more parts | 2 hours |
| P2-006 | 3 cars missing fuel economy | Add data for Viper, Emira, GR86 | 1 hour |

### P3 — Low Priority (Future Enhancement)

| ID | Issue | Fix | Effort |
|----|-------|-----|--------|
| P3-001 | Empty `car_recalls` table | Integrate NHTSA recall API | 4 hours |
| P3-002 | Empty `car_auction_results` | Build BaT result scraper | 8 hours |
| P3-003 | Empty `track_layouts` | Add layout variants | 2 hours |
| P3-004 | Empty user feature tables | Will populate with usage | N/A |

---

## SQL Migrations Needed

### Fix Documentation (No SQL needed)

Update `docs/DATABASE.md`:

```markdown
### `part_relationships` — Compatibility
| **Key Fields** | `part_id`, `related_part_id`, `relation_type`, `reason` |

### `document_chunks` — Vector embeddings  
| **Key Fields** | `document_id`, `chunk_index`, `chunk_text`, `embedding`, `topic` |
```

Remove references to:
- `upgrade_education` (data is in static file)
- `car_known_issues` (use `car_issues` instead)

### Add Missing Data (Sample Scripts)

```sql
-- Populate install_difficulty for existing fitments
UPDATE part_fitments 
SET install_difficulty = CASE 
  WHEN category IN ('tune', 'other') THEN 'easy'
  WHEN category IN ('intake', 'exhaust') THEN 'moderate'
  WHEN category IN ('suspension', 'brakes', 'forced_induction') THEN 'difficult'
  ELSE 'moderate'
END
FROM parts 
WHERE parts.id = part_fitments.part_id
  AND part_fitments.install_difficulty IS NULL;
```

---

## Data Coverage Heat Map

```
                        fuel  safety  market  maint  issues  youtube  dyno  laps  parts
                        econ  data    price   specs                               fitment
                        ----  ------  ------  -----  ------  -------  ----  ----  -------
Premium (15 cars)       93%   100%    0%      100%   40%     93%      0%    7%    0%
Upper-Mid (20 cars)     95%   100%    0%      100%   35%     100%     0%    0%    0%
Mid (30 cars)           97%   100%    0%      100%   33%     100%     0%    0%    0%
Budget (33 cars)        97%   100%    30%     100%   36%     97%      9%    12%   12%
                        ----  ------  ------  -----  ------  -------  ----  ----  -------
Overall (98 cars)       97%   100%    10%     100%   35%     98%      3%    5%    4%
```

**Legend:** 🟢 >80% | 🟡 50-80% | 🔴 <50%

---

## Conclusion

AutoRev's database has **excellent data quality** for populated tables, but **significant coverage gaps** in:

1. **Market Intelligence** — 90% of cars missing pricing data
2. **Performance Data** — 95%+ missing dyno/lap time data  
3. **Parts Catalog** — 96% of cars have no fitment data

The core `cars` table is complete and well-maintained. Maintenance specs are comprehensive. YouTube integration is strong. Knowledge base is healthy.

**Immediate Priority:** Expand market pricing and parts fitments to all cars to make key features functional.

---

*Generated by AI audit on 2024-12-14. Verify findings before making changes.*
