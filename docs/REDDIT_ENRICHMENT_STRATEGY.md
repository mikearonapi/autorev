# Reddit Enrichment Strategy

## Overview

Reddit scraping is prioritized by vehicle market importance (Top 100 Sports Sedans list) and focused on **performance and modification data** that's actually useful for the AutoRev database.

## Priority Tiers

Based on `research/Top 100 Sports Sedans by US Modification Market.md`:

| Tier | Examples | Focus |
|------|----------|-------|
| **Tier 1** | Civic Si/Type R, WRX STI, M3, Charger | Largest tuning ecosystems |
| **Tier 2** | G70, RS3, CTS-V, M5, Stinger | Significant market presence |
| **Tier 3** | IS-F, GR Corolla, Giulia, Legacy GT | Established communities |
| **Tier 4** | Older Si generations, GS-F | Niche but relevant |

## Data We Collect (Performance-Focused)

### High Value Data Types

| Type | DB Table | Example Content |
|------|----------|-----------------|
| `dyno_result` | `car_dyno_runs` | "Made 450whp on E85 with FBO" |
| `lap_time` | `car_track_lap_times` | "1:42.5 at Laguna Seca on RE-71Rs" |
| `modification_build` | `community_insights` | Full mod list with parts and results |
| `modding_issue` | `car_issues` | "Rod bearings at 80k, was tuned on pump" |
| `suspension_setup` | `car_tuning_profiles` | Coilover specs, alignment settings |
| `brake_setup` | `car_tuning_profiles` | BBK details, pad compounds |
| `performance_data` | `community_insights` | 0-60, quarter mile times |

### What We DON'T Collect

- Generic "should I buy" advice
- Insurance/financing questions
- Color/wrap discussions
- Basic maintenance questions
- Detailing content

## Search Queries

For each car, we search Reddit for:

```
"[car identifier]" dyno          # Dyno results (most valuable)
"[car identifier]" build mods    # Mod lists and builds
"[car identifier]" track time    # Lap times, HPDE experiences
"[car identifier]" tuning problems  # Known issues when modded
```

Example for BMW M3 E92:
```
"E92 M3" dyno
"E92 M3" build mods
"E92 M3" track time
"E92 M3" tuning problems
```

## Usefulness Scoring

Posts are scored by data value:

| Content | Points |
|---------|--------|
| Dyno numbers mentioned | +10 |
| Lap times mentioned | +8 |
| Specific HP/torque numbers | +5 |
| Build/mod list details | +4 |
| Known issues when tuned | +4 |
| Suspension/brake setup | +3 |
| Generic "should I buy" | -5 |

**Minimum score to save: 3**

## Usage

```bash
# Run on priority vehicles (Tier 1-4)
npm run apify:reddit

# Tier 1 only (highest value vehicles)
npm run apify:reddit:tier1

# Single car
node scripts/apify/backfill-reddit-insights.mjs --car=bmw-m3-e92

# Dry run to preview
node scripts/apify/backfill-reddit-insights.mjs --car=subaru-wrx-sti-va --dry-run

# Include non-priority vehicles
node scripts/apify/backfill-reddit-insights.mjs --all
```

## Data Flow

```
Reddit Search → Apify Scraper → Filter by Relevance → 
Score by Usefulness → Extract Performance Numbers → 
Save to community_insights
```

## Performance Numbers Extraction

When found, we extract structured data:

```json
{
  "performance_numbers": {
    "horsepower": 450,
    "torque": 380,
    "zeroToSixty": 3.8,
    "quarterMile": 11.5,
    "trapSpeed": 125,
    "boostPsi": 22
  }
}
```

## Cost Estimate

- ~$0.50-1.00 per car (4 searches, ~60 results)
- Tier 1 vehicles (25 cars): ~$25
- All priority vehicles (108 cars): ~$100
- Full catalog (310 cars): ~$300

## Files

| File | Purpose |
|------|---------|
| `scripts/apify/backfill-reddit-insights.mjs` | Main enrichment script |
| `scripts/apify/priority-vehicles.mjs` | Priority tier definitions |
| `lib/apifyClient.js` | Apify client wrapper |
| `lib/redditInsightService.js` | Reddit → insights transformation |
