# Vehicle Data Pipeline v2.2

> **THE** single source of truth for all vehicle data operations in AutoRev.
> **ALL 17 tables. ALL fields. Fully automated.**

## Quick Start

```bash
# Full pipeline (recommended)
node scripts/vehicle-data-pipeline/run.mjs -v "Ram 1500 TRX" -m full

# Validate only (check completeness)
node scripts/vehicle-data-pipeline/run.mjs -v "Ram 1500 TRX" -m validate

# Batch process
node scripts/vehicle-data-pipeline/run.mjs -b 10 -m full
```

## Complete Data Sources

| Source | Tables | Status |
|--------|--------|--------|
| **EPA API** | `car_fuel_economy` | ✅ Automated |
| **NHTSA Safety API** | `car_safety_data` | ✅ Automated |
| **NHTSA Recalls API** | `car_recalls` | ✅ Automated |
| **Claude/GPT-4 AI** | `vehicle_maintenance_specs`, `car_tuning_profiles`, `car_issues`, `car_variants`, `vehicle_service_intervals`, `cars`, `wheel_tire_fitment_options` | ✅ Automated |
| **Exa Search + Supadata** | `car_expert_reviews` (YouTube transcripts) | ✅ Automated |
| **Exa PDF Search** | `car_manual_data` | ✅ Automated |
| **Google Nano Banana Pro** | `car_images` | ✅ Automated |

### Tables NOT Automated (Future)

| Table | Reason | Future Plan |
|-------|--------|-------------|
| `car_dyno_runs` | Need actual dyno data | Manual + YouTube |
| `car_track_lap_times` | Need track data | FastestLaps scrape |
| `car_auction_results` | Need auction data | BaT/C&B API |
| `car_market_pricing` | Market values change | KBB/Edmunds API |

## What Gets Populated

### Stage 1: Government APIs (Automated)

| Table | Fields | Source |
|-------|--------|--------|
| `car_fuel_economy` | city_mpg, highway_mpg, combined_mpg, annual_fuel_cost, co2_emissions | EPA API |
| `car_safety_data` | overall_rating, front_crash, side_crash, rollover, complaint_count | NHTSA API |
| `car_recalls` | campaign_number, component, summary, consequence, remedy | NHTSA API |

### Stage 2: AI Research (11 Agents)

| # | Agent | Table | What It Researches |
|---|-------|-------|-------------------|
| 1 | **Maintenance** | `vehicle_maintenance_specs` | ALL 130 fields including OEM part numbers |
| 2 | **Service Intervals** | `vehicle_service_intervals` | Oil change, trans service, brakes, etc. |
| 3 | **Variants** | `car_variants` | Trim levels, specs per variant |
| 4 | **Performance** | `cars` | 0-60, quarter mile, braking, lateral g |
| 5 | **Tuning** | `car_tuning_profiles` | Platforms, stages, power limits |
| 6 | **Issues** | `car_issues` | Common problems, fixes, costs |
| 7 | **Editorial** | `cars` | Tagline, essence, driving feel, buyer guide |
| 8 | **Fitment** | `wheel_tire_fitment_options` | OEM and aftermarket wheel/tire combos |
| 9 | **Expert Reviews** | `car_expert_reviews` | YouTube reviews via Exa + Supadata transcripts |
| 10 | **Manuals** | `car_manual_data` | Owner's manual PDFs, service manuals |
| 11 | **Images** | `car_images` | AI-generated hero images via Google |

### OEM Parts Researched (ALL of them)

```
✅ oil_filter_oem_part           ✅ brake_front_rotor_oem_part
✅ air_filter_oem_part           ✅ brake_front_pad_oem_part
✅ cabin_filter_oem_part         ✅ brake_rear_rotor_oem_part
✅ fuel_filter_oem_part          ✅ brake_rear_pad_oem_part
✅ spark_plug_oem_part           ✅ timing_tensioner_oem_part
✅ serpentine_belt_oem_part      ✅ ac_belt_oem_part
✅ alternator_oem_part           ✅ shock_front_oem_part
✅ shock_rear_oem_part           ✅ spring_front_oem_part
✅ spring_rear_oem_part          ✅ wiper_oem_part_driver
✅ wiper_oem_part_passenger      ✅ wiper_oem_part_rear
```

## QA Process (Stage 3)

Built-in quality assurance checks:

### 1. Range Validation
- 0-60 time: 1.5-30 seconds
- Oil capacity: 2-16 quarts
- Braking 60-0: 80-250 feet
- MPG: 5-200

### 2. Cross-Field Validation
- City MPG < Highway MPG
- Supercharged engines → 0W-40 oil (not 0W-20)
- Power-to-weight ratio vs 0-60 consistency

### 3. Format Validation
- Tire size format: `###/##R##`
- Bolt pattern format: `#x###.#`
- Oil viscosity format: `#W-##`

### 4. OEM Part Number Validation
- Counts how many OEM parts were found
- Warns if <50% populated

### 5. AI Validation Agent (optional)
- Uses Claude to cross-check data consistency
- Flags obvious errors

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# AI Providers (at least one required)
ANTHROPIC_API_KEY=xxx          # Claude - best for technical specs
OPENAI_API_KEY=xxx             # GPT-4 - alternative

# Web Search & Transcripts
EXA_API_KEY=xxx                # Exa search for YouTube + manuals
SUPADATA_API_KEY=xxx           # YouTube transcript extraction

# Image Generation
GOOGLE_AI_API_KEY=xxx          # Nano Banana Pro (Gemini)
BLOB_READ_WRITE_TOKEN=xxx      # Vercel Blob for uploads
```

## Pipeline Stages

```
STAGE 1: FETCH        → EPA + NHTSA APIs
STAGE 2: ENRICH       → 11 AI agents research everything
STAGE 3: VALIDATE     → QA checks (range, format, cross-field)
STAGE 4: UPDATE       → Write to ALL 13 tables
STAGE 5: COMPLETENESS → Report NULL fields, calculate %
```

## Coverage Summary

| Category | Tables | Automated |
|----------|--------|-----------|
| **CRITICAL** | cars, vehicle_maintenance_specs, car_tuning_profiles, car_issues, car_variants | ✅ 100% |
| **HIGH** | car_fuel_economy, car_safety_data, car_recalls, vehicle_service_intervals | ✅ 100% |
| **MEDIUM** | wheel_tire_fitment_options, car_expert_reviews, car_manual_data, car_images | ✅ 100% |
| **FUTURE** | car_dyno_runs, car_track_lap_times, car_auction_results, car_market_pricing | ⏳ Planned |

**13 of 17 tables fully automated (76%)**
**~600+ fields covered**

## Estimated Time

| Stage | Time |
|-------|------|
| Stage 1 (APIs) | ~5 seconds |
| Stage 2 (11 agents) | ~3-5 minutes |
| Stage 3 (Validation) | ~2 seconds |
| Stage 4 (DB Write) | ~10 seconds |
| Stage 5 (Check) | ~3 seconds |
| **Total** | **~4-6 minutes per vehicle** |

For 310 vehicles: ~20-30 hours (can run overnight)

## Files

```
scripts/vehicle-data-pipeline/
├── README.md       # This file
├── config.mjs      # Table schemas, validation rules
└── run.mjs         # Main entry point (all stages, ~1800 lines)
```
