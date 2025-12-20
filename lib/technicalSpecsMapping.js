/**
 * Technical Specs Mapping
 * 
 * Maps nodes from connectedTissueMatrix.js (Technical Reference) to
 * encyclopedia topics (Automotive Systems). This enables merging
 * technical specifications into the topic articles without duplicating content.
 * 
 * The Technical Reference section is being eliminated; its unique content
 * (specifications, units, descriptions) is merged into Automotive Systems topics.
 * 
 * @module technicalSpecsMapping
 */

import { nodes } from '@/data/connectedTissueMatrix';

// =============================================================================
// NODE TO TOPIC MAPPING
// =============================================================================

/**
 * Maps connectedTissueMatrix node keys to encyclopedia topic slugs.
 * Each CTM node's content will be merged into the corresponding topic as technicalSpecs.
 */
export const nodeToTopicMapping = {
  // ---------------------------------------------------------------------------
  // POWERTRAIN NODES → Engine topics
  // ---------------------------------------------------------------------------
  'powertrain.boost_level': 'turbo-fundamentals',
  'powertrain.timing_advance': 'ignition-timing',
  'powertrain.air_fuel_ratio': 'fuel-octane',
  'powertrain.cylinder_pressure': 'displacement',
  'powertrain.torque_output': 'displacement',
  'powertrain.hp_output': 'displacement',
  'powertrain.rev_limit': 'cam-profiles',
  'powertrain.bottom_end_strength': 'connecting-rods',
  'powertrain.oiling_system_margin': 'oil-cooling',

  // ---------------------------------------------------------------------------
  // FUELING NODES → Fuel System topics
  // ---------------------------------------------------------------------------
  'fueling.injector_capacity': 'injector-sizing',
  'fueling.lpfp_capacity': 'lpfp-hpfp',
  'fueling.hpfp_capacity': 'lpfp-hpfp',
  'fueling.fuel_pressure': 'lpfp-hpfp',
  'fueling.fuel_octane': 'fuel-octane',

  // ---------------------------------------------------------------------------
  // IGNITION NODES → Engine Management topics
  // ---------------------------------------------------------------------------
  'ignition.spark_energy': 'ignition-timing',
  'ignition.plug_heat_range': 'ignition-timing',
  'ignition.knock_threshold': 'ignition-timing',
  'ignition.coil_dwell': 'ignition-timing',

  // ---------------------------------------------------------------------------
  // EXHAUST NODES → Exhaust topics
  // ---------------------------------------------------------------------------
  'exhaust.backpressure': 'downpipe-importance',
  'exhaust.flow_capacity': 'exhaust-sound',
  'exhaust.cat_converter_state': 'cat-types',
  'exhaust.header_type': 'header-design',

  // ---------------------------------------------------------------------------
  // COOLING NODES → Engine Cooling topics
  // ---------------------------------------------------------------------------
  'cooling.radiator_capacity': 'coolant-system',
  'cooling.oil_cooler_capacity': 'oil-cooling',
  'cooling.trans_cooler_capacity': 'automatic-transmission', // Drivetrain
  'cooling.diff_cooler_capacity': 'differential-types', // Drivetrain
  'cooling.brake_cooling': 'brake-cooling-ducts', // Brakes

  // ---------------------------------------------------------------------------
  // INDUCTION NODES → Air Intake & Forced Induction topics
  // ---------------------------------------------------------------------------
  'induction.turbo_size': 'turbo-fundamentals',
  'induction.wastegate_capacity': 'wastegate-bov',
  'induction.bov_capacity': 'wastegate-bov',
  'induction.intercooler_capacity': 'intercooler-types',
  'induction.charge_pipe_strength': 'turbo-fundamentals',
  'induction.sc_pulley_size': 'supercharger-types',

  // ---------------------------------------------------------------------------
  // DRIVETRAIN NODES → Drivetrain topics
  // ---------------------------------------------------------------------------
  'drivetrain.clutch_capacity': 'clutch-basics',
  'drivetrain.trans_torque_limit': 'manual-transmission',
  'drivetrain.diff_torque_limit': 'differential-types',
  'drivetrain.axle_strength': 'axle-strength',
  'drivetrain.driveshaft_rating': 'driveshaft-cv-joints',
  'drivetrain.flywheel_mass': 'flywheel-mass',

  // ---------------------------------------------------------------------------
  // BRAKE NODES → Brakes topics
  // ---------------------------------------------------------------------------
  'brakes.pad_temp_rating': 'pad-compounds',
  'brakes.rotor_thermal_mass': 'rotor-design',
  'brakes.rotor_size': 'rotor-design',
  'brakes.caliper_piston_area': 'bbk-basics',
  'brakes.fluid_boiling_point': 'brake-fluid-types',
  'brakes.line_expansion': 'brake-fluid-types',
  'brakes.brake_bias': 'bbk-basics',
  'brakes.abs_calibration': 'abs-systems',

  // ---------------------------------------------------------------------------
  // SUSPENSION NODES → Suspension & Steering topics
  // ---------------------------------------------------------------------------
  'suspension.spring_rate_front': 'spring-rate-basics',
  'suspension.spring_rate_rear': 'spring-rate-basics',
  'suspension.damper_range': 'damper-valving',
  'suspension.ride_height': 'coilover-adjustment',
  'suspension.bump_travel': 'damper-valving',
  'suspension.droop_travel': 'damper-valving',
  'suspension.sway_bar_rate_front': 'sway-bar-tuning',
  'suspension.sway_bar_rate_rear': 'sway-bar-tuning',

  // ---------------------------------------------------------------------------
  // CHASSIS NODES → Suspension & Steering topics
  // ---------------------------------------------------------------------------
  'chassis.roll_center_height': 'alignment-settings',
  'chassis.camber_front': 'alignment-settings',
  'chassis.camber_rear': 'alignment-settings',
  'chassis.toe_front': 'alignment-settings',
  'chassis.toe_rear': 'alignment-settings',
  'chassis.caster': 'alignment-settings',
  'chassis.ackermann': 'steering-feel',
  'chassis.bump_steer': 'steering-feel',
  'chassis.control_arm_angle': 'control-arm-types',
  'chassis.rigidity': 'chassis-bracing',

  // ---------------------------------------------------------------------------
  // TIRES NODES → Suspension (Tires) topics
  // ---------------------------------------------------------------------------
  'tires.grip_coefficient': 'tire-compound-construction',
  'tires.treadwear_rating': 'tire-compound-construction',
  'tires.heat_cycles': 'tire-compound-construction',
  'tires.wet_grip': 'tire-compound-construction',
  'tires.section_width': 'tire-sizing',
  'tires.wheel_offset': 'wheel-fitment',

  // ---------------------------------------------------------------------------
  // AERO NODES → Aerodynamics topics
  // ---------------------------------------------------------------------------
  'aero.front_downforce': 'splitter-function',
  'aero.rear_downforce': 'wing-vs-spoiler',
  'aero.aero_balance': 'aero-balance-tuning',
  'aero.drag_coefficient': 'downforce-drag',

  // ---------------------------------------------------------------------------
  // ELECTRONICS NODES → Engine Management topics
  // ---------------------------------------------------------------------------
  'electronics.traction_control': 'ecu-basics',
  'electronics.stability_control': 'ecu-basics',
  'electronics.abs_type': 'abs-systems',

  // ---------------------------------------------------------------------------
  // SAFETY NODES → These move to Build Guides, not merged here
  // ---------------------------------------------------------------------------
  // 'safety.rollover_protection' → Track Day Prep guide
  // 'safety.occupant_restraint' → Track Day Prep guide
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all CTM nodes that map to a specific topic slug
 * @param {string} topicSlug - The encyclopedia topic slug
 * @returns {Object[]} Array of node objects with their specs
 */
export function getNodesForTopic(topicSlug) {
  const matchingNodes = [];
  
  for (const [nodeKey, mappedSlug] of Object.entries(nodeToTopicMapping)) {
    if (mappedSlug === topicSlug && nodes[nodeKey]) {
      matchingNodes.push({
        key: nodeKey,
        ...nodes[nodeKey],
      });
    }
  }
  
  return matchingNodes;
}

/**
 * Build technicalSpecs object for a topic from its mapped CTM nodes
 * @param {string} topicSlug - The encyclopedia topic slug
 * @returns {Object|null} technicalSpecs object or null if no specs
 */
export function buildTechnicalSpecs(topicSlug) {
  const mappedNodes = getNodesForTopic(topicSlug);
  
  if (mappedNodes.length === 0) {
    return null;
  }
  
  const specifications = [];
  const systemInfo = new Set();
  
  for (const node of mappedNodes) {
    // Add specification entry
    specifications.push({
      name: node.name,
      description: node.description,
      unit: node.unit || null,
      applicableEngines: node.applicableEngines || null,
    });
    
    // Track which system this comes from
    if (node.system) {
      systemInfo.add(node.system);
    }
  }
  
  return {
    specifications,
    sourceSystem: Array.from(systemInfo).join(', '),
    mergedFromTechnicalReference: true,
  };
}

/**
 * Get all topic slugs that have technical specs mapped
 * @returns {string[]} Array of topic slugs with specs
 */
export function getTopicsWithSpecs() {
  return [...new Set(Object.values(nodeToTopicMapping))];
}

/**
 * Get mapping statistics
 * @returns {Object} Stats about the mapping
 */
export function getMappingStats() {
  const totalNodes = Object.keys(nodes).length;
  const mappedNodes = Object.keys(nodeToTopicMapping).length;
  const uniqueTopics = new Set(Object.values(nodeToTopicMapping)).size;
  
  // Count nodes by system
  const nodesBySystem = {};
  for (const nodeKey of Object.keys(nodeToTopicMapping)) {
    const system = nodeKey.split('.')[0];
    nodesBySystem[system] = (nodesBySystem[system] || 0) + 1;
  }
  
  return {
    totalCTMNodes: totalNodes,
    mappedNodes,
    unmappedNodes: totalNodes - mappedNodes,
    uniqueTopicsReceivingSpecs: uniqueTopics,
    nodesBySystem,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  nodeToTopicMapping,
  getNodesForTopic,
  buildTechnicalSpecs,
  getTopicsWithSpecs,
  getMappingStats,
};












