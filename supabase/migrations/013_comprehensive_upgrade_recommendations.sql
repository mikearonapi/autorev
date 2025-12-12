-- ============================================================================
-- Migration 013: Comprehensive Upgrade Recommendations Audit
-- 
-- This migration sets correct upgrade recommendations for ALL vehicles based on
-- their ACTUAL weaknesses, not their strengths.
-- 
-- Logic:
-- - COOLING: Cars with known heat issues (forced induction, track use problems)
-- - HANDLING: Heavy cars (>4000 lbs) or low lateral G (<0.98)
-- - BRAKING: High-power cars that already have great everything else
-- - POWER: NA cars that respond to bolt-ons, modest power cars, turbo platforms
-- - SOUND: Only if car has genuinely poor sound AND benefits from exhaust work
-- ============================================================================

-- ============================================================================
-- PORSCHE - All focused correctly on their actual needs
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "The 4.0L flat-6 runs hot during sustained track use. Oil cooler is essential before pushing hard - this is the GT4s primary limitation.",
  "coreUpgrades": ["oil-cooler", "brake-pads-track", "brake-fluid-lines"],
  "enhancementUpgrades": ["coilovers-track", "big-brake-kit", "tires-track"],
  "platformStrengths": ["GT3-derived 4.0L flat-6 engine", "Excellent chassis balance", "Track-focused from factory", "9.5 sound score - already sounds incredible"],
  "watchOuts": ["Oil consumption normal up to 1qt/1000mi during break-in", "Heat soak on hot days limits continuous track sessions"]
}'::jsonb WHERE slug = '718-cayman-gt4';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The GTS 4.0 has excellent power for the chassis. Suspension upgrades unlock its full potential on twisty roads and help it match the GT4s handling.",
  "coreUpgrades": ["coilovers-street", "sway-bars", "tires-performance"],
  "enhancementUpgrades": ["exhaust-catback", "brake-pads-street", "oil-cooler"],
  "platformStrengths": ["394hp naturally aspirated flat-6", "Perfect weight distribution", "PASM suspension is excellent base", "Sound score 9.3 - fantastic stock"],
  "watchOuts": ["Same oil consumption notes as GT4", "Sport Chrono package recommended for best throttle maps"]
}'::jsonb WHERE slug = '718-cayman-gts-40';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 3.4L flat-6 responds beautifully to intake, exhaust, and tune. With 340hp, bolt-ons add meaningful gains while maintaining NA character.",
  "coreUpgrades": ["intake", "exhaust-catback", "headers", "tune-street"],
  "enhancementUpgrades": ["coilovers-street", "brake-pads-street", "oil-cooler"],
  "platformStrengths": ["Last naturally aspirated flat-6 Cayman generation", "Excellent analog driving feel", "Responds well to bolt-ons"],
  "watchOuts": ["Coolant pipes can leak on higher mileage", "AOS (Air Oil Separator) issues possible"]
}'::jsonb WHERE slug = '981-cayman-gts';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "At 325hp, the 981 S wakes up nicely with basic bolt-ons. Intake, exhaust, and tune add 30-40hp while keeping it reliable.",
  "coreUpgrades": ["intake", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["lowering-springs", "brake-pads-street", "coilovers-street"],
  "platformStrengths": ["Balanced mid-engine chassis", "Reliable 3.4L flat-6", "Great entry to Porsche ownership"],
  "watchOuts": ["Same as 981 GTS - coolant pipes and AOS", "Sport Chrono recommended for track use"]
}'::jsonb WHERE slug = '981-cayman-s';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 987.2s 320hp responds incredibly well to headers and exhaust. This is where NA flat-6 tuning shines - bolt-ons add real gains.",
  "coreUpgrades": ["headers", "exhaust-catback", "intake", "tune-street"],
  "enhancementUpgrades": ["coilovers-street", "brake-pads-track", "oil-cooler"],
  "platformStrengths": ["Last of the simpler analog Caymans", "IMS bearing NOT an issue on 987.2", "Headers provide significant NA power gains"],
  "watchOuts": ["Bore scoring possible on high-mileage engines", "Direct injection runs hotter - oil cooler important"]
}'::jsonb WHERE slug = '987-2-cayman-s';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The 400hp 3.8L is already strong. Focus on suspension and brakes to maximize the chassis and match handling to the power.",
  "coreUpgrades": ["coilovers-street", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["exhaust-catback", "tune-street", "oil-cooler"],
  "platformStrengths": ["Last naturally aspirated 911 Carrera", "Excellent 7-speed manual", "PDK is incredibly fast"],
  "watchOuts": ["Some reports of bore scoring on high-mileage engines", "Sports exhaust is a must-have factory option"]
}'::jsonb WHERE slug = '991-1-carrera-s';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 997.2 is peak analog 911 driving feel, but with 385hp it can feel modest by modern standards. Headers, exhaust, and tune add 40-50hp.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["coilovers-street", "brake-pads-track", "oil-cooler"],
  "platformStrengths": ["Many consider this the best modern 911 for driving feel", "3.8L DFI engine is very reliable", "Manual gearbox is sublime", "Sound 8.5 - already great"],
  "watchOuts": ["Rear main seal can leak on older examples", "Direct injection carbon buildup"]
}'::jsonb WHERE slug = '997-2-carrera-s';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "With 480-500hp on tap, the 997 Turbo has plenty of power. Suspension and brakes maximize what the AWD chassis can deliver.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["downpipe", "intercooler", "tune-street"],
  "platformStrengths": ["AWD provides incredible traction", "Turbos provide massive power potential", "Very reliable engines"],
  "watchOuts": ["Heavy car at 3,500 lbs", "Turbos can mask driver skill at limit"]
}'::jsonb WHERE slug = 'porsche-911-turbo-997-1';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "At 500hp, the 997.2 Turbo has massive power. Suspension work helps manage that power through corners effectively.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["downpipe", "intercooler", "tune-track"],
  "platformStrengths": ["500hp twin-turbo is incredible", "PDK shifts in milliseconds", "Very capable on track"],
  "watchOuts": ["Turbo lag masks driver inputs", "Heavy compared to NA 911s"]
}'::jsonb WHERE slug = 'porsche-911-turbo-997-2';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 996 GT3s 381hp responds to intake, exhaust, and tune. Headers unlock the Mezger engines top-end potential.",
  "coreUpgrades": ["headers", "exhaust-catback", "intake", "tune-track"],
  "enhancementUpgrades": ["coilovers-track", "brake-pads-track", "oil-cooler"],
  "platformStrengths": ["Mezger engine is bulletproof", "9.6 sound score - incredible stock", "Future classic appreciation"],
  "watchOuts": ["IMS bearing concerns on early cars", "RMS can leak"]
}'::jsonb WHERE slug = 'porsche-911-gt3-996';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "The 997 GT3 already has 435hp and incredible handling. For track use, cooling keeps it performing consistently.",
  "coreUpgrades": ["oil-cooler", "brake-pads-track", "brake-fluid-lines"],
  "enhancementUpgrades": ["coilovers-track", "headers", "exhaust-catback"],
  "platformStrengths": ["Mezger engine is legendary", "9.7 sound score - one of the best", "Track-bred chassis"],
  "watchOuts": ["Heavy track use requires cooling attention", "IMS is NOT an issue on GT3"]
}'::jsonb WHERE slug = 'porsche-911-gt3-997';

-- ============================================================================
-- CORVETTE - C8 and Z06 need cooling, others need power
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "The C8s DCT runs hot during track use. Transmission cooler is essential before any serious track sessions - this is the cars biggest limitation.",
  "coreUpgrades": ["trans-cooler", "oil-cooler", "brake-pads-track"],
  "enhancementUpgrades": ["exhaust-catback", "tune-street", "coilovers-track"],
  "platformStrengths": ["Mid-engine layout with supercar performance", "DCT is incredibly fast", "Z51 package adds essential cooling"],
  "watchOuts": ["DCT overheating is documented issue", "Early engine tick from AFM - disable with tune", "Front trunk limits intake options"]
}'::jsonb WHERE slug = 'c8-corvette-stingray';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The LT1 in the Z06 wide-body chassis is begging for headers and exhaust. Incredible bang-for-buck power gains from bolt-ons.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-track"],
  "enhancementUpgrades": ["supercharger-centrifugal", "oil-cooler", "brake-pads-track"],
  "platformStrengths": ["Z06 wide-body and brakes with NA engine", "Manual trans handles up to 700hp", "Already has dry sump from Z06"],
  "watchOuts": ["Z07 carbon ceramic brakes are expensive to replace"]
}'::jsonb WHERE slug = 'c7-corvette-grand-sport';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "COOLING. COOLING. COOLING. The LT4 is severely heat-limited on track. Upgrade everything that transfers heat before adding power.",
  "coreUpgrades": ["heat-exchanger-sc", "oil-cooler", "trans-cooler"],
  "enhancementUpgrades": ["pulley-tune-sc", "brake-pads-track", "coilovers-track"],
  "platformStrengths": ["650hp supercharged V8 from factory", "Magnetic ride is excellent", "Z07 package adds significant downforce"],
  "watchOuts": ["Overheating is the #1 documented problem", "Supercharger intercooler overwhelmed on track", "Rear diff cooler is undersized from factory"]
}'::jsonb WHERE slug = 'c7-corvette-z06';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The LS7 7.0L V8 responds incredibly to headers and exhaust. This is one of the best NA V8s ever made - let it breathe.",
  "coreUpgrades": ["headers", "exhaust-catback", "intake", "tune-track"],
  "enhancementUpgrades": ["coilovers-track", "brake-pads-track", "oil-cooler"],
  "platformStrengths": ["505hp LS7 is legendary", "Sound 9.2 - incredible stock", "Lightweight aluminum frame"],
  "watchOuts": ["Valve guide issues on early engines", "Dry sump requires attention during service"]
}'::jsonb WHERE slug = 'chevrolet-corvette-c6-z06';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The LS3 responds beautifully to headers, exhaust, and cam. Cost-effective power gains on a proven platform.",
  "coreUpgrades": ["headers", "exhaust-catback", "intake", "tune-street"],
  "enhancementUpgrades": ["coilovers-street", "brake-pads-track", "oil-cooler"],
  "platformStrengths": ["Wide-body look of Z06 with reliable LS3", "Sound 8.4 - great V8 rumble", "Excellent value for performance"],
  "watchOuts": ["Differential can be weak under hard launches", "Steering rack seals can leak"]
}'::jsonb WHERE slug = 'chevrolet-corvette-c6-grand-sport';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The LS6 is one of the best entry points into Corvette modding. Headers, exhaust, and tune provide excellent gains.",
  "coreUpgrades": ["headers", "exhaust-catback", "intake", "tune-street"],
  "enhancementUpgrades": ["coilovers-street", "brake-pads-track", "lowering-springs"],
  "platformStrengths": ["LS6 is incredibly reliable", "Lightweight C5 platform", "Massive aftermarket support"],
  "watchOuts": ["Steering column can develop play", "Harmonic balancer should be checked on high-mileage cars"]
}'::jsonb WHERE slug = 'chevrolet-corvette-c5-z06';

-- ============================================================================
-- FORD MUSTANG - GT350 needs COOLING (not sound), others vary
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "At 760hp, the GT500 generates massive heat. Heat exchanger upgrade is essential - power is useless if you are heat-limited.",
  "coreUpgrades": ["heat-exchanger-sc", "oil-cooler", "brake-pads-track"],
  "enhancementUpgrades": ["pulley-tune-sc", "trans-cooler", "coilovers-track"],
  "platformStrengths": ["760hp supercharged V8", "DCT handles power well", "Carbon fiber track pack available", "Sound 9.3 - fantastic stock"],
  "watchOuts": ["Heat soak significantly affects power", "DCT can be harsh in city driving"]
}'::jsonb WHERE slug = 'shelby-gt500';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "The Voodoo V8 already sounds INCREDIBLE at 8,250 RPM (9.7 sound score). But it runs HOT - oil and trans cooling are critical for track reliability.",
  "coreUpgrades": ["oil-cooler", "trans-cooler", "brake-pads-track"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "coilovers-track"],
  "platformStrengths": ["8,250 RPM redline", "Flat-plane crank V8 sounds LEGENDARY", "MagneRide suspension is excellent", "Tremec TR-3160 manual is robust"],
  "watchOuts": ["Voodoo runs hot - cooling is the #1 priority", "Early engines had oil consumption issues (mostly resolved)", "Do NOT neglect cooling for track use"]
}'::jsonb WHERE slug = 'shelby-gt350';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The Coyote 5.0 loves bolt-ons. Intake, exhaust, headers, and tune can add 50-70hp with excellent reliability.",
  "coreUpgrades": ["intake", "headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["supercharger-roots", "oil-cooler", "brake-pads-track"],
  "platformStrengths": ["PP2 adds MagneRide, Brembo brakes, aggressive alignment", "Coyote 5.0 responds incredibly to mods", "10R80 auto is excellent for drag racing"],
  "watchOuts": ["MT-82 manual transmission can have synchro issues under high power"]
}'::jsonb WHERE slug = 'mustang-gt-pp2';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The Boss 302 already sounds INCREDIBLE (9.7 sound score). With 444hp its got good power - focus on chassis to maximize corner speed.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "tune-track"],
  "platformStrengths": ["Roadrunner intake makes LEGENDARY sound", "Boss 302S suspension is track-ready", "One of the best factory Mustang packages ever"],
  "watchOuts": ["Aggressive factory tune can be hard on clutch", "Track key mode requires attention to temps"]
}'::jsonb WHERE slug = 'ford-mustang-boss-302';

-- ============================================================================
-- CHEVROLET CAMARO - ZL1 needs cooling, SS 1LE needs power
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "Same LT4 as C7 Z06 means same heat concerns. Heat exchanger and oil cooler are priorities before pushing hard.",
  "coreUpgrades": ["heat-exchanger-sc", "oil-cooler", "brake-pads-track"],
  "enhancementUpgrades": ["pulley-tune-sc", "trans-cooler", "coilovers-track"],
  "platformStrengths": ["650hp LT4 supercharged V8", "ZL1 1LE has DSSV dampers for track", "MRC suspension on base ZL1 is excellent", "Sound 9.2 - fantastic"],
  "watchOuts": ["Same heat concerns as C7 Z06", "Visibility is limited - challenging for track awareness"]
}'::jsonb WHERE slug = 'camaro-zl1';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The LT1 responds excellently to bolt-ons. Headers and exhaust are the key power adders - add 40-50hp reliably.",
  "coreUpgrades": ["headers", "exhaust-catback", "intake", "tune-track"],
  "enhancementUpgrades": ["supercharger-centrifugal", "oil-cooler", "coilovers-track"],
  "platformStrengths": ["1LE package is track-ready from factory", "Includes coolers for engine oil and differential", "Magnetic Ride available"],
  "watchOuts": ["LT1 runs warm under sustained track use - oil cooler helps"]
}'::jsonb WHERE slug = 'camaro-ss-1le';

-- ============================================================================
-- NISSAN - GT-R needs cooling, 370Z needs handling
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "The GT-R generates massive heat. Transmission cooler is CRITICAL - the DCT is the weak point that limits track sessions.",
  "coreUpgrades": ["trans-cooler", "intercooler", "oil-cooler"],
  "enhancementUpgrades": ["downpipe", "intake", "piggyback-tuner"],
  "platformStrengths": ["ATTESA E-TS AWD is incredibly capable", "VR38DETT responds incredibly to mods", "Hand-built engines with Takumi signature"],
  "watchOuts": ["Transmission heat is the primary track concern", "Early 2009-2011 transmissions had issues - largely resolved"]
}'::jsonb WHERE slug = 'nissan-gt-r';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The VQ37s 350hp has moderate tuning potential. Focus on suspension and brakes to maximize what the chassis can deliver.",
  "coreUpgrades": ["coilovers-track", "brake-pads-track", "sway-bars"],
  "enhancementUpgrades": ["exhaust-catback", "intake", "tune-street"],
  "platformStrengths": ["NISMO package adds upgraded suspension, brakes, and LSD", "SynchroRev Match is a fun feature", "Reliable VQ platform"],
  "watchOuts": ["Oil gallery gaskets can fail on high mileage", "CSC (concentric slave cylinder) can fail"]
}'::jsonb WHERE slug = 'nissan-370z-nismo';

-- ============================================================================
-- BMW - Turbo platforms respond to power mods
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The S55 twin-turbo responds incredibly to tuning. JB4 or downpipe + tune can add 80-100hp easily and reliably.",
  "coreUpgrades": ["downpipe", "intercooler", "piggyback-tuner"],
  "enhancementUpgrades": ["intake", "exhaust-catback", "coilovers-track"],
  "platformStrengths": ["S55 engine shared with M3/M4", "Excellent chassis balance", "DCT is faster, manual more engaging"],
  "watchOuts": ["Crank hub issues on some S55 engines", "Charge pipe can crack under boost"]
}'::jsonb WHERE slug = 'bmw-m2-competition';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The S55 is a tuning monster. JB4 + downpipe = easy 500hp while maintaining reliability. Intercooler prevents heat soak.",
  "coreUpgrades": ["downpipe", "intercooler", "piggyback-tuner", "charge-pipe-upgrade"],
  "enhancementUpgrades": ["intake", "exhaust-catback", "oil-cooler"],
  "platformStrengths": ["Competition package adds firmer suspension", "Carbon roof lowers center of gravity", "GTS version has water injection"],
  "watchOuts": ["Crank hub issues (rare but documented)", "Charge pipes can crack", "Rod bearings should be inspected"]
}'::jsonb WHERE slug = 'bmw-m4-f82';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "At 575-617hp, the M5 has massive power. At 4,345-4,370 lbs, suspension work helps manage that mass through corners.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["downpipe", "intercooler", "tune-street"],
  "platformStrengths": ["S63 twin-turbo V8 has tremendous power potential", "xDrive AWD provides traction", "Reasonably practical super sedan"],
  "watchOuts": ["Heavy car at 4,345+ lbs", "Rod bearings require attention on high-mileage S63"]
}'::jsonb WHERE slug IN ('bmw-m5-f10', 'bmw-m5-f90-competition');

-- ============================================================================
-- TOYOTA / LEXUS
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The B58 responds incredibly to tuning. A JB4 or downpipe + tune adds 80-100hp with zero drama - its a proven platform.",
  "coreUpgrades": ["downpipe", "piggyback-tuner", "intercooler"],
  "enhancementUpgrades": ["intake", "exhaust-catback", "coilovers-track"],
  "platformStrengths": ["B58 has excellent tuning potential", "ZF8 automatic is bulletproof", "Chassis is very capable"],
  "watchOuts": ["Stock fuel pump limits around 500hp", "Early cars had some electrical gremlins"]
}'::jsonb WHERE slug = 'toyota-gr-supra';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The 5.0L V8 already sounds fantastic (8.3 sound score). At 4,280 lbs, the LC500 is a heavy GT - suspension work helps it feel more agile.",
  "coreUpgrades": ["coilovers-street", "sway-bars", "brake-pads-street"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "lowering-springs"],
  "platformStrengths": ["2UR-GSE 5.0L V8 sounds incredible stock", "LFA-derived exhaust note", "Grand tourer comfort", "10/10 reliability"],
  "watchOuts": ["Heavy for a sports car at 4,280 lbs", "Best enjoyed as a GT, not a track car"]
}'::jsonb WHERE slug = 'lexus-lc-500';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The 5.0L V8 sounds good stock. At nearly 4,000 lbs, the RC-F is heavier than its German rivals - suspension and brakes help manage that mass.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "big-brake-kit"],
  "platformStrengths": ["Track Edition adds carbon roof and torque vectoring", "V8 sounds good stock", "RR Racing supercharger kits available", "9.9 reliability"],
  "watchOuts": ["Heavier than M4/C63 competition (~400-500 lbs heavier)", "Weight is the main performance limitation"]
}'::jsonb WHERE slug = 'lexus-rc-f';

-- ============================================================================
-- MERCEDES
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The M156 6.2L V8 already sounds LEGENDARY. The C63 is heavy and can understeer - coilovers and sway bars transform handling character.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "big-brake-kit"],
  "platformStrengths": ["Last hand-built NA AMG engine", "Black Series is the ultimate version", "M156 V8 sound is LEGENDARY", "MCT transmission improves shifts"],
  "watchOuts": ["Head bolt issues on early M156 engines (2008-2010)", "Cam adjuster bolts should be inspected", "Heavy car - brakes work hard"]
}'::jsonb WHERE slug = 'mercedes-c63-amg-w204';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The M177 twin-turbo V8 has tremendous power. At 4,000+ lbs, the C63 needs suspension work to maximize corner speed.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["downpipe", "intercooler", "tune-street"],
  "platformStrengths": ["503hp twin-turbo V8", "AMG Speedshift MCT is quick", "Aggressive styling"],
  "watchOuts": ["Heavy at 4,000+ lbs", "Turbos mute some of the M156 drama"]
}'::jsonb WHERE slug = 'mercedes-c63-amg-w205';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "At 603-577hp, the E63 has massive power. At 4,235-4,500 lbs, suspension work helps this super sedan corner better.",
  "coreUpgrades": ["coilovers-street", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["downpipe", "tune-street", "big-brake-kit"],
  "platformStrengths": ["Incredible straight-line performance", "AWD provides traction", "Practical family car with supercar power"],
  "watchOuts": ["Very heavy", "Turbo V8s can have component failures", "Air suspension can be expensive to replace"]
}'::jsonb WHERE slug IN ('mercedes-amg-e63-w212', 'mercedes-amg-e63s-w213');

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The M178 twin-turbo V8 responds well to tuning. Downpipe and tune add significant power gains on this platform.",
  "coreUpgrades": ["downpipe", "intercooler", "tune-street"],
  "enhancementUpgrades": ["exhaust-catback", "coilovers-track", "brake-pads-track"],
  "platformStrengths": ["Long hood, short deck GT proportions", "Front-mid engine layout", "Excellent sound with sport exhaust", "Very capable chassis"],
  "watchOuts": ["Cramped interior for tall drivers", "Visibility can be challenging"]
}'::jsonb WHERE slug = 'mercedes-amg-gt';

-- ============================================================================
-- AUDI / LAMBORGHINI
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 4.2L V8 already sounds excellent. At 430hp vs 525hp+ in the V10, headers and exhaust help close that power gap.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["intake", "coilovers-track", "brake-pads-track"],
  "platformStrengths": ["Shares platform with Gallardo", "Gated manual is most desirable", "Lighter than V10 version", "Sound 8.6 - already great"],
  "watchOuts": ["R-tronic can be jerky and expensive to service", "Carbon ceramic brakes expensive to replace"]
}'::jsonb WHERE slug = 'audi-r8-v8';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "braking",
  "focusReason": "The 5.2L V10 is already incredible with 525hp. Focus on brakes and cooling for track use - the engine needs little help.",
  "coreUpgrades": ["brake-pads-track", "brake-fluid-lines", "oil-cooler"],
  "enhancementUpgrades": ["coilovers-track", "exhaust-catback", "tune-street"],
  "platformStrengths": ["5.2L FSI V10 - Lamborghini derived", "Plus/Performance versions have 610hp", "S-tronic DCT is excellent", "Sound 9.5 - incredible"],
  "watchOuts": ["Carbon sigma rotors are fragile if overheated", "R-tronic (if equipped) requires careful operation"]
}'::jsonb WHERE slug = 'audi-r8-v10';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "braking",
  "focusReason": "The V10 is already incredible at 520hp with legendary sound (9.6). Focus on brakes and cooling for track use.",
  "coreUpgrades": ["brake-pads-track", "brake-fluid-lines", "oil-cooler"],
  "enhancementUpgrades": ["exhaust-catback", "coilovers-track", "tune-street"],
  "platformStrengths": ["Shares platform with R8", "LP560-4 and later have 5.2L V10", "Superleggera is the lightweight version", "Sound 9.6 - INCREDIBLE"],
  "watchOuts": ["E-gear requires expensive clutch replacement", "Timing chains can be expensive to service"]
}'::jsonb WHERE slug = 'lamborghini-gallardo';

-- ============================================================================
-- LOTUS
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The AMG-sourced 2.0L turbo responds well to tuning. The Toyota V6 version has less tuning potential but more reliability.",
  "coreUpgrades": ["intake", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["intercooler", "coilovers-track", "brake-pads-track"],
  "platformStrengths": ["AMG 2.0T has 400hp and more tuning potential", "Toyota V6 is more reliable long-term", "Last pure ICE Lotus"],
  "watchOuts": ["Early production had some quality issues", "Dealer network is limited"]
}'::jsonb WHERE slug = 'lotus-emira';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "The supercharged V6 runs hot on track. Focus on cooling before power - the supercharger heat limits sustained performance.",
  "coreUpgrades": ["oil-cooler", "pulley-tune-sc", "brake-pads-track"],
  "enhancementUpgrades": ["coilovers-track", "exhaust-catback", "tires-track"],
  "platformStrengths": ["Edelbrock supercharger from factory", "Toyota 2GR-FE V6 is incredibly reliable", "GT version is lighter than base"],
  "watchOuts": ["A/C can be weak in hot climates", "Parts availability can be challenging"]
}'::jsonb WHERE slug = 'lotus-evora-gt';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The supercharged V6 at 345hp responds to basic mods. Pulley and tune add easy power while maintaining reliability.",
  "coreUpgrades": ["pulley-tune-sc", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["oil-cooler", "coilovers-track", "brake-pads-track"],
  "platformStrengths": ["Supercharged 2GR-FE makes 345hp", "Excellent weight distribution", "Manual is more desirable than IPS"],
  "watchOuts": ["IPS gearbox can be clunky"]
}'::jsonb WHERE slug = 'lotus-evora-s';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The Elises 189hp is modest but the car only weighs 1,984 lbs. Intake and exhaust maximize the Toyota 2ZZ while keeping it reliable.",
  "coreUpgrades": ["intake", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["coilovers-track", "brake-pads-track", "tires-track"],
  "platformStrengths": ["Under 2,000 lbs!", "Incredible driver engagement - 9.8 driverFun", "Track 9.0 - incredible capability"],
  "watchOuts": ["Not comfortable for long trips", "Very limited cargo space", "Can be challenging in traffic"]
}'::jsonb WHERE slug = 'lotus-elise-s2';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "The supercharged versions run hot on track. The NA versions need power mods. Either way, track-focused prep is the priority.",
  "coreUpgrades": ["oil-cooler", "brake-pads-track", "coilovers-track"],
  "enhancementUpgrades": ["exhaust-catback", "tune-street", "tires-track"],
  "platformStrengths": ["SC versions make up to 350hp in 2,150 lbs", "Track 9.5 - incredible capability", "9.8 driverFun - pure engagement"],
  "watchOuts": ["Harsh ride on street", "Very limited practicality"]
}'::jsonb WHERE slug = 'lotus-exige-s';

-- ============================================================================
-- DODGE - Heavy cars need handling
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The 8.4L V10 makes 645hp and sounds incredible (9.5). At 3,374 lbs with 1.15G lateral, focus on chassis to handle that power safely.",
  "coreUpgrades": ["coilovers-track", "brake-pads-track", "sway-bars"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "oil-cooler"],
  "platformStrengths": ["Gen 5 has 640hp 8.4L V10", "ACR is the ultimate track variant", "Manual only - Tremec TR6060"],
  "watchOuts": ["Can be dangerous in inexperienced hands", "Heat management important due to engine size"]
}'::jsonb WHERE slug = 'dodge-viper';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "At 4,232 lbs with 0.92G lateral grip, the Challenger needs handling help more than power. Suspension transforms the driving experience.",
  "coreUpgrades": ["coilovers-street", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "platformStrengths": ["485hp 6.4L HEMI sounds great", "Retro muscle car styling", "Available manual transmission"],
  "watchOuts": ["Heavy at 4,232 lbs", "Rear seat visibility limited", "Not a track car from factory"]
}'::jsonb WHERE slug = 'dodge-challenger-srt-392';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "717hp in a 4,449 lb car with 0.94G lateral - it has massive power but struggles to put it down. Suspension helps manage that power.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["heat-exchanger-sc", "oil-cooler", "big-brake-kit"],
  "platformStrengths": ["717hp supercharged HEMI", "Sound 9.5 - incredible", "Straight-line rocket"],
  "watchOuts": ["Heavy at 4,449 lbs", "Supercharger heat soak on track", "Fuel economy is brutal"]
}'::jsonb WHERE slug = 'dodge-challenger-hellcat';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "At 4,365 lbs with 0.91G lateral, the Charger needs chassis work more than power. Make it handle the power it already has.",
  "coreUpgrades": ["coilovers-street", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "platformStrengths": ["485hp 6.4L HEMI", "Practical 4-door muscle", "Sound 8.7 - great V8 rumble"],
  "watchOuts": ["Very heavy at 4,365 lbs", "Handling is the main limitation"]
}'::jsonb WHERE slug = 'dodge-charger-srt-392';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "707hp in a 4,560 lb sedan with 0.93G lateral. Suspension work helps this straight-line monster actually corner.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["heat-exchanger-sc", "oil-cooler", "big-brake-kit"],
  "platformStrengths": ["707hp supercharged HEMI", "Sound 9.5 - incredible", "4-door practicality"],
  "watchOuts": ["Heaviest car here at 4,560 lbs", "Heat soak on track", "More drag racer than track car"]
}'::jsonb WHERE slug = 'dodge-charger-hellcat';

-- ============================================================================
-- JAGUAR
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The supercharged 5.0L V8 responds to pulley and tune. Easy 650-700hp with supporting mods while keeping it reliable.",
  "coreUpgrades": ["pulley-tune-sc", "heat-exchanger-sc", "exhaust-catback"],
  "enhancementUpgrades": ["oil-cooler", "coilovers-track", "brake-pads-track"],
  "platformStrengths": ["AJ133 supercharged V8", "SVR version has 575hp", "ZF8 handles the power well", "Sound 9.4 - fantastic"],
  "watchOuts": ["Electronic issues can occur", "Heat exchanger needs upgrading for sustained boost"]
}'::jsonb WHERE slug = 'jaguar-f-type-r';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The supercharged V6 already sounds great at 8.2. At 380hp, power upgrades help it compete with larger V8 sports cars.",
  "coreUpgrades": ["pulley-tune-sc", "tune-street", "heat-exchanger-sc"],
  "enhancementUpgrades": ["intake", "exhaust-catback", "coilovers-street"],
  "platformStrengths": ["380hp supercharged V6", "Manual transmission available", "Lighter than V8 R version", "Sound 8.2 - already sounds good"],
  "watchOuts": ["Same electronic concerns as F-Type R", "Smaller engine means less ultimate power potential"]
}'::jsonb WHERE slug = 'jaguar-f-type-v6-s';

-- ============================================================================
-- ALFA ROMEO
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "The 1.75L turbo runs hot during track sessions. Intercooler upgrade maintains power - heat soak is the main limitation.",
  "coreUpgrades": ["intercooler", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["coilovers-track", "brake-pads-track", "oil-cooler"],
  "platformStrengths": ["Carbon fiber monocoque - incredibly light at 2,465 lbs", "TCT dual-clutch is quick", "Spider version has removable roof"],
  "watchOuts": ["Reliability can be questionable", "Dealer network limited", "Parts expensive", "No power steering - heavy at low speeds"]
}'::jsonb WHERE slug = 'alfa-romeo-4c';

-- ============================================================================
-- ASTON MARTIN
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 4.3/4.7L V8 already sounds incredible (8.3). At 380-420hp, its down on power vs modern rivals - bolt-ons add meaningful gains.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["intake", "coilovers-track", "brake-pads-track"],
  "platformStrengths": ["4.7L makes 420hp in later versions", "Manual is most desirable", "Sound is already world-class"],
  "watchOuts": ["Sportshift (automated manual) is expensive to maintain", "Running costs are high", "Parts availability can be challenging"]
}'::jsonb WHERE slug = 'aston-martin-v8-vantage';

-- ============================================================================
-- MASERATI
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The Ferrari-derived V8 already sounds INCREDIBLE (listed among best V8 sounds). At 4,145 lbs, suspension helps this heavy GT corner better.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "big-brake-kit"],
  "platformStrengths": ["Ferrari F136 V8 - 4.7L makes 454hp", "MC Stradale is the track version", "Sound is INCREDIBLE stock"],
  "watchOuts": ["Expensive to maintain", "Electronics can be problematic", "Heavy at 4,145 lbs"]
}'::jsonb WHERE slug = 'maserati-granturismo';

-- ============================================================================
-- CADILLAC - SC V8s respond to power mods
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The LSA supercharged V8 responds incredibly to pulley and tune. Easy 600+ hp with basic mods - one of the best tuning platforms.",
  "coreUpgrades": ["pulley-tune-sc", "heat-exchanger-sc", "exhaust-catback"],
  "enhancementUpgrades": ["headers", "oil-cooler", "coilovers-track"],
  "platformStrengths": ["556hp LSA supercharged V8", "Sound 8.8 - great SC V8 sound", "Magnetic Ride Control", "Recaro seats available"],
  "watchOuts": ["Supercharger heat soak on track", "Rear diff can be weak under hard launches"]
}'::jsonb WHERE slug = 'cadillac-cts-v-gen2';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The LT4 (same as C7 Z06/ZL1) responds incredibly to pulley and tune. Heat exchanger helps before pushing power.",
  "coreUpgrades": ["pulley-tune-sc", "heat-exchanger-sc", "exhaust-catback"],
  "enhancementUpgrades": ["headers", "oil-cooler", "coilovers-track"],
  "platformStrengths": ["640hp LT4 supercharged V8", "Sound 8.8 - fantastic", "8-speed auto is quick", "Carbon fiber package available"],
  "watchOuts": ["Same heat concerns as C7 Z06", "Rear diff can be weak under hard launches"]
}'::jsonb WHERE slug = 'cadillac-cts-v-gen3';

-- ============================================================================
-- SUBARU - Turbo platforms respond to power mods
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The EJ257 responds incredibly to intake, downpipe, and tune. The essential STI power trio adds 50-80hp reliably.",
  "coreUpgrades": ["intake", "downpipe", "exhaust-catback", "tune-track"],
  "enhancementUpgrades": ["intercooler", "oil-cooler", "coilovers-track"],
  "platformStrengths": ["DCCD AWD system is excellent", "Brembo brakes from factory", "Last of the EJ-powered STIs"],
  "watchOuts": ["Ringland failure on tuned engines", "Head gaskets can fail", "Oil starvation during hard cornering possible"]
}'::jsonb WHERE slug = 'subaru-wrx-sti-va';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "Same EJ257 formula as VA. Intake, downpipe, and tune are essential. The hatchback is lighter and more practical.",
  "coreUpgrades": ["intake", "downpipe", "exhaust-catback", "tune-track"],
  "enhancementUpgrades": ["intercooler", "oil-cooler", "coilovers-track"],
  "platformStrengths": ["GR hatchback is most desired", "Lighter and more balanced than sedan", "Wide-body fenders on GR"],
  "watchOuts": ["Same as VA - ringland, head gaskets"]
}'::jsonb WHERE slug = 'subaru-wrx-sti-gr-gv';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The classic STI formula. Intake, downpipe, and tune wake up the EJ257 beautifully - this platform loves boost.",
  "coreUpgrades": ["intake", "downpipe", "exhaust-catback", "tune-track"],
  "enhancementUpgrades": ["intercooler", "oil-cooler", "coilovers-track"],
  "platformStrengths": ["2004 blob-eye, 2006 hawk-eye - iconic styling", "Many consider this the best STI generation", "DCCD system is excellent"],
  "watchOuts": ["Age-related issues more common", "Same engine concerns as newer STIs"]
}'::jsonb WHERE slug = 'subaru-wrx-sti-gd';

-- ============================================================================
-- MITSUBISHI - Turbo platforms respond to power mods
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The legendary 4G63. Intake, exhaust, and boost controller can add 50-80hp easily. This is a tuning platform royalty.",
  "coreUpgrades": ["intake", "downpipe", "exhaust-catback", "tune-track"],
  "enhancementUpgrades": ["intercooler", "oil-cooler", "turbo-upgrade-existing"],
  "platformStrengths": ["4G63 2.0L turbo is legendary", "ACD and AYC are excellent", "Evo 8/9 MR have Bilstein suspension"],
  "watchOuts": ["Crankwalk on some 4G63 engines", "Transfer case can be fragile under high power"]
}'::jsonb WHERE slug = 'mitsubishi-lancer-evo-8-9';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 4B11T is responsive to mods. MIVEC provides good power across the rev range. More refined than 8/9 but still loves boost.",
  "coreUpgrades": ["intake", "downpipe", "exhaust-catback", "tune-track"],
  "enhancementUpgrades": ["intercooler", "oil-cooler", "turbo-upgrade-existing"],
  "platformStrengths": ["S-AWC (Super All Wheel Control) is impressive", "SST dual-clutch available", "Final Edition highly collectible"],
  "watchOuts": ["SST can be fragile under high power", "Crankshaft thrust bearing wear reported", "4B11T weaker than 4G63 at extreme levels"]
}'::jsonb WHERE slug = 'mitsubishi-lancer-evo-x';

-- ============================================================================
-- HOT HATCHES - Turbo platforms respond to power mods
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The K20C1 turbo responds incredibly to bolt-ons. Intake, downpipe, and tune add 50-70hp while maintaining Honda reliability.",
  "coreUpgrades": ["intake", "downpipe", "exhaust-catback", "tune-track"],
  "enhancementUpgrades": ["intercooler", "coilovers-track", "brake-pads-track"],
  "platformStrengths": ["K20C1 is extremely tunable", "Track 8.4-9.0 - incredible for a FWD", "Reliability 9.5-9.6 - legendary Honda"],
  "watchOuts": ["FWD torque steer under hard acceleration", "Sound 6.2 - 4-cylinder is modest"]
}'::jsonb WHERE slug IN ('honda-civic-type-r-fk8', 'honda-civic-type-r-fl5');

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The EA888 turbo is a tuning legend. IS38 turbo upgrade or Stage 2 tune transforms the Golf R into a 400hp+ monster.",
  "coreUpgrades": ["downpipe", "intake", "tune-track", "intercooler"],
  "enhancementUpgrades": ["turbo-upgrade-existing", "coilovers-track", "brake-pads-track"],
  "platformStrengths": ["EA888 has massive tuning potential", "Haldex AWD provides traction", "Practical daily driver"],
  "watchOuts": ["Sound 5.3 - 4-cylinder is modest", "DSG farts between gears (some love it)"]
}'::jsonb WHERE slug IN ('volkswagen-golf-r-mk7', 'volkswagen-golf-r-mk8');

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The EA888 responds beautifully to basic bolt-ons. IS20 to IS38 turbo swap is a popular upgrade path for big power.",
  "coreUpgrades": ["downpipe", "intake", "tune-street"],
  "enhancementUpgrades": ["intercooler", "coilovers-street", "brake-pads-street"],
  "platformStrengths": ["EA888 tuning platform", "Practical daily driver", "Great value for performance"],
  "watchOuts": ["FWD limits traction", "Sound 5.2 - modest 4-cylinder"]
}'::jsonb WHERE slug = 'volkswagen-gti-mk7';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The 2.3L EcoBoost has 350hp but the Focus RS is known for head gasket issues. Focus on chassis - be careful with power mods.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["intercooler", "intake", "tune-street"],
  "platformStrengths": ["AWD with drift mode", "Incredible handling for a hot hatch", "Track 8.4 - very capable"],
  "watchOuts": ["HEAD GASKET ISSUES are common", "Reliability 4.8 - worst in class", "Be very careful with power mods"]
}'::jsonb WHERE slug = 'ford-focus-rs';

-- ============================================================================
-- TESLA - Electric, limited mod potential
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The dual motors provide instant torque. At 4,065 lbs with 0.96G lateral, suspension work helps manage the mass and improve feel.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["big-brake-kit", "tires-track", "lowering-springs"],
  "platformStrengths": ["Instant torque from dual motors", "3.1 second 0-60", "Very practical daily driver", "Low running costs"],
  "watchOuts": ["Limited traditional mod potential", "Track use drains battery quickly", "Regenerative braking affects feel"]
}'::jsonb WHERE slug = 'tesla-model-3-performance';

-- ============================================================================
-- HONDA / ACURA - NA engines need power
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The F20C/F22C VTEC is legendary but 240hp is modest by modern standards. Intake, header, and tune maximize the screaming redline.",
  "coreUpgrades": ["intake", "headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["coilovers-track", "brake-pads-track", "oil-cooler"],
  "platformStrengths": ["9,000 RPM redline", "Sound 8.2 - great VTEC crossover", "Legendary reliability", "Pure drivers car"],
  "watchOuts": ["AP1 has shorter gears, more rev-happy", "AP2 has more torque, better daily", "Soft top needs care"]
}'::jsonb WHERE slug = 'honda-s2000';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The B18C5 VTEC is iconic but 195hp needs help to stay competitive. Intake, header, and exhaust wake up the high-RPM power.",
  "coreUpgrades": ["intake", "headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["coilovers-track", "brake-pads-track", "lowering-springs"],
  "platformStrengths": ["8,400 RPM redline", "Sound 7.9 - great VTEC howl", "Legendary Honda reliability", "Limited slip differential"],
  "watchOuts": ["Very sought after - values are high", "Most have been modified", "Theft risk is high"]
}'::jsonb WHERE slug = 'acura-integra-type-r-dc2';

-- ============================================================================
-- MAZDA MIATA - All generations need power
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "At 128hp the NA Miata is slow by any standard. Intake, header, and exhaust add meaningful gains while keeping it fun.",
  "coreUpgrades": ["intake", "headers", "exhaust-catback"],
  "enhancementUpgrades": ["coilovers-street", "lowering-springs", "brake-pads-street"],
  "platformStrengths": ["Perfect 50/50 balance", "Under 2,200 lbs!", "Massive aftermarket support", "Simplicity is a feature"],
  "watchOuts": ["Rust is the enemy - check carefully", "Soft top needs maintenance", "Small engine limits power potential"]
}'::jsonb WHERE slug = 'mazda-mx5-miata-na';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "At 142hp the NB is slightly better but still slow. 1.8L responds to bolt-ons and the platform is incredibly light.",
  "coreUpgrades": ["intake", "headers", "exhaust-catback"],
  "enhancementUpgrades": ["coilovers-street", "lowering-springs", "brake-pads-street"],
  "platformStrengths": ["Improved 1.8L over NA", "Still under 2,400 lbs", "Great chassis balance", "Pop-up headlights are gone (some miss them)"],
  "watchOuts": ["Same rust concerns as NA", "VVT on Mazdaspeed adds complexity"]
}'::jsonb WHERE slug = 'mazda-mx5-miata-nb';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "At 167hp the NC gained weight without much power. Intake, header, exhaust help wake up the 2.0L while keeping it reliable.",
  "coreUpgrades": ["intake", "headers", "exhaust-catback"],
  "enhancementUpgrades": ["coilovers-street", "brake-pads-track", "lowering-springs"],
  "platformStrengths": ["Better daily driver than NA/NB", "More refined chassis", "Retractable hardtop available", "Better interior quality"],
  "watchOuts": ["Heavier than predecessors", "Less raw feel than NA/NB", "Power limiting factor for autocross"]
}'::jsonb WHERE slug = 'mazda-mx5-miata-nc';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "At 181hp the ND returned to light weight but still needs more power. Header and tune add 20-30hp on this platform.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["intake", "coilovers-track", "brake-pads-track"],
  "platformStrengths": ["Returned to lightweight at 2,341 lbs", "Best chassis balance of all Miatas", "Sound 6.5 - good for 4-cyl", "Track 7.4 - very capable"],
  "watchOuts": ["Aftermarket less developed than NA/NB", "RF adds weight", "Limited cargo space"]
}'::jsonb WHERE slug = 'mazda-mx5-miata-nd';

-- ============================================================================
-- TOYOTA 86 / BRZ - Famous for needing power
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The famous torque dip makes the FA20 feel slower than 205hp suggests. Headers are ESSENTIAL - they fix the dip and add power.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["intake", "coilovers-track", "brake-pads-track"],
  "platformStrengths": ["Perfect chassis balance", "RWD affordable fun", "Huge aftermarket support", "Great for learning car control"],
  "watchOuts": ["TORQUE DIP is real - headers fix it", "Sound 5.5 - modest", "Not fast in a straight line"]
}'::jsonb WHERE slug IN ('toyota-86-scion-frs', 'subaru-brz-zc6');

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 2nd gen fixed the torque dip but 228hp is still modest. Headers and tune add meaningful gains to this excellent chassis.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["intake", "coilovers-track", "brake-pads-track"],
  "platformStrengths": ["No more torque dip!", "2.4L has more power everywhere", "Improved interior", "Track 8.1 - very capable"],
  "watchOuts": ["Sound 6.0 - still modest", "Still not fast in a straight line", "Aftermarket catching up"]
}'::jsonb WHERE slug IN ('toyota-gr86', 'subaru-brz-zd8');

-- ============================================================================
-- JAPANESE LEGENDS - MK4 Supra, RX-7, 300ZX
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 2JZ-GTE is the MOST LEGENDARY tuning engine ever made. Stock turbos limit it - single turbo conversion unlocks 500-1000hp.",
  "coreUpgrades": ["exhaust-catback", "intake", "tune-track"],
  "enhancementUpgrades": ["turbo-upgrade-existing", "intercooler", "fuel-system"],
  "platformStrengths": ["2JZ-GTE handles 1000hp on stock internals", "Sound 7.8 - good turbo I6", "Prices have skyrocketed - future classic"],
  "watchOuts": ["EXPENSIVE - prices are astronomical", "Many have been heavily modified", "Bone stock examples are rare"]
}'::jsonb WHERE slug = 'toyota-supra-mk4-a80-turbo';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "The twin-turbo rotary makes great power but COOLING is the FDs Achilles heel. Oil cooler and radiator upgrades are essential.",
  "coreUpgrades": ["oil-cooler", "intercooler", "exhaust-catback"],
  "enhancementUpgrades": ["tune-track", "brake-pads-track", "coilovers-track"],
  "platformStrengths": ["Rotary sounds incredible - 8.8 sound", "Gorgeous design", "Sequential twin-turbo is unique", "Light weight"],
  "watchOuts": ["COOLING IS CRITICAL", "Rotary maintenance is specialized", "Apex seals require attention", "Not a beginner car"]
}'::jsonb WHERE slug = 'mazda-rx7-fd3s';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The VG30DETT twin-turbo responds to basic bolt-ons. Exhaust, intake, and boost controller add meaningful power gains.",
  "coreUpgrades": ["exhaust-catback", "intake", "tune-street"],
  "enhancementUpgrades": ["intercooler", "oil-cooler", "coilovers-street"],
  "platformStrengths": ["Twin-turbo V6 has good tuning potential", "Advanced for its era", "T-top available"],
  "watchOuts": ["Engine bay is TIGHT - difficult to work on", "30+ years old - expect age-related issues", "Parts getting harder to find"]
}'::jsonb WHERE slug = 'nissan-300zx-twin-turbo-z32';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The VQ35 is a good NA V6 but 306hp is modest. Intake, exhaust, and tune help but single turbo kits unlock real power.",
  "coreUpgrades": ["intake", "exhaust-catback", "headers", "tune-street"],
  "enhancementUpgrades": ["coilovers-track", "brake-pads-track", "oil-cooler"],
  "platformStrengths": ["VQ35 is reliable", "Great chassis balance", "Huge aftermarket support", "Affordable entry point"],
  "watchOuts": ["Oil consumption on some VQ35s", "CSC can fail", "Sound 7.0 - modest for a V6"]
}'::jsonb WHERE slug = 'nissan-350z';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The VR30DDTT twin-turbo responds incredibly to bolt-ons. Downpipe and tune add 80-100hp - same engine as in the GT-R.",
  "coreUpgrades": ["downpipe", "intake", "tune-track", "intercooler"],
  "enhancementUpgrades": ["exhaust-catback", "coilovers-track", "brake-pads-track"],
  "platformStrengths": ["VR30DDTT has massive tuning potential", "400hp stock is a great starting point", "Modern platform with retro styling"],
  "watchOuts": ["Sound 7.0 - turbo V6 is modest", "Automatic only in most markets", "Some early production issues"]
}'::jsonb WHERE slug = 'nissan-z-rz34';

-- ============================================================================
-- BMW M3/M5 - Various generations
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The S54 is legendary but 333hp is modest today. Intake, header, and tune extract more from this high-revving masterpiece.",
  "coreUpgrades": ["headers", "exhaust-catback", "intake", "tune-street"],
  "enhancementUpgrades": ["coilovers-track", "brake-pads-track", "oil-cooler"],
  "platformStrengths": ["S54 sounds INCREDIBLE - 9.3", "8,000 RPM redline", "Last hydraulic steering M3", "Future classic status"],
  "watchOuts": ["VANOS issues need attention", "Rod bearings on late cars", "Subframe mounting points crack"]
}'::jsonb WHERE slug = 'bmw-m3-e46';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The S65 V8 already sounds INCREDIBLE (9.5) and makes 414hp. At 3,704 lbs, suspension work helps maximize the chassis.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "platformStrengths": ["S65 V8 sounds LEGENDARY", "8,400 RPM redline", "Great chassis balance", "DCT is lightning fast"],
  "watchOuts": ["ROD BEARINGS - check annually", "Throttle actuators can fail", "SMG pumps expensive to replace"]
}'::jsonb WHERE slug = 'bmw-m3-e92';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The S55 twin-turbo responds incredibly to mods. Downpipe and tune = easy 500hp. Sound 5.7 is the weakness - exhaust helps.",
  "coreUpgrades": ["downpipe", "intercooler", "piggyback-tuner"],
  "enhancementUpgrades": ["exhaust-catback", "coilovers-track", "charge-pipe-upgrade"],
  "platformStrengths": ["S55 has massive tuning headroom", "Competition package is sorted", "Very capable on track"],
  "watchOuts": ["Crank hub issues (rare)", "Charge pipes crack", "Sound 5.7 - disappointing for an M car"]
}'::jsonb WHERE slug = 'bmw-m3-f80';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The N54 twin-turbo is a LEGEND. This is one of the most tunable engines BMW ever made - easy 450hp with bolt-ons.",
  "coreUpgrades": ["downpipe", "intercooler", "piggyback-tuner"],
  "enhancementUpgrades": ["intake", "exhaust-catback", "coilovers-track"],
  "platformStrengths": ["N54 is legendary tuning platform", "Limited production makes it collectible", "Compact RWD platform"],
  "watchOuts": ["Fuel injectors can fail", "HPFP issues on early cars", "Wastegate rattle common"]
}'::jsonb WHERE slug = 'bmw-1m-coupe-e82';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The S54 sounds fantastic (9.0) but 330hp could use more. Headers and exhaust maximize this high-revving NA inline-6.",
  "coreUpgrades": ["headers", "exhaust-catback", "intake", "tune-street"],
  "enhancementUpgrades": ["coilovers-track", "brake-pads-track", "oil-cooler"],
  "platformStrengths": ["S54 sounds incredible", "Short wheelbase is fun", "Coupe is rarer and more desirable"],
  "watchOuts": ["Same VANOS/rod bearing concerns as E46 M3", "Convertible adds weight", "Values appreciating"]
}'::jsonb WHERE slug = 'bmw-z4m-e85-e86';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The S62 V8 sounds fantastic (9.0) with 394hp. At 3,968 lbs with 0.93G lateral, suspension work transforms this super sedan.",
  "coreUpgrades": ["coilovers-street", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "platformStrengths": ["S62 V8 sounds incredible", "Last hand-built M5 engine", "Comfortable daily driver"],
  "watchOuts": ["VANOS system needs attention", "Cooling system is aging", "Rod bearings should be inspected"]
}'::jsonb WHERE slug = 'bmw-m5-e39';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The S85 V10 already sounds INCREDIBLE (9.5). At 4,055 lbs, suspension work helps manage that mass through corners.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "big-brake-kit"],
  "platformStrengths": ["S85 V10 sounds LEGENDARY", "8,250 RPM redline", "SMG shifts in milliseconds"],
  "watchOuts": ["ROD BEARINGS - check annually", "SMG pump failures", "Throttle actuators expensive"]
}'::jsonb WHERE slug = 'bmw-m5-e60';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "At 575hp the S63 has massive power. At 4,370 lbs with 0.98G lateral, suspension work helps this super sedan corner better.",
  "coreUpgrades": ["coilovers-street", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["downpipe", "intercooler", "tune-street"],
  "platformStrengths": ["S63 twin-turbo V8 is potent", "Competition package is well sorted", "Practical super sedan"],
  "watchOuts": ["Very heavy at 4,370 lbs", "Rod bearings on high-mileage S63", "Complex electronics"]
}'::jsonb WHERE slug = 'bmw-m5-f10-competition';

-- ============================================================================
-- AUDI RS - Various models
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The 4.2L V8 already sounds FANTASTIC (9.0) with 450hp. At 4,045 lbs, suspension work helps manage that Quattro mass.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "big-brake-kit"],
  "platformStrengths": ["4.2L V8 sounds incredible", "Quattro AWD provides traction", "Beautiful coupe design"],
  "watchOuts": ["Heavy at 4,045 lbs", "Carbon buildup on direct injection", "S-tronic can be expensive"]
}'::jsonb WHERE slug = 'audi-rs5-b8';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 2.9L twin-turbo V6 responds well to mods but sound 5.9 is a weakness. Stage 2 tune adds significant power.",
  "coreUpgrades": ["downpipe", "intercooler", "tune-track"],
  "enhancementUpgrades": ["exhaust-catback", "coilovers-track", "intake"],
  "platformStrengths": ["Twin-turbo V6 has good tuning potential", "Quattro AWD provides traction", "Sportback option adds practicality"],
  "watchOuts": ["Sound 5.9 - nowhere near the B8 V8", "Heavy at 3,990 lbs", "Some early dual-clutch issues"]
}'::jsonb WHERE slug = 'audi-rs5-b9';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 2.5L turbo 5-cylinder ALREADY sounds incredible (9.0). Downpipe and tune add 80-100hp while keeping that signature warble.",
  "coreUpgrades": ["downpipe", "intercooler", "tune-track"],
  "enhancementUpgrades": ["intake", "exhaust-catback", "coilovers-track"],
  "platformStrengths": ["5-cylinder sounds AMAZING", "Quattro AWD provides traction", "Compact performance sedan"],
  "watchOuts": ["Haldex AWD is rear-biased only when needed", "Some carbon buildup issues"]
}'::jsonb WHERE slug IN ('audi-rs3-8v', 'audi-rs3-8y');

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 2.5L turbo 5-cylinder ALREADY sounds incredible (9.0). Downpipe and tune unlock serious power while keeping the warble.",
  "coreUpgrades": ["downpipe", "intercooler", "tune-track"],
  "enhancementUpgrades": ["intake", "exhaust-catback", "coilovers-track"],
  "platformStrengths": ["5-cylinder sounds AMAZING", "Quattro AWD in a compact coupe", "Great handling balance"],
  "watchOuts": ["HPFP can fail on early 8J", "Carbon buildup on direct injection"]
}'::jsonb WHERE slug IN ('audi-tt-rs-8j', 'audi-tt-rs-8s');

-- ============================================================================
-- ALFA ROMEO GIULIA QUADRIFOGLIO
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The 2.9L twin-turbo V6 makes 505hp and sounds good (8.3). At 3,800 lbs, suspension work maximizes this incredible chassis.",
  "coreUpgrades": ["coilovers-track", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["downpipe", "tune-street", "big-brake-kit"],
  "platformStrengths": ["Ferrari-derived twin-turbo V6", "One of the best steering feels available", "Track 8.9 - incredibly capable"],
  "watchOuts": ["Alfa reliability concerns are real", "Dealer network is limited", "Some electronic gremlins reported"]
}'::jsonb WHERE slug = 'alfa-romeo-giulia-quadrifoglio';

-- ============================================================================
-- Verify the updates
-- ============================================================================
-- Run this to verify all cars have proper recommendations:
-- SELECT slug, name, upgrade_recommendations->>'primaryFocus' as focus 
-- FROM cars 
-- WHERE upgrade_recommendations IS NOT NULL
-- ORDER BY upgrade_recommendations->>'primaryFocus', name;
