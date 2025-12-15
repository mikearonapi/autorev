# AutoRev Database Schema

> Complete reference for all 57 database tables
>
> **Last Synced:** December 15, 2024 — MCP-verified

---

## 🏆 Why This Database is Our Secret Sauce

AutoRev's database is a **curated, structured, enthusiast-focused data asset** that doesn't exist anywhere else:

| Unique Value | What Makes It Special |
|--------------|----------------------|
| **Enthusiast Scores** | 7 subjective scores (sound, track, reliability, etc.) — not available from any API |
| **Real Dyno Data** | Actual wheel HP/TQ measurements from real cars with mods documented |
| **Citeable Lap Times** | Track times with tire, weather, and driver context |
| **AI-Ready Knowledge** | 547 vector-embedded chunks for semantic search |
| **YouTube Intelligence** | 288 videos with AI-extracted pros/cons/summaries |
| **Parts + Fitments** | 642 parts with 836 verified car-specific fitments |
| **Maintenance Specs** | 130 columns of oil, fluid, tire specs per car |
| **Recall Data** | 241 NHTSA recall campaigns linked to cars |

---

## Data Coverage Dashboard

| Data Type | Coverage | Cars Covered | Notes |
|-----------|----------|--------------|-------|
| **Core Specs** | 100% | 98/98 | HP, price, images, all scores |
| **Fuel Economy** | 100% | 98/98 | EPA data |
| **Safety Ratings** | 100% | 98/98 | NHTSA + IIHS |
| **Maintenance Specs** | 100% | 98/98 | 130 columns per car |
| **Known Issues** | 51% | 50/98 | Prioritized by reliability score |
| **Recall Data** | 30% | 29/98 | NHTSA campaigns |
| **Market Pricing** | 10% | 10/98 | Expansion in progress |
| **Part Fitments** | ~15% | ~15/98 | Multi-brand expansion needed |

---

## Overview

| Category | Tables | Populated | Empty |
|----------|--------|-----------|-------|
| Core Car Data | 15 | 13 | 2 |
| Parts & Upgrades | 8 | 7 | 1 |
| User Data | 9 | 5 | 4 |
| Maintenance | 3 | 3 | 0 |
| AL (AI) | 5 | 4 | 1 |
| Knowledge Base | 2 | 2 | 0 |
| YouTube | 4 | 4 | 0 |
| Track Data | 2 | 1 | 1 |
| Forum Intelligence | 5 | 1 | 4 |
| System | 4 | 3 | 1 |
| **Total** | **57** | **41** | **16** |

> **Note:** `upgrade_education` data is in static file `data/upgradeEducation.js`, not a database table.
> `car_known_issues` was documented but never created; use `car_issues` instead.

---

## Core Car Data (15 tables)

> **Note:** Row counts updated December 14, 2024 via MCP Supabase query.

### `cars` — Main vehicle database
| Status | **98 rows** |
|--------|------------|
| **Purpose** | Primary car database with all specs and scores |
| **Columns** | 139 columns |
| **Key Fields** | `id`, `slug`, `name`, `years`, `brand`, `tier`, `category`, `engine`, `hp`, `torque`, `trans`, `drivetrain`, `curb_weight`, `zero_to_sixty`, `price_avg`, `price_range` |
| **Score Fields** | `score_sound`, `score_interior`, `score_track`, `score_reliability`, `score_value`, `score_driver_fun`, `score_aftermarket` |
| **Used By** | Every car-related page and API |

### `car_variants` — Year/trim variants
| Status | **102 rows** |
|--------|-------------|
| **Purpose** | Specific year/trim combinations for VIN matching |
| **Key Fields** | `id`, `car_id`, `car_slug`, `variant_key`, `model_year`, `trim_level`, `engine_code` |
| **Used By** | VIN decode, variant-specific maintenance |

### `car_fuel_economy` — EPA fuel data
| Status | **98 rows** |
|--------|------------|
| **Purpose** | EPA efficiency data |
| **Key Fields** | `car_slug`, `city_mpg`, `highway_mpg`, `combined_mpg`, `fuel_type`, `annual_fuel_cost`, `co2_emissions`, `ghg_score`, `is_electric`, `is_hybrid`, `ev_range` |
| **Used By** | Car detail Ownership tab, AL |

### `car_safety_data` — NHTSA/IIHS ratings
| Status | **98 rows** |
|--------|------------|
| **Purpose** | Safety ratings from NHTSA and IIHS |
| **Key Fields** | `car_slug`, `nhtsa_overall_rating`, `nhtsa_front_crash_rating`, `nhtsa_side_crash_rating`, `nhtsa_rollover_rating`, `recall_count`, `complaint_count`, `iihs_overall`, `iihs_top_safety_pick`, `safety_score`, `safety_grade` |
| **Used By** | Car detail Buying tab, AL |

### `car_issues` — Known problems
| Status | **154 rows** |
|--------|-------------|
| **Purpose** | Documented known issues and common problems |
| **Key Fields** | `car_slug`, `title`, `kind`, `severity`, `affected_years_text`, `description`, `symptoms`, `prevention`, `fix_description`, `estimated_cost_text`, `source_url` |
| **Used By** | Car detail, AL `get_known_issues` tool |

### `car_market_pricing` — Current market values
| Status | **10 rows** |
|--------|------------|
| **Purpose** | Aggregated market values from BaT, Cars.com, Hagerty |
| **Key Fields** | `car_slug`, `avg_price`, `min_price`, `max_price`, `bat_avg`, `carscom_avg`, `hagerty_condition_1` through `hagerty_condition_4`, `trend_direction`, `confidence` |
| **Used By** | My Garage Value tab, AL |

### `car_market_pricing_years` — Price by model year
| Status | **23 rows** |
|--------|-------------|
| **Purpose** | Market pricing broken down by model year |
| **Key Fields** | `car_slug`, `model_year`, `avg_price`, `min_price`, `max_price`, `sample_size`, `avg_mileage` |
| **Used By** | Car detail Buying tab |

### `car_price_history` — Historical trends
| Status | **7 rows** |
|--------|-----------|
| **Purpose** | Price tracking over time |
| **Key Fields** | `car_slug`, `recorded_at`, `avg_price`, `min_price`, `max_price`, `sample_size` |
| **Used By** | My Garage Value tab (Collector tier) |

### `car_dyno_runs` — Real dyno data
| Status | **29 rows** |
|--------|------------|
| **Purpose** | Actual dyno measurements from real cars |
| **Key Fields** | `car_slug`, `run_kind` (baseline/modded), `dyno_type`, `peak_whp`, `peak_wtq`, `peak_hp`, `peak_tq`, `boost_psi_max`, `fuel`, `modifications`, `source_url`, `verified` |
| **Used By** | Tuning Shop (Tuner tier), AL `get_dyno_runs` tool |

### `car_track_lap_times` — Track benchmarks
| Status | **65 rows** |
|--------|------------|
| **Purpose** | Real lap times from actual track sessions |
| **Key Fields** | `car_slug`, `track_venue_id`, `layout_key`, `lap_time_ms`, `lap_time_text`, `session_date`, `is_stock`, `tires`, `conditions`, `modifications`, `source_url`, `verified` |
| **Used By** | Tuning Shop (Tuner tier), AL `get_track_lap_times` tool |

### `car_expert_reviews` — Expert review metadata
| Status | **0 rows** (empty) |
|--------|-------------------|
| **Purpose** | Structured expert review data (separate from YouTube) |
| **Future Use** | Written reviews, magazine content |

### `car_manual_data` — Manual spec data
| Status | **0 rows** (empty) |
|--------|-------------------|
| **Purpose** | Manually entered specifications |
| **Future Use** | Override/supplement automated data |

### `car_recalls` — Recall information
| Status | **241 rows** |
|--------|--------------|
| **Purpose** | NHTSA recall campaign data per car |
| **Key Fields** | `car_slug`, `recall_campaign_number`, `recall_date`, `component`, `summary`, `consequence`, `remedy`, `manufacturer`, `source_url`, `is_incomplete` |
| **Used By** | Car detail pages, AL `get_known_issues` tool |

### `car_auction_results` — Auction sale data
| Status | **0 rows** (empty) |
|--------|-------------------|
| **Purpose** | Individual auction results (BaT, etc.) |
| **Future Use** | Detailed market analysis, price justification |

### `car_known_issues` — DEPRECATED
| Status | **Does not exist as table** |
|--------|----------------------------|
| **Note** | This was documented but never created. AL `get_known_issues` uses `car_issues` and `vehicle_known_issues` tables instead. |
| **Used By** | AL queries `car_issues` table directly |

---

## Parts & Upgrades (8 tables)

### `parts` — Parts catalog
| Status | **642 rows** |
|--------|-------------|
| **Purpose** | Aftermarket and OEM+ parts database |
| **Key Fields** | `id`, `name`, `brand_name`, `part_number`, `category`, `description`, `quality_tier`, `street_legal`, `is_active`, `source_urls` |
| **Categories** | intake, exhaust, tune, suspension, brakes, cooling, etc. |
| **Used By** | Tuning Shop, AL `search_parts` tool |

### `part_fitments` — Car-to-part mapping
| Status | **836 rows** |
|--------|-------------|
| **Purpose** | Which parts fit which cars |
| **Key Fields** | `part_id`, `car_id`, `fitment_notes`, `requires_tune`, `install_difficulty`, `estimated_labor_hours`, `verified`, `confidence`, `source_url` |
| **Used By** | Parts search with car filter |

### `part_pricing_snapshots` — Price tracking
| Status | **173 rows** |
|--------|-------------|
| **Purpose** | Historical price data from vendors |
| **Key Fields** | `part_id`, `price_cents`, `currency`, `recorded_at`, `product_url`, `vendor_name` |
| **Used By** | AL parts recommendations, build cost estimates |

### `part_relationships` — Compatibility
| Status | **38 rows** |
|--------|------------|
| **Purpose** | Which parts work well together |
| **Key Fields** | `part_id`, `related_part_id`, `relation_type`, `reason` |
| **Columns** | `id`, `part_id` (FK→parts), `related_part_id` (FK→parts), `relation_type` (enum: requires/suggests/conflicts), `reason` (text), `metadata` (JSONB), `created_at` |
| **Used By** | Build planning, compatibility checks |
| **Note** | Column names are `part_id`/`related_part_id`/`relation_type` (not `part_id_a`/`part_id_b`/`relationship_type`) |

### `part_brands` — Brand metadata
| Status | **3 rows** |
|--------|----------|
| **Purpose** | Brand information |
| **Key Fields** | `name`, `quality_tier`, `website_url` |

### `upgrade_keys` — Upgrade reference
| Status | **49 rows** |
|--------|------------|
| **Purpose** | Canonical upgrade definitions |
| **Key Fields** | `key`, `name`, `category`, `description` |
| **Used By** | Encyclopedia, AL upgrade info |

### `upgrade_packages` — Curated bundles
| Status | **42 rows** |
|--------|------------|
| **Purpose** | Pre-built upgrade packages (Street Sport, Track Pack, Time Attack) |
| **Key Fields** | `name`, `tier`, `category`, `estimated_cost_low`, `estimated_cost_high`, `performance_deltas` |
| **Used By** | Tuning Shop package selection |

### `upgrade_key_parts` — Package contents
| Status | **0 rows** (empty) |
|--------|-------------------|
| **Purpose** | Link upgrade_keys to specific parts |
| **Future Use** | Show actual parts in upgrade packages |

### `upgrade_education` — STATIC DATA (Not a database table)
| Status | **Static file: `data/upgradeEducation.js`** |
|--------|---------------------------------------------|
| **Note** | This data is NOT stored in the database. It's a static JavaScript file with 49 upgrade education entries. |
| **Key Fields** | `key`, `slug`, `name`, `category`, `description`, `difficulty`, `skill_required`, `estimated_time`, `tools_needed`, `pros`, `cons`, `tips` |
| **Used By** | Encyclopedia, Tuning Shop |

### Encyclopedia Hierarchy — STATIC DATA (Not database tables)

The Encyclopedia uses a component-centric hierarchy stored in static JavaScript files:

| File | Purpose | Record Count |
|------|---------|--------------|
| `lib/encyclopediaHierarchy.js` | System → Topic structure | 10 systems, 136 topics (100% complete) |
| `data/upgradeEducation.js` | Modification articles | 49 entries |
| `lib/educationData.js` | Build goals and paths | 6 goals, 6 paths |
| `data/connectedTissueMatrix.js` | Legacy systems/nodes (still used) | 14 systems, ~60 nodes |

**Encyclopedia Topic Structure:**
```javascript
{
  slug: 'bore',
  name: 'Bore',
  component: 'engine-block',
  system: 'engine',
  definition: '...',
  howItWorks: '...',
  whyItMatters: '...',
  modPotential: '...',           // optional
  relatedUpgradeKeys: ['...'],   // links to upgrade_education
  status: 'complete' | 'stub'
}
```

**Upgrade Key Mapping:**
The `upgradeKeyToTopics` map in `lib/encyclopediaHierarchy.js` links existing upgrade keys to relevant topics:
```javascript
{
  'cold-air-intake': ['intake-design', 'map-maf-sensors'],
  'coilovers': ['coilover-adjustment'],
  'ecu-tune': ['ecu-basics', 'ignition-timing', 'flash-standalone'],
  // ... 49 total mappings
}
```

---

## User Data (9 tables)

### `user_profiles` — User settings
| Status | **2 rows** |
|--------|----------|
| **Purpose** | User preferences and subscription tier |
| **Key Fields** | `id` (auth.users FK), `display_name`, `subscription_tier`, `preferences` |
| **Used By** | Auth, tier gating |

### `user_favorites` — Saved cars
| Status | **3 rows** |
|--------|----------|
| **Purpose** | Cars saved to garage favorites |
| **Key Fields** | `user_id`, `car_slug`, `notes`, `created_at` |
| **Used By** | My Garage favorites |

### `user_projects` — Build projects
| Status | **4 rows** |
|--------|----------|
| **Purpose** | User's saved build projects |
| **Key Fields** | `user_id`, `car_slug`, `name`, `goal`, `budget`, `status` |
| **Used By** | Tuning Shop builds (Tuner tier) |

### `user_feedback` — User feedback
| Status | **1+ rows** |
|--------|-------------|
| **Purpose** | Beta and user feedback submitted through FeedbackWidget |
| **Key Fields** | `user_id`, `page_url`, `feedback_type`, `message`, `email` |
| **Beta Fields** | `category` (bug/feature/data/general/praise), `severity` (blocking/major/minor for bugs), `rating` (1-5), `user_tier`, `feature_context`, `resolved_at`, `resolved_by` |
| **Auto-Captured** | `browser_info` (JSONB), `screen_width`, `screen_height`, `session_id` |
| **Admin Fields** | `status`, `priority`, `internal_notes`, `assigned_to` |
| **Used By** | FeedbackWidget, FeedbackCorner, internal admin page |

### `user_vehicles` — Owned vehicles
| Status | **2 rows** |
|--------|----------|
| **Purpose** | User's owned vehicles with VIN |
| **Key Fields** | `user_id`, `car_slug`, `variant_id`, `vin`, `nickname`, `mileage`, `purchase_date`, `purchase_price` |
| **Used By** | Collector tier ownership features, My Garage |

### `user_service_logs` — Service records
| Status | **0 rows** (empty) |
|--------|-------------------|
| **Purpose** | Maintenance history for owned vehicles |
| **Key Fields** | `user_vehicle_id`, `service_type`, `service_date`, `mileage`, `cost`, `notes`, `shop_name` |
| **Future Use** | Collector tier service tracking |

### `user_project_parts` — Build part selections
| Status | **0 rows** (empty) |
|--------|-------------------|
| **Purpose** | Parts added to build projects |
| **Key Fields** | `project_id`, `part_id`, `quantity`, `status`, `notes` |
| **Future Use** | Tuner tier build details |

### `user_compare_lists` — Compare sessions
| Status | **0 rows** (empty) |
|--------|-------------------|
| **Purpose** | Saved comparison lists |
| **Future Use** | Collector tier compare feature |

### `user_activity` — Activity tracking
| Status | **0 rows** (empty) |
|--------|-------------------|
| **Purpose** | User engagement analytics |
| **Future Use** | Usage insights |

---

## Maintenance (3 tables)

### `vehicle_maintenance_specs` — Fluid/capacity specs
| Status | **98 rows** |
|--------|------------|
| **Purpose** | Oil, coolant, brake fluid, tire specs per car |
| **Columns** | 130 columns (comprehensive!) |
| **Key Fields** | `car_slug`, `oil_type`, `oil_viscosity`, `oil_capacity_liters`, `oil_change_interval_miles`, `coolant_type`, `brake_fluid_type`, `tire_size_front`, `tire_size_rear`, `tire_pressure_front_psi` |
| **Used By** | Owner's Reference, AL `get_maintenance_schedule` tool |

### `vehicle_service_intervals` — Service schedules
| Status | **976 rows** |
|--------|-------------|
| **Purpose** | When each service is due |
| **Key Fields** | `car_slug`, `service_name`, `interval_miles`, `interval_months`, `category`, `estimated_cost_low`, `estimated_cost_high` |
| **Used By** | Service reminders |

### `vehicle_known_issues` — Common problems
| Status | **89 rows** |
|--------|------------|
| **Purpose** | Duplicate/legacy of `car_issues` |
| **Note** | May be consolidated with `car_issues` |

---

## AL/AI Assistant (5 tables)

### `al_conversations` — Chat sessions
| Status | **7 rows** |
|--------|----------|
| **Purpose** | AL conversation metadata |
| **Key Fields** | `id`, `user_id`, `title`, `car_context_slug`, `message_count`, `created_at`, `last_message_at` |

### `al_messages` — Chat messages
| Status | **33 rows** |
|--------|-----------|
| **Purpose** | Individual messages in conversations |
| **Key Fields** | `conversation_id`, `role` (user/assistant), `content`, `tool_calls`, `token_count_input`, `token_count_output`, `cost_cents` |

### `al_user_credits` — Credit balances
| Status | **2 rows** |
|--------|----------|
| **Purpose** | User's AL usage balance in cents |
| **Key Fields** | `user_id`, `balance_cents`, `lifetime_spent_cents`, `lifetime_earned_cents`, `plan_id` |

### `al_usage_logs` — Usage tracking
| Status | **3 rows** |
|--------|----------|
| **Purpose** | Detailed AL usage logging |
| **Key Fields** | `user_id`, `message_id`, `input_tokens`, `output_tokens`, `cost_cents`, `tool_calls_count` |

### `al_credit_purchases` — Purchase history
| Status | **0 rows** (empty) |
|--------|-------------------|
| **Purpose** | Credit/top-up purchase records |
| **Future Use** | Payment integration |

---

## Knowledge Base (2 tables)

### `source_documents` — Document sources
| Status | **54 rows** |
|--------|------------|
| **Purpose** | Ingested documents (guides, transcripts) |
| **Key Fields** | `id`, `title`, `url`, `source_type`, `car_id`, `content_hash` |

### `document_chunks` — Vector embeddings
| Status | **547 rows** |
|--------|-------------|
| **Purpose** | Chunked content with embeddings for semantic search |
| **Key Fields** | `document_id` (FK→source_documents), `chunk_index`, `chunk_text`, `embedding`, `topic` |
| **Columns** | `id`, `document_id` (FK→source_documents), `car_id`, `car_slug`, `chunk_index`, `chunk_text`, `chunk_tokens`, `topic`, `embedding_model`, `embedding` (vector), `metadata` (JSONB), `created_at`, `updated_at` |
| **Used By** | AL `search_knowledge` tool |
| **Note** | Column is `document_id` (not `source_document_id`) |

---

## YouTube (4 tables)

### `youtube_videos` — Video metadata
| Status | **288 rows** |
|--------|-------------|
| **Purpose** | YouTube video details and AI summaries |
| **Key Fields** | `youtube_id`, `title`, `channel_name`, `url`, `duration_seconds`, `summary`, `one_line_take`, `key_points`, `pros_mentioned`, `cons_mentioned`, `notable_quotes` |

### `youtube_video_car_links` — Video-to-car mapping
| Status | **291 rows** |
|--------|-------------|
| **Purpose** | Which videos are about which cars |
| **Key Fields** | `video_id`, `car_id`, `relevance_score`, `review_type` |
| **Used By** | Expert Reviews tab |

### `youtube_channels` — Channel metadata
| Status | **12 rows** |
|--------|------------|
| **Purpose** | Trusted YouTube channels |
| **Key Fields** | `channel_id`, `name`, `trust_score`, `expertise_areas` |
| **Channels** | Throttle House, Savagegeese, Doug DeMuro, etc. |

### `youtube_ingestion_queue` — Processing queue
| Status | **2 rows** |
|--------|----------|
| **Purpose** | Videos pending AI processing |

---

## Track Data (2 tables)

### `track_venues` — Track information
| Status | **21 rows** |
|--------|------------|
| **Purpose** | Track/circuit metadata |
| **Key Fields** | `slug`, `name`, `location`, `country`, `length_meters`, `turns` |

### `track_layouts` — Layout variants
| Status | **0 rows** (empty) |
|--------|-------------------|
| **Purpose** | Different configurations per track |
| **Future Use** | Multiple layouts per venue |

---

## Forum Intelligence (5 tables)

> **NEW:** Forum scraping and community insight extraction system.

### `forum_sources` — Forum registry
| Status | **6 rows** (seeded) |
|--------|---------------------|
| **Purpose** | Registry of forums to scrape with configuration |
| **Key Fields** | `slug`, `name`, `base_url`, `platform` (xenforo/vbulletin), `car_brands[]`, `car_slugs[]`, `scrape_config` (JSONB), `priority`, `is_active`, `last_scraped_at`, `total_threads_scraped`, `total_insights_extracted` |
| **Seeded Forums** | Rennlist, Bimmerpost, Miata.net, FT86Club, CorvetteForum, VWVortex |
| **Used By** | Forum scraper cron job |

### `forum_scrape_runs` — Scrape session tracking
| Status | **0 rows** (operational) |
|--------|--------------------------|
| **Purpose** | Track each scraping session for debugging |
| **Key Fields** | `forum_source_id`, `car_slug`, `run_type` (discovery/targeted/backfill), `status` (pending/running/completed/failed), `threads_found`, `threads_scraped`, `posts_scraped`, `insights_extracted`, `error_message` |
| **Used By** | Forum scraper, internal monitoring |

### `forum_scraped_threads` — Raw scraped content
| Status | **0 rows** (staging) |
|--------|----------------------|
| **Purpose** | Raw scraped forum threads awaiting AI extraction |
| **Key Fields** | `thread_url` (unique), `thread_title`, `subforum`, `posts` (JSONB array), `processing_status` (pending/processing/completed/failed/no_insights), `relevance_score`, `car_slugs_detected[]` |
| **Used By** | Insight extractor, internal processing |

### `community_insights` — Extracted insights (THE VALUE OUTPUT)
| Status | **0 rows** (building) |
|--------|-----------------------|
| **Purpose** | Structured insights extracted from forum content |
| **Key Fields** | `car_slug`, `insight_type`, `title`, `summary`, `details` (JSONB), `confidence` (0-1), `consensus_strength` (strong/moderate/single_source), `source_forum`, `source_urls[]`, `embedding` (vector 1536) |
| **Insight Types** | `known_issue`, `maintenance_tip`, `modification_guide`, `troubleshooting`, `buying_guide`, `performance_data`, `reliability_report`, `cost_insight`, `comparison` |
| **Used By** | AL `search_community_insights` tool |

### `community_insight_sources` — Multi-source tracking
| Status | **0 rows** (junction) |
|--------|-----------------------|
| **Purpose** | Links insights to multiple supporting forum threads |
| **Key Fields** | `insight_id`, `thread_id`, `thread_url`, `forum_slug`, `relevance_score`, `extracted_quotes[]` |
| **Used By** | Insight consolidation, citation tracking |

---

## System (4 tables + 1 materialized view)

### `cars_stats` — Aggregated car statistics (Materialized View)
| Status | **3 rows** |
|--------|-----------|
| **Type** | Materialized view (not a table) |
| **Purpose** | Pre-computed aggregate statistics by engine layout category |
| **Key Fields** | `category` (Front-Engine/Mid-Engine/Rear-Engine), `count`, `avg_price`, `avg_hp`, `min_price`, `max_price`, `avg_0_60` |
| **Used By** | Dashboard statistics, internal analytics |

### `scrape_jobs` — Data ingestion jobs
| Status | **107 rows** |
|--------|-------------|
| **Purpose** | Track scraping/enrichment jobs |
| **Key Fields** | `id`, `source`, `car_slug`, `status`, `result`, `error` |

### `fitment_tag_mappings` — Fitment normalization
| Status | **124 rows** |
|--------|-------------|
| **Purpose** | Map vendor fitment tags to cars |

### `leads` — Contact submissions
| Status | **0 rows** (empty) |
|--------|-------------------|
| **Purpose** | Contact form submissions |
| **Key Fields** | `email`, `name`, `source`, `interest`, `message`, `car_slug` |

### `car_variant_maintenance_overrides` — Variant-specific specs
| Status | **0 rows** (empty) |
|--------|-------------------|
| **Purpose** | Override maintenance specs for specific variants |
| **Future Use** | E.g., different oil capacity for Competition vs base |

---

## Data Population Summary

### Well Populated (80%+ coverage)
- `cars` (98/98) — 100%
- `car_safety_data` (98/98) — 100%
- `vehicle_maintenance_specs` (98/98) — 100%
- `car_fuel_economy` (98/98) — 100%
- `car_issues` (154 records)
- `car_recalls` (241 records)

### Significantly Expanded
- `parts` (642 records)
- `part_fitments` (836 records)
- `car_dyno_runs` (29 records)
- `car_track_lap_times` (65 records)
- `fitment_tag_mappings` (124 records)

### Partially Populated
- `car_market_pricing` (10/98 cars)
- `car_market_pricing_years` (23 records)

### Empty (Future Use)
| Table | Future Purpose |
|-------|----------------|
| `user_service_logs` | Collector tier service tracking |
| `user_project_parts` | Build project part selections |
| `user_compare_lists` | Saved comparison sessions |
| `car_auction_results` | Detailed BaT sale-by-sale data |
| `car_expert_reviews` | Written magazine reviews |
| `car_manual_data` | Manual spec overrides |
| `track_layouts` | Multiple track configurations |
| `upgrade_key_parts` | Link upgrades to specific parts |
| `al_credit_purchases` | Payment integration |

---

## Stored Procedures (RPCs)

AutoRev uses PostgreSQL functions for complex queries. These are called via `supabase.rpc()`.

### AL/AI Functions

| Function | Purpose | Used By |
|----------|---------|---------|
| `get_car_ai_context(p_car_slug)` | Single-call comprehensive car data | AL `get_car_ai_context` tool |
| `get_car_for_al(p_slug)` | Lightweight car data for AL | AL tools |
| `get_cars_for_al_query(p_query_type, p_params)` | Advanced filtered car queries | AL `search_cars` tool |
| `search_document_chunks(p_embedding, p_car_id, p_limit)` | Vector similarity search | AL `search_knowledge` tool |
| `search_community_insights(p_query_embedding, p_car_slug, p_insight_types, p_limit, p_min_confidence)` | Semantic search of forum insights | AL `search_community_insights` tool |
| `get_car_dyno_runs(p_car_slug, p_limit, p_include_curve)` | Dyno data with optional curve | AL `get_dyno_runs` tool |
| `get_car_track_lap_times(p_car_slug, p_limit)` | Track lap times with venue info | AL `get_track_lap_times` tool |
| `get_car_maintenance_summary(p_car_slug)` | Maintenance specs aggregation | AL `get_maintenance_schedule` tool |
| `get_car_maintenance_summary_variant(p_variant_key)` | Variant-specific maintenance | AL with variant context |
| `create_al_conversation(p_user_id, ...)` | Start new AL chat session | `/api/ai-mechanic` |
| `add_al_message(p_conversation_id, ...)` | Add message to conversation | `/api/ai-mechanic` |
| `get_user_context_for_al(user_id_param)` | User's garage/preferences for AL | AL system prompt |
| `increment_forum_source_insights(p_forum_source_id, p_count)` | Update insight count for forum source | Insight extractor |

### Search Functions

| Function | Purpose | Used By |
|----------|---------|---------|
| `search_cars_fulltext(search_query, max_results)` | PostgreSQL full-text search | Car search, AL |
| `search_cars_semantic(query_embedding, threshold, count)` | Vector similarity search | Semantic car search |
| `search_cars_advanced(search_query, filters, sort_by, ...)` | Complex filtered search | Browse cars page |
| `find_cars_by_criteria(p_budget_min, p_budget_max, ...)` | Criteria-based car finder | Car selector |
| `get_similar_cars(p_slug, match_count)` | Find similar cars | Car detail page |

### Data Functions

| Function | Purpose | Used By |
|----------|---------|---------|
| `compute_consensus_price(p_car_slug)` | Calculate market price consensus | Market pricing |
| `get_data_freshness(p_car_slug)` | Check when data was last updated | QA, staleness checks |
| `get_quick_car_stats()` | Dashboard statistics | Admin dashboard |
| `get_feedback_counts()` | Feedback analytics | Feedback review |
| `resolve_car_and_variant_from_vin_decode(...)` | Match VIN decode to car/variant | VIN decode flow |
| `parse_years_range(p_years)` | Parse "2015-2020" to year array | Data normalization |

### Triggers

| Function | Purpose | Trigger On |
|----------|---------|------------|
| `handle_new_user()` | Initialize user profile, AL credits | `auth.users` INSERT |
| `update_updated_at_column()` | Auto-update `updated_at` | Various tables UPDATE |

---

## Foreign Key Relationships

The database uses 64 foreign key constraints. Key relationship patterns:

### Cars as Central Entity

```
                    ┌─────────────────┐
                    │      cars       │
                    │  (id, slug)     │
                    └────────┬────────┘
                             │
    ┌────────────────────────┼────────────────────────┐
    │                        │                        │
    ▼                        ▼                        ▼
┌─────────┐         ┌─────────────────┐      ┌───────────────┐
│variants │         │ enrichment data │      │ relationships │
│(car_id) │         │ (car_slug)      │      │ (car_id)      │
└─────────┘         └─────────────────┘      └───────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
   car_fuel_economy   car_safety_data   car_issues
   car_recalls        car_market_*      car_dyno_runs
   car_track_lap_times                  youtube_video_car_links
```

### Parts Relationships

```
┌───────────────┐      ┌─────────────────┐      ┌──────────────┐
│  part_brands  │◄─────│     parts       │─────►│part_fitments │
│   (id)        │      │ (id, brand_id)  │      │ (part_id,    │
└───────────────┘      └────────┬────────┘      │  car_id)     │
                                │               └──────────────┘
                 ┌──────────────┼──────────────┐
                 │              │              │
                 ▼              ▼              ▼
        part_pricing    part_relationships    upgrade_key_parts
        _snapshots      (part_id,             (part_id,
        (part_id)       related_part_id)      upgrade_key)
```

### User Data Relationships

```
┌─────────────────┐
│  auth.users     │
│    (id)         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ user_profiles   │◄──── AL credits, preferences
│    (id)         │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬────────────┐
    │         │            │            │
    ▼         ▼            ▼            ▼
user_      user_       user_        al_
favorites  vehicles    projects     conversations
                          │              │
                          ▼              ▼
                    user_project_   al_messages
                    parts
```

---

## Data Sources & Refresh

| Data Type | Source | Refresh Schedule | Method |
|-----------|--------|------------------|--------|
| **Car Specs** | Manual curation + APIs | As needed | Manual + scripts |
| **Fuel Economy** | EPA API | On demand | `/api/cars/[slug]/fuel-economy` |
| **Safety Ratings** | NHTSA API | On demand | `/api/cars/[slug]/safety` |
| **Recalls** | NHTSA API | Weekly (Sun 2:30am) | `/api/cron/refresh-recalls` |
| **YouTube Videos** | YouTube Data API | Weekly (Mon 4am) | `/api/cron/youtube-enrichment` |
| **Parts Catalog** | Vendor APIs (Shopify) | Weekly (Sun 2am) | `/api/cron/schedule-ingestion` |
| **Market Pricing** | Scrapers (BaT, Cars.com) | Manual | Scrape jobs |
| **Knowledge Base** | Manual ingestion | As needed | `/api/internal/knowledge/ingest` |

---

## Performance Indexes

Critical indexes for query performance:

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| `cars` | `cars_slug_key` | UNIQUE | Primary slug lookup |
| `cars` | `cars_search_vector_idx` | GIN | Full-text search |
| `cars` | `cars_embedding_idx` | HNSW | Vector similarity |
| `document_chunks` | `document_chunks_embedding_idx` | HNSW | Knowledge base search |
| `part_fitments` | `idx_part_fitments_car_id` | BTREE | Parts by car |
| `part_fitments` | `idx_part_fitments_part_id` | BTREE | Fitments by part |
| `youtube_video_car_links` | `idx_youtube_video_car_links_car_id` | BTREE | Videos by car |

---

## Row Level Security (RLS)

| Table Pattern | Policy | Access |
|---------------|--------|--------|
| `cars`, `parts`, `youtube_*` | Public read | Anyone can read |
| `user_*` | User owns row | `auth.uid() = user_id` |
| `al_conversations`, `al_messages` | User owns row | `auth.uid() = user_id` |
| Internal tables (`scrape_jobs`) | Service role only | Admin/cron only |

---

## Column Counts by Table

For reference, here are the column counts per table:

| Table | Columns | Notable Fields |
|-------|---------|----------------|
| `cars` | **139** | Most comprehensive — specs, scores, AI embeddings |
| `vehicle_maintenance_specs` | **130** | Oil, coolant, brake fluid, tires, etc. |
| `youtube_videos` | **39** | Video metadata + AI-extracted insights |
| `upgrade_packages` | **30** | Package configs + performance deltas |
| `car_dyno_runs` | **30** | Dyno measurements + mod context |
| `car_market_pricing` | **30** | Multi-source price aggregation |
| `car_safety_data` | **29** | NHTSA + IIHS ratings |
| `user_vehicles` | **26** | VIN, ownership, mileage tracking |

---

*See [API.md](API.md) for how to access this data.*


