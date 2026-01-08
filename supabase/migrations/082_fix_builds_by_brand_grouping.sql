-- ============================================================================
-- Migration 082: Fix Community Builds Brand Grouping
-- 
-- Issue: get_builds_by_brand and get_build_brands were using split_part() 
-- on car_slug which returned model codes (718, 991) instead of actual brand
-- names (Porsche). This caused builds to be grouped by model family instead
-- of by manufacturer.
--
-- Fix: Join with cars table to get the actual brand column.
--
-- Before: "718 Builds", "991 Builds", "Nissan Builds" (separate sections)
-- After: "Porsche Builds" (718 + 991 combined), "Nissan Builds"
-- ============================================================================

-- ============================================================================
-- FIX get_build_brands FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS get_build_brands();

CREATE OR REPLACE FUNCTION get_build_brands()
RETURNS TABLE (
  brand TEXT,
  brand_display TEXT,
  build_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    LOWER(c.brand) as brand,
    c.brand as brand_display,
    COUNT(*)::BIGINT as build_count
  FROM community_posts cp
  JOIN cars c ON c.slug = cp.car_slug
  WHERE cp.is_published = true
    AND cp.is_approved = true
    AND cp.post_type = 'build'
    AND c.brand IS NOT NULL
  GROUP BY c.brand
  ORDER BY build_count DESC, c.brand;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- FIX get_builds_by_brand FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS get_builds_by_brand(INTEGER);

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
    -- First, get total counts per brand (before limiting)
    SELECT 
      LOWER(c.brand) as brand_slug,
      COUNT(*)::BIGINT as total_builds
    FROM community_posts cp
    JOIN cars c ON c.slug = cp.car_slug
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
      cp.car_slug,
      cp.car_name,
      c.image_hero_url as car_image_url,
      cp.view_count,
      cp.like_count,
      cp.is_featured,
      cp.published_at,
      jsonb_build_object(
        'display_name', up.display_name,
        'avatar_url', up.avatar_url,
        'tier', up.subscription_tier
      ) AS author,
      COALESCE((
        SELECT jsonb_build_object(
          'id', ui.id,
          'blob_url', ui.blob_url,
          'thumbnail_url', ui.thumbnail_url,
          'is_primary', ui.is_primary
        )
        FROM user_uploaded_images ui
        WHERE ui.community_post_id = cp.id
          AND ui.is_approved = true
        ORDER BY ui.is_primary DESC, ui.display_order ASC
        LIMIT 1
      ), NULL) AS primary_image,
      ROW_NUMBER() OVER (
        PARTITION BY c.brand 
        ORDER BY cp.is_featured DESC, cp.published_at DESC
      ) as rn
    FROM community_posts cp
    JOIN user_profiles up ON up.id = cp.user_id
    JOIN cars c ON c.slug = cp.car_slug
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

COMMENT ON FUNCTION get_build_brands IS 'Get all brands that have community builds, using actual brand from cars table';
COMMENT ON FUNCTION get_builds_by_brand IS 'Get community builds grouped by actual manufacturer brand, with accurate total counts';
