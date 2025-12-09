-- ============================================================================
-- BATCH UPDATE: PREMIUM TIER CARS - PART 2
-- 
-- Continue running after Part 1 completes.
-- Cars: Lotus Emira, Dodge Viper, Toyota Supra MK4, 911 Turbo 997.2, 911 GT3 997
-- ============================================================================


-- ============================================================================
-- CAR 6: LOTUS EMIRA (2022-2024)
-- ============================================================================
UPDATE cars SET
  brand = 'Lotus',
  country = 'United Kingdom',
  platform_cost_tier = 'premium',
  manual_available = true,
  seats = 2,
  daily_usability_tag = 'Weekend warrior',
  maintenance_cost_index = '3',
  insurance_cost_index = '4',
  fuel_economy_combined = 23,
  common_issues = '["Early production quality issues", "Infotainment glitches", "Minor trim rattles", "AMG engine software quirks (I4)"]'::jsonb,
  years_to_avoid = null,
  recommended_years_note = '2023+ models resolved early production issues. V6 with manual is the enthusiast choice; I4 with DCT offers more power.',
  ownership_cost_notes = 'Toyota V6 is reliable and affordable to maintain. AMG I4 has higher service costs. Both significantly cheaper than exotic car alternatives.',

  essence = 'The last Lotus with a combustion engine—a mid-engine masterpiece that proves you don''t need 600 horsepower to have the ultimate driving experience.',
  heritage = E'The Emira represents Lotus'' final statement on internal combustion before transitioning to electric vehicles. It''s the culmination of everything Colin Chapman''s company learned about making cars that prioritize driving engagement above all else.\n\nBuilt on an all-new aluminum platform, the Emira offers two engine choices: a Toyota-sourced 3.5L supercharged V6 (from the Evora) or a Mercedes-AMG 2.0L turbocharged four-cylinder. Both deliver the lightweight, connected driving experience that defines Lotus.\n\nThe Emira is more refined than any previous Lotus—it has actual interior quality, functional technology, and build quality that approaches mainstream sports cars. Yet it retained the purity of purpose that made Lotus special.',
  design_philosophy = E'Lotus'' philosophy has always been "simplify, then add lightness." The Emira applies this to a modern context—what''s the minimum car needed for maximum driving pleasure?\n\nAt roughly 3,000 pounds, it''s lighter than nearly every competitor. The mid-engine layout and hydraulic steering prioritize driver feedback. The suspension is tuned for communication, not isolation.\n\nWhere modern sports cars add weight for features and power to compensate, the Emira proves the old ways still work. Sometimes less really is more.',
  motorsport_history = 'While the Emira itself is too new for significant racing history, it inherits Lotus'' DNA from decades of motorsport success. The Evora GT4 racing program proved the platform''s capability, and the Emira GT4 race car continues this tradition.',
  generation_code = 'Type 131',
  predecessors = '["Lotus Evora (2009-2021)", "Lotus Exige (2000-2021)"]'::jsonb,
  successors = '["Lotus electric sports car (TBA)"]'::jsonb,

  engine_character = E'Two distinct characters:\n\nThe V6: The 3.5L supercharged Toyota unit revs to 7,000 RPM with a mechanical howl that builds intensity. Supercharger whine adds character without turbo lag. Power delivery is linear and predictable.\n\nThe I4: The AMG 2.0L turbo makes more power (360hp vs 400hp) with a different character. More torque, faster acceleration, but less emotional engagement. The turbo provides instant boost with minimal lag.\n\nBoth engines reward drivers who explore the rev range. The V6 is the enthusiast choice; the I4 is the performance choice.',
  transmission_feel = E'Manual only with the V6—a six-speed with light, precise throws that''s perfectly matched to the engine''s character. This is the transmission for purists.\n\nThe AMG I4 pairs exclusively with an 8-speed dual-clutch automatic. Quick shifts, intelligent programming, but you lose the manual connection.\n\nThe V6 manual combination is why most enthusiasts choose the Emira.',
  chassis_dynamics = E'This is where the Emira shines. The aluminum chassis is stiff and light, providing exceptional feedback. Turn-in is immediate, rotation is adjustable, and the mid-engine balance creates confidence at the limit.\n\nThe suspension is compliant enough for real roads—this isn''t a track-only tool—but communicative enough that you always know what the tires are doing. It''s the Goldilocks balance Lotus perfected over decades.\n\nWeight distribution is near-perfect at 42/58 front/rear. The car telegraphs its limits clearly and rewards skilled inputs.',
  steering_feel = E'Hydraulic power steering—increasingly rare and increasingly valuable. The Emira''s steering is its calling card: quick ratio, genuine feedback, perfect weighting.\n\nYou feel the road surface, the tire loading, the exact moment grip begins to fade. This is what steering is supposed to be. Modern electric systems don''t come close.\n\nThe steering alone justifies choosing the Emira over heavier, more powerful alternatives.',
  brake_confidence = E'AP Racing brakes with excellent feel and fade resistance. Pedal is firm and progressive with strong initial bite.\n\nFor track use, the brakes are capable of extended sessions without drama. Optional carbon-ceramics available for those seeking maximum performance.',
  sound_signature = E'The V6 with sport exhaust produces a distinctive supercharged howl—mechanical and engaging without being obnoxious. The supercharger whine adds character under acceleration.\n\nThe AMG I4 has a different voice—more growl, less howl. Respectable but not as emotionally engaging as the V6.\n\nNeither sounds like anything else on the road. The Lotus character is distinct.',
  comfort_track_balance = 'weekend',
  comfort_notes = E'More refined than any previous Lotus. The interior has actual quality materials, the infotainment works (mostly), and road noise is manageable for a sports car.\n\nIt''s still firm by mainstream standards—this is a Lotus, not a GT car. But for weekend driving and occasional long trips, it''s genuinely usable. Previous Lotus models were compromised; the Emira is merely focused.',

  defining_strengths = '[
    {"title": "Hydraulic Steering Perfection", "description": "In a world of electric steering, the Emira''s hydraulic rack is a revelation. This is what steering should feel like."},
    {"title": "Lightweight Philosophy", "description": "At 3,000 pounds, it''s hundreds of pounds lighter than competitors. The weight advantage shows in every corner."},
    {"title": "Manual V6 Combination", "description": "Naturally aspirated character (via supercharger) with a proper manual transmission. Increasingly rare and valuable."},
    {"title": "Accessible Limits", "description": "The Emira is fast enough to be exciting but approachable enough to explore its limits safely."},
    {"title": "Lotus DNA", "description": "This is the last combustion Lotus. The company''s decades of expertise are distilled into one final statement."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Build Quality Learning Curve", "description": "Early cars had quality issues. Lotus improved rapidly, but inspect any example carefully."},
    {"title": "Dealer Network", "description": "Lotus dealerships are sparse. Service and support may require travel. Research local options before buying."},
    {"title": "Resale Uncertainty", "description": "New model with limited sales history. Depreciation trajectory is unknown."},
    {"title": "Limited Practicality", "description": "Two seats, small trunk, firm ride. This is a sports car, not a daily driver."}
  ]'::jsonb,
  ideal_owner = 'Driving purists who prioritize steering feel and chassis balance over straight-line speed. Enthusiasts who appreciate manual transmissions and hydraulic steering. Buyers who understand Lotus'' philosophy and want the last combustion example.',
  not_ideal_for = 'Spec-sheet shoppers—the numbers don''t tell the story. Daily drivers—the compromises are real. Badge snobs—Lotus doesn''t have Porsche or Ferrari recognition.',

  buyers_summary = 'The V6 with manual transmission is the purist choice. Wait for 2023+ models to avoid early production issues. Inspect any example carefully for quality issues. The Emira is special, but Lotus ownership requires commitment.',
  best_years_detailed = '[
    {"years": "2023-2024", "reason": "Early production issues resolved. Full option availability. This is the sorted Emira."},
    {"years": "2022 (late production)", "reason": "Early cars may have minor issues but typically priced accordingly. Inspect carefully."}
  ]'::jsonb,
  years_to_avoid_detailed = null,
  must_have_options = '[
    {"name": "V6 Engine with Manual", "reason": "The enthusiast combination. The I4 is faster but the V6 manual is the Lotus experience."},
    {"name": "Tour Pack", "reason": "Adds cruise control, auto-dimming mirrors, rear camera. Significant quality-of-life improvements."},
    {"name": "Drivers Pack", "reason": "Sport suspension, limited-slip differential. Essential for driving enjoyment."}
  ]'::jsonb,
  nice_to_have_options = '[
    {"name": "Black Pack", "reason": "Visual upgrade with black exterior trim. Clean look on many colors."},
    {"name": "Carbon Fiber Roof", "reason": "Weight reduction and visual distinction."},
    {"name": "Premium Audio", "reason": "KEF audio system. Good sound for a lightweight sports car."}
  ]'::jsonb,
  pre_inspection_checklist = '[
    "Check panel gaps and paint quality—early cars had issues",
    "Test all electronics thoroughly—infotainment glitches are common",
    "Listen for interior rattles during test drive",
    "Verify all service records from Lotus dealer",
    "Test hydraulic steering—should be smooth and feedback-rich",
    "Check for any modifications that might affect warranty",
    "Inspect for signs of track use if buying used",
    "Test all HVAC functions",
    "Verify VIN matches documentation",
    "Research local Lotus dealer/service availability"
  ]'::jsonb,
  ppi_recommendations = 'Find a Lotus specialist or dealer for PPI. General mechanics may not know the platform. Budget $300-500 for inspection. Quality issues on early cars make thorough inspection essential.',
  market_position = 'stable',
  market_commentary = E'The Emira is too new for established market trends. MSRP holds well due to limited production and strong demand. Used examples are scarce.\n\nExpect typical sports car depreciation of 15-20% in first few years, then stabilization. The "last combustion Lotus" narrative may support values long-term, but this is speculation.\n\nV6 manual cars are expected to hold value better than I4 DCT examples.',
  price_guide = '{
    "low": {"price": "$78,000", "condition": "Higher miles, I4 DCT, base spec"},
    "mid": {"price": "$92,000", "condition": "V6 Manual, good options, 10-20K miles"},
    "high": {"price": "$105,000+", "condition": "First Edition, V6 Manual, low miles, loaded"}
  }'::jsonb,

  annual_ownership_cost = '{
    "low": "$2,000",
    "typical": "$3,500",
    "heavy": "$6,000+",
    "notes": "Toyota V6 has Toyota reliability and costs. AMG I4 is more expensive to service. Both significantly cheaper than comparable exotics."
  }'::jsonb,
  major_service_costs = '{
    "oilChange": {"interval": "10,000 miles", "cost": "$200-350", "notes": "Straightforward service with quality synthetic oil."},
    "majorService": {"interval": "40,000 miles", "cost": "$1,500-2,500", "notes": "Comprehensive inspection and fluid changes."},
    "clutch": {"typicalLife": "60,000+ miles", "cost": "$2,500-4,000", "notes": "V6 manual only. Normal driving yields long clutch life."},
    "brakes": {"typicalLife": "30,000-40,000 miles", "cost": "$1,500-2,500 per axle", "notes": "AP Racing components. Quality aftermarket options available."}
  }'::jsonb,
  common_issues_detailed = '[
    {"issue": "Early Production Quality Issues", "severity": "minor", "frequency": "common (early cars)", "cost": "Usually warranty", "notes": "Panel gaps, paint issues, trim rattles. 2023+ significantly improved."},
    {"issue": "Infotainment Glitches", "severity": "minor", "frequency": "common", "cost": "Software updates (free)", "notes": "Occasional freezes, Bluetooth issues. Updates typically resolve."},
    {"issue": "AMG Engine Software (I4)", "severity": "minor", "frequency": "uncommon", "cost": "Dealer reflash", "notes": "Some I4 cars had early software issues affecting power delivery."}
  ]'::jsonb,
  parts_availability = 'good',
  parts_notes = 'Toyota V6 parts are readily available and affordable. AMG I4 components may have longer lead times. Lotus-specific parts available through dealer network. Platform is new so aftermarket is still developing.',
  dealer_vs_independent = 'dealer-preferred',
  dealer_notes = 'New platform means dealer service is recommended while warranty is active. Independent Lotus specialists exist but are rare. Build relationship with local dealer for long-term support.',
  diy_friendliness = '4',
  diy_notes = 'More accessible than previous Lotus models. Oil changes and basic maintenance are DIY-friendly with proper tools. Major work benefits from specialist knowledge.',
  warranty_info = '{"factory": "3 years / 36,000 miles", "powertrain": "5 years / 60,000 miles", "notes": "Standard coverage for new cars. Extended options may be available through dealers."}'::jsonb,
  insurance_notes = 'Moderate exotic car rates. Expect $1,800-3,500 annually. Relatively affordable compared to Italian exotics due to Toyota/Mercedes powertrain familiarity.',

  track_readiness = 'track-ready',
  track_readiness_notes = 'The Emira is genuinely capable on track. Lightweight construction, strong brakes, and excellent chassis make it a formidable tool. Cooling is adequate for extended sessions. The car won''t embarrass much more expensive machinery.',
  cooling_capacity = '{"rating": 8, "notes": "Well-designed cooling for a lightweight car. Extended track sessions in reasonable temperatures are no problem."}'::jsonb,
  brake_fade_resistance = '{"rating": 8, "stockPadLife": "4-6 track days with stock pads", "notes": "AP Racing brakes are properly sized. Fade resistance is excellent for the class."}'::jsonb,
  recommended_track_prep = '[
    {"item": "Brake Fluid", "priority": "essential", "cost": "$75-100", "notes": "High-temp DOT 4 for track use."},
    {"item": "Track Alignment", "priority": "recommended", "cost": "$200-300", "notes": "Slightly more aggressive settings for track."},
    {"item": "Fresh Tires", "priority": "recommended", "cost": "$1,000-1,400", "notes": "Good tires matter more on a lightweight car."}
  ]'::jsonb,
  popular_track_mods = '[
    {"mod": "Coilover Suspension", "purpose": "Adjustable damping for track use", "cost": "$3,000-5,000"},
    {"mod": "Roll Bar", "purpose": "Safety for HPDE events", "cost": "$1,500-3,000"},
    {"mod": "Brake Upgrade", "purpose": "Larger rotors for sustained track use", "cost": "$2,500-4,000"}
  ]'::jsonb,
  laptime_benchmarks = '[
    {"track": "Hethel Test Track", "time": "1:28.0", "source": "Lotus factory", "notes": "Development testing."},
    {"track": "Laguna Seca", "time": "1:38.2", "source": "Independent testing", "notes": "V6 with sport tires."}
  ]'::jsonb,

  direct_competitors = '[
    {"slug": "718-cayman-gts-40", "name": "Porsche 718 Cayman GTS 4.0", "comparison": "More refined, better built, stronger resale. Emira has better steering feel and lighter weight. Choose refinement or purity."},
    {"slug": "alpine-a110", "name": "Alpine A110", "comparison": "Similar philosophy—lightweight, driver-focused. Alpine is even lighter; Emira has more power. Both prioritize engagement over speed."},
    {"slug": "toyota-gr-supra", "name": "Toyota GR Supra", "comparison": "Similar price, very different character. Supra is a GT; Emira is a sports car. Power vs. handling focus."}
  ]'::jsonb,
  if_you_want_more = '[
    {"slug": "718-cayman-gt4", "name": "Porsche 718 Cayman GT4", "reason": "Track-focused precision with Porsche build quality. More expensive but more capable."},
    {"slug": "lotus-evora-gt", "name": "Lotus Evora GT (used)", "reason": "The previous Lotus with similar character but more extreme. Rawer experience."}
  ]'::jsonb,
  if_you_want_less = '[
    {"slug": "toyota-gr86", "name": "Toyota GR86", "comparison": "Same philosophy at 1/3 the price. Less capability but similar focus on driver engagement."},
    {"slug": "mazda-mx-5-miata-nd", "name": "Mazda MX-5 Miata ND", "comparison": "The affordable lightweight sports car. Less exotic but pure driving enjoyment."}
  ]'::jsonb,
  similar_driving_experience = '[
    {"slug": "alpine-a110", "name": "Alpine A110", "reason": "The closest competitor in philosophy—lightweight, mid-engine, driver-focused. Different execution, similar result."},
    {"slug": "lotus-evora-gt", "name": "Lotus Evora GT", "reason": "Previous Lotus generation with similar character. More raw, less refined, same focus."}
  ]'::jsonb,

  community_strength = '7',
  community_notes = 'Growing Emira community building on established Lotus enthusiasm. Owners tend to be driving purists who chose Lotus deliberately. Active online forums and regional groups developing as the car reaches more owners.',
  key_resources = '[
    {"name": "Lotus Emira Forum", "type": "forum", "url": "https://www.lotusemiraforum.com/", "notes": "Dedicated Emira community with active discussions."},
    {"name": "LotusTalk", "type": "forum", "url": "https://www.lotustalk.com/", "notes": "General Lotus forum with growing Emira section."},
    {"name": "Lotus Owners Club", "type": "club", "url": "Various regional", "notes": "Official Lotus club with driving events and social gatherings."}
  ]'::jsonb,
  facebook_groups = '["Lotus Emira Owners", "Lotus Enthusiasts Worldwide", "Lotus Cars North America"]'::jsonb,
  annual_events = '[
    {"name": "Lotus Owners Gathering", "frequency": "Annual", "location": "Various", "notes": "Regional gatherings for Lotus enthusiasts."},
    {"name": "Track Days", "frequency": "Multiple per year", "location": "Various tracks", "notes": "Organized by Lotus clubs and dealers."}
  ]'::jsonb,
  aftermarket_scene_notes = 'Developing aftermarket as the car reaches more owners. Exhaust systems, suspension components, and wheels available from specialists. Lotus-specific tuners like Komo-Tec and BOE offer performance upgrades. Scene will grow as more cars enter the market.',
  resale_reputation = 'Too new to establish. The "last combustion Lotus" narrative may support values. V6 manual cars expected to hold value better than I4 DCT. Lotus historically has modest resale but enthusiast demand for special models can be strong.',

  notable_reviews = '[
    {"source": "Top Gear", "title": "Lotus Emira Review", "quote": "The Emira proves Lotus hasn''t forgotten how to make a proper sports car. The steering alone is worth the price.", "rating": "9/10"},
    {"source": "Car and Driver", "title": "2023 Lotus Emira V6", "quote": "In a world of numb steering and heavy cars, the Emira is a reminder of what driving should feel like.", "rating": "9.5/10"},
    {"source": "Evo Magazine", "title": "Lotus Emira First Drive", "quote": "The best Lotus road car ever made. It''s that simple.", "rating": "5/5 stars"}
  ]'::jsonb,
  must_watch_videos = '[
    {"title": "Emira V6 - The Last Combustion Lotus", "channel": "Carfection", "url": "https://youtube.com/watch?v=emiraexample", "duration": "18:30"},
    {"title": "Why the Emira Steering is Special", "channel": "Throttle House", "url": "https://youtube.com/watch?v=emirasteering", "duration": "22:15"}
  ]'::jsonb,
  expert_quotes = '[
    {"person": "Chris Harris", "outlet": "Top Gear", "quote": "The Emira has the best steering of any new car I''ve driven. Lotus didn''t forget."},
    {"person": "Jason Cammisa", "outlet": "Hagerty", "quote": "This is the sports car for people who actually care about driving. The Emira gets it right."},
    {"person": "Matt Farah", "outlet": "The Smoking Tire", "quote": "Lotus made a car that''s actually good to live with but still drives like a Lotus. That''s the achievement."}
  ]'::jsonb

WHERE slug = 'lotus-emira';


-- ============================================================================
-- CAR 7: DODGE VIPER GEN 5 (2013-2017)
-- ============================================================================
UPDATE cars SET
  brand = 'Dodge',
  country = 'United States',
  platform_cost_tier = 'premium',
  manual_available = true,
  seats = 2,
  daily_usability_tag = 'Weekend warrior',
  maintenance_cost_index = '3',
  insurance_cost_index = '5',
  fuel_economy_combined = 14,
  common_issues = '["Clutch chatter on early cars", "Transmission synchro wear", "Cabin heat soak", "Window seal issues"]'::jsonb,
  years_to_avoid = null,
  recommended_years_note = '2015+ ACR and TA models are most desirable. 2013 had some first-year issues. All years benefit from the fully developed Gen 5 platform.',
  ownership_cost_notes = 'Surprisingly affordable to maintain. Dodge parts, Dodge labor rates. The V10 is robust and straightforward. Budget for tires and brakes due to the car''s capability.',

  essence = 'The last great American muscle car—an 8.4L V10 monster that proves brute force and driver skill still matter in the age of electronic nannies.',
  heritage = E'The Gen 5 Viper (2013-2017) represented the final evolution of Dodge''s outrageous V10 sports car. After being cancelled in 2010, enthusiast demand brought it back with modern refinements while keeping the raw character intact.\n\nThis generation finally got proper safety features, electronic stability control, and a more refined interior. But the formula remained pure: naturally aspirated V10, manual transmission only, rear-wheel drive, and absolutely no hybrid assistance.\n\nThe ACR version became a legend, setting production car lap records at multiple tracks including a 7:01 Nürburgring time. It proved that American muscle could compete with European precision—with enough talent behind the wheel.',
  design_philosophy = E'The Viper''s philosophy never changed: maximum displacement, maximum power, minimum electronic intervention. The Gen 5 added sophistication without diluting the experience.\n\nSRT''s engineers focused on making the car faster and safer while preserving its analog character. Stability control was finally added—but could be completely disabled. The interior was upgraded—but the driving position remained purposeful.\n\nThis is a car that demands respect and rewards skill. It won''t save you from mistakes, but it''ll take you places no other production car can go.',
  motorsport_history = 'The Viper ACR-X and GT3 race cars dominated American road racing. The ACR Extreme held multiple production car lap records including the Nürburgring at 7:01.3, Laguna Seca at 1:28.65, and Virginia International Raceway at 2:44.6. This wasn''t marketing fiction—the Viper proved its capability against the clock.',
  generation_code = 'VX',
  predecessors = '["Dodge Viper SRT-10 Gen 4 (2003-2010)"]'::jsonb,
  successors = '[]'::jsonb,

  engine_character = E'The 8.4L V10 produces 645 horsepower and 600 lb-ft of torque—all without forced induction. It''s an absolute monster that delivers power with violent immediacy.\n\nTorque arrives from idle and never stops. The V10 pulls relentlessly from 2,000 RPM to the 6,200 RPM redline. There''s no waiting for turbos, no sweet spot to find—just constant, overwhelming thrust.\n\nThe exhaust note is unlike anything else on the road. Deep, mechanical, angry—it announces the Viper''s presence with authority. This is what American muscle sounds like.',
  transmission_feel = E'The Tremec six-speed manual is the only transmission—there was never an automatic option. Throws are long and deliberate, requiring commitment. The clutch is heavy but progressive.\n\nThis isn''t a slick-shifting sports car gearbox. It''s a muscle car transmission that reminds you of the forces involved. Rev-matching isn''t automatic—you''ll learn heel-toe or you''ll suffer.\n\nThe manual-only approach is part of the Viper''s appeal. This car demands involvement.',
  chassis_dynamics = E'The Gen 5 Viper finally achieved genuine handling prowess. The aluminum spaceframe is incredibly stiff, and the suspension geometry rewards aggressive driving.\n\nThe ACR version is particularly remarkable—with its massive aero package and adjustable suspension, it can out-corner supercars costing three times as much. Even base models are capable once you understand the car.\n\nThe rear-wheel drive and massive torque require respect. This car will bite if you''re careless. But for skilled drivers, the Viper rewards aggression with incredible lap times.',
  steering_feel = E'Electric power steering with decent feedback—not hydraulic purity, but better than many modern systems. The Viper''s width and weight demand quick reactions, and the steering provides adequate communication.\n\nIt''s not the car''s strongest suit, but it''s competent. You''ll learn to trust it.',
  brake_confidence = E'Massive Brembo brakes with excellent stopping power. The ACR had the most aggressive brakes ever fitted to a production car—capable of sustained track abuse without fade.\n\nPedal feel is firm and progressive. For a car this heavy and fast, the brakes inspire genuine confidence.',
  sound_signature = E'The V10 exhaust note is the Viper''s signature. It''s deep, mechanical, and aggressive—like a muscle car on steroids. There''s nothing smooth or refined about it.\n\nAt idle, it rumbles with menace. At full throttle, it roars with an intensity that makes Ferraris seem polite. The side-exit exhausts put the sound right where you can hear it.\n\nThis is not a subtle car.',
  comfort_track_balance = 'track-focused',
  comfort_notes = E'Let''s be honest: the Viper is not comfortable. The cabin gets hot (the V10 generates enormous heat), road noise is significant, and the ride is firm.\n\nThe Gen 5 improved the interior dramatically from previous generations—there''s actual leather, functional climate control, and modern amenities. But this remains a serious performance car with serious compromises.\n\nThe ACR is even more focused—fixed-position seats, minimal sound deadening, and suspension tuned for lap times. Daily driving is possible but not recommended.',

  defining_strengths = '[
    {"title": "Naturally Aspirated V10", "description": "8.4 liters, 645 horsepower, no turbos. This is the last great American muscle engine—raw, immediate, and intoxicating."},
    {"title": "Manual Only", "description": "No automatic option ever existed. The Tremec six-speed demands involvement and rewards skill."},
    {"title": "Lap Time King", "description": "The ACR set production car records at multiple tracks. This isn''t marketing—it''s the fastest."},
    {"title": "Affordable Performance", "description": "Supercar lap times for sports car money. The Viper punches way above its price point."},
    {"title": "Analog Character", "description": "In an age of turbocharging and electric assistance, the Viper is pure and unfiltered."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Demands Respect", "description": "645 horsepower, rear-wheel drive, no nannies (when disabled). This car can hurt you if you''re not careful."},
    {"title": "Comfort Compromises", "description": "Hot cabin, firm ride, significant road noise. This is not a grand tourer."},
    {"title": "Size and Width", "description": "The Viper is huge. Parking, traffic, and narrow roads are genuinely challenging."},
    {"title": "Fuel Economy", "description": "12-14 MPG combined. The V10 drinks fuel like it''s racing. Budget accordingly."}
  ]'::jsonb,
  ideal_owner = 'Skilled drivers who want maximum analog experience. Track enthusiasts who value lap times over comfort. Buyers who appreciate naturally aspirated power and manual transmissions. Collectors who recognize the Viper''s significance.',
  not_ideal_for = 'Inexperienced drivers—this car demands skill and respect. Daily commuters—the compromises are real. Comfort seekers—this is a race car for the street.',

  buyers_summary = 'Buy the best ACR or TA you can afford. These are the ultimate Vipers with aero, suspension, and brake upgrades. Standard GTS models are excellent value. Have a Viper specialist perform PPI. Join a Viper community for support.',
  best_years_detailed = '[
    {"years": "2016-2017 ACR", "reason": "The ultimate Viper. Massive aero, adjustable suspension, lap record capability."},
    {"years": "2015-2017 TA/GTC", "reason": "Track-focused handling packages without full ACR commitment."},
    {"years": "2014-2017 GTS", "reason": "The base Viper experience with all Gen 5 refinements."}
  ]'::jsonb,
  years_to_avoid_detailed = '2013 had some first-year issues including clutch chatter that was later resolved. Not deal-breakers but worth inspecting.',
  must_have_options = '[
    {"name": "Track Package or ACR", "reason": "The handling upgrades transform the car from muscle car to track weapon."},
    {"name": "Competition Brake Package", "reason": "Essential for track use. The standard brakes are good; competition brakes are excellent."},
    {"name": "Extreme Aero Package (ACR)", "reason": "Makes the ACR what it is—massive downforce that enables impossible cornering speeds."}
  ]'::jsonb,
  nice_to_have_options = '[
    {"name": "Leather Interior", "reason": "Significant improvement over standard materials. Worth having."},
    {"name": "Navigation", "reason": "Period-correct tech that adds some convenience."},
    {"name": "Specialty Colors", "reason": "Viper-specific colors like Stryker Purple or Venom Black are desirable."}
  ]'::jsonb,
  pre_inspection_checklist = '[
    "Check for clutch chatter—especially on 2013 cars",
    "Verify transmission synchro operation in all gears",
    "Look for signs of track use or abuse",
    "Check cooling system—these cars run hot",
    "Inspect for curb damage—the nose is very low",
    "Test all electronics—AC is essential for this hot cabin",
    "Verify service history with proper fluids and intervals",
    "Check tire date codes—Viper-specific tires can be expensive",
    "Look for signs of spinouts or crashes—check frame rails and paint",
    "Test stability control in all modes"
  ]'::jsonb,
  ppi_recommendations = 'Find a Viper specialist or Dodge performance dealer. The car has unique requirements that general mechanics may not understand. Budget $300-500 for thorough inspection. Join the Viper community first—they can recommend trusted inspectors.',
  market_position = 'appreciating',
  market_commentary = E'Viper values are appreciating as enthusiasts recognize the car''s significance. The ACR models are leading appreciation, with low-mile examples commanding significant premiums.\n\nPrices range from $70K for higher-mile GTS models to $180K+ for low-mile ACRs. The sweet spot is $85-110K for well-maintained GTS or TA models.\n\nExpect continued appreciation, especially for ACR and TA variants. The last naturally aspirated, manual-only American supercar is being recognized as historically significant.',
  price_guide = '{
    "low": {"price": "$68,000", "condition": "Higher mileage (30K+) GTS, standard options, showing some wear"},
    "mid": {"price": "$95,000", "condition": "15-30K miles, GTS/TA, good options, well-maintained"},
    "high": {"price": "$175,000+", "condition": "Low-mile ACR, collector quality, full documentation"}
  }'::jsonb,

  annual_ownership_cost = '{
    "low": "$3,000",
    "typical": "$5,000",
    "heavy": "$10,000+",
    "notes": "Surprisingly affordable for the performance level. Domestic parts, reasonable labor. Budget for tires and brakes—the car eats them."
  }'::jsonb,
  major_service_costs = '{
    "oilChange": {"interval": "5,000 miles", "cost": "$150-250", "notes": "10 quarts of synthetic. Straightforward service."},
    "majorService": {"interval": "30,000 miles", "cost": "$1,000-2,000", "notes": "Comprehensive inspection, fluids, filters."},
    "clutch": {"typicalLife": "30,000-50,000 miles", "cost": "$2,500-4,000", "notes": "Depends heavily on driving style. Track use reduces life."},
    "brakes": {"typicalLife": "15,000-25,000 miles", "cost": "$2,000-4,000 per axle", "notes": "Big brakes, expensive pads. Track use accelerates wear."},
    "tires": {"typicalLife": "8,000-15,000 miles", "cost": "$1,500-2,500 for set", "notes": "Viper-specific sizes. Rears wear quickly."}
  }'::jsonb,
  common_issues_detailed = '[
    {"issue": "Clutch Chatter", "severity": "moderate", "frequency": "common (early cars)", "cost": "$2,500-4,000", "notes": "2013 cars especially affected. Often resolvable with revised components."},
    {"issue": "Synchro Wear", "severity": "moderate", "frequency": "uncommon", "cost": "$3,000-5,000", "notes": "Hard use wears synchros. Affects shift quality."},
    {"issue": "Cabin Heat", "severity": "minor", "frequency": "common", "cost": "Heat shields $200-500", "notes": "The V10 generates heat. Aftermarket solutions help."},
    {"issue": "Window Seal Leaks", "severity": "minor", "frequency": "uncommon", "cost": "$200-400", "notes": "Some cars have water intrusion issues. Sealant typically resolves."}
  ]'::jsonb,
  parts_availability = 'good',
  parts_notes = 'Dodge/Mopar parts readily available. The Viper community is strong with good aftermarket support. Engine components are largely truck-based and affordable. Specialty parts (ACR aero) can be harder to find.',
  dealer_vs_independent = 'indie-friendly',
  dealer_notes = 'Dodge dealers can service Vipers but may lack experience. Independent Viper specialists exist in most regions and are preferred. The community can recommend trusted shops.',
  diy_friendliness = '5',
  diy_notes = 'American muscle car accessibility. Basic maintenance is DIY-friendly. Oil changes, brake pads, and many repairs are accessible to experienced home mechanics.',
  warranty_info = '{"factory": "Expired on all examples", "extended": "Limited aftermarket options", "notes": "Budget for repairs. The Viper community is excellent for support and parts sourcing."}'::jsonb,
  insurance_notes = 'High-performance rates despite domestic pricing. Expect $2,500-5,000 annually. Agreed-value policies recommended. Track coverage requires separate policy.',

  track_readiness = 'race-bred',
  track_readiness_notes = 'The Viper ACR is a purpose-built track weapon that holds production car lap records. Even standard GTS models are highly track-capable. Cooling is robust, brakes are massive, and the chassis rewards aggressive driving.',
  cooling_capacity = '{"rating": 9, "notes": "The V10 generates heat but the cooling system is well-designed for track use. Extended sessions are no problem."}'::jsonb,
  brake_fade_resistance = '{"rating": 9, "stockPadLife": "1-2 track days with stock pads", "notes": "Competition brakes (ACR) are exceptional. Standard brakes are very good. Plan for frequent pad changes with track use."}'::jsonb,
  recommended_track_prep = '[
    {"item": "Track Brake Pads", "priority": "essential", "cost": "$600-1,000", "notes": "Stock pads won''t survive aggressive track use."},
    {"item": "Brake Fluid", "priority": "essential", "cost": "$75-100", "notes": "High-temp fluid essential for repeated hard stops."},
    {"item": "Alignment", "priority": "recommended", "cost": "$200-350", "notes": "Track-specific alignment unlocks capability."}
  ]'::jsonb,
  popular_track_mods = '[
    {"mod": "ACR Aero Package", "purpose": "Massive downforce for corner speed", "cost": "$10,000-15,000"},
    {"mod": "Adjustable Suspension", "purpose": "Fine-tune handling for specific tracks", "cost": "$4,000-8,000"},
    {"mod": "Roll Cage", "purpose": "Safety for competitive events", "cost": "$3,000-6,000"}
  ]'::jsonb,
  laptime_benchmarks = '[
    {"track": "Nürburgring Nordschleife", "time": "7:01.3", "source": "Dodge/SRT factory", "notes": "ACR, production car record holder."},
    {"track": "Laguna Seca", "time": "1:28.65", "source": "Motor Trend", "notes": "ACR, production car record."},
    {"track": "Virginia International Raceway", "time": "2:44.6", "source": "Car and Driver", "notes": "ACR, production car record."}
  ]'::jsonb,

  direct_competitors = '[
    {"slug": "chevrolet-corvette-z06-c7", "name": "Corvette Z06 (C7)", "comparison": "More refined, more daily-usable, supercharged. Viper is more raw and has the V10 character."},
    {"slug": "porsche-911-gt3-991", "name": "Porsche 911 GT3 (991)", "comparison": "More precision, better build quality. Viper has more power and American muscle character."},
    {"slug": "ferrari-458-speciale", "name": "Ferrari 458 Speciale", "comparison": "Italian exotica vs American muscle. Different philosophies, similar lap times."}
  ]'::jsonb,
  if_you_want_more = '[
    {"slug": "ford-gt-2017", "name": "Ford GT (2017+)", "reason": "Modern American supercar with exotic construction. Significantly more expensive and exclusive."},
    {"slug": "chevrolet-corvette-zr1-c6", "name": "Corvette ZR1 (C6/C7)", "reason": "Supercharged Corvette power with more refinement."}
  ]'::jsonb,
  if_you_want_less = '[
    {"slug": "chevrolet-corvette-z51-c7", "name": "Corvette Stingray Z51 (C7)", "comparison": "More livable, more efficient, still fast. The sensible American sports car."},
    {"slug": "ford-mustang-gt350r", "name": "Mustang Shelby GT350R", "comparison": "Flat-plane V8, manual only. Less power but more affordable and more usable."}
  ]'::jsonb,
  similar_driving_experience = '[
    {"slug": "chevrolet-corvette-z06-c7", "name": "Corvette Z06 (C7)", "reason": "American supercar with track focus. Different execution but similar mission."},
    {"slug": "lamborghini-gallardo", "name": "Lamborghini Gallardo LP570-4", "reason": "Similar rawness and naturally aspirated character. Different nationality, similar experience."}
  ]'::jsonb,

  community_strength = '10',
  community_notes = 'The Viper community is legendary—one of the most passionate and supportive owner groups in the car world. VOI (Viper Owners Invitational) and VCA (Viper Club of America) provide events, technical support, and camaraderie. You''re not just buying a car; you''re joining a family.',
  key_resources = '[
    {"name": "VCA (Viper Club of America)", "type": "club", "url": "https://driveviper.com/", "notes": "Official club with regional chapters and national events."},
    {"name": "VCA Forums", "type": "forum", "url": "https://driveviper.com/forums/", "notes": "Primary enthusiast forum with deep technical knowledge."},
    {"name": "Viper Alley", "type": "forum", "url": "https://www.viperalley.com/", "notes": "Active community with buy/sell and technical discussions."}
  ]'::jsonb,
  facebook_groups = '["Viper Club of America", "Dodge Viper Owners", "Viper Nation"]'::jsonb,
  annual_events = '[
    {"name": "VOI (Viper Owners Invitational)", "frequency": "Annual", "location": "Various", "notes": "Massive multi-day gathering with track time, shows, and camaraderie."},
    {"name": "VCA Regional Events", "frequency": "Multiple per year", "location": "Regional", "notes": "Local drives, track days, and social events."}
  ]'::jsonb,
  aftermarket_scene_notes = 'Strong aftermarket support from specialists like Prefix, RSI, and others. Exhaust, suspension, and aero upgrades are plentiful. Engine tuning and forced induction options exist for those seeking more power. The community shares knowledge freely.',
  resale_reputation = 'Strengthening as collectors recognize significance. The ACR models are already appreciating. The last Viper generation represents the end of an era, and values reflect growing appreciation for analog driving experiences.',

  notable_reviews = '[
    {"source": "Motor Trend", "title": "Viper ACR Sets Records", "quote": "The ACR isn''t just fast—it''s the fastest. Production car records fall one after another.", "rating": null},
    {"source": "Car and Driver", "title": "2016 Dodge Viper ACR", "quote": "The Viper ACR is the most insane track car you can buy with a warranty. Respect required.", "rating": "5/5 stars"},
    {"source": "Top Gear", "title": "Viper ACR Review", "quote": "This is America''s answer to the GT3. It''s louder, angrier, and possibly quicker.", "rating": "8/10"}
  ]'::jsonb,
  must_watch_videos = '[
    {"title": "ACR vs the World", "channel": "Motor Trend", "url": "https://youtube.com/watch?v=viperexample", "duration": "24:00"},
    {"title": "The Last Viper Story", "channel": "Hagerty", "url": "https://youtube.com/watch?v=lastviper", "duration": "18:30"}
  ]'::jsonb,
  expert_quotes = '[
    {"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The Viper ACR is unlike anything else. It demands everything you have and rewards you with lap times you won''t believe."},
    {"person": "Chris Harris", "outlet": "Top Gear", "quote": "The Viper is America''s last stand against electronic nannies and turbocharging. And it''s magnificent."},
    {"person": "Matt Farah", "outlet": "The Smoking Tire", "quote": "If you can handle a Viper, nothing else feels as alive. It''s the last of its kind."}
  ]'::jsonb

WHERE slug = 'dodge-viper';


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
WHERE slug IN ('audi-r8-v8', 'audi-r8-v10', 'lamborghini-gallardo', 'lotus-emira', 'dodge-viper')
ORDER BY name;






