-- ============================================================================
-- BATCH UPDATE: MID TIER CARS - PART 1
-- 
-- Cars: 981 Cayman S, Shelby GT350, Jaguar F-Type R, C7 Grand Sport, 
--       C7 Z06, Camaro ZL1
-- ============================================================================


-- ============================================================================
-- 981 CAYMAN S (2013-2016)
-- ============================================================================
UPDATE cars SET
  brand = 'Porsche',
  country = 'Germany',
  essence = 'The approachable mid-engine Porsche—naturally aspirated flat-six perfection in a balanced chassis that rewards every input.',
  heritage = E'The 981 Cayman S delivered the core Porsche sports car experience at a more accessible price than the 911. With 325 horsepower from a 3.4L flat-six and impeccable mid-engine balance, it proved you didn''t need the halo model to have the Porsche experience.\n\nThe 981 generation was the last naturally aspirated Cayman before turbocharging arrived with the 718. For purists, this is the sweet spot—enough power to be exciting, naturally aspirated character, and a chassis that sets the standard.',
  design_philosophy = 'Pure sports car: mid-engine, two seats, driver-focused. The Cayman S delivered Porsche engineering without unnecessary complexity.',
  generation_code = '981',
  predecessors = '["Porsche Cayman S (987.2)"]'::jsonb,
  successors = '["Porsche 718 Cayman S (982)"]'::jsonb,
  engine_character = 'The 3.4L flat-six produces 325hp with classic naturally aspirated character. Linear power delivery, free-revving to 7,400 RPM.',
  transmission_feel = 'Manual (6-speed) or PDK. Both excellent. Manual for engagement, PDK for speed.',
  chassis_dynamics = 'Mid-engine perfection. Near-ideal weight distribution creates exceptional balance and feedback.',
  steering_feel = 'Electric steering with good calibration. Not hydraulic-pure but communicative enough.',
  brake_confidence = 'Excellent Porsche brakes. PCCB optional.',
  sound_signature = 'Flat-six wail that builds with RPM. The NA character is special.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Firm but livable. Sports car compromises without punishment.',
  defining_strengths = '[
    {"title": "Naturally Aspirated", "description": "The last NA Cayman generation. Linear, rev-happy character."},
    {"title": "Perfect Balance", "description": "Mid-engine layout creates exceptional handling."},
    {"title": "Manual Available", "description": "6-speed manual for purists."},
    {"title": "Porsche Quality", "description": "German engineering excellence."},
    {"title": "Accessible Entry", "description": "911 DNA at lower price."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Not GTS", "description": "The GTS is the sweet spot. S is slightly less special."},
    {"title": "Electric Steering", "description": "Not hydraulic feedback."},
    {"title": "Porsche Pricing", "description": "Premium parts and service."}
  ]'::jsonb,
  ideal_owner = 'Those wanting Porsche mid-engine experience at accessible pricing. NA enthusiasts. Track day participants.',
  not_ideal_for = 'Those wanting more power. Badge-conscious 911 seekers.',
  buyers_summary = 'Manual with Sport Chrono is the spec. Consider GTS if budget allows.',
  best_years_detailed = '[{"years": "2013-2016", "reason": "All 981 years excellent."}]'::jsonb,
  must_have_options = '[{"name": "Sport Chrono", "reason": "Essential features."},{"name": "PASM", "reason": "Adjustable suspension."}]'::jsonb,
  price_guide = '{"low": {"price": "$38,000", "condition": "Higher mileage PDK"}, "mid": {"price": "$48,000", "condition": "Manual, 40-60K miles"}, "high": {"price": "$62,000+", "condition": "Low-mile manual, loaded"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$3,500", "heavy": "$6,000+", "notes": "Porsche ownership costs."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '9',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The Cayman S is the sports car Porsche won''t admit is better than the 911.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The Cayman S is proof that mid-engine is the right way. The balance is exceptional."}]'::jsonb
WHERE slug = '981-cayman-s';


-- ============================================================================
-- SHELBY GT350 (2016-2020)
-- ============================================================================
UPDATE cars SET
  brand = 'Ford',
  country = 'United States',
  essence = 'The flat-plane crank revolution—a Mustang that revs like a Ferrari and handles like nothing from Detroit before it.',
  heritage = E'The GT350 brought a flat-plane crank V8 to American muscle—a first for Ford. The 5.2L Voodoo engine revs to 8,250 RPM with a character unlike any previous Mustang.\n\nFord''s engineers designed it for road course performance first. MagneRide suspension, aggressive aero, and chassis tuning made it a genuine track weapon. This wasn''t a drag strip special—it was a precision instrument.\n\nThe GT350R removed weight and added carbon fiber wheels for ultimate track capability.',
  design_philosophy = 'Build the Mustang Ford engineers wanted to drive on a road course. Power, balance, precision.',
  generation_code = 'S550',
  predecessors = '["Ford Mustang Boss 302 (2012-2013)"]'::jsonb,
  successors = '["Ford Mustang Mach 1 (S550)"]'::jsonb,
  engine_character = E'The 5.2L Voodoo flat-plane V8 produces 526hp and revs to 8,250 RPM. It sounds like nothing American before—a screaming, exotic wail.',
  transmission_feel = 'Manual only—6-speed Tremec with excellent feel. No automatic option. Pure engagement.',
  chassis_dynamics = 'MagneRide suspension and aggressive chassis tuning create genuine track capability. It rotates willingly.',
  steering_feel = 'Electric steering is well-weighted and communicative for a modern Mustang.',
  brake_confidence = 'Excellent Brembo brakes. GT350R has even larger rotors.',
  sound_signature = 'The Voodoo''s flat-plane crank creates an exotic, high-revving wail unlike any American V8.',
  comfort_track_balance = 'track-focused',
  comfort_notes = 'Firm ride, loud cabin. This is a track car that can drive home.',
  defining_strengths = '[
    {"title": "Voodoo Engine", "description": "Flat-plane crank V8 that revs to 8,250 RPM. Nothing else sounds like this."},
    {"title": "Manual Only", "description": "No automatic option. Pure engagement."},
    {"title": "Track Capability", "description": "Genuine road course performance, not just drag strip."},
    {"title": "MagneRide", "description": "Excellent adaptive suspension."},
    {"title": "American Exotic", "description": "Italian character from Detroit."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Oil Consumption", "description": "The Voodoo can consume oil. Monitor levels."},
    {"title": "Early Engine Issues", "description": "Some early engines had failures. Verify service history."},
    {"title": "Firm Ride", "description": "Track-focused suspension isn''t comfortable."},
    {"title": "Thirsty", "description": "High-revving V8 drinks fuel."}
  ]'::jsonb,
  ideal_owner = 'Track day enthusiasts. Those who appreciate high-revving engines. Manual transmission purists.',
  not_ideal_for = 'Comfort seekers. Drag strip focus. Those wanting automatic.',
  buyers_summary = 'Verify engine service history. 2018+ addressed early oil issues. GT350R for ultimate track focus.',
  best_years_detailed = '[{"years": "2018-2020", "reason": "Engine improvements, all updates."},{"years": "2016-2017", "reason": "First years—verify engine health."}]'::jsonb,
  must_have_options = '[{"name": "Technology Package", "reason": "Better daily usability."},{"name": "Track Package", "reason": "For serious track use."}]'::jsonb,
  price_guide = '{"low": {"price": "$48,000", "condition": "Higher mileage, early year"}, "mid": {"price": "$62,000", "condition": "2018+, 20-40K miles"}, "high": {"price": "$85,000+", "condition": "Low-mile GT350R"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$8,000+", "notes": "Ford parts, exotic character."}'::jsonb,
  common_issues_detailed = '[{"issue": "Engine Oil Consumption", "severity": "moderate", "frequency": "common", "cost": "Monitoring", "notes": "The Voodoo can consume oil. Check levels regularly."},{"issue": "Early Engine Failures", "severity": "major", "frequency": "uncommon", "cost": "$10,000+", "notes": "Some early engines failed. Verify service history."}]'::jsonb,
  track_readiness = 'race-bred',
  community_strength = '9',
  notable_reviews = '[{"source": "Motor Trend", "quote": "The GT350 is the best Mustang ever made. The Voodoo engine is a masterpiece.", "rating": "9.5/10"}]'::jsonb,
  expert_quotes = '[{"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The GT350 changed what I thought a Mustang could be. It''s a precision instrument."}]'::jsonb
WHERE slug = 'shelby-gt350';


-- ============================================================================
-- JAGUAR F-TYPE R (2015-2020)
-- ============================================================================
UPDATE cars SET
  brand = 'Jaguar',
  country = 'United Kingdom',
  essence = 'British brutality—a supercharged V8 in one of the most beautiful bodies ever designed, with a soundtrack to match.',
  heritage = E'The F-Type R brought Jaguar back to serious sports car territory. With a supercharged 5.0L V8 producing 550 horsepower, it had the power. With stunning design, it had the presence.\n\nThe F-Type''s exhaust note became legendary—crackles, pops, and thunder that made it an event to hear. This was Jaguar remembering how to make an emotional sports car.',
  design_philosophy = 'Beautiful, powerful, dramatic. The F-Type R was designed to stir emotions.',
  generation_code = 'X152',
  predecessors = '["Jaguar XK-R"]'::jsonb,
  successors = '["Jaguar F-Type (2021+ update)"]'::jsonb,
  engine_character = 'The supercharged 5.0L V8 produces 550hp with brutal, immediate power. Supercharger whine adds drama.',
  transmission_feel = '8-speed automatic is quick and smooth. No manual option on V8 models.',
  chassis_dynamics = 'Capable but heavy. The F-Type is more GT than scalpel. AWD (optional) adds stability.',
  steering_feel = 'Electric steering is accurate but not exceptionally communicative.',
  brake_confidence = 'Good brakes for the weight and power.',
  sound_signature = 'The F-Type''s exhaust is legendary—crackling, popping, thunderous V8 drama.',
  comfort_track_balance = 'daily',
  comfort_notes = 'GT-car comfort. Firm but livable for daily use.',
  defining_strengths = '[
    {"title": "Stunning Design", "description": "One of the most beautiful cars ever made."},
    {"title": "Exhaust Sound", "description": "Legendary crackles and pops. An event to hear."},
    {"title": "550hp Supercharged V8", "description": "Brutal power delivery."},
    {"title": "British Character", "description": "Dramatic and emotional."},
    {"title": "Depreciation", "description": "Values have dropped—great used value."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Reliability Concerns", "description": "Jaguar reliability isn''t German. Budget for issues."},
    {"title": "Heavy", "description": "The F-Type is heavy for a sports car."},
    {"title": "No Manual (V8)", "description": "V8 models were automatic only."},
    {"title": "Interior Quality", "description": "Not as polished as German rivals."}
  ]'::jsonb,
  ideal_owner = 'Those who prioritize design and drama. Sound enthusiasts. British car appreciators.',
  not_ideal_for = 'Reliability obsessed. Manual transmission seekers. Track-focused drivers.',
  buyers_summary = 'R-Dynamic or R spec for maximum drama. Verify maintenance history. CPO adds peace of mind.',
  best_years_detailed = '[{"years": "2017-2020", "reason": "Updates and refinements."}]'::jsonb,
  must_have_options = '[{"name": "Active Exhaust", "reason": "Essential for the sound."},{"name": "R or R-Dynamic", "reason": "Maximum power and presence."}]'::jsonb,
  price_guide = '{"low": {"price": "$42,000", "condition": "Higher mileage"}, "mid": {"price": "$55,000", "condition": "30-50K miles"}, "high": {"price": "$72,000+", "condition": "Low miles, loaded R"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,500", "typical": "$5,000", "heavy": "$10,000+", "notes": "British luxury costs. Budget for potential issues."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '6',
  notable_reviews = '[{"source": "Top Gear", "quote": "The F-Type R is proof Jaguar still knows how to make a proper sports car.", "rating": "8/10"}]'::jsonb,
  expert_quotes = '[{"person": "Jeremy Clarkson", "outlet": "Top Gear", "quote": "The F-Type might be the most beautiful car I''ve ever seen. And that exhaust..."}]'::jsonb
WHERE slug = 'jaguar-f-type-r';


-- ============================================================================
-- C7 CORVETTE GRAND SPORT (2017-2019)
-- ============================================================================
UPDATE cars SET
  brand = 'Chevrolet',
  country = 'United States',
  essence = 'The Goldilocks Corvette—Z06 chassis capability with Stingray reliability at a price that makes sense.',
  heritage = E'The C7 Grand Sport combined the Z06''s wide-body chassis and suspension with the proven LT1 engine. The result was a Corvette that handled like the Z06 without the supercharged engine''s heat issues.\n\nFor many, the Grand Sport is the best C7. It has the aggressive looks, the capable chassis, and the reliability of the naturally aspirated engine. It''s the complete package.',
  design_philosophy = 'Take the Z06 chassis, add the reliable LT1, create the perfect balance.',
  generation_code = 'C7',
  predecessors = '["Corvette C6 Grand Sport"]'::jsonb,
  successors = '["Corvette C8 Stingray"]'::jsonb,
  engine_character = 'The 6.2L LT1 produces 460hp with classic American V8 character. Reliable and proven.',
  transmission_feel = 'Manual (7-speed) or 8-speed automatic. Both excellent. Manual is more engaging.',
  chassis_dynamics = 'Z06 wide-body with Magnetic Ride. Excellent grip and balance.',
  steering_feel = 'Electric steering with good feedback for a Corvette.',
  brake_confidence = 'Z06-spec brakes. Excellent stopping power.',
  sound_signature = 'American V8 rumble with exhaust crackles.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Comfortable enough for daily driving with the right settings.',
  defining_strengths = '[
    {"title": "Z06 Chassis", "description": "Wide-body capability without supercharged heat issues."},
    {"title": "LT1 Reliability", "description": "Proven naturally aspirated V8."},
    {"title": "Manual Available", "description": "7-speed manual for engagement."},
    {"title": "Perfect Balance", "description": "The right amount of everything."},
    {"title": "Value", "description": "Z06 looks and handling at lower price."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Not Z06 Power", "description": "460hp vs 650hp. Less dramatic."},
    {"title": "C7 Interior", "description": "Not luxury-car quality."},
    {"title": "Replaced by C8", "description": "Newer mid-engine gets attention."}
  ]'::jsonb,
  ideal_owner = 'Those wanting Z06 capability without the drama. Track day participants. Reliability-focused enthusiasts.',
  not_ideal_for = 'Power seekers. Those wanting latest tech.',
  buyers_summary = 'Manual with Z07 package for maximum capability. Excellent used value now.',
  best_years_detailed = '[{"years": "2017-2019", "reason": "All GS years excellent."}]'::jsonb,
  must_have_options = '[{"name": "Z07 Package", "reason": "Carbon ceramic brakes, aero, maximum capability."},{"name": "Manual Transmission", "reason": "For engagement."}]'::jsonb,
  price_guide = '{"low": {"price": "$52,000", "condition": "Higher mileage auto"}, "mid": {"price": "$65,000", "condition": "Manual, 20-35K miles"}, "high": {"price": "$82,000+", "condition": "Low-mile manual Z07"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$3,000", "heavy": "$6,000+", "notes": "Corvette ownership is affordable."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The Grand Sport is the Corvette that makes the most sense. Z06 handling, Stingray reliability.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The Grand Sport is my favorite C7. The balance is perfect."}]'::jsonb
WHERE slug = 'c7-corvette-grand-sport';


-- ============================================================================
-- C7 CORVETTE Z06 (2015-2019)
-- ============================================================================
UPDATE cars SET
  brand = 'Chevrolet',
  country = 'United States',
  essence = 'The supercharged American sledgehammer—650 horsepower of LT4 fury in a chassis capable of supercar lap times.',
  heritage = E'The C7 Z06 brought supercharged power back to the Corvette, combining 650 horsepower with a chassis developed through racing. It could embarrass supercars costing three times as much.\n\nThe Z07 package added aero and carbon ceramics for maximum track capability. The Z06 set production car records and proved American engineering could compete anywhere.',
  design_philosophy = 'Maximum performance with supercharged power and racing-derived chassis.',
  generation_code = 'C7',
  predecessors = '["Corvette C6 Z06"]'::jsonb,
  successors = '["Corvette C8 Z06"]'::jsonb,
  engine_character = 'The supercharged 6.2L LT4 produces 650hp with brutal, immediate power. Supercharger whine adds drama.',
  transmission_feel = 'Manual (7-speed) or 8-speed automatic. Both handle the power. Manual adds engagement.',
  chassis_dynamics = 'Aero and chassis tuned for track performance. Massive grip in proper conditions.',
  steering_feel = 'Electric steering adequate for the performance level.',
  brake_confidence = 'Standard brakes good; Z07 carbon ceramics excellent.',
  sound_signature = 'Supercharged V8 with aggressive exhaust character.',
  comfort_track_balance = 'track-focused',
  comfort_notes = 'Firm ride, especially with Z07. Track-biased.',
  defining_strengths = '[
    {"title": "650 Horsepower", "description": "Supercharged LT4 delivers massive power."},
    {"title": "Track Capability", "description": "Racing-derived chassis and aero."},
    {"title": "Manual Available", "description": "7-speed for engagement."},
    {"title": "Value", "description": "Supercar performance at American prices."},
    {"title": "Z07 Package", "description": "Carbon ceramics and aero for serious track use."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Heat Issues", "description": "The supercharged engine generates heat. Track use requires attention."},
    {"title": "Firm Ride", "description": "Track-focused suspension isn''t comfortable."},
    {"title": "Overheating Reports", "description": "Some cars enter thermal protection on track. Research specific car."},
    {"title": "Weight", "description": "Heavier than the Grand Sport."}
  ]'::jsonb,
  ideal_owner = 'Power seekers. Track day enthusiasts. Those who want maximum Corvette.',
  not_ideal_for = 'Comfort seekers. Those concerned about heat management. Pure reliability focus.',
  buyers_summary = 'Verify cooling system upgrades if for track use. Z07 for maximum capability. Manual for engagement.',
  best_years_detailed = '[{"years": "2017-2019", "reason": "Cooling improvements addressed early issues."}]'::jsonb,
  must_have_options = '[{"name": "Z07 Package", "reason": "Carbon ceramics, aero for track."},{"name": "Manual Transmission", "reason": "For engagement."}]'::jsonb,
  price_guide = '{"low": {"price": "$58,000", "condition": "Higher mileage auto"}, "mid": {"price": "$72,000", "condition": "Manual, 20-35K miles"}, "high": {"price": "$95,000+", "condition": "Low-mile manual Z07"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$8,000+", "notes": "Track use increases costs significantly."}'::jsonb,
  common_issues_detailed = '[{"issue": "Heat Management", "severity": "moderate", "frequency": "common (track)", "notes": "The supercharged engine generates significant heat. Track use may trigger thermal protection."}]'::jsonb,
  track_readiness = 'race-bred',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The Z06 is supercar fast. The value proposition is absurd.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The Z06 can run with anything. The power is relentless."}]'::jsonb
WHERE slug = 'c7-corvette-z06';


-- ============================================================================
-- CAMARO ZL1 (2017-2023)
-- ============================================================================
UPDATE cars SET
  brand = 'Chevrolet',
  country = 'United States',
  essence = 'The Camaro turned weapon—650 supercharged horsepower with a chassis that finally matches the engine.',
  heritage = E'The sixth-gen Camaro ZL1 brought supercharged LT4 power to a chassis that could use it. Unlike previous muscle cars, this ZL1 could turn as well as go straight.\n\nThe 1LE package added track-focused suspension and cooling. The ZL1 1LE became a serious track weapon that could embarrass much more expensive machinery.',
  design_philosophy = 'Take the Z06 engine, add it to the Camaro chassis, make a balanced weapon.',
  generation_code = 'Alpha Platform',
  predecessors = '["Camaro ZL1 (Gen 5)"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The supercharged 6.2L LT4 produces 650hp with brutal power delivery.',
  transmission_feel = 'Manual (6-speed) or 10-speed automatic. Both excellent. Manual adds drama.',
  chassis_dynamics = 'Magnetic Ride and chassis tuning create genuine track capability.',
  steering_feel = 'Electric steering is well-weighted for the application.',
  brake_confidence = 'Brembo brakes excellent. 1LE adds more capability.',
  sound_signature = 'Supercharged V8 with aggressive exhaust.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Firm but livable. Better than expected for the performance level.',
  defining_strengths = '[
    {"title": "650 Horsepower", "description": "Same LT4 as Z06. Brutal power."},
    {"title": "Track Capable", "description": "Finally a Camaro that handles as well as it accelerates."},
    {"title": "Manual Available", "description": "6-speed for engagement."},
    {"title": "1LE Package", "description": "Turns it into a track weapon."},
    {"title": "Value", "description": "Supercar performance at muscle car prices."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Visibility", "description": "Camaro greenhouse is tight. Limited visibility."},
    {"title": "Interior", "description": "Cramped by modern standards."},
    {"title": "Heavy", "description": "The ZL1 weighs significant pounds."},
    {"title": "Discontinued", "description": "Camaro production ended."}
  ]'::jsonb,
  ideal_owner = 'Track day enthusiasts. Power seekers. Those who appreciate the value.',
  not_ideal_for = 'Comfort seekers. Those who need visibility. Space-conscious buyers.',
  buyers_summary = '1LE for track focus. Manual for engagement. Great used values now.',
  best_years_detailed = '[{"years": "2019-2023", "reason": "All updates, refreshed front end."}]'::jsonb,
  must_have_options = '[{"name": "1LE Package", "reason": "Track-focused suspension and cooling."},{"name": "Manual Transmission", "reason": "For engagement."}]'::jsonb,
  price_guide = '{"low": {"price": "$48,000", "condition": "Higher mileage auto"}, "mid": {"price": "$58,000", "condition": "Manual, 15-30K miles"}, "high": {"price": "$78,000+", "condition": "Low-mile 1LE manual"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$8,000+", "notes": "Corvette-based drivetrain is reasonable to maintain."}'::jsonb,
  track_readiness = 'race-bred',
  community_strength = '9',
  notable_reviews = '[{"source": "Motor Trend", "quote": "The ZL1 1LE is a serious track car. The value is incredible.", "rating": "9/10"}]'::jsonb,
  expert_quotes = '[{"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The ZL1 1LE surprised me. This is a legitimate track weapon."}]'::jsonb
WHERE slug = 'camaro-zl1';


-- ============================================================================
-- Verification Query for Part 1
-- ============================================================================
SELECT 
  name, 
  slug, 
  tier,
  essence IS NOT NULL AS has_essence,
  jsonb_array_length(COALESCE(defining_strengths, '[]'::jsonb)) AS num_strengths
FROM cars 
WHERE slug IN ('981-cayman-s', 'shelby-gt350', 'jaguar-f-type-r', 'c7-corvette-grand-sport', 'c7-corvette-z06', 'camaro-zl1')
ORDER BY name;






