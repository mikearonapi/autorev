/**
 * AutoRev Encyclopedia - Component-Centric Hierarchy
 * 
 * This module defines the educational content hierarchy organized by automotive system.
 * Each system contains topics organized by category/component.
 * 
 * Structure:
 *   System → Topic[]
 * 
 * Example:
 *   Engine → [engine-block, cylinder-head, pistons, crankshaft, ...]
 * 
 * Topics link to existing upgrade content via relatedUpgradeKeys.
 * 
 * CONTENT SOURCE:
 *   Comprehensive topic content is in lib/encyclopediaTopics/
 *   This module provides the hierarchy, systems, and components definitions.
 * 
 * @module encyclopediaHierarchy
 */

// Import comprehensive topic content (136 topics, all complete)
import {
  allTopics as importedTopics,
  topicsBySlug as importedTopicsBySlug,
  topicsBySystem,
  upgradeKeyToTopics as importedUpgradeKeyMapping,
  topicStats,
  getTopicBySlug as getTopicBySlugFromTopics,
  getTopicsForSystem as getTopicsForSystemFromTopics,
} from './encyclopediaTopics/index.js';

// =============================================================================
// TYPE DEFINITIONS (JSDoc)
// =============================================================================

/**
 * @typedef {Object} EncyclopediaSystem
 * @property {string} slug - URL-safe identifier (e.g., "engine")
 * @property {string} name - Display name
 * @property {string} description - System overview
 * @property {string} icon - Icon identifier
 * @property {string} color - Theme color (hex)
 * @property {number} sortOrder - Display order
 */

/**
 * @typedef {Object} EncyclopediaComponent
 * @property {string} slug - URL-safe identifier (e.g., "engine-block")
 * @property {string} name - Display name
 * @property {string} system - Parent system slug
 * @property {string} description - Component overview
 * @property {number} sortOrder - Display order within system
 */

/**
 * @typedef {Object} EncyclopediaTopic
 * @property {string} slug - URL-safe identifier (e.g., "bore")
 * @property {string} name - Display name
 * @property {string} system - Parent system slug
 * @property {string} definition - What is it?
 * @property {string} howItWorks - Technical explanation
 * @property {string} whyItMatters - Practical relevance
 * @property {string[]} [commonTypes] - Common types/variants
 * @property {string[]} [keySpecs] - Important specifications
 * @property {Object} [signs] - Signs of good/bad condition
 * @property {Object} [modPotential] - Modification options
 * @property {string[]} [relatedTopics] - Related topic slugs
 * @property {string[]} [relatedUpgradeKeys] - Links to upgrade education content
 * @property {'complete' | 'stub'} status - Content completion status
 */

// =============================================================================
// SYSTEMS
// =============================================================================

/**
 * The 9 core automotive systems organized for educational purposes.
 * @type {Record<string, EncyclopediaSystem>}
 */
export const encyclopediaSystems = {
  engine: {
    slug: 'engine',
    name: 'Engine',
    description: 'The heart of your vehicle. Understanding engine fundamentals—from combustion basics to advanced architectures—helps you make informed decisions about maintenance, modifications, and performance.',
    icon: 'bolt',
    color: '#e74c3c',
    sortOrder: 1,
  },
  drivetrain: {
    slug: 'drivetrain',
    name: 'Drivetrain',
    description: 'Everything between the engine and the wheels. The drivetrain transfers power, manages gear ratios, and distributes torque to the driven wheels.',
    icon: 'gears',
    color: '#e67e22',
    sortOrder: 2,
  },
  fuelSystem: {
    slug: 'fuel-system',
    name: 'Fuel System',
    description: 'Fuel delivery from tank to combustion chamber. Modern fuel systems are precision-engineered to deliver exactly the right amount of fuel at the right pressure.',
    icon: 'fuel',
    color: '#f39c12',
    sortOrder: 3,
  },
  engineManagement: {
    slug: 'engine-management',
    name: 'Engine Management',
    description: 'The brain of your engine. Engine management systems control ignition timing, fuel delivery, valve timing, and dozens of other parameters to optimize performance, efficiency, and emissions.',
    icon: 'cpu',
    color: '#2c3e50',
    sortOrder: 4,
  },
  airIntake: {
    slug: 'air-intake',
    name: 'Air Intake & Forced Induction',
    description: 'How your engine breathes. From simple intake systems to complex turbocharger setups, airflow is fundamental to power production.',
    icon: 'turbo',
    color: '#9b59b6',
    sortOrder: 5,
  },
  exhaust: {
    slug: 'exhaust',
    name: 'Exhaust',
    description: 'The path exhaust gases take from combustion chamber to atmosphere. Exhaust design affects power, sound, emissions, and turbo response.',
    icon: 'sound',
    color: '#8e44ad',
    sortOrder: 6,
  },
  suspension: {
    slug: 'suspension',
    name: 'Suspension & Steering',
    description: 'How your car handles corners, bumps, and driver input. Suspension geometry determines handling characteristics; steering systems translate driver input to wheel movement.',
    icon: 'car',
    color: '#3498db',
    sortOrder: 7,
  },
  aero: {
    slug: 'aerodynamics',
    name: 'Aerodynamics',
    description: 'How air flows around your vehicle affects stability, grip, and top speed. Understanding aerodynamics helps you make informed decisions about wings, splitters, and body modifications.',
    icon: 'wind',
    color: '#7f8c8d',
    sortOrder: 8,
  },
  brakes: {
    slug: 'brakes',
    name: 'Brakes',
    description: 'Your most important safety system. Understanding brake systems helps you choose the right upgrades for street or track use and maintain proper braking performance.',
    icon: 'brake',
    color: '#c0392b',
    sortOrder: 9,
  },
};

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Components organized by parent system.
 * @type {Record<string, EncyclopediaComponent>}
 */
export const encyclopediaComponents = {
  // ---------------------------------------------------------------------------
  // ENGINE COMPONENTS
  // ---------------------------------------------------------------------------
  'engine-block': {
    slug: 'engine-block',
    name: 'Engine Block',
    system: 'engine',
    description: 'The foundation of your engine. The block houses cylinders, supports the crankshaft, and provides mounting points for other components.',
    sortOrder: 1,
  },
  'cylinder-head': {
    slug: 'cylinder-head',
    name: 'Cylinder Head',
    system: 'engine',
    description: 'Sits atop the block and contains valves, ports, and often the camshafts. Head design significantly impacts airflow and power potential.',
    sortOrder: 2,
  },
  'pistons-rods': {
    slug: 'pistons-rods',
    name: 'Pistons & Connecting Rods',
    system: 'engine',
    description: 'Convert combustion pressure into rotational motion. Piston and rod design affects durability, weight, and power handling capability.',
    sortOrder: 3,
  },
  'crankshaft': {
    slug: 'crankshaft',
    name: 'Crankshaft & Rotating Assembly',
    system: 'engine',
    description: 'Converts reciprocating motion to rotation. Crank design determines stroke length and affects engine character.',
    sortOrder: 4,
  },
  'camshaft-valvetrain': {
    slug: 'camshaft-valvetrain',
    name: 'Camshaft & Valvetrain',
    system: 'engine',
    description: 'Controls when and how long valves open. Cam profiles dramatically influence power delivery characteristics.',
    sortOrder: 5,
  },
  'flywheel-flexplate': {
    slug: 'flywheel-flexplate',
    name: 'Flywheel & Flexplate',
    system: 'engine',
    description: 'Stores rotational energy and provides connection to the drivetrain. Flywheel mass affects engine response.',
    sortOrder: 6,
  },
  'engine-architecture': {
    slug: 'engine-architecture',
    name: 'Engine Architecture',
    system: 'engine',
    description: 'Cylinder arrangement and configuration—inline, V, flat, rotary—each with distinct characteristics.',
    sortOrder: 7,
  },
  'engine-cooling': {
    slug: 'engine-cooling',
    name: 'Engine Cooling',
    system: 'engine',
    description: 'Maintaining proper operating temperature is critical for performance and longevity.',
    sortOrder: 8,
  },

  // ---------------------------------------------------------------------------
  // DRIVETRAIN COMPONENTS
  // ---------------------------------------------------------------------------
  'transmission': {
    slug: 'transmission',
    name: 'Transmission',
    system: 'drivetrain',
    description: 'Multiplies torque and provides gear ratios to match engine output to driving conditions.',
    sortOrder: 1,
  },
  'clutch': {
    slug: 'clutch',
    name: 'Clutch & Torque Converter',
    system: 'drivetrain',
    description: 'Connects and disconnects engine from transmission. Critical for manual transmissions and determines power handling.',
    sortOrder: 2,
  },
  'driveshaft-halfshaft': {
    slug: 'driveshaft-halfshaft',
    name: 'Driveshaft & Halfshafts',
    system: 'drivetrain',
    description: 'Transfer power from transmission to differential (driveshaft) or from diff to wheels (halfshafts/axles).',
    sortOrder: 3,
  },
  'differential': {
    slug: 'differential',
    name: 'Differential',
    system: 'drivetrain',
    description: 'Allows wheels to rotate at different speeds while cornering. LSD types dramatically affect traction and handling.',
    sortOrder: 4,
  },
  'hubs-bearings': {
    slug: 'hubs-bearings',
    name: 'Hubs & Wheel Bearings',
    system: 'drivetrain',
    description: 'Support the wheels and allow them to rotate freely. Quality bearings are essential for reliability.',
    sortOrder: 5,
  },

  // ---------------------------------------------------------------------------
  // FUEL SYSTEM COMPONENTS
  // ---------------------------------------------------------------------------
  'fuel-pumps': {
    slug: 'fuel-pumps',
    name: 'Fuel Pumps',
    system: 'fuel-system',
    description: 'Low-pressure (in-tank) and high-pressure pumps deliver fuel to injectors at precise pressures.',
    sortOrder: 1,
  },
  'fuel-rail-injectors': {
    slug: 'fuel-rail-injectors',
    name: 'Fuel Rail & Injectors',
    system: 'fuel-system',
    description: 'Distribute and meter fuel into cylinders. Injector size and type determine fueling capacity.',
    sortOrder: 2,
  },
  'injection-types': {
    slug: 'injection-types',
    name: 'Injection Types',
    system: 'fuel-system',
    description: 'Port injection, direct injection, dual injection—each has advantages for different applications.',
    sortOrder: 3,
  },
  'fuel-types': {
    slug: 'fuel-types',
    name: 'Fuel Types & Octane',
    system: 'fuel-system',
    description: 'Understanding fuel grades, E85, and race fuels helps optimize performance and prevent engine damage.',
    sortOrder: 4,
  },

  // ---------------------------------------------------------------------------
  // ENGINE MANAGEMENT COMPONENTS
  // ---------------------------------------------------------------------------
  'ecu': {
    slug: 'ecu',
    name: 'ECU & TCU',
    system: 'engine-management',
    description: 'Engine Control Unit (ECU) and Transmission Control Unit (TCU) are the computers managing your powertrain.',
    sortOrder: 1,
  },
  'sensors': {
    slug: 'sensors',
    name: 'Sensors (MAP, MAF, O2)',
    system: 'engine-management',
    description: 'Sensors provide data the ECU needs to control fueling, timing, and other parameters.',
    sortOrder: 2,
  },
  'valve-timing': {
    slug: 'valve-timing',
    name: 'Variable Valve Timing',
    system: 'engine-management',
    description: 'VVT, VTEC, VANOS—variable valve timing systems optimize performance across the RPM range.',
    sortOrder: 3,
  },
  'ignition-system': {
    slug: 'ignition-system',
    name: 'Ignition System',
    system: 'engine-management',
    description: 'Spark plugs, coils, and timing control when combustion occurs. Critical for power and efficiency.',
    sortOrder: 4,
  },
  'tuning': {
    slug: 'tuning',
    name: 'Tuning & Calibration',
    system: 'engine-management',
    description: 'Modifying ECU parameters to optimize performance. Flash tunes, standalone ECUs, and piggyback systems.',
    sortOrder: 5,
  },

  // ---------------------------------------------------------------------------
  // AIR INTAKE COMPONENTS
  // ---------------------------------------------------------------------------
  'intake-airbox': {
    slug: 'intake-airbox',
    name: 'Intake & Airbox',
    system: 'air-intake',
    description: 'The intake system delivers filtered air to the engine. Design affects flow, filtration, and sound.',
    sortOrder: 1,
  },
  'air-filters': {
    slug: 'air-filters',
    name: 'Air Filters',
    system: 'air-intake',
    description: 'Balance between filtration and airflow. High-flow filters improve breathing but require proper maintenance.',
    sortOrder: 2,
  },
  'turbocharger': {
    slug: 'turbocharger',
    name: 'Turbocharger',
    system: 'air-intake',
    description: 'Uses exhaust energy to compress intake air, dramatically increasing power potential.',
    sortOrder: 3,
  },
  'supercharger': {
    slug: 'supercharger',
    name: 'Supercharger',
    system: 'air-intake',
    description: 'Mechanically driven compressor providing instant boost response with linear power delivery.',
    sortOrder: 4,
  },
  'boost-control': {
    slug: 'boost-control',
    name: 'Boost Control (Wastegate, BOV)',
    system: 'air-intake',
    description: 'Wastegates regulate boost pressure; blow-off valves prevent compressor surge.',
    sortOrder: 5,
  },
  'intercooler': {
    slug: 'intercooler',
    name: 'Intercooler',
    system: 'air-intake',
    description: 'Cools compressed air before it enters the engine, increasing density and power.',
    sortOrder: 6,
  },

  // ---------------------------------------------------------------------------
  // EXHAUST COMPONENTS
  // ---------------------------------------------------------------------------
  'headers-manifold': {
    slug: 'headers-manifold',
    name: 'Headers & Exhaust Manifold',
    system: 'exhaust',
    description: 'Collect exhaust from cylinder head ports. Header design affects flow, torque curve, and sound.',
    sortOrder: 1,
  },
  'downpipe': {
    slug: 'downpipe',
    name: 'Downpipe',
    system: 'exhaust',
    description: 'Connects turbo to the rest of the exhaust. Critical restriction point for turbocharged cars.',
    sortOrder: 2,
  },
  'catalytic-converter': {
    slug: 'catalytic-converter',
    name: 'Catalytic Converter',
    system: 'exhaust',
    description: 'Reduces harmful emissions. High-flow cats balance performance with street legality.',
    sortOrder: 3,
  },
  'resonator-muffler': {
    slug: 'resonator-muffler',
    name: 'Resonators & Mufflers',
    system: 'exhaust',
    description: 'Control exhaust sound. Design affects tone, volume, and backpressure.',
    sortOrder: 4,
  },
  'exhaust-piping': {
    slug: 'exhaust-piping',
    name: 'Exhaust Piping & Sizing',
    system: 'exhaust',
    description: 'Pipe diameter and routing affect flow. Bigger isn\'t always better—match to power level.',
    sortOrder: 5,
  },

  // ---------------------------------------------------------------------------
  // SUSPENSION COMPONENTS
  // ---------------------------------------------------------------------------
  'springs': {
    slug: 'springs',
    name: 'Springs & Spring Rates',
    system: 'suspension',
    description: 'Support vehicle weight and control ride height. Rate determines stiffness and handling character.',
    sortOrder: 1,
  },
  'shocks-dampers': {
    slug: 'shocks-dampers',
    name: 'Shocks & Dampers',
    system: 'suspension',
    description: 'Control spring oscillation. Damper valving dramatically affects handling and ride quality.',
    sortOrder: 2,
  },
  'coilovers': {
    slug: 'coilovers',
    name: 'Coilovers',
    system: 'suspension',
    description: 'Integrated spring and damper units with adjustable height and often adjustable damping.',
    sortOrder: 3,
  },
  'control-arms': {
    slug: 'control-arms',
    name: 'Control Arms & Links',
    system: 'suspension',
    description: 'Connect suspension to chassis and control wheel movement. Adjustable arms enable alignment optimization.',
    sortOrder: 4,
  },
  'bushings': {
    slug: 'bushings',
    name: 'Bushings',
    system: 'suspension',
    description: 'Isolate vibration and allow controlled movement. Stiffer bushings improve response but transmit more NVH.',
    sortOrder: 5,
  },
  'sway-bars': {
    slug: 'sway-bars',
    name: 'Sway Bars (Anti-Roll Bars)',
    system: 'suspension',
    description: 'Reduce body roll in corners. Adjustable bars allow fine-tuning of handling balance.',
    sortOrder: 6,
  },
  'alignment': {
    slug: 'alignment',
    name: 'Alignment & Geometry',
    system: 'suspension',
    description: 'Camber, caster, toe—alignment settings determine tire wear, grip, and handling characteristics.',
    sortOrder: 7,
  },
  'steering': {
    slug: 'steering',
    name: 'Steering System',
    system: 'suspension',
    description: 'Rack and pinion, steering geometry, and power assist determine steering feel and response.',
    sortOrder: 8,
  },
  'tires-specs': {
    slug: 'tires-specs',
    name: 'Tires & Specifications',
    system: 'suspension',
    description: 'The only thing connecting your car to the road. Tire selection is the single biggest handling factor.',
    sortOrder: 9,
  },

  // ---------------------------------------------------------------------------
  // AERODYNAMICS COMPONENTS
  // ---------------------------------------------------------------------------
  'aero-principles': {
    slug: 'aero-principles',
    name: 'Aerodynamic Principles',
    system: 'aerodynamics',
    description: 'Drag, lift, downforce—understanding airflow helps you make informed aero decisions.',
    sortOrder: 1,
  },
  'front-aero': {
    slug: 'front-aero',
    name: 'Front Aerodynamics',
    system: 'aerodynamics',
    description: 'Splitters, canards, and air dams generate front downforce and control airflow.',
    sortOrder: 2,
  },
  'rear-aero': {
    slug: 'rear-aero',
    name: 'Rear Aerodynamics',
    system: 'aerodynamics',
    description: 'Wings, spoilers, and diffusers generate rear downforce and reduce drag.',
    sortOrder: 3,
  },
  'aero-balance': {
    slug: 'aero-balance',
    name: 'Aerodynamic Balance',
    system: 'aerodynamics',
    description: 'Front/rear downforce distribution affects handling. Imbalanced aero causes understeer or oversteer at speed.',
    sortOrder: 4,
  },

  // ---------------------------------------------------------------------------
  // BRAKES COMPONENTS
  // ---------------------------------------------------------------------------
  'brake-rotors': {
    slug: 'brake-rotors',
    name: 'Brake Rotors',
    system: 'brakes',
    description: 'Disc brakes convert kinetic energy to heat. Rotor size, material, and design affect stopping power.',
    sortOrder: 1,
  },
  'brake-pads': {
    slug: 'brake-pads',
    name: 'Brake Pads',
    system: 'brakes',
    description: 'Friction material that clamps the rotor. Compound determines bite, fade resistance, and wear.',
    sortOrder: 2,
  },
  'brake-calipers': {
    slug: 'brake-calipers',
    name: 'Brake Calipers',
    system: 'brakes',
    description: 'House brake pads and provide clamping force. Piston count and size determine force and heat dissipation.',
    sortOrder: 3,
  },
  'brake-fluid-lines': {
    slug: 'brake-fluid-lines',
    name: 'Brake Fluid & Lines',
    system: 'brakes',
    description: 'Hydraulic fluid transmits pedal force. High-temp fluid prevents boiling; braided lines improve feel.',
    sortOrder: 4,
  },
  'master-cylinder-abs': {
    slug: 'master-cylinder-abs',
    name: 'Master Cylinder & ABS',
    system: 'brakes',
    description: 'Master cylinder converts pedal pressure to hydraulic force. ABS prevents wheel lockup.',
    sortOrder: 5,
  },
  'brake-cooling': {
    slug: 'brake-cooling',
    name: 'Brake Cooling',
    system: 'brakes',
    description: 'Brake ducts and cooling strategies for sustained heavy braking on track.',
    sortOrder: 6,
  },
};

// =============================================================================
// TOPICS (Imported from lib/encyclopediaTopics/)
// =============================================================================

/**
 * All encyclopedia topics - comprehensive content for 136 topics.
 * Organized by slug for easy lookup.
 * @type {Record<string, EncyclopediaTopic>}
 */
export const encyclopediaTopics = importedTopicsBySlug;

// =============================================================================
// UPGRADE KEY MAPPING (Generated from topic relatedUpgradeKeys)
// =============================================================================

/**
 * Maps upgrade keys to their related topic slugs.
 * Built from topic.relatedUpgradeKeys fields.
 * @type {Record<string, string[]>}
 */
export const upgradeKeyToTopics = importedUpgradeKeyMapping;

// =============================================================================
// LEGACY TOPICS REFERENCE (for documentation only)
// =============================================================================

/**
 * @deprecated - Old topic definitions, kept for reference only.
 * All actual content now comes from lib/encyclopediaTopics/
 */
const _legacyTopicsReference = {
  // ---------------------------------------------------------------------------
  // ENGINE > ENGINE BLOCK
  // ---------------------------------------------------------------------------
  'bore': {
    slug: 'bore',
    name: 'Bore',
    component: 'engine-block',
    system: 'engine',
    definition: 'The diameter of each cylinder in the engine block, measured in millimeters or inches.',
    howItWorks: 'A larger bore allows for bigger pistons with more surface area to receive combustion pressure. This increases displacement without lengthening the engine. Overboring worn cylinders is a common rebuild technique, but there are limits based on block strength and water jacket proximity.',
    whyItMatters: 'Bore size directly affects displacement and power potential. Larger bores favor high-RPM power; they allow larger valves and better breathing at high speeds.',
    modPotential: 'Engines can be "bored out" during rebuilds to increase displacement. Common overbores are 0.5mm to 1mm. This requires new oversized pistons and potentially new rings.',
    relatedUpgradeKeys: ['forged-internals', 'stroker-kit'],
    status: 'complete',
  },
  'stroke': {
    slug: 'stroke',
    name: 'Stroke',
    component: 'engine-block',
    system: 'engine',
    definition: 'The distance the piston travels from top dead center (TDC) to bottom dead center (BDC), determined by the crankshaft throw.',
    howItWorks: 'Stroke length is determined by the crankshaft design. A longer stroke increases displacement and typically produces more torque at lower RPM. However, longer strokes mean higher piston speeds at a given RPM, limiting safe maximum engine speed.',
    whyItMatters: 'Stroke determines engine character. "Undersquare" engines (stroke > bore) favor low-end torque. "Oversquare" engines (bore > stroke) favor high-RPM power. Most performance engines are square or slightly oversquare.',
    modPotential: 'Stroker kits replace the crankshaft with a longer-throw design, increasing displacement significantly. This typically also requires longer connecting rods and potentially shorter pistons.',
    relatedUpgradeKeys: ['stroker-kit', 'forged-internals'],
    status: 'complete',
  },
  'displacement': {
    slug: 'displacement',
    name: 'Displacement',
    component: 'engine-block',
    system: 'engine',
    definition: 'The total volume of all cylinders combined, typically measured in liters (L) or cubic centimeters (cc). Calculated as: π × (bore/2)² × stroke × number of cylinders.',
    howItWorks: 'Displacement represents how much air/fuel mixture the engine can theoretically process per cycle. More displacement means more potential power, all else being equal. This is why "there\'s no replacement for displacement" became a common saying.',
    whyItMatters: 'Displacement is a primary determinant of power potential. Naturally aspirated engines are more displacement-dependent than forced induction engines, which can compensate with boost pressure.',
    modPotential: 'Displacement can be increased via boring (larger bore), stroking (longer stroke), or both. A "stroker kit" is the most common displacement increase method.',
    relatedUpgradeKeys: ['stroker-kit'],
    status: 'complete',
  },
  'block-material': {
    slug: 'block-material',
    name: 'Block Material',
    component: 'engine-block',
    system: 'engine',
    definition: 'The primary material the engine block is cast from—typically cast iron or aluminum alloy.',
    howItWorks: 'Cast iron blocks are strong and thermally stable but heavy. Aluminum blocks are lighter but require iron or steel cylinder liners for durability. Some blocks use aluminum with special coatings (Nikasil, Alusil) instead of liners.',
    whyItMatters: 'Block material affects weight, heat dissipation, and strength. Aluminum blocks can warp under high heat or pressure. Iron blocks handle abuse better but add significant weight.',
    modPotential: 'Block choice affects modification limits. Aluminum blocks may need reinforcement (sleeves, girdles) for high-power builds. Some builders use aftermarket iron blocks for extreme builds.',
    status: 'complete',
  },

  // ---------------------------------------------------------------------------
  // ENGINE > CYLINDER HEAD
  // ---------------------------------------------------------------------------
  'port-design': {
    slug: 'port-design',
    name: 'Port Design & Flow',
    component: 'cylinder-head',
    system: 'engine',
    definition: 'The shape and size of the intake and exhaust passages in the cylinder head that channel air/fuel mixture and exhaust gases.',
    howItWorks: 'Port design is critical for airflow. The shape determines velocity, turbulence, and swirl. Intake ports deliver mixture to the combustion chamber; exhaust ports evacuate burned gases. Port volume and shape dramatically affect power band characteristics.',
    whyItMatters: 'Airflow is the ultimate limit on naturally aspirated power. Well-designed ports maximize volumetric efficiency—how much of the cylinder\'s theoretical capacity is actually filled with mixture.',
    modPotential: 'Porting involves reshaping ports to improve flow. CNC porting provides consistent results; hand porting allows custom optimization. Full port work can add 10-20% power on NA engines.',
    relatedUpgradeKeys: ['ported-heads'],
    status: 'complete',
  },
  'valve-sizing': {
    slug: 'valve-sizing',
    name: 'Valve Sizing',
    component: 'cylinder-head',
    system: 'engine',
    definition: 'The diameter of intake and exhaust valves. Larger valves flow more air but have limits based on combustion chamber size.',
    howItWorks: 'Intake valves are typically larger than exhaust valves because incoming mixture is less dense than hot exhaust gases. Valve size must be balanced with port velocity—too large and mixture velocity drops, hurting low-RPM performance.',
    whyItMatters: 'Valve size limits peak airflow. Multi-valve designs (4 valves per cylinder) provide more total valve area than 2-valve designs, enabling better breathing.',
    modPotential: 'Oversized valves can be fitted during head work, but require matching port work and potentially combustion chamber modifications.',
    relatedUpgradeKeys: ['ported-heads'],
    status: 'complete',
  },
  'combustion-chamber': {
    slug: 'combustion-chamber',
    name: 'Combustion Chamber',
    component: 'cylinder-head',
    system: 'engine',
    definition: 'The space where combustion occurs, formed by the cylinder head, piston top, and cylinder walls at TDC.',
    howItWorks: 'Chamber shape affects flame propagation, detonation resistance, and efficiency. Pentroof chambers (common with 4-valve heads) allow central spark plug placement for even burn. Chamber volume determines compression ratio.',
    whyItMatters: 'Efficient combustion chamber design maximizes power extraction from fuel. Poor chamber design leads to hot spots, detonation, and inefficiency.',
    modPotential: 'Chamber modifications can increase compression ratio (milling the head surface) or improve flow (bowl work, unshrouding valves).',
    relatedUpgradeKeys: ['ported-heads'],
    status: 'complete',
  },

  // ---------------------------------------------------------------------------
  // ENGINE > PISTONS & CONNECTING RODS
  // ---------------------------------------------------------------------------
  'piston-types': {
    slug: 'piston-types',
    name: 'Piston Types & Materials',
    component: 'pistons-rods',
    system: 'engine',
    definition: 'Pistons are typically cast, hypereutectic, or forged aluminum alloy, each with different strength and expansion characteristics.',
    howItWorks: 'Cast pistons are affordable and suitable for stock applications. Hypereutectic pistons have more silicon content, reducing expansion but remaining brittle. Forged pistons are stronger and handle abuse but expand more, requiring larger cold clearances.',
    whyItMatters: 'Piston choice determines power handling capability and longevity under stress. Wrong piston selection leads to failures in high-performance applications.',
    modPotential: 'Forged pistons are essential for forced induction or high-RPM builds. They handle detonation and heat better than cast alternatives.',
    relatedUpgradeKeys: ['forged-internals'],
    status: 'complete',
  },
  'connecting-rods': {
    slug: 'connecting-rods',
    name: 'Connecting Rods',
    component: 'pistons-rods',
    system: 'engine',
    definition: 'Links connecting pistons to the crankshaft, converting linear piston motion to crankshaft rotation.',
    howItWorks: 'Rods experience tremendous tensile and compressive loads. Rod length affects piston dwell time at TDC and rod angle, influencing power delivery and piston side loading.',
    whyItMatters: 'Rods are a common failure point in high-power builds. They must handle both combustion forces pushing down and inertia forces at high RPM pulling up.',
    modPotential: 'Aftermarket rods are available in H-beam (stronger) and I-beam (lighter) designs. Forged or billet rods are essential for serious power builds.',
    relatedUpgradeKeys: ['forged-internals'],
    status: 'complete',
  },

  // ---------------------------------------------------------------------------
  // ENGINE > CRANKSHAFT
  // ---------------------------------------------------------------------------
  'crank-design': {
    slug: 'crank-design',
    name: 'Crankshaft Design',
    component: 'crankshaft',
    system: 'engine',
    definition: 'The crankshaft converts reciprocating piston motion into rotational output. Design determines firing order, balance, and strength.',
    howItWorks: 'Crank journals are offset from the centerline by half the stroke distance. Main journals support the crank in the block; rod journals connect to connecting rods. Counter weights balance the rotating assembly.',
    whyItMatters: 'A well-designed crank minimizes vibration and handles high loads. Firing order affects smoothness and exhaust pulse timing.',
    modPotential: 'Aftermarket cranks offer increased stroke (more displacement), stronger materials, or better balance. Knife-edging reduces windage.',
    relatedUpgradeKeys: ['stroker-kit', 'forged-internals'],
    status: 'complete',
  },
  'rotating-balance': {
    slug: 'rotating-balance',
    name: 'Rotating Assembly Balance',
    component: 'crankshaft',
    system: 'engine',
    definition: 'The process of ensuring all rotating and reciprocating components are properly balanced to minimize vibration.',
    howItWorks: 'Pistons, rods, and crank must be balanced as a set. Weight is removed from heavier components or added via heavy metal (Mallory) to lighter ones. Internal vs external balance describes where counterweights are located.',
    whyItMatters: 'Imbalanced engines vibrate excessively, causing accelerated wear and potential failures at high RPM. Balance is critical for engines that will see high RPM regularly.',
    modPotential: 'Blueprinting an engine includes precision balancing. This is essential when mixing new and old components or building for high RPM.',
    relatedUpgradeKeys: ['forged-internals'],
    status: 'complete',
  },

  // ---------------------------------------------------------------------------
  // ENGINE > CAMSHAFT & VALVETRAIN
  // ---------------------------------------------------------------------------
  'cam-profiles': {
    slug: 'cam-profiles',
    name: 'Camshaft Profiles',
    component: 'camshaft-valvetrain',
    system: 'engine',
    definition: 'The shape of camshaft lobes that determines valve lift, duration, and timing. These three factors define cam characteristics.',
    howItWorks: 'Lift is how far the valve opens. Duration is how long it stays open (in crankshaft degrees). Timing is when events occur relative to piston position. "Overlap" is when both valves are open simultaneously.',
    whyItMatters: 'Cam selection dramatically affects power band. Aggressive cams make more peak power but sacrifice low-RPM torque and idle quality. Street cams prioritize drivability.',
    modPotential: 'Cam swaps are common modifications for NA engines. Aggressive cams often require supporting mods (valve springs, retainers) and ECU tuning.',
    relatedUpgradeKeys: ['camshafts'],
    status: 'complete',
  },
  'valvetrain-components': {
    slug: 'valvetrain-components',
    name: 'Valvetrain Components',
    component: 'camshaft-valvetrain',
    system: 'engine',
    definition: 'Springs, retainers, keepers, lifters/followers, and rockers that actuate valves based on camshaft rotation.',
    howItWorks: 'Valve springs close the valve and must provide enough force to prevent valve float at high RPM. Lifters/followers ride on cam lobes; rockers multiply motion. All components must work together harmoniously.',
    whyItMatters: 'Weak or worn valvetrain limits safe RPM. "Valve float" occurs when springs can\'t close valves fast enough, causing loss of power or valve-to-piston contact.',
    modPotential: 'Upgraded springs and retainers allow higher RPM. Titanium retainers reduce weight. Roller rockers reduce friction.',
    relatedUpgradeKeys: ['camshafts'],
    status: 'complete',
  },

  // ---------------------------------------------------------------------------
  // ENGINE > FLYWHEEL
  // ---------------------------------------------------------------------------
  'flywheel-mass': {
    slug: 'flywheel-mass',
    name: 'Flywheel Mass',
    component: 'flywheel-flexplate',
    system: 'engine',
    definition: 'The rotational inertia of the flywheel affects how quickly the engine accelerates and decelerates.',
    howItWorks: 'Heavy flywheels store more rotational energy, providing smoother idle and easier launches but slower revving. Light flywheels reduce rotating mass, allowing quicker throttle response but potentially rougher idle.',
    whyItMatters: 'Flywheel choice affects driving character significantly. Race applications favor light flywheels for response; street applications need enough mass for smooth operation.',
    modPotential: 'Lightweight flywheels are popular modifications. Chromoly or aluminum flywheels can reduce weight 50%+. Single-mass conversions eliminate dual-mass complexity.',
    relatedUpgradeKeys: ['lightweight-flywheel'],
    status: 'complete',
  },

  // ---------------------------------------------------------------------------
  // ENGINE > ENGINE ARCHITECTURE
  // ---------------------------------------------------------------------------
  'inline-engines': {
    slug: 'inline-engines',
    name: 'Inline Engines',
    component: 'engine-architecture',
    system: 'engine',
    definition: 'Cylinders arranged in a single row. Common configurations include inline-4, inline-5, and inline-6.',
    howItWorks: 'All cylinders share a single cylinder head, simplifying construction. Inline-6 engines are perfectly balanced; inline-4s require balance shafts for smoothness. Inline layout allows easy turbo packaging.',
    whyItMatters: 'Inline engines are typically compact, economical to produce, and easy to work on. The inline-6 is renowned for smoothness and tuning potential.',
    status: 'complete',
  },
  'v-engines': {
    slug: 'v-engines',
    name: 'V Engines',
    component: 'engine-architecture',
    system: 'engine',
    definition: 'Cylinders arranged in two banks at an angle (V-angle). Common configurations include V6, V8, V10, and V12.',
    howItWorks: 'V configuration allows more cylinders in a shorter package. V-angle affects balance, sound, and packaging. 90° is common for V8s; 60° for V6s. Flat-plane vs cross-plane crank affects firing order and character.',
    whyItMatters: 'V engines pack more displacement into compact dimensions. They power most performance and luxury vehicles. V8 sound is iconic to American muscle.',
    status: 'complete',
  },
  'flat-boxer-engines': {
    slug: 'flat-boxer-engines',
    name: 'Flat/Boxer Engines',
    component: 'engine-architecture',
    system: 'engine',
    definition: 'Cylinders arranged horizontally opposing each other. Used by Porsche (flat-6) and Subaru (flat-4).',
    howItWorks: 'Pistons move toward and away from each other, naturally canceling primary and secondary vibrations. Low center of gravity improves handling. Wide layout can complicate packaging.',
    whyItMatters: 'Boxer engines offer excellent balance, low CoG, and distinctive sound. They\'re a defining characteristic of Porsche and Subaru performance vehicles.',
    status: 'complete',
  },
  'rotary-engines': {
    slug: 'rotary-engines',
    name: 'Rotary (Wankel) Engines',
    component: 'engine-architecture',
    system: 'engine',
    definition: 'Uses triangular rotors instead of pistons. Famously used by Mazda in RX-7 and RX-8.',
    howItWorks: 'A triangular rotor orbits eccentrically within an epitrochoid housing, creating three distinct chambers that cycle through intake, compression, combustion, and exhaust. Compact, high-revving, and powerful for displacement.',
    whyItMatters: 'Rotaries offer incredible power density and smoothness but sacrifice fuel efficiency and require specific maintenance. They\'re beloved by enthusiasts for their unique character.',
    status: 'complete',
  },

  // ---------------------------------------------------------------------------
  // ENGINE > ENGINE COOLING
  // ---------------------------------------------------------------------------
  'coolant-system': {
    slug: 'coolant-system',
    name: 'Coolant System',
    component: 'engine-cooling',
    system: 'engine',
    definition: 'Circulates coolant through engine passages and radiator to maintain operating temperature.',
    howItWorks: 'Water pump circulates coolant; thermostat regulates flow based on temperature; radiator transfers heat to air. Modern systems are pressurized to raise boiling point.',
    whyItMatters: 'Proper cooling prevents overheating, which causes head gasket failures, warped heads, and engine damage. Track use stresses cooling systems significantly.',
    modPotential: 'Upgraded radiators, water pumps, and thermostats improve cooling capacity. Critical for high-power or track applications.',
    relatedUpgradeKeys: ['radiator-upgrade'],
    status: 'complete',
  },
  'oil-cooling': {
    slug: 'oil-cooling',
    name: 'Oil Cooling',
    component: 'engine-cooling',
    system: 'engine',
    definition: 'Maintains engine oil at optimal temperature for lubrication and cooling of internal components.',
    howItWorks: 'Oil absorbs heat from bearings, pistons, and other components. Oil coolers (air-to-oil or water-to-oil) remove this heat. Thermostatic control prevents overcooling at startup.',
    whyItMatters: 'Hot oil loses viscosity and protective capability. Oil temp above 275°F accelerates breakdown. Track driving can push stock systems beyond their limits.',
    modPotential: 'Aftermarket oil coolers are essential for track use. Proper oil temp monitoring helps prevent damage.',
    relatedUpgradeKeys: ['oil-cooler'],
    status: 'complete',
  },

  // ---------------------------------------------------------------------------
  // DRIVETRAIN TOPICS (Stubs for now - to be expanded)
  // ---------------------------------------------------------------------------
  'manual-transmission': {
    slug: 'manual-transmission',
    name: 'Manual Transmission',
    component: 'transmission',
    system: 'drivetrain',
    definition: 'A transmission requiring driver-operated clutch and gear selection.',
    howItWorks: 'Synchronizers match shaft speeds for smooth engagement. Gear ratios multiply torque at low speeds and allow high-speed cruising in top gear.',
    whyItMatters: 'Manuals offer direct control, lower weight, and often better reliability than automatics. Preferred by driving enthusiasts for engagement.',
    modPotential: 'Short shifters improve throw; upgraded synchros handle more power; different gear ratios optimize acceleration or top speed.',
    relatedUpgradeKeys: ['short-shifter'],
    status: 'complete',
  },
  'automatic-transmission': {
    slug: 'automatic-transmission',
    name: 'Automatic & DCT',
    component: 'transmission',
    system: 'drivetrain',
    definition: 'Transmissions that shift automatically using torque converters (traditional), clutch packs (DCT), or continuously variable ratio (CVT).',
    howItWorks: 'Traditional automatics use a torque converter and planetary gearsets. DCTs use dual clutches for seamless shifts. Each design has distinct characteristics.',
    whyItMatters: 'Modern automatics often shift faster than humans and can handle more power. DCTs combine automatic convenience with manual engagement.',
    modPotential: 'Transmission tunes improve shift points and firmness. Upgraded clutch packs handle more power in DCTs.',
    relatedUpgradeKeys: ['dct-tune'],
    status: 'complete',
  },
  'clutch-basics': {
    slug: 'clutch-basics',
    name: 'Clutch Fundamentals',
    component: 'clutch',
    system: 'drivetrain',
    definition: 'The friction interface between engine and transmission that enables smooth engagement and disengagement.',
    howItWorks: 'Pressure plate clamps clutch disc against flywheel. Friction material determines grip and feel. Diaphragm or multi-plate designs affect pedal effort and holding capacity.',
    whyItMatters: 'Clutch must handle engine torque without slipping. Increased power often requires upgraded clutch to prevent slippage.',
    modPotential: 'Upgraded clutches range from mild (OE+ materials) to aggressive (ceramic pucks). Match clutch type to driving style.',
    relatedUpgradeKeys: ['clutch-upgrade'],
    status: 'complete',
  },
  'differential-types': {
    slug: 'differential-types',
    name: 'Differential Types (Open, LSD)',
    component: 'differential',
    system: 'drivetrain',
    definition: 'Differentials allow wheels to rotate at different speeds while cornering. Limited-slip differentials (LSDs) control torque distribution.',
    howItWorks: 'Open diffs send power to the wheel with least resistance. LSDs use clutches, gears, or fluid to limit speed differences, keeping both wheels powered.',
    whyItMatters: 'LSD dramatically improves traction under power. Essential for performance driving—an open diff wastes power when one wheel loses traction.',
    modPotential: 'LSD upgrades or conversions transform car behavior. Types include clutch-type, Torsen, and spool for racing.',
    relatedUpgradeKeys: ['limited-slip-diff'],
    status: 'complete',
  },
  'axle-strength': {
    slug: 'axle-strength',
    name: 'Axle & Halfshaft Strength',
    component: 'driveshaft-halfshaft',
    system: 'drivetrain',
    definition: 'Halfshafts (axles) transfer power from differential to wheels. They must handle torque loads and accommodate suspension movement.',
    howItWorks: 'CV joints at each end allow the shaft to operate at varying angles as suspension moves. Material and design determine torque capacity.',
    whyItMatters: 'Axles are a common failure point in high-power FWD and AWD cars. Stock axles have definite torque limits.',
    modPotential: 'Upgraded axles use stronger materials and better CV joints. Essential for builds exceeding stock torque ratings.',
    relatedUpgradeKeys: ['axles-halfshafts'],
    status: 'complete',
  },

  // ---------------------------------------------------------------------------
  // FUEL SYSTEM TOPICS
  // ---------------------------------------------------------------------------
  'lpfp-hpfp': {
    slug: 'lpfp-hpfp',
    name: 'Low & High Pressure Fuel Pumps',
    component: 'fuel-pumps',
    system: 'fuel-system',
    definition: 'LPFP delivers fuel from tank at low pressure (~50-70 psi); HPFP pressurizes it for direct injection (2000-3000+ psi).',
    howItWorks: 'LPFP is typically in the tank. HPFP is cam-driven on DI engines and creates extremely high pressure for precise injection directly into the cylinder.',
    whyItMatters: 'Fuel system capacity limits power potential. When injectors are maxed out, the pump is often the bottleneck preventing more fueling.',
    modPotential: 'LPFP upgrades (or adding a secondary pump) increase flow. HPFP upgrades (internals or full replacement) are essential for big-power DI builds.',
    relatedUpgradeKeys: ['hpfp-upgrade', 'fuel-system-upgrade'],
    status: 'complete',
  },
  'injector-sizing': {
    slug: 'injector-sizing',
    name: 'Injector Sizing',
    component: 'fuel-rail-injectors',
    system: 'fuel-system',
    definition: 'Injector flow rate (measured in cc/min or lb/hr) determines fueling capacity. Size must match power goals.',
    howItWorks: 'Injectors spray fuel into ports (port injection) or directly into cylinders (direct injection). Duty cycle indicates what percentage of time they\'re open—above 85% is risky.',
    whyItMatters: 'Undersized injectors can\'t deliver enough fuel for high power, causing dangerous lean conditions. Oversized injectors hurt idle quality and low-load fuel economy.',
    modPotential: 'Larger injectors require ECU tuning to prevent rich conditions at idle. Match injector size to realistic power goals.',
    relatedUpgradeKeys: ['fuel-system-upgrade'],
    status: 'complete',
  },
  'port-vs-direct': {
    slug: 'port-vs-direct',
    name: 'Port vs Direct Injection',
    component: 'injection-types',
    system: 'fuel-system',
    definition: 'Port injection sprays fuel into intake ports; direct injection sprays directly into cylinders at high pressure.',
    howItWorks: 'Port injection mixes fuel with air before entering the cylinder—simple and effective. Direct injection allows precise control of fuel delivery and timing, improving efficiency but requiring much higher fuel pressure.',
    whyItMatters: 'DI enables higher compression ratios and better efficiency but causes carbon buildup on intake valves. Many modern engines use dual injection systems.',
    modPotential: 'Adding port injection to DI-only engines is common for high-power builds, providing additional fueling capacity and cleaning intake valves.',
    relatedUpgradeKeys: ['fuel-system-upgrade'],
    status: 'complete',
  },
  'fuel-octane': {
    slug: 'fuel-octane',
    name: 'Fuel Octane & Quality',
    component: 'fuel-types',
    system: 'fuel-system',
    definition: 'Octane rating indicates a fuel\'s resistance to knock/detonation. Higher octane allows more aggressive timing.',
    howItWorks: 'Knock occurs when fuel ignites from compression heat before the spark. Higher octane fuels resist this, allowing more ignition advance and boost pressure.',
    whyItMatters: 'Using lower octane than required causes knock and timing retard (or engine damage). Higher octane than needed doesn\'t add power without a tune to take advantage.',
    modPotential: 'E85 (85% ethanol) has ~105 octane equivalent, allowing significant power gains with proper tuning and fueling upgrades.',
    relatedUpgradeKeys: ['flex-fuel-e85'],
    status: 'complete',
  },

  // ---------------------------------------------------------------------------
  // ENGINE MANAGEMENT TOPICS
  // ---------------------------------------------------------------------------
  'ecu-basics': {
    slug: 'ecu-basics',
    name: 'ECU Fundamentals',
    component: 'ecu',
    system: 'engine-management',
    definition: 'The Engine Control Unit reads sensors and controls fuel injection, ignition timing, and many other parameters in real-time.',
    howItWorks: 'ECU runs lookup tables and algorithms based on sensor inputs. It adjusts timing, fueling, boost, and more hundreds of times per second to optimize performance and emissions.',
    whyItMatters: 'The ECU is why modern engines make so much power cleanly. It\'s also why modifications often require tuning—the ECU\'s tables assume stock hardware.',
    modPotential: 'Flash tuning modifies ECU tables for bolt-on mods. Standalone ECUs replace the factory unit entirely for full control.',
    relatedUpgradeKeys: ['ecu-tune', 'tune-street', 'tune-track'],
    status: 'complete',
  },
  'map-maf-sensors': {
    slug: 'map-maf-sensors',
    name: 'MAP & MAF Sensors',
    component: 'sensors',
    system: 'engine-management',
    definition: 'MAF (Mass Air Flow) measures air entering the engine; MAP (Manifold Absolute Pressure) measures pressure in the intake manifold.',
    howItWorks: 'MAF uses a heated element to measure air mass directly. MAP measures vacuum/pressure to infer airflow. Some engines use both; others use one or the other.',
    whyItMatters: 'These sensors are primary inputs for fuel calculations. Failures or inaccuracies cause poor running, reduced power, or check engine lights.',
    modPotential: 'Intake upgrades may require MAF sensor relocation or scaling. Speed density tuning eliminates MAF dependency for modified engines.',
    relatedUpgradeKeys: ['cold-air-intake'],
    status: 'complete',
  },
  'vvt-systems': {
    slug: 'vvt-systems',
    name: 'Variable Valve Timing (VVT)',
    component: 'valve-timing',
    system: 'engine-management',
    definition: 'Systems that adjust camshaft timing relative to crankshaft position, optimizing performance across the RPM range.',
    howItWorks: 'Hydraulic actuators or electric motors rotate camshafts relative to their drive gears. VTEC (Honda) and VANOS (BMW) are famous examples. More advanced systems also vary lift.',
    whyItMatters: 'VVT allows engines to have aggressive cam timing at high RPM while maintaining good low-RPM behavior and idle quality. Best of both worlds.',
    modPotential: 'Tuning can adjust VVT targets for different characteristics. Some builds disable VVT for simplicity with aggressive aftermarket cams.',
    relatedUpgradeKeys: ['camshafts'],
    status: 'complete',
  },
  'ignition-timing': {
    slug: 'ignition-timing',
    name: 'Ignition Timing',
    component: 'ignition-system',
    system: 'engine-management',
    definition: 'When the spark plug fires relative to piston position, measured in degrees before top dead center (BTDC).',
    howItWorks: 'Combustion takes time; spark must occur before TDC so peak pressure hits as the piston descends. More advance = more power, but too much causes knock. ECU retards timing if knock is detected.',
    whyItMatters: 'Timing optimization is a primary source of tuning gains. Knock limits how much timing can be added safely.',
    modPotential: 'Tuning advances timing within safe limits. Better fuel (higher octane) allows more advance.',
    relatedUpgradeKeys: ['ecu-tune'],
    status: 'complete',
  },
  'flash-standalone': {
    slug: 'flash-standalone',
    name: 'Flash Tuning vs Standalone ECU',
    component: 'tuning',
    system: 'engine-management',
    definition: 'Flash tuning modifies factory ECU calibration; standalone ECUs replace it entirely with programmable aftermarket units.',
    howItWorks: 'Flash tunes work within factory ECU architecture—simple and retains OE features. Standalone ECUs offer complete control but require full calibration and lose OE features like cruise control.',
    whyItMatters: 'Most builds only need flash tuning. Standalone is for heavily modified engines where factory ECU limitations become restrictive.',
    modPotential: 'Flash tunes suit most street/track cars. Standalone is for race builds, engine swaps, or situations requiring features the factory ECU can\'t support.',
    relatedUpgradeKeys: ['ecu-tune', 'piggyback-tuner'],
    status: 'complete',
  },

  // More topics will be added as stubs for the remaining systems...
  // ---------------------------------------------------------------------------
  // AIR INTAKE & FORCED INDUCTION TOPICS
  // ---------------------------------------------------------------------------
  'intake-design': {
    slug: 'intake-design',
    name: 'Intake Design Principles',
    component: 'intake-airbox',
    system: 'air-intake',
    definition: 'How intake systems route air from outside the vehicle to the throttle body affects flow, temperature, and noise.',
    howItWorks: 'Cold air is denser, containing more oxygen molecules. Effective intake design draws cold air from outside the engine bay, uses smooth transitions to minimize turbulence, and filters particles without excessive restriction.',
    whyItMatters: 'Air temperature directly affects power—every 10°F reduction in intake temp adds approximately 1% power. Good intake design maximizes both flow and air density.',
    modPotential: 'Aftermarket intakes prioritize flow over noise reduction. Cold air intakes can add 5-15hp on NA engines; more on turbocharged applications.',
    relatedUpgradeKeys: ['cold-air-intake'],
    status: 'complete',
  },
  'turbo-fundamentals': {
    slug: 'turbo-fundamentals',
    name: 'Turbocharger Fundamentals',
    component: 'turbocharger',
    system: 'air-intake',
    definition: 'Turbochargers use exhaust energy to spin a turbine connected to a compressor, forcing more air into the engine.',
    howItWorks: 'Exhaust gases spin the turbine wheel; the compressor wheel on the same shaft compresses intake air. Boost pressure is controlled by a wastegate. Turbo size determines spool characteristics and peak flow.',
    whyItMatters: 'Turbocharging is the most efficient way to add power—using otherwise wasted exhaust energy. Modern turbos can nearly double engine output.',
    modPotential: 'Turbo upgrades range from drop-in larger units to completely custom setups. Supporting mods (fuel, intercooling, tune) are essential.',
    relatedUpgradeKeys: ['turbo-upgrade-existing', 'turbo-kit-single', 'turbo-kit-twin'],
    status: 'complete',
  },
  'supercharger-types': {
    slug: 'supercharger-types',
    name: 'Supercharger Types',
    component: 'supercharger',
    system: 'air-intake',
    definition: 'Mechanically driven compressors providing instant boost response. Types include roots, twin-screw, and centrifugal.',
    howItWorks: 'Roots and twin-screw superchargers are positive displacement, providing boost proportional to RPM with instant response. Centrifugal superchargers spin faster at higher RPM, with power curves similar to turbochargers.',
    whyItMatters: 'Superchargers offer linear power delivery and instant throttle response, unlike turbos which have lag. Trade-off is parasitic loss—the engine drives the compressor.',
    modPotential: 'Supercharger kits for popular platforms can add 100-300+hp. Smaller pulley = more boost.',
    relatedUpgradeKeys: ['supercharger-roots', 'supercharger-centrifugal', 'pulley-tune-sc'],
    status: 'complete',
  },
  'wastegate-bov': {
    slug: 'wastegate-bov',
    name: 'Wastegate & Blow-Off Valve',
    component: 'boost-control',
    system: 'air-intake',
    definition: 'Wastegates control maximum boost; blow-off valves (BOVs) release pressure when throttle closes.',
    howItWorks: 'Wastegates bypass exhaust around the turbine to limit boost. Internal wastegates are built into the turbo housing; external wastegates offer more control. BOVs prevent compressor surge by venting pressure.',
    whyItMatters: 'Proper boost control is essential for reliability. Oversized wastegates prevent boost creep; properly sized BOVs prevent compressor damage.',
    modPotential: 'External wastegates allow higher boost control range. Upgraded BOVs handle higher pressures and seal better.',
    relatedUpgradeKeys: ['turbo-upgrade-existing'],
    status: 'complete',
  },
  'intercooler-types': {
    slug: 'intercooler-types',
    name: 'Intercooler Types & Sizing',
    component: 'intercooler',
    system: 'air-intake',
    definition: 'Intercoolers cool compressed air before it enters the engine. Air-to-air and water-to-air are the two main types.',
    howItWorks: 'Air-to-air intercoolers use ambient air flowing through fins. Water-to-air intercoolers use coolant and are more compact but require a secondary cooling system. Larger cores have more cooling capacity but may add lag.',
    whyItMatters: 'Compressed air is hot; cooling it increases density and prevents knock. Every 10°F reduction in charge temps allows approximately 1 psi more boost safely.',
    modPotential: 'Upgraded intercoolers prevent heat soak on repeated pulls. Essential for high-boost applications.',
    relatedUpgradeKeys: ['intercooler', 'heat-exchanger-sc'],
    status: 'complete',
  },

  // ---------------------------------------------------------------------------
  // EXHAUST TOPICS
  // ---------------------------------------------------------------------------
  'header-design': {
    slug: 'header-design',
    name: 'Header Design & Tuning',
    component: 'headers-manifold',
    system: 'exhaust',
    definition: 'Headers collect exhaust from individual cylinders and merge them for optimal flow. Tube length and diameter affect power band.',
    howItWorks: 'Equal-length headers (EL) provide balanced exhaust pulses. Long-tube headers favor top-end power; shorty headers favor mid-range. Primary and collector sizing must match engine displacement and RPM range.',
    whyItMatters: 'Well-designed headers reduce backpressure and can use exhaust pulse tuning to improve scavenging. Significant gains possible on NA engines.',
    modPotential: 'Header upgrades on NA engines can add 15-30hp with proper tuning. Always requires ECU recalibration.',
    relatedUpgradeKeys: ['headers'],
    status: 'complete',
  },
  'downpipe-importance': {
    slug: 'downpipe-importance',
    name: 'Downpipe Flow',
    component: 'downpipe',
    system: 'exhaust',
    definition: 'The downpipe connects the turbocharger to the rest of the exhaust system. It\'s the most restrictive point in most turbo exhausts.',
    howItWorks: 'Stock downpipes are small and contain restrictive catalytic converters to meet emissions. Larger, freer-flowing downpipes reduce backpressure at the turbine, improving spool and top-end power.',
    whyItMatters: 'Downpipe upgrades are one of the biggest single modifications for turbocharged cars—often worth 30-50hp with a tune.',
    modPotential: 'Catless downpipes offer maximum flow but have emissions implications. High-flow catted downpipes balance performance with street legality.',
    relatedUpgradeKeys: ['downpipe'],
    status: 'complete',
  },
  'cat-types': {
    slug: 'cat-types',
    name: 'Catalytic Converter Types',
    component: 'catalytic-converter',
    system: 'exhaust',
    definition: 'Catalytic converters reduce harmful emissions. High-flow cats reduce restriction while maintaining emissions compliance.',
    howItWorks: 'Cats use precious metals (platinum, palladium, rhodium) as catalysts to convert NOx, CO, and hydrocarbons to less harmful compounds. Cell density affects flow vs effectiveness.',
    whyItMatters: 'Stock cats are restrictive. High-flow cats (200-cell vs stock 400-600 cell) reduce backpressure while maintaining most emissions reduction.',
    modPotential: 'High-flow cats are the street-legal option. Test pipes/cat deletes are for off-road/race use only.',
    relatedUpgradeKeys: ['downpipe'],
    status: 'complete',
  },
  'exhaust-sound': {
    slug: 'exhaust-sound',
    name: 'Exhaust Sound Engineering',
    component: 'resonator-muffler',
    system: 'exhaust',
    definition: 'Resonators and mufflers control exhaust tone and volume. Design determines character from subtle to aggressive.',
    howItWorks: 'Resonators cancel specific frequencies (often drone-causing ones). Mufflers use chambers, baffles, or packing material to reduce overall volume. Straight-through designs flow best but are loudest.',
    whyItMatters: 'Exhaust character defines much of a car\'s personality. The right setup provides the sound you want without drone or excessive volume.',
    modPotential: 'Cat-back exhausts offer the best balance of sound change and easy installation. Muffler deletes are cheap but often too loud.',
    relatedUpgradeKeys: ['cat-back-exhaust', 'muffler-delete', 'resonator-delete'],
    status: 'complete',
  },

  // ---------------------------------------------------------------------------
  // SUSPENSION TOPICS (Stubs to be expanded)
  // ---------------------------------------------------------------------------
  'spring-rate-basics': {
    slug: 'spring-rate-basics',
    name: 'Spring Rate Fundamentals',
    component: 'springs',
    system: 'suspension',
    definition: 'Spring rate is the force required to compress a spring one inch (lb/in) or one millimeter (N/mm). It determines ride stiffness.',
    howItWorks: 'Stiffer springs resist body roll and dive/squat but transmit more road imperfections. Linear springs have constant rate; progressive springs get stiffer through travel.',
    whyItMatters: 'Spring rate must be balanced with damper valving. Too stiff without proper damping leads to poor ride and handling.',
    modPotential: 'Spring upgrades range from mild (OE+) to aggressive race rates. Must be matched to dampers and intended use.',
    relatedUpgradeKeys: ['lowering-springs', 'coilovers-street', 'coilovers-track'],
    status: 'complete',
  },
  'damper-valving': {
    slug: 'damper-valving',
    name: 'Damper Valving & Adjustment',
    component: 'shocks-dampers',
    system: 'suspension',
    definition: 'Dampers (shocks) control the rate of spring compression and extension through internal valving.',
    howItWorks: 'Valving controls oil flow through internal passages. Compression damping resists downward motion; rebound damping resists upward motion. Adjustable dampers allow tuning for different conditions.',
    whyItMatters: 'Dampers determine how the car responds to bumps and weight transfer. Worn dampers compromise handling and ride quality.',
    modPotential: 'Quality adjustable dampers transform handling. Match damper capability to spring rates for optimal performance.',
    relatedUpgradeKeys: ['coilovers-street', 'coilovers-track'],
    status: 'complete',
  },
  'coilover-adjustment': {
    slug: 'coilover-adjustment',
    name: 'Coilover Setup & Adjustment',
    component: 'coilovers',
    system: 'suspension',
    definition: 'Coilovers combine spring and damper in one unit with height adjustment. Quality units offer damping adjustment.',
    howItWorks: 'Threaded body allows ride height changes. Spring perches adjust preload. Single-adjustable dampers control compression and rebound together; dual-adjustable controls them separately.',
    whyItMatters: 'Proper coilover setup is crucial. Corner balancing, ride height, and damping settings must be dialed for the intended use.',
    modPotential: 'Coilovers are the most common handling upgrade. Quality varies enormously—cheap coilovers often ride worse than stock.',
    relatedUpgradeKeys: ['coilovers-street', 'coilovers-track'],
    status: 'complete',
  },
  'alignment-settings': {
    slug: 'alignment-settings',
    name: 'Alignment Settings Explained',
    component: 'alignment',
    system: 'suspension',
    definition: 'Camber, caster, and toe angles determine how tires contact the road and affect handling, tire wear, and straight-line stability.',
    howItWorks: 'Camber is wheel tilt (negative = top in). Caster is steering axis tilt (more = stability). Toe is whether wheels point in or out. Each affects handling characteristics differently.',
    whyItMatters: 'Proper alignment maximizes tire contact patch for grip. Street vs track alignments differ significantly.',
    modPotential: 'Performance alignments add negative camber for cornering grip. Requires alignment after any suspension change.',
    relatedUpgradeKeys: ['performance-alignment'],
    status: 'complete',
  },
  'tire-compound-construction': {
    slug: 'tire-compound-construction',
    name: 'Tire Compound & Construction',
    component: 'tires-specs',
    system: 'suspension',
    definition: 'Tire compound (rubber formulation) and construction determine grip, wear, and temperature sensitivity.',
    howItWorks: 'Softer compounds grip better but wear faster. Treadwear ratings roughly indicate longevity (lower = stickier). Construction affects sidewall stiffness, which impacts response and ride.',
    whyItMatters: 'Tires are the single biggest handling factor. The right tires make more difference than most suspension mods.',
    modPotential: 'Tire selection should match use case. Street tires for daily driving, summer performance for spirited driving, track tires for HPDE.',
    relatedUpgradeKeys: ['performance-tires', 'tires-track', 'competition-tires'],
    status: 'complete',
  },

  // ---------------------------------------------------------------------------
  // AERODYNAMICS TOPICS
  // ---------------------------------------------------------------------------
  'downforce-drag': {
    slug: 'downforce-drag',
    name: 'Downforce vs Drag',
    component: 'aero-principles',
    system: 'aerodynamics',
    definition: 'Downforce pushes the car toward the ground, increasing grip. Drag resists forward motion. Most aero devices trade off between them.',
    howItWorks: 'Wings and splitters create low pressure above/behind them, generating downforce. This increases tire grip but also creates drag. Efficiency is measured by lift-to-drag ratio.',
    whyItMatters: 'At high speeds, aero forces can exceed the weight of the car. Downforce dramatically increases cornering speed but affects top speed.',
    modPotential: 'Effective aero requires speed to work. Below 60mph, effects are minimal. At 100+mph, effects are dramatic.',
    relatedUpgradeKeys: ['front-splitter', 'rear-wing'],
    status: 'complete',
  },
  'splitter-function': {
    slug: 'splitter-function',
    name: 'Front Splitter Function',
    component: 'front-aero',
    system: 'aerodynamics',
    definition: 'A flat plate extending from the front bumper that generates front downforce by creating a high-pressure zone above.',
    howItWorks: 'Air hitting the front of the car slows down (high pressure). The splitter seals this high-pressure zone from escaping underneath, pushing the front down. Splitter size and rake affect effectiveness.',
    whyItMatters: 'Front downforce improves turn-in and front grip. Must be balanced with rear aero to maintain neutral handling.',
    modPotential: 'Splitters range from subtle OEM+ lips to aggressive race splitters. Effectiveness depends on proper sealing and ride height.',
    relatedUpgradeKeys: ['front-splitter', 'splitter'],
    status: 'complete',
  },
  'wing-vs-spoiler': {
    slug: 'wing-vs-spoiler',
    name: 'Wing vs Spoiler',
    component: 'rear-aero',
    system: 'aerodynamics',
    definition: 'Wings are airfoils generating downforce; spoilers disrupt airflow to reduce lift. They work differently and serve different purposes.',
    howItWorks: 'Wings are inverted airfoils—low pressure on top creates downforce. Angle of attack adjusts downforce/drag trade-off. Spoilers interrupt airflow over the rear glass, reducing lift and sometimes drag.',
    whyItMatters: 'True wings generate significant downforce but add drag. Spoilers are subtler but less effective. Match device to performance goals.',
    modPotential: 'Adjustable wings allow tuning for different tracks/conditions. Factory spoilers are mostly cosmetic; aftermarket wings can be functional.',
    relatedUpgradeKeys: ['rear-wing', 'wing'],
    status: 'complete',
  },

  // ---------------------------------------------------------------------------
  // BRAKES TOPICS
  // ---------------------------------------------------------------------------
  'rotor-design': {
    slug: 'rotor-design',
    name: 'Rotor Design & Materials',
    component: 'brake-rotors',
    system: 'brakes',
    definition: 'Brake rotors absorb and dissipate heat from friction. Design affects cooling capacity, weight, and performance.',
    howItWorks: 'Vented rotors have internal cooling channels. Drilled rotors have holes for gas escape and heat dissipation. Slotted rotors have grooves that clean the pad surface and improve wet grip.',
    whyItMatters: 'Rotor thermal capacity determines fade resistance. Track use generates enormous heat; street driving rarely stresses rotors significantly.',
    modPotential: 'For most street use, quality OEM-spec rotors are sufficient. Track use benefits from larger rotors or high-performance materials.',
    relatedUpgradeKeys: ['slotted-rotors', 'big-brake-kit'],
    status: 'complete',
  },
  'pad-compounds': {
    slug: 'pad-compounds',
    name: 'Brake Pad Compounds',
    component: 'brake-pads',
    system: 'brakes',
    definition: 'Pad friction material determines bite, fade resistance, rotor wear, and noise characteristics.',
    howItWorks: 'Organic pads are quiet and gentle on rotors but fade early. Semi-metallic pads handle heat better but may be noisier. Race compounds need heat to work and are too aggressive for street use.',
    whyItMatters: 'Pad selection is critical for intended use. Track pads on the street are dangerous—they don\'t grip until hot.',
    modPotential: 'Street-performance pads improve fade resistance while maintaining cold bite. Track-only pads should not be used on public roads.',
    relatedUpgradeKeys: ['brake-pads-street', 'brake-pads-track'],
    status: 'complete',
  },
  'bbk-basics': {
    slug: 'bbk-basics',
    name: 'Big Brake Kit Fundamentals',
    component: 'brake-calipers',
    system: 'brakes',
    definition: 'BBKs upgrade calipers, rotors, and often pads as a system, providing increased stopping power and fade resistance.',
    howItWorks: 'Larger rotors provide more leverage (torque) and thermal mass. Multi-piston calipers spread clamping force evenly and resist pad taper. The complete system works together.',
    whyItMatters: 'BBKs are essential for serious track use with high-grip tires. Stock brakes may not handle the increased forces.',
    modPotential: 'BBKs range from mild increases to full race systems. Must verify wheel clearance before purchase.',
    relatedUpgradeKeys: ['big-brake-kit'],
    status: 'complete',
  },
  'brake-fluid-types': {
    slug: 'brake-fluid-types',
    name: 'Brake Fluid Types & Boiling Points',
    component: 'brake-fluid-lines',
    system: 'brakes',
    definition: 'Brake fluid transmits pedal force hydraulically. Dry and wet boiling points determine heat tolerance.',
    howItWorks: 'DOT 3/4/5.1 are glycol-based and absorb water over time (hygroscopic), lowering boiling point. Racing fluids have higher boiling points but may need more frequent changes.',
    whyItMatters: 'When fluid boils, the pedal goes to the floor—no brakes. Track use can easily boil stock fluid. Fresh high-temp fluid is essential.',
    modPotential: 'Upgrade to DOT 4 or racing fluid for track use. Flush before track days. Braided lines improve pedal feel.',
    relatedUpgradeKeys: ['brake-fluid-lines', 'high-temp-brake-fluid', 'braided-brake-lines'],
    status: 'complete',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all systems as an ordered array.
 * @returns {EncyclopediaSystem[]}
 */
export function getSystemsOrdered() {
  return Object.values(encyclopediaSystems).sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get components for a specific system.
 * @param {string} systemSlug
 * @returns {EncyclopediaComponent[]}
 */
export function getComponentsForSystem(systemSlug) {
  return Object.values(encyclopediaComponents)
    .filter(c => c.system === systemSlug)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Get topics for a specific component.
 * Since new topics are organized by system (not component), this returns
 * topics for the component's parent system.
 * @param {string} componentSlug
 * @returns {EncyclopediaTopic[]}
 */
export function getTopicsForComponent(componentSlug) {
  // Get the component to find its parent system
  const component = encyclopediaComponents[componentSlug];
  if (!component) return [];
  
  // Map component's system slug to the topic system slug format
  const systemSlug = component.system;
  
  // System slug mapping (hierarchySystems -> topicSystems)
  // Some topic files use different system slugs than the hierarchy
  const systemMapping = {
    'engine': ['engine', 'cooling'], // cooling topics are part of engine system
    'drivetrain': ['drivetrain'],
    'fuel-system': ['fuel-system'],
    'engine-management': ['engine-management'],
    'air-intake': ['intake-forced-induction'],
    'exhaust': ['exhaust'],
    'suspension': ['suspension-steering'],
    'aerodynamics': ['aerodynamics'],
    'brakes': ['brakes'],
  };
  
  const topicSystemSlugs = systemMapping[systemSlug] || [systemSlug];
  
  // Return topics for these systems
  return Object.values(encyclopediaTopics)
    .filter(t => topicSystemSlugs.includes(t.system));
}

/**
 * Get topics for a specific system (using topic system slug).
 * @param {string} systemSlug - Topic system slug (e.g., 'engine', 'cooling', 'suspension-steering')
 * @returns {EncyclopediaTopic[]}
 */
export function getTopicsForSystem(systemSlug) {
  return Object.values(encyclopediaTopics)
    .filter(t => t.system === systemSlug);
}

/**
 * Get a topic by slug.
 * @param {string} topicSlug
 * @returns {EncyclopediaTopic | null}
 */
export function getTopicBySlug(topicSlug) {
  return encyclopediaTopics[topicSlug] || null;
}

/**
 * Get topics related to an upgrade key.
 * @param {string} upgradeKey
 * @returns {EncyclopediaTopic[]}
 */
export function getTopicsForUpgrade(upgradeKey) {
  const topicSlugs = upgradeKeyToTopics[upgradeKey] || [];
  return topicSlugs.map(slug => encyclopediaTopics[slug]).filter(Boolean);
}

/**
 * Get all stub topics that need content.
 * @returns {EncyclopediaTopic[]}
 */
export function getStubTopics() {
  return Object.values(encyclopediaTopics).filter(t => t.status === 'stub');
}

/**
 * Get complete topics.
 * @returns {EncyclopediaTopic[]}
 */
export function getCompleteTopics() {
  return Object.values(encyclopediaTopics).filter(t => t.status === 'complete');
}

/**
 * Get statistics about the encyclopedia hierarchy.
 * @returns {Object}
 */
export function getHierarchyStats() {
  const systems = Object.keys(encyclopediaSystems).length;
  const components = Object.keys(encyclopediaComponents).length;
  const topics = Object.values(encyclopediaTopics);
  const complete = topics.filter(t => t.status === 'complete').length;
  const stubs = topics.filter(t => t.status === 'stub').length;
  
  return {
    systems,
    components,
    topics: topics.length,
    complete,
    stubs,
    completionRate: Math.round((complete / topics.length) * 100),
  };
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

export default {
  encyclopediaSystems,
  encyclopediaComponents,
  encyclopediaTopics,
  upgradeKeyToTopics,
  getSystemsOrdered,
  getComponentsForSystem,
  getTopicsForComponent,
  getTopicBySlug,
  getTopicsForUpgrade,
  getStubTopics,
  getCompleteTopics,
  getHierarchyStats,
};











