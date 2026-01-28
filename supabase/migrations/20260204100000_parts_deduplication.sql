-- Migration: Parts Deduplication
-- Purpose: Add unique constraint to prevent duplicate parts and clean up existing duplicates
-- Applied: January 27, 2026
-- 
-- Problem: Parts were being inserted multiple times when clicking "AL's top picks"
-- because the only unique constraint was on (brand_name, part_number), but part_number
-- is often NULL for AI-researched parts.
--
-- Solution:
-- 1. Clean up 6 pairs of duplicate parts by keeping the oldest record
-- 2. Add UNIQUE constraint on (manufacturer_name, name, category)
-- 3. part_fitments constraint already existed from earlier migration

-- ============================================================================
-- STEP 1: Clean up duplicate parts
-- ============================================================================
-- For each set of duplicates, keep the OLDEST one (first created) and update
-- any references to point to the kept record before deleting duplicates.

-- Create temp table to hold the mapping of duplicate -> canonical IDs
CREATE TEMP TABLE part_dedup_map AS
WITH duplicates AS (
  SELECT 
    manufacturer_name,
    name,
    category,
    ARRAY_AGG(id ORDER BY created_at) as ids,
    (ARRAY_AGG(id ORDER BY created_at))[1] as canonical_id
  FROM parts 
  WHERE manufacturer_name IS NOT NULL
  GROUP BY manufacturer_name, name, category
  HAVING COUNT(*) > 1
)
SELECT 
  unnest(ids[2:]) as duplicate_id,
  canonical_id
FROM duplicates;

-- Update al_part_recommendations to point to canonical parts
UPDATE al_part_recommendations r
SET part_id = m.canonical_id
FROM part_dedup_map m
WHERE r.part_id = m.duplicate_id
  AND NOT EXISTS (
    -- Don't update if it would create a duplicate recommendation
    SELECT 1 FROM al_part_recommendations existing
    WHERE existing.car_id = r.car_id
      AND existing.upgrade_key = r.upgrade_key
      AND existing.part_id = m.canonical_id
  );

-- Delete recommendations that would be duplicates after remapping
DELETE FROM al_part_recommendations r
USING part_dedup_map m
WHERE r.part_id = m.duplicate_id;

-- Update part_fitments to point to canonical parts
UPDATE part_fitments f
SET part_id = m.canonical_id
FROM part_dedup_map m
WHERE f.part_id = m.duplicate_id
  AND NOT EXISTS (
    -- Don't update if it would create a duplicate fitment
    SELECT 1 FROM part_fitments existing
    WHERE existing.car_id = f.car_id
      AND existing.part_id = m.canonical_id
  );

-- Delete fitments that would be duplicates after remapping
DELETE FROM part_fitments f
USING part_dedup_map m
WHERE f.part_id = m.duplicate_id;

-- Update part_pricing_snapshots to point to canonical parts
UPDATE part_pricing_snapshots p
SET part_id = m.canonical_id
FROM part_dedup_map m
WHERE p.part_id = m.duplicate_id
  AND NOT EXISTS (
    -- Don't update if it would violate the unique constraint
    SELECT 1 FROM part_pricing_snapshots existing
    WHERE existing.part_id = m.canonical_id
      AND existing.vendor_name = p.vendor_name
      AND existing.recorded_at = p.recorded_at
  );

-- Delete pricing that would be duplicates after remapping
DELETE FROM part_pricing_snapshots p
USING part_dedup_map m
WHERE p.part_id = m.duplicate_id;

-- Update user_project_parts to point to canonical parts
UPDATE user_project_parts u
SET part_id = m.canonical_id
FROM part_dedup_map m
WHERE u.part_id = m.duplicate_id;

-- Update upgrade_key_parts to point to canonical parts
UPDATE upgrade_key_parts u
SET part_id = m.canonical_id
FROM part_dedup_map m
WHERE u.part_id = m.duplicate_id
  AND NOT EXISTS (
    SELECT 1 FROM upgrade_key_parts existing
    WHERE existing.upgrade_key = u.upgrade_key
      AND existing.part_id = m.canonical_id
  );

-- Delete upgrade_key_parts that would be duplicates
DELETE FROM upgrade_key_parts u
USING part_dedup_map m
WHERE u.part_id = m.duplicate_id;

-- Now delete the duplicate parts (CASCADE should handle remaining FKs)
DELETE FROM parts p
USING part_dedup_map m
WHERE p.id = m.duplicate_id;

-- Clean up temp table
DROP TABLE part_dedup_map;

-- ============================================================================
-- STEP 2: Add unique constraint for manufacturer_name + name + category
-- ============================================================================
-- This prevents duplicate parts from being inserted in the future.
-- Note: This allows same name for different categories (e.g., "Performance Kit"
-- could exist for both exhaust and intake categories).
-- NULLS NOT DISTINCT ensures NULL manufacturers are also checked for uniqueness.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ux_parts_manufacturer_name_category'
  ) THEN
    ALTER TABLE parts 
      ADD CONSTRAINT ux_parts_manufacturer_name_category 
      UNIQUE NULLS NOT DISTINCT (manufacturer_name, name, category);
  END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON CONSTRAINT ux_parts_manufacturer_name_category ON parts IS 
  'Prevents duplicate parts: same manufacturer + name + category = same part';
