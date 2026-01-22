/**
 * Priority Vehicles for Data Enrichment
 * 
 * Based on: Research & Articles/Top 100 Sports Sedans by US Modification Market.md
 * 
 * Vehicles are ranked by market importance:
 * - Tier 1 (1-25): Highest priority - largest tuning ecosystems
 * - Tier 2 (26-50): High priority - significant market presence  
 * - Tier 3 (51-75): Medium priority - established communities
 * - Tier 4 (76-100): Lower priority - niche but relevant
 */

// Tier 1: Highest Priority (Ranks 1-25)
export const TIER_1 = [
  'honda-civic-si',           // All generations
  'honda-civic-type-r',       // FK8/FL5
  'subaru-wrx-sti',           // All generations
  'subaru-wrx',               // All generations
  'dodge-charger',            // R/T, SRT, Hellcat
  'dodge-challenger',         // R/T, SRT, Hellcat
  'bmw-335i-e90',
  'bmw-335i-e92',
  'volkswagen-jetta-gli',
  'bmw-m3-e46',
  'bmw-m3-e90',
  'bmw-m3-e92',
  'bmw-m3-f80',
  'audi-s4-b8',
  'mitsubishi-lancer-evolution',
  'mitsubishi-evo-x',
  'infiniti-g35',
  'infiniti-g37',
  'mercedes-amg-c63-w204',
  'mercedes-c63',
  'acura-integra-type-r',
  'acura-tsx',
  'kia-stinger',
  'honda-accord',             // 10th gen 2.0T
  'mercedes-amg-c63-w205',
  'lexus-is300',
];

// Tier 2: High Priority (Ranks 26-50)
export const TIER_2 = [
  'genesis-g70',
  'audi-s4-b5',
  'bmw-340i',
  'bmw-m340i',
  'audi-rs3',
  'cadillac-cts-v',           // Gen 2
  'infiniti-q50',
  'hyundai-elantra-n',
  'pontiac-g8',
  'mercedes-amg-e63',
  'audi-s3',
  'ford-taurus-sho',
  'mazdaspeed6',
  'cadillac-ats-v',
  'nissan-maxima',
  'bmw-m5-e39',
  'bmw-m5-e60',
  'chevrolet-ss',
  'mercedes-amg-cla45',
  'audi-rs5',
  'acura-tlx-type-s',
  'ford-fusion-sport',
  'cadillac-ct5-v-blackwing',
  'cadillac-ct4-v-blackwing',
  'kia-k5-gt',
];

// Tier 3: Medium Priority (Ranks 51-75)
export const TIER_3 = [
  'nissan-sentra-se-r',
  'bmw-m3-e36',
  'lexus-is350',
  'lexus-is-f',
  'mazda-mazda3-turbo',
  'nissan-altima-se-r',
  'audi-rs6',
  'subaru-legacy-gt',
  'toyota-camry-trd',
  'pontiac-gto',
  'ford-crown-victoria',
  'mazda-mazda6-turbo',
  'acura-tl-type-s',
  'bmw-m3-e30',
  'porsche-panamera-turbo',
  'chevrolet-impala-ss',
  'alfa-romeo-giulia-quadrifoglio',
  'buick-grand-national',
  'volkswagen-passat-r36',
  'mitsubishi-lancer-ralliart',
  'jaguar-xe-s',
  'acura-integra-type-s',
  'toyota-gr-corolla',
  'bmw-m5-f10',
  'bmw-m5-f90',
];

// Tier 4: Lower Priority (Ranks 76-100)
export const TIER_4 = [
  'mercedes-amg-cla45-c118',
  'mercedes-amg-e63-w212',
  'audi-a4-b8',
  'subaru-wrx-vb',
  'honda-civic-si-fl4',
  'acura-integra-de1',
  'genesis-g70-2.0t',
  'lexus-gs350',
  'lexus-gs-f',
  'bmw-m3-g80',
  'audi-s4-b9',
  'audi-s4-b6',
  'audi-s4-b7',
  'cadillac-cts-v-gen3',
  'pontiac-g8-gxp',
  'honda-civic-si-fc1',
  'honda-civic-si-fb6',
  'honda-civic-si-fg2',
];

// All tiers combined
export const ALL_PRIORITY = [...TIER_1, ...TIER_2, ...TIER_3, ...TIER_4];

/**
 * Get priority tier for a car slug
 * @param {string} slug - Car slug
 * @returns {number} Tier (1-4) or 5 for non-priority
 */
export function getPriorityTier(slug) {
  const slugLower = slug.toLowerCase();
  
  // Check each tier using partial matching
  for (const pattern of TIER_1) {
    if (slugLower.includes(pattern) || pattern.includes(slugLower.split('-').slice(0, 3).join('-'))) {
      return 1;
    }
  }
  for (const pattern of TIER_2) {
    if (slugLower.includes(pattern) || pattern.includes(slugLower.split('-').slice(0, 3).join('-'))) {
      return 2;
    }
  }
  for (const pattern of TIER_3) {
    if (slugLower.includes(pattern) || pattern.includes(slugLower.split('-').slice(0, 3).join('-'))) {
      return 3;
    }
  }
  for (const pattern of TIER_4) {
    if (slugLower.includes(pattern) || pattern.includes(slugLower.split('-').slice(0, 3).join('-'))) {
      return 4;
    }
  }
  
  return 5; // Not in priority list
}

/**
 * Check if a car matches any priority pattern
 * @param {string} carName - Full car name
 * @returns {boolean}
 */
export function isPriorityVehicle(carName) {
  const nameLower = carName.toLowerCase();
  
  const priorityKeywords = [
    'civic si', 'civic type r', 'wrx sti', 'wrx',
    'charger', 'challenger', '335i', 'jetta gli',
    'm3', 'm5', 's4', 's3', 'rs3', 'rs5', 'rs6',
    'lancer evolution', 'evo x', 'evo viii', 'evo ix',
    'g35', 'g37', 'q50', 'c63', 'e63', 'cla 45',
    'stinger', 'g70', 'elantra n', 'veloster n',
    'cts-v', 'ct5-v', 'ct4-v', 'ats-v',
    'taurus sho', 'mazdaspeed', '340i', 'm340i',
    'is300', 'is350', 'is-f', 'gs-f', 'gs350',
    'tsx', 'tlx type s', 'tl type-s', 'integra type',
    'g8', 'ss', 'gto', 'impala ss', 'fusion sport',
    'legacy gt', 'mazda3 turbo', 'mazda6 turbo',
    'camry trd', 'giulia', 'panamera', 'grand national',
    'gr corolla', 'crown victoria'
  ];
  
  return priorityKeywords.some(kw => nameLower.includes(kw));
}
