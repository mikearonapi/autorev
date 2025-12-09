/**
 * Expert Feedback Utilities
 * 
 * Maps stock weakness/strength tags from expert reviews to
 * upgrade recommendations and known issues.
 */

// Map weakness tags to upgrade category suggestions
export const WEAKNESS_TO_UPGRADE_MAP = {
  // Braking related
  'brakes': ['brake-pads', 'brake-rotors', 'brake-fluid', 'big-brake-kit'],
  'brake-fade': ['brake-pads', 'brake-fluid', 'brake-cooling', 'big-brake-kit'],
  'stopping-power': ['brake-pads', 'brake-rotors', 'big-brake-kit'],
  'brake-feel': ['brake-pads', 'brake-lines', 'master-cylinder'],
  
  // Cooling related
  'cooling': ['oil-cooler', 'radiator', 'intercooler', 'cooling-ducts'],
  'heat-management': ['oil-cooler', 'radiator', 'heat-wrap', 'hood-vents'],
  'overheating': ['oil-cooler', 'radiator', 'fan-upgrade', 'coolant'],
  'heat-soak': ['intercooler', 'cold-air-intake', 'heat-shielding'],
  
  // Handling/Suspension
  'body-roll': ['sway-bars', 'coilovers', 'springs'],
  'understeer': ['sway-bars', 'alignment', 'tires', 'suspension-geometry'],
  'oversteer': ['sway-bars', 'alignment', 'traction-control', 'differential'],
  'suspension': ['coilovers', 'springs', 'dampers', 'bushings'],
  'compliance': ['bushings', 'solid-mounts', 'suspension-arms'],
  'ride-quality': ['dampers', 'springs', 'tires'],
  
  // Traction
  'traction': ['tires', 'differential', 'traction-control', 'suspension'],
  'wheelspin': ['tires', 'differential', 'launch-control'],
  'grip': ['tires', 'suspension', 'aero', 'alignment'],
  
  // Power/Engine
  'power-delivery': ['tune', 'throttle-controller', 'intake', 'exhaust'],
  'turbo-lag': ['tune', 'intake', 'downpipe', 'blow-off-valve'],
  'throttle-response': ['throttle-controller', 'tune', 'intake'],
  'rev-limit': ['tune', 'valve-springs', 'engine-internals'],
  
  // Sound/NVH
  'sound': ['exhaust', 'headers', 'intake'],
  'exhaust-note': ['exhaust', 'headers', 'resonator-delete'],
  'cabin-noise': ['insulation', 'window-seals', 'sound-deadening'],
  'nvh': ['bushings', 'insulation', 'engine-mounts'],
  
  // Interior/Comfort
  'seats': ['aftermarket-seats', 'seat-brackets', 'harnesses'],
  'bolstering': ['aftermarket-seats', 'seat-inserts'],
  'interior-quality': ['trim-upgrades', 'steering-wheel', 'shift-knob'],
  'infotainment': ['head-unit', 'carplay', 'speakers'],
  
  // Visibility/Safety
  'visibility': ['mirrors', 'camera', 'lighting'],
  'lighting': ['headlights', 'foglights', 'led-conversion'],
  
  // Transmission
  'shift-feel': ['short-shifter', 'shifter-bushings', 'transmission-fluid'],
  'gear-ratios': ['final-drive', 'transmission-swap'],
  'clutch': ['clutch-kit', 'flywheel', 'clutch-line'],
};

// Map strength tags to highlight areas
export const STRENGTH_CATEGORIES = {
  'handling': 'Chassis & Dynamics',
  'steering': 'Chassis & Dynamics',
  'balance': 'Chassis & Dynamics',
  'feedback': 'Driver Connection',
  'engagement': 'Driver Connection',
  'sound': 'Emotional Experience',
  'exhaust': 'Emotional Experience',
  'engine-character': 'Emotional Experience',
  'reliability': 'Ownership',
  'value': 'Ownership',
  'community': 'Ownership',
  'power': 'Performance',
  'acceleration': 'Performance',
  'track-capability': 'Performance',
};

/**
 * Get upgrade suggestions based on weakness tags
 * @param {string[]} weaknessTags - Array of weakness tags from expert reviews
 * @returns {Object} Object with categories and suggested upgrades
 */
export function getUpgradeSuggestions(weaknessTags) {
  const suggestions = new Map();
  
  for (const tag of (weaknessTags || [])) {
    const normalizedTag = tag.toLowerCase().replace(/\s+/g, '-');
    
    // Check direct match
    if (WEAKNESS_TO_UPGRADE_MAP[normalizedTag]) {
      for (const upgrade of WEAKNESS_TO_UPGRADE_MAP[normalizedTag]) {
        suggestions.set(upgrade, (suggestions.get(upgrade) || 0) + 1);
      }
    }
    
    // Check partial matches
    for (const [key, upgrades] of Object.entries(WEAKNESS_TO_UPGRADE_MAP)) {
      if (normalizedTag.includes(key) || key.includes(normalizedTag)) {
        for (const upgrade of upgrades) {
          suggestions.set(upgrade, (suggestions.get(upgrade) || 0) + 0.5);
        }
      }
    }
  }
  
  // Sort by relevance and return top suggestions
  return Array.from(suggestions.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([upgrade]) => upgrade);
}

/**
 * Categorize strength tags by area
 * @param {string[]} strengthTags - Array of strength tags from expert reviews
 * @returns {Object} Object with categories and their strengths
 */
export function categorizeStrengths(strengthTags) {
  const categories = {};
  
  for (const tag of (strengthTags || [])) {
    const normalizedTag = tag.toLowerCase().replace(/\s+/g, '-');
    let category = 'General';
    
    // Find matching category
    for (const [key, cat] of Object.entries(STRENGTH_CATEGORIES)) {
      if (normalizedTag.includes(key) || key.includes(normalizedTag)) {
        category = cat;
        break;
      }
    }
    
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(tag);
  }
  
  return categories;
}

/**
 * Format weakness tag for display
 * @param {string} tag - Raw weakness tag
 * @returns {string} Formatted tag for display
 */
export function formatTag(tag) {
  if (!tag) return '';
  return tag
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get severity level for a weakness based on mention count
 * @param {number} count - Number of times mentioned across reviews
 * @param {number} totalReviews - Total number of reviews
 * @returns {'high'|'medium'|'low'} Severity level
 */
export function getWeaknessSeverity(count, totalReviews) {
  const ratio = count / Math.max(totalReviews, 1);
  if (ratio >= 0.5) return 'high';
  if (ratio >= 0.25) return 'medium';
  return 'low';
}

