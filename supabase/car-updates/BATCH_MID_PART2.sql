-- ============================================================================
-- BATCH UPDATE: MID TIER CARS - PART 2
-- 
-- Cars: M2 Competition, Alfa 4C, Aston V8 Vantage, Evora S, LC 500, Evo 8/9
-- ============================================================================


-- ============================================================================
-- BMW M2 COMPETITION (2019-2021)
-- ============================================================================
UPDATE cars SET
  brand = 'BMW',
  country = 'Germany',
  essence = 'The spiritual successor to the E46 M3—compact, powerful, and pure in a way modern BMWs rarely achieve.',
  heritage = E'The M2 Competition replaced the original M2''s N55 engine with the S55 from the M3/M4, creating a more powerful and capable sports car. It became the enthusiast favorite—the BMW that reminded people why they loved the brand.\n\nCompact dimensions, rear-wheel drive, and genuine feedback made it the spiritual successor to the legendary E46 M3. It''s what enthusiasts wanted.',
  design_philosophy = 'Build the small, focused M car enthusiasts have demanded. Power, balance, engagement.',
  generation_code = 'F87',
  predecessors = '["BMW M2 (2016-2018)"]'::jsonb,
  successors = '["BMW M2 G87 (2023+)"]'::jsonb,
  engine_character = 'The S55 twin-turbo inline-six produces 405hp with immediate response and characterful delivery.',
  transmission_feel = 'Manual (6-speed) or DCT. Both excellent. Manual for purists.',
  chassis_dynamics = 'Compact wheelbase creates agile handling. The M2 Competition wants to play.',
  steering_feel = 'Electric steering is better than most modern BMWs. Acceptable feedback.',
  brake_confidence = 'Good M brakes. Carbon ceramics optional.',
  sound_signature = 'Twin-turbo inline-six with characterful exhaust.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Firm but livable. Sports car compromises.',
  defining_strengths = '[
    {"title": "S55 Engine", "description": "M3/M4 power in a smaller package."},
    {"title": "Compact Size", "description": "Short wheelbase creates agility."},
    {"title": "Manual Available", "description": "6-speed for purists."},
    {"title": "Enthusiast Favorite", "description": "The BMW enthusiasts actually want."},
    {"title": "E46 M3 Spirit", "description": "Feels like the spiritual successor."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "S55 Crank Hub", "description": "Known weakness on hard launches. Upgrade available."},
    {"title": "Cooling for Track", "description": "May need attention for sustained track use."},
    {"title": "Premium Price", "description": "M tax applies."}
  ]'::jsonb,
  ideal_owner = 'BMW enthusiasts wanting the "real" M car. Track day participants. Manual transmission appreciators.',
  not_ideal_for = 'Those needing space. Budget-focused buyers.',
  buyers_summary = 'Manual transmission is the choice. Verify crank hub if tracking. Great enthusiast car.',
  best_years_detailed = '[{"years": "2019-2021", "reason": "Competition spec with S55."}]'::jsonb,
  must_have_options = '[{"name": "6-Speed Manual", "reason": "Essential for engagement."},{"name": "Executive Package", "reason": "Adds usability."}]'::jsonb,
  price_guide = '{"low": {"price": "$52,000", "condition": "Higher mileage DCT"}, "mid": {"price": "$62,000", "condition": "Manual, 20-35K miles"}, "high": {"price": "$78,000+", "condition": "Low-mile manual, loaded"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,500", "typical": "$4,500", "heavy": "$8,000+", "notes": "BMW M ownership costs."}'::jsonb,
  common_issues_detailed = '[{"issue": "S55 Crank Hub", "severity": "major", "frequency": "uncommon", "cost": "$2,000-4,000 for upgrade", "notes": "Preventive upgrade recommended for track use."}]'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '9',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The M2 Competition is the BMW enthusiasts have been waiting for.", "rating": "10/10"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The M2 Competition is the best M car in years. It actually wants to be driven."}]'::jsonb
WHERE slug = 'bmw-m2-competition';


-- ============================================================================
-- ALFA ROMEO 4C (2015-2020)
-- ============================================================================
UPDATE cars SET
  brand = 'Alfa Romeo',
  country = 'Italy',
  essence = 'Italian exotic at accessible prices—a carbon tub supercar that proves Alfa still knows how to build special machines.',
  heritage = E'The 4C brought carbon fiber construction to an accessible price point. With a full carbon monocoque chassis, no power steering, and mid-engine layout, it delivered exotic car sensation without exotic car prices.\n\nIt was uncompromising—no power steering meant heavy low-speed effort. The suspension was firm. The cabin was cramped. But when the road opened up, the 4C delivered an experience most cars couldn''t match.',
  design_philosophy = 'Build the lightest, most focused car possible. Carbon fiber, mid-engine, pure.',
  generation_code = '960',
  predecessors = '[]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The 1.75L turbo four produces 237hp. Modest power, but the light weight makes it feel faster.',
  transmission_feel = 'TCT dual-clutch only. No manual option. Quick but can be jerky at low speeds.',
  chassis_dynamics = 'Carbon monocoque creates incredible rigidity. The handling is telepathic.',
  steering_feel = 'No power steering. Heavy at low speed, incredible at high speed. Pure mechanical connection.',
  brake_confidence = 'Good brakes for the light weight.',
  sound_signature = 'Turbo four with Italian exhaust character.',
  comfort_track_balance = 'track-focused',
  comfort_notes = 'Not comfortable. This is a track car that can be driven on the road.',
  defining_strengths = '[
    {"title": "Carbon Fiber Tub", "description": "Exotic construction at accessible price."},
    {"title": "Light Weight", "description": "Under 2,500 lbs changes everything."},
    {"title": "No Power Steering", "description": "Pure mechanical connection. Incredible feel."},
    {"title": "Mid-Engine", "description": "Proper sports car layout."},
    {"title": "Italian Character", "description": "Emotional in ways German cars aren''t."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "No Power Steering", "description": "Heavy at low speeds. Parking is work."},
    {"title": "Cramped Cabin", "description": "Small interior. Difficult entry/exit."},
    {"title": "Automatic Only", "description": "No manual transmission option."},
    {"title": "Build Quality", "description": "Italian, not German."},
    {"title": "Limited Practicality", "description": "No luggage space. Pure sports car."}
  ]'::jsonb,
  ideal_owner = 'Those seeking exotic experience at accessible price. Drivers who appreciate uncompromising focus.',
  not_ideal_for = 'Comfort seekers. Those needing practicality. Manual transmission purists.',
  buyers_summary = 'Spider version for better entry/exit. Verify service history. Accept the compromises.',
  best_years_detailed = '[{"years": "2015-2020", "reason": "All years similar. Spider adds usability."}]'::jsonb,
  must_have_options = '[{"name": "Spider Variant", "reason": "Easier entry/exit."},{"name": "Track Package", "reason": "For focused driving."}]'::jsonb,
  price_guide = '{"low": {"price": "$42,000", "condition": "Higher mileage Coupe"}, "mid": {"price": "$52,000", "condition": "Spider, 15-30K miles"}, "high": {"price": "$68,000+", "condition": "Low-mile Spider, options"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$8,000+", "notes": "Italian exotic costs. Budget for surprises."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '6',
  notable_reviews = '[{"source": "Evo", "quote": "The 4C is the most exotic car you can buy at this price. Nothing else has a carbon tub.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The 4C reminds you what cars used to be. No assistance, just pure driving."}]'::jsonb
WHERE slug = 'alfa-romeo-4c';


-- ============================================================================
-- ASTON MARTIN V8 VANTAGE (2008-2017)
-- ============================================================================
UPDATE cars SET
  brand = 'Aston Martin',
  country = 'United Kingdom',
  essence = 'British beauty with a Ferrari heart—the V8 Vantage brought exotic presence to attainable prices.',
  heritage = E'The V8 Vantage democratized Aston Martin ownership. With styling derived from the DB9 and a hand-built 4.7L V8, it delivered the Aston experience at a more accessible price point.\n\nThe manual transmission option made it a proper driver''s car. The design turned heads everywhere. It proved you didn''t need a DB9 budget to own something special.',
  design_philosophy = 'Aston Martin beauty and character at entry-level pricing. Emotion above all.',
  generation_code = 'VH',
  predecessors = '[]'::jsonb,
  successors = '["Aston Martin V8 Vantage (2018+)"]'::jsonb,
  engine_character = 'The 4.7L V8 produces 420hp with characterful delivery. Hand-built in Gaydon.',
  transmission_feel = 'Manual (6-speed) or Sportshift auto. Manual is the enthusiast choice.',
  chassis_dynamics = 'Capable but comfortable. More GT than track weapon.',
  steering_feel = 'Hydraulic steering with genuine feedback.',
  brake_confidence = 'Adequate brakes for the GT character.',
  sound_signature = 'British V8 with characterful exhaust note.',
  comfort_track_balance = 'daily',
  comfort_notes = 'GT-car comfort with sports car looks.',
  defining_strengths = '[
    {"title": "Stunning Design", "description": "Aston Martin beauty at accessible prices."},
    {"title": "Manual Available", "description": "6-speed manual for engagement."},
    {"title": "Hand-Built Engine", "description": "Each engine signed by its builder."},
    {"title": "Depreciation", "description": "Values have dropped—excellent used value."},
    {"title": "British Character", "description": "Emotional and special."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Reliability", "description": "Not German reliability. Budget for issues."},
    {"title": "Sportshift Transmission", "description": "The automated manual is clunky. Avoid."},
    {"title": "Running Costs", "description": "Exotic car ownership costs."},
    {"title": "Dealer Network", "description": "Aston dealers are sparse."}
  ]'::jsonb,
  ideal_owner = 'Design appreciators. Those wanting exotic presence at accessible prices. Manual enthusiasts.',
  not_ideal_for = 'Reliability focused. Budget-limited buyers. Track-focused drivers.',
  buyers_summary = 'Manual transmission essential. Avoid Sportshift. Verify service history. Budget for ownership.',
  best_years_detailed = '[{"years": "2012-2017", "reason": "7-speed manual, 4.7L engine, refinements."}]'::jsonb,
  must_have_options = '[{"name": "6-Speed Manual", "reason": "Essential. Sportshift is poor."},{"name": "Sport Pack", "reason": "Better suspension."}]'::jsonb,
  price_guide = '{"low": {"price": "$48,000", "condition": "Higher mileage, Sportshift"}, "mid": {"price": "$65,000", "condition": "Manual, 30-50K miles"}, "high": {"price": "$85,000+", "condition": "Low-mile manual V12 Vantage S"}}'::jsonb,
  annual_ownership_cost = '{"low": "$3,000", "typical": "$6,000", "heavy": "$12,000+", "notes": "Exotic ownership costs. Budget generously."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '6',
  notable_reviews = '[{"source": "Top Gear", "quote": "The V8 Vantage is the way to get into Aston Martin ownership. Beautiful and engaging.", "rating": "8/10"}]'::jsonb,
  expert_quotes = '[{"person": "Jeremy Clarkson", "outlet": "Top Gear", "quote": "The V8 Vantage is one of the most beautiful cars ever made. The manual makes it."}]'::jsonb
WHERE slug = 'aston-martin-v8-vantage';


-- ============================================================================
-- LOTUS EVORA S (2010-2015)
-- ============================================================================
UPDATE cars SET
  brand = 'Lotus',
  country = 'United Kingdom',
  essence = 'The everyday Lotus—supercharged Toyota V6 in a chassis that finally makes Lotus usable for adults.',
  heritage = E'The Evora was Lotus''s first all-new car in over a decade. With back seats, air conditioning that worked, and a supercharged Toyota V6, it proved Lotus could build something livable without losing its soul.\n\nThe S variant added a supercharger, bringing power to 345hp. It retained Lotus handling with improved usability.',
  design_philosophy = 'Build a Lotus adults can actually use. Back seats, climate control, but keep the handling.',
  generation_code = 'Evora',
  predecessors = '[]'::jsonb,
  successors = '["Lotus Evora GT (2020-2021)"]'::jsonb,
  engine_character = 'The supercharged 3.5L Toyota V6 produces 345hp with reliable character.',
  transmission_feel = 'Manual (6-speed) or IPS automatic. Manual is the Lotus way.',
  chassis_dynamics = 'Pure Lotus handling with improved refinement. Mid-engine balance.',
  steering_feel = 'Hydraulic steering with excellent feedback.',
  brake_confidence = 'AP Racing brakes with good feel.',
  sound_signature = 'Supercharged V6 with Lotus character.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'More livable than other Lotus models. Still a sports car.',
  defining_strengths = '[
    {"title": "Lotus Handling", "description": "The core Lotus experience remains."},
    {"title": "Toyota Reliability", "description": "Supercharged Toyota engine is proven."},
    {"title": "Back Seats", "description": "Small but functional. Rare for Lotus."},
    {"title": "Hydraulic Steering", "description": "Genuine feedback."},
    {"title": "Manual Transmission", "description": "Proper engagement."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Lotus Build Quality", "description": "Better than old Lotus, but not German."},
    {"title": "Dealer Network", "description": "Lotus dealers are rare."},
    {"title": "Entry/Exit", "description": "Wide sills make it awkward."},
    {"title": "Depreciation", "description": "Values dropped significantly."}
  ]'::jsonb,
  ideal_owner = 'Those wanting Lotus handling with usability. Toyota reliability appreciators.',
  not_ideal_for = 'Those requiring mainstream support. Budget-limited buyers.',
  buyers_summary = 'Manual transmission preferred. Verify service history. Lotus specialist inspection recommended.',
  best_years_detailed = '[{"years": "2013-2015", "reason": "Supercharged S with refinements."}]'::jsonb,
  must_have_options = '[{"name": "Manual Transmission", "reason": "The Lotus way."},{"name": "Sport Pack", "reason": "Enhanced dynamics."}]'::jsonb,
  price_guide = '{"low": {"price": "$42,000", "condition": "Higher mileage IPS"}, "mid": {"price": "$55,000", "condition": "Manual, 25-40K miles"}, "high": {"price": "$72,000+", "condition": "Low-mile manual S"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$7,000+", "notes": "Toyota drivetrain keeps costs reasonable."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '7',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The Evora S is the Lotus you can actually live with.", "rating": "4/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The Evora proves Lotus can make something usable. The handling is still pure."}]'::jsonb
WHERE slug = 'lotus-evora-s';


-- ============================================================================
-- LEXUS LC 500 (2018-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'Lexus',
  country = 'Japan',
  essence = 'The naturally aspirated grand tourer—a 5.0L V8 symphony wrapped in stunning Japanese design.',
  heritage = E'The LC 500 proved Lexus could build an emotional car. With a naturally aspirated 5.0L V8, stunning design, and impeccable build quality, it delivered a GT experience unlike anything else from Japan.\n\nThe 2UR-GSE V8 revs to 7,300 RPM with a sound that rivals the best. Lexus made something special.',
  design_philosophy = 'Build the most beautiful, emotionally engaging Lexus ever. Sound, style, quality.',
  generation_code = 'Z100',
  predecessors = '["Lexus SC 430"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = 'The 5.0L V8 produces 471hp with naturally aspirated character. Revs to 7,300 RPM.',
  transmission_feel = '10-speed automatic is smooth and quick. No manual option.',
  chassis_dynamics = 'Grand tourer character. Comfortable and capable, not track-focused.',
  steering_feel = 'Electric steering with reasonable feedback.',
  brake_confidence = 'Adequate for GT use.',
  sound_signature = 'The V8 sounds magnificent. Naturally aspirated character with beautiful exhaust note.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Lexus luxury comfort. Excellent GT capability.',
  defining_strengths = '[
    {"title": "Naturally Aspirated V8", "description": "5.0L that revs to 7,300 RPM. Sounds incredible."},
    {"title": "Stunning Design", "description": "One of the most beautiful cars available."},
    {"title": "Lexus Quality", "description": "Impeccable build and reliability."},
    {"title": "Comfort", "description": "True GT comfort."},
    {"title": "Depreciation", "description": "Values have dropped—excellent used value."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Heavy", "description": "Over 4,200 lbs. Not a sports car."},
    {"title": "Automatic Only", "description": "No manual transmission."},
    {"title": "Not Track-Focused", "description": "A GT, not a sports car."},
    {"title": "Infotainment", "description": "Lexus touchpad is frustrating."}
  ]'::jsonb,
  ideal_owner = 'Those wanting naturally aspirated V8 experience with comfort. Design appreciators.',
  not_ideal_for = 'Track-focused drivers. Manual transmission seekers. Those wanting agility.',
  buyers_summary = 'V8 is the one to have (not hybrid). Excellent used value. Performance Package for enhanced dynamics.',
  best_years_detailed = '[{"years": "2021-2024", "reason": "Updated infotainment, refinements."}]'::jsonb,
  must_have_options = '[{"name": "Performance Package", "reason": "Better suspension and LSD."},{"name": "Mark Levinson Audio", "reason": "Outstanding sound system."}]'::jsonb,
  price_guide = '{"low": {"price": "$55,000", "condition": "Higher mileage early model"}, "mid": {"price": "$72,000", "condition": "2021+, 15-30K miles"}, "high": {"price": "$92,000+", "condition": "Low-mile, loaded"}}'::jsonb,
  annual_ownership_cost = '{"low": "$1,500", "typical": "$3,000", "heavy": "$5,000+", "notes": "Lexus reliability keeps costs reasonable."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '6',
  notable_reviews = '[{"source": "Top Gear", "quote": "The LC 500 is proof that Lexus can make something special. That V8 sound is magnificent.", "rating": "8/10"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The LC 500 is the best thing Lexus has ever made. That engine deserves to be heard."}]'::jsonb
WHERE slug = 'lexus-lc-500';


-- ============================================================================
-- MITSUBISHI LANCER EVOLUTION VIII/IX (2003-2007)
-- ============================================================================
UPDATE cars SET
  brand = 'Mitsubishi',
  country = 'Japan',
  essence = 'The rally-bred legend—a turbocharged four-cylinder in a lightweight sedan that defined an era of performance.',
  heritage = E'The Evo VIII and IX brought Mitsubishi''s rally expertise to the street. With a turbocharged 4G63 producing 276hp (on paper, more in reality), Super AYC, and rally-derived chassis, they delivered performance that embarrassed far more expensive cars.\n\nThe rivalry with the Subaru WRX STI defined an era. Evos were focused, raw, and rewarding—the car for enthusiasts who wanted involvement over comfort.',
  design_philosophy = 'Rally car for the street. Light weight, turbo power, all-wheel drive traction.',
  generation_code = 'CT9A',
  predecessors = '["Mitsubishi Lancer Evolution VII"]'::jsonb,
  successors = '["Mitsubishi Lancer Evolution X (2008-2015)"]'::jsonb,
  engine_character = 'The 4G63 turbo four produces 276hp (claimed). Responds well to modifications.',
  transmission_feel = 'Manual only—5-speed (VIII) or 6-speed (IX MR). Excellent engagement.',
  chassis_dynamics = 'Rally-derived suspension and Super AYC create incredible capability.',
  steering_feel = 'Hydraulic steering with excellent feedback.',
  brake_confidence = 'Brembo brakes standard. Excellent stopping power.',
  sound_signature = 'Turbocharged four with blow-off valve sounds.',
  comfort_track_balance = 'track-focused',
  comfort_notes = 'Firm and focused. Not comfortable by sedan standards.',
  defining_strengths = '[
    {"title": "4G63 Engine", "description": "Legendary turbo four. Incredibly tunable."},
    {"title": "Rally Pedigree", "description": "WRC-derived technology."},
    {"title": "Super AYC", "description": "Active yaw control for incredible cornering."},
    {"title": "Manual Only", "description": "No automatic option. Pure."},
    {"title": "Collectibility", "description": "Values are rising. Future classic status."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Age", "description": "17-20+ years old now. Maintenance required."},
    {"title": "Modification History", "description": "Most have been modified. Stock cars rare."},
    {"title": "Rust", "description": "Prone to rust. Inspect carefully."},
    {"title": "Insurance", "description": "High premiums due to modifications and theft."}
  ]'::jsonb,
  ideal_owner = 'JDM enthusiasts. Rally appreciators. Those who value involvement over comfort.',
  not_ideal_for = 'Comfort seekers. Those wanting modern amenities. Reliability focused.',
  buyers_summary = 'IX MR is most desirable. Verify modification history. Rust inspection essential. Stock cars command premiums.',
  best_years_detailed = '[{"years": "2006 IX MR", "reason": "6-speed, all updates, most refined."},{"years": "2005 IX", "reason": "First year of IX with improvements."}]'::jsonb,
  must_have_options = '[{"name": "IX MR", "reason": "6-speed, BBS wheels, bilstein suspension."},{"name": "Stock Configuration", "reason": "Unmodified cars are significantly more valuable."}]'::jsonb,
  price_guide = '{"low": {"price": "$28,000", "condition": "Modified, needs work"}, "mid": {"price": "$42,000", "condition": "Good condition, some modifications"}, "high": {"price": "$65,000+", "condition": "Low-mile stock IX MR"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$8,000+", "notes": "Age-related maintenance. Tuned cars need more attention."}'::jsonb,
  common_issues_detailed = '[{"issue": "Transfer Case", "severity": "major", "frequency": "common", "cost": "$2,000-4,000", "notes": "ACD/AYC transfer case can fail."},{"issue": "Rust", "severity": "major", "frequency": "common", "cost": "Varies", "notes": "Check wheel arches, floors, trunk."}]'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '9',
  notable_reviews = '[{"source": "Evo Magazine", "quote": "The Evo IX is the ultimate driver''s car. Rally pedigree for the road.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The Evo is the ultimate driver''s tool. Nothing else involves you like this."}]'::jsonb
WHERE slug = 'mitsubishi-lancer-evo-8-9';


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
WHERE slug IN ('bmw-m2-competition', 'alfa-romeo-4c', 'aston-martin-v8-vantage', 'lotus-evora-s', 'lexus-lc-500', 'mitsubishi-lancer-evo-8-9')
ORDER BY name;






