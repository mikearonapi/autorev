/**
 * Engine Family Reference Specifications
 * 
 * Known-correct specifications for common engine families.
 * Used to validate and override AI-generated data.
 * 
 * Sources: OEM service manuals, official specification sheets
 */

export const ENGINE_FAMILY_SPECS = {
  // ==========================================================================
  // STELLANTIS / FCA ENGINES
  // ==========================================================================
  
  'hellcat': {
    pattern: /6\.2l?\s*(supercharged|sc)|hellcat|redeye|demon|trackhawk|trx/i,
    specs: {
      oil_viscosity: '0W-40',
      oil_spec: 'API SP, MS-12633 (Pennzoil Ultra Platinum)',
      oil_capacity_quarts: 7.5,
      oil_change_interval_miles: 6000,
      oil_change_interval_months: 6,
      spark_plug_gap_mm: 0.74, // Tighter for boost
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'Supercharged HEMI - requires 0W-40, NOT 0W-20'
  },
  
  'hemi_64': {
    pattern: /6\.4l?\s*(hemi|srt|392)|srt[\s-]?392|apache/i,
    specs: {
      oil_viscosity: '0W-40',
      oil_spec: 'API SP, MS-12633',
      oil_capacity_quarts: 7.0,
      oil_change_interval_miles: 6000,
      spark_plug_gap_mm: 0.74,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: '6.4L HEMI (Apache/392) - high performance NA V8'
  },
  
  'hemi_57': {
    pattern: /5\.7l?\s*hemi|hemi\s*5\.7/i,
    specs: {
      oil_viscosity: '0W-20',
      oil_spec: 'API SP, MS-6395',
      oil_capacity_quarts: 7.0,
      oil_change_interval_miles: 8000,
      spark_plug_gap_mm: 1.02, // NA engine can use larger gap
      fuel_octane_minimum: 87,
      fuel_octane_recommended: 89
    },
    notes: '5.7L HEMI - standard MDS-equipped engine'
  },
  
  // ==========================================================================
  // GM / CHEVROLET ENGINES
  // ==========================================================================
  
  'lt4': {
    pattern: /lt4|6\.2l?\s*(supercharged|sc).*gm|zl1|ct5-?v\s*blackwing|cts-?v\s*(gen\s*)?3/i,
    specs: {
      oil_viscosity: '0W-40',
      oil_spec: 'DexosR, GM 19370138',
      oil_capacity_quarts: 10.0,
      oil_change_interval_miles: 7500,
      spark_plug_gap_mm: 0.74,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'GM LT4 supercharged - requires DexosR 0W-40'
  },
  
  'lf4_ats_v': {
    // Cadillac ATS-V with LF4 twin-turbo V6 - DIFFERENT from LT4
    pattern: /lf4|ats-?v|3\.6l?\s*(twin.?turbo|tt).*cadillac/i,
    specs: {
      oil_viscosity: '5W-30',
      oil_spec: 'Dexos1 Gen 2',
      oil_capacity_quarts: 7.0,
      oil_change_interval_miles: 7500,
      spark_plug_gap_mm: 0.70,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'Cadillac LF4 3.6L twin-turbo V6 - uses Dexos1 5W-30 (NOT 5W-40)'
  },
  
  'lf3_ct4_v': {
    // CT4-V Blackwing with LF4 twin-turbo V6
    pattern: /ct4-?v\s*blackwing/i,
    specs: {
      oil_viscosity: '5W-30',
      oil_spec: 'Dexos1 Gen 2',
      oil_capacity_quarts: 7.0,
      oil_change_interval_miles: 7500,
      spark_plug_gap_mm: 0.70,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'CT4-V Blackwing 3.6L twin-turbo V6 - Dexos1 5W-30'
  },
  
  'lt6': {
    pattern: /lt6|5\.5l?\s*(flat.?plane|dohc).*v8|c8\s*z06/i,
    specs: {
      oil_viscosity: '0W-40',
      oil_spec: 'Dexos R, GM 19432777',
      oil_capacity_quarts: 9.0,
      oil_change_interval_miles: 7500,
      spark_plug_gap_mm: 0.70,
      fuel_octane_minimum: 93,
      fuel_octane_recommended: 93
    },
    notes: 'C8 Z06 flat-plane crank V8'
  },
  
  'lt2': {
    pattern: /lt2|c8.*stingray|6\.2l?\s*(v8)?\s*(lt2|c8)/i,
    specs: {
      oil_viscosity: '0W-40',
      oil_spec: 'Dexos2',
      oil_capacity_quarts: 7.5,
      oil_change_interval_miles: 7500,
      spark_plug_gap_mm: 0.74,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'C8 Corvette base engine'
  },
  
  'ls7': {
    pattern: /ls7|7\.0l?\s*(v8)?|c6\s*z06/i,
    specs: {
      oil_viscosity: '5W-30',
      oil_spec: 'GM 88861583 or Mobil 1 0W-40',
      oil_capacity_quarts: 8.5,
      oil_change_interval_miles: 5000,
      spark_plug_gap_mm: 1.02,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'LS7 NA 7.0L - sensitive to oil, 5000mi intervals'
  },
  
  'lsa': {
    pattern: /lsa|cts-?v\s*(gen\s*)?2|6\.2l?\s*sc.*lsa/i,
    specs: {
      oil_viscosity: '5W-30',
      oil_spec: 'Dexos1 or GM 88862630',
      oil_capacity_quarts: 8.0,
      oil_change_interval_miles: 7500,
      spark_plug_gap_mm: 0.74,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'LSA supercharged V8 (CTS-V Gen 2)'
  },
  
  // ==========================================================================
  // FORD ENGINES
  // ==========================================================================
  
  'predator': {
    pattern: /predator|5\.2l?\s*(supercharged|sc)|gt500\s*(2020|2021|2022|2023|2024)/i,
    specs: {
      oil_viscosity: '5W-50',
      oil_spec: 'Motorcraft SAE 5W-50 Full Synthetic, WSS-M2C931-C',
      oil_capacity_quarts: 10.0,
      oil_change_interval_miles: 7500,
      spark_plug_gap_mm: 0.65,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'Predator engine - requires 5W-50'
  },
  
  'voodoo': {
    pattern: /voodoo|5\.2l?\s*(flat.?plane|na)|gt350/i,
    specs: {
      oil_viscosity: '5W-50',
      oil_spec: 'Motorcraft SAE 5W-50 Full Synthetic',
      oil_capacity_quarts: 10.0,
      oil_change_interval_miles: 5000,
      spark_plug_gap_mm: 0.80,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'Voodoo flat-plane crank - requires 5W-50'
  },
  
  'coyote': {
    pattern: /coyote|5\.0l?\s*(v8)?.*mustang|mustang.*5\.0/i,
    specs: {
      oil_viscosity: '5W-20',
      oil_spec: 'Motorcraft SAE 5W-20 Full Synthetic, WSS-M2C961-A1',
      oil_capacity_quarts: 8.0,
      oil_change_interval_miles: 10000,
      spark_plug_gap_mm: 0.87,
      fuel_octane_minimum: 87,
      fuel_octane_recommended: 93
    },
    notes: 'Coyote V8 - various generations'
  },
  
  'ecoboost_35': {
    pattern: /3\.5l?\s*(twin.?turbo|tt|ecoboost)|ecoboost\s*3\.5|f.?150.*3\.5/i,
    specs: {
      oil_viscosity: '5W-30',
      oil_spec: 'Motorcraft SAE 5W-30 Full Synthetic',
      oil_capacity_quarts: 6.0,
      oil_change_interval_miles: 7500,
      spark_plug_gap_mm: 0.70,
      fuel_octane_minimum: 87,
      fuel_octane_recommended: 91
    },
    notes: '3.5L EcoBoost - turbo requires tighter plug gap'
  },
  
  // ==========================================================================
  // BMW ENGINES
  // ==========================================================================
  
  's55': {
    pattern: /s55|3\.0l?\s*(tt|twin.?turbo).*i6.*m|m3\s*f80|m4\s*f82|m4\s*gts|m2\s*comp/i,
    specs: {
      oil_viscosity: '0W-30',
      oil_spec: 'BMW LL-01/LL-01FE',
      oil_capacity_quarts: 6.9,
      oil_change_interval_miles: 7500,
      spark_plug_gap_mm: 0.70,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'S55 twin-turbo - LL-01 spec required'
  },
  
  's58': {
    pattern: /s58|m3\s*g80|m4\s*g82|m4\s*csl|x3\s*m|x4\s*m/i,
    specs: {
      oil_viscosity: '0W-30',
      oil_spec: 'BMW LL-01/LL-17FE+',
      oil_capacity_quarts: 7.4,
      oil_change_interval_miles: 7500,
      spark_plug_gap_mm: 0.70,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'S58 twin-turbo - latest M3/M4'
  },
  
  'b58': {
    pattern: /b58|3\.0l?\s*(turbo|t).*i6|340i|m340i|supra.*3\.0|z4\s*m40i/i,
    specs: {
      oil_viscosity: '0W-30',
      oil_spec: 'BMW LL-01/LL-01FE',
      oil_capacity_quarts: 6.6,
      oil_change_interval_miles: 10000,
      spark_plug_gap_mm: 0.75,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'B58 turbo I6 - shared with Supra'
  },
  
  'n54': {
    pattern: /n54|3\.0l?\s*(tt|twin.?turbo).*i6.*n54|135i|335i\s*e9|1m.*n54/i,
    specs: {
      oil_viscosity: '0W-30',
      oil_spec: 'BMW LL-01',
      oil_capacity_quarts: 6.9,
      oil_change_interval_miles: 7500, // More frequent for TT
      spark_plug_gap_mm: 0.70,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'N54 twin-turbo I6 - 135i, early 335i'
  },
  
  'n55': {
    pattern: /n55|3\.0l?\s*turbo.*i6|335i|435i|535i|x5.*35i|1m/i,
    specs: {
      oil_viscosity: '0W-30',
      oil_spec: 'BMW LL-01',
      oil_capacity_quarts: 6.9,
      oil_change_interval_miles: 10000,
      spark_plug_gap_mm: 0.75,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'N55 turbo I6'
  },
  
  // ==========================================================================
  // VOLKSWAGEN/AUDI ENGINES
  // ==========================================================================
  
  // NOTE: VW/Audi oil specs are MODEL-YEAR SPECIFIC
  // - VW 502.00 → older engines, uses 5W-40
  // - VW 508.00 → 2017+ B9 platform engines, uses 0W-20
  
  'ea888_gen3_mk7': {
    // Golf R/GTI Mk7, Jetta GLI Mk7 - use VW 502.00 with 5W-40
    pattern: /golf\s*(r|gti)\s*(mk7|vii)|gti\s*mk7|jetta\s*gli\s*mk7|2\.0l?\s*turbo.*ea888/i,
    specs: {
      oil_viscosity: '5W-40',
      oil_spec: 'VW 502.00',
      oil_capacity_quarts: 5.7,
      oil_change_interval_miles: 10000,
      spark_plug_gap_mm: 0.70,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'EA888 Gen3 (Mk7) - VW 502.00 spec requires 5W-40'
  },
  
  'ea888_gen3_mk8': {
    // Golf R/GTI Mk8 - newer spec
    pattern: /golf\s*(r|gti)\s*(mk8|viii)|gti\s*mk8/i,
    specs: {
      oil_viscosity: '0W-20',
      oil_spec: 'VW 508.00',
      oil_capacity_quarts: 5.7,
      oil_change_interval_miles: 10000,
      spark_plug_gap_mm: 0.70,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'EA888 Gen4 (Mk8) - VW 508.00 spec uses 0W-20'
  },
  
  'audi_ea888_a3_a4': {
    // Audi A3/A4 with 1.8T or 2.0T EA888 - requires 91 octane
    pattern: /audi\s*a[34].*1\.[48].*t|audi\s*a[34].*2\.0.*t|audi\s*a[34].*tfsi|1\.[48]l?\s*(turbo|tfsi).*audi|2\.0l?\s*(turbo|tfsi).*audi\s*a[34]/i,
    specs: {
      oil_viscosity: '0W-30',
      oil_spec: 'VW 502.00',
      oil_capacity_quarts: 5.2,
      oil_change_interval_miles: 10000,
      spark_plug_gap_mm: 0.70,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'Audi 1.8T/2.0T EA888 (A3/A4) - requires 91 octane'
  },
  
  'audi_ea839_b9': {
    // Audi S4/S5 B9 (2017+) with 3.0T EA839 engine - VW 508.00
    pattern: /s[45]\s*b9|audi\s*(s4|s5).*201[789]|audi\s*(s4|s5).*202[0-9]|3\.0l?\s*(turbo|tfsi).*b9/i,
    specs: {
      oil_viscosity: '0W-20',
      oil_spec: 'VW 508.00',
      oil_capacity_quarts: 7.7,
      oil_change_interval_miles: 10000,
      spark_plug_gap_mm: 0.70,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'Audi 3.0T EA839 (B9 2017+) - VW 508.00 spec requires 0W-20'
  },
  
  'audi_3l_supercharged_b8': {
    // Audi S4/S5/RS5 B8 (2009-2016) with 3.0T supercharged - VW 502.00
    pattern: /s[45]\s*b8|rs5\s*b8|audi\s*(s4|s5|rs5).*201[0-6]|audi\s*(s4|s5|rs5).*200[89]|3\.0l?\s*(sc|supercharged)/i,
    specs: {
      oil_viscosity: '5W-40',
      oil_spec: 'VW 502.00/505.00',
      oil_capacity_quarts: 7.5,
      oil_change_interval_miles: 10000,
      spark_plug_gap_mm: 0.70,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'Audi 3.0T Supercharged (B8) - VW 502.00 spec requires 5W-40'
  },
  
  'audi_rs5_b9': {
    // RS5 B9 with 2.9T twin-turbo - different engine than S5 B9
    pattern: /rs5\s*b9|audi\s*rs5.*201[89]|audi\s*rs5.*202[0-9]|2\.9l?\s*(turbo|tt|tfsi)/i,
    specs: {
      oil_viscosity: '5W-40',
      oil_spec: 'VW 502.00',
      oil_capacity_quarts: 8.5,
      oil_change_interval_miles: 10000,
      spark_plug_gap_mm: 0.65,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'RS5 B9 2.9T twin-turbo - VW 502.00 spec requires 5W-40 (NOT 508.00)'
  },
  
  'ea855_rs3': {
    pattern: /ea855|2\.5l?\s*(turbo|tfsi)|rs3|tt\s*rs|rs\s*q3/i,
    specs: {
      oil_viscosity: '5W-40',
      oil_spec: 'VW 502.00',
      oil_capacity_quarts: 6.3,
      oil_change_interval_miles: 10000,
      spark_plug_gap_mm: 0.65,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: '2.5L TFSI 5-cylinder turbo - VW 502.00'
  },
  
  // ==========================================================================
  // PORSCHE ENGINES
  // ==========================================================================
  
  'porsche_flat6_turbo': {
    pattern: /porsche.*(turbo|gt2)|911\s*turbo|992\s*turbo|991\s*turbo|997\s*turbo/i,
    specs: {
      oil_viscosity: '0W-40',
      oil_spec: 'Porsche A40',
      oil_capacity_quarts: 9.0,
      oil_change_interval_miles: 10000,
      spark_plug_gap_mm: 0.70,
      fuel_octane_minimum: 93,
      fuel_octane_recommended: 93
    },
    notes: 'Porsche turbo flat-6'
  },
  
  'porsche_flat6_na': {
    pattern: /porsche.*(gt3|carrera|boxster|cayman)(?!.*turbo)|911\s*(gt3|carrera\s*s?)|718|981|987|997\s*carrera/i,
    specs: {
      oil_viscosity: '0W-40',
      oil_spec: 'Porsche A40',
      oil_capacity_quarts: 8.5,
      oil_change_interval_miles: 12000,
      spark_plug_gap_mm: 0.80,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'Porsche NA flat-6'
  },
  
  // ==========================================================================
  // MERCEDES-AMG ENGINES
  // ==========================================================================
  
  'm177_m178': {
    pattern: /m177|m178|4\.0l?\s*(tt|v8).*amg|amg\s*gt|c63|e63|s63.*w222/i,
    specs: {
      oil_viscosity: '0W-40',
      oil_spec: 'MB 229.5',
      oil_capacity_quarts: 9.5,
      oil_change_interval_miles: 10000,
      spark_plug_gap_mm: 0.70,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'AMG 4.0L twin-turbo V8'
  },
  
  // ==========================================================================
  // NISSAN ENGINES
  // ==========================================================================
  
  'vr38dett': {
    pattern: /vr38|3\.8l?\s*(tt|twin.?turbo)|gt-?r\s*(r35)?/i,
    specs: {
      oil_viscosity: '0W-40',
      oil_spec: 'Nissan Ester Engine Oil or Mobil 1 0W-40',
      oil_capacity_quarts: 5.5,
      oil_change_interval_miles: 6000,
      spark_plug_gap_mm: 0.70,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'GT-R twin-turbo - strict maintenance required'
  },
  
  'vr30ddtt': {
    pattern: /vr30|3\.0l?\s*(tt|twin.?turbo).*nissan|infiniti.*3\.0t|q50|q60|nissan\s*z\s*(2023|2024|rz34)/i,
    specs: {
      oil_viscosity: '0W-20',
      oil_spec: 'Nissan Genuine 0W-20 or equivalent API SN/SN+',
      oil_capacity_quarts: 6.5,
      oil_change_interval_miles: 5000,
      spark_plug_gap_mm: 0.70,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'VR30DDTT - 0W-20 is correct for this turbo engine'
  },
  
  // ==========================================================================
  // HONDA ENGINES (Note: Honda turbos are designed for 0W-20)
  // ==========================================================================
  
  'k20c1': {
    pattern: /k20c1|2\.0l?\s*turbo.*honda|civic\s*type\s*r|fk8|fl5/i,
    specs: {
      oil_viscosity: '0W-20',
      oil_spec: 'Honda Genuine 0W-20 Type 2.0',
      oil_capacity_quarts: 5.7,
      oil_change_interval_miles: 7500,
      spark_plug_gap_mm: 0.87, // Honda turbos can run larger gap
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'K20C1 - Honda designed for 0W-20'
  },
  
  // ==========================================================================
  // SUBARU ENGINES
  // ==========================================================================
  
  'ej257': {
    pattern: /ej257|2\.5l?\s*turbo.*subaru|wrx\s*sti|impreza\s*sti/i,
    specs: {
      oil_viscosity: '5W-30',
      oil_spec: 'Subaru Synthetic 5W-30',
      oil_capacity_quarts: 5.4,
      oil_change_interval_miles: 6000,
      spark_plug_gap_mm: 0.70,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'EJ257 turbo boxer - known for oil consumption'
  },
  
  'fa24': {
    pattern: /fa24|2\.4l?\s*(turbo)?.*subaru|wrx\s*(2022|2023|2024|2025)|brz.*2\.4/i,
    specs: {
      oil_viscosity: '0W-20',
      oil_spec: 'Subaru Synthetic 0W-20',
      oil_capacity_quarts: 5.0,
      oil_change_interval_miles: 6000,
      spark_plug_gap_mm: 0.80,
      fuel_octane_minimum: 91,
      fuel_octane_recommended: 93
    },
    notes: 'FA24 - newer generation boxer'
  },
  
  // ==========================================================================
  // EXOTIC / HIGH-PERFORMANCE ENGINES
  // ==========================================================================
  
  'ferrari_v8_turbo': {
    pattern: /ferrari.*(488|f8|296|sf90)|3\.9l?\s*tt.*ferrari/i,
    specs: {
      oil_viscosity: '5W-40',
      oil_spec: 'Shell Helix Ultra Racing 10W-60 or 5W-40',
      oil_capacity_quarts: 9.0,
      oil_change_interval_miles: 12500,
      spark_plug_gap_mm: 0.60,
      fuel_octane_minimum: 93,
      fuel_octane_recommended: 93
    },
    notes: 'Ferrari turbo V8 - requires premium oil'
  },
  
  'mclaren_m838t': {
    pattern: /mclaren|m838t|3\.8l?\s*tt.*mclaren|720s|650s|600lt/i,
    specs: {
      oil_viscosity: '5W-40',
      oil_spec: 'Mobil 1 ESP 5W-40',
      oil_capacity_quarts: 7.5,
      oil_change_interval_miles: 10000,
      spark_plug_gap_mm: 0.60,
      fuel_octane_minimum: 93,
      fuel_octane_recommended: 93
    },
    notes: 'McLaren twin-turbo V8'
  },
  
  'lamborghini_v10': {
    pattern: /lamborghini.*(huracan|gallardo)|5\.2l?\s*(v10|na).*lamborghini/i,
    specs: {
      oil_viscosity: '5W-40',
      oil_spec: 'Shell Helix Ultra 5W-40',
      oil_capacity_quarts: 12.0,
      oil_change_interval_miles: 9000,
      spark_plug_gap_mm: 0.75,
      fuel_octane_minimum: 93,
      fuel_octane_recommended: 93
    },
    notes: 'Lamborghini V10'
  },
  
  'aston_v12_tt': {
    pattern: /aston\s*martin.*(dbs|db11|vantage.*v12)|5\.2l?\s*tt.*aston/i,
    specs: {
      oil_viscosity: '5W-40',
      oil_spec: 'Castrol EDGE Professional 5W-40',
      oil_capacity_quarts: 10.5,
      oil_change_interval_miles: 10000,
      spark_plug_gap_mm: 0.65,
      fuel_octane_minimum: 93,
      fuel_octane_recommended: 93
    },
    notes: 'Aston Martin twin-turbo V12'
  }
};

/**
 * Match an engine description to a known engine family
 * Returns the specs override if found, or null
 */
export function matchEngineFamily(carName, engine) {
  const searchText = `${carName} ${engine}`.toLowerCase();
  
  for (const [familyName, family] of Object.entries(ENGINE_FAMILY_SPECS)) {
    if (family.pattern.test(searchText)) {
      return {
        family: familyName,
        specs: family.specs,
        notes: family.notes
      };
    }
  }
  
  return null;
}

/**
 * Apply engine family corrections to AI-generated maintenance data
 */
export function applyEngineFamilyCorrections(car, maintenanceData) {
  const match = matchEngineFamily(car.name, car.engine);
  
  if (!match) {
    return { data: maintenanceData, corrections: [] };
  }
  
  const corrections = [];
  const corrected = { ...maintenanceData };
  
  // Apply oil corrections
  if (match.specs.oil_viscosity && corrected.oil) {
    if (corrected.oil.oil_viscosity !== match.specs.oil_viscosity) {
      corrections.push({
        field: 'oil_viscosity',
        was: corrected.oil.oil_viscosity,
        now: match.specs.oil_viscosity,
        reason: `Engine family ${match.family}: ${match.notes}`
      });
      corrected.oil.oil_viscosity = match.specs.oil_viscosity;
    }
    
    if (match.specs.oil_spec) {
      corrected.oil.oil_spec = match.specs.oil_spec;
    }
    
    if (match.specs.oil_capacity_quarts) {
      corrected.oil.oil_capacity_quarts = match.specs.oil_capacity_quarts;
    }
    
    if (match.specs.oil_change_interval_miles && 
        corrected.oil.oil_change_interval_miles > match.specs.oil_change_interval_miles) {
      corrections.push({
        field: 'oil_change_interval_miles',
        was: corrected.oil.oil_change_interval_miles,
        now: match.specs.oil_change_interval_miles,
        reason: `Engine family ${match.family}: ${match.notes}`
      });
      corrected.oil.oil_change_interval_miles = match.specs.oil_change_interval_miles;
      corrected.oil.oil_change_interval_months = match.specs.oil_change_interval_months || 6;
    }
  }
  
  // Apply spark plug gap corrections
  if (match.specs.spark_plug_gap_mm && corrected.spark) {
    const currentGap = parseFloat(corrected.spark.spark_plug_gap_mm);
    if (currentGap && Math.abs(currentGap - match.specs.spark_plug_gap_mm) > 0.15) {
      corrections.push({
        field: 'spark_plug_gap_mm',
        was: currentGap,
        now: match.specs.spark_plug_gap_mm,
        reason: `Engine family ${match.family}: ${match.notes}`
      });
      corrected.spark.spark_plug_gap_mm = match.specs.spark_plug_gap_mm;
    }
  }
  
  // Apply fuel octane corrections
  if (match.specs.fuel_octane_minimum && corrected.fuel) {
    if (corrected.fuel.fuel_octane_minimum < match.specs.fuel_octane_minimum) {
      corrected.fuel.fuel_octane_minimum = match.specs.fuel_octane_minimum;
      corrected.fuel.fuel_octane_recommended = match.specs.fuel_octane_recommended;
    }
  }
  
  return {
    data: corrected,
    corrections,
    engineFamily: match.family,
    notes: match.notes
  };
}

// =============================================================================
// BRAND-WIDE SPECIFICATIONS
// =============================================================================
// These are specs that are consistent across ALL vehicles from a brand,
// regardless of engine. Examples: lug torque, bolt patterns (by platform)

export const BRAND_WIDE_SPECS = {
  'bmw': {
    wheel_lug_torque_ft_lbs: 103, // 140 Nm - universal for all BMW
    wheel_bolt_pattern: '5x120', // Most BMWs (some newer F/G series use 5x112)
    notes: 'BMW standard: 103 ft-lbs (140 Nm) lug torque'
  },
  'mercedes': {
    wheel_lug_torque_ft_lbs: 96, // 130 Nm
    wheel_bolt_pattern: '5x112',
    notes: 'Mercedes standard: 96 ft-lbs (130 Nm) lug torque'
  },
  'audi': {
    wheel_lug_torque_ft_lbs: 89, // 120 Nm (some models 96 ft-lbs)
    wheel_bolt_pattern: '5x112',
    notes: 'Audi standard: 89 ft-lbs (120 Nm) lug torque'
  },
  'volkswagen': {
    wheel_lug_torque_ft_lbs: 89, // 120 Nm
    wheel_bolt_pattern: '5x112',
    notes: 'VW standard: 89 ft-lbs (120 Nm) lug torque'
  },
  'porsche': {
    wheel_lug_torque_ft_lbs: 118, // 160 Nm
    notes: 'Porsche standard: 118 ft-lbs (160 Nm) lug torque'
  },
  'subaru': {
    wheel_lug_torque_ft_lbs: 89, // 120 Nm
    wheel_bolt_pattern: '5x114.3', // Most modern Subarus (BRZ is 5x100)
    notes: 'Subaru standard: 89 ft-lbs (120 Nm) lug torque'
  },
  'honda': {
    wheel_lug_torque_ft_lbs: 80, // 108 Nm
    wheel_bolt_pattern: '5x114.3',
    notes: 'Honda standard: 80 ft-lbs (108 Nm) lug torque'
  },
  'toyota': {
    wheel_lug_torque_ft_lbs: 76, // 103 Nm
    wheel_bolt_pattern: '5x114.3',
    notes: 'Toyota standard: 76 ft-lbs (103 Nm) lug torque'
  }
};

/**
 * Apply brand-wide specifications
 * @param {Object} car - Car object with brand field
 * @param {Object} data - Current maintenance data
 * @returns {Object} - { data, corrections }
 */
export function applyBrandWideSpecs(car, data) {
  const brand = (car.brand || '').toLowerCase();
  const brandSpec = BRAND_WIDE_SPECS[brand];
  
  if (!brandSpec) {
    return { data, corrections: [] };
  }
  
  const corrections = [];
  const corrected = JSON.parse(JSON.stringify(data));
  
  // Apply lug torque correction for BMW (most common issue)
  if (brand === 'bmw' && corrected.wheels) {
    const currentTorque = corrected.wheels.wheel_lug_torque_ft_lbs;
    if (currentTorque && currentTorque !== 103) {
      corrections.push({
        field: 'wheel_lug_torque_ft_lbs',
        was: currentTorque,
        now: 103,
        reason: brandSpec.notes
      });
      corrected.wheels.wheel_lug_torque_ft_lbs = 103;
    }
  }
  
  return { data: corrected, corrections };
}
