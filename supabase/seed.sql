-- SuperNatural Motorsports - Database Seed Data
-- 
-- This file contains INSERT statements to populate the cars table with the full database.
-- Run this in the Supabase SQL Editor AFTER running schema.sql.

-- Clear existing data (optional - uncomment if needed)
-- TRUNCATE TABLE cars CASCADE;

INSERT INTO cars (slug, name, years, tier, category, score_sound, score_interior, score_track, score_reliability, score_value, score_driver_fun, score_aftermarket, engine, hp, trans, price_range, price_avg, drivetrain, notes, highlight, tagline, pros, cons, best_for)
VALUES
-- ============================================================================
-- PREMIUM TIER ($75K+)
-- ============================================================================
('718-cayman-gt4', '718 Cayman GT4', '2020-2024', 'premium', 'Mid-Engine', 9, 8, 10, 9, 6, 10, 6, '4.0L NA Flat-6', 414, '6MT/7PDK', '$85-100K', 92500, 'RWD', 'Track-ready, future classic. The ultimate 718.', 'Best track weapon', 'Track-ready mid-engine scalpel', '["NA flat-6 sounds incredible", "Race-bred chassis", "Manual transmission available", "Strong resale"]'::jsonb, '["Firm ride on street", "Premium pricing", "Limited cargo space"]'::jsonb, '["Track days", "Canyon carving", "Collector"]'::jsonb),

('718-cayman-gts-40', '718 Cayman GTS 4.0', '2020-2024', 'premium', 'Mid-Engine', 9, 8, 9, 9, 5, 10, 6, '4.0L NA Flat-6', 394, '6MT/7PDK', '$90-100K', 95000, 'RWD', 'GT4 engine, softer street setup. Perfect balance.', 'Best premium all-rounder', 'The daily-able GT4', '["Same engine as GT4", "More street-friendly", "Excellent build quality"]'::jsonb, '["Expensive for a Cayman", "Less track-focused than GT4"]'::jsonb, '["Daily + weekend track", "Canyon roads", "All-rounder"]'::jsonb),

('audi-r8-v8', 'Audi R8 V8', '2008-2015', 'premium', 'Mid-Engine', 8, 8, 7, 8, 7, 8, 6, '4.2L V8', 430, '6MT/R-Tronic', '$65-85K', 75000, 'AWD', 'Everyday supercar. Audi reliability, exotic looks.', 'Most livable exotic', 'The everyday supercar', '["AWD confidence", "Audi reliability", "Timeless design", "Gated manual available"]'::jsonb, '["Not as raw as rivals", "R-tronic can be clunky"]'::jsonb, '["Daily exotic", "All-weather performance", "First supercar"]'::jsonb),

('audi-r8-v10', 'Audi R8 V10', '2010-2015', 'premium', 'Mid-Engine', 9, 8, 8, 7, 6, 9, 6, '5.2L V10', 525, '6MT/S-Tronic', '$75-100K', 87500, 'AWD', 'Lambo Gallardo platform, civilized daily supercar.', 'Best exotic value', 'Lambo heart, Audi soul', '["V10 soundtrack", "AWD traction", "More exotic than V8", "Shared Gallardo DNA"]'::jsonb, '["Higher running costs than V8", "Slightly heavier"]'::jsonb, '["Exotic daily", "Sound enthusiast", "AWD supercar"]'::jsonb),

('lamborghini-gallardo', 'Lamborghini Gallardo', '2004-2014', 'premium', 'Mid-Engine', 10, 6, 7, 5, 5, 9, 4, '5.0-5.2L V10', 520, '6MT/E-Gear', '$85-100K', 92500, 'AWD', 'V10 screamer. True exotic presence. Higher running costs.', 'Most exotic', 'True Italian exotic presence', '["Screaming V10", "True exotic presence", "Gated manual available", "Appreciating values"]'::jsonb, '["Expensive maintenance", "E-Gear reliability", "Dated interior"]'::jsonb, '["Weekend exotic", "Show stopper", "Sound enthusiast"]'::jsonb),

('lotus-emira', 'Lotus Emira', '2022-2024', 'premium', 'Mid-Engine', 7, 8, 9, 7, 6, 10, 4, '3.5L SC V6', 400, '6MT/Auto', '$85-100K', 92500, 'RWD', 'Last Lotus with ICE. Modern interior, pure handling.', 'Best new Lotus', 'The last pure Lotus', '["Modern interior finally", "Lotus handling DNA", "Toyota engine reliability", "Manual available"]'::jsonb, '["Limited dealer network", "New model uncertainties", "Not as raw as older Lotus"]'::jsonb, '["Driving purist", "Canyon roads", "Modern classic seeker"]'::jsonb),

('dodge-viper', 'Dodge Viper', '2013-2017', 'premium', 'Front-Engine', 10, 5, 9, 7, 6, 10, 7, '8.4L V10', 645, '6MT', '$70-100K', 85000, 'RWD', '8.4L V10, manual only. Raw American brutality.', 'Most visceral', '8.4 liters of American fury', '["Massive V10", "Manual only", "Incredible track times", "Appreciating classic"]'::jsonb, '["Demanding to drive", "Hot cabin", "Requires respect"]'::jsonb, '["Thrill seeker", "Track days", "Analog purist"]'::jsonb),

-- ============================================================================
-- UPPER-MID TIER ($55K-75K)
-- ============================================================================
('c8-corvette-stingray', 'C8 Corvette Stingray', '2020-2024', 'upper-mid', 'Mid-Engine', 7, 7, 9, 8, 10, 8, 9, '6.2L V8', 490, '8DCT', '$55-75K', 65000, 'RWD', 'Mid-engine supercar at sports car money. Incredible value.', 'Best performance per dollar', 'Supercar performance, sports car price', '["Mid-engine layout", "Supercar looks", "Incredible value", "Daily drivable"]'::jsonb, '["No manual option", "Interior quirks", "Dealer markups"]'::jsonb, '["Value seeker", "Daily driver", "Track days on budget"]'::jsonb),

('981-cayman-gts', '981 Cayman GTS', '2015-2016', 'upper-mid', 'Mid-Engine', 8, 8, 9, 9, 6, 10, 7, '3.4L NA Flat-6', 340, '6MT/7PDK', '$55-70K', 62500, 'RWD', 'Last NA mid-engine Porsche. Peak 981 experience.', 'Best driver''s Porsche', 'Peak naturally-aspirated Porsche', '["NA flat-6", "Perfect chassis balance", "Future collectible", "Manual available"]'::jsonb, '["Appreciating values", "Less power than 718"]'::jsonb, '["Driving purist", "Future collector", "Canyon carving"]'::jsonb),

('991-1-carrera-s', '991.1 Carrera S', '2012-2016', 'upper-mid', 'Rear-Engine', 8, 8, 7, 8, 5, 9, 7, '3.8L NA Flat-6', 400, '7MT/7PDK', '$55-80K', 67500, 'RWD', 'Last NA 911. Iconic presence, tiny rear seats.', 'Most iconic', 'The last naturally-aspirated 911', '["NA flat-6", "Iconic design", "Usable rear seats", "Strong resale"]'::jsonb, '["IMS bearing concerns (early)", "Expensive options"]'::jsonb, '["911 purist", "Daily + track", "Brand enthusiast"]'::jsonb),

('997-2-carrera-s', '997.2 Carrera S', '2009-2012', 'upper-mid', 'Rear-Engine', 8, 7, 7, 8, 6, 9, 7, '3.8L NA Flat-6', 385, '6MT/7PDK', '$50-70K', 60000, 'RWD', 'Classic 911, hydraulic steering. Timeless design.', 'Best classic 911', 'Hydraulic steering perfection', '["Hydraulic steering", "More analog feel", "Reliable DFI engine", "Timeless looks"]'::jsonb, '["Older tech interior", "Narrower body"]'::jsonb, '["911 purist", "Driving enthusiast", "Classic collector"]'::jsonb),

('nissan-gt-r', 'Nissan GT-R', '2009-2020', 'upper-mid', 'Front-Engine', 7, 5, 9, 7, 7, 8, 9, '3.8L TT V6', 545, '6DCT', '$55-75K', 65000, 'AWD', 'AWD tech monster. Brutal acceleration. Dated interior.', 'Fastest in class', 'AWD tech monster', '["Brutal acceleration", "AWD grip", "Huge tuning potential", "JDM icon"]'::jsonb, '["Dated interior", "Heavy", "Expensive transmission service"]'::jsonb, '["Tuner", "All-weather speed", "Tech enthusiast"]'::jsonb),

('shelby-gt500', 'Shelby GT500', '2020-2022', 'upper-mid', 'Front-Engine', 9, 5, 9, 7, 7, 9, 10, '5.2L SC V8', 760, '7DCT', '$65-85K', 75000, 'RWD', '760hp monster. Most powerful Mustang ever.', 'Most powerful', '760 horsepower American muscle', '["760hp supercharged V8", "DCT shifts fast", "Massive aftermarket", "Collectible"]'::jsonb, '["No manual", "Thirsty", "Requires skill"]'::jsonb, '["Power junkie", "Drag racing", "Collector"]'::jsonb),

('lotus-evora-gt', 'Lotus Evora GT', '2020-2021', 'upper-mid', 'Mid-Engine', 7, 7, 9, 8, 6, 9, 4, '3.5L SC V6', 416, '6MT/Auto', '$70-90K', 80000, 'RWD', 'Toyota V6 reliability. Razor-sharp handling.', 'Most reliable exotic', 'Toyota reliability, Lotus handling', '["Toyota engine", "Incredible handling", "2+2 seating", "Manual available"]'::jsonb, '["Dated infotainment", "Limited dealer network"]'::jsonb, '["Reliable exotic seeker", "Handling purist", "Weekend warrior"]'::jsonb),

-- ============================================================================
-- MID TIER ($40K-55K)
-- ============================================================================
('981-cayman-s', '981 Cayman S', '2013-2016', 'mid', 'Mid-Engine', 7, 8, 9, 9, 7, 9, 7, '3.4L NA Flat-6', 325, '6MT/7PDK', '$40-55K', 47500, 'RWD', 'Mid-engine perfection. The benchmark sports car.', 'Best balanced package', 'The benchmark mid-engine sports car', '["Perfect balance", "NA flat-6", "Bulletproof reliability", "Great value"]'::jsonb, '["Less power than GTS", "Values rising"]'::jsonb, '["Balanced driving", "Daily + track", "First Porsche"]'::jsonb),

('shelby-gt350', 'Shelby GT350', '2016-2020', 'mid', 'Front-Engine', 10, 4, 9, 7, 6, 10, 10, '5.2L FP V8', 526, '6MT', '$45-65K', 55000, 'RWD', 'Flat-plane V8 screams to 8,250 RPM. Manual only.', 'Best sound', '8,250 RPM flat-plane fury', '["Best sounding V8", "Manual only", "Track capable", "Appreciating values"]'::jsonb, '["Engine issues on early cars", "Firm ride", "Mustang interior"]'::jsonb, '["Sound enthusiast", "Manual purist", "Track days"]'::jsonb),

('jaguar-f-type-r', 'Jaguar F-Type R', '2015-2020', 'mid', 'Front-Engine', 9, 9, 5, 4, 7, 7, 5, '5.0L SC V8', 550, '8AT', '$38-55K', 46500, 'RWD', '550hp supercharged V8. Gorgeous GT cruiser.', 'Best exhaust theater', 'British GT with V8 drama', '["Stunning looks", "V8 burbles and pops", "Luxurious interior", "Great value now"]'::jsonb, '["Reliability concerns", "Heavy", "Not a track car"]'::jsonb, '["Grand touring", "Sound enthusiast", "Style seeker"]'::jsonb),

('c7-corvette-grand-sport', 'C7 Corvette Grand Sport', '2017-2019', 'mid', 'Front-Engine', 8, 6, 9, 8, 9, 9, 10, '6.2L V8', 460, '7MT/8AT', '$45-60K', 52500, 'RWD', 'Z06 wide body, NA V8. Best C7 value for track.', 'Best American track car', 'Z06 chassis, NA reliability', '["Z06 handling package", "NA reliability", "Manual available", "Great value"]'::jsonb, '["Interior dated", "Visibility issues"]'::jsonb, '["Track days", "Value seeker", "American muscle"]'::jsonb),

('c7-corvette-z06', 'C7 Corvette Z06', '2015-2019', 'mid', 'Front-Engine', 9, 6, 10, 6, 8, 9, 10, '6.2L SC V8', 650, '7MT/8AT', '$50-70K', 60000, 'RWD', '650hp supercharged. Track beast. Watch for overheating.', 'Most track capable', 'Supercharged American track weapon', '["650hp supercharged", "Incredible grip", "Track weapon", "Manual available"]'::jsonb, '["Overheating issues", "Harsh ride", "Needs good tires"]'::jsonb, '["Track junkie", "Power enthusiast", "Modder"]'::jsonb),

('camaro-zl1', 'Camaro ZL1', '2017-2023', 'mid', 'Front-Engine', 9, 5, 9, 8, 9, 9, 10, '6.2L SC V8', 650, '6MT/10AT', '$45-60K', 52500, 'RWD', 'LT4 supercharged monster. Magnetic ride.', 'Best muscle car value', 'Supercharged muscle perfection', '["650hp LT4", "Magnetic ride", "Manual available", "Great value"]'::jsonb, '["Poor visibility", "Cramped interior", "Large size"]'::jsonb, '["Track days", "Daily muscle", "Value seeker"]'::jsonb),

('bmw-m2-competition', 'BMW M2 Competition', '2019-2021', 'mid', 'Front-Engine', 6, 7, 8, 7, 7, 8, 8, '3.0L TT I6', 405, '6MT/7DCT', '$50-65K', 57500, 'RWD', 'S55 engine from M3/M4. Compact, tossable, sharp.', 'Best compact sports car', 'M3 heart in compact form', '["S55 power", "Compact size", "Manual available", "Great handling"]'::jsonb, '["Pricey for size", "Firm ride", "Tight rear seats"]'::jsonb, '["City dweller", "Backroads", "Daily driver"]'::jsonb),

('alfa-romeo-4c', 'Alfa Romeo 4C', '2015-2020', 'mid', 'Mid-Engine', 7, 5, 8, 5, 6, 9, 4, '1.75L Turbo I4', 237, '6DCT', '$45-60K', 52500, 'RWD', 'Carbon tub, under 2,500 lbs. Unassisted steering.', 'Most exotic lightweight', 'Carbon fiber Italian exotic', '["Carbon tub", "Under 2,500 lbs", "Unassisted steering", "Exotic looks"]'::jsonb, '["No power steering", "Cramped cabin", "Alfa reliability"]'::jsonb, '["Lightweight purist", "Weekend warrior", "Collector"]'::jsonb),

('aston-martin-v8-vantage', 'Aston Martin V8 Vantage', '2008-2017', 'mid', 'Front-Engine', 8, 7, 5, 4, 4, 7, 3, '4.7L V8', 420, '6MT/7AT', '$48-65K', 56500, 'RWD', 'Exotic presence, gorgeous. High maintenance.', 'Most prestigious', 'British exotic elegance', '["Stunning design", "Great sound", "Manual available", "Exotic presence"]'::jsonb, '["High maintenance costs", "Dated tech", "Depreciation"]'::jsonb, '["Style seeker", "Grand touring", "Prestige buyer"]'::jsonb),

('lotus-evora-s', 'Lotus Evora S', '2010-2015', 'mid', 'Mid-Engine', 7, 6, 8, 8, 7, 9, 4, '3.5L SC V6', 345, '6MT/Auto', '$42-58K', 50000, 'RWD', 'Toyota reliability, Lotus handling. Underrated.', 'Most underrated', 'The underrated handling king', '["Toyota engine", "Lotus handling", "2+2 seating", "Under the radar"]'::jsonb, '["Cramped interior", "Basic infotainment", "Limited dealers"]'::jsonb, '["Handling enthusiast", "Reliable exotic seeker", "Canyon carving"]'::jsonb),

('lexus-lc-500', 'Lexus LC 500', '2018-2024', 'mid', 'Front-Engine', 8, 10, 4, 10, 5, 5, 4, '5.0L V8', 471, '10AT', '$52-70K', 61000, 'RWD', 'Stunning grand tourer. Best interior on the list.', 'Best interior', 'Rolling work of art', '["Stunning design", "Best interior", "Lexus reliability", "NA V8"]'::jsonb, '["Heavy", "Not sporty", "Expensive new"]'::jsonb, '["Grand touring", "Comfort seeker", "Reliability priority"]'::jsonb),

-- ============================================================================
-- BUDGET TIER ($25K-40K)
-- ============================================================================
('987-2-cayman-s', '987.2 Cayman S', '2009-2012', 'budget', 'Mid-Engine', 7, 7, 8, 9, 8, 9, 7, '3.4L NA Flat-6', 320, '6MT/7PDK', '$32-45K', 38500, 'RWD', 'Older but still brilliant. Great entry Porsche.', 'Best entry Porsche', 'Porsche perfection on a budget', '["Mid-engine balance", "NA flat-6", "Bulletproof reliability", "Affordable entry"]'::jsonb, '["Older interior tech", "Less power than 981"]'::jsonb, '["First Porsche", "Budget track car", "Driving enthusiast"]'::jsonb),

('jaguar-f-type-v6-s', 'Jaguar F-Type V6 S', '2014-2020', 'budget', 'Front-Engine', 8, 9, 6, 4, 9, 8, 5, '3.0L SC V6', 380, '8AT', '$27-40K', 33500, 'RWD', 'Gorgeous, crackles and pops. Incredible value.', 'Best bang for buck', 'Supercharged British drama', '["Stunning looks", "Great exhaust pops", "Luxurious", "Incredible depreciation value"]'::jsonb, '["Reliability concerns", "Expensive repairs", "Not a track car"]'::jsonb, '["Style seeker", "Sound enthusiast", "Value hunter"]'::jsonb),

('lexus-rc-f', 'Lexus RC F', '2015-2022', 'budget', 'Front-Engine', 7, 6, 5, 10, 9, 6, 5, '5.0L V8', 467, '8AT', '$28-45K', 36500, 'RWD', 'Bulletproof 5.0L V8. Zero drama ownership.', 'Most reliable', 'Bulletproof V8 performance', '["Lexus reliability", "NA V8", "Comfortable GT", "Zero drama"]'::jsonb, '["Heavy", "Not engaging", "Dated infotainment"]'::jsonb, '["Reliability priority", "Daily driver", "Low-stress ownership"]'::jsonb),

('nissan-370z-nismo', 'Nissan 370Z NISMO', '2009-2020', 'budget', 'Front-Engine', 6, 4, 7, 9, 10, 7, 9, '3.7L V6', 350, '6MT/7AT', '$25-35K', 30000, 'RWD', 'Old-school analog. VQ37 sounds good, reliable.', 'Best budget pick', 'Analog sports car value', '["Incredible value", "Reliable VQ", "Huge aftermarket", "Manual available"]'::jsonb, '["Very dated interior", "Heavy", "Long production run shows"]'::jsonb, '["Budget enthusiast", "First sports car", "Modder"]'::jsonb),

('mercedes-c63-amg-w204', 'Mercedes C63 AMG W204', '2008-2014', 'budget', 'Front-Engine', 9, 6, 5, 5, 8, 8, 8, '6.2L NA V8', 451, '7AT', '$25-42K', 33500, 'RWD', 'Last NA AMG V8. Tail-happy, raw character.', 'Best V8 under $40K', 'The last naturally-aspirated AMG', '["NA 6.2L V8 sound", "Raw character", "Tail-happy fun", "Appreciating values"]'::jsonb, '["Head bolt issues", "Expensive repairs", "Thirsty"]'::jsonb, '["V8 enthusiast", "Daily muscle", "Sound seeker"]'::jsonb),

('bmw-m4-f82', 'BMW M4 F82', '2015-2020', 'budget', 'Front-Engine', 5, 7, 8, 6, 7, 7, 8, '3.0L TT I6', 425, '6MT/7DCT', '$35-50K', 42500, 'RWD', 'Twin-turbo S55. Clinical but fast.', 'Most capable daily', 'Clinical German precision', '["Capable daily", "Good tech", "Manual available", "Tuneable"]'::jsonb, '["Lacks character", "Numb steering", "Rod bearing concerns"]'::jsonb, '["Daily driver", "Tech enthusiast", "All-rounder"]'::jsonb),

('mustang-gt-pp2', 'Mustang GT PP2', '2018-2023', 'budget', 'Front-Engine', 7, 5, 8, 8, 10, 8, 10, '5.0L V8', 460, '6MT/10AT', '$32-45K', 38500, 'RWD', 'Track-ready from factory. Incredible value.', 'Best budget track car', 'Track-ready American muscle', '["Track-ready package", "Manual available", "Massive aftermarket", "Incredible value"]'::jsonb, '["Basic interior", "Heavy", "Live rear axle feel"]'::jsonb, '["Budget track day", "Value seeker", "Modder"]'::jsonb),

('camaro-ss-1le', 'Camaro SS 1LE', '2017-2023', 'budget', 'Front-Engine', 7, 5, 9, 8, 10, 8, 10, '6.2L V8', 455, '6MT', '$35-48K', 41500, 'RWD', 'Track-focused from factory. Magnetic ride.', 'Best value track weapon', 'Budget track weapon', '["Magnetic ride", "Manual only", "Great handling", "Incredible value"]'::jsonb, '["Poor visibility", "Cramped", "Discontinued"]'::jsonb, '["Track days", "Value seeker", "Handling enthusiast"]'::jsonb),

('toyota-gr-supra', 'Toyota GR Supra', '2020-2024', 'budget', 'Front-Engine', 6, 7, 7, 8, 7, 7, 8, '3.0L TT I6', 382, '6MT/8AT', '$38-55K', 46500, 'RWD', 'BMW B58 engine. Available with manual.', 'Best new Japanese', 'Supra reborn with BMW heart', '["BMW B58 engine", "Manual now available", "Growing aftermarket", "Toyota warranty"]'::jsonb, '["BMW parts", "Controversial styling", "Identity crisis"]'::jsonb, '["JDM enthusiast", "Modern tech seeker", "Tuner"]'::jsonb),

('maserati-granturismo', 'Maserati GranTurismo', '2008-2019', 'budget', 'Front-Engine', 9, 8, 4, 2, 7, 5, 3, '4.7L V8', 454, '6AT', '$30-50K', 40000, 'RWD', 'Ferrari-derived V8 sounds incredible. Reliability nightmare.', 'Best Italian drama', 'Ferrari V8 at fraction of price', '["Ferrari V8 sound", "Stunning looks", "True Italian exotic", "Incredible depreciation value"]'::jsonb, '["Terrible reliability", "Expensive repairs", "Will break"]'::jsonb, '["Sound enthusiast", "Style over substance", "Risk taker"]'::jsonb);

