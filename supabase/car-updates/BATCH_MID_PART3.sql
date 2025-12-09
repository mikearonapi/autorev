-- ============================================================================
-- BATCH UPDATE: MID TIER CARS - PART 3
-- 
-- Cars: WRX STI, S2000, 300ZX TT, Nissan Z, M3 E46, M3 E92, M3 F80
-- ============================================================================


-- ============================================================================
-- SUBARU WRX STI VA (2015-2021)
-- ============================================================================
UPDATE cars SET
  brand = 'Subaru',
  country = 'Japan',
  essence = 'The rally icon—EJ257 boxer turbo and symmetrical AWD in the last proper STI before electrification.',
  heritage = E'The VA STI continued Subaru''s rally-bred legacy with the proven EJ257 engine and symmetrical AWD. It was the enthusiast choice—raw, engaging, and rewarding in a way modern cars rarely achieve.\n\nThis was the final STI with the EJ platform before Subaru moved to new architecture. For purists, it''s the last true STI.',
  design_philosophy = 'Rally DNA for the street. Boxer engine, symmetrical AWD, driver engagement.',
  generation_code = 'VA',
  predecessors = '["Subaru WRX STI GV (2008-2014)"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The EJ257 turbo boxer produces 310hp with characteristic boxer rumble.',
  transmission_feel = 'Manual only—6-speed with notchy but satisfying engagement.',
  chassis_dynamics = 'Symmetrical AWD provides incredible traction. DCCD allows driver adjustability.',
  steering_feel = 'Electric steering with decent feel for the class.',
  brake_confidence = 'Brembo brakes standard. Excellent stopping power.',
  sound_signature = 'Boxer rumble with turbo sounds. Distinctive and beloved.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Firm ride, loud cabin. Sports car in sedan clothes.',
  defining_strengths = '[
    {"title": "EJ257 Engine", "description": "Proven boxer turbo with distinct character."},
    {"title": "Symmetrical AWD", "description": "Incredible traction and balance."},
    {"title": "Manual Only", "description": "No automatic option. Pure."},
    {"title": "DCCD", "description": "Driver-adjustable center differential."},
    {"title": "Last True STI", "description": "Final EJ-powered STI."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Fuel Economy", "description": "EJ257 is thirsty."},
    {"title": "Engine Reliability", "description": "EJ engines need careful maintenance."},
    {"title": "Ringland Failure", "description": "Known weak point. Requires attention."},
    {"title": "Dated Interior", "description": "Not luxury-car quality."}
  ]'::jsonb,
  ideal_owner = 'Rally enthusiasts. Manual transmission purists. Those who appreciate boxer character.',
  not_ideal_for = 'Reliability focused. Those wanting refinement. Efficiency seekers.',
  buyers_summary = 'Verify engine health. Stock cars preferred. Service history essential.',
  best_years_detailed = '[{"years": "2019-2021", "reason": "All updates, Series.White and S209 special editions."}]'::jsonb,
  must_have_options = '[{"name": "Stock Configuration", "reason": "Unmodified cars are more reliable."}]'::jsonb,
  price_guide = '{"low": {"price": "$32,000", "condition": "Higher mileage, modified"}, "mid": {"price": "$42,000", "condition": "Stock, 30-50K miles"}, "high": {"price": "$65,000+", "condition": "Low-mile S209 or stock Limited"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$8,000+", "notes": "EJ engines need proper maintenance."}'::jsonb,
  common_issues_detailed = '[{"issue": "Ringland Failure", "severity": "major", "frequency": "uncommon", "cost": "$5,000+", "notes": "Common on tuned cars. Stock cars less affected."}]'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The STI is the last of its kind. Enjoy it while you can.", "rating": "4/5"}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "TST", "quote": "The STI is what enthusiasts actually want. No compromises."}]'::jsonb
WHERE slug = 'subaru-wrx-sti-va';


-- ============================================================================
-- HONDA S2000 (1999-2009)
-- ============================================================================
UPDATE cars SET
  brand = 'Honda',
  country = 'Japan',
  essence = 'VTEC perfection—a 9,000 RPM screamer in a perfectly balanced roadster that defined driver engagement.',
  heritage = E'The S2000 was Honda''s 50th anniversary gift to enthusiasts. The F20C engine revved to 9,000 RPM with the highest specific output of any naturally aspirated production engine. The chassis was perfectly balanced.\n\nIt became the benchmark for driver engagement—a car that rewarded skill and demanded attention. The S2000 proved Honda could build something truly special.',
  design_philosophy = 'Build the ultimate driver''s roadster. High-revving engine, perfect balance, pure engagement.',
  generation_code = 'AP1/AP2',
  predecessors = '[]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The F20C (AP1) revs to 9,000 RPM. The F22C1 (AP2) trades some revs for torque. Both are legendary.',
  transmission_feel = 'Manual only—6-speed with exceptional precision. No automatic ever offered.',
  chassis_dynamics = 'Perfect 50:50 weight distribution. The chassis communicates everything.',
  steering_feel = 'Electric steering (early) or electric (later) with exceptional feedback.',
  brake_confidence = 'Good brakes for the weight and character.',
  sound_signature = 'VTEC engagement and high-RPM scream. One of the great engine sounds.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Roadster compromises. Not comfortable but livable.',
  defining_strengths = '[
    {"title": "F20C/F22C Engine", "description": "9,000 RPM naturally aspirated perfection."},
    {"title": "Perfect Balance", "description": "50:50 weight distribution. Telepathic handling."},
    {"title": "Manual Only", "description": "No automatic ever offered. Pure."},
    {"title": "Honda Quality", "description": "Bulletproof reliability with proper care."},
    {"title": "Collector Status", "description": "Values have appreciated significantly."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Snap Oversteer", "description": "AP1 can bite at the limit. Demands skill."},
    {"title": "Age", "description": "15-25 years old now. Condition varies."},
    {"title": "High Prices", "description": "Clean examples command premiums."},
    {"title": "Limited Practicality", "description": "Two seats, small trunk."}
  ]'::jsonb,
  ideal_owner = 'VTEC enthusiasts. Roadster lovers. Those who appreciate high-revving engines.',
  not_ideal_for = 'Beginner drivers. Comfort seekers. Budget buyers.',
  buyers_summary = 'AP2 for more torque and refinement. AP1 for higher revs. Stock cars command significant premiums.',
  best_years_detailed = '[{"years": "2004-2009 (AP2)", "reason": "More torque, refined handling."},{"years": "2000-2003 (AP1)", "reason": "9,000 RPM redline, rawer character."}]'::jsonb,
  must_have_options = '[{"name": "Stock Configuration", "reason": "Unmodified cars are significantly more valuable."}]'::jsonb,
  price_guide = '{"low": {"price": "$28,000", "condition": "Higher mileage, modified"}, "mid": {"price": "$42,000", "condition": "Stock, 60-90K miles"}, "high": {"price": "$65,000+", "condition": "Low-mile CR or stock AP1"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$2,500", "heavy": "$5,000+", "notes": "Honda reliability keeps costs down."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The S2000 is the finest sports car Honda has ever built.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The S2000 is the car that made me understand Honda. That engine is extraordinary."}]'::jsonb
WHERE slug = 'honda-s2000';


-- ============================================================================
-- NISSAN 300ZX TWIN TURBO Z32 (1990-1996)
-- ============================================================================
UPDATE cars SET
  brand = 'Nissan',
  country = 'Japan',
  essence = 'The high-tech hero—twin-turbo V6 with technology that defined 90s Japanese performance.',
  heritage = E'The Z32 300ZX Twin Turbo was Nissan''s technology showcase. With a twin-turbo 3.0L V6, four-wheel steering, and sophisticated suspension, it proved Japanese cars could compete with Porsche.\n\nThe TT version was a genuine supercar killer in its day, offering Ferrari-baiting performance at a fraction of the cost.',
  design_philosophy = 'Build the most advanced Japanese sports car possible. Technology, power, style.',
  generation_code = 'Z32',
  predecessors = '["Nissan 300ZX Z31"]'::jsonb,
  successors = '["Nissan 350Z (Z33)"]'::jsonb,
  engine_character = 'The VG30DETT twin-turbo V6 produces 300hp with smooth power delivery.',
  transmission_feel = 'Manual (5-speed) is the choice. Automatic exists but defeats the purpose.',
  chassis_dynamics = 'Sophisticated suspension with optional HICAS four-wheel steering.',
  steering_feel = 'Hydraulic steering with good feedback.',
  brake_confidence = 'Adequate for the era. Upgrades are common.',
  sound_signature = 'Twin-turbo V6 with 90s character.',
  comfort_track_balance = 'daily',
  comfort_notes = 'GT-car comfort by 90s standards.',
  defining_strengths = '[
    {"title": "VG30DETT Engine", "description": "Twin-turbo V6 with smooth power."},
    {"title": "90s Technology", "description": "HICAS, sophisticated suspension."},
    {"title": "Stunning Design", "description": "Still looks good 30 years later."},
    {"title": "Tuning Potential", "description": "VG30DETT responds well to modifications."},
    {"title": "Collectibility", "description": "Values are rising. Future classic."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Age", "description": "28-34 years old. Everything needs attention."},
    {"title": "Maintenance Access", "description": "Engine bay is cramped. Simple jobs become complex."},
    {"title": "Parts Availability", "description": "Some parts becoming scarce."},
    {"title": "Complexity", "description": "90s tech means potential electrical issues."}
  ]'::jsonb,
  ideal_owner = 'JDM enthusiasts. 90s nostalgia seekers. Those who appreciate the era.',
  not_ideal_for = 'Reliability focused. Those wanting easy maintenance.',
  buyers_summary = 'Twin Turbo only. Manual transmission essential. Verify maintenance history.',
  best_years_detailed = '[{"years": "1994-1996", "reason": "Later cars with updates."}]'::jsonb,
  must_have_options = '[{"name": "Twin Turbo", "reason": "Essential. NA is not the same experience."},{"name": "Manual Transmission", "reason": "5-speed for engagement."}]'::jsonb,
  price_guide = '{"low": {"price": "$22,000", "condition": "Needs work"}, "mid": {"price": "$35,000", "condition": "Good condition, 80-120K miles"}, "high": {"price": "$55,000+", "condition": "Low-mile, documented"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,500", "typical": "$5,000", "heavy": "$10,000+", "notes": "30-year-old complexity requires budget."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '8',
  notable_reviews = '[{"source": "Road & Track (1990)", "quote": "The 300ZX TT is the most sophisticated Japanese sports car ever.", "rating": null}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "TST", "quote": "The Z32 TT was ahead of its time. It still impresses today."}]'::jsonb
WHERE slug = 'nissan-300zx-twin-turbo-z32';


-- ============================================================================
-- NISSAN Z RZ34 (2023-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'Nissan',
  country = 'Japan',
  essence = 'The Z reborn—twin-turbo V6 power with retro-modern styling that honors the heritage.',
  heritage = E'The new Z brought the nameplate back with style and substance. Twin-turbo 3.0L V6 from the Infiniti Q60, 400hp, and manual transmission option made it a proper sports car.\n\nThe design honored Z heritage with modern execution. After years of the aging 370Z, Nissan finally delivered a worthy successor.',
  design_philosophy = 'Honor Z heritage with modern performance. Retro styling, current technology.',
  generation_code = 'RZ34',
  predecessors = '["Nissan 370Z (Z34)"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The VR30DDTT twin-turbo V6 produces 400hp with immediate boost response.',
  transmission_feel = 'Manual (6-speed) or 9-speed automatic. Manual is the enthusiast choice.',
  chassis_dynamics = 'Modern chassis with good balance. Front-engine, rear-drive purity.',
  steering_feel = 'Electric steering with acceptable feedback.',
  brake_confidence = 'Good brakes from the factory.',
  sound_signature = 'Twin-turbo V6 with sporting character.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Sports car compromises but livable.',
  defining_strengths = '[
    {"title": "400hp Twin-Turbo", "description": "Serious power from the VR30."},
    {"title": "Manual Available", "description": "6-speed for purists."},
    {"title": "Retro-Modern Design", "description": "Honors heritage beautifully."},
    {"title": "Value", "description": "Significant performance for the price."},
    {"title": "Z Heritage", "description": "Proper successor to the nameplate."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Interior Quality", "description": "Not premium-car levels."},
    {"title": "Infotainment", "description": "Dated compared to competitors."},
    {"title": "Limited Production", "description": "Hard to find at MSRP."},
    {"title": "No LSD Standard (base)", "description": "Performance model recommended."}
  ]'::jsonb,
  ideal_owner = 'Z enthusiasts. Manual transmission seekers. Those wanting Japanese sports car character.',
  not_ideal_for = 'Tech-focused buyers. Luxury seekers.',
  buyers_summary = 'Performance grade for the limited-slip differential. Manual for engagement.',
  best_years_detailed = '[{"years": "2023-2024", "reason": "All current production years are good."}]'::jsonb,
  must_have_options = '[{"name": "Performance Grade", "reason": "LSD, bigger brakes."},{"name": "Manual Transmission", "reason": "The Z experience."}]'::jsonb,
  price_guide = '{"low": {"price": "$42,000", "condition": "Base automatic"}, "mid": {"price": "$52,000", "condition": "Performance manual"}, "high": {"price": "$65,000+", "condition": "Proto Spec or low-mile Performance"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$3,000", "heavy": "$5,000+", "notes": "New car warranty applies."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '8',
  notable_reviews = '[{"source": "Motor Trend", "quote": "The new Z delivers on its promise. Nissan got this one right.", "rating": "8/10"}]'::jsonb,
  expert_quotes = '[{"person": "Jason Cammisa", "outlet": "Hagerty", "quote": "The new Z is what we''ve been waiting for. It''s a proper sports car again."}]'::jsonb
WHERE slug = 'nissan-z-rz34';


-- ============================================================================
-- BMW M3 E46 (2001-2006)
-- ============================================================================
UPDATE cars SET
  brand = 'BMW',
  country = 'Germany',
  essence = 'The benchmark—S54 inline-six perfection in the car that defined a generation of M enthusiasts.',
  heritage = E'The E46 M3 is widely regarded as the best M3 ever made. The S54 inline-six, balanced chassis, and pure driving experience created a benchmark that subsequent M cars are still measured against.\n\nIt was the last naturally aspirated M3 with hydraulic steering—a combination that many consider irreplaceable.',
  design_philosophy = 'Perfect the M3 formula. Inline-six, rear-drive, balanced chassis, pure engagement.',
  generation_code = 'E46',
  predecessors = '["BMW M3 E36"]'::jsonb,
  successors = '["BMW M3 E90/E92"]'::jsonb,
  engine_character = 'The S54 3.2L inline-six produces 333hp with linear, high-revving character.',
  transmission_feel = 'Manual (6-speed) is the definitive experience. SMG exists but less desirable.',
  chassis_dynamics = 'The benchmark for balanced handling. Communicative and rewarding.',
  steering_feel = 'Hydraulic steering with legendary feedback.',
  brake_confidence = 'Good brakes. CSL had improved system.',
  sound_signature = 'S54 inline-six howl to 8,000 RPM. Magnificent.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Comfortable enough for daily use. Firm but not punishing.',
  defining_strengths = '[
    {"title": "S54 Engine", "description": "One of the greatest engines BMW ever made."},
    {"title": "Hydraulic Steering", "description": "The last M3 with genuine steering feel."},
    {"title": "Perfect Balance", "description": "The chassis benchmark."},
    {"title": "Manual Transmission", "description": "6-speed perfection."},
    {"title": "Classic Status", "description": "Recognized as one of the greatest sports sedans."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Age", "description": "18-23 years old. Maintenance required."},
    {"title": "Subframe Issues", "description": "Known cracking problem. Must verify repair."},
    {"title": "VANOS Issues", "description": "Seals wear and need attention."},
    {"title": "Rod Bearing Concerns", "description": "Preventive maintenance recommended."}
  ]'::jsonb,
  ideal_owner = 'M3 purists. Those who value steering feel above all. Manual transmission appreciators.',
  not_ideal_for = 'Those wanting modern tech. Reliability-focused buyers without maintenance budget.',
  buyers_summary = 'Verify subframe status. Manual transmission essential. Service history critical.',
  best_years_detailed = '[{"years": "2003-2006", "reason": "Updates and CSL availability."}]'::jsonb,
  must_have_options = '[{"name": "6-Speed Manual", "reason": "Essential. SMG is less desirable."},{"name": "Subframe Reinforcement", "reason": "Verify or add."}]'::jsonb,
  price_guide = '{"low": {"price": "$25,000", "condition": "Higher mileage, needs work"}, "mid": {"price": "$42,000", "condition": "Good condition, 80-120K miles"}, "high": {"price": "$85,000+", "condition": "Low-mile manual, perfect condition"}}'::jsonb,
  annual_ownership_cost = '{"low": "$3,000", "typical": "$5,000", "heavy": "$10,000+", "notes": "Age-related maintenance. Budget for preventive work."}'::jsonb,
  common_issues_detailed = '[{"issue": "Subframe Cracking", "severity": "major", "frequency": "common", "cost": "$2,000-4,000", "notes": "Must verify reinforcement or repair."},{"issue": "VANOS Seals", "severity": "moderate", "frequency": "common", "cost": "$500-1,000", "notes": "Seals wear with age."}]'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '10',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The E46 M3 is the greatest sports sedan ever made.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The E46 M3 is the benchmark. Everything else is compared to this."}]'::jsonb
WHERE slug = 'bmw-m3-e46';


-- ============================================================================
-- BMW M3 E92 (2008-2013)
-- ============================================================================
UPDATE cars SET
  brand = 'BMW',
  country = 'Germany',
  essence = 'The V8 M3—8,400 RPM screamer that proved BMW could build emotional engines.',
  heritage = E'The E92 M3 broke tradition with a V8. The S65 produced 414hp and revved to 8,400 RPM—more motorcycle than car. It polarized enthusiasts but delivered undeniable performance.\n\nThe high-revving character and hydraulic steering made it special, even if some missed the inline-six soul.',
  design_philosophy = 'Add cylinders, add emotion. The V8 M3 was about drama and sound.',
  generation_code = 'E90/E92/E93',
  predecessors = '["BMW M3 E46"]'::jsonb,
  successors = '["BMW M3 F80"]'::jsonb,
  engine_character = 'The S65 4.0L V8 produces 414hp and revs to 8,400 RPM. High-revving character.',
  transmission_feel = 'Manual (6-speed) or DCT. Both excellent. Manual for purists.',
  chassis_dynamics = 'Capable and balanced. Heavier than E46 but still communicative.',
  steering_feel = 'Hydraulic steering with good feedback.',
  brake_confidence = 'Good brakes from factory.',
  sound_signature = 'V8 scream to 8,400 RPM. One of the great engine sounds.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Comfortable GT character. Daily usable.',
  defining_strengths = '[
    {"title": "S65 V8", "description": "8,400 RPM screamer. Motorcycle for cars."},
    {"title": "Hydraulic Steering", "description": "Last M3 with hydraulic feel."},
    {"title": "Manual Available", "description": "6-speed for purists."},
    {"title": "Sound", "description": "The V8 wail is intoxicating."},
    {"title": "Balanced Chassis", "description": "Capable and communicative."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Rod Bearing Issues", "description": "Known weakness. Preventive replacement recommended."},
    {"title": "Throttle Actuators", "description": "Can fail. Expensive repair."},
    {"title": "Running Costs", "description": "V8 maintenance isn''t cheap."},
    {"title": "Weight", "description": "Heavier than E46."}
  ]'::jsonb,
  ideal_owner = 'V8 enthusiasts. Those who appreciate high-revving character. Manual seekers.',
  not_ideal_for = 'Budget-limited buyers. Inline-six purists.',
  buyers_summary = 'Verify rod bearing status. Manual transmission preferred. Service history essential.',
  best_years_detailed = '[{"years": "2011-2013", "reason": "Competition Package, updates."}]'::jsonb,
  must_have_options = '[{"name": "Competition Package", "reason": "Better suspension and LSD."},{"name": "6-Speed Manual", "reason": "For engagement."}]'::jsonb,
  price_guide = '{"low": {"price": "$28,000", "condition": "Higher mileage DCT"}, "mid": {"price": "$42,000", "condition": "Manual, 50-80K miles"}, "high": {"price": "$65,000+", "condition": "Low-mile manual Competition"}}'::jsonb,
  annual_ownership_cost = '{"low": "$3,000", "typical": "$5,500", "heavy": "$12,000+", "notes": "V8 maintenance. Rod bearing service recommended."}'::jsonb,
  common_issues_detailed = '[{"issue": "Rod Bearings", "severity": "major", "frequency": "common", "cost": "$4,000-6,000", "notes": "Preventive replacement strongly recommended."},{"issue": "Throttle Actuators", "severity": "major", "frequency": "uncommon", "cost": "$3,000-5,000", "notes": "Can fail and cause limp mode."}]'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '9',
  notable_reviews = '[{"source": "Top Gear", "quote": "The E92 M3 is dramatic in ways modern M cars aren''t. That V8 is special.", "rating": "9/10"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The S65 V8 is one of the greatest engines BMW ever made. Worth the maintenance."}]'::jsonb
WHERE slug = 'bmw-m3-e92';


-- ============================================================================
-- BMW M3 F80 (2015-2018)
-- ============================================================================
UPDATE cars SET
  brand = 'BMW',
  country = 'Germany',
  essence = 'The turbo transition—S55 twin-turbo power with the controversial move to electric steering.',
  heritage = E'The F80 M3 brought turbocharging to the M3 for the first time. The S55 twin-turbo inline-six delivered more power and torque than the V8, but some mourned the loss of high-revving character.\n\nElectric steering also arrived, changing the M3''s character. It''s faster than ever, but different.',
  design_philosophy = 'Embrace turbocharging for more power while maintaining M character.',
  generation_code = 'F80',
  predecessors = '["BMW M3 E90/E92"]'::jsonb,
  successors = '["BMW M3 G80 (2021+)"]'::jsonb,
  engine_character = 'The S55 twin-turbo inline-six produces 425-444hp with immediate torque.',
  transmission_feel = 'Manual (6-speed) or DCT. Both capable.',
  chassis_dynamics = 'Very capable but less communicative than predecessors.',
  steering_feel = 'Electric steering. Accurate but not as feelsome.',
  brake_confidence = 'Good brakes with carbon ceramic option.',
  sound_signature = 'Twin-turbo inline-six. Less dramatic than V8.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Comfortable daily driver with adaptive suspension.',
  defining_strengths = '[
    {"title": "S55 Power", "description": "425-444hp with massive torque."},
    {"title": "Manual Available", "description": "6-speed for purists."},
    {"title": "Everyday Usability", "description": "Comfortable daily driver."},
    {"title": "Speed", "description": "Faster than previous M3s."},
    {"title": "Competition Package", "description": "More power and better dynamics."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Electric Steering", "description": "Less feedback than hydraulic predecessors."},
    {"title": "Crank Hub Concern", "description": "S55 has known weakness. Upgrade recommended for track."},
    {"title": "Less Character", "description": "More clinical than E46/E92."},
    {"title": "Sound", "description": "Not as emotional as the V8."}
  ]'::jsonb,
  ideal_owner = 'Those wanting modern M3 performance. Power seekers. Daily drivers.',
  not_ideal_for = 'Steering feel purists. Those seeking analog character.',
  buyers_summary = 'Competition Package recommended. Verify crank hub if tracking. Manual for engagement.',
  best_years_detailed = '[{"years": "2016-2018", "reason": "Competition Package available."}]'::jsonb,
  must_have_options = '[{"name": "Competition Package", "reason": "444hp, better suspension."},{"name": "6-Speed Manual", "reason": "For engagement."}]'::jsonb,
  price_guide = '{"low": {"price": "$38,000", "condition": "Higher mileage DCT"}, "mid": {"price": "$52,000", "condition": "Competition manual, 30-50K miles"}, "high": {"price": "$68,000+", "condition": "Low-mile manual Competition"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,500", "typical": "$4,500", "heavy": "$8,000+", "notes": "Modern BMW M costs."}'::jsonb,
  common_issues_detailed = '[{"issue": "Crank Hub", "severity": "major", "frequency": "uncommon", "cost": "$2,000-4,000", "notes": "Upgrade recommended for track use."}]'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '9',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The F80 M3 is brutally fast. Different, but still an M3.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The F80 is faster than the E92. Whether it''s better is up to you."}]'::jsonb
WHERE slug = 'bmw-m3-f80';


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
WHERE slug IN ('subaru-wrx-sti-va', 'honda-s2000', 'nissan-300zx-twin-turbo-z32', 'nissan-z-rz34', 'bmw-m3-e46', 'bmw-m3-e92', 'bmw-m3-f80')
ORDER BY name;






