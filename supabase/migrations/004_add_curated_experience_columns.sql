-- ============================================================================
-- MIGRATION: Add Curated Experience Columns to Cars Table
-- 
-- This migration adds all the new columns required for the curated car
-- experience feature. These columns store rich editorial content that
-- transforms car pages from stats displays into comprehensive guides.
--
-- Run in Supabase SQL Editor to apply.
-- ============================================================================

-- ============================================================================
-- BRAND & PLATFORM INFO
-- ============================================================================
ALTER TABLE cars ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS platform_cost_tier TEXT;

COMMENT ON COLUMN cars.brand IS 'Manufacturer brand (e.g., Porsche, Ferrari, BMW)';
COMMENT ON COLUMN cars.country IS 'Country of origin (e.g., Germany, Italy, Japan)';
COMMENT ON COLUMN cars.platform_cost_tier IS 'Platform cost category for grouping';

-- ============================================================================
-- OWNERSHIP & USABILITY
-- ============================================================================
ALTER TABLE cars ADD COLUMN IF NOT EXISTS manual_available BOOLEAN DEFAULT true;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS seats INTEGER CHECK (seats > 0 AND seats <= 6);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS daily_usability_tag TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS maintenance_cost_index TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS insurance_cost_index TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS fuel_economy_combined DECIMAL(4,1);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS common_issues JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS years_to_avoid TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS recommended_years_note TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS ownership_cost_notes TEXT;

COMMENT ON COLUMN cars.manual_available IS 'Whether manual transmission option exists';
COMMENT ON COLUMN cars.seats IS 'Number of seats (typically 2 or 4)';
COMMENT ON COLUMN cars.daily_usability_tag IS 'Usability classification: daily | weekend | track-focused';
COMMENT ON COLUMN cars.maintenance_cost_index IS 'Relative maintenance cost: low | moderate | high | very-high';
COMMENT ON COLUMN cars.insurance_cost_index IS 'Relative insurance cost: low | moderate | high | very-high';
COMMENT ON COLUMN cars.fuel_economy_combined IS 'Combined fuel economy in MPG';

-- ============================================================================
-- IDENTITY & STORY
-- ============================================================================
ALTER TABLE cars ADD COLUMN IF NOT EXISTS essence TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS heritage TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS design_philosophy TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS motorsport_history TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS generation_code TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS predecessors JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS successors JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN cars.essence IS 'Single sentence capturing the car''s soul and identity';
COMMENT ON COLUMN cars.heritage IS '2-3 paragraphs on the car''s history and significance';
COMMENT ON COLUMN cars.design_philosophy IS 'What engineers and designers aimed to achieve';
COMMENT ON COLUMN cars.motorsport_history IS 'Racing pedigree and competition heritage';
COMMENT ON COLUMN cars.generation_code IS 'Chassis/generation code (e.g., 982, F355, E92)';
COMMENT ON COLUMN cars.predecessors IS 'Array of predecessor model names';
COMMENT ON COLUMN cars.successors IS 'Array of successor model names';

-- ============================================================================
-- DRIVING EXPERIENCE
-- ============================================================================
ALTER TABLE cars ADD COLUMN IF NOT EXISTS engine_character TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS transmission_feel TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS chassis_dynamics TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS steering_feel TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS brake_confidence TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS sound_signature TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS comfort_track_balance TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS comfort_notes TEXT;

COMMENT ON COLUMN cars.engine_character IS 'Throttle response, power delivery, rev character';
COMMENT ON COLUMN cars.transmission_feel IS 'Shift quality, clutch engagement, PDK/manual experience';
COMMENT ON COLUMN cars.chassis_dynamics IS 'Balance, turn-in, predictability, rotation';
COMMENT ON COLUMN cars.steering_feel IS 'Weight, feedback, precision, communication';
COMMENT ON COLUMN cars.brake_confidence IS 'Pedal feel, initial bite, fade resistance';
COMMENT ON COLUMN cars.sound_signature IS 'Exhaust note character and emotional quality';
COMMENT ON COLUMN cars.comfort_track_balance IS 'Balance type: daily | weekend | track-focused | race';
COMMENT ON COLUMN cars.comfort_notes IS 'Notes on ride quality, NVH, daily usability';

-- ============================================================================
-- ENHANCED STRENGTHS & WEAKNESSES
-- ============================================================================
ALTER TABLE cars ADD COLUMN IF NOT EXISTS defining_strengths JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS honest_weaknesses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS ideal_owner TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS not_ideal_for TEXT;

COMMENT ON COLUMN cars.defining_strengths IS 'Array of {point, detail} objects for key strengths';
COMMENT ON COLUMN cars.honest_weaknesses IS 'Array of {point, detail} objects for honest tradeoffs';
COMMENT ON COLUMN cars.ideal_owner IS 'Description of the ideal owner profile';
COMMENT ON COLUMN cars.not_ideal_for IS 'Who should NOT buy this car';

-- ============================================================================
-- BUYER'S GUIDE
-- ============================================================================
ALTER TABLE cars ADD COLUMN IF NOT EXISTS buyers_summary TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS best_years_detailed JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS years_to_avoid_detailed TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS must_have_options JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS nice_to_have_options JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS pre_inspection_checklist JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS ppi_recommendations TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS market_position TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS market_commentary TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS price_guide JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN cars.buyers_summary IS 'Executive summary of buying advice';
COMMENT ON COLUMN cars.best_years_detailed IS 'Array of {years, reason} for recommended years';
COMMENT ON COLUMN cars.years_to_avoid_detailed IS 'Years to avoid and why';
COMMENT ON COLUMN cars.must_have_options IS 'Array of {option, reason} for essential options';
COMMENT ON COLUMN cars.nice_to_have_options IS 'Array of {option, reason} for desirable options';
COMMENT ON COLUMN cars.pre_inspection_checklist IS 'Array of items to check before purchase';
COMMENT ON COLUMN cars.ppi_recommendations IS 'Pre-purchase inspection recommendations';
COMMENT ON COLUMN cars.market_position IS 'Market trend: appreciating | stable | depreciating';
COMMENT ON COLUMN cars.market_commentary IS 'Detailed market analysis and pricing trends';
COMMENT ON COLUMN cars.price_guide IS 'Object with price ranges by condition/mileage';

-- ============================================================================
-- OWNERSHIP REALITY
-- ============================================================================
ALTER TABLE cars ADD COLUMN IF NOT EXISTS annual_ownership_cost JSONB DEFAULT '{}'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS major_service_costs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS common_issues_detailed JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS parts_availability TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS parts_notes TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS dealer_vs_independent TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS dealer_notes TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS diy_friendliness TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS diy_notes TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS warranty_info TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS insurance_notes TEXT;

COMMENT ON COLUMN cars.annual_ownership_cost IS 'Object with low/typical/heavy cost estimates';
COMMENT ON COLUMN cars.major_service_costs IS 'Array of {service, interval, cost, note} objects';
COMMENT ON COLUMN cars.common_issues_detailed IS 'Array of {issue, severity, yearsAffected, cost, prevention} objects';
COMMENT ON COLUMN cars.parts_availability IS 'Parts availability rating: excellent | good | fair | poor';
COMMENT ON COLUMN cars.parts_notes IS 'Notes on parts sourcing and availability';
COMMENT ON COLUMN cars.dealer_vs_independent IS 'Recommendation: dealer | independent | either';
COMMENT ON COLUMN cars.dealer_notes IS 'Notes on dealer vs independent shop choice';
COMMENT ON COLUMN cars.diy_friendliness IS 'DIY rating: high | moderate | low | not-recommended';
COMMENT ON COLUMN cars.diy_notes IS 'Notes on DIY maintenance feasibility';
COMMENT ON COLUMN cars.warranty_info IS 'Extended warranty options and recommendations';
COMMENT ON COLUMN cars.insurance_notes IS 'Insurance considerations and tips';

-- ============================================================================
-- TRACK & PERFORMANCE
-- ============================================================================
ALTER TABLE cars ADD COLUMN IF NOT EXISTS track_readiness TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS track_readiness_notes TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS cooling_capacity TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS brake_fade_resistance TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS recommended_track_prep JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS popular_track_mods JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS laptime_benchmarks JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN cars.track_readiness IS 'Track readiness level: stock-ready | needs-prep | dedicated-track';
COMMENT ON COLUMN cars.track_readiness_notes IS 'Explanation of track readiness rating';
COMMENT ON COLUMN cars.cooling_capacity IS 'Cooling adequacy: excellent | good | marginal | needs-upgrade';
COMMENT ON COLUMN cars.brake_fade_resistance IS 'Brake fade rating: excellent | good | fair | poor';
COMMENT ON COLUMN cars.recommended_track_prep IS 'Array of recommended track preparation items';
COMMENT ON COLUMN cars.popular_track_mods IS 'Array of popular track-focused modifications';
COMMENT ON COLUMN cars.laptime_benchmarks IS 'Array of {track, time, conditions, source} objects';

-- ============================================================================
-- ALTERNATIVES
-- ============================================================================
ALTER TABLE cars ADD COLUMN IF NOT EXISTS direct_competitors JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS if_you_want_more JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS if_you_want_less JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS similar_driving_experience JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN cars.direct_competitors IS 'Array of {name, comparison} for direct competitors';
COMMENT ON COLUMN cars.if_you_want_more IS 'Array of {name, reason} for step-up options';
COMMENT ON COLUMN cars.if_you_want_less IS 'Array of {name, reason} for budget alternatives';
COMMENT ON COLUMN cars.similar_driving_experience IS 'Array of cars with similar driving character';

-- ============================================================================
-- COMMUNITY & CULTURE
-- ============================================================================
ALTER TABLE cars ADD COLUMN IF NOT EXISTS community_strength TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS community_notes TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS key_resources JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS facebook_groups JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS annual_events JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS aftermarket_scene_notes TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS resale_reputation TEXT;

COMMENT ON COLUMN cars.community_strength IS 'Community size/activity: strong | growing | niche | limited';
COMMENT ON COLUMN cars.community_notes IS 'Notes about owner community character';
COMMENT ON COLUMN cars.key_resources IS 'Array of {name, url, description} for key forums/resources';
COMMENT ON COLUMN cars.facebook_groups IS 'Array of {name, url} for Facebook groups';
COMMENT ON COLUMN cars.annual_events IS 'Array of {name, location, description} for annual events';
COMMENT ON COLUMN cars.aftermarket_scene_notes IS 'Notes on aftermarket support and tuning scene';
COMMENT ON COLUMN cars.resale_reputation IS 'Notes on resale value and market reputation';

-- ============================================================================
-- MEDIA & REVIEWS
-- ============================================================================
ALTER TABLE cars ADD COLUMN IF NOT EXISTS notable_reviews JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS must_watch_videos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS expert_quotes JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN cars.notable_reviews IS 'Array of {publication, title, url, summary} objects';
COMMENT ON COLUMN cars.must_watch_videos IS 'Array of {creator, title, url, description} objects';
COMMENT ON COLUMN cars.expert_quotes IS 'Array of {quote, author, publication} objects';

-- ============================================================================
-- CREATE INDEXES FOR NEW COLUMNS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_cars_brand ON cars(brand);
CREATE INDEX IF NOT EXISTS idx_cars_country ON cars(country);
CREATE INDEX IF NOT EXISTS idx_cars_market_position ON cars(market_position);
CREATE INDEX IF NOT EXISTS idx_cars_track_readiness ON cars(track_readiness);
CREATE INDEX IF NOT EXISTS idx_cars_community_strength ON cars(community_strength);

-- ============================================================================
-- UPDATE TABLE COMMENT
-- ============================================================================
COMMENT ON TABLE cars IS 'Vehicle database for SuperNatural Motorsports with comprehensive curated content. Includes specs, scores, editorial content, buyer''s guide, ownership costs, track performance, and community information.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- After running this migration:
-- 1. Verify columns exist: SELECT column_name FROM information_schema.columns WHERE table_name = 'cars' ORDER BY ordinal_position;
-- 2. Update cars with curated content using UPDATE statements
-- 3. Update carsClient.js to map new columns from snake_case to camelCase

