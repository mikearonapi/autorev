# Car Data Requirements (Current App State)

> **Date:** January 31, 2026
> **Based on:** `docs/SOURCE_OF_TRUTH.md` and actual code analysis
> **Purpose:** Define exactly what data is needed when adding a new car to AutoRev

---

## Executive Summary

Based on the current app architecture (per SOURCE_OF_TRUTH.md), there are **26 user-facing pages**. The main pages that consume car data are:

| Page             | Path                 | What Car Data It Uses                                  |
| ---------------- | -------------------- | ------------------------------------------------------ |
| **Garage Home**  | `/garage`            | Car list, basic info                                   |
| **My Specs**     | `/garage/my-specs`   | Full specs, maintenance, issues, service intervals     |
| **My Build**     | `/garage/my-build`   | Performance specs (hp, torque, weight), tuning profile |
| **My Parts**     | `/garage/my-parts`   | Part fitments                                          |
| **My Install**   | `/garage/my-install` | Part status                                            |
| **Virtual Dyno** | `/data`              | HP, torque, dyno runs                                  |
| **Track Data**   | `/data/track`        | Lap times, performance metrics                         |
| **AL Chat**      | `/al`                | All car context via RPC                                |

---

## REQUIRED Data Tables for Each New Car

### 1. `cars` Table (REQUIRED)

The core car record. **55 fields are actively queried** by the API routes.

#### Identity Fields (REQUIRED)

| Field             | Type | Used By                        |
| ----------------- | ---- | ------------------------------ |
| `id`              | uuid | Primary key, all FKs           |
| `slug`            | text | URL routing                    |
| `name`            | text | Display everywhere             |
| `brand`           | text | Filtering, grouping            |
| `model`           | text | Year/Make/Model pattern        |
| `trim`            | text | Year/Make/Model/Trim pattern   |
| `years`           | text | Display, filtering             |
| `generation_code` | text | VIN matching                   |
| `tier`            | text | Tier gating, filtering         |
| `category`        | text | Engine layout (Front/Mid/Rear) |
| `vehicle_type`    | text | Body style filtering           |
| `country`         | text | Filtering                      |

#### Performance Fields (REQUIRED for Garage/Build/Data)

| Field           | Type    | Used By                              |
| --------------- | ------- | ------------------------------------ |
| `engine`        | text    | Display, AL context                  |
| `hp`            | integer | **CRITICAL** - All performance calcs |
| `torque`        | integer | **CRITICAL** - All performance calcs |
| `curb_weight`   | integer | Performance calcs, display           |
| `zero_to_sixty` | numeric | Performance metrics                  |
| `top_speed`     | integer | Display                              |
| `quarter_mile`  | numeric | Performance metrics                  |
| `braking_60_0`  | numeric | Performance metrics                  |
| `lateral_g`     | numeric | Performance metrics                  |
| `trans`         | text    | Display, filtering                   |
| `drivetrain`    | text    | HP loss calcs, filtering             |
| `layout`        | text    | Display                              |

#### Pricing Fields (REQUIRED)

| Field           | Type    | Used By            |
| --------------- | ------- | ------------------ |
| `price_range`   | text    | Display            |
| `price_avg`     | integer | Filtering, sorting |
| `msrp_new_low`  | integer | Display            |
| `msrp_new_high` | integer | Display            |

#### Scores (REQUIRED - Used in filtering & AL)

| Field               | Type    | Used By       |
| ------------------- | ------- | ------------- |
| `score_sound`       | numeric | Filtering, AL |
| `score_interior`    | numeric | Filtering, AL |
| `score_track`       | numeric | Filtering, AL |
| `score_reliability` | numeric | Filtering, AL |
| `score_value`       | numeric | Filtering, AL |
| `score_driver_fun`  | numeric | Filtering, AL |
| `score_aftermarket` | numeric | Filtering, AL |

#### Content Fields (REQUIRED)

| Field                 | Type    | Used By                         |
| --------------------- | ------- | ------------------------------- |
| `notes`               | text    | Display, AL context             |
| `highlight`           | text    | Display                         |
| `tagline`             | text    | Display                         |
| `hero_blurb`          | text    | Hero sections                   |
| `image_hero_url`      | text    | **CRITICAL** - All car displays |
| `manual_available`    | boolean | Filtering                       |
| `seats`               | integer | Filtering                       |
| `daily_usability_tag` | text    | Filtering                       |

#### Arrays (REQUIRED)

| Field                | Type  | Used By                                  |
| -------------------- | ----- | ---------------------------------------- |
| `common_issues`      | jsonb | Display, AL (simple array)               |
| `defining_strengths` | jsonb | Display (objects with title/description) |
| `honest_weaknesses`  | jsonb | Display (objects with title/description) |

#### Character Fields (Used by detail API)

| Field                | Type | Used By        |
| -------------------- | ---- | -------------- |
| `engine_character`   | text | Car detail     |
| `transmission_feel`  | text | Car detail     |
| `chassis_dynamics`   | text | Car detail     |
| `steering_feel`      | text | Car detail     |
| `sound_signature`    | text | Car detail     |
| `track_readiness`    | text | Tuning context |
| `community_strength` | text | Community info |
| `diy_friendliness`   | text | AL context     |
| `parts_availability` | text | Parts context  |

---

### 2. `car_issues` Table (REQUIRED)

Used by `/api/cars/[slug]/maintenance` and AL tools.

| Field                 | Type    | Required                              |
| --------------------- | ------- | ------------------------------------- |
| `car_id`              | uuid    | ✅ FK to cars                         |
| `title`               | text    | ✅                                    |
| `kind`                | text    | ✅ (common_issue, recall, tsb, other) |
| `severity`            | text    | ✅ (critical, high, medium, low)      |
| `affected_years_text` | text    | ✅                                    |
| `description`         | text    | ✅                                    |
| `symptoms`            | text[]  | ✅                                    |
| `prevention`          | text    | Optional                              |
| `fix_description`     | text    | ✅                                    |
| `estimated_cost_text` | text    | ✅                                    |
| `estimated_cost_low`  | integer | Optional                              |
| `estimated_cost_high` | integer | Optional                              |

**Minimum:** 5-8 issues per car

---

### 3. `vehicle_maintenance_specs` Table (REQUIRED)

Used by My Specs page via `/api/cars/[slug]/maintenance`.

| Field                       | Type    | Required      |
| --------------------------- | ------- | ------------- |
| `car_id`                    | uuid    | ✅ FK to cars |
| `oil_type`                  | text    | ✅            |
| `oil_viscosity`             | text    | ✅            |
| `oil_capacity_liters`       | numeric | ✅            |
| `oil_change_interval_miles` | integer | ✅            |
| `coolant_type`              | text    | ✅            |
| `brake_fluid_type`          | text    | ✅            |
| `fuel_type`                 | text    | ✅            |
| `fuel_octane_minimum`       | integer | ✅            |
| `tire_size_front`           | text    | ✅            |
| `tire_size_rear`            | text    | ✅            |
| `tire_pressure_front_psi`   | integer | Optional      |
| `tire_pressure_rear_psi`    | integer | Optional      |
| `wheel_bolt_pattern`        | text    | Optional      |

---

### 4. `vehicle_service_intervals` Table (REQUIRED)

Used by My Specs page via `/api/cars/[slug]/maintenance`.

| Field                 | Type    | Required      |
| --------------------- | ------- | ------------- |
| `car_id`              | uuid    | ✅ FK to cars |
| `service_name`        | text    | ✅            |
| `service_description` | text    | Optional      |
| `interval_miles`      | integer | ✅            |
| `interval_months`     | integer | Optional      |
| `dealer_cost_low`     | integer | ✅            |
| `dealer_cost_high`    | integer | ✅            |
| `diy_cost_low`        | integer | Optional      |
| `diy_cost_high`       | integer | Optional      |
| `is_critical`         | boolean | ✅            |

**Minimum:** 8-10 service intervals per car

---

### 5. `car_tuning_profiles` Table (REQUIRED for My Build)

Used by My Build page for upgrade recommendations.

| Field                   | Type  | Required                             |
| ----------------------- | ----- | ------------------------------------ |
| `car_id`                | uuid  | ✅ FK to cars                        |
| `tuning_focus`          | text  | ✅ (performance, economy, etc.)      |
| `data_quality_tier`     | text  | ✅ (templated, enriched, researched) |
| `upgrades_by_objective` | jsonb | **REQUIRED** for Build page          |

**Note:** `upgrades_by_objective` should contain upgrade recommendations by category (power, handling, braking, etc.)

---

### 6. `car_variants` Table (RECOMMENDED for VIN Decode)

Used for VIN matching and year-specific data.

| Field              | Type    | Required      |
| ------------------ | ------- | ------------- |
| `car_id`           | uuid    | ✅ FK to cars |
| `variant_key`      | text    | ✅            |
| `display_name`     | text    | ✅            |
| `model_year_start` | integer | ✅            |
| `model_year_end`   | integer | Optional      |
| `trim`             | text    | Optional      |
| `drivetrain`       | text    | Optional      |
| `transmission`     | text    | Optional      |
| `engine`           | text    | Optional      |

---

## OPTIONAL Data Tables (Nice to Have)

### `car_dyno_runs` - For /data page

Real dyno measurements. Currently only 29 records total.

### `car_track_lap_times` - For /data/track page

Track lap times. Currently only 65 records total.

### `part_fitments` - For My Parts page

Part compatibility. Currently only 930 fitments.

### `youtube_video_car_links` - For Expert Reviews

Linked YouTube videos. Enhances car detail but not required.

### `car_fuel_economy` - NOT CURRENTLY USED

EPA data exists but no app pages consume it anymore.

### `car_safety_data` - NOT CURRENTLY USED

NHTSA data exists but no app pages consume it anymore.

### `community_insights` - For AL only

Forum-extracted insights. Enhances AL but not required.

### `car_recalls` - For AL only

NHTSA recall data. Enhances AL but not required.

---

## Pipeline Checklist for New Cars

When adding a new car, ensure these items are populated:

### Must Have (App Won't Work Without)

- [ ] `cars` record with all REQUIRED fields (55 fields)
- [ ] `car_issues` records (5-8 minimum)
- [ ] `vehicle_maintenance_specs` record
- [ ] `vehicle_service_intervals` records (8-10 minimum)
- [ ] `car_tuning_profiles` record with `upgrades_by_objective`
- [ ] Hero image uploaded and `image_hero_url` set

### Should Have (Better UX)

- [ ] `car_variants` for year/trim combinations
- [ ] YouTube videos linked
- [ ] EPA fuel economy (if API has data)
- [ ] NHTSA safety ratings (if API has data)

### Nice to Have (Premium Features)

- [ ] `car_dyno_runs` - Real dyno data
- [ ] `car_track_lap_times` - Track times
- [ ] `part_fitments` - Parts compatibility
- [ ] `community_insights` - Forum knowledge

---

## Data NOT Needed (Deprecated/Unused)

These fields/tables exist but are NOT consumed by any current page:

| Item                           | Status      | Notes                                   |
| ------------------------------ | ----------- | --------------------------------------- |
| `vehicle_known_issues` table   | DEPRECATED  | Use `car_issues` instead                |
| `cars.upgrade_recommendations` | DEPRECATED  | Use `car_tuning_profiles`               |
| `cars.popular_track_mods`      | DEPRECATED  | Use `car_tuning_profiles`               |
| 60+ editorial fields in `cars` | NOT QUERIED | essence, heritage, buyers_summary, etc. |
| `car_fuel_economy`             | NOT USED    | API exists but no page uses it          |
| `car_safety_data`              | NOT USED    | API exists but no page uses it          |

---

## Summary: Minimum Viable Car Data

To add a car that works across all features:

```
cars                       1 record (55+ fields)
car_issues                 5-8 records
vehicle_maintenance_specs  1 record
vehicle_service_intervals  8-10 records
car_tuning_profiles        1 record (with upgrades_by_objective)
car_variants               3+ records (for VIN decode)
```

**Total: ~20-30 records per car**

---

## Pipeline Command

The verified pipeline (`ai-research-car-verified.js`) prioritizes accuracy over speed.
It uses web search to verify specs from authoritative sources (Car & Driver, Edmunds, OEM sites).

```bash
# Add a new car with verified data
node scripts/car-pipeline/ai-research-car-verified.js "2024 BMW M3 Competition"

# Dry run with verbose output to see sources
node scripts/car-pipeline/ai-research-car-verified.js "2024 BMW M3 Competition" --dry-run --verbose

# Skip images for testing
node scripts/car-pipeline/ai-research-car-verified.js "2024 BMW M3 Competition" --skip-images
```

**Pipeline Duration:** ~60-90 seconds
**Web Sources:** 10-15 authoritative sources consulted
**AI Calls:** 8 prompts (with web context)
**Estimated Cost:** ~$0.20 per car

**Data Quality Levels:**

- `verified` - Confirmed from OEM/official source
- `cross_referenced` - Multiple sources agree
- `researched` - AI researched with high confidence
- `estimated` - Flagged for review
