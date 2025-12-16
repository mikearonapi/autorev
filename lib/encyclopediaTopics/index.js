/**
 * Encyclopedia Topics - Complete Content Index
 * 
 * This module exports all encyclopedia topic content organized by system.
 * Import this to get all topics or import individual system files as needed.
 * 
 * CONTENT STATUS:
 * - ENGINE: 14 topics (complete)
 * - COOLING: 3 topics (complete)
 * - DRIVETRAIN: 17 topics (complete)
 * - FUEL SYSTEM: 11 topics (complete)
 * - ENGINE MANAGEMENT: 14 topics (complete)
 * - AIR INTAKE & FI: 12 topics (complete)
 * - EXHAUST: 8 topics (complete)
 * - SUSPENSION: 27 topics (complete)
 * - AERODYNAMICS: 11 topics (complete)
 * - BRAKES: 19 topics (complete)
 * 
 * TOTAL: 136 topics
 * COMPLETE: 136 topics (100%)
 * 
 * @module encyclopediaTopics
 */

import { engineTopics } from './engineTopics.js';
import { coolingTopics } from './coolingTopics.js';
import { drivetrainTopics } from './drivetrainTopics.js';
import { fuelSystemTopics } from './fuelSystemTopics.js';
import { engineManagementTopics } from './engineManagementTopics.js';
import { intakeTopics } from './intakeTopics.js';
import { exhaustTopics } from './exhaustTopics.js';
import { suspensionTopics } from './suspensionTopics.js';
import { aeroTopics } from './aeroTopics.js';
import { brakeTopics } from './brakeTopics.js';

// Export individual system topics
export { engineTopics } from './engineTopics.js';
export { coolingTopics } from './coolingTopics.js';
export { drivetrainTopics } from './drivetrainTopics.js';
export { fuelSystemTopics } from './fuelSystemTopics.js';
export { engineManagementTopics } from './engineManagementTopics.js';
export { intakeTopics } from './intakeTopics.js';
export { exhaustTopics } from './exhaustTopics.js';
export { suspensionTopics } from './suspensionTopics.js';
export { aeroTopics } from './aeroTopics.js';
export { brakeTopics } from './brakeTopics.js';

// Combined raw topics from all systems (before validation)
const rawTopics = [
  ...engineTopics,
  ...coolingTopics,
  ...drivetrainTopics,
  ...fuelSystemTopics,
  ...engineManagementTopics,
  ...intakeTopics,
  ...exhaustTopics,
  ...suspensionTopics,
  ...aeroTopics,
  ...brakeTopics,
];

// Valid upgrade keys from upgrade_education (kept in sync manually)
// These are the 77 valid keys in data/upgradeEducation.js
const VALID_UPGRADE_KEYS = new Set([
  'cold-air-intake', 'high-flow-air-filter', 'throttle-body', 'intake-manifold',
  'ecu-tune', 'piggyback-tune', 'camshafts', 'ported-heads', 'hpfp-upgrade',
  'fuel-system-upgrade', 'charge-pipe-upgrade', 'forged-internals', 'stroker-kit',
  'cat-back-exhaust', 'headers', 'downpipe', 'resonator-delete', 'muffler-delete',
  'supercharger-centrifugal', 'supercharger-roots', 'turbo-kit-single', 'turbo-kit-twin',
  'turbo-upgrade-existing', 'pulley-tune-sc', 'intercooler', 'heat-exchanger-sc',
  'coilovers', 'lowering-springs', 'sway-bars', 'strut-tower-brace', 'subframe-connectors',
  'control-arms', 'polyurethane-bushings', 'performance-alignment', 'brake-pads-performance',
  'brake-rotors', 'big-brake-kit', 'braided-brake-lines', 'high-temp-brake-fluid',
  'brake-cooling-ducts', 'performance-tires', 'competition-tires', 'lightweight-wheels',
  'wheel-spacers', 'oil-cooler', 'radiator-upgrade', 'trans-cooler', 'diff-cooler',
  'high-temp-fluids', 'front-splitter', 'rear-wing', 'rear-diffuser', 'canards',
  'undertray', 'clutch-upgrade', 'lightweight-flywheel', 'limited-slip-diff',
  'short-shifter', 'driveshaft-upgrade', 'axles-halfshafts', 'racing-harness',
  'racing-seat', 'roll-bar', 'roll-cage', 'fire-extinguisher', 'helmet',
  'lightweight-battery', 'carbon-fiber-hood', 'interior-delete', 'engine-ls-family',
  'engine-coyote', 'engine-2jz', 'engine-b58', 'engine-k-series', 'engine-vr38dett',
  'engine-porsche-flat6', 'engine-swap-kit-generic',
]);

// Build valid topic slugs set
const validTopicSlugs = new Set(rawTopics.map(t => t.slug));

/**
 * Sanitize a topic by filtering invalid references
 * @param {Object} topic - Raw topic object
 * @returns {Object} - Sanitized topic with only valid references
 */
function sanitizeTopic(topic) {
  return {
    ...topic,
    // Filter relatedUpgradeKeys to only valid ones
    relatedUpgradeKeys: topic.relatedUpgradeKeys
      ? topic.relatedUpgradeKeys.filter(key => VALID_UPGRADE_KEYS.has(key))
      : undefined,
    // Filter relatedTopics to only existing topic slugs
    relatedTopics: topic.relatedTopics
      ? topic.relatedTopics.filter(slug => validTopicSlugs.has(slug))
      : undefined,
  };
}

// Combined topics from all systems (sanitized)
export const allTopics = rawTopics.map(sanitizeTopic);

// Topic lookup by slug
export const topicsBySlug = Object.fromEntries(
  allTopics.map(topic => [topic.slug, topic])
);

// Topics grouped by system
export const topicsBySystem = {
  engine: allTopics.filter(t => t.system === 'engine'),
  cooling: allTopics.filter(t => t.system === 'cooling'),
  drivetrain: allTopics.filter(t => t.system === 'drivetrain'),
  'fuel-system': allTopics.filter(t => t.system === 'fuel-system'),
  'engine-management': allTopics.filter(t => t.system === 'engine-management'),
  'intake-forced-induction': allTopics.filter(t => t.system === 'intake-forced-induction'),
  exhaust: allTopics.filter(t => t.system === 'exhaust'),
  'suspension-steering': allTopics.filter(t => t.system === 'suspension-steering'),
  aerodynamics: allTopics.filter(t => t.system === 'aerodynamics'),
  brakes: allTopics.filter(t => t.system === 'brakes'),
};

// Statistics
export const topicStats = {
  engine: topicsBySystem.engine.length,
  cooling: topicsBySystem.cooling.length,
  drivetrain: topicsBySystem.drivetrain.length,
  'fuel-system': topicsBySystem['fuel-system'].length,
  'engine-management': topicsBySystem['engine-management'].length,
  'intake-forced-induction': topicsBySystem['intake-forced-induction'].length,
  exhaust: topicsBySystem.exhaust.length,
  'suspension-steering': topicsBySystem['suspension-steering'].length,
  aerodynamics: topicsBySystem.aerodynamics.length,
  brakes: topicsBySystem.brakes.length,
  total: allTopics.length,
  complete: allTopics.filter(t => t.status === 'complete').length,
  stub: allTopics.filter(t => t.status === 'stub').length,
};

/**
 * Build reverse mapping from upgrade keys to topic slugs
 * @returns {Record<string, string[]>} Map of upgrade key to array of topic slugs
 */
export function buildUpgradeKeyToTopics() {
  const mapping = {};
  
  allTopics.forEach(topic => {
    if (topic.relatedUpgradeKeys) {
      topic.relatedUpgradeKeys.forEach(key => {
        if (!mapping[key]) mapping[key] = [];
        if (!mapping[key].includes(topic.slug)) {
          mapping[key].push(topic.slug);
        }
      });
    }
  });
  
  return mapping;
}

// Pre-built upgrade key mapping
export const upgradeKeyToTopics = buildUpgradeKeyToTopics();

/**
 * Get a topic by its slug
 * @param {string} slug - Topic slug
 * @returns {Object|null} Topic object or null if not found
 */
export function getTopicBySlug(slug) {
  return topicsBySlug[slug] || null;
}

/**
 * Get all topics for a specific system
 * @param {string} systemSlug - System slug
 * @returns {Array} Array of topics
 */
export function getTopicsForSystem(systemSlug) {
  return topicsBySystem[systemSlug] || [];
}

/**
 * Get topics related to a specific topic
 * @param {string} slug - Topic slug
 * @returns {Array} Array of related topic objects
 */
export function getRelatedTopics(slug) {
  const topic = getTopicBySlug(slug);
  if (!topic || !topic.relatedTopics) return [];
  
  return topic.relatedTopics
    .map(relatedSlug => getTopicBySlug(relatedSlug))
    .filter(Boolean);
}

export default {
  allTopics,
  topicsBySlug,
  topicsBySystem,
  topicStats,
  getTopicBySlug,
  getTopicsForSystem,
  getRelatedTopics,
};

