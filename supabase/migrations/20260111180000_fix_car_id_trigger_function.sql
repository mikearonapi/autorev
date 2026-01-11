-- Migration: Fix resolve_car_id_from_slug function
-- Date: January 11, 2026
-- Purpose: Restore the smart trigger function that handles tables with non-standard column names
--
-- PROBLEM: A previous migration overwrote the smart function with a simpler version
-- that only handled standard car_slug/car_id columns, breaking user_vehicles which
-- uses matched_car_slug/matched_car_id.
--
-- AFFECTED TABLES WITH NON-STANDARD COLUMNS:
-- - user_vehicles: matched_car_slug -> matched_car_id
-- - youtube_ingestion_queue: target_car_slug -> target_car_id
-- - al_conversations: initial_car_slug (read-only, no car_id column)

-- ============================================================================
-- RESTORE SMART FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION resolve_car_id_from_slug()
RETURNS TRIGGER AS $$
DECLARE
  resolved_id UUID;
BEGIN
  -- Handle user_vehicles table (uses matched_car_slug/matched_car_id)
  IF TG_TABLE_NAME = 'user_vehicles' THEN
    IF NEW.matched_car_id IS NULL AND NEW.matched_car_slug IS NOT NULL THEN
      SELECT id INTO resolved_id FROM cars WHERE slug = NEW.matched_car_slug;
      IF resolved_id IS NOT NULL THEN
        NEW.matched_car_id := resolved_id;
      END IF;
    END IF;
  -- Handle youtube_ingestion_queue (uses target_car_slug/target_car_id)
  ELSIF TG_TABLE_NAME = 'youtube_ingestion_queue' THEN
    IF NEW.target_car_id IS NULL AND NEW.target_car_slug IS NOT NULL THEN
      SELECT id INTO resolved_id FROM cars WHERE slug = NEW.target_car_slug;
      IF resolved_id IS NOT NULL THEN
        NEW.target_car_id := resolved_id;
      END IF;
    END IF;
  -- Handle standard tables with car_slug/car_id columns
  ELSIF NEW.car_id IS NULL AND NEW.car_slug IS NOT NULL THEN
    SELECT id INTO resolved_id FROM cars WHERE slug = NEW.car_slug;
    IF resolved_id IS NOT NULL THEN
      NEW.car_id := resolved_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add documentation comment
COMMENT ON FUNCTION resolve_car_id_from_slug() IS 
'Trigger function that auto-populates car_id from car_slug on INSERT/UPDATE.
Handles special cases:
- user_vehicles: matched_car_slug -> matched_car_id
- youtube_ingestion_queue: target_car_slug -> target_car_id
- Standard tables: car_slug -> car_id

IMPORTANT: When adding new tables with non-standard car reference columns,
update this function to handle them explicitly.';

-- ============================================================================
-- ENSURE TRIGGER EXISTS ON user_vehicles
-- ============================================================================

DROP TRIGGER IF EXISTS auto_car_id_user_vehicles ON user_vehicles;
CREATE TRIGGER auto_car_id_user_vehicles
  BEFORE INSERT OR UPDATE ON user_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION resolve_car_id_from_slug();
