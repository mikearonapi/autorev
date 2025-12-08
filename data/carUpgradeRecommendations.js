/**
 * SuperNatural Motorsports - Car-Specific Upgrade Recommendations
 * 
 * This file maps each car to its recommended upgrade packages, must-have modules,
 * nice-to-have modules, and platform-specific notes for each tier.
 * 
 * Structure per car:
 * - defaultTier: Which package tier to show by default
 * - streetSport: Upgrades for enhanced street performance
 * - trackPack: Upgrades for serious track use
 * - timeAttack: Maximum performance upgrades
 * - ultimatePower: Forced induction / max power builds
 * - platformNotes: Car-specific considerations and known issues
 */

/**
 * @typedef {Object} TierRecommendation
 * @property {string[]} mustHave - Essential upgrades for this tier
 * @property {string[]} recommended - Strongly recommended upgrades
 * @property {string[]} niceToHave - Optional enhancements
 * @property {string} narrative - Why these upgrades are recommended
 */

/**
 * @typedef {Object} CarRecommendation
 * @property {string} defaultTier - Suggested starting tier
 * @property {Object} tiers - Recommendations by tier
 * @property {string[]} platformNotes - Car-specific considerations
 * @property {string[]} knownIssues - Known reliability concerns
 */

export const carUpgradeRecommendations = {
  // ============================================================================
  // PORSCHE
  // ============================================================================
  '718-cayman-gt4': {
    defaultTier: 'trackPack',
    tiers: {
      streetSport: {
        mustHave: ['high-flow-air-filter', 'brake-pads-performance', 'performance-alignment'],
        recommended: ['cat-back-exhaust', 'coilovers'],
        niceToHave: ['short-shifter', 'lightweight-battery'],
        narrative: 'The GT4 is already track-focused from the factory. Street Sport upgrades enhance the already excellent chassis without compromising daily usability.',
      },
      trackPack: {
        mustHave: ['coilovers', 'brake-pads-track', 'high-temp-brake-fluid', 'oil-cooler'],
        recommended: ['big-brake-kit', 'performance-tires', 'sway-bars'],
        niceToHave: ['lightweight-wheels', 'braided-brake-lines', 'helmet'],
        narrative: 'The 4.0L flat-6 is incredible NA, so focus on chassis and brakes. The GT4 runs hot during sustained track use - oil cooler is essential.',
      },
      timeAttack: {
        mustHave: ['coilovers', 'big-brake-kit', 'competition-tires', 'oil-cooler', 'racing-seat'],
        recommended: ['front-splitter', 'rear-wing', 'racing-harness', 'roll-bar'],
        niceToHave: ['lightweight-wheels', 'carbon-fiber-hood', 'interior-delete'],
        narrative: 'Max NA performance. The flat-6 has limited tuning potential but the chassis is superb. Focus on aero, weight reduction, and tires.',
      },
    },
    platformNotes: [
      'The 4.0L flat-6 is essentially the GT3 engine - reliable and rewarding',
      'Factory exhaust is already excellent - aftermarket mainly adds volume',
      'PDK vs manual: PDK is faster, manual is more engaging',
      'IMS bearing is not a concern on this generation',
    ],
    knownIssues: [
      'Oil consumption normal up to 1qt/1000mi during break-in',
      'Rear wing adds drag but significant downforce - track setup dependent',
    ],
  },

  '718-cayman-gts-40': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['high-flow-air-filter', 'performance-alignment'],
        recommended: ['cat-back-exhaust', 'lowering-springs'],
        niceToHave: ['short-shifter', 'brake-pads-performance'],
        narrative: 'The GTS 4.0 is the sweet spot between GT4 and base Cayman. Subtle upgrades enhance without compromising GT credentials.',
      },
      trackPack: {
        mustHave: ['coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['oil-cooler', 'performance-tires', 'sway-bars'],
        niceToHave: ['big-brake-kit', 'lightweight-wheels'],
        narrative: 'With 394hp and excellent balance, the GTS 4.0 is a fantastic track platform. Cooling and brakes are the priorities.',
      },
    },
    platformNotes: [
      'Shares the GT4 4.0L engine but slightly detuned',
      'Sport Chrono package adds launch control and better throttle maps',
      'PASM suspension is very capable - coilovers are optional for track use',
    ],
    knownIssues: [
      'Same oil consumption notes as GT4',
    ],
  },

  '981-cayman-gts': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'performance-alignment'],
        recommended: ['cat-back-exhaust', 'lowering-springs', 'ecu-tune'],
        niceToHave: ['short-shifter', 'brake-pads-performance'],
        narrative: 'The 3.4L flat-6 responds well to intake and exhaust. Mild tune adds 15-20hp. Focus on enhancing the naturally excellent chassis.',
      },
      trackPack: {
        mustHave: ['coilovers', 'brake-pads-track', 'high-temp-brake-fluid', 'oil-cooler'],
        recommended: ['big-brake-kit', 'performance-tires', 'sway-bars'],
        niceToHave: ['lightweight-wheels', 'braided-brake-lines'],
        narrative: 'The 981 chassis is exceptional. Cooling is important for sustained track use. Big brake kit improves fade resistance significantly.',
      },
    },
    platformNotes: [
      'Last of the naturally aspirated flat-6 Caymans',
      'IMS bearing concerns mostly resolved by this generation',
      '3.4L responds well to tuning - ~330hp achievable with full bolt-ons',
    ],
    knownIssues: [
      'Coolant pipes can leak on higher mileage examples',
      'AOS (Air Oil Separator) issues possible',
    ],
  },

  '981-cayman-s': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'performance-alignment'],
        recommended: ['cat-back-exhaust', 'ecu-tune'],
        niceToHave: ['lowering-springs', 'brake-pads-performance'],
        narrative: 'The 325hp flat-6 is a gem. Basic bolt-ons wake it up nicely while maintaining the refined Porsche character.',
      },
      trackPack: {
        mustHave: ['coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['oil-cooler', 'performance-tires', 'sway-bars'],
        niceToHave: ['big-brake-kit', 'lightweight-wheels'],
        narrative: 'Solid track platform. Prioritize cooling and brakes for sustained lapping. The chassis is incredibly capable.',
      },
    },
    platformNotes: [
      'Same 3.4L as GTS but ~15hp less',
      'Sport Chrono recommended for track use',
    ],
    knownIssues: [
      'Same as 981 GTS - coolant pipes and AOS',
    ],
  },

  '987-2-cayman-s': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'performance-alignment'],
        recommended: ['cat-back-exhaust', 'headers', 'ecu-tune'],
        niceToHave: ['lowering-springs', 'short-shifter'],
        narrative: 'The 987.2 is the last of the simpler, more analog Caymans. Headers and tune make a noticeable difference.',
      },
      trackPack: {
        mustHave: ['coilovers', 'brake-pads-track', 'oil-cooler'],
        recommended: ['big-brake-kit', 'performance-tires'],
        niceToHave: ['sway-bars', 'lightweight-wheels'],
        narrative: 'Great value track platform. More affordable than newer Caymans but just as capable. Cooling is key.',
      },
    },
    platformNotes: [
      'IMS bearing is NOT an issue on 987.2 (redesigned)',
      'Direct injection engine runs hotter - oil cooler important',
      'Headers provide significant NA power gains',
    ],
    knownIssues: [
      'Bore scoring possible on high-mileage engines',
    ],
  },

  '991-1-carrera-s': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'performance-alignment'],
        recommended: ['cat-back-exhaust', 'ecu-tune', 'lowering-springs'],
        niceToHave: ['brake-pads-performance', 'short-shifter'],
        narrative: 'The 400hp 3.8L flat-6 is beautifully responsive. Subtle upgrades enhance without overwhelming the balanced package.',
      },
      trackPack: {
        mustHave: ['coilovers', 'brake-pads-track', 'high-temp-brake-fluid', 'oil-cooler'],
        recommended: ['big-brake-kit', 'performance-tires', 'sway-bars'],
        niceToHave: ['lightweight-wheels', 'front-splitter'],
        narrative: 'The 991.1 is an excellent track car. PASM works well, but coilovers offer more adjustability. Cooling is important.',
      },
    },
    platformNotes: [
      'Last of the naturally aspirated 911 Carreras',
      '7-speed manual is excellent',
      'PDK is incredibly fast',
    ],
    knownIssues: [
      'Some reports of bore scoring on high-mileage engines',
      'Sports exhaust is a must-have option',
    ],
  },

  '997-2-carrera-s': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'performance-alignment'],
        recommended: ['cat-back-exhaust', 'headers', 'ecu-tune'],
        niceToHave: ['lowering-springs', 'short-shifter'],
        narrative: 'The 997.2 is peak analog 911. Headers and full exhaust transform the sound. Tune adds noticeable power.',
      },
      trackPack: {
        mustHave: ['coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['oil-cooler', 'big-brake-kit', 'performance-tires'],
        niceToHave: ['sway-bars', 'lightweight-wheels'],
        narrative: 'Many consider this the best modern 911 for driving feel. Exceptional track platform with modest cooling upgrades.',
      },
    },
    platformNotes: [
      'Mezger-adjacent engine - very reliable',
      'No IMS bearing concerns',
      'Manual gearbox is sublime',
    ],
    knownIssues: [
      'Rear main seal can leak on older examples',
    ],
  },

  // ============================================================================
  // CORVETTE
  // ============================================================================
  'c8-corvette-stingray': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['ecu-tune', 'lowering-springs'],
        niceToHave: ['brake-pads-performance', 'performance-alignment'],
        narrative: 'The C8 is incredibly capable stock. A tune unlocks the DCT\'s potential and the exhaust awakens the LT2.',
      },
      trackPack: {
        mustHave: ['coilovers', 'brake-pads-track', 'high-temp-brake-fluid', 'trans-cooler'],
        recommended: ['big-brake-kit', 'performance-tires', 'oil-cooler'],
        niceToHave: ['front-splitter', 'lightweight-wheels'],
        narrative: 'The DCT needs cooling upgrades for sustained track use. The LT2 is robust but trans temps climb quickly on track.',
      },
      ultimatePower: {
        mustHave: ['supercharger-centrifugal', 'clutch-upgrade', 'hpfp-upgrade'],
        recommended: ['oil-cooler', 'heat-exchanger-sc', 'headers'],
        niceToHave: ['forged-internals', 'driveshaft-upgrade'],
        narrative: 'ProCharger or Whipple kits push the C8 to 700+ hp. DCT can handle ~750hp stock but clutch upgrades are wise.',
      },
    },
    platformNotes: [
      'Mid-engine layout = different cooling challenges than front-engine Corvettes',
      'DCT software updates have improved shift quality significantly',
      'Z51 package adds bigger brakes, better cooling, and aero',
      'Front trunk limits intake options',
    ],
    knownIssues: [
      'DCT overheating during sustained track use',
      'Early engine tick from AFM - disable with tune',
      'Frunk can rub on lowered cars',
    ],
  },

  'c7-corvette-grand-sport': {
    defaultTier: 'trackPack',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['ecu-tune', 'headers'],
        niceToHave: ['brake-pads-performance', 'short-shifter'],
        narrative: 'The Grand Sport is the Z06 chassis with the LT1. Exhaust and headers transform the sound and add power.',
      },
      trackPack: {
        mustHave: ['headers', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['big-brake-kit', 'performance-tires', 'oil-cooler'],
        niceToHave: ['sway-bars', 'lightweight-wheels'],
        narrative: 'Already has Z06 brakes and aero. The LT1 runs cooler than the LT4, so cooling upgrades are less critical.',
      },
      ultimatePower: {
        mustHave: ['supercharger-centrifugal', 'fuel-system-upgrade', 'clutch-upgrade'],
        recommended: ['oil-cooler', 'headers', 'ecu-tune'],
        niceToHave: ['forged-internals', 'driveshaft-upgrade'],
        narrative: 'The LT1 handles boost excellently. A supercharger transforms the already-excellent chassis into a monster.',
      },
    },
    platformNotes: [
      'Z06 wide-body and brakes but NA engine = best of both worlds',
      'Manual trans is TR6060 - handles up to ~700hp',
      'Already has dry sump from Z06',
    ],
    knownIssues: [
      'Z07 package carbon ceramic brakes expensive to replace',
    ],
  },

  'c7-corvette-z06': {
    defaultTier: 'trackPack',
    tiers: {
      streetSport: {
        mustHave: ['high-flow-air-filter', 'brake-pads-performance'],
        recommended: ['cat-back-exhaust', 'pulley-tune-sc'],
        niceToHave: ['short-shifter', 'lowering-springs'],
        narrative: 'At 650hp stock, the Z06 doesn\'t need much. A smaller pulley and tune adds 70-100hp easily.',
      },
      trackPack: {
        mustHave: ['heat-exchanger-sc', 'oil-cooler', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['coilovers', 'trans-cooler', 'diff-cooler'],
        niceToHave: ['big-brake-kit', 'performance-tires'],
        narrative: 'COOLING. COOLING. COOLING. The LT4 is heat-limited on track. Upgrade everything that transfers heat.',
      },
      ultimatePower: {
        mustHave: ['pulley-tune-sc', 'heat-exchanger-sc', 'hpfp-upgrade', 'clutch-upgrade'],
        recommended: ['headers', 'fuel-system-upgrade', 'oil-cooler'],
        niceToHave: ['forged-internals', 'axles-halfshafts'],
        narrative: '800-900+ hp is achievable with pulley, tune, and supporting mods. The LT4 bottom end is strong.',
      },
    },
    platformNotes: [
      'LT4 supercharged V8 is extremely powerful stock',
      'Heat management is the Z06\'s Achilles heel',
      'Z07 package adds significant downforce but carbon brakes',
      'Magnetic ride is excellent for dual-purpose use',
    ],
    knownIssues: [
      'Overheating is a documented problem on track',
      'Supercharger intercooler brick can be overwhelmed',
      'Rear diff cooler is undersized from factory',
    ],
  },

  // ============================================================================
  // FORD MUSTANG
  // ============================================================================
  'shelby-gt500': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['high-flow-air-filter', 'brake-pads-performance'],
        recommended: ['cat-back-exhaust', 'pulley-tune-sc'],
        niceToHave: ['lowering-springs', 'sway-bars'],
        narrative: 'At 760hp, the GT500 is already a monster. Small pulley + tune pushes past 800hp with ease.',
      },
      trackPack: {
        mustHave: ['heat-exchanger-sc', 'brake-pads-track', 'high-temp-brake-fluid', 'oil-cooler'],
        recommended: ['coilovers', 'big-brake-kit', 'trans-cooler'],
        niceToHave: ['performance-tires', 'diff-cooler'],
        narrative: 'The GT500 generates massive heat. Cooling upgrades are critical for track use. DCT is robust but runs hot.',
      },
      ultimatePower: {
        mustHave: ['pulley-tune-sc', 'heat-exchanger-sc', 'hpfp-upgrade', 'driveshaft-upgrade'],
        recommended: ['headers', 'fuel-system-upgrade', 'axles-halfshafts'],
        niceToHave: ['forged-internals'],
        narrative: '900-1000hp is achievable with pulley mods and supporting fueling. The 5.2L Predator is strong.',
      },
    },
    platformNotes: [
      'DCT is well-suited to drag racing',
      'No manual option - DCT only',
      'Carbon fiber track pack is expensive but effective',
      'Heat exchanger upgrade is almost mandatory for track use',
    ],
    knownIssues: [
      'Heat soak affects power significantly',
      'DCT can be harsh in city driving',
    ],
  },

  'shelby-gt350': {
    defaultTier: 'trackPack',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['headers', 'ecu-tune', 'brake-pads-performance'],
        niceToHave: ['short-shifter', 'lowering-springs'],
        narrative: 'The Voodoo flat-plane V8 screams with full exhaust. Headers are essential to unlock the top-end power.',
      },
      trackPack: {
        mustHave: ['headers', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid', 'oil-cooler'],
        recommended: ['big-brake-kit', 'performance-tires', 'trans-cooler'],
        niceToHave: ['lightweight-wheels', 'sway-bars'],
        narrative: 'The GT350 is a track weapon. Headers and exhaust unlock 525+ hp. Cooling is important for the Voodoo.',
      },
      ultimatePower: {
        mustHave: ['supercharger-centrifugal', 'headers', 'fuel-system-upgrade', 'clutch-upgrade'],
        recommended: ['oil-cooler', 'heat-exchanger-sc', 'forged-internals'],
        niceToHave: ['driveshaft-upgrade', 'axles-halfshafts'],
        narrative: 'Supercharging the Voodoo is incredible - 700-800hp with the right setup. The flat-plane crank sounds amazing with boost.',
      },
    },
    platformNotes: [
      'The Voodoo 5.2L flat-plane V8 is special - rev limit of 8,250 RPM',
      'MagneRide suspension is excellent',
      'GT350R adds carbon wheels and more aggressive aero',
      'Tremec TR-3160 manual is robust',
    ],
    knownIssues: [
      'Early Voodoo engines had oil consumption issues (mostly resolved)',
      'Engine can burn oil if consistently revved to 8k+ without oil change',
    ],
  },

  'mustang-gt-pp2': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust', 'ecu-tune'],
        recommended: ['headers', 'brake-pads-performance'],
        niceToHave: ['short-shifter', 'throttle-body'],
        narrative: 'The Coyote 5.0 loves bolt-ons. Intake, exhaust, headers, and tune can add 50-70hp.',
      },
      trackPack: {
        mustHave: ['headers', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['big-brake-kit', 'performance-tires', 'oil-cooler'],
        niceToHave: ['sway-bars', 'limited-slip-diff'],
        narrative: 'PP2 already has excellent chassis components. Headers and exhaust are the main power adds.',
      },
      ultimatePower: {
        mustHave: ['supercharger-roots', 'fuel-system-upgrade', 'clutch-upgrade'],
        recommended: ['oil-cooler', 'headers', 'driveshaft-upgrade'],
        niceToHave: ['forged-internals', 'axles-halfshafts'],
        narrative: 'A Whipple or Roush supercharger transforms the Mustang GT. 700+ hp is achievable while remaining streetable.',
      },
    },
    platformNotes: [
      'PP2 adds MagneRide, Brembo brakes, and aggressive alignment',
      'Coyote 5.0 is incredibly responsive to mods',
      'MT-82 manual has limitations - TR-3160 swap popular for high power',
      '10R80 auto is excellent for drag racing',
    ],
    knownIssues: [
      'MT-82 transmission can have synchro issues under high power',
    ],
  },

  // ============================================================================
  // CHEVROLET CAMARO
  // ============================================================================
  'camaro-zl1': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['high-flow-air-filter', 'brake-pads-performance'],
        recommended: ['cat-back-exhaust', 'pulley-tune-sc'],
        niceToHave: ['lowering-springs', 'short-shifter'],
        narrative: 'The LT4 in the ZL1 makes 650hp stock. Small pulley + tune adds 70-100hp with minimal effort.',
      },
      trackPack: {
        mustHave: ['heat-exchanger-sc', 'brake-pads-track', 'high-temp-brake-fluid', 'oil-cooler'],
        recommended: ['coilovers', 'trans-cooler', 'performance-tires'],
        niceToHave: ['big-brake-kit', 'diff-cooler'],
        narrative: 'Like the C7 Z06, heat management is critical. The ZL1 1LE package is already track-ready.',
      },
      ultimatePower: {
        mustHave: ['pulley-tune-sc', 'heat-exchanger-sc', 'hpfp-upgrade', 'clutch-upgrade'],
        recommended: ['headers', 'fuel-system-upgrade', 'driveshaft-upgrade'],
        niceToHave: ['forged-internals', 'axles-halfshafts'],
        narrative: '800-900+ hp is achievable with pulley mods. The LT4 shares much with the C7 Z06.',
      },
    },
    platformNotes: [
      'ZL1 1LE is the track-focused variant with DSSV dampers',
      'LT4 is the same engine as C7 Z06',
      'MRC suspension on base ZL1 is excellent',
      '10L90 auto or TR6060 manual both capable',
    ],
    knownIssues: [
      'Same heat concerns as C7 Z06',
      'Visibility is limited - not great for track awareness',
    ],
  },

  'camaro-ss-1le': {
    defaultTier: 'trackPack',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust', 'ecu-tune'],
        recommended: ['headers', 'brake-pads-performance'],
        niceToHave: ['short-shifter', 'throttle-body'],
        narrative: 'The LT1 responds excellently to bolt-ons. Intake, exhaust, headers, and tune can add 50-70hp.',
      },
      trackPack: {
        mustHave: ['headers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['coilovers', 'performance-tires', 'oil-cooler'],
        niceToHave: ['big-brake-kit', 'sway-bars'],
        narrative: 'The 1LE package is already track-ready. Focus on headers and exhaust for power.',
      },
      ultimatePower: {
        mustHave: ['supercharger-centrifugal', 'fuel-system-upgrade', 'clutch-upgrade'],
        recommended: ['oil-cooler', 'headers', 'driveshaft-upgrade'],
        niceToHave: ['forged-internals', 'axles-halfshafts'],
        narrative: 'A supercharger transforms the SS 1LE into a monster. 650-700hp is achievable while remaining reliable.',
      },
    },
    platformNotes: [
      '1LE package adds FE4 suspension, dual-mode exhaust, Brembo brakes',
      'Includes coolers for engine oil and differential',
      'Magnetic Ride available on some trims',
    ],
    knownIssues: [
      'LT1 runs hot under sustained track use - oil cooler helps',
    ],
  },

  // ============================================================================
  // NISSAN
  // ============================================================================
  'nissan-gt-r': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['piggyback-tune', 'downpipe', 'intercooler'],
        niceToHave: ['brake-pads-performance', 'lowering-springs'],
        narrative: 'The VR38DETT responds incredibly to basic bolt-ons. Intake, downpipes, and tune can add 80-100hp.',
      },
      trackPack: {
        mustHave: ['intercooler', 'downpipe', 'brake-pads-track', 'high-temp-brake-fluid', 'trans-cooler'],
        recommended: ['coilovers', 'oil-cooler', 'big-brake-kit'],
        niceToHave: ['performance-tires', 'lightweight-wheels'],
        narrative: 'The GT-R generates massive heat. Cooling is critical. The DCT needs a cooler for track use.',
      },
      ultimatePower: {
        mustHave: ['turbo-upgrade-existing', 'intercooler', 'fuel-system-upgrade', 'clutch-upgrade'],
        recommended: ['oil-cooler', 'trans-cooler', 'driveshaft-upgrade'],
        niceToHave: ['forged-internals', 'axles-halfshafts'],
        narrative: 'The VR38 can reliably make 700-800hp on stock internals. Upgraded turbos push past 1000hp.',
      },
    },
    platformNotes: [
      'ATTESA E-TS AWD system is incredibly capable',
      'DCT transmission fluid temperature is critical',
      'Hand-built engines - each Takumi signs their work',
      'NISMO version has 600hp from factory',
    ],
    knownIssues: [
      'Transmission heat is the main concern on track',
      'Early (2009-2011) transmissions had issues - largely resolved',
    ],
  },

  'nissan-370z-nismo': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust', 'ecu-tune'],
        recommended: ['headers', 'brake-pads-performance'],
        niceToHave: ['short-shifter', 'lowering-springs'],
        narrative: 'The VQ37VHR responds well to bolt-ons. Intake, exhaust, and tune can add 30-40hp.',
      },
      trackPack: {
        mustHave: ['coilovers', 'brake-pads-track', 'high-temp-brake-fluid', 'oil-cooler'],
        recommended: ['big-brake-kit', 'performance-tires', 'limited-slip-diff'],
        niceToHave: ['sway-bars', 'lightweight-wheels'],
        narrative: 'The NISMO package already has a good LSD and brakes. Cooling and suspension are the priorities.',
      },
      ultimatePower: {
        mustHave: ['turbo-kit-single', 'fuel-system-upgrade', 'clutch-upgrade'],
        recommended: ['oil-cooler', 'intercooler', 'forged-internals'],
        niceToHave: ['driveshaft-upgrade', 'axles-halfshafts'],
        narrative: 'The VQ37 handles boost well. A single turbo kit can push 450-550hp. Requires significant supporting mods.',
      },
    },
    platformNotes: [
      'NISMO adds upgraded suspension, brakes, and LSD',
      'VQ37VHR is naturally aspirated but responds to FI',
      'SynchroRev Match is a fun feature',
    ],
    knownIssues: [
      'Oil gallery gaskets can fail on high mileage',
      'CSC (concentric slave cylinder) can fail',
    ],
  },

  // ============================================================================
  // BMW
  // ============================================================================
  'bmw-m2-competition': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'downpipe'],
        recommended: ['piggyback-tune', 'cat-back-exhaust'],
        niceToHave: ['brake-pads-performance', 'lowering-springs'],
        narrative: 'The S55 twin-turbo responds incredibly to tuning. JB4 or downpipe + tune can add 80-100hp.',
      },
      trackPack: {
        mustHave: ['intercooler', 'downpipe', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['oil-cooler', 'big-brake-kit', 'performance-tires'],
        niceToHave: ['limited-slip-diff', 'sway-bars'],
        narrative: 'The M2 Competition is an excellent track car. Intercooler prevents heat soak, downpipe adds power.',
      },
      ultimatePower: {
        mustHave: ['turbo-upgrade-existing', 'intercooler', 'downpipe', 'fuel-system-upgrade'],
        recommended: ['oil-cooler', 'clutch-upgrade', 'ecu-tune'],
        niceToHave: ['driveshaft-upgrade'],
        narrative: 'Pure Turbos or similar upgraded turbos push the S55 past 600hp. Requires extensive supporting mods.',
      },
    },
    platformNotes: [
      'S55 engine shared with M3/M4',
      'DCT is faster, manual is more engaging',
      'Excellent chassis balance',
      'Carbon ceramic brakes available but expensive',
    ],
    knownIssues: [
      'Crank hub issues on some S55 engines',
      'Charge pipe can crack under boost',
    ],
  },

  'bmw-m4-f82': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'downpipe'],
        recommended: ['piggyback-tune', 'cat-back-exhaust', 'charge-pipe-upgrade'],
        niceToHave: ['lowering-springs', 'brake-pads-performance'],
        narrative: 'The S55 twin-turbo is incredibly responsive to mods. JB4 + downpipe = easy 500hp.',
      },
      trackPack: {
        mustHave: ['intercooler', 'downpipe', 'coilovers', 'brake-pads-track', 'oil-cooler'],
        recommended: ['big-brake-kit', 'performance-tires', 'trans-cooler'],
        niceToHave: ['limited-slip-diff', 'sway-bars'],
        narrative: 'Heat management is key for track use. The S55 runs hot. Intercooler and oil cooler are essential.',
      },
      ultimatePower: {
        mustHave: ['turbo-upgrade-existing', 'intercooler', 'fuel-system-upgrade', 'clutch-upgrade'],
        recommended: ['oil-cooler', 'downpipe', 'driveshaft-upgrade'],
        niceToHave: ['forged-internals'],
        narrative: 'Upgraded turbos push the F82 M4 past 600hp. The S55 can handle big power with proper cooling.',
      },
    },
    platformNotes: [
      'Competition package adds firmer suspension, louder exhaust',
      'GTS version has 500hp, water injection',
      'Carbon roof lowers center of gravity',
    ],
    knownIssues: [
      'Crank hub issues (rare but documented)',
      'Charge pipes can crack',
      'Rod bearings should be inspected',
    ],
  },

  // ============================================================================
  // TOYOTA / LEXUS
  // ============================================================================
  'toyota-gr-supra': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'downpipe'],
        recommended: ['piggyback-tune', 'cat-back-exhaust'],
        niceToHave: ['lowering-springs', 'brake-pads-performance'],
        narrative: 'The B58 responds incredibly to tuning. A JB4 or downpipe + tune can add 80-100hp with zero drama.',
      },
      trackPack: {
        mustHave: ['intercooler', 'downpipe', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['oil-cooler', 'big-brake-kit', 'performance-tires'],
        niceToHave: ['sway-bars', 'limited-slip-diff'],
        narrative: 'The Supra is an excellent track platform. Intercooler prevents heat soak, coilovers improve handling.',
      },
      ultimatePower: {
        mustHave: ['turbo-upgrade-existing', 'intercooler', 'downpipe', 'fuel-system-upgrade'],
        recommended: ['oil-cooler', 'clutch-upgrade', 'driveshaft-upgrade'],
        niceToHave: ['forged-internals'],
        narrative: 'Pure Turbos or similar upgraded turbos push the B58 past 600hp. The engine is very strong.',
      },
    },
    platformNotes: [
      'B58 is a BMW engine - excellent tuning potential',
      'ZF8 automatic only (no manual until 2023)',
      'Z4 M40i is the platform mate',
      'A91 edition has unique features',
    ],
    knownIssues: [
      'Early cars had some electrical gremlins',
      'Stock fuel pump is a limitation around 500hp',
    ],
  },

  'lexus-lc-500': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['headers', 'ecu-tune', 'lowering-springs'],
        niceToHave: ['brake-pads-performance', 'performance-alignment'],
        narrative: 'The 5.0L 2UR-GSE V8 sounds incredible with a full exhaust. Headers add noticeable power.',
      },
      trackPack: {
        mustHave: ['headers', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['big-brake-kit', 'performance-tires', 'oil-cooler'],
        niceToHave: ['sway-bars', 'lightweight-wheels'],
        narrative: 'The LC 500 is a grand tourer, not a track car. But the chassis is capable with proper upgrades.',
      },
    },
    platformNotes: [
      '2UR-GSE 5.0L V8 is naturally aspirated perfection',
      '10-speed automatic is smooth but not sporty',
      'LFA-derived exhaust note is incredible',
      'GT car, not a sports car - comfortable first',
    ],
    knownIssues: [
      'Heavy for a sports car - best as GT',
    ],
  },

  'lexus-rc-f': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['headers', 'ecu-tune', 'brake-pads-performance'],
        niceToHave: ['lowering-springs', 'short-shifter'],
        narrative: 'The 2UR-GSE 5.0L V8 responds well to exhaust and headers. Tune optimizes the throttle response.',
      },
      trackPack: {
        mustHave: ['headers', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['big-brake-kit', 'performance-tires', 'oil-cooler'],
        niceToHave: ['lightweight-wheels', 'sway-bars'],
        narrative: 'Track Edition has carbon roof and TVD. Standard RC F needs suspension work for serious track use.',
      },
      ultimatePower: {
        mustHave: ['supercharger-centrifugal', 'fuel-system-upgrade', 'clutch-upgrade'],
        recommended: ['headers', 'oil-cooler', 'intercooler'],
        niceToHave: ['forged-internals'],
        narrative: 'RR Racing supercharger kits push the RC F past 600hp. The 2UR engine handles boost well.',
      },
    },
    platformNotes: [
      'Track Edition adds carbon roof and torque vectoring differential',
      'Heavier than M4/C63 competition',
      'V8 sounds excellent with exhaust',
    ],
    knownIssues: [
      'Weight is the main limitation',
    ],
  },

  // ============================================================================
  // MERCEDES
  // ============================================================================
  'mercedes-c63-amg-w204': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['headers', 'ecu-tune', 'brake-pads-performance'],
        niceToHave: ['lowering-springs', 'performance-alignment'],
        narrative: 'The M156 6.2L V8 sounds incredible with exhaust. Headers add significant power and sound.',
      },
      trackPack: {
        mustHave: ['headers', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid', 'oil-cooler'],
        recommended: ['big-brake-kit', 'performance-tires', 'trans-cooler'],
        niceToHave: ['sway-bars', 'limited-slip-diff'],
        narrative: 'The M156 runs hot on track. Cooling is essential. The LSD is available but expensive.',
      },
      ultimatePower: {
        mustHave: ['supercharger-centrifugal', 'fuel-system-upgrade', 'clutch-upgrade'],
        recommended: ['headers', 'oil-cooler', 'intercooler'],
        niceToHave: ['forged-internals'],
        narrative: 'Supercharging the M156 creates a monster. VF Engineering and Weistec kits push past 600hp.',
      },
    },
    platformNotes: [
      'M156 6.2L NA V8 is last of the hand-built NA AMG engines',
      'Black Series is the ultimate version - 510hp, wider fenders',
      'MCT transmission in later cars improves shifts',
    ],
    knownIssues: [
      'Head bolt issues on early M156 engines (2008-2010)',
      'Cam adjuster bolts should be inspected',
    ],
  },

  // ============================================================================
  // AUDI
  // ============================================================================
  'audi-r8-v8': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['headers', 'ecu-tune', 'brake-pads-performance'],
        niceToHave: ['lowering-springs', 'performance-alignment'],
        narrative: 'The 4.2L FSI V8 sounds amazing with exhaust. Headers are expensive but add power and sound.',
      },
      trackPack: {
        mustHave: ['headers', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['big-brake-kit', 'performance-tires', 'oil-cooler'],
        niceToHave: ['lightweight-wheels', 'sway-bars'],
        narrative: 'The R8 is a capable track car. Cooling and brakes are the priorities. The chassis is excellent.',
      },
    },
    platformNotes: [
      '4.2L FSI V8 is naturally aspirated - 420hp',
      'R-tronic (early) is less desirable than S-tronic (later)',
      'Gated manual is the most desirable',
      'Shares platform with Gallardo',
    ],
    knownIssues: [
      'R-tronic can be jerky and expensive to service',
      'Carbon ceramic brakes are expensive to replace',
    ],
  },

  'audi-r8-v10': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['ecu-tune', 'brake-pads-performance'],
        niceToHave: ['lowering-springs', 'performance-alignment'],
        narrative: 'The 5.2L V10 is incredible stock. A tune removes limiters and adds throttle response.',
      },
      trackPack: {
        mustHave: ['coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['big-brake-kit', 'performance-tires', 'oil-cooler'],
        niceToHave: ['lightweight-wheels', 'sway-bars'],
        narrative: 'The R8 V10 is a supercar. It handles track duty well but needs cooling for sustained use.',
      },
      ultimatePower: {
        mustHave: ['turbo-kit-twin', 'fuel-system-upgrade', 'clutch-upgrade'],
        recommended: ['forged-internals', 'oil-cooler', 'intercooler'],
        niceToHave: ['driveshaft-upgrade', 'axles-halfshafts'],
        narrative: 'Twin turbo R8 V10 builds can make 1000+ hp. Extreme but possible with significant investment.',
      },
    },
    platformNotes: [
      '5.2L FSI V10 - Lamborghini derived',
      'Plus/Performance versions have 610hp',
      'S-tronic DCT is excellent',
      'Gen 2 R8 uses Huracan platform',
    ],
    knownIssues: [
      'Carbon sigma rotors are fragile if overheated',
      'R-tronic (if equipped) requires careful operation',
    ],
  },

  // ============================================================================
  // LAMBORGHINI
  // ============================================================================
  'lamborghini-gallardo': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['ecu-tune', 'brake-pads-performance'],
        niceToHave: ['lowering-springs', 'performance-alignment'],
        narrative: 'The V10 sounds incredible with exhaust. Minimal mods preserve the exotic character.',
      },
      trackPack: {
        mustHave: ['coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['big-brake-kit', 'performance-tires', 'oil-cooler'],
        niceToHave: ['lightweight-wheels', 'sway-bars'],
        narrative: 'The Gallardo is a capable track car. Superleggera and Performante variants are track-focused.',
      },
      ultimatePower: {
        mustHave: ['turbo-kit-twin', 'fuel-system-upgrade', 'clutch-upgrade'],
        recommended: ['forged-internals', 'oil-cooler', 'intercooler'],
        niceToHave: ['driveshaft-upgrade', 'axles-halfshafts'],
        narrative: 'Underground Racing and similar shops build 1500+ hp twin turbo Gallardos. Extreme builds.',
      },
    },
    platformNotes: [
      'Shares platform with R8',
      'E-gear is a single-clutch automated manual - not great',
      'LP560-4 and later have 5.2L V10',
      'Superleggera is the lightweight version',
    ],
    knownIssues: [
      'E-gear requires expensive clutch replacement',
      'Timing chains can be expensive to service',
    ],
  },

  // ============================================================================
  // LOTUS
  // ============================================================================
  'lotus-emira': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['ecu-tune', 'brake-pads-performance'],
        niceToHave: ['performance-alignment', 'lowering-springs'],
        narrative: 'The AMG-sourced 2.0L turbo responds well to tuning. The Toyota V6 version has less tuning potential.',
      },
      trackPack: {
        mustHave: ['coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['big-brake-kit', 'performance-tires', 'intercooler'],
        niceToHave: ['lightweight-wheels', 'oil-cooler'],
        narrative: 'The Emira is already very capable. The chassis is excellent. Focus on cooling for track use.',
      },
    },
    platformNotes: [
      'Two engine options: AMG 2.0T (400hp) or Toyota V6 (365hp)',
      'AMG engine has more tuning potential',
      'Toyota engine is more reliable long-term',
      'Last pure ICE Lotus',
    ],
    knownIssues: [
      'Early production had some quality issues',
      'Dealer network is limited',
    ],
  },

  'lotus-evora-gt': {
    defaultTier: 'trackPack',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['ecu-tune', 'brake-pads-performance'],
        niceToHave: ['short-shifter', 'performance-alignment'],
        narrative: 'The supercharged 2GR-FE V6 responds to intake and exhaust mods. Keep the lightweight character.',
      },
      trackPack: {
        mustHave: ['coilovers', 'brake-pads-track', 'high-temp-brake-fluid', 'oil-cooler'],
        recommended: ['big-brake-kit', 'performance-tires', 'pulley-tune-sc'],
        niceToHave: ['lightweight-wheels', 'sway-bars'],
        narrative: 'The Evora GT is a serious track car. Supercharger pulley adds easy power. Focus on cooling.',
      },
    },
    platformNotes: [
      'Edelbrock supercharger from factory',
      'Toyota 2GR-FE V6 is incredibly reliable',
      'GT version has 416hp, lighter than base',
      'Manual gearbox is Toyota-sourced',
    ],
    knownIssues: [
      'A/C can be weak in hot climates',
      'Parts availability can be challenging',
    ],
  },

  'lotus-evora-s': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['ecu-tune', 'brake-pads-performance'],
        niceToHave: ['lowering-springs', 'short-shifter'],
        narrative: 'The supercharged V6 responds to basic mods. Focus on maintaining the lightweight character.',
      },
      trackPack: {
        mustHave: ['coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['big-brake-kit', 'performance-tires', 'oil-cooler'],
        niceToHave: ['pulley-tune-sc', 'lightweight-wheels'],
        narrative: 'The Evora S is an excellent track car. Cooling and brakes are the priorities.',
      },
    },
    platformNotes: [
      'Supercharged 2GR-FE makes 345hp',
      'IPS (automated manual) is less desirable than manual',
      'Excellent weight distribution',
    ],
    knownIssues: [
      'IPS gearbox can be clunky',
    ],
  },

  // ============================================================================
  // DODGE
  // ============================================================================
  'dodge-viper': {
    defaultTier: 'trackPack',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['headers', 'ecu-tune', 'brake-pads-performance'],
        niceToHave: ['short-shifter', 'performance-alignment'],
        narrative: 'The 8.4L V10 is already making serious power. Headers and exhaust add to the incredible sound.',
      },
      trackPack: {
        mustHave: ['headers', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid', 'oil-cooler'],
        recommended: ['big-brake-kit', 'performance-tires', 'trans-cooler'],
        niceToHave: ['limited-slip-diff', 'sway-bars'],
        narrative: 'The Viper is a serious track weapon. The ACR is the ultimate version. Cooling is critical.',
      },
      ultimatePower: {
        mustHave: ['turbo-kit-twin', 'fuel-system-upgrade', 'clutch-upgrade', 'forged-internals'],
        recommended: ['oil-cooler', 'trans-cooler', 'driveshaft-upgrade'],
        niceToHave: ['axles-halfshafts'],
        narrative: 'Twin turbo Vipers make 1500+ hp. The V10 can handle significant power with proper supporting mods.',
      },
    },
    platformNotes: [
      'Gen 5 (2013+) has 640hp 8.4L V10',
      'ACR is the ultimate track variant - extensive aero',
      'No driver aids until Gen 5',
      'Manual only - Tremec TR6060',
    ],
    knownIssues: [
      'Early Vipers (Gen 1-4) can be dangerous in inexperienced hands',
      'Heat management important due to engine size',
    ],
  },

  // ============================================================================
  // JAGUAR
  // ============================================================================
  'jaguar-f-type-r': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['high-flow-air-filter', 'cat-back-exhaust'],
        recommended: ['pulley-tune-sc', 'brake-pads-performance'],
        niceToHave: ['lowering-springs', 'performance-alignment'],
        narrative: 'The supercharged 5.0L V8 responds to pulley and tune. The exhaust is already excellent.',
      },
      trackPack: {
        mustHave: ['pulley-tune-sc', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['heat-exchanger-sc', 'big-brake-kit', 'performance-tires'],
        niceToHave: ['oil-cooler', 'sway-bars'],
        narrative: 'The F-Type R is a grand tourer first. With mods, it becomes a capable track car.',
      },
      ultimatePower: {
        mustHave: ['pulley-tune-sc', 'heat-exchanger-sc', 'fuel-system-upgrade'],
        recommended: ['oil-cooler', 'headers', 'intercooler'],
        niceToHave: ['forged-internals'],
        narrative: 'The supercharged V8 can reliably make 650-700hp with pulley and tune. The ZF8 handles the power.',
      },
    },
    platformNotes: [
      'AJ133 supercharged V8 shared with Range Rover Sport',
      'AWD R adds traction but weight',
      'Manual was available on V6 S only',
      'SVR version has 575hp',
    ],
    knownIssues: [
      'Electronic issues can occur',
      'Heat exchanger needs upgrading for sustained boost',
    ],
  },

  'jaguar-f-type-v6-s': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['pulley-tune-sc', 'brake-pads-performance'],
        niceToHave: ['lowering-springs', 'short-shifter'],
        narrative: 'The supercharged V6 sounds incredible. Pulley and tune add easy power.',
      },
      trackPack: {
        mustHave: ['pulley-tune-sc', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['heat-exchanger-sc', 'big-brake-kit', 'performance-tires'],
        niceToHave: ['oil-cooler', 'sway-bars'],
        narrative: 'The V6 S is lighter than the V8. Makes it a better canyon car. Cooling upgrades help on track.',
      },
    },
    platformNotes: [
      '3.0L supercharged V6 - 380hp',
      'Manual available',
      'Lighter than V8 R',
    ],
    knownIssues: [
      'Same as F-Type R',
    ],
  },

  // ============================================================================
  // ALFA ROMEO
  // ============================================================================
  'alfa-romeo-4c': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['piggyback-tune', 'brake-pads-performance'],
        niceToHave: ['lowering-springs', 'performance-alignment'],
        narrative: 'The 1750 turbo is responsive to mods. Exhaust adds character to the already exotic sound.',
      },
      trackPack: {
        mustHave: ['intercooler', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['big-brake-kit', 'performance-tires', 'oil-cooler'],
        niceToHave: ['lightweight-wheels', 'sway-bars'],
        narrative: 'The 4C is incredibly light and nimble. It\'s a track weapon with minimal upgrades needed.',
      },
    },
    platformNotes: [
      'Carbon fiber monocoque - incredibly light',
      'No power steering - heavy at low speeds',
      'TCT dual-clutch only',
      'Spider version has removable roof',
    ],
    knownIssues: [
      'Reliability can be questionable',
      'Dealer network limited',
      'Parts expensive',
    ],
  },

  // ============================================================================
  // ASTON MARTIN
  // ============================================================================
  'aston-martin-v8-vantage': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['headers', 'ecu-tune', 'brake-pads-performance'],
        niceToHave: ['lowering-springs', 'short-shifter'],
        narrative: 'The 4.3/4.7L V8 sounds incredible. Headers and exhaust transform the character.',
      },
      trackPack: {
        mustHave: ['headers', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['big-brake-kit', 'performance-tires', 'oil-cooler'],
        niceToHave: ['sway-bars', 'lightweight-wheels'],
        narrative: 'The Vantage is a competent track car. The V8 S has more power. Cooling is important.',
      },
    },
    platformNotes: [
      '4.3L (2006-2008) makes 380hp, 4.7L (2008+) makes 420hp',
      'N420/S versions have 420-430hp',
      'Sportshift is a single-clutch automated manual - not great',
      'Manual is the most desirable',
    ],
    knownIssues: [
      'Sportshift can be expensive to maintain',
      'Running costs are high',
    ],
  },

  // ============================================================================
  // MASERATI
  // ============================================================================
  'maserati-granturismo': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'cat-back-exhaust'],
        recommended: ['headers', 'ecu-tune', 'brake-pads-performance'],
        niceToHave: ['lowering-springs', 'performance-alignment'],
        narrative: 'The Ferrari-derived V8 sounds incredible. Exhaust and headers enhance the already fantastic sound.',
      },
      trackPack: {
        mustHave: ['headers', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid'],
        recommended: ['big-brake-kit', 'performance-tires', 'oil-cooler'],
        niceToHave: ['sway-bars', 'lightweight-wheels'],
        narrative: 'The GranTurismo is a GT car first. With mods, it becomes a capable track car.',
      },
    },
    platformNotes: [
      'Ferrari F136 V8 - 4.2L (405hp) or 4.7L (454hp)',
      'MC Stradale is the track version',
      'ZF6 automatic or MC Race gearbox',
      'Heavy but comfortable',
    ],
    knownIssues: [
      'Expensive to maintain',
      'Electronics can be problematic',
      'Parts are expensive',
    ],
  },

  // ============================================================================
  // SUBARU
  // ============================================================================
  'subaru-wrx-sti-va': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'downpipe', 'cat-back-exhaust'],
        recommended: ['ecu-tune', 'brake-pads-performance'],
        niceToHave: ['short-shifter', 'lowering-springs'],
        narrative: 'The EJ257 responds well to bolt-ons. Intake, downpipe, and tune are the essential trio.',
      },
      trackPack: {
        mustHave: ['ecu-tune', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid', 'oil-cooler'],
        recommended: ['big-brake-kit', 'performance-tires', 'intercooler'],
        niceToHave: ['sway-bars', 'limited-slip-diff'],
        narrative: 'The STI is a rally-bred car. It handles track duty well but needs cooling upgrades.',
      },
      ultimatePower: {
        mustHave: ['turbo-upgrade-existing', 'fuel-system-upgrade', 'forged-internals'],
        recommended: ['clutch-upgrade', 'intercooler', 'oil-cooler'],
        niceToHave: ['driveshaft-upgrade'],
        narrative: 'The EJ257 can make 400-500hp reliably with proper supporting mods. Forged internals are essential.',
      },
    },
    platformNotes: [
      'EJ257 2.5L turbo boxer',
      'DCCD AWD system is excellent',
      'Brembo brakes from factory',
      'Last of the EJ-powered STIs',
    ],
    knownIssues: [
      'Ringland failure on tuned engines',
      'Head gaskets can fail',
      'Oil starvation during hard cornering possible',
    ],
  },

  'subaru-wrx-sti-gr-gv': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'downpipe', 'cat-back-exhaust'],
        recommended: ['ecu-tune', 'brake-pads-performance'],
        niceToHave: ['short-shifter', 'lowering-springs'],
        narrative: 'Same EJ257 as VA. The hatchback is lighter and more practical. Same bolt-on formula.',
      },
      trackPack: {
        mustHave: ['ecu-tune', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid', 'oil-cooler'],
        recommended: ['big-brake-kit', 'performance-tires', 'intercooler'],
        niceToHave: ['sway-bars', 'limited-slip-diff'],
        narrative: 'GR hatchback is lighter and more balanced. Excellent track platform with cooling upgrades.',
      },
    },
    platformNotes: [
      'GR hatchback is most desired',
      'Spec C available in some markets',
      'Wide-body fenders on GR',
    ],
    knownIssues: [
      'Same as VA - ringland, head gaskets',
    ],
  },

  'subaru-wrx-sti-gd': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'downpipe', 'cat-back-exhaust'],
        recommended: ['ecu-tune', 'brake-pads-performance'],
        niceToHave: ['short-shifter', 'lowering-springs'],
        narrative: 'The classic blob-eye/hawk-eye STI. Same EJ257 formula. Iconic styling.',
      },
      trackPack: {
        mustHave: ['ecu-tune', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid', 'oil-cooler'],
        recommended: ['big-brake-kit', 'performance-tires', 'intercooler'],
        niceToHave: ['sway-bars', 'limited-slip-diff'],
        narrative: 'The GD is the most analog STI. Excellent track platform with proper cooling.',
      },
    },
    platformNotes: [
      '2004 blob-eye, 2006 hawk-eye',
      'Many consider this the best STI generation',
      'DCCD system is excellent',
    ],
    knownIssues: [
      'Age-related issues more common',
      'Same engine concerns',
    ],
  },

  // ============================================================================
  // MITSUBISHI
  // ============================================================================
  'mitsubishi-lancer-evo-8-9': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'downpipe', 'cat-back-exhaust'],
        recommended: ['ecu-tune', 'brake-pads-performance'],
        niceToHave: ['short-shifter', 'lowering-springs'],
        narrative: 'The 4G63 is legendary. Intake, exhaust, and boost controller can add 50-80hp easily.',
      },
      trackPack: {
        mustHave: ['ecu-tune', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid', 'oil-cooler'],
        recommended: ['intercooler', 'performance-tires', 'big-brake-kit'],
        niceToHave: ['sway-bars', 'diff-cooler'],
        narrative: 'The Evo is a rally homologation car. It excels on track with minimal modifications.',
      },
      ultimatePower: {
        mustHave: ['turbo-upgrade-existing', 'fuel-system-upgrade', 'forged-internals'],
        recommended: ['clutch-upgrade', 'intercooler', 'oil-cooler'],
        niceToHave: ['driveshaft-upgrade', 'axles-halfshafts'],
        narrative: 'The 4G63 can make 500-600hp with proper supporting mods. Legendary tuning platform.',
      },
    },
    platformNotes: [
      '4G63 2.0L turbo is legendary',
      'Evo 8/9 MR have Bilstein suspension',
      'ACD and AYC (Active Center/Yaw Control) are excellent',
      'RS models are stripped-down for competition',
    ],
    knownIssues: [
      'Crankwalk on some 4G63 engines',
      'Transfer case can be fragile under high power',
    ],
  },

  'mitsubishi-lancer-evo-x': {
    defaultTier: 'streetSport',
    tiers: {
      streetSport: {
        mustHave: ['cold-air-intake', 'downpipe', 'cat-back-exhaust'],
        recommended: ['ecu-tune', 'brake-pads-performance'],
        niceToHave: ['short-shifter', 'lowering-springs'],
        narrative: 'The 4B11T is responsive to mods. MIVEC provides good power across the rev range.',
      },
      trackPack: {
        mustHave: ['ecu-tune', 'coilovers', 'brake-pads-track', 'high-temp-brake-fluid', 'oil-cooler'],
        recommended: ['intercooler', 'performance-tires', 'big-brake-kit'],
        niceToHave: ['sway-bars', 'diff-cooler'],
        narrative: 'The Evo X is more refined than 8/9 but still a capable track car. S-AWC is excellent.',
      },
      ultimatePower: {
        mustHave: ['turbo-upgrade-existing', 'fuel-system-upgrade', 'clutch-upgrade'],
        recommended: ['forged-internals', 'intercooler', 'oil-cooler'],
        niceToHave: ['driveshaft-upgrade'],
        narrative: 'The 4B11T can make 500hp with proper supporting mods. Weaker than 4G63 at extreme levels.',
      },
    },
    platformNotes: [
      '4B11T 2.0L turbo replaced 4G63',
      'SST dual-clutch available',
      'S-AWC (Super All Wheel Control) is impressive',
      'Final Evo - Final Edition highly collectible',
    ],
    knownIssues: [
      'SST can be fragile under high power',
      'Crankshaft thrust bearing wear reported',
    ],
  },
};

/**
 * Get recommendations for a specific car
 * @param {string} carSlug - Car slug
 * @returns {Object|null} - Recommendations or null
 */
export function getRecommendationsForCar(carSlug) {
  return carUpgradeRecommendations[carSlug] || null;
}

/**
 * Get recommended upgrades for a car at a specific tier
 * @param {string} carSlug - Car slug
 * @param {string} tier - Tier key (streetSport, trackPack, timeAttack, ultimatePower)
 * @returns {Object|null} - Tier recommendations or null
 */
export function getTierRecommendations(carSlug, tier) {
  const carRecs = carUpgradeRecommendations[carSlug];
  if (!carRecs || !carRecs.tiers) return null;
  return carRecs.tiers[tier] || null;
}

/**
 * Get all must-have upgrades for a car at a tier
 * @param {string} carSlug - Car slug
 * @param {string} tier - Tier key
 * @returns {string[]} - Array of upgrade keys
 */
export function getMustHaveUpgrades(carSlug, tier) {
  const tierRecs = getTierRecommendations(carSlug, tier);
  return tierRecs?.mustHave || [];
}

/**
 * Get platform notes for a car
 * @param {string} carSlug - Car slug
 * @returns {string[]} - Platform notes
 */
export function getPlatformNotes(carSlug) {
  return carUpgradeRecommendations[carSlug]?.platformNotes || [];
}

/**
 * Get known issues for a car
 * @param {string} carSlug - Car slug
 * @returns {string[]} - Known issues
 */
export function getKnownIssues(carSlug) {
  return carUpgradeRecommendations[carSlug]?.knownIssues || [];
}

/**
 * Get all car slugs with recommendations
 * @returns {string[]} - Array of car slugs
 */
export function getCarSlugsWithRecommendations() {
  return Object.keys(carUpgradeRecommendations);
}

export default carUpgradeRecommendations;


