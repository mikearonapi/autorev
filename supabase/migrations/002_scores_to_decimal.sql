-- Migration: Change score columns from INTEGER to DECIMAL(3,1)
-- This allows storing precise scores like 9.4, 9.8 instead of rounding to integers.
-- Run this in Supabase SQL Editor or via psql

-- Drop existing check constraints
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_score_sound_check;
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_score_interior_check;
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_score_track_check;
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_score_reliability_check;
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_score_value_check;
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_score_driver_fun_check;
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_score_aftermarket_check;
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_perf_power_accel_check;
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_perf_grip_cornering_check;
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_perf_braking_check;
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_perf_track_pace_check;
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_perf_drivability_check;
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_perf_reliability_heat_check;
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_perf_sound_emotion_check;

-- Update Advisory score columns to DECIMAL
ALTER TABLE cars ALTER COLUMN score_sound TYPE DECIMAL(3,1);
ALTER TABLE cars ALTER COLUMN score_interior TYPE DECIMAL(3,1);
ALTER TABLE cars ALTER COLUMN score_track TYPE DECIMAL(3,1);
ALTER TABLE cars ALTER COLUMN score_reliability TYPE DECIMAL(3,1);
ALTER TABLE cars ALTER COLUMN score_value TYPE DECIMAL(3,1);
ALTER TABLE cars ALTER COLUMN score_driver_fun TYPE DECIMAL(3,1);
ALTER TABLE cars ALTER COLUMN score_aftermarket TYPE DECIMAL(3,1);

-- Update Performance HUB score columns to DECIMAL
ALTER TABLE cars ALTER COLUMN perf_power_accel TYPE DECIMAL(3,1);
ALTER TABLE cars ALTER COLUMN perf_grip_cornering TYPE DECIMAL(3,1);
ALTER TABLE cars ALTER COLUMN perf_braking TYPE DECIMAL(3,1);
ALTER TABLE cars ALTER COLUMN perf_track_pace TYPE DECIMAL(3,1);
ALTER TABLE cars ALTER COLUMN perf_drivability TYPE DECIMAL(3,1);
ALTER TABLE cars ALTER COLUMN perf_reliability_heat TYPE DECIMAL(3,1);
ALTER TABLE cars ALTER COLUMN perf_sound_emotion TYPE DECIMAL(3,1);

-- Re-add check constraints for Advisory scores
ALTER TABLE cars ADD CONSTRAINT cars_score_sound_check CHECK (score_sound >= 1 AND score_sound <= 10);
ALTER TABLE cars ADD CONSTRAINT cars_score_interior_check CHECK (score_interior >= 1 AND score_interior <= 10);
ALTER TABLE cars ADD CONSTRAINT cars_score_track_check CHECK (score_track >= 1 AND score_track <= 10);
ALTER TABLE cars ADD CONSTRAINT cars_score_reliability_check CHECK (score_reliability >= 1 AND score_reliability <= 10);
ALTER TABLE cars ADD CONSTRAINT cars_score_value_check CHECK (score_value >= 1 AND score_value <= 10);
ALTER TABLE cars ADD CONSTRAINT cars_score_driver_fun_check CHECK (score_driver_fun >= 1 AND score_driver_fun <= 10);
ALTER TABLE cars ADD CONSTRAINT cars_score_aftermarket_check CHECK (score_aftermarket >= 1 AND score_aftermarket <= 10);

-- Re-add check constraints for Performance HUB scores
ALTER TABLE cars ADD CONSTRAINT cars_perf_power_accel_check CHECK (perf_power_accel >= 1 AND perf_power_accel <= 10);
ALTER TABLE cars ADD CONSTRAINT cars_perf_grip_cornering_check CHECK (perf_grip_cornering >= 1 AND perf_grip_cornering <= 10);
ALTER TABLE cars ADD CONSTRAINT cars_perf_braking_check CHECK (perf_braking >= 1 AND perf_braking <= 10);
ALTER TABLE cars ADD CONSTRAINT cars_perf_track_pace_check CHECK (perf_track_pace >= 1 AND perf_track_pace <= 10);
ALTER TABLE cars ADD CONSTRAINT cars_perf_drivability_check CHECK (perf_drivability >= 1 AND perf_drivability <= 10);
ALTER TABLE cars ADD CONSTRAINT cars_perf_reliability_heat_check CHECK (perf_reliability_heat >= 1 AND perf_reliability_heat <= 10);
ALTER TABLE cars ADD CONSTRAINT cars_perf_sound_emotion_check CHECK (perf_sound_emotion >= 1 AND perf_sound_emotion <= 10);


