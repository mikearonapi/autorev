# Full Database Audit Report
## Date: 2026-01-11

## Executive Summary

**CRITICAL FINDING: Widespread data contamination detected across the database.**

The tuning profile enrichment pipeline has applied incorrect engine family data to vehicles, causing them to display wrong tuning information.

### Impact Summary

| Issue Category | Count | Severity |
|----------------|-------|----------|
| **Contaminated tuning profiles** | 48 | 🔴 CRITICAL |
| **Wrong manual_available** | 9+ | 🔴 CRITICAL |
| **Missing seats** | 50+ | 🟡 MEDIUM |
| **Missing daily_usability_tag** | 50+ | 🟡 MEDIUM |

---

## 🔴 CRITICAL: Contaminated Engine Families

The enrichment pipeline incorrectly applied these engine families to vehicles that don't have these engines:

### Ford - "3.5L EcoBoost" applied to 23 vehicles
**Contaminated vehicles (should NOT have this engine family):**
- Ford Crown Victoria (has 4.6L SOHC V8)
- Ford Focus ST Mk3 (has 2.0L Turbo I4)
- Ford Focus RS (has 2.3L Turbo I4)
- Ford Mustang GT Fox Body (has 5.0L V8)
- Ford Mustang GT SN95 (has 4.6L SOHC V8)
- Ford Mustang Fastback 1967-1968 (has 4.7L V8)
- Ford Mustang Boss 302 (has 5.0L NA V8)
- Ford Mustang Cobra Terminator (has 4.6L SC V8)
- Ford Mustang Mach 1 SN95 (has 4.6L V8)
- Ford F-150 Lightning (ELECTRIC!)
- Ford F-150 Raptor R (has 5.2L SC V8)
- Ford Maverick (has 2.0L Turbo or Hybrid)
- Ford Ranger T6 (has 2.3L EcoBoost)

**Correctly has 3.5L EcoBoost:**
- Ford F-150 Raptor (2017-2020, 2021-2024)
- Ford F-150 (current gen)
- Ford Explorer ST
- Ford Taurus SHO

### Toyota - "B58 3.0L Turbo I6" applied to 16 vehicles
**Contaminated vehicles (should NOT have this engine):**
- Toyota 86 / Scion FR-S (has 2.0L NA Flat-4)
- Toyota GR86 (has 2.4L NA Flat-4)
- Toyota MR2 Turbo SW20 (has 2.0L 3S-GTE I4)
- Toyota MR2 Spyder ZZW30 (has 1.8L I4)
- Toyota Celica GT-Four ST205 (has 2.0L 3S-GTE I4)
- Toyota LFA (has 4.8L NA V10!)
- Toyota 4Runner TRD Pro (has 4.0L V6)
- Toyota Tacoma (has 3.5L V6)
- Toyota Tundra (has 5.7L V8)
- Toyota Sequoia TRD Pro (has 5.7L V8)
- Toyota Land Cruiser 200 (has 5.7L V8)

**Correctly has B58:**
- Toyota GR Supra
- (BMW vehicles using B58)

### Chevrolet - "6.2L V8 (L87)" applied to 12 vehicles
**Contaminated vehicles:**
- Chevrolet Corvette C5 Z06 (has LS6 5.7L V8)
- Chevrolet Corvette C6 Z06 (has LS7 7.0L V8)
- Chevrolet Corvette C6 Grand Sport (has LS3 6.2L V8 - different!)
- Chevrolet Corvette C8 Z06 (has LT6 5.5L V8!)
- Chevrolet Camaro SS 1969 (has 396/427 V8)
- Chevrolet Camaro SS LS1 (has LS1 5.7L V8)
- Chevrolet Camaro Z28 2nd Gen (has various V8s)
- Chevrolet Colorado ZR2 (has 3.6L V6)

### Subaru - "EJ257 2.5L Turbo Boxer" applied to 11 vehicles
**Contaminated vehicles:**
- Subaru BRZ ZC6 (has FA20 2.0L NA)
- Subaru BRZ ZD8 (has FA24 2.4L NA)
- Subaru Crosstrek (has 2.0L/2.5L NA)
- Subaru Forester XT (correct only for some years)
- Kia Stinger GT (has 3.3L TT V6!)

### Honda - "K20C1 2.0L Turbo" applied to 10 vehicles
**Contaminated vehicles:**
- Honda CRX Si (has 1.6L DOHC VTEC)
- Honda Del Sol VTEC (has 1.6L DOHC VTEC)
- Honda Civic Si EM1 (has 1.6L DOHC VTEC)
- Honda Civic Si EP3 (has 2.0L VTEC NA)
- Honda Civic Si FG2 (has 2.0L VTEC NA)
- Honda S2000 (has 2.0L/2.2L F20C/F22C)
- Jaguar F-Type R (has 5.0L SC V8!)

**Correctly has K20C1:**
- Honda Civic Type R FK8
- Honda Civic Type R FL5
- Honda Accord Sport 2.0T

### Dodge - "6.2L Supercharged HEMI" applied to 6 vehicles
**Contaminated vehicles:**
- Dodge SRT-4 (has 2.4L Turbo I4!)
- Dodge Challenger SRT 392 (has 6.4L NA HEMI)
- Dodge Charger SRT 392 (has 6.4L NA HEMI)
- Dodge Viper (has 8.4L NA V10!)

**Correctly has 6.2L SC HEMI:**
- Dodge Challenger Hellcat
- Dodge Charger Hellcat

### Jeep - "3.6L Pentastar" applied to 8 vehicles
**Contaminated vehicles:**
- Jeep Grand Cherokee Trackhawk (has 6.2L SC V8!)
- Jeep Grand Cherokee SRT (has 6.4L HEMI V8)
- Jeep Wrangler Rubicon 392 (has 6.4L HEMI V8!)

---

## 🔴 CRITICAL: Wrong manual_available

These vehicles are marked as manual available but have DCT/auto only:

| Vehicle | Trans | Should Be |
|---------|-------|-----------|
| Audi TT RS 8S | 7DCT | false |
| Audi RS3 8V | 7DCT | false |
| Audi RS3 8Y | 7DCT | false |
| Audi RS5 B8 | 7DCT | false |
| Audi S5 B8 | 7DCT | false |
| Audi S4 B8 | 7DCT | false |
| BMW M5 F10 Competition | 7DCT | false |
| Alfa Romeo 4C | 6DCT | false |
| Mercedes-AMG GT | 7DCT | false |

Note: Some of these may have had manual options in certain markets/years. Verify before fixing.

---

## Root Cause Analysis

The contamination happened in the tuning enrichment pipeline (`scripts/tuning-pipeline/create-profile.mjs`). The `findResearchData` function was matching vehicles too loosely:

**Old (buggy) logic:**
```javascript
// This matched ANY Ford to Ford F-150's "3.5L EcoBoost" template
if (carSlug.includes(key) || key.includes(carSlug.split('-')[0])) {
  return data;
}
```

**Fixed logic:**
```javascript
// Now requires exact slug match or full key containment
if (RESEARCH_DATA[carSlug]) {
  return RESEARCH_DATA[carSlug];
}
for (const [key, data] of Object.entries(RESEARCH_DATA)) {
  if (carSlug.includes(key)) {
    return data;
  }
}
```

---

## Fix SQL Statements

### Phase 1: Reset contaminated profiles to skeleton

```sql
-- Reset all contaminated Ford profiles
UPDATE car_tuning_profiles 
SET engine_family = NULL, stock_whp = NULL, stock_wtq = NULL, 
    data_quality_tier = 'skeleton',
    upgrades_by_objective = '{"power":[],"handling":[],"braking":[],"cooling":[],"sound":[],"aero":[]}'::jsonb,
    platform_insights = '{"strengths":[],"weaknesses":[],"community_tips":[]}'::jsonb
FROM cars 
WHERE car_tuning_profiles.car_id = cars.id 
AND car_tuning_profiles.engine_family = '3.5L EcoBoost'
AND cars.slug NOT IN (
  'ford-f-150-raptor-2021-2024',
  'ford-f150-raptor-second-generation',
  'ford-f150-thirteenth',
  'ford-f150-fourteenth-generation',
  'ford-taurus-sho-fourth-generation',
  'ford-fusion-sport-cd538'
);

-- Reset all contaminated Toyota profiles  
UPDATE car_tuning_profiles 
SET engine_family = NULL, stock_whp = NULL, stock_wtq = NULL, 
    data_quality_tier = 'skeleton',
    upgrades_by_objective = '{"power":[],"handling":[],"braking":[],"cooling":[],"sound":[],"aero":[]}'::jsonb,
    platform_insights = '{"strengths":[],"weaknesses":[],"community_tips":[]}'::jsonb
FROM cars 
WHERE car_tuning_profiles.car_id = cars.id 
AND car_tuning_profiles.engine_family = 'B58 3.0L Turbo I6'
AND cars.slug NOT LIKE '%gr-supra%';

-- Reset all contaminated Chevrolet profiles
UPDATE car_tuning_profiles 
SET engine_family = NULL, stock_whp = NULL, stock_wtq = NULL, 
    data_quality_tier = 'skeleton',
    upgrades_by_objective = '{"power":[],"handling":[],"braking":[],"cooling":[],"sound":[],"aero":[]}'::jsonb,
    platform_insights = '{"strengths":[],"weaknesses":[],"community_tips":[]}'::jsonb
FROM cars 
WHERE car_tuning_profiles.car_id = cars.id 
AND car_tuning_profiles.engine_family = '6.2L V8 (L87)'
AND cars.slug NOT IN (
  'chevrolet-tahoe-fifth-generation',
  'chevrolet-silverado-1500-fourth-generation'
);

-- Reset Honda contaminated profiles
UPDATE car_tuning_profiles 
SET engine_family = NULL, stock_whp = NULL, stock_wtq = NULL, 
    data_quality_tier = 'skeleton',
    upgrades_by_objective = '{"power":[],"handling":[],"braking":[],"cooling":[],"sound":[],"aero":[]}'::jsonb,
    platform_insights = '{"strengths":[],"weaknesses":[],"community_tips":[]}'::jsonb
FROM cars 
WHERE car_tuning_profiles.car_id = cars.id 
AND car_tuning_profiles.engine_family = 'K20C1 2.0L Turbo'
AND cars.slug NOT IN (
  'honda-civic-type-r-fk8',
  'honda-civic-type-r-fl5',
  'honda-accord-sport-2-0t-tenth-generation'
);

-- Reset Subaru/other contaminated profiles
UPDATE car_tuning_profiles 
SET engine_family = NULL, stock_whp = NULL, stock_wtq = NULL, 
    data_quality_tier = 'skeleton',
    upgrades_by_objective = '{"power":[],"handling":[],"braking":[],"cooling":[],"sound":[],"aero":[]}'::jsonb,
    platform_insights = '{"strengths":[],"weaknesses":[],"community_tips":[]}'::jsonb
FROM cars 
WHERE car_tuning_profiles.car_id = cars.id 
AND car_tuning_profiles.engine_family = 'EJ257 2.5L Turbo Boxer'
AND cars.slug NOT IN (
  'subaru-wrx-sti-gr-gv',
  'subaru-wrx-sti-va',
  'subaru-wrx-sti-gd',
  'subaru-wrx-sti-gc8'
);

-- Reset Dodge contaminated profiles
UPDATE car_tuning_profiles 
SET engine_family = NULL, stock_whp = NULL, stock_wtq = NULL, 
    data_quality_tier = 'skeleton',
    upgrades_by_objective = '{"power":[],"handling":[],"braking":[],"cooling":[],"sound":[],"aero":[]}'::jsonb,
    platform_insights = '{"strengths":[],"weaknesses":[],"community_tips":[]}'::jsonb
FROM cars 
WHERE car_tuning_profiles.car_id = cars.id 
AND car_tuning_profiles.engine_family = '6.2L Supercharged HEMI'
AND cars.slug NOT IN (
  'dodge-challenger-hellcat',
  'dodge-charger-hellcat'
);

-- Reset Jeep contaminated profiles
UPDATE car_tuning_profiles 
SET engine_family = NULL, stock_whp = NULL, stock_wtq = NULL, 
    data_quality_tier = 'skeleton',
    upgrades_by_objective = '{"power":[],"handling":[],"braking":[],"cooling":[],"sound":[],"aero":[]}'::jsonb,
    platform_insights = '{"strengths":[],"weaknesses":[],"community_tips":[]}'::jsonb
FROM cars 
WHERE car_tuning_profiles.car_id = cars.id 
AND car_tuning_profiles.engine_family = '3.6L Pentastar'
AND cars.slug IN (
  'jeep-grand-cherokee-trackhawk-wk2',
  'jeep-grand-cherokee-wk2',
  'jeep-wrangler-rubicon-392-jl'
);
```

### Phase 2: Fix manual_available
```sql
UPDATE cars SET manual_available = false 
WHERE slug IN (
  'audi-tt-rs-8s',
  'audi-rs3-8v', 
  'audi-rs3-8y',
  'alfa-romeo-4c'
);
-- Note: Verify others before changing
```

---

## Recommended Fix Strategy

1. **Run the reset SQL statements** to clear contaminated data (sets to skeleton)
2. **Add engine platform templates** to `data/tuningTemplates.js` for commonly needed platforms
3. **Re-run enrichment** only on vehicles with skeleton profiles
4. **Create validation checks** to prevent this from happening again

## Prevention Measures

1. ✅ Already fixed: `findResearchData` function in `create-profile.mjs`
2. ✅ Already created: `lib/tuningValidation.js` for data validation
3. 🔲 TODO: Add pre-commit validation hook
4. 🔲 TODO: Add periodic audit script to CI/CD
