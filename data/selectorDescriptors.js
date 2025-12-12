/**
 * Selector Descriptors
 * 
 * Descriptive text and guidance for each preference slider in the Car Selector.
 * Helps users understand what each priority means and how it affects results.
 * 
 * @module data/selectorDescriptors
 */

/**
 * Priority descriptors - explains what each preference slider controls
 * and provides guidance at different slider positions
 */
export const priorityDescriptors = {
  sound: {
    label: 'Sound',
    shortDescription: 'How important is exhaust note and engine sound?',
    fullDescription: 'Emphasizes cars known for their exhaust note, engine character, and overall auditory experience.',
    levels: {
      0: "You don't care about engine sound - focus elsewhere",
      0.5: "Sound is nice but won't make or break it",
      1: "You appreciate a good exhaust note",
      1.5: "You want a car that sounds good when you step on it",
      2: "An intoxicating exhaust note is part of the experience",
      2.5: "You want goosebumps every time you rev it",
      3: "You want the loudest, most visceral engine sound possible",
    },
    tips: [
      "V8s and flat-6s typically score highest for sound",
      "Consider aftermarket exhaust options for any car",
      "Track days often allow louder exhausts than street driving",
    ],
    examples: {
      high: ['Ford Mustang GT', 'Porsche 911 GT3', 'Lexus RC F'],
      low: ['Tesla Model 3', 'Porsche Taycan'],
    },
  },

  track: {
    label: 'Track Capability',
    shortDescription: 'How important is raw track performance?',
    fullDescription: 'Prioritizes lap times, handling balance, brake performance, and cooling capacity for sustained driving.',
    levels: {
      0: "You won't track this car - street/canyon only",
      0.5: "Maybe one track day a year, not a priority",
      1: "Occasional track use is on your radar",
      1.5: "You plan to do regular track days",
      2: "Track capability is a key factor in your decision",
      2.5: "You want a serious track weapon that can handle abuse",
      3: "Track performance is your #1 priority - lap times matter",
    },
    tips: [
      "Consider cooling upgrades for regular track use",
      "Track cars often have stiffer suspension = less comfort",
      "Brake pad compound matters more than rotor size",
    ],
    examples: {
      high: ['Porsche 718 Cayman GT4', 'Chevrolet Corvette Z06', 'BMW M2 CS'],
      low: ['Ford Mustang EcoBoost', 'Mazda MX-5 Miata'],
    },
  },

  value: {
    label: 'Value',
    shortDescription: 'How important is price-to-performance ratio?',
    fullDescription: 'Weighs performance capabilities against purchase price, maintenance costs, and depreciation.',
    levels: {
      0: "Budget isn't a concern - you'll pay for the best",
      0.5: "You want quality even if it costs more",
      1: "You want a fair deal, balanced approach",
      1.5: "You're cost-conscious and want good value",
      2: "Value matters - you want more car for your money",
      2.5: "You're hunting for the best bang for buck",
      3: "Maximum smiles per dollar - you want the value king",
    },
    tips: [
      "American muscle often offers best HP per dollar",
      "Factor in insurance and fuel costs",
      "Some cars depreciate less than others",
    ],
    examples: {
      high: ['Chevrolet Camaro SS', 'Ford Mustang GT', 'Subaru WRX'],
      low: ['Porsche 911 Turbo S', 'BMW M5'],
    },
  },

  reliability: {
    label: 'Reliability',
    shortDescription: 'How important is dependability?',
    fullDescription: 'Considers expected maintenance costs, known issues, parts availability, and long-term ownership experience.',
    levels: {
      0: "You'll accept maintenance costs for character",
      0.5: "Some wrench time is okay with you",
      1: "Average reliability works for you",
      1.5: "You'd prefer fewer trips to the mechanic",
      2: "Reliability matters - you need to trust your car",
      2.5: "You want bulletproof engineering, minimal issues",
      3: "Maximum dependability - it needs to start every time",
    },
    tips: [
      "Japanese cars often lead in reliability",
      "Consider certified pre-owned for warranty coverage",
      "Some 'unreliable' cars are fine with preventive maintenance",
    ],
    examples: {
      high: ['Toyota Supra', 'Mazda MX-5', 'Lexus RC F'],
      low: ['Alfa Romeo Giulia', 'Maserati GranTurismo'],
    },
  },

  driverFun: {
    label: 'Driver Engagement',
    shortDescription: 'How important is driving feel and engagement?',
    fullDescription: 'Emphasizes steering feel, chassis balance, manual transmission availability, and overall driving enjoyment regardless of speed.',
    levels: {
      0: "You prefer comfort over raw engagement",
      0.5: "Good steering feel is nice but not critical",
      1: "You enjoy feeling connected to the car",
      1.5: "You want a car that talks back to you",
      2: "Driver engagement is essential - you want to feel everything",
      2.5: "Pure driving feel matters more than straight-line speed",
      3: "Maximum analog experience - man and machine as one",
    },
    tips: [
      "Smaller, lighter cars often feel more engaging",
      "Manual transmissions typically score higher",
      "Hydraulic steering > electric power steering",
    ],
    examples: {
      high: ['Mazda MX-5', 'Porsche Cayman', 'Lotus Elise'],
      low: ['Mercedes-AMG GT', 'Nissan GT-R'],
    },
  },

  aftermarket: {
    label: 'Aftermarket Support',
    shortDescription: 'How important is modification potential?',
    fullDescription: 'Considers parts availability, tuning support, community knowledge, and overall moddability of the platform.',
    levels: {
      0: "You're keeping it bone stock",
      0.5: "Maybe some cosmetic touches, nothing major",
      1: "Light mods are possible down the road",
      1.5: "You'll likely do some performance upgrades",
      2: "Good aftermarket support matters to you",
      2.5: "You want tons of tuning options available",
      3: "You're building a project car - full mod potential needed",
    },
    tips: [
      "Popular platforms have more aftermarket options",
      "American and Japanese cars often lead in aftermarket",
      "Consider turbo cars for easier power gains",
    ],
    examples: {
      high: ['Subaru WRX STI', 'Ford Mustang GT', 'Nissan 370Z'],
      low: ['McLaren 570S', 'Ferrari 488'],
    },
  },

  interior: {
    label: 'Interior Quality',
    shortDescription: 'How important are interior materials and comfort?',
    fullDescription: 'Weighs material quality, ergonomics, technology features, and overall cabin experience.',
    levels: {
      0: "Function over form - you don't care about luxury",
      0.5: "Decent interior is nice but not essential",
      1: "Good enough quality for your needs",
      1.5: "You'd appreciate nicer materials and comfort",
      2: "Interior quality matters - you spend time here",
      2.5: "Premium materials and tech are expected",
      3: "Luxury-level interior is a must - no cheap plastics",
    },
    tips: [
      "German cars typically excel in interior quality",
      "Consider wear and tear on sport seats",
      "Technology can make or break daily usability",
    ],
    examples: {
      high: ['BMW M4', 'Mercedes-AMG C63', 'Audi RS5'],
      low: ['Subaru BRZ', 'Ford Mustang Shelby GT350'],
    },
  },
};

/**
 * Get descriptor text for a specific weight value
 * @param {string} key - Priority key (e.g., 'sound', 'track')
 * @param {number} value - Current slider value (0-3)
 * @returns {string} - Descriptor text for this value
 */
export function getDescriptorForValue(key, value) {
  const descriptor = priorityDescriptors[key];
  if (!descriptor) return '';

  // Find the closest matching level
  const levels = Object.keys(descriptor.levels)
    .map(Number)
    .sort((a, b) => a - b);
  
  const closestLevel = levels.reduce((prev, curr) => 
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );

  return descriptor.levels[closestLevel];
}

/**
 * Get all descriptor data for a priority
 * @param {string} key - Priority key
 * @returns {Object|null}
 */
export function getDescriptor(key) {
  return priorityDescriptors[key] || null;
}

/**
 * Priority badge labels based on weight
 * @param {number} weight - Slider value (0-3)
 * @returns {string}
 */
export function getPriorityBadgeLabel(weight) {
  if (weight === 0) return 'Off';
  if (weight <= 0.5) return 'Low';
  if (weight <= 1) return 'Medium';
  if (weight <= 1.5) return 'High';
  if (weight <= 2) return 'Very High';
  if (weight <= 2.5) return 'Critical';
  return 'Maximum';
}

export default priorityDescriptors;
