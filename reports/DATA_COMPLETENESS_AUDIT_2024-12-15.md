# AutoRev Data Completeness Audit

**Generated:** December 15, 2024  
**Total Tables:** 65  
**Total Cars:** 98

---

## Executive Summary

| Metric | Status | Details |
|--------|--------|---------|
| **Tables Populated** | 51/65 (78%) | 14 intentionally empty (future-use) |
| **Core Car Coverage** | ✅ 100% | Fuel economy, safety, maintenance specs |
| **Critical Gap** | ❌ Market Pricing | Only 10/98 cars (10.2%) |
| **Performance Data** | ⚠️ ~32% | 31 cars have dyno OR lap times |
| **Community Insights** | ⚠️ 10 cars | 1,226 insights but only for Porsche |
| **YouTube Coverage** | ✅ 97% | 95/98 cars have video reviews |

---

## 📊 Table-by-Table Summary

### Core Car Data (16 tables)

| Table | Rows | Expected | Coverage | Priority |
|-------|------|----------|----------|----------|
| `cars` | 98 | 98 | ✅ 100% | — |
| `car_variants` | 102 | ~100 | ✅ 100% | — |
| `car_fuel_economy` | 98 | 98 | ✅ 100% | — |
| `car_safety_data` | 98 | 98 | ✅ 100% | — |
| `car_issues` | 1,201 | — | ✅ Active | — |
| `car_recalls` | 469 | — | ✅ 70.4% cars | P2 |
| `car_market_pricing` | 10 | 98 | ❌ **10.2%** | **P1** |
| `car_market_pricing_years` | 23 | — | ⚠️ Low | P1 |
| `car_price_history` | 7 | — | ⚠️ Low | P3 |
| `car_dyno_runs` | 29 | 200+ | ⚠️ 25.5% | P2 |
| `car_track_lap_times` | 65 | 300+ | ⚠️ 21.7% | P2 |
| `car_slug_aliases` | 23 | — | ✅ Active | — |
| `car_expert_reviews` | 0 | — | ⬜ Future | P3 |
| `car_manual_data` | 0 | — | ⬜ Future | — |
| `car_auction_results` | 0 | — | ⬜ Future | P3 |

### Maintenance (3 tables)

| Table | Rows | Expected | Coverage | Priority |
|-------|------|----------|----------|----------|
| `vehicle_maintenance_specs` | 98 | 98 | ✅ 100% | — |
| `vehicle_service_intervals` | 976 | ~980 | ✅ ~10/car | — |
| `vehicle_known_issues` | 89 | — | ⚠️ Active | — |

### Parts & Upgrades (8 tables)

| Table | Rows | Expected | Coverage | Priority |
|-------|------|----------|----------|----------|
| `parts` | 642 | 1000+ | ⚠️ Active | P1 |
| `part_fitments` | 836 | 3000+ | ⚠️ ~15% | **P1** |
| `part_pricing_snapshots` | 172 | — | ⚠️ Low | P2 |
| `part_relationships` | 38 | — | ⚠️ Active | P2 |
| `part_brands` | 3 | 50+ | ⚠️ Low | P2 |
| `upgrade_keys` | 49 | 49 | ✅ 100% | — |
| `upgrade_packages` | 42 | 42 | ✅ 100% | — |
| `upgrade_key_parts` | 0 | — | ⬜ Future | P3 |

### YouTube (4 tables)

| Table | Rows | Expected | Coverage | Priority |
|-------|------|----------|----------|----------|
| `youtube_videos` | 288 | 500+ | ⚠️ 58% | P3 |
| `youtube_video_car_links` | 291 | 500+ | ✅ 97% cars | P3 |
| `youtube_channels` | 12 | 20+ | ⚠️ Active | P3 |
| `youtube_ingestion_queue` | 2 | — | ✅ Active | — |

### Forum Intelligence (5 tables)

| Table | Rows | Expected | Coverage | Priority |
|-------|------|----------|----------|----------|
| `community_insights` | 1,226 | 5000+ | ⚠️ 10 cars | **P1** |
| `community_insight_sources` | 1,226 | — | ✅ Active | — |
| `forum_sources` | 14 | 14 | ✅ 100% | — |
| `forum_scrape_runs` | 10 | — | ✅ Active | — |
| `forum_scraped_threads` | 175 | — | ✅ Active | — |

### Knowledge Base (2 tables)

| Table | Rows | Expected | Coverage | Priority |
|-------|------|----------|----------|----------|
| `source_documents` | 54 | 100+ | ⚠️ Active | P3 |
| `document_chunks` | 547 | 1000+ | ⚠️ Active | P3 |

### Events (6 tables)

| Table | Rows | Expected | Coverage | Priority |
|-------|------|----------|----------|----------|
| `events` | 55 | 940 | ⚠️ **Discrepancy** | **P1** |
| `event_types` | 10 | 10 | ✅ 100% | — |
| `event_car_affinities` | 0 | 50+ | ⬜ Empty | P2 |
| `event_sources` | 13 | 13 | ✅ 100% | — |
| `event_saves` | 0 | — | ⬜ User data | — |
| `event_submissions` | 0 | — | ⬜ User data | — |

### Track Data (2 tables)

| Table | Rows | Expected | Coverage | Priority |
|-------|------|----------|----------|----------|
| `track_venues` | 21 | 50+ | ⚠️ Active | P2 |
| `track_layouts` | 0 | — | ⬜ Future | P3 |

### AL/AI (5 tables)

| Table | Rows | Expected | Coverage | Priority |
|-------|------|----------|----------|----------|
| `al_conversations` | 7 | — | ✅ Active | — |
| `al_messages` | 33 | — | ✅ Active | — |
| `al_user_credits` | 2 | — | ✅ Active | — |
| `al_usage_logs` | 3 | — | ✅ Active | — |
| `al_credit_purchases` | 0 | — | ⬜ Future | — |

### User Data (9 tables)

| Table | Rows | Expected | Coverage | Priority |
|-------|------|----------|----------|----------|
| `user_profiles` | 2 | — | ✅ Active | — |
| `user_favorites` | 10 | — | ✅ Active | — |
| `user_projects` | 4 | — | ✅ Active | — |
| `user_vehicles` | 4 | — | ✅ Active | — |
| `user_feedback` | 2 | — | ✅ Active | — |
| `user_service_logs` | 0 | — | ⬜ Future | — |
| `user_project_parts` | 0 | — | ⬜ Future | — |
| `user_compare_lists` | 0 | — | ⬜ Future | — |

### System (5 tables)

| Table | Rows | Expected | Coverage | Priority |
|-------|------|----------|----------|----------|
| `scrape_jobs` | 124 | — | ✅ Active | — |
| `fitment_tag_mappings` | 124 | — | ✅ Active | — |
| `leads` | 0 | — | ⬜ Future | — |
| `car_variant_maintenance_overrides` | 0 | — | ⬜ Future | — |

---

## 🚨 Critical Issues Found

### 1. Documentation vs Reality Discrepancy: Events Table
- **Docs say:** 940 events
- **Actual:** 55 events
- **Action:** Investigate data loss or verify docs are stale

### 2. Community Insights Concentrated on Porsche Only
- 1,226 insights exist but only for **10 Porsche models**
- **88 cars have ZERO community insights**
- **Action:** Expand forum scraping to other brands

### 3. Market Pricing Critically Low
- Only **10/98 cars** have market pricing (10.2%)
- All 10 are Porsche models + 3 Alfa Romeo variants
- **88 cars missing** market data for My Garage Value tab

---

## 🏆 Top 10 Cars with BEST Data Coverage

| Car | Brand | Score | Details |
|-----|-------|-------|---------|
| 718 Cayman GT4 | Porsche | 9/10 | Missing: market pricing |
| Alfa Romeo Giulia Quadrifoglio | Alfa Romeo | 8/10 | Has lap times, issues, recalls |
| Audi RS3 8V | Audi | 8/10 | Has dyno + lap times |
| BMW M2 Competition | BMW | 8/10 | Has dyno + lap times |
| BMW M3 F80 | BMW | 8/10 | Has dyno + lap times |
| BMW M4 F82 | BMW | 8/10 | Has dyno + lap times |
| C7 Corvette Grand Sport | Chevrolet | 8/10 | Has dyno + lap times |
| C7 Corvette Z06 | Chevrolet | 8/10 | Has dyno + lap times |
| Camaro SS 1LE | Chevrolet | 8/10 | Has dyno + lap times |
| Camaro ZL1 | Chevrolet | 8/10 | Has dyno + lap times |

---

## ❌ Top 10 Cars with WORST Data Coverage

| Car | Brand | Score | Missing |
|-----|-------|-------|---------|
| Lexus LC 500 | Lexus | 4/10 | Dyno, lap times, videos, issues, recalls, insights |
| Tesla Model 3 Performance | Tesla | 4/10 | Dyno, lap times, issues, recalls, insights |
| Toyota GR86 | Toyota | 4/10 | Dyno, lap times, issues, recalls, insights |
| Audi RS5 B8 | Audi | 4/10 | Dyno, lap times, issues, recalls, insights |
| Audi TT RS 8J | Audi | 4/10 | Dyno, lap times, recalls, insights |
| Mercedes-AMG E63 S W213 | Mercedes-AMG | 4/10 | Dyno, lap times, issues, recalls, insights |
| Aston Martin V8 Vantage | Aston Martin | 5/10 | Dyno, lap times, recalls, insights |
| Audi R8 V10 | Audi | 5/10 | Dyno, lap times, recalls, insights |
| Audi R8 V8 | Audi | 5/10 | Dyno, lap times, recalls, insights |
| BMW 1 Series M Coupe | BMW | 5/10 | Dyno, lap times, recalls, insights |

---

## 📈 Part Fitments by Brand

| Brand | Cars | Cars w/ Fitments | Total Fitments | Coverage |
|-------|------|------------------|----------------|----------|
| Volkswagen | 3 | 3 | 339 | ✅ Excellent |
| Audi | 8 | 8 | 62 | ⚠️ Basic |
| BMW | 11 | 11 | 55 | ⚠️ Basic |
| Porsche | 11 | 11 | 55 | ⚠️ Basic |
| All Others | 65 | 65 | ~5 each | ⚠️ Minimal |

> **Note:** Most cars have exactly 5 fitments (placeholder data). Only VW has real fitment coverage.

---

## 🚗 Cars Missing Market Pricing (88 total)

All 88 non-covered cars are missing from `car_market_pricing`. The 10 WITH pricing:

| Car | Brand | Cars.com Avg |
|-----|-------|--------------|
| 718 Cayman GT4 | Porsche | $168,225 |
| 718 Cayman GTS 4.0 | Porsche | $109,241 |
| Acura Integra Type R | Acura | $89,209 |
| 991.1 Carrera S | Porsche | $84,082 |
| 997.2 Carrera S | Porsche | $74,976 |
| 981 Cayman GTS | Porsche | $70,412 |
| 981 Cayman S | Porsche | $61,132 |
| 987.2 Cayman S | Porsche | $52,698 |
| Alfa Romeo 4C | Alfa Romeo | $41,344 |
| Alfa Romeo Giulia Quadrifoglio | Alfa Romeo | $40,401 |

---

## 🎯 Cars Missing BOTH Dyno AND Lap Times (67 total)

Top 10 by HP (highest priority for performance data):

| Car | Brand | HP |
|-----|-------|-----|
| Dodge Charger Hellcat | Dodge | 707 |
| Dodge Viper | Dodge | 645 |
| Cadillac CTS-V Gen 3 | Cadillac | 640 |
| BMW M5 F90 Competition | BMW | 617 |
| Mercedes-AMG E63 S W213 | Mercedes-AMG | 603 |
| Mercedes-AMG E63 W212 | Mercedes-AMG | 577 |
| BMW M5 F10 Competition | BMW | 575 |
| Cadillac CTS-V Gen 2 | Cadillac | 556 |
| Jaguar F-Type R | Jaguar | 550 |
| Audi R8 V10 | Audi | 525 |

---

## 📋 Empty Tables Summary (14 tables - Intentionally Future-Use)

| Table | Category | Intended Purpose |
|-------|----------|------------------|
| `al_credit_purchases` | AL/AI | Payment integration |
| `car_auction_results` | Car Data | BaT sale-by-sale data |
| `car_expert_reviews` | Car Data | Written magazine reviews |
| `car_manual_data` | Car Data | Manual spec overrides |
| `car_variant_maintenance_overrides` | Maintenance | Variant-specific specs |
| `event_car_affinities` | Events | Event-car brand links |
| `event_saves` | Events | User bookmarked events |
| `event_submissions` | Events | User submitted events |
| `leads` | System | Contact form submissions |
| `track_layouts` | Track | Multiple track configs |
| `upgrade_key_parts` | Parts | Link upgrades to parts |
| `user_compare_lists` | User | Saved comparisons |
| `user_project_parts` | User | Build project parts |
| `user_service_logs` | User | Maintenance history |

---

## 🎯 Recommended Action Items

### P1 - Critical (Feature Blocking)

1. **Market Pricing Expansion** - 88 cars need pricing
   - Expand BaT/Cars.com scrapers
   - Estimated effort: 2-3 days

2. **Part Fitments Expansion** - Most cars have only 5 placeholder fitments
   - VW is the only brand with real fitment data
   - Estimated effort: 1-2 weeks

3. **Events Data Investigation** - Docs claim 940, DB has 55
   - Verify if data was lost or docs are stale
   - Estimated effort: 1 day

4. **Community Insights Expansion** - Only Porsche has insights
   - Expand forum scraping to BMW, Subaru, Nissan, etc.
   - Estimated effort: 1 week

### P2 - Important (Feature Enhancement)

1. **Dyno Data Expansion** - Currently 29 runs for 25 cars
   - Target: 200+ runs covering 50+ cars
   - Sources: Community submissions, forum extraction

2. **Lap Times Expansion** - Currently 65 records
   - Target: 300+ records
   - Sources: Fastestlaps.com, community data

3. **Recall Coverage** - 69/98 cars (70.4%)
   - 29 cars have no recall data (may be correct if no recalls exist)

### P3 - Nice to Have

1. YouTube video expansion (288 → 500+)
2. Track venues expansion (21 → 50+)
3. Document chunks expansion (547 → 1000+)

---

## 📊 Coverage Score Distribution

| Score | Cars | Percentage |
|-------|------|------------|
| 9/10 | 1 | 1.0% |
| 8/10 | 15 | 15.3% |
| 7/10 | 26 | 26.5% |
| 6/10 | 30 | 30.6% |
| 5/10 | 20 | 20.4% |
| 4/10 | 6 | 6.1% |

**Average coverage score:** 6.3/10

---

*Report generated by AutoRev data audit script*
