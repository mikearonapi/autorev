#!/usr/bin/env node
/**
 * Script to add ownership data to car entries
 * This maps brand/platform cost tier and ownership fields to each car
 */

// Brand to ownership data mapping
const brandData = {
  'Porsche': {
    country: 'Germany',
    platformCostTier: 'premium',
    maintenanceCostIndex: 4,
    insuranceCostIndex: 5
  },
  'Audi': {
    country: 'Germany',
    platformCostTier: 'luxury',
    maintenanceCostIndex: 4,
    insuranceCostIndex: 4
  },
  'Lamborghini': {
    country: 'Italy',
    platformCostTier: 'premium',
    maintenanceCostIndex: 5,
    insuranceCostIndex: 5
  },
  'Lotus': {
    country: 'UK',
    platformCostTier: 'luxury',
    maintenanceCostIndex: 4,
    insuranceCostIndex: 4
  },
  'Dodge': {
    country: 'USA',
    platformCostTier: 'mainstream',
    maintenanceCostIndex: 3,
    insuranceCostIndex: 5
  },
  'Chevrolet': {
    country: 'USA',
    platformCostTier: 'mainstream',
    maintenanceCostIndex: 2,
    insuranceCostIndex: 3
  },
  'Ford': {
    country: 'USA',
    platformCostTier: 'mainstream',
    maintenanceCostIndex: 2,
    insuranceCostIndex: 3
  },
  'Nissan': {
    country: 'Japan',
    platformCostTier: 'mainstream',
    maintenanceCostIndex: 3,
    insuranceCostIndex: 4
  },
  'Toyota': {
    country: 'Japan',
    platformCostTier: 'mainstream',
    maintenanceCostIndex: 2,
    insuranceCostIndex: 3
  },
  'Lexus': {
    country: 'Japan',
    platformCostTier: 'luxury',
    maintenanceCostIndex: 3,
    insuranceCostIndex: 3
  },
  'BMW': {
    country: 'Germany',
    platformCostTier: 'luxury',
    maintenanceCostIndex: 4,
    insuranceCostIndex: 4
  },
  'Mercedes': {
    country: 'Germany',
    platformCostTier: 'luxury',
    maintenanceCostIndex: 4,
    insuranceCostIndex: 4
  },
  'Alfa Romeo': {
    country: 'Italy',
    platformCostTier: 'luxury',
    maintenanceCostIndex: 4,
    insuranceCostIndex: 4
  },
  'Aston Martin': {
    country: 'UK',
    platformCostTier: 'premium',
    maintenanceCostIndex: 5,
    insuranceCostIndex: 5
  },
  'Jaguar': {
    country: 'UK',
    platformCostTier: 'luxury',
    maintenanceCostIndex: 4,
    insuranceCostIndex: 4
  },
  'Maserati': {
    country: 'Italy',
    platformCostTier: 'luxury',
    maintenanceCostIndex: 5,
    insuranceCostIndex: 4
  }
};

// Car-specific ownership data
const carOwnershipData = {
  '718-cayman-gt4': {
    brand: 'Porsche',
    manualAvailable: true,
    seats: 2,
    dailyUsabilityTag: 'Weekend warrior',
    fuelEconomyCombined: 20,
    commonIssues: ['Clutch wear on track use', 'Infotainment quirks'],
    yearsToAvoid: null,
    recommendedYearsNote: 'All 718 GT4 years are solid. 2021+ got minor suspension tweaks.',
    ownershipCostNotes: 'Porsche parts are expensive but the flat-6 is robust. Budget for track brake pads.'
  },
  '718-cayman-gts-40': {
    brand: 'Porsche',
    manualAvailable: true,
    seats: 2,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 21,
    commonIssues: ['Minor infotainment bugs', 'Occasional PDK service items'],
    yearsToAvoid: null,
    recommendedYearsNote: 'All years excellent. 2021+ has improved connectivity.',
    ownershipCostNotes: 'More daily-friendly than GT4. Standard Porsche ownership costs apply.'
  },
  'audi-r8-v8': {
    brand: 'Audi',
    manualAvailable: true,
    seats: 2,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 14,
    commonIssues: ['R-Tronic transmission service', 'Carbon buildup on valves', 'Magnetic ride shocks'],
    yearsToAvoid: '2008 first year',
    recommendedYearsNote: '2010+ preferred for sorted electronics. Manual cars hold value better.',
    ownershipCostNotes: 'Shared parts with Gallardo. Find a good indie shop for major savings.'
  },
  'audi-r8-v10': {
    brand: 'Audi',
    manualAvailable: true,
    seats: 2,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 12,
    commonIssues: ['R-Tronic issues', 'Carbon buildup', 'Magnetic ride service'],
    yearsToAvoid: null,
    recommendedYearsNote: '2012+ has improved electronics. Gen 2 (2016+) significantly updated.',
    ownershipCostNotes: 'V10 service costs more than V8. Same Lamborghini-shared V10 as Huracan.'
  },
  'lamborghini-gallardo': {
    brand: 'Lamborghini',
    manualAvailable: true,
    seats: 2,
    dailyUsabilityTag: 'Weekend warrior',
    fuelEconomyCombined: 11,
    commonIssues: ['E-gear actuator wear', 'Clutch wear', 'Rear clam service access'],
    yearsToAvoid: '2004-2005 early E-gear',
    recommendedYearsNote: 'LP560-4 (2008+) is best spec. Manual 6MT cars are rare and valuable.',
    ownershipCostNotes: 'Lamborghini labor rates are high. Shares many parts with R8.'
  },
  'lotus-emira': {
    brand: 'Lotus',
    manualAvailable: true,
    seats: 2,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 23,
    commonIssues: ['First year production quirks', 'Infotainment learning curve'],
    yearsToAvoid: null,
    recommendedYearsNote: 'V6 First Edition best spec. AMG I4 more practical. Manual only with V6.',
    ownershipCostNotes: 'Toyota/AMG engines mean reasonable service costs. Lotus-specific parts can be pricey.'
  },
  'dodge-viper': {
    brand: 'Dodge',
    manualAvailable: true,
    seats: 2,
    dailyUsabilityTag: 'Weekend warrior',
    fuelEconomyCombined: 14,
    commonIssues: ['Clutch hydraulics', 'AC system', 'Side sill cracking on Gen 3/4'],
    yearsToAvoid: 'Gen 1 (1992-1995) raw',
    recommendedYearsNote: 'Gen 5 (2013-2017) most refined. ACR is ultimate track weapon.',
    ownershipCostNotes: 'Cheap American V10 parts. Labor can be tricky due to tight packaging.'
  },
  'c8-corvette-stingray': {
    brand: 'Chevrolet',
    manualAvailable: false,
    seats: 2,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 19,
    commonIssues: ['Frunk latch recalls', 'Transmission calibration', 'Leather shrinkage in heat'],
    yearsToAvoid: null,
    recommendedYearsNote: '2022+ has E-Ray. All years solid. Z51 package worth it.',
    ownershipCostNotes: 'Corvette pricing - very reasonable. DCT service intervals longer than manual.'
  },
  '981-cayman-gts': {
    brand: 'Porsche',
    manualAvailable: true,
    seats: 2,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 22,
    commonIssues: ['IMS bearing N/A for 981', 'Coolant pipes (rare)', 'PDK mechatronics'],
    yearsToAvoid: null,
    recommendedYearsNote: 'All 981 GTS years excellent. Manual + Sport Chrono best combo.',
    ownershipCostNotes: 'Sweet spot Porsche. 981 chassis very reliable. Parts costs moderate for brand.'
  },
  '991-carrera-s': {
    brand: 'Porsche',
    manualAvailable: true,
    seats: 4,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 21,
    commonIssues: ['Coolant pipe (pre-2014)', 'Sport Chrono clock', 'Rear main seal'],
    yearsToAvoid: '2012 first year',
    recommendedYearsNote: '2014+ facelift sorted most issues. Manual cars hold value.',
    ownershipCostNotes: '911 ownership is predictable. Independent shops can save 50% over dealer.'
  },
  '997-carrera-s': {
    brand: 'Porsche',
    manualAvailable: true,
    seats: 4,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 19,
    commonIssues: ['IMS bearing (early cars)', 'Bore scoring risk', 'RMS'],
    yearsToAvoid: '2005-2008 IMS risk',
    recommendedYearsNote: '2009+ (997.2) has DFI engine with no IMS bearing. Much more reliable.',
    ownershipCostNotes: 'Buy 997.2 for peace of mind. IMS bearing replacement is expensive insurance.'
  },
  'nissan-gt-r': {
    brand: 'Nissan',
    manualAvailable: false,
    seats: 4,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 16,
    commonIssues: ['Transmission service critical', 'Launch control wear', 'Transfer case'],
    yearsToAvoid: '2009 transmission issues',
    recommendedYearsNote: '2012+ has updated trans. NISMO and Track Edition are special.',
    ownershipCostNotes: 'Specialized service required. Transmission fluid changes expensive but critical.'
  },
  'shelby-gt500': {
    brand: 'Ford',
    manualAvailable: true,
    seats: 4,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 14,
    commonIssues: ['Heat soak (pre-2020)', 'Supercharger maintenance', 'Clutch on high-power tunes'],
    yearsToAvoid: null,
    recommendedYearsNote: '2020+ has DCT and predator motor. S197 (2007-2014) is classic muscle.',
    ownershipCostNotes: 'Ford parts pricing. Supercharger service at 60K miles. Tires wear fast.'
  },
  'lotus-evora-gt': {
    brand: 'Lotus',
    manualAvailable: true,
    seats: 4,
    dailyUsabilityTag: 'Weekend warrior',
    fuelEconomyCombined: 19,
    commonIssues: ['Toyota V6 bulletproof', 'Lotus electrics', 'A/C efficiency'],
    yearsToAvoid: null,
    recommendedYearsNote: 'GT and GT410 Sport are best specs. Manual preferred by enthusiasts.',
    ownershipCostNotes: 'Toyota V6 very reliable. Lotus-specific parts need specialist sources.'
  },
  '981-cayman-s': {
    brand: 'Porsche',
    manualAvailable: true,
    seats: 2,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 23,
    commonIssues: ['Very few issues', 'Coolant pipe rare', 'Normal wear items'],
    yearsToAvoid: null,
    recommendedYearsNote: 'All years excellent. Sport Chrono and manual is ideal spec.',
    ownershipCostNotes: 'Possibly the most reliable modern Porsche. Reasonable running costs.'
  },
  'shelby-gt350': {
    brand: 'Ford',
    manualAvailable: true,
    seats: 4,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 16,
    commonIssues: ['Oil consumption on early cars', 'Clutch (track use)', 'Track pack diff'],
    yearsToAvoid: '2016 first year',
    recommendedYearsNote: '2018+ has improved oil consumption. GT350R is track-focused.',
    ownershipCostNotes: 'Voodoo engine requires oil monitoring. Otherwise standard Mustang costs.'
  },
  'jaguar-f-type-r': {
    brand: 'Jaguar',
    manualAvailable: false,
    seats: 2,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 16,
    commonIssues: ['Supercharger service', 'Electronic gremlins', 'Rear diff service'],
    yearsToAvoid: null,
    recommendedYearsNote: '2016+ has improved infotainment. Coupe is stiffer than convertible.',
    ownershipCostNotes: 'British luxury car costs. Find a good independent Jaguar specialist.'
  },
  'c7-corvette-grand-sport': {
    brand: 'Chevrolet',
    manualAvailable: true,
    seats: 2,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 18,
    commonIssues: ['LT1 very reliable', 'Magnetic ride service', '8-speed auto valve body'],
    yearsToAvoid: null,
    recommendedYearsNote: '2017+ only. All Grand Sports are great. Manual + Z07 best track spec.',
    ownershipCostNotes: 'Corvette = best value performance. Parts and service very affordable.'
  },
  'c7-corvette-z06': {
    brand: 'Chevrolet',
    manualAvailable: true,
    seats: 2,
    dailyUsabilityTag: 'Weekend warrior',
    fuelEconomyCombined: 15,
    commonIssues: ['Supercharger cooling (track)', 'Heat soak', 'A8 trans temp concerns'],
    yearsToAvoid: null,
    recommendedYearsNote: 'Manual + Z07 is track monster. Be careful with heat management.',
    ownershipCostNotes: 'Supercharged but still Corvette pricing. Track use increases costs.'
  },
  'camaro-zl1': {
    brand: 'Chevrolet',
    manualAvailable: true,
    seats: 4,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 14,
    commonIssues: ['Magnetic ride service', '10-speed auto updates', 'Visibility limited'],
    yearsToAvoid: null,
    recommendedYearsNote: '1LE package for track. Manual or 10-speed both good. 2019+ has minor updates.',
    ownershipCostNotes: 'GM LT4 supercharged but reasonable ownership costs. Tires expensive.'
  },
  'bmw-m2-competition': {
    brand: 'BMW',
    manualAvailable: true,
    seats: 4,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 20,
    commonIssues: ['Crank hub concern on tune', 'Cooling system maintenance', 'Rear subframe mounts'],
    yearsToAvoid: null,
    recommendedYearsNote: 'Competition (2019+) has S55 engine. Manual adds engagement.',
    ownershipCostNotes: 'BMW M car costs. Out of warranty can add up. Strong aftermarket support.'
  },
  'alfa-romeo-4c': {
    brand: 'Alfa Romeo',
    manualAvailable: false,
    seats: 2,
    dailyUsabilityTag: 'Weekend warrior',
    fuelEconomyCombined: 28,
    commonIssues: ['Electronic gremlins', 'Suspension bushings', 'TCT transmission'],
    yearsToAvoid: null,
    recommendedYearsNote: 'Spider is more dramatic. Coupe is stiffer. All years similar.',
    ownershipCostNotes: 'Parts availability improving. Light weight means less wear on consumables.'
  },
  'aston-martin-v8-vantage': {
    brand: 'Aston Martin',
    manualAvailable: true,
    seats: 2,
    dailyUsabilityTag: 'Weekend warrior',
    fuelEconomyCombined: 14,
    commonIssues: ['Clutch hydraulics', 'Coil packs', 'Sportshift expensive'],
    yearsToAvoid: null,
    recommendedYearsNote: '2009+ has improved electronics. N430 and GT8 are special editions.',
    ownershipCostNotes: 'Ford-based V8 more reliable than DB9. Still expensive to maintain.'
  },
  'lotus-evora-s': {
    brand: 'Lotus',
    manualAvailable: true,
    seats: 4,
    dailyUsabilityTag: 'Weekend warrior',
    fuelEconomyCombined: 20,
    commonIssues: ['Toyota V6 bulletproof', 'A/C weak', 'Chassis maintenance'],
    yearsToAvoid: null,
    recommendedYearsNote: 'IPS auto is decent. Manual more engaging. 2+2 has token rear seats.',
    ownershipCostNotes: 'Toyota drivetrain = reliability. Lotus bits need specialist knowledge.'
  },
  'lexus-lc500': {
    brand: 'Lexus',
    manualAvailable: false,
    seats: 4,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 19,
    commonIssues: ['Remarkably few', 'Standard Lexus reliability', 'Large coupe visibility'],
    yearsToAvoid: null,
    recommendedYearsNote: 'All years excellent. V8 over hybrid for emotion. Sport+ package adds value.',
    ownershipCostNotes: 'Lexus reliability in a GT. Most affordable exotic-level ownership experience.'
  },
  '987-cayman-s': {
    brand: 'Porsche',
    manualAvailable: true,
    seats: 2,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 22,
    commonIssues: ['IMS bearing (early 987.1)', 'RMS', 'Bore scoring rare'],
    yearsToAvoid: '2006 first year IMS risk',
    recommendedYearsNote: '2009+ (987.2) has DFI engine - no IMS. Most reliable choice.',
    ownershipCostNotes: 'Early Caymans can be scary. 987.2 is solid. Budget for IMS on 987.1.'
  },
  'jaguar-f-type-v6s': {
    brand: 'Jaguar',
    manualAvailable: true,
    seats: 2,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 20,
    commonIssues: ['Supercharger maintenance', 'ZF 8-speed reliable', 'Electronic glitches'],
    yearsToAvoid: null,
    recommendedYearsNote: 'Manual V6 S is sweet spot. 2016+ has better electronics.',
    ownershipCostNotes: 'Less expensive than V8 to run. Supercharger service at intervals.'
  },
  'lexus-rc-f': {
    brand: 'Lexus',
    manualAvailable: false,
    seats: 4,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 17,
    commonIssues: ['Carbon buildup (direct injection)', 'Heavy for class', 'Very reliable'],
    yearsToAvoid: null,
    recommendedYearsNote: 'Track Edition (2020+) is best spec. All years solid.',
    ownershipCostNotes: 'Lexus reliability + dealer network. Best running costs in class.'
  },
  'nissan-370z-nismo': {
    brand: 'Nissan',
    manualAvailable: true,
    seats: 2,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 19,
    commonIssues: ['Oil gallery gasket (early)', 'Synchro wear', 'Clutch slave cylinder'],
    yearsToAvoid: '2009-2010 oil gallery',
    recommendedYearsNote: '2013+ NISMO or 2018+ Heritage Edition. Manual is the way.',
    ownershipCostNotes: 'Nissan VQ engine is robust. Strong aftermarket. Affordable ownership.'
  },
  'mercedes-c63-amg-w204': {
    brand: 'Mercedes',
    manualAvailable: false,
    seats: 4,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 15,
    commonIssues: ['Head bolt stretch', 'Cam adjuster', 'MCT service'],
    yearsToAvoid: null,
    recommendedYearsNote: '2012+ has revised head bolts. Black Series is ultimate. Coupe and sedan both good.',
    ownershipCostNotes: 'M156 V8 needs attention. Factor in proper maintenance budget.'
  },
  'bmw-m4-f82': {
    brand: 'BMW',
    manualAvailable: true,
    seats: 4,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 19,
    commonIssues: ['Crank hub on tunes', 'Charge pipe', 'Cooling system'],
    yearsToAvoid: null,
    recommendedYearsNote: 'Competition (2016+) has improved power. CS is limited and special.',
    ownershipCostNotes: 'BMW M car costs apply. Strong aftermarket. Crank hub fix if modding.'
  },
  'mustang-gt-pp2': {
    brand: 'Ford',
    manualAvailable: true,
    seats: 4,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 18,
    commonIssues: ['MT82 transmission (pre-2024)', 'IRS rubber bushings', 'Heat soak'],
    yearsToAvoid: null,
    recommendedYearsNote: 'PP2 has MagneRide and best handling. 2018+ has improved everything.',
    ownershipCostNotes: 'Ford parts and service pricing. Very affordable performance ownership.'
  },
  'camaro-ss-1le': {
    brand: 'Chevrolet',
    manualAvailable: true,
    seats: 4,
    dailyUsabilityTag: 'Weekend warrior',
    fuelEconomyCombined: 17,
    commonIssues: ['Magnetic ride service', 'LT1 very reliable', 'Visibility challenges'],
    yearsToAvoid: null,
    recommendedYearsNote: '1LE is track-focused. 2019+ has minor updates. Manual preferred.',
    ownershipCostNotes: 'GM pricing makes this a bargain track car. Tires are main consumable.'
  },
  'toyota-gr-supra': {
    brand: 'Toyota',
    manualAvailable: true,
    seats: 2,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 25,
    commonIssues: ['BMW B58 very reliable', 'Software updates', 'ZF 8-speed bulletproof'],
    yearsToAvoid: null,
    recommendedYearsNote: '2021+ has more power. 2023+ has manual option. 3.0 over 2.0.',
    ownershipCostNotes: 'BMW drivetrain with Toyota badge. Strong aftermarket. Reasonable costs.'
  },
  'maserati-granturismo': {
    brand: 'Maserati',
    manualAvailable: false,
    seats: 4,
    dailyUsabilityTag: 'Dailyable',
    fuelEconomyCombined: 14,
    commonIssues: ['Clutch actuator (MC)', 'Variator system', 'Electronics'],
    yearsToAvoid: null,
    recommendedYearsNote: 'Sport or MC for performance. Later years have updated electronics.',
    ownershipCostNotes: 'Ferrari-derived V8 means Ferrari service costs. Beautiful but expensive.'
  }
};

// Output the data for verification
console.log('Brand Data:', JSON.stringify(brandData, null, 2));
console.log('\nCar Ownership Data:', JSON.stringify(carOwnershipData, null, 2));
console.log('\nTotal cars with data:', Object.keys(carOwnershipData).length);


