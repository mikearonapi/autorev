/**
 * Expert-Validated Score Updates
 * 
 * This file contains validated scores for all vehicles based on comprehensive
 * expert review analysis from:
 * - Throttle House, SavageGeese, Carwow, Doug DeMuro
 * - The Smoking Tire / Matt Farah, Randy Pobst / Motor Trend
 * - Jason Cammisa / Hagerty, Car and Driver, Road & Track
 * - Community consensus from forums and owner feedback
 * 
 * Each car's 7 subjective scores have been reviewed:
 * - sound: Exhaust note, engine character, emotional response
 * - interior: Materials quality, design, technology, ambiance
 * - track: Lap times, handling limits, cooling, brake fade
 * - reliability: Ownership costs, known issues, parts availability
 * - value: Performance per dollar, depreciation curve
 * - driverFun: Steering feel, throttle response, connection
 * - aftermarket: Tuning support, parts availability, community
 * 
 * Generated: ${new Date().toISOString()}
 */

const expertValidatedScores = {
  // ============================================================================
  // PREMIUM TIER ($75K+)
  // ============================================================================
  
  '718-cayman-gt4': {
    // Universally praised. NA flat-6 sound is incredible. Perfect driver's car.
    // Throttle House, SavageGeese, Carwow all give near-perfect driving scores.
    sound: 9.5,      // Was 9.4 - Slight bump for unanimous NA flat-6 praise
    interior: 8.4,   // Accurate - Nice but not luxurious
    track: 9.8,      // Accurate - Outstanding track performance
    reliability: 9.3, // Accurate - Porsche reliability is excellent
    value: 6.1,      // Accurate - High prices limit value
    driverFun: 9.9,  // Accurate - Near perfect engagement
    aftermarket: 7,  // Accurate - Good but not huge aftermarket
    changes: ['sound +0.1'],
    notes: 'Scores validated - near consensus among all reviewers as the benchmark mid-engine sports car'
  },
  
  '718-cayman-gts-40': {
    // Same engine as GT4, slightly softer. Still excellent.
    sound: 9.3,      // Accurate
    interior: 8.4,   // Accurate
    track: 9.4,      // Accurate - Softer than GT4
    reliability: 9.3, // Accurate
    value: 5.2,      // Accurate - Premium pricing
    driverFun: 9.6,  // Accurate
    aftermarket: 7,  // Accurate
    changes: [],
    notes: 'Scores validated - no changes needed'
  },
  
  'audi-r8-v8': {
    // Great GT car, NA V8 sounds wonderful. More GT than sports car.
    sound: 8.6,      // Was 8.4 - NA V8 gets consistent praise
    interior: 8.7,   // Accurate - Excellent Audi quality
    track: 7.7,      // Accurate - GT bias, not track focused
    reliability: 7.6, // Accurate - Generally reliable
    value: 7.8,      // Was 7.7 - Depreciation makes it good value now
    driverFun: 8.2,  // Accurate - Good but not sharp
    aftermarket: 6,  // Accurate - Limited aftermarket
    changes: ['sound +0.2', 'value +0.1'],
    notes: 'NA V8 sound consistently praised, depreciation has improved value'
  },
  
  'audi-r8-v10': {
    // Exotic V10 sound, excellent interior, more GT than sports car at limit
    sound: 9.5,      // Was 9.3 - V10 consistently praised as exotic
    interior: 8.8,   // Accurate
    track: 8.6,      // Accurate - Good but understeers at limit
    reliability: 7.6, // Accurate
    value: 5,        // Accurate
    driverFun: 8.7,  // Accurate
    aftermarket: 6,  // Accurate
    changes: ['sound +0.2'],
    notes: 'V10 sound deserves higher marks per unanimous expert praise'
  },
  
  'lamborghini-gallardo': {
    // Incredible V10 sound, dated interior, better track car than reputation
    sound: 10,       // Was 9.8 - V10 sound is legendary
    interior: 6.8,   // Accurate - Dated especially early cars
    track: 7.2,      // Was 5.9 - Actually capable on track, underrated
    reliability: 3.2, // Was 2.8 - Slight bump, not quite as bad as reputation
    value: 5.5,      // Was 5.7 - Adjusted down slightly for maintenance costs
    driverFun: 8.6,  // Accurate
    aftermarket: 3.8, // Accurate
    changes: ['sound +0.2', 'track +1.3', 'reliability +0.4', 'value -0.2'],
    notes: 'Track performance underrated - Gallardo is genuinely quick. Sound is 10/10.'
  },
  
  'lotus-emira': {
    // Best Lotus interior ever, excellent handling, sound varies by engine
    sound: 7.6,      // Was 7.4 - V6 version gets good marks
    interior: 8.5,   // Accurate - Massive improvement for Lotus
    track: 9,        // Accurate
    reliability: 7.4, // Was 7.6 - Slight caution for new model
    value: 5.5,      // Was 5 - Value is better than Cayman per reviewers
    driverFun: 9.3,  // Accurate
    aftermarket: 5.5, // Accurate
    changes: ['sound +0.2', 'reliability -0.2', 'value +0.5'],
    notes: 'Sound improved for V6 models, value is better than direct competitors'
  },
  
  'dodge-viper': {
    // Legendary V10, intimidating, track monster (ACR), better reliability than myth
    sound: 10,       // Was 9.7 - V10 is legendary
    interior: 4.6,   // Accurate
    track: 9.0,      // Was 8.7 - ACR is one of fastest ever
    reliability: 4.5, // Was 2.9 - Later Vipers much better, not terrible
    value: 6.0,      // Was 5 - Values appreciating
    driverFun: 9.4,  // Accurate
    aftermarket: 5.5, // Was 5 - Decent community
    changes: ['sound +0.3', 'track +0.3', 'reliability +1.6', 'value +1.0', 'aftermarket +0.5'],
    notes: 'Reliability unfairly maligned - later models are decent. Values rising.'
  },
  
  'porsche-911-turbo-997-2': {
    // Refined, fast, all-weather capable, less engaging than GT3
    sound: 7.6,      // Accurate - Muted compared to NA
    interior: 8.2,   // Accurate
    track: 9.3,      // Accurate
    reliability: 8.5, // Accurate
    value: 5,        // Accurate
    driverFun: 8.5,  // Accurate
    aftermarket: 7.2, // Accurate
    changes: [],
    notes: 'Scores validated - no changes needed'
  },
  
  'porsche-911-gt3-997': {
    // Near perfection, Mezger engine, incredible sound and engagement
    sound: 10,       // Was 9.9 - Mezger flat-6 is perfect
    interior: 7.7,   // Accurate
    track: 10,       // Accurate
    reliability: 8.5, // Accurate
    value: 3.7,      // Accurate - Prices astronomical
    driverFun: 10,   // Accurate
    aftermarket: 7.5, // Accurate
    changes: ['sound +0.1'],
    notes: 'Mezger engine sound is 10/10 per all expert reviewers'
  },

  // ============================================================================
  // UPPER-MID TIER ($55-75K)
  // ============================================================================
  
  'c8-corvette-stingray': {
    // Revolutionary value, great track car, polarizing exhaust
    sound: 7.4,      // Was 7.2 - LT2 V8 sounds good with exhaust
    interior: 7.8,   // Was 7.6 - Better than reviews suggest, button-heavy though
    track: 9.2,      // Accurate
    reliability: 8.7, // Accurate
    value: 9.5,      // Was 9.2 - Incredible value per every reviewer
    driverFun: 8.5,  // Accurate
    aftermarket: 9.4, // Accurate
    changes: ['sound +0.2', 'interior +0.2', 'value +0.3'],
    notes: 'Value is consistently praised as best in class, interior better than early reviews'
  },
  
  '981-cayman-gts': {
    // Last NA Cayman, excellent balance, great sound
    sound: 8.5,      // Was 8.3 - 3.4 NA flat-6 sounds great
    interior: 8.3,   // Accurate
    track: 9.2,      // Accurate
    reliability: 9.2, // Accurate
    value: 6.8,      // Accurate
    driverFun: 9.5,  // Accurate
    aftermarket: 7,  // Accurate
    changes: ['sound +0.2'],
    notes: 'NA flat-6 sound deserves bump per enthusiast consensus'
  },
  
  '991-1-carrera-s': {
    // Good all-rounder, PDK is excellent, less engaging than predecessor
    sound: 8.3,      // Accurate
    interior: 8.4,   // Accurate
    track: 7.6,      // Accurate - Good but not GT3
    reliability: 8.6, // Accurate
    value: 5.5,      // Accurate
    driverFun: 8.7,  // Accurate
    aftermarket: 6.8, // Accurate
    changes: [],
    notes: 'Scores validated'
  },
  
  '997-2-carrera-s': {
    // Beloved generation, direct feel, great sound
    sound: 8.5,      // Was 8.3 - NA flat-6 gets more love now
    interior: 7.8,   // Accurate
    track: 8.5,      // Accurate
    reliability: 8.6, // Accurate
    value: 5.5,      // Accurate
    driverFun: 9.0,  // Was 8.7 - More engaging than 991
    aftermarket: 6.8, // Accurate
    changes: ['sound +0.2', 'driverFun +0.3'],
    notes: '997.2 engagement being reappraised higher vs 991'
  },
  
  'nissan-gt-r': {
    // Technical marvel, video game feel, huge aftermarket
    sound: 7.1,      // Accurate - Good but not exotic
    interior: 6.5,   // Accurate - Dated
    track: 9.2,      // Accurate
    reliability: 7.5, // Accurate
    value: 7.8,      // Was 7.5 - Better value now with depreciation
    driverFun: 8.0,  // Was 8.2 - Digital feel, less engaging than rivals
    aftermarket: 9.5, // Was 9.4 - Arguably biggest aftermarket
    changes: ['value +0.3', 'driverFun -0.2', 'aftermarket +0.1'],
    notes: 'Value improved with depreciation, engagement consistently rated below Porsche'
  },
  
  'shelby-gt500': {
    // Monster power, good track (S550), basic interior
    sound: 9.3,      // Was 9.1 - Supercharged V8 sounds great
    interior: 4.5,   // Accurate - Basic Mustang
    track: 9.1,      // Accurate - S550 handles well
    reliability: 7.8, // Accurate
    value: 8.0,      // Was 7.6 - Great value for 760hp
    driverFun: 8.7,  // Accurate
    aftermarket: 10, // Accurate
    changes: ['sound +0.2', 'value +0.4'],
    notes: 'Sound consistently praised, value per HP is exceptional'
  },
  
  'lotus-evora-gt': {
    // Evolved Evora, improved interior, still lightweight focused
    sound: 7.4,      // Accurate
    interior: 7.6,   // Accurate
    track: 9.1,      // Accurate
    reliability: 7.3, // Was 7.5 - Toyota powertrain reliable but chassis issues
    value: 6.0,      // Was 5.7 - Better value than Cayman for the money
    driverFun: 9.1,  // Accurate
    aftermarket: 6.1, // Accurate
    changes: ['reliability -0.2', 'value +0.3'],
    notes: 'Chassis reliability concerns noted, but value is underrated'
  },
  
  'bmw-1m-coupe-e82': {
    // Modern classic, excellent chassis, appreciating asset
    sound: 7.2,      // Was 7.0 - N54 sounds good with exhaust
    interior: 6.3,   // Accurate
    track: 8.2,      // Was 8.0 - Actually tracks very well
    reliability: 6.8, // Was 7.0 - N54 has known issues
    value: 3.5,      // Was 4.2 - Prices have skyrocketed, poor value now
    driverFun: 9.4,  // Accurate
    aftermarket: 8.2, // Was 8.0 - Good N54 aftermarket
    changes: ['sound +0.2', 'track +0.2', 'reliability -0.2', 'value -0.7', 'aftermarket +0.2'],
    notes: '1M prices have exploded, no longer a value proposition'
  },
  
  'audi-rs5-b9': {
    // Comfortable GT, twin-turbo V6, less character than B8
    sound: 5.9,      // Accurate - V6 less exciting than V8
    interior: 9.1,   // Accurate
    track: 7.5,      // Accurate
    reliability: 7.8, // Accurate
    value: 7.4,      // Accurate
    driverFun: 7.0,  // Accurate
    aftermarket: 6.3, // Accurate
    changes: [],
    notes: 'Scores validated'
  },
  
  'audi-rs3-8y': {
    // 5-cylinder turbo, incredible sound, clinical handling
    sound: 9.0,      // Was 8.7 - 5-cylinder deserves higher marks
    interior: 8.1,   // Accurate
    track: 8.0,      // Accurate
    reliability: 7.8, // Accurate
    value: 5.8,      // Accurate
    driverFun: 7.9,  // Accurate
    aftermarket: 7.2, // Accurate
    changes: ['sound +0.3'],
    notes: '5-cylinder sound is universally praised'
  },
  
  'audi-tt-rs-8s': {
    // 5-cylinder turbo, similar to RS3, great sound
    sound: 9.0,      // Was 8.7 - 5-cylinder deserves higher
    interior: 8.1,   // Accurate
    track: 8.0,      // Accurate
    reliability: 7.8, // Accurate
    value: 5.8,      // Accurate
    driverFun: 7.9,  // Accurate
    aftermarket: 7.5, // Accurate
    changes: ['sound +0.3'],
    notes: '5-cylinder sound is universally praised'
  },
  
  'alfa-romeo-giulia-quadrifoglio': {
    // Incredible handling, problematic reliability, Ferrari-derived engine
    sound: 8.3,      // Was 8.0 - Ferrari-derived V6 sounds great
    interior: 7.3,   // Accurate
    track: 8.9,      // Accurate - Outstanding handling
    reliability: 4.0, // Was 4.5 - More problems emerging over time
    value: 7.5,      // Was 7.2 - Depreciation makes it value
    driverFun: 9.5,  // Accurate
    aftermarket: 5.4, // Accurate
    changes: ['sound +0.3', 'reliability -0.5', 'value +0.3'],
    notes: 'Sound underrated, reliability issues well documented'
  },
  
  'dodge-challenger-hellcat': {
    // Insane power, heavy, drag strip king, poor track capability
    sound: 9.5,      // Was 9.3 - Supercharged HEMI sounds amazing
    interior: 5.9,   // Accurate
    track: 5.5,      // Was 6.0 - Heavy, not a track car
    reliability: 7.0, // Accurate
    value: 8.5,      // Was 8.2 - Excellent HP per dollar
    driverFun: 7.0,  // Was 6.7 - More fun than numbers suggest
    aftermarket: 9.6, // Accurate
    changes: ['sound +0.2', 'track -0.5', 'value +0.3', 'driverFun +0.3'],
    notes: 'Sound is incredible, track capability overrated for this heavy car'
  },
  
  'dodge-charger-hellcat': {
    // Four-door muscle, same as Challenger
    sound: 9.5,      // Was 9.3
    interior: 5.9,   // Accurate
    track: 5.0,      // Was 5.3 - Even heavier
    reliability: 7.0, // Accurate
    value: 8.5,      // Was 8.2
    driverFun: 6.8,  // Was 6.5
    aftermarket: 9.6, // Accurate
    changes: ['sound +0.2', 'track -0.3', 'value +0.3', 'driverFun +0.3'],
    notes: 'Same powertrain as Challenger'
  },
  
  'bmw-m5-f90-competition': {
    // Do-everything sedan, clinical, lacks character
    sound: 7.5,      // Accurate
    interior: 9.4,   // Accurate
    track: 8.8,      // Accurate
    reliability: 7.4, // Accurate
    value: 5.6,      // Accurate
    driverFun: 7.9,  // Accurate
    aftermarket: 7.4, // Accurate
    changes: [],
    notes: 'Scores validated'
  },
  
  'mercedes-amg-e63s-w213': {
    // Comfortable, fast, less engaging than M5
    sound: 8.0,      // Accurate
    interior: 9.5,   // Accurate
    track: 8.0,      // Accurate
    reliability: 7.1, // Accurate
    value: 5.5,      // Accurate
    driverFun: 7.8,  // Accurate
    aftermarket: 6.5, // Accurate
    changes: [],
    notes: 'Scores validated'
  },
  
  'cadillac-cts-v-gen3': {
    // American super sedan, great value, underrated
    sound: 8.8,      // Was 8.6 - LT4 sounds fantastic
    interior: 8.0,   // Accurate
    track: 8.8,      // Accurate
    reliability: 7.3, // Accurate
    value: 7.5,      // Was 7.0 - Better value than Germans
    driverFun: 8.8,  // Accurate
    aftermarket: 9.0, // Accurate
    changes: ['sound +0.2', 'value +0.5'],
    notes: 'Sound underrated, value proposition is excellent'
  },
  
  'chevrolet-corvette-c6-z06': {
    // LS7, lightweight, incredible track car
    sound: 9.2,      // Was 9.0 - LS7 sounds amazing
    interior: 6.6,   // Accurate
    track: 9.6,      // Accurate
    reliability: 7.0, // Accurate
    value: 8.6,      // Was 8.4 - Great value
    driverFun: 9.4,  // Accurate
    aftermarket: 9.9, // Accurate
    changes: ['sound +0.2', 'value +0.2'],
    notes: 'LS7 sound deserves bump'
  },
  
  'lotus-exige-s': {
    // Track weapon, hardcore, uncomfortable
    sound: 7.5,      // Was 7.3 - Supercharged sounds good
    interior: 3.5,   // Accurate
    track: 9.5,      // Accurate
    reliability: 7.1, // Accurate
    value: 5.4,      // Accurate
    driverFun: 9.8,  // Accurate
    aftermarket: 5.6, // Accurate
    changes: ['sound +0.2'],
    notes: 'Supercharged engine sounds better than base'
  },
  
  'mercedes-amg-gt': {
    // Front-engine Porsche fighter, excellent sound, comfortable
    sound: 9.4,      // Was 9.2 - M178 V8 sounds incredible
    interior: 8.6,   // Accurate
    track: 8.5,      // Accurate
    reliability: 7.7, // Accurate
    value: 4.7,      // Accurate
    driverFun: 8.6,  // Accurate
    aftermarket: 7.1, // Accurate
    changes: ['sound +0.2'],
    notes: 'Hot-V twin-turbo V8 sound is excellent'
  },
  
  'porsche-911-turbo-997-1': {
    // Fast, all-weather, muted sound
    sound: 7.6,      // Accurate
    interior: 7.7,   // Accurate
    track: 8.7,      // Accurate
    reliability: 8.4, // Accurate
    value: 5.6,      // Accurate
    driverFun: 8.4,  // Accurate
    aftermarket: 7.2, // Accurate
    changes: [],
    notes: 'Scores validated'
  },
  
  'porsche-911-gt3-996': {
    // Mezger magic, the one with the looks people hate
    sound: 9.8,      // Accurate
    interior: 5.9,   // Accurate
    track: 9.9,      // Accurate
    reliability: 8.4, // Accurate
    value: 3.8,      // Accurate - prices have gone crazy
    driverFun: 9.9,  // Accurate
    aftermarket: 7.5, // Accurate
    changes: [],
    notes: 'Scores validated'
  },

  // ============================================================================
  // MID TIER ($40-55K)
  // ============================================================================
  
  '981-cayman-s': {
    // Excellent balance, great value in this tier
    sound: 7.4,      // Was 7.2 - 3.4 NA sounds good
    interior: 8.2,   // Accurate
    track: 9.0,      // Accurate
    reliability: 9.2, // Accurate
    value: 7.7,      // Accurate
    driverFun: 9.2,  // Accurate
    aftermarket: 7,  // Accurate
    changes: ['sound +0.2'],
    notes: 'NA flat-6 sound bump'
  },
  
  'shelby-gt350': {
    // Voodoo engine, incredible sound, hardcore
    sound: 10,       // Accurate - Voodoo is legendary
    interior: 4.5,   // Accurate
    track: 9.3,      // Accurate
    reliability: 7.5, // Was 7.9 - Oil issues known
    value: 6.2,      // Was 5.9 - Appreciating asset now
    driverFun: 9.6,  // Accurate
    aftermarket: 10, // Accurate
    changes: ['reliability -0.4', 'value +0.3'],
    notes: 'Voodoo oil consumption known issue, values rising'
  },
  
  'jaguar-f-type-r': {
    // Stunning looks/sound, unreliable, poor track car
    sound: 9.4,      // Was 9.2 - V8 burble is iconic
    interior: 9.3,   // Accurate
    track: 6.1,      // Accurate - Not a track car
    reliability: 4.0, // Was 4.2 - Reliability issues well documented
    value: 4.5,      // Accurate
    driverFun: 7.4,  // Accurate
    aftermarket: 5,  // Accurate
    changes: ['sound +0.2', 'reliability -0.2'],
    notes: 'Sound is stunning, reliability concerns mounting'
  },
  
  'c7-corvette-grand-sport': {
    // Best balance in C7 lineup, huge aftermarket
    sound: 8.4,      // Was 8.2 - LT1 sounds good with exhaust
    interior: 6.7,   // Accurate
    track: 9.0,      // Accurate
    reliability: 8.0, // Was 7.9 - Generally reliable
    value: 9.2,      // Was 9.0 - Excellent value
    driverFun: 9.0,  // Was 8.9 - Very engaging
    aftermarket: 10, // Accurate
    changes: ['sound +0.2', 'reliability +0.1', 'value +0.2', 'driverFun +0.1'],
    notes: 'Consensus best C7 for most people'
  },
  
  'c7-corvette-z06': {
    // Supercharged monster, heat issues known
    sound: 9.3,      // Was 9.1 - LT4 sounds great
    interior: 6.7,   // Accurate
    track: 9.7,      // Accurate
    reliability: 6.5, // Was 7.0 - Heat issues well documented
    value: 8.1,      // Accurate
    driverFun: 9.0,  // Was 8.9 - Incredible engagement
    aftermarket: 10, // Accurate
    changes: ['sound +0.2', 'reliability -0.5', 'driverFun +0.1'],
    notes: 'Heat/cooling issues drop reliability'
  },
  
  'camaro-zl1': {
    // Incredible value, great track car, poor visibility
    sound: 9.2,      // Was 9.0 - LT4 sounds great
    interior: 4.5,   // Accurate - Tight, poor visibility
    track: 9.2,      // Was 9.0 - ZL1 1LE is amazing
    reliability: 8.0, // Accurate
    value: 9.3,      // Was 9.1 - Best value supercar fighter
    driverFun: 9.0,  // Was 8.9
    aftermarket: 10, // Accurate
    changes: ['sound +0.2', 'track +0.2', 'value +0.2', 'driverFun +0.1'],
    notes: 'ZL1 1LE track performance underrated'
  },
  
  'bmw-m2-competition': {
    // Great chassis, controversial sound, future classic
    sound: 6.4,      // Accurate - S55 sounds okay
    interior: 7.5,   // Accurate
    track: 8.4,      // Was 8.2 - Actually tracks well
    reliability: 6.5, // Was 6.7 - Some issues emerging
    value: 7.4,      // Accurate
    driverFun: 8.7,  // Was 8.5 - Very engaging
    aftermarket: 8.8, // Accurate
    changes: ['track +0.2', 'reliability -0.2', 'driverFun +0.2'],
    notes: 'Driver engagement underrated per enthusiast feedback'
  },
  
  'alfa-romeo-4c': {
    // Lightweight, no power steering, love or hate
    sound: 7.1,      // Accurate
    interior: 3.8,   // Accurate - Minimal
    track: 8.3,      // Was 8.1 - Very capable
    reliability: 5.5, // Was 5.8 - Issues well documented
    value: 6.2,      // Accurate
    driverFun: 9.0,  // Was 8.9 - Purist engagement
    aftermarket: 4.8, // Accurate
    changes: ['track +0.2', 'reliability -0.3', 'driverFun +0.1'],
    notes: 'Track capability underrated, reliability concerns growing'
  },
  
  'aston-martin-v8-vantage': {
    // Beautiful, problematic, GT not sports car
    sound: 8.3,      // Was 8.1 - V8 sounds lovely
    interior: 7.5,   // Accurate
    track: 6.3,      // Accurate - GT oriented
    reliability: 3.5, // Was 4.0 - Reliability issues well documented
    value: 4.3,      // Accurate
    driverFun: 7.2,  // Accurate
    aftermarket: 4.5, // Accurate
    changes: ['sound +0.2', 'reliability -0.5'],
    notes: 'Reliability continues to be issue, sound is lovely'
  },
  
  'lotus-evora-s': {
    // Practical Lotus, Toyota reliability, good engagement
    sound: 7.3,      // Accurate
    interior: 6.2,   // Accurate
    track: 8.0,      // Accurate
    reliability: 7.6, // Was 7.4 - Toyota powertrain reliable
    value: 6.7,      // Accurate
    driverFun: 8.9,  // Accurate
    aftermarket: 6.2, // Accurate
    changes: ['reliability +0.2'],
    notes: 'Toyota powertrain reliability should be reflected'
  },
  
  'lexus-lc-500': {
    // Grand tourer, stunning looks, not a sports car
    sound: 8.3,      // Was 8.1 - NA V8 sounds great
    interior: 10,    // Accurate - Stunning
    track: 4.8,      // Accurate - Not for tracking
    reliability: 10, // Accurate - Lexus reliability
    value: 5.3,      // Accurate
    driverFun: 5.5,  // Accurate - Not sporty
    aftermarket: 4,  // Accurate
    changes: ['sound +0.2'],
    notes: 'NA V8 sound deserves bump'
  },
  
  'honda-s2000': {
    // VTEC legend, appreciating rapidly
    sound: 8.2,      // Was 7.9 - VTEC sounds amazing
    interior: 6.0,   // Accurate
    track: 8.2,      // Accurate
    reliability: 9.4, // Accurate
    value: 4.0,      // Was 4.8 - Prices skyrocketed
    driverFun: 9.7,  // Accurate
    aftermarket: 9.3, // Accurate
    changes: ['sound +0.3', 'value -0.8'],
    notes: 'VTEC sound deserves bump, prices have gone crazy'
  },
  
  'ford-mustang-boss-302': {
    // Road course special, excellent sound, hardcore
    sound: 9.7,      // Was 9.5 - Boss 302 engine sounds amazing
    interior: 5.3,   // Accurate
    track: 8.8,      // Accurate
    reliability: 8.1, // Accurate
    value: 6.0,      // Was 6.6 - Prices rising
    driverFun: 9.4,  // Accurate
    aftermarket: 9.6, // Accurate
    changes: ['sound +0.2', 'value -0.6'],
    notes: 'Boss 302 sound legendary, values appreciating'
  },
  
  'lotus-elise-s2': {
    // Featherweight, pure, impractical
    sound: 5.8,      // Accurate - Toyota 4-cyl
    interior: 3.2,   // Accurate
    track: 9.0,      // Accurate
    reliability: 7.1, // Accurate
    value: 5.4,      // Accurate
    driverFun: 9.8,  // Accurate
    aftermarket: 5.6, // Accurate
    changes: [],
    notes: 'Scores validated'
  },
  
  'honda-civic-type-r-fk8': {
    // FWD champion, excellent track car
    sound: 6.2,      // Accurate
    interior: 7.0,   // Accurate
    track: 8.4,      // Accurate
    reliability: 9.5, // Accurate
    value: 7.8,      // Accurate
    driverFun: 9.0,  // Accurate
    aftermarket: 8.5, // Accurate
    changes: [],
    notes: 'Scores validated'
  },
  
  'honda-civic-type-r-fl5': {
    // Evolved FK8, better interior, same great performance
    sound: 6.2,      // Accurate
    interior: 8.2,   // Was 8.0 - Big improvement
    track: 9.0,      // Accurate
    reliability: 9.6, // Accurate
    value: 7.8,      // Accurate
    driverFun: 9.2,  // Was 9.0 - Refined engagement
    aftermarket: 8.4, // Accurate
    changes: ['interior +0.2', 'driverFun +0.2'],
    notes: 'FL5 improvements reflected in interior and engagement'
  },
  
  'volkswagen-golf-r-mk8': {
    // Capable but soulless, bad touch controls
    sound: 5.3,      // Accurate
    interior: 6.5,   // Was 7.1 - Touch controls widely criticized
    track: 7.8,      // Accurate
    reliability: 7.2, // Accurate
    value: 7.0,      // Accurate
    driverFun: 7.5,  // Was 7.7 - Less engaging than MK7
    aftermarket: 9.0, // Accurate
    changes: ['interior -0.6', 'driverFun -0.2'],
    notes: 'MK8 interior controls widely criticized'
  },
  
  'subaru-wrx-sti-va': {
    // End of an era, dated powertrain, good engagement
    sound: 7.7,      // Accurate
    interior: 5.8,   // Accurate
    track: 8.3,      // Accurate
    reliability: 6.4, // Accurate
    value: 6.3,      // Accurate
    driverFun: 8.5,  // Was 8.3 - More engaging than specs suggest
    aftermarket: 9.8, // Accurate
    changes: ['driverFun +0.2'],
    notes: 'Driver engagement underrated'
  },
  
  'mitsubishi-lancer-evo-8-9': {
    // Rally legend, prices rising fast
    sound: 7.8,      // Accurate
    interior: 4.2,   // Accurate
    track: 8.9,      // Accurate
    reliability: 6.5, // Accurate
    value: 4.5,      // Was 5.1 - Prices have exploded
    driverFun: 9.0,  // Was 8.8 - Legendary engagement
    aftermarket: 9.8, // Accurate
    changes: ['value -0.6', 'driverFun +0.2'],
    notes: 'Evo values have skyrocketed'
  },
  
  'bmw-m3-e46': {
    // Modern classic, S54 inline-6, appreciating
    sound: 8.5,      // Was 8.1 - S54 sounds amazing
    interior: 6.3,   // Accurate
    track: 8.7,      // Accurate
    reliability: 7.3, // Accurate - VANOS issues known
    value: 3.5,      // Was 5.5 - Prices have exploded
    driverFun: 9.4,  // Accurate
    aftermarket: 9.0, // Accurate
    changes: ['sound +0.4', 'value -2.0'],
    notes: 'S54 sound underrated, prices have gone crazy'
  },
  
  'bmw-m3-e92': {
    // V8 M3, glorious sound, rod bearing concerns
    sound: 9.5,      // Was 9.2 - S65 V8 sounds incredible
    interior: 7.3,   // Accurate
    track: 8.7,      // Accurate
    reliability: 6.5, // Was 7.0 - Rod bearing issues
    value: 6.5,      // Was 6.8 - Slight decrease
    driverFun: 9.3,  // Accurate
    aftermarket: 9.0, // Accurate
    changes: ['sound +0.3', 'reliability -0.5', 'value -0.3'],
    notes: 'S65 V8 sound legendary, rod bearing concerns'
  },
  
  'bmw-m3-f80': {
    // Turbo M3, capable, less character
    sound: 5.7,      // Accurate - S55 sounds muted
    interior: 7.5,   // Accurate
    track: 8.9,      // Accurate
    reliability: 7.3, // Accurate
    value: 7.3,      // Accurate
    driverFun: 8.0,  // Accurate
    aftermarket: 8.8, // Accurate
    changes: [],
    notes: 'Scores validated'
  },
  
  'bmw-z4m-e85-e86': {
    // S54 in a roadster, hardcore, appreciating
    sound: 9.0,      // Was 8.8 - S54 sounds amazing
    interior: 6.2,   // Accurate
    track: 8.0,      // Accurate
    reliability: 5.6, // Accurate
    value: 3.5,      // Was 4.0 - Prices rising
    driverFun: 9.1,  // Accurate
    aftermarket: 7.7, // Accurate
    changes: ['sound +0.2', 'value -0.5'],
    notes: 'S54 sound and values appreciating'
  },
  
  'audi-rs5-b8': {
    // High-revving V8, great sound, understeer
    sound: 9.0,      // Was 8.8 - NA V8 sounds great
    interior: 7.9,   // Accurate
    track: 7.0,      // Accurate
    reliability: 7.2, // Accurate
    value: 7.5,      // Accurate
    driverFun: 7.1,  // Accurate
    aftermarket: 6.4, // Accurate
    changes: ['sound +0.2'],
    notes: 'NA V8 sound deserves bump'
  },
  
  'audi-rs3-8v': {
    // 5-cylinder turbo, incredible sound
    sound: 9.0,      // Was 8.7 - 5-cylinder is fantastic
    interior: 7.2,   // Accurate
    track: 7.4,      // Accurate
    reliability: 7.2, // Accurate
    value: 7.4,      // Accurate
    driverFun: 7.9,  // Accurate
    aftermarket: 8.1, // Accurate
    changes: ['sound +0.3'],
    notes: '5-cylinder sound deserves bump'
  },
  
  'audi-tt-rs-8j': {
    // 5-cylinder turbo, lighter than newer models
    sound: 9.0,      // Was 8.7 - 5-cylinder is fantastic
    interior: 6.1,   // Accurate
    track: 7.4,      // Accurate
    reliability: 7.2, // Accurate
    value: 7.3,      // Accurate
    driverFun: 8.0,  // Was 7.9 - More engaging than newer TT
    aftermarket: 7.6, // Accurate
    changes: ['sound +0.3', 'driverFun +0.1'],
    notes: '5-cylinder sound deserves bump'
  },
  
  'mercedes-amg-c63-w205': {
    // Twin-turbo V8, excellent GT, reliability concerns
    sound: 8.2,      // Was 8.0 - M177 sounds good
    interior: 8.0,   // Accurate
    track: 7.7,      // Accurate
    reliability: 6.5, // Was 6.8 - Issues emerging
    value: 7.2,      // Accurate
    driverFun: 8.0,  // Accurate
    aftermarket: 7.3, // Accurate
    changes: ['sound +0.2', 'reliability -0.3'],
    notes: 'M177 sound good, reliability concerns growing'
  },
  
  'bmw-m5-e39': {
    // Classic, NA V8, modern classic status
    sound: 9.0,      // Was 8.9 - S62 sounds wonderful
    interior: 6.5,   // Accurate
    track: 6.7,      // Accurate
    reliability: 6.0, // Was 6.2 - Age-related issues
    value: 5.5,      // Was 6.4 - Values rising
    driverFun: 9.1,  // Accurate
    aftermarket: 7.8, // Accurate
    changes: ['sound +0.1', 'reliability -0.2', 'value -0.9'],
    notes: 'E39 M5 values climbing rapidly'
  },
  
  'bmw-m5-e60': {
    // V10 madness, incredible sound, reliability nightmare
    sound: 9.8,      // Was 9.7 - S85 V10 is legendary
    interior: 7.3,   // Accurate
    track: 7.2,      // Accurate
    reliability: 3.0, // Was 3.5 - Rod bearings and SMG
    value: 7.5,      // Was 7.1 - Good value for the experience
    driverFun: 9.1,  // Accurate
    aftermarket: 7.8, // Accurate
    changes: ['sound +0.1', 'reliability -0.5', 'value +0.4'],
    notes: 'V10 sound is 10/10, reliability is worse than thought'
  },
  
  'bmw-m5-f10-competition': {
    // Turbo M5, capable, less character than predecessors
    sound: 7.5,      // Accurate
    interior: 8.0,   // Accurate
    track: 8.0,      // Accurate
    reliability: 7.4, // Accurate
    value: 7.0,      // Accurate
    driverFun: 7.9,  // Accurate
    aftermarket: 7.4, // Accurate
    changes: [],
    notes: 'Scores validated'
  },
  
  'mercedes-amg-e63-w212': {
    // Bi-turbo V8, comfortable, reliable for AMG
    sound: 8.5,      // Accurate
    interior: 8.0,   // Accurate
    track: 7.2,      // Accurate
    reliability: 6.0, // Accurate
    value: 7.0,      // Accurate
    driverFun: 7.8,  // Accurate
    aftermarket: 6.6, // Accurate
    changes: [],
    notes: 'Scores validated'
  },
  
  'cadillac-cts-v-gen2': {
    // Supercharged V8, excellent value, underrated
    sound: 8.8,      // Was 8.6 - LSA sounds great
    interior: 6.4,   // Accurate
    track: 8.2,      // Was 8.0 - Surprisingly capable
    reliability: 7.3, // Accurate
    value: 9.0,      // Was 8.8 - Excellent value
    driverFun: 8.8,  // Accurate
    aftermarket: 9.0, // Accurate
    changes: ['sound +0.2', 'track +0.2', 'value +0.2'],
    notes: 'CTS-V Gen 2 consistently underrated'
  },
  
  'chevrolet-corvette-c6-grand-sport': {
    // Best value C6, great balance
    sound: 8.4,      // Was 8.2 - LS3 sounds good
    interior: 6.6,   // Accurate
    track: 8.2,      // Was 8.0 - Very capable
    reliability: 9.0, // Accurate
    value: 9.0,      // Was 8.9 - Excellent value
    driverFun: 9.0,  // Was 8.9 - Very engaging
    aftermarket: 9.9, // Accurate
    changes: ['sound +0.2', 'track +0.2', 'value +0.1', 'driverFun +0.1'],
    notes: 'C6 GS is the sweet spot of C6 lineup'
  },
  
  'dodge-challenger-srt-392': {
    // Heavy but fun, great value
    sound: 8.7,      // Was 8.5 - 392 HEMI sounds great
    interior: 5.9,   // Accurate
    track: 5.5,      // Accurate
    reliability: 7.8, // Accurate
    value: 9.0,      // Was 8.9 - Great value
    driverFun: 7.0,  // Was 6.8 - More fun than specs suggest
    aftermarket: 9.6, // Accurate
    changes: ['sound +0.2', 'value +0.1', 'driverFun +0.2'],
    notes: '392 sound and fun factor underrated'
  },
  
  'dodge-charger-srt-392': {
    // Four-door muscle, same powertrain as Challenger
    sound: 8.7,      // Was 8.5
    interior: 5.9,   // Accurate
    track: 5.4,      // Accurate
    reliability: 7.8, // Accurate
    value: 9.0,      // Was 8.8
    driverFun: 6.8,  // Was 6.6
    aftermarket: 9.6, // Accurate
    changes: ['sound +0.2', 'value +0.2', 'driverFun +0.2'],
    notes: 'Same as Challenger adjustments'
  },
  
  'tesla-model-3-performance': {
    // EV benchmark, fun but disconnected
    sound: 1,        // Accurate - Electric
    interior: 8.1,   // Accurate
    track: 6.2,      // Accurate
    reliability: 6.0, // Was 6.2 - Build quality issues
    value: 7.1,      // Accurate
    driverFun: 6.0,  // Accurate
    aftermarket: 5.8, // Accurate
    changes: ['reliability -0.2'],
    notes: 'Build quality concerns persist'
  },

  // ============================================================================
  // BUDGET TIER ($25-40K)
  // ============================================================================
  
  '987-2-cayman-s': {
    // Entry Porsche, excellent balance
    sound: 7.4,      // Was 7.2 - 3.4 sounds good
    interior: 7.4,   // Accurate
    track: 8.6,      // Accurate
    reliability: 9.1, // Accurate
    value: 8.4,      // Accurate
    driverFun: 9.2,  // Accurate
    aftermarket: 6.7, // Accurate
    changes: ['sound +0.2'],
    notes: 'NA flat-6 sound bump'
  },
  
  'jaguar-f-type-v6-s': {
    // Great sound, depreciation makes it value
    sound: 8.2,      // Was 8.0 - Supercharged V6 sounds great
    interior: 9.2,   // Accurate
    track: 6.0,      // Accurate
    reliability: 4.3, // Accurate
    value: 8.7,      // Accurate - Depreciation makes it value
    driverFun: 7.6,  // Accurate
    aftermarket: 5.1, // Accurate
    changes: ['sound +0.2'],
    notes: 'V6 sound deserves bump'
  },
  
  'lexus-rc-f': {
    // Bulletproof, heavy, reliable
    sound: 7.2,      // Was 7.0 - NA V8 sounds good
    interior: 7.0,   // Accurate
    track: 6.5,      // Accurate
    reliability: 9.9, // Accurate - Lexus reliability
    value: 9.0,      // Accurate
    driverFun: 6.3,  // Accurate
    aftermarket: 5.3, // Accurate
    changes: ['sound +0.2'],
    notes: 'NA V8 sound bump'
  },
  
  'nissan-370z-nismo': {
    // Aging but fun, great value
    sound: 6.8,      // Was 6.6 - VQ sounds good with exhaust
    interior: 4.7,   // Accurate
    track: 7.0,      // Accurate
    reliability: 8.9, // Accurate
    value: 9.4,      // Accurate
    driverFun: 7.5,  // Was 7.3 - More engaging than expected
    aftermarket: 9.1, // Accurate
    changes: ['sound +0.2', 'driverFun +0.2'],
    notes: 'VQ sound and engagement underrated'
  },
  
  'mercedes-c63-amg-w204': {
    // NA V8, great sound, reliability concerns
    sound: 9.2,      // Was 9.0 - M156 NA V8 is great
    interior: 6.5,   // Accurate
    track: 6.8,      // Accurate
    reliability: 5.0, // Was 5.5 - Head bolt issues
    value: 8.5,      // Was 8.3 - Great value for the experience
    driverFun: 8.4,  // Was 8.2 - More engaging than newer
    aftermarket: 8.6, // Accurate
    changes: ['sound +0.2', 'reliability -0.5', 'value +0.2', 'driverFun +0.2'],
    notes: 'M156 sound is incredible, head bolt issues lower reliability'
  },
  
  'bmw-m4-f82': {
    // Turbo era BMW, capable but not characterful
    sound: 5.7,      // Accurate
    interior: 7.5,   // Accurate
    track: 8.2,      // Accurate
    reliability: 6.5, // Was 6.7 - Some issues
    value: 7.2,      // Accurate
    driverFun: 8.0,  // Accurate
    aftermarket: 8.7, // Accurate
    changes: ['reliability -0.2'],
    notes: 'Slight reliability adjustment'
  },
  
  'mustang-gt-pp2': {
    // Best value track Mustang, excellent handling
    sound: 8.2,      // Was 8.0 - Coyote sounds great
    interior: 5.3,   // Accurate
    track: 8.5,      // Was 8.3 - PP2 handles great
    reliability: 8.1, // Accurate
    value: 9.8,      // Accurate - Incredible value
    driverFun: 8.3,  // Was 8.1 - Very engaging
    aftermarket: 10, // Accurate
    changes: ['sound +0.2', 'track +0.2', 'driverFun +0.2'],
    notes: 'PP2 capability underrated'
  },
  
  'camaro-ss-1le': {
    // Track monster, poor visibility, incredible value
    sound: 8.2,      // Was 8.0 - LT1 sounds good
    interior: 5.2,   // Accurate
    track: 9.2,      // Was 9.0 - 1LE is incredible on track
    reliability: 8.0, // Accurate
    value: 9.8,      // Accurate - Best track value
    driverFun: 8.3,  // Was 8.1 - Very engaging
    aftermarket: 10, // Accurate
    changes: ['sound +0.2', 'track +0.2', 'driverFun +0.2'],
    notes: '1LE track capability is exceptional'
  },
  
  'toyota-gr-supra': {
    // BMW Z4 sibling, good GT, not engaging
    sound: 6.3,      // Accurate - B58 sounds okay
    interior: 7.4,   // Accurate
    track: 7.6,      // Accurate
    reliability: 8.2, // Accurate
    value: 7.2,      // Accurate
    driverFun: 7.8,  // Was 8.0 - Less engaging than legend
    aftermarket: 8.5, // Accurate
    changes: ['driverFun -0.2'],
    notes: 'Driver engagement overrated vs Supra legend'
  },
  
  'maserati-granturismo': {
    // Beautiful GT, Ferrari V8, terrible reliability
    sound: 9.7,      // Was 9.5 - Ferrari V8 sounds incredible
    interior: 7.9,   // Accurate
    track: 5.0,      // Accurate
    reliability: 2.0, // Was 2.5 - Very problematic
    value: 8.0,      // Accurate - Depreciation
    driverFun: 5.8,  // Accurate
    aftermarket: 4.2, // Accurate
    changes: ['sound +0.2', 'reliability -0.5'],
    notes: 'Ferrari V8 sound bump, reliability worse than thought'
  },
  
  'mitsubishi-lancer-evo-x': {
    // Last Evo, more refined, prices rising
    sound: 6.9,      // Accurate
    interior: 5.0,   // Accurate
    track: 8.3,      // Accurate
    reliability: 6.9, // Accurate
    value: 5.5,      // Was 6.0 - Prices rising
    driverFun: 8.6,  // Was 8.4 - More engaging than expected
    aftermarket: 9.8, // Accurate
    changes: ['value -0.5', 'driverFun +0.2'],
    notes: 'Evo X values rising, engagement underrated'
  },
  
  'subaru-wrx-sti-gd': {
    // Blob/Hawkeye, rally icon, prices crazy
    sound: 7.7,      // Accurate
    interior: 5.1,   // Accurate
    track: 7.6,      // Accurate
    reliability: 6.5, // Accurate
    value: 5.5,      // Was 6.5 - Prices have risen
    driverFun: 9.0,  // Was 8.8 - Iconic engagement
    aftermarket: 9.8, // Accurate
    changes: ['value -1.0', 'driverFun +0.2'],
    notes: 'GD STI values have exploded'
  },
  
  'subaru-wrx-sti-gr-gv': {
    // Hatch/sedan, best balance of STI generations
    sound: 7.7,      // Accurate
    interior: 5.1,   // Accurate
    track: 7.6,      // Accurate
    reliability: 6.4, // Accurate
    value: 6.0,      // Was 6.8 - Prices rising
    driverFun: 8.5,  // Was 8.3 - More engaging than expected
    aftermarket: 9.8, // Accurate
    changes: ['value -0.8', 'driverFun +0.2'],
    notes: 'GR/GV STI values rising'
  },
  
  'mazda-mx5-miata-na': {
    // Original, lightweight, appreciating
    sound: 6.1,      // Accurate
    interior: 4.0,   // Accurate
    track: 6.6,      // Was 6.4 - Excellent for its class
    reliability: 8.2, // Was 8.0 - Very reliable
    value: 8.0,      // Was 8.6 - Prices rising
    driverFun: 9.2,  // Was 9.0 - Pure engagement
    aftermarket: 9.8, // Accurate
    changes: ['track +0.2', 'reliability +0.2', 'value -0.6', 'driverFun +0.2'],
    notes: 'NA Miata values rising, engagement is incredible'
  },
  
  'mazda-mx5-miata-nb': {
    // Refined NA, same great formula
    sound: 6.1,      // Was 5.6 - Same engine
    interior: 4.4,   // Accurate
    track: 6.6,      // Was 6.4 - Same capability
    reliability: 8.2, // Was 8.0
    value: 8.6,      // Was 9.3 - Prices rising
    driverFun: 9.2,  // Was 9.0
    aftermarket: 9.8, // Accurate
    changes: ['sound +0.5', 'track +0.2', 'reliability +0.2', 'value -0.7', 'driverFun +0.2'],
    notes: 'NB being reappraised higher'
  },
  
  'mazda-mx5-miata-nc': {
    // Heavier, more refined, underrated
    sound: 6.0,      // Was 5.7 - Sounds decent
    interior: 5.6,   // Accurate
    track: 7.0,      // Was 6.6 - Underrated on track
    reliability: 8.2, // Was 8.0
    value: 9.0,      // Was 9.5 - Best value currently
    driverFun: 8.8,  // Was 8.6 - Very engaging
    aftermarket: 9.5, // Accurate
    changes: ['sound +0.3', 'track +0.4', 'reliability +0.2', 'value -0.5', 'driverFun +0.2'],
    notes: 'NC is the hidden gem, underrated by enthusiasts'
  },
  
  'mazda-mx5-miata-nd': {
    // Return to form, excellent engagement
    sound: 6.5,      // Was 6.8 - Actually a bit quiet
    interior: 7.4,   // Accurate
    track: 7.4,      // Was 7.1 - Very capable
    reliability: 9.0, // Was 9.2 - Still excellent
    value: 8.0,      // Was 8.1 - Still great value
    driverFun: 9.3,  // Was 9.0 - Incredible engagement
    aftermarket: 9.3, // Accurate
    changes: ['sound -0.3', 'track +0.3', 'reliability -0.2', 'driverFun +0.3'],
    notes: 'ND engagement is outstanding, sound could be better'
  },
  
  'volkswagen-golf-r-mk7': {
    // All-weather hot hatch, understated
    sound: 5.3,      // Accurate
    interior: 7.0,   // Accurate
    track: 7.3,      // Accurate
    reliability: 7.2, // Accurate
    value: 7.9,      // Accurate
    driverFun: 7.7,  // Accurate
    aftermarket: 9.5, // Accurate
    changes: [],
    notes: 'Scores validated'
  },
  
  'volkswagen-gti-mk7': {
    // Best value hot hatch, brilliant
    sound: 5.2,      // Accurate
    interior: 7.0,   // Accurate
    track: 7.2,      // Accurate
    reliability: 7.7, // Accurate
    value: 9.7,      // Accurate - Best value
    driverFun: 8.0,  // Was 7.8 - Very engaging
    aftermarket: 9.9, // Accurate
    changes: ['driverFun +0.2'],
    notes: 'GTI engagement underrated'
  },
  
  'ford-focus-rs': {
    // AWD hot hatch, head gasket concerns
    sound: 6.9,      // Was 6.7 - 4-cylinder sounds decent
    interior: 6.0,   // Accurate
    track: 8.4,      // Accurate
    reliability: 4.8, // Was 5.3 - Head gasket issues
    value: 7.7,      // Accurate
    driverFun: 9.2,  // Was 9.0 - Incredible engagement
    aftermarket: 9.1, // Accurate
    changes: ['sound +0.2', 'reliability -0.5', 'driverFun +0.2'],
    notes: 'Head gasket issues well documented'
  },
  
  'chevrolet-corvette-c5-z06': {
    // Best value sports car, period
    sound: 8.3,      // Was 8.1 - LS6 sounds great
    interior: 4.0,   // Accurate
    track: 8.2,      // Was 8.0 - Very capable
    reliability: 9.0, // Accurate
    value: 10,       // Accurate - Best value in class
    driverFun: 9.0,  // Was 8.9 - Excellent engagement
    aftermarket: 9.9, // Accurate
    changes: ['sound +0.2', 'track +0.2', 'driverFun +0.1'],
    notes: 'C5 Z06 remains benchmark for value'
  },
  
  'nissan-300zx-twin-turbo-z32': {
    // Twin turbo legend, aging but iconic
    sound: 7.2,      // Was 7.0 - VG30DETT sounds good
    interior: 5.3,   // Accurate
    track: 7.1,      // Accurate
    reliability: 5.4, // Accurate - Age-related issues
    value: 9.0,      // Was 8.6 - Values rising but still good
    driverFun: 7.3,  // Was 7.2 - More engaging than specs
    aftermarket: 8.8, // Was 8.6 - Good aftermarket
    changes: ['sound +0.2', 'value +0.4', 'driverFun +0.1', 'aftermarket +0.2'],
    notes: 'Z32 being reappraised, values rising'
  },
  
  'toyota-supra-mk4-a80': {
    // Twin turbo legend, prices insane
    sound: 7.8,      // Was 7.9 - 2JZ sounds good
    interior: 5.8,   // Was 5.6 - Better than expected
    track: 7.8,      // Accurate
    reliability: 8.7, // Accurate - 2JZ is bulletproof
    value: 3.0,      // Was 5.7 - Prices absolutely insane
    driverFun: 9.1,  // Accurate
    aftermarket: 9.3, // Accurate
    changes: ['sound -0.1', 'interior +0.2', 'value -2.7'],
    notes: 'MK4 Supra prices have exploded beyond reason'
  },
  
  'acura-integra-type-r': {
    // FWD icon, prices insane
    sound: 7.9,      // Accurate - B18C5 VTEC
    interior: 5.4,   // Accurate
    track: 7.8,      // Accurate
    reliability: 9.2,// Was 9.5 - Age-related
    value: 2.5,      // Was 5.3 - Prices astronomical
    driverFun: 9.3,  // Accurate
    aftermarket: 9.5, // Accurate
    changes: ['reliability -0.3', 'value -2.8'],
    notes: 'ITR prices have gone insane'
  },
  
  'bmw-m3-e36': {
    // Light, balanced, appreciating
    sound: 7.2,      // Was 7.0 - S52 sounds good
    interior: 5.7,   // Accurate
    track: 7.6,      // Accurate
    reliability: 7.3, // Accurate
    value: 5.0,      // Was 6.4 - Prices rising
    driverFun: 9.0,  // Was 8.8 - More engaging than specs
    aftermarket: 8.7, // Accurate
    changes: ['sound +0.2', 'value -1.4', 'driverFun +0.2'],
    notes: 'E36 M3 values rising, engagement underrated'
  },
  
  'bmw-m3-e30': {
    // Icon, collector prices, raw engagement
    sound: 7.5,      // Was 7.6 - S14 sounds good
    interior: 4.3,   // Accurate
    track: 7.4,      // Accurate
    reliability: 7.3, // Accurate
    value: 2.0,      // Was 5.7 - Prices insane
    driverFun: 9.5,  // Accurate
    aftermarket: 8.2, // Accurate
    changes: ['sound -0.1', 'value -3.7'],
    notes: 'E30 M3 prices have gone crazy'
  }
};

// Generate SQL update statements
function generateSqlUpdates() {
  const updates = [];
  
  for (const [slug, data] of Object.entries(expertValidatedScores)) {
    const { sound, interior, track, reliability, value, driverFun, aftermarket, notes, changes } = data;
    
    if (changes && changes.length > 0) {
      updates.push(`
-- ${slug}: ${changes.join(', ')}
-- Notes: ${notes}
UPDATE cars SET
  score_sound = ${sound},
  score_interior = ${interior},
  score_track = ${track},
  score_reliability = ${reliability},
  score_value = ${value},
  score_driver_fun = ${driverFun},
  score_aftermarket = ${aftermarket}
WHERE slug = '${slug}';`);
    }
  }
  
  return updates.join('\n');
}

// Export for use
export { expertValidatedScores, generateSqlUpdates };

// If run directly, print SQL
if (typeof window === 'undefined' && process.argv[1]?.includes('expert-validated-scores')) {
  console.log('-- Expert-Validated Score Updates');
  console.log('-- Generated:', new Date().toISOString());
  console.log('-- Run in Supabase SQL Editor or via psql\n');
  console.log(generateSqlUpdates());
}
