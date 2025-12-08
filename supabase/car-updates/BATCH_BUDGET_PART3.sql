-- ============================================================================
-- BATCH UPDATE: BUDGET TIER CARS - PART 3
-- 
-- Cars: Miata NA/NB/NC/ND, Toyota 86, GR86, BRZ ZC6, BRZ ZD8
-- ============================================================================


-- ============================================================================
-- MAZDA MX-5 MIATA NA (1990-1997)
-- ============================================================================
UPDATE cars SET
  brand = 'Mazda',
  country = 'Japan',
  essence = 'The original—the car that revived the affordable sports car and proved driving joy doesn''t require horsepower.',
  heritage = E'The NA Miata revived the British sports car formula that had died. Simple, lightweight, affordable, and genuinely fun. It created a template every generation has followed.',
  design_philosophy = 'Lightweight is right. Simplicity creates joy.',
  generation_code = 'NA',
  predecessors = '[]'::jsonb,
  successors = '["Mazda MX-5 Miata NB (1999-2005)"]'::jsonb,
  engine_character = 'The 1.6L or 1.8L four-cylinder produces 90-130hp. Modest power, but the car weighs nothing.',
  transmission_feel = 'Manual only (early). 5 or 6-speed with excellent precision.',
  chassis_dynamics = 'The benchmark for lightweight sports car handling. Perfect balance.',
  steering_feel = 'Unassisted or light power steering. Pure feel.',
  brake_confidence = 'Adequate for the weight.',
  sound_signature = 'Four-cylinder buzz that rewards revving.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Roadster compromises. Simple but fun.',
  defining_strengths = '[
    {"title": "Light Weight", "description": "Under 2,200 lbs. The whole point."},
    {"title": "Perfect Balance", "description": "50:50 weight distribution."},
    {"title": "Reliability", "description": "Mazda/Ford durability."},
    {"title": "Simple", "description": "No complexity to fail."},
    {"title": "Original", "description": "The car that started it all."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Age", "description": "27-34 years old."},
    {"title": "Rust", "description": "Prone to corrosion."},
    {"title": "No Power", "description": "90-130hp is modest."},
    {"title": "Safety", "description": "1990s safety standards."}
  ]'::jsonb,
  ideal_owner = 'Pure driving enthusiasts. Track day beginners. Lightweight appreciators.',
  not_ideal_for = 'Power seekers. Those needing modern safety. Winter drivers.',
  buyers_summary = 'Rust-free is priority #1. 1.8L preferred. Manual essential.',
  best_years_detailed = '[{"years": "1994-1997", "reason": "1.8L engine, improved brakes."}]'::jsonb,
  must_have_options = '[{"name": "1.8L Engine", "reason": "More power."},{"name": "LSD", "reason": "Factory limited-slip."}]'::jsonb,
  price_guide = '{"low": {"price": "$6,000", "condition": "Rust, needs work"}, "mid": {"price": "$12,000", "condition": "Clean, 100-150K miles"}, "high": {"price": "$22,000+", "condition": "Low-mile, rust-free"}}'::jsonb,
  annual_ownership_cost = '{"low": "$800", "typical": "$1,500", "heavy": "$4,000+", "notes": "Simple and cheap to maintain."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The NA Miata is the most important sports car of its generation.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Jason Cammisa", "outlet": "Hagerty", "quote": "The NA Miata proves you don''t need power to have fun."}]'::jsonb
WHERE slug = 'mazda-mx5-miata-na';


-- ============================================================================
-- MAZDA MX-5 MIATA NB (1999-2005)
-- ============================================================================
UPDATE cars SET
  brand = 'Mazda',
  country = 'Japan',
  essence = 'The refined original—improved NA formula with better power and fixed headlights.',
  heritage = 'The NB refined the Miata formula. More power, improved refinement, but the same lightweight philosophy. The Mazdaspeed version added turbo power.',
  design_philosophy = 'Evolve without losing the soul.',
  generation_code = 'NB',
  predecessors = '["Mazda MX-5 Miata NA (1990-1997)"]'::jsonb,
  successors = '["Mazda MX-5 Miata NC (2006-2015)"]'::jsonb,
  engine_character = 'The 1.8L produces 140-178hp. Mazdaspeed turbo adds more.',
  transmission_feel = 'Manual (5 or 6-speed) with excellent precision.',
  chassis_dynamics = 'Slightly heavier than NA but still excellent.',
  steering_feel = 'Light power steering.',
  brake_confidence = 'Improved over NA.',
  sound_signature = 'Four-cylinder character.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'More refined than NA.',
  defining_strengths = '[
    {"title": "Refined NA", "description": "Better without losing the character."},
    {"title": "More Power", "description": "140-178hp depending on year."},
    {"title": "Mazdaspeed Option", "description": "Factory turbo available."},
    {"title": "Reliability", "description": "Proven platform."},
    {"title": "Fixed Headlights", "description": "Some prefer this styling."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Age", "description": "19-25 years old."},
    {"title": "Rust", "description": "Still prone."},
    {"title": "Pop-up Purists", "description": "Some prefer NA headlights."}
  ]'::jsonb,
  ideal_owner = 'Those wanting refined NA. Mazdaspeed seekers.',
  not_ideal_for = 'Pop-up headlight fans. Power seekers (non-turbo).',
  buyers_summary = 'Mazdaspeed is most desirable. Rust check essential.',
  best_years_detailed = '[{"years": "2004-2005 Mazdaspeed", "reason": "Factory turbo, 178hp."}]'::jsonb,
  must_have_options = '[{"name": "Mazdaspeed", "reason": "Factory turbo."},{"name": "6-Speed", "reason": "Better ratio spread."}]'::jsonb,
  price_guide = '{"low": {"price": "$5,000", "condition": "Needs work"}, "mid": {"price": "$10,000", "condition": "Clean, 80-120K"}, "high": {"price": "$20,000+", "condition": "Mazdaspeed, low-mile"}}'::jsonb,
  annual_ownership_cost = '{"low": "$800", "typical": "$1,500", "heavy": "$4,000+", "notes": "Simple Miata maintenance."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The NB refines what made the NA great.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "TST", "quote": "The Mazdaspeed Miata is the sleeper of the lineup."}]'::jsonb
WHERE slug = 'mazda-mx5-miata-nb';


-- ============================================================================
-- MAZDA MX-5 MIATA NC (2006-2015)
-- ============================================================================
UPDATE cars SET
  brand = 'Mazda',
  country = 'Japan',
  essence = 'The grown-up Miata—bigger, more powerful, with PRHT option.',
  heritage = 'The NC grew the Miata larger. More power, retractable hardtop option, but criticized for weight gain. Still a proper Miata at heart.',
  design_philosophy = 'Evolve the Miata for modern expectations. Add power, improve refinement.',
  generation_code = 'NC',
  predecessors = '["Mazda MX-5 Miata NB (1999-2005)"]'::jsonb,
  successors = '["Mazda MX-5 Miata ND (2016-2024)"]'::jsonb,
  engine_character = 'The 2.0L produces 158-170hp with smooth delivery.',
  transmission_feel = 'Manual (5 or 6-speed) or automatic.',
  chassis_dynamics = 'Heavier but still balanced. Multi-link rear improves grip.',
  steering_feel = 'Electric power steering.',
  brake_confidence = 'Good brakes.',
  sound_signature = 'Four-cylinder character.',
  comfort_track_balance = 'daily',
  comfort_notes = 'More comfortable than NA/NB. PRHT adds year-round usability.',
  defining_strengths = '[
    {"title": "PRHT Option", "description": "Power retractable hardtop."},
    {"title": "More Power", "description": "158-170hp."},
    {"title": "Improved Refinement", "description": "More grown-up feel."},
    {"title": "Reliability", "description": "Proven Mazda durability."},
    {"title": "Value", "description": "Great used prices."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Weight", "description": "Heavier than NA/NB."},
    {"title": "Size", "description": "Larger than predecessors."},
    {"title": "Electric Steering", "description": "Less feel."},
    {"title": "Club vs PRHT Weight", "description": "PRHT adds significant weight."}
  ]'::jsonb,
  ideal_owner = 'Those wanting more refined Miata. PRHT seekers.',
  not_ideal_for = 'Lightweight purists. Manual steering fans.',
  buyers_summary = 'Club model is lightest. PRHT for year-round use.',
  best_years_detailed = '[{"years": "2013-2015 Club", "reason": "Most refined, lightest spec."}]'::jsonb,
  must_have_options = '[{"name": "Club Model", "reason": "Sport suspension, LSD, lighter."},{"name": "6-Speed Manual", "reason": "Essential."}]'::jsonb,
  price_guide = '{"low": {"price": "$8,000", "condition": "Higher mileage auto"}, "mid": {"price": "$14,000", "condition": "Club, 50-80K"}, "high": {"price": "$22,000+", "condition": "Low-mile Club"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,000", "typical": "$2,000", "heavy": "$4,000+", "notes": "Reliable Mazda ownership."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The NC is the grown-up Miata. Still fun.", "rating": "4/5"}]'::jsonb,
  expert_quotes = '[{"person": "Jason Cammisa", "outlet": "Hagerty", "quote": "The NC is underrated. Don''t dismiss it for the weight."}]'::jsonb
WHERE slug = 'mazda-mx5-miata-nc';


-- ============================================================================
-- MAZDA MX-5 MIATA ND (2016-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'Mazda',
  country = 'Japan',
  essence = 'The return to form—lighter, sharper, back to the original philosophy.',
  heritage = E'The ND returned to Miata roots. Lighter than the NC, sharper, and more focused. Mazda remembered what made the original special.',
  design_philosophy = 'Gram strategy weight reduction. Return to lightweight purity.',
  generation_code = 'ND',
  predecessors = '["Mazda MX-5 Miata NC (2006-2015)"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The SKYACTIV 2.0L produces 155-181hp with rev-happy character.',
  transmission_feel = 'Manual (6-speed) with excellent precision. Auto available.',
  chassis_dynamics = 'Lightest Miata since NA. Perfect balance returned.',
  steering_feel = 'Electric steering with excellent calibration.',
  brake_confidence = 'Good brakes, especially Brembo option.',
  sound_signature = 'Four-cylinder character.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Modern comfort with sports car focus.',
  defining_strengths = '[
    {"title": "Return to Lightweight", "description": "Lightest since NA."},
    {"title": "Excellent Chassis", "description": "Perfect balance."},
    {"title": "Modern Reliability", "description": "Current Mazda quality."},
    {"title": "Club/Brembo Package", "description": "Track-ready from factory."},
    {"title": "RF Option", "description": "Retractable fastback."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Modest Power", "description": "155-181hp is adequate, not exciting."},
    {"title": "Tight Cabin", "description": "Small interior."},
    {"title": "Infotainment", "description": "Screen is small."}
  ]'::jsonb,
  ideal_owner = 'Lightweight enthusiasts. Modern daily driver seekers.',
  not_ideal_for = 'Power seekers. Large drivers.',
  buyers_summary = 'Club with Brembo for track. RF for weather protection. Manual essential.',
  best_years_detailed = '[{"years": "2019-2024", "reason": "181hp, all improvements."}]'::jsonb,
  must_have_options = '[{"name": "Club", "reason": "Sport suspension, LSD, Brembo option."},{"name": "Brembo/BBS Package", "reason": "Track-ready."}]'::jsonb,
  price_guide = '{"low": {"price": "$22,000", "condition": "Sport, higher miles"}, "mid": {"price": "$30,000", "condition": "Club, 20-40K"}, "high": {"price": "$38,000+", "condition": "Low-mile Club with Brembos"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,000", "typical": "$2,000", "heavy": "$4,000+", "notes": "Modern Mazda reliability."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The ND is the best Miata since the original. Mazda remembered.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The ND proves Mazda still understands driving. It''s brilliant."}]'::jsonb
WHERE slug = 'mazda-mx5-miata-nd';


-- ============================================================================
-- TOYOTA 86 / SCION FR-S (2013-2020)
-- ============================================================================
UPDATE cars SET
  brand = 'Toyota',
  country = 'Japan',
  essence = 'The affordable RWD coupe—Subaru boxer in Toyota clothes, reviving affordable rear-drive.',
  heritage = E'The 86/FR-S (and BRZ twin) revived the affordable RWD sports car. The FA20 boxer was criticized for power but the chassis was exceptional. It prioritized handling over horsepower.',
  design_philosophy = 'Handling over power. Lightweight RWD accessibility.',
  generation_code = 'ZN6',
  predecessors = '[]'::jsonb,
  successors = '["Toyota GR86 (2022+)"]'::jsonb,
  engine_character = 'The FA20 2.0L boxer produces 200hp with a power dip some dislike.',
  transmission_feel = 'Manual (6-speed) or automatic. Manual preferred.',
  chassis_dynamics = 'Exceptional balance. Low center of gravity from boxer engine.',
  steering_feel = 'Electric steering with good calibration.',
  brake_confidence = 'Adequate brakes.',
  sound_signature = 'Boxer character.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Livable daily with firm ride.',
  defining_strengths = '[
    {"title": "Exceptional Chassis", "description": "Brilliant handling balance."},
    {"title": "Low Center of Gravity", "description": "Boxer engine placement."},
    {"title": "Affordable RWD", "description": "Entry-level sports car."},
    {"title": "Manual Available", "description": "6-speed option."},
    {"title": "Reliability", "description": "Toyota/Subaru durability."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Power", "description": "200hp and a torque dip."},
    {"title": "Interior", "description": "Basic quality."},
    {"title": "Needs Revs", "description": "Must be wrung out for performance."}
  ]'::jsonb,
  ideal_owner = 'Handling enthusiasts. Track day beginners. Budget sports car seekers.',
  not_ideal_for = 'Power seekers. Those wanting effortless acceleration.',
  buyers_summary = 'Manual essential. TRD or performance packs add value.',
  best_years_detailed = '[{"years": "2017-2020", "reason": "Updates and improvements."}]'::jsonb,
  must_have_options = '[{"name": "Manual Transmission", "reason": "Essential."},{"name": "Performance Pack", "reason": "Brembo brakes."}]'::jsonb,
  price_guide = '{"low": {"price": "$15,000", "condition": "Higher mileage auto"}, "mid": {"price": "$22,000", "condition": "Manual, 40-60K"}, "high": {"price": "$28,000+", "condition": "Low-mile manual, TRD"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,000", "typical": "$2,000", "heavy": "$4,000+", "notes": "Reliable platform."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The 86 prioritizes handling over power. It''s the right choice.", "rating": "4/5"}]'::jsonb,
  expert_quotes = '[{"person": "Jason Cammisa", "outlet": "Hagerty", "quote": "The 86 is about chassis, not power. Drive it right and it''s brilliant."}]'::jsonb
WHERE slug = 'toyota-86-scion-frs';


-- ============================================================================
-- TOYOTA GR86 (2022-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'Toyota',
  country = 'Japan',
  essence = 'The 86 evolved—more power, refined chassis, addressing the original''s criticisms.',
  heritage = E'The GR86 answered criticisms of the first generation. More power, no torque dip, refined chassis. Toyota and Subaru improved everything without losing the character.',
  design_philosophy = 'Evolve the formula. More power, same philosophy.',
  generation_code = 'ZN8',
  predecessors = '["Toyota 86 / Scion FR-S (2013-2020)"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The FA24 2.4L boxer produces 228hp with no torque dip.',
  transmission_feel = 'Manual (6-speed) or automatic. Manual preferred.',
  chassis_dynamics = 'Improved over ZN6 with better stiffness.',
  steering_feel = 'Electric steering with good feel.',
  brake_confidence = 'Improved brakes.',
  sound_signature = 'Boxer character.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Livable daily driver.',
  defining_strengths = '[
    {"title": "More Power", "description": "228hp with no torque dip."},
    {"title": "Improved Chassis", "description": "Stiffer and better balanced."},
    {"title": "Same Philosophy", "description": "Lightweight RWD focus."},
    {"title": "Manual Available", "description": "6-speed option."},
    {"title": "Value", "description": "Affordable RWD sports car."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Valve Spring Recall", "description": "Early 2022 models affected."},
    {"title": "Still Not Powerful", "description": "228hp is adequate, not thrilling."},
    {"title": "Interior", "description": "Basic quality."}
  ]'::jsonb,
  ideal_owner = 'RWD enthusiasts. Manual seekers. Track day participants.',
  not_ideal_for = 'Power seekers. Luxury wanters.',
  buyers_summary = 'Manual essential. Verify valve spring recall completed on 2022 models.',
  best_years_detailed = '[{"years": "2023-2024", "reason": "Recall addressed."}]'::jsonb,
  must_have_options = '[{"name": "Manual Transmission", "reason": "Essential."}]'::jsonb,
  price_guide = '{"low": {"price": "$28,000", "condition": "Auto"}, "mid": {"price": "$32,000", "condition": "Manual, 10-25K"}, "high": {"price": "$38,000+", "condition": "Low-mile manual, special edition"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,000", "typical": "$2,000", "heavy": "$4,000+", "notes": "Modern reliability."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The GR86 fixes everything we complained about. Brilliant.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The GR86 is exactly what we asked for. Toyota delivered."}]'::jsonb
WHERE slug = 'toyota-gr86';


-- ============================================================================
-- SUBARU BRZ ZC6 (2013-2020)
-- ============================================================================
UPDATE cars SET
  brand = 'Subaru',
  country = 'Japan',
  essence = 'The Subaru twin—boxer power in RWD form, same chassis as 86.',
  heritage = 'The BRZ shared everything important with the 86/FR-S. Subaru tuning gave it slightly different character, but the experience was essentially identical.',
  design_philosophy = 'Same philosophy as 86. Subaru badging and minor tuning.',
  generation_code = 'ZC6',
  predecessors = '[]'::jsonb,
  successors = '["Subaru BRZ ZD8 (2022+)"]'::jsonb,
  engine_character = 'The FA20 2.0L boxer produces 200-205hp.',
  transmission_feel = 'Manual (6-speed) or automatic.',
  chassis_dynamics = 'Identical to 86. Exceptional balance.',
  steering_feel = 'Electric steering.',
  brake_confidence = 'Adequate brakes.',
  sound_signature = 'Boxer character.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Livable daily.',
  defining_strengths = '[
    {"title": "Subaru Badging", "description": "Different look, same car."},
    {"title": "Exceptional Chassis", "description": "Identical to 86 brilliance."},
    {"title": "tS/Series Models", "description": "Limited editions with upgrades."},
    {"title": "Reliability", "description": "Subaru durability."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Same Issues as 86", "description": "Power, torque dip."},
    {"title": "Why Not 86?", "description": "Essentially identical."}
  ]'::jsonb,
  ideal_owner = 'Subaru loyalists. Those preferring BRZ styling.',
  not_ideal_for = 'Those choosing on merit—it''s identical to 86.',
  buyers_summary = 'tS or Series.Yellow for collectibility. Otherwise, same as 86 advice.',
  best_years_detailed = '[{"years": "2018 tS", "reason": "Limited edition with STI parts."}]'::jsonb,
  must_have_options = '[{"name": "tS", "reason": "STI upgrades."},{"name": "Manual", "reason": "Essential."}]'::jsonb,
  price_guide = '{"low": {"price": "$15,000", "condition": "Higher mileage auto"}, "mid": {"price": "$22,000", "condition": "Manual, 40-60K"}, "high": {"price": "$32,000+", "condition": "tS, low miles"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,000", "typical": "$2,000", "heavy": "$4,000+", "notes": "Same as 86."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The BRZ is the 86 with a Subaru badge. Both are excellent.", "rating": "4/5"}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "TST", "quote": "BRZ or 86? Pick the badge you like. They''re the same car."}]'::jsonb
WHERE slug = 'subaru-brz-zc6';


-- ============================================================================
-- SUBARU BRZ ZD8 (2022-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'Subaru',
  country = 'Japan',
  essence = 'The evolved twin—more power, same philosophy, Subaru badging.',
  heritage = 'The ZD8 BRZ shares the GR86 platform with identical improvements. More power, no torque dip, better chassis.',
  design_philosophy = 'Same as GR86. Subaru styling differences.',
  generation_code = 'ZD8',
  predecessors = '["Subaru BRZ ZC6 (2013-2020)"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The FA24 2.4L boxer produces 228hp.',
  transmission_feel = 'Manual (6-speed) or automatic.',
  chassis_dynamics = 'Improved over ZC6. Same as GR86.',
  steering_feel = 'Electric steering.',
  brake_confidence = 'Improved brakes.',
  sound_signature = 'Boxer character.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Livable daily.',
  defining_strengths = '[
    {"title": "Same as GR86", "description": "All the improvements."},
    {"title": "228hp", "description": "No torque dip."},
    {"title": "Subaru Badge", "description": "For the loyalists."},
    {"title": "tS Edition", "description": "STI upgrades available."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Same as GR86 Issues", "description": "Valve spring recall on early cars."},
    {"title": "Why Not GR86?", "description": "Essentially identical."}
  ]'::jsonb,
  ideal_owner = 'Subaru loyalists. Those preferring BRZ styling.',
  not_ideal_for = 'Those choosing on merit alone.',
  buyers_summary = 'Same as GR86 advice. tS for special edition.',
  best_years_detailed = '[{"years": "2023-2024", "reason": "Recall addressed, tS available."}]'::jsonb,
  must_have_options = '[{"name": "tS", "reason": "STI upgrades."},{"name": "Manual", "reason": "Essential."}]'::jsonb,
  price_guide = '{"low": {"price": "$28,000", "condition": "Auto"}, "mid": {"price": "$32,000", "condition": "Manual, 10-25K"}, "high": {"price": "$42,000+", "condition": "tS, low miles"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,000", "typical": "$2,000", "heavy": "$4,000+", "notes": "Same as GR86."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The new BRZ is the GR86 with a Subaru badge. Both are great.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Jason Cammisa", "outlet": "Hagerty", "quote": "BRZ or GR86? Same car, different badges. Both brilliant."}]'::jsonb
WHERE slug = 'subaru-brz-zd8';


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
WHERE slug IN ('mazda-mx5-miata-na', 'mazda-mx5-miata-nb', 'mazda-mx5-miata-nc', 'mazda-mx5-miata-nd', 'toyota-86-scion-frs', 'toyota-gr86', 'subaru-brz-zc6', 'subaru-brz-zd8')
ORDER BY name;

