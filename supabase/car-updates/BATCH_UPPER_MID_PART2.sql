-- ============================================================================
-- BATCH UPDATE: UPPER-MID TIER CARS - PART 2
-- 
-- Cars: 997.2 Carrera S, Nissan GT-R, Shelby GT500, Lotus Evora GT, 
--       Mazda RX-7 FD, Integra Type R
-- ============================================================================


-- ============================================================================
-- 997.2 CARRERA S (2009-2012)
-- ============================================================================
UPDATE cars SET
  brand = 'Porsche',
  country = 'Germany',
  essence = 'The sweet spot of analog 911s—the last Carrera S with hydraulic steering and a naturally aspirated flat-six.',
  heritage = E'The 997.2 Carrera S represents the peak of the "analog" 911 era. With hydraulic power steering, naturally aspirated flat-six, and classic 911 proportions, it delivered the driving experience that made the 911 legendary.\n\nThe 997.2 brought direct fuel injection (DFI) to the Carrera S, raising power to 385 horsepower while improving efficiency. More importantly, it retained the hydraulic steering that provided unmatched feedback.\n\nWhen the 991 arrived with electric steering, the 997 became the last of its kind. For those who believe steering feel is essential to the 911 experience, the 997.2 Carrera S is the benchmark.',
  design_philosophy = E'The 997 was designed as the evolution of the water-cooled 911—more refined, more capable, but true to the formula. The .2 update improved power delivery while maintaining the character that defined the model.\n\nHydraulic steering was never questioned. It was simply what 911s had. The communication it provided was integral to the experience.',
  generation_code = '997.2',
  predecessors = '["Porsche 911 Carrera S 997.1 (2005-2008)"]'::jsonb,
  successors = '["Porsche 911 Carrera S 991.1 (2012-2016)"]'::jsonb,
  engine_character = E'The 3.8L DFI flat-six produces 385 horsepower with direct fuel injection improving response and efficiency. The character is pure naturally aspirated—linear power delivery, free-revving to 7,500 RPM, immediate throttle response.\n\nThe flat-six wail is mechanical and purposeful. It rewards drivers who use the entire rev range.',
  transmission_feel = E'Manual: The 6-speed is excellent. Well-matched ratios, precise throws, satisfying engagement.\n\nPDK: The 7-speed dual-clutch is one of the best ever made. Fast shifts, intelligent logic, engaging with paddles.',
  chassis_dynamics = E'Classic 911 rear-engine balance. The shorter wheelbase compared to 991 makes it more playful—tail-happy drivers appreciate the character. Turn-in is immediate, rotation is adjustable.\n\nPASM provides range between comfortable and aggressive. The car telegraphs its limits clearly.',
  steering_feel = E'This is the 997.2''s superpower. Hydraulic steering provides communication that electric systems can''t match. You feel the road surface, tire loading, and grip levels through your fingertips.\n\nThe weight builds naturally. The feedback is constant. This is what steering should be.',
  brake_confidence = 'Excellent Porsche brakes. PCCB optional for track use.',
  sound_signature = E'The flat-six with sport exhaust is pure Porsche. Mechanical, intense at high RPM, distinctive wail.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Proper daily driver with usable rear seats, good visibility, and comfortable ride.',
  defining_strengths = '[
    {"title": "Hydraulic Steering", "description": "The last Carrera S with hydraulic steering. This level of feel won''t return."},
    {"title": "Naturally Aspirated", "description": "385hp flat-six with immediate response and intoxicating sound."},
    {"title": "Classic Proportions", "description": "Shorter wheelbase than 991. More playful character."},
    {"title": "Daily Usability", "description": "Comfortable, practical, reliable. A real GT car."},
    {"title": "Manual Available", "description": "6-speed manual for those who want engagement."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Age", "description": "Now 12-15 years old. Age-related maintenance is inevitable."},
    {"title": "Technology", "description": "Older infotainment and electronics compared to newer cars."},
    {"title": "IMS Concern Addressed", "description": "The 997.2 has improved IMS but concern still exists on some engines."}
  ]'::jsonb,
  ideal_owner = 'Drivers who prioritize steering feel above all else. Enthusiasts who want the last analog 911. Those who appreciate manual transmissions.',
  not_ideal_for = 'Technology seekers—it''s a 12+ year old car. Budget-conscious—Porsche ownership costs apply.',
  buyers_summary = 'Manual with Sport Chrono and Sport Exhaust is the spec to find. Verify IMS status. Have Porsche specialist PPI.',
  best_years_detailed = '[{"years": "2009-2012", "reason": "All 997.2 years are good. Later cars have more miles typically."}]'::jsonb,
  must_have_options = '[{"name": "Sport Chrono", "reason": "Essential features."},{"name": "Sport Exhaust", "reason": "Unlocks the sound."},{"name": "PASM", "reason": "Adjustable suspension."}]'::jsonb,
  price_guide = '{"low": {"price": "$52,000", "condition": "Higher mileage PDK"}, "mid": {"price": "$68,000", "condition": "40-60K miles, manual"}, "high": {"price": "$90,000+", "condition": "Low-mile manual, perfect condition"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,500", "typical": "$4,500", "heavy": "$8,000+", "notes": "Porsche ownership costs."}'::jsonb,
  common_issues_detailed = '[{"issue": "IMS Bearing", "severity": "major", "frequency": "uncommon", "cost": "$3,000-5,000", "notes": "Improved on 997.2 but worth verifying or upgrading."},{"issue": "Rear Main Seal", "severity": "minor", "frequency": "common", "cost": "$1,500-2,500", "notes": "Minor seepage normal."}]'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '9',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The 997 Carrera S is the benchmark sports car. The hydraulic steering is irreplaceable.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "If I could only have one 911, it would be a 997.2 Carrera S manual. The steering alone makes it special."}]'::jsonb
WHERE slug = '997-2-carrera-s';


-- ============================================================================
-- NISSAN GT-R R35 (2017-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'Nissan',
  country = 'Japan',
  essence = 'The PlayStation supercar made real—a twin-turbo technology marvel that democratized 600+ horsepower performance.',
  heritage = E'The R35 GT-R shocked the automotive world when it arrived in 2008. A $70K Japanese car that could embarrass $200K supercars in acceleration and lap times? Impossible—until Nissan proved it.\n\nThe secret was technology: a sophisticated all-wheel drive system, twin-turbo V6, and advanced launch control working together to produce numbers that shouldn''t have been possible at the price. The GT-R earned the nickname "Godzilla" for destroying everything in its path.\n\nThe 2017+ models represent the refined, mature GT-R. With 565+ horsepower standard (600+ in NISMO trim) and years of development, it remains a performance benchmark at its price point.',
  design_philosophy = E'The GT-R was designed as a supercar-killer that regular people could afford. Nissan threw every technological weapon at the problem: sophisticated AWD, dual-clutch transmission, active suspension.\n\nThe result was a car that could be driven fast by almost anyone. The computers compensate for skill deficits, making supercar lap times accessible to ordinary drivers.',
  motorsport_history = 'The GT-R has dominated Super GT racing in Japan and proven itself in global GT racing. The road car''s racing DNA is genuine.',
  generation_code = 'R35',
  predecessors = '["Nissan Skyline GT-R R34 (1999-2002)"]'::jsonb,
  successors = '["Nissan GT-R R36 (TBA)"]'::jsonb,
  engine_character = E'The 3.8L twin-turbo V6 (VR38DETT) produces 565-600+ horsepower depending on variant. Each engine is hand-built by a single "Takumi" craftsman.\n\nPower delivery is explosive. The turbos spool quickly, and the AWD puts every horsepower to the ground. It''s brutal, relentless acceleration that pins you to the seat.\n\nNot as emotional as a naturally aspirated engine, but devastatingly effective.',
  transmission_feel = E'The 6-speed dual-clutch (GR6) is purpose-built for the GT-R. Shifts are violent in R mode, smooth in Normal.\n\nNo manual option. The GT-R was designed around the DCT—it''s integral to the experience.\n\nEarly transmissions had reliability issues; 2017+ units are sorted.',
  chassis_dynamics = E'AWD provides incredible traction. The Attesa E-TS system distributes power front-to-rear dynamically, making the car accessible at speeds that would be terrifying in rear-drive.\n\nThe car is heavy (3,800+ lbs) but hides it well. Grip is enormous. The limits are very high.\n\nIt''s more GT car than scalpel—stable, planted, relentlessly quick.',
  steering_feel = 'Hydraulic-electric hybrid with reasonable feedback. Not the highlight—the steering serves the chassis rather than starring.',
  brake_confidence = 'Massive Brembo brakes with excellent stopping power. NISMO models have upgraded calipers.',
  sound_signature = 'Twin-turbo V6 with distinctive character. Not the most emotional sound, but purposeful. Turbo whistle and wastegate noises add drama.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Comfortable GT car. The suspension modes provide genuine range. Interior is dated but functional. Climate control works. You can daily drive a GT-R.',
  defining_strengths = '[
    {"title": "Supercar Performance", "description": "Sub-3-second 0-60, 195+ mph top speed. Numbers that embarrass cars costing twice as much."},
    {"title": "All-Weather Capability", "description": "AWD makes it usable in any conditions. Rain, cold—it just works."},
    {"title": "Accessible Speed", "description": "The technology makes anyone fast. Launch control does the work."},
    {"title": "Hand-Built Engine", "description": "Each VR38 is built by a single craftsman. Real craftsmanship at this price."},
    {"title": "Relative Value", "description": "This level of performance for under $150K is remarkable."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Dated Interior", "description": "The interior shows its 2008 origins. Technology has moved on."},
    {"title": "Weight", "description": "3,800+ pounds is heavy. The car hides it but physics apply."},
    {"title": "Transmission Costs", "description": "DCT service is expensive. Major repairs are very expensive."},
    {"title": "Character vs Computers", "description": "Some find it too digital. The electronics do a lot of work."}
  ]'::jsonb,
  ideal_owner = 'Speed seekers who want maximum performance per dollar. All-weather capability seekers. Technology appreciators who value what computers can achieve.',
  not_ideal_for = 'Analog driving purists—this is a computer-enhanced experience. Manual transmission fans—DCT only. Those who prioritize steering feel above all.',
  buyers_summary = 'Buy 2017+ for the latest updates. NISMO is most desirable but expensive. Verify transmission service history. Have GT-R specialist inspect.',
  best_years_detailed = '[{"years": "2017-2024", "reason": "Latest specification with all updates. 565hp base, refined chassis."},{"years": "2020-2024 NISMO", "reason": "600hp, upgraded everything. The ultimate R35."}]'::jsonb,
  must_have_options = '[{"name": "Premium Interior", "reason": "Better materials and features."},{"name": "Carbon Ceramic Brakes (NISMO)", "reason": "Essential for track use."}]'::jsonb,
  price_guide = '{"low": {"price": "$85,000", "condition": "Higher mileage 2017-2018, base"}, "mid": {"price": "$115,000", "condition": "Premium trim, 20-40K miles"}, "high": {"price": "$180,000+", "condition": "NISMO, low miles"}}'::jsonb,
  annual_ownership_cost = '{"low": "$3,000", "typical": "$6,000", "heavy": "$15,000+", "notes": "Transmission service is expensive. Budget for major components."}'::jsonb,
  common_issues_detailed = '[{"issue": "Transmission Service", "severity": "major", "frequency": "maintenance", "cost": "$3,500-5,000", "notes": "Required every 30K miles. Not optional."},{"issue": "Transmission Failure", "severity": "major", "frequency": "uncommon", "cost": "$15,000-25,000", "notes": "Rare on properly maintained cars but expensive when it happens."}]'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '8',
  notable_reviews = '[{"source": "Top Gear", "quote": "The GT-R is the great equalizer. It makes anyone fast.", "rating": "8/10"}]'::jsonb,
  expert_quotes = '[{"person": "Jeremy Clarkson", "outlet": "Top Gear", "quote": "The GT-R is a technical masterpiece. It''s not pretty, but my God it''s effective."}]'::jsonb
WHERE slug = 'nissan-gt-r';


-- ============================================================================
-- SHELBY GT500 (2020-2022)
-- ============================================================================
UPDATE cars SET
  brand = 'Ford',
  country = 'United States',
  essence = 'The most powerful street-legal Ford ever—760 horsepower of supercharged American fury in a surprisingly capable chassis.',
  heritage = E'The GT500 name returns to crown the S550 Mustang generation with extreme performance. With 760 horsepower from a supercharged 5.2L V8, it''s the most powerful production Ford ever.\n\nUnlike previous GT500s that were straight-line warriors, this version was developed with road course capability. The Tremec dual-clutch transmission, massive brakes, and sophisticated suspension made it genuinely track-capable.\n\nThe result is a Mustang that can embarrass supercars on a road course while maintaining drag strip dominance.',
  design_philosophy = 'Ford Performance designed the GT500 to compete everywhere—not just quarter miles. The DCT handles the power, the aero creates downforce, and the brakes can stop repeatedly.',
  generation_code = 'S550',
  predecessors = '["Ford Mustang Shelby GT500 (2013-2014)"]'::jsonb,
  successors = '["Ford Mustang Shelby GT500 (S650) - TBA"]'::jsonb,
  engine_character = E'The 5.2L Predator V8 with 2.65L supercharger produces 760 horsepower and 625 lb-ft of torque. It''s violent, immediate, and absolutely relentless.\n\nThe supercharger whine builds with boost. Full throttle is an event—the car launches with ferocity that few street cars can match.',
  transmission_feel = 'The Tremec 7-speed dual-clutch handles 760hp without complaint. Shifts are quick and aggressive. No manual option—the power exceeds what a manual could handle reliably.',
  chassis_dynamics = E'MagneRide suspension provides remarkable range. The car is genuinely capable on track—not just a drag strip special.\n\nWeight is significant (4,200+ lbs) but well-managed. The aero creates real downforce. It''s a GT car that happens to make supercar power.',
  steering_feel = 'Electric power steering adequate for the mission. Not the highlight, but competent.',
  brake_confidence = 'Massive Brembo brakes with six-piston front calipers. Excellent stopping power for the weight and speed involved.',
  sound_signature = 'Supercharged V8 thunder with blower whine. Aggressive, loud, distinctly American.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Firm but livable. Better than GT350 for daily use. Interior is Mustang-standard—good but not luxury.',
  defining_strengths = '[
    {"title": "760 Horsepower", "description": "Most powerful street-legal Ford ever. Brutal acceleration."},
    {"title": "Track Capable", "description": "Unlike previous GT500s, this one handles. Genuine road course ability."},
    {"title": "Relative Value", "description": "This level of power for under $100K MSRP is remarkable."},
    {"title": "Supercharger Sound", "description": "The blower whine adds drama to an already exciting experience."},
    {"title": "Carbon Fiber Track Pack", "description": "Available option adds serious capability."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "No Manual", "description": "DCT only. Purists are disappointed."},
    {"title": "Weight", "description": "4,200+ pounds is heavy. Physics apply."},
    {"title": "Dealer Markups", "description": "Demand led to significant markups. Finding MSRP was difficult."},
    {"title": "Thirsty", "description": "Expect poor fuel economy. This engine drinks."}
  ]'::jsonb,
  ideal_owner = 'Speed seekers who want maximum American muscle. Those who appreciate supercharger drama. Buyers who want track capability without a Porsche price tag.',
  not_ideal_for = 'Manual transmission purists. Daily drivers seeking efficiency. Those on tight budgets.',
  buyers_summary = 'Buy Carbon Fiber Track Pack for maximum capability. Verify no modifications or abuse. Check for dealer markup recovery in price.',
  best_years_detailed = '[{"years": "2020-2022", "reason": "All excellent. Later cars may have fewer miles."}]'::jsonb,
  must_have_options = '[{"name": "Carbon Fiber Track Pack", "reason": "Massive aero upgrades, adjustable strut tops, splitter wickers."},{"name": "Handling Package", "reason": "Enhanced cooling and suspension tuning."}]'::jsonb,
  price_guide = '{"low": {"price": "$68,000", "condition": "Higher mileage base, showing wear"}, "mid": {"price": "$82,000", "condition": "CFTP, 10-20K miles"}, "high": {"price": "$105,000+", "condition": "Low-mile CFTP, heritage edition"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$8,000+", "notes": "American car ownership costs. Tires and brakes add up."}'::jsonb,
  common_issues_detailed = '[{"issue": "Transmission Adaptation", "severity": "minor", "frequency": "common", "cost": "Software update", "notes": "Some cars needed DCT calibration updates."},{"issue": "Heat Soak", "severity": "minor", "frequency": "common", "cost": "Varies", "notes": "Track use reveals thermal limits."}]'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '9',
  notable_reviews = '[{"source": "Motor Trend", "quote": "The GT500 is the most capable Mustang ever made. It actually handles.", "rating": "9/10"}]'::jsonb,
  expert_quotes = '[{"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "Ford finally made a GT500 that can turn. This is a legitimate track car."}]'::jsonb
WHERE slug = 'shelby-gt500';


-- ============================================================================
-- LOTUS EVORA GT (2020-2021)
-- ============================================================================
UPDATE cars SET
  brand = 'Lotus',
  country = 'United Kingdom',
  essence = 'The final evolution of the Evora—supercharged Toyota V6, manual transmission, and Lotus handling in a car you can actually live with.',
  heritage = E'The Evora GT represents the ultimate development of Lotus'' only "proper" car since the Esprit. With a supercharged 3.5L Toyota V6 producing 416 horsepower and genuine everyday usability, it bridged the gap between exotic and practical.\n\nThe Evora was always underappreciated. While competitors focused on power and technology, Lotus stuck to its "simplify, add lightness" philosophy. The result was a car that prioritized driving engagement over spec-sheet stats.\n\nThe GT was the farewell model—the most powerful and refined Evora before the Emira took its place.',
  design_philosophy = 'Colin Chapman''s philosophy applied to a modern GT car. Light weight, hydraulic steering, driver-focused dynamics. The Evora GT proved Lotus could build something livable without losing its soul.',
  generation_code = 'Evora',
  predecessors = '["Lotus Evora 400", "Lotus Evora Sport 410"]'::jsonb,
  successors = '["Lotus Emira (2022+)"]'::jsonb,
  engine_character = E'The Toyota 2GR-FE with Edelbrock supercharger produces 416 horsepower. It''s responsive, reliable, and sounds good without being exotic.\n\nPower delivery is linear thanks to the supercharger. No turbo lag, just immediate response. It revs willingly and sounds mechanical.',
  transmission_feel = 'Manual only—a proper 6-speed with excellent shift feel. Throws are precise, clutch is manageable. This is the Lotus experience.',
  chassis_dynamics = E'Mid-engine perfection with Lotus magic. The Evora GT weighs under 3,100 pounds and handles like it. Turn-in is immediate, rotation is adjustable, feedback is constant.\n\nHydraulic steering provides communication that electronic systems can''t match.',
  steering_feel = 'Hydraulic power steering—Lotus'' calling card. The feedback is exceptional. You feel everything the front tires are doing.',
  brake_confidence = 'AP Racing brakes with excellent feel and fade resistance. Proper track-capable stoppers.',
  sound_signature = 'Supercharged V6 with Lotus exhaust. Not exotic, but purposeful. Better than the engine has any right to sound.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'More livable than any Lotus before it. Climate control works, the ride is tolerable, and there are actual back seats (small). Still a sports car, but usable.',
  defining_strengths = '[
    {"title": "Hydraulic Steering", "description": "The last Evora with hydraulic steering. Communication is exceptional."},
    {"title": "Toyota Reliability", "description": "Supercharged Toyota V6 is bulletproof. Exotic handling, mainstream reliability."},
    {"title": "Manual Only", "description": "No automatic option. Pure Lotus."},
    {"title": "Light Weight", "description": "Under 3,100 lbs means the 416hp feels like more."},
    {"title": "Usable Exotica", "description": "Back seats and cargo space make it genuinely practical."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Lotus Build Quality", "description": "Better than historic Lotus but still not German."},
    {"title": "Dealer Network", "description": "Lotus dealers are rare. Service requires planning."},
    {"title": "Depreciation Unknown", "description": "Values uncertain as successor takes over."},
    {"title": "Entry/Exit", "description": "Wide sills make getting in challenging."}
  ]'::jsonb,
  ideal_owner = 'Driving enthusiasts who prioritize engagement. Those who appreciate manual transmissions and hydraulic steering. Buyers willing to accept Lotus ownership challenges.',
  not_ideal_for = 'Those requiring mainstream dealer support. Comfort seekers. Badge-conscious buyers.',
  buyers_summary = 'Manual only. Verify service history carefully. Lotus specialist inspection essential. Low production makes them relatively rare.',
  best_years_detailed = '[{"years": "2020-2021", "reason": "Only years of GT production. Both excellent."}]'::jsonb,
  must_have_options = '[{"name": "Drivers Pack", "reason": "Sport suspension and enhanced dynamics."},{"name": "Carbon Fiber Components", "reason": "Weight reduction."}]'::jsonb,
  price_guide = '{"low": {"price": "$78,000", "condition": "Higher mileage"}, "mid": {"price": "$95,000", "condition": "15-25K miles, well-maintained"}, "high": {"price": "$120,000+", "condition": "Low miles, loaded"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$7,000+", "notes": "Toyota drivetrain is affordable. Lotus-specific parts cost more."}'::jsonb,
  common_issues_detailed = '[{"issue": "Minor Quality Issues", "severity": "minor", "frequency": "common", "cost": "Varies", "notes": "Trim rattles and fit issues common to Lotus."}]'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '7',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The Evora GT is the Lotus for people who actually want to use their car.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The Evora GT is what happens when Lotus builds something usable. It''s brilliant."}]'::jsonb
WHERE slug = 'lotus-evora-gt';


-- ============================================================================
-- MAZDA RX-7 FD3S (1992-2002)
-- ============================================================================
UPDATE cars SET
  brand = 'Mazda',
  country = 'Japan',
  essence = 'The pinnacle of rotary sports cars—a twin-turbo spinning triangle symphony wrapped in one of the most beautiful bodies ever designed.',
  heritage = E'The FD RX-7 is widely regarded as one of the most beautiful Japanese cars ever made. Designed with no straight lines, it looks like it''s moving while standing still. Under the hood was Mazda''s most advanced rotary engine: the twin-sequential turbocharged 13B-REW.\n\nThe rotary was lighter and smaller than piston engines, allowing a low center of gravity and near-perfect weight distribution. Combined with the sophisticated sequential turbo system, it delivered performance that rivaled cars costing twice as much.\n\nThe FD became a legend in tuner culture, proving that rotaries could make serious power. The 13B platform has been pushed to 700+ horsepower by dedicated builders.',
  design_philosophy = 'Mazda designed the FD with one goal: create the ultimate rotary sports car. Every decision prioritized the driving experience. The light, rev-happy engine. The balanced chassis. The stunning body that looks like sculpture.',
  motorsport_history = 'The FD RX-7 competed successfully in IMSA GT, Super GT, and countless privateer efforts worldwide. The rotary''s unique characteristics made it competitive despite displacement disadvantages.',
  generation_code = 'FD3S',
  predecessors = '["Mazda RX-7 FC (1985-1991)"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = E'The 13B-REW twin-turbo rotary is unlike any piston engine. It revs instantly, spins to 8,000 RPM, and produces power in a way that feels unique.\n\nThe sequential turbo system provides boost throughout the rev range. Low RPM uses a single turbo; high RPM brings in the second. The transition can be felt—it''s part of the character.\n\nThis engine rewards those who understand rotaries. Keep it hot, rev it high, and it sings.',
  transmission_feel = 'The 5-speed manual is well-matched to the engine. Short throws, direct engagement. Later cars got a 6-speed. Either is excellent.',
  chassis_dynamics = E'The FD weighs around 2,850 lbs with near-perfect 50:50 weight distribution. The front-mid engine layout creates exceptional balance.\n\nThe chassis is playful and communicative. It rotates willingly and rewards smooth inputs. The light weight makes it feel faster than the numbers suggest.',
  steering_feel = 'Hydraulic power steering with excellent feedback. The light front end means quick turn-in and responsive communication.',
  brake_confidence = 'Stock brakes are adequate for street use but fade with track abuse. Upgrades are common and well-documented.',
  sound_signature = E'The rotary has a distinctive, high-pitched wail that''s unlike anything else. At high RPM, it sounds like a turbine. The turbo adds whoosh and whistle.\n\nIt''s not a traditional sports car sound—it''s uniquely rotary.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Firm suspension and limited space make it best as a weekend car. The interior is dated but functional.',
  defining_strengths = '[
    {"title": "Unique Rotary Character", "description": "Nothing else feels or sounds like a rotary engine. It''s an experience unto itself."},
    {"title": "Timeless Design", "description": "The FD is one of the most beautiful cars ever made. It hasn''t aged."},
    {"title": "Lightweight Excellence", "description": "Under 2,900 lbs with perfect balance. It handles like it looks."},
    {"title": "Tuning Potential", "description": "The 13B platform can make serious power. 400+ hp is achievable."},
    {"title": "Cult Status", "description": "The FD has passionate following. Parts, knowledge, and community support exist."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Rotary Maintenance", "description": "Rotaries require understanding. Apex seals, oil consumption, and specific needs."},
    {"title": "Fuel Economy", "description": "Rotaries drink fuel. Expect 15-18 MPG at best."},
    {"title": "Age", "description": "All examples are 20+ years old. Finding unmolested cars is difficult."},
    {"title": "Parts Availability", "description": "Some parts are NLA or expensive. Rotary-specific components need specialists."}
  ]'::jsonb,
  ideal_owner = 'Enthusiasts who appreciate unique engineering. Those willing to learn rotary maintenance. Collectors who recognize the FD''s significance.',
  not_ideal_for = 'Reliability seekers—rotaries require attention. Those wanting modern conveniences. Budget buyers—good FDs are expensive.',
  buyers_summary = 'Buy the most original, best-documented example possible. Verify engine health with compression test. Have a rotary specialist inspect. Stock examples are increasingly valuable.',
  best_years_detailed = '[{"years": "1993-1995", "reason": "Best mechanical specification, desirable for collectors."},{"years": "1999 (Spirit R - Japan)", "reason": "Final limited edition with all improvements. Very rare."}]'::jsonb,
  must_have_options = '[{"name": "R1 or R2 Package", "reason": "Better suspension and equipment."},{"name": "Stock Engine", "reason": "Unmodified cars are increasingly valuable."}]'::jsonb,
  price_guide = '{"low": {"price": "$35,000", "condition": "Modified, needs work"}, "mid": {"price": "$55,000", "condition": "Stock, good condition, moderate miles"}, "high": {"price": "$85,000+", "condition": "Low-mile, completely stock, documented"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,500", "typical": "$5,000", "heavy": "$10,000+", "notes": "Rotary-specific costs. Budget for specialists and unique parts."}'::jsonb,
  common_issues_detailed = '[{"issue": "Apex Seal Wear", "severity": "major", "frequency": "common", "cost": "$3,000-6,000", "notes": "Rotary-specific. Compression testing reveals health."},{"issue": "Twin Turbo System", "severity": "moderate", "frequency": "common", "cost": "$2,000-4,000", "notes": "Sequential system can have issues. Single turbo conversions are common."},{"issue": "Cooling System Age", "severity": "moderate", "frequency": "common", "cost": "$500-1,500", "notes": "All rubber and plastic components need replacement."}]'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '9',
  notable_reviews = '[{"source": "Road & Track", "quote": "The FD RX-7 is one of the greatest sports cars ever made. The rotary is magic.", "rating": null}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The FD RX-7 is proof that different can be better. That rotary engine is something special."}]'::jsonb
WHERE slug = 'mazda-rx7-fd3s';


-- ============================================================================
-- ACURA INTEGRA TYPE R DC2 (1997-2001)
-- ============================================================================
UPDATE cars SET
  brand = 'Acura',
  country = 'Japan',
  essence = 'The front-wheel-drive benchmark—a high-revving B18C5 in a lightweight chassis that proved FWD can be genuinely engaging.',
  heritage = E'The Integra Type R brought Honda''s racing DNA to America. With a hand-ported B18C5 engine revving to 8,400 RPM, the lightest shell possible, and a limited-slip differential, it set the standard for front-wheel-drive performance.\n\nHonda''s Red Badge "Type R" treatment was legendary in Japan—hand-assembly, race-derived components, and uncompromising focus. The USDM ITR was the first Type R sold in America, bringing that philosophy to our market.\n\nDespite "only" 195 horsepower, the ITR could embarrass far more powerful cars on a winding road. The chassis was that good.',
  design_philosophy = 'Honda''s Type R philosophy: remove weight, increase precision, pursue perfection. Every component was scrutinized for weight savings. The result was a 2,600 lb car that felt telepathic.',
  motorsport_history = 'The DC2 dominated amateur road racing for years. One-make series proved the platform''s capability. Many professional drivers started in ITRs.',
  generation_code = 'DC2',
  predecessors = '["Acura Integra GS-R"]'::jsonb,
  successors = '["Acura RSX Type-S (2002-2006)"]'::jsonb,
  engine_character = E'The B18C5 is one of Honda''s finest VTEC engines. It produces 195 hp at 8,000 RPM—the highest specific output of any naturally aspirated production engine at the time.\n\nVTEC engagement at 5,700 RPM transforms the character. Below VTEC, it''s a normal Honda. Above, it screams to 8,400 RPM with an intensity that must be experienced.',
  transmission_feel = 'The close-ratio 5-speed is perfectly matched to the engine. Short throws, precise gates, satisfying engagement. One of the best manual transmissions ever made.',
  chassis_dynamics = E'The ITR chassis is legendary. Despite front-wheel-drive, it rotates willingly, communicates clearly, and rewards aggressive driving.\n\nThe lightweight, stiff shell, and perfectly tuned suspension create an experience that many RWD cars can''t match. It''s that good.',
  steering_feel = 'Hydraulic steering with exceptional feedback. You feel everything. The precision is remarkable.',
  brake_confidence = 'Stock brakes are adequate for track use. The light weight doesn''t demand huge brakes.',
  sound_signature = 'VTEC screaming to 8,400 RPM is an event. The B18C5 sounds like a racing engine because it essentially is.',
  comfort_track_balance = 'track-focused',
  comfort_notes = 'Firm Recaro seats, minimal sound deadening, race-focused ergonomics. Daily drivable but not comfortable.',
  defining_strengths = '[
    {"title": "VTEC Engine", "description": "The B18C5 is one of Honda''s greatest engines. 8,400 RPM of naturally aspirated fury."},
    {"title": "Chassis Excellence", "description": "The DC2 Type R chassis is the FWD benchmark. Nothing else feels this good."},
    {"title": "Light Weight", "description": "2,600 lbs means every horsepower counts. The power-to-weight is excellent."},
    {"title": "Honda Reliability", "description": "With proper care, these engines last forever. Bulletproof mechanicals."},
    {"title": "Collector Status", "description": "Values have skyrocketed. This is a recognized classic."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Extreme Prices", "description": "Clean examples now cost $50-100K+. The entry fee is prohibitive."},
    {"title": "Theft Target", "description": "ITRs are stolen constantly. Security is essential."},
    {"title": "Finding Stock Examples", "description": "Most have been modified. Original cars are rare and valuable."},
    {"title": "Age", "description": "All examples are 23+ years old. Maintenance and condition vary."}
  ]'::jsonb,
  ideal_owner = 'Honda enthusiasts who appreciate the B18C5. Collectors recognizing the ITR''s significance. Drivers who value chassis balance over power.',
  not_ideal_for = 'Budget buyers—these are expensive now. Those seeking comfort. Power seekers—195hp is modest by modern standards.',
  buyers_summary = 'Buy the most stock, best-documented example possible. Championship White is most desirable. Verify VIN and history carefully—theft recovery and clones exist.',
  best_years_detailed = '[{"years": "1997", "reason": "First year, most desirable for collectors."},{"years": "2000-2001", "reason": "Final years with all improvements."}]'::jsonb,
  must_have_options = '[{"name": "Stock Configuration", "reason": "Unmodified cars are 2-3x more valuable than modified."},{"name": "Championship White", "reason": "Most iconic color. Commands premiums."}]'::jsonb,
  price_guide = '{"low": {"price": "$45,000", "condition": "Modified, showing wear"}, "mid": {"price": "$65,000", "condition": "Stock, good condition"}, "high": {"price": "$100,000+", "condition": "Low-mile, completely stock, documented"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$2,500", "heavy": "$5,000+", "notes": "Honda reliability keeps costs down. Budget for security and storage."}'::jsonb,
  common_issues_detailed = '[{"issue": "VTEC Solenoid", "severity": "minor", "frequency": "common", "cost": "$200-400", "notes": "Seals wear over time. Straightforward replacement."},{"issue": "Distributor", "severity": "moderate", "frequency": "common", "cost": "$300-600", "notes": "Honda distributors fail eventually. Replacement resolves."}]'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The Integra Type R is the finest front-wheel-drive car ever made. Period.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Jason Cammisa", "outlet": "Hagerty", "quote": "The ITR is the greatest FWD car ever built. Nothing else comes close to this level of engagement."}]'::jsonb
WHERE slug = 'acura-integra-type-r-dc2';


-- ============================================================================
-- Verification Query for Part 2
-- ============================================================================
SELECT 
  name, 
  slug, 
  tier,
  essence IS NOT NULL AS has_essence,
  jsonb_array_length(COALESCE(defining_strengths, '[]'::jsonb)) AS num_strengths
FROM cars 
WHERE slug IN ('997-2-carrera-s', 'nissan-gt-r', 'shelby-gt500', 'lotus-evora-gt', 'mazda-rx7-fd3s', 'acura-integra-type-r-dc2')
ORDER BY name;






