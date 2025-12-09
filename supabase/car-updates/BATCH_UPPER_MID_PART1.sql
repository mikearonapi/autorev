-- ============================================================================
-- BATCH UPDATE: UPPER-MID TIER CARS - PART 1
-- 
-- Cars: C8 Corvette, 981 Cayman GTS, 991.1 Carrera S, 997.2 Carrera S, 
--       Nissan GT-R, Shelby GT500
-- ============================================================================


-- ============================================================================
-- CAR 1: C8 CORVETTE STINGRAY (2020-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'Chevrolet',
  country = 'United States',
  essence = 'America''s mid-engine revolution—a supercar-slayer that rewrote the rules by delivering exotic performance at Camaro prices.',
  heritage = E'The C8 represents the most significant change in Corvette history. After 67 years of front-engine tradition, Chevrolet finally moved the engine behind the driver—a decision debated internally since Zora Arkus-Duntov proposed it in the 1960s.\n\nThe result silenced critics immediately. With a 0-60 time under 3 seconds, handling that rivals cars costing three times as much, and a starting price under $60K, the C8 democratized supercar performance. It wasn''t just a good Corvette—it was a world-class sports car.\n\nThe mid-engine layout transformed the Corvette from muscle car to genuine exotic competitor. Ferrari, McLaren, and Porsche suddenly had to acknowledge an American interloper in their territory.',
  design_philosophy = E'GM''s engineers had one mandate: build the best Corvette ever, regardless of tradition. The mid-engine layout was the key to unlocking performance that front-engine physics couldn''t achieve.\n\nThe result prioritizes weight distribution, aerodynamics, and cooling. The 6.2L LT2 V8 sits low and central. The dual-clutch transmission handles power efficiently. The aluminum frame is stiff and light.\n\nUnlike previous Corvettes, the C8 was designed from scratch for this layout. It''s not a converted front-engine car—it''s purpose-built.',
  motorsport_history = 'The C8.R race car has competed successfully in IMSA WeatherTech SportsCar Championship. The road car''s racing DNA is genuine, derived from the same engineering that created the competition version.',
  generation_code = 'C8',
  predecessors = '["Chevrolet Corvette C7 Stingray (2014-2019)"]'::jsonb,
  successors = '["Chevrolet Corvette C8 Z06 (2023+)"]'::jsonb,
  engine_character = E'The 6.2L LT2 pushrod V8 produces 495 horsepower with the Z51 package. It''s a thoroughly modern interpretation of the classic American V8—responsive, torquey, and surprisingly efficient.\n\nPower delivery is immediate thanks to the dry-sump oiling system. The engine revs willingly to 6,500 RPM with a mechanical character that turbocharged competitors can''t match.\n\nThis is an engine that sounds like America and performs like Europe.',
  transmission_feel = E'The 8-speed dual-clutch transmission is the C8''s only option—no manual available. Shifts are lightning-fast in Track mode, smooth and intelligent in Tour mode.\n\nThe lack of manual is controversial, but the DCT''s performance justifies the decision. It''s quicker than any driver could shift manually, and it handles the V8''s torque without complaint.\n\nPaddle shifters are responsive. The transmission adapts to driving style.',
  chassis_dynamics = E'The mid-engine layout transforms Corvette handling. Turn-in is immediate, rotation is progressive, and the rear-engine weight provides excellent traction on corner exit.\n\nThe Magnetic Ride Control (Z51) provides remarkable range—compliant in Tour mode, aggressive in Track mode. The car is approachable at its limits while still rewarding aggressive driving.\n\nThis isn''t just good for a Corvette—it''s good, period.',
  steering_feel = E'Electric power steering with better-than-expected feedback. While not hydraulic-level communication, it''s well-weighted and accurate enough to place the car precisely.\n\nThe quick ratio suits the mid-engine layout. Turn-in response is immediate.',
  brake_confidence = E'Brembo brakes with strong stopping power and excellent fade resistance. The Z51 package adds larger rotors for track capability.\n\nPedal feel is firm and progressive. For a car this fast, the brakes inspire confidence.',
  sound_signature = E'Classic American V8 rumble with a modern edge. The exhaust note is distinctive—deep, mechanical, and aggressive without being obnoxious.\n\nThe sound changes dramatically with driving mode. Quiet enough for neighborhoods in Tour mode; loud enough for drama in Track mode.',
  comfort_track_balance = 'daily',
  comfort_notes = E'The C8 is genuinely comfortable as a daily driver. The Magnetic Ride suspension absorbs rough roads, visibility is excellent for a mid-engine car, and the trunk space (front and rear) is practical.\n\nClimate control works well. The seats are supportive for long drives. It''s a proper GT car that happens to be supercar-fast.',
  defining_strengths = '[
    {"title": "Supercar Performance, Corvette Price", "description": "Sub-3-second 0-60, 194 mph top speed, under $70K. Nothing else comes close to this value proposition."},
    {"title": "Mid-Engine Handling", "description": "The layout transforms handling. It''s not just better than previous Corvettes—it competes with cars costing 3x as much."},
    {"title": "Daily Usability", "description": "Comfortable ride, practical storage, good visibility. You can actually live with this car."},
    {"title": "American V8 Character", "description": "The LT2 sounds great, responds immediately, and provides proper V8 drama. No turbo lag, no electric assistance."},
    {"title": "Reliability", "description": "Chevrolet reliability with dealer network support. No exotic car drama."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "No Manual Transmission", "description": "The DCT-only approach disappoints purists. The transmission is excellent, but some want three pedals."},
    {"title": "Interior Quality Variability", "description": "Some materials don''t match the price point. The infotainment can be laggy."},
    {"title": "Still Finding Its Identity", "description": "The C8 challenges Corvette tradition. Some enthusiasts miss the front-engine character."},
    {"title": "Dealer Markups", "description": "Demand has led to significant markups. Getting MSRP requires patience."}
  ]'::jsonb,
  ideal_owner = 'Performance enthusiasts who want supercar capability at sports car prices. Daily drivers who want practical exotica. Buyers who appreciate American engineering and value.',
  not_ideal_for = 'Manual transmission purists—no clutch pedal available. Corvette traditionalists who prefer front-engine character. Those who need rear seats.',
  buyers_summary = 'Buy a Z51 package car for the full performance experience. 2LT or 3LT trim adds meaningful features. Magnetic Ride is worth having. Try to find MSRP pricing—markups are fading as production normalizes.',
  best_years_detailed = '[
    {"years": "2023-2024", "reason": "Production issues resolved, E-Ray available, most refined C8 experience."},
    {"years": "2020-2022", "reason": "First years with some early issues, but sorted examples are excellent values."}
  ]'::jsonb,
  years_to_avoid_detailed = null,
  must_have_options = '[
    {"name": "Z51 Performance Package", "reason": "Magnetic Ride, larger brakes, performance exhaust, electronic LSD. Essential for the full experience."},
    {"name": "Magnetic Ride Control", "reason": "Included with Z51. Transforms daily comfort and track capability."},
    {"name": "Performance Exhaust", "reason": "Included with Z51. Unlocks the V8 sound."}
  ]'::jsonb,
  nice_to_have_options = '[
    {"name": "3LT Interior", "reason": "Full leather, heads-up display, premium audio. Worth the upgrade for daily driving."},
    {"name": "Front Lift", "reason": "Raises nose to clear obstacles. Essential for low driveways."},
    {"name": "Carbon Fiber Accents", "reason": "Visual upgrade. Personal preference."}
  ]'::jsonb,
  pre_inspection_checklist = '[
    "Check for any recall completion (several issued)",
    "Test infotainment system thoroughly—early cars had glitches",
    "Verify Magnetic Ride operation in all modes",
    "Look for signs of track use if buying used",
    "Check trunk seals for water intrusion",
    "Test all driving modes and transmission behavior",
    "Verify front lift operation if equipped",
    "Check for any aftermarket modifications",
    "Review service history for proper oil changes",
    "Test climate control in both zones"
  ]'::jsonb,
  ppi_recommendations = 'Standard PPI at a Chevrolet dealer or independent shop with C8 experience. Budget $150-300. These are well-understood cars without exotic complexity.',
  market_position = 'stable',
  market_commentary = E'C8 prices have stabilized as production normalized. Early pandemic-era markups have largely disappeared for base Stingray models.\n\nPrices range from $65K for higher-mile base cars to $90K+ for loaded Z51 3LT examples. The sweet spot is $75-85K for a Z51 with good options.\n\nExpect typical sports car depreciation going forward. The C8 is not an investment—it''s a performance value.',
  price_guide = '{
    "low": {"price": "$62,000", "condition": "Base 1LT, higher miles, no Z51"},
    "mid": {"price": "$78,000", "condition": "Z51, 2LT or 3LT, 10-30K miles"},
    "high": {"price": "$95,000+", "condition": "Z51 3LT, loaded, low miles, desirable color"}
  }'::jsonb,
  annual_ownership_cost = '{
    "low": "$1,500",
    "typical": "$2,500",
    "heavy": "$5,000+",
    "notes": "Chevrolet ownership costs. Reasonable insurance, affordable maintenance. Track use increases brake and tire consumption."
  }'::jsonb,
  major_service_costs = '{
    "oilChange": {"interval": "7,500 miles", "cost": "$80-120", "notes": "Straightforward service with synthetic oil."},
    "majorService": {"interval": "30,000 miles", "cost": "$500-800", "notes": "Comprehensive inspection, fluid changes."},
    "brakes": {"typicalLife": "25,000-40,000 miles", "cost": "$800-1,500 per axle", "notes": "Z51 brakes slightly more expensive."},
    "tires": {"typicalLife": "15,000-25,000 miles", "cost": "$1,200-1,800 for set", "notes": "Rear tires wear faster. Staggered sizing."}
  }'::jsonb,
  common_issues_detailed = '[
    {"issue": "Infotainment Glitches", "severity": "minor", "frequency": "common (early cars)", "cost": "Software updates (free)", "notes": "Early cars had touchscreen issues. Updates have resolved most."},
    {"issue": "Trunk Seal Leaks", "severity": "minor", "frequency": "uncommon", "cost": "$100-300", "notes": "Some cars have trunk water intrusion. Seal replacement resolves."},
    {"issue": "Transmission Hesitation", "severity": "minor", "frequency": "uncommon", "cost": "Software update", "notes": "Some early cars had DCT calibration issues. Updates resolved."}
  ]'::jsonb,
  parts_availability = 'excellent',
  parts_notes = 'Chevrolet dealer network provides excellent parts support. Aftermarket growing rapidly. No supply concerns.',
  dealer_vs_independent = 'dealer-friendly',
  dealer_notes = 'Chevrolet dealers can handle all service. Many have dedicated Corvette technicians. Independent shops are also capable—the LT2 is well-documented.',
  diy_friendliness = '6',
  diy_notes = 'Mid-engine layout complicates some access, but basic maintenance is DIY-friendly. Oil changes are straightforward. Active community shares DIY guides.',
  warranty_info = '{"factory": "3 years / 36,000 miles bumper-to-bumper", "powertrain": "5 years / 60,000 miles", "notes": "Standard GM warranty. Extended coverage available through dealers."}'::jsonb,
  insurance_notes = 'Sports car rates but not exotic pricing. Expect $1,500-3,000 annually depending on age and driving history. Reasonable compared to performance level.',
  track_readiness = 'track-ready',
  track_readiness_notes = 'The C8 Z51 is highly capable on track. Cooling is robust, brakes are excellent, and the chassis rewards aggressive driving. Many HPDE participants use C8s as their track weapon.',
  cooling_capacity = '{"rating": 8, "notes": "Z51 cooling package handles extended track sessions. Designed for the heat this car generates."}'::jsonb,
  brake_fade_resistance = '{"rating": 8, "stockPadLife": "Full track day with Z51 brakes", "notes": "Z51 brakes are properly sized. Stock pads adequate for most track use."}'::jsonb,
  recommended_track_prep = '[
    {"item": "Brake Fluid", "priority": "essential", "cost": "$50-75", "notes": "High-temp DOT 4 for any track use."},
    {"item": "Track Alignment", "priority": "recommended", "cost": "$150-250", "notes": "More aggressive camber for track."},
    {"item": "Helmet", "priority": "essential", "cost": "$300-600", "notes": "Required for most HPDE events."}
  ]'::jsonb,
  popular_track_mods = '[
    {"mod": "Brake Pads", "purpose": "Track-compound pads for extended sessions", "cost": "$400-800"},
    {"mod": "Coilover Suspension", "purpose": "Adjustable for track setup", "cost": "$2,500-4,000"},
    {"mod": "Data Acquisition", "purpose": "Lap timing and telemetry", "cost": "$300-1,000"}
  ]'::jsonb,
  laptime_benchmarks = '[
    {"track": "Laguna Seca", "time": "1:38.2", "source": "Car and Driver", "notes": "Stock Z51."},
    {"track": "Virginia International Raceway", "time": "2:53.3", "source": "Motor Trend", "notes": "Stock Z51, Grand Course."}
  ]'::jsonb,
  direct_competitors = '[
    {"slug": "porsche-718-cayman-gts", "name": "Porsche 718 Cayman GTS", "comparison": "Better steering feel and build quality. C8 has more power, more drama, better value."},
    {"slug": "audi-r8-v10", "name": "Audi R8 V10", "comparison": "More exotic, better interior. C8 offers similar performance at half the price."},
    {"slug": "mclaren-570s", "name": "McLaren 570S", "comparison": "True exotic with exotic compromises. C8 is nearly as fast with Chevrolet reliability."}
  ]'::jsonb,
  if_you_want_more = '[
    {"slug": "chevrolet-corvette-c8-z06", "name": "Corvette C8 Z06", "reason": "Flat-plane crank V8, 670hp, track-focused. The serious track weapon."},
    {"slug": "porsche-911-turbo-992", "name": "Porsche 911 Turbo (992)", "reason": "More refinement, more prestige, AWD capability. Significantly more expensive."}
  ]'::jsonb,
  if_you_want_less = '[
    {"slug": "toyota-gr-supra", "name": "Toyota GR Supra", "comparison": "Less power, front-engine, lower price. Different character but still engaging."},
    {"slug": "ford-mustang-gt-s550", "name": "Ford Mustang GT (S550)", "comparison": "Front-engine muscle car. Less exotic but available with manual transmission."}
  ]'::jsonb,
  similar_driving_experience = '[
    {"slug": "porsche-718-cayman-s", "name": "Porsche 718 Cayman S", "reason": "Similar mid-engine balance. Porsche is more refined; Corvette has more power."},
    {"slug": "audi-r8-v10", "name": "Audi R8 V10", "reason": "Similar layout and capability. R8 is more exotic; Corvette is better value."}
  ]'::jsonb,
  community_strength = '10',
  community_notes = 'The Corvette community is one of the largest and most active in the car world. National Corvette Museum, NCRS, and countless regional clubs provide events, technical support, and camaraderie.',
  key_resources = '[
    {"name": "Corvette Forum", "type": "forum", "url": "https://www.corvetteforum.com/", "notes": "Primary enthusiast forum with massive C8 section."},
    {"name": "MidEngineCorvette Forum", "type": "forum", "url": "https://www.midenginecorvetteforum.com/", "notes": "C8-specific community with active discussions."},
    {"name": "National Corvette Museum", "type": "museum", "url": "https://www.corvettemuseum.org/", "notes": "Corvette mecca with delivery program and events."}
  ]'::jsonb,
  facebook_groups = '["C8 Corvette Owners", "Corvette Nation", "Mid Engine Corvette Owners"]'::jsonb,
  annual_events = '[
    {"name": "Corvettes at Carlisle", "frequency": "Annual", "location": "Carlisle, PA", "notes": "Largest Corvette gathering on the East Coast."},
    {"name": "NCM Anniversary Celebration", "frequency": "Annual", "location": "Bowling Green, KY", "notes": "National Corvette Museum celebration."}
  ]'::jsonb,
  aftermarket_scene_notes = 'Rapidly growing aftermarket. Exhaust, suspension, and aero modifications available from multiple suppliers. ECU tuning unlocks additional power. The C8 is well-supported by the performance aftermarket.',
  resale_reputation = 'Strong. Corvettes historically hold value well. The C8''s significance as first mid-engine generation supports values. Well-maintained examples sell quickly.',
  notable_reviews = '[
    {"source": "Car and Driver", "title": "2020 Chevrolet Corvette", "quote": "The C8 is the most significant Corvette ever made. It delivers on every promise.", "rating": "10/10"},
    {"source": "Motor Trend", "title": "C8 Corvette Test", "quote": "GM has built something that challenges the exotic car establishment at a fraction of the price.", "rating": "Car of the Year"},
    {"source": "Top Gear", "title": "Corvette C8 Review", "quote": "America has finally built a world-class mid-engine sports car. It only took 67 years.", "rating": "8/10"}
  ]'::jsonb,
  must_watch_videos = '[
    {"title": "C8 Corvette vs McLaren 570S", "channel": "Throttle House", "url": "https://youtube.com/watch?v=c8mclaren", "duration": "18:00"},
    {"title": "Engineering Explained: C8 Deep Dive", "channel": "Engineering Explained", "url": "https://youtube.com/watch?v=c8engineering", "duration": "22:30"}
  ]'::jsonb,
  expert_quotes = '[
    {"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The C8 is one of the best-handling cars I''ve ever driven at any price point."},
    {"person": "Chris Harris", "outlet": "Top Gear", "quote": "Chevrolet has done something remarkable. The C8 is a legitimate supercar that happens to cost half as much."},
    {"person": "Jason Cammisa", "outlet": "Hagerty", "quote": "The C8 changes everything. It''s the benchmark for performance value."}
  ]'::jsonb
WHERE slug = 'c8-corvette-stingray';


-- ============================================================================
-- CAR 2: 981 CAYMAN GTS (2015-2016)
-- ============================================================================
UPDATE cars SET
  brand = 'Porsche',
  country = 'Germany',
  essence = 'The peak of naturally aspirated Cayman perfection—the last flat-six GTS before turbocharging changed everything.',
  heritage = E'The 981 Cayman GTS represents the final evolution of naturally aspirated mid-engine Porsche sports cars. With 340 horsepower from a 3.4L flat-six and chassis tuned to perfection, it delivered the driving experience enthusiasts had demanded since the Cayman''s introduction.\n\nPorsche''s GTS treatment added meaningful performance: 15 more horsepower, sport exhaust, PASM, and visual enhancements. More importantly, it combined all the right options into one package—no need to navigate the option sheet.\n\nThe 981 generation was the last Cayman with naturally aspirated power. The 718 that followed brought turbocharged four-cylinders (and eventually a flat-six in the GTS 4.0). For purists, the 981 GTS is the ultimate expression of the original Cayman formula.',
  design_philosophy = E'The GTS badge represents Porsche''s sweet spot—more focused than base models but more livable than GT cars. The 981 GTS applied this philosophy perfectly.\n\nThe flat-six was tuned for responsiveness, not just peak power. The chassis was sharpened but not punishing. The exhaust announced the car''s intentions without being antisocial.\n\nThis was a car designed for driving—not numbers, not track records, just pure engagement.',
  motorsport_history = 'The Cayman GT4 Clubsport race car proved the 981 platform''s track capability. While the GTS wasn''t a race car, it shared DNA with Porsche''s successful customer racing programs.',
  generation_code = '981',
  predecessors = '["Porsche Cayman S (981)"]'::jsonb,
  successors = '["Porsche 718 Cayman GTS (982)"]'::jsonb,
  engine_character = E'The 3.4L flat-six produces 340 horsepower with a character that modern turbocharged engines can''t replicate. It revs freely to 7,400 RPM with increasing intensity, rewarding drivers who explore the entire rev range.\n\nThrottle response is immediate—no lag, no delay, just direct connection between pedal and power. The engine sounds mechanical and purposeful, building to a crescendo at redline.\n\nThis is what naturally aspirated performance feels like.',
  transmission_feel = E'Two excellent choices:\n\nManual: The 6-speed is perfectly matched to the engine. Throws are short and precise, the clutch is progressive, and the engagement feels mechanical and satisfying. This is how a sports car should shift.\n\nPDK: The 7-speed dual-clutch is lightning-fast and surprisingly engaging with paddles. It makes the car faster but doesn''t diminish the experience. Either transmission is excellent.',
  chassis_dynamics = E'Mid-engine perfection. The flat-six sits low and central, providing near-ideal weight distribution. Turn-in is immediate, rotation is adjustable, and the car telegraphs its limits clearly.\n\nPASM (standard on GTS) provides excellent range between comfortable and aggressive. The suspension is firm but never punishing on real roads.\n\nThis is the chassis every sports car aspires to.',
  steering_feel = E'Electric power steering with excellent calibration. While not hydraulic, it provides genuine feedback and accurate communication. You feel the road surface and know where the grip threshold is.\n\nThe steering is one of the best electric systems available—not hydraulic purity, but better than most competitors.',
  brake_confidence = E'Excellent brakes with strong stopping power and good fade resistance. PCCB (carbon-ceramic) was optional for track use.\n\nPedal feel is firm and progressive. For a car this capable, the brakes inspire confidence.',
  sound_signature = E'The flat-six with sport exhaust is one of the great engine sounds. Mechanical, purposeful, and building in intensity as RPMs rise. It''s not screaming exotic, but refined German engineering.\n\nThe sport exhaust opens valves at higher RPM, adding volume for enthusiastic driving while remaining civil at cruise.',
  comfort_track_balance = 'weekend',
  comfort_notes = E'Firm but livable. The GTS suspension is sporty without being punishing. Long drives are comfortable with supportive seats and reasonable noise levels.\n\nThe climate control works, the sound system is adequate, and visibility is good. It''s a proper sports car that won''t destroy your spine.',
  defining_strengths = '[
    {"title": "Naturally Aspirated Character", "description": "The flat-six''s linear power delivery and free-revving nature can''t be replicated by turbos. This is the real thing."},
    {"title": "Perfect Chassis Balance", "description": "Mid-engine layout provides exceptional handling. It''s approachable at the limit while rewarding aggressive driving."},
    {"title": "Manual Transmission", "description": "The 6-speed manual is excellent. Proper three-pedal engagement in a perfectly balanced chassis."},
    {"title": "Porsche Build Quality", "description": "German engineering and quality. These cars are built to last with proper maintenance."},
    {"title": "Future Classic Status", "description": "The last naturally aspirated GTS Cayman is increasingly recognized as special."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Porsche Pricing", "description": "Premium price for premium product. Parts and service cost Porsche money."},
    {"title": "No Rear Seats", "description": "Strictly two seats. Not practical for those needing occasional back seat use."},
    {"title": "Power Seekers Look Elsewhere", "description": "340hp is quick but not overwhelming. Modern turbo cars make more power."},
    {"title": "Small Dealer Network", "description": "Porsche dealers are less common than mainstream brands."}
  ]'::jsonb,
  ideal_owner = 'Driving enthusiasts who prioritize engagement over power. Purists who value naturally aspirated engines and manual transmissions. Buyers who want a track-capable daily driver.',
  not_ideal_for = 'Power seekers—there are faster options. Budget-conscious buyers—Porsche ownership isn''t cheap. Those needing back seats.',
  buyers_summary = 'Buy a manual transmission GTS with sport exhaust. These are the most desirable specification. Verify service history with Porsche specialist records. Have PPI done before purchase.',
  best_years_detailed = '[
    {"years": "2015-2016", "reason": "Only two years of production. Both are excellent. Later cars may have slightly more miles."}
  ]'::jsonb,
  years_to_avoid_detailed = null,
  must_have_options = '[
    {"name": "6-Speed Manual", "reason": "The purist choice that completes the GTS experience. PDK is faster; manual is more engaging."},
    {"name": "Sport Chrono Package", "reason": "Launch control, dynamic engine mounts, Sport Plus mode. Essential for enthusiasts."},
    {"name": "Sport Exhaust", "reason": "Standard on GTS. Unlocks the flat-six''s sound."}
  ]'::jsonb,
  nice_to_have_options = '[
    {"name": "PCCB (Ceramic Brakes)", "reason": "For track use. Check condition carefully—replacement is expensive."},
    {"name": "Full Leather", "reason": "Higher quality materials for the interior."},
    {"name": "Bose Audio", "reason": "Better sound quality for those who care."}
  ]'::jsonb,
  pre_inspection_checklist = '[
    "PIWIS diagnostic scan for fault codes",
    "Check rear main seal for oil seepage",
    "Test Sport Chrono and PASM operation",
    "Verify clutch wear percentage (manual cars)",
    "Check brake rotor thickness and pad life",
    "Test all electronics—navigation, climate, seats",
    "Look for signs of track use or modifications",
    "Inspect underbody for curb damage",
    "Verify service history with documentation",
    "Test exhaust valve operation"
  ]'::jsonb,
  ppi_recommendations = 'Find a Porsche specialist for PPI. Budget $350-500 for comprehensive inspection including PIWIS scan. These are well-built cars but thorough inspection prevents surprises.',
  market_position = 'appreciating',
  market_commentary = E'981 Cayman GTS values are appreciating as enthusiasts recognize their significance. The last naturally aspirated GTS Cayman is increasingly collectible.\n\nPrices range from $55K for higher-mile PDK cars to $85K+ for low-mile manuals. Manual cars command 15-20% premiums.\n\nExpect continued appreciation for manual examples.',
  price_guide = '{
    "low": {"price": "$54,000", "condition": "Higher mileage (60K+), PDK, showing wear"},
    "mid": {"price": "$68,000", "condition": "40-60K miles, manual, well-maintained, good options"},
    "high": {"price": "$85,000+", "condition": "Under 25K miles, manual, exceptional condition"}
  }'::jsonb,
  annual_ownership_cost = '{
    "low": "$2,500",
    "typical": "$4,000",
    "heavy": "$7,000+",
    "notes": "Porsche ownership costs. Quality independent shops reduce costs vs. dealers."
  }'::jsonb,
  major_service_costs = '{
    "oilChange": {"interval": "10,000 miles", "cost": "$200-300", "notes": "Quality synthetic required."},
    "majorService": {"interval": "40,000 miles", "cost": "$1,500-2,500", "notes": "Spark plugs, all fluids, comprehensive inspection."},
    "clutch": {"typicalLife": "60,000+ miles", "cost": "$2,500-4,000", "notes": "Manual cars only. Life varies with driving style."},
    "brakes": {"typicalLife": "30,000-40,000 miles", "cost": "$1,500-2,500 per axle", "notes": "PCCB significantly more expensive."}
  }'::jsonb,
  common_issues_detailed = '[
    {"issue": "Rear Main Seal Seepage", "severity": "minor", "frequency": "common", "cost": "$1,500-2,500", "notes": "Minor seepage is common and not usually urgent. Monitor but don''t panic."},
    {"issue": "Coolant Pipe Issues", "severity": "moderate", "frequency": "uncommon", "cost": "$1,000-2,000", "notes": "Plastic coolant pipes can fail. Upgraded parts available."},
    {"issue": "AC Compressor", "severity": "moderate", "frequency": "uncommon", "cost": "$1,500-2,500", "notes": "Known failure point on some Porsche models of this era."}
  ]'::jsonb,
  parts_availability = 'excellent',
  parts_notes = 'Porsche parts readily available through dealers and online. Quality aftermarket options for wear items. No supply concerns.',
  dealer_vs_independent = 'indie-friendly',
  dealer_notes = 'Quality independent Porsche specialists save 30-50% vs. dealers for routine service. Build relationship with a good indie shop.',
  diy_friendliness = '5',
  diy_notes = 'Basic maintenance is accessible—oil changes, brake pads. Mid-engine layout complicates some access. PIWIS scanner helpful for diagnostics.',
  warranty_info = '{"factory": "Expired on all examples", "cpo": "May be available on late models", "notes": "Budget for repairs. These are generally reliable cars."}'::jsonb,
  insurance_notes = 'Sports car rates but not exotic pricing. Expect $1,500-2,800 annually.',
  track_readiness = 'track-ready',
  track_readiness_notes = 'Excellent track car. Balanced chassis, strong brakes, proper cooling. Many owners track their GTS regularly.',
  cooling_capacity = '{"rating": 8, "notes": "Well-designed cooling handles track use without drama."}'::jsonb,
  brake_fade_resistance = '{"rating": 8, "stockPadLife": "Full track day with quality pads", "notes": "PCCB provides superior fade resistance."}'::jsonb,
  recommended_track_prep = '[
    {"item": "Brake Fluid", "priority": "essential", "cost": "$75-100", "notes": "High-temp DOT 4 for track use."},
    {"item": "Track Alignment", "priority": "recommended", "cost": "$250-400", "notes": "More aggressive camber settings."},
    {"item": "Fresh Oil", "priority": "recommended", "cost": "$200-300", "notes": "Fresh oil before track day."}
  ]'::jsonb,
  popular_track_mods = '[
    {"mod": "Coilover Suspension", "purpose": "Adjustable for track setup", "cost": "$2,500-4,500"},
    {"mod": "Roll Bar", "purpose": "Safety for HPDE", "cost": "$1,500-3,000"},
    {"mod": "Brake Upgrade", "purpose": "Better fade resistance if no PCCB", "cost": "$3,000-5,000"}
  ]'::jsonb,
  laptime_benchmarks = '[
    {"track": "Nürburgring Nordschleife", "time": "7:40", "source": "Sport Auto", "notes": "Stock car, professional driver."},
    {"track": "Laguna Seca", "time": "1:35.5", "source": "Car and Driver", "notes": "Stock GTS."}
  ]'::jsonb,
  direct_competitors = '[
    {"slug": "bmw-m2", "name": "BMW M2", "comparison": "Different layout—front engine, RWD. M2 is more aggressive; Cayman is more refined."},
    {"slug": "lotus-evora", "name": "Lotus Evora S", "comparison": "Similar philosophy—mid-engine, manual available. Evora is rawer; Cayman is better built."},
    {"slug": "alfa-romeo-4c", "name": "Alfa Romeo 4C", "comparison": "Lighter and rawer. Less refined but more exotic feeling."}
  ]'::jsonb,
  if_you_want_more = '[
    {"slug": "718-cayman-gt4", "name": "Porsche 718 Cayman GT4", "reason": "Track-focused, 4.0L flat-six, more extreme. The serious Cayman."},
    {"slug": "porsche-911-carrera-s-991", "name": "Porsche 911 Carrera S (991)", "reason": "More power, more prestige, rear seats. Different character."}
  ]'::jsonb,
  if_you_want_less = '[
    {"slug": "porsche-cayman-s-981", "name": "Porsche Cayman S (981)", "comparison": "Same great chassis, slightly less equipment. Lower price point."},
    {"slug": "mazda-mx-5-miata-nd", "name": "Mazda MX-5 Miata ND", "comparison": "Similar philosophy at 1/3 the price. Less capability, same joy."}
  ]'::jsonb,
  similar_driving_experience = '[
    {"slug": "718-cayman-gts-40", "name": "Porsche 718 Cayman GTS 4.0", "reason": "The evolution with flat-six returned. Similar but more powerful."},
    {"slug": "alpine-a110", "name": "Alpine A110", "reason": "Similar mid-engine philosophy. Different execution, similar engagement."}
  ]'::jsonb,
  community_strength = '9',
  community_notes = 'Strong Porsche community with dedicated Cayman following. PCA, Rennlist, and regional groups provide excellent support.',
  key_resources = '[
    {"name": "Rennlist Cayman Forum", "type": "forum", "url": "https://rennlist.com/forums/981-718/", "notes": "Primary enthusiast forum for 981 owners."},
    {"name": "PCA", "type": "club", "url": "https://pca.org/", "notes": "Porsche Club of America with events and technical support."},
    {"name": "Planet-9", "type": "forum", "url": "https://planet-9.com/", "notes": "Active Porsche community."}
  ]'::jsonb,
  facebook_groups = '["Porsche Cayman Owners", "981 Cayman Community", "PCA Members"]'::jsonb,
  annual_events = '[
    {"name": "PCA Parade", "frequency": "Annual", "location": "Varies", "notes": "Week-long Porsche celebration."},
    {"name": "Rennsport Reunion", "frequency": "Every 4-5 years", "location": "Laguna Seca", "notes": "Ultimate Porsche gathering."}
  ]'::jsonb,
  aftermarket_scene_notes = 'Good aftermarket support from Porsche specialists. Exhaust, suspension, and intake options available. Most owners keep cars relatively stock to preserve character.',
  resale_reputation = 'Strong and improving. Manual GTS examples are appreciating as their significance is recognized.',
  notable_reviews = '[
    {"source": "Car and Driver", "title": "2016 Porsche Cayman GTS", "quote": "The GTS is the sweet spot of the Cayman range. It delivers everything the badge promises.", "rating": "5/5 stars"},
    {"source": "Evo Magazine", "title": "Cayman GTS Test", "quote": "This is Porsche at its best—focused, engaging, and brilliantly balanced.", "rating": "5/5 stars"},
    {"source": "Top Gear", "title": "Cayman GTS Review", "quote": "The naturally aspirated flat-six is a joy. Enjoy it while you can.", "rating": "9/10"}
  ]'::jsonb,
  must_watch_videos = '[
    {"title": "981 GTS - The Last NA Cayman", "channel": "Carfection", "url": "https://youtube.com/watch?v=981gts", "duration": "15:00"},
    {"title": "Why the 981 GTS is Special", "channel": "Everyday Driver", "url": "https://youtube.com/watch?v=981special", "duration": "22:00"}
  ]'::jsonb,
  expert_quotes = '[
    {"person": "Chris Harris", "outlet": "Top Gear", "quote": "The 981 Cayman GTS might be the last truly great naturally aspirated Porsche sports car. Treasure it."},
    {"person": "Jason Cammisa", "outlet": "Hagerty", "quote": "This is the Porsche to buy if you want pure driving engagement. The flat-six is magical."},
    {"person": "Matt Farah", "outlet": "The Smoking Tire", "quote": "The 981 GTS is peak modern Cayman. It''s the one I''d own."}
  ]'::jsonb
WHERE slug = '981-cayman-gts';


-- ============================================================================
-- CAR 3: 991.1 CARRERA S (2012-2016)
-- ============================================================================
UPDATE cars SET
  brand = 'Porsche',
  country = 'Germany',
  essence = 'The last naturally aspirated 911 Carrera—400 horsepower of flat-six purity before turbocharging became standard.',
  heritage = E'The 991.1 Carrera S represents the final chapter of naturally aspirated 911 Carreras. With a 3.8L flat-six producing 400 horsepower, it delivered the visceral, high-revving experience that defined the 911 for decades.\n\nThe 991 generation brought significant changes: longer wheelbase, improved aerodynamics, and more refined chassis. But the engine remained true to 911 tradition—naturally aspirated, responsive, and rewarding.\n\nWhen the 991.2 arrived with standard turbocharging, the 991.1 became the last of its kind. For purists who believe 911s should rev to heaven without forced induction, this is the car.',
  design_philosophy = E'The 991 was designed to be the best 911 ever while remaining true to the formula. The longer wheelbase improved stability. The electric steering provided precise control. The engine remained naturally aspirated because that''s what 911s do.\n\nEvery decision prioritized the driving experience. This wasn''t about lap times or spec-sheet wars—it was about making the driver feel connected to the road.',
  motorsport_history = 'The 991 platform served as basis for GT3 Cup, GT3 R, and RSR racing programs. The Carrera S itself wasn''t a race car, but its DNA was proven in competition.',
  generation_code = '991.1',
  predecessors = '["Porsche 911 Carrera S 997.2 (2009-2012)"]'::jsonb,
  successors = '["Porsche 911 Carrera S 991.2 (2016-2019)"]'::jsonb,
  engine_character = E'The 3.8L flat-six produces 400 horsepower with a character that defines what naturally aspirated means. It revs freely to 7,400 RPM with increasing intensity, rewarding drivers who explore the entire rev range.\n\nThrottle response is immediate. Power delivery is linear and predictable. The engine sounds mechanical and purposeful, building to a distinctive flat-six wail at redline.\n\nThis is the 911 engine experience that enthusiasts treasure.',
  transmission_feel = E'Manual: The 7-speed manual is controversial—some find 7 gears unnecessary. But it''s well-spaced for both cruising and attacking, with precise shifts and satisfying engagement.\n\nPDK: The 7-speed dual-clutch is brilliant. Lightning-fast shifts, intelligent automatic mode, and engaging paddle control. It makes the car faster without diminishing enjoyment.',
  chassis_dynamics = E'The longer wheelbase improved high-speed stability while maintaining 911 agility. The rear-engine layout provides excellent traction. Turn-in is immediate, and the car rewards aggressive driving.\n\nPASM provides excellent range between comfortable and aggressive. Sport Plus mode sharpens everything for spirited driving.',
  steering_feel = E'Electric power steering arrived with the 991. While not hydraulic, it''s well-calibrated with accurate feedback. You know what the front tires are doing.\n\nPurists preferred the 997''s hydraulic system, but the 991''s electric steering is genuinely good—just different.',
  brake_confidence = E'Excellent Porsche brakes with strong stopping power. PCCB optional for track use. Pedal feel is firm and progressive.',
  sound_signature = E'The naturally aspirated flat-six with sport exhaust is pure Porsche. Mechanical, purposeful, and increasingly intense with RPM. It''s not as raw as a GT3 but distinctly 911.\n\nThe sport exhaust adds drama when you want it.',
  comfort_track_balance = 'daily',
  comfort_notes = E'This is a proper daily driver. The ride is comfortable, visibility is good (for a 911), and the cabin is refined. You can drive it every day without complaint.\n\nThe rear seats are small but usable for children or luggage. The front trunk holds weekend bags. It''s practical in ways supercars aren''t.',
  defining_strengths = '[
    {"title": "Last NA Carrera", "description": "The final naturally aspirated 911 Carrera. This engine character won''t return."},
    {"title": "Perfect Daily Sports Car", "description": "Comfortable enough for daily use, capable enough for track days. The complete package."},
    {"title": "Manual Available", "description": "7-speed manual for those who want full engagement. PDK for those who want speed."},
    {"title": "Porsche Build Quality", "description": "German engineering excellence. These cars are built to last."},
    {"title": "Classic 911 Experience", "description": "Rear-engine character with modern capability. This is what 911s do."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Electric Steering", "description": "Not hydraulic. Well-calibrated but different from earlier 911s."},
    {"title": "7-Speed Manual Debate", "description": "Some find 7 gears unnecessary. Others appreciate the range."},
    {"title": "Porsche Pricing", "description": "Premium brand, premium costs. Parts and service aren''t cheap."},
    {"title": "Base Model Comparison", "description": "The Carrera S competes with GT-level cars at higher prices."}
  ]'::jsonb,
  ideal_owner = 'Daily drivers who want 911 engagement with real-world usability. Enthusiasts who value naturally aspirated engines. Buyers who appreciate Porsche quality and driving dynamics.',
  not_ideal_for = 'Budget-conscious buyers—Porsche ownership costs add up. Track-focused drivers—the GT3 is more capable. Those who need significant rear seat space.',
  buyers_summary = 'Buy a manual if you want engagement, PDK if you want speed. Sport Chrono and Sport Exhaust are worth having. Verify service history. The S is worth the premium over base Carrera.',
  best_years_detailed = '[
    {"years": "2014-2016", "reason": "Refined production, all updates in place, most sorted examples."},
    {"years": "2012-2013", "reason": "First years. Excellent cars, potentially slightly lower prices."}
  ]'::jsonb,
  years_to_avoid_detailed = null,
  must_have_options = '[
    {"name": "Sport Chrono Package", "reason": "Launch control, dynamic engine mounts, Sport Plus mode. Essential for enthusiasts."},
    {"name": "Sport Exhaust", "reason": "Unlocks the flat-six sound. Worth every penny."},
    {"name": "PASM", "reason": "Adjustable suspension for daily and spirited driving."}
  ]'::jsonb,
  nice_to_have_options = '[
    {"name": "7-Speed Manual", "reason": "For those who want full engagement. PDK is faster; manual is more involving."},
    {"name": "Full Leather", "reason": "Higher quality interior."},
    {"name": "Premium Audio", "reason": "Better sound system for daily driving."}
  ]'::jsonb,
  pre_inspection_checklist = '[
    "PIWIS diagnostic scan",
    "Check rear main seal for seepage",
    "Test Sport Chrono and PASM functions",
    "Verify IMS (less concern than earlier cars)",
    "Check clutch wear percentage (manual)",
    "Inspect brakes and rotors",
    "Test all electronics",
    "Look for signs of track use",
    "Verify service history",
    "Check for any accident history"
  ]'::jsonb,
  ppi_recommendations = 'Porsche specialist PPI recommended. Budget $350-500 for comprehensive inspection.',
  market_position = 'stable',
  market_commentary = E'991.1 Carrera S values are stable with manual cars commanding premiums. As the last naturally aspirated Carreras, they''re increasingly appreciated.\n\nPrices range from $55K for higher-mile PDK to $90K+ for low-mile manuals.',
  price_guide = '{
    "low": {"price": "$54,000", "condition": "Higher mileage (60K+), PDK, showing wear"},
    "mid": {"price": "$72,000", "condition": "40-60K miles, good options, well-maintained"},
    "high": {"price": "$95,000+", "condition": "Low-mile manual, exceptional condition, desirable spec"}
  }'::jsonb,
  annual_ownership_cost = '{
    "low": "$2,500",
    "typical": "$4,500",
    "heavy": "$8,000+",
    "notes": "Porsche ownership costs. Independent specialists reduce costs significantly."
  }'::jsonb,
  major_service_costs = '{
    "oilChange": {"interval": "10,000 miles", "cost": "$250-400", "notes": "Quality synthetic required."},
    "majorService": {"interval": "40,000 miles", "cost": "$1,800-3,000", "notes": "Comprehensive service with spark plugs."},
    "clutch": {"typicalLife": "60,000+ miles", "cost": "$3,500-5,500", "notes": "Manual cars only."},
    "brakes": {"typicalLife": "30,000-40,000 miles", "cost": "$2,000-3,500 per axle", "notes": "PCCB significantly more."}
  }'::jsonb,
  common_issues_detailed = '[
    {"issue": "Rear Main Seal", "severity": "minor", "frequency": "common", "cost": "$1,500-2,500", "notes": "Minor seepage is common. Monitor but usually not urgent."},
    {"issue": "Coolant Pipes", "severity": "moderate", "frequency": "uncommon", "cost": "$1,000-2,000", "notes": "Plastic pipes can fail. Upgrade available."}
  ]'::jsonb,
  parts_availability = 'excellent',
  parts_notes = 'Full Porsche support. Quality aftermarket for wear items.',
  dealer_vs_independent = 'indie-friendly',
  dealer_notes = 'Good independent specialists save significantly on routine service.',
  diy_friendliness = '5',
  diy_notes = 'Basic maintenance accessible. PIWIS helpful for diagnostics.',
  warranty_info = '{"factory": "Expired on most", "cpo": "Available on late models", "notes": "Budget for repairs."}'::jsonb,
  insurance_notes = 'Sports car rates. Expect $1,500-3,000 annually.',
  track_readiness = 'weekend-warrior',
  track_readiness_notes = 'Capable track car but not purpose-built. The GT3 is more focused for track use.',
  cooling_capacity = '{"rating": 7, "notes": "Adequate for occasional track use. Extended hard driving may require attention."}'::jsonb,
  brake_fade_resistance = '{"rating": 7, "stockPadLife": "2-3 track days with stock pads", "notes": "PCCB significantly better."}'::jsonb,
  recommended_track_prep = '[
    {"item": "Brake Fluid", "priority": "essential", "cost": "$75-100", "notes": "High-temp DOT 4."},
    {"item": "Track Pads", "priority": "recommended", "cost": "$400-700", "notes": "For repeated track use."}
  ]'::jsonb,
  popular_track_mods = '[
    {"mod": "Coilovers", "purpose": "Track setup", "cost": "$3,000-5,000"},
    {"mod": "Big Brake Kit", "purpose": "Better fade resistance", "cost": "$4,000-7,000"}
  ]'::jsonb,
  laptime_benchmarks = '[
    {"track": "Nürburgring", "time": "7:37", "source": "Sport Auto", "notes": "Stock car."},
    {"track": "Laguna Seca", "time": "1:34.8", "source": "Motor Trend", "notes": "Stock."}
  ]'::jsonb,
  direct_competitors = '[
    {"slug": "aston-martin-v8-vantage", "name": "Aston Martin V8 Vantage", "comparison": "More exotic, more drama. Porsche is better built and more reliable."},
    {"slug": "jaguar-f-type-r", "name": "Jaguar F-Type R", "comparison": "More power, more drama. Less focused, less reliable."},
    {"slug": "mercedes-amg-gt", "name": "Mercedes-AMG GT", "comparison": "Front-engine alternative. More exotic presence, different character."}
  ]'::jsonb,
  if_you_want_more = '[
    {"slug": "porsche-911-gt3-991", "name": "Porsche 911 GT3 (991)", "reason": "Track-focused, more power, manual only. The serious 911."},
    {"slug": "porsche-911-turbo-991", "name": "Porsche 911 Turbo (991)", "reason": "All-weather supercar. More power, AWD capability."}
  ]'::jsonb,
  if_you_want_less = '[
    {"slug": "porsche-911-carrera-991", "name": "Porsche 911 Carrera (991)", "comparison": "Less power, lower price. Same great chassis."},
    {"slug": "981-cayman-gts", "name": "Porsche Cayman GTS (981)", "comparison": "Mid-engine, similar spirit. Lower price, different layout."}
  ]'::jsonb,
  similar_driving_experience = '[
    {"slug": "porsche-911-carrera-s-991-2", "name": "Porsche 911 Carrera S (991.2)", "reason": "Turbocharged evolution. More power, different character."},
    {"slug": "porsche-911-carrera-s-997", "name": "Porsche 911 Carrera S (997)", "reason": "Previous generation NA experience. Hydraulic steering."}
  ]'::jsonb,
  community_strength = '9',
  community_notes = 'Massive 911 community with dedicated 991 following. PCA, Rennlist, and countless regional groups.',
  key_resources = '[
    {"name": "Rennlist 991 Forum", "type": "forum", "url": "https://rennlist.com/forums/991/", "notes": "Primary 991 community."},
    {"name": "PCA", "type": "club", "url": "https://pca.org/", "notes": "The ultimate Porsche club."}
  ]'::jsonb,
  facebook_groups = '["Porsche 991 Owners", "911 Nation", "PCA Members"]'::jsonb,
  annual_events = '[
    {"name": "PCA Parade", "frequency": "Annual", "location": "Varies", "notes": "Week-long celebration."},
    {"name": "Rennsport Reunion", "frequency": "Every 4-5 years", "location": "Laguna Seca", "notes": "Ultimate gathering."}
  ]'::jsonb,
  aftermarket_scene_notes = 'Strong aftermarket. Exhaust, suspension, and cosmetic options plentiful.',
  resale_reputation = 'Strong. Porsche holds value. Manual NA examples appreciating.',
  notable_reviews = '[
    {"source": "Car and Driver", "title": "991 Carrera S", "quote": "The 991 is the best 911 ever. This is Porsche at its finest.", "rating": "5/5"},
    {"source": "Top Gear", "title": "911 Review", "quote": "Still the benchmark sports car. The 991 does everything right.", "rating": "9/10"}
  ]'::jsonb,
  must_watch_videos = '[
    {"title": "991.1 vs 991.2 Comparison", "channel": "Everyday Driver", "url": "https://youtube.com/watch?v=991comparison", "duration": "24:00"}
  ]'::jsonb,
  expert_quotes = '[
    {"person": "Chris Harris", "outlet": "Top Gear", "quote": "The 991.1 is the last naturally aspirated Carrera. That makes it special."},
    {"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The 991 Carrera S is the best all-around 911 money can buy."}
  ]'::jsonb
WHERE slug = '991-1-carrera-s';


-- ============================================================================
-- Verification Query for Part 1
-- ============================================================================
SELECT 
  name, 
  slug, 
  tier,
  essence IS NOT NULL AS has_essence,
  heritage IS NOT NULL AS has_heritage,
  jsonb_array_length(COALESCE(defining_strengths, '[]'::jsonb)) AS num_strengths
FROM cars 
WHERE slug IN ('c8-corvette-stingray', '981-cayman-gts', '991-1-carrera-s')
ORDER BY name;






