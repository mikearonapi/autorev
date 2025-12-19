/**
 * AutoRev - Upgrade Tools & Equipment Data
 * 
 * Maps upgrade categories to the tools, equipment, and workspace requirements
 * needed to complete the installation. This helps users understand the full
 * scope of what's needed for their build.
 */

/**
 * Tool categories with icons and descriptions
 */
export const toolCategories = {
  basic: {
    key: 'basic',
    name: 'Basic Hand Tools',
    icon: 'wrench',
    description: 'Standard wrenches, sockets, screwdrivers',
    color: '#3498db',
  },
  lifting: {
    key: 'lifting',
    name: 'Lifting Equipment',
    icon: 'car-jack',
    description: 'Jack, jack stands, or vehicle lift',
    color: '#e74c3c',
  },
  electrical: {
    key: 'electrical',
    name: 'Electrical Tools',
    icon: 'cpu',
    description: 'Multimeter, soldering, wire crimpers',
    color: '#f39c12',
  },
  diagnostic: {
    key: 'diagnostic',
    name: 'Diagnostic Equipment',
    icon: 'laptop',
    description: 'OBD scanner, tuning software, laptop',
    color: '#9b59b6',
  },
  specialized: {
    key: 'specialized',
    name: 'Specialized Tools',
    icon: 'tool',
    description: 'Torque wrenches, spring compressors, etc.',
    color: '#1abc9c',
  },
  fabrication: {
    key: 'fabrication',
    name: 'Fabrication',
    icon: 'hammer',
    description: 'Welding, cutting, metal fabrication',
    color: '#2c3e50',
  },
  fluid: {
    key: 'fluid',
    name: 'Fluid Service',
    icon: 'droplet',
    description: 'Drain pans, fluid transfer pumps, brake bleeder',
    color: '#8e44ad',
  },
  alignment: {
    key: 'alignment',
    name: 'Alignment Equipment',
    icon: 'target',
    description: 'Alignment rack, camber/caster gauges',
    color: '#27ae60',
  },
};

/**
 * Individual tools with details
 */
export const tools = {
  // Basic Hand Tools
  'socket-set-metric': {
    key: 'socket-set-metric',
    name: 'Metric Socket Set',
    category: 'basic',
    description: '8mm-21mm sockets, 3/8" and 1/2" drive',
    essential: true,
  },
  'wrench-set-metric': {
    key: 'wrench-set-metric',
    name: 'Metric Wrench Set',
    category: 'basic',
    description: 'Combination wrenches 8mm-22mm',
    essential: true,
  },
  'screwdriver-set': {
    key: 'screwdriver-set',
    name: 'Screwdriver Set',
    category: 'basic',
    description: 'Phillips, flathead, Torx variety',
    essential: true,
  },
  'pliers-set': {
    key: 'pliers-set',
    name: 'Pliers Set',
    category: 'basic',
    description: 'Needle nose, slip joint, locking pliers',
    essential: true,
  },
  'hex-key-set': {
    key: 'hex-key-set',
    name: 'Allen/Hex Key Set',
    category: 'basic',
    description: 'Metric and SAE hex keys',
    essential: true,
  },
  'breaker-bar': {
    key: 'breaker-bar',
    name: 'Breaker Bar',
    category: 'basic',
    description: 'For stubborn bolts, 1/2" drive recommended',
    essential: false,
  },

  // Lifting Equipment
  'floor-jack': {
    key: 'floor-jack',
    name: 'Floor Jack',
    category: 'lifting',
    description: '2-3 ton low profile floor jack',
    essential: true,
  },
  'jack-stands': {
    key: 'jack-stands',
    name: 'Jack Stands',
    category: 'lifting',
    description: '4 jack stands rated for vehicle weight',
    essential: true,
  },
  'vehicle-lift': {
    key: 'vehicle-lift',
    name: 'Vehicle Lift',
    category: 'lifting',
    description: '2-post or 4-post lift (professional)',
    essential: false,
  },

  // Specialized Tools
  'torque-wrench': {
    key: 'torque-wrench',
    name: 'Torque Wrench',
    category: 'specialized',
    description: '1/2" drive, 20-150 ft-lb range',
    essential: true,
  },
  'torque-wrench-small': {
    key: 'torque-wrench-small',
    name: 'Small Torque Wrench',
    category: 'specialized',
    description: '3/8" or 1/4" drive for precise work',
    essential: false,
  },
  'spring-compressor': {
    key: 'spring-compressor',
    name: 'Spring Compressor',
    category: 'specialized',
    description: 'For coilover/spring installation',
    essential: false,
  },
  'ball-joint-separator': {
    key: 'ball-joint-separator',
    name: 'Ball Joint Separator',
    category: 'specialized',
    description: 'Pickle fork or press-style separator',
    essential: false,
  },
  'tie-rod-puller': {
    key: 'tie-rod-puller',
    name: 'Tie Rod Puller',
    category: 'specialized',
    description: 'For tie rod end removal',
    essential: false,
  },
  'harmonic-balancer-puller': {
    key: 'harmonic-balancer-puller',
    name: 'Harmonic Balancer Puller',
    category: 'specialized',
    description: 'For crank pulley removal',
    essential: false,
  },
  'clutch-alignment-tool': {
    key: 'clutch-alignment-tool',
    name: 'Clutch Alignment Tool',
    category: 'specialized',
    description: 'Vehicle-specific clutch alignment',
    essential: false,
  },
  'piston-ring-compressor': {
    key: 'piston-ring-compressor',
    name: 'Piston Ring Compressor',
    category: 'specialized',
    description: 'For engine builds',
    essential: false,
  },
  'oxygen-sensor-socket': {
    key: 'oxygen-sensor-socket',
    name: 'O2 Sensor Socket',
    category: 'specialized',
    description: '22mm slotted socket',
    essential: false,
  },

  // Diagnostic Tools
  'obd-scanner': {
    key: 'obd-scanner',
    name: 'OBD-II Scanner',
    category: 'diagnostic',
    description: 'Basic code reader minimum, professional scan tool preferred',
    essential: true,
  },
  'laptop': {
    key: 'laptop',
    name: 'Laptop Computer',
    category: 'diagnostic',
    description: 'For ECU tuning and diagnostics',
    essential: false,
  },
  'tuning-cable': {
    key: 'tuning-cable',
    name: 'Tuning Interface Cable',
    category: 'diagnostic',
    description: 'Platform-specific OBD tuning cable',
    essential: false,
  },
  'wideband-o2': {
    key: 'wideband-o2',
    name: 'Wideband O2 Sensor',
    category: 'diagnostic',
    description: 'For AFR monitoring during tuning',
    essential: false,
  },
  'boost-gauge': {
    key: 'boost-gauge',
    name: 'Boost Gauge',
    category: 'diagnostic',
    description: 'For monitoring turbo/supercharger boost',
    essential: false,
  },

  // Electrical Tools
  'multimeter': {
    key: 'multimeter',
    name: 'Digital Multimeter',
    category: 'electrical',
    description: 'For electrical diagnostics',
    essential: true,
  },
  'wire-crimper': {
    key: 'wire-crimper',
    name: 'Wire Crimper/Stripper',
    category: 'electrical',
    description: 'For electrical connections',
    essential: false,
  },
  'soldering-iron': {
    key: 'soldering-iron',
    name: 'Soldering Iron',
    category: 'electrical',
    description: 'For permanent electrical connections',
    essential: false,
  },
  'heat-shrink': {
    key: 'heat-shrink',
    name: 'Heat Shrink & Heat Gun',
    category: 'electrical',
    description: 'For insulating connections',
    essential: false,
  },

  // Fluid Service
  'drain-pan': {
    key: 'drain-pan',
    name: 'Drain Pan',
    category: 'fluid',
    description: 'For collecting fluids during service',
    essential: true,
  },
  'funnel-set': {
    key: 'funnel-set',
    name: 'Funnel Set',
    category: 'fluid',
    description: 'Various sizes for fluid transfer',
    essential: true,
  },
  'brake-bleeder': {
    key: 'brake-bleeder',
    name: 'Brake Bleeder Kit',
    category: 'fluid',
    description: 'One-person or pressure bleeder',
    essential: false,
  },
  'coolant-pressure-tester': {
    key: 'coolant-pressure-tester',
    name: 'Coolant Pressure Tester',
    category: 'fluid',
    description: 'For testing cooling system',
    essential: false,
  },

  // Alignment
  'alignment-rack': {
    key: 'alignment-rack',
    name: 'Alignment Rack',
    category: 'alignment',
    description: 'Professional 4-wheel alignment equipment',
    essential: false,
  },
  'camber-gauge': {
    key: 'camber-gauge',
    name: 'Camber/Caster Gauge',
    category: 'alignment',
    description: 'For DIY alignment checks',
    essential: false,
  },
  'toe-plates': {
    key: 'toe-plates',
    name: 'Toe Plates',
    category: 'alignment',
    description: 'For DIY toe adjustment',
    essential: false,
  },

  // Fabrication
  'welder': {
    key: 'welder',
    name: 'MIG/TIG Welder',
    category: 'fabrication',
    description: 'For exhaust and fabrication work',
    essential: false,
  },
  'angle-grinder': {
    key: 'angle-grinder',
    name: 'Angle Grinder',
    category: 'fabrication',
    description: 'For cutting and grinding',
    essential: false,
  },
  'drill': {
    key: 'drill',
    name: 'Power Drill',
    category: 'fabrication',
    description: 'Cordless or corded with metal bits',
    essential: false,
  },
};

/**
 * Map upgrade categories/types to required tools
 * Each entry lists essential and recommended tools
 */
export const upgradeToolRequirements = {
  // Power & Engine
  'intake': {
    essential: ['socket-set-metric', 'screwdriver-set', 'pliers-set'],
    recommended: ['torque-wrench'],
    difficulty: 'easy',
    timeEstimate: '1-2 hours',
    diyFriendly: true,
    notes: 'Basic bolt-on installation. Some intakes require removing intake tube clips.',
  },
  'cold-air-intake': {
    essential: ['socket-set-metric', 'screwdriver-set', 'pliers-set'],
    recommended: ['torque-wrench'],
    difficulty: 'easy',
    timeEstimate: '1-2 hours',
    diyFriendly: true,
    notes: 'Basic bolt-on installation. Some intakes require removing intake tube clips.',
  },
  'exhaust-catback': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'floor-jack', 'jack-stands', 'breaker-bar'],
    recommended: ['penetrating-oil', 'oxygen-sensor-socket'],
    difficulty: 'moderate',
    timeEstimate: '2-4 hours',
    diyFriendly: true,
    notes: 'Exhaust bolts can be corroded. Use penetrating oil overnight if possible.',
  },
  'headers': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'floor-jack', 'jack-stands', 'torque-wrench', 'oxygen-sensor-socket'],
    recommended: ['breaker-bar', 'welder'],
    difficulty: 'advanced',
    timeEstimate: '6-10 hours',
    diyFriendly: false,
    notes: 'Tight spaces, corroded hardware, may require O2 sensor extension harnesses.',
  },
  'tune-street': {
    essential: ['obd-scanner', 'laptop', 'tuning-cable'],
    recommended: ['wideband-o2', 'boost-gauge'],
    difficulty: 'moderate',
    timeEstimate: '1-2 hours',
    diyFriendly: true,
    notes: 'Flash tune is straightforward. Custom tuning requires dyno time and expertise.',
  },
  'tune-track': {
    essential: ['obd-scanner', 'laptop', 'tuning-cable'],
    recommended: ['wideband-o2', 'boost-gauge'],
    difficulty: 'moderate',
    timeEstimate: '1-2 hours',
    diyFriendly: true,
    notes: 'Flash tune is straightforward. Custom tuning requires dyno time and expertise.',
  },
  'stage1-tune': {
    essential: ['obd-scanner', 'laptop', 'tuning-cable'],
    recommended: ['wideband-o2', 'boost-gauge'],
    difficulty: 'easy',
    timeEstimate: '30 min - 1 hour',
    diyFriendly: true,
    notes: 'Most Stage 1 tunes are flash-based via OBD port.',
  },
  'stage2-tune': {
    essential: ['obd-scanner', 'laptop', 'tuning-cable', 'wideband-o2'],
    recommended: ['boost-gauge'],
    difficulty: 'moderate',
    timeEstimate: '1-2 hours',
    diyFriendly: true,
    notes: 'Requires supporting hardware mods. May need dyno tuning for optimal results.',
  },
  'downpipe': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'floor-jack', 'jack-stands', 'oxygen-sensor-socket'],
    recommended: ['breaker-bar', 'torque-wrench'],
    difficulty: 'advanced',
    timeEstimate: '3-6 hours',
    diyFriendly: false,
    notes: 'Tight access, high-heat hardware. Consider professional install.',
  },

  // Forced Induction
  'supercharger-centrifugal': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'torque-wrench', 'floor-jack', 'jack-stands', 'multimeter', 'obd-scanner', 'laptop'],
    recommended: ['harmonic-balancer-puller', 'wideband-o2'],
    difficulty: 'expert',
    timeEstimate: '12-20 hours',
    diyFriendly: false,
    notes: 'Major installation. Professional install recommended unless highly experienced.',
  },
  'supercharger-roots': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'torque-wrench', 'floor-jack', 'jack-stands', 'multimeter', 'obd-scanner', 'laptop'],
    recommended: ['wideband-o2'],
    difficulty: 'expert',
    timeEstimate: '10-16 hours',
    diyFriendly: false,
    notes: 'Major installation. Professional install recommended.',
  },
  'turbo-kit-single': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'torque-wrench', 'floor-jack', 'jack-stands', 'multimeter', 'obd-scanner', 'laptop', 'welder'],
    recommended: ['wideband-o2', 'boost-gauge'],
    difficulty: 'expert',
    timeEstimate: '20-40 hours',
    diyFriendly: false,
    notes: 'Expert-level installation. Requires fabrication skills and professional tuning.',
  },
  'intercooler': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'pliers-set', 'drain-pan'],
    recommended: ['torque-wrench'],
    difficulty: 'moderate',
    timeEstimate: '3-6 hours',
    diyFriendly: true,
    notes: 'Requires draining coolant on water-to-air systems. Air-to-air is simpler.',
  },

  // Suspension
  'lowering-springs': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'floor-jack', 'jack-stands', 'spring-compressor', 'torque-wrench'],
    recommended: ['ball-joint-separator'],
    difficulty: 'moderate',
    timeEstimate: '4-6 hours',
    diyFriendly: true,
    notes: 'Spring compressors are dangerous if used incorrectly. Consider having shop press springs.',
  },
  'coilovers-street': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'floor-jack', 'jack-stands', 'torque-wrench'],
    recommended: ['spring-compressor', 'ball-joint-separator'],
    difficulty: 'moderate',
    timeEstimate: '4-8 hours',
    diyFriendly: true,
    notes: 'Complete assembly replacement. Easier than spring swap on most vehicles.',
  },
  'coilovers-track': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'floor-jack', 'jack-stands', 'torque-wrench'],
    recommended: ['spring-compressor', 'ball-joint-separator', 'camber-gauge'],
    difficulty: 'moderate',
    timeEstimate: '4-8 hours',
    diyFriendly: true,
    notes: 'Same as street coilovers. Professional alignment essential after install.',
  },
  'sway-bars': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'floor-jack', 'jack-stands', 'torque-wrench'],
    recommended: [],
    difficulty: 'moderate',
    timeEstimate: '2-4 hours',
    diyFriendly: true,
    notes: 'May require removing subframe bolts or exhaust on some vehicles.',
  },

  // Brakes
  'brake-pads-street': {
    essential: ['socket-set-metric', 'floor-jack', 'jack-stands', 'breaker-bar'],
    recommended: ['torque-wrench', 'brake-bleeder'],
    difficulty: 'easy',
    timeEstimate: '1-2 hours',
    diyFriendly: true,
    notes: 'Basic maintenance job. Remember to bed in new pads properly.',
  },
  'brake-pads-track': {
    essential: ['socket-set-metric', 'floor-jack', 'jack-stands', 'breaker-bar'],
    recommended: ['torque-wrench', 'brake-bleeder'],
    difficulty: 'easy',
    timeEstimate: '1-2 hours',
    diyFriendly: true,
    notes: 'Basic maintenance job. Track pads may dust heavily - not for daily driving.',
  },
  'brake-fluid-lines': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'floor-jack', 'jack-stands', 'brake-bleeder', 'drain-pan'],
    recommended: ['torque-wrench'],
    difficulty: 'moderate',
    timeEstimate: '2-4 hours',
    diyFriendly: true,
    notes: 'Must bleed all four corners properly. Two-person job without pressure bleeder.',
  },
  'big-brake-kit': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'floor-jack', 'jack-stands', 'torque-wrench', 'brake-bleeder', 'drain-pan'],
    recommended: [],
    difficulty: 'advanced',
    timeEstimate: '4-8 hours',
    diyFriendly: true,
    notes: 'Significant upgrade. May require wheel spacers or larger wheels for clearance.',
  },

  // Cooling
  'oil-cooler': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'floor-jack', 'jack-stands', 'drain-pan', 'funnel-set'],
    recommended: ['torque-wrench'],
    difficulty: 'moderate',
    timeEstimate: '3-5 hours',
    diyFriendly: true,
    notes: 'Requires oil change during install. Plan routing carefully to avoid heat sources.',
  },
  'radiator-upgrade': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'pliers-set', 'drain-pan', 'funnel-set'],
    recommended: ['torque-wrench', 'coolant-pressure-tester'],
    difficulty: 'moderate',
    timeEstimate: '2-4 hours',
    diyFriendly: true,
    notes: 'Drain and refill coolant. Burp system properly to avoid air pockets.',
  },

  // Wheels & Tires
  'wheels-lightweight': {
    essential: ['floor-jack', 'jack-stands', 'torque-wrench'],
    recommended: [],
    difficulty: 'easy',
    timeEstimate: '1 hour',
    diyFriendly: true,
    notes: 'Simple swap. Check hub-centric ring fitment. Torque to spec in star pattern.',
  },
  'tires-performance': {
    essential: [], // Tire mounting requires shop equipment
    recommended: [],
    difficulty: 'shop-only',
    timeEstimate: '1 hour at shop',
    diyFriendly: false,
    notes: 'Requires professional tire mounting and balancing equipment.',
  },
  'tires-track': {
    essential: [], // Tire mounting requires shop equipment
    recommended: [],
    difficulty: 'shop-only',
    timeEstimate: '1 hour at shop',
    diyFriendly: false,
    notes: 'Requires professional tire mounting and balancing equipment.',
  },

  // Drivetrain
  'clutch-upgrade': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'floor-jack', 'jack-stands', 'torque-wrench', 'clutch-alignment-tool'],
    recommended: ['vehicle-lift'],
    difficulty: 'expert',
    timeEstimate: '8-12 hours',
    diyFriendly: false,
    notes: 'Requires transmission removal. Professional install recommended.',
  },
  'diff-upgrade': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'floor-jack', 'jack-stands', 'torque-wrench', 'drain-pan'],
    recommended: [],
    difficulty: 'advanced',
    timeEstimate: '4-8 hours',
    diyFriendly: false,
    notes: 'May require subframe drop. Setup preload/backlash is critical.',
  },
  'short-shifter': {
    essential: ['socket-set-metric', 'wrench-set-metric'],
    recommended: ['torque-wrench'],
    difficulty: 'moderate',
    timeEstimate: '2-4 hours',
    diyFriendly: true,
    notes: 'Interior work required. Some kits are simpler than others.',
  },

  // Aero
  'splitter': {
    essential: ['socket-set-metric', 'screwdriver-set', 'drill'],
    recommended: [],
    difficulty: 'moderate',
    timeEstimate: '2-4 hours',
    diyFriendly: true,
    notes: 'May require drilling. Test fit carefully before final mounting.',
  },
  'wing': {
    essential: ['socket-set-metric', 'wrench-set-metric', 'drill', 'torque-wrench'],
    recommended: [],
    difficulty: 'moderate',
    timeEstimate: '3-5 hours',
    diyFriendly: true,
    notes: 'Trunk-mounted wings require drilling. Use reinforcement plates.',
  },

  // Alignment (professional service)
  'performance-alignment': {
    essential: ['alignment-rack'],
    recommended: ['camber-gauge', 'toe-plates'],
    difficulty: 'shop-only',
    timeEstimate: '1-2 hours at shop',
    diyFriendly: false,
    notes: 'Requires professional alignment equipment. Specify performance specs.',
  },
};

/**
 * Difficulty levels with descriptions
 */
export const difficultyLevels = {
  easy: {
    key: 'easy',
    name: 'Beginner',
    description: 'Basic bolt-on work suitable for first-time DIYers',
    color: '#27ae60',
    garageRequirement: 'Driveway/street OK',
  },
  moderate: {
    key: 'moderate',
    name: 'Intermediate',
    description: 'Requires some mechanical experience and proper tools',
    color: '#f39c12',
    garageRequirement: 'Garage with good lighting recommended',
  },
  advanced: {
    key: 'advanced',
    name: 'Advanced',
    description: 'Complex work requiring significant experience',
    color: '#e74c3c',
    garageRequirement: 'Proper garage or shop recommended',
  },
  expert: {
    key: 'expert',
    name: 'Expert',
    description: 'Professional-level installation requiring specialized skills',
    color: '#9b59b6',
    garageRequirement: 'Professional shop recommended',
  },
  'shop-only': {
    key: 'shop-only',
    name: 'Professional Only',
    description: 'Requires equipment not available for DIY',
    color: '#2c3e50',
    garageRequirement: 'Must be done at a shop',
  },
};

/**
 * Get tool requirements for an upgrade
 * @param {string} upgradeKey - The upgrade key
 * @returns {Object|null} - Tool requirements or null
 */
export function getToolsForUpgrade(upgradeKey) {
  return upgradeToolRequirements[upgradeKey] || null;
}

/**
 * Get all unique tools needed for a set of upgrades
 * @param {string[]} upgradeKeys - Array of upgrade keys
 * @returns {Object} - { essential: Tool[], recommended: Tool[], byCategory: Object }
 */
export function getToolsForBuild(upgradeKeys) {
  const essentialSet = new Set();
  const recommendedSet = new Set();
  
  upgradeKeys.forEach(key => {
    const reqs = upgradeToolRequirements[key];
    if (reqs) {
      (reqs.essential || []).forEach(t => essentialSet.add(t));
      (reqs.recommended || []).forEach(t => recommendedSet.add(t));
    }
  });
  
  // Remove recommended items that are already essential
  essentialSet.forEach(t => recommendedSet.delete(t));
  
  // Resolve to full tool objects
  const essential = Array.from(essentialSet).map(k => tools[k]).filter(Boolean);
  const recommended = Array.from(recommendedSet).map(k => tools[k]).filter(Boolean);
  
  // Group by category
  const byCategory = {};
  [...essential, ...recommended].forEach(tool => {
    const cat = tool.category;
    if (!byCategory[cat]) {
      byCategory[cat] = {
        ...toolCategories[cat],
        tools: [],
      };
    }
    byCategory[cat].tools.push(tool);
  });
  
  return { essential, recommended, byCategory };
}

/**
 * Calculate overall build complexity
 * @param {string[]} upgradeKeys - Array of upgrade keys
 * @returns {Object} - { difficulty, timeEstimate, diyFeasibility, notes }
 */
export function calculateBuildComplexity(upgradeKeys) {
  const difficulties = [];
  let totalMinHours = 0;
  let totalMaxHours = 0;
  let shopOnlyCount = 0;
  let expertCount = 0;
  const allNotes = [];
  
  upgradeKeys.forEach(key => {
    const reqs = upgradeToolRequirements[key];
    if (reqs) {
      difficulties.push(reqs.difficulty);
      if (reqs.difficulty === 'shop-only') shopOnlyCount++;
      if (reqs.difficulty === 'expert') expertCount++;
      
      // Parse time estimate (e.g., "2-4 hours" or "30 min - 1 hour")
      const timeMatch = reqs.timeEstimate?.match(/(\d+(?:\.\d+)?)\s*-?\s*(\d+(?:\.\d+)?)?/);
      if (timeMatch) {
        const min = parseFloat(timeMatch[1]) || 0;
        const max = parseFloat(timeMatch[2]) || min;
        // Convert "30 min" style to hours
        if (reqs.timeEstimate.includes('min')) {
          totalMinHours += min / 60;
          totalMaxHours += max / 60;
        } else {
          totalMinHours += min;
          totalMaxHours += max;
        }
      }
      
      if (reqs.notes) {
        allNotes.push({ upgrade: key, note: reqs.notes });
      }
    }
  });
  
  // Determine overall difficulty (highest individual difficulty)
  const difficultyOrder = ['easy', 'moderate', 'advanced', 'expert', 'shop-only'];
  const maxDifficulty = difficultyOrder.reduce((max, d) => {
    if (difficulties.includes(d)) return d;
    return max;
  }, 'easy');
  
  // DIY feasibility assessment
  let diyFeasibility = 'fully-diy';
  let diyMessage = 'All upgrades can be done in your garage with basic tools.';
  
  if (shopOnlyCount > 0) {
    diyFeasibility = 'partial-diy';
    diyMessage = `${shopOnlyCount} item(s) require professional equipment. Other upgrades can be DIY.`;
  }
  if (expertCount > 2 || (expertCount > 0 && shopOnlyCount > 0)) {
    diyFeasibility = 'shop-recommended';
    diyMessage = 'This build includes complex work. Professional installation recommended.';
  }
  if (shopOnlyCount > 2) {
    diyFeasibility = 'mostly-shop';
    diyMessage = 'Most of this build requires professional installation.';
  }
  
  // Format time estimate
  const formatTime = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    return `${Math.round(hours)} hrs`;
  };
  
  return {
    difficulty: maxDifficulty,
    difficultyInfo: difficultyLevels[maxDifficulty],
    timeEstimate: {
      min: totalMinHours,
      max: totalMaxHours,
      display: totalMinHours === totalMaxHours 
        ? formatTime(totalMinHours)
        : `${formatTime(totalMinHours)} - ${formatTime(totalMaxHours)}`,
    },
    diyFeasibility,
    diyMessage,
    shopOnlyCount,
    expertCount,
    notes: allNotes,
    totalUpgrades: upgradeKeys.length,
  };
}

export default {
  toolCategories,
  tools,
  upgradeToolRequirements,
  difficultyLevels,
  getToolsForUpgrade,
  getToolsForBuild,
  calculateBuildComplexity,
};













