/**
 * Part Manufacturers Seed Data
 * 
 * Authoritative list of actual part manufacturers (not retailers).
 * Used for:
 * - Seeding the part_manufacturers table
 * - AI extraction validation (matching extracted names to known manufacturers)
 * - Brand lookup during parts research
 */

export const PART_MANUFACTURERS = [
  // =========== VAG Specialists (Audi/VW) ===========
  {
    name: 'APR',
    website: 'https://goapr.com',
    country: 'USA',
    sellsDirect: false,
    specialties: ['tune', 'exhaust', 'intake', 'turbo'],
    qualityTier: 'premium',
    aliases: ['APR Tuning', 'APR Performance'],
  },
  {
    name: 'Unitronic',
    website: 'https://getunitronic.com',
    country: 'Canada',
    sellsDirect: false,
    specialties: ['tune', 'intake', 'intercooler'],
    qualityTier: 'premium',
    aliases: ['Unitronic Performance'],
  },
  {
    name: '034 Motorsport',
    website: 'https://034motorsport.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['suspension', 'intake', 'drivetrain'],
    qualityTier: 'premium',
    aliases: ['034', '034Motorsport'],
  },
  {
    name: 'Integrated Engineering',
    website: 'https://performancebyie.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['intake', 'intercooler', 'turbo'],
    qualityTier: 'premium',
    aliases: ['IE', 'IE Performance'],
  },
  {
    name: 'EQT',
    website: 'https://eqtuning.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['tune', 'turbo', 'fuel'],
    qualityTier: 'premium',
    aliases: ['EQTuning', 'EQ Tuning'],
  },
  {
    name: 'CTS Turbo',
    website: 'https://ctsturbo.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['turbo', 'intake', 'intercooler'],
    qualityTier: 'mid',
    aliases: ['CTS'],
  },

  // =========== Exhaust Manufacturers ===========
  {
    name: 'Borla',
    website: 'https://borla.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['exhaust'],
    qualityTier: 'premium',
    aliases: ['Borla Exhaust', 'Borla Performance'],
  },
  {
    name: 'MagnaFlow',
    website: 'https://magnaflow.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['exhaust'],
    qualityTier: 'mid',
    aliases: ['Magna Flow'],
  },
  {
    name: 'Akrapovic',
    website: 'https://akrapovic.com',
    country: 'Slovenia',
    sellsDirect: false,
    specialties: ['exhaust'],
    qualityTier: 'ultra-premium',
    aliases: ['Akrapovič'],
  },
  {
    name: 'Milltek',
    website: 'https://millteksport.com',
    country: 'UK',
    sellsDirect: false,
    specialties: ['exhaust'],
    qualityTier: 'premium',
    aliases: ['Milltek Sport', 'Milltek Exhaust'],
  },
  {
    name: 'AWE Tuning',
    website: 'https://awe-tuning.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['exhaust', 'intake'],
    qualityTier: 'premium',
    aliases: ['AWE', 'AWE Performance'],
  },
  {
    name: 'Corsa',
    website: 'https://corsaperformance.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['exhaust'],
    qualityTier: 'premium',
    aliases: ['Corsa Performance', 'Corsa Exhaust'],
  },
  {
    name: 'Invidia',
    website: 'https://invidia-exhausts.com',
    country: 'Japan',
    sellsDirect: false,
    specialties: ['exhaust'],
    qualityTier: 'mid',
    aliases: ['Invidia Exhaust'],
  },
  {
    name: 'Tomei',
    website: 'https://tomeiusa.com',
    country: 'Japan',
    sellsDirect: false,
    specialties: ['exhaust', 'engine'],
    qualityTier: 'premium',
    aliases: ['Tomei Powered', 'Tomei USA'],
  },
  {
    name: 'HKS',
    website: 'https://hks-power.co.jp',
    country: 'Japan',
    sellsDirect: false,
    specialties: ['exhaust', 'turbo', 'tune'],
    qualityTier: 'premium',
    aliases: ['HKS Power'],
  },
  {
    name: 'GReddy',
    website: 'https://greddy.com',
    country: 'Japan',
    sellsDirect: false,
    specialties: ['exhaust', 'turbo', 'tune'],
    qualityTier: 'premium',
    aliases: ['Trust', 'Trust GReddy', 'Greddy'],
  },
  {
    name: 'Capristo',
    website: 'https://capristo.com',
    country: 'Germany',
    sellsDirect: false,
    specialties: ['exhaust'],
    qualityTier: 'ultra-premium',
    aliases: ['Capristo Exhaust'],
  },

  // =========== Intake Manufacturers ===========
  {
    name: 'K&N',
    website: 'https://knfilters.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['intake', 'filters'],
    qualityTier: 'mid',
    aliases: ['K&N Filters', 'KN', 'K and N'],
  },
  {
    name: 'aFe Power',
    website: 'https://afepower.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['intake', 'exhaust'],
    qualityTier: 'mid',
    aliases: ['aFe', 'AFE', 'AFE Power', 'Advanced Flow Engineering'],
  },
  {
    name: 'Injen',
    website: 'https://injen.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['intake'],
    qualityTier: 'mid',
    aliases: ['Injen Technology'],
  },

  // =========== Suspension Manufacturers ===========
  {
    name: 'KW',
    website: 'https://kwsuspensions.com',
    country: 'Germany',
    sellsDirect: false,
    specialties: ['suspension'],
    qualityTier: 'premium',
    aliases: ['KW Suspensions', 'KW Coilovers'],
  },
  {
    name: 'Bilstein',
    website: 'https://bilstein.com',
    country: 'Germany',
    sellsDirect: false,
    specialties: ['suspension'],
    qualityTier: 'premium',
    aliases: ['Bilstein Shocks'],
  },
  {
    name: 'Ohlins',
    website: 'https://ohlins.com',
    country: 'Sweden',
    sellsDirect: false,
    specialties: ['suspension'],
    qualityTier: 'ultra-premium',
    aliases: ['Öhlins'],
  },
  {
    name: 'BC Racing',
    website: 'https://bcracing.com',
    country: 'Taiwan',
    sellsDirect: true,
    specialties: ['suspension'],
    qualityTier: 'mid',
    aliases: ['BC', 'BC Coilovers'],
  },
  {
    name: 'Fortune Auto',
    website: 'https://fortune-auto.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['suspension'],
    qualityTier: 'premium',
    aliases: ['FA'],
  },
  {
    name: 'H&R',
    website: 'https://hrsprings.com',
    country: 'Germany',
    sellsDirect: false,
    specialties: ['suspension', 'wheels'],
    qualityTier: 'premium',
    aliases: ['H&R Springs', 'HR'],
  },
  {
    name: 'Eibach',
    website: 'https://eibach.com',
    country: 'Germany',
    sellsDirect: false,
    specialties: ['suspension'],
    qualityTier: 'premium',
    aliases: ['Eibach Springs'],
  },
  {
    name: 'Whiteline',
    website: 'https://whiteline.com.au',
    country: 'Australia',
    sellsDirect: false,
    specialties: ['suspension'],
    qualityTier: 'mid',
    aliases: ['Whiteline Suspension'],
  },

  // =========== Brake Manufacturers ===========
  {
    name: 'Brembo',
    website: 'https://brembo.com',
    country: 'Italy',
    sellsDirect: false,
    specialties: ['brakes'],
    qualityTier: 'ultra-premium',
    aliases: ['Brembo Brakes'],
  },
  {
    name: 'StopTech',
    website: 'https://stoptech.com',
    country: 'USA',
    sellsDirect: false,
    specialties: ['brakes'],
    qualityTier: 'premium',
    aliases: ['Stop Tech'],
  },
  {
    name: 'AP Racing',
    website: 'https://apracing.com',
    country: 'UK',
    sellsDirect: false,
    specialties: ['brakes'],
    qualityTier: 'ultra-premium',
    aliases: ['APR Brakes'], // Note: different from APR tuning
  },
  {
    name: 'Hawk',
    website: 'https://hawkperformance.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['brakes'],
    qualityTier: 'mid',
    aliases: ['Hawk Performance', 'Hawk Brakes'],
  },
  {
    name: 'EBC',
    website: 'https://ebcbrakes.com',
    country: 'UK',
    sellsDirect: true,
    specialties: ['brakes'],
    qualityTier: 'mid',
    aliases: ['EBC Brakes'],
  },
  {
    name: 'Wilwood',
    website: 'https://wilwood.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['brakes'],
    qualityTier: 'premium',
    aliases: ['Wilwood Brakes', 'Wilwood Engineering'],
  },

  // =========== Turbo/Supercharger ===========
  {
    name: 'Garrett',
    website: 'https://garrettmotion.com',
    country: 'USA',
    sellsDirect: false,
    specialties: ['turbo'],
    qualityTier: 'premium',
    aliases: ['Garrett Motion', 'Garrett Turbo'],
  },
  {
    name: 'BorgWarner',
    website: 'https://borgwarner.com',
    country: 'USA',
    sellsDirect: false,
    specialties: ['turbo'],
    qualityTier: 'premium',
    aliases: ['Borg Warner'],
  },
  {
    name: 'Precision Turbo',
    website: 'https://precisionturbo.net',
    country: 'USA',
    sellsDirect: true,
    specialties: ['turbo'],
    qualityTier: 'premium',
    aliases: ['PTE', 'Precision Turbo & Engine'],
  },
  {
    name: 'Vortech',
    website: 'https://vortech.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['supercharger'],
    qualityTier: 'premium',
    aliases: ['Vortech Superchargers'],
  },
  {
    name: 'Whipple',
    website: 'https://whipplesuperchargers.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['supercharger'],
    qualityTier: 'premium',
    aliases: ['Whipple Superchargers'],
  },
  {
    name: 'Roush',
    website: 'https://roushperformance.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['supercharger', 'exhaust'],
    qualityTier: 'premium',
    aliases: ['Roush Performance'],
  },

  // =========== ECU/Tuning ===========
  {
    name: 'Cobb Tuning',
    website: 'https://cobbtuning.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['tune', 'intake', 'exhaust'],
    qualityTier: 'premium',
    aliases: ['Cobb', 'COBB'],
  },
  {
    name: 'Hondata',
    website: 'https://hondata.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['tune'],
    qualityTier: 'premium',
    aliases: [],
  },
  {
    name: 'HP Tuners',
    website: 'https://hptuners.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['tune'],
    qualityTier: 'mid',
    aliases: ['HPT', 'HP Tuners'],
  },
  {
    name: 'DiabloSport',
    website: 'https://diablosport.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['tune'],
    qualityTier: 'mid',
    aliases: ['Diablo Sport', 'Diablo'],
  },
  {
    name: 'Dinan',
    website: 'https://dinan.com',
    country: 'USA',
    sellsDirect: false,
    specialties: ['tune', 'suspension', 'exhaust'],
    qualityTier: 'premium',
    aliases: ['Dinan Engineering'],
  },

  // =========== Wheels ===========
  {
    name: 'BBS',
    website: 'https://bbs.com',
    country: 'Germany',
    sellsDirect: false,
    specialties: ['wheels'],
    qualityTier: 'ultra-premium',
    aliases: ['BBS Wheels'],
  },
  {
    name: 'Enkei',
    website: 'https://enkei.com',
    country: 'Japan',
    sellsDirect: false,
    specialties: ['wheels'],
    qualityTier: 'mid',
    aliases: ['Enkei Wheels'],
  },
  {
    name: 'Rays',
    website: 'https://rayswheels.co.jp',
    country: 'Japan',
    sellsDirect: false,
    specialties: ['wheels'],
    qualityTier: 'premium',
    aliases: ['Rays Engineering', 'Volk Racing', 'RAYS'],
  },
  {
    name: 'Apex',
    website: 'https://apexraceparts.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['wheels'],
    qualityTier: 'premium',
    aliases: ['Apex Race Parts', 'Apex Wheels'],
  },
  {
    name: 'HRE',
    website: 'https://hrewheels.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['wheels'],
    qualityTier: 'ultra-premium',
    aliases: ['HRE Wheels', 'HRE Performance Wheels'],
  },

  // =========== Honda/Acura Specialists ===========
  {
    name: 'Skunk2',
    website: 'https://skunk2.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['intake', 'exhaust', 'suspension'],
    qualityTier: 'mid',
    aliases: ['Skunk2 Racing'],
  },
  {
    name: 'Spoon Sports',
    website: 'https://spoon.jp',
    country: 'Japan',
    sellsDirect: false,
    specialties: ['engine', 'brakes', 'suspension'],
    qualityTier: 'premium',
    aliases: ['Spoon', 'Spoon Sport'],
  },
  {
    name: 'Mugen',
    website: 'https://mugen-power.com',
    country: 'Japan',
    sellsDirect: false,
    specialties: ['exhaust', 'aero', 'engine'],
    qualityTier: 'premium',
    aliases: ['Mugen Power', 'M-TEC'],
  },
  {
    name: 'PRL Motorsports',
    website: 'https://prlmotorsports.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['intake', 'intercooler', 'exhaust'],
    qualityTier: 'premium',
    aliases: ['PRL'],
  },

  // =========== Subaru/Toyota Specialists ===========
  {
    name: 'Perrin',
    website: 'https://perrin.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['intake', 'exhaust', 'suspension'],
    qualityTier: 'mid',
    aliases: ['Perrin Performance', 'PERRIN'],
  },
  {
    name: 'GrimmSpeed',
    website: 'https://grimmspeed.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['intake', 'exhaust', 'boost'],
    qualityTier: 'mid',
    aliases: ['Grimm Speed'],
  },
  {
    name: 'IAG Performance',
    website: 'https://iagperformance.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['engine', 'fuel'],
    qualityTier: 'premium',
    aliases: ['IAG'],
  },
  {
    name: 'Crawford Performance',
    website: 'https://crawfordperformance.com',
    country: 'USA',
    sellsDirect: true,
    specialties: ['turbo', 'engine'],
    qualityTier: 'premium',
    aliases: ['Crawford'],
  },

  // =========== Domestic (Ford/GM/Mopar) ===========
  {
    name: 'Ford Performance',
    website: 'https://performanceparts.ford.com',
    country: 'USA',
    sellsDirect: false,
    specialties: ['engine', 'suspension', 'exhaust'],
    qualityTier: 'premium',
    aliases: ['Ford Racing'],
  },
  {
    name: 'Chevrolet Performance',
    website: 'https://chevrolet.com/performance',
    country: 'USA',
    sellsDirect: false,
    specialties: ['engine', 'suspension'],
    qualityTier: 'premium',
    aliases: ['Chevy Performance', 'GM Performance'],
  },
  {
    name: 'Mopar',
    website: 'https://mopar.com',
    country: 'USA',
    sellsDirect: false,
    specialties: ['engine', 'suspension'],
    qualityTier: 'premium',
    aliases: ['Mopar Performance'],
  },
];

/**
 * Known retailers (NOT manufacturers) - used to identify mis-attributed brand names
 */
export const KNOWN_RETAILERS = [
  'FT Speed',
  'JHP USA',
  'Subimods',
  'EQTuning', // Note: EQT makes tunes, EQTuning is the store
  'MAPerformance',
  'BMP Tuning',
  'Titan Motorsports',
  'AmericanMuscle',
  'ECS Tuning',
  'FCP Euro',
  'Turner Motorsport',
  'Pelican Parts',
  'RallySport Direct',
  'Summit Racing',
  'JEGS',
];

/**
 * Build a lookup map for fast manufacturer matching
 * Includes aliases for fuzzy matching
 */
export function buildManufacturerLookup() {
  const lookup = new Map();
  
  for (const mfg of PART_MANUFACTURERS) {
    // Add primary name (lowercase for matching)
    lookup.set(mfg.name.toLowerCase(), mfg);
    
    // Add all aliases
    for (const alias of mfg.aliases || []) {
      lookup.set(alias.toLowerCase(), mfg);
    }
  }
  
  return lookup;
}

/**
 * Try to extract manufacturer from product name
 * Returns manufacturer object if found, null otherwise
 * 
 * @param {string} productName - Full product name (e.g., "APR Tuning Catback Exhaust...")
 * @returns {object|null} Manufacturer object or null
 */
export function extractManufacturerFromName(productName) {
  const lookup = buildManufacturerLookup();
  const nameLower = productName.toLowerCase();
  
  // Try to match against known manufacturers
  // Start with longer names first (e.g., "034 Motorsport" before "034")
  const sortedKeys = [...lookup.keys()].sort((a, b) => b.length - a.length);
  
  for (const key of sortedKeys) {
    // Check if product name starts with manufacturer name
    if (nameLower.startsWith(key)) {
      return lookup.get(key);
    }
    
    // Check if manufacturer name appears at word boundary
    const regex = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(nameLower)) {
      return lookup.get(key);
    }
  }
  
  return null;
}

/**
 * Check if a brand name is actually a known retailer
 * 
 * @param {string} brandName - Brand name to check
 * @returns {boolean} True if this is a retailer, not a manufacturer
 */
export function isKnownRetailer(brandName) {
  return KNOWN_RETAILERS.some(
    retailer => retailer.toLowerCase() === brandName.toLowerCase()
  );
}

export default PART_MANUFACTURERS;
