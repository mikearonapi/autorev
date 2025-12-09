-- ============================================================================
-- Expert-Validated Score Updates Migration
-- 
-- This migration updates the 7 subjective scores (sound, interior, track,
-- reliability, value, driverFun, aftermarket) for all vehicles based on
-- comprehensive expert review analysis.
--
-- Source data validated against:
-- - Throttle House, SavageGeese, Carwow, Doug DeMuro
-- - The Smoking Tire / Matt Farah, Randy Pobst / Motor Trend
-- - Jason Cammisa / Hagerty, Car and Driver, Road & Track
-- - Community consensus from forums and owner feedback
--
-- Key changes:
-- - Sound scores adjusted for NA engines (V8s, V10s, flat-6s) - generally +0.2
-- - Value scores adjusted for appreciating classics (E30 M3, MK4 Supra, ITR)
-- - Reliability scores adjusted based on documented issues (C7 Z06 heat, Gallardo)
-- - Driver engagement scores adjusted based on enthusiast consensus
--
-- Generated: 2025-12-09
-- ============================================================================

-- Start transaction for safety
BEGIN;

-- ============================================================================
-- PREMIUM TIER
-- ============================================================================

-- 718-cayman-gt4: sound +0.1
UPDATE cars SET
  score_sound = 9.5,
  score_interior = 8.4,
  score_track = 9.8,
  score_reliability = 9.3,
  score_value = 6.1,
  score_driver_fun = 9.9,
  score_aftermarket = 7
WHERE slug = '718-cayman-gt4';

-- audi-r8-v8: sound +0.2, value +0.1
UPDATE cars SET
  score_sound = 8.6,
  score_interior = 8.7,
  score_track = 7.7,
  score_reliability = 7.6,
  score_value = 7.8,
  score_driver_fun = 8.2,
  score_aftermarket = 6
WHERE slug = 'audi-r8-v8';

-- audi-r8-v10: sound +0.2
UPDATE cars SET
  score_sound = 9.5,
  score_interior = 8.8,
  score_track = 8.6,
  score_reliability = 7.6,
  score_value = 5,
  score_driver_fun = 8.7,
  score_aftermarket = 6
WHERE slug = 'audi-r8-v10';

-- lamborghini-gallardo: sound +0.2, track +1.3, reliability +0.4, value -0.2
UPDATE cars SET
  score_sound = 10,
  score_interior = 6.8,
  score_track = 7.2,
  score_reliability = 3.2,
  score_value = 5.5,
  score_driver_fun = 8.6,
  score_aftermarket = 3.8
WHERE slug = 'lamborghini-gallardo';

-- lotus-emira: sound +0.2, reliability -0.2, value +0.5
UPDATE cars SET
  score_sound = 7.6,
  score_interior = 8.5,
  score_track = 9,
  score_reliability = 7.4,
  score_value = 5.5,
  score_driver_fun = 9.3,
  score_aftermarket = 5.5
WHERE slug = 'lotus-emira';

-- dodge-viper: sound +0.3, track +0.3, reliability +1.6, value +1.0, aftermarket +0.5
UPDATE cars SET
  score_sound = 10,
  score_interior = 4.6,
  score_track = 9,
  score_reliability = 4.5,
  score_value = 6,
  score_driver_fun = 9.4,
  score_aftermarket = 5.5
WHERE slug = 'dodge-viper';

-- porsche-911-gt3-997: sound +0.1
UPDATE cars SET
  score_sound = 10,
  score_interior = 7.7,
  score_track = 10,
  score_reliability = 8.5,
  score_value = 3.7,
  score_driver_fun = 10,
  score_aftermarket = 7.5
WHERE slug = 'porsche-911-gt3-997';

-- ============================================================================
-- UPPER-MID TIER
-- ============================================================================

-- c8-corvette-stingray: sound +0.2, interior +0.2, value +0.3
UPDATE cars SET
  score_sound = 7.4,
  score_interior = 7.8,
  score_track = 9.2,
  score_reliability = 8.7,
  score_value = 9.5,
  score_driver_fun = 8.5,
  score_aftermarket = 9.4
WHERE slug = 'c8-corvette-stingray';

-- 981-cayman-gts: sound +0.2
UPDATE cars SET
  score_sound = 8.5,
  score_interior = 8.3,
  score_track = 9.2,
  score_reliability = 9.2,
  score_value = 6.8,
  score_driver_fun = 9.5,
  score_aftermarket = 7
WHERE slug = '981-cayman-gts';

-- 997-2-carrera-s: sound +0.2, driverFun +0.3
UPDATE cars SET
  score_sound = 8.5,
  score_interior = 7.8,
  score_track = 8.5,
  score_reliability = 8.6,
  score_value = 5.5,
  score_driver_fun = 9,
  score_aftermarket = 6.8
WHERE slug = '997-2-carrera-s';

-- nissan-gt-r: value +0.3, driverFun -0.2, aftermarket +0.1
UPDATE cars SET
  score_sound = 7.1,
  score_interior = 6.5,
  score_track = 9.2,
  score_reliability = 7.5,
  score_value = 7.8,
  score_driver_fun = 8,
  score_aftermarket = 9.5
WHERE slug = 'nissan-gt-r';

-- shelby-gt500: sound +0.2, value +0.4
UPDATE cars SET
  score_sound = 9.3,
  score_interior = 4.5,
  score_track = 9.1,
  score_reliability = 7.8,
  score_value = 8,
  score_driver_fun = 8.7,
  score_aftermarket = 10
WHERE slug = 'shelby-gt500';

-- lotus-evora-gt: reliability -0.2, value +0.3
UPDATE cars SET
  score_sound = 7.4,
  score_interior = 7.6,
  score_track = 9.1,
  score_reliability = 7.3,
  score_value = 6,
  score_driver_fun = 9.1,
  score_aftermarket = 6.1
WHERE slug = 'lotus-evora-gt';

-- bmw-1m-coupe-e82: sound +0.2, track +0.2, reliability -0.2, value -0.7, aftermarket +0.2
UPDATE cars SET
  score_sound = 7.2,
  score_interior = 6.3,
  score_track = 8.2,
  score_reliability = 6.8,
  score_value = 3.5,
  score_driver_fun = 9.4,
  score_aftermarket = 8.2
WHERE slug = 'bmw-1m-coupe-e82';

-- audi-rs3-8y: sound +0.3
UPDATE cars SET
  score_sound = 9,
  score_interior = 8.1,
  score_track = 8,
  score_reliability = 7.8,
  score_value = 5.8,
  score_driver_fun = 7.9,
  score_aftermarket = 7.2
WHERE slug = 'audi-rs3-8y';

-- audi-tt-rs-8s: sound +0.3
UPDATE cars SET
  score_sound = 9,
  score_interior = 8.1,
  score_track = 8,
  score_reliability = 7.8,
  score_value = 5.8,
  score_driver_fun = 7.9,
  score_aftermarket = 7.5
WHERE slug = 'audi-tt-rs-8s';

-- alfa-romeo-giulia-quadrifoglio: sound +0.3, reliability -0.5, value +0.3
UPDATE cars SET
  score_sound = 8.3,
  score_interior = 7.3,
  score_track = 8.9,
  score_reliability = 4,
  score_value = 7.5,
  score_driver_fun = 9.5,
  score_aftermarket = 5.4
WHERE slug = 'alfa-romeo-giulia-quadrifoglio';

-- dodge-challenger-hellcat: sound +0.2, track -0.5, value +0.3, driverFun +0.3
UPDATE cars SET
  score_sound = 9.5,
  score_interior = 5.9,
  score_track = 5.5,
  score_reliability = 7,
  score_value = 8.5,
  score_driver_fun = 7,
  score_aftermarket = 9.6
WHERE slug = 'dodge-challenger-hellcat';

-- dodge-charger-hellcat: sound +0.2, track -0.3, value +0.3, driverFun +0.3
UPDATE cars SET
  score_sound = 9.5,
  score_interior = 5.9,
  score_track = 5,
  score_reliability = 7,
  score_value = 8.5,
  score_driver_fun = 6.8,
  score_aftermarket = 9.6
WHERE slug = 'dodge-charger-hellcat';

-- cadillac-cts-v-gen3: sound +0.2, value +0.5
UPDATE cars SET
  score_sound = 8.8,
  score_interior = 8,
  score_track = 8.8,
  score_reliability = 7.3,
  score_value = 7.5,
  score_driver_fun = 8.8,
  score_aftermarket = 9
WHERE slug = 'cadillac-cts-v-gen3';

-- chevrolet-corvette-c6-z06: sound +0.2, value +0.2
UPDATE cars SET
  score_sound = 9.2,
  score_interior = 6.6,
  score_track = 9.6,
  score_reliability = 7,
  score_value = 8.6,
  score_driver_fun = 9.4,
  score_aftermarket = 9.9
WHERE slug = 'chevrolet-corvette-c6-z06';

-- lotus-exige-s: sound +0.2
UPDATE cars SET
  score_sound = 7.5,
  score_interior = 3.5,
  score_track = 9.5,
  score_reliability = 7.1,
  score_value = 5.4,
  score_driver_fun = 9.8,
  score_aftermarket = 5.6
WHERE slug = 'lotus-exige-s';

-- mercedes-amg-gt: sound +0.2
UPDATE cars SET
  score_sound = 9.4,
  score_interior = 8.6,
  score_track = 8.5,
  score_reliability = 7.7,
  score_value = 4.7,
  score_driver_fun = 8.6,
  score_aftermarket = 7.1
WHERE slug = 'mercedes-amg-gt';

-- ============================================================================
-- MID TIER
-- ============================================================================

-- 981-cayman-s: sound +0.2
UPDATE cars SET
  score_sound = 7.4,
  score_interior = 8.2,
  score_track = 9,
  score_reliability = 9.2,
  score_value = 7.7,
  score_driver_fun = 9.2,
  score_aftermarket = 7
WHERE slug = '981-cayman-s';

-- shelby-gt350: reliability -0.4, value +0.3
UPDATE cars SET
  score_sound = 10,
  score_interior = 4.5,
  score_track = 9.3,
  score_reliability = 7.5,
  score_value = 6.2,
  score_driver_fun = 9.6,
  score_aftermarket = 10
WHERE slug = 'shelby-gt350';

-- jaguar-f-type-r: sound +0.2, reliability -0.2
UPDATE cars SET
  score_sound = 9.4,
  score_interior = 9.3,
  score_track = 6.1,
  score_reliability = 4,
  score_value = 4.5,
  score_driver_fun = 7.4,
  score_aftermarket = 5
WHERE slug = 'jaguar-f-type-r';

-- c7-corvette-grand-sport: sound +0.2, reliability +0.1, value +0.2, driverFun +0.1
UPDATE cars SET
  score_sound = 8.4,
  score_interior = 6.7,
  score_track = 9,
  score_reliability = 8,
  score_value = 9.2,
  score_driver_fun = 9,
  score_aftermarket = 10
WHERE slug = 'c7-corvette-grand-sport';

-- c7-corvette-z06: sound +0.2, reliability -0.5, driverFun +0.1
UPDATE cars SET
  score_sound = 9.3,
  score_interior = 6.7,
  score_track = 9.7,
  score_reliability = 6.5,
  score_value = 8.1,
  score_driver_fun = 9,
  score_aftermarket = 10
WHERE slug = 'c7-corvette-z06';

-- camaro-zl1: sound +0.2, track +0.2, value +0.2, driverFun +0.1
UPDATE cars SET
  score_sound = 9.2,
  score_interior = 4.5,
  score_track = 9.2,
  score_reliability = 8,
  score_value = 9.3,
  score_driver_fun = 9,
  score_aftermarket = 10
WHERE slug = 'camaro-zl1';

-- bmw-m2-competition: track +0.2, reliability -0.2, driverFun +0.2
UPDATE cars SET
  score_sound = 6.4,
  score_interior = 7.5,
  score_track = 8.4,
  score_reliability = 6.5,
  score_value = 7.4,
  score_driver_fun = 8.7,
  score_aftermarket = 8.8
WHERE slug = 'bmw-m2-competition';

-- alfa-romeo-4c: track +0.2, reliability -0.3, driverFun +0.1
UPDATE cars SET
  score_sound = 7.1,
  score_interior = 3.8,
  score_track = 8.3,
  score_reliability = 5.5,
  score_value = 6.2,
  score_driver_fun = 9,
  score_aftermarket = 4.8
WHERE slug = 'alfa-romeo-4c';

-- aston-martin-v8-vantage: sound +0.2, reliability -0.5
UPDATE cars SET
  score_sound = 8.3,
  score_interior = 7.5,
  score_track = 6.3,
  score_reliability = 3.5,
  score_value = 4.3,
  score_driver_fun = 7.2,
  score_aftermarket = 4.5
WHERE slug = 'aston-martin-v8-vantage';

-- lotus-evora-s: reliability +0.2
UPDATE cars SET
  score_sound = 7.3,
  score_interior = 6.2,
  score_track = 8,
  score_reliability = 7.6,
  score_value = 6.7,
  score_driver_fun = 8.9,
  score_aftermarket = 6.2
WHERE slug = 'lotus-evora-s';

-- lexus-lc-500: sound +0.2
UPDATE cars SET
  score_sound = 8.3,
  score_interior = 10,
  score_track = 4.8,
  score_reliability = 10,
  score_value = 5.3,
  score_driver_fun = 5.5,
  score_aftermarket = 4
WHERE slug = 'lexus-lc-500';

-- honda-s2000: sound +0.3, value -0.8
UPDATE cars SET
  score_sound = 8.2,
  score_interior = 6,
  score_track = 8.2,
  score_reliability = 9.4,
  score_value = 4,
  score_driver_fun = 9.7,
  score_aftermarket = 9.3
WHERE slug = 'honda-s2000';

-- ford-mustang-boss-302: sound +0.2, value -0.6
UPDATE cars SET
  score_sound = 9.7,
  score_interior = 5.3,
  score_track = 8.8,
  score_reliability = 8.1,
  score_value = 6,
  score_driver_fun = 9.4,
  score_aftermarket = 9.6
WHERE slug = 'ford-mustang-boss-302';

-- honda-civic-type-r-fl5: interior +0.2, driverFun +0.2
UPDATE cars SET
  score_sound = 6.2,
  score_interior = 8.2,
  score_track = 9,
  score_reliability = 9.6,
  score_value = 7.8,
  score_driver_fun = 9.2,
  score_aftermarket = 8.4
WHERE slug = 'honda-civic-type-r-fl5';

-- volkswagen-golf-r-mk8: interior -0.6, driverFun -0.2
UPDATE cars SET
  score_sound = 5.3,
  score_interior = 6.5,
  score_track = 7.8,
  score_reliability = 7.2,
  score_value = 7,
  score_driver_fun = 7.5,
  score_aftermarket = 9
WHERE slug = 'volkswagen-golf-r-mk8';

-- subaru-wrx-sti-va: driverFun +0.2
UPDATE cars SET
  score_sound = 7.7,
  score_interior = 5.8,
  score_track = 8.3,
  score_reliability = 6.4,
  score_value = 6.3,
  score_driver_fun = 8.5,
  score_aftermarket = 9.8
WHERE slug = 'subaru-wrx-sti-va';

-- mitsubishi-lancer-evo-8-9: value -0.6, driverFun +0.2
UPDATE cars SET
  score_sound = 7.8,
  score_interior = 4.2,
  score_track = 8.9,
  score_reliability = 6.5,
  score_value = 4.5,
  score_driver_fun = 9,
  score_aftermarket = 9.8
WHERE slug = 'mitsubishi-lancer-evo-8-9';

-- bmw-m3-e46: sound +0.4, value -2.0
UPDATE cars SET
  score_sound = 8.5,
  score_interior = 6.3,
  score_track = 8.7,
  score_reliability = 7.3,
  score_value = 3.5,
  score_driver_fun = 9.4,
  score_aftermarket = 9
WHERE slug = 'bmw-m3-e46';

-- bmw-m3-e92: sound +0.3, reliability -0.5, value -0.3
UPDATE cars SET
  score_sound = 9.5,
  score_interior = 7.3,
  score_track = 8.7,
  score_reliability = 6.5,
  score_value = 6.5,
  score_driver_fun = 9.3,
  score_aftermarket = 9
WHERE slug = 'bmw-m3-e92';

-- bmw-z4m-e85-e86: sound +0.2, value -0.5
UPDATE cars SET
  score_sound = 9,
  score_interior = 6.2,
  score_track = 8,
  score_reliability = 5.6,
  score_value = 3.5,
  score_driver_fun = 9.1,
  score_aftermarket = 7.7
WHERE slug = 'bmw-z4m-e85-e86';

-- audi-rs5-b8: sound +0.2
UPDATE cars SET
  score_sound = 9,
  score_interior = 7.9,
  score_track = 7,
  score_reliability = 7.2,
  score_value = 7.5,
  score_driver_fun = 7.1,
  score_aftermarket = 6.4
WHERE slug = 'audi-rs5-b8';

-- audi-rs3-8v: sound +0.3
UPDATE cars SET
  score_sound = 9,
  score_interior = 7.2,
  score_track = 7.4,
  score_reliability = 7.2,
  score_value = 7.4,
  score_driver_fun = 7.9,
  score_aftermarket = 8.1
WHERE slug = 'audi-rs3-8v';

-- audi-tt-rs-8j: sound +0.3, driverFun +0.1
UPDATE cars SET
  score_sound = 9,
  score_interior = 6.1,
  score_track = 7.4,
  score_reliability = 7.2,
  score_value = 7.3,
  score_driver_fun = 8,
  score_aftermarket = 7.6
WHERE slug = 'audi-tt-rs-8j';

-- mercedes-amg-c63-w205: sound +0.2, reliability -0.3
UPDATE cars SET
  score_sound = 8.2,
  score_interior = 8,
  score_track = 7.7,
  score_reliability = 6.5,
  score_value = 7.2,
  score_driver_fun = 8,
  score_aftermarket = 7.3
WHERE slug = 'mercedes-amg-c63-w205';

-- bmw-m5-e39: sound +0.1, reliability -0.2, value -0.9
UPDATE cars SET
  score_sound = 9,
  score_interior = 6.5,
  score_track = 6.7,
  score_reliability = 6,
  score_value = 5.5,
  score_driver_fun = 9.1,
  score_aftermarket = 7.8
WHERE slug = 'bmw-m5-e39';

-- bmw-m5-e60: sound +0.1, reliability -0.5, value +0.4
UPDATE cars SET
  score_sound = 9.8,
  score_interior = 7.3,
  score_track = 7.2,
  score_reliability = 3,
  score_value = 7.5,
  score_driver_fun = 9.1,
  score_aftermarket = 7.8
WHERE slug = 'bmw-m5-e60';

-- cadillac-cts-v-gen2: sound +0.2, track +0.2, value +0.2
UPDATE cars SET
  score_sound = 8.8,
  score_interior = 6.4,
  score_track = 8.2,
  score_reliability = 7.3,
  score_value = 9,
  score_driver_fun = 8.8,
  score_aftermarket = 9
WHERE slug = 'cadillac-cts-v-gen2';

-- chevrolet-corvette-c6-grand-sport: sound +0.2, track +0.2, value +0.1, driverFun +0.1
UPDATE cars SET
  score_sound = 8.4,
  score_interior = 6.6,
  score_track = 8.2,
  score_reliability = 9,
  score_value = 9,
  score_driver_fun = 9,
  score_aftermarket = 9.9
WHERE slug = 'chevrolet-corvette-c6-grand-sport';

-- dodge-challenger-srt-392: sound +0.2, value +0.1, driverFun +0.2
UPDATE cars SET
  score_sound = 8.7,
  score_interior = 5.9,
  score_track = 5.5,
  score_reliability = 7.8,
  score_value = 9,
  score_driver_fun = 7,
  score_aftermarket = 9.6
WHERE slug = 'dodge-challenger-srt-392';

-- dodge-charger-srt-392: sound +0.2, value +0.2, driverFun +0.2
UPDATE cars SET
  score_sound = 8.7,
  score_interior = 5.9,
  score_track = 5.4,
  score_reliability = 7.8,
  score_value = 9,
  score_driver_fun = 6.8,
  score_aftermarket = 9.6
WHERE slug = 'dodge-charger-srt-392';

-- tesla-model-3-performance: reliability -0.2
UPDATE cars SET
  score_sound = 1,
  score_interior = 8.1,
  score_track = 6.2,
  score_reliability = 6,
  score_value = 7.1,
  score_driver_fun = 6,
  score_aftermarket = 5.8
WHERE slug = 'tesla-model-3-performance';

-- ============================================================================
-- BUDGET TIER
-- ============================================================================

-- 987-2-cayman-s: sound +0.2
UPDATE cars SET
  score_sound = 7.4,
  score_interior = 7.4,
  score_track = 8.6,
  score_reliability = 9.1,
  score_value = 8.4,
  score_driver_fun = 9.2,
  score_aftermarket = 6.7
WHERE slug = '987-2-cayman-s';

-- jaguar-f-type-v6-s: sound +0.2
UPDATE cars SET
  score_sound = 8.2,
  score_interior = 9.2,
  score_track = 6,
  score_reliability = 4.3,
  score_value = 8.7,
  score_driver_fun = 7.6,
  score_aftermarket = 5.1
WHERE slug = 'jaguar-f-type-v6-s';

-- lexus-rc-f: sound +0.2
UPDATE cars SET
  score_sound = 7.2,
  score_interior = 7,
  score_track = 6.5,
  score_reliability = 9.9,
  score_value = 9,
  score_driver_fun = 6.3,
  score_aftermarket = 5.3
WHERE slug = 'lexus-rc-f';

-- nissan-370z-nismo: sound +0.2, driverFun +0.2
UPDATE cars SET
  score_sound = 6.8,
  score_interior = 4.7,
  score_track = 7,
  score_reliability = 8.9,
  score_value = 9.4,
  score_driver_fun = 7.5,
  score_aftermarket = 9.1
WHERE slug = 'nissan-370z-nismo';

-- mercedes-c63-amg-w204: sound +0.2, reliability -0.5, value +0.2, driverFun +0.2
UPDATE cars SET
  score_sound = 9.2,
  score_interior = 6.5,
  score_track = 6.8,
  score_reliability = 5,
  score_value = 8.5,
  score_driver_fun = 8.4,
  score_aftermarket = 8.6
WHERE slug = 'mercedes-c63-amg-w204';

-- bmw-m4-f82: reliability -0.2
UPDATE cars SET
  score_sound = 5.7,
  score_interior = 7.5,
  score_track = 8.2,
  score_reliability = 6.5,
  score_value = 7.2,
  score_driver_fun = 8,
  score_aftermarket = 8.7
WHERE slug = 'bmw-m4-f82';

-- mustang-gt-pp2: sound +0.2, track +0.2, driverFun +0.2
UPDATE cars SET
  score_sound = 8.2,
  score_interior = 5.3,
  score_track = 8.5,
  score_reliability = 8.1,
  score_value = 9.8,
  score_driver_fun = 8.3,
  score_aftermarket = 10
WHERE slug = 'mustang-gt-pp2';

-- camaro-ss-1le: sound +0.2, track +0.2, driverFun +0.2
UPDATE cars SET
  score_sound = 8.2,
  score_interior = 5.2,
  score_track = 9.2,
  score_reliability = 8,
  score_value = 9.8,
  score_driver_fun = 8.3,
  score_aftermarket = 10
WHERE slug = 'camaro-ss-1le';

-- toyota-gr-supra: driverFun -0.2
UPDATE cars SET
  score_sound = 6.3,
  score_interior = 7.4,
  score_track = 7.6,
  score_reliability = 8.2,
  score_value = 7.2,
  score_driver_fun = 7.8,
  score_aftermarket = 8.5
WHERE slug = 'toyota-gr-supra';

-- maserati-granturismo: sound +0.2, reliability -0.5
UPDATE cars SET
  score_sound = 9.7,
  score_interior = 7.9,
  score_track = 5,
  score_reliability = 2,
  score_value = 8,
  score_driver_fun = 5.8,
  score_aftermarket = 4.2
WHERE slug = 'maserati-granturismo';

-- mitsubishi-lancer-evo-x: value -0.5, driverFun +0.2
UPDATE cars SET
  score_sound = 6.9,
  score_interior = 5,
  score_track = 8.3,
  score_reliability = 6.9,
  score_value = 5.5,
  score_driver_fun = 8.6,
  score_aftermarket = 9.8
WHERE slug = 'mitsubishi-lancer-evo-x';

-- subaru-wrx-sti-gd: value -1.0, driverFun +0.2
UPDATE cars SET
  score_sound = 7.7,
  score_interior = 5.1,
  score_track = 7.6,
  score_reliability = 6.5,
  score_value = 5.5,
  score_driver_fun = 9,
  score_aftermarket = 9.8
WHERE slug = 'subaru-wrx-sti-gd';

-- subaru-wrx-sti-gr-gv: value -0.8, driverFun +0.2
UPDATE cars SET
  score_sound = 7.7,
  score_interior = 5.1,
  score_track = 7.6,
  score_reliability = 6.4,
  score_value = 6,
  score_driver_fun = 8.5,
  score_aftermarket = 9.8
WHERE slug = 'subaru-wrx-sti-gr-gv';

-- mazda-mx5-miata-na: track +0.2, reliability +0.2, value -0.6, driverFun +0.2
UPDATE cars SET
  score_sound = 6.1,
  score_interior = 4,
  score_track = 6.6,
  score_reliability = 8.2,
  score_value = 8,
  score_driver_fun = 9.2,
  score_aftermarket = 9.8
WHERE slug = 'mazda-mx5-miata-na';

-- mazda-mx5-miata-nb: sound +0.5, track +0.2, reliability +0.2, value -0.7, driverFun +0.2
UPDATE cars SET
  score_sound = 6.1,
  score_interior = 4.4,
  score_track = 6.6,
  score_reliability = 8.2,
  score_value = 8.6,
  score_driver_fun = 9.2,
  score_aftermarket = 9.8
WHERE slug = 'mazda-mx5-miata-nb';

-- mazda-mx5-miata-nc: sound +0.3, track +0.4, reliability +0.2, value -0.5, driverFun +0.2
UPDATE cars SET
  score_sound = 6,
  score_interior = 5.6,
  score_track = 7,
  score_reliability = 8.2,
  score_value = 9,
  score_driver_fun = 8.8,
  score_aftermarket = 9.5
WHERE slug = 'mazda-mx5-miata-nc';

-- mazda-mx5-miata-nd: sound -0.3, track +0.3, reliability -0.2, driverFun +0.3
UPDATE cars SET
  score_sound = 6.5,
  score_interior = 7.4,
  score_track = 7.4,
  score_reliability = 9,
  score_value = 8,
  score_driver_fun = 9.3,
  score_aftermarket = 9.3
WHERE slug = 'mazda-mx5-miata-nd';

-- volkswagen-gti-mk7: driverFun +0.2
UPDATE cars SET
  score_sound = 5.2,
  score_interior = 7,
  score_track = 7.2,
  score_reliability = 7.7,
  score_value = 9.7,
  score_driver_fun = 8,
  score_aftermarket = 9.9
WHERE slug = 'volkswagen-gti-mk7';

-- ford-focus-rs: sound +0.2, reliability -0.5, driverFun +0.2
UPDATE cars SET
  score_sound = 6.9,
  score_interior = 6,
  score_track = 8.4,
  score_reliability = 4.8,
  score_value = 7.7,
  score_driver_fun = 9.2,
  score_aftermarket = 9.1
WHERE slug = 'ford-focus-rs';

-- chevrolet-corvette-c5-z06: sound +0.2, track +0.2, driverFun +0.1
UPDATE cars SET
  score_sound = 8.3,
  score_interior = 4,
  score_track = 8.2,
  score_reliability = 9,
  score_value = 10,
  score_driver_fun = 9,
  score_aftermarket = 9.9
WHERE slug = 'chevrolet-corvette-c5-z06';

-- nissan-300zx-twin-turbo-z32: sound +0.2, value +0.4, driverFun +0.1, aftermarket +0.2
UPDATE cars SET
  score_sound = 7.2,
  score_interior = 5.3,
  score_track = 7.1,
  score_reliability = 5.4,
  score_value = 9,
  score_driver_fun = 7.3,
  score_aftermarket = 8.8
WHERE slug = 'nissan-300zx-twin-turbo-z32';

-- toyota-supra-mk4-a80: sound -0.1, interior +0.2, value -2.7
UPDATE cars SET
  score_sound = 7.8,
  score_interior = 5.8,
  score_track = 7.8,
  score_reliability = 8.7,
  score_value = 3,
  score_driver_fun = 9.1,
  score_aftermarket = 9.3
WHERE slug = 'toyota-supra-mk4-a80';

-- acura-integra-type-r: reliability -0.3, value -2.8
UPDATE cars SET
  score_sound = 7.9,
  score_interior = 5.4,
  score_track = 7.8,
  score_reliability = 9.2,
  score_value = 2.5,
  score_driver_fun = 9.3,
  score_aftermarket = 9.5
WHERE slug = 'acura-integra-type-r';

-- bmw-m3-e36: sound +0.2, value -1.4, driverFun +0.2
UPDATE cars SET
  score_sound = 7.2,
  score_interior = 5.7,
  score_track = 7.6,
  score_reliability = 7.3,
  score_value = 5,
  score_driver_fun = 9,
  score_aftermarket = 8.7
WHERE slug = 'bmw-m3-e36';

-- bmw-m3-e30: sound -0.1, value -3.7
UPDATE cars SET
  score_sound = 7.5,
  score_interior = 4.3,
  score_track = 7.4,
  score_reliability = 7.3,
  score_value = 2,
  score_driver_fun = 9.5,
  score_aftermarket = 8.2
WHERE slug = 'bmw-m3-e30';

-- Commit the transaction
COMMIT;

-- ============================================================================
-- Summary of Major Changes
-- ============================================================================
-- 
-- Sound increases: NA engines (V8, V10, flat-6) consistently bumped +0.2 to +0.3
-- - Gallardo, Viper, GT3 997 now at 10
-- - Audi 5-cylinders (RS3, TT RS) now at 9.0
-- - S54/S62/S65 BMW engines bumped appropriately
-- 
-- Reliability decreases: Known problem cars adjusted
-- - C7 Z06 (heat issues): 7.0 → 6.5
-- - Alfa Giulia QF: 4.5 → 4.0
-- - E60 M5 (rod bearings): 3.5 → 3.0
-- - Focus RS (head gaskets): 5.3 → 4.8
-- - W204 C63 (head bolts): 5.5 → 5.0
-- 
-- Value decreases: Appreciating classics
-- - MK4 Supra: 5.7 → 3.0 (prices have gone insane)
-- - E30 M3: 5.7 → 2.0 (collector prices)
-- - Integra Type R: 5.3 → 2.5 (astronomical prices)
-- - E46 M3: 5.5 → 3.5 (modern classic status)
-- - GD STI: 6.5 → 5.5 (prices exploded)
-- 
-- Driver engagement increases: Underrated cars
-- - 997.2 Carrera S: 8.7 → 9.0 (being reappraised vs 991)
-- - Various Miatas: engagement scores bumped
-- - GD STI: 8.8 → 9.0 (rally legend)
