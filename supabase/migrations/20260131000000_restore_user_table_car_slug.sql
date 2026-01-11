-- Migration: Restore car_slug to user_favorites and user_projects
-- Date: 2026-01-31
-- Reason: These are intentionally denormalized user-facing tables where car_slug is needed for:
--   - URL routing (linking to /cars/[slug])
--   - UI display identifier
--   - Snapshot data alongside car_name, car_years, car_hp
--   - Code inserts, reads, and deletes by this field

-- ============================================================================
-- STEP 1: Add car_slug columns back (idempotent)
-- ============================================================================

ALTER TABLE user_favorites ADD COLUMN IF NOT EXISTS car_slug TEXT;
ALTER TABLE user_projects ADD COLUMN IF NOT EXISTS car_slug TEXT;

-- ============================================================================
-- STEP 2: Backfill car_slug from car_id for existing records
-- ============================================================================

UPDATE user_favorites uf 
SET car_slug = c.slug 
FROM cars c 
WHERE uf.car_id = c.id AND uf.car_slug IS NULL;

UPDATE user_projects up 
SET car_slug = c.slug 
FROM cars c 
WHERE up.car_id = c.id AND up.car_slug IS NULL;

-- ============================================================================
-- STEP 3: Create triggers to auto-populate car_id from car_slug on insert
-- ============================================================================

-- The resolve_car_id_from_slug function should already exist from earlier migrations
-- but we create it idempotently just in case

CREATE OR REPLACE FUNCTION resolve_car_id_from_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- If car_slug is provided but car_id is not, resolve car_id from slug
  IF NEW.car_slug IS NOT NULL AND NEW.car_id IS NULL THEN
    SELECT id INTO NEW.car_id FROM cars WHERE slug = NEW.car_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist (to avoid duplicates)
DROP TRIGGER IF EXISTS auto_car_id_user_favorites ON user_favorites;
DROP TRIGGER IF EXISTS auto_car_id_user_projects ON user_projects;

-- Create the triggers
CREATE TRIGGER auto_car_id_user_favorites
  BEFORE INSERT OR UPDATE ON user_favorites
  FOR EACH ROW EXECUTE FUNCTION resolve_car_id_from_slug();

CREATE TRIGGER auto_car_id_user_projects
  BEFORE INSERT OR UPDATE ON user_projects
  FOR EACH ROW EXECUTE FUNCTION resolve_car_id_from_slug();

-- ============================================================================
-- STEP 4: Create indexes for efficient queries by car_slug
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_favorites_car_slug ON user_favorites(car_slug);
CREATE INDEX IF NOT EXISTS idx_user_projects_car_slug ON user_projects(car_slug);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- After running this migration, verify with:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name IN ('user_favorites', 'user_projects') AND column_name = 'car_slug';
-- Should return 2 rows
