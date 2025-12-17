-- ============================================================================
-- FIX 002: Fix Invalid car_slug in community_insights
-- ============================================================================
-- Issue: 121 records (10% of 1,226) have car_slugs that don't exist in cars table
-- Impact: These insights won't appear in car detail pages or AL queries
-- Risk: MEDIUM - Requires semantic mapping decisions
-- Status: ✅ EXECUTED December 15, 2024 - All 121 records fixed
-- ============================================================================

-- Count of issues by slug before fix
SELECT ci.car_slug, COUNT(*) as insight_count
FROM community_insights ci
LEFT JOIN cars c ON c.slug = ci.car_slug
WHERE ci.car_slug IS NOT NULL AND c.slug IS NULL
GROUP BY ci.car_slug
ORDER BY insight_count DESC;

-- ============================================================================
-- STEP 1: Add new slug aliases to car_slug_aliases table
-- These map forum-generated slugs to our canonical car slugs
-- ============================================================================

INSERT INTO car_slug_aliases (alias, canonical_slug)
VALUES
  -- Porsche 718 family (map to 718 Cayman GT4 as closest match)
  ('718-boxster', '718-cayman-gts-40'),
  ('porsche-cayman-gt4-rs', '718-cayman-gt4'),
  ('porsche-cayman-gt4rs', '718-cayman-gt4'),
  ('porsche-gt4', '718-cayman-gt4'),
  
  -- Porsche 997 GT3 variants (map to our porsche-911-gt3-997)
  ('porsche-997-gt3', 'porsche-911-gt3-997'),
  ('991-gt3', 'porsche-911-gt3-997'),
  ('porsche-991-gt3', 'porsche-911-gt3-997'),
  ('991-2-gt3', 'porsche-911-gt3-997'),
  
  -- Porsche 996 GT3 variants
  ('porsche-996-gt3', 'porsche-911-gt3-996'),
  ('porsche-911-gt3', 'porsche-911-gt3-996'),  -- Default to 996 for generic GT3
  
  -- Porsche 991 family (map to 991.1 Carrera S as closest match)
  ('porsche-991', '991-1-carrera-s'),
  
  -- Porsche 981 family (map to 981 Cayman S)
  ('porsche-981', '981-cayman-s')
ON CONFLICT (alias) DO NOTHING;

-- ============================================================================
-- STEP 2: Update community_insights using the new aliases
-- ============================================================================

-- Update insights to use canonical slugs via alias lookup
UPDATE community_insights ci
SET car_slug = csa.canonical_slug
FROM car_slug_aliases csa
WHERE ci.car_slug = csa.alias
  AND ci.car_slug NOT IN (SELECT slug FROM cars);

-- ============================================================================
-- STEP 3: Set car_slug to NULL for non-car-specific insights
-- These are generic insights that shouldn't be tied to a specific car
-- ============================================================================

UPDATE community_insights
SET car_slug = NULL
WHERE car_slug IN (
  'generic',      -- Generic garage/maintenance tips
  'bmw-suv',      -- Not a car we track
  'porsche-958',  -- Cayenne - SUV not tracked
  'porsche-boxster'  -- Already aliased, but some may remain
)
AND car_slug NOT IN (SELECT slug FROM cars);

-- ============================================================================
-- STEP 4: Handle remaining unmatched slugs
-- These are GT variants we don't have in our database yet
-- Option A: Set to NULL (orphan the insights)
-- Option B: Map to closest existing car
-- 
-- For now, using Option B - map to closest existing variant
-- ============================================================================

-- Map GT3 RS variants to regular GT3
UPDATE community_insights
SET car_slug = 'porsche-911-gt3-997'
WHERE car_slug IN (
  'porsche-911-gt3-rs',
  '991-2-gt3-rs',
  'porsche-997-gt3-rs'
)
AND car_slug NOT IN (SELECT slug FROM cars);

-- Map GT2 variants to 997 Turbo (closest match we have)
UPDATE community_insights
SET car_slug = 'porsche-911-turbo-997-2'
WHERE car_slug IN (
  'porsche-996-gt2',
  'porsche-997-gt2',
  'porsche-997-gt2-rs',
  'porsche-911-gt2-997',
  'porsche-911-gt2-rs'
)
AND car_slug NOT IN (SELECT slug FROM cars);

-- Map 911 R and Touring to 997 GT3 (closest naturally aspirated match)
UPDATE community_insights
SET car_slug = 'porsche-911-gt3-997'
WHERE car_slug IN (
  '911-r',
  '991-2-gt3-touring'
)
AND car_slug NOT IN (SELECT slug FROM cars);

-- ============================================================================
-- STEP 5: Also populate car_id for all insights that have valid car_slug
-- ============================================================================

UPDATE community_insights ci
SET car_id = c.id
FROM cars c
WHERE ci.car_slug = c.slug
  AND (ci.car_id IS NULL OR ci.car_id != c.id);

-- ============================================================================
-- VERIFY FIX
-- ============================================================================

-- Should return 0 rows (all insights now have valid slugs or NULL)
SELECT ci.car_slug, COUNT(*) as orphan_count
FROM community_insights ci
LEFT JOIN cars c ON c.slug = ci.car_slug
WHERE ci.car_slug IS NOT NULL AND c.slug IS NULL
GROUP BY ci.car_slug
ORDER BY orphan_count DESC;

-- Summary of changes
SELECT 
  CASE 
    WHEN car_slug IS NULL THEN '(NULL - generic)'
    ELSE car_slug 
  END as car_slug,
  COUNT(*) as insight_count
FROM community_insights
GROUP BY car_slug
ORDER BY insight_count DESC;

-- ============================================================================
-- FUTURE: Consider adding these Porsche GT variants to cars table
-- ============================================================================
-- porsche-911-gt3-rs-997
-- porsche-911-gt3-rs-991
-- porsche-911-gt2-997
-- porsche-911-gt2-rs-997
-- porsche-911-gt2-rs-991
-- porsche-911r
-- porsche-911-gt3-touring-991

