# Priority Vehicle Audit - User Activity Based

Generated: 2026-01-11

## Summary

**31 vehicles** have user activity (garage, projects, favorites, community posts)

### Critical Issues Found

| Issue Type | Count | Severity |
|------------|-------|----------|
| Contaminated tuning profile (wrong engine) | 5 | 🔴 Critical |
| Wrong `manual_available` | 4 | 🔴 Critical |
| Wrong `stock_whp` | 2 | 🟠 High |
| Missing engine_family (no tuning data) | 18 | 🟠 High |
| Missing `seats` | 17 | 🟡 Medium |
| Missing `daily_usability_tag` | 16 | 🟡 Medium |
| Missing `msrp_new_low` | 14 | 🟡 Medium |
| Missing `direct_competitors` | 14 | 🟡 Medium |

---

## 🔴 CRITICAL: Contaminated Tuning Profiles

These vehicles have WRONG engine family data that will show incorrect tuning information:

### 1. Honda Prelude Si VTEC (BB4)
- **Activity Score**: 7 (1 garage, 1 favorite)
- **Actual Engine**: `2.2L DOHC VTEC I4` (H22A)
- **Wrong Profile**: `K20C1 2.0L Turbo` (Civic Type R engine!)
- **Wrong Stock WHP**: 275 (actual ~160 WHP)
- **Fix**: Reset to skeleton, create H22A template

### 2. Toyota Supra Mk4 A80 Turbo
- **Activity Score**: 5 (1 garage)
- **Actual Engine**: `3.0L TT I6 2JZ-GTE`
- **Wrong Profile**: `B58 3.0L Turbo I6` (modern Supra engine!)
- **Wrong Stock WHP**: 340 (actual ~250 WHP stock)
- **Fix**: Reset to skeleton, create 2JZ-GTE template

### 3. Ford Mustang SVT Cobra (SN95)
- **Activity Score**: 5 (1 garage)
- **Actual Engine**: `4.6L DOHC V8` (Modular)
- **Wrong Profile**: `3.5L EcoBoost` (F-150/Raptor engine!)
- **Wrong Stock WHP**: 350 (actual ~270 WHP for 03/04 Cobra)
- **Fix**: Reset to skeleton, create 4.6L Terminator template

### 4. Acura Integra Type R (DC2)
- **Activity Score**: 4 (1 project, 1 community)
- **Actual Engine**: `1.8L NA I4 VTEC B18C5`
- **Wrong Profile**: `K20C1 2.0L Turbo` (modern CTR engine!)
- **Wrong Stock WHP**: 275 (actual ~165 WHP)
- **Fix**: Reset to skeleton, create B18C5 template

### 5. Shelby GT350
- **Activity Score**: 4 (2 favorites)
- **Actual Engine**: `5.2L FP V8` (Voodoo flat-plane)
- **Wrong Profile**: `5.0L Coyote` (different engine!)
- **Wrong Stock WHP**: 390 (actual ~480 WHP)
- **Fix**: Reset to skeleton, create Voodoo template

---

## 🔴 CRITICAL: Wrong `manual_available` Field

### 1. Volkswagen Golf R Mk8
- **Activity Score**: 19 (3 garage, 1 project)
- **Current**: `manual_available = true`
- **Reality**: Mk8 Golf R is **DSG ONLY** in USA
- **Fix**: Set to `false`

### 2. C8 Corvette Stingray
- **Activity Score**: 6 (1 project, 1 favorite)
- **Current**: `manual_available = true`
- **Reality**: C8 is **DCT ONLY** (no manual option)
- **Fix**: Set to `false`

### 3. Nissan GT-R
- **Activity Score**: 4 (1 project, 1 community)
- **Current**: `manual_available = true`
- **Reality**: GT-R is **DCT ONLY** since R35
- **Fix**: Set to `false`

### 4. Shelby GT500
- **Activity Score**: 2 (1 favorite)
- **Current**: `manual_available = true`
- **Reality**: 2020+ GT500 is **DCT ONLY**
- **Fix**: Set to `false`

---

## 🟠 HIGH: Wrong Stock WHP Values

### 1. Volkswagen Golf R Mk7
- **Activity Score**: 19
- **Current**: `stock_whp = 210`
- **Correct**: ~250 WHP (292 crank × 0.85)
- **Fix**: Update to 250

### 2. Volkswagen Golf R Mk8
- **Activity Score**: 19
- **Current**: `stock_whp = 210`
- **Correct**: ~268 WHP (315 crank × 0.85)
- **Fix**: Update to 268

---

## 🟠 HIGH: Missing Engine Family (No Tuning Data)

These vehicles have no platform-specific tuning information:

| Rank | Vehicle | Activity | Engine | Platform to Add |
|------|---------|----------|--------|-----------------|
| 1 | BMW M3 E92 | 14 | 4.0L NA V8 S65 | S65 template |
| 2 | 981 Cayman S | 11 | 3.4L NA Flat-6 | MA2 (9A1) template |
| 3 | Evo X | 9 | 2.0L Turbo I4 | 4B11T template |
| 4 | 718 Cayman GT4 | 6 | 4.0L NA Flat-6 | MA3 template |
| 5 | Porsche 911 GT3 RS 992 | 5 | 4.0L NA Flat-6 | 9A2 EVO template |
| 6 | VW Golf TSI Mk7 | 5 | 1.4L Turbo I4 | EA211 template |
| 7 | Ram 1500 Rebel | 5 | 5.7L HEMI V8 | HEMI template |
| 8 | BMW M2 G87 | 5 | 3.0L TT I6 S58 | S58 template |
| 9 | 991.1 Carrera S | 4 | 3.8L NA Flat-6 | MA1 (9A1) template |
| 10 | Nissan GT-R | 4 | 3.8L TT V6 | VR38DETT template |
| 11 | 981 Cayman GTS | 4 | 3.4L NA Flat-6 | MA2 template |
| 12 | Audi R8 V10 | 2 | 5.2L V10 | 5.2 FSI template |
| 13 | Shelby GT500 | 2 | 5.2L SC V8 | Predator template |
| 14 | Rivian R1S | 2 | Electric | EV template |
| 15 | GMC Hummer EV | 2 | Electric | EV template |
| 16 | 911 Turbo 997.2 | 2 | 3.8L TT Flat-6 | Mezger template |
| 17 | Aston Martin DB11 | 2 | 4.0L TT V8 | AMG M177 template |
| 18 | 911 Turbo S 992 | 2 | 3.8L TT Flat-6 | 9A2 template |
| 19 | 718 Cayman GTS 4.0 | 2 | 4.0L NA Flat-6 | MA3 template |

---

## 🟡 MEDIUM: Missing Basic Fields

### Missing `seats`
17 vehicles missing seat count:
- volkswagen-gti-mk7, volkswagen-golf-r-mk7, volkswagen-golf-r-mk8
- bmw-m3-e92, 981-cayman-s, mitsubishi-lancer-evo-x
- c8-corvette-stingray, dodge-challenger-hellcat, shelby-gt350
- 991-1-carrera-s, acura-integra-type-r-dc2, nissan-gt-r
- 981-cayman-gts, shelby-gt500

### Missing `daily_usability_tag`
16 vehicles missing usability tag

### Missing `msrp_new_low`
14 vehicles missing MSRP

### Missing `direct_competitors`
14 vehicles with 0 competitors listed

---

## Priority Fix Order

### Phase 1: Critical Fixes (Do First)
1. Fix 5 contaminated tuning profiles
2. Fix 4 wrong `manual_available` values
3. Fix 2 wrong `stock_whp` values

### Phase 2: High-Activity Vehicles
1. VW GTI Mk7 (score 33) - add missing fields
2. VW Golf R Mk7 (score 19) - fix stock_whp + missing fields
3. VW Golf R Mk8 (score 19) - fix manual_available + stock_whp + missing fields
4. BMW M3 E92 (score 14) - create S65 template
5. 981 Cayman S (score 11) - create MA2 template

### Phase 3: Engine Platform Templates Needed
Create templates for these platforms (in order of user activity):
1. S65 (BMW E9x M3) - Activity: 14
2. MA2/9A1 (981 Cayman/Boxster) - Activity: 15 combined
3. 4B11T (Evo X) - Activity: 9
4. VR38DETT (Nissan GT-R) - Activity: 4
5. S58 (BMW G8x M cars) - Activity: 5
6. Voodoo 5.2L (GT350/GT350R) - Activity: 4
7. Predator 5.2L SC (GT500) - Activity: 2

---

## SQL Fixes Ready to Execute

### Fix manual_available
```sql
UPDATE cars SET manual_available = false 
WHERE slug IN (
  'volkswagen-golf-r-mk8',
  'c8-corvette-stingray', 
  'nissan-gt-r',
  'shelby-gt500'
);
```

### Fix Golf R stock_whp
```sql
UPDATE car_tuning_profiles SET stock_whp = 250, stock_wtq = 265
FROM cars WHERE car_tuning_profiles.car_id = cars.id 
AND cars.slug = 'volkswagen-golf-r-mk7';

UPDATE car_tuning_profiles SET stock_whp = 268, stock_wtq = 280
FROM cars WHERE car_tuning_profiles.car_id = cars.id 
AND cars.slug = 'volkswagen-golf-r-mk8';
```

### Reset contaminated profiles to skeleton
```sql
UPDATE car_tuning_profiles 
SET engine_family = NULL, 
    stock_whp = NULL, 
    stock_wtq = NULL, 
    data_quality_tier = 'skeleton',
    upgrades_by_objective = '{"power":[],"handling":[],"braking":[],"cooling":[],"sound":[],"aero":[]}'::jsonb,
    platform_insights = '{"strengths":[],"weaknesses":[],"community_tips":[]}'::jsonb
FROM cars 
WHERE car_tuning_profiles.car_id = cars.id 
AND cars.slug IN (
  'honda-prelude-si-vtec-bb4',
  'toyota-supra-mk4-a80-turbo',
  'ford-mustang-svt-cobra-sn95',
  'acura-integra-type-r-dc2',
  'shelby-gt350'
);
```

### Add missing seats
```sql
UPDATE cars SET seats = 4 WHERE slug IN ('volkswagen-gti-mk7', 'bmw-m3-e92', 'shelby-gt350', 'dodge-challenger-hellcat', '991-1-carrera-s', 'acura-integra-type-r-dc2', 'shelby-gt500', 'nissan-gt-r');
UPDATE cars SET seats = 5 WHERE slug IN ('volkswagen-golf-r-mk7', 'volkswagen-golf-r-mk8', 'mitsubishi-lancer-evo-x');
UPDATE cars SET seats = 2 WHERE slug IN ('981-cayman-s', 'c8-corvette-stingray', '981-cayman-gts');
```
