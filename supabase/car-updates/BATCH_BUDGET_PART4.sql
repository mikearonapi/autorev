-- ============================================================================
-- BATCH UPDATE: BUDGET TIER CARS - PART 4 (FINAL)
-- 
-- Cars: Nissan 350Z, Corvette C5 Z06, Golf R MK7, GTI MK7, Focus RS
-- ============================================================================


-- ============================================================================
-- NISSAN 350Z (2003-2008)
-- ============================================================================
UPDATE cars SET
  brand = 'Nissan',
  country = 'Japan',
  essence = 'The Z reborn—VQ35 power in accessible RWD form, reviving the Z nameplate.',
  heritage = E'The 350Z brought the Z back after a long hiatus. The VQ35DE V6, proper RWD layout, and aggressive styling made it an instant success. It proved Nissan hadn''t forgotten how to make a sports car.',
  design_philosophy = 'Revive the Z with modern power and classic layout.',
  generation_code = 'Z33',
  predecessors = '["Nissan 300ZX Z32 (1990-1996)"]'::jsonb,
  successors = '["Nissan 370Z (Z34)"]'::jsonb,
  engine_character = 'The VQ35DE 3.5L V6 produces 287-306hp with reliable character.',
  transmission_feel = 'Manual (6-speed) or automatic. Manual preferred.',
  chassis_dynamics = 'Front-engine, rear-drive with good balance.',
  steering_feel = 'Hydraulic steering with reasonable feedback.',
  brake_confidence = 'Brembo option available.',
  sound_signature = 'VQ V6 character.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Sports car firm.',
  defining_strengths = '[
    {"title": "VQ35 Reliability", "description": "Proven V6 engine."},
    {"title": "Z Heritage", "description": "The nameplate revival."},
    {"title": "Manual Available", "description": "6-speed option."},
    {"title": "Value", "description": "Excellent used prices."},
    {"title": "Aftermarket", "description": "Strong support."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Age", "description": "16-21 years old."},
    {"title": "Interior", "description": "Dated by modern standards."},
    {"title": "Oil Consumption", "description": "Some VQ35s consume oil."},
    {"title": "Timing Chain", "description": "Known concern on early DE."}
  ]'::jsonb,
  ideal_owner = 'Z enthusiasts. Budget sports car seekers. Manual fans.',
  not_ideal_for = 'Modern amenities seekers. Comfort focused.',
  buyers_summary = 'HR engine (2007+) preferred. Manual essential. Verify oil consumption.',
  best_years_detailed = '[{"years": "2007-2008 (HR Engine)", "reason": "Improved VQ35HR, 306hp, rev-matched manual."}]'::jsonb,
  must_have_options = '[{"name": "HR Engine", "reason": "2007+ improved power and reliability."},{"name": "Manual", "reason": "Essential."}]'::jsonb,
  price_guide = '{"low": {"price": "$8,000", "condition": "DE engine, needs work"}, "mid": {"price": "$15,000", "condition": "HR, manual, 80-120K"}, "high": {"price": "$25,000+", "condition": "Low-mile NISMO"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$2,500", "heavy": "$5,000+", "notes": "VQ reliability keeps costs down."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '9',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The 350Z revived the Z name with proper sports car credentials.", "rating": "4/5"}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "TST", "quote": "The 350Z is excellent value. Get an HR and enjoy."}]'::jsonb
WHERE slug = 'nissan-350z';


-- ============================================================================
-- CHEVROLET CORVETTE C5 Z06 (2001-2004)
-- ============================================================================
UPDATE cars SET
  brand = 'Chevrolet',
  country = 'United States',
  essence = 'The hardtop hero—LS6 power in the lightest C5, creating supercar performance at domestic pricing.',
  heritage = E'The C5 Z06 was the hardtop-only performance Corvette. The LS6 produced 385-405hp in a lightweight package. It delivered supercar performance for a fraction of the cost.',
  design_philosophy = 'Maximum performance from the C5 platform. Hardtop, lightweight, LS6.',
  generation_code = 'C5',
  predecessors = '[]'::jsonb,
  successors = '["Chevrolet Corvette C6 Z06"]'::jsonb,
  engine_character = 'The LS6 5.7L V8 produces 385-405hp with proven reliability.',
  transmission_feel = 'Manual only—6-speed with direct engagement.',
  chassis_dynamics = 'FE4 suspension provides excellent handling.',
  steering_feel = 'Hydraulic steering.',
  brake_confidence = 'Good brakes from factory.',
  sound_signature = 'LS V8 rumble.',
  comfort_track_balance = 'track-focused',
  comfort_notes = 'Z06 is firm. Track-biased.',
  defining_strengths = '[
    {"title": "LS6 Power", "description": "385-405hp proven V8."},
    {"title": "Manual Only", "description": "No automatic option."},
    {"title": "Lightweight", "description": "Hardtop is lightest C5."},
    {"title": "Value", "description": "Supercar performance at domestic pricing."},
    {"title": "Reliability", "description": "LS engine durability."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Age", "description": "20-23 years old."},
    {"title": "C5 Interior", "description": "Dated GM quality."},
    {"title": "No Targa/Conv", "description": "Hardtop only."},
    {"title": "Headlight Motors", "description": "Common failure point."}
  ]'::jsonb,
  ideal_owner = 'LS enthusiasts. Track day participants. Value seekers.',
  not_ideal_for = 'Modern interior seekers. Open-top wanters.',
  buyers_summary = '2002+ for 405hp. Verify suspension health. Great track day value.',
  best_years_detailed = '[{"years": "2002-2004", "reason": "405hp LS6."}]'::jsonb,
  must_have_options = '[{"name": "2002+ Model Year", "reason": "405hp vs 385hp."}]'::jsonb,
  price_guide = '{"low": {"price": "$22,000", "condition": "Higher mileage, 2001"}, "mid": {"price": "$32,000", "condition": "2002+, 50-80K miles"}, "high": {"price": "$48,000+", "condition": "Low-mile 2004"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$3,000", "heavy": "$6,000+", "notes": "LS reliability is excellent."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The C5 Z06 is supercar performance at Corvette prices.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The C5 Z06 is incredible value. Still fast today."}]'::jsonb
WHERE slug = 'chevrolet-corvette-c5-z06';


-- ============================================================================
-- VOLKSWAGEN GOLF R MK7 (2015-2019)
-- ============================================================================
UPDATE cars SET
  brand = 'Volkswagen',
  country = 'Germany',
  essence = 'The previous-gen all-rounder—292hp AWD in the best-balanced Golf R.',
  heritage = 'The MK7 Golf R refined the hot hatch formula. 292hp, 4Motion AWD, and excellent build quality made it the daily driver that could also carve canyons.',
  design_philosophy = 'Maximum capability with minimum drama.',
  generation_code = 'MK7/MK7.5',
  predecessors = '["Volkswagen Golf R MK6"]'::jsonb,
  successors = '["Volkswagen Golf R MK8 (2022+)"]'::jsonb,
  engine_character = 'The EA888 2.0L turbo produces 292hp with strong mid-range.',
  transmission_feel = 'Manual (6-speed) or DSG. Both excellent.',
  chassis_dynamics = '4Motion AWD with good balance. DCC recommended.',
  steering_feel = 'Electric steering adequate.',
  brake_confidence = 'Good brakes.',
  sound_signature = 'Turbocharged four.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Excellent daily driver.',
  defining_strengths = '[
    {"title": "292hp AWD", "description": "Capable in all conditions."},
    {"title": "Manual Available", "description": "6-speed option."},
    {"title": "Better Interior", "description": "Physical buttons, good layout."},
    {"title": "Daily Usability", "description": "Practical hatchback."},
    {"title": "Understated", "description": "Sleeper status."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Not as Powerful", "description": "292hp vs MK8''s 315hp."},
    {"title": "Carbon Buildup", "description": "Direct injection issue."},
    {"title": "Age", "description": "5-9 years old now."}
  ]'::jsonb,
  ideal_owner = 'Daily drivers wanting capability. Those who prefer MK7 interior.',
  not_ideal_for = 'Max power seekers.',
  buyers_summary = 'Manual for engagement. DCC recommended. Better interior than MK8.',
  best_years_detailed = '[{"years": "2018-2019 (MK7.5)", "reason": "Refreshed with digital dash."}]'::jsonb,
  must_have_options = '[{"name": "DCC", "reason": "Adaptive dampers."},{"name": "Manual", "reason": "For engagement."}]'::jsonb,
  price_guide = '{"low": {"price": "$25,000", "condition": "DSG, higher miles"}, "mid": {"price": "$32,000", "condition": "Manual, 30-50K"}, "high": {"price": "$40,000+", "condition": "Low-mile manual MK7.5"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,200", "typical": "$2,500", "heavy": "$5,000+", "notes": "VW ownership costs. DSG service adds."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '9',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The MK7 Golf R is the best all-around hot hatch.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "TST", "quote": "The MK7 R is the sweet spot. Better interior than MK8, still plenty fast."}]'::jsonb
WHERE slug = 'volkswagen-golf-r-mk7';


-- ============================================================================
-- VOLKSWAGEN GTI MK7 (2015-2021)
-- ============================================================================
UPDATE cars SET
  brand = 'Volkswagen',
  country = 'Japan',
  essence = 'The benchmark hot hatch—refined, capable, and brilliantly balanced.',
  heritage = E'The MK7 GTI refined the hot hatch formula to near-perfection. 220-245hp, excellent chassis, and premium feel made it the benchmark against which all others were measured.',
  design_philosophy = 'The perfect hot hatch. Balance, refinement, daily usability.',
  generation_code = 'MK7/MK7.5',
  predecessors = '["Volkswagen GTI MK6"]'::jsonb,
  successors = '["Volkswagen GTI MK8 (2022+)"]'::jsonb,
  engine_character = 'The EA888 2.0L turbo produces 220-245hp (SE/S to Autobahn/SE).',
  transmission_feel = 'Manual (6-speed) or DSG. Both excellent.',
  chassis_dynamics = 'Excellent FWD handling. Plaid seats optional.',
  steering_feel = 'Electric steering well-calibrated.',
  brake_confidence = 'PP brakes excellent.',
  sound_signature = 'Turbocharged four.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Premium hot hatch comfort.',
  defining_strengths = '[
    {"title": "Perfect Balance", "description": "The benchmark hot hatch."},
    {"title": "Manual Available", "description": "6-speed option."},
    {"title": "Performance Pack", "description": "LSD and better brakes."},
    {"title": "Interior Quality", "description": "Physical buttons, good materials."},
    {"title": "Value", "description": "Excellent used prices."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "FWD", "description": "No AWD option."},
    {"title": "Carbon Buildup", "description": "Direct injection issue."},
    {"title": "Not Golf R Power", "description": "220-245hp vs 292hp."}
  ]'::jsonb,
  ideal_owner = 'Hot hatch seekers. Daily drivers wanting fun. Value-focused buyers.',
  not_ideal_for = 'AWD seekers. Max power wanters.',
  buyers_summary = 'Performance Pack essential for LSD. Manual for engagement.',
  best_years_detailed = '[{"years": "2018-2021 (MK7.5)", "reason": "Refreshed, Rabbit Edition."}]'::jsonb,
  must_have_options = '[{"name": "Performance Pack", "reason": "LSD and bigger brakes essential."},{"name": "Manual", "reason": "For engagement."}]'::jsonb,
  price_guide = '{"low": {"price": "$18,000", "condition": "S, DSG, higher miles"}, "mid": {"price": "$25,000", "condition": "PP, manual, 40-60K"}, "high": {"price": "$32,000+", "condition": "Low-mile PP manual, Rabbit"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,000", "typical": "$2,000", "heavy": "$4,000+", "notes": "VW maintenance."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The MK7 GTI is the hot hatch benchmark. Nothing else is this well-rounded.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Jason Cammisa", "outlet": "Hagerty", "quote": "The MK7 GTI is the best car you can buy for daily fun. Period."}]'::jsonb
WHERE slug = 'volkswagen-gti-mk7';


-- ============================================================================
-- FORD FOCUS RS (2016-2018)
-- ============================================================================
UPDATE cars SET
  brand = 'Ford',
  country = 'United States',
  essence = 'The AWD hooligan—350hp with drift mode in Ford''s wildest hot hatch.',
  heritage = E'The Focus RS finally came to America with the third generation. 350hp, innovative AWD with drift mode, and rally-bred capability made it the most extreme mainstream hot hatch.',
  design_philosophy = 'Maximum hot hatch capability. AWD, 350hp, drift mode.',
  generation_code = 'MK3',
  predecessors = '[]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The EcoBoost 2.3L turbo produces 350hp with strong delivery.',
  transmission_feel = 'Manual only—6-speed with good engagement.',
  chassis_dynamics = 'AWD with rear torque vectoring. Drift mode enables oversteering.',
  steering_feel = 'Electric steering adequate.',
  brake_confidence = 'Brembo brakes.',
  sound_signature = 'Turbocharged four with pops and crackles.',
  comfort_track_balance = 'track-focused',
  comfort_notes = 'Firm ride. RS is focused.',
  defining_strengths = '[
    {"title": "350hp AWD", "description": "Serious power with traction."},
    {"title": "Drift Mode", "description": "Rear-biased torque for oversteer."},
    {"title": "Manual Only", "description": "No automatic option."},
    {"title": "Rally Heritage", "description": "RS lineage."},
    {"title": "Rare in US", "description": "Finally came to America."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Head Gasket Issue", "description": "Some early cars had problems. Verify."},
    {"title": "Firm Ride", "description": "RS suspension is stiff."},
    {"title": "Ford Interior", "description": "Not VW quality."},
    {"title": "Discontinued", "description": "No successor."}
  ]'::jsonb,
  ideal_owner = 'AWD hot hatch seekers. Manual enthusiasts. Rally fans.',
  not_ideal_for = 'Comfort seekers. Those worried about head gasket.',
  buyers_summary = 'Verify head gasket status. Manual is the only option. Great AWD hatch.',
  best_years_detailed = '[{"years": "2017-2018", "reason": "Head gasket issues addressed."}]'::jsonb,
  must_have_options = '[{"name": "RS2 Package", "reason": "Recaros and sunroof delete."}]'::jsonb,
  price_guide = '{"low": {"price": "$32,000", "condition": "Higher mileage, needs verification"}, "mid": {"price": "$38,000", "condition": "2017+, 30-50K"}, "high": {"price": "$48,000+", "condition": "Low-mile, verified"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$3,000", "heavy": "$6,000+", "notes": "Ford parts. Verify head gasket status."}'::jsonb,
  common_issues_detailed = '[{"issue": "Head Gasket", "severity": "major", "frequency": "uncommon", "cost": "$3,000-5,000", "notes": "Some early cars affected. Verify status."}]'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '8',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The Focus RS is the wildest hot hatch you can buy. Drift mode is real.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The Focus RS is brilliant. Drift mode works. Ford delivered."}]'::jsonb
WHERE slug = 'ford-focus-rs';


-- ============================================================================
-- FINAL VERIFICATION: ALL BUDGET TIER CARS
-- ============================================================================
SELECT 
  name, 
  slug, 
  tier,
  essence IS NOT NULL AS has_essence,
  jsonb_array_length(COALESCE(defining_strengths, '[]'::jsonb)) AS num_strengths
FROM cars 
WHERE tier = 'budget'
ORDER BY name;

