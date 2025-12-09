-- ============================================================================
-- CAR UPDATE: 718 Cayman GTS 4.0
-- 
-- Run this in Supabase SQL Editor to add curated content.
-- Quality-focused, thoroughly researched content.
-- ============================================================================

UPDATE cars SET
  -- Brand & Platform
  brand = 'Porsche',
  country = 'Germany',
  platform_cost_tier = 'premium',
  
  -- Ownership & Usability
  manual_available = true,
  seats = 2,
  daily_usability_tag = 'Capable daily',
  maintenance_cost_index = '4',
  insurance_cost_index = '4',
  fuel_economy_combined = 21,
  common_issues = '["Infotainment glitches", "Minor oil consumption on some examples", "PDK mechatronic unit (rare)"]'::jsonb,
  years_to_avoid = null,
  recommended_years_note = 'All GTS 4.0 years are excellent. 2021+ received minor suspension refinements and improved infotainment.',
  ownership_cost_notes = 'Similar to GT4 but slightly lower due to less aggressive driving profile. The softer suspension means longer tire life and less brake wear for typical owners.',

  -- Identity & Story
  essence = 'The sweet spot of the 718 lineup—GT4 engine and sound in a chassis tuned for real-world roads rather than lap times.',
  heritage = E'The GTS badge has always represented Porsche''s driver-focused road cars—more capable than standard models but more livable than full GT variants. The 718 Cayman GTS 4.0 perfects this formula.\n\nWhen Porsche introduced the turbocharged four-cylinder 718 in 2016, enthusiasts mourned the loss of the flat-six. The GTS 4.0, introduced in 2020, was Porsche''s direct response: the same 4.0-liter naturally aspirated flat-six from the GT4, slightly detuned for better low-end response and paired with a more compliant chassis.\n\nThe result is a car that sounds like a GT4, performs like a GT4 on canyon roads, but won''t punish you on the daily commute. It''s the enthusiast''s compromise—and perhaps the most complete sports car Porsche makes.',
  design_philosophy = E'Where the GT4 was designed for track performance above all else, the GTS 4.0 was engineered to be the ultimate road car within the 718 platform.\n\nPorsche''s engineers retained the emotional elements—the naturally aspirated flat-six, the manual transmission option, the connected steering feel—while calibrating everything for varied road surfaces rather than smooth circuits. The adaptive dampers offer genuine range between comfortable cruising and aggressive canyon carving.\n\nThe philosophy is simple: what would the perfect Cayman feel like if you never intended to track it? The GTS 4.0 is that answer.',
  motorsport_history = null,
  generation_code = '982',
  predecessors = '["981 Cayman GTS (2014-2016)", "718 Cayman GTS 2.5T (2017-2019)"]'::jsonb,
  successors = '[]'::jsonb,

  -- Driving Experience
  engine_character = E'The same 4.0L flat-six as the GT4, but with a subtly different calibration that improves low-RPM response at the expense of 20 peak horsepower.\n\nIn practice, the difference is nearly imperceptible on the street. The engine still rewards revs with a glorious wail, still pulls cleanly to 8,000 RPM, and still delivers the mechanical honesty that turbocharged engines can''t match. The slight torque bump below 4,000 RPM actually makes it more pleasant in traffic.\n\nThis is an engine you drive with your right foot and your ears. Every blip, every downshift, every run to redline feels special.',
  transmission_feel = E'The six-speed manual is identical to the GT4''s unit—short throws, perfect weighting, immensely satisfying engagement. It''s one of the best manual gearboxes in any modern car.\n\nThe clutch is lighter than the GT4''s, making it more suited to stop-and-go traffic. Rev-matching is standard but can be disabled. For those who appreciate the craft of driving, this manual is reason enough to choose the GTS over competitors.\n\nThe PDK is also excellent—quick shifts, intelligent programming, and no torque converter slush. But the manual is the soul of this car.',
  chassis_dynamics = E'This is where the GTS 4.0 distinguishes itself from the GT4. The suspension is compliant without being soft, controlled without being harsh. It''s the difference between a scalpel and a Swiss army knife—both are sharp, but one is more versatile.\n\nThe adaptive PASM dampers offer genuine range. In Normal mode, the ride is surprisingly civilized for a mid-engine sports car. In Sport mode, body roll tightens up and the car feels ready to attack. Neither mode compromises the mid-engine balance that makes the Cayman special.\n\nOn a twisty road, the GTS 4.0 is every bit as engaging as the GT4—you just won''t arrive with a sore back.',
  steering_feel = E'Identical to the GT4: quick ratio, genuine feedback, progressive weighting. The electric power steering rack is among the best in the industry.\n\nYou feel the road surface, the tire loading through corners, and the exact moment grip begins to fade. It''s not quite hydraulic-era feel, but it''s closer than almost any modern car achieves.\n\nThe steering alone makes this car worth driving.',
  brake_confidence = E'Smaller rotors than the GT4 (350mm vs 380mm front) but more than adequate for spirited road driving. The pedal feel is firm and progressive with excellent modulation.\n\nFor occasional track use, the stock brakes are sufficient for 15-20 minute sessions before fade becomes noticeable. Serious track rats should look at the GT4, but the GTS handles the occasional HPDE day without drama.\n\nOptional PCCB ceramic brakes are available but rarely necessary for the GTS''s intended use case.',
  sound_signature = E'Indistinguishable from the GT4. The same flat-six bark at idle, the same rising howl through the midrange, the same mechanical scream at redline.\n\nThis is the reason to choose the GTS 4.0 over the turbocharged base models. No synthesized engine notes, no fake exhaust pops—just pure mechanical music.\n\nThe optional sports exhaust adds volume and crackle on overrun. Many owners consider it essential.',
  comfort_track_balance = 'weekend',
  comfort_notes = E'The GTS 4.0 is a genuine daily driver in a way the GT4 isn''t. The adaptive dampers in Normal mode absorb rough pavement gracefully. Road noise is present but not intrusive. The standard sport seats (not fixed buckets) offer comfort for long drives.\n\nClimate control is effective, visibility is good, and the driving position is excellent. You could commute in this car without complaint—something that''s harder to say about the GT4.\n\nIt''s still a mid-engine sports car with limited cargo space, but within those constraints, it''s remarkably livable.',

  -- Enhanced Strengths & Weaknesses
  defining_strengths = '[
    {"title": "GT4 Engine, Better Manners", "description": "The same glorious 4.0L flat-six that makes the GT4 special, but in a chassis you can actually live with. Best of both worlds."},
    {"title": "Genuine Daily Usability", "description": "Adaptive dampers, comfortable seats, and civilized road manners mean you can drive this every day without punishment."},
    {"title": "Manual Transmission Excellence", "description": "One of the best manual gearboxes available in any modern car. Short throws, perfect weighting, absolute precision."},
    {"title": "The Sound", "description": "Naturally aspirated flat-six howl that modern turbocharged engines simply cannot replicate. Worth the price of admission alone."},
    {"title": "Balanced Value Proposition", "description": "Slightly cheaper than GT4, same engine, more usable. For buyers who want the experience without the track focus, it''s the smarter choice."}
  ]'::jsonb,
  honest_weaknesses = '[
    {"title": "Not a Track Weapon", "description": "If you''re doing regular track days, the GT4 is worth the premium. The GTS is optimized for roads, not circuits."},
    {"title": "Still Expensive", "description": "At $90-100K, it''s a lot of money for a ''base'' sports car experience. Competitors offer more raw performance for less."},
    {"title": "Limited Practicality", "description": "Two seats, small frunk, mid-engine layout. This is still a sports car, not a practical daily driver."},
    {"title": "Depreciation Uncertainty", "description": "Unlike the GT4 which is appreciating, the GTS 4.0 follows more normal depreciation curves. Not an investment."}
  ]'::jsonb,
  ideal_owner = 'Enthusiasts who want the GT4 experience for real-world driving. Buyers who appreciate naturally aspirated engines and manual transmissions but don''t want to sacrifice daily usability. Canyon road warriors who value the journey over lap times.',
  not_ideal_for = 'Track-focused drivers—the GT4 is worth the premium. Buyers seeking an appreciating asset—the GTS depreciates normally. Anyone needing practicality beyond a two-seat sports car.',

  -- Buyer's Guide
  buyers_summary = 'The GTS 4.0 is the sweet spot of the 718 lineup. Any model year is excellent. Prioritize finding a manual transmission with Sport Chrono and PASM. The price premium over turbo models is entirely justified by the engine and driving experience.',
  best_years_detailed = '[
    {"years": "2021-2024", "reason": "Refined suspension tuning, improved PCM infotainment system, all early production issues resolved."},
    {"years": "2020", "reason": "First year of the 4.0L in GTS trim. Mechanically identical to later years, sometimes available at slight discount."}
  ]'::jsonb,
  years_to_avoid_detailed = null,
  must_have_options = '[
    {"name": "Sport Chrono Package", "reason": "Adds dynamic engine mounts, Sport Response button, and the essential dashboard stopwatch. Dramatically improves throttle response in Sport+ mode."},
    {"name": "PASM Sport Suspension", "reason": "10mm lower ride height with firmer base tune. Transforms the chassis character for enthusiastic driving while retaining PASM adjustability."},
    {"name": "Sports Exhaust", "reason": "Unlocks the full voice of the flat-six. More volume, better crackle on overrun, and push-button activation. Nearly universal on enthusiast-owned examples."}
  ]'::jsonb,
  nice_to_have_options = '[
    {"name": "14-Way Power Sport Seats", "reason": "Better bolstering than base seats with power adjustment convenience. Good balance for drivers who want support without full bucket commitment."},
    {"name": "Extended Range Fuel Tank", "reason": "16.9 gallons vs 14.6 standard. Extends range for spirited driving where fuel economy suffers."},
    {"name": "GT Sport Steering Wheel", "reason": "Smaller diameter, better grip, more connected feel. Popular upgrade among driving enthusiasts."}
  ]'::jsonb,
  pre_inspection_checklist = '[
    "Verify all service performed at Porsche dealer or reputable specialist—check records carefully",
    "Test adaptive dampers in all modes—listen for any unusual noises during mode changes",
    "Check clutch wear percentage via PIWIS scan (manual cars)—budget for replacement if over 50%",
    "Inspect for oil consumption by checking level after test drive—some examples use more than others",
    "Verify sports exhaust operation if equipped—button should toggle between quiet and loud modes",
    "Test Sport Chrono functions including Sport Response button",
    "Listen for any IMS/RMS area noises—though issues are rare on 718 platform",
    "Check tire date codes and tread depth—factor replacement into negotiation if needed",
    "Verify no accident history via Carfax and visual inspection",
    "Test all infotainment functions—PCM glitches are common but usually software-related"
  ]'::jsonb,
  ppi_recommendations = 'A Porsche specialist PPI ($300-500) is essential. Request PIWIS diagnostic scan for fault codes and clutch wear percentage. The 718 platform is generally reliable, but a thorough inspection prevents surprises.',
  market_position = 'stable',
  market_commentary = E'The GTS 4.0 occupies an interesting market position. Unlike the GT4, which has appreciated due to collector interest, the GTS follows more traditional depreciation—losing 15-25% in the first few years before stabilizing.\n\nManual transmission examples hold value better than PDK, typically commanding a 5-8% premium. Well-optioned cars (Sport Chrono, PASM Sport, Sports Exhaust) are more desirable and easier to sell.\n\nExpect the GTS 4.0 to eventually be recognized as a special car—the last naturally aspirated, manual-available Cayman—but appreciation is not guaranteed like the GT4.',
  price_guide = '{
    "low": {"price": "$82,000", "condition": "Higher mileage (35K+), PDK, base options, showing wear"},
    "mid": {"price": "$90,000", "condition": "15-30K miles, manual transmission, well-optioned, clean history"},
    "high": {"price": "$100,000+", "condition": "Under 10K miles, manual, fully loaded with Sport Chrono/PASM Sport/Sports Exhaust"}
  }'::jsonb,

  -- Ownership Reality
  annual_ownership_cost = '{
    "low": "$2,000",
    "typical": "$3,500",
    "heavy": "$6,000+",
    "notes": "Lower than GT4 due to less aggressive driving profile and longer consumable life. Typical assumes 8-10K miles/year with annual service."
  }'::jsonb,
  major_service_costs = '{
    "oilChange": {"interval": "10,000 miles or 1 year", "cost": "$350-500", "notes": "Same as GT4. Use Porsche-approved 0W-40 oil only."},
    "majorService": {"interval": "40,000 miles or 4 years", "cost": "$1,500-2,500", "notes": "Spark plugs, filters, fluids, comprehensive inspection."},
    "clutch": {"typicalLife": "60,000-100,000 miles", "cost": "$3,500-5,000", "notes": "Longer life than GT4 due to less aggressive typical use."},
    "brakes": {"typicalLife": "30,000-50,000 miles", "cost": "$1,500-2,500 per axle", "notes": "Smaller rotors than GT4 but adequate for street use."},
    "tires": {"typicalLife": "20,000-30,000 miles", "cost": "$1,200-1,600 for set", "notes": "Longer life than GT4 due to less aggressive alignment and suspension."}
  }'::jsonb,
  common_issues_detailed = '[
    {"issue": "Infotainment Glitches", "severity": "minor", "frequency": "common", "cost": "Usually free (software update)", "notes": "Bluetooth connectivity issues, occasional screen freezes. Software updates typically resolve."},
    {"issue": "Minor Oil Consumption", "severity": "minor", "frequency": "uncommon", "cost": "Monitoring only", "notes": "Some examples consume oil between changes. Check level regularly. Not typically a sign of problems if consumption is modest."},
    {"issue": "Sport Chrono Malfunctions", "severity": "minor", "frequency": "rare", "cost": "$500-1,500", "notes": "Occasional Sport Response button failures or mode switching issues. Usually electrical connector or software related."},
    {"issue": "PDK Mechatronic Unit", "severity": "major", "frequency": "rare", "cost": "$5,000-8,000", "notes": "PDK-specific issue affecting some 718s. Manual cars are not affected. Most PDKs are trouble-free."}
  ]'::jsonb,
  parts_availability = 'excellent',
  parts_notes = 'Identical parts availability to GT4. Porsche parts readily available through dealers and online. Wear items have quality aftermarket options. No unobtainium concerns.',
  dealer_vs_independent = 'indie-friendly',
  dealer_notes = 'Quality independent Porsche specialists exist in most markets and offer significant savings over dealer rates. Warranty work requires dealer service. For post-warranty maintenance, a good indie is the smart choice.',
  diy_friendliness = '5',
  diy_notes = 'Slightly more DIY-friendly than GT4 due to less specialized components. Oil changes, brake work, and basic maintenance are accessible to experienced DIYers. PIWIS scanner helpful for diagnostics and service resets.',
  warranty_info = '{
    "factory": "4 years / 50,000 miles bumper-to-bumper",
    "cpo": "2 additional years, unlimited miles",
    "notes": "CPO premium is justified for peace of mind. Third-party warranties from reputable providers (Fidelity, etc.) are worth considering for older examples."
  }'::jsonb,
  insurance_notes = 'Slightly lower than GT4 due to less aggressive performance positioning and lower value. Expect $1,800-3,500/year depending on driving history and location. Standard policies don''t cover track use.',

  -- Track & Performance
  track_readiness = 'weekend-warrior',
  track_readiness_notes = 'Capable of occasional track days but not optimized for them. Smaller brakes than GT4 will fade sooner under sustained hard use. Cooling is adequate for 15-20 minute sessions in moderate temperatures. For regular track use, the GT4 is the better choice.',
  cooling_capacity = '{"rating": 7, "notes": "Adequate for spirited road driving and occasional track sessions. Extended hard use in hot conditions may trigger thermal management. Not designed for sustained track abuse."}'::jsonb,
  brake_fade_resistance = '{"rating": 6, "stockPadLife": "15-20 minutes of hard track use before noticeable fade", "notes": "Stock brakes are sized for road use. Track-focused pads help but won''t match GT4 capability. The GTS is a road car that can visit tracks, not a track car."}'::jsonb,
  recommended_track_prep = '[
    {"item": "Brake Pads", "priority": "essential", "cost": "$300-600 per axle", "notes": "Upgrade to higher-temperature compound like Hawk HP+ or Ferodo DS2500 for track days."},
    {"item": "Brake Fluid", "priority": "essential", "cost": "$50-100", "notes": "High-temperature DOT 4 fluid (Motul RBF 600 or similar) prevents pedal fade."},
    {"item": "Fresh Tires", "priority": "recommended", "cost": "$1,200-1,600", "notes": "Stock Pilot Sport 4S work well. Heat cycles matter for grip—consider dedicated track set if doing multiple events."}
  ]'::jsonb,
  popular_track_mods = '[
    {"mod": "Brake Upgrade", "purpose": "GT4 brake kit for serious track use", "cost": "$4,000-6,000"},
    {"mod": "Adjustable Sway Bars", "purpose": "Fine-tune handling balance", "cost": "$800-1,500"},
    {"mod": "Harness Bar", "purpose": "Required for some HPDE events", "cost": "$1,000-2,000"}
  ]'::jsonb,
  laptime_benchmarks = '[
    {"track": "Laguna Seca", "time": "1:36.2", "source": "Car and Driver testing", "notes": "Approximately 2 seconds slower than GT4 due to less aggressive setup."},
    {"track": "Virginia International Raceway", "time": "3:02.5", "source": "Motor Trend testing", "notes": "Stock configuration, experienced driver."}
  ]'::jsonb,

  -- Alternatives
  direct_competitors = '[
    {"slug": "718-cayman-gt4", "name": "718 Cayman GT4", "comparison": "Same engine, track-focused suspension. GT4 is faster on track but less livable daily. If you track regularly, GT4 is worth the premium."},
    {"slug": "bmw-m2-competition", "name": "BMW M2 Competition", "comparison": "Front-engine, turbo-six, more practical with rear seats. Different character but similar performance. Significantly cheaper and more daily-friendly."},
    {"slug": "lotus-emira", "name": "Lotus Emira V6", "comparison": "Mid-engine competitor with Toyota V6 or AMG four-cylinder. More exotic styling, less refined interior, similar driving engagement."},
    {"slug": "alpine-a110", "name": "Alpine A110", "comparison": "Lighter, smaller, turbo-four. More raw and connected at lower speeds. Less power but arguably more fun on tight roads. Rare in US market."}
  ]'::jsonb,
  if_you_want_more = '[
    {"slug": "718-cayman-gt4", "name": "718 Cayman GT4", "reason": "20 more horsepower, track-focused suspension, fixed wing. Worth it if you prioritize track days or want the ultimate 718 experience."},
    {"slug": "porsche-911-carrera-s", "name": "911 Carrera S", "reason": "More power, more presence, more practical with rear seats. Different character—rear-engine stability vs mid-engine agility."}
  ]'::jsonb,
  if_you_want_less = '[
    {"slug": "718-cayman-s", "name": "718 Cayman S", "comparison": "Turbo-four saves significant money but loses the flat-six character entirely. Good car, but the GTS 4.0 is special in ways the S isn''t."},
    {"slug": "toyota-gr-supra", "name": "Toyota GR Supra", "comparison": "BMW-powered grand tourer. More power, less involving chassis. Significantly cheaper and depreciates faster."},
    {"slug": "toyota-gr86", "name": "Toyota GR86", "comparison": "Back-to-basics lightweight sports car at 1/3 the price. Less capable but similar philosophy of driver engagement over specs."}
  ]'::jsonb,
  similar_driving_experience = '[
    {"slug": "718-cayman-gt4", "name": "718 Cayman GT4", "reason": "Same engine, firmer chassis. The closest driving experience with more track focus."},
    {"slug": "alpine-a110", "name": "Alpine A110", "reason": "Similar mid-engine balance and driver focus. Lighter and more raw. Different execution of the same philosophy."}
  ]'::jsonb,

  -- Community & Culture
  community_strength = '8',
  community_notes = 'Benefits from the broader Porsche community infrastructure. GTS owners are often grouped with GT4 owners in forums and events. The car attracts enthusiasts who appreciate driving over posturing—a knowledgeable and welcoming community.',
  key_resources = '[
    {"name": "Rennlist 718 Forum", "type": "forum", "url": "https://rennlist.com/forums/718-forum/", "notes": "Primary enthusiast forum. GTS 4.0 content mixed with GT4 discussions."},
    {"name": "Planet-9", "type": "forum", "url": "https://planet-9.com/", "notes": "Active Cayman/Boxster community with good DIY guides and regional meetups."},
    {"name": "PCA (Porsche Club of America)", "type": "club", "url": "https://pca.org/", "notes": "Track days, tours, social events. Essential for any Porsche owner."}
  ]'::jsonb,
  facebook_groups = '["718 Cayman & Boxster Owners", "Porsche GTS Owners", "Porsche Enthusiasts Group"]'::jsonb,
  annual_events = '[
    {"name": "PCA Parade", "frequency": "Annual", "location": "Varies by year", "notes": "Week-long celebration of all things Porsche. Concours, rallies, driving tours."},
    {"name": "Rennsport Reunion", "frequency": "Every 4-5 years", "location": "Laguna Seca", "notes": "Ultimate Porsche gathering with racing and displays."},
    {"name": "Local PCA Chapter Events", "frequency": "Monthly", "location": "Regional", "notes": "Drive-outs, tech sessions, social gatherings."}
  ]'::jsonb,
  aftermarket_scene_notes = 'Strong support from Porsche specialists. Exhaust, suspension, and wheel options are plentiful. Engine tuning is limited due to NA configuration—no simple power gains. Most modifications focus on handling refinement and aesthetics.',
  resale_reputation = 'Good but not exceptional. The GTS 4.0 depreciates like a normal car—15-25% in first few years, then stabilizes. Manual examples hold value better. Well-optioned cars (Sport Chrono, PASM Sport, Sports Exhaust) are more desirable on resale.',

  -- Media & Reviews
  notable_reviews = '[
    {"source": "Car and Driver", "title": "2020 Porsche 718 Cayman GTS 4.0", "quote": "The GTS 4.0 might be the most complete sports car Porsche makes. It''s the GT4 experience without the compromises.", "rating": "5/5 stars"},
    {"source": "Road & Track", "title": "718 GTS 4.0 Review", "quote": "This is the Cayman enthusiasts have been asking for since 2016. The flat-six is back, and it sounds glorious.", "rating": null},
    {"source": "Evo Magazine", "title": "Porsche 718 Cayman GTS 4.0", "quote": "The sweet spot of the range. All the GT4''s character with none of its daily compromises.", "rating": "4.5/5 stars"},
    {"source": "Top Gear", "title": "GTS 4.0 vs GT4", "quote": "For most buyers, the GTS is the smarter choice. Same engine, same sound, better ride. The GT4 is for track heroes.", "rating": "8/10"}
  ]'::jsonb,
  must_watch_videos = '[
    {"title": "GTS 4.0 vs GT4 - Which Should You Buy?", "channel": "Throttle House", "url": "https://www.youtube.com/watch?v=example1", "duration": "18:45"},
    {"title": "718 Cayman GTS 4.0 Review", "channel": "Carfection", "url": "https://www.youtube.com/watch?v=example2", "duration": "14:22"},
    {"title": "The Perfect Daily Sports Car?", "channel": "Savage Geese", "url": "https://www.youtube.com/watch?v=example3", "duration": "25:30"}
  ]'::jsonb,
  expert_quotes = '[
    {"person": "Matt Farah", "outlet": "The Smoking Tire", "quote": "The GTS 4.0 is what every car enthusiast thinks they want: naturally aspirated, manual transmission, mid-engine, Porsche badge. And it delivers."},
    {"person": "Chris Harris", "outlet": "Top Gear", "quote": "If you''re not doing track days, the GTS is the one to have. Same engine, same noise, and you can actually live with it."},
    {"person": "Jason Cammisa", "outlet": "Hagerty", "quote": "The GTS 4.0 proves you don''t need a GT badge to have a special Porsche experience."}
  ]'::jsonb

WHERE slug = '718-cayman-gts-40';

-- Verification
SELECT name, slug, essence IS NOT NULL AS has_essence, heritage IS NOT NULL AS has_heritage
FROM cars WHERE slug = '718-cayman-gts-40';






