-- ============================================================================
-- PUBLIC PROFILES
-- AutoRev - Public Garage & Profile Sharing
--
-- This migration adds:
--   1. Public profile fields to user_profiles (public_slug, is_garage_public)
--   2. Bio and location fields for public display
--   3. Functions for slug validation and lookup
--
-- Purpose: Enable users to share their garage publicly with custom URLs
-- ============================================================================

-- ============================================================================
-- ADD PUBLIC PROFILE FIELDS
-- ============================================================================

-- Add public_slug for custom public URLs like /garage/johndoe
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;

-- Add is_garage_public flag
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS is_garage_public BOOLEAN DEFAULT false;

-- Add bio for public profile
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add location fields
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS location_city TEXT;

ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS location_state TEXT;

-- Add social links (optional)
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS social_instagram TEXT;

ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS social_youtube TEXT;

-- ============================================================================
-- SLUG VALIDATION
-- ============================================================================

-- Validate public slug format (alphanumeric, underscores, hyphens, 3-30 chars)
CREATE OR REPLACE FUNCTION validate_public_slug(slug TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Must be 3-30 characters
  IF LENGTH(slug) < 3 OR LENGTH(slug) > 30 THEN
    RETURN false;
  END IF;
  
  -- Must match pattern: lowercase alphanumeric, underscores, hyphens
  IF NOT slug ~ '^[a-z0-9][a-z0-9_-]*[a-z0-9]$' AND LENGTH(slug) > 2 THEN
    RETURN false;
  END IF;
  
  -- Check for reserved slugs
  IF slug IN (
    'admin', 'api', 'app', 'auth', 'autorev', 'browse', 'cars', 'community',
    'compare', 'contact', 'events', 'garage', 'help', 'home', 'internal',
    'join', 'login', 'logout', 'mod', 'profile', 'settings', 'signup',
    'support', 'terms', 'tuning', 'user', 'users', 'www', 'al'
  ) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraint for slug validation
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS valid_public_slug;

ALTER TABLE user_profiles
  ADD CONSTRAINT valid_public_slug 
  CHECK (public_slug IS NULL OR validate_public_slug(public_slug));

-- ============================================================================
-- SLUG LOOKUP FUNCTIONS
-- ============================================================================

-- Check if a slug is available
CREATE OR REPLACE FUNCTION is_public_slug_available(slug TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- First validate format
  IF NOT validate_public_slug(slug) THEN
    RETURN false;
  END IF;
  
  -- Check if taken
  SELECT EXISTS(
    SELECT 1 FROM user_profiles WHERE public_slug = slug
  ) INTO v_exists;
  
  RETURN NOT v_exists;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get user ID from public slug
CREATE OR REPLACE FUNCTION get_user_id_by_slug(slug TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM user_profiles
  WHERE public_slug = slug
    AND is_garage_public = true;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get public profile by slug
CREATE OR REPLACE FUNCTION get_public_profile(p_slug TEXT)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  public_slug TEXT,
  bio TEXT,
  location_city TEXT,
  location_state TEXT,
  social_instagram TEXT,
  social_youtube TEXT,
  avatar_url TEXT,
  tier TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS user_id,
    p.display_name,
    p.public_slug,
    p.bio,
    p.location_city,
    p.location_state,
    p.social_instagram,
    p.social_youtube,
    p.avatar_url,
    p.tier,
    p.created_at
  FROM user_profiles p
  WHERE p.public_slug = p_slug
    AND p.is_garage_public = true;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- PUBLIC GARAGE DATA FUNCTIONS
-- ============================================================================

-- Get public garage data (vehicles + builds)
CREATE OR REPLACE FUNCTION get_public_garage(p_slug TEXT)
RETURNS TABLE (
  profile JSONB,
  vehicles JSONB,
  builds JSONB,
  stats JSONB
) AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user ID from slug
  SELECT id INTO v_user_id
  FROM user_profiles
  WHERE public_slug = p_slug
    AND is_garage_public = true;
  
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT
    -- Profile info
    (SELECT to_jsonb(p.*) FROM (
      SELECT 
        up.display_name,
        up.public_slug,
        up.bio,
        up.location_city,
        up.location_state,
        up.social_instagram,
        up.social_youtube,
        up.avatar_url,
        up.tier,
        up.created_at
      FROM user_profiles up
      WHERE up.id = v_user_id
    ) p) AS profile,
    
    -- Vehicles
    (SELECT COALESCE(jsonb_agg(to_jsonb(v.*)), '[]'::jsonb) FROM (
      SELECT 
        uv.id,
        uv.year,
        uv.make,
        uv.model,
        uv.trim,
        uv.nickname,
        uv.color,
        uv.matched_car_slug,
        uv.created_at
      FROM user_vehicles uv
      WHERE uv.user_id = v_user_id
        AND uv.ownership_status = 'owned'
      ORDER BY uv.is_primary DESC, uv.created_at DESC
    ) v) AS vehicles,
    
    -- Builds
    (SELECT COALESCE(jsonb_agg(to_jsonb(b.*)), '[]'::jsonb) FROM (
      SELECT 
        usb.id,
        usb.car_slug,
        usb.car_name,
        usb.build_name,
        usb.total_hp_gain,
        usb.total_cost_low,
        usb.total_cost_high,
        usb.final_hp,
        usb.notes,
        usb.created_at
      FROM user_saved_builds usb
      WHERE usb.user_id = v_user_id
        AND usb.is_favorite = true  -- Only show favorite/featured builds
      ORDER BY usb.created_at DESC
    ) b) AS builds,
    
    -- Stats
    (SELECT jsonb_build_object(
      'vehicle_count', (SELECT COUNT(*) FROM user_vehicles WHERE user_id = v_user_id AND ownership_status = 'owned'),
      'build_count', (SELECT COUNT(*) FROM user_saved_builds WHERE user_id = v_user_id AND is_favorite = true),
      'member_since', (SELECT created_at FROM user_profiles WHERE id = v_user_id)
    )) AS stats;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- UPDATE RLS POLICIES
-- ============================================================================

-- Allow public read of public profiles
DROP POLICY IF EXISTS "Public can view public profiles" ON user_profiles;
CREATE POLICY "Public can view public profiles" ON user_profiles
  FOR SELECT USING (
    is_garage_public = true 
    OR auth.uid() = id
  );

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_public_slug ON user_profiles(public_slug) WHERE public_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_public ON user_profiles(is_garage_public) WHERE is_garage_public = true;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN user_profiles.public_slug IS 'Custom public URL slug like "johndoe" for /garage/johndoe';
COMMENT ON COLUMN user_profiles.is_garage_public IS 'Whether the user garage is publicly visible';
COMMENT ON FUNCTION validate_public_slug IS 'Validates public slug format and reserved words';
COMMENT ON FUNCTION get_public_garage IS 'Fetches all public garage data for a slug';

