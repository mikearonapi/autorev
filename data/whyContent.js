/**
 * Why Content - Educational Definitions
 * 
 * Centralized content for InfoTooltip components.
 * Each topic includes:
 * - title: Display name
 * - definition: What it is
 * - whyMatters: Why enthusiasts care
 * - whatAffects: What modifications/factors influence it
 */

export const WHY_CONTENT = {
  // ---------------------------------------------------------------------------
  // POWER & PERFORMANCE METRICS
  // ---------------------------------------------------------------------------
  
  hp: {
    title: 'Horsepower (HP)',
    definition: 'Horsepower is a measure of an engine\'s power output - specifically, its ability to do work over time. One horsepower equals the power needed to lift 550 pounds one foot in one second.',
    whyMatters: 'Horsepower determines your vehicle\'s top speed potential and acceleration at higher RPMs. More horsepower generally means faster acceleration and a higher top speed, especially important for highway pulls and track straightaways.',
    whatAffects: 'Engine modifications like cold air intakes, exhausts, and tunes can increase HP. Forced induction (turbo/supercharger) provides the biggest gains. Weight reduction effectively increases power-to-weight ratio without adding actual horsepower.',
  },
  
  torque: {
    title: 'Torque (lb-ft)',
    definition: 'Torque is rotational force - the twisting power that gets your car moving from a stop. Measured in pound-feet (lb-ft), it represents the force applied at a distance from the rotation point.',
    whyMatters: 'Torque determines how quickly you accelerate from low speeds and how effortlessly your car pulls. High torque means better launches, easier towing, and that satisfying push-back-in-your-seat feeling.',
    whatAffects: 'Exhaust systems, headers, and ECU tunes typically boost low-end torque. Turbochargers excel at torque gains. Intake and exhaust flow improvements help the engine breathe better across the rev range.',
  },
  
  powerToWeight: {
    title: 'Power-to-Weight Ratio',
    definition: 'The ratio of horsepower to vehicle weight, typically expressed as HP per ton or pounds per HP. A 400 HP car weighing 4,000 lbs has 10 lbs/HP or 200 HP/ton.',
    whyMatters: 'This ratio is the ultimate measure of acceleration potential. Two cars with identical horsepower will perform very differently if one weighs 1,000 lbs less. It\'s why lightweight sports cars feel faster than their HP numbers suggest.',
    whatAffects: 'Either increase power (engine mods) or reduce weight (carbon fiber parts, lightweight wheels, removing unnecessary equipment). Both approaches improve the ratio - weight reduction is often more cost-effective.',
  },
  
  // ---------------------------------------------------------------------------
  // ACCELERATION & SPEED
  // ---------------------------------------------------------------------------
  
  zeroToSixty: {
    title: '0-60 MPH Time',
    definition: 'The time required to accelerate from a standstill to 60 miles per hour. It\'s the most common benchmark for comparing vehicle acceleration performance.',
    whyMatters: 'This metric captures real-world usability - merging onto highways, passing slower traffic, and spirited driving. It tests the entire drivetrain: engine power, transmission, tires, and traction.',
    whatAffects: 'Launch technique matters as much as power. Traction (tires, drivetrain type) is crucial. Lighter weight, more power, better gearing, and sticky tires all reduce 0-60 times. AWD cars often beat RWD cars despite less power.',
  },
  
  quarterMile: {
    title: 'Quarter Mile Time',
    definition: 'The time to complete a standing-start quarter mile (1,320 feet) drag race. Includes both elapsed time (ET) and trap speed (speed at the finish line).',
    whyMatters: 'The quarter mile tests sustained acceleration, not just initial launch. Trap speed indicates top-end power, while ET shows overall performance. It\'s the ultimate straight-line performance benchmark.',
    whatAffects: 'Power-to-weight ratio is paramount. Drag radials or slicks dramatically improve traction. Transmission tuning for optimal shifts, weight reduction, and aerodynamic drag all play roles. Driver skill in staging and shifting matters.',
  },
  
  topSpeed: {
    title: 'Top Speed',
    definition: 'The maximum velocity a vehicle can achieve, limited by either engine power, aerodynamic drag, or electronic governor (speed limiter).',
    whyMatters: 'While rarely achievable on public roads, top speed indicates a car\'s ultimate performance envelope and engineering quality. It\'s a badge of honor for high-performance vehicles.',
    whatAffects: 'Horsepower overcomes aerodynamic drag (which increases with the square of speed). Removing the speed limiter, improving aerodynamics, and adding power all increase top speed. Gearing must be optimized.',
  },
  
  // ---------------------------------------------------------------------------
  // HANDLING & DYNAMICS
  // ---------------------------------------------------------------------------
  
  lateralG: {
    title: 'Lateral G-Force',
    definition: 'The sideways force experienced during cornering, measured in G\'s (multiples of gravitational force). 1G lateral means the force pushing you sideways equals your body weight.',
    whyMatters: 'Lateral G indicates cornering grip and chassis capability. Higher G means faster cornering speeds on track. Street cars typically achieve 0.8-1.0G; track-prepped cars can exceed 1.5G with slick tires.',
    whatAffects: 'Tires are the biggest factor - stickier compounds allow higher G. Suspension geometry, sway bars, and chassis stiffness help utilize tire grip. Weight distribution and center of gravity height also matter.',
  },
  
  skidpad: {
    title: 'Skidpad (G\'s)',
    definition: 'A standardized test measuring maximum lateral acceleration on a circular path (typically 200 or 300 feet diameter). The result is expressed in G-force sustained.',
    whyMatters: 'Provides a controlled, repeatable measure of cornering capability independent of driver skill or track layout. It\'s pure grip measurement without braking or acceleration variables.',
    whatAffects: 'Tire compound and width have the largest impact. Suspension setup, alignment (camber, toe), sway bars, and weight transfer characteristics all contribute. Lower, stiffer cars generally perform better.',
  },
  
  brakingDistance: {
    title: 'Braking Distance (60-0)',
    definition: 'The distance required to stop from 60 MPH to a complete standstill. Typically measured in feet, with shorter distances indicating better braking performance.',
    whyMatters: 'Critical for both safety and track performance. Strong brakes allow later braking points, gaining time in corners. Consistent braking builds driver confidence and enables faster lap times.',
    whatAffects: 'Tire grip is the primary limiter - brakes can only use available traction. Bigger brake rotors improve heat management. Performance pads, braided lines, and high-temp fluid prevent fade. ABS tuning affects real-world performance.',
  },
  
  // ---------------------------------------------------------------------------
  // LAP TIMES & TRACK
  // ---------------------------------------------------------------------------
  
  lapTimeEstimate: {
    title: 'Lap Time Estimate',
    definition: 'A calculated prediction of lap time based on vehicle specifications, power-to-weight ratio, and known performance characteristics. AutoRev uses physics models calibrated against real lap data.',
    whyMatters: 'Helps you understand how modifications might translate to track performance. While estimates aren\'t guarantees, they provide directional guidance for build decisions and goal setting.',
    whatAffects: 'Power, weight, tire grip, and aerodynamics are the primary inputs. Driver skill typically accounts for 2-5 seconds of variation. Track conditions (temperature, surface) also impact actual times significantly.',
  },
  
  trackReadiness: {
    title: 'Track Readiness Score',
    definition: 'AutoRev\'s assessment of how well-prepared a vehicle is for sustained track use, considering cooling, brakes, suspension, safety equipment, and reliability factors.',
    whyMatters: 'Track driving places extreme demands on vehicles. A high track readiness score means fewer worries about overheating, brake fade, or mechanical issues during spirited driving.',
    whatAffects: 'Cooling upgrades (oil cooler, radiator, brake ducts), brake pads rated for high heat, proper suspension setup, and safety equipment (harness, fire extinguisher) all improve the score.',
  },
  
  // ---------------------------------------------------------------------------
  // INSTALL & BUILD METRICS
  // ---------------------------------------------------------------------------
  
  installDifficulty: {
    title: 'Install Difficulty',
    definition: 'A rating from 1-5 indicating how challenging a modification is to install. Considers tools required, skill level needed, time investment, and risk of damage if done incorrectly.',
    whyMatters: 'Helps you decide whether to DIY or hire a professional. Underestimating difficulty leads to frustration, damage, or incomplete installs. Proper assessment saves time and money.',
    whatAffects: 'Difficulty depends on accessibility, special tools needed, precision requirements, and consequences of errors. Some mods are bolt-on easy; others require fabrication or professional equipment.',
  },
  
  fitmentConfidence: {
    title: 'Fitment Confidence',
    definition: 'AutoRev\'s confidence level that a part will fit your specific vehicle. Based on manufacturer data, community feedback, and known compatibility information.',
    whyMatters: 'Wrong parts waste time and money. High confidence means the part is verified to fit your year, make, and model. Lower confidence indicates you should verify fitment details before purchasing.',
    whatAffects: 'Data quality varies by part and vehicle. Universal parts have lower confidence than vehicle-specific parts. Community reports and verified installations increase confidence scores.',
  },
  
  // ---------------------------------------------------------------------------
  // BUILD STAGES & PROGRESSION
  // ---------------------------------------------------------------------------
  
  stageProgression: {
    title: 'Stage Progression (1/2/3)',
    definition: 'A classification system for modification levels. Stage 1 is bolt-ons and tune. Stage 2 adds exhaust/intake work. Stage 3 involves internal engine modifications or major forced induction upgrades.',
    whyMatters: 'Stages help plan your build progression. Each stage typically requires supporting modifications from previous stages. Skipping stages can lead to reliability issues or underperforming parts.',
    whatAffects: 'Your goals, budget, and desired power level determine appropriate stage. Daily drivers often stay Stage 1-2. Track cars and builds targeting big power gains progress to Stage 3.',
  },
  
  buildCompletion: {
    title: 'Build Completion',
    definition: 'The percentage of planned modifications that have been purchased and installed. Tracks progress toward your build goal.',
    whyMatters: 'Helps visualize progress and stay motivated. A complete build means all supporting modifications are in place, maximizing the effectiveness of each component.',
    whatAffects: 'Your build plan scope determines 100%. Adding or removing planned parts adjusts the percentage. Completion considers both purchase and installation status.',
  },
  
  // ---------------------------------------------------------------------------
  // COST & VALUE
  // ---------------------------------------------------------------------------
  
  costPerHp: {
    title: 'Cost per Horsepower',
    definition: 'The dollar amount spent per horsepower gained from a modification. Calculated by dividing part cost by expected HP increase.',
    whyMatters: 'Helps prioritize modifications by value. Early mods often have excellent cost-per-HP ratios. Diminishing returns mean later mods cost more per HP gained.',
    whatAffects: 'Base power level matters - gaining HP on a stock car is cheaper than on an already-modified one. ECU tunes typically offer the best cost-per-HP. Forced induction provides good value for big gains.',
  },
  
  resaleValue: {
    title: 'Modification Impact on Value',
    definition: 'How modifications affect your vehicle\'s resale value. Some mods add value; others decrease it. Quality, reversibility, and market demand all factor in.',
    whyMatters: 'Understanding value impact helps make smarter build decisions. Quality parts from reputable brands hold value better. Some modifications are deal-breakers for future buyers.',
    whatAffects: 'Bolt-on, reversible mods have less negative impact. Quality brands retain value better than cheap alternatives. Comprehensive, well-documented builds can actually increase value to the right buyer.',
  },
};

export default WHY_CONTENT;
