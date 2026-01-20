/**
 * Performance HUB Component
 * 
 * Redesigned to show meaningful real-world metrics:
 * - Power: Actual HP with HP gains
 * - Acceleration: 0-60 times with improvement in seconds
 * - Braking: 60-0 distance with feet improvement
 * - Grip: Lateral G with improvement
 * - Plus subjective scores for Comfort, Reliability, Sound
 * 
 * Also shows component breakdown for each upgrade package.
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import styles from './PerformanceHub.module.css';
import ScoringInfo from './ScoringInfo';
import UpgradeDetailModal from './UpgradeDetailModal';
import {
  getPerformanceProfile,
  getScoreComparison,
  getAvailableUpgrades,
  calculateTotalCost,
  getUpgradeSummary,
  performanceCategories,
} from '@/lib/performance.js';
import { 
  calculateSmartHpGain, 
  getConflictSummary,
} from '@/lib/upgradeCalculator.js';
import { getUpgradeByKey } from '@/lib/upgrades.js';
import { useAppConfig } from '@/lib/hooks/useAppConfig.js';
import { 
  hasRecommendations, 
  getPrimaryFocus, 
  getCoreUpgrades, 
  getEnhancementUpgrades,
  getRecommendationProgress,
} from '@/lib/carRecommendations.js';
import { validateUpgradeSelection, getRecommendedUpgrades, SEVERITY } from '@/lib/dependencyChecker.js';
import CarImage from './CarImage';
import UpgradeAggregator from './UpgradeAggregator';
import { useCarSelection } from './providers/CarSelectionProvider';
import { useSavedBuilds } from './providers/SavedBuildsProvider';
import { useOwnedVehicles } from './providers/OwnedVehiclesProvider';
import { useAuth } from './providers/AuthProvider';
import { Icons } from '@/components/ui/Icons';

// Map icon names to components
const iconMap = {
  tachometer: Icons.tachometer,
  tire: Icons.tire,
  brake: Icons.brake,
  flag: Icons.flag,
  comfort: Icons.comfort,
  thermometer: Icons.thermometer,
  sound: Icons.sound,
};

/**
 * Package descriptions - explains what each upgrade tier does
 */
const packageDescriptions = {
  stock: {
    title: 'Stock Configuration',
    shortDesc: 'Factory OEM performance as delivered from the manufacturer.',
    details: 'The baseline configuration with no modifications. All factory components and calibrations remain intact.'
  },
  streetSport: {
    title: 'Street Sport',
    shortDesc: 'Enhanced street performance with improved throttle response and sound.',
    details: 'Bolt-on upgrades that sharpen response and improve the driving experience while maintaining daily drivability. Includes intake, exhaust, tune, and lowering springs.'
  },
  trackPack: {
    title: 'Track Pack',
    shortDesc: 'Serious track capability with upgraded brakes, suspension, and cooling.',
    details: 'Built for regular HPDE and track days. Adds adjustable coilovers, big brake kit, track pads, oil cooler, and performance exhaust. Maintains street legality.'
  },
  timeAttack: {
    title: 'Time Attack',
    shortDesc: 'Maximum naturally-aspirated performance with full chassis optimization.',
    details: 'Competitive time attack build with camshafts, ported heads, full aero, R-compound tires, and comprehensive cooling. Some street comfort compromised.'
  },
  ultimatePower: {
    title: 'Ultimate Power',
    shortDesc: 'Maximum horsepower through forced induction.',
    details: 'Supercharger or turbo kit with supporting fuel system, cooling, and drivetrain upgrades. Massive power gains for street monsters or drag builds.'
  },
  custom: {
    title: 'Custom Build',
    shortDesc: 'Choose your own adventure - select individual upgrades.',
    details: 'Build your own configuration by selecting individual modules. Mix and match to create the perfect setup for your specific needs.'
  }
};

/**
 * Package Description Component - Explains what each tier does
 */
function PackageDescription({ packageKey, packages, showUpgrade, totalCost, hpGain, stockHp, projectedHp }) {
  const desc = packageDescriptions[packageKey] || packageDescriptions.stock;
  const currentPkg = packages?.find(p => p.key === packageKey);
  
  return (
    <div className={styles.packageDescriptionCard}>
      <div className={styles.packageDescriptionContent}>
        <div className={styles.packageDescriptionText}>
          <h3 className={styles.packageDescriptionTitle}>{desc.title}</h3>
          <p className={styles.packageDescriptionShort}>{desc.shortDesc}</p>
        </div>
        {showUpgrade && packageKey !== 'stock' && (
          <div className={styles.packageDescriptionStats}>
            {hpGain > 0 && (
              <div className={styles.packageStat}>
                <Icons.bolt size={14} />
                {/* Stock → Projected format */}
                <span className={styles.packageStatValue}>
                  <span className={styles.stockHpValue}>{stockHp}</span>
                  <span className={styles.hpArrow}>→</span>
                  <span className={styles.projectedHpValue}>{projectedHp}</span>
                  <span className={styles.hpGainBadge}>(+{hpGain})</span>
                </span>
              </div>
            )}
            {totalCost?.low > 0 && (
              <div className={styles.packageStat}>
                <span className={styles.packageStatLabel}>$</span>
                <span className={styles.packageStatValue}>{totalCost.display}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Format category key to human-readable name
 */
function formatCategoryName(key) {
  const categoryNames = {
    power: 'Power',
    forcedInduction: 'Forced Induction',
    chassis: 'Chassis',
    brakes: 'Brakes',
    cooling: 'Cooling',
    wheels: 'Wheels',
    aero: 'Aero',
    drivetrain: 'Drivetrain',
  };
  return categoryNames[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
}

/**
 * Format numeric values with proper precision
 */
function formatMetricValue(value, unit) {
  if (typeof value !== 'number') return value;
  
  // Handle floating point artifacts
  if (unit === 'g') return value.toFixed(2);
  if (unit === 's') return value.toFixed(1);
  if (unit === 'ft') return Math.round(value);
  if (unit === ' hp') return Math.round(value);
  return Math.round(value * 10) / 10;
}

/**
 * Real Metric Row - Shows actual values like HP, seconds, feet
 */
function RealMetricRow({ icon: IconComponent, label, stockValue, upgradedValue, unit, improvement, improvementPrefix = '+', isLowerBetter = false }) {
  const hasImproved = isLowerBetter ? upgradedValue < stockValue : upgradedValue > stockValue;
  const improvementVal = improvement || Math.abs(upgradedValue - stockValue);
  
  // Format values to prevent floating point artifacts
  const formattedStock = formatMetricValue(stockValue, unit);
  const formattedUpgraded = formatMetricValue(upgradedValue, unit);
  const formattedImprovement = formatMetricValue(improvementVal, unit);
  
  // Calculate percentage for bar (relative to realistic max values)
  // These maxes are set to show headroom - not everything should max out
  const maxValues = {
    hp: 1200,      // Allows for extreme forced induction builds
    seconds: 8,    // Slowest 0-60 we'd show (gives range from ~2.5s to 8s)
    feet: 150,     // Worst braking (gives range from ~80ft to 150ft)
    g: 1.6,        // Competition slicks territory (gives range from ~0.9g to 1.6g)
  };
  
  let maxValue = 1200; // default for HP
  if (unit === 's') maxValue = maxValues.seconds;
  if (unit === 'ft') maxValue = maxValues.feet;
  if (unit === 'g') maxValue = maxValues.g;
  
  // For time/distance (lower is better), invert the percentage
  const stockPercent = isLowerBetter 
    ? ((maxValue - stockValue) / maxValue) * 100 
    : (stockValue / maxValue) * 100;
  const upgradedPercent = isLowerBetter 
    ? ((maxValue - upgradedValue) / maxValue) * 100 
    : (upgradedValue / maxValue) * 100;
  
  return (
    <div className={styles.metricRow}>
      <div className={styles.metricHeader}>
        <div className={styles.metricLabel}>
          <span className={styles.metricIcon}><IconComponent size={18} /></span>
          <span className={styles.metricName}>{label}</span>
        </div>
        <div className={styles.metricValues}>
          {hasImproved ? (
            <>
              <span className={styles.stockValueSmall}>{formattedStock}{unit}</span>
              <span className={styles.metricArrow}>→</span>
              <span className={styles.upgradedValue}>{formattedUpgraded}{unit}</span>
              <span className={styles.metricGain}>
                {improvementPrefix}{formattedImprovement}{unit}
              </span>
            </>
          ) : (
            <span className={styles.currentValue}>{formattedStock}{unit}</span>
          )}
        </div>
      </div>
      <div className={styles.metricTrack}>
        <div 
          className={styles.metricFillStock}
          style={{ width: `${Math.min(100, stockPercent)}%` }}
        />
        {hasImproved && (
          <div 
            className={styles.metricFillUpgrade}
            style={{ 
              left: `${Math.min(100, stockPercent)}%`,
              width: `${Math.min(100 - stockPercent, upgradedPercent - stockPercent)}%` 
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Score bar component for subjective ratings (1-10 scale)
 */
function ScoreBar({ category, stockScore, upgradedScore, showUpgrade }) {
  const IconComponent = iconMap[category.icon] || Icons.flag;
  const hasImproved = upgradedScore > stockScore;
  const delta = upgradedScore - stockScore;
  
  return (
    <div className={styles.performanceBar}>
      <div className={styles.barHeader}>
        <div className={styles.barLabel}>
          <span className={styles.barIcon}>
            <IconComponent size={18} />
          </span>
          <span className={styles.barName}>{category.shortLabel}</span>
        </div>
        <div className={styles.barScores}>
          {showUpgrade && hasImproved ? (
            <>
              <span className={styles.stockScoreSmall}>{stockScore.toFixed(1)}</span>
              <span className={styles.scoreArrow}>→</span>
              <span className={styles.upgradedScore}>{upgradedScore.toFixed(1)}</span>
              <span className={styles.scoreDelta}>+{delta.toFixed(1)}</span>
            </>
          ) : (
            <span className={styles.currentScore}>{stockScore.toFixed(1)}/10</span>
          )}
        </div>
      </div>
      <div className={styles.barTrack}>
        <div 
          className={styles.barFillStock}
          style={{ width: `${(stockScore / 10) * 100}%` }}
        />
        {showUpgrade && hasImproved && (
          <div 
            className={styles.barFillUpgrade}
            style={{ 
              left: `${(stockScore / 10) * 100}%`,
              width: `${(delta / 10) * 100}%` 
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * GT-Style Rating Bar (1-10 scale) for visual stats display
 * Shows stock value (gold) and upgrade gains (green) with smooth fills
 * Supports decimal values with partial segment fills
 */
function RatingBar({ label, stockValue, upgradedValue, maxValue = 10 }) {
  const hasUpgrade = upgradedValue > stockValue;
  const displayValue = hasUpgrade ? upgradedValue : stockValue;
  
  // Calculate percentages for the continuous bar approach
  const stockPercent = (stockValue / maxValue) * 100;
  const upgradedPercent = (upgradedValue / maxValue) * 100;
  const upgradeGainPercent = upgradedPercent - stockPercent;
  
  return (
    <div className={styles.ratingBarRow}>
      <span className={styles.ratingLabel}>{label}</span>
      <div className={styles.ratingBarTrack}>
        {/* Stock fill (gold) */}
        <div 
          className={styles.ratingFillStock}
          style={{ width: `${stockPercent}%` }}
        />
        {/* Upgrade gain fill (green) - only if upgraded */}
        {hasUpgrade && (
          <div 
            className={styles.ratingFillUpgrade}
            style={{ 
              left: `${stockPercent}%`,
              width: `${upgradeGainPercent}%` 
            }}
          />
        )}
        {/* Segment lines overlay for GT7 look */}
        <div className={styles.ratingSegmentLines}>
          {[...Array(9)].map((_, i) => (
            <div key={i} className={styles.segmentLine} style={{ left: `${(i + 1) * 10}%` }} />
          ))}
        </div>
      </div>
      <span className={styles.ratingValue}>{displayValue.toFixed(1)}</span>
    </div>
  );
}

/**
 * What Your Car Needs - Database-driven car-specific upgrade recommendations
 * Shows for ALL modes (Stock, Custom, and all packages)
 */
function CarRecommendations({ car, selectedModules, onAddToModule, onUpgradeClick }) {
  // Get recommendations from database (car.upgradeRecommendations)
  const primaryFocus = useMemo(() => getPrimaryFocus(car), [car]);
  const coreUpgrades = useMemo(() => getCoreUpgrades(car), [car]);
  const enhancementUpgrades = useMemo(() => getEnhancementUpgrades(car), [car]);
  const progress = useMemo(() => getRecommendationProgress(car, selectedModules), [car, selectedModules]);
  
  // Get platform strengths and watch-outs from the car data
  const platformStrengths = car?.upgradeRecommendations?.platformStrengths || [];
  const watchOuts = car?.upgradeRecommendations?.watchOuts || [];
  
  // Filter to show only upgrades not yet selected
  const coreNotSelected = coreUpgrades.filter(u => !selectedModules.includes(u.key));
  const enhancementNotSelected = enhancementUpgrades.filter(u => !selectedModules.includes(u.key));
  
  // Early return if no recommendations in database
  if (!hasRecommendations(car)) return null;
  
  return (
    <div className={styles.carRecommendations}>
      <div className={styles.recHeader}>
        <h4 className={styles.recTitle}>
          <Icons.flag size={16} />
          What Your {car.name} Needs
        </h4>
        {progress.progress > 0 && progress.progress < 100 && (
          <div className={styles.recProgress}>
            <div className={styles.recProgressBar}>
              <div 
                className={styles.recProgressFill} 
                style={{ width: `${progress.progress}%` }} 
              />
            </div>
            <span className={styles.recProgressText}>{progress.progress}% complete</span>
          </div>
        )}
        {progress.progress === 100 && (
          <span className={styles.recCompleteBadge}>
            <Icons.check size={12} /> All recommended!
          </span>
        )}
      </div>
      
      {/* Primary Focus Area */}
      {primaryFocus && (
        <div className={styles.recFocusArea}>
          <div className={styles.recFocusHeader}>
            <span className={styles.recFocusLabel}>Priority:</span>
            <span className={styles.recFocusValue}>{primaryFocus.label}</span>
          </div>
          {primaryFocus.reason && (
            <p className={styles.recNarrative}>{primaryFocus.reason}</p>
          )}
        </div>
      )}
      
      {/* Core Upgrades - Essential for this car */}
      {coreNotSelected.length > 0 && (
        <div className={styles.recSection}>
          <span className={styles.recSectionLabel}>Core Upgrades:</span>
          <div className={styles.recUpgrades}>
            {coreNotSelected.map((upgrade) => (
              <div key={upgrade.key} className={styles.recUpgradeItem}>
                <button
                  className={`${styles.recUpgradeChip} ${styles.recCore}`}
                  onClick={() => onUpgradeClick(upgrade)}
                >
                  <span className={styles.recUpgradeName}>{upgrade.name}</span>
                  {upgrade.metricChanges?.hpGain > 0 && (
                    <span className={styles.recUpgradeGain}>+{upgrade.metricChanges.hpGain}hp</span>
                  )}
                </button>
                <button
                  className={styles.recAddBtn}
                  onClick={() => onAddToModule(upgrade.key)}
                  title="Add to build"
                >
                  <Icons.check size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Enhancement Upgrades - Also Recommended */}
      {enhancementNotSelected.length > 0 && (
        <div className={styles.recSection}>
          <span className={styles.recSectionLabel}>Also Consider:</span>
          <div className={styles.recUpgrades}>
            {enhancementNotSelected.map((upgrade) => (
              <div key={upgrade.key} className={styles.recUpgradeItem}>
                <button
                  className={styles.recUpgradeChip}
                  onClick={() => onUpgradeClick(upgrade)}
                >
                  <span className={styles.recUpgradeName}>{upgrade.name}</span>
                  {upgrade.metricChanges?.hpGain > 0 && (
                    <span className={styles.recUpgradeGain}>+{upgrade.metricChanges.hpGain}hp</span>
                  )}
                </button>
                <button
                  className={styles.recAddBtn}
                  onClick={() => onAddToModule(upgrade.key)}
                  title="Add to build"
                >
                  <Icons.check size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* All Done Message */}
      {coreNotSelected.length === 0 && enhancementNotSelected.length === 0 && (
        <p className={styles.recComplete}>
          <Icons.check size={14} /> All recommended upgrades are in your build!
        </p>
      )}
      
      {/* Platform Insights - Collapsible */}
      {(platformStrengths.length > 0 || watchOuts.length > 0) && (
        <details className={styles.recInsights}>
          <summary className={styles.recInsightsSummary}>
            <Icons.info size={14} />
            Platform Insights
          </summary>
          <div className={styles.recInsightsContent}>
            {platformStrengths.length > 0 && (
              <div className={styles.recInsightsGroup}>
                <span className={styles.recInsightsLabel}>Strengths:</span>
                <ul className={styles.recInsightsList}>
                  {platformStrengths.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {watchOuts.length > 0 && (
              <div className={styles.recInsightsGroup}>
                <span className={styles.recInsightsLabel}>Watch For:</span>
                <ul className={styles.recInsightsList}>
                  {watchOuts.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

/**
 * Dependency Warnings - Shows missing required/recommended upgrades
 * Now powered by the Connected Tissue Matrix for comprehensive dependency checking
 * Soft enforcement: warns but doesn't prevent selection
 */
function DependencyWarnings({ selectedModules, availableModules, onAddMods, car }) {
  // Use the Connected Tissue Matrix for comprehensive dependency checking
  const validation = useMemo(() => {
    if (selectedModules.length === 0) return null;
    return validateUpgradeSelection(selectedModules, car);
  }, [selectedModules, car]);
  
  // Get recommended upgrades with full context
  const recommendations = useMemo(() => {
    if (selectedModules.length === 0) return [];
    return getRecommendedUpgrades(selectedModules, car);
  }, [selectedModules, car]);
  
  // Also check simple requires/stronglyRecommended from individual upgrades (fallback)
  const simpleDeps = useMemo(() => {
    const allRequires = new Set();
    const allRecommended = new Set();
    
    selectedModules.forEach(modKey => {
      const mod = getUpgradeByKey(modKey);
      if (!mod) return;
      
      if (mod.requires) {
        mod.requires.forEach(reqKey => {
          if (!selectedModules.includes(reqKey)) {
            allRequires.add(reqKey);
          }
        });
      }
      
      if (mod.stronglyRecommended) {
        mod.stronglyRecommended.forEach(recKey => {
          if (!selectedModules.includes(recKey) && !allRequires.has(recKey)) {
            allRecommended.add(recKey);
          }
        });
      }
    });
    
    const availableKeys = Object.values(availableModules).flat().map(m => m.key);
    
    return {
      required: [...allRequires].filter(k => availableKeys.includes(k)),
      recommended: [...allRecommended].filter(k => availableKeys.includes(k)),
    };
  }, [selectedModules, availableModules]);
  
  // Merge matrix-based and simple deps
  const criticalIssues = validation?.critical || [];
  const warningIssues = validation?.warnings || [];
  const infoIssues = validation?.info || [];
  const synergies = validation?.synergies || [];
  
  // Combine simple requires with matrix-based critical issues
  const allRequired = new Set(simpleDeps.required);
  criticalIssues.forEach(issue => {
    issue.recommendation?.forEach(r => allRequired.add(r));
  });
  
  // Combine simple recommended with matrix-based warnings
  const allRecommended = new Set(simpleDeps.recommended);
  warningIssues.forEach(issue => {
    issue.recommendation?.forEach(r => {
      if (!allRequired.has(r)) allRecommended.add(r);
    });
  });
  
  // Filter to available modules
  const availableKeys = Object.values(availableModules).flat().map(m => m.key);
  const filteredRequired = [...allRequired].filter(k => availableKeys.includes(k));
  const filteredRecommended = [...allRecommended].filter(k => availableKeys.includes(k));
  
  // Nothing to show
  if (filteredRequired.length === 0 && filteredRecommended.length === 0 && synergies.length === 0) {
    return null;
  }
  
  return (
    <div className={styles.dependencyWarnings}>
      {/* Critical / Required */}
      {filteredRequired.length > 0 && (
        <div className={styles.depWarningBox}>
          <div className={styles.depWarningHeader}>
            <Icons.alertTriangle size={16} />
            <span>Required Supporting Mods</span>
          </div>
          <p className={styles.depWarningText}>
            Your selected upgrades need these supporting mods to function properly:
          </p>
          <div className={styles.depList}>
            {filteredRequired.map(key => {
              const upgrade = getUpgradeByKey(key);
              const rec = recommendations.find(r => r.upgradeKey === key);
              return (
                <div key={key} className={styles.depTagWrapper}>
                  <span className={styles.depTag}>
                    {upgrade?.name || key}
                  </span>
                  {rec?.reason && (
                    <span className={styles.depReason}>{rec.reason}</span>
                  )}
                </div>
              );
            })}
          </div>
          <button 
            className={styles.addDepsBtn}
            onClick={() => onAddMods(filteredRequired)}
          >
            <Icons.check size={14} />
            Add Required Mods
          </button>
        </div>
      )}
      
      {/* Warnings / Recommended */}
      {filteredRecommended.length > 0 && (
        <div className={styles.depRecommendBox}>
          <div className={styles.depWarningHeader}>
            <Icons.info size={16} />
            <span>Strongly Recommended</span>
          </div>
          <p className={styles.depWarningText}>
            These mods pair well with your selections for best results:
          </p>
          <div className={styles.depList}>
            {filteredRecommended.map(key => {
              const upgrade = getUpgradeByKey(key);
              const rec = recommendations.find(r => r.upgradeKey === key);
              return (
                <div key={key} className={styles.depTagWrapper}>
                  <span className={styles.depTagRecommended}>
                    {upgrade?.name || key}
                  </span>
                  {rec?.reason && (
                    <span className={styles.depReason}>{rec.reason}</span>
                  )}
                </div>
              );
            })}
          </div>
          <button 
            className={styles.addDepsBtnSecondary}
            onClick={() => onAddMods(filteredRecommended)}
          >
            Add Recommended
          </button>
        </div>
      )}
      
      {/* Positive Synergies */}
      {synergies.length > 0 && (
        <div className={styles.depSynergyBox}>
          <div className={styles.depWarningHeader}>
            <Icons.check size={16} />
            <span>Great Combinations</span>
          </div>
          {synergies.map((synergy, idx) => (
            <p key={idx} className={styles.synergyText}>
              <strong>{synergy.name}:</strong> {synergy.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Component Breakdown - Shows what parts are included in upgrade
 * Now with clickable upgrade items that open the encyclopedia modal
 */
function ComponentBreakdown({ selectedUpgrades, showUpgrade, onUpgradeClick }) {
  // Get main package and modules first (these aren't hooks)
  const mainPackage = selectedUpgrades.find(u => u.type === 'package');
  const modules = selectedUpgrades.filter(u => u.type === 'module');
  
  // Get resolved upgrade details for the includedUpgradeKeys
  // Must call useMemo before any conditional returns (React hooks rules)
  const resolvedUpgrades = useMemo(() => {
    if (!mainPackage?.includedUpgradeKeys) return [];
    return mainPackage.includedUpgradeKeys
      .map(key => getUpgradeByKey(key))
      .filter(Boolean);
  }, [mainPackage]);
  
  // Early return after all hooks
  if (!showUpgrade || selectedUpgrades.length === 0) return null;
  
  return (
    <div className={styles.componentBreakdown}>
      <h4 className={styles.breakdownTitle}>
        <Icons.wrench size={16} />
        What's Included
      </h4>
      
      {/* Clickable upgrade chips using includedUpgradeKeys */}
      {resolvedUpgrades.length > 0 && (
        <div className={styles.upgradeChips}>
          {resolvedUpgrades.map((upgrade) => (
            <button
              key={upgrade.key}
              className={styles.upgradeChip}
              onClick={() => onUpgradeClick(upgrade)}
              title={upgrade.shortDescription || upgrade.description}
            >
              <Icons.check size={12} />
              <span className={styles.upgradeChipName}>{upgrade.name}</span>
              {upgrade.metricChanges?.hpGain && (
                <span className={styles.upgradeChipGain}>+{upgrade.metricChanges.hpGain}hp</span>
              )}
              <Icons.info size={12} className={styles.infoIcon} />
            </button>
          ))}
        </div>
      )}
      
      {/* Fallback to plain text includes if no includedUpgradeKeys */}
      {resolvedUpgrades.length === 0 && mainPackage?.includes && (
        <div className={styles.componentList}>
          {mainPackage.includes.map((item, idx) => (
            <div key={idx} className={styles.componentItem}>
              <Icons.check size={14} />
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Additional standalone modules selected by user */}
      {modules.length > 0 && (
        <div className={styles.additionalModules}>
          <span className={styles.modulesLabel}>Additional Modules:</span>
          <div className={styles.modulesList}>
            {modules.map(mod => {
              const modDetails = getUpgradeByKey(mod.key);
              return (
                <button 
                  key={mod.key} 
                  className={styles.moduleBadgeClickable}
                  onClick={() => onUpgradeClick(modDetails || mod)}
                >
                  {mod.name}
                  <Icons.info size={10} />
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {mainPackage && mainPackage.considerations && (
        <div className={styles.considerations}>
          <span className={styles.considerationsLabel}>Things to Consider:</span>
          <ul className={styles.considerationsList}>
            {mainPackage.considerations.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Expert Track Insights - Shows what reviewers say about track performance
 */
function ExpertTrackInsights({ car }) {
  const consensus = car?.externalConsensus || car?.external_consensus;
  const reviewCount = car?.expertReviewCount || car?.expert_review_count || 0;
  
  // Only show if we have track-related feedback
  if (reviewCount === 0) return null;
  
  // Get track-related weaknesses
  const trackWeaknesses = (consensus?.weaknesses || [])
    .filter(w => {
      const tag = (w.tag || w).toLowerCase();
      return tag.includes('brake') || tag.includes('cool') || tag.includes('heat') || 
             tag.includes('grip') || tag.includes('traction') || tag.includes('suspension');
    })
    .slice(0, 3);
    
  // Get track-related strengths
  const trackStrengths = (consensus?.strengths || [])
    .filter(s => {
      const tag = (s.tag || s).toLowerCase();
      return tag.includes('handl') || tag.includes('steer') || tag.includes('balance') || 
             tag.includes('grip') || tag.includes('track') || tag.includes('brake');
    })
    .slice(0, 3);
    
  if (trackWeaknesses.length === 0 && trackStrengths.length === 0) return null;
  
  return (
    <div className={styles.expertTrackInsights}>
      <h4 className={styles.expertInsightsTitle}>
        <Icons.flag size={16} />
        What Reviewers Say About Track Use
      </h4>
      <div className={styles.expertInsightsContent}>
        {trackStrengths.length > 0 && (
          <div className={styles.expertInsightsGroup}>
            <span className={styles.expertInsightsLabel}>Praised:</span>
            <div className={styles.expertInsightsTags}>
              {trackStrengths.map((s, i) => (
                <span key={i} className={`${styles.expertInsightsTag} ${styles.strength}`}>
                  {s.tag || s}
                </span>
              ))}
            </div>
          </div>
        )}
        {trackWeaknesses.length > 0 && (
          <div className={styles.expertInsightsGroup}>
            <span className={styles.expertInsightsLabel}>Watch for:</span>
            <div className={styles.expertInsightsTags}>
              {trackWeaknesses.map((w, i) => (
                <span key={i} className={`${styles.expertInsightsTag} ${styles.weakness}`}>
                  {w.tag || w}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <p className={styles.expertInsightsNote}>
        Based on {reviewCount} expert review{reviewCount > 1 ? 's' : ''}
      </p>
    </div>
  );
}

/**
 * Main Performance HUB component
 * @param {Object} car - The car data
 * @param {string} initialBuildId - Optional build ID to load
 * @param {function} onChangeCar - Callback when Change Car is clicked (if null and hideChangeCar is false, redirects to /mod-planner)
 * @param {boolean} hideChangeCar - If true, hides the Change Car button (useful in garage context)
 */
export default function PerformanceHub({ car, initialBuildId = null, onChangeCar = null, hideChangeCar = false }) {
  // Get configuration from database
  const { tierConfig } = useAppConfig();
  
  // Global car selection integration
  const { selectCar, setUpgrades, clearCar, isHydrated } = useCarSelection();
  
  // Auth and saved builds
  const { isAuthenticated } = useAuth();
  const { saveBuild, updateBuild, getBuildById, getBuildsByCarSlug, canSave } = useSavedBuilds();
  
  // Owned vehicles for "Apply to My Vehicle" feature
  const { vehicles, getVehiclesByCarSlug, applyModifications } = useOwnedVehicles();
  
  // Find user's vehicles that match this car, enriched with build data for accurate HP gain
  const matchingVehicles = useMemo(() => {
    const vehicles = getVehiclesByCarSlug(car.slug);
    // Enrich each vehicle with its active build data for accurate HP gain display
    return vehicles.map(vehicle => {
      const activeBuild = vehicle.activeBuildId ? getBuildById(vehicle.activeBuildId) : null;
      return {
        ...vehicle,
        // Use build's HP gain if available (more accurate), otherwise fall back to cached value
        displayHpGain: activeBuild?.totalHpGain ?? vehicle.totalHpGain ?? 0,
      };
    });
  }, [getVehiclesByCarSlug, car.slug, getBuildById]);
  const hasMatchingVehicle = matchingVehicles.length > 0;

  // Initialize to stock - users can select their preferred package
  const [selectedPackageKey, setSelectedPackageKey] = useState('stock');
  const [expandedModules, setExpandedModules] = useState(false);
  const [selectedModules, setSelectedModules] = useState([]);
  const [selectedUpgradeForModal, setSelectedUpgradeForModal] = useState(null);
  
  // Save build modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [buildName, setBuildName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentBuildId, setCurrentBuildId] = useState(initialBuildId);
  const [saveError, setSaveError] = useState(null);
  
  // Apply to vehicle state
  const [isApplyingToVehicle, setIsApplyingToVehicle] = useState(false);
  const [applySuccess, setApplySuccess] = useState(null);
  
  // Get existing builds for this car
  const existingBuilds = useMemo(() => 
    getBuildsByCarSlug(car.slug),
    [getBuildsByCarSlug, car.slug]
  );
  
  // Reset state when car changes (ensures clean slate when navigating between cars)
  useEffect(() => {
    // Reset to stock when car changes
    setSelectedModules([]);
    setSelectedPackageKey('stock');
    setCurrentBuildId(null);
    setSaveError(null);
  }, [car.slug]);

  // Load initial build if provided (after reset, so this overrides if needed)
  useEffect(() => {
    if (initialBuildId) {
      const build = getBuildById(initialBuildId);
      if (build && build.carSlug === car.slug) {
        setSelectedModules(build.upgrades || []);
        setSelectedPackageKey('custom');
        setCurrentBuildId(initialBuildId);
      }
    }
  }, [initialBuildId, getBuildById, car.slug]);

  // Set this car as selected when viewing the performance hub
  // This ensures the car banner shows the correct car
  useEffect(() => {
    if (isHydrated && car) {
      selectCar(car);
    }
  }, [isHydrated, car, selectCar]);
  
  // Get available upgrades for this car
  const availableUpgrades = useMemo(() => 
    car ? getAvailableUpgrades(car) : { packages: [], modulesByCategory: {} }, 
    [car]
  );
  
  // Get all available module keys for this car
  const availableModuleKeys = useMemo(() => {
    return Object.values(availableUpgrades.modulesByCategory || {})
      .flat()
      .map(m => m.key);
  }, [availableUpgrades.modulesByCategory]);
  
  // Get the modules included in the currently selected package
  // Filter to only include modules that are actually available for this car
  const packageIncludedModules = useMemo(() => {
    if (selectedPackageKey === 'stock' || selectedPackageKey === 'custom') return [];
    const pkg = availableUpgrades.packages.find(p => p.key === selectedPackageKey);
    const packageKeys = pkg?.includedUpgradeKeys || [];
    // Only include keys that are actually available for this car
    return packageKeys.filter(key => availableModuleKeys.includes(key));
  }, [selectedPackageKey, availableUpgrades.packages, availableModuleKeys]);
  
  // Effective selected modules (package defaults + user modifications)
  // This only includes modules that are actually available for this car
  const effectiveSelectedModules = useMemo(() => {
    if (selectedPackageKey === 'custom' || selectedPackageKey === 'stock') {
      // Filter custom selections to available modules
      return selectedModules.filter(key => availableModuleKeys.includes(key));
    }
    // For packages, combine package defaults with any additional user selections
    const combined = new Set([...packageIncludedModules, ...selectedModules]);
    // Filter to available modules
    return Array.from(combined).filter(key => availableModuleKeys.includes(key));
  }, [selectedPackageKey, packageIncludedModules, selectedModules, availableModuleKeys]);
  
  // Determine which upgrades are active (for performance calculation)
  const activeUpgradeKeys = useMemo(() => {
    if (selectedPackageKey === 'stock' && selectedModules.length === 0) return [];
    return effectiveSelectedModules;
  }, [selectedPackageKey, selectedModules, effectiveSelectedModules]);
  
  // Get performance profile
  const profile = useMemo(() => 
    getPerformanceProfile(car, activeUpgradeKeys),
    [car, activeUpgradeKeys]
  );
  
  // Smart HP calculation with diminishing returns and overlap detection
  const smartHp = useMemo(() => 
    calculateSmartHpGain(car, activeUpgradeKeys),
    [car, activeUpgradeKeys]
  );
  
  // Conflict summary for UI display
  const conflictSummary = useMemo(() => 
    getConflictSummary(smartHp.conflicts),
    [smartHp.conflicts]
  );
  
  // Get score comparison for bars
  const scoreComparison = useMemo(() => 
    getScoreComparison(profile.stockScores, profile.upgradedScores),
    [profile]
  );
  
  // Calculate total cost with brand-specific pricing
  const totalCost = useMemo(() => 
    calculateTotalCost(profile.selectedUpgrades, car),
    [profile.selectedUpgrades, car]
  );
  
  // Get summary text
  const upgradeSummary = useMemo(() => 
    getUpgradeSummary(profile.selectedUpgrades),
    [profile.selectedUpgrades]
  );
  
  const handlePackageSelect = (key) => {
    setSelectedPackageKey(key);
    // Clear custom modules when switching packages
    setSelectedModules([]);
  };
  
  const handleModuleToggle = (moduleKey) => {
    if (selectedPackageKey !== 'custom' && selectedPackageKey !== 'stock') {
      // User is modifying a package - auto-switch to Custom
      // Copy current effective selections first
      const currentSelections = new Set(effectiveSelectedModules);
      
      if (currentSelections.has(moduleKey)) {
        currentSelections.delete(moduleKey);
      } else {
        currentSelections.add(moduleKey);
      }
      
      setSelectedPackageKey('custom');
      setSelectedModules(Array.from(currentSelections));
    } else {
      // Already in Custom or Stock mode - normal toggle
      setSelectedModules(prev => {
        if (prev.includes(moduleKey)) {
          return prev.filter(k => k !== moduleKey);
        }
        return [...prev, moduleKey];
      });
    }
  };
  
  // Handler for adding required/recommended mods
  const handleAddRequiredMods = (modKeys) => {
    setSelectedModules(prev => {
      const newMods = modKeys.filter(k => !prev.includes(k));
      return [...prev, ...newMods];
    });
  };
  
  // Handler for saving/updating a build
  const handleSaveBuild = async () => {
    if (!canSave) {
      setSaveError('Please sign in to save builds');
      return;
    }
    
    if (!buildName.trim()) {
      setSaveError('Please enter a build name');
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    
    const buildData = {
      carSlug: car.slug,
      carName: car.name,
      name: buildName.trim(),
      selectedUpgrades: effectiveSelectedModules,
      // Use smart HP calculation for realistic gains
      totalHpGain: smartHp.totalGain,
      totalCostLow: totalCost.low,
      totalCostHigh: totalCost.high,
      finalHp: smartHp.projectedHp,
      // PerformanceHub uses the 'basic' tuner mode calculation
      tunerMode: 'basic',
    };
    
    try {
      let result;
      if (currentBuildId) {
        // Update existing build
        result = await updateBuild(currentBuildId, buildData);
      } else {
        // Save new build
        result = await saveBuild(buildData);
        if (result.data) {
          setCurrentBuildId(result.data.id);
        }
      }
      
      if (result.error) {
        setSaveError(result.error.message || 'Failed to save build');
      } else {
        setShowSaveModal(false);
        setBuildName('');
      }
    } catch (err) {
      setSaveError('An unexpected error occurred');
      console.error('[PerformanceHub] Save build error:', err);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handler for applying modifications to a vehicle
  const handleApplyToVehicle = async (vehicleId) => {
    if (!vehicleId || effectiveSelectedModules.length === 0) return;
    
    setIsApplyingToVehicle(true);
    setApplySuccess(null);
    
    try {
      const { data, error } = await applyModifications(vehicleId, {
        upgrades: effectiveSelectedModules,
        totalHpGain: smartHp.totalGain,
        buildId: currentBuildId || null, // Link to build if one exists
      });
      
      if (error) {
        setSaveError(error.message || 'Failed to apply modifications');
      } else {
        setApplySuccess(data);
        // Close modal after brief delay to show success
        setTimeout(() => {
          setShowSaveModal(false);
          setApplySuccess(null);
        }, 1500);
      }
    } catch (err) {
      setSaveError('An unexpected error occurred');
      console.error('[PerformanceHub] Apply to vehicle error:', err);
    } finally {
      setIsApplyingToVehicle(false);
    }
  };
  
  const tierInfo = tierConfig[car.tier] || {};
  const showUpgrade = selectedPackageKey !== 'stock' || selectedModules.length > 0;
  
  // Get the subjective score categories
  const subjectiveCategories = scoreComparison.filter(cat => 
    ['drivability', 'reliabilityHeat', 'soundEmotion'].includes(cat.key)
  );

  // Format numbers with commas
  const formatNumber = (num) => num?.toLocaleString() || '—';
  
  // Early return AFTER all hooks (React rules of hooks)
  if (!car) {
    return null;
  }

  return (
    <div className={styles.hubV2}>

      {/* ================================================================
          CAR HERO SECTION - GT-Inspired Layout
          ================================================================ */}
      <header className={styles.carHeroSection}>
        {/* Large Car Image */}
        <div className={styles.carHeroImage}>
          <CarImage car={car} variant="hero" className={styles.carImageLarge} />
          <div className={styles.tierBadge} data-tier={car.tier}>
            {tierInfo.label || car.tier}
          </div>
        </div>
        
        {/* Car Info Panel - GT Style */}
        <div className={styles.carInfoPanel}>
          {/* Header with name and price */}
          <div className={styles.carInfoHeader}>
            <div>
              <h1 className={styles.carName}>{car.name}</h1>
              <p className={styles.carSubtitle}>{car.years} • {car.brand || 'Sports Car'} • {car.country || ''}</p>
            </div>
            <div className={styles.carInfoHeaderRight}>
              <div className={styles.priceRange}>
                {tierInfo.priceRange || '$50-75K'}
              </div>
              {!hideChangeCar && (
                <button 
                  className={styles.changeCarButton}
                  onClick={() => {
                    clearCar();
                    if (onChangeCar) {
                      onChangeCar();
                    } else {
                      window.history.pushState({}, '', '/garage/my-build');
                      window.location.href = '/garage/my-build';
                    }
                  }}
                  title="Select a different car"
                >
                  <Icons.arrowLeft size={16} />
                  <span>Change Car</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Hero Specs - Key Stats Prominently Displayed */}
          <div className={styles.heroSpecs}>
            <div className={styles.heroSpecMain}>
              <span className={styles.heroSpecLabel}>Engine</span>
              <span className={styles.heroSpecValue}>{car.engine}</span>
            </div>
            <div className={styles.heroSpecDivider} />
            <div className={styles.heroSpecHighlight}>
              <div className={styles.heroSpecNumber}>{car.hp}</div>
              <div className={styles.heroSpecUnit}>hp</div>
            </div>
            <div className={styles.heroSpecHighlight}>
              <div className={styles.heroSpecNumber}>{car.torque || '—'}</div>
              <div className={styles.heroSpecUnit}>lb-ft</div>
            </div>
            <div className={styles.heroSpecHighlight}>
              <div className={styles.heroSpecNumber}>{formatNumber(car.curbWeight)}</div>
              <div className={styles.heroSpecUnit}>lbs</div>
            </div>
          </div>
          
          {/* Secondary Specs Row */}
          <div className={styles.secondarySpecs}>
            <div className={styles.secondarySpec}>
              <span className={styles.secondarySpecLabel}>Drivetrain</span>
              <span className={styles.secondarySpecValue}>{car.drivetrain || 'RWD'}</span>
            </div>
            <div className={styles.secondarySpec}>
              <span className={styles.secondarySpecLabel}>0-60 mph</span>
              <span className={styles.secondarySpecValue}>{car.zeroToSixty || '—'} <small>sec</small></span>
            </div>
            <div className={styles.secondarySpec}>
              <span className={styles.secondarySpecLabel}>Layout</span>
              <span className={styles.secondarySpecValue}>{car.category || 'Front-Engine'}</span>
            </div>
            <div className={styles.secondarySpec}>
              <span className={styles.secondarySpecLabel}>Transmission</span>
              <span className={styles.secondarySpecValue}>{car.manualAvailable ? 'Manual' : 'Auto'}</span>
            </div>
          </div>
          
          {/* GT-Style Visual Rating Bars - Connected to Profile */}
          <div className={styles.ratingBars}>
            <RatingBar 
              label="Power" 
              stockValue={profile.stockScores.powerAccel || 7} 
              upgradedValue={profile.upgradedScores.powerAccel || profile.stockScores.powerAccel || 7}
            />
            <RatingBar 
              label="Handling" 
              stockValue={profile.stockScores.gripCornering || 7} 
              upgradedValue={profile.upgradedScores.gripCornering || profile.stockScores.gripCornering || 7}
            />
            <RatingBar 
              label="Braking" 
              stockValue={profile.stockScores.braking || 7} 
              upgradedValue={profile.upgradedScores.braking || profile.stockScores.braking || 7}
            />
            <RatingBar 
              label="Track Pace" 
              stockValue={profile.stockScores.trackPace || 7} 
              upgradedValue={profile.upgradedScores.trackPace || profile.stockScores.trackPace || 7}
            />
            <RatingBar 
              label="Sound" 
              stockValue={profile.stockScores.soundEmotion || 7} 
              upgradedValue={profile.upgradedScores.soundEmotion || profile.stockScores.soundEmotion || 7}
            />
          </div>
        </div>
      </header>

      {/* ================================================================
          MAIN CONTENT - Full width
          ================================================================ */}
      <main className={styles.hubMain}>
        {/* Title Row with Save Button */}
        <div className={styles.titleRow}>
          <h2 className={styles.hubTitle}>Upgrade Center</h2>
          <button
            className={styles.saveBuildButton}
            onClick={() => {
              setBuildName(currentBuildId ? getBuildById(currentBuildId)?.name || '' : `${car.name} Build`);
              setShowSaveModal(true);
            }}
            title={canSave ? 'Save this build to your garage' : 'Sign in to save builds'}
          >
            <Icons.save size={16} />
            <span>{currentBuildId ? 'Update Build' : 'Save Build'}</span>
          </button>
          {existingBuilds.length > 0 && (
            <div className={styles.existingBuildsDropdown}>
              <button className={styles.loadBuildButton} title="Load a saved build">
                <Icons.folder size={16} />
                <span>My Builds ({existingBuilds.length})</span>
              </button>
              <div className={styles.buildsDropdownMenu}>
                {existingBuilds.map(build => (
                  <button
                    key={build.id}
                    className={styles.buildMenuItem}
                    onClick={() => {
                      setSelectedModules(build.upgrades || []);
                      setSelectedPackageKey('custom');
                      setCurrentBuildId(build.id);
                    }}
                  >
                    <span className={styles.buildMenuName}>{build.name}</span>
                    <span className={styles.buildMenuMeta}>
                      {build.upgrades?.length || 0} upgrades • ${build.totalCostLow?.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Package Selector Row */}
        <div className={styles.packageSelectorRow}>
          <div className={styles.packageSelector}>
            <button
              className={`${styles.packagePill} ${selectedPackageKey === 'stock' && selectedModules.length === 0 ? styles.active : ''}`}
              onClick={() => handlePackageSelect('stock')}
            >
              Stock
            </button>
            {(availableUpgrades.packages || []).map(pkg => (
              <button
                key={pkg.key}
                className={`${styles.packagePill} ${styles[pkg.tier]} ${selectedPackageKey === pkg.key ? styles.active : ''}`}
                onClick={() => handlePackageSelect(pkg.key)}
              >
                {pkg.name.replace(' Package', '').replace(' Build', '')}
              </button>
            ))}
            <button
              className={`${styles.packagePill} ${styles.custom} ${selectedPackageKey === 'custom' ? styles.active : ''}`}
              onClick={() => handlePackageSelect('custom')}
            >
              Custom
            </button>
          </div>
        </div>
        
        {/* Package Description */}
        <div className={styles.packageDescription}>
          <PackageDescription 
            packageKey={selectedPackageKey} 
            packages={availableUpgrades.packages}
            showUpgrade={showUpgrade}
            totalCost={totalCost}
            hpGain={smartHp.totalGain}
            stockHp={smartHp.stockHp}
            projectedHp={smartHp.projectedHp}
          />
        </div>

        {/* Car-Specific Recommendations - Database-driven, shows for ALL modes */}
        <CarRecommendations
          car={car}
          selectedModules={effectiveSelectedModules}
          onAddToModule={(key) => handleModuleToggle(key)}
          onUpgradeClick={setSelectedUpgradeForModal}
        />

        {/* Overlap Warnings - Smart detection of conflicting/redundant mods */}
        {conflictSummary.hasConflicts && (
          <div className={styles.overlapWarnings}>
            <div className={styles.overlapHeader}>
              <Icons.alertTriangle size={16} />
              <span>Build Optimization Notes</span>
              {smartHp.adjustmentAmount > 0 && (
                <span className={styles.adjustmentBadge}>
                  ~{smartHp.adjustmentAmount} HP adjusted
                </span>
              )}
            </div>
            <div className={styles.overlapList}>
              {smartHp.conflicts.map((conflict, idx) => (
                <div 
                  key={idx} 
                  className={`${styles.overlapItem} ${styles[conflict.severity]}`}
                >
                  {conflict.severity === 'warning' ? (
                    <Icons.alertTriangle size={14} />
                  ) : (
                    <Icons.info size={14} className={styles.infoIcon} />
                  )}
                  <span>{conflict.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expert Track Insights - What reviewers say */}
        <ExpertTrackInsights car={car} />

        {/* Performance Metrics - Full Bar Charts */}
        <div className={styles.performanceSection}>
          <h4 className={styles.sectionTitle}>Performance Metrics</h4>
          
          {/* Power (HP) - Using smart calculation with diminishing returns */}
          <RealMetricRow
            icon={Icons.bolt}
            label="Power"
            stockValue={smartHp.stockHp}
            upgradedValue={smartHp.projectedHp}
            unit=" hp"
            isLowerBetter={false}
          />
          
          {/* 0-60 Time */}
          {profile.stockMetrics.zeroToSixty && (
            <RealMetricRow
              icon={Icons.stopwatch}
              label="0-60 mph"
              stockValue={profile.stockMetrics.zeroToSixty}
              upgradedValue={profile.upgradedMetrics.zeroToSixty || profile.stockMetrics.zeroToSixty}
              unit="s"
              improvementPrefix="-"
              isLowerBetter={true}
            />
          )}
          
          {/* Braking Distance */}
          {profile.stockMetrics.braking60To0 && (
            <RealMetricRow
              icon={Icons.brake}
              label="60-0 Braking"
              stockValue={profile.stockMetrics.braking60To0}
              upgradedValue={profile.upgradedMetrics.braking60To0 || profile.stockMetrics.braking60To0}
              unit="ft"
              improvementPrefix="-"
              isLowerBetter={true}
            />
          )}
          
          {/* Lateral G */}
          {profile.stockMetrics.lateralG && (
            <RealMetricRow
              icon={Icons.tire}
              label="Lateral Grip"
              stockValue={profile.stockMetrics.lateralG}
              upgradedValue={profile.upgradedMetrics.lateralG || profile.stockMetrics.lateralG}
              unit="g"
              improvementPrefix="+"
              isLowerBetter={false}
            />
          )}
        </div>
        
        {/* Experience Scores Section */}
        <div className={styles.scoresSection}>
          <h4 className={styles.sectionTitle}>Experience Scores</h4>
          {subjectiveCategories.map(cat => (
            <ScoreBar
              key={cat.key}
              category={cat}
              stockScore={cat.stockScore}
              upgradedScore={cat.upgradedScore}
              showUpgrade={showUpgrade}
            />
          ))}
        </div>
        
        {/* ============================================================
           BUILD YOUR CONFIGURATION - Full Width
           Shows for ALL packages with appropriate pre-selections
           ============================================================ */}
        <div className={styles.buildSection}>
          <div className={styles.buildHeader}>
            <h3 className={styles.buildTitle}>
              <Icons.wrench size={20} />
              {selectedPackageKey === 'custom' 
                ? 'Build Your Configuration' 
                : selectedPackageKey === 'stock'
                  ? 'Available Upgrades'
                  : `${availableUpgrades.packages.find(p => p.key === selectedPackageKey)?.name || 'Package'} - What's Included`
              }
            </h3>
            <p className={styles.buildSubtitle}>
              {selectedPackageKey === 'custom' 
                ? 'Select upgrades to see real-time performance impact'
                : selectedPackageKey === 'stock'
                  ? 'Choose upgrades to start building your configuration'
                  : 'Checkmarks show included items • Click any item to customize'
              }
            </p>
            {effectiveSelectedModules.length > 0 && (
              <div className={styles.selectedCount}>
                <span className={styles.countBadge}>{effectiveSelectedModules.length}</span>
                {effectiveSelectedModules.length === 1 ? 'upgrade' : 'upgrades'} selected
                {selectedPackageKey === 'custom' && (
                  <button 
                    className={styles.clearAllBtn}
                    onClick={() => setSelectedModules([])}
                  >
                    Clear all
                  </button>
                )}
                {/* CF-005: Auto-save indicator so users know changes persist */}
                <span className={styles.autoSaveIndicator}>
                  <Icons.check size={12} />
                  Auto-saved
                </span>
              </div>
            )}
          </div>
          
          {/* Full-Width Module Grid */}
          <div className={styles.modulesGridFull}>
            {Object.entries(availableUpgrades.modulesByCategory).map(([catKey, modules]) => (
              <div key={catKey} className={styles.moduleCategory}>
                <h5 className={styles.moduleCategoryTitle}>
                  {formatCategoryName(catKey)}
                </h5>
                <div className={styles.moduleList}>
                  {modules.map(mod => {
                    const fullDetails = getUpgradeByKey(mod.key) || mod;
                    const isSelected = effectiveSelectedModules.includes(mod.key);
                    const isPackageItem = packageIncludedModules.includes(mod.key);
                    
                    return (
                      <div key={mod.key} className={styles.moduleChipWrapper}>
                        <button
                          className={`${styles.moduleChip} ${isSelected ? styles.selected : ''} ${isPackageItem && selectedPackageKey !== 'custom' ? styles.packageItem : ''}`}
                          onClick={() => handleModuleToggle(mod.key)}
                          title={mod.description}
                        >
                          <span className={styles.moduleCheckbox}>
                            {isSelected ? <Icons.check size={12} /> : null}
                          </span>
                          <span className={styles.moduleName}>{mod.name}</span>
                          {mod.metricChanges?.hpGain && (
                            <span className={styles.moduleHpGain}>+{mod.metricChanges.hpGain}hp</span>
                          )}
                        </button>
                        <button
                          className={styles.moduleInfoBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUpgradeForModal(fullDetails);
                          }}
                          aria-label={`Info about ${mod.name}`}
                        >
                          <Icons.info size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* About These Estimates - Collapsible */}
        <div className={styles.estimatesInfo}>
          <ScoringInfo variant="performance" />
        </div>
        
        {/* Plan Your Build CTA - Links to detailed build view in Garage */}
        {effectiveSelectedModules.length > 0 && (
          <div className={styles.planBuildCta}>
            <div className={styles.planBuildContent}>
              <div className={styles.planBuildText}>
                <h4 className={styles.planBuildTitle}>Ready to Execute Your Build?</h4>
                <p className={styles.planBuildDescription}>
                  View the complete build plan with tools needed, installation notes, and complexity assessment.
                </p>
              </div>
              {currentBuildId ? (
                <Link 
                  href={`/garage?build=${currentBuildId}`}
                  className={styles.planBuildButton}
                >
                  <Icons.folder size={18} />
                  View Full Build Plan
                  <Icons.chevronRight size={16} />
                </Link>
              ) : (
                <button
                  className={styles.planBuildButton}
                  onClick={() => {
                    setBuildName(`${car.name} Build`);
                    setShowSaveModal(true);
                  }}
                >
                  <Icons.save size={18} />
                  Save & View Build Plan
                  <Icons.chevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Footer Links */}
        <div className={styles.hubFooter}>
          <Link href="/encyclopedia" className={styles.footerLink}>
            Learn About Modifications <Icons.chevronRight size={14} />
          </Link>
          <Link href="/encyclopedia?topic=systems" className={styles.footerLink}>
            Explore Vehicle Systems <Icons.chevronRight size={14} />
          </Link>
          <Link href="/contact" className={styles.footerLink}>
            Have Questions? <Icons.chevronRight size={14} />
          </Link>
        </div>
      </main>
      
      {/* Upgrade Detail Modal */}
      {selectedUpgradeForModal && (
        <UpgradeDetailModal
          upgrade={selectedUpgradeForModal}
          onClose={() => setSelectedUpgradeForModal(null)}
          showAddToBuild={false}
        />
      )}
      
      {/* Save Build Modal */}
      {showSaveModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSaveModal(false)}>
          <div className={styles.saveModal} onClick={e => e.stopPropagation()}>
            <div className={styles.saveModalHeader}>
              <h3 className={styles.saveModalTitle}>
                <Icons.save size={20} />
                {currentBuildId ? 'Update Build' : 'Save Build'}
              </h3>
              <button 
                className={styles.saveModalClose}
                onClick={() => setShowSaveModal(false)}
              >
                <Icons.x size={20} />
              </button>
            </div>
            
            <div className={styles.saveModalBody}>
              <div className={styles.saveModalCarInfo}>
                <CarImage car={car} variant="thumbnail" className={styles.saveModalCarImage} />
                <div className={styles.saveModalCarDetails}>
                  <span className={styles.saveModalCarName}>{car.name}</span>
                  <div className={styles.saveModalUpgradeCount}>
                    <span>{effectiveSelectedModules.length} upgrade{effectiveSelectedModules.length !== 1 ? 's' : ''}</span>
                    <span>${totalCost.low?.toLocaleString()} - ${totalCost.high?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className={styles.saveModalSummary}>
                <h4 className={styles.saveModalSummaryTitle}>Selected Upgrades</h4>
                {effectiveSelectedModules.length > 0 ? (
                  <div className={styles.saveModalUpgradesList}>
                    {effectiveSelectedModules.map(mod => (
                      <span key={mod} className={styles.saveModalUpgradeTag}>
                        <Icons.check size={12} />
                        {mod}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className={styles.saveModalEmptyState}>
                    No upgrades selected yet
                  </div>
                )}
              </div>
              
              <div className={styles.saveModalField}>
                <label className={styles.saveModalLabel} htmlFor="buildName">
                  Build Name
                </label>
                <input
                  id="buildName"
                  type="text"
                  className={styles.saveModalInput}
                  value={buildName}
                  onChange={e => setBuildName(e.target.value)}
                  placeholder="e.g., Track Day Setup, Daily Driver+"
                  autoFocus
                />
              </div>
              
              {saveError && (
                <div className={styles.saveModalError}>
                  <Icons.alertTriangle size={16} />
                  {saveError}
                </div>
              )}
              
              {!canSave && (
                <div className={styles.saveModalSignIn}>
                  <Icons.info size={16} />
                  <span>Sign in to save builds to your garage</span>
                  <Link href="/garage" className={styles.saveModalSignInLink}>
                    Sign In
                  </Link>
                </div>
              )}
              
              {/* Apply to My Vehicle Section */}
              {hasMatchingVehicle && effectiveSelectedModules.length > 0 && (
                <div className={styles.applyToVehicleSection}>
                  <div className={styles.applyToVehicleDivider}>
                    <span>or</span>
                  </div>
                  <h4 className={styles.applyToVehicleTitle}>
                    <Icons.car size={16} />
                    Apply to Your Vehicle
                  </h4>
                  <p className={styles.applyToVehicleDesc}>
                    Mark these upgrades as installed on your owned {car.name}
                  </p>
                  {applySuccess ? (
                    <div className={styles.applySuccess}>
                      <Icons.check size={16} />
                      Modifications applied to {applySuccess.nickname || `${applySuccess.year} ${applySuccess.make} ${applySuccess.model}`}!
                    </div>
                  ) : (
                    <div className={styles.applyToVehicleList}>
                      {matchingVehicles.map(vehicle => (
                        <button
                          key={vehicle.id}
                          className={styles.applyToVehicleButton}
                          onClick={() => handleApplyToVehicle(vehicle.id)}
                          disabled={isApplyingToVehicle}
                        >
                          <div className={styles.applyVehicleInfo}>
                            <span className={styles.applyVehicleName}>
                              {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            </span>
                            {vehicle.isModified && (
                              <span className={styles.applyVehicleModified}>
                                Modified • +{vehicle.displayHpGain} HP
                              </span>
                            )}
                          </div>
                          <span className={styles.applyVehicleAction}>
                            {isApplyingToVehicle ? 'Applying...' : (vehicle.isModified ? 'Update Mods' : 'Apply Mods')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className={styles.saveModalFooter}>
              <button 
                className={styles.saveModalCancel}
                onClick={() => setShowSaveModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.saveModalSave}
                onClick={handleSaveBuild}
                disabled={isSaving || !canSave}
              >
                {isSaving ? 'Saving...' : (currentBuildId ? 'Update Build' : 'Save to Garage')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
