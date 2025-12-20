-- ============================================================================
-- Migration 034: Vehicle Modifications
-- 
-- Adds columns to user_vehicles table to track installed modifications.
-- This allows users to mark upgrades as "actually installed" on their owned
-- vehicles, separate from build planning in user_projects.
--
-- New columns:
--   - installed_modifications: JSONB array of upgrade keys
--   - active_build_id: Optional FK to source user_projects row
--   - total_hp_gain: Cached HP gain for display
--   - modified_at: Timestamp of last modification update
--
-- Non-breaking: All columns have safe defaults, existing data unchanged.
-- ============================================================================

-- Add installed_modifications column
-- Stores array of upgrade keys like ["intake", "exhaust-catback", "tune-street"]
ALTER TABLE user_vehicles 
  ADD COLUMN IF NOT EXISTS installed_modifications JSONB DEFAULT '[]'::jsonb;

-- Add optional link to source build project
-- If user applied a saved build, this tracks where it came from
ALTER TABLE user_vehicles 
  ADD COLUMN IF NOT EXISTS active_build_id UUID REFERENCES user_projects(id) ON DELETE SET NULL;

-- Add cached HP gain for quick display
-- Avoids recalculating on every render
ALTER TABLE user_vehicles 
  ADD COLUMN IF NOT EXISTS total_hp_gain INTEGER DEFAULT 0;

-- Add timestamp for when modifications were last updated
ALTER TABLE user_vehicles 
  ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for finding modified vehicles (WHERE has modifications)
CREATE INDEX IF NOT EXISTS idx_user_vehicles_is_modified 
  ON user_vehicles ((jsonb_array_length(installed_modifications) > 0))
  WHERE jsonb_array_length(installed_modifications) > 0;

-- Index for build lookups (sparse - only where build_id exists)
CREATE INDEX IF NOT EXISTS idx_user_vehicles_active_build 
  ON user_vehicles (active_build_id) 
  WHERE active_build_id IS NOT NULL;

-- ============================================================================
-- DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN user_vehicles.installed_modifications IS 
  'Array of upgrade keys installed on this vehicle, e.g. ["intake", "exhaust-catback", "tune-street"]. Matches format used in user_projects.selected_upgrades.';

COMMENT ON COLUMN user_vehicles.active_build_id IS 
  'Optional FK to user_projects.id - links to the build project this configuration came from. SET NULL on project deletion.';

COMMENT ON COLUMN user_vehicles.total_hp_gain IS 
  'Cached total HP gain from installed modifications. Updated when modifications change.';

COMMENT ON COLUMN user_vehicles.modified_at IS 
  'Timestamp when installed_modifications was last updated. NULL if never modified.';

-- ============================================================================
-- RLS POLICIES
-- Note: Existing user_vehicles RLS policies automatically cover new columns
-- since they use row-level checks (user_id = auth.uid())
-- No new policies needed.
-- ============================================================================

