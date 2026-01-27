/**
 * AutoRev - Car Connected Tissue Matrix
 *
 * This module defines the fully connected dependency graph between car systems,
 * subsystems, and components. It's used to:
 *
 * 1. Validate upgrade selections and flag missing supporting mods
 * 2. Generate intelligent recommendations based on what the user selects
 * 3. Warn about potential safety/reliability issues
 * 4. Help users understand why certain upgrades require others
 *
 * ARCHITECTURE:
 * - SYSTEMS: Top-level groupings (powertrain, brakes, suspension, etc.)
 * - NODES: Individual components/attributes that can be modified or stressed
 * - EDGES: Relationships between nodes (requires, stresses, invalidates, etc.)
 * - RULES: Scenario-based dependency checks triggered by upgrade selections
 *
 * The matrix is designed to be queried by:
 * - car (some dependencies are car-specific)
 * - upgrade (what does this mod touch?)
 * - usage profile (street vs track changes thresholds)
 */

// =============================================================================
// SYSTEMS & SUBSYSTEMS TAXONOMY
// =============================================================================

/**
 * Core vehicle systems - top level grouping
 * Each system contains multiple nodes (components/attributes)
 */
export const systems = {
  powertrain: {
    key: 'powertrain',
    name: 'Powertrain',
    description: 'Engine, ECU, and power delivery components',
    icon: 'bolt',
    color: '#e74c3c',
  },
  fueling: {
    key: 'fueling',
    name: 'Fuel System',
    description: 'Fuel delivery, injectors, pumps, and lines',
    icon: 'fuel',
    color: '#f39c12',
  },
  ignition: {
    key: 'ignition',
    name: 'Ignition System',
    description: 'Spark plugs, coils, timing, and knock control',
    icon: 'spark',
    color: '#e67e22',
  },
  exhaust: {
    key: 'exhaust',
    name: 'Exhaust System',
    description: 'Headers, catalytic converters, mufflers, and flow',
    icon: 'sound',
    color: '#8e44ad',
  },
  cooling: {
    key: 'cooling',
    name: 'Cooling System',
    description: 'Radiator, oil cooler, intercooler, and thermal management',
    icon: 'thermometer',
    color: '#1abc9c',
  },
  induction: {
    key: 'induction',
    name: 'Induction System',
    description: 'Intake, turbo/supercharger, intercooler, boost control',
    icon: 'turbo',
    color: '#9b59b6',
  },
  drivetrain: {
    key: 'drivetrain',
    name: 'Drivetrain',
    description: 'Clutch, transmission, differential, axles, driveshaft',
    icon: 'gears',
    color: '#e67e22',
  },
  brakes: {
    key: 'brakes',
    name: 'Brake System',
    description: 'Calipers, rotors, pads, fluid, lines, and ABS',
    icon: 'brake',
    color: '#c0392b',
  },
  suspension: {
    key: 'suspension',
    name: 'Suspension System',
    description: 'Springs, dampers, control arms, bushings, and geometry',
    icon: 'car',
    color: '#3498db',
  },
  tires: {
    key: 'tires',
    name: 'Tires & Wheels',
    description: 'Tire compound, size, wheel weight, and fitment',
    icon: 'tire',
    color: '#2ecc71',
  },
  chassis: {
    key: 'chassis',
    name: 'Chassis & Geometry',
    description: 'Alignment, roll center, camber, toe, and rigidity',
    icon: 'chassis',
    color: '#34495e',
  },
  aero: {
    key: 'aero',
    name: 'Aerodynamics',
    description: 'Downforce, drag, balance, and cooling airflow',
    icon: 'wind',
    color: '#7f8c8d',
  },
  electronics: {
    key: 'electronics',
    name: 'Electronics & Controls',
    description: 'ECU, traction control, ABS, and stability systems',
    icon: 'cpu',
    color: '#2c3e50',
  },
  safety: {
    key: 'safety',
    name: 'Safety & Track Prep',
    description: 'Occupant protection and safety equipment for high-speed driving',
    icon: 'shield',
    color: '#c0392b',
  },
};

// =============================================================================
// NODES - Individual Components/Attributes
// =============================================================================

/**
 * All nodes in the connected tissue graph
 * Each node represents something that can be modified or stressed by upgrades
 */
export const nodes = {
  // ---------------------------------------------------------------------------
  // POWERTRAIN NODES
  // ---------------------------------------------------------------------------
  'powertrain.boost_level': {
    key: 'powertrain.boost_level',
    system: 'powertrain',
    name: 'Boost Level',
    description:
      'How much extra air pressure the turbo or supercharger forces into the engine. More boost = more power, but also more stress on engine components.',
    unit: 'psi',
    applicableEngines: ['Turbo', 'SC'],
  },
  'powertrain.timing_advance': {
    key: 'powertrain.timing_advance',
    system: 'powertrain',
    name: 'Ignition Timing',
    description:
      'When the spark plug fires relative to piston position. Advancing timing can add power but risks engine knock. Tuners optimize this for each setup.',
    unit: 'degrees',
  },
  'powertrain.air_fuel_ratio': {
    key: 'powertrain.air_fuel_ratio',
    system: 'powertrain',
    name: 'Air/Fuel Ratio',
    description:
      'The mix of air to fuel in combustion. 14.7:1 is "stoich" (ideal for emissions). Richer (lower number) is safer for power; leaner is more efficient but hotter.',
    unit: 'ratio',
  },
  'powertrain.cylinder_pressure': {
    key: 'powertrain.cylinder_pressure',
    system: 'powertrain',
    name: 'Cylinder Pressure',
    description:
      'The force inside engine cylinders during combustion. Higher boost and compression create more pressure, which requires stronger internals to handle safely.',
    unit: 'psi',
  },
  'powertrain.torque_output': {
    key: 'powertrain.torque_output',
    system: 'powertrain',
    name: 'Torque Output',
    description:
      'Rotational force the engine produces—what you feel pushing you back in your seat. More torque = stronger acceleration, especially from low RPM.',
    unit: 'lb-ft',
  },
  'powertrain.hp_output': {
    key: 'powertrain.hp_output',
    system: 'powertrain',
    name: 'Horsepower Output',
    description:
      'How fast the engine can do work—torque multiplied by RPM. More HP = higher top speed potential. Torque gets you moving; HP keeps you accelerating.',
    unit: 'hp',
  },
  'powertrain.rev_limit': {
    key: 'powertrain.rev_limit',
    system: 'powertrain',
    name: 'Rev Limit',
    description:
      'The maximum RPM the ECU allows before cutting fuel/spark. Higher rev limits let you stay in gear longer but stress valve springs, bearings, and rods more.',
    unit: 'rpm',
  },
  'powertrain.bottom_end_strength': {
    key: 'powertrain.bottom_end_strength',
    system: 'powertrain',
    name: 'Bottom End Strength',
    description:
      'How much power the pistons, connecting rods, crankshaft, and block can handle. Stock internals have limits—big power builds often need forged parts.',
    unit: 'rating',
  },
  'powertrain.oiling_system_margin': {
    key: 'powertrain.oiling_system_margin',
    system: 'powertrain',
    name: 'Oiling System Margin',
    description:
      'How well the engine stays lubricated under hard driving. Track use and high G-forces can starve oil pickup—upgraded pans and coolers help prevent damage.',
    unit: 'rating',
  },

  // ---------------------------------------------------------------------------
  // FUELING NODES
  // ---------------------------------------------------------------------------
  'fueling.injector_capacity': {
    key: 'fueling.injector_capacity',
    system: 'fueling',
    name: 'Injector Capacity',
    description:
      'How much fuel the injectors can spray per minute. Bigger power needs bigger injectors—if they max out, the engine runs lean and can be damaged.',
    unit: 'cc/min',
  },
  'fueling.lpfp_capacity': {
    key: 'fueling.lpfp_capacity',
    system: 'fueling',
    name: 'Low Pressure Fuel Pump',
    description:
      'The pump in your fuel tank that feeds fuel to the engine. High-power builds need upgraded pumps to maintain flow under heavy load.',
    unit: 'lph',
  },
  'fueling.hpfp_capacity': {
    key: 'fueling.hpfp_capacity',
    system: 'fueling',
    name: 'High Pressure Fuel Pump',
    description:
      'Found in direct-injection cars, this pump pressurizes fuel to extreme levels for precise injection. Often a bottleneck in tuned DI engines.',
    unit: 'lph',
  },
  'fueling.fuel_pressure': {
    key: 'fueling.fuel_pressure',
    system: 'fueling',
    name: 'Fuel Rail Pressure',
    description:
      'Pressure of fuel waiting to be injected. Higher pressure = finer atomization and potentially more power, but requires supporting upgrades.',
    unit: 'psi',
  },
  'fueling.fuel_octane': {
    key: 'fueling.fuel_octane',
    system: 'fueling',
    name: 'Fuel Octane',
    description:
      'Resistance to knock/detonation. Higher octane (91, 93, E85) allows more aggressive timing and boost. Always use what your tune requires.',
    unit: 'AKI',
  },

  // ---------------------------------------------------------------------------
  // IGNITION NODES
  // ---------------------------------------------------------------------------
  'ignition.spark_energy': {
    key: 'ignition.spark_energy',
    system: 'ignition',
    name: 'Spark Energy',
    description:
      'How strong the spark is that ignites fuel. Boosted engines with denser air-fuel mixtures need stronger sparks—upgraded coils help here.',
    unit: 'mJ',
  },
  'ignition.plug_heat_range': {
    key: 'ignition.plug_heat_range',
    system: 'ignition',
    name: 'Spark Plug Heat Range',
    description:
      'How quickly the plug sheds heat. "Colder" plugs are needed for boosted/high-power engines to prevent pre-ignition. Match plugs to your build.',
    unit: 'heat range',
  },
  'ignition.knock_threshold': {
    key: 'ignition.knock_threshold',
    system: 'ignition',
    name: 'Knock Threshold',
    description:
      'How close the engine is to detonation (knock). Knock destroys engines fast. Good tunes maintain safety margin; aggressive tunes push closer.',
    unit: 'degrees',
  },
  'ignition.coil_dwell': {
    key: 'ignition.coil_dwell',
    system: 'ignition',
    name: 'Coil Dwell Time',
    description:
      'Time the coil charges before firing. Longer dwell = stronger spark but more heat. High-RPM engines need coils that can keep up.',
    unit: 'ms',
  },

  // ---------------------------------------------------------------------------
  // EXHAUST NODES
  // ---------------------------------------------------------------------------
  'exhaust.backpressure': {
    key: 'exhaust.backpressure',
    system: 'exhaust',
    name: 'Exhaust Backpressure',
    description:
      'Resistance the exhaust gases face leaving the engine. Lower backpressure lets the engine breathe easier, freeing up power—especially on turbo cars.',
    unit: 'psi',
  },
  'exhaust.flow_capacity': {
    key: 'exhaust.flow_capacity',
    system: 'exhaust',
    name: 'Exhaust Flow Capacity',
    description:
      'How much exhaust volume the system can move. Bigger pipes and less-restrictive mufflers increase flow. Match to your power level.',
    unit: 'cfm',
  },
  'exhaust.cat_converter_state': {
    key: 'exhaust.cat_converter_state',
    system: 'exhaust',
    name: 'Catalytic Converter',
    description:
      'Emissions device that restricts flow. High-flow cats reduce restriction while staying legal. Deletes are for track-only cars.',
    unit: 'state',
  },
  'exhaust.header_type': {
    key: 'exhaust.header_type',
    system: 'exhaust',
    name: 'Header Type',
    description:
      'The pipes connecting engine to exhaust. Long-tube headers flow best and sound great but are complex to install. Shortys are a good compromise.',
    unit: 'type',
  },

  // ---------------------------------------------------------------------------
  // INDUCTION NODES (Turbo/Supercharger specific)
  // ---------------------------------------------------------------------------
  'induction.turbo_size': {
    key: 'induction.turbo_size',
    system: 'induction',
    name: 'Turbo Size',
    description:
      'The size of the turbo compressor wheel. Bigger turbos make more peak power but spool slower ("turbo lag"). Smaller turbos respond faster but cap out sooner.',
    unit: 'mm',
    applicableEngines: ['Turbo'],
  },
  'induction.wastegate_capacity': {
    key: 'induction.wastegate_capacity',
    system: 'induction',
    name: 'Wastegate Capacity',
    description:
      "The valve that controls max boost by diverting exhaust away from the turbo. Stock wastegates often can't hold high boost—upgraded ones prevent boost creep.",
    unit: 'psi',
    applicableEngines: ['Turbo'],
  },
  'induction.bov_capacity': {
    key: 'induction.bov_capacity',
    system: 'induction',
    name: 'Blow-Off Valve',
    description:
      'Releases pressurized air when you lift throttle, preventing compressor surge (that flutter sound). Bigger BOVs handle higher boost levels safely.',
    unit: 'psi',
    applicableEngines: ['Turbo'],
  },
  'induction.intercooler_capacity': {
    key: 'induction.intercooler_capacity',
    system: 'induction',
    name: 'Intercooler Capacity',
    description: 'Charge air cooling capacity',
    unit: 'kW',
    applicableEngines: ['Turbo', 'SC'],
  },
  'induction.charge_pipe_strength': {
    key: 'induction.charge_pipe_strength',
    system: 'induction',
    name: 'Charge Pipe Integrity',
    description: 'Boost pressure the charge pipes can handle',
    unit: 'psi',
    applicableEngines: ['Turbo', 'SC'],
  },
  'induction.sc_pulley_size': {
    key: 'induction.sc_pulley_size',
    system: 'induction',
    name: 'SC Pulley Size',
    description: 'Supercharger drive pulley diameter (smaller = more boost)',
    unit: 'mm',
    applicableEngines: ['SC'],
  },

  // ---------------------------------------------------------------------------
  // COOLING NODES
  // ---------------------------------------------------------------------------
  'cooling.radiator_capacity': {
    key: 'cooling.radiator_capacity',
    system: 'cooling',
    name: 'Radiator Capacity',
    description: 'Engine coolant heat rejection capacity',
    unit: 'kW',
  },
  'cooling.oil_cooler_capacity': {
    key: 'cooling.oil_cooler_capacity',
    system: 'cooling',
    name: 'Oil Cooler Capacity',
    description: 'Engine oil heat rejection capacity',
    unit: 'kW',
  },
  'cooling.trans_cooler_capacity': {
    key: 'cooling.trans_cooler_capacity',
    system: 'cooling',
    name: 'Transmission Cooler',
    description: 'Transmission fluid heat rejection capacity',
    unit: 'kW',
  },
  'cooling.diff_cooler_capacity': {
    key: 'cooling.diff_cooler_capacity',
    system: 'cooling',
    name: 'Differential Cooler',
    description: 'Differential fluid heat rejection capacity',
    unit: 'kW',
  },
  'cooling.brake_cooling': {
    key: 'cooling.brake_cooling',
    system: 'cooling',
    name: 'Brake Cooling',
    description: 'Airflow to brake components',
    unit: 'cfm',
  },

  // ---------------------------------------------------------------------------
  // DRIVETRAIN NODES
  // ---------------------------------------------------------------------------
  'drivetrain.clutch_capacity': {
    key: 'drivetrain.clutch_capacity',
    system: 'drivetrain',
    name: 'Clutch Torque Capacity',
    description: 'Maximum torque the clutch can hold',
    unit: 'lb-ft',
  },
  'drivetrain.trans_torque_limit': {
    key: 'drivetrain.trans_torque_limit',
    system: 'drivetrain',
    name: 'Transmission Torque Limit',
    description: 'Maximum torque the gearbox can handle',
    unit: 'lb-ft',
  },
  'drivetrain.diff_torque_limit': {
    key: 'drivetrain.diff_torque_limit',
    system: 'drivetrain',
    name: 'Differential Torque Limit',
    description: 'Maximum torque the diff can handle',
    unit: 'lb-ft',
  },
  'drivetrain.axle_strength': {
    key: 'drivetrain.axle_strength',
    system: 'drivetrain',
    name: 'Axle Strength',
    description: 'Half-shaft/axle torque capacity',
    unit: 'lb-ft',
  },
  'drivetrain.driveshaft_rating': {
    key: 'drivetrain.driveshaft_rating',
    system: 'drivetrain',
    name: 'Driveshaft Rating',
    description: 'Driveshaft RPM and torque rating',
    unit: 'lb-ft',
  },
  'drivetrain.flywheel_mass': {
    key: 'drivetrain.flywheel_mass',
    system: 'drivetrain',
    name: 'Flywheel Mass',
    description: 'Rotational inertia of flywheel',
    unit: 'lbs',
  },

  // ---------------------------------------------------------------------------
  // BRAKE NODES
  // ---------------------------------------------------------------------------
  'brakes.pad_temp_rating': {
    key: 'brakes.pad_temp_rating',
    system: 'brakes',
    name: 'Brake Pad Temp Rating',
    description:
      'How hot the pads can get before they fade (stop working). Street pads fade early; track pads need heat to grip. Match pads to your driving.',
    unit: '°F',
  },
  'brakes.rotor_thermal_mass': {
    key: 'brakes.rotor_thermal_mass',
    system: 'brakes',
    name: 'Rotor Thermal Capacity',
    description:
      'How much heat the rotors can absorb before overheating. Bigger, thicker rotors handle more heat—crucial for track use.',
    unit: 'kJ',
  },
  'brakes.rotor_size': {
    key: 'brakes.rotor_size',
    system: 'brakes',
    name: 'Rotor Diameter',
    description:
      'Larger rotors provide more leverage (stopping power) and thermal mass. Big brake kits typically increase rotor size for better performance.',
    unit: 'mm',
  },
  'brakes.caliper_piston_area': {
    key: 'brakes.caliper_piston_area',
    system: 'brakes',
    name: 'Caliper Piston Area',
    description:
      'More piston area = more clamping force on the rotor. Multi-piston calipers (4-pot, 6-pot) spread force evenly and resist pad taper.',
    unit: 'sq in',
  },
  'brakes.fluid_boiling_point': {
    key: 'brakes.fluid_boiling_point',
    system: 'brakes',
    name: 'Brake Fluid Boiling Point',
    description:
      'When brake fluid boils, you get a spongy pedal and no brakes. Track driving requires high-temp fluid (DOT4 racing or better).',
    unit: '°F',
  },
  'brakes.line_expansion': {
    key: 'brakes.line_expansion',
    system: 'brakes',
    name: 'Brake Line Rigidity',
    description:
      "Rubber lines expand under pressure, giving a mushy pedal. Stainless braided lines don't flex, so pedal feel is firm and consistent.",
    unit: 'type',
  },
  'brakes.brake_bias': {
    key: 'brakes.brake_bias',
    system: 'brakes',
    name: 'Brake Bias',
    description:
      'The split of braking force between front and rear. Changes when you upgrade components. Incorrect bias = poor stopping or instability.',
    unit: 'ratio',
  },
  'brakes.abs_calibration': {
    key: 'brakes.abs_calibration',
    system: 'brakes',
    name: 'ABS Calibration',
    description:
      'How aggressively ABS intervenes. Factory settings are for street tires—high-grip tires can trigger ABS too early, hurting lap times.',
    unit: 'type',
  },

  // ---------------------------------------------------------------------------
  // SUSPENSION NODES
  // ---------------------------------------------------------------------------
  'suspension.spring_rate_front': {
    key: 'suspension.spring_rate_front',
    system: 'suspension',
    name: 'Front Spring Rate',
    description:
      'How stiff the front springs are. Stiffer = less body roll and faster response, but harsher ride. Balance front/rear rates for handling character.',
    unit: 'lb/in',
  },
  'suspension.spring_rate_rear': {
    key: 'suspension.spring_rate_rear',
    system: 'suspension',
    name: 'Rear Spring Rate',
    description:
      'Rear spring stiffness. Stiffer rear = more oversteer tendency; softer rear = more understeer. Work with a pro to balance your setup.',
    unit: 'lb/in',
  },
  'suspension.damper_range': {
    key: 'suspension.damper_range',
    system: 'suspension',
    name: 'Damper Operating Range',
    description:
      'How much stroke the shocks have before bottoming out. Lowered cars use up travel—quality coilovers maintain proper damper range.',
    unit: 'mm',
  },
  'suspension.ride_height': {
    key: 'suspension.ride_height',
    system: 'suspension',
    name: 'Ride Height',
    description:
      "Distance from ground to chassis. Lower = better center of gravity and less body roll, but reduced ground clearance. Go too low and you'll scrape.",
    unit: 'inches',
  },
  'suspension.bump_travel': {
    key: 'suspension.bump_travel',
    system: 'suspension',
    name: 'Bump Travel',
    description: 'Available compression travel before bottoming',
    unit: 'mm',
  },
  'suspension.droop_travel': {
    key: 'suspension.droop_travel',
    system: 'suspension',
    name: 'Droop Travel',
    description: 'Available extension travel',
    unit: 'mm',
  },
  'suspension.sway_bar_rate_front': {
    key: 'suspension.sway_bar_rate_front',
    system: 'suspension',
    name: 'Front Sway Bar Rate',
    description: 'Anti-roll bar stiffness at front',
    unit: 'lb/in',
  },
  'suspension.sway_bar_rate_rear': {
    key: 'suspension.sway_bar_rate_rear',
    system: 'suspension',
    name: 'Rear Sway Bar Rate',
    description: 'Anti-roll bar stiffness at rear',
    unit: 'lb/in',
  },

  // ---------------------------------------------------------------------------
  // CHASSIS/GEOMETRY NODES
  // ---------------------------------------------------------------------------
  'chassis.roll_center_height': {
    key: 'chassis.roll_center_height',
    system: 'chassis',
    name: 'Roll Center Height',
    description: 'Height of the roll axis at each axle',
    unit: 'inches',
  },
  'chassis.camber_front': {
    key: 'chassis.camber_front',
    system: 'chassis',
    name: 'Front Camber',
    description: 'Wheel tilt angle at front axle',
    unit: 'degrees',
  },
  'chassis.camber_rear': {
    key: 'chassis.camber_rear',
    system: 'chassis',
    name: 'Rear Camber',
    description: 'Wheel tilt angle at rear axle',
    unit: 'degrees',
  },
  'chassis.toe_front': {
    key: 'chassis.toe_front',
    system: 'chassis',
    name: 'Front Toe',
    description: 'Wheel pointing angle at front axle',
    unit: 'degrees',
  },
  'chassis.toe_rear': {
    key: 'chassis.toe_rear',
    system: 'chassis',
    name: 'Rear Toe',
    description: 'Wheel pointing angle at rear axle',
    unit: 'degrees',
  },
  'chassis.caster': {
    key: 'chassis.caster',
    system: 'chassis',
    name: 'Caster Angle',
    description: 'Steering axis tilt for stability',
    unit: 'degrees',
  },
  'chassis.ackermann': {
    key: 'chassis.ackermann',
    system: 'chassis',
    name: 'Ackermann Geometry',
    description: 'Steering geometry for cornering',
    unit: 'percent',
  },
  'chassis.bump_steer': {
    key: 'chassis.bump_steer',
    system: 'chassis',
    name: 'Bump Steer',
    description: 'Toe change during suspension travel',
    unit: 'degrees/inch',
  },
  'chassis.control_arm_angle': {
    key: 'chassis.control_arm_angle',
    system: 'chassis',
    name: 'Control Arm Geometry',
    description: 'Suspension arm angles affecting kinematics',
    unit: 'degrees',
  },
  'chassis.rigidity': {
    key: 'chassis.rigidity',
    system: 'chassis',
    name: 'Chassis Rigidity',
    description: 'Overall structural stiffness of the chassis/unibody',
    unit: 'Nm/degree',
  },

  // ---------------------------------------------------------------------------
  // TIRE NODES
  // ---------------------------------------------------------------------------
  'tires.grip_coefficient': {
    key: 'tires.grip_coefficient',
    system: 'tires',
    name: 'Tire Grip Level',
    description: 'Friction coefficient of tire compound',
    unit: 'coefficient',
  },
  'tires.treadwear_rating': {
    key: 'tires.treadwear_rating',
    system: 'tires',
    name: 'Treadwear Rating',
    description: 'UTQG treadwear number (lower = stickier)',
    unit: 'TW',
  },
  'tires.heat_cycles': {
    key: 'tires.heat_cycles',
    system: 'tires',
    name: 'Heat Sensitivity',
    description: 'How tire grip changes with temperature',
    unit: 'type',
  },
  'tires.wet_grip': {
    key: 'tires.wet_grip',
    system: 'tires',
    name: 'Wet Grip',
    description: 'Traction in wet conditions',
    unit: 'rating',
  },
  'tires.section_width': {
    key: 'tires.section_width',
    system: 'tires',
    name: 'Tire Width',
    description: 'Section width of tire',
    unit: 'mm',
  },
  'tires.wheel_offset': {
    key: 'tires.wheel_offset',
    system: 'tires',
    name: 'Wheel Offset',
    description: 'Distance from wheel mounting surface to centerline',
    unit: 'mm',
  },

  // ---------------------------------------------------------------------------
  // AERO NODES
  // ---------------------------------------------------------------------------
  'aero.front_downforce': {
    key: 'aero.front_downforce',
    system: 'aero',
    name: 'Front Downforce',
    description: 'Aerodynamic load on front axle',
    unit: 'lbs',
  },
  'aero.rear_downforce': {
    key: 'aero.rear_downforce',
    system: 'aero',
    name: 'Rear Downforce',
    description: 'Aerodynamic load on rear axle',
    unit: 'lbs',
  },
  'aero.aero_balance': {
    key: 'aero.aero_balance',
    system: 'aero',
    name: 'Aero Balance',
    description: 'Front/rear downforce distribution',
    unit: 'percent',
  },
  'aero.drag_coefficient': {
    key: 'aero.drag_coefficient',
    system: 'aero',
    name: 'Drag Coefficient',
    description: 'Aerodynamic drag',
    unit: 'Cd',
  },

  // ---------------------------------------------------------------------------
  // ELECTRONICS NODES
  // ---------------------------------------------------------------------------
  'electronics.traction_control': {
    key: 'electronics.traction_control',
    system: 'electronics',
    name: 'Traction Control',
    description: 'TC intervention level and calibration',
    unit: 'type',
  },
  'electronics.stability_control': {
    key: 'electronics.stability_control',
    system: 'electronics',
    name: 'Stability Control',
    description: 'ESC intervention level',
    unit: 'type',
  },
  'electronics.abs_type': {
    key: 'electronics.abs_type',
    system: 'electronics',
    name: 'ABS Module Type',
    description: 'Factory vs motorsports ABS',
    unit: 'type',
  },

  // ---------------------------------------------------------------------------
  // SAFETY NODES
  // ---------------------------------------------------------------------------
  'safety.rollover_protection': {
    key: 'safety.rollover_protection',
    system: 'safety',
    name: 'Rollover Protection',
    description: 'Occupant protection in rollover situations (roll bar/cage)',
    unit: 'rating',
  },
  'safety.occupant_restraint': {
    key: 'safety.occupant_restraint',
    system: 'safety',
    name: 'Occupant Restraint',
    description: 'Harnesses and seats that keep occupants properly restrained on track',
    unit: 'rating',
  },
};

// =============================================================================
// RELATIONSHIP TYPES
// =============================================================================

/**
 * Types of relationships between nodes
 * Used to classify how upgrades affect other systems
 */
export const relationshipTypes = {
  // Hard dependencies - upgrade REQUIRES this
  REQUIRES: {
    key: 'REQUIRES',
    name: 'Requires',
    severity: 'critical',
    description: 'The upgrade cannot function properly without this supporting mod',
  },

  // Capacity constraints - upgrade STRESSES this system
  STRESSES: {
    key: 'STRESSES',
    name: 'Stresses',
    severity: 'warning',
    description: 'The upgrade increases load on this system - may need upgrade at higher levels',
  },

  // Geometry/setup changes - upgrade INVALIDATES current setup
  INVALIDATES: {
    key: 'INVALIDATES',
    name: 'Invalidates',
    severity: 'warning',
    description: 'The upgrade changes geometry/setup and requires recalibration',
  },

  // Strong recommendation - upgrade PAIRS_WELL with this
  PAIRS_WELL: {
    key: 'PAIRS_WELL',
    name: 'Pairs Well With',
    severity: 'info',
    description: 'These upgrades work synergistically together',
  },

  // Safety concern - upgrade may COMPROMISE this
  COMPROMISES: {
    key: 'COMPROMISES',
    name: 'May Compromise',
    severity: 'safety',
    description: 'The upgrade may negatively affect this aspect - verify adequacy',
  },

  // Direct improvement - upgrade IMPROVES this
  IMPROVES: {
    key: 'IMPROVES',
    name: 'Improves',
    severity: 'positive',
    description: 'The upgrade directly improves this attribute',
  },
  // Soft recommendation for supporting or synergistic upgrades
  RECOMMENDS: {
    key: 'RECOMMENDS',
    name: 'Recommends',
    severity: 'info',
    description: 'The upgrade strongly benefits from these supporting or synergistic mods',
  },
};

// =============================================================================
// EDGES - Relationships Between Nodes
// =============================================================================

/**
 * All dependency edges in the graph
 * Format: source_node -> target_node with relationship type and conditions
 */
export const edges = [
  // ---------------------------------------------------------------------------
  // BOOST/TUNE DEPENDENCIES (Scenario A: ECU Tune for more boost)
  // ---------------------------------------------------------------------------

  // Increased boost -> timing needs adjustment
  {
    from: 'powertrain.boost_level',
    to: 'powertrain.timing_advance',
    type: 'INVALIDATES',
    description: 'Higher boost requires retarded timing to prevent knock',
    threshold: { boostIncrease: 3 }, // psi increase that triggers this
  },

  // Increased boost -> wastegate must handle it
  {
    from: 'powertrain.boost_level',
    to: 'induction.wastegate_capacity',
    type: 'STRESSES',
    description: 'Wastegate must be able to regulate target boost level',
    threshold: { targetBoost: 18 }, // psi where stock wastegate may struggle
  },

  // Increased boost -> fuel system demands
  {
    from: 'powertrain.boost_level',
    to: 'fueling.injector_capacity',
    type: 'STRESSES',
    description: 'Higher boost requires more fuel flow',
    threshold: { boostIncrease: 5 },
  },
  {
    from: 'powertrain.boost_level',
    to: 'fueling.hpfp_capacity',
    type: 'STRESSES',
    description: 'HPFP may max out at high boost levels',
    threshold: { boostIncrease: 8 },
  },

  // Increased boost -> spark plug heat range
  {
    from: 'powertrain.boost_level',
    to: 'ignition.plug_heat_range',
    type: 'COMPROMISES',
    description: 'Higher cylinder temps may require colder plugs',
    threshold: { boostIncrease: 5 },
  },

  // Increased boost -> knock margin
  {
    from: 'powertrain.boost_level',
    to: 'ignition.knock_threshold',
    type: 'STRESSES',
    description: 'Higher boost reduces knock margin - needs monitoring',
    threshold: { boostIncrease: 3 },
  },

  // Increased power -> exhaust flow
  {
    from: 'powertrain.hp_output',
    to: 'exhaust.flow_capacity',
    type: 'STRESSES',
    description: 'More power generates more exhaust gas volume',
    threshold: { hpIncrease: 100 },
  },

  // Increased power -> cat converter becomes restriction
  {
    from: 'powertrain.hp_output',
    to: 'exhaust.cat_converter_state',
    type: 'STRESSES',
    description: 'Stock cats may become a bottleneck at high power',
    threshold: { hpIncrease: 150 },
  },

  // Increased boost -> intercooler heat soak
  {
    from: 'powertrain.boost_level',
    to: 'induction.intercooler_capacity',
    type: 'STRESSES',
    description: 'Higher boost generates more charge air heat',
    threshold: { boostIncrease: 5 },
  },

  // Increased boost -> charge pipe pressure
  {
    from: 'powertrain.boost_level',
    to: 'induction.charge_pipe_strength',
    type: 'STRESSES',
    description: 'Stock plastic charge pipes may crack under high boost',
    threshold: { targetBoost: 22 },
  },

  // Increased power -> cooling demands
  {
    from: 'powertrain.hp_output',
    to: 'cooling.radiator_capacity',
    type: 'STRESSES',
    description: 'More power = more waste heat to reject',
    threshold: { hpIncrease: 150 },
  },
  {
    from: 'powertrain.hp_output',
    to: 'cooling.oil_cooler_capacity',
    type: 'STRESSES',
    description: 'Higher power loads oil harder - needs better cooling',
    threshold: { hpIncrease: 100 },
  },

  // ---------------------------------------------------------------------------
  // TIRE GRIP DEPENDENCIES (Scenario B: Stickier Tires)
  // ---------------------------------------------------------------------------

  // More grip -> brakes work harder
  {
    from: 'tires.grip_coefficient',
    to: 'brakes.pad_temp_rating',
    type: 'STRESSES',
    description: 'Stickier tires allow harder braking - pads get hotter',
    threshold: { treadwear: 200 }, // 200TW or lower triggers this
  },
  {
    from: 'tires.grip_coefficient',
    to: 'brakes.rotor_thermal_mass',
    type: 'STRESSES',
    description: 'Stickier tires = more brake energy to absorb',
    threshold: { treadwear: 200 },
  },
  {
    from: 'tires.grip_coefficient',
    to: 'brakes.fluid_boiling_point',
    type: 'STRESSES',
    description: 'Track tires require high-temp brake fluid',
    threshold: { treadwear: 200 },
  },

  // More grip -> bigger brakes may be needed
  {
    from: 'tires.grip_coefficient',
    to: 'brakes.rotor_size',
    type: 'STRESSES',
    description: 'Tire grip may exceed stock brake torque capacity',
    threshold: { treadwear: 100 }, // R-compound territory
  },
  {
    from: 'tires.grip_coefficient',
    to: 'brakes.caliper_piston_area',
    type: 'STRESSES',
    description: 'May need more clamping force for high-grip tires',
    threshold: { treadwear: 100 },
  },

  // Brake upgrades -> need to maintain bias
  {
    from: 'brakes.rotor_size',
    to: 'brakes.brake_bias',
    type: 'INVALIDATES',
    description: 'Changing rotor size affects brake bias - verify balance',
  },
  {
    from: 'brakes.caliper_piston_area',
    to: 'brakes.brake_bias',
    type: 'INVALIDATES',
    description: 'Changing caliper size affects brake bias',
  },

  // Brake upgrades -> may need brake cooling
  {
    from: 'brakes.pad_temp_rating',
    to: 'cooling.brake_cooling',
    type: 'PAIRS_WELL',
    description: 'Track pads benefit from brake cooling ducts',
  },

  // More grip -> ABS may need recalibration
  {
    from: 'tires.grip_coefficient',
    to: 'brakes.abs_calibration',
    type: 'COMPROMISES',
    description: 'Factory ABS may not be calibrated for R-compound grip',
    threshold: { treadwear: 100 },
  },
  {
    from: 'tires.grip_coefficient',
    to: 'electronics.abs_type',
    type: 'STRESSES',
    description: 'Factory ABS may struggle with very high grip - consider motorsports ABS',
    threshold: { treadwear: 100 },
  },

  // Tire changes -> alignment needed
  {
    from: 'tires.section_width',
    to: 'chassis.camber_front',
    type: 'INVALIDATES',
    description: 'Wider tires often need more camber for optimal contact patch',
  },
  {
    from: 'tires.section_width',
    to: 'chassis.camber_rear',
    type: 'INVALIDATES',
    description: 'Wider tires may need alignment adjustment',
  },
  {
    from: 'tires.grip_coefficient',
    to: 'chassis.toe_front',
    type: 'INVALIDATES',
    description: 'Stickier tires may benefit from different toe settings',
  },

  // ---------------------------------------------------------------------------
  // LOWERING DEPENDENCIES (Scenario C: Lower the Car)
  // ---------------------------------------------------------------------------

  // Lower ride height -> damper travel affected
  {
    from: 'suspension.ride_height',
    to: 'suspension.damper_range',
    type: 'COMPROMISES',
    description: 'Lowering reduces available suspension travel',
    threshold: { drop: 1.5 }, // inches of drop
  },
  {
    from: 'suspension.ride_height',
    to: 'suspension.bump_travel',
    type: 'COMPROMISES',
    description: 'Less bump travel = more likely to bottom out',
    threshold: { drop: 1.0 },
  },

  // Lower ride height -> control arm geometry
  {
    from: 'suspension.ride_height',
    to: 'chassis.control_arm_angle',
    type: 'INVALIDATES',
    description: 'Lowering changes suspension geometry angles',
    threshold: { drop: 1.0 },
  },

  // Lower ride height -> roll center drops
  {
    from: 'suspension.ride_height',
    to: 'chassis.roll_center_height',
    type: 'COMPROMISES',
    description: 'Lowering drops roll center - may need correction kit',
    threshold: { drop: 1.5 },
  },

  // Roll center drop -> may need correction
  {
    from: 'chassis.roll_center_height',
    to: 'chassis.bump_steer',
    type: 'INVALIDATES',
    description: 'Roll center changes affect bump steer characteristics',
  },

  // Significant drop -> camber changes
  {
    from: 'suspension.ride_height',
    to: 'chassis.camber_front',
    type: 'INVALIDATES',
    description: 'Lowering typically adds negative camber',
    threshold: { drop: 0.75 },
  },
  {
    from: 'suspension.ride_height',
    to: 'chassis.camber_rear',
    type: 'INVALIDATES',
    description: 'Lowering affects rear camber',
    threshold: { drop: 0.75 },
  },

  // Significant drop -> ackermann may be affected
  {
    from: 'suspension.ride_height',
    to: 'chassis.ackermann',
    type: 'COMPROMISES',
    description: 'Extreme drops can affect steering geometry',
    threshold: { drop: 2.0 },
  },

  // Springs need to match dampers
  {
    from: 'suspension.spring_rate_front',
    to: 'suspension.damper_range',
    type: 'REQUIRES',
    description: 'Spring rate must be matched to damper valving',
  },
  {
    from: 'suspension.spring_rate_rear',
    to: 'suspension.damper_range',
    type: 'REQUIRES',
    description: 'Rear spring rate must be matched to dampers',
  },

  // ---------------------------------------------------------------------------
  // POWER → DRIVETRAIN DEPENDENCIES
  // ---------------------------------------------------------------------------

  // More torque -> clutch capacity
  {
    from: 'powertrain.torque_output',
    to: 'drivetrain.clutch_capacity',
    type: 'STRESSES',
    description: 'Stock clutch may slip under high torque',
    threshold: { torqueIncrease: 100 }, // lb-ft over stock
  },

  // More torque -> transmission limit
  {
    from: 'powertrain.torque_output',
    to: 'drivetrain.trans_torque_limit',
    type: 'STRESSES',
    description: 'Transmission may have torque limiters or weak synchros',
    threshold: { torqueIncrease: 150 },
  },

  // More torque -> diff and axles
  {
    from: 'powertrain.torque_output',
    to: 'drivetrain.diff_torque_limit',
    type: 'STRESSES',
    description: 'Differential may be overwhelmed by high torque',
    threshold: { torqueIncrease: 200 },
  },
  {
    from: 'powertrain.torque_output',
    to: 'drivetrain.axle_strength',
    type: 'STRESSES',
    description: 'Stock axles are a common failure point in high-HP builds',
    threshold: { torqueIncrease: 200 },
  },
  {
    from: 'powertrain.hp_output',
    to: 'powertrain.bottom_end_strength',
    type: 'STRESSES',
    description: 'Very high horsepower levels approach the limits of stock pistons/rods/crank',
    threshold: { hpIncrease: 200 },
  },
  {
    from: 'powertrain.rev_limit',
    to: 'powertrain.bottom_end_strength',
    type: 'STRESSES',
    description: 'Raising the rev limit increases stress on the rotating assembly',
    threshold: { rpmIncrease: 500 },
  },

  // High RPM -> driveshaft rating
  {
    from: 'powertrain.rev_limit',
    to: 'drivetrain.driveshaft_rating',
    type: 'STRESSES',
    description: 'Stock driveshaft may not be rated for extended high RPM',
    threshold: { rpmIncrease: 500 },
  },

  // ---------------------------------------------------------------------------
  // AERO DEPENDENCIES
  // ---------------------------------------------------------------------------

  // Front aero -> rear aero balance
  {
    from: 'aero.front_downforce',
    to: 'aero.aero_balance',
    type: 'INVALIDATES',
    description: 'Adding front downforce shifts aero balance - may need rear wing',
  },

  // Rear aero -> front aero balance
  {
    from: 'aero.rear_downforce',
    to: 'aero.aero_balance',
    type: 'INVALIDATES',
    description: 'Adding rear downforce shifts aero balance - may need front splitter',
  },

  // Aero -> suspension tuning
  {
    from: 'aero.front_downforce',
    to: 'suspension.spring_rate_front',
    type: 'PAIRS_WELL',
    description: 'Significant downforce may benefit from stiffer springs',
    threshold: { downforce: 100 }, // lbs
  },
  {
    from: 'aero.rear_downforce',
    to: 'suspension.spring_rate_rear',
    type: 'PAIRS_WELL',
    description: 'Rear downforce benefits from stiffer rear springs',
    threshold: { downforce: 100 },
  },

  // ---------------------------------------------------------------------------
  // SYNERGY RELATIONSHIPS (Pairs Well)
  // ---------------------------------------------------------------------------

  // Intake + Exhaust + Tune synergy
  {
    from: 'exhaust.flow_capacity',
    to: 'powertrain.timing_advance',
    type: 'PAIRS_WELL',
    description: 'Exhaust mods unlock more potential with a tune',
  },

  // Suspension + Alignment synergy
  {
    from: 'suspension.spring_rate_front',
    to: 'chassis.camber_front',
    type: 'PAIRS_WELL',
    description: 'New suspension benefits from fresh alignment',
  },

  // Coilovers + Sway bars synergy
  {
    from: 'suspension.spring_rate_front',
    to: 'suspension.sway_bar_rate_front',
    type: 'PAIRS_WELL',
    description: 'Sway bars help fine-tune balance with new suspension',
  },

  // BBK + Track pads synergy
  {
    from: 'brakes.rotor_size',
    to: 'brakes.pad_temp_rating',
    type: 'PAIRS_WELL',
    description: 'Big brakes work best with high-performance pads',
  },

  // Track tires + Brake fluid + Pads synergy
  {
    from: 'tires.grip_coefficient',
    to: 'brakes.fluid_boiling_point',
    type: 'PAIRS_WELL',
    description: 'Track tires demand high-temp brake fluid',
  },
  {
    from: 'tires.grip_coefficient',
    to: 'safety.rollover_protection',
    type: 'PAIRS_WELL',
    description:
      'High-grip track setups often benefit from roll-over protection on serious track cars',
  },
];

// =============================================================================
// UPGRADE → NODE MAPPING
// =============================================================================

/**
 * Maps upgrade keys to the nodes they affect
 * This connects the upgrade system to the dependency graph.
 *
 * NOTE: In addition to node-level relationships (improves/modifies/stresses/
 * invalidates/compromises), some upgrades also declare a `recommends` array.
 * These are expressed in higher-level logic (dependencyChecker) using the
 * RECOMMENDS relationship type from relationshipTypes, so that soft
 * suggestions are kept distinct from hard REQUIRES edges.
 */
export const upgradeNodeMap = {
  // ECU/Power upgrades
  'stage1-tune': {
    improves: ['powertrain.hp_output', 'powertrain.torque_output'],
    modifies: ['powertrain.boost_level', 'powertrain.timing_advance', 'powertrain.air_fuel_ratio'],
    stresses: ['fueling.injector_capacity', 'ignition.knock_threshold'],
  },
  'stage2-tune': {
    improves: ['powertrain.hp_output', 'powertrain.torque_output'],
    modifies: ['powertrain.boost_level', 'powertrain.timing_advance'],
    stresses: [
      'fueling.injector_capacity',
      'fueling.hpfp_capacity',
      'ignition.knock_threshold',
      'induction.intercooler_capacity',
      'drivetrain.clutch_capacity',
    ],
    requires: ['downpipe'],
  },
  'stage3-tune': {
    improves: ['powertrain.hp_output', 'powertrain.torque_output'],
    modifies: ['powertrain.boost_level', 'powertrain.timing_advance'],
    stresses: [
      'drivetrain.clutch_capacity',
      'drivetrain.trans_torque_limit',
      'drivetrain.axle_strength',
      'cooling.oil_cooler_capacity',
      'cooling.trans_cooler_capacity',
    ],
    requires: ['turbo-upgrade-existing', 'fuel-system-upgrade', 'intercooler'],
  },

  // Bolt-on power mods and general tuning
  intake: {
    improves: ['powertrain.hp_output'],
    modifies: ['powertrain.air_fuel_ratio'],
  },
  // Note: throttle-body and intake-manifold removed - marginal gains, niche applications
  // Note: tune-street and tune-track removed - Stage 1/2/3+ are the standard progression
  // for turbo/SC cars. NA cars use bolt-ons without ECU tune requirements.
  'piggyback-tuner': {
    improves: ['powertrain.hp_output', 'powertrain.torque_output'],
    modifies: ['powertrain.boost_level'],
    stresses: ['ignition.knock_threshold'],
  },

  // Downpipe
  downpipe: {
    improves: ['exhaust.flow_capacity'],
    modifies: ['exhaust.backpressure', 'exhaust.cat_converter_state'],
  },

  // Intercooler (also covers heat-exchanger-sc for SC cars)
  intercooler: {
    improves: ['induction.intercooler_capacity'],
    modifies: ['powertrain.boost_level'], // enables higher safe boost
  },

  // Fuel system (hpfp-upgrade merged into fuel-system-upgrade)
  'fuel-system-upgrade': {
    improves: ['fueling.injector_capacity', 'fueling.lpfp_capacity', 'fueling.hpfp_capacity'],
  },

  // Fuel and knock-margin helpers
  'flex-fuel-e85': {
    improves: ['fueling.fuel_octane'],
    modifies: ['powertrain.air_fuel_ratio'],
    stresses: ['fueling.injector_capacity'],
  },
  // Note: methanol-injection removed - E85/flex fuel is the popular modern alternative

  // Forced induction
  'turbo-upgrade-existing': {
    improves: ['induction.turbo_size', 'powertrain.hp_output'],
    modifies: ['powertrain.boost_level'],
    stresses: [
      'fueling.injector_capacity',
      'fueling.hpfp_capacity',
      'drivetrain.clutch_capacity',
      'cooling.oil_cooler_capacity',
      'induction.intercooler_capacity',
      'powertrain.bottom_end_strength',
    ],
  },
  'supercharger-roots': {
    improves: ['powertrain.hp_output', 'powertrain.torque_output'],
    modifies: ['powertrain.boost_level'],
    stresses: [
      'fueling.injector_capacity',
      'drivetrain.clutch_capacity',
      'drivetrain.axle_strength',
      'cooling.oil_cooler_capacity',
      'powertrain.bottom_end_strength',
    ],
    requires: ['fuel-system-upgrade'],
  },
  'supercharger-centrifugal': {
    improves: ['powertrain.hp_output', 'powertrain.torque_output'],
    modifies: ['powertrain.boost_level'],
    stresses: [
      'fueling.injector_capacity',
      'drivetrain.clutch_capacity',
      'cooling.oil_cooler_capacity',
      'powertrain.bottom_end_strength',
    ],
    requires: ['fuel-system-upgrade'],
  },
  'pulley-tune-sc': {
    improves: ['powertrain.hp_output'],
    modifies: ['powertrain.boost_level', 'induction.sc_pulley_size'],
    stresses: ['induction.intercooler_capacity', 'fueling.injector_capacity'],
  },

  // Note: charge-pipe-upgrade removed - typically bundled with intercooler kits

  // Cooling
  'oil-cooler': {
    improves: ['cooling.oil_cooler_capacity'],
  },
  'trans-cooler': {
    improves: ['cooling.trans_cooler_capacity'],
  },
  'radiator-upgrade': {
    improves: ['cooling.radiator_capacity'],
  },

  // Drivetrain
  'clutch-upgrade': {
    improves: ['drivetrain.clutch_capacity'],
  },
  'driveshaft-upgrade': {
    improves: ['drivetrain.driveshaft_rating'],
  },
  'dct-tune': {
    improves: ['drivetrain.trans_torque_limit'],
  },

  // Suspension
  'lowering-springs': {
    modifies: [
      'suspension.ride_height',
      'suspension.spring_rate_front',
      'suspension.spring_rate_rear',
    ],
    invalidates: ['chassis.camber_front', 'chassis.camber_rear', 'chassis.roll_center_height'],
    compromises: ['suspension.bump_travel', 'suspension.damper_range'],
  },
  'coilovers-street': {
    modifies: [
      'suspension.ride_height',
      'suspension.spring_rate_front',
      'suspension.spring_rate_rear',
      'suspension.damper_range',
    ],
    invalidates: ['chassis.camber_front', 'chassis.camber_rear', 'chassis.roll_center_height'],
  },
  'coilovers-track': {
    modifies: [
      'suspension.ride_height',
      'suspension.spring_rate_front',
      'suspension.spring_rate_rear',
      'suspension.damper_range',
    ],
    invalidates: ['chassis.camber_front', 'chassis.camber_rear', 'chassis.roll_center_height'],
    recommends: ['sway-bars', 'chassis-bracing'],
  },
  'sway-bars': {
    modifies: ['suspension.sway_bar_rate_front', 'suspension.sway_bar_rate_rear'],
  },

  // Chassis
  'chassis-bracing': {
    improves: ['chassis.control_arm_angle'],
  },

  // Wheels (tire compound handled by WheelTireConfigurator)
  'wheels-lightweight': {
    improves: ['tires.grip_coefficient'],
  },

  // Brakes
  'brake-pads-street': {
    improves: ['brakes.pad_temp_rating'],
  },
  'brake-pads-track': {
    improves: ['brakes.pad_temp_rating'],
    compromises: ['brakes.pad_temp_rating'], // cold bite reduced
    recommends: ['brake-fluid-lines'],
  },
  'brake-fluid-lines': {
    improves: ['brakes.fluid_boiling_point', 'brakes.line_expansion'],
  },
  'big-brake-kit': {
    improves: ['brakes.rotor_size', 'brakes.rotor_thermal_mass', 'brakes.caliper_piston_area'],
    invalidates: ['brakes.brake_bias'],
    recommends: ['brake-pads-track', 'brake-fluid-lines'],
  },
  'slotted-rotors': {
    improves: ['brakes.rotor_thermal_mass'],
  },

  // Aero
  splitter: {
    improves: ['aero.front_downforce'],
    invalidates: ['aero.aero_balance'],
  },
  wing: {
    improves: ['aero.rear_downforce'],
    invalidates: ['aero.aero_balance'],
    modifies: ['aero.drag_coefficient'],
  },

  // Exhaust
  headers: {
    improves: ['exhaust.flow_capacity', 'exhaust.header_type'],
    // Note: Headers benefit from a tune but don't strictly require one for NA cars
  },
  'exhaust-catback': {
    improves: ['exhaust.flow_capacity'],
    modifies: ['exhaust.backpressure'],
  },

  // Note: Engine internals (camshafts, ported-heads, forged-internals, stroker-kit) removed
  // These are specialist engine build mods that <5% of enthusiasts pursue

  // Safety
  'roll-bar': {
    improves: ['safety.rollover_protection'],
  },
  'roll-cage': {
    improves: ['safety.rollover_protection', 'chassis.rigidity'],
  },
  'racing-harness': {
    improves: ['safety.occupant_restraint'],
  },
  'racing-seat': {
    improves: ['safety.occupant_restraint'],
  },
  'fire-extinguisher': {
    // Safety item, no node impact
  },
  helmet: {
    // Safety item, no node impact
  },

  // ---------------------------------------------------------------------------
  // ADDITIONAL BRAKE UPGRADES (aliased or alternate keys)
  // ---------------------------------------------------------------------------
  'braided-brake-lines': {
    improves: ['brakes.fluid_boiling_point', 'brakes.line_expansion'],
  },
  'high-temp-brake-fluid': {
    improves: ['brakes.fluid_boiling_point'],
  },
  'brake-cooling-ducts': {
    improves: ['cooling.brake_cooling'],
  },
  'brake-pads-performance': {
    improves: ['brakes.pad_temp_rating'],
  },
  'brake-rotors': {
    improves: ['brakes.rotor_thermal_mass'],
  },

  // ---------------------------------------------------------------------------
  // ADDITIONAL AERO UPGRADES
  // ---------------------------------------------------------------------------
  canards: {
    improves: ['aero.front_downforce'],
    modifies: ['aero.aero_balance'],
  },
  'front-splitter': {
    improves: ['aero.front_downforce'],
    invalidates: ['aero.aero_balance'],
  },
  'rear-wing': {
    improves: ['aero.rear_downforce'],
    invalidates: ['aero.aero_balance'],
    modifies: ['aero.drag_coefficient'],
  },
  'rear-diffuser': {
    improves: ['aero.rear_downforce'],
    modifies: ['aero.drag_coefficient'],
  },
  undertray: {
    improves: ['aero.front_downforce', 'aero.rear_downforce'],
    modifies: ['aero.drag_coefficient'],
  },
  'carbon-fiber-hood': {
    // Weight reduction, no specific node impact
  },

  // ---------------------------------------------------------------------------
  // ADDITIONAL CHASSIS & SUSPENSION UPGRADES
  // ---------------------------------------------------------------------------
  coilovers: {
    modifies: [
      'suspension.ride_height',
      'suspension.spring_rate_front',
      'suspension.spring_rate_rear',
      'suspension.damper_range',
    ],
    invalidates: ['chassis.camber_front', 'chassis.camber_rear', 'chassis.roll_center_height'],
  },
  'control-arms': {
    improves: ['chassis.control_arm_angle'],
    modifies: ['chassis.camber_front', 'chassis.camber_rear'],
  },
  'polyurethane-bushings': {
    improves: ['chassis.rigidity'],
  },
  'strut-tower-brace': {
    improves: ['chassis.rigidity'],
  },
  'subframe-connectors': {
    improves: ['chassis.rigidity'],
  },
  'wheel-spacers': {
    modifies: ['tires.wheel_offset'],
  },
  'performance-alignment': {
    modifies: [
      'chassis.camber_front',
      'chassis.camber_rear',
      'chassis.toe_front',
      'chassis.toe_rear',
    ],
  },

  // ---------------------------------------------------------------------------
  // ADDITIONAL COOLING UPGRADES
  // ---------------------------------------------------------------------------
  'diff-cooler': {
    improves: ['cooling.diff_cooler_capacity'],
  },
  'high-temp-fluids': {
    improves: ['cooling.oil_cooler_capacity'], // Better heat tolerance
  },

  // ---------------------------------------------------------------------------
  // ADDITIONAL INTAKE/EXHAUST UPGRADES (alternate keys)
  // ---------------------------------------------------------------------------
  'cold-air-intake': {
    improves: ['powertrain.hp_output'],
    modifies: ['powertrain.air_fuel_ratio'],
  },
  'high-flow-air-filter': {
    improves: ['powertrain.hp_output'],
  },
  'cat-back-exhaust': {
    improves: ['exhaust.flow_capacity'],
    modifies: ['exhaust.backpressure'],
  },
  'muffler-delete': {
    improves: ['exhaust.flow_capacity'],
    modifies: ['exhaust.backpressure'],
  },
  'resonator-delete': {
    improves: ['exhaust.flow_capacity'],
    modifies: ['exhaust.backpressure'],
  },

  // ---------------------------------------------------------------------------
  // ADDITIONAL DRIVETRAIN UPGRADES
  // ---------------------------------------------------------------------------
  'axles-halfshafts': {
    improves: ['drivetrain.axle_strength'],
  },
  'lightweight-flywheel': {
    improves: ['drivetrain.flywheel_mass'],
  },
  'limited-slip-diff': {
    improves: ['drivetrain.diff_torque_limit'],
  },
  'short-shifter': {
    // Ergonomic, no node impact
  },

  // ---------------------------------------------------------------------------
  // ADDITIONAL TIRE/WHEEL UPGRADES (alternate keys)
  // ---------------------------------------------------------------------------
  'competition-tires': {
    improves: ['tires.grip_coefficient'],
    modifies: ['tires.treadwear_rating', 'tires.wet_grip'],
    stresses: ['brakes.pad_temp_rating', 'brakes.rotor_thermal_mass', 'brakes.fluid_boiling_point'],
    compromises: ['tires.wet_grip'],
  },
  'performance-tires': {
    improves: ['tires.grip_coefficient'],
    modifies: ['tires.treadwear_rating'],
    stresses: ['brakes.pad_temp_rating'],
  },
  'lightweight-wheels': {
    improves: ['tires.grip_coefficient'],
  },

  // ---------------------------------------------------------------------------
  // ADDITIONAL TUNE UPGRADES (alternate keys)
  // ---------------------------------------------------------------------------
  'ecu-tune': {
    improves: ['powertrain.hp_output', 'powertrain.torque_output'],
    modifies: ['powertrain.boost_level', 'powertrain.timing_advance', 'powertrain.air_fuel_ratio'],
    stresses: ['fueling.injector_capacity', 'ignition.knock_threshold'],
  },
  'piggyback-tune': {
    improves: ['powertrain.hp_output'],
    modifies: ['powertrain.boost_level'],
    stresses: ['ignition.knock_threshold'],
  },

  // ---------------------------------------------------------------------------
  // TURBO KIT UPGRADES
  // ---------------------------------------------------------------------------
  'turbo-kit-single': {
    improves: ['induction.turbo_size', 'powertrain.hp_output', 'powertrain.torque_output'],
    modifies: ['powertrain.boost_level'],
    stresses: [
      'fueling.injector_capacity',
      'fueling.hpfp_capacity',
      'drivetrain.clutch_capacity',
      'cooling.oil_cooler_capacity',
      'induction.intercooler_capacity',
      'powertrain.bottom_end_strength',
    ],
    requires: ['fuel-system-upgrade'],
  },
  'turbo-kit-twin': {
    improves: ['induction.turbo_size', 'powertrain.hp_output', 'powertrain.torque_output'],
    modifies: ['powertrain.boost_level'],
    stresses: [
      'fueling.injector_capacity',
      'fueling.hpfp_capacity',
      'drivetrain.clutch_capacity',
      'drivetrain.trans_torque_limit',
      'drivetrain.axle_strength',
      'cooling.oil_cooler_capacity',
      'induction.intercooler_capacity',
      'powertrain.bottom_end_strength',
    ],
    requires: ['fuel-system-upgrade', 'forged-internals'],
  },

  // ---------------------------------------------------------------------------
  // WEIGHT REDUCTION
  // ---------------------------------------------------------------------------
  'interior-delete': {
    // Weight reduction, no specific node impact
  },
  'lightweight-battery': {
    // Weight reduction, no specific node impact
  },

  // ---------------------------------------------------------------------------
  // ENGINE SWAP KITS (reference only - complex integrations)
  // ---------------------------------------------------------------------------
  'engine-swap-kit-generic': {
    improves: ['powertrain.hp_output', 'powertrain.torque_output'],
    stresses: [
      'drivetrain.clutch_capacity',
      'drivetrain.trans_torque_limit',
      'drivetrain.axle_strength',
      'cooling.radiator_capacity',
      'cooling.oil_cooler_capacity',
    ],
  },
  'engine-ls-family': {
    improves: ['powertrain.hp_output', 'powertrain.torque_output'],
    stresses: [
      'drivetrain.clutch_capacity',
      'drivetrain.trans_torque_limit',
      'drivetrain.axle_strength',
    ],
  },
  'engine-2jz': {
    improves: ['powertrain.hp_output', 'powertrain.torque_output'],
    stresses: ['drivetrain.clutch_capacity', 'drivetrain.trans_torque_limit'],
  },
  'engine-b58': {
    improves: ['powertrain.hp_output', 'powertrain.torque_output'],
    stresses: ['drivetrain.clutch_capacity', 'fueling.injector_capacity'],
  },
  'engine-coyote': {
    improves: ['powertrain.hp_output', 'powertrain.torque_output'],
    stresses: ['drivetrain.clutch_capacity', 'drivetrain.trans_torque_limit'],
  },
  'engine-k-series': {
    improves: ['powertrain.hp_output', 'powertrain.torque_output'],
  },
  'engine-porsche-flat6': {
    improves: ['powertrain.hp_output', 'powertrain.torque_output'],
    stresses: ['cooling.oil_cooler_capacity'],
  },
  'engine-vr38dett': {
    improves: ['powertrain.hp_output', 'powertrain.torque_output'],
    stresses: [
      'drivetrain.clutch_capacity',
      'drivetrain.trans_torque_limit',
      'fueling.injector_capacity',
    ],
  },
};

// =============================================================================
// DEPENDENCY CHECK RULES
// =============================================================================

/**
 * Rules for checking upgrade dependencies
 * These are evaluated when a user selects upgrades to generate warnings
 */
export const dependencyRules = [
  // ---------------------------------------------------------------------------
  // BOOST INCREASE RULES
  // ---------------------------------------------------------------------------
  {
    id: 'boost-fuel-system',
    name: 'Fuel System for Boost',
    trigger: {
      upgradeKeys: ['stage2-tune', 'stage3-tune', 'turbo-upgrade-existing', 'pulley-tune-sc'],
    },
    check: (selectedUpgrades) => {
      const needsFuelUpgrade = selectedUpgrades.some((u) =>
        ['stage3-tune', 'turbo-upgrade-existing'].includes(u)
      );
      const hasFuelUpgrade = selectedUpgrades.includes('fuel-system-upgrade');

      if (needsFuelUpgrade && !hasFuelUpgrade) {
        return {
          severity: 'critical',
          message: 'High boost levels require upgraded fuel system',
          recommendation: ['fuel-system-upgrade'],
        };
      }
      return null;
    },
  },

  {
    id: 'boost-intercooler',
    name: 'Intercooler for Boost',
    trigger: {
      upgradeKeys: ['stage2-tune', 'stage3-tune', 'turbo-upgrade-existing', 'pulley-tune-sc'],
    },
    check: (selectedUpgrades) => {
      const needsIntercooler = selectedUpgrades.some((u) =>
        ['stage2-tune', 'stage3-tune', 'turbo-upgrade-existing'].includes(u)
      );
      const hasIntercooler = selectedUpgrades.includes('intercooler');

      if (needsIntercooler && !hasIntercooler) {
        return {
          severity: 'warning',
          message: 'Increased boost benefits significantly from upgraded intercooling',
          recommendation: ['intercooler'],
        };
      }
      return null;
    },
  },

  // Note: boost-charge-pipes check removed - charge-pipe-upgrade removed from modules

  // ---------------------------------------------------------------------------
  // POWER INCREASE → DRIVETRAIN RULES
  // ---------------------------------------------------------------------------
  {
    id: 'power-clutch',
    name: 'Clutch for Power',
    trigger: {
      upgradeKeys: [
        'supercharger-roots',
        'supercharger-centrifugal',
        'turbo-kit-single',
        'turbo-kit-twin',
        'stage3-tune',
      ],
    },
    check: (selectedUpgrades) => {
      const needsClutch = selectedUpgrades.some((u) =>
        [
          'supercharger-roots',
          'supercharger-centrifugal',
          'turbo-kit-single',
          'turbo-kit-twin',
          'stage3-tune',
        ].includes(u)
      );
      const hasClutch = selectedUpgrades.includes('clutch-upgrade');

      if (needsClutch && !hasClutch) {
        return {
          severity: 'warning',
          message: 'High torque builds typically need an upgraded clutch',
          recommendation: ['clutch-upgrade'],
        };
      }
      return null;
    },
  },

  // Note: power-bottom-end (forged-internals) check removed - specialist mod removed

  {
    id: 'power-cooling',
    name: 'Cooling for Power',
    trigger: {
      upgradeKeys: [
        'supercharger-roots',
        'supercharger-centrifugal',
        'turbo-kit-single',
        'turbo-kit-twin',
        'stage3-tune',
      ],
    },
    check: (selectedUpgrades) => {
      const needsCooling = selectedUpgrades.some((u) =>
        ['supercharger-roots', 'turbo-kit-twin', 'stage3-tune'].includes(u)
      );
      const hasOilCooler = selectedUpgrades.includes('oil-cooler');

      if (needsCooling && !hasOilCooler) {
        return {
          severity: 'warning',
          message: 'High power builds generate significant heat - oil cooler recommended',
          recommendation: ['oil-cooler'],
        };
      }
      return null;
    },
  },

  // ---------------------------------------------------------------------------
  // LOWERING → GEOMETRY RULES
  // ---------------------------------------------------------------------------
  {
    id: 'lowering-alignment',
    name: 'Alignment for Lowering',
    trigger: {
      upgradeKeys: ['lowering-springs', 'coilovers-street', 'coilovers-track'],
    },
    check: (selectedUpgrades) => {
      const hasLowering = selectedUpgrades.some((u) =>
        ['lowering-springs', 'coilovers-street', 'coilovers-track'].includes(u)
      );

      if (hasLowering) {
        return {
          severity: 'info',
          message: 'Lowering the car requires a new alignment for proper handling',
          recommendation: ['performance-alignment'],
        };
      }
      return null;
    },
  },

  {
    id: 'aggressive-drop-rollcenter',
    name: 'Roll Center for Aggressive Drop',
    trigger: {
      upgradeKeys: ['coilovers-track'],
    },
    // This is informational - can't directly recommend a part
    check: (selectedUpgrades) => {
      const hasTrackCoilovers = selectedUpgrades.includes('coilovers-track');

      if (hasTrackCoilovers) {
        return {
          severity: 'info',
          message:
            'Significant lowering may require roll center correction for optimal handling and steering feel',
          recommendation: [],
        };
      }
      return null;
    },
  },

  // ---------------------------------------------------------------------------
  // AERO BALANCE RULES
  // ---------------------------------------------------------------------------
  {
    id: 'aero-balance-front',
    name: 'Aero Balance - Front',
    trigger: {
      upgradeKeys: ['wing'],
    },
    check: (selectedUpgrades) => {
      const hasWing = selectedUpgrades.includes('wing');
      const hasSplitter = selectedUpgrades.includes('splitter');

      if (hasWing && !hasSplitter) {
        return {
          severity: 'info',
          message:
            'Rear wing without front aero may create understeer at high speed - consider a splitter',
          recommendation: ['splitter'],
        };
      }
      return null;
    },
  },

  {
    id: 'aero-balance-rear',
    name: 'Aero Balance - Rear',
    trigger: {
      upgradeKeys: ['splitter'],
    },
    check: (selectedUpgrades) => {
      const hasSplitter = selectedUpgrades.includes('splitter');
      const hasWing = selectedUpgrades.includes('wing');

      if (hasSplitter && !hasWing) {
        return {
          severity: 'info',
          message:
            'Front splitter without rear aero may create oversteer at high speed - consider a wing',
          recommendation: ['wing'],
        };
      }
      return null;
    },
  },

  // ---------------------------------------------------------------------------
  // HEADERS REQUIRE TUNE
  // ---------------------------------------------------------------------------
  {
    id: 'headers-tune',
    name: 'Tune for Headers',
    trigger: {
      upgradeKeys: ['headers'],
    },
    check: (selectedUpgrades) => {
      const hasHeaders = selectedUpgrades.includes('headers');
      const hasTune = selectedUpgrades.some((u) =>
        ['stage1-tune', 'stage2-tune', 'stage3-tune', 'dct-tune', 'piggyback-tuner'].includes(u)
      );

      if (hasHeaders && !hasTune) {
        return {
          severity: 'warning',
          message: 'ECU Tune required to achieve max performance gains from headers',
          recommendation: ['ecu-tune'],
        };
      }
      return null;
    },
  },
];

// =============================================================================
// QUERY FUNCTIONS
// =============================================================================

/**
 * Get all dependencies for a given upgrade
 * @param {string} upgradeKey - The upgrade key to check
 * @returns {Object} - Object with node-level impacts plus requires/recommends lists
 */
export function getUpgradeDependencies(upgradeKey) {
  const mapping = upgradeNodeMap[upgradeKey];
  if (!mapping) return null;

  return {
    improves: mapping.improves || [],
    modifies: mapping.modifies || [],
    stresses: mapping.stresses || [],
    invalidates: mapping.invalidates || [],
    compromises: mapping.compromises || [],
    requires: mapping.requires || [],
    recommends: mapping.recommends || [],
  };
}

/**
 * Check all dependency rules for a set of selected upgrades
 * @param {string[]} selectedUpgrades - Array of upgrade keys
 * @returns {Object[]} - Array of warnings/recommendations
 */
export function checkDependencies(selectedUpgrades) {
  const results = [];

  for (const rule of dependencyRules) {
    // Check if any trigger upgrades are selected
    const triggered = rule.trigger.upgradeKeys.some((key) => selectedUpgrades.includes(key));

    if (triggered) {
      const result = rule.check(selectedUpgrades);
      if (result) {
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          ...result,
        });
      }
    }
  }

  return results;
}

/**
 * Get all systems affected by a set of upgrades
 * @param {string[]} upgradeKeys - Array of upgrade keys
 * @returns {Set<string>} - Set of affected system keys
 */
export function getAffectedSystems(upgradeKeys) {
  const affectedSystems = new Set();

  for (const key of upgradeKeys) {
    const deps = getUpgradeDependencies(key);
    if (!deps) continue;

    // Collect all affected nodes
    const allNodes = [
      ...deps.improves,
      ...deps.modifies,
      ...deps.stresses,
      ...deps.invalidates,
      ...deps.compromises,
    ];

    // Extract system from node keys (e.g., 'powertrain.boost_level' -> 'powertrain')
    for (const nodeKey of allNodes) {
      const system = nodeKey.split('.')[0];
      if (systems[system]) {
        affectedSystems.add(system);
      }
    }
  }

  return affectedSystems;
}

/**
 * Generate a human-readable summary of what an upgrade affects
 * @param {string} upgradeKey - The upgrade key
 * @returns {Object} - Summary object with affected systems and warnings
 */
export function getUpgradeSummary(upgradeKey) {
  const deps = getUpgradeDependencies(upgradeKey);
  if (!deps) return null;

  const summary = {
    upgradeKey,
    improves: deps.improves.map((n) => nodes[n]?.name || n),
    modifies: deps.modifies.map((n) => nodes[n]?.name || n),
    stresses: deps.stresses.map((n) => nodes[n]?.name || n),
    invalidates: deps.invalidates.map((n) => nodes[n]?.name || n),
    compromises: deps.compromises.map((n) => nodes[n]?.name || n),
    requires: deps.requires,
    recommends: deps.recommends,
  };

  return summary;
}

const connectedTissueMatrix = {
  systems,
  nodes,
  edges,
  relationshipTypes,
  upgradeNodeMap,
  dependencyRules,
  getUpgradeDependencies,
  checkDependencies,
  getAffectedSystems,
  getUpgradeSummary,
};

export default connectedTissueMatrix;
