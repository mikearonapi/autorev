-- ============================================================================
-- P1 Data Consolidation Migration
-- Date: January 15, 2026
-- Purpose: Establish single source of truth for known issues and upgrades
-- ============================================================================

-- ============================================================================
-- 1. DEPRECATE vehicle_known_issues TABLE
-- ============================================================================

-- Verify car_issues has all data from vehicle_known_issues first
-- This should return 0 if all data is migrated
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM vehicle_known_issues vki
  WHERE NOT EXISTS (
    SELECT 1 FROM car_issues ci 
    WHERE ci.car_slug = vki.car_slug 
    AND (ci.title ILIKE '%' || vki.issue_title || '%' OR ci.title = vki.issue_title)
  );
  
  IF missing_count > 0 THEN
    RAISE WARNING 'vehicle_known_issues has % rows not in car_issues - review before deprecating', missing_count;
  ELSE
    RAISE NOTICE 'All vehicle_known_issues data exists in car_issues - safe to deprecate';
  END IF;
END $$;

-- Add deprecation comment
COMMENT ON TABLE vehicle_known_issues IS 
'DEPRECATED 2026-01-15: Use car_issues as the source of truth for known issues. 
This table is preserved for historical reference only. 
See audit/database-design-optimization-review-2026-01-11.md for details.';

-- Make table effectively read-only by removing write policies
-- (Keep read policies for backward compatibility during transition)
DROP POLICY IF EXISTS "Service role can insert vehicle_known_issues" ON vehicle_known_issues;
DROP POLICY IF EXISTS "Service role can update vehicle_known_issues" ON vehicle_known_issues;
DROP POLICY IF EXISTS "Admins can manage vehicle_known_issues" ON vehicle_known_issues;

-- ============================================================================
-- 2. DEPRECATE cars.upgrade_recommendations COLUMN
-- ============================================================================

-- Verify car_tuning_profiles has upgrade data for all cars
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM cars c
  LEFT JOIN car_tuning_profiles ctp ON ctp.car_id = c.id
  WHERE ctp.id IS NULL 
    OR ctp.upgrades_by_objective IS NULL 
    OR ctp.upgrades_by_objective = '{}'::jsonb;
  
  IF missing_count > 0 THEN
    RAISE WARNING '% cars missing tuning profile data - consider enriching before deprecating', missing_count;
  ELSE
    RAISE NOTICE 'All cars have tuning profiles - safe to deprecate cars.upgrade_recommendations';
  END IF;
END $$;

-- Add deprecation comments
COMMENT ON COLUMN cars.upgrade_recommendations IS 
'DEPRECATED 2026-01-15: Use car_tuning_profiles.upgrades_by_objective instead.
This column preserved for backward compatibility during transition.';

COMMENT ON COLUMN cars.popular_track_mods IS 
'DEPRECATED 2026-01-15: Use car_tuning_profiles.upgrades_by_objective instead.
This column preserved for backward compatibility during transition.';

-- ============================================================================
-- 3. ADD NOT NULL CONSTRAINTS ON car_id COLUMNS
-- ============================================================================

-- Only add constraints if all values are populated
DO $$
BEGIN
  -- car_dyno_runs
  IF NOT EXISTS (SELECT 1 FROM car_dyno_runs WHERE car_id IS NULL) THEN
    ALTER TABLE car_dyno_runs ALTER COLUMN car_id SET NOT NULL;
    RAISE NOTICE 'Added NOT NULL to car_dyno_runs.car_id';
  ELSE
    RAISE WARNING 'car_dyno_runs has NULL car_id values - constraint not added';
  END IF;

  -- car_track_lap_times
  IF NOT EXISTS (SELECT 1 FROM car_track_lap_times WHERE car_id IS NULL) THEN
    ALTER TABLE car_track_lap_times ALTER COLUMN car_id SET NOT NULL;
    RAISE NOTICE 'Added NOT NULL to car_track_lap_times.car_id';
  ELSE
    RAISE WARNING 'car_track_lap_times has NULL car_id values - constraint not added';
  END IF;

  -- user_favorites
  IF NOT EXISTS (SELECT 1 FROM user_favorites WHERE car_id IS NULL) THEN
    ALTER TABLE user_favorites ALTER COLUMN car_id SET NOT NULL;
    RAISE NOTICE 'Added NOT NULL to user_favorites.car_id';
  ELSE
    RAISE WARNING 'user_favorites has NULL car_id values - constraint not added';
  END IF;

  -- user_projects
  IF NOT EXISTS (SELECT 1 FROM user_projects WHERE car_id IS NULL) THEN
    ALTER TABLE user_projects ALTER COLUMN car_id SET NOT NULL;
    RAISE NOTICE 'Added NOT NULL to user_projects.car_id';
  ELSE
    RAISE WARNING 'user_projects has NULL car_id values - constraint not added';
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error adding NOT NULL constraints: %', SQLERRM;
END $$;

-- ============================================================================
-- 4. OPTIMIZED get_car_ai_context_v2 RPC
-- ============================================================================

-- This version uses car_id exclusively (no OR car_slug) for better query plans
CREATE OR REPLACE FUNCTION get_car_ai_context_v2(p_car_slug TEXT)
RETURNS JSONB AS $$
DECLARE
  v_car_id UUID;
  v_result JSONB;
BEGIN
  -- Single slug resolution at the start
  SELECT id INTO v_car_id FROM cars WHERE slug = p_car_slug;
  IF v_car_id IS NULL THEN
    RETURN jsonb_build_object('error', 'car_not_found', 'car_slug', p_car_slug);
  END IF;

  SELECT jsonb_build_object(
    'car', to_jsonb(c),
    
    -- Use car_id ONLY (no OR car_slug) for efficient index usage
    'fuelEconomy', (
      SELECT to_jsonb(f) 
      FROM car_fuel_economy f 
      WHERE f.car_id = v_car_id 
      LIMIT 1
    ),
    
    'safety', (
      SELECT to_jsonb(s) 
      FROM car_safety_data s 
      WHERE s.car_id = v_car_id 
      LIMIT 1
    ),
    
    'marketPricing', (
      SELECT to_jsonb(p) 
      FROM car_market_pricing p 
      WHERE p.car_id = v_car_id 
      LIMIT 1
    ),
    
    'priceHistorySample', (
      SELECT COALESCE(jsonb_agg(to_jsonb(h) ORDER BY h.recorded_at DESC), '[]'::jsonb)
      FROM (
        SELECT *
        FROM car_price_history h
        WHERE h.car_id = v_car_id
        ORDER BY h.recorded_at DESC
        LIMIT 24
      ) h
    ),
    
    'recallsSample', (
      SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.report_received_date DESC NULLS LAST), '[]'::jsonb)
      FROM (
        SELECT *
        FROM car_recalls r
        WHERE r.car_id = v_car_id
        ORDER BY r.report_received_date DESC NULLS LAST
        LIMIT 20
      ) r
    ),
    
    -- Tuning profile from dedicated table (source of truth)
    'tuningProfile', (
      SELECT jsonb_build_object(
        'upgrades_by_objective', tp.upgrades_by_objective,
        'performance_potential', tp.performance_potential,
        'platform_strengths', tp.platform_strengths,
        'platform_weaknesses', tp.platform_weaknesses
      )
      FROM car_tuning_profiles tp
      WHERE tp.car_id = v_car_id
    ),
    
    'youtube', jsonb_build_object(
      'videoCount', (
        SELECT COUNT(*) 
        FROM youtube_video_car_links y 
        WHERE y.car_id = v_car_id
      ),
      'topVideos', (
        SELECT COALESCE(jsonb_agg(to_jsonb(v) ORDER BY v.quality_score DESC NULLS LAST), '[]'::jsonb)
        FROM (
          SELECT yv.video_id, yv.url, yv.title, yv.channel_name, yv.published_at, 
                 yv.content_type, yv.one_line_take, yv.quality_score
          FROM youtube_video_car_links yl
          JOIN youtube_videos yv ON yv.video_id = yl.video_id
          WHERE yl.car_id = v_car_id
            AND yv.processing_status = 'processed'
            AND yv.is_hidden = false
          ORDER BY yv.quality_score DESC NULLS LAST, yv.published_at DESC NULLS LAST
          LIMIT 5
        ) v
      )
    ),
    
    'issuesCount', (
      SELECT COUNT(*) 
      FROM car_issues i 
      WHERE i.car_id = v_car_id
    ),
    
    'maintenanceSummary', (
      SELECT get_car_maintenance_summary(p_car_slug)
    )
  )
  INTO v_result
  FROM cars c
  WHERE c.id = v_car_id;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION get_car_ai_context_v2 IS 
'Optimized version of get_car_ai_context that uses car_id exclusively after slug resolution.
Returns a single JSON blob with car + enrichment + media summaries for AL context building.
Performance improvement: Uses index-only scans by avoiding OR car_slug clauses.';

-- ============================================================================
-- 5. NEW RPC: get_car_tuning_context FOR AL recommend_build TOOL
-- ============================================================================

CREATE OR REPLACE FUNCTION get_car_tuning_context(p_car_slug TEXT)
RETURNS JSONB AS $$
DECLARE
  v_car_id UUID;
BEGIN
  SELECT id INTO v_car_id FROM cars WHERE slug = p_car_slug;
  IF v_car_id IS NULL THEN
    RETURN jsonb_build_object('error', 'car_not_found', 'car_slug', p_car_slug);
  END IF;

  RETURN jsonb_build_object(
    'car', (
      SELECT jsonb_build_object(
        'id', c.id,
        'slug', c.slug,
        'name', c.name,
        'years', c.years,
        'hp', c.hp,
        'torque', c.torque,
        'engine', c.engine,
        'drivetrain', c.drivetrain
      )
      FROM cars c WHERE c.id = v_car_id
    ),
    
    'tuningProfile', (
      SELECT jsonb_build_object(
        'upgrades_by_objective', tp.upgrades_by_objective,
        'performance_potential', tp.performance_potential,
        'platform_strengths', tp.platform_strengths,
        'platform_weaknesses', tp.platform_weaknesses,
        'component_limits', tp.component_limits,
        'tuning_community_notes', tp.tuning_community_notes
      )
      FROM car_tuning_profiles tp WHERE tp.car_id = v_car_id
    ),
    
    'availableParts', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'part_id', p.id,
        'name', p.name,
        'category', p.category,
        'brand', p.brand_name,
        'quality_tier', p.quality_tier,
        'fitment', jsonb_build_object(
          'verified', pf.verified,
          'requires_tune', pf.requires_tune,
          'install_difficulty', pf.install_difficulty,
          'estimated_labor_hours', pf.estimated_labor_hours
        )
      ) ORDER BY pf.verified DESC, p.quality_tier DESC), '[]'::jsonb)
      FROM part_fitments pf
      JOIN parts p ON p.id = pf.part_id
      WHERE pf.car_id = v_car_id
      AND p.is_active = true
    ),
    
    'dynoBaseline', (
      SELECT jsonb_build_object(
        'peak_whp', dr.peak_whp,
        'peak_wtq', dr.peak_wtq,
        'peak_hp', dr.peak_hp,
        'peak_tq', dr.peak_tq,
        'fuel', dr.fuel,
        'source_url', dr.source_url
      )
      FROM car_dyno_runs dr
      WHERE dr.car_id = v_car_id
      AND dr.run_kind = 'baseline'
      ORDER BY dr.verified DESC, dr.created_at DESC
      LIMIT 1
    ),
    
    'upgradePackages', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'name', up.name,
        'tier', up.tier,
        'estimated_cost_low', up.estimated_cost_low,
        'estimated_cost_high', up.estimated_cost_high,
        'hp_gain', up.delta_hp
      ) ORDER BY up.tier), '[]'::jsonb)
      FROM upgrade_packages up
      WHERE up.car_slug = p_car_slug
    )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION get_car_tuning_context IS 
'Optimized RPC for Tuning Shop and AL recommend_build tool.
Returns tuning profile, available parts with fitments, dyno baseline, and upgrade packages.';

-- ============================================================================
-- 6. ADDITIONAL COMPOSITE INDEXES
-- ============================================================================

-- Optimize common AL query patterns
-- NOTE: Removed CONCURRENTLY as it cannot run inside a transaction

CREATE INDEX IF NOT EXISTS idx_car_tuning_profiles_car_id_slug
ON car_tuning_profiles(car_id, car_slug);

CREATE INDEX IF NOT EXISTS idx_community_insights_car_id_type
ON community_insights(car_id, insight_type);

CREATE INDEX IF NOT EXISTS idx_part_fitments_car_id_verified
ON part_fitments(car_id, verified) WHERE verified = true;

-- GIN index for JSONB queries on tuning data
CREATE INDEX IF NOT EXISTS idx_car_tuning_profiles_upgrades_gin
ON car_tuning_profiles USING GIN (upgrades_by_objective);

-- ============================================================================
-- 7. VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verify new functions exist
  SELECT COUNT(*) INTO v_count
  FROM pg_proc
  WHERE proname IN ('get_car_ai_context_v2', 'get_car_tuning_context');
  
  IF v_count = 2 THEN
    RAISE NOTICE 'New RPC functions created successfully';
  ELSE
    RAISE WARNING 'Expected 2 new functions, found %', v_count;
  END IF;
  
  -- Verify indexes
  SELECT COUNT(*) INTO v_count
  FROM pg_indexes
  WHERE indexname IN (
    'idx_car_tuning_profiles_car_id_slug',
    'idx_community_insights_car_id_type',
    'idx_part_fitments_car_id_verified',
    'idx_car_tuning_profiles_upgrades_gin'
  );
  
  RAISE NOTICE 'Created % of 4 new indexes', v_count;
END $$;
