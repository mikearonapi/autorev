/**
 * Car Selection Store
 * 
 * Global state management for the currently selected car and applied upgrades.
 * This store persists to localStorage so state survives page reloads and navigation.
 * 
 * @module lib/stores/carSelectionStore
 */

const STORAGE_KEY = 'autorev_car_selection';

/**
 * @typedef {Object} SelectedCar
 * @property {string|number} id - Unique identifier
 * @property {string} slug - URL-friendly slug
 * @property {string} name - Display name
 * @property {string} make - Manufacturer (e.g., "Porsche")
 * @property {string} model - Model name (e.g., "718 Cayman GT4")
 * @property {string} years - Year range
 * @property {number} hp - Horsepower
 * @property {number} [torque] - Torque in lb-ft
 * @property {number} [zeroToSixty] - 0-60 time in seconds
 * @property {string} priceRange - Price range string
 * @property {string} tier - Price tier
 * @property {string} category - Category (e.g., "Mid-Engine")
 * @property {string} [thumbnail] - Thumbnail image URL
 * @property {string} [engine] - Engine description
 * @property {string} [trans] - Transmission type
 * @property {string} [aspirationType] - NA, turbo, supercharged, etc.
 */

/**
 * @typedef {Object} AppliedUpgrade
 * @property {string} id - Upgrade ID
 * @property {string} name - Upgrade name
 * @property {string} category - Upgrade category (e.g., "engine", "suspension")
 * @property {number} cost - Cost in dollars
 * @property {number} [hpGain] - Horsepower gain
 * @property {number} [torqueGain] - Torque gain
 * @property {string} [notes] - Additional notes
 */

/**
 * @typedef {Object} BuildSummary
 * @property {number} totalCost - Total cost of all upgrades
 * @property {number} totalHpGain - Total HP gained
 * @property {number} totalTorqueGain - Total torque gained
 * @property {number} finalHp - Final HP after upgrades
 * @property {number} finalTorque - Final torque after upgrades
 * @property {number} costPerHp - Cost per HP gained ($/HP)
 */

/**
 * @typedef {Object} CarSelectionState
 * @property {SelectedCar|null} selectedCar - Currently selected car
 * @property {AppliedUpgrade[]} appliedUpgrades - List of applied upgrades
 * @property {BuildSummary} buildSummary - Calculated build summary
 */

/**
 * Default state when nothing is selected
 * @type {CarSelectionState}
 */
const defaultState = {
  selectedCar: null,
  appliedUpgrades: [],
  buildSummary: {
    totalCost: 0,
    totalHpGain: 0,
    totalTorqueGain: 0,
    finalHp: 0,
    finalTorque: 0,
    costPerHp: 0,
  },
};

/**
 * Load state from localStorage
 * @returns {CarSelectionState}
 */
export function loadState() {
  if (typeof window === 'undefined') {
    return defaultState;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...defaultState,
        ...parsed,
      };
    }
  } catch (err) {
    console.warn('[CarSelectionStore] Failed to load state from localStorage:', err);
  }

  return defaultState;
}

/**
 * Save state to localStorage
 * @param {CarSelectionState} state 
 */
export function saveState(state) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[CarSelectionStore] Failed to save state to localStorage:', err);
  }
}

/**
 * Calculate build summary from car and upgrades
 * @param {SelectedCar|null} car 
 * @param {AppliedUpgrade[]} upgrades 
 * @returns {BuildSummary}
 */
export function calculateBuildSummary(car, upgrades) {
  let totalCost = 0;
  let totalCostLow = 0;
  let totalCostHigh = 0;
  
  // Calculate costs handling both number and object formats
  upgrades.forEach(u => {
    if (typeof u.cost === 'number') {
      totalCost += u.cost;
      totalCostLow += u.cost;
      totalCostHigh += u.cost;
    } else if (u.cost && typeof u.cost === 'object') {
      // Handle range object { low, high, range }
      const low = u.cost.low || 0;
      const high = u.cost.high || low;
      // Use average for the single totalCost value
      const avg = (low + high) / 2;
      
      totalCost += avg;
      totalCostLow += low;
      totalCostHigh += high;
    }
  });

  // Calculate gains handling both flat properties and metricChanges object
  const totalHpGain = upgrades.reduce((sum, u) => {
    const gain = u.hpGain || u.metricChanges?.hpGain || 0;
    return sum + gain;
  }, 0);

  const totalTorqueGain = upgrades.reduce((sum, u) => {
    const gain = u.torqueGain || u.metricChanges?.torqueGain || 0;
    return sum + gain;
  }, 0);
  
  const baseHp = car?.hp || 0;
  const baseTorque = car?.torque || 0;
  const finalHp = baseHp + totalHpGain;
  const finalTorque = baseTorque + totalTorqueGain;
  const costPerHp = totalHpGain > 0 ? Math.round(totalCost / totalHpGain) : 0;

  return {
    totalCost, // Average cost as number
    totalCostLow,
    totalCostHigh,
    totalHpGain,
    totalTorqueGain,
    finalHp,
    finalTorque,
    costPerHp,
  };
}

/**
 * Extract minimal car data for storage
 * This keeps localStorage payload small while retaining essential info
 * @param {Object} fullCarData - Full car data from database/local
 * @returns {SelectedCar}
 */
export function extractCarForStorage(fullCarData) {
  if (!fullCarData) return null;

  return {
    id: fullCarData.id,
    slug: fullCarData.slug,
    name: fullCarData.name,
    make: fullCarData.brand || fullCarData.make || extractMakeFromName(fullCarData.name),
    model: fullCarData.model || fullCarData.name,
    years: fullCarData.years,
    hp: fullCarData.hp,
    torque: fullCarData.torque,
    zeroToSixty: fullCarData.zeroToSixty,
    priceRange: fullCarData.priceRange,
    tier: fullCarData.tier,
    category: fullCarData.category,
    engine: fullCarData.engine,
    trans: fullCarData.trans,
    aspirationType: fullCarData.aspirationType || detectAspirationType(fullCarData.engine),
  };
}

/**
 * Extract make from car name (simple heuristic)
 * @param {string} name 
 * @returns {string}
 */
function extractMakeFromName(name) {
  if (!name) return '';
  
  const knownMakes = [
    'Porsche', 'BMW', 'Mercedes', 'Audi', 'Chevrolet', 'Ford', 'Dodge',
    'Toyota', 'Nissan', 'Honda', 'Mazda', 'Subaru', 'Lexus', 'Infiniti',
    'Alfa Romeo', 'Lotus', 'McLaren', 'Ferrari', 'Lamborghini', 'Aston Martin',
  ];

  for (const make of knownMakes) {
    if (name.toLowerCase().startsWith(make.toLowerCase())) {
      return make;
    }
  }

  // Default to first word
  return name.split(' ')[0];
}

/**
 * Detect aspiration type from engine description
 * @param {string} engine 
 * @returns {string}
 */
function detectAspirationType(engine) {
  if (!engine) return 'unknown';
  const lower = engine.toLowerCase();
  
  if (lower.includes('twin-turbo') || lower.includes('twin turbo') || lower.includes('tt')) {
    return 'twin-turbo';
  }
  if (lower.includes('turbo')) {
    return 'turbo';
  }
  if (lower.includes('supercharged') || lower.includes('sc')) {
    return 'supercharged';
  }
  if (lower.includes('na') || lower.includes('naturally aspirated')) {
    return 'naturally-aspirated';
  }
  // Most engines without explicit markers are NA
  return 'naturally-aspirated';
}

/**
 * Action types for state reducer
 */
export const ActionTypes = {
  SET_CAR: 'SET_CAR',
  CLEAR_CAR: 'CLEAR_CAR',
  ADD_UPGRADE: 'ADD_UPGRADE',
  REMOVE_UPGRADE: 'REMOVE_UPGRADE',
  CLEAR_UPGRADES: 'CLEAR_UPGRADES',
  SET_UPGRADES: 'SET_UPGRADES',
  RESET_ALL: 'RESET_ALL',
};

/**
 * State reducer for car selection
 * @param {CarSelectionState} state 
 * @param {Object} action 
 * @returns {CarSelectionState}
 */
export function carSelectionReducer(state, action) {
  let newState;

  switch (action.type) {
    case ActionTypes.SET_CAR: {
      const car = extractCarForStorage(action.payload);
      const upgrades = action.preserveUpgrades ? state.appliedUpgrades : [];
      newState = {
        ...state,
        selectedCar: car,
        appliedUpgrades: upgrades,
        buildSummary: calculateBuildSummary(car, upgrades),
      };
      break;
    }

    case ActionTypes.CLEAR_CAR: {
      newState = {
        ...defaultState,
      };
      break;
    }

    case ActionTypes.ADD_UPGRADE: {
      const existingIndex = state.appliedUpgrades.findIndex(u => u.id === action.payload.id);
      let newUpgrades;
      
      if (existingIndex >= 0) {
        // Replace existing upgrade
        newUpgrades = [...state.appliedUpgrades];
        newUpgrades[existingIndex] = action.payload;
      } else {
        // Add new upgrade
        newUpgrades = [...state.appliedUpgrades, action.payload];
      }

      newState = {
        ...state,
        appliedUpgrades: newUpgrades,
        buildSummary: calculateBuildSummary(state.selectedCar, newUpgrades),
      };
      break;
    }

    case ActionTypes.REMOVE_UPGRADE: {
      const newUpgrades = state.appliedUpgrades.filter(u => u.id !== action.payload);
      newState = {
        ...state,
        appliedUpgrades: newUpgrades,
        buildSummary: calculateBuildSummary(state.selectedCar, newUpgrades),
      };
      break;
    }

    case ActionTypes.CLEAR_UPGRADES: {
      newState = {
        ...state,
        appliedUpgrades: [],
        buildSummary: calculateBuildSummary(state.selectedCar, []),
      };
      break;
    }

    case ActionTypes.SET_UPGRADES: {
      const upgrades = action.payload || [];
      newState = {
        ...state,
        appliedUpgrades: upgrades,
        buildSummary: calculateBuildSummary(state.selectedCar, upgrades),
      };
      break;
    }

    case ActionTypes.RESET_ALL: {
      newState = { ...defaultState };
      break;
    }

    default:
      return state;
  }

  // Persist to localStorage
  saveState(newState);
  return newState;
}
