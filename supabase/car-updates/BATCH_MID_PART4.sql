-- ============================================================================
-- BATCH UPDATE: MID TIER CARS - PART 4
-- 
-- Cars: Z4M, RS5 B8, RS3 8V, TT RS 8J, C63 W205, M5 E39, M5 E60, M5 F10
-- ============================================================================


-- ============================================================================
-- BMW Z4M E85/E86 (2006-2008)
-- ============================================================================
UPDATE cars SET
  brand = 'BMW',
  country = 'Germany',
  essence = 'S54 in a roadster—the legendary inline-six in an open-top package.',
  heritage = E'The Z4M put the legendary S54 engine from the E46 M3 into a roadster body. The result was a more focused, lighter driving experience with that magnificent inline-six.',
  design_philosophy = 'Take the best M engine and put it in the lightest possible M car.',
  generation_code = 'E85/E86',
  predecessors = '["BMW Z3 M Roadster/Coupe"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The S54 3.2L inline-six produces 330hp with linear, high-revving delivery.',
  transmission_feel = 'Manual only—6-speed with excellent engagement.',
  chassis_dynamics = 'Lighter than E46 M3. Sharp and responsive.',
  steering_feel = 'Hydraulic steering with excellent feedback.',
  brake_confidence = 'Good brakes for the application.',
  sound_signature = 'S54 howl in an open cockpit. Magnificent.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Roadster compromises. Better than Miata comfort, less than GT.',
  defining_strengths = '[
    {"title": "S54 Engine", "description": "Legendary inline-six from E46 M3."},
    {"title": "Lighter Weight", "description": "Lighter than M3 improves character."},
    {"title": "Manual Only", "description": "No automatic available."},
    {"title": "Hydraulic Steering", "description": "Pure feedback."},
    {"title": "Coupe Option", "description": "E86 Coupe is stiffer and more focused."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Age", "description": "16-18 years old. Maintenance required."},
    {"title": "S54 Issues", "description": "Same VANOS/rod bearing concerns as E46 M3."},
    {"title": "Rear Diff Wear", "description": "Known to wear. Verify condition."}
  ]'::jsonb,
  ideal_owner = 'S54 enthusiasts wanting roadster experience. Open-top seekers.',
  not_ideal_for = 'Those wanting weather protection. Modern tech seekers.',
  buyers_summary = 'Coupe (E86) is stiffer and more desirable. Verify S54 health.',
  best_years_detailed = '[{"years": "2006-2008", "reason": "All years good. Coupe from 2006."}]'::jsonb,
  must_have_options = '[{"name": "E86 Coupe", "reason": "Stiffer body, more focused."}]'::jsonb,
  price_guide = '{"low": {"price": "$28,000", "condition": "Roadster, higher miles"}, "mid": {"price": "$38,000", "condition": "Coupe, 50-80K miles"}, "high": {"price": "$55,000+", "condition": "Low-mile Coupe"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,500", "typical": "$4,500", "heavy": "$8,000+", "notes": "S54 maintenance costs."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '8',
  notable_reviews = '[{"source": "Evo", "quote": "The Z4M Coupe is the best S54 experience available.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The Z4M Coupe is the forgotten hero. S54 in a smaller package."}]'::jsonb
WHERE slug = 'bmw-z4m-e85-e86';


-- ============================================================================
-- AUDI RS5 B8 (2013-2015)
-- ============================================================================
UPDATE cars SET
  brand = 'Audi',
  country = 'Germany',
  essence = 'The naturally aspirated farewell—a high-revving 4.2L V8 before turbocharging took over.',
  heritage = E'The B8 RS5 was the last naturally aspirated RS car. The 4.2L V8 revved to 8,250 RPM with a character that turbos can''t replicate. It marked the end of an era.',
  design_philosophy = 'Maximum naturally aspirated V8 character in an Audi coupe.',
  generation_code = 'B8',
  predecessors = '[]'::jsonb,
  successors = '["Audi RS5 B9 (2018+)"]'::jsonb,
  engine_character = 'The 4.2L V8 produces 450hp and revs to 8,250 RPM. NA character.',
  transmission_feel = '7-speed dual-clutch (S Tronic). Quick shifts.',
  chassis_dynamics = 'Quattro provides traction. Capable but heavy.',
  steering_feel = 'Electric steering typical of Audi.',
  brake_confidence = 'Good brakes with ceramic option.',
  sound_signature = 'High-revving V8 that sings to redline.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Audi comfort with sport capability.',
  defining_strengths = '[
    {"title": "4.2L V8", "description": "High-revving naturally aspirated character."},
    {"title": "8,250 RPM", "description": "Revs like an exotic."},
    {"title": "Quattro", "description": "All-weather capability."},
    {"title": "Last NA RS", "description": "End of an era."},
    {"title": "Depreciation", "description": "Values have dropped—excellent used value."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Heavy", "description": "Weight limits agility."},
    {"title": "No Manual", "description": "DCT only."},
    {"title": "Carbon Buildup", "description": "Direct injection requires walnut blasting."},
    {"title": "Understeer", "description": "Quattro character in fast corners."}
  ]'::jsonb,
  ideal_owner = 'NA V8 enthusiasts. Those wanting Audi quality with character.',
  not_ideal_for = 'Track-focused drivers. Agility seekers.',
  buyers_summary = 'Last NA Audi RS. Verify carbon buildup addressed. Great used value.',
  best_years_detailed = '[{"years": "2013-2015", "reason": "All years good. Later cars may have more service history."}]'::jsonb,
  must_have_options = '[{"name": "Sport Exhaust", "reason": "Essential for V8 sound."},{"name": "Dynamic Package", "reason": "Better handling."}]'::jsonb,
  price_guide = '{"low": {"price": "$38,000", "condition": "Higher mileage"}, "mid": {"price": "$48,000", "condition": "35-55K miles"}, "high": {"price": "$62,000+", "condition": "Low-mile, loaded"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,500", "typical": "$4,500", "heavy": "$8,000+", "notes": "Audi V8 maintenance."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '7',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The B8 RS5 has the last great NA Audi engine.", "rating": "4/5"}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "TST", "quote": "The B8 RS5''s V8 is special. They don''t make them like this anymore."}]'::jsonb
WHERE slug = 'audi-rs5-b8';


-- ============================================================================
-- AUDI RS3 8V (2017-2020)
-- ============================================================================
UPDATE cars SET
  brand = 'Audi',
  country = 'Germany',
  essence = 'Five-cylinder fury—the first US-market RS3 bringing that distinctive warble.',
  heritage = 'The 8V RS3 brought the five-cylinder to America for the first time. 400hp in a compact sedan with that distinctive engine note made it an instant hit with enthusiasts.',
  design_philosophy = 'Maximum five-cylinder character in compact package.',
  generation_code = '8V',
  predecessors = '[]'::jsonb,
  successors = '["Audi RS3 8Y (2022+)"]'::jsonb,
  engine_character = 'The 2.5L TFSI five-cylinder produces 400hp with immediate response.',
  transmission_feel = '7-speed dual-clutch. Quick and responsive.',
  chassis_dynamics = 'Quattro provides traction. Compact and agile.',
  steering_feel = 'Electric steering adequate.',
  brake_confidence = 'Good brakes.',
  sound_signature = 'Five-cylinder warble. Distinctive and addictive.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Firm ride but livable.',
  defining_strengths = '[
    {"title": "Five-Cylinder", "description": "Distinctive sound and character."},
    {"title": "400hp Compact", "description": "Serious power in small package."},
    {"title": "Quattro", "description": "All-weather capability."},
    {"title": "First US RS3", "description": "Historic for the market."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Firm Ride", "description": "RS suspension is stiff."},
    {"title": "No Manual", "description": "DCT only."},
    {"title": "Premium Price", "description": "RS tax is significant."}
  ]'::jsonb,
  ideal_owner = 'Five-cylinder enthusiasts. Compact performance seekers.',
  not_ideal_for = 'Comfort seekers. Manual fans.',
  buyers_summary = 'RS Design Package for full experience. The five-cylinder is the reason to buy.',
  best_years_detailed = '[{"years": "2018-2020", "reason": "All US years good."}]'::jsonb,
  must_have_options = '[{"name": "RS Design Package", "reason": "Full equipment."}]'::jsonb,
  price_guide = '{"low": {"price": "$42,000", "condition": "Higher mileage"}, "mid": {"price": "$52,000", "condition": "25-40K miles"}, "high": {"price": "$62,000+", "condition": "Low miles"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$3,500", "heavy": "$6,000+", "notes": "Audi RS costs."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '7',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The RS3 is a riot. That five-cylinder is addictive.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The RS3 sounds like nothing else. That''s enough reason to buy it."}]'::jsonb
WHERE slug = 'audi-rs3-8v';


-- ============================================================================
-- AUDI TT RS 8J (2012-2013)
-- ============================================================================
UPDATE cars SET
  brand = 'Audi',
  country = 'Germany',
  essence = 'The original five-cylinder TT—where the warble first met the coupe.',
  heritage = 'The 8J TT RS brought the five-cylinder to the TT platform. It was aggressive, distinctive, and proved the TT could be taken seriously.',
  design_philosophy = 'Five-cylinder performance in the iconic TT shape.',
  generation_code = '8J',
  predecessors = '[]'::jsonb,
  successors = '["Audi TT RS 8S (2018+)"]'::jsonb,
  engine_character = 'The 2.5L TFSI five-cylinder produces 360hp with that distinctive sound.',
  transmission_feel = 'Manual (6-speed) or S Tronic. Manual is rare and desirable.',
  chassis_dynamics = 'Quattro with sharp handling. Compact and responsive.',
  steering_feel = 'Electric steering.',
  brake_confidence = 'Good brakes.',
  sound_signature = 'Five-cylinder warble. The TT RS signature.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Sports car firm but acceptable.',
  defining_strengths = '[
    {"title": "Five-Cylinder", "description": "Distinctive character."},
    {"title": "Manual Available", "description": "Rare but available."},
    {"title": "Compact Size", "description": "Agile handling."},
    {"title": "Depreciation", "description": "Great used value now."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Age", "description": "11-12 years old."},
    {"title": "Interior Dated", "description": "8J interior shows age."},
    {"title": "Limited Space", "description": "2+2 coupe compromises."}
  ]'::jsonb,
  ideal_owner = 'Five-cylinder enthusiasts. Manual seekers. TT fans.',
  not_ideal_for = 'Space seekers. Modern tech wanters.',
  buyers_summary = 'Manual is rare and desirable. Verify service history.',
  best_years_detailed = '[{"years": "2012-2013", "reason": "Only US years."}]'::jsonb,
  must_have_options = '[{"name": "Manual Transmission", "reason": "Rare and engaging."}]'::jsonb,
  price_guide = '{"low": {"price": "$32,000", "condition": "S Tronic, higher miles"}, "mid": {"price": "$42,000", "condition": "Manual, 40-60K miles"}, "high": {"price": "$55,000+", "condition": "Low-mile manual"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$3,500", "heavy": "$6,000+", "notes": "Audi ownership costs."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '6',
  notable_reviews = '[{"source": "Evo", "quote": "The TT RS proves the TT can be serious. That five-cylinder is special.", "rating": "4/5"}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "TST", "quote": "The 8J TT RS with a manual is the one to have."}]'::jsonb
WHERE slug = 'audi-tt-rs-8j';


-- ============================================================================
-- MERCEDES-AMG C63 W205 (2015-2021)
-- ============================================================================
UPDATE cars SET
  brand = 'Mercedes-AMG',
  country = 'Germany',
  essence = 'The last V8 C-Class—503hp of hand-built AMG fury before electrification.',
  heritage = E'The W205 C63 brought the twin-turbo 4.0L V8 to the C-Class. Each engine hand-built by a single craftsman. It was the last V8 C63 before hybridization took over.',
  design_philosophy = 'Maximum V8 in a compact sedan. AMG character in everyday package.',
  generation_code = 'W205',
  predecessors = '["Mercedes-AMG C63 W204 (2008-2014)"]'::jsonb,
  successors = '["Mercedes-AMG C63 W206 (2024+)"]'::jsonb,
  engine_character = 'The M177 4.0L twin-turbo V8 produces 469-503hp with AMG character.',
  transmission_feel = 'AMG Speedshift 9-speed. Quick and aggressive.',
  chassis_dynamics = 'Capable rear-drive with optional limited-slip diff.',
  steering_feel = 'Electric steering. Well-weighted.',
  brake_confidence = 'AMG brakes with ceramic option.',
  sound_signature = 'AMG V8 burble and crackle.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Comfortable with adaptive suspension.',
  defining_strengths = '[
    {"title": "Hand-Built V8", "description": "One man, one engine. AMG tradition."},
    {"title": "Last V8 C63", "description": "Before hybridization."},
    {"title": "503hp (S)", "description": "Serious power in compact package."},
    {"title": "AMG Sound", "description": "Burbles and crackles."},
    {"title": "Daily Usability", "description": "Comfortable and practical."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "No Manual", "description": "Automatic only."},
    {"title": "Heavy", "description": "Weight limits agility."},
    {"title": "Running Costs", "description": "AMG maintenance isn''t cheap."}
  ]'::jsonb,
  ideal_owner = 'V8 enthusiasts. Those wanting AMG character. Daily drivers wanting performance.',
  not_ideal_for = 'Manual seekers. Agility focused.',
  buyers_summary = 'S model for 503hp. AMG Performance Exhaust essential. Last V8 C63.',
  best_years_detailed = '[{"years": "2019-2021", "reason": "Final years with all updates."}]'::jsonb,
  must_have_options = '[{"name": "S Model", "reason": "503hp, LSD, better dynamics."},{"name": "AMG Performance Exhaust", "reason": "Essential for sound."}]'::jsonb,
  price_guide = '{"low": {"price": "$42,000", "condition": "Base, higher miles"}, "mid": {"price": "$58,000", "condition": "S, 25-45K miles"}, "high": {"price": "$78,000+", "condition": "Low-mile S with options"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,500", "typical": "$4,500", "heavy": "$9,000+", "notes": "AMG V8 maintenance."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '8',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The C63 S is brutally fast and sounds incredible.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The C63 S is the best AMG V8 sedan. That engine is magnificent."}]'::jsonb
WHERE slug = 'mercedes-amg-c63-w205';


-- ============================================================================
-- BMW M5 E39 (1999-2003)
-- ============================================================================
UPDATE cars SET
  brand = 'BMW',
  country = 'Germany',
  essence = 'The gentleman''s express—S62 V8 perfection in the most refined M5 ever made.',
  heritage = E'The E39 M5 is often considered the best M5. The S62 V8 produced 394hp, mated to a manual transmission and wrapped in understated elegance. It was fast without being vulgar.',
  design_philosophy = 'Maximum performance with executive refinement.',
  generation_code = 'E39',
  predecessors = '["BMW M5 E34"]'::jsonb,
  successors = '["BMW M5 E60"]'::jsonb,
  engine_character = 'The S62 4.9L V8 produces 394hp with smooth, linear delivery.',
  transmission_feel = 'Manual only—6-speed with excellent engagement.',
  chassis_dynamics = 'Balanced and capable while remaining comfortable.',
  steering_feel = 'Hydraulic steering with excellent feedback.',
  brake_confidence = 'Good brakes for the era.',
  sound_signature = 'Refined V8 that snarls when provoked.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Excellent balance of comfort and performance.',
  defining_strengths = '[
    {"title": "S62 V8", "description": "Smooth, powerful, refined."},
    {"title": "Manual Only", "description": "No automatic available."},
    {"title": "Hydraulic Steering", "description": "Last M5 with this feel."},
    {"title": "Understated Design", "description": "Fast without being vulgar."},
    {"title": "Classic Status", "description": "Widely regarded as best M5."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Age", "description": "21-25 years old. Maintenance required."},
    {"title": "VANOS", "description": "System needs attention with age."},
    {"title": "Electronics", "description": "Era-specific electrical concerns."},
    {"title": "Cooling System", "description": "Needs proactive maintenance."}
  ]'::jsonb,
  ideal_owner = 'M5 purists. Manual enthusiasts. Those who value refinement.',
  not_ideal_for = 'Reliability focused without budget. Modern tech seekers.',
  buyers_summary = 'Verify VANOS and cooling system. Service history essential. The benchmark M5.',
  best_years_detailed = '[{"years": "2000-2003", "reason": "All updates in place."}]'::jsonb,
  must_have_options = '[{"name": "Service History", "reason": "Essential for this age."}]'::jsonb,
  price_guide = '{"low": {"price": "$22,000", "condition": "Needs work"}, "mid": {"price": "$35,000", "condition": "Good condition, 80-120K"}, "high": {"price": "$65,000+", "condition": "Low-mile, exceptional"}}'::jsonb,
  annual_ownership_cost = '{"low": "$3,000", "typical": "$5,000", "heavy": "$10,000+", "notes": "25-year-old BMW M maintenance."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '9',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The E39 M5 is the greatest sport sedan ever made.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The E39 M5 is the benchmark. Nothing has matched its combination of performance and refinement."}]'::jsonb
WHERE slug = 'bmw-m5-e39';


-- ============================================================================
-- BMW M5 E60 (2006-2010)
-- ============================================================================
UPDATE cars SET
  brand = 'BMW',
  country = 'Germany',
  essence = 'The V10 lunatic—507hp of naturally aspirated fury with F1-derived technology.',
  heritage = E'The E60 M5 went extreme with a 507hp V10 derived from F1 technology. It revved to 8,250 RPM and made sounds no sedan should make. It was dramatic, demanding, and utterly special.',
  design_philosophy = 'Maximum drama with F1-derived V10 technology.',
  generation_code = 'E60/E61',
  predecessors = '["BMW M5 E39"]'::jsonb,
  successors = '["BMW M5 F10"]'::jsonb,
  engine_character = 'The S85 5.0L V10 produces 507hp and revs to 8,250 RPM. F1-derived.',
  transmission_feel = 'SMG III or 6-speed manual (very rare). SMG is polarizing.',
  chassis_dynamics = 'Capable but heavy. Best with EDC.',
  steering_feel = 'Electric/hydraulic hybrid. Less feel than E39.',
  brake_confidence = 'Good brakes.',
  sound_signature = 'V10 scream that rivals supercars.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Comfortable but firm in sport mode.',
  defining_strengths = '[
    {"title": "S85 V10", "description": "507hp, 8,250 RPM. F1-derived."},
    {"title": "V10 Sound", "description": "Screams like a supercar."},
    {"title": "Manual Option", "description": "Very rare but available."},
    {"title": "Drama", "description": "Nothing else like it."},
    {"title": "Depreciation", "description": "Incredible performance for the price now."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Rod Bearings", "description": "Major known issue. Budget $5K+ for preventive replacement."},
    {"title": "SMG Pump", "description": "Can fail expensively."},
    {"title": "VANOS", "description": "Bolts can fail catastrophically."},
    {"title": "High Maintenance", "description": "This is not a cheap car to own."}
  ]'::jsonb,
  ideal_owner = 'V10 enthusiasts willing to maintain properly. Manual seekers (rare).',
  not_ideal_for = 'Budget-limited. Reliability focused.',
  buyers_summary = 'MUST verify rod bearings replaced. Manual is unicorn rare. Budget for ownership.',
  best_years_detailed = '[{"years": "2008-2010", "reason": "Updates, more likely to have maintenance done."}]'::jsonb,
  must_have_options = '[{"name": "Rod Bearing Service", "reason": "Non-negotiable. Verify or plan."},{"name": "6-Speed Manual", "reason": "Extremely rare and valuable."}]'::jsonb,
  price_guide = '{"low": {"price": "$18,000", "condition": "Needs work, rod bearings unknown"}, "mid": {"price": "$32,000", "condition": "Rod bearings done, 80-120K miles"}, "high": {"price": "$85,000+", "condition": "Manual, low miles, all service done"}}'::jsonb,
  annual_ownership_cost = '{"low": "$4,000", "typical": "$7,000", "heavy": "$15,000+", "notes": "V10 ownership requires commitment and budget."}'::jsonb,
  common_issues_detailed = '[{"issue": "Rod Bearings", "severity": "catastrophic", "frequency": "common", "cost": "$5,000-8,000", "notes": "Must be addressed. Failure destroys engine."},{"issue": "VANOS Bolts", "severity": "catastrophic", "frequency": "uncommon", "cost": "$2,000-4,000", "notes": "Can fail and cause significant damage."},{"issue": "SMG Pump", "severity": "major", "frequency": "common", "cost": "$3,000-5,000", "notes": "SMG cars only."}]'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '8',
  notable_reviews = '[{"source": "Top Gear", "quote": "The E60 M5 is insane. That V10 is extraordinary.", "rating": "9/10"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The E60 M5 with a manual is one of the most special cars ever made. Just budget accordingly."}]'::jsonb
WHERE slug = 'bmw-m5-e60';


-- ============================================================================
-- BMW M5 F10 COMPETITION (2014-2016)
-- ============================================================================
UPDATE cars SET
  brand = 'BMW',
  country = 'Germany',
  essence = 'The return to reason—twin-turbo V8 reliability with massive performance.',
  heritage = E'After the V10''s drama, the F10 M5 returned to a twin-turbo V8. The S63 produced 560-575hp with more reliability than the S85. It was faster, easier to live with, and still properly fast.',
  design_philosophy = 'Maximum V8 performance with improved livability.',
  generation_code = 'F10',
  predecessors = '["BMW M5 E60"]'::jsonb,
  successors = '["BMW M5 F90 (2018+)"]'::jsonb,
  engine_character = 'The S63 4.4L twin-turbo V8 produces 560-575hp with immediate torque.',
  transmission_feel = 'DCT (7-speed). Fast and capable. Manual for 6-speed for one year.',
  chassis_dynamics = 'Capable with adaptive suspension.',
  steering_feel = 'Electric steering. Numb but accurate.',
  brake_confidence = 'Good brakes with ceramic option.',
  sound_signature = 'Twin-turbo V8. Less drama than V10.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Comfortable daily driver.',
  defining_strengths = '[
    {"title": "S63 Twin-Turbo V8", "description": "560-575hp with more reliability."},
    {"title": "Manual Option (2013)", "description": "Very rare but existed."},
    {"title": "Competition Package", "description": "575hp with improved dynamics."},
    {"title": "Daily Usability", "description": "More livable than E60."},
    {"title": "Strong Performance", "description": "Brutally fast."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Electric Steering", "description": "Numb compared to E39."},
    {"title": "Less Character", "description": "More clinical than V10."},
    {"title": "DCT Issues", "description": "Some units had problems."},
    {"title": "Weight", "description": "Heavy sedan."}
  ]'::jsonb,
  ideal_owner = 'Those wanting M5 performance without V10 drama. Competition seekers.',
  not_ideal_for = 'Character seekers. Manual purists (unless finding the rare 6MT).',
  buyers_summary = 'Competition Package for maximum power. Verify DCT health.',
  best_years_detailed = '[{"years": "2014-2016", "reason": "Competition Package years."}]'::jsonb,
  must_have_options = '[{"name": "Competition Package", "reason": "575hp, better dynamics."}]'::jsonb,
  price_guide = '{"low": {"price": "$32,000", "condition": "Base, higher miles"}, "mid": {"price": "$48,000", "condition": "Competition, 50-80K miles"}, "high": {"price": "$68,000+", "condition": "Low-mile Competition or 6MT"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,500", "typical": "$4,500", "heavy": "$9,000+", "notes": "More reasonable than V10 ownership."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '8',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The F10 M5 Competition is brutally effective.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "TST", "quote": "The F10 M5 is the sensible M5. Still insanely fast."}]'::jsonb
WHERE slug = 'bmw-m5-f10-competition';


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
WHERE slug IN ('bmw-z4m-e85-e86', 'audi-rs5-b8', 'audi-rs3-8v', 'audi-tt-rs-8j', 'mercedes-amg-c63-w205', 'bmw-m5-e39', 'bmw-m5-e60', 'bmw-m5-f10-competition')
ORDER BY name;






