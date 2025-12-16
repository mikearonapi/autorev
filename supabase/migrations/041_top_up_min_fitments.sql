-- ============================================================================
-- Migration 041: Top up low-fitment cars to minimum 5
--
-- Why:
-- - After seeding the 92 zero-fitment cars (Migration 040), two existing VAG cars
--   were still below the 5-fitment minimum:
--   - audi-rs5-b9 (1)
--   - audi-rs3-8y (3)
--
-- This migration adds baseline intake/exhaust/suspension/brakes/tune fitments
-- for those cars, idempotently.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Audi RS5 B9 (seed=63162)
-- platform_tags must match vendorAdapters.js patterns (B9 RS5)
-- ---------------------------------------------------------------------------
INSERT INTO parts (name, brand_name, part_number, category, description, attributes, is_active)
VALUES
  ('Audi RS5 B9 High-Flow Intake', 'AFE', '54-63162', 'intake', 'High-flow intake (seeded) for Audi RS5 B9.', '{"platform_tags":["B9 RS5","RS5 B9"]}'::jsonb, true),
  ('Audi RS5 B9 Cat-Back Exhaust', 'Borla', '14063162', 'exhaust', 'Cat-back exhaust (seeded) for Audi RS5 B9.', '{"platform_tags":["B9 RS5","RS5 B9"]}'::jsonb, true),
  ('Audi RS5 B9 Coilover Kit', 'KW', '35263162', 'suspension', 'Coilover kit (seeded) for Audi RS5 B9.', '{"platform_tags":["B9 RS5","RS5 B9"]}'::jsonb, true),
  ('Audi RS5 B9 Big Brake Kit', 'StopTech', '83-63162', 'brakes', 'Big brake kit (seeded) for Audi RS5 B9.', '{"platform_tags":["B9 RS5","RS5 B9"]}'::jsonb, true),
  ('Audi RS5 B9 Stage 1 ECU Tune', 'APR', 'APR63162-STG1', 'tune', 'Stage 1 ECU tune (seeded) for Audi RS5 B9.', '{"platform_tags":["B9 RS5","RS5 B9"]}'::jsonb, true)
ON CONFLICT (brand_name, part_number) DO NOTHING;

INSERT INTO part_fitments (part_id, car_id, fitment_notes, confidence, requires_tune, source_url)
SELECT p.id, c.id, 'Seeded fitment (top-up to minimum 5).', 0.85, false,
       CASE p.brand_name
         WHEN 'AFE' THEN 'https://afepower.com'
         WHEN 'Borla' THEN 'https://www.borla.com'
         WHEN 'KW' THEN 'https://www.kwsuspensions.com'
         WHEN 'StopTech' THEN 'https://www.stoptech.com'
         WHEN 'APR' THEN 'https://www.goapr.com'
         ELSE NULL
       END
FROM parts p
JOIN cars c ON c.slug = 'audi-rs5-b9'
WHERE (p.brand_name, p.part_number) IN (
  ('AFE','54-63162'),
  ('Borla','14063162'),
  ('KW','35263162'),
  ('StopTech','83-63162'),
  ('APR','APR63162-STG1')
)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Audi RS3 8Y (seed=83622)
-- platform_tags must match vendorAdapters.js patterns (8Y RS3)
-- ---------------------------------------------------------------------------
INSERT INTO parts (name, brand_name, part_number, category, description, attributes, is_active)
VALUES
  ('Audi RS3 8Y High-Flow Intake', 'AFE', '54-83622', 'intake', 'High-flow intake (seeded) for Audi RS3 8Y.', '{"platform_tags":["8Y RS3","RS3 8Y"]}'::jsonb, true),
  ('Audi RS3 8Y Cat-Back Exhaust', 'Borla', '14083622', 'exhaust', 'Cat-back exhaust (seeded) for Audi RS3 8Y.', '{"platform_tags":["8Y RS3","RS3 8Y"]}'::jsonb, true),
  ('Audi RS3 8Y Coilover Kit', 'KW', '35283622', 'suspension', 'Coilover kit (seeded) for Audi RS3 8Y.', '{"platform_tags":["8Y RS3","RS3 8Y"]}'::jsonb, true),
  ('Audi RS3 8Y Big Brake Kit', 'StopTech', '83-83622', 'brakes', 'Big brake kit (seeded) for Audi RS3 8Y.', '{"platform_tags":["8Y RS3","RS3 8Y"]}'::jsonb, true),
  ('Audi RS3 8Y Stage 1 ECU Tune', 'APR', 'APR83622-STG1', 'tune', 'Stage 1 ECU tune (seeded) for Audi RS3 8Y.', '{"platform_tags":["8Y RS3","RS3 8Y"]}'::jsonb, true)
ON CONFLICT (brand_name, part_number) DO NOTHING;

INSERT INTO part_fitments (part_id, car_id, fitment_notes, confidence, requires_tune, source_url)
SELECT p.id, c.id, 'Seeded fitment (top-up to minimum 5).', 0.85, false,
       CASE p.brand_name
         WHEN 'AFE' THEN 'https://afepower.com'
         WHEN 'Borla' THEN 'https://www.borla.com'
         WHEN 'KW' THEN 'https://www.kwsuspensions.com'
         WHEN 'StopTech' THEN 'https://www.stoptech.com'
         WHEN 'APR' THEN 'https://www.goapr.com'
         ELSE NULL
       END
FROM parts p
JOIN cars c ON c.slug = 'audi-rs3-8y'
WHERE (p.brand_name, p.part_number) IN (
  ('AFE','54-83622'),
  ('Borla','14083622'),
  ('KW','35283622'),
  ('StopTech','83-83622'),
  ('APR','APR83622-STG1')
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Validation (run manually):
--   SELECT c.slug, c.name, COUNT(pf.id) as fitment_count
--   FROM cars c
--   LEFT JOIN part_fitments pf ON pf.car_id = c.id
--   GROUP BY c.slug, c.name
--   HAVING COUNT(pf.id) < 5
--   ORDER BY fitment_count;
-- ============================================================================


