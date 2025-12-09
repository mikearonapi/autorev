-- ============================================================================
-- BATCH UPDATE: BUDGET TIER CARS - PART 1
-- 
-- Cars: 987.2 Cayman S, F-Type V6 S, RC F, 370Z NISMO, C63 W204, M4 F82, Mustang GT PP2
-- ============================================================================


-- ============================================================================
-- PORSCHE 987.2 CAYMAN S (2009-2012)
-- ============================================================================
UPDATE cars SET
  brand = 'Porsche',
  country = 'Germany',
  essence = 'The affordable mid-engine Porsche—direct fuel injection flat-six in the chassis that started it all.',
  heritage = E'The 987.2 Cayman S brought direct fuel injection to Porsche''s mid-engine sports car, raising power while improving efficiency. It represented the refinement of the original Cayman formula—proper Porsche DNA at an accessible price.\n\nThis generation eliminated IMS bearing concerns from the earlier 987.1, making it a more reliable long-term proposition.',
  design_philosophy = 'Pure mid-engine sports car. Porsche handling at accessible pricing.',
  generation_code = '987.2',
  predecessors = '["Porsche Cayman S 987.1"]'::jsonb,
  successors = '["Porsche Cayman S 981"]'::jsonb,
  engine_character = 'The 3.4L DFI flat-six produces 320hp with linear power and free-revving character.',
  transmission_feel = 'Manual (6-speed) or PDK. Both excellent. Manual for engagement.',
  chassis_dynamics = 'Mid-engine perfection. Near-ideal weight distribution.',
  steering_feel = 'Hydraulic steering with excellent feedback. Last generation with hydraulic.',
  brake_confidence = 'Good Porsche brakes. PCCB optional.',
  sound_signature = 'Flat-six wail that builds with RPM.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Sports car firm but livable.',
  defining_strengths = '[
    {"title": "Hydraulic Steering", "description": "Last Cayman with hydraulic feel. Exceptional feedback."},
    {"title": "No IMS Issues", "description": "987.2 eliminated the IMS bearing concern."},
    {"title": "DFI Engine", "description": "Direct injection improved power and efficiency."},
    {"title": "Manual Available", "description": "6-speed for purists."},
    {"title": "Entry Porsche", "description": "Real Porsche DNA at accessible price."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Age", "description": "12-15 years old now."},
    {"title": "Not 981", "description": "Predecessor design shows age."},
    {"title": "Porsche Costs", "description": "Still Porsche maintenance pricing."}
  ]'::jsonb,
  ideal_owner = 'Those wanting Porsche experience on budget. Hydraulic steering appreciators.',
  not_ideal_for = 'Those wanting modern tech. Budget-limited on maintenance.',
  buyers_summary = 'Manual with Sport Chrono preferred. Last hydraulic steering Cayman.',
  best_years_detailed = '[{"years": "2009-2012", "reason": "All 987.2 years good."}]'::jsonb,
  must_have_options = '[{"name": "Sport Chrono", "reason": "Essential features."},{"name": "PASM", "reason": "Adjustable suspension."}]'::jsonb,
  price_guide = '{"low": {"price": "$28,000", "condition": "Higher mileage PDK"}, "mid": {"price": "$38,000", "condition": "Manual, 50-80K miles"}, "high": {"price": "$52,000+", "condition": "Low-mile manual, loaded"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$3,500", "heavy": "$6,000+", "notes": "Porsche ownership costs."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '9',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The 987.2 Cayman S is the best entry to Porsche ownership.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The 987.2 is the last hydraulic Cayman. That alone makes it special."}]'::jsonb
WHERE slug = '987-2-cayman-s';


-- ============================================================================
-- JAGUAR F-TYPE V6 S (2014-2020)
-- ============================================================================
UPDATE cars SET
  brand = 'Jaguar',
  country = 'United Kingdom',
  essence = 'The accessible British sports car—supercharged V6 drama in stunning design.',
  heritage = 'The V6 S offered F-Type drama at a more accessible price than the V8. The supercharged 3.0L still produced 380hp with that magnificent exhaust note.',
  design_philosophy = 'Jaguar beauty and character at entry-level F-Type pricing.',
  generation_code = 'X152',
  predecessors = '[]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The supercharged 3.0L V6 produces 380hp with immediate response.',
  transmission_feel = '8-speed automatic. Quick and smooth. Manual available on base.',
  chassis_dynamics = 'Capable sports car. RWD or AWD available.',
  steering_feel = 'Electric steering adequate.',
  brake_confidence = 'Good brakes.',
  sound_signature = 'Supercharged V6 with Jaguar exhaust character. Still sounds great.',
  comfort_track_balance = 'daily',
  comfort_notes = 'GT-car comfort.',
  defining_strengths = '[
    {"title": "Stunning Design", "description": "Beautiful Jaguar styling."},
    {"title": "Exhaust Sound", "description": "V6 still sounds great."},
    {"title": "Supercharged Power", "description": "380hp is plenty."},
    {"title": "Depreciation", "description": "Excellent used value now."},
    {"title": "Manual Option", "description": "Available on some models."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Reliability", "description": "Jaguar reliability concerns."},
    {"title": "Not V8", "description": "Missing the V8 drama."},
    {"title": "Running Costs", "description": "British luxury costs."}
  ]'::jsonb,
  ideal_owner = 'Design appreciators. Those wanting F-Type at accessible price.',
  not_ideal_for = 'Reliability focused. V8 seekers.',
  buyers_summary = 'Manual if available. Verify service history. Great used value.',
  best_years_detailed = '[{"years": "2017-2020", "reason": "Updates and refinements."}]'::jsonb,
  must_have_options = '[{"name": "Active Exhaust", "reason": "For the sound."},{"name": "Sport Suspension", "reason": "Better dynamics."}]'::jsonb,
  price_guide = '{"low": {"price": "$32,000", "condition": "Higher mileage"}, "mid": {"price": "$42,000", "condition": "30-50K miles"}, "high": {"price": "$55,000+", "condition": "Low miles, manual"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$8,000+", "notes": "British luxury costs."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '6',
  notable_reviews = '[{"source": "Top Gear", "quote": "The V6 S is the sensible F-Type. Still beautiful, still sounds great.", "rating": "8/10"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The V6 F-Type is the smart choice. You still get the looks and most of the drama."}]'::jsonb
WHERE slug = 'jaguar-f-type-v6-s';


-- ============================================================================
-- LEXUS RC F (2015-2022)
-- ============================================================================
UPDATE cars SET
  brand = 'Lexus',
  country = 'Japan',
  essence = 'The reliable V8 coupe—5.0L naturally aspirated fury with Lexus dependability.',
  heritage = E'The RC F brought Lexus'' 5.0L V8 to a dedicated coupe platform. With 472hp and Lexus reliability, it offered a unique proposition—V8 drama without German maintenance bills.',
  design_philosophy = 'Maximum naturally aspirated V8 in a reliable package.',
  generation_code = 'USC10',
  predecessors = '["Lexus IS F"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The 2UR-GSE 5.0L V8 produces 472hp with NA character and 7,300 RPM redline.',
  transmission_feel = '8-speed automatic with paddle shifters.',
  chassis_dynamics = 'Capable but heavy. TVD (Torque Vectoring Differential) helps.',
  steering_feel = 'Electric steering adequate.',
  brake_confidence = 'Good brakes with carbon ceramic option.',
  sound_signature = 'Naturally aspirated V8 that revs to 7,300 RPM. Sounds excellent.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Lexus comfort and quality.',
  defining_strengths = '[
    {"title": "Naturally Aspirated V8", "description": "5.0L that revs to 7,300 RPM."},
    {"title": "Lexus Reliability", "description": "No German maintenance costs."},
    {"title": "V8 Sound", "description": "Magnificent exhaust note."},
    {"title": "Build Quality", "description": "Lexus standards throughout."},
    {"title": "Depreciation", "description": "Excellent used value."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Heavy", "description": "The RC F is overweight."},
    {"title": "Automatic Only", "description": "No manual option."},
    {"title": "Handling", "description": "Not as sharp as German rivals."},
    {"title": "Infotainment", "description": "Lexus touchpad frustration."}
  ]'::jsonb,
  ideal_owner = 'V8 enthusiasts wanting reliability. Lexus loyalists.',
  not_ideal_for = 'Handling purists. Manual seekers.',
  buyers_summary = 'Track Edition for ultimate capability. TVD recommended.',
  best_years_detailed = '[{"years": "2020-2022", "reason": "Track Edition available."}]'::jsonb,
  must_have_options = '[{"name": "TVD", "reason": "Torque vectoring helps handling."},{"name": "Track Edition", "reason": "Lighter, more track-focused."}]'::jsonb,
  price_guide = '{"low": {"price": "$38,000", "condition": "Higher mileage"}, "mid": {"price": "$48,000", "condition": "30-50K miles"}, "high": {"price": "$65,000+", "condition": "Low-mile Track Edition"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$2,500", "heavy": "$5,000+", "notes": "Lexus reliability keeps costs down."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '6',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The RC F is the reliable V8 choice. That engine is magnificent.", "rating": "3.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "TST", "quote": "The RC F is underrated. Lexus reliability with proper V8 character."}]'::jsonb
WHERE slug = 'lexus-rc-f';


-- ============================================================================
-- NISSAN 370Z NISMO (2009-2020)
-- ============================================================================
UPDATE cars SET
  brand = 'Nissan',
  country = 'Japan',
  essence = 'The affordable Japanese sports car—VQ37VHR power with track-focused NISMO treatment.',
  heritage = E'The 370Z NISMO brought factory performance upgrades to Nissan''s Z platform. With 350hp and suspension tuning from NISMO, it delivered budget-friendly sports car thrills.',
  design_philosophy = 'Maximum performance from the Z platform. NISMO engineering.',
  generation_code = 'Z34',
  predecessors = '["Nissan 350Z NISMO"]'::jsonb,
  successors = '["Nissan Z (RZ34)"]'::jsonb,
  engine_character = 'The VQ37VHR 3.7L V6 produces 350hp with reliable, proven character.',
  transmission_feel = 'Manual (6-speed) or 7-speed automatic. Manual preferred.',
  chassis_dynamics = 'NISMO suspension improves handling. Front-engine, rear-drive.',
  steering_feel = 'Hydraulic steering with reasonable feedback.',
  brake_confidence = 'NISMO brakes adequate.',
  sound_signature = 'VQ V6 character.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Firm NISMO suspension. Sports car.',
  defining_strengths = '[
    {"title": "VQ37 Reliability", "description": "Proven, reliable engine."},
    {"title": "Manual Available", "description": "6-speed for engagement."},
    {"title": "NISMO Treatment", "description": "Factory performance upgrades."},
    {"title": "Value", "description": "Excellent sports car value."},
    {"title": "Simple Formula", "description": "Front engine, rear drive, manual."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Dated Platform", "description": "The Z34 aged during its long run."},
    {"title": "Interior", "description": "Not modern quality."},
    {"title": "Transmission Age", "description": "The manual needs rev-matching skill."},
    {"title": "Weight", "description": "Heavier than ideal."}
  ]'::jsonb,
  ideal_owner = 'Budget sports car seekers. NISMO enthusiasts. Manual fans.',
  not_ideal_for = 'Modern tech seekers. Comfort focused.',
  buyers_summary = 'Manual preferred. Later years have SynchroRev Match. Great value.',
  best_years_detailed = '[{"years": "2015-2020", "reason": "Updates and refinements."}]'::jsonb,
  must_have_options = '[{"name": "Manual Transmission", "reason": "The Z experience."},{"name": "SynchroRev Match", "reason": "Auto rev-matching."}]'::jsonb,
  price_guide = '{"low": {"price": "$25,000", "condition": "Higher mileage auto"}, "mid": {"price": "$32,000", "condition": "Manual, 40-60K miles"}, "high": {"price": "$42,000+", "condition": "Low-mile manual NISMO"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$2,500", "heavy": "$5,000+", "notes": "Nissan reliability is good."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '8',
  notable_reviews = '[{"source": "Motor Trend", "quote": "The 370Z NISMO is honest, affordable sports car fun.", "rating": "4/5"}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "TST", "quote": "The 370Z is great value. Manual, rear-drive, reliable."}]'::jsonb
WHERE slug = 'nissan-370z-nismo';


-- ============================================================================
-- MERCEDES C63 AMG W204 (2008-2014)
-- ============================================================================
UPDATE cars SET
  brand = 'Mercedes-AMG',
  country = 'Germany',
  essence = 'The naturally aspirated AMG V8—6.2L fury before turbocharging arrived.',
  heritage = E'The W204 C63 was the last C-Class with AMG''s naturally aspirated V8. The 6.2L M156 produced 451-507hp with a character that turbos can''t replicate.',
  design_philosophy = 'Maximum naturally aspirated V8 in compact AMG sedan.',
  generation_code = 'W204',
  predecessors = '[]'::jsonb,
  successors = '["Mercedes-AMG C63 W205 (2015-2021)"]'::jsonb,
  engine_character = 'The M156 6.2L V8 produces 451-507hp with NA character.',
  transmission_feel = '7-speed automatic. Adequate.',
  chassis_dynamics = 'Capable with AMG suspension.',
  steering_feel = 'Electro-hydraulic with reasonable feedback.',
  brake_confidence = 'AMG brakes adequate.',
  sound_signature = 'Naturally aspirated V8 rumble. Magnificent.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Firm but livable.',
  defining_strengths = '[
    {"title": "M156 V8", "description": "6.2L naturally aspirated. 451-507hp."},
    {"title": "Last NA C63", "description": "Before turbocharging."},
    {"title": "V8 Sound", "description": "NA character can''t be replicated."},
    {"title": "Depreciation", "description": "Incredible value now."},
    {"title": "AMG Character", "description": "Proper AMG drama."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Head Bolt Issues", "description": "M156 has known head bolt weakness."},
    {"title": "Camshaft Wear", "description": "Can be expensive."},
    {"title": "Running Costs", "description": "AMG maintenance."},
    {"title": "Automatic Only", "description": "No manual option."}
  ]'::jsonb,
  ideal_owner = 'NA V8 enthusiasts. Those wanting AMG on budget.',
  not_ideal_for = 'Reliability focused. Manual seekers.',
  buyers_summary = 'Verify head bolt service. Black Series is ultimate. Research M156 issues.',
  best_years_detailed = '[{"years": "2012-2014 (507 Edition)", "reason": "More power, updates."}]'::jsonb,
  must_have_options = '[{"name": "507 Edition", "reason": "507hp, more aggressive."},{"name": "Performance Package", "reason": "Better dynamics."}]'::jsonb,
  price_guide = '{"low": {"price": "$22,000", "condition": "Higher mileage, needs work"}, "mid": {"price": "$35,000", "condition": "507, 50-80K miles"}, "high": {"price": "$75,000+", "condition": "Black Series"}}'::jsonb,
  annual_ownership_cost = '{"low": "$3,000", "typical": "$5,000", "heavy": "$12,000+", "notes": "M156 maintenance. Budget for known issues."}'::jsonb,
  common_issues_detailed = '[{"issue": "Head Bolt Stretch", "severity": "major", "frequency": "common", "cost": "$3,000-6,000", "notes": "Known M156 issue. Verify or budget."},{"issue": "Camshaft Wear", "severity": "moderate", "frequency": "common", "cost": "$2,000-4,000", "notes": "Check cam lobes."}]'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '8',
  notable_reviews = '[{"source": "Top Gear", "quote": "The W204 C63 has the last great NA AMG V8. Cherish it.", "rating": "9/10"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The M156 is one of the great engines. The W204 C63 is special."}]'::jsonb
WHERE slug = 'mercedes-c63-amg-w204';


-- ============================================================================
-- BMW M4 F82 (2015-2020)
-- ============================================================================
UPDATE cars SET
  brand = 'BMW',
  country = 'Germany',
  essence = 'The twin-turbo M coupe—S55 power in the first standalone M4 nameplate.',
  heritage = E'The F82 M4 launched BMW''s dedicated coupe M nameplate with the S55 twin-turbo inline-six. More power and torque than the V8 predecessor, but different character.',
  design_philosophy = 'Maximum twin-turbo inline-six performance in M coupe form.',
  generation_code = 'F82',
  predecessors = '["BMW M3 E92 Coupe"]'::jsonb,
  successors = '["BMW M4 G82 (2021+)"]'::jsonb,
  engine_character = 'The S55 twin-turbo inline-six produces 425-444hp with immediate torque.',
  transmission_feel = 'Manual (6-speed) or DCT. Both capable.',
  chassis_dynamics = 'Capable with adaptive suspension. Competition Package recommended.',
  steering_feel = 'Electric steering. Accurate but less feel than E92.',
  brake_confidence = 'Good brakes with ceramic option.',
  sound_signature = 'Twin-turbo inline-six. Less dramatic than V8.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Comfortable daily with adaptive suspension.',
  defining_strengths = '[
    {"title": "S55 Power", "description": "425-444hp twin-turbo."},
    {"title": "Manual Available", "description": "6-speed option."},
    {"title": "Everyday Usability", "description": "Comfortable daily driver."},
    {"title": "Competition Package", "description": "444hp with better dynamics."},
    {"title": "Value", "description": "Excellent used pricing now."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Electric Steering", "description": "Less feel than predecessors."},
    {"title": "Crank Hub", "description": "S55 weakness for track use."},
    {"title": "Sound", "description": "Not as dramatic as V8 M3."}
  ]'::jsonb,
  ideal_owner = 'M coupe seekers. Daily drivers wanting performance.',
  not_ideal_for = 'Steering feel purists. V8 character seekers.',
  buyers_summary = 'Competition Package recommended. Verify crank hub if tracking.',
  best_years_detailed = '[{"years": "2016-2020", "reason": "Competition Package available."}]'::jsonb,
  must_have_options = '[{"name": "Competition Package", "reason": "444hp, better dynamics."},{"name": "Manual", "reason": "For engagement."}]'::jsonb,
  price_guide = '{"low": {"price": "$35,000", "condition": "Higher mileage DCT"}, "mid": {"price": "$48,000", "condition": "Competition manual, 30-50K"}, "high": {"price": "$62,000+", "condition": "Low-mile CS or GTS"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,500", "typical": "$4,500", "heavy": "$8,000+", "notes": "BMW M ownership costs."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '9',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The M4 Competition is brutally effective.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The F82 M4 is seriously fast. Different from E92 but still a proper M car."}]'::jsonb
WHERE slug = 'bmw-m4-f82';


-- ============================================================================
-- FORD MUSTANG GT PP2 (2018-2023)
-- ============================================================================
UPDATE cars SET
  brand = 'Ford',
  country = 'United States',
  essence = 'The track-ready Mustang GT—5.0L Coyote with Performance Pack 2 creates serious capability.',
  heritage = E'The Performance Pack 2 Mustang GT brought GT350-derived components to the standard GT. MagneRide, GT350 tires, and enhanced cooling made it a proper track weapon at GT pricing.',
  design_philosophy = 'GT350 capability at GT pricing. Track-ready without GT350 premium.',
  generation_code = 'S550',
  predecessors = '[]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The Coyote 5.0L V8 produces 460hp with rev-happy character.',
  transmission_feel = 'Manual (6-speed) or 10-speed automatic. Manual preferred.',
  chassis_dynamics = 'MagneRide and GT350 components create genuine track capability.',
  steering_feel = 'Electric steering adequate.',
  brake_confidence = 'Brembo brakes from GT350.',
  sound_signature = 'Coyote V8 with active exhaust.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'PP2 is firm. Track-focused.',
  defining_strengths = '[
    {"title": "GT350 Components", "description": "MagneRide, tires, brakes from GT350."},
    {"title": "Coyote V8", "description": "460hp rev-happy character."},
    {"title": "Manual Available", "description": "6-speed option."},
    {"title": "Value", "description": "GT350 capability at GT pricing."},
    {"title": "Track Ready", "description": "Serious track capability."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Firm Ride", "description": "PP2 suspension is track-focused."},
    {"title": "Not GT350", "description": "Missing the Voodoo engine."},
    {"title": "Weight", "description": "Mustang GT weight."}
  ]'::jsonb,
  ideal_owner = 'Track day enthusiasts. Those wanting GT350 capability on budget.',
  not_ideal_for = 'Comfort seekers. Voodoo engine seekers.',
  buyers_summary = 'Manual preferred. PP2 is the track-ready GT.',
  best_years_detailed = '[{"years": "2018-2023", "reason": "All PP2 years good."}]'::jsonb,
  must_have_options = '[{"name": "Performance Pack 2", "reason": "This is the spec."},{"name": "Manual", "reason": "For engagement."}]'::jsonb,
  price_guide = '{"low": {"price": "$32,000", "condition": "Higher mileage PP1"}, "mid": {"price": "$42,000", "condition": "PP2 manual, 20-35K miles"}, "high": {"price": "$52,000+", "condition": "Low-mile PP2 manual, Mach 1"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$3,000", "heavy": "$6,000+", "notes": "Ford parts availability."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The PP2 Mustang GT is the track Mustang value.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The PP2 brings GT350 capability to GT pricing. Smart choice."}]'::jsonb
WHERE slug = 'mustang-gt-pp2';


-- ============================================================================
-- Verification Query
-- ============================================================================
SELECT 
  name, 
  slug, 
  tier,
  essence IS NOT NULL AS has_essence,
  jsonb_array_length(COALESCE(defining_strengths, '[]'::jsonb)) AS num_strengths
FROM cars 
WHERE slug IN ('987-2-cayman-s', 'jaguar-f-type-v6-s', 'lexus-rc-f', 'nissan-370z-nismo', 'mercedes-c63-amg-w204', 'bmw-m4-f82', 'mustang-gt-pp2')
ORDER BY name;






