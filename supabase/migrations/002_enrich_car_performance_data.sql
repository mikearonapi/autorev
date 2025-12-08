-- ============================================================================
-- Car Performance Data Enrichment
-- 
-- This migration adds Performance HUB scores and hard metrics to all cars.
-- Data sourced from Car and Driver, Motor Trend, and manufacturer specs.
-- 
-- IMPORTANT: These are UPDATE statements - they will NOT delete any existing data.
-- ============================================================================

-- ============================================================================
-- PREMIUM TIER
-- ============================================================================

-- 718 Cayman GT4 (already has data, updating for consistency)
UPDATE cars SET
  torque = 309,
  curb_weight = 3227,
  zero_to_sixty = 4.2,
  quarter_mile = 12.5,
  braking_60_0 = 97,
  lateral_g = 1.12,
  perf_power_accel = 8,
  perf_grip_cornering = 9,
  perf_braking = 9,
  perf_track_pace = 10,
  perf_drivability = 5,
  perf_reliability_heat = 8,
  perf_sound_emotion = 9,
  updated_at = NOW()
WHERE slug = '718-cayman-gt4';

-- 718 Cayman GTS 4.0
UPDATE cars SET
  torque = 309,
  curb_weight = 3153,
  zero_to_sixty = 4.3,
  quarter_mile = 12.6,
  braking_60_0 = 100,
  lateral_g = 1.08,
  perf_power_accel = 8,
  perf_grip_cornering = 8,
  perf_braking = 8,
  perf_track_pace = 9,
  perf_drivability = 7,
  perf_reliability_heat = 9,
  perf_sound_emotion = 9,
  updated_at = NOW()
WHERE slug = '718-cayman-gts-40';

-- Audi R8 V8
UPDATE cars SET
  torque = 317,
  curb_weight = 3594,
  zero_to_sixty = 4.1,
  quarter_mile = 12.4,
  braking_60_0 = 103,
  lateral_g = 1.01,
  perf_power_accel = 8,
  perf_grip_cornering = 7,
  perf_braking = 7,
  perf_track_pace = 7,
  perf_drivability = 8,
  perf_reliability_heat = 8,
  perf_sound_emotion = 8,
  updated_at = NOW()
WHERE slug = 'audi-r8-v8';

-- Audi R8 V10
UPDATE cars SET
  torque = 398,
  curb_weight = 3660,
  zero_to_sixty = 3.4,
  quarter_mile = 11.5,
  braking_60_0 = 98,
  lateral_g = 1.06,
  perf_power_accel = 9,
  perf_grip_cornering = 8,
  perf_braking = 8,
  perf_track_pace = 8,
  perf_drivability = 8,
  perf_reliability_heat = 7,
  perf_sound_emotion = 10,
  updated_at = NOW()
WHERE slug = 'audi-r8-v10';

-- Lamborghini Gallardo (LP560-4)
UPDATE cars SET
  torque = 398,
  curb_weight = 3570,
  zero_to_sixty = 3.5,
  quarter_mile = 11.6,
  braking_60_0 = 101,
  lateral_g = 1.04,
  perf_power_accel = 9,
  perf_grip_cornering = 8,
  perf_braking = 7,
  perf_track_pace = 8,
  perf_drivability = 5,
  perf_reliability_heat = 6,
  perf_sound_emotion = 10,
  updated_at = NOW()
WHERE slug = 'lamborghini-gallardo';

-- Lotus Emira
UPDATE cars SET
  torque = 310,
  curb_weight = 3097,
  zero_to_sixty = 4.2,
  quarter_mile = 12.4,
  braking_60_0 = 105,
  lateral_g = 1.06,
  perf_power_accel = 8,
  perf_grip_cornering = 9,
  perf_braking = 7,
  perf_track_pace = 8,
  perf_drivability = 6,
  perf_reliability_heat = 7,
  perf_sound_emotion = 8,
  updated_at = NOW()
WHERE slug = 'lotus-emira';

-- Dodge Viper (Gen V)
UPDATE cars SET
  torque = 600,
  curb_weight = 3374,
  zero_to_sixty = 3.3,
  quarter_mile = 11.0,
  braking_60_0 = 95,
  lateral_g = 1.15,
  perf_power_accel = 10,
  perf_grip_cornering = 9,
  perf_braking = 9,
  perf_track_pace = 10,
  perf_drivability = 4,
  perf_reliability_heat = 6,
  perf_sound_emotion = 10,
  updated_at = NOW()
WHERE slug = 'dodge-viper';

-- ============================================================================
-- UPPER-MID TIER
-- ============================================================================

-- 997.2 Carrera S
UPDATE cars SET
  torque = 310,
  curb_weight = 3307,
  zero_to_sixty = 4.3,
  quarter_mile = 12.7,
  braking_60_0 = 100,
  lateral_g = 1.01,
  perf_power_accel = 7,
  perf_grip_cornering = 8,
  perf_braking = 8,
  perf_track_pace = 8,
  perf_drivability = 8,
  perf_reliability_heat = 8,
  perf_sound_emotion = 9,
  updated_at = NOW()
WHERE slug = '997-2-carrera-s';

-- 991.1 Carrera S
UPDATE cars SET
  torque = 325,
  curb_weight = 3296,
  zero_to_sixty = 4.1,
  quarter_mile = 12.3,
  braking_60_0 = 96,
  lateral_g = 1.05,
  perf_power_accel = 8,
  perf_grip_cornering = 8,
  perf_braking = 8,
  perf_track_pace = 8,
  perf_drivability = 8,
  perf_reliability_heat = 7,
  perf_sound_emotion = 9,
  updated_at = NOW()
WHERE slug = '991-1-carrera-s';

-- 981 Cayman GTS
UPDATE cars SET
  torque = 280,
  curb_weight = 3031,
  zero_to_sixty = 4.5,
  quarter_mile = 13.0,
  braking_60_0 = 102,
  lateral_g = 1.02,
  perf_power_accel = 7,
  perf_grip_cornering = 8,
  perf_braking = 7,
  perf_track_pace = 8,
  perf_drivability = 8,
  perf_reliability_heat = 9,
  perf_sound_emotion = 8,
  updated_at = NOW()
WHERE slug = '981-cayman-gts';

-- Nissan GT-R (R35)
UPDATE cars SET
  torque = 463,
  curb_weight = 3933,
  zero_to_sixty = 2.9,
  quarter_mile = 11.1,
  braking_60_0 = 98,
  lateral_g = 1.08,
  perf_power_accel = 10,
  perf_grip_cornering = 9,
  perf_braking = 8,
  perf_track_pace = 9,
  perf_drivability = 7,
  perf_reliability_heat = 6,
  perf_sound_emotion = 7,
  updated_at = NOW()
WHERE slug = 'nissan-gt-r';

-- C8 Corvette Stingray
UPDATE cars SET
  torque = 470,
  curb_weight = 3535,
  zero_to_sixty = 2.9,
  quarter_mile = 11.3,
  braking_60_0 = 98,
  lateral_g = 1.04,
  perf_power_accel = 9,
  perf_grip_cornering = 8,
  perf_braking = 8,
  perf_track_pace = 9,
  perf_drivability = 8,
  perf_reliability_heat = 8,
  perf_sound_emotion = 8,
  updated_at = NOW()
WHERE slug = 'c8-corvette-stingray';

-- Shelby GT500
UPDATE cars SET
  torque = 625,
  curb_weight = 4171,
  zero_to_sixty = 3.3,
  quarter_mile = 11.4,
  braking_60_0 = 103,
  lateral_g = 1.05,
  perf_power_accel = 10,
  perf_grip_cornering = 7,
  perf_braking = 7,
  perf_track_pace = 8,
  perf_drivability = 5,
  perf_reliability_heat = 6,
  perf_sound_emotion = 9,
  updated_at = NOW()
WHERE slug = 'shelby-gt500';

-- Lotus Evora GT
UPDATE cars SET
  torque = 317,
  curb_weight = 3175,
  zero_to_sixty = 3.8,
  quarter_mile = 12.0,
  braking_60_0 = 102,
  lateral_g = 1.08,
  perf_power_accel = 8,
  perf_grip_cornering = 9,
  perf_braking = 7,
  perf_track_pace = 9,
  perf_drivability = 5,
  perf_reliability_heat = 7,
  perf_sound_emotion = 8,
  updated_at = NOW()
WHERE slug = 'lotus-evora-gt';

-- ============================================================================
-- MID TIER
-- ============================================================================

-- 981 Cayman S
UPDATE cars SET
  torque = 273,
  curb_weight = 2998,
  zero_to_sixty = 4.6,
  quarter_mile = 13.1,
  braking_60_0 = 105,
  lateral_g = 1.00,
  perf_power_accel = 7,
  perf_grip_cornering = 8,
  perf_braking = 7,
  perf_track_pace = 7,
  perf_drivability = 8,
  perf_reliability_heat = 9,
  perf_sound_emotion = 8,
  updated_at = NOW()
WHERE slug = '981-cayman-s';

-- Jaguar F-Type R
UPDATE cars SET
  torque = 502,
  curb_weight = 3814,
  zero_to_sixty = 3.9,
  quarter_mile = 12.1,
  braking_60_0 = 100,
  lateral_g = 0.98,
  perf_power_accel = 9,
  perf_grip_cornering = 7,
  perf_braking = 7,
  perf_track_pace = 7,
  perf_drivability = 7,
  perf_reliability_heat = 6,
  perf_sound_emotion = 10,
  updated_at = NOW()
WHERE slug = 'jaguar-f-type-r';

-- Lotus Evora S
UPDATE cars SET
  torque = 295,
  curb_weight = 3168,
  zero_to_sixty = 4.3,
  quarter_mile = 12.5,
  braking_60_0 = 107,
  lateral_g = 1.05,
  perf_power_accel = 7,
  perf_grip_cornering = 9,
  perf_braking = 7,
  perf_track_pace = 8,
  perf_drivability = 5,
  perf_reliability_heat = 7,
  perf_sound_emotion = 7,
  updated_at = NOW()
WHERE slug = 'lotus-evora-s';

-- Alfa Romeo 4C
UPDATE cars SET
  torque = 258,
  curb_weight = 2465,
  zero_to_sixty = 4.1,
  quarter_mile = 12.8,
  braking_60_0 = 105,
  lateral_g = 1.05,
  perf_power_accel = 7,
  perf_grip_cornering = 9,
  perf_braking = 7,
  perf_track_pace = 8,
  perf_drivability = 4,
  perf_reliability_heat = 6,
  perf_sound_emotion = 8,
  updated_at = NOW()
WHERE slug = 'alfa-romeo-4c';

-- C7 Corvette Grand Sport (already has data)
UPDATE cars SET
  torque = 465,
  curb_weight = 3524,
  zero_to_sixty = 3.6,
  quarter_mile = 11.8,
  braking_60_0 = 99,
  lateral_g = 1.08,
  perf_power_accel = 8,
  perf_grip_cornering = 9,
  perf_braking = 8,
  perf_track_pace = 9,
  perf_drivability = 7,
  perf_reliability_heat = 8,
  perf_sound_emotion = 8,
  updated_at = NOW()
WHERE slug = 'c7-corvette-grand-sport';

-- C7 Corvette Z06
UPDATE cars SET
  torque = 650,
  curb_weight = 3599,
  zero_to_sixty = 3.2,
  quarter_mile = 11.1,
  braking_60_0 = 96,
  lateral_g = 1.14,
  perf_power_accel = 10,
  perf_grip_cornering = 9,
  perf_braking = 9,
  perf_track_pace = 10,
  perf_drivability = 5,
  perf_reliability_heat = 5,
  perf_sound_emotion = 9,
  updated_at = NOW()
WHERE slug = 'c7-corvette-z06';

-- Camaro ZL1
UPDATE cars SET
  torque = 650,
  curb_weight = 4078,
  zero_to_sixty = 3.5,
  quarter_mile = 11.5,
  braking_60_0 = 98,
  lateral_g = 1.06,
  perf_power_accel = 10,
  perf_grip_cornering = 8,
  perf_braking = 8,
  perf_track_pace = 9,
  perf_drivability = 5,
  perf_reliability_heat = 6,
  perf_sound_emotion = 9,
  updated_at = NOW()
WHERE slug = 'camaro-zl1';

-- Shelby GT350 (already has data)
UPDATE cars SET
  torque = 429,
  curb_weight = 3760,
  zero_to_sixty = 4.3,
  quarter_mile = 12.4,
  braking_60_0 = 104,
  lateral_g = 1.05,
  perf_power_accel = 8,
  perf_grip_cornering = 8,
  perf_braking = 7,
  perf_track_pace = 9,
  perf_drivability = 6,
  perf_reliability_heat = 7,
  perf_sound_emotion = 10,
  updated_at = NOW()
WHERE slug = 'shelby-gt350';

-- Aston Martin V8 Vantage
UPDATE cars SET
  torque = 346,
  curb_weight = 3570,
  zero_to_sixty = 4.7,
  quarter_mile = 13.0,
  braking_60_0 = 107,
  lateral_g = 0.96,
  perf_power_accel = 7,
  perf_grip_cornering = 7,
  perf_braking = 6,
  perf_track_pace = 7,
  perf_drivability = 7,
  perf_reliability_heat = 6,
  perf_sound_emotion = 9,
  updated_at = NOW()
WHERE slug = 'aston-martin-v8-vantage';

-- BMW M2 Competition
UPDATE cars SET
  torque = 406,
  curb_weight = 3655,
  zero_to_sixty = 4.0,
  quarter_mile = 12.3,
  braking_60_0 = 101,
  lateral_g = 1.00,
  perf_power_accel = 8,
  perf_grip_cornering = 8,
  perf_braking = 7,
  perf_track_pace = 8,
  perf_drivability = 8,
  perf_reliability_heat = 7,
  perf_sound_emotion = 7,
  updated_at = NOW()
WHERE slug = 'bmw-m2-competition';

-- Lexus LC 500
UPDATE cars SET
  torque = 398,
  curb_weight = 4280,
  zero_to_sixty = 4.4,
  quarter_mile = 12.8,
  braking_60_0 = 109,
  lateral_g = 0.95,
  perf_power_accel = 7,
  perf_grip_cornering = 6,
  perf_braking = 6,
  perf_track_pace = 6,
  perf_drivability = 9,
  perf_reliability_heat = 9,
  perf_sound_emotion = 9,
  updated_at = NOW()
WHERE slug = 'lexus-lc-500';

-- ============================================================================
-- BUDGET TIER
-- ============================================================================

-- 987.2 Cayman S
UPDATE cars SET
  torque = 273,
  curb_weight = 2998,
  zero_to_sixty = 4.9,
  quarter_mile = 13.3,
  braking_60_0 = 108,
  lateral_g = 0.98,
  perf_power_accel = 6,
  perf_grip_cornering = 8,
  perf_braking = 7,
  perf_track_pace = 7,
  perf_drivability = 8,
  perf_reliability_heat = 9,
  perf_sound_emotion = 8,
  updated_at = NOW()
WHERE slug = '987-2-cayman-s';

-- Jaguar F-Type V6 S
UPDATE cars SET
  torque = 339,
  curb_weight = 3558,
  zero_to_sixty = 4.6,
  quarter_mile = 13.0,
  braking_60_0 = 105,
  lateral_g = 0.96,
  perf_power_accel = 7,
  perf_grip_cornering = 7,
  perf_braking = 7,
  perf_track_pace = 7,
  perf_drivability = 8,
  perf_reliability_heat = 6,
  perf_sound_emotion = 9,
  updated_at = NOW()
WHERE slug = 'jaguar-f-type-v6-s';

-- Nissan 370Z NISMO
UPDATE cars SET
  torque = 276,
  curb_weight = 3370,
  zero_to_sixty = 4.8,
  quarter_mile = 13.1,
  braking_60_0 = 109,
  lateral_g = 1.00,
  perf_power_accel = 6,
  perf_grip_cornering = 8,
  perf_braking = 6,
  perf_track_pace = 7,
  perf_drivability = 7,
  perf_reliability_heat = 8,
  perf_sound_emotion = 7,
  updated_at = NOW()
WHERE slug = 'nissan-370z-nismo';

-- Mercedes C63 AMG W204
UPDATE cars SET
  torque = 443,
  curb_weight = 3814,
  zero_to_sixty = 4.3,
  quarter_mile = 12.6,
  braking_60_0 = 104,
  lateral_g = 0.97,
  perf_power_accel = 8,
  perf_grip_cornering = 7,
  perf_braking = 7,
  perf_track_pace = 7,
  perf_drivability = 7,
  perf_reliability_heat = 6,
  perf_sound_emotion = 10,
  updated_at = NOW()
WHERE slug = 'mercedes-c63-amg-w204';

-- Lexus RC F
UPDATE cars SET
  torque = 389,
  curb_weight = 4034,
  zero_to_sixty = 4.3,
  quarter_mile = 12.8,
  braking_60_0 = 108,
  lateral_g = 0.98,
  perf_power_accel = 7,
  perf_grip_cornering = 7,
  perf_braking = 7,
  perf_track_pace = 7,
  perf_drivability = 8,
  perf_reliability_heat = 9,
  perf_sound_emotion = 8,
  updated_at = NOW()
WHERE slug = 'lexus-rc-f';

-- Mustang GT PP2
UPDATE cars SET
  torque = 420,
  curb_weight = 3752,
  zero_to_sixty = 4.3,
  quarter_mile = 12.6,
  braking_60_0 = 102,
  lateral_g = 1.02,
  perf_power_accel = 8,
  perf_grip_cornering = 8,
  perf_braking = 7,
  perf_track_pace = 8,
  perf_drivability = 7,
  perf_reliability_heat = 8,
  perf_sound_emotion = 8,
  updated_at = NOW()
WHERE slug = 'mustang-gt-pp2';

-- Camaro SS 1LE
UPDATE cars SET
  torque = 455,
  curb_weight = 3793,
  zero_to_sixty = 4.2,
  quarter_mile = 12.3,
  braking_60_0 = 98,
  lateral_g = 1.04,
  perf_power_accel = 8,
  perf_grip_cornering = 8,
  perf_braking = 8,
  perf_track_pace = 8,
  perf_drivability = 6,
  perf_reliability_heat = 8,
  perf_sound_emotion = 8,
  updated_at = NOW()
WHERE slug = 'camaro-ss-1le';

-- BMW M4 F82
UPDATE cars SET
  torque = 406,
  curb_weight = 3580,
  zero_to_sixty = 3.9,
  quarter_mile = 12.2,
  braking_60_0 = 102,
  lateral_g = 0.99,
  perf_power_accel = 8,
  perf_grip_cornering = 7,
  perf_braking = 7,
  perf_track_pace = 8,
  perf_drivability = 7,
  perf_reliability_heat = 6,
  perf_sound_emotion = 7,
  updated_at = NOW()
WHERE slug = 'bmw-m4-f82';

-- Toyota GR Supra
UPDATE cars SET
  torque = 365,
  curb_weight = 3400,
  zero_to_sixty = 3.9,
  quarter_mile = 12.1,
  braking_60_0 = 100,
  lateral_g = 1.01,
  perf_power_accel = 8,
  perf_grip_cornering = 8,
  perf_braking = 7,
  perf_track_pace = 8,
  perf_drivability = 8,
  perf_reliability_heat = 8,
  perf_sound_emotion = 6,
  updated_at = NOW()
WHERE slug = 'toyota-gr-supra';

-- Maserati GranTurismo
UPDATE cars SET
  torque = 361,
  curb_weight = 4145,
  zero_to_sixty = 4.7,
  quarter_mile = 13.2,
  braking_60_0 = 112,
  lateral_g = 0.92,
  perf_power_accel = 7,
  perf_grip_cornering = 6,
  perf_braking = 6,
  perf_track_pace = 6,
  perf_drivability = 7,
  perf_reliability_heat = 5,
  perf_sound_emotion = 10,
  updated_at = NOW()
WHERE slug = 'maserati-granturismo';

-- ============================================================================
-- Success Message
-- ============================================================================
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count FROM cars WHERE perf_power_accel IS NOT NULL;
  RAISE NOTICE 'Car Performance Data enrichment complete!';
  RAISE NOTICE 'Cars with Performance HUB scores: % / 35', updated_count;
END $$;


