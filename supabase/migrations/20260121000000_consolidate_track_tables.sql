-- ============================================================================
-- Migration: Consolidate track_venues and tracks tables
-- Date: 2026-01-21
-- Purpose: Fix the dual track table problem where car_track_lap_times references
--          track_venues but the lap time estimator UI expects tracks table.
--
-- Strategy:
-- 1. Add physics columns from tracks to track_venues
-- 2. Migrate existing physics data where slugs match
-- 3. Rename track_venues to tracks (after backing up old tracks)
-- 4. Update foreign key constraints
-- ============================================================================

-- ============================================================================
-- STEP 1: Backup the old tracks table
-- ============================================================================
ALTER TABLE IF EXISTS tracks RENAME TO tracks_legacy;

-- Also rename the indexes to avoid conflicts
ALTER INDEX IF EXISTS idx_tracks_country RENAME TO idx_tracks_legacy_country;
ALTER INDEX IF EXISTS idx_tracks_state RENAME TO idx_tracks_legacy_state;
ALTER INDEX IF EXISTS idx_tracks_region RENAME TO idx_tracks_legacy_region;
ALTER INDEX IF EXISTS idx_tracks_type RENAME TO idx_tracks_legacy_type;
ALTER INDEX IF EXISTS idx_tracks_popular RENAME TO idx_tracks_legacy_popular;

-- Drop the old trigger (if exists)
DROP TRIGGER IF EXISTS tracks_updated_at ON tracks_legacy;

-- ============================================================================
-- STEP 2: Add physics columns to track_venues
-- ============================================================================
ALTER TABLE track_venues
  -- Basic info enhancements
  ADD COLUMN IF NOT EXISTS short_name TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  
  -- Track measurements
  ADD COLUMN IF NOT EXISTS length_miles NUMERIC(5,3),
  ADD COLUMN IF NOT EXISTS corners INTEGER,
  ADD COLUMN IF NOT EXISTS elevation_change_ft INTEGER,
  ADD COLUMN IF NOT EXISTS longest_straight_ft INTEGER,
  ADD COLUMN IF NOT EXISTS surface_type TEXT DEFAULT 'asphalt',
  
  -- Track type
  ADD COLUMN IF NOT EXISTS track_type TEXT DEFAULT 'road_course',
  ADD COLUMN IF NOT EXISTS configuration TEXT DEFAULT 'full',
  
  -- Physics parameters for lap time estimator
  ADD COLUMN IF NOT EXISTS pro_reference_time NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS power_gain_max NUMERIC(4,2) DEFAULT 4.0,
  ADD COLUMN IF NOT EXISTS grip_gain_max NUMERIC(4,2) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS susp_gain_max NUMERIC(4,2) DEFAULT 3.5,
  ADD COLUMN IF NOT EXISTS brake_gain_max NUMERIC(4,2) DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS aero_gain_max NUMERIC(4,2) DEFAULT 2.0,
  ADD COLUMN IF NOT EXISTS weight_gain_max NUMERIC(4,2) DEFAULT 2.0,
  
  -- Driver skill penalties
  ADD COLUMN IF NOT EXISTS beginner_penalty NUMERIC(4,1) DEFAULT 25,
  ADD COLUMN IF NOT EXISTS intermediate_penalty NUMERIC(4,1) DEFAULT 10,
  ADD COLUMN IF NOT EXISTS advanced_penalty NUMERIC(4,1) DEFAULT 3,
  
  -- Display/media
  ADD COLUMN IF NOT EXISTS character_tags TEXT[],
  ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '🏁',
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS layout_svg_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS wikipedia_url TEXT,
  
  -- Status flags
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS popularity_rank INTEGER,
  ADD COLUMN IF NOT EXISTS data_source TEXT,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- ============================================================================
-- STEP 3: Migrate physics data from tracks_legacy where slugs match
-- ============================================================================
UPDATE track_venues tv
SET
  short_name = COALESCE(tv.short_name, tl.short_name),
  state = COALESCE(tv.state, tl.state),
  length_miles = COALESCE(tv.length_miles, tl.length_miles),
  corners = COALESCE(tv.corners, tl.corners),
  elevation_change_ft = COALESCE(tv.elevation_change_ft, tl.elevation_change_ft),
  longest_straight_ft = COALESCE(tv.longest_straight_ft, tl.longest_straight_ft),
  surface_type = COALESCE(tv.surface_type, tl.surface_type),
  track_type = COALESCE(tv.track_type, tl.track_type),
  configuration = COALESCE(tv.configuration, tl.configuration),
  pro_reference_time = COALESCE(tv.pro_reference_time, tl.pro_reference_time),
  power_gain_max = COALESCE(tv.power_gain_max, tl.power_gain_max),
  grip_gain_max = COALESCE(tv.grip_gain_max, tl.grip_gain_max),
  susp_gain_max = COALESCE(tv.susp_gain_max, tl.susp_gain_max),
  brake_gain_max = COALESCE(tv.brake_gain_max, tl.brake_gain_max),
  aero_gain_max = COALESCE(tv.aero_gain_max, tl.aero_gain_max),
  weight_gain_max = COALESCE(tv.weight_gain_max, tl.weight_gain_max),
  beginner_penalty = COALESCE(tv.beginner_penalty, tl.beginner_penalty),
  intermediate_penalty = COALESCE(tv.intermediate_penalty, tl.intermediate_penalty),
  advanced_penalty = COALESCE(tv.advanced_penalty, tl.advanced_penalty),
  character_tags = COALESCE(tv.character_tags, tl.character_tags),
  icon = COALESCE(tv.icon, tl.icon),
  image_url = COALESCE(tv.image_url, tl.image_url),
  layout_svg_url = COALESCE(tv.layout_svg_url, tl.layout_svg_url),
  website_url = COALESCE(tv.website_url, tl.website_url),
  wikipedia_url = COALESCE(tv.wikipedia_url, tl.wikipedia_url),
  is_active = COALESCE(tv.is_active, tl.is_active, true),
  is_popular = COALESCE(tv.is_popular, tl.is_popular, false),
  popularity_rank = COALESCE(tv.popularity_rank, tl.popularity_rank),
  data_source = COALESCE(tv.data_source, tl.data_source),
  verified = COALESCE(tv.verified, tl.verified, false)
FROM tracks_legacy tl
WHERE tv.slug = tl.slug;

-- ============================================================================
-- STEP 4: Insert tracks from tracks_legacy that don't exist in track_venues
-- ============================================================================
INSERT INTO track_venues (
  slug, name, short_name, city, state, country, region,
  length_km, length_miles, corners, elevation_change_ft, longest_straight_ft,
  surface_type, track_type, configuration,
  pro_reference_time, power_gain_max, grip_gain_max, susp_gain_max,
  brake_gain_max, aero_gain_max, weight_gain_max,
  beginner_penalty, intermediate_penalty, advanced_penalty,
  character_tags, icon, image_url, layout_svg_url, website_url, wikipedia_url,
  is_active, is_popular, popularity_rank, data_source, verified
)
SELECT 
  tl.slug, tl.name, tl.short_name, tl.city, tl.state, tl.country, tl.region,
  tl.length_km, tl.length_miles, tl.corners, tl.elevation_change_ft, tl.longest_straight_ft,
  tl.surface_type, tl.track_type, tl.configuration,
  tl.pro_reference_time, tl.power_gain_max, tl.grip_gain_max, tl.susp_gain_max,
  tl.brake_gain_max, tl.aero_gain_max, tl.weight_gain_max,
  tl.beginner_penalty, tl.intermediate_penalty, tl.advanced_penalty,
  tl.character_tags, tl.icon, tl.image_url, tl.layout_svg_url, tl.website_url, tl.wikipedia_url,
  tl.is_active, tl.is_popular, tl.popularity_rank, tl.data_source, tl.verified
FROM tracks_legacy tl
WHERE NOT EXISTS (
  SELECT 1 FROM track_venues tv WHERE tv.slug = tl.slug
);

-- ============================================================================
-- STEP 5: Rename track_venues to tracks
-- ============================================================================
ALTER TABLE track_venues RENAME TO tracks;

-- Rename the unique constraint if it exists
ALTER INDEX IF EXISTS track_venues_slug_key RENAME TO tracks_slug_key;
ALTER INDEX IF EXISTS track_venues_pkey RENAME TO tracks_pkey;

-- ============================================================================
-- STEP 6: Create new indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_tracks_country ON tracks(country);
CREATE INDEX IF NOT EXISTS idx_tracks_state ON tracks(state);
CREATE INDEX IF NOT EXISTS idx_tracks_region ON tracks(region);
CREATE INDEX IF NOT EXISTS idx_tracks_type ON tracks(track_type);
CREATE INDEX IF NOT EXISTS idx_tracks_popular ON tracks(is_popular) WHERE is_popular = true;
CREATE INDEX IF NOT EXISTS idx_tracks_active ON tracks(is_active) WHERE is_active = true;

-- ============================================================================
-- STEP 7: Update foreign key constraint on car_track_lap_times
-- ============================================================================
-- First drop the old constraint
ALTER TABLE car_track_lap_times 
  DROP CONSTRAINT IF EXISTS car_track_lap_times_track_id_fkey;

-- Add new constraint pointing to renamed tracks table
ALTER TABLE car_track_lap_times
  ADD CONSTRAINT car_track_lap_times_track_id_fkey 
  FOREIGN KEY (track_id) REFERENCES tracks(id);

-- ============================================================================
-- STEP 8: Update foreign key on track_layouts if it exists
-- ============================================================================
ALTER TABLE track_layouts 
  DROP CONSTRAINT IF EXISTS track_layouts_track_id_fkey;

-- The track_layouts.track_id should now reference the new tracks table
-- But we need to check if track_id values are valid first
ALTER TABLE track_layouts
  ADD CONSTRAINT track_layouts_track_id_fkey 
  FOREIGN KEY (track_id) REFERENCES tracks(id);

-- ============================================================================
-- STEP 9: Create updated_at trigger for tracks
-- ============================================================================
CREATE OR REPLACE FUNCTION update_tracks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tracks_updated_at ON tracks;
CREATE TRIGGER tracks_updated_at
  BEFORE UPDATE ON tracks
  FOR EACH ROW EXECUTE FUNCTION update_tracks_updated_at();

-- ============================================================================
-- STEP 10: Create view alias track_venues for backward compatibility
-- ============================================================================
CREATE OR REPLACE VIEW track_venues AS SELECT * FROM tracks;

-- ============================================================================
-- STEP 11: Update RLS policies
-- ============================================================================
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON tracks;
CREATE POLICY "Tracks are viewable by everyone"
  ON tracks FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage tracks" ON tracks;
CREATE POLICY "Admins can manage tracks"
  ON tracks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.tier = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT ON tracks TO anon, authenticated;
GRANT ALL ON tracks TO service_role;
GRANT SELECT ON track_venues TO anon, authenticated;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- After this migration:
-- - tracks table contains ALL track data (was track_venues + tracks_legacy merged)
-- - track_venues is now a VIEW pointing to tracks for backward compatibility
-- - tracks_legacy contains the old tracks table data (can be dropped later)
-- - car_track_lap_times.track_id now correctly references tracks table
-- - All lap times should now have valid track references
-- ============================================================================
