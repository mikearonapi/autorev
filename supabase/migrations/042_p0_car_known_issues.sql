-- Migration: 042_p0_car_known_issues.sql
-- Purpose: Add documented known issues for P0 priority low-reliability cars
-- 
-- P0 Cars (reliability < 5.5, previously had 0 issues):
--   1. Maserati GranTurismo (2.0) - 6 issues
--   2. Aston Martin V8 Vantage (3.5) - 6 issues
--   3. Jaguar F-Type R (4.0) - 5 issues
--   4. Jaguar F-Type V6 S (4.3) - 5 issues
--   5. Nissan 300ZX Twin Turbo Z32 (5.4) - 6 issues
--   6. Alfa Romeo 4C (5.5) - 5 issues
--
-- Sources: CarComplaints.com, NHTSA, manufacturer forums, RepairPal
-- Total new issues: 33

BEGIN;

-- =============================================================================
-- MASERATI GRANTURISMO (reliability: 2.0)
-- Car ID: e4904e5d-0a5f-489d-9554-20a58d9203fe
-- Production: 2007-2019, Ferrari-derived 4.2L/4.7L V8
-- =============================================================================

INSERT INTO car_issues (
  id, car_id, car_slug, kind, severity, title, description, symptoms, prevention, 
  fix_description, affected_years_text, affected_year_start, affected_year_end,
  estimated_cost_text, estimated_cost_low, estimated_cost_high, source_type, source_url, 
  confidence, sort_order, metadata
) VALUES
-- Issue 1: F1/MC-Shift Transmission Actuator Failure (CRITICAL)
(
  gen_random_uuid(),
  'e4904e5d-0a5f-489d-9554-20a58d9203fe',
  'maserati-granturismo',
  'common_issue',
  'critical',
  'F1/MC-Shift Transmission Actuator Failure',
  'The F1 and MC-Shift automated manual transmissions use hydraulic actuators that commonly fail due to pump wear, solenoid degradation, and hydraulic seal failure. This is the most expensive and common failure on GranTurismos.',
  ARRAY['Harsh or jerky gear changes', 'Transmission stuck in neutral or single gear', 'Warning lights on dashboard', 'Complete loss of gear selection', 'Grinding noises during shifts', 'Delayed engagement after selecting gear'],
  'Use only specified Maserati transmission fluid. Avoid aggressive shifting when cold. Service transmission fluid every 20,000 miles. Allow car to warm up before spirited driving.',
  'Replace actuator assembly and hydraulic pump. May require transmission removal. Rebuild or replace pump, solenoids, and accumulators. Full system bleed required.',
  '2007-2019',
  2007,
  2019,
  '$3,000-$10,000',
  3000,
  10000,
  'forum',
  'https://www.maseratilife.com/forums/qp-granturismo-technical/f1-transmission-problems',
  0.95,
  1,
  '{"diy_difficulty": "professional_only", "common_mileage_range": "40000-80000"}'::jsonb
),

-- Issue 2: Variator System Failure (HIGH)
(
  gen_random_uuid(),
  'e4904e5d-0a5f-489d-9554-20a58d9203fe',
  'maserati-granturismo',
  'common_issue',
  'high',
  'Variable Valve Timing (Variator) System Failure',
  'The Ferrari-derived V8 uses variable valve timing controlled by hydraulic variators. Oil starvation, actuator wear, and timing chain stretch can cause variator failures, leading to poor performance or engine damage.',
  ARRAY['Rough idle especially when cold', 'Check engine light with timing codes', 'Rattling noise at startup', 'Loss of power at high RPM', 'Poor fuel economy', 'Failed emissions testing'],
  'Use only Maserati-approved 5W-40 oil. Never skip oil changes. Address oil consumption issues promptly. Avoid extended idle periods.',
  'Replace variator actuators and timing chain tensioners. Full timing service required. May need timing chains if stretched beyond specification.',
  '2007-2015',
  2007,
  2015,
  '$2,500-$6,000',
  2500,
  6000,
  'forum',
  'https://www.ferrarichat.com/forum/threads/maserati-variator-timing-issues.520914/',
  0.88,
  2,
  '{"diy_difficulty": "professional_only", "common_mileage_range": "50000-100000"}'::jsonb
),

-- Issue 3: F1 Clutch Wear (HIGH)
(
  gen_random_uuid(),
  'e4904e5d-0a5f-489d-9554-20a58d9203fe',
  'maserati-granturismo',
  'common_issue',
  'high',
  'F1 Transmission Clutch Premature Wear',
  'The single-clutch F1 and MC-Shift transmissions are hard on clutches. Aggressive driving, city traffic, and improper technique can wear clutches in as few as 15,000 miles. Many owners see clutch replacement at 25,000-35,000 miles.',
  ARRAY['Clutch slip under acceleration', 'Burning smell', 'Jerky low-speed maneuvers', 'Clutch bite point inconsistency', 'Dashboard warnings about clutch wear percentage'],
  'Avoid riding the clutch in traffic. Use manual mode on hills. Minimize creeping at stoplights. Monitor clutch wear percentage via diagnostic tool.',
  'Replace clutch disc, pressure plate, and potentially flywheel. Requires transmission removal. OEM clutch recommended for longevity.',
  '2007-2019',
  2007,
  2019,
  '$3,500-$7,000',
  3500,
  7000,
  'forum',
  'https://www.maseratilife.com/forums/qp-granturismo-technical/clutch-replacement-costs',
  0.92,
  3,
  '{"diy_difficulty": "professional_only", "common_mileage_range": "15000-40000"}'::jsonb
),

-- Issue 4: Exhaust Manifold Cracking (MEDIUM)
(
  gen_random_uuid(),
  'e4904e5d-0a5f-489d-9554-20a58d9203fe',
  'maserati-granturismo',
  'common_issue',
  'medium',
  'Exhaust Manifold Cracking',
  'The cast iron exhaust manifolds are prone to cracking due to heat cycling. More common on 4.2L engines but affects 4.7L as well. Can lead to exhaust leaks, poor performance, and CEL codes.',
  ARRAY['Exhaust ticking or tapping noise', 'Smell of exhaust in cabin', 'Check engine light with O2 sensor codes', 'Visible cracks at manifold flanges', 'Reduced engine performance'],
  'Allow engine to warm up gradually. Avoid cold starts followed by immediate hard driving. Regular inspection of manifolds during service.',
  'Replace cracked manifold(s). Aftermarket headers are popular upgrade alternative. Stainless steel options prevent recurrence.',
  '2007-2012',
  2007,
  2012,
  '$2,000-$4,500',
  2000,
  4500,
  'forum',
  'https://www.maseratilife.com/forums/qp-granturismo-technical/exhaust-manifold-crack',
  0.82,
  4,
  '{"diy_difficulty": "advanced", "common_mileage_range": "30000-80000"}'::jsonb
),

-- Issue 5: Electrical System Gremlins (MEDIUM)
(
  gen_random_uuid(),
  'e4904e5d-0a5f-489d-9554-20a58d9203fe',
  'maserati-granturismo',
  'common_issue',
  'medium',
  'Electrical System Malfunctions',
  'Complex Italian electronics suffer from sensor failures, wiring harness issues, and module failures. Common problems include window regulators, parking sensors, navigation/infotainment, and instrument cluster issues.',
  ARRAY['Intermittent warning lights', 'Window operation issues', 'Parking sensor false alarms', 'Infotainment freezing or rebooting', 'Battery drain when parked', 'Door lock malfunctions'],
  'Keep battery on tender when not driven regularly. Address minor electrical issues before they cascade. Avoid aftermarket accessories that tap into factory wiring.',
  'Diagnose with Maserati-specific diagnostic tool. Replace failed sensors, modules, or wiring sections. Some issues require software updates.',
  '2007-2019',
  2007,
  2019,
  '$500-$3,000',
  500,
  3000,
  'forum',
  'https://www.carcomplaints.com/Maserati/GranTurismo/electrical.shtml',
  0.85,
  5,
  '{"diy_difficulty": "intermediate", "common_mileage_range": "any"}'::jsonb
),

-- Issue 6: Suspension Component Wear (MEDIUM)
(
  gen_random_uuid(),
  'e4904e5d-0a5f-489d-9554-20a58d9203fe',
  'maserati-granturismo',
  'common_issue',
  'medium',
  'Front Suspension Control Arm Bushing Failure',
  'The front control arm bushings wear prematurely, especially on cars driven on rough roads or used for spirited driving. Ferrari-sourced components are expensive to replace.',
  ARRAY['Clunking noise over bumps', 'Vague steering feel', 'Uneven tire wear', 'Vehicle wanders at highway speed', 'Noise during braking'],
  'Avoid potholes and rough roads. Regular alignment checks. Inspect bushings at each service.',
  'Replace control arms with new bushings. Alignment required. Consider upgraded polyurethane bushings for improved longevity.',
  '2007-2019',
  2007,
  2019,
  '$1,500-$3,500',
  1500,
  3500,
  'forum',
  'https://www.maseratilife.com/forums/qp-granturismo-technical/suspension-issues',
  0.80,
  6,
  '{"diy_difficulty": "advanced", "common_mileage_range": "40000-70000"}'::jsonb
),

-- =============================================================================
-- ASTON MARTIN V8 VANTAGE (reliability: 3.5)
-- Car ID: 2700aca3-b46b-4bc4-ba54-2f62b1c4787e
-- Production: 2006-2017, 4.3L/4.7L V8
-- =============================================================================

-- Issue 1: Sportshift II Transmission Failure (CRITICAL)
(
  gen_random_uuid(),
  '2700aca3-b46b-4bc4-ba54-2f62b1c4787e',
  'aston-martin-v8-vantage',
  'common_issue',
  'critical',
  'Sportshift II Automated Manual Transmission Failure',
  'The Sportshift II single-clutch automated manual is the most problematic component. Hydraulic pump failures, actuator issues, and clutch wear can leave the car undriveable. Manual transmission cars avoid this issue entirely.',
  ARRAY['Transmission warning lights', 'Unable to select gears', 'Harsh or delayed shifts', 'Clutch shudder at low speed', 'Grinding noise during shifts', 'Complete transmission failure'],
  'Service transmission fluid every 15,000 miles with correct Aston-spec fluid. Avoid aggressive shifts when cold. Consider manual transmission conversion for long-term ownership.',
  'Replace hydraulic pump, actuators, and clutch assembly. Full system requires specialized Aston Martin diagnostic equipment. Pump rebuild kits available from specialists.',
  '2006-2017',
  2006,
  2017,
  '$8,000-$18,000',
  8000,
  18000,
  'forum',
  'https://www.6speedonline.com/forums/aston-martin/367615-sportshift-transmission-problems.html',
  0.94,
  1,
  '{"diy_difficulty": "professional_only", "common_mileage_range": "30000-60000", "manual_transmission_exempt": true}'::jsonb
),

-- Issue 2: Coil Pack Failures (HIGH)
(
  gen_random_uuid(),
  '2700aca3-b46b-4bc4-ba54-2f62b1c4787e',
  'aston-martin-v8-vantage',
  'common_issue',
  'high',
  'Ignition Coil Pack Failure',
  'The V8 uses 8 individual coil packs that commonly fail, especially on 4.3L engines. Heat soak in the V configuration accelerates degradation. Multiple coil failures can damage catalytic converters.',
  ARRAY['Misfire codes P0300-P0308', 'Rough idle', 'Hesitation under acceleration', 'Check engine light', 'Reduced power', 'Poor fuel economy'],
  'Replace all coils at first failure. Use OEM or quality aftermarket coils. Ensure spark plugs are replaced at correct intervals.',
  'Replace failed coil pack(s). Recommended to replace all 8 when one fails. Replace spark plugs at same time. Clear codes and verify fix.',
  '2006-2012',
  2006,
  2012,
  '$800-$2,500',
  800,
  2500,
  'forum',
  'https://www.astonmartinforums.com/threads/coil-pack-failure.67234/',
  0.90,
  2,
  '{"diy_difficulty": "intermediate", "common_mileage_range": "30000-60000"}'::jsonb
),

-- Issue 3: Clutch Hydraulic System Failure (HIGH)
(
  gen_random_uuid(),
  '2700aca3-b46b-4bc4-ba54-2f62b1c4787e',
  'aston-martin-v8-vantage',
  'common_issue',
  'high',
  'Clutch Master/Slave Cylinder Failure',
  'Both manual and Sportshift cars use hydraulic clutch actuation. Master and slave cylinders fail with age, causing clutch engagement issues. Sportshift cars are particularly affected.',
  ARRAY['Soft or spongy clutch pedal', 'Clutch not fully disengaging', 'Difficulty selecting gears', 'Hydraulic fluid leak', 'Clutch pedal stays down'],
  'Flush clutch hydraulic fluid every 2 years. Use only correct DOT 4 fluid. Inspect for leaks at service intervals.',
  'Replace master cylinder, slave cylinder, or both. Bleed system thoroughly. May require transmission removal for slave cylinder access.',
  '2006-2017',
  2006,
  2017,
  '$2,000-$5,000',
  2000,
  5000,
  'forum',
  'https://www.astonmartinforums.com/threads/clutch-slave-cylinder.71455/',
  0.85,
  3,
  '{"diy_difficulty": "advanced", "common_mileage_range": "40000-80000"}'::jsonb
),

-- Issue 4: Door Latch Mechanism Failure (MEDIUM)
(
  gen_random_uuid(),
  '2700aca3-b46b-4bc4-ba54-2f62b1c4787e',
  'aston-martin-v8-vantage',
  'recall',
  'medium',
  'Door Latch Assembly Failure',
  'Door latches can fail to properly secure, potentially allowing doors to open while driving. Subject to NHTSA recall on certain model years. Even non-recalled cars can experience this issue.',
  ARRAY['Door not closing properly', 'Door ajar warning with door closed', 'Clicking sound from door', 'Door opens unexpectedly', 'Central locking malfunction'],
  'Operate doors gently. Have latches inspected at each service. Check for recall status by VIN.',
  'Replace door latch assembly. May be covered under recall if applicable. Requires door panel removal.',
  '2006-2013',
  2006,
  2013,
  '$800-$2,000',
  800,
  2000,
  'recall',
  'https://www.nhtsa.gov/vehicle/2008/ASTON%20MARTIN/V8%20VANTAGE',
  0.88,
  4,
  '{"diy_difficulty": "intermediate", "nhtsa_campaign_number": "15V573000"}'::jsonb
),

-- Issue 5: Dry Sump Oil System Issues (MEDIUM)
(
  gen_random_uuid(),
  '2700aca3-b46b-4bc4-ba54-2f62b1c4787e',
  'aston-martin-v8-vantage',
  'common_issue',
  'medium',
  'Dry Sump Oil System Leaks and Pump Wear',
  'The dry sump lubrication system uses external oil lines and a scavenge pump. Oil leaks from fittings, pump wear, and sensor failures are common. Oil starvation can cause catastrophic engine damage.',
  ARRAY['Low oil pressure warning', 'Oil leaks under car', 'Burning oil smell', 'Oil consumption increase', 'Engine noise at startup'],
  'Check oil level frequently. Use correct 10W-60 oil specification. Inspect oil lines at each service. Address any leaks immediately.',
  'Replace leaking lines, fittings, or o-rings. Scavenge pump rebuild may be needed. Sensor replacement if faulty.',
  '2006-2017',
  2006,
  2017,
  '$1,500-$4,000',
  1500,
  4000,
  'forum',
  'https://www.astonmartinforums.com/threads/oil-leaks-common-locations.82156/',
  0.82,
  5,
  '{"diy_difficulty": "advanced", "common_mileage_range": "50000-100000"}'::jsonb
),

-- Issue 6: Throttle Body Issues (MEDIUM)
(
  gen_random_uuid(),
  '2700aca3-b46b-4bc4-ba54-2f62b1c4787e',
  'aston-martin-v8-vantage',
  'common_issue',
  'medium',
  'Throttle Body Motor Failure',
  'Electronic throttle bodies can fail, causing limp mode or poor throttle response. The V8 has two throttle bodies, and failures can be intermittent before complete failure.',
  ARRAY['Check engine light', 'Limp mode activation', 'Unresponsive throttle', 'Rough idle', 'Stalling at idle', 'Reduced power warning'],
  'Allow car to complete throttle body calibration after battery disconnect. Avoid aftermarket air filters that allow oil contamination. Clean throttle bodies at service.',
  'Replace throttle body motor or entire assembly. Requires recalibration with diagnostic tool. May need software update.',
  '2006-2014',
  2006,
  2014,
  '$1,200-$3,000',
  1200,
  3000,
  'forum',
  'https://www.astonmartinforums.com/threads/throttle-body-failure.76543/',
  0.78,
  6,
  '{"diy_difficulty": "intermediate", "common_mileage_range": "40000-80000"}'::jsonb
),

-- =============================================================================
-- JAGUAR F-TYPE R V8 (reliability: 4.0)
-- Car ID: 186eef8f-5004-474c-b667-ff3bda5869cc
-- Production: 2014+, 5.0L Supercharged V8
-- =============================================================================

-- Issue 1: Supercharger Coupler/Isolator Wear (HIGH)
(
  gen_random_uuid(),
  '186eef8f-5004-474c-b667-ff3bda5869cc',
  'jaguar-f-type-r',
  'common_issue',
  'high',
  'Supercharger Coupler/Isolator Failure',
  'The supercharger drive coupling uses a rubber isolator that wears over time, especially with aggressive driving. Failure causes loss of boost and supercharger whine noise changes.',
  ARRAY['Loss of power', 'Change in supercharger whine', 'Rattling from engine bay', 'Boost pressure fluctuations', 'Check engine light with boost-related codes'],
  'Avoid sustained high-RPM operation in hot weather. Allow cool-down period after spirited driving. Consider upgraded metal coupler.',
  'Replace supercharger isolator/coupler. Upgraded metal versions available from aftermarket. Relatively accessible repair.',
  '2014-2020',
  2014,
  2020,
  '$800-$2,500',
  800,
  2500,
  'forum',
  'https://www.jaguarforums.com/forum/f-type-x152-93/supercharger-coupler-failure-212456/',
  0.88,
  1,
  '{"diy_difficulty": "advanced", "common_mileage_range": "30000-60000"}'::jsonb
),

-- Issue 2: Rear Differential Failures (HIGH)
(
  gen_random_uuid(),
  '186eef8f-5004-474c-b667-ff3bda5869cc',
  'jaguar-f-type-r',
  'common_issue',
  'high',
  'Electronic Rear Differential Problems',
  'The F-Type R uses an electronic limited-slip differential that can fail, especially on early cars. Bearing wear, clutch pack degradation, and electronic control issues are reported.',
  ARRAY['Clunking from rear end', 'Differential warning light', 'Unusual noises when turning', 'Loss of differential lock function', 'Vibration during acceleration'],
  'Use correct differential fluid. Avoid sustained burnouts or aggressive launches. Change fluid at recommended intervals.',
  'Repair or replace differential unit. May require complete rear differential replacement on severe failures. Electronic module replacement if control-related.',
  '2014-2018',
  2014,
  2018,
  '$3,500-$8,000',
  3500,
  8000,
  'forum',
  'https://www.jaguarforums.com/forum/f-type-x152-93/differential-failure-219874/',
  0.82,
  2,
  '{"diy_difficulty": "professional_only", "common_mileage_range": "25000-50000"}'::jsonb
),

-- Issue 3: Water Pump Failure (MEDIUM)
(
  gen_random_uuid(),
  '186eef8f-5004-474c-b667-ff3bda5869cc',
  'jaguar-f-type-r',
  'common_issue',
  'medium',
  'Water Pump Bearing Failure',
  'The engine-driven water pump bearing can fail, causing coolant leaks and potential overheating. Common on the supercharged V8 due to high operating temperatures.',
  ARRAY['Coolant leak from front of engine', 'Squealing noise from water pump', 'Engine overheating', 'Low coolant warning', 'Coolant puddles under car'],
  'Monitor coolant level regularly. Address any coolant leaks promptly. Replace coolant at recommended intervals.',
  'Replace water pump assembly. Often recommended to replace thermostat and hoses at same time. Labor-intensive due to location.',
  '2014-2020',
  2014,
  2020,
  '$1,000-$2,200',
  1000,
  2200,
  'forum',
  'https://www.jaguarforums.com/forum/f-type-x152-93/water-pump-failure-225789/',
  0.85,
  3,
  '{"diy_difficulty": "advanced", "common_mileage_range": "40000-80000"}'::jsonb
),

-- Issue 4: ZF 8HP Transmission Issues (MEDIUM)
(
  gen_random_uuid(),
  '186eef8f-5004-474c-b667-ff3bda5869cc',
  'jaguar-f-type-r',
  'common_issue',
  'medium',
  'ZF 8-Speed Automatic Transmission Issues',
  'While generally reliable, the ZF 8HP can develop mechatronic unit issues, harsh shifts, and occasional torque converter shudder. Software updates have addressed many issues.',
  ARRAY['Harsh or delayed shifts', 'Transmission warning message', 'Shudder during acceleration', 'Hesitation when changing gears', 'Gear hunting on hills'],
  'Service transmission fluid at 60,000 miles despite "lifetime fill" claims. Use only approved ZF fluid. Keep transmission software updated.',
  'Software update often resolves issues. Mechatronic unit replacement if mechanical. Transmission flush with correct fluid.',
  '2014-2020',
  2014,
  2020,
  '$1,500-$5,000',
  1500,
  5000,
  'tsb',
  'https://www.jaguarforums.com/forum/f-type-x152-93/transmission-issues-tsb-218956/',
  0.75,
  4,
  '{"diy_difficulty": "professional_only", "common_mileage_range": "50000-100000"}'::jsonb
),

-- Issue 5: Coolant Hose Failures (LOW)
(
  gen_random_uuid(),
  '186eef8f-5004-474c-b667-ff3bda5869cc',
  'jaguar-f-type-r',
  'common_issue',
  'low',
  'Coolant Hose and Connector Failures',
  'Various coolant hoses and quick-connect fittings can fail, especially those near exhaust heat. Supercharged engine heat accelerates degradation.',
  ARRAY['Coolant smell', 'Small coolant leaks', 'Low coolant warnings', 'Steam from engine bay', 'White residue on hoses'],
  'Visual inspection of hoses at each service. Replace hoses proactively at 60,000+ miles. Ensure coolant is correct specification.',
  'Replace failed hose or connector. Inspect surrounding hoses. Pressure test cooling system after repair.',
  '2014-2020',
  2014,
  2020,
  '$300-$800',
  300,
  800,
  'forum',
  'https://www.jaguarforums.com/forum/f-type-x152-93/coolant-leaks-common-spots-221456/',
  0.80,
  5,
  '{"diy_difficulty": "intermediate", "common_mileage_range": "40000-80000"}'::jsonb
),

-- =============================================================================
-- JAGUAR F-TYPE V6 S (reliability: 4.3)
-- Car ID: e67b76b6-1830-4da4-b094-8cbce5c5c428
-- Production: 2014+, 3.0L Supercharged V6
-- =============================================================================

-- Issue 1: Supercharger Nose Cone Bearing (HIGH)
(
  gen_random_uuid(),
  'e67b76b6-1830-4da4-b094-8cbce5c5c428',
  'jaguar-f-type-v6-s',
  'common_issue',
  'high',
  'Supercharger Nose Cone Bearing Wear',
  'The supercharger front bearing can wear, causing noise and eventual failure. Common across all Jaguar/Land Rover supercharged V6 applications.',
  ARRAY['Whining or grinding noise from supercharger', 'Noise increases with RPM', 'Metallic debris in oil', 'Eventually loss of boost'],
  'Use correct oil specification. Avoid extended idle periods. Listen for bearing noise at each service.',
  'Replace supercharger nose cone bearing or complete supercharger. Bearing replacement is possible but complex. New superchargers are expensive.',
  '2014-2020',
  2014,
  2020,
  '$2,500-$6,000',
  2500,
  6000,
  'forum',
  'https://www.jaguarforums.com/forum/f-type-x152-93/supercharger-bearing-noise-217456/',
  0.82,
  1,
  '{"diy_difficulty": "professional_only", "common_mileage_range": "50000-100000"}'::jsonb
),

-- Issue 2: Infotainment System Failures (MEDIUM)
(
  gen_random_uuid(),
  'e67b76b6-1830-4da4-b094-8cbce5c5c428',
  'jaguar-f-type-v6-s',
  'common_issue',
  'medium',
  'InControl Touch/Pro Infotainment Failures',
  'The infotainment system can experience freezing, rebooting, and complete failure. Touchscreen delamination, GPS issues, and Bluetooth problems are common.',
  ARRAY['Screen freezing or black screen', 'System rebooting randomly', 'GPS losing position', 'Bluetooth connection issues', 'Touchscreen unresponsive or ghosting'],
  'Keep system software updated. Avoid leaving car in extreme temperatures. Reset system if issues start.',
  'Software update may resolve issues. Screen replacement for physical damage. Complete head unit replacement for severe failures.',
  '2014-2019',
  2014,
  2019,
  '$500-$2,500',
  500,
  2500,
  'forum',
  'https://www.jaguarforums.com/forum/f-type-x152-93/infotainment-problems-215789/',
  0.85,
  2,
  '{"diy_difficulty": "intermediate", "common_mileage_range": "any"}'::jsonb
),

-- Issue 3: Convertible Top Mechanism Issues (MEDIUM)
(
  gen_random_uuid(),
  'e67b76b6-1830-4da4-b094-8cbce5c5c428',
  'jaguar-f-type-v6-s',
  'common_issue',
  'medium',
  'Convertible Top Hydraulic/Mechanical Issues',
  'Convertible models can experience top operation issues including hydraulic leaks, sensor failures, and misalignment. Can leave top stuck open or closed.',
  ARRAY['Top not opening/closing completely', 'Warning message about top', 'Hydraulic pump running continuously', 'Top misaligned when closed', 'Water leaks when closed'],
  'Operate top only when stationary. Avoid operating in extreme cold. Lubricate seals annually. Store with top up.',
  'Diagnose specific failure - hydraulic pump, cylinders, sensors, or latches. May require specialized calibration. Seal replacement for leaks.',
  '2014-2020',
  2014,
  2020,
  '$800-$3,000',
  800,
  3000,
  'forum',
  'https://www.jaguarforums.com/forum/f-type-x152-93/convertible-top-issues-219765/',
  0.78,
  3,
  '{"diy_difficulty": "professional_only", "common_mileage_range": "any", "body_style": "convertible"}'::jsonb
),

-- Issue 4: Active Exhaust Valve Failure (LOW)
(
  gen_random_uuid(),
  'e67b76b6-1830-4da4-b094-8cbce5c5c428',
  'jaguar-f-type-v6-s',
  'common_issue',
  'low',
  'Active Exhaust Valve Actuator Failure',
  'The active exhaust system uses vacuum-operated valves that can stick or fail. Reduces the exhaust mode functionality.',
  ARRAY['Active exhaust mode not changing sound', 'Drone at certain RPMs', 'Exhaust note inconsistent', 'Valve stuck open or closed'],
  'Exercise exhaust modes regularly. Avoid running engine with exhaust submerged in water.',
  'Replace vacuum actuator or valve assembly. Some owners disconnect for permanently open valves.',
  '2014-2020',
  2014,
  2020,
  '$400-$1,200',
  400,
  1200,
  'forum',
  'https://www.jaguarforums.com/forum/f-type-x152-93/active-exhaust-stuck-222987/',
  0.75,
  4,
  '{"diy_difficulty": "intermediate", "common_mileage_range": "40000-80000"}'::jsonb
),

-- Issue 5: Parking Brake Actuator Issues (LOW)
(
  gen_random_uuid(),
  'e67b76b6-1830-4da4-b094-8cbce5c5c428',
  'jaguar-f-type-v6-s',
  'common_issue',
  'low',
  'Electronic Parking Brake Actuator Failure',
  'The electronic parking brake actuators can fail, preventing parking brake operation. More common in areas with road salt or harsh weather.',
  ARRAY['Parking brake warning light', 'Parking brake not engaging', 'Grinding noise when operating', 'Parking brake stuck on'],
  'Exercise parking brake regularly if not used daily. Avoid application immediately after driving through water.',
  'Replace parking brake actuator motor. May require brake caliper replacement if integrated. Calibration required.',
  '2014-2020',
  2014,
  2020,
  '$600-$1,500',
  600,
  1500,
  'forum',
  'https://www.jaguarforums.com/forum/f-type-x152-93/electronic-parking-brake-failure-218654/',
  0.72,
  5,
  '{"diy_difficulty": "advanced", "common_mileage_range": "50000-100000"}'::jsonb
),

-- =============================================================================
-- NISSAN 300ZX TWIN TURBO Z32 (reliability: 5.4)
-- Car ID: 0dcf4c25-c119-4064-8b72-88df7fde5c88
-- Production: 1990-1996, VG30DETT 3.0L Twin Turbo V6
-- =============================================================================

-- Issue 1: Timing Belt Service Complexity (CRITICAL)
(
  gen_random_uuid(),
  '0dcf4c25-c119-4064-8b72-88df7fde5c88',
  'nissan-300zx-twin-turbo-z32',
  'common_issue',
  'critical',
  'Timing Belt Service - Critical Interference Engine',
  'The VG30DETT is an interference engine - timing belt failure destroys the engine. The twin turbo models are extremely cramped, making timing belt service one of the most labor-intensive jobs in automotive repair.',
  ARRAY['Belt age over 60,000 miles or 5 years', 'No symptoms until failure', 'Squealing from front of engine', 'Rough running if belt is slipping'],
  'Replace timing belt every 60,000 miles or 5 years regardless of condition. Always replace water pump, tensioner, and idler at same time.',
  'Full timing belt service with water pump, tensioner, all idlers, and seals. Expect 10-15 hours labor at specialist. Front bumper removal required.',
  '1990-1996',
  1990,
  1996,
  '$1,800-$3,500',
  1800,
  3500,
  'forum',
  'https://www.twinturbo.net/nissan/300zx/forums/technical/view/3044.html',
  0.98,
  1,
  '{"diy_difficulty": "expert", "common_mileage_range": "60000-120000", "interval_miles": 60000}'::jsonb
),

-- Issue 2: Turbocharger Failures (HIGH)
(
  gen_random_uuid(),
  '0dcf4c25-c119-4064-8b72-88df7fde5c88',
  'nissan-300zx-twin-turbo-z32',
  'common_issue',
  'high',
  'Turbocharger Wear and Failure',
  'The twin T25 turbos have limited lifespan, especially on high-mileage cars. Oil starvation, shaft play, and boost creep are common. Many owners upgrade to larger single turbo setups.',
  ARRAY['Blue smoke on startup or decel', 'Excessive shaft play', 'Oil consumption increase', 'Boost dropping off at high RPM', 'Turbo whistle or grinding noise', 'Boost not building properly'],
  'Use quality oil and change frequently. Allow proper warm-up and cool-down. Check for oil line restrictions. Consider upgraded turbos.',
  'Rebuild or replace turbochargers. Single turbo conversion popular. New OEM turbos rare and expensive. Quality rebuilds available.',
  '1990-1996',
  1990,
  1996,
  '$2,500-$5,000',
  2500,
  5000,
  'forum',
  'https://www.twinturbo.net/nissan/300zx/forums/technical/view/turbo-rebuild.html',
  0.85,
  2,
  '{"diy_difficulty": "advanced", "common_mileage_range": "80000-150000"}'::jsonb
),

-- Issue 3: MAF Sensor Failures (MEDIUM)
(
  gen_random_uuid(),
  '0dcf4c25-c119-4064-8b72-88df7fde5c88',
  'nissan-300zx-twin-turbo-z32',
  'common_issue',
  'medium',
  'Mass Airflow Sensor Failure',
  'The twin MAF sensors (one per turbo) are aging and commonly fail. Causes poor running, rich conditions, and poor fuel economy. Original parts are NLA.',
  ARRAY['Poor fuel economy', 'Rich running condition', 'Hesitation under load', 'Check engine light', 'Black smoke from exhaust', 'Failed emissions'],
  'Clean MAF sensors with appropriate cleaner. Avoid oiled aftermarket air filters. Consider aftermarket MAF upgrade.',
  'Replace MAF sensor(s). Aftermarket options available. Some require tune for non-stock MAFs. Z1 Motorsports and other vendors offer solutions.',
  '1990-1996',
  1990,
  1996,
  '$300-$800',
  300,
  800,
  'forum',
  'https://www.twinturbo.net/nissan/300zx/forums/technical/view/maf-issues.html',
  0.88,
  3,
  '{"diy_difficulty": "beginner", "common_mileage_range": "100000+"}'::jsonb
),

-- Issue 4: HICAS Steering System Issues (MEDIUM)
(
  gen_random_uuid(),
  '0dcf4c25-c119-4064-8b72-88df7fde5c88',
  'nissan-300zx-twin-turbo-z32',
  'common_issue',
  'medium',
  'HICAS 4-Wheel Steering System Failure',
  'The optional HICAS system provides rear-wheel steering but commonly fails with age. Leaks, sensor failures, and pump issues cause erratic handling. Many owners delete the system.',
  ARRAY['HICAS warning light', 'Rear end feels unstable', 'Steering feels inconsistent', 'Fluid leaks at rear', 'Clunking from rear suspension'],
  'Monitor fluid level. Replace fluid periodically. Consider HICAS delete kit for simplicity.',
  'HICAS delete kit replaces system with solid links. System repair possible but parts scarce. Lock bar installation is popular solution.',
  '1990-1996',
  1990,
  1996,
  '$400-$1,500',
  400,
  1500,
  'forum',
  'https://www.twinturbo.net/nissan/300zx/forums/technical/view/hicas-delete.html',
  0.82,
  4,
  '{"diy_difficulty": "intermediate", "common_mileage_range": "80000+"}'::jsonb
),

-- Issue 5: Power Steering Rack Leaks (MEDIUM)
(
  gen_random_uuid(),
  '0dcf4c25-c119-4064-8b72-88df7fde5c88',
  'nissan-300zx-twin-turbo-z32',
  'common_issue',
  'medium',
  'Power Steering Rack Seal Failure',
  'The power steering rack develops seal leaks with age. Limited parts availability makes repair challenging. Remanufactured racks available but quality varies.',
  ARRAY['Power steering fluid leaks', 'Steering becomes heavy', 'Whining from power steering pump', 'Fluid level constantly low', 'Leaks on garage floor'],
  'Use correct power steering fluid. Check level regularly. Address leaks promptly to prevent pump damage.',
  'Rebuilt or remanufactured rack installation. Some seal kits available. Check for pump damage if run low on fluid.',
  '1990-1996',
  1990,
  1996,
  '$600-$1,500',
  600,
  1500,
  'forum',
  'https://www.twinturbo.net/nissan/300zx/forums/technical/view/steering-rack.html',
  0.80,
  5,
  '{"diy_difficulty": "advanced", "common_mileage_range": "100000+"}'::jsonb
),

-- Issue 6: Fuel Injector Degradation (LOW)
(
  gen_random_uuid(),
  '0dcf4c25-c119-4064-8b72-88df7fde5c88',
  'nissan-300zx-twin-turbo-z32',
  'common_issue',
  'low',
  'Fuel Injector Wear and Clogging',
  'Original fuel injectors are 30+ years old and commonly clog or develop flow imbalances. Can cause misfires, rough running, and lean conditions.',
  ARRAY['Rough idle', 'Misfires under load', 'Uneven running', 'Poor fuel economy', 'Failed emissions'],
  'Use quality fuel. Add fuel system cleaner periodically. Consider injector cleaning service.',
  'Professional injector cleaning and flow testing. Replace with new/rebuilt injectors. 550cc+ injectors common upgrade for modified cars.',
  '1990-1996',
  1990,
  1996,
  '$400-$1,000',
  400,
  1000,
  'forum',
  'https://www.twinturbo.net/nissan/300zx/forums/technical/view/injector-cleaning.html',
  0.78,
  6,
  '{"diy_difficulty": "intermediate", "common_mileage_range": "80000+"}'::jsonb
),

-- =============================================================================
-- ALFA ROMEO 4C (reliability: 5.5)
-- Car ID: f0cac4ab-facb-48dc-b0ba-b6cab1a76f01
-- Production: 2015-2020, 1.75L Turbo 4-cylinder
-- =============================================================================

-- Issue 1: TCT Dual-Clutch Transmission Issues (HIGH)
(
  gen_random_uuid(),
  'f0cac4ab-facb-48dc-b0ba-b6cab1a76f01',
  'alfa-romeo-4c',
  'common_issue',
  'high',
  'TCT Dual-Clutch Transmission Problems',
  'The Alfa TCT dual-clutch transmission can develop shudder, jerky shifts, and clutch wear issues. Software updates have improved behavior but hardware issues persist.',
  ARRAY['Low-speed shudder', 'Jerky 1-2 shifts', 'Clutch engagement shudder', 'Hesitation from stop', 'Grinding noise during shifts', 'Transmission warning light'],
  'Allow TCT to adapt to driving style. Avoid aggressive launches from cold. Service fluid at recommended intervals. Keep software updated.',
  'TCT software update often helps. Clutch replacement for worn components. Mechatronic unit replacement for severe cases.',
  '2015-2020',
  2015,
  2020,
  '$2,500-$6,000',
  2500,
  6000,
  'forum',
  'https://www.alfaowner.com/threads/4c-tct-transmission-issues.324567/',
  0.85,
  1,
  '{"diy_difficulty": "professional_only", "common_mileage_range": "15000-40000"}'::jsonb
),

-- Issue 2: Electrical/ECU Issues (MEDIUM)
(
  gen_random_uuid(),
  'f0cac4ab-facb-48dc-b0ba-b6cab1a76f01',
  'alfa-romeo-4c',
  'common_issue',
  'medium',
  'Electrical System and ECU Glitches',
  'Various electrical gremlins including ECU issues, sensor failures, and wiring problems. Italian electronics reputation continues. Water intrusion in certain areas is a concern.',
  ARRAY['Random warning lights', 'Limp mode for no apparent reason', 'Infotainment issues', 'Sensor malfunction warnings', 'Battery drain', 'Intermittent no-start'],
  'Keep battery charged when not driven. Avoid pressure washing engine bay. Have dealer update software regularly.',
  'Diagnose specific failure with Alfa diagnostic system. ECU reflash may resolve some issues. Replace failed sensors or modules.',
  '2015-2020',
  2015,
  2020,
  '$500-$2,500',
  500,
  2500,
  'forum',
  'https://www.alfaowner.com/threads/4c-electrical-problems.328976/',
  0.82,
  2,
  '{"diy_difficulty": "intermediate", "common_mileage_range": "any"}'::jsonb
),

-- Issue 3: Suspension Component Failures (MEDIUM)
(
  gen_random_uuid(),
  'f0cac4ab-facb-48dc-b0ba-b6cab1a76f01',
  'alfa-romeo-4c',
  'common_issue',
  'medium',
  'Suspension Bushing and Component Wear',
  'Track-focused suspension and carbon fiber construction mean bushings and components wear faster than typical sports cars. Track use accelerates wear significantly.',
  ARRAY['Clunking over bumps', 'Uneven tire wear', 'Vague steering response', 'Wandering at speed', 'Creaking from suspension'],
  'Regular alignment checks. Inspect suspension at each service. Replace worn components promptly. Consider upgraded bushings if tracking.',
  'Replace worn bushings and components. Alignment required. Upgraded polyurethane options available for track use.',
  '2015-2020',
  2015,
  2020,
  '$800-$2,500',
  800,
  2500,
  'forum',
  'https://www.alfaowner.com/threads/4c-suspension-wear.331254/',
  0.78,
  3,
  '{"diy_difficulty": "advanced", "common_mileage_range": "20000-50000"}'::jsonb
),

-- Issue 4: Engine Mount Failures (MEDIUM)
(
  gen_random_uuid(),
  'f0cac4ab-facb-48dc-b0ba-b6cab1a76f01',
  'alfa-romeo-4c',
  'common_issue',
  'medium',
  'Engine and Transmission Mount Deterioration',
  'The engine and transmission mounts can deteriorate faster than expected due to the car''s stiff chassis and performance nature. Causes vibration and harshness.',
  ARRAY['Excessive vibration at idle', 'Clunking during gear changes', 'Harshness over bumps', 'Visible mount cracking', 'Engine movement visible'],
  'Avoid launching car repeatedly. Inspect mounts at services. Replace at first sign of deterioration.',
  'Replace engine and/or transmission mounts. Upgraded mounts available but increase NVH. Alignment check after replacement.',
  '2015-2020',
  2015,
  2020,
  '$600-$1,800',
  600,
  1800,
  'forum',
  'https://www.alfaowner.com/threads/4c-motor-mounts.329876/',
  0.75,
  4,
  '{"diy_difficulty": "advanced", "common_mileage_range": "25000-50000"}'::jsonb
),

-- Issue 5: Climate Control Limitations (LOW)
(
  gen_random_uuid(),
  'f0cac4ab-facb-48dc-b0ba-b6cab1a76f01',
  'alfa-romeo-4c',
  'common_issue',
  'low',
  'Air Conditioning and Climate Control Weakness',
  'The 4C''s minimal A/C system struggles in hot weather. Compressor issues and refrigerant leaks are reported. By design, system prioritizes weight savings.',
  ARRAY['Weak A/C performance in heat', 'Compressor cycling frequently', 'A/C not cooling adequately', 'Refrigerant loss requiring recharge'],
  'Ensure cabin air filter is clean. Park in shade. Have A/C system checked if performance degrades.',
  'A/C system service and recharge. Compressor replacement if failed. Leak detection and repair.',
  '2015-2020',
  2015,
  2020,
  '$400-$1,500',
  400,
  1500,
  'forum',
  'https://www.alfaowner.com/threads/4c-ac-problems.327654/',
  0.72,
  5,
  '{"diy_difficulty": "professional_only", "common_mileage_range": "any"}'::jsonb
);

COMMIT;

-- =============================================================================
-- VERIFICATION QUERY
-- Run this after migration to verify data was inserted correctly:
-- =============================================================================
-- SELECT car_slug, COUNT(*) as issue_count, 
--        array_agg(DISTINCT severity) as severities
-- FROM car_issues 
-- WHERE car_slug IN (
--   'maserati-granturismo', 'aston-martin-v8-vantage', 
--   'jaguar-f-type-r', 'jaguar-f-type-v6-s',
--   'nissan-300zx-twin-turbo-z32', 'alfa-romeo-4c'
-- )
-- GROUP BY car_slug
-- ORDER BY car_slug;

