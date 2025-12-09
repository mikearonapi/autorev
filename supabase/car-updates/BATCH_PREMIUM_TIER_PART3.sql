-- ============================================================================
-- BATCH UPDATE: PREMIUM TIER CARS - PART 3 (FINAL)
-- 
-- Final Premium tier cars: Toyota Supra MK4, 911 Turbo 997.2, 911 GT3 997
-- ============================================================================


-- ============================================================================
-- CAR 8: TOYOTA SUPRA MK4 TURBO (1993-2002)
-- ============================================================================
UPDATE cars SET
  brand = 'Toyota',
  country = 'Japan',
  platform_cost_tier = 'premium',
  manual_available = true,
  seats = 4,
  daily_usability_tag = 'Capable daily',
  maintenance_cost_index = '3',
  insurance_cost_index = '5',
  fuel_economy_combined = 18,
  common_issues = '["Fuel injector failures", "Differential wear", "Cooling system age-related failures", "T-top seal leaks", "Automatic transmission issues"]'::jsonb,
  years_to_avoid = null,
  recommended_years_note = '1994-1996 are most desirable. 6-speed manual is essential—automatic cars are significantly less valuable. All years benefit from the legendary 2JZ engine.',
  ownership_cost_notes = 'Toyota reliability means reasonable maintenance costs. The 2JZ engine is bulletproof with proper care. Budget has shifted to purchase price—clean examples are expensive.',

  essence = 'The Japanese legend that defined a generation—a 2JZ-powered icon that proved twin turbos and Toyota engineering could rival anything from Germany or Italy.',
  heritage = E'The MK4 Supra is Japan''s most iconic sports car and arguably the most famous Japanese car of all time. Powered by the legendary 2JZ-GTE twin-turbo inline-six, it combined Toyota reliability with genuine supercar performance.\n\nWhen introduced in 1993, the twin-turbo Supra produced 320 horsepower (Japan claimed)—actually closer to 280 at the crank with 320+ at the wheels according to many dyno tests. The engine was famously overbuilt, capable of handling 1,000+ horsepower with basic modifications.\n\nFast & Furious launched the Supra into cultural immortality, but enthusiasts already knew what they had. The combination of bulletproof engineering, stunning capability, and endless modification potential made it legendary. Production ended in 2002, and values have never stopped climbing.',
  design_philosophy = E'Toyota''s engineers designed the A80 Supra to compete with Porsche and Ferrari. They succeeded by applying Japanese engineering discipline to supercar performance targets.\n\nThe 2JZ engine was massively overengineered—cast iron block, forged internals, efficient twin-turbo setup. It could handle double its stock power with stock internals. This wasn''t accidental; Toyota built in headroom for evolution.\n\nThe chassis was equally competent: perfect 53/47 weight distribution, double-wishbone suspension all around, and Getrag six-speed manual transmission. It was designed for the autobahn, built to Toyota standards.',
  motorsport_history = 'The Supra dominated JGTC (Japanese GT Championship) throughout the 1990s and early 2000s. In drag racing, 2JZ-powered cars have set countless records. The engine''s reliability under extreme stress made it the tuner''s choice worldwide.',
  generation_code = 'A80/JZA80',
  predecessors = '["Toyota Supra MK3 A70 (1986-1993)"]'::jsonb,
  successors = '["Toyota GR Supra A90 (2019+)"]'::jsonb,

  engine_character = E'The 2JZ-GTE is an engineering marvel. The twin-turbo inline-six builds power progressively with virtually no lag, pulling strong from 3,000 RPM and screaming to the 6,800 RPM redline.\n\nStock, it makes somewhere between 280-320 horsepower depending on whose numbers you believe. More importantly, it''s capable of 1,000+ horsepower with bolt-on modifications and basic internal work. The bottom end is essentially unbreakable.\n\nThe power delivery is smooth and relentless—very different from peaky import competitors. It feels like a well-engineered machine rather than a high-strung race engine.',
  transmission_feel = E'The Getrag V160 six-speed manual is strong enough to handle serious power and smooth enough for daily driving. Shifts are precise with medium throws and a satisfying mechanical engagement.\n\nThe automatic (W58) should be avoided—it can''t handle significant power increases and lacks the engagement that makes the Supra special. Manual cars command massive premiums and are the only choice for enthusiasts.\n\nThe clutch is heavy by modern standards but progressive and communicative.',
  chassis_dynamics = E'The Supra''s chassis is often overlooked amid the engine worship, but it''s genuinely excellent. Double-wishbone suspension all around provides precise geometry and excellent feedback.\n\nWeight distribution is nearly perfect at 53/47. The car rotates willingly with throttle lift and can be balanced through corners with subtle inputs. It''s not as raw as a 911, but it''s more communicative than most GTs.\n\nThe car is large and heavy (3,400+ lbs) but never feels clumsy. It''s a grand tourer that can embarrass sports cars when pushed.',
  steering_feel = E'Hydraulic power steering with good feedback. Not the razor-sharp communication of a Lotus, but appropriate for the GT character. You know what the front tires are doing.\n\nThe steering is one area where age shows—bushings wear and introduce slack. Refreshed examples feel significantly better than neglected ones.',
  brake_confidence = E'Stock brakes are adequate for street driving but show their age on track. The car is heavy and fast—brake upgrades are common for track use.\n\nPedal feel is firm and progressive. For street driving, stock brakes are fine with quality pads.',
  sound_signature = E'The 2JZ has a distinctive turbo inline-six sound—smooth, mechanical, with turbo whistle and blow-off valve sounds that defined a generation of import culture.\n\nStock exhaust is quiet. Most examples have aftermarket systems that range from subtle to obnoxious. A quality exhaust reveals the engine''s character without being antisocial.\n\nThis is what turbocharged performance sounded like before twin-scroll sophistication made everything sound similar.',
  comfort_track_balance = 'daily',
  comfort_notes = E'The Supra is genuinely comfortable for a performance car. The seats are supportive for long drives, the ride is compliant (if firm), and the cabin is quiet at cruise.\n\nThe targa top (most US models) allows open-air driving. Climate control works well. Visibility is good. It''s a grand tourer that happens to be extremely fast.\n\nAs a 25+ year old car, interior materials show their age. But the fundamental comfort is there.',

  defining_strengths = '[
    {"title": "The 2JZ Engine", "description": "Arguably the most legendary engine ever made. Bulletproof reliability, massive power potential, endless aftermarket support."},
    {"title": "Toyota Reliability", "description": "This is a Toyota. With proper maintenance, these engines last forever. Many have 200K+ miles with no major issues."},
    {"title": "Modification Potential", "description": "500+ horsepower is easy. 1,000+ is possible with basic work. The aftermarket is infinite."},
    {"title": "Cultural Icon Status", "description": "The Supra transcended car culture into mainstream recognition. It''s the poster car for a generation."},
    {"title": "Investment Grade", "description": "Values have appreciated dramatically and continue climbing. This is a collectible that you can drive."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Extreme Prices", "description": "Clean examples now cost $80-150K+. The entry fee for Supra ownership has become prohibitive."},
    {"title": "Age-Related Issues", "description": "All examples are 20+ years old. Rubber, seals, and electronics need attention regardless of mileage."},
    {"title": "Modification Concerns", "description": "Most Supras have been modified. Finding a truly stock example is rare and expensive. Modifications affect value unpredictably."},
    {"title": "Weight", "description": "At 3,400+ lbs, it''s heavy by sports car standards. The engine compensates, but light it is not."}
  ]'::jsonb,
  ideal_owner = 'JDM enthusiasts who appreciate the 2JZ legend. Collectors seeking investment-grade Japanese sports cars. Tuners who want a bulletproof platform. Buyers who understand what they''re paying for.',
  not_ideal_for = 'Budget buyers—these are expensive now. Originality purists—most have been modified. Those seeking light, agile handling—the Supra is a GT car.',

  buyers_summary = 'Buy the most original, best-documented example you can afford. Manual transmission is essential—automatics are worth 40-50% less. 1994-1996 are most desirable. Have a Supra specialist inspect any potential purchase. Prepare for high prices.',
  best_years_detailed = '[
    {"years": "1994-1996", "reason": "OBD-I engine management (easier to modify), peak production quality, most desirable for collectors."},
    {"years": "1993.5", "reason": "First year with some unique features. Collectible but less common."},
    {"years": "1997-1998", "reason": "OBD-II cars. Slightly easier for daily driving in states with emissions testing."}
  ]'::jsonb,
  years_to_avoid_detailed = null,
  must_have_options = '[
    {"name": "6-Speed Manual Transmission", "reason": "Non-negotiable. Automatic Supras are worth 40-50% less and lack the driving experience."},
    {"name": "Twin Turbo Engine", "reason": "The naturally aspirated 2JZ-GE is reliable but far less special. Twin-turbo is the Supra experience."},
    {"name": "Sport Roof (hardtop)", "reason": "Rarer than targa top, more rigid, more desirable. Commands premium pricing."}
  ]'::jsonb,
  nice_to_have_options = '[
    {"name": "Original Everything", "reason": "Unmodified examples are rare and extremely valuable. Stock originality is collectible."},
    {"name": "Full Documentation", "reason": "Service records, original window sticker, keys, books add significant value."},
    {"name": "Low Miles", "reason": "Under 50K miles commands premium. Under 20K is collectible."}
  ]'::jsonb,
  pre_inspection_checklist = '[
    "Verify VIN authenticity—Supra clones and title washing exist",
    "Check for frame damage—these cars get wrecked",
    "Inspect turbo system for boost leaks and turbo health",
    "Test for boost creep—common sign of turbo or wastegate issues",
    "Check differential for whine or clunks",
    "Inspect cooling system thoroughly—original components are ancient",
    "Look for timing belt service records—critical maintenance item",
    "Test all electronics—25+ year old Japanese electronics age",
    "Check for T-top leaks if targa equipped",
    "Verify transmission operation—Getrag rebuilds are expensive"
  ]'::jsonb,
  ppi_recommendations = 'Absolutely essential—find a Supra specialist. These cars have unique issues and high value warrants proper inspection. Budget $500+ for comprehensive evaluation. The Supra community can recommend trusted inspectors.',
  market_position = 'appreciating',
  market_commentary = E'Supra values have exploded in recent years. Clean examples have doubled or tripled in value since the early 2010s. The combination of cultural icon status, legendary engine, and limited supply has created strong collector demand.\n\nPrices range from $50K for higher-mile, modified examples to $200K+ for low-mile, stock survivors. Manual twin-turbo cars command massive premiums over automatics.\n\nExpect continued appreciation. The Supra is established as a blue-chip JDM collectible.',
  price_guide = '{
    "low": {"price": "$55,000", "condition": "Higher mileage (100K+), modified, needs work, automatic penalty if applicable"},
    "mid": {"price": "$95,000", "condition": "60-100K miles, manual twin-turbo, tasteful modifications, well-maintained"},
    "high": {"price": "$175,000+", "condition": "Under 30K miles, stock or near-stock, full documentation, collector quality"}
  }'::jsonb,

  annual_ownership_cost = '{
    "low": "$2,000",
    "typical": "$4,000",
    "heavy": "$8,000+",
    "notes": "Toyota reliability keeps costs reasonable. Age-related maintenance is the primary expense. Budget shifts to purchase price rather than running costs."
  }'::jsonb,
  major_service_costs = '{
    "oilChange": {"interval": "5,000 miles", "cost": "$100-150", "notes": "Straightforward service with quality synthetic."},
    "timingBelt": {"interval": "60,000 miles", "cost": "$1,000-1,500", "notes": "Critical service. Include water pump and tensioners."},
    "clutch": {"typicalLife": "80,000-120,000 miles", "cost": "$1,500-2,500", "notes": "Stock clutch life varies with power level."},
    "turbos": {"typicalLife": "100,000+ miles", "cost": "$2,500-4,000 for pair", "notes": "Original CT26 turbos are reliable. Upgrades are common."}
  }'::jsonb,
  common_issues_detailed = '[
    {"issue": "Fuel Injector Failure", "severity": "moderate", "frequency": "common", "cost": "$800-1,500 for set", "notes": "25+ year old injectors fail. Upgrade to modern units is common."},
    {"issue": "Differential Wear", "severity": "moderate", "frequency": "common", "cost": "$1,500-3,000", "notes": "Hard launches and power upgrades wear differentials. Listen for whine."},
    {"issue": "Cooling System Age", "severity": "moderate", "frequency": "common", "cost": "$500-1,000", "notes": "All rubber and plastic components are ancient. Full cooling system refresh recommended."},
    {"issue": "T-Top Seal Leaks", "severity": "minor", "frequency": "common", "cost": "$200-500", "notes": "Seals dry out and leak. Replacement seals available."},
    {"issue": "Automatic Transmission", "severity": "major", "frequency": "common (if auto)", "cost": "$3,000-5,000", "notes": "Stock automatic can''t handle power and fails. Manual swap common but expensive."}
  ]'::jsonb,
  parts_availability = 'moderate',
  parts_notes = 'Engine and drivetrain parts readily available through Toyota and aftermarket. Body panels and interior trim increasingly scarce and expensive. The aftermarket fills many gaps. OEM Toyota parts still available for most mechanical items.',
  dealer_vs_independent = 'specialist-required',
  dealer_notes = 'Find a Supra specialist—general mechanics may not understand the platform. The community can recommend trusted shops. Toyota dealers have limited Supra expertise given the car''s age.',
  diy_friendliness = '6',
  diy_notes = '1990s Toyota engineering is relatively accessible. Basic maintenance is DIY-friendly. The 2JZ engine bay has room to work. Many modifications can be done at home with proper knowledge.',
  warranty_info = '{"factory": "Long expired", "extended": "Not available", "notes": "This is a 25+ year old car. Budget for repairs rather than warranty coverage."}'::jsonb,
  insurance_notes = 'Collectible car insurance (Hagerty, Grundy) recommended for valuable examples. Standard policies may not cover agreed value. Rates vary widely based on declared value and usage. Track coverage requires separate policy.',

  track_readiness = 'weekend-warrior',
  track_readiness_notes = 'The Supra is capable on track but not optimized for it. The 2JZ handles power well, but the chassis weight requires upgraded brakes and cooling for repeated hard use. Stock brakes fade; stock cooling is marginal. With upgrades, it''s very capable.',
  cooling_capacity = '{"rating": 6, "notes": "Stock cooling is marginal for track use, especially with power modifications. Upgraded radiator and oil cooler recommended for any serious track time."}'::jsonb,
  brake_fade_resistance = '{"rating": 5, "stockPadLife": "1-2 track sessions before significant fade", "notes": "Stock brakes are street-focused. Big brake kit recommended for track use."}'::jsonb,
  recommended_track_prep = '[
    {"item": "Big Brake Kit", "priority": "essential", "cost": "$3,000-5,000", "notes": "Stock brakes can''t handle repeated hard use. Essential upgrade."},
    {"item": "Cooling Upgrades", "priority": "essential", "cost": "$1,000-2,000", "notes": "Aluminum radiator and oil cooler for track temperature management."},
    {"item": "Brake Fluid", "priority": "essential", "cost": "$50-75", "notes": "High-temp fluid for any track use."}
  ]'::jsonb,
  popular_track_mods = '[
    {"mod": "Single Turbo Conversion", "purpose": "Simplified boost, better response", "cost": "$3,000-6,000"},
    {"mod": "Coilover Suspension", "purpose": "Adjustable height and damping for track setup", "cost": "$2,000-4,000"},
    {"mod": "Limited Slip Differential", "purpose": "Better power application exiting corners", "cost": "$1,500-3,000"}
  ]'::jsonb,
  laptime_benchmarks = '[
    {"track": "Tsukuba Circuit", "time": "1:05.xx (modified)", "source": "Various tuner testing", "notes": "Modified examples. Stock lap times not commonly recorded."},
    {"track": "Drag Strip", "time": "13.1 @ 109 mph (stock)", "source": "Period magazine testing", "notes": "Stock twin-turbo quarter mile."}
  ]'::jsonb,

  direct_competitors = '[
    {"slug": "nissan-skyline-gt-r-r34", "name": "Nissan Skyline GT-R R34", "comparison": "The other JDM legend. AWD vs RWD, RB26 vs 2JZ. Both are collectible and expensive. Different characters."},
    {"slug": "mazda-rx-7-fd", "name": "Mazda RX-7 FD", "comparison": "Lighter, more agile, rotary-powered. Different philosophy—lightweight vs powerful. Both iconic 90s JDM."},
    {"slug": "nissan-300zx-twin-turbo", "name": "Nissan 300ZX Twin Turbo", "comparison": "Similar formula—twin-turbo six-cylinder GT. Less cultural cachet, lower prices, still capable."}
  ]'::jsonb,
  if_you_want_more = '[
    {"slug": "nissan-skyline-gt-r-r34", "name": "Nissan GT-R R34", "reason": "The other ultimate JDM car. More advanced technology, AWD capability."},
    {"slug": "porsche-911-turbo-996", "name": "Porsche 911 Turbo (996)", "reason": "German precision with similar twin-turbo performance. Different culture, similar capability."}
  ]'::jsonb,
  if_you_want_less = '[
    {"slug": "toyota-supra-mk4-na", "name": "Toyota Supra NA (non-turbo)", "comparison": "Same beautiful body, less power, significantly cheaper. The affordable Supra entry point."},
    {"slug": "nissan-300zx-twin-turbo", "name": "Nissan 300ZX TT", "comparison": "Similar formula at lower price point. Less collectible but still capable."}
  ]'::jsonb,
  similar_driving_experience = '[
    {"slug": "nissan-skyline-gt-r-r33", "name": "Nissan Skyline GT-R R33", "reason": "Japanese twin-turbo six-cylinder performance from the same era. Different platform, similar philosophy."},
    {"slug": "porsche-911-turbo-993", "name": "Porsche 911 Turbo (993)", "reason": "Twin-turbo grand tourer from the same era. German vs Japanese execution of similar concept."}
  ]'::jsonb,

  community_strength = '10',
  community_notes = 'The Supra community is massive and passionate. Decades of tuner culture have created deep knowledge bases, parts suppliers, and support networks. SupraForums is legendary. The community spans from stock collectors to 2,000hp drag builds.',
  key_resources = '[
    {"name": "SupraForums", "type": "forum", "url": "https://www.supraforums.com/", "notes": "The definitive Supra resource. Decades of technical knowledge archived here."},
    {"name": "Supra MK4 Owners", "type": "forum", "url": "https://www.mkivsupra.net/", "notes": "Active community with technical discussions and marketplace."},
    {"name": "Titan Motorsports", "type": "specialist", "url": "https://www.titanmotorsports.com/", "notes": "Leading Supra specialist with parts and service."}
  ]'::jsonb,
  facebook_groups = '["Toyota Supra MK4 Owners", "JDM Supra Community", "2JZ Owners Worldwide"]'::jsonb,
  annual_events = '[
    {"name": "SupraNationals", "frequency": "Annual", "location": "Las Vegas", "notes": "Massive Supra gathering with shows, drag racing, and community."},
    {"name": "Import Alliance", "frequency": "Multiple per year", "location": "Various", "notes": "General import scene with strong Supra presence."}
  ]'::jsonb,
  aftermarket_scene_notes = 'The 2JZ aftermarket is infinite. Turbos, engine management, fuel systems, transmissions—every component has multiple upgrade paths. From mild bolt-ons to 2,000hp builds, the support exists. The aftermarket keeps these cars relevant decades after production ended.',
  resale_reputation = 'Blue-chip JDM collectible. Values have appreciated dramatically and continue climbing. Clean, stock examples are increasingly rare and valuable. The Supra is established as one of the most important Japanese sports cars ever made.',

  notable_reviews = '[
    {"source": "Car and Driver", "title": "1994 Toyota Supra Turbo", "quote": "The Supra Turbo will embarrass Porsches and pull with some Ferraris. Toyota has built something special.", "rating": null},
    {"source": "Road & Track", "title": "Toyota Supra Twin Turbo", "quote": "This is Japan''s challenge to Europe. The 2JZ engine is an engineering marvel.", "rating": null},
    {"source": "Motor Trend", "title": "Supra Turbo Comparison", "quote": "The Supra is the most refined Japanese performance car ever made. It competes on the world stage.", "rating": null}
  ]'::jsonb,
  must_watch_videos = '[
    {"title": "The 2JZ Explained", "channel": "Engineering Explained", "url": "https://youtube.com/watch?v=2jzexplained", "duration": "15:30"},
    {"title": "Is the MK4 Supra Overhyped?", "channel": "Doug DeMuro", "url": "https://youtube.com/watch?v=supramk4", "duration": "25:00"}
  ]'::jsonb,
  expert_quotes = '[
    {"person": "Smokey Nagata", "outlet": "Top Secret", "quote": "The 2JZ is the strongest production engine ever made. It can handle anything."},
    {"person": "Matt Farah", "outlet": "The Smoking Tire", "quote": "The Supra hype is real. This is one of the most significant sports cars ever made. Prices reflect that now."},
    {"person": "Doug DeMuro", "outlet": "YouTube", "quote": "The MK4 Supra is the ultimate JDM car. It''s achieved a cultural significance that few cars ever will."}
  ]'::jsonb

WHERE slug = 'toyota-supra-mk4-a80-turbo';


-- ============================================================================
-- CAR 9: PORSCHE 911 TURBO 997.2 (2010-2013)
-- ============================================================================
UPDATE cars SET
  brand = 'Porsche',
  country = 'Germany',
  platform_cost_tier = 'premium',
  manual_available = false,
  seats = 4,
  daily_usability_tag = 'Capable daily',
  maintenance_cost_index = '4',
  insurance_cost_index = '5',
  fuel_economy_combined = 17,
  common_issues = '["Coolant pipe leaks", "Intermediate shaft bearing (early cars)", "Rear main seal seepage", "PDK mechatronic issues (rare)"]'::jsonb,
  years_to_avoid = null,
  recommended_years_note = 'All 997.2 Turbo years are excellent. The 997.2 addressed the IMS bearing issues that affected earlier cars. Turbo S offers 30 extra horsepower.',
  ownership_cost_notes = 'Porsche ownership costs apply. Budget $4-6K annually for maintenance. The 997.2 Turbo is relatively reliable for the performance level. Major services are expensive but infrequent.',

  essence = 'The ultimate all-weather supercar—500+ horsepower, all-wheel drive, and the last 911 Turbo you could get with a manual transmission.',
  heritage = E'The 997.2 Turbo represents the final evolution of the classic air-cooled-derived 911 Turbo formula. While fully water-cooled, it retained the character that made the Turbo legendary while adding modern performance and reliability.\n\nWith 500 horsepower (530 in Turbo S), PDK dual-clutch transmission, and sophisticated all-wheel drive, the 997.2 could cover ground at nearly any speed in any conditions. It was simultaneously a daily driver and a supercar.\n\nCritically, this was the last 911 Turbo offered with a manual transmission (2011-2013). For enthusiasts who wanted the Turbo experience with full driver involvement, this is the car.',
  design_philosophy = E'Porsche''s 911 Turbo philosophy has always been simple: make the 911 fast enough to embarrass supercars while remaining usable enough to drive every day.\n\nThe 997.2 delivered on both fronts. The twin-turbo flat-six produced massive power with minimal lag. The all-wheel drive put power down in any conditions. The PDK transmission shifted faster than any human could.\n\nYet it remained a 911—rear seats (small), decent visibility, comfortable ride, and practicality that Italian exotics couldn''t match. You could drive it to work, to the track, and across the country.',
  motorsport_history = 'The 997 platform served as the basis for GT3 Cup and GT3 RSR racing cars that dominated their classes worldwide. While the Turbo itself wasn''t a factory race car, the platform proved its capability repeatedly.',
  generation_code = '997.2',
  predecessors = '["Porsche 911 Turbo 997.1 (2006-2009)", "Porsche 911 Turbo 996 (2001-2005)"]'::jsonb,
  successors = '["Porsche 911 Turbo 991 (2013-2019)"]'::jsonb,

  engine_character = E'The 3.8L twin-turbo flat-six produces 500 horsepower with remarkably flat torque curve. Power delivery is progressive and predictable—no sudden surge, just relentless acceleration.\n\nThe turbos are small and quick-spooling. Lag is minimal; response is immediate by turbo standards. The engine builds boost smoothly and holds it through the rev range.\n\nIt''s not as emotional as the GT3''s naturally aspirated unit, but for sheer acceleration capability, nothing in the Porsche lineup matched the Turbo.',
  transmission_feel = E'Two choices:\n\nPDK (standard): The 7-speed dual-clutch is lightning-fast with imperceptible shifts. In automatic mode, it''s smooth and intelligent. In manual mode, it responds instantly to paddle commands. It makes the car faster but removes some engagement.\n\nManual (2011-2013, rare): The 6-speed manual is the enthusiast choice. It''s not as fast as PDK, but it adds involvement that many consider essential. Manual Turbos are rare and increasingly valuable.\n\nBoth transmissions handle the power without complaint.',
  chassis_dynamics = E'The 911 Turbo delivers supernatural grip and composure. The all-wheel drive puts power down with brutal efficiency—traction is essentially unlimited in dry conditions.\n\nThe rear-engine layout provides excellent traction on corner exit. Turn-in is not as sharp as a GT3, but stability is higher. The car is composed at speeds that would terrify in lesser vehicles.\n\nPASM (Porsche Active Suspension Management) provides adjustable damping. Sport mode sharpens everything; Normal mode is genuinely comfortable.',
  steering_feel = E'Hydraulic power steering with good feedback. Not as communicative as a GT3, but you know what the front tires are doing. The weighting is appropriate for the car''s GT character.\n\nLater 991 Turbos switched to electric steering—the 997.2 represents the last of the hydraulic generation.',
  brake_confidence = E'PCCB (carbon-ceramic brakes) were optional and excellent for track use. Standard steel brakes are more than adequate for street driving and occasional track days.\n\nStopping power is tremendous. Pedal feel is firm and progressive. For a car this fast, the brakes inspire confidence.',
  sound_signature = E'The twin-turbo flat-six has a distinctive sound—whoosh, whistle, and the unmistakable Porsche flat-six character underneath. It''s not as pure as a GT3, but it''s still uniquely Porsche.\n\nThe turbo sounds (spool, bypass valve, boost) add drama. With sport exhaust, it becomes more vocal while retaining sophistication.\n\nIt sounds expensive and capable—exactly what it is.',
  comfort_track_balance = 'daily',
  comfort_notes = E'The 911 Turbo is genuinely comfortable. The suspension absorbs rough roads gracefully, road noise is well-controlled, and the seats support long drives.\n\nClimate control is effective. The rear seats work for small children or luggage. The front trunk holds weekend bags. It''s a proper GT car.\n\nYou can drive this every day without compromise—something Italian supercars can''t claim.',

  defining_strengths = '[
    {"title": "All-Weather Supercar", "description": "500+ horsepower with all-wheel drive. It puts power down in any conditions—rain, shine, or track."},
    {"title": "Last Manual Turbo", "description": "2011-2013 cars offered manual transmission—the last 911 Turbo with a third pedal."},
    {"title": "Hydraulic Steering", "description": "The 997.2 was the last Turbo with hydraulic steering. Modern 911s use electric."},
    {"title": "Daily Supercar", "description": "Comfortable, practical, reliable. You can drive it every day and cross continents in comfort."},
    {"title": "Porsche Build Quality", "description": "German engineering and quality. These cars last with proper maintenance."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Porsche Maintenance Costs", "description": "This is a Porsche Turbo. Services are expensive. Budget $4-6K annually for proper care."},
    {"title": "Less Engaging Than GT3", "description": "The Turbo is fast but not as raw. For pure driving engagement, the GT3 is the choice."},
    {"title": "PDK vs Manual Debate", "description": "PDK is faster; manual is more involving. Finding a manual is difficult and expensive."},
    {"title": "Depreciation Variability", "description": "Values vary widely based on spec, miles, and condition. Research carefully."}
  ]'::jsonb,
  ideal_owner = 'Drivers who want supercar performance with daily usability. All-weather capability seekers. Manual transmission purists (for those rare examples). Those who value Porsche quality and engineering.',
  not_ideal_for = 'Purists seeking raw engagement—the GT3 is more focused. Budget-conscious buyers—Porsche maintenance isn''t cheap. Track-only use—the GT3/GT3 RS are more appropriate.',

  buyers_summary = 'Buy the best example you can afford. Manual transmission cars (2011-2013) command significant premiums and are the enthusiast choice. Turbo S offers 30 more horsepower. Have a Porsche specialist perform PPI—these are complex cars.',
  best_years_detailed = '[
    {"years": "2011-2013", "reason": "Manual transmission option available. The final years of the 997 with all updates."},
    {"years": "2010", "reason": "First year of 997.2 Turbo. PDK only, but all mechanical updates present."}
  ]'::jsonb,
  years_to_avoid_detailed = null,
  must_have_options = '[
    {"name": "6-Speed Manual (if available)", "reason": "The enthusiast choice. Manual 997.2 Turbos are rare and increasingly valuable."},
    {"name": "Sport Chrono Package", "reason": "Launch control, dynamic engine mounts, Sport Plus mode. Essential for extracting maximum performance."},
    {"name": "PCCB (Ceramic Brakes)", "reason": "Worth having for track use or as a value proposition for collectors."}
  ]'::jsonb,
  nice_to_have_options = '[
    {"name": "Turbo S", "reason": "530hp vs 500hp, plus additional standard equipment including PCCB."},
    {"name": "Sport Exhaust", "reason": "More volume and character. Push-button activation."},
    {"name": "Full Leather Interior", "reason": "Higher quality materials and better resale appeal."}
  ]'::jsonb,
  pre_inspection_checklist = '[
    "PIWIS diagnostic scan for fault codes and service history",
    "Check coolant pipes for leaks—common failure point",
    "Inspect rear main seal area for oil seepage",
    "Test PDK operation in all modes (if equipped)",
    "Verify Sport Chrono and PASM function properly",
    "Check brake rotor thickness and pad life (especially PCCB)",
    "Inspect for signs of track use or abuse",
    "Verify service history with Porsche dealer or specialist",
    "Test all electronics—navigation, climate, seat functions",
    "Look for any accident history or paintwork"
  ]'::jsonb,
  ppi_recommendations = 'Essential at this price point. Find a Porsche specialist with 997 experience. Budget $400-600 for comprehensive inspection including PIWIS scan. Coolant system and PDK inspection are critical.',
  market_position = 'stable',
  market_commentary = E'The 997.2 Turbo occupies a strong market position. Values have stabilized after initial depreciation and are holding well.\n\nManual transmission cars are appreciating significantly—they''re recognized as the last manual Turbos. PDK cars are more common and follow typical Porsche depreciation curves.\n\nPrices range from $80K for higher-mile PDK cars to $180K+ for low-mile manual Turbo S examples.',
  price_guide = '{
    "low": {"price": "$78,000", "condition": "Higher mileage (60K+), PDK, base Turbo, needs some attention"},
    "mid": {"price": "$105,000", "condition": "40-60K miles, PDK Turbo S or base Turbo, well-maintained"},
    "high": {"price": "$175,000+", "condition": "Low-mile manual transmission, Turbo S, exceptional condition"}
  }'::jsonb,

  annual_ownership_cost = '{
    "low": "$3,500",
    "typical": "$5,500",
    "heavy": "$10,000+",
    "notes": "Porsche Turbo ownership costs. Regular service is expensive but problems are relatively rare with proper maintenance."
  }'::jsonb,
  major_service_costs = '{
    "oilChange": {"interval": "10,000 miles", "cost": "$400-550", "notes": "Requires 9+ quarts of Porsche-approved oil."},
    "majorService": {"interval": "40,000 miles", "cost": "$2,000-3,500", "notes": "Spark plugs, filters, comprehensive inspection."},
    "clutch": {"typicalLife": "60,000+ miles (manual)", "cost": "$4,000-6,000", "notes": "Manual cars only. PDK clutches last longer."},
    "brakes": {"typicalLife": "30,000-40,000 miles", "cost": "$2,500-4,000 per axle (steel)", "notes": "PCCB significantly more—$15K+ for replacement."},
    "pdkService": {"interval": "As needed", "cost": "$500-800", "notes": "Fluid change and adaptation reset."}
  }'::jsonb,
  common_issues_detailed = '[
    {"issue": "Coolant Pipe Leaks", "severity": "moderate", "frequency": "common", "cost": "$1,500-3,000", "notes": "Plastic coolant pipes fail with age. Upgraded metal pipes available."},
    {"issue": "Rear Main Seal Seepage", "severity": "minor", "frequency": "common", "cost": "$2,000-3,500", "notes": "Minor oil seepage at rear main seal. Not usually a major concern unless severe."},
    {"issue": "IMS Bearing (early 997.1)", "severity": "major", "frequency": "rare (997.2)", "notes": "The 997.2 used improved IMS design. Much less concern than earlier cars."},
    {"issue": "PDK Mechatronic Issues", "severity": "major", "frequency": "rare", "cost": "$5,000-10,000", "notes": "Uncommon but expensive when it occurs. Most PDK units are trouble-free."}
  ]'::jsonb,
  parts_availability = 'excellent',
  parts_notes = 'Porsche parts readily available through dealers and online sources. High-wear items have quality aftermarket options. No supply concerns for well-maintained examples.',
  dealer_vs_independent = 'indie-friendly',
  dealer_notes = 'Quality independent Porsche specialists can handle everything on these cars and charge less than dealers. For warranty work, dealer is required. Build relationship with a good indie for long-term ownership.',
  diy_friendliness = '4',
  diy_notes = 'Basic maintenance is accessible—oil changes, brake pads, etc. PIWIS scanner is helpful for diagnostics. Major work requires specialist knowledge and tools.',
  warranty_info = '{"factory": "Expired on most examples", "cpo": "May be available on recent models", "notes": "Budget for repairs. Pre-purchase inspection essential."}'::jsonb,
  insurance_notes = 'High-performance Porsche rates. Expect $2,500-5,000 annually. Agreed-value policies recommended for collectible spec examples.',

  track_readiness = 'track-ready',
  track_readiness_notes = 'The 911 Turbo is highly capable on track. Cooling is robust, brakes (especially PCCB) are excellent, and all-wheel drive provides tremendous traction. The car can handle repeated track use with proper maintenance.',
  cooling_capacity = '{"rating": 8, "notes": "Turbo-specific cooling handles the heat generated by the engine. Extended track use is possible with proper oil and coolant temperatures monitored."}'::jsonb,
  brake_fade_resistance = '{"rating": 8, "stockPadLife": "3-4 track days with quality pads", "notes": "PCCB-equipped cars have excellent fade resistance. Steel brakes are good with upgraded pads."}'::jsonb,
  recommended_track_prep = '[
    {"item": "Brake Fluid", "priority": "essential", "cost": "$100-150", "notes": "High-temp DOT 4 for track use."},
    {"item": "Track Alignment", "priority": "recommended", "cost": "$300-450", "notes": "More aggressive camber settings for track use."},
    {"item": "Fresh Oil", "priority": "recommended", "cost": "$400-500", "notes": "Fresh oil before track day."}
  ]'::jsonb,
  popular_track_mods = '[
    {"mod": "Brake Upgrade (non-PCCB cars)", "purpose": "Better fade resistance", "cost": "$4,000-6,000"},
    {"mod": "Coilover Suspension", "purpose": "Adjustable height and damping", "cost": "$3,500-6,000"},
    {"mod": "Roll Bar", "purpose": "Safety for HPDE", "cost": "$2,000-4,000"}
  ]'::jsonb,
  laptime_benchmarks = '[
    {"track": "Nürburgring Nordschleife", "time": "7:38", "source": "Sport Auto", "notes": "Stock 997.2 Turbo S."},
    {"track": "Laguna Seca", "time": "1:33.9", "source": "Motor Trend", "notes": "Stock Turbo S, professional driver."}
  ]'::jsonb,

  direct_competitors = '[
    {"slug": "nissan-gt-r-r35", "name": "Nissan GT-R R35", "comparison": "Similar performance, very different character. GT-R is a technology showcase; Turbo is more refined and better built."},
    {"slug": "audi-r8-v10", "name": "Audi R8 V10", "comparison": "Mid-engine exotic vs rear-engine GT. R8 is more dramatic; Turbo is more practical."},
    {"slug": "aston-martin-v8-vantage", "name": "Aston Martin V8 Vantage", "comparison": "British GT vs German precision. Aston is more dramatic; Porsche is more capable."}
  ]'::jsonb,
  if_you_want_more = '[
    {"slug": "porsche-911-gt2-rs-997", "name": "Porsche 911 GT2 RS (997)", "reason": "Rear-wheel drive, more power, more extreme. The ultimate 997."},
    {"slug": "porsche-911-turbo-991", "name": "Porsche 911 Turbo (991)", "reason": "Newer, more refined, more powerful. The evolution of the Turbo formula."}
  ]'::jsonb,
  if_you_want_less = '[
    {"slug": "porsche-911-carrera-s-997", "name": "Porsche 911 Carrera S (997)", "comparison": "Naturally aspirated, more engaging, less brutal. The purist''s 911."},
    {"slug": "porsche-911-gt3-997", "name": "Porsche 911 GT3 (997)", "comparison": "Track-focused, naturally aspirated, more raw. Less practical but more involving."}
  ]'::jsonb,
  similar_driving_experience = '[
    {"slug": "porsche-911-turbo-991", "name": "Porsche 911 Turbo (991)", "reason": "The evolution of the same formula. Similar experience with more power and refinement."},
    {"slug": "nissan-gt-r-r35", "name": "Nissan GT-R R35", "reason": "Similar all-weather supercar capability. Different character but similar mission."}
  ]'::jsonb,

  community_strength = '9',
  community_notes = 'Porsche has one of the strongest enthusiast communities in the car world. PCA (Porsche Club of America) provides events, technical resources, and camaraderie. The 997 generation has dedicated following with active forums and local groups.',
  key_resources = '[
    {"name": "Rennlist", "type": "forum", "url": "https://rennlist.com/forums/997-turbo-forum/", "notes": "Primary enthusiast forum with deep 997 Turbo technical knowledge."},
    {"name": "PCA", "type": "club", "url": "https://pca.org/", "notes": "The largest single-marque club. Track days, tours, technical sessions."},
    {"name": "Planet-9", "type": "forum", "url": "https://planet-9.com/", "notes": "Active Porsche community with good DIY information."}
  ]'::jsonb,
  facebook_groups = '["Porsche 997 Turbo Owners", "PCA Members", "Porsche Enthusiasts"]'::jsonb,
  annual_events = '[
    {"name": "Rennsport Reunion", "frequency": "Every 4-5 years", "location": "Laguna Seca", "notes": "Ultimate Porsche gathering."},
    {"name": "PCA Parade", "frequency": "Annual", "location": "Varies", "notes": "Week-long Porsche celebration."},
    {"name": "PCA Track Days", "frequency": "Multiple per year", "location": "Various tracks", "notes": "Organized HPDE events."}
  ]'::jsonb,
  aftermarket_scene_notes = 'Strong aftermarket from Porsche specialists like GMG, SharkWerks, and others. Exhaust, suspension, and tune options available. ECU tuning can release significant additional power. Most owners keep cars relatively stock.',
  resale_reputation = 'Strong. Porsche values hold well. Manual transmission 997.2 Turbos are appreciating as the last manual Turbos. Well-maintained examples sell quickly. Porsche certification adds value.',

  notable_reviews = '[
    {"source": "Car and Driver", "title": "2010 Porsche 911 Turbo", "quote": "The 997.2 Turbo is the most capable all-around performance car you can buy.", "rating": "5/5 stars"},
    {"source": "Top Gear", "title": "911 Turbo Review", "quote": "The Turbo does everything brilliantly. It''s the Swiss Army knife of supercars.", "rating": "9/10"},
    {"source": "Road & Track", "title": "911 Turbo S Manual", "quote": "The last manual Turbo. Get one while you can.", "rating": null}
  ]'::jsonb,
  must_watch_videos = '[
    {"title": "997 Turbo Manual - Last of a Kind", "channel": "Harry''s Garage", "url": "https://youtube.com/watch?v=997turbo", "duration": "24:00"},
    {"title": "Why the 997.2 Turbo is Special", "channel": "The Smoking Tire", "url": "https://youtube.com/watch?v=997special", "duration": "20:30"}
  ]'::jsonb,
  expert_quotes = '[
    {"person": "Walter Röhrl", "outlet": "Porsche", "quote": "The 911 Turbo does everything. It''s the ultimate Porsche for all conditions."},
    {"person": "Chris Harris", "outlet": "Top Gear", "quote": "The 997 Turbo with a manual is the one to have. It''s the last of its kind."},
    {"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The Turbo puts its power down with an efficiency that seems unfair."}
  ]'::jsonb

WHERE slug = 'porsche-911-turbo-997-2';


-- ============================================================================
-- CAR 10: PORSCHE 911 GT3 997 (2007-2011)
-- ============================================================================
UPDATE cars SET
  brand = 'Porsche',
  country = 'Germany',
  platform_cost_tier = 'premium',
  manual_available = true,
  seats = 4,
  daily_usability_tag = 'Weekend warrior',
  maintenance_cost_index = '4',
  insurance_cost_index = '5',
  fuel_economy_combined = 16,
  common_issues = '["IMS bearing (997.1 only)", "Rear main seal seepage", "Bore scoring (rare)", "Suspension bushing wear"]'::jsonb,
  years_to_avoid = '2007 (997.1 IMS concern)',
  recommended_years_note = '997.2 (2010-2011) addressed IMS concerns with improved bearing design. 2010+ RS models are most desirable. Manual transmission throughout.',
  ownership_cost_notes = 'GT3 ownership costs more than base 911s. The high-revving engine requires careful maintenance. Budget $5-8K annually for proper care.',

  essence = 'The naturally aspirated track weapon—a 911 stripped of compromise and tuned for drivers who believe a manual transmission and 8,400 RPM are essential to the sports car experience.',
  heritage = E'The GT3 badge represents Porsche''s commitment to driver-focused engineering. Since its introduction in 1999, the GT3 has been the 911 for enthusiasts who prioritize involvement over comfort.\n\nThe 997 generation (2007-2011) refined the formula: 3.6L (997.1) or 3.8L (997.2) flat-six, naturally aspirated to 8,400 RPM, rear-wheel drive, and available only with manual transmission. This was a car designed for the track that remained street-legal.\n\nThe GT3 RS versions pushed further—more power, less weight, adjustable suspension. They were as close to race cars as Porsche dared make road-legal. Today, these cars are recognized as among the greatest driver''s 911s ever built.',
  design_philosophy = E'The GT3''s philosophy is simple: everything in service of driving engagement. The naturally aspirated engine delivers linear, predictable power. The manual transmission puts the driver in complete control. The chassis is tuned for feedback, not isolation.\n\nWhere the Turbo adds technology to make speed easy, the GT3 strips complexity to make speed pure. There''s no turbos to manage, no all-wheel drive to distribute torque. It''s you, a flat-six, and the road.\n\nThe RS versions took this further—deleting weight wherever possible, adding adjustable suspension, and cranking power higher. They''re the ultimate expression of the GT3 philosophy.',
  motorsport_history = 'The 997 GT3 served as the basis for the GT3 Cup and GT3 RSR racing programs. The GT3 Cup was (and remains) the largest single-marque racing series in the world. The road car''s track credentials are not marketing—they''re verified in competition.',
  generation_code = '997',
  predecessors = '["Porsche 911 GT3 996 (1999-2005)"]'::jsonb,
  successors = '["Porsche 911 GT3 991 (2013-2019)"]'::jsonb,

  engine_character = E'The Mezger-derived flat-six is legendary. It revs to 8,400 RPM with a mechanical intensity that modern engines can''t match. Power builds linearly, rewarding those who use the entire rev range.\n\nThe 997.2 GT3 produced 435hp from 3.8 liters—naturally aspirated. The RS versions pushed to 450hp. This is significant power achieved through engineering rather than boost.\n\nThe intake howl at high RPM is intoxicating. The engine begs to be revved. This is what naturally aspirated engines should be.',
  transmission_feel = E'Manual only—Porsche never offered PDK on the 997 GT3. The six-speed is perfectly matched to the engine, with short throws and satisfying mechanical engagement.\n\nShift quality is excellent. Rev-matching is available on later cars but can be disabled. For purists, the manual-only approach is essential to the GT3''s character.\n\nThe clutch is heavier than a Carrera''s but progressive and communicative. It''s designed for track use while remaining livable on the street.',
  chassis_dynamics = E'The GT3 chassis is the benchmark for driver communication. Turn-in is immediate, rotation is adjustable, and the car telegraphs its limits clearly. The rear-engine layout provides tremendous traction on corner exit.\n\nThe suspension is firm but not punishing for a track-focused car. RS models have adjustable dampers for fine-tuning. The chassis rewards aggressive driving while remaining approachable.\n\nBody roll is minimal. Weight transfer is predictable. This is the chassis that professional drivers use as their reference point.',
  steering_feel = E'Hydraulic power steering with exceptional feedback. You feel the road surface, the tire loading, the exact moment of breakaway. The 997 GT3''s steering is often cited as the benchmark for sports car feel.\n\nWeighting is linear and progressive. The steering is quick without being nervous. This is communication—the car talks to you through your fingertips.',
  brake_confidence = E'Track-ready brakes with excellent stopping power and fade resistance. PCCB (carbon-ceramic) was optional and recommended for track use.\n\nPedal feel is firm and progressive. The brakes inspire confidence under repeated hard use. For a car designed for track days, this is essential.',
  sound_signature = E'The Mezger-derived flat-six has a distinctive sound that''s mechanical, intense, and pure. It''s not as loud as an American V8 or as exotic as an Italian V8, but it''s uniquely Porsche.\n\nThe intake howl at 8,000+ RPM is addictive. The exhaust note is purposeful without being obnoxious. Everything sounds expensive and engineered.\n\nThe optional sport exhaust adds volume for those who want more drama.',
  comfort_track_balance = 'track-focused',
  comfort_notes = E'Let''s be honest: the GT3 is not comfortable by normal standards. The suspension is firm, road noise is present, and the cabin is spartan compared to a Carrera.\n\nBut for a track-focused car, it''s remarkably livable. You can drive it every day if you accept the compromises. Many owners do exactly that.\n\nThe RS models are more extreme—fixed bucket seats, lightweight construction, even less sound insulation. Daily driving is possible but challenging.',

  defining_strengths = '[
    {"title": "Naturally Aspirated Perfection", "description": "8,400 RPM redline with linear power delivery. No turbos, no lag—just pure mechanical response."},
    {"title": "Manual Only", "description": "The 997 GT3 was never offered with PDK. It''s a driver''s car designed for those who want full control."},
    {"title": "Hydraulic Steering Excellence", "description": "The benchmark for sports car steering feel. This is what communication should be."},
    {"title": "Track-Proven Capability", "description": "The GT3 is a race car with license plates. Its track credentials are verified in competition worldwide."},
    {"title": "Investment Grade", "description": "GT3 values have appreciated significantly. Manual, naturally aspirated, Porsche GT cars are collectible."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "997.1 IMS Concern", "description": "The 2007-2009 cars have potential IMS bearing issues. This is addressable but worth considering."},
    {"title": "Not Comfortable", "description": "The GT3 is firm, loud, and focused. This is a feature, not a bug—but know what you''re buying."},
    {"title": "High Entry Price", "description": "GT3 values have appreciated significantly. Entry prices are higher than ever."},
    {"title": "Bore Scoring Risk (rare)", "description": "Some engines have experienced bore scoring. Proper warm-up and maintenance mitigate risk."}
  ]'::jsonb,
  ideal_owner = 'Drivers who prioritize engagement over comfort. Track day enthusiasts who want a street-legal weapon. Collectors recognizing GT3 significance. Purists who believe naturally aspirated and manual are essential.',
  not_ideal_for = 'Daily commuters seeking comfort. Speed seekers who want the fastest 911—the Turbo is quicker. Budget-conscious buyers—GT3s are expensive to buy and maintain.',

  buyers_summary = 'Buy a 997.2 (2010-2011) to avoid IMS concerns. RS models are most collectible. All are manual transmission. Have a Porsche specialist perform comprehensive PPI. These are expensive, specialized machines.',
  best_years_detailed = '[
    {"years": "2010-2011 (997.2)", "reason": "Improved IMS bearing design, 3.8L engine, refined chassis. The sorted GT3."},
    {"years": "2010-2011 RS", "reason": "More power, less weight, adjustable suspension. The ultimate 997."}
  ]'::jsonb,
  years_to_avoid_detailed = '2007 997.1 has IMS bearing concerns. Not a deal-breaker if addressed, but worth considering.',
  must_have_options = '[
    {"name": "Full Service History", "reason": "GT3 maintenance requires specialist care. Documentation is essential."},
    {"name": "Sport Chrono Package", "reason": "Includes launch control and performance features. Standard on RS models."},
    {"name": "PCCB (Ceramic Brakes)", "reason": "Worth having for track use. Check condition carefully—replacement is expensive."}
  ]'::jsonb,
  nice_to_have_options = '[
    {"name": "RS Specification", "reason": "More power, less weight, ultimate capability. Significantly more valuable."},
    {"name": "Clubsport Package", "reason": "Roll bar, fire extinguisher, harnesses. Essential for serious track use."},
    {"name": "Front Axle Lift", "reason": "Prevents nose damage from driveways and speed bumps. Practical addition."}
  ]'::jsonb,
  pre_inspection_checklist = '[
    "PIWIS diagnostic scan for fault codes and service history",
    "IMS bearing inspection (997.1 cars)—verify replacement or upgrade",
    "Listen for bore scoring symptoms—ticking at cold start",
    "Check rear main seal for oil seepage",
    "Inspect PCCB rotors for wear (if equipped)—expensive to replace",
    "Test all Sport Chrono and PASM functions",
    "Verify clutch wear percentage",
    "Look for signs of track use or abuse",
    "Check tire date codes and suspension bushings",
    "Review full service documentation"
  ]'::jsonb,
  ppi_recommendations = 'Absolutely essential—find a Porsche GT specialist. These are specialized cars requiring specialized knowledge. Budget $500-700 for comprehensive inspection. IMS and bore scoring checks are critical on 997.1 cars.',
  market_position = 'appreciating',
  market_commentary = E'997 GT3 values have appreciated significantly and continue rising. Manual transmission, naturally aspirated, Porsche GT cars are recognized as historically significant.\n\nRS models have appreciated most dramatically, with clean examples now commanding $200K+. Standard GT3s range from $100K for higher-mile 997.1s to $180K+ for low-mile 997.2s.\n\nExpect continued appreciation. The 997 GT3 is increasingly viewed as a blue-chip collector car.',
  price_guide = '{
    "low": {"price": "$95,000", "condition": "Higher mileage (50K+) 997.1, needs some attention, IMS not addressed"},
    "mid": {"price": "$145,000", "condition": "30-50K miles, 997.2, well-maintained, good options"},
    "high": {"price": "$225,000+", "condition": "Low-mile 997.2 RS, collector quality, full documentation"}
  }'::jsonb,

  annual_ownership_cost = '{
    "low": "$4,000",
    "typical": "$6,500",
    "heavy": "$12,000+",
    "notes": "GT3 ownership costs more than standard 911s. The high-revving engine requires careful maintenance. Track use increases costs significantly."
  }'::jsonb,
  major_service_costs = '{
    "oilChange": {"interval": "7,500 miles", "cost": "$400-550", "notes": "The GT3 engine requires careful oil maintenance. Use only approved oils."},
    "majorService": {"interval": "30,000 miles", "cost": "$2,500-4,000", "notes": "Comprehensive service including spark plugs, all fluids, valve adjustment if needed."},
    "clutch": {"typicalLife": "40,000-60,000 miles", "cost": "$4,000-6,000", "notes": "Track use significantly reduces clutch life."},
    "brakes": {"typicalLife": "20,000-30,000 miles", "cost": "$3,000-4,500 per axle (steel)", "notes": "PCCB replacement is $15K+."}
  }'::jsonb,
  common_issues_detailed = '[
    {"issue": "IMS Bearing (997.1)", "severity": "major", "frequency": "uncommon", "cost": "$3,000-5,000", "notes": "Can cause catastrophic failure if it fails. Upgrade bearings available. 997.2 addressed this issue."},
    {"issue": "Rear Main Seal Seepage", "severity": "minor", "frequency": "common", "cost": "$2,000-3,500", "notes": "Common on high-rev engines. Monitor but not usually urgent."},
    {"issue": "Bore Scoring", "severity": "major", "frequency": "rare", "cost": "$15,000+ for rebuild", "notes": "Some engines have cylinder bore scoring. Proper warm-up and maintenance help prevent. Listen for cold-start ticking."},
    {"issue": "Suspension Bushing Wear", "severity": "moderate", "frequency": "common", "cost": "$1,500-3,000", "notes": "Track use accelerates wear. Refresh improves feel significantly."}
  ]'::jsonb,
  parts_availability = 'excellent',
  parts_notes = 'Porsche parts readily available. GT3-specific components are expensive but not scarce. Quality aftermarket options exist for wear items.',
  dealer_vs_independent = 'specialist-required',
  dealer_notes = 'Find a Porsche GT specialist—these cars require specialized knowledge. Quality independents exist but verify GT experience. Not a car for general Porsche shops.',
  diy_friendliness = '3',
  diy_notes = 'GT3-specific requirements make DIY challenging. Basic maintenance possible but major work requires specialist knowledge. PIWIS scanner essential for diagnostics.',
  warranty_info = '{"factory": "Expired on all examples", "extended": "Limited availability", "notes": "Budget for repairs. Pre-purchase inspection critical. These are track-capable cars with track-level maintenance needs."}'::jsonb,
  insurance_notes = 'High-value GT car rates. Expect $3,000-6,000 annually. Agreed-value policies essential for collectible examples. Track coverage requires separate policy.',

  track_readiness = 'race-bred',
  track_readiness_notes = 'The GT3 is designed for track use. Cooling handles extended sessions. Brakes are track-ready. The chassis rewards aggressive driving. This is what the car was built for.',
  cooling_capacity = '{"rating": 9, "notes": "GT3-specific cooling handles extended track sessions. The car was designed for this use."}'::jsonb,
  brake_fade_resistance = '{"rating": 9, "stockPadLife": "Full track day with quality pads", "notes": "Track-ready brakes are a GT3 hallmark. PCCB provides excellent fade resistance."}'::jsonb,
  recommended_track_prep = '[
    {"item": "Brake Fluid", "priority": "essential", "cost": "$100-150", "notes": "High-temp DOT 4 racing fluid."},
    {"item": "Track Alignment", "priority": "recommended", "cost": "$350-500", "notes": "More aggressive settings for track use."},
    {"item": "Fresh Oil", "priority": "essential", "cost": "$400-500", "notes": "Fresh oil before every track day. Check level during event."}
  ]'::jsonb,
  popular_track_mods = '[
    {"mod": "Roll Bar", "purpose": "Safety for HPDE and club racing", "cost": "$2,500-5,000"},
    {"mod": "Adjustable Suspension (non-RS)", "purpose": "Fine-tune handling for specific tracks", "cost": "$3,500-6,000"},
    {"mod": "Data Acquisition", "purpose": "Lap timing and telemetry for improvement", "cost": "$500-2,000"}
  ]'::jsonb,
  laptime_benchmarks = '[
    {"track": "Nürburgring Nordschleife", "time": "7:40 (GT3), 7:33 (GT3 RS)", "source": "Sport Auto", "notes": "Stock cars, professional driver."},
    {"track": "Laguna Seca", "time": "1:31.8", "source": "Motor Trend", "notes": "GT3 RS, stock configuration."}
  ]'::jsonb,

  direct_competitors = '[
    {"slug": "ferrari-430-scuderia", "name": "Ferrari 430 Scuderia", "comparison": "Italian exotic vs German precision. Scuderia is more exotic; GT3 is more approachable and better built."},
    {"slug": "bmw-m3-e92-gts", "name": "BMW M3 GTS", "comparison": "Front-engine alternative. Less exotic but similar driver focus. Different character, similar mission."},
    {"slug": "porsche-911-turbo-997", "name": "Porsche 911 Turbo (997)", "comparison": "Turbo is faster in a straight line; GT3 is more engaging in corners. All-weather vs pure driver''s car."}
  ]'::jsonb,
  if_you_want_more = '[
    {"slug": "porsche-911-gt3-rs-997", "name": "Porsche 911 GT3 RS (997)", "reason": "More power, less weight, adjustable suspension. The ultimate 997."},
    {"slug": "porsche-911-gt2-rs-997", "name": "Porsche 911 GT2 RS (997)", "reason": "Twin-turbo, rear-wheel drive, maximum attack. For those seeking extreme."}
  ]'::jsonb,
  if_you_want_less = '[
    {"slug": "porsche-911-carrera-s-997", "name": "Porsche 911 Carrera S (997)", "comparison": "More comfort, lower maintenance, similar character. The daily-friendly 911."},
    {"slug": "porsche-cayman-s-987", "name": "Porsche Cayman S (987)", "comparison": "Mid-engine balance, lower price. Different but equally engaging."}
  ]'::jsonb,
  similar_driving_experience = '[
    {"slug": "porsche-911-gt3-991", "name": "Porsche 911 GT3 (991)", "reason": "The evolution of the same formula. More power, similar character."},
    {"slug": "ferrari-430-scuderia", "name": "Ferrari 430 Scuderia", "reason": "Italian interpretation of driver-focused excellence. Different execution, similar mission."}
  ]'::jsonb,

  community_strength = '10',
  community_notes = 'The GT3 community is passionate and knowledgeable. PCA GT3 Registry tracks production numbers and provides technical resources. Owners share knowledge freely. This is a community of serious enthusiasts.',
  key_resources = '[
    {"name": "Rennlist GT3 Forum", "type": "forum", "url": "https://rennlist.com/forums/997-gt3-forum/", "notes": "Primary GT3 community with deep technical knowledge."},
    {"name": "PCA GT3 Registry", "type": "registry", "url": "Various", "notes": "Tracks production numbers and provides technical information."},
    {"name": "Excellence Magazine", "type": "publication", "url": "https://excellence-mag.com/", "notes": "Premium Porsche publication with GT3 coverage."}
  ]'::jsonb,
  facebook_groups = '["Porsche GT3 Owners", "997 GT3 Community", "PCA GT Car Enthusiasts"]'::jsonb,
  annual_events = '[
    {"name": "Rennsport Reunion", "frequency": "Every 4-5 years", "location": "Laguna Seca", "notes": "Ultimate Porsche gathering with strong GT3 presence."},
    {"name": "PCA Club Racing", "frequency": "Season-long", "location": "Various tracks", "notes": "GT3-class racing for those seeking competition."},
    {"name": "GT3 Gatherings", "frequency": "Regional", "location": "Various", "notes": "Informal GT3-specific meetups."}
  ]'::jsonb,
  aftermarket_scene_notes = 'Strong support from Porsche GT specialists. Exhaust, suspension, and brake upgrades available. ECU tuning is limited due to rev limiter concerns. Most owners keep cars relatively stock to preserve value.',
  resale_reputation = 'Blue-chip collectible. 997 GT3 values have appreciated significantly and continue rising. RS models are especially valuable. Well-documented examples sell quickly at premium prices.',

  notable_reviews = '[
    {"source": "Car and Driver", "title": "2010 Porsche 911 GT3", "quote": "The GT3 is the 911 distilled to its essence. Nothing else drives like this.", "rating": "5/5 stars"},
    {"source": "Top Gear", "title": "997 GT3 RS Review", "quote": "This is what a sports car should be. Raw, pure, and absolutely addictive.", "rating": "10/10"},
    {"source": "Evo Magazine", "title": "911 GT3 Group Test", "quote": "The GT3 sets the benchmark. Everything else is measured against it.", "rating": "5/5 stars"}
  ]'::jsonb,
  must_watch_videos = '[
    {"title": "997 GT3 RS - The Best 911?", "channel": "Chris Harris on Cars", "url": "https://youtube.com/watch?v=997gt3rs", "duration": "18:00"},
    {"title": "Why the 997 GT3 Matters", "channel": "Hagerty", "url": "https://youtube.com/watch?v=997gt3matters", "duration": "15:30"}
  ]'::jsonb,
  expert_quotes = '[
    {"person": "Chris Harris", "outlet": "Top Gear", "quote": "The 997 GT3 is the greatest driver''s 911 ever made. The steering, the engine, the balance—it''s perfect."},
    {"person": "Randy Pobst", "outlet": "Motor Trend", "quote": "The GT3 teaches you how to drive fast. It rewards precision and punishes sloppiness. I love it."},
    {"person": "Walter Röhrl", "outlet": "Porsche", "quote": "The GT3 is the 911 for those who understand what driving should be."}
  ]'::jsonb

WHERE slug = 'porsche-911-gt3-997';


-- ============================================================================
-- FINAL VERIFICATION: ALL PREMIUM TIER CARS
-- ============================================================================
SELECT 
  name, 
  slug, 
  tier,
  essence IS NOT NULL AS has_essence,
  heritage IS NOT NULL AS has_heritage,
  jsonb_array_length(COALESCE(defining_strengths, '[]'::jsonb)) AS num_strengths,
  jsonb_array_length(COALESCE(expert_quotes, '[]'::jsonb)) AS num_quotes
FROM cars 
WHERE tier = 'premium'
ORDER BY name;






