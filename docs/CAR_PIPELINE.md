# Car Addition Pipeline

> Comprehensive guide for adding new vehicles to AutoRev
>
> **Last Updated:** December 21, 2024

---

## ⭐ AI Automated Addition (Recommended)

**The easiest way to add a car is using full AI automation:**

```bash
# Single car - fully automated (~5 min)
node scripts/car-pipeline/ai-research-car.js "Porsche 911 GT3 (992)"

# Multiple cars from file
node scripts/car-pipeline/ai-batch-add-cars.js new-cars.txt
```

**What AI automation does:**
1. ✅ Researches specs, pricing, performance data (Claude Sonnet 4)
2. ✅ Finds 5-8 known issues from forums and TSBs
3. ✅ Creates maintenance specs and 10+ service intervals
4. ✅ Assigns 7 expert scores (sound, track, value, etc.)
5. ✅ Writes editorial content (strengths, weaknesses, competitors)
6. ✅ Generates hero + garage images (Nano Banana Pro)
7. ✅ Calls EPA + NHTSA APIs for official data
8. ✅ Saves everything to database

**Environment variables required:**
- `ANTHROPIC_API_KEY` - For AI research (Claude)
- `GOOGLE_AI_API_KEY` - For image generation (Nano Banana Pro)
- `BLOB_READ_WRITE_TOKEN` - For uploading to Vercel Blob
- `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` - Database
- `SUPADATA_API_KEY` - For reliable YouTube transcript fetching
- `EXA_API_KEY` - (Optional) Fallback for YouTube discovery when quota exceeded

---

## ⚠️ Post-Addition Verification Checklist

After running the AI pipeline, **always verify these items**:

### 1. YouTube Videos Are Correct Model
The YouTube discovery uses strict model matching, but verify linked videos are actually for your car:

```sql
-- Check what videos are linked
SELECT v.title, v.channel_name, l.match_confidence
FROM youtube_videos v
JOIN youtube_video_car_links l ON v.video_id = l.video_id
WHERE l.car_slug = 'your-car-slug';
```

**Common issues:**
- "Aston Martin Vanquish" videos matching "Aston Martin DB9" (different models)
- Compilation videos mentioning the car but not reviewing it
- Videos about similar but different variants

**To fix:** Remove incorrect links:
```sql
DELETE FROM youtube_video_car_links 
WHERE car_slug = 'your-car-slug' 
AND video_id IN ('wrong-video-id');
```

### 2. HP/Torque Accuracy for Multi-Year Cars
Cars with long production runs often had power upgrades. Verify specs represent the typical/common configuration:

| Car | Early Years | Late Years | What to Use |
|-----|-------------|------------|-------------|
| Aston Martin DB9 | 450hp (2004-2007) | 510hp (2012-2016) | 470hp (mid-range) |
| BMW M3 E9x | 414hp (2008) | 420hp (2011+) | 414hp |
| Porsche 997 | 325hp (base) | 385hp (S) | Depends on variant |

### 3. Editorial Arrays Format
Ensure `defining_strengths` and `honest_weaknesses` are objects, not strings:

```sql
-- Check format (should return objects with title/description)
SELECT defining_strengths, honest_weaknesses FROM cars WHERE slug = 'your-car-slug';
```

**Correct format:**
```json
[{"title": "V12 Symphony", "description": "The engine produces one of the finest sounds..."}]
```

**Wrong format:**
```json
["Stunning naturally aspirated V12 soundtrack"]
```

### 4. Category Value
The `category` column must be one of: `Front-Engine`, `Mid-Engine`, `Rear-Engine` (engine layout, not car type).

---

## 🔄 YouTube API Quota & Fallback

YouTube Data API has a **10,000 units/day quota**. If exceeded:

1. **Exa Fallback**: The discovery script automatically tries Exa search to find videos
2. **Manual Addition**: Use Exa web search to find videos, then manually add:

```sql
-- Add video record
INSERT INTO youtube_videos (video_id, url, title, channel_name)
VALUES ('VIDEO_ID', 'https://youtube.com/watch?v=VIDEO_ID', 'Title', 'Channel');

-- Link to car
INSERT INTO youtube_video_car_links (video_id, car_id, car_slug, match_confidence, match_method, role)
VALUES ('VIDEO_ID', 'CAR_UUID', 'car-slug', 0.95, 'manual', 'primary');
```

3. **Fetch Transcripts**: `node scripts/youtube-transcripts.js --car-slug your-car-slug`
4. **AI Process**: `node scripts/youtube-ai-processing.js --car-slug your-car-slug`

---

## Pipeline Overview (Manual Reference)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CAR ADDITION PIPELINE                             │
│                                                                          │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│   │ Phase 1  │   │ Phase 2  │   │ Phase 3  │   │ Phase 4  │            │
│   │Selection │──▶│Core Data │──▶│Enrichment│──▶│ Research │            │
│   │~15 min   │   │ ~45 min  │   │ ~5 min   │   │ ~2 hours │            │
│   └──────────┘   └──────────┘   └──────────┘   └──────────┘            │
│        │                                             │                   │
│        ▼                                             ▼                   │
│   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐            │
│   │ Phase 5  │   │ Phase 6  │   │ Phase 7  │   │ Phase 8  │            │
│   │ Scoring  │◀──│  Media   │◀──│ YouTube  │◀──│   QA     │            │
│   │ ~30 min  │   │ ~15 min  │   │ ~10 min  │   │ ~20 min  │            │
│   └──────────┘   └──────────┘   └──────────┘   └──────────┘            │
│                                                                          │
│   Total Time Per Car: ~4 hours (new) / ~2 hours (batch w/ templates)    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Time Estimates

| Phase | Name | Time Estimate | Parallelizable? |
|-------|------|---------------|-----------------|
| 1 | Selection & Validation | 15 min | ❌ |
| 2 | Core Data Entry | 45 min | ✅ (batch entry) |
| 3 | Automated Enrichment | 5 min | ✅ (fully automated) |
| 4 | Manual Research | 2 hours | ✅ (split across team) |
| 5 | Scoring & Editorial | 30 min | ❌ (requires expertise) |
| 6 | Media | 15 min | ✅ |
| 7 | YouTube Enrichment | 10 min | ✅ (automated) |
| 8 | Validation & QA | 20 min | ✅ (automated checks) |

### Required Resources

| Phase | Resources Needed |
|-------|------------------|
| 1 | Access to car specs databases, existing car list |
| 2 | Supabase admin access, DATABASE.md reference |
| 3 | Server access (runs automatically) |
| 4 | OEM service manuals, enthusiast forums, owner reports |
| 5 | Automotive expertise, video reviews, driving experience |
| 6 | Image generation tools or licensed stock photos, Vercel Blob access |
| 7 | YouTube API access (automated via cron) |
| 8 | Access to all internal tools, staging environment |

---

## Phase 1: Selection & Validation

### Inclusion Criteria

AutoRev focuses on **sports and performance-oriented vehicles**. A car should meet at least 2 of these criteria:

| Criterion | Examples |
|-----------|----------|
| **Performance Focus** | Track-capable, sport suspension, high HP/weight ratio |
| **Enthusiast Community** | Active forums, aftermarket support, car club presence |
| **Driver Engagement** | Manual transmission available, RWD/AWD, analog feel |
| **Cultural Significance** | Magazine coverage, motorsport heritage, collector interest |
| **Price Tier Fit** | Budget ($15k-30k), Mid ($30k-60k), Upper-Mid ($60k-100k), Premium ($100k+) |

### Slug Naming Convention

Format: `{brand}-{model}-{generation}`

```
Examples:
- porsche-911-992          (Porsche 911, 992 generation)
- bmw-m3-g80               (BMW M3, G80 chassis code)
- toyota-gr86-zn8          (Toyota GR86, ZN8 chassis)
- mazda-mx5-nd             (Mazda MX-5, ND generation)
- ford-mustang-s650        (Ford Mustang, S650 platform)
- chevrolet-corvette-c8    (Corvette, C8 generation)
- nissan-z-z34             (Nissan Z, Z34 chassis)
```

**Rules:**
- All lowercase
- Hyphens between words (no spaces or underscores)
- Use chassis code or generation identifier when available
- Avoid year ranges in slug (put in `years` field instead)

### Duplicate Check Query

```sql
-- Run before adding any new car
SELECT slug, name, years, brand, category
FROM cars
WHERE 
  slug ILIKE '%{proposed-slug}%'
  OR name ILIKE '%{model-name}%'
  OR (brand = '{brand}' AND generation_code = '{generation}');
```

### Decision Checklist

- [ ] Car meets inclusion criteria (2+ checkmarks above)
- [ ] No duplicate exists in database
- [ ] Slug follows naming convention
- [ ] Generation/chassis code identified
- [ ] Production years confirmed
- [ ] Sufficient data available for research

---

## Phase 2: Core Data Entry

### Required Fields (18 columns)

These columns are NOT NULL and must be provided:

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `slug` | text | Unique identifier | `porsche-911-992` |
| `name` | text | Display name | `Porsche 911 (992)` |
| `years` | text | Production years | `2019-present` |
| `tier` | text | Price tier | `premium` |
| `category` | text | Engine layout | `Rear-Engine` |
| `engine` | text | Engine description | `3.0L Twin-Turbo Flat-6` |
| `hp` | integer | Peak horsepower | `379` |
| `trans` | text | Transmission | `8-speed PDK / 7-speed Manual` |
| `price_range` | text | Price bracket | `$100k-150k` |
| `price_avg` | integer | Average used price | `115000` |
| `notes` | text | Short description | `The quintessential sports car...` |
| `highlight` | text | Key selling point | `Perfect balance of daily usability and track capability` |
| `score_sound` | numeric | Sound score (1-10) | `8.5` |
| `score_interior` | numeric | Interior score (1-10) | `9.0` |
| `score_track` | numeric | Track score (1-10) | `8.5` |
| `score_reliability` | numeric | Reliability score (1-10) | `8.0` |
| `score_value` | numeric | Value score (1-10) | `6.5` |
| `score_driver_fun` | numeric | Driving fun score (1-10) | `9.0` |
| `score_aftermarket` | numeric | Aftermarket score (1-10) | `8.5` |

### Optional but Recommended Fields

| Column | Type | Description |
|--------|------|-------------|
| `brand` | text | Manufacturer name |
| `torque` | integer | Peak torque (lb-ft) |
| `curb_weight` | integer | Weight in lbs |
| `zero_to_sixty` | numeric | 0-60 time in seconds |
| `top_speed` | integer | Top speed in mph |
| `drivetrain` | text | RWD / AWD / FWD |
| `layout` | text | Engine position detail |
| `manual_available` | boolean | Manual transmission option |
| `msrp_new_low` | integer | New MSRP low |
| `msrp_new_high` | integer | New MSRP high |
| `generation_code` | text | Chassis/generation code |
| `country` | text | Country of manufacture |
| `seats` | integer | Number of seats |

### Tier Definitions

| Tier | Price Range | Examples |
|------|-------------|----------|
| `budget` | $15,000 - $30,000 | Miata ND, BRZ/GR86, Mustang EcoBoost |
| `mid` | $30,000 - $60,000 | Mustang GT, Camaro SS, Golf R |
| `upper-mid` | $60,000 - $100,000 | M3, C63, Supra, Cayman |
| `premium` | $100,000+ | 911, AMG GT, Corvette Z06 |

### Category Definitions

| Category | Description | Examples |
|----------|-------------|----------|
| `Front-Engine` | Engine ahead of cabin | M3, Mustang, Corvette (C7 and earlier) |
| `Mid-Engine` | Engine between axles | Cayman, Corvette C8, 4C |
| `Rear-Engine` | Engine behind rear axle | 911 (all generations) |

### SQL INSERT Template

```sql
INSERT INTO cars (
  slug, name, years, tier, category,
  engine, hp, torque, trans, drivetrain,
  curb_weight, zero_to_sixty, top_speed,
  price_range, price_avg, msrp_new_low, msrp_new_high,
  score_sound, score_interior, score_track,
  score_reliability, score_value, score_driver_fun, score_aftermarket,
  notes, highlight, brand, country, manual_available,
  generation_code, seats, layout
)
VALUES (
  'brand-model-generation',           -- slug
  'Brand Model (Generation)',          -- name
  '2020-present',                      -- years
  'tier-value',                        -- tier: budget, mid, upper-mid, premium
  'Category',                          -- category: Front-Engine, Mid-Engine, Rear-Engine
  'X.XL Engine Description',           -- engine
  000,                                 -- hp
  000,                                 -- torque
  'X-speed Type',                      -- trans
  'RWD',                               -- drivetrain: RWD, AWD, FWD
  0000,                                -- curb_weight
  0.0,                                 -- zero_to_sixty
  000,                                 -- top_speed
  '$XXk-$XXk',                         -- price_range
  00000,                               -- price_avg
  00000,                               -- msrp_new_low
  00000,                               -- msrp_new_high
  0.0, 0.0, 0.0,                       -- score_sound, score_interior, score_track
  0.0, 0.0, 0.0, 0.0,                  -- score_reliability, score_value, score_driver_fun, score_aftermarket
  'Brief description of the car...',   -- notes
  'Key selling point...',              -- highlight
  'Brand',                             -- brand
  'Country',                           -- country
  true,                                -- manual_available
  'XXX',                               -- generation_code
  2,                                   -- seats
  'Front-mid engine'                   -- layout
);
```

### JSON Template for Bulk Entry

See `templates/car-pipeline/car-template.json` for a complete JSON template.

---

## Phase 3: Automated Enrichment

Phase 3 calls external APIs to populate enrichment tables. This can be run automatically or manually.

### EPA Fuel Economy

**Endpoint:** `GET /api/cars/[slug]/fuel-economy`

**What it populates:** `car_fuel_economy` table

| Column | Description |
|--------|-------------|
| `city_mpg` | EPA city rating |
| `highway_mpg` | EPA highway rating |
| `combined_mpg` | EPA combined rating |
| `fuel_type` | Fuel type (Regular, Premium, Diesel) |
| `annual_fuel_cost` | Estimated annual cost |
| `co2_emissions` | CO2 g/mile |
| `ghg_score` | Greenhouse gas score (1-10) |
| `is_electric` | Boolean |
| `is_hybrid` | Boolean |
| `ev_range` | EV-only range (if hybrid/EV) |

**Run command:**
```bash
node scripts/car-pipeline/enrich-car.js <car-slug> --phase=3 --epa-only
```

### NHTSA Safety Ratings

**Endpoint:** `GET /api/cars/[slug]/safety`

**What it populates:** `car_safety_data` table

| Column | Description |
|--------|-------------|
| `nhtsa_overall_rating` | Overall star rating (1-5) |
| `nhtsa_front_crash_rating` | Front crash test rating |
| `nhtsa_side_crash_rating` | Side crash test rating |
| `nhtsa_rollover_rating` | Rollover resistance rating |
| `recall_count` | Number of recalls |
| `complaint_count` | Number of NHTSA complaints |
| `safety_score` | Computed safety score (0-100) |
| `safety_grade` | Letter grade (A-F) |

**Run command:**
```bash
node scripts/car-pipeline/enrich-car.js <car-slug> --phase=3 --safety-only
```

### NHTSA Recalls

**Endpoint:** `GET /api/cron/refresh-recalls?limitCars=1&carSlug=<slug>`

**What it populates:** `car_recalls` table

| Column | Description |
|--------|-------------|
| `campaign_number` | NHTSA campaign ID |
| `recall_date` | Date of recall |
| `component` | Affected component |
| `summary` | Recall description |
| `consequence` | Potential consequences |
| `remedy` | Recall remedy |
| `is_incomplete` | Recall completion status |

**Run command:**
```bash
node scripts/car-pipeline/enrich-car.js <car-slug> --phase=3 --recalls-only
```

### Run All Automated Enrichment

```bash
# Single car - all Phase 3 enrichment
node scripts/car-pipeline/enrich-car.js <car-slug> --phase=3

# Batch - process from file
node scripts/car-pipeline/batch-enrich.js slugs.txt --phase=3
```

---

## Phase 4: Manual Research

### Known Issues

**Table:** `car_issues`

**Research sources:**
- Enthusiast forums (Rennlist, Bimmerpost, MX5 Miata Forum, etc.)
- NHTSA complaint database
- Reddit r/cars, r/[brand] communities
- Long-term ownership reviews
- Technical Service Bulletins (TSBs)

**Required fields:**

| Column | Type | Description |
|--------|------|-------------|
| `car_slug` | text | Car identifier |
| `title` | text | Issue name |
| `kind` | text | mechanical, electrical, structural, cosmetic |
| `severity` | text | Critical, Major, Minor |
| `affected_years_text` | text | "2019-2021" or "All years" |
| `description` | text | Detailed description |
| `symptoms` | text[] | Array of symptoms |
| `prevention` | text | How to prevent/detect |
| `fix_description` | text | How to fix |
| `estimated_cost_text` | text | "$500-1000" |
| `source_url` | text | Citation |

**Minimum requirement:** At least 3 known issues per car

**INSERT template:**
```sql
INSERT INTO car_issues (
  car_slug, title, kind, severity, affected_years_text,
  description, symptoms, prevention, fix_description,
  estimated_cost_text, source_url
)
VALUES (
  'brand-model-generation',
  'Issue Title',
  'mechanical', -- mechanical, electrical, structural, cosmetic
  'Major',      -- Critical, Major, Minor
  '2019-2021',
  'Detailed description of the issue...',
  ARRAY['Symptom 1', 'Symptom 2'],
  'Prevention advice...',
  'Fix instructions...',
  '$500-1000',
  'https://forum-link-or-source'
);
```

### Maintenance Specs

**Table:** `vehicle_maintenance_specs` (130 columns)

**Research sources:**
- OEM owner's manual (PDF)
- OEM service manual
- Parts catalog (RealOEM, PartSouq, etc.)
- Dealership parts department

**Key sections to populate:**

| Section | Key Columns |
|---------|-------------|
| **Oil** | oil_type, oil_viscosity, oil_capacity_liters, oil_change_interval_miles |
| **Coolant** | coolant_type, coolant_color, coolant_capacity_liters |
| **Brake Fluid** | brake_fluid_type, brake_fluid_spec |
| **Transmission** | trans_fluid_manual, trans_fluid_auto, trans_fluid_change_interval_miles |
| **Differential** | diff_fluid_type, diff_fluid_front_capacity, diff_fluid_rear_capacity |
| **Fuel** | fuel_type, fuel_octane_minimum, fuel_octane_recommended, fuel_tank_capacity_gallons |
| **Tires** | tire_size_front, tire_size_rear, tire_pressure_front_psi, tire_pressure_rear_psi |
| **Wheels** | wheel_bolt_pattern, wheel_center_bore_mm, wheel_lug_torque_ft_lbs |
| **Brakes** | brake_front_rotor_diameter_mm, brake_rear_rotor_diameter_mm |
| **Spark Plugs** | spark_plug_type, spark_plug_gap_mm, spark_plug_change_interval_miles |
| **Belts/Timing** | timing_type, timing_change_interval_miles |
| **Battery** | battery_group_size, battery_cca, battery_location |

See `templates/car-pipeline/maintenance-specs-template.csv` for full template.

### Service Intervals

**Table:** `vehicle_service_intervals`

| Column | Type | Description |
|--------|------|-------------|
| `car_slug` | text | Car identifier |
| `service_name` | text | "Oil Change", "Brake Fluid Flush", etc. |
| `service_description` | text | What's involved |
| `interval_miles` | integer | Miles between service |
| `interval_months` | integer | Months between service |
| `dealer_cost_low` | integer | Dealer price low |
| `dealer_cost_high` | integer | Dealer price high |
| `diy_cost_low` | integer | DIY parts cost low |
| `diy_cost_high` | integer | DIY parts cost high |
| `is_critical` | boolean | Safety-critical service |

**Minimum requirement:** At least 5 service intervals per car

**Standard services to include:**
1. Oil Change
2. Brake Fluid Flush
3. Transmission Service
4. Differential Service
5. Coolant Flush
6. Spark Plug Replacement
7. Air Filter Replacement
8. Brake Pad/Rotor Replacement

### Car Variants

**Table:** `car_variants`

| Column | Type | Description |
|--------|------|-------------|
| `car_id` | uuid | FK to cars.id |
| `variant_key` | text | Unique key for VIN matching |
| `display_name` | text | "2020 911 Carrera S" |
| `model_year_start` | integer | First model year |
| `model_year_end` | integer | Last model year |
| `trim` | text | "Base", "S", "GT3", etc. |
| `drivetrain` | text | RWD, AWD |
| `transmission` | text | Manual, PDK, DCT |
| `engine` | text | Engine variant |

---

## Phase 5: Scoring & Editorial

### Score Rubric (1-10 Scale)

#### `score_sound` — Exhaust and Engine Sound

| Score | Definition |
|-------|------------|
| 10 | Legendary sound, goosebumps-inducing (911 GT3, LFA) |
| 9 | Exceptional character, makes you want to rev it (M3 S58, Flat-6 Porsches) |
| 8 | Great sound, distinctive character (V8 Mustang, Supra I6) |
| 7 | Good sound, above average for class (Golf R, Civic Type R) |
| 6 | Acceptable, unremarkable (Most modern turbo-4s) |
| 5 | Mediocre, needs exhaust to sound good |
| 4-1 | Poor to terrible (Overly muted, drone-prone) |

#### `score_interior` — Interior Quality & Ergonomics

| Score | Definition |
|-------|------------|
| 10 | Best-in-class materials, design, and tech (911 Turbo S, AMG GT) |
| 9 | Premium quality, excellent ergonomics (M3, Cayman GT4) |
| 8 | High quality, minor compromises (Supra, Golf R) |
| 7 | Good for the price, some cheap bits (Mustang GT, Camaro SS) |
| 6 | Acceptable, noticeable cost-cutting (BRZ/GR86, base Mustang) |
| 5 | Below average quality or ergonomics |
| 4-1 | Poor materials, bad layout, uncomfortable |

#### `score_track` — Track Capability

| Score | Definition |
|-------|------------|
| 10 | Race-car capable, podium potential (911 GT3 RS, AMG GT Black Series) |
| 9 | Track weapon, needs minimal prep (Cayman GT4, Corvette Z06) |
| 8 | Excellent track car, may need cooling upgrades (M3 Comp, Mustang GT350) |
| 7 | Good track capability, requires some prep (Supra, Golf R) |
| 6 | Can do track days, has limitations (BRZ, Miata, Mustang GT) |
| 5 | Basic track capability, heat issues likely |
| 4-1 | Not recommended for track use |

#### `score_reliability` — Long-term Dependability

| Score | Definition |
|-------|------------|
| 10 | Bulletproof, Toyota/Lexus tier |
| 9 | Excellent reliability, rare issues (Miata, BRZ) |
| 8 | Very good, minor known issues with fixes (Cayman, Mustang GT) |
| 7 | Good, some common issues to watch (M3, Golf R) |
| 6 | Average, requires diligent maintenance (AMG, older 911s) |
| 5 | Below average, known problem areas |
| 4-1 | Poor to unreliable, expensive failures |

#### `score_value` — Value Proposition

| Score | Definition |
|-------|------------|
| 10 | Incredible value, significantly underpriced (early ND Miata, FRS/BRZ) |
| 9 | Excellent value, punches above its price (GR86, Mustang GT) |
| 8 | Good value for what you get (Camaro SS, Supra) |
| 7 | Fair value, competitive pricing (M3, Cayman) |
| 6 | Slightly expensive, but justified (911 Carrera, AMG C63) |
| 5 | Expensive for what you get |
| 4-1 | Poor value, significantly overpriced |

#### `score_driver_fun` — Driving Engagement

| Score | Definition |
|-------|------------|
| 10 | Pure driving bliss, makes every drive an event (GT3, Miata, Lotus) |
| 9 | Exceptional engagement, communicative (Cayman GT4, M2) |
| 8 | Great fun factor, rewarding to drive (Supra, Mustang GT350) |
| 7 | Fun to drive, good feedback (Golf R, Camaro SS) |
| 6 | Enjoyable, some isolation from the road (M3, 911 Turbo) |
| 5 | Average engagement |
| 4-1 | Numb, disconnected driving experience |

#### `score_aftermarket` — Modification Support

| Score | Definition |
|-------|------------|
| 10 | Endless options, legendary aftermarket (Miata, Mustang, 911) |
| 9 | Excellent support, major brands (M3, WRX, BRZ) |
| 8 | Good selection, growing support (Supra, Golf R) |
| 7 | Decent options, may need to search (Cayman, Corvette) |
| 6 | Limited but available |
| 5 | Sparse aftermarket |
| 4-1 | Almost no aftermarket support |

### Strengths/Weaknesses Guidelines

**Strengths (`defining_strengths` JSONB):**
- List 3-5 genuine strengths
- Be specific, not generic
- Support with data where possible
- Format: `["Strength 1", "Strength 2", "Strength 3"]`

**Weaknesses (`honest_weaknesses` JSONB):**
- List 3-5 honest weaknesses
- Don't sugarcoat—enthusiasts appreciate honesty
- Acknowledge trade-offs of the design
- Format: `["Weakness 1", "Weakness 2", "Weakness 3"]`

### Alternatives Selection

**`direct_competitors` JSONB:** Cars at similar price/performance
**`if_you_want_more` JSONB:** Step-up options with more performance
**`if_you_want_less` JSONB:** Step-down options for budget-conscious
**`similar_driving_experience` JSONB:** Different price but similar feel

Format: Array of car slugs `["bmw-m3-g80", "mercedes-c63-w206"]`

---

## Phase 6: Media

### Image Requirements

| Attribute | Requirement |
|-----------|-------------|
| **Resolution** | Minimum 1920x1080 (HD) |
| **Aspect Ratio** | 16:9 preferred, 4:3 acceptable |
| **Format** | WebP preferred, JPEG/PNG acceptable |
| **File Size** | Under 500KB after optimization |
| **Style** | Clean background, 3/4 front angle preferred |
| **Lighting** | Well-lit, no harsh shadows |

### Vercel Blob Upload Process

1. **Generate or source image** meeting requirements above
2. **Optimize image** using squoosh.app or similar
3. **Upload to Vercel Blob:**
   ```javascript
   // Use Vercel Blob upload API
   const blob = await put(`cars/${slug}/hero.webp`, imageBuffer, {
     access: 'public',
     contentType: 'image/webp',
   });
   ```
4. **Update cars table:**
   ```sql
   UPDATE cars SET image_hero_url = 'blob-url' WHERE slug = 'car-slug';
   ```

### Image Naming Convention

```
cars/{car-slug}/hero.webp          -- Main hero image
cars/{car-slug}/gallery-01.webp    -- Gallery images
cars/{car-slug}/gallery-02.webp
cars/{car-slug}/interior.webp      -- Interior shot
cars/{car-slug}/engine.webp        -- Engine bay
```

### Gallery Images (Optional)

**`image_gallery` JSONB format:**
```json
[
  {"url": "https://...", "alt": "Front 3/4 view", "order": 1},
  {"url": "https://...", "alt": "Interior", "order": 2},
  {"url": "https://...", "alt": "Rear view", "order": 3}
]
```

---

## Phase 7: YouTube Enrichment

### Trusted Channels

Videos from these channels are auto-ingested with high credibility:

**Tier 1 (Highest Credibility):**
| Channel | Handle | Focus |
|---------|--------|-------|
| Throttle House | @ThrottleHouse | Reviews, comparisons, track tests |
| Savagegeese | @savagegeese | Deep-dive reviews, ownership |
| carwow | @carwow | Reviews, drag races |
| Top Gear | @TopGear | Reviews, track tests |
| MotorTrend | @MotorTrendWatch | Reviews, comparisons |
| Randy Pobst | @Randy_Pobst | Track tests |
| Cars with Miles | @CarswithMiles | Ownership, buying guides |

**Tier 2 (Good Credibility):**
| Channel | Handle | Focus |
|---------|--------|-------|
| Doug DeMuro | @DougDeMuro | Quirks and features |
| The Straight Pipes | @TheStraightPipes | Reviews |
| Engineering Explained | @EngineeringExplained | Technical education |
| Donut Media | @Donut | Education, reviews |
| Hagerty | @Hagerty | Buying guides, ownership |

### Queue Process

1. **Search YouTube** for car name + "review"
2. **Add to queue** in `youtube_ingestion_queue`:
   ```sql
   INSERT INTO youtube_ingestion_queue (video_id, video_url, target_car_slug, status, priority)
   VALUES ('videoId', 'https://youtube.com/watch?v=...', 'car-slug', 'pending', 1);
   ```
3. **Run enrichment cron** or wait for weekly cron:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" \
     "https://autorev.vercel.app/api/cron/youtube-enrichment"
   ```
4. **Verify links** in `youtube_video_car_links`

### Verification Checklist

- [ ] At least 2 videos linked to the car
- [ ] Videos have AI-generated summaries
- [ ] Pros/cons extracted correctly
- [ ] Car slug matches correctly in links

---

## Phase 8: Validation & QA

### Data Completeness Queries

```sql
-- Check required fields
SELECT slug, name,
  CASE WHEN hp IS NULL THEN '❌ missing hp' ELSE '✅' END as hp_check,
  CASE WHEN torque IS NULL THEN '❌ missing torque' ELSE '✅' END as torque_check,
  CASE WHEN price_avg IS NULL THEN '❌ missing price_avg' ELSE '✅' END as price_check,
  CASE WHEN zero_to_sixty IS NULL THEN '❌ missing 0-60' ELSE '✅' END as accel_check,
  CASE WHEN image_hero_url IS NULL THEN '❌ missing image' ELSE '✅' END as image_check
FROM cars WHERE slug = '<car-slug>';

-- Check enrichment tables
SELECT 
  c.slug,
  CASE WHEN fe.car_slug IS NULL THEN '❌ no fuel economy' ELSE '✅' END as fuel_check,
  CASE WHEN sd.car_slug IS NULL THEN '❌ no safety data' ELSE '✅' END as safety_check,
  CASE WHEN ms.car_slug IS NULL THEN '❌ no maintenance specs' ELSE '✅' END as maint_check
FROM cars c
LEFT JOIN car_fuel_economy fe ON c.slug = fe.car_slug
LEFT JOIN car_safety_data sd ON c.slug = sd.car_slug
LEFT JOIN vehicle_maintenance_specs ms ON c.slug = ms.car_slug
WHERE c.slug = '<car-slug>';

-- Check scores (should all be 1-10)
SELECT slug, name,
  score_sound, score_interior, score_track, score_reliability,
  score_value, score_driver_fun, score_aftermarket,
  CASE 
    WHEN score_sound IS NULL OR score_interior IS NULL OR score_track IS NULL
         OR score_reliability IS NULL OR score_value IS NULL 
         OR score_driver_fun IS NULL OR score_aftermarket IS NULL
    THEN '❌ missing scores'
    ELSE '✅ all scores present'
  END as scores_check
FROM cars WHERE slug = '<car-slug>';

-- Check known issues count (min 3)
SELECT c.slug, COUNT(ci.id) as issue_count,
  CASE WHEN COUNT(ci.id) < 3 THEN '⚠️ need more issues' ELSE '✅' END as issues_check
FROM cars c
LEFT JOIN car_issues ci ON c.slug = ci.car_slug
WHERE c.slug = '<car-slug>'
GROUP BY c.slug;

-- Check service intervals count (min 5)
SELECT c.slug, COUNT(si.id) as interval_count,
  CASE WHEN COUNT(si.id) < 5 THEN '⚠️ need more intervals' ELSE '✅' END as intervals_check
FROM cars c
LEFT JOIN vehicle_service_intervals si ON c.slug = si.car_slug
WHERE c.slug = '<car-slug>'
GROUP BY c.slug;

-- Check YouTube coverage
SELECT c.slug, COUNT(yl.id) as video_count,
  CASE WHEN COUNT(yl.id) < 2 THEN '⚠️ need more videos' ELSE '✅' END as videos_check
FROM cars c
LEFT JOIN youtube_video_car_links yl ON c.id = yl.car_id
WHERE c.slug = '<car-slug>'
GROUP BY c.slug;
```

### Page Render Checklist

- [ ] `/browse-cars/<slug>` loads without errors
- [ ] Hero image displays correctly
- [ ] All tabs render (Overview, Buying, Ownership, Expert Reviews)
- [ ] Scores display with correct values
- [ ] Known issues section populated
- [ ] Maintenance specs section populated
- [ ] Expert reviews tab shows videos (if available)

### AL Assistant Test Queries

Test these queries in AL to verify data access:

1. `"Tell me about the [car name]"` - Should return comprehensive overview
2. `"What are known issues with the [car name]?"` - Should list issues from DB
3. `"What's the maintenance schedule for [car name]?"` - Should show intervals
4. `"How reliable is the [car name]?"` - Should cite reliability score and issues

### Search/Filter Verification

- [ ] Car appears in `/browse-cars` list
- [ ] Car appears when filtering by its tier
- [ ] Car appears when filtering by its brand
- [ ] Car appears when filtering by its category
- [ ] Car appears in search results

### Mobile Checklist

- [ ] Page loads on mobile
- [ ] Images display correctly
- [ ] Tabs are accessible
- [ ] Text is readable
- [ ] No horizontal scrolling issues

---

## SQL Templates

### Complete Car INSERT

```sql
-- 1. Insert car
INSERT INTO cars (
  slug, name, years, tier, category, brand, country,
  engine, hp, torque, trans, drivetrain, layout,
  curb_weight, zero_to_sixty, top_speed, quarter_mile,
  price_range, price_avg, msrp_new_low, msrp_new_high,
  score_sound, score_interior, score_track,
  score_reliability, score_value, score_driver_fun, score_aftermarket,
  notes, highlight, tagline, hero_blurb,
  manual_available, seats, generation_code,
  defining_strengths, honest_weaknesses,
  direct_competitors, if_you_want_more, if_you_want_less
)
VALUES (
  -- Core identity
  'brand-model-gen',
  'Display Name',
  '2020-present',
  'tier',        -- budget, mid, upper-mid, premium
  'Category',    -- Front-Engine, Mid-Engine, Rear-Engine
  'Brand',
  'Country',
  
  -- Performance
  'Engine Description',
  000,           -- hp
  000,           -- torque
  'Transmission',
  'RWD',         -- drivetrain
  'layout',
  0000,          -- curb_weight
  0.0,           -- zero_to_sixty
  000,           -- top_speed
  0.0,           -- quarter_mile
  
  -- Pricing
  '$XXk-$XXk',
  00000,         -- price_avg
  00000,         -- msrp_new_low
  00000,         -- msrp_new_high
  
  -- Scores (1-10)
  0.0,           -- score_sound
  0.0,           -- score_interior
  0.0,           -- score_track
  0.0,           -- score_reliability
  0.0,           -- score_value
  0.0,           -- score_driver_fun
  0.0,           -- score_aftermarket
  
  -- Editorial
  'Notes...',
  'Highlight...',
  'Tagline...',
  'Hero blurb...',
  
  -- Options
  true,          -- manual_available
  2,             -- seats
  'GEN',         -- generation_code
  
  -- Arrays
  '["Strength 1", "Strength 2", "Strength 3"]'::jsonb,
  '["Weakness 1", "Weakness 2"]'::jsonb,
  '["competitor-slug-1", "competitor-slug-2"]'::jsonb,
  '["upgrade-slug"]'::jsonb,
  '["budget-slug"]'::jsonb
);

-- 2. Get the car ID for related inserts
-- SELECT id FROM cars WHERE slug = 'brand-model-gen';
```

### Car Variants INSERT

```sql
INSERT INTO car_variants (
  car_id, variant_key, display_name,
  model_year_start, model_year_end,
  trim, drivetrain, transmission, engine
)
VALUES (
  (SELECT id FROM cars WHERE slug = 'brand-model-gen'),
  'brand-model-gen-2020-base',
  '2020 Brand Model Base',
  2020, 2022,
  'Base', 'RWD', 'Manual', '2.0L I4'
);
```

### Car Issues INSERT

```sql
INSERT INTO car_issues (
  car_slug, title, kind, severity, affected_years_text,
  description, symptoms, prevention, fix_description,
  estimated_cost_text, source_url
)
VALUES
  ('brand-model-gen', 'Issue Title 1', 'mechanical', 'Major', '2020-2021',
   'Description...', ARRAY['Symptom 1'], 'Prevention...', 'Fix...',
   '$500-1000', 'https://source.com'),
  ('brand-model-gen', 'Issue Title 2', 'electrical', 'Minor', 'All years',
   'Description...', ARRAY['Symptom 1', 'Symptom 2'], 'Prevention...', 'Fix...',
   '$200-400', 'https://source.com');
```

### Service Intervals INSERT

```sql
INSERT INTO vehicle_service_intervals (
  car_slug, service_name, service_description,
  interval_miles, interval_months,
  dealer_cost_low, dealer_cost_high, diy_cost_low, diy_cost_high,
  is_critical
)
VALUES
  ('brand-model-gen', 'Oil Change', 'Full synthetic oil and filter change',
   10000, 12, 150, 250, 50, 80, true),
  ('brand-model-gen', 'Brake Fluid Flush', 'Complete brake fluid replacement',
   30000, 24, 150, 200, 30, 50, true),
  ('brand-model-gen', 'Transmission Service', 'Fluid change/flush',
   60000, NULL, 300, 500, 100, 150, false),
  ('brand-model-gen', 'Coolant Flush', 'Complete coolant replacement',
   60000, 48, 150, 250, 40, 60, false),
  ('brand-model-gen', 'Spark Plugs', 'Replace all spark plugs',
   60000, NULL, 200, 400, 50, 100, false);
```

---

## Batch Processing

### Processing 10+ Cars Efficiently

**Recommended workflow:**

1. **Prepare batch file:** Create `batch-cars.json` with all car data
2. **Bulk insert:** Use transaction for atomicity
3. **Parallel enrichment:** Run Phase 3 with concurrency
4. **Divide research:** Assign Phase 4 tasks across team
5. **Score workshop:** Group scoring session for consistency
6. **Batch validation:** Run validation queries on all new cars

### Parallel vs Sequential

| Task | Recommendation | Reason |
|------|----------------|--------|
| Core data entry | Sequential or Batch | Need consistency, avoid duplicates |
| EPA/NHTSA enrichment | Parallel (3-5 concurrent) | Independent API calls |
| Known issues research | Parallel | Can divide by car |
| Maintenance specs | Parallel | Can divide by car |
| Scoring | Sequential | Needs consistent calibration |
| Media generation | Parallel | Independent per car |
| YouTube queue | Batch then parallel | Queue first, then process |
| Validation | Parallel | Independent queries |

### Progress Tracking

Use `/internal/car-pipeline` dashboard to:
- Create pipeline runs for each car
- Track phase completion
- View batch progress at a glance
- Identify blocked cars
- Export completion reports

---

## Appendix: Complete Column Reference

### Cars Table (139 columns)

See DATABASE.md for the complete schema. Key column groups:

| Group | Columns |
|-------|---------|
| Identity | id, slug, name, years, brand, country, generation_code |
| Specs | engine, hp, torque, curb_weight, zero_to_sixty, top_speed, drivetrain, layout |
| Performance | perf_power_accel, perf_grip_cornering, perf_braking, perf_track_pace |
| Pricing | price_range, price_avg, msrp_new_low, msrp_new_high |
| Scores | score_sound, score_interior, score_track, score_reliability, score_value, score_driver_fun, score_aftermarket |
| Editorial | notes, highlight, tagline, hero_blurb, essence, heritage |
| Arrays | pros, cons, best_for, defining_strengths, honest_weaknesses |
| Media | image_hero_url, image_gallery, video_url |
| Search | search_vector, ai_searchable_text, embedding |

---

*Last verified against DATABASE.md December 21, 2024*

