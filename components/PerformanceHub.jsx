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

import { useState, useMemo } from 'react';
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
import { getUpgradeByKey } from '@/lib/upgrades.js';
import { upgradeTiers } from '@/data/performanceCategories.js';
import { tierConfig } from '@/data/cars.js';
import { getRecommendationsForCar, getTierRecommendations } from '@/data/carUpgradeRecommendations.js';
import { validateUpgradeSelection, getRecommendedUpgrades, getSystemImpactOverview, SEVERITY } from '@/lib/dependencyChecker.js';
import CarImage from './CarImage';

// Icons for performance categories
const Icons = {
  tachometer: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  tire: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  ),
  brake: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v12"/>
      <path d="M6 12h12"/>
    </svg>
  ),
  flag: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  comfort: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  thermometer: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
    </svg>
  ),
  sound: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  ),
  chevronRight: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  chevronDown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  arrowLeft: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  wrench: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  check: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  bolt: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  stopwatch: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 9v4l2 2"/>
      <path d="M9 2h6"/>
      <path d="M12 2v2"/>
    </svg>
  ),
  info: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  alertTriangle: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
};

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
 * Recommended for This Car - Shows car-specific upgrade recommendations
 */
function CarRecommendations({ car, currentTier, selectedModules, onAddToModule, onUpgradeClick }) {
  // Get recommendations - returns null for 'stock' or 'custom' or unrecognized tiers
  const recommendations = useMemo(() => {
    if (currentTier === 'stock' || currentTier === 'custom') return null;
    return getTierRecommendations(car.slug, currentTier);
  }, [car.slug, currentTier]);
  
  // Combine mustHave and recommended, resolving to full upgrade details
  // Must compute this before conditional return to satisfy React hooks rules
  const allRecommended = useMemo(() => {
    if (!recommendations) return [];
    const keys = [...(recommendations.mustHave || []), ...(recommendations.recommended || [])];
    return keys.map(key => {
      const upgrade = getUpgradeByKey(key);
      const isSelected = selectedModules.includes(key);
      return { key, upgrade, isSelected };
    }).filter(item => item.upgrade);
  }, [recommendations, selectedModules]);
  
  // Group into selected and not-selected
  const notYetSelected = allRecommended.filter(item => !item.isSelected);
  
  // Early return after all hooks
  if (!recommendations) return null;
  if (notYetSelected.length === 0 && !recommendations.narrative) return null;
  
  return (
    <div className={styles.carRecommendations}>
      <h4 className={styles.recTitle}>
        <Icons.flag size={16} />
        Recommended for {car.name}
      </h4>
      
      {recommendations.narrative && (
        <p className={styles.recNarrative}>{recommendations.narrative}</p>
      )}
      
      {notYetSelected.length > 0 && (
        <div className={styles.recUpgrades}>
          {notYetSelected.map(({ key, upgrade }) => (
            <div key={key} className={styles.recUpgradeItem}>
              <button
                className={styles.recUpgradeChip}
                onClick={() => onUpgradeClick(upgrade)}
              >
                <span className={styles.recUpgradeName}>{upgrade.name}</span>
                {upgrade.metricChanges?.hpGain && (
                  <span className={styles.recUpgradeGain}>+{upgrade.metricChanges.hpGain}hp</span>
                )}
              </button>
              <button
                className={styles.recAddBtn}
                onClick={() => onAddToModule(key)}
                title="Add to build"
              >
                <Icons.check size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {notYetSelected.length === 0 && (
        <p className={styles.recComplete}>
          <Icons.check size={14} /> All recommended upgrades are in your build!
        </p>
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
 * Build Summary Panel - Comprehensive build validation and insights
 * Consolidates: Systems Impact + Dependency Warnings + Recommendations
 */
function BuildSummaryPanel({ selectedModules, availableModules, onAddMods, car }) {
  // Get system impacts
  const impacts = useMemo(() => {
    if (!selectedModules || selectedModules.length === 0) return [];
    return getSystemImpactOverview(selectedModules);
  }, [selectedModules]);
  
  // Get validation data
  const validation = useMemo(() => {
    if (selectedModules.length === 0) return null;
    return validateUpgradeSelection(selectedModules, car);
  }, [selectedModules, car]);
  
  // Get recommended upgrades
  const recommendations = useMemo(() => {
    if (selectedModules.length === 0) return [];
    return getRecommendedUpgrades(selectedModules, car);
  }, [selectedModules, car]);
  
  // Check simple deps from upgrades
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
    
    const availableKeys = Object.values(availableModules || {}).flat().map(m => m.key);
    
    return {
      required: [...allRequires].filter(k => availableKeys.includes(k)),
      recommended: [...allRecommended].filter(k => availableKeys.includes(k)),
    };
  }, [selectedModules, availableModules]);
  
  // Calculate stats
  const stats = useMemo(() => {
    let improves = 0;
    let stresses = 0;
    
    impacts.forEach(item => {
      improves += item.improves || 0;
      stresses += (item.stresses || 0) + (item.compromises || 0);
    });
    
    return {
      upgrades: selectedModules.length,
      systems: impacts.length,
      improves,
      stresses,
    };
  }, [selectedModules, impacts]);
  
  // Get issues and synergies from validation
  const criticalIssues = validation?.critical || [];
  const warningIssues = validation?.warnings || [];
  const synergies = validation?.synergies || [];
  
  // Filter to available modules
  const availableKeys = Object.values(availableModules || {}).flat().map(m => m.key);
  const filteredRequired = simpleDeps.required.filter(k => availableKeys.includes(k));
  const filteredRecommended = simpleDeps.recommended.filter(k => availableKeys.includes(k));
  
  // Determine build health status
  const hasIssues = filteredRequired.length > 0 || criticalIssues.length > 0;
  const hasWarnings = filteredRecommended.length > 0 || warningIssues.length > 0;
  const healthStatus = hasIssues ? 'critical' : hasWarnings ? 'warning' : 'healthy';
  
  if (selectedModules.length === 0) return null;

  return (
    <div className={styles.buildSummaryPanel} data-status={healthStatus}>
      {/* Build Health Header */}
      <div className={styles.buildSummaryHeader}>
        <div className={styles.buildSummaryTitle}>
          <Icons.wrench size={18} />
          <h4>Build Summary</h4>
          {healthStatus === 'healthy' && <span className={styles.healthBadge} data-status="healthy">✓ Ready</span>}
          {healthStatus === 'warning' && <span className={styles.healthBadge} data-status="warning">⚠ Review</span>}
          {healthStatus === 'critical' && <span className={styles.healthBadge} data-status="critical">⚠ Action Needed</span>}
        </div>
      </div>
      
      {/* Stats Row */}
      <div className={styles.buildStatsRow}>
        <div className={styles.buildStat}>
          <span className={styles.buildStatNumber}>{stats.upgrades}</span>
          <span className={styles.buildStatLabel}>Upgrades</span>
        </div>
        <div className={styles.buildStat}>
          <span className={styles.buildStatNumber}>{stats.systems}</span>
          <span className={styles.buildStatLabel}>Systems</span>
        </div>
        <div className={styles.buildStat} data-type="positive">
          <span className={styles.buildStatNumber}>+{stats.improves}</span>
          <span className={styles.buildStatLabel}>Improvements</span>
        </div>
        <div className={styles.buildStat} data-type={stats.stresses > 0 ? 'negative' : 'neutral'}>
          <span className={styles.buildStatNumber}>{stats.stresses}</span>
          <span className={styles.buildStatLabel}>Stress Points</span>
        </div>
      </div>
      
      {/* Issues Section - Required/Critical */}
      {filteredRequired.length > 0 && (
        <div className={styles.buildIssueBox} data-severity="critical">
          <div className={styles.buildIssueHeader}>
            <Icons.alertTriangle size={16} />
            <span>Missing Requirements</span>
          </div>
          <p className={styles.buildIssueDesc}>
            These upgrades are required for your selected mods to work properly:
          </p>
          <div className={styles.buildIssueList}>
            {filteredRequired.map(key => {
              const upgrade = getUpgradeByKey(key);
              const rec = recommendations.find(r => r.upgradeKey === key);
              return (
                <div key={key} className={styles.buildIssueItem}>
                  <div className={styles.buildIssueContent}>
                    <span className={styles.buildIssueName}>{upgrade?.name || key}</span>
                    {rec?.reason && <span className={styles.buildIssueReason}>{rec.reason}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <button 
            className={styles.buildActionBtn}
            onClick={() => onAddMods(filteredRequired)}
          >
            <Icons.check size={14} />
            Add Required ({filteredRequired.length})
          </button>
        </div>
      )}
      
      {/* Warnings Section - Recommended */}
      {filteredRecommended.length > 0 && (
        <div className={styles.buildIssueBox} data-severity="warning">
          <div className={styles.buildIssueHeader}>
            <Icons.info size={16} />
            <span>Strongly Recommended</span>
          </div>
          <p className={styles.buildIssueDesc}>
            These upgrades pair well with your selections for best results:
          </p>
          <div className={styles.buildIssueList}>
            {filteredRecommended.map(key => {
              const upgrade = getUpgradeByKey(key);
              const rec = recommendations.find(r => r.upgradeKey === key);
              return (
                <div key={key} className={styles.buildIssueItem}>
                  <div className={styles.buildIssueContent}>
                    <span className={styles.buildIssueName}>{upgrade?.name || key}</span>
                    {rec?.reason && <span className={styles.buildIssueReason}>{rec.reason}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <button 
            className={styles.buildActionBtnSecondary}
            onClick={() => onAddMods(filteredRecommended)}
          >
            Add Recommended ({filteredRecommended.length})
          </button>
        </div>
      )}
      
      {/* Synergies Section */}
      {synergies.length > 0 && (
        <div className={styles.buildSynergyBox}>
          <div className={styles.buildIssueHeader}>
            <Icons.check size={16} />
            <span>Great Combinations</span>
          </div>
          {synergies.map((synergy, idx) => (
            <p key={idx} className={styles.buildSynergyText}>
              <strong>{synergy.name}:</strong> {synergy.message}
            </p>
          ))}
        </div>
      )}
      
      {/* Systems Overview - Compact */}
      {impacts.length > 0 && (
        <div className={styles.buildSystemsOverview}>
          <div className={styles.buildSystemsHeader}>
            <span>Systems Affected</span>
          </div>
          <div className={styles.buildSystemsGrid}>
            {impacts.map(item => (
              <div 
                key={item.system.key} 
                className={styles.buildSystemChip}
                data-has-risk={(item.stresses || 0) + (item.compromises || 0) > 0}
              >
                <span className={styles.buildSystemName}>{item.system.name}</span>
                <div className={styles.buildSystemStats}>
                  {item.improves > 0 && (
                    <span className={styles.buildSystemPositive}>+{item.improves}</span>
                  )}
                  {(item.stresses > 0 || item.compromises > 0) && (
                    <span className={styles.buildSystemNegative}>
                      {item.stresses + item.compromises} stress
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
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
 * Main Performance HUB component
 */
export default function PerformanceHub({ car }) {
  // Get car-specific recommendations to determine default tier
  const carRecommendations = useMemo(() => 
    getRecommendationsForCar(car.slug), 
    [car.slug]
  );
  
  // Initialize to car's default tier if available, otherwise stock
  const [selectedPackageKey, setSelectedPackageKey] = useState(() => {
    return carRecommendations?.defaultTier || 'stock';
  });
  const [expandedModules, setExpandedModules] = useState(false);
  const [selectedModules, setSelectedModules] = useState([]);
  const [selectedUpgradeForModal, setSelectedUpgradeForModal] = useState(null);
  
  // Get available upgrades for this car
  const availableUpgrades = useMemo(() => 
    getAvailableUpgrades(car), 
    [car]
  );
  
  // Get the modules included in the currently selected package
  const packageIncludedModules = useMemo(() => {
    if (selectedPackageKey === 'stock' || selectedPackageKey === 'custom') return [];
    const pkg = availableUpgrades.packages.find(p => p.key === selectedPackageKey);
    return pkg?.includedUpgradeKeys || [];
  }, [selectedPackageKey, availableUpgrades.packages]);
  
  // Effective selected modules (package defaults + user modifications)
  const effectiveSelectedModules = useMemo(() => {
    if (selectedPackageKey === 'custom' || selectedPackageKey === 'stock') {
      return selectedModules;
    }
    // For packages, combine package defaults with any additional user selections
    const combined = new Set([...packageIncludedModules, ...selectedModules]);
    return Array.from(combined);
  }, [selectedPackageKey, packageIncludedModules, selectedModules]);
  
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
  
  const tierInfo = tierConfig[car.tier] || {};
  const showUpgrade = selectedPackageKey !== 'stock' || selectedModules.length > 0;
  
  // Get the subjective score categories
  const subjectiveCategories = scoreComparison.filter(cat => 
    ['drivability', 'reliabilityHeat', 'soundEmotion'].includes(cat.key)
  );

  // Format numbers with commas
  const formatNumber = (num) => num?.toLocaleString() || '—';
  
  return (
    <div className={styles.hubV2}>
      {/* ================================================================
          NAVIGATION BAR
          ================================================================ */}
      <div className={styles.hubNavWrapper}>
        <nav className={styles.hubNav}>
          <Link href="/performance" className={styles.backLink}>
            <Icons.arrowLeft size={16} />
            Back to Performance HUB
          </Link>
          <Link href={`/cars/${car.slug}`} className={styles.viewProfileLink}>
            View Car Details
            <Icons.chevronRight size={14} />
          </Link>
        </nav>
      </div>

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
            <div className={styles.priceRange}>
              {tierInfo.priceRange || '$50-75K'}
            </div>
          </div>
          
          {/* Specs Grid - Like GT */}
          <div className={styles.specsGrid}>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Engine</span>
              <span className={styles.specValue}>{car.engine}</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Max Power</span>
              <span className={styles.specValue}>{car.hp} <small>hp</small></span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Max Torque</span>
              <span className={styles.specValue}>{car.torque || '—'} <small>lb-ft</small></span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Weight</span>
              <span className={styles.specValue}>{formatNumber(car.curbWeight)} <small>lbs</small></span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Drivetrain</span>
              <span className={styles.specValue}>{car.drivetrain || 'RWD'}</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>0-60 mph</span>
              <span className={styles.specValue}>{car.zeroToSixty || '—'} <small>sec</small></span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Layout</span>
              <span className={styles.specValue}>{car.category || 'Front-Engine'}</span>
            </div>
            <div className={styles.specItem}>
              <span className={styles.specLabel}>Transmission</span>
              <span className={styles.specValue}>{car.manualAvailable ? 'Manual Available' : 'Auto Only'}</span>
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
        {/* Title + Package Selector Row */}
        <div className={styles.titleRow}>
          <h2 className={styles.hubTitle}>Performance HUB</h2>
          <div className={styles.packageSelector}>
            <button
              className={`${styles.packagePill} ${selectedPackageKey === 'stock' && selectedModules.length === 0 ? styles.active : ''}`}
              onClick={() => handlePackageSelect('stock')}
            >
              Stock
            </button>
            {availableUpgrades.packages.map(pkg => (
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
          {showUpgrade && (
            <div className={styles.costBadge}>
              Est. Investment: {totalCost.display}
            </div>
          )}
        </div>

        {/* Car-Specific Recommendations - MOVED TO TOP */}
        {carRecommendations && (
          <CarRecommendations
            car={car}
            currentTier={selectedPackageKey}
            selectedModules={effectiveSelectedModules}
            onAddToModule={(key) => handleModuleToggle(key)}
            onUpgradeClick={setSelectedUpgradeForModal}
          />
        )}

        {/* Performance Metrics - Full Bar Charts */}
        <div className={styles.performanceSection}>
          <h4 className={styles.sectionTitle}>Performance Metrics</h4>
          
          {/* Power (HP) */}
          <RealMetricRow
            icon={Icons.bolt}
            label="Power"
            stockValue={profile.stockMetrics.hp || car.hp}
            upgradedValue={profile.upgradedMetrics.hp}
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
              </div>
            )}
          </div>
          
          {/* Full-Width Module Grid */}
          <div className={styles.modulesGridFull}>
            {Object.entries(availableUpgrades.modulesByCategory).map(([catKey, modules]) => (
              <div key={catKey} className={styles.moduleCategory}>
                <h5 className={styles.moduleCategoryTitle}>
                  {catKey.charAt(0).toUpperCase() + catKey.slice(1)}
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
        
        {/* Build Summary Panel - Comprehensive validation at the bottom */}
        <BuildSummaryPanel 
          selectedModules={effectiveSelectedModules}
          availableModules={availableUpgrades.modulesByCategory}
          onAddMods={handleAddRequiredMods}
          car={car}
        />
        
        {/* About These Estimates - Collapsible */}
        <div className={styles.estimatesInfo}>
          <ScoringInfo variant="performance" />
        </div>
        
        {/* Footer Links */}
        <div className={styles.hubFooter}>
          <Link href="/education" className={styles.footerLink}>
            Learn About Modifications <Icons.chevronRight size={14} />
          </Link>
          <Link href="/education#systems" className={styles.footerLink}>
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
    </div>
  );
}
