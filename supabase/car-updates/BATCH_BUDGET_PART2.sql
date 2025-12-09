-- ============================================================================
-- BATCH UPDATE: BUDGET TIER CARS - PART 2
-- 
-- Cars: Camaro SS 1LE, GR Supra, Maserati GranTurismo, Evo X, STI GD, STI GR/GV
-- ============================================================================


-- ============================================================================
-- CAMARO SS 1LE (2017-2023)
-- ============================================================================
UPDATE cars SET
  brand = 'Chevrolet',
  country = 'United States',
  essence = 'The track-day bargain—LT1 V8 with 1LE track package creates world-class capability at domestic pricing.',
  heritage = E'The 1LE package transformed the Camaro SS into a genuine track weapon. With magnetic ride, enhanced cooling, and track-focused suspension, it delivered performance that embarrassed European rivals.',
  design_philosophy = 'Maximum track capability from the SS platform.',
  generation_code = 'Alpha',
  predecessors = '["Camaro SS 1LE (Gen 5)"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The LT1 6.2L V8 produces 455hp with proven reliability.',
  transmission_feel = 'Manual (6-speed) only with 1LE. The point of the package.',
  chassis_dynamics = '1LE suspension and MagneRide create exceptional track capability.',
  steering_feel = 'Electric steering adequate.',
  brake_confidence = 'Brembo brakes with excellent fade resistance.',
  sound_signature = 'LT1 V8 rumble.',
  comfort_track_balance = 'track-focused',
  comfort_notes = '1LE is firm. Track-biased.',
  defining_strengths = '[
    {"title": "LT1 V8", "description": "455hp proven reliable."},
    {"title": "1LE Package", "description": "Complete track package."},
    {"title": "Manual Only", "description": "1LE requires manual."},
    {"title": "Value", "description": "World-class track performance at domestic pricing."},
    {"title": "MagneRide", "description": "Excellent adaptive damping."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Visibility", "description": "Camaro greenhouse is terrible."},
    {"title": "Interior", "description": "Cramped."},
    {"title": "Firm Ride", "description": "Track-focused."}
  ]'::jsonb,
  ideal_owner = 'Track day enthusiasts. Manual appreciators. Value seekers.',
  not_ideal_for = 'Comfort seekers. Those who need visibility.',
  buyers_summary = '1LE manual is the spec. Incredible track value.',
  best_years_detailed = '[{"years": "2019-2023", "reason": "Refreshed front end, all updates."}]'::jsonb,
  must_have_options = '[{"name": "1LE Package", "reason": "This is the point."}]'::jsonb,
  price_guide = '{"low": {"price": "$32,000", "condition": "Higher mileage"}, "mid": {"price": "$42,000", "condition": "20-35K miles"}, "high": {"price": "$52,000+", "condition": "Low miles"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$3,000", "heavy": "$6,000+", "notes": "LT1 is reliable."}'::jsonb,
  track_readiness = 'race-bred',
  community_strength = '9',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The SS 1LE is the track day bargain.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The SS 1LE punches way above its weight."}]'::jsonb
WHERE slug = 'camaro-ss-1le';


-- ============================================================================
-- TOYOTA GR SUPRA (2020-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'Toyota',
  country = 'Japan',
  essence = 'The reborn legend—BMW B58 power in Toyota clothes, reviving the Supra nameplate.',
  heritage = E'The A90 Supra revived the legendary nameplate with BMW partnership. The B58 inline-six delivers 382hp through a proper front-engine, rear-drive chassis. It divides opinions but delivers performance.',
  design_philosophy = 'Revive the Supra with modern partnership. BMW running gear, Toyota badges.',
  generation_code = 'A90/J29',
  predecessors = '["Toyota Supra MK4 (A80)"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The BMW B58 3.0L turbo produces 382hp with smooth, reliable power.',
  transmission_feel = 'ZF 8-speed automatic only (through 2022). Manual added for 2023.',
  chassis_dynamics = 'Short wheelbase creates agile handling. Good balance.',
  steering_feel = 'Electric steering adequate.',
  brake_confidence = 'Good brakes with Brembo option.',
  sound_signature = 'Turbocharged inline-six character.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Comfortable GT character.',
  defining_strengths = '[
    {"title": "B58 Engine", "description": "BMW inline-six reliability with good tuning potential."},
    {"title": "Manual Added", "description": "2023+ available with manual."},
    {"title": "Supra Name", "description": "The legend returns."},
    {"title": "Handling", "description": "Short wheelbase is agile."},
    {"title": "Tuning Support", "description": "B58 has strong aftermarket."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "BMW Partnership", "description": "Purists dislike non-Toyota drivetrain."},
    {"title": "Automatic (early)", "description": "No manual until 2023."},
    {"title": "Interior", "description": "BMW switchgear."}
  ]'::jsonb,
  ideal_owner = 'Sports car seekers. Those who accept the partnership.',
  not_ideal_for = 'Toyota purists. Those wanting manual (pre-2023).',
  buyers_summary = '2023+ for manual. B58 is proven and tunable.',
  best_years_detailed = '[{"years": "2023-2024", "reason": "Manual transmission available."}]'::jsonb,
  must_have_options = '[{"name": "Manual Transmission", "reason": "2023+ only. Essential."}]'::jsonb,
  price_guide = '{"low": {"price": "$42,000", "condition": "Auto, higher miles"}, "mid": {"price": "$52,000", "condition": "Manual, low miles"}, "high": {"price": "$62,000+", "condition": "A91 Edition or manual low miles"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$3,000", "heavy": "$5,000+", "notes": "BMW drivetrain costs."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '8',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The GR Supra is fast and fun. Accept the BMW and enjoy.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Jason Cammisa", "outlet": "Hagerty", "quote": "The Supra divides people, but on the road it''s brilliant."}]'::jsonb
WHERE slug = 'toyota-gr-supra';


-- ============================================================================
-- MASERATI GRANTURISMO (2008-2019)
-- ============================================================================
UPDATE cars SET
  brand = 'Maserati',
  country = 'Italy',
  essence = 'The Ferrari-engined GT—4.7L V8 drama wrapped in Italian grand touring elegance.',
  heritage = E'The GranTurismo brought Ferrari-derived V8 power to Maserati''s grand touring vision. With proper back seats, stunning design, and that magnificent engine note, it delivered exotic character.',
  design_philosophy = 'Italian grand touring with Ferrari-derived power.',
  generation_code = 'M145',
  predecessors = '["Maserati Coupe/Spyder"]'::jsonb,
  successors = '["Maserati GranTurismo (2023+)"]'::jsonb,
  engine_character = 'The Ferrari-derived 4.7L V8 produces 444-454hp with exotic character.',
  transmission_feel = 'ZF 6-speed automatic (early) or MC Shift (later). No manual.',
  chassis_dynamics = 'Grand tourer character. Comfortable high-speed cruising.',
  steering_feel = 'Hydraulic steering with Italian feel.',
  brake_confidence = 'Adequate for GT use.',
  sound_signature = 'Ferrari-derived V8 sounds magnificent. One of the great exhaust notes.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Proper GT comfort with back seats.',
  defining_strengths = '[
    {"title": "Ferrari V8", "description": "4.7L with magnificent sound."},
    {"title": "Italian Design", "description": "Beautiful grand tourer."},
    {"title": "Exhaust Note", "description": "One of the best engine sounds."},
    {"title": "Back Seats", "description": "Usable rear accommodation."},
    {"title": "Depreciation", "description": "Incredible value now."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Reliability", "description": "Italian exotic reliability."},
    {"title": "Running Costs", "description": "Exotic ownership costs."},
    {"title": "Transmission", "description": "Early ZF and MC Shift have issues."},
    {"title": "Electronics", "description": "Can be problematic."}
  ]'::jsonb,
  ideal_owner = 'Exotic sound appreciators. Those accepting Italian ownership.',
  not_ideal_for = 'Reliability focused. Budget-limited.',
  buyers_summary = 'MC Stradale is most focused. Verify service history extensively.',
  best_years_detailed = '[{"years": "2015-2019", "reason": "MC updates and refinements."}]'::jsonb,
  must_have_options = '[{"name": "MC Stradale", "reason": "Most focused version."},{"name": "Full Service History", "reason": "Essential."}]'::jsonb,
  price_guide = '{"low": {"price": "$35,000", "condition": "Higher mileage, needs work"}, "mid": {"price": "$52,000", "condition": "MC, 35-55K miles"}, "high": {"price": "$75,000+", "condition": "Low-mile MC Stradale"}}'::jsonb,
  annual_ownership_cost = '{"low": "$3,000", "typical": "$6,000", "heavy": "$15,000+", "notes": "Italian exotic ownership. Budget generously."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '5',
  notable_reviews = '[{"source": "Top Gear", "quote": "The GranTurismo has one of the best engine sounds ever. Worth it for that alone.", "rating": "8/10"}]'::jsonb,
  expert_quotes = '[{"person": "Jeremy Clarkson", "outlet": "Top Gear", "quote": "The GranTurismo sounds like God clearing his throat."}]'::jsonb
WHERE slug = 'maserati-granturismo';


-- ============================================================================
-- MITSUBISHI LANCER EVOLUTION X (2008-2015)
-- ============================================================================
UPDATE cars SET
  brand = 'Mitsubishi',
  country = 'Japan',
  essence = 'The final Evolution—4B11T power in the last rally-bred sedan before the nameplate ended.',
  heritage = E'The Evo X was the final Evolution. The 4B11T replaced the legendary 4G63 with modern technology. Dual-clutch SST and improved refinement made it more civilized while maintaining capability.',
  design_philosophy = 'Evolution of the rally formula with modern technology.',
  generation_code = 'CZ4A',
  predecessors = '["Mitsubishi Lancer Evolution IX"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The 4B11T 2.0L turbo produces 291hp with modern character.',
  transmission_feel = 'Manual (5-speed) or SST dual-clutch. Manual preferred by purists.',
  chassis_dynamics = 'S-AWC provides incredible capability.',
  steering_feel = 'Electric steering. Less feel than earlier Evos.',
  brake_confidence = 'Brembo brakes excellent.',
  sound_signature = 'Turbocharged four with blow-off valve.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'More refined than IX but still firm.',
  defining_strengths = '[
    {"title": "Final Evo", "description": "Last of the Evolution line."},
    {"title": "S-AWC", "description": "Super All-Wheel Control is exceptional."},
    {"title": "Manual Available", "description": "5-speed option."},
    {"title": "More Refined", "description": "More civilized than IX."},
    {"title": "Brembo Brakes", "description": "Excellent stopping power."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Not 4G63", "description": "4B11T lacks the character."},
    {"title": "SST Issues", "description": "Dual-clutch can be problematic."},
    {"title": "Electric Steering", "description": "Less feel than IX."},
    {"title": "Final Edition Premium", "description": "Collector prices rising."}
  ]'::jsonb,
  ideal_owner = 'Final Evo collectors. Rally enthusiasts.',
  not_ideal_for = '4G63 purists. SST reliability seekers.',
  buyers_summary = 'Manual preferred. Final Edition most collectible. Verify SST health.',
  best_years_detailed = '[{"years": "2015 Final Edition", "reason": "Most collectible. 303hp."}]'::jsonb,
  must_have_options = '[{"name": "Manual Transmission", "reason": "More reliable than SST."},{"name": "Final Edition", "reason": "303hp, collectible."}]'::jsonb,
  price_guide = '{"low": {"price": "$28,000", "condition": "SST, higher miles"}, "mid": {"price": "$38,000", "condition": "Manual GSR, 50-80K"}, "high": {"price": "$55,000+", "condition": "Final Edition, low miles"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$8,000+", "notes": "SST service is expensive if equipped."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '9',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The Evo X is the civilized end of the Evolution story.", "rating": "4/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The Evo X is faster but the IX was more special. Still a proper Evo."}]'::jsonb
WHERE slug = 'mitsubishi-lancer-evo-x';


-- ============================================================================
-- SUBARU WRX STI GD (2004-2007)
-- ============================================================================
UPDATE cars SET
  brand = 'Subaru',
  country = 'Japan',
  essence = 'The blob-eye to hawk-eye STI—EJ257 rally heritage in the iconic GD chassis.',
  heritage = E'The GD STI brought Subaru''s rally pedigree to America. The EJ257 turbo boxer and symmetrical AWD delivered the WRC-derived experience enthusiasts craved.',
  design_philosophy = 'Rally car for the street. WRC technology for consumers.',
  generation_code = 'GD',
  predecessors = '[]'::jsonb,
  successors = '["Subaru WRX STI GR/GV (2008-2014)"]'::jsonb,
  engine_character = 'The EJ257 2.5L turbo boxer produces 300hp with characteristic rumble.',
  transmission_feel = 'Manual only—6-speed with DCCD.',
  chassis_dynamics = 'Rally-derived suspension with symmetrical AWD.',
  steering_feel = 'Hydraulic steering with good feedback.',
  brake_confidence = 'Brembo brakes.',
  sound_signature = 'Boxer rumble. The Subaru sound.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Firm and focused.',
  defining_strengths = '[
    {"title": "EJ257 Boxer", "description": "Characteristic turbo boxer."},
    {"title": "Rally Heritage", "description": "WRC-derived technology."},
    {"title": "DCCD", "description": "Driver-controlled center diff."},
    {"title": "Manual Only", "description": "No automatic option."},
    {"title": "Classic Status", "description": "Iconic design era."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "EJ257 Issues", "description": "Ringland, head gasket concerns."},
    {"title": "Age", "description": "17-20 years old."},
    {"title": "Modification History", "description": "Most have been modified."},
    {"title": "Rust", "description": "Prone to corrosion."}
  ]'::jsonb,
  ideal_owner = 'STI purists. Rally enthusiasts. Those accepting EJ maintenance.',
  not_ideal_for = 'Reliability seekers. Modern amenities seekers.',
  buyers_summary = 'Stock cars command premiums. Verify engine health. Rust inspection essential.',
  best_years_detailed = '[{"years": "2006-2007 (Hawk-eye)", "reason": "Most refined GD styling."}]'::jsonb,
  must_have_options = '[{"name": "Stock Configuration", "reason": "Unmodified cars valuable."}]'::jsonb,
  price_guide = '{"low": {"price": "$18,000", "condition": "Modified, needs work"}, "mid": {"price": "$28,000", "condition": "Stock, 80-120K"}, "high": {"price": "$45,000+", "condition": "Low-mile stock"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$8,000+", "notes": "EJ257 needs proper maintenance."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The GD STI delivers WRC thrills for the street.", "rating": "4/5"}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "TST", "quote": "The GD STI is rally car accessible. Just budget for maintenance."}]'::jsonb
WHERE slug = 'subaru-wrx-sti-gd';


-- ============================================================================
-- SUBARU WRX STI GR/GV (2008-2014)
-- ============================================================================
UPDATE cars SET
  brand = 'Subaru',
  country = 'Japan',
  essence = 'The wide-body STI—EJ257 power in the widened GR/GV chassis.',
  heritage = E'The GR/GV STI continued the rally formula with widened bodywork. The EJ257 remained, providing the boxer character enthusiasts demanded.',
  design_philosophy = 'Evolution of the STI formula with aggressive styling.',
  generation_code = 'GR/GV',
  predecessors = '["Subaru WRX STI GD (2004-2007)"]'::jsonb,
  successors = '["Subaru WRX STI VA (2015-2021)"]'::jsonb,
  engine_character = 'The EJ257 2.5L turbo boxer produces 305hp.',
  transmission_feel = 'Manual only—6-speed with DCCD.',
  chassis_dynamics = 'Wider track improves handling.',
  steering_feel = 'Hydraulic steering.',
  brake_confidence = 'Brembo brakes.',
  sound_signature = 'Boxer rumble with turbo whistle.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Firm STI character.',
  defining_strengths = '[
    {"title": "Wide Body", "description": "Aggressive widened styling."},
    {"title": "EJ257", "description": "Characteristic boxer turbo."},
    {"title": "DCCD", "description": "Adjustable center diff."},
    {"title": "Manual Only", "description": "Pure engagement."},
    {"title": "Hydraulic Steering", "description": "Last STI with hydraulic."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "EJ257 Issues", "description": "Same ringland concerns."},
    {"title": "Age", "description": "10-16 years old."},
    {"title": "Modified Examples", "description": "Stock cars rare."}
  ]'::jsonb,
  ideal_owner = 'STI enthusiasts. Hydraulic steering appreciators.',
  not_ideal_for = 'Reliability focused. Modern amenities seekers.',
  buyers_summary = 'Hatch (GR) is most desirable. Stock cars valuable. Verify engine.',
  best_years_detailed = '[{"years": "2011-2014", "reason": "Wide-body sedan (GV)."},{"years": "2008-2014 (Hatch GR)", "reason": "Rare hatchback."}]'::jsonb,
  must_have_options = '[{"name": "Hatchback (GR)", "reason": "More desirable body style."}]'::jsonb,
  price_guide = '{"low": {"price": "$22,000", "condition": "Modified sedan"}, "mid": {"price": "$32,000", "condition": "Hatch, stock, 60-90K"}, "high": {"price": "$48,000+", "condition": "Low-mile stock hatch"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$8,000+", "notes": "EJ257 maintenance."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Evo", "quote": "The GR hatch is the ultimate STI form.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The STI hatch is the one to have. Looks right."}]'::jsonb
WHERE slug = 'subaru-wrx-sti-gr-gv';


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
WHERE slug IN ('camaro-ss-1le', 'toyota-gr-supra', 'maserati-granturismo', 'mitsubishi-lancer-evo-x', 'subaru-wrx-sti-gd', 'subaru-wrx-sti-gr-gv')
ORDER BY name;






