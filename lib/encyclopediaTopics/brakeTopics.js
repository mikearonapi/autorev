/**
 * BRAKES SYSTEM TOPICS - Complete Encyclopedia Content
 * 
 * 19 comprehensive topics covering brake systems and components.
 * All topics have full educational content - no stubs.
 * 
 * @module encyclopediaTopics/brakes
 */

export const brakeTopics = [
  {
    slug: 'brake-master-cylinder',
    name: 'Brake Master Cylinder',
    system: 'brakes',
    
    definition: 'The brake master cylinder converts the mechanical force from the brake pedal into hydraulic pressure that actuates the brake calipers or wheel cylinders. It\'s the heart of the hydraulic brake system, typically containing two separate circuits for safety redundancy.',
    
    howItWorks: 'When you press the brake pedal, a pushrod moves pistons inside the master cylinder, compressing brake fluid and creating hydraulic pressure. Modern tandem master cylinders have two pistons creating two independent hydraulic circuits—if one circuit fails, the other still provides braking. The brake fluid reservoir above maintains fluid level as pads wear and compensates for temperature changes.',
    
    whyItMatters: 'The master cylinder determines pedal feel and the hydraulic ratio of the brake system. A failing master cylinder causes a soft or sinking pedal and is a safety concern. For performance applications, master cylinder bore size affects pedal feel—larger bores require less pedal travel but more force, while smaller bores require more travel but less force.',
    
    commonTypes: [
      'Tandem/dual circuit (standard safety design)',
      'Single circuit (older vehicles)',
      'Remote reservoir (racing)',
      'Adjustable bias (dual master cylinders)',
      'Brake booster integrated'
    ],
    
    keySpecs: [
      'Bore diameter (inches/mm)',
      'Stroke length',
      'Reservoir capacity',
      'Port configuration',
      'Mounting style'
    ],
    
    signs: {
      good: [
        'Firm, consistent pedal',
        'No pedal sinking when held',
        'Proper fluid level',
        'No external leaks'
      ],
      bad: [
        'Spongy or sinking pedal',
        'Brake warning light',
        'Fluid leaking around cylinder',
        'Pedal goes to floor',
        'Low fluid with no pad wear'
      ]
    },
    
    modPotential: {
      summary: 'Master cylinder upgrades can improve pedal feel and are required for some big brake kit installations.',
      gains: 'Optimized pedal feel for driving style. Proper hydraulic ratio for upgraded brakes.',
      considerations: 'Must match bore size to caliper piston area. Larger bore = firmer pedal, less travel. Smaller bore = more travel, easier modulation. $100-400 for quality master cylinders.'
    },
    
    relatedTopics: ['brake-fluid', 'brake-caliper', 'abs', 'brake-lines'],
    relatedUpgradeKeys: ['master-cylinder-upgrade'],
    status: 'complete'
  },

  {
    slug: 'abs',
    name: 'ABS (Anti-Lock Braking System)',
    system: 'brakes',
    
    definition: 'Anti-lock Braking System (ABS) prevents wheel lockup during hard braking by rapidly modulating brake pressure to individual wheels. This maintains steering control during emergency stops and often shortens stopping distances on most surfaces.',
    
    howItWorks: 'Wheel speed sensors monitor each wheel\'s rotation. When the ABS computer detects a wheel decelerating faster than possible without locking (indicating impending lockup), it reduces brake pressure to that wheel via the hydraulic modulator. Once the wheel regains speed, pressure is reapplied. This cycle can repeat 15+ times per second, keeping the wheel at the optimum slip ratio for maximum braking.',
    
    whyItMatters: 'ABS allows drivers to brake hard while maintaining steering control—critical for accident avoidance. Without ABS, locked wheels lose steering response. For performance driving, ABS allows threshold braking without the skill required to manually modulate at the edge of lockup. Modern ABS systems are sophisticated and rarely a limitation for street driving.',
    
    commonTypes: [
      'Four-channel (independent control per wheel)',
      'Three-channel (rear wheels share)',
      'Integral ABS (combined with brake booster)',
      'Non-integral ABS (separate modulator)',
      'Performance ABS calibration'
    ],
    
    keySpecs: [
      'Number of channels',
      'Cycling rate (Hz)',
      'Intervention threshold',
      'Integration with stability control',
      'Sensor type and resolution'
    ],
    
    signs: {
      good: [
        'ABS activates appropriately',
        'Maintains steering during hard braking',
        'No warning lights',
        'Smooth modulation'
      ],
      bad: [
        'ABS warning light on',
        'Premature activation',
        'Harsh pulsation',
        'Doesn\'t activate when expected',
        'Wheel lockup despite ABS'
      ]
    },
    
    modPotential: {
      summary: 'ABS systems can sometimes be recalibrated for less intervention during track use.',
      gains: 'Some performance ECU tunes raise ABS intervention thresholds. Track-oriented calibrations allow more slip.',
      considerations: 'Completely disabling ABS is not recommended for most drivers. Modern ABS rarely limits experienced drivers. Some track-focused cars offer ABS-off modes. Keep ABS for street driving.'
    },
    
    relatedTopics: ['motorsport-abs', 'brake-master-cylinder', 'brake-rotor', 'stability-control'],
    relatedUpgradeKeys: ['abs-delete', 'performance-abs-tune'],
    status: 'complete'
  },

  {
    slug: 'motorsport-abs',
    name: 'Motorsport ABS',
    system: 'brakes',
    
    definition: 'Motorsport ABS systems are high-performance anti-lock systems designed specifically for racing applications. Unlike road car ABS that prioritizes safety and stability, motorsport ABS is optimized for minimum stopping distance and can be extensively calibrated for different conditions.',
    
    howItWorks: 'Motorsport ABS uses higher-resolution wheel speed sensors, faster processors, and more sophisticated algorithms than road car systems. Parameters like slip ratio target, intervention speed, release rate, and pressure build rate can all be adjusted. Some systems offer different calibrations per corner or integrate with data logging for analysis. Cycling rates can exceed 20 Hz.',
    
    whyItMatters: 'In professional racing, every tenth of a second matters. Motorsport ABS can reduce braking distances by keeping tires at their optimal slip ratio more consistently than even expert human drivers. It also reduces driver fatigue by eliminating the need for precise threshold braking. GT racing, rally, and many other series now allow ABS.',
    
    commonTypes: [
      'Bosch M4 (common GT racing)',
      'MoTeC M1 series (high-end)',
      'Customer racing ABS (BMW, Porsche)',
      'Adjustable intervention levels',
      'Data-logging integrated'
    ],
    
    keySpecs: [
      'Cycling frequency',
      'Adjustment parameters',
      'Sensor resolution',
      'Integration with ECU/data',
      'Calibration options'
    ],
    
    signs: {
      good: [
        'Consistent braking performance',
        'Minimal lockup events',
        'Driver confidence under braking',
        'Fast cycling with minimal pulsation'
      ],
      bad: [
        'Inconsistent intervention',
        'Poor calibration for conditions',
        'Sensor failures',
        'Integration issues with other systems'
      ]
    },
    
    modPotential: {
      summary: 'Motorsport ABS systems are typically only practical for dedicated race cars.',
      gains: 'Optimized braking performance. Extensive adjustability. Integrated data logging.',
      considerations: 'Very expensive ($5,000-20,000+). Requires professional installation and calibration. Not street-legal. Only makes sense for serious competition.'
    },
    
    relatedTopics: ['abs', 'brake-caliper', 'brake-rotor', 'data-logging'],
    relatedUpgradeKeys: ['motorsport-abs'],
    status: 'complete'
  },

  {
    slug: 'brake-rotor',
    name: 'Brake Rotor',
    system: 'brakes',
    
    definition: 'Brake rotors (or discs) are the rotating components that the brake pads clamp against to slow the vehicle. They convert kinetic energy into heat through friction and must dissipate this heat effectively to maintain braking performance. Rotor design significantly affects braking feel and fade resistance.',
    
    howItWorks: 'When brake pads squeeze the rotor, friction converts motion into heat. The rotor absorbs this heat and dissipates it to the air. Vented rotors have internal vanes that pump air through the rotor for improved cooling. The rotor\'s thermal mass (size and material) determines how much heat it can absorb before reaching temperatures where performance degrades.',
    
    whyItMatters: 'Rotor size directly affects braking torque—larger rotors provide more leverage. Rotor design affects heat capacity and cooling. For track use, rotors must handle enormous heat loads without warping or cracking. Stock rotors are often the weak point on performance cars used on track, making upgraded rotors a common modification.',
    
    commonTypes: [
      'Solid (non-vented, rear rotors on many cars)',
      'Vented (internal cooling vanes)',
      'Drilled (holes for gas/water venting)',
      'Slotted (grooves for pad refreshing)',
      'Drilled and slotted (combination)',
      'Curved vane vs straight vane (directional vs non)'
    ],
    
    keySpecs: [
      'Diameter (mm)',
      'Thickness (mm)',
      'Vane design',
      'Material composition',
      'Weight',
      'Minimum thickness spec'
    ],
    
    signs: {
      good: [
        'Smooth, consistent surface',
        'Adequate thickness',
        'No cracks or hot spots',
        'Even wear pattern'
      ],
      bad: [
        'Pedal pulsation (warped rotor)',
        'Visible cracks',
        'Blue discoloration (overheating)',
        'Deep grooves or scoring',
        'Below minimum thickness'
      ]
    },
    
    modPotential: {
      summary: 'Upgraded rotors improve heat capacity and often reduce weight for better performance.',
      gains: 'Better heat management. Reduced fade. Often lighter than stock. Better pad bite.',
      considerations: 'Match rotor to pad compound. Slotted rotors may wear pads faster. Drilled rotors can crack under track use. Quality varies significantly. $100-500+ per rotor depending on size and design.'
    },
    
    relatedTopics: ['brake-pad', 'brake-caliper', 'brake-fade', 'two-piece-rotor'],
    relatedUpgradeKeys: ['brake-rotors', 'big-brake-kit'],
    status: 'complete'
  },

  {
    slug: 'carbon-ceramic-rotor',
    name: 'Carbon Ceramic Rotor',
    system: 'brakes',
    
    definition: 'Carbon ceramic brake rotors (CCB or PCCB) use a carbon fiber reinforced silicon carbide matrix instead of cast iron. They offer exceptional heat resistance, dramatically reduced weight, and very long service life, but at extreme cost. Standard on supercars, they\'re optional on high-performance vehicles.',
    
    howItWorks: 'Carbon ceramic rotors are manufactured by forming carbon fiber into the rotor shape, infiltrating with silicon, and firing at extreme temperatures. The resulting material is extremely hard, heat-resistant (1,400°C vs iron\'s ~700°C), and about 50% lighter than equivalent iron rotors. This reduces unsprung and rotating mass while resisting fade even under extreme track use.',
    
    whyItMatters: 'The weight savings alone make carbon ceramics appealing—10-15 lbs per corner on a supercar. The improved fade resistance enables consistent braking lap after lap. However, the cost ($10,000-20,000 per set) and special requirements (matching pads, warm-up procedure) limit them to exotic cars and serious track use.',
    
    commonTypes: [
      'PCCB (Porsche Ceramic Composite Brake)',
      'CCB (Carbon Ceramic Brake)',
      'BREMBO CCM-R (racing)',
      'Surface Transforms carbon ceramic',
      'SGL Carbon (various OEM supply)'
    ],
    
    keySpecs: [
      'Weight savings vs iron',
      'Operating temperature range',
      'Service life (often 100,000+ miles)',
      'Required pad compounds',
      'Rotor cost'
    ],
    
    signs: {
      good: [
        'Fade-free braking even on track',
        'Consistent pedal feel hot or cold',
        'Long service life',
        'No warping'
      ],
      bad: [
        'Squealing when cold (some designs)',
        'Poor initial bite until warm',
        'Surface damage from debris',
        'Cracking (impact or thermal shock)'
      ]
    },
    
    modPotential: {
      summary: 'Carbon ceramics are the ultimate brake rotor upgrade but cost as much as a used car.',
      gains: 'Significant unsprung weight reduction. Extreme fade resistance. Very long life.',
      considerations: 'Extremely expensive ($10,000-20,000+ per set). Require matching pads. Cold performance can be poor. Street driving may never justify cost. Iron rotors are fine for most track use.'
    },
    
    relatedTopics: ['brake-rotor', 'brake-fade', 'big-brake-kit', 'brake-pad'],
    relatedUpgradeKeys: ['carbon-ceramic-brakes'],
    status: 'complete'
  },

  {
    slug: 'two-piece-rotor',
    name: 'Two-Piece Rotor',
    system: 'brakes',
    
    definition: 'Two-piece brake rotors separate the friction ring (the part the pads contact) from the mounting hat (which bolts to the hub). This allows the ring to expand when hot without warping, enables the use of different materials, and typically reduces weight compared to one-piece rotors.',
    
    howItWorks: 'The friction ring is mounted to an aluminum hat via floating hardware or drive pins. When the ring heats up and expands, it can move slightly relative to the hat rather than warping. The aluminum hat reduces weight compared to the thick iron center of one-piece rotors. This design also allows replacement of just the friction ring when worn, rather than the entire rotor.',
    
    whyItMatters: 'Two-piece rotors are the performance standard for track-focused cars. They resist warping better than one-piece designs, weigh less, and can handle the repeated heat cycles of track use. The ability to replace just the ring also reduces long-term cost for heavy track users.',
    
    commonTypes: [
      'Floating (ring moves on drive pins)',
      'Semi-floating (limited movement)',
      'Fixed (bolted directly)',
      'Aluminum hat (most common)',
      'Steel hat (heavier but may be required)'
    ],
    
    keySpecs: [
      'Ring material',
      'Hat material and weight',
      'Floating vs fixed mount',
      'Hardware type',
      'Total weight vs OEM'
    ],
    
    signs: {
      good: [
        'No warping after track use',
        'Ring moves freely on mounts',
        'Consistent performance when hot',
        'Even wear'
      ],
      bad: [
        'Clicking noise (hardware wear)',
        'Ring binding on hat',
        'Cracks at mount points',
        'Excessive movement (worn hardware)'
      ]
    },
    
    modPotential: {
      summary: 'Two-piece rotors are the preferred upgrade for serious track use.',
      gains: 'Reduced unsprung weight. Better heat management. Warp resistance. Replaceable rings.',
      considerations: 'Check hardware periodically. More expensive initially but rings are replaceable. Not necessary for occasional track use. $300-800+ per rotor.'
    },
    
    relatedTopics: ['brake-rotor', 'brake-fade', 'big-brake-kit', 'brake-caliper'],
    relatedUpgradeKeys: ['two-piece-rotors'],
    status: 'complete'
  },

  {
    slug: 'slotted-rotor',
    name: 'Slotted Rotor',
    system: 'brakes',
    
    definition: 'Slotted rotors have machined grooves (slots) across the friction surface. These slots help degas the pad-rotor interface, wipe away brake dust, and continuously refresh the pad surface. They\'re popular for performance applications where consistent braking under repeated heavy use matters.',
    
    howItWorks: 'As brake pads heat up, they can outgas—release gases trapped in the pad material. This gas layer between pad and rotor reduces friction (gas fade). Slots provide channels for these gases to escape. The slot edges also continuously shave a thin layer off the pad surface, exposing fresh material. This maintains consistent friction but increases pad wear.',
    
    whyItMatters: 'Slotted rotors maintain more consistent braking feel and performance during hard use than plain rotors. They\'re the preferred choice for track days where repeated heavy braking is expected. The trade-off is increased pad wear and sometimes slightly more noise, which is acceptable for performance use.',
    
    commonTypes: [
      'Straight slots',
      'Curved slots',
      'J-hook slots',
      'Pillar vented with slots',
      'Various slot patterns and depths'
    ],
    
    keySpecs: [
      'Slot pattern',
      'Slot depth',
      'Number of slots',
      'Direction (if curved)',
      'Effect on pad wear rate'
    ],
    
    signs: {
      good: [
        'Consistent bite hot and cold',
        'Effective pad degassing',
        'Clean pad surface',
        'Predictable performance'
      ],
      bad: [
        'Excessive pad wear',
        'Slot edges wearing unevenly',
        'Cracking from slots',
        'Excessive noise'
      ]
    },
    
    modPotential: {
      summary: 'Slotted rotors provide consistent performance for track use at the cost of increased pad wear.',
      gains: 'Consistent friction. Better pad degassing. Self-cleaning effect.',
      considerations: 'Increase pad wear 10-20%. Quality slotted rotors don\'t crack from slots. Directional slots should match rotation. Often combined with venting improvements. $80-300+ per rotor.'
    },
    
    relatedTopics: ['brake-rotor', 'cross-drilled-rotor', 'brake-pad', 'brake-fade'],
    relatedUpgradeKeys: ['slotted-rotors'],
    status: 'complete'
  },

  {
    slug: 'cross-drilled-rotor',
    name: 'Cross-Drilled Rotor',
    system: 'brakes',
    
    definition: 'Cross-drilled rotors have holes drilled through the friction surface. Originally developed for racing in the era of organic brake pads that outgassed significantly, drilled rotors help vent gases and water. However, they\'re more prone to cracking under severe use than slotted rotors.',
    
    howItWorks: 'The drilled holes provide escape paths for gases from pad outgassing and for water in wet conditions. Each hole also represents a slight increase in surface area for heat dissipation. However, the holes create stress concentration points that can lead to cracking under repeated thermal cycling—a significant concern for track use.',
    
    whyItMatters: 'Drilled rotors look aggressive and work well for street performance applications. However, for serious track use, many experts recommend slotted over drilled because the cracking issue can be severe. Modern pad compounds outgas less than old organic pads, reducing the need for the degassing that drilled rotors provide.',
    
    commonTypes: [
      'Through-drilled (holes go through)',
      'Blind-drilled (partial depth, reduces cracking)',
      'Chamfered holes (stress relief)',
      'Drilled and slotted (combination)',
      'Various hole patterns'
    ],
    
    keySpecs: [
      'Hole diameter',
      'Hole pattern',
      'Chamfering (if any)',
      'Through vs blind drilling',
      'Crack resistance rating'
    ],
    
    signs: {
      good: [
        'Good wet-weather performance',
        'Aesthetic appeal',
        'Adequate for street use',
        'No visible cracks'
      ],
      bad: [
        'Cracks radiating from holes',
        'Noise from hole edges',
        'Premature pad wear from hole edges',
        'Structural failure from severe cracking'
      ]
    },
    
    modPotential: {
      summary: 'Drilled rotors suit street performance but may crack under repeated track use.',
      gains: 'Improved wet-weather braking. Aesthetic appeal. Good for street performance.',
      considerations: 'Not recommended for heavy track use due to cracking risk. Slotted is generally preferred for performance. Look for chamfered holes and quality manufacturing. $70-250+ per rotor.'
    },
    
    relatedTopics: ['brake-rotor', 'slotted-rotor', 'brake-fade', 'brake-pad'],
    relatedUpgradeKeys: ['drilled-rotors'],
    status: 'complete'
  },

  {
    slug: 'brake-pad',
    name: 'Brake Pad',
    system: 'brakes',
    
    definition: 'Brake pads are the friction material that clamps against the rotor to slow the vehicle. Pad compound determines braking characteristics—friction level, temperature range, wear rate, noise, and dust. Different compounds suit different applications from quiet street driving to aggressive track use.',
    
    howItWorks: 'Brake pads are mounted in the caliper and pressed against the rotor by the caliper pistons. The friction between pad and rotor converts kinetic energy to heat. Pad compounds are carefully formulated mixtures of friction modifiers, binders, fillers, and sometimes metallic or carbon particles. Each compound has a temperature range where it works best.',
    
    whyItMatters: 'Pad selection dramatically affects braking performance. Street pads prioritize low noise, low dust, and good cold bite. Track pads prioritize high-temperature performance and fade resistance but may be noisy, dusty, and poor when cold. Choosing the right pad for your use is one of the most important brake decisions.',
    
    commonTypes: [
      'Organic/NAO (quiet, dusty, low temp)',
      'Semi-metallic (good range, more noise)',
      'Ceramic (low dust, quiet, good street)',
      'Carbon-metallic (track, high temp)',
      'Racing compound (track only)'
    ],
    
    keySpecs: [
      'Friction coefficient (cold and hot)',
      'Operating temperature range',
      'Wear rate',
      'Noise level',
      'Dust production',
      'Rotor compatibility'
    ],
    
    signs: {
      good: [
        'Adequate thickness remaining',
        'Even wear across pad',
        'Appropriate bite for application',
        'No cracking or glazing'
      ],
      bad: [
        'Worn to indicator',
        'Uneven wear (caliper issue)',
        'Glazed surface (overheated)',
        'Cracked friction material',
        'Squealing (wear indicator or compound)'
      ]
    },
    
    modPotential: {
      summary: 'Brake pad upgrades are one of the most cost-effective braking improvements for any application.',
      gains: 'Match pad compound to driving style. Street: quiet, low dust. Track: fade resistance. Huge improvement in braking feel.',
      considerations: 'Track pads are often poor on the street (noise, cold bite). Consider street/track compound changes. Bed pads properly. $50-400 per axle depending on compound.'
    },
    
    relatedTopics: ['brake-rotor', 'brake-caliper', 'brake-fade', 'brake-torque'],
    relatedUpgradeKeys: ['brake-pads', 'performance-pads'],
    status: 'complete'
  },

  {
    slug: 'brake-torque',
    name: 'Brake Torque',
    system: 'brakes',
    
    definition: 'Brake torque is the rotational force applied to slow the wheel, determined by the friction force between pad and rotor multiplied by the effective radius (distance from wheel center to the pad contact point). Larger rotors and multi-piston calipers increase brake torque capacity.',
    
    howItWorks: 'Brake torque = friction force × effective radius. Friction force depends on hydraulic pressure, piston area, and pad friction coefficient. A larger rotor increases effective radius, providing more leverage. This is why big brake kits work—a 14" rotor has significantly more leverage than a 12" rotor with the same clamping force, resulting in more braking torque.',
    
    whyItMatters: 'Brake torque determines how quickly you can decelerate. However, ultimate braking is limited by tire grip, not brake torque—once you can lock the wheels, more brake torque doesn\'t help. The benefit of increased brake torque is improved modulation, better feel, and reduced fade because the system works less hard to achieve the same deceleration.',
    
    commonTypes: [
      'Stock brake torque (designed for vehicle weight)',
      'Upgraded (larger rotors/calipers)',
      'Front vs rear brake torque',
      'Brake bias (front/rear distribution)'
    ],
    
    keySpecs: [
      'Maximum brake torque (lb-ft)',
      'Effective rotor radius',
      'Piston area',
      'Pad friction coefficient',
      'Front/rear brake bias'
    ],
    
    signs: {
      good: [
        'Strong, confident braking',
        'Good pedal modulation',
        'Balanced front/rear grip usage',
        'Consistent performance'
      ],
      bad: [
        'Premature ABS activation',
        'Unable to lock wheels (insufficient torque)',
        'Brake fade under hard use',
        'Uneven front/rear lockup'
      ]
    },
    
    relatedTopics: ['brake-rotor', 'brake-caliper', 'brake-pad', 'big-brake-kit'],
    relatedUpgradeKeys: ['big-brake-kit'],
    status: 'complete'
  },

  {
    slug: 'brake-fade',
    name: 'Brake Fade',
    system: 'brakes',
    
    definition: 'Brake fade is the reduction in braking performance that occurs when brake components overheat. It can be caused by the pads exceeding their operating temperature (pad fade), the brake fluid boiling (fluid fade), or the rotors glazing over. Fade is the primary limitation for repeated hard braking.',
    
    howItWorks: 'Pad fade occurs when the pad friction material exceeds its effective temperature range—friction coefficient drops, sometimes dramatically. Fluid fade happens when brake fluid absorbs enough heat to boil, creating compressible gas bubbles in the lines (spongy pedal, no braking). Rotor glazing creates a polished surface that reduces friction. All forms result in reduced stopping power.',
    
    whyItMatters: 'Fade is dangerous—your brakes work fine until suddenly they don\'t. On track or mountain descents, fade can occur quickly with repeated hard braking. Recognizing the warning signs (pedal feel changes, reduced stopping power) is crucial. Upgrades to pads, fluid, and rotors all address different aspects of fade resistance.',
    
    commonTypes: [
      'Pad fade (friction coefficient drops)',
      'Fluid fade (brake fluid boils)',
      'Rotor glazing (surface transfers)',
      'Green fade (new pad outgassing)',
      'Mechanical fade (component warping)'
    ],
    
    keySpecs: [
      'Pad temperature rating',
      'Fluid boiling point',
      'Rotor thermal capacity',
      'Cooling capability',
      'Recovery characteristics'
    ],
    
    signs: {
      good: [
        'Consistent pedal feel',
        'Maintained stopping power',
        'Quick recovery after hard use',
        'No smell or smoke'
      ],
      bad: [
        'Longer stopping distances',
        'Spongy pedal (fluid fade)',
        'Burning smell',
        'Smoke from wheels',
        'Pedal feels wooden (pad fade)'
      ]
    },
    
    modPotential: {
      summary: 'Fade resistance improvements come from pad compound, fluid upgrade, and improved cooling.',
      gains: 'Consistent braking throughout a track session. Confidence in emergency braking after hard use.',
      considerations: 'Upgrade fluid first (cheap, easy). Then pads for temperature range. Rotors and cooling ducts for severe use. Track pads are not street-friendly.'
    },
    
    relatedTopics: ['brake-pad', 'brake-fluid', 'brake-cooling', 'brake-rotor'],
    relatedUpgradeKeys: ['brake-fluid', 'performance-pads'],
    status: 'complete'
  },

  {
    slug: 'brake-caliper',
    name: 'Brake Caliper',
    system: 'brakes',
    
    definition: 'The brake caliper houses the brake pads and pistons, converting hydraulic pressure into clamping force on the rotor. Caliper design—number of pistons, whether it\'s floating or fixed—significantly affects braking power, feel, and consistency.',
    
    howItWorks: 'Hydraulic fluid enters the caliper and pushes against pistons, which press the brake pads against the rotor. Floating (sliding) calipers have pistons on only one side; the caliper body slides to clamp both pads. Fixed calipers have pistons on both sides, providing more consistent clamping. More pistons distribute force more evenly across the pad surface.',
    
    whyItMatters: 'Caliper design affects everything from pedal feel to pad wear patterns. Multi-piston fixed calipers (4, 6, or 8 piston) provide better feel and more even pad wear than single-piston floaters. For track use, caliper stiffness matters—flex reduces efficiency and feel. Big brake kits typically include larger, multi-piston calipers.',
    
    commonTypes: [
      'Floating/sliding (single piston, most OEM)',
      'Fixed 2-piston',
      'Fixed 4-piston (common performance)',
      'Fixed 6-piston (high performance)',
      'Fixed 8-piston (extreme)',
      'Radial mount vs axial mount'
    ],
    
    keySpecs: [
      'Number of pistons',
      'Piston diameter(s)',
      'Fixed vs floating',
      'Material (iron, aluminum)',
      'Mounting style',
      'Pad shape compatibility'
    ],
    
    signs: {
      good: [
        'Even pad wear',
        'Smooth piston movement',
        'No brake drag',
        'No fluid leaks',
        'Solid mounting'
      ],
      bad: [
        'Uneven pad wear (sticky piston)',
        'Brake drag (piston not retracting)',
        'Fluid leak at piston seals',
        'Cracked caliper body',
        'Worn slide pins (floating)'
      ]
    },
    
    modPotential: {
      summary: 'Caliper upgrades improve braking power, feel, and are central to big brake kits.',
      gains: 'More clamping force. Better feel and modulation. More even pad wear. Often lighter than stock.',
      considerations: 'Calipers must match rotor size. May require different master cylinder for proper feel. Mounting brackets needed for most swaps. $500-3,000+ per caliper for quality units.'
    },
    
    relatedTopics: ['caliper-pistons', 'brake-pad', 'brake-rotor', 'big-brake-kit'],
    relatedUpgradeKeys: ['big-brake-kit', 'caliper-upgrade'],
    status: 'complete'
  },

  {
    slug: 'caliper-pistons',
    name: 'Caliper Pistons',
    system: 'brakes',
    
    definition: 'Caliper pistons are cylinders that extend from the caliper body to push the brake pads against the rotor. Piston size, quantity, and material affect clamping force and heat management. Multi-piston calipers often use differential piston sizes for even pad wear.',
    
    howItWorks: 'Hydraulic pressure acts on the piston face, creating force proportional to pressure × piston area. Larger or more pistons create more force. In multi-piston calipers, pistons are often sized so the trailing pistons are larger than leading pistons—this compensates for pad taper wear and provides more even pad pressure distribution.',
    
    whyItMatters: 'Piston configuration directly affects braking force, pad wear patterns, and heat management. Stainless steel pistons insulate the caliper from pad heat better than aluminum, protecting seals and fluid. For track use, phenolic (plastic) or titanium pistons provide even better heat insulation.',
    
    commonTypes: [
      'Steel pistons (common, moderate heat transfer)',
      'Aluminum pistons (light, high heat transfer)',
      'Stainless steel (good heat insulation)',
      'Phenolic (excellent insulation, racing)',
      'Titanium (light, excellent insulation)'
    ],
    
    keySpecs: [
      'Piston diameter',
      'Number of pistons',
      'Differential sizing (if multi-piston)',
      'Material',
      'Total piston area'
    ],
    
    signs: {
      good: [
        'Smooth piston movement',
        'Even retraction',
        'Clean piston surface',
        'Intact boots/seals'
      ],
      bad: [
        'Sticky or seized piston',
        'Piston corrosion',
        'Damaged boots (allows contamination)',
        'Uneven retraction',
        'Fluid leak past seal'
      ]
    },
    
    modPotential: {
      summary: 'Piston material upgrades reduce heat transfer to fluid in demanding applications.',
      gains: 'Stainless or phenolic pistons reduce heat soak. Better fluid fade resistance.',
      considerations: 'Usually comes with caliper selection. Phenolic pistons can be retrofitted to some calipers. Primarily for track use. Rebuild kits available for most calipers.'
    },
    
    relatedTopics: ['brake-caliper', 'brake-fluid', 'brake-fade'],
    relatedUpgradeKeys: ['caliper-upgrade', 'caliper-rebuild'],
    status: 'complete'
  },

  {
    slug: 'brake-shims',
    name: 'Brake Shims',
    system: 'brakes',
    
    definition: 'Brake shims are thin layers of material placed between the brake pad backing plate and the caliper piston or pad ears. They reduce brake squeal by dampening vibrations and can also provide thermal insulation to protect the caliper from pad heat.',
    
    howItWorks: 'Brake squeal occurs when the pad, rotor, and caliper resonate at audible frequencies during braking. Shims add a dampening layer that absorbs these vibrations before they become noise. Multi-layer shims with different materials are particularly effective. Thermal shims (titanium or insulating materials) also reduce heat transfer from the pad to the caliper.',
    
    whyItMatters: 'Brake squeal is annoying and can make performance pads impractical for street use. Quality shims can dramatically reduce or eliminate squeal from aggressive pad compounds. Thermal shims are important for track use, keeping caliper temperatures lower and protecting brake fluid from boiling.',
    
    commonTypes: [
      'Adhesive-backed (attached to pad)',
      'Loose-fit (not attached)',
      'Multi-layer dampening',
      'Thermal insulating (titanium, Nomex)',
      'Combination dampening/thermal'
    ],
    
    keySpecs: [
      'Material composition',
      'Thickness',
      'Dampening effectiveness',
      'Thermal resistance',
      'Attachment method'
    ],
    
    signs: {
      good: [
        'Quiet braking',
        'Lower caliper temperatures',
        'Shim staying in place',
        'No additional brake drag'
      ],
      bad: [
        'Brake squeal despite shims',
        'Shim falling out',
        'Damaged or bent shim',
        'Increased drag from thick shims'
      ]
    },
    
    modPotential: {
      summary: 'Quality shims can make aggressive pad compounds livable on the street.',
      gains: 'Reduced or eliminated squeal. Lower caliper/fluid temperatures.',
      considerations: 'Try OEM-style shims first. Titanium shims for track use. Some pads include effective shims. Clean and prep surfaces. $20-100 for quality shim sets.'
    },
    
    relatedTopics: ['brake-pad', 'brake-caliper', 'brake-fade'],
    relatedUpgradeKeys: ['brake-shims'],
    status: 'complete'
  },

  {
    slug: 'brake-fluid',
    name: 'Brake Fluid',
    system: 'brakes',
    
    definition: 'Brake fluid is the hydraulic medium that transfers force from the master cylinder to the wheel calipers. It must withstand high temperatures without boiling (which causes brake fade) and maintain consistent viscosity across a wide temperature range. Brake fluid is hygroscopic—it absorbs water from the air, which lowers its boiling point.',
    
    howItWorks: 'When you press the brake pedal, brake fluid transmits that force hydraulically to the calipers. Because liquids are virtually incompressible, the force transfer is immediate and consistent. However, if the fluid gets hot enough to boil, vapor bubbles form. Gas is compressible, so the pedal feels spongy and braking power is lost. Higher boiling point fluids resist this longer.',
    
    whyItMatters: 'Brake fluid is one of the most important and most neglected maintenance items. Fluid that has absorbed water has a significantly lower boiling point—2-year-old DOT 3 might boil at 300°F instead of 400°F. For track use, high-temperature racing fluid is essential. Fluid fade (boiling) can cause complete brake failure.',
    
    commonTypes: [
      'DOT 3 (dry boiling point 401°F minimum)',
      'DOT 4 (dry boiling point 446°F minimum)',
      'DOT 5.1 (dry boiling point 500°F minimum)',
      'DOT 5 (silicone-based, not mixable)',
      'Racing fluid (550-600°F+ dry boiling point)'
    ],
    
    keySpecs: [
      'Dry boiling point (new fluid)',
      'Wet boiling point (with water absorbed)',
      'DOT specification',
      'Viscosity',
      'Compatibility with seals'
    ],
    
    signs: {
      good: [
        'Firm, consistent pedal',
        'Clear or light amber color',
        'Recently changed',
        'No moisture contamination'
      ],
      bad: [
        'Spongy pedal (air or boiling)',
        'Dark brown/black color (degraded)',
        'Moisture content high (test strips)',
        'Pedal fade when hot'
      ]
    },
    
    modPotential: {
      summary: 'High-performance brake fluid is one of the cheapest and most effective brake upgrades for track use.',
      gains: 'Higher boiling point means no fluid fade. Consistent pedal feel under hard use.',
      considerations: 'Flush completely—don\'t mix. Racing fluid often absorbs water faster (flush more often). DOT 4 is good for spirited street driving. Racing fluid for track use. $15-50 per liter.'
    },
    
    relatedTopics: ['brake-fade', 'brake-master-cylinder', 'stainless-brake-lines'],
    relatedUpgradeKeys: ['brake-fluid', 'brake-flush'],
    status: 'complete'
  },

  {
    slug: 'stainless-brake-lines',
    name: 'Stainless Steel Brake Lines',
    system: 'brakes',
    
    definition: 'Stainless steel braided brake lines replace the factory rubber brake hoses that connect the hard brake lines to the calipers. The braided outer layer prevents the hose from expanding under pressure, improving pedal feel and response.',
    
    howItWorks: 'Stock rubber brake hoses can expand slightly under hydraulic pressure, especially when hot or aged. This expansion absorbs some of the pedal force before it reaches the caliper—the pedal feels spongy. Stainless braided lines use a PTFE inner hose wrapped in stainless steel braid that resists expansion, providing firmer, more consistent pedal feel.',
    
    whyItMatters: 'Stainless lines are one of the most cost-effective brake feel improvements. The difference is immediately noticeable—a firmer pedal with better modulation. For track use, consistent pedal feel helps threshold braking. Stainless lines also last longer than rubber and resist damage from debris and heat better.',
    
    commonTypes: [
      'DOT-approved (street legal)',
      'Non-DOT (racing only)',
      'Colored coating options',
      'Extended length (for lifted vehicles)',
      'Application-specific vs universal'
    ],
    
    keySpecs: [
      'Inner hose material (PTFE)',
      'Braid material (stainless steel)',
      'Fitting material and plating',
      'DOT certification',
      'Length and routing'
    ],
    
    signs: {
      good: [
        'Firm, consistent pedal',
        'No visible damage or wear',
        'No leaks at fittings',
        'Secure routing'
      ],
      bad: [
        'Outer braid fraying',
        'Kinks in hose',
        'Leaking at fittings',
        'Rubbing on suspension components',
        'Too short/long for suspension travel'
      ]
    },
    
    modPotential: {
      summary: 'Stainless brake lines are an excellent, affordable upgrade for improved pedal feel.',
      gains: 'Firmer pedal feel. Better modulation. Improved durability. Resistant to deterioration.',
      considerations: 'Use DOT-approved lines for street use. Ensure proper routing and length for suspension travel. Bleed brakes after installation. $80-200 for quality sets.'
    },
    
    relatedTopics: ['brake-fluid', 'brake-master-cylinder', 'brake-caliper'],
    relatedUpgradeKeys: ['stainless-brake-lines'],
    status: 'complete'
  },

  {
    slug: 'brake-cooling',
    name: 'Brake Cooling Ducts',
    system: 'brakes',
    
    definition: 'Brake cooling ducts direct fresh air from the front of the vehicle to the brake rotors and calipers, reducing operating temperatures. For track use, effective brake cooling can be the difference between consistent performance and dangerous fade.',
    
    howItWorks: 'Ducts typically route air from openings in the front bumper or splitter through flexible hoses to the wheel well area, directing air onto the rotor\'s vented center or across the caliper. Backing plates behind the rotor can be modified to direct this airflow effectively. The cooling effect reduces rotor and caliper temperatures by 100-200°F or more under heavy use.',
    
    whyItMatters: 'Heat is the enemy of braking performance. Rotor temperatures can exceed 1,200°F under track use. Effective cooling keeps temperatures in the optimal range, preventing pad fade, fluid boiling, and rotor damage. For any serious track use, brake cooling should be considered alongside pads, fluid, and rotors.',
    
    commonTypes: [
      'Hose-style ducts (flexible routing)',
      'Rigid ducting (more airflow)',
      'Backing plate deflectors',
      'Bumper inlet scoops',
      'Complete cooling kits'
    ],
    
    keySpecs: [
      'Duct diameter',
      'Air volume delivered',
      'Installation complexity',
      'Effect on brake temps',
      'Compatibility with wheels'
    ],
    
    signs: {
      good: [
        'Lower brake temperatures',
        'Consistent performance throughout session',
        'Reduced fade',
        'Extended pad/rotor life'
      ],
      bad: [
        'Ducts blocked or crushed',
        'Poor routing (air not reaching brakes)',
        'Ducts interfering with suspension',
        'Ingesting debris'
      ]
    },
    
    modPotential: {
      summary: 'Brake cooling is essential for serious track use and extends brake component life.',
      gains: 'Lower operating temps. Reduced fade. Extended pad and rotor life. Consistent performance.',
      considerations: 'Most effective on front brakes. May require bumper modification. Check clearance with wheels. $100-500 for complete kits.'
    },
    
    relatedTopics: ['brake-fade', 'brake-rotor', 'brake-pad', 'brake-fluid'],
    relatedUpgradeKeys: ['brake-cooling-ducts'],
    status: 'complete'
  },

  {
    slug: 'hydraulic-handbrake',
    name: 'Hydraulic Handbrake',
    system: 'brakes',
    
    definition: 'A hydraulic handbrake (hydro e-brake or hydraulic parking brake) uses hydraulic pressure rather than a cable to actuate the rear brakes. It provides more powerful and more controllable rear brake lockup for drifting, rally, and other motorsport applications where inducing rear wheel lockup is a handling technique.',
    
    howItWorks: 'The hydraulic handbrake typically has its own master cylinder connected to the rear brake calipers (either in series with or parallel to the main brake system). Pulling the lever generates hydraulic pressure directly to the rear brakes, bypassing the brake proportioning valve. This allows immediate, powerful rear brake application independent of the foot brake.',
    
    whyItMatters: 'For drifting, rallying, and gymkhana, the ability to lock the rear wheels while maintaining control of the front brakes is essential. Cable parking brakes are too slow and weak for these techniques. A hydraulic handbrake provides instant, powerful, modulated rear brake lockup. It\'s a required modification for competitive drift and rally cars.',
    
    commonTypes: [
      'Inline hydraulic (in series with foot brake)',
      'Dual-caliper hydraulic (parallel system)',
      'Vertical mount',
      'Horizontal/floor mount',
      'Quick-release for daily driving'
    ],
    
    keySpecs: [
      'Lever length (affects mechanical advantage)',
      'Master cylinder bore',
      'Handle travel',
      'Lock mechanism',
      'Integration method'
    ],
    
    signs: {
      good: [
        'Instant rear lockup when pulled',
        'Good modulation',
        'Reliable locking mechanism',
        'Comfortable ergonomics'
      ],
      bad: [
        'Slow or weak lockup',
        'Won\'t hold position',
        'Leaking master cylinder',
        'Poor ergonomic position'
      ]
    },
    
    modPotential: {
      summary: 'Hydraulic handbrakes are essential for drifting and rally applications.',
      gains: 'Instant, powerful rear brake lockup. Essential for drift initiation and rally techniques.',
      considerations: 'Requires modification to brake system. May void warranty. Not needed for track days or autocross (in most cases). Proper bleeding is critical. $150-500 for quality units.'
    },
    
    relatedTopics: ['brake-caliper', 'brake-master-cylinder', 'brake-fluid'],
    relatedUpgradeKeys: ['hydraulic-handbrake'],
    status: 'complete'
  },

  {
    slug: 'drum-brakes',
    name: 'Drum Brakes',
    system: 'brakes',
    
    definition: 'Drum brakes use brake shoes that press outward against the inner surface of a rotating drum. An older technology than disc brakes, drums are still used on the rear axle of many economy cars and trucks due to their lower cost and effective parking brake integration.',
    
    howItWorks: 'A wheel cylinder converts hydraulic pressure into mechanical force that pushes two brake shoes outward against the drum. The friction between the shoes and drum slows the wheel. The "self-energizing" effect amplifies braking force in one direction of rotation. Drum brakes are enclosed, which helps keep them clean but makes heat dissipation more difficult.',
    
    whyItMatters: 'Drum brakes are adequate for light-duty rear brake applications on economy cars, but their poor heat dissipation makes them unsuitable for performance use. Many owners of older vehicles or budget cars convert rear drums to disc brakes for improved performance, easier maintenance, and better looks.',
    
    commonTypes: [
      'Leading/trailing shoe',
      'Dual leading shoe',
      'Servo (duo-servo) design',
      'Various drum diameters',
      'Self-adjusting mechanisms'
    ],
    
    keySpecs: [
      'Drum diameter',
      'Shoe width',
      'Wheel cylinder bore',
      'Self-adjuster type',
      'Parking brake integration'
    ],
    
    signs: {
      good: [
        'Proper adjustment',
        'Even shoe wear',
        'No grabbing or squealing',
        'Working self-adjusters'
      ],
      bad: [
        'Grabbing or pulling',
        'Squealing or grinding',
        'Uneven shoe wear',
        'Leaking wheel cylinder',
        'Sticking shoes (contamination or wear)',
        'Fading quickly'
      ]
    },
    
    modPotential: {
      summary: 'Drum-to-disc conversions eliminate the limitations of drum brakes for performance use.',
      gains: 'Better heat dissipation. Improved stopping power. Easier maintenance. Better appearance.',
      considerations: 'Conversion kits available for many vehicles. Must address parking brake (may use caliper-integrated). Typically $300-800 for quality conversion kits.'
    },
    
    relatedTopics: ['brake-rotor', 'brake-caliper', 'brake-fade'],
    relatedUpgradeKeys: ['drum-to-disc-conversion'],
    status: 'complete'
  }
];

export default brakeTopics;












