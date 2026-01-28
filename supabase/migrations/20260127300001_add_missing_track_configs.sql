-- ============================================================================
-- Add Missing Track Configurations for Multi-Config Tracks
-- 
-- This migration adds commonly used configurations that were missing.
-- ============================================================================

-- ============================================================================
-- BUTTONWILLOW RACEWAY - Popular Configurations
-- Reference: https://buttonwillowraceway.com/track-info/
-- Buttonwillow has 40+ configs, we add the most popular ones
-- ============================================================================

-- Config 13A CW - The "A-section" variant of the popular 13CW
INSERT INTO tracks (
  slug, name, short_name, city, state, country, region,
  length_miles, corners, elevation_change_ft, longest_straight_ft,
  track_type, configuration, pro_reference_time,
  power_gain_max, grip_gain_max, susp_gain_max, brake_gain_max, aero_gain_max, weight_gain_max,
  beginner_penalty, intermediate_penalty, advanced_penalty,
  character_tags, icon, is_popular, popularity_rank, data_source
) VALUES
('buttonwillow-13a-cw', 'Buttonwillow Raceway - 13A CW', 'BTN 13A CW', 'Buttonwillow', 'CA', 'USA', 'West Coast',
 2.72, 15, 50, 2500, 'road_course', '13a-cw', 110,
 5.0, 4.5, 3.0, 3.0, 2.0, 2.0, 30, 12, 4,
 ARRAY['technical', 'flat', 'multiple-configs'], '🌾', false, 42, 'manual')
ON CONFLICT (slug) DO NOTHING;

-- Config 13 CCW - Counter-clockwise variant
INSERT INTO tracks (
  slug, name, short_name, city, state, country, region,
  length_miles, corners, elevation_change_ft, longest_straight_ft,
  track_type, configuration, pro_reference_time,
  power_gain_max, grip_gain_max, susp_gain_max, brake_gain_max, aero_gain_max, weight_gain_max,
  beginner_penalty, intermediate_penalty, advanced_penalty,
  character_tags, icon, is_popular, popularity_rank, data_source
) VALUES
('buttonwillow-13-ccw', 'Buttonwillow Raceway - 13 CCW', 'BTN 13 CCW', 'Buttonwillow', 'CA', 'USA', 'West Coast',
 2.68, 14, 50, 2500, 'road_course', '13-ccw', 108,
 5.0, 4.5, 3.0, 3.0, 2.0, 2.0, 30, 12, 4,
 ARRAY['technical', 'flat', 'multiple-configs'], '🌾', false, 43, 'manual')
ON CONFLICT (slug) DO NOTHING;

-- Config 25 CW - Popular racing configuration with long straights
INSERT INTO tracks (
  slug, name, short_name, city, state, country, region,
  length_miles, corners, elevation_change_ft, longest_straight_ft,
  track_type, configuration, pro_reference_time,
  power_gain_max, grip_gain_max, susp_gain_max, brake_gain_max, aero_gain_max, weight_gain_max,
  beginner_penalty, intermediate_penalty, advanced_penalty,
  character_tags, icon, is_popular, popularity_rank, data_source
) VALUES
('buttonwillow-25-cw', 'Buttonwillow Raceway - 25 CW', 'BTN 25 CW', 'Buttonwillow', 'CA', 'USA', 'West Coast',
 2.92, 13, 50, 2800, 'road_course', '25-cw', 115,
 5.5, 4.5, 3.0, 3.0, 2.5, 2.0, 32, 13, 4,
 ARRAY['technical', 'flat', 'long-straights'], '🌾', false, 44, 'manual')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- WILLOW SPRINGS - Horse Thief Mile (separate small track)
-- Reference: https://willowspringsraceway.com/
-- ============================================================================

INSERT INTO tracks (
  slug, name, short_name, city, state, country, region,
  length_miles, corners, elevation_change_ft, longest_straight_ft,
  track_type, configuration, pro_reference_time,
  power_gain_max, grip_gain_max, susp_gain_max, brake_gain_max, aero_gain_max, weight_gain_max,
  beginner_penalty, intermediate_penalty, advanced_penalty,
  character_tags, icon, is_popular, popularity_rank, data_source
) VALUES
('willow-springs-htm', 'Willow Springs - Horse Thief Mile', 'HTM', 'Rosamond', 'CA', 'USA', 'West Coast',
 1.0, 8, 60, 800, 'road_course', 'horse-thief', 45,
 2.5, 4.0, 3.0, 2.5, 1.5, 1.5, 14, 6, 2,
 ARRAY['technical', 'tight', 'desert', 'beginner-friendly'], '🏜️', false, 65, 'manual')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- LAGUNA SECA - Short Course (rarely used but exists)
-- ============================================================================

INSERT INTO tracks (
  slug, name, short_name, city, state, country, region,
  length_miles, corners, elevation_change_ft, longest_straight_ft,
  track_type, configuration, pro_reference_time,
  power_gain_max, grip_gain_max, susp_gain_max, brake_gain_max, aero_gain_max, weight_gain_max,
  beginner_penalty, intermediate_penalty, advanced_penalty,
  character_tags, icon, is_popular, popularity_rank, data_source
) VALUES
('laguna-seca-short', 'WeatherTech Raceway Laguna Seca - Short', 'Laguna Short', 'Monterey', 'CA', 'USA', 'West Coast',
 1.4, 7, 100, 1500, 'road_course', 'short', 62,
 3.0, 4.5, 3.5, 2.0, 1.5, 1.5, 18, 7, 2,
 ARRAY['technical', 'elevation', 'club'], '🏁', false, 66, 'manual')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- MID-OHIO - Club Course (shorter configuration)
-- ============================================================================

INSERT INTO tracks (
  slug, name, short_name, city, state, country, region,
  length_miles, corners, elevation_change_ft, longest_straight_ft,
  track_type, configuration, pro_reference_time,
  power_gain_max, grip_gain_max, susp_gain_max, brake_gain_max, aero_gain_max, weight_gain_max,
  beginner_penalty, intermediate_penalty, advanced_penalty,
  character_tags, icon, is_popular, popularity_rank, data_source
) VALUES
('mid-ohio-short', 'Mid-Ohio Sports Car Course - Short', 'Mid-Ohio Short', 'Lexington', 'OH', 'USA', 'Midwest',
 1.78, 8, 80, 1600, 'road_course', 'short', 72,
 3.5, 4.0, 3.0, 2.5, 2.0, 1.5, 20, 8, 2,
 ARRAY['technical', 'club'], '🌽', false, 67, 'manual')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- Configuration Summary:
-- 
-- | Slug                    | Track          | Length | Config    |
-- |-------------------------|----------------|--------|-----------|
-- | buttonwillow-13a-cw     | Buttonwillow   | 2.72mi | 13A CW    |
-- | buttonwillow-13-ccw     | Buttonwillow   | 2.68mi | 13 CCW    |
-- | buttonwillow-25-cw      | Buttonwillow   | 2.92mi | 25 CW     |
-- | willow-springs-htm      | Willow Springs | 1.0mi  | HTM       |
-- | laguna-seca-short       | Laguna Seca    | 1.4mi  | Short     |
-- | mid-ohio-short          | Mid-Ohio       | 1.78mi | Short     |
-- ============================================================================
