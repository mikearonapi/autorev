# AutoRev Data Gaps Analysis

> Comprehensive inventory of data coverage gaps and remediation priorities
>
> **Audit Date:** December 15, 2024  
> **Total Cars:** 98  
> **Total Tables:** 65 (51 populated, 14 empty)

---

## Executive Summary

| Priority | Gaps | Impact | Effort |
|----------|------|--------|--------|
| **P1 Critical** | 4 gaps | Feature-blocking | 2-4 weeks |
| **P2 Important** | 4 gaps | Feature degradation | 1-2 months |
| **P3 Nice-to-have** | 4 gaps | Minor enhancement | Ongoing |

**Overall Data Health Score: 6.3/10**

---

## 🚨 P1 — Critical Gaps (Feature Blocking)

### 1. Market Pricing — 10/98 cars (10.2%)

**Impact:** My Garage Value tab shows "No data" for 88 cars

| Stat | Value |
|------|-------|
| Cars with pricing | 10 |
| Cars missing pricing | 88 |
| Affected feature | My Garage → Value tab |
| User impact | Enthusiast tier value proposition degraded |

**Cars WITH Pricing (Current):**
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

**Remediation:**
1. Extend Cars.com scraper for all 24 brands
2. Run `scripts/batchEnrichAllMarketPricing.js`
3. Add weekly cron refresh

**Estimated Effort:** 3-5 days

---

### 2. Community Insights — 10/98 cars (10.2%)

**Impact:** AL `search_community_insights` returns empty for 88 cars

| Stat | Value |
|------|-------|
| Cars with insights | 10 (all Porsche) |
| Cars missing insights | 88 |
| Total insights | 1,226 |
| Affected feature | AL tool, car detail Community tab |

**Insight Distribution (Current):**
| Car | Insights |
|-----|----------|
| porsche-911-gt3-996 | 275 |
| 987-2-cayman-s | 197 |
| 718-cayman-gt4 | 172 |
| 997-2-carrera-s | 140 |
| 981-cayman-s | 107 |
| 991-1-carrera-s | 107 |
| porsche-911-gt3-997 | 61 |
| 718-cayman-gts-40 | 44 |
| Others (misc slugs) | 123 |

**Brands with ZERO Insights:**
- BMW (11 cars)
- Chevrolet (8 cars)
- Audi (8 cars)
- Ford (5 cars)
- Dodge (5 cars)
- Subaru (5 cars)
- Nissan (5 cars)
- Mercedes-AMG (5 cars)
- Mazda (5 cars)
- All others (31 cars)

**Remediation:**
1. Activate forum scrapers for BMW (Bimmerpost), VW (VWVortex), etc.
2. Run insight extraction on existing `forum_scraped_threads`
3. Fix slug mapping in extraction (some insights use non-canonical slugs)

**Estimated Effort:** 1-2 weeks

---

### 3. Events — 55 events (Expected: 500+)

**Impact:** Events pages show minimal content

| Stat | Value |
|------|-------|
| Current events | 55 |
| Documented expectation | 940 |
| Event sources configured | 13 |
| Event types used | 4 of 10 |

**Date Range:** December 2025 - October 2026

**Root Cause Analysis:**
- Possible data cleanup of past events
- Event source fetchers may be failing silently
- Documentation was optimistic/outdated

**Remediation:**
1. Audit `event_sources` table — check `is_active` and `last_run_at`
2. Run manual event ingestion: `node scripts/enrich-events-2026-from-sources.js`
3. Add monitoring for event count drops
4. Consider keeping historical events for reference

**Estimated Effort:** 2-3 days

---

### 4. Part Fitments — Placeholder Data for Most Cars

**Impact:** Parts search returns generic results, not car-specific

| Stat | Value |
|------|-------|
| Total fitments | 836 |
| Real fitments (VW) | 339 |
| Placeholder fitments | ~497 (~5 per car) |
| Affected feature | Tuning Shop parts search |

**Fitments by Brand:**
| Brand | Cars | Fitments | Avg/Car |
|-------|------|----------|---------|
| Volkswagen | 3 | 339 | 113 ✅ |
| Audi | 8 | 62 | 7.75 |
| BMW | 11 | 55 | 5 |
| Porsche | 11 | 55 | 5 |
| All others | 65 | 5 each | 5 (placeholder) |

**Remediation:**
1. Expand vendor adapters (Turner, Pelican, RockAuto)
2. Run `scripts/expandFitments.mjs` per brand
3. Add fitment verification workflow

**Estimated Effort:** 2-3 weeks

---

## ⚠️ P2 — Important Gaps (Feature Enhancement)

### 5. Dyno Data — 29 runs across 25 cars (25.5%)

| Stat | Value |
|------|-------|
| Cars with dyno data | 25 |
| Cars missing dyno data | 73 |
| Total dyno runs | 29 |
| Target | 200+ runs |

**Top Cars with Dyno Data:**
| Car | Runs |
|-----|------|
| Audi RS3 8V | 2 |
| BMW M3 F80 | 2 |
| VW GTI Mk7 | 2 |
| Audi RS3 8Y | 2 |
| 21 others | 1 each |

**High-HP Cars Missing Dyno Data (Top 10):**
| Car | HP |
|-----|-----|
| Dodge Charger Hellcat | 707 |
| Dodge Viper | 645 |
| Cadillac CTS-V Gen 3 | 640 |
| BMW M5 F90 Competition | 617 |
| Mercedes-AMG E63 S W213 | 603 |
| Mercedes-AMG E63 W212 | 577 |
| BMW M5 F10 Competition | 575 |
| Cadillac CTS-V Gen 2 | 556 |
| Jaguar F-Type R | 550 |
| Audi R8 V10 | 525 |

**Remediation:**
1. Mine YouTube dyno videos with GPT vision
2. Extract from forum posts during insight extraction
3. Add community submission form (Tuner tier)

---

### 6. Lap Times — 65 records across 27 cars (27.6%)

| Stat | Value |
|------|-------|
| Cars with lap times | 27 |
| Cars missing lap times | 71 |
| Total lap records | 65 |
| Target | 300+ records |

**Cars with Most Lap Times:**
| Car | Lap Times |
|-----|-----------|
| C8 Corvette Stingray | 8 |
| 718 Cayman GT4 | 5 |
| C7 Corvette Z06 | 4 |
| BMW M3 F80 | 3 |
| BMW M4 F82 | 3 |
| Shelby GT350 | 3 |
| Camaro ZL1 | 3 |
| Nissan GT-R | 3 |
| Audi RS3 8V | 3 |
| Alfa Romeo Giulia Quadrifoglio | 3 |

**Remediation:**
1. Scrape Fastestlaps.com for remaining cars
2. Extract from YouTube hot lap videos
3. Add track day result submission form

---

### 7. Recall Coverage — 469 records, 69/98 cars (70.4%)

| Stat | Value |
|------|-------|
| Cars with recalls | 69 |
| Cars with no recalls | 29 |
| Total recall campaigns | 469 |

**Note:** Some cars may legitimately have no recalls (e.g., newer models, small production runs)

**Top Recall Counts:**
| Car | Recalls |
|-----|---------|
| Dodge Charger SRT 392 | 37 |
| Dodge Challenger SRT 392 | 27 |
| Dodge Charger Hellcat | 23 |
| Volkswagen Golf R Mk7 | 21 |
| Mustang GT PP2 | 21 |
| Dodge Challenger Hellcat | 19 |
| Alfa Romeo Giulia Quadrifoglio | 17 |
| Subaru WRX STI GD | 14 |
| Subaru WRX STI GR/GV | 14 |

**Remediation:**
- Weekly NHTSA refresh already active
- Verify make/model matching in recall fetcher
- Some cars may correctly have 0 recalls

---

### 8. YouTube Coverage — 288 videos, 95/98 cars (96.9%)

| Stat | Value |
|------|-------|
| Cars with videos | 95 |
| Cars without videos | 3 |
| Total videos | 288 |
| Total car links | 291 |

**Cars Missing Videos:**
| Car | Brand |
|-----|-------|
| C8 Corvette Stingray | Chevrolet |
| Lexus LC 500 | Lexus |
| 718 Cayman GTS 4.0 | Porsche |

**Remediation:**
1. Manual video search for 3 missing cars
2. Expand channel list for broader coverage

---

## 📋 P3 — Nice-to-Have Gaps

### 9. Part Brands — 3 records

Only 3 brand records vs 642 parts. Brand metadata is minimal.

### 10. Track Venues — 21 venues

Limited track database. Consider expanding for better lap time context.

### 11. Document Chunks — 547 chunks

Knowledge base could be expanded with more guides and documentation.

### 12. Price History — 7 records

Historical price tracking is minimal. Needed for value trend analysis.

---

## 🔴 Empty Tables (14 total — Intentionally Future-Use)

These tables are empty by design, awaiting feature development:

| Table | Purpose | Priority |
|-------|---------|----------|
| `user_service_logs` | Maintenance history tracking | Future |
| `user_project_parts` | Build project part selections | Future |
| `user_compare_lists` | Saved car comparisons | Future |
| `car_auction_results` | BaT sale-by-sale data | P3 |
| `car_expert_reviews` | Written magazine reviews | P3 |
| `car_manual_data` | Manual spec overrides | Low |
| `track_layouts` | Track configurations | Low |
| `upgrade_key_parts` | Link upgrades to parts | P2 |
| `al_credit_purchases` | Payment records | Future |
| `event_saves` | User bookmarked events | Future |
| `event_submissions` | User submitted events | Future |
| `event_car_affinities` | Event-car links | P2 |
| `leads` | Contact submissions | Future |
| `car_variant_maintenance_overrides` | Variant-specific specs | Low |

---

## 📊 Cars with Worst Data Coverage

**Coverage Score = count of data types present (max 10)**

| Car | Brand | Score | Missing Data |
|-----|-------|-------|--------------|
| Lexus LC 500 | Lexus | 4/10 | Dyno, lap times, videos, issues, recalls, insights |
| Tesla Model 3 Performance | Tesla | 4/10 | Dyno, lap times, issues, recalls, insights |
| Toyota GR86 | Toyota | 4/10 | Dyno, lap times, issues, recalls, insights |
| Audi RS5 B8 | Audi | 4/10 | Dyno, lap times, recalls, insights |
| Audi TT RS 8J | Audi | 4/10 | Dyno, lap times, recalls, insights |
| Mercedes-AMG E63 S W213 | Mercedes-AMG | 4/10 | Dyno, lap times, issues, recalls, insights |
| Aston Martin V8 Vantage | Aston Martin | 5/10 | Dyno, lap times, recalls, insights |
| Audi R8 V10 | Audi | 5/10 | Dyno, lap times, recalls, insights |
| Audi R8 V8 | Audi | 5/10 | Dyno, lap times, recalls, insights |
| BMW 1 Series M Coupe | BMW | 5/10 | Dyno, lap times, recalls, insights |

---

## ✅ Cars with Best Data Coverage

| Car | Brand | Score | Strengths |
|-----|-------|-------|-----------|
| 718 Cayman GT4 | Porsche | 9/10 | Insights, lap times, videos, issues, recalls |
| Alfa Romeo Giulia Quadrifoglio | Alfa Romeo | 8/10 | Market pricing, lap times, recalls |
| Audi RS3 8V | Audi | 8/10 | Dyno, lap times, recalls, videos |
| BMW M2 Competition | BMW | 8/10 | Dyno, lap times, recalls, videos |
| BMW M3 F80 | BMW | 8/10 | Dyno, lap times, recalls, videos |
| BMW M4 F82 | BMW | 8/10 | Dyno, lap times, recalls, videos |
| C7 Corvette Grand Sport | Chevrolet | 8/10 | Dyno, lap times, issues, recalls |
| C7 Corvette Z06 | Chevrolet | 8/10 | Dyno, lap times, issues, recalls |
| Camaro SS 1LE | Chevrolet | 8/10 | Dyno, lap times, issues, recalls |
| Camaro ZL1 | Chevrolet | 8/10 | Dyno, lap times, issues, recalls |

---

## 🎯 Gap Closure Roadmap

### Week 1-2: P1 Critical
- [ ] Market pricing: Expand to 50% cars
- [ ] Events: Re-ingest to 300+ events
- [ ] Community insights: Activate BMW, VW forums

### Week 3-4: P1 Completion
- [ ] Market pricing: 100% coverage
- [ ] Part fitments: Real data for top 10 brands
- [ ] Community insights: 40% car coverage

### Month 2: P2 Enhancement
- [ ] Dyno data: 100+ runs
- [ ] Lap times: 150+ records
- [ ] Recall verification: Audit 29 cars with 0 recalls

### Month 3: Polish
- [ ] YouTube: 100% car coverage
- [ ] Community insights: 80% car coverage
- [ ] Part fitments: 3000+ verified fitments

---

## 📈 Tracking & Monitoring

### Weekly Audit Query
```sql
SELECT 
  'market_pricing' as gap, 
  COUNT(*) as cars_covered,
  98 - COUNT(*) as cars_missing
FROM car_market_pricing
UNION ALL
SELECT 'community_insights', COUNT(DISTINCT car_slug), 98 - COUNT(DISTINCT car_slug)
FROM community_insights WHERE car_slug IN (SELECT slug FROM cars)
UNION ALL
SELECT 'dyno_runs', COUNT(DISTINCT car_slug), 98 - COUNT(DISTINCT car_slug)
FROM car_dyno_runs
UNION ALL
SELECT 'lap_times', COUNT(DISTINCT car_slug), 98 - COUNT(DISTINCT car_slug)
FROM car_track_lap_times;
```

### Success Metrics
| Metric | Current | 30-day Target | 90-day Target |
|--------|---------|---------------|---------------|
| Average coverage score | 6.3/10 | 7.0/10 | 8.0/10 |
| Cars with score ≥8 | 16 | 40 | 70 |
| Cars with score ≤5 | 26 | 10 | 0 |

---

*Generated from `reports/DATA_COMPLETENESS_AUDIT_2024-12-15.md`*  
*See [DATA_PIPELINE.md](DATA_PIPELINE.md) for remediation strategies*




