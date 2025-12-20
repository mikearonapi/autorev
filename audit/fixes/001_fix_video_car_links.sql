-- ============================================================================
-- FIX 001: Populate NULL car_id in youtube_video_car_links
-- ============================================================================
-- Issue: 2 records have car_slug but NULL car_id
-- Impact: Videos don't appear in car detail Expert Reviews tab
-- Risk: LOW - Simple update with clear source mapping
-- Status: ✅ EXECUTED December 15, 2024 - Both records fixed
-- ============================================================================

-- Verify the issue before fix
SELECT 
  yvcl.id,
  yvcl.video_id,
  yvcl.car_slug,
  yvcl.car_id AS current_car_id,
  c.id AS correct_car_id,
  c.name AS car_name
FROM youtube_video_car_links yvcl
JOIN cars c ON c.slug = yvcl.car_slug
WHERE yvcl.car_id IS NULL;

-- Expected output:
-- id: 42e2252c-0edb-4117-b2dd-010c2d7dd58a, video_id: P-pstZGg9Y8, car_slug: 718-cayman-gts-40
-- id: 45a74d1b-8c5c-4dd2-8b17-6bfd12e4ba42, video_id: EEkE6Qwj9cQ, car_slug: 718-cayman-gts-40

-- ============================================================================
-- APPLY FIX
-- ============================================================================

UPDATE youtube_video_car_links yvcl
SET car_id = c.id
FROM cars c
WHERE yvcl.car_slug = c.slug
  AND yvcl.car_id IS NULL;

-- ============================================================================
-- VERIFY FIX
-- ============================================================================

-- Should return 0 rows
SELECT id, video_id, car_slug, car_id
FROM youtube_video_car_links
WHERE car_id IS NULL AND car_slug IS NOT NULL;

-- Confirm the 2 records are now fixed
SELECT 
  yvcl.id,
  yvcl.video_id,
  yvcl.car_slug,
  yvcl.car_id,
  c.name AS car_name
FROM youtube_video_car_links yvcl
JOIN cars c ON c.id = yvcl.car_id
WHERE yvcl.video_id IN ('P-pstZGg9Y8', 'EEkE6Qwj9cQ');










