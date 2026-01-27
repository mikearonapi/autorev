# AutoRev Data Dictionary

> **Complete reference for all database tables, fields, and relationships**  
> **Generated:** January 27, 2026  
> **Total Tables:** 172 | **Total Records:** ~117,000+

---

## Quick Stats

| Metric           | Count                        |
| ---------------- | ---------------------------- |
| Total Tables     | 172                          |
| Tables with Data | ~130                         |
| Empty Tables     | ~42                          |
| Total Records    | ~117,000+                    |
| Largest Table    | `click_events` (29,444 rows) |

---

## Table of Contents

1. [Core Car Data](#1-core-car-data)
2. [Parts & Upgrades](#2-parts--upgrades)
3. [User Data](#3-user-data)
4. [AL (AI Assistant)](#4-al-ai-assistant)
5. [Knowledge Base](#5-knowledge-base)
6. [YouTube & Media](#6-youtube--media)
7. [Track & Performance](#7-track--performance)
8. [Forum Intelligence](#8-forum-intelligence)
9. [Events](#9-events)
10. [Community & Social](#10-community--social)
11. [Maintenance](#11-maintenance)
12. [Email & Referrals](#12-email--referrals)
13. [Analytics & Tracking](#13-analytics--tracking)
14. [Financial System](#14-financial-system)
15. [System & Configuration](#15-system--configuration)
16. [Gamification](#16-gamification)
17. [Subscription & Billing](#17-subscription--billing)

---

## 1. Core Car Data

### `cars` — Primary Vehicle Database

| Attribute   | Value                                                                                  |
| ----------- | -------------------------------------------------------------------------------------- |
| **Rows**    | 309                                                                                    |
| **Columns** | 140                                                                                    |
| **Purpose** | Master table for all vehicles with complete specs, performance data, and AI embeddings |

**Key Fields:**

| Field           | Type    | Purpose                                                 |
| --------------- | ------- | ------------------------------------------------------- |
| `id`            | UUID    | Primary key                                             |
| `slug`          | TEXT    | URL-friendly identifier (e.g., "bmw-m3-g80")            |
| `name`          | TEXT    | Display name (e.g., "BMW M3 (G80)")                     |
| `brand`         | TEXT    | Manufacturer (e.g., "BMW")                              |
| `years`         | TEXT    | Model years (e.g., "2021-2025")                         |
| `tier`          | TEXT    | Content tier required (free/enthusiast/tuner/collector) |
| `category`      | TEXT    | Engine placement (Front/Mid/Rear/Electric)              |
| `vehicle_type`  | TEXT    | Body style (Sports Car/Sedan/Hot Hatch/etc.)            |
| `engine`        | TEXT    | Engine description (e.g., "3.0L Twin-Turbo I6")         |
| `hp`            | INTEGER | Horsepower                                              |
| `torque`        | INTEGER | Torque (lb-ft)                                          |
| `trans`         | TEXT    | Transmission type                                       |
| `drivetrain`    | TEXT    | Drive type (RWD/AWD/FWD)                                |
| `curb_weight`   | INTEGER | Weight in lbs                                           |
| `zero_to_sixty` | DECIMAL | 0-60 mph time in seconds                                |
| `price_avg`     | INTEGER | Average market price                                    |
| `price_range`   | TEXT    | Price range text                                        |

**Score Fields (Enthusiast Ratings 1-10):**

| Field               | Purpose                        |
| ------------------- | ------------------------------ |
| `score_sound`       | Exhaust/engine sound quality   |
| `score_interior`    | Interior quality and design    |
| `score_track`       | Track capability               |
| `score_reliability` | Reliability rating             |
| `score_value`       | Value for money                |
| `score_driver_fun`  | Driving enjoyment              |
| `score_aftermarket` | Aftermarket parts availability |

---

### `car_variants` — Year/Trim Variants

| Attribute   | Value                                                                      |
| ----------- | -------------------------------------------------------------------------- |
| **Rows**    | 1,166                                                                      |
| **Columns** | 14                                                                         |
| **Purpose** | Specific year/trim combinations for VIN matching and variant-specific data |

**Key Fields:**

| Field              | Type    | Purpose                                                 |
| ------------------ | ------- | ------------------------------------------------------- |
| `id`               | UUID    | Primary key                                             |
| `car_id`           | UUID    | FK to cars                                              |
| `variant_key`      | TEXT    | Unique identifier (e.g., "bmw-m3-g80-2021-competition") |
| `display_name`     | TEXT    | Human-readable name                                     |
| `model_year_start` | INTEGER | Starting model year                                     |
| `model_year_end`   | INTEGER | Ending model year                                       |
| `trim`             | TEXT    | Trim level (Base/Competition/CS/etc.)                   |
| `drivetrain`       | TEXT    | Specific drivetrain                                     |
| `transmission`     | TEXT    | Transmission option                                     |
| `engine`           | TEXT    | Engine variant                                          |

---

### `car_fuel_economy` — EPA Fuel Data

| Attribute   | Value                                                      |
| ----------- | ---------------------------------------------------------- |
| **Rows**    | 240                                                        |
| **Columns** | 22                                                         |
| **Purpose** | EPA efficiency data including MPG, emissions, and EV range |

**Key Fields:**

| Field              | Type    | Purpose                              |
| ------------------ | ------- | ------------------------------------ |
| `car_slug`         | TEXT    | FK to cars via slug                  |
| `city_mpg`         | INTEGER | City fuel economy                    |
| `highway_mpg`      | INTEGER | Highway fuel economy                 |
| `combined_mpg`     | INTEGER | Combined fuel economy                |
| `fuel_type`        | TEXT    | Fuel type (Premium/Regular/Electric) |
| `annual_fuel_cost` | INTEGER | Estimated annual fuel cost           |
| `co2_emissions`    | INTEGER | CO2 emissions (g/mile)               |
| `ghg_score`        | INTEGER | Greenhouse gas score (1-10)          |
| `is_electric`      | BOOLEAN | Is electric vehicle                  |
| `is_hybrid`        | BOOLEAN | Is hybrid vehicle                    |
| `ev_range`         | INTEGER | Electric range (miles)               |

---

### `car_safety_data` — NHTSA/IIHS Ratings

| Attribute   | Value                                          |
| ----------- | ---------------------------------------------- |
| **Rows**    | 190                                            |
| **Columns** | 29                                             |
| **Purpose** | Safety ratings from NHTSA and IIHS crash tests |

**Key Fields:**

| Field                      | Type    | Purpose                          |
| -------------------------- | ------- | -------------------------------- |
| `car_slug`                 | TEXT    | FK to cars via slug              |
| `nhtsa_overall_rating`     | INTEGER | Overall NHTSA rating (1-5 stars) |
| `nhtsa_front_crash_rating` | INTEGER | Frontal crash rating             |
| `nhtsa_side_crash_rating`  | INTEGER | Side crash rating                |
| `nhtsa_rollover_rating`    | INTEGER | Rollover resistance rating       |
| `recall_count`             | INTEGER | Number of recalls                |
| `complaint_count`          | INTEGER | Number of complaints             |
| `iihs_overall`             | TEXT    | IIHS overall rating              |
| `iihs_top_safety_pick`     | BOOLEAN | Top Safety Pick status           |
| `safety_score`             | DECIMAL | Computed safety score            |
| `safety_grade`             | TEXT    | Letter grade (A/B/C/D/F)         |

---

### `car_issues` — Known Problems

| Attribute   | Value                                              |
| ----------- | -------------------------------------------------- |
| **Rows**    | 9,092                                              |
| **Columns** | 23                                                 |
| **Purpose** | Documented known issues, common problems, and TSBs |

**Key Fields:**

| Field                 | Type | Purpose                                      |
| --------------------- | ---- | -------------------------------------------- |
| `car_slug`            | TEXT | FK to cars via slug                          |
| `title`               | TEXT | Issue title                                  |
| `kind`                | TEXT | Issue type (mechanical/electrical/body/etc.) |
| `severity`            | TEXT | Severity level (low/medium/high/critical)    |
| `affected_years_text` | TEXT | Affected model years                         |
| `description`         | TEXT | Detailed description                         |
| `symptoms`            | TEXT | Symptoms to look for                         |
| `prevention`          | TEXT | Prevention tips                              |
| `fix_description`     | TEXT | How to fix                                   |
| `estimated_cost_text` | TEXT | Estimated repair cost                        |
| `source_url`          | TEXT | Source reference                             |

---

### `car_recalls` — Recall Information

| Attribute   | Value                                         |
| ----------- | --------------------------------------------- |
| **Rows**    | 1,360                                         |
| **Columns** | 16                                            |
| **Purpose** | NHTSA recall campaign data linked to vehicles |

**Key Fields:**

| Field             | Type    | Purpose                  |
| ----------------- | ------- | ------------------------ |
| `car_slug`        | TEXT    | FK to cars via slug      |
| `car_id`          | UUID    | FK to cars               |
| `campaign_number` | TEXT    | NHTSA campaign number    |
| `recall_date`     | DATE    | Recall announcement date |
| `component`       | TEXT    | Affected component       |
| `summary`         | TEXT    | Recall summary           |
| `consequence`     | TEXT    | Safety consequences      |
| `remedy`          | TEXT    | Fix/remedy description   |
| `manufacturer`    | TEXT    | Manufacturer name        |
| `is_incomplete`   | BOOLEAN | Is recall still open     |

---

### `car_market_pricing` — Market Values

| Attribute   | Value                                                |
| ----------- | ---------------------------------------------------- |
| **Rows**    | 10                                                   |
| **Columns** | 30                                                   |
| **Purpose** | Aggregated market values from BaT, Cars.com, Hagerty |

**Key Fields:**

| Field               | Type    | Purpose                          |
| ------------------- | ------- | -------------------------------- |
| `car_slug`          | TEXT    | FK to cars via slug              |
| `bat_avg_price`     | INTEGER | Bring a Trailer average          |
| `bat_median_price`  | INTEGER | Bring a Trailer median           |
| `carscom_avg_price` | INTEGER | Cars.com average                 |
| `hagerty_concours`  | INTEGER | Hagerty concours value           |
| `hagerty_excellent` | INTEGER | Hagerty excellent condition      |
| `hagerty_good`      | INTEGER | Hagerty good condition           |
| `hagerty_fair`      | INTEGER | Hagerty fair condition           |
| `consensus_price`   | INTEGER | Computed consensus price         |
| `market_trend`      | TEXT    | Trend direction (up/down/stable) |

---

### `car_dyno_runs` — Real Dyno Data

| Attribute   | Value                                       |
| ----------- | ------------------------------------------- |
| **Rows**    | 641                                         |
| **Columns** | 30                                          |
| **Purpose** | Actual dyno measurements from real vehicles |

**Key Fields:**

| Field           | Type    | Purpose                            |
| --------------- | ------- | ---------------------------------- |
| `car_slug`      | TEXT    | FK to cars via slug                |
| `run_kind`      | TEXT    | Run type (baseline/modded)         |
| `dyno_type`     | TEXT    | Dyno type (Dynojet/Mustang/etc.)   |
| `peak_whp`      | DECIMAL | Peak wheel horsepower              |
| `peak_wtq`      | DECIMAL | Peak wheel torque                  |
| `peak_hp`       | INTEGER | Peak crank horsepower (calculated) |
| `peak_tq`       | INTEGER | Peak crank torque (calculated)     |
| `boost_psi_max` | DECIMAL | Maximum boost pressure             |
| `fuel`          | TEXT    | Fuel type used                     |
| `modifications` | TEXT    | Modifications list                 |
| `source_url`    | TEXT    | Source reference                   |
| `verified`      | BOOLEAN | Is data verified                   |

---

### `car_track_lap_times` — Track Benchmarks

| Attribute   | Value                                     |
| ----------- | ----------------------------------------- |
| **Rows**    | 1,235                                     |
| **Columns** | 24                                        |
| **Purpose** | Real lap times from actual track sessions |

**Key Fields:**

| Field           | Type    | Purpose                               |
| --------------- | ------- | ------------------------------------- |
| `car_slug`      | TEXT    | FK to cars via slug                   |
| `track_id`      | UUID    | FK to tracks table                    |
| `lap_time_ms`   | INTEGER | Lap time in milliseconds              |
| `lap_time_text` | TEXT    | Formatted lap time (e.g., "1:23.456") |
| `session_date`  | DATE    | Date of track session                 |
| `is_stock`      | BOOLEAN | Is car stock configuration            |
| `tires`         | TEXT    | Tire specification                    |
| `conditions`    | TEXT    | Track conditions                      |
| `modifications` | TEXT    | Modifications list                    |
| `source_url`    | TEXT    | Source reference                      |
| `verified`      | BOOLEAN | Is data verified                      |

---

### `car_tuning_profiles` — Tuning Configurations

| Attribute   | Value                                                              |
| ----------- | ------------------------------------------------------------------ |
| **Rows**    | 309                                                                |
| **Columns** | 25                                                                 |
| **Purpose** | Car-specific tuning data, upgrade paths, and performance potential |

**Key Fields:**

| Field                    | Type   | Purpose                         |
| ------------------------ | ------ | ------------------------------- |
| `car_id`                 | UUID   | FK to cars                      |
| `car_slug`               | TEXT   | FK to cars via slug             |
| `upgrades_by_objective`  | JSONB  | Upgrade recommendations by goal |
| `performance_potential`  | JSONB  | Max achievable specs            |
| `platform_strengths`     | TEXT[] | Platform strong points          |
| `platform_weaknesses`    | TEXT[] | Platform weak points            |
| `tuning_community_notes` | TEXT   | Community tuning insights       |

---

### `car_slug_aliases` — Slug Redirects

| Attribute   | Value                                                    |
| ----------- | -------------------------------------------------------- |
| **Rows**    | 38                                                       |
| **Columns** | 5                                                        |
| **Purpose** | Map alternate slugs to canonical car slugs for redirects |

**Key Fields:**

| Field            | Type | Purpose                     |
| ---------------- | ---- | --------------------------- |
| `alias`          | TEXT | Alternate slug              |
| `canonical_slug` | TEXT | Correct slug                |
| `car_id`         | UUID | FK to cars (auto-populated) |

---

## 2. Parts & Upgrades

### `parts` — Parts Catalog

| Attribute   | Value                               |
| ----------- | ----------------------------------- |
| **Rows**    | 6,448                               |
| **Columns** | 16                                  |
| **Purpose** | Aftermarket and OEM+ parts database |

**Key Fields:**

| Field          | Type    | Purpose                                        |
| -------------- | ------- | ---------------------------------------------- |
| `id`           | UUID    | Primary key                                    |
| `name`         | TEXT    | Part name                                      |
| `brand_name`   | TEXT    | Manufacturer brand                             |
| `part_number`  | TEXT    | Part number/SKU                                |
| `category`     | TEXT    | Category (intake/exhaust/tune/suspension/etc.) |
| `description`  | TEXT    | Part description                               |
| `quality_tier` | TEXT    | Quality tier (budget/mid/premium)              |
| `street_legal` | BOOLEAN | Is street legal                                |
| `is_active`    | BOOLEAN | Is currently available                         |
| `source_urls`  | TEXT[]  | Source URLs                                    |

---

### `part_fitments` — Car-to-Part Mapping

| Attribute   | Value                                  |
| ----------- | -------------------------------------- |
| **Rows**    | 9,299                                  |
| **Columns** | 16                                     |
| **Purpose** | Defines which parts fit which vehicles |

**Key Fields:**

| Field                   | Type    | Purpose                       |
| ----------------------- | ------- | ----------------------------- |
| `part_id`               | UUID    | FK to parts                   |
| `car_id`                | UUID    | FK to cars                    |
| `car_variant_id`        | UUID    | FK to car_variants (optional) |
| `fitment_notes`         | TEXT    | Installation notes            |
| `requires_tune`         | BOOLEAN | Requires ECU tune             |
| `install_difficulty`    | TEXT    | Difficulty level              |
| `estimated_labor_hours` | DECIMAL | Labor time estimate           |
| `verified`              | BOOLEAN | Is fitment verified           |
| `confidence`            | DECIMAL | Confidence score (0-1)        |
| `source_url`            | TEXT    | Source reference              |

---

### `part_pricing_snapshots` — Price Tracking

| Attribute   | Value                              |
| ----------- | ---------------------------------- |
| **Rows**    | 6,827                              |
| **Columns** | 10                                 |
| **Purpose** | Historical price data from vendors |

**Key Fields:**

| Field         | Type      | Purpose                 |
| ------------- | --------- | ----------------------- |
| `part_id`     | UUID      | FK to parts             |
| `vendor_name` | TEXT      | Vendor name             |
| `vendor_url`  | TEXT      | Vendor website          |
| `product_url` | TEXT      | Direct product link     |
| `currency`    | TEXT      | Currency code           |
| `price_cents` | INTEGER   | Price in cents          |
| `in_stock`    | BOOLEAN   | Availability status     |
| `recorded_at` | TIMESTAMP | When price was recorded |

---

### `part_relationships` — Compatibility

| Attribute   | Value                                              |
| ----------- | -------------------------------------------------- |
| **Rows**    | 38                                                 |
| **Columns** | 7                                                  |
| **Purpose** | Defines which parts work well together or conflict |

**Key Fields:**

| Field             | Type | Purpose                                    |
| ----------------- | ---- | ------------------------------------------ |
| `part_id`         | UUID | FK to parts                                |
| `related_part_id` | UUID | FK to related part                         |
| `relation_type`   | TEXT | Relationship (requires/suggests/conflicts) |
| `reason`          | TEXT | Explanation                                |

---

### `part_brands` — Brand Metadata

| Attribute   | Value                          |
| ----------- | ------------------------------ |
| **Rows**    | 9                              |
| **Columns** | 7                              |
| **Purpose** | Brand information and metadata |

**Key Fields:**

| Field     | Type | Purpose           |
| --------- | ---- | ----------------- |
| `name`    | TEXT | Brand name        |
| `website` | TEXT | Brand website     |
| `country` | TEXT | Country of origin |
| `notes`   | TEXT | Additional notes  |

---

### `upgrade_keys` — Upgrade Reference

| Attribute   | Value                                                |
| ----------- | ---------------------------------------------------- |
| **Rows**    | 49                                                   |
| **Columns** | 9                                                    |
| **Purpose** | Canonical upgrade definitions used across the system |

**Key Fields:**

| Field               | Type    | Purpose                                      |
| ------------------- | ------- | -------------------------------------------- |
| `key`               | TEXT    | Unique upgrade key (e.g., "cold_air_intake") |
| `name`              | TEXT    | Display name                                 |
| `category`          | TEXT    | Category (intake/exhaust/etc.)               |
| `description`       | TEXT    | Upgrade description                          |
| `typical_cost_low`  | INTEGER | Low cost estimate                            |
| `typical_cost_high` | INTEGER | High cost estimate                           |

---

### `upgrade_packages` — Curated Bundles

| Attribute   | Value                                                       |
| ----------- | ----------------------------------------------------------- |
| **Rows**    | 42                                                          |
| **Columns** | 30                                                          |
| **Purpose** | Pre-built upgrade packages (Street Sport, Track Pack, etc.) |

**Key Fields:**

| Field                 | Type    | Purpose                    |
| --------------------- | ------- | -------------------------- |
| `name`                | TEXT    | Package name               |
| `tier`                | TEXT    | Package tier (Stage 1/2/3) |
| `category`            | TEXT    | Focus area                 |
| `estimated_cost_low`  | INTEGER | Low price estimate         |
| `estimated_cost_high` | INTEGER | High price estimate        |
| `delta_hp`            | INTEGER | HP gain                    |
| `delta_torque`        | INTEGER | Torque gain                |
| `delta_zero_to_sixty` | DECIMAL | 0-60 improvement           |

---

### `upgrade_key_parts` — Package Contents

| Attribute   | Value                                            |
| ----------- | ------------------------------------------------ |
| **Rows**    | 2,767                                            |
| **Columns** | 6                                                |
| **Purpose** | Links upgrade_keys to specific recommended parts |

**Key Fields:**

| Field         | Type    | Purpose                 |
| ------------- | ------- | ----------------------- |
| `upgrade_key` | TEXT    | FK to upgrade_keys      |
| `part_id`     | UUID    | FK to parts             |
| `priority`    | INTEGER | Recommendation priority |
| `notes`       | TEXT    | Installation notes      |

---

## 3. User Data

### `user_profiles` — User Settings & Billing

| Attribute   | Value                                                               |
| ----------- | ------------------------------------------------------------------- |
| **Rows**    | 70                                                                  |
| **Columns** | 45                                                                  |
| **Purpose** | User preferences, subscription tier, Stripe billing, and onboarding |

**Key Fields:**

| Field                 | Type    | Purpose                                        |
| --------------------- | ------- | ---------------------------------------------- |
| `id`                  | UUID    | FK to auth.users                               |
| `display_name`        | TEXT    | User's display name                            |
| `avatar_url`          | TEXT    | Profile picture URL                            |
| `subscription_tier`   | TEXT    | Current tier (free/enthusiast/tuner/collector) |
| `preferred_units`     | TEXT    | Imperial or metric                             |
| `email_notifications` | BOOLEAN | Email preferences                              |

**Stripe Billing Fields:**

| Field                        | Type      | Purpose                   |
| ---------------------------- | --------- | ------------------------- |
| `stripe_customer_id`         | TEXT      | Stripe customer ID        |
| `stripe_subscription_id`     | TEXT      | Stripe subscription ID    |
| `stripe_subscription_status` | TEXT      | Subscription status       |
| `subscription_started_at`    | TIMESTAMP | Subscription start date   |
| `subscription_ends_at`       | TIMESTAMP | Subscription end date     |
| `cancel_at_period_end`       | BOOLEAN   | Will cancel at period end |
| `al_credits_purchased`       | INTEGER   | Purchased AL credits      |

**Onboarding Fields:**

| Field                     | Type      | Purpose                    |
| ------------------------- | --------- | -------------------------- |
| `referral_source`         | TEXT      | How user found AutoRev     |
| `user_intent`             | TEXT      | User's primary goal        |
| `onboarding_completed_at` | TIMESTAMP | Onboarding completion time |
| `onboarding_step`         | INTEGER   | Current onboarding step    |

**Location Fields:**

| Field            | Type | Purpose  |
| ---------------- | ---- | -------- |
| `location_zip`   | TEXT | Zip code |
| `location_city`  | TEXT | City     |
| `location_state` | TEXT | State    |

---

### `user_vehicles` — Owned Vehicles

| Attribute   | Value                                                               |
| ----------- | ------------------------------------------------------------------- |
| **Rows**    | 45                                                                  |
| **Columns** | 51                                                                  |
| **Purpose** | User's owned vehicles with VIN, modifications, and service tracking |

**Key Fields:**

| Field                    | Type    | Purpose                     |
| ------------------------ | ------- | --------------------------- |
| `user_id`                | UUID    | FK to user_profiles         |
| `matched_car_slug`       | TEXT    | Linked AutoRev car          |
| `matched_car_id`         | UUID    | FK to cars                  |
| `matched_car_variant_id` | UUID    | FK to car_variants          |
| `vin`                    | TEXT    | Vehicle VIN                 |
| `year`                   | INTEGER | Model year                  |
| `make`                   | TEXT    | Manufacturer                |
| `model`                  | TEXT    | Model name                  |
| `trim`                   | TEXT    | Trim level                  |
| `nickname`               | TEXT    | User's nickname for vehicle |
| `mileage`                | INTEGER | Current mileage             |
| `purchase_date`          | DATE    | Purchase date               |
| `purchase_price`         | INTEGER | Purchase price              |

**Modification Fields:**

| Field                     | Type      | Purpose                         |
| ------------------------- | --------- | ------------------------------- |
| `installed_modifications` | JSONB     | Array of installed upgrade keys |
| `active_build_id`         | UUID      | FK to user_projects             |
| `total_hp_gain`           | INTEGER   | Total HP added by mods          |
| `modified_at`             | TIMESTAMP | Last modification date          |

**Service Tracking Fields:**

| Field                   | Type      | Purpose                    |
| ----------------------- | --------- | -------------------------- |
| `current_mileage`       | INTEGER   | Current odometer reading   |
| `mileage_updated_at`    | TIMESTAMP | Last mileage update        |
| `usage_type`            | TEXT      | daily/weekend/track/stored |
| `last_oil_change_miles` | INTEGER   | Oil change mileage         |
| `last_oil_change_date`  | DATE      | Oil change date            |
| `last_brake_fluid_date` | DATE      | Brake fluid change date    |

**Car Concierge Fields:**

| Field                    | Type      | Purpose               |
| ------------------------ | --------- | --------------------- |
| `last_started_at`        | TIMESTAMP | Last engine start     |
| `battery_status`         | TEXT      | Battery health status |
| `battery_installed_date` | DATE      | Battery install date  |
| `storage_mode`           | BOOLEAN   | In storage mode       |
| `tire_brand_model`       | TEXT      | Current tires         |
| `tire_tread_32nds`       | INTEGER   | Tire tread depth      |
| `registration_due_date`  | DATE      | Registration renewal  |
| `inspection_due_date`    | DATE      | Inspection due date   |

---

### `user_favorites` — Saved Cars

| Attribute   | Value                                 |
| ----------- | ------------------------------------- |
| **Rows**    | 17                                    |
| **Columns** | 10                                    |
| **Purpose** | Cars saved to user's garage favorites |

**Key Fields:**

| Field        | Type      | Purpose              |
| ------------ | --------- | -------------------- |
| `user_id`    | UUID      | FK to user_profiles  |
| `car_slug`   | TEXT      | FK to cars           |
| `car_id`     | UUID      | FK to cars           |
| `car_name`   | TEXT      | Snapshot of car name |
| `notes`      | TEXT      | User notes           |
| `created_at` | TIMESTAMP | When favorited       |

---

### `user_projects` — Build Projects

| Attribute   | Value                                        |
| ----------- | -------------------------------------------- |
| **Rows**    | 32                                           |
| **Columns** | 15                                           |
| **Purpose** | User's saved build projects from Tuning Shop |

**Key Fields:**

| Field               | Type    | Purpose               |
| ------------------- | ------- | --------------------- |
| `user_id`           | UUID    | FK to user_profiles   |
| `car_slug`          | TEXT    | FK to cars            |
| `car_id`            | UUID    | FK to cars            |
| `project_name`      | TEXT    | Build name            |
| `selected_upgrades` | JSONB   | Selected upgrade keys |
| `total_hp_gain`     | INTEGER | Total HP gain         |
| `total_cost_low`    | INTEGER | Cost estimate low     |
| `total_cost_high`   | INTEGER | Cost estimate high    |

**Performance Snapshots:**

| Field                 | Type    | Purpose                 |
| --------------------- | ------- | ----------------------- |
| `stock_hp`            | INTEGER | Original HP             |
| `final_hp`            | INTEGER | Projected HP after mods |
| `stock_zero_to_sixty` | DECIMAL | Original 0-60           |
| `final_zero_to_sixty` | DECIMAL | Projected 0-60          |

---

### `user_project_parts` — Build Part Selections

| Attribute   | Value                                  |
| ----------- | -------------------------------------- |
| **Rows**    | 16                                     |
| **Columns** | 23                                     |
| **Purpose** | Specific parts added to build projects |

**Key Fields:**

| Field         | Type    | Purpose                    |
| ------------- | ------- | -------------------------- |
| `project_id`  | UUID    | FK to user_projects        |
| `part_id`     | UUID    | FK to parts                |
| `quantity`    | INTEGER | Quantity needed            |
| `part_name`   | TEXT    | Part name snapshot         |
| `brand_name`  | TEXT    | Brand snapshot             |
| `price_cents` | INTEGER | Price at time of selection |

---

### `user_service_logs` — Service Records

| Attribute   | Value                                  |
| ----------- | -------------------------------------- |
| **Rows**    | 1                                      |
| **Columns** | 22                                     |
| **Purpose** | Maintenance history for owned vehicles |

**Key Fields:**

| Field              | Type    | Purpose             |
| ------------------ | ------- | ------------------- |
| `user_vehicle_id`  | UUID    | FK to user_vehicles |
| `service_type`     | TEXT    | Type of service     |
| `service_date`     | DATE    | Service date        |
| `odometer_reading` | INTEGER | Mileage at service  |
| `performed_by`     | TEXT    | Who did the work    |
| `shop_name`        | TEXT    | Shop name           |
| `parts_cost`       | INTEGER | Parts cost          |
| `labor_cost`       | INTEGER | Labor cost          |
| `total_cost`       | INTEGER | Total cost          |

---

### `user_feedback` — User Feedback

| Attribute   | Value                                            |
| ----------- | ------------------------------------------------ |
| **Rows**    | 43                                               |
| **Columns** | 47                                               |
| **Purpose** | Beta and user feedback submitted through the app |

**Key Fields:**

| Field             | Type    | Purpose                            |
| ----------------- | ------- | ---------------------------------- |
| `user_id`         | UUID    | FK to user_profiles                |
| `page_url`        | TEXT    | Page where feedback was submitted  |
| `feedback_type`   | TEXT    | Type (bug/feature/praise/question) |
| `message`         | TEXT    | Feedback content                   |
| `email`           | TEXT    | User email                         |
| `category`        | TEXT    | Category                           |
| `severity`        | TEXT    | Issue severity                     |
| `rating`          | INTEGER | User rating                        |
| `user_tier`       | TEXT    | User's subscription tier           |
| `status`          | TEXT    | Resolution status                  |
| `issue_addressed` | BOOLEAN | Has issue been addressed           |

---

### `user_questionnaire_responses` — Enthusiast Profile

| Attribute   | Value                                            |
| ----------- | ------------------------------------------------ |
| **Rows**    | 82                                               |
| **Columns** | 7                                                |
| **Purpose** | Questionnaire responses for user personalization |

**Key Fields:**

| Field               | Type      | Purpose                               |
| ------------------- | --------- | ------------------------------------- |
| `user_id`           | UUID      | FK to user_profiles                   |
| `question_id`       | TEXT      | Question identifier                   |
| `question_category` | TEXT      | Category (core/driving_behavior/etc.) |
| `answer`            | JSONB     | User's answer                         |
| `answered_at`       | TIMESTAMP | When answered                         |

---

### `user_profile_summary` — Computed Persona

| Attribute   | Value                                                 |
| ----------- | ----------------------------------------------------- |
| **Rows**    | 2                                                     |
| **Columns** | 11                                                    |
| **Purpose** | Computed profile summary from questionnaire responses |

**Key Fields:**

| Field                      | Type    | Purpose                       |
| -------------------------- | ------- | ----------------------------- |
| `user_id`                  | UUID    | FK to user_profiles           |
| `profile_completeness_pct` | INTEGER | Profile completion percentage |
| `driving_persona`          | TEXT    | Computed persona type         |
| `knowledge_level`          | TEXT    | Expertise level               |
| `engagement_style`         | TEXT    | How user engages              |
| `interests`                | TEXT[]  | Interest areas                |
| `category_completion`      | JSONB   | Completion by category        |

**Personas:** track_enthusiast, spirited_driver, casual_enthusiast, weekend_warrior, garage_tinkerer

**Knowledge Levels:** beginner, intermediate, expert

---

## 4. AL (AI Assistant)

### `al_conversations` — Chat Sessions

| Attribute   | Value                                 |
| ----------- | ------------------------------------- |
| **Rows**    | 105                                   |
| **Columns** | 15                                    |
| **Purpose** | AL conversation metadata and tracking |

**Key Fields:**

| Field                | Type      | Purpose              |
| -------------------- | --------- | -------------------- |
| `id`                 | UUID      | Primary key          |
| `user_id`            | UUID      | FK to user_profiles  |
| `title`              | TEXT      | Conversation title   |
| `summary`            | TEXT      | AI-generated summary |
| `initial_car_slug`   | TEXT      | Car context          |
| `initial_car_id`     | UUID      | FK to cars           |
| `message_count`      | INTEGER   | Number of messages   |
| `total_credits_used` | INTEGER   | Credits consumed     |
| `last_message_at`    | TIMESTAMP | Last activity        |

---

### `al_messages` — Chat Messages

| Attribute   | Value                                |
| ----------- | ------------------------------------ |
| **Rows**    | 441                                  |
| **Columns** | 12                                   |
| **Purpose** | Individual messages in conversations |

**Key Fields:**

| Field             | Type    | Purpose                       |
| ----------------- | ------- | ----------------------------- |
| `conversation_id` | UUID    | FK to al_conversations        |
| `role`            | TEXT    | Message role (user/assistant) |
| `content`         | TEXT    | Message content               |
| `tool_calls`      | JSONB   | Tools invoked                 |
| `credits_used`    | INTEGER | Credits for this message      |
| `response_tokens` | INTEGER | Token count                   |
| `sequence_number` | INTEGER | Message order                 |

---

### `al_user_credits` — Credit Balances

| Attribute   | Value                              |
| ----------- | ---------------------------------- |
| **Rows**    | 70                                 |
| **Columns** | 16                                 |
| **Purpose** | User's AL usage balance and limits |

**Key Fields:**

| Field                      | Type    | Purpose              |
| -------------------------- | ------- | -------------------- |
| `user_id`                  | UUID    | FK to user_profiles  |
| `subscription_tier`        | TEXT    | User's tier          |
| `balance_cents`            | INTEGER | Current balance      |
| `purchased_cents`          | INTEGER | Total purchased      |
| `spent_cents_this_month`   | INTEGER | Monthly spend        |
| `input_tokens_this_month`  | INTEGER | Input tokens used    |
| `output_tokens_this_month` | INTEGER | Output tokens used   |
| `is_unlimited`             | BOOLEAN | Has unlimited access |

---

### `al_usage_logs` — Usage Tracking

| Attribute   | Value                                   |
| ----------- | --------------------------------------- |
| **Rows**    | 115                                     |
| **Columns** | 18                                      |
| **Purpose** | Detailed AL usage logging for analytics |

**Key Fields:**

| Field           | Type    | Purpose             |
| --------------- | ------- | ------------------- |
| `user_id`       | UUID    | FK to user_profiles |
| `credits_used`  | INTEGER | Credits consumed    |
| `tool_calls`    | JSONB   | Tools invoked       |
| `input_tokens`  | INTEGER | Input token count   |
| `output_tokens` | INTEGER | Output token count  |
| `cost_cents`    | INTEGER | Cost in cents       |
| `model`         | TEXT    | AI model used       |

---

### `al_articles` — AI-Generated Articles

| Attribute   | Value                                          |
| ----------- | ---------------------------------------------- |
| **Rows**    | 58                                             |
| **Columns** | 33                                             |
| **Purpose** | AI-generated car-specific articles and content |

**Key Fields:**

| Field          | Type      | Purpose            |
| -------------- | --------- | ------------------ |
| `car_slugs`    | TEXT[]    | Related car slugs  |
| `car_ids`      | UUID[]    | Related car IDs    |
| `article_type` | TEXT      | Article type       |
| `title`        | TEXT      | Article title      |
| `content`      | TEXT      | Article body       |
| `summary`      | TEXT      | Short summary      |
| `status`       | TEXT      | Publication status |
| `published_at` | TIMESTAMP | Publication date   |

---

## 5. Knowledge Base

### `source_documents` — Document Sources

| Attribute   | Value                                    |
| ----------- | ---------------------------------------- |
| **Rows**    | 764                                      |
| **Columns** | 12                                       |
| **Purpose** | Ingested documents for AI knowledge base |

**Key Fields:**

| Field          | Type  | Purpose             |
| -------------- | ----- | ------------------- |
| `id`           | UUID  | Primary key         |
| `source_type`  | TEXT  | Document type       |
| `source_url`   | TEXT  | Source URL          |
| `source_title` | TEXT  | Document title      |
| `license`      | TEXT  | Content license     |
| `raw_text`     | TEXT  | Full document text  |
| `metadata`     | JSONB | Additional metadata |

---

### `document_chunks` — Vector Embeddings

| Attribute   | Value                                               |
| ----------- | --------------------------------------------------- |
| **Rows**    | 7,447                                               |
| **Columns** | 13                                                  |
| **Purpose** | Chunked content with embeddings for semantic search |

**Key Fields:**

| Field             | Type    | Purpose                |
| ----------------- | ------- | ---------------------- |
| `document_id`     | UUID    | FK to source_documents |
| `car_id`          | UUID    | FK to cars             |
| `car_slug`        | TEXT    | Car context            |
| `chunk_index`     | INTEGER | Position in document   |
| `chunk_text`      | TEXT    | Chunk content          |
| `chunk_tokens`    | INTEGER | Token count            |
| `topic`           | TEXT    | Detected topic         |
| `embedding_model` | TEXT    | Embedding model used   |
| `embedding`       | VECTOR  | Vector embedding       |

---

## 6. YouTube & Media

### `youtube_videos` — Video Metadata

| Attribute   | Value                                           |
| ----------- | ----------------------------------------------- |
| **Rows**    | 2,261                                           |
| **Columns** | 42                                              |
| **Purpose** | YouTube video details and AI-generated insights |

**Key Fields:**

| Field              | Type    | Purpose            |
| ------------------ | ------- | ------------------ |
| `video_id`         | TEXT    | YouTube video ID   |
| `url`              | TEXT    | Full video URL     |
| `title`            | TEXT    | Video title        |
| `channel_id`       | TEXT    | YouTube channel ID |
| `channel_name`     | TEXT    | Channel name       |
| `duration_seconds` | INTEGER | Video length       |
| `view_count`       | INTEGER | View count         |

**AI-Generated Fields:**

| Field            | Type    | Purpose               |
| ---------------- | ------- | --------------------- |
| `summary`        | TEXT    | AI summary            |
| `one_line_take`  | TEXT    | Quick verdict         |
| `key_points`     | JSONB   | Main points           |
| `pros_mentioned` | JSONB   | Pros discussed        |
| `cons_mentioned` | JSONB   | Cons discussed        |
| `notable_quotes` | JSONB   | Key quotes            |
| `quality_score`  | DECIMAL | Content quality score |

---

### `youtube_video_car_links` — Video-to-Car Mapping

| Attribute   | Value                                      |
| ----------- | ------------------------------------------ |
| **Rows**    | 2,302                                      |
| **Columns** | 25                                         |
| **Purpose** | Links videos to specific cars with context |

**Key Fields:**

| Field              | Type    | Purpose                             |
| ------------------ | ------- | ----------------------------------- |
| `video_id`         | TEXT    | FK to youtube_videos                |
| `car_slug`         | TEXT    | FK to cars                          |
| `car_id`           | UUID    | FK to cars                          |
| `role`             | TEXT    | Video role (review/comparison/etc.) |
| `match_confidence` | DECIMAL | Matching confidence                 |

---

### `youtube_channels` — Channel Metadata

| Attribute   | Value                                          |
| ----------- | ---------------------------------------------- |
| **Rows**    | 29                                             |
| **Columns** | 17                                             |
| **Purpose** | Trusted YouTube channels for content ingestion |

**Key Fields:**

| Field              | Type    | Purpose              |
| ------------------ | ------- | -------------------- |
| `channel_id`       | TEXT    | YouTube channel ID   |
| `channel_name`     | TEXT    | Channel name         |
| `channel_handle`   | TEXT    | @handle              |
| `credibility_tier` | TEXT    | Trust tier (1/2/3)   |
| `content_focus`    | TEXT    | Primary content type |
| `primary_brands`   | TEXT[]  | Brands covered       |
| `auto_ingest`      | BOOLEAN | Auto-import videos   |

**Channels Include:** Throttle House, Savagegeese, Doug DeMuro, etc.

---

### `youtube_ingestion_queue` — Processing Queue

| Attribute   | Value                        |
| ----------- | ---------------------------- |
| **Rows**    | 1,283                        |
| **Columns** | 17                           |
| **Purpose** | Videos pending AI processing |

**Key Fields:**

| Field             | Type    | Purpose             |
| ----------------- | ------- | ------------------- |
| `video_id`        | TEXT    | YouTube video ID    |
| `video_url`       | TEXT    | Full URL            |
| `channel_id`      | TEXT    | Channel ID          |
| `discovered_via`  | TEXT    | How discovered      |
| `target_car_slug` | TEXT    | Target car          |
| `status`          | TEXT    | Processing status   |
| `priority`        | INTEGER | Processing priority |
| `attempts`        | INTEGER | Processing attempts |

---

### `featured_content` — Curated Content

| Attribute   | Value                                   |
| ----------- | --------------------------------------- |
| **Rows**    | 166                                     |
| **Columns** | 38                                      |
| **Purpose** | Curated high-quality automotive content |

**Key Fields:**

| Field               | Type    | Purpose                                      |
| ------------------- | ------- | -------------------------------------------- |
| `source_type`       | TEXT    | Content type (youtube/vimeo/podcast/article) |
| `source_url`        | TEXT    | Content URL                                  |
| `title`             | TEXT    | Content title                                |
| `description`       | TEXT    | Description                                  |
| `channel_name`      | TEXT    | Creator name                                 |
| `category`          | TEXT    | Content category                             |
| `brands_featured`   | TEXT[]  | Brands covered                               |
| `topics`            | TEXT[]  | Topics covered                               |
| `related_car_slugs` | TEXT[]  | Related cars                                 |
| `related_car_ids`   | UUID[]  | Related car IDs                              |
| `component_focus`   | TEXT[]  | Components covered                           |
| `quality_score`     | DECIMAL | Quality rating                               |
| `is_editors_pick`   | BOOLEAN | Editor's pick                                |
| `ai_summary`        | TEXT    | AI-generated summary                         |

**Categories:** brand_documentary, engineering_deep_dive, driving_experience, comparison, review, motorsport, restoration, culture, educational, interview

---

## 7. Track & Performance

### `tracks` — Track Venues

| Attribute   | Value                           |
| ----------- | ------------------------------- |
| **Rows**    | 450                             |
| **Columns** | 12+                             |
| **Purpose** | Race track and circuit metadata |

**Key Fields:**

| Field       | Type    | Purpose                 |
| ----------- | ------- | ----------------------- |
| `slug`      | TEXT    | URL-friendly identifier |
| `name`      | TEXT    | Track name              |
| `country`   | TEXT    | Country                 |
| `region`    | TEXT    | Region/state            |
| `city`      | TEXT    | City                    |
| `length_km` | DECIMAL | Track length            |
| `surface`   | TEXT    | Surface type            |
| `website`   | TEXT    | Track website           |

---

### `track_layouts` — Layout Variants

| Attribute   | Value                                           |
| ----------- | ----------------------------------------------- |
| **Rows**    | 0                                               |
| **Columns** | 10                                              |
| **Purpose** | Different configurations per track (future use) |

**Key Fields:**

| Field        | Type    | Purpose                     |
| ------------ | ------- | --------------------------- |
| `track_id`   | UUID    | FK to tracks                |
| `layout_key` | TEXT    | Layout identifier           |
| `name`       | TEXT    | Layout name                 |
| `length_km`  | DECIMAL | Layout length               |
| `turns`      | INTEGER | Number of turns             |
| `direction`  | TEXT    | Clockwise/counter-clockwise |

---

### `user_track_times` — User Lap Times

| Attribute   | Value                                 |
| ----------- | ------------------------------------- |
| **Rows**    | 0                                     |
| **Columns** | 15+                                   |
| **Purpose** | User-logged lap times from track days |

**Key Fields:**

| Field             | Type    | Purpose                  |
| ----------------- | ------- | ------------------------ |
| `user_id`         | UUID    | FK to user_profiles      |
| `user_vehicle_id` | UUID    | FK to user_vehicles      |
| `track_id`        | UUID    | FK to tracks             |
| `lap_time_ms`     | INTEGER | Lap time in milliseconds |
| `session_date`    | DATE    | Track day date           |
| `conditions`      | TEXT    | Track conditions         |
| `notes`           | TEXT    | User notes               |

---

## 8. Forum Intelligence

### `forum_sources` — Forum Registry

| Attribute   | Value                                     |
| ----------- | ----------------------------------------- |
| **Rows**    | 17                                        |
| **Columns** | 15                                        |
| **Purpose** | Registry of forums to scrape for insights |

**Key Fields:**

| Field             | Type      | Purpose                |
| ----------------- | --------- | ---------------------- |
| `slug`            | TEXT      | Forum identifier       |
| `name`            | TEXT      | Forum name             |
| `base_url`        | TEXT      | Forum URL              |
| `car_brands`      | TEXT[]    | Brands covered         |
| `car_slugs`       | TEXT[]    | Specific cars covered  |
| `car_ids`         | UUID[]    | FK to cars             |
| `scrape_config`   | JSONB     | Scraping configuration |
| `priority`        | INTEGER   | Scrape priority        |
| `is_active`       | BOOLEAN   | Is actively scraped    |
| `last_scraped_at` | TIMESTAMP | Last scrape time       |

**Forums:** Rennlist, Bimmerpost, Miata.net, FT86Club, CorvetteForum, VWVortex, etc.

---

### `forum_scraped_threads` — Raw Scraped Content

| Attribute   | Value                                    |
| ----------- | ---------------------------------------- |
| **Rows**    | 308                                      |
| **Columns** | 19                                       |
| **Purpose** | Raw forum threads awaiting AI extraction |

**Key Fields:**

| Field                | Type    | Purpose            |
| -------------------- | ------- | ------------------ |
| `thread_url`         | TEXT    | Thread URL         |
| `thread_title`       | TEXT    | Thread title       |
| `subforum`           | TEXT    | Forum section      |
| `posts`              | JSONB   | Thread posts       |
| `processing_status`  | TEXT    | Processing status  |
| `relevance_score`    | DECIMAL | Relevance to cars  |
| `car_slugs_detected` | TEXT[]  | Cars mentioned     |
| `car_ids_detected`   | UUID[]  | FK to cars         |
| `insights_extracted` | INTEGER | Insights generated |

---

### `community_insights` — Extracted Insights

| Attribute   | Value                                            |
| ----------- | ------------------------------------------------ |
| **Rows**    | 1,661                                            |
| **Columns** | 24                                               |
| **Purpose** | Structured insights extracted from forum content |

**Key Fields:**

| Field                | Type    | Purpose                   |
| -------------------- | ------- | ------------------------- |
| `car_slug`           | TEXT    | FK to cars                |
| `car_id`             | UUID    | FK to cars                |
| `insight_type`       | TEXT    | Type of insight           |
| `title`              | TEXT    | Insight title             |
| `summary`            | TEXT    | Brief summary             |
| `details`            | JSONB   | Detailed content          |
| `confidence`         | DECIMAL | Extraction confidence     |
| `consensus_strength` | DECIMAL | Community agreement level |
| `source_forum`       | TEXT    | Source forum              |
| `source_urls`        | TEXT[]  | Source thread URLs        |
| `embedding`          | VECTOR  | Vector embedding          |

**Insight Types:** known_issue, maintenance_tip, modification_guide, troubleshooting, buying_guide, performance_data, reliability_report, cost_insight, comparison

---

### `community_insight_sources` — Multi-Source Tracking

| Attribute   | Value                                      |
| ----------- | ------------------------------------------ |
| **Rows**    | 1,649                                      |
| **Columns** | 8                                          |
| **Purpose** | Links insights to supporting forum threads |

**Key Fields:**

| Field              | Type    | Purpose                     |
| ------------------ | ------- | --------------------------- |
| `insight_id`       | UUID    | FK to community_insights    |
| `thread_id`        | UUID    | FK to forum_scraped_threads |
| `thread_url`       | TEXT    | Thread URL                  |
| `forum_slug`       | TEXT    | Forum identifier            |
| `relevance_score`  | DECIMAL | Relevance to insight        |
| `extracted_quotes` | TEXT[]  | Supporting quotes           |

---

## 9. Events

### `events` — Core Event Data

| Attribute   | Value                                               |
| ----------- | --------------------------------------------------- |
| **Rows**    | 8,737                                               |
| **Columns** | 37                                                  |
| **Purpose** | Car events (shows, Cars & Coffee, track days, etc.) |

**Key Fields:**

| Field           | Type | Purpose                 |
| --------------- | ---- | ----------------------- |
| `slug`          | TEXT | URL-friendly identifier |
| `name`          | TEXT | Event name              |
| `description`   | TEXT | Event description       |
| `event_type_id` | UUID | FK to event_types       |
| `start_date`    | DATE | Event start date        |
| `end_date`      | DATE | Event end date          |
| `start_time`    | TIME | Start time              |
| `end_time`      | TIME | End time                |
| `timezone`      | TEXT | Timezone                |

**Location Fields:**

| Field        | Type    | Purpose           |
| ------------ | ------- | ----------------- |
| `venue_name` | TEXT    | Venue name        |
| `address`    | TEXT    | Street address    |
| `city`       | TEXT    | City              |
| `state`      | TEXT    | State/province    |
| `zip`        | TEXT    | Postal code       |
| `country`    | TEXT    | Country           |
| `latitude`   | DECIMAL | GPS latitude      |
| `longitude`  | DECIMAL | GPS longitude     |
| `region`     | TEXT    | Geographic region |

**Meta Fields:**

| Field              | Type    | Purpose           |
| ------------------ | ------- | ----------------- |
| `source_url`       | TEXT    | Original source   |
| `registration_url` | TEXT    | Registration link |
| `image_url`        | TEXT    | Event image       |
| `cost_text`        | TEXT    | Cost information  |
| `is_free`          | BOOLEAN | Is free event     |
| `status`           | TEXT    | Event status      |
| `featured`         | BOOLEAN | Is featured event |

---

### `event_types` — Event Taxonomy

| Attribute   | Value                    |
| ----------- | ------------------------ |
| **Rows**    | 12                       |
| **Columns** | 8                        |
| **Purpose** | Categories of car events |

**Key Fields:**

| Field            | Type    | Purpose          |
| ---------------- | ------- | ---------------- |
| `slug`           | TEXT    | Type identifier  |
| `name`           | TEXT    | Display name     |
| `description`    | TEXT    | Type description |
| `icon`           | TEXT    | Emoji icon       |
| `sort_order`     | INTEGER | Display order    |
| `is_track_event` | BOOLEAN | Is track-based   |

**Types:** cars-and-coffee, car-show, club-meetup, cruise, autocross, track-day, time-attack, industry, auction, professional-race, other

---

### `event_series` — Recurring Event Series

| Attribute   | Value                           |
| ----------- | ------------------------------- |
| **Rows**    | 437                             |
| **Columns** | 16                              |
| **Purpose** | Define recurring event patterns |

**Key Fields:**

| Field             | Type | Purpose            |
| ----------------- | ---- | ------------------ |
| `name`            | TEXT | Series name        |
| `recurrence_rule` | TEXT | Recurrence pattern |
| `event_type_id`   | UUID | FK to event_types  |
| `venue_name`      | TEXT | Default venue      |
| `city`            | TEXT | City               |
| `state`           | TEXT | State              |

---

### `event_car_affinities` — Event-Car Links

| Attribute   | Value                                   |
| ----------- | --------------------------------------- |
| **Rows**    | 79                                      |
| **Columns** | 6                                       |
| **Purpose** | Links events to specific cars or brands |

**Key Fields:**

| Field           | Type | Purpose                    |
| --------------- | ---- | -------------------------- |
| `event_id`      | UUID | FK to events               |
| `car_id`        | UUID | FK to cars (nullable)      |
| `brand`         | TEXT | Brand name (nullable)      |
| `affinity_type` | TEXT | featured/welcome/exclusive |

---

### `event_rsvps` — User RSVPs

| Attribute   | Value                         |
| ----------- | ----------------------------- |
| **Rows**    | 0                             |
| **Columns** | 6+                            |
| **Purpose** | User RSVP tracking for events |

**Key Fields:**

| Field        | Type | Purpose                    |
| ------------ | ---- | -------------------------- |
| `user_id`    | UUID | FK to user_profiles        |
| `event_id`   | UUID | FK to events               |
| `status`     | TEXT | going/interested/not_going |
| `visibility` | TEXT | Public/private             |

---

### `event_saves` — Saved Events

| Attribute   | Value                  |
| ----------- | ---------------------- |
| **Rows**    | 1                      |
| **Columns** | 5                      |
| **Purpose** | User-bookmarked events |

**Key Fields:**

| Field      | Type | Purpose             |
| ---------- | ---- | ------------------- |
| `user_id`  | UUID | FK to user_profiles |
| `event_id` | UUID | FK to events        |
| `notes`    | TEXT | User notes          |

---

### `target_cities` — Event Coverage Tracking

| Attribute   | Value                                      |
| ----------- | ------------------------------------------ |
| **Rows**    | 494                                        |
| **Columns** | 21                                         |
| **Purpose** | Track event coverage for top 500 US cities |

**Key Fields:**

| Field               | Type    | Purpose                     |
| ------------------- | ------- | --------------------------- |
| `city`              | TEXT    | City name                   |
| `state`             | TEXT    | State                       |
| `population`        | INTEGER | Population                  |
| `population_rank`   | INTEGER | Population rank             |
| `latitude`          | DECIMAL | GPS latitude                |
| `longitude`         | DECIMAL | GPS longitude               |
| `region`            | TEXT    | Geographic region           |
| `priority_tier`     | INTEGER | Coverage priority (1=Top50) |
| `has_cnc_coverage`  | BOOLEAN | Has Cars & Coffee events    |
| `total_event_count` | INTEGER | Total events in area        |

---

## 10. Community & Social

### `community_posts` — User Posts/Builds

| Attribute   | Value                                         |
| ----------- | --------------------------------------------- |
| **Rows**    | 9                                             |
| **Columns** | 22                                            |
| **Purpose** | User-submitted builds, questions, and content |

**Key Fields:**

| Field           | Type    | Purpose             |
| --------------- | ------- | ------------------- |
| `user_id`       | UUID    | FK to user_profiles |
| `post_type`     | TEXT    | Post type           |
| `title`         | TEXT    | Post title          |
| `content`       | TEXT    | Post content        |
| `car_id`        | UUID    | FK to cars          |
| `status`        | TEXT    | Publication status  |
| `is_featured`   | BOOLEAN | Is featured post    |
| `like_count`    | INTEGER | Number of likes     |
| `comment_count` | INTEGER | Number of comments  |

---

### `community_post_comments` — Comments with AI Moderation

| Attribute   | Value                       |
| ----------- | --------------------------- |
| **Rows**    | 1                           |
| **Columns** | 14                          |
| **Purpose** | Comments on community posts |

**Key Fields:**

| Field               | Type    | Purpose                           |
| ------------------- | ------- | --------------------------------- |
| `post_id`           | UUID    | FK to community_posts             |
| `user_id`           | UUID    | FK to user_profiles               |
| `parent_comment_id` | UUID    | For replies                       |
| `content`           | TEXT    | Comment content                   |
| `moderation_status` | TEXT    | pending/approved/rejected/flagged |
| `moderation_reason` | TEXT    | Moderation explanation            |
| `moderation_score`  | DECIMAL | AI moderation score               |
| `like_count`        | INTEGER | Number of likes                   |

---

### `community_post_likes` — Post Likes

| Attribute   | Value                     |
| ----------- | ------------------------- |
| **Rows**    | 1                         |
| **Columns** | 4                         |
| **Purpose** | Track user likes on posts |

**Key Fields:**

| Field        | Type      | Purpose               |
| ------------ | --------- | --------------------- |
| `post_id`    | UUID      | FK to community_posts |
| `user_id`    | UUID      | FK to user_profiles   |
| `created_at` | TIMESTAMP | When liked            |

---

### `user_uploaded_images` — User Image Uploads

| Attribute   | Value                    |
| ----------- | ------------------------ |
| **Rows**    | 16                       |
| **Columns** | 29                       |
| **Purpose** | Images uploaded by users |

**Key Fields:**

| Field         | Type    | Purpose                      |
| ------------- | ------- | ---------------------------- |
| `user_id`     | UUID    | FK to user_profiles          |
| `blob_url`    | TEXT    | Storage URL                  |
| `blob_path`   | TEXT    | Storage path                 |
| `file_name`   | TEXT    | Original filename            |
| `file_size`   | INTEGER | File size in bytes           |
| `mime_type`   | TEXT    | MIME type                    |
| `image_type`  | TEXT    | Type (vehicle/build/profile) |
| `entity_type` | TEXT    | What it's attached to        |
| `entity_id`   | UUID    | Entity ID                    |

---

## 11. Maintenance

### `vehicle_maintenance_specs` — Fluid/Capacity Specs

| Attribute   | Value                                        |
| ----------- | -------------------------------------------- |
| **Rows**    | 310                                          |
| **Columns** | 130                                          |
| **Purpose** | Comprehensive OEM maintenance specifications |

**Key Fields:**

| Field                       | Type    | Purpose                     |
| --------------------------- | ------- | --------------------------- |
| `car_slug`                  | TEXT    | FK to cars                  |
| `oil_type`                  | TEXT    | Recommended oil type        |
| `oil_viscosity`             | TEXT    | Oil viscosity (e.g., 0W-40) |
| `oil_capacity_liters`       | DECIMAL | Oil capacity                |
| `oil_change_interval_miles` | INTEGER | Oil change interval         |
| `coolant_type`              | TEXT    | Coolant specification       |
| `brake_fluid_type`          | TEXT    | Brake fluid DOT rating      |
| `tire_size_front`           | TEXT    | Front tire size             |
| `tire_size_rear`            | TEXT    | Rear tire size              |
| `tire_pressure_front_psi`   | INTEGER | Front tire pressure         |
| `tire_pressure_rear_psi`    | INTEGER | Rear tire pressure          |
| `wheel_bolt_pattern`        | TEXT    | Bolt pattern                |
| `wheel_center_bore_mm`      | INTEGER | Center bore size            |

---

### `vehicle_service_intervals` — Service Schedules

| Attribute   | Value                    |
| ----------- | ------------------------ |
| **Rows**    | 6,089                    |
| **Columns** | 17                       |
| **Purpose** | When each service is due |

**Key Fields:**

| Field                 | Type    | Purpose                   |
| --------------------- | ------- | ------------------------- |
| `car_slug`            | TEXT    | FK to cars                |
| `service_name`        | TEXT    | Service name              |
| `service_description` | TEXT    | What the service includes |
| `interval_miles`      | INTEGER | Mileage interval          |
| `interval_months`     | INTEGER | Time interval             |
| `dealer_cost_low`     | INTEGER | Dealer cost low estimate  |
| `dealer_cost_high`    | INTEGER | Dealer cost high estimate |
| `diy_cost_low`        | INTEGER | DIY cost low estimate     |
| `diy_cost_high`       | INTEGER | DIY cost high estimate    |
| `is_critical`         | BOOLEAN | Is safety-critical        |

---

### `wheel_tire_fitment_options` — Wheel/Tire Combinations

| Attribute   | Value                                   |
| ----------- | --------------------------------------- |
| **Rows**    | 1,312                                   |
| **Columns** | 43                                      |
| **Purpose** | Compatible wheel/tire sizes per vehicle |

**Key Fields:**

| Field                        | Type    | Purpose                                              |
| ---------------------------- | ------- | ---------------------------------------------------- |
| `car_slug`                   | TEXT    | FK to cars                                           |
| `fitment_type`               | TEXT    | oem/oem_optional/plus_one/plus_two/aggressive/square |
| `wheel_diameter_inches`      | INTEGER | Wheel diameter                                       |
| `wheel_width_front`          | DECIMAL | Front wheel width                                    |
| `wheel_width_rear`           | DECIMAL | Rear wheel width                                     |
| `wheel_offset_front_mm`      | INTEGER | Front wheel offset                                   |
| `wheel_offset_rear_mm`       | INTEGER | Rear wheel offset                                    |
| `tire_size_front`            | TEXT    | Front tire size                                      |
| `tire_size_rear`             | TEXT    | Rear tire size                                       |
| `requires_fender_roll`       | BOOLEAN | Needs fender modification                            |
| `requires_camber_adjustment` | BOOLEAN | Needs camber adjustment                              |
| `clearance_notes`            | TEXT    | Clearance information                                |
| `recommended_for`            | TEXT    | Recommended use case                                 |

---

## 12. Email & Referrals

### `email_templates` — Email Template Storage

| Attribute   | Value                                |
| ----------- | ------------------------------------ |
| **Rows**    | 9                                    |
| **Columns** | 15                                   |
| **Purpose** | Admin-managed email template content |

**Key Fields:**

| Field                 | Type    | Purpose                   |
| --------------------- | ------- | ------------------------- |
| `slug`                | TEXT    | Template identifier       |
| `name`                | TEXT    | Template name             |
| `subject`             | TEXT    | Email subject line        |
| `preview_text`        | TEXT    | Preview text              |
| `html_content`        | TEXT    | HTML email body           |
| `category`            | TEXT    | Template category         |
| `requires_opt_in`     | BOOLEAN | Requires marketing opt-in |
| `is_active`           | BOOLEAN | Is currently active       |
| `available_variables` | JSONB   | Template variables        |

**Categories:** transactional, feature, event, engagement, referral

---

### `email_logs` — Email Delivery Log

| Attribute   | Value                 |
| ----------- | --------------------- |
| **Rows**    | 60                    |
| **Columns** | 15                    |
| **Purpose** | Track all sent emails |

**Key Fields:**

| Field             | Type      | Purpose             |
| ----------------- | --------- | ------------------- |
| `user_id`         | UUID      | FK to user_profiles |
| `recipient_email` | TEXT      | Recipient email     |
| `template_slug`   | TEXT      | Template used       |
| `subject`         | TEXT      | Email subject       |
| `resend_id`       | TEXT      | Resend message ID   |
| `status`          | TEXT      | Delivery status     |
| `error_message`   | TEXT      | Error if failed     |
| `sent_at`         | TIMESTAMP | Send time           |
| `delivered_at`    | TIMESTAMP | Delivery time       |
| `opened_at`       | TIMESTAMP | Open time           |
| `clicked_at`      | TIMESTAMP | Click time          |

**Statuses:** queued, sent, delivered, bounced, complained, failed, skipped, unsubscribed

---

### `referrals` — Referral Program Tracking

| Attribute   | Value                                    |
| ----------- | ---------------------------------------- |
| **Rows**    | 0                                        |
| **Columns** | 12                                       |
| **Purpose** | Track referral relationships and rewards |

**Key Fields:**

| Field                     | Type      | Purpose              |
| ------------------------- | --------- | -------------------- |
| `referrer_id`             | UUID      | FK to user_profiles  |
| `referee_id`              | UUID      | FK to user_profiles  |
| `referee_email`           | TEXT      | Referee's email      |
| `referral_code`           | TEXT      | Unique referral code |
| `status`                  | TEXT      | Referral status      |
| `referrer_reward_credits` | INTEGER   | Credits for referrer |
| `referee_reward_credits`  | INTEGER   | Credits for referee  |
| `rewarded_at`             | TIMESTAMP | When rewards given   |

**Statuses:** pending, signed_up, rewarded, expired

---

### `referral_milestones` — Milestone Configuration

| Attribute   | Value                           |
| ----------- | ------------------------------- |
| **Rows**    | 4                               |
| **Columns** | 9                               |
| **Purpose** | Define tiered reward milestones |

**Milestones:**

- 3 friends → +100 credits
- 5 friends → +200 credits
- 10 friends → 1 month Collector tier
- 25 friends → 1 month Tuner tier

---

## 13. Analytics & Tracking

### `click_events` — Click Tracking

| Attribute   | Value                                     |
| ----------- | ----------------------------------------- |
| **Rows**    | 29,444                                    |
| **Columns** | 15                                        |
| **Purpose** | Track user clicks on interactive elements |

**Key Fields:**

| Field          | Type  | Purpose              |
| -------------- | ----- | -------------------- |
| `user_id`      | UUID  | FK to user_profiles  |
| `session_id`   | TEXT  | Session identifier   |
| `element_type` | TEXT  | Element type clicked |
| `element_id`   | TEXT  | Element identifier   |
| `page_url`     | TEXT  | Page URL             |
| `metadata`     | JSONB | Additional context   |

---

### `page_views` — Page View Tracking

| Attribute   | Value             |
| ----------- | ----------------- |
| **Rows**    | 11,088            |
| **Columns** | 26                |
| **Purpose** | Track page visits |

**Key Fields:**

| Field         | Type    | Purpose             |
| ------------- | ------- | ------------------- |
| `user_id`     | UUID    | FK to user_profiles |
| `session_id`  | TEXT    | Session identifier  |
| `page_url`    | TEXT    | Page URL            |
| `referrer`    | TEXT    | Referrer URL        |
| `duration_ms` | INTEGER | Time on page        |
| `device_info` | JSONB   | Device metadata     |

---

### `page_engagement` — Engagement Metrics

| Attribute   | Value                                          |
| ----------- | ---------------------------------------------- |
| **Rows**    | 7,131                                          |
| **Columns** | 16                                             |
| **Purpose** | Track scroll depth, time on page, interactions |

**Key Fields:**

| Field          | Type    | Purpose               |
| -------------- | ------- | --------------------- |
| `page_view_id` | UUID    | FK to page_views      |
| `scroll_depth` | INTEGER | Max scroll percentage |
| `time_on_page` | INTEGER | Time in seconds       |
| `interactions` | JSONB   | Interaction events    |

---

### `user_events` — User Interaction Events

| Attribute   | Value                            |
| ----------- | -------------------------------- |
| **Rows**    | 1,375                            |
| **Columns** | 17                               |
| **Purpose** | Detailed user interaction events |

**Key Fields:**

| Field        | Type  | Purpose             |
| ------------ | ----- | ------------------- |
| `user_id`    | UUID  | FK to user_profiles |
| `event_type` | TEXT  | Event type          |
| `event_data` | JSONB | Event payload       |
| `session_id` | TEXT  | Session identifier  |
| `page_url`   | TEXT  | Page URL            |

**Standard Events:**

- **Onboarding:** signup_started, signup_completed, onboarding_step_N, onboarding_completed
- **Engagement:** page_view, session_start, feature_used
- **Features:** car_selected, car_favorited, garage_added, al_conversation_started
- **Conversion:** pricing_viewed, checkout_started, subscription_created

---

### `application_errors` — Error Tracking

| Attribute   | Value                                 |
| ----------- | ------------------------------------- |
| **Rows**    | 3,850                                 |
| **Columns** | 44                                    |
| **Purpose** | Centralized application error logging |

**Key Fields:**

| Field           | Type    | Purpose              |
| --------------- | ------- | -------------------- |
| `error_type`    | TEXT    | Error classification |
| `error_message` | TEXT    | Error message        |
| `stack_trace`   | TEXT    | Stack trace          |
| `user_id`       | UUID    | Affected user        |
| `page_url`      | TEXT    | Page URL             |
| `severity`      | TEXT    | Error severity       |
| `is_resolved`   | BOOLEAN | Resolution status    |

---

### `user_attribution` — Marketing Attribution

| Attribute   | Value                              |
| ----------- | ---------------------------------- |
| **Rows**    | 42                                 |
| **Columns** | 19                                 |
| **Purpose** | Track how users discovered AutoRev |

**Key Fields:**

| Field          | Type | Purpose             |
| -------------- | ---- | ------------------- |
| `user_id`      | UUID | FK to user_profiles |
| `utm_source`   | TEXT | UTM source          |
| `utm_medium`   | TEXT | UTM medium          |
| `utm_campaign` | TEXT | UTM campaign        |
| `referrer`     | TEXT | Referrer URL        |
| `landing_page` | TEXT | First page visited  |

---

### `audit_log` — System Audit Trail

| Attribute   | Value                                      |
| ----------- | ------------------------------------------ |
| **Rows**    | 15,751                                     |
| **Columns** | 10+                                        |
| **Purpose** | Comprehensive audit trail for data changes |

**Key Fields:**

| Field        | Type      | Purpose                            |
| ------------ | --------- | ---------------------------------- |
| `action`     | TEXT      | Action type (INSERT/UPDATE/DELETE) |
| `table_name` | TEXT      | Affected table                     |
| `record_id`  | UUID      | Record ID                          |
| `changed_by` | UUID      | User who made change               |
| `old_values` | JSONB     | Previous values                    |
| `new_values` | JSONB     | New values                         |
| `changed_at` | TIMESTAMP | Change timestamp                   |

---

## 14. Financial System

### `gl_accounts` — Chart of Accounts

| Attribute   | Value                              |
| ----------- | ---------------------------------- |
| **Rows**    | 174                                |
| **Columns** | 11                                 |
| **Purpose** | General ledger account definitions |

**Key Fields:**

| Field               | Type    | Purpose                                       |
| ------------------- | ------- | --------------------------------------------- |
| `account_code`      | TEXT    | Account code (1xxx-9xxx)                      |
| `account_name`      | TEXT    | Account name                                  |
| `account_type`      | TEXT    | Type (asset/liability/equity/revenue/expense) |
| `normal_balance`    | TEXT    | Debit or credit                               |
| `is_active`         | BOOLEAN | Is currently active                           |
| `parent_account_id` | UUID    | Parent account for hierarchy                  |

**Account Code Structure:**

- 1xxx = Assets
- 2xxx = Liabilities
- 3xxx = Equity
- 4xxx = Revenue
- 5xxx = COGS
- 6xxx = Operating Expenses
- 7xxx = R&D
- 8xxx = Other Income/Expense
- 9xxx = Taxes

---

### `journal_entries` — Transaction Records

| Attribute   | Value                                      |
| ----------- | ------------------------------------------ |
| **Rows**    | 0                                          |
| **Columns** | 26                                         |
| **Purpose** | Double-entry financial transaction headers |

**Key Fields:**

| Field         | Type      | Purpose                 |
| ------------- | --------- | ----------------------- |
| `entry_date`  | DATE      | Transaction date        |
| `description` | TEXT      | Transaction description |
| `reference`   | TEXT      | Reference number        |
| `status`      | TEXT      | Entry status            |
| `posted_at`   | TIMESTAMP | When posted             |

---

### `journal_entry_lines` — Transaction Details

| Attribute   | Value                         |
| ----------- | ----------------------------- |
| **Rows**    | 0                             |
| **Columns** | 15                            |
| **Purpose** | Individual debit/credit lines |

**Key Fields:**

| Field              | Type    | Purpose               |
| ------------------ | ------- | --------------------- |
| `journal_entry_id` | UUID    | FK to journal_entries |
| `account_id`       | UUID    | FK to gl_accounts     |
| `debit`            | DECIMAL | Debit amount          |
| `credit`           | DECIMAL | Credit amount         |
| `description`      | TEXT    | Line description      |

---

### `fiscal_periods` — Accounting Periods

| Attribute   | Value                           |
| ----------- | ------------------------------- |
| **Rows**    | 36                              |
| **Columns** | 14                              |
| **Purpose** | Define fiscal years and periods |

**Key Fields:**

| Field         | Type    | Purpose          |
| ------------- | ------- | ---------------- |
| `period_name` | TEXT    | Period name      |
| `start_date`  | DATE    | Period start     |
| `end_date`    | DATE    | Period end       |
| `is_closed`   | BOOLEAN | Is period closed |
| `fiscal_year` | INTEGER | Fiscal year      |

---

### `cost_entries` — Cost Tracking

| Attribute   | Value                             |
| ----------- | --------------------------------- |
| **Rows**    | 9                                 |
| **Columns** | 20                                |
| **Purpose** | Track business costs and expenses |

**Key Fields:**

| Field         | Type    | Purpose          |
| ------------- | ------- | ---------------- |
| `category`    | TEXT    | Cost category    |
| `description` | TEXT    | Cost description |
| `amount`      | DECIMAL | Amount           |
| `date`        | DATE    | Transaction date |
| `vendor`      | TEXT    | Vendor name      |

---

## 15. System & Configuration

### `app_config` — Application Configuration

| Attribute   | Value                                   |
| ----------- | --------------------------------------- |
| **Rows**    | 7                                       |
| **Columns** | 7                                       |
| **Purpose** | Runtime configuration and feature flags |

**Key Fields:**

| Field         | Type    | Purpose                |
| ------------- | ------- | ---------------------- |
| `key`         | TEXT    | Configuration key      |
| `value`       | JSONB   | Configuration value    |
| `description` | TEXT    | Description            |
| `is_public`   | BOOLEAN | Is publicly accessible |

---

### `scrape_jobs` — Data Ingestion Jobs

| Attribute   | Value                                   |
| ----------- | --------------------------------------- |
| **Rows**    | 241                                     |
| **Columns** | 20                                      |
| **Purpose** | Track scraping/enrichment job execution |

**Key Fields:**

| Field               | Type    | Purpose             |
| ------------------- | ------- | ------------------- |
| `job_type`          | TEXT    | Job type            |
| `car_slug`          | TEXT    | Target car          |
| `car_id`            | UUID    | FK to cars          |
| `status`            | TEXT    | Job status          |
| `priority`          | INTEGER | Processing priority |
| `sources_attempted` | TEXT[]  | Sources tried       |
| `sources_succeeded` | TEXT[]  | Sources that worked |
| `error_message`     | TEXT    | Error if failed     |

---

### `fitment_tag_mappings` — Fitment Normalization

| Attribute   | Value                           |
| ----------- | ------------------------------- |
| **Rows**    | 124                             |
| **Columns** | 12                              |
| **Purpose** | Map vendor fitment tags to cars |

**Key Fields:**

| Field            | Type    | Purpose              |
| ---------------- | ------- | -------------------- |
| `vendor_key`     | TEXT    | Vendor identifier    |
| `tag`            | TEXT    | Vendor's fitment tag |
| `tag_kind`       | TEXT    | Tag type             |
| `car_id`         | UUID    | FK to cars           |
| `car_variant_id` | UUID    | FK to car_variants   |
| `confidence`     | DECIMAL | Mapping confidence   |

---

## 16. Gamification

### `user_xp` — XP and Levels

| Attribute   | Value                            |
| ----------- | -------------------------------- |
| **Rows**    | 16                               |
| **Columns** | 6+                               |
| **Purpose** | Cumulative XP and level tracking |

**Key Fields:**

| Field           | Type    | Purpose             |
| --------------- | ------- | ------------------- |
| `user_id`       | UUID    | FK to user_profiles |
| `total_xp`      | INTEGER | Total XP earned     |
| `current_level` | INTEGER | Current level       |

---

### `xp_levels` — Level Definitions

| Attribute   | Value                        |
| ----------- | ---------------------------- |
| **Rows**    | 7                            |
| **Columns** | 5+                           |
| **Purpose** | Level thresholds and rewards |

**Key Fields:**

| Field         | Type    | Purpose             |
| ------------- | ------- | ------------------- |
| `level`       | INTEGER | Level number        |
| `xp_required` | INTEGER | XP needed for level |
| `title`       | TEXT    | Level title         |
| `rewards`     | JSONB   | Level rewards       |

---

### `xp_actions` — XP Values

| Attribute   | Value                               |
| ----------- | ----------------------------------- |
| **Rows**    | 16                                  |
| **Columns** | 5+                                  |
| **Purpose** | XP values for each trackable action |

**Key Fields:**

| Field         | Type    | Purpose            |
| ------------- | ------- | ------------------ |
| `action_key`  | TEXT    | Action identifier  |
| `xp_value`    | INTEGER | XP awarded         |
| `description` | TEXT    | Action description |
| `daily_limit` | INTEGER | Max times per day  |

---

### `user_streaks` — Engagement Streaks

| Attribute   | Value                            |
| ----------- | -------------------------------- |
| **Rows**    | 0                                |
| **Columns** | 6+                               |
| **Purpose** | Consecutive week streak tracking |

**Key Fields:**

| Field                | Type    | Purpose             |
| -------------------- | ------- | ------------------- |
| `user_id`            | UUID    | FK to user_profiles |
| `current_streak`     | INTEGER | Current week streak |
| `longest_streak`     | INTEGER | All-time longest    |
| `last_activity_week` | DATE    | Last active week    |

---

### `user_achievements` — Best Records

| Attribute   | Value                                          |
| ----------- | ---------------------------------------------- |
| **Rows**    | 3                                              |
| **Columns** | 10+                                            |
| **Purpose** | Best achievement records (HP, lap times, etc.) |

**Key Fields:**

| Field              | Type      | Purpose             |
| ------------------ | --------- | ------------------- |
| `user_id`          | UUID      | FK to user_profiles |
| `achievement_type` | TEXT      | Achievement type    |
| `value`            | DECIMAL   | Achievement value   |
| `achieved_at`      | TIMESTAMP | When achieved       |

---

## 17. Subscription & Billing

### `plans` — Subscription Plans

| Attribute   | Value                     |
| ----------- | ------------------------- |
| **Rows**    | 3                         |
| **Columns** | 10+                       |
| **Purpose** | Define subscription tiers |

**Key Fields:**

| Field           | Type    | Purpose               |
| --------------- | ------- | --------------------- |
| `name`          | TEXT    | Plan name             |
| `tier`          | TEXT    | Tier level            |
| `price_monthly` | INTEGER | Monthly price (cents) |
| `price_annual`  | INTEGER | Annual price (cents)  |
| `features`      | JSONB   | Plan features         |

---

### `plan_entitlements` — Feature Access

| Attribute   | Value                                    |
| ----------- | ---------------------------------------- |
| **Rows**    | 79                                       |
| **Columns** | 6+                                       |
| **Purpose** | Define which features each plan includes |

**Key Fields:**

| Field         | Type    | Purpose              |
| ------------- | ------- | -------------------- |
| `plan_id`     | UUID    | FK to plans          |
| `feature_key` | TEXT    | Feature identifier   |
| `enabled`     | BOOLEAN | Is feature enabled   |
| `limit`       | INTEGER | Usage limit (if any) |

---

### `subscriptions` — User Subscriptions

| Attribute   | Value                          |
| ----------- | ------------------------------ |
| **Rows**    | 0                              |
| **Columns** | 15+                            |
| **Purpose** | Track user subscription status |

**Key Fields:**

| Field                    | Type      | Purpose                |
| ------------------------ | --------- | ---------------------- |
| `user_id`                | UUID      | FK to user_profiles    |
| `plan_id`                | UUID      | FK to plans            |
| `stripe_subscription_id` | TEXT      | Stripe subscription ID |
| `status`                 | TEXT      | Subscription status    |
| `current_period_start`   | TIMESTAMP | Period start           |
| `current_period_end`     | TIMESTAMP | Period end             |
| `cancel_at_period_end`   | BOOLEAN   | Will cancel            |

---

## Appendix A: Views

| View Name                      | Purpose                                          |
| ------------------------------ | ------------------------------------------------ |
| `car_detail_enriched`          | Pre-joined view combining cars with related data |
| `al_user_balance`              | Calculated user AL credit balance                |
| `error_statistics`             | Aggregated error statistics                      |
| `event_series_next_occurrence` | Next occurrence for recurring events             |
| `city_coverage_report`         | Event coverage by city                           |
| `gl_account_summary`           | Account summary with balances                    |
| `v_gl_account_balances`        | Current GL account balances                      |
| `v_trial_balance`              | Trial balance report                             |
| `v_income_statement_monthly`   | Monthly P&L                                      |
| `v_balance_sheet_current`      | Current balance sheet                            |
| `v_cash_flow_statement`        | Cash flow statement                              |
| `v_pnl_summary`                | P&L summary                                      |
| `v_financial_dashboard`        | Dashboard metrics                                |

---

## Appendix B: Materialized Views

| View Name                   | Rows | Purpose                  |
| --------------------------- | ---- | ------------------------ |
| `mv_car_popularity`         | 309  | Car popularity metrics   |
| `mv_content_coverage`       | 309  | Content coverage per car |
| `mv_daily_stats`            | 12   | Daily statistics         |
| `mv_event_coverage_by_city` | 506  | Event coverage by city   |

---

## Appendix C: Key Relationships

### Cars as Central Entity

```
                    ┌─────────────────┐
                    │      cars       │
                    │   (309 rows)    │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
   car_variants        car_issues          car_dyno_runs
   (1,166 rows)       (9,092 rows)         (641 rows)
         │                   │                   │
         ▼                   ▼                   ▼
   car_fuel_economy    car_recalls       car_track_lap_times
   (240 rows)         (1,360 rows)        (1,235 rows)
```

### User Data Relationships

```
┌─────────────────┐
│  user_profiles  │
│   (70 rows)     │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬────────────┐
    │         │            │            │
    ▼         ▼            ▼            ▼
user_      user_       user_        al_
favorites  vehicles    projects     conversations
(17)       (45)        (32)         (105)
```

---

## Appendix D: Data Quality Notes

### Well Populated Tables (80%+ coverage)

- `cars` — 309/309 (100%)
- `car_tuning_profiles` — 309/309 (100%)
- `vehicle_maintenance_specs` — 310 rows
- `vehicle_service_intervals` — 6,089 records
- `car_issues` — 9,092 records
- `events` — 8,737 events
- `youtube_videos` — 2,261 videos

### Tables Needing Expansion

- `car_market_pricing` — Only 10 cars (Priority 1)
- `car_fuel_economy` — 240/309 cars
- `car_safety_data` — 190/309 cars

### Deprecated Tables

- `vehicle_known_issues` — Use `car_issues` instead

---

_Document generated from live database schema — January 27, 2026_
