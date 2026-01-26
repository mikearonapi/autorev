'use client';

/**
 * Experience Scores Component
 * 
 * Displays comfort, reliability, and sound scores matching the Tuning Shop design.
 * Shows stock scores with optional upgraded scores if modifications were made.
 */

import { useMemo } from 'react';

import { mapCarToPerformanceScores } from '@/data/performanceCategories';
import { applyUpgradeDeltas } from '@/lib/performanceCalculator';
import { getUpgradeByKey } from '@/lib/upgrades';

import styles from './ExperienceScores.module.css';

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

export default function ExperienceScores({ carData, buildData }) {
  const { stockScores, upgradedScores } = useMemo(() => {
    if (!carData) {
      return { stockScores: {}, upgradedScores: {} };
    }

    const stock = mapCarToPerformanceScores(carData);
    
    // Load actual upgrade data with deltas
    let upgradesArray = [];
    if (buildData?.selected_upgrades) {
      // Handle both array format and object with upgrades property
      const upgradeKeys = Array.isArray(buildData.selected_upgrades)
        ? buildData.selected_upgrades
        : buildData.selected_upgrades?.upgrades || [];
      
      // Map keys to actual upgrade objects
      upgradesArray = upgradeKeys
        .map(key => typeof key === 'string' ? getUpgradeByKey(key) : key)
        .filter(Boolean);
    }
    
    // If no upgrades or upgrades are empty, just return stock scores
    if (upgradesArray.length === 0) {
      return { stockScores: stock, upgradedScores: stock };
    }

    // Apply upgrade deltas to stock scores
    const upgraded = applyUpgradeDeltas(stock, upgradesArray);
    
    return { stockScores: stock, upgradedScores: upgraded };
  }, [carData, buildData]);

  if (!carData) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Experience Scores</h3>
      <ScoreBar 
        label="Comfort" 
        stockScore={stockScores?.drivability ?? 7} 
        upgradedScore={upgradedScores?.drivability ?? 7} 
      />
      <ScoreBar 
        label="Reliability" 
        stockScore={stockScores?.reliabilityHeat ?? 7.5} 
        upgradedScore={upgradedScores?.reliabilityHeat ?? 7.5} 
      />
      <ScoreBar 
        label="Sound" 
        stockScore={stockScores?.soundEmotion ?? 8} 
        upgradedScore={upgradedScores?.soundEmotion ?? 8} 
      />
    </div>
  );
}
