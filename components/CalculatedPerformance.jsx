'use client';

/**
 * Calculated Performance - Physics-based performance estimates
 * 
 * Matches the styling of garage/my-performance page with progress bars.
 * Shows Performance Metrics + Experience Scores.
 */

import React from 'react';
import AskALButton from './AskALButton';
import styles from './CalculatedPerformance.module.css';
import { Icons } from '@/components/ui/Icons';

// ============================================================================
// METRIC ROW - With progress bar (same as Performance tab)
// ============================================================================
function MetricRow({ icon: Icon, label, stockValue, upgradedValue, unit, isLowerBetter = false, maxScale }) {
  const stock = stockValue ?? 0;
  const upgraded = upgradedValue ?? stock;
  
  const hasImproved = isLowerBetter ? upgraded < stock : upgraded > stock;
  const improvement = Math.abs(upgraded - stock);
  
  const formatValue = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '—';
    if (unit === 'g') return val.toFixed(2);
    if (unit === 's') return val.toFixed(1);
    if (unit === 'ft') return Math.round(val);
    if (unit === 'mph') return Math.round(val);
    return Math.round(val);
  };
  
  const formatDelta = (val) => {
    if (unit === 'g') return val.toFixed(2);
    if (unit === 's') return val.toFixed(1);
    return Math.round(val);
  };
  
  // Calculate bar percentages based on metric type
  // Use explicit maxScale if provided, otherwise use defaults
  const defaultMaxValues = { hp: 1200, s: 8, ft: 150, g: 1.6, mph: 200 };
  const maxValue = maxScale || defaultMaxValues[unit] || 1200;
  
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
              <span className={styles.gain}>{isLowerBetter ? '-' : '+'}{formatDelta(improvement)}</span>
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

// ============================================================================
// SCORE BAR - Experience scores with progress bar
// ============================================================================
function ScoreBar({ label, stockScore, upgradedScore }) {
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

export default function CalculatedPerformance({
  stockHp,
  estimatedHp,
  weight = 3500,
  drivetrain = 'AWD',
  tireCompound = 'summer',
  weightMod = 0, 
  driverWeight = 180, 
  finalDrive = null,
  wheelWeight = null,
  handlingScore = 100,
  brakingScore = 100,
  // Experience score props (optional - will calculate defaults if not provided)
  stockComfort = 8.5,
  upgradedComfort = null,
  stockReliability = 8.0,
  upgradedReliability = null,
  stockSound = 6.5,
  upgradedSound = null,
  hasExhaust = false,
  hasIntake = false,
  hasTune = false,
  hasSuspension = false,
  // Car context for Ask AL prompts
  carName = null,
  carSlug = null,
}) {
  // Guard against invalid inputs
  const safeStockHp = (typeof stockHp === 'number' && !isNaN(stockHp) && stockHp > 0) ? stockHp : 300;
  const safeEstimatedHp = (typeof estimatedHp === 'number' && !isNaN(estimatedHp) && estimatedHp > 0) ? estimatedHp : safeStockHp;
  const safeWeight = (typeof weight === 'number' && !isNaN(weight) && weight > 0) ? weight : 3500;
  
  // Adjust weight for modifications and driver
  const totalWeight = safeWeight + (weightMod || 0) + (driverWeight || 180);
  const stockTotalWeight = safeWeight + 180;
  
  // Wheel weight affects rotational inertia
  const stockWheelWeight = 25;
  const currentWheelWeight = wheelWeight || stockWheelWeight;
  const wheelWeightDiff = (stockWheelWeight - currentWheelWeight) * 4;
  const effectiveWeight = totalWeight - wheelWeightDiff;
  const stockEffectiveWeight = stockTotalWeight;
  
  // Tire grip multiplier
  const tireKMultiplier = {
    'all-season': 1.08,
    'summer': 1.0,
    'max-performance': 0.97,
    'r-comp': 0.93,
    'drag-radial': 0.85,
    'slick': 0.82,
  };
  const kTire = tireKMultiplier[tireCompound] || 1.0;
  
  // Drivetrain coefficient
  const drivetrainK = {
    'AWD': 1.20,
    'RWD': 1.35,
    'FWD': 1.40,
    '4WD': 1.25,
  };
  const baseK = drivetrainK[drivetrain] || 1.30;
  
  // Calculate 0-60
  const weightToHp = effectiveWeight / safeEstimatedHp;
  const stockWeightToHp = stockEffectiveWeight / safeStockHp;
  const estimated060 = Math.max(2.0, Math.sqrt(weightToHp) * baseK * kTire);
  const stock060 = Math.max(2.5, Math.sqrt(stockWeightToHp) * baseK);
  
  // 1/4 mile
  const tractionBonus = tireCompound === 'drag-radial' ? 0.94 : tireCompound === 'slick' ? 0.92 : 1.0;
  const estimatedQuarter = 5.825 * Math.pow(weightToHp, 0.333) * tractionBonus;
  const stockQuarter = 5.825 * Math.pow(stockWeightToHp, 0.333);

  // Trap speed
  const finalDriveFactor = finalDrive ? Math.min(1.02, 3.5 / finalDrive) : 1.0;
  const estimatedTrap = 234 * Math.pow(safeEstimatedHp / effectiveWeight, 0.333) * finalDriveFactor;
  const stockTrap = 234 * Math.pow(safeStockHp / stockEffectiveWeight, 0.333);
  
  // Braking distance
  const stockBraking60 = 120;
  const brakingImprovement = (brakingScore - 100) / 100;
  const estimatedBraking60 = Math.round(stockBraking60 * (1 - brakingImprovement * 0.25));
  
  // Lateral G
  const baseG = 0.90;
  const handlingImprovement = (handlingScore - 100) / 100;
  const estimatedLateralG = baseG * (1 + handlingImprovement * 0.3);
  const stockLateralG = baseG;
  
  // Power/Weight ratio
  const powerToWeight = (safeEstimatedHp / effectiveWeight) * 2000;
  const stockPtw = (safeStockHp / stockEffectiveWeight) * 2000;
  
  // Calculate experience scores based on modifications
  const calcComfort = () => {
    let score = upgradedComfort ?? stockComfort;
    if (upgradedComfort === null) {
      // Suspension mods reduce comfort slightly
      if (hasSuspension) score = Math.max(5, score - 1.2);
      // Stiffer tires reduce comfort
      if (tireCompound === 'r-comp' || tireCompound === 'slick') score = Math.max(5, score - 0.8);
    }
    return score;
  };
  
  const calcReliability = () => {
    let score = upgradedReliability ?? stockReliability;
    if (upgradedReliability === null) {
      // More power can stress components
      const hpGainPercent = ((safeEstimatedHp - safeStockHp) / safeStockHp) * 100;
      if (hpGainPercent > 30) score = Math.max(5, score - 0.8);
      else if (hpGainPercent > 15) score = Math.max(6, score - 0.4);
      // Tunes can improve efficiency if done right
      if (hasTune && hpGainPercent < 20) score = Math.min(10, score + 0.3);
    }
    return score;
  };
  
  const calcSound = () => {
    let score = upgradedSound ?? stockSound;
    if (upgradedSound === null) {
      // Exhaust significantly improves sound
      if (hasExhaust) score = Math.min(10, score + 2.0);
      // Intake adds some sound character
      if (hasIntake) score = Math.min(10, score + 0.5);
    }
    return score;
  };
  
  const finalComfort = calcComfort();
  const finalReliability = calcReliability();
  const finalSound = calcSound();

  // Build contextual prompts for Ask AL
  const hasModifications = safeEstimatedHp > safeStockHp;
  
  const performancePrompt = carName
    ? `Explain my ${carName}'s performance metrics. ${hasModifications ? `With modifications, I've improved from ${stock060.toFixed(1)}s to ${estimated060.toFixed(1)}s 0-60 and ${stockQuarter.toFixed(1)}s to ${estimatedQuarter.toFixed(1)}s quarter mile.` : 'It\'s currently stock.'} How do these numbers compare to similar cars? What mods would improve my times the most?`
    : `Explain these performance metrics: ${estimated060.toFixed(1)}s 0-60, ${estimatedQuarter.toFixed(1)}s quarter mile, ${Math.round(estimatedTrap)} mph trap speed. How can I improve these numbers?`;
  
  const performanceDisplayMessage = hasModifications
    ? 'Explain my performance gains'
    : 'How can I improve these numbers?';

  const experiencePrompt = carName
    ? `Tell me about my ${carName}'s comfort, reliability, and sound characteristics. ${hasExhaust ? 'I have an aftermarket exhaust.' : ''} ${hasSuspension ? 'I have modified suspension.' : ''} What are the tradeoffs with my current setup and how might they affect daily driving vs track use?`
    : `Explain the tradeoffs between comfort (${finalComfort.toFixed(1)}/10), reliability (${finalReliability.toFixed(1)}/10), and sound (${finalSound.toFixed(1)}/10). How do modifications affect the driving experience?`;
  
  const experienceDisplayMessage = 'Explain my experience scores';

  return (
    <div className={styles.calcPerformance}>
      {/* Performance Metrics Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Performance Metrics</h3>
          <AskALButton
            category="Performance Metrics"
            prompt={performancePrompt}
            displayMessage={performanceDisplayMessage}
            carName={carName}
            carSlug={carSlug}
            variant="header"
            metadata={{
              section: 'performance-metrics',
              estimated060,
              estimatedQuarter,
              estimatedTrap,
              stock060,
              stockQuarter,
            }}
          />
        </div>
        <div className={styles.metricsGrid}>
          <MetricRow 
            icon={Icons.bolt} 
            label="HP" 
            stockValue={safeStockHp} 
            upgradedValue={safeEstimatedHp} 
            unit="hp" 
          />
          <MetricRow 
            icon={Icons.stopwatch} 
            label="0-60" 
            stockValue={stock060} 
            upgradedValue={estimated060} 
            unit="s" 
            isLowerBetter 
          />
          <MetricRow 
            icon={Icons.gauge} 
            label="1/4 Mile" 
            stockValue={stockQuarter} 
            upgradedValue={estimatedQuarter} 
            unit="s" 
            isLowerBetter 
            maxScale={15}
          />
          <MetricRow 
            icon={Icons.speed} 
            label="Trap Speed" 
            stockValue={stockTrap} 
            upgradedValue={estimatedTrap} 
            unit="mph" 
          />
          <MetricRow 
            icon={Icons.disc} 
            label="60-0 Braking" 
            stockValue={stockBraking60} 
            upgradedValue={estimatedBraking60} 
            unit="ft" 
            isLowerBetter 
          />
          <MetricRow 
            icon={Icons.target} 
            label="Lateral G" 
            stockValue={stockLateralG} 
            upgradedValue={estimatedLateralG} 
            unit="g" 
          />
          <MetricRow 
            icon={Icons.weight} 
            label="Power/Weight" 
            stockValue={stockPtw} 
            upgradedValue={powerToWeight} 
            unit="hp/ton" 
          />
        </div>
      </div>
      
      {/* Experience Scores Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Experience Scores</h3>
          <AskALButton
            category="Experience Scores"
            prompt={experiencePrompt}
            displayMessage={experienceDisplayMessage}
            carName={carName}
            carSlug={carSlug}
            variant="header"
            metadata={{
              section: 'experience-scores',
              comfort: finalComfort,
              reliability: finalReliability,
              sound: finalSound,
              hasExhaust,
              hasSuspension,
              hasTune,
            }}
          />
        </div>
        <div className={styles.scoresGrid}>
          <ScoreBar 
            label="Comfort" 
            stockScore={stockComfort} 
            upgradedScore={finalComfort} 
          />
          <ScoreBar 
            label="Reliability" 
            stockScore={stockReliability} 
            upgradedScore={finalReliability} 
          />
          <ScoreBar 
            label="Sound" 
            stockScore={stockSound} 
            upgradedScore={finalSound} 
          />
        </div>
      </div>
    </div>
  );
}
