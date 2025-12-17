/**
 * FUEL SYSTEM TOPICS - Complete Encyclopedia Content
 * 
 * 11 comprehensive topics covering fuel delivery and injection.
 * All topics have full educational content - no stubs.
 * 
 * @module encyclopediaTopics/fuelSystem
 */

export const fuelSystemTopics = [
  {
    slug: 'low-pressure-fuel-pump',
    name: 'Low Pressure Fuel Pump',
    system: 'fuel-system',
    
    definition: 'The low-pressure fuel pump (also called the lift pump or in-tank pump) moves fuel from the tank to the engine bay at relatively low pressure, typically 40-70 PSI. In direct injection systems, this pump feeds the high-pressure pump; in port injection systems, it delivers fuel directly to the injectors.',
    
    howItWorks: 'Most modern vehicles use an electric fuel pump submerged in the fuel tank. The pump motor spins an impeller or gerotor that pressurizes fuel and pushes it through the fuel lines. Being submerged in fuel keeps the pump cool and prevents vapor lock. A fuel pressure regulator maintains consistent pressure, returning excess fuel to the tank. The fuel pump is controlled by the ECU and typically primes when the key is turned on (you can hear it whir for 2-3 seconds).',
    
    whyItMatters: 'The fuel pump must supply enough volume to feed the engine at maximum power. Stock pumps are sized for stock power with some margin—adding significant power through turbocharging or other means often requires a higher-flow pump. An undersized pump causes fuel starvation at high RPM/load, leading to lean conditions that can destroy an engine.',
    
    commonTypes: [
      'In-tank submersible (most common)',
      'External inline pump (older vehicles, some racing)',
      'Returnless fuel system (regulator at pump)',
      'Return-style (regulator in engine bay)',
      'Dual pump setups (high-power applications)'
    ],
    
    keySpecs: [
      'Flow rate (liters/hour or GPH)',
      'Pressure rating (PSI)',
      'Voltage draw (amps)',
      'Fuel compatibility (E85, pump gas)',
      'Inlet/outlet size'
    ],
    
    signs: {
      good: [
        'Consistent fuel pressure at all loads',
        'Quick prime when key is turned',
        'No whining or buzzing from tank',
        'Stable AFR under boost/load'
      ],
      bad: [
        'Fuel pressure drops under load',
        'Loud whining from fuel tank',
        'Engine stumble at high RPM',
        'Lean condition under boost',
        'Hard starting or no-start'
      ]
    },
    
    modPotential: {
      summary: 'Fuel pump upgrades are essential for any significant power increase, especially forced induction builds.',
      gains: 'Higher-flow pumps support 30-100%+ more power depending on setup. E85-compatible pumps enable flex-fuel setups.',
      considerations: 'Must match pump to injector/fuel system capacity. Wiring upgrades often needed for high-draw pumps. Return-style conversions may be needed. $150-600 for quality pumps.'
    },
    
    relatedTopics: ['high-pressure-fuel-pump', 'fuel-rail', 'fuel-pressure-regulator', 'electronic-fuel-injection'],
    relatedUpgradeKeys: ['fuel-pump-upgrade'],
    status: 'complete'
  },

  {
    slug: 'high-pressure-fuel-pump',
    name: 'High Pressure Fuel Pump',
    system: 'fuel-system',
    
    definition: 'The high-pressure fuel pump (HPFP) is used in direct injection systems to boost fuel pressure from the low-pressure pump\'s 40-70 PSI to the 500-3,000+ PSI required for direct injection. It\'s typically mechanically driven by the camshaft and is a critical component in modern turbocharged engines.',
    
    howItWorks: 'The HPFP is a cam-driven piston pump mounted on the cylinder head. A lobe on the camshaft actuates the pump\'s piston, compressing fuel to extreme pressures. A solenoid controls how much fuel is pressurized each stroke by varying the effective piston travel. The ECU modulates this solenoid to maintain target rail pressure based on engine load and RPM. Higher pressures enable better fuel atomization and more precise injection timing.',
    
    whyItMatters: 'The HPFP is often the first fuel system component to reach its limit on tuned direct injection engines. When the pump can\'t maintain pressure at high loads, the engine runs lean—a dangerous condition. HPFP upgrades are common on popular platforms like the BMW N54/N55, VW/Audi EA888, and Ford EcoBoost engines.',
    
    commonTypes: [
      'Single-piston (most common OEM)',
      'Multi-piston (some OEM, aftermarket)',
      'Upgraded internals (larger piston)',
      'Auxiliary port injection (supplements DI)',
      'Dual HPFP setups (extreme builds)'
    ],
    
    keySpecs: [
      'Maximum pressure (PSI/bar)',
      'Flow rate at pressure (cc/min)',
      'Piston diameter',
      'Cam lobe requirements',
      'Fuel compatibility'
    ],
    
    signs: {
      good: [
        'Stable fuel pressure under load',
        'No pressure drop at high boost',
        'Consistent rail pressure logs',
        'No fuel-related codes'
      ],
      bad: [
        'Rail pressure drops under boost',
        'Fuel pressure fault codes',
        'Engine pulls timing/reduces boost',
        'Rough running at high load',
        'Ticking or knocking noise from pump'
      ]
    },
    
    modPotential: {
      summary: 'HPFP upgrades are essential for tuned DI engines, often supporting 30-100% more power.',
      gains: 'Upgraded internals can double or triple fuel flow. Enables higher boost and more aggressive timing.',
      considerations: 'Must match LPFP capacity. May require upgraded cam follower. Some platforms have multiple aftermarket options. $400-1,200 for quality upgrades.'
    },
    
    relatedTopics: ['low-pressure-fuel-pump', 'direct-injection', 'fuel-rail', 'ecu-tuning'],
    relatedUpgradeKeys: ['hpfp-upgrade'],
    status: 'complete'
  },

  {
    slug: 'fuel-rail',
    name: 'Fuel Rail',
    system: 'fuel-system',
    
    definition: 'The fuel rail is a pipe or manifold that distributes pressurized fuel to all injectors in the engine. It maintains consistent fuel pressure across all cylinders and provides a mounting point for the fuel injectors. In direct injection systems, the fuel rail operates at extremely high pressures.',
    
    howItWorks: 'Fuel enters the rail from the fuel pump and fills the entire rail volume. Each injector is sealed into the rail and draws fuel when opened by the ECU. The rail\'s internal volume acts as a pressure accumulator, dampening pressure fluctuations as injectors fire. A fuel pressure sensor monitors rail pressure, and in port injection systems, a regulator maintains pressure by returning excess fuel to the tank.',
    
    whyItMatters: 'The fuel rail must handle the pressure and flow demands of all injectors simultaneously. Stock rails are sized for stock injectors—upgrading to larger injectors may require a rail with larger internal volume or better flow characteristics to prevent pressure drops when multiple injectors fire together.',
    
    commonTypes: [
      'Cast aluminum (most OEM)',
      'Billet aluminum (aftermarket, better flow)',
      'Composite/plastic (some OEM)',
      'Top-feed vs side-feed injector mounting',
      'High-pressure DI rails (steel or aluminum)'
    ],
    
    keySpecs: [
      'Internal volume (cc)',
      'Pressure rating (PSI)',
      'Injector spacing and angle',
      'Inlet/outlet size',
      'Fuel pressure sensor port'
    ],
    
    signs: {
      good: [
        'Consistent pressure across all cylinders',
        'No leaks at injector O-rings',
        'No pressure drop under high demand',
        'Clean fuel flow'
      ],
      bad: [
        'Fuel leaks at injector seats',
        'Pressure variation between cylinders',
        'Cracked or corroded rail',
        'Clogged internal passages'
      ]
    },
    
    modPotential: {
      summary: 'Aftermarket fuel rails improve flow and accommodate larger injectors for high-power builds.',
      gains: 'Better pressure stability under high demand. Accommodate larger injectors. Often include -AN fittings for braided lines.',
      considerations: 'Must match injector size and spacing. May require custom fuel lines. DI fuel rails are expensive due to high-pressure requirements. $150-800 depending on application.'
    },
    
    relatedTopics: ['electronic-fuel-injection', 'direct-injection', 'port-injection', 'fuel-pressure-regulator'],
    relatedUpgradeKeys: ['fuel-rail-upgrade'],
    status: 'complete'
  },

  {
    slug: 'electronic-fuel-injection',
    name: 'Electronic Fuel Injection (EFI)',
    system: 'fuel-system',
    
    definition: 'Electronic fuel injection (EFI) is a system that uses electronically controlled injectors to precisely meter fuel delivery based on sensor inputs and ECU calculations. EFI replaced carburetors in the 1980s and 1990s due to its superior precision, efficiency, and emissions control capabilities.',
    
    howItWorks: 'The ECU receives inputs from sensors including MAF/MAP (airflow/pressure), TPS (throttle position), coolant temp, oxygen sensors, and crankshaft position. Using fuel maps programmed into memory, the ECU calculates the precise injector pulse width (how long each injector opens) needed to deliver the correct amount of fuel for the current conditions. This happens thousands of times per minute, constantly adjusting for optimal combustion.',
    
    whyItMatters: 'EFI is what enables modern engines to produce clean, efficient, consistent power across all conditions. Unlike carburetors, EFI automatically compensates for altitude, temperature, and fuel quality. For tuning, EFI provides precise control—you can adjust fueling at any RPM and load point independently. This precision is why modern NA engines can achieve 100+ HP per liter.',
    
    commonTypes: [
      'Throttle body injection (TBI) - single injector',
      'Multi-port injection (MPI) - one injector per cylinder',
      'Sequential injection - timed to each cylinder',
      'Direct injection (DI) - in-cylinder injection',
      'Batch fire vs sequential fire'
    ],
    
    keySpecs: [
      'Injector count and size (cc/min)',
      'System pressure (PSI)',
      'Injection timing type',
      'Sensor inputs',
      'ECU processing capability'
    ],
    
    signs: {
      good: [
        'Smooth idle and throttle response',
        'Consistent AFR across load/RPM',
        'Good fuel economy',
        'No hesitation or stumble'
      ],
      bad: [
        'Rich or lean codes',
        'Poor fuel economy',
        'Rough idle or hesitation',
        'Black smoke (rich) or misfires (lean)',
        'Check engine light'
      ]
    },
    
    modPotential: {
      summary: 'EFI tuning unlocks significant power potential through optimized fuel maps and often accompanies other modifications.',
      gains: 'Proper tuning ensures mods work together safely. Custom tuning can add 5-15% power over stock maps.',
      considerations: 'Professional tuning required for best results. Datalogging essential for monitoring. Wideband O2 recommended for tuning.'
    },
    
    relatedTopics: ['ecu', 'direct-injection', 'port-injection', 'air-fuel-ratio', 'injector-pulse-width'],
    relatedUpgradeKeys: ['ecu-tune'],
    status: 'complete'
  },

  {
    slug: 'direct-injection',
    name: 'Direct Injection',
    system: 'fuel-system',
    
    definition: 'Direct injection (DI or GDI - Gasoline Direct Injection) injects fuel directly into the combustion chamber at extremely high pressure (1,500-3,000+ PSI), rather than into the intake port. This enables more precise fuel control, higher compression ratios, and improved efficiency, making it standard on most modern performance engines.',
    
    howItWorks: 'The high-pressure fuel pump pressurizes fuel to 150-200+ bar (2,000-3,000 PSI). Injectors mounted in the combustion chamber spray fuel directly onto the piston or into the incoming air charge. The fuel spray\'s evaporative cooling effect reduces intake charge temperature, allowing higher compression without knock. Multiple injection events per cycle are possible—pilot injections for smooth combustion, main injection for power, and post-injections for emissions control.',
    
    whyItMatters: 'DI has enabled the modern turbocharged small-displacement engine trend. The charge cooling effect allows turbo engines to run higher boost on pump gas. However, DI has drawbacks—intake valves don\'t get cleaned by fuel wash, leading to carbon buildup that can affect performance. Many new engines combine DI with port injection to get benefits of both.',
    
    commonTypes: [
      'Spray-guided (spray directs combustion)',
      'Wall-guided (fuel hits piston)',
      'Air-guided (airflow directs mixture)',
      'Multi-hole injectors (better atomization)',
      'Piezoelectric vs solenoid injectors'
    ],
    
    keySpecs: [
      'Operating pressure (PSI/bar)',
      'Injector flow rate (cc/min @ pressure)',
      'Spray pattern',
      'Number of injection events per cycle',
      'Injector response time'
    ],
    
    signs: {
      good: [
        'Smooth combustion',
        'Good power delivery',
        'No misfires or hesitation',
        'Efficient fuel consumption'
      ],
      bad: [
        'Misfires (possible carbon buildup)',
        'Rough idle (carbon on valves)',
        'Fuel pressure faults',
        'Injector noise or knock',
        'Poor cold start'
      ]
    },
    
    modPotential: {
      summary: 'DI system upgrades focus on HPFP and injectors for high-power builds, plus carbon cleaning maintenance.',
      gains: 'Upgraded HPFP and injectors support major power increases. Port injection supplements can add 50%+ fueling capacity.',
      considerations: 'Carbon buildup requires walnut blasting or chemical cleaning every 40-60k miles. Port injection kits eliminate carbon issue. DI injectors are expensive ($100-300 each).'
    },
    
    relatedTopics: ['high-pressure-fuel-pump', 'port-injection', 'atomization', 'fuel-rail'],
    relatedUpgradeKeys: ['hpfp-upgrade', 'injector-upgrade'],
    status: 'complete'
  },

  {
    slug: 'port-injection',
    name: 'Port Injection',
    system: 'fuel-system',
    
    definition: 'Port fuel injection (PFI or MPI - Multi-Port Injection) places injectors in the intake ports, spraying fuel onto the back of the intake valves. This simpler, lower-pressure system (40-60 PSI) was the standard before direct injection and is still used on many engines, sometimes in combination with DI.',
    
    howItWorks: 'Each injector mounts in the intake manifold near its respective cylinder\'s intake valve. When the ECU fires the injector, fuel sprays onto the back of the intake valve, mixing with incoming air. The fuel-air mixture is drawn into the cylinder when the intake valve opens. Sequential injection times each injector to fire just before its intake valve opens for optimal mixture preparation.',
    
    whyItMatters: 'Port injection is simpler, cheaper, and more reliable than DI, with lower-pressure components and no carbon buildup issues (fuel washes the valves). While it lacks DI\'s precision and charge cooling benefits, many high-power builds prefer it for its higher flow potential and simpler tuning. Many modern engines use both—DI for efficiency, port injection for high-load fueling.',
    
    commonTypes: [
      'Sequential (each injector timed independently)',
      'Batch fire (groups fire together)',
      'Bank fire (all fire together)',
      'High-impedance (most common)',
      'Low-impedance (some racing)'
    ],
    
    keySpecs: [
      'Injector flow rate (cc/min @ 43.5 PSI)',
      'Fuel pressure (PSI)',
      'Spray pattern',
      'Impedance (ohms)',
      'Latency/dead time'
    ],
    
    signs: {
      good: [
        'Clean intake valves',
        'Smooth fueling transitions',
        'Consistent AFR',
        'Good spray pattern (if removed)'
      ],
      bad: [
        'Leaking injector O-rings',
        'Clogged or dirty injectors',
        'Inconsistent spray pattern',
        'Rich/lean individual cylinders',
        'Injector clicking at idle'
      ]
    },
    
    modPotential: {
      summary: 'Port injection upgrades center on larger injectors to support more power, or adding port injection to DI engines.',
      gains: 'Larger injectors support any power level needed. Supplemental PI on DI engines adds fueling capacity and eliminates carbon buildup.',
      considerations: 'Must size injectors for target power. Large injectors may idle poorly without proper tuning. Injector dynamics (latency) must be calibrated in tune.'
    },
    
    relatedTopics: ['electronic-fuel-injection', 'direct-injection', 'injector-pulse-width', 'fuel-rail'],
    relatedUpgradeKeys: ['injector-upgrade', 'port-injection-kit'],
    status: 'complete'
  },

  {
    slug: 'injector-pulse-width',
    name: 'Injector Pulse Width',
    system: 'fuel-system',
    
    definition: 'Injector pulse width is the duration (in milliseconds) that a fuel injector remains open during each injection event. The ECU varies pulse width to control how much fuel is delivered—longer pulse width means more fuel. This is the primary mechanism by which EFI systems meter fuel delivery.',
    
    howItWorks: 'The ECU calculates required fuel based on airflow (from MAF or MAP/RPM calculations) and desired air/fuel ratio. It then determines how long the injector must open to deliver that amount, accounting for fuel pressure and injector flow rate. At idle, pulse widths might be 2-3ms; at wide-open throttle, 10-20ms or more. If the required pulse width exceeds available time between injections, the injector is said to be "maxed out" and can\'t deliver enough fuel.',
    
    whyItMatters: 'Understanding injector duty cycle (pulse width as percentage of available time) is crucial for knowing when you\'ve outgrown your injectors. Duty cycle above 80-85% indicates you\'re approaching the injector\'s limit. Datalogging pulse width and duty cycle reveals whether fuel delivery is adequate for current power levels and provides warning before you run lean.',
    
    commonTypes: [
      'Saturated drive (high-impedance, constant voltage)',
      'Peak-and-hold (low-impedance, requires driver)',
      'Multiple injection events per cycle',
      'Staged injection (primary + secondary injectors)'
    ],
    
    keySpecs: [
      'Pulse width (milliseconds)',
      'Duty cycle (percentage)',
      'Injector dead time/latency',
      'Maximum safe duty cycle (~85%)',
      'Injection timing (degrees BTDC)'
    ],
    
    signs: {
      good: [
        'Duty cycle below 80% at max power',
        'Consistent pulse width at steady state',
        'Pulse width scales linearly with load',
        'Clean AFR at all loads'
      ],
      bad: [
        'Duty cycle above 85% (maxed out)',
        'Lean AFR at high load (insufficient fuel)',
        'Erratic pulse width',
        'Injector latency issues (poor tuning)'
      ]
    },
    
    modPotential: {
      summary: 'Monitoring pulse width/duty cycle reveals when larger injectors are needed for increased power.',
      gains: 'Larger injectors reduce duty cycle, providing headroom for more power. Proper injector sizing ensures safe, full-power operation.',
      considerations: 'Larger injectors require ECU retuning. Injector dead time must be properly calibrated. Oversized injectors can cause poor idle quality.'
    },
    
    relatedTopics: ['electronic-fuel-injection', 'port-injection', 'direct-injection', 'ecu-tuning'],
    relatedUpgradeKeys: ['injector-upgrade'],
    status: 'complete'
  },

  {
    slug: 'atomization',
    name: 'Fuel Atomization',
    system: 'fuel-system',
    
    definition: 'Fuel atomization is the process of breaking liquid fuel into tiny droplets that can mix thoroughly with air and burn completely. Better atomization means more surface area for evaporation and combustion, resulting in more power, cleaner emissions, and improved fuel efficiency.',
    
    howItWorks: 'Fuel injectors are designed to spray fuel in specific patterns with controlled droplet sizes, typically 10-100 microns in diameter. Smaller droplets evaporate faster and mix more completely with air. High-pressure direct injection produces finer atomization due to the greater pressure differential. Injector design (pintle, disc, multi-hole), fuel pressure, and spray pattern all affect atomization quality. Poor atomization leaves some fuel as liquid droplets that don\'t burn completely.',
    
    whyItMatters: 'Complete combustion depends on thorough fuel-air mixing, which starts with good atomization. Poor atomization causes incomplete combustion, wasted fuel, increased emissions, and carbon deposits. This is why fuel quality matters—detergent additives help keep injectors clean for proper spray patterns, and why direct injection enables higher efficiency.',
    
    commonTypes: [
      'Pintle injectors (older, coarser spray)',
      'Disc injectors (improved atomization)',
      'Multi-hole injectors (finest spray, DI)',
      'Piezo injectors (fastest response, best atomization)',
      'Air-assisted injection (rare)'
    ],
    
    keySpecs: [
      'Droplet size (Sauter Mean Diameter, microns)',
      'Spray cone angle',
      'Fuel pressure',
      'Number of spray holes',
      'Spray penetration distance'
    ],
    
    signs: {
      good: [
        'Complete combustion (no smoke)',
        'Good fuel economy',
        'Clean spark plugs',
        'Even spray pattern (if inspected)'
      ],
      bad: [
        'Black smoke (incomplete combustion)',
        'Fuel wash on cylinder walls',
        'Carbon buildup',
        'Poor economy despite good tune',
        'Fouled spark plugs'
      ]
    },
    
    relatedTopics: ['direct-injection', 'port-injection', 'electronic-fuel-injection'],
    status: 'complete'
  },

  {
    slug: 'fuel-types',
    name: 'Fuel Types & Volatility',
    system: 'fuel-system',
    
    definition: 'Different fuel types have varying octane ratings, energy content, and volatility characteristics that affect engine performance and tuning requirements. Understanding fuel properties is essential for choosing the right fuel for your application and tuning appropriately.',
    
    howItWorks: 'Octane rating measures a fuel\'s resistance to knock—higher octane allows more aggressive timing and/or boost. Energy content (BTU/gallon) determines how much power the fuel can produce. Volatility affects how easily fuel evaporates—winter blends are more volatile for cold starts, summer blends less so to prevent vapor lock. Ethanol blends (E85) have higher octane but lower energy density, requiring more fuel volume for the same power.',
    
    whyItMatters: 'Running low-octane fuel in a high-compression or boosted engine causes knock, which damages pistons and bearings. Running high-octane fuel in a standard engine wastes money without benefit. E85 is popular in performance applications because its high octane (100-105) and cooling effect enable significantly more power, but requires 30-40% more fuel flow.',
    
    commonTypes: [
      'Regular (87 octane, AKI)',
      'Mid-grade (89 octane)',
      'Premium (91-93 octane)',
      'E85 (85% ethanol, 100-105 octane)',
      'Race gas (100-116+ octane)',
      'E10 (10% ethanol, standard pump gas)'
    ],
    
    keySpecs: [
      'Octane rating (AKI or RON)',
      'Ethanol content (%)',
      'Energy density (BTU/gallon)',
      'Stoichiometric ratio (14.7:1 gas, 9.8:1 E85)',
      'Reid Vapor Pressure (RVP)'
    ],
    
    signs: {
      good: [
        'No knock or ping',
        'Optimal timing for fuel used',
        'Consistent power output',
        'Expected fuel consumption'
      ],
      bad: [
        'Knock/ping (fuel octane too low)',
        'Power loss (timing pulled for knock)',
        'Poor fuel economy (wrong tune for fuel)',
        'Fuel system corrosion (ethanol issues)'
      ]
    },
    
    modPotential: {
      summary: 'Flex-fuel or E85 conversions can add significant power potential due to higher octane.',
      gains: 'E85 enables 20-30% more power on turbo cars through more boost and timing. Race gas enables maximum timing advance.',
      considerations: 'E85 requires 30-40% more fuel system capacity. Ethanol content varies seasonally. Fuel system must be E85-compatible. Separate tunes often needed for different fuels.'
    },
    
    relatedTopics: ['ethanol-flex-fuel', 'air-fuel-ratio', 'ecu-tuning', 'knock-detection'],
    relatedUpgradeKeys: ['flex-fuel-kit', 'e85-conversion'],
    status: 'complete'
  },

  {
    slug: 'ethanol-flex-fuel',
    name: 'Ethanol & Flex Fuel',
    system: 'fuel-system',
    
    definition: 'Flex fuel systems can automatically adjust to run on any blend of gasoline and ethanol, from pure gasoline (E0) to E85 (85% ethanol). A flex fuel sensor measures ethanol content, and the ECU adjusts fuel delivery and timing accordingly. E85 is popular in performance applications for its high octane and cooling properties.',
    
    howItWorks: 'A flex fuel sensor measures the ethanol content by analyzing the fuel\'s electrical conductivity or optical properties. The ECU uses this reading to adjust injector pulse width (E85 requires ~30-40% more fuel due to lower energy density), ignition timing (E85 resists knock, allowing more advance), and target AFR (E85 is 9.8:1 stoich vs gasoline\'s 14.7:1). True flex fuel systems continuously adapt as ethanol content changes.',
    
    whyItMatters: 'E85 offers significant performance advantages: octane ratings of 100-105, evaporative cooling that reduces intake temps by 20-30°F, and greater resistance to knock. On turbocharged engines, E85 can enable 20-30% more boost pressure. However, E85 availability varies, requires upgraded fuel systems, and has lower energy density requiring more fuel consumption.',
    
    commonTypes: [
      'Factory flex fuel (built-in from manufacturer)',
      'Aftermarket flex fuel kit (adds sensor + tune)',
      'Flex fuel sensor (Continental, GM)',
      'Ethanol content gauge',
      'Dual-map switching (not true flex fuel)'
    ],
    
    keySpecs: [
      'Ethanol content range (E0-E85)',
      'Sensor update rate',
      'Required fuel system capacity increase (30-40%)',
      'Injector size for E85',
      'Fuel pump flow for E85'
    ],
    
    signs: {
      good: [
        'Smooth transition between fuel types',
        'Power increases on higher ethanol',
        'Consistent AFR across ethanol range',
        'No knock on E85'
      ],
      bad: [
        'Lean condition on E85 (insufficient fuel capacity)',
        'Hard cold starts on high ethanol in winter',
        'Fuel system corrosion',
        'Inconsistent ethanol readings',
        'Knock on pump gas tune'
      ]
    },
    
    modPotential: {
      summary: 'Flex fuel conversions unlock significant power potential, especially on forced induction engines.',
      gains: 'E85 enables 15-30% more power through more boost and timing. Consistent fuel quality for tuning.',
      considerations: 'Requires fuel pump, injector, and potentially line upgrades. E85 availability varies by region. 25-40% worse fuel economy on E85. Cold starting can be difficult on pure E85 in winter.'
    },
    
    relatedTopics: ['fuel-types', 'high-pressure-fuel-pump', 'ecu-tuning', 'air-fuel-ratio'],
    relatedUpgradeKeys: ['flex-fuel-kit', 'e85-conversion', 'fuel-pump-upgrade'],
    status: 'complete'
  },

  {
    slug: 'fuel-pressure-regulator',
    name: 'Fuel Pressure Regulator',
    system: 'fuel-system',
    
    definition: 'The fuel pressure regulator (FPR) maintains consistent fuel pressure in the fuel rail by controlling how much fuel returns to the tank. In return-style systems, the regulator is in the engine bay and references manifold vacuum; in returnless systems, it\'s integrated with the fuel pump module in the tank.',
    
    howItWorks: 'The regulator uses a spring-loaded diaphragm with fuel on one side and manifold vacuum (or atmospheric pressure in returnless systems) on the other. When fuel pressure exceeds the spring\'s setpoint, the diaphragm opens a return valve, sending excess fuel back to the tank. Vacuum-referenced regulators maintain a constant pressure differential across the injectors regardless of manifold pressure—when vacuum is high (light load), fuel pressure drops; when boost is present, fuel pressure rises.',
    
    whyItMatters: 'Consistent fuel pressure is essential for accurate fuel delivery. Injector flow varies with pressure—a 10% pressure drop means roughly 5% less fuel flow. Failing regulators cause rich or lean conditions that affect performance and can damage engines. Adjustable regulators are popular for tuning because they allow fine-tuning of fuel delivery.',
    
    commonTypes: [
      'Vacuum-referenced (rises with boost)',
      'Non-referenced/static (constant pressure)',
      'Returnless (integrated in tank)',
      'Adjustable (aftermarket, tuning)',
      '1:1 vs 1:1+ boost reference ratios'
    ],
    
    keySpecs: [
      'Base pressure (PSI)',
      'Pressure rise rate (PSI per PSI boost)',
      'Flow capacity',
      'Return line size',
      'Adjustment range (if adjustable)'
    ],
    
    signs: {
      good: [
        'Stable fuel pressure at all loads',
        'Pressure rises with boost (vacuum-referenced)',
        'Consistent AFR',
        'No fuel leaks'
      ],
      bad: [
        'Fluctuating fuel pressure',
        'Fuel in vacuum line (failed diaphragm)',
        'Pressure doesn\'t rise with boost',
        'Rich or lean conditions',
        'Hard starting'
      ]
    },
    
    modPotential: {
      summary: 'Adjustable fuel pressure regulators enable fine-tuning of fuel delivery for modified engines.',
      gains: 'Precise fuel pressure control. Useful when fuel system changes require pressure adjustments. Essential for some turbo setups.',
      considerations: 'Most EFI systems don\'t require FPR changes unless significantly modified. Adjustable FPRs should be set with fuel pressure gauge. Must maintain proper boost reference for turbo applications.'
    },
    
    relatedTopics: ['fuel-rail', 'low-pressure-fuel-pump', 'electronic-fuel-injection', 'injector-pulse-width'],
    relatedUpgradeKeys: ['adjustable-fpr'],
    status: 'complete'
  }
];

export default fuelSystemTopics;


