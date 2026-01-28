-- ============================================================================
-- Add Missing VIR (Virginia International Raceway) Track Configurations
-- 
-- VIR has 6 configurations, but we only had 3 (Full, North, South).
-- This migration adds the missing Grand East, Grand West, and Patriot courses.
--
-- Reference: https://virnow.com/track/configurations/
-- ============================================================================

-- Grand East Course - The longest configuration at 4.2 miles
-- Combines most of the Full Course and Patriot Course
INSERT INTO tracks (
  slug, name, short_name, city, state, country, region,
  length_miles, corners, elevation_change_ft, longest_straight_ft,
  track_type, configuration, pro_reference_time,
  power_gain_max, grip_gain_max, susp_gain_max, brake_gain_max, aero_gain_max, weight_gain_max,
  beginner_penalty, intermediate_penalty, advanced_penalty,
  character_tags, icon, is_popular, popularity_rank, data_source
) VALUES
('vir-grand-east', 'Virginia International Raceway - Grand East', 'VIR Grand East', 'Alton', 'VA', 'USA', 'Southeast',
 4.2, 24, 200, 3000, 'road_course', 'grand-east', 158,
 6.0, 5.5, 4.5, 4.0, 3.5, 3.0, 42, 17, 5,
 ARRAY['technical', 'elevation', 'challenging', 'long'], '🌲', false, 45, 'manual')
ON CONFLICT (slug) DO NOTHING;

-- Grand West Course - 3.97 miles, seldom used long configuration
INSERT INTO tracks (
  slug, name, short_name, city, state, country, region,
  length_miles, corners, elevation_change_ft, longest_straight_ft,
  track_type, configuration, pro_reference_time,
  power_gain_max, grip_gain_max, susp_gain_max, brake_gain_max, aero_gain_max, weight_gain_max,
  beginner_penalty, intermediate_penalty, advanced_penalty,
  character_tags, icon, is_popular, popularity_rank, data_source
) VALUES
('vir-grand-west', 'Virginia International Raceway - Grand West', 'VIR Grand West', 'Alton', 'VA', 'USA', 'Southeast',
 3.97, 22, 180, 2800, 'road_course', 'grand-west', 150,
 5.8, 5.3, 4.3, 3.8, 3.3, 2.8, 40, 16, 5,
 ARRAY['technical', 'elevation', 'challenging'], '🌲', false, 55, 'manual')
ON CONFLICT (slug) DO NOTHING;

-- Patriot Course - 1.1 miles, entirely contained within Full Course
-- Can operate simultaneously with another configuration
INSERT INTO tracks (
  slug, name, short_name, city, state, country, region,
  length_miles, corners, elevation_change_ft, longest_straight_ft,
  track_type, configuration, pro_reference_time,
  power_gain_max, grip_gain_max, susp_gain_max, brake_gain_max, aero_gain_max, weight_gain_max,
  beginner_penalty, intermediate_penalty, advanced_penalty,
  character_tags, icon, is_popular, popularity_rank, data_source
) VALUES
('vir-patriot', 'Virginia International Raceway - Patriot', 'VIR Patriot', 'Alton', 'VA', 'USA', 'Southeast',
 1.1, 6, 50, 1200, 'road_course', 'patriot', 48,
 3.0, 3.5, 2.5, 2.0, 1.5, 1.0, 15, 6, 2,
 ARRAY['short', 'club', 'beginner-friendly'], '🌲', false, 80, 'manual')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- VIR Configuration Summary (after this migration):
-- 
-- | Slug           | Name          | Length | Pro Ref Time |
-- |----------------|---------------|--------|--------------|
-- | vir-full       | Full Course   | 3.27mi | 125s (2:05)  |
-- | vir-north      | North Course  | 2.25mi | 95s (1:35)   |
-- | vir-south      | South Course  | 1.65mi | 72s (1:12)   |
-- | vir-grand-east | Grand East    | 4.20mi | 158s (2:38)  | <- NEW
-- | vir-grand-west | Grand West    | 3.97mi | 150s (2:30)  | <- NEW
-- | vir-patriot    | Patriot       | 1.10mi | 48s (0:48)   | <- NEW
-- ============================================================================
