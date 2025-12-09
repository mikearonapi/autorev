-- ============================================================================
-- Migration: Calibrated Score Updates
-- Date: 2024-12-09
-- Purpose: Update advisory scores based on absolute calibration audit
--          10 = Best in the WORLD, not just our database
-- ============================================================================

-- ============================================================================
-- SOUND SCORE UPDATES
-- Reference: LFA, Ferrari 458, Carrera GT would be 10
-- ============================================================================

-- Lamborghini Gallardo: 10 → 9.6 (Excellent V10 but LFA exists)
UPDATE cars SET score_sound = 9.6 WHERE slug = 'lamborghini-gallardo';

-- Dodge Viper: 10 → 9.5 (Raw V10 but not as refined as LFA)
UPDATE cars SET score_sound = 9.5 WHERE slug = 'dodge-viper';

-- Shelby GT350: 10 → 9.7 (Voodoo is legendary, one of best V8s ever)
UPDATE cars SET score_sound = 9.7 WHERE slug = 'shelby-gt350';

-- Porsche 911 GT3 997: 10 → 9.7 (Mezger flat-6 is near-legendary)
UPDATE cars SET score_sound = 9.7 WHERE slug = 'porsche-911-gt3-997';

-- Porsche 911 GT3 996: 9.8 → 9.6 (Mezger, slightly rawer than 997)
UPDATE cars SET score_sound = 9.6 WHERE slug = 'porsche-911-gt3-996';

-- BMW M5 E60: 9.8 → 9.5 (S85 V10 excellent but not LFA-tier)
UPDATE cars SET score_sound = 9.5 WHERE slug = 'bmw-m5-e60';

-- BMW M3 E46: 8.5 → 9.3 (S54 inline-6 is legendary, screams to 8000 RPM)
UPDATE cars SET score_sound = 9.3 WHERE slug = 'bmw-m3-e46';


-- ============================================================================
-- INTERIOR SCORE UPDATES
-- Reference: Bentley, Rolls Royce would be 10
-- ============================================================================

-- C8 Corvette Stingray: 7.8 → 6.5 (Cheap plastics, awkward buttons)
UPDATE cars SET score_interior = 6.5 WHERE slug = 'c8-corvette-stingray';

-- C7 Corvette Grand Sport: 6.7 → 5.5 (Dated C7 design, cheap materials)
UPDATE cars SET score_interior = 5.5 WHERE slug = 'c7-corvette-grand-sport';

-- C7 Corvette Z06: 6.7 → 5.5 (Same dated C7 interior)
UPDATE cars SET score_interior = 5.5 WHERE slug = 'c7-corvette-z06';

-- Chevrolet Corvette C6 Z06: 6.6 → 5.0 (Dated C6 interior, cheap switchgear)
UPDATE cars SET score_interior = 5.0 WHERE slug = 'chevrolet-corvette-c6-z06';

-- Chevrolet Corvette C6 Grand Sport: 6.6 → 5.0 (Dated C6 interior)
UPDATE cars SET score_interior = 5.0 WHERE slug = 'chevrolet-corvette-c6-grand-sport';

-- Camaro SS 1LE: 5.2 → 4.5 (Poor visibility, cramped, cheap materials)
UPDATE cars SET score_interior = 4.5 WHERE slug = 'camaro-ss-1le';

-- Lexus LC 500: 10 → 9.2 (Exceptional but not Bentley-level)
UPDATE cars SET score_interior = 9.2 WHERE slug = 'lexus-lc-500';


-- ============================================================================
-- TRACK SCORE UPDATES
-- Reference: GT3 RS, GT2 RS, 992 GT3 would be 10
-- ============================================================================

-- Porsche 911 GT3 997: 10 → 9.5 (Excellent but GT3 RS exists)
UPDATE cars SET score_track = 9.5 WHERE slug = 'porsche-911-gt3-997';

-- Porsche 911 GT3 996: 9.9 → 9.1 (Excellent for era but older platform)
UPDATE cars SET score_track = 9.1 WHERE slug = 'porsche-911-gt3-996';

-- 718 Cayman GT4: 9.8 → 9.3 (Excellent mid-engine but GT3 RS exists)
UPDATE cars SET score_track = 9.3 WHERE slug = '718-cayman-gt4';

-- C7 Corvette Z06: 9.7 → 9.4 (Track-focused but not GT3 RS level)
UPDATE cars SET score_track = 9.4 WHERE slug = 'c7-corvette-z06';

-- Chevrolet Corvette C6 Z06: 9.6 → 9.2 (Excellent LS7 track car)
UPDATE cars SET score_track = 9.2 WHERE slug = 'chevrolet-corvette-c6-z06';

-- Camaro ZL1: 9.2 → 9.0 (Excellent but heavy)
UPDATE cars SET score_track = 9.0 WHERE slug = 'camaro-zl1';

-- Camaro SS 1LE: 9.2 → 9.0 (Excellent 1LE package)
UPDATE cars SET score_track = 9.0 WHERE slug = 'camaro-ss-1le';


-- ============================================================================
-- DRIVER FUN SCORE UPDATES
-- Reference: Ariel Atom, Caterham, BAC Mono would be 10
-- ============================================================================

-- Porsche 911 GT3 997: 10 → 9.6 (Incredible but Atom/Caterham more raw)
UPDATE cars SET score_driver_fun = 9.6 WHERE slug = 'porsche-911-gt3-997';

-- 718 Cayman GT4: 9.9 → 9.5 (Incredible but Lotus is more raw)
UPDATE cars SET score_driver_fun = 9.5 WHERE slug = '718-cayman-gt4';

-- Porsche 911 GT3 996: 9.9 → 9.5 (Pure analog experience)
UPDATE cars SET score_driver_fun = 9.5 WHERE slug = 'porsche-911-gt3-996';

-- Chevrolet Corvette C6 Z06: 9.4 → 9.2 (Great but heavier than Porsches)
UPDATE cars SET score_driver_fun = 9.2 WHERE slug = 'chevrolet-corvette-c6-z06';

-- Lotus Evora S: 8.9 → 9.2 (It's a Lotus - engagement is their identity)
UPDATE cars SET score_driver_fun = 9.2 WHERE slug = 'lotus-evora-s';


-- ============================================================================
-- AFTERMARKET SCORE UPDATES
-- Reference: Honda Civic global ecosystem might be 10
-- ============================================================================

-- All American muscle cars: 10 → 9.7 (Excellent but Civic ecosystem is larger)
UPDATE cars SET score_aftermarket = 9.7 WHERE slug = 'shelby-gt500';
UPDATE cars SET score_aftermarket = 9.7 WHERE slug = 'shelby-gt350';
UPDATE cars SET score_aftermarket = 9.7 WHERE slug = 'c7-corvette-grand-sport';
UPDATE cars SET score_aftermarket = 9.7 WHERE slug = 'c7-corvette-z06';
UPDATE cars SET score_aftermarket = 9.7 WHERE slug = 'camaro-zl1';
UPDATE cars SET score_aftermarket = 9.7 WHERE slug = 'mustang-gt-pp2';
UPDATE cars SET score_aftermarket = 9.7 WHERE slug = 'camaro-ss-1le';


-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify no scores exceed 10 or are below 1
-- SELECT slug, name, 
--   score_sound, score_interior, score_track, 
--   score_reliability, score_value, score_driver_fun, score_aftermarket
-- FROM cars 
-- WHERE score_sound > 10 OR score_interior > 10 OR score_track > 10 
--    OR score_reliability > 10 OR score_value > 10 
--    OR score_driver_fun > 10 OR score_aftermarket > 10;

-- Check remaining 10s (should only be reliability and value)
-- SELECT slug, name, 
--   CASE WHEN score_sound = 10 THEN 'SOUND' END,
--   CASE WHEN score_interior = 10 THEN 'INTERIOR' END,
--   CASE WHEN score_track = 10 THEN 'TRACK' END,
--   CASE WHEN score_reliability = 10 THEN 'RELIABILITY' END,
--   CASE WHEN score_value = 10 THEN 'VALUE' END,
--   CASE WHEN score_driver_fun = 10 THEN 'DRIVER_FUN' END,
--   CASE WHEN score_aftermarket = 10 THEN 'AFTERMARKET' END
-- FROM cars 
-- WHERE score_sound = 10 OR score_interior = 10 OR score_track = 10 
--    OR score_reliability = 10 OR score_value = 10 
--    OR score_driver_fun = 10 OR score_aftermarket = 10;
