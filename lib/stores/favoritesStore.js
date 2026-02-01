/**
 * Favorites Store
 *
 * Manages user's favorite cars stored in localStorage.
 * This is a lightweight implementation that doesn't require authentication.
 * When auth is added, this can be migrated to server-side storage.
 *
 * Uses storage abstraction for cross-platform support (PWA/iOS/Android).
 *
 * @module lib/stores/favoritesStore
 */

import { storage } from '@/lib/storage';

const STORAGE_KEY = 'favorites'; // Storage abstraction adds 'autorev_' prefix
const MAX_FAVORITES = 50; // Reasonable limit for localStorage
export const STORAGE_VERSION = 1; // Increment to force cache invalidation

/**
 * @typedef {Object} FavoriteCar
 * @property {string} carId - Car UUID (PRIMARY unique identifier)
 * @property {string} slug - Car slug (for URL generation)
 * @property {string} name - Display name
 * @property {number} [year] - Year
 * @property {number} [hp] - Horsepower
 * @property {number} [msrp] - MSRP
 * @property {string} [tier] - Price tier
 * @property {string} [category] - Engine layout category
 * @property {string} [imageUrl] - Image URL for consistent thumbnails
 * @property {number} [zeroToSixty] - 0-60 time in seconds
 * @property {number} [curbWeight] - Curb weight in kg
 * @property {number} addedAt - Timestamp when added
 */

/**
 * @typedef {Object} FavoritesState
 * @property {FavoriteCar[]} favorites - Array of favorite cars
 */

/**
 * Default empty state
 * @type {FavoritesState}
 */
const defaultState = {
  favorites: [],
};

/**
 * Load favorites from storage
 * @returns {FavoritesState}
 */
export function loadFavorites() {
  const stored = storage.get(STORAGE_KEY);
  if (stored && Array.isArray(stored.favorites)) {
    return { favorites: stored.favorites };
  }
  return defaultState;
}

/**
 * Save favorites to storage
 * @param {FavoritesState} state
 */
export function saveFavorites(state) {
  storage.set(STORAGE_KEY, state);
}

/**
 * Extract minimal car data for storage
 * @param {Object} fullCarData - Full car data
 * @returns {FavoriteCar}
 */
export function extractCarForFavorites(fullCarData) {
  if (!fullCarData) return null;

  return {
    carId: fullCarData.id || fullCarData.carId, // PRIMARY identifier
    slug: fullCarData.slug, // For URL generation
    name: fullCarData.name,
    year: fullCarData.year,
    hp: fullCarData.hp,
    msrp: fullCarData.msrp,
    tier: fullCarData.tier,
    category: fullCarData.category,
    imageUrl: fullCarData.imageUrl,
    zeroToSixty: fullCarData.zeroToSixty,
    curbWeight: fullCarData.curbWeight,
    addedAt: Date.now(),
  };
}

/**
 * Add a car to favorites
 * @param {FavoritesState} state
 * @param {Object} car - Car to add (must have id or carId)
 * @returns {FavoritesState}
 */
export function addFavorite(state, car) {
  const carId = car.id || car.carId;
  // Check if already favorited by carId (or fallback to slug for backward compat)
  if (
    state.favorites.some((f) => (f.carId && f.carId === carId) || (!f.carId && f.slug === car.slug))
  ) {
    return state;
  }

  // Check limit
  if (state.favorites.length >= MAX_FAVORITES) {
    console.warn('[FavoritesStore] Maximum favorites limit reached');
    return state;
  }

  const favoriteCar = extractCarForFavorites(car);
  const newState = {
    favorites: [favoriteCar, ...state.favorites],
  };

  saveFavorites(newState);
  return newState;
}

/**
 * Remove a car from favorites
 * @param {FavoritesState} state
 * @param {string} carId - Car UUID to remove
 * @returns {FavoritesState}
 */
export function removeFavorite(state, carId) {
  const newState = {
    // Filter by carId, with fallback to slug for backward compat with old data
    favorites: state.favorites.filter((f) => f.carId !== carId && f.slug !== carId),
  };

  saveFavorites(newState);
  return newState;
}

/**
 * Toggle a car's favorite status
 * @param {FavoritesState} state
 * @param {Object} car - Car to toggle (must have id or carId)
 * @returns {FavoritesState}
 */
export function toggleFavorite(state, car) {
  const carId = car.id || car.carId;
  if (
    state.favorites.some((f) => (f.carId && f.carId === carId) || (!f.carId && f.slug === car.slug))
  ) {
    return removeFavorite(state, carId);
  }
  return addFavorite(state, car);
}

/**
 * Check if a car is favorited
 * @param {FavoritesState} state
 * @param {string} carId - Car UUID to check
 * @returns {boolean}
 */
export function isFavorited(state, carId) {
  // Check by carId, with fallback to slug for backward compat
  return state.favorites.some((f) => f.carId === carId || f.slug === carId);
}

/**
 * Clear all favorites
 * @returns {FavoritesState}
 */
export function clearAllFavorites() {
  const newState = { ...defaultState };
  saveFavorites(newState);
  return newState;
}

/**
 * Get favorite count
 * @param {FavoritesState} state
 * @returns {number}
 */
export function getFavoriteCount(state) {
  return state.favorites.length;
}

/**
 * Action types for reducer
 */
export const FavoriteActionTypes = {
  ADD: 'ADD_FAVORITE',
  REMOVE: 'REMOVE_FAVORITE',
  TOGGLE: 'TOGGLE_FAVORITE',
  CLEAR: 'CLEAR_FAVORITES',
  HYDRATE: 'HYDRATE_FAVORITES',
};

/**
 * Favorites reducer
 * @param {FavoritesState} state
 * @param {Object} action
 * @returns {FavoritesState}
 */
export function favoritesReducer(state, action) {
  switch (action.type) {
    case FavoriteActionTypes.ADD:
      return addFavorite(state, action.payload);

    case FavoriteActionTypes.REMOVE:
      return removeFavorite(state, action.payload);

    case FavoriteActionTypes.TOGGLE:
      return toggleFavorite(state, action.payload);

    case FavoriteActionTypes.CLEAR:
      return clearAllFavorites();

    case FavoriteActionTypes.HYDRATE:
      return action.payload;

    default:
      return state;
  }
}
