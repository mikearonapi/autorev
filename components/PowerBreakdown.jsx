'use client';

/**
 * Power Breakdown - Shows where HP gains come from
 * Visualizes contribution of each modification category
 */

import React from 'react';
import styles from './PowerBreakdown.module.css';

export default function PowerBreakdown({ stockHp, specs, estimate }) {
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
      breakdown.push({ label: 'Engine Internals', gain: engineGain, color: '#f59e0b' });
      runningTotal += engineGain;
    }
  }
  
  // Breathing mods
  let breathingGain = 0;
  if (specs?.intake?.type !== 'stock') breathingGain += Math.round(stockHp * 0.02);
  if (specs?.exhaust?.downpipe !== 'stock') breathingGain += Math.round(stockHp * 0.03);
  if (specs?.exhaust?.headers !== 'stock') breathingGain += Math.round(stockHp * 0.03);
  if (breathingGain > 0) {
    breakdown.push({ label: 'Intake & Exhaust', gain: breathingGain, color: '#8b5cf6' });
    runningTotal += breathingGain;
  }
  
  // Turbo upgrade
  if (specs?.turbo?.type !== 'stock') {
    const turboGain = Math.round((estimate?.whp || runningTotal) - runningTotal - (specs?.fuel?.type === 'e85' ? stockHp * 0.15 : 0));
    if (turboGain > 0) {
      breakdown.push({ label: 'Turbo Upgrade', gain: turboGain, color: '#ef4444' });
      runningTotal += turboGain;
    }
  }
  
  // Fuel
  if (specs?.fuel?.type === 'e85') {
    const fuelGain = Math.round(stockHp * 0.15);
    breakdown.push({ label: 'E85 Fuel', gain: fuelGain, color: '#10b981' });
    runningTotal += fuelGain;
  } else if (specs?.fuel?.type === 'e50' || specs?.fuel?.type === 'e30') {
    const fuelGain = Math.round(stockHp * (specs.fuel.type === 'e50' ? 0.10 : 0.06));
    breakdown.push({ label: `${specs.fuel.type.toUpperCase()} Fuel`, gain: fuelGain, color: '#10b981' });
    runningTotal += fuelGain;
  }
  
  // ECU
  if (specs?.ecu?.type !== 'stock') {
    const ecuGain = Math.round(stockHp * 0.03);
    breakdown.push({ label: 'ECU Tuning', gain: ecuGain, color: '#3b82f6' });
  }
  
  const totalGain = (estimate?.hp || estimate?.whp || runningTotal) - stockHp;
  
  // If no breakdown items, show a placeholder
  if (breakdown.length === 0) {
    return (
      <div className={styles.powerBreakdown}>
        <div className={styles.breakdownHeader}>
          <span className={styles.breakdownTitle}>Power Breakdown</span>
          <span className={styles.breakdownTotal}>Stock</span>
        </div>
        <div className={styles.breakdownEmpty}>
          <p>No modifications detected</p>
          <p className={styles.breakdownEmptyHint}>Add engine, turbo, or breathing mods to see breakdown</p>
        </div>
      </div>
    );
  }

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
