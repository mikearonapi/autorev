-- ============================================================================
-- Migration 081: Improved View Tracking
-- 
-- Creates a more accurate view counting system:
-- 1. Tracks individual views in a separate table
-- 2. Deduplicates by session/IP within a 1-hour window
-- 3. Excludes owner views
-- 4. Updates community_posts.view_count as a cached counter
-- ============================================================================

-- ============================================================================
-- VIEW TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_post_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  
  -- Viewer info (for deduplication)
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- NULL for anonymous
  session_id TEXT,          -- Browser session ID
  ip_hash TEXT,             -- Hashed IP for privacy-safe dedup
  user_agent_hash TEXT,     -- Hashed user agent
  referer TEXT,             -- Where they came from
  
  -- Timestamp
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient deduplication queries
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON community_post_views(community_post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_viewer_id ON community_post_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_post_views_session ON community_post_views(session_id);
CREATE INDEX IF NOT EXISTS idx_post_views_viewed_at ON community_post_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_post_views_dedup ON community_post_views(community_post_id, ip_hash, viewed_at);

-- RLS
ALTER TABLE community_post_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can track views" ON community_post_views;
CREATE POLICY "Anyone can track views" ON community_post_views
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read views" ON community_post_views;
CREATE POLICY "Admins can read views" ON community_post_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND subscription_tier = 'admin')
  );

-- ============================================================================
-- SMART VIEW TRACKING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION track_community_post_view(
  p_post_id UUID,
  p_viewer_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL,
  p_user_agent_hash TEXT DEFAULT NULL,
  p_referer TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_post_owner_id UUID;
  v_recent_view_exists BOOLEAN;
  v_dedup_window INTERVAL := INTERVAL '1 hour';  -- Same visitor within 1 hour = 1 view
BEGIN
  -- Get post owner
  SELECT user_id INTO v_post_owner_id
  FROM community_posts
  WHERE id = p_post_id;
  
  IF v_post_owner_id IS NULL THEN
    RETURN false;  -- Post doesn't exist
  END IF;
  
  -- Skip if viewer is the post owner
  IF p_viewer_id IS NOT NULL AND p_viewer_id = v_post_owner_id THEN
    RETURN false;  -- Don't count owner's views
  END IF;
  
  -- Check for recent view from same source (deduplication)
  SELECT EXISTS(
    SELECT 1 FROM community_post_views
    WHERE community_post_id = p_post_id
      AND viewed_at > NOW() - v_dedup_window
      AND (
        -- Same authenticated user
        (p_viewer_id IS NOT NULL AND viewer_id = p_viewer_id)
        -- OR same session
        OR (p_session_id IS NOT NULL AND session_id = p_session_id)
        -- OR same IP (for anonymous users without session)
        OR (p_ip_hash IS NOT NULL AND ip_hash = p_ip_hash AND viewer_id IS NULL AND session_id IS NULL)
      )
  ) INTO v_recent_view_exists;
  
  IF v_recent_view_exists THEN
    RETURN false;  -- Already counted this view recently
  END IF;
  
  -- Insert the view record
  INSERT INTO community_post_views (
    community_post_id,
    viewer_id,
    session_id,
    ip_hash,
    user_agent_hash,
    referer
  ) VALUES (
    p_post_id,
    p_viewer_id,
    p_session_id,
    p_ip_hash,
    p_user_agent_hash,
    p_referer
  );
  
  -- Increment the cached view count on community_posts
  UPDATE community_posts
  SET view_count = view_count + 1
  WHERE id = p_post_id;
  
  RETURN true;  -- View was counted
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE GET_COMMUNITY_POST_BY_SLUG TO NOT AUTO-INCREMENT
-- ============================================================================

-- The function was updated to NOT auto-increment view_count
-- Views are now tracked via track_community_post_view() called from the client
-- This allows for proper deduplication

DROP FUNCTION IF EXISTS get_community_post_by_slug(TEXT);

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
  SELECT id, car_slug INTO v_post_id, v_car_slug
  FROM community_posts
  WHERE slug = p_slug
    AND is_published = true
    AND is_approved = true;
  
  IF v_post_id IS NULL THEN
    RETURN;
  END IF;
  
  -- NOTE: View count is now tracked separately via track_community_post_view()
  -- This function no longer auto-increments views
  
  RETURN QUERY
  SELECT
    to_jsonb(cp.*) AS post,
    jsonb_build_object(
      'user_id', up.id,
      'display_name', up.display_name,
      'public_slug', up.public_slug,
      'avatar_url', up.avatar_url,
      'bio', up.bio,
      'tier', up.subscription_tier,
      'location_city', up.location_city,
      'location_state', up.location_state
    ) AS author,
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
    CASE WHEN cp.user_vehicle_id IS NOT NULL THEN
      (SELECT to_jsonb(uv.*) FROM user_vehicles uv WHERE uv.id = cp.user_vehicle_id)
    ELSE NULL END AS vehicle_data,
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
    (SELECT c.image_url FROM cars c WHERE c.slug = v_car_slug LIMIT 1) AS car_image_url
  FROM community_posts cp
  JOIN user_profiles up ON up.id = cp.user_id
  WHERE cp.id = v_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UTILITY: Get accurate view count from tracking table
-- ============================================================================

CREATE OR REPLACE FUNCTION get_accurate_view_count(p_post_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM community_post_views
    WHERE community_post_id = p_post_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE community_post_views IS 'Individual view tracking for community posts with smart deduplication';
COMMENT ON FUNCTION track_community_post_view IS 'Track a view with 1-hour dedup window, excludes owner views';
COMMENT ON FUNCTION get_accurate_view_count IS 'Get accurate view count from tracking table';

