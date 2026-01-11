# Car Pipeline Coverage Audit

> **Last Updated:** January 11, 2026

## Overview

When a car is added to AutoRev, data should be populated across multiple tables. This document tracks what each pipeline covers.

## Table Coverage Matrix

| Table | Car Pipeline | Tuning Pipeline | YouTube Pipeline | Forum Pipeline | Manual/API |
|-------|:------------:|:---------------:|:----------------:|:--------------:|:----------:|
| **`cars`** | ✅ Created | — | — | — | — |
| **`car_tuning_profiles`** | ✅ Skeleton | ✅ **Enriched** | — | — | — |
| **`car_issues`** | ✅ AI-researched | — | — | ✅ Extracted | — |
| **`vehicle_maintenance_specs`** | ✅ AI-researched | — | — | — | — |
| **`vehicle_service_intervals`** | ✅ AI-researched | — | — | — | — |
| **`car_fuel_economy`** | ✅ EPA API call | — | — | — | — |
| **`car_safety_data`** | ✅ NHTSA API call | — | — | — | — |
| **`car_recalls`** | ⚠️ Fetched only | — | — | — | ✅ Cron job |
| **`car_variants`** | ❌ Not created | — | — | — | ✅ Manual |
| **`car_market_pricing`** | ❌ Not created | — | — | — | ✅ Scraper |
| **`car_dyno_runs`** | ❌ Not created | — | — | ✅ Extracted | ✅ User submit |
| **`car_track_lap_times`** | ❌ Not created | — | — | — | ✅ User submit |
| **`youtube_videos`** | ⚠️ Queued | — | ✅ Processed | — | — |
| **`youtube_video_car_links`** | ⚠️ Queued | ✅ Linked | ✅ Created | — | — |
| **`document_chunks`** | ❌ Not created | — | — | — | ✅ Ingestion |
| **`community_insights`** | ❌ Not created | — | — | ✅ Created | — |
| **`car_pipeline_runs`** | ✅ Tracking | — | — | — | — |

## Pipeline Responsibilities

### 1. Car Pipeline (`ai-research-car.js`)
**Purpose:** Initial car creation with all core data

**Creates:**
- `cars` - Full record with 140 columns of specs, scores, editorial
- `car_issues` - AI-researched known problems (typically 10-20 per car)
- `vehicle_maintenance_specs` - Oil, fluids, tire specs
- `vehicle_service_intervals` - Service schedules with costs
- `car_tuning_profiles` - **Skeleton** with `data_quality_tier: 'templated'`
- `car_fuel_economy` - Via EPA API call during enrichment
- `car_safety_data` - Via NHTSA API call during enrichment
- `car_pipeline_runs` - Progress tracking

**Queues for later:**
- YouTube videos (adds to `youtube_ingestion_queue`)

### 2. Tuning Pipeline (`run-pipeline.mjs`)
**Purpose:** Enhance tuning shop data

**Updates:**
- `car_tuning_profiles`:
  - `upgrades_by_objective` (SOURCE OF TRUTH)
  - `platform_insights`
  - `stage_progressions` (legacy)
  - `tuning_platforms`
  - `power_limits`
  - `brand_recommendations`
  - `data_quality_tier` → upgraded to 'enriched' or 'researched'

**Links:**
- `youtube_videos.car_id` - Links existing videos to car

### 3. YouTube Pipeline (`youtube-discovery.js`, `youtube-process-all-cars.js`)
**Purpose:** Discover and process video content

**Creates:**
- `youtube_videos` - Video metadata, transcripts, AI analysis
- `youtube_video_car_links` - Video-to-car relationships

### 4. Forum Pipeline (`forum-scraper.js`, `insight-extractor.js`)
**Purpose:** Extract community knowledge

**Creates:**
- `community_insights` - Structured insights from forums
- May add to `car_issues` if new issues discovered
- May add to `car_dyno_runs` if dyno data found

## Complete Car Addition Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: CAR PIPELINE                                                        │
│ node scripts/car-pipeline/ai-research-car.js "BMW M3 Competition (G80)"    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Creates:                                                                    │
│  ✅ cars (140 columns - specs, scores, editorial)                          │
│  ✅ car_issues (10-20 known problems)                                      │
│  ✅ vehicle_maintenance_specs (oil, fluids, tires)                         │
│  ✅ vehicle_service_intervals (schedules + costs)                          │
│  ✅ car_fuel_economy (EPA data)                                            │
│  ✅ car_safety_data (NHTSA ratings)                                        │
│  ✅ car_tuning_profiles (skeleton - templated tier)                        │
│  ⏳ youtube_ingestion_queue (videos queued for processing)                 │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: TUNING PIPELINE                                                     │
│ node scripts/tuning-pipeline/run-pipeline.mjs --car-slug bmw-m3-g80        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Updates:                                                                    │
│  ✅ car_tuning_profiles.upgrades_by_objective (SOURCE OF TRUTH)            │
│  ✅ car_tuning_profiles.platform_insights                                  │
│  ✅ car_tuning_profiles.stage_progressions (legacy)                        │
│  ✅ car_tuning_profiles.tuning_platforms                                   │
│  ✅ car_tuning_profiles.power_limits                                       │
│  ✅ car_tuning_profiles.brand_recommendations                              │
│  ✅ car_tuning_profiles.data_quality_tier → 'enriched' or 'researched'     │
│  🔗 youtube_videos.car_id (links existing videos to this car)              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: YOUTUBE PIPELINE (runs weekly via cron, or manually)               │
│ node scripts/youtube-process-all-cars.js --car-slug bmw-m3-g80             │
├─────────────────────────────────────────────────────────────────────────────┤
│ Creates:                                                                    │
│  ✅ youtube_videos (transcripts, AI summaries)                             │
│  ✅ youtube_video_car_links (video-car relationships)                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: FORUM PIPELINE (runs bi-weekly via cron)                           │
│ Automatic - extracts insights from forum discussions                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Creates (if car has forum coverage):                                        │
│  ✅ community_insights (structured forum knowledge)                         │
│  ⚠️ car_dyno_runs (if dyno data found in forums)                           │
│  ⚠️ car_issues (if new issues discovered)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Unified Pipeline Command

For complete car addition with all core data:

```bash
# Creates car + enriches tuning shop in one command
node scripts/car-pipeline/add-car-complete.mjs "BMW M3 Competition (G80)"
```

## Data Not Automatically Populated

These tables require manual intervention or separate processes:

| Table | How to Populate |
|-------|-----------------|
| `car_variants` | Manual SQL or admin UI for specific trims/years |
| `car_market_pricing` | BaT/Cars.com scraper jobs |
| `car_dyno_runs` | User submissions, forum extraction |
| `car_track_lap_times` | User submissions, Fastestlaps scraper |
| `document_chunks` | Knowledge base ingestion pipeline |

## Quality Checklist After Car Addition

After running the complete pipeline, verify:

- [ ] `cars` record exists with all scores (1-10) populated
- [ ] `car_issues` has 5+ known issues
- [ ] `vehicle_maintenance_specs` has oil type, capacity
- [ ] `vehicle_service_intervals` has 5+ intervals
- [ ] `car_tuning_profiles.upgrades_by_objective` has upgrades
- [ ] `car_tuning_profiles.data_quality_tier` is 'enriched' or better
- [ ] `car_fuel_economy` exists (if EPA data available)
- [ ] `car_safety_data` exists (if NHTSA data available)
- [ ] YouTube videos are linked (check `youtube_video_car_links`)
