'use client';

/**
 * Car Selection Provider
 * 
 * React Context provider for global car selection and upgrade state.
 * Wraps the entire app to provide access to the selected car and build configuration.
 * 
 * @module components/providers/CarSelectionProvider
 */

import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react';
import {
  loadState,
  carSelectionReducer,
  ActionTypes,
  calculateBuildSummary,
} from '@/lib/stores/carSelectionStore';

/**
 * @typedef {import('@/lib/stores/carSelectionStore').CarSelectionState} CarSelectionState
 * @typedef {import('@/lib/stores/carSelectionStore').SelectedCar} SelectedCar
 * @typedef {import('@/lib/stores/carSelectionStore').AppliedUpgrade} AppliedUpgrade
 * @typedef {import('@/lib/stores/carSelectionStore').BuildSummary} BuildSummary
 */

/**
 * @typedef {Object} CarSelectionContextValue
 * @property {SelectedCar|null} selectedCar - Currently selected car
 * @property {AppliedUpgrade[]} appliedUpgrades - List of applied upgrades
 * @property {BuildSummary} buildSummary - Calculated build summary
 * @property {boolean} isHydrated - Whether state has been hydrated from localStorage
 * @property {function(Object): void} selectCar - Select a car (pass full car data)
 * @property {function(): void} clearCar - Clear the selected car and upgrades
 * @property {function(AppliedUpgrade): void} addUpgrade - Add an upgrade
 * @property {function(string): void} removeUpgrade - Remove an upgrade by ID
 * @property {function(): void} clearUpgrades - Clear all upgrades
 * @property {function(AppliedUpgrade[]): void} setUpgrades - Set all upgrades at once
 * @property {function(): void} resetAll - Reset all state
 */

/** @type {React.Context<CarSelectionContextValue|null>} */
const CarSelectionContext = createContext(null);

/**
 * Default state for SSR (before hydration)
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
 * Car Selection Provider Component
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function CarSelectionProvider({ children }) {
  // Track hydration state to avoid SSR mismatch
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Initialize with default state (will be hydrated on client)
  const [state, dispatch] = useReducer(carSelectionReducer, defaultState);

  // Hydrate from localStorage on mount (client-side only)
useEffect(() => {
  const storedState = loadState() || {};
  if (storedState.selectedCar) {
    // Restore state from localStorage
    dispatch({ 
      type: ActionTypes.SET_CAR, 
      payload: storedState.selectedCar,
      preserveUpgrades: false,
    });
    if (storedState.appliedUpgrades?.length > 0) {
      dispatch({ 
        type: ActionTypes.SET_UPGRADES, 
        payload: storedState.appliedUpgrades,
      });
    }
  }
  setIsHydrated(true);
}, []);

  /**
   * Select a car (pass full car data, will be trimmed for storage)
   */
  const selectCar = useCallback((carData, options = {}) => {
    dispatch({ 
      type: ActionTypes.SET_CAR, 
      payload: carData,
      preserveUpgrades: options.preserveUpgrades || false,
    });
  }, []);

  /**
   * Clear the selected car and all upgrades
   */
  const clearCar = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_CAR });
  }, []);

  /**
   * Add an upgrade to the build
   */
  const addUpgrade = useCallback((upgrade) => {
    dispatch({ type: ActionTypes.ADD_UPGRADE, payload: upgrade });
  }, []);

  /**
   * Remove an upgrade by ID
   */
  const removeUpgrade = useCallback((upgradeId) => {
    dispatch({ type: ActionTypes.REMOVE_UPGRADE, payload: upgradeId });
  }, []);

  /**
   * Clear all upgrades but keep the selected car
   */
  const clearUpgrades = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_UPGRADES });
  }, []);

  /**
   * Set all upgrades at once (replaces existing)
   */
  const setUpgrades = useCallback((upgrades) => {
    dispatch({ type: ActionTypes.SET_UPGRADES, payload: upgrades });
  }, []);

  /**
   * Reset everything
   */
  const resetAll = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_ALL });
  }, []);

  const value = {
    // State
    selectedCar: state.selectedCar,
    appliedUpgrades: state.appliedUpgrades,
    buildSummary: state.buildSummary,
    isHydrated,
    
    // Actions
    selectCar,
    clearCar,
    addUpgrade,
    removeUpgrade,
    clearUpgrades,
    setUpgrades,
    resetAll,
  };

  return (
    <CarSelectionContext.Provider value={value}>
      {children}
    </CarSelectionContext.Provider>
  );
}

/**
 * Hook to access car selection context
 * @returns {CarSelectionContextValue}
 * @throws {Error} if used outside of CarSelectionProvider
 */
export function useCarSelection() {
  const context = useContext(CarSelectionContext);
  
  if (!context) {
    throw new Error('useCarSelection must be used within a CarSelectionProvider');
  }
  
  return context;
}

/**
 * Hook to check if a car is currently selected
 * @returns {boolean}
 */
export function useHasSelectedCar() {
  const { selectedCar, isHydrated } = useCarSelection();
  return isHydrated && selectedCar !== null;
}

/**
 * Hook to get just the selected car (or null)
 * Returns null during SSR/hydration to prevent mismatch
 * @returns {SelectedCar|null}
 */
export function useSelectedCar() {
  const { selectedCar, isHydrated } = useCarSelection();
  return isHydrated ? selectedCar : null;
}

/**
 * Hook to get the build summary
 * @returns {BuildSummary}
 */
export function useBuildSummary() {
  const { buildSummary } = useCarSelection();
  return buildSummary;
}

export default CarSelectionProvider;
