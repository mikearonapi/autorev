-- Migration: 051_garage_analysis_enhancements.sql
-- Purpose: Add location fields to user_profiles and enhanced tracking to user_vehicles
-- for comprehensive AL garage analysis feature
-- Date: 2024-12-29

-- =============================================================================
-- Add location fields to user_profiles
-- =============================================================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS location_zip text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS location_city text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS location_state text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS location_updated_at timestamptz;

-- Add comment explaining the fields
COMMENT ON COLUMN user_profiles.location_zip IS 'User ZIP code for local event recommendations';
COMMENT ON COLUMN user_profiles.location_city IS 'Auto-populated city from ZIP lookup';
COMMENT ON COLUMN user_profiles.location_state IS 'Auto-populated state from ZIP lookup';
COMMENT ON COLUMN user_profiles.location_updated_at IS 'When location was last updated';

-- =============================================================================
-- Add enhanced tracking fields to user_vehicles
-- =============================================================================

-- Mileage tracking with timestamp
ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS mileage_updated_at timestamptz;

-- Usage type for better maintenance calculations
ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS usage_type text DEFAULT 'daily';

-- Brake fluid tracking (complements existing oil change tracking)
ALTER TABLE user_vehicles ADD COLUMN IF NOT EXISTS last_brake_fluid_date date;

-- Add comments
COMMENT ON COLUMN user_vehicles.mileage_updated_at IS 'When mileage was last updated, for staleness checks';
COMMENT ON COLUMN user_vehicles.usage_type IS 'Vehicle usage type: daily, weekend, track, stored';
COMMENT ON COLUMN user_vehicles.last_brake_fluid_date IS 'Date of last brake fluid change';

-- Add check constraint for usage_type
ALTER TABLE user_vehicles DROP CONSTRAINT IF EXISTS user_vehicles_usage_type_check;
ALTER TABLE user_vehicles ADD CONSTRAINT user_vehicles_usage_type_check 
  CHECK (usage_type IN ('daily', 'weekend', 'track', 'stored'));

-- =============================================================================
-- Indexes for efficient queries
-- =============================================================================

-- Index for querying vehicles by user and mileage
CREATE INDEX IF NOT EXISTS idx_user_vehicles_user_mileage 
  ON user_vehicles(user_id, mileage) 
  WHERE mileage IS NOT NULL;

-- Index for querying profiles by location
CREATE INDEX IF NOT EXISTS idx_user_profiles_location_zip 
  ON user_profiles(location_zip) 
  WHERE location_zip IS NOT NULL;

-- =============================================================================
-- Update trigger for mileage_updated_at
-- =============================================================================

-- Create function to auto-update mileage_updated_at when mileage changes
CREATE OR REPLACE FUNCTION update_mileage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mileage IS DISTINCT FROM OLD.mileage THEN
    NEW.mileage_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_mileage_timestamp ON user_vehicles;

-- Create trigger
CREATE TRIGGER trigger_update_mileage_timestamp
  BEFORE UPDATE ON user_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_mileage_timestamp();

-- =============================================================================
-- Update trigger for location_updated_at
-- =============================================================================

-- Create function to auto-update location_updated_at when location changes
CREATE OR REPLACE FUNCTION update_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location_zip IS DISTINCT FROM OLD.location_zip 
     OR NEW.location_city IS DISTINCT FROM OLD.location_city 
     OR NEW.location_state IS DISTINCT FROM OLD.location_state THEN
    NEW.location_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_update_location_timestamp ON user_profiles;

-- Create trigger
CREATE TRIGGER trigger_update_location_timestamp
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_location_timestamp();

