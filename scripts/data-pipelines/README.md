# Data Pipelines

Unified entry points for all AutoRev data ingestion pipelines.

## AutoRev's 6 Core Problems

1. **"What should I do to my car?"** — Upgrade Selection → Tuning Profiles
2. **"Which parts should I buy?"** — Parts Navigation → Parts + Fitments
3. **"What will this actually do?"** — Visualization → Dyno Data + Lap Times
4. **"I did the mods — now what?"** — Progression → Track Data + Dyno Logging
5. **"Where do I find my people?"** — Community → Community Insights
6. **"I just have a quick question"** — AL Knowledge → YouTube + Issues

## Current Data Coverage (2026-01-21)

| Data Type | Coverage | Problem Solved | Status |
|-----------|----------|----------------|--------|
| **Part Fitments** | **35.8%** | #2 "Which parts?" | 🔴 CRITICAL |
| **Dyno Data** | **8.1%** | #3 "What will it do?" | 🔴 CRITICAL |
| **Lap Times** | **18.7%** | #3 & #4 Performance | 🔴 CRITICAL |
| Community Insights | 6.5% | #5 & #6 Community/AL | 🟡 MEDIUM |
| YouTube | 90% | #6 AL Knowledge | ✅ GOOD |
| Tuning Profiles | 100% | #1 "What upgrades?" | ✅ COMPLETE |
| Known Issues | 100% | #6 AL Knowledge | ✅ COMPLETE |

## Unified Pipeline Runner

```bash
# Run any pipeline from a single entry point
node scripts/data-pipelines/run-pipeline.mjs <pipeline> [options]

# Available pipelines: parts, market, community, youtube, tuning, vehicles, knowledge, forums
```

## Directory Structure

```
data-pipelines/
├── run-pipeline.mjs        # Unified entry point
├── parts/                  # Parts & Fitment Data
│   └── run-shopify-ingest.mjs
├── vehicles/               # Vehicle Data (reserved)
├── market/                 # Market Pricing
│   └── run-bat-pricing.mjs
├── community/              # Community Insights
│   └── run-reddit-ingest.mjs
├── youtube/                # YouTube Videos (reserved)
└── knowledge/              # Knowledge Base (reserved)
```

## Quick Start

### Parts Ingestion
```bash
# List available vendors
node scripts/data-pipelines/parts/run-shopify-ingest.mjs --list

# Ingest all vendors
node scripts/data-pipelines/parts/run-shopify-ingest.mjs

# Single vendor
node scripts/data-pipelines/parts/run-shopify-ingest.mjs --vendor=eqtuning
```

### Market Pricing (BaT)
```bash
# All cars missing BaT data
node scripts/data-pipelines/market/run-bat-pricing.mjs

# Limit to 50 cars
node scripts/data-pipelines/market/run-bat-pricing.mjs --limit=50

# Single car
node scripts/data-pipelines/market/run-bat-pricing.mjs --car=bmw-m3-e46
```

### Community Insights (Reddit)
```bash
# Find cars needing insights
node scripts/data-pipelines/community/run-reddit-ingest.mjs --dry-run

# Process all
node scripts/data-pipelines/community/run-reddit-ingest.mjs
```

## Adding New Pipelines

1. Create a new subdirectory if needed
2. Create `run-<pipeline>.mjs` as the entry point
3. Use consistent CLI flags: `--limit`, `--dry-run`, `--help`
4. Add to this README

## Fixing Critical Data Gaps

### 1. Part Fitments (35.8% → 70%+ goal)

**Problem Solved:** #2 "Which parts should I buy?"

```bash
# Option A: Shopify vendor feeds (current approach)
node scripts/data-pipelines/parts/run-shopify-ingest.mjs --all

# Option B: SEMA/Turn14 integration (industry standard - needs credentials)
# See docs/TURN14_SEMA_RESEARCH.md for setup

# Check current coverage
node scripts/fitmentCoverage.mjs
```

**Strategy:**
- Expand Shopify vendor list (currently 7 vendors)
- Implement Turn 14 API for ACES-compliant fitment data
- Priority: High-volume cars first (M3, WRX, Mustang, etc.)

### 2. Dyno Data (8.1% → 40%+ goal)

**Problem Solved:** #3 "What will this actually do for me?"

```bash
# Seed estimated dyno runs from tuning profiles
node scripts/seedDynoRunsEstimated.mjs

# Scrape forum dyno results
node scripts/forum-dyno-scraper.mjs --limit=50
```

**Strategy:**
- Generate estimated dyno curves from tuning profile data
- Scrape real dyno results from forums (R3V, NASIOC, etc.)
- Encourage user uploads via community builds

### 3. Lap Times (18.7% → 50%+ goal)

**Problem Solved:** #3 & #4 "Performance visualization & progression"

```bash
# Scrape FastestLaps data
node scripts/scrape-lap-times.mjs

# Rescrape with new tracks
node scripts/rescrape-lap-times.mjs --track=nurburgring
```

**Strategy:**
- Expand FastestLaps scraping to more tracks
- Focus on popular tracks (Nürburgring, Laguna Seca, etc.)
- Enable user lap time submissions

### 4. Community Insights (6.5% → 30%+ goal)

**Problem Solved:** #5 & #6 "Community knowledge for AL"

```bash
# Reddit insights via Apify
node scripts/apify/backfill-reddit-insights.mjs --limit=50

# Forum scraping
node scripts/run-insight-extraction.js
```

## Automated Cron Jobs

| Job | Schedule | Pipeline | Problem |
|-----|----------|----------|---------|
| `refresh-recalls` | Sun 02:00 UTC | NHTSA → car_recalls | #6 AL Knowledge |
| `refresh-complaints` | Sun 02:30 UTC | NHTSA → car_issues | #6 AL Knowledge |
| `youtube-enrichment` | Mon 04:00 UTC | YouTube → youtube_videos | #6 AL Knowledge |
| `forum-scrape` | Tue/Fri 05:00 UTC | Forums → community_insights | #5 & #6 |
| `al-optimization` | Sat 03:00 UTC | Embeddings → document_chunks | #6 AL |

## Legacy Scripts

Original scripts remain in their locations for backward compatibility:
- `scripts/apify/backfill-bat-pricing.mjs`
- `scripts/run-all-shopify-vendors.mjs`
- `scripts/apify/backfill-reddit-insights.mjs`

See `scripts/_DEPRECATION_REGISTRY.json` for complete list of deprecated scripts and their replacements.

## Monitoring Data Coverage

```bash
# Check data coverage via API (requires admin access)
curl -H "Authorization: Bearer $TOKEN" \
  https://autorev.vercel.app/api/admin/data-coverage

# Or check directly via RPC
SELECT get_data_coverage_stats();
```
