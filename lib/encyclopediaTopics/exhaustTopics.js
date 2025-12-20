/**
 * EXHAUST SYSTEM TOPICS - Complete Encyclopedia Content
 * 
 * 8 comprehensive topics covering exhaust components and systems.
 * All topics have full educational content - no stubs.
 * 
 * @module encyclopediaTopics/exhaust
 */

export const exhaustTopics = [
  {
    slug: 'exhaust-header',
    name: 'Exhaust Header/Manifold',
    system: 'exhaust',
    
    definition: 'Exhaust headers (or manifolds) are the pipes that collect exhaust gases from each cylinder and merge them into a common outlet. Factory manifolds prioritize cost and packaging; aftermarket headers prioritize flow and performance through optimized tube lengths, diameters, and merge collectors.',
    
    howItWorks: 'Each cylinder\'s exhaust port connects to a primary tube in the header. These primaries merge at a collector, which can be a simple merge or a sophisticated design that uses exhaust pulses to help scavenge other cylinders. Equal-length headers ensure each cylinder\'s exhaust pulse travels the same distance, providing consistent scavenging effect. Tube diameter and length are tuned for specific RPM ranges—longer tubes favor low-end torque, shorter tubes favor high-RPM power.',
    
    whyItMatters: 'Headers are one of the most effective exhaust modifications for naturally aspirated engines. By improving exhaust flow and scavenging, headers can add 10-25+ HP on typical applications. The sound character also changes significantly. For turbo engines, headers affect how exhaust energy reaches the turbine, with equal-length designs providing smoother delivery.',
    
    commonTypes: [
      'Cast iron manifold (stock, heavy, restrictive)',
      'Tubular manifold (better flow than cast)',
      'Short-tube headers (shorties, easier install)',
      'Long-tube headers (best performance)',
      'Tri-Y design (4-2-1 merge)',
      'Equal-length (consistent scavenging)',
      'Turbo manifold (optimized for turbo spool)'
    ],
    
    keySpecs: [
      'Primary tube diameter',
      'Primary tube length',
      'Collector type and size',
      'Material (mild steel, stainless, Inconel)',
      'Flange thickness and style'
    ],
    
    signs: {
      good: [
        'No exhaust leaks',
        'Even coloring (proper heat)',
        'Solid mounting',
        'No cracking at welds'
      ],
      bad: [
        'Exhaust leaks (ticking sound at startup)',
        'Cracked tubes or welds',
        'Warped flanges',
        'Rust-through',
        'Burned or discolored collector (running lean)'
      ]
    },
    
    modPotential: {
      summary: 'Headers are a foundational exhaust modification, especially effective on NA engines.',
      gains: 'Typical gains of 10-25 HP on NA V8s, 5-15 HP on 4-cylinders. Improved throttle response and exhaust note.',
      considerations: 'Long-tube headers may require exhaust fabrication. Installation can be difficult. May affect emissions compliance. $200-2,000 depending on application and material.'
    },
    
    relatedTopics: ['downpipe', 'catalytic-converter', 'exhaust-tuning', 'cylinder-head'],
    relatedUpgradeKeys: ['headers', 'exhaust-manifold'],
    status: 'complete'
  },

  {
    slug: 'downpipe',
    name: 'Downpipe',
    system: 'exhaust',
    
    definition: 'The downpipe connects the turbo\'s turbine outlet to the rest of the exhaust system. It\'s the first and most restrictive section of a turbo car\'s exhaust. On many vehicles, the downpipe also contains the primary catalytic converter. Upgrading the downpipe is one of the most effective modifications for turbocharged engines.',
    
    howItWorks: 'Exhaust gases exit the turbo\'s turbine housing at high velocity and temperature. The downpipe must handle these conditions while providing a smooth path with minimal restriction. Stock downpipes often have tight bends and small diameters due to packaging constraints. Aftermarket downpipes use larger diameters (typically 3-4 inches) and smoother bends to reduce backpressure, allowing the turbo to spool faster and flow more air.',
    
    whyItMatters: 'On turbocharged engines, the downpipe is often the biggest single restriction. Because backpressure directly affects how hard the turbo has to work, a less restrictive downpipe improves both turbo response and peak power. Gains of 20-40 HP are common from downpipe upgrades alone, making it one of the best power-per-dollar modifications for turbo cars.',
    
    commonTypes: [
      'Stock (restrictive, includes primary cat)',
      'Catted performance (high-flow cat)',
      'Catless (race use only, illegal on street)',
      'Bellmouth inlet (smoother turbo transition)',
      'Divorced wastegate downpipe (for external WG)',
      'Single vs twin-scroll compatible'
    ],
    
    keySpecs: [
      'Pipe diameter (inches)',
      'Material (stainless, mild steel)',
      'Cat type and location (if equipped)',
      'Flex section (for engine movement)',
      'Turbo flange compatibility'
    ],
    
    signs: {
      good: [
        'No exhaust leaks',
        'No rattling from heat shields',
        'Proper flex section operation',
        'Catalytic converter functioning (if equipped)'
      ],
      bad: [
        'Exhaust leaks at turbo flange',
        'Cracked flex section',
        'Failed catalytic converter (codes, smell)',
        'Heat damage to nearby components',
        'Excessive drone or resonance'
      ]
    },
    
    modPotential: {
      summary: 'Downpipe upgrades are one of the most effective modifications for turbocharged engines.',
      gains: 'Typical gains of 20-40 HP with tune. Improved turbo spool. More aggressive exhaust note.',
      considerations: 'Catless downpipes are not street legal and will cause check engine lights without tune. High-flow catted options maintain emissions compliance. Must be tuned for best results. $200-800 depending on design.'
    },
    
    relatedTopics: ['turbocharger', 'catalytic-converter', 'exhaust-header', 'wastegate'],
    relatedUpgradeKeys: ['downpipe', 'turbo-back-exhaust'],
    status: 'complete'
  },

  {
    slug: 'catalytic-converter',
    name: 'Catalytic Converter',
    system: 'exhaust',
    
    definition: 'A catalytic converter (cat) is an emissions control device that uses precious metal catalysts (platinum, palladium, rhodium) to convert harmful exhaust gases (hydrocarbons, carbon monoxide, nitrogen oxides) into less harmful substances (water, CO2, nitrogen). Modern vehicles have multiple cats and are monitored by O2 sensors.',
    
    howItWorks: 'The catalytic converter contains a honeycomb ceramic or metallic substrate coated with catalyst materials. As hot exhaust gases pass through, chemical reactions occur on the catalyst surface. Three-way catalysts (most common) handle three reactions: oxidizing hydrocarbons and CO to CO2 and water, and reducing NOx to nitrogen. Cats must reach operating temperature (400-600°F) to function, which is why they\'re located close to the engine.',
    
    whyItMatters: 'Catalytic converters are legally required emissions equipment—removing them is a federal offense in the US. However, stock cats can be restrictive. High-flow cats use less-dense substrates (typically measured in cells per square inch, or CPSI) to reduce restriction while maintaining emissions compliance. For legal street performance, high-flow cats are the answer.',
    
    commonTypes: [
      'Two-way (older, oxidation only)',
      'Three-way (modern standard)',
      'High-flow/sport cat (less restrictive)',
      'OEM replacement',
      'Universal (requires welding)',
      'CARB-legal (California-approved aftermarket)'
    ],
    
    keySpecs: [
      'Cell density (CPSI)',
      'Substrate type (ceramic, metallic)',
      'Precious metal loading',
      'Inlet/outlet diameter',
      'CARB EO number (for California compliance)'
    ],
    
    signs: {
      good: [
        'O2 sensors reading properly',
        'No rotten egg smell',
        'Passing emissions tests',
        'No rattling'
      ],
      bad: [
        'Check engine light (efficiency codes)',
        'Rotten egg smell (rich running)',
        'Rattling (broken substrate)',
        'Failed emissions test',
        'Glowing red (overheating from rich condition)'
      ]
    },
    
    modPotential: {
      summary: 'High-flow catalytic converters reduce restriction while maintaining emissions compliance.',
      gains: 'Modest flow improvements over stock. Enables use of less restrictive exhaust without removing cats.',
      considerations: 'Must be CARB-approved for California registration. Catless is illegal for street use. Quality matters—cheap cats fail quickly. $150-600 for quality high-flow cats.'
    },
    
    relatedTopics: ['downpipe', 'o2-sensor', 'exhaust-header', 'straight-pipe'],
    relatedUpgradeKeys: ['high-flow-cat', 'catted-downpipe'],
    status: 'complete'
  },

  {
    slug: 'straight-pipe',
    name: 'Straight Pipe',
    system: 'exhaust',
    
    definition: 'Straight piping refers to exhaust systems with no mufflers or resonators—just open pipe from headers or downpipe to the exit. While this maximizes flow and produces an unmuffled exhaust sound, it\'s typically extremely loud and may be illegal for street use.',
    
    howItWorks: 'Without mufflers and resonators absorbing and canceling sound waves, the full exhaust pulse reaches the exit unimpeded. The resulting sound is the raw voice of the engine—unmuffled combustion events at frequency. While this provides maximum flow, the power gains over a well-designed muffled system are minimal (typically 1-3%). The main appeal is sound.',
    
    whyItMatters: 'Straight pipes produce maximum volume and the most aggressive exhaust note possible. For racing applications where sound regulations allow, they eliminate any restriction. However, for street use, they\'re often excessively loud (100+ dB), attract unwanted attention from law enforcement, and make the car unpleasant for long drives or daily use.',
    
    commonTypes: [
      'True straight pipe (header to exit)',
      'Muffler delete (removes mufflers only)',
      'Resonator delete',
      'Side exit straight pipe',
      'Cutout (switchable open/closed)'
    ],
    
    keySpecs: [
      'Pipe diameter',
      'Sound level (dB)',
      'Legality in jurisdiction',
      'Emissions compliance',
      'Drone characteristics'
    ],
    
    signs: {
      good: [
        'Maximum flow potential',
        'Aggressive sound character',
        'Weight reduction vs stock'
      ],
      bad: [
        'Excessive noise (legal issues)',
        'Unbearable drone at cruise RPM',
        'Hearing damage risk',
        'Neighbor complaints',
        'Failed sound/emissions tests'
      ]
    },
    
    modPotential: {
      summary: 'Straight piping provides maximum sound but minimal additional performance over quality muffled systems.',
      gains: 'Maximum flow, typically 1-3% power increase over quality cat-back. Significant weight reduction.',
      considerations: 'Often illegal for street use. Very loud (100+ dB typical). Drone can be unbearable. Cutouts provide switchable option. Not recommended for street cars in most cases.'
    },
    
    relatedTopics: ['muffler', 'resonator', 'cat-back-exhaust', 'exhaust-header'],
    relatedUpgradeKeys: ['straight-pipe', 'exhaust-delete'],
    status: 'complete'
  },

  {
    slug: 'resonator',
    name: 'Resonator',
    system: 'exhaust',
    
    definition: 'A resonator is an exhaust component designed to cancel specific frequencies of exhaust sound, reducing drone and harshness without significantly affecting flow. Unlike mufflers that attenuate overall volume, resonators target particular sound waves through destructive interference.',
    
    howItWorks: 'Resonators typically use a straight-through perforated tube inside a larger chamber. The chamber is tuned to a specific length that causes sound waves of certain frequencies to reflect and cancel themselves out (destructive interference). This eliminates annoying drone frequencies while allowing other exhaust tones through. Some resonators use sound-absorbing material for additional dampening.',
    
    whyItMatters: 'Resonators are essential for creating a pleasant exhaust note that\'s aggressive without being annoying. They specifically target the drone frequencies (often 2,000-3,000 RPM) that make highway cruising unbearable with aggressive exhausts. Deleting resonators is a cheap way to add volume but often results in an unrefined, droning exhaust.',
    
    commonTypes: [
      'Glass pack (fiberglass packing)',
      'Straight-through (minimal restriction)',
      'Chambered resonator',
      'Helmholtz resonator (tuned chamber)',
      'J-pipe resonator'
    ],
    
    keySpecs: [
      'Target frequency range',
      'Body diameter and length',
      'Core diameter',
      'Flow capacity',
      'Construction material'
    ],
    
    signs: {
      good: [
        'Drone-free cruising',
        'Clean exhaust note',
        'No internal rattling',
        'Minimal flow restriction'
      ],
      bad: [
        'Rattling (broken internals)',
        'Rust-through',
        'Excessive drone (wrong frequency)',
        'Restriction (packed with carbon)'
      ]
    },
    
    modPotential: {
      summary: 'Resonators tune exhaust sound character and eliminate drone in performance exhaust systems.',
      gains: 'Primarily sound quality improvement. Minimal power difference.',
      considerations: 'Resonator delete adds volume but often adds drone. Proper resonator selection is key to good exhaust tone. Quality resonators like Vibrant or Magnaflow flow well. $40-200.'
    },
    
    relatedTopics: ['muffler', 'cat-back-exhaust', 'axle-back-exhaust', 'straight-pipe'],
    relatedUpgradeKeys: ['resonator-delete', 'exhaust-resonator'],
    status: 'complete'
  },

  {
    slug: 'muffler',
    name: 'Muffler',
    system: 'exhaust',
    
    definition: 'A muffler reduces exhaust noise to acceptable levels while allowing exhaust gases to exit. Different muffler designs achieve this through absorption (fiberglass packing), reflection (chambered design), or a combination. Muffler choice significantly affects both sound character and, to a lesser extent, performance.',
    
    howItWorks: 'Absorption mufflers route exhaust through a perforated tube wrapped in fiberglass or steel wool packing. Sound energy is absorbed by the packing material. Chamber mufflers route exhaust through a series of chambers that reflect and cancel sound waves. Many performance mufflers combine both methods. Internal baffles and chambers create specific sound characteristics while managing backpressure.',
    
    whyItMatters: 'Muffler selection defines your car\'s voice. The same engine sounds completely different with a Flowmaster chambered muffler versus a Borla straight-through. Beyond sound, mufflers affect backpressure—extremely restrictive mufflers can cost power, while free-flowing designs may actually improve it. Finding the right balance of sound, performance, and livability is key.',
    
    commonTypes: [
      'Chambered (Flowmaster style, aggressive)',
      'Straight-through/glass pack (flow priority)',
      'Turbo style (quiet, efficient)',
      'Resonated muffler (combines muffler and resonator)',
      'Variable/active exhaust (adjustable)'
    ],
    
    keySpecs: [
      'Design type',
      'Inlet/outlet diameter',
      'Body dimensions',
      'Sound level (dB)',
      'Internal flow path'
    ],
    
    signs: {
      good: [
        'Appropriate sound level for use',
        'No drone at cruise RPM',
        'Proper mounting (no rattles)',
        'No external damage or rust'
      ],
      bad: [
        'Excessive volume',
        'Drone at highway speeds',
        'Rattling (loose baffles)',
        'Rust-through',
        'Packed packing blowing out (absorption types)'
      ]
    },
    
    modPotential: {
      summary: 'Muffler upgrades change exhaust sound character with modest performance effects.',
      gains: 'Performance mufflers can free up 3-10 HP over restrictive stock units. Main benefit is sound character.',
      considerations: 'Sound is subjective—listen to clips before buying. Consider drone characteristics. Quality varies significantly. Axle-back swap is typically bolt-on. $100-600 for quality mufflers.'
    },
    
    relatedTopics: ['resonator', 'cat-back-exhaust', 'axle-back-exhaust', 'straight-pipe'],
    relatedUpgradeKeys: ['muffler-upgrade', 'axle-back-exhaust'],
    status: 'complete'
  },

  {
    slug: 'cat-back-exhaust',
    name: 'Cat-Back Exhaust',
    system: 'exhaust',
    
    definition: 'A cat-back exhaust system replaces everything from the catalytic converter(s) rearward—including mid-pipe, resonators, mufflers, and tips. It\'s a complete exhaust solution that provides a coordinated sound and appearance while maintaining emissions compliance (cats remain stock).',
    
    howItWorks: 'Cat-back systems bolt to the factory catalytic converter outlet flange, replacing all downstream components with performance-oriented parts. Typically, this includes larger diameter tubing (2.5-3.5 inches depending on application), performance resonators and/or mufflers, and polished or coated tips. The system is engineered as a whole for optimal sound, flow, and fitment.',
    
    whyItMatters: 'Cat-back exhausts are the most popular exhaust modification because they provide significant sound improvement, some performance gain, and great appearance while remaining 50-state legal (emissions equipment is unchanged). They\'re typically a bolt-on installation, making them accessible to DIYers. Quality systems also include lifetime warranties.',
    
    commonTypes: [
      'Single exit (one tip, often tucked)',
      'Dual exit (tip each side)',
      'Quad tip (four tips)',
      'Axle-back + mid-pipe (modular)',
      'X-pipe configuration (V8/V6)',
      'H-pipe configuration (V8/V6)'
    ],
    
    keySpecs: [
      'Pipe diameter',
      'Material (T304/T409 stainless, aluminized)',
      'Muffler/resonator configuration',
      'Tip size and finish',
      'Weight vs stock'
    ],
    
    signs: {
      good: [
        'Improved exhaust note',
        'No drone (if well-designed)',
        'Quality fitment',
        'Durable finish',
        'No exhaust leaks'
      ],
      bad: [
        'Excessive drone',
        'Poor fitment (touching body)',
        'Rattling heat shields or hangers',
        'Premature rust',
        'Tips discoloring unevenly'
      ]
    },
    
    modPotential: {
      summary: 'Cat-back exhausts improve sound and appearance with modest performance gains while maintaining emissions compliance.',
      gains: 'Typical gains of 5-15 HP depending on how restrictive stock system is. Significant sound improvement.',
      considerations: 'Research sound clips before buying—sound is subjective. Quality materials (304 stainless) last longer. Professional installation ensures proper fitment. $400-1,500 for quality systems.'
    },
    
    relatedTopics: ['axle-back-exhaust', 'muffler', 'resonator', 'downpipe'],
    relatedUpgradeKeys: ['cat-back-exhaust'],
    status: 'complete'
  },

  {
    slug: 'axle-back-exhaust',
    name: 'Axle-Back Exhaust',
    system: 'exhaust',
    
    definition: 'An axle-back exhaust replaces only the rearmost section of the exhaust—from the rear axle to the tips. It\'s the simplest exhaust modification, typically involving just muffler replacement and new tips. Axle-backs are ideal for those wanting improved sound and appearance without major changes.',
    
    howItWorks: 'Axle-back systems bolt to the factory mid-pipe at a location near the rear axle. They replace the factory muffler(s) and tip(s) with performance alternatives. Because they don\'t include mid-pipe or replace the entire post-cat section, they\'re more affordable than cat-back systems. The trade-off is that the stock mid-pipe remains a potential restriction.',
    
    whyItMatters: 'Axle-backs are an excellent entry point for exhaust modification. They\'re affordable, typically bolt-on in under an hour, and provide the most noticeable change from the perspective of the driver and bystanders (muffler tone and tip appearance). For modest sound improvement without major investment, axle-backs are the go-to choice.',
    
    commonTypes: [
      'Muffler replacement only',
      'Muffler delete pipes',
      'Complete axle-back system (matched components)',
      'Bolt-on vs clamp-on',
      'Single/dual/quad tip configurations'
    ],
    
    keySpecs: [
      'Muffler type',
      'Tip style and size',
      'Material',
      'Weight vs stock',
      'Installation type (bolt-on preferred)'
    ],
    
    signs: {
      good: [
        'Improved exhaust sound',
        'Quality tip finish',
        'Proper hanger alignment',
        'No interference with body'
      ],
      bad: [
        'Excessive drone',
        'Tips hanging crooked',
        'Rattling against body',
        'Premature tip discoloration',
        'Poor weld quality'
      ]
    },
    
    modPotential: {
      summary: 'Axle-back exhausts provide affordable sound and appearance improvement.',
      gains: 'Minimal power gains (0-5 HP typical). Primary benefits are sound and appearance.',
      considerations: 'Best value for sound improvement alone. Easy DIY installation. Often the first mod for new enthusiasts. $200-800 for quality systems.'
    },
    
    relatedTopics: ['cat-back-exhaust', 'muffler', 'resonator'],
    relatedUpgradeKeys: ['axle-back-exhaust', 'muffler-upgrade'],
    status: 'complete'
  }
];

export default exhaustTopics;











