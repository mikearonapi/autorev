-- ============================================================================
-- Migration 080: Community Build Enhancements
-- 
-- Adds:
-- 1. community_post_parts - detailed parts/mods specific to community posts
-- 2. Enhanced get_community_post_by_slug to include upgrades and parts
-- 3. Functions for managing community post parts and images
--
-- Purpose: Allow users to add detailed part/mod info and manage images for
-- their community builds, separate from saved projects.
-- ============================================================================

-- ============================================================================
-- COMMUNITY POST PARTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_post_parts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  
  -- Part/Mod category (matches upgrade categories)
  category TEXT NOT NULL CHECK (category IN (
    'intake', 'exhaust', 'ecu', 'turbo', 'supercharger',
    'intercooler', 'fuel', 'engine', 'suspension', 'brakes',
    'wheels', 'tires', 'aero', 'interior', 'exterior', 'other'
  )),
  
  -- Part details
  mod_type TEXT NOT NULL,           -- e.g., "Cold Air Intake", "Downpipe", "Coilovers"
  brand_name TEXT,                  -- e.g., "Cobb", "Koni", "Eibach"
  product_name TEXT,                -- e.g., "Accessport V3", "Yellow Sport"
  part_number TEXT,                 -- Optional part number
  
  -- Performance impact (user-reported)
  hp_gain INTEGER DEFAULT 0,        -- Estimated HP gain
  tq_gain INTEGER DEFAULT 0,        -- Estimated torque gain
  
  -- Cost
  price_paid INTEGER,               -- Price in cents (what user paid)
  currency TEXT DEFAULT 'USD',
  
  -- Installation
  install_type TEXT CHECK (install_type IN ('diy', 'shop', 'dealer')),
  install_notes TEXT,               -- Any installation notes
  
  -- User notes
  notes TEXT,                       -- General notes about this mod
  is_recommended BOOLEAN DEFAULT true,  -- Would recommend?
  
  -- Links
  product_url TEXT,                 -- Link to product
  
  -- Display
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_post_parts_post_id ON community_post_parts(community_post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_parts_category ON community_post_parts(category);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_community_post_parts_updated_at ON community_post_parts;
CREATE TRIGGER update_community_post_parts_updated_at
  BEFORE UPDATE ON community_post_parts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY FOR COMMUNITY POST PARTS
-- ============================================================================

ALTER TABLE community_post_parts ENABLE ROW LEVEL SECURITY;

-- Anyone can view parts for published posts
DROP POLICY IF EXISTS "Anyone can view parts for published posts" ON community_post_parts;
CREATE POLICY "Anyone can view parts for published posts" ON community_post_parts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_posts cp 
      WHERE cp.id = community_post_id 
      AND cp.is_published = true 
      AND cp.is_approved = true
    )
    OR
    EXISTS (
      SELECT 1 FROM community_posts cp 
      WHERE cp.id = community_post_id 
      AND cp.user_id = auth.uid()
    )
  );

-- Users can manage parts on their own posts
DROP POLICY IF EXISTS "Users can insert own post parts" ON community_post_parts;
CREATE POLICY "Users can insert own post parts" ON community_post_parts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_posts cp 
      WHERE cp.id = community_post_id 
      AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own post parts" ON community_post_parts;
CREATE POLICY "Users can update own post parts" ON community_post_parts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM community_posts cp 
      WHERE cp.id = community_post_id 
      AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own post parts" ON community_post_parts;
CREATE POLICY "Users can delete own post parts" ON community_post_parts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM community_posts cp 
      WHERE cp.id = community_post_id 
      AND cp.user_id = auth.uid()
    )
  );

-- ============================================================================
-- ENHANCED GET COMMUNITY POST FUNCTION
-- ============================================================================

-- Drop existing function first (different return type)
DROP FUNCTION IF EXISTS get_community_post_by_slug(TEXT);

-- Recreate with parts and upgrades support
CREATE OR REPLACE FUNCTION get_community_post_by_slug(p_slug TEXT)
RETURNS TABLE (
  post JSONB,
  author JSONB,
  images JSONB,
  build_data JSONB,
  vehicle_data JSONB,
  parts JSONB,
  car_image_url TEXT
) AS $$
DECLARE
  v_post_id UUID;
  v_car_slug TEXT;
BEGIN
  -- Get post ID and car_slug
  SELECT id, car_slug INTO v_post_id, v_car_slug
  FROM community_posts
  WHERE slug = p_slug
    AND is_published = true
    AND is_approved = true;
  
  IF v_post_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Increment view count
  UPDATE community_posts SET view_count = view_count + 1 WHERE id = v_post_id;
  
  RETURN QUERY
  SELECT
    to_jsonb(cp.*) AS post,
    jsonb_build_object(
      'user_id', up.id,
      'display_name', up.display_name,
      'public_slug', up.public_slug,
      'avatar_url', up.avatar_url,
      'bio', up.bio,
      'tier', up.tier,
      'location_city', up.location_city,
      'location_state', up.location_state
    ) AS author,
    -- Images with full details
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ui.id,
          'blob_url', ui.blob_url,
          'thumbnail_url', ui.thumbnail_url,
          'caption', ui.caption,
          'is_primary', ui.is_primary,
          'display_order', ui.display_order,
          'width', ui.width,
          'height', ui.height
        ) ORDER BY ui.is_primary DESC, ui.display_order ASC, ui.created_at ASC
      )
      FROM user_uploaded_images ui
      WHERE ui.community_post_id = cp.id
        AND ui.is_approved = true
    ), '[]'::jsonb) AS images,
    -- Build data including selected_upgrades
    CASE WHEN cp.user_build_id IS NOT NULL THEN
      (
        SELECT jsonb_build_object(
          'id', usb.id,
          'project_name', usb.project_name,
          'selected_upgrades', usb.selected_upgrades,
          'total_hp_gain', usb.total_hp_gain,
          'total_cost_low', usb.total_cost_low,
          'total_cost_high', usb.total_cost_high,
          'final_hp', usb.final_hp,
          'notes', usb.notes,
          'created_at', usb.created_at,
          -- Include user_project_parts if any
          'project_parts', COALESCE((
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', upp.id,
                'part_name', upp.part_name,
                'brand_name', upp.brand_name,
                'part_number', upp.part_number,
                'category', upp.category,
                'vendor_name', upp.vendor_name,
                'product_url', upp.product_url,
                'price_cents', upp.price_cents,
                'requires_tune', upp.requires_tune,
                'install_difficulty', upp.install_difficulty,
                'fitment_notes', upp.fitment_notes
              ) ORDER BY upp.category, upp.created_at
            )
            FROM user_project_parts upp
            WHERE upp.project_id = usb.id
          ), '[]'::jsonb)
        )
        FROM user_projects usb 
        WHERE usb.id = cp.user_build_id
      )
    ELSE NULL END AS build_data,
    -- Vehicle data
    CASE WHEN cp.user_vehicle_id IS NOT NULL THEN
      (SELECT to_jsonb(uv.*) FROM user_vehicles uv WHERE uv.id = cp.user_vehicle_id)
    ELSE NULL END AS vehicle_data,
    -- Community post specific parts
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', cpp.id,
          'category', cpp.category,
          'mod_type', cpp.mod_type,
          'brand_name', cpp.brand_name,
          'product_name', cpp.product_name,
          'part_number', cpp.part_number,
          'hp_gain', cpp.hp_gain,
          'tq_gain', cpp.tq_gain,
          'price_paid', cpp.price_paid,
          'currency', cpp.currency,
          'install_type', cpp.install_type,
          'install_notes', cpp.install_notes,
          'notes', cpp.notes,
          'is_recommended', cpp.is_recommended,
          'product_url', cpp.product_url,
          'display_order', cpp.display_order
        ) ORDER BY cpp.display_order, cpp.category, cpp.created_at
      )
      FROM community_post_parts cpp
      WHERE cpp.community_post_id = cp.id
    ), '[]'::jsonb) AS parts,
    -- Car image fallback
    (SELECT c.image_url FROM cars c WHERE c.slug = v_car_slug LIMIT 1) AS car_image_url
  FROM community_posts cp
  JOIN user_profiles up ON up.id = cp.user_id
  WHERE cp.id = v_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Set primary image
-- ============================================================================

CREATE OR REPLACE FUNCTION set_primary_image(
  p_image_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_post_id UUID;
BEGIN
  -- Get the community post ID and verify ownership
  SELECT ui.community_post_id INTO v_post_id
  FROM user_uploaded_images ui
  JOIN community_posts cp ON cp.id = ui.community_post_id
  WHERE ui.id = p_image_id
    AND cp.user_id = p_user_id;
    
  IF v_post_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Clear existing primary
  UPDATE user_uploaded_images
  SET is_primary = false
  WHERE community_post_id = v_post_id
    AND is_primary = true;
  
  -- Set new primary
  UPDATE user_uploaded_images
  SET is_primary = true
  WHERE id = p_image_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Reorder images
-- ============================================================================

CREATE OR REPLACE FUNCTION reorder_post_images(
  p_post_id UUID,
  p_user_id UUID,
  p_image_order UUID[]  -- Array of image IDs in desired order
)
RETURNS BOOLEAN AS $$
DECLARE
  v_idx INTEGER := 0;
  v_image_id UUID;
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM community_posts 
    WHERE id = p_post_id AND user_id = p_user_id
  ) THEN
    RETURN false;
  END IF;
  
  -- Update display_order for each image
  FOREACH v_image_id IN ARRAY p_image_order LOOP
    UPDATE user_uploaded_images
    SET display_order = v_idx
    WHERE id = v_image_id
      AND community_post_id = p_post_id;
    v_idx := v_idx + 1;
  END LOOP;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE community_post_parts IS 'User-specified parts/mods for community build posts';
COMMENT ON COLUMN community_post_parts.category IS 'Upgrade category (matches mod planner categories)';
COMMENT ON COLUMN community_post_parts.mod_type IS 'Type of modification (e.g., Cold Air Intake, Coilovers)';
COMMENT ON COLUMN community_post_parts.brand_name IS 'Brand/manufacturer name';
COMMENT ON COLUMN community_post_parts.product_name IS 'Specific product name or model';
COMMENT ON FUNCTION set_primary_image IS 'Set an image as the primary/hero image for a community post';
COMMENT ON FUNCTION reorder_post_images IS 'Reorder images for a community post';

