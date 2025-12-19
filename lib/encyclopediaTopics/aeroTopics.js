/**
 * AERODYNAMICS TOPICS - Complete Encyclopedia Content
 * 
 * 11 comprehensive topics covering aerodynamic principles and components.
 * All topics have full educational content - no stubs.
 * 
 * @module encyclopediaTopics/aerodynamics
 */

export const aeroTopics = [
  {
    slug: 'drag',
    name: 'Drag',
    system: 'aerodynamics',
    
    definition: 'Aerodynamic drag is the resistance force that air exerts on a vehicle as it moves through it. Drag increases with the square of velocity—doubling speed quadruples drag—making it the dominant force opposing motion at highway speeds. Reducing drag improves both fuel efficiency and top speed.',
    
    howItWorks: 'Drag consists of two main components: form drag (from the vehicle\'s shape pushing air aside) and skin friction drag (from air flowing along surfaces). The coefficient of drag (Cd) quantifies how streamlined a shape is, while frontal area determines how much air must be moved. Total drag force = ½ × air density × velocity² × Cd × frontal area. At 60 mph, a typical car might experience 100-200 lbs of drag force.',
    
    whyItMatters: 'Drag significantly affects fuel economy and performance. At highway speeds, 50-60% of engine power goes to overcoming drag. Reducing Cd from 0.35 to 0.30 can improve highway fuel economy by 5-7%. For racing, lower drag means higher top speeds—critical on circuits with long straights. However, reducing drag often conflicts with generating downforce.',
    
    commonTypes: [
      'Form/pressure drag (shape-related)',
      'Skin friction drag (surface-related)',
      'Induced drag (from generating lift/downforce)',
      'Interference drag (where components meet)',
      'Internal drag (cooling air, cabin ventilation)'
    ],
    
    keySpecs: [
      'Coefficient of drag (Cd)',
      'Frontal area (square feet/meters)',
      'CdA (drag area, Cd × frontal area)',
      'Drag force at speed (lbs/N)',
      'Power required to overcome drag'
    ],
    
    signs: {
      good: [
        'Stable at high speed',
        'Expected top speed achieved',
        'Good highway fuel economy',
        'Minimal wind noise'
      ],
      bad: [
        'Poor fuel economy at speed',
        'Lower than expected top speed',
        'High-speed instability',
        'Excessive wind noise'
      ]
    },
    
    modPotential: {
      summary: 'Drag reduction modifications range from removing accessories to comprehensive aero kits.',
      gains: 'Modest fuel economy improvements. Higher top speed. Can reduce cooling if taken too far.',
      considerations: 'Smooth underbody panels help significantly. Removing mirrors, spoilers reduces drag but may not be practical. Balance drag reduction with cooling needs.'
    },
    
    relatedTopics: ['downforce', 'lift', 'splitter', 'diffuser', 'cfd'],
    relatedUpgradeKeys: ['aero-kit'],
    status: 'complete'
  },

  {
    slug: 'lift',
    name: 'Lift',
    system: 'aerodynamics',
    
    definition: 'Aerodynamic lift is an upward force generated when air pressure below a vehicle is higher than above it—the same principle that allows airplanes to fly. Most cars generate positive lift (reducing tire grip) at speed unless specifically designed with aerodynamic aids to create downforce instead.',
    
    howItWorks: 'As air flows over and under a car, it accelerates over the curved roof (lower pressure above) and may be restricted beneath the car (higher pressure below). This pressure differential creates lift, literally trying to pull the car off the ground. Lift reduces the effective weight on the tires, reducing available grip. Like drag, lift increases with the square of velocity.',
    
    whyItMatters: 'Lift becomes dangerous at high speeds—it reduces stability and available grip exactly when you need them most. Many production cars experience significant lift at highway speeds. The 1999 Mercedes CLR famously became airborne at Le Mans due to lift. Performance cars use aerodynamic devices to counteract natural lift and generate downforce instead.',
    
    commonTypes: [
      'Positive lift (upward force, reduces grip)',
      'Zero lift (balanced)',
      'Negative lift/downforce (pushes car down)',
      'Front lift (affects steering)',
      'Rear lift (affects stability)'
    ],
    
    keySpecs: [
      'Coefficient of lift (Cl)',
      'Lift force at speed',
      'Front/rear lift balance',
      'Speed at which lift becomes significant',
      'Lift-to-drag ratio'
    ],
    
    signs: {
      good: [
        'Stable handling at high speed',
        'Consistent steering feel at speed',
        'Balanced front/rear grip',
        'Confidence-inspiring at speed'
      ],
      bad: [
        'Light steering at high speed',
        'Rear-end wander at speed',
        'Reduced braking performance at speed',
        'Nervous high-speed handling'
      ]
    },
    
    modPotential: {
      summary: 'Reducing lift or generating downforce significantly improves high-speed stability and grip.',
      gains: 'Improved high-speed stability. Better braking at speed. More confident handling.',
      considerations: 'Front splitters, rear wings, and diffusers combat lift. Must balance front/rear to avoid handling issues. Even modest aero improvements help.'
    },
    
    relatedTopics: ['downforce', 'wing', 'spoiler', 'splitter', 'diffuser'],
    relatedUpgradeKeys: ['aero-kit', 'wing'],
    status: 'complete'
  },

  {
    slug: 'downforce',
    name: 'Downforce',
    system: 'aerodynamics',
    
    definition: 'Downforce is aerodynamic force that pushes a vehicle toward the ground, increasing tire grip without adding weight. It\'s essentially negative lift—air pressure differences and deflection create a net downward force. Race cars can generate downforce exceeding their weight, theoretically allowing them to drive on the ceiling.',
    
    howItWorks: 'Downforce is generated through two mechanisms: inverted wings that deflect air upward (Newton\'s third law pushes the car down), and pressure differentials created by diffusers and underbody tunnels. A rear wing at 10° angle of attack might generate 200-400 lbs of downforce at 100 mph on a street car, while an F1 car generates over 3,000 lbs at 150 mph.',
    
    whyItMatters: 'Downforce increases tire grip in proportion to the force generated—more downforce means higher cornering speeds. The trade-off is increased drag and the fact that downforce only works at speed. A car with significant downforce handles very differently at 30 mph versus 100 mph. Proper aerodynamic balance (front vs rear downforce) is critical to handling.',
    
    commonTypes: [
      'Wing-generated (most efficient)',
      'Body-generated (spoilers, splitters)',
      'Ground effect (underbody tunnels)',
      'Active aero (adjustable elements)',
      'Front vs rear downforce'
    ],
    
    keySpecs: [
      'Downforce in lbs/kg at speed',
      'Front/rear downforce balance (%)',
      'Lift-to-drag ratio (efficiency)',
      'Downforce coefficient',
      'Sensitivity to ride height'
    ],
    
    signs: {
      good: [
        'Increased grip at high speed',
        'Higher cornering speeds',
        'Improved high-speed braking',
        'Balanced handling at speed'
      ],
      bad: [
        'Handling imbalance (aero push/loose)',
        'Excessive drag (poor straight-line speed)',
        'Unpredictable behavior if car lifts',
        'Uneven tire wear from aero loads'
      ]
    },
    
    modPotential: {
      summary: 'Aerodynamic modifications can add significant grip at speed through downforce generation.',
      gains: 'A proper wing can add 100-400+ lbs of downforce at track speeds. Dramatically improved high-speed cornering.',
      considerations: 'Downforce increases drag. Must balance front/rear. Only effective at higher speeds (>50 mph typically). Requires proper mounting to handle loads.'
    },
    
    relatedTopics: ['wing', 'splitter', 'diffuser', 'drag', 'adhesion'],
    relatedUpgradeKeys: ['wing', 'splitter', 'aero-kit'],
    status: 'complete'
  },

  {
    slug: 'adhesion',
    name: 'Adhesion',
    system: 'aerodynamics',
    
    definition: 'Aerodynamic adhesion refers to how air attaches to and flows along vehicle surfaces before separating. Maintaining attached (laminar) airflow is key to reducing drag and generating consistent aerodynamic forces. When airflow separates (becomes turbulent), drag increases and downforce becomes unpredictable.',
    
    howItWorks: 'Air flowing over a surface wants to follow that surface due to the Coanda effect. However, if the surface curves too sharply or the air slows too much, the boundary layer separates from the surface, creating turbulent wake. Smooth, gradually curving surfaces maintain attached flow. Surface texture, speed, and pressure gradients all affect where separation occurs.',
    
    whyItMatters: 'Attached airflow is more predictable and efficient than separated flow. Car designers work to delay separation as long as possible. The fastback shape delays roof flow separation, reducing drag. When flow does separate (inevitable at some point), controlling where and how affects the turbulent wake size and thus drag.',
    
    commonTypes: [
      'Laminar (attached) flow',
      'Turbulent (separated) flow',
      'Boundary layer (thin layer at surface)',
      'Flow separation point',
      'Reattachment'
    ],
    
    keySpecs: [
      'Separation point location',
      'Boundary layer thickness',
      'Surface roughness',
      'Pressure gradient',
      'Reynolds number'
    ],
    
    relatedTopics: ['drag', 'turbulence', 'spoiler', 'diffuser'],
    status: 'complete'
  },

  {
    slug: 'turbulence',
    name: 'Turbulence',
    system: 'aerodynamics',
    
    definition: 'Aerodynamic turbulence is chaotic, swirling airflow characterized by rapid pressure and velocity fluctuations. While laminar (smooth) flow is generally desirable over body surfaces, controlled turbulence can be beneficial in certain applications, such as keeping flow attached over curved surfaces.',
    
    howItWorks: 'Turbulence occurs when airflow becomes unstable, breaking into vortices and eddies. This happens when flow separates from surfaces, when different air streams meet at different velocities, or when objects like mirrors and wheels disturb smooth flow. The turbulent wake behind a vehicle is a major source of drag. Vortex generators deliberately create small turbulent vortices to energize the boundary layer and delay separation.',
    
    whyItMatters: 'The turbulent wake behind a car creates a low-pressure zone that pulls the car backward (drag). Reducing this wake through careful shaping reduces drag significantly. In some cases, intentionally tripping turbulence (via vortex generators or textured surfaces) can actually reduce overall drag by preventing larger-scale separation.',
    
    commonTypes: [
      'Wake turbulence (behind vehicle)',
      'Boundary layer turbulence (surface flow)',
      'Vortex shedding (periodic vortices)',
      'Induced turbulence (from wheels, mirrors)',
      'Controlled turbulence (vortex generators)'
    ],
    
    keySpecs: [
      'Wake size and intensity',
      'Turbulence intensity',
      'Frequency of vortex shedding',
      'Energy dissipation',
      'Effect on adjacent surfaces'
    ],
    
    relatedTopics: ['drag', 'adhesion', 'spoiler', 'diffuser'],
    relatedUpgradeKeys: ['vortex-generators'],
    status: 'complete'
  },

  {
    slug: 'spoiler',
    name: 'Spoiler',
    system: 'aerodynamics',
    
    definition: 'A spoiler is an aerodynamic device that disrupts ("spoils") airflow to reduce lift or drag. Unlike wings, spoilers work by changing the airflow pattern over the vehicle body rather than generating downforce directly. Rear spoilers reduce the size of the turbulent wake behind the car.',
    
    howItWorks: 'A rear spoiler interrupts airflow at the trailing edge of the roof or trunk, causing flow to separate at a controlled point rather than continuing down the rear window and creating a large turbulent wake. This can reduce drag by keeping the wake smaller and more organized. Some spoilers also reduce rear lift by preventing high-pressure air from wrapping around to the low-pressure area above the trunk.',
    
    whyItMatters: 'Spoilers are common on production cars because they\'re effective, unobtrusive, and don\'t add significant drag. A well-designed spoiler can reduce lift and sometimes even reduce drag. However, poorly designed or oversized spoilers can increase drag without meaningful benefit—many aftermarket "spoilers" are cosmetic only.',
    
    commonTypes: [
      'Lip spoiler (small, subtle)',
      'Ducktail spoiler (upturned trailing edge)',
      'Pedestal spoiler (raised off trunk)',
      'Roof spoiler (hatchbacks, SUVs)',
      'Active spoiler (deploys at speed)'
    ],
    
    keySpecs: [
      'Height above body',
      'Angle of deflection',
      'Width/span',
      'Lift reduction',
      'Drag impact'
    ],
    
    signs: {
      good: [
        'Reduced rear lift',
        'Improved high-speed stability',
        'Minimal drag penalty',
        'Factory-designed integration'
      ],
      bad: [
        'Increased drag without benefit',
        'Poor integration with body',
        'Insufficient size for speed',
        'Unbalanced aero (front heavy)'
      ]
    },
    
    modPotential: {
      summary: 'Properly designed spoilers can improve high-speed stability with minimal drag penalty.',
      gains: 'Reduced rear lift. Improved straight-line stability. Often improves appearance.',
      considerations: 'Effectiveness depends on design—many aftermarket spoilers are cosmetic. Must integrate with vehicle shape. OEM spoilers are often well-engineered. $100-600 for quality spoilers.'
    },
    
    relatedTopics: ['wing', 'drag', 'lift', 'diffuser'],
    relatedUpgradeKeys: ['spoiler', 'lip-spoiler'],
    status: 'complete'
  },

  {
    slug: 'wing',
    name: 'Wing',
    system: 'aerodynamics',
    
    definition: 'An aerodynamic wing is an inverted airfoil mounted to generate downforce. Unlike spoilers that disrupt airflow, wings actively create a pressure differential—low pressure above, high pressure below—that pushes the car toward the ground. Wings are the most efficient way to generate large amounts of downforce.',
    
    howItWorks: 'Air flowing over the curved upper surface of an inverted wing accelerates, creating low pressure. Air flowing under the flatter lower surface maintains higher pressure. This pressure differential creates a net downward force. Wing angle of attack, profile shape, and aspect ratio all affect how much downforce is generated versus drag created. End plates reduce induced drag by preventing high-pressure air from flowing around the wing tips.',
    
    whyItMatters: 'Wings can generate significant downforce—hundreds of pounds at track speeds—dramatically increasing tire grip in corners. However, wings also add drag, reducing straight-line speed. The trade-off between downforce and drag depends on the circuit; high-downforce setups excel on twisty tracks while lower-downforce setups are better for tracks with long straights.',
    
    commonTypes: [
      'Single-element wing (simple, efficient)',
      'Multi-element wing (higher downforce, more drag)',
      'Swan-neck mount (cleaner airflow under wing)',
      'Adjustable wing (variable angle)',
      'Active/DRS wing (changes configuration)'
    ],
    
    keySpecs: [
      'Span (width)',
      'Chord (front-to-back depth)',
      'Aspect ratio (span/chord)',
      'Angle of attack',
      'Downforce at speed',
      'Lift-to-drag ratio'
    ],
    
    signs: {
      good: [
        'Significant downforce at speed',
        'Improved corner speeds',
        'Better braking stability',
        'Solid mounting with no flex'
      ],
      bad: [
        'Excessive drag (too steep angle)',
        'Wing stall (too much angle)',
        'Mounting flex or failure',
        'Front/rear balance issues'
      ]
    },
    
    modPotential: {
      summary: 'Rear wings are the most effective way to add downforce for track use.',
      gains: 'Proper wings add 100-400+ lbs downforce at 100 mph. Dramatically improved high-speed cornering.',
      considerations: 'Must be properly mounted to handle loads (hundreds of pounds). Needs front aero balance (splitter). Adds drag. Not street-practical in most cases. Quality wings: $500-2,000+.'
    },
    
    relatedTopics: ['downforce', 'drag', 'splitter', 'canards'],
    relatedUpgradeKeys: ['wing', 'gt-wing'],
    status: 'complete'
  },

  {
    slug: 'splitter',
    name: 'Splitter',
    system: 'aerodynamics',
    
    definition: 'A front splitter is a flat horizontal extension of the front bumper that extends forward and sometimes sideways. It generates front downforce by creating a high-pressure zone above and a low-pressure zone below, helping balance the downforce generated by rear wings and improving front-end grip.',
    
    howItWorks: 'Air hitting the front of the car creates a high-pressure stagnation zone. The splitter extends into this zone, with high pressure above and low pressure below (where air accelerates under the car). This pressure differential pushes down on the splitter, generating front downforce. Splitters work best when paired with side skirts and a rear diffuser to manage underbody airflow.',
    
    whyItMatters: 'Front downforce is essential for balanced handling at speed. A car with a big rear wing but no front downforce will severely understeer at high speed. Splitters provide front downforce efficiently, though they\'re vulnerable to damage from road debris, speed bumps, and steep driveways—a common concern for track-oriented street cars.',
    
    commonTypes: [
      'Lip splitter (small extension)',
      'Full splitter (extends under bumper)',
      'Splitter with dive planes/canards',
      'Adjustable splitter (variable angle)',
      'Air dam with integrated splitter'
    ],
    
    keySpecs: [
      'Extension length (forward from bumper)',
      'Width',
      'Angle of attack',
      'Ground clearance',
      'Downforce generated'
    ],
    
    signs: {
      good: [
        'Improved front-end grip at speed',
        'Better turn-in',
        'Balanced handling with rear aero',
        'Solid mounting'
      ],
      bad: [
        'Ground strike damage',
        'Mounting failure',
        'Unbalanced (too much front grip)',
        'Excessive drag from poor design'
      ]
    },
    
    modPotential: {
      summary: 'Splitters add front downforce to balance rear wings and improve front-end grip.',
      gains: 'Front downforce for balanced handling. Improved high-speed turn-in and stability.',
      considerations: 'Must balance with rear downforce. Vulnerable to damage on street cars. Requires solid mounting. Quick-release options available for street/track cars. $200-1,000 for quality splitters.'
    },
    
    relatedTopics: ['downforce', 'wing', 'canards', 'diffuser'],
    relatedUpgradeKeys: ['splitter', 'front-lip'],
    status: 'complete'
  },

  {
    slug: 'canards',
    name: 'Canards',
    system: 'aerodynamics',
    
    definition: 'Canards (also called dive planes or bumper winglets) are small aerodynamic fins mounted on the front corners of a vehicle. They generate front downforce and can redirect airflow around the front wheels, improving front grip and reducing drag from wheel turbulence.',
    
    howItWorks: 'Canards work like small wings mounted at an angle. Air hitting the canard is deflected, generating a downward reaction force. They also redirect airflow around the front wheel wells, reducing the turbulent drag from spinning wheels. The downforce generated is modest compared to splitters or wings, but canards can fine-tune front aero balance.',
    
    whyItMatters: 'Canards provide adjustable front downforce without modifying the main splitter. They\'re useful for fine-tuning aero balance and can help with turn-in response. However, poorly designed or positioned canards can increase drag without meaningful downforce benefit—placement and angle are critical.',
    
    commonTypes: [
      'Fixed canards',
      'Adjustable canards',
      'Integrated with splitter',
      'Multi-element canards',
      'Different sizes for adjustment'
    ],
    
    keySpecs: [
      'Angle of attack',
      'Size and position',
      'Downforce contribution',
      'Drag impact',
      'Mounting strength'
    ],
    
    signs: {
      good: [
        'Improved front grip',
        'Better aero balance adjustability',
        'Cleaner wheel airflow',
        'Solid mounting'
      ],
      bad: [
        'Increased drag without benefit',
        'Poor positioning (wrong angle)',
        'Weak mounting',
        'Cosmetic-only design'
      ]
    },
    
    modPotential: {
      summary: 'Canards provide fine-tuning capability for front downforce and aero balance.',
      gains: 'Adjustable front downforce. Improved front tire grip. Can reduce wheel turbulence.',
      considerations: 'Effectiveness depends on design and placement. Often require experimentation. Must be sturdy enough to handle loads. $50-300 for functional canards.'
    },
    
    relatedTopics: ['splitter', 'downforce', 'wing', 'drag'],
    relatedUpgradeKeys: ['canards', 'dive-planes'],
    status: 'complete'
  },

  {
    slug: 'diffuser',
    name: 'Diffuser',
    system: 'aerodynamics',
    
    definition: 'A rear diffuser is an upward-sloping section of the underbody at the rear of the car that accelerates air exiting from beneath the vehicle. This creates a low-pressure zone under the car, generating downforce through ground effect—often more efficiently than wings because it produces downforce with less drag.',
    
    howItWorks: 'Air flowing under the car enters the diffuser section where the expanding channel slows the air down (converts velocity to pressure). However, the upward angle accelerates air at the diffuser entrance, creating low pressure. This low pressure under the rear of the car sucks the car toward the ground. Diffusers work best with a flat underbody that channels air smoothly to the diffuser inlet.',
    
    whyItMatters: 'Diffusers are the most efficient way to generate downforce—they can produce significant downforce with minimal drag penalty. Modern race cars and supercars rely heavily on diffusers and underbody aerodynamics. For street cars, even a modest diffuser can improve rear stability, though effectiveness depends on the rest of the underbody.',
    
    commonTypes: [
      'Single-channel diffuser',
      'Multi-channel diffuser',
      'Flat-bottom with diffuser',
      'Venturi tunnels (extreme ground effect)',
      'Active diffuser (adjustable)'
    ],
    
    keySpecs: [
      'Diffuser angle',
      'Channel width and depth',
      'Expansion ratio',
      'Ground clearance',
      'Downforce generated'
    ],
    
    signs: {
      good: [
        'Improved rear stability',
        'Efficient downforce (low drag penalty)',
        'Works with flat underbody',
        'Proper sealing to body'
      ],
      bad: [
        'Stalled diffuser (too steep angle)',
        'Poor sealing (leaks kill effectiveness)',
        'Ground strikes damaging diffuser',
        'Cosmetic-only design'
      ]
    },
    
    modPotential: {
      summary: 'Diffusers generate efficient downforce with minimal drag, ideal for track-focused builds.',
      gains: 'Rear downforce with low drag. Improved high-speed stability. Works with overall aero package.',
      considerations: 'Requires flat underbody for best results. Angle and sealing are critical. Ground clearance limits street practicality. Often paired with splitter and flat floor. $300-1,500 for functional diffusers.'
    },
    
    relatedTopics: ['downforce', 'drag', 'splitter', 'ground-effect'],
    relatedUpgradeKeys: ['diffuser', 'rear-diffuser'],
    status: 'complete'
  },

  {
    slug: 'cfd',
    name: 'Computational Fluid Dynamics (CFD)',
    system: 'aerodynamics',
    
    definition: 'Computational Fluid Dynamics (CFD) is the use of computer simulations to analyze and predict airflow around vehicles. CFD allows engineers to test aerodynamic designs virtually before building physical prototypes, dramatically reducing development time and cost while enabling optimization of complex shapes.',
    
    howItWorks: 'CFD software divides the air volume around a vehicle into millions of small cells (meshing). The software then solves fluid dynamics equations for each cell, calculating pressure, velocity, and turbulence throughout the domain. Results visualize airflow patterns, pressure distributions, and forces like drag and downforce. Modern CFD can model complex phenomena including turbulence, heat transfer, and rotating wheels.',
    
    whyItMatters: 'CFD has revolutionized automotive aerodynamics. What once required expensive wind tunnel time can now be explored on computers first, with wind tunnels used for validation. Teams can test hundreds of design variations virtually. For enthusiasts, CFD explains why certain modifications work—when companies share CFD images of their products, you can see the aerodynamic effects.',
    
    commonTypes: [
      'RANS (Reynolds-Averaged Navier-Stokes, common)',
      'LES (Large Eddy Simulation, more detailed)',
      'DES (Detached Eddy Simulation, hybrid)',
      'Steady-state (time-averaged)',
      'Transient (time-varying)'
    ],
    
    keySpecs: [
      'Mesh quality and cell count',
      'Turbulence model used',
      'Boundary conditions',
      'Convergence criteria',
      'Correlation with wind tunnel data'
    ],
    
    signs: {
      good: [
        'Results validated by testing',
        'Fine mesh in critical areas',
        'Appropriate turbulence model',
        'Converged solution'
      ],
      bad: [
        'Unvalidated results',
        'Coarse mesh missing details',
        'Non-converged solution',
        'Unrealistic boundary conditions'
      ]
    },
    
    relatedTopics: ['drag', 'downforce', 'lift', 'turbulence'],
    status: 'complete'
  }
];

export default aeroTopics;





