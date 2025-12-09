-- ============================================================================
-- BATCH UPDATE: UPPER-MID TIER CARS - PART 3
-- 
-- Cars: BMW 1M, Audi RS5 B9, Audi RS3, Audi TT RS, Giulia Quadrifoglio, BMW M5 F90
-- ============================================================================


-- ============================================================================
-- BMW 1M COUPE E82 (2011)
-- ============================================================================
UPDATE cars SET
  brand = 'BMW',
  country = 'Germany',
  essence = 'The accidental legend—BMW''s one-year-only hooligan that proved smaller, lighter M cars are what enthusiasts truly want.',
  heritage = E'The 1M was never supposed to happen. BMW initially dismissed the idea of an M version of the compact 1 Series, but persistent demand from enthusiasts finally convinced M division to create something special.\n\nBuilt for just one year (2011) with only 6,309 units produced globally, the 1M used a tuned version of the N54 twin-turbo inline-six. More importantly, it had M3 running gear in a shorter wheelbase—creating a handling character that many consider superior to its bigger brother.\n\nThe result was a car that felt like a modern E30 M3—compact, aggressive, and brilliantly balanced. It became an instant collector''s item.',
  design_philosophy = 'M Division''s brief was simple: make the smallest, most aggressive M car possible. They stuffed M3 suspension, limited-slip differential, and a modified N54 engine into the compact 1 Series shell.',
  generation_code = 'E82',
  predecessors = '["BMW 135i (E82)"]'::jsonb,
  successors = '["BMW M2 (F87)"]'::jsonb,
  engine_character = E'The N54 twin-turbo inline-six produces 335 horsepower—but that number undersells the experience. Boost builds quickly, and the engine pulls hard from 2,500 RPM to redline.\n\nThe N54 is famously tunable. Many 1Ms make 400+ horsepower with basic modifications. The engine rewards those who explore its potential.',
  transmission_feel = 'Manual only—a 6-speed with precise throws and satisfying engagement. No DCT option, which purists appreciate.',
  chassis_dynamics = E'This is the 1M''s superpower. The short wheelbase, M3-derived suspension, and aggressive limited-slip differential create handling that many consider superior to the E90 M3.\n\nThe rear end is playful and accessible. The car rotates willingly without being treacherous. It''s hooligan-friendly.',
  steering_feel = 'Hydraulic power steering with excellent feedback. BMW at its analog best. You feel everything.',
  brake_confidence = 'M3 brakes in a lighter car. More than adequate stopping power.',
  sound_signature = 'Twin-turbo inline-six with distinctive turbo sounds. Not as dramatic as the S54 (E46 M3) but characterful.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Firm ride, limited space, loud cabin. Not a daily driver—a driver''s car.',
  defining_strengths = '[
    {"title": "Perfect Size", "description": "Short wheelbase and compact dimensions create exceptional handling. It feels smaller than it is."},
    {"title": "M3 Running Gear", "description": "M3-derived suspension and LSD in a lighter package. The math works."},
    {"title": "Manual Only", "description": "Six-speed manual was the only option. Pure engagement."},
    {"title": "Rarity", "description": "Only 6,309 built worldwide. Instant collectibility."},
    {"title": "Tuning Potential", "description": "The N54 responds well to modifications. 400+ hp is easy."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "N54 Reliability", "description": "The N54 has known issues: water pump, fuel injectors, turbos. Budget for maintenance."},
    {"title": "Collector Pricing", "description": "Values have appreciated significantly. No longer an affordable M car."},
    {"title": "Limited Production", "description": "Finding good examples is challenging. Most have been driven hard."},
    {"title": "Space", "description": "Compact dimensions mean limited passenger and cargo space."}
  ]'::jsonb,
  ideal_owner = 'Enthusiasts who prioritize handling over power. Collectors recognizing significance. Drivers who want the smallest M car.',
  not_ideal_for = 'Reliability seekers—N54 needs attention. Budget buyers—values are high. Those needing space.',
  buyers_summary = 'Buy the most stock, best-documented example possible. Verify N54 service history—HPFP, water pump, injectors. Have BMW specialist inspect.',
  best_years_detailed = '[{"years": "2011", "reason": "Only year of production. All are 2011 models."}]'::jsonb,
  must_have_options = '[{"name": "Stock Configuration", "reason": "Unmodified examples are most valuable."},{"name": "Service Records", "reason": "N54 maintenance history is critical."}]'::jsonb,
  price_guide = '{"low": {"price": "$48,000", "condition": "Higher mileage, needs work"}, "mid": {"price": "$62,000", "condition": "45-60K miles, well-maintained"}, "high": {"price": "$85,000+", "condition": "Low-mile, documented, stock"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,500", "typical": "$5,000", "heavy": "$10,000+", "notes": "N54 maintenance adds up. Budget for the known issues."}'::jsonb,
  common_issues_detailed = '[{"issue": "High Pressure Fuel Pump (HPFP)", "severity": "moderate", "frequency": "common", "cost": "$800-1,200", "notes": "N54 weakness. Extended warranty covered many."},{"issue": "Water Pump/Thermostat", "severity": "moderate", "frequency": "common", "cost": "$800-1,500", "notes": "Electric water pump fails. Plan for replacement."},{"issue": "Injector Failure", "severity": "moderate", "frequency": "common", "cost": "$1,500-2,500 for set", "notes": "Index 12+ injectors are the solution."},{"issue": "Turbo Wastegate Rattle", "severity": "minor", "frequency": "common", "cost": "$500-1,500", "notes": "Annoying noise. Not typically catastrophic."}]'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '9',
  notable_reviews = '[{"source": "Top Gear", "quote": "The 1M is the best M car BMW has made in years. It''s small, angry, and brilliant.", "rating": "9/10"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The 1M is what happens when BMW listens to enthusiasts. It''s perfect."}]'::jsonb
WHERE slug = 'bmw-1m-coupe-e82';


-- ============================================================================
-- AUDI RS5 B9 (2018-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'Audi',
  country = 'Germany',
  essence = 'The civilized sledgehammer—twin-turbo V6 power wrapped in understated German elegance for those who want performance without announcing it.',
  heritage = E'The B9 RS5 replaced the naturally aspirated V8 with a twin-turbo V6, sparking debate among enthusiasts. What was lost in character was gained in performance—the new car was faster, more efficient, and more capable.\n\nQuattro all-wheel drive makes the RS5 an all-weather weapon. The 2.9L twin-turbo V6 produces 444 horsepower with immediate response. The 8-speed automatic is quick and intelligent.\n\nThe RS5 occupies a unique space: fast enough to embarrass sports cars, comfortable enough to cross continents, subtle enough to avoid attention.',
  design_philosophy = 'Audi''s RS philosophy: performance without compromise to daily usability. The RS5 delivers supercar acceleration while remaining a comfortable GT car.',
  generation_code = 'B9/F5',
  predecessors = '["Audi RS5 B8 (2010-2015)"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = E'The 2.9L twin-turbo V6 produces 444 horsepower with immediate boost response. It doesn''t have the V8''s character but makes up for it with performance.\n\nPower delivery is relentless. The turbos spool quickly, and Quattro puts every horsepower to the ground.',
  transmission_feel = 'The 8-speed automatic is excellent. Quick shifts, intelligent logic, smooth operation. No manual option—this is a GT car.',
  chassis_dynamics = 'Quattro provides incredible traction. The RS5 handles well for its weight, with adjustable dynamics through Drive Select. It''s composed and predictable.',
  steering_feel = 'Electric steering is well-weighted and accurate but not communicative. Typical modern Audi.',
  brake_confidence = 'Excellent brakes with strong stopping power. Optional carbon ceramics for track use.',
  sound_signature = 'Turbocharged V6 with sport exhaust. Not as emotional as the old V8 but purposeful.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Genuinely comfortable GT car. The interior is excellent, the ride is compliant, and it works as daily transportation.',
  defining_strengths = '[
    {"title": "All-Weather Performance", "description": "Quattro makes it usable in any conditions. 444hp works in rain or shine."},
    {"title": "Understated Presence", "description": "Fast without being flashy. Subtle aggression."},
    {"title": "Daily Comfort", "description": "Excellent interior, comfortable ride, practical GT capability."},
    {"title": "Speed", "description": "0-60 in 3.7 seconds. Quick by any standard."},
    {"title": "Quality", "description": "Audi build quality and materials are excellent."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Lacks V8 Character", "description": "The old naturally aspirated V8 had more soul. The twin-turbo V6 is efficient but less emotional."},
    {"title": "No Manual", "description": "Automatic only. No clutch pedal."},
    {"title": "Weight", "description": "Heavy for a performance coupe. Physics apply."},
    {"title": "Numb Steering", "description": "Electric steering works but doesn''t communicate."}
  ]'::jsonb,
  ideal_owner = 'Buyers wanting performance with daily comfort. All-weather capability seekers. Those who prefer subtle aggression.',
  not_ideal_for = 'Engagement seekers—it''s a GT car, not a sports car. Manual transmission fans. Those seeking raw driving experience.',
  buyers_summary = 'Buy with Dynamic Package and Sport Exhaust. Virtual Cockpit is worth having. Verify service history.',
  best_years_detailed = '[{"years": "2020-2024", "reason": "Latest updates and refinements."}]'::jsonb,
  must_have_options = '[{"name": "RS Dynamic Package", "reason": "Sport differential, dynamic steering, sport exhaust."},{"name": "Virtual Cockpit", "reason": "Excellent digital display."}]'::jsonb,
  price_guide = '{"low": {"price": "$52,000", "condition": "Higher mileage"}, "mid": {"price": "$65,000", "condition": "25-40K miles, good options"}, "high": {"price": "$80,000+", "condition": "Low miles, loaded"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$4,000", "heavy": "$7,000+", "notes": "Audi ownership costs. Premium fuel required."}'::jsonb,
  common_issues_detailed = '[{"issue": "Carbon Buildup", "severity": "moderate", "frequency": "common", "cost": "$500-1,000", "notes": "Direct injection cars need walnut blasting occasionally."}]'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '7',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The RS5 is the fast Audi for people who don''t want everyone to know how fast they are.", "rating": "4.5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "The Smoking Tire", "quote": "The RS5 is deceptively quick. It looks like an A5 and drives like a supercar."}]'::jsonb
WHERE slug = 'audi-rs5-b9';


-- ============================================================================
-- AUDI RS3 8Y (2022-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'Audi',
  country = 'Germany',
  essence = 'The five-cylinder pocket rocket—400 horsepower of turbocharged fury in the most fun Audi money can buy.',
  heritage = E'The RS3 brings Audi''s legendary five-cylinder engine to a compact platform. The 2.5L TFSI is a direct descendant of the Quattro rally cars—a uniquely off-beat engine note that sets it apart from V6 and V8 competitors.\n\nWith 401 horsepower in a compact sedan or hatchback, the RS3 punches well above its weight class. The new RS Torque Splitter can send up to 100% of rear power to either rear wheel, making this the most dynamic RS3 ever.\n\nThis is the anti-M3—smaller, lighter, more aggressive.',
  design_philosophy = 'Audi Sport took the compact A3 and added maximum performance. The five-cylinder is the heart—everything else supports its mission.',
  generation_code = '8Y',
  predecessors = '["Audi RS3 8V (2017-2020)"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = E'The 2.5L TFSI five-cylinder produces 401 horsepower with a unique, offbeat exhaust note. It sounds like nothing else—a direct connection to Audi''s Quattro heritage.\n\nBoost comes on strong and holds through the rev range. The five-cylinder character is addictive.',
  transmission_feel = '7-speed dual-clutch (S Tronic) is quick and smooth. No manual option. Paddle response is immediate.',
  chassis_dynamics = E'The RS Torque Splitter is a game-changer. Variable rear torque distribution creates genuinely adjustable handling. It can drift—really drift.\n\nThe compact size and relatively light weight make it agile. It feels smaller than the numbers suggest.',
  steering_feel = 'Electric steering is accurate but not communicative. Better than previous RS3 generations.',
  brake_confidence = 'Good brakes for the size. Ceramic option available.',
  sound_signature = 'The five-cylinder sounds like nothing else—offbeat, distinctive, aggressive. It''s the RS3''s calling card.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Firm but livable. Better for spirited driving than commuting. Interior is excellent.',
  defining_strengths = '[
    {"title": "Five-Cylinder Sound", "description": "The 2.5 TFSI sounds like nothing else. Pure Audi heritage."},
    {"title": "RS Torque Splitter", "description": "Variable rear torque distribution creates genuine adjustability. It can drift."},
    {"title": "Compact Size", "description": "Smaller and lighter than competitors. More agile."},
    {"title": "401 Horsepower", "description": "Huge power in a small package. Brutal acceleration."},
    {"title": "All-Weather", "description": "Quattro makes it usable year-round."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Firm Ride", "description": "Sport-focused suspension isn''t comfortable. RS ride quality."},
    {"title": "No Manual", "description": "DCT only. No clutch pedal."},
    {"title": "Premium Price", "description": "RS tax is significant. Not cheap."},
    {"title": "Limited Space", "description": "Compact car. Limited rear room."}
  ]'::jsonb,
  ideal_owner = 'Five-cylinder enthusiasts. Those wanting compact performance. Buyers who appreciate unique engine character.',
  not_ideal_for = 'Comfort seekers. Manual transmission fans. Those needing space.',
  buyers_summary = 'RS Dynamic Package is worth having. The five-cylinder is the reason to buy.',
  best_years_detailed = '[{"years": "2022-2024", "reason": "All 8Y years are excellent. Latest generation."}]'::jsonb,
  must_have_options = '[{"name": "RS Dynamic Package", "reason": "Enhanced driving dynamics."},{"name": "RS Sport Exhaust", "reason": "Unlocks the five-cylinder sound."}]'::jsonb,
  price_guide = '{"low": {"price": "$52,000", "condition": "Higher mileage"}, "mid": {"price": "$62,000", "condition": "15-25K miles"}, "high": {"price": "$72,000+", "condition": "Low miles, loaded"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$3,500", "heavy": "$6,000+", "notes": "Audi RS ownership costs."}'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '7',
  notable_reviews = '[{"source": "Top Gear", "quote": "The RS3 is the most fun Audi makes. That five-cylinder is special.", "rating": "8/10"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The RS3 with the torque splitter is genuinely hilarious. It wants to play."}]'::jsonb
WHERE slug = 'audi-rs3-8y';


-- ============================================================================
-- AUDI TT RS 8S (2018-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'Audi',
  country = 'Germany',
  essence = 'Five-cylinder fury in a sports car body—the TT RS proves the Bauhaus coupe can genuinely perform.',
  heritage = E'The TT RS takes Audi''s iconic design language and adds serious performance. The 2.5L five-cylinder engine provides 394-401 horsepower with a unique character that sets it apart from six and eight-cylinder rivals.\n\nThe TT RS has always been the serious performance option in the TT range. The 8S generation brought sharper styling, improved dynamics, and the latest five-cylinder evolution.',
  design_philosophy = 'Design meets performance. The TT''s iconic shape gets RS substance with the legendary five-cylinder engine.',
  generation_code = '8S',
  predecessors = '["Audi TT RS 8J (2009-2014)"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = E'The 2.5L TFSI five-cylinder produces 394-401 horsepower with immediate response and distinctive sound. The offbeat firing order creates a unique character.',
  transmission_feel = '7-speed dual-clutch is quick and responsive. Shifts are aggressive in Dynamic mode.',
  chassis_dynamics = 'Compact wheelbase makes it agile. Quattro provides traction. The RS suspension is firm but capable.',
  steering_feel = 'Electric steering is accurate. Better than base TT but not exceptionally communicative.',
  brake_confidence = 'RS brakes with good stopping power.',
  sound_signature = 'The five-cylinder''s distinctive sound is the TT RS''s signature. It sounds like rally heritage.',
  comfort_track_balance = 'weekend',
  comfort_notes = 'Firm ride, coupe practicality. Sports car compromises apply.',
  defining_strengths = '[
    {"title": "Five-Cylinder Character", "description": "The 2.5 TFSI sounds and feels unique. Rally heritage."},
    {"title": "Iconic Design", "description": "The TT silhouette is timeless. RS treatment adds aggression."},
    {"title": "Compact Performance", "description": "Small, light, quick. Easy to place."},
    {"title": "Quattro Traction", "description": "All-weather capability."},
    {"title": "400hp Package", "description": "Serious power in an attractive package."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Limited Space", "description": "2+2 coupe. Rear seats are token."},
    {"title": "Firm Ride", "description": "RS suspension isn''t comfortable."},
    {"title": "No Manual", "description": "DCT only."},
    {"title": "Premium Price", "description": "RS tax applies."}
  ]'::jsonb,
  ideal_owner = 'Five-cylinder enthusiasts. Those wanting iconic design with performance. Compact sports car seekers.',
  not_ideal_for = 'Comfort seekers. Those needing space. Manual fans.',
  buyers_summary = 'RS Dynamic Package recommended. The five-cylinder is the reason to buy over base TTS.',
  best_years_detailed = '[{"years": "2018-2024", "reason": "All 8S years excellent."}]'::jsonb,
  must_have_options = '[{"name": "RS Sport Exhaust", "reason": "Essential for five-cylinder sound."}]'::jsonb,
  price_guide = '{"low": {"price": "$48,000", "condition": "Higher mileage"}, "mid": {"price": "$58,000", "condition": "20-35K miles"}, "high": {"price": "$72,000+", "condition": "Low miles, loaded"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,000", "typical": "$3,500", "heavy": "$6,000+", "notes": "Audi RS costs."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '6',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The TT RS makes the TT worth taking seriously. That five-cylinder is the star.", "rating": "4/5"}]'::jsonb,
  expert_quotes = '[{"person": "Matt Farah", "outlet": "TST", "quote": "The TT RS is the serious TT. That engine makes it special."}]'::jsonb
WHERE slug = 'audi-tt-rs-8s';


-- ============================================================================
-- ALFA ROMEO GIULIA QUADRIFOGLIO (2017-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'Alfa Romeo',
  country = 'Italy',
  essence = 'Italian passion meets German targets—a 505hp Ferrari-derived engine in a sedan that made BMW nervous.',
  heritage = E'The Giulia Quadrifoglio marked Alfa Romeo''s return to rear-wheel-drive sports sedans—a direct challenge to BMW M3 dominance. With a 505 horsepower twin-turbo V6 derived from Ferrari technology, it had the power. With Italian design and chassis tuning, it had the soul.\n\nAlfa set the 911 Turbo''s Nürburgring time as the benchmark, and the Quadrifoglio beat it. This wasn''t just competitive—it was segment-leading.\n\nThe result is a sedan that prioritizes driver engagement above all else. It''s more involving than the M3, more characterful than the C63.',
  design_philosophy = 'Italian design, German-beating performance, driver engagement above comfort. Alfa built the sports sedan they wanted to drive.',
  generation_code = '952',
  predecessors = '["Alfa Romeo 159 (loosely)"]'::jsonb,
  successors = '[]'::jsonb,
  engine_character = E'The 2.9L twin-turbo V6 was developed with Ferrari. It produces 505 horsepower with sharp response and a character that Italian cars do better than anyone.\n\nIt sounds different from German turbos—more exotic, more emotional. The redline screams Italian.',
  transmission_feel = 'ZF 8-speed automatic with excellent calibration. Quick shifts, responsive paddles. No manual option.',
  chassis_dynamics = E'The Giulia QV prioritizes steering feel and chassis balance above all else. It''s the most engaging sedan in its class.\n\nThe rear end is playful—it wants to rotate. The weight balance feels better than competitors.',
  steering_feel = 'The Giulia''s steering is exceptional. Quick ratio, genuine feedback, perfectly weighted. It''s the chassis highlight.',
  brake_confidence = 'Brembo carbon ceramics optional. Strong stopping power.',
  sound_signature = 'The twin-turbo V6 sounds Italian—more exotic than German rivals. Exhaust crackles on overrun.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Firm but livable. Better than M3 for comfort. Interior quality improved after early years.',
  defining_strengths = '[
    {"title": "Steering Excellence", "description": "The best steering in the class. It communicates like a sports car."},
    {"title": "Ferrari-Derived Engine", "description": "505hp V6 with exotic character. Sounds Italian."},
    {"title": "Driver Engagement", "description": "More involving than German rivals. It wants to be driven hard."},
    {"title": "Nürburgring Pace", "description": "Faster than 911 Turbo around the Ring. Genuine performance."},
    {"title": "Italian Character", "description": "Emotion that German cars can''t replicate."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Reliability Concerns", "description": "Early cars had issues. Later models improved significantly."},
    {"title": "Interior Quality", "description": "Not up to German standards, especially early cars."},
    {"title": "Depreciation", "description": "Values dropped significantly. Good for buyers, tough for owners."},
    {"title": "Dealer Network", "description": "Alfa dealers are less common than BMW/Mercedes."}
  ]'::jsonb,
  ideal_owner = 'Drivers who prioritize engagement over refinement. Those wanting Italian character. Buyers who value steering feel.',
  not_ideal_for = 'Reliability obsessed—research the specific car. Badge-conscious buyers. Those wanting German solidity.',
  buyers_summary = 'Buy 2020+ for improved reliability. Have pre-purchase inspection done. The steering alone justifies consideration.',
  best_years_detailed = '[{"years": "2020-2024", "reason": "Reliability improvements, updated interior."}]'::jsonb,
  must_have_options = '[{"name": "Carbon Ceramic Brakes", "reason": "Essential for track use."},{"name": "Driver Assistance Package", "reason": "Modern safety features."}]'::jsonb,
  price_guide = '{"low": {"price": "$42,000", "condition": "Early 2017-2018, higher mileage"}, "mid": {"price": "$58,000", "condition": "2020+, 25-40K miles"}, "high": {"price": "$72,000+", "condition": "Low miles, loaded"}}'::jsonb,
  annual_ownership_cost = '{"low": "$2,500", "typical": "$5,000", "heavy": "$10,000+", "notes": "Italian car ownership. Budget for potential issues."}'::jsonb,
  common_issues_detailed = '[{"issue": "Various Early Production Issues", "severity": "varies", "frequency": "common (early)", "notes": "2017-2019 cars had more issues. 2020+ significantly improved."}]'::jsonb,
  track_readiness = 'track-ready',
  community_strength = '6',
  notable_reviews = '[{"source": "Motor Trend", "quote": "The Giulia QV is the most engaging sedan you can buy. The steering is exceptional.", "rating": "5/5"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The Giulia QV has the best steering of any sports sedan. It makes the M3 feel numb."}]'::jsonb
WHERE slug = 'alfa-romeo-giulia-quadrifoglio';


-- ============================================================================
-- BMW M5 F90 COMPETITION (2018-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'BMW',
  country = 'Germany',
  essence = 'The gentleman''s supercar—617 horsepower and AWD grip in a full-size sedan that does everything at impossible speeds.',
  heritage = E'The F90 M5 represents the first all-wheel-drive M5—a controversial decision that proved brilliant. With 617 horsepower (Competition), xDrive all-wheel drive, and the ability to switch to rear-wheel drive, it''s the most versatile M5 ever.\n\nThe twin-turbo V8 produces supercar acceleration in a car with back seats. It can be a comfortable GT or a Nürburgring weapon. The M5 has always been Dr. Jekyll and Mr. Hyde—the F90 perfects the formula.',
  design_philosophy = 'Ultimate performance in a usable package. The M5 must be fast enough to embarrass supercars while remaining a comfortable sedan.',
  generation_code = 'F90',
  predecessors = '["BMW M5 F10 (2011-2016)"]'::jsonb,
  successors = '["BMW M5 G90 (2024+)"]'::jsonb,
  engine_character = E'The S63 4.4L twin-turbo V8 produces 617 horsepower (Competition) with effortless power delivery. It''s brutal but refined—massive thrust without drama.',
  transmission_feel = '8-speed automatic with excellent calibration. Quick shifts in manual mode, smooth in comfort.',
  chassis_dynamics = E'xDrive provides incredible traction. M Mode allows rear-wheel drive for those who want to play. The chassis is surprisingly agile for a full-size sedan.',
  steering_feel = 'Electric steering is well-weighted but not especially communicative. Typical modern BMW.',
  brake_confidence = 'Optional carbon ceramics are excellent. Standard brakes adequate for street use.',
  sound_signature = 'Twin-turbo V8 burble with sport exhaust. Not as characterful as earlier V10 but purposeful.',
  comfort_track_balance = 'daily',
  comfort_notes = 'Genuine luxury sedan comfort. Excellent interior, smooth ride, full-size practicality.',
  defining_strengths = '[
    {"title": "617 Horsepower", "description": "Supercar power in a sedan. Brutally fast."},
    {"title": "xDrive + 2WD Mode", "description": "AWD traction when needed, RWD capability when wanted. Best of both."},
    {"title": "Luxury Comfort", "description": "Full-size sedan luxury. Back seats work. Daily usable."},
    {"title": "All-Weather", "description": "AWD makes it a year-round weapon."},
    {"title": "Speed in Stealth", "description": "Subtle sedan appearance hides supercar performance."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Weight", "description": "4,300+ pounds. Heavy for a sports sedan."},
    {"title": "Numb Steering", "description": "Electric steering doesn''t communicate like older BMWs."},
    {"title": "Running Costs", "description": "Big BMW maintenance costs. Tires, brakes, fuel."},
    {"title": "Less Engaging", "description": "More GT car than sports car. The M3 is more involving."}
  ]'::jsonb,
  ideal_owner = 'Buyers wanting maximum performance with full sedan usability. All-weather capability seekers. Those who need back seats.',
  not_ideal_for = 'Engagement seekers—it''s a GT car. Budget-conscious buyers. Those who prefer smaller cars.',
  buyers_summary = 'Competition spec is worth the premium. Carbon ceramics recommended for track use. Executive Package adds luxury.',
  best_years_detailed = '[{"years": "2021-2024", "reason": "All updates in place, latest infotainment."}]'::jsonb,
  must_have_options = '[{"name": "Competition Package", "reason": "617hp, enhanced suspension, sport exhaust."},{"name": "Carbon Ceramic Brakes", "reason": "For track capability."}]'::jsonb,
  price_guide = '{"low": {"price": "$72,000", "condition": "Higher mileage base M5"}, "mid": {"price": "$92,000", "condition": "Competition, 20-40K miles"}, "high": {"price": "$115,000+", "condition": "Low-mile Competition, loaded"}}'::jsonb,
  annual_ownership_cost = '{"low": "$3,500", "typical": "$6,000", "heavy": "$12,000+", "notes": "Big BMW costs. Tires and brakes add up."}'::jsonb,
  track_readiness = 'weekend-warrior',
  community_strength = '8',
  notable_reviews = '[{"source": "Car and Driver", "quote": "The F90 M5 does everything. It''s the ultimate daily-drivable supercar.", "rating": "10/10"}]'::jsonb,
  expert_quotes = '[{"person": "Chris Harris", "outlet": "Top Gear", "quote": "The M5 Competition is absurdly fast. xDrive transforms what this car can do."}]'::jsonb
WHERE slug = 'bmw-m5-f90-competition';


-- ============================================================================
-- Verification Query for Part 3
-- ============================================================================
SELECT 
  name, 
  slug, 
  tier,
  essence IS NOT NULL AS has_essence,
  jsonb_array_length(COALESCE(defining_strengths, '[]'::jsonb)) AS num_strengths
FROM cars 
WHERE slug IN ('bmw-1m-coupe-e82', 'audi-rs5-b9', 'audi-rs3-8y', 'audi-tt-rs-8s', 'alfa-romeo-giulia-quadrifoglio', 'bmw-m5-f90-competition')
ORDER BY name;






