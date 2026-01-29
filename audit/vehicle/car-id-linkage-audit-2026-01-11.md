# Car ID Linkage Audit Report

**Date:** 2026-01-11  
**Status:** Migration Created  
**Migration File:** `supabase/migrations/20260111_add_car_id_to_missing_tables.sql`

---

## Executive Summary

Analyzed all 119 database tables to ensure proper `car_id` (UUID) linkage across tables containing car-related information. Found **9 tables** that had car slug references but lacked `car_id` foreign keys.

### Key Findings

| Category | Count | Tables |
|----------|-------|--------|
| Tables with proper `car_id` | 33 | All core car data tables ✅ |
| Tables needing `car_id` added | 9 | See below |
| Tables with intentional slug-only | 1 | `car_pipeline_runs` (car may not exist yet) |
| Views (no modification needed) | 1 | `feedback_bug_triage` |

---

## Tables Already with Proper car_id ✅

These tables correctly use `car_id` for foreign key relationships:

| Table | car_id Column | Row Count |
|-------|---------------|-----------|
| `car_variants` | `car_id` | 105 |
| `car_fuel_economy` | `car_id` | 98 |
| `car_safety_data` | `car_id` | 98 |
| `car_issues` | `car_id` | 6,202 |
| `car_market_pricing` | `car_id` | 10 |
| `car_market_pricing_years` | `car_id` | 23 |
| `car_price_history` | `car_id` | 7 |
| `car_dyno_runs` | `car_id` | 29 |
| `car_track_lap_times` | `car_id` | 65 |
| `car_expert_reviews` | `car_id` | 0 |
| `car_manual_data` | `car_id` | 0 |
| `car_recalls` | `car_id` | 507 |
| `car_auction_results` | `car_id` | 0 |
| `car_tuning_profiles` | `car_id` | 309 |
| `car_images` | `car_id` | 0 |
| `part_fitments` | `car_id` | 930 |
| `user_favorites` | `car_id` | 19 |
| `user_projects` | `car_id` | 13 |
| `user_vehicles` | `matched_car_id` | 25 |
| `user_feedback` | `car_id` | 39 |
| `vehicle_maintenance_specs` | `car_id` | 305 |
| `vehicle_service_intervals` | `car_id` | 3,093 |
| `wheel_tire_fitment_options` | `car_id` | 105 |
| `community_posts` | `car_id` | 7 |
| `community_insights` | `car_id` | 1,252 |
| `document_chunks` | `car_id` | 7,448 |
| `youtube_videos` | `car_id` | 1,030 |
| `youtube_video_car_links` | `car_id` | 1,077 |
| `youtube_ingestion_queue` | `target_car_id` | 2,332 |
| `event_car_affinities` | `car_id` | 79 |
| `fitment_tag_mappings` | `car_id` | 124 |
| `scrape_jobs` | `car_id` | 226 |
| `forum_scrape_runs` | `car_id` | 27 |
| `upgrade_packages` | `car_id` | 42 |
| `al_usage_logs` | `car_id` | 115 |
| `leads` | `car_interest_id` | 0 |

---

## Tables Requiring car_id Migration

### Priority 1: Core Tables with Existing Data

#### 1. `al_conversations` - Add `initial_car_id`

| Metric | Value |
|--------|-------|
| Current Column | `initial_car_slug` (TEXT) |
| New Column | `initial_car_id` (UUID) |
| Rows with car data | 25 |
| Total rows | 65 |

**Rationale:** AL conversations often start from a specific car page. Having `car_id` enables efficient joins to analyze which cars generate the most AI conversations.

#### 2. `car_slug_aliases` - Add `car_id`

| Metric | Value |
|--------|-------|
| Current Column | `canonical_slug` (TEXT) |
| New Column | `car_id` (UUID) |
| Rows | 35 |

**Rationale:** Slug aliases map alternate slugs to canonical slugs. Adding `car_id` enables direct FK lookups without an extra join to `cars`.

---

### Priority 2: Tables with Array Columns

#### 3. `al_articles` - Add `car_ids` UUID[]

| Metric | Value |
|--------|-------|
| Current Column | `car_slugs` (TEXT[]) |
| New Column | `car_ids` (UUID[]) |
| Rows with car data | 13 |
| Total rows | 43 |

**Rationale:** Articles can reference multiple cars. Having UUID array enables `@>` containment queries with proper FK semantics.

#### 4. `featured_content` - Add `related_car_ids` UUID[]

| Metric | Value |
|--------|-------|
| Current Column | `related_car_slugs` (TEXT[]) |
| New Column | `related_car_ids` (UUID[]) |
| Rows with car data | 0 |
| Total rows | 166 |

**Rationale:** Featured content like YouTube videos can reference multiple cars. Adding UUID array improves query performance.

#### 5. `user_compare_lists` - Add `car_ids` UUID[]

| Metric | Value |
|--------|-------|
| Current Column | `car_slugs` (JSONB) |
| New Column | `car_ids` (UUID[]) |
| Rows | 0 (empty) |

**Rationale:** Compare lists store multiple cars. Adding UUID array enables efficient joins and car-based analytics.

#### 6. `forum_sources` - Add `car_ids` UUID[]

| Metric | Value |
|--------|-------|
| Current Column | `car_slugs` (TEXT[]) |
| New Column | `car_ids` (UUID[]) |
| Rows | 14 |

**Rationale:** Forum sources can cover multiple cars. UUID array enables efficient filtering.

#### 7. `forum_scraped_threads` - Add `car_ids_detected` UUID[]

| Metric | Value |
|--------|-------|
| Current Column | `car_slugs_detected` (TEXT[]) |
| New Column | `car_ids_detected` (UUID[]) |
| Rows with car data | 162 |
| Total rows | 199 |

**Rationale:** Scraped threads detect multiple cars. UUID array enables efficient aggregation queries.

---

### Priority 3: Empty or Deprecated Tables

#### 8. `daily_driver_enrichments` - Add `car_id`

| Metric | Value |
|--------|-------|
| Current Columns | `year`, `make`, `model`, `trim` |
| New Columns | `car_id` (UUID), `car_slug` (TEXT) |
| Rows | 0 (empty) |

**Rationale:** This table stores enrichment data for daily drivers. When populated, needs car linkage for cross-referencing.

#### 9. `vehicle_known_issues` - Add `car_id` (DEPRECATED)

| Metric | Value |
|--------|-------|
| Current Column | `car_slug` (TEXT) |
| New Column | `car_id` (UUID) |
| Rows | 89 |

**Rationale:** Although deprecated (use `car_issues` instead), adding `car_id` for consistency and any legacy queries.

---

## Tables Intentionally Without car_id

### `car_pipeline_runs`

**Reason:** This table tracks the progress of adding NEW cars to the database. The car may not exist in the `cars` table yet during early pipeline phases, so it only stores `car_slug` (the target slug being created).

### `feedback_bug_triage` (VIEW)

**Reason:** This is a VIEW built on `user_feedback`, which already has `car_id`. Views don't need modification.

---

## Migration Details

### New Columns Added

| Table | Column | Type | Index |
|-------|--------|------|-------|
| `al_conversations` | `initial_car_id` | UUID | BTREE (partial) |
| `car_slug_aliases` | `car_id` | UUID | BTREE (partial) |
| `al_articles` | `car_ids` | UUID[] | GIN |
| `featured_content` | `related_car_ids` | UUID[] | GIN |
| `user_compare_lists` | `car_ids` | UUID[] | GIN |
| `forum_sources` | `car_ids` | UUID[] | GIN |
| `forum_scraped_threads` | `car_ids_detected` | UUID[] | GIN |
| `daily_driver_enrichments` | `car_id`, `car_slug` | UUID, TEXT | BTREE |
| `vehicle_known_issues` | `car_id` | UUID | BTREE (partial) |

### Triggers Created

Auto-populate triggers created for single-car reference tables:

1. `auto_car_id_al_conversations` - Resolves `initial_car_slug` → `initial_car_id`
2. `auto_car_id_car_slug_aliases` - Resolves `canonical_slug` → `car_id`
3. `auto_car_id_daily_driver_enrichments` - Resolves `car_slug` → `car_id`
4. `auto_car_id_vehicle_known_issues` - Resolves `car_slug` → `car_id`

> **Note:** Array columns (`car_ids`, `car_ids_detected`, etc.) require application-level population when slugs are updated.

---

## Verification Queries

Run after migration to verify backfill success:

```sql
-- Check al_conversations
SELECT 'al_conversations' as table_name, 
       COUNT(*) as total, 
       COUNT(initial_car_id) as with_car_id 
FROM al_conversations 
WHERE initial_car_slug IS NOT NULL;

-- Check car_slug_aliases
SELECT 'car_slug_aliases' as table_name, 
       COUNT(*) as total, 
       COUNT(car_id) as with_car_id 
FROM car_slug_aliases;

-- Check al_articles
SELECT 'al_articles' as table_name, 
       COUNT(*) as total, 
       COUNT(car_ids) as with_car_ids 
FROM al_articles 
WHERE car_slugs IS NOT NULL AND array_length(car_slugs, 1) > 0;

-- Check forum_scraped_threads
SELECT 'forum_scraped_threads' as table_name, 
       COUNT(*) as total, 
       COUNT(car_ids_detected) as with_car_ids 
FROM forum_scraped_threads 
WHERE car_slugs_detected IS NOT NULL AND array_length(car_slugs_detected, 1) > 0;
```

---

## Application Code Updates Required

After migration, update the following code to use `car_id`:

1. **AL Conversations API** - When creating conversations, resolve slug to ID
2. **Featured Content API** - When saving content, resolve slugs to IDs array
3. **Compare Lists API** - When saving compare lists, resolve slugs to IDs array
4. **Forum Scraper** - When detecting cars in threads, resolve to IDs array

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Tables with proper car_id FK | 33 | 42 |
| Tables with slug-only references | 9 | 1 (intentional) |
| New indexes created | 0 | 9 |
| Auto-populate triggers | 1 | 5 |
