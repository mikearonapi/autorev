/**
 * SUSPENSION & STEERING TOPICS - Complete Encyclopedia Content
 * 
 * 27 comprehensive topics covering suspension and steering systems.
 * All topics have full educational content - no stubs.
 * 
 * @module encyclopediaTopics/suspension
 */

export const suspensionTopics = [
  {
    slug: 'spring',
    name: 'Spring',
    system: 'suspension-steering',
    
    definition: 'Springs are elastic components that support vehicle weight and absorb road irregularities by compressing and extending. They store energy when compressed and release it as they extend, providing the primary vertical compliance in the suspension system. Spring design determines ride height, ride quality, and handling characteristics.',
    
    howItWorks: 'When the wheel encounters a bump, the spring compresses, absorbing the impact energy. As the spring extends, it releases this energy in a controlled manner (ideally damped by the shock absorber). Spring rate—the force required to compress the spring a given distance—determines how stiff the ride feels. Higher rates resist body roll and provide sharper handling but transmit more road harshness.',
    
    whyItMatters: 'Springs are fundamental to how a car rides and handles. Softer springs provide comfort but allow excessive body motion; stiffer springs control the body but transmit more road feel. Finding the right spring rate for your intended use is one of the most important suspension decisions. Springs also set ride height, which affects center of gravity and aerodynamics.',
    
    commonTypes: [
      'Coil spring (most common, helical wound wire)',
      'Leaf spring (trucks, classic cars)',
      'Torsion bar (twists instead of compressing)',
      'Air spring (adjustable, luxury/trucks)',
      'Progressive rate (variable stiffness)',
      'Linear rate (consistent stiffness)'
    ],
    
    keySpecs: [
      'Spring rate (lbs/in or N/mm)',
      'Free length (uncompressed)',
      'Installed height',
      'Wire diameter',
      'Coil diameter',
      'Progressive vs linear rate'
    ],
    
    signs: {
      good: [
        'Consistent ride height corner to corner',
        'Appropriate body control',
        'No sagging or bottoming out',
        'Smooth compression and extension'
      ],
      bad: [
        'Sagging ride height',
        'Excessive body roll',
        'Bottoming out over bumps',
        'Broken coils (clunking, height change)',
        'Uneven ride height side to side'
      ]
    },
    
    modPotential: {
      summary: 'Spring upgrades are fundamental to handling improvement, typically combined with matching dampers.',
      gains: 'Stiffer springs reduce body roll and improve responsiveness. Lowering springs reduce center of gravity.',
      considerations: 'Must match spring rate to damper valving. Too stiff sacrifices ride quality and can reduce grip. Lowering affects geometry. $150-400 for quality spring sets.'
    },
    
    relatedTopics: ['spring-rate', 'shock-absorber', 'coilover', 'ride-height'],
    relatedUpgradeKeys: ['lowering-springs', 'sport-springs'],
    status: 'complete'
  },

  {
    slug: 'spring-rate',
    name: 'Spring Rate',
    system: 'suspension-steering',
    
    definition: 'Spring rate is the amount of force required to compress a spring a given distance, typically measured in pounds per inch (lbs/in) or Newtons per millimeter (N/mm). It quantifies spring stiffness and is one of the most important specifications when selecting springs for a specific application.',
    
    howItWorks: 'A spring with a 500 lbs/in rate requires 500 pounds of force to compress it one inch. If you apply 1,000 pounds, it compresses two inches. Linear springs maintain this relationship throughout their travel; progressive springs have rates that increase as they compress (stiffer the more they\'re compressed). Wheel rate—what the wheel actually experiences—differs from spring rate based on suspension geometry and motion ratios.',
    
    whyItMatters: 'Spring rate selection is critical to handling balance. Too soft and the car wallows; too stiff and it skips over bumps. The front-to-rear spring rate ratio affects handling balance—relatively stiffer front rates promote understeer, while stiffer rear rates promote oversteer. Proper rate selection considers vehicle weight, intended use, and tire grip levels.',
    
    commonTypes: [
      'Linear rate (constant throughout travel)',
      'Progressive rate (increases with compression)',
      'Dual rate (switches at certain point)',
      'Helper spring (light spring to keep main spring seated)'
    ],
    
    keySpecs: [
      'Rate in lbs/in or N/mm',
      'Motion ratio (suspension geometry factor)',
      'Wheel rate (rate at wheel)',
      'Natural frequency (ride quality indicator)',
      'Front/rear rate balance'
    ],
    
    signs: {
      good: [
        'Balanced handling characteristics',
        'Appropriate body control for use',
        'Comfortable ride (for street springs)',
        'Full suspension travel available'
      ],
      bad: [
        'Excessive body roll (rates too soft)',
        'Harsh ride (rates too stiff)',
        'Loss of traction over bumps (too stiff)',
        'Handling imbalance (wrong F/R ratio)'
      ]
    },
    
    modPotential: {
      summary: 'Selecting appropriate spring rates is key to achieving desired handling characteristics.',
      gains: 'Proper rates optimize the balance between grip, body control, and ride quality.',
      considerations: 'Work with suspension specialists for optimal rates. Consider street vs track use. Must match damper valving to rates.'
    },
    
    relatedTopics: ['spring', 'coilover', 'shock-absorber', 'wheel-alignment'],
    relatedUpgradeKeys: ['coilovers', 'lowering-springs'],
    status: 'complete'
  },

  {
    slug: 'shock-absorber',
    name: 'Shock Absorber',
    system: 'suspension-steering',
    
    definition: 'Shock absorbers (shocks) control spring oscillation by converting kinetic energy into heat through hydraulic resistance. Without shocks, springs would bounce repeatedly after hitting a bump. Shocks don\'t support vehicle weight—that\'s the spring\'s job—but they control how quickly the suspension moves.',
    
    howItWorks: 'Shocks contain a piston that moves through oil-filled chambers. As the piston moves, oil is forced through small valves or orifices, creating resistance. This resistance—called damping—controls compression (bump) and extension (rebound) separately. Damping force increases with velocity, meaning shocks resist rapid movements more than slow ones. This allows the suspension to absorb quick bumps while controlling body motion.',
    
    whyItMatters: 'Shocks are critical for both ride quality and handling. Worn shocks allow excessive bouncing and body motion, reducing control and tire contact. Performance shocks with firmer valving control body motion better but transmit more road harshness. The key is matching shock damping to spring rate and intended use.',
    
    commonTypes: [
      'Twin-tube (basic, cost-effective)',
      'Monotube (better heat dissipation, performance)',
      'Gas-charged (reduced fade)',
      'Remote reservoir (maximum heat capacity)',
      'Adjustable (variable damping settings)',
      'Electronic/adaptive (continuously variable)'
    ],
    
    keySpecs: [
      'Damping force curves (compression/rebound)',
      'Adjustability (if equipped)',
      'Extended/compressed length',
      'Shaft diameter',
      'Reservoir size (if equipped)'
    ],
    
    signs: {
      good: [
        'Single bounce test (push and release, one oscillation)',
        'Controlled body motion over bumps',
        'Consistent damping hot and cold',
        'No leaking oil'
      ],
      bad: [
        'Excessive bouncing after bumps',
        'Oil leaking from seals',
        'Clunking noise over bumps',
        'Uneven tire wear',
        'Nose dive under braking'
      ]
    },
    
    modPotential: {
      summary: 'Performance shocks significantly improve handling by better controlling body motion and wheel contact.',
      gains: 'Reduced body roll, better wheel control over bumps, improved braking stability.',
      considerations: 'Must match valving to spring rate. Adjustable shocks allow tuning for different conditions. Quality matters—cheap shocks fade quickly. $400-2,000+ for quality sets.'
    },
    
    relatedTopics: ['damper', 'spring', 'coilover', 'bump-stop'],
    relatedUpgradeKeys: ['performance-shocks', 'coilovers'],
    status: 'complete'
  },

  {
    slug: 'damper',
    name: 'Damper',
    system: 'suspension-steering',
    
    definition: 'Damper is another term for shock absorber, more commonly used in engineering and motorsport contexts. The term emphasizes the component\'s function: damping (controlling) spring oscillation rather than "absorbing shock." In coilover systems, the damper is the hydraulic unit separate from the spring.',
    
    howItWorks: 'Dampers control suspension velocity through hydraulic resistance. When the suspension compresses or extends, oil flows through valves in the piston, creating resistance proportional to velocity. Modern dampers have separate compression and rebound circuits with different valving. Digressive valving provides firm control at low speeds (body motion) but allows suspension movement over sharp bumps (high-speed events).',
    
    whyItMatters: 'Damper tuning is crucial for optimizing both grip and control. Underdamped suspension bounces and lacks control; overdamped suspension is harsh and can\'t follow road irregularities. Performance dampers allow adjustment to fine-tune the balance for specific conditions—softer for bumpy tracks, firmer for smooth surfaces.',
    
    commonTypes: [
      'Non-adjustable (fixed valving)',
      'Single adjustable (usually rebound)',
      'Double adjustable (compression and rebound)',
      'Triple adjustable (high/low speed compression + rebound)',
      'Four-way adjustable (high/low speed both directions)'
    ],
    
    keySpecs: [
      'Compression damping (low/high speed)',
      'Rebound damping (low/high speed)',
      'Adjustment range',
      'Shaft velocity vs force curves',
      'Rebuild interval'
    ],
    
    signs: {
      good: [
        'Controlled suspension movement',
        'Consistent performance through session',
        'Smooth adjustment feel',
        'Matching damping to spring rate'
      ],
      bad: [
        'Fade under hard use (overheating)',
        'Harsh over small bumps',
        'Wallowing over large bumps',
        'Damper noise (internal wear)',
        'Oil leakage'
      ]
    },
    
    modPotential: {
      summary: 'Adjustable dampers allow fine-tuning suspension behavior for different conditions and preferences.',
      gains: 'Optimized grip and control. Ability to adjust for street comfort or track performance.',
      considerations: 'More adjustability isn\'t always better—requires knowledge to use effectively. Quality dampers can be revalved/rebuilt. $800-4,000+ for quality adjustable sets.'
    },
    
    relatedTopics: ['shock-absorber', 'coilover', 'spring-rate', 'bump-stop'],
    relatedUpgradeKeys: ['coilovers', 'performance-dampers'],
    status: 'complete'
  },

  {
    slug: 'bump-stop',
    name: 'Bump Stop',
    system: 'suspension-steering',
    
    definition: 'Bump stops are rubber, foam, or urethane cushions that prevent metal-to-metal contact when suspension fully compresses. They act as a progressive rate spring at the end of travel, adding resistance as the suspension approaches its limit. Modern bump stops are tuned components that affect handling at the limit.',
    
    howItWorks: 'When suspension compresses toward its limit, the bump stop contacts the chassis or control arm. Progressive bump stops compress gradually, adding spring rate smoothly. This prevents harsh bottoming out and protects suspension components. In motorsport, bump stops are tuned to provide specific additional spring rate in the last portion of travel, effectively stiffening the car during hard cornering or braking.',
    
    whyItMatters: 'Bump stops prevent damage from bottoming out and provide a controlled end-of-travel feel. On lowered cars, the bump stops often engage during normal driving, making their characteristics important to ride quality. In racing, bump stop tuning is a key setup tool for controlling how the car behaves when suspension travel is exhausted.',
    
    commonTypes: [
      'Rubber (stock, basic)',
      'Polyurethane (stiffer, more durable)',
      'Progressive rate foam (motorsport)',
      'Hydraulic bump stops (off-road)',
      'Extended vs cut/shortened'
    ],
    
    keySpecs: [
      'Material and durometer',
      'Length',
      'Engagement point (relative to travel)',
      'Rate curve',
      'Temperature stability'
    ],
    
    signs: {
      good: [
        'Smooth end-of-travel feel',
        'No harsh bottoming out',
        'Consistent engagement point',
        'Proper travel remaining'
      ],
      bad: [
        'Harsh bottoming out',
        'Torn or deteriorated bump stops',
        'Riding on bump stops constantly (wrong height)',
        'Metal-to-metal contact sound'
      ]
    },
    
    modPotential: {
      summary: 'Bump stop tuning is important for lowered cars and motorsport applications.',
      gains: 'Proper bump stops prevent damage and provide controlled end-of-travel behavior.',
      considerations: 'Must adjust or replace when lowering suspension. Progressive foam stops allow tuning engagement characteristics. $30-200 for quality bump stop sets.'
    },
    
    relatedTopics: ['spring', 'coilover', 'shock-absorber', 'suspension-travel'],
    relatedUpgradeKeys: ['bump-stops'],
    status: 'complete'
  },

  {
    slug: 'macpherson-strut',
    name: 'MacPherson Strut',
    system: 'suspension-steering',
    
    definition: 'The MacPherson strut is a suspension design where the shock absorber and spring are integrated into a single structural unit that also serves as the upper pivot point for the steering knuckle. It\'s the most common front suspension design due to its simplicity, low cost, and compact packaging.',
    
    howItWorks: 'The strut assembly bolts to the steering knuckle at the bottom and to the strut tower at the top. The lower control arm provides the lower pivot point. When the wheel moves up, the entire strut assembly compresses. Because the strut is also a structural member (unlike separate shock/spring setups), it must be more robust. Camber changes as the suspension travels due to the strut\'s angle changing relative to the ground.',
    
    whyItMatters: 'MacPherson struts dominate the automotive market because they\'re simple and space-efficient. However, their geometry limits performance potential—camber change during travel is less favorable than double-wishbone designs. For serious track use, strut-based cars often require camber plates and careful alignment to compensate for inherent geometry limitations.',
    
    commonTypes: [
      'Standard MacPherson (single lower arm)',
      'Modified MacPherson (additional links)',
      'Strut with separate spring (rare)',
      'Coilover conversion (replaces strut assembly)'
    ],
    
    keySpecs: [
      'Strut length (extended/compressed)',
      'Spring seat location',
      'Top mount type',
      'Knuckle attachment style',
      'Caster/camber adjustability'
    ],
    
    signs: {
      good: [
        'Quiet operation',
        'Proper wheel alignment',
        'No strut tower rust or damage',
        'Smooth steering feel'
      ],
      bad: [
        'Clunking over bumps (worn mounts)',
        'Steering wander (worn components)',
        'Visible strut body damage or bending',
        'Strut tower cracking or rust'
      ]
    },
    
    modPotential: {
      summary: 'Strut upgrades typically involve coilover conversions or performance strut assemblies.',
      gains: 'Adjustable coilovers add ride height and damping adjustment. Camber plates enable more alignment range.',
      considerations: 'Coilovers are the standard upgrade path. Camber plates address limited stock adjustment. Strut tower braces can improve rigidity. Quality coilovers: $800-3,000+.'
    },
    
    relatedTopics: ['coilover', 'shock-absorber', 'control-arm', 'wheel-alignment'],
    relatedUpgradeKeys: ['coilovers', 'strut-upgrade'],
    status: 'complete'
  },

  {
    slug: 'coilover',
    name: 'Coilover',
    system: 'suspension-steering',
    
    definition: 'A coilover (coil-over-shock) is a suspension component where the spring is mounted concentrically around the shock absorber/damper. This integrated design allows adjustable ride height, and most performance coilovers also offer adjustable damping. Coilovers are the preferred suspension upgrade for serious enthusiasts.',
    
    howItWorks: 'The spring sits on a threaded collar on the shock body, allowing ride height adjustment by threading the collar up or down. Preload (initial spring compression) is set by a separate locking collar. Performance coilovers include adjustable damping—typically rebound adjustment via a knob on the shock body, with some offering compression adjustment as well. The ability to adjust height, spring rate (via spring changes), and damping makes coilovers highly tunable.',
    
    whyItMatters: 'Coilovers represent the gold standard for suspension modifications. They allow precise ride height setting for optimal geometry and aesthetics, adjustable damping to fine-tune handling, and the ability to change spring rates easily. A quality coilover setup transforms how a car handles, though proper selection and setup are critical.',
    
    commonTypes: [
      'Street coilovers (basic adjustment, comfort-oriented)',
      'Sport coilovers (stiffer, more adjustment)',
      'Track coilovers (full adjustment, monotube)',
      'Inverted coilovers (damper body up, reduced unsprung weight)',
      'Remote reservoir (maximum heat capacity)'
    ],
    
    keySpecs: [
      'Damping adjustment range and type',
      'Ride height adjustment range',
      'Spring rate options',
      'Construction (monotube vs twin-tube)',
      'Camber plate inclusion',
      'Warranty and rebuild availability'
    ],
    
    signs: {
      good: [
        'Consistent damping through session',
        'Even ride height corner to corner',
        'Smooth adjustment operation',
        'No oil leaks',
        'Positive click adjustments'
      ],
      bad: [
        'Damping fade under hard use',
        'Seized adjustment collars',
        'Oil leaking from seals',
        'Spring rubbing on shock body',
        'Inconsistent adjustment clicks'
      ]
    },
    
    modPotential: {
      summary: 'Coilovers are the most significant suspension upgrade for handling improvement.',
      gains: 'Fully adjustable suspension for any application. Optimal ride height and corner balance. Tunable damping for street or track.',
      considerations: 'Quality varies enormously—avoid cheap coilovers. Proper setup (alignment, corner balancing) essential. Budget coilovers: $500-1,000. Quality street/track: $1,500-4,000+.'
    },
    
    relatedTopics: ['spring-rate', 'damper', 'shock-absorber', 'wheel-alignment'],
    relatedUpgradeKeys: ['coilovers'],
    status: 'complete'
  },

  {
    slug: 'double-wishbone',
    name: 'Double Wishbone',
    system: 'suspension-steering',
    
    definition: 'Double wishbone (or double A-arm) suspension uses two wishbone-shaped control arms—upper and lower—to locate the wheel. This design offers superior control over wheel geometry throughout suspension travel, maintaining more consistent camber and providing better handling characteristics than strut-based designs.',
    
    howItWorks: 'The upper and lower wishbones attach to the chassis and the steering knuckle/upright. The spring and damper mount separately (usually to the lower arm or chassis). Arm lengths and angles determine how camber, caster, and toe change during suspension travel. Engineers can tune these geometry changes independently, optimizing for specific handling characteristics. This flexibility is why double wishbones are preferred for high-performance applications.',
    
    whyItMatters: 'Double wishbone suspension provides the best control over wheel geometry. During cornering, when the outside suspension compresses, double wishbones can maintain more negative camber, keeping the tire\'s contact patch optimal. This translates to higher grip levels and more predictable handling at the limit—why it\'s standard on sports cars and race cars.',
    
    commonTypes: [
      'Unequal length (most common)',
      'Equal length (limited geometry control)',
      'Pull-rod (spring/damper mounted low)',
      'Push-rod (spring/damper mounted high)',
      'Inboard vs outboard spring/damper'
    ],
    
    keySpecs: [
      'Upper/lower arm lengths',
      'Arm angles and mounting points',
      'Camber curve (camber vs travel)',
      'Roll center height',
      'Anti-dive/anti-squat geometry'
    ],
    
    signs: {
      good: [
        'Consistent handling characteristics',
        'Good camber throughout travel',
        'Precise steering feel',
        'Predictable limit behavior'
      ],
      bad: [
        'Worn ball joints (clunking, play)',
        'Bent control arms',
        'Worn bushings (vague handling)',
        'Alignment drift'
      ]
    },
    
    modPotential: {
      summary: 'Double wishbone geometry can be optimized through arm changes, adjustable mounts, and setup.',
      gains: 'Adjustable arms enable fine-tuning of geometry. Roll center adjusters optimize handling balance.',
      considerations: 'Geometry changes require engineering knowledge. Adjustable arms available for many platforms. Keep alignment specs for reference. $200-1,500 for adjustable arm sets.'
    },
    
    relatedTopics: ['control-arm', 'ball-joint', 'wheel-alignment', 'roll-center'],
    relatedUpgradeKeys: ['adjustable-arms', 'control-arm-upgrade'],
    status: 'complete'
  },

  {
    slug: 'multi-link',
    name: 'Multi-Link Suspension',
    system: 'suspension-steering',
    
    definition: 'Multi-link suspension uses three or more lateral arms plus additional links to locate the wheel, providing extensive control over wheel geometry. This design is common in modern performance cars, especially for rear suspension, as it offers double-wishbone-like geometry control with packaging flexibility.',
    
    howItWorks: 'Multiple independent links (typically 4-5 per wheel) each control specific aspects of wheel movement. One link might control camber, another toe, another lateral location. This separation allows engineers to optimize each geometry parameter independently. The complexity adds weight and cost but provides superior handling potential. Bushings at each link add compliance for ride comfort while affecting handling precision.',
    
    whyItMatters: 'Multi-link suspension represents the modern evolution of independent rear suspension. It allows car designers to achieve optimal geometry within packaging constraints. For enthusiasts, the multiple links also provide multiple upgrade opportunities—spherical bearings, adjustable links, and alignment options that can transform handling.',
    
    commonTypes: [
      '4-link (basic multi-link)',
      '5-link (most BMW, Mercedes, Audi rear)',
      'H-arm multi-link (some Honda)',
      'Integral link (combined functions)',
      'Rear-steer multi-link (passive toe change)'
    ],
    
    keySpecs: [
      'Number and type of links',
      'Bushing types and durometer',
      'Toe curve (toe vs travel)',
      'Camber curve',
      'Anti-squat geometry'
    ],
    
    signs: {
      good: [
        'Stable rear end feel',
        'Predictable limit handling',
        'No wandering under power',
        'Even tire wear'
      ],
      bad: [
        'Rear-end wander or instability',
        'Clunking over bumps (worn bushings)',
        'Toe thrust (alignment change under load)',
        'Uneven rear tire wear',
        'Bent or damaged links'
      ]
    },
    
    modPotential: {
      summary: 'Multi-link systems offer extensive tuning through adjustable links and bushing upgrades.',
      gains: 'Adjustable links enable precise alignment. Spherical bearings eliminate bushing deflection for sharper response.',
      considerations: 'Spherical bearings increase NVH (noise, vibration, harshness). Alignment becomes more complex with adjustable links. Budget $400-2,000 for full adjustable arm sets.'
    },
    
    relatedTopics: ['control-arm', 'bushings', 'wheel-alignment', 'toe'],
    relatedUpgradeKeys: ['adjustable-arms', 'rear-link-upgrade'],
    status: 'complete'
  },

  {
    slug: 'control-arm',
    name: 'Control Arm',
    system: 'suspension-steering',
    
    definition: 'Control arms are the suspension links that connect the wheel assembly (knuckle/hub) to the chassis. They control wheel movement while allowing the suspension to travel up and down. Control arms can be A-shaped (wishbone), I-shaped (single link), or L-shaped, depending on the suspension design.',
    
    howItWorks: 'Control arms pivot on bushings at the chassis end and connect to the knuckle via ball joints. When the wheel moves over bumps or during body roll, the control arm pivots on its bushings. The arm\'s length, angle, and mounting points determine how wheel geometry changes during suspension travel. Multiple control arms working together create the suspension\'s kinematic behavior.',
    
    whyItMatters: 'Control arm geometry defines how the car handles. Worn bushings or bent arms compromise alignment and handling precision. Aftermarket adjustable arms allow fine-tuning of alignment beyond factory specs—essential for lowered cars where stock geometry is compromised. Strong aftermarket arms also resist bending under track use.',
    
    commonTypes: [
      'Stamped steel (stock, cost-effective)',
      'Cast aluminum (lighter, OEM performance)',
      'Tubular steel (aftermarket, adjustable)',
      'Billet aluminum (lightweight, adjustable)',
      'Carbon fiber (racing, maximum weight savings)'
    ],
    
    keySpecs: [
      'Arm length',
      'Mounting point locations',
      'Bushing size and type',
      'Ball joint specification',
      'Adjustability (if aftermarket)'
    ],
    
    signs: {
      good: [
        'No play in bushings or ball joints',
        'Straight, undamaged arms',
        'Alignment stays in spec',
        'Quiet operation'
      ],
      bad: [
        'Clunking over bumps',
        'Visible bushing deterioration',
        'Ball joint play',
        'Bent or cracked arm',
        'Alignment won\'t hold'
      ]
    },
    
    modPotential: {
      summary: 'Aftermarket control arms enable alignment correction on lowered cars and fine-tuning for track use.',
      gains: 'Extended adjustment range for camber, caster, or toe. Stronger construction for track abuse.',
      considerations: 'Match arm type to adjustment needed. Eccentric bolt adjusters are cheaper alternative for some applications. Full arm replacement: $150-800 per arm.'
    },
    
    relatedTopics: ['ball-joint', 'bushings', 'wheel-alignment', 'double-wishbone'],
    relatedUpgradeKeys: ['adjustable-arms', 'control-arm-upgrade'],
    status: 'complete'
  },

  {
    slug: 'tie-rod',
    name: 'Tie Rod & Tie Rod End',
    system: 'suspension-steering',
    
    definition: 'Tie rods connect the steering rack to the steering knuckles, translating the rack\'s lateral movement into wheel steering angle. The tie rod end is a ball joint that allows the steering geometry to accommodate suspension movement while maintaining a pivoting connection to the knuckle.',
    
    howItWorks: 'When you turn the steering wheel, the steering rack moves laterally. Tie rods attached to the rack transmit this movement to the steering arms on the knuckles, turning the wheels. The tie rod length determines toe setting—adjusting the tie rods is how toe alignment is performed. Tie rod ends accommodate the changing angle between the knuckle and rack as the suspension travels.',
    
    whyItMatters: 'Tie rods are critical to steering precision and safety. Worn tie rod ends cause play in steering, making the car feel vague and potentially dangerous. Bent tie rods from impacts cause alignment issues. After lowering a car, extended or adjustable tie rods may be needed to maintain proper geometry and avoid bump steer.',
    
    commonTypes: [
      'Inner tie rod (connects to rack)',
      'Outer tie rod end (connects to knuckle)',
      'One-piece tie rod (some applications)',
      'Adjustable tie rod (aftermarket)',
      'Extended tie rod (for lowered applications)'
    ],
    
    keySpecs: [
      'Length (for toe adjustment range)',
      'Ball joint specification',
      'Thread pitch and direction',
      'Taper size (knuckle interface)',
      'Load rating'
    ],
    
    signs: {
      good: [
        'Tight steering with no play',
        'Toe alignment holds spec',
        'No clunking when steering',
        'Boot intact (ends)'
      ],
      bad: [
        'Steering play or looseness',
        'Clunking when turning',
        'Torn tie rod end boot',
        'Toe changes on its own',
        'Visible ball joint wear'
      ]
    },
    
    modPotential: {
      summary: 'Extended or adjustable tie rods correct geometry on lowered cars and eliminate bump steer.',
      gains: 'Proper steering geometry after lowering. Eliminated bump steer. Extended adjustment range for alignment.',
      considerations: 'Often needed when lowering more than 1.5 inches. Bump steer kits relocate the tie rod mounting point. Quality matters—steering is safety-critical. $100-400 for adjustable tie rod sets.'
    },
    
    relatedTopics: ['steering-rack', 'toe', 'wheel-alignment', 'bump-steer'],
    relatedUpgradeKeys: ['tie-rod-upgrade', 'bump-steer-kit'],
    status: 'complete'
  },

  {
    slug: 'ball-joint',
    name: 'Ball Joint',
    system: 'suspension-steering',
    
    definition: 'Ball joints are spherical bearings that connect control arms to steering knuckles, allowing rotational movement in multiple planes while transmitting loads. They\'re critical pivot points that enable both suspension travel and steering movement while carrying the vehicle\'s weight.',
    
    howItWorks: 'A ball joint consists of a ball stud housed in a socket with a bearing surface between them. The ball can rotate and pivot within the socket while maintaining a connection. Load-bearing (lower) ball joints carry vehicle weight and see the highest stress. Follower (upper) ball joints primarily maintain geometry. Modern ball joints use polymer or metal bearings and are typically sealed and pre-lubricated.',
    
    whyItMatters: 'Ball joint failure is dangerous—complete failure can cause loss of vehicle control. Even moderate wear causes alignment changes and handling degradation. Ball joints are a common wear item that should be inspected regularly, especially on higher-mileage vehicles or those used on track where loads are higher.',
    
    commonTypes: [
      'Press-fit (stock, requires special tools)',
      'Bolt-in (easier replacement)',
      'Adjustable (can compensate for wear)',
      'Greaseable (extended service life)',
      'Sealed (maintenance-free until replacement)',
      'Heavy-duty (higher load capacity)'
    ],
    
    keySpecs: [
      'Load rating',
      'Stud diameter and taper',
      'Total articulation range',
      'Preload specification',
      'Service type (greaseable or sealed)'
    ],
    
    signs: {
      good: [
        'No play when tested (dry park test)',
        'Boot intact',
        'Smooth articulation',
        'Alignment maintains spec'
      ],
      bad: [
        'Play detected during inspection',
        'Clunking over bumps or when steering',
        'Torn or missing boot',
        'Visible wear on stud or socket',
        'Alignment won\'t hold'
      ]
    },
    
    modPotential: {
      summary: 'Heavy-duty ball joints increase durability for track use; adjustable joints allow alignment correction.',
      gains: 'Extended life under hard use. Additional alignment adjustability on some designs.',
      considerations: 'Replace in pairs (left and right). Consider extended control arms if additional camber is needed. Some applications have ball joint spacers for geometry correction. $50-300 per ball joint.'
    },
    
    relatedTopics: ['control-arm', 'steering-knuckle', 'wheel-alignment', 'double-wishbone'],
    relatedUpgradeKeys: ['ball-joint-upgrade'],
    status: 'complete'
  },

  {
    slug: 'wheel-alignment',
    name: 'Wheel Alignment',
    system: 'suspension-steering',
    
    definition: 'Wheel alignment refers to the adjustment of suspension angles—camber, caster, and toe—to ensure optimal tire contact with the road, proper steering behavior, and even tire wear. Alignment is measured and adjusted using specialized equipment that references the vehicle\'s thrust line.',
    
    howItWorks: 'Alignment adjustments are made through eccentric bolts, adjustable links, cam bolts, or shims that change the relationship between suspension components. Front alignment affects steering feel and front tire wear; rear alignment affects stability and rear tire wear. Four-wheel alignment ensures all wheels work together, with the rear thrust angle properly centered.',
    
    whyItMatters: 'Proper alignment is fundamental to handling and tire life. Misalignment causes uneven tire wear (potentially thousands of dollars in premature tire replacement), pulling to one side, and degraded handling. After any suspension work—especially lowering—alignment must be checked and adjusted. Track-oriented alignments differ from street settings.',
    
    commonTypes: [
      'Two-wheel (front only, basic)',
      'Four-wheel (recommended, full vehicle)',
      'Performance alignment (aggressive settings)',
      'Track alignment (maximum grip, faster tire wear)',
      'Corner balancing (with alignment)'
    ],
    
    keySpecs: [
      'Camber (degrees)',
      'Caster (degrees)',
      'Toe (degrees or fractions of inch)',
      'Thrust angle',
      'Cross-camber/cross-caster'
    ],
    
    signs: {
      good: [
        'Vehicle tracks straight',
        'Centered steering wheel',
        'Even tire wear',
        'Predictable handling'
      ],
      bad: [
        'Pulling to one side',
        'Off-center steering wheel',
        'Uneven tire wear patterns',
        'Wandering or instability',
        'Feathered tire edges'
      ]
    },
    
    modPotential: {
      summary: 'Alignment tuning optimizes handling characteristics and tire wear for specific applications.',
      gains: 'Proper alignment maximizes grip and tire life. Performance alignments improve turn-in and limit handling.',
      considerations: 'Alignment should be done after any suspension modification. More negative camber wears tire inside edges faster. Street vs track settings are different compromises. Expect $80-150 for quality alignment.'
    },
    
    relatedTopics: ['camber', 'caster', 'toe', 'tire-specifications'],
    relatedUpgradeKeys: ['alignment'],
    status: 'complete'
  },

  {
    slug: 'camber',
    name: 'Camber',
    system: 'suspension-steering',
    
    definition: 'Camber is the angle of the wheel relative to vertical when viewed from the front or rear of the car. Negative camber means the top of the tire tilts inward; positive camber means it tilts outward. Camber significantly affects tire grip, especially during cornering.',
    
    howItWorks: 'During cornering, body roll causes the outside tire to lean outward (positive camber gain), reducing contact patch. Running static negative camber compensates, keeping the tire flatter under cornering loads. Too much negative camber reduces straight-line contact patch and causes inner tire wear. The ideal amount balances cornering grip against straight-line traction and tire wear.',
    
    whyItMatters: 'Camber is one of the most important alignment settings for handling. More negative camber improves cornering grip but accelerates inner tire wear and can reduce braking traction. Street cars typically run 0 to -1.5°; track cars often run -2.5° to -4° or more. Finding the right camber for your use is essential to both performance and tire life.',
    
    commonTypes: [
      'Static camber (at rest)',
      'Dynamic camber (during driving)',
      'Camber gain (how camber changes with travel)',
      'Camber curve (camber vs suspension position)'
    ],
    
    keySpecs: [
      'Degrees of camber',
      'Front vs rear camber',
      'Cross-camber (side-to-side difference)',
      'Camber gain rate',
      'Adjustment range available'
    ],
    
    signs: {
      good: [
        'Even tire wear (for street settings)',
        'Good cornering grip',
        'Stable braking',
        'Balanced handling'
      ],
      bad: [
        'Excessive inner tire wear (too much negative)',
        'Poor cornering grip (not enough negative)',
        'Uneven wear side-to-side (cross-camber issue)',
        'Pulling to one side'
      ]
    },
    
    modPotential: {
      summary: 'Camber adjustment enables optimization for street comfort, autocross, or track days.',
      gains: 'More negative camber increases cornering grip. Proper camber extends tire life.',
      considerations: 'Street cars: -0.5° to -1.5°. Autocross: -2° to -3°. Track: -2.5° to -4°+. Camber plates or adjustable arms often needed to achieve desired settings.'
    },
    
    relatedTopics: ['wheel-alignment', 'caster', 'toe', 'contact-patch'],
    relatedUpgradeKeys: ['camber-plates', 'adjustable-arms'],
    status: 'complete'
  },

  {
    slug: 'caster',
    name: 'Caster',
    system: 'suspension-steering',
    
    definition: 'Caster is the angle of the steering axis (the line through the upper and lower ball joints or strut pivot points) relative to vertical when viewed from the side. Positive caster means the steering axis tilts rearward at the top—like a bicycle fork—and is standard on all modern vehicles.',
    
    howItWorks: 'Caster creates a self-centering effect in steering. With positive caster, the tire contact patch trails behind the steering axis pivot point. This causes the steering to naturally return to center after turns—like how a shopping cart wheel trails behind its pivot. More caster increases straight-line stability and high-speed tracking but requires more steering effort.',
    
    whyItMatters: 'Caster affects steering feel, stability, and dynamic camber. More positive caster improves high-speed stability and creates camber gain during steering (the outside wheel gains negative camber when turning). This is beneficial for handling. However, caster is not adjustable on many vehicles, requiring aftermarket components for modification.',
    
    commonTypes: [
      'Factory caster (typically 3-7°)',
      'Increased caster (performance, more stability)',
      'Cross-caster (different side-to-side, for road crown)'
    ],
    
    keySpecs: [
      'Degrees of caster',
      'Cross-caster (side-to-side difference)',
      'Steering axis inclination (related)',
      'Trail (ground contact to pivot distance)'
    ],
    
    signs: {
      good: [
        'Steering returns to center smoothly',
        'Stable straight-line tracking',
        'Consistent steering feel',
        'Even tire wear'
      ],
      bad: [
        'Steering doesn\'t self-center',
        'Wandering at highway speeds',
        'Heavy or light steering (asymmetric caster)',
        'Pulling to one side'
      ]
    },
    
    modPotential: {
      summary: 'Increased caster improves stability and provides dynamic camber gain during cornering.',
      gains: 'Better high-speed stability. More negative camber when steering. Improved steering feel.',
      considerations: 'Caster adjustment often requires offset bushings, adjustable control arms, or caster/camber plates. Affects required steering effort. Check specifications for your application.'
    },
    
    relatedTopics: ['wheel-alignment', 'camber', 'steering-rack', 'macpherson-strut'],
    relatedUpgradeKeys: ['caster-adjustment', 'camber-plates'],
    status: 'complete'
  },

  {
    slug: 'toe',
    name: 'Toe',
    system: 'suspension-steering',
    
    definition: 'Toe describes whether the front edges of the tires point inward (toe-in) or outward (toe-out) when viewed from above. It\'s expressed in degrees or fractions of an inch (difference between front and rear of tires). Toe has the most significant effect on tire wear of all alignment angles.',
    
    howItWorks: 'Toe-in provides straight-line stability but causes the tires to scrub slightly as they try to turn inward. Toe-out makes the car more eager to turn in but can cause darting or instability. Front toe affects steering response and stability; rear toe affects stability and rotation. Even small toe errors cause rapid tire wear because the tires are constantly scrubbing sideways.',
    
    whyItMatters: 'Toe is the most critical alignment setting for tire wear. Just 1/8" of toe misalignment can significantly accelerate tire wear. For handling, toe settings tune the balance between stability and responsiveness. Front toe affects turn-in eagerness; rear toe affects oversteer/understeer balance.',
    
    commonTypes: [
      'Toe-in (stable, common for rear)',
      'Toe-out (responsive turn-in, sometimes front)',
      'Zero toe (neutral, minimum tire wear)',
      'Total toe (sum of both wheels)',
      'Individual toe (per wheel)'
    ],
    
    keySpecs: [
      'Degrees or inches of toe',
      'Front total toe',
      'Rear total toe',
      'Individual wheel toe',
      'Toe curve (change with suspension travel)'
    ],
    
    signs: {
      good: [
        'Even tire wear across tread',
        'Straight tracking',
        'Appropriate turn-in response',
        'Stable rear end'
      ],
      bad: [
        'Feathered tire wear (sawtooth pattern)',
        'Rapid tire wear',
        'Darting or wandering',
        'Rear-end instability',
        'Steering wheel off-center'
      ]
    },
    
    modPotential: {
      summary: 'Toe adjustment tunes the balance between stability and responsiveness.',
      gains: 'Slight front toe-out can improve turn-in. Rear toe-in improves stability.',
      considerations: 'Toe is adjusted via tie rods (front) or eccentric bolts/adjustable links (rear). Check alignment after any suspension work. Toe is the most sensitive setting—small changes make big differences.'
    },
    
    relatedTopics: ['wheel-alignment', 'camber', 'tie-rod', 'tire-specifications'],
    relatedUpgradeKeys: ['alignment', 'rear-toe-arms'],
    status: 'complete'
  },

  {
    slug: 'contact-patch',
    name: 'Contact Patch',
    system: 'suspension-steering',
    
    definition: 'The contact patch is the area of the tire that\'s in contact with the road surface at any given moment. It\'s roughly the size of your hand for each tire, yet this small area must transmit all acceleration, braking, and cornering forces. Maximizing and optimizing the contact patch is central to chassis setup.',
    
    howItWorks: 'The contact patch is determined by tire load, inflation pressure, and tire construction. Higher load or lower pressure spreads the contact patch larger but thinner. The shape matters too—a wide, short patch has different characteristics than a narrow, long one. Camber affects how the contact patch loads during cornering, while toe affects scrub across the patch.',
    
    whyItMatters: 'All of your car\'s grip comes through four contact patches. Suspension setup, alignment, and tire selection all aim to optimize these contact patches under all conditions. Understanding that you only have this small area connecting you to the road emphasizes why small changes in alignment or pressure can have significant effects on handling.',
    
    keySpecs: [
      'Contact patch size (square inches)',
      'Contact patch shape',
      'Pressure distribution across patch',
      'Load sensitivity (grip vs load curve)',
      'Temperature distribution'
    ],
    
    signs: {
      good: [
        'Even tire wear across tread',
        'Even tire temperatures',
        'Maximum available grip',
        'Consistent behavior'
      ],
      bad: [
        'Uneven tire wear (patch issue)',
        'Uneven tire temperatures (measured with pyrometer)',
        'Grip variation across tire width',
        'Edge wear (camber/pressure issue)'
      ]
    },
    
    relatedTopics: ['tire-specifications', 'camber', 'wheel-alignment', 'spring-rate'],
    status: 'complete'
  },

  {
    slug: 'steering-rack',
    name: 'Steering Rack',
    system: 'suspension-steering',
    
    definition: 'The steering rack (rack and pinion) converts the rotational motion of the steering wheel into linear motion that turns the front wheels. The pinion gear on the steering column meshes with a toothed rack, which is connected to the tie rods. Most modern vehicles use rack and pinion steering for its precision and efficiency.',
    
    howItWorks: 'When you turn the steering wheel, the pinion gear rotates, moving the rack laterally. Tie rods attached to each end of the rack transmit this motion to the steering knuckles. The steering ratio (degrees of wheel rotation per degree of tire turn) is determined by the pinion and rack tooth sizes. Power steering—hydraulic or electric—reduces the effort required to move the rack.',
    
    whyItMatters: 'The steering rack defines steering feel, ratio, and precision. Stock racks are designed for broad appeal; performance racks offer quicker ratios and better feel. Worn racks develop play that makes steering imprecise. For serious track use, steering rack condition and setup significantly affect driver confidence and lap times.',
    
    commonTypes: [
      'Manual (no power assist)',
      'Hydraulic power (traditional power steering)',
      'Electric power (EPAS, modern standard)',
      'Variable ratio (different ratio through range)',
      'Quick-ratio (sport applications)'
    ],
    
    keySpecs: [
      'Steering ratio (overall degrees lock-to-lock)',
      'Rack travel (total lateral movement)',
      'Power assist type',
      'Number of turns lock-to-lock',
      'Mounting style'
    ],
    
    signs: {
      good: [
        'Precise, on-center feel',
        'No play in steering',
        'Smooth operation throughout range',
        'Proper power assist feel'
      ],
      bad: [
        'Play/deadband at center',
        'Notchy feeling when turning',
        'Power steering fluid leak',
        'Unusual noise when turning',
        'Binding at full lock'
      ]
    },
    
    modPotential: {
      summary: 'Quick-ratio racks or rack spacers can improve steering response and feel.',
      gains: 'Quicker steering response. Less steering wheel rotation for same tire angle.',
      considerations: 'Quick racks require more steering effort. Rack spacers can correct bump steer on lowered cars. Power steering modifications may be needed with significant changes. $500-2,000 for rack replacements.'
    },
    
    relatedTopics: ['tie-rod', 'ackermann-angle', 'wheel-alignment', 'power-steering'],
    relatedUpgradeKeys: ['quick-ratio-rack', 'steering-upgrade'],
    status: 'complete'
  },

  {
    slug: 'roll-center',
    name: 'Roll Center',
    system: 'suspension-steering',
    
    definition: 'The roll center is the theoretical point in space around which the sprung mass (body) rolls relative to the unsprung mass (wheels/suspension). It\'s determined by suspension geometry and significantly affects weight transfer characteristics during cornering. Each axle has its own roll center.',
    
    howItWorks: 'Roll center height is found by drawing lines through the suspension pivot points (instant centers) to where they intersect the vehicle centerline. When the body rolls during cornering, it rotates around this point. A higher roll center produces more jacking force (lifting the chassis) but less body roll. Roll center migration—how the roll center moves during suspension travel—affects handling consistency.',
    
    whyItMatters: 'Roll center height determines how cornering forces transfer through the suspension. Lowering a car typically lowers the roll center, which can increase body roll and change handling characteristics. Roll center correction—through adjustable arms or geometry changes—is often necessary on significantly lowered vehicles to restore proper handling.',
    
    commonTypes: [
      'Front roll center',
      'Rear roll center',
      'Roll axis (line connecting front and rear)',
      'Geometric roll center (from suspension geometry)',
      'Force-based roll center (more complex analysis)'
    ],
    
    keySpecs: [
      'Roll center height (inches from ground)',
      'Roll center lateral location',
      'Roll center migration rate',
      'Roll axis inclination',
      'Relationship to center of gravity'
    ],
    
    signs: {
      good: [
        'Controlled body roll',
        'Consistent handling feel',
        'Predictable weight transfer',
        'Good tire loading during corners'
      ],
      bad: [
        'Excessive body roll (roll center too low)',
        'Harsh over bumps in corners (too much jacking)',
        'Unpredictable handling (excessive migration)',
        'Inside tire lifting in corners'
      ]
    },
    
    modPotential: {
      summary: 'Roll center adjustment restores proper geometry on lowered vehicles and tunes handling characteristics.',
      gains: 'Restored handling on lowered cars. Tunable weight transfer characteristics.',
      considerations: 'Roll center adjusters (ball joint spacers, adjustable arms) add cost and complexity. Changes affect overall handling balance. Professional setup recommended. $100-500 for roll center correction kits.'
    },
    
    relatedTopics: ['double-wishbone', 'control-arm', 'spring-rate', 'sway-bar'],
    relatedUpgradeKeys: ['roll-center-adjusters'],
    status: 'complete'
  },

  {
    slug: 'ackermann-angle',
    name: 'Ackermann Angle',
    system: 'suspension-steering',
    
    definition: 'Ackermann geometry describes the relationship between the steering angles of the inner and outer front wheels during a turn. Pure Ackermann has the inner wheel at a greater angle than the outer (because it travels a tighter radius). Modern cars often use modified or anti-Ackermann for various handling characteristics.',
    
    howItWorks: 'During a turn, the inner wheel needs to travel a tighter arc than the outer wheel. Pure Ackermann geometry angles the inner wheel more, allowing both tires to roll without scrubbing. However, at high speeds or in racing, tire slip angles become more important than geometric angles. Some race cars use parallel steering (no Ackermann) or even anti-Ackermann for specific handling traits.',
    
    whyItMatters: 'Ackermann affects tire wear, low-speed maneuverability, and high-speed handling. Too much Ackermann causes the inner tire to scrub at high speeds; too little causes low-speed scrubbing. For most street driving, factory Ackermann is appropriate. Race applications sometimes modify Ackermann for specific track characteristics.',
    
    commonTypes: [
      'Full Ackermann (geometric ideal)',
      'Parallel steering (zero Ackermann)',
      'Anti-Ackermann (outer turns more)',
      'Modified Ackermann (compromise)'
    ],
    
    keySpecs: [
      'Ackermann percentage',
      'Steering arm angle',
      'Toe-out on turns (TOOT)',
      'Inner vs outer wheel angle at full lock'
    ],
    
    signs: {
      good: [
        'Even tire wear in low-speed corners',
        'Good low-speed maneuverability',
        'Consistent steering feel through range'
      ],
      bad: [
        'Inner tire scrubbing at speed',
        'Outer tire scrubbing at low speed',
        'Inconsistent turn-in feel',
        'Unusual tire wear patterns'
      ]
    },
    
    modPotential: {
      summary: 'Ackermann modifications are primarily for racing applications and are achieved through steering arm changes.',
      gains: 'Optimized steering for specific racing applications.',
      considerations: 'Most street cars don\'t benefit from Ackermann changes. Race applications may use modified steering arms or knuckles. Changes require careful testing and tuning.'
    },
    
    relatedTopics: ['steering-rack', 'tie-rod', 'wheel-alignment', 'toe'],
    status: 'complete'
  },

  {
    slug: 'tire-specifications',
    name: 'Tire Specifications',
    system: 'suspension-steering',
    
    definition: 'Tire specifications describe tire dimensions, load capacity, speed rating, and construction details encoded in standardized markings. Understanding tire specs is essential for proper tire selection, ensuring compatibility with your vehicle and meeting performance requirements.',
    
    howItWorks: 'A tire marked "255/40R18 99Y" breaks down as: 255mm tread width, 40% aspect ratio (sidewall height as percentage of width = 102mm), R for radial construction, 18-inch wheel diameter, 99 load index (1,709 lbs), and Y speed rating (186 mph). Additional markings indicate treadwear rating, traction grade, temperature grade, DOT date codes, and more.',
    
    whyItMatters: 'Proper tire selection dramatically affects handling, comfort, and safety. Width affects grip and steering response; aspect ratio affects sidewall stiffness and ride quality; load and speed ratings must meet vehicle requirements. For modifications, tire selection is often the single biggest handling change you can make.',
    
    commonTypes: [
      'All-season (compromise, common OEM)',
      'Summer/performance (maximum grip, limited temp range)',
      'Winter (cold weather traction)',
      'All-terrain (truck/SUV off-road capability)',
      'Track/competition (maximum grip, limited tread life)'
    ],
    
    keySpecs: [
      'Section width (mm)',
      'Aspect ratio (%)',
      'Wheel diameter (inches)',
      'Load index',
      'Speed rating',
      'UTQG ratings (treadwear, traction, temperature)'
    ],
    
    signs: {
      good: [
        'Even tread wear',
        'Proper inflation',
        'Adequate tread depth',
        'No cracking or damage',
        'Current DOT date'
      ],
      bad: [
        'Uneven wear patterns',
        'Low tread depth (<3/32")',
        'Sidewall cracking or bulges',
        'Old tires (>6 years)',
        'Incorrect size for application'
      ]
    },
    
    modPotential: {
      summary: 'Tire upgrades are often the most significant handling modification available.',
      gains: 'Performance tires can improve grip by 20-40% over all-seasons. Wider tires increase contact patch.',
      considerations: 'Match tire to intended use. Summer tires are dangerous below 45°F. Wider isn\'t always better (hydroplaning, weight). Quality matters more than brand. $100-400+ per tire for performance options.'
    },
    
    relatedTopics: ['contact-patch', 'wheel-alignment', 'camber', 'suspension-tuning'],
    relatedUpgradeKeys: ['performance-tires', 'wheel-tire-package'],
    status: 'complete'
  },

  {
    slug: 'bushings',
    name: 'Bushings',
    system: 'suspension-steering',
    
    definition: 'Bushings are flexible mounts that connect suspension components to the chassis or to each other, allowing controlled movement while absorbing vibration and road harshness. They\'re typically made of rubber, polyurethane, or in racing applications, replaced with spherical bearings (heim joints).',
    
    howItWorks: 'Rubber bushings flex to allow suspension movement while damping vibrations before they reach the chassis. The rubber also accommodates minor misalignments. However, this compliance means the suspension isn\'t perfectly rigid—under load, bushings deflect, causing small geometry changes. Stiffer bushings (polyurethane) reduce deflection but transmit more NVH.',
    
    whyItMatters: 'Bushing condition dramatically affects handling precision. Worn rubber bushings allow excessive movement, making the car feel vague. Stiffer aftermarket bushings improve response and consistency but increase harshness. For track use, spherical bearings eliminate deflection entirely but are too harsh for street use.',
    
    commonTypes: [
      'Rubber (stock, soft, deteriorates)',
      'Polyurethane (stiffer, longer lasting)',
      'Delrin/solid (very stiff, NVH)',
      'Spherical bearing/heim (zero deflection, racing)',
      'Hydraulic-filled (some luxury cars)',
      'Voided/hollow (controlled compliance)'
    ],
    
    keySpecs: [
      'Material and durometer (hardness)',
      'Deflection rate',
      'NVH transmission',
      'Service life',
      'Temperature range'
    ],
    
    signs: {
      good: [
        'Precise handling feel',
        'Quiet operation',
        'Alignment holds spec',
        'No visible deterioration'
      ],
      bad: [
        'Clunking over bumps',
        'Vague handling feel',
        'Visible cracking or deterioration',
        'Alignment won\'t hold',
        'Vibration through chassis'
      ]
    },
    
    modPotential: {
      summary: 'Bushing upgrades improve handling precision with trade-offs in NVH.',
      gains: 'Sharper steering response. More consistent alignment. Better feedback.',
      considerations: 'Polyurethane is a good street/track compromise. Require lubrication (polyurethane). Solid bushings are harsh for street use. Full sets can be expensive. $200-800 for complete bushing kits.'
    },
    
    relatedTopics: ['control-arm', 'sway-bar', 'end-links', 'subframe'],
    relatedUpgradeKeys: ['polyurethane-bushings', 'spherical-bearings'],
    status: 'complete'
  },

  {
    slug: 'independent-rear-suspension',
    name: 'Independent Rear Suspension (IRS)',
    system: 'suspension-steering',
    
    definition: 'Independent rear suspension (IRS) allows each rear wheel to move vertically independent of the other, maintaining better contact with the road over uneven surfaces. This contrasts with solid rear axle designs where both wheels are connected by a single rigid axle.',
    
    howItWorks: 'IRS uses control arms, links, or a trailing arm design to locate each wheel independently. Springs and dampers mount to each wheel carrier. When one wheel hits a bump, only that wheel responds—the other is unaffected. This isolation improves ride quality and handling, especially on uneven surfaces. However, IRS is more complex and can have less predictable handling characteristics under power.',
    
    whyItMatters: 'IRS provides better ride quality and generally better handling than solid axles, which is why it\'s standard on most modern cars. However, IRS can be less predictable during hard acceleration (the axle housing can move, affecting geometry) and is more expensive to upgrade. Many enthusiasts of muscle cars and trucks prefer solid axles for their simplicity and predictable power delivery.',
    
    commonTypes: [
      'Multi-link IRS (most common modern)',
      'Semi-trailing arm (older BMW, etc.)',
      'Double wishbone rear',
      'MacPherson strut rear (some FWD cars)',
      'Twist-beam (semi-independent, budget cars)'
    ],
    
    keySpecs: [
      'Suspension type',
      'Number of links/arms',
      'Toe and camber curves',
      'Anti-squat geometry',
      'Subframe mounting'
    ],
    
    signs: {
      good: [
        'Composed over bumps',
        'Stable handling',
        'Good traction under power',
        'Even tire wear'
      ],
      bad: [
        'Wheel hop under power',
        'Instability over bumps',
        'Bushing clunks',
        'Toe changes under load',
        'Premature inner tire wear'
      ]
    },
    
    modPotential: {
      summary: 'IRS systems can be upgraded with adjustable links, solid bushings, and subframe reinforcement.',
      gains: 'Adjustable arms enable proper alignment. Solid bushings improve consistency under power.',
      considerations: 'Subframe bushings affect both comfort and precision. Solid mounts can transmit axle whine to cabin. Some convert to solid axle for drag racing simplicity. $500-3,000 for comprehensive IRS upgrades.'
    },
    
    relatedTopics: ['multi-link', 'solid-rear-axle', 'control-arm', 'bushings'],
    relatedUpgradeKeys: ['irs-upgrade', 'subframe-bushing'],
    status: 'complete'
  },

  {
    slug: 'solid-rear-axle',
    name: 'Solid Rear Axle',
    system: 'suspension-steering',
    
    definition: 'A solid rear axle (SRA, also called live axle or beam axle) connects both rear wheels with a rigid housing that also contains the differential. When one wheel moves, it affects the other. This simple, strong design is still used in trucks, muscle cars, and some sports cars for its durability and predictable handling under power.',
    
    howItWorks: 'The axle housing is located by control arms or leaf springs, with the differential centered in the housing and axle shafts extending to each wheel. Springs and shocks mount to the housing. When one wheel hits a bump, the entire axle tips, affecting the other wheel. However, under acceleration, the axle remains rigidly positioned, providing consistent geometry and power delivery.',
    
    whyItMatters: 'Solid axles are preferred for many performance applications despite their theoretical disadvantages. They\'re stronger, simpler, and provide more predictable behavior under hard acceleration. For drag racing and many forms of motorsport, solid axles are standard. The Corvette notably switched back to an IRS design but many owners swap solid axles for drag racing.',
    
    commonTypes: [
      'Ford 8.8/9-inch',
      'GM 10/12-bolt',
      'Dana 44/60',
      'Mopar 8.75',
      'Four-link (modern location)',
      'Leaf spring (traditional)',
      'Watts link (lateral location)'
    ],
    
    keySpecs: [
      'Axle type and strength',
      'Gear ratio',
      'Location method (4-link, leaf, etc.)',
      'Anti-squat geometry',
      'Lateral location method'
    ],
    
    signs: {
      good: [
        'Consistent power delivery',
        'Strong and durable',
        'Predictable handling under power',
        'Simple maintenance'
      ],
      bad: [
        'Wheel hop',
        'Axle wrap (spring wrap-up)',
        'Harsh ride over bumps',
        'Lateral movement (worn bushings)',
        'Pinion angle issues'
      ]
    },
    
    modPotential: {
      summary: 'Solid axles can be upgraded with traction systems, better gears, and improved location devices.',
      gains: 'Four-link or ladder bar setups improve traction. Limited slip differentials eliminate one-wheel-peel. Axle upgrades handle more power.',
      considerations: 'Traction devices are essential for high-power applications. Pinion angle must be set correctly. Panhard or Watts link improves lateral location. $500-5,000+ for comprehensive SRA upgrades.'
    },
    
    relatedTopics: ['panhard-bar', 'differential', 'axle', 'independent-rear-suspension'],
    relatedUpgradeKeys: ['rear-suspension-upgrade', 'traction-bars'],
    status: 'complete'
  },

  {
    slug: 'sway-bar',
    name: 'Sway Bar / Anti-Roll Bar',
    system: 'suspension-steering',
    
    definition: 'A sway bar (stabilizer bar or anti-roll bar) is a torsion spring that connects the left and right sides of the suspension. It resists body roll during cornering by transferring force from the more compressed (outside) wheel to the less compressed (inside) wheel, keeping the car flatter through turns.',
    
    howItWorks: 'When the car corners, the outside suspension compresses while the inside extends. The sway bar, connected to both sides, resists this differential movement by twisting. This resistance transfers load from the inside wheel to the outside, reducing body roll. Thicker bars are stiffer and reduce roll more but can reduce independent wheel compliance over bumps.',
    
    whyItMatters: 'Sway bars are one of the most effective and affordable handling upgrades. They reduce body roll without significantly affecting ride quality over bumps (since they only act during differential suspension movement). The front-to-rear sway bar ratio also affects handling balance—relatively stiffer front bar promotes understeer; stiffer rear bar promotes oversteer.',
    
    commonTypes: [
      'Solid (most common)',
      'Hollow (lighter, similar stiffness)',
      'Adjustable (multiple stiffness settings)',
      'Active (electronically controlled)',
      'Front vs rear bars'
    ],
    
    keySpecs: [
      'Bar diameter (mm)',
      'Stiffness rate (Nm/degree or lbs/in)',
      'Adjustment positions (if adjustable)',
      'Mount type (chassis, end link)',
      'Material (steel, hollow, aluminum)'
    ],
    
    signs: {
      good: [
        'Controlled body roll',
        'Good transient response',
        'Balanced handling',
        'No binding or clunking'
      ],
      bad: [
        'Excessive body roll',
        'Clunking over bumps (worn end links)',
        'Squeaking (dry bushings)',
        'Handling imbalance',
        'Broken or bent bar'
      ]
    },
    
    modPotential: {
      summary: 'Upgraded sway bars are one of the best bang-for-buck handling modifications.',
      gains: 'Dramatically reduced body roll. Improved transient response. Tunable handling balance with adjustable bars.',
      considerations: 'Match front and rear for desired balance. Too stiff can hurt grip on bumpy surfaces. End links often need upgrading too. $150-600 per bar for quality options.'
    },
    
    relatedTopics: ['end-links', 'spring-rate', 'roll-center', 'bushings'],
    relatedUpgradeKeys: ['sway-bar-upgrade', 'anti-roll-bar'],
    status: 'complete'
  },

  {
    slug: 'panhard-bar',
    name: 'Panhard Bar',
    system: 'suspension-steering',
    
    definition: 'A Panhard bar (or track bar) is a lateral link that locates a solid rear axle side-to-side relative to the chassis. One end attaches to the axle housing; the other end attaches to the chassis. It prevents the axle from shifting left or right under cornering loads.',
    
    howItWorks: 'During cornering, forces try to push the rear axle laterally. The Panhard bar resists this movement by acting as a rigid link. However, because it\'s a fixed-length bar pivoting on both ends, the axle describes an arc as it moves vertically. This causes slight lateral movement during suspension travel—the axle shifts left or right as it compresses or extends.',
    
    whyItMatters: 'On solid-axle vehicles, the Panhard bar is critical to rear end stability. A well-designed Panhard setup minimizes lateral movement across the suspension travel range. Adjustable Panhard bars allow centering the axle (important after lowering) and fine-tuning rear end geometry for specific handling characteristics.',
    
    commonTypes: [
      'Fixed length (stock)',
      'Adjustable (for ride height changes)',
      'Double-adjustable (both ends)',
      'On-car adjustable (quick changes)',
      'Watts link (superior to Panhard)'
    ],
    
    keySpecs: [
      'Bar length',
      'Mount height (chassis and axle)',
      'Adjustment range',
      'Bushing type',
      'Material and construction'
    ],
    
    signs: {
      good: [
        'Axle centered in wheel wells',
        'Stable rear end in corners',
        'No lateral shift over bumps',
        'Quiet operation'
      ],
      bad: [
        'Axle off-center',
        'Rear end feeling loose in corners',
        'Clunking over bumps',
        'Binding during suspension travel',
        'Worn bushings'
      ]
    },
    
    modPotential: {
      summary: 'Adjustable Panhard bars allow proper axle centering and geometry optimization on modified vehicles.',
      gains: 'Properly centered axle improves handling and tire wear. Adjustable height tunes roll center and handling.',
      considerations: 'Must be adjusted when ride height changes. Watts link is superior but more complex/expensive. Rod ends reduce bind but increase NVH. $100-500 for quality adjustable Panhard bars.'
    },
    
    relatedTopics: ['solid-rear-axle', 'roll-center', 'control-arm', 'watts-link'],
    relatedUpgradeKeys: ['panhard-bar', 'watts-link'],
    status: 'complete'
  },

  {
    slug: 'end-links',
    name: 'End Links',
    system: 'suspension-steering',
    
    definition: 'End links connect the sway bar to the suspension (typically the control arm, strut, or knuckle). They must allow the sway bar to pivot as the suspension moves while transmitting the bar\'s anti-roll forces. Stock end links often use rubber bushings; performance versions use spherical bearings or polyurethane.',
    
    howItWorks: 'The sway bar itself is mounted to the chassis with bushings that allow it to rotate. End links connect each end of the bar to the suspension at each wheel. As the suspension moves, the end links allow the sway bar to twist while transferring force. The end link\'s length determines sway bar preload, and mismatched lengths can cause handling imbalances.',
    
    whyItMatters: 'Worn or incorrect end links are a common source of suspension noise and reduced sway bar effectiveness. When upgrading sway bars or lowering a car, end link length often needs adjustment—too short and they\'re preloaded (affecting ride height), too long and they\'re loose (reducing sway bar effectiveness and causing clunking).',
    
    commonTypes: [
      'Rubber bushing (stock, deteriorates)',
      'Polyurethane bushing (stiffer, longer lasting)',
      'Spherical bearing (performance, NVH)',
      'Adjustable length (for different ride heights)',
      'Heavy-duty (thicker for stiffer bars)'
    ],
    
    keySpecs: [
      'Length (stud center to center)',
      'Bushing/bearing type',
      'Stud thread size',
      'Load rating',
      'Adjustment range (if adjustable)'
    ],
    
    signs: {
      good: [
        'Quiet operation',
        'Proper sway bar function',
        'No play in bushings',
        'Correct preload/length'
      ],
      bad: [
        'Clunking over bumps',
        'Rattling on uneven surfaces',
        'Visible bushing deterioration',
        'Bent or damaged stud',
        'Sway bar feels disconnected'
      ]
    },
    
    modPotential: {
      summary: 'Upgraded end links improve sway bar function and eliminate common clunking noises.',
      gains: 'Spherical end links provide direct connection. Adjustable links allow proper setup at any ride height.',
      considerations: 'Spherical end links transmit more NVH. Replace when upgrading sway bars. Must be correct length for ride height. $50-200 for quality end link sets.'
    },
    
    relatedTopics: ['sway-bar', 'bushings', 'control-arm', 'coilover'],
    relatedUpgradeKeys: ['end-links', 'sway-bar-upgrade'],
    status: 'complete'
  }
];

export default suspensionTopics;

