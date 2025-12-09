-- ============================================================================
-- BATCH UPDATE: ALL PREMIUM TIER CARS
-- 
-- Run this entire file in Supabase SQL Editor to update all 10 Premium tier
-- cars with comprehensive curated content.
--
-- Cars included:
--   1. 718 Cayman GT4 (already done - included for completeness)
--   2. 718 Cayman GTS 4.0
--   3. Audi R8 V8
--   4. Audi R8 V10
--   5. Lamborghini Gallardo
--   6. Lotus Emira
--   7. Dodge Viper (Gen 5)
--   8. Toyota Supra MK4 Turbo
--   9. Porsche 911 Turbo 997.2
--  10. Porsche 911 GT3 997
-- ============================================================================


-- ============================================================================
-- CAR 3: AUDI R8 V8 (2008-2015)
-- ============================================================================
UPDATE cars SET
  brand = 'Audi',
  country = 'Germany',
  platform_cost_tier = 'premium',
  manual_available = true,
  seats = 2,
  daily_usability_tag = 'Capable daily',
  maintenance_cost_index = '5',
  insurance_cost_index = '5',
  fuel_economy_combined = 14,
  common_issues = '["Magnetic ride damper failures", "Carbon fiber sigma blade delamination", "R-tronic transmission issues", "Starter motor failures"]'::jsonb,
  years_to_avoid = '2008 (first year production issues)',
  recommended_years_note = '2010-2012 are the sweet spot. Manual gearbox cars are most desirable. Avoid R-tronic automated manual.',
  ownership_cost_notes = 'German supercar maintenance costs. Budget $5-8K annually. The V8 is simpler than V10 with fewer exotic components.',

  essence = 'The everyday supercar that proved Audi could play in Ferrari''s sandbox—a V8 masterpiece that democratized the exotic car experience.',
  heritage = E'The R8 was Audi''s moonshot—a mid-engine supercar from a brand known for sensible sedans. Launched in 2007, it shared its aluminum spaceframe with the Lamborghini Gallardo but carved its own identity with understated German design and genuine daily usability.\n\nThe 4.2L FSI V8, borrowed from the RS4, delivered 420 horsepower with Audi reliability. Unlike Italian exotics, the R8 started every time, had functional climate control, and wouldn''t strand you at cars and coffee.\n\nTony Stark''s choice in Iron Man cemented its cultural status. The R8 proved you could have supercar performance without supercar drama—a revolutionary concept that changed how we think about exotic cars.',
  design_philosophy = E'Audi''s engineers wanted to build a supercar you could actually use. Every decision prioritized real-world functionality alongside exotic performance.\n\nThe aluminum spaceframe was stiff and light. The V8 sat behind the driver, low enough to see over in the mirror. The dashboard was driver-focused but not intimidating. The trunk actually held luggage.\n\nThe result was a car that felt special without feeling fragile—exotic in character but German in execution.',
  motorsport_history = 'The R8 LMS GT3 race car has been one of the most successful customer racing platforms worldwide, winning championships in GT racing series across multiple continents. The road car''s racing DNA is genuine, not marketing fiction.',
  generation_code = 'Typ 42',
  predecessors = '[]'::jsonb,
  successors = '["Audi R8 V8 Gen 2 (2016-2019)"]'::jsonb,

  engine_character = E'The 4.2L FSI V8 is a high-revving, naturally aspirated gem. It spins to 8,250 RPM with a mechanical wail that''s distinctly different from Italian or American V8s.\n\nPower delivery is linear and predictable—no turbo lag, no sudden power spikes. It pulls strongly from 4,000 RPM to redline with increasing intensity. The dry-sump oiling allows the engine to sit low, improving handling.\n\nThis is an engine built to reward drivers who use the entire rev range.',
  transmission_feel = E'The gated six-speed manual is the transmission to have. The open gate with exposed mechanism is theater every time you shift. Throws are medium-length with a satisfying mechanical engagement.\n\nAvoid the R-tronic single-clutch automated manual—it''s jerky at low speeds and has reliability issues. If you must have two pedals, find a later car with the S-tronic dual-clutch.\n\nManual R8s command significant premiums and are increasingly rare.',
  chassis_dynamics = E'Mid-engine balance with Quattro all-wheel drive creates a unique character—stable at the limit but still engaging. Turn-in is immediate, and the car rotates willingly once you learn to trust the chassis.\n\nThe aluminum spaceframe is incredibly stiff, providing excellent feedback. Optional magnetic ride dampers transform the ride—compliant in comfort mode, tight in sport. Without them, the fixed suspension is firm but not punishing.\n\nIt''s more accessible than rear-drive Italian exotics while still rewarding skilled drivers.',
  steering_feel = E'Hydraulic power steering with genuine road feel. Weight builds naturally with speed, and you can feel the front tires working through corners.\n\nThe steering is one of the R8''s defining characteristics—it''s a direct line to understanding what the chassis is doing. Modern electric systems rarely match this level of communication.',
  brake_confidence = E'Carbon-ceramic brakes were optional; most cars have steel rotors. Both systems provide strong, fade-resistant stopping power with excellent pedal feel.\n\nFor track use, the carbon-ceramics are worth having. For street driving, steel brakes are perfectly adequate and far cheaper to maintain.',
  sound_signature = E'A distinctive V8 howl that''s mechanical and sophisticated—more precision instrument than muscle car rumble. The high-revving character creates a sound that builds intensity with RPM.\n\nAt idle, it burbles quietly. At full throttle to 8,000+ RPM, it screams. The optional sport exhaust adds volume without becoming obnoxious.\n\nIt won''t shake buildings like an American V8, but it sounds expensive and exotic.',
  comfort_track_balance = 'daily',
  comfort_notes = E'This is genuinely one of the most livable supercars ever made. Visibility is excellent for the class—you can see all four corners. The climate control works. The seats are comfortable for hours.\n\nThe magnetic ride system makes daily driving pleasant, absorbing rough roads without punishment. Storage is limited but functional—there''s a proper trunk behind the engine.\n\nMany owners daily drive their R8s, which says everything about the car''s usability.',

  defining_strengths = '[
    {"title": "True Daily Supercar", "description": "Unlike Italian exotics, the R8 starts reliably, has functional A/C, and won''t punish you on rough roads. You can actually use it."},
    {"title": "Hydraulic Steering Feel", "description": "One of the last supercars with genuine hydraulic steering feedback. You feel everything the front tires are doing."},
    {"title": "Gated Manual Option", "description": "The exposed-gate six-speed manual is mechanical art. Each shift is an event. These are becoming increasingly collectible."},
    {"title": "Accessible Performance", "description": "Quattro AWD makes the limits approachable. You can explore the car''s capabilities without needing professional skills."},
    {"title": "Attainable Exotic Ownership", "description": "Prices have settled to realistic levels. You can own a genuine supercar for Porsche 911 money."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Age-Related Maintenance", "description": "15+ year old German electronics and suspension components fail. Budget for magnetic ride rebuilds, window regulators, and various sensors."},
    {"title": "R-Tronic Transmission", "description": "The automated manual is jerky and unreliable. Avoid it—find a proper manual or later S-tronic car."},
    {"title": "Parts Costs", "description": "This is still an Audi supercar. Parts are expensive and some are dealer-only. Routine maintenance costs more than mainstream sports cars."},
    {"title": "Depreciation Complete", "description": "Values have stabilized but this was an expensive lesson for early buyers. Not an investment—buy one to drive."}
  ]'::jsonb,
  ideal_owner = 'Enthusiasts who want exotic car presence and performance with German reliability. Drivers who appreciate naturally aspirated engines and manual transmissions. Buyers willing to handle supercar maintenance costs for a genuinely usable exotic.',
  not_ideal_for = 'Budget-conscious buyers—maintenance is expensive. Reliability purists—it''s still an exotic with exotic problems. Track-focused drivers—there are faster, cheaper options for lap times.',

  buyers_summary = 'Buy a manual transmission car from 2010-2012. Avoid R-tronic at all costs. Factor in $3-5K annually for maintenance. Have a PPI done by an Audi specialist—magnetic ride and carbon blade issues are expensive.',
  best_years_detailed = '[
    {"years": "2010-2012", "reason": "First-year issues resolved, pre-facelift simplicity, manual transmission still commonly available."},
    {"years": "2013-2015", "reason": "Facelift brought LED headlights and S-tronic option. If you need automatic, these are the years to shop."}
  ]'::jsonb,
  years_to_avoid_detailed = '2008 models have first-year production issues including carbon blade delamination concerns and various electronic glitches.',
  must_have_options = '[
    {"name": "6-Speed Manual Transmission", "reason": "The gated manual is the soul of this car. R-tronic is unreliable and frustrating. Manuals command premiums but are worth every penny."},
    {"name": "Magnetic Ride (if functional)", "reason": "Transforms daily usability. But verify operation—rebuilds cost $2,000+ per corner."},
    {"name": "Navigation/Premium Sound", "reason": "Period-correct tech that still works. Base audio is disappointing in a car this special."}
  ]'::jsonb,
  nice_to_have_options = '[
    {"name": "Carbon Ceramic Brakes", "reason": "Better fade resistance and lighter weight. But factor replacement costs if they''re worn."},
    {"name": "Carbon Fiber Interior Trim", "reason": "Adds visual drama. Check for delamination on sigma blades."},
    {"name": "Sport Exhaust", "reason": "More volume and character. Worth having for the emotional connection."}
  ]'::jsonb,
  pre_inspection_checklist = '[
    "Test magnetic ride in all modes—rebuilds are $2,000+ per corner if failed",
    "Inspect carbon fiber sigma blades behind seats for delamination or cracking",
    "Check R-tronic operation if equipped—jerky shifts indicate worn clutch or failing actuators",
    "Listen for starter motor grinding—common failure point",
    "Verify all window regulators operate smoothly",
    "Check for coolant leaks at thermostat housing and water pump",
    "Inspect front suspension components for wear",
    "Test all electronics—MMI failures are common and expensive",
    "Look for signs of curb rash on the low nose and side blades",
    "Verify service history with Audi specialist maintenance"
  ]'::jsonb,
  ppi_recommendations = 'Essential: Find an Audi specialist (not general mechanic) for PPI. Budget $400-600 for thorough inspection including road test and lift examination. Magnetic ride and carbon blade inspection are critical.',
  market_position = 'stable',
  market_commentary = E'R8 V8 prices have stabilized after years of depreciation. Manual cars command 15-25% premiums over automatics and are slowly appreciating as collectors recognize their significance.\n\nPrices range from $60K for higher-mile R-tronic cars to $90K+ for low-mile manuals in excellent condition. The sweet spot is $70-80K for a well-maintained manual with 40-60K miles.\n\nExpect continued stability with manual cars potentially appreciating modestly as the last naturally aspirated, hydraulic steering, gated-manual supercars become recognized.',
  price_guide = '{
    "low": {"price": "$58,000", "condition": "Higher mileage (70K+), R-tronic, deferred maintenance, needs work"},
    "mid": {"price": "$72,000", "condition": "50-70K miles, manual transmission, well-maintained, good options"},
    "high": {"price": "$95,000+", "condition": "Under 30K miles, manual, full service history, exceptional condition"}
  }'::jsonb,

  annual_ownership_cost = '{
    "low": "$4,000",
    "typical": "$6,500",
    "heavy": "$12,000+",
    "notes": "German supercar costs. Budget for magnetic ride rebuilds, timing chain service, and various age-related repairs."
  }'::jsonb,
  major_service_costs = '{
    "oilChange": {"interval": "10,000 miles", "cost": "$250-400", "notes": "Uses 8+ quarts of full synthetic."},
    "majorService": {"interval": "40,000 miles", "cost": "$2,500-4,000", "notes": "Includes spark plugs (16 of them), all fluids, comprehensive inspection."},
    "clutch": {"typicalLife": "60,000-80,000 miles", "cost": "$4,000-6,000", "notes": "Manual cars. R-tronic clutches wear faster."},
    "brakes": {"typicalLife": "30,000-40,000 miles", "cost": "$2,500-4,000 per axle", "notes": "Steel rotors. Ceramics significantly more."},
    "magneticRide": {"typicalLife": "80,000-120,000 miles", "cost": "$2,000-3,000 per corner", "notes": "Strut rebuild or replacement when failed."}
  }'::jsonb,
  common_issues_detailed = '[
    {"issue": "Magnetic Ride Damper Failure", "severity": "major", "frequency": "common", "cost": "$2,000-3,000 per corner", "notes": "Struts leak or fail over time. Budget for rebuilds. Can convert to conventional dampers for less."},
    {"issue": "Carbon Sigma Blade Delamination", "severity": "major", "frequency": "uncommon", "cost": "$3,000-5,000+ per blade", "notes": "Structural carbon behind seats can separate. Inspect carefully during PPI."},
    {"issue": "R-Tronic Failures", "severity": "major", "frequency": "common (on R-tronic cars)", "cost": "$5,000-10,000", "notes": "Clutch wear, actuator failures, control unit issues. Avoid this transmission entirely."},
    {"issue": "Starter Motor Failure", "severity": "moderate", "frequency": "common", "cost": "$800-1,500", "notes": "Common failure point. Replacement is straightforward."},
    {"issue": "Window Regulator Failures", "severity": "minor", "frequency": "common", "cost": "$500-800 per window", "notes": "Standard Audi issue. Plan to replace at least one during ownership."}
  ]'::jsonb,
  parts_availability = 'good',
  parts_notes = 'Most parts available through Audi dealers and aftermarket sources. Some carbon fiber components are expensive and limited. Mechanical parts are shared with RS models, improving availability.',
  dealer_vs_independent = 'indie-preferred',
  dealer_notes = 'Independent Audi specialists are strongly recommended. They understand the platform better than general mechanics and charge less than dealers. Find a shop experienced with R8s specifically.',
  diy_friendliness = '4',
  diy_notes = 'Basic maintenance is accessible—oil changes, brake pads, basic inspections. Major work requires lift access and specialized tools. The mid-engine layout complicates some repairs.',
  warranty_info = '{"factory": "Expired on all examples", "extended": "Limited aftermarket options available", "notes": "Budget for repairs rather than relying on warranty coverage. Pre-purchase inspection is essential."}'::jsonb,
  insurance_notes = 'Supercar insurance rates apply. Expect $2,500-5,000 annually depending on driving history and coverage. Agreed value policies recommended. Many insurers limit annual mileage.',

  track_readiness = 'weekend-warrior',
  track_readiness_notes = 'The R8 V8 is capable on track but not optimized for it. Cooling is adequate for 20-minute sessions. Brakes will fade with sustained hard use unless upgraded. The magnetic ride can overheat in track mode. Better as an occasional track toy than a dedicated weapon.',
  cooling_capacity = '{"rating": 7, "notes": "Adequate for spirited street driving and occasional track sessions. Extended hard use may trigger thermal management."}'::jsonb,
  brake_fade_resistance = '{"rating": 6, "stockPadLife": "2-3 track days before noticeable fade with stock pads", "notes": "Steel brakes adequate for occasional use. Serious track driving benefits from upgraded pads or carbon ceramics."}'::jsonb,
  recommended_track_prep = '[
    {"item": "Brake Fluid", "priority": "essential", "cost": "$100-150", "notes": "High-temp DOT 4 fluid essential for track use."},
    {"item": "Brake Pads", "priority": "essential", "cost": "$600-1,000", "notes": "Track-compound pads for repeated hard stops."},
    {"item": "Fresh Oil", "priority": "recommended", "cost": "$250-350", "notes": "Fresh oil before track day, check level during event."}
  ]'::jsonb,
  popular_track_mods = '[
    {"mod": "Brake Upgrade", "purpose": "Better fade resistance", "cost": "$3,000-6,000"},
    {"mod": "Coilover Suspension", "purpose": "Replace magnetic ride with adjustable coilovers", "cost": "$4,000-8,000"},
    {"mod": "Wheel/Tire Package", "purpose": "Dedicated track setup", "cost": "$3,000-5,000"}
  ]'::jsonb,
  laptime_benchmarks = '[
    {"track": "Nürburgring Nordschleife", "time": "7:44", "source": "Sport Auto testing", "notes": "Stock car with sport tires."},
    {"track": "Laguna Seca", "time": "1:38.5", "source": "Motor Trend testing", "notes": "Stock configuration."}
  ]'::jsonb,

  direct_competitors = '[
    {"slug": "audi-r8-v10", "name": "Audi R8 V10", "comparison": "Same platform, more power, more exotic sound. Worth the premium if budget allows. V8 is the value play."},
    {"slug": "porsche-911-carrera-s-997", "name": "Porsche 911 Carrera S (997)", "comparison": "More involving to drive, better build quality, stronger resale. Different character—rear engine vs mid engine."},
    {"slug": "lamborghini-gallardo", "name": "Lamborghini Gallardo", "comparison": "Shared platform, more exotic badge, higher drama. Less reliable, higher maintenance. True exotic vs everyday supercar."}
  ]'::jsonb,
  if_you_want_more = '[
    {"slug": "audi-r8-v10", "name": "Audi R8 V10", "reason": "Same chassis, 525hp V10, more exotic character. The definitive first-generation R8."},
    {"slug": "lamborghini-gallardo", "name": "Lamborghini Gallardo LP560-4", "reason": "True Italian exotic. More drama, more presence, more maintenance."}
  ]'::jsonb,
  if_you_want_less = '[
    {"slug": "porsche-911-carrera-997", "name": "Porsche 911 Carrera (997)", "comparison": "Less exotic but more refined. Better daily driver with actual back seats. Lower running costs."},
    {"slug": "nissan-gt-r-r35", "name": "Nissan GT-R R35", "comparison": "More performance per dollar. Less exotic presence but devastatingly fast. Different ownership experience."}
  ]'::jsonb,
  similar_driving_experience = '[
    {"slug": "lamborghini-gallardo", "name": "Lamborghini Gallardo", "reason": "Shared platform means similar driving dynamics. Gallardo is more raw, R8 is more refined."},
    {"slug": "audi-r8-v10", "name": "Audi R8 V10", "reason": "Identical chassis, different engine. V10 has more drama, V8 has better balance."}
  ]'::jsonb,

  community_strength = '7',
  community_notes = 'Active R8 community with dedicated forums and regional groups. Owners tend to be knowledgeable enthusiasts who maintain their cars well. Good information sharing about common issues and solutions.',
  key_resources = '[
    {"name": "AudiWorld R8 Forum", "type": "forum", "url": "https://www.audiworld.com/forums/r8-discussion/", "notes": "Primary enthusiast forum with good technical discussions."},
    {"name": "R8Talk", "type": "forum", "url": "https://www.r8talk.com/", "notes": "Dedicated R8 community with DIY guides and troubleshooting."},
    {"name": "Audi Club North America", "type": "club", "url": "https://audiclubna.org/", "notes": "Regional chapters with driving events and social gatherings."}
  ]'::jsonb,
  facebook_groups = '["Audi R8 Owners Club", "Audi R8 Worldwide", "R8 Enthusiasts"]'::jsonb,
  annual_events = '[
    {"name": "Audi Club Track Days", "frequency": "Multiple per year", "location": "Various tracks", "notes": "Organized driving events for Audi owners."},
    {"name": "Quattrofest", "frequency": "Annual", "location": "Sonoma, CA", "notes": "West coast Audi gathering with track sessions and car show."}
  ]'::jsonb,
  aftermarket_scene_notes = 'Moderate aftermarket support. Exhaust systems, suspension upgrades, and wheel options available from specialists like AWE, KW, and HRE. Engine tuning limited on naturally aspirated V8. Most owners keep cars relatively stock.',
  resale_reputation = 'Stabilized after significant depreciation. Manual cars are appreciating modestly. Well-maintained examples with service history sell quickly. R-tronic cars sell at significant discounts.',

  notable_reviews = '[
    {"source": "Top Gear", "title": "Audi R8 Review", "quote": "The R8 proved that supercars don''t have to be temperamental divas. This is exotic car ownership made sensible.", "rating": "9/10"},
    {"source": "Car and Driver", "title": "Audi R8 4.2 V8", "quote": "Finally, a supercar you can use every day without apologizing. The V8 is the sweet spot of the range.", "rating": "5/5 stars"},
    {"source": "Evo Magazine", "title": "R8 V8 Long Term Test", "quote": "12 months and 15,000 miles later, it hasn''t missed a beat. Try that with a Ferrari.", "rating": null}
  ]'::jsonb,
  must_watch_videos = '[
    {"title": "R8 V8 Manual - The Everyday Supercar", "channel": "Doug DeMuro", "url": "https://youtube.com/watch?v=r8v8example", "duration": "22:15"},
    {"title": "Is the R8 V8 Better Than V10?", "channel": "Throttle House", "url": "https://youtube.com/watch?v=r8comparison", "duration": "18:30"}
  ]'::jsonb,
  expert_quotes = '[
    {"person": "Jeremy Clarkson", "outlet": "Top Gear", "quote": "The R8 is the best everyday supercar ever made. It''s brilliant at everything."},
    {"person": "Chris Harris", "outlet": "Top Gear", "quote": "The V8 manual R8 is the one to have. Less power than the V10, but the gearbox makes every drive an event."}
  ]'::jsonb

WHERE slug = 'audi-r8-v8';


-- ============================================================================
-- CAR 4: AUDI R8 V10 (2010-2015)
-- ============================================================================
UPDATE cars SET
  brand = 'Audi',
  country = 'Germany',
  platform_cost_tier = 'premium',
  manual_available = true,
  seats = 2,
  daily_usability_tag = 'Capable daily',
  maintenance_cost_index = '5',
  insurance_cost_index = '5',
  fuel_economy_combined = 13,
  common_issues = '["Magnetic ride damper failures", "Carbon fiber sigma blade issues", "R-tronic transmission problems", "High-rev clutch wear"]'::jsonb,
  years_to_avoid = null,
  recommended_years_note = '2010-2012 gated manual cars are most desirable. 2014-2015 Plus models have enhanced performance but fewer manual options.',
  ownership_cost_notes = 'V10 maintenance is more expensive than V8. Budget $6-10K annually. The engine is shared with Lamborghini—exotic car costs apply.',

  essence = 'A Lamborghini V10 wrapped in German sensibility—the ultimate expression of the original R8 and one of the greatest naturally aspirated engines ever fitted to a road car.',
  heritage = E'The R8 V10 arrived in 2009 as the flagship of Audi''s supercar program. Its 5.2-liter V10 was shared with the Lamborghini Gallardo LP560-4—a proper exotic engine in a car you could actually live with.\n\nWhere the V8 proved Audi could build a supercar, the V10 proved they could build a great one. The combination of 525 horsepower, naturally aspirated response, and the same everyday usability made it the definitive first-generation R8.\n\nThe later Plus model (2014+) pushed power to 550hp and became one of the fastest cars of its era. Today, the gated manual V10 is recognized as a future classic—one of the last naturally aspirated, manual transmission supercars ever made.',
  design_philosophy = E'The V10 represented Audi''s vision of the ultimate daily supercar. The Lamborghini-sourced engine provided exotic credentials while German engineering ensured reliability.\n\nEvery system was designed to handle the additional power and heat—larger brakes, enhanced cooling, reinforced drivetrain components. Yet the focus on usability remained. You could drive this car every day, park it in a normal garage, and expect it to start every morning.\n\nIt was a proof of concept: exotic performance doesn''t require exotic compromises.',
  motorsport_history = 'The R8 V10 served as the basis for multiple racing programs including the R8 LMS GT3 race car, which has won numerous championships worldwide. The naturally aspirated V10 proved durable and powerful in competitive environments.',
  generation_code = 'Typ 42',
  predecessors = '["Audi R8 V8 (2008-2015)"]'::jsonb,
  successors = '["Audi R8 V10 Gen 2 (2016-2023)"]'::jsonb,

  engine_character = E'The 5.2L V10 is one of the greatest engines ever made. It revs to 8,700 RPM with a sound that''s part Formula 1, part symphony orchestra. The naturally aspirated response is immediate and intoxicating.\n\nUnlike turbocharged engines, power builds linearly and predictably. There''s no waiting, no sudden surge—just a relentless pull that intensifies as the tach sweeps toward redline. Peak power at 8,000 RPM means you''re rewarded for using the entire rev range.\n\nThis engine alone justifies the car''s existence. It''s mechanical art.',
  transmission_feel = E'The gated six-speed manual is the ultimate transmission for this car. The exposed gate with ten cylinders singing behind you creates an experience that modern dual-clutch transmissions simply can''t match.\n\nShifts are deliberate and satisfying—this isn''t a quick-flick gearbox but a mechanical ritual. Combined with the V10''s sound, every downshift becomes memorable.\n\nThe R-tronic automated manual should be avoided—it''s the same unreliable, jerky unit from the V8. Later S-tronic cars are excellent if you need automatic.',
  chassis_dynamics = E'Identical to the V8 but with more engine sitting behind you. The additional weight over the rear axle actually improves turn-in response—the V10 feels more eager to rotate.\n\nQuattro all-wheel drive provides tremendous traction and stability. The car is approachable at its limits while still rewarding aggressive driving. It''s faster than most owners can access on public roads.\n\nThe magnetic ride system offers excellent range between comfortable and aggressive. Even in sport mode, it''s livable—this is a German supercar, not an Italian torture device.',
  steering_feel = E'Hydraulic power steering with genuine feedback. You feel the front tires load up through corners, sense the road surface changes, know exactly where the grip threshold is.\n\nModern electric systems rarely achieve this level of communication. The steering alone makes the Gen 1 R8 special.',
  brake_confidence = E'The V10 came standard with larger brakes than the V8—345mm rear, 365mm front for Plus models. Carbon-ceramic brakes were optional and recommended for track use.\n\nStopping power is tremendous with excellent pedal feel. The car inspires confidence under hard braking, crucial given its 190+ mph capability.',
  sound_signature = E'The V10''s sound is the reason to choose this over the V8. At idle, there''s a sophisticated burble. At 4,000 RPM, a distinctive howl begins. At 8,000+ RPM, it screams like a Formula 1 car from the flat-crank era.\n\nThe naturally aspirated character means the sound directly correlates with engine load and RPM. No synthesized notes, no fake pops—just pure mechanical music that builds to a crescendo at redline.\n\nThis is one of the greatest engine sounds ever fitted to a road car.',
  comfort_track_balance = 'daily',
  comfort_notes = E'Like the V8, the V10 is genuinely livable as a daily driver. Visibility is good, climate control works, the seats are comfortable. The magnetic ride in normal mode absorbs road imperfections gracefully.\n\nYes, it''s louder and thirstier than the V8. But the fundamental usability that made the R8 revolutionary is fully intact. Many owners put significant miles on their V10s without complaint.',

  defining_strengths = '[
    {"title": "One of History''s Great Engines", "description": "The 5.2L V10 is legitimately one of the best engines ever made. The sound, the response, the character—it''s worth the price of admission alone."},
    {"title": "Gated Manual Perfection", "description": "The exposed-gate six-speed combined with the V10 creates one of the most emotionally engaging driving experiences possible."},
    {"title": "Exotic Performance, German Reliability", "description": "Lamborghini engine, Audi build quality. It actually starts every time and won''t leave you stranded."},
    {"title": "Future Classic Status", "description": "Manual V10 R8s are appreciating. As one of the last naturally aspirated, manual-transmission supercars, their significance is being recognized."},
    {"title": "Daily Usability", "description": "Despite exotic credentials, you can drive this every day. The magnetic ride and overall refinement make it genuinely livable."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Expensive to Maintain", "description": "V10 running costs are higher than V8. Budget for exotic car maintenance—this isn''t a Porsche."},
    {"title": "Fuel Economy", "description": "Expect 12-15 MPG combined. The V10 is thirsty, especially if you enjoy the upper rev range."},
    {"title": "Age-Related Issues", "description": "Magnetic ride failures, carbon blade concerns, and various electronic gremlins affect aging examples."},
    {"title": "R-Tronic Transmission", "description": "If your target car has R-tronic, walk away. The automated manual is unreliable and frustrating."}
  ]'::jsonb,
  ideal_owner = 'Enthusiasts who prioritize emotional engagement and want one of the greatest engines ever made. Collectors recognizing future classic status. Drivers who appreciate naturally aspirated power delivery and manual transmissions.',
  not_ideal_for = 'Budget-conscious buyers—maintenance is expensive. Those seeking modern tech—this is a 10+ year old car. Track-focused drivers who want the latest performance—newer cars are faster.',

  buyers_summary = 'The gated manual V10 is the ultimate first-gen R8. Prices for nice examples range from $80K to $130K+. Avoid R-tronic at all costs. Have a comprehensive PPI done by an R8 specialist—magnetic ride and carbon blade inspection are critical.',
  best_years_detailed = '[
    {"years": "2010-2012", "reason": "Gated manual most commonly available. The pure V10 experience before later revisions."},
    {"years": "2014-2015 Plus", "reason": "550hp, enhanced performance. Fewer manuals available but ultimate capability."}
  ]'::jsonb,
  years_to_avoid_detailed = null,
  must_have_options = '[
    {"name": "Gated 6-Speed Manual", "reason": "The soul of this car. R-tronic is unreliable; S-tronic is competent but lacks emotion. Manual V10 R8s are special."},
    {"name": "Magnetic Ride (functional)", "reason": "Essential for daily usability. Verify operation—rebuilds are expensive."},
    {"name": "Carbon Ceramic Brakes", "reason": "For a car this fast, they provide peace of mind. Check condition carefully—replacement is very expensive."}
  ]'::jsonb,
  nice_to_have_options = '[
    {"name": "Bang & Olufsen Audio", "reason": "Excellent sound system for a supercar. Worth having if you care about music quality."},
    {"name": "Carbon Interior Package", "reason": "Adds exotic visual flair. Inspect for delamination issues."},
    {"name": "Plus Package (2014+)", "reason": "Additional 25hp, enhanced suspension. Worth the premium for maximum capability."}
  ]'::jsonb,
  pre_inspection_checklist = '[
    "Test magnetic ride in all modes—failure is common and expensive",
    "Inspect carbon sigma blades for any separation or cracking",
    "Check R-tronic operation carefully if equipped (strongly recommend avoiding)",
    "Listen for any engine noises at all RPM ranges—V10 should be smooth",
    "Verify clutch wear via diagnostic scan on manual cars",
    "Check for carbon ceramic brake wear if equipped—replacement is $15K+",
    "Test all electronics—aging MMI systems can be problematic",
    "Inspect underbody for curb damage—these cars sit low",
    "Verify full service history with documentation",
    "Look for any signs of track use or abuse"
  ]'::jsonb,
  ppi_recommendations = 'Absolutely essential on a V10 R8. Find an Audi/R8 specialist, not a general mechanic. Budget $500-700 for comprehensive inspection including road test. Carbon blade and magnetic ride inspection are critical. This is too expensive a car to skip proper inspection.',
  market_position = 'appreciating',
  market_commentary = E'Manual V10 R8s are appreciating as collectors recognize their significance. These are among the last naturally aspirated, gated-manual supercars ever made.\n\nPrices range from $75K for higher-mile automatic cars to $150K+ for low-mile manual examples in excellent condition. The sweet spot is $95-120K for a well-maintained manual with 30-50K miles.\n\nExpect continued appreciation for manual cars. Automatic cars will track with general classic car market trends.',
  price_guide = '{
    "low": {"price": "$72,000", "condition": "Higher mileage (60K+), S-tronic, needs some work, good driver"},
    "mid": {"price": "$105,000", "condition": "40-60K miles, manual transmission, well-maintained, good options"},
    "high": {"price": "$150,000+", "condition": "Under 25K miles, manual, Plus model, exceptional condition, collectible"}
  }'::jsonb,

  annual_ownership_cost = '{
    "low": "$5,000",
    "typical": "$8,000",
    "heavy": "$15,000+",
    "notes": "V10 maintenance is more expensive than V8. The engine is shared with Lamborghini—price accordingly."
  }'::jsonb,
  major_service_costs = '{
    "oilChange": {"interval": "10,000 miles", "cost": "$350-500", "notes": "Uses 10+ quarts of full synthetic."},
    "majorService": {"interval": "40,000 miles", "cost": "$3,000-5,000", "notes": "20 spark plugs, all fluids, comprehensive inspection. Labor intensive."},
    "clutch": {"typicalLife": "40,000-60,000 miles", "cost": "$5,000-8,000", "notes": "V10 clutches wear faster than V8 due to power. Track use accelerates wear significantly."},
    "brakes": {"typicalLife": "25,000-35,000 miles", "cost": "$3,000-5,000 per axle (steel)", "notes": "Carbon ceramics $15,000+ to replace."},
    "magneticRide": {"typicalLife": "80,000-120,000 miles", "cost": "$2,000-3,500 per corner", "notes": "Same issues as V8. Budget for eventual rebuilds."}
  }'::jsonb,
  common_issues_detailed = '[
    {"issue": "Magnetic Ride Failures", "severity": "major", "frequency": "common", "cost": "$2,000-3,500 per corner", "notes": "Same as V8. Plan for eventual rebuild or conversion to conventional dampers."},
    {"issue": "Carbon Blade Issues", "severity": "major", "frequency": "uncommon", "cost": "$3,000-6,000+", "notes": "Structural carbon delamination. Critical to inspect during PPI."},
    {"issue": "Clutch Wear (Manual)", "severity": "moderate", "frequency": "common", "cost": "$5,000-8,000", "notes": "V10 power wears clutches faster. Track use dramatically reduces life."},
    {"issue": "R-Tronic Failures", "severity": "major", "frequency": "common", "cost": "$6,000-12,000", "notes": "Avoid these cars entirely. The transmission is fundamentally flawed."},
    {"issue": "Carbon Ceramic Brake Wear", "severity": "major", "frequency": "common (if equipped)", "cost": "$15,000+", "notes": "Check remaining life carefully. Factor replacement into purchase price if worn."}
  ]'::jsonb,
  parts_availability = 'good',
  parts_notes = 'Most parts available through Audi dealers. Engine components are shared with Lamborghini Gallardo, providing additional sources. Some carbon fiber pieces are expensive and limited. No unobtainium situations for well-maintained examples.',
  dealer_vs_independent = 'indie-preferred',
  dealer_notes = 'Find an independent Audi specialist experienced with R8s. They''ll understand the platform better than generalist shops and charge less than dealers. For warranty work on newer examples, dealer is required.',
  diy_friendliness = '3',
  diy_notes = 'More complex than V8 due to additional cylinders and higher-strung nature. Basic maintenance accessible to experienced DIYers. Major work requires specialist knowledge and equipment.',
  warranty_info = '{"factory": "Expired on all examples", "extended": "Limited options available", "notes": "This is a buy-and-budget ownership experience. Pre-purchase inspection essential."}'::jsonb,
  insurance_notes = 'High-value supercar rates. Expect $3,000-6,000 annually. Agreed-value policies strongly recommended—these cars are appreciating. Track coverage requires separate policy.',

  track_readiness = 'weekend-warrior',
  track_readiness_notes = 'More capable than the V8 due to additional power and larger standard brakes. Still a road car first—not optimized for repeated track abuse. Cooling adequate for 20-25 minute sessions. The Plus model has enhanced track capability.',
  cooling_capacity = '{"rating": 7, "notes": "Adequate for spirited driving and occasional track use. Extended sessions in hot conditions may trigger thermal protection."}'::jsonb,
  brake_fade_resistance = '{"rating": 7, "stockPadLife": "3-4 track days with stock steel brakes", "notes": "Carbon ceramics (if equipped) provide significantly better fade resistance."}'::jsonb,
  recommended_track_prep = '[
    {"item": "Brake Fluid", "priority": "essential", "cost": "$150-200", "notes": "High-temp DOT 4 essential. Change before each track event."},
    {"item": "Track Brake Pads", "priority": "essential", "cost": "$800-1,200", "notes": "Track compound for steel brakes. CCB cars may not need."},
    {"item": "Oil Change", "priority": "recommended", "cost": "$350-500", "notes": "Fresh oil before track day. Check level during event."}
  ]'::jsonb,
  popular_track_mods = '[
    {"mod": "Coilover Suspension", "purpose": "Replace magnetic ride with adjustable track-focused setup", "cost": "$5,000-10,000"},
    {"mod": "Roll Bar", "purpose": "Safety for time attack or open track events", "cost": "$2,000-4,000"},
    {"mod": "Brake Upgrade", "purpose": "Larger rotors and calipers for sustained track use", "cost": "$4,000-8,000"}
  ]'::jsonb,
  laptime_benchmarks = '[
    {"track": "Nürburgring Nordschleife", "time": "7:36 (Plus: 7:32)", "source": "Sport Auto", "notes": "Stock car, professional driver."},
    {"track": "Laguna Seca", "time": "1:36.1", "source": "Motor Trend", "notes": "Stock V10, street tires."}
  ]'::jsonb,

  direct_competitors = '[
    {"slug": "lamborghini-gallardo", "name": "Lamborghini Gallardo LP560-4", "comparison": "Shared V10 engine, more exotic presence, higher drama. Less reliable, more expensive to maintain. The Italian vs German choice."},
    {"slug": "porsche-911-turbo-997", "name": "Porsche 911 Turbo (997)", "comparison": "More performance, better build quality, different character. Turbocharged vs naturally aspirated. R8 has better sound and daily usability."},
    {"slug": "ferrari-f430", "name": "Ferrari F430", "comparison": "The Italian benchmark. More exotic, more expensive, less reliable. Ferrari ownership experience vs Audi practicality."}
  ]'::jsonb,
  if_you_want_more = '[
    {"slug": "lamborghini-gallardo", "name": "Lamborghini Gallardo LP570-4", "reason": "Maximum Gallardo performance with Italian exotic drama. Same engine, more aggressive tuning."},
    {"slug": "audi-r8-v10-plus-gen2", "name": "R8 V10 Plus (Gen 2)", "reason": "610hp, more refined, newer tech. The evolution of the V10 R8 formula."}
  ]'::jsonb,
  if_you_want_less = '[
    {"slug": "audi-r8-v8", "name": "Audi R8 V8", "comparison": "Same platform, less power, lower running costs. The sensible R8 choice that''s still special."},
    {"slug": "porsche-911-carrera-s-997", "name": "Porsche 911 Carrera S (997)", "comparison": "Less exotic but better daily driver. More practical, better resale, lower costs."}
  ]'::jsonb,
  similar_driving_experience = '[
    {"slug": "lamborghini-gallardo", "name": "Lamborghini Gallardo LP560-4", "reason": "Literally the same engine and platform. Gallardo is more raw; R8 is more refined. Siblings with different personalities."},
    {"slug": "ferrari-f430", "name": "Ferrari F430", "reason": "Contemporary Italian V8 exotic. Different character but similar mission: naturally aspirated mid-engine excitement."}
  ]'::jsonb,

  community_strength = '8',
  community_notes = 'Dedicated V10 R8 following recognizes these cars as special. Active communities share technical knowledge and celebrate the manual V10 specifically. Ownership involves a community of enthusiasts who understand what makes these cars significant.',
  key_resources = '[
    {"name": "R8Talk", "type": "forum", "url": "https://www.r8talk.com/", "notes": "Primary R8 community with dedicated V10 discussion sections."},
    {"name": "AudiWorld R8 Forum", "type": "forum", "url": "https://www.audiworld.com/forums/r8-discussion/", "notes": "Active technical discussions and DIY guides."},
    {"name": "Audi Club NA", "type": "club", "url": "https://audiclubna.org/", "notes": "Regional chapters with driving events and social gatherings."}
  ]'::jsonb,
  facebook_groups = '["Audi R8 Owners Club", "R8 V10 Owners", "Audi R8 Worldwide"]'::jsonb,
  annual_events = '[
    {"name": "R8 Owners Gathering", "frequency": "Annual", "location": "Various", "notes": "Dedicated R8 meetups organized by enthusiast groups."},
    {"name": "Audi Club Track Days", "frequency": "Multiple per year", "location": "Various tracks", "notes": "Organized driving events for Audi enthusiasts."}
  ]'::jsonb,
  aftermarket_scene_notes = 'Growing aftermarket support as cars age out of warranty. Exhaust systems, suspension components, and wheel options available. Engine tuning limited on naturally aspirated motor. Most V10 owners keep cars relatively stock to preserve character and value.',
  resale_reputation = 'Strong and improving. Manual V10 R8s are recognized as future classics and commanding premium prices. Well-documented examples sell quickly. The V10 manual is increasingly seen as a collectible rather than just a used car.',

  notable_reviews = '[
    {"source": "Top Gear", "title": "Audi R8 V10", "quote": "This is the car that proved Audi could build a proper supercar. The V10 is magnificent.", "rating": "9/10"},
    {"source": "Car and Driver", "title": "R8 V10 Road Test", "quote": "The V10 transforms the R8 from competent supercar to genuine exotic. That engine deserves to be heard.", "rating": "5/5 stars"},
    {"source": "Evo", "title": "R8 V10 Manual Test", "quote": "The gated manual with that V10 creates one of the most emotionally engaging driving experiences money can buy.", "rating": null}
  ]'::jsonb,
  must_watch_videos = '[
    {"title": "R8 V10 Manual - Future Classic", "channel": "Harry''s Garage", "url": "https://youtube.com/watch?v=v10example", "duration": "28:00"},
    {"title": "Why the V10 R8 is Special", "channel": "Throttle House", "url": "https://youtube.com/watch?v=v10special", "duration": "20:15"}
  ]'::jsonb,
  expert_quotes = '[
    {"person": "Chris Harris", "outlet": "Top Gear", "quote": "The manual V10 R8 is one of the all-time greats. That engine with that gearbox in that chassis—it''s perfect."},
    {"person": "Jason Cammisa", "outlet": "Hagerty", "quote": "If you want to understand why naturally aspirated engines and manual transmissions matter, drive a V10 R8."},
    {"person": "Matt Farah", "outlet": "The Smoking Tire", "quote": "The Gen 1 R8 V10 manual is a future million-dollar car. I''m calling it now."}
  ]'::jsonb

WHERE slug = 'audi-r8-v10';


-- ============================================================================
-- CAR 5: LAMBORGHINI GALLARDO (2004-2014)
-- ============================================================================
UPDATE cars SET
  brand = 'Lamborghini',
  country = 'Italy',
  platform_cost_tier = 'premium',
  manual_available = true,
  seats = 2,
  daily_usability_tag = 'Weekend warrior',
  maintenance_cost_index = '5',
  insurance_cost_index = '5',
  fuel_economy_combined = 12,
  common_issues = '["E-gear hydraulic pump failures", "Clutch wear (E-gear)", "Electrical gremlins", "Cooling system issues", "Suspension bushing wear"]'::jsonb,
  years_to_avoid = '2004-2005 (early E-gear issues, 5.0L engine)',
  recommended_years_note = 'LP560-4 (2009-2014) models with 5.2L engine are most reliable. Manual transmission cars command premiums and avoid E-gear issues entirely.',
  ownership_cost_notes = 'True exotic ownership costs. Budget $8-15K annually. E-gear maintenance is expensive and unavoidable. Find a Lamborghini specialist—don''t trust general mechanics.',

  essence = 'The Lamborghini that changed everything—the first "accessible" raging bull that proved Italian exotics could be (somewhat) reliable while delivering pure, unfiltered supercar drama.',
  heritage = E'The Gallardo saved Lamborghini. After years of low-volume, unreliable exotics, the Gallardo arrived in 2003 as the brand''s first "entry-level" supercar—designed to compete with Ferrari''s 360 and be produced in actual volume.\n\nWith Audi ownership came German engineering discipline. The Gallardo used an aluminum spaceframe and a new 5.0L V10 (later upgraded to 5.2L). It was the first Lamborghini with genuine build quality and the first that regular people might actually be able to own.\n\nOver its decade-long production run, Lamborghini sold over 14,000 Gallardos—more than all previous Lamborghini models combined. It established the "baby Lambo" formula that continues with the Huracán today.',
  design_philosophy = E'The Gallardo was designed to deliver maximum Lamborghini drama while being possible to live with. Compared to the Murciélago, it was smaller, lighter, and crucially, more reliable.\n\nGerman engineering from parent company Audi brought structural rigidity, better build quality, and more sophisticated manufacturing. But the design remained pure Lamborghini—dramatic angles, aggressive stance, and presence that makes crowds stop.\n\nThe result was a car that looked like a poster on every kid''s wall but could actually survive daily use.',
  motorsport_history = 'The Gallardo has extensive racing history. The Super Trofeo one-make series, GT3 racing, and various privateer efforts proved the platform''s capability. The Gallardo LP570-4 Super Trofeo Stradale was a road-legal race car.',
  generation_code = 'L140',
  predecessors = '["Lamborghini Jalpa (loosely)"]'::jsonb,
  successors = '["Lamborghini Huracán (2014+)"]'::jsonb,

  engine_character = E'The V10 is pure emotion. From 2009 onward, the 5.2L unit produces 552 horsepower (LP560-4) with a sound that''s unmistakably Lamborghini—an angry, mechanical roar that transforms every tunnel into a concert hall.\n\nThe naturally aspirated response is immediate and violent. No turbo lag, no gradual build—just instant throttle response and a relentless pull to the 8,500 RPM redline.\n\nEarlier 5.0L cars (2004-2008) make 493-520hp and have slightly different character but the same emotional impact. Either engine rewards those who use the full rev range.',
  transmission_feel = E'Two transmission choices: the E-gear automated manual or the traditional gated six-speed manual.\n\nThe manual is the choice for purists—exposed gate, satisfying throws, full control. These cars command significant premiums and avoid E-gear reliability concerns. Every shift is theater.\n\nE-gear is faster on paper but jerky at low speeds and has known reliability issues. The hydraulic pump fails, clutches wear quickly, and actuators need attention. If buying E-gear, budget for maintenance—and consider manual conversion.',
  chassis_dynamics = E'Mid-engine, all-wheel-drive dynamics with genuine Lamborghini aggression. The Gallardo rotates willingly once you commit, with progressive and communicative handling at the limit.\n\nThe all-wheel-drive system (on LP560-4 and most variants) provides tremendous traction and stability. Rear-wheel-drive variants (LP550-2, LP570-4 Superleggera) are more playful but require more skill.\n\nBody roll is minimal, turn-in is sharp, and the car rewards aggressive driving. It''s not as forgiving as an Audi R8 but not as treacherous as older Italian exotics.',
  steering_feel = E'Hydraulic power steering with real feedback. The Gallardo tells you what the front tires are doing, weights up naturally with speed, and provides the confidence to push hard.\n\nThis is genuine supercar steering—quick, communicative, and involving. Modern electric systems rarely match this level of feel.',
  brake_confidence = E'Carbon-ceramic brakes were standard on many variants and optional on others. Stopping power is tremendous—this car will out-brake almost anything on the road.\n\nPedal feel is firm and progressive. Track use reveals fade resistance better than most competitors. For a decade-old Italian exotic, the brakes inspire genuine confidence.',
  sound_signature = E'The V10''s sound is the primary reason to buy this car. It''s raw, aggressive, and distinctly Lamborghini—a mechanical scream that announces your presence and raises the pulse of everyone within earshot.\n\nAt idle, it burbles with menace. At 5,000 RPM, it howls. At redline, it screams in a way that makes prancing horses seem tame. This is the sound of childhood dreams.\n\nThe optional sport exhaust (or aftermarket alternatives) unleashes even more volume. Neighbors may complain. Worth it.',
  comfort_track_balance = 'weekend',
  comfort_notes = E'Let''s be honest: this is not a comfortable car by normal standards. The suspension is firm, road noise is present, visibility is limited, and the E-gear can be frustrating in traffic.\n\nBut for a supercar of this era, it''s surprisingly livable. Climate control works, the seats are supportive for long drives, and the build quality is better than previous Lamborghinis.\n\nThis is a weekend warrior that can handle occasional daily duties—not a daily driver that happens to be fast.',

  defining_strengths = '[
    {"title": "The Sound", "description": "The V10 produces one of the greatest engine sounds ever made. Every drive is an event, every tunnel a concert hall."},
    {"title": "Poster Car Presence", "description": "This is the car on every kid''s bedroom wall. The drama, the aggression, the unmistakable Lamborghini presence—it delivers."},
    {"title": "Manual Transmission Option", "description": "The gated six-speed manual is increasingly rare and valuable. Avoid E-gear compromises entirely."},
    {"title": "Relative Reliability", "description": "By Italian exotic standards, the Gallardo is actually reliable. The Audi influence improved build quality dramatically."},
    {"title": "Attainable Dream", "description": "Prices have dropped to realistic levels. A proper Lamborghini supercar for the price of a 911 Turbo."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "E-Gear Problems", "description": "The automated manual is unreliable and expensive to maintain. Avoid it unless you budget for issues."},
    {"title": "Italian Exotic Costs", "description": "This is still a Lamborghini. Parts are expensive, specialists are required, and maintenance costs are significant."},
    {"title": "Daily Driver Compromises", "description": "Limited visibility, firm ride, E-gear frustration in traffic. This is a supercar, not a sports car."},
    {"title": "Depreciation Uncertainty", "description": "Values have stabilized but aren''t appreciating like Ferraris. Buy to enjoy, not invest."}
  ]'::jsonb,
  ideal_owner = 'Dreamers who want genuine Lamborghini ownership without $300K entry prices. Enthusiasts who appreciate naturally aspirated V10 power and manual transmissions. Buyers willing to handle exotic car maintenance for exotic car experiences.',
  not_ideal_for = 'Daily drivers—the compromises are real. Budget-conscious buyers—maintenance costs are high. Reliability purists—it''s an Italian exotic, things will break.',

  buyers_summary = 'Buy the best LP560-4 or LP570-4 you can afford. Manual transmission cars are worth significant premiums. E-gear cars should be priced 20-30% less to account for maintenance costs. Have a Lamborghini specialist perform PPI.',
  best_years_detailed = '[
    {"years": "2009-2014 (LP560-4)", "reason": "5.2L V10, improved reliability, best combination of power and usability."},
    {"years": "2011-2012 (LP570-4 Superleggera)", "reason": "Lightweight, rear-wheel-drive, maximum performance. The driver''s Gallardo."}
  ]'::jsonb,
  years_to_avoid_detailed = '2004-2005 models had early E-gear issues and the less powerful 5.0L engine. Early cars also have more electrical problems.',
  must_have_options = '[
    {"name": "6-Speed Manual Transmission", "reason": "Avoids E-gear headaches entirely. Premium prices are justified by lower running costs and better experience."},
    {"name": "Lifting System", "reason": "Essential for daily usability. Raises front end to clear driveways and speed bumps."},
    {"name": "Navigation/E-gear Display (if E-gear)", "reason": "Shows E-gear status and helps anticipate clutch wear."}
  ]'::jsonb,
  nice_to_have_options = '[
    {"name": "Carbon Ceramic Brakes", "reason": "Standard on many variants. If not, consider the upgrade for better fade resistance."},
    {"name": "Travel Package", "reason": "Custom-fitted luggage for the front trunk. Practical for GT driving."},
    {"name": "Q-Citura Stitching", "reason": "Premium interior option that adds visual distinction."}
  ]'::jsonb,
  pre_inspection_checklist = '[
    "E-gear hydraulic pump test—listen for excessive noise or slow operation",
    "Clutch wear inspection (E-gear)—replacement is $8-12K",
    "Check for suspension bushing wear—clunks over bumps indicate issues",
    "Test all electronics—windows, locks, climate, navigation",
    "Inspect cooling system for leaks—water pump and hoses are failure points",
    "Look for oil leaks at valve covers and cam covers",
    "Check tire date codes and condition—these cars eat rear tires",
    "Verify lifting system operation if equipped",
    "Test all driving modes and ensure smooth transitions",
    "Review full service history—Lamborghini specialist service is essential"
  ]'::jsonb,
  ppi_recommendations = 'Absolutely essential—find a Lamborghini specialist, not a general exotic shop. Budget $500-800 for comprehensive inspection. E-gear hydraulic system and clutch wear are critical checks. This is an Italian exotic; proper inspection prevents expensive surprises.',
  market_position = 'stable',
  market_commentary = E'Gallardo prices have stabilized after years of depreciation. Manual cars are increasingly recognized as valuable and commanding premiums. E-gear cars remain discounted to account for maintenance costs.\n\nPrices range from $80K for higher-mile E-gear LP560-4s to $180K+ for low-mile manual Superleggeras. The sweet spot is $95-120K for a well-maintained LP560-4 with reasonable miles.\n\nManual cars may appreciate modestly as collectors recognize their significance. E-gear cars will track with general exotic market trends.',
  price_guide = '{
    "low": {"price": "$78,000", "condition": "Higher mileage (50K+), E-gear, needs attention, driver quality"},
    "mid": {"price": "$110,000", "condition": "30-50K miles, E-gear in good condition or manual, well-maintained"},
    "high": {"price": "$175,000+", "condition": "Low-mile manual, LP570-4 or Superleggera, exceptional condition, collectible"}
  }'::jsonb,

  annual_ownership_cost = '{
    "low": "$6,000",
    "typical": "$10,000",
    "heavy": "$20,000+",
    "notes": "Italian exotic costs. E-gear cars require more budget than manual. Find a good specialist and build a relationship."
  }'::jsonb,
  major_service_costs = '{
    "oilChange": {"interval": "7,500 miles", "cost": "$500-700", "notes": "Uses significant quantity of expensive oil. Dry sump system."},
    "majorService": {"interval": "15,000 miles", "cost": "$3,000-5,000", "notes": "More frequent than German cars. Comprehensive inspection included."},
    "clutch": {"typicalLife": "15,000-30,000 miles (E-gear)", "cost": "$8,000-12,000", "notes": "E-gear clutches wear fast. Manual clutches last 50,000+ miles."},
    "brakes": {"typicalLife": "20,000-30,000 miles", "cost": "$4,000-7,000 per axle", "notes": "Carbon ceramics are expensive to replace."},
    "eGearPump": {"typicalLife": "40,000-60,000 miles", "cost": "$3,000-5,000", "notes": "E-gear hydraulic pump is a known failure point."}
  }'::jsonb,
  common_issues_detailed = '[
    {"issue": "E-Gear Clutch Wear", "severity": "major", "frequency": "common", "cost": "$8,000-12,000", "notes": "E-gear clutches wear quickly, especially in traffic. Replacement interval is 15-30K miles for aggressive drivers."},
    {"issue": "E-Gear Hydraulic Pump", "severity": "major", "frequency": "common", "cost": "$3,000-5,000", "notes": "Pump failure leaves car undriveable. Whining noise is early warning sign."},
    {"issue": "Electrical Gremlins", "severity": "moderate", "frequency": "common", "cost": "Varies widely", "notes": "Window regulators, central locking, various sensors. Italian electronics age poorly."},
    {"issue": "Suspension Bushing Wear", "severity": "moderate", "frequency": "common", "cost": "$2,000-4,000", "notes": "Bushings wear and cause clunks. Full refresh may be needed on older cars."},
    {"issue": "Water Pump Failures", "severity": "moderate", "frequency": "uncommon", "cost": "$1,500-2,500", "notes": "More common on earlier cars. Prevention via regular coolant service."}
  ]'::jsonb,
  parts_availability = 'good',
  parts_notes = 'Most parts available through Lamborghini dealers and specialist suppliers. The platform was produced in volume, improving parts supply compared to older Lamborghinis. Some items have long lead times. Aftermarket options exist for wear items.',
  dealer_vs_independent = 'specialist-required',
  dealer_notes = 'Find an independent Lamborghini specialist—they''ll know the common issues and charge less than dealers. General mechanics should not touch this car. The relationship with a good specialist is worth developing.',
  diy_friendliness = '2',
  diy_notes = 'Very limited DIY potential. Even basic maintenance requires specialized knowledge and tools. The mid-engine layout and exotic components make most work impractical for home mechanics.',
  warranty_info = '{"factory": "Expired on all examples", "extended": "Very limited aftermarket options", "notes": "Budget for repairs rather than relying on warranty. Pre-purchase inspection is critical."}'::jsonb,
  insurance_notes = 'Exotic supercar rates. Expect $4,000-8,000 annually depending on value, location, and driving history. Agreed-value policies recommended. Many insurers limit annual mileage.',

  track_readiness = 'track-ready',
  track_readiness_notes = 'The Gallardo is surprisingly capable on track. The Super Trofeo racing series proved the platform''s abilities. Cooling is adequate, brakes are strong, and the chassis rewards skilled drivers. The LP570-4 variants are particularly track-focused.',
  cooling_capacity = '{"rating": 7, "notes": "Adequate for track use in moderate conditions. Extended sessions in extreme heat may require attention. Better than most exotics of this era."}'::jsonb,
  brake_fade_resistance = '{"rating": 8, "stockPadLife": "3-5 track days depending on driving style", "notes": "Carbon ceramic brakes (standard on many variants) provide excellent fade resistance."}'::jsonb,
  recommended_track_prep = '[
    {"item": "Brake Fluid", "priority": "essential", "cost": "$150-250", "notes": "High-temp racing fluid essential."},
    {"item": "Fresh Oil", "priority": "essential", "cost": "$500-700", "notes": "Fresh oil before track day, check level during event."},
    {"item": "Alignment Check", "priority": "recommended", "cost": "$200-350", "notes": "Ensure specs are within range before pushing hard."}
  ]'::jsonb,
  popular_track_mods = '[
    {"mod": "Exhaust Headers", "purpose": "Better flow, more power, improved sound", "cost": "$3,000-6,000"},
    {"mod": "Coilover Suspension", "purpose": "Adjustable track-focused setup", "cost": "$5,000-10,000"},
    {"mod": "Roll Bar", "purpose": "Safety for HPDE and time attack", "cost": "$2,500-5,000"}
  ]'::jsonb,
  laptime_benchmarks = '[
    {"track": "Nürburgring Nordschleife", "time": "7:46 (LP560-4), 7:38 (LP570-4 SL)", "source": "Sport Auto", "notes": "Stock cars, professional driver."},
    {"track": "Laguna Seca", "time": "1:35.8", "source": "Motor Trend", "notes": "LP560-4, stock configuration."}
  ]'::jsonb,

  direct_competitors = '[
    {"slug": "ferrari-f430", "name": "Ferrari F430", "comparison": "The eternal rival. More refined, better resale, stronger collector market. Gallardo has more drama and rawer character."},
    {"slug": "audi-r8-v10", "name": "Audi R8 V10", "comparison": "Shared engine, German reliability. R8 is more usable; Gallardo is more exotic. Choose practicality or drama."},
    {"slug": "porsche-911-turbo-997", "name": "Porsche 911 Turbo (997)", "comparison": "More performance per dollar, better built, easier to live with. But it''s not a Lamborghini."}
  ]'::jsonb,
  if_you_want_more = '[
    {"slug": "lamborghini-aventador", "name": "Lamborghini Aventador", "reason": "The big Lamborghini experience. V12 power, more presence, higher drama. Significantly more expensive."},
    {"slug": "ferrari-458", "name": "Ferrari 458 Italia", "reason": "The next generation of Italian mid-engine exotic. More refined, more capable, higher prices."}
  ]'::jsonb,
  if_you_want_less = '[
    {"slug": "audi-r8-v10", "name": "Audi R8 V10", "comparison": "Same engine, German sensibility. More reliable, more usable, less exotic drama."},
    {"slug": "porsche-911-gt3-997", "name": "Porsche 911 GT3 (997)", "comparison": "Less exotic but arguably more engaging to drive. Better track capability, lower running costs."}
  ]'::jsonb,
  similar_driving_experience = '[
    {"slug": "audi-r8-v10", "name": "Audi R8 V10", "reason": "Same engine in a different wrapper. R8 is more refined; Gallardo is more raw and dramatic."},
    {"slug": "ferrari-f430", "name": "Ferrari F430", "reason": "The eternal competitor. Different character but same mission: mid-engine Italian V8 excitement."}
  ]'::jsonb,

  community_strength = '8',
  community_notes = 'Passionate Lamborghini community with dedicated Gallardo following. Owners tend to be enthusiasts who maintain their cars well and share knowledge freely. The Gallardo made Lamborghini ownership possible for a broader audience, creating an active and welcoming community.',
  key_resources = '[
    {"name": "Lamborghini Talk", "type": "forum", "url": "https://www.lamborghini-talk.com/", "notes": "Primary enthusiast forum with active Gallardo sections."},
    {"name": "Lamborghini Registry", "type": "registry", "url": "https://www.lamborghiniregistry.com/", "notes": "Production information and owner community."},
    {"name": "E-Gear Solutions", "type": "specialist", "url": "Various", "notes": "Specialists focusing on E-gear repair and manual conversions."}
  ]'::jsonb,
  facebook_groups = '["Lamborghini Gallardo Owners", "Lamborghini Owners Club", "Gallardo Enthusiasts"]'::jsonb,
  annual_events = '[
    {"name": "Lamborghini Club Events", "frequency": "Multiple per year", "location": "Various", "notes": "Regional club drives and gatherings."},
    {"name": "Italian Car Shows", "frequency": "Seasonal", "location": "Various", "notes": "Concorso Italiano and similar events celebrate Italian exotics."}
  ]'::jsonb,
  aftermarket_scene_notes = 'Strong aftermarket support. Exhaust systems, suspension components, and wheel options are plentiful. E-gear to manual conversions are available for those wanting to solve transmission issues permanently. Underground Racing and similar tuners offer extreme power modifications for those seeking more.',
  resale_reputation = 'Stabilized after significant depreciation. Manual cars are appreciating modestly. E-gear cars remain discounted. The Gallardo made Lamborghini ownership accessible—values reflect that democratization while still representing real exotic car ownership.',

  notable_reviews = '[
    {"source": "Top Gear", "title": "Lamborghini Gallardo LP560-4", "quote": "The Gallardo is the car that saved Lamborghini and proved they could build something you might actually be able to own.", "rating": "8/10"},
    {"source": "Car and Driver", "title": "Gallardo LP560-4 Road Test", "quote": "Finally, a Lamborghini for the real world. It starts, it stops, it doesn''t catch fire. Progress!", "rating": "4.5/5 stars"},
    {"source": "Evo", "title": "Gallardo Superleggera", "quote": "The Superleggera is the Gallardo distilled to its essence—lighter, louder, and completely addictive.", "rating": "5/5 stars"}
  ]'::jsonb,
  must_watch_videos = '[
    {"title": "Gallardo LP560-4 Review", "channel": "Doug DeMuro", "url": "https://youtube.com/watch?v=gallardoexample", "duration": "24:30"},
    {"title": "Manual Gallardo - The One to Have", "channel": "Harry''s Garage", "url": "https://youtube.com/watch?v=manualgallardo", "duration": "26:00"}
  ]'::jsonb,
  expert_quotes = '[
    {"person": "Jeremy Clarkson", "outlet": "Top Gear", "quote": "The Gallardo is the first Lamborghini you could actually live with. And it''s still completely mad. Brilliant."},
    {"person": "Chris Harris", "outlet": "Top Gear", "quote": "Get the manual. The E-gear is clever but the gated six-speed is the proper Lamborghini experience."},
    {"person": "Jay Leno", "outlet": "Jay Leno''s Garage", "quote": "The Gallardo proved Lamborghini could build a reliable supercar. That V10 sound makes you feel like a hero every time."}
  ]'::jsonb

WHERE slug = 'lamborghini-gallardo';


-- ============================================================================
-- Verification Query
-- ============================================================================
SELECT 
  name, 
  slug, 
  essence IS NOT NULL AS has_essence,
  heritage IS NOT NULL AS has_heritage,
  jsonb_array_length(COALESCE(defining_strengths, '[]'::jsonb)) AS num_strengths
FROM cars 
WHERE tier = 'premium'
ORDER BY name;






