-- ============================================================================
-- Populate upgrade_key_parts table
-- Maps parts to upgrade_keys based on category and name patterns
-- Date: 2026-01-21
-- ============================================================================

-- Clear existing data (if any)
-- TRUNCATE upgrade_key_parts;

-- ============================================================================
-- INTAKE PARTS
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'intake' as upgrade_key,
  p.id as part_id,
  CASE 
    WHEN p.name ILIKE '%cold air%' THEN 'primary'
    WHEN p.name ILIKE '%CAI%' THEN 'primary'
    ELSE 'recommended'
  END as role,
  'Mapped from intake category' as notes
FROM parts p
WHERE p.category = 'intake' 
  AND p.is_active = true
ON CONFLICT DO NOTHING;

-- ============================================================================
-- EXHAUST PARTS - Cat-back
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'exhaust-catback' as upgrade_key,
  p.id as part_id,
  CASE 
    WHEN p.name ILIKE '%cat-back%' OR p.name ILIKE '%catback%' THEN 'primary'
    WHEN p.name ILIKE '%axle-back%' OR p.name ILIKE '%axleback%' THEN 'recommended'
    ELSE 'optional'
  END as role,
  'Mapped from exhaust category' as notes
FROM parts p
WHERE p.category = 'exhaust' 
  AND p.is_active = true
  AND (p.name ILIKE '%cat%back%' OR p.name ILIKE '%exhaust%' OR p.name ILIKE '%muffler%' OR p.name ILIKE '%axle%back%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- EXHAUST PARTS - Headers
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'headers' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from exhaust category - headers' as notes
FROM parts p
WHERE p.category = 'exhaust' 
  AND p.is_active = true
  AND (p.name ILIKE '%header%' OR p.name ILIKE '%manifold%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- EXHAUST PARTS - Downpipes
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'downpipe' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from exhaust category - downpipes' as notes
FROM parts p
WHERE p.category = 'exhaust' 
  AND p.is_active = true
  AND (p.name ILIKE '%downpipe%' OR p.name ILIKE '%down pipe%' OR p.name ILIKE '%DP%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUSPENSION - Coilovers (Street)
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'coilovers-street' as upgrade_key,
  p.id as part_id,
  CASE 
    WHEN p.name ILIKE '%street%' OR p.name ILIKE '%comfort%' THEN 'primary'
    ELSE 'recommended'
  END as role,
  'Mapped from suspension category - coilovers' as notes
FROM parts p
WHERE p.category = 'suspension' 
  AND p.is_active = true
  AND (p.name ILIKE '%coilover%' OR p.name ILIKE '%coil over%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUSPENSION - Lowering Springs
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'lowering-springs' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from suspension category - springs' as notes
FROM parts p
WHERE p.category = 'suspension' 
  AND p.is_active = true
  AND (p.name ILIKE '%spring%' OR p.name ILIKE '%lowering%')
  AND NOT (p.name ILIKE '%coilover%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUSPENSION - Sway Bars
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'sway-bars' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from suspension category - sway bars' as notes
FROM parts p
WHERE p.category = 'suspension' 
  AND p.is_active = true
  AND (p.name ILIKE '%sway%' OR p.name ILIKE '%anti-roll%' OR p.name ILIKE '%antiroll%' OR p.name ILIKE '%stabilizer%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUSPENSION - Chassis Bracing
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'chassis-bracing' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from suspension category - bracing' as notes
FROM parts p
WHERE p.category = 'suspension' 
  AND p.is_active = true
  AND (p.name ILIKE '%brace%' OR p.name ILIKE '%strut tower%' OR p.name ILIKE '%subframe%' OR p.name ILIKE '%tie bar%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- BRAKES - Big Brake Kits
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'big-brake-kit' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from brakes category - BBK' as notes
FROM parts p
WHERE p.category = 'brakes' 
  AND p.is_active = true
  AND (p.name ILIKE '%big brake%' OR p.name ILIKE '%bbk%' OR p.name ILIKE '%brake kit%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- BRAKES - Pads
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'brake-pads-street' as upgrade_key,
  p.id as part_id,
  CASE 
    WHEN p.name ILIKE '%street%' OR p.name ILIKE '%daily%' THEN 'primary'
    ELSE 'recommended'
  END as role,
  'Mapped from brakes category - pads' as notes
FROM parts p
WHERE p.category = 'brakes' 
  AND p.is_active = true
  AND (p.name ILIKE '%pad%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- BRAKES - Rotors
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'slotted-rotors' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from brakes category - rotors' as notes
FROM parts p
WHERE p.category = 'brakes' 
  AND p.is_active = true
  AND (p.name ILIKE '%rotor%' OR p.name ILIKE '%disc%' OR p.name ILIKE '%slotted%' OR p.name ILIKE '%drilled%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- BRAKES - Fluid & Lines
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'brake-fluid-lines' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from brakes category - fluid/lines' as notes
FROM parts p
WHERE p.category = 'brakes' 
  AND p.is_active = true
  AND (p.name ILIKE '%fluid%' OR p.name ILIKE '%line%' OR p.name ILIKE '%hose%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- WHEELS & TIRES - Lightweight Wheels
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'wheels-lightweight' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from wheels_tires category - wheels' as notes
FROM parts p
WHERE p.category = 'wheels_tires' 
  AND p.is_active = true
  AND (p.name ILIKE '%wheel%' OR p.name ILIKE '%rim%')
  AND NOT (p.name ILIKE '%tire%' OR p.name ILIKE '%tyre%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- WHEELS & TIRES - Tires
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'tires-performance' as upgrade_key,
  p.id as part_id,
  CASE 
    WHEN p.name ILIKE '%r-comp%' OR p.name ILIKE '%slick%' THEN 'track'
    ELSE 'primary'
  END as role,
  'Mapped from wheels_tires category - tires' as notes
FROM parts p
WHERE p.category = 'wheels_tires' 
  AND p.is_active = true
  AND (p.name ILIKE '%tire%' OR p.name ILIKE '%tyre%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COOLING - Intercooler
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'intercooler' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from cooling category - intercooler' as notes
FROM parts p
WHERE p.category = 'cooling' 
  AND p.is_active = true
  AND (p.name ILIKE '%intercooler%' OR p.name ILIKE '%FMIC%' OR p.name ILIKE '%charge cooler%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COOLING - Radiator
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'radiator-upgrade' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from cooling category - radiator' as notes
FROM parts p
WHERE p.category = 'cooling' 
  AND p.is_active = true
  AND (p.name ILIKE '%radiator%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COOLING - Oil Cooler
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'oil-cooler' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from cooling category - oil cooler' as notes
FROM parts p
WHERE p.category = 'cooling' 
  AND p.is_active = true
  AND (p.name ILIKE '%oil cooler%' OR p.name ILIKE '%oil-cooler%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COOLING - Transmission Cooler
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'trans-cooler' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from cooling category - trans cooler' as notes
FROM parts p
WHERE p.category = 'cooling' 
  AND p.is_active = true
  AND (p.name ILIKE '%trans%cooler%' OR p.name ILIKE '%transmission cooler%' OR p.name ILIKE '%diff cooler%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TUNING - Stage 1
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'stage1-tune' as upgrade_key,
  p.id as part_id,
  CASE 
    WHEN p.name ILIKE '%stage 1%' OR p.name ILIKE '%stage1%' THEN 'primary'
    WHEN p.name ILIKE '%flash%' OR p.name ILIKE '%ECU%' THEN 'primary'
    ELSE 'recommended'
  END as role,
  'Mapped from tune category' as notes
FROM parts p
WHERE p.category = 'tune' 
  AND p.is_active = true
  AND NOT (p.name ILIKE '%stage 2%' OR p.name ILIKE '%stage2%' OR p.name ILIKE '%stage 3%' OR p.name ILIKE '%stage3%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TUNING - Stage 2
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'stage2-tune' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from tune category - stage 2' as notes
FROM parts p
WHERE p.category = 'tune' 
  AND p.is_active = true
  AND (p.name ILIKE '%stage 2%' OR p.name ILIKE '%stage2%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- TUNING - Piggyback
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'piggyback-tuner' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from tune category - piggyback' as notes
FROM parts p
WHERE p.category = 'tune' 
  AND p.is_active = true
  AND (p.name ILIKE '%JB4%' OR p.name ILIKE '%piggy%' OR p.name ILIKE '%plug%play%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FUEL SYSTEM
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'fuel-system-upgrade' as upgrade_key,
  p.id as part_id,
  CASE 
    WHEN p.name ILIKE '%injector%' THEN 'primary'
    WHEN p.name ILIKE '%pump%' THEN 'primary'
    ELSE 'recommended'
  END as role,
  'Mapped from fuel_system category' as notes
FROM parts p
WHERE p.category = 'fuel_system' 
  AND p.is_active = true
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FUEL SYSTEM - HPFP
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'hpfp-upgrade' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from fuel_system category - HPFP' as notes
FROM parts p
WHERE p.category = 'fuel_system' 
  AND p.is_active = true
  AND (p.name ILIKE '%HPFP%' OR p.name ILIKE '%high pressure%' OR p.name ILIKE '%high-pressure%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FORCED INDUCTION - Turbo
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'turbo-upgrade-existing' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from forced_induction category - turbo' as notes
FROM parts p
WHERE p.category = 'forced_induction' 
  AND p.is_active = true
  AND (p.name ILIKE '%turbo%' OR p.name ILIKE '%garrett%' OR p.name ILIKE '%borg%' OR p.name ILIKE '%precision%')
  AND NOT (p.name ILIKE '%supercharger%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- FORCED INDUCTION - Supercharger
-- ============================================================================
INSERT INTO upgrade_key_parts (upgrade_key, part_id, role, notes)
SELECT 
  'supercharger-centrifugal' as upgrade_key,
  p.id as part_id,
  'primary' as role,
  'Mapped from forced_induction category - supercharger' as notes
FROM parts p
WHERE p.category = 'forced_induction' 
  AND p.is_active = true
  AND (p.name ILIKE '%supercharger%' OR p.name ILIKE '%blower%' OR p.name ILIKE '%vortech%' OR p.name ILIKE '%procharger%')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SUMMARY: Show what was created
-- ============================================================================
SELECT 
  upgrade_key,
  COUNT(*) as parts_linked
FROM upgrade_key_parts
GROUP BY upgrade_key
ORDER BY parts_linked DESC;
