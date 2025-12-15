-- Migration: Populate install_difficulty for all part_fitments based on part category
-- Date: 2024-12-14
-- Author: AutoRev
-- 
-- Populates 836 fitments across 10 categories
-- Valid values per constraint: easy, moderate, hard, pro_only
--
-- Category mapping:
--   tune           -> easy       (software flash, no physical install)
--   wheels_tires   -> easy       (jack, lug wrench)
--   intake         -> moderate   (remove airbox, install new intake)
--   exhaust        -> moderate   (may need lift, basic tools)
--   brakes         -> moderate   (pads easy, rotors moderate)
--   cooling        -> moderate   (radiator swap, hose routing)
--   fuel_system    -> hard       (working with fuel lines)
--   suspension     -> hard       (requires spring compressors, alignment)
--   forced_induction -> pro_only (turbo/supercharger installation complex)
--   other          -> moderate   (default assumption)

UPDATE part_fitments pf
SET 
  install_difficulty = CASE 
    WHEN p.category = 'tune' THEN 'easy'
    WHEN p.category = 'wheels_tires' THEN 'easy'
    WHEN p.category = 'intake' THEN 'moderate'
    WHEN p.category = 'exhaust' THEN 'moderate'
    WHEN p.category = 'brakes' THEN 'moderate'
    WHEN p.category = 'cooling' THEN 'moderate'
    WHEN p.category = 'fuel_system' THEN 'hard'
    WHEN p.category = 'suspension' THEN 'hard'
    WHEN p.category = 'forced_induction' THEN 'pro_only'
    ELSE 'moderate'
  END,
  updated_at = NOW()
FROM parts p
WHERE p.id = pf.part_id
  AND pf.install_difficulty IS NULL;

-- Verification query (run manually to confirm):
-- SELECT install_difficulty, COUNT(*) FROM part_fitments GROUP BY install_difficulty;
