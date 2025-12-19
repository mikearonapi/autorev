/**
 * COOLING SYSTEM TOPICS - Complete Encyclopedia Content
 * 
 * 3 comprehensive topics covering engine cooling.
 * All topics have full educational content - no stubs.
 * 
 * @module encyclopediaTopics/cooling
 */

export const coolingTopics = [
  {
    slug: 'radiator',
    name: 'Radiator',
    system: 'cooling',
    
    definition: 'The radiator is a heat exchanger that transfers heat from engine coolant to the ambient air, maintaining proper engine operating temperature. It consists of a core of tubes and fins that maximize surface area for heat dissipation, with tanks on each end to collect and distribute coolant.',
    
    howItWorks: 'Hot coolant from the engine enters the radiator through the upper hose and flows through narrow tubes in the core. Air passing over the fins (from vehicle motion and the cooling fan) absorbs heat from the tubes. Cooled coolant exits through the lower hose and returns to the engine. Modern radiators use aluminum cores with plastic tanks, while performance units often use all-aluminum construction for better heat transfer and durability.',
    
    whyItMatters: 'Cooling capacity directly limits how hard you can push an engine. An undersized or degraded radiator leads to overheating during track days, spirited driving, or towing. Upgrading the radiator is often the first cooling modification for any car that sees hard use, and it\'s essential for cars making more power than stock.',
    
    commonTypes: [
      'OEM (factory sizing, adequate for stock power)',
      'Aluminum performance (better cooling, lighter)',
      'All-aluminum racing (maximum cooling, no plastic)',
      'Single-row vs dual-row vs triple-row cores',
      'Cross-flow (horizontal tanks) vs down-flow (vertical tanks)'
    ],
    
    keySpecs: [
      'Core size (height × width × thickness)',
      'Row count and tube size',
      'Material (aluminum, copper/brass)',
      'Cooling capacity (BTU/hour)',
      'Pressure rating (PSI)'
    ],
    
    signs: {
      good: [
        'Engine temp stable under load',
        'Quick warm-up to operating temp',
        'Coolant flow visible in header tank',
        'No leaks at tanks or core'
      ],
      bad: [
        'Overheating under load or in traffic',
        'Visible coolant leaks',
        'Corroded or crushed fins',
        'Coolant discoloration (rust, oil)',
        'Cracked plastic tanks'
      ]
    },
    
    modPotential: {
      summary: 'Upgraded radiators are essential for track use and high-power builds. Aluminum units offer better cooling in a lighter package.',
      gains: '10-30°F reduction in coolant temps under load. Eliminates overheating concerns during hard driving. Often lighter than stock (aluminum vs plastic/copper).',
      considerations: 'Ensure proper fitment with fan shrouds. May require modified hoses. Pair with upgraded fan for best results. Price ranges from $200-800 for quality units.'
    },
    
    relatedTopics: ['oil-cooler', 'engine-cooling', 'thermostat'],
    relatedUpgradeKeys: ['radiator-upgrade'],
    status: 'complete'
  },

  {
    slug: 'oil-cooler',
    name: 'Oil Cooler',
    system: 'cooling',
    
    definition: 'An oil cooler is a heat exchanger that maintains engine oil at optimal operating temperature, preventing thermal breakdown and maintaining proper viscosity. It can be air-cooled (like a small radiator) or water-cooled (using engine coolant as the cooling medium).',
    
    howItWorks: 'Engine oil is routed through the cooler, typically via an adapter that replaces or mounts at the oil filter location. In air-to-oil coolers, the oil passes through finned tubes exposed to airflow. In water-to-oil coolers, the oil passes through a heat exchanger cooled by engine coolant. A thermostat often controls flow to prevent overcooling during warm-up. Oil temperature ideally stays between 180-230°F for proper viscosity and protection.',
    
    whyItMatters: 'Oil temperature above 275°F accelerates breakdown and reduces protection—engines have been destroyed by oil that got too hot during track use. Stock cooling systems often can\'t handle extended high-load driving. Oil coolers are essential for any car used on track and highly recommended for spirited canyon driving or towing.',
    
    commonTypes: [
      'Air-to-oil (most effective, requires mounting location)',
      'Water-to-oil (compact, limited by coolant temp)',
      'Stacked plate (common, efficient)',
      'Tube-and-fin (traditional, robust)',
      'Thermostatic vs non-thermostatic'
    ],
    
    keySpecs: [
      'Row count and dimensions',
      'Flow rate capacity (GPM)',
      'Cooling capacity (BTU/hour)',
      'Fitting size (-AN or NPT)',
      'Thermostat opening temp'
    ],
    
    signs: {
      good: [
        'Oil temp stable at 200-230°F under load',
        'Quick warm-up (thermostat working)',
        'No leaks at lines or fittings',
        'Good oil pressure maintained'
      ],
      bad: [
        'Oil temps exceeding 275°F on track',
        'Oil leaking from cooler or lines',
        'Slow warm-up (stuck thermostat open)',
        'Coolant in oil (water-to-oil failure)',
        'Low oil pressure at high temp'
      ]
    },
    
    modPotential: {
      summary: 'Aftermarket oil coolers are a critical upgrade for any car used on track or making significant power above stock.',
      gains: '30-50°F reduction in oil temps under load. Extends oil life. Protects bearings and internals. Essential for sustained high-load driving.',
      considerations: 'Requires mounting location with good airflow. Adds complexity (lines, fittings). Must be properly thermostated to allow warm-up. Typical kits cost $250-600.'
    },
    
    relatedTopics: ['radiator', 'engine-cooling', 'engine-block'],
    relatedUpgradeKeys: ['oil-cooler'],
    status: 'complete'
  },

  {
    slug: 'oil-pan-baffles',
    name: 'Oil Pan & Baffles',
    system: 'cooling',
    
    definition: 'The oil pan (sump) is the reservoir at the bottom of the engine that holds the oil supply. Baffles are internal partitions that prevent oil from sloshing away from the pickup during hard cornering, acceleration, or braking, ensuring consistent oil pressure when the engine needs it most.',
    
    howItWorks: 'During hard driving, lateral and longitudinal G-forces push oil to one side of the pan. Without baffles, the oil pickup can become exposed, sucking air instead of oil—a condition called oil starvation. Baffles trap oil near the pickup, windage trays prevent the spinning crankshaft from whipping oil into foam, and crank scrapers help return oil to the sump quickly. Deep sump pans increase capacity for better cooling and reduced starvation risk.',
    
    whyItMatters: 'Oil starvation, even for a few seconds, can destroy bearings and cause catastrophic engine failure. Stock oil pans are designed for normal street driving, not sustained cornering at 1G+. Any car used for track days, autocross, or aggressive street driving benefits from improved oil control—it\'s inexpensive insurance against expensive failure.',
    
    commonTypes: [
      'Stock pan (basic, minimal baffling)',
      'Baffled stock pan (added internal baffles)',
      'Aftermarket deep sump (increased capacity + baffles)',
      'Road racing pan (specialized baffling for specific G-loads)',
      'Dry sump (separate oil tank, most effective, complex)'
    ],
    
    keySpecs: [
      'Oil capacity (quarts)',
      'Ground clearance',
      'Baffle design (trap doors, foam, fixed)',
      'Pickup location compatibility',
      'Material (stamped steel, cast aluminum)'
    ],
    
    signs: {
      good: [
        'Stable oil pressure in hard corners',
        'No low pressure warnings on track',
        'Oil returning quickly after hard maneuvers',
        'No pan contact (ground clearance OK)'
      ],
      bad: [
        'Low oil pressure light in corners',
        'Oil pressure fluctuation under hard driving',
        'Windage issues (foaming oil)',
        'Pan damage from ground contact',
        'Oil pickup tube exposed during inspection'
      ]
    },
    
    modPotential: {
      summary: 'Baffled pans are essential for any track use. Deeper pans add capacity for cooling and resistance to starvation.',
      gains: 'Eliminates oil starvation in hard driving. 1-2 quart extra capacity provides thermal reserve. Peace of mind on track.',
      considerations: 'Deep sump pans may reduce ground clearance. Must verify pickup compatibility. Some aftermarket pans require oil pickup tube modifications. $150-500 for quality baffled pans.'
    },
    
    relatedTopics: ['crankshaft', 'engine-block', 'oil-cooler'],
    relatedUpgradeKeys: ['oil-pan-baffle'],
    status: 'complete'
  }
];

export default coolingTopics;





