-- ============================================================================
-- Migration: Add car_id to Maintenance Tables
-- Date: January 11, 2026
-- Purpose: Add car_id column to vehicle_maintenance_specs and vehicle_service_intervals
--          for efficient UUID-based queries instead of string-based car_slug queries
-- ============================================================================

-- ============================================================================
-- 1. ADD car_id TO vehicle_maintenance_specs
-- ============================================================================

-- Add car_id column if not exists
ALTER TABLE vehicle_maintenance_specs
  ADD COLUMN IF NOT EXISTS car_id UUID;

-- Backfill car_id from cars table using car_slug
UPDATE vehicle_maintenance_specs vms
SET car_id = c.id
FROM cars c
WHERE vms.car_id IS NULL
  AND vms.car_slug IS NOT NULL
  AND vms.car_slug = c.slug;

-- Add foreign key constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'vehicle_maintenance_specs_car_id_fkey'
  ) THEN
    ALTER TABLE vehicle_maintenance_specs
      ADD CONSTRAINT vehicle_maintenance_specs_car_id_fkey
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_specs_car_id 
  ON vehicle_maintenance_specs(car_id);

-- Add trigger to auto-populate car_id on insert/update
DROP TRIGGER IF EXISTS auto_car_id_vehicle_maintenance_specs ON vehicle_maintenance_specs;

CREATE TRIGGER auto_car_id_vehicle_maintenance_specs
BEFORE INSERT OR UPDATE ON vehicle_maintenance_specs
FOR EACH ROW
EXECUTE FUNCTION resolve_car_id_from_slug();

COMMENT ON COLUMN vehicle_maintenance_specs.car_id IS 
'Foreign key to cars table. Auto-populated from car_slug via trigger. Use this for queries.';

-- ============================================================================
-- 2. ADD car_id TO vehicle_service_intervals
-- ============================================================================

-- Add car_id column if not exists
ALTER TABLE vehicle_service_intervals
  ADD COLUMN IF NOT EXISTS car_id UUID;

-- Backfill car_id from cars table using car_slug
UPDATE vehicle_service_intervals vsi
SET car_id = c.id
FROM cars c
WHERE vsi.car_id IS NULL
  AND vsi.car_slug IS NOT NULL
  AND vsi.car_slug = c.slug;

-- Add foreign key constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'vehicle_service_intervals_car_id_fkey'
  ) THEN
    ALTER TABLE vehicle_service_intervals
      ADD CONSTRAINT vehicle_service_intervals_car_id_fkey
      FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_vehicle_service_intervals_car_id 
  ON vehicle_service_intervals(car_id);

-- Add trigger to auto-populate car_id on insert/update
DROP TRIGGER IF EXISTS auto_car_id_vehicle_service_intervals ON vehicle_service_intervals;

CREATE TRIGGER auto_car_id_vehicle_service_intervals
BEFORE INSERT OR UPDATE ON vehicle_service_intervals
FOR EACH ROW
EXECUTE FUNCTION resolve_car_id_from_slug();

COMMENT ON COLUMN vehicle_service_intervals.car_id IS 
'Foreign key to cars table. Auto-populated from car_slug via trigger. Use this for queries.';

-- ============================================================================
-- 3. VERIFICATION QUERIES (Run manually to verify)
-- ============================================================================

-- After running migration, verify with:
-- SELECT 'vehicle_maintenance_specs' as tbl, COUNT(*) as total, COUNT(car_id) as with_car_id FROM vehicle_maintenance_specs
-- UNION ALL
-- SELECT 'vehicle_service_intervals', COUNT(*), COUNT(car_id) FROM vehicle_service_intervals;

-- Expected: All rows should have car_id populated (with_car_id = total)
