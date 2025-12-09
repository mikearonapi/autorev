-- ============================================================================
-- BATCH UPDATE: UPPER-MID TIER CARS - PART 4 (FINAL)
-- 
-- Cars: E63S, CTS-V, C6 Z06, Challenger Hellcat, Charger Hellcat, 
--       Exige S, 911 Turbo 997.1, GT3 996, AMG GT
-- ============================================================================


-- ============================================================================
-- MERCEDES-AMG E63S W213 (2018-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'Mercedes-AMG',
  country = 'Germany',
  essence = 'The luxury sledgehammer—a 603hp twin-turbo V8 with 4MATIC+ all-wheel drive in the most comfortable super sedan.',
  heritage = E'The E63S represents AMG''s mastery of the super sedan formula. 603 horsepower, all-wheel drive, and Mercedes luxury make it the ultimate "stealth" performance car.\n\nThe 4.0L twin-turbo V8 with hot-inside-V turbo placement delivers brutal power with remarkable refinement. The E63S can outrun supercars while providing S-Class comfort.',
  design_philosophy = 'Maximum performance with maximum luxury. AMG believed you shouldn''t have to choose.',
  generation_code = 'W213',
  predecessors = '["Mercedes-AMG E63 W212 (2011-2016)"]'::jsonb,
  successors = '["Mercedes-AMG E63 W214 (2024+)"]'::jsonb,
  engine_character = E'The M177 4.0L twin-turbo V8 produces 603 horsepower with immediate response and relentless power. The hot-V design minimizes lag.',
  transmission_feel = 'AMG Speedshift 9-speed is quick and smooth. Properly aggressive in Sport+.',
  chassis_dynamics = '4MATIC+ provides incredible traction with Drift Mode for those who want to play. Air suspension is remarkably capable.',
  steering_feel = 'Electric steering is well-weighted. Not communicative but accurate.',
  brake_confidence = 'AMG brakes are excellent. Carbon ceramics optional.',
  sound_signature = 'AMG V8 burble and crackle. The sport exhaust is glorious.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Full luxury sedan comfort. Excellent interior, smooth ride, all the tech.',
  defining_strengths = '[
    {"title": "603 Horsepower", "description": "Massive power with AMG character. Brutal acceleration."},
    {"title": "4MATIC+ with Drift Mode", "description": "AWD traction with RWD capability when desired."},
    {"title": "Mercedes Luxury", "description": "S-Class-like comfort with supercar speed."},
    {"title": "Stealth", "description": "Subtle appearance hides serious performance."},
    {"title": "All-Weather", "description": "AWD makes it year-round usable."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Weight", "description": "4,500+ pounds. Very heavy."},
    {"title": "Mercedes Maintenance", "description": "Expensive to service. German luxury costs."},
    {"title": "Fuel Economy", "description": "The V8 drinks. Plan accordingly."},
    {"title": "Complexity", "description": "Lots of tech means potential issues."}
  ]'::jsonb,
  ideal_owner = 'Luxury seekers wanting performance. Those who need space and speed. Executive express users.',
  not_ideal_for = 'Budget-conscious. Those wanting analog engagement. Manual fans.',
  buyers_summary = 'E63S (not base E63) is the one to have. AMG Night Package for aesthetics. Carbon ceramics for track use.',
  best_years_detailed = '[{"years": "2021-2024", "reason": "Latest updates and tech."}]'::jsonb,
  must_have_options = '[{"name": "AMG Performance Exhaust", "reason": "Essential for V8 sound."},{"name": "AMG Night Package", "reason": "Blacked-out trim looks better."}]'::jsonb,
  price_guide = '{"low": {"price": "$68,000", "condition": "Higher mileage"}, "mid": {"price": "$88,000", "condition": "30-45K miles"}, "high": {"price": "$115,000+", "condition": "Low miles, loaded"}}'::jsonb,
  annual_ownership_cost = '{"low": "$3,500", "typical": "$6,500", "heavy": "$12,000+", "notes": "Mercedes-AMG ownership costs."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '7',
  notable_reviews = '[{"source": "Top Gear", "quote": "The E63S is ridiculous. It''s a luxury sedan that embarrasses supercars.", "rating": "9/10"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The E63S does things a sedan shouldn''t be able to do. It''s absurdly fast."}]'::jsonb
WHERE slug = 'mercedes-amg-e63s-w213';


-- ============================================================================
-- CADILLAC CTS-V GEN3 (2016-2019)
-- ============================================================================
UPDATE cars SET
  brand = 'Cadillac',
  country = 'United States',
  essence = 'America''s sledgehammer—640 supercharged horsepower in a luxury sedan that challenges the best from Germany.',
  heritage = E'The third-generation CTS-V brought Cadillac''s flagship into genuine supercar territory. The 6.2L supercharged LT4 V8 (shared with the Corvette Z06) produced 640 horsepower—more than any German competitor.\n\nThe CTS-V proved American luxury could compete on performance. It was faster, more powerful, and less expensive than BMW M5 and Mercedes E63.',
  design_philosophy = 'Maximum American power in a luxury package. Cadillac built the performance sedan they wanted.',
  generation_code = 'Gen 3',
  predecessors = '["Cadillac CTS-V Gen 2 (2009-2015)"]'::jsonb,
  successors = '["Cadillac CT5-V Blackwing (2022+)"]'::jsonb,
  engine_character = E'The LT4 6.2L supercharged V8 produces 640 horsepower with violent American character. Supercharger whine, massive torque, brute force.',
  transmission_feel = '8-speed automatic is adequate. Manual was not offered (a disappointment).',
  chassis_dynamics = 'Magnetic Ride provides excellent range. The chassis is capable despite the weight.',
  steering_feel = 'Electric steering works but isn''t the highlight.',
  brake_confidence = 'Brembo brakes handle the power well.',
  sound_signature = 'Supercharged V8 with American muscle character. Loud and proud.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Cadillac luxury with appropriate comfort. Not as refined as Germans but capable.',
  defining_strengths = '[
    {"title": "640 Horsepower", "description": "More power than German rivals. Massive acceleration."},
    {"title": "Value", "description": "More power for less money than M5 or E63."},
    {"title": "American Character", "description": "Supercharged V8 drama. Unapologetically American."},
    {"title": "Magnetic Ride", "description": "Excellent adaptive suspension."},
    {"title": "Corvette Engine", "description": "Z06-derived LT4 is proven and tuneable."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Automatic Only", "description": "No manual transmission. Missed opportunity."},
    {"title": "Interior Quality", "description": "Not as refined as German alternatives."},
    {"title": "Dealer Network", "description": "Cadillac service can be inconsistent."},
    {"title": "Depreciation", "description": "Values dropped significantly."}
  ]'::jsonb,
  ideal_owner = 'American performance seekers. Those wanting maximum power per dollar. V8 enthusiasts.',
  not_ideal_for = 'Badge-conscious buyers. Manual transmission seekers. Those wanting German refinement.',
  buyers_summary = 'Buy the best-maintained example you can find. Verify service history. Good value in the used market.',
  best_years_detailed = '[{"years": "2016-2019", "reason": "All years excellent. Later cars may have fewer miles."}]'::jsonb,
  must_have_options = '[{"name": "Carbon Fiber Package", "reason": "Visual drama."},{"name": "Recaro Seats", "reason": "Better support than standard."}]'::jsonb,
  price_guide = '{"low": {"price": "$42,000", "condition": "Higher mileage"}, "mid": {"price": "$55,000", "condition": "30-50K miles"}, "high": {"price": "$72,000+", "condition": "Low miles, loaded"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,500", "typical": "$4,500", "heavy": "$8,000+", "notes": "American luxury costs. LT4 maintenance reasonable."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '7',
  notable_reviews = '[{"source": "Motor Trend", "quote": "The CTS-V proves America can build a world-class super sedan.", "rating": "9/10"}]'::jsonb,
  expert_quotes = '[{"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The CTS-V has more power than it needs. It''s violently fast."}]'::jsonb
WHERE slug = 'cadillac-cts-v-gen3';


-- ============================================================================
-- CHEVROLET CORVETTE C6 Z06 (2006-2013)
-- ============================================================================
UPDATE cars SET
  brand = 'Chevrolet',
  country = 'United States',
  essence = 'The naturally aspirated American hero—505 horsepower of LS7 fury in an aluminum chassis that embarrassed supercars.',
  heritage = E'The C6 Z06 proved that American engineering could match the world. The 7.0L LS7 V8 produced 505 horsepower without forced induction—at a time when nothing else came close at the price.\n\nThe aluminum frame saved 136 pounds over steel. The dry-sump oiling allowed flat-out track use. The Z06 could embarrass Ferraris on a road course and then drive home.\n\nThis was the car that changed how the world viewed American sports cars.',
  design_philosophy = 'Maximum naturally aspirated performance with genuine track capability. Corvette Racing DNA for the street.',
  generation_code = 'C6',
  predecessors = '["Chevrolet Corvette C5 Z06 (2001-2004)"]'::jsonb,
  successors = '["Chevrolet Corvette C7 Z06 (2015-2019)"]'::jsonb,
  engine_character = E'The 7.0L LS7 is one of the greatest American engines ever made. 505 horsepower, naturally aspirated, revving to 7,000 RPM. Hand-built in Wixom, Michigan.\n\nPower delivery is immediate and linear. It pulls hard from idle to redline with increasing intensity.',
  transmission_feel = '6-speed manual (Tremec T56) is excellent. Well-matched ratios, direct engagement.',
  chassis_dynamics = E'Aluminum frame and magnesium components create excellent weight distribution. The chassis is capable of supercar-level grip and lap times.',
  steering_feel = 'Hydraulic power steering with good feedback. You know what the front tires are doing.',
  brake_confidence = 'Massive brakes handle repeated track use. Stock system is track-ready.',
  sound_signature = 'The 7.0L V8 sounds like America—deep, mechanical, purposeful. No exhaust crackling—just pure V8.',
  comfort_track_balance = 'track-focused',
  comfort_notes = 'Firm Z06 suspension isn''t comfortable. This is a track car that can drive home.',
  defining_strengths = '[
    {"title": "LS7 Engine", "description": "505hp naturally aspirated V8. One of the greatest American engines ever."},
    {"title": "Aluminum Chassis", "description": "Light weight improves everything. Genuine exotic construction."},
    {"title": "Track Capability", "description": "Designed for road course performance. Cooling and brakes work."},
    {"title": "Manual Transmission", "description": "6-speed manual with excellent feel."},
    {"title": "Value", "description": "Supercar performance at sports car prices."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Valve Guide Failure", "description": "LS7 has known valve guide issue. Verify service history or upgrade."},
    {"title": "Head Gasket Concerns", "description": "Some engines have issues. Research specific cars."},
    {"title": "Harsh Ride", "description": "Z06 suspension isn''t comfortable. Track-focused."},
    {"title": "Interior Quality", "description": "GM interior. Functional but not luxurious."}
  ]'::jsonb,
  ideal_owner = 'Naturally aspirated V8 enthusiasts. Track day participants. Value-focused performance seekers.',
  not_ideal_for = 'Comfort seekers. Those worried about LS7 issues. Daily commuters.',
  buyers_summary = 'Research LS7 valve guide status before buying. Have compression and leakdown tests done. Track use cars need extra inspection.',
  best_years_detailed = '[{"years": "2009-2013", "reason": "Later cars may have improved valve guides. Production refinements in place."}]'::jsonb,
  must_have_options = '[{"name": "3LZ Package", "reason": "Full equipment including navigation and premium audio."},{"name": "Z07 Package", "reason": "Enhanced cooling and track capability."}]'::jsonb,
  price_guide = '{"low": {"price": "$42,000", "condition": "Higher mileage, needs attention"}, "mid": {"price": "$55,000", "condition": "40-60K miles, well-maintained"}, "high": {"price": "$75,000+", "condition": "Low miles, documented, Z07 package"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$8,000+", "notes": "Research LS7 issues. Budget for potential valve work."}'::jsonb,
  common_issues_detailed = '[{"issue": "LS7 Valve Guide Failure", "severity": "major", "frequency": "common", "cost": "$4,000-8,000", "notes": "Titanium exhaust valves can drop. Verify status or upgrade."},{"issue": "Head Gasket Issues", "severity": "major", "frequency": "uncommon", "cost": "$3,000-6,000", "notes": "Some engines affected. Compression test reveals condition."}]'::jsonb,
  track_readiness = 'race-bred',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The C6 Z06 proves American engineering can compete with anyone. The LS7 is magnificent.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The C6 Z06 changed what I thought about American sports cars. It''s world-class."}]'::jsonb
WHERE slug = 'chevrolet-corvette-c6-z06';


-- ============================================================================
-- DODGE CHALLENGER HELLCAT (2015-2023)
-- ============================================================================
UPDATE cars SET
  brand = 'Dodge',
  country = 'United States',
  essence = 'The last muscle car—707+ supercharged horsepower in a retro body that celebrates American excess before the electric future.',
  heritage = E'The Hellcat represents the ultimate expression of American muscle car philosophy. 707+ horsepower from a supercharged 6.2L Hemi, rear-wheel drive, and styling that celebrates Dodge heritage.\n\nIn an era of turbo fours and hybridization, Dodge doubled down on displacement. The Hellcat was a middle finger to efficiency—a statement that sometimes more is more.',
  design_philosophy = 'Maximum power, maximum drama, maximum America. Dodge built the muscle car enthusiasts wanted.',
  generation_code = 'LC',
  predecessors = '["Dodge Challenger SRT (2008-2014)"]'::jsonb,
  successors = '["Dodge Challenger (Electric - TBA)"]'::jsonb,
  engine_character = E'The supercharged 6.2L Hemi produces 707-797 horsepower depending on variant. It''s violent, loud, and unapologetically American.',
  transmission_feel = '6-speed manual or 8-speed automatic. Both handle the power. Manual adds engagement.',
  chassis_dynamics = 'Heavy (4,400+ lbs) but capable. The chassis is better than expected for a muscle car.',
  steering_feel = 'Electric steering works for the mission. Not communicative but adequate.',
  brake_confidence = 'Brembo brakes handle the power. Stop well considering the weight.',
  sound_signature = 'Supercharged V8 with supercharger whine. Loud, aggressive, unmistakably American.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Surprisingly comfortable for a muscle car. Good for GT duties.',
  defining_strengths = '[
    {"title": "707+ Horsepower", "description": "Massive supercharged power. Brutal acceleration."},
    {"title": "Manual Available", "description": "6-speed manual option for engagement."},
    {"title": "Retro Style", "description": "Throwback design that celebrates heritage."},
    {"title": "Value", "description": "This much power at this price is rare."},
    {"title": "Last of Its Kind", "description": "The final supercharged muscle car era."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Weight", "description": "4,400+ pounds. Very heavy for a sports car."},
    {"title": "Fuel Economy", "description": "The supercharged Hemi drinks. 15 MPG optimistic."},
    {"title": "Handling", "description": "It''s a straight-line weapon. Curves aren''t its strength."},
    {"title": "Size", "description": "It''s a big car. Parking is challenging."}
  ]'::jsonb,
  ideal_owner = 'Muscle car enthusiasts. Drag racing fans. Those who appreciate excess.',
  not_ideal_for = 'Handling purists. Efficiency seekers. Those who need agility.',
  buyers_summary = 'Manual for engagement, automatic for drag strip. Widebody improves grip. Last of the breed.',
  best_years_detailed = '[{"years": "2019-2023 Widebody", "reason": "Better grip with wider stance."},{"years": "2018-2023 Redeye", "reason": "797hp for maximum power."}]'::jsonb,
  must_have_options = '[{"name": "Widebody Package", "reason": "Wider tires improve grip significantly."},{"name": "6-Speed Manual", "reason": "For engagement."}]'::jsonb,
  price_guide = '{"low": {"price": "$52,000", "condition": "Higher mileage narrow body"}, "mid": {"price": "$68,000", "condition": "Widebody, 15-30K miles"}, "high": {"price": "$95,000+", "condition": "Low-mile Redeye/Jailbreak"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$7,000+", "notes": "Rear tires wear quickly. Budget for rubber."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '9',
  notable_reviews = '[{"source": "Motor Trend", "quote": "The Hellcat is gloriously excessive. It''s the last of the true muscle cars.", "rating": "8/10"}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "TST", "quote": "The Hellcat is absurd and I love it. This is what America does."}]'::jsonb
WHERE slug = 'dodge-challenger-hellcat';


-- ============================================================================
-- DODGE CHARGER HELLCAT (2015-2023)
-- ============================================================================
UPDATE cars SET
  brand = 'Dodge',
  country = 'United States',
  essence = 'The family muscle car—707+ supercharged horsepower with four doors and room for the family.',
  heritage = E'The Charger Hellcat brings Hellcat power to a four-door sedan. Same supercharged Hemi, same absurd power, but with back seats and practicality.\n\nIt''s the ultimate sleeper—a four-door sedan that can embarrass supercars in a straight line while carrying groceries in the back.',
  design_philosophy = 'Why should muscle cars only have two doors? Dodge built the family performance car.',
  generation_code = 'LD',
  predecessors = '["Dodge Charger SRT (2012-2014)"]'::jsonb,
  successors = '["Dodge Charger (Electric - TBA)"]'::jsonb,
  engine_character = 'The supercharged 6.2L Hemi produces 707-797 horsepower. Same brutal power as the Challenger.',
  transmission_feel = '8-speed automatic only. No manual option in the four-door.',
  chassis_dynamics = 'Heavy but capable. Better handling than expected for a big sedan.',
  steering_feel = 'Electric steering adequate for the mission.',
  brake_confidence = 'Brembo brakes handle the power.',
  sound_signature = 'Supercharged V8 thunder. Same glorious noise as the Challenger.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Four-door practicality with muscle car power. Excellent GT capabilities.',
  defining_strengths = '[
    {"title": "707+ Horsepower", "description": "Same Hellcat power in a sedan."},
    {"title": "Four Doors", "description": "Actual back seats. Family friendly."},
    {"title": "Practicality", "description": "Usable trunk, comfortable cruising."},
    {"title": "Sleeper Status", "description": "Looks like a normal Charger. Embarrasses sports cars."},
    {"title": "Value", "description": "This much power with this much space is rare."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Automatic Only", "description": "No manual transmission option."},
    {"title": "Weight", "description": "4,500+ pounds. Very heavy."},
    {"title": "Fuel Economy", "description": "Even thirstier than the Challenger."},
    {"title": "Size", "description": "Big sedan. Parking challenging."}
  ]'::jsonb,
  ideal_owner = 'Family enthusiasts. Those who need space with speed. Sleeper seekers.',
  not_ideal_for = 'Manual transmission fans. Efficiency seekers. Those wanting agility.',
  buyers_summary = 'Widebody for better grip. Redeye for maximum power. Best four-door muscle car ever.',
  best_years_detailed = '[{"years": "2020-2023 Widebody", "reason": "Better grip and stance."},{"years": "2021-2023 Redeye", "reason": "797hp option."}]'::jsonb,
  must_have_options = '[{"name": "Widebody Package", "reason": "Essential for tire grip."}]'::jsonb,
  price_guide = '{"low": {"price": "$48,000", "condition": "Higher mileage narrow body"}, "mid": {"price": "$65,000", "condition": "Widebody, 15-30K miles"}, "high": {"price": "$90,000+", "condition": "Low-mile Redeye"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$7,000+", "notes": "Tires are the main expense."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '9',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The Charger Hellcat is the craziest family sedan ever made.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Doug DeMuro", "outlet": "YouTube", "quote": "The Charger Hellcat is peak absurdity. 700 horsepower with a back seat."}]'::jsonb
WHERE slug = 'dodge-charger-hellcat';


-- ============================================================================
-- LOTUS EXIGE S (2006-2016)
-- ============================================================================
UPDATE cars SET
  brand = 'Lotus',
  country = 'United Kingdom',
  essence = 'The raw Lotus—track-bred intensity in a car that rewards skill and punishes mistakes.',
  heritage = E'The Exige S is the hardcore version of Lotus'' lightweight formula. Supercharged Toyota power in a sub-2,100 pound chassis created one of the most intense driving experiences available.\n\nThe Exige was designed for track days. Fixed roof, aggressive aerodynamics, and minimal sound deadening made it focused in ways road-biased cars couldn''t match.',
  design_philosophy = 'Simplify, add lightness, then add more aero. Colin Chapman''s philosophy taken to the extreme.',
  generation_code = 'Series 2/3',
  predecessors = '["Lotus Exige S1"]'::jsonb,
  successors = '["Lotus Emira (2022+)"]'::jsonb,
  engine_character = 'Supercharged Toyota four-cylinder produces 217-345hp depending on variant. Light weight makes modest power feel like more.',
  transmission_feel = 'Manual only—a precise 6-speed perfectly matched to the character.',
  chassis_dynamics = E'The Exige''s chassis is the benchmark. Sub-2,100 lbs, mid-engine, perfect balance. It rewards precision and punishes sloppiness.',
  steering_feel = 'Hydraulic steering with exceptional feedback. You feel everything.',
  brake_confidence = 'AP Racing brakes with excellent feel. Light weight means moderate brakes are enough.',
  sound_signature = 'Supercharged four-cylinder with Lotus exhaust. Industrial, purposeful.',
  comfort_track_balance = 'track-focused',
  comfort_notes = 'Not comfortable. This is a track car. Entry/exit requires gymnastics.',
  defining_strengths = '[
    {"title": "Light Weight", "description": "Sub-2,100 lbs is incredibly light. Changes everything."},
    {"title": "Chassis Excellence", "description": "Mid-engine balance with Lotus precision. The handling benchmark."},
    {"title": "Hydraulic Steering", "description": "Exceptional feedback. You feel everything."},
    {"title": "Track Focus", "description": "Designed for the track first. Genuine capability."},
    {"title": "Toyota Reliability", "description": "Supercharged Toyota engine is bulletproof."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Not Comfortable", "description": "Harsh ride, loud cabin, difficult entry/exit."},
    {"title": "Build Quality", "description": "Lotus build quality. Not German."},
    {"title": "Limited Space", "description": "No luggage capacity. Pure sports car."},
    {"title": "Hot Cabin", "description": "Heat soak from mid-engine. No AC on some variants."}
  ]'::jsonb,
  ideal_owner = 'Track day enthusiasts. Those who prioritize driving above all else. Weight-obsessed drivers.',
  not_ideal_for = 'Comfort seekers. Those needing any practicality. Casual drivers.',
  buyers_summary = 'Buy for the track experience. Verify service history. Lotus specialist inspection essential.',
  best_years_detailed = '[{"years": "2012-2016 (V6)", "reason": "More power with supercharged V6 option."},{"years": "2006-2011", "reason": "Lighter 4-cylinder cars for purists."}]'::jsonb,
  must_have_options = '[{"name": "Track Pack", "reason": "Essential equipment for track use."},{"name": "AC (if available)", "reason": "Makes street use tolerable."}]'::jsonb,
  price_guide = '{"low": {"price": "$52,000", "condition": "Higher mileage 4-cylinder"}, "mid": {"price": "$72,000", "condition": "V6, reasonable miles"}, "high": {"price": "$95,000+", "condition": "Low-mile V6, documented"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$7,000+", "notes": "Toyota drivetrain keeps costs down."}'::jsonb,
  track_readiness = 'race-bred',
  community_strength = '7',
  notable_reviews = '[{"source": "Evo", "quote": "The Exige is the purest driving experience money can buy. Nothing else feels like this.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The Exige is what driving should be. Pure, raw, unfiltered."}]'::jsonb
WHERE slug = 'lotus-exige-s';


-- ============================================================================
-- PORSCHE 911 TURBO 997.1 (2007-2009)
-- ============================================================================
UPDATE cars SET
  brand = 'Porsche',
  country = 'Germany',
  essence = 'The accessible supercar—twin-turbo, all-wheel-drive, daily usable performance that redefined what 500hp could do.',
  heritage = E'The 997.1 Turbo brought Porsche''s twin-turbo 911 formula to new heights. With 480 horsepower (later 500 in Turbo S), it offered supercar performance with 911 practicality.\n\nThe combination of all-wheel drive, variable turbine geometry turbos, and Porsche engineering created a car that was devastatingly fast yet usable every day.',
  design_philosophy = 'Maximum performance with daily usability. The Turbo must be fast everywhere, all the time.',
  generation_code = '997.1',
  predecessors = '["Porsche 911 Turbo 996 (2001-2005)"]'::jsonb,
  successors = '["Porsche 911 Turbo 997.2 (2010-2013)"]'::jsonb,
  engine_character = E'The 3.6L twin-turbo flat-six produces 480hp (500hp in Turbo S). VTG turbos minimize lag, and power delivery is explosive.',
  transmission_feel = 'Manual (6-speed) or Tiptronic S. Manual is more engaging; Tiptronic is adequate.',
  chassis_dynamics = 'AWD provides incredible traction. The 997 chassis is balanced and capable.',
  steering_feel = 'Hydraulic power steering with excellent feedback. The 997 steering is a highlight.',
  brake_confidence = 'PCCB optional. Standard brakes are excellent.',
  sound_signature = 'Turbocharged flat-six with turbo sounds. Distinctive Porsche character.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Genuine daily driver. Comfortable, practical, reliable.',
  defining_strengths = '[
    {"title": "Hydraulic Steering", "description": "The last Turbo generation with hydraulic steering feel."},
    {"title": "All-Weather Performance", "description": "AWD makes it usable in any conditions."},
    {"title": "Daily Usability", "description": "Practical, comfortable, reliable. Real GT car."},
    {"title": "VTG Turbos", "description": "Minimal lag with variable geometry turbos."},
    {"title": "Manual Available", "description": "6-speed manual for engagement."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "No Manual on Later Cars", "description": "PDK replaced manual on 997.2. This is the last manual Turbo era."},
    {"title": "Tiptronic Dated", "description": "The automatic is slow by modern standards. PDK is much better."},
    {"title": "Running Costs", "description": "Porsche Turbo ownership isn''t cheap."}
  ]'::jsonb,
  ideal_owner = 'Those wanting hydraulic steering with Turbo power. Manual transmission seekers. All-weather performance enthusiasts.',
  not_ideal_for = 'Budget-conscious. Those wanting modern tech. PDK seekers should look at 997.2.',
  buyers_summary = 'Manual transmission cars are most desirable. Turbo S for maximum power. PASM and Sport Chrono recommended.',
  best_years_detailed = '[{"years": "2007-2009", "reason": "All 997.1 Turbo years excellent. Manual available throughout."}]'::jsonb,
  must_have_options = '[{"name": "6-Speed Manual", "reason": "Last manual Turbo era. Worth the premium."},{"name": "Sport Chrono", "reason": "Essential features."}]'::jsonb,
  price_guide = '{"low": {"price": "$68,000", "condition": "Higher mileage Tiptronic"}, "mid": {"price": "$88,000", "condition": "Manual, 40-60K miles"}, "high": {"price": "$125,000+", "condition": "Low-mile manual Turbo S"}}'::jsonb,
  annual_ownership_cost = '{"low": "$3,500", "typical": "$6,000", "heavy": "$12,000+", "notes": "Porsche Turbo costs."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '9',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The 997 Turbo is the everyday supercar. Nothing else does this combination.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The 997 Turbo with a manual is special. It''s the last of its kind."}]'::jsonb
WHERE slug = 'porsche-911-turbo-997-1';


-- ============================================================================
-- PORSCHE 911 GT3 996 (2004-2005)
-- ============================================================================
UPDATE cars SET
  brand = 'Porsche',
  country = 'Germany',
  essence = 'The misunderstood classic—the same naturally aspirated GT3 magic in the controversial 996 body, now recognized as special.',
  heritage = E'The 996 GT3 brought Porsche''s Mezger-derived flat-six and track-focused chassis to the controversial "fried egg" generation. While the 996 was initially dismissed, the GT3 proved that the fundamentals were sound.\n\nWith 381 horsepower and a chassis tuned by Porsche Motorsport, the 996 GT3 delivered the same engaging experience as later GT3s—at a fraction of the current price.',
  design_philosophy = 'GT3 philosophy in 996 form. Track-focused, naturally aspirated, manual only.',
  generation_code = '996.2 GT3',
  predecessors = '["Porsche 911 GT3 996.1 (1999-2001)"]'::jsonb,
  successors = '["Porsche 911 GT3 997.1 (2007-2009)"]'::jsonb,
  engine_character = E'The 3.6L Mezger-derived flat-six produces 381 horsepower. It revs to 8,200 RPM with the same character that made later GT3s legendary.',
  transmission_feel = 'Manual only—6-speed with precise throws and engaging feel.',
  chassis_dynamics = 'Porsche Motorsport suspension creates exceptional handling. The 996 GT3 is genuinely engaging.',
  steering_feel = 'Hydraulic power steering with excellent feedback. True GT3 communication.',
  brake_confidence = 'Track-capable brakes with PCCB optional.',
  sound_signature = 'Mezger flat-six wail. The same intoxicating sound as later GT3s.',
  comfort_track_balance = 'track-focused',
  comfort_notes = 'Firm GT3 character. Not comfortable but livable.',
  defining_strengths = '[
    {"title": "GT3 Experience at Lower Price", "description": "Same Mezger engine character as later GT3s. More affordable entry."},
    {"title": "Hydraulic Steering", "description": "Exceptional feedback like all GT3s."},
    {"title": "Naturally Aspirated", "description": "8,200 RPM of flat-six fury."},
    {"title": "Manual Only", "description": "No automatic option. Pure GT3."},
    {"title": "Future Classic", "description": "Values are rising as the car is recognized."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "996 Styling", "description": "The fried egg headlights are polarizing. Some hate the look."},
    {"title": "IMS Bearing", "description": "Earlier 996 GT3s had IMS concerns. Verify status."},
    {"title": "Age", "description": "Now 20+ years old. Age-related maintenance inevitable."},
    {"title": "Bore Scoring Risk", "description": "Some engines have issues. Research carefully."}
  ]'::jsonb,
  ideal_owner = 'GT3 seekers on a budget. Those who appreciate driving over styling. Collectors recognizing future classic status.',
  not_ideal_for = 'Those bothered by 996 styling. Budget-limited buyers—it''s still a GT3 to maintain.',
  buyers_summary = 'Verify IMS bearing status. Have Porsche specialist inspect. The engine is the same Mezger magic.',
  best_years_detailed = '[{"years": "2004-2005", "reason": "GT3 with updates. All are 996.2 generation."}]'::jsonb,
  must_have_options = '[{"name": "Sport Chrono", "reason": "Essential features."},{"name": "Clubsport", "reason": "Roll bar and harnesses for track use."}]'::jsonb,
  price_guide = '{"low": {"price": "$72,000", "condition": "Higher mileage, needs work"}, "mid": {"price": "$95,000", "condition": "40-60K miles, well-maintained"}, "high": {"price": "$135,000+", "condition": "Low-mile, documented, exceptional"}}'::jsonb,
  annual_ownership_cost = '{"low": "$4,000", "typical": "$6,500", "heavy": "$12,000+", "notes": "GT3 ownership costs. Age-related items add up."}'::jsonb,
  track_readiness = 'race-bred',
  community_strength = '8',
  notable_reviews = '[{"source": "Evo", "quote": "The 996 GT3 is the same magic as later cars. Don''t let the headlights fool you.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The 996 GT3 is the affordable GT3. Same engine, same character, different headlights."}]'::jsonb
WHERE slug = 'porsche-911-gt3-996';


-- ============================================================================
-- MERCEDES-AMG GT (2015-2020)
-- ============================================================================
UPDATE cars SET
  brand = 'Mercedes-AMG',
  country = 'Germany',
  essence = 'AMG''s first clean-sheet sports car—a front-mid V8 weapon that proves Mercedes can build genuine driver''s cars.',
  heritage = E'The AMG GT was Mercedes'' first sports car developed entirely in-house by AMG. With a twin-turbo V8 mounted behind the front axle, it delivered supercar proportions and performance.\n\nAMG positioned it as a 911 fighter—not quite supercar, not merely sports car. The result was something unique in the Mercedes lineup.',
  design_philosophy = 'AMG''s vision of the pure sports car. Front-mid engine for balance, twin-turbo for power, two seats for focus.',
  generation_code = 'C190',
  predecessors = '["Mercedes-Benz SLS AMG (2010-2014)"]'::jsonb,
  successors = '["Mercedes-AMG GT (C192) 2024+"]'::jsonb,
  engine_character = E'The 4.0L twin-turbo V8 produces 469-577hp depending on variant. Hot-V design provides quick boost response.',
  transmission_feel = '7-speed DCT (AMG Speedshift) is quick and aggressive. No manual option.',
  chassis_dynamics = 'Front-mid engine creates excellent weight distribution. The chassis is capable and engaging.',
  steering_feel = 'Electric steering is well-weighted and reasonably communicative for a Mercedes.',
  brake_confidence = 'AMG brakes are excellent. Carbon ceramics optional.',
  sound_signature = 'AMG V8 character—burbling, cracking, aggressive.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Sports car compromises apply. Firm but livable.',
  defining_strengths = '[
    {"title": "AMG V8 Character", "description": "The twin-turbo V8 has genuine AMG personality."},
    {"title": "Front-Mid Engine", "description": "Engine behind front axle improves balance."},
    {"title": "Exotic Proportions", "description": "Long hood, short deck. Looks expensive."},
    {"title": "Mercedes Quality", "description": "German build quality and materials."},
    {"title": "Multiple Variants", "description": "From GT to GT R, there''s a specification for everyone."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "No Manual", "description": "DCT only. No clutch pedal option."},
    {"title": "Interior Space", "description": "Two seats only. Limited luggage space."},
    {"title": "Complexity", "description": "Mercedes tech means potential issues."},
    {"title": "Depreciation", "description": "Values have dropped significantly."}
  ]'::jsonb,
  ideal_owner = 'Mercedes enthusiasts wanting a sports car. Those who appreciate V8 character. GT buyers seeking two-seat focus.',
  not_ideal_for = 'Manual transmission seekers. Those needing practicality. Budget-limited buyers.',
  buyers_summary = 'GT S or GT R for serious performance. Standard GT is still capable. Verify maintenance.',
  best_years_detailed = '[{"years": "2018-2020", "reason": "Updates and refinements in place."},{"years": "2017-2020 GT R", "reason": "Maximum track capability."}]'::jsonb,
  must_have_options = '[{"name": "GT S or GT R Specification", "reason": "More power and capability."},{"name": "AMG Exhaust", "reason": "Better sound."}]'::jsonb,
  price_guide = '{"low": {"price": "$68,000", "condition": "Higher mileage base GT"}, "mid": {"price": "$85,000", "condition": "GT S, 25-40K miles"}, "high": {"price": "$135,000+", "condition": "Low-mile GT R"}}'::jsonb,
  annual_ownership_cost = '{"low": "$3,000", "typical": "$5,500", "heavy": "$10,000+", "notes": "Mercedes-AMG ownership costs."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '6',
  notable_reviews = '[{"source": "Top Gear", "quote": "The AMG GT is Mercedes'' answer to Porsche. It''s a genuine sports car.", "rating": "8/10"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The AMG GT R is properly fast. AMG built a real sports car."}]'::jsonb
WHERE slug = 'mercedes-amg-gt';


-- ============================================================================
-- FINAL VERIFICATION: ALL UPPER-MID TIER CARS
-- ============================================================================
SELECT 
  name, 
  slug, 
  tier,
  essence IS NOT NULL AS has_essence,
  jsonb_array_length(COALESCE(defining_strengths, '[]'::jsonb)) AS num_strengths
FROM cars 
WHERE tier = 'upper-mid'
ORDER BY name;






