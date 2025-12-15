/**
 * Complete Cars.com mappings for all 98 AutoRev vehicles
 * 
 * Format:
 * - make: Cars.com make slug (lowercase)
 * - model: Cars.com model slug (lowercase, underscores)
 * - searchTerms: Required terms in listing title
 * - excludeTerms: Terms that disqualify a listing
 */

export const CARS_COM_MAPPINGS = {
  // ============================================================================
  // ACURA
  // ============================================================================
  'Acura Integra Type R': {
    make: 'acura',
    model: 'integra',
    searchTerms: ['type r', 'type-r'],
    excludeTerms: [],
  },

  // ============================================================================
  // ALFA ROMEO
  // ============================================================================
  'Alfa Romeo 4C': {
    make: 'alfa-romeo',
    model: '4c',
    searchTerms: ['4c'],
    excludeTerms: [],
  },
  'Alfa Romeo Giulia Quadrifoglio': {
    make: 'alfa-romeo',
    model: 'giulia',
    searchTerms: ['quadrifoglio'],
    excludeTerms: [],
  },

  // ============================================================================
  // ASTON MARTIN
  // ============================================================================
  'Aston Martin V8 Vantage': {
    make: 'aston-martin',
    model: 'v8_vantage',
    searchTerms: ['vantage'],
    excludeTerms: ['v12'],
  },

  // ============================================================================
  // AUDI
  // ============================================================================
  'Audi R8 V10': {
    make: 'audi',
    model: 'r8',
    searchTerms: ['v10'],
    excludeTerms: ['v8'],
  },
  'Audi R8 V8': {
    make: 'audi',
    model: 'r8',
    searchTerms: ['r8'],
    excludeTerms: ['v10'],
  },
  'Audi RS3 8V': {
    make: 'audi',
    model: 'rs_3',
    searchTerms: ['rs3', 'rs 3'],
    excludeTerms: [],
  },
  'Audi RS3 8Y': {
    make: 'audi',
    model: 'rs_3',
    searchTerms: ['rs3', 'rs 3'],
    excludeTerms: [],
  },
  'Audi RS5 B8': {
    make: 'audi',
    model: 'rs_5',
    searchTerms: ['rs5', 'rs 5'],
    excludeTerms: [],
  },
  'Audi RS5 B9': {
    make: 'audi',
    model: 'rs_5',
    searchTerms: ['rs5', 'rs 5'],
    excludeTerms: [],
  },
  'Audi TT RS 8J': {
    make: 'audi',
    model: 'tt_rs',
    searchTerms: ['tt rs', 'ttrs'],
    excludeTerms: [],
  },
  'Audi TT RS 8S': {
    make: 'audi',
    model: 'tt_rs',
    searchTerms: ['tt rs', 'ttrs'],
    excludeTerms: [],
  },

  // ============================================================================
  // BMW
  // ============================================================================
  'BMW 1 Series M Coupe': {
    make: 'bmw',
    model: '1_series_m',
    searchTerms: ['1m', '1 series m'],
    excludeTerms: [],
  },
  'BMW M2 Competition': {
    make: 'bmw',
    model: 'm2',
    searchTerms: ['m2'],
    excludeTerms: ['m240', 'm235'],
  },
  'BMW M3 E46': {
    make: 'bmw',
    model: 'm3',
    searchTerms: ['m3'],
    excludeTerms: ['m340'],
  },
  'BMW M3 E92': {
    make: 'bmw',
    model: 'm3',
    searchTerms: ['m3'],
    excludeTerms: ['m340'],
  },
  'BMW M3 F80': {
    make: 'bmw',
    model: 'm3',
    searchTerms: ['m3'],
    excludeTerms: ['m340', 'cs'],
  },
  'BMW M4 F82': {
    make: 'bmw',
    model: 'm4',
    searchTerms: ['m4'],
    excludeTerms: ['m440', 'cs', 'gts'],
  },
  'BMW M5 E39': {
    make: 'bmw',
    model: 'm5',
    searchTerms: ['m5'],
    excludeTerms: ['m550'],
  },
  'BMW M5 E60': {
    make: 'bmw',
    model: 'm5',
    searchTerms: ['m5'],
    excludeTerms: ['m550'],
  },
  'BMW M5 F10 Competition': {
    make: 'bmw',
    model: 'm5',
    searchTerms: ['m5'],
    excludeTerms: ['m550'],
  },
  'BMW M5 F90 Competition': {
    make: 'bmw',
    model: 'm5',
    searchTerms: ['m5'],
    excludeTerms: ['m550'],
  },
  'BMW Z4 M Coupe/Roadster': {
    make: 'bmw',
    model: 'z4_m',
    searchTerms: ['z4 m', 'z4m'],
    excludeTerms: [],
  },

  // ============================================================================
  // CADILLAC
  // ============================================================================
  'Cadillac CTS-V Gen 2': {
    make: 'cadillac',
    model: 'cts-v',
    searchTerms: ['cts-v', 'ctsv'],
    excludeTerms: [],
  },
  'Cadillac CTS-V Gen 3': {
    make: 'cadillac',
    model: 'cts-v',
    searchTerms: ['cts-v', 'ctsv'],
    excludeTerms: [],
  },

  // ============================================================================
  // CHEVROLET
  // ============================================================================
  'C7 Corvette Grand Sport': {
    make: 'chevrolet',
    model: 'corvette',
    searchTerms: ['grand sport'],
    excludeTerms: ['z06', 'zr1'],
  },
  'C7 Corvette Z06': {
    make: 'chevrolet',
    model: 'corvette',
    searchTerms: ['z06'],
    excludeTerms: ['zr1', 'grand sport'],
  },
  'C8 Corvette Stingray': {
    make: 'chevrolet',
    model: 'corvette',
    searchTerms: ['stingray'],
    excludeTerms: ['z06', 'e-ray'],
  },
  'Camaro SS 1LE': {
    make: 'chevrolet',
    model: 'camaro',
    searchTerms: ['1le'],
    excludeTerms: ['zl1'],
  },
  'Camaro ZL1': {
    make: 'chevrolet',
    model: 'camaro',
    searchTerms: ['zl1'],
    excludeTerms: [],
  },
  'Chevrolet Corvette C5 Z06': {
    make: 'chevrolet',
    model: 'corvette',
    searchTerms: ['z06'],
    excludeTerms: [],
  },
  'Chevrolet Corvette C6 Grand Sport': {
    make: 'chevrolet',
    model: 'corvette',
    searchTerms: ['grand sport'],
    excludeTerms: ['z06', 'zr1'],
  },
  'Chevrolet Corvette C6 Z06': {
    make: 'chevrolet',
    model: 'corvette',
    searchTerms: ['z06'],
    excludeTerms: ['zr1', 'grand sport'],
  },

  // ============================================================================
  // DODGE
  // ============================================================================
  'Dodge Challenger Hellcat': {
    make: 'dodge',
    model: 'challenger',
    searchTerms: ['hellcat'],
    excludeTerms: ['demon', 'redeye', 'jailbreak'],
  },
  'Dodge Challenger SRT 392': {
    make: 'dodge',
    model: 'challenger',
    searchTerms: ['392', 'srt'],
    excludeTerms: ['hellcat', 'demon'],
  },
  'Dodge Charger Hellcat': {
    make: 'dodge',
    model: 'charger',
    searchTerms: ['hellcat'],
    excludeTerms: ['redeye', 'jailbreak'],
  },
  'Dodge Charger SRT 392': {
    make: 'dodge',
    model: 'charger',
    searchTerms: ['392', 'srt'],
    excludeTerms: ['hellcat'],
  },
  'Dodge Viper': {
    make: 'dodge',
    model: 'viper',
    searchTerms: ['viper'],
    excludeTerms: [],
  },

  // ============================================================================
  // FORD
  // ============================================================================
  'Ford Focus RS': {
    make: 'ford',
    model: 'focus_rs',
    searchTerms: ['rs'],
    excludeTerms: ['st'],
  },
  'Ford Mustang Boss 302': {
    make: 'ford',
    model: 'mustang',
    searchTerms: ['boss 302', 'boss302'],
    excludeTerms: [],
  },
  'Mustang GT PP2': {
    make: 'ford',
    model: 'mustang',
    searchTerms: ['gt'],
    excludeTerms: ['gt350', 'gt500', 'mach'],
  },
  'Shelby GT350': {
    make: 'ford',
    model: 'mustang',
    searchTerms: ['gt350'],
    excludeTerms: ['gt500'],
  },
  'Shelby GT500': {
    make: 'ford',
    model: 'mustang',
    searchTerms: ['gt500'],
    excludeTerms: ['gt350'],
  },

  // ============================================================================
  // HONDA
  // ============================================================================
  'Honda Civic Type R FK8': {
    make: 'honda',
    model: 'civic_type_r',
    searchTerms: ['type r'],
    excludeTerms: [],
  },
  'Honda Civic Type R FL5': {
    make: 'honda',
    model: 'civic_type_r',
    searchTerms: ['type r'],
    excludeTerms: [],
  },
  'Honda S2000': {
    make: 'honda',
    model: 's2000',
    searchTerms: ['s2000'],
    excludeTerms: [],
  },

  // ============================================================================
  // JAGUAR
  // ============================================================================
  'Jaguar F-Type R': {
    make: 'jaguar',
    model: 'f-type',
    searchTerms: ['f-type r', 'r-dynamic'],
    excludeTerms: [],
  },
  'Jaguar F-Type V6 S': {
    make: 'jaguar',
    model: 'f-type',
    searchTerms: ['f-type'],
    excludeTerms: ['r', 'svr'],
  },

  // ============================================================================
  // LAMBORGHINI
  // ============================================================================
  'Lamborghini Gallardo': {
    make: 'lamborghini',
    model: 'gallardo',
    searchTerms: ['gallardo'],
    excludeTerms: [],
  },

  // ============================================================================
  // LEXUS
  // ============================================================================
  'Lexus LC 500': {
    make: 'lexus',
    model: 'lc',
    searchTerms: ['lc 500', 'lc500'],
    excludeTerms: ['hybrid'],
  },
  'Lexus RC F': {
    make: 'lexus',
    model: 'rc_f',
    searchTerms: ['rc f', 'rcf'],
    excludeTerms: [],
  },

  // ============================================================================
  // LOTUS
  // ============================================================================
  'Lotus Elise S2': {
    make: 'lotus',
    model: 'elise',
    searchTerms: ['elise'],
    excludeTerms: [],
  },
  'Lotus Emira': {
    make: 'lotus',
    model: 'emira',
    searchTerms: ['emira'],
    excludeTerms: [],
  },
  'Lotus Evora GT': {
    make: 'lotus',
    model: 'evora_gt',
    searchTerms: ['evora gt'],
    excludeTerms: [],
  },
  'Lotus Evora S': {
    make: 'lotus',
    model: 'evora',
    searchTerms: ['evora'],
    excludeTerms: ['gt'],
  },
  'Lotus Exige S': {
    make: 'lotus',
    model: 'exige',
    searchTerms: ['exige'],
    excludeTerms: [],
  },

  // ============================================================================
  // MASERATI
  // ============================================================================
  'Maserati GranTurismo': {
    make: 'maserati',
    model: 'granturismo',
    searchTerms: ['granturismo'],
    excludeTerms: [],
  },

  // ============================================================================
  // MAZDA
  // ============================================================================
  'Mazda MX-5 Miata NA': {
    make: 'mazda',
    model: 'mx-5_miata',
    searchTerms: ['miata', 'mx-5'],
    excludeTerms: [],
  },
  'Mazda MX-5 Miata NB': {
    make: 'mazda',
    model: 'mx-5_miata',
    searchTerms: ['miata', 'mx-5'],
    excludeTerms: [],
  },
  'Mazda MX-5 Miata NC': {
    make: 'mazda',
    model: 'mx-5_miata',
    searchTerms: ['miata', 'mx-5'],
    excludeTerms: [],
  },
  'Mazda MX-5 Miata ND': {
    make: 'mazda',
    model: 'mx-5_miata',
    searchTerms: ['miata', 'mx-5'],
    excludeTerms: [],
  },
  'Mazda RX-7 FD3S': {
    make: 'mazda',
    model: 'rx-7',
    searchTerms: ['rx-7', 'rx7'],
    excludeTerms: [],
  },

  // ============================================================================
  // MERCEDES-AMG
  // ============================================================================
  'Mercedes C63 AMG W204': {
    make: 'mercedes-benz',
    model: 'c-class',
    searchTerms: ['c63', 'amg'],
    excludeTerms: [],
  },
  'Mercedes-AMG C63 W205': {
    make: 'mercedes-benz',
    model: 'c-class',
    searchTerms: ['c63', 'amg'],
    excludeTerms: [],
  },
  'Mercedes-AMG E63 S W213': {
    make: 'mercedes-benz',
    model: 'e-class',
    searchTerms: ['e63', 'amg'],
    excludeTerms: [],
  },
  'Mercedes-AMG E63 W212': {
    make: 'mercedes-benz',
    model: 'e-class',
    searchTerms: ['e63', 'amg'],
    excludeTerms: [],
  },
  'Mercedes-AMG GT': {
    make: 'mercedes-benz',
    model: 'amg_gt',
    searchTerms: ['amg gt'],
    excludeTerms: [],
  },

  // ============================================================================
  // MITSUBISHI
  // ============================================================================
  'Mitsubishi Lancer Evolution VIII/IX': {
    make: 'mitsubishi',
    model: 'lancer_evolution',
    searchTerms: ['evolution', 'evo'],
    excludeTerms: [],
  },
  'Mitsubishi Lancer Evolution X': {
    make: 'mitsubishi',
    model: 'lancer_evolution',
    searchTerms: ['evolution', 'evo'],
    excludeTerms: [],
  },

  // ============================================================================
  // NISSAN
  // ============================================================================
  'Nissan 300ZX Twin Turbo Z32': {
    make: 'nissan',
    model: '300zx',
    searchTerms: ['300zx'],
    excludeTerms: [],
  },
  'Nissan 350Z': {
    make: 'nissan',
    model: '350z',
    searchTerms: ['350z'],
    excludeTerms: [],
  },
  'Nissan 370Z NISMO': {
    make: 'nissan',
    model: '370z',
    searchTerms: ['370z', 'nismo'],
    excludeTerms: [],
  },
  'Nissan GT-R': {
    make: 'nissan',
    model: 'gt-r',
    searchTerms: ['gt-r', 'gtr'],
    excludeTerms: ['nismo'],
  },
  'Nissan Z': {
    make: 'nissan',
    model: 'z',
    searchTerms: ['nissan z'],
    excludeTerms: [],
  },

  // ============================================================================
  // PORSCHE
  // ============================================================================
  '718 Cayman GT4': {
    make: 'porsche',
    model: '718_cayman',
    searchTerms: ['gt4'],
    excludeTerms: ['gts'],
  },
  '718 Cayman GTS 4.0': {
    make: 'porsche',
    model: '718_cayman',
    searchTerms: ['gts'],
    excludeTerms: ['gt4'],
  },
  '981 Cayman GTS': {
    make: 'porsche',
    model: 'cayman',
    searchTerms: ['gts'],
    excludeTerms: ['gt4'],
  },
  '981 Cayman S': {
    make: 'porsche',
    model: 'cayman',
    searchTerms: ['cayman s'],
    excludeTerms: ['gts', 'gt4'],
  },
  '987.2 Cayman S': {
    make: 'porsche',
    model: 'cayman',
    searchTerms: ['cayman s'],
    excludeTerms: ['gts', 'gt4'],
  },
  '991.1 Carrera S': {
    make: 'porsche',
    model: '911',
    searchTerms: ['carrera s'],
    excludeTerms: ['gts', 'gt3', 'turbo'],
  },
  '997.2 Carrera S': {
    make: 'porsche',
    model: '911',
    searchTerms: ['carrera s'],
    excludeTerms: ['gts', 'gt3', 'turbo'],
  },
  'Porsche 911 GT3 996': {
    make: 'porsche',
    model: '911',
    searchTerms: ['gt3'],
    excludeTerms: ['rs', 'touring'],
  },
  'Porsche 911 GT3 997': {
    make: 'porsche',
    model: '911',
    searchTerms: ['gt3'],
    excludeTerms: ['rs', 'touring'],
  },
  'Porsche 911 Turbo 997.1': {
    make: 'porsche',
    model: '911',
    searchTerms: ['turbo'],
    excludeTerms: ['gt3', 'carrera'],
  },
  'Porsche 911 Turbo 997.2': {
    make: 'porsche',
    model: '911',
    searchTerms: ['turbo'],
    excludeTerms: ['gt3', 'carrera'],
  },

  // ============================================================================
  // SUBARU
  // ============================================================================
  'Subaru BRZ': {
    make: 'subaru',
    model: 'brz',
    searchTerms: ['brz'],
    excludeTerms: [],
  },
  'Subaru BRZ (2nd Gen)': {
    make: 'subaru',
    model: 'brz',
    searchTerms: ['brz'],
    excludeTerms: [],
  },
  'Subaru Impreza WRX STI GD': {
    make: 'subaru',
    model: 'impreza_wrx_sti',
    searchTerms: ['sti'],
    excludeTerms: [],
  },
  'Subaru WRX STI GR/GV': {
    make: 'subaru',
    model: 'wrx_sti',
    searchTerms: ['sti'],
    excludeTerms: [],
  },
  'Subaru WRX STI VA': {
    make: 'subaru',
    model: 'wrx_sti',
    searchTerms: ['sti'],
    excludeTerms: [],
  },

  // ============================================================================
  // TESLA
  // ============================================================================
  'Tesla Model 3 Performance': {
    make: 'tesla',
    model: 'model_3',
    searchTerms: ['performance'],
    excludeTerms: ['long range', 'standard'],
  },

  // ============================================================================
  // TOYOTA
  // ============================================================================
  'Toyota 86 / Scion FR-S': {
    make: 'toyota',
    model: '86',
    searchTerms: ['86', 'fr-s'],
    excludeTerms: [],
  },
  'Toyota GR Supra': {
    make: 'toyota',
    model: 'gr_supra',
    searchTerms: ['supra'],
    excludeTerms: [],
  },
  'Toyota GR86': {
    make: 'toyota',
    model: 'gr86',
    searchTerms: ['gr86', 'gr 86'],
    excludeTerms: [],
  },
  'Toyota Supra Mk4 A80 Turbo': {
    make: 'toyota',
    model: 'supra',
    searchTerms: ['supra'],
    excludeTerms: [],
  },

  // ============================================================================
  // VOLKSWAGEN
  // ============================================================================
  'Volkswagen Golf R Mk7': {
    make: 'volkswagen',
    model: 'golf_r',
    searchTerms: ['golf r'],
    excludeTerms: ['gti'],
  },
  'Volkswagen Golf R Mk8': {
    make: 'volkswagen',
    model: 'golf_r',
    searchTerms: ['golf r'],
    excludeTerms: ['gti'],
  },
  'Volkswagen GTI Mk7': {
    make: 'volkswagen',
    model: 'golf_gti',
    searchTerms: ['gti'],
    excludeTerms: ['golf r'],
  },
};

/**
 * Get mapping by car name
 */
export function getMapping(carName) {
  return CARS_COM_MAPPINGS[carName] || null;
}

/**
 * Get all car names that have mappings
 */
export function getMappedCarNames() {
  return Object.keys(CARS_COM_MAPPINGS);
}

/**
 * Check coverage - returns unmapped car names
 */
export function getUnmappedCars(carNames) {
  return carNames.filter(name => !CARS_COM_MAPPINGS[name]);
}

