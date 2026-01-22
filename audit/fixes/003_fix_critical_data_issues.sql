-- ============================================================================
-- AutoRev Database Critical Fixes - January 21, 2026
-- Based on DATA_QUALITY_DEEP_AUDIT_2026-01-21.md
-- ============================================================================

-- ============================================================================
-- FIX DQ-001: Investigate Lap Time Track Linkage Issue
-- ============================================================================

-- Step 1: Understand the orphaned track_ids
-- Check if there's a pattern or source info we can use
SELECT DISTINCT 
  lt.track_id,
  COUNT(*) as lap_count,
  MIN(lt.created_at) as first_created,
  lt.source_url as sample_source
FROM car_track_lap_times lt
WHERE NOT EXISTS (SELECT 1 FROM tracks t WHERE t.id = lt.track_id)
GROUP BY lt.track_id, lt.source_url
ORDER BY lap_count DESC
LIMIT 20;

-- Step 2: Check if there's any pattern in the track_ids themselves
-- (They might be from a different source or previous migration)
SELECT 
  lt.track_id::text as track_id_str,
  COUNT(*) as lap_count
FROM car_track_lap_times lt
GROUP BY lt.track_id
ORDER BY lap_count DESC
LIMIT 10;

-- Step 3: Check if lap_time_text contains track info we could use
SELECT DISTINCT 
  LEFT(lap_time_text, 50) as time_sample,
  COUNT(*) as count
FROM car_track_lap_times
WHERE lap_time_text IS NOT NULL
GROUP BY 1
ORDER BY count DESC
LIMIT 20;

-- Step 4: Check the notes field for track information
SELECT 
  notes,
  COUNT(*) as count
FROM car_track_lap_times
WHERE notes IS NOT NULL
GROUP BY notes
ORDER BY count DESC
LIMIT 20;

-- ============================================================================
-- FIX DQ-002: Populate upgrade_key_parts Table
-- ============================================================================

-- Step 1: View current upgrade_keys
SELECT key, name, category, description 
FROM upgrade_keys
ORDER BY category, key;

-- Step 2: Populate upgrade_key_parts based on category matching
-- This creates initial linkages between upgrade types and parts

-- Intake upgrades
INSERT INTO upgrade_key_parts (upgrade_key, part_id, relevance_score, created_at)
SELECT 
  'intake' as upgrade_key,
  p.id as part_id,
  CASE 
    WHEN p.confidence >= 0.85 THEN 0.9
    WHEN p.confidence >= 0.7 THEN 0.75
    ELSE 0.6
  END as relevance_score,
  NOW() as created_at
FROM parts p
WHERE p.category = 'intake' 
  AND p.is_active = true
ON CONFLICT (upgrade_key, part_id) DO NOTHING;

-- Exhaust upgrades
INSERT INTO upgrade_key_parts (upgrade_key, part_id, relevance_score, created_at)
SELECT 
  'exhaust' as upgrade_key,
  p.id as part_id,
  CASE 
    WHEN p.confidence >= 0.85 THEN 0.9
    WHEN p.confidence >= 0.7 THEN 0.75
    ELSE 0.6
  END as relevance_score,
  NOW() as created_at
FROM parts p
WHERE p.category = 'exhaust' 
  AND p.is_active = true
ON CONFLICT (upgrade_key, part_id) DO NOTHING;

-- Tune upgrades
INSERT INTO upgrade_key_parts (upgrade_key, part_id, relevance_score, created_at)
SELECT 
  'tune' as upgrade_key,
  p.id as part_id,
  CASE 
    WHEN p.confidence >= 0.85 THEN 0.9
    WHEN p.confidence >= 0.7 THEN 0.75
    ELSE 0.6
  END as relevance_score,
  NOW() as created_at
FROM parts p
WHERE p.category = 'tune' 
  AND p.is_active = true
ON CONFLICT (upgrade_key, part_id) DO NOTHING;

-- Suspension upgrades
INSERT INTO upgrade_key_parts (upgrade_key, part_id, relevance_score, created_at)
SELECT 
  'suspension' as upgrade_key,
  p.id as part_id,
  CASE 
    WHEN p.confidence >= 0.85 THEN 0.9
    WHEN p.confidence >= 0.7 THEN 0.75
    ELSE 0.6
  END as relevance_score,
  NOW() as created_at
FROM parts p
WHERE p.category = 'suspension' 
  AND p.is_active = true
ON CONFLICT (upgrade_key, part_id) DO NOTHING;

-- Brakes upgrades  
INSERT INTO upgrade_key_parts (upgrade_key, part_id, relevance_score, created_at)
SELECT 
  'brakes' as upgrade_key,
  p.id as part_id,
  CASE 
    WHEN p.confidence >= 0.85 THEN 0.9
    WHEN p.confidence >= 0.7 THEN 0.75
    ELSE 0.6
  END as relevance_score,
  NOW() as created_at
FROM parts p
WHERE p.category = 'brakes' 
  AND p.is_active = true
ON CONFLICT (upgrade_key, part_id) DO NOTHING;

-- Cooling upgrades
INSERT INTO upgrade_key_parts (upgrade_key, part_id, relevance_score, created_at)
SELECT 
  'cooling' as upgrade_key,
  p.id as part_id,
  CASE 
    WHEN p.confidence >= 0.85 THEN 0.9
    WHEN p.confidence >= 0.7 THEN 0.75
    ELSE 0.6
  END as relevance_score,
  NOW() as created_at
FROM parts p
WHERE p.category = 'cooling' 
  AND p.is_active = true
ON CONFLICT (upgrade_key, part_id) DO NOTHING;

-- Forced Induction upgrades
INSERT INTO upgrade_key_parts (upgrade_key, part_id, relevance_score, created_at)
SELECT 
  'forced_induction' as upgrade_key,
  p.id as part_id,
  CASE 
    WHEN p.confidence >= 0.85 THEN 0.9
    WHEN p.confidence >= 0.7 THEN 0.75
    ELSE 0.6
  END as relevance_score,
  NOW() as created_at
FROM parts p
WHERE p.category = 'forced_induction' 
  AND p.is_active = true
ON CONFLICT (upgrade_key, part_id) DO NOTHING;

-- Fuel System upgrades
INSERT INTO upgrade_key_parts (upgrade_key, part_id, relevance_score, created_at)
SELECT 
  'fuel_system' as upgrade_key,
  p.id as part_id,
  CASE 
    WHEN p.confidence >= 0.85 THEN 0.9
    WHEN p.confidence >= 0.7 THEN 0.75
    ELSE 0.6
  END as relevance_score,
  NOW() as created_at
FROM parts p
WHERE p.category = 'fuel_system' 
  AND p.is_active = true
ON CONFLICT (upgrade_key, part_id) DO NOTHING;

-- Wheels/Tires upgrades
INSERT INTO upgrade_key_parts (upgrade_key, part_id, relevance_score, created_at)
SELECT 
  'wheels' as upgrade_key,
  p.id as part_id,
  CASE 
    WHEN p.confidence >= 0.85 THEN 0.9
    WHEN p.confidence >= 0.7 THEN 0.75
    ELSE 0.6
  END as relevance_score,
  NOW() as created_at
FROM parts p
WHERE p.category = 'wheels_tires' 
  AND p.is_active = true
ON CONFLICT (upgrade_key, part_id) DO NOTHING;

-- Verify the results
SELECT 
  upgrade_key,
  COUNT(*) as parts_linked
FROM upgrade_key_parts
GROUP BY upgrade_key
ORDER BY parts_linked DESC;

-- ============================================================================
-- FIX DQ-005: Fix Community Insights Missing car_id
-- ============================================================================

-- Step 1: Review the 68 insights missing car_id
SELECT 
  id,
  title,
  insight_type,
  source_forum,
  summary
FROM community_insights
WHERE car_id IS NULL
ORDER BY source_forum, insight_type;

-- Step 2: Attempt to match by forum to known cars
-- Example: ft86club insights should map to BRZ/86

-- Map ft86club insights to Subaru BRZ if title suggests BRZ/86/FR-S
UPDATE community_insights ci
SET car_id = (SELECT id FROM cars WHERE slug = 'subaru-brz-zc6')
WHERE ci.car_id IS NULL
  AND ci.source_forum = 'ft86club'
  AND (ci.title ILIKE '%BRZ%' OR ci.title ILIKE '%86%' OR ci.title ILIKE '%FR-S%');

-- Map remaining ft86club to Subaru BRZ as default (most common platform)
UPDATE community_insights ci
SET car_id = (SELECT id FROM cars WHERE slug = 'subaru-brz-zc6')
WHERE ci.car_id IS NULL
  AND ci.source_forum = 'ft86club';

-- Check remaining unlinked
SELECT 
  source_forum,
  COUNT(*) as remaining_unlinked
FROM community_insights
WHERE car_id IS NULL
GROUP BY source_forum;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify upgrade_key_parts populated
SELECT 
  'upgrade_key_parts' as table_name,
  COUNT(*) as row_count
FROM upgrade_key_parts;

-- Verify community insights car_id filled
SELECT 
  'community_insights' as table_name,
  COUNT(*) as total,
  COUNT(car_id) as has_car_id,
  COUNT(*) - COUNT(car_id) as missing_car_id
FROM community_insights;

-- Summary of critical fixes
SELECT 
  'DQ-001: Lap Times Track Linkage' as issue,
  '260 orphaned track_ids - needs manual resolution' as status
UNION ALL
SELECT 
  'DQ-002: upgrade_key_parts',
  CONCAT((SELECT COUNT(*) FROM upgrade_key_parts), ' rows populated')
UNION ALL
SELECT 
  'DQ-005: Community Insights car_id',
  CONCAT((SELECT COUNT(*) FROM community_insights WHERE car_id IS NULL), ' remaining NULL');
