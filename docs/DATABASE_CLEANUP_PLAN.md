# Database Cleanup Plan

**Created:** 2026-02-01
**Status:** Ready for Execution

## Overview

Following the Teoalida migration, this document outlines tables that can be dropped/truncated and the image migration strategy.

---

## Tables to Drop (Safe to Remove Later)

### 1. `cars_v1_legacy` (2,028 records)

- **Purpose:** Old car data before Teoalida migration
- **Why drop:** Replaced by 75,750 Teoalida records in `cars` table
- **Dependencies:** None after migration complete
- **Action:** `DROP TABLE cars_v1_legacy;`

### 2. `tracks_legacy` (99 records)

- **Purpose:** Old track data
- **Why drop:** Replaced by `tracks` table (490 records)
- **Dependencies:** None
- **Action:** `DROP TABLE tracks_legacy;`

### 3. `car_slug_aliases` (38 records)

- **Purpose:** Redirect old slugs to canonical slugs
- **Why drop:** All 38 records point to legacy slugs that no longer exist
- **Dependencies:** None (URL redirects handled elsewhere)
- **Action:** `TRUNCATE TABLE car_slug_aliases;`

### 4. `vehicle_known_issues` (89 records)

- **Purpose:** NHTSA/TSB known issues by car
- **Why drop:** Uses legacy `car_slug` references
- **Regenerate:** Yes - can be re-scraped from NHTSA with proper Teoalida car references
- **Action:** `TRUNCATE TABLE vehicle_known_issues;`

### 5. `car_id_migration` (0 records)

- **Purpose:** Temporary migration tracking table
- **Why drop:** Empty, migration complete
- **Action:** `DROP TABLE car_id_migration;`

### 6. `car_generations` (0 records)

- **Purpose:** Was intended for generation grouping
- **Why drop:** Empty, replaced by `platform_code` in `cars` table
- **Action:** `DROP TABLE car_generations;`

---

## Tables Already Truncated (Reference)

These were truncated during the Teoalida migration cleanup:

| Table                        | Records Removed | Reason                       |
| ---------------------------- | --------------- | ---------------------------- |
| `car_issues`                 | 9,098           | AI-generated, legacy car_ids |
| `car_tuning_profiles`        | 310             | Legacy car_ids               |
| `vehicle_maintenance_specs`  | 312             | Legacy car_ids               |
| `vehicle_service_intervals`  | 6,099           | Legacy car_ids               |
| `car_recalls`                | 1,360           | Legacy car_ids               |
| `car_expert_reviews`         | 1,004           | Legacy car_ids               |
| `car_dyno_runs`              | 641             | Legacy car_ids               |
| `car_safety_data`            | 190             | Legacy car_ids               |
| `car_fuel_economy`           | 240             | Legacy car_ids               |
| `car_variants`               | 1,175           | Legacy car_ids               |
| `car_market_pricing`         | 10              | Legacy car_ids               |
| `car_market_pricing_years`   | 23              | Legacy car_ids               |
| `car_price_history`          | 7               | Legacy car_ids               |
| `car_manual_data`            | 1,159           | Legacy car_ids               |
| `upgrade_packages`           | 42              | Legacy car_ids               |
| `wheel_tire_fitment_options` | 1,312           | Legacy car_ids               |
| `youtube_*` tables           | ~5,000+         | Legacy car_ids               |
| `document_chunks`            | ~7,000+         | Legacy car_ids               |

---

## Car Images Migration Strategy

### Current State

- 283 images in `car_images` table
- All reference legacy `car_id` from `cars_v1_legacy`
- Each legacy car had its own image

### Target State

- Use **generation-based** image mapping
- One image per generation → shared by many Teoalida trims
- 283 images covering 2,058 generations (partial coverage initially)

### Generation Key

```
make + model + platform_code = unique generation
```

Examples:

- `Audi|A4|B8 - 8K` → 2009-2016 A4 trims share one image
- `Acura|Integra|3rd gen DB6-DB9, DC1-DC2, DC4` → All DC2/DC4 Integras share one image

### Schema Changes

**Option A: Add generation_key to car_images**

```sql
-- Add generation key column
ALTER TABLE car_images
ADD COLUMN generation_key TEXT;

-- Index for fast lookups
CREATE INDEX idx_car_images_generation_key ON car_images(generation_key);
```

**Option B: Create car_generation_images table (Recommended)**

```sql
CREATE TABLE car_generation_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  platform_code TEXT NOT NULL,
  generation_key TEXT GENERATED ALWAYS AS (make || '|' || model || '|' || platform_code) STORED,
  blob_url TEXT NOT NULL,
  blob_path TEXT,
  source_type TEXT,
  is_primary BOOLEAN DEFAULT true,
  quality_tier TEXT DEFAULT 'hero',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(make, model, platform_code, quality_tier)
);

CREATE INDEX idx_car_gen_images_key ON car_generation_images(generation_key);
```

### Migration Process

1. **Create mapping table** - Map legacy generation_code to Teoalida platform_code
2. **Populate car_generation_images** - Extract from car_images with proper generation_key
3. **Update application** - Query images by `(make, model, platform_code)` instead of `car_id`
4. **Drop car_id column** from car_images (or keep for backward compatibility)

### Coverage Analysis

| Category                   | Count          |
| -------------------------- | -------------- |
| Total Teoalida generations | 2,058          |
| Legacy cars with images    | 283            |
| Expected coverage          | ~14% initially |

**Note:** Many legacy images cover multiple generations (e.g., Mustang GT covers S197 and S550). Additional images can be added over time.

---

## Execution Checklist

### Phase 1: Documentation ✅

- [x] Document all tables to drop
- [x] Document image migration strategy
- [x] Get user approval

### Phase 2: Image Migration ✅ (Completed 2026-02-01)

- [x] Create `car_generation_images` table
- [x] Migrate 257 unique generation images (26 duplicates skipped)
- [ ] Update application image lookups (code change needed)
- [ ] Test image display

### Phase 3: Cleanup (Later)

- [ ] Drop `cars_v1_legacy`
- [ ] Drop `tracks_legacy`
- [ ] Truncate `car_slug_aliases`
- [ ] Truncate `vehicle_known_issues`
- [ ] Drop `car_id_migration`
- [ ] Drop `car_generations`
- [ ] Remove `car_id` from `car_images` (if using Option B)

---

## User Data Status (Verified ✅)

All user-critical tables are migrated and linked to Teoalida:

| Table                  | Records | Status                             |
| ---------------------- | ------- | ---------------------------------- |
| `user_vehicles`        | 67      | ✅ All `matched_car_id` → Teoalida |
| `user_favorites`       | 17      | ✅ All `car_id` → Teoalida         |
| `user_projects`        | 52      | ✅ All `car_id` → Teoalida         |
| `user_uploaded_images` | 19      | ✅ 15 `car_id` → Teoalida          |
| `user_track_times`     | 2       | ✅ All `car_id` → Teoalida         |
