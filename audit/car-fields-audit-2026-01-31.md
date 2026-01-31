# Car Fields Audit

> **Date:** January 31, 2026
> **Purpose:** Identify which `cars` table fields are actually used by the app vs populated by the pipeline

---

## Executive Summary

| Category                    | Fields | % of Pipeline Output |
| --------------------------- | ------ | -------------------- |
| **CRITICAL (List API)**     | 46     | 33%                  |
| **DETAIL (Single Car API)** | +9     | 40%                  |
| **POPULATED BUT UNUSED**    | ~85    | 60%                  |

**Recommendation:** The lean pipeline should focus on the 55 fields actually exposed by API routes.

---

## TIER 1: CRITICAL FIELDS (Queried by `/api/cars`)

These 46 fields are queried in the list endpoint and used across browse, compare, filtering, and AL.

### Identity (11 fields)

| Field          | Type | Used For                     |
| -------------- | ---- | ---------------------------- |
| `id`           | uuid | Primary key, joins           |
| `slug`         | text | URL routing, lookups         |
| `name`         | text | Display name                 |
| `model`        | text | Filtering                    |
| `trim`         | text | Display                      |
| `years`        | text | Filtering, display           |
| `tier`         | text | Tier gating, filtering       |
| `category`     | text | Filtering (engine placement) |
| `brand`        | text | Filtering, grouping          |
| `country`      | text | Filtering                    |
| `vehicle_type` | text | Filtering (body style)       |

### Performance (10 fields)

| Field           | Type    | Used For                         |
| --------------- | ------- | -------------------------------- |
| `engine`        | text    | Display, AL context              |
| `hp`            | integer | Calculations, filtering, display |
| `torque`        | integer | Calculations, display            |
| `trans`         | text    | Display, filtering               |
| `drivetrain`    | text    | Filtering, HP loss calcs         |
| `curb_weight`   | integer | Calculations, display            |
| `zero_to_sixty` | numeric | Performance HUB, filtering       |
| `top_speed`     | integer | Display                          |
| `quarter_mile`  | numeric | Performance calculations         |
| `braking_60_0`  | numeric | Performance calculations         |
| `lateral_g`     | numeric | Performance calculations         |
| `layout`        | text    | Display                          |

### Pricing (4 fields)

| Field           | Type    | Used For           |
| --------------- | ------- | ------------------ |
| `price_range`   | text    | Display            |
| `price_avg`     | integer | Filtering, sorting |
| `msrp_new_low`  | integer | Display            |
| `msrp_new_high` | integer | Display            |

### Scores (7 fields)

| Field               | Type    | Used For           |
| ------------------- | ------- | ------------------ |
| `score_sound`       | numeric | Filtering, display |
| `score_interior`    | numeric | Filtering, display |
| `score_track`       | numeric | Filtering, display |
| `score_reliability` | numeric | Filtering, display |
| `score_value`       | numeric | Filtering, display |
| `score_driver_fun`  | numeric | Filtering, display |
| `score_aftermarket` | numeric | Filtering, display |

### Content (8 fields)

| Field                 | Type    | Used For            |
| --------------------- | ------- | ------------------- |
| `notes`               | text    | Display, AL context |
| `highlight`           | text    | Display             |
| `tagline`             | text    | Display             |
| `hero_blurb`          | text    | Hero section        |
| `image_hero_url`      | text    | Display             |
| `manual_available`    | boolean | Filtering           |
| `seats`               | integer | Filtering           |
| `daily_usability_tag` | text    | Filtering           |

### Editorial Arrays (3 fields)

| Field                | Type  | Used For    |
| -------------------- | ----- | ----------- |
| `common_issues`      | jsonb | Display, AL |
| `defining_strengths` | jsonb | Display     |
| `honest_weaknesses`  | jsonb | Display     |

---

## TIER 2: DETAIL FIELDS (Additional in `/api/cars/[slug]`)

These 9 additional fields are queried only for single-car detail views.

| Field                | Type | Used For                       |
| -------------------- | ---- | ------------------------------ |
| `engine_character`   | text | Car detail "Character" section |
| `transmission_feel`  | text | Car detail                     |
| `chassis_dynamics`   | text | Car detail                     |
| `steering_feel`      | text | Car detail                     |
| `sound_signature`    | text | Car detail                     |
| `track_readiness`    | text | Tuning context                 |
| `community_strength` | text | Community info                 |
| `diy_friendliness`   | text | Ownership info                 |
| `parts_availability` | text | Parts context                  |

---

## TIER 3: POPULATED BUT NOT EXPOSED (~85 fields)

These fields are populated by the pipeline and stored in the database, but **NOT queried by any API route**.

### Character & Experience (NOT EXPOSED)

| Field                   | Status         | Notes                |
| ----------------------- | -------------- | -------------------- |
| `essence`               | ⚠️ NOT QUERIED | Generated but unused |
| `heritage`              | ⚠️ NOT QUERIED | Generated but unused |
| `design_philosophy`     | ⚠️ NOT QUERIED | Generated but unused |
| `motorsport_history`    | ⚠️ NOT QUERIED | Generated but unused |
| `brake_confidence`      | ⚠️ NOT QUERIED | Generated but unused |
| `comfort_track_balance` | ⚠️ NOT QUERIED | Generated but unused |

### Buyer's Guide (NOT EXPOSED)

| Field                     | Status         | Notes                                |
| ------------------------- | -------------- | ------------------------------------ |
| `ideal_owner`             | ⚠️ NOT QUERIED | Could be useful                      |
| `not_ideal_for`           | ⚠️ NOT QUERIED | Could be useful                      |
| `buyers_summary`          | ⚠️ NOT QUERIED | Could be useful                      |
| `ppi_recommendations`     | ⚠️ NOT QUERIED | Could be useful                      |
| `market_position`         | ⚠️ NOT QUERIED | Generated but unused                 |
| `market_commentary`       | ⚠️ NOT QUERIED | Generated but unused                 |
| `recommended_years_note`  | ⚠️ NOT QUERIED | Could be useful                      |
| `years_to_avoid`          | ⚠️ NOT QUERIED | Could be useful                      |
| `years_to_avoid_detailed` | ⚠️ NOT QUERIED | Generated but unused                 |
| `ownership_cost_notes`    | ⚠️ NOT QUERIED | Generated but unused                 |
| `maintenance_cost_index`  | ⚠️ NOT QUERIED | Generated but unused                 |
| `insurance_cost_index`    | ⚠️ NOT QUERIED | Generated but unused                 |
| `fuel_economy_combined`   | ⚠️ NOT QUERIED | Replaced by `car_fuel_economy` table |

### Arrays - Simple Strings (NOT EXPOSED)

| Field                      | Status         | Notes                   |
| -------------------------- | -------------- | ----------------------- |
| `pros`                     | ⚠️ NOT QUERIED | Generated, could expose |
| `cons`                     | ⚠️ NOT QUERIED | Generated, could expose |
| `best_for`                 | ⚠️ NOT QUERIED | Generated but unused    |
| `pre_inspection_checklist` | ⚠️ NOT QUERIED | Generated but unused    |
| `facebook_groups`          | ⚠️ NOT QUERIED | Generated but unused    |
| `predecessors`             | ⚠️ NOT QUERIED | Empty in template       |
| `successors`               | ⚠️ NOT QUERIED | Empty in template       |

### Arrays - Object Arrays (NOT EXPOSED)

| Field                        | Status         | Notes                            |
| ---------------------------- | -------------- | -------------------------------- |
| `direct_competitors`         | ⚠️ NOT QUERIED | Could be useful                  |
| `if_you_want_more`           | ⚠️ NOT QUERIED | Could be useful                  |
| `if_you_want_less`           | ⚠️ NOT QUERIED | Could be useful                  |
| `similar_driving_experience` | ⚠️ NOT QUERIED | Generated but unused             |
| `best_years_detailed`        | ⚠️ NOT QUERIED | Generated but unused             |
| `must_have_options`          | ⚠️ NOT QUERIED | Generated but unused             |
| `nice_to_have_options`       | ⚠️ NOT QUERIED | Generated but unused             |
| `common_issues_detailed`     | ⚠️ NOT QUERIED | Superseded by `car_issues` table |
| `notable_reviews`            | ⚠️ NOT QUERIED | Generated but unused             |
| `must_watch_videos`          | ⚠️ NOT QUERIED | Generated but unused             |
| `expert_quotes`              | ⚠️ NOT QUERIED | Generated but unused             |

### Track Content (NOT EXPOSED)

| Field                    | Status         | Notes                               |
| ------------------------ | -------------- | ----------------------------------- |
| `track_readiness_notes`  | ⚠️ NOT QUERIED | Generated but unused                |
| `recommended_track_prep` | ⚠️ NOT QUERIED | Generated but unused                |
| `popular_track_mods`     | ❌ DEPRECATED  | Moved to `car_tuning_profiles`      |
| `laptime_benchmarks`     | ⚠️ NOT QUERIED | Superseded by `car_track_lap_times` |
| `cooling_capacity`       | ⚠️ NOT QUERIED | Generated but unused                |
| `brake_fade_resistance`  | ⚠️ NOT QUERIED | Generated but unused                |

### Community Content (NOT EXPOSED)

| Field                     | Status         | Notes                        |
| ------------------------- | -------------- | ---------------------------- |
| `community_notes`         | ⚠️ NOT QUERIED | Generated but unused         |
| `aftermarket_scene_notes` | ⚠️ NOT QUERIED | Generated but unused         |
| `resale_reputation`       | ⚠️ NOT QUERIED | Generated but unused         |
| `key_resources`           | ⚠️ NOT QUERIED | Generated but unused         |
| `annual_events`           | ⚠️ NOT QUERIED | Superseded by `events` table |
| `diy_notes`               | ⚠️ NOT QUERIED | Generated but unused         |
| `parts_notes`             | ⚠️ NOT QUERIED | Generated but unused         |
| `dealer_notes`            | ⚠️ NOT QUERIED | Generated but unused         |
| `warranty_info`           | ⚠️ NOT QUERIED | Generated but unused         |
| `insurance_notes`         | ⚠️ NOT QUERIED | Generated but unused         |

### Media (NOT EXPOSED)

| Field           | Status         | Notes                     |
| --------------- | -------------- | ------------------------- |
| `image_gallery` | ⚠️ NOT QUERIED | Empty, no gallery feature |
| `video_url`     | ⚠️ NOT QUERIED | Empty, no video embed     |
| `cta_copy`      | ⚠️ NOT QUERIED | Generated but unused      |

### Performance HUB Scores (CALCULATED DYNAMICALLY)

| Field                   | Status     | Notes                             |
| ----------------------- | ---------- | --------------------------------- |
| `perf_power_accel`      | NOT STORED | Calculated from hp, weight, 0-60  |
| `perf_grip_cornering`   | NOT STORED | Calculated from lateral_g         |
| `perf_braking`          | NOT STORED | Calculated from braking_60_0      |
| `perf_track_pace`       | NOT STORED | Calculated composite              |
| `perf_drivability`      | NOT STORED | Calculated composite              |
| `perf_reliability_heat` | NOT STORED | Calculated from score_reliability |
| `perf_sound_emotion`    | NOT STORED | Calculated from score_sound       |

### Search/Index Fields (AUTO-GENERATED)

| Field                | Status | Notes                         |
| -------------------- | ------ | ----------------------------- |
| `search_vector`      | AUTO   | tsvector for full-text search |
| `ai_searchable_text` | AUTO   | Concatenated searchable text  |
| `embedding`          | AUTO   | Vector for semantic search    |

---

## Deprecated Fields

These fields have been officially deprecated per `docs/SOURCE_OF_TRUTH.md`:

| Field                     | Deprecated | Replacement                                 |
| ------------------------- | ---------- | ------------------------------------------- |
| `upgrade_recommendations` | 2026-01-15 | `car_tuning_profiles.upgrades_by_objective` |
| `popular_track_mods`      | 2026-01-15 | `car_tuning_profiles.upgrades_by_objective` |

---

## Recommendations

### 1. LEAN PIPELINE: Only Populate Critical + Detail Fields (55 total)

The lean pipeline should focus AI research on:

- 46 fields for list API
- 9 additional fields for detail API
- Skip all TIER 3 fields (save ~50% AI costs)

### 2. Consider Exposing These Useful Fields

If you want richer car detail pages, consider exposing:

- `pros`, `cons` - Basic editorial
- `ideal_owner`, `not_ideal_for` - Buyer targeting
- `direct_competitors`, `if_you_want_more`, `if_you_want_less` - Alternatives
- `buyers_summary`, `ppi_recommendations` - Buying advice

### 3. Remove These From Pipeline (Superseded by Tables)

| Field                    | Superseded By               |
| ------------------------ | --------------------------- |
| `common_issues_detailed` | `car_issues` table          |
| `laptime_benchmarks`     | `car_track_lap_times` table |
| `annual_events`          | `events` table              |
| `fuel_economy_combined`  | `car_fuel_economy` table    |

### 4. Keep Related Tables

The pipeline should KEEP populating these related tables (they ARE used):

- `car_issues` (9,104 rows) - ✅ Used by AL, car detail
- `vehicle_maintenance_specs` (310 rows) - ✅ Used by Owner's Reference
- `vehicle_service_intervals` (6,089 rows) - ✅ Used by service reminders
- `car_tuning_profiles` (323 rows) - ✅ Used by Tuning Shop

---

## Field Usage Evidence

### /api/cars (List Endpoint) - 46 fields

```javascript
// app/api/cars/route.js lines 27-73
.select(`
  id, slug, name, model, trim, years, tier, category, brand, country,
  engine, hp, torque, trans, drivetrain, price_range, price_avg,
  curb_weight, zero_to_sixty, top_speed, quarter_mile, braking_60_0,
  lateral_g, layout, msrp_new_low, msrp_new_high,
  score_sound, score_interior, score_track, score_reliability,
  score_value, score_driver_fun, score_aftermarket,
  notes, highlight, tagline, hero_blurb, image_hero_url,
  manual_available, seats, vehicle_type, daily_usability_tag,
  common_issues, defining_strengths, honest_weaknesses
`)
```

### /api/cars/[slug] (Detail Endpoint) - 55 fields

```javascript
// app/api/cars/[slug]/route.js lines 31-87
// Same 46 fields PLUS:
(engine_character,
  transmission_feel,
  chassis_dynamics,
  steering_feel,
  sound_signature,
  track_readiness,
  community_strength,
  diy_friendliness,
  parts_availability);
```

---

_This audit was generated by analyzing actual API route queries vs. pipeline output._
