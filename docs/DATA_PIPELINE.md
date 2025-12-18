# AutoRev Data Pipeline

> Strategy and implementation for data ingestion, enrichment, and maintenance
>
> **Last Updated:** December 15, 2024

---

## Overview

AutoRev's data pipeline consists of automated cron jobs, manual scripts, and API-driven enrichment. This document outlines all data sources, ingestion methods, and expansion priorities.

---

## 🗓️ Automated Pipelines (Cron Jobs)

| Schedule | Job | Endpoint | Data Type | Status |
|----------|-----|----------|-----------|--------|
| **Sunday 2:00 AM** | Parts Ingestion | `/api/cron/schedule-ingestion` | Parts from Shopify vendors | ✅ Active |
| **Sunday 2:30 AM** | Recalls Refresh | `/api/cron/refresh-recalls` | NHTSA recall campaigns | ✅ Active |
| **Sunday 4:00 AM** | Complaints Refresh | `/api/cron/refresh-complaints` | NHTSA complaint data | ✅ Active |
| **Monday 4:00 AM** | YouTube Enrichment | `/api/cron/youtube-enrichment` | Video metadata + AI summaries | ✅ Active |
| **Monday 6:00 AM** | Events Refresh | `/api/cron/refresh-events` | Car events from sources | ⚠️ Needs attention |
| **Tue/Fri 5:00 AM** | Forum Scrape | `/api/cron/forum-scrape` | Forum threads → insights | ⚠️ Porsche-only |

---

## 📊 Data Source Matrix

### Tier 1: Fully Automated (API-Based)

| Data Type | Source | API/Method | Refresh | Coverage |
|-----------|--------|------------|---------|----------|
| **Fuel Economy** | EPA | REST API | On-demand | 98/98 ✅ |
| **Safety Ratings** | NHTSA | REST API | On-demand | 98/98 ✅ |
| **Recalls** | NHTSA | REST API | Weekly | 69/98 cars |
| **Complaints** | NHTSA | REST API | Weekly | Active |
| **YouTube Videos** | YouTube Data API | REST API | Weekly | 95/98 cars |

### Tier 2: Semi-Automated (Scraping Required)

| Data Type | Source(s) | Method | Refresh | Coverage |
|-----------|-----------|--------|---------|----------|
| **Market Pricing** | BaT, Cars.com, Hagerty | Web scraping | Manual | **10/98** ⚠️ |
| **Parts Catalog** | ECS Tuning, FCP Euro, etc. | Shopify API | Weekly | 642 parts |
| **Events** | Eventbrite, MotorsportReg, etc. | API + Scraping | Weekly | **55 events** ⚠️ |
| **Lap Times** | Fastestlaps.com | Web scraping | Manual | 65 records |

### Tier 3: Community-Sourced (AI Extraction)

| Data Type | Source(s) | Method | Refresh | Coverage |
|-----------|-----------|--------|---------|----------|
| **Community Insights** | Rennlist, Bimmerpost, etc. | Forum scraping + GPT | Bi-weekly | **10/98 cars** ⚠️ |
| **Dyno Runs** | Forums, YouTube | Manual + AI | Manual | 25/98 cars |
| **Known Issues** | Forums, owner reports | AI extraction | Manual | 98/98 ✅ |

### Tier 4: Manual Curation

| Data Type | Source | Method | Coverage |
|-----------|--------|--------|----------|
| **Core Car Specs** | Research | Manual entry | 98/98 ✅ |
| **Enthusiast Scores** | Expert judgment | Manual entry | 98/98 ✅ |
| **Maintenance Specs** | Owner manuals | Manual entry | 98/98 ✅ |

---

## 🚀 Pipeline Expansion Plan

### Phase 1: Critical Gaps (P1) — Target: 2 weeks

#### 1.1 Market Pricing Pipeline

**Current State:** 10/98 cars (Porsche + Alfa only)

**Expansion Strategy:**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Cars.com      │────►│  Price Parser   │────►│ car_market_     │
│   Listings      │     │  (per make)     │     │ pricing         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ Bring a Trailer │     │ car_market_     │
│ Completed Sales │     │ pricing_years   │
└─────────────────┘     └─────────────────┘
```

**Implementation:**
1. Extend `lib/scrapers/carsComScraper.js` for all 24 brands
2. Add `scripts/batchEnrichAllMarketPricing.js` with rate limiting
3. Schedule weekly refresh via new cron endpoint

**Files to modify:**
- `lib/scrapers/carsComScraper.js` — Add brand-specific selectors
- `scripts/enrichCarsComValidatedPricing.js` — Batch processing
- `app/api/cron/refresh-market-pricing/route.js` — New cron endpoint

#### 1.2 Community Insights Pipeline

**Current State:** 1,226 insights for Porsche only

**Expansion Strategy:**
```
┌─────────────────┐
│  forum_sources  │ (14 forums registered)
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐  ┌────────┐  ┌────────┐
│Rennlist│  │Bimmer- │  │FT86    │  ... (11 more)
│(active)│  │post    │  │Club    │
└────────┘  └────────┘  └────────┘
    │            │           │
    ▼            ▼           ▼
┌─────────────────────────────────┐
│     forum_scraped_threads       │
│     (175 threads → expand)      │
└─────────────────────────────────┘
                │
                ▼ GPT-4 extraction
┌─────────────────────────────────┐
│      community_insights         │
│      (target: all 98 cars)      │
└─────────────────────────────────┘
```

**Priority Forums to Activate:**
| Forum | Brand Coverage | Status |
|-------|---------------|--------|
| Rennlist | Porsche | ✅ Active |
| Bimmerpost | BMW | 🔴 Needs activation |
| FT86Club | Toyota 86, BRZ | 🔴 Needs activation |
| VWVortex | VW, Audi | 🔴 Needs activation |
| CorvetteForum | Chevrolet | 🔴 Needs activation |
| MustangEvolution | Ford | 🔴 Needs activation |
| MX-5 Miata Forum | Mazda | 🔴 Needs activation |
| NASIOC | Subaru | 🔴 Needs activation |

**Implementation:**
1. Update `lib/forumScraper/` adapters per forum
2. Enable `is_active` flag in `forum_sources` table
3. Test extraction quality per brand
4. Run batch insight extraction

#### 1.3 Events Re-Ingestion

**Current State:** 55 events (down from ~940 documented)

**Root Cause Investigation:**
- Events may have been deleted due to past dates
- Source fetchers may be failing silently
- Need to verify `event_sources` configurations

**Action Items:**
1. Audit `event_sources` table for active sources
2. Run manual ingestion: `node scripts/enrich-events-2026-from-sources.js`
3. Check for stale data cleanup logic in cron
4. Add monitoring/alerting for event counts

### Phase 2: Enhancement Gaps (P2) — Target: 1 month

#### 2.1 Dyno Data Expansion

**Current:** 29 runs across 25 cars  
**Target:** 200+ runs across 60+ cars

**Sources:**
1. **YouTube dyno videos** — Extract via GPT vision
2. **Forum dyno posts** — Mine from community insights extraction
3. **User submissions** — Add submission form (Tuner tier)

#### 2.2 Lap Times Expansion

**Current:** 65 records  
**Target:** 300+ records

**Sources:**
1. **Fastestlaps.com** — Scrape verified times
2. **YouTube hot lap videos** — Extract times
3. **Community submissions** — Track day results

#### 2.3 Part Fitments Expansion

**Current:** 836 fitments (VW-heavy, others have ~5 placeholder each)  
**Target:** 3000+ verified fitments

**Strategy:**
1. Expand vendor adapters beyond ECS/FCP Euro
2. Add Turner Motorsport, Pelican Parts, RockAuto
3. Implement fitment verification workflow

---

## 🔧 Technical Implementation

### Scraping Infrastructure

```
┌─────────────────────────────────────────────────────────┐
│                    Scrape Job Queue                     │
│                   (scrape_jobs table)                   │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  Stealth │    │ Browser  │    │  Basic   │
    │ Scraper  │    │ Scraper  │    │  Fetch   │
    │(Puppeteer│    │(Playwright│    │ (axios)  │
    │+proxies) │    │ headless)│    │          │
    └──────────┘    └──────────┘    └──────────┘
          │               │               │
          └───────────────┼───────────────┘
                          ▼
              ┌─────────────────────┐
              │   Data Normalizer   │
              │ (fitmentNormalizer, │
              │  priceParser, etc.) │
              └─────────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │    Supabase DB      │
              │ (upsert with MERGE) │
              └─────────────────────┘
```

### Rate Limiting & Anti-Detection

| Source | Rate Limit | Method |
|--------|------------|--------|
| Cars.com | 1 req/2s | Stealth browser + residential proxy |
| BaT | 1 req/3s | Stealth browser |
| Eventbrite | 10 req/s | Official API |
| Forums | 1 req/5s | Respect robots.txt |

### Error Handling

All pipelines log to `scrape_jobs` table:
- `status`: pending → processing → completed/failed
- `error_message`: Captured for debugging
- `sources_attempted[]`: Which sources were tried
- `sources_succeeded[]`: Which sources returned data

---

## 📁 Key Scripts

| Script | Purpose | Run Command |
|--------|---------|-------------|
| `scripts/enrichAllCars.js` | Full enrichment sweep | `node scripts/enrichAllCars.js` |
| `scripts/batchEnrichAllMarketPricing.js` | Market pricing batch | `node scripts/batchEnrichAllMarketPricing.js` |
| `scripts/enrich-events-2026-from-sources.js` | Events ingestion | `node scripts/enrich-events-2026-from-sources.js` |
| `scripts/run-insight-extraction.js` | Forum insight extraction | `node scripts/run-insight-extraction.js` |
| `scripts/seedDynoRunsEstimated.mjs` | Dyno data seeding | `node scripts/seedDynoRunsEstimated.mjs` |
| `scripts/seedLapTimesFastestLaps.mjs` | Lap times seeding | `node scripts/seedLapTimesFastestLaps.mjs` |
| `scripts/expandFitments.mjs` | Part fitment expansion | `node scripts/expandFitments.mjs` |

---

## 🔍 Monitoring & Alerts

### Data Freshness Checks

Run `get_data_freshness(p_car_slug)` RPC to verify:
- Last update timestamps per data type
- Stale data flags (>30 days old)

### Coverage Metrics

Track in `reports/data_completeness_audit.json`:
- Table row counts
- Coverage percentages per car
- Gaps by priority

### Recommended Dashboards

1. **Daily:** Event count, insight count, error rates
2. **Weekly:** Market pricing coverage, fitment coverage
3. **Monthly:** Full data audit (run completeness audit script)

---

## 🎯 Success Metrics

| Metric | Current | Target (30 days) | Target (90 days) |
|--------|---------|------------------|------------------|
| Market Pricing Coverage | 10.2% | 50% | 100% |
| Community Insights Coverage | 10.2% | 40% | 80% |
| Events Count | 55 | 300 | 1000+ |
| Dyno Runs | 29 | 100 | 200+ |
| Lap Times | 65 | 150 | 300+ |
| Part Fitments | 836 | 1500 | 3000+ |

---

*See [DATABASE.md](DATABASE.md) for schema details and [DATA_GAPS.md](DATA_GAPS.md) for gap analysis.*



