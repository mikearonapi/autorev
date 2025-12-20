/**
 * DRIVETRAIN SYSTEM TOPICS - Complete Encyclopedia Content
 * 
 * 17 comprehensive topics covering drivetrain components.
 * All topics have full educational content - no stubs.
 * 
 * @module encyclopediaTopics/drivetrain
 */

export const drivetrainTopics = [
  {
    slug: 'manual-transmission',
    name: 'Manual Transmission',
    system: 'drivetrain',
    
    definition: 'A manual transmission is a gearbox that requires the driver to manually select gears using a gear lever and clutch pedal. It uses a set of gear pairs on parallel shafts that can be engaged to provide different ratios between engine speed and wheel speed. Manual transmissions offer direct mechanical connection and driver engagement that many enthusiasts prefer.',
    
    howItWorks: 'The transmission has an input shaft connected to the clutch and an output shaft connected to the driveshaft. Gear pairs of different sizes are mounted on these shafts. When you move the shifter, a selector fork slides a synchronizer sleeve to lock a specific gear to its shaft. The synchronizer matches shaft speeds before engagement to prevent grinding. Gear ratios are calculated by dividing driven gear teeth by driving gear teeth—a 3.5:1 first gear means the input shaft spins 3.5 times for every output shaft revolution.',
    
    whyItMatters: 'Manual transmissions provide the most direct connection between driver and drivetrain. There are no torque converter losses, shift decisions are yours, and the mechanical feedback is unmatched. For many enthusiasts, rowing through gears is a core part of the driving experience. Manuals are also typically lighter, simpler, and cheaper to maintain than automatics.',
    
    commonTypes: [
      'Transaxle (transmission and differential combined, FWD/mid-engine)',
      'Rear-mount (separate from engine, RWD)',
      '4-speed (older vehicles)',
      '5-speed (common through 2000s)',
      '6-speed (modern standard)',
      '7-speed (Porsche, Corvette)'
    ],
    
    keySpecs: [
      'Number of forward gears',
      'Gear ratios (1st through top)',
      'Final drive ratio',
      'Torque capacity (lb-ft)',
      'Shift throw distance',
      'Weight'
    ],
    
    signs: {
      good: [
        'Smooth, precise shifts',
        'No grinding when shifting',
        'Stays in gear under load',
        'Quiet operation in all gears'
      ],
      bad: [
        'Grinding when shifting (synchro wear)',
        'Popping out of gear (detent wear)',
        'Difficulty finding gears',
        'Whining noise (bearing wear)',
        'Gear oil leaks'
      ]
    },
    
    modPotential: {
      summary: 'Manual transmission upgrades focus on handling more power, improving shift feel, or adding gears.',
      gains: 'Stronger internals handle 2-3x stock torque. Short shifters reduce throw 20-40%. Upgraded synchros enable faster shifts.',
      considerations: 'Transmission swaps are complex but common (e.g., T56 swaps). Clutch must match transmission torque capacity. Some aftermarket gearsets enable custom ratios.'
    },
    
    relatedTopics: ['clutch', 'synchromesh', 'flywheel', 'driveshaft', 'differential'],
    relatedUpgradeKeys: ['short-shifter', 'transmission-upgrade'],
    status: 'complete'
  },

  {
    slug: 'automatic-transmission',
    name: 'Automatic Transmission',
    system: 'drivetrain',
    
    definition: 'An automatic transmission uses a torque converter and planetary gear sets to automatically select gear ratios without driver input. Modern automatics can have 8, 9, or 10+ speeds and often include manual shift modes. While traditionally less engaging than manuals, modern automatics can shift faster and more efficiently than human-operated manuals.',
    
    howItWorks: 'A torque converter replaces the clutch, using fluid coupling to transfer power (and multiply torque at low speeds). Inside, planetary gear sets provide different ratios by holding or releasing various elements (sun gear, planet carrier, ring gear) using clutch packs and bands. The transmission control unit (TCU) determines shift points based on throttle position, vehicle speed, and other inputs. Lock-up clutches in the torque converter eliminate slip at cruise for efficiency.',
    
    whyItMatters: 'Modern automatics have largely erased the performance penalty they once carried. A well-tuned 8 or 10-speed can shift in under 100 milliseconds—faster than any human. For drag racing, automatics are often preferred for consistency. The convenience factor also matters: in heavy traffic, automatics reduce fatigue significantly.',
    
    commonTypes: [
      'Traditional torque converter automatic',
      'CVT (Continuously Variable Transmission)',
      'Dual-clutch (DCT/PDK/DSG)',
      'Automated manual (SMG, F1 paddle shift)',
      '4-speed to 10-speed variants'
    ],
    
    keySpecs: [
      'Number of speeds',
      'Torque capacity',
      'Gear ratios and spread',
      'Shift speed (milliseconds)',
      'Lock-up clutch engagement RPM',
      'Cooler requirements'
    ],
    
    signs: {
      good: [
        'Smooth, imperceptible shifts',
        'Quick downshifts when needed',
        'No slipping or flaring between gears',
        'Proper engagement from stop'
      ],
      bad: [
        'Slipping (RPM rises without acceleration)',
        'Harsh or delayed shifts',
        'Shuddering during lock-up',
        'Burning smell from fluid',
        'Leaking transmission fluid'
      ]
    },
    
    modPotential: {
      summary: 'Automatic transmission upgrades range from TCU tuning to full built transmissions for high-power applications.',
      gains: 'TCU tune improves shift speed and firmness. Built transmissions handle 2-5x stock power. Better torque converters improve launch and response.',
      considerations: 'Automatic builds are expensive ($2,000-8,000+). High-stall converters sacrifice low-speed drivability. Adequate cooling is critical for hard use.'
    },
    
    relatedTopics: ['tcu', 'mechatronics', 'differential', 'driveshaft'],
    relatedUpgradeKeys: ['transmission-tune', 'torque-converter'],
    status: 'complete'
  },

  {
    slug: 'automated-manual',
    name: 'Automated Manual Transmission (DCT/SMG)',
    system: 'drivetrain',
    
    definition: 'An automated manual transmission uses computer-controlled actuators to operate a manual gearbox without a traditional clutch pedal. Dual-clutch transmissions (DCT) like Porsche PDK, VW DSG, and BMW M-DCT use two separate clutches—one for odd gears, one for even—enabling nearly instant shifts by pre-selecting the next gear.',
    
    howItWorks: 'In a DCT, one clutch controls gears 1, 3, 5, 7 while the other controls 2, 4, 6. While you\'re in 3rd gear, 4th is already engaged on the other clutch, just waiting. To shift, the computer simply releases one clutch while engaging the other—no power interruption. Single-clutch automated manuals (like early SMG, Lamborghini E-gear) are simpler but have a noticeable power cut during shifts.',
    
    whyItMatters: 'DCTs combine the efficiency and engagement feel of a manual with shift speeds that beat any human—often 50-150 milliseconds. They\'re the transmission of choice in supercars and hot hatches alike. However, they can be jerky at low speeds and in traffic, and they\'re more complex and expensive to service than either manuals or traditional automatics.',
    
    commonTypes: [
      'PDK (Porsche Doppelkupplungsgetriebe)',
      'DSG (VW/Audi Direct Shift Gearbox)',
      'M-DCT (BMW M)',
      'DCT (various manufacturers)',
      'SMG (BMW, single-clutch)',
      'E-gear (Lamborghini, single-clutch)'
    ],
    
    keySpecs: [
      'Wet clutch vs dry clutch',
      'Number of speeds (6, 7, 8)',
      'Shift speed (milliseconds)',
      'Torque capacity',
      'Clutch pack service interval'
    ],
    
    signs: {
      good: [
        'Lightning-fast upshifts',
        'Rev-matched downshifts',
        'Smooth low-speed operation',
        'Consistent shift quality'
      ],
      bad: [
        'Shuddering at low speeds',
        'Hesitation from stop',
        'Grinding or clunking shifts',
        'Clutch slip under hard acceleration',
        'Mechatronics fault codes'
      ]
    },
    
    modPotential: {
      summary: 'DCT upgrades focus on clutch pack upgrades for more torque capacity and TCU tuning for faster, firmer shifts.',
      gains: 'Upgraded clutches handle 2-3x stock torque. TCU tune can reduce shift time 20-30% and improve low-speed behavior.',
      considerations: 'DCT builds are specialized and expensive. Wet-clutch units are generally stronger than dry-clutch. Heat management critical for track use.'
    },
    
    relatedTopics: ['clutch', 'tcu', 'mechatronics', 'manual-transmission'],
    relatedUpgradeKeys: ['dct-clutch-upgrade', 'transmission-tune'],
    status: 'complete'
  },

  {
    slug: 'clutch',
    name: 'Clutch',
    system: 'drivetrain',
    
    definition: 'The clutch is a friction device that connects and disconnects the engine from the transmission, allowing gear changes and enabling the car to stop without stalling. It consists of a friction disc that is squeezed between the flywheel and pressure plate when engaged, and released when the clutch pedal is pressed.',
    
    howItWorks: 'When the clutch pedal is released, the pressure plate\'s diaphragm spring clamps the clutch disc against the flywheel with significant force (often 1,500-3,000 lbs). Friction material on the disc grips both surfaces, transmitting engine torque to the transmission input shaft. Pressing the pedal activates the release bearing, which pushes on the diaphragm spring, releasing clamping force and allowing the disc to spin freely.',
    
    whyItMatters: 'The clutch must transmit all engine torque without slipping during normal driving, yet allow smooth engagement when starting from a stop. Clutch feel significantly affects driving enjoyment—a progressive, communicative clutch makes heel-toe and launches easier. For modified cars, the stock clutch is often the first component to fail as power increases.',
    
    commonTypes: [
      'Single-disc organic (stock, smooth engagement)',
      'Single-disc ceramic/metallic (high grip, more aggressive)',
      'Multi-disc (racing, highest capacity)',
      'Pull-type vs push-type release',
      'Sprung hub vs solid hub'
    ],
    
    keySpecs: [
      'Torque capacity (lb-ft)',
      'Disc diameter',
      'Clamp load (lbs)',
      'Friction material type',
      'Sprung vs unsprung weight',
      'Engagement characteristics'
    ],
    
    signs: {
      good: [
        'Smooth, progressive engagement',
        'No slipping under full throttle',
        'Consistent pedal feel',
        'No chatter or vibration'
      ],
      bad: [
        'Slipping (RPM rises, car doesn\'t accelerate)',
        'Chatter on engagement',
        'Burning smell',
        'High engagement point (worn disc)',
        'Hard or inconsistent pedal (hydraulic issue or worn parts)'
      ]
    },
    
    modPotential: {
      summary: 'Clutch upgrades are essential when adding power. Options range from mild organic upgrades to aggressive multi-disc racing clutches.',
      gains: 'Performance clutches handle 1.5-4x stock torque. Some sacrifice daily drivability for grip. Lightweight flywheels often paired for improved response.',
      considerations: 'More aggressive clutches are harder to modulate. Multi-disc and metallic clutches can be harsh for street driving. Match clutch to power level and intended use.'
    },
    
    relatedTopics: ['flywheel', 'manual-transmission', 'automated-manual'],
    relatedUpgradeKeys: ['clutch-upgrade', 'lightweight-flywheel'],
    status: 'complete'
  },

  {
    slug: 'driveshaft',
    name: 'Driveshaft',
    system: 'drivetrain',
    
    definition: 'The driveshaft (or propeller shaft) transmits rotational power from the transmission to the differential in rear-wheel-drive and all-wheel-drive vehicles. It\'s a long tube that must accommodate changes in length and angle as the suspension moves, using universal joints or constant velocity joints at each end.',
    
    howItWorks: 'The driveshaft connects the transmission output to the differential input, typically spanning 3-5 feet. Universal joints (U-joints) at each end allow the shaft to operate at an angle and accommodate suspension movement. In a two-piece shaft, a center support bearing provides additional support. The shaft must be precisely balanced—even small imbalances at high RPM create significant vibration. Critical speed (the RPM at which the shaft wants to whip) limits safe operating RPM.',
    
    whyItMatters: 'A lightweight driveshaft reduces rotating mass, improving acceleration and throttle response. For high-power applications, shaft strength becomes critical—a failed driveshaft at speed can cause serious damage. Carbon fiber shafts can be 50% lighter than steel while handling comparable power, but cost significantly more.',
    
    commonTypes: [
      'One-piece steel (most common)',
      'Two-piece with carrier bearing',
      'Aluminum (lighter, common upgrade)',
      'Carbon fiber (lightest, highest performance)',
      'U-joint style vs CV joint style'
    ],
    
    keySpecs: [
      'Material (steel, aluminum, carbon fiber)',
      'Diameter and wall thickness',
      'Critical speed (RPM limit)',
      'Torque capacity',
      'Weight',
      'Balance specification'
    ],
    
    signs: {
      good: [
        'Smooth operation at all speeds',
        'No vibration during acceleration',
        'No clunking during direction changes',
        'Quiet operation'
      ],
      bad: [
        'Vibration at specific speeds',
        'Clunk when shifting or on/off throttle',
        'Squeaking or grinding from U-joints',
        'Visible rust or damage',
        'U-joint play (can check by hand)'
      ]
    },
    
    modPotential: {
      summary: 'Driveshaft upgrades reduce rotating mass and increase strength for high-power applications.',
      gains: 'Aluminum shafts save 10-15 lbs. Carbon fiber saves 15-25 lbs. Reduces rotational inertia for improved acceleration.',
      considerations: 'Must be properly balanced. Critical speed must exceed intended RPM. U-joints should be upgraded with high-power shafts. $300-1,500 depending on material.'
    },
    
    relatedTopics: ['differential', 'manual-transmission', 'automatic-transmission', 'halfshaft'],
    relatedUpgradeKeys: ['driveshaft-upgrade'],
    status: 'complete'
  },

  {
    slug: 'halfshaft',
    name: 'Half Shaft / CV Axle',
    system: 'drivetrain',
    
    definition: 'Half shafts (also called CV axles or drive axles) transmit power from the differential to the wheels in front-wheel-drive, rear-wheel-drive with independent rear suspension, and all-wheel-drive vehicles. They use constant velocity (CV) joints to accommodate suspension travel and steering angle while maintaining smooth power delivery.',
    
    howItWorks: 'Each half shaft connects one side of the differential to one wheel. CV joints at each end allow the shaft to transmit power at varying angles—critical for front axles that must handle both suspension travel and steering angles up to 40+ degrees. The inner joint typically handles more plunge (in/out movement) while the outer joint handles more angle. CV joints are packed with grease and sealed by rubber boots.',
    
    whyItMatters: 'Half shafts must handle the full torque output of the differential while operating at significant angles. For high-power applications, especially turbocharged FWD cars, stock axles can twist or break during hard launches. Upgraded axles with larger CV joints and stronger shafts are essential for serious power builds.',
    
    commonTypes: [
      'OEM (adequate for stock power)',
      'Performance (upgraded joints, same dimensions)',
      'Racing (oversized joints, chromoly shafts)',
      'Rzeppa joint (most common outer CV)',
      'Tripod joint (common inner CV)'
    ],
    
    keySpecs: [
      'Shaft diameter',
      'Joint size (number of balls/rollers)',
      'Torque capacity',
      'Maximum operating angle',
      'Plunge travel (inner joint)'
    ],
    
    signs: {
      good: [
        'Smooth power delivery in turns',
        'No clicking when turning',
        'Intact CV boots (no grease leaks)',
        'No vibration during acceleration'
      ],
      bad: [
        'Clicking during turns (worn outer CV)',
        'Vibration during acceleration',
        'Clunking on throttle tip-in',
        'Torn CV boots (leads to joint failure)',
        'Visible grease spray under car'
      ]
    },
    
    modPotential: {
      summary: 'Upgraded half shafts are essential for high-torque FWD and AWD builds to prevent breakage during launches.',
      gains: 'Performance axles handle 2-3x stock torque. Prevents wheel hop-induced breakage. Enables harder launches.',
      considerations: 'Must match spline count to differential and hubs. Quality varies significantly—cheap axles often fail. $400-1,200 per pair for quality units.'
    },
    
    relatedTopics: ['differential', 'hub', 'wheel-bearing', 'limited-slip-differential'],
    relatedUpgradeKeys: ['axle-upgrade'],
    status: 'complete'
  },

  {
    slug: 'axle',
    name: 'Axle',
    system: 'drivetrain',
    
    definition: 'An axle is a shaft that connects wheels and transmits power to them. In solid axle (live axle) designs, a single housing contains the differential and two axle shafts extending to each wheel. This design is common in trucks, muscle cars, and some sports cars for its strength and predictable handling characteristics.',
    
    howItWorks: 'In a solid rear axle, the ring gear drives a carrier that turns both axle shafts (with differential action allowing different wheel speeds in turns). The axle shafts are supported by bearings at the wheel end and spline into the differential. C-clip axles rely on a clip at the differential to retain the axle, while full-floating designs support the wheel on the housing bearings, meaning the axle only transmits torque.',
    
    whyItMatters: 'Axle design significantly affects handling. Solid axles provide consistent geometry under power but transmit more road imperfections to the chassis. For drag racing, solid axles are preferred for their strength and predictable power transfer. Axle shaft strength becomes critical in high-power applications—twisted or broken axle shafts are common failure points.',
    
    commonTypes: [
      'C-clip (GM, common, weaker)',
      'Bolt-in/Full-floating (Ford 9", stronger)',
      'Semi-floating (most passenger cars)',
      'Full-floating (trucks, heavy-duty)',
      'Dana 44, Dana 60, Ford 9", GM 10/12-bolt'
    ],
    
    keySpecs: [
      'Axle shaft diameter',
      'Spline count',
      'Ring gear diameter',
      'Housing material and wall thickness',
      'Axle type (C-clip, full-float)'
    ],
    
    signs: {
      good: [
        'Quiet operation',
        'No axle seal leaks',
        'No bearing noise',
        'Proper gear mesh pattern'
      ],
      bad: [
        'Whining noise (gear wear)',
        'Clunking (worn U-joint or differential)',
        'Axle seal leaks',
        'Bearing rumble',
        'Twisted or broken axle shaft (high-power failure)'
      ]
    },
    
    modPotential: {
      summary: 'Axle upgrades focus on stronger shafts, upgraded gearing, and complete axle swaps for high-power applications.',
      gains: 'Upgraded axle shafts handle 2-4x stock power. Different axle housings (Ford 9" swap) provide more strength and ratio options.',
      considerations: 'C-clip eliminators add safety on high-power cars. Full axle swaps require fabrication. Must maintain proper gear ratios for performance goals.'
    },
    
    relatedTopics: ['differential', 'solid-rear-axle', 'limited-slip-differential', 'halfshaft'],
    relatedUpgradeKeys: ['axle-upgrade', 'differential-upgrade'],
    status: 'complete'
  },

  {
    slug: 'hub',
    name: 'Hub',
    system: 'drivetrain',
    
    definition: 'The wheel hub is the mounting point where the wheel bolts to the vehicle. It contains or supports the wheel bearings and connects to the half shaft or axle shaft. The hub must precisely locate the wheel and handle all driving, braking, and cornering forces while spinning freely on its bearings.',
    
    howItWorks: 'The hub assembly typically includes the hub body, wheel studs, bearing races (or a pressed-in bearing unit), ABS sensor ring (on equipped vehicles), and provisions for the axle shaft connection. Wheel studs or bolts thread into the hub to secure the wheel. The bearing allows the hub to rotate smoothly while the steering knuckle or axle housing remains stationary. On driven wheels, the hub splines to the axle shaft to receive power.',
    
    whyItMatters: 'Hub quality directly affects steering feel, braking stability, and safety. Worn hub bearings cause wheel wobble that gets progressively worse and can lead to wheel separation if ignored. For track use, hub-centric wheel mounting and proper torque are critical for safety and consistent handling.',
    
    commonTypes: [
      'Unitized hub assembly (bearing integrated, common modern design)',
      'Serviceable hub with separate bearing',
      'Hub-centric (wheel locates on hub diameter)',
      'Lug-centric (wheel locates on lugs only)',
      'Press-fit bearing vs cartridge bearing'
    ],
    
    keySpecs: [
      'Bolt pattern (e.g., 5x114.3)',
      'Center bore diameter',
      'Stud size and thread pitch',
      'Number of studs/lugs',
      'ABS sensor compatibility'
    ],
    
    signs: {
      good: [
        'No play when wheel is shaken',
        'Smooth rotation by hand',
        'No noise during driving',
        'ABS functioning properly'
      ],
      bad: [
        'Play in wheel when shaken',
        'Humming or growling noise (worse in turns)',
        'ABS warning light',
        'Uneven tire wear',
        'Vibration through steering wheel'
      ]
    },
    
    modPotential: {
      summary: 'Hub upgrades focus on extended studs for spacers/wide wheels and racing-spec units for track use.',
      gains: 'Extended studs allow wheel spacers and accommodate wider wheels. Racing hubs may be lighter or stronger.',
      considerations: 'Extended studs require proper length and material. Hub-centric rings recommended when using non-OEM wheels. Always torque to spec.'
    },
    
    relatedTopics: ['wheel-bearing', 'halfshaft', 'brake-rotor', 'wheel-alignment'],
    relatedUpgradeKeys: ['wheel-studs'],
    status: 'complete'
  },

  {
    slug: 'wheel-bearing',
    name: 'Wheel Bearing',
    system: 'drivetrain',
    
    definition: 'Wheel bearings allow the wheel hub to rotate freely while supporting the vehicle\'s weight and handling cornering, acceleration, and braking forces. Modern vehicles typically use sealed, pre-greased bearings that are maintenance-free for their service life, which can exceed 100,000 miles under normal conditions.',
    
    howItWorks: 'Ball or roller bearings roll between inner and outer races, providing low-friction rotation. Tapered roller bearings are common in trucks and older cars, using conical rollers that can handle both radial (weight) and axial (cornering) loads. Modern unitized hub bearings combine the bearing, hub, and often the ABS sensor ring into one sealed unit. The bearing\'s preload (how tightly it\'s adjusted) affects both durability and rolling resistance.',
    
    whyItMatters: 'Wheel bearings directly affect handling precision and safety. A worn bearing allows wheel movement that corrupts steering feel and can cause wandering. Severely worn bearings can overheat and seize, potentially causing loss of vehicle control. The characteristic humming noise of a bad wheel bearing changes with speed and often changes in turns (loading/unloading the bearing).',
    
    commonTypes: [
      'Sealed cartridge (common modern design)',
      'Tapered roller (adjustable, older design)',
      'Angular contact ball bearing',
      'Unitized hub assembly',
      'Gen 1/2/3 hub bearing designs'
    ],
    
    keySpecs: [
      'Bearing type and size',
      'Load rating (dynamic and static)',
      'Seal type',
      'Preload specification',
      'ABS encoder integration'
    ],
    
    signs: {
      good: [
        'Silent operation at all speeds',
        'No play in wheel',
        'Smooth rotation by hand',
        'No heat after driving'
      ],
      bad: [
        'Humming noise that changes with speed',
        'Noise changes when turning (loads bearing)',
        'Play when wheel is rocked',
        'Grinding sensation through steering',
        'Excessive heat after driving'
      ]
    },
    
    modPotential: {
      summary: 'Wheel bearing upgrades are typically replacements with OEM-quality or high-performance units rather than modifications.',
      gains: 'Quality bearings last longer and may have lower rolling resistance. Some racing bearings are serviceable for repacking.',
      considerations: 'Always replace with quality units—cheap bearings fail prematurely. Proper installation (preload, torque) is critical. ABS-equipped cars need compatible replacement.'
    },
    
    relatedTopics: ['hub', 'halfshaft', 'axle', 'wheel-alignment'],
    status: 'complete'
  },

  {
    slug: 'mechatronics',
    name: 'Mechatronics',
    system: 'drivetrain',
    
    definition: 'Mechatronics refers to the integrated mechanical, electrical, and computer control systems in modern automatic and dual-clutch transmissions. The mechatronics unit is essentially the transmission\'s brain and muscle combined—it contains sensors, solenoids, the TCU (or interfaces with it), and the valve body that directs hydraulic fluid to control clutches and gear selection.',
    
    howItWorks: 'The mechatronics unit reads inputs (vehicle speed, throttle position, gear selector position, fluid temperature) and controls outputs (solenoids that direct hydraulic pressure to engage clutches, bands, and synchronizers). In DCTs, it coordinates the precise timing of clutch engagement and disengagement. High-speed processors make thousands of decisions per second to optimize shift timing, firmness, and clutch application for smooth, efficient operation.',
    
    whyItMatters: 'Mechatronics failures are among the most common and expensive automatic/DCT transmission issues. Symptoms range from harsh shifts to complete transmission failure. These units are complex and expensive—replacement often costs $2,000-5,000+. Understanding mechatronics is essential for diagnosing modern transmission problems.',
    
    commonTypes: [
      'Integrated TCU/valve body (most modern designs)',
      'Separate TCU with electro-hydraulic valve body',
      'DCT mechatronics (dual-clutch specific)',
      'ZF, Aisin, Getrag designs'
    ],
    
    keySpecs: [
      'Solenoid count and type',
      'Processor speed',
      'Sensor types integrated',
      'Hydraulic pressure range',
      'Adaptation/learning capability'
    ],
    
    signs: {
      good: [
        'Smooth, consistent shifts',
        'Quick response to throttle input',
        'No warning lights',
        'Proper adaptation to driving style'
      ],
      bad: [
        'Harsh or delayed shifts',
        'Transmission fault codes',
        'Limp mode activation',
        'Erratic shift behavior',
        'Failure to engage gears'
      ]
    },
    
    modPotential: {
      summary: 'Mechatronics modifications primarily involve TCU tuning to change shift points, firmness, and behavior.',
      gains: 'TCU tune provides faster shifts, higher rev limits, and better throttle response. Racing applications may bypass safeties.',
      considerations: 'Poor-quality tunes can damage transmissions. Aggressive tuning increases wear. Some modifications void warranties. Professional tuning recommended.'
    },
    
    relatedTopics: ['tcu', 'automatic-transmission', 'automated-manual'],
    relatedUpgradeKeys: ['transmission-tune'],
    status: 'complete'
  },

  {
    slug: 'sequential-transmission',
    name: 'Sequential Transmission',
    system: 'drivetrain',
    
    definition: 'A sequential transmission uses a barrel-type selector mechanism that requires shifting through each gear in order—no skipping gears like in an H-pattern manual. Originally developed for motorcycles and racing, sequential gearboxes offer faster shifts and simpler operation under high-stress racing conditions.',
    
    howItWorks: 'Instead of an H-pattern gate, the shifter moves forward and back in a single plane—push for upshift, pull for downshift (or vice versa). A rotating drum with grooves engages selector forks sequentially, making it impossible to skip gears or mis-shift. Racing sequentials often use dog engagement instead of synchros, allowing clutchless upshifts and extremely fast gear changes (under 50 milliseconds). A cut switch momentarily reduces ignition or fuel during upshifts to unload the dogs.',
    
    whyItMatters: 'Sequential transmissions eliminate mis-shifts, reduce shift time, and allow drivers to focus on racing rather than gear selection. They\'re standard in most forms of professional motorsport. For enthusiasts, sequential conversions offer the ultimate in driver engagement and shift experience, though at significant cost.',
    
    commonTypes: [
      'Motorcycle sequential (most motorcycles)',
      'Racing sequential (Quaife, Drenth, Holinger)',
      'Rally sequential (strengthened for abuse)',
      'Street sequential (synchro-equipped variants)',
      'Paddle-actuated vs lever-actuated'
    ],
    
    keySpecs: [
      'Shift time (milliseconds)',
      'Engagement type (dog or synchro)',
      'Gear ratios available',
      'Torque capacity',
      'Straight-cut vs helical gears'
    ],
    
    signs: {
      good: [
        'Positive, instant gear engagement',
        'Consistent shift feel',
        'No missed shifts',
        'Proper dog engagement sounds'
      ],
      bad: [
        'Grinding into gear',
        'Popping out of gear',
        'Excessive noise (bearing wear)',
        'Difficult selection (worn dogs or forks)',
        'Synchro crunch (on synchro types)'
      ]
    },
    
    modPotential: {
      summary: 'Sequential transmissions are typically complete racing gearboxes rather than modifications to existing transmissions.',
      gains: 'Shift times under 50ms. Eliminates mis-shifts. Allows full-throttle upshifts. Racing credibility and engagement.',
      considerations: 'Very expensive ($8,000-25,000+). May require specific clutch, bellhousing, shifter, and electronics. Some have shorter service intervals. Not always street-practical.'
    },
    
    relatedTopics: ['dog-box', 'synchromesh', 'manual-transmission', 'ecu-tuning'],
    relatedUpgradeKeys: ['sequential-gearbox'],
    status: 'complete'
  },

  {
    slug: 'dog-box',
    name: 'Dog Box',
    system: 'drivetrain',
    
    definition: 'A dog box is a type of transmission that uses face-mounted engagement dogs instead of synchronized cones to lock gears to shafts. The dogs are small tabs that physically interlock, enabling much faster, clutchless upshifts but requiring precise timing on downshifts. Dog boxes are the standard in most forms of motorsport.',
    
    howItWorks: 'Instead of friction-based synchromesh rings, dog engagement uses mechanical tabs on the gear faces that interlock with slots in the engagement collar. When shifting, the tabs on the rotating gear "catch" the tabs on the stationary collar, locking them together almost instantly. This happens in milliseconds compared to the synchro\'s friction-matching process. The ignition or fuel is cut momentarily during upshifts to unload the drivetrain and allow clean dog engagement.',
    
    whyItMatters: 'Dog engagement eliminates the weakest and slowest part of a synchro transmission. Racing drivers can bang through gears with minimal lift-off and no clutch use on upshifts. The distinctive mechanical "bang" of a dog engagement shift is iconic in motorsport. For serious track use, dog boxes offer significant lap time improvement.',
    
    commonTypes: [
      'Straight-cut dogs (racing, fastest)',
      'Back-cut dogs (improved engagement)',
      '4-dog vs 6-dog faces',
      'Crash box (original dog designs)',
      'Face engagement vs side engagement'
    ],
    
    keySpecs: [
      'Number of dogs (4, 5, 6)',
      'Dog width and engagement depth',
      'Shift fork engagement style',
      'Engagement window (timing tolerance)',
      'Shift effort required'
    ],
    
    signs: {
      good: [
        'Clean, instant engagement',
        'Consistent shift feel',
        'No grinding (when timed correctly)',
        'Positive "clunk" into gear'
      ],
      bad: [
        'Grinding on downshifts (wrong technique)',
        'Rounded dog faces (wear from missed engagement)',
        'Popping out of gear (worn dogs)',
        'Excessive shift effort'
      ]
    },
    
    modPotential: {
      summary: 'Dog boxes are complete racing transmission solutions rather than modifications. Dog ring kits can convert some synchro transmissions.',
      gains: 'Faster shifts, clutchless upshifts, bulletproof reliability in racing conditions.',
      considerations: 'Requires proper technique—ham-fisted shifting damages dogs quickly. Noisy for street use. Downshifts require rev-matching. Not practical for traffic/daily driving.'
    },
    
    relatedTopics: ['sequential-transmission', 'synchromesh', 'manual-transmission'],
    relatedUpgradeKeys: ['dog-engagement-kit'],
    status: 'complete'
  },

  {
    slug: 'synchromesh',
    name: 'Synchromesh',
    system: 'drivetrain',
    
    definition: 'Synchromesh (or synchronizer) is the mechanism in manual transmissions that matches the speed of the gear and shaft before engagement, preventing grinding. When you shift, the synchro ring uses friction to speed up or slow down the gear until it matches the shaft speed, at which point the engagement sleeve can slide into position smoothly.',
    
    howItWorks: 'The synchronizer consists of a brass or carbon-lined ring (blocker ring/balk ring), a hub splined to the shaft, and a sleeve that slides over both. When shifting, the sleeve pushes the synchro ring against a cone on the gear. Friction between the ring and cone matches speeds. Until speeds are matched, the ring\'s index teeth block the sleeve from engaging. Once synchronized, the sleeve slides over and locks the gear to the shaft. The whole process takes 200-500 milliseconds in a typical street transmission.',
    
    whyItMatters: 'Synchros are what make modern manual transmissions practical for everyday use—without them, every shift would require double-clutching and precise rev-matching. Synchro wear is a common issue in older or heavily-used transmissions, typically affecting 2nd gear first due to the high-speed differential between 1st and 2nd. Worn synchros cause grinding and eventually make the transmission unusable.',
    
    commonTypes: [
      'Single-cone synchro (basic)',
      'Double-cone synchro (faster sync, more expensive)',
      'Triple-cone synchro (heavy-duty applications)',
      'Carbon fiber synchros (racing, lower friction)',
      'Brass synchros (most common)'
    ],
    
    keySpecs: [
      'Synchro type (single, double, triple cone)',
      'Material (brass, carbon, organic)',
      'Cone angle',
      'Blocker ring index depth',
      'Service life rating'
    ],
    
    signs: {
      good: [
        'Smooth engagement into all gears',
        'No grinding when shifted at reasonable speed',
        'Consistent shift feel across all gears',
        'Quick synchro recovery time'
      ],
      bad: [
        'Grinding into gear (usually 2nd first)',
        'Difficulty finding gear when cold',
        'Worse with quick shifts',
        'Brass shavings in gear oil',
        'Notchy or uneven shift feel'
      ]
    },
    
    modPotential: {
      summary: 'Synchro upgrades can improve shift feel and durability. Upgraded synchro assemblies are available for popular transmissions.',
      gains: 'Carbon synchros allow faster shifts. Double-cone conversions improve OEM single-cone transmissions. Quality synchros last longer.',
      considerations: 'Synchro work requires transmission disassembly. Often done during clutch replacement. Upgraded gear oil helps preserve synchros.'
    },
    
    relatedTopics: ['manual-transmission', 'dog-box', 'clutch'],
    relatedUpgradeKeys: ['transmission-rebuild'],
    status: 'complete'
  },

  {
    slug: 'differential',
    name: 'Differential',
    system: 'drivetrain',
    
    definition: 'The differential is a gear assembly that splits engine torque between the drive wheels while allowing them to rotate at different speeds—essential for turning, where the outside wheel must travel farther than the inside wheel. It also provides final gear reduction, multiplying torque from the driveshaft.',
    
    howItWorks: 'The ring gear (driven by the driveshaft\'s pinion) turns a carrier containing the differential gears. In an open differential, spider gears between the axle gears allow speed differences between wheels. The final drive ratio (ring gear teeth ÷ pinion teeth) provides gear reduction—a 3.73:1 ratio means the driveshaft turns 3.73 times for every wheel revolution. Higher ratios (numerically larger) provide more acceleration but lower top speed.',
    
    whyItMatters: 'Final drive ratio selection significantly affects vehicle character. Lower ratios (like 2.73:1) favor highway cruising and fuel economy, while higher ratios (like 4.10:1) favor acceleration and towing. For performance applications, proper gear selection can dramatically improve acceleration times and driving feel.',
    
    commonTypes: [
      'Open differential (stock, basic)',
      'Limited slip differential (LSD)',
      'Locking differential',
      'Torsen (torque-sensing)',
      'Salisbury/clutch-type',
      'Electronic/active differentials'
    ],
    
    keySpecs: [
      'Final drive ratio',
      'Ring gear diameter',
      'Spline count',
      'Differential type',
      'Torque capacity'
    ],
    
    signs: {
      good: [
        'Quiet operation',
        'Smooth power delivery in turns',
        'No leaks',
        'Proper backlash'
      ],
      bad: [
        'Whining noise (gear mesh issue)',
        'Clunking on acceleration/deceleration',
        'Excessive backlash (worn gears)',
        'Leaking pinion seal',
        'Overheating differential fluid'
      ]
    },
    
    modPotential: {
      summary: 'Gear ratio changes and LSD installations are among the most impactful drivetrain modifications.',
      gains: 'Shorter gears (higher ratio) improve 0-60 by 0.3-0.5 seconds. LSD dramatically improves traction and handling.',
      considerations: 'Gear changes affect speedo accuracy (correctable). Shorter gears increase highway RPM. Professional installation recommended for gear setup.'
    },
    
    relatedTopics: ['limited-slip-differential', 'open-differential', 'locking-differential', 'axle', 'driveshaft'],
    relatedUpgradeKeys: ['gear-ratio', 'lsd-upgrade'],
    status: 'complete'
  },

  {
    slug: 'limited-slip-differential',
    name: 'Limited Slip Differential (LSD)',
    system: 'drivetrain',
    
    definition: 'A limited slip differential (LSD) is a type of differential that limits the speed difference between the two drive wheels, reducing wheelspin and improving traction. Unlike an open differential that sends all power to the wheel with least resistance, an LSD transfers some torque to the wheel with more grip.',
    
    howItWorks: 'Various mechanisms achieve limited slip. Clutch-type LSDs use clutch packs that engage when torque is applied, mechanically linking the axles. Torsen (torque-sensing) units use helical gears that bind under torque. Viscous LSDs use shear resistance of thick fluid between plates. Electronic LSDs use brakes or clutches controlled by the car\'s computers. Each type has different characteristics regarding engagement feel, maintenance, and behavior.',
    
    whyItMatters: 'An LSD transforms how a car puts power down. Under acceleration in a turn, an open diff often spins the inside wheel uselessly while an LSD transfers that torque to the loaded outside wheel. This improves corner exit speed, reduces wheelspin, and makes the car more predictable and confidence-inspiring. For performance driving, an LSD is one of the most significant handling upgrades possible.',
    
    commonTypes: [
      '1-way (locks on acceleration only)',
      '1.5-way (partial lock on decel)',
      '2-way (equal lock both directions)',
      'Clutch-type (most common aftermarket)',
      'Helical/Torsen (maintenance-free, progressive)',
      'Viscous (soft engagement, may wear out)',
      'Electronic (BMW M, Audi Sport)'
    ],
    
    keySpecs: [
      'Lock-up percentage/torque bias ratio',
      'Ramp angles (for clutch type)',
      'Preload',
      'Service interval',
      '1-way vs 1.5-way vs 2-way'
    ],
    
    signs: {
      good: [
        'Both wheels spinning equally under power',
        'Reduced inside wheel spin in corners',
        'Predictable handling on power',
        'Smooth engagement (no harsh lock-up)'
      ],
      bad: [
        'Chattering in tight turns (worn clutches)',
        'One-wheel spin (LSD worn out)',
        'Clunking on direction changes',
        'Excessive locking causing understeer',
        'Leaking differential fluid'
      ]
    },
    
    modPotential: {
      summary: 'LSD installation or upgrade is one of the most impactful chassis modifications for driving enjoyment and performance.',
      gains: 'Dramatically improved traction from corners. More predictable handling. Better launches. 1-2 second improvement on track per lap.',
      considerations: 'Clutch-type LSDs require periodic service (clutch pack replacement). Setup (preload, ramp angles) affects behavior. Some require special differential fluid.'
    },
    
    relatedTopics: ['differential', 'open-differential', 'locking-differential', 'traction-control'],
    relatedUpgradeKeys: ['lsd-upgrade'],
    status: 'complete'
  },

  {
    slug: 'open-differential',
    name: 'Open Differential',
    system: 'drivetrain',
    
    definition: 'An open differential is the simplest and most common type of differential, allowing the drive wheels to rotate at different speeds for cornering while splitting torque equally between them. However, it always sends power to the wheel with the least resistance, which can be problematic when one wheel loses traction.',
    
    howItWorks: 'Inside the differential carrier, spider gears mesh with the axle gears connected to each wheel. When driving straight, both axle gears turn at the same speed. When turning, the spider gears rotate on their axis, allowing one axle to speed up while the other slows down. The key limitation: torque is always equal to both wheels, determined by whichever wheel has less grip. If one wheel is on ice, it spins freely while the other wheel (on dry pavement) receives the same minimal torque.',
    
    whyItMatters: 'Open differentials are why you see cars with one wheel spinning uselessly while the other sits still. For enthusiast driving, this is frustrating—accelerating out of a corner often just spins the unloaded inside wheel. However, open diffs are smooth, quiet, maintenance-free, and perfectly adequate for normal driving. Understanding their limitations explains why LSDs are such popular upgrades.',
    
    commonTypes: [
      'Bevel gear (most common)',
      'Spur gear (simple, older designs)',
      'With or without locker compatibility',
      'Various ring gear sizes'
    ],
    
    keySpecs: [
      'Ring gear ratio',
      'Ring gear diameter',
      'Carrier type (fits specific housings)',
      'Bearing type'
    ],
    
    signs: {
      good: [
        'Quiet operation',
        'Smooth cornering',
        'No binding or noise in turns',
        'Both wheels free-spinning when raised'
      ],
      bad: [
        'Single wheel spin under power',
        'Whining (gear mesh issues)',
        'Clunking (worn spider gears)',
        'Excessive backlash'
      ]
    },
    
    modPotential: {
      summary: 'Open differentials are typically replaced with LSDs or lockers for performance applications.',
      gains: 'An LSD in place of an open diff dramatically improves traction and handling predictability.',
      considerations: 'Open diffs are perfectly adequate for street driving. Some track day cars use traction control with open diffs as a budget solution.'
    },
    
    relatedTopics: ['differential', 'limited-slip-differential', 'locking-differential'],
    relatedUpgradeKeys: ['lsd-upgrade'],
    status: 'complete'
  },

  {
    slug: 'locking-differential',
    name: 'Locking Differential',
    system: 'drivetrain',
    
    definition: 'A locking differential (locker) is a type of differential that can mechanically lock both axle shafts together, forcing both wheels to rotate at exactly the same speed regardless of traction conditions. When locked, 100% of available torque goes to both wheels equally, providing maximum traction in low-grip situations.',
    
    howItWorks: 'Lockers come in two main types: selectable and automatic. Selectable lockers (like ARB air lockers) use a mechanism (air, electric, cable) to physically lock the spider gears or a dog clutch, engaging only when activated. Automatic lockers (like Detroit Locker) use internal ratcheting mechanisms that automatically lock under power and unlock when the outside wheel needs to speed up in a turn. When locked, the differential essentially becomes a solid axle—both wheels always turn together.',
    
    whyItMatters: 'For off-roading, rock crawling, and drag racing, lockers provide maximum traction by ensuring both wheels always receive power. A locked differential won\'t waste torque on a spinning wheel. However, lockers significantly affect handling—on pavement, a locked diff causes understeer and tire scrub in turns. Selectable lockers offer the best of both worlds but add cost and complexity.',
    
    commonTypes: [
      'Selectable (ARB, Eaton E-Locker)',
      'Automatic/spool (Detroit Locker)',
      'Air-actuated',
      'Electrically-actuated',
      'Cable-actuated',
      'Mini-spool (full-time lock for drag racing)'
    ],
    
    keySpecs: [
      'Actuation method (if selectable)',
      'Engagement time',
      'Torque capacity',
      'Unlock threshold (for automatic types)',
      'Street/highway ratcheting behavior'
    ],
    
    signs: {
      good: [
        'Both wheels pulling equally when locked',
        'Clean engagement/disengagement (selectable)',
        'Predictable automatic lock/unlock behavior',
        'No grinding or slipping'
      ],
      bad: [
        'Failure to lock or unlock',
        'Harsh ratcheting on street (auto lockers)',
        'Grinding or banging in turns',
        'Leaking actuation seals (air lockers)',
        'Worn ratchet teeth (auto lockers)'
      ]
    },
    
    modPotential: {
      summary: 'Lockers are the ultimate traction solution for drag racing and off-road, but require understanding of their on-road behavior.',
      gains: 'Maximum traction in low-grip situations. Essential for serious off-roading. Consistent drag strip launches.',
      considerations: 'Automatic lockers affect street handling (clicking, bind-up). Selectable lockers require installation of actuation systems. Full spools are for racing only—no street use.'
    },
    
    relatedTopics: ['differential', 'limited-slip-differential', 'open-differential', 'axle'],
    relatedUpgradeKeys: ['locker-install'],
    status: 'complete'
  }
];

export default drivetrainTopics;












