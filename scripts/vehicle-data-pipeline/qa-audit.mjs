#!/usr/bin/env node
/**
 * Vehicle Data Pipeline - QA Audit Script
 * 
 * Runs automated quality checks on recently updated vehicle maintenance data.
 * Catches common AI hallucination patterns and suspicious specifications.
 * 
 * Usage:
 *   node scripts/vehicle-data-pipeline/qa-audit.mjs                    # Audit last 48 hours
 *   node scripts/vehicle-data-pipeline/qa-audit.mjs --hours 168        # Audit last week
 *   node scripts/vehicle-data-pipeline/qa-audit.mjs --vehicle "BMW M3" # Audit specific vehicle
 *   node scripts/vehicle-data-pipeline/qa-audit.mjs --all              # Audit all vehicles
 */

import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'node:util';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(projectRoot, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ============================================================================
// QA RULES - Common AI hallucination patterns
// ============================================================================

const QA_RULES = {
  // RULE 1: Supercharged/Turbo engines should NOT use 0W-20 (with exceptions)
  oilViscosityForForcedInduction: {
    severity: 'HIGH',
    check: (car, specs) => {
      const engine = (car.engine || '').toLowerCase();
      const carName = (car.name || '').toLowerCase();
      const brand = (car.brand || '').toLowerCase();
      
      const isForcedInduction = engine.includes('turbo') || 
                                engine.includes('supercharged') || 
                                engine.includes('sc ') ||
                                engine.includes(' sc') ||
                                engine.includes('twin-turbo') ||
                                engine.includes('tt ');
      const viscosity = specs.oil_viscosity || '';
      
      // Exception: Honda/Acura turbo engines are designed for 0W-20
      const isHondaTurbo = (brand === 'honda' || brand === 'acura') && isForcedInduction;
      
      // Exception: Toyota/Lexus modern turbos often use 0W-20
      const isToyotaTurbo = (brand === 'toyota' || brand === 'lexus') && isForcedInduction;
      
      // Exception: Mazda SkyActiv turbos can use 0W-20
      const isMazdaTurbo = brand === 'mazda' && isForcedInduction;
      
      // Exception: Nissan VR30DDTT (Z, Q50, Q60) uses 0W-20
      const isNissanVR30 = (brand === 'nissan' || brand === 'infiniti') && 
                          (engine.includes('vr30') || carName.includes('nissan z') || 
                           carName.includes('q50') || carName.includes('q60'));
      
      // Exception: Audi B9 S4/S5 3.0T uses VW 508.00 which requires 0W-20
      const isAudiB9 = brand === 'audi' && 
                      (carName.includes('s4 b9') || carName.includes('s5 b9') || 
                       carName.includes('s4') || carName.includes('s5')) &&
                      carName.includes('b9');
      
      // Exception: VW Golf R/GTI Mk8 uses VW 508.00 which requires 0W-20
      const isVWMk8 = brand === 'volkswagen' && 
                     (carName.includes('mk8') || carName.includes('viii'));
      
      // Exception: Diesel engines use different oil ratings
      const isDiesel = engine.includes('diesel') || engine.includes('cummins') || 
                       engine.includes('powerstroke') || engine.includes('duramax');
      
      // Exception: Multi-engine vehicles (has "or" in engine description)
      const isMultiEngine = engine.includes(' or ');
      
      // Exception: Some modern VW/Audi 2.0T engines use 0W-20 (but verify)
      // Not exempting these as most EA888 Gen3+ need 0W-40 or 5W-40
      
      if (isForcedInduction && viscosity === '0W-20' && !isHondaTurbo && !isToyotaTurbo && !isMazdaTurbo && !isNissanVR30 && !isAudiB9 && !isVWMk8 && !isDiesel && !isMultiEngine) {
        return {
          field: 'oil_viscosity',
          message: `Forced induction engine (${car.engine}) using 0W-20 - likely needs 0W-40 or 5W-30+`,
          current: viscosity,
          expected: '0W-40, 5W-30, or 5W-40'
        };
      }
      return null;
    }
  },

  // RULE 2: Aftermarket brake brands on non-performance vehicles
  aftermarketBrakesOnNonPerformance: {
    severity: 'HIGH',
    check: (car, specs) => {
      const frontCaliper = (specs.brake_front_caliper_type || '').toLowerCase();
      const rearCaliper = (specs.brake_rear_caliper_type || '').toLowerCase();
      const carName = (car.name || '').toLowerCase();
      const category = (car.category || '').toLowerCase();
      const vehicleType = (car.vehicle_type || '').toLowerCase();
      
      const aftermarketBrands = ['brembo', 'wilwood', 'stoptech', 'ap racing', 'alcon', 'baer'];
      
      // Vehicles that legitimately come with Brembo stock
      const knownBremboStock = [
        // American muscle/performance
        'hellcat', 'gt500', 'z06', 'zl1', 'gt350', '1le', 'mach 1',
        'corvette', 'viper', 'srt 392', 'cts-v', 'ats-v', 'ct5-v',
        'boss 302', 'svt cobra', 'terminator', 'pp2', 'shelby',
        // European exotics/performance
        'porsche', 'ferrari', 'lamborghini', 'mclaren', 'aston martin',
        'audi rs', 'audi r8', 'bmw m', 'mercedes amg', 'mercedes-amg', 'amg gt', 'c63', 'e63', 'g63',
        'alfa romeo quadrifoglio', 'giulia quadrifoglio', 'lotus',
        'jaguar f-type', 'maserati',
        // Audi S-line performance (come with Brembo stock)
        'audi s4', 'audi s5', 'audi s6', 'audi s7', 'audi s8',
        's4 b', 's5 b', 's6 c', 's7 c', 's8 d',
        // Japanese performance
        'type r', 'civic type r', 'nsx', 'gt-r', 'sti', 'wrx sti',
        'evo', 'lancer evo', 'supra', 'rc f', 'lc 500', 'is f', 'gs f',
        // Toyota GR performance (GR86 Premium has Brembo)
        'gr86', 'gr 86', 'toyota 86',
        // Acura performance (Integra Type S, RSX Type-S have Brembo)
        'integra type s', 'integra type-s', 'rsx type-s', 'rsx type s',
        'type s', 'type-s',
        // European hot hatches
        'focus rs', 'golf r', 'rs3', 'tt rs', 's3',
        // Cayman/Boxster/911
        'cayman', 'boxster', '718', '981', '987', '986',
        '911', 'carrera', '997', '991', '992', '996',
        // BMW M cars
        '1m', 'z4 m', 'z4m', '1 series m'
      ];
      
      const isPerformanceVehicle = knownBremboStock.some(v => carName.includes(v));
      const isTruckOrSUV = ['truck', 'suv', 'pickup', 'off-road'].some(t => 
        category.includes(t) || vehicleType.includes(t)
      );
      
      for (const brand of aftermarketBrands) {
        if ((frontCaliper.includes(brand) || rearCaliper.includes(brand)) && 
            !isPerformanceVehicle && !carName.includes('trx')) {
          return {
            field: 'brake_caliper',
            message: `${brand} brakes on ${car.name} - may be aftermarket confused with stock`,
            current: `Front: ${specs.brake_front_caliper_type}, Rear: ${specs.brake_rear_caliper_type}`,
            expected: 'Standard OEM sliding caliper (1-2 piston)'
          };
        }
      }
      
      // Extra scrutiny for trucks/SUVs
      if (isTruckOrSUV && (frontCaliper.includes('6-piston') || frontCaliper.includes('4-piston brembo'))) {
        return {
          field: 'brake_caliper',
          message: `Multi-piston brakes on truck/SUV ${car.name} - verify this is stock`,
          current: specs.brake_front_caliper_type,
          expected: 'Standard OEM sliding caliper'
        };
      }
      
      return null;
    }
  },

  // RULE 3: Spark plug gap too large (> 1.0mm is suspicious for boosted engines)
  sparkPlugGapTooLarge: {
    severity: 'MEDIUM',
    check: (car, specs) => {
      const gap = parseFloat(specs.spark_plug_gap_mm);
      const engine = (car.engine || '').toLowerCase();
      
      // Skip diesel engines (they use glow plugs, not spark plugs)
      const isDiesel = engine.includes('diesel') || engine.includes('cummins') || 
                       engine.includes('powerstroke') || engine.includes('duramax');
      if (isDiesel) return null;
      
      // Check if ONLY boosted (exclude "turbo-diesel" mentions in multi-engine vehicles)
      const hasTurboGas = engine.includes('turbo') && !engine.includes('turbo-diesel') && !engine.includes('turbodiesel');
      const isBoosted = hasTurboGas || engine.includes('supercharged') ||
                        engine.includes('sc ') || engine.includes('tt ');
      
      // Skip multi-engine vehicles where NA is an option (e.g., "3.6L V6 or 2.8L Turbo-Diesel")
      const isMultiEngine = engine.includes(' or ');
      if (isMultiEngine) return null;

      if (isBoosted && gap > 0.85) {
        return {
          field: 'spark_plug_gap_mm',
          message: `Spark plug gap ${gap}mm too large for boosted engine (${car.engine})`,
          current: `${gap}mm`,
          expected: '0.6-0.8mm for forced induction'
        };
      }

      if (gap > 1.2) {
        return {
          field: 'spark_plug_gap_mm',
          message: `Spark plug gap ${gap}mm seems unusually large`,
          current: `${gap}mm`,
          expected: '0.7-1.1mm typical'
        };
      }

      return null;
    }
  },

  // RULE 4: Oil change interval too long for performance engines
  oilChangeIntervalTooLong: {
    severity: 'MEDIUM',
    check: (car, specs) => {
      const interval = specs.oil_change_interval_miles;
      const engine = (car.engine || '').toLowerCase();
      const carName = (car.name || '').toLowerCase();
      
      const isHighPerformance = engine.includes('supercharged') || 
                                carName.includes('hellcat') ||
                                carName.includes('gt500') ||
                                carName.includes('z06') ||
                                carName.includes('zl1');
      
      if (isHighPerformance && interval > 7500) {
        return {
          field: 'oil_change_interval_miles',
          message: `${interval} mile interval too long for high-performance engine`,
          current: `${interval} miles`,
          expected: '5000-7500 miles for supercharged/high-performance'
        };
      }
      
      return null;
    }
  },

  // RULE 5: Coolant capacity sanity check
  coolantCapacitySanityCheck: {
    severity: 'LOW',
    check: (car, specs) => {
      const capacity = parseFloat(specs.coolant_capacity_liters);
      
      if (capacity && (capacity < 4 || capacity > 25)) {
        return {
          field: 'coolant_capacity_liters',
          message: `Coolant capacity ${capacity}L seems out of range`,
          current: `${capacity} liters`,
          expected: '4-20 liters typical'
        };
      }
      
      return null;
    }
  },

  // RULE 6: Fuel tank capacity sanity check
  fuelTankSanityCheck: {
    severity: 'LOW',
    check: (car, specs) => {
      const gallons = parseFloat(specs.fuel_tank_capacity_gallons);
      const vehicleType = (car.vehicle_type || '').toLowerCase();
      const isTruck = vehicleType.includes('truck') || vehicleType.includes('suv');
      
      if (gallons) {
        if (gallons < 8 || gallons > 50) {
          return {
            field: 'fuel_tank_capacity_gallons',
            message: `Fuel tank ${gallons} gallons seems out of range`,
            current: `${gallons} gallons`,
            expected: '10-40 gallons typical'
          };
        }
        
        // Sports cars shouldn't have truck-sized tanks
        if (!isTruck && gallons > 25) {
          return {
            field: 'fuel_tank_capacity_gallons',
            message: `${gallons} gallon tank seems large for non-truck`,
            current: `${gallons} gallons`,
            expected: '12-22 gallons for sports cars'
          };
        }
      }
      
      return null;
    }
  },

  // RULE 7: Battery CCA sanity check
  batteryCCASanityCheck: {
    severity: 'LOW',
    check: (car, specs) => {
      const cca = specs.battery_cca;
      
      if (cca && (cca < 300 || cca > 1200)) {
        return {
          field: 'battery_cca',
          message: `Battery CCA ${cca} seems out of range`,
          current: `${cca} CCA`,
          expected: '400-900 CCA typical'
        };
      }
      
      return null;
    }
  },

  // RULE 8: Fuel octane too low for forced induction (HIGH PERFORMANCE ONLY)
  fuelOctaneForForcedInduction: {
    severity: 'HIGH',
    check: (car, specs) => {
      const engine = (car.engine || '').toLowerCase();
      const carName = (car.name || '').toLowerCase();
      const category = (car.category || '').toLowerCase();
      const vehicleType = (car.vehicle_type || '').toLowerCase();
      
      const isForcedInduction = engine.includes('turbo') || 
                                engine.includes('supercharged') || 
                                engine.includes('sc ') ||
                                engine.includes('tt ');
      const octane = specs.fuel_octane_minimum;
      
      // Skip diesel engines (use cetane, not octane)
      const isDiesel = engine.includes('diesel') || engine.includes('cummins') || 
                       engine.includes('powerstroke') || engine.includes('duramax');
      if (isDiesel) return null;
      
      // Skip trucks/SUVs - their turbos ARE designed for 87 octane
      const isTruckOrSUV = ['truck', 'suv', 'pickup', 'off-road'].some(t => 
        category.includes(t) || vehicleType.includes(t) ||
        carName.includes('f-150') || carName.includes('tacoma') || 
        carName.includes('tundra') || carName.includes('bronco') ||
        carName.includes('ranger') || carName.includes('maverick') ||
        carName.includes('silverado') || carName.includes('colorado') ||
        carName.includes('canyon') || carName.includes('sequoia') ||
        carName.includes('4runner')
      );
      if (isTruckOrSUV) return null;
      
      // Skip economy turbos designed for 87 (Mazda SkyActiv, Honda 1.5T)
      const isEconomyTurbo = carName.includes('mazda 3') || carName.includes('mazda 6') ||
                             carName.includes('accord 1.5') || carName.includes('civic 1.5');
      if (isEconomyTurbo) return null;
      
      // Only flag performance turbos with low octane
      if (isForcedInduction && octane && octane < 91) {
        return {
          field: 'fuel_octane_minimum',
          message: `Performance turbo/supercharged engine showing ${octane} octane minimum - should be 91+`,
          current: `${octane} octane`,
          expected: '91 or 93 octane'
        };
      }
      return null;
    }
  },

  // RULE 9: Missing critical wheel specs
  missingWheelSpecs: {
    severity: 'MEDIUM',
    check: (car, specs) => {
      const missingFields = [];
      if (!specs.wheel_bolt_pattern) missingFields.push('wheel_bolt_pattern');
      if (!specs.wheel_lug_torque_ft_lbs) missingFields.push('wheel_lug_torque_ft_lbs');
      if (!specs.wheel_center_bore_mm) missingFields.push('wheel_center_bore_mm');
      
      if (missingFields.length >= 2) {
        return {
          field: 'wheel_specs',
          message: `Missing critical wheel specs: ${missingFields.join(', ')}`,
          current: 'NULL',
          expected: 'Complete wheel specs for fitment guidance'
        };
      }
      return null;
    }
  },

  // RULE 10: Missing OEM part numbers for common consumables
  missingOEMParts: {
    severity: 'LOW',
    check: (car, specs) => {
      const missingParts = [];
      if (!specs.oil_filter_oem_part) missingParts.push('oil_filter');
      if (!specs.spark_plug_oem_part) missingParts.push('spark_plug');
      if (!specs.air_filter_oem_part) missingParts.push('air_filter');
      
      if (missingParts.length >= 2) {
        return {
          field: 'oem_parts',
          message: `Missing OEM part numbers: ${missingParts.join(', ')}`,
          current: 'NULL',
          expected: 'OEM or equivalent part numbers'
        };
      }
      return null;
    }
  },

  // RULE 11: Oil filter cross-brand check
  oilFilterCrossCheck: {
    severity: 'LOW',
    check: (car, specs) => {
      const filter = specs.oil_filter_oem_part || '';
      
      // Common filter/vehicle mismatches (AI sometimes copies wrong brand's filter)
      const moparFilters = ['68191349', '5281090', '4884899'];
      const gmFilters = ['PF63', 'PF64', 'PF66'];
      const fordFilters = ['FL-500S', 'FL-400S'];
      
      const brand = (car.brand || '').toLowerCase();
      
      if (brand.includes('ford') && moparFilters.some(f => filter.includes(f))) {
        return {
          field: 'oil_filter_oem_part',
          message: `Ford vehicle using Mopar filter part number`,
          current: filter,
          expected: 'Ford/Motorcraft filter'
        };
      }
      
      if ((brand.includes('ram') || brand.includes('dodge') || brand.includes('chrysler') || brand.includes('jeep')) && 
          gmFilters.some(f => filter.includes(f))) {
        return {
          field: 'oil_filter_oem_part',
          message: `Mopar vehicle using GM filter part number`,
          current: filter,
          expected: 'Mopar filter'
        };
      }
      
      return null;
    }
  },

  // ============================================================================
  // RULES 12-17: LEARNED FROM QA SESSION (JAN 2026)
  // These catch model-year-specific and brand-specific edge cases
  // ============================================================================

  // RULE 12: Audi B9 vs B8 oil spec mismatch
  audiB9OilSpec: {
    severity: 'HIGH',
    check: (car, specs) => {
      const carName = (car.name || '').toLowerCase();
      const brand = (car.brand || '').toLowerCase();
      const viscosity = specs.oil_viscosity || '';
      const oilSpec = (specs.oil_spec || '').toLowerCase();
      
      // Only check Audi S4/S5
      if (brand !== 'audi') return null;
      if (!carName.includes('s4') && !carName.includes('s5')) return null;
      
      // B9 (2017+) should use VW 508.00 with 0W-20
      const isB9 = carName.includes('b9');
      // RS5 B9 is an exception - uses 2.9T engine, needs 5W-40
      const isRS5 = carName.includes('rs5');
      
      if (isB9 && !isRS5) {
        // B9 S4/S5 should use 0W-20 with VW 508.00
        if (viscosity !== '0W-20') {
          return {
            field: 'oil_viscosity',
            message: `Audi ${carName.includes('s5') ? 'S5' : 'S4'} B9 (2017+) should use 0W-20 with VW 508.00`,
            current: viscosity,
            expected: '0W-20 (VW 508.00)'
          };
        }
      } else if (!isB9 && !isRS5) {
        // B8 and earlier should use 5W-40 with VW 502.00
        if (viscosity === '0W-20') {
          return {
            field: 'oil_viscosity',
            message: `Audi ${carName.includes('s5') ? 'S5' : 'S4'} (pre-B9) should use 5W-40 with VW 502.00`,
            current: viscosity,
            expected: '5W-40 (VW 502.00)'
          };
        }
      }
      
      return null;
    }
  },

  // RULE 13: Honda CIVIC Type R wheel bolt pattern (FK8/FL5 only)
  hondaCivicTypeRWheelPattern: {
    severity: 'HIGH',
    check: (car, specs) => {
      const carName = (car.name || '').toLowerCase();
      const boltPattern = specs.wheel_bolt_pattern || '';
      
      // Only CIVIC Type R uses 5x120 (FK8/FL5)
      // Acura Integra Type R and NSX Type R use different patterns
      const isCivicTypeR = (carName.includes('civic') && carName.includes('type r')) ||
                          carName.includes('fk8') || carName.includes('fl5');
      
      // Don't flag Integra Type R or other Type R models
      if (carName.includes('integra') || carName.includes('nsx')) {
        return null;
      }
      
      if (isCivicTypeR && boltPattern && boltPattern !== '5x120') {
        return {
          field: 'wheel_bolt_pattern',
          message: `Civic Type R (FK8/FL5) uses 5x120 bolt pattern, not standard Honda 5x114.3`,
          current: boltPattern,
          expected: '5x120'
        };
      }
      
      return null;
    }
  },

  // RULE 14: BMW lug torque verification
  bmwLugTorque: {
    severity: 'MEDIUM',
    check: (car, specs) => {
      const brand = (car.brand || '').toLowerCase();
      const lugTorque = specs.wheel_lug_torque_ft_lbs;
      
      // BMW should be 103 ft-lbs (140 Nm), not 88
      if (brand === 'bmw' && lugTorque && lugTorque < 100) {
        return {
          field: 'wheel_lug_torque_ft_lbs',
          message: `BMW lug torque should be 103 ft-lbs (140 Nm)`,
          current: `${lugTorque} ft-lbs`,
          expected: '103 ft-lbs'
        };
      }
      
      return null;
    }
  },

  // RULE 15: Ferrari wheel bolt pattern (modern 5x114.3, not 5x108)
  ferrariWheelPattern: {
    severity: 'HIGH',
    check: (car, specs) => {
      const brand = (car.brand || '').toLowerCase();
      const carName = (car.name || '').toLowerCase();
      const boltPattern = specs.wheel_bolt_pattern || '';
      
      // Modern Ferraris (458 and newer) use 5x114.3
      const modernFerrari = ['458', '488', 'f8', '296', 'sf90', 'roma', '812'];
      const isModernFerrari = brand === 'ferrari' && 
        modernFerrari.some(m => carName.includes(m));
      
      if (isModernFerrari && boltPattern && boltPattern !== '5x114.3') {
        return {
          field: 'wheel_bolt_pattern',
          message: `Modern Ferrari uses 5x114.3 bolt pattern`,
          current: boltPattern,
          expected: '5x114.3'
        };
      }
      
      return null;
    }
  },

  // RULE 16: Cadillac ATS-V vs CT5-V oil spec
  cadillacVSeriesOil: {
    severity: 'HIGH',
    check: (car, specs) => {
      const carName = (car.name || '').toLowerCase();
      const brand = (car.brand || '').toLowerCase();
      const viscosity = specs.oil_viscosity || '';
      
      if (brand !== 'cadillac') return null;
      
      // ATS-V uses LF4 twin-turbo V6 → Dexos1 5W-30
      if (carName.includes('ats-v') || carName.includes('ats v')) {
        if (viscosity !== '5W-30') {
          return {
            field: 'oil_viscosity',
            message: `Cadillac ATS-V (LF4 engine) requires Dexos1 5W-30`,
            current: viscosity,
            expected: '5W-30 (Dexos1)'
          };
        }
      }
      
      // CT5-V Blackwing uses LT4 supercharged V8 → DexosR 0W-40
      if (carName.includes('ct5-v') && carName.includes('blackwing')) {
        if (viscosity !== '0W-40') {
          return {
            field: 'oil_viscosity',
            message: `CT5-V Blackwing (LT4 engine) requires DexosR 0W-40`,
            current: viscosity,
            expected: '0W-40 (DexosR)'
          };
        }
      }
      
      return null;
    }
  },

  // RULE 17: VW Golf R/GTI Mk7 vs Mk8 oil spec
  vwGolfOilSpec: {
    severity: 'HIGH',
    check: (car, specs) => {
      const carName = (car.name || '').toLowerCase();
      const brand = (car.brand || '').toLowerCase();
      const viscosity = specs.oil_viscosity || '';
      
      if (brand !== 'volkswagen') return null;
      if (!carName.includes('golf') && !carName.includes('gti')) return null;
      
      // Mk7 uses VW 502.00 → 5W-40
      const isMk7 = carName.includes('mk7') || carName.includes('vii');
      // Mk8 uses VW 508.00 → 0W-20
      const isMk8 = carName.includes('mk8') || carName.includes('viii');
      
      if (isMk7 && viscosity === '0W-20') {
        return {
          field: 'oil_viscosity',
          message: `Golf R/GTI Mk7 should use 5W-40 (VW 502.00)`,
          current: viscosity,
          expected: '5W-40'
        };
      }
      
      if (isMk8 && viscosity === '5W-40') {
        return {
          field: 'oil_viscosity',
          message: `Golf R/GTI Mk8 should use 0W-20 (VW 508.00)`,
          current: viscosity,
          expected: '0W-20'
        };
      }
      
      return null;
    }
  }
};

// ============================================================================
// MAIN AUDIT LOGIC
// ============================================================================

async function runAudit(options) {
  console.log('\n🔍 Vehicle Data QA Audit\n');
  console.log('='.repeat(60));
  
  // Build query based on options
  let query = supabase
    .from('vehicle_maintenance_specs')
    .select(`
      *,
      cars!inner (
        id, name, slug, brand, engine, vehicle_type, category
      )
    `);
  
  if (options.vehicle) {
    query = query.ilike('cars.name', `%${options.vehicle}%`);
  } else if (!options.all) {
    const hoursAgo = new Date(Date.now() - (options.hours || 48) * 60 * 60 * 1000).toISOString();
    query = query.gte('updated_at', hoursAgo);
  }
  
  const { data: vehicles, error } = await query;
  
  if (error) {
    console.error('Database error:', error.message);
    process.exit(1);
  }
  
  console.log(`\nAuditing ${vehicles.length} vehicles...\n`);
  
  const issues = {
    HIGH: [],
    MEDIUM: [],
    LOW: []
  };
  
  for (const record of vehicles) {
    const car = record.cars;
    const specs = record;
    
    for (const [ruleName, rule] of Object.entries(QA_RULES)) {
      const result = rule.check(car, specs);
      if (result) {
        issues[rule.severity].push({
          vehicle: car.name,
          slug: car.slug,
          rule: ruleName,
          ...result
        });
      }
    }
  }
  
  // Output results
  const totalIssues = issues.HIGH.length + issues.MEDIUM.length + issues.LOW.length;
  
  if (totalIssues === 0) {
    console.log('✅ No issues found!\n');
    return;
  }
  
  console.log(`\n⚠️  Found ${totalIssues} potential issues:\n`);
  
  if (issues.HIGH.length > 0) {
    console.log('🔴 HIGH SEVERITY:');
    console.log('-'.repeat(60));
    for (const issue of issues.HIGH) {
      console.log(`  ${issue.vehicle} (${issue.slug})`);
      console.log(`    Field: ${issue.field}`);
      console.log(`    Issue: ${issue.message}`);
      console.log(`    Current: ${issue.current}`);
      console.log(`    Expected: ${issue.expected}`);
      console.log('');
    }
  }
  
  if (issues.MEDIUM.length > 0) {
    console.log('\n🟡 MEDIUM SEVERITY:');
    console.log('-'.repeat(60));
    for (const issue of issues.MEDIUM) {
      console.log(`  ${issue.vehicle} (${issue.slug})`);
      console.log(`    Field: ${issue.field}`);
      console.log(`    Issue: ${issue.message}`);
      console.log(`    Current: ${issue.current}`);
      console.log('');
    }
  }
  
  if (issues.LOW.length > 0 && options.verbose) {
    console.log('\n🟢 LOW SEVERITY:');
    console.log('-'.repeat(60));
    for (const issue of issues.LOW) {
      console.log(`  ${issue.vehicle}: ${issue.message}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY:');
  console.log(`  🔴 High: ${issues.HIGH.length}`);
  console.log(`  🟡 Medium: ${issues.MEDIUM.length}`);
  console.log(`  🟢 Low: ${issues.LOW.length} ${!options.verbose ? '(use --verbose to see)' : ''}`);
  console.log('='.repeat(60));
  
  // Return exit code based on high-severity issues
  if (issues.HIGH.length > 0) {
    console.log('\n❌ High-severity issues require manual review!\n');
    process.exit(1);
  }
}

// ============================================================================
// CLI
// ============================================================================

const { values } = parseArgs({
  options: {
    hours: { type: 'string', short: 'h' },
    vehicle: { type: 'string', short: 'v' },
    all: { type: 'boolean', short: 'a' },
    verbose: { type: 'boolean' }
  }
});

runAudit({
  hours: values.hours ? parseInt(values.hours) : 48,
  vehicle: values.vehicle,
  all: values.all,
  verbose: values.verbose
}).catch(console.error);
