# Database Expansion Strategy for My Garage Trust Signals

> **Purpose:** Build out real data to back honest trust signals in My Garage
> **Timeline:** 1-2 weeks
> **Created:** January 20, 2026

---

## Current Data Gaps (Audit Results)

| Data Type | Current | Target | Gap |
|-----------|---------|--------|-----|
| Cars with upgrade recommendations | 123 (40%) | 250 (80%) | 127 cars |
| Cars with platform strengths/weaknesses | 83 (27%) | 200 (65%) | 117 cars |
| Cars with part fitments (5+) | 20 | 100 | 80 cars |
| Cars with dyno data | 25 (8%) | 75 (25%) | 50 cars |
| Community insights coverage | 12 cars | 50 cars | 38 cars |

---

## Priority Cars (Top 50 for Enrichment)

Sorted by: issue_count (popularity proxy) + youtube_count (content available)

### Tier 1: High Priority (20 cars) - Must Complete

These cars have high issue counts (popular) but missing tuning data:

| Car | Issues | YouTube | Fitments | Power Mods | Has Insights |
|-----|--------|---------|----------|------------|--------------|
| Camaro SS 1LE | 332 | 2 | 5 | 0 | NO |
| Corvette C5 Z06 | 274 | 5 | 5 | 0 | NO |
| Charger SRT 392 | 270 | 3 | 5 | 0 | NO |
| Camaro SS LS1 | 232 | 28 | 0 | 0 | NO |
| Corvette C6 Grand Sport | 176 | 2 | 5 | 0 | NO |
| BMW Z4 M | 127 | 2 | 5 | 0 | NO |
| Corvette C6 Z06 | 81 | 26 | 5 | 0 | NO |
| Focus RS | 84 | 10 | 5 | 0 | NO |
| Audi S4 B6 | 79 | 7 | 0 | 0 | NO |
| BMW M3 E36 | 76 | 41 | 0 | 0 | NO |
| Audi S5 B9 | 76 | 5 | 0 | 0 | NO |
| BMW M3 E46 | 68 | 4 | 5 | 0 | NO |
| BMW M5 E39 | 63 | 4 | 5 | 0 | NO |
| Audi S4 B8 | 61 | 8 | 0 | 0 | NO |
| BMW M5 E60 | 60 | 2 | 5 | 0 | NO |
| Corvette C8 Z06 | 55 | 8 | 0 | 0 | NO |
| Audi S4 B7 | 49 | 10 | 0 | 0 | NO |
| Honda S2000 | 31 | 18 | 5 | 0 | NO |
| Mustang SVT Cobra | 31 | 3 | 0 | 0 | NO |
| BMW M4 F82 | 43 | 3 | 5 | 0 | NO |

### Tier 2: Medium Priority (15 cars) - Should Complete

| Car | Issues | YouTube | Notes |
|-----|--------|---------|-------|
| Challenger SRT 392 | 69 | 6 | Has HP mods, needs insights |
| 350Z | 37 | 22 | Good YT coverage |
| MX-5 NB | 31 | 2 | Needs tuning data |
| Lotus Elise S2 | 31 | 2 | Niche but important |
| Dodge Viper | 30 | 22 | Good YT, needs mods |
| M5 F90 | 29 | 4 | Modern BMW gap |
| RX-7 FD3S | 28 | 57 | Great YT, needs mods |
| Toyota GR86 | - | - | Popular modern car |
| Toyota Supra A90 | - | - | Popular modern car |
| Hyundai Elantra N | - | - | New enthusiast car |
| Subaru BRZ (2nd gen) | - | - | Popular platform |
| BMW M2 G87 | - | - | Current darling |
| Nissan Z | - | - | New platform |
| Honda Civic Type R FL5 | 81 | 10 | Has some data |
| Mustang GT S650 | - | - | Current gen |

### Tier 3: Fill Gaps (15 cars)

Remaining popular cars without complete data.

---

## Phase 1: AI-Powered Tuning Research (Days 1-3)

Use existing `ai-research-tuning.mjs` script to populate:
- `upgrades_by_objective` (power, handling, braking, cooling, sound, aero)
- `platform_insights` (strengths, weaknesses, community_tips)
- `tuning_platforms` (COBB, APR, Hondata, etc.)
- `power_limits` (stock turbo, stock fuel, stock trans limits)

### Command to Run

```bash
# Run for each Tier 1 car
node scripts/tuning-pipeline/ai-research-tuning.mjs --slug camaro-ss-1le
node scripts/tuning-pipeline/ai-research-tuning.mjs --slug chevrolet-corvette-c5-z06
# ... etc for all 20 Tier 1 cars

# Or create batch script
node scripts/tuning-pipeline/batch-ai-research.mjs --tier 1
```

### Expected Output Per Car

```json
{
  "upgrades_by_objective": {
    "power": [
      { "name": "Cold Air Intake", "gains": { "hp": { "low": 8, "high": 15 } }, "cost": { "low": 250, "high": 400 }, "brands": ["K&N", "AFE", "Injen"] },
      { "name": "Catback Exhaust", "gains": { "hp": { "low": 10, "high": 20 } }, "cost": { "low": 800, "high": 1500 }, "brands": ["Borla", "Corsa", "MagnaFlow"] }
    ],
    "handling": [...],
    "braking": [...],
    "cooling": [...],
    "sound": [...],
    "aero": [...]
  },
  "platform_insights": {
    "strengths": ["LS3 engine reliability", "Excellent weight distribution", "Strong aftermarket support"],
    "weaknesses": ["Rear suspension geometry limits grip", "Stock brakes fade on track", "Cooling capacity at limit"],
    "community_tips": ["Upgrade brake fluid before track use", "LS swaps from C6 Z06 common"]
  }
}
```

### Script Enhancement: Batch Processing

Create `scripts/tuning-pipeline/batch-ai-research.mjs`:

```javascript
#!/usr/bin/env node
/**
 * Batch AI Research for Tuning Profiles
 * 
 * Processes multiple cars through ai-research-tuning.mjs
 * 
 * Usage:
 *   node batch-ai-research.mjs --tier 1 --dry-run
 *   node batch-ai-research.mjs --tier 1 --limit 5
 *   node batch-ai-research.mjs --slugs camaro-ss-1le,corvette-c5-z06
 */

const TIER_1_SLUGS = [
  'camaro-ss-1le',
  'chevrolet-corvette-c5-z06',
  'dodge-charger-srt-392',
  'chevrolet-camaro-ss-ls1',
  'chevrolet-corvette-c6-grand-sport',
  'bmw-z4m-e85-e86',
  'chevrolet-corvette-c6-z06',
  'ford-focus-rs',
  'audi-s4-b6',
  'bmw-m3-e36',
  'audi-s5-b9',
  'bmw-m3-e46',
  'bmw-m5-e39',
  'audi-s4-b8',
  'bmw-m5-e60',
  'chevrolet-corvette-z06-c8',
  'audi-s4-b7',
  'honda-s2000',
  'ford-mustang-svt-cobra-sn95',
  'bmw-m4-f82'
];

// Rate limit: 1 car per 5 seconds to avoid API limits
```

---

## Phase 2: YouTube Insights Extraction (Days 2-4)

Many cars have YouTube videos but insights haven't been extracted to `platform_insights.youtube_insights`.

### Cars with 10+ Videos Needing Extraction

```sql
SELECT c.slug, c.name, COUNT(yv.id) as video_count
FROM cars c
JOIN youtube_video_car_links yv ON yv.car_id = c.id
LEFT JOIN car_tuning_profiles ctp ON ctp.car_id = c.id
WHERE ctp.platform_insights->'youtube_insights'->'key_points' IS NULL
GROUP BY c.slug, c.name
HAVING COUNT(yv.id) >= 10
ORDER BY COUNT(yv.id) DESC;
```

### Command to Run

```bash
# Process YouTube insights for cars with videos
node scripts/tuning-pipeline/consolidate-tuning-data.mjs --extract-youtube --limit 50

# Or use the youtube pipeline directly
node scripts/youtube-pipeline.js --step ai --limit 50
```

---

## Phase 3: Parts Fitment Expansion (Days 3-5)

Current state: VW GTI has 161 fitments, most cars have <5.

### Strategy

1. **Use existing `expandFitments.mjs`** to infer fitments from product tags
2. **Prioritize cars by popularity** (Tier 1 first)
3. **Focus on universal upgrade categories** that apply broadly:
   - Brake pads (Hawk, StopTech, EBC)
   - Coilovers (KW, Bilstein, BC Racing)
   - Exhaust (Borla, MagnaFlow, Akrapovic)
   - Wheels (common sizes)

### Command to Run

```bash
# Expand fitments for priority cars
node scripts/expandFitments.mjs --priority=1 --verbose
node scripts/expandFitments.mjs --priority=2 --limit=200

# For specific cars
node scripts/expandFitments.mjs --car=bmw-m3-e46 --verbose
```

### Enhancement: Add New Parts Sources

Consider adding vendor adapters for:
- Turner Motorsport (BMW)
- ECS Tuning (broader VW/Audi/BMW/Porsche)
- FTSpeed / MAPerformance (Subaru, Evo)
- AmericanMuscle (Mustang)
- Lethal Performance (Mopar muscle)

---

## Phase 4: Dyno Data Seeding (Days 4-6)

Current: 29 dyno runs for 25 cars. Target: 150+ runs for 75+ cars.

### Data Sources

1. **Forum scraping** (existing `forum-dyno-scraper.mjs`)
2. **AI-estimated baselines** from manufacturer specs
3. **Tuner website data** (public dyno results)

### Estimated Baseline Dyno Script

Create `scripts/seedDynoBaselines.mjs`:

```javascript
/**
 * Seed estimated baseline dyno runs for cars missing data.
 * Uses manufacturer specs with typical drivetrain loss factors.
 */

// Drivetrain loss factors (crank HP to wheel HP)
const DRIVETRAIN_LOSS = {
  RWD: 0.15,  // 15% loss
  AWD: 0.20,  // 20% loss  
  FWD: 0.12,  // 12% loss
};

// For each car without dyno data, create estimated baseline
async function seedBaseline(car) {
  const loss = DRIVETRAIN_LOSS[car.drivetrain] || 0.15;
  const estimatedWhp = Math.round(car.hp * (1 - loss));
  const estimatedWtq = Math.round(car.torque * (1 - loss));
  
  return {
    car_id: car.id,
    run_kind: 'baseline',
    dyno_type: 'estimated',
    peak_whp: estimatedWhp,
    peak_wtq: estimatedWtq,
    fuel: 'pump_93',
    modifications: 'stock',
    notes: 'Estimated from manufacturer specs with typical drivetrain loss',
    verified: false,
    source: 'autorev_estimation'
  };
}
```

---

## Phase 5: Community Insights Expansion (Days 5-7)

Current: 1,252 insights covering ~12 cars. Target: 50 cars.

### Strategy

Use existing forum intelligence pipeline with AI to extract insights from:
- Reddit threads (/r/cars, /r/WRX, /r/BMW, etc.)
- Enthusiast forums (e30tech, MX5Miata, etc.)
- Our existing YouTube transcripts

### Command

```bash
# Run insight extraction for priority cars
node scripts/run-insight-extraction.js --car-slugs "camaro-ss-1le,corvette-c6-z06" --limit 50
```

---

## Execution Schedule

| Day | Phase | Cars | Expected Results |
|-----|-------|------|------------------|
| 1 | AI Research (Tier 1 batch 1) | 10 cars | +10 upgrade profiles |
| 2 | AI Research (Tier 1 batch 2) | 10 cars | +10 upgrade profiles |
| 2 | YouTube Insights | 20 cars | +20 with YT insights |
| 3 | AI Research (Tier 2) | 15 cars | +15 upgrade profiles |
| 3-4 | Parts Fitment Expansion | 30 cars | +500 fitments |
| 4-5 | Dyno Baselines | 50 cars | +50 baseline runs |
| 5-7 | Community Insights | 30 cars | +300 insights |

---

## Success Metrics

After completion, we can honestly claim:

| Trust Signal | Before | After | Claim |
|--------------|--------|-------|-------|
| "Upgrade recommendations" | 40% | 80% | "Curated upgrades for 250+ cars" |
| "Platform insights" | 27% | 65% | "Expert insights for your platform" |
| "Parts that fit" | 20 cars | 100 cars | "Verified fitments for popular cars" |
| "Based on dyno data" | 8% | 25% | "75 cars with dyno verification" |
| "Community validated" | 12 cars | 50 cars | "Real owner feedback" |

---

## Scripts to Create

1. `scripts/tuning-pipeline/batch-ai-research.mjs` - Batch process AI research
2. `scripts/seedDynoBaselines.mjs` - Seed estimated dyno baselines
3. `scripts/expansion-progress.mjs` - Track expansion progress

---

## Validation Queries

After expansion, run these to verify:

```sql
-- Verify upgrade coverage
SELECT 
  COUNT(*) FILTER (WHERE jsonb_array_length(COALESCE(upgrades_by_objective->'power', '[]')) > 0) as has_power,
  COUNT(*) FILTER (WHERE platform_insights->'strengths' IS NOT NULL AND platform_insights->'strengths'::text != '[]') as has_strengths,
  COUNT(*) as total
FROM car_tuning_profiles;

-- Verify parts coverage
SELECT 
  COUNT(DISTINCT car_id) FILTER (WHERE fitment_count >= 5) as cars_with_5plus,
  COUNT(DISTINCT car_id) as total_cars
FROM (
  SELECT car_id, COUNT(*) as fitment_count 
  FROM part_fitments 
  GROUP BY car_id
) sub;

-- Verify dyno coverage
SELECT COUNT(DISTINCT car_id) FROM car_dyno_runs;
```

---

## Brand Guidelines Reminder

When showing this data in UI:

- **Lime (#d4ff00)**: CTAs only ("Start Build", "Add Vehicle")
- **Teal (#10b981)**: Positive data (HP gains, verified counts)
- **Blue (#3b82f6)**: Baseline/stock values
- **White/Secondary**: Neutral badges, data counts
- **NEVER** show a trust signal for data that doesn't exist
