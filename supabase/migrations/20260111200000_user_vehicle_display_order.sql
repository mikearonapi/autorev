-- ============================================================================
-- USER VEHICLE DISPLAY ORDER
-- Adds display_order column to user_vehicles for custom ordering in garage
-- ============================================================================

-- Add display_order column (nullable, defaults to 0)
ALTER TABLE user_vehicles 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index for ordering queries
CREATE INDEX IF NOT EXISTS idx_user_vehicles_display_order 
ON user_vehicles(user_id, display_order ASC, is_primary DESC, created_at DESC);

-- Comment explaining the column
COMMENT ON COLUMN user_vehicles.display_order IS 
'User-defined display order for garage. Lower numbers appear first. 0 = default order (by is_primary, then created_at).';

-- ============================================================================
-- BACKFILL: Set initial display_order based on current sort order
-- This ensures existing vehicles maintain their relative positions
-- ============================================================================
WITH ordered_vehicles AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id 
      ORDER BY is_primary DESC, created_at DESC
    ) as new_order
  FROM user_vehicles
  WHERE ownership_status = 'owned'
)
UPDATE user_vehicles 
SET display_order = ordered_vehicles.new_order
FROM ordered_vehicles 
WHERE user_vehicles.id = ordered_vehicles.id;
