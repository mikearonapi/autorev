# Scripts Folder Audit Report
**Date**: 2026-01-21
**Total Scripts**: 291 files (.js and .mjs)

## Executive Summary

The `/scripts` folder contains 291 scripts across multiple categories. This audit identifies:
- **Active Data Pipelines**: 23 scripts (keep/maintain)
- **Test/Validation Scripts**: 34 scripts (keep, move to /tests)
- **One-Time Migration Scripts**: 47 scripts (archive)
- **Deprecated/Redundant**: 51 scripts (mark deprecated)
- **Utility Scripts**: 28 scripts (keep/consolidate)
- **Image/Video Generation**: 48 scripts (keep, consolidate)
- **User-Specific Analysis**: 8 scripts (archive)
- **Event Seeders**: 24 scripts (consolidate)
- **Other**: 28 scripts (review)

---

## Category 1: Active Data Pipelines (KEEP - 23 scripts)

These scripts are actively used for data ingestion and should be maintained.

### Market Pricing
| Script | Purpose | Cron Job | Status |
|--------|---------|----------|--------|
| `apify/backfill-bat-pricing.mjs` | BaT auction data → `car_market_pricing` | Manual | ✅ Active |
| `batchEnrichAllMarketPricing.js` | Batch market pricing enrichment | Manual | ✅ Active |

### Community & Forums
| Script | Purpose | Cron Job | Status |
|--------|---------|----------|--------|
| `apify/backfill-reddit-insights.mjs` | Reddit data → `community_insights` | Manual | ✅ Active |
| `run-insight-extraction.js` | Forum threads → insights | Cron | ✅ Active |
| `run-forum-scrape.mjs` | Forum scraping orchestration | Cron | ✅ Active |
| `forum-dyno-scraper.mjs` | Dyno data from forums | Manual | ✅ Active |

### Parts & Vendors
| Script | Purpose | Cron Job | Status |
|--------|---------|----------|--------|
| `run-all-shopify-vendors.mjs` | All Shopify vendor ingestion | Manual | ✅ Active |
| `run-shopify-ingest.mjs` | Single vendor ingestion | Manual | ✅ Active |
| `ingest-affiliate-feed.mjs` | Affiliate feed ingestion | Manual | ✅ Active |
| `ingest-sema-data.mjs` | SEMA data placeholder | Future | 🔄 Stub |

### YouTube
| Script | Purpose | Cron Job | Status |
|--------|---------|----------|--------|
| `youtube-pipeline.js` | Main YouTube pipeline | Cron | ✅ Active |
| `youtube-aggregate-consensus.js` | Calculate car consensus | Cron | ✅ Active |
| `youtube-ai-processing.js` | AI video processing | Cron | ✅ Active |
| `youtube-channel-scanner.js` | Scan registered channels | Cron | ✅ Active |

### Vehicle Data
| Script | Purpose | Cron Job | Status |
|--------|---------|----------|--------|
| `vehicle-data-pipeline/run.mjs` | Main vehicle pipeline | Manual | ✅ Active |
| `car-pipeline/enrich-car.js` | Single car enrichment | Manual | ✅ Active |
| `car-pipeline/batch-enrich.js` | Batch car enrichment | Manual | ✅ Active |

### Tuning
| Script | Purpose | Cron Job | Status |
|--------|---------|----------|--------|
| `tuning-pipeline/run-pipeline.mjs` | Main tuning pipeline | Manual | ✅ Active |
| `tuning-pipeline/create-profile.mjs` | Create tuning profile | Manual | ✅ Active |
| `tuning-pipeline/validate-profile.mjs` | Validate profile data | Manual | ✅ Active |

### Knowledge Base
| Script | Purpose | Cron Job | Status |
|--------|---------|----------|--------|
| `indexKnowledgeBase.mjs` | Index knowledge base | Cron | ✅ Active |
| `generate-embeddings.mjs` | Generate document embeddings | Cron | ✅ Active |
| `vectorize-encyclopedia.mjs` | Vectorize encyclopedia | Manual | ✅ Active |

---

## Category 2: Deprecated/Redundant (MARK DEPRECATED - 51 scripts)

### Duplicate Scripts
| Script | Replace With | Reason |
|--------|--------------|--------|
| `audit-vehicle-data.js` | `audit-vehicle-data.mjs` | Duplicate .js and .mjs |
| `enrich-cars-data.js` | `car-pipeline/enrich-car.js` | Superseded |
| `enrichAllCars.js` | `car-pipeline/batch-enrich.js` | Superseded |
| `scrapeWorkingSources.js` | Removed | Outdated scraper |
| `scrapeWorkingSourcesV2.js` | Removed | Outdated scraper |

### Outdated YouTube Scripts
| Script | Reason |
|--------|--------|
| `youtube-browser-discovery.js` | Replaced by exa-discovery |
| `youtube-discovery.js` | Replaced by exa-discovery |
| `youtube-fetch-all-channel-videos.js` | Replaced by channel-scanner |
| `youtube-fetch-channel-videos.js` | Replaced by channel-scanner |
| `youtube-fill-missing-cars.js` | One-time backfill |
| `youtube-process-from-urls.js` | Superseded by pipeline |
| `youtube-transcripts.js` | Integrated into ai-processing |

### Outdated Enrichment Scripts
| Script | Reason |
|--------|--------|
| `enrichCarsComValidatedPricing.js` | Manual backfill complete |
| `enrichEpaDirect.js` | Replaced by API route |
| `enrichFreeApisDirect.js` | Replaced by cron jobs |
| `enrichSparkPlugsAI.js` | One-time AI enrichment |
| `enrichTransFluidAI.js` | One-time AI enrichment |
| `enrichEditorialReviewsPilot.mjs` | Pilot complete |

---

## Category 3: One-Time Migration Scripts (ARCHIVE - 47 scripts)

These scripts were run once and should be archived.

| Script | Purpose | Date Run |
|--------|---------|----------|
| `populate-maintenance-specs.mjs` | Initial maintenance data | 2026-01 |
| `populate-maintenance-specs-batch2.mjs` | Batch 2 | 2026-01 |
| `populate-maintenance-specs-batch3.mjs` | Batch 3 | 2026-01 |
| `populate-maintenance-specs-batch4.mjs` | Batch 4 | 2026-01 |
| `populate-maintenance-specs-batch5.mjs` | Batch 5 | 2026-01 |
| `populate-maintenance-specs-batch6.mjs` | Batch 6 | 2026-01 |
| `populate-maintenance-specs-batch7.mjs` | Batch 7 | 2026-01 |
| `populate-maintenance-specs-batch8.mjs` | Batch 8 | 2026-01 |
| `migrate-scores-to-decimal.js` | Score migration | 2025 |
| `migrate-and-seed.js` | Initial seed | 2025 |
| `vehicle-data-pipeline/batch-remaining-94.mjs` | One-time batch | 2026-01-12 |
| `vehicle-data-pipeline/batch-top100.mjs` | One-time batch | 2025 |
| `overnight-expansion.mjs` | One-time expansion | 2026-01-20 |
| `seedDynoRunsEstimated.mjs` | Initial dyno seed | 2026-01 |
| `seedLapTimesFastestLaps.mjs` | Initial lap times | 2026-01 |
| `seed-fitment-mappings.mjs` | Initial fitments | 2026-01 |
| `generateSeedMultiBrandMigration.mjs` | Migration generator | 2025 |
| `backfill-community-build-metrics.mjs` | One-time backfill | 2026 |
| `backfill-community-insights-embeddings.mjs` | One-time backfill | 2026 |
| `backfill-event-geocodes.js` | One-time backfill | 2026 |
| `backfill-image-dimensions.js` | One-time backfill | 2025 |
| `backfill-key-points.js` | One-time backfill | 2025 |

---

## Category 4: User-Specific Analysis (ARCHIVE - 8 scripts)

These are one-off analysis scripts for specific users/vehicles.

| Script | Purpose |
|--------|---------|
| `compare-cory-evo-actual.mjs` | Cory's Evo X analysis |
| `compare-cory-evo-models.mjs` | Cory's Evo X models |
| `compare-cory-evo-standalone.mjs` | Cory's Evo X standalone |
| `cory-evo-physics-projection.mjs` | Cory's Evo X projection |
| `verify-cory-evo-tuning.mjs` | Cory's Evo X verification |
| `rs5-final-review.mjs` | RS5 analysis |
| `rs5-forum-research-results.mjs` | RS5 forum data |
| `rs5-independent-analysis.mjs` | RS5 independent analysis |

---

## Category 5: Test Scripts (MOVE TO /tests - 34 scripts)

| Script | Purpose |
|--------|---------|
| `test-*.mjs` / `test-*.js` | Various test scripts |
| `*-regression-tests.js` | Regression test suites |
| `*.test.js` | Unit tests |
| `qa-*.mjs` | QA validation scripts |
| `validate-*.mjs` | Validation scripts |

---

## Category 6: Image/Video Generation (CONSOLIDATE - 48 scripts)

All `generate-*` scripts for images, logos, videos. Recommend consolidating into:
- `generate/images.mjs` - Car and article images
- `generate/icons.mjs` - App icons
- `generate/videos.mjs` - Marketing videos
- `generate/merch.mjs` - Merchandise designs

---

## Recommended Folder Structure

```
scripts/
├── data-pipelines/           # All active ingestion scripts
│   ├── parts/
│   │   ├── run-shopify-ingest.mjs
│   │   ├── run-all-shopify-vendors.mjs
│   │   ├── ingest-affiliate-feed.mjs
│   │   └── ingest-sema-data.mjs
│   ├── vehicles/
│   │   ├── enrich-car.mjs
│   │   ├── batch-enrich.mjs
│   │   └── run-pipeline.mjs
│   ├── market/
│   │   ├── bat-pricing.mjs
│   │   └── hagerty-values.mjs (future)
│   ├── community/
│   │   ├── reddit-ingest.mjs
│   │   ├── forum-scrape.mjs
│   │   └── insight-extraction.mjs
│   ├── youtube/
│   │   ├── pipeline.mjs
│   │   ├── channel-scanner.mjs
│   │   └── ai-processing.mjs
│   ├── tuning/
│   │   ├── run-pipeline.mjs
│   │   ├── create-profile.mjs
│   │   └── validate-profile.mjs
│   └── knowledge/
│       ├── index-kb.mjs
│       └── generate-embeddings.mjs
├── utilities/
│   ├── audit-coverage.mjs
│   ├── validate-fitments.mjs
│   └── export-data.mjs
├── generators/               # Image/video generation
│   ├── images.mjs
│   ├── videos.mjs
│   └── merch.mjs
├── events/                   # Event seeders (keep as-is)
└── _archived/                # Deprecated scripts
    ├── migrations/
    ├── one-time/
    └── user-specific/
```

---

## Immediate Actions

1. **Mark deprecated scripts** with comment header
2. **Move test scripts** to `/tests/scripts/`
3. **Archive one-time scripts** to `scripts/_archived/`
4. **Create consolidated entry points** for each pipeline category

---

## Database Current State (2026-01-21)

| Metric | Count | Notes |
|--------|-------|-------|
| Total Cars | 310 | Complete |
| Cars with BaT Pricing | 0 | Critical gap |
| Cars with Community Insights | 20 | Low coverage |
| Total Parts | 5,620 | Growing |
| Total Fitments | 7,904 | Growing |
| YouTube Videos | 2,261 | Good coverage |
