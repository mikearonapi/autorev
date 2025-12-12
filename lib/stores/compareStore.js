/**
 * Compare Store
 * 
 * Manages cars selected for comparison.
 * Stores selection in localStorage for persistence.
 * 
 * @module lib/stores/compareStore
 */

const STORAGE_KEY = 'autorev_compare';
const MAX_COMPARE = 4; // Maximum cars to compare at once

/**
 * @typedef {Object} CompareCar
 * @property {string} slug
 * @property {string} name
 * @property {string} [years]
 * @property {number} [hp]
 * @property {number} [torque]
 * @property {number} [zeroToSixty]
 * @property {string} [priceRange]
 * @property {string} [tier]
 * @property {string} [category]
 * @property {string} [engine]
 * @property {string} [trans]
 * @property {number} [sound]
 * @property {number} [track]
 * @property {number} [value]
 * @property {number} [reliability]
 * @property {string} [imageHeroUrl] - Hero image URL for consistent thumbnails
 * @property {number} [curbWeight] - Curb weight in kg
 */

/**
 * @typedef {Object} CompareState
 * @property {CompareCar[]} cars - Array of cars to compare
 */

const defaultState = {
  cars: [],
};

/**
 * Load compare list from localStorage
 * @returns {CompareState}
 */
export function loadCompare() {
  if (typeof window === 'undefined') {
    return defaultState;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        cars: Array.isArray(parsed.cars) ? parsed.cars : [],
      };
    }
  } catch (err) {
    console.warn('[CompareStore] Failed to load compare list:', err);
  }

  return defaultState;
}

/**
 * Save compare list to localStorage
 * @param {CompareState} state 
 */
export function saveCompare(state) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[CompareStore] Failed to save compare list:', err);
  }
}

/**
 * Extract car data for comparison
 * @param {Object} fullCarData 
 * @returns {CompareCar}
 */
export function extractCarForCompare(fullCarData) {
  if (!fullCarData) return null;

  return {
    slug: fullCarData.slug,
    name: fullCarData.name,
    years: fullCarData.years,
    hp: fullCarData.hp,
    torque: fullCarData.torque,
    zeroToSixty: fullCarData.zeroToSixty,
    priceRange: fullCarData.priceRange,
    tier: fullCarData.tier,
    category: fullCarData.category,
    engine: fullCarData.engine,
    trans: fullCarData.trans,
    sound: fullCarData.sound,
    track: fullCarData.track,
    value: fullCarData.value,
    reliability: fullCarData.reliability,
    imageHeroUrl: fullCarData.imageHeroUrl,
    curbWeight: fullCarData.curbWeight,
  };
}

/**
 * Add a car to compare
 * @param {CompareState} state 
 * @param {Object} car 
 * @returns {CompareState}
 */
export function addToCompare(state, car) {
  if (state.cars.some(c => c.slug === car.slug)) {
    return state;
  }

  if (state.cars.length >= MAX_COMPARE) {
    return state;
  }

  const compareCar = extractCarForCompare(car);
  const newState = {
    cars: [...state.cars, compareCar],
  };

  saveCompare(newState);
  return newState;
}

/**
 * Remove a car from compare
 * @param {CompareState} state 
 * @param {string} slug 
 * @returns {CompareState}
 */
export function removeFromCompare(state, slug) {
  const newState = {
    cars: state.cars.filter(c => c.slug !== slug),
  };

  saveCompare(newState);
  return newState;
}

/**
 * Toggle a car in compare list
 * @param {CompareState} state 
 * @param {Object} car 
 * @returns {CompareState}
 */
export function toggleCompare(state, car) {
  if (state.cars.some(c => c.slug === car.slug)) {
    return removeFromCompare(state, car.slug);
  }
  return addToCompare(state, car);
}

/**
 * Check if a car is in compare list
 * @param {CompareState} state 
 * @param {string} slug 
 * @returns {boolean}
 */
export function isInCompare(state, slug) {
  return state.cars.some(c => c.slug === slug);
}

/**
 * Clear all cars from compare
 * @returns {CompareState}
 */
export function clearCompare() {
  const newState = { ...defaultState };
  saveCompare(newState);
  return newState;
}

/**
 * Check if compare list is full
 * @param {CompareState} state 
 * @returns {boolean}
 */
export function isCompareFull(state) {
  return state.cars.length >= MAX_COMPARE;
}

/**
 * Get compare count
 * @param {CompareState} state 
 * @returns {number}
 */
export function getCompareCount(state) {
  return state.cars.length;
}

/**
 * Get max compare limit
 * @returns {number}
 */
export function getMaxCompare() {
  return MAX_COMPARE;
}

/**
 * Action types
 */
export const CompareActionTypes = {
  ADD: 'ADD_COMPARE',
  REMOVE: 'REMOVE_COMPARE',
  TOGGLE: 'TOGGLE_COMPARE',
  CLEAR: 'CLEAR_COMPARE',
  HYDRATE: 'HYDRATE_COMPARE',
};

/**
 * Compare reducer
 * @param {CompareState} state 
 * @param {Object} action 
 * @returns {CompareState}
 */
export function compareReducer(state, action) {
  switch (action.type) {
    case CompareActionTypes.ADD:
      return addToCompare(state, action.payload);
    
    case CompareActionTypes.REMOVE:
      return removeFromCompare(state, action.payload);
    
    case CompareActionTypes.TOGGLE:
      return toggleCompare(state, action.payload);
    
    case CompareActionTypes.CLEAR:
      return clearCompare();
    
    case CompareActionTypes.HYDRATE:
      return action.payload;
    
    default:
      return state;
  }
}
