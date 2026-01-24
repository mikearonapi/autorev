/**
 * useVehiclePerformance - Calculate vehicle performance dynamically
 * 
 * SOURCE OF TRUTH for HP display. ALWAYS use this hook instead of 
 * reading stored totalHpGain values from vehicles or builds.
 * 
 * See docs/SOURCE_OF_TRUTH.md - "Performance Calculations" section.
 * 
 * @example
 * ```jsx
 * import { useVehiclePerformance } from '@/hooks/useVehiclePerformance';
 * 
 * function VehicleCard({ vehicle, car }) {
 *   const { hpGain, finalHp, torqueGain } = useVehiclePerformance(vehicle, car);
 *   return <span>{finalHp} HP (+{hpGain})</span>;
 * }
 * ```
 */

import { useMemo } from 'react';
import { calculateAllModificationGains } from '@/lib/performanceCalculator';

/**
 * Calculate vehicle performance from installed modifications
 * 
 * @param {Object} vehicle - Vehicle object with installedModifications array
 * @param {Object} car - Car object with stock specs (hp, torque, engine, etc.)
 * @returns {Object} Performance metrics
 */
export function useVehiclePerformance(vehicle, car) {
  return useMemo(() => {
    const installedMods = vehicle?.installedModifications || [];
    const stockHp = car?.hp || 0;
    const stockTorque = car?.torque || 0;
    
    // No mods = stock performance
    if (!installedMods.length || !car) {
      return {
        stockHp,
        stockTorque,
        hpGain: 0,
        torqueGain: 0,
        finalHp: stockHp,
        finalTorque: stockTorque,
        zeroToSixtyImprovement: 0,
        brakingImprovement: 0,
        isModified: false,
        modCount: 0,
      };
    }
    
    // Calculate gains using the single source of truth
    const gains = calculateAllModificationGains(installedMods, car);
    
    return {
      stockHp,
      stockTorque,
      hpGain: gains.hpGain || 0,
      torqueGain: gains.torqueGain || 0,
      finalHp: stockHp + (gains.hpGain || 0),
      finalTorque: stockTorque + (gains.torqueGain || 0),
      zeroToSixtyImprovement: gains.zeroToSixtyImprovement || 0,
      brakingImprovement: gains.brakingImprovement || 0,
      isModified: installedMods.length > 0,
      modCount: installedMods.length,
    };
  }, [vehicle?.installedModifications, car]);
}

/**
 * Calculate build performance from selected upgrades
 * 
 * @param {Object} build - Build object with selectedUpgrades array
 * @param {Object} car - Car object with stock specs
 * @returns {Object} Performance metrics
 */
export function useBuildPerformance(build, car) {
  return useMemo(() => {
    // Extract upgrade keys from build
    let upgradeKeys = [];
    const selectedUpgrades = build?.selectedUpgrades || build?.selected_upgrades;
    
    if (Array.isArray(selectedUpgrades)) {
      upgradeKeys = selectedUpgrades.map(u => typeof u === 'string' ? u : u?.key).filter(Boolean);
    } else if (selectedUpgrades?.upgrades) {
      upgradeKeys = selectedUpgrades.upgrades.map(u => typeof u === 'string' ? u : u?.key).filter(Boolean);
    }
    
    const stockHp = car?.hp || 0;
    const stockTorque = car?.torque || 0;
    
    // No upgrades = stock performance
    if (!upgradeKeys.length || !car) {
      return {
        stockHp,
        stockTorque,
        hpGain: 0,
        torqueGain: 0,
        finalHp: stockHp,
        finalTorque: stockTorque,
        zeroToSixtyImprovement: 0,
        brakingImprovement: 0,
        upgradeCount: 0,
      };
    }
    
    // Calculate gains using the single source of truth
    const gains = calculateAllModificationGains(upgradeKeys, car);
    
    return {
      stockHp,
      stockTorque,
      hpGain: gains.hpGain || 0,
      torqueGain: gains.torqueGain || 0,
      finalHp: stockHp + (gains.hpGain || 0),
      finalTorque: stockTorque + (gains.torqueGain || 0),
      zeroToSixtyImprovement: gains.zeroToSixtyImprovement || 0,
      brakingImprovement: gains.brakingImprovement || 0,
      upgradeCount: upgradeKeys.length,
    };
  }, [build?.selectedUpgrades, build?.selected_upgrades, car]);
}

export default useVehiclePerformance;
