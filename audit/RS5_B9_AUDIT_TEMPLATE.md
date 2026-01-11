# Vehicle Data Audit Template

## Vehicle: Audi RS5 B9
## Car ID: `7ecde939-eb56-4d6c-91c5-10bc466624a3`
## Audit Date: 2026-01-11
## Status: ✅ COMPLETE

---

## Summary

This document serves as both an audit of the Audi RS5 B9 data AND a template for auditing other vehicles.

### Data Completeness Score: 92/100

| Table | Status | Completeness |
|-------|--------|--------------|
| `cars` (base data) | ✅ Complete | 95% |
| `car_tuning_profiles` | ✅ Complete | 100% |
| `car_issues` | ✅ Has Data | 3 issues |
| `car_variants` | ✅ Has Data | 1 variant |
| `vehicle_maintenance_specs` | ✅ Complete | 95% |
| `vehicle_service_intervals` | ✅ Complete | 10 intervals |
| `part_fitments` | ✅ Has Data | 22 parts |
| `youtube_video_car_links` | ✅ Has Data | 8 videos |
| `car_dyno_runs` | ⚠️ Empty | 0 |
| `car_track_lap_times` | ⚠️ Empty | 0 |
| `community_posts` | ✅ Has Data | 1 post |
| `community_insights` | ⚠️ Empty | 0 |

---

## Detailed Field Audit: `cars` Table

### Core Identity (All Required)
| Field | Status | Value |
|-------|--------|-------|
| `id` | ✅ | `7ecde939-eb56-4d6c-91c5-10bc466624a3` |
| `slug` | ✅ | `audi-rs5-b9` |
| `name` | ✅ | `Audi RS5 B9` |
| `years` | ✅ | `2018-2024` |
| `brand` | ✅ | `Audi` |
| `country` | ✅ | `Germany` |
| `vehicle_type` | ✅ | `Sports Car` |

### Classification
| Field | Status | Value | Notes |
|-------|--------|-------|-------|
| `tier` | ✅ | `upper-mid` | Used for pricing/comparison |
| `category` | ✅ | `Front-Engine` | Engine layout |
| `generation_code` | ✅ | `B9/F5` | Platform designation |

### Performance Specs
| Field | Status | Value | Notes |
|-------|--------|-------|-------|
| `engine` | ✅ | `2.9L TT V6` | |
| `hp` | ✅ | `444` | Crank horsepower |
| `torque` | ✅ | `443` | lb-ft |
| `trans` | ✅ | `8AT` | ZF 8-speed |
| `drivetrain` | ✅ | `AWD` | Quattro |
| `curb_weight` | ✅ | `3990` | lbs |
| `zero_to_sixty` | ✅ | `3.7` | seconds |
| `quarter_mile` | ✅ | `12.10` | seconds |
| `top_speed` | ✅ | `155` | mph (limited) |
| `braking_60_0` | ✅ | `100` | ft |
| `lateral_g` | ✅ | `1.00` | g |
| `layout` | ⚠️ NULL | - | Could add "Front-Engine AWD" |

### Pricing
| Field | Status | Value | Notes |
|-------|--------|-------|-------|
| `price_range` | ✅ | `$55-80K` | Used market |
| `price_avg` | ✅ | `65000` | |
| `msrp_new_low` | ✅ | `74900` | **FIXED** - was NULL |
| `msrp_new_high` | ✅ | `82900` | **FIXED** - was NULL |

### AutoRev Scores (1-10)
| Field | Status | Value | Notes |
|-------|--------|-------|-------|
| `score_sound` | ✅ | `5.9` | Lower due to turbo V6 |
| `score_interior` | ✅ | `9.1` | Audi quality |
| `score_track` | ✅ | `7.5` | Good but not focused |
| `score_reliability` | ✅ | `7.8` | German reliability |
| `score_value` | ✅ | `7.4` | Good for class |
| `score_driver_fun` | ✅ | `7.0` | GT character |
| `score_aftermarket` | ✅ | `6.3` | APR/IE support |

### Performance Sub-Scores (1-10)
| Field | Status | Value |
|-------|--------|-------|
| `perf_power_accel` | ✅ | `9.0` |
| `perf_grip_cornering` | ✅ | `8.0` |
| `perf_braking` | ✅ | `8.0` |
| `perf_track_pace` | ✅ | `8.0` |
| `perf_drivability` | ✅ | `9.0` |
| `perf_reliability_heat` | ✅ | `8.0` |
| `perf_sound_emotion` | ✅ | `6.0` |

### Editorial Content
| Field | Status | Length | Notes |
|-------|--------|--------|-------|
| `essence` | ✅ | ~180 chars | One-liner personality |
| `heritage` | ✅ | ~600 chars | History/context |
| `design_philosophy` | ✅ | ~150 chars | Brand philosophy |
| `motorsport_history` | ⚠️ NULL | - | RS5 has limited motorsport |
| `notes` | ✅ | Short | Quick summary |
| `highlight` | ✅ | Short | Marketing hook |
| `tagline` | ✅ | Short | Slogan |
| `hero_blurb` | ⚠️ NULL | - | Could add intro paragraph |
| `owner_notes_long` | ⚠️ NULL | - | Detailed owner perspective |

### Driving Character
| Field | Status | Has Content |
|-------|--------|-------------|
| `engine_character` | ✅ | Yes |
| `transmission_feel` | ✅ | Yes |
| `chassis_dynamics` | ✅ | Yes |
| `steering_feel` | ✅ | Yes |
| `brake_confidence` | ✅ | Yes |
| `sound_signature` | ✅ | Yes |
| `comfort_track_balance` | ✅ | `daily` |
| `comfort_notes` | ✅ | Yes |

### Buyer Guidance
| Field | Status | Count/Value | Notes |
|-------|--------|-------------|-------|
| `ideal_owner` | ✅ | Text | Who should buy |
| `not_ideal_for` | ✅ | Text | Who shouldn't |
| `buyers_summary` | ✅ | Text | Purchase tips |
| `pros` | ✅ | 4 items | |
| `cons` | ✅ | 3 items | |
| `best_for` | ✅ | 4 items | Use cases |
| `defining_strengths` | ✅ | 5 items | Detailed strengths |
| `honest_weaknesses` | ✅ | 4 items | Detailed weaknesses |
| `recommendation_highlight` | ⚠️ NULL | - | Could add |

### Year/Model Guidance
| Field | Status | Count/Value |
|-------|--------|-------------|
| `best_years_detailed` | ✅ | 1 item |
| `years_to_avoid_detailed` | ⚠️ | 0 items |
| `years_to_avoid` | ⚠️ NULL | - |
| `recommended_years_note` | ⚠️ NULL | - |
| `predecessors` | ✅ | 1 item |
| `successors` | ⚠️ | 0 items |

### Purchase/Options
| Field | Status | Count |
|-------|--------|-------|
| `must_have_options` | ✅ | 2 items |
| `nice_to_have_options` | ✅ | 4 items | **FIXED** - was 0 |
| `pre_inspection_checklist` | ✅ | 8 items | **FIXED** - was 0 |
| `ppi_recommendations` | ✅ | Text | **FIXED** - was NULL |

### Ownership Costs
| Field | Status | Value | Notes |
|-------|--------|-------|-------|
| `price_guide` | ✅ | Object | Low/mid/high prices |
| `annual_ownership_cost` | ✅ | Object | Cost ranges |
| `major_service_costs` | ✅ | Object | **FIXED** - was {} |
| `common_issues` | ⚠️ | 0 items | Deprecated - use car_issues |
| `common_issues_detailed` | ✅ | 1 item | Carbon buildup |
| `maintenance_cost_index` | ⚠️ NULL | - | Could add numeric index |
| `insurance_cost_index` | ⚠️ NULL | - | Could add numeric index |
| `fuel_economy_combined` | ✅ | `21.0` | MPG |
| `ownership_cost_notes` | ⚠️ NULL | - | |

### Service/Repair
| Field | Status | Value | Notes |
|-------|--------|-------|-------|
| `parts_availability` | ✅ | `excellent` | **FIXED** - was NULL |
| `parts_notes` | ✅ | Text | **FIXED** - was NULL |
| `dealer_vs_independent` | ⚠️ NULL | - | Could add |
| `dealer_notes` | ⚠️ NULL | - | Could add |
| `diy_friendliness` | ✅ | `moderate` | **FIXED** - was NULL |
| `diy_notes` | ✅ | Text | **FIXED** - was NULL |
| `warranty_info` | ✅ | Object | **FIXED** - was {} |
| `insurance_notes` | ✅ | Text | **FIXED** - was NULL |

### Track Performance
| Field | Status | Value | Notes |
|-------|--------|-------|-------|
| `track_readiness` | ✅ | `weekend-warrior` | |
| `track_readiness_notes` | ✅ | Text | **FIXED** - was NULL |
| `cooling_capacity` | ✅ | Object | **FIXED** - was {} |
| `brake_fade_resistance` | ✅ | Object | **FIXED** - was {} |
| `recommended_track_prep` | ✅ | 5 items | **FIXED** - was 0 |
| `popular_track_mods` | ✅ | 5 items | **FIXED** - was 0 |
| `laptime_benchmarks` | ⚠️ | 0 items | No official times |

### Comparisons
| Field | Status | Count | Notes |
|-------|--------|-------|-------|
| `direct_competitors` | ✅ | 4 items | **FIXED** - was 0 |
| `if_you_want_more` | ✅ | 3 items | **FIXED** - was 0 |
| `if_you_want_less` | ✅ | 3 items | **FIXED** - was 0 |
| `similar_driving_experience` | ✅ | 3 items | **FIXED** - was 0 |

### Community
| Field | Status | Value | Notes |
|-------|--------|-------|-------|
| `community_strength` | ✅ | `8` | **UPDATED** - was 7 |
| `community_notes` | ✅ | Text | **FIXED** - was NULL |
| `key_resources` | ✅ | 3 items | **FIXED** - was 0 |
| `facebook_groups` | ✅ | 3 items | **FIXED** - was 0 |
| `annual_events` | ⚠️ | 0 items | No RS5-specific events |
| `aftermarket_scene_notes` | ✅ | Text | **FIXED** - was NULL |
| `resale_reputation` | ✅ | Text | **FIXED** - was NULL |

### Media & Reviews
| Field | Status | Count | Notes |
|-------|--------|-------|-------|
| `image_hero_url` | ✅ | URL | Stock image |
| `image_gallery` | ⚠️ | 0 items | Could add gallery |
| `video_url` | ⚠️ NULL | - | Could add hero video |
| `notable_reviews` | ✅ | 1 item | |
| `must_watch_videos` | ✅ | 2 items | **FIXED** - had URLs |
| `expert_quotes` | ✅ | 1 item | |
| `external_consensus` | ✅ | Object | Aggregated sentiment |
| `expert_review_count` | ✅ | `8` | |
| `expert_consensus_summary` | ⚠️ NULL | - | Could auto-generate |

### Other
| Field | Status | Value | Notes |
|-------|--------|-------|-------|
| `manual_available` | ✅ | `false` | **FIXED** - was true |
| `seats` | ✅ | `4` | **FIXED** - was NULL |
| `daily_usability_tag` | ✅ | `great-daily` | **FIXED** - was NULL |
| `platform_cost_tier` | ⚠️ NULL | - | Could add |
| `cta_copy` | ⚠️ NULL | - | Marketing CTA |

### Search/AI (Auto-Generated)
| Field | Status | Notes |
|-------|--------|-------|
| `search_vector` | ✅ | Full-text search |
| `ai_searchable_text` | ✅ | AI context |
| `embedding` | ✅ | Vector embedding |
| `upgrade_recommendations` | ✅ | 3 tiers |

---

## Detailed Field Audit: `car_tuning_profiles` Table

| Field | Status | Value | Notes |
|-------|--------|-------|-------|
| `engine_family` | ✅ | `2.9L TFSI Twin-Turbo V6` | **FIXED** - was wrong |
| `tuning_focus` | ✅ | `performance` | |
| `stock_whp` | ✅ | `377` | **FIXED** - was wrong |
| `stock_wtq` | ✅ | `377` | **FIXED** - was wrong |
| `stage_progressions` | ✅ | 4 stages | **FIXED** - correct stages |
| `tuning_platforms` | ✅ | 4 platforms | APR, Unitronic, HPA, IE |
| `power_limits` | ✅ | 4 limits | Stock turbo/internals/trans/fuel |
| `brand_recommendations` | ✅ | 6 categories | |
| `upgrades_by_objective` | ✅ | 21 upgrades | **FIXED** - correct data |
| `platform_insights` | ✅ | Object | **FIXED** - correct insights |
| `curated_packages` | ⚠️ | 0 items | Could add preset packages |
| `youtube_insights` | ✅ | Object | Extracted from 8 videos |
| `research_sources` | ✅ | 1 source | |
| `data_quality_tier` | ✅ | `researched` | |
| `data_sources` | ✅ | Object | |
| `verified` | ⚠️ | `false` | Could be verified |
| `verified_by` | ⚠️ NULL | - | |
| `pipeline_version` | ✅ | `2.0.0-platform-based` | **NEW** |

---

## Related Tables Audit

### `car_issues` (3 records)
| Issue | Severity | Source |
|-------|----------|--------|
| Carbon Buildup | Moderate | Manual research |
| MMI Restarting | Unknown | NHTSA complaint |
| Sunroof Explosion | Unknown | NHTSA complaint |

### `car_variants` (1 record)
| Variant | Years | Engine |
|---------|-------|--------|
| Base | 2018-2024 | 2.9L TT V6 |

### `vehicle_maintenance_specs` (1 record) ✅ Complete
- Oil specs, coolant, brake fluid, trans fluid
- Tire sizes, wheel specs, brake rotor sizes
- Spark plug specs, battery specs
- All major specs populated

### `vehicle_service_intervals` (10 records)
| Service | Interval | Dealer Cost |
|---------|----------|-------------|
| Oil Change | 5,000 mi | $144-270 |
| Brake Fluid | 24,000 mi | $216-360 |
| Coolant | 30,000 mi | $270-450 |
| Transmission | 40,000 mi | $360-720 |
| Spark Plugs | 60,000 mi | $360-900 |
| Air Filter | 20,000 mi | $72-144 |
| Cabin Filter | 15,000 mi | $90-180 |
| Front Brakes | 30,000 mi | $540-1,080 |
| Rear Brakes | 40,000 mi | $450-900 |
| Differential | 30,000 mi | $270-540 |

### `part_fitments` (22 parts)
Categories with parts:
- Exhaust ✅
- Forced Induction ✅
- Cooling ✅
- Fuel System ✅
- Suspension ✅
- Tune ✅
- Brakes ✅
- Other ✅

### `youtube_video_car_links` (8 videos)
| Channel | Title |
|---------|-------|
| CNET Cars | 2019 Audi RS5 Sportback Review |
| Vehicle Visionary | Should You Buy A USED 2019 RS5? |
| Throttle House | 2023 RS5 Competition Full Review |
| The Naj | RS5 B9 IS IT WORTH THE BUY? |
| carwow | Audi RS5 review (Mat Watson) |
| carwow | RS5 2018 review |
| Doug DeMuro | Here's Why the RS5 Sportback Is My Favorite |
| TheStraightPipes | Swiss Army Knife of Cars |

### Missing Data (Could Add)
| Table | Status | Notes |
|-------|--------|-------|
| `car_dyno_runs` | ⚠️ Empty | Real dyno data would be valuable |
| `car_track_lap_times` | ⚠️ Empty | Track times would be valuable |
| `community_insights` | ⚠️ Empty | User-generated insights |

---

## Changes Made During This Audit

### Critical Fixes

1. **`manual_available`**: Changed `true` → `false`
   - RS5 B9 has NO manual transmission option

2. **`car_tuning_profiles.engine_family`**: Changed `2.5L TFSI 5-Cylinder` → `2.9L TFSI Twin-Turbo V6`
   - Was incorrectly showing RS3 engine data

3. **`car_tuning_profiles.stock_whp`**: Changed `340` → `377`
   - Was showing RS3 power numbers

4. **`car_tuning_profiles.stock_wtq`**: Changed `360` → `377`
   - Was showing RS3 torque numbers

5. **`car_tuning_profiles.upgrades_by_objective`**: Replaced entirely
   - Was contaminated with RS3 upgrade data
   - Now has 21 RS5-specific upgrades

6. **`car_tuning_profiles.platform_insights`**: Replaced entirely
   - Now has RS5-specific strengths/weaknesses

### New Data Added

| Field | Added Value |
|-------|-------------|
| `seats` | `4` |
| `daily_usability_tag` | `great-daily` |
| `msrp_new_low` | `74900` |
| `msrp_new_high` | `82900` |
| `direct_competitors` | BMW M4, C63, RC F, Giulia QF |
| `if_you_want_more` | RS6, 911 Turbo, M5 |
| `if_you_want_less` | S5, M440i, C43 |
| `similar_driving_experience` | M4, RS4, C63 Coupe |
| `community_notes` | Forum/Reddit info |
| `diy_friendliness` | `moderate` |
| `diy_notes` | DIY guidance |
| `parts_availability` | `excellent` |
| `parts_notes` | Parts sourcing info |
| `insurance_notes` | Insurance guidance |
| `warranty_info` | Full Audi warranty |
| `major_service_costs` | Spark plugs, brakes, etc. |
| `nice_to_have_options` | B&O, Carbon Ceramics, etc. |
| `pre_inspection_checklist` | 8 PPI items |
| `ppi_recommendations` | PPI guidance |
| `key_resources` | 3 forum links |
| `facebook_groups` | 3 groups |
| `track_readiness_notes` | Track guidance |
| `cooling_capacity` | Track cooling info |
| `brake_fade_resistance` | Brake info |
| `recommended_track_prep` | 5 prep items |
| `popular_track_mods` | 5 mod items |
| `resale_reputation` | Resale info |
| `aftermarket_scene_notes` | Aftermarket info |

---

## Files Created for Platform-Based Tuning

1. **`lib/enginePlatforms.js`** - Engine platform identification
   - Maps cars to engine platforms
   - Validates stock power ranges
   - 25+ platform definitions

2. **`data/tuningTemplates.js`** - Platform tuning templates
   - Templates for 2.9L TFSI, 2.5L TFSI
   - Stage progressions, power limits, brand recommendations
   - Expandable for more platforms

3. **`lib/tuningValidation.js`** - Validation layer
   - Validates tuning data before database write
   - Prevents cross-contamination
   - Manufacturer-appropriate tuning platform checks

---

## Replication Checklist for Other Vehicles

When auditing another vehicle, check:

### Phase 1: Core Data Verification
- [ ] Verify `manual_available` is correct
- [ ] Verify `seats` is set
- [ ] Verify `hp`, `torque`, `engine` are accurate
- [ ] Verify `drivetrain` is correct
- [ ] Verify `years` range is complete

### Phase 2: Tuning Profile
- [ ] Check `engine_family` matches actual engine
- [ ] Check `stock_whp` is reasonable (crank HP × 0.85)
- [ ] Check `stage_progressions` are platform-specific
- [ ] Check `tuning_platforms` are manufacturer-appropriate
- [ ] Check `upgrades_by_objective` has correct data

### Phase 3: Missing Data Fill
- [ ] Add `direct_competitors` if empty
- [ ] Add `if_you_want_more/less` if empty
- [ ] Add `msrp_new_low/high` if known
- [ ] Add `warranty_info` if available
- [ ] Add `major_service_costs` if known
- [ ] Add `pre_inspection_checklist` if empty
- [ ] Add `community_notes`, `key_resources` if empty

### Phase 4: Related Tables
- [ ] Verify `car_issues` has known issues
- [ ] Verify `vehicle_maintenance_specs` is populated
- [ ] Verify `vehicle_service_intervals` has services
- [ ] Check `part_fitments` has compatible parts

---

## SQL Queries for Replication

### Find cars with wrong manual_available
```sql
SELECT slug, name, manual_available, trans 
FROM cars 
WHERE manual_available = true 
  AND trans NOT LIKE '%MT%' 
  AND trans NOT LIKE '%Manual%';
```

### Find cars with contaminated tuning profiles
```sql
SELECT c.slug, c.name, c.engine, ctp.engine_family, ctp.stock_whp
FROM cars c
JOIN car_tuning_profiles ctp ON c.id = ctp.car_id
WHERE ctp.engine_family IS NOT NULL
  AND c.engine NOT ILIKE '%' || split_part(ctp.engine_family, ' ', 1) || '%';
```

### Find cars missing critical data
```sql
SELECT slug, name,
  CASE WHEN seats IS NULL THEN 'seats' END as missing_1,
  CASE WHEN daily_usability_tag IS NULL THEN 'daily_tag' END as missing_2,
  CASE WHEN msrp_new_low IS NULL THEN 'msrp' END as missing_3,
  CASE WHEN jsonb_array_length(direct_competitors) = 0 THEN 'competitors' END as missing_4
FROM cars
WHERE seats IS NULL 
   OR daily_usability_tag IS NULL 
   OR msrp_new_low IS NULL 
   OR jsonb_array_length(direct_competitors) = 0;
```
