-- ============================================================================
-- CURATED EXPERIENCE: SCHEMA MIGRATION + 718 CAYMAN GT4 DATA
-- 
-- Run this entire file in Supabase SQL Editor to:
-- 1. Add all new curated experience columns to the cars table
-- 2. Update the 718 Cayman GT4 with full curated content
--
-- This is safe to run multiple times (uses IF NOT EXISTS).
-- ============================================================================

-- ============================================================================
-- STEP 1: ADD NEW COLUMNS (Migration)
-- ============================================================================

-- Brand & Platform
ALTER TABLE cars ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS platform_cost_tier TEXT;

-- Ownership & Usability
ALTER TABLE cars ADD COLUMN IF NOT EXISTS manual_available BOOLEAN DEFAULT true;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS seats INTEGER;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS daily_usability_tag TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS maintenance_cost_index TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS insurance_cost_index TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS fuel_economy_combined DECIMAL(4,1);
ALTER TABLE cars ADD COLUMN IF NOT EXISTS common_issues JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS years_to_avoid TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS recommended_years_note TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS ownership_cost_notes TEXT;

-- Identity & Story
ALTER TABLE cars ADD COLUMN IF NOT EXISTS essence TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS heritage TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS design_philosophy TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS motorsport_history TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS generation_code TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS predecessors JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS successors JSONB DEFAULT '[]'::jsonb;

-- Driving Experience
ALTER TABLE cars ADD COLUMN IF NOT EXISTS engine_character TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS transmission_feel TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS chassis_dynamics TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS steering_feel TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS brake_confidence TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS sound_signature TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS comfort_track_balance TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS comfort_notes TEXT;

-- Enhanced Strengths & Weaknesses
ALTER TABLE cars ADD COLUMN IF NOT EXISTS defining_strengths JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS honest_weaknesses JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS ideal_owner TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS not_ideal_for TEXT;

-- Buyer's Guide
ALTER TABLE cars ADD COLUMN IF NOT EXISTS buyers_summary TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS best_years_detailed JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS years_to_avoid_detailed TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS must_have_options JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS nice_to_have_options JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS pre_inspection_checklist JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS ppi_recommendations TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS market_position TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS market_commentary TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS price_guide JSONB DEFAULT '{}'::jsonb;

-- Ownership Reality
ALTER TABLE cars ADD COLUMN IF NOT EXISTS annual_ownership_cost JSONB DEFAULT '{}'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS major_service_costs JSONB DEFAULT '{}'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS common_issues_detailed JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS parts_availability TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS parts_notes TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS dealer_vs_independent TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS dealer_notes TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS diy_friendliness TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS diy_notes TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS warranty_info JSONB DEFAULT '{}'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS insurance_notes TEXT;

-- Track & Performance
ALTER TABLE cars ADD COLUMN IF NOT EXISTS track_readiness TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS track_readiness_notes TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS cooling_capacity JSONB DEFAULT '{}'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS brake_fade_resistance JSONB DEFAULT '{}'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS recommended_track_prep JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS popular_track_mods JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS laptime_benchmarks JSONB DEFAULT '[]'::jsonb;

-- Alternatives
ALTER TABLE cars ADD COLUMN IF NOT EXISTS direct_competitors JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS if_you_want_more JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS if_you_want_less JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS similar_driving_experience JSONB DEFAULT '[]'::jsonb;

-- Community & Culture
ALTER TABLE cars ADD COLUMN IF NOT EXISTS community_strength TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS community_notes TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS key_resources JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS facebook_groups JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS annual_events JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS aftermarket_scene_notes TEXT;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS resale_reputation TEXT;

-- Media & Reviews
ALTER TABLE cars ADD COLUMN IF NOT EXISTS notable_reviews JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS must_watch_videos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS expert_quotes JSONB DEFAULT '[]'::jsonb;

-- Create useful indexes
CREATE INDEX IF NOT EXISTS idx_cars_brand ON cars(brand);
CREATE INDEX IF NOT EXISTS idx_cars_market_position ON cars(market_position);

-- ============================================================================
-- STEP 2: UPDATE 718 CAYMAN GT4 WITH CURATED CONTENT
-- ============================================================================

UPDATE cars SET
  -- Brand & Platform
  brand = 'Porsche',
  country = 'Germany',
  platform_cost_tier = 'premium',
  
  -- Ownership & Usability
  manual_available = true,
  seats = 2,
  daily_usability_tag = 'Weekend warrior',
  maintenance_cost_index = '4',
  insurance_cost_index = '5',
  fuel_economy_combined = 20,
  common_issues = '["Clutch wear on track use", "Infotainment quirks", "Rear main seal (rare)"]'::jsonb,
  years_to_avoid = null,
  recommended_years_note = 'All 718 GT4 years are solid. 2021+ got minor suspension tweaks.',
  ownership_cost_notes = 'Porsche parts are expensive but the flat-6 is robust. Budget for track brake pads.',
  
  -- Identity & Story
  essence = 'The last of the naturally aspirated, mid-engine Porsche scalpels—a future classic built for those who prioritize feedback over comfort.',
  heritage = E'The GT4 represents Porsche''s answer to enthusiasts demanding a naturally aspirated, driver-focused sports car in an era of forced induction. Borrowing its 4.0L flat-six from the 911 GT3, it delivers motorsport DNA in a mid-engine package.\n\nThe 718 generation marked Porsche''s return to the flat-six in this chassis after a controversial turbo-four experiment that defined the base 718 models. The GT4 became the halo car that justified the entire 718 line—proof that Porsche hadn''t forgotten what made the Cayman special.\n\nFirst introduced in 2015 on the 981 platform with a 3.8L engine, the second-generation GT4 (2020+) received the larger, more powerful 4.0L unit with 414 hp. Combined with suspension derived from the 911 GT3, it cemented the GT4''s status as one of the most engaging driver''s cars of the modern era.',
  design_philosophy = E'Porsche''s Motorsport division designed the GT4 with one goal: create the most engaging driving experience possible within the Cayman platform.\n\nUnlike the base Cayman, which balances comfort and performance, the GT4 sacrifices daily livability for razor-sharp handling. The suspension geometry is borrowed from the 911 GT3, the brakes are massive 380mm steel rotors, and every calibration prioritizes driver feedback over isolation. The fixed rear wing isn''t just for show—it provides genuine downforce at track speeds.\n\nThe result is a car that communicates everything happening at the contact patches directly to your fingertips and seat. It''s visceral in a way that modern cars rarely achieve.',
  motorsport_history = E'While the road-going GT4 isn''t directly raced in factory form, it shares significant DNA with the Cayman GT4 Clubsport race car. The Clubsport version has competed successfully in SRO GT4 series worldwide, proving the platform''s capability at the highest amateur racing level.\n\nThe GT4''s track credentials have been validated at the Nürburgring Nordschleife, where it posted a factory-claimed 7:28.2 lap time—faster than many supercars costing twice as much.',
  generation_code = '982',
  predecessors = '["981 Cayman GT4 (2015-2016)"]'::jsonb,
  successors = '["718 Cayman GT4 RS (2022+)"]'::jsonb,
  
  -- Driving Experience
  engine_character = E'The 4.0L flat-six rewards RPMs like few modern engines can. Below 4,000 RPM it''s civilized and tractable—perfectly happy in traffic; above 5,000, it transforms into a wailing instrument that begs for redline.\n\nPeak power arrives at 8,000 RPM—an eternity beyond most turbocharged competitors—and the linear power delivery means you''re always in control. There''s no boost threshold, no waiting for turbos to spool. Just pure, mechanical response that builds and builds until you hit the rev limiter.\n\nThe intake howl is addictive. Every downshift through a tunnel becomes an event. This is an engine you''ll rev out purely for the joy of hearing it work.',
  transmission_feel = E'The six-speed manual has one of the best shift actions in any modern car—short throws, mechanical precision, perfect weighting. You''ll find yourself shifting just for the tactile satisfaction.\n\nRev-matching is standard but can be disabled for those who prefer heel-toe. The clutch is heavier than a base Cayman but perfectly weighted for spirited driving—it won''t fatigue you in traffic, but it lets you know you''re operating something special.\n\nThe PDK option is lightning-fast and shifts with surgical precision, but most enthusiasts agree the manual is the soul of this car. The take rate on manuals is significantly higher than other Porsches.',
  chassis_dynamics = E'The GT4''s chassis is its party piece. Turn-in is immediate, rotation is adjustable, and the mid-engine balance means you can play with oversteer and understeer at will.\n\nThe rear-biased weight distribution (46/54) makes the car eager to rotate, but never snappy or unpredictable. Push hard through a corner and the rear will gently step out, telegraphing its limits clearly. It''s a car that rewards aggression while remaining approachable—you can drive at 8/10ths with confidence, and 10/10ths with skill.\n\nBody roll is minimal but the ride isn''t completely punishing. It walks the line between track weapon and weekend canyon carver with remarkable grace. The suspension is firm, but it still has enough compliance to avoid crashing over expansion joints.',
  steering_feel = E'Electric power steering done right. The GT4''s rack is quicker than standard Caymans (2.5 turns lock-to-lock) and offers genuine feedback—you feel the road surface, the tire loading, and the exact moment of breakaway.\n\nAt parking speeds it''s light enough to be practical. At speed, it weights up naturally and progressively. It''s not quite hydraulic-era feel, but it''s closer than most modern cars dare to get.\n\nThe steering is the primary way this car communicates with you, and it speaks volumes.',
  brake_confidence = E'The stock brakes are legitimately track-capable for most drivers. 380mm front rotors with six-piston calipers provide strong initial bite and excellent modulation.\n\nAfter 20-30 minutes of hard track use with stock pads, fade becomes noticeable. For serious track days, upgraded pads are the first modification most owners make. The brake pedal feel is firm and progressive—you always know exactly how much stopping power you''re commanding.\n\nOptional PCCB ceramic brakes eliminate fade concerns but cost over $15,000 to replace. For most owners, quality aftermarket pads on the steel rotors are the better value proposition.',
  sound_signature = E'The flat-six has a distinctive bark that sets it apart from inline-sixes and V8s. It''s mechanical, not synthesized—no fake engine notes piped through speakers here.\n\nAt idle, there''s a purposeful burble with just a hint of cam overlap. At mid-RPM, a rising howl that sounds expensive and purposeful. At redline, a full-throated scream that Porsche enthusiasts will recognize instantly.\n\nThe exhaust has a rasp to it that sounds angry without being obnoxious. With the windows down in a tunnel or parking garage, it''s genuinely addictive.',
  comfort_track_balance = 'track-focused',
  comfort_notes = E'This is not a comfortable daily driver. The suspension is firm, road noise is present, and the fixed-back bucket seats (optional but common) aren''t designed for long commutes.\n\nThat said, it''s not punishing either—it''s not a race car pretending to be street legal. For weekend use and spirited driving, the tradeoffs are absolutely worth it. Just don''t expect to arrive at work without some fatigue after an hour of rough roads.\n\nClimate control works well, the seats are supportive for long drives, and the infotainment is functional. It''s just that everything takes a back seat to the driving experience.',
  
  -- Enhanced Strengths & Weaknesses
  defining_strengths = '[
    {"title": "The Last Great NA Engine", "description": "In an era of turbocharging and electrification, the GT4''s 4.0L flat-six is a rare gem. Linear power delivery, incredible sound, and an 8,000 RPM redline make every drive an event."},
    {"title": "Perfect Chassis Balance", "description": "Mid-engine layout plus GT3-derived suspension equals one of the most communicative, adjustable chassis you can buy at any price."},
    {"title": "Manual Gearbox Excellence", "description": "The six-speed manual is among the best in the industry—short throws, perfect weighting, satisfying engagement."},
    {"title": "Track-Capable Stock", "description": "Unlike many sports cars that need upgrades for track use, the GT4 can run 20+ minute sessions without overheating or fading dramatically."},
    {"title": "Future Classic Status", "description": "Values are already appreciating. As naturally aspirated engines disappear from the market, cars like the GT4 will only become more desirable."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Not a Daily Driver", "description": "The stiff suspension, road noise, and limited cargo make it impractical for everyday commuting."},
    {"title": "Premium Pricing", "description": "At $85-100K, it''s expensive for what is technically a four-cylinder sports car. You''re paying for engineering excellence and exclusivity."},
    {"title": "Limited Practicality", "description": "Two seats, small frunk, and no rear cargo area. Grocery runs require creativity."},
    {"title": "Firm Ride Quality", "description": "The track-focused suspension doesn''t filter out much. Rough pavement, expansion joints, and potholes are all felt."}
  ]'::jsonb,
  ideal_owner = 'Someone who prioritizes driving engagement over practicality. Owners who appreciate naturally aspirated engines, manual transmissions, and cars that communicate their limits clearly. Track day enthusiasts who want a street-legal weapon. Collectors who recognize future classic potential.',
  not_ideal_for = 'Daily commuters, families, or anyone who needs cargo space. Also not for those who want the latest tech features—the infotainment is functional but dated compared to modern luxury cars. If comfort is a priority, the GTS 4.0 or base Cayman is a better choice.',
  
  -- Buyer's Guide
  buyers_summary = 'Any 718 GT4 is a good buy. Focus on condition, maintenance history, and evidence of track use rather than specific model years. Manual transmission cars hold value better than PDK. Look for the Clubsport package if track use is your priority.',
  best_years_detailed = '[
    {"years": "2021-2024", "reason": "Refined suspension tuning, improved infotainment connectivity, all first-year kinks worked out. These are the fully sorted examples."},
    {"years": "2020", "reason": "First year of the 4.0L engine. Essentially identical mechanically to later years, but slightly softer prices make them compelling values."}
  ]'::jsonb,
  years_to_avoid_detailed = null,
  must_have_options = '[
    {"name": "Sport Chrono Package", "reason": "Adds launch control, dynamic engine mounts, and the Sport Response button. Also includes the stopwatch on the dash. Essential for extracting maximum performance."},
    {"name": "PASM (Adaptive Dampers)", "reason": "Allows switching between Normal and Sport settings. Dramatically improves daily usability without compromising track capability. Highly recommended."},
    {"name": "18-Way Sport Seats Plus", "reason": "If not getting the full buckets, these power-adjustable seats with memory are excellent. Better for longer drives than fixed buckets."}
  ]'::jsonb,
  nice_to_have_options = '[
    {"name": "Clubsport Package", "reason": "Adds roll bar, fire extinguisher, six-point harness anchors, and battery kill switch. Essential for serious track use and HPDE events."},
    {"name": "Full Bucket Seats", "reason": "Better support for track driving and aggressive cornering. Less comfortable for daily use. Popular with track-focused owners."},
    {"name": "Extended Range Fuel Tank", "reason": "16.9 gallon tank vs. standard 14.6. Worth having for track days where pit stops cost precious session time."},
    {"name": "Ceramic Composite Brakes (PCCB)", "reason": "Better fade resistance and lighter weight. However, replacement costs are astronomical ($15K+). Most owners find quality pads on steel rotors sufficient."}
  ]'::jsonb,
  pre_inspection_checklist = '[
    "Check clutch wear percentage via PIWIS diagnostic scan—anything over 50% on a manual warrants negotiation",
    "Inspect rear main seal area for any oil seepage or leaks",
    "Verify suspension corner balance—common issue with used track cars",
    "Check brake rotor thickness and pad life—track use accelerates wear significantly",
    "Look for evidence of track damage: curbed wheels, stone chips on leading edges",
    "Verify maintenance was performed at Porsche dealer or reputable independent specialist",
    "Check for completed software updates—several TSBs addressed minor issues in early cars",
    "Inspect for aftermarket modifications that may affect warranty or reliability",
    "Run VIN through Porsche to verify service history and any open recalls",
    "Test all electronic systems: infotainment, climate, PDK (if equipped), Sport Chrono functions"
  ]'::jsonb,
  ppi_recommendations = 'Insist on a Porsche specialist PPI—generic mechanics may miss Porsche-specific issues. Budget $300-500 for a comprehensive inspection including PIWIS diagnostic scan. Worth every penny on a car this expensive. Ask for clutch wear percentage specifically.',
  market_position = 'appreciating',
  market_commentary = E'GT4 values have been remarkably stable despite economic uncertainty. The combination of NA engine, manual transmission availability, and mid-engine layout makes it highly desirable to enthusiasts.\n\nManual transmission cars command a 5-10% premium over PDK. Low-mile examples (under 10K miles) are approaching or exceeding original MSRP. Collector-grade examples with desirable specs have already appreciated.\n\nExpect continued appreciation as naturally aspirated sports cars become rarer. The GT4 RS''s existence hasn''t hurt GT4 values—it''s validated the platform while maintaining the standard GT4''s position as the more usable, better-value option.',
  price_guide = '{
    "low": {"price": "$85,000", "condition": "Higher mileage (30K+), PDK transmission, base spec, showing wear"},
    "mid": {"price": "$92,000", "condition": "15-25K miles, manual transmission, well-optioned, clean history"},
    "high": {"price": "$100,000+", "condition": "Under 10K miles, manual, fully loaded, Clubsport package, collector quality"}
  }'::jsonb,
  
  -- Ownership Reality
  annual_ownership_cost = '{
    "low": "$2,500",
    "typical": "$4,000",
    "heavy": "$8,000+",
    "notes": "Low assumes minimal driving and basic maintenance. Typical assumes 5-8K miles/year with annual service. Heavy includes track use with consumables."
  }'::jsonb,
  major_service_costs = '{
    "oilChange": {"interval": "10,000 miles or 1 year", "cost": "$350-500", "notes": "Use only Porsche-approved 0W-40 oil. Dealer pricing is at the higher end."},
    "majorService": {"interval": "40,000 miles or 4 years", "cost": "$1,500-2,500", "notes": "Includes spark plugs, all filters, brake fluid flush, comprehensive inspection."},
    "clutch": {"typicalLife": "40,000-80,000 miles", "cost": "$3,500-5,000", "notes": "Track use significantly reduces clutch life."},
    "brakes": {"typicalLife": "25,000-40,000 miles", "cost": "$2,000-3,500 per axle", "notes": "OEM rotors are expensive. Consider aftermarket Brembo blanks for track use."},
    "tires": {"typicalLife": "15,000-25,000 miles", "cost": "$1,200-1,800 for set", "notes": "Stock Michelin Pilot Sport 4S. Track use accelerates wear dramatically."}
  }'::jsonb,
  common_issues_detailed = '[
    {"issue": "Clutch Wear from Track Use", "severity": "moderate", "frequency": "common", "cost": "$3,500-5,000", "notes": "Hard track launches are clutch killers. Street driving has minimal impact."},
    {"issue": "Rear Main Seal Weep", "severity": "minor", "frequency": "uncommon", "cost": "$1,500-2,500", "notes": "Not a widespread issue but known to occur on some examples."},
    {"issue": "Infotainment Glitches", "severity": "minor", "frequency": "common", "cost": "Usually free (software update)", "notes": "Bluetooth dropouts, Apple CarPlay hiccups, occasional freezes."},
    {"issue": "AC Compressor (early 718s)", "severity": "moderate", "frequency": "rare", "cost": "$2,000-3,000", "notes": "Some early 718s had AC compressor failures. Less common on GT4."}
  ]'::jsonb,
  parts_availability = 'excellent',
  parts_notes = 'Porsche parts are readily available through dealers and online sources. Expensive compared to mainstream brands, but no unobtainium situations. Aftermarket options exist for wear items.',
  dealer_vs_independent = 'indie-friendly',
  dealer_notes = 'Many excellent independent Porsche specialists exist in most major markets. For warranty work, dealer is required. For post-warranty service, a quality indie can save 30-40% on labor.',
  diy_friendliness = '4',
  diy_notes = 'Oil changes are straightforward with the right tools. Brake work is manageable for experienced DIYers. Suspension and drivetrain work requires specialist tools and knowledge.',
  warranty_info = '{
    "factory": "4 years / 50,000 miles (bumper to bumper)",
    "cpo": "2 additional years, unlimited miles",
    "notes": "CPO cars command a premium but provide peace of mind. Many owners opt for third-party warranties for extended coverage."
  }'::jsonb,
  insurance_notes = 'Insurance costs are high due to the car''s value, performance capability, and repair costs. Expect $2,000-4,000/year. Track day coverage requires a separate policy from providers like Lockton or Hagerty.',
  
  -- Track & Performance
  track_readiness = 'track-ready',
  track_readiness_notes = 'The GT4 is one of the most track-capable street cars available. Stock brakes last 20-30 minutes of hard use before noticeable fade. Cooling is adequate for most track day conditions. The limiting factor is usually the driver, not the car.',
  cooling_capacity = '{"rating": 8, "notes": "Adequate cooling for 95% of track day situations. Extended sessions in hot ambient temperatures (95°F+) may trigger thermal management."}'::jsonb,
  brake_fade_resistance = '{"rating": 7, "stockPadLife": "3-5 track days with stock pads", "notes": "Stock pads are street-focused and will fade after sustained hard use. Serious track use demands upgraded pads."}'::jsonb,
  recommended_track_prep = '[
    {"item": "Brake Pads", "priority": "essential", "cost": "$400-800 per axle", "notes": "Upgrade to track-capable compound. Pagid RSL29 is the popular choice."},
    {"item": "Brake Fluid", "priority": "essential", "cost": "$50-100 plus labor", "notes": "Use DOT 4 racing fluid: Motul RBF 660, Castrol SRF, or similar."},
    {"item": "Alignment", "priority": "recommended", "cost": "$200-400", "notes": "More aggressive front camber (-2.5° to -3.0°) improves turn-in response."},
    {"item": "Fresh Tires", "priority": "recommended", "cost": "$1,200-1,800 for set", "notes": "Heat cycles matter more than tread depth for grip. Fresh rubber makes a significant difference."}
  ]'::jsonb,
  popular_track_mods = '[
    {"mod": "Adjustable Rear Wing", "purpose": "Tunable downforce for different tracks", "cost": "$2,000-5,000"},
    {"mod": "Roll Bar / Harness Bar", "purpose": "Safety for HPDE/time attack, required for some events", "cost": "$1,500-3,500"},
    {"mod": "Coilovers", "purpose": "Corner balancing, ride height adjustment, rebound tuning", "cost": "$3,500-7,000"},
    {"mod": "Racing Harnesses", "purpose": "Better restraint during track driving (requires roll bar)", "cost": "$500-1,000"},
    {"mod": "Data Acquisition", "purpose": "Lap timing, telemetry, driver coaching", "cost": "$300-2,000"}
  ]'::jsonb,
  laptime_benchmarks = '[
    {"track": "Nürburgring Nordschleife", "time": "7:28.2", "source": "Porsche factory test", "notes": "With optional Michelin Pilot Sport Cup 2 tires."},
    {"track": "Laguna Seca", "time": "1:34.1", "source": "Car and Driver testing", "notes": "Stock configuration."},
    {"track": "Virginia International Raceway (Full)", "time": "2:58.8", "source": "Motor Trend testing", "notes": "Production car, experienced driver."}
  ]'::jsonb,
  
  -- Alternatives
  direct_competitors = '[
    {"slug": "718-cayman-gts-40", "name": "718 Cayman GTS 4.0", "comparison": "Same engine with 20 fewer horsepower, but softer suspension and better daily usability. The GT4 is the track choice; the GTS is the canyon road choice."},
    {"slug": "lotus-evora-gt", "name": "Lotus Evora GT", "comparison": "More exotic, 2+2 seating, supercharged V6. Rawer driving experience but less refined. Depreciation is worse than Porsche."},
    {"slug": "bmw-m2-competition", "name": "BMW M2 Competition", "comparison": "Front-engine, RWD, more practical with 4 seats. Similar power-to-weight. Different driving character—more accessible, less exotic."},
    {"slug": "chevrolet-corvette-c8-stingray", "name": "Chevrolet Corvette C8", "comparison": "More power, mid-engine layout, vastly better value. Less refined chassis feel, less prestigious badge."}
  ]'::jsonb,
  if_you_want_more = '[
    {"slug": "718-cayman-gt4-rs", "name": "718 Cayman GT4 RS", "reason": "500hp, GT3-derived PDK only, full race car for the street. Significantly faster but significantly more expensive ($150K+)."},
    {"slug": "porsche-911-gt3-992", "name": "911 GT3 (992)", "reason": "More power, more presence, the ultimate Porsche experience. Rear-engine handling is different but equally engaging. $180K+ entry point."}
  ]'::jsonb,
  if_you_want_less = '[
    {"slug": "718-cayman-s", "name": "718 Cayman S", "comparison": "Turbo-four, less intense. Better daily driver, more comfortable. 40% less expensive but loses the NA character completely."},
    {"slug": "toyota-gr86", "name": "Toyota GR86", "comparison": "Back-to-basics sports car philosophy. Much cheaper ($30K), similar engagement-focused approach. Less capability, but perhaps more fun per dollar."},
    {"slug": "mazda-mx-5-miata-nd", "name": "Mazda MX-5 Miata ND", "comparison": "The lightweight champion. Less power, less capability, but pure driving joy at a fraction of the price."}
  ]'::jsonb,
  similar_driving_experience = '[
    {"slug": "lotus-elise-s2", "name": "Lotus Elise S2", "reason": "Different execution, same philosophy: lightweight, communicative, driver-focused. Much cheaper but less refined."},
    {"slug": "alpine-a110", "name": "Alpine A110", "reason": "French mid-engine sports car with similar driver-focused philosophy. Lighter, less powerful, but arguably as engaging at legal speeds."}
  ]'::jsonb,
  
  -- Community & Culture
  community_strength = '9',
  community_notes = 'The Porsche community is one of the strongest in the automotive world. Dedicated GT4 forums, Facebook groups, and regional PCA chapters provide endless support, advice, and camaraderie. You''ll never lack for people to discuss your car with, and organized events are plentiful.',
  key_resources = '[
    {"name": "Rennlist", "type": "forum", "url": "https://rennlist.com/forums/718-forum/", "notes": "Primary enthusiast forum for 718 Cayman owners. Deep technical knowledge, active buy/sell section."},
    {"name": "Planet-9", "type": "forum", "url": "https://planet-9.com/", "notes": "Another popular Cayman/Boxster community. Good for regional meetups and DIY guides."},
    {"name": "PCA (Porsche Club of America)", "type": "club", "url": "https://pca.org/", "notes": "Track days, tours, social events. The largest single-marque club in the world."},
    {"name": "GT4 Owners Registry", "type": "forum", "url": "https://gt4registry.com/", "notes": "Dedicated community specifically for GT4/GTS 4.0 owners. Production numbers, option tracking."}
  ]'::jsonb,
  facebook_groups = '["718 Cayman & Boxster Owners", "Porsche GT4 Owners Club", "PCA Track Junkies", "Porsche Enthusiasts Group"]'::jsonb,
  annual_events = '[
    {"name": "Rennsport Reunion", "frequency": "Every 4-5 years", "location": "Laguna Seca, CA", "notes": "The ultimate Porsche gathering with racing, displays, and community."},
    {"name": "PCA Parade", "frequency": "Annual", "location": "Varies (different US city each year)", "notes": "Week-long event with concours, rallies, driving tours, and social activities."},
    {"name": "PCA Club Racing", "frequency": "Throughout the year", "location": "Various tracks nationwide", "notes": "Organized racing events for PCA members. From HPDE to wheel-to-wheel racing."}
  ]'::jsonb,
  aftermarket_scene_notes = 'Strong aftermarket support from Porsche specialists like SharkWerks, GMG Racing, FVD, and others. Exhaust upgrades, suspension components, and wheel options are plentiful. Engine tuning is limited due to NA configuration—there''s no simple ''add a tune'' path like turbocharged cars.',
  resale_reputation = 'Exceptional. GT4s are viewed as future collectibles and hold value better than almost any car in this price range. Low depreciation makes them relatively affordable to own long-term—you can often sell for close to what you paid after a few years of ownership.',
  
  -- Media & Reviews
  notable_reviews = '[
    {"source": "Car and Driver", "title": "2020 Porsche 718 Cayman GT4", "quote": "A sports car this good shouldn''t exist in 2020. The GT4 is a throwback to an era when driving mattered more than lap times.", "rating": "5/5 stars"},
    {"source": "Motor Trend", "title": "Porsche 718 Cayman GT4 First Test", "quote": "The GT4 is proof that Porsche still knows how to build a driver''s car. In an age of turbos and hybrid everything, this naturally aspirated gem is a revelation.", "rating": null},
    {"source": "Top Gear", "title": "Porsche 718 Cayman GT4 Review", "quote": "The best car Porsche currently makes? Quite possibly. It''s certainly the purest.", "rating": "9/10"},
    {"source": "Evo Magazine", "title": "Porsche 718 Cayman GT4", "quote": "An instant classic. The GT4 delivers what enthusiasts have been asking for.", "rating": "5/5 stars"}
  ]'::jsonb,
  must_watch_videos = '[
    {"title": "718 Cayman GT4 - The Best Porsche?", "channel": "Carfection", "url": "https://www.youtube.com/watch?v=aX0jvXFhdEU", "duration": "15:32"},
    {"title": "Porsche GT4 at the Nürburgring", "channel": "Misha Charoudin", "url": "https://www.youtube.com/watch?v=8MIqjxvqpkM", "duration": "12:45"},
    {"title": "GT4 vs GT4 RS - Which Should You Buy?", "channel": "Savage Geese", "url": "https://www.youtube.com/watch?v=Kq8vM_aLcuA", "duration": "28:14"},
    {"title": "One Year Ownership Review", "channel": "Doug DeMuro", "url": "https://www.youtube.com/watch?v=xYZP1UZJQXE", "duration": "22:07"}
  ]'::jsonb,
  expert_quotes = '[
    {"person": "Chris Harris", "outlet": "Top Gear", "quote": "If I could only have one Porsche, it might just be this. The GT4 is everything a sports car should be."},
    {"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The balance is sublime. This is a car that talks to you, tells you exactly what''s happening at every corner."},
    {"person": "Jason Cammisa", "outlet": "Hagerty", "quote": "The GT4 proves that you don''t need 700 horsepower to have an incredible driving experience. Sometimes less really is more."}
  ]'::jsonb

WHERE slug = '718-cayman-gt4';

-- ============================================================================
-- VERIFICATION: Check that the update worked
-- ============================================================================
SELECT 
  name, 
  slug,
  essence IS NOT NULL AS has_essence,
  heritage IS NOT NULL AS has_heritage,
  engine_character IS NOT NULL AS has_engine_character,
  jsonb_array_length(defining_strengths) AS num_strengths,
  jsonb_array_length(expert_quotes) AS num_expert_quotes
FROM cars 
WHERE slug = '718-cayman-gt4';

-- ============================================================================
-- DONE! The 718 Cayman GT4 now has full curated content.
-- 
-- Next steps:
-- 1. Verify the update in your app
-- 2. Run the update script for other cars: 
--    node scripts/update-car-curated-content.js <slug>
-- ============================================================================

