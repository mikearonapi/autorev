-- ============================================================================
-- USER GALLERY IMAGES TABLE
-- AutoRev - AI-Generated Gallery Images for Owned Vehicles
--
-- This migration adds:
--   1. user_gallery_images table for AI-generated car images
--   2. Support for multiple scene types and carousel backgrounds
--   3. User preferences for collection background images
-- ============================================================================

-- ============================================================================
-- USER GALLERY IMAGES TABLE
-- Store AI-generated images for user's owned vehicles
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_gallery_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_vehicle_id UUID NOT NULL REFERENCES user_vehicles(id) ON DELETE CASCADE,
  
  -- Car reference for querying
  car_slug TEXT NOT NULL,
  
  -- Image details
  scene_type TEXT NOT NULL CHECK (scene_type IN (
    'scenic',     -- Mountain/coastal drives
    'coastal',    -- Beach/ocean settings
    'urban',      -- City/night scenes
    'track',      -- Race track/motorsports
    'studio',     -- Clean studio photography
    'garage'      -- Industrial garage setting
  )),
  
  image_url TEXT NOT NULL,
  
  -- Generation metadata
  prompt_used TEXT,  -- Store the prompt for reference
  generation_model TEXT DEFAULT 'gemini-3-pro-image-preview',
  
  -- User preferences
  is_background BOOLEAN DEFAULT false,  -- Selected as collection background
  is_favorite BOOLEAN DEFAULT false,
  display_order INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_gallery_images_user_id ON user_gallery_images(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gallery_images_vehicle_id ON user_gallery_images(user_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_user_gallery_images_car_slug ON user_gallery_images(car_slug);
CREATE INDEX IF NOT EXISTS idx_user_gallery_images_scene_type ON user_gallery_images(scene_type);
CREATE INDEX IF NOT EXISTS idx_user_gallery_images_is_background ON user_gallery_images(is_background) WHERE is_background = true;

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_user_gallery_images_updated_at ON user_gallery_images;
CREATE TRIGGER update_user_gallery_images_updated_at
  BEFORE UPDATE ON user_gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- USER COLLECTION SETTINGS TABLE
-- Store user preferences for their collection page
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_collection_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Background settings
  background_mode TEXT DEFAULT 'static' CHECK (background_mode IN (
    'static',     -- Single image background
    'carousel',   -- Rotating carousel of images
    'gradient'    -- Color gradient (no image)
  )),
  
  -- Carousel settings (if background_mode = 'carousel')
  carousel_interval_seconds INTEGER DEFAULT 5 CHECK (carousel_interval_seconds >= 3 AND carousel_interval_seconds <= 30),
  carousel_transition TEXT DEFAULT 'fade' CHECK (carousel_transition IN ('fade', 'slide', 'zoom')),
  
  -- Selected background image(s)
  background_image_id UUID REFERENCES user_gallery_images(id) ON DELETE SET NULL,
  carousel_image_ids UUID[] DEFAULT '{}',  -- Array of image IDs for carousel
  
  -- Display preferences
  show_vehicle_stats BOOLEAN DEFAULT true,
  show_maintenance_alerts BOOLEAN DEFAULT true,
  default_view TEXT DEFAULT 'grid' CHECK (default_view IN ('grid', 'list', 'hero')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_collection_settings_user_id ON user_collection_settings(user_id);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_user_collection_settings_updated_at ON user_collection_settings;
CREATE TRIGGER update_user_collection_settings_updated_at
  BEFORE UPDATE ON user_collection_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_collection_settings ENABLE ROW LEVEL SECURITY;

-- Gallery Images: Users can only access their own images
DROP POLICY IF EXISTS "Users can view own gallery images" ON user_gallery_images;
CREATE POLICY "Users can view own gallery images" ON user_gallery_images
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own gallery images" ON user_gallery_images;
CREATE POLICY "Users can insert own gallery images" ON user_gallery_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own gallery images" ON user_gallery_images;
CREATE POLICY "Users can update own gallery images" ON user_gallery_images
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own gallery images" ON user_gallery_images;
CREATE POLICY "Users can delete own gallery images" ON user_gallery_images
  FOR DELETE USING (auth.uid() = user_id);

-- Collection Settings: Users can only access their own settings
DROP POLICY IF EXISTS "Users can view own collection settings" ON user_collection_settings;
CREATE POLICY "Users can view own collection settings" ON user_collection_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own collection settings" ON user_collection_settings;
CREATE POLICY "Users can insert own collection settings" ON user_collection_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own collection settings" ON user_collection_settings;
CREATE POLICY "Users can update own collection settings" ON user_collection_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get gallery images for a user's vehicle with scene counts
CREATE OR REPLACE FUNCTION get_vehicle_gallery(
  p_vehicle_id UUID
)
RETURNS TABLE (
  id UUID,
  scene_type TEXT,
  image_url TEXT,
  is_background BOOLEAN,
  is_favorite BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.scene_type,
    g.image_url,
    g.is_background,
    g.is_favorite,
    g.created_at
  FROM user_gallery_images g
  WHERE g.user_vehicle_id = p_vehicle_id
  ORDER BY g.is_favorite DESC, g.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Set a gallery image as the collection background
CREATE OR REPLACE FUNCTION set_collection_background(
  p_user_id UUID,
  p_image_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Clear existing background selection for this user
  UPDATE user_gallery_images
  SET is_background = false
  WHERE user_id = p_user_id AND is_background = true;
  
  -- Set new background
  UPDATE user_gallery_images
  SET is_background = true
  WHERE id = p_image_id AND user_id = p_user_id;
  
  -- Update or create collection settings
  INSERT INTO user_collection_settings (user_id, background_image_id, background_mode)
  VALUES (p_user_id, p_image_id, 'static')
  ON CONFLICT (user_id) DO UPDATE SET
    background_image_id = p_image_id,
    background_mode = 'static',
    updated_at = NOW();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_gallery_images IS 'AI-generated gallery images for user owned vehicles';
COMMENT ON TABLE user_collection_settings IS 'User preferences for collection page display';
COMMENT ON COLUMN user_gallery_images.scene_type IS 'Type of scene: scenic, coastal, urban, track, studio, garage';
COMMENT ON COLUMN user_gallery_images.is_background IS 'Selected as collection page background';
COMMENT ON COLUMN user_collection_settings.carousel_interval_seconds IS 'Seconds between carousel transitions (3-30)';













