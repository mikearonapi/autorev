/**
 * AIR INTAKE & FORCED INDUCTION TOPICS - Complete Encyclopedia Content
 * 
 * 12 comprehensive topics covering intake and boost systems.
 * All topics have full educational content - no stubs.
 * 
 * @module encyclopediaTopics/intake
 */

export const intakeTopics = [
  {
    slug: 'intake-airbox',
    name: 'Intake & Airbox',
    system: 'intake-forced-induction',
    
    definition: 'The intake system encompasses all components that deliver air from outside the vehicle to the engine\'s throttle body or turbo inlet. The airbox is an enclosed chamber that houses the air filter, designed to provide clean, consistent airflow while reducing intake noise and protecting the filter from heat and water.',
    
    howItWorks: 'Air enters through an opening (often in the front grille or fender) and flows into the airbox, where it passes through the filter element. From there, it travels through intake tubing to the throttle body or (in turbo applications) the turbo compressor inlet. Stock airboxes are engineered to dampen intake noise and draw air from cooler locations. The airbox volume also acts as a resonance chamber, tuned to boost airflow at certain RPM ranges.',
    
    whyItMatters: 'The intake system is the first bottleneck in the engine\'s airflow path. A restrictive intake limits power potential. However, stock systems are often well-designed for street use—they balance performance, noise, and heat management. Aftermarket intakes prioritize flow over other factors, which can provide gains but may also increase noise and potentially intake air temperature.',
    
    commonTypes: [
      'Factory airbox (enclosed, tuned)',
      'Cold air intake (draws from cool air source)',
      'Short ram intake (minimal tubing, may draw hot air)',
      'Ram air intake (uses vehicle motion for pressure)',
      'Carbon fiber airbox (lightweight, some thermal insulation)'
    ],
    
    keySpecs: [
      'Airbox volume (liters)',
      'Inlet diameter',
      'Filter surface area',
      'Intake tract length (affects tuning)',
      'Air temperature at filter'
    ],
    
    signs: {
      good: [
        'Clean, unrestricted filter',
        'Sealed connections (no air leaks)',
        'Cool intake air temperatures',
        'Smooth idle and throttle response'
      ],
      bad: [
        'Dirty or clogged filter',
        'Cracked or damaged tubing',
        'Hot air being ingested',
        'Whistling or hissing (air leaks)',
        'Debris in airbox'
      ]
    },
    
    modPotential: {
      summary: 'Intake upgrades range from drop-in performance filters to complete cold air intake systems.',
      gains: 'Typical gains of 5-15 HP depending on engine and restrictiveness of stock system. Better throttle response and intake sound.',
      considerations: 'Some "cold air" intakes actually draw warmer underhood air. Oiled filters can contaminate MAF sensors. May require ECU recalibration for MAF-based systems.'
    },
    
    relatedTopics: ['high-flow-air-filter', 'cold-air-intake', 'maf-sensor', 'turbocharger'],
    relatedUpgradeKeys: ['cold-air-intake', 'intake-upgrade'],
    status: 'complete'
  },

  {
    slug: 'high-flow-air-filter',
    name: 'High Flow Air Filter',
    system: 'intake-forced-induction',
    
    definition: 'High-flow air filters are designed to allow more airflow than stock paper filters while still filtering contaminants. They typically use cotton gauze, foam, or synthetic media and are often reusable—cleaned and re-oiled rather than replaced.',
    
    howItWorks: 'Unlike paper filters that trap particles on the surface, high-flow filters use depth filtration through layers of oiled cotton or foam. The oil helps capture small particles. Multi-layer designs increase surface area while maintaining low restriction. Some filters use dry synthetic media that doesn\'t require oiling. The goal is to reduce the pressure drop across the filter while maintaining adequate filtration.',
    
    whyItMatters: 'The air filter is an often-overlooked restriction. A clean stock filter isn\'t terribly restrictive, but high-flow filters reduce restriction further. The real benefit is often cost savings over time (reusable) and the characteristic intake sound. However, over-oiled filters can damage MAF sensors, and some filters may allow more particles through than stock.',
    
    commonTypes: [
      'Oiled cotton gauze (K&N style)',
      'Dry synthetic (no oil required)',
      'Foam (often for off-road/dusty conditions)',
      'Panel filter (drop-in replacement)',
      'Cone filter (for aftermarket intakes)'
    ],
    
    keySpecs: [
      'Flow capacity (CFM)',
      'Filtration efficiency (%)',
      'Pressure drop at flow rate',
      'Service interval',
      'Filter surface area'
    ],
    
    signs: {
      good: [
        'Clean, properly oiled (if oiled type)',
        'No damage to filter media',
        'Proper seal to airbox',
        'Free of debris'
      ],
      bad: [
        'Over-oiled (oil visible on MAF)',
        'Dirty/clogged media',
        'Torn or damaged filter',
        'Poor seal allowing unfiltered air',
        'Debris reaching engine'
      ]
    },
    
    modPotential: {
      summary: 'High-flow filters are an inexpensive first modification with modest gains.',
      gains: 'Typically 1-5 HP, better throttle response, improved intake sound. Main benefit is reusability and long-term cost savings.',
      considerations: 'Over-oiling damages MAF sensors. Dry filters avoid this issue. Some filters may reduce filtration efficiency. Clean on recommended schedule.'
    },
    
    relatedTopics: ['intake-airbox', 'cold-air-intake', 'maf-sensor'],
    relatedUpgradeKeys: ['air-filter', 'cold-air-intake'],
    status: 'complete'
  },

  {
    slug: 'cold-air-intake',
    name: 'Cold Air Intake',
    system: 'intake-forced-induction',
    
    definition: 'A cold air intake (CAI) is an aftermarket intake system designed to draw cooler air from outside the engine bay, typically from the fender well, bumper area, or front grille. Cooler air is denser, containing more oxygen per volume, which allows the engine to make more power.',
    
    howItWorks: 'Cold air intakes relocate the filter away from the hot engine bay, often using a heat shield or enclosed box to isolate the filter from engine heat. Tubing routes air from this cool location to the throttle body. Some designs use ram air principles, capturing high-pressure air from vehicle motion. For every 10°F reduction in intake air temperature, engine power increases by approximately 1% due to increased air density.',
    
    whyItMatters: 'Intake air temperature directly affects power—engines make less power on hot days because the air is less dense. A true cold air intake can reduce intake temps by 20-50°F compared to stock, translating to meaningful power gains. However, many "cold air intakes" position the filter in the engine bay where it can actually be hotter than stock, negating benefits.',
    
    commonTypes: [
      'Fender-mounted (true cold air)',
      'Engine bay with heat shield',
      'Ram air (high-pressure inlet)',
      'Enclosed airbox design',
      'Open element (often not truly "cold air")'
    ],
    
    keySpecs: [
      'Intake air temperature vs stock',
      'Filter location',
      'Tube diameter',
      'Heat shielding quality',
      'Water protection'
    ],
    
    signs: {
      good: [
        'Lower intake temps than stock',
        'Isolated from engine heat',
        'Protected from water ingestion',
        'Improved throttle response'
      ],
      bad: [
        'Filter exposed to engine heat',
        'Higher intake temps than stock',
        'Vulnerable to water (puddles, rain)',
        'MAF sensor issues (if oiled filter)',
        'Check engine light from air leaks'
      ]
    },
    
    modPotential: {
      summary: 'A well-designed cold air intake provides modest power gains and improved throttle response.',
      gains: 'Typical gains of 5-20 HP depending on how restrictive stock system is. Better sound and throttle feel.',
      considerations: 'True cold air routing is essential—engine bay intakes may hurt performance. Hydrolock risk if filter can get submerged. May require tune for proper MAF scaling.'
    },
    
    relatedTopics: ['intake-airbox', 'high-flow-air-filter', 'maf-sensor', 'turbocharger'],
    relatedUpgradeKeys: ['cold-air-intake'],
    status: 'complete'
  },

  {
    slug: 'turbocharger',
    name: 'Turbocharger',
    system: 'intake-forced-induction',
    
    definition: 'A turbocharger is an exhaust-driven air compressor that forces more air into the engine than it could naturally aspirate, allowing it to burn more fuel and produce significantly more power. Unlike superchargers, turbos are powered by exhaust gas energy that would otherwise be wasted.',
    
    howItWorks: 'Exhaust gases spin a turbine wheel at speeds up to 200,000+ RPM. This turbine is connected via a shaft to a compressor wheel on the intake side. The compressor pressurizes incoming air (creating "boost"), which is typically cooled by an intercooler before entering the engine. Turbo sizing involves balancing response (smaller turbos spool faster) against top-end power (larger turbos flow more air). The A/R ratio of the housings affects both response and maximum flow.',
    
    whyItMatters: 'Turbocharging can increase power by 30-100%+ from the same displacement engine. Modern turbos with ball bearings, twin-scroll housings, and variable geometry offer excellent response with minimal lag. The efficiency of extracting power from waste exhaust heat makes turbos more fuel-efficient than superchargers for equivalent power gains.',
    
    commonTypes: [
      'Single turbo (most common)',
      'Twin turbo parallel (each turbo feeds half the cylinders)',
      'Twin turbo sequential (small turbo for low RPM, large for high)',
      'Twin-scroll (divided exhaust housing for better response)',
      'Variable geometry turbo (VGT/VNT)',
      'Ball bearing vs journal bearing'
    ],
    
    keySpecs: [
      'Compressor inducer/exducer diameter',
      'Turbine A/R ratio',
      'Compressor A/R ratio',
      'Maximum boost pressure',
      'Compressor map (flow vs pressure ratio)',
      'Bearing type'
    ],
    
    signs: {
      good: [
        'Smooth, linear boost delivery',
        'Consistent boost pressure',
        'No smoke at idle or under boost',
        'Clean turbo whine without grinding',
        'Proper oil pressure to bearings'
      ],
      bad: [
        'Excessive shaft play',
        'Oil in intercooler piping',
        'Blue/white smoke under boost',
        'Grinding or whining sounds',
        'Boost creep or inability to hit target',
        'Compressor surge'
      ]
    },
    
    modPotential: {
      summary: 'Turbo upgrades range from bolt-on larger units to full custom turbo kits on naturally aspirated cars.',
      gains: 'Upgraded turbos can add 50-500+ HP depending on supporting mods and engine strength.',
      considerations: 'Requires supporting mods: fuel system, intercooler, exhaust, tune. Heat management critical. May require internal engine upgrades at high power levels. Turbo kits for NA cars cost $3,000-10,000+.'
    },
    
    relatedTopics: ['wastegate', 'blow-off-valve', 'intercooler', 'boost-controller', 'downpipe'],
    relatedUpgradeKeys: ['turbo-upgrade', 'turbo-kit'],
    status: 'complete'
  },

  {
    slug: 'supercharger',
    name: 'Supercharger',
    system: 'intake-forced-induction',
    
    definition: 'A supercharger is a belt or gear-driven air compressor that forces more air into the engine, providing boost without the exhaust-driven lag associated with turbochargers. Superchargers provide immediate throttle response since boost is directly proportional to engine RPM.',
    
    howItWorks: 'The supercharger is driven by a belt connected to the crankshaft (or in rare cases, gears). As the engine spins, the supercharger spins proportionally, compressing intake air. Roots and twin-screw types use meshing rotors to trap and compress air; centrifugal types use a spinning impeller similar to a turbo\'s compressor. Because boost is proportional to RPM, superchargers deliver linear power delivery without turbo lag.',
    
    whyItMatters: 'Superchargers provide the predictable, immediate response that many drivers prefer. There\'s no waiting for boost—press the throttle and power is instant. This makes them popular for street driving and applications where predictable power delivery matters more than ultimate efficiency. The characteristic supercharger whine is also part of their appeal.',
    
    commonTypes: [
      'Roots (oldest design, creates boost without compression)',
      'Twin-screw (compresses internally, more efficient)',
      'Centrifugal (impeller-based, boost rises with RPM)',
      'Electric supercharger (eliminates parasitic drag)',
      'Belt-driven vs gear-driven'
    ],
    
    keySpecs: [
      'Displacement (cubic inches per revolution)',
      'Maximum boost pressure',
      'Drive ratio',
      'Parasitic loss (HP consumed)',
      'Thermal efficiency',
      'Maximum RPM'
    ],
    
    signs: {
      good: [
        'Immediate boost response',
        'Consistent boost across RPM range',
        'Proper belt tension',
        'No bearing noise',
        'Adequate intercooling'
      ],
      bad: [
        'Belt slipping or squealing',
        'Excessive bearing noise',
        'Oil leaks from seals',
        'High discharge temperatures',
        'Coupler or drive unit failure'
      ]
    },
    
    modPotential: {
      summary: 'Supercharger kits add reliable, predictable power with immediate throttle response.',
      gains: 'Typical kits add 40-60% power. Larger pulleys can increase boost further.',
      considerations: 'Parasitic losses reduce efficiency vs turbos. Heat generation requires good intercooling. Belt/drive maintenance required. Kits typically cost $4,000-8,000+.'
    },
    
    relatedTopics: ['pulley-upgrade', 'intercooler', 'boost-controller', 'ecu-tuning'],
    relatedUpgradeKeys: ['supercharger-kit', 'supercharger-upgrade'],
    status: 'complete'
  },

  {
    slug: 'pulley-upgrade',
    name: 'Pulley Upgrade',
    system: 'intake-forced-induction',
    
    definition: 'Pulley upgrades change the drive ratio of a supercharger to increase or decrease boost pressure. A smaller supercharger pulley (or larger crank pulley) spins the supercharger faster, creating more boost. This is one of the simplest and most cost-effective ways to increase power on supercharged vehicles.',
    
    howItWorks: 'The ratio between the crankshaft pulley and supercharger pulley determines how fast the blower spins relative to engine speed. A 10% reduction in supercharger pulley diameter increases blower speed by roughly 10%, which increases boost pressure. The relationship between pulley size and boost isn\'t linear—smaller pulleys also increase heat generation and parasitic load. Proper tuning is required after any pulley change.',
    
    whyItMatters: 'For factory supercharged cars (Hellcat, ZL1, GT500, etc.), pulley swaps are often the first modification. They\'re relatively inexpensive, easy to install, and can add significant power. A typical pulley swap on a modern supercharged V8 can add 50-100+ HP with proper supporting mods and tuning.',
    
    commonTypes: [
      'Smaller supercharger pulley (more boost)',
      'Larger crank pulley (more boost)',
      'Griptec/keyed pulleys (prevent slipping)',
      'Adjustable pulley systems',
      'Multi-rib vs traditional V-belt'
    ],
    
    keySpecs: [
      'Pulley diameter',
      'Boost increase (PSI)',
      'Drive ratio change (%)',
      'Belt length requirement',
      'Material (steel, aluminum)'
    ],
    
    signs: {
      good: [
        'Consistent boost at target',
        'Belt tracking properly',
        'No belt slip under load',
        'Temperatures in check'
      ],
      bad: [
        'Belt slipping (squealing)',
        'Excessive discharge temps',
        'Belt throwing/jumping',
        'Boost falling short of target',
        'Supercharger overspeeding'
      ]
    },
    
    modPotential: {
      summary: 'Pulley upgrades are a cost-effective way to increase boost on supercharged applications.',
      gains: '2-5 PSI boost increase typical. Power gains of 30-100+ HP depending on engine and supporting mods.',
      considerations: 'Must tune for increased boost. Heat management becomes critical. May need smaller idler/tensioner pulleys. Belt upgrades often required. $100-500 for pulley kits.'
    },
    
    relatedTopics: ['supercharger', 'intercooler', 'ecu-tuning', 'boost-controller'],
    relatedUpgradeKeys: ['pulley-upgrade', 'supercharger-upgrade'],
    status: 'complete'
  },

  {
    slug: 'wastegate',
    name: 'Wastegate',
    system: 'intake-forced-induction',
    
    definition: 'A wastegate is a valve that bypasses exhaust gas around the turbo\'s turbine, controlling boost pressure. When boost reaches the target, the wastegate opens to divert exhaust away from the turbine, preventing over-boost. Wastegates can be internal (built into the turbo housing) or external (separate unit).',
    
    howItWorks: 'The wastegate is controlled by a pressure actuator connected to boost pressure. As boost builds, pressure acts on a diaphragm or piston, opening the wastegate valve against spring pressure. This diverts exhaust around the turbine, reducing its speed and limiting boost. Electronic wastegate control (common on modern turbos) uses a solenoid to modulate the pressure signal, allowing precise boost control across the RPM range.',
    
    whyItMatters: 'The wastegate determines maximum boost pressure and how the turbo behaves. Stock wastegates on performance cars are often sized conservatively—upgrading to a larger wastegate or external wastegate improves boost control and can eliminate boost creep. Proper wastegate sizing is essential for any turbo upgrade.',
    
    commonTypes: [
      'Internal wastegate (built into turbine housing)',
      'External wastegate (separate housing, more flow)',
      'Pneumatic actuator (spring + boost pressure)',
      'Electronic actuator (motor-driven)',
      'Screamer pipe (external WG vents to atmosphere)'
    ],
    
    keySpecs: [
      'Valve diameter (mm)',
      'Spring pressure (PSI)',
      'Actuator type',
      'Maximum flow capacity',
      'Duty cycle range (electronic)'
    ],
    
    signs: {
      good: [
        'Boost hits target and holds steady',
        'No boost creep at high RPM',
        'Quick boost response',
        'Wastegate opens smoothly'
      ],
      bad: [
        'Boost creep (can\'t control max boost)',
        'Boost spikes',
        'Slow boost response',
        'Wastegate rattle',
        'Actuator failure (can\'t hold boost)'
      ]
    },
    
    modPotential: {
      summary: 'Wastegate upgrades improve boost control and are essential for turbo upgrades.',
      gains: 'Better boost stability. Eliminate boost creep. Enable higher boost targets. External wastegate sound on screamer pipe.',
      considerations: 'Larger wastegates may reduce spool at lower boost. External setups require exhaust fabrication. Spring pressure must match boost target. $150-600 for external wastegates.'
    },
    
    relatedTopics: ['turbocharger', 'boost-controller', 'downpipe', 'ecu-tuning'],
    relatedUpgradeKeys: ['wastegate-upgrade', 'turbo-upgrade'],
    status: 'complete'
  },

  {
    slug: 'blow-off-valve',
    name: 'Blow Off Valve',
    system: 'intake-forced-induction',
    
    definition: 'A blow-off valve (BOV), also called a bypass valve or diverter valve, releases pressurized air from the intake tract when the throttle closes. This prevents compressor surge—a damaging condition where pressurized air reverses direction through the turbo—and eliminates the "flutter" sound that indicates the compressor is stalling.',
    
    howItWorks: 'When the throttle closes suddenly (lifting off the gas), pressurized air in the intake has nowhere to go. Without a BOV, this air pushes back against the still-spinning compressor, causing it to stall and reverse. The BOV senses the vacuum created when the throttle closes and opens a valve to release the pressure—either to atmosphere (the signature "psssh" sound) or back to the intake before the turbo (recirculating).',
    
    whyItMatters: 'Compressor surge causes accelerated bearing and compressor wheel wear. The flutter sound many find appealing is actually the compressor stalling repeatedly. While occasional surge won\'t immediately destroy a turbo, consistent surge reduces turbo life. Proper BOV operation also maintains spool between shifts for faster boost recovery.',
    
    commonTypes: [
      'Recirculating (returns air to intake, quiet)',
      'Atmospheric (vents to air, loud "psssh")',
      'Hybrid/adjustable (can do either)',
      'Plumb-back (factory style)',
      'Piston vs diaphragm actuation'
    ],
    
    keySpecs: [
      'Flow capacity (CFM or mm outlet)',
      'Spring pressure',
      'Valve type (piston, diaphragm)',
      'Vent style (atmospheric, recirculating)',
      'Response time'
    ],
    
    signs: {
      good: [
        'Clean release sound (no flutter)',
        'Quick boost recovery between shifts',
        'No compressor surge',
        'Consistent operation hot and cold'
      ],
      bad: [
        'Flutter/chatter (not opening enough)',
        'Boost leak (not sealing properly)',
        'Slow boost recovery (too much flow)',
        'Stuck open or closed',
        'Rough idle (on MAF cars with atmo BOV)'
      ]
    },
    
    modPotential: {
      summary: 'Aftermarket BOVs provide better flow capacity and the option for atmospheric venting.',
      gains: 'Proper surge protection. Better boost recovery. Adjustable response. The characteristic turbo sound.',
      considerations: 'Atmospheric BOVs can cause rich conditions on MAF cars (metered air is vented). Recirculating works with all setups. Proper spring pressure is critical. $50-300 for quality BOVs.'
    },
    
    relatedTopics: ['turbocharger', 'intercooler', 'charge-pipe', 'boost-controller'],
    relatedUpgradeKeys: ['bov-upgrade', 'blow-off-valve'],
    status: 'complete'
  },

  {
    slug: 'twin-charged',
    name: 'Twin Charged Systems',
    system: 'intake-forced-induction',
    
    definition: 'Twin-charging combines a supercharger and turbocharger on the same engine, using the supercharger\'s instant response at low RPM and the turbo\'s efficiency at high RPM. This approach eliminates turbo lag while avoiding the supercharger\'s parasitic losses at high power, providing broad, responsive power delivery.',
    
    howItWorks: 'The supercharger provides boost from idle, giving immediate throttle response. As RPM increases and the turbo spools, a bypass valve opens to reduce supercharger load while the turbo takes over. In most designs, the supercharger feeds the turbo, which further compresses the air. Complex control systems manage the transition between the two stages. Volkswagen\'s 1.4L TSI "Twincharger" engine is the most famous production example.',
    
    whyItMatters: 'Twin-charging represents an engineering solution to the inherent trade-offs of each system alone. Turbos are efficient but laggy; superchargers are responsive but parasitic. Together, they can provide lag-free boost with peak efficiency. However, the complexity, cost, and packaging challenges have limited widespread adoption.',
    
    commonTypes: [
      'Series compound (supercharger feeds turbo)',
      'Parallel (separate systems, switched)',
      'Belt-driven supercharger + exhaust turbo',
      'Electric supercharger + turbo (modern hybrids)'
    ],
    
    keySpecs: [
      'Supercharger displacement',
      'Turbo sizing',
      'Transition RPM range',
      'Combined maximum boost',
      'System complexity'
    ],
    
    signs: {
      good: [
        'No turbo lag from idle',
        'Smooth power transition',
        'Strong power across full RPM range',
        'Systems working in harmony'
      ],
      bad: [
        'Rough transition between stages',
        'Bypass valve malfunction',
        'Excessive heat generation',
        'Complex failure modes'
      ]
    },
    
    modPotential: {
      summary: 'Twin-charged conversions are rare but offer the best of both forced induction worlds.',
      gains: 'Combines immediate response with high-RPM efficiency. Eliminates turbo lag completely.',
      considerations: 'Very complex to implement properly. High cost and packaging challenges. Requires sophisticated engine management. Limited aftermarket support.'
    },
    
    relatedTopics: ['turbocharger', 'supercharger', 'intercooler', 'boost-controller'],
    status: 'complete'
  },

  {
    slug: 'intercooler',
    name: 'Intercooler',
    system: 'intake-forced-induction',
    
    definition: 'An intercooler is a heat exchanger that cools compressed air from the turbo or supercharger before it enters the engine. Compressing air heats it significantly—often to 250-350°F. The intercooler reduces this temperature, increasing air density and reducing the risk of detonation.',
    
    howItWorks: 'Hot compressed air flows through the intercooler core, which contains many small passages with fins. In air-to-air intercoolers, ambient air passing over the fins absorbs heat. In water-to-air intercoolers, coolant flowing through the core absorbs heat and is cooled by a separate radiator. Temperature reductions of 100-150°F are typical, with each 10°F reduction worth approximately 1% power increase.',
    
    whyItMatters: 'Hot intake air reduces power and increases knock risk. Intercooler sizing is often a limiting factor on factory turbo cars pushed beyond stock power levels. Upgrading to a larger intercooler is one of the most effective modifications for any boosted engine, providing consistent power and safety margin for aggressive tuning.',
    
    commonTypes: [
      'Front-mount air-to-air (FMIC)',
      'Top-mount air-to-air (TMIC)',
      'Side-mount air-to-air (SMIC)',
      'Water-to-air (liquid cooling)',
      'Bar-and-plate (durable) vs tube-and-fin (lighter)'
    ],
    
    keySpecs: [
      'Core size (width × height × depth)',
      'Core volume (liters)',
      'Pressure drop at flow rate',
      'Efficiency (%)',
      'Heat rejection capacity'
    ],
    
    signs: {
      good: [
        'Low intake temps under boost',
        'Consistent temps run after run',
        'Minimal pressure drop',
        'No boost leaks at connections'
      ],
      bad: [
        'Heat soak (rising temps with use)',
        'High intake temps',
        'Significant pressure drop',
        'Oil in intercooler (turbo seal issue)',
        'Damaged fins or core'
      ]
    },
    
    modPotential: {
      summary: 'Intercooler upgrades are essential for any serious boost increase on turbo or supercharged applications.',
      gains: 'Lower intake temps allow more boost and timing. Consistent power run after run. Essential for track use.',
      considerations: 'Larger cores may have more pressure drop (lag). Front mounts may affect other cooling (radiator, AC). Proper piping is important. $300-1,500 for quality intercoolers.'
    },
    
    relatedTopics: ['turbocharger', 'supercharger', 'charge-pipe', 'ecu-tuning'],
    relatedUpgradeKeys: ['intercooler-upgrade', 'fmic'],
    status: 'complete'
  },

  {
    slug: 'charge-pipe',
    name: 'Charge Pipe',
    system: 'intake-forced-induction',
    
    definition: 'Charge pipes are the tubing that carries pressurized air from the turbo/supercharger through the intercooler and to the throttle body. They must handle boost pressure without leaking or blowing off, while flowing air efficiently to minimize pressure loss and turbulence.',
    
    howItWorks: 'Pressurized air exits the turbo compressor, travels through the charge pipe to the intercooler, and then through another pipe to the throttle body. Factory charge pipes are often plastic to reduce cost and weight, but can crack or separate under higher boost pressures. Aftermarket pipes are typically aluminum or silicone-reinforced, with better connections and larger diameters for improved flow.',
    
    whyItMatters: 'Charge pipe failures are common on tuned turbo cars—the plastic stock pipes simply weren\'t designed for significantly higher boost. A blown charge pipe causes immediate and complete loss of boost. Upgrading charge pipes before increasing boost is inexpensive insurance. Larger diameter pipes also reduce restriction for marginal flow improvements.',
    
    commonTypes: [
      'Stock plastic (often the weak point)',
      'Aluminum (strong, lightweight)',
      'Silicone (flexible, heat-resistant)',
      'Carbon fiber (lightweight, expensive)',
      'With or without provision for BOV/DV'
    ],
    
    keySpecs: [
      'Inner diameter',
      'Material',
      'Coupler style',
      'Pressure rating',
      'BOV/DV mounting provisions'
    ],
    
    signs: {
      good: [
        'Holds boost without leaks',
        'Secure couplings',
        'No cracks or damage',
        'Smooth internal surface'
      ],
      bad: [
        'Boost pressure dropping',
        'Hissing sound under boost',
        'Visible cracks in plastic pipes',
        'Loose or failed couplers',
        'Complete pipe blow-off'
      ]
    },
    
    modPotential: {
      summary: 'Upgraded charge pipes prevent boost leaks and failures on tuned applications.',
      gains: 'Eliminates common failure point. Slightly improved flow with larger diameter. Peace of mind at higher boost.',
      considerations: 'Essential before significant boost increases. Match pipe diameter to turbo outlet. Quality couplers and clamps are important. $150-400 for quality kits.'
    },
    
    relatedTopics: ['turbocharger', 'intercooler', 'blow-off-valve', 'boost-controller'],
    relatedUpgradeKeys: ['charge-pipe-upgrade'],
    status: 'complete'
  },

  {
    slug: 'boost-controller',
    name: 'Boost Controller',
    system: 'intake-forced-induction',
    
    definition: 'A boost controller manages boost pressure by regulating the signal to the wastegate actuator. It allows boost levels beyond what the stock system provides and can maintain consistent boost across the RPM range. Controllers range from simple manual bleed valves to sophisticated electronic systems with multiple programmable settings.',
    
    howItWorks: 'Boost controllers work by modifying the pressure signal to the wastegate actuator. Manual controllers "bleed" some of this pressure, making the wastegate see less pressure than actual boost and stay closed longer. Electronic controllers use a solenoid to precisely regulate the pressure signal based on ECU commands or their own programmed maps. This allows boost targets to be set for different RPM ranges, gear-based boost, and other advanced features.',
    
    whyItMatters: 'Stock boost control is conservative and often drops boost at high RPM. A boost controller allows running higher boost safely and maintaining consistent boost throughout the power band. For any turbo car being tuned beyond stock, some form of boost control is essential to achieve and maintain target boost levels.',
    
    commonTypes: [
      'Manual boost controller (MBC, bleed valve)',
      'Electronic boost controller (EBC, solenoid)',
      'ECU-integrated boost control',
      'External boost controller with display',
      'Multi-stage/multi-map controllers'
    ],
    
    keySpecs: [
      'Control type (manual/electronic)',
      'Adjustment range (PSI)',
      'Response speed',
      'Number of boost maps',
      'Sensor inputs (RPM, gear, etc.)'
    ],
    
    signs: {
      good: [
        'Boost hits target quickly',
        'Holds target boost through RPM range',
        'Consistent run-to-run',
        'Smooth boost response'
      ],
      bad: [
        'Boost spikes',
        'Boost falling off at high RPM',
        'Inconsistent boost',
        'Overboost conditions',
        'Slow boost response'
      ]
    },
    
    modPotential: {
      summary: 'Boost controllers enable consistent boost levels and unlock additional boost potential.',
      gains: 'Consistent boost equals consistent power. Higher boost targets when tuned appropriately. Advanced features like gear-based boost.',
      considerations: 'Must be tuned properly—overboost damages engines. EBC provides better control than MBC. ECU-integrated control is often simplest. $30-300 depending on type.'
    },
    
    relatedTopics: ['turbocharger', 'wastegate', 'ecu-tuning', 'intercooler'],
    relatedUpgradeKeys: ['boost-controller', 'turbo-upgrade'],
    status: 'complete'
  }
];

export default intakeTopics;
