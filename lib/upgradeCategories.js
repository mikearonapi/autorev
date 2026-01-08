/**
 * Upgrade Categories - Single Source of Truth
 * 
 * This module defines the canonical upgrade categories used across the entire app.
 * Both UpgradeCenter and BuildModsList (and any future components) should import from here.
 * 
 * DO NOT duplicate these definitions elsewhere.
 */

// =============================================================================
// SVG ICON PATHS
// =============================================================================

/**
 * SVG path data for category icons
 * These are the raw SVG elements - components can wrap them as needed
 */
export const CATEGORY_ICONS = {
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  turbo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a10 10 0 0 1 10 10"/>
      <path d="M12 12l4-4"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  disc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  thermometer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  ),
  circle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  ),
  wind: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M9 21V9"/>
    </svg>
  ),
};

// =============================================================================
// CANONICAL UPGRADE CATEGORIES
// =============================================================================

/**
 * The canonical list of upgrade categories used in the UI.
 * Order matters - this is the display order.
 */
export const UPGRADE_CATEGORIES = [
  { key: 'power', label: 'Power', icon: 'bolt', color: '#f59e0b' },
  { key: 'forcedInduction', label: 'Turbo/SC', icon: 'turbo', color: '#ef4444' },
  { key: 'chassis', label: 'Chassis', icon: 'target', color: '#10b981' },
  { key: 'brakes', label: 'Brakes', icon: 'disc', color: '#dc2626' },
  { key: 'cooling', label: 'Cooling', icon: 'thermometer', color: '#3b82f6' },
  { key: 'wheels', label: 'Wheels', icon: 'circle', color: '#8b5cf6' },
  { key: 'aero', label: 'Aero', icon: 'wind', color: '#06b6d4' },
  { key: 'drivetrain', label: 'Drivetrain', icon: 'settings', color: '#f97316' },
];

/**
 * "Other" category for items that don't fit elsewhere
 */
export const OTHER_CATEGORY = { key: 'other', label: 'Other', icon: 'grid', color: '#6b7280' };

/**
 * All categories including "other"
 */
export const ALL_CATEGORIES = [...UPGRADE_CATEGORIES, OTHER_CATEGORY];

// =============================================================================
// CATEGORY LOOKUP HELPERS
// =============================================================================

/**
 * Map for O(1) category lookup by key
 */
export const CATEGORY_BY_KEY = Object.fromEntries(
  ALL_CATEGORIES.map(cat => [cat.key, cat])
);

/**
 * Get category info by key
 * @param {string} key - Category key
 * @returns {Object|null} Category object or null
 */
export function getCategoryByKey(key) {
  return CATEGORY_BY_KEY[key] || null;
}

/**
 * Get icon component for a category
 * @param {string} iconName - Icon name from category
 * @returns {JSX.Element|null} Icon SVG element
 */
export function getCategoryIcon(iconName) {
  return CATEGORY_ICONS[iconName] || null;
}

// =============================================================================
// CATEGORY NORMALIZATION
// =============================================================================

/**
 * Maps legacy/granular category keys to canonical category keys.
 * This ensures backward compatibility with old data.
 */
const CATEGORY_ALIAS_MAP = {
  // Power category consolidation (intake, exhaust, ecu, fuel, engine → power)
  'intake': 'power',
  'exhaust': 'power',
  'ecu': 'power',
  'tune': 'power',
  'tuning': 'power',
  'flash': 'power',
  'engine': 'power',
  'fuel': 'power',
  'fuel-system': 'power',
  'ecu-tuning': 'power',
  
  // Forced Induction (turbo, supercharger, intercooler → forcedInduction)
  'turbo': 'forcedInduction',
  'supercharger': 'forcedInduction',
  'intercooler': 'forcedInduction',
  'boost': 'forcedInduction',
  'forced-induction': 'forcedInduction',
  'forced_induction': 'forcedInduction',
  'forcedinduction': 'forcedInduction',
  'intake-fi': 'forcedInduction',
  
  // Chassis (suspension → chassis)
  'suspension': 'chassis',
  'handling': 'chassis',
  'coilovers': 'chassis',
  
  // Direct mappings (no change needed)
  'brakes': 'brakes',
  'cooling': 'cooling',
  'aero': 'aero',
  'aerodynamics': 'aero',
  'drivetrain': 'drivetrain',
  
  // Wheels (includes tires)
  'wheels': 'wheels',
  'tires': 'wheels',
  
  // Drivetrain aliases
  'clutch': 'drivetrain',
  'diff': 'drivetrain',
  'transmission': 'drivetrain',
  'lsd': 'drivetrain',
  
  // Other (catch-all)
  'interior': 'other',
  'exterior': 'other',
  'safety': 'other',
  'weightreduction': 'other',
  'weight-reduction': 'other',
  'engineswaps': 'other',
  'engine-swaps': 'other',
  'other': 'other',
};

/**
 * Normalize a category key to one of the canonical categories.
 * Handles legacy data and various naming conventions.
 * 
 * @param {string} category - Raw category key from data
 * @returns {string} Canonical category key
 */
export function normalizeCategory(category) {
  if (!category) return 'other';
  
  const normalized = category.toLowerCase().trim();
  
  // Check alias map first
  if (CATEGORY_ALIAS_MAP[normalized]) {
    return CATEGORY_ALIAS_MAP[normalized];
  }
  
  // Check if it's already a valid canonical key
  if (CATEGORY_BY_KEY[normalized]) {
    return normalized;
  }
  
  // Default to other
  return 'other';
}

/**
 * Get the ordered list of category keys (useful for sorting)
 */
export const CATEGORY_ORDER = ALL_CATEGORIES.map(cat => cat.key);

/**
 * Sort categories by the canonical display order
 * @param {string[]} categoryKeys - Array of category keys to sort
 * @returns {string[]} Sorted array
 */
export function sortCategoriesByOrder(categoryKeys) {
  return [...categoryKeys].sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a);
    const indexB = CATEGORY_ORDER.indexOf(b);
    // Unknown categories go to the end
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
}
