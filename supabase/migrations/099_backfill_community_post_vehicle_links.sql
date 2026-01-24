-- ============================================================================
-- Migration 099: Backfill Community Post Vehicle Links
-- 
-- Issue: ShareBuildButton was not passing the vehicle prop to ShareBuildModal,
-- causing all community posts to have user_vehicle_id = NULL.
-- This broke the community page performance calculations since it couldn't
-- access the vehicle's installed_modifications.
--
-- Fix: Link existing community posts to their corresponding vehicles by:
-- 1. Finding posts with user_build_id but no user_vehicle_id
-- 2. Looking up the user_project to get the car_slug
-- 3. Finding the user's vehicle that matches that car_slug
-- 4. Updating the community post to link to that vehicle
-- ============================================================================

-- First, let's see what needs to be updated (for logging)
DO $$
DECLARE
  posts_to_update INTEGER;
BEGIN
  SELECT COUNT(*) INTO posts_to_update
  FROM community_posts cp
  WHERE cp.user_build_id IS NOT NULL
    AND cp.user_vehicle_id IS NULL
    AND cp.is_published = true;
  
  RAISE NOTICE 'Found % community posts that need vehicle linking', posts_to_update;
END $$;

-- Update community posts to link to their vehicles
-- Match via: community_post -> user_project (car_slug) -> user_vehicle (matched_car_slug)
UPDATE community_posts cp
SET user_vehicle_id = (
  SELECT uv.id
  FROM user_projects up
  JOIN user_vehicles uv ON uv.user_id = cp.user_id 
    AND uv.matched_car_slug = up.car_slug
  WHERE up.id = cp.user_build_id
  ORDER BY uv.is_primary DESC, uv.created_at DESC
  LIMIT 1
)
WHERE cp.user_build_id IS NOT NULL
  AND cp.user_vehicle_id IS NULL
  AND EXISTS (
    SELECT 1 
    FROM user_projects up
    JOIN user_vehicles uv ON uv.user_id = cp.user_id 
      AND uv.matched_car_slug = up.car_slug
    WHERE up.id = cp.user_build_id
  );

-- Log results
DO $$
DECLARE
  updated_count INTEGER;
  still_unlinked INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  SELECT COUNT(*) INTO still_unlinked
  FROM community_posts cp
  WHERE cp.user_build_id IS NOT NULL
    AND cp.user_vehicle_id IS NULL
    AND cp.is_published = true;
  
  RAISE NOTICE 'Updated % community posts with vehicle links', updated_count;
  RAISE NOTICE '% posts still unlinked (user may not have matching vehicle in garage)', still_unlinked;
END $$;

-- ============================================================================
-- VERIFICATION QUERY (run manually to check results)
-- ============================================================================
-- SELECT 
--   cp.id,
--   cp.title,
--   cp.user_vehicle_id,
--   up.car_slug,
--   uv.matched_car_slug,
--   uv.installed_modifications
-- FROM community_posts cp
-- LEFT JOIN user_projects up ON up.id = cp.user_build_id
-- LEFT JOIN user_vehicles uv ON uv.id = cp.user_vehicle_id
-- WHERE cp.is_published = true
-- ORDER BY cp.published_at DESC;

COMMENT ON TABLE community_posts IS 'Community posts now properly linked to user_vehicles via user_vehicle_id for live performance sync';
