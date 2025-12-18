/**
 * ENGINE MANAGEMENT TOPICS - Complete Encyclopedia Content
 * 
 * 14 comprehensive topics covering engine control and tuning.
 * All topics have full educational content - no stubs.
 * 
 * @module encyclopediaTopics/engineManagement
 */

export const engineManagementTopics = [
  {
    slug: 'ecu',
    name: 'Engine Control Unit (ECU)',
    system: 'engine-management',
    
    definition: 'The Engine Control Unit (ECU), also called the Engine Control Module (ECM) or Powertrain Control Module (PCM), is the computer that controls all aspects of engine operation. It reads sensor inputs, processes data against programmed maps and logic, and controls outputs including fuel injection, ignition timing, and various actuators.',
    
    howItWorks: 'The ECU continuously reads inputs from dozens of sensors—crankshaft position, camshaft position, airflow/pressure, throttle position, coolant temp, oxygen sensors, knock sensors, and more. Using this data, it calculates optimal fuel injection timing and duration, ignition timing, idle speed, and manages systems like variable valve timing, EGR, and boost control. Calculations happen thousands of times per second. The ECU stores calibration data in flash memory—this is what gets modified during "tuning."',
    
    whyItMatters: 'The ECU is the brain that makes modern engine performance possible. Stock ECU calibrations are conservative compromises for fuel economy, emissions, reliability, and performance across all conditions and fuel qualities. Custom tuning optimizes these calibrations for specific goals, often unlocking significant power, improving throttle response, or enabling modifications that stock software doesn\'t support.',
    
    commonTypes: [
      'OEM ECU (factory, can often be flashed)',
      'Reflashed OEM (modified calibration)',
      'Standalone ECU (full replacement)',
      'Piggyback ECU (intercepts and modifies signals)',
      'Open-source ECU (MegaSquirt, Speeduino)'
    ],
    
    keySpecs: [
      'Processing speed',
      'I/O channel count',
      'Tuning interface (OBD, proprietary)',
      'Logging capability',
      'Security/encryption level'
    ],
    
    signs: {
      good: [
        'Engine runs smoothly',
        'No check engine lights',
        'Proper sensor readings',
        'Expected power output'
      ],
      bad: [
        'Check engine light/fault codes',
        'Limp mode activation',
        'Poor running or no start',
        'Communication errors',
        'Erratic behavior (failing ECU)'
      ]
    },
    
    modPotential: {
      summary: 'ECU tuning is the foundation of most performance modifications, unlocking power and enabling other mods.',
      gains: 'Typical gains of 5-15% power stock, more with supporting mods. Enables higher boost, advanced timing, rev limit increases.',
      considerations: 'Quality of tune matters enormously. Professional tuning recommended for significant power. Warranty implications. Datalogging essential for verification.'
    },
    
    relatedTopics: ['ecu-tuning', 'flash-reflash', 'standalone-ecu', 'piggyback-ecu', 'data-logging'],
    relatedUpgradeKeys: ['ecu-tune'],
    status: 'complete'
  },

  {
    slug: 'tcu',
    name: 'Transmission Control Unit (TCU)',
    system: 'engine-management',
    
    definition: 'The Transmission Control Unit (TCU) is the computer that controls automatic and dual-clutch transmissions. It determines when and how to shift based on inputs including vehicle speed, throttle position, engine load, and driver inputs. Modern TCUs can execute shifts in under 100 milliseconds.',
    
    howItWorks: 'The TCU reads inputs from transmission sensors (input/output speed, fluid temp, gear position), the ECU (engine load, throttle), and driver controls (shifter position, paddle inputs). Using shift maps, it calculates optimal shift points and controls solenoids in the valve body to engage clutches and bands. It also manages torque converter lock-up, line pressure, and adapts to driver behavior and component wear over time.',
    
    whyItMatters: 'TCU calibration dramatically affects how an automatic or DCT drives. Stock calibrations prioritize smoothness and fuel economy; performance calibrations can hold gears longer, shift faster and firmer, and respond more aggressively to throttle input. TCU tuning is essential to maximize performance of automatic-equipped vehicles.',
    
    commonTypes: [
      'Integrated with ECU (some vehicles)',
      'Standalone TCU (most vehicles)',
      'Mechatronics unit (valve body + TCU)',
      'Tunable via OBD',
      'Replaced/standalone (racing)'
    ],
    
    keySpecs: [
      'Shift speed capability',
      'Adaptation algorithms',
      'Number of shift maps/modes',
      'Integration with engine management',
      'Tuning accessibility'
    ],
    
    signs: {
      good: [
        'Smooth, well-timed shifts',
        'Responsive to driver input',
        'No slipping or flaring',
        'Quick kickdowns'
      ],
      bad: [
        'Harsh or delayed shifts',
        'Gear hunting',
        'Transmission fault codes',
        'Limp mode',
        'Slipping or flaring shifts'
      ]
    },
    
    modPotential: {
      summary: 'TCU tuning improves shift speed, firmness, and behavior, transforming automatic driving experience.',
      gains: 'Faster shifts (20-50% improvement common), higher shift points, firmer engagement, better kickdown response.',
      considerations: 'Aggressive tuning can increase clutch/band wear. Must match engine tune power levels. Some TCUs are encrypted/difficult to tune.'
    },
    
    relatedTopics: ['automatic-transmission', 'automated-manual', 'mechatronics', 'ecu'],
    relatedUpgradeKeys: ['transmission-tune'],
    status: 'complete'
  },

  {
    slug: 'map-sensor',
    name: 'MAP Sensor',
    system: 'engine-management',
    
    definition: 'The Manifold Absolute Pressure (MAP) sensor measures the pressure inside the intake manifold, providing the ECU with a primary load signal. In speed-density systems (no MAF), the MAP sensor is the main input for calculating airflow. It also detects boost pressure in turbocharged applications.',
    
    howItWorks: 'The MAP sensor uses a piezoresistive or capacitive element that changes electrical output based on pressure. It measures absolute pressure—not relative to atmospheric—typically in the range of 0-1 bar for NA engines or higher for boosted engines (3, 4, or 5 bar sensors for high-boost applications). The ECU uses MAP readings combined with intake air temperature and engine speed to calculate air mass entering the engine.',
    
    whyItMatters: 'MAP is a fundamental engine load measurement. On forced induction engines, the MAP sensor reading directly indicates boost pressure. Failed or inaccurate MAP sensors cause poor fuel delivery calculations, affecting power, economy, and drivability. High-boost applications require upgraded sensors with higher pressure ratings.',
    
    commonTypes: [
      '1-bar (NA engines, up to 0 PSI boost)',
      '2-bar (mild boost, ~15 PSI)',
      '3-bar (performance, ~30 PSI)',
      '4-bar (high performance, ~44 PSI)',
      '5-bar (extreme, ~58 PSI)'
    ],
    
    keySpecs: [
      'Pressure range (bar or PSI)',
      'Output type (voltage, frequency)',
      'Accuracy',
      'Response time',
      'Operating temperature range'
    ],
    
    signs: {
      good: [
        'Reads ~14.7 PSI at sea level (key on, engine off)',
        'Drops to 8-12 PSI at idle (vacuum)',
        'Rises smoothly with throttle',
        'Accurate boost readings'
      ],
      bad: [
        'Erratic readings',
        'Incorrect idle pressure',
        'Slow response to throttle',
        'MAP sensor codes',
        'Engine runs rich or lean'
      ]
    },
    
    modPotential: {
      summary: 'Higher-range MAP sensors are required when exceeding the stock sensor\'s pressure range.',
      gains: 'Proper boost measurement enables correct fueling at high boost levels.',
      considerations: 'Must recalibrate ECU for new MAP sensor range. GM 3-bar sensors are popular swaps. Wiring may need modification. $30-150 depending on type.'
    },
    
    relatedTopics: ['maf-sensor', 'ecu', 'ecu-tuning', 'turbocharger'],
    relatedUpgradeKeys: ['map-sensor-upgrade'],
    status: 'complete'
  },

  {
    slug: 'maf-sensor',
    name: 'MAF Sensor',
    system: 'engine-management',
    
    definition: 'The Mass Air Flow (MAF) sensor directly measures the mass of air entering the engine, typically using a heated wire or film element. This provides the ECU with accurate airflow data without needing to calculate it from pressure and temperature, making fuel calculations more precise.',
    
    howItWorks: 'Most modern MAF sensors use a hot-wire or hot-film element heated to a specific temperature above ambient. As air flows past, it cools the element, and the sensor measures how much current is needed to maintain temperature—more airflow requires more current. The ECU converts this signal to air mass (grams/second) using a calibration table. Some sensors also include an intake air temperature sensor.',
    
    whyItMatters: 'MAF sensors provide direct air mass measurement, which is the most accurate input for fuel calculations. However, they\'re sensitive to contamination (oil from aftermarket filters) and modifications that change airflow patterns (cold air intakes). When you modify intake systems, MAF sensor scaling often needs adjustment in the ECU tune.',
    
    commonTypes: [
      'Hot-wire (older, less common)',
      'Hot-film (most modern vehicles)',
      'Analog output (voltage varies with flow)',
      'Digital output (frequency varies with flow)',
      'Integrated with intake tube vs standalone'
    ],
    
    keySpecs: [
      'Flow capacity (grams/second)',
      'Accuracy (%)',
      'Response time',
      'Housing diameter',
      'Output type (voltage or frequency)'
    ],
    
    signs: {
      good: [
        'Consistent readings at steady state',
        'Smooth response to throttle',
        'Matches expected airflow for engine size',
        'No contamination on element'
      ],
      bad: [
        'Erratic readings',
        'Inconsistent idle',
        'Poor throttle response',
        'MAF codes/check engine light',
        'Rich or lean running'
      ]
    },
    
    modPotential: {
      summary: 'MAF sensor upgrades or scaling is needed when airflow exceeds stock sensor capacity.',
      gains: 'Higher-flow MAF housings support more power. Proper scaling enables accurate fueling with intake mods.',
      considerations: 'Aftermarket intakes often require MAF recalibration. Oiled filters can contaminate MAF. Some tuners delete MAF and run speed-density (MAP-based).'
    },
    
    relatedTopics: ['map-sensor', 'ecu', 'cold-air-intake', 'ecu-tuning'],
    relatedUpgradeKeys: ['maf-sensor-upgrade'],
    status: 'complete'
  },

  {
    slug: 'o2-sensor',
    name: 'O2 Sensor / Wideband',
    system: 'engine-management',
    
    definition: 'Oxygen sensors (O2 sensors) measure the oxygen content in exhaust gases, allowing the ECU to determine if the engine is running rich or lean. Narrowband sensors indicate rich/lean relative to stoichiometric, while wideband sensors measure the actual air/fuel ratio across a wide range—essential for tuning.',
    
    howItWorks: 'Narrowband sensors use a zirconia element that generates a voltage based on the difference in oxygen between exhaust and ambient air. They switch rapidly between ~0.1V (lean) and ~0.9V (rich) around stoichiometric (14.7:1). Wideband sensors use a more complex pumping cell design that actively maintains a reference cell at stoichiometric, measuring the current required to do so—this current corresponds directly to AFR across a range of roughly 10:1 to 20:1.',
    
    whyItMatters: 'O2 sensors are essential for emissions control and closed-loop fuel trim. For tuning, wideband sensors are critical—you can\'t safely tune without knowing actual AFR. Stock narrowband sensors only tell you "rich" or "lean," not by how much. Every serious tuner uses wideband sensors for datalogging and real-time monitoring.',
    
    commonTypes: [
      'Narrowband (stock, rich/lean only)',
      'Wideband (tuning, actual AFR)',
      'Heated (faster light-off)',
      'Pre-cat (primary feedback)',
      'Post-cat (catalyst monitor)',
      'LSU 4.2 / LSU 4.9 (common wideband types)'
    ],
    
    keySpecs: [
      'Type (narrowband/wideband)',
      'Range (wideband typically 10:1-20:1)',
      'Response time',
      'Operating temperature',
      'Heater wattage'
    ],
    
    signs: {
      good: [
        'Rapid switching at cruise (narrowband)',
        'Stable readings at target AFR (wideband)',
        'Quick heater warm-up',
        'No O2 sensor codes'
      ],
      bad: [
        'Slow response or lazy switching',
        'Stuck rich or lean',
        'O2 sensor heater codes',
        'Inconsistent readings',
        'Contaminated sensor (silicone, lead)'
      ]
    },
    
    modPotential: {
      summary: 'Wideband O2 sensors are essential for tuning—install one before any serious engine work.',
      gains: 'Accurate AFR monitoring enables safe tuning. Catch lean conditions before engine damage.',
      considerations: 'Wideband sensors with gauges cost $150-400. Weld-in bungs may be needed. Position affects readings (turbulence, heat). Some tuners log dual widebands for bank balance.'
    },
    
    relatedTopics: ['air-fuel-ratio', 'ecu-tuning', 'data-logging', 'catalytic-converter'],
    relatedUpgradeKeys: ['wideband-o2'],
    status: 'complete'
  },

  {
    slug: 'valve-timing',
    name: 'Valve Timing',
    system: 'engine-management',
    
    definition: 'Valve timing refers to when the intake and exhaust valves open and close relative to piston position, expressed in crankshaft degrees. Timing events include intake open (IO), intake close (IC), exhaust open (EO), and exhaust close (EC). The overlap period when both valves are slightly open significantly affects engine character.',
    
    howItWorks: 'Valve timing is primarily determined by camshaft lobe profiles and the cam\'s position relative to the crankshaft (set by the timing chain/belt). Intake valve opening begins before TDC to take advantage of exhaust scavenging; intake closing after BDC uses intake momentum to pack more air in. Exhaust valves open before BDC to start releasing pressure; they close after TDC during overlap. Advancing cam timing moves events earlier (more low-end torque); retarding moves them later (more top-end power).',
    
    whyItMatters: 'Valve timing is fundamental to engine performance. The ideal timing for idle differs dramatically from high-RPM power. Fixed cam timing is always a compromise. Variable valve timing systems (VTEC, VANOS, VVT-i) adjust timing across the RPM range, providing both good idle/low-RPM behavior and strong top-end performance.',
    
    commonTypes: [
      'Fixed timing (traditional)',
      'Variable intake timing (most modern engines)',
      'Variable intake and exhaust timing',
      'Multi-stage (VTEC, MIVEC)',
      'Continuously variable (VVT-i, VANOS)',
      'Cam phasing vs cam switching'
    ],
    
    keySpecs: [
      'Intake/exhaust duration',
      'Valve overlap',
      'Centerline (intake and exhaust)',
      'Lobe separation angle',
      'Advance/retard range (variable systems)'
    ],
    
    signs: {
      good: [
        'Smooth idle',
        'Strong power across RPM range',
        'No timing belt/chain noise',
        'VVT engaging properly'
      ],
      bad: [
        'Rough idle (excessive overlap)',
        'Weak low-end or top-end (wrong timing)',
        'Timing chain rattle',
        'VVT fault codes',
        'Misfires at specific RPM ranges'
      ]
    },
    
    modPotential: {
      summary: 'Valve timing modifications range from adjustable cam gears to complete cam upgrades.',
      gains: 'Optimized timing adds 3-10% power in target RPM range. Aggressive cams can add 15-30%+ on NA engines.',
      considerations: 'Cam timing affects idle quality and emissions. Adjustable cam gears allow fine-tuning. Significant changes require matching springs and tune.'
    },
    
    relatedTopics: ['camshaft', 'variable-valve-timing', 'valvetrain', 'cylinder-head'],
    relatedUpgradeKeys: ['camshafts', 'cam-gears'],
    status: 'complete'
  },

  {
    slug: 'variable-valve-timing',
    name: 'Variable Valve Timing (VVT/VTEC/VANOS)',
    system: 'engine-management',
    
    definition: 'Variable valve timing (VVT) systems adjust camshaft timing and/or lift during engine operation, optimizing for different conditions. This allows engines to have smooth idle and low-end torque while still producing strong high-RPM power—previously mutually exclusive characteristics with fixed cams.',
    
    howItWorks: 'Most VVT systems use oil pressure-actuated cam phasers that rotate the camshaft relative to the sprocket, advancing or retarding timing. Honda\'s VTEC switches between two different cam lobe profiles for different lift and duration. BMW\'s VANOS phases both intake and exhaust cams continuously. The ECU controls these systems based on RPM, load, temperature, and throttle position, constantly optimizing timing.',
    
    whyItMatters: 'VVT is why modern engines can pass emissions tests at idle, get decent fuel economy, AND make impressive power. Before VVT, you chose between a street cam (good idle, weak top-end) or a race cam (lumpy idle, strong top-end). VVT provides both. When tuning, VVT calibration is as important as fuel and timing maps.',
    
    commonTypes: [
      'VVT-i (Toyota, continuous phasing)',
      'VTEC (Honda, cam switching)',
      'i-VTEC (Honda, phasing + switching)',
      'VANOS (BMW, continuous phasing)',
      'Double VANOS (BMW, intake + exhaust)',
      'VVL (Nissan, variable lift)',
      'MIVEC (Mitsubishi)'
    ],
    
    keySpecs: [
      'Phasing range (degrees)',
      'Lift change (mm, if applicable)',
      'Actuation type (hydraulic, electric)',
      'Switching RPM (for VTEC-type)',
      'Response time'
    ],
    
    signs: {
      good: [
        'Smooth VTEC/VVT engagement',
        'Strong power across RPM range',
        'No VVT fault codes',
        'Proper oil pressure to actuators'
      ],
      bad: [
        'Harsh VTEC engagement',
        'VVT rattle at startup',
        'Fault codes for cam position',
        'Poor power in certain RPM ranges',
        'Sludged VVT solenoids'
      ]
    },
    
    modPotential: {
      summary: 'VVT tuning optimizes cam phasing across the RPM range for modified engines.',
      gains: 'Custom VVT maps can add 5-15 HP by optimizing phasing for modifications. VTEC engagement point can be lowered for earlier access to high-cam power.',
      considerations: 'VVT systems require clean oil for proper function. Aftermarket cams may limit VVT range. VVT delete simplifies some racing applications.'
    },
    
    relatedTopics: ['valve-timing', 'camshaft', 'ecu-tuning', 'oil-pressure'],
    relatedUpgradeKeys: ['vvt-tune', 'camshafts'],
    status: 'complete'
  },

  {
    slug: 'knock-detection',
    name: 'Knock Detection',
    system: 'engine-management',
    
    definition: 'Knock detection systems use sensors to identify engine knock (pre-ignition/detonation) and trigger the ECU to retard timing and protect the engine. Knock occurs when fuel auto-ignites from compression heat before the spark plug fires, creating damaging pressure spikes.',
    
    howItWorks: 'Knock sensors are essentially microphones tuned to the frequency of knock (~5-7 kHz typically). They\'re mounted on the block and detect the high-frequency vibration signature of detonation. The ECU continuously monitors knock sensor output, filtering out normal engine noise to identify knock events. When knock is detected, the ECU immediately retards timing (removes degrees) to stop the knock, then slowly re-advances timing to find the edge of knock.',
    
    whyItMatters: 'Knock destroys engines—it breaks ring lands, cracks pistons, and hammers bearings. Modern engines run aggressively close to the knock threshold for efficiency, relying on knock sensors to prevent damage. For tuners, knock detection is essential—you must monitor knock activity during any tuning session to avoid engine damage.',
    
    commonTypes: [
      'Piezoelectric knock sensor (most common)',
      'Wideband knock sensor (broader frequency)',
      'Integrated knock detection (ECU)',
      'Aftermarket knock monitoring systems',
      'Audio knock detection (experienced tuners)'
    ],
    
    keySpecs: [
      'Resonant frequency (kHz)',
      'Sensitivity',
      'Number of sensors',
      'Mounting location',
      'ECU knock threshold settings'
    ],
    
    signs: {
      good: [
        'No knock activity during normal driving',
        'Minimal timing retard in logs',
        'Consistent AFR under load',
        'Proper octane fuel being used'
      ],
      bad: [
        'Audible pinging/knock',
        'Significant timing retard in logs',
        'Knock sensor codes',
        'Knock activity on low load',
        'Broken knock sensor (no detection)'
      ]
    },
    
    modPotential: {
      summary: 'Knock detection is critical for safe tuning—never tune without monitoring knock.',
      gains: 'Proper knock monitoring allows pushing timing to the safe limit for maximum power.',
      considerations: 'Aftermarket knock monitoring systems ($150-400) supplement ECU detection. Audio knock detection requires experience. Some tuners use knock headphones for real-time monitoring.'
    },
    
    relatedTopics: ['ecu-tuning', 'air-fuel-ratio', 'fuel-types', 'data-logging'],
    relatedUpgradeKeys: ['knock-monitor'],
    status: 'complete'
  },

  {
    slug: 'air-fuel-ratio',
    name: 'Air/Fuel Ratio',
    system: 'engine-management',
    
    definition: 'Air/fuel ratio (AFR) is the mass ratio of air to fuel in the combustion mixture. For gasoline, stoichiometric ratio (chemically complete combustion) is 14.7:1—14.7 parts air to 1 part fuel. Lambda (λ) expresses AFR relative to stoich, where λ=1.0 is stoichiometric.',
    
    howItWorks: 'The ECU targets different AFRs for different conditions. At cruise, stoichiometric (~14.7:1, λ=1.0) maximizes efficiency and catalyst effectiveness. Under power, richer mixtures (~12.5-13.0:1, λ=0.85-0.88) provide more power and prevent detonation. Lean mixtures (>14.7:1) improve economy but risk overheating and knock. The ECU adjusts injector pulse width to achieve target AFR, with O2 sensors providing feedback.',
    
    whyItMatters: 'AFR tuning is fundamental to performance and safety. Too lean under load causes detonation and potential engine damage. Too rich wastes fuel and reduces power. Target AFRs vary by application—NA engines typically run ~12.8-13.2:1 at WOT, while boosted engines run richer (11.5-12.5:1) for cooling and safety. Always datalog AFR when tuning.',
    
    commonTypes: [
      'Stoichiometric (14.7:1 for gasoline)',
      'Power rich (12.5-13.0:1)',
      'Lean cruise (15-16:1 in some applications)',
      'E85 stoich (9.8:1)',
      'Lambda (1.0 = stoich for any fuel)'
    ],
    
    keySpecs: [
      'Target AFR (ratio or lambda)',
      'Actual AFR (measured by wideband)',
      'Fuel trims (short and long term)',
      'AFR by RPM and load',
      'AFR at WOT (safety critical)'
    ],
    
    signs: {
      good: [
        'AFR matches targets in datalog',
        'Fuel trims within ±5%',
        'No knock at target AFR',
        'Clean combustion'
      ],
      bad: [
        'AFR lean at WOT (<13.5:1 gas, danger zone)',
        'Large fuel trim corrections',
        'Inconsistent AFR between cylinders',
        'Rich/lean codes',
        'Black smoke (too rich) or knock (too lean)'
      ]
    },
    
    modPotential: {
      summary: 'AFR tuning is essential for any engine modification—wideband monitoring and proper targets are non-negotiable.',
      gains: 'Optimized AFR can add 2-5% power while ensuring safety. Proper rich targets under boost prevent knock.',
      considerations: 'E85 uses completely different AFR targets. Cylinder-to-cylinder variation indicates other issues. Never run lean under boost.'
    },
    
    relatedTopics: ['o2-sensor', 'ecu-tuning', 'data-logging', 'fuel-types'],
    relatedUpgradeKeys: ['wideband-o2', 'ecu-tune'],
    status: 'complete'
  },

  {
    slug: 'ecu-tuning',
    name: 'ECU Tuning',
    system: 'engine-management',
    
    definition: 'ECU tuning is the process of modifying the calibration data (maps, tables, and parameters) in the engine control unit to change how the engine operates. This can involve adjusting fuel delivery, ignition timing, boost pressure, rev limits, and many other parameters to optimize for performance, efficiency, or specific modifications.',
    
    howItWorks: 'The ECU stores calibration data in flash memory as maps (3D tables of values indexed by two inputs like RPM and load) and scalars (single values). Tuning software reads this data, allows modifications, and writes changes back to the ECU. Changes might include adding fuel under boost, advancing timing, raising the rev limit, adjusting the throttle response, or enabling features like launch control. Good tuning requires datalogging actual engine behavior and iterating to achieve targets.',
    
    whyItMatters: 'ECU tuning is the foundation of modern performance modification. Without tuning, many mods underperform or even cause problems. A quality tune ensures modifications work together, maintains safety margins, and often provides more power than any single bolt-on modification. Conversely, poor tuning destroys engines.',
    
    commonTypes: [
      'Flash tune (modified OEM ECU data)',
      'Piggyback tune (intercepts and modifies signals)',
      'Standalone tune (complete ECU replacement)',
      'OTS tune (off-the-shelf, pre-made)',
      'Custom dyno tune (individualized)',
      'E-tune (remote custom tuning via logs)'
    ],
    
    keySpecs: [
      'Base timing and fuel maps',
      'Boost target and control',
      'Rev limit',
      'Speed limiter removal',
      'Feature enables (launch, flat-foot shift)'
    ],
    
    signs: {
      good: [
        'Smooth power delivery',
        'AFR hits targets in logs',
        'No knock activity',
        'Improved throttle response',
        'Reliable operation'
      ],
      bad: [
        'Lean AFR under load',
        'Knock activity in logs',
        'Rough running or hesitation',
        'Check engine lights',
        'Unreliable/inconsistent power'
      ]
    },
    
    modPotential: {
      summary: 'ECU tuning unlocks 5-15% power on stock cars and is essential for any modified engine.',
      gains: 'Typical stock turbo car gains 30-60 HP from tune alone. Enables additional modifications to work properly.',
      considerations: 'Tune quality varies enormously—choose reputable tuners. Always datalog and verify. Dyno tuning provides real-world verification. OTS tunes are compromises; custom tunes optimize for your setup.'
    },
    
    relatedTopics: ['ecu', 'flash-reflash', 'standalone-ecu', 'data-logging', 'air-fuel-ratio'],
    relatedUpgradeKeys: ['ecu-tune', 'dyno-tune'],
    status: 'complete'
  },

  {
    slug: 'flash-reflash',
    name: 'Flash/Reflash',
    system: 'engine-management',
    
    definition: 'Flashing or reflashing refers to reprogramming the ECU\'s flash memory with modified calibration data. This is the most common method of ECU tuning on modern vehicles, allowing changes to factory ECU software without physical modification to the ECU hardware.',
    
    howItWorks: 'Flash memory in the ECU stores the calibration data that controls engine operation. Using specialized tools (OBD-based tuning devices, bench flash equipment, or dealer-level tools), this memory can be read, modified, and rewritten. The process typically takes 5-30 minutes depending on the vehicle. Some ECUs require security bypasses; others are openly accessible. Newer vehicles often have encrypted calibrations requiring decryption before modification.',
    
    whyItMatters: 'Flashing revolutionized ECU tuning by making it accessible without ECU removal or hardware modification. Many tuning companies offer portable flash devices that let owners update tunes at home. However, flash count may be tracked, tunes can be detected by dealers, and some security measures can make flashing difficult or impossible on certain vehicles.',
    
    commonTypes: [
      'OBD flash (through diagnostic port)',
      'Bench flash (ECU removed, direct connection)',
      'Boot mode flash (bypasses normal security)',
      'BDM flash (older method, direct memory access)',
      'Tuning device flash (Cobb, Accessport, etc.)'
    ],
    
    keySpecs: [
      'Flash time',
      'OBD vs bench requirement',
      'Number of calibrations storable',
      'Return to stock capability',
      'Security/encryption level'
    ],
    
    signs: {
      good: [
        'Successful flash completion',
        'Engine runs normally after flash',
        'Expected power gains',
        'No new fault codes'
      ],
      bad: [
        'Failed or interrupted flash (potential brick)',
        'ECU won\'t communicate',
        'Check engine lights after flash',
        'Poor running or no start',
        'Mismatched tune file'
      ]
    },
    
    modPotential: {
      summary: 'Flash tuning is the gateway to ECU modification for most enthusiasts.',
      gains: 'Enables all ECU tuning benefits. Portable flashers allow tune updates and map switching.',
      considerations: 'Never interrupt a flash in progress. Keep backup of stock calibration. Some vehicles are flash-count limited. Dealer updates may overwrite tune.'
    },
    
    relatedTopics: ['ecu', 'ecu-tuning', 'standalone-ecu', 'piggyback-ecu'],
    relatedUpgradeKeys: ['ecu-tune', 'flash-tuner'],
    status: 'complete'
  },

  {
    slug: 'standalone-ecu',
    name: 'Standalone ECU',
    system: 'engine-management',
    
    definition: 'A standalone ECU is an aftermarket engine management system that completely replaces the factory ECU. It provides unlimited tuning flexibility, allowing complete control over all engine parameters without the constraints of factory software. Standalone ECUs are essential for engine swaps, heavily modified engines, and racing applications.',
    
    howItWorks: 'The standalone ECU connects directly to all engine sensors and actuators, completely bypassing or replacing factory systems. It requires building calibration tables from scratch—fuel maps, ignition maps, idle control, VVT control, boost control, and more. Professional tuning is essential. Modern standalones offer features like sequential injection, individual cylinder tuning, integrated data logging, and integration with wideband O2, EGT, and other sensors.',
    
    whyItMatters: 'When factory ECU limitations become a barrier—whether from engine swaps, unconventional modifications, or extreme power levels—standalone ECUs provide a solution. They offer complete flexibility but require significant tuning expertise. For racing, standalones enable features impossible with OEM ECUs: traction control, launch control, rolling anti-lag, and more.',
    
    commonTypes: [
      'Haltech (Elite, Nexus)',
      'MoTeC (M1, M84, M150)',
      'AEM Infinity',
      'Link (G4X, Thunder)',
      'ECUMASTER (EMU Black, Classic)',
      'MegaSquirt (DIY, open-source)',
      'FuelTech'
    ],
    
    keySpecs: [
      'Number of injector/ignition outputs',
      'Input channels',
      'Processing speed',
      'Logging rate and capacity',
      'Expansion capability'
    ],
    
    signs: {
      good: [
        'Complete tuning control',
        'Engine runs cleanly after tuning',
        'All systems functional',
        'Data logging working'
      ],
      bad: [
        'Unfinished base tune',
        'Missing sensor inputs',
        'Poor idle or drivability',
        'Features not working',
        'Electrical noise issues'
      ]
    },
    
    modPotential: {
      summary: 'Standalone ECUs provide unlimited tuning potential for the most demanding applications.',
      gains: 'Complete control enables maximum power extraction. Features impossible with OEM: traction control, anti-lag, flat-shift.',
      considerations: 'Requires professional tuning ($1,000-3,000+ typical). Loses factory features and diagnostics. Complex wiring and installation. Cost $800-5,000+ for quality units.'
    },
    
    relatedTopics: ['ecu', 'ecu-tuning', 'piggyback-ecu', 'data-logging'],
    relatedUpgradeKeys: ['standalone-ecu'],
    status: 'complete'
  },

  {
    slug: 'piggyback-ecu',
    name: 'Piggyback ECU',
    system: 'engine-management',
    
    definition: 'A piggyback ECU is a secondary controller that intercepts and modifies signals between sensors/actuators and the factory ECU, allowing tuning without replacing the stock unit. Piggybacks can adjust fuel delivery, boost pressure, timing (indirectly), and other parameters while maintaining factory ECU functionality.',
    
    howItWorks: 'Piggybacks intercept sensor signals (like MAF or MAP) and modify them before they reach the factory ECU, tricking it into delivering different fuel or timing. Others intercept and modify injector signals directly, adding or subtracting fuel. Boost controllers intercept wastegate signals. The factory ECU continues to manage safety systems, diagnostics, and unmodified functions. This approach maintains factory drivability while adding performance.',
    
    whyItMatters: 'Piggybacks offer a middle ground between flash tuning and standalone—more flexibility than flash tunes with less complexity than standalones. They\'re popular for forced induction adds to NA cars, where the factory ECU wasn\'t designed for boost. Piggybacks maintain factory starting, idle, and drivability while adding performance features.',
    
    commonTypes: [
      'MAF/MAP interceptor (adjusts airflow signal)',
      'Fuel controller (modifies injector signal)',
      'Boost controller (modifies wastegate/boost signal)',
      'GReddy e-Manage',
      'AEM FIC',
      'MAFT Pro',
      'Split-second controllers'
    ],
    
    keySpecs: [
      'Intercepted signals',
      'Adjustment range',
      'Resolution of adjustment',
      'Logging capability',
      'Number of tunable channels'
    ],
    
    signs: {
      good: [
        'Factory drivability maintained',
        'Smooth boost control',
        'Expected power gains',
        'No check engine lights'
      ],
      bad: [
        'Rough idle or drivability issues',
        'Poor cold start',
        'Interference with factory diagnostics',
        'Can\'t achieve target fuel levels',
        'Incompatibility with certain sensors'
      ]
    },
    
    modPotential: {
      summary: 'Piggybacks enable forced induction adds and moderate modifications without full standalone complexity.',
      gains: 'Support for turbo/supercharger additions. Adjustable fuel and boost. Maintain factory reliability features.',
      considerations: 'Limited compared to standalone. Tuning indirectly through signal modification is less precise. May interfere with factory adaptations. $200-600 typical cost.'
    },
    
    relatedTopics: ['ecu', 'standalone-ecu', 'boost-controller', 'ecu-tuning'],
    relatedUpgradeKeys: ['piggyback-ecu', 'fuel-controller'],
    status: 'complete'
  },

  {
    slug: 'data-logging',
    name: 'Data Logging',
    system: 'engine-management',
    
    definition: 'Data logging is the process of recording engine sensor data and ECU parameters over time for later analysis. Logs capture information like RPM, load, AFR, boost, timing, knock, temperatures, and dozens of other parameters. Reviewing logs is essential for safe tuning and diagnosing issues.',
    
    howItWorks: 'The ECU or a separate data acquisition system samples sensor values at regular intervals (typically 10-100+ samples per second) and stores them in memory. After a driving session, logs are downloaded to a computer for analysis. Good logging software displays data as synchronized charts, allowing you to see how parameters interact. For example, seeing timing retard spike when knock increases confirms the relationship.',
    
    whyItMatters: 'You can\'t tune what you can\'t measure. Data logging reveals what\'s actually happening in the engine—not what you think is happening. Logs catch dangerous conditions (lean AFR, excessive knock) before they cause damage. They\'re essential for verifying tune safety, diagnosing problems, and tracking component health over time.',
    
    commonTypes: [
      'OBD datalogging (through diagnostic port)',
      'ECU internal logging (built into ECU)',
      'Standalone data acquisition (AiM, RaceLogic)',
      'Wideband controller logging',
      'Integrated tuning device logging (Cobb, etc.)'
    ],
    
    keySpecs: [
      'Sample rate (Hz)',
      'Number of channels',
      'Storage capacity',
      'Real-time display capability',
      'GPS integration'
    ],
    
    signs: {
      good: [
        'Comprehensive parameter capture',
        'Consistent sample rate',
        'Easy review software',
        'Reliable data storage'
      ],
      bad: [
        'Missing critical channels',
        'Inconsistent or dropped samples',
        'Communication errors',
        'Insufficient sample rate for needs',
        'Corrupted log files'
      ]
    },
    
    modPotential: {
      summary: 'Data logging capability is essential for any serious tuning or track use.',
      gains: 'Catch problems before engine damage. Verify tune safety. Track improvements over time. Diagnose intermittent issues.',
      considerations: 'Learn to read and interpret logs—data is only useful if understood. Log during all tuning sessions. Review before and after any modifications. Some channels require additional sensors (wideband, EGT).'
    },
    
    relatedTopics: ['ecu', 'ecu-tuning', 'o2-sensor', 'knock-detection', 'air-fuel-ratio'],
    relatedUpgradeKeys: ['wideband-o2', 'data-logger'],
    status: 'complete'
  }
];

export default engineManagementTopics;




