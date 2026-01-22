# Future Performance Model

> **Status:** 🚧 IN DEVELOPMENT - Not yet in production  
> **Target:** Replace legacy hardcoded calculator with data-driven hybrid model  
> **Risk Level:** Zero - runs in parallel, feature-flagged

---

## Executive Summary

The **Future Performance Model** is a hybrid physics + calibration system that calculates HP gains and performance metrics using:

1. **Real dyno data** from forums and verified sources
2. **Engine family calibration** learned from similar cars
3. **Physics-based estimates** as a fallback
4. **Confidence scores** so users know how reliable predictions are

This replaces the current hardcoded approach (e.g., "Stage 1 tune = 70 HP for all turbo cars") with dynamic, data-driven calculations that improve over time.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER SELECTS UPGRADES                         │
│                  (GTI + Stage 1 + Intake)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE CALCULATOR V2                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TIER 1: VERIFIED DATA (95% confidence)                         │
│  ────────────────────────────────────────                       │
│  Check verified_mod_results for exact car + mod combo           │
│  → Found 12 verified dynos → Use average: +87 HP                │
│                                                                  │
│  TIER 2: ENGINE FAMILY (75% confidence)                         │
│  ────────────────────────────────────────                       │
│  Check calibration for EA888 Gen3 + stage1-tune                 │
│  → 47 dynos show 18.5% avg gain → 228 HP × 18.5% = +42 HP       │
│                                                                  │
│  TIER 3: PHYSICS MODEL (60% confidence)                         │
│  ────────────────────────────────────────                       │
│  Calculate from engine characteristics                          │
│  → Turbo I4 + 4 PSI boost increase → ~18% gain                  │
│                                                                  │
│  TIER 4: GENERIC FALLBACK (45% confidence)                      │
│  ────────────────────────────────────────                       │
│  Use hardcoded value from upgrade definition                    │
│  → metricChanges.hpGain = 70 HP                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         OUTPUT                                   │
│                                                                  │
│  Projected HP: 315 (+87 HP)                                     │
│  Confidence: High (based on 12 verified dynos)                  │
│  0-60: 5.9s → 5.1s (-0.8s)                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Forum Scraping → Calibration

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   FORUMS     │     │   SCRAPER    │     │  EXTRACTIONS │
│              │────▶│              │────▶│    TABLE     │
│ VWVortex     │     │ Exa Search + │     │              │
│ M3Post       │     │ Claude Parse │     │ status:      │
│ Mustang6G    │     │              │     │ 'pending'    │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
                                          ┌──────────────┐
                                          │   REVIEW &   │
                                          │   VERIFY     │
                                          │              │
                                          │ Human/AI     │
                                          │ validation   │
                                          └──────────────┘
                                                 │
                            ┌────────────────────┼────────────────────┐
                            ▼                    ▼                    ▼
                     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
                     │ car_dyno_    │     │ verified_    │     │ performance_ │
                     │ runs         │     │ mod_results  │     │ calibration  │
                     │              │     │              │     │              │
                     │ Full dyno    │     │ Car + mods   │     │ Correction   │
                     │ curves       │     │ = HP result  │     │ factors      │
                     └──────────────┘     └──────────────┘     └──────────────┘
                                                                     │
                                                                     ▼
                                                              ┌──────────────┐
                                                              │ CALCULATOR   │
                                                              │ V2           │
                                                              │              │
                                                              │ Uses learned │
                                                              │ calibration  │
                                                              └──────────────┘
```

---

## Database Schema

### New Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `engine_families` | Normalized engine platforms with physics params | `family_code`, `aspiration`, `volumetric_efficiency_stock`, `boost_headroom_psi` |
| `performance_calibration` | Learned correction factors per engine family | `engine_family_id`, `upgrade_category`, `base_gain_percent`, `correction_factor`, `sample_size` |
| `verified_mod_results` | Cached verified car + mod combinations | `car_id`, `mod_combination`, `stock_whp`, `modded_whp`, `confidence` |
| `dyno_data_sources` | Forum sources we scrape from | `source_name`, `base_url`, `primary_makes`, `engine_families` |
| `forum_dyno_extractions` | Raw scraped data (pending verification) | `source_url`, `extracted_car_text`, `extracted_mods_text`, `extracted_modded_whp`, `status` |

### New Column on `cars`

```sql
ALTER TABLE cars ADD COLUMN engine_family_id UUID REFERENCES engine_families(id);
```

---

## File Structure

```
lib/
├── performanceCalculatorV2.js    # Main unified calculator (NEW)
├── performancePhysics.js         # Physics equations (NEW)
├── performanceModelComparison.js # Compare V1 vs V2 (NEW)
├── performance.js                # Legacy calculator (UNCHANGED)
├── upgradeCalculator.js          # Legacy calculator (UNCHANGED)
└── upgrades.js                   # Legacy calculator (UNCHANGED)

scripts/
├── map-engine-families.mjs       # Map cars to engine families (NEW)
├── forum-dyno-scraper.mjs        # Scrape dyno data from forums (NEW)
└── compare-performance-models.mjs # CLI comparison tool (NEW)

app/api/v2/
└── performance/route.js          # V2 API endpoint (NEW)

supabase/migrations/
└── 099_performance_calculator_foundation.sql  # All new tables (NEW)
```

---

## Engine Families

We've seeded 30 common engine families:

| Family Code | Display Name | Aspiration | Common Cars |
|-------------|--------------|------------|-------------|
| `EA888_Gen3` | VW EA888 Gen3 (2.0T) | Turbo | GTI MK7+, Golf R, A3/S3 |
| `EA855_RS3` | Audi 2.5T 5-cyl | Turbo | RS3, TTRS |
| `B58` | BMW B58 (3.0T) | Turbo | Supra, M340i, Z4 M40i |
| `S55` | BMW S55 (3.0TT) | TwinTurbo | M3 F80, M4 F82 |
| `Coyote_Gen3` | Ford Coyote Gen3 (5.0) | NA | Mustang GT 2018+ |
| `Voodoo` | Ford Voodoo (5.2 FPC) | NA | GT350 |
| `LT1_Gen5` | GM LT1 Gen5 (6.2) | NA | C7 Corvette, Camaro SS |
| `Hellcat` | Chrysler Hellcat (6.2 SC) | Supercharged | Hellcat, Demon |
| `K20C1` | Honda K20C1 (2.0T) | Turbo | Civic Type R |
| `VR38DETT` | Nissan VR38DETT (3.8TT) | TwinTurbo | GT-R R35 |

See full list in migration file.

---

## Calibration System

### How Calibration Works

1. **Physics model provides baseline** (e.g., "Stage 1 tune = 18% HP gain for turbo cars")
2. **Real dyno data teaches correction** (e.g., "EA888 cars actually average 22% gain")
3. **Correction factor is stored** (e.g., `correction_factor = 1.22`)
4. **Future predictions use corrected formula** (`base × correction = result`)

### Auto-Calibration Trigger

When verified data is added to `verified_mod_results`, a database trigger automatically recalculates the correction factors:

```sql
CREATE TRIGGER trigger_update_calibration
  AFTER INSERT OR UPDATE OF verified ON verified_mod_results
  FOR EACH ROW
  EXECUTE FUNCTION update_performance_calibration();
```

---

## Usage

### CLI: Compare Models

```bash
# Compare Stage 1 tune across popular cars
node scripts/compare-performance-models.mjs

# Test specific car
node scripts/compare-performance-models.mjs --car=volkswagen-gti-mk7

# Run full test suite
node scripts/compare-performance-models.mjs --test-suite
```

### CLI: Map Engine Families

```bash
# Dry run - see what would be mapped
node scripts/map-engine-families.mjs --dry-run

# Actually map cars to engine families
node scripts/map-engine-families.mjs
```

### CLI: Scrape Forum Data

```bash
# Scrape specific source
node scripts/forum-dyno-scraper.mjs --source=vwvortex --limit=50

# Scrape for specific engine family
node scripts/forum-dyno-scraper.mjs --engine-family=EA888_Gen3 --limit=100
```

### API: Calculate Performance

```bash
# POST /api/v2/performance
curl -X POST http://localhost:3000/api/v2/performance \
  -H "Content-Type: application/json" \
  -d '{
    "carSlug": "volkswagen-gti-mk7",
    "upgrades": ["stage1-tune", "intake", "downpipe"]
  }'

# GET /api/v2/performance/compare
curl "http://localhost:3000/api/v2/performance/compare?carSlug=volkswagen-gti-mk7&upgrades=stage1-tune,intake"
```

---

## Migration Plan

### Phase 1: Foundation (COMPLETE)
- [x] Create database schema
- [x] Build V2 calculator
- [x] Build comparison tools
- [x] Create API endpoint

### Phase 2: Data Collection
- [ ] Run migration to create tables
- [ ] Map cars to engine families
- [ ] Begin forum scraping
- [ ] Review and verify extractions

### Phase 3: Calibration
- [ ] Accumulate 100+ verified dyno results per major engine family
- [ ] Validate V2 predictions against real data
- [ ] Tune physics model parameters

### Phase 4: Rollout
- [ ] Enable feature flag for beta users
- [ ] A/B test V1 vs V2 in production
- [ ] Full rollout when V2 accuracy exceeds V1

### Phase 5: Cleanup
- [ ] Deprecate legacy calculators
- [ ] Remove feature flag
- [ ] Archive old code

---

## Confidence Scoring

| Tier | Confidence | Label | Source |
|------|------------|-------|--------|
| 1 | 90-99% | Verified | Exact car + mod combo with verified dyno |
| 2 | 70-85% | High | Engine family calibration with 10+ samples |
| 3 | 55-70% | Estimated | Physics model with engine characteristics |
| 4 | 40-50% | Approximate | Generic upgrade definition |

Users see confidence in UI:
- **"Verified"** - We have real dyno data for this exact build
- **"High confidence"** - Based on similar builds with this engine
- **"Estimated"** - Physics-based calculation
- **"Approximate"** - Generic estimate

---

## Key Advantages Over Legacy System

| Aspect | Legacy (V1) | Future (V2) |
|--------|-------------|-------------|
| HP gains | Hardcoded per upgrade | Learned from real data |
| Engine awareness | Basic (Turbo/NA/SC) | 30+ specific platforms |
| Accuracy | ±30% typical | ±10% with calibration |
| Improvement | Requires code changes | Auto-improves with data |
| Transparency | No confidence info | Shows confidence + source |
| Diminishing returns | Basic category caps | Physics-based stacking |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| V2 produces worse results | Feature flag allows instant rollback |
| Forum data is unreliable | Multi-stage verification process |
| Engine family mapping errors | Dry-run mode, manual review |
| Performance regression | Comparison tool validates before switch |

---

## Questions?

Contact the AutoRev engineering team or see:
- `lib/performanceCalculatorV2.js` - Main calculator code
- `supabase/migrations/099_*` - Database schema
- `scripts/compare-performance-models.mjs` - Validation tool
