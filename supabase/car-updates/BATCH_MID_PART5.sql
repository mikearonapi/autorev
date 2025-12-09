-- ============================================================================
-- BATCH UPDATE: MID TIER CARS - PART 5
-- 
-- Cars: E63 W212, CTS-V Gen2, C6 Grand Sport, Challenger 392, Charger 392, 
--       Boss 302, Elise S2
-- ============================================================================


-- ============================================================================
-- MERCEDES-AMG E63 W212 (2012-2016)
-- ============================================================================
UPDATE cars SET
  brand = 'Mercedes-AMG',
  country = 'Germany',
  essence = 'The twin-turbo E-Class—AMG V8 power in executive clothing.',
  heritage = 'The W212 E63 brought the twin-turbo 5.5L V8 to the E-Class. With 550-577hp, it delivered devastating performance with luxury sedan comfort.',
  design_philosophy = 'Maximum AMG V8 power in executive sedan wrapper.',
  generation_code = 'W212',
  predecessors = '["Mercedes-AMG E63 W211"]'::jsonb,
  successors = '["Mercedes-AMG E63 W213 (2017+)"]'::jsonb,
  engine_character = 'The M157 5.5L twin-turbo V8 produces 550-577hp with brutal torque.',
  transmission_feel = 'AMG Speedshift 7-speed. Quick and capable.',
  chassis_dynamics = 'Capable with 4MATIC option. Comfortable at speed.',
  steering_feel = 'Electric steering. Typical AMG character.',
  brake_confidence = 'AMG brakes adequate for the mission.',
  sound_signature = 'AMG V8 character with burbles.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Executive comfort with serious performance.',
  defining_strengths = '[
    {"title": "5.5L Twin-Turbo V8", "description": "550-577hp of AMG power."},
    {"title": "Executive Comfort", "description": "Full-size sedan luxury."},
    {"title": "4MATIC Option", "description": "All-weather capability."},
    {"title": "Depreciation", "description": "Excellent value now."},
    {"title": "AMG Character", "description": "Proper V8 drama."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Age", "description": "8-12 years old now."},
    {"title": "Heavy", "description": "Full-size sedan weight."},
    {"title": "Running Costs", "description": "AMG maintenance."}
  ]'::jsonb,
  ideal_owner = 'Executive express seekers. V8 enthusiasts. Value-focused performance buyers.',
  not_ideal_for = 'Agility seekers. Budget-limited.',
  buyers_summary = 'S model for 577hp. 4MATIC for all-weather. Great used value.',
  best_years_detailed = '[{"years": "2014-2016", "reason": "Updates and S model availability."}]'::jsonb,
  must_have_options = '[{"name": "S Model", "reason": "577hp, Performance Package."},{"name": "4MATIC", "reason": "All-weather capability."}]'::jsonb,
  price_guide = '{"low": {"price": "$32,000", "condition": "Base, higher miles"}, "mid": {"price": "$48,000", "condition": "S, 40-70K miles"}, "high": {"price": "$62,000+", "condition": "Low-mile S"}}'::jsonb,
  annual_ownership_cost = '{"low": "$3,000", "typical": "$5,000", "heavy": "$10,000+", "notes": "AMG V8 ownership costs."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '7',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The E63 S is executive express perfection.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The E63 does what it needs to do brutally well."}]'::jsonb
WHERE slug = 'mercedes-amg-e63-w212';


-- ============================================================================
-- CADILLAC CTS-V GEN2 (2009-2014)
-- ============================================================================
UPDATE cars SET
  brand = 'Cadillac',
  country = 'United States',
  essence = 'The LSA supercharged American executive—Corvette ZR1 power in a luxury sedan.',
  heritage = E'The Gen 2 CTS-V shared its LSA supercharged V8 with the Corvette ZR1. 556hp in a luxury sedan that could embarrass German rivals at a fraction of the cost.',
  design_philosophy = 'Maximum American V8 power in luxury sedan form.',
  generation_code = 'Gen 2',
  predecessors = '["Cadillac CTS-V Gen 1"]'::jsonb,
  successors = '["Cadillac CTS-V Gen 3 (2016-2019)"]'::jsonb,
  engine_character = 'The LSA 6.2L supercharged V8 produces 556hp with American muscle character.',
  transmission_feel = 'Manual (6-speed) or automatic. Manual is the enthusiast choice.',
  chassis_dynamics = 'Magnetic Ride provides capability.',
  steering_feel = 'Electric steering adequate.',
  brake_confidence = 'Brembo brakes handle the power.',
  sound_signature = 'Supercharged V8 with American rumble.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Comfortable enough for daily use.',
  defining_strengths = '[
    {"title": "556hp LSA", "description": "Corvette ZR1 power."},
    {"title": "Manual Available", "description": "6-speed for engagement."},
    {"title": "Value", "description": "German-beating performance at fraction of cost."},
    {"title": "Magnetic Ride", "description": "Excellent adaptive suspension."},
    {"title": "Depreciation", "description": "Incredible value now."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Age", "description": "10-15 years old."},
    {"title": "Interior", "description": "Not German quality."},
    {"title": "Dealer Support", "description": "Cadillac service varies."}
  ]'::jsonb,
  ideal_owner = 'American V8 enthusiasts. Manual seekers. Value-focused performance buyers.',
  not_ideal_for = 'German quality seekers. Badge-conscious.',
  buyers_summary = 'Manual transmission preferred. Wagon is ultra-rare. Great value.',
  best_years_detailed = '[{"years": "2011-2014", "reason": "All updates, available in wagon."}]'::jsonb,
  must_have_options = '[{"name": "Manual Transmission", "reason": "Essential for engagement."},{"name": "Wagon", "reason": "Rare and special."}]'::jsonb,
  price_guide = '{"low": {"price": "$25,000", "condition": "Auto, higher miles"}, "mid": {"price": "$38,000", "condition": "Manual sedan, 50-80K miles"}, "high": {"price": "$75,000+", "condition": "Manual wagon, low miles"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$8,000+", "notes": "LSA is reliable with maintenance."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '8',
  notable_reviews = '[{"source": "Motor Trend", "quote": "The CTS-V is American performance at its best.", "rating": "9/10"}]'::jsonb,
  expert_quotes = '[{"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The CTS-V with a manual is fantastic. The value is incredible."}]'::jsonb
WHERE slug = 'cadillac-cts-v-gen2';


-- ============================================================================
-- CHEVROLET CORVETTE C6 GRAND SPORT (2010-2013)
-- ============================================================================
UPDATE cars SET
  brand = 'Chevrolet',
  country = 'United States',
  essence = 'The wide-body LS3—Z06 looks with Corvette reliability.',
  heritage = 'The C6 Grand Sport combined Z06 wide-body styling with the proven LS3 engine. It offered the aggressive looks without the exotic LS7 maintenance.',
  design_philosophy = 'Z06 presence with mainstream reliability.',
  generation_code = 'C6',
  predecessors = '[]'::jsonb,
  successors = '["Corvette C7 Grand Sport"]'::jsonb,
  engine_character = 'The LS3 6.2L V8 produces 436hp with proven reliability.',
  transmission_feel = 'Manual (6-speed) or automatic. Manual for engagement.',
  chassis_dynamics = 'Wide-body with capable suspension.',
  steering_feel = 'Hydraulic steering with good feedback.',
  brake_confidence = 'Good brakes.',
  sound_signature = 'American V8 character.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Corvette compromises but livable.',
  defining_strengths = '[
    {"title": "Wide-Body Styling", "description": "Z06 looks."},
    {"title": "LS3 Reliability", "description": "Proven engine without LS7 issues."},
    {"title": "Manual Available", "description": "6-speed option."},
    {"title": "Value", "description": "Wide-body at lower cost than Z06."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Not Z06 Power", "description": "436hp vs 505hp."},
    {"title": "C6 Interior", "description": "Dated."},
    {"title": "Age", "description": "11-14 years old."}
  ]'::jsonb,
  ideal_owner = 'Those wanting Z06 looks without the issues. Value seekers.',
  not_ideal_for = 'Power seekers. Those wanting modern amenities.',
  buyers_summary = 'Manual preferred. Great value for wide-body looks.',
  best_years_detailed = '[{"years": "2010-2013", "reason": "All GS years good."}]'::jsonb,
  must_have_options = '[{"name": "Manual Transmission", "reason": "For engagement."}]'::jsonb,
  price_guide = '{"low": {"price": "$28,000", "condition": "Auto, higher miles"}, "mid": {"price": "$38,000", "condition": "Manual, 40-60K miles"}, "high": {"price": "$52,000+", "condition": "Low-mile manual"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$3,000", "heavy": "$5,000+", "notes": "LS3 is cheap to maintain."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The Grand Sport is the sensible Corvette.", "rating": "4/5"}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "TST", "quote": "The C6 GS is the smart choice. LS3 reliability with Z06 presence."}]'::jsonb
WHERE slug = 'chevrolet-corvette-c6-grand-sport';


-- ============================================================================
-- DODGE CHALLENGER SRT 392 (2011-2023)
-- ============================================================================
UPDATE cars SET
  brand = 'Dodge',
  country = 'United States',
  essence = 'The accessible muscle—485hp of Hemi V8 without Hellcat insurance.',
  heritage = 'The SRT 392 brought serious power with Hemi 6.4L naturally aspirated V8. 485hp was enough for most without the Hellcat''s complexity and insurance costs.',
  design_philosophy = 'Maximum naturally aspirated Hemi power.',
  generation_code = 'LC',
  predecessors = '[]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The 6.4L Hemi produces 485hp with classic American V8 character.',
  transmission_feel = 'Manual (6-speed) or 8-speed automatic. Manual adds engagement.',
  chassis_dynamics = 'Muscle car handling. Better than expected but still heavy.',
  steering_feel = 'Electric steering adequate.',
  brake_confidence = 'Brembo brakes handle the power.',
  sound_signature = 'Naturally aspirated Hemi rumble.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Surprisingly comfortable GT cruiser.',
  defining_strengths = '[
    {"title": "6.4L Hemi", "description": "485hp NA V8 character."},
    {"title": "Manual Available", "description": "6-speed option."},
    {"title": "Value", "description": "Serious power at reasonable price."},
    {"title": "Retro Style", "description": "Iconic muscle car looks."},
    {"title": "Lower Insurance", "description": "Less than Hellcat."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Heavy", "description": "4,200+ lbs."},
    {"title": "Handling", "description": "Muscle car, not sports car."},
    {"title": "Fuel Economy", "description": "Thirsty Hemi."}
  ]'::jsonb,
  ideal_owner = 'Muscle car enthusiasts. NA V8 appreciators. Value seekers.',
  not_ideal_for = 'Handling focused. Efficiency seekers.',
  buyers_summary = 'Widebody for better grip. Manual for engagement. Great value.',
  best_years_detailed = '[{"years": "2019-2023 Widebody", "reason": "Better grip."}]'::jsonb,
  must_have_options = '[{"name": "Widebody", "reason": "Wider tires for grip."},{"name": "Manual", "reason": "For engagement."}]'::jsonb,
  price_guide = '{"low": {"price": "$32,000", "condition": "Auto narrow body"}, "mid": {"price": "$42,000", "condition": "Widebody, 20-40K miles"}, "high": {"price": "$55,000+", "condition": "Low-mile Widebody manual"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$3,000", "heavy": "$6,000+", "notes": "American muscle costs."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '9',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The 392 is the sweet spot. Enough power, reasonable insurance.", "rating": "4/5"}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "TST", "quote": "The Scat Pack is the smart Challenger. Hellcat drama without the costs."}]'::jsonb
WHERE slug = 'dodge-challenger-srt-392';


-- ============================================================================
-- DODGE CHARGER SRT 392 (2012-2023)
-- ============================================================================
UPDATE cars SET
  brand = 'Dodge',
  country = 'United States',
  essence = 'The family muscle—485hp Hemi with four doors and real back seats.',
  heritage = 'The Charger SRT 392 brought Challenger power to the four-door. Family car with muscle car heart.',
  design_philosophy = 'Maximum Hemi power in a practical sedan.',
  generation_code = 'LD',
  predecessors = '[]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The 6.4L Hemi produces 485hp with NA V8 character.',
  transmission_feel = '8-speed automatic. No manual option.',
  chassis_dynamics = 'Better than expected for a full-size sedan.',
  steering_feel = 'Electric steering adequate.',
  brake_confidence = 'Brembo brakes.',
  sound_signature = 'Hemi rumble.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Genuine four-door comfort.',
  defining_strengths = '[
    {"title": "6.4L Hemi", "description": "485hp NA V8."},
    {"title": "Four Doors", "description": "Actual practicality."},
    {"title": "Value", "description": "Muscle sedan pricing."},
    {"title": "Sleeper Status", "description": "Looks like a Charger, runs like muscle."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Automatic Only", "description": "No manual."},
    {"title": "Heavy", "description": "Full-size sedan weight."},
    {"title": "Fuel Economy", "description": "Hemi thirst."}
  ]'::jsonb,
  ideal_owner = 'Family muscle seekers. Those needing four doors with power.',
  not_ideal_for = 'Manual fans. Efficiency seekers.',
  buyers_summary = 'Widebody for better grip. Excellent value proposition.',
  best_years_detailed = '[{"years": "2019-2023 Widebody", "reason": "Better grip."}]'::jsonb,
  must_have_options = '[{"name": "Widebody", "reason": "Better tire grip."}]'::jsonb,
  price_guide = '{"low": {"price": "$28,000", "condition": "Narrow body, higher miles"}, "mid": {"price": "$42,000", "condition": "Widebody, 20-40K miles"}, "high": {"price": "$55,000+", "condition": "Low-mile Widebody"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$3,000", "heavy": "$6,000+", "notes": "Charger costs."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '9',
  notable_reviews = '[{"source": "Motor Trend", "quote": "The Scat Pack Charger is the practical performance choice.", "rating": "4/5"}]'::jsonb,
  expert_quotes = '[{"person": "Doug DeMuro", "outlet": "YouTube", "quote": "The Charger Scat Pack is the thinking person''s muscle sedan."}]'::jsonb
WHERE slug = 'dodge-charger-srt-392';


-- ============================================================================
-- FORD MUSTANG BOSS 302 (2012-2013)
-- ============================================================================
UPDATE cars SET
  brand = 'Ford',
  country = 'United States',
  essence = 'The track-focused Coyote—high-revving V8 with roadcourse DNA.',
  heritage = E'The Boss 302 was Ford''s track-focused Mustang before the Shelby GT350. The 5.0L Coyote V8 revved to 7,500 RPM with aggressive chassis tuning for road course performance.',
  design_philosophy = 'Road course Mustang. High-revving, track-focused.',
  generation_code = 'S197',
  predecessors = '["Ford Mustang Boss 302 (1969-1970)"]'::jsonb,
  successors = '["Ford Shelby GT350 (2016-2020)"]'::jsonb,
  engine_character = 'The 5.0L Coyote produces 444hp and revs to 7,500 RPM.',
  transmission_feel = 'Manual only—6-speed with good engagement.',
  chassis_dynamics = 'Track-focused suspension with Ford Racing upgrades.',
  steering_feel = 'Electric steering adequate.',
  brake_confidence = 'Brembo brakes.',
  sound_signature = 'High-revving Coyote V8.',
  comfort_track_balance = 'track-focused',
  comfort_notes = 'Firm. This is a track car.',
  defining_strengths = '[
    {"title": "High-Revving Coyote", "description": "7,500 RPM capability."},
    {"title": "Manual Only", "description": "No auto option."},
    {"title": "Track Focus", "description": "Road course DNA."},
    {"title": "Limited Production", "description": "Collectible now."},
    {"title": "Value", "description": "Predecessor to GT350."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Firm Ride", "description": "Track-focused suspension."},
    {"title": "S197 Age", "description": "11-12 years old now."},
    {"title": "Daily Challenge", "description": "Not comfortable for commuting."}
  ]'::jsonb,
  ideal_owner = 'Track day enthusiasts. Coyote fans. Mustang collectors.',
  not_ideal_for = 'Comfort seekers. Daily drivers.',
  buyers_summary = 'Laguna Seca Edition is most hardcore. Verify track history.',
  best_years_detailed = '[{"years": "2012-2013", "reason": "Only years produced. Both excellent."}]'::jsonb,
  must_have_options = '[{"name": "Laguna Seca Edition", "reason": "Most track-focused."},{"name": "Recaro Seats", "reason": "Better support."}]'::jsonb,
  price_guide = '{"low": {"price": "$32,000", "condition": "Higher miles"}, "mid": {"price": "$42,000", "condition": "30-50K miles"}, "high": {"price": "$58,000+", "condition": "Low-mile Laguna Seca"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$3,000", "heavy": "$6,000+", "notes": "Ford parts availability."}'::jsonb,
  track_readiness = 'race-bred',
  community_strength = '8',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The Boss 302 is what Mustangs should be. Track-focused excellence.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The Boss 302 showed what Ford could do. The GT350 inherited this DNA."}]'::jsonb
WHERE slug = 'ford-mustang-boss-302';


-- ============================================================================
-- LOTUS ELISE S2 (2005-2011)
-- ============================================================================
UPDATE cars SET
  brand = 'Lotus',
  country = 'United Kingdom',
  essence = 'Pure driving distilled—Toyota reliability in the lightest modern sports car.',
  heritage = E'The Series 2 Elise brought improved refinement while keeping the lightweight philosophy. Toyota engines provided reliability. The result was the purest driving experience available.',
  design_philosophy = 'Simplify, add lightness. The Lotus philosophy perfected.',
  generation_code = 'Series 2',
  predecessors = '["Lotus Elise Series 1"]'::jsonb,
  successors = '["Lotus Elise Series 3"]'::jsonb,
  engine_character = 'Toyota 1.8L (1ZZ or 2ZZ) produces 134-218hp. Light weight makes it feel faster.',
  transmission_feel = 'Manual only—5 or 6-speed with direct engagement.',
  chassis_dynamics = 'The benchmark for lightweight handling. Nothing else feels like this.',
  steering_feel = 'Unassisted steering with pure mechanical feel.',
  brake_confidence = 'Light weight means modest brakes are enough.',
  sound_signature = 'Toyota four-cylinder with Lotus character.',
  comfort_track_balance = 'track-focused',
  comfort_notes = 'Not comfortable. Pure sports car.',
  defining_strengths = '[
    {"title": "Light Weight", "description": "Under 2,000 lbs. Changes everything."},
    {"title": "Toyota Reliability", "description": "Bulletproof engines."},
    {"title": "Pure Handling", "description": "The benchmark."},
    {"title": "Manual Only", "description": "No automatic."},
    {"title": "Unassisted Steering", "description": "Pure mechanical feel."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Not Comfortable", "description": "Pure sports car compromises."},
    {"title": "Entry/Exit", "description": "Requires flexibility."},
    {"title": "Build Quality", "description": "Lotus quality, not German."},
    {"title": "No Luggage", "description": "Minimal storage."}
  ]'::jsonb,
  ideal_owner = 'Pure driving enthusiasts. Weight-obsessed. Track day regulars.',
  not_ideal_for = 'Comfort seekers. Those needing practicality.',
  buyers_summary = 'SC (supercharged) for more power. Verify service history.',
  best_years_detailed = '[{"years": "2008-2011", "reason": "SC option available."}]'::jsonb,
  must_have_options = '[{"name": "SC (Supercharged)", "reason": "More power for same weight."}]'::jsonb,
  price_guide = '{"low": {"price": "$32,000", "condition": "Higher miles NA"}, "mid": {"price": "$45,000", "condition": "SC, 25-40K miles"}, "high": {"price": "$62,000+", "condition": "Low-mile SC, options"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$3,000", "heavy": "$6,000+", "notes": "Toyota drivetrain keeps costs down."}'::jsonb,
  track_readiness = 'race-bred',
  community_strength = '7',
  notable_reviews = '[{"source": "Evo", "quote": "The Elise is the purest driving experience money can buy.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The Elise is what driving is about. Nothing else comes close to this feeling."}]'::jsonb
WHERE slug = 'lotus-elise-s2';


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
WHERE slug IN ('mercedes-amg-e63-w212', 'cadillac-cts-v-gen2', 'chevrolet-corvette-c6-grand-sport', 'dodge-challenger-srt-392', 'dodge-charger-srt-392', 'ford-mustang-boss-302', 'lotus-elise-s2')
ORDER BY name;






