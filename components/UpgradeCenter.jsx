'use client';

/**
 * Upgrade Center Component - Ultra Compact Layout
 * 
 * Features:
 * - Minimal scrolling with condensed UI
 * - Car-specific AI recommendations always visible
 * - Split layout: Categories left, Analytics right
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './UpgradeCenter.module.css';

// Upgrade category colors - matching design system tokens
const UPGRADE_COLORS = {
  engine: '#f59e0b',   // var(--color-warning) - Engine internals
  turbo: '#ef4444',    // var(--color-error) - Turbo upgrades (high impact)
  fuel: '#10b981',     // var(--color-accent-teal) - Fuel system
  ecu: '#3b82f6',      // var(--color-accent-blue) - ECU tuning
};
import { 
  getPerformanceProfile,
  calculateReliabilityScore,
  calculateHandlingScore,
} from '@/lib/performanceCalculator';
import {
  getAvailableUpgrades,
  calculateTotalCost,
} from '@/lib/performance.js';
import { getPlatformDownpipeGain } from '@/data/upgradePackages.js';
import { getUpgradeByKey } from '@/lib/upgrades.js';
import { useTierConfig } from '@/lib/hooks/useAppConfig.js';
import { 
  getFocusLabel 
} from '@/lib/carRecommendations.js';
import { 
  calculateTunability, 
  getTunabilityColor 
} from '@/lib/tunabilityCalculator.js';
import {
  checkUpgradeConflict,
  resolveConflicts,
  getConflictingUpgrades,
} from '@/data/upgradeConflicts.js';
// carUpgradeRecommendations imports removed - recommendations moved to Insights page
import CarImage from './CarImage';
import UpgradeDetailModal from './UpgradeDetailModal';
import { useSavedBuilds } from './providers/SavedBuildsProvider';
import { useAuth } from './providers/AuthProvider';
import { useOwnedVehicles } from './providers/OwnedVehiclesProvider';
import { 
  useTuningProfile, 
  // Unused imports after hiding Vehicle-Specific Tuning section:
  // getFormattedStages, getFormattedPlatforms, getFormattedPowerLimits, 
  // getFormattedBrands, getDataQualityInfo, getTotalUpgradeCount,
  // getUpgradesByObjective, getPlatformInsights, hasObjectiveData - moved to Insights page
} from '@/hooks/useTuningProfile';
// Import shared upgrade category definitions (single source of truth)
import { 
  UPGRADE_CATEGORIES as SHARED_UPGRADE_CATEGORIES,
  GOAL_CATEGORY_MAP,
  sortCategoriesByGoal,
  isCategoryPrimaryForGoal,
  getCategoriesForGoal,
} from '@/lib/upgradeCategories.js';
// TEMPORARILY HIDDEN: Dyno & Lap Times components hidden from UI per product decision.
// To restore, uncomment: import { DynoDataSection, LapTimesSection } from './PerformanceData';

// Mobile-first tuning shop components
import { CategoryNav, FactoryConfig, WheelTireConfigurator } from './tuning-shop';
import PartsSelector from './tuning-shop/PartsSelector';
import { useAIChat } from './AIChatContext';
import { useTurbos } from '@/hooks/useCarData';
import { useLinkedPost } from '@/hooks/useCommunityData';
// Image management moved to Garage Photos section for cleaner UX
import VideoPlayer from './VideoPlayer';
import UpgradeConfigPanel, { 
  calculateConfigHpModifier, 
  getDefaultConfig 
} from './UpgradeConfigPanel';
import DynamicBuildConfig from './DynamicBuildConfig';
// BuildDashboard removed per product decision to focus on upgrade selection flow
// import BuildDashboard from './tuning-shop/BuildDashboard';
import { Icons } from '@/components/ui/Icons';

// Add swap alias to Icons (not in shared library)
Icons.swap = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3l4 4-4 4"/>
    <path d="M20 7H4"/>
    <path d="M8 21l-4-4 4-4"/>
    <path d="M4 17h16"/>
  </svg>
);

// Build Recommendation configs (presets)
const BUILD_RECOMMENDATIONS = [
  { key: 'streetSport', label: 'Street' },
  { key: 'trackPack', label: 'Track' },
  { key: 'drag', label: 'Drag' },
];

// Custom option (separate from recommendations)
const CUSTOM_BUILD = { key: 'custom', label: 'Custom' };

// Legacy PACKAGES constant for backwards compatibility
const PACKAGES = [...BUILD_RECOMMENDATIONS, CUSTOM_BUILD];

// Map icon names from shared categories to local Icon components
const ICON_NAME_TO_COMPONENT = {
  bolt: Icons.bolt,
  turbo: Icons.turbo,
  target: Icons.target,
  disc: Icons.disc,
  thermometer: Icons.thermometer,
  circle: Icons.circle,
  wind: Icons.wind,
  settings: Icons.settings,
  grid: Icons.settings, // fallback for 'other' category
};

/**
 * UPGRADE_CATEGORIES - derived from shared definitions
 * This ensures consistency with BuildModsList and other components.
 * Icon names are mapped to local Icon components for rendering.
 */
const UPGRADE_CATEGORIES = SHARED_UPGRADE_CATEGORIES.map(cat => ({
  ...cat,
  icon: ICON_NAME_TO_COMPONENT[cat.icon] || Icons.settings,
}));


/* VirtualDynoChart extracted to components/VirtualDynoChart.jsx */

/**
 * Power Breakdown - Shows where HP gains come from
 */
function PowerBreakdown({ stockHp, specs, estimate }) {
  const breakdown = [];
  let runningTotal = stockHp;
  
  // Engine mods
  if (specs?.engine && specs.engine.type !== 'stock') {
    let engineGain = 0;
    if (specs.engine.cams === 'stage3') engineGain += Math.round(stockHp * 0.12);
    else if (specs.engine.cams === 'stage2') engineGain += Math.round(stockHp * 0.07);
    else if (specs.engine.cams === 'stage1') engineGain += Math.round(stockHp * 0.04);
    if (specs.engine.headWork) engineGain += Math.round(stockHp * 0.06);
    if (specs.engine.type === 'stroked' && specs.engine.displacement > 2.0) {
      engineGain += Math.round(stockHp * ((specs.engine.displacement / 2.0) - 1));
    }
    if (engineGain > 0) {
      breakdown.push({ label: 'Engine Internals', gain: engineGain, color: UPGRADE_COLORS.engine });
      runningTotal += engineGain;
    }
  }
  
  // Breathing mods
  let breathingGain = 0;
  if (specs.intake?.type !== 'stock') breathingGain += Math.round(stockHp * 0.02);
  if (specs.exhaust?.downpipe !== 'stock') breathingGain += Math.round(stockHp * 0.03);
  if (specs.exhaust?.headers !== 'stock') breathingGain += Math.round(stockHp * 0.03);
  if (breathingGain > 0) {
    breakdown.push({ label: 'Intake & Exhaust', gain: breathingGain, color: '#8b5cf6' });
    runningTotal += breathingGain;
  }
  
  // Turbo upgrade
  if (specs.turbo?.type !== 'stock') {
    const turboGain = Math.round((estimate?.whp || runningTotal) - runningTotal - (specs.fuel?.type === 'e85' ? stockHp * 0.15 : 0));
    if (turboGain > 0) {
      breakdown.push({ label: 'Turbo Upgrade', gain: turboGain, color: UPGRADE_COLORS.turbo });
      runningTotal += turboGain;
    }
  }
  
  // Fuel
  if (specs.fuel?.type === 'e85') {
    const fuelGain = Math.round(stockHp * 0.15);
    breakdown.push({ label: 'E85 Fuel', gain: fuelGain, color: UPGRADE_COLORS.fuel });
    runningTotal += fuelGain;
  } else if (specs.fuel?.type === 'e50' || specs.fuel?.type === 'e30') {
    const fuelGain = Math.round(stockHp * (specs.fuel.type === 'e50' ? 0.10 : 0.06));
    breakdown.push({ label: `${specs.fuel.type.toUpperCase()} Fuel`, gain: fuelGain, color: UPGRADE_COLORS.fuel });
    runningTotal += fuelGain;
  }
  
  // ECU
  if (specs.ecu?.type !== 'stock') {
    const ecuGain = Math.round(stockHp * 0.03);
    breakdown.push({ label: 'ECU Tuning', gain: ecuGain, color: UPGRADE_COLORS.ecu });
  }
  
  const totalGain = (estimate?.hp || estimate?.whp || runningTotal) - stockHp;

  return (
    <div className={styles.powerBreakdown}>
      <div className={styles.breakdownHeader}>
        <span className={styles.breakdownTitle}>Power Breakdown</span>
        <span className={styles.breakdownTotal}>+{totalGain} HP</span>
      </div>
      <div className={styles.breakdownBars}>
        {breakdown.map((item, idx) => (
          <div key={idx} className={styles.breakdownRow}>
            <div className={styles.breakdownLabel}>
              <span className={styles.breakdownDot} style={{ background: item.color }} />
              <span>{item.label}</span>
            </div>
            <div className={styles.breakdownBarContainer}>
              <div 
                className={styles.breakdownBar} 
                style={{ 
                  width: `${Math.min(100, (item.gain / totalGain) * 100)}%`,
                  background: item.color 
                }} 
              />
            </div>
            <span className={styles.breakdownGain}>+{item.gain}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Calculated Performance - Physics-based 0-60, 1/4 mile
 */
function CalculatedPerformance({
  stockHp,
  estimatedHp,
  weight = 3500,
  drivetrain = 'AWD',
  tireCompound = 'summer',
  weightMod = 0, 
  driverWeight = 180, 
  finalDrive = null,
  wheelWeight = null, // lbs per wheel (stock ~25, forged ~18)
  handlingScore = 100,
  brakingScore = 100,
}) {
  // Guard against invalid inputs
  const safeStockHp = (typeof stockHp === 'number' && !isNaN(stockHp) && stockHp > 0) ? stockHp : 300;
  const safeEstimatedHp = (typeof estimatedHp === 'number' && !isNaN(estimatedHp) && estimatedHp > 0) ? estimatedHp : safeStockHp;
  const safeWeight = (typeof weight === 'number' && !isNaN(weight) && weight > 0) ? weight : 3500;
  
  // Adjust weight for modifications and driver
  const totalWeight = safeWeight + (weightMod || 0) + (driverWeight || 180);
  const stockTotalWeight = safeWeight + 180; // Stock with driver
  
  // Wheel weight affects rotational inertia (lighter wheels = faster accel)
  // Rule of thumb: 1lb of wheel weight = 4-5lbs of static weight for acceleration
  const stockWheelWeight = 25; // Average stock wheel
  const currentWheelWeight = wheelWeight || stockWheelWeight;
  const wheelWeightDiff = (stockWheelWeight - currentWheelWeight) * 4; // Effective weight savings
  const effectiveWeight = totalWeight - wheelWeightDiff;
  const stockEffectiveWeight = stockTotalWeight;
  
  // Tire grip multiplier for launch (affects 0-60 more than 1/4)
  const tireGripMap = {
    'all-season': 0.82,
    'summer': 0.90,
    'max-performance': 0.95,
    'r-comp': 1.05,
    'drag-radial': 1.25, // Massive launch advantage
    'slick': 1.35,
  };
  const tireGrip = tireGripMap[tireCompound] || 0.90;
  
  // Power to weight ratio (hp per ton, where ton = 2000 lbs)
  const powerToWeight = (safeEstimatedHp / effectiveWeight) * 2000;
  const stockPtw = (safeStockHp / stockEffectiveWeight) * 2000;
  
  // ==========================================================================
  // 0-60 MPH CALCULATION
  // ==========================================================================
  // Empirical formula validated against real-world data:
  // 0-60 = sqrt(weight/hp) * k, where k varies by drivetrain
  // AWD: k ≈ 1.2 (best launch, minimal wheelspin)
  // RWD: k ≈ 1.35 (wheelspin limited)
  // FWD: k ≈ 1.4 (torque steer, weight transfer issues)
  
  const drivetrainK = {
    'AWD': 1.20,
    'RWD': 1.35,
    'FWD': 1.40,
    '4WD': 1.25,
  };
  const baseK = drivetrainK[drivetrain] || 1.30;
  
  // Tire grip affects launch (drag radials are huge for RWD)
  const tireKMultiplier = {
    'all-season': 1.08,
    'summer': 1.0,
    'max-performance': 0.97,
    'r-comp': 0.93,
    'drag-radial': 0.85, // Massive launch improvement
    'slick': 0.82,
  };
  const kTire = tireKMultiplier[tireCompound] || 1.0;
  
  // Calculate 0-60
  const weightToHp = effectiveWeight / safeEstimatedHp;
  const stockWeightToHp = stockEffectiveWeight / safeStockHp;
  
  // Minimum realistic 0-60 times (even hypercars can't beat physics)
  const estimated060 = Math.max(2.0, Math.sqrt(weightToHp) * baseK * kTire);
  const stock060 = Math.max(2.5, Math.sqrt(stockWeightToHp) * baseK);
  
  // ==========================================================================
  // 1/4 MILE CALCULATION  
  // ==========================================================================
  // Classic empirical formula: ET = 5.825 * (weight/hp)^0.333
  // This is well-validated across many vehicles
  const tractionBonus = tireCompound === 'drag-radial' ? 0.94 : tireCompound === 'slick' ? 0.92 : 1.0;
  const estimatedQuarter = 5.825 * Math.pow(weightToHp, 0.333) * tractionBonus;
  const stockQuarter = 5.825 * Math.pow(stockWeightToHp, 0.333);

  // ==========================================================================
  // TRAP SPEED CALCULATION
  // ==========================================================================
  // Formula: Trap Speed (mph) = 234 * (hp/weight)^0.333
  // Adjusted from 224 to 234 based on modern vehicle data
  const finalDriveFactor = finalDrive ? Math.min(1.02, 3.5 / finalDrive) : 1.0;
  const estimatedTrap = 234 * Math.pow(safeEstimatedHp / effectiveWeight, 0.333) * finalDriveFactor;
  const stockTrap = 234 * Math.pow(safeStockHp / stockEffectiveWeight, 0.333);
  
  // Braking distance (60-0) estimation
  // Base: ~120ft for average car at 60mph
  // Better brakes/tires reduce this
  const stockBraking60 = 120; // feet
  const brakingImprovement = (brakingScore - 100) / 100; // percentage improvement
  const estimatedBraking60 = Math.round(stockBraking60 * (1 - brakingImprovement * 0.25));
  
  // Lateral G estimation
  // Stock sedan ~0.85g, sport car ~0.95g
  const baseG = 0.90;
  const handlingImprovement = (handlingScore - 100) / 100;
  const estimatedLateralG = (baseG * (1 + handlingImprovement * 0.3)).toFixed(2);
  const stockLateralG = baseG.toFixed(2);
  
  // Safe number formatting to prevent NaN display
  const safeFixed = (num, decimals = 1, fallback = '—') => {
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) return fallback;
    return num.toFixed(decimals);
  };
  
  const safeDelta = (from, to, decimals = 1) => {
    const diff = from - to;
    if (isNaN(diff) || !isFinite(diff)) return '0';
    return diff.toFixed(decimals);
  };

  return (
    <div className={styles.calcPerformance}>
      <div className={styles.calcHeader}>
        <span className={styles.calcTitle}>Calculated Performance</span>
        <span className={styles.calcSubtitle}>Based on {safeWeight.toLocaleString()} lbs, {drivetrain}</span>
      </div>
      <div className={styles.calcGrid}>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>0-60 mph</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{safeFixed(stock060)}s</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{safeFixed(estimated060)}s</span>
          </div>
          <div className={styles.calcDelta}>-{safeDelta(stock060, estimated060)}s</div>
        </div>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>1/4 Mile</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{safeFixed(stockQuarter)}s</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{safeFixed(estimatedQuarter)}s</span>
          </div>
          <div className={styles.calcDelta}>-{safeDelta(stockQuarter, estimatedQuarter)}s</div>
        </div>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>Trap Speed</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{safeFixed(stockTrap, 0)}</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{safeFixed(estimatedTrap, 0)} mph</span>
          </div>
          <div className={styles.calcDelta}>+{safeDelta(stockTrap, estimatedTrap, 0)} mph</div>
        </div>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>Power/Weight</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{safeFixed(stockPtw, 0)}</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{safeFixed(powerToWeight, 0)} hp/ton</span>
          </div>
          <div className={styles.calcDelta}>+{safeDelta(stockPtw, powerToWeight, 0)}</div>
        </div>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>60-0 Braking</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{stockBraking60}ft</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{estimatedBraking60} ft</span>
          </div>
          <div className={styles.calcDelta}>{estimatedBraking60 <= stockBraking60 ? '-' : '+'}{Math.abs(stockBraking60 - estimatedBraking60)} ft</div>
        </div>
        <div className={styles.calcMetric}>
          <div className={styles.calcMetricHeader}>Lateral G</div>
          <div className={styles.calcMetricValues}>
            <span className={styles.calcStock}>{stockLateralG}g</span>
            <span className={styles.calcArrow}>→</span>
            <span className={styles.calcModded}>{estimatedLateralG}g</span>
          </div>
          <div className={styles.calcDelta}>+{safeFixed(parseFloat(estimatedLateralG) - parseFloat(stockLateralG), 2, '0.00')}g</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Metric Row
 */
function MetricRow({ icon: Icon, label, stockValue, upgradedValue, unit, isLowerBetter = false }) {
  // Defensive: handle missing values
  const stock = stockValue ?? 0;
  const upgraded = upgradedValue ?? stock;
  
  const hasImproved = isLowerBetter ? upgraded < stock : upgraded > stock;
  const improvement = Math.abs(upgraded - stock);
  
  const formatValue = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '—';
    if (unit === 'g') return val.toFixed(2);
    if (unit === 's') return val.toFixed(1);
    return Math.round(val);
  };
  
  const maxValues = { hp: 1200, s: 8, ft: 150, g: 1.6 };
  const maxValue = maxValues[unit === ' hp' ? 'hp' : unit] || 1200;
  
  const stockPercent = isLowerBetter 
    ? ((maxValue - stock) / maxValue) * 100 
    : (stock / maxValue) * 100;
  const upgradedPercent = isLowerBetter 
    ? ((maxValue - upgraded) / maxValue) * 100 
    : (upgraded / maxValue) * 100;
  
  return (
    <div className={styles.metric}>
      <div className={styles.metricHeader}>
        <span className={styles.metricLabel}><Icon size={12} />{label}</span>
        <span className={styles.metricValues}>
          {hasImproved ? (
            <>
              <span className={styles.stockVal}>{formatValue(stock)}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.upgradedVal}>{formatValue(upgraded)}{unit}</span>
              <span className={styles.gain}>{isLowerBetter ? '-' : '+'}{formatValue(improvement)}</span>
            </>
          ) : (
            <span className={styles.currentVal}>{formatValue(stock)}{unit}</span>
          )}
        </span>
      </div>
      <div className={styles.track}>
        <div className={styles.fillStock} style={{ width: `${Math.min(100, stockPercent)}%` }} />
        {hasImproved && (
          <div className={styles.fillUpgrade} style={{ left: `${stockPercent}%`, width: `${Math.abs(upgradedPercent - stockPercent)}%` }} />
        )}
      </div>
    </div>
  );
}

/**
 * Experience Score Bar
 */
function ScoreBar({ label, stockScore, upgradedScore }) {
  // Safety checks - handle null/undefined scores
  const safeStockScore = stockScore ?? 7;
  const safeUpgradedScore = upgradedScore ?? safeStockScore;
  const hasImproved = safeUpgradedScore > safeStockScore;
  const delta = safeUpgradedScore - safeStockScore;
  
  return (
    <div className={styles.scoreRow}>
      <div className={styles.scoreHeader}>
        <span className={styles.scoreLabel}>{label}</span>
        <span className={styles.scoreValues}>
          {hasImproved ? (
            <>
              <span className={styles.stockVal}>{safeStockScore.toFixed(1)}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.upgradedVal}>{safeUpgradedScore.toFixed(1)}</span>
            </>
          ) : (
            <span className={styles.currentVal}>{safeStockScore.toFixed(1)}/10</span>
          )}
        </span>
      </div>
      <div className={styles.track}>
        <div className={styles.fillStock} style={{ width: `${(safeStockScore / 10) * 100}%` }} />
        {hasImproved && (
          <div className={styles.fillUpgrade} style={{ left: `${(safeStockScore / 10) * 100}%`, width: `${(delta / 10) * 100}%` }} />
        )}
      </div>
    </div>
  );
}

/* LapTimeEstimator extracted to components/LapTimeEstimator.jsx */
/* HandlingBalanceIndicator extracted to components/HandlingBalanceIndicator.jsx */
/* AeroBalanceChart extracted to components/AeroBalanceChart.jsx */
/* PowerLimitsAdvisory extracted to components/PowerLimitsAdvisory.jsx */

/**
 * Brand Recommendations - Shows popular brands from database
 */
function BrandRecommendations({ brandRecs, category = 'all' }) {
  if (!brandRecs || Object.keys(brandRecs).length === 0) return null;
  
  // Map category keys to display names
  const categoryLabels = {
    turbo: 'Turbo/SC', exhaust: 'Exhaust', intake: 'Intake',
    suspension: 'Suspension', brakes: 'Brakes', wheels: 'Wheels',
    ecu: 'ECU Tuning', fuel: 'Fuel System', clutch: 'Clutch',
  };
  
  const filteredRecs = category === 'all' 
    ? brandRecs 
    : { [category]: brandRecs[category] };
  
  return (
    <div className={styles.brandRecs}>
      <div className={styles.brandRecsHeader}>
        <Icons.star size={16} />
        <span>Popular Brands</span>
      </div>
      
      <div className={styles.brandRecsList}>
        {Object.entries(filteredRecs).map(([cat, brands]) => {
          if (!brands || !Array.isArray(brands) || brands.length === 0) return null;
          
          return (
            <div key={cat} className={styles.brandRecCategory}>
              <span className={styles.brandRecCategoryLabel}>
                {categoryLabels[cat] || cat}
              </span>
              <div className={styles.brandRecBrands}>
                {brands.slice(0, 4).map(brand => (
                  <span key={brand} className={styles.brandRecBrand}>{brand}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Conflict Notification Toast
 */
function ConflictNotification({ message, onDismiss, replacedUpgrade }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={styles.conflictToast}>
      <div className={styles.conflictToastIcon}>
        <Icons.swap size={16} />
      </div>
      <div className={styles.conflictToastContent}>
        <span className={styles.conflictToastTitle}>Upgrade Replaced</span>
        <span className={styles.conflictToastMessage}>{message}</span>
      </div>
      <button className={styles.conflictToastClose} onClick={onDismiss}>
        <Icons.x size={14} />
      </button>
    </div>
  );
}

/**
 * Category Popup Modal
 * Now allows toggling upgrades regardless of package - auto-switches to Custom mode
 * Shows inline configuration panel for upgrades with configOptions
 */
function CategoryPopup({ 
  category, 
  upgrades, 
  selectedModules, 
  onToggle, 
  onClose, 
  onInfoClick, 
  isCustomMode, 
  allUpgrades,
  upgradeConfigs,       // Config state for all upgrades
  onConfigChange,       // Handler for config changes
}) {
  const popupRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);
  
  // Helper to get upgrade name by key
  const getUpgradeName = useCallback((key) => {
    const upgrade = allUpgrades?.find(u => u.key === key);
    return upgrade?.name || key;
  }, [allUpgrades]);
  
  // Check which upgrades would be replaced for each unselected upgrade
  // Fixed: use conflictsWith instead of conflictingUpgrades
  const getReplacementInfo = useCallback((upgradeKey) => {
    if (selectedModules.includes(upgradeKey)) return null;
    
    try {
      const conflict = checkUpgradeConflict(upgradeKey, selectedModules);
      if (!conflict) return null;
      
      // Use conflictsWith (the correct property name from checkUpgradeConflict)
      const conflictingKeys = conflict.conflictsWith || [];
      
      return {
        ...conflict,
        conflictingUpgrades: conflictingKeys,
        names: conflictingKeys.map(key => getUpgradeName(key)),
      };
    } catch {
      // Defensive: if conflict detection fails, return null
      return null;
    }
  }, [selectedModules, getUpgradeName]);
  
  const Icon = category.icon;
  
  return (
    <div className={styles.popupOverlay}>
      <div className={styles.categoryPopup} ref={popupRef} style={{ '--cat-color': category.color }}>
        <div className={styles.popupHeader}>
          <div className={styles.popupTitle}>
            <Icon size={16} />
            <span>{category.label}</span>
            <span className={styles.popupCount}>{upgrades.length}</span>
          </div>
          <button className={styles.popupClose} onClick={onClose}><Icons.x size={14} /></button>
        </div>
        <div className={styles.popupContent}>
          {upgrades.map(upgrade => {
            const isSelected = selectedModules.includes(upgrade.key);
            const replacementInfo = !isSelected ? getReplacementInfo(upgrade.key) : null;
            const hasConflict = replacementInfo !== null;
            const hasConfigOptions = upgrade.configOptions && Object.keys(upgrade.configOptions).length > 0;
            const currentConfig = upgradeConfigs?.[upgrade.key] || {};
            
            return (
              <div 
                key={upgrade.key} 
                className={`${styles.upgradeRow} ${isSelected ? styles.upgradeRowSelected : ''} ${hasConflict ? styles.upgradeRowConflict : ''}`}
              >
                <div className={styles.upgradeMainRow}>
                  <button
                    type="button"
                    className={styles.upgradeToggle}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Pass the full upgrade object so we can check for configOptions
                      onToggle(upgrade.key, upgrade.name, replacementInfo, upgrade);
                    }}
                    aria-label={`${isSelected ? 'Deselect' : 'Select'} ${upgrade.name}`}
                    aria-checked={isSelected}
                    role="checkbox"
                  >
                    <span className={styles.checkbox} aria-hidden="true">
                      {isSelected && <Icons.check size={10} />}
                    </span>
                    <span className={styles.upgradeName}>{upgrade.name}</span>
                  </button>
                  {hasConflict && (
                    <span className={styles.conflictBadge} title={`Replaces: ${replacementInfo.names.join(', ')}`}>
                      <Icons.swap size={10} />
                    </span>
                  )}
                  <button type="button" className={styles.infoBtn} onClick={() => onInfoClick(upgrade)} aria-label={`Learn more about ${upgrade.name}`} title={`Learn more about ${upgrade.name}`}>
                    <Icons.info size={16} />
                  </button>
                </div>
                
                {/* Inline config panel - shows when upgrade is selected and has configOptions */}
                {isSelected && hasConfigOptions && (
                  <UpgradeConfigPanel
                    upgradeKey={upgrade.key}
                    configOptions={upgrade.configOptions}
                    currentConfig={currentConfig}
                    onChange={onConfigChange}
                    selectedUpgrades={selectedModules}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Upgrade Center Component
 */
export default function UpgradeCenter({ 
  car, 
  initialBuildId = null, 
  onChangeCar = null,
  onBuildSummaryUpdate = null,
  factoryConfig = null,
  onFactoryConfigChange = null,
  selectedWheelFitment = null,
  onWheelFitmentChange = null,
  openSaveModalOnMount = false,
  onSaveModalOpened = null,
  // Build goal (track, street, show, daily) - used to prioritize upgrade categories
  goal = null,
  onGoalChange = null,
}) {
  const { isAuthenticated, user } = useAuth();
  const { saveBuild, updateBuild, getBuildById, canSave } = useSavedBuilds();
  const { vehicles, applyModifications, addVehicle } = useOwnedVehicles();
  const { tierConfig } = useTierConfig();
  const { openChatWithPrompt } = useAIChat();
  
  // Vehicle-specific tuning profile (safe additive enhancement)
  const { profile: tuningProfile, hasProfile: hasTuningProfile, loading: tuningProfileLoading } = useTuningProfile(car);
  
  // All useState hooks must be called unconditionally (before any early returns)
  const [selectedPackage, setSelectedPackage] = useState('stock');
  const [selectedModules, setSelectedModules] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedUpgradeForModal, setSelectedUpgradeForModal] = useState(null);
  const [currentBuildId, setCurrentBuildId] = useState(initialBuildId);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [buildName, setBuildName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveToGarage, setSaveToGarage] = useState(false);
  const [selectedGarageVehicle, setSelectedGarageVehicle] = useState(null);
  const [conflictNotification, setConflictNotification] = useState(null);
  const [isAddingToGarage, setIsAddingToGarage] = useState(false);
  const [vehicleAddedSuccess, setVehicleAddedSuccess] = useState(false);

  // Selected parts for builds (loaded from saved builds, UI removed)
  const [selectedParts, setSelectedParts] = useState([]);
  
  // Upgrade configurations - stores config for upgrades with configOptions
  // e.g., { 'downpipe': { type: 'catless' }, 'coilovers': { springRate: 'sport' } }
  const [upgradeConfigs, setUpgradeConfigs] = useState({});
  
  // Build photos - stored separately and linked to build ID
  const [buildImages, setBuildImages] = useState([]);
  
  // Track if current build has a linked community post (React Query)
  const { 
    data: linkedCommunityPost, 
    isLoading: checkingCommunityPost,
    refetch: refetchLinkedPost,
  } = useLinkedPost(currentBuildId, { enabled: !!currentBuildId });
  
  // Toggle for whether to share to / keep in community when saving
  const [shareToNewCommunity, setShareToNewCommunity] = useState(false);
  
  // Separate community title (public name like "My Stormtrooper") from build name (internal)
  const [communityTitle, setCommunityTitle] = useState('');
  
  // Video player state
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  // Track which build ID we've already loaded to prevent re-loading on every getBuildById change
  // This fixes a bug where auto-save causes getBuildById reference to change, triggering the
  // load effect which resets selectedModules to the (stale) saved value
  const loadedBuildIdRef = useRef(null);
  
  // Tuner Mode: 'basic' or 'advanced' - advanced shows physics-based projections
  const [tunerMode, setTunerMode] = useState('basic');
  
  // Advanced Tuning section collapsed state (for power users who want deep customization)
  const [advancedTuningExpanded, setAdvancedTuningExpanded] = useState(false);

  // Advanced mode state - detailed build specs for physics model
  const [advancedSpecs, setAdvancedSpecs] = useState({
    engine: { 
      type: 'stock', // stock, built, stroked
      cams: 'stock', // stock, stage1, stage2, stage3
      camDuration: null, // intake duration @ 0.050" (for advanced users)
      headWork: false, 
      displacement: 2.0,
      internals: 'stock', // stock, forged
      compression: null, // compression ratio
      valvetrain: 'stock', // stock, upgraded, titanium
      blockType: 'stock', // stock, closed-deck, sleeved
    },
    intake: {
      type: 'stock', // stock, cold-air, short-ram
      throttleBody: 'stock', // stock, ported, oversized
      throttleBodyMm: null, // specific size if known
      manifold: 'stock', // stock, ported, aftermarket
    },
    exhaust: {
      headers: 'stock', // stock, equal-length, long-tube
      downpipe: 'stock', // stock, catted, catless
      downpipeDiameter: null, // 3", 3.5", 4" etc
      catback: 'stock', // stock, axleback, catback, turboback
      exhaustDiameter: null, // main exhaust diameter
    },
    turbo: { 
      type: 'stock', // stock, upgraded, custom
      modelId: null, 
      customModel: '', 
      inducerMm: null, 
      exducerMm: null,
      targetBoostPsi: null,
      peakBoostPsi: null, // peak vs target (taper)
      compressorAR: null, // compressor A/R
      turbineAR: null, // turbine A/R
      twinScroll: false,
      ballBearing: true, // ball bearing vs journal
      wastegate: 'stock', // stock, upgraded, external
      wastegateSpring: null, // spring pressure in PSI
      intercooler: 'stock', // stock, fmic, tmic, air-to-water
      intercoolerSize: null, // core volume in liters
      boostController: 'none', // none, manual, electronic
    },
    fuel: { 
      type: '93', 
      injectorCc: null, 
      fuelPump: '',
      fuelPumpLph: null, // liters per hour flow
      fuelRails: false,
      flexFuel: false,
      baseFuelPressure: null, // base fuel pressure PSI
      returnStyle: false, // return style fuel system
    },
    power_adders: {
      methanol: false, // methanol/water injection
      methanolRatio: null, // methanol percentage (50%, 100%)
      methanolNozzleSize: null, // nozzle size
      nitrous: false,
      nitrousType: 'none', // none, dry, wet
      nitrousShot: null, // shot size in HP
    },
    ecu: {
      type: 'stock', // stock, flash, standalone, piggyback
      ecuBrand: '', // Haltech, AEM, Link, MoTeC, etc.
      tuner: '', // tuner name/company
      dynoTuned: false,
      flexFuelTuned: false,
      boostByGear: false,
      launchControl: false,
      antiLag: false,
    },
    drivetrain: {
      clutch: 'stock', // stock, stage1, stage2, stage3, twin-disc
      flywheel: 'stock', // stock, lightweight, single-mass
      transmission: 'stock', // stock, built, swap
      transType: 'manual', // manual, dct, auto, cvt
      finalDrive: null, // final drive ratio
      differential: 'stock', // stock, lsd, upgraded
      drivetrainLoss: null, // override drivetrain loss %
      torqueConverter: 'stock', // for auto (stock, stall converter)
      stallSpeed: null, // stall converter RPM
    },
    weight: {
      stockWeight: null, // override stock weight
      weightReduction: 0, // lbs removed (negative = added)
      hasRollCage: false,
      strippedInterior: false,
      carbonParts: [], // hood, trunk, roof, fenders
      driverWeight: 180, // driver weight for calcs
    },
    suspension: {
      type: 'stock', // stock, lowering-springs, coilovers, air
      rideHeightDrop: 0, // inches dropped from stock
      springRateFront: null, // lbs/in
      springRateRear: null, // lbs/in
      damperAdjustable: false,
      swayBarFront: 'stock', // stock, upgraded, adjustable
      swayBarRear: 'stock', // stock, upgraded, adjustable, removed
      strutBar: false, // front strut bar
      rearStrutBar: false,
      subframeBrace: false,
      alignment: 'stock', // stock, street, aggressive, track
      camberFront: null, // degrees negative
      camberRear: null,
    },
    brakes: {
      padCompound: 'stock', // stock, street-performance, track, race
      rotorType: 'stock', // stock, slotted, drilled, slotted-drilled, 2-piece
      rotorSizeFront: null, // diameter in mm
      bbkFront: false, // big brake kit
      bbkRear: false,
      caliperPistons: null, // 4, 6, 8 piston
      brakeLine: 'stock', // stock, stainless
      brakeFluid: 'dot3', // dot3, dot4, dot5.1, racing
      brakeDuct: false, // brake cooling ducts
    },
    aero: {
      frontSplitter: 'none', // none, lip, splitter, splitter-rods
      rearWing: 'none', // none, lip-spoiler, duckbill, gt-wing-low, gt-wing-high
      diffuser: false,
      sideSkirts: false,
      canards: false,
      flatBottom: false, // underbody panels
      downforceLevel: 'stock', // stock, mild, moderate, aggressive, max
    },
    wheels: {
      type: 'stock', // stock, aftermarket, forged
      weightPerWheel: null, // lbs per wheel
      widthFront: null, // inches
      widthRear: null, // inches
      diameterFront: null, // inches
      diameterRear: null, // inches
      offsetFront: null, // mm
      offsetRear: null,
      spacers: false,
    },
    tires: {
      compound: 'summer', // all-season, summer, max-performance, r-comp, drag-radial, slick
      width: null, // tire width mm
      aspect: null, // aspect ratio
      diameter: null, // wheel diameter
      tirePressure: null, // hot pressure PSI
    },
    environment: {
      altitude: 0, // feet above sea level
      ambientTemp: 70, // degrees F
      humidity: 50, // percentage
      densityAltitude: null, // calculated or override
    },
    cooling: {
      radiator: 'stock', // stock, aluminum, dual-pass
      radiatorRows: null, // number of rows
      oilCooler: false,
      oilCoolerSize: null, // plate count
      transCooler: false,
      icSprayer: false, // intercooler sprayer
    },
    verified: {
      hasDyno: false,
      whp: null,
      wtq: null,
      dynoType: 'dynojet', // dynojet, mustang, hub
      correctionFactor: 'SAE', // SAE, STD, uncorrected
      dynoShop: '',
      dynoDate: null,
      quarterMile: null,
      quarterMileTrap: null, // trap speed MPH
      sixtyFoot: null, // 60ft time
      zeroToSixty: null,
      zeroToHundred: null,
      rollRace: null, // 40-140, 60-130, etc format
    },
  });
  
  // Turbo library options (loaded via React Query)
  const { data: turboOptions = [], isLoading: loadingTurbos } = useTurbos({
    enabled: tunerMode === 'advanced',
  });
  
  // Expandable detail sections in Advanced mode
  const [expandedSections, setExpandedSections] = useState({
    engineDetails: false,
    turboDetails: false,
    fuelDetails: false,
    drivetrainDetails: false,
    verifiedDetails: false,
  });
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Defensive: use safe car slug for effects - prevents crashes if car is undefined
  const safeCarSlug = car?.slug || '';

  // Reset upgrade state when car changes
  useEffect(() => {
    setSelectedModules([]);
    setSelectedPackage('stock');
    setCurrentBuildId(null);
    setActiveCategory(null);
    // Reset the loaded build tracker so a new build can be loaded for this car
    loadedBuildIdRef.current = null;
    // Reset advanced specs but keep mode
    setAdvancedSpecs({
      engine: { type: 'stock', cams: 'stock', camDuration: null, headWork: false, displacement: 2.0, internals: 'stock', compression: null, valvetrain: 'stock', blockType: 'stock' },
      intake: { type: 'stock', throttleBody: 'stock', throttleBodyMm: null, manifold: 'stock' },
      exhaust: { headers: 'stock', downpipe: 'stock', downpipeDiameter: null, catback: 'stock', exhaustDiameter: null },
      turbo: { type: 'stock', modelId: null, customModel: '', inducerMm: null, exducerMm: null, targetBoostPsi: null, peakBoostPsi: null, compressorAR: null, turbineAR: null, twinScroll: false, ballBearing: true, wastegate: 'stock', wastegateSpring: null, intercooler: 'stock', intercoolerSize: null, boostController: 'none' },
      fuel: { type: '93', injectorCc: null, fuelPump: '', fuelPumpLph: null, fuelRails: false, flexFuel: false, baseFuelPressure: null, returnStyle: false },
      power_adders: { methanol: false, methanolRatio: null, methanolNozzleSize: null, nitrous: false, nitrousType: 'none', nitrousShot: null },
      ecu: { type: 'stock', ecuBrand: '', tuner: '', dynoTuned: false, flexFuelTuned: false, boostByGear: false, launchControl: false, antiLag: false },
      drivetrain: { clutch: 'stock', flywheel: 'stock', transmission: 'stock', transType: 'manual', finalDrive: null, differential: 'stock', drivetrainLoss: null, torqueConverter: 'stock', stallSpeed: null },
      weight: { stockWeight: null, weightReduction: 0, hasRollCage: false, strippedInterior: false, carbonParts: [], driverWeight: 180 },
      suspension: { type: 'stock', rideHeightDrop: 0, springRateFront: null, springRateRear: null, damperAdjustable: false, swayBarFront: 'stock', swayBarRear: 'stock', strutBar: false, rearStrutBar: false, subframeBrace: false, alignment: 'stock', camberFront: null, camberRear: null },
      brakes: { padCompound: 'stock', rotorType: 'stock', rotorSizeFront: null, bbkFront: false, bbkRear: false, caliperPistons: null, brakeLine: 'stock', brakeFluid: 'dot3', brakeDuct: false },
      aero: { frontSplitter: 'none', rearWing: 'none', diffuser: false, sideSkirts: false, canards: false, flatBottom: false, downforceLevel: 'stock' },
      wheels: { type: 'stock', weightPerWheel: null, widthFront: null, widthRear: null, diameterFront: null, diameterRear: null, offsetFront: null, offsetRear: null, spacers: false },
      tires: { compound: 'summer', width: null, aspect: null, diameter: null, tirePressure: null },
      environment: { altitude: 0, ambientTemp: 70, humidity: 50, densityAltitude: null },
      cooling: { radiator: 'stock', radiatorRows: null, oilCooler: false, oilCoolerSize: null, transCooler: false, icSprayer: false },
      verified: { hasDyno: false, whp: null, wtq: null, dynoType: 'dynojet', correctionFactor: 'SAE', dynoShop: '', dynoDate: null, quarterMile: null, quarterMileTrap: null, sixtyFoot: null, zeroToSixty: null, zeroToHundred: null, rollRace: null },
    });
  }, [safeCarSlug]);
  
  // Turbos are now loaded via React Query (useTurbos hook above)
  
  // Load initial build if provided
  // IMPORTANT: Only load ONCE per build ID to prevent auto-save from triggering a reload
  // that would reset selectedModules to the stale saved value
  useEffect(() => {
    if (initialBuildId && safeCarSlug) {
      // Skip if we've already loaded this build
      if (loadedBuildIdRef.current === initialBuildId) {
        return;
      }
      
      const build = getBuildById(initialBuildId);
      if (build && build.carSlug === safeCarSlug) {
        // Mark this build as loaded BEFORE setting state to prevent race conditions
        loadedBuildIdRef.current = initialBuildId;
        
        // IMPORTANT: Normalize upgrades to string keys
        // Database may store full objects or just keys depending on how the build was saved
        const normalizedUpgrades = (build.upgrades || [])
          .map(u => typeof u === 'string' ? u : u?.key)
          .filter(Boolean);
        
        setSelectedModules(normalizedUpgrades);
        setSelectedParts(build.parts || build.selectedParts || []);
        setSelectedPackage('custom');
        setCurrentBuildId(initialBuildId);
        // Load saved build name
        if (build.name) {
          setBuildName(build.name);
        }
        // Load upgrade configurations (e.g., catless downpipe, coilover spring rates)
        if (build.upgradeConfigs) {
          setUpgradeConfigs(build.upgradeConfigs);
        }
      }
    }
  }, [initialBuildId, getBuildById, safeCarSlug]);
  
  // Load build images when build ID changes
  // Load build images via API route for native app compatibility
  // Includes images linked by car_slug for cross-feature sharing with garage
  useEffect(() => {
    async function loadBuildImages() {
      if (!currentBuildId) {
        setBuildImages([]);
        return;
      }
      
      try {
        // Build URL with optional carSlug for cross-feature sharing
        let url = `/api/builds/${currentBuildId}/images`;
        if (safeCarSlug) {
          url += `?carSlug=${encodeURIComponent(safeCarSlug)}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          console.error('[UpgradeCenter] Error loading build images:', response.statusText);
          setBuildImages([]);
          return;
        }
        
        const { images } = await response.json();
        setBuildImages(images || []);
      } catch (err) {
        console.error('[UpgradeCenter] Error loading build images:', err);
        setBuildImages([]);
      }
    }
    
    loadBuildImages();
  }, [currentBuildId, safeCarSlug]);

  // Sync form state when linked community post data changes
  useEffect(() => {
    if (linkedCommunityPost) {
      setShareToNewCommunity(linkedCommunityPost.is_published !== false);
      if (linkedCommunityPost.title) {
        setCommunityTitle(linkedCommunityPost.title);
      }
    } else if (!checkingCommunityPost && currentBuildId) {
      // No linked post found - reset form state
      setShareToNewCommunity(false);
      setCommunityTitle('');
    }
  }, [linkedCommunityPost, checkingCommunityPost, currentBuildId]);
  
  // Open save modal on mount if requested (e.g., from Projects share button)
  // This unifies sharing through the save modal's community toggle
  useEffect(() => {
    if (openSaveModalOnMount && currentBuildId && !checkingCommunityPost) {
      // Set default build name if not already set
      if (!buildName && car) {
        setBuildName(`${car.name} Build`);
      }
      setShowSaveModal(true);
      // Notify parent that modal has been opened
      onSaveModalOpened?.();
    }
  }, [openSaveModalOnMount, currentBuildId, checkingCommunityPost, buildName, car, onSaveModalOpened]);
  
  // Guard: return empty upgrades structure if no car
  const availableUpgrades = useMemo(() => {
    if (!car) return { packages: [], modulesByCategory: {} };
    return getAvailableUpgrades(car);
  }, [car]);
  
  const packageUpgrades = useMemo(() => {
    if (selectedPackage === 'stock') return [];
    if (selectedPackage === 'custom') return selectedModules;
    const pkg = availableUpgrades.packages?.find(p => p.key === selectedPackage);
    return pkg?.includedUpgradeKeys || [];
  }, [selectedPackage, selectedModules, availableUpgrades.packages]);
  
  const effectiveModules = useMemo(() => {
    if (selectedPackage === 'stock') return [];
    if (selectedPackage === 'custom') return selectedModules;
    return packageUpgrades;
  }, [selectedPackage, selectedModules, packageUpgrades]);
  
  // Guard: return safe defaults if no car
  const profile = useMemo(() => {
    if (!car) {
      return {
        stockMetrics: { hp: 0, zeroToSixty: 0, braking60To0: 0, lateralG: 0 },
        upgradedMetrics: { hp: 0, zeroToSixty: 0, braking60To0: 0, lateralG: 0 },
        stockScores: { drivability: 0, reliabilityHeat: 0, soundEmotion: 0 },
        upgradedScores: { drivability: 0, reliabilityHeat: 0, soundEmotion: 0 },
        selectedUpgrades: [],
      };
    }
    const baseProfile = getPerformanceProfile(car, effectiveModules);
    
    // Calculate HP bonus from upgrade configurations (e.g., catless downpipe vs catted)
    let configHpBonus = 0;
    effectiveModules.forEach(moduleKey => {
      const upgrade = getUpgradeByKey(moduleKey);
      if (upgrade?.configOptions && upgradeConfigs[moduleKey]) {
        configHpBonus += calculateConfigHpModifier(upgrade.configOptions, upgradeConfigs[moduleKey]);
      }
    });
    
    // Apply config HP bonus to upgraded metrics
    if (configHpBonus > 0) {
      baseProfile.upgradedMetrics = {
        ...baseProfile.upgradedMetrics,
        hp: (baseProfile.upgradedMetrics.hp || 0) + configHpBonus,
      };
    }
    
    // Apply tire compound grip bonus to lateralG
    const tireGripBonus = selectedWheelFitment?.gripBonus || 0;
    if (tireGripBonus > 0 && baseProfile.upgradedMetrics.lateralG) {
      baseProfile.upgradedMetrics = {
        ...baseProfile.upgradedMetrics,
        lateralG: Math.min(1.6, baseProfile.upgradedMetrics.lateralG + tireGripBonus),
      };
      // Also slightly improve braking with better grip
      if (baseProfile.upgradedMetrics.braking60To0) {
        const brakingImprovement = tireGripBonus * 5; // ~5ft improvement per 0.1g grip
        baseProfile.upgradedMetrics.braking60To0 = Math.max(
          85, // minimum realistic braking distance
          baseProfile.upgradedMetrics.braking60To0 - brakingImprovement
        );
      }
    }
    
    return baseProfile;
  }, [car, effectiveModules, selectedWheelFitment, upgradeConfigs]);
  
  const totalCost = useMemo(() => {
    if (!car) return { low: 0, high: 0, confidence: 'estimated', confidencePercent: 0 };
    return calculateTotalCost(profile.selectedUpgrades, car);
  }, [profile.selectedUpgrades, car]);
  
  const hpGain = profile.upgradedMetrics.hp - profile.stockMetrics.hp;
  // Show upgrades if any package selected OR if tire compound affects grip
  const tireGripBonus = selectedWheelFitment?.gripBonus || 0;
  const hasUpgradeEffects = selectedPackage !== 'stock' || tireGripBonus > 0;
  const showUpgrade = hasUpgradeEffects;
  const isCustomMode = selectedPackage === 'custom';
  
  // Calculate physics-based HP estimate for advanced mode
  // NOTE: This is a STANDALONE ADVANCED CALCULATOR separate from lib/performanceCalculator.
  // It handles highly specialized inputs (turbo inducer size, boost pressure ratios, 
  // methanol percentages, nitrous shot size, environmental corrections, turbo flow maps)
  // that are beyond the scope of the standard upgrade module system.
  // The standard lib/performanceCalculator handles upgrade keys like "stage2-tune", "intercooler", etc.
  const advancedHpEstimate = useMemo(() => {
    if (tunerMode !== 'advanced') return null;
    
    const stockHp = car?.hp || 300;
    const stockBoost = 21; // Typical turbo car stock boost
    
    // If user has verified dyno results, use them (Tier 1)
    if (advancedSpecs.verified?.hasDyno && advancedSpecs.verified?.whp) {
      return {
        whp: advancedSpecs.verified.whp,
        gain: advancedSpecs.verified.whp - stockHp,
        range: null,
        confidence: 'high',
        confidenceLabel: 'User verified dyno data',
        tier: 1,
      };
    }
    
    // Find selected turbo data
    const selectedTurbo = turboOptions.find(t => t.id === advancedSpecs.turbo?.modelId);
    
    let estimatedWhp = stockHp;
    let range = null;
    let confidence = 'medium';
    let confidenceLabel = 'Physics estimate';
    let calculations = [];
    
    // === ENGINE MULTIPLIER ===
    let engineMultiplier = 1.0;
    if (advancedSpecs.engine?.type === 'built' || advancedSpecs.engine?.type === 'stroked') {
      // Built internals allow more power but don't add directly
      engineMultiplier += 0.02;
      
      // Cams
      if (advancedSpecs.engine.cams === 'stage3') engineMultiplier += 0.12;
      else if (advancedSpecs.engine.cams === 'stage2') engineMultiplier += 0.07;
      else if (advancedSpecs.engine.cams === 'stage1') engineMultiplier += 0.04;
      
      // Valvetrain
      if (advancedSpecs.engine.valvetrain === 'titanium') engineMultiplier += 0.03;
      else if (advancedSpecs.engine.valvetrain === 'upgraded') engineMultiplier += 0.01;
      
      // Head work
      if (advancedSpecs.engine.headWork) engineMultiplier += 0.06;
      
      // Displacement (stroked)
      if (advancedSpecs.engine.type === 'stroked' && advancedSpecs.engine.displacement) {
        const stockDisplacement = 2.0; // Default, ideally from car data
        engineMultiplier *= advancedSpecs.engine.displacement / stockDisplacement;
      }
    }
    
    // === INTAKE & EXHAUST MULTIPLIER ===
    let breathingMultiplier = 1.0;
    
    // Intake
    if (advancedSpecs.intake?.type === 'cold-air') breathingMultiplier += 0.02;
    else if (advancedSpecs.intake?.type === 'short-ram') breathingMultiplier += 0.01;
    
    if (advancedSpecs.intake?.throttleBody === 'oversized') breathingMultiplier += 0.02;
    else if (advancedSpecs.intake?.throttleBody === 'ported') breathingMultiplier += 0.01;
    
    // Exhaust - more significant for power
    if (advancedSpecs.exhaust?.headers === 'long-tube') breathingMultiplier += 0.04;
    else if (advancedSpecs.exhaust?.headers === 'equal-length') breathingMultiplier += 0.02;
    
    // Platform-specific downpipe gains (forum-validated)
    // Some platforms (RS5 2.9T) have efficient factory DPs with minimal gain
    // Others (B58, Evo X) have restrictive factory DPs with good gains
    if (advancedSpecs.exhaust?.downpipe !== 'stock') {
      const platformDpGain = getPlatformDownpipeGain(car);
      const dpMultiplier = platformDpGain / stockHp;
      // Catless adds ~20% more than catted
      if (advancedSpecs.exhaust?.downpipe === 'catless') {
        breathingMultiplier += dpMultiplier * 1.2;
      } else {
        breathingMultiplier += dpMultiplier;
      }
    }
    
    if (advancedSpecs.exhaust?.catback === 'turboback') breathingMultiplier += 0.02;
    else if (advancedSpecs.exhaust?.catback === 'catback') breathingMultiplier += 0.01;
    
    // === FUEL MULTIPLIER ===
    let fuelMultiplier = 1.0;
    if (advancedSpecs.fuel?.type === 'e85') fuelMultiplier = 1.15;
    else if (advancedSpecs.fuel?.type === 'e50') fuelMultiplier = 1.10;
    else if (advancedSpecs.fuel?.type === 'e30') fuelMultiplier = 1.06;
    else if (advancedSpecs.fuel?.type === '91') fuelMultiplier = 0.97;
    
    // Flex fuel with proper injectors enables full E85 potential
    if (advancedSpecs.fuel?.flexFuel && advancedSpecs.fuel?.injectorCc >= 1000) {
      fuelMultiplier *= 1.02; // Additional headroom
    }
    
    // === ECU/TUNING BONUS ===
    let tuneMultiplier = 1.0;
    if (advancedSpecs.ecu?.type === 'standalone') tuneMultiplier += 0.05;
    else if (advancedSpecs.ecu?.type === 'flash') tuneMultiplier += 0.02;
    if (advancedSpecs.ecu?.dynoTuned) tuneMultiplier += 0.02;
    if (advancedSpecs.ecu?.antiLag) tuneMultiplier += 0.02; // Better spool
    
    // === INTERCOOLER EFFICIENCY ===
    let icMultiplier = 1.0;
    if (advancedSpecs.turbo?.intercooler === 'air-to-water') icMultiplier = 1.05;
    else if (advancedSpecs.turbo?.intercooler === 'fmic') icMultiplier = 1.03;
    else if (advancedSpecs.turbo?.intercooler === 'tmic') icMultiplier = 1.01;
    if (advancedSpecs.cooling?.icSprayer) icMultiplier *= 1.02; // IC sprayer bonus
    
    // === POWER ADDERS ===
    let powerAdderHp = 0;
    
    // Methanol injection: +8-15% depending on concentration
    if (advancedSpecs.power_adders?.methanol) {
      const methRatio = advancedSpecs.power_adders.methanolRatio || '50';
      if (methRatio === '100') powerAdderHp += stockHp * 0.15;
      else if (methRatio === '50') powerAdderHp += stockHp * 0.10;
      else if (methRatio === '30') powerAdderHp += stockHp * 0.06;
      else powerAdderHp += stockHp * 0.03; // Water only - cooling benefit
    }
    
    // Nitrous: direct HP addition
    if (advancedSpecs.power_adders?.nitrous && advancedSpecs.power_adders.nitrousShot) {
      powerAdderHp += advancedSpecs.power_adders.nitrousShot;
    }
    
    // === ENVIRONMENT CORRECTION ===
    let environmentMultiplier = 1.0;
    const altitude = advancedSpecs.environment?.altitude || 0;
    const ambientTemp = advancedSpecs.environment?.ambientTemp || 70;
    
    // Altitude correction: ~3% loss per 1000ft for turbo cars (less than NA)
    // Turbo can compensate somewhat, but intercooler efficiency drops
    if (altitude > 0) {
      const altitudeLoss = (altitude / 1000) * 0.02; // 2% per 1000ft for turbo
      environmentMultiplier *= (1 - altitudeLoss);
    }
    
    // Temperature correction: ~1% loss per 10°F above 60°F
    if (ambientTemp > 60) {
      const tempLoss = ((ambientTemp - 60) / 10) * 0.01;
      environmentMultiplier *= (1 - Math.min(tempLoss, 0.15)); // Cap at 15% loss
    }
    
    // === TURBO CALCULATION ===
    if (advancedSpecs.turbo?.type === 'upgraded' || advancedSpecs.turbo?.type === 'custom') {
      // Method 1: Turbo library data (best)
      if (selectedTurbo && selectedTurbo.flow_hp_min && selectedTurbo.flow_hp_max) {
        const turboEfficiency = advancedSpecs.turbo?.ballBearing !== false ? 0.78 : 0.72; // Journal bearing less efficient
        const allMultipliers = engineMultiplier * breathingMultiplier * fuelMultiplier * tuneMultiplier * icMultiplier * environmentMultiplier;
        const flowMidpoint = (selectedTurbo.flow_hp_min + selectedTurbo.flow_hp_max) / 2;
        const turboHp = Math.round((flowMidpoint * turboEfficiency * allMultipliers) + powerAdderHp);
        
        calculations.push({ method: 'turbo_flow', hp: turboHp, weight: 0.4 });
        
        range = {
          low: Math.round((selectedTurbo.flow_hp_min * turboEfficiency * fuelMultiplier * 0.95 * environmentMultiplier) + powerAdderHp),
          high: Math.round((selectedTurbo.flow_hp_max * turboEfficiency * allMultipliers) + powerAdderHp),
        };
        confidence = 'high';
        confidenceLabel = `Based on ${selectedTurbo.model} flow`;
      }
      
      // Method 2: Inducer size
      if (advancedSpecs.turbo.inducerMm) {
        const inducer = advancedSpecs.turbo.inducerMm;
        const hpPotential = Math.pow(inducer / 50, 2.3) * 400;
        const allMultipliers = engineMultiplier * breathingMultiplier * fuelMultiplier * tuneMultiplier * icMultiplier * environmentMultiplier;
        const inducerHp = Math.round((hpPotential * allMultipliers * 0.85) + powerAdderHp);
        calculations.push({ method: 'inducer', hp: inducerHp, weight: 0.25 });
        
        if (!range) {
          range = { low: Math.round(inducerHp * 0.88), high: Math.round(inducerHp * 1.08) };
        }
        
        if (confidence !== 'high') {
          confidenceLabel = `${inducer}mm inducer estimate`;
        }
      }
      
      // Method 3: Target boost pressure ratio
      if (advancedSpecs.turbo.targetBoostPsi) {
        const pr = (14.7 + advancedSpecs.turbo.targetBoostPsi) / (14.7 + stockBoost);
        const boostGain = (pr - 1) * 0.70;
        const allMultipliers = engineMultiplier * breathingMultiplier * fuelMultiplier * tuneMultiplier * icMultiplier * environmentMultiplier;
        const boostHp = Math.round((stockHp * (1 + boostGain) * allMultipliers) + powerAdderHp);
        calculations.push({ method: 'boost', hp: boostHp, weight: 0.25 });
        
        if (confidence !== 'high') {
          confidenceLabel = `@ ${advancedSpecs.turbo.targetBoostPsi} PSI`;
        }
      }
      
      // Generic fallback
      if (calculations.length === 0) {
        const genericMult = advancedSpecs.turbo.type === 'custom' ? 1.8 : 1.5;
        const allMultipliers = engineMultiplier * breathingMultiplier * fuelMultiplier * tuneMultiplier * icMultiplier * environmentMultiplier;
        estimatedWhp = Math.round((stockHp * genericMult * allMultipliers) + powerAdderHp);
        confidence = 'low';
        confidenceLabel = 'Select turbo for better estimate';
      }
    } else {
      // No turbo upgrade - use actual module HP gains from selected upgrades
      const allMultipliers = engineMultiplier * breathingMultiplier * fuelMultiplier * tuneMultiplier * environmentMultiplier;
      
      // Calculate actual HP gains from selected modules
      let moduleHpGain = 0;
      effectiveModules.forEach(moduleKey => {
        const upgrade = getUpgradeByKey(moduleKey);
        if (upgrade?.metricChanges?.hpGain) {
          moduleHpGain += upgrade.metricChanges.hpGain;
        }
      });
      
      // Apply multipliers to the gains (e.g., E85 makes tune more effective)
      const adjustedModuleGain = Math.round(moduleHpGain * allMultipliers);
      estimatedWhp = Math.round(stockHp + adjustedModuleGain + powerAdderHp);
      
      if (moduleHpGain > 0) {
        confidenceLabel = `${effectiveModules.length} mods selected`;
        confidence = 'medium';
      } else {
        confidenceLabel = 'Select mods';
        confidence = 'low';
      }
    }
    
    // Weighted average of calculations
    if (calculations.length > 0) {
      const totalWeight = calculations.reduce((sum, c) => sum + c.weight, 0);
      estimatedWhp = Math.round(calculations.reduce((sum, c) => sum + c.hp * c.weight, 0) / totalWeight);
      
      // Improve confidence if multiple methods agree
      if (calculations.length >= 2) {
        const variance = Math.max(...calculations.map(c => c.hp)) - Math.min(...calculations.map(c => c.hp));
        if (variance < estimatedWhp * 0.1) {
          confidence = 'high';
        }
      }
    }
    
    // Build environment context for label
    let envNote = '';
    if (altitude > 1000 || ambientTemp > 85) {
      envNote = ` (${altitude > 1000 ? altitude.toLocaleString() + 'ft' : ''}${altitude > 1000 && ambientTemp > 85 ? ', ' : ''}${ambientTemp > 85 ? ambientTemp + '°F' : ''})`;
    }
    
    // === HANDLING SCORE CALCULATION ===
    let handlingScore = 100; // Base score (stock)
    
    // Suspension improvements
    const suspType = advancedSpecs.suspension?.type || 'stock';
    if (suspType === 'lowering-springs') handlingScore += 8;
    else if (suspType === 'coilovers') handlingScore += 15;
    else if (suspType === 'coilovers-race') handlingScore += 25;
    
    // Sway bars
    if (advancedSpecs.suspension?.swayBarFront === 'upgraded') handlingScore += 3;
    else if (advancedSpecs.suspension?.swayBarFront === 'adjustable') handlingScore += 5;
    if (advancedSpecs.suspension?.swayBarRear === 'upgraded') handlingScore += 2;
    else if (advancedSpecs.suspension?.swayBarRear === 'adjustable') handlingScore += 4;
    
    // Chassis bracing
    if (advancedSpecs.suspension?.strutBar) handlingScore += 3;
    if (advancedSpecs.suspension?.subframeBrace) handlingScore += 4;
    
    // Alignment (more camber = more grip in corners)
    const alignment = advancedSpecs.suspension?.alignment || 'stock';
    if (alignment === 'street') handlingScore += 5;
    else if (alignment === 'aggressive') handlingScore += 10;
    else if (alignment === 'track') handlingScore += 15;
    
    // Tires (huge impact)
    const tireCompound = advancedSpecs.tires?.compound || 'summer';
    const tireHandlingBonus = {
      'all-season': -10,
      'summer': 0,
      'max-performance': 10,
      'r-comp': 25,
      'drag-radial': 5, // Good straight line, not corners
      'slick': 35,
    };
    handlingScore += tireHandlingBonus[tireCompound] || 0;
    
    // Aero (more downforce = better cornering at speed)
    const frontAero = advancedSpecs.aero?.frontSplitter || 'none';
    if (frontAero === 'lip') handlingScore += 2;
    else if (frontAero === 'splitter') handlingScore += 5;
    else if (frontAero === 'splitter-rods') handlingScore += 8;
    
    const rearAero = advancedSpecs.aero?.rearWing || 'none';
    if (rearAero === 'lip-spoiler') handlingScore += 2;
    else if (rearAero === 'duckbill') handlingScore += 4;
    else if (rearAero === 'gt-wing-low') handlingScore += 8;
    else if (rearAero === 'gt-wing-high') handlingScore += 12;
    
    if (advancedSpecs.aero?.diffuser) handlingScore += 6;
    if (advancedSpecs.aero?.canards) handlingScore += 3;
    if (advancedSpecs.aero?.flatBottom) handlingScore += 4;
    
    // Wheels (lighter = better response)
    const wheelType = advancedSpecs.wheels?.type || 'stock';
    if (wheelType === 'aftermarket') handlingScore += 2;
    else if (wheelType === 'flow-formed') handlingScore += 4;
    else if (wheelType === 'forged') handlingScore += 7;
    
    // === BRAKING SCORE CALCULATION ===
    let brakingScore = 100; // Base score (stock)
    
    // Pad compound
    const padCompound = advancedSpecs.brakes?.padCompound || 'stock';
    if (padCompound === 'street-performance') brakingScore += 10;
    else if (padCompound === 'track') brakingScore += 20;
    else if (padCompound === 'race') brakingScore += 30;
    
    // Rotors
    const rotorType = advancedSpecs.brakes?.rotorType || 'stock';
    if (rotorType === 'slotted' || rotorType === 'drilled') brakingScore += 5;
    else if (rotorType === 'slotted-drilled') brakingScore += 7;
    else if (rotorType === '2-piece') brakingScore += 12;
    
    // Big brake kit
    if (advancedSpecs.brakes?.bbkFront) brakingScore += 20;
    if (advancedSpecs.brakes?.bbkRear) brakingScore += 10;
    
    // Fluid & lines
    const brakeFluid = advancedSpecs.brakes?.brakeFluid || 'dot3';
    if (brakeFluid === 'dot4') brakingScore += 3;
    else if (brakeFluid === 'dot5.1') brakingScore += 5;
    else if (brakeFluid === 'racing') brakingScore += 8;
    
    if (advancedSpecs.brakes?.brakeLine === 'stainless') brakingScore += 5;
    if (advancedSpecs.brakes?.brakeDuct) brakingScore += 5;
    
    // Tires affect braking too
    const tireBrakingBonus = {
      'all-season': -15,
      'summer': 0,
      'max-performance': 10,
      'r-comp': 20,
      'drag-radial': 5,
      'slick': 25,
    };
    brakingScore += tireBrakingBonus[tireCompound] || 0;
    
    // === TOP SPEED EFFECT (Aero drag) ===
    let topSpeedDelta = 0; // mph change from stock
    // More aero = more drag = lower top speed (but better cornering)
    if (frontAero === 'splitter') topSpeedDelta -= 2;
    else if (frontAero === 'splitter-rods') topSpeedDelta -= 4;
    if (rearAero === 'gt-wing-low') topSpeedDelta -= 5;
    else if (rearAero === 'gt-wing-high') topSpeedDelta -= 12;
    if (advancedSpecs.aero?.diffuser) topSpeedDelta -= 2;
    // More power can offset
    const powerBonus = Math.floor((estimatedWhp - stockHp) / 20);
    topSpeedDelta += powerBonus;
    
    return {
      whp: estimatedWhp,
      gain: estimatedWhp - stockHp,
      range,
      confidence,
      confidenceLabel: confidenceLabel + envNote,
      tier: confidence === 'high' ? 2 : confidence === 'medium' ? 3 : 4,
      powerAdderHp,
      environmentMultiplier,
      // New handling/braking metrics
      handlingScore: Math.round(handlingScore),
      brakingScore: Math.round(brakingScore),
      topSpeedDelta,
    };
  }, [tunerMode, car, advancedSpecs, turboOptions, effectiveModules]);
  
  // ============================================================================
  // SINGLE SOURCE OF TRUTH FOR HP VALUES
  // Basic mode: Use profile calculations (getPerformanceProfile)
  // Advanced mode: Use physics-based advancedHpEstimate
  // This ensures display, save modal, and saved data are all consistent
  // ============================================================================
  const effectiveHpGain = useMemo(() => {
    if (tunerMode === 'advanced' && advancedHpEstimate?.gain) {
      return advancedHpEstimate.gain;
    }
    return hpGain; // Basic mode fallback
  }, [tunerMode, advancedHpEstimate, hpGain]);
  
  const effectiveFinalHp = useMemo(() => {
    if (tunerMode === 'advanced' && advancedHpEstimate?.whp) {
      return advancedHpEstimate.whp;
    }
    return profile.upgradedMetrics.hp; // Basic mode fallback
  }, [tunerMode, advancedHpEstimate, profile.upgradedMetrics.hp]);
  
  // Tunability & Recommendations (with guards for missing car)
  const tunability = useMemo(() => {
    if (!car) return { score: 0, label: 'Unknown' };
    return calculateTunability(car);
  }, [car]);
  
  const upgradesByCategory = useMemo(() => {
    const result = {};
    UPGRADE_CATEGORIES.forEach(cat => {
      const modules = availableUpgrades.modulesByCategory?.[cat.key] || [];
      result[cat.key] = modules;
    });
    return result;
  }, [availableUpgrades.modulesByCategory]);
  
  const selectedByCategory = useMemo(() => {
    const result = {};
    UPGRADE_CATEGORIES.forEach(cat => {
      const categoryUpgrades = upgradesByCategory[cat.key] || [];
      result[cat.key] = categoryUpgrades.filter(u => effectiveModules.includes(u.key)).length;
    });
    return result;
  }, [upgradesByCategory, effectiveModules]);
  
  // Goal-filtered and sorted categories
  const goalInfo = useMemo(() => {
    if (!goal) return null;
    return GOAL_CATEGORY_MAP[goal] || null;
  }, [goal]);
  
  // Categories sorted by goal priority (goal-aligned categories first)
  const sortedCategories = useMemo(() => {
    // Filter to categories with available upgrades
    const availableCats = UPGRADE_CATEGORIES.filter(cat => 
      cat.key !== 'wheels' && 
      (upgradesByCategory[cat.key]?.length || 0) > 0
    );
    
    if (!goal) return availableCats;
    
    // Sort with goal-aligned categories first
    const catKeys = availableCats.map(c => c.key);
    const sortedKeys = sortCategoriesByGoal(catKeys, goal);
    
    return sortedKeys.map(key => availableCats.find(c => c.key === key)).filter(Boolean);
  }, [upgradesByCategory, goal]);
  
  // Construct build summary object - Single Source of Truth
  const buildSummary = useMemo(() => {
    const upgradesArray = profile.selectedUpgrades.map(key => {
      const upgrade = getUpgradeByKey(key);
      return {
        key,
        name: upgrade?.name || key,
        hpGain: upgrade?.hp || 0,
        cost: upgrade?.costLow || 0,
        category: upgrade?.category || 'other',
      };
    });
    
    return {
      totalHpGain: effectiveHpGain, 
      totalTqGain: 0, 
      totalCost: totalCost.low || 0,
      upgradeCount: profile.selectedUpgrades.length,
      selectedUpgrades: upgradesArray,
    };
  }, [effectiveHpGain, totalCost.low, profile.selectedUpgrades]);

  // Calculate reliability and handling scores using performanceCalculator (SOURCE OF TRUTH)
  const reliabilityData = useMemo(() => {
    const hpGainPercent = (car?.hp && effectiveHpGain > 0) 
      ? effectiveHpGain / car.hp 
      : 0;
    return calculateReliabilityScore(effectiveModules, hpGainPercent);
  }, [effectiveModules, effectiveHpGain, car?.hp]);

  const handlingData = useMemo(() => {
    return calculateHandlingScore(effectiveModules);
  }, [effectiveModules]);

  // Performance metrics for BuildDashboard - MUST match Performance Metrics page exactly
  // Uses profile.upgradedMetrics directly (SOURCE OF TRUTH from calculateUpgradedMetrics)
  // NOT effectiveHpGain/effectiveFinalHp which differ in advanced mode
  const dashboardMetrics = useMemo(() => ({
    stockHp: profile.stockMetrics.hp,
    finalHp: profile.upgradedMetrics.hp,
    hpGain: profile.upgradedMetrics.hp - profile.stockMetrics.hp,
    stockZeroToSixty: profile.stockMetrics.zeroToSixty,
    finalZeroToSixty: profile.upgradedMetrics.zeroToSixty,
    reliabilityScore: reliabilityData.percent,
    handlingScore: handlingData.percent,
  }), [
    profile.stockMetrics.hp,
    profile.stockMetrics.zeroToSixty,
    profile.upgradedMetrics.hp,
    profile.upgradedMetrics.zeroToSixty,
    reliabilityData.percent,
    handlingData.percent,
  ]);

  // Notify parent of build summary changes
  useEffect(() => {
    if (onBuildSummaryUpdate) {
      onBuildSummaryUpdate(buildSummary);
    }
  }, [onBuildSummaryUpdate, buildSummary]);
  
  // Listen for save/clear/share events from header buttons and BuildSummaryBar
  useEffect(() => {
    const handleSaveEvent = () => {
      // Open save modal - allow saving even with no upgrades for car configs
      setShowSaveModal(true);
    };
    
    const handleShareEvent = () => {
      // Open save modal with community sharing enabled
      setShareToNewCommunity(true);
      if (!communityTitle && buildName) {
        setCommunityTitle(buildName);
      }
      setShowSaveModal(true);
    };
    
    const handleClearEvent = () => {
      setSelectedPackage('stock');
      setSelectedModules([]);
    };
    
    document.addEventListener('tuning-shop:save-build', handleSaveEvent);
    document.addEventListener('tuning-shop:share-build', handleShareEvent);
    document.addEventListener('tuning-shop:clear-build', handleClearEvent);
    
    return () => {
      document.removeEventListener('tuning-shop:save-build', handleSaveEvent);
      document.removeEventListener('tuning-shop:share-build', handleShareEvent);
      document.removeEventListener('tuning-shop:clear-build', handleClearEvent);
    };
  }, [communityTitle, buildName]);
  
  // Flatten all upgrades for name lookups
  const allUpgradesFlat = useMemo(() => {
    return Object.values(upgradesByCategory).flat();
  }, [upgradesByCategory]);
  
  const handlePackageSelect = (pkgKey) => {
    setSelectedPackage(pkgKey);
    if (pkgKey !== 'custom') setSelectedModules([]);
  };
  
  // Create contextualized AL prompts based on build context
  const askALAboutBuild = useCallback((section) => {
    if (!car) return;
    
    const carName = car.name;
    const upgradeCount = effectiveModules.length;
    const currentHpGain = hpGain;
    const buildType = selectedPackage !== 'custom' && selectedPackage !== 'stock' 
      ? selectedPackage.charAt(0).toUpperCase() + selectedPackage.slice(1) 
      : null;
    
    // Detailed prompts sent to AL
    const prompts = {
      recommendation: upgradeCount > 0
        ? `I have a ${carName} with ${upgradeCount} upgrades (+${currentHpGain} HP). What else would you recommend for my ${buildType ? buildType + ' build' : 'current setup'}?`
        : `Give me detailed upgrade recommendations for my ${carName}. What are the best bang-for-buck mods, and what should I prioritize?`,
      buildType: buildType
        ? `Help me optimize my ${buildType} build for my ${carName}. What upgrades work best together for this style?`
        : `What build should I do for my ${carName}? Should I focus on street, track, or something else?`,
      upgrades: upgradeCount > 0
        ? `I have these upgrades on my ${carName}: ${effectiveModules.slice(0, 5).join(', ')}${upgradeCount > 5 ? ` and ${upgradeCount - 5} more` : ''}. What should I add next for the best gains?`
        : `What upgrades should I do first on my ${carName}? I want the best power gains without reliability issues.`,
      configure: `Help me configure my upgrades for my ${carName}. I have ${upgradeCount} mods (+${currentHpGain} HP). What tuning settings and configurations will give me the best results?`,
    };
    
    // Short, clear questions shown to user in the confirmation card
    const displayMessages = {
      recommendation: upgradeCount > 0
        ? `What upgrades should I add next to my ${carName}? (+${currentHpGain} HP so far)`
        : `What are the best upgrades for my ${carName}? Where should I start?`,
      buildType: buildType
        ? `How do I optimize my ${buildType} build on my ${carName}?`
        : `Should I build my ${carName} for street, track, or both?`,
      upgrades: upgradeCount > 0
        ? `What should I add next? (${upgradeCount} mods selected)`
        : `What upgrades give the best gains on my ${carName}?`,
      configure: `How should I configure my ${upgradeCount} mods for the best results?`,
    };
    
    const prompt = prompts[section] || `Tell me about ${section} for my ${carName}`;
    const displayMessage = displayMessages[section] || prompt;
    
    openChatWithPrompt(prompt, {
      category: section.charAt(0).toUpperCase() + section.slice(1),
      carSlug: car.slug,
      carName,
      upgradeCount,
      hpGain: currentHpGain,
      buildType,
    }, displayMessage);
  }, [car, effectiveModules, hpGain, selectedPackage, openChatWithPrompt]);
  
  const handleModuleToggle = useCallback((moduleKey, moduleName, replacementInfo, upgrade) => {
    // When switching from a package to Custom, preserve the package's upgrades
    const switchingToCustom = !isCustomMode;
    
    setSelectedModules(prev => {
      // If switching from a package, start with the package's upgrades instead of empty array
      let baseModules = switchingToCustom && packageUpgrades.length > 0 
        ? [...packageUpgrades] 
        : [...prev];
      
      // If already selected, remove it
      if (baseModules.includes(moduleKey)) {
        // Also clear the config for this upgrade
        setUpgradeConfigs(prevConfigs => {
          const newConfigs = { ...prevConfigs };
          delete newConfigs[moduleKey];
          return newConfigs;
        });
        return baseModules.filter(k => k !== moduleKey);
      }
      
      // Check for conflicts and resolve them
      if (replacementInfo && replacementInfo.conflictingUpgrades?.length > 0) {
        const replacedNames = replacementInfo.names?.join(' and ') || '';
        if (replacedNames) {
          setConflictNotification({
            message: `"${replacedNames}" has been replaced with "${moduleName}"`,
            replacedUpgrade: replacedNames,
          });
        }
        
        // Remove conflicting upgrades and add the new one
        const conflictingKeys = replacementInfo.conflictingUpgrades || [];
        baseModules = baseModules.filter(k => !conflictingKeys.includes(k));
        
        // Also clear configs for conflicting upgrades
        setUpgradeConfigs(prevConfigs => {
          const newConfigs = { ...prevConfigs };
          conflictingKeys.forEach(key => delete newConfigs[key]);
          return newConfigs;
        });
      }
      
      // If the upgrade has configOptions, initialize with defaults
      if (upgrade?.configOptions) {
        const defaultConfig = getDefaultConfig(upgrade.configOptions);
        if (Object.keys(defaultConfig).length > 0) {
          setUpgradeConfigs(prevConfigs => ({
            ...prevConfigs,
            [moduleKey]: defaultConfig,
          }));
        }
      }
      
      return [...baseModules, moduleKey];
    });
    
    // Switch to custom mode after updating modules
    if (switchingToCustom) {
      setSelectedPackage('custom');
    }
  }, [isCustomMode, packageUpgrades]);
  
  // Handler for upgrade configuration changes
  const handleUpgradeConfigChange = useCallback((upgradeKey, config) => {
    setUpgradeConfigs(prev => ({
      ...prev,
      [upgradeKey]: config,
    }));
  }, []);
  
  const handleSaveBuild = async () => {
    if (!canSave) { setSaveError('Please sign in'); return; }
    if (!buildName.trim()) { setSaveError('Enter a build name'); return; }
    if (shareToNewCommunity && !communityTitle.trim() && !buildName.trim()) { 
      setSaveError('Enter a community title'); return; 
    }
    if (saveToGarage && !selectedGarageVehicle) { setSaveError('Select a vehicle from your garage'); return; }
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Check if user has entered any advanced specs (for deciding whether to save advancedSpecs)
      const hasAdvancedData = tunerMode === 'advanced' && (
        advancedSpecs.engine?.type !== 'stock' ||
        advancedSpecs.turbo?.type !== 'stock' ||
        advancedSpecs.fuel?.type !== '93' ||
        advancedSpecs.exhaust?.downpipe !== 'stock' ||
        advancedSpecs.verified?.hasDyno
      );
      
      // Use the pre-computed effectiveHpGain and effectiveFinalHp (single source of truth)
      // These are already calculated based on tunerMode: basic vs advanced
      console.log('[UpgradeCenter] Save HP values:', {
        tunerMode,
        basicHpGain: hpGain,
        advancedGain: advancedHpEstimate?.gain,
        effectiveHpGain, // Pre-computed based on mode
        effectiveFinalHp, // Pre-computed based on mode
      });
      
      // Ensure upgrades are always saved as string keys, not full objects
      const normalizedUpgrades = effectiveModules
        .map(u => typeof u === 'string' ? u : u?.key)
        .filter(Boolean);
      
      const buildData = {
        carSlug: car.slug,
        carName: car.name,
        name: buildName.trim(),
        selectedUpgrades: normalizedUpgrades,
        selectedParts,
        upgradeConfigs: upgradeConfigs,  // Include upgrade configurations (catless, etc.)
        // Use the pre-computed HP values (single source of truth)
        totalHpGain: effectiveHpGain,
        totalCostLow: totalCost.low,
        totalCostHigh: totalCost.high,
        finalHp: effectiveFinalHp,
        selectedPackage,
        // Include factory configuration and wheel fitment from props
        factoryConfig: factoryConfig || null,
        wheelFitment: selectedWheelFitment || null,
        // Store tuner mode and advanced specs for future reference
        tunerMode: tunerMode,
        advancedSpecs: hasAdvancedData ? advancedSpecs : null,
        // Note: Hero image is now stored as is_primary on user_uploaded_images
        
        // Performance metrics snapshot (for consistent community display)
        stockHp: profile.stockMetrics.hp || car.hp || null,
        stockZeroToSixty: profile.stockMetrics.zeroToSixty || car.zero_to_sixty || null,
        stockBraking60To0: profile.stockMetrics.braking60To0 || car.braking_60_0 || null,
        stockLateralG: profile.stockMetrics.lateralG || car.lateral_g || null,
        finalZeroToSixty: profile.upgradedMetrics.zeroToSixty || null,
        finalBraking60To0: profile.upgradedMetrics.braking60To0 || null,
        finalLateralG: profile.upgradedMetrics.lateralG || null,
        zeroToSixtyImprovement: profile.stockMetrics.zeroToSixty && profile.upgradedMetrics.zeroToSixty 
          ? Math.round((profile.stockMetrics.zeroToSixty - profile.upgradedMetrics.zeroToSixty) * 100) / 100 
          : null,
        brakingImprovement: profile.stockMetrics.braking60To0 && profile.upgradedMetrics.braking60To0
          ? Math.round(profile.stockMetrics.braking60To0 - profile.upgradedMetrics.braking60To0)
          : null,
        lateralGImprovement: profile.stockMetrics.lateralG && profile.upgradedMetrics.lateralG
          ? Math.round((profile.upgradedMetrics.lateralG - profile.stockMetrics.lateralG) * 1000) / 1000
          : null,
      };
      
      const result = currentBuildId 
        ? await updateBuild(currentBuildId, buildData)
        : await saveBuild(buildData);
      
      if (result.error) {
        setSaveError(result.error.message || 'Failed to save');
      } else {
        const savedBuildId = result.data?.id || currentBuildId;
        
        // Link uploaded images to the new build (if any were uploaded before saving)
        // This ensures images uploaded on phone show up when viewing on desktop
        if (savedBuildId && buildImages.length > 0) {
          const unlinkedImages = buildImages.filter(img => !img.user_build_id);
          if (unlinkedImages.length > 0) {
            try {
              const linkResponse = await fetch('/api/uploads', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageIds: unlinkedImages.map(img => img.id),
                  buildId: savedBuildId,
                }),
              });
              
              if (linkResponse.ok) {
                console.log(`[UpgradeCenter] Linked ${unlinkedImages.length} images to build ${savedBuildId}`);
                // Update local state to reflect the link
                setBuildImages(prev => prev.map(img => ({
                  ...img,
                  user_build_id: savedBuildId,
                })));
              } else {
                console.error('[UpgradeCenter] Failed to link images to build');
              }
            } catch (err) {
              console.error('[UpgradeCenter] Error linking images:', err);
            }
          }
        }
        
        // If saving to garage, apply the modifications to the selected vehicle
        if (saveToGarage && selectedGarageVehicle && savedBuildId) {
          const modResult = await applyModifications(selectedGarageVehicle, {
            upgrades: effectiveModules,
            totalHpGain: effectiveHpGain,  // Use the same effective HP as saved
            buildId: savedBuildId,
          });
          
          if (modResult.error) {
            setSaveError('Project saved but failed to apply to garage vehicle');
          }
        }
        
        // Handle community post based on toggle state
        if (linkedCommunityPost && !shareToNewCommunity) {
          // Unpublish existing post via API (includes cache invalidation)
          try {
            const response = await fetch('/api/community/posts', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postId: linkedCommunityPost.id,
                isPublished: false,
              }),
            });
            
            if (response.ok) {
              // Refetch to update the linked post state
              refetchLinkedPost();
            } else {
              console.error('[UpgradeCenter] Error unpublishing community post');
            }
          } catch (err) {
            console.error('[UpgradeCenter] Error unpublishing community post:', err);
          }
        } else if (!linkedCommunityPost && shareToNewCommunity && savedBuildId) {
          // Create new community post - use communityTitle or fall back to buildName
          const postTitle = (communityTitle || buildName).trim();
          try {
            const response = await fetch('/api/community/posts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postType: 'build',
                title: postTitle,
                description: '',
                buildId: savedBuildId,
                carSlug: car.slug,
                carName: car.name,
                imageIds: [], // Will use images already linked to build
              }),
            });
            
            if (response.ok) {
              const postData = await response.json();
              console.log('[UpgradeCenter] Created community post:', postData);
              // Will be loaded on next check
            } else {
              console.error('[UpgradeCenter] Error creating community post');
            }
          } catch (err) {
            console.error('[UpgradeCenter] Error creating community post:', err);
          }
        } else if (linkedCommunityPost && shareToNewCommunity) {
          // Update existing post via API (includes cache invalidation)
          // Also update title if user changed it
          const postTitle = (communityTitle || buildName).trim();
          try {
            await fetch('/api/community/posts', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                postId: linkedCommunityPost.id,
                isPublished: true,
                title: postTitle, // Update title in case user changed it
              }),
            });
          } catch (err) {
            console.error('[UpgradeCenter] Error updating community post:', err);
          }
        }
        
        if (result.data && !currentBuildId) setCurrentBuildId(savedBuildId);
        setShowSaveModal(false);
        setBuildName('');
        setSaveToGarage(false);
        setSelectedGarageVehicle(null);
        setVehicleAddedSuccess(false);
        setSelectedGarageVehicle(null);
      }
    } catch {
      setSaveError('Error saving build');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Early return AFTER all hooks to satisfy React Rules of Hooks
  // This ensures hooks are called in the same order on every render
  if (!car || !safeCarSlug) {
    console.warn('[UpgradeCenter] Missing or invalid car prop');
    return (
      <div className={styles.section}>
        <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '40px' }}>
          Unable to load upgrade center. Please select a car.
        </p>
        {onChangeCar && (
          <button 
            onClick={onChangeCar}
            style={{ 
              margin: '0 auto', 
              display: 'block', 
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #d4af37, #b8973a)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Select a Car
          </button>
        )}
      </div>
    );
  }

  const tierInfo = tierConfig[car.tier] || {};
  const activeCategoryData = UPGRADE_CATEGORIES.find(c => c.key === activeCategory);
  
  // Get user's selected hero image (is_primary = true) or fall back to stock
  return (
    <div className={styles.upgradeCenter}>
      {/* ═══════════════════════════════════════════════════════════════════════
          MODE TOGGLE - Basic vs Advanced tuning experience
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className={styles.modeToggleSection}>
        <div className={styles.modeToggleFullWidth}>
          <button
            className={`${styles.modeToggleBtn} ${tunerMode === 'basic' ? styles.modeToggleBtnActive : ''}`}
            onClick={() => setTunerMode('basic')}
          >
            <Icons.settings size={18} />
            <span className={styles.modeToggleBtnTitle}>Basic Tuning</span>
          </button>
          <button
            className={`${styles.modeToggleBtn} ${tunerMode === 'advanced' ? styles.modeToggleBtnActive : ''}`}
            onClick={() => setTunerMode('advanced')}
          >
            <Icons.brain size={18} />
            <span className={styles.modeToggleBtnTitle}>Advanced</span>
          </button>
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════════
          BUILD RECOMMENDATIONS - Quick presets (Basic Mode only)
          ═══════════════════════════════════════════════════════════════════════ */}
      {tunerMode === 'basic' && (
        <div className={styles.buildRecommendationsSection}>
          <div className={styles.buildRecommendationsCard}>
            <div className={`${styles.buildRecommendationsHeader} text-display`}>
              <Icons.settings size={16} />
              <span>BUILD RECOMMENDATIONS</span>
              <button 
                className={styles.askAlBtn}
                onClick={() => askALAboutBuild('buildType')}
                title="Ask AL what build to do"
              >
                <Icons.sparkle size={12} />
                Ask AL
              </button>
            </div>
            {/* Street, Track, Drag on first row */}
            <div className={styles.buildRecommendationsGrid}>
              {BUILD_RECOMMENDATIONS.map(pkg => (
                <button
                  key={pkg.key}
                  className={`${styles.buildRecBtn} ${selectedPackage === pkg.key ? styles.buildRecBtnActive : ''}`}
                  onClick={() => handlePackageSelect(pkg.key)}
                >
                  {pkg.label}
                </button>
              ))}
            </div>
            {/* Custom on second row */}
            <div className={styles.buildRecommendationsCustomRow}>
              <button
                className={`${styles.buildRecBtnCustomFull} ${selectedPackage === 'custom' ? styles.buildRecBtnActive : ''}`}
                onClick={() => handlePackageSelect('custom')}
              >
                <Icons.settings size={14} />
                <span>Custom Build</span>
                <span className={styles.customBuildHint}>Pick your own upgrades</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ═══════════════════════════════════════════════════════════════════════
          WORKSPACE - Build configuration (sidebar only, no performance panel)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className={styles.workspace}>
        {/* Sidebar - Build Configuration */}
        <div className={styles.sidebarFull}>
          
          {/* Factory Configuration has been removed per product decision */}
          
          {/* ═══════════════════════════════════════════════════════════════
              ADVANCED MODE - Add Upgrades FIRST, then Configure
              ═══════════════════════════════════════════════════════════════ */}
          
          {/* Step 1: Add Upgrades - Advanced Mode (MOVED UP - users select first) */}
          {tunerMode === 'advanced' && (
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarCardHeader}>
                <Icons.bolt size={16} />
                <span className={`${styles.sidebarCardTitle} text-display`}>Add Upgrades</span>
                <button 
                  className={styles.askAlBtn}
                  onClick={() => askALAboutBuild('upgrades')}
                  title="Ask AL about upgrades"
                >
                  <Icons.sparkle size={12} />
                  Ask AL
                </button>
              </div>
              <div className={styles.sidebarCardContent}>
                {/* Goal indicator if goal is set */}
                {goalInfo && (
                  <div className={styles.goalIndicator}>
                    <span className={styles.goalLabel}>Building for: {goalInfo.label}</span>
                  </div>
                )}
                <div className={styles.categoryList}>
                  <CategoryNav
                    categories={sortedCategories.map(c => c.key)}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                    selectedCounts={selectedByCategory}
                    variant="list"
                    recommendedCategories={sortedCategories
                      .filter(c => goal && isCategoryPrimaryForGoal(c.key, goal))
                      .map(c => c.key)}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Step 2: Configure Selected Upgrades - Advanced Mode (Dynamic based on selections) */}
          {tunerMode === 'advanced' && effectiveModules.length > 0 && (
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarCardHeader}>
                <Icons.settings size={16} />
                <span className={`${styles.sidebarCardTitle} text-display`}>Configure Upgrades</span>
                <button 
                  className={styles.askAlBtn}
                  onClick={() => askALAboutBuild('configure')}
                  title="Ask AL about configuration"
                >
                  <Icons.sparkle size={12} />
                  Ask AL
                </button>
              </div>
              <div className={styles.sidebarCardContent}>
                <DynamicBuildConfig
                  selectedUpgrades={effectiveModules}
                  upgradeConfigs={upgradeConfigs}
                  onConfigChange={handleUpgradeConfigChange}
                />
              </div>
            </div>
          )}
          
          {/* ═══════════════════════════════════════════════════════════════
              BASIC MODE - Upgrade Categories
              (Build Recommendations moved to top-level section above)
              ═══════════════════════════════════════════════════════════════ */}
          
          {/* Upgrade Categories Card - Basic Mode */}
          {tunerMode === 'basic' && (
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarCardHeader}>
                <Icons.bolt size={16} />
                <span className={`${styles.sidebarCardTitle} text-display`}>Upgrade Categories</span>
                <button 
                  className={styles.askAlBtn}
                  onClick={() => askALAboutBuild('upgrades')}
                  title="Ask AL about upgrades"
                >
                  <Icons.sparkle size={12} />
                  Ask AL
                </button>
              </div>
              <div className={styles.sidebarCardContent}>
                {/* Goal indicator if goal is set */}
                {goalInfo && (
                  <div className={styles.goalIndicator}>
                    <span className={styles.goalLabel}>Building for: {goalInfo.label}</span>
                  </div>
                )}
                <div className={styles.categoryList}>
                  <CategoryNav
                    categories={sortedCategories.map(c => c.key)}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                    selectedCounts={selectedByCategory}
                    variant="list"
                    recommendedCategories={sortedCategories
                      .filter(c => goal && isCategoryPrimaryForGoal(c.key, goal))
                      .map(c => c.key)}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Wheels & Tires - After Upgrade Categories */}
          <div className={styles.sidebarCard}>
            <WheelTireConfigurator
              car={car}
              selectedFitment={selectedWheelFitment}
              onSelect={onWheelFitmentChange}
              showCostEstimates={true}
              defaultExpanded={false}
              compact={true}
              selectedUpgrades={effectiveModules}
              onUpgradeToggle={(key) => handleModuleToggle(key, 'Lightweight Wheels', null)}
            />
          </div>
          
          {/* Advanced Tuning - Collapsible deep-dive options for power users */}
          {tunerMode === 'advanced' && (
            <div className={styles.sidebarCard}>
              <button 
                className={styles.sidebarCardHeaderCollapsible}
                onClick={() => setAdvancedTuningExpanded(!advancedTuningExpanded)}
              >
                <Icons.brain size={16} />
                <span className={`${styles.sidebarCardTitle} text-display`}>Advanced Tuning</span>
                <span className={styles.advancedTuningHint}>Engine builds, turbo sizing, fuel...</span>
                <Icons.chevronRight 
                  size={14} 
                  className={`${styles.collapseChevron} ${advancedTuningExpanded ? styles.collapseChevronExpanded : ''}`} 
                />
              </button>
              {advancedTuningExpanded && (
              <div className={`${styles.sidebarCardContent} ${styles.advancedScrollable}`}>
                
                {/* ENGINE SECTION */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.bolt size={14} />
                    <span>Engine</span>
                  </div>
                  <div className={styles.advancedField}>
                    <label className={styles.advancedLabel}>Build Type</label>
                    <select
                      className={styles.advancedSelect}
                      value={advancedSpecs.engine.type}
                      onChange={e => setAdvancedSpecs(prev => ({
                        ...prev,
                        engine: { ...prev.engine, type: e.target.value }
                      }))}
                    >
                      <option value="stock">Stock Internals</option>
                      <option value="built">Built (Forged Internals)</option>
                      <option value="stroked">Stroked / Destroked</option>
                    </select>
                  </div>
                  
                  {(advancedSpecs.engine.type === 'built' || advancedSpecs.engine.type === 'stroked') && (
                    <>
                      <div className={styles.advancedFieldRow}>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Cams</label>
                          <select
                            className={styles.advancedSelect}
                            value={advancedSpecs.engine.cams}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              engine: { ...prev.engine, cams: e.target.value }
                            }))}
                          >
                            <option value="stock">Stock</option>
                            <option value="stage1">Stage 1 (+4%)</option>
                            <option value="stage2">Stage 2 (+7%)</option>
                            <option value="stage3">Stage 3 (+12%)</option>
                          </select>
                        </div>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Valvetrain</label>
                          <select
                            className={styles.advancedSelect}
                            value={advancedSpecs.engine.valvetrain}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              engine: { ...prev.engine, valvetrain: e.target.value }
                            }))}
                          >
                            <option value="stock">Stock</option>
                            <option value="upgraded">Upgraded Springs</option>
                            <option value="titanium">Titanium Retainers</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className={styles.advancedCheckbox}>
                        <label>
                          <input
                            type="checkbox"
                            checked={advancedSpecs.engine.headWork}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              engine: { ...prev.engine, headWork: e.target.checked }
                            }))}
                          />
                          <span>Ported Head (+6% flow)</span>
                        </label>
                      </div>
                    </>
                  )}
                  
                  {advancedSpecs.engine.type === 'stroked' && (
                    <div className={styles.advancedFieldRow}>
                      <div className={styles.advancedFieldHalf}>
                        <label className={styles.advancedLabel}>Displacement (L)</label>
                        <input
                          type="number"
                          className={styles.advancedInput}
                          value={advancedSpecs.engine.displacement}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            engine: { ...prev.engine, displacement: parseFloat(e.target.value) || 2.0 }
                          }))}
                          step="0.1"
                          min="1.5"
                          max="4.5"
                        />
                      </div>
                      <div className={styles.advancedFieldHalf}>
                        <label className={styles.advancedLabel}>Compression</label>
                        <input
                          type="number"
                          className={styles.advancedInput}
                          placeholder="9.0"
                          value={advancedSpecs.engine.compression || ''}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            engine: { ...prev.engine, compression: parseFloat(e.target.value) || null }
                          }))}
                          step="0.1"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* FORCED INDUCTION SECTION - Biggest power gains first */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.turbo size={14} />
                    <span>Forced Induction</span>
                  </div>
                  <div className={styles.advancedField}>
                    <label className={styles.advancedLabel}>Turbo Setup</label>
                    <select
                      className={styles.advancedSelect}
                      value={advancedSpecs.turbo.type}
                      onChange={e => setAdvancedSpecs(prev => ({
                        ...prev,
                        turbo: { ...prev.turbo, type: e.target.value, modelId: null }
                      }))}
                    >
                      <option value="stock">Stock Turbo</option>
                      <option value="upgraded">Bolt-On Upgrade</option>
                      <option value="custom">Big Turbo / Custom</option>
                    </select>
                  </div>
                  
                  {(advancedSpecs.turbo.type === 'upgraded' || advancedSpecs.turbo.type === 'custom') && (
                    <>
                      <div className={styles.advancedField}>
                        <label className={styles.advancedLabel}>
                          Turbo Model
                          {loadingTurbos && <span className={styles.loadingDot}>...</span>}
                        </label>
                        <select
                          className={styles.advancedSelect}
                          value={advancedSpecs.turbo.modelId || ''}
                          onChange={e => {
                            const turboId = e.target.value || null;
                            const turbo = turboOptions.find(t => t.id === turboId);
                            setAdvancedSpecs(prev => ({
                              ...prev,
                              turbo: { 
                                ...prev.turbo, 
                                modelId: turboId,
                                customModel: turbo ? `${turbo.brand} ${turbo.model}` : '',
                                inducerMm: turbo?.inducer_mm || prev.turbo.inducerMm,
                              }
                            }));
                          }}
                        >
                          <option value="">Select from library...</option>
                          {turboOptions.map(turbo => (
                            <option key={turbo.id} value={turbo.id}>
                              {turbo.brand} {turbo.model} ({turbo.flow_hp_min}-{turbo.flow_hp_max} HP)
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {!advancedSpecs.turbo.modelId && (
                        <div className={styles.advancedField}>
                          <label className={styles.advancedLabel}>Or Enter Custom</label>
                          <input
                            type="text"
                            className={styles.advancedInput}
                            placeholder="e.g., GTX3582R Gen 2"
                            value={advancedSpecs.turbo.customModel}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              turbo: { ...prev.turbo, customModel: e.target.value }
                            }))}
                          />
                        </div>
                      )}
                      
                      <div className={styles.advancedFieldRow}>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Inducer (mm)</label>
                          <input
                            type="number"
                            className={styles.advancedInput}
                            placeholder="58"
                            value={advancedSpecs.turbo.inducerMm || ''}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              turbo: { ...prev.turbo, inducerMm: parseFloat(e.target.value) || null }
                            }))}
                          />
                        </div>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Target PSI</label>
                          <input
                            type="number"
                            className={styles.advancedInput}
                            placeholder="30"
                            value={advancedSpecs.turbo.targetBoostPsi || ''}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              turbo: { ...prev.turbo, targetBoostPsi: parseFloat(e.target.value) || null }
                            }))}
                          />
                        </div>
                      </div>
                      
                      <div className={styles.advancedFieldRow}>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Wastegate</label>
                          <select
                            className={styles.advancedSelect}
                            value={advancedSpecs.turbo.wastegate}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              turbo: { ...prev.turbo, wastegate: e.target.value }
                            }))}
                          >
                            <option value="stock">Stock / Internal</option>
                            <option value="upgraded">Upgraded IWG</option>
                            <option value="external">External WG</option>
                          </select>
                        </div>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Intercooler</label>
                          <select
                            className={styles.advancedSelect}
                            value={advancedSpecs.turbo.intercooler}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              turbo: { ...prev.turbo, intercooler: e.target.value }
                            }))}
                          >
                            <option value="stock">Stock</option>
                            <option value="tmic">Upgraded TMIC</option>
                            <option value="fmic">FMIC</option>
                            <option value="air-to-water">Air-to-Water</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                {/* INTAKE & EXHAUST - Now configured in "Configure Upgrades" section above */}
                {/* Removed to eliminate duplicate configuration options */}
                
                {/* FUEL SYSTEM SECTION */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.thermometer size={14} />
                    <span>Fuel System</span>
                  </div>
                  <div className={styles.advancedField}>
                    <label className={styles.advancedLabel}>Fuel Type</label>
                    <div className={styles.fuelTypeGrid}>
                      {['91', '93', 'e30', 'e50', 'e85'].map(fuel => (
                        <button
                          key={fuel}
                          type="button"
                          className={`${styles.fuelTypeBtn} ${advancedSpecs.fuel.type === fuel ? styles.fuelTypeBtnActive : ''}`}
                          onClick={() => setAdvancedSpecs(prev => ({
                            ...prev,
                            fuel: { ...prev.fuel, type: fuel }
                          }))}
                        >
                          {fuel.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Injectors (cc)</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="1000"
                        value={advancedSpecs.fuel.injectorCc || ''}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          fuel: { ...prev.fuel, injectorCc: parseInt(e.target.value) || null }
                        }))}
                      />
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Fuel Pump</label>
                      <input
                        type="text"
                        className={styles.advancedInput}
                        placeholder="Walbro 450"
                        value={advancedSpecs.fuel.fuelPump}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          fuel: { ...prev.fuel, fuelPump: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div className={styles.advancedCheckboxRow}>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.fuel.fuelRails}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          fuel: { ...prev.fuel, fuelRails: e.target.checked }
                        }))}
                      />
                      <span>Fuel Rails</span>
                    </label>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.fuel.flexFuel}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          fuel: { ...prev.fuel, flexFuel: e.target.checked }
                        }))}
                      />
                      <span>Flex Fuel Kit</span>
                    </label>
                  </div>
                </div>
                
                {/* ECU / TUNING SECTION */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.brain size={14} />
                    <span>ECU & Tuning</span>
                  </div>
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>ECU Type</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.ecu.type}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          ecu: { ...prev.ecu, type: e.target.value }
                        }))}
                      >
                        <option value="stock">Stock ECU</option>
                        <option value="flash">Flash Tune</option>
                        <option value="piggyback">Piggyback</option>
                        <option value="standalone">Standalone</option>
                      </select>
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Tuner / Brand</label>
                      <input
                        type="text"
                        className={styles.advancedInput}
                        placeholder="e.g., EcuTek, AMS"
                        value={advancedSpecs.ecu.tuner}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          ecu: { ...prev.ecu, tuner: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                  <div className={styles.advancedCheckbox}>
                    <label>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.ecu.dynoTuned}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          ecu: { ...prev.ecu, dynoTuned: e.target.checked }
                        }))}
                      />
                      <span>Dyno Tuned (vs E-Tune)</span>
                    </label>
                  </div>
                </div>
                
                {/* POWER ADDERS SECTION - Critical for HP */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.bolt size={14} />
                    <span>Power Adders</span>
                    <span className={styles.sectionHint}>+10-300 HP</span>
                  </div>
                  
                  {/* Methanol/Water Injection */}
                  <div className={styles.advancedCheckbox}>
                    <label>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.power_adders?.methanol || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          power_adders: { ...prev.power_adders, methanol: e.target.checked }
                        }))}
                      />
                      <span>Methanol / Water Injection</span>
                    </label>
                  </div>
                  
                  {advancedSpecs.power_adders?.methanol && (
                    <div className={styles.advancedFieldRow}>
                      <div className={styles.advancedFieldHalf}>
                        <label className={styles.advancedLabel}>Meth %</label>
                        <select
                          className={styles.advancedSelect}
                          value={advancedSpecs.power_adders.methanolRatio || '50'}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            power_adders: { ...prev.power_adders, methanolRatio: e.target.value }
                          }))}
                        >
                          <option value="water">Water Only</option>
                          <option value="30">30% Meth</option>
                          <option value="50">50% Meth</option>
                          <option value="100">100% Meth</option>
                        </select>
                      </div>
                      <div className={styles.advancedFieldHalf}>
                        <label className={styles.advancedLabel}>Nozzle Size</label>
                        <input
                          type="number"
                          className={styles.advancedInput}
                          placeholder="1000cc"
                          value={advancedSpecs.power_adders.methanolNozzleSize || ''}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            power_adders: { ...prev.power_adders, methanolNozzleSize: parseInt(e.target.value) || null }
                          }))}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Nitrous */}
                  <div className={styles.advancedCheckbox}>
                    <label>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.power_adders?.nitrous || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          power_adders: { ...prev.power_adders, nitrous: e.target.checked, nitrousType: e.target.checked ? 'wet' : 'none' }
                        }))}
                      />
                      <span>Nitrous Oxide</span>
                    </label>
                  </div>
                  
                  {advancedSpecs.power_adders?.nitrous && (
                    <div className={styles.advancedFieldRow}>
                      <div className={styles.advancedFieldHalf}>
                        <label className={styles.advancedLabel}>Type</label>
                        <select
                          className={styles.advancedSelect}
                          value={advancedSpecs.power_adders.nitrousType || 'wet'}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            power_adders: { ...prev.power_adders, nitrousType: e.target.value }
                          }))}
                        >
                          <option value="dry">Dry</option>
                          <option value="wet">Wet</option>
                          <option value="direct-port">Direct Port</option>
                        </select>
                      </div>
                      <div className={styles.advancedFieldHalf}>
                        <label className={styles.advancedLabel}>Shot Size (HP)</label>
                        <input
                          type="number"
                          className={styles.advancedInput}
                          placeholder="100"
                          value={advancedSpecs.power_adders.nitrousShot || ''}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            power_adders: { ...prev.power_adders, nitrousShot: parseInt(e.target.value) || null }
                          }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* COOLING SECTION - Supports power mods */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.thermometer size={14} />
                    <span>Cooling</span>
                  </div>
                  <div className={styles.advancedField}>
                    <label className={styles.advancedLabel}>Radiator</label>
                    <select
                      className={styles.advancedSelect}
                      value={advancedSpecs.cooling?.radiator || 'stock'}
                      onChange={e => setAdvancedSpecs(prev => ({
                        ...prev,
                        cooling: { ...prev.cooling, radiator: e.target.value }
                      }))}
                    >
                      <option value="stock">Stock</option>
                      <option value="aluminum">Aluminum Upgrade</option>
                      <option value="dual-pass">Dual Pass</option>
                    </select>
                  </div>
                  <div className={styles.advancedCheckboxRow}>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.cooling?.oilCooler || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          cooling: { ...prev.cooling, oilCooler: e.target.checked }
                        }))}
                      />
                      <span>Oil Cooler</span>
                    </label>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.cooling?.transCooler || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          cooling: { ...prev.cooling, transCooler: e.target.checked }
                        }))}
                      />
                      <span>Trans Cooler</span>
                    </label>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.cooling?.icSprayer || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          cooling: { ...prev.cooling, icSprayer: e.target.checked }
                        }))}
                      />
                      <span>IC Sprayer</span>
                    </label>
                  </div>
                </div>
                
                {/* ═══════════════════════════════════════════════════════════════
                    DRIVETRAIN & WEIGHT - Power Transfer
                    ═══════════════════════════════════════════════════════════════ */}
                
                {/* DRIVETRAIN SECTION */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.settings size={14} />
                    <span>Drivetrain</span>
                  </div>
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Clutch</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.drivetrain.clutch}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          drivetrain: { ...prev.drivetrain, clutch: e.target.value }
                        }))}
                      >
                        <option value="stock">Stock</option>
                        <option value="stage1">Stage 1</option>
                        <option value="stage2">Stage 2</option>
                        <option value="stage3">Stage 3</option>
                        <option value="twin-disc">Twin Disc</option>
                      </select>
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Flywheel</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.drivetrain.flywheel}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          drivetrain: { ...prev.drivetrain, flywheel: e.target.value }
                        }))}
                      >
                        <option value="stock">Stock DMF</option>
                        <option value="lightweight">Lightweight</option>
                        <option value="single-mass">Single Mass</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Transmission</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.drivetrain.transmission}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          drivetrain: { ...prev.drivetrain, transmission: e.target.value }
                        }))}
                      >
                        <option value="stock">Stock</option>
                        <option value="built">Built / Upgraded</option>
                        <option value="swap">Swap</option>
                      </select>
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Differential</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.drivetrain.differential}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          drivetrain: { ...prev.drivetrain, differential: e.target.value }
                        }))}
                      >
                        <option value="stock">Stock</option>
                        <option value="lsd">LSD</option>
                        <option value="upgraded">Upgraded LSD</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* ═══════════════════════════════════════════════════════════════
                    CHASSIS - Handling & Braking
                    ═══════════════════════════════════════════════════════════════ */}
                
                {/* SUSPENSION SECTION - Affects handling */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.target size={14} />
                    <span>Suspension</span>
                    <span className={styles.sectionHint}>Handling</span>
                  </div>
                  
                  <div className={styles.advancedField}>
                    <label className={styles.advancedLabel}>Setup Type</label>
                    <select
                      className={styles.advancedSelect}
                      value={advancedSpecs.suspension?.type || 'stock'}
                      onChange={e => setAdvancedSpecs(prev => ({
                        ...prev,
                        suspension: { ...prev.suspension, type: e.target.value }
                      }))}
                    >
                      <option value="stock">Stock</option>
                      <option value="lowering-springs">Lowering Springs</option>
                      <option value="coilovers">Coilovers</option>
                      <option value="coilovers-race">Race Coilovers</option>
                      <option value="air">Air Suspension</option>
                    </select>
                  </div>
                  
                  {advancedSpecs.suspension?.type !== 'stock' && (
                    <>
                      <div className={styles.advancedFieldRow}>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Drop (inches)</label>
                          <input
                            type="number"
                            className={styles.advancedInput}
                            placeholder="1.5"
                            step="0.25"
                            value={advancedSpecs.suspension?.rideHeightDrop || ''}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              suspension: { ...prev.suspension, rideHeightDrop: parseFloat(e.target.value) || 0 }
                            }))}
                          />
                        </div>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Alignment</label>
                          <select
                            className={styles.advancedSelect}
                            value={advancedSpecs.suspension?.alignment || 'stock'}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              suspension: { ...prev.suspension, alignment: e.target.value }
                            }))}
                          >
                            <option value="stock">Stock Specs</option>
                            <option value="street">Street (-1.5° front)</option>
                            <option value="aggressive">Aggressive (-2.5° front)</option>
                            <option value="track">Track (-3°+ front)</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className={styles.advancedFieldRow}>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Front Sway</label>
                          <select
                            className={styles.advancedSelect}
                            value={advancedSpecs.suspension?.swayBarFront || 'stock'}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              suspension: { ...prev.suspension, swayBarFront: e.target.value }
                            }))}
                          >
                            <option value="stock">Stock</option>
                            <option value="upgraded">Upgraded</option>
                            <option value="adjustable">Adjustable</option>
                          </select>
                        </div>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>Rear Sway</label>
                          <select
                            className={styles.advancedSelect}
                            value={advancedSpecs.suspension?.swayBarRear || 'stock'}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              suspension: { ...prev.suspension, swayBarRear: e.target.value }
                            }))}
                          >
                            <option value="removed">Removed</option>
                            <option value="stock">Stock</option>
                            <option value="upgraded">Upgraded</option>
                            <option value="adjustable">Adjustable</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className={styles.advancedCheckboxRow}>
                        <label className={styles.advancedCheckbox}>
                          <input
                            type="checkbox"
                            checked={advancedSpecs.suspension?.strutBar || false}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              suspension: { ...prev.suspension, strutBar: e.target.checked }
                            }))}
                          />
                          <span>Front Strut Bar</span>
                        </label>
                        <label className={styles.advancedCheckbox}>
                          <input
                            type="checkbox"
                            checked={advancedSpecs.suspension?.subframeBrace || false}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              suspension: { ...prev.suspension, subframeBrace: e.target.checked }
                            }))}
                          />
                          <span>Subframe Brace</span>
                        </label>
                      </div>
                    </>
                  )}
                </div>

                {/* BRAKES SECTION - Affects stopping */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.disc size={14} />
                    <span>Brakes</span>
                    <span className={styles.sectionHint}>Stopping power</span>
                  </div>
                  
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Pad Compound</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.brakes?.padCompound || 'stock'}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          brakes: { ...prev.brakes, padCompound: e.target.value }
                        }))}
                      >
                        <option value="stock">Stock/OEM</option>
                        <option value="street-performance">Street Performance</option>
                        <option value="track">Track Day</option>
                        <option value="race">Race Compound</option>
                      </select>
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Rotor Type</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.brakes?.rotorType || 'stock'}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          brakes: { ...prev.brakes, rotorType: e.target.value }
                        }))}
                      >
                        <option value="stock">Stock/Blank</option>
                        <option value="slotted">Slotted</option>
                        <option value="drilled">Drilled</option>
                        <option value="slotted-drilled">Slotted & Drilled</option>
                        <option value="2-piece">2-Piece Floating</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Brake Fluid</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.brakes?.brakeFluid || 'dot3'}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          brakes: { ...prev.brakes, brakeFluid: e.target.value }
                        }))}
                      >
                        <option value="dot3">DOT 3</option>
                        <option value="dot4">DOT 4</option>
                        <option value="dot5.1">DOT 5.1</option>
                        <option value="racing">Racing (Motul RBF)</option>
                      </select>
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Lines</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.brakes?.brakeLine || 'stock'}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          brakes: { ...prev.brakes, brakeLine: e.target.value }
                        }))}
                      >
                        <option value="stock">Stock Rubber</option>
                        <option value="stainless">Stainless Braided</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className={styles.advancedCheckboxRow}>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.brakes?.bbkFront || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          brakes: { ...prev.brakes, bbkFront: e.target.checked }
                        }))}
                      />
                      <span>BBK Front</span>
                    </label>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.brakes?.bbkRear || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          brakes: { ...prev.brakes, bbkRear: e.target.checked }
                        }))}
                      />
                      <span>BBK Rear</span>
                    </label>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.brakes?.brakeDuct || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          brakes: { ...prev.brakes, brakeDuct: e.target.checked }
                        }))}
                      />
                      <span>Brake Ducts</span>
                    </label>
                  </div>
                </div>

                {/* AERO SECTION - Affects downforce & top speed */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.wind size={14} />
                    <span>Aerodynamics</span>
                    <span className={styles.sectionHint}>Grip vs speed</span>
                  </div>
                  
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Front</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.aero?.frontSplitter || 'none'}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          aero: { ...prev.aero, frontSplitter: e.target.value }
                        }))}
                      >
                        <option value="none">Stock</option>
                        <option value="lip">Front Lip</option>
                        <option value="splitter">Splitter</option>
                        <option value="splitter-rods">Splitter + Rods</option>
                      </select>
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Rear</label>
                      <select
                        className={styles.advancedSelect}
                        value={advancedSpecs.aero?.rearWing || 'none'}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          aero: { ...prev.aero, rearWing: e.target.value }
                        }))}
                      >
                        <option value="none">Stock</option>
                        <option value="lip-spoiler">Lip Spoiler</option>
                        <option value="duckbill">Duckbill</option>
                        <option value="gt-wing-low">GT Wing (Low)</option>
                        <option value="gt-wing-high">GT Wing (High)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className={styles.advancedCheckboxRow}>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.aero?.diffuser || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          aero: { ...prev.aero, diffuser: e.target.checked }
                        }))}
                      />
                      <span>Rear Diffuser</span>
                    </label>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.aero?.canards || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          aero: { ...prev.aero, canards: e.target.checked }
                        }))}
                      />
                      <span>Canards</span>
                    </label>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.aero?.flatBottom || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          aero: { ...prev.aero, flatBottom: e.target.checked }
                        }))}
                      />
                      <span>Flat Underbody</span>
                    </label>
                  </div>
                </div>

                {/* WHEELS SECTION - Affects rotational mass */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.circle size={14} />
                    <span>Wheels</span>
                    <span className={styles.sectionHint}>Rotational mass</span>
                  </div>
                  
                  <div className={styles.advancedField}>
                    <label className={styles.advancedLabel}>Wheel Type</label>
                    <select
                      className={styles.advancedSelect}
                      value={advancedSpecs.wheels?.type || 'stock'}
                      onChange={e => setAdvancedSpecs(prev => ({
                        ...prev,
                        wheels: { ...prev.wheels, type: e.target.value }
                      }))}
                    >
                      <option value="stock">Stock (Heavy)</option>
                      <option value="aftermarket">Aftermarket Cast</option>
                      <option value="flow-formed">Flow Formed</option>
                      <option value="forged">Forged (Lightest)</option>
                    </select>
                  </div>
                  
                  {advancedSpecs.wheels?.type !== 'stock' && (
                    <div className={styles.advancedFieldRow}>
                      <div className={styles.advancedFieldHalf}>
                        <label className={styles.advancedLabel}>Weight/wheel (lbs)</label>
                        <input
                          type="number"
                          className={styles.advancedInput}
                          placeholder="18"
                          value={advancedSpecs.wheels?.weightPerWheel || ''}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            wheels: { ...prev.wheels, weightPerWheel: parseFloat(e.target.value) || null }
                          }))}
                        />
                      </div>
                      <div className={styles.advancedFieldHalf}>
                        <label className={styles.advancedLabel}>Width (inches)</label>
                        <input
                          type="number"
                          className={styles.advancedInput}
                          placeholder="9.5"
                          step="0.5"
                          value={advancedSpecs.wheels?.widthFront || ''}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            wheels: { ...prev.wheels, widthFront: parseFloat(e.target.value) || null, widthRear: parseFloat(e.target.value) || null }
                          }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* WEIGHT & TIRES SECTION - Critical for performance */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.car size={14} />
                    <span>Weight & Tires</span>
                    <span className={styles.sectionHint}>Affects 0-60, 1/4</span>
                  </div>
                  
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Weight Change (lbs)</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="-150"
                        value={advancedSpecs.weight?.weightReduction || ''}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          weight: { ...prev.weight, weightReduction: parseInt(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Driver (lbs)</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="180"
                        value={advancedSpecs.weight?.driverWeight || 180}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          weight: { ...prev.weight, driverWeight: parseInt(e.target.value) || 180 }
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div className={styles.advancedCheckboxRow}>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.weight?.strippedInterior || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          weight: { ...prev.weight, strippedInterior: e.target.checked, weightReduction: e.target.checked ? (prev.weight?.weightReduction || 0) - 150 : (prev.weight?.weightReduction || 0) + 150 }
                        }))}
                      />
                      <span>Stripped Interior</span>
                    </label>
                    <label className={styles.advancedCheckbox}>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.weight?.hasRollCage || false}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          weight: { ...prev.weight, hasRollCage: e.target.checked, weightReduction: e.target.checked ? (prev.weight?.weightReduction || 0) + 80 : (prev.weight?.weightReduction || 0) - 80 }
                        }))}
                      />
                      <span>Roll Cage (+80 lbs)</span>
                    </label>
                  </div>
                  
                  <div className={styles.advancedField}>
                    <label className={styles.advancedLabel}>Tire Compound</label>
                    <select
                      className={styles.advancedSelect}
                      value={advancedSpecs.tires?.compound || 'summer'}
                      onChange={e => setAdvancedSpecs(prev => ({
                        ...prev,
                        tires: { ...prev.tires, compound: e.target.value }
                      }))}
                    >
                      <option value="all-season">All-Season (0.85g)</option>
                      <option value="summer">Summer Performance (0.95g)</option>
                      <option value="max-performance">Max Performance (1.02g)</option>
                      <option value="r-comp">R-Compound (1.15g)</option>
                      <option value="drag-radial">Drag Radial (1.4g launch)</option>
                      <option value="slick">Slicks (1.5g+)</option>
                    </select>
                  </div>
                  
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Tire Width (mm)</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="275"
                        value={advancedSpecs.tires?.width || ''}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          tires: { ...prev.tires, width: parseInt(e.target.value) || null }
                        }))}
                      />
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Final Drive</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="3.73"
                        step="0.01"
                        value={advancedSpecs.drivetrain?.finalDrive || ''}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          drivetrain: { ...prev.drivetrain, finalDrive: parseFloat(e.target.value) || null }
                        }))}
                      />
                    </div>
                  </div>
                </div>
                
                {/* ENVIRONMENT SECTION - Critical for accuracy */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.wind size={14} />
                    <span>Environment</span>
                    <span className={styles.sectionHint}>Affects power</span>
                  </div>
                  
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Altitude (ft)</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="0"
                        value={advancedSpecs.environment?.altitude || 0}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          environment: { ...prev.environment, altitude: parseInt(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>Temp (°F)</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="70"
                        value={advancedSpecs.environment?.ambientTemp || 70}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          environment: { ...prev.environment, ambientTemp: parseInt(e.target.value) || 70 }
                        }))}
                      />
                    </div>
                  </div>
                  <p className={styles.advancedHint}>
                    At 5,000ft & 90°F, expect ~15% power loss vs sea level
                  </p>
                </div>
                
                {/* VERIFIED RESULTS SECTION */}
                <div className={styles.advancedSection}>
                  <div className={styles.advancedSectionHeader}>
                    <Icons.check size={14} />
                    <span>Verified Results</span>
                    <span className={styles.sectionHint}>Tier 1 data</span>
                  </div>
                  <div className={styles.advancedCheckbox}>
                    <label>
                      <input
                        type="checkbox"
                        checked={advancedSpecs.verified.hasDyno}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          verified: { ...prev.verified, hasDyno: e.target.checked }
                        }))}
                      />
                      <span>I have dyno results</span>
                    </label>
                  </div>
                  
                  {advancedSpecs.verified.hasDyno && (
                    <>
                      <div className={styles.advancedFieldRow}>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>WHP</label>
                          <input
                            type="number"
                            className={styles.advancedInput}
                            placeholder="450"
                            value={advancedSpecs.verified.whp || ''}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              verified: { ...prev.verified, whp: parseInt(e.target.value) || null }
                            }))}
                          />
                        </div>
                        <div className={styles.advancedFieldHalf}>
                          <label className={styles.advancedLabel}>WTQ</label>
                          <input
                            type="number"
                            className={styles.advancedInput}
                            placeholder="400"
                            value={advancedSpecs.verified.wtq || ''}
                            onChange={e => setAdvancedSpecs(prev => ({
                              ...prev,
                              verified: { ...prev.verified, wtq: parseInt(e.target.value) || null }
                            }))}
                          />
                        </div>
                      </div>
                      <div className={styles.advancedField}>
                        <label className={styles.advancedLabel}>Dyno Shop</label>
                        <input
                          type="text"
                          className={styles.advancedInput}
                          placeholder="Shop name & location"
                          value={advancedSpecs.verified.dynoShop}
                          onChange={e => setAdvancedSpecs(prev => ({
                            ...prev,
                            verified: { ...prev.verified, dynoShop: e.target.value }
                          }))}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className={styles.advancedFieldRow}>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>1/4 Mile (sec)</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="11.5"
                        step="0.1"
                        value={advancedSpecs.verified.quarterMile || ''}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          verified: { ...prev.verified, quarterMile: parseFloat(e.target.value) || null }
                        }))}
                      />
                    </div>
                    <div className={styles.advancedFieldHalf}>
                      <label className={styles.advancedLabel}>0-60 (sec)</label>
                      <input
                        type="number"
                        className={styles.advancedInput}
                        placeholder="4.2"
                        step="0.1"
                        value={advancedSpecs.verified.zeroToSixty || ''}
                        onChange={e => setAdvancedSpecs(prev => ({
                          ...prev,
                          verified: { ...prev.verified, zeroToSixty: parseFloat(e.target.value) || null }
                        }))}
                      />
                    </div>
                  </div>
                </div>
                
                {/* PHYSICS ESTIMATE SUMMARY */}
                {advancedHpEstimate && (
                  <div className={styles.physicsEstimate}>
                    <div className={styles.physicsEstimateHeader}>
                      <Icons.brain size={14} />
                      <span>Best Estimate</span>
                      <span className={`${styles.tierBadge} ${styles[`tier${advancedHpEstimate.tier}`]}`}>
                        Tier {advancedHpEstimate.tier}
                      </span>
                    </div>
                    <div className={styles.physicsEstimateValue}>
                      {advancedSpecs.verified.hasDyno && advancedSpecs.verified.whp ? (
                        <span className={styles.hpSingle}>
                          {advancedSpecs.verified.whp} <span className={styles.hpUnit}>WHP (Verified)</span>
                        </span>
                      ) : advancedHpEstimate.range ? (
                        <span className={styles.hpRange}>
                          {advancedHpEstimate.range.low} - {advancedHpEstimate.range.high} <span className={styles.hpUnit}>HP</span>
                        </span>
                      ) : (
                        <span className={styles.hpSingle}>
                          {advancedHpEstimate.whp} <span className={styles.hpUnit}>HP</span>
                        </span>
                      )}
                    </div>
                    <div className={styles.physicsEstimateLabel}>
                      {advancedSpecs.verified.hasDyno && advancedSpecs.verified.whp 
                        ? 'User verified dyno data'
                        : advancedHpEstimate.confidenceLabel
                      }
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>
          )}
          
        </div>
        
        {/* ═══════════════════════════════════════════════════════════════
            NOTE: Performance Metrics, Experience Scores, and Shopping List
            have been moved to dedicated pages (Data and Parts)
            ═══════════════════════════════════════════════════════════════ */}
      </div>
      
      {/* NOTE: Save Build button removed from bottom - now located in top nav (MyGarageSubNav) */}
      
      {/* Popups */}
      {activeCategory && activeCategoryData && (
        <CategoryPopup
          category={activeCategoryData}
          upgrades={upgradesByCategory[activeCategory] || []}
          selectedModules={effectiveModules}
          onToggle={handleModuleToggle}
          onClose={() => setActiveCategory(null)}
          onInfoClick={(u) => setSelectedUpgradeForModal(getUpgradeByKey(u.key) || u)}
          isCustomMode={isCustomMode}
          allUpgrades={allUpgradesFlat}
          upgradeConfigs={upgradeConfigs}
          onConfigChange={handleUpgradeConfigChange}
        />
      )}
      
      {conflictNotification && (
        <ConflictNotification
          message={conflictNotification.message}
          replacedUpgrade={conflictNotification.replacedUpgrade}
          onDismiss={() => setConflictNotification(null)}
        />
      )}
      
      {selectedUpgradeForModal && (
        <UpgradeDetailModal
          upgrade={selectedUpgradeForModal}
          onClose={() => setSelectedUpgradeForModal(null)}
          showAddToBuild={false}
        />
      )}
      
      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          autoPlay={true}
        />
      )}
      
      {showSaveModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSaveModal(false)}>
          <div className={styles.saveModal} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.saveModalHeader}>
              <div className={styles.saveModalTitleGroup}>
                <Icons.save size={20} className={styles.saveModalIcon} />
                <h3 className={styles.saveModalTitle}>Save Build</h3>
              </div>
              <button className={styles.saveModalClose} onClick={() => setShowSaveModal(false)}>
                <Icons.x size={16} />
              </button>
            </div>
            
            {/* Body */}
            <div className={styles.saveModalBody}>
              {/* Build Name Input */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Build Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={buildName}
                  onChange={e => setBuildName(e.target.value)}
                  placeholder="e.g., Street Build, Track Setup"
                  autoFocus
                />
              </div>
              
              {/* Build Summary */}
              <div className={styles.buildSummaryCard}>
                <div className={styles.buildSummaryRow}>
                  <span className={styles.buildSummaryLabel}>Vehicle</span>
                  <span className={styles.buildSummaryValue}>{car?.name}</span>
                </div>
                <div className={styles.buildSummaryRow}>
                  <span className={styles.buildSummaryLabel}>Upgrades</span>
                  <span className={styles.buildSummaryValue}>{effectiveModules.length} selected</span>
                </div>
                {effectiveHpGain > 0 && (
                  <div className={styles.buildSummaryRow}>
                    <span className={styles.buildSummaryLabel}>HP Gain</span>
                    <span className={styles.buildSummaryValueGain}>+{effectiveHpGain} hp</span>
                  </div>
                )}
                <div className={styles.buildSummaryRow}>
                  <span className={styles.buildSummaryLabel}>Est. Cost</span>
                  <span className={styles.buildSummaryValue}>${(totalCost.low || 0).toLocaleString()}</span>
                </div>
              </div>
              
              {/* Save to Garage Option - Always show */}
              <div className={styles.garageOptionSection}>
                <label className={styles.garageCheckboxLabel} onClick={() => setSaveToGarage(!saveToGarage)}>
                  <div className={`${styles.customCheckbox} ${saveToGarage ? styles.customCheckboxChecked : ''}`}>
                    {saveToGarage && <Icons.check size={12} />}
                  </div>
                  <span>Apply to a vehicle in my garage</span>
                </label>
                
                {saveToGarage && (() => {
                  const matchingVehicles = vehicles?.filter(v => v.matchedCarSlug === car.slug) || [];
                  
                  // Show select if we have matching vehicles OR if we already selected one (just added)
                  if (matchingVehicles.length > 0 || selectedGarageVehicle) {
                    return (
                      <>
                        <select
                          className={styles.garageVehicleSelect}
                          value={selectedGarageVehicle || ''}
                          onChange={(e) => setSelectedGarageVehicle(e.target.value)}
                        >
                          <option value="">Select vehicle...</option>
                          {matchingVehicles.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.nickname || `${v.year} ${v.make} ${v.model}`}
                              {v.trim ? ` ${v.trim}` : ''}
                            </option>
                          ))}
                          {/* If selectedGarageVehicle is set but not in the list yet, show it */}
                          {selectedGarageVehicle && !matchingVehicles.find(v => v.id === selectedGarageVehicle) && (
                            <option value={selectedGarageVehicle}>
                              {car.year} {car.make} {car.model} (just added)
                            </option>
                          )}
                        </select>
                        {vehicleAddedSuccess && (
                          <div className={styles.vehicleAddedSuccess}>
                            <Icons.check size={12} />
                            Vehicle added to garage!
                          </div>
                        )}
                      </>
                    );
                  }
                  
                  // No matching vehicles - show add button
                  return (
                    <div className={styles.addToGaragePrompt}>
                      <p className={styles.addToGarageText}>
                        No {car.name} in your garage yet
                      </p>
                      <button
                        className={styles.addToGarageBtn}
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsAddingToGarage(true);
                          setSaveError(null);
                          try {
                            // Parse year from car.years field (e.g., "2017-2024")
                            const yearMatch = car.years?.match(/(\d{4})/);
                            const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
                            
                            // Extract make and model from car.name (e.g., "Nissan GT-R")
                            let make = '';
                            let model = car.name || '';
                            
                            // Handle Porsche models that start with numbers
                            if (car.name?.startsWith('718') || car.name?.startsWith('911') || 
                                car.name?.startsWith('981') || car.name?.startsWith('997') || 
                                car.name?.startsWith('987') || car.name?.startsWith('991') || 
                                car.name?.startsWith('992')) {
                              make = 'Porsche';
                            } else if (car.name) {
                              const parts = car.name.split(' ');
                              make = parts[0] || '';
                              model = parts.slice(1).join(' ') || car.name;
                            }
                            
                            const newVehicle = {
                              year,
                              make,
                              model,
                              matchedCarSlug: car.slug,
                              nickname: '',
                            };
                            console.log('[SaveModal] Adding vehicle:', newVehicle);
                            const result = await addVehicle(newVehicle);
                            console.log('[SaveModal] Add vehicle result:', result);
                            
                            if (result?.error) {
                              setSaveError(result.error.message || 'Failed to add vehicle');
                            } else if (result?.data) {
                              const vehicleId = result.data.id;
                              console.log('[SaveModal] Setting selected vehicle:', vehicleId);
                              setSelectedGarageVehicle(vehicleId);
                              setVehicleAddedSuccess(true);
                              // Clear success after 3 seconds
                              setTimeout(() => setVehicleAddedSuccess(false), 3000);
                            } else {
                              setSaveError('Vehicle added but no ID returned');
                            }
                          } catch (err) {
                            console.error('[SaveModal] Failed to add vehicle:', err);
                            setSaveError('Failed to add vehicle to garage');
                          }
                          setIsAddingToGarage(false);
                        }}
                        disabled={isAddingToGarage}
                        type="button"
                      >
                        {isAddingToGarage ? (
                          <>
                            <span className={styles.savingSpinner} />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Icons.plus size={14} />
                            Add {car.name} to Garage
                          </>
                        )}
                      </button>
                    </div>
                  );
                })()}
              </div>
              
              {/* Community Sharing Toggle - Always show */}
              <div className={styles.communityToggleSection}>
                <div className={styles.communityToggleRow}>
                  <div className={styles.communityToggleInfo}>
                    <Icons.globe size={16} />
                    <div className={styles.communityToggleText}>
                      <span className={styles.communityToggleLabel}>
                        {linkedCommunityPost ? 'Shared to Community' : 'Share to Community'}
                      </span>
                      {linkedCommunityPost && (
                        <a 
                          href={`/community/builds/${linkedCommunityPost.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.communityToggleLink}
                        >
                          View Post <Icons.externalLink size={10} />
                        </a>
                      )}
                      {!linkedCommunityPost && (
                        <span className={styles.communityToggleHint}>
                          Make this build visible to everyone
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    type="button"
                    className={`${styles.toggleSwitch} ${shareToNewCommunity ? styles.toggleSwitchOn : ''}`}
                    onClick={() => {
                      const newValue = !shareToNewCommunity;
                      setShareToNewCommunity(newValue);
                      // Default community title to build name if enabling and title is empty
                      if (newValue && !communityTitle) {
                        setCommunityTitle(buildName);
                      }
                    }}
                    aria-pressed={shareToNewCommunity}
                  >
                    <span className={styles.toggleKnob} />
                  </button>
                </div>
                
                {/* Community Title Input - shown when sharing is enabled */}
                {shareToNewCommunity && (
                  <div className={styles.communityTitleInput}>
                    <label className={styles.communityTitleLabel}>Community Title</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={communityTitle}
                      onChange={e => setCommunityTitle(e.target.value)}
                      placeholder="e.g., My Stormtrooper, Weekend Track Weapon"
                    />
                    <span className={styles.communityTitleHint}>
                      This is the public name shown on Community Builds
                    </span>
                  </div>
                )}
                
                {linkedCommunityPost && !shareToNewCommunity && (
                  <p className={styles.communityToggleWarning}>
                    ⚠️ This build will be removed from the community when you save.
                  </p>
                )}
              </div>
              
              {saveError && (
                <div className={styles.saveErrorMessage}>
                  <Icons.alertCircle size={14} />
                  {saveError}
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className={styles.saveModalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button 
                className={styles.confirmBtn} 
                onClick={handleSaveBuild} 
                disabled={isSaving || !buildName.trim()}
              >
                {isSaving ? (
                  <>
                    <span className={styles.savingSpinner} />
                    Saving...
                  </>
                ) : linkedCommunityPost && shareToNewCommunity ? (
                  <>
                    <Icons.save size={14} />
                    Save & Update Community Post
                  </>
                ) : linkedCommunityPost && !shareToNewCommunity ? (
                  <>
                    <Icons.save size={14} />
                    Save & Remove from Community
                  </>
                ) : shareToNewCommunity ? (
                  <>
                    <Icons.save size={14} />
                    Save & Share to Community
                  </>
                ) : (
                  <>
                    <Icons.save size={14} />
                    Save Build
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
