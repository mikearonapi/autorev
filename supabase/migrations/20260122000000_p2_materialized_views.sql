-- Migration: P2 Materialized Views for Dashboard Queries
-- Date: January 22, 2026
-- Purpose: Create materialized views for expensive aggregate queries

-- ============================================================================
-- DAILY STATS MATERIALIZED VIEW
-- Aggregates user activity by day for dashboard
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_daily_stats;

CREATE MATERIALIZED VIEW mv_daily_stats AS
SELECT 
  date_trunc('day', created_at)::date as date,
  COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL) as active_users,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE user_id IS NULL) as anonymous_events
FROM user_events
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY date_trunc('day', created_at)::date
ORDER BY date DESC;

CREATE UNIQUE INDEX ON mv_daily_stats(date);

COMMENT ON MATERIALIZED VIEW mv_daily_stats IS 'Daily aggregated user stats - refresh via cron';

-- ============================================================================
-- CAR POPULARITY MATERIALIZED VIEW  
-- Tracks which cars are most viewed/interacted with
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_car_popularity;

CREATE MATERIALIZED VIEW mv_car_popularity AS
SELECT 
  c.id as car_id,
  c.slug as car_slug,
  c.name as car_name,
  c.brand,
  COUNT(DISTINCT pv.id) as page_views_30d,
  COUNT(DISTINCT uf.id) as favorites_count,
  COUNT(DISTINCT up.id) as projects_count,
  COUNT(DISTINCT uv.id) as owned_count,
  COUNT(DISTINCT ac.id) as al_conversations_count
FROM cars c
LEFT JOIN page_views pv ON pv.path LIKE '/cars/' || c.slug || '%' 
  AND pv.created_at > NOW() - INTERVAL '30 days'
LEFT JOIN user_favorites uf ON uf.car_id = c.id
LEFT JOIN user_projects up ON up.car_id = c.id
LEFT JOIN user_vehicles uv ON uv.matched_car_id = c.id
LEFT JOIN al_conversations ac ON ac.initial_car_slug = c.slug
  AND ac.created_at > NOW() - INTERVAL '30 days'
GROUP BY c.id, c.slug, c.name, c.brand
ORDER BY page_views_30d DESC NULLS LAST;

CREATE UNIQUE INDEX ON mv_car_popularity(car_id);
CREATE INDEX ON mv_car_popularity(page_views_30d DESC);

COMMENT ON MATERIALIZED VIEW mv_car_popularity IS 'Car popularity metrics - refresh weekly';

-- ============================================================================
-- CONTENT COVERAGE MATERIALIZED VIEW
-- Shows data completeness per car
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_content_coverage;

CREATE MATERIALIZED VIEW mv_content_coverage AS
SELECT 
  c.id as car_id,
  c.slug as car_slug,
  c.name as car_name,
  c.brand,
  -- Core data presence
  (c.hp IS NOT NULL)::int as has_hp,
  (c.torque IS NOT NULL)::int as has_torque,
  (c.price_avg IS NOT NULL)::int as has_pricing,
  -- Related data counts
  COALESCE((SELECT COUNT(*) FROM car_issues ci WHERE ci.car_slug = c.slug), 0) as issues_count,
  COALESCE((SELECT COUNT(*) FROM car_recalls cr WHERE cr.car_slug = c.slug), 0) as recalls_count,
  COALESCE((SELECT COUNT(*) FROM youtube_video_car_links yv WHERE yv.car_id = c.id), 0) as videos_count,
  COALESCE((SELECT COUNT(*) FROM community_insights cm WHERE cm.car_id = c.id), 0) as insights_count,
  COALESCE((SELECT COUNT(*) FROM part_fitments pf WHERE pf.car_id = c.id), 0) as fitments_count,
  -- Has related data flags
  EXISTS(SELECT 1 FROM car_fuel_economy fe WHERE fe.car_slug = c.slug)::int as has_fuel_economy,
  EXISTS(SELECT 1 FROM car_safety_data sd WHERE sd.car_slug = c.slug)::int as has_safety_data,
  EXISTS(SELECT 1 FROM vehicle_maintenance_specs ms WHERE ms.car_slug = c.slug)::int as has_maintenance,
  EXISTS(SELECT 1 FROM car_tuning_profiles tp WHERE tp.car_id = c.id)::int as has_tuning_profile,
  -- Calculate coverage score (0-100)
  (
    (c.hp IS NOT NULL)::int * 10 +
    (c.torque IS NOT NULL)::int * 10 +
    (c.price_avg IS NOT NULL)::int * 10 +
    EXISTS(SELECT 1 FROM car_fuel_economy WHERE car_slug = c.slug)::int * 10 +
    EXISTS(SELECT 1 FROM car_safety_data WHERE car_slug = c.slug)::int * 10 +
    EXISTS(SELECT 1 FROM vehicle_maintenance_specs WHERE car_slug = c.slug)::int * 15 +
    EXISTS(SELECT 1 FROM car_tuning_profiles WHERE car_id = c.id)::int * 15 +
    LEAST((SELECT COUNT(*) FROM youtube_video_car_links WHERE car_id = c.id), 3) * 5 +
    LEAST((SELECT COUNT(*) FROM community_insights WHERE car_id = c.id), 5) * 5
  ) as coverage_score
FROM cars c
ORDER BY coverage_score DESC;

CREATE UNIQUE INDEX ON mv_content_coverage(car_id);
CREATE INDEX ON mv_content_coverage(coverage_score DESC);
CREATE INDEX ON mv_content_coverage(brand);

COMMENT ON MATERIALIZED VIEW mv_content_coverage IS 'Data coverage metrics per car - refresh daily';

-- ============================================================================
-- EVENT COVERAGE BY CITY MATERIALIZED VIEW
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_event_coverage_by_city;

CREATE MATERIALIZED VIEW mv_event_coverage_by_city AS
SELECT 
  city,
  state,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE start_date >= CURRENT_DATE) as upcoming_events,
  COUNT(DISTINCT event_type_id) as event_types_count,
  MIN(start_date) FILTER (WHERE start_date >= CURRENT_DATE) as next_event_date
FROM events
WHERE status = 'approved'
  AND city IS NOT NULL
  AND state IS NOT NULL
GROUP BY city, state
ORDER BY upcoming_events DESC, total_events DESC;

CREATE UNIQUE INDEX ON mv_event_coverage_by_city(city, state);
CREATE INDEX ON mv_event_coverage_by_city(upcoming_events DESC);

COMMENT ON MATERIALIZED VIEW mv_event_coverage_by_city IS 'Event coverage by city - refresh weekly';

-- ============================================================================
-- FUNCTION TO REFRESH ALL MATERIALIZED VIEWS
-- Call this from a cron job
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_car_popularity;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_content_coverage;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_event_coverage_by_city;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_all_materialized_views() IS 'Refreshes all dashboard materialized views';
