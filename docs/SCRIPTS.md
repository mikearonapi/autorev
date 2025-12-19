# AutoRev Scripts Reference

> Complete reference for 100+ operational scripts
>
> **Last Updated:** December 15, 2024

---

## Overview

The `scripts/` directory contains operational scripts for data enrichment, migrations, testing, and maintenance. These are **not** part of the production app but are essential for data operations.

| Category | Count | Purpose |
|----------|-------|---------|
| Data Enrichment | 25+ | Populate and update database records |
| YouTube Pipeline | 8 | Video discovery and AI processing |
| Image Generation | 12+ | AI-generated car images |
| Data Seeding | 15+ | Initial data population |
| Migrations | 6 | Database schema migrations |
| Audits/QA | 12+ | Data quality and validation |
| Forum Scraping | 5 | Community insight extraction |
| Testing | 8+ | Regression and smoke tests |

---

## Running Scripts

Most scripts require environment variables from `.env.local`:

```bash
# Basic pattern
node scripts/script-name.js

# ES Modules (.mjs)
node scripts/script-name.mjs

# With arguments
node scripts/script-name.js --arg=value
```

### NPM Script Aliases

Common scripts have npm aliases in `package.json`:

```bash
# YouTube Pipeline
npm run youtube:pipeline     # Full pipeline (discover → transcripts → AI)
npm run youtube:discover     # Discover new videos from channels
npm run youtube:transcripts  # Get transcripts for queued videos
npm run youtube:ai           # AI processing (summaries, pros/cons)
npm run youtube:consensus    # Aggregate consensus across videos
npm run youtube:curated      # Browser-based discovery

# Event Audits
npm run audit:events         # Full event audit
npm run audit:events:mece    # MECE category audit
npm run audit:events:urls    # Validate event URLs
npm run audit:events:quality # Event data quality

# Testing
npm run test                 # Run all tests
npm run al:eval              # AL regression tests
npm run smoke:parts-search-api # Parts API smoke test
```

---

## Data Enrichment Scripts

### Car Data

| Script | Purpose | Tables Affected |
|--------|---------|-----------------|
| `enrichAllCars.js` | Master enrichment coordinator | Multiple |
| `enrich-cars-data.js` | Core spec enrichment | `cars` |
| `enrichRecallsAll.js` | NHTSA recall data | `car_recalls` |
| `enrichIssuesFromComplaints.js` | Extract issues from NHTSA complaints | `car_issues` |
| `enrichEpaDirect.js` | EPA fuel economy | `car_fuel_economy` |
| `enrichFreeApisDirect.js` | Free API data (NHTSA, EPA) | Multiple |

### Market Pricing

| Script | Purpose | Tables Affected |
|--------|---------|-----------------|
| `batchEnrichAllMarketPricing.js` | All pricing sources | `car_market_pricing` |
| `enrichCarsComValidatedPricing.js` | Cars.com prices | `car_market_pricing` |
| `scrapeValidatedPricing.js` | BaT + Cars.com | `car_market_pricing` |
| `scrapeWorkingSourcesV2.js` | Multi-source scraping | `car_market_pricing` |

### Maintenance Data

| Script | Purpose | Tables Affected |
|--------|---------|-----------------|
| `populate-maintenance-specs.mjs` | Initial maintenance data | `vehicle_maintenance_specs` |
| `populate-maintenance-specs-batch2.mjs` | Batch 2 of 8 | `vehicle_maintenance_specs` |
| ... (batches 3-8) | Continued batches | `vehicle_maintenance_specs` |
| `enrichSparkPlugsAI.js` | AI-generated spark plug specs | `vehicle_maintenance_specs` |
| `enrichTransFluidAI.js` | AI-generated trans fluid specs | `vehicle_maintenance_specs` |

### Parts Data

| Script | Purpose | Tables Affected |
|--------|---------|-----------------|
| `expandFitments.mjs` | Expand part fitments | `part_fitments` |
| `generatePartRelationshipsPilot.mjs` | Part compatibility | `part_relationships` |
| `fitmentCoverage.mjs` | Analyze fitment coverage | (read-only) |

---

## YouTube Pipeline Scripts

The YouTube pipeline runs in stages:

```
youtube-discovery.js → youtube-transcripts.js → youtube-ai-processing.js → youtube-aggregate-consensus.js
```

| Script | Purpose | Stage |
|--------|---------|-------|
| `youtube-pipeline.js` | Run full pipeline | All |
| `youtube-discovery.js` | Find new videos from channels | 1 |
| `youtube-browser-discovery.js` | Browser-based discovery | 1 (alt) |
| `youtube-transcripts.js` | Get video transcripts | 2 |
| `youtube-ai-processing.js` | AI summaries, pros/cons | 3 |
| `youtube-aggregate-consensus.js` | Cross-video consensus | 4 |
| `youtube-fill-missing-cars.js` | Link videos to cars | Fix |
| `youtube-process-from-urls.js` | Process specific URLs | Manual |
| `youtube-process-all-cars.js` | Process all car videos | Batch |

### Usage

```bash
# Full pipeline for all channels
npm run youtube:pipeline

# Just discover new videos
npm run youtube:discover

# Process specific video URLs
node scripts/youtube-process-from-urls.js "https://youtube.com/..."
```

---

## Image Generation Scripts

AI-generated car images using various providers.

| Script | Purpose | Output |
|--------|---------|--------|
| `generate-car-images.js` | Single car image | `public/cars/` |
| `generate-car-images-multi.js` | Batch car images | `public/cars/` |
| `batch-hero-images.js` | Hero images in batch | `public/cars/` |
| `generate-dramatic-rear.js` | Rear 3/4 angles | `public/cars/` |
| `generate-inspired-images.js` | Style-inspired variants | `public/cars/` |
| `generate-garage-images.js` | Garage page images | `public/garage/` |
| `generate-garage-nano.js` | Small garage thumbnails | `public/garage/` |
| `generate-page-images.js` | Page hero images | `public/pages/` |
| `generate-logo.js` | Logo generation | `public/` |
| `generate-white-logo.js` | White logo variant | `public/` |
| `generate-al-mascot.js` | AL mascot image | `public/` |

### Image Library Management

| Script | Purpose |
|--------|---------|
| `image-library.js` | Core image utilities |
| `analyze-image-coverage.js` | Check which cars have images |
| `analyze-image-library.js` | Analyze image metadata |
| `sync-inspired-images-to-library.js` | Sync generated images |
| `upload-missing-garage-images.js` | Upload missing images |
| `normalize-carousel-images.js` | Normalize carousel images |
| `backfill-image-dimensions.js` | Add dimensions to DB |
| `import-external-images.js` | Import from external sources |

---

## Data Seeding Scripts

Initial data population for new databases.

| Script | Purpose | Tables |
|--------|---------|--------|
| `migrate-and-seed.js` | Full migration + seed | All |
| `seed-cars-from-local.js` | Seed cars from local data | `cars` |
| `seedDynoRunsEstimated.mjs` | Seed dyno estimates | `car_dyno_runs` |
| `seedLapTimesFastestLaps.mjs` | Seed lap time data | `car_track_lap_times` |
| `syncUpgradeKeysToDb.mjs` | Sync upgrade definitions | `upgrade_keys` |
| `generateSeedMultiBrandMigration.mjs` | Multi-brand parts seed | `parts` |
| `add-ownership-data.js` | Add ownership cost data | `cars` |
| `populate-known-issues.js` | Populate known issues | `car_issues` |

---

## Migration Scripts

Database schema and data migrations.

| Script | Purpose |
|--------|---------|
| `run-migration.js` | Run single migration |
| `runMigration.js` | Alternative migration runner |
| `runMigrationPg.js` | Direct PostgreSQL migration |
| `run-supabase-migrations.js` | Run via Supabase CLI |
| `run-schema.js` | Apply schema changes |
| `migrate-scores-to-decimal.js` | Specific: convert scores to decimal |

### Usage

```bash
# Run a specific migration file
node scripts/run-migration.js 050_events_geocoding_and_sources.sql
```

---

## Audit & QA Scripts

Data quality and validation scripts.

| Script | Purpose | Output |
|--------|---------|--------|
| `audit-car-data.js` | Full car data audit | Report |
| `audit-vehicle-data.js` | Vehicle-specific audit | Report |
| `audit-youtube-mappings.js` | YouTube → car links | Report |
| `audit-events-all.js` | Complete events audit | Report |
| `audit-events-mece.js` | Event category MECE check | Report |
| `audit-events-quality.js` | Event data quality | Report |
| `validate-event-urls.js` | Check event URLs work | Report |
| `validate-upgrades.js` | Upgrade data validation | Report |
| `validation-suite.js` | Run all validations | Report |
| `run-all-validations.js` | Master validation runner | Report |
| `score-audit.js` | Car score validation | Report |
| `qa-score-comparison.js` | Compare scoring methods | Report |
| `category-audit.js` | Category coverage audit | Report |
| `data-quality-queries.js` | SQL quality queries | SQL |
| `content-linter.js` | Content quality linter | Report |

### Usage

```bash
# Run all validations
node scripts/run-all-validations.js

# Audit specific area
node scripts/audit-car-data.js
npm run audit:events
```

---

## Forum Scraping Scripts

Community insight extraction from enthusiast forums.

| Script | Purpose |
|--------|---------|
| `run-forum-scrape-test.js` | Test forum scraping |
| `run-insight-extraction.js` | Extract insights from threads |
| `test-forum-scraper.js` | Forum scraper test suite |
| `run-forum-migrations.js` | Forum schema migrations |
| `forum-insights-validation.sql` | Validation queries |

### Usage

```bash
# Test forum scraper on specific forum
node scripts/run-forum-scrape-test.js --forum=rennlist

# Extract insights from scraped threads
node scripts/run-insight-extraction.js --limit=10
```

---

## Event Scripts

Event data management and enrichment.

| Script | Purpose |
|--------|---------|
| `enrich-events-2026-from-sources.js` | Fetch 2026 events |
| `backfill-event-geocodes.js` | Add missing geocodes |
| `audit-events-all.js` | Full event audit |
| `audit-events-mece.js` | Category completeness |
| `audit-events-quality.js` | Data quality check |
| `validate-event-urls.js` | URL validation |

---

## Testing Scripts

Automated testing and regression detection.

| Script | Purpose | Type |
|--------|---------|------|
| `al-eval-regression-tests.mjs` | AL response quality | Regression |
| `algorithm-regression-tests.js` | Scoring algorithm | Regression |
| `test-matrix-scenarios.mjs` | Matrix test scenarios | Integration |
| `check-matrix-coverage.mjs` | Matrix coverage check | Coverage |
| `smokePartsSearchApi.mjs` | Parts API smoke test | Smoke |
| `test-autodev-api.mjs` | AutoDev API tests | Integration |
| `test-autodev-api-v2.mjs` | AutoDev API v2 tests | Integration |
| `testVendorAdapters.mjs` | Vendor adapter tests | Unit |
| `testScrapers.js` | Scraper tests | Unit |
| `testBaTStealth.js` | BaT scraper test | Unit |
| `testCarsComYearly.js` | Cars.com scraper test | Unit |

### Running Tests

```bash
# Run all tests via npm
npm test

# Run AL evaluation tests
npm run al:eval

# Run specific test file
node scripts/test-matrix-scenarios.mjs
```

---

## Scraper Scripts

Web scraping for market data.

| Script | Purpose | Source |
|--------|---------|--------|
| `testScrapers.js` | Test all scrapers | Multiple |
| `testBaTBrowserFallback.js` | BaT browser mode | Bring a Trailer |
| `testBaTStealth.js` | BaT stealth mode | Bring a Trailer |
| `testCarsComYearly.js` | Cars.com by year | Cars.com |
| `debugCarsComScraper.js` | Debug Cars.com | Cars.com |
| `scrapeWorkingSources.js` | v1 multi-source | Multiple |
| `scrapeWorkingSourcesV2.js` | v2 multi-source | Multiple |

---

## Utility Scripts

Miscellaneous utilities.

| Script | Purpose |
|--------|---------|
| `carMappings.js` | Car name → slug mappings |
| `platform-mappings.json` | Platform fitment mappings |
| `fix-youtube-mappings.js` | Fix broken video links |
| `update-car-curated-content.js` | Update curated car content |
| `dependencyChecker.js` | Check upgrade dependencies |
| `expert-validated-scores.js` | Apply expert score validations |
| `recolor-logo.js` | Logo color variants |
| `edit-logo.js` | Logo editing utility |
| `processJobs.js` | Generic job processor |
| `image-sourcing-guide.js` | Guide for sourcing images |

---

## Script Environment

### Required Environment Variables

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# YouTube
YOUTUBE_API_KEY=

# Optional
CRON_SECRET=
GOOGLE_API_KEY=
```

### Common Flags

Many scripts support these flags:

```bash
--dry-run          # Preview changes without writing
--limit=N          # Limit records processed
--skip=N           # Skip first N records
--car-slug=X       # Target specific car
--verbose          # Extra logging
--force            # Override safety checks
```

---

## Script Development

### Creating New Scripts

```javascript
// scripts/my-new-script.mjs
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Your script logic
}

main().catch(console.error);
```

### Best Practices

1. **Always use dry-run first** - Test with `--dry-run` before writing data
2. **Log progress** - Use `console.log` for visibility
3. **Handle errors gracefully** - Wrap in try/catch
4. **Rate limit external APIs** - Add delays between requests
5. **Use batching** - Process in chunks to avoid timeouts
6. **Save progress** - For long scripts, checkpoint progress

---

*See [DATABASE.md](DATABASE.md) for table schemas and [API.md](API.md) for cron job documentation.*






