-- ============================================================================
-- Migration: 055_car_concierge_tracking.sql
-- Purpose: Add Car Concierge maintenance tracking fields to user_vehicles
-- Date: 2025-12-29
-- Notes:
--   - Adds tracking fields for starts, battery, storage, tires, registration/
--     inspection, quick service info, notes, and AL health metadata.
--   - Battery status is constrained to an allowed enum-like set.
-- ============================================================================

ALTER TABLE user_vehicles
  ADD COLUMN IF NOT EXISTS last_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS battery_status TEXT DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS battery_installed_date DATE,
  ADD COLUMN IF NOT EXISTS storage_mode BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tire_installed_date DATE,
  ADD COLUMN IF NOT EXISTS tire_brand_model TEXT,
  ADD COLUMN IF NOT EXISTS tire_tread_32nds INTEGER,
  ADD COLUMN IF NOT EXISTS registration_due_date DATE,
  ADD COLUMN IF NOT EXISTS inspection_due_date DATE,
  ADD COLUMN IF NOT EXISTS last_inspection_date DATE,
  ADD COLUMN IF NOT EXISTS last_oil_change_date DATE,
  ADD COLUMN IF NOT EXISTS last_oil_change_mileage INTEGER,
  ADD COLUMN IF NOT EXISTS next_oil_due_mileage INTEGER,
  ADD COLUMN IF NOT EXISTS owner_notes TEXT,
  ADD COLUMN IF NOT EXISTS health_last_analyzed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_vehicles_battery_status_check'
  ) THEN
    ALTER TABLE user_vehicles
      ADD CONSTRAINT user_vehicles_battery_status_check
      CHECK (battery_status IN ('good', 'fair', 'weak', 'dead', 'unknown'));
  END IF;
END $$;

COMMENT ON COLUMN user_vehicles.battery_status IS
  'Battery health status: good, fair, weak, dead, or unknown (default).';


