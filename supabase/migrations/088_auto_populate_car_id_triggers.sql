-- =============================================================================
-- Migration: Auto-populate car_id from car_slug
-- 
-- Purpose: Create triggers to automatically populate car_id from car_slug
-- on INSERT/UPDATE operations, preventing NULL car_id values in the future.
-- 
-- This ensures data integrity across all car-related tables.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Function: resolve_car_id_from_slug
-- 
-- Generic trigger function that resolves car_id from car_slug.
-- Handles both standard tables (car_slug -> car_id) and user_vehicles
-- (matched_car_slug -> matched_car_id).
-- -----------------------------------------------------------------------------
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

-- Add comment for documentation
COMMENT ON FUNCTION resolve_car_id_from_slug() IS 
'Trigger function that auto-populates car_id from car_slug on INSERT/UPDATE. 
Handles user_vehicles (matched_car_slug -> matched_car_id) specially.';

-- -----------------------------------------------------------------------------
-- Drop existing triggers if they exist (idempotent)
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS auto_car_id_user_favorites ON user_favorites;
DROP TRIGGER IF EXISTS auto_car_id_user_projects ON user_projects;
DROP TRIGGER IF EXISTS auto_car_id_user_vehicles ON user_vehicles;
DROP TRIGGER IF EXISTS auto_car_id_car_recalls ON car_recalls;
DROP TRIGGER IF EXISTS auto_car_id_youtube_video_car_links ON youtube_video_car_links;

-- -----------------------------------------------------------------------------
-- Create triggers for each table
-- -----------------------------------------------------------------------------

-- user_favorites: car_slug -> car_id
CREATE TRIGGER auto_car_id_user_favorites
  BEFORE INSERT OR UPDATE ON user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION resolve_car_id_from_slug();

-- user_projects: car_slug -> car_id
CREATE TRIGGER auto_car_id_user_projects
  BEFORE INSERT OR UPDATE ON user_projects
  FOR EACH ROW
  EXECUTE FUNCTION resolve_car_id_from_slug();

-- user_vehicles: matched_car_slug -> matched_car_id
CREATE TRIGGER auto_car_id_user_vehicles
  BEFORE INSERT OR UPDATE ON user_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION resolve_car_id_from_slug();

-- car_recalls: car_slug -> car_id
CREATE TRIGGER auto_car_id_car_recalls
  BEFORE INSERT OR UPDATE ON car_recalls
  FOR EACH ROW
  EXECUTE FUNCTION resolve_car_id_from_slug();

-- youtube_video_car_links: car_slug -> car_id
CREATE TRIGGER auto_car_id_youtube_video_car_links
  BEFORE INSERT OR UPDATE ON youtube_video_car_links
  FOR EACH ROW
  EXECUTE FUNCTION resolve_car_id_from_slug();

-- -----------------------------------------------------------------------------
-- Verification query (run manually to confirm triggers are active)
-- -----------------------------------------------------------------------------
-- SELECT 
--   tgname as trigger_name,
--   tgrelid::regclass as table_name,
--   tgenabled as enabled
-- FROM pg_trigger
-- WHERE tgname LIKE 'auto_car_id_%';
