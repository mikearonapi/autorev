-- ============================================================================
-- Migration 012: FIX Car-Specific Upgrade Recommendations
-- 
-- Corrects the primary focus for cars that were incorrectly set.
-- Focus should be on what the car NEEDS (its weakness), not what it's already
-- great at (its strength).
-- ============================================================================

-- ============================================================================
-- SHELBY GT350 - WRONG: Sound, RIGHT: Cooling
-- The Voodoo V8 ALREADY sounds incredible. It NEEDS cooling because it runs HOT.
-- ============================================================================
UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "The Voodoo V8 already sounds incredible at 8,250 RPM. But it runs HOT - oil and transmission cooling are critical for track reliability.",
  "coreUpgrades": ["oil-cooler", "trans-cooler", "brake-pads-track"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "coilovers-track"],
  "platformStrengths": ["8,250 RPM redline", "Flat-plane crank V8 sounds incredible", "MagneRide suspension is excellent", "Tremec TR-3160 manual is robust"],
  "watchOuts": ["Voodoo runs hot - cooling is the #1 priority", "Early engines had oil consumption issues (mostly resolved)", "Oil consumption is normal during break-in"]
}'::jsonb WHERE slug = 'shelby-gt350';

-- ============================================================================
-- 997.2 CARRERA S - WRONG: Sound, RIGHT: Power
-- The 997 already sounds great. It could use more power vs modern standards.
-- ============================================================================
UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 997.2 is considered peak analog 911 driving feel, but with 385hp it can feel modest by modern standards. Headers, exhaust, and tune wake it up.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["coilovers-street", "brake-pads-track", "oil-cooler"],
  "platformStrengths": ["Many consider this the best modern 911 for driving feel", "3.8L DFI engine is very reliable", "Manual gearbox is sublime"],
  "watchOuts": ["Rear main seal can leak on older examples", "Direct injection carbon buildup"]
}'::jsonb WHERE slug = '997-2-carrera-s';

-- ============================================================================
-- LEXUS LC 500 - WRONG: Sound, RIGHT: Handling
-- The 5.0L V8 ALREADY sounds incredible. The LC500 is HEAVY at 4,280 lbs.
-- ============================================================================
UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The 5.0L V8 already sounds fantastic. At 4,280 lbs, the LC500 is a heavy GT - suspension and weight reduction help it feel more agile.",
  "coreUpgrades": ["coilovers-street", "sway-bars", "brake-pads-street"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "lowering-springs"],
  "platformStrengths": ["2UR-GSE 5.0L V8 sounds incredible stock", "LFA-derived exhaust note", "Grand tourer comfort"],
  "watchOuts": ["Heavy for a sports car at 4,280 lbs", "10-speed automatic is smooth but not sporty", "Best enjoyed as a GT, not a track car"]
}'::jsonb WHERE slug = 'lexus-lc-500';

-- ============================================================================
-- LEXUS RC-F - WRONG: Sound, RIGHT: Handling
-- The V8 ALREADY sounds excellent. The RC-F is heavy at 3,958 lbs vs M4 (3,500 lbs).
-- ============================================================================
UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The 5.0L V8 already sounds great. At nearly 4,000 lbs, the RC-F is heavier than its German rivals - suspension and brakes help manage that mass.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "big-brake-kit"],
  "platformStrengths": ["Track Edition adds carbon roof and torque vectoring", "V8 sounds excellent stock", "RR Racing supercharger kits available"],
  "watchOuts": ["Heavier than M4/C63 competition (~400-500 lbs heavier)", "Weight is the main performance limitation"]
}'::jsonb WHERE slug = 'lexus-rc-f';

-- ============================================================================
-- MERCEDES C63 AMG W204 - WRONG: Sound, RIGHT: Handling
-- The M156 6.2L ALREADY has one of the best V8 sounds ever. The C63 is heavy
-- and known for understeer. Focus should be suspension.
-- ============================================================================
UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The M156 6.2L V8 already sounds legendary. The C63 is heavy and can understeer - coilovers and sway bars transform its handling character.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "big-brake-kit"],
  "platformStrengths": ["Last hand-built NA AMG engine", "Black Series is the ultimate version", "M156 V8 sound is legendary", "MCT transmission improves shifts"],
  "watchOuts": ["Head bolt issues on early M156 engines (2008-2010)", "Cam adjuster bolts should be inspected", "Heavy car - brakes work hard"]
}'::jsonb WHERE slug = 'mercedes-c63-amg-w204';

-- ============================================================================
-- AUDI R8 V8 - WRONG: Sound, RIGHT: Power
-- The 4.2L V8 ALREADY sounds great. The V8 R8 is down on power vs the V10.
-- ============================================================================
UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 4.2L V8 already sounds excellent. With 420hp vs 525hp+ in the V10, power upgrades help close that gap.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["intake", "coilovers-track", "brake-pads-track"],
  "platformStrengths": ["Shares platform with Gallardo", "Gated manual is most desirable", "Lighter than V10 version", "4.2L FSI V8 sounds fantastic"],
  "watchOuts": ["R-tronic can be jerky and expensive to service", "Carbon ceramic brakes expensive to replace", "Less collectible than V10"]
}'::jsonb WHERE slug = 'audi-r8-v8';

-- ============================================================================
-- ASTON MARTIN V8 VANTAGE - WRONG: Sound, RIGHT: Power
-- Aston V8s ALREADY sound incredible. The V8 Vantage is down on power vs rivals.
-- ============================================================================
UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 4.3/4.7L V8 already sounds incredible. At 380-420hp, its down on power vs rivals - headers, exhaust and tune add meaningful gains.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["intake", "coilovers-track", "brake-pads-track"],
  "platformStrengths": ["4.7L makes 420hp in later versions", "Manual is most desirable", "N420/S versions have 420-430hp", "Exhaust note is already world-class"],
  "watchOuts": ["Sportshift (automated manual) is expensive to maintain", "Running costs are high", "Parts availability can be challenging"]
}'::jsonb WHERE slug = 'aston-martin-v8-vantage';

-- ============================================================================
-- MASERATI GRANTURISMO - WRONG: Sound, RIGHT: Handling
-- Ferrari V8 ALREADY sounds incredible. The GT is HEAVY at 4,145 lbs.
-- ============================================================================
UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The Ferrari-derived V8 already sounds incredible. At 4,145 lbs, the GranTurismo is a heavy GT - suspension and brakes help it feel more agile.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "big-brake-kit"],
  "platformStrengths": ["Ferrari F136 V8 - 4.7L makes 454hp", "MC Stradale is the track version", "Already has one of the best V8 sounds", "Beautiful Italian GT styling"],
  "watchOuts": ["Expensive to maintain", "Electronics can be problematic", "Heavy for spirited driving at 4,145 lbs"]
}'::jsonb WHERE slug = 'maserati-granturismo';

-- ============================================================================
-- JAGUAR F-TYPE V6 S - WRONG: Sound, RIGHT: Power  
-- The SC V6 ALREADY sounds fantastic. It needs more power to compete with V8s.
-- ============================================================================
UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The supercharged V6 already sounds great with its crackle-and-pop exhaust. At 380hp, power upgrades help it compete with larger V8 sports cars.",
  "coreUpgrades": ["pulley-tune-sc", "tune-street", "heat-exchanger-sc"],
  "enhancementUpgrades": ["intake", "exhaust-catback", "coilovers-street"],
  "platformStrengths": ["380hp supercharged V6", "Manual transmission available", "Lighter than V8 R version", "Exhaust note is already fantastic"],
  "watchOuts": ["Same electronic concerns as F-Type R", "Smaller engine means less ultimate power potential"]
}'::jsonb WHERE slug = 'jaguar-f-type-v6-s';

-- ============================================================================
-- Verify the corrections
-- ============================================================================
-- SELECT slug, upgrade_recommendations->>'primaryFocus' as focus FROM cars 
-- WHERE slug IN ('shelby-gt350', '997-2-carrera-s', 'lexus-lc-500', 'lexus-rc-f', 
--                'mercedes-c63-amg-w204', 'audi-r8-v8', 'aston-martin-v8-vantage', 
--                'maserati-granturismo', 'jaguar-f-type-v6-s');













