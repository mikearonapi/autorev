-- ============================================================================
-- USER UPLOADS & COMMUNITY POSTS
-- AutoRev - User-Generated Content for Community Sharing
--
-- This migration adds:
--   1. user_uploaded_images table for user photo uploads
--   2. community_posts table for public garage/build shares
--   3. Functions for managing uploads and posts
--
-- Purpose: Enable users to upload photos and share builds publicly
-- ============================================================================

-- ============================================================================
-- USER UPLOADED IMAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_uploaded_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Optional associations
  user_vehicle_id UUID REFERENCES user_vehicles(id) ON DELETE SET NULL,
  user_build_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,
  community_post_id UUID,  -- Will add FK after creating community_posts
  
  -- Image storage (Vercel Blob)
  blob_url TEXT NOT NULL,
  blob_pathname TEXT,  -- Path in blob storage for deletion
  thumbnail_url TEXT,  -- Optional smaller version
  
  -- Metadata
  file_name TEXT,
  file_size INTEGER,  -- bytes
  content_type TEXT,  -- e.g., 'image/jpeg'
  width INTEGER,
  height INTEGER,
  
  -- User content
  caption TEXT,
  alt_text TEXT,
  
  -- Display settings
  is_primary BOOLEAN DEFAULT false,  -- Primary image for vehicle/build
  display_order INTEGER DEFAULT 0,
  
  -- Source tracking
  upload_source TEXT DEFAULT 'web' CHECK (upload_source IN ('web', 'mobile', 'api')),
  
  -- Moderation
  is_approved BOOLEAN DEFAULT true,  -- Auto-approved by default
  is_flagged BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_uploaded_images_user_id ON user_uploaded_images(user_id);
CREATE INDEX IF NOT EXISTS idx_user_uploaded_images_vehicle_id ON user_uploaded_images(user_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_user_uploaded_images_build_id ON user_uploaded_images(user_build_id);
CREATE INDEX IF NOT EXISTS idx_user_uploaded_images_post_id ON user_uploaded_images(community_post_id);
CREATE INDEX IF NOT EXISTS idx_user_uploaded_images_primary ON user_uploaded_images(is_primary) WHERE is_primary = true;

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_user_uploaded_images_updated_at ON user_uploaded_images;
CREATE TRIGGER update_user_uploaded_images_updated_at
  BEFORE UPDATE ON user_uploaded_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMUNITY POSTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Post type and content
  post_type TEXT NOT NULL CHECK (post_type IN ('garage', 'build', 'vehicle')),
  title TEXT NOT NULL,
  description TEXT,
  
  -- References (depends on post_type)
  user_vehicle_id UUID REFERENCES user_vehicles(id) ON DELETE SET NULL,
  user_build_id UUID REFERENCES user_projects(id) ON DELETE SET NULL,
  
  -- Car reference (for filtering/discovery)
  car_slug TEXT,
  car_name TEXT,
  
  -- SEO-friendly slug
  slug TEXT UNIQUE NOT NULL,
  
  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  
  -- Featured/highlighted
  is_featured BOOLEAN DEFAULT false,
  featured_at TIMESTAMPTZ,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT true,
  is_flagged BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  
  -- Publishing
  is_published BOOLEAN DEFAULT true,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for community_post_id in user_uploaded_images
ALTER TABLE user_uploaded_images
  ADD CONSTRAINT fk_community_post
  FOREIGN KEY (community_post_id) 
  REFERENCES community_posts(id) 
  ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_slug ON community_posts(slug);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_car_slug ON community_posts(car_slug);
CREATE INDEX IF NOT EXISTS idx_community_posts_published ON community_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_featured ON community_posts(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_community_posts_views ON community_posts(view_count DESC);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_posts;
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SLUG GENERATION FUNCTION
-- ============================================================================

-- Generate unique slug for community post
CREATE OR REPLACE FUNCTION generate_community_post_slug(
  p_title TEXT,
  p_user_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_base_slug TEXT;
  v_slug TEXT;
  v_counter INTEGER := 0;
BEGIN
  -- Create base slug from title
  v_base_slug := LOWER(REGEXP_REPLACE(
    REGEXP_REPLACE(p_title, '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  ));
  
  -- Truncate to reasonable length
  v_base_slug := LEFT(v_base_slug, 50);
  
  -- Remove trailing hyphens
  v_base_slug := REGEXP_REPLACE(v_base_slug, '-+$', '');
  
  -- Add random suffix for uniqueness
  v_slug := v_base_slug || '-' || SUBSTRING(p_user_id::TEXT, 1, 8);
  
  -- Check for collisions and add counter if needed
  WHILE EXISTS(SELECT 1 FROM community_posts WHERE slug = v_slug) LOOP
    v_counter := v_counter + 1;
    v_slug := v_base_slug || '-' || v_counter || '-' || SUBSTRING(p_user_id::TEXT, 1, 8);
  END LOOP;
  
  RETURN v_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMUNITY POSTS FUNCTIONS
-- ============================================================================

-- Get published community posts with author and images
CREATE OR REPLACE FUNCTION get_community_posts(
  p_post_type TEXT DEFAULT NULL,
  p_car_slug TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  post_type TEXT,
  title TEXT,
  description TEXT,
  car_slug TEXT,
  car_name TEXT,
  view_count INTEGER,
  like_count INTEGER,
  is_featured BOOLEAN,
  published_at TIMESTAMPTZ,
  author JSONB,
  images JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.slug,
    cp.post_type,
    cp.title,
    cp.description,
    cp.car_slug,
    cp.car_name,
    cp.view_count,
    cp.like_count,
    cp.is_featured,
    cp.published_at,
    jsonb_build_object(
      'display_name', up.display_name,
      'public_slug', up.public_slug,
      'avatar_url', up.avatar_url,
      'tier', up.tier
    ) AS author,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', ui.id,
        'blob_url', ui.blob_url,
        'thumbnail_url', ui.thumbnail_url,
        'caption', ui.caption,
        'is_primary', ui.is_primary
      ) ORDER BY ui.is_primary DESC, ui.display_order ASC)
      FROM user_uploaded_images ui
      WHERE ui.community_post_id = cp.id
        AND ui.is_approved = true
    ), '[]'::jsonb) AS images
  FROM community_posts cp
  JOIN user_profiles up ON up.id = cp.user_id
  WHERE cp.is_published = true
    AND cp.is_approved = true
    AND (p_post_type IS NULL OR cp.post_type = p_post_type)
    AND (p_car_slug IS NULL OR cp.car_slug = p_car_slug)
  ORDER BY cp.is_featured DESC, cp.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get single community post by slug
CREATE OR REPLACE FUNCTION get_community_post_by_slug(p_slug TEXT)
RETURNS TABLE (
  post JSONB,
  author JSONB,
  images JSONB,
  build_data JSONB,
  vehicle_data JSONB
) AS $$
DECLARE
  v_post_id UUID;
BEGIN
  -- Get post ID and increment views
  SELECT id INTO v_post_id
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
    COALESCE((
      SELECT jsonb_agg(to_jsonb(ui.*) ORDER BY ui.is_primary DESC, ui.display_order ASC)
      FROM user_uploaded_images ui
      WHERE ui.community_post_id = cp.id
        AND ui.is_approved = true
    ), '[]'::jsonb) AS images,
    CASE WHEN cp.user_build_id IS NOT NULL THEN
      (SELECT to_jsonb(usb.*) FROM user_projects usb WHERE usb.id = cp.user_build_id)
    ELSE NULL END AS build_data,
    CASE WHEN cp.user_vehicle_id IS NOT NULL THEN
      (SELECT to_jsonb(uv.*) FROM user_vehicles uv WHERE uv.id = cp.user_vehicle_id)
    ELSE NULL END AS vehicle_data
  FROM community_posts cp
  JOIN user_profiles up ON up.id = cp.user_id
  WHERE cp.id = v_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_uploaded_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- User Uploaded Images RLS
DROP POLICY IF EXISTS "Users can view own images" ON user_uploaded_images;
CREATE POLICY "Users can view own images" ON user_uploaded_images
  FOR SELECT USING (
    auth.uid() = user_id
    OR (
      community_post_id IS NOT NULL 
      AND EXISTS(
        SELECT 1 FROM community_posts cp 
        WHERE cp.id = community_post_id 
        AND cp.is_published = true
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert own images" ON user_uploaded_images;
CREATE POLICY "Users can insert own images" ON user_uploaded_images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own images" ON user_uploaded_images;
CREATE POLICY "Users can update own images" ON user_uploaded_images
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own images" ON user_uploaded_images;
CREATE POLICY "Users can delete own images" ON user_uploaded_images
  FOR DELETE USING (auth.uid() = user_id);

-- Community Posts RLS
DROP POLICY IF EXISTS "Anyone can view published posts" ON community_posts;
CREATE POLICY "Anyone can view published posts" ON community_posts
  FOR SELECT USING (
    is_published = true 
    AND is_approved = true
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can create own posts" ON community_posts;
CREATE POLICY "Users can create own posts" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
CREATE POLICY "Users can update own posts" ON community_posts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON community_posts;
CREATE POLICY "Users can delete own posts" ON community_posts
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE user_uploaded_images IS 'User-uploaded photos for vehicles, builds, and community posts';
COMMENT ON TABLE community_posts IS 'Public posts sharing garages, builds, and vehicles';
COMMENT ON COLUMN user_uploaded_images.blob_url IS 'Full URL to image in Vercel Blob storage';
COMMENT ON COLUMN community_posts.slug IS 'SEO-friendly URL slug generated from title';
COMMENT ON FUNCTION generate_community_post_slug IS 'Generates unique slug from title with user suffix';

