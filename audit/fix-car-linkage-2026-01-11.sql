-- =============================================================================
-- AutoRev Database Integrity Fix Script
-- Generated: 2026-01-11
-- 
-- IMPORTANT: Run PREVIEW queries first before executing FIX queries!
-- Run each section in order. User data tables first.
-- =============================================================================

-- =============================================================================
-- PHASE 1: USER DATA FIXES (CRITICAL - Affects Active Users)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1A. user_vehicles: Populate matched_car_id from matched_car_slug
-- Expected: 25 records to fix
-- -----------------------------------------------------------------------------

-- PREVIEW
SELECT 
    uv.id, 
    uv.nickname,
    uv.make,
    uv.model,
    uv.matched_car_slug, 
    c.id as should_be_car_id, 
    c.name as car_name
FROM user_vehicles uv
JOIN cars c ON c.slug = uv.matched_car_slug
WHERE uv.matched_car_id IS NULL;

-- FIX (Uncomment to run)
-- UPDATE user_vehicles uv
-- SET matched_car_id = c.id
-- FROM cars c
-- WHERE c.slug = uv.matched_car_slug
-- AND uv.matched_car_id IS NULL;

-- VERIFY
-- SELECT COUNT(*) as fixed FROM user_vehicles WHERE matched_car_id IS NOT NULL;


-- -----------------------------------------------------------------------------
-- 1B. user_favorites: Populate car_id from car_slug
-- Expected: 18 records to fix
-- -----------------------------------------------------------------------------

-- PREVIEW
SELECT 
    uf.id, 
    uf.car_slug, 
    uf.car_name,
    c.id as should_be_car_id
FROM user_favorites uf
JOIN cars c ON c.slug = uf.car_slug
WHERE uf.car_id IS NULL;

-- FIX (Uncomment to run)
-- UPDATE user_favorites uf
-- SET car_id = c.id
-- FROM cars c
-- WHERE c.slug = uf.car_slug
-- AND uf.car_id IS NULL;

-- VERIFY
-- SELECT COUNT(*) as fixed FROM user_favorites WHERE car_id IS NOT NULL;


-- -----------------------------------------------------------------------------
-- 1C. user_projects: Populate car_id from car_slug
-- Expected: 9 records to fix
-- -----------------------------------------------------------------------------

-- PREVIEW
SELECT 
    up.id, 
    up.project_name,
    up.car_slug, 
    c.id as should_be_car_id,
    c.name as car_name
FROM user_projects up
JOIN cars c ON c.slug = up.car_slug
WHERE up.car_id IS NULL;

-- FIX (Uncomment to run)
-- UPDATE user_projects up
-- SET car_id = c.id
-- FROM cars c
-- WHERE c.slug = up.car_slug
-- AND up.car_id IS NULL;

-- VERIFY
-- SELECT COUNT(*) as fixed FROM user_projects WHERE car_id IS NOT NULL;


-- =============================================================================
-- PHASE 2: CONTENT DATA FIXES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2A. car_recalls: Populate car_id from car_slug
-- Expected: 507 records to fix
-- -----------------------------------------------------------------------------

-- PREVIEW (just count by car_slug)
SELECT 
    cr.car_slug, 
    COUNT(*) as recall_count,
    c.id as should_be_car_id,
    c.name as car_name
FROM car_recalls cr
JOIN cars c ON c.slug = cr.car_slug
WHERE cr.car_id IS NULL
GROUP BY cr.car_slug, c.id, c.name
ORDER BY recall_count DESC
LIMIT 20;

-- FIX (Uncomment to run)
-- UPDATE car_recalls cr
-- SET car_id = c.id
-- FROM cars c
-- WHERE c.slug = cr.car_slug
-- AND cr.car_id IS NULL;

-- VERIFY
-- SELECT COUNT(*) as still_null FROM car_recalls WHERE car_id IS NULL;


-- -----------------------------------------------------------------------------
-- 2B. youtube_video_car_links: Populate car_id from car_slug
-- Expected: 644 records to fix
-- -----------------------------------------------------------------------------

-- PREVIEW (sample)
SELECT 
    yvl.car_slug, 
    COUNT(*) as link_count,
    c.id as should_be_car_id
FROM youtube_video_car_links yvl
JOIN cars c ON c.slug = yvl.car_slug
WHERE yvl.car_id IS NULL
GROUP BY yvl.car_slug, c.id
ORDER BY link_count DESC
LIMIT 20;

-- FIX (Uncomment to run)
-- UPDATE youtube_video_car_links yvl
-- SET car_id = c.id
-- FROM cars c
-- WHERE c.slug = yvl.car_slug
-- AND yvl.car_id IS NULL;

-- VERIFY
-- SELECT COUNT(*) as still_null FROM youtube_video_car_links WHERE car_id IS NULL;


-- =============================================================================
-- PHASE 3: DATA QUALITY FIXES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 3A. Remove duplicate tuning profiles
-- Expected: 5 duplicate records to remove
-- -----------------------------------------------------------------------------

-- PREVIEW duplicates
SELECT 
    ctp.id, 
    c.slug, 
    c.name, 
    ctp.created_at, 
    ctp.stock_whp,
    ROW_NUMBER() OVER (PARTITION BY ctp.car_id ORDER BY ctp.created_at DESC) as keep_rank
FROM car_tuning_profiles ctp
JOIN cars c ON c.id = ctp.car_id
WHERE ctp.car_id IN (
    SELECT car_id FROM car_tuning_profiles GROUP BY car_id HAVING COUNT(*) > 1
)
ORDER BY c.slug, ctp.created_at DESC;

-- FIX: Delete older duplicates (keep newest)
-- DELETE FROM car_tuning_profiles
-- WHERE id IN (
--     SELECT id FROM (
--         SELECT id, ROW_NUMBER() OVER (PARTITION BY car_id ORDER BY created_at DESC) as rn
--         FROM car_tuning_profiles
--         WHERE car_id IN (
--             SELECT car_id FROM car_tuning_profiles GROUP BY car_id HAVING COUNT(*) > 1
--         )
--     ) sub
--     WHERE rn > 1
-- );

-- VERIFY
-- SELECT car_id, COUNT(*) as cnt FROM car_tuning_profiles GROUP BY car_id HAVING COUNT(*) > 1;


-- =============================================================================
-- PHASE 4: FUTURE-PROOFING (Optional Triggers)
-- =============================================================================

-- Create trigger to auto-populate car_id from car_slug on INSERT
-- This prevents future records from having NULL car_id

-- CREATE OR REPLACE FUNCTION auto_populate_car_id()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     IF NEW.car_id IS NULL AND NEW.car_slug IS NOT NULL THEN
--         SELECT id INTO NEW.car_id FROM cars WHERE slug = NEW.car_slug;
--     END IF;
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- Apply to tables that have both car_slug and car_id:
-- CREATE TRIGGER auto_car_id_user_favorites
--     BEFORE INSERT ON user_favorites
--     FOR EACH ROW EXECUTE FUNCTION auto_populate_car_id();

-- CREATE TRIGGER auto_car_id_user_projects
--     BEFORE INSERT ON user_projects
--     FOR EACH ROW EXECUTE FUNCTION auto_populate_car_id();

-- CREATE TRIGGER auto_car_id_car_recalls
--     BEFORE INSERT ON car_recalls
--     FOR EACH ROW EXECUTE FUNCTION auto_populate_car_id();

-- CREATE TRIGGER auto_car_id_youtube_video_car_links
--     BEFORE INSERT ON youtube_video_car_links
--     FOR EACH ROW EXECUTE FUNCTION auto_populate_car_id();


-- =============================================================================
-- POST-FIX VERIFICATION QUERIES
-- =============================================================================

-- Run these after applying all fixes to verify success:

-- SELECT 'user_vehicles' as table_name, COUNT(*) as total, COUNT(matched_car_id) as linked FROM user_vehicles
-- UNION ALL SELECT 'user_favorites', COUNT(*), COUNT(car_id) FROM user_favorites
-- UNION ALL SELECT 'user_projects', COUNT(*), COUNT(car_id) FROM user_projects
-- UNION ALL SELECT 'car_recalls', COUNT(*), COUNT(car_id) FROM car_recalls
-- UNION ALL SELECT 'youtube_video_car_links', COUNT(*), COUNT(car_id) FROM youtube_video_car_links;
