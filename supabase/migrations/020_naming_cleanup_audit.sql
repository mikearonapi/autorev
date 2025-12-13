-- ============================================================================
-- AUTOREV NAMING CLEANUP MIGRATION
-- 
-- This migration standardizes naming across the database to align with the
-- current UI/UX terminology:
--
-- TERMINOLOGY CHANGES:
-- ┌──────────────────────────┬──────────────────────────────────────────────┐
-- │ OLD TERM                 │ NEW TERM                                     │
-- ├──────────────────────────┼──────────────────────────────────────────────┤
-- │ Performance HUB          │ Upgrade Center (component in Tuning Shop)    │
-- │ saved_builds             │ projects (user's modification projects)      │
-- │ user_saved_builds        │ user_projects (table)                        │
-- │ SavedBuildsProvider      │ (code file - requires separate update)       │
-- └──────────────────────────┴──────────────────────────────────────────────┘
--
-- SITE STRUCTURE (for reference):
-- ┌──────────────────────────┬──────────────────────────────────────────────┐
-- │ ROUTE                    │ FEATURE                                      │
-- ├──────────────────────────┼──────────────────────────────────────────────┤
-- │ /garage                  │ My Garage (Collection + Favorites)           │
-- │ /tuning-shop             │ Tuning Shop (Select Car → Upgrade Center →   │
-- │                          │ Projects)                                    │
-- │ /encyclopedia            │ Encyclopedia (Automotive Education)          │
-- │ /car-selector            │ Your Sports Car Match                        │
-- │ /browse-cars             │ Browse Cars                                  │
-- └──────────────────────────┴──────────────────────────────────────────────┘
--
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: RENAME TABLE user_saved_builds → user_projects
-- ============================================================================

-- First, drop the existing policies on user_saved_builds
DROP POLICY IF EXISTS "user_saved_builds_select_own" ON user_saved_builds;
DROP POLICY IF EXISTS "user_saved_builds_insert_own" ON user_saved_builds;
DROP POLICY IF EXISTS "user_saved_builds_update_own" ON user_saved_builds;
DROP POLICY IF EXISTS "user_saved_builds_delete_own" ON user_saved_builds;

-- Drop existing indexes
DROP INDEX IF EXISTS idx_user_saved_builds_user_id;
DROP INDEX IF EXISTS idx_user_saved_builds_car_slug;
DROP INDEX IF EXISTS idx_user_saved_builds_created_at;
DROP INDEX IF EXISTS idx_user_saved_builds_user_car;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_user_saved_builds_updated_at ON user_saved_builds;

-- Rename the table
ALTER TABLE IF EXISTS user_saved_builds RENAME TO user_projects;

-- ============================================================================
-- STEP 2: RENAME COLUMNS IN user_projects FOR CLARITY
-- ============================================================================

-- Rename 'build_name' to 'project_name' for consistency
ALTER TABLE user_projects RENAME COLUMN build_name TO project_name;

-- ============================================================================
-- STEP 3: RECREATE INDEXES WITH NEW NAMES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_car_slug ON user_projects(car_slug);
CREATE INDEX IF NOT EXISTS idx_user_projects_created_at ON user_projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_projects_user_car ON user_projects(user_id, car_slug);

-- ============================================================================
-- STEP 4: RECREATE TRIGGER WITH NEW NAME
-- ============================================================================

DROP TRIGGER IF EXISTS update_user_projects_updated_at ON user_projects;
CREATE TRIGGER update_user_projects_updated_at
  BEFORE UPDATE ON user_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 5: RECREATE RLS POLICIES WITH NEW NAMES
-- ============================================================================

-- Enable RLS (in case it was disabled)
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;

-- USER_PROJECTS: Users can only access their own projects
CREATE POLICY "user_projects_select_own"
  ON user_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_projects_insert_own"
  ON user_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_projects_update_own"
  ON user_projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_projects_delete_own"
  ON user_projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 6: UPDATE TABLE AND COLUMN COMMENTS
-- ============================================================================

-- Update table comment
COMMENT ON TABLE user_projects IS 'Modification projects saved by users in the Tuning Shop. Each project contains a car and selected upgrades with cost/HP estimates.';

-- Update column comments
COMMENT ON COLUMN user_projects.id IS 'Unique project identifier';
COMMENT ON COLUMN user_projects.user_id IS 'Reference to auth.users.id';
COMMENT ON COLUMN user_projects.car_slug IS 'Reference to the car being modified';
COMMENT ON COLUMN user_projects.car_name IS 'Denormalized car name for display';
COMMENT ON COLUMN user_projects.project_name IS 'User-defined project name';
COMMENT ON COLUMN user_projects.selected_upgrades IS 'JSONB array of selected upgrade keys';
COMMENT ON COLUMN user_projects.total_hp_gain IS 'Calculated total HP gain from upgrades';
COMMENT ON COLUMN user_projects.total_cost_low IS 'Low estimate of total upgrade cost';
COMMENT ON COLUMN user_projects.total_cost_high IS 'High estimate of total upgrade cost';
COMMENT ON COLUMN user_projects.final_hp IS 'Stock HP + total HP gain';
COMMENT ON COLUMN user_projects.notes IS 'User notes about the project';
COMMENT ON COLUMN user_projects.is_favorite IS 'Whether the project is marked as favorite';

-- ============================================================================
-- STEP 7: UPDATE upgrade_packages TABLE COMMENTS
-- (Replace "Performance HUB" with "Upgrade Center")
-- ============================================================================

COMMENT ON TABLE upgrade_packages IS 'Upgrade packages and modules for the Upgrade Center in Tuning Shop. Delta values applied client-side via lib/performance.js.';
COMMENT ON COLUMN upgrade_packages.delta_power_accel IS 'Additive delta to Power & Acceleration score (typical range -3 to +3)';

-- ============================================================================
-- STEP 8: UPDATE cars TABLE COLUMN COMMENTS
-- (Replace "Performance HUB" with "Upgrade Center")
-- ============================================================================

-- Update Performance scores column comments
COMMENT ON COLUMN cars.perf_power_accel IS 'Upgrade Center: Power & Acceleration (1-10)';
COMMENT ON COLUMN cars.perf_grip_cornering IS 'Upgrade Center: Grip & Cornering (1-10)';
COMMENT ON COLUMN cars.perf_braking IS 'Upgrade Center: Braking performance (1-10)';
COMMENT ON COLUMN cars.perf_track_pace IS 'Upgrade Center: Overall track pace (1-10)';
COMMENT ON COLUMN cars.perf_drivability IS 'Upgrade Center: Drivability & Comfort (1-10)';
COMMENT ON COLUMN cars.perf_reliability_heat IS 'Upgrade Center: Reliability & Heat Management (1-10)';
COMMENT ON COLUMN cars.perf_sound_emotion IS 'Upgrade Center: Sound & Emotion (1-10)';

-- ============================================================================
-- STEP 9: UPDATE leads TABLE source CHECK CONSTRAINT
-- (Rename 'performance-hub' source to 'tuning-shop' for clarity)
-- ============================================================================

-- First, update any existing rows
UPDATE leads SET source = 'tuning-shop' WHERE source = 'performance-hub';

-- Drop the old constraint and create new one
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check CHECK (source IN (
  'contact',           -- Contact page form
  'newsletter',        -- Newsletter signup (footer, hero page strips)
  'hero-page',         -- Car detail page CTA
  'advisory-future',   -- Reserved for future email-gated advisory features
  'upgrade-inquiry',   -- Upgrade page inquiries
  'service-booking',   -- Service page bookings
  'tuning-shop'        -- Tuning Shop inquiries (formerly performance-hub)
));

-- Update comment
COMMENT ON COLUMN leads.source IS 'Origin: contact, newsletter, hero-page, advisory-future, upgrade-inquiry, service-booking, tuning-shop';

-- ============================================================================
-- STEP 10: UPDATE upgrade_education TABLE COMMENT
-- ============================================================================

COMMENT ON TABLE upgrade_education IS 'Educational content about individual upgrades for the Tuning Shop Encyclopedia. Allows users to learn about mods without selecting a specific car.';

-- ============================================================================
-- STEP 11: UPDATE HELPER FUNCTIONS TO USE NEW TABLE NAME
-- ============================================================================

-- Update the get_user_context_for_al function to use user_projects
CREATE OR REPLACE FUNCTION get_user_context_for_al(user_id_param UUID)
RETURNS TABLE (
  -- Favorites
  favorite_car_slugs TEXT[],
  favorite_count INTEGER,
  -- Projects (formerly builds)
  project_car_slugs TEXT[],
  project_count INTEGER,
  -- Owned vehicles
  owned_makes TEXT[],
  owned_models TEXT[],
  primary_vehicle_slug TEXT,
  -- Activity
  cars_viewed_count INTEGER,
  member_since TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Favorites
    ARRAY(
      SELECT f.car_slug FROM user_favorites f 
      WHERE f.user_id = user_id_param 
      ORDER BY f.created_at DESC LIMIT 10
    ),
    (SELECT COUNT(*)::INTEGER FROM user_favorites WHERE user_id = user_id_param),
    -- Projects (formerly builds)
    ARRAY(
      SELECT DISTINCT p.car_slug FROM user_projects p 
      WHERE p.user_id = user_id_param
    ),
    (SELECT COUNT(*)::INTEGER FROM user_projects WHERE user_id = user_id_param),
    -- Owned vehicles
    ARRAY(
      SELECT DISTINCT v.make FROM user_vehicles v 
      WHERE v.user_id = user_id_param
    ),
    ARRAY(
      SELECT v.model FROM user_vehicles v 
      WHERE v.user_id = user_id_param
    ),
    (SELECT v.matched_car_slug FROM user_vehicles v 
     WHERE v.user_id = user_id_param AND v.is_primary = true LIMIT 1),
    -- Activity from profile
    COALESCE((SELECT p.cars_viewed_count FROM user_profiles p WHERE p.id = user_id_param), 0),
    (SELECT u.created_at FROM auth.users u WHERE u.id = user_id_param);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment
COMMENT ON FUNCTION get_user_context_for_al IS 'Get user preferences and history for personalized AL responses. Returns favorites, projects, vehicles, and activity stats.';

-- ============================================================================
-- STEP 12: UPDATE user_profiles TABLE COMMENTS
-- ============================================================================

-- Update denormalized stats field names in comments
COMMENT ON COLUMN user_profiles.builds_saved_count IS 'Denormalized count of saved projects for quick access';

-- Actually rename the column for consistency
ALTER TABLE user_profiles RENAME COLUMN builds_saved_count TO projects_saved_count;
COMMENT ON COLUMN user_profiles.projects_saved_count IS 'Denormalized count of saved projects for quick access';

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify the migration)
-- ============================================================================

-- Uncomment and run these to verify:
/*
-- Check user_projects table exists and has correct structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_projects'
ORDER BY ordinal_position;

-- Check RLS policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'user_projects';

-- Check indexes exist
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'user_projects';

-- Check leads source constraint
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%leads_source%';

-- Verify old table doesn't exist
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'user_saved_builds'
) as old_table_exists;
*/

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
/*
DATABASE CHANGES MADE:

TABLES:
  ✓ user_saved_builds → user_projects
  ✓ Column: build_name → project_name

INDEXES:
  ✓ idx_user_saved_builds_* → idx_user_projects_*

RLS POLICIES:
  ✓ user_saved_builds_*_own → user_projects_*_own

CONSTRAINTS:
  ✓ leads.source: 'performance-hub' → 'tuning-shop'

COLUMN RENAMES:
  ✓ user_projects.build_name → project_name
  ✓ user_profiles.builds_saved_count → projects_saved_count

COMMENTS UPDATED:
  ✓ All "Performance HUB" → "Upgrade Center" in cars table
  ✓ All "Performance HUB" → "Tuning Shop" in upgrade_packages
  ✓ All "saved builds" → "projects" in user_projects
  ✓ upgrade_education table comment updated

FUNCTIONS:
  ✓ get_user_context_for_al() updated for user_projects
  
CODE FILES REQUIRING UPDATE (separate task):
  - SavedBuildsProvider.jsx → ProjectsProvider.jsx
  - useSavedBuilds() → useProjects()
  - lib/userDataService.js: function names
  - All imports/references to SavedBuildsProvider
*/

