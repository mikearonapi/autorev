/**
 * ENGINE SYSTEM TOPICS - Complete Encyclopedia Content
 * 
 * 14 comprehensive topics covering engine fundamentals.
 * All topics have full educational content - no stubs.
 * 
 * @module encyclopediaTopics/engine
 */

export const engineTopics = [
  {
    slug: 'engine-block',
    name: 'Engine Block',
    system: 'engine',
    
    definition: 'The engine block is the main structural foundation of an internal combustion engine. It houses the cylinders where combustion occurs, provides mounting points for other engine components, and contains passages for coolant and oil circulation. The block must withstand extreme heat, pressure, and mechanical stress while maintaining precise dimensional stability.',
    
    howItWorks: 'The block is cast as a single piece (usually iron or aluminum) with precisely machined cylinder bores. Pistons move up and down within these bores, sealed by piston rings against the cylinder walls. The lower portion (crankcase) supports the crankshaft via main bearing caps. Water jackets surround the cylinders for cooling, while oil galleries route lubricant to critical surfaces. Deck height (distance from crankshaft centerline to the top surface) determines compression ratio when combined with head gasket thickness and piston position.',
    
    whyItMatters: 'Block strength determines how much power an engine can safely produce. Aluminum blocks are lighter (typically 40-60 lbs less than iron) but may require iron sleeves for durability. Block rigidity affects engine smoothness and bearing life. For high-power builds, block choice often determines the ceiling for reliable power output.',
    
    commonTypes: [
      'Cast iron (heavy, strong, thermally stable)',
      'Aluminum with iron sleeves (lighter, good strength)',
      'Aluminum with Nikasil/Alusil coating (lightest, requires careful maintenance)',
      'Closed deck (stronger, better for boost)',
      'Open deck (better cooling, less rigid)',
      'Semi-closed deck (compromise of both)'
    ],
    
    keySpecs: [
      'Material (iron, aluminum, alloy)',
      'Deck height',
      'Bore diameter and spacing',
      'Main bearing size and number',
      'Deck type (open, closed, semi-closed)',
      'Maximum overbore limit'
    ],
    
    signs: {
      good: [
        'Consistent cylinder bore measurements',
        'No visible cracks or porosity',
        'Flat deck surface within spec',
        'Clean oil return passages'
      ],
      bad: [
        'Coolant in oil (head gasket or crack)',
        'Visible cracks between cylinders',
        'Excessive cylinder wear (taper, out-of-round)',
        'Main bearing bore distortion',
        'Stripped or pulled threads'
      ]
    },
    
    modPotential: {
      summary: 'Block modifications range from boring/honing for oversized pistons to full aftermarket sleeved or billet blocks for extreme builds.',
      gains: 'Increased displacement (more power), stronger construction for higher boost/RPM, improved oiling.',
      considerations: 'Overboring has limits based on cylinder wall thickness. Sleeving adds cost but enables significant displacement changes. Aftermarket blocks can cost $3,000-15,000+.'
    },
    
    relatedTopics: ['bore', 'stroke', 'displacement', 'pistons', 'crankshaft', 'cylinder-head'],
    relatedUpgradeKeys: ['stroker-kit', 'forged-internals'],
    status: 'complete'
  },

  {
    slug: 'cylinder-head',
    name: 'Cylinder Head',
    system: 'engine',
    
    definition: 'The cylinder head bolts to the top of the engine block and seals the combustion chambers. It contains intake and exhaust ports that route air/fuel mixture in and exhaust gases out, plus the valves, valve springs, and often the camshafts that control valve timing. Head design critically affects airflow and power potential.',
    
    howItWorks: 'Air enters through intake ports and passes the intake valves into the combustion chamber. After combustion, exhaust gases exit through exhaust valves and ports. Port shape, size, and surface finish determine flow efficiency. The combustion chamber shape affects flame propagation, knock resistance, and compression ratio. Most modern heads use 4 valves per cylinder (2 intake, 2 exhaust) for better breathing, though some performance engines use 5 valves. DOHC (dual overhead cam) designs place cams directly above the valves for precise control at high RPM.',
    
    whyItMatters: 'The cylinder head is often the biggest restriction to airflow in a stock engine. Head flow directly correlates with power potential—a head that flows 10% more air can support roughly 10% more power. Combustion chamber design affects both power and detonation resistance. Well-designed heads are the foundation of any serious naturally aspirated build.',
    
    commonTypes: [
      '2-valve (simple, good low-end torque)',
      '4-valve (better high-RPM breathing)',
      '5-valve (Honda, rare)',
      'SOHC (single overhead cam)',
      'DOHC (dual overhead cam)',
      'Pushrod/OHV (overhead valve with cam in block)',
      'Pentroof chamber (common with 4V)',
      'Hemispherical chamber (Hemi)'
    ],
    
    keySpecs: [
      'Flow rate (CFM at 28" test pressure)',
      'Port volume (cc)',
      'Combustion chamber volume (cc)',
      'Valve sizes (intake/exhaust diameter)',
      'Valve angle',
      'Number of valves per cylinder'
    ],
    
    signs: {
      good: [
        'Even valve seating (no leakage)',
        'Clean combustion chambers',
        'Smooth port surfaces',
        'Flat mating surface'
      ],
      bad: [
        'Cracked combustion chambers',
        'Burnt or eroded valve seats',
        'Warped deck surface',
        'Carbon buildup in ports (especially DI engines)',
        'Guide wear (excessive valve stem play)'
      ]
    },
    
    modPotential: {
      summary: 'Head modifications range from simple port matching to full CNC porting or aftermarket heads.',
      gains: 'Ported heads can add 15-30+ HP on NA engines. Aftermarket heads with larger valves and optimized ports can add 50-100+ HP on V8s.',
      considerations: 'Porting requires expertise—poor work can hurt power. Larger ports may sacrifice low-RPM velocity. Valve upgrades often require matching springs and retainers.'
    },
    
    relatedTopics: ['valvetrain', 'camshaft', 'combustion-chamber', 'port-design', 'valve-timing'],
    relatedUpgradeKeys: ['ported-heads', 'camshafts'],
    status: 'complete'
  },

  {
    slug: 'pistons',
    name: 'Pistons',
    system: 'engine',
    
    definition: 'Pistons are cylindrical components that move up and down within the engine cylinders, converting the explosive force of combustion into mechanical motion. They form the bottom of the combustion chamber and transfer force to the connecting rods. Piston design directly affects compression ratio, durability, and how much power an engine can safely produce.',
    
    howItWorks: 'During the power stroke, combustion pressure (1,000-1,500+ PSI) pushes the piston downward. Piston rings seal against the cylinder wall to contain combustion gases and control oil. The piston pin (wrist pin) connects the piston to the connecting rod. Piston crown shape affects combustion chamber volume and airflow—flat tops maximize compression while dished pistons reduce it. Valve reliefs are machined into the crown to prevent valve contact at high lift.',
    
    whyItMatters: 'Pistons must withstand extreme heat (500°F+ crown temperatures) and mechanical stress while reciprocating thousands of times per minute. Piston failure is catastrophic—they can break apart, melt, or seize in the bore. For any serious power build, upgrading to forged pistons is often the first internal modification considered.',
    
    commonTypes: [
      'Cast aluminum (stock, economical, limited strength)',
      'Hypereutectic (higher silicon, better wear resistance, still brittle)',
      'Forged aluminum (strongest, handles detonation and heat)',
      'Flat top (maximum compression)',
      'Dished (lower compression for boost)',
      'Dome (very high compression, typically NA racing)'
    ],
    
    keySpecs: [
      'Compression height (pin to crown)',
      'Piston-to-wall clearance (0.0015-0.004" typical)',
      'Ring land widths',
      'Pin diameter and type (press-fit, floating)',
      'Weight (affects reciprocating mass)',
      'Compression ratio (with chamber/head gasket)'
    ],
    
    signs: {
      good: [
        'Clean ring lands',
        'Smooth skirt surface',
        'Proper piston-to-wall clearance',
        'No scoring or scuffing marks'
      ],
      bad: [
        'Scuffed or scored skirts',
        'Melted or eroded crown (detonation)',
        'Cracked ring lands',
        'Excessive carbon buildup',
        'Pin bore wear (knock at idle)'
      ]
    },
    
    modPotential: {
      summary: 'Piston upgrades are essential for boosted or high-revving builds. Forged pistons with appropriate compression ratio are the standard upgrade.',
      gains: 'Stronger pistons allow more boost, higher RPM, and aggressive timing. Lighter pistons improve throttle response and raise safe rev limits.',
      considerations: 'Forged pistons expand more when cold, requiring larger cold clearances (more noise until warm). Must match rings and bore prep. Often done with rod and bearing upgrade (rotating assembly kit).'
    },
    
    relatedTopics: ['connecting-rods', 'bore', 'compression-ratio', 'engine-block', 'piston-rings'],
    relatedUpgradeKeys: ['forged-internals', 'stroker-kit'],
    status: 'complete'
  },

  {
    slug: 'connecting-rods',
    name: 'Connecting Rods',
    system: 'engine',
    
    definition: 'Connecting rods link the pistons to the crankshaft, converting the linear motion of the pistons into rotational motion. They must withstand enormous tensile loads (being pulled apart at high RPM) and compressive loads (combustion force pushing down), all while reciprocating thousands of times per minute.',
    
    howItWorks: 'The small end of the rod connects to the piston via the wrist pin, while the big end wraps around the crankshaft journal and is held together by rod bolts. The rod swings through an arc as the crankshaft rotates, constantly changing angle. Rod length affects piston dwell time at TDC and the angle at which force is applied to the crank. Longer rods reduce side loading on cylinder walls but require shorter pistons.',
    
    whyItMatters: 'Rod failure is catastrophic—a broken rod often exits through the side of the block. At high RPM, the tensile loads trying to pull the rod apart can exceed the compressive loads from combustion. Aftermarket rods are essential for high-power or high-RPM builds and are often the weakest link in stock engines pushed beyond their limits.',
    
    commonTypes: [
      'Cast (stock economy engines)',
      'Powdered metal/sintered (stock performance engines)',
      'Forged I-beam (lighter, good for high RPM)',
      'Forged H-beam (stronger, better for boost/power)',
      'Billet (ultimate strength, expensive)',
      'Titanium (lightest, very expensive)'
    ],
    
    keySpecs: [
      'Length (center to center)',
      'Big end diameter (matches crank journal)',
      'Small end diameter (matches wrist pin)',
      'Rod ratio (rod length ÷ stroke)',
      'Weight (reciprocating mass)',
      'Rod bolt type and torque spec'
    ],
    
    signs: {
      good: [
        'No visible cracks or surface defects',
        'Rod bolts properly torqued',
        'Bearing crush correct',
        'Straight (no bend or twist)'
      ],
      bad: [
        'Spun bearing (copper color on journal)',
        'Rod knock (rhythmic knock at idle)',
        'Visible cracks near big end',
        'Bent rod (piston/valve contact aftermath)',
        'Stretched rod bolts'
      ]
    },
    
    modPotential: {
      summary: 'Aftermarket rods are a key component of any forged rotating assembly for high-power builds.',
      gains: 'Stronger rods allow 50-100%+ more power than stock. Lighter rods improve throttle response and raise safe RPM limits. Properly matched rod/stroke ratios can optimize power characteristics.',
      considerations: 'H-beam vs I-beam choice depends on application. Must balance with crankshaft. Rod bolts are often upgraded separately. Quality matters—cheap rods fail.'
    },
    
    relatedTopics: ['pistons', 'crankshaft', 'engine-block', 'stroke'],
    relatedUpgradeKeys: ['forged-internals', 'stroker-kit'],
    status: 'complete'
  },

  {
    slug: 'crankshaft',
    name: 'Crankshaft',
    system: 'engine',
    
    definition: 'The crankshaft converts the reciprocating motion of the pistons into rotational motion that ultimately drives the wheels. It\'s a precisely machined and balanced shaft with offset journals (throws) that the connecting rods attach to. Crankshaft design determines engine stroke, firing order, and significantly affects engine character.',
    
    howItWorks: 'As pistons push down on connecting rods, the offset crank journals convert this force into rotation. Counterweights opposite each throw balance the rotating assembly to minimize vibration. Main journals run in bearings in the engine block, supporting the crank. The front of the crank drives accessories (alternator, AC, etc.) via the harmonic balancer, while the rear connects to the flywheel/flexplate. Journal overlap (how much main and rod journals overlap when viewed from the end) affects strength.',
    
    whyItMatters: 'Crankshaft stroke directly determines displacement—a longer stroke means more displacement from the same bore. Crank design affects engine balance, with some configurations (inline-6, flat-6) being inherently smooth while others (inline-4, V8) require balance shafts or accept some vibration. A broken crankshaft is a complete engine loss.',
    
    commonTypes: [
      'Cast iron (heavy, adequate for stock power)',
      'Cast steel (stronger than iron)',
      'Forged steel (strongest for high-power builds)',
      'Billet steel (ultimate strength, very expensive)',
      'Flat-plane (V8s, even firing, more vibration)',
      'Cross-plane (V8s, uneven firing, smoother)'
    ],
    
    keySpecs: [
      'Stroke length',
      'Main journal diameter',
      'Rod journal diameter',
      'Number of main bearings',
      'Internal vs external balance',
      'Journal overlap percentage'
    ],
    
    signs: {
      good: [
        'Journals within spec (measure with micrometer)',
        'No scoring or discoloration on journals',
        'Proper end play (0.002-0.006" typical)',
        'No cracks at fillets or keyways'
      ],
      bad: [
        'Scored or grooved journals',
        'Excessive end play (thrust bearing wear)',
        'Blue discoloration (overheating)',
        'Main bearing knock (low-frequency rumble)',
        'Visible cracks at stress points'
      ]
    },
    
    modPotential: {
      summary: 'Stroker cranks increase displacement by lengthening the stroke, often providing 10-20% more displacement from the same block.',
      gains: 'More displacement means more torque, especially low-end. Forged cranks survive power levels that would destroy cast units.',
      considerations: 'Stroker kits require matching rods and pistons. May require clearancing block/rods. Must be professionally balanced. Significantly more expensive than stock.'
    },
    
    relatedTopics: ['stroke', 'displacement', 'connecting-rods', 'flywheel', 'harmonic-balancer'],
    relatedUpgradeKeys: ['stroker-kit', 'forged-internals'],
    status: 'complete'
  },

  {
    slug: 'camshaft',
    name: 'Camshaft',
    system: 'engine',
    
    definition: 'The camshaft controls when and how long the intake and exhaust valves open. Its lobes push on lifters/followers to actuate the valves, and lobe shape determines the engine\'s power characteristics—from smooth idle to aggressive race power. The camshaft is often called the "brain" of the engine because it orchestrates the entire four-stroke cycle.',
    
    howItWorks: 'As the camshaft rotates (at half crankshaft speed on 4-strokes), egg-shaped lobes push on lifters or followers, which in turn open the valves against spring pressure. Lobe lift determines how far the valve opens; duration determines how long it stays open (measured in crankshaft degrees). Lobe separation angle (LSA) is the angle between intake and exhaust lobe centerlines on the same cylinder, affecting overlap when both valves are slightly open.',
    
    whyItMatters: 'The camshaft is one of the most significant bolt-on upgrades for naturally aspirated engines. More aggressive cams increase peak power by keeping valves open longer at high RPM, but sacrifice low-end torque and idle quality. Cam selection is a defining choice that shapes an engine\'s personality.',
    
    commonTypes: [
      'Flat tappet (older design, requires break-in)',
      'Roller (reduced friction, more aggressive profiles)',
      'Hydraulic (self-adjusting, quiet)',
      'Solid/mechanical (requires periodic adjustment, higher RPM)',
      'SOHC (one cam per head)',
      'DOHC (separate intake and exhaust cams)'
    ],
    
    keySpecs: [
      'Duration at 0.050" lift (intake/exhaust)',
      'Gross/advertised duration',
      'Lift (intake/exhaust)',
      'Lobe separation angle (LSA)',
      'Installed centerline',
      'Ramp rate (how quickly the lobe opens/closes)'
    ],
    
    signs: {
      good: [
        'Smooth lobe surfaces',
        'Consistent lobe lift across cylinders',
        'No pitting or scoring',
        'Proper valve lash (solid cams)'
      ],
      bad: [
        'Worn or flat lobes (tapping noise)',
        'Pitted or scored lobe surfaces',
        'Excessive cam bearing play',
        'Worn cam journals',
        'Broken dowel pin (timing jump)'
      ]
    },
    
    modPotential: {
      summary: 'Aftermarket cams are the heart of NA engine builds. Selection ranges from mild (stock-like idle, modest gains) to wild (choppy idle, major top-end power).',
      gains: 'Depending on cam choice: 15-50+ HP on typical 4-cylinders, 30-100+ HP on V8s. Shifts powerband higher in RPM range.',
      considerations: 'Aggressive cams often require matching valve springs, retainers, and ECU tuning. May require higher stall converter for automatics. Emissions implications on street cars.'
    },
    
    relatedTopics: ['valvetrain', 'valve-timing', 'variable-valve-timing', 'cylinder-head'],
    relatedUpgradeKeys: ['camshafts'],
    status: 'complete'
  },

  {
    slug: 'valvetrain',
    name: 'Valvetrain',
    system: 'engine',
    
    definition: 'The valvetrain is the complete system of components that opens and closes the engine\'s valves. It includes the camshaft(s), lifters/followers, pushrods (if applicable), rocker arms, valve springs, retainers, keepers, and the valves themselves. Every component must work in precise harmony at speeds exceeding 100 cycles per second at high RPM.',
    
    howItWorks: 'The camshaft lobe pushes on a lifter or follower, which either directly actuates the valve (OHC) or pushes a pushrod that pivots a rocker arm (OHV). The valve opens against spring pressure, allowing air/fuel in or exhaust out. When the cam lobe rotates past, spring force closes the valve. The entire system must maintain precise geometry and timing while handling extreme accelerations—valve springs can experience forces exceeding 500+ lbs at high RPM.',
    
    whyItMatters: 'Valvetrain components often limit safe RPM. "Valve float" occurs when springs can\'t close valves fast enough—the valve bounces or hangs open, causing power loss or catastrophic piston/valve contact. Upgrading valvetrain components is essential for any high-RPM build and is often required when installing aftermarket cams.',
    
    commonTypes: [
      'OHV with pushrods and rockers (traditional V8)',
      'SOHC with rocker followers',
      'DOHC with bucket/finger followers',
      'Hydraulic lifters (self-adjusting)',
      'Solid lifters (adjustable, higher RPM capable)',
      'Roller lifters/rockers (reduced friction)'
    ],
    
    keySpecs: [
      'Valve spring rate (seat and open pressure)',
      'Installed height',
      'Coil bind height',
      'Rocker ratio (if applicable)',
      'Lifter/follower type',
      'Maximum safe RPM'
    ],
    
    signs: {
      good: [
        'Quiet operation (no ticking)',
        'Proper valve lash',
        'Even spring pressures',
        'Clean, unscored components'
      ],
      bad: [
        'Ticking or tapping (valve lash, worn lifter)',
        'Collapsed lifter (loss of power on cylinder)',
        'Broken valve spring (misfiring, potential catastrophic failure)',
        'Worn rocker tips or pivots',
        'Bent pushrods (indicator of more serious issue)'
      ]
    },
    
    modPotential: {
      summary: 'Valvetrain upgrades are essential for high-RPM operation and are typically bundled with camshaft upgrades.',
      gains: 'Higher-rate springs and lighter retainers allow 500-2000+ RPM higher rev limits. Roller components reduce friction for 1-3% power gain.',
      considerations: 'Springs must match cam profile and intended RPM. Titanium retainers are lighter but more expensive. Excessive spring pressure accelerates cam wear. Professional installation recommended.'
    },
    
    relatedTopics: ['camshaft', 'valve-timing', 'cylinder-head'],
    relatedUpgradeKeys: ['camshafts', 'valve-springs'],
    status: 'complete'
  },

  {
    slug: 'flywheel',
    name: 'Flywheel',
    system: 'engine',
    
    definition: 'The flywheel is a heavy rotating disc bolted to the crankshaft that stores rotational energy and provides a smooth surface for the clutch to engage. It absorbs power pulses from individual cylinders to deliver smooth rotation and provides the ring gear that the starter motor engages to crank the engine.',
    
    howItWorks: 'The flywheel\'s mass creates rotational inertia—once spinning, it resists changes in speed. This smooths out the power pulses from each cylinder\'s firing and helps the engine idle smoothly with less fluctuation. The clutch disc presses against the flywheel\'s friction surface, and when engaged, transmits engine power to the transmission. Heavier flywheels store more energy but require more effort to accelerate.',
    
    whyItMatters: 'Flywheel weight dramatically affects how the engine responds to throttle input. A heavy flywheel makes the car feel lazier but easier to modulate, while a lightweight flywheel makes the engine rev quicker and feel more responsive—a significant change in driving character that affects everything from daily driving to track performance.',
    
    commonTypes: [
      'Cast iron (heavy, stock, durable)',
      'Steel (lighter than iron, still durable)',
      'Aluminum with steel insert (much lighter)',
      'Chromoly (light and strong)',
      'Single-mass (most aftermarket)',
      'Dual-mass (stock on many modern cars, absorbs vibration)'
    ],
    
    keySpecs: [
      'Weight (lbs)',
      'Step height (if applicable)',
      'Ring gear tooth count',
      'Balance (internal vs external)',
      'SFI rating (for racing)',
      'Material and heat treatment'
    ],
    
    signs: {
      good: [
        'Smooth friction surface',
        'No hot spots or discoloration',
        'Ring gear teeth intact',
        'No runout (wobble)'
      ],
      bad: [
        'Hot spots (blue/purple discoloration)',
        'Scoring or grooves in friction surface',
        'Cracked (especially at bolt holes)',
        'Glazed surface (clutch slipping)',
        'Damaged ring gear teeth (starter grinding)'
      ]
    },
    
    modPotential: {
      summary: 'Lightweight flywheels are popular upgrades for improved throttle response and faster revving.',
      gains: 'Reduced rotating mass means faster acceleration and deceleration of the engine. Can shave 0.1-0.3 seconds off 0-60 times. More responsive throttle feel.',
      considerations: 'Very light flywheels can make the car harder to launch smoothly and may cause rougher idle. Single-mass conversions from dual-mass require a matching clutch kit. Balance with crankshaft is critical.'
    },
    
    relatedTopics: ['clutch', 'crankshaft', 'manual-transmission'],
    relatedUpgradeKeys: ['lightweight-flywheel'],
    status: 'complete'
  },

  {
    slug: 'bore',
    name: 'Bore',
    system: 'engine',
    
    definition: 'Bore is the diameter of each cylinder in the engine block, measured in millimeters or inches. Along with stroke, bore directly determines the engine\'s displacement. The bore diameter affects how large the valves can be, which influences high-RPM breathing capability.',
    
    howItWorks: 'A larger bore allows for bigger pistons with more surface area to receive combustion pressure. This increases displacement without making the engine physically longer. Larger bores also permit larger intake and exhaust valves, improving airflow at high RPM. The relationship between bore and stroke is described as the bore-to-stroke ratio, which significantly affects engine character.',
    
    whyItMatters: 'Bore size has major implications for engine design. "Oversquare" engines (bore larger than stroke) favor high-RPM power because the larger bore allows larger valves. "Undersquare" engines (stroke larger than bore) favor low-end torque. Most performance engines are square or slightly oversquare for a balance of characteristics.',
    
    commonTypes: [
      'Standard bore (factory specification)',
      'Overbored (+0.5mm, +1mm common)',
      'Sleeved (allows significant bore changes)',
      'Nikasil/Alusil coated (cannot be traditionally bored)'
    ],
    
    keySpecs: [
      'Bore diameter (mm or inches)',
      'Maximum overbore limit',
      'Cylinder wall thickness',
      'Bore spacing (distance between cylinders)',
      'Bore-to-stroke ratio'
    ],
    
    signs: {
      good: [
        'Consistent bore diameter (within 0.001")',
        'Proper crosshatch honing pattern',
        'Round bore (no out-of-round)',
        'Straight bore (no taper)'
      ],
      bad: [
        'Ridge at top of bore (wear line)',
        'Taper wear (wider at top)',
        'Out-of-round (oval shape)',
        'Scoring from piston/ring failure',
        'Insufficient wall thickness for overbore'
      ]
    },
    
    modPotential: {
      summary: 'Engines can be bored oversize during rebuilds to restore worn cylinders or increase displacement slightly.',
      gains: 'Common 0.5-1mm overbores add 1-3% displacement. Larger overbores or sleeving can significantly increase displacement.',
      considerations: 'There are limits to how far a block can be bored based on cylinder wall thickness. Sleeving is an option when walls are too thin. Overbore requires matching oversized pistons.'
    },
    
    relatedTopics: ['stroke', 'displacement', 'engine-block', 'pistons'],
    relatedUpgradeKeys: ['stroker-kit'],
    status: 'complete'
  },

  {
    slug: 'stroke',
    name: 'Stroke',
    system: 'engine',
    
    definition: 'Stroke is the distance the piston travels from top dead center (TDC) to bottom dead center (BDC), determined by the crankshaft throw design. Along with bore, stroke directly determines displacement. Stroke length significantly influences engine character—longer strokes favor torque, while shorter strokes favor high-RPM power.',
    
    howItWorks: 'The stroke is mechanically determined by the crankshaft. The offset of the rod journals from the crankshaft centerline equals half the stroke. During each revolution, the piston travels up and down by the stroke distance. Longer strokes mean higher piston speeds at any given RPM, which eventually limits safe maximum engine speed due to inertial loads on the connecting rods.',
    
    whyItMatters: 'Stroke determines much of an engine\'s personality. Long-stroke engines produce more torque at lower RPM and have a "pulling" feel, while short-stroke engines rev freely and make their power at higher RPM. The stroke also affects engine dimensions—longer strokes make taller engines.',
    
    commonTypes: [
      'Stock stroke (factory specification)',
      'Stroker (increased stroke via different crankshaft)',
      'Destroked (decreased stroke, rare, high-RPM racing)'
    ],
    
    keySpecs: [
      'Stroke length (mm or inches)',
      'Rod length to stroke ratio',
      'Piston speed at max RPM',
      'Connecting rod clearance requirements',
      'Block modification requirements (if any)'
    ],
    
    signs: {
      good: [
        'Smooth engine operation throughout RPM range',
        'Proper piston-to-head clearance',
        'Rod clearance to block verified'
      ],
      bad: [
        'Rod contact with block (stroker builds)',
        'Piston-to-head interference',
        'Excessive vibration at high RPM'
      ]
    },
    
    modPotential: {
      summary: 'Stroker kits replace the crankshaft with a longer-throw design, often increasing displacement by 10-20%.',
      gains: 'More displacement means more torque, especially in the low-to-mid RPM range. A 10% displacement increase typically yields 8-12% more power.',
      considerations: 'Stroker builds require matching rods and pistons. May require block clearancing. Changes rod ratio, affecting engine character. More expensive than bore increase but often more effective.'
    },
    
    relatedTopics: ['bore', 'displacement', 'crankshaft', 'connecting-rods'],
    relatedUpgradeKeys: ['stroker-kit'],
    status: 'complete'
  },

  {
    slug: 'displacement',
    name: 'Displacement',
    system: 'engine',
    
    definition: 'Displacement is the total volume swept by all pistons during one complete engine cycle, typically measured in liters (L), cubic centimeters (cc), or cubic inches (ci). It\'s calculated as: π × (bore/2)² × stroke × number of cylinders. Displacement is the primary determinant of an engine\'s power potential.',
    
    howItWorks: 'Each cylinder sweeps a volume equal to the bore area times the stroke. The total displacement is this volume multiplied by the number of cylinders. More displacement means the engine can process more air and fuel per cycle, producing more power. This is why "there\'s no replacement for displacement" became an enthusiast saying—more displacement is a fundamental way to make more power.',
    
    whyItMatters: 'Displacement is the baseline for power potential. A 2.0L engine making 300 HP is working much harder than a 5.0L making 300 HP. Forced induction can compensate for lower displacement (a boosted 2.0L can match a 5.0L), but naturally aspirated engines are heavily dependent on displacement for power.',
    
    commonTypes: [
      'Factory displacement (as engineered)',
      'Stroked (increased via crankshaft)',
      'Bored (increased via larger bore)',
      'Stroked and bored (maximum increase)'
    ],
    
    keySpecs: [
      'Total displacement (L, cc, or ci)',
      'Per-cylinder displacement',
      'Specific output (HP per liter)',
      'Bore × stroke dimensions'
    ],
    
    modPotential: {
      summary: 'Displacement can be increased through boring, stroking, or both. This is a foundational modification for serious NA builds.',
      gains: 'Each 10% displacement increase typically yields 8-12% more power. Improves torque throughout the RPM range, especially low-end.',
      considerations: 'Displacement increases require internal engine work. Stroking is more effective than boring for the same displacement gain. Costs range from $2,000-10,000+ depending on approach.'
    },
    
    relatedTopics: ['bore', 'stroke', 'engine-block', 'crankshaft'],
    relatedUpgradeKeys: ['stroker-kit'],
    status: 'complete'
  },

  {
    slug: 'v-angles',
    name: 'V Angles',
    system: 'engine',
    
    definition: 'V angle refers to the angle between the two banks of cylinders in a V-configuration engine, measured in degrees. Common V angles include 60°, 90°, and 72° (Audi/VW VR engines). The V angle significantly affects engine balance, packaging, and sound character.',
    
    howItWorks: 'In a V engine, cylinders are arranged in two banks that share a common crankshaft. The angle between these banks affects how firing pulses are distributed and how well the engine naturally balances. A 90° V8 with a cross-plane crank has natural primary balance, while a 60° V6 can be almost as smooth as an inline-6. Some angles require balance shafts to reduce vibration.',
    
    whyItMatters: 'V angle affects engine smoothness, sound, and packaging. Wider angles make shorter, wider engines suitable for low-hood designs (Corvette\'s 90° V8). Narrower angles make taller, narrower engines that can fit transversely in front-wheel-drive cars. V angle also contributes to the distinctive sound of different engines.',
    
    commonTypes: [
      '60° (V6s, V12s - good natural balance)',
      '90° (V8s, some V6s - wide, low)',
      '72° (VW/Audi VR engines - narrow)',
      '120° (flat plane alternative, rare)',
      '180° (boxer, technically a flat engine)'
    ],
    
    keySpecs: [
      'V angle in degrees',
      'Bank offset (if any)',
      'Crankshaft pin arrangement',
      'Balance requirements'
    ],
    
    relatedTopics: ['flat-boxer', 'crankshaft', 'engine-block'],
    status: 'complete'
  },

  {
    slug: 'flat-boxer',
    name: 'Flat/Boxer Configuration',
    system: 'engine',
    
    definition: 'Flat or "boxer" engines have horizontally opposed cylinders that face each other across a central crankshaft, with pistons that move toward and away from each other like boxers punching. This configuration is used by Porsche (flat-6) and Subaru (flat-4) and offers unique advantages in balance and center of gravity.',
    
    howItWorks: 'In a boxer engine, opposing pistons move outward and inward simultaneously, naturally canceling primary and secondary vibrations. This results in excellent inherent balance without requiring balance shafts. The low, wide design places the engine mass very low in the chassis, lowering the vehicle\'s center of gravity.',
    
    whyItMatters: 'Boxer engines offer exceptional smoothness and a low center of gravity that improves handling. The distinctive boxer "rumble" (especially in Subaru\'s unequal-length header design) has become an iconic sound. However, the wide layout can complicate packaging and make some maintenance tasks more difficult.',
    
    commonTypes: [
      'Flat-4 (Subaru, classic VW)',
      'Flat-6 (Porsche)',
      'Flat-12 (Ferrari, rare Porsche racing)'
    ],
    
    keySpecs: [
      'Number of cylinders',
      'Bore and stroke',
      'Engine width',
      'Center of gravity height'
    ],
    
    relatedTopics: ['v-angles', 'crankshaft', 'engine-block'],
    status: 'complete'
  },

  {
    slug: 'rotary-wankel',
    name: 'Rotary Engine (Wankel)',
    system: 'engine',
    
    definition: 'The rotary or Wankel engine uses triangular rotors instead of pistons, spinning eccentrically within an epitrochoid housing to create three distinct chambers that cycle through intake, compression, combustion, and exhaust. Made famous by Mazda in the RX-7 and RX-8, rotary engines are known for their high power-to-displacement ratio and unique character.',
    
    howItWorks: 'A triangular rotor orbits around an eccentric shaft (equivalent to a crankshaft), with its three faces continuously creating and collapsing chambers against the housing. Each face goes through all four strokes during one rotor revolution, meaning a two-rotor engine fires six times per output shaft revolution. This results in extremely smooth power delivery and high RPM capability—redlines of 9,000+ RPM are common.',
    
    whyItMatters: 'Rotary engines produce remarkable power from small displacement—a 1.3L twin-rotor can match 2.5-3.0L piston engines. They\'re smooth, compact, and have an intoxicating character unlike any piston engine. However, they\'re less fuel-efficient and can burn oil by design (apex seals require lubrication). The rotary community is passionate and devoted to these unique powerplants.',
    
    commonTypes: [
      '12A (early Mazda, 1.1L equivalent)',
      '13B (most common, 1.3L equivalent)',
      '13B-REW (twin-turbo RX-7)',
      '20B (three-rotor, 2.0L equivalent)',
      'Renesis (RX-8, side-exhaust ports)'
    ],
    
    keySpecs: [
      'Rotor count (1, 2, or 3)',
      'Displacement (per chamber × 3 × rotors)',
      'Eccentric shaft timing',
      'Port timing (peripheral vs side)',
      'Apex seal condition'
    ],
    
    signs: {
      good: [
        'Strong, even compression across all faces',
        'Clean idle with no flooding',
        'Good hot restart capability',
        'Oil consumption within spec (1 qt/3000 miles typical)'
      ],
      bad: [
        'Weak or uneven compression',
        'Flooding (hard starts when warm)',
        'Excessive smoking',
        'Coolant seal failure (coolant in combustion)',
        'Apex seal chatter (ticking sound)'
      ]
    },
    
    modPotential: {
      summary: 'Rotaries respond extremely well to forced induction and porting, with massive power gains possible.',
      gains: 'Porting can add 20-50 HP on NA 13B. Turbo builds commonly make 400-800+ HP. The compact size makes turbo installation relatively straightforward.',
      considerations: 'Rotaries require specific knowledge and care. Oil pre-mixing is recommended. Higher compression racing builds sacrifice street manners. Apex seals are the Achilles heel and require monitoring.'
    },
    
    relatedTopics: ['ecu-tuning', 'turbocharger', 'engine-block'],
    status: 'complete'
  }
];

export default engineTopics;


