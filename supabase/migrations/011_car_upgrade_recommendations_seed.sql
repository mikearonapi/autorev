-- ============================================================================
-- Seed Data: Car-Specific Upgrade Recommendations
-- 
-- This populates the upgrade_recommendations JSONB column for all cars.
-- Each car gets curated recommendations based on its specific needs.
-- ============================================================================

-- ============================================================================
-- PORSCHE
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "The 4.0L flat-6 runs hot during sustained track use. Oil cooler is essential before pushing hard on track.",
  "coreUpgrades": ["oil-cooler", "brake-pads-track", "brake-fluid-lines"],
  "enhancementUpgrades": ["coilovers-track", "big-brake-kit", "tires-track"],
  "platformStrengths": ["GT3-derived 4.0L flat-6 engine", "Excellent chassis balance", "Track-focused from factory"],
  "watchOuts": ["Oil consumption normal up to 1qt/1000mi during break-in", "Rear wing adds drag at high speed"]
}'::jsonb WHERE slug = '718-cayman-gt4';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The GTS 4.0 is the sweet spot Cayman. Suspension upgrades unlock its full potential on twisty roads.",
  "coreUpgrades": ["coilovers-street", "sway-bars", "tires-performance"],
  "enhancementUpgrades": ["exhaust-catback", "brake-pads-street", "oil-cooler"],
  "platformStrengths": ["394hp naturally aspirated flat-6", "Perfect weight distribution", "PASM suspension is excellent base"],
  "watchOuts": ["Same oil consumption notes as GT4", "Sport Chrono package recommended for best throttle maps"]
}'::jsonb WHERE slug = '718-cayman-gts-40';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 3.4L flat-6 responds beautifully to intake, exhaust, and tune. Headers unlock serious top-end gains.",
  "coreUpgrades": ["intake", "exhaust-catback", "headers", "tune-street"],
  "enhancementUpgrades": ["coilovers-street", "brake-pads-street", "oil-cooler"],
  "platformStrengths": ["Last naturally aspirated flat-6 Cayman generation", "Excellent analog driving feel", "Responds well to bolt-ons"],
  "watchOuts": ["Coolant pipes can leak on higher mileage", "AOS (Air Oil Separator) issues possible"]
}'::jsonb WHERE slug = '981-cayman-gts';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 325hp flat-6 wakes up nicely with basic bolt-ons. Intake, exhaust, and tune add 30-40hp.",
  "coreUpgrades": ["intake", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["lowering-springs", "brake-pads-street", "coilovers-street"],
  "platformStrengths": ["Balanced mid-engine chassis", "Reliable 3.4L flat-6", "Great entry to Porsche ownership"],
  "watchOuts": ["Same as 981 GTS - coolant pipes and AOS", "Sport Chrono recommended for track use"]
}'::jsonb WHERE slug = '981-cayman-s';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 987.2 responds incredibly well to headers and exhaust. This is where NA flat-6 tuning shines.",
  "coreUpgrades": ["headers", "exhaust-catback", "intake", "tune-street"],
  "enhancementUpgrades": ["coilovers-street", "brake-pads-track", "oil-cooler"],
  "platformStrengths": ["Last of the simpler analog Caymans", "IMS bearing NOT an issue on 987.2", "Headers provide significant NA power gains"],
  "watchOuts": ["Bore scoring possible on high-mileage engines", "Direct injection runs hotter - oil cooler important"]
}'::jsonb WHERE slug = '987-2-cayman-s';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The 400hp 3.8L is already strong. Focus on suspension and brakes to match the power with cornering ability.",
  "coreUpgrades": ["coilovers-street", "sway-bars", "brake-pads-track"],
  "enhancementUpgrades": ["exhaust-catback", "tune-street", "oil-cooler"],
  "platformStrengths": ["Last naturally aspirated 911 Carrera", "Excellent 7-speed manual", "PDK is incredibly fast"],
  "watchOuts": ["Some reports of bore scoring on high-mileage engines", "Sports exhaust is a must-have factory option"]
}'::jsonb WHERE slug = '991-1-carrera-s';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "sound",
  "focusReason": "The 997.2 is peak analog 911. Headers and full exhaust transform the already great sound into something magical.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["coilovers-street", "brake-pads-track", "oil-cooler"],
  "platformStrengths": ["Many consider this the best modern 911 for driving feel", "Mezger-adjacent engine - very reliable", "Manual gearbox is sublime"],
  "watchOuts": ["Rear main seal can leak on older examples"]
}'::jsonb WHERE slug = '997-2-carrera-s';

-- ============================================================================
-- CORVETTE
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "The DCT runs hot during track use. Transmission cooler is essential before any serious track time.",
  "coreUpgrades": ["trans-cooler", "oil-cooler", "brake-pads-track"],
  "enhancementUpgrades": ["exhaust-catback", "tune-street", "coilovers-track"],
  "platformStrengths": ["Mid-engine layout with supercar performance", "DCT is incredibly fast", "Z51 package adds essential cooling"],
  "watchOuts": ["DCT overheating during sustained track use", "Early engine tick from AFM - disable with tune", "Front trunk limits intake options"]
}'::jsonb WHERE slug = 'c8-corvette-stingray';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The LT1 in the Z06 chassis is begging for headers and a supercharger. Incredible bang-for-buck power potential.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-track"],
  "enhancementUpgrades": ["supercharger-centrifugal", "oil-cooler", "brake-pads-track"],
  "platformStrengths": ["Z06 wide-body and brakes with NA engine", "Manual trans handles up to 700hp", "Already has dry sump from Z06"],
  "watchOuts": ["Z07 carbon ceramic brakes are expensive to replace"]
}'::jsonb WHERE slug = 'c7-corvette-grand-sport';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "COOLING. COOLING. COOLING. The LT4 is heat-limited on track. Upgrade everything that transfers heat.",
  "coreUpgrades": ["heat-exchanger-sc", "oil-cooler", "trans-cooler"],
  "enhancementUpgrades": ["pulley-tune-sc", "brake-pads-track", "coilovers-track"],
  "platformStrengths": ["650hp supercharged V8 from factory", "Magnetic ride is excellent", "Z07 package adds significant downforce"],
  "watchOuts": ["Overheating is a documented problem on track", "Supercharger intercooler can be overwhelmed", "Rear diff cooler is undersized from factory"]
}'::jsonb WHERE slug = 'c7-corvette-z06';

-- ============================================================================
-- FORD MUSTANG
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "At 760hp, the GT500 generates massive heat. Heat exchanger upgrade is almost mandatory for any spirited driving.",
  "coreUpgrades": ["heat-exchanger-sc", "oil-cooler", "brake-pads-track"],
  "enhancementUpgrades": ["pulley-tune-sc", "trans-cooler", "coilovers-track"],
  "platformStrengths": ["760hp supercharged V8", "DCT handles power well", "Carbon fiber track pack is very effective"],
  "watchOuts": ["Heat soak affects power significantly", "DCT can be harsh in city driving"]
}'::jsonb WHERE slug = 'shelby-gt500';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "sound",
  "focusReason": "The Voodoo flat-plane V8 screams with full exhaust. Headers are essential to unlock the top-end power and that incredible sound.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-track"],
  "enhancementUpgrades": ["oil-cooler", "trans-cooler", "brake-pads-track"],
  "platformStrengths": ["8,250 RPM redline", "Flat-plane crank V8 sound is incredible", "MagneRide suspension is excellent", "Tremec TR-3160 manual is robust"],
  "watchOuts": ["Voodoo runs hot - cooling is important", "Early engines had oil consumption issues (mostly resolved)"]
}'::jsonb WHERE slug = 'shelby-gt350';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The Coyote 5.0 loves bolt-ons. Intake, exhaust, headers, and tune can add 50-70hp with excellent reliability.",
  "coreUpgrades": ["intake", "headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["supercharger-roots", "oil-cooler", "brake-pads-track"],
  "platformStrengths": ["PP2 adds MagneRide, Brembo brakes, aggressive alignment", "Coyote 5.0 is incredibly responsive to mods", "10R80 auto is excellent for drag racing"],
  "watchOuts": ["MT-82 manual transmission can have synchro issues under high power"]
}'::jsonb WHERE slug = 'mustang-gt-pp2';

-- ============================================================================
-- CHEVROLET CAMARO
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "Same LT4 as C7 Z06 means same heat concerns. Heat exchanger and oil cooler are priorities.",
  "coreUpgrades": ["heat-exchanger-sc", "oil-cooler", "brake-pads-track"],
  "enhancementUpgrades": ["pulley-tune-sc", "trans-cooler", "coilovers-track"],
  "platformStrengths": ["650hp LT4 supercharged V8", "ZL1 1LE has DSSV dampers for track", "MRC suspension on base ZL1 is excellent"],
  "watchOuts": ["Same heat concerns as C7 Z06", "Visibility is limited - challenging for track awareness"]
}'::jsonb WHERE slug = 'camaro-zl1';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The LT1 responds excellently to bolt-ons. Headers and exhaust are the key power adders for this platform.",
  "coreUpgrades": ["headers", "exhaust-catback", "intake", "tune-track"],
  "enhancementUpgrades": ["supercharger-centrifugal", "oil-cooler", "coilovers-track"],
  "platformStrengths": ["1LE package is track-ready from factory", "Includes coolers for engine oil and differential", "Magnetic Ride available"],
  "watchOuts": ["LT1 runs hot under sustained track use - oil cooler helps"]
}'::jsonb WHERE slug = 'camaro-ss-1le';

-- ============================================================================
-- NISSAN
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "The GT-R generates massive heat. Transmission cooler is CRITICAL - the DCT is the weak point on track.",
  "coreUpgrades": ["trans-cooler", "intercooler", "oil-cooler"],
  "enhancementUpgrades": ["downpipe", "intake", "piggyback-tuner"],
  "platformStrengths": ["ATTESA E-TS AWD is incredibly capable", "VR38DETT responds incredibly to mods", "Hand-built engines with Takumi signature"],
  "watchOuts": ["Transmission heat is the main concern on track", "Early 2009-2011 transmissions had issues - largely resolved"]
}'::jsonb WHERE slug = 'nissan-gt-r';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The VQ37 has moderate tuning potential. Focus on suspension and brakes to maximize the chassis.",
  "coreUpgrades": ["coilovers-track", "brake-pads-track", "sway-bars"],
  "enhancementUpgrades": ["exhaust-catback", "intake", "tune-street"],
  "platformStrengths": ["NISMO package adds upgraded suspension, brakes, and LSD", "SynchroRev Match is a fun feature", "Reliable VQ platform"],
  "watchOuts": ["Oil gallery gaskets can fail on high mileage", "CSC (concentric slave cylinder) can fail"]
}'::jsonb WHERE slug = 'nissan-370z-nismo';

-- ============================================================================
-- BMW
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The S55 twin-turbo responds incredibly to tuning. JB4 or downpipe + tune can add 80-100hp easily.",
  "coreUpgrades": ["downpipe", "intercooler", "piggyback-tuner"],
  "enhancementUpgrades": ["intake", "exhaust-catback", "coilovers-track"],
  "platformStrengths": ["S55 engine shared with M3/M4", "Excellent chassis balance", "DCT is faster, manual more engaging"],
  "watchOuts": ["Crank hub issues on some S55 engines", "Charge pipe can crack under boost"]
}'::jsonb WHERE slug = 'bmw-m2-competition';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The S55 is a tuning monster. JB4 + downpipe = easy 500hp. Intercooler prevents heat soak.",
  "coreUpgrades": ["downpipe", "intercooler", "piggyback-tuner", "charge-pipe-upgrade"],
  "enhancementUpgrades": ["intake", "exhaust-catback", "oil-cooler"],
  "platformStrengths": ["Competition package adds firmer suspension", "Carbon roof lowers center of gravity", "GTS version has water injection"],
  "watchOuts": ["Crank hub issues (rare but documented)", "Charge pipes can crack", "Rod bearings should be inspected"]
}'::jsonb WHERE slug = 'bmw-m4-f82';

-- ============================================================================
-- TOYOTA / LEXUS
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The B58 responds incredibly to tuning. A JB4 or downpipe + tune adds 80-100hp with zero drama.",
  "coreUpgrades": ["downpipe", "piggyback-tuner", "intercooler"],
  "enhancementUpgrades": ["intake", "exhaust-catback", "coilovers-track"],
  "platformStrengths": ["B58 is a BMW engine with excellent tuning potential", "ZF8 automatic is bulletproof", "Chassis is very capable"],
  "watchOuts": ["Stock fuel pump is a limitation around 500hp", "Early cars had some electrical gremlins"]
}'::jsonb WHERE slug = 'toyota-gr-supra';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "sound",
  "focusReason": "The 5.0L 2UR-GSE V8 sounds incredible with exhaust work. Headers add power and enhance the LFA-derived exhaust note.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["coilovers-street", "brake-pads-street", "lowering-springs"],
  "platformStrengths": ["2UR-GSE 5.0L V8 is naturally aspirated perfection", "LFA-derived exhaust note", "Grand tourer comfort"],
  "watchOuts": ["Heavy for a sports car - best as GT", "10-speed automatic is smooth but not sporty"]
}'::jsonb WHERE slug = 'lexus-lc-500';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "sound",
  "focusReason": "The 5.0L V8 responds well to exhaust and headers. Tune optimizes throttle response for track use.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["coilovers-track", "brake-pads-track", "supercharger-centrifugal"],
  "platformStrengths": ["Track Edition adds carbon roof and torque vectoring", "V8 sounds excellent with exhaust", "RR Racing supercharger kits available"],
  "watchOuts": ["Heavier than M4/C63 competition", "Weight is the main limitation"]
}'::jsonb WHERE slug = 'lexus-rc-f';

-- ============================================================================
-- MERCEDES
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "sound",
  "focusReason": "The M156 6.2L V8 sounds incredible with headers and exhaust. This is one of the best sounding engines ever made.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["coilovers-track", "oil-cooler", "brake-pads-track"],
  "platformStrengths": ["Last hand-built NA AMG engine", "Black Series is the ultimate version", "MCT transmission improves shifts"],
  "watchOuts": ["Head bolt issues on early M156 engines (2008-2010)", "Cam adjuster bolts should be inspected"]
}'::jsonb WHERE slug = 'mercedes-c63-amg-w204';

-- ============================================================================
-- AUDI
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "sound",
  "focusReason": "The 4.2L FSI V8 sounds amazing with exhaust. Headers are expensive but add power and enhance the sound.",
  "coreUpgrades": ["exhaust-catback", "headers", "tune-street"],
  "enhancementUpgrades": ["coilovers-track", "brake-pads-track", "oil-cooler"],
  "platformStrengths": ["Shares platform with Gallardo", "Gated manual is most desirable", "4.2L FSI V8 makes 420hp"],
  "watchOuts": ["R-tronic can be jerky and expensive to service", "Carbon ceramic brakes expensive to replace"]
}'::jsonb WHERE slug = 'audi-r8-v8';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "braking",
  "focusReason": "The 5.2L V10 is incredible stock. Focus on brakes and cooling for track use - the engine needs little help.",
  "coreUpgrades": ["brake-pads-track", "brake-fluid-lines", "oil-cooler"],
  "enhancementUpgrades": ["coilovers-track", "exhaust-catback", "tune-street"],
  "platformStrengths": ["5.2L FSI V10 - Lamborghini derived", "Plus/Performance versions have 610hp", "S-tronic DCT is excellent"],
  "watchOuts": ["Carbon sigma rotors are fragile if overheated", "R-tronic (if equipped) requires careful operation"]
}'::jsonb WHERE slug = 'audi-r8-v10';

-- ============================================================================
-- LAMBORGHINI
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "braking",
  "focusReason": "The V10 is already incredible. Focus on brakes and cooling for track use. Exhaust enhances the exotic sound.",
  "coreUpgrades": ["brake-pads-track", "brake-fluid-lines", "oil-cooler"],
  "enhancementUpgrades": ["exhaust-catback", "coilovers-track", "tune-street"],
  "platformStrengths": ["Shares platform with R8", "LP560-4 and later have 5.2L V10", "Superleggera is the lightweight version"],
  "watchOuts": ["E-gear requires expensive clutch replacement", "Timing chains can be expensive to service"]
}'::jsonb WHERE slug = 'lamborghini-gallardo';

-- ============================================================================
-- LOTUS
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The AMG-sourced 2.0L turbo responds well to tuning. The Toyota V6 version has less tuning potential.",
  "coreUpgrades": ["intake", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["intercooler", "coilovers-track", "brake-pads-track"],
  "platformStrengths": ["AMG 2.0T has 400hp and more tuning potential", "Toyota V6 is more reliable long-term", "Last pure ICE Lotus"],
  "watchOuts": ["Early production had some quality issues", "Dealer network is limited"]
}'::jsonb WHERE slug = 'lotus-emira';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "The supercharged V6 runs hot on track. Focus on cooling and the supercharger pulley for easy power gains.",
  "coreUpgrades": ["oil-cooler", "pulley-tune-sc", "brake-pads-track"],
  "enhancementUpgrades": ["coilovers-track", "exhaust-catback", "tires-track"],
  "platformStrengths": ["Edelbrock supercharger from factory", "Toyota 2GR-FE V6 is incredibly reliable", "GT version is lighter than base"],
  "watchOuts": ["A/C can be weak in hot climates", "Parts availability can be challenging"]
}'::jsonb WHERE slug = 'lotus-evora-gt';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The supercharged V6 responds to basic mods. Pulley and tune add easy power while maintaining reliability.",
  "coreUpgrades": ["pulley-tune-sc", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["oil-cooler", "coilovers-track", "brake-pads-track"],
  "platformStrengths": ["Supercharged 2GR-FE makes 345hp", "Excellent weight distribution", "Manual is more desirable than IPS"],
  "watchOuts": ["IPS gearbox can be clunky"]
}'::jsonb WHERE slug = 'lotus-evora-s';

-- ============================================================================
-- DODGE
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "handling",
  "focusReason": "The 8.4L V10 makes massive power stock. Focus on chassis and brakes to handle that power on track.",
  "coreUpgrades": ["coilovers-track", "brake-pads-track", "sway-bars"],
  "enhancementUpgrades": ["headers", "exhaust-catback", "oil-cooler"],
  "platformStrengths": ["Gen 5 has 640hp 8.4L V10", "ACR is the ultimate track variant", "Manual only - Tremec TR6060"],
  "watchOuts": ["Early Vipers can be dangerous in inexperienced hands", "Heat management important due to engine size"]
}'::jsonb WHERE slug = 'dodge-viper';

-- ============================================================================
-- JAGUAR
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The supercharged 5.0L V8 responds to pulley and tune. Easy 650-700hp with supporting mods.",
  "coreUpgrades": ["pulley-tune-sc", "heat-exchanger-sc", "exhaust-catback"],
  "enhancementUpgrades": ["oil-cooler", "coilovers-track", "brake-pads-track"],
  "platformStrengths": ["AJ133 supercharged V8", "SVR version has 575hp", "ZF8 handles the power well"],
  "watchOuts": ["Electronic issues can occur", "Heat exchanger needs upgrading for sustained boost"]
}'::jsonb WHERE slug = 'jaguar-f-type-r';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "sound",
  "focusReason": "The supercharged V6 sounds incredible. Pulley and tune add easy power while enhancing the exhaust note.",
  "coreUpgrades": ["pulley-tune-sc", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["heat-exchanger-sc", "coilovers-street", "brake-pads-street"],
  "platformStrengths": ["380hp supercharged V6", "Manual available", "Lighter than V8 R"],
  "watchOuts": ["Same electronic concerns as F-Type R"]
}'::jsonb WHERE slug = 'jaguar-f-type-v6-s';

-- ============================================================================
-- ALFA ROMEO
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "cooling",
  "focusReason": "The 1750 turbo runs hot. Intercooler upgrade maintains power during track sessions.",
  "coreUpgrades": ["intercooler", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["coilovers-track", "brake-pads-track", "oil-cooler"],
  "platformStrengths": ["Carbon fiber monocoque - incredibly light", "TCT dual-clutch is quick", "Spider version has removable roof"],
  "watchOuts": ["Reliability can be questionable", "Dealer network limited", "Parts expensive", "No power steering - heavy at low speeds"]
}'::jsonb WHERE slug = 'alfa-romeo-4c';

-- ============================================================================
-- ASTON MARTIN
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "sound",
  "focusReason": "The 4.3/4.7L V8 sounds incredible. Headers and exhaust transform the character completely.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["coilovers-track", "brake-pads-track", "oil-cooler"],
  "platformStrengths": ["4.7L makes 420hp", "Manual is most desirable", "N420/S versions have 420-430hp"],
  "watchOuts": ["Sportshift is expensive to maintain", "Running costs are high"]
}'::jsonb WHERE slug = 'aston-martin-v8-vantage';

-- ============================================================================
-- MASERATI
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "sound",
  "focusReason": "The Ferrari-derived V8 sounds incredible. Exhaust and headers enhance the already fantastic sound.",
  "coreUpgrades": ["headers", "exhaust-catback", "tune-street"],
  "enhancementUpgrades": ["coilovers-track", "brake-pads-track", "oil-cooler"],
  "platformStrengths": ["Ferrari F136 V8 - 4.7L makes 454hp", "MC Stradale is the track version", "Incredible exhaust note"],
  "watchOuts": ["Expensive to maintain", "Electronics can be problematic", "Parts are expensive"]
}'::jsonb WHERE slug = 'maserati-granturismo';

-- ============================================================================
-- SUBARU
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The EJ257 responds incredibly to intake, downpipe, and tune. The essential STI power trio.",
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
  "focusReason": "The classic STI formula. Intake, downpipe, and tune wake up the EJ257 beautifully.",
  "coreUpgrades": ["intake", "downpipe", "exhaust-catback", "tune-track"],
  "enhancementUpgrades": ["intercooler", "oil-cooler", "coilovers-track"],
  "platformStrengths": ["2004 blob-eye, 2006 hawk-eye - iconic styling", "Many consider this the best STI generation", "DCCD system is excellent"],
  "watchOuts": ["Age-related issues more common", "Same engine concerns as newer STIs"]
}'::jsonb WHERE slug = 'subaru-wrx-sti-gd';

-- ============================================================================
-- MITSUBISHI
-- ============================================================================

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The legendary 4G63. Intake, exhaust, and boost controller can add 50-80hp easily. Tuning platform royalty.",
  "coreUpgrades": ["intake", "downpipe", "exhaust-catback", "tune-track"],
  "enhancementUpgrades": ["intercooler", "oil-cooler", "turbo-upgrade-existing"],
  "platformStrengths": ["4G63 2.0L turbo is legendary", "ACD and AYC are excellent", "Evo 8/9 MR have Bilstein suspension"],
  "watchOuts": ["Crankwalk on some 4G63 engines", "Transfer case can be fragile under high power"]
}'::jsonb WHERE slug = 'mitsubishi-lancer-evo-8-9';

UPDATE cars SET upgrade_recommendations = '{
  "primaryFocus": "power",
  "focusReason": "The 4B11T is responsive to mods. MIVEC provides good power across the rev range. More refined than 8/9.",
  "coreUpgrades": ["intake", "downpipe", "exhaust-catback", "tune-track"],
  "enhancementUpgrades": ["intercooler", "oil-cooler", "turbo-upgrade-existing"],
  "platformStrengths": ["S-AWC (Super All Wheel Control) is impressive", "SST dual-clutch available", "Final Edition highly collectible"],
  "watchOuts": ["SST can be fragile under high power", "Crankshaft thrust bearing wear reported", "4B11T weaker than 4G63 at extreme levels"]
}'::jsonb WHERE slug = 'mitsubishi-lancer-evo-x';

-- ============================================================================
-- Verify the update
-- ============================================================================
-- SELECT slug, upgrade_recommendations->>'primaryFocus' as focus FROM cars WHERE upgrade_recommendations IS NOT NULL;




















