'use client';

/**
 * Build Comparison Panel
 * 
 * Shows the breakdown of theoretical vs actual build performance.
 * Displays HP gains by status:
 * - Installed: Mods actually on the car (contributing to Actual HP)
 * - Purchased: Mods bought but not installed yet
 * - Planned: Mods selected but not purchased yet
 * 
 * This helps users understand the difference between their
 * theoretical build and what's actually on their car.
 */

import React, { useMemo } from 'react';
import { Icons } from '@/components/ui/Icons';
import { getUpgradeByKey } from '@/lib/upgrades';
import styles from './BuildComparisonPanel.module.css';

/**
 * Calculate HP gains by status
 */
function calculateGainsByStatus(parts, upgrades) {
  const partsByKey = {};
  parts.forEach(p => {
    if (p.upgradeKey) {
      partsByKey[p.upgradeKey] = p;
    }
  });

  const gainsByStatus = {
    installed: { hp: 0, mods: [] },
    purchased: { hp: 0, mods: [] },
    planned: { hp: 0, mods: [] },
  };

  upgrades.forEach(upgradeKey => {
    const upgrade = getUpgradeByKey(upgradeKey);
    if (!upgrade) return;
    
    const hpGain = upgrade.hp || 0;
    const part = partsByKey[upgradeKey];
    const status = part?.status || 'planned';
    
    if (gainsByStatus[status]) {
      gainsByStatus[status].hp += hpGain;
      gainsByStatus[status].mods.push({
        key: upgradeKey,
        name: upgrade.name,
        hp: hpGain,
        status,
      });
    }
  });

  return gainsByStatus;
}

/**
 * Format HP number with + sign for positive values
 */
function formatHp(hp) {
  if (hp > 0) return `+${hp}`;
  return hp.toString();
}

export default function BuildComparisonPanel({
  stockHp = 0,
  selectedUpgrades = [],
  parts = [],
  totalHpGain = 0,
  className = '',
}) {
  const gainsByStatus = useMemo(() => {
    return calculateGainsByStatus(parts, selectedUpgrades);
  }, [parts, selectedUpgrades]);

  const theoreticalHp = stockHp + totalHpGain;
  const actualHp = stockHp + gainsByStatus.installed.hp;
  const hasUpgrades = selectedUpgrades.length > 0;

  if (!hasUpgrades) return null;

  return (
    <div className={`${styles.panel} ${className}`}>
      <div className={styles.header}>
        <Icons.barChart2 size={16} />
        <h3 className={styles.title}>Build Progress</h3>
      </div>

      <div className={styles.comparison}>
        {/* Theoretical HP */}
        <div className={styles.hpBlock}>
          <div className={styles.hpLabel}>Theoretical HP</div>
          <div className={styles.hpValue}>
            <span className={styles.hpNumber}>{theoreticalHp}</span>
            {totalHpGain > 0 && (
              <span className={styles.hpGain}>(+{totalHpGain} from stock)</span>
            )}
          </div>
        </div>

        {/* Breakdown by Status */}
        <div className={styles.breakdown}>
          {gainsByStatus.installed.mods.length > 0 && (
            <div className={`${styles.breakdownItem} ${styles.statusInstalled}`}>
              <div className={styles.breakdownLine}>
                <Icons.check size={12} />
                <span className={styles.breakdownLabel}>Installed</span>
                <span className={styles.breakdownHp}>{formatHp(gainsByStatus.installed.hp)} HP</span>
              </div>
              <div className={styles.breakdownMods}>
                {gainsByStatus.installed.mods.map(mod => mod.name).join(', ')}
              </div>
            </div>
          )}

          {gainsByStatus.purchased.mods.length > 0 && (
            <div className={`${styles.breakdownItem} ${styles.statusPurchased}`}>
              <div className={styles.breakdownLine}>
                <Icons.shoppingCart size={12} />
                <span className={styles.breakdownLabel}>Purchased</span>
                <span className={styles.breakdownHp}>{formatHp(gainsByStatus.purchased.hp)} HP</span>
              </div>
              <div className={styles.breakdownMods}>
                {gainsByStatus.purchased.mods.map(mod => mod.name).join(', ')}
                <span className={styles.awaitingInstall}> — awaiting install</span>
              </div>
            </div>
          )}

          {gainsByStatus.planned.mods.length > 0 && (
            <div className={`${styles.breakdownItem} ${styles.statusPlanned}`}>
              <div className={styles.breakdownLine}>
                <Icons.clock size={12} />
                <span className={styles.breakdownLabel}>Planned</span>
                <span className={styles.breakdownHp}>{formatHp(gainsByStatus.planned.hp)} HP</span>
              </div>
              <div className={styles.breakdownMods}>
                {gainsByStatus.planned.mods.map(mod => mod.name).join(', ')}
              </div>
            </div>
          )}
        </div>

        {/* Actual HP */}
        <div className={`${styles.hpBlock} ${styles.actualHp}`}>
          <div className={styles.hpLabel}>Actual HP</div>
          <div className={styles.hpValue}>
            <span className={styles.hpNumber}>{actualHp}</span>
            <span className={styles.hpNote}>(installed mods only)</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          {/* Stock base */}
          <div 
            className={styles.progressStock} 
            style={{ width: `${(stockHp / theoreticalHp) * 100}%` }}
          />
          {/* Installed gains */}
          <div 
            className={styles.progressInstalled} 
            style={{ width: `${(gainsByStatus.installed.hp / theoreticalHp) * 100}%` }}
          />
          {/* Purchased gains */}
          <div 
            className={styles.progressPurchased} 
            style={{ width: `${(gainsByStatus.purchased.hp / theoreticalHp) * 100}%` }}
          />
          {/* Planned gains */}
          <div 
            className={styles.progressPlanned} 
            style={{ width: `${(gainsByStatus.planned.hp / theoreticalHp) * 100}%` }}
          />
        </div>
        <div className={styles.progressLabels}>
          <span className={styles.progressLabelStock}>Stock</span>
          <span className={styles.progressLabelTarget}>Target: {theoreticalHp} HP</span>
        </div>
      </div>

      {/* Completion percentage */}
      {gainsByStatus.installed.hp > 0 && totalHpGain > 0 && (
        <div className={styles.completion}>
          <span className={styles.completionPercent}>
            {Math.round((gainsByStatus.installed.hp / totalHpGain) * 100)}%
          </span>
          <span className={styles.completionLabel}>of target gains achieved</span>
        </div>
      )}
    </div>
  );
}
