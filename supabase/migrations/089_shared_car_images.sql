-- ============================================================================
-- SHARED CAR IMAGES - Link Images by car_slug
-- AutoRev - Enable image sharing between Garage and Tuning Shop
--
-- This migration adds:
--   1. car_slug column to user_uploaded_images for cross-feature image lookup
--   2. car_id column for proper foreign key reference
--   3. Index on (user_id, car_slug) for efficient queries
--   4. Function to get images by car_slug (from both vehicles and builds)
--   5. Function to set hero image that syncs across features
--
-- Purpose: Allow images uploaded in Tuning Shop to appear in Garage and vice versa
-- ============================================================================

-- ============================================================================
-- ADD CAR_SLUG COLUMN TO user_uploaded_images
-- ============================================================================

-- Add car_slug column (nullable to support existing images)
ALTER TABLE user_uploaded_images
ADD COLUMN IF NOT EXISTS car_slug TEXT;

-- Add car_id column with foreign key reference
ALTER TABLE user_uploaded_images
ADD COLUMN IF NOT EXISTS car_id UUID REFERENCES cars(id) ON DELETE SET NULL;

-- Add original_file_size column if it doesn't exist (for compression tracking)
ALTER TABLE user_uploaded_images
ADD COLUMN IF NOT EXISTS original_file_size INTEGER;

-- Add media_type column if it doesn't exist (for videos)
ALTER TABLE user_uploaded_images
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video'));

-- Add duration_seconds column for videos
ALTER TABLE user_uploaded_images
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- Add video_thumbnail_url column for video previews
ALTER TABLE user_uploaded_images
ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;

-- Create composite index for efficient car_slug lookups per user
CREATE INDEX IF NOT EXISTS idx_user_uploaded_images_user_car_slug 
ON user_uploaded_images(user_id, car_slug);

-- Create index on car_id for joins
CREATE INDEX IF NOT EXISTS idx_user_uploaded_images_car_id 
ON user_uploaded_images(car_id);

-- ============================================================================
-- BACKFILL car_slug FROM EXISTING RELATIONSHIPS
-- ============================================================================

-- Backfill car_slug from user_vehicles (for vehicle images)
UPDATE user_uploaded_images ui
SET car_slug = uv.matched_car_slug,
    car_id = uv.matched_car_id
FROM user_vehicles uv
WHERE ui.user_vehicle_id = uv.id
  AND ui.car_slug IS NULL
  AND uv.matched_car_slug IS NOT NULL;

-- Backfill car_slug from user_projects (for build images)
UPDATE user_uploaded_images ui
SET car_slug = up.car_slug,
    car_id = up.car_id
FROM user_projects up
WHERE ui.user_build_id = up.id
  AND ui.car_slug IS NULL
  AND up.car_slug IS NOT NULL;

-- ============================================================================
-- GET IMAGES BY CAR SLUG FUNCTION
-- Returns all images for a specific car belonging to a user
-- (from both vehicles and builds)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_images_by_car_slug(
  p_user_id UUID,
  p_car_slug TEXT
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_vehicle_id UUID,
  user_build_id UUID,
  community_post_id UUID,
  car_slug TEXT,
  car_id UUID,
  blob_url TEXT,
  blob_pathname TEXT,
  thumbnail_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  content_type TEXT,
  caption TEXT,
  is_primary BOOLEAN,
  display_order INTEGER,
  media_type TEXT,
  duration_seconds INTEGER,
  video_thumbnail_url TEXT,
  is_approved BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ui.id,
    ui.user_id,
    ui.user_vehicle_id,
    ui.user_build_id,
    ui.community_post_id,
    ui.car_slug,
    ui.car_id,
    ui.blob_url,
    ui.blob_pathname,
    ui.thumbnail_url,
    ui.file_name,
    ui.file_size,
    ui.content_type,
    ui.caption,
    ui.is_primary,
    ui.display_order,
    ui.media_type,
    ui.duration_seconds,
    ui.video_thumbnail_url,
    ui.is_approved,
    ui.created_at
  FROM user_uploaded_images ui
  WHERE ui.user_id = p_user_id
    AND ui.car_slug = p_car_slug
    AND ui.is_approved = true
  ORDER BY ui.is_primary DESC, ui.display_order ASC, ui.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- SET HERO IMAGE FUNCTION
-- Sets is_primary on one image, clears it from all others for same user+car
-- ============================================================================

CREATE OR REPLACE FUNCTION set_car_hero_image(
  p_user_id UUID,
  p_car_slug TEXT,
  p_image_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_found BOOLEAN;
BEGIN
  -- Verify the image belongs to this user and car
  SELECT EXISTS(
    SELECT 1 FROM user_uploaded_images 
    WHERE id = p_image_id 
      AND user_id = p_user_id 
      AND car_slug = p_car_slug
      AND media_type = 'image'  -- Only images can be hero (not videos)
  ) INTO v_found;
  
  IF NOT v_found THEN
    RETURN FALSE;
  END IF;
  
  -- Clear is_primary from all images for this user+car
  UPDATE user_uploaded_images
  SET is_primary = FALSE, updated_at = NOW()
  WHERE user_id = p_user_id 
    AND car_slug = p_car_slug
    AND is_primary = TRUE;
  
  -- Set the new hero image
  UPDATE user_uploaded_images
  SET is_primary = TRUE, updated_at = NOW()
  WHERE id = p_image_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLEAR HERO IMAGE FUNCTION  
-- Clears is_primary from all images for a user+car (revert to stock)
-- ============================================================================

CREATE OR REPLACE FUNCTION clear_car_hero_image(
  p_user_id UUID,
  p_car_slug TEXT
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE user_uploaded_images
  SET is_primary = FALSE, updated_at = NOW()
  WHERE user_id = p_user_id 
    AND car_slug = p_car_slug
    AND is_primary = TRUE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: AUTO-POPULATE car_slug AND car_id ON INSERT/UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_populate_car_slug_from_associations()
RETURNS TRIGGER AS $$
BEGIN
  -- If car_slug is not set, try to derive it from associations
  IF NEW.car_slug IS NULL THEN
    -- Try from user_vehicle
    IF NEW.user_vehicle_id IS NOT NULL THEN
      SELECT matched_car_slug, matched_car_id
      INTO NEW.car_slug, NEW.car_id
      FROM user_vehicles
      WHERE id = NEW.user_vehicle_id;
    END IF;
    
    -- Try from user_project (build)
    IF NEW.car_slug IS NULL AND NEW.user_build_id IS NOT NULL THEN
      SELECT car_slug, car_id
      INTO NEW.car_slug, NEW.car_id
      FROM user_projects
      WHERE id = NEW.user_build_id;
    END IF;
  END IF;
  
  -- If car_id is not set but car_slug is, resolve it
  IF NEW.car_id IS NULL AND NEW.car_slug IS NOT NULL THEN
    SELECT id INTO NEW.car_id FROM cars WHERE slug = NEW.car_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS auto_populate_image_car_slug ON user_uploaded_images;
CREATE TRIGGER auto_populate_image_car_slug
  BEFORE INSERT OR UPDATE ON user_uploaded_images
  FOR EACH ROW
  EXECUTE FUNCTION auto_populate_car_slug_from_associations();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN user_uploaded_images.car_slug IS 'Car slug for cross-feature image sharing between Garage and Tuning Shop';
COMMENT ON COLUMN user_uploaded_images.car_id IS 'Foreign key to cars table for efficient joins';
COMMENT ON FUNCTION get_user_images_by_car_slug IS 'Get all images for a specific car belonging to a user';
COMMENT ON FUNCTION set_car_hero_image IS 'Set an image as the hero (primary) image for a user+car combination';
COMMENT ON FUNCTION clear_car_hero_image IS 'Clear hero image selection for a user+car (revert to stock)';
