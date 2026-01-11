-- Migration: Add objective-based upgrade structure to car_tuning_profiles
-- This is ADDITIVE - keeps existing columns for backwards compatibility
-- Part of tuning data consolidation plan

-- Add new objective-based columns
ALTER TABLE car_tuning_profiles 
ADD COLUMN IF NOT EXISTS upgrades_by_objective JSONB DEFAULT '{}';

COMMENT ON COLUMN car_tuning_profiles.upgrades_by_objective IS 
'Objective-based upgrades structure. Keys: power, handling, braking, cooling, sound, aero. Each contains array of car-specific upgrades with gains, costs, brands, difficulty.';

-- Add curated packages (pre-built bundles)
ALTER TABLE car_tuning_profiles 
ADD COLUMN IF NOT EXISTS curated_packages JSONB DEFAULT '[]';

COMMENT ON COLUMN car_tuning_profiles.curated_packages IS 
'Pre-built upgrade bundles like "Daily Driver+", "Track Ready". Each has name, description, included upgrades, total cost.';

-- Add platform insights (consolidated strengths, weaknesses, tips)
ALTER TABLE car_tuning_profiles 
ADD COLUMN IF NOT EXISTS platform_insights JSONB DEFAULT '{}';

COMMENT ON COLUMN car_tuning_profiles.platform_insights IS 
'Platform-specific insights: strengths, weaknesses, community_tips, youtube_insights. Consolidates data from multiple sources.';

-- Add data quality tier
ALTER TABLE car_tuning_profiles 
ADD COLUMN IF NOT EXISTS data_quality_tier TEXT DEFAULT 'unknown'
CHECK (data_quality_tier IN ('verified', 'researched', 'enriched', 'templated', 'skeleton', 'unknown'));

COMMENT ON COLUMN car_tuning_profiles.data_quality_tier IS 
'Quality tier: verified (manual review), researched (real data), enriched (YouTube-derived), templated (generic), skeleton (empty), unknown (not assessed).';

-- Add data sources tracking (more detailed than research_sources)
ALTER TABLE car_tuning_profiles 
ADD COLUMN IF NOT EXISTS data_sources JSONB DEFAULT '{}';

COMMENT ON COLUMN car_tuning_profiles.data_sources IS 
'Tracks where data came from: {carUpgradeRecommendations: true, carsTable: true, youtube: ["video_id1"], manual: true}';

-- Create index for data quality queries
CREATE INDEX IF NOT EXISTS idx_car_tuning_profiles_quality_tier 
ON car_tuning_profiles(data_quality_tier);

-- Create index for objective queries (GIN for JSONB)
CREATE INDEX IF NOT EXISTS idx_car_tuning_profiles_objectives 
ON car_tuning_profiles USING GIN (upgrades_by_objective);

-- Note: stage_progressions, tuning_platforms, power_limits, brand_recommendations 
-- are KEPT for backwards compatibility. They will be deprecated after migration.
-- Do NOT remove them in this migration.
