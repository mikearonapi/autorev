-- ============================================================================
-- BATCH UPDATE: MID TIER CARS - PART 6 (FINAL)
-- 
-- Cars: Civic Type R FK8, Civic Type R FL5, Golf R MK8, Tesla Model 3 Performance
-- ============================================================================


-- ============================================================================
-- HONDA CIVIC TYPE R FK8 (2017-2021)
-- ============================================================================
UPDATE cars SET
  brand = 'Honda',
  country = 'Japan',
  essence = 'The FWD king—turbocharged fury that redefined what front-wheel-drive could achieve.',
  heritage = E'The FK8 brought the Civic Type R to America for the first time. With 306hp, a revolutionary chassis, and that distinctive styling, it proved FWD could compete with AWD rivals.\n\nMultiple Nürburgring FWD records cemented its reputation. This wasn''t just a hot hatch—it was a precision instrument.',
  design_philosophy = 'Maximum performance from front-wheel-drive. No compromises.',
  generation_code = 'FK8',
  predecessors = '[]'::jsonb,
  successors = '["Honda Civic Type R FL5 (2023+)"]'::jsonb,
  engine_character = 'The K20C1 2.0L turbo produces 306hp with immediate response.',
  transmission_feel = 'Manual only—6-speed with excellent precision. Rev-matching standard.',
  chassis_dynamics = 'The FWD benchmark. Helical LSD, adaptive dampers, incredible grip.',
  steering_feel = 'Electric steering with good feedback for the class.',
  brake_confidence = 'Brembo brakes with excellent feel.',
  sound_signature = 'Turbocharged four with Honda character.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Firm but livable with Comfort mode.',
  defining_strengths = '[
    {"title": "FWD Benchmark", "description": "Sets the standard for front-wheel-drive performance."},
    {"title": "Manual Only", "description": "No automatic available."},
    {"title": "Track Capability", "description": "Multiple Nürburgring records."},
    {"title": "Honda Reliability", "description": "K20C1 is bulletproof."},
    {"title": "First US Type R", "description": "Historic significance."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Styling", "description": "Love it or hate it design."},
    {"title": "Firm Ride", "description": "Even in Comfort mode."},
    {"title": "No LSD in Base", "description": "Helical only—no clutch-type LSD."},
    {"title": "Torque Steer", "description": "306hp through front wheels has limits."}
  ]'::jsonb,
  ideal_owner = 'FWD enthusiasts. Manual transmission appreciators. Track day participants.',
  not_ideal_for = 'Comfort seekers. Those who hate the styling. AWD seekers.',
  buyers_summary = 'Limited Edition (LE) most track-focused. Stock cars command premiums.',
  best_years_detailed = '[{"years": "2020-2021", "reason": "Updates and LE availability."}]'::jsonb,
  must_have_options = '[{"name": "Limited Edition", "reason": "Lightest, most track-focused."}]'::jsonb,
  price_guide = '{"low": {"price": "$38,000", "condition": "Higher mileage"}, "mid": {"price": "$45,000", "condition": "Stock, 20-40K miles"}, "high": {"price": "$55,000+", "condition": "LE or low-mile stock"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,200", "typical": "$2,500", "heavy": "$5,000+", "notes": "Honda reliability keeps costs reasonable."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '9',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The Type R is the best FWD car ever made. Period.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The FK8 Type R changed what I thought was possible with front-wheel-drive."}]'::jsonb
WHERE slug = 'honda-civic-type-r-fk8';


-- ============================================================================
-- HONDA CIVIC TYPE R FL5 (2023-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'Honda',
  country = 'Japan',
  essence = 'Evolution perfected—refined styling and improved dynamics for the next generation FWD king.',
  heritage = E'The FL5 evolved the Type R formula with more mature styling and improved refinement. Same K20C1 engine with 315hp. Better ride quality. The FK8''s capabilities with grown-up looks.',
  design_philosophy = 'Refine the Type R formula without losing the character.',
  generation_code = 'FL5',
  predecessors = '["Honda Civic Type R FK8 (2017-2021)"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The K20C1 produces 315hp with improved response.',
  transmission_feel = 'Manual only—6-speed with refined action.',
  chassis_dynamics = 'Improved over FK8 with better ride quality. Still the FWD benchmark.',
  steering_feel = 'Electric steering with excellent calibration.',
  brake_confidence = 'Brembo brakes.',
  sound_signature = 'Turbocharged four-cylinder.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Much better than FK8. Actually comfortable.',
  defining_strengths = '[
    {"title": "Improved Refinement", "description": "Better ride than FK8."},
    {"title": "315hp", "description": "More power than predecessor."},
    {"title": "Mature Styling", "description": "Less polarizing design."},
    {"title": "Manual Only", "description": "No automatic."},
    {"title": "Honda Quality", "description": "Built in Japan."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "High Demand", "description": "Markups common."},
    {"title": "No AWD", "description": "Still FWD only."},
    {"title": "Price Increase", "description": "More expensive than FK8 was."}
  ]'::jsonb,
  ideal_owner = 'Type R enthusiasts wanting more refinement. FWD purists.',
  not_ideal_for = 'AWD seekers. Budget-limited.',
  buyers_summary = 'Try to find MSRP. The improvement over FK8 is significant.',
  best_years_detailed = '[{"years": "2023-2024", "reason": "Current production."}]'::jsonb,
  must_have_options = '[{"name": "Any Available", "reason": "Limited options—just get one."}]'::jsonb,
  price_guide = '{"low": {"price": "$45,000", "condition": "MSRP (rare)"}, "mid": {"price": "$50,000", "condition": "Market price"}, "high": {"price": "$55,000+", "condition": "Low miles, dealer markup"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,000", "typical": "$2,000", "heavy": "$4,000+", "notes": "New car warranty. Honda reliability."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '9',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The FL5 improves on the FK8 in every way while keeping the character.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Jason Cammisa", "outlet": "Hagerty", "quote": "The FL5 is the Type R grown up. Everything is better."}]'::jsonb
WHERE slug = 'honda-civic-type-r-fl5';


-- ============================================================================
-- VOLKSWAGEN GOLF R MK8 (2022-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'Volkswagen',
  country = 'Germany',
  essence = 'The all-weather weapon—AWD hot hatch that does everything well.',
  heritage = E'The MK8 Golf R continued VW''s tradition of understated performance. 315hp, AWD, and new torque vectoring made it more capable than ever. The Swiss Army knife of hot hatches.',
  design_philosophy = 'Maximum capability with minimal drama. The anti-Type R.',
  generation_code = 'MK8',
  predecessors = '["Volkswagen Golf R MK7.5"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The EA888 2.0L turbo produces 315hp with strong mid-range.',
  transmission_feel = 'DSG (7-speed) or manual (6-speed). DSG is quicker; manual more engaging.',
  chassis_dynamics = '4Motion AWD with R Performance Torque Vectoring. Incredibly capable.',
  steering_feel = 'Electric steering adequate.',
  brake_confidence = 'Good brakes.',
  sound_signature = 'Turbocharged four with synthetic enhancement.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Comfortable daily driver. DCC provides range.',
  defining_strengths = '[
    {"title": "AWD Capability", "description": "4Motion plus torque vectoring."},
    {"title": "Daily Usability", "description": "Comfortable and practical."},
    {"title": "315hp", "description": "Serious power."},
    {"title": "Understated", "description": "Sleeper status."},
    {"title": "Manual Available", "description": "6-speed option."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Infotainment", "description": "Touch controls are frustrating."},
    {"title": "Less Character", "description": "Competent but not exciting."},
    {"title": "Price", "description": "Expensive for a Golf."},
    {"title": "Sound", "description": "Needs soundaktor assistance."}
  ]'::jsonb,
  ideal_owner = 'Those wanting all-weather capability. Daily drivers. Understated preference.',
  not_ideal_for = 'Character seekers. Those who hate touch controls.',
  buyers_summary = 'Manual for engagement. DSG for speed. DCC worth having.',
  best_years_detailed = '[{"years": "2022-2024", "reason": "Current production. All excellent."}]'::jsonb,
  must_have_options = '[{"name": "Manual Transmission", "reason": "For engagement."},{"name": "DCC", "reason": "Adaptive damping."}]'::jsonb,
  price_guide = '{"low": {"price": "$40,000", "condition": "MSRP DSG"}, "mid": {"price": "$45,000", "condition": "Manual, low miles"}, "high": {"price": "$50,000+", "condition": "20th Anniversary or loaded"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,200", "typical": "$2,500", "heavy": "$5,000+", "notes": "VW ownership costs. DSG service adds."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '8',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The Golf R does everything. It''s the ultimate all-rounder.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "TST", "quote": "The Golf R is the thinking person''s hot hatch. It just works."}]'::jsonb
WHERE slug = 'volkswagen-golf-r-mk8';


-- ============================================================================
-- TESLA MODEL 3 PERFORMANCE (2018-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'Tesla',
  country = 'United States',
  essence = 'The electric benchmark—instant torque and supercar acceleration in a practical sedan.',
  heritage = E'The Model 3 Performance democratized electric performance. With dual motors, 500+ hp equivalent, and instant torque, it outaccelerates almost everything at its price point.\n\nIt changed how people think about performance cars—no engine sound, but devastating acceleration.',
  design_philosophy = 'Maximum electric performance in practical sedan form.',
  generation_code = 'Model 3',
  predecessors = '[]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'Dual motor AWD produces 500+ hp equivalent with instant torque.',
  transmission_feel = 'Single-speed. No shifting. Just acceleration.',
  chassis_dynamics = 'Track Mode provides adjustability. Low center of gravity helps handling.',
  steering_feel = 'Electric steering. Adjustable weight.',
  brake_confidence = 'Good brakes with regenerative assist.',
  sound_signature = 'Electric whine. No exhaust note.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Comfortable daily driver with excellent range.',
  defining_strengths = '[
    {"title": "Instant Torque", "description": "Devastating acceleration."},
    {"title": "0-60 Under 3.5s", "description": "Supercar acceleration."},
    {"title": "Supercharger Network", "description": "Best EV infrastructure."},
    {"title": "Track Mode", "description": "Adjustable dynamics."},
    {"title": "Autopilot", "description": "Advanced driver assistance."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "No Engine Sound", "description": "Some miss the drama."},
    {"title": "Track Limitations", "description": "Thermal management limits repeated runs."},
    {"title": "Build Quality Variation", "description": "Quality control inconsistent."},
    {"title": "Service Experience", "description": "Tesla service is different."}
  ]'::jsonb,
  ideal_owner = 'Tech enthusiasts. Those wanting fastest daily driver. Electric believers.',
  not_ideal_for = 'Engine sound lovers. Traditional driving seekers. Track-focused buyers.',
  buyers_summary = 'Track Package for maximum capability. Consider build date for quality.',
  best_years_detailed = '[{"years": "2021-2024", "reason": "Updated interior, improved build quality."}]'::jsonb,
  must_have_options = '[{"name": "Track Package", "reason": "Better brakes and wheels."},{"name": "Full Self-Driving", "reason": "For tech features (value debated)."}]'::jsonb,
  price_guide = '{"low": {"price": "$38,000", "condition": "Higher mileage"}, "mid": {"price": "$48,000", "condition": "2021+, 20-40K miles"}, "high": {"price": "$55,000+", "condition": "Low miles, Track Package"}}'::jsonb,
  annual_ownership_cost = '{"low": "$800", "typical": "$1,500", "heavy": "$4,000+", "notes": "Lower running costs than ICE. Tire wear can be high."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '8',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The Model 3 Performance redefines what performance means.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Jason Cammisa", "outlet": "Hagerty", "quote": "The Model 3 Performance is embarrassingly fast. Nothing else accelerates like this at this price."}]'::jsonb
WHERE slug = 'tesla-model-3-performance';


-- ============================================================================
-- FINAL VERIFICATION: ALL MID TIER CARS
-- ============================================================================
SELECT 
  name, 
  slug, 
  tier,
  essence IS NOT NULL AS has_essence,
  jsonb_array_length(COALESCE(defining_strengths, '[]'::jsonb)) AS num_strengths
FROM cars 
WHERE tier = 'mid'
ORDER BY name;






