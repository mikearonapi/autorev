-- ============================================================================
-- Upgrade Education Seed Data
-- 
-- This file seeds the upgrade_education table with comprehensive upgrade info.
-- Run this AFTER creating the table from schema.sql
-- ============================================================================

-- Clear existing data (be careful in production!)
-- TRUNCATE upgrade_education;

-- ============================================================================
-- POWER & ENGINE
-- ============================================================================
INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, sort_order
) VALUES (
  'cold-air-intake',
  'Cold Air Intake (CAI)',
  'cold-air-intake',
  'power-engine',
  'Replaces restrictive factory airbox with free-flowing intake',
  '$200 - $500',
  200, 500,
  'Easy',
  '30-60 minutes',
  'A cold air intake replaces your car''s stock airbox with a larger, less restrictive system that draws cooler air from outside the engine bay. Cold air is denser, meaning more oxygen molecules per gulp, which allows for more efficient combustion and more power.',
  'The factory airbox is designed with noise reduction and emissions as priorities. A CAI prioritizes airflow, using a high-flow filter and smooth tubing to deliver cooler, denser air to your engine.',
  '{"hp": "5-15 hp", "torque": "5-10 lb-ft", "note": "Gains vary significantly by car. Turbocharged cars often see larger gains."}'::jsonb,
  '["Improved throttle response", "Better engine sound (more intake growl)", "Usually bolt-on, no permanent modifications", "Often improves fuel economy slightly"]'::jsonb,
  '["May void warranty if dealership is strict", "Some designs can draw in hot air, reducing benefits", "Filter requires cleaning/replacement", "Minimal gains without supporting mods or tune"]'::jsonb,
  '["All cars", "First modification for enthusiasts"]'::jsonb,
  '["ECU tune", "Exhaust upgrades", "Throttle body upgrade"]'::jsonb,
  'Look for designs that actually draw cold air from outside the engine bay. Some "short ram" intakes actually pull hot air and can hurt performance.',
  10
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  expected_gains = EXCLUDED.expected_gains,
  updated_at = NOW();

INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, sort_order
) VALUES (
  'high-flow-air-filter',
  'High-Flow Air Filter',
  'high-flow-air-filter',
  'power-engine',
  'Drop-in replacement filter with better flow than stock',
  '$40 - $80',
  40, 80,
  'Easy',
  '5-10 minutes',
  'A high-flow air filter is a direct replacement for your factory filter that allows more air to pass through while still filtering contaminants. Brands like K&N and AEM offer reusable filters that can be cleaned and re-oiled.',
  'Stock paper filters prioritize filtration over flow. High-flow filters use oiled cotton or foam media that allows more air through while still capturing harmful particles.',
  '{"hp": "1-5 hp", "torque": "2-5 lb-ft", "note": "Modest gains, but improves airflow for other mods."}'::jsonb,
  '["Cheapest power modification", "Reusable - never buy filters again", "No check engine lights", "Zero warranty concerns"]'::jsonb,
  '["Minimal power gains alone", "Requires periodic cleaning and re-oiling", "Over-oiling can contaminate MAF sensor"]'::jsonb,
  '["Budget builds", "First-time modifiers"]'::jsonb,
  '["Any modification"]'::jsonb,
  'Don''t over-oil the filter - excess oil can contaminate your MAF sensor and cause issues.',
  20
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, sort_order
) VALUES (
  'throttle-body',
  'Throttle Body Upgrade',
  'throttle-body',
  'power-engine',
  'Larger throttle body for improved high-RPM airflow',
  '$250 - $600',
  250, 600,
  'Moderate',
  '1-2 hours',
  'An upgraded throttle body has a larger bore diameter than stock, allowing more air to enter the engine at wide-open throttle. This is most beneficial on cars that are already modified and need more air.',
  'The throttle body controls how much air enters your engine. A larger bore means more air can flow at full throttle, supporting additional power from other modifications.',
  '{"hp": "5-15 hp (with supporting mods)", "torque": "5-10 lb-ft", "note": "Benefits increase when combined with intake, exhaust, and tune."}'::jsonb,
  '["Sharper throttle response", "Supports high-power builds", "Usually bolt-on installation"]'::jsonb,
  '["Limited gains on stock engines", "May require ECU tune for best results", "Not worth it as a standalone mod"]'::jsonb,
  '["Cars with other bolt-ons", "High-RPM builds"]'::jsonb,
  '["Cold air intake", "Ported intake manifold", "ECU tune"]'::jsonb,
  'On a stock engine, the throttle body is rarely the restriction. This mod shines when combined with other airflow improvements.',
  30
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

-- ============================================================================
-- EXHAUST & SOUND
-- ============================================================================
INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, sort_order
) VALUES (
  'cat-back-exhaust',
  'Cat-Back Exhaust System',
  'cat-back-exhaust',
  'exhaust-sound',
  'Complete exhaust from catalytic converter back, improved flow and sound',
  '$500 - $2,000',
  500, 2000,
  'Moderate',
  '2-4 hours',
  'A cat-back exhaust replaces everything from the catalytic converter to the tailpipe. This includes the mid-pipe, resonator (or resonator delete), muffler, and tips. It''s the most popular exhaust modification because it significantly improves sound while adding some power.',
  'Stock exhausts are designed for noise reduction first, flow second. Cat-backs use larger diameter piping and less restrictive mufflers to reduce back pressure while giving your car a more aggressive voice.',
  '{"hp": "5-15 hp", "torque": "5-10 lb-ft", "note": "Sound improvement is the main benefit. Power gains are modest on naturally aspirated cars."}'::jsonb,
  '["Significant sound improvement", "Legal in all 50 states (keeps catalytic converter)", "Usually bolt-on installation", "Weight reduction from lighter materials"]'::jsonb,
  '["Can be droney on highway if poorly designed", "Some systems are too loud for daily driving", "Quality varies significantly by brand"]'::jsonb,
  '["All enthusiasts", "Daily drivers who want better sound"]'::jsonb,
  '["Headers/downpipe", "ECU tune", "Intake"]'::jsonb,
  'Research sound clips before buying! What sounds great on YouTube might be too loud or droney in person. Valved exhausts offer the best of both worlds.',
  10
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, applicable_car_types, sort_order
) VALUES (
  'downpipe',
  'Downpipe (Turbocharged Cars)',
  'downpipe',
  'exhaust-sound',
  'Larger diameter pipe from turbo to exhaust, major power gains',
  '$300 - $1,000',
  300, 1000,
  'Hard',
  '2-4 hours',
  'On turbocharged cars, the downpipe connects the turbocharger to the rest of the exhaust. The stock downpipe is often very restrictive. An upgraded downpipe with a high-flow catalytic converter (or catless for track use) is one of the best power mods for turbo cars.',
  'The turbocharger is driven by exhaust gases. Any restriction after the turbo (like a small downpipe) creates back pressure that the turbo has to fight against. A larger, smoother downpipe lets exhaust gases exit faster, allowing the turbo to spool quicker and make more power.',
  '{"hp": "25-50 hp (with tune)", "torque": "40-60 lb-ft (with tune)", "note": "One of the best mods for turbocharged cars. Requires tune for full benefit."}'::jsonb,
  '["Significant power gains on turbo cars", "Faster turbo spool", "Deeper exhaust note"]'::jsonb,
  '["Catless versions are not street legal", "May throw check engine light without tune", "Installation can be difficult (tight spaces)"]'::jsonb,
  '["Turbocharged cars only"]'::jsonb,
  '["ECU tune (required)", "Intake", "Intercooler"]'::jsonb,
  'A downpipe without a tune will throw a check engine light and won''t realize full gains. Budget for both together.',
  '["turbo"]'::jsonb,
  20
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, sort_order
) VALUES (
  'resonator-delete',
  'Resonator Delete',
  'resonator-delete',
  'exhaust-sound',
  'Removes resonator for louder, more aggressive sound',
  '$50 - $200',
  50, 200,
  'Easy',
  '1 hour',
  'A resonator delete removes the resonator from your exhaust and replaces it with a straight pipe. The resonator''s job is to cancel out certain frequencies - removing it makes the exhaust louder and often raspier.',
  'Resonators are tuned chambers that cancel specific sound frequencies. Removing them lets those frequencies through, changing the exhaust tone and increasing volume.',
  '{"hp": "0-5 hp", "torque": "0-5 lb-ft", "note": "This is primarily a sound modification. Power gains are minimal."}'::jsonb,
  '["Very affordable", "Louder, more aggressive sound", "Reversible if you don''t like it", "Slight weight reduction"]'::jsonb,
  '["Can add drone at highway speeds", "May make exhaust too loud or raspy", "Minimal performance benefit"]'::jsonb,
  '["Budget sound improvement", "Track cars"]'::jsonb,
  '["Muffler delete", "Cat-back exhaust"]'::jsonb,
  'Try this before committing to a full exhaust system. It''s cheap and reversible, so you can test if you like a louder car.',
  30
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

-- ============================================================================
-- ELECTRONICS & TUNING
-- ============================================================================
INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, sort_order
) VALUES (
  'ecu-tune',
  'ECU Tune (Remap)',
  'ecu-tune',
  'electronics-tuning',
  'Optimizes engine computer for more power and better response',
  '$400 - $1,500',
  400, 1500,
  'Professional',
  '1-3 hours',
  'An ECU tune modifies the software in your car''s engine computer to optimize fuel delivery, ignition timing, boost pressure (on turbo cars), and other parameters. It''s often called "the best bang for your buck" because it unlocks power the factory left on the table.',
  'Factory tunes are conservative to account for poor fuel quality, extreme temperatures, and minimal maintenance. A performance tune assumes you''ll use good fuel and maintain your car, allowing more aggressive timing and fueling.',
  '{"hp": "15-30 hp (NA) / 40-100+ hp (turbo)", "torque": "15-30 lb-ft (NA) / 50-100+ lb-ft (turbo)", "note": "Gains vary by platform. Turbocharged cars see dramatic improvements."}'::jsonb,
  '["Significant power gains", "Improved throttle response", "Can improve fuel economy", "Removes factory limiters", "Can be reverted to stock"]'::jsonb,
  '["Will void powertrain warranty", "Requires premium fuel on most tunes", "Bad tunes can damage engine", "Some states have emissions concerns"]'::jsonb,
  '["Best first mod for turbo cars", "Great value for all cars"]'::jsonb,
  '["All bolt-ons (intake, exhaust, downpipe)"]'::jsonb,
  'Only use reputable tuners with experience on your platform. Cheap tunes can be dangerous. Expect to pay more for quality.',
  10
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, applicable_car_types, sort_order
) VALUES (
  'piggyback-tune',
  'Piggyback Tuner',
  'piggyback-tune',
  'electronics-tuning',
  'Plug-and-play device that modifies ECU signals',
  '$400 - $700',
  400, 700,
  'Easy',
  '30-60 minutes',
  'A piggyback tuner intercepts and modifies signals going to and from the ECU without permanently changing the ECU itself. Popular options include JB4, Burger Motorsports, and similar devices. They''re great for people who want gains without voiding warranty.',
  'Instead of rewriting the ECU software, piggybacks intercept sensor signals (like boost pressure or fuel maps) and modify them on the fly. The ECU thinks it''s seeing normal values while the engine gets optimized parameters.',
  '{"hp": "30-60 hp (turbo cars)", "torque": "40-80 lb-ft (turbo cars)", "note": "Most effective on turbocharged cars. NA benefits are minimal."}'::jsonb,
  '["Plug-and-play installation", "Undetectable by dealership", "Can be removed before service", "Good power gains"]'::jsonb,
  '["Less customization than full tune", "Turbo cars only for significant gains", "Still technically warranty-voiding if caught"]'::jsonb,
  '["Leased vehicles", "Warranty-conscious owners", "DIY enthusiasts"]'::jsonb,
  '["Downpipe", "Intake", "Intercooler"]'::jsonb,
  'Popular for BMW, VW/Audi, and other European turbo cars. Remove before dealer service to avoid detection.',
  '["turbo"]'::jsonb,
  20
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, applicable_car_types, sort_order
) VALUES (
  'hpfp-upgrade',
  'High-Pressure Fuel Pump (HPFP)',
  'hpfp-upgrade',
  'electronics-tuning',
  'Upgraded fuel pump for more fueling capacity',
  '$300 - $800',
  300, 800,
  'Moderate',
  '2-4 hours',
  'On direct-injection turbo cars, the high-pressure fuel pump is often the limiting factor for power. An upgraded HPFP can deliver more fuel at higher pressures, supporting bigger turbos and more aggressive tunes.',
  'Direct injection engines need extremely high fuel pressure (2,000+ PSI). The stock pump is sized for factory power levels. Upgraded internals allow higher flow and pressure to match increased air from turbo upgrades.',
  '{"hp": "Enables 50-150+ additional hp with supporting mods", "torque": "Varies with tune", "note": "This is a supporting mod - it enables other upgrades to work."}'::jsonb,
  '["Removes fueling limitation", "Required for high-power builds", "Usually bolt-on"]'::jsonb,
  '["No gains on its own", "Only needed for aggressive builds", "Platform-specific parts"]'::jsonb,
  '["High-power turbo builds", "E85 conversions"]'::jsonb,
  '["Upgraded turbo", "Aggressive tune", "E85 fuel"]'::jsonb,
  'You don''t need this for basic bolt-ons. It''s for builds exceeding 400-500+ hp on most platforms.',
  '["turbo"]'::jsonb,
  30
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

-- ============================================================================
-- SUSPENSION & HANDLING
-- ============================================================================
INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, sort_order
) VALUES (
  'lowering-springs',
  'Lowering Springs',
  'lowering-springs',
  'suspension-handling',
  'Drops ride height and stiffens suspension affordably',
  '$200 - $500',
  200, 500,
  'Moderate',
  '2-4 hours (with spring compressor)',
  'Lowering springs replace your stock springs with shorter, stiffer springs that lower the car 1-2 inches. This lowers the center of gravity, improves appearance, and provides modest handling improvements.',
  'Shorter springs compress less, so the car sits lower. Stiffer spring rates reduce body roll and improve turn-in response. The lower center of gravity improves cornering ability.',
  '{"handling": "Moderate improvement", "note": "Primarily an appearance and handling mod. Expect 10-20% stiffer ride."}'::jsonb,
  '["Affordable handling improvement", "Better appearance", "Lower center of gravity", "Works with stock shocks (initially)"]'::jsonb,
  '["Accelerates stock shock wear", "Fixed drop - no adjustability", "Can be too stiff for daily driving", "May cause rubbing with wrong wheel setup"]'::jsonb,
  '["Budget builds", "Appearance-focused builds"]'::jsonb,
  '["Upgraded shocks/struts", "Sway bars"]'::jsonb,
  'Quality matters. Cheap springs can sag over time. Plan to replace shocks within 20-30k miles.',
  10
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, sort_order
) VALUES (
  'coilovers',
  'Coilovers',
  'coilovers',
  'suspension-handling',
  'Complete adjustable suspension system',
  '$1,000 - $5,000+',
  1000, 5000,
  'Moderate',
  '4-8 hours',
  'Coilovers are complete shock and spring assemblies that allow adjustment of ride height and (on better units) damping. They''re the gold standard for anyone serious about handling because they let you dial in the exact setup you want.',
  'Coilovers use a threaded body that allows ride height adjustment. Better units add adjustable damping (how fast the shock compresses and rebounds). This lets you tune the suspension for street comfort or track performance.',
  '{"handling": "Significant improvement", "note": "Transform handling characteristics. Worth the investment for serious drivers."}'::jsonb,
  '["Adjustable ride height", "Adjustable damping (on quality units)", "Dramatic handling improvement", "Corner balance capability", "Long service life on quality units"]'::jsonb,
  '["Expensive for quality units", "Cheap coilovers can be worse than stock", "Requires alignment after install", "Learning curve to dial in"]'::jsonb,
  '["Track enthusiasts", "Serious handling builds"]'::jsonb,
  '["Sway bars", "Control arms", "Chassis bracing"]'::jsonb,
  'Don''t cheap out here. $500 coilovers are usually worse than stock. Budget $1,500+ for quality street units, $3,000+ for track-capable.',
  20
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, sort_order
) VALUES (
  'sway-bars',
  'Sway Bars (Anti-Roll Bars)',
  'sway-bars',
  'suspension-handling',
  'Reduces body roll for flatter cornering',
  '$400 - $1,200',
  400, 1200,
  'Moderate',
  '2-4 hours per bar',
  'Upgraded sway bars are stiffer than stock and reduce body roll in corners. Adjustable sway bars let you fine-tune handling balance between understeer and oversteer.',
  'Sway bars connect the left and right suspension. When you corner and the body rolls, the bar twists and pushes back, reducing roll. Stiffer bars = less roll. Adjustability lets you tune front-to-rear balance.',
  '{"handling": "Moderate to significant improvement", "note": "One of the best handling mods for the money. Changes driving feel noticeably."}'::jsonb,
  '["Significant handling improvement", "Adjustable balance (adjustable bars)", "Works with stock or upgraded suspension", "Relatively affordable"]'::jsonb,
  '["Can make ride slightly harsher", "Too stiff can upset handling", "Requires understanding of balance to tune"]'::jsonb,
  '["Canyon carvers", "Track day enthusiasts"]'::jsonb,
  '["Coilovers", "End links", "Performance alignment"]'::jsonb,
  'Start with rear bar only if your car understeers, or front + rear if balanced. Don''t go too aggressive on street cars.',
  30
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

-- ============================================================================
-- BRAKES
-- ============================================================================
INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, sort_order
) VALUES (
  'brake-pads',
  'Performance Brake Pads',
  'brake-pads',
  'brakes',
  'Better stopping power and heat resistance',
  '$100 - $400',
  100, 400,
  'Moderate',
  '1-2 hours',
  'Upgraded brake pads use different friction materials than stock pads to provide more bite, better heat resistance, or both. They range from mild street upgrades to full race compounds.',
  'Brake pads create friction against the rotor to slow the car. Different friction materials have different characteristics - some bite harder, some handle heat better, some dust less.',
  '{"stopping": "10-30% shorter stopping distances", "fadeResistance": "Significant improvement on track pads", "note": "Match pad compound to your use case. Track pads can be dangerous on cold streets."}'::jsonb,
  '["Improved stopping power", "Better pedal feel", "Fade resistance for spirited driving", "Easy DIY installation"]'::jsonb,
  '["High-performance pads may squeal", "Some compounds dust heavily", "Track pads don''t work well cold", "Shorter lifespan than stock"]'::jsonb,
  '["All enthusiasts", "Track day participants"]'::jsonb,
  '["Upgraded rotors", "High-temp brake fluid", "Stainless brake lines"]'::jsonb,
  'Match compound to use. Street/track pads offer best compromise. Pure track pads can be dangerous on cold morning commutes.',
  10
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, sort_order
) VALUES (
  'big-brake-kit',
  'Big Brake Kit (BBK)',
  'big-brake-kit',
  'brakes',
  'Larger rotors and calipers for maximum stopping power',
  '$2,000 - $6,000+',
  2000, 6000,
  'Hard',
  '4-8 hours',
  'A big brake kit replaces your stock brakes with larger rotors and multi-piston calipers. This dramatically improves stopping power, heat capacity, and brake feel - essential for track use or high-power builds.',
  'Larger rotors provide more leverage for stopping, more mass to absorb heat, and more surface area for cooling. Multi-piston calipers provide more even pad pressure for better feel and performance.',
  '{"stopping": "20-40% shorter stopping distances", "fadeResistance": "Dramatic improvement", "note": "Transforms braking from good to exceptional. Required for serious track cars."}'::jsonb,
  '["Dramatically improved stopping power", "Excellent heat capacity for track use", "Great pedal feel", "Looks impressive behind wheels"]'::jsonb,
  '["Expensive", "May require larger wheels to fit", "Overkill for street-only use", "Heavier than stock on some kits"]'::jsonb,
  '["Track cars", "High-power builds", "Heavy braking use"]'::jsonb,
  '["Track brake pads", "High-temp fluid", "Brake cooling ducts"]'::jsonb,
  'Check wheel clearance before buying. Most BBKs require 18"+ wheels. Quality kits from Brembo, StopTech, AP Racing are worth the money.',
  20
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, sort_order
) VALUES (
  'brake-fluid',
  'High-Temperature Brake Fluid',
  'brake-fluid',
  'brakes',
  'Prevents brake fade from boiling fluid',
  '$20 - $50 per bottle',
  20, 50,
  'Moderate',
  '30-60 minutes',
  'High-temperature brake fluid has a higher boiling point than standard DOT 3/4 fluid. When brake fluid boils, you lose pedal pressure and braking ability. This is critical for track use.',
  'Brake fluid transmits pedal pressure to the calipers. When it gets too hot, it boils and creates air bubbles. Air is compressible, so your pedal goes soft and brakes fail. High-temp fluid resists this.',
  '{"boilingPoint": "450-600°F vs 300-400°F stock", "fadeResistance": "Significant improvement", "note": "Essential for track days. The difference between stopping and not stopping."}'::jsonb,
  '["Prevents dangerous brake fade", "Cheap insurance for track days", "Easy DIY with brake bleeding kit"]'::jsonb,
  '["Needs changing more frequently than stock", "Absorbs moisture over time (hygroscopic)", "Some racing fluids not street-legal"]'::jsonb,
  '["Track day participants", "Mountain road drivers"]'::jsonb,
  '["Stainless brake lines", "Performance pads"]'::jsonb,
  'Flush annually or before track events. Castrol SRF and Motul RBF 660 are popular choices.',
  30
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

-- ============================================================================
-- WHEELS & TIRES
-- ============================================================================
INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, sort_order
) VALUES (
  'performance-tires',
  'Performance Summer Tires',
  'performance-tires',
  'wheels-tires',
  'Stickier compound for significantly improved grip',
  '$600 - $1,500 for a set',
  600, 1500,
  'Easy',
  '1 hour',
  'Performance summer tires use softer, stickier rubber compounds and more aggressive tread patterns than all-season tires. They provide dramatically better grip but sacrifice tread life and cold-weather performance.',
  'Softer rubber compounds conform better to the road surface, creating more grip. The trade-off is faster wear and poor cold-weather performance (the rubber hardens when cold).',
  '{"grip": "20-40% improvement over all-seasons", "handling": "Transforms car feel", "note": "Often the single biggest handling upgrade you can make. Don''t underestimate tire quality."}'::jsonb,
  '["Dramatic grip improvement", "Better steering feel", "Shorter stopping distances", "Improved cornering speed"]'::jsonb,
  '["Shorter tread life than all-seasons", "Poor in cold weather (< 40°F)", "Cannot be used in snow", "Higher cost per mile"]'::jsonb,
  '["All enthusiasts in warm climates", "Summer-only drivers"]'::jsonb,
  '["Any handling modification"]'::jsonb,
  'The #1 handling upgrade. Good tires on a stock car beat mediocre tires on a modified car every time.',
  10
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, sort_order
) VALUES (
  '200tw-tires',
  '200TW Track Tires',
  '200tw-tires',
  'wheels-tires',
  'Semi-slick tires for maximum track grip',
  '$800 - $1,600 for a set',
  800, 1600,
  'Easy',
  '1 hour',
  '200 treadwear (200TW) tires are the stickiest street-legal tires available. They have minimal tread pattern and extremely soft compounds designed for autocross and track days. Popular choices include RE-71R, RT660, and Yoko A052.',
  'The treadwear rating indicates relative tire life - lower numbers mean softer, stickier compounds. 200TW is the minimum for street legality while maximizing grip.',
  '{"grip": "50-100% improvement over all-seasons", "lapTimes": "2-5 seconds per lap on most tracks", "note": "The ultimate in street-legal grip. Transform your car''s track performance."}'::jsonb,
  '["Maximum street-legal grip", "Dramatically faster lap times", "Better turn-in and feedback"]'::jsonb,
  '["Very short tread life (5-15k miles)", "Loud on highway", "Expensive per mile", "Poor wet performance when worn"]'::jsonb,
  '["Track day enthusiasts", "Autocross competitors"]'::jsonb,
  '["Suspension upgrades", "Brake upgrades", "Alignment setup"]'::jsonb,
  'Many people run these only for track days and swap to street tires for daily driving.',
  20
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, sort_order
) VALUES (
  'lightweight-wheels',
  'Lightweight Wheels',
  'lightweight-wheels',
  'wheels-tires',
  'Reduces unsprung and rotational mass for better handling',
  '$1,500 - $4,000 for a set',
  1500, 4000,
  'Easy',
  '1-2 hours',
  'Lightweight wheels reduce unsprung mass (weight the suspension has to control) and rotational mass (weight the engine has to spin up). This improves acceleration, braking, and suspension response.',
  'Less weight at the wheels means the suspension can react faster to bumps, the brakes don''t have to slow as much mass, and the engine doesn''t work as hard to accelerate the wheels.',
  '{"handling": "Noticeable improvement", "acceleration": "Slight improvement", "note": "Feels like you added power and upgraded suspension. Transformation in feel."}'::jsonb,
  '["Better acceleration and braking", "Improved suspension response", "Better steering feel", "Looks great"]'::jsonb,
  '["Expensive for quality", "More prone to damage than steel/heavy wheels", "May not fit big brake kits"]'::jsonb,
  '["Track enthusiasts", "Handling-focused builds"]'::jsonb,
  '["Performance tires", "Suspension upgrades", "Big brake kits"]'::jsonb,
  'Quality matters. Cheap lightweight wheels can bend or crack. Brands like Enkei, Apex, Titan7 offer strength with weight savings.',
  30
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

-- ============================================================================
-- COOLING
-- ============================================================================
INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, sort_order
) VALUES (
  'oil-cooler',
  'Oil Cooler',
  'oil-cooler',
  'cooling',
  'Keeps oil temperature in check during hard driving',
  '$500 - $1,500',
  500, 1500,
  'Hard',
  '4-8 hours',
  'An oil cooler is a radiator for your engine oil. During track days or spirited driving, oil temperatures can exceed safe limits, reducing lubrication and accelerating wear. An oil cooler keeps temps in check.',
  'Hot oil from the engine passes through a heat exchanger (like a small radiator) mounted in the airflow, usually in front of the main radiator or in the bumper.',
  '{"oilTemp": "20-40°F reduction under load", "reliability": "Significant for track use", "note": "No power gains, but critical for engine longevity under stress."}'::jsonb,
  '["Essential for track reliability", "Protects engine during hard use", "Maintains oil viscosity"]'::jsonb,
  '["No performance gains directly", "Complex installation", "Takes up front bumper space"]'::jsonb,
  '["Track day enthusiasts", "Hot climate owners"]'::jsonb,
  '["Transmission cooler", "Upgraded radiator"]'::jsonb,
  'Check your oil temps before buying. If you''re not seeing 250°F+ at the track, you may not need this.',
  10
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

INSERT INTO upgrade_education (
  key, name, slug, category, short_description, cost_range, cost_low, cost_high,
  difficulty, install_time, full_description, how_it_works, expected_gains,
  pros, cons, best_for, works_well_with, considerations, applicable_car_types, sort_order
) VALUES (
  'intercooler',
  'Upgraded Intercooler (Turbo Cars)',
  'intercooler',
  'cooling',
  'Better cooling for turbo charge air, more consistent power',
  '$500 - $2,000',
  500, 2000,
  'Moderate',
  '3-6 hours',
  'On turbocharged cars, the intercooler cools compressed air from the turbo before it enters the engine. Cooler air is denser and makes more power. An upgraded intercooler provides better cooling and maintains power during hard driving.',
  'Turbochargers heat air during compression (physics). Hot air is less dense and makes less power. The intercooler is a heat exchanger that cools this air. A bigger, more efficient one keeps air cooler.',
  '{"hp": "10-25 hp (by maintaining power)", "consistency": "Eliminates heat soak", "note": "Won''t make more peak power, but maintains it consistently."}'::jsonb,
  '["Consistent power on hot days", "Eliminates heat soak between runs", "Can support more boost safely"]'::jsonb,
  '["No gains at peak (only sustained)", "Can increase turbo lag slightly", "May require bumper modification"]'::jsonb,
  '["Track-focused turbo cars", "Hot climate turbo owners"]'::jsonb,
  '["ECU tune", "Downpipe", "Intake"]'::jsonb,
  'If your car feels slower after a few hard pulls, you need this. Heat soak is the enemy.',
  '["turbo"]'::jsonb,
  20
) ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  short_description = EXCLUDED.short_description,
  full_description = EXCLUDED.full_description,
  updated_at = NOW();

-- ============================================================================
-- Success Message
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Upgrade Education seed data loaded successfully!';
  RAISE NOTICE 'Total upgrades: %', (SELECT COUNT(*) FROM upgrade_education);
END $$;







