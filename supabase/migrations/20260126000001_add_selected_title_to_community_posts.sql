-- ============================================================================
-- Migration: Add selected_title to Community Posts Author Data
-- 
-- Issue: Users can select a title/callsign on their dashboard (e.g., "Tuning Sensei",
-- "AI Ronin") but this wasn't being returned in community post queries.
-- This caused inconsistent display - titles would show on leaderboard but not on builds.
--
-- Fix: Add selected_title to the author JSONB object in all community post functions
-- so the user's chosen title displays consistently across the app.
-- ============================================================================

-- ============================================================================
-- BACKFILL: Set default title for all users without one
-- "rookie" is the default callsign for new users
-- ============================================================================

UPDATE user_profiles 
SET selected_title = 'rookie' 
WHERE selected_title IS NULL;

-- Drop existing functions first (return type unchanged, but recreating for consistency)
DROP FUNCTION IF EXISTS get_community_posts(TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS get_community_post_by_slug(TEXT);
DROP FUNCTION IF EXISTS get_most_viewed_builds(INTEGER);
DROP FUNCTION IF EXISTS get_builds_by_brand(INTEGER);

-- ============================================================================
-- UPDATE get_community_posts FUNCTION
-- Added: selected_title to author JSONB
-- Note: Uses car_id (UUID) to join with cars table, returns c.slug as car_slug
-- ============================================================================

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
  car_image_url TEXT,
  view_count INTEGER,
  like_count INTEGER,
  is_featured BOOLEAN,
  published_at TIMESTAMPTZ,
  author JSONB,
  images JSONB,
  primary_image JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.slug,
    cp.post_type,
    cp.title,
    cp.description,
    c.slug as car_slug,
    cp.car_name,
    c.image_hero_url as car_image_url,
    cp.view_count,
    cp.like_count,
    cp.is_featured,
    cp.published_at,
    jsonb_build_object(
      'display_name', up.display_name,
      'public_slug', up.public_slug,
      'avatar_url', up.avatar_url,
      'tier', up.subscription_tier,
      'selected_title', up.selected_title  -- NEW: User's chosen callsign/title
    ) AS author,
    -- Get ALL images (from community_post_id OR user_build_id)
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', ui.id,
        'blob_url', ui.blob_url,
        'thumbnail_url', ui.thumbnail_url,
        'caption', ui.caption,
        'is_primary', ui.is_primary
      ) ORDER BY ui.is_primary DESC, ui.display_order ASC)
      FROM user_uploaded_images ui
      WHERE ui.is_approved = true
        AND (
          ui.community_post_id = cp.id
          OR (cp.user_build_id IS NOT NULL AND ui.user_build_id = cp.user_build_id)
        )
    ), '[]'::jsonb) AS images,
    -- Get primary image (for card display)
    COALESCE((
      SELECT jsonb_build_object(
        'id', ui.id,
        'blob_url', ui.blob_url,
        'thumbnail_url', ui.thumbnail_url,
        'is_primary', ui.is_primary
      )
      FROM user_uploaded_images ui
      WHERE ui.is_approved = true
        AND (
          ui.community_post_id = cp.id
          OR (cp.user_build_id IS NOT NULL AND ui.user_build_id = cp.user_build_id)
        )
      ORDER BY ui.is_primary DESC, ui.display_order ASC
      LIMIT 1
    ), NULL) AS primary_image
  FROM community_posts cp
  JOIN user_profiles up ON up.id = cp.user_id
  LEFT JOIN cars c ON c.id = cp.car_id
  WHERE cp.is_published = true
    AND cp.is_approved = true
    AND (p_post_type IS NULL OR cp.post_type = p_post_type)
    AND (p_car_slug IS NULL OR c.slug = p_car_slug)
  ORDER BY cp.is_featured DESC, cp.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- UPDATE get_community_post_by_slug FUNCTION
-- Added: selected_title to author JSONB
-- ============================================================================

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
  v_build_id UUID;
BEGIN
  -- Get post ID
  SELECT cp.id, cp.user_build_id 
  INTO v_post_id, v_build_id
  FROM community_posts cp
  WHERE cp.slug = p_slug
    AND cp.is_published = true
    AND cp.is_approved = true;
  
  IF v_post_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT
    jsonb_build_object(
      'id', cp.id,
      'slug', cp.slug,
      'post_type', cp.post_type,
      'title', cp.title,
      'description', cp.description,
      'car_slug', c.slug,
      'car_name', cp.car_name,
      'carImageUrl', c.image_hero_url,
      'view_count', cp.view_count,
      'like_count', cp.like_count,
      'is_featured', cp.is_featured,
      'published_at', cp.published_at,
      'updated_at', cp.updated_at
    ) AS post,
    jsonb_build_object(
      'user_id', up.id,
      'display_name', up.display_name,
      'public_slug', up.public_slug,
      'avatar_url', up.avatar_url,
      'bio', up.bio,
      'tier', up.subscription_tier,
      'location_city', up.location_city,
      'location_state', up.location_state,
      'selected_title', up.selected_title  -- NEW: User's chosen callsign/title
    ) AS author,
    -- Get ALL images from community_post_id OR user_build_id
    COALESCE((
      SELECT jsonb_agg(to_jsonb(ui.*) ORDER BY ui.is_primary DESC, ui.display_order ASC)
      FROM user_uploaded_images ui
      WHERE ui.is_approved = true
        AND (
          ui.community_post_id = cp.id
          OR (cp.user_build_id IS NOT NULL AND ui.user_build_id = cp.user_build_id)
        )
    ), '[]'::jsonb) AS images,
    CASE WHEN cp.user_build_id IS NOT NULL THEN
      (SELECT to_jsonb(usb.*) FROM user_projects usb WHERE usb.id = cp.user_build_id)
    ELSE NULL END AS build_data,
    CASE WHEN cp.user_vehicle_id IS NOT NULL THEN
      (SELECT to_jsonb(uv.*) FROM user_vehicles uv WHERE uv.id = cp.user_vehicle_id)
    ELSE NULL END AS vehicle_data
  FROM community_posts cp
  JOIN user_profiles up ON up.id = cp.user_id
  LEFT JOIN cars c ON c.id = cp.car_id
  WHERE cp.id = v_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE get_most_viewed_builds FUNCTION
-- Added: selected_title to author JSONB
-- ============================================================================

CREATE OR REPLACE FUNCTION get_most_viewed_builds(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title TEXT,
  description TEXT,
  car_slug TEXT,
  car_name TEXT,
  car_image_url TEXT,
  view_count INTEGER,
  like_count INTEGER,
  is_featured BOOLEAN,
  published_at TIMESTAMPTZ,
  author JSONB,
  images JSONB,
  primary_image JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.id,
    cp.slug,
    cp.title,
    cp.description,
    c.slug as car_slug,
    cp.car_name,
    c.image_hero_url as car_image_url,
    cp.view_count,
    cp.like_count,
    cp.is_featured,
    cp.published_at,
    jsonb_build_object(
      'display_name', up.display_name,
      'public_slug', up.public_slug,
      'avatar_url', up.avatar_url,
      'tier', up.subscription_tier,
      'selected_title', up.selected_title  -- NEW: User's chosen callsign/title
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
      WHERE ui.is_approved = true
        AND (
          ui.community_post_id = cp.id
          OR (cp.user_build_id IS NOT NULL AND ui.user_build_id = cp.user_build_id)
        )
    ), '[]'::jsonb) AS images,
    COALESCE((
      SELECT jsonb_build_object(
        'id', ui.id,
        'blob_url', ui.blob_url,
        'thumbnail_url', ui.thumbnail_url,
        'is_primary', ui.is_primary
      )
      FROM user_uploaded_images ui
      WHERE ui.is_approved = true
        AND (
          ui.community_post_id = cp.id
          OR (cp.user_build_id IS NOT NULL AND ui.user_build_id = cp.user_build_id)
        )
      ORDER BY ui.is_primary DESC, ui.display_order ASC
      LIMIT 1
    ), NULL) AS primary_image
  FROM community_posts cp
  JOIN user_profiles up ON up.id = cp.user_id
  LEFT JOIN cars c ON c.id = cp.car_id
  WHERE cp.is_published = true
    AND cp.is_approved = true
    AND cp.post_type = 'build'
  ORDER BY cp.view_count DESC, cp.published_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- UPDATE get_builds_by_brand FUNCTION
-- Added: selected_title to author JSONB
-- ============================================================================

CREATE OR REPLACE FUNCTION get_builds_by_brand(p_limit_per_brand INTEGER DEFAULT 10)
RETURNS TABLE (
  brand TEXT,
  brand_display TEXT,
  build_count BIGINT,
  builds JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH brand_counts AS (
    SELECT 
      LOWER(c.brand) as brand_slug,
      COUNT(*)::BIGINT as total_builds
    FROM community_posts cp
    JOIN cars c ON c.id = cp.car_id
    WHERE cp.is_published = true
      AND cp.is_approved = true
      AND cp.post_type = 'build'
      AND c.brand IS NOT NULL
    GROUP BY c.brand
  ),
  brand_builds AS (
    SELECT 
      LOWER(c.brand) as brand_slug,
      c.brand as brand_name,
      cp.id,
      cp.slug,
      cp.title,
      cp.description,
      c.slug as car_slug,
      cp.car_name,
      cp.user_build_id,
      c.image_hero_url as car_image_url,
      cp.view_count,
      cp.like_count,
      cp.is_featured,
      cp.published_at,
      jsonb_build_object(
        'display_name', up.display_name,
        'avatar_url', up.avatar_url,
        'tier', up.subscription_tier,
        'selected_title', up.selected_title  -- NEW: User's chosen callsign/title
      ) AS author,
      -- Get primary image (check both community_post_id AND user_build_id)
      COALESCE((
        SELECT jsonb_build_object(
          'id', ui.id,
          'blob_url', ui.blob_url,
          'thumbnail_url', ui.thumbnail_url,
          'is_primary', ui.is_primary
        )
        FROM user_uploaded_images ui
        WHERE ui.is_approved = true
          AND (
            ui.community_post_id = cp.id
            OR (cp.user_build_id IS NOT NULL AND ui.user_build_id = cp.user_build_id)
          )
        ORDER BY ui.is_primary DESC, ui.display_order ASC
        LIMIT 1
      ), NULL) AS primary_image,
      ROW_NUMBER() OVER (
        PARTITION BY c.brand 
        ORDER BY cp.is_featured DESC, cp.published_at DESC
      ) as rn
    FROM community_posts cp
    JOIN user_profiles up ON up.id = cp.user_id
    JOIN cars c ON c.id = cp.car_id
    WHERE cp.is_published = true
      AND cp.is_approved = true
      AND cp.post_type = 'build'
      AND c.brand IS NOT NULL
  )
  SELECT 
    bb.brand_slug as brand,
    bb.brand_name as brand_display,
    bc.total_builds as build_count,
    jsonb_agg(
      jsonb_build_object(
        'id', bb.id,
        'slug', bb.slug,
        'title', bb.title,
        'description', bb.description,
        'car_slug', bb.car_slug,
        'car_name', bb.car_name,
        'car_image_url', bb.car_image_url,
        'view_count', bb.view_count,
        'like_count', bb.like_count,
        'is_featured', bb.is_featured,
        'published_at', bb.published_at,
        'author', bb.author,
        'primary_image', bb.primary_image
      ) ORDER BY bb.is_featured DESC, bb.published_at DESC
    ) as builds
  FROM brand_builds bb
  JOIN brand_counts bc ON bc.brand_slug = bb.brand_slug
  WHERE bb.rn <= p_limit_per_brand
  GROUP BY bb.brand_slug, bb.brand_name, bc.total_builds
  ORDER BY bc.total_builds DESC, bb.brand_name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_community_posts IS 'Get community posts with author selected_title for consistent callsign display';
COMMENT ON FUNCTION get_community_post_by_slug IS 'Get single community post with author selected_title';
COMMENT ON FUNCTION get_most_viewed_builds IS 'Get most viewed builds with author selected_title';
COMMENT ON FUNCTION get_builds_by_brand IS 'Get builds grouped by brand with author selected_title';
