# 🚀 AutoRev Database Enrichment Roadmap

> **Goal**: Close data gaps to make AL the most knowledgeable automotive AI assistant
> **Generated**: December 23, 2024
> **Current State**: 188 cars, 7,191 knowledge chunks, significant gaps identified

---

## 📊 Executive Summary

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Market Pricing | 5% | 80% | 178 cars |
| Track Lap Times | 16% | 60% | 158 cars |
| Community Insights | 8.5% | 50% | 172 cars |
| Service Costs | 7% | 50% | 174 cars |
| Insurance Data | 5% | 50% | 178 cars |
| Dyno Data | 13% | 40% | 163 cars |

---

## 🔴 PHASE 1: Quick Wins (Week 1-2)
*High impact, automated or semi-automated*

### 1.1 Market Pricing Enrichment
**Priority**: 🔴 CRITICAL | **Coverage**: 5% → 80% | **Impact**: High

| Task | Source | Method | Est. Time |
|------|--------|--------|-----------|
| Scrape BringATrailer sold prices | BaT API/Scrape | Script | 4 hours |
| Fetch Cars.com listing averages | Cars.com | API | 2 hours |
| Add Hagerty valuation data | Hagerty | Manual/API | 4 hours |
| Calculate consensus pricing | All sources | Script | 2 hours |

**Script to create**: `scripts/enrich-market-pricing.js`

**Data to populate**:
```sql
-- car_market_pricing table
bat_avg_price, bat_median_price, bat_sample_size
carscom_avg_price, carscom_listing_count
hagerty_excellent, hagerty_good, hagerty_fair
consensus_price, market_trend
```

---

### 1.2 Track Lap Time Data
**Priority**: 🔴 HIGH | **Coverage**: 16% → 60% | **Impact**: High

| Task | Source | Method | Est. Time |
|------|--------|--------|-----------|
| Import FastestLaps.com data | FastestLaps | Scrape | 4 hours |
| Add Car and Driver test data | C&D archives | Manual | 6 hours |
| Import Motor Trend test data | MT archives | Manual | 4 hours |
| Normalize track names | Internal | Script | 2 hours |

**Key tracks to prioritize**:
- Nürburgring Nordschleife
- Laguna Seca
- VIR Full Course
- Road Atlanta
- Willow Springs

**Data to populate**:
```sql
-- car_track_lap_times table
lap_time_ms, track_id, is_stock, tires, conditions
```

---

### 1.3 YouTube Video Gap Closure
**Priority**: 🔴 HIGH | **Coverage**: 78% → 95% | **Impact**: Medium

| Brand | Current | Missing Videos | Action |
|-------|---------|----------------|--------|
| Ferrari | 60% | 4 cars | Queue reviews |
| McLaren | 14% | 6 cars | Queue reviews |
| Lamborghini | 25% | 6 cars | Queue reviews |
| Aston Martin | 33% | 4 cars | Queue reviews |

**Script**: `scripts/youtube-queue-missing-cars.js`

---

## 🟡 PHASE 2: Deep Enrichment (Week 3-4)
*Moderate effort, high value*

### 2.1 Forum Scraping Expansion
**Priority**: 🟡 HIGH | **Coverage**: 8.5% → 50% | **Impact**: Very High

| Forum | Cars Covered | Current Insights | Action |
|-------|--------------|------------------|--------|
| CorvetteForum | 6 Corvettes | 0 | Activate scraper |
| My350Z/370Z | 4 Nissans | 0 | Activate scraper |
| S2Ki | 4 Hondas | 0 | Activate scraper |
| MBWorld | 5 Mercedes | 0 | Activate scraper |
| MustangForums | 3 Mustangs | 0 | Add source |
| CamaroForums | 2 Camaros | 0 | Add source |
| FerrariChat | 10 Ferraris | 0 | Add source |
| Lamborghini-Talk | 8 Lambos | 0 | Add source |
| McLarenLife | 7 McLarens | 0 | Add source |

**Insights to extract**:
- Common issues by mileage
- Maintenance tips
- Modification guides
- Cost experiences
- Reliability reports

---

### 2.2 Service Cost Data
**Priority**: 🟡 HIGH | **Coverage**: 7% → 50% | **Impact**: High

| Service Milestone | Data Points |
|-------------------|-------------|
| 15K service | Labor hours, parts cost, dealer vs indie |
| 30K service | Same + common add-ons |
| 60K major service | Timing belt/chain, spark plugs |
| 100K service | Major overhaul items |
| Clutch replacement | Manual cars only |
| Brake job | Pads + rotors all corners |

**Sources**:
- RepairPal API
- YourMechanic
- Forum-extracted costs
- Dealer service menus

**Script to create**: `scripts/enrich-service-costs.js`

---

### 2.3 Lateral G & Braking Data
**Priority**: 🟡 MEDIUM | **Coverage**: 52% → 85% | **Impact**: Medium

| Task | Source | Method |
|------|--------|--------|
| Import Car and Driver instrumented tests | C&D | Manual |
| Import Motor Trend test data | MT | Manual |
| Cross-reference with manufacturer specs | OEM | Research |

**Data to populate**:
```sql
-- cars table
lateral_g, braking_60_0
```

---

## 🟢 PHASE 3: Comprehensive Coverage (Week 5-6)
*Broader coverage, systematic approach*

### 3.1 Insurance & Ownership Cost Data
**Priority**: 🟢 MEDIUM | **Coverage**: 5% → 50% | **Impact**: Medium

| Task | Method | Est. Time |
|------|--------|-----------|
| Research insurance group ratings | Manual | 8 hours |
| Calculate relative insurance indexes | Script | 2 hours |
| Add warranty coverage details | Manual | 4 hours |
| Compile annual ownership estimates | Script | 4 hours |

**New fields to populate**:
```sql
-- cars table
insurance_cost_index ('low', 'moderate', 'high', 'very-high')
insurance_notes (specific considerations)

-- Consider new table: car_ownership_costs
annual_insurance_estimate
annual_maintenance_estimate  
annual_fuel_estimate
5_year_depreciation_estimate
```

---

### 3.2 Comparison Data Enhancement
**Priority**: 🟢 MEDIUM | **Coverage**: 55% → 90% | **Impact**: High

| Task | Method |
|------|--------|
| Complete direct_competitors for all cars | AI-assisted |
| Add if_you_want_more alternatives | AI-assisted |
| Add similar_driving_experience links | AI-assisted |
| Create comparison scoring matrix | Script |

---

### 3.3 Dyno Baseline Data
**Priority**: 🟢 MEDIUM | **Coverage**: 13% → 40% | **Impact**: Medium

| Source | Type | Method |
|--------|------|--------|
| DynoJet results database | Stock runs | Research |
| YouTube dyno videos | Extracted data | Manual |
| Forum dyno threads | Community data | Scrape |

**Data to populate**:
```sql
-- car_dyno_runs table
peak_whp, peak_wtq, dyno_type, is_wheel, run_kind='baseline'
```

---

## 🔵 PHASE 4: New Data Categories (Week 7-8)
*Strategic additions for AL capabilities*

### 4.1 Depreciation Curves (NEW TABLE)
**Priority**: 🔵 STRATEGIC | **Impact**: High

```sql
CREATE TABLE car_depreciation_curves (
  id UUID PRIMARY KEY,
  car_slug TEXT REFERENCES cars(slug),
  year_offset INTEGER, -- 0, 1, 2, 3... years from purchase
  value_retention_pct NUMERIC, -- e.g., 85.0 = 85% of original
  source TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Use case**: "How much will a 3-year-old GT4 depreciate in the next 2 years?"

---

### 4.2 Tuner/Shop Directory (NEW TABLE)
**Priority**: 🔵 STRATEGIC | **Impact**: Medium

```sql
CREATE TABLE tuner_shops (
  id UUID PRIMARY KEY,
  name TEXT,
  slug TEXT UNIQUE,
  location_city TEXT,
  location_state TEXT,
  location_country TEXT DEFAULT 'USA',
  latitude NUMERIC,
  longitude NUMERIC,
  specialties TEXT[], -- e.g., {'Porsche', 'BMW', 'JDM'}
  services TEXT[], -- e.g., {'tuning', 'track_prep', 'engine_building'}
  website TEXT,
  phone TEXT,
  reputation_score NUMERIC, -- 1-10
  review_count INTEGER,
  price_tier TEXT, -- 'budget', 'mid', 'premium'
  certifications TEXT[],
  notable_builds TEXT,
  source_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Use case**: "Who's a good Porsche shop near Atlanta?"

---

### 4.3 Financing Data (NEW TABLE)
**Priority**: 🔵 LOW | **Impact**: Low-Medium

```sql
CREATE TABLE car_financing_profiles (
  id UUID PRIMARY KEY,
  car_slug TEXT REFERENCES cars(slug),
  typical_apr_excellent NUMERIC, -- 720+ credit
  typical_apr_good NUMERIC, -- 680-719
  typical_apr_fair NUMERIC, -- 620-679
  typical_term_months INTEGER[],
  down_payment_typical_pct NUMERIC,
  financing_difficulty TEXT, -- 'easy', 'moderate', 'difficult', 'cash_only'
  notes TEXT,
  source TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📋 Master Task List

### Week 1
- [ ] **P1.1** Create `scripts/enrich-market-pricing.js`
- [ ] **P1.1** Run BringATrailer price scraper for all 188 cars
- [ ] **P1.1** Add Cars.com average prices
- [ ] **P1.2** Import FastestLaps.com lap time data
- [ ] **P1.3** Queue YouTube videos for exotic brands (Ferrari, McLaren, Lambo)

### Week 2
- [ ] **P1.2** Add Car and Driver test lap times
- [ ] **P1.2** Normalize track venue data
- [ ] **P1.3** Process queued YouTube videos with AI
- [ ] **P1.3** Index new transcripts for AL

### Week 3
- [ ] **P2.1** Activate CorvetteForum scraper
- [ ] **P2.1** Activate My350Z/370Z scraper
- [ ] **P2.1** Activate S2Ki scraper
- [ ] **P2.1** Add FerrariChat as forum source
- [ ] **P2.2** Create `scripts/enrich-service-costs.js`

### Week 4
- [ ] **P2.1** Add MustangForums, CamaroForums sources
- [ ] **P2.1** Add McLarenLife, Lamborghini-Talk sources
- [ ] **P2.2** Populate service costs for top 50 cars
- [ ] **P2.3** Import lateral G data from C&D/MT

### Week 5
- [ ] **P3.1** Research insurance cost indexes
- [ ] **P3.1** Add warranty information
- [ ] **P3.2** Complete competitor data for all cars
- [ ] **P3.2** AI-generate comparison recommendations

### Week 6
- [ ] **P3.3** Import dyno baseline data
- [ ] **P3.1** Calculate annual ownership costs
- [ ] **Index** Re-run knowledge base indexing for new content

### Week 7
- [ ] **P4.1** Create depreciation_curves table
- [ ] **P4.1** Populate depreciation data from BaT trends
- [ ] **P4.2** Design tuner_shops schema

### Week 8
- [ ] **P4.2** Seed tuner_shops with 50 top shops
- [ ] **P4.3** Create financing_profiles table
- [ ] **Final** Comprehensive AL testing with new data

---

## 📈 Success Metrics

| Metric | Current | Week 2 | Week 4 | Week 8 |
|--------|---------|--------|--------|--------|
| Market Pricing Coverage | 5% | 50% | 70% | 80% |
| Track Lap Times | 16% | 40% | 50% | 60% |
| Community Insights | 8.5% | 15% | 30% | 50% |
| Service Costs | 7% | 20% | 35% | 50% |
| Insurance Data | 5% | 10% | 30% | 50% |
| YouTube Coverage | 78% | 85% | 90% | 95% |
| Knowledge Chunks | 7,191 | 8,500 | 10,000 | 12,000+ |

---

## 🛠️ Scripts to Create

1. `scripts/enrich-market-pricing.js` - BaT, Cars.com, Hagerty
2. `scripts/enrich-service-costs.js` - RepairPal, forum data
3. `scripts/import-lap-times.js` - FastestLaps, C&D, MT
4. `scripts/youtube-queue-missing-cars.js` - Fill exotic gaps
5. `scripts/calculate-ownership-costs.js` - Annual estimates
6. `scripts/vectorize-community-insights.js` - Embed the 96 missing

---

## 🎯 AL Capability Improvements

After completing this roadmap, AL will be able to answer:

| Question Type | Before | After |
|---------------|--------|-------|
| "What's a fair price for X?" | ❌ Limited | ✅ Data-driven |
| "What does 60K service cost?" | ❌ 7% cars | ✅ 50% cars |
| "What's the lap time at Laguna Seca?" | ⚠️ 16% cars | ✅ 60% cars |
| "What do owners say about X?" | ⚠️ Porsche only | ✅ All brands |
| "How much will insurance cost?" | ❌ 5% cars | ✅ 50% cars |
| "Who should work on my car?" | ❌ None | ✅ Shop directory |
| "How much will it depreciate?" | ❌ None | ✅ Trend data |

---

*Last updated: December 23, 2024*

