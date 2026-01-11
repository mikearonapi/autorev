-- Migration: P1 Add car_id Auto-Resolution Triggers
-- Date: January 13, 2026
-- Purpose: Add triggers to auto-populate car_id from car_slug on tables that have both columns

-- ============================================================================
-- Tables that already have triggers: car_recalls, community_insights, 
-- user_favorites, user_projects, user_vehicles, youtube_video_car_links
-- ============================================================================

-- Car Data Tables
DROP TRIGGER IF EXISTS auto_car_id ON car_auction_results;
CREATE TRIGGER auto_car_id BEFORE INSERT OR UPDATE ON car_auction_results
FOR EACH ROW EXECUTE FUNCTION resolve_car_id_from_slug();

DROP TRIGGER IF EXISTS auto_car_id ON car_dyno_runs;
CREATE TRIGGER auto_car_id BEFORE INSERT OR UPDATE ON car_dyno_runs
FOR EACH ROW EXECUTE FUNCTION resolve_car_id_from_slug();

DROP TRIGGER IF EXISTS auto_car_id ON car_expert_reviews;
CREATE TRIGGER auto_car_id BEFORE INSERT OR UPDATE ON car_expert_reviews
FOR EACH ROW EXECUTE FUNCTION resolve_car_id_from_slug();

DROP TRIGGER IF EXISTS auto_car_id ON car_fuel_economy;
CREATE TRIGGER auto_car_id BEFORE INSERT OR UPDATE ON car_fuel_economy
FOR EACH ROW EXECUTE FUNCTION resolve_car_id_from_slug();

DROP TRIGGER IF EXISTS auto_car_id ON car_issues;
CREATE TRIGGER auto_car_id BEFORE INSERT OR UPDATE ON car_issues
FOR EACH ROW EXECUTE FUNCTION resolve_car_id_from_slug();

DROP TRIGGER IF EXISTS auto_car_id ON car_manual_data;
CREATE TRIGGER auto_car_id BEFORE INSERT OR UPDATE ON car_manual_data
FOR EACH ROW EXECUTE FUNCTION resolve_car_id_from_slug();

DROP TRIGGER IF EXISTS auto_car_id ON car_market_pricing;
CREATE TRIGGER auto_car_id BEFORE INSERT OR UPDATE ON car_market_pricing
FOR EACH ROW EXECUTE FUNCTION resolve_car_id_from_slug();

DROP TRIGGER IF EXISTS auto_car_id ON car_price_history;
CREATE TRIGGER auto_car_id BEFORE INSERT OR UPDATE ON car_price_history
FOR EACH ROW EXECUTE FUNCTION resolve_car_id_from_slug();

DROP TRIGGER IF EXISTS auto_car_id ON car_safety_data;
CREATE TRIGGER auto_car_id BEFORE INSERT OR UPDATE ON car_safety_data
FOR EACH ROW EXECUTE FUNCTION resolve_car_id_from_slug();

DROP TRIGGER IF EXISTS auto_car_id ON car_track_lap_times;
CREATE TRIGGER auto_car_id BEFORE INSERT OR UPDATE ON car_track_lap_times
FOR EACH ROW EXECUTE FUNCTION resolve_car_id_from_slug();

-- Knowledge Base
DROP TRIGGER IF EXISTS auto_car_id ON document_chunks;
CREATE TRIGGER auto_car_id BEFORE INSERT OR UPDATE ON document_chunks
FOR EACH ROW EXECUTE FUNCTION resolve_car_id_from_slug();

-- System
DROP TRIGGER IF EXISTS auto_car_id ON scrape_jobs;
CREATE TRIGGER auto_car_id BEFORE INSERT OR UPDATE ON scrape_jobs
FOR EACH ROW EXECUTE FUNCTION resolve_car_id_from_slug();

-- Upgrades
DROP TRIGGER IF EXISTS auto_car_id ON upgrade_packages;
CREATE TRIGGER auto_car_id BEFORE INSERT OR UPDATE ON upgrade_packages
FOR EACH ROW EXECUTE FUNCTION resolve_car_id_from_slug();

-- Maintenance
DROP TRIGGER IF EXISTS auto_car_id ON wheel_tire_fitment_options;
CREATE TRIGGER auto_car_id BEFORE INSERT OR UPDATE ON wheel_tire_fitment_options
FOR EACH ROW EXECUTE FUNCTION resolve_car_id_from_slug();

-- ============================================================================
-- BACKFILL: Update existing records with NULL car_id
-- ============================================================================

-- Car data tables
UPDATE car_dyno_runs dr SET car_id = c.id FROM cars c WHERE c.slug = dr.car_slug AND dr.car_id IS NULL;
UPDATE car_fuel_economy fe SET car_id = c.id FROM cars c WHERE c.slug = fe.car_slug AND fe.car_id IS NULL;
UPDATE car_issues ci SET car_id = c.id FROM cars c WHERE c.slug = ci.car_slug AND ci.car_id IS NULL;
UPDATE car_market_pricing mp SET car_id = c.id FROM cars c WHERE c.slug = mp.car_slug AND mp.car_id IS NULL;
UPDATE car_safety_data sd SET car_id = c.id FROM cars c WHERE c.slug = sd.car_slug AND sd.car_id IS NULL;
UPDATE car_track_lap_times lt SET car_id = c.id FROM cars c WHERE c.slug = lt.car_slug AND lt.car_id IS NULL;
UPDATE car_price_history ph SET car_id = c.id FROM cars c WHERE c.slug = ph.car_slug AND ph.car_id IS NULL;

-- Knowledge base
UPDATE document_chunks dc SET car_id = c.id FROM cars c WHERE c.slug = dc.car_slug AND dc.car_id IS NULL;

-- Maintenance
UPDATE wheel_tire_fitment_options wt SET car_id = c.id FROM cars c WHERE c.slug = wt.car_slug AND wt.car_id IS NULL;
