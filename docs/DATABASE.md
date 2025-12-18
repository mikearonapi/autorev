# AutoRev Database Schema

> Complete reference for all 68 database tables
>
> **Last Verified:** December 18, 2024 — MCP-verified live query (Row counts audited)

---

## 🏆 Why This Database is Our Secret Sauce

AutoRev's database is a **curated, structured, enthusiast-focused data asset** that doesn't exist anywhere else:

| Unique Value | What Makes It Special |
|--------------|----------------------|
| **Enthusiast Scores** | 7 subjective scores (sound, track, reliability, etc.) — not available from any API |
| **Real Dyno Data** | Actual wheel HP/TQ measurements from real cars with mods documented |
| **Citeable Lap Times** | Track times with tire, weather, and driver context |
| **AI-Ready Knowledge** | 683 vector-embedded chunks for semantic search |
| **YouTube Intelligence** | 288 videos with AI-extracted pros/cons/summaries |
| **Parts + Fitments** | 642 parts with 836 verified car-specific fitments |
| **Maintenance Specs** | 130 columns of oil, fluid, tire specs per car |
| **Recall Data** | 469 NHTSA recall campaigns linked to cars |
| **Community Insights** | 1,226 forum-extracted insights (⚠️ Porsche-only currently) |
| **Events** | 7,730 car events |

---

## Data Coverage Dashboard

| Data Type | Coverage | Cars/Records | Gap Priority |
|-----------|----------|--------------|--------------|
| **Core Specs** | ✅ 100% | 98/98 | — |
| **Fuel Economy** | ✅ 100% | 98/98 | — |
| **Safety Ratings** | ✅ 100% | 98/98 | — |
| **Maintenance Specs** | ✅ 100% | 98/98 | — |
| **Service Intervals** | ✅ 100% | 976 records | — |
| **Known Issues** | ✅ 100% | 1,201 records | — |
| **Recall Data** | ~50% | 469 records | P2 |
| **Market Pricing** | ⚠️ 10% | 10/98 cars | P1 - Critical |
| **Part Fitments** | ⚠️ ~15% | 836 fitments | P1 - Critical |
| **Dyno Runs** | ⚠️ ~30% | 29 runs | P2 |
| **Lap Times** | ⚠️ ~20% | 65 records | P2 |
| **Community Insights** | ⚠️ 10% cars | 1,226 insights | P1 - Porsche only |
| **Events** | ⚠️ Low | 55 events | P1 - Needs re-ingestion |
| **YouTube Reviews** | ~60% | 288 videos | P3 |

---

## Overview

| Category | Tables | Populated | Empty |
|----------|--------|-----------|-------|
| Core Car Data | 16 | 14 | 2 |
| Parts & Upgrades | 8 | 7 | 1 |
| User Data | 9 | 5 | 4 |
| Maintenance | 3 | 3 | 0 |
| AL (AI) | 5 | 4 | 1 |
| Knowledge Base | 2 | 2 | 0 |
| YouTube | 4 | 4 | 0 |
| Track Data | 2 | 1 | 1 |
| Forum Intelligence | 5 | 5 | 0 |
| Events | 6 | 4 | 2 |
| Event Coverage | 1 | 1 | 0 |
| Image Library | 2 | 0 | 2 |
| System | 5 | 4 | 1 |
| **Total** | **68** | **53** | **15** |

> **Note:** `upgrade_education` data is in static file `data/upgradeEducation.js`, not a database table.
> `car_known_issues` was documented but never created; use `car_issues` instead.

---

## Core Car Data (16 tables)

> **Note:** Row counts verified December 18, 2024 via MCP Supabase query.

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
| **Key Fields** | `id`, `car_id`, `variant_key`, `display_name`, `model_year_start`, `model_year_end`, `trim`, `drivetrain`, `transmission`, `engine` |
| **Used By** | VIN decode, variant-specific maintenance |

### `car_fuel_economy` — EPA fuel data
| Status | **98 rows** ✅ |
|--------|--------------|
| **Purpose** | EPA efficiency data |
| **Key Fields** | `car_slug`, `city_mpg`, `highway_mpg`, `combined_mpg`, `fuel_type`, `annual_fuel_cost`, `co2_emissions`, `ghg_score`, `is_electric`, `is_hybrid`, `ev_range` |
| **Used By** | Car detail Ownership tab, AL |

### `car_safety_data` — NHTSA/IIHS ratings
| Status | **98 rows** ✅ |
|--------|--------------|
| **Purpose** | Safety ratings from NHTSA and IIHS |
| **Key Fields** | `car_slug`, `nhtsa_overall_rating`, `nhtsa_front_crash_rating`, `nhtsa_side_crash_rating`, `nhtsa_rollover_rating`, `recall_count`, `complaint_count`, `iihs_overall`, `iihs_top_safety_pick`, `safety_score`, `safety_grade` |
| **Used By** | Car detail Buying tab, AL |

### `car_issues` — Known problems
| Status | **1,201 rows** ✅ |
|--------|------------------|
| **Purpose** | Documented known issues and common problems |
| **Key Fields** | `car_slug`, `title`, `kind`, `severity`, `affected_years_text`, `description`, `symptoms`, `prevention`, `fix_description`, `estimated_cost_text`, `source_url` |
| **Used By** | Car detail, AL `get_known_issues` tool |

### `car_market_pricing` — Current market values
| Status | **10 rows** ⚠️ |
|--------|----------------|
| **Purpose** | Aggregated market values from BaT, Cars.com, Hagerty |
| **Key Fields** | `car_slug`, `bat_avg_price`, `bat_median_price`, `carscom_avg_price`, `hagerty_concours`, `hagerty_excellent`, `hagerty_good`, `hagerty_fair`, `consensus_price`, `market_trend` |
| **Used By** | My Garage Value tab, AL |
| **Gap Note** | Only 10/98 cars have pricing data. P1 priority for expansion. |

### `car_market_pricing_years` — Price by model year
| Status | **23 rows** ⚠️ |
|--------|---------------|
| **Purpose** | Market pricing broken down by model year |
| **Key Fields** | `car_slug`, `source`, `year`, `median_price`, `average_price`, `min_price`, `max_price`, `listing_count` |
| **Used By** | Car detail Buying tab |

### `car_price_history` — Historical trends
| Status | **7 rows** |
|--------|-----------|
| **Purpose** | Price tracking over time |
| **Key Fields** | `car_slug`, `source`, `price`, `recorded_at` |
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
| **Key Fields** | `car_slug`, `track_id`, `lap_time_ms`, `lap_time_text`, `session_date`, `is_stock`, `tires`, `conditions`, `modifications`, `source_url`, `verified` |
| **Used By** | Tuning Shop (Tuner tier), AL `get_track_lap_times` tool |

### `car_expert_reviews` — Expert review metadata
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Structured expert review data (separate from YouTube) |
| **Future Use** | Written reviews, magazine content |

### `car_manual_data` — Manual spec data
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Manually entered specifications |
| **Future Use** | Override/supplement automated data |

### `car_recalls` — Recall information
| Status | **469 rows** ✅ |
|--------|----------------|
| **Purpose** | NHTSA recall campaign data per car |
| **Key Fields** | `car_slug`, `campaign_number`, `recall_campaign_number`, `recall_date`, `component`, `summary`, `consequence`, `remedy`, `manufacturer`, `source_url`, `is_incomplete` |
| **Used By** | Car detail pages, AL `get_known_issues` tool |

### `car_auction_results` — Auction sale data
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Individual auction results (BaT, etc.) |
| **Future Use** | Detailed market analysis, price justification |

### `car_slug_aliases` — Slug redirects
| Status | **35 rows** |
|--------|------------|
| **Purpose** | Map alternate slugs to canonical car slugs |
| **Key Fields** | `alias`, `canonical_slug` |
| **Used By** | URL redirects, search normalization |

### `car_known_issues` — DEPRECATED
| Status | **Does not exist as table** |
|--------|----------------------------|
| **Note** | This was documented but never created. AL `get_known_issues` uses `car_issues` and `vehicle_known_issues` tables instead. |

---

## Parts & Upgrades (8 tables)

### `parts` — Parts catalog
| Status | **642 rows** ✅ |
|--------|----------------|
| **Purpose** | Aftermarket and OEM+ parts database |
| **Key Fields** | `id`, `name`, `brand_name`, `part_number`, `category`, `description`, `quality_tier`, `street_legal`, `is_active`, `source_urls` |
| **Categories** | intake, exhaust, tune, suspension, brakes, cooling, etc. |
| **Used By** | Tuning Shop, AL `search_parts` tool |

### `part_fitments` — Car-to-part mapping
| Status | **836 rows** ✅ |
|--------|----------------|
| **Purpose** | Which parts fit which cars |
| **Key Fields** | `part_id`, `car_id`, `car_variant_id`, `fitment_notes`, `requires_tune`, `install_difficulty`, `estimated_labor_hours`, `verified`, `confidence`, `source_url` |
| **Used By** | Parts search with car filter |

### `part_pricing_snapshots` — Price tracking
| Status | **172 rows** |
|--------|-------------|
| **Purpose** | Historical price data from vendors |
| **Key Fields** | `part_id`, `vendor_name`, `vendor_url`, `product_url`, `currency`, `price_cents`, `in_stock`, `recorded_at` |
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
| **Key Fields** | `name`, `website`, `country`, `notes` |

### `upgrade_keys` — Upgrade reference
| Status | **49 rows** |
|--------|------------|
| **Purpose** | Canonical upgrade definitions |
| **Key Fields** | `key`, `name`, `category`, `description`, `typical_cost_low`, `typical_cost_high` |
| **Used By** | Encyclopedia, AL upgrade info |

### `upgrade_packages` — Curated bundles
| Status | **42 rows** |
|--------|------------|
| **Purpose** | Pre-built upgrade packages (Street Sport, Track Pack, Time Attack) |
| **Key Fields** | `name`, `tier`, `category`, `estimated_cost_low`, `estimated_cost_high`, delta fields for performance |
| **Used By** | Tuning Shop package selection |

### `upgrade_key_parts` — Package contents
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Link upgrade_keys to specific parts |
| **Future Use** | Show actual parts in upgrade packages |

### Encyclopedia Hierarchy — STATIC DATA (Not database tables)

The Encyclopedia uses a component-centric hierarchy stored in static JavaScript files:

| File | Purpose | Record Count |
|------|---------|--------------|
| `lib/encyclopediaHierarchy.js` | System → Topic structure | 9 systems, 136 topics (100% complete) |
| `data/upgradeEducation.js` | Modification articles | 49 entries |
| `lib/educationData.js` | Build goals and paths | 6 goals, 6 paths |
| `data/connectedTissueMatrix.js` | Legacy systems/nodes (still used) | 14 systems, ~60 nodes |

---

## User Data (9 tables)

### `user_profiles` — User settings
| Status | **2 rows** |
|--------|----------|
| **Purpose** | User preferences and subscription tier |
| **Key Fields** | `id` (auth.users FK), `display_name`, `avatar_url`, `subscription_tier`, `preferred_units`, `email_notifications` |
| **Used By** | Auth, tier gating |

### `user_favorites` — Saved cars
| Status | **10 rows** |
|--------|----------|
| **Purpose** | Cars saved to garage favorites |
| **Key Fields** | `user_id`, `car_slug`, `car_id`, `car_name`, `notes`, `created_at` |
| **Used By** | My Garage favorites |

### `user_projects` — Build projects
| Status | **4 rows** |
|--------|----------|
| **Purpose** | User's saved build projects |
| **Key Fields** | `user_id`, `car_slug`, `car_id`, `project_name`, `selected_upgrades`, `total_hp_gain`, `total_cost_low`, `total_cost_high` |
| **Used By** | Tuning Shop builds (Tuner tier) |

### `user_feedback` — User feedback
| Status | **2 rows** |
|--------|-----------|
| **Purpose** | Beta and user feedback submitted through FeedbackWidget, plus automatic error logging |
| **Key Fields** | `user_id`, `page_url`, `feedback_type`, `message`, `email`, `category`, `severity`, `rating`, `user_tier`, `feature_context`, `status`, `error_metadata` |
| **Auto-Error Support** | `category = 'auto-error'` with `error_metadata` JSONB for client-side error capture |
| **Used By** | FeedbackWidget, FeedbackCorner, internal admin page, ErrorBoundary |

### `user_vehicles` — Owned vehicles
| Status | **4 rows** |
|--------|----------|
| **Purpose** | User's owned vehicles with VIN |
| **Key Fields** | `user_id`, `matched_car_slug`, `matched_car_id`, `matched_car_variant_id`, `vin`, `year`, `make`, `model`, `trim`, `nickname`, `mileage`, `purchase_date`, `purchase_price` |
| **Used By** | Collector tier ownership features, My Garage |

### `user_service_logs` — Service records
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Maintenance history for owned vehicles |
| **Key Fields** | `user_vehicle_id`, `service_type`, `service_date`, `odometer_reading`, `performed_by`, `shop_name`, `parts_cost`, `labor_cost`, `total_cost` |
| **Future Use** | Collector tier service tracking |

### `user_project_parts` — Build part selections
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Parts added to build projects |
| **Key Fields** | `project_id`, `part_id`, `quantity`, `part_name`, `brand_name`, `price_cents` |
| **Future Use** | Tuner tier build details |

### `user_compare_lists` — Compare sessions
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Saved comparison lists |
| **Future Use** | Collector tier compare feature |

### `user_activity` — Activity tracking
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | User engagement analytics |
| **Future Use** | Usage insights |

---

## Maintenance (3 tables)

### `vehicle_maintenance_specs` — Fluid/capacity specs
| Status | **98 rows** ✅ |
|--------|--------------|
| **Purpose** | Oil, coolant, brake fluid, tire specs per car |
| **Columns** | 130 columns (comprehensive!) |
| **Key Fields** | `car_slug`, `oil_type`, `oil_viscosity`, `oil_capacity_liters`, `oil_change_interval_miles`, `coolant_type`, `brake_fluid_type`, `tire_size_front`, `tire_size_rear`, `tire_pressure_front_psi` |
| **Used By** | Owner's Reference, AL `get_maintenance_schedule` tool |

### `vehicle_service_intervals` — Service schedules
| Status | **976 rows** ✅ |
|--------|---------------|
| **Purpose** | When each service is due |
| **Key Fields** | `car_slug`, `service_name`, `service_description`, `interval_miles`, `interval_months`, `dealer_cost_low`, `dealer_cost_high`, `diy_cost_low`, `diy_cost_high`, `is_critical` |
| **Used By** | Service reminders |

### `vehicle_known_issues` — Common problems
| Status | **89 rows** |
|--------|------------|
| **Purpose** | Structured known issues (complements `car_issues`) |
| **Key Fields** | `car_slug`, `issue_type`, `issue_title`, `issue_description`, `severity`, `fix_description`, `estimated_repair_cost_low`, `estimated_repair_cost_high` |

---

## AL/AI Assistant (5 tables)

### `al_conversations` — Chat sessions
| Status | **7 rows** |
|--------|----------|
| **Purpose** | AL conversation metadata |
| **Key Fields** | `id`, `user_id`, `title`, `summary`, `initial_car_slug`, `message_count`, `total_credits_used`, `last_message_at` |

### `al_messages` — Chat messages
| Status | **33 rows** |
|--------|-----------|
| **Purpose** | Individual messages in conversations |
| **Key Fields** | `conversation_id`, `role` (user/assistant), `content`, `tool_calls`, `credits_used`, `response_tokens`, `sequence_number` |

### `al_user_credits` — Credit balances
| Status | **2 rows** |
|--------|----------|
| **Purpose** | User's AL usage balance in cents |
| **Key Fields** | `user_id`, `subscription_tier`, `balance_cents`, `purchased_cents`, `spent_cents_this_month`, `input_tokens_this_month`, `output_tokens_this_month`, `is_unlimited` |

### `al_usage_logs` — Usage tracking
| Status | **3 rows** |
|--------|----------|
| **Purpose** | Detailed AL usage logging |
| **Key Fields** | `user_id`, `credits_used`, `tool_calls`, `input_tokens`, `output_tokens`, `cost_cents`, `model` |

### `al_credit_purchases` — Purchase history
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Credit/top-up purchase records |
| **Future Use** | Payment integration |

---

## Knowledge Base (2 tables)

### `source_documents` — Document sources
| Status | **190 rows** |
|--------|-------------|
| **Purpose** | Ingested documents (guides, transcripts) |
| **Key Fields** | `id`, `source_type`, `source_url`, `source_title`, `license`, `raw_text`, `metadata` |

### `document_chunks` — Vector embeddings
| Status | **683 rows** ✅ |
|--------|---------------|
| **Purpose** | Chunked content with embeddings for semantic search |
| **Key Fields** | `document_id` (FK→source_documents), `car_id`, `car_slug`, `chunk_index`, `chunk_text`, `chunk_tokens`, `topic`, `embedding_model`, `embedding` (vector) |
| **Used By** | AL `search_knowledge` tool |
| **Note** | Column is `document_id` (not `source_document_id`) |

---

## YouTube (4 tables)

### `youtube_videos` — Video metadata
| Status | **288 rows** ✅ |
|--------|----------------|
| **Purpose** | YouTube video details and AI summaries |
| **Key Fields** | `video_id`, `url`, `title`, `channel_id`, `channel_name`, `duration_seconds`, `view_count`, `summary`, `one_line_take`, `key_points`, `pros_mentioned`, `cons_mentioned`, `notable_quotes`, `quality_score` |

### `youtube_video_car_links` — Video-to-car mapping
| Status | **291 rows** |
|--------|-------------|
| **Purpose** | Which videos are about which cars |
| **Key Fields** | `video_id`, `car_slug`, `car_id`, `role`, sentiment fields, `match_confidence` |
| **Used By** | Expert Reviews tab |

### `youtube_channels` — Channel metadata
| Status | **12 rows** |
|--------|------------|
| **Purpose** | Trusted YouTube channels |
| **Key Fields** | `channel_id`, `channel_name`, `channel_handle`, `credibility_tier`, `content_focus`, `primary_brands`, `auto_ingest` |
| **Channels** | Throttle House, Savagegeese, Doug DeMuro, etc. |

### `youtube_ingestion_queue` — Processing queue
| Status | **2 rows** |
|--------|----------|
| **Purpose** | Videos pending AI processing |
| **Key Fields** | `video_id`, `video_url`, `channel_id`, `discovered_via`, `target_car_slug`, `status`, `priority`, `attempts` |

---

## Track Data (2 tables)

### `track_venues` — Track information
| Status | **21 rows** |
|--------|------------|
| **Purpose** | Track/circuit metadata |
| **Key Fields** | `slug`, `name`, `country`, `region`, `city`, `length_km`, `surface`, `website` |

### `track_layouts` — Layout variants
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Different configurations per track |
| **Key Fields** | `track_id`, `layout_key`, `name`, `length_km`, `turns`, `direction` |
| **Future Use** | Multiple layouts per venue |

---

## Forum Intelligence (5 tables)

> Forum scraping and community insight extraction system — **NOW ACTIVE**

### `forum_sources` — Forum registry
| Status | **14 rows** ✅ |
|--------|---------------|
| **Purpose** | Registry of forums to scrape with configuration |
| **Key Fields** | `slug`, `name`, `base_url`, `car_brands[]`, `car_slugs[]`, `scrape_config` (JSONB), `priority`, `is_active`, `last_scraped_at`, `total_threads_scraped`, `total_insights_extracted` |
| **Forums** | Rennlist, Bimmerpost, Miata.net, FT86Club, CorvetteForum, VWVortex, and more |
| **Used By** | Forum scraper cron job |

### `forum_scrape_runs` — Scrape session tracking
| Status | **10 rows** |
|--------|------------|
| **Purpose** | Track each scraping session for debugging |
| **Key Fields** | `forum_source_id`, `car_slug`, `run_type`, `status`, `threads_found`, `threads_scraped`, `posts_scraped`, `insights_extracted`, `error_message` |
| **Used By** | Forum scraper, internal monitoring |

### `forum_scraped_threads` — Raw scraped content
| Status | **175 rows** |
|--------|-------------|
| **Purpose** | Raw scraped forum threads awaiting/completed AI extraction |
| **Key Fields** | `thread_url`, `thread_title`, `subforum`, `posts` (JSONB), `processing_status`, `relevance_score`, `car_slugs_detected[]`, `insights_extracted`, `quality_score` |
| **Used By** | Insight extractor, internal processing |

### `community_insights` — Extracted insights (THE VALUE OUTPUT)
| Status | **1,226 rows** ⚠️ |
|--------|------------------|
| **Purpose** | Structured insights extracted from forum content |
| **Key Fields** | `car_slug`, `car_id`, `insight_type`, `title`, `summary`, `details` (JSONB), `confidence`, `consensus_strength`, `source_forum`, `source_urls[]`, `embedding` (vector) |
| **Insight Types** | `known_issue`, `maintenance_tip`, `modification_guide`, `troubleshooting`, `buying_guide`, `performance_data`, `reliability_report`, `cost_insight`, `comparison` |
| **Used By** | AL `search_community_insights` tool |
| **Gap Note** | Currently only Porsche models have insights (10/98 cars). 88 cars have zero community insights. P1 priority for expansion to other brands. |

### `community_insight_sources` — Multi-source tracking
| Status | **1,226 rows** |
|--------|---------------|
| **Purpose** | Links insights to multiple supporting forum threads |
| **Key Fields** | `insight_id`, `thread_id`, `thread_url`, `forum_slug`, `relevance_score`, `extracted_quotes[]` |
| **Used By** | Insight consolidation, citation tracking |

---

## Events (6 tables)

> Car events aggregator feature - Cars & Coffee, track days, shows, auctions — **NOW ACTIVE**

### `event_types` — Event taxonomy
| Status | **10 rows** ✅ |
|--------|---------------|
| **Purpose** | Categories of car events |
| **Key Fields** | `slug`, `name`, `description`, `icon` (emoji), `sort_order`, `is_track_event` |
| **Types** | cars-and-coffee, car-show, club-meetup, cruise, autocross, track-day, time-attack, industry, auction, other |
| **Used By** | Events API, event filtering |

### `events` — Core event data
| Status | **7,730 rows** ✅ |
|--------|------------------|
| **Purpose** | Car events with location, dates, and details |
| **Note** | Significantly expanded via automated event ingestion |
| **Key Fields** | `slug`, `name`, `description`, `event_type_id`, `start_date`, `end_date`, `start_time`, `end_time`, `timezone` |
| **Location Fields** | `venue_name`, `address`, `city`, `state`, `zip`, `country`, `latitude`, `longitude`, `region`, `scope` |
| **Meta Fields** | `source_url`, `source_name`, `registration_url`, `image_url`, `cost_text`, `is_free`, `status`, `featured` |
| **Used By** | Events pages, /api/events |

### `event_car_affinities` — Event-car/brand links
| Status | **79 rows** |
|--------|------------|
| **Purpose** | Links events to specific cars or brands |
| **Key Fields** | `event_id`, `car_id` (nullable), `brand` (nullable), `affinity_type` (featured/welcome/exclusive) |
| **Used By** | Event filtering by car affinity, event detail pages |

### `event_saves` — User saved events
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | User-bookmarked events |
| **Key Fields** | `user_id`, `event_id`, `notes` |
| **Future Use** | Event saving feature active but no saves yet |

### `event_submissions` — User-submitted events
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | User-submitted events pending moderation |
| **Key Fields** | `user_id`, `name`, `event_type_slug`, `source_url`, `start_date`, `city`, `state`, `status`, `reviewed_by`, `rejection_reason` |
| **Future Use** | Event submission form active but no submissions yet |

### `event_sources` — Automated ingestion config
| Status | **13 rows** ✅ |
|--------|-------------|
| **Purpose** | Configuration for automated event data sources |
| **Key Fields** | `name`, `source_type`, `base_url`, `api_config`, `scrape_config`, `regions_covered[]`, `event_types[]`, `is_active`, `last_run_at`, `last_run_status`, `last_run_events` |
| **Used By** | Automated event ingestion cron |
| **Note** | Source names must normalize to match fetcher keys (e.g., "MotorsportReg" → "motorsportreg"). See `lib/eventSourceFetchers/index.js` for available fetchers. |

---

## Event Coverage (1 table)

> Internal analytics for tracking event coverage across US cities

### `target_cities` — Event Coverage Tracking
| Status | **494 rows** |
|--------|-------------|
| **Purpose** | Track event coverage for top 500 US cities |
| **Columns** | 21 columns |
| **Key Fields** | `id`, `city`, `state`, `population`, `population_rank`, `latitude`, `longitude`, `region`, `msa_name`, `priority_tier` |
| **Coverage Fields** | `has_cnc_coverage`, `cnc_event_count`, `total_event_count`, `track_event_count`, `show_event_count`, `autocross_event_count` |
| **Meta Fields** | `nearest_event_distance_miles`, `coverage_notes`, `last_coverage_check` |
| **Used By** | Coverage reports, event expansion planning |
| **RLS** | Public read, service role write |

---

## Image Library (2 tables)

> Image management system for car images and brand logos

### `car_images` — Car image repository
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Central repository for all car images with rich metadata |
| **Columns** | 33 columns |
| **Key Fields** | `id`, `car_slug`, `brand`, `blob_url`, `blob_path`, `source_type`, `license`, `description`, `alt_text` |
| **Content Fields** | `content_tags[]`, `recommended_uses[]`, `quality_tier`, `is_primary`, `display_order` |
| **AI Fields** | `ai_prompt`, `ai_model`, `ai_settings` |
| **Status Fields** | `is_verified`, `is_active`, `needs_review`, `review_notes` |
| **Used By** | Image library management (feature gated by `SUPABASE_IMAGE_SYNC_ENABLED`) |
| **RLS** | Public read, service role write |

### `brand_logos` — Brand logo repository
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Brand logos and branding metadata |
| **Columns** | 17 columns |
| **Key Fields** | `id`, `brand_key`, `brand_name`, `logo_svg_url`, `logo_png_url`, `logo_dark_url` |
| **Branding Fields** | `primary_color`, `secondary_color`, `accent_color` |
| **Info Fields** | `founded`, `headquarters`, `country`, `wikipedia_url` |
| **Used By** | Brand display, theming |
| **RLS** | Public read, service role write |

---

## System (5 tables + 2 materialized views)

### `cars_stats` — Aggregated car statistics (Materialized View)
| Status | **3 rows** |
|--------|-----------|
| **Type** | Materialized view |
| **Purpose** | Pre-computed aggregate statistics by engine layout category |
| **Key Fields** | `category` (Front-Engine/Mid-Engine/Rear-Engine), `count`, `avg_price`, `avg_hp` |
| **Used By** | Dashboard statistics |

### `scrape_jobs` — Data ingestion jobs
| Status | **124 rows** |
|--------|-------------|
| **Purpose** | Track scraping/enrichment jobs |
| **Key Fields** | `id`, `job_type`, `car_slug`, `car_id`, `status`, `priority`, `sources_attempted[]`, `sources_succeeded[]`, `error_message` |

### `fitment_tag_mappings` — Fitment normalization
| Status | **124 rows** |
|--------|-------------|
| **Purpose** | Map vendor fitment tags to cars |
| **Key Fields** | `vendor_key`, `tag`, `tag_kind`, `car_id`, `car_variant_id`, `confidence` |

### `leads` — Contact submissions
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Contact form submissions |
| **Key Fields** | `email`, `name`, `source`, `car_interest_slug`, `car_interest_id`, `metadata` |

### `car_variant_maintenance_overrides` — Variant-specific specs
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Override maintenance specs for specific variants |
| **Future Use** | E.g., different oil capacity for Competition vs base |

### Views (not tables)

| View | Purpose | Type |
|------|---------|------|
| `al_user_balance` | User balance calculation | View |
| `feedback_bug_triage` | Bug feedback filtering | View |
| `feedback_by_tier` | Feedback aggregated by tier | View |
| `city_coverage_report` | Event coverage dashboard for target cities | View |

---

## Known Data Gaps & Expansion Priorities

### P1 — Critical (Feature Blocking)

| Gap | Current | Target | Affected Features | Strategy |
|-----|---------|--------|-------------------|----------|
| **Market Pricing** | 10/98 cars | 98/98 | My Garage Value tab | Expand BaT/Cars.com scrapers |
| **Part Fitments** | 836 fitments (~15% coverage) | Full catalog | Parts search, Build planner | Multi-vendor ingestion pipeline |
| **Community Insights** | 10/98 cars (Porsche only) | 98/98 | AL tool, car detail | Expand forum scraping to BMW, Nissan, etc. |

### P2 — Important (Feature Enhancement)

| Gap | Current | Target | Affected Features | Strategy |
|-----|---------|--------|-------------------|----------|
| **Dyno Data** | 29 runs | 200+ | Tuning Shop, AL | Community submissions, forum extraction |
| **Lap Times** | 65 records | 300+ | Performance benchmarks | Fastestlaps.com, community |
| **Recall Coverage** | 469 campaigns (~50% cars) | 100% cars | Safety pages | Weekly NHTSA refresh |

### P3 — Nice to Have

| Gap | Current | Target | Affected Features | Strategy |
|-----|---------|--------|-------------------|----------|
| **YouTube Videos** | 288 videos | 500+ | Expert Reviews | Expand channel list |
| **Price History** | 7 records | Time series data | Value trends | BaT historical data |

---

## Data Population Summary

### Well Populated (80%+ coverage)
- ✅ `cars` (98/98) — 100%
- ✅ `car_safety_data` (98/98) — 100%
- ✅ `car_fuel_economy` (98/98) — 100%
- ✅ `vehicle_maintenance_specs` (98/98) — 100%
- ✅ `vehicle_service_intervals` (976 records)
- ✅ `car_issues` (1,201 records)
- ✅ `car_recalls` (469 records, 69/98 cars)
- ⚠️ `community_insights` (1,233 records — **Porsche-only, 10/98 cars**)
- ✅ `events` (7,730 events)

### Significantly Expanded
- `parts` (642 records)
- `part_fitments` (836 records)
- `forum_scraped_threads` (181 threads)
- `fitment_tag_mappings` (124 records)
- `events` (7,730 records)
- `document_chunks` (683 records)
- `source_documents` (190 records)
- `target_cities` (494 records)

### Partially Populated
- ⚠️ `car_market_pricing` (10/98 cars)
- ⚠️ `car_market_pricing_years` (23 records)
- ⚠️ `car_dyno_runs` (29 records)
- ⚠️ `car_track_lap_times` (65 records)

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
| `event_saves` | User bookmarked events |
| `event_submissions` | User submitted events |
| `car_images` | Image library (enable via SUPABASE_IMAGE_SYNC_ENABLED) |
| `brand_logos` | Brand logo repository |

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
| `search_cars_fts(search_query, max_results)` | Full-text search with relevance ranking | AL car search |
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
| `get_feedback_summary()` | Feedback summary stats | Feedback review |
| `resolve_feedback(p_feedback_id, ...)` | Mark feedback resolved | Admin |
| `get_unresolved_bugs()` | Get unresolved bug reports | Admin |
| `resolve_car_and_variant_from_vin_decode(...)` | Match VIN decode to car/variant | VIN decode flow |
| `parse_years_range(p_years)` | Parse "2015-2020" to year array | Data normalization |
| `normalize_car_slug(p_slug)` | Normalize slug for lookup | Slug resolution |

### Triggers

| Function | Purpose | Trigger On |
|----------|---------|------------|
| `handle_new_user()` | Initialize user profile, AL credits | `auth.users` INSERT |
| `update_updated_at_column()` | Auto-update `updated_at` | Various tables UPDATE |
| `update_timestamp()` | Auto-update timestamp | Various tables |
| `update_events_updated_at()` | Events timestamp update | `events` UPDATE |

---

## Foreign Key Relationships

The database uses 80+ foreign key constraints. Key relationship patterns:

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
   community_insights                   events (via car_affinities)
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
| **Complaints** | NHTSA API | Weekly (Sun 4am) | `/api/cron/refresh-complaints` |
| **YouTube Videos** | YouTube Data API | Weekly (Mon 4am) | `/api/cron/youtube-enrichment` |
| **Parts Catalog** | Vendor APIs (Shopify) | Weekly (Sun 2am) | `/api/cron/schedule-ingestion` |
| **Market Pricing** | Scrapers (BaT, Cars.com) | Manual | Scrape jobs |
| **Knowledge Base** | Manual ingestion | As needed | `/api/internal/knowledge/ingest` |
| **Forum Insights** | Forum scrapers | Bi-weekly (Tue, Fri 5am) | `/api/cron/forum-scrape` |
| **Events** | API + scrapers | Weekly (Mon 6am) | `/api/cron/refresh-events` |

---

## Performance Indexes

Critical indexes for query performance:

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| `cars` | `cars_slug_key` | UNIQUE | Primary slug lookup |
| `cars` | `cars_search_vector_idx` | GIN | Full-text search |
| `cars` | `cars_embedding_idx` | HNSW | Vector similarity |
| `document_chunks` | `document_chunks_embedding_idx` | HNSW | Knowledge base search |
| `community_insights` | embedding index | HNSW | Insight similarity search |
| `part_fitments` | `idx_part_fitments_car_id` | BTREE | Parts by car |
| `part_fitments` | `idx_part_fitments_part_id` | BTREE | Fitments by part |
| `youtube_video_car_links` | `idx_youtube_video_car_links_car_id` | BTREE | Videos by car |
| `events` | location indexes | BTREE | Geographic search |
| `user_feedback` | `idx_user_feedback_auto_errors` | BTREE (partial) | Auto-error filtering |
| `user_feedback` | `idx_user_feedback_unresolved_auto_errors` | BTREE (partial) | Unresolved auto-errors |

---

## Row Level Security (RLS)

| Table Pattern | Policy | Access |
|---------------|--------|--------|
| `cars`, `parts`, `youtube_*`, `events` | Public read | Anyone can read |
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
| `events` | **33** | Event details + location + metadata |
| `upgrade_packages` | **30** | Package configs + performance deltas |
| `car_dyno_runs` | **30** | Dyno measurements + mod context |
| `car_market_pricing` | **30** | Multi-source price aggregation |
| `car_safety_data` | **29** | NHTSA + IIHS ratings |
| `community_insights` | **26** | Forum-extracted insights + embedding |
| `user_vehicles` | **26** | VIN, ownership, mileage tracking |

---

*See [API.md](API.md) for how to access this data.*
