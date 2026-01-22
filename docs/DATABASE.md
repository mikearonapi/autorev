# AutoRev Database Schema

> Complete reference for all **139 database tables** and **26 views**
>
> **Last Verified:** January 21, 2026 — MCP-verified live query (Row counts audited)

---

## 🏆 Why This Database is Our Secret Sauce

AutoRev's database is a **curated, structured, enthusiast-focused data asset** that doesn't exist anywhere else:

| Unique Value | What Makes It Special |
|--------------|----------------------|
| **Enthusiast Scores** | 7 subjective scores (sound, track, reliability, etc.) — not available from any API |
| **Real Dyno Data** | Actual wheel HP/TQ measurements from real cars with mods documented |
| **Citeable Lap Times** | Track times with tire, weather, and driver context |
| **AI-Ready Knowledge** | 7,448 vector-embedded chunks for semantic search |
| **YouTube Intelligence** | 2,261 videos with AI-extracted pros/cons/summaries |
| **Parts + Fitments** | 723 parts with 930 verified car-specific fitments |
| **Maintenance Specs** | 130 columns of oil, fluid, tire specs per car |
| **Recall Data** | 1,365 NHTSA recall campaigns linked to cars |
| **Community Insights** | 1,252 forum-extracted insights |
| **Events** | 8,615 car events |
| **Tuning Profiles** | 323 car-specific tuning configurations |

---

## Data Coverage Dashboard

| Data Type | Coverage | Cars/Records | Gap Priority |
|-----------|----------|--------------|--------------|
| **Core Specs** | ✅ 100% | 309/309 | — |
| **Fuel Economy** | ✅ ~78% | 241/310 | P2 |
| **Safety Ratings** | ✅ ~62% | 191/310 | P2 |
| **Maintenance Specs** | ✅ 100% | 305/309 | — |
| **Service Intervals** | ✅ 100% | 3,093 records | — |
| **Known Issues** | ✅ 100% | 9,104 records | — |
| **Recall Data** | ~50% | 1,365 records | P2 |
| **Market Pricing** | ⚠️ 3% | 10/309 cars | P1 - Critical |
| **Part Fitments** | ⚠️ ~15% | 930 fitments | P1 - Critical |
| **Dyno Runs** | ⚠️ ~10% | 29 runs | P2 |
| **Lap Times** | ⚠️ ~20% | 65 records | P2 |
| **Community Insights** | ⚠️ ~15% cars | 1,252 insights | P1 |
| **Events** | ✅ Strong | 8,615 events | — |
| **YouTube Reviews** | ~80% | 2,261 videos | P3 |
| **Tuning Profiles** | ✅ 100% | 323 profiles | — |

---

## Overview

| Category | Tables | Views | Populated | Empty |
|----------|--------|-------|-----------|-------|
| Core Car Data | 18 | 1 | 15 | 3 |
| Parts & Upgrades | 8 | 0 | 7 | 1 |
| User Data | 15 | 0 | 11 | 4 |
| Email & Referrals | 7 | 0 | 5 | 2 |
| Maintenance | 4 | 0 | 4 | 0 |
| AL (AI) | 6 | 1 | 5 | 1 |
| Knowledge Base | 2 | 0 | 2 | 0 |
| YouTube | 4 | 0 | 4 | 0 |
| Track Data | 2 | 0 | 1 | 1 |
| Forum Intelligence | 5 | 0 | 5 | 0 |
| Events | 7 | 1 | 5 | 2 |
| Event Coverage | 1 | 1 | 1 | 0 |
| Featured Content | 2 | 0 | 2 | 0 |
| Image Library | 2 | 0 | 0 | 2 |
| Community & Social | 6 | 0 | 4 | 2 |
| Analytics & Tracking | 15 | 1 | 7 | 8 |
| Financial System | 12 | 8 | 5 | 7 |
| System & Config | 5 | 4 | 4 | 1 |
| **Total** | **139** | **26** | **~105** | **~34** |

> **Note:** `upgrade_education` data is in static file `data/upgradeEducation.js`, not a database table.

---

## Core Car Data (18 tables, 1 view)

### `cars` — Main vehicle database
| Status | **310 rows** |
|--------|------------|
| **Purpose** | Primary car database with all specs and scores |
| **Columns** | 140 columns |
| **Key Fields** | `id`, `slug`, `name`, `years`, `brand`, `tier`, `category`, `vehicle_type`, `engine`, `hp`, `torque`, `trans`, `drivetrain`, `curb_weight`, `zero_to_sixty`, `price_avg`, `price_range` |
| **Score Fields** | `score_sound`, `score_interior`, `score_track`, `score_reliability`, `score_value`, `score_driver_fun`, `score_aftermarket` |
| **Used By** | Every car-related page and API |

#### Vehicle Type Categories
| Type | Count | Description |
|------|-------|-------------|
| Sports Car | ~110 | 2-door performance vehicles (911, Corvette, Supra, MX-5, etc.) |
| Sports Sedan | ~90 | 4-door performance sedans (M3, Evo, WRX STI, Stinger, etc.) |
| Supercar | ~30 | Exotic supercars (Ferrari, Lamborghini, McLaren, etc.) |
| Hot Hatch | ~25 | Performance hatchbacks (GTI, Golf R, Civic Type R, etc.) |
| Muscle Car | ~25 | American muscle (Mustang, Camaro, Challenger, etc.) |
| Truck | ~18 | Pickup trucks (F-150, Silverado, Tacoma, etc.) |
| SUV | ~10 | Sport utility vehicles (Wrangler, Bronco, 4Runner, etc.) |
| Wagon | ~1 | Performance wagons (RS6 Avant) |

> **Note:** `category` = engine placement (Front/Mid/Rear/Electric), `vehicle_type` = body style classification

### `car_variants` — Year/trim variants
| Status | **1,169 rows** |
|--------|-------------|
| **Purpose** | Specific year/trim combinations for VIN matching |
| **Columns** | 14 |
| **Key Fields** | `id`, `car_id`, `variant_key`, `display_name`, `model_year_start`, `model_year_end`, `trim`, `drivetrain`, `transmission`, `engine` |
| **Used By** | VIN decode, variant-specific maintenance |

### `car_fuel_economy` — EPA fuel data
| Status | **241 rows** ✅ |
|--------|--------------|
| **Purpose** | EPA efficiency data |
| **Columns** | 22 |
| **Key Fields** | `car_slug`, `city_mpg`, `highway_mpg`, `combined_mpg`, `fuel_type`, `annual_fuel_cost`, `co2_emissions`, `ghg_score`, `is_electric`, `is_hybrid`, `ev_range` |
| **Used By** | Car detail Ownership tab, AL |

### `car_safety_data` — NHTSA/IIHS ratings
| Status | **191 rows** ✅ |
|--------|--------------|
| **Purpose** | Safety ratings from NHTSA and IIHS |
| **Columns** | 29 |
| **Key Fields** | `car_slug`, `nhtsa_overall_rating`, `nhtsa_front_crash_rating`, `nhtsa_side_crash_rating`, `nhtsa_rollover_rating`, `recall_count`, `complaint_count`, `iihs_overall`, `iihs_top_safety_pick`, `safety_score`, `safety_grade` |
| **Used By** | Car detail Buying tab, AL |

### `car_issues` — Known problems
| Status | **9,104 rows** ✅ |
|--------|------------------|
| **Purpose** | Documented known issues and common problems |
| **Columns** | 23 |
| **Key Fields** | `car_slug`, `title`, `kind`, `severity`, `affected_years_text`, `description`, `symptoms`, `prevention`, `fix_description`, `estimated_cost_text`, `source_url` |
| **Used By** | Car detail, AL `get_known_issues` tool |

### `car_market_pricing` — Current market values
| Status | **10 rows** ⚠️ |
|--------|----------------|
| **Purpose** | Aggregated market values from BaT, Cars.com, Hagerty |
| **Columns** | 30 |
| **Key Fields** | `car_slug`, `bat_avg_price`, `bat_median_price`, `carscom_avg_price`, `hagerty_concours`, `hagerty_excellent`, `hagerty_good`, `hagerty_fair`, `consensus_price`, `market_trend` |
| **Used By** | My Garage Value tab, AL |
| **Gap Note** | Only 10/309 cars have pricing data. P1 priority for expansion. |

### `car_market_pricing_years` — Price by model year
| Status | **23 rows** ⚠️ |
|--------|---------------|
| **Purpose** | Market pricing broken down by model year |
| **Columns** | 16 |
| **Key Fields** | `car_slug`, `source`, `year`, `median_price`, `average_price`, `min_price`, `max_price`, `listing_count` |
| **Used By** | Car detail Buying tab |

### `car_price_history` — Historical trends
| Status | **7 rows** |
|--------|-----------|
| **Purpose** | Price tracking over time |
| **Columns** | 7 |
| **Key Fields** | `car_slug`, `source`, `price`, `recorded_at` |
| **Used By** | My Garage Value tab (Enthusiast tier) |

### `car_dyno_runs` — Real dyno data
| Status | **29 rows** |
|--------|------------|
| **Purpose** | Actual dyno measurements from real cars |
| **Columns** | 30 |
| **Key Fields** | `car_slug`, `run_kind` (baseline/modded), `dyno_type`, `peak_whp`, `peak_wtq`, `peak_hp`, `peak_tq`, `boost_psi_max`, `fuel`, `modifications`, `source_url`, `verified` |
| **Used By** | Tuning Shop (Tuner tier), AL `get_dyno_runs` tool |

### `car_track_lap_times` — Track benchmarks
| Status | **65 rows** |
|--------|------------|
| **Purpose** | Real lap times from actual track sessions |
| **Columns** | 24 |
| **Key Fields** | `car_slug`, `track_id`, `lap_time_ms`, `lap_time_text`, `session_date`, `is_stock`, `tires`, `conditions`, `modifications`, `source_url`, `verified` |
| **Used By** | Tuning Shop (Tuner tier), AL `get_track_lap_times` tool |

### `car_expert_reviews` — Expert review metadata
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Structured expert review data (separate from YouTube) |
| **Columns** | 25 |
| **Future Use** | Written reviews, magazine content |

### `car_manual_data` — Manual spec data
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Manually entered specifications |
| **Columns** | 14 |
| **Future Use** | Override/supplement automated data |

### `car_recalls` — Recall information
| Status | **1,365 rows** ✅ |
|--------|----------------|
| **Purpose** | NHTSA recall campaign data per car |
| **Columns** | 16 |
| **Key Fields** | `car_slug`, `car_id`, `campaign_number`, `recall_campaign_number`, `recall_date`, `component`, `summary`, `consequence`, `remedy`, `manufacturer`, `source_url`, `is_incomplete` |
| **Used By** | Car detail pages, AL `get_known_issues` tool |

### `car_auction_results` — Auction sale data
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Individual auction results (BaT, etc.) |
| **Columns** | 23 |
| **Future Use** | Detailed market analysis, price justification |

### `car_slug_aliases` — Slug redirects
| Status | **35 rows** |
|--------|------------|
| **Purpose** | Map alternate slugs to canonical car slugs |
| **Columns** | 5 |
| **Key Fields** | `alias`, `canonical_slug`, `car_id` |
| **Car Linkage** | `car_id UUID` auto-populated from `canonical_slug` via trigger |
| **Used By** | URL redirects, search normalization |

### `car_tuning_profiles` — Tuning configurations
| Status | **323 rows** ✅ |
|--------|-----------------|
| **Purpose** | Car-specific tuning data, upgrade paths, and performance potential |
| **Columns** | 25 |
| **Key Fields** | `car_id`, `car_slug`, `upgrades_by_objective` (JSONB), `performance_potential` (JSONB), `platform_strengths`, `platform_weaknesses`, `tuning_community_notes` |
| **Used By** | Tuning Shop, AL tuning recommendations |

### `car_pipeline_runs` — Car addition pipeline tracking
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Track progress through the 8-phase car addition pipeline |
| **Columns** | 50 |
| **Key Fields** | `id`, `car_slug`, `car_name`, `status`, `phase1_*` through `phase8_*` fields |
| **RLS** | Admin-only access |
| **Used By** | `/internal/car-pipeline` admin dashboard |
| **Documentation** | See [CAR_PIPELINE.md](CAR_PIPELINE.md) |

### `car_detail_enriched` — Enriched car view (VIEW)
| Status | VIEW |
|--------|------|
| **Purpose** | Pre-joined view combining cars with related data |
| **Columns** | 165 |
| **Used By** | Car detail pages for efficient single-query loading |

---

## Parts & Upgrades (8 tables)

### `parts` — Parts catalog
| Status | **723 rows** ✅ |
|--------|----------------|
| **Purpose** | Aftermarket and OEM+ parts database |
| **Columns** | 16 |
| **Key Fields** | `id`, `name`, `brand_name`, `part_number`, `category`, `description`, `quality_tier`, `street_legal`, `is_active`, `source_urls` |
| **Categories** | intake, exhaust, tune, suspension, brakes, cooling, etc. |
| **Used By** | Tuning Shop, AL `search_parts` tool |

### `part_fitments` — Car-to-part mapping
| Status | **930 rows** ✅ |
|--------|----------------|
| **Purpose** | Which parts fit which cars |
| **Columns** | 16 |
| **Key Fields** | `part_id`, `car_id`, `car_variant_id`, `fitment_notes`, `requires_tune`, `install_difficulty`, `estimated_labor_hours`, `verified`, `confidence`, `source_url` |
| **Used By** | Parts search with car filter |

### `part_pricing_snapshots` — Price tracking
| Status | **971 rows** |
|--------|-------------|
| **Purpose** | Historical price data from vendors |
| **Columns** | 10 |
| **Key Fields** | `part_id`, `vendor_name`, `vendor_url`, `product_url`, `currency`, `price_cents`, `in_stock`, `recorded_at` |
| **Used By** | AL parts recommendations, build cost estimates |

### `part_relationships` — Compatibility
| Status | **38 rows** |
|--------|------------|
| **Purpose** | Which parts work well together |
| **Columns** | 7 |
| **Key Fields** | `part_id`, `related_part_id`, `relation_type`, `reason` |
| **Relation Types** | requires, suggests, conflicts |
| **Used By** | Build planning, compatibility checks |

### `part_brands` — Brand metadata
| Status | **3 rows** |
|--------|----------|
| **Purpose** | Brand information |
| **Columns** | 7 |
| **Key Fields** | `name`, `website`, `country`, `notes` |

### `upgrade_keys` — Upgrade reference
| Status | **49 rows** |
|--------|------------|
| **Purpose** | Canonical upgrade definitions |
| **Columns** | 9 |
| **Key Fields** | `key`, `name`, `category`, `description`, `typical_cost_low`, `typical_cost_high` |
| **Used By** | Encyclopedia, AL upgrade info |

### `upgrade_packages` — Curated bundles
| Status | **42 rows** |
|--------|------------|
| **Purpose** | Pre-built upgrade packages (Street Sport, Track Pack, Time Attack) |
| **Columns** | 30 |
| **Key Fields** | `name`, `tier`, `category`, `estimated_cost_low`, `estimated_cost_high`, delta fields for performance |
| **Used By** | Tuning Shop package selection |

### `upgrade_key_parts` — Package contents
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Link upgrade_keys to specific parts |
| **Columns** | 6 |
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

## User Data (15 tables)

### `user_profiles` — User settings
| Status | **62 rows** |
|--------|----------|
| **Purpose** | User preferences, subscription tier, Stripe billing, and onboarding data |
| **Columns** | 44 |
| **Key Fields** | `id` (auth.users FK), `display_name`, `avatar_url`, `subscription_tier`, `preferred_units`, `email_notifications` |
| **Stripe Fields** | `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status`, `subscription_started_at`, `subscription_ends_at`, `al_credits_purchased` |
| **Onboarding Fields** | `referral_source`, `referral_source_other`, `user_intent`, `onboarding_completed_at`, `onboarding_step`, `email_opt_in_features`, `email_opt_in_events` |
| **Email Fields** | `last_email_sent_at`, `email_bounce_count`, `email_unsubscribed_at`, `referral_code` |
| **Location Fields** | `location_zip`, `location_city`, `location_state`, `location_updated_at` |
| **Used By** | Auth, tier gating, Stripe billing, onboarding flow, email system, AL garage analysis |

### `user_favorites` — Saved cars
| Status | **19 rows** |
|--------|----------|
| **Purpose** | Cars saved to garage favorites |
| **Columns** | 10 |
| **Key Fields** | `user_id`, `car_slug`, `car_id`, `car_name`, `notes`, `created_at` |
| **Used By** | My Garage favorites |

### `user_projects` — Build projects
| Status | **13 rows** |
|--------|----------|
| **Purpose** | User's saved build projects |
| **Columns** | 15 |
| **Key Fields** | `user_id`, `car_slug`, `car_id`, `project_name`, `selected_upgrades`, `total_hp_gain`, `total_cost_low`, `total_cost_high` |
| **Used By** | Tuning Shop builds (Tuner tier) |

### `user_feedback` — User feedback
| Status | **43 rows** |
|--------|-----------|
| **Purpose** | Beta and user feedback submitted through FeedbackWidget, plus automatic error logging |
| **Columns** | 47 |
| **Key Fields** | `user_id`, `page_url`, `feedback_type`, `message`, `email`, `category`, `severity`, `rating`, `user_tier`, `feature_context`, `status`, `error_metadata`, `issue_addressed` |
| **Auto-Error Support** | `category = 'auto-error'` with `error_metadata` JSONB for client-side error capture |
| **Issue Tracking** | `issue_addressed` (boolean): `true` = addressed, `false` = needs attention, `NULL` = not evaluated |
| **Used By** | FeedbackWidget, FeedbackCorner, internal admin page, ErrorBoundary |

### `user_vehicles` — Owned vehicles
| Status | **34 rows** |
|--------|----------|
| **Purpose** | User's owned vehicles with VIN and installed modifications |
| **Columns** | 51 |
| **Key Fields** | `user_id`, `matched_car_slug`, `matched_car_id`, `matched_car_variant_id`, `vin`, `year`, `make`, `model`, `trim`, `nickname`, `mileage`, `purchase_date`, `purchase_price` |
| **Modification Fields** | `installed_modifications` (JSONB array of upgrade keys), `active_build_id` (FK to user_projects), `total_hp_gain`, `modified_at` |
| **Mileage Tracking** | `current_mileage` (integer), `mileage_updated_at` (timestamptz), `usage_type` (enum: `daily`/`weekend`/`track`/`stored`, default `daily`) |
| **Service Tracking** | `last_oil_change_miles` (integer), `last_oil_change_date` (date), `last_brake_fluid_date` (date) |
| **Car Concierge Tracking** | `last_started_at`, `battery_status`, `battery_installed_date`, `storage_mode`, `tire_installed_date`, `tire_brand_model`, `tire_tread_32nds`, `registration_due_date`, `inspection_due_date`, `last_inspection_date`, `next_oil_due_mileage`, `owner_notes`, `health_last_analyzed_at` |
| **Used By** | Enthusiast tier ownership features, My Garage, Tuning Shop "Apply to Vehicle", AL garage analysis |

### `user_service_logs` — Service records
| Status | **1 row** |
|--------|---------------|
| **Purpose** | Maintenance history for owned vehicles |
| **Columns** | 22 |
| **Key Fields** | `user_vehicle_id`, `service_type`, `service_date`, `odometer_reading`, `performed_by`, `shop_name`, `parts_cost`, `labor_cost`, `total_cost` |
| **Used By** | Enthusiast tier service tracking |

### `user_project_parts` — Build part selections
| Status | **8 rows** |
|--------|---------------|
| **Purpose** | Parts added to build projects |
| **Columns** | 23 |
| **Key Fields** | `project_id`, `part_id`, `quantity`, `part_name`, `brand_name`, `price_cents` |
| **Used By** | Tuner tier build details |

### `user_compare_lists` — Compare sessions
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Saved comparison lists |
| **Columns** | 8 |
| **Key Fields** | `id`, `user_id`, `name`, `car_slugs` (JSONB), `car_ids` (UUID[]), `car_names` |
| **Car Linkage** | `car_ids UUID[]` array resolved from `car_slugs JSONB` for multi-car references |
| **Future Use** | Enthusiast tier compare feature |

### `user_activity` — Activity tracking
| Status | **226 rows** |
|--------|---------------|
| **Purpose** | User engagement analytics |
| **Columns** | 8 |
| **Used By** | Usage insights, retention analysis |

### `user_uploaded_images` — User image uploads
| Status | **8 rows** |
|--------|----------|
| **Purpose** | Images uploaded by users for builds, vehicles, etc. |
| **Columns** | 29 |
| **Key Fields** | `user_id`, `blob_url`, `blob_path`, `file_name`, `file_size`, `mime_type`, `image_type`, `entity_type`, `entity_id` |
| **Used By** | Build photos, vehicle photos, community posts |

### `user_events` — User event tracking
| Status | **798 rows** |
|--------|-------------|
| **Purpose** | Detailed user interaction events |
| **Columns** | 17 |
| **Key Fields** | `user_id`, `event_type`, `event_data`, `session_id`, `page_url` |
| **Used By** | Analytics, user journey tracking |

### `user_sessions` — Session tracking
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | User session management |
| **Columns** | 20 |
| **Future Use** | Session analytics, concurrent session limits |

### `user_lifecycle` — User lifecycle stages
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Track user journey through lifecycle stages |
| **Columns** | 22 |
| **Future Use** | Onboarding funnel, retention campaigns |

### `user_attribution` — Marketing attribution
| Status | **34 rows** |
|--------|------------|
| **Purpose** | Track how users discovered AutoRev |
| **Columns** | 19 |
| **Key Fields** | `user_id`, `utm_source`, `utm_medium`, `utm_campaign`, `referrer`, `landing_page` |
| **Used By** | Marketing analytics |

---

## Email & Referrals (7 tables)

### `email_templates` — Email template storage
| Status | **9 rows** |
|--------|-----------|
| **Purpose** | Admin-managed email template content |
| **Columns** | 15 |
| **Key Fields** | `slug` (unique), `name`, `subject`, `preview_text`, `html_content`, `category`, `requires_opt_in`, `is_active`, `available_variables` |
| **Categories** | transactional, feature, event, engagement, referral |
| **Used By** | Email service, Admin dashboard |

### `email_logs` — Email delivery log
| Status | **52 rows** |
|--------|-------------|
| **Purpose** | Track all sent emails for debugging, analytics, compliance |
| **Columns** | 15 |
| **Key Fields** | `user_id`, `recipient_email`, `template_slug`, `subject`, `resend_id`, `status`, `error_message`, `sent_at`, `delivered_at`, `opened_at`, `clicked_at` |
| **Statuses** | queued, sent, delivered, bounced, complained, failed, skipped, unsubscribed |
| **Used By** | Email service, Admin email dashboard, Webhook handler |

### `email_queue` — Scheduled email queue
| Status | **0 rows** ⬜ |
|--------|-------------|
| **Purpose** | Queue for scheduled and batched email sending |
| **Columns** | 16 |
| **Key Fields** | `user_id`, `recipient_email`, `template_slug`, `template_variables`, `scheduled_for`, `priority`, `status`, `attempts`, `max_attempts` |
| **Statuses** | pending, processing, sent, cancelled, failed |
| **Used By** | Cron job `/api/cron/process-email-queue` (every 5 mins) |

### `referrals` — Referral program tracking
| Status | **0 rows** ⬜ |
|--------|-------------|
| **Purpose** | Track who referred whom and award credits |
| **Columns** | 12 |
| **Key Fields** | `referrer_id`, `referee_id`, `referee_email`, `referral_code`, `status`, `referrer_reward_credits`, `referee_reward_credits`, `rewarded_at`, `expires_at` |
| **Statuses** | pending, signed_up, rewarded, expired |
| **Reward** | 100 AL credits per referrer + 100 bonus credits for referee |
| **Used By** | Referral API, Auth callback (for credit awards) |

### `referral_rewards` — Referral reward history
| Status | **0 rows** ⬜ |
|--------|-------------|
| **Purpose** | Track all rewards earned through referral program |
| **Columns** | 11 |
| **Key Fields** | `user_id`, `reward_type`, `credits_awarded`, `tier_granted`, `tier_duration_months`, `tier_expires_at`, `referral_id`, `milestone_key` |
| **Reward Types** | per_signup_credits, referee_bonus_credits, milestone_credits, milestone_tier_grant |
| **Used By** | Referral service, Profile page |

### `referral_milestones` — Milestone configuration
| Status | **4 rows** |
|--------|------------|
| **Purpose** | Define tiered reward milestones for referrers |
| **Columns** | 9 |
| **Milestones** | 3 friends → +100 credits, 5 friends → +200 credits, 10 friends → 1 month Collector tier, 25 friends → 1 month Tuner tier |
| **Used By** | Referral service, ReferralPanel component |

### `referral_config` — Referral system configuration
| Status | **2 rows** |
|--------|------------|
| **Purpose** | Store configurable reward amounts |
| **Columns** | 3 |
| **Key Fields** | `per_signup_credits_referrer` (100), `signup_bonus_credits_referee` (100) |
| **Used By** | Referral service, process_referral_signup RPC |

---

## Maintenance (4 tables)

### `vehicle_maintenance_specs` — Fluid/capacity specs
| Status | **310 rows** ✅ |
|--------|--------------|
| **Purpose** | Oil, coolant, brake fluid, tire specs per car |
| **Columns** | 130 columns (comprehensive!) |
| **Key Fields** | `car_slug`, `oil_type`, `oil_viscosity`, `oil_capacity_liters`, `oil_change_interval_miles`, `coolant_type`, `brake_fluid_type`, `tire_size_front`, `tire_size_rear`, `tire_pressure_front_psi`, `wheel_bolt_pattern`, `wheel_center_bore_mm`, `wheel_size_front`, `wheel_size_rear` |
| **Used By** | Owner's Reference, AL `get_maintenance_schedule` tool |

### `wheel_tire_fitment_options` — Compatible wheel/tire sizes
| Status | **105 rows** ✅ |
|--------|----------------|
| **Purpose** | Store OEM and upgrade wheel/tire combinations per car that fit without rubbing |
| **Columns** | 43 |
| **Key Fields** | `car_slug`, `fitment_type` (oem/oem_optional/plus_one/plus_two/aggressive/square), `wheel_diameter_inches`, `wheel_width_front`, `wheel_width_rear`, `wheel_offset_front_mm`, `tire_size_front`, `tire_size_rear`, `requires_fender_roll`, `requires_camber_adjustment`, `clearance_notes`, `recommended_for` |
| **Used By** | Owner's Reference "Tires & Wheels" section, wheel shopping |
| **Helper Function** | `get_wheel_tire_fitments(car_slug)` returns OEM specs + all fitment options as JSONB |

### `vehicle_service_intervals` — Service schedules
| Status | **6,089 rows** ✅ |
|--------|---------------|
| **Purpose** | When each service is due |
| **Columns** | 17 |
| **Key Fields** | `car_slug`, `service_name`, `service_description`, `interval_miles`, `interval_months`, `dealer_cost_low`, `dealer_cost_high`, `diy_cost_low`, `diy_cost_high`, `is_critical` |
| **Used By** | Service reminders |

### `vehicle_known_issues` — Common problems ⚠️ DEPRECATED
| Status | **89 rows** |
|--------|------------|
| **Purpose** | Structured known issues (complements `car_issues`) |
| **Columns** | 20 |
| **Key Fields** | `car_slug`, `issue_type`, `issue_title`, `issue_description`, `severity`, `fix_description`, `estimated_repair_cost_low`, `estimated_repair_cost_high` |
| **⚠️ Deprecation** | **DEPRECATED as of 2026-01-15.** Use `car_issues` as the source of truth for known issues. This table is preserved for historical reference only. See `audit/database-design-optimization-review-2026-01-11.md` for details. |

### `car_variant_maintenance_overrides` — Variant-specific specs
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Override maintenance specs for specific variants |
| **Columns** | 10 |
| **Future Use** | E.g., different oil capacity for Competition vs base |

---

## AL/AI Assistant (6 tables, 1 view)

### `al_conversations` — Chat sessions
| Status | **74 rows** |
|--------|----------|
| **Purpose** | AL conversation metadata |
| **Columns** | 15 |
| **Key Fields** | `id`, `user_id`, `title`, `summary`, `initial_car_slug`, `initial_car_id`, `message_count`, `total_credits_used`, `last_message_at` |
| **Car Linkage** | `initial_car_id` UUID auto-populated from `initial_car_slug` via trigger |

### `al_messages` — Chat messages
| Status | **355 rows** |
|--------|-----------|
| **Purpose** | Individual messages in conversations |
| **Columns** | 12 |
| **Key Fields** | `conversation_id`, `role` (user/assistant), `content`, `tool_calls`, `credits_used`, `response_tokens`, `sequence_number` |

### `al_user_credits` — Credit balances
| Status | **62 rows** |
|--------|----------|
| **Purpose** | User's AL usage balance in cents |
| **Columns** | 16 |
| **Key Fields** | `user_id`, `subscription_tier`, `balance_cents`, `purchased_cents`, `spent_cents_this_month`, `input_tokens_this_month`, `output_tokens_this_month`, `is_unlimited` |

### `al_usage_logs` — Usage tracking
| Status | **115 rows** |
|--------|----------|
| **Purpose** | Detailed AL usage logging |
| **Columns** | 18 |
| **Key Fields** | `user_id`, `credits_used`, `tool_calls`, `input_tokens`, `output_tokens`, `cost_cents`, `model` |

### `al_credit_purchases` — Purchase history
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Credit/top-up purchase records |
| **Columns** | 8 |
| **Future Use** | Payment integration |

### `al_articles` — AI-generated articles
| Status | **43 rows** |
|--------|----------|
| **Purpose** | AI-generated car-specific articles and content |
| **Columns** | 33 |
| **Key Fields** | `car_slugs`, `car_ids`, `article_type`, `title`, `content`, `summary`, `status`, `published_at` |
| **Car Linkage** | `car_ids UUID[]` array resolved from `car_slugs TEXT[]` for multi-car references |
| **Used By** | Car detail pages, SEO content |

### `al_user_balance` — User balance calculation (VIEW)
| Status | VIEW |
|--------|------|
| **Purpose** | Calculated view of user's remaining AL credits |
| **Columns** | 11 |
| **Used By** | AL credit checks, UI balance display |

---

## Knowledge Base (2 tables)

### `source_documents` — Document sources
| Status | **764 rows** |
|--------|-------------|
| **Purpose** | Ingested documents (guides, transcripts) |
| **Columns** | 12 |
| **Key Fields** | `id`, `source_type`, `source_url`, `source_title`, `license`, `raw_text`, `metadata` |

### `document_chunks` — Vector embeddings
| Status | **7,448 rows** ✅ |
|--------|---------------|
| **Purpose** | Chunked content with embeddings for semantic search |
| **Columns** | 13 |
| **Key Fields** | `document_id` (FK→source_documents), `car_id`, `car_slug`, `chunk_index`, `chunk_text`, `chunk_tokens`, `topic`, `embedding_model`, `embedding` (vector) |
| **Used By** | AL `search_knowledge` tool |
| **Note** | Column is `document_id` (not `source_document_id`) |

---

## YouTube (4 tables)

### `youtube_videos` — Video metadata
| Status | **2,261 rows** ✅ |
|--------|----------------|
| **Purpose** | YouTube video details and AI summaries |
| **Columns** | 42 |
| **Key Fields** | `video_id`, `url`, `title`, `channel_id`, `channel_name`, `duration_seconds`, `view_count`, `summary`, `one_line_take`, `key_points`, `pros_mentioned`, `cons_mentioned`, `notable_quotes`, `quality_score` |

### `youtube_video_car_links` — Video-to-car mapping
| Status | **2,306 rows** |
|--------|-------------|
| **Purpose** | Which videos are about which cars |
| **Columns** | 25 |
| **Key Fields** | `video_id`, `car_slug`, `car_id`, `role`, sentiment fields, `match_confidence` |
| **Used By** | Expert Reviews tab |

### `youtube_channels` — Channel metadata
| Status | **24 rows** |
|--------|------------|
| **Purpose** | Trusted YouTube channels |
| **Columns** | 17 |
| **Key Fields** | `channel_id`, `channel_name`, `channel_handle`, `credibility_tier`, `content_focus`, `primary_brands`, `auto_ingest` |
| **Channels** | Throttle House, Savagegeese, Doug DeMuro, etc. |

### `youtube_ingestion_queue` — Processing queue
| Status | **2,332 rows** |
|--------|----------|
| **Purpose** | Videos pending AI processing |
| **Columns** | 17 |
| **Key Fields** | `video_id`, `video_url`, `channel_id`, `discovered_via`, `target_car_slug`, `status`, `priority`, `attempts` |

---

## Track Data (2 tables)

### `track_venues` — Track information
| Status | **21 rows** |
|--------|------------|
| **Purpose** | Track/circuit metadata |
| **Columns** | 12 |
| **Key Fields** | `slug`, `name`, `country`, `region`, `city`, `length_km`, `surface`, `website` |

### `track_layouts` — Layout variants
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Different configurations per track |
| **Columns** | 10 |
| **Key Fields** | `track_id`, `layout_key`, `name`, `length_km`, `turns`, `direction` |
| **Future Use** | Multiple layouts per venue |

---

## Forum Intelligence (5 tables)

> Forum scraping and community insight extraction system — **NOW ACTIVE**

### `forum_sources` — Forum registry
| Status | **14 rows** ✅ |
|--------|---------------|
| **Purpose** | Registry of forums to scrape with configuration |
| **Columns** | 15 |
| **Key Fields** | `slug`, `name`, `base_url`, `car_brands[]`, `car_slugs[]`, `car_ids[]`, `scrape_config` (JSONB), `priority`, `is_active`, `last_scraped_at`, `total_threads_scraped`, `total_insights_extracted` |
| **Car Linkage** | `car_ids UUID[]` array resolved from `car_slugs TEXT[]` |
| **Forums** | Rennlist, Bimmerpost, Miata.net, FT86Club, CorvetteForum, VWVortex, and more |
| **Used By** | Forum scraper cron job |

### `forum_scrape_runs` — Scrape session tracking
| Status | **27 rows** |
|--------|------------|
| **Purpose** | Track each scraping session for debugging |
| **Columns** | 15 |
| **Key Fields** | `forum_source_id`, `car_slug`, `run_type`, `status`, `threads_found`, `threads_scraped`, `posts_scraped`, `insights_extracted`, `error_message` |
| **Used By** | Forum scraper, internal monitoring |

### `forum_scraped_threads` — Raw scraped content
| Status | **199 rows** |
|--------|-------------|
| **Purpose** | Raw scraped forum threads awaiting/completed AI extraction |
| **Columns** | 19 |
| **Key Fields** | `thread_url`, `thread_title`, `subforum`, `posts` (JSONB), `processing_status`, `relevance_score`, `car_slugs_detected[]`, `car_ids_detected[]`, `insights_extracted`, `quality_score` |
| **Car Linkage** | `car_ids_detected UUID[]` array resolved from `car_slugs_detected TEXT[]` |
| **Used By** | Insight extractor, internal processing |

### `community_insights` — Extracted insights (THE VALUE OUTPUT)
| Status | **1,252 rows** |
|--------|------------------|
| **Purpose** | Structured insights extracted from forum content |
| **Columns** | 24 |
| **Key Fields** | `car_slug`, `car_id`, `insight_type`, `title`, `summary`, `details` (JSONB), `confidence`, `consensus_strength`, `source_forum`, `source_urls[]`, `embedding` (vector) |
| **Insight Types** | `known_issue`, `maintenance_tip`, `modification_guide`, `troubleshooting`, `buying_guide`, `performance_data`, `reliability_report`, `cost_insight`, `comparison` |
| **Used By** | AL `search_community_insights` tool |

### `community_insight_sources` — Multi-source tracking
| Status | **1,252 rows** |
|--------|---------------|
| **Purpose** | Links insights to multiple supporting forum threads |
| **Columns** | 8 |
| **Key Fields** | `insight_id`, `thread_id`, `thread_url`, `forum_slug`, `relevance_score`, `extracted_quotes[]` |
| **Used By** | Insight consolidation, citation tracking |

---

## Events (7 tables, 1 view)

> Car events aggregator feature - Cars & Coffee, track days, shows, auctions — **NOW ACTIVE**

### `event_types` — Event taxonomy
| Status | **12 rows** ✅ |
|--------|---------------|
| **Purpose** | Categories of car events |
| **Columns** | 8 |
| **Key Fields** | `slug`, `name`, `description`, `icon` (emoji), `sort_order`, `is_track_event` |
| **Types** | cars-and-coffee, car-show, club-meetup, cruise, autocross, track-day, time-attack, industry, auction, other |
| **Used By** | Events API, event filtering |

### `events` — Core event data
| Status | **8,615 rows** ✅ |
|--------|------------------|
| **Purpose** | Car events with location, dates, and details |
| **Columns** | 37 |
| **Note** | Significantly expanded via automated event ingestion |
| **Key Fields** | `slug`, `name`, `description`, `event_type_id`, `start_date`, `end_date`, `start_time`, `end_time`, `timezone` |
| **Location Fields** | `venue_name`, `address`, `city`, `state`, `zip`, `country`, `latitude`, `longitude`, `region`, `scope` |
| **Meta Fields** | `source_url`, `source_name`, `registration_url`, `image_url`, `cost_text`, `is_free`, `status`, `featured` |
| **Used By** | Events pages, /api/events |

### `event_series` — Recurring event series
| Status | **437 rows** |
|--------|------------|
| **Purpose** | Define recurring event patterns (weekly cars & coffee, etc.) |
| **Columns** | 16 |
| **Key Fields** | `name`, `recurrence_rule`, `event_type_id`, `venue_name`, `city`, `state` |
| **Used By** | Event generation, series management |

### `event_car_affinities` — Event-car/brand links
| Status | **79 rows** |
|--------|------------|
| **Purpose** | Links events to specific cars or brands |
| **Columns** | 6 |
| **Key Fields** | `event_id`, `car_id` (nullable), `brand` (nullable), `affinity_type` (featured/welcome/exclusive) |
| **Used By** | Event filtering by car affinity, event detail pages |

### `event_saves` — User saved events
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | User-bookmarked events |
| **Columns** | 5 |
| **Key Fields** | `user_id`, `event_id`, `notes` |
| **Future Use** | Event saving feature active but no saves yet |

### `event_submissions` — User-submitted events
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | User-submitted events pending moderation |
| **Columns** | 17 |
| **Key Fields** | `user_id`, `name`, `event_type_slug`, `source_url`, `start_date`, `city`, `state`, `status`, `reviewed_by`, `rejection_reason` |
| **Future Use** | Event submission form active but no submissions yet |

### `event_sources` — Automated ingestion config
| Status | **14 rows** ✅ |
|--------|-------------|
| **Purpose** | Configuration for automated event data sources |
| **Columns** | 14 |
| **Key Fields** | `name`, `source_type`, `base_url`, `api_config`, `scrape_config`, `regions_covered[]`, `event_types[]`, `is_active`, `last_run_at`, `last_run_status`, `last_run_events` |
| **Used By** | Automated event ingestion cron |
| **Note** | Source names must normalize to match fetcher keys (e.g., "MotorsportReg" → "motorsportreg"). See `lib/eventSourceFetchers/index.js` for available fetchers. |

### `event_series_next_occurrence` — Next event calculation (VIEW)
| Status | VIEW |
|--------|------|
| **Purpose** | Calculate next occurrence for recurring event series |
| **Columns** | 20 |
| **Used By** | Event listing, calendar features |

---

## Event Coverage (1 table, 1 view)

> Internal analytics for tracking event coverage across US cities

### `target_cities` — Event Coverage Tracking
| Status | **494 rows** |
|--------|-------------|
| **Purpose** | Track event coverage for top 500 US cities |
| **Columns** | 21 |
| **Key Fields** | `id`, `city`, `state`, `population`, `population_rank`, `latitude`, `longitude`, `region`, `msa_name`, `priority_tier` |
| **Coverage Fields** | `has_cnc_coverage`, `cnc_event_count`, `total_event_count`, `track_event_count`, `show_event_count`, `autocross_event_count` |
| **Meta Fields** | `nearest_event_distance_miles`, `coverage_notes`, `last_coverage_check` |
| **Used By** | Coverage reports, event expansion planning |
| **RLS** | Public read, service role write |

### `city_coverage_report` — Coverage analytics (VIEW)
| Status | VIEW |
|--------|------|
| **Purpose** | Aggregated event coverage statistics by city |
| **Columns** | 16 |
| **Used By** | Internal reporting, expansion planning |

---

## Featured Content (2 tables)

> Curated high-quality automotive content from YouTube and other sources

### `featured_content` — Editorial and feature content
| Status | **166 rows** |
|--------|-------------|
| **Purpose** | Store curated, high-quality automotive content for editorial features, AI context enrichment, and community knowledge |
| **Columns** | 38 |
| **Key Fields** | `id`, `source_type` (youtube/vimeo/podcast/article), `source_video_id`, `source_url`, `title`, `description`, `channel_name`, `channel_id` |
| **Categorization** | `category` (brand_documentary/engineering_deep_dive/driving_experience/comparison/review/motorsport/restoration/culture/educational/interview/other), `brands_featured[]`, `topics[]` |
| **Car Linkage** | `related_car_slugs TEXT[]`, `related_car_ids UUID[]` — for content that references specific cars |
| **Component Focus** | `component_focus[]` — Array of components: tires, wheels, brakes, suspension, exhaust, intake, turbo_supercharger, engine_internals, ecu_tuning, cooling, drivetrain, aero, lighting, interior, safety, fluids, detailing, audio, general |
| **Engagement** | `view_count`, `like_count`, `published_at`, `duration_seconds`, `thumbnail_url` |
| **Transcript Fields** | `transcript_text`, `transcript_language`, `transcript_source`, `transcript_fetched_at` |
| **AI Fields** | `ai_summary`, `ai_key_points`, `ai_notable_quotes`, `ai_processed_at`, `ai_model` |
| **Curation** | `quality_score` (0-1), `is_editors_pick`, `is_featured`, `curation_notes` |
| **Status** | `status` (pending/transcript_fetched/processed/published/archived), `is_active` |
| **Used By** | Future editorial features, AI context enrichment, component guides, community knowledge base |
| **Differs From** | `youtube_videos` table stores car-specific reviews linked to cars in our database; `featured_content` stores general automotive content not necessarily car-specific |
| **Note** | Content from Hagerty, Top Gear, Throttle House, Cars with Miles, Tyre Reviews |

### `featured_content_channels` — Trusted content creators
| Status | **9 rows** |
|--------|----------|
| **Purpose** | Registry of trusted YouTube channels for component-specific content discovery |
| **Columns** | 14 |
| **Key Fields** | `channel_id`, `channel_name`, `channel_url`, `platform` |
| **Expertise** | `expertise_areas[]` (component_focus_type array), `content_types[]` |
| **Quality** | `credibility_tier` (tier1/tier2/tier3), `quality_notes` |
| **Tracking** | `videos_ingested`, `last_ingested_at`, `is_active` |
| **Channels** | Tyre Reviews, Engineering Explained, Speed Academy, Donut Media, savagegeese, Hagerty, Top Gear, Throttle House, Cars with Miles |
| **Used By** | Content discovery, curation recommendations |

---

## Image Library (2 tables)

> Image management system for car images and brand logos

### `car_images` — Car image repository
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Central repository for all car images with rich metadata |
| **Columns** | 34 |
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
| **Columns** | 17 |
| **Key Fields** | `id`, `brand_key`, `brand_name`, `logo_svg_url`, `logo_png_url`, `logo_dark_url` |
| **Branding Fields** | `primary_color`, `secondary_color`, `accent_color` |
| **Info Fields** | `founded`, `headquarters`, `country`, `wikipedia_url` |
| **Used By** | Brand display, theming |
| **RLS** | Public read, service role write |

---

## Community & Social (6 tables)

> User-generated content and social features

### `community_posts` — User posts/builds
| Status | **7 rows** |
|--------|----------|
| **Purpose** | User-submitted builds, questions, and content |
| **Columns** | 22 |
| **Key Fields** | `user_id`, `post_type`, `title`, `content`, `car_id`, `status`, `is_featured`, `like_count`, `comment_count` |
| **Used By** | Community builds page |

### `community_post_likes` — User likes on posts
| Status | **Active** ✅ |
|--------|---------------|
| **Purpose** | Track user likes on community posts (one like per user per post) |
| **Columns** | 4 |
| **Key Fields** | `id`, `post_id`, `user_id`, `created_at` |
| **Constraints** | Unique(post_id, user_id) |
| **Triggers** | Auto-updates `like_count` on `community_posts` |
| **Used By** | Community builds page like button |

### `community_post_comments` — AI-moderated comments
| Status | **Active** ✅ |
|--------|---------------|
| **Purpose** | Comments on community posts with AI moderation |
| **Columns** | 14 |
| **Key Fields** | `id`, `post_id`, `user_id`, `parent_comment_id`, `content`, `moderation_status`, `moderation_reason`, `moderation_score`, `moderated_at`, `moderated_by`, `like_count`, `created_at`, `updated_at`, `deleted_at` |
| **Moderation Statuses** | `pending`, `approved`, `rejected`, `flagged` |
| **Triggers** | Auto-updates `comment_count` on `community_posts` when status changes to/from `approved` |
| **AI Moderation** | Uses Claude Haiku to review comments before approval |
| **Used By** | Community builds page comments sheet |

### `community_post_parts` — Parts in posts
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Parts mentioned/used in community posts |
| **Columns** | 19 |
| **Key Fields** | `post_id`, `part_id`, `quantity`, `notes` |
| **Future Use** | Build part lists |

### `community_post_views` — Post view tracking
| Status | **10 rows** |
|--------|----------|
| **Purpose** | Track views on community posts |
| **Columns** | 8 |
| **Key Fields** | `post_id`, `user_id`, `viewed_at` |
| **Used By** | Post popularity metrics |

### `daily_driver_enrichments` — Daily driver content
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Daily driver tips and content |
| **Columns** | 20 |
| **Key Fields** | `year`, `make`, `model`, `trim`, `car_slug`, `car_id`, `lookup_key`, `maintenance_specs`, `service_intervals`, `known_issues` |
| **Car Linkage** | `car_id UUID` auto-populated from `car_slug` via trigger |
| **Future Use** | Daily content feature |

---

## Analytics & Tracking (15 tables, 1 view)

> User behavior, engagement, and performance analytics

### `click_events` — Click tracking
| Status | **21,985 rows** |
|--------|----------------|
| **Purpose** | Track user clicks on interactive elements |
| **Columns** | 15 |
| **Key Fields** | `user_id`, `session_id`, `element_type`, `element_id`, `page_url`, `metadata` |
| **Used By** | Analytics, UX optimization |

### `page_views` — Page view tracking
| Status | **7,790 rows** |
|--------|--------------|
| **Purpose** | Track page visits |
| **Columns** | 26 |
| **Key Fields** | `user_id`, `session_id`, `page_url`, `referrer`, `duration_ms`, `device_info` |
| **Used By** | Analytics, content performance |

### `page_engagement` — Engagement metrics
| Status | **2,976 rows** |
|--------|--------------|
| **Purpose** | Track scroll depth, time on page, interactions |
| **Columns** | 16 |
| **Key Fields** | `page_view_id`, `scroll_depth`, `time_on_page`, `interactions` |
| **Used By** | Content engagement analysis |

### `web_vitals` — Performance metrics
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Core Web Vitals (LCP, FID, CLS) |
| **Columns** | 13 |
| **Key Fields** | `page_url`, `lcp`, `fid`, `cls`, `ttfb` |
| **Future Use** | Performance monitoring |

### `analytics_goals` — Goal definitions
| Status | **8 rows** |
|--------|----------|
| **Purpose** | Define conversion goals |
| **Columns** | 11 |
| **Key Fields** | `name`, `goal_type`, `target_event`, `target_value` |
| **Used By** | Goal tracking, funnels |

### `goal_completions` — Goal achievements
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Track when users complete goals |
| **Columns** | 14 |
| **Key Fields** | `user_id`, `goal_id`, `completed_at`, `value` |

### `experiments` — A/B test definitions
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Define A/B tests and feature flags |
| **Columns** | 15 |
| **Key Fields** | `name`, `variants`, `traffic_allocation`, `status` |
| **Future Use** | A/B testing framework |

### `experiment_assignments` — Test assignments
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Track which users are in which experiments |
| **Columns** | 9 |
| **Key Fields** | `user_id`, `experiment_id`, `variant`, `assigned_at` |

### `feature_usage` — Feature adoption
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Track feature usage patterns |
| **Columns** | 12 |
| **Key Fields** | `user_id`, `feature_name`, `usage_count`, `last_used_at` |
| **Future Use** | Feature analytics |

### `search_analytics` — Search behavior
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Track search queries and results |
| **Columns** | 12 |
| **Key Fields** | `user_id`, `query`, `results_count`, `clicked_result` |
| **Future Use** | Search optimization |

### `content_metrics` — Content performance
| Status | **11 rows** |
|--------|----------|
| **Purpose** | Aggregate content performance metrics |
| **Columns** | 21 |
| **Key Fields** | `content_type`, `content_id`, `views`, `engagement_score` |
| **Used By** | Content reporting |

### `usage_metrics` — System usage
| Status | **80 rows** |
|--------|----------|
| **Purpose** | Aggregate system usage metrics |
| **Columns** | 9 |
| **Key Fields** | `metric_name`, `metric_value`, `period`, `recorded_at` |
| **Used By** | System health monitoring |

### `daily_metrics_snapshot` — Daily rollups
| Status | **4 rows** |
|--------|----------|
| **Purpose** | Daily aggregated metrics |
| **Columns** | 21 |
| **Key Fields** | `date`, `active_users`, `new_users`, `page_views`, `al_conversations` |
| **Used By** | Admin dashboard, reporting |

### `api_usage_tracking` — API call tracking
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Track API usage and rate limiting |
| **Columns** | 9 |
| **Key Fields** | `user_id`, `endpoint`, `method`, `response_time`, `status_code` |
| **Future Use** | API analytics, rate limiting |

### `application_errors` — Error tracking
| Status | **3,792 rows** |
|--------|----------------|
| **Purpose** | Centralized application error logging |
| **Columns** | 44 |
| **Key Fields** | `error_type`, `error_message`, `stack_trace`, `user_id`, `page_url`, `severity`, `is_resolved` |
| **Used By** | Error monitoring, debugging |

### `error_statistics` — Error aggregation (VIEW)
| Status | VIEW |
|--------|------|
| **Purpose** | Aggregated error statistics |
| **Columns** | 5 |
| **Used By** | Error dashboard |

---

## Financial System (12 tables, 8 views)

> Complete double-entry accounting system for business financials

### `gl_accounts` — Chart of accounts
| Status | **174 rows** |
|--------|-------------|
| **Purpose** | General ledger account definitions |
| **Columns** | 11 |
| **Key Fields** | `account_code`, `account_name`, `account_type`, `normal_balance`, `is_active`, `parent_account_id` |
| **Account Types** | asset, liability, equity, revenue, expense |
| **Used By** | All financial transactions |

### `journal_entries` — Transaction records
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Financial transaction headers |
| **Columns** | 26 |
| **Key Fields** | `entry_date`, `description`, `reference`, `status`, `posted_at` |
| **Future Use** | Transaction recording |

### `journal_entry_lines` — Transaction details
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Individual debit/credit lines |
| **Columns** | 15 |
| **Key Fields** | `journal_entry_id`, `account_id`, `debit`, `credit`, `description` |

### `fiscal_periods` — Accounting periods
| Status | **36 rows** |
|--------|------------|
| **Purpose** | Define fiscal years and periods |
| **Columns** | 14 |
| **Key Fields** | `period_name`, `start_date`, `end_date`, `is_closed`, `fiscal_year` |
| **Used By** | Period-based reporting |

### `balance_sheet_snapshots` — Balance sheet history
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Point-in-time balance sheet snapshots |
| **Columns** | 55 |
| **Future Use** | Historical financial statements |

### `cash_flow_summary` — Cash flow tracking
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Cash flow statement data |
| **Columns** | 49 |

### `bank_reconciliations` — Bank reconciliation
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Bank statement reconciliation |
| **Columns** | 23 |

### `monthly_financial_reports` — Monthly reports
| Status | **1 row** |
|--------|----------|
| **Purpose** | Generated monthly financial reports |
| **Columns** | 62 |
| **Used By** | Financial reporting |

### `monthly_financials` — Monthly summaries
| Status | **2 rows** |
|--------|----------|
| **Purpose** | Monthly financial summaries |
| **Columns** | 34 |

### `financial_audit_log` — Audit trail
| Status | **1 row** |
|--------|----------|
| **Purpose** | Audit log for financial transactions |
| **Columns** | 9 |
| **Key Fields** | `action`, `table_name`, `record_id`, `changed_by`, `changes` |

### `cost_entries` — Cost tracking
| Status | **9 rows** |
|--------|----------|
| **Purpose** | Track business costs and expenses |
| **Columns** | 20 |
| **Key Fields** | `category`, `description`, `amount`, `date`, `vendor` |
| **Used By** | Cost management |

### `revenue_transactions` — Revenue tracking
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Track revenue by stream |
| **Columns** | 13 |
| **Key Fields** | `revenue_stream`, `amount`, `date`, `customer_id` |

### `service_rates` — Service pricing
| Status | **8 rows** |
|--------|----------|
| **Purpose** | Service rate definitions |
| **Columns** | 10 |
| **Key Fields** | `service_name`, `rate`, `unit`, `description` |

### Financial Views

| View | Purpose | Columns |
|------|---------|---------|
| `gl_account_summary` | Account summary with balances | 4 |
| `v_gl_account_balances` | Current account balances | 10 |
| `v_trial_balance` | Trial balance report | 8 |
| `v_income_statement_monthly` | Monthly P&L | 8 |
| `v_balance_sheet_current` | Current balance sheet | 26 |
| `v_cash_flow_statement` | Cash flow statement | 22 |
| `v_pnl_summary` | P&L summary | 14 |
| `v_expenses_by_category` | Expense breakdown | 6 |
| `v_revenue_by_stream` | Revenue breakdown | 5 |
| `v_financial_dashboard` | Dashboard metrics | 31 |
| `v_financial_mom_trends` | Month-over-month trends | 12 |
| `v_financial_yoy_comparison` | Year-over-year comparison | 15 |
| `v_financial_cron_jobs` | Financial cron status | 6 |

---

## System & Config (5 tables, 4 views)

### `app_config` — Application configuration
| Status | **7 rows** |
|--------|----------|
| **Purpose** | Runtime configuration settings |
| **Columns** | 7 |
| **Key Fields** | `key`, `value`, `description`, `is_public` |
| **Used By** | Feature flags, system settings |

### `scrape_jobs` — Data ingestion jobs
| Status | **226 rows** |
|--------|-------------|
| **Purpose** | Track scraping/enrichment jobs |
| **Columns** | 20 |
| **Key Fields** | `id`, `job_type`, `car_slug`, `car_id`, `status`, `priority`, `sources_attempted[]`, `sources_succeeded[]`, `error_message` |

### `fitment_tag_mappings` — Fitment normalization
| Status | **124 rows** |
|--------|-------------|
| **Purpose** | Map vendor fitment tags to cars |
| **Columns** | 12 |
| **Key Fields** | `vendor_key`, `tag`, `tag_kind`, `car_id`, `car_variant_id`, `confidence` |

### `leads` — Contact submissions
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Contact form submissions |
| **Columns** | 9 |
| **Key Fields** | `email`, `name`, `source`, `car_interest_slug`, `car_interest_id`, `metadata` |

### `geocode_cache` — Geocoding cache
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Cache geocoding API results |
| **Columns** | 8 |
| **Key Fields** | `address`, `latitude`, `longitude`, `cached_at` |
| **Future Use** | Reduce geocoding API calls |

### `admin_insights_cache` — Admin dashboard cache
| Status | **0 rows** ⬜ |
|--------|---------------|
| **Purpose** | Cache expensive admin dashboard queries |
| **Columns** | 5 |

### `article_pipeline` — Content pipeline
| Status | **3 rows** |
|--------|----------|
| **Purpose** | Track article generation pipeline |
| **Columns** | 10 |

### Error Monitoring Views

| View | Purpose | Columns |
|------|---------|---------|
| `v_error_summary` | Error summary stats | 4 |
| `v_error_trends` | Error trends over time | 4 |
| `v_top_errors` | Most frequent errors | 8 |
| `v_open_application_errors` | Unresolved errors | 44 |
| `v_unresolved_errors` | Errors needing attention | 44 |
| `v_regression_errors` | Recurring errors | 44 |

---

## Known Data Gaps & Expansion Priorities

### P1 — Critical (Feature Blocking)

| Gap | Current | Target | Affected Features | Strategy |
|-----|---------|--------|-------------------|----------|
| **Market Pricing** | 10/309 cars | 309/309 | My Garage Value tab | Expand BaT/Cars.com scrapers |
| **Part Fitments** | 930 fitments (~15% coverage) | Full catalog | Parts search, Build planner | Multi-vendor ingestion pipeline |
| **Community Insights** | ~50 cars | 309/309 | AL tool, car detail | Expand forum scraping to all brands |

### P2 — Important (Feature Enhancement)

| Gap | Current | Target | Affected Features | Strategy |
|-----|---------|--------|-------------------|----------|
| **Fuel Economy** | 98/309 cars | 309/309 | Car detail | EPA API expansion |
| **Safety Ratings** | 98/309 cars | 309/309 | Car detail | NHTSA API expansion |
| **Dyno Data** | 29 runs | 200+ | Tuning Shop, AL | Community submissions, forum extraction |
| **Lap Times** | 65 records | 300+ | Performance benchmarks | Fastestlaps.com, community |
| **Recall Coverage** | 507 campaigns (~50% cars) | 100% cars | Safety pages | Weekly NHTSA refresh |

### P3 — Nice to Have

| Gap | Current | Target | Affected Features | Strategy |
|-----|---------|--------|-------------------|----------|
| **YouTube Videos** | 1,030 videos | 2,000+ | Expert Reviews | Expand channel list |
| **Price History** | 7 records | Time series data | Value trends | BaT historical data |

---

## Data Population Summary

### Well Populated (80%+ coverage)
- ✅ `cars` (309/309) — 100%
- ✅ `car_tuning_profiles` (309/309) — 100%
- ✅ `vehicle_maintenance_specs` (305/309) — ~99%
- ✅ `vehicle_service_intervals` (6,089 records)
- ✅ `car_issues` (9,104 records)
- ✅ `car_recalls` (1,365 records)
- ✅ `events` (8,615 events)
- ✅ `youtube_videos` (2,261 videos)
- ✅ `document_chunks` (7,447 chunks)

### Significantly Expanded
- `parts` (723 records)
- `part_fitments` (930 records)
- `part_pricing_snapshots` (971 records)
- `youtube_video_car_links` (2,306 records)
- `community_insights` (1,252 records)
- `source_documents` (764 records)
- `target_cities` (494 records)
- `event_series` (437 records)
- `application_errors` (3,792 records)

### Partially Populated
- ⚠️ `car_safety_data` (191/310 cars)
- ⚠️ `car_fuel_economy` (241/310 cars)
- ⚠️ `car_market_pricing` (10/309 cars)
- ⚠️ `car_market_pricing_years` (23 records)
- ⚠️ `car_dyno_runs` (29 records)
- ⚠️ `car_track_lap_times` (65 records)

### Empty (Future Use)
| Table | Future Purpose |
|-------|----------------|
| `user_compare_lists` | Saved comparison sessions |
| `user_sessions` | Session tracking |
| `user_lifecycle` | Lifecycle stage tracking |
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
| `community_post_parts` | Build part lists |
| `daily_driver_enrichments` | Daily driver content |
| `web_vitals` | Performance metrics |
| `goal_completions` | Goal tracking |
| `experiments` | A/B tests |
| `experiment_assignments` | Test assignments |
| `feature_usage` | Feature adoption |
| `search_analytics` | Search behavior |
| `api_usage_tracking` | API analytics |
| `journal_entries` | Financial transactions |
| `balance_sheet_snapshots` | Historical financials |
| `cash_flow_summary` | Cash flow data |
| `bank_reconciliations` | Bank reconciliation |
| `revenue_transactions` | Revenue tracking |
| `referrals` | Referral tracking |
| `referral_rewards` | Referral rewards |
| `email_queue` | Scheduled emails |
| `geocode_cache` | Geocoding cache |
| `admin_insights_cache` | Admin cache |

---

## Stored Procedures (RPCs)

AutoRev uses PostgreSQL functions for complex queries. These are called via `supabase.rpc()`.

### AL/AI Functions

| Function | Purpose | Used By |
|----------|---------|---------|
| `get_car_ai_context(p_car_slug)` | Single-call comprehensive car data | AL `get_car_ai_context` tool (legacy) |
| `get_car_ai_context_v2(p_car_slug)` | **Optimized** car data - resolves slug→id once, uses car_id for all subqueries | AL `get_car_ai_context` tool ✅ |
| `get_car_tuning_context(p_car_slug)` | **NEW** Tuning-focused data for Tuning Shop and AL | AL `recommend_build` tool, Tuning Shop |
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

> **Note (2026-01-15):** `get_car_ai_context_v2` is the preferred function. It resolves `car_slug` to `car_id` once at the start, then uses `car_id` exclusively for all subqueries, enabling better index usage and avoiding inefficient `OR` clauses.

### Search Functions

| Function | Purpose | Used By |
|----------|---------|---------|
| `search_cars_fts(search_query, max_results)` | Full-text search with relevance ranking | AL car search |
| `search_cars_fulltext(search_query, max_results)` | PostgreSQL full-text search | Car search, AL |
| `search_cars_semantic(query_embedding, threshold, count)` | Vector similarity search | Semantic car search |
| `search_cars_advanced(search_query, filters, sort_by, ...)` | Complex filtered search | Browse cars page |
| `find_cars_by_criteria(p_budget_min, p_budget_max, ...)` | Criteria-based car finder | Car selector |
| `get_similar_cars(p_slug, match_count)` | Find similar cars via embeddings | Not yet integrated (future: car detail page) |

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
| `resolve_car_id_from_slug()` | Auto-populate car_id from car_slug | Various tables INSERT/UPDATE |

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
   community_insights                   car_tuning_profiles
   events (via car_affinities)
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
| `click_events` | `idx_click_events_user_id` | BTREE | User analytics |
| `page_views` | `idx_page_views_user_id` | BTREE | User session tracking |
| `page_engagement` | `idx_page_engagement_page_view_id` | BTREE | Engagement joins |

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
| `cars` | **140** | Most comprehensive — specs, scores, AI embeddings |
| `vehicle_maintenance_specs` | **130** | Oil, coolant, brake fluid, tires, etc. |
| `monthly_financial_reports` | **62** | Complete financial reporting |
| `balance_sheet_snapshots` | **55** | Point-in-time financials |
| `user_vehicles` | **51** | VIN, ownership, mileage, Car Concierge |
| `car_pipeline_runs` | **50** | 8-phase pipeline tracking |
| `cash_flow_summary` | **49** | Cash flow statement |
| `user_feedback` | **47** | Comprehensive feedback tracking |
| `user_profiles` | **44** | User data, billing, preferences |
| `application_errors` | **44** | Error logging |
| `wheel_tire_fitment_options` | **43** | Wheel/tire fitments |
| `youtube_videos` | **42** | Video metadata + AI insights |
| `events` | **37** | Event details + location |
| `featured_content` | **37** | Curated content |
| `monthly_financials` | **34** | Monthly summaries |
| `al_articles` | **32** | AI-generated articles |

---

## Deprecated Tables & Columns (2026-01-15)

The following tables and columns are deprecated as part of the database optimization initiative. They remain in the schema for backward compatibility but should not be used for new development.

### Deprecated Tables

| Table | Status | Replacement | Notes |
|-------|--------|-------------|-------|
| `vehicle_known_issues` | **DEPRECATED** | `car_issues` | `car_issues` has 6,202 rows vs 89 in deprecated table. All known issues data consolidated here. |

### Deprecated Columns

| Table | Column | Status | Replacement | Notes |
|-------|--------|--------|-------------|-------|
| `cars` | `upgrade_recommendations` | **DEPRECATED** | `car_tuning_profiles.upgrades_by_objective` | JSONB column moved to dedicated tuning profiles table |
| `cars` | `popular_track_mods` | **DEPRECATED** | `car_tuning_profiles.upgrades_by_objective` | Same as above |

### Source of Truth Matrix

| Data Type | Source of Truth | Do NOT Use |
|-----------|----------------|------------|
| Known Issues | `car_issues` | ~~`vehicle_known_issues`~~, ~~`cars.common_issues`~~ |
| Upgrade Recommendations | `car_tuning_profiles.upgrades_by_objective` | ~~`cars.upgrade_recommendations`~~, ~~`data/carUpgradeRecommendations.js`~~ |
| Tuning Data | `car_tuning_profiles` | ~~`data/upgradePackages.js`~~, ~~`cars.popular_track_mods`~~ |
| Maintenance Specs | `vehicle_maintenance_specs` + `vehicle_service_intervals` | — |
| Performance Data | `car_dyno_runs`, `car_track_lap_times` | — |

> **Reference:** See `audit/database-design-optimization-review-2026-01-11.md` for the full optimization plan.

---

## Car Identifier Pattern (car_id vs car_slug)

> **Last Updated:** January 11, 2026 — Database fully cleaned up with comprehensive car_id linkage

### ✅ Clean Architecture

| Identifier | Location | Purpose |
|------------|----------|---------|
| **`cars.slug`** | `cars` table only | URL routing, human-readable lookups |
| **`car_id`** | All other tables | Primary FK for relationships, queries, joins |
| **`car_ids[]`** | Multi-car tables | UUID array for tables referencing multiple cars |

### Final Statistics

| Metric | Count |
|--------|-------|
| Tables with `car_id` (single) | **42** |
| Tables with `car_ids[]` (array) | **5** |
| Tables with `car_slug` only | **1** (`car_pipeline_runs` - intentional) |
| Auto car_id triggers | **5** |

### Pattern Rules

1. **`cars` table:** Has `slug` column (the canonical source of truth)
2. **Single-car tables:** Use `car_id UUID REFERENCES cars(id)` 
3. **Multi-car tables:** Use `car_ids UUID[]` array alongside `car_slugs[]` for display
4. **To get slug:** Join to `cars` table: `JOIN cars c ON c.id = table.car_id`
5. **Triggers:** Auto-populate `car_id` from slug columns on INSERT/UPDATE

### Tables with car_id (Single Reference)

| Table | car_id Column | Notes |
|-------|---------------|-------|
| All `car_*` tables | `car_id` | Core car data |
| `al_conversations` | `initial_car_id` | Auto-populated from `initial_car_slug` |
| `car_slug_aliases` | `car_id` | Auto-populated from `canonical_slug` |
| `user_favorites`, `user_projects` | `car_id` | User's saved cars |
| `user_vehicles` | `matched_car_id` | Auto-populated from `matched_car_slug` |
| `daily_driver_enrichments` | `car_id` | Auto-populated from `car_slug` |

### Tables with car_ids[] (Multi Reference)

| Table | Array Column | Display Column | Notes |
|-------|--------------|----------------|-------|
| `al_articles` | `car_ids UUID[]` | `car_slugs TEXT[]` | AI-generated articles |
| `featured_content` | `related_car_ids UUID[]` | `related_car_slugs TEXT[]` | Curated content |
| `user_compare_lists` | `car_ids UUID[]` | `car_slugs JSONB` | Comparison sessions |
| `forum_sources` | `car_ids UUID[]` | `car_slugs TEXT[]` | Forum scrape config |
| `forum_scraped_threads` | `car_ids_detected UUID[]` | `car_slugs_detected TEXT[]` | Detected cars |

### Tables with car_slug Only (Exception)

| Table | Reason |
|-------|--------|
| `car_pipeline_runs` | Car may not exist yet during pipeline phases |

### Auto-Populate Triggers

| Table | Trigger | Resolves |
|-------|---------|----------|
| `al_conversations` | `auto_car_id_al_conversations` | `initial_car_slug` → `initial_car_id` |
| `car_slug_aliases` | `auto_car_id_car_slug_aliases` | `canonical_slug` → `car_id` |
| `daily_driver_enrichments` | `auto_car_id_daily_driver_enrichments` | `car_slug` → `car_id` |
| `vehicle_known_issues` | `auto_car_id_vehicle_known_issues` | `car_slug` → `car_id` |
| `user_vehicles` | `auto_car_id_user_vehicles` | `matched_car_slug` → `matched_car_id` |

### Helper Function

Use `lib/carResolver.js` to resolve slug → id in application code:

```javascript
import { resolveCarId } from '@/lib/carResolver';

const carId = await resolveCarId('bmw-m3-g80');
// Returns UUID or null
```

> **Audit:** See `audit/car-id-linkage-audit-2026-01-11.md` for full analysis

---

*See [API.md](API.md) for how to access this data.*
