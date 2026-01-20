'use client';

/**
 * Virtual Dyno Chart Component
 * 
 * Displays estimated HP/TQ curve based on modifications.
 * Uses physics model to generate RPM-based power curve.
 * 
 * Note: All values are CRANK HP for consistency (database stores crank HP)
 */

import React from 'react';
import AskALButton from './AskALButton';
import styles from './VirtualDynoChart.module.css';

export default function VirtualDynoChart({ 
  stockHp, 
  estimatedHp, 
  stockTorque, 
  estimatedTq, 
  peakRpm = 6500,
  compact = false,
  carName = null,
  carSlug = null,
}) {
  // Guard against invalid values
  const safeStockHp = (typeof stockHp === 'number' && !isNaN(stockHp) && stockHp > 0) ? stockHp : 300;
  const safeEstimatedHp = (typeof estimatedHp === 'number' && !isNaN(estimatedHp) && estimatedHp > 0) ? estimatedHp : safeStockHp;
  
  // Generate dyno curve data points
  const generateCurve = (peakPower, peakTq, isStock = false) => {
    const points = [];
    const startRpm = 1000;
    const endRpm = 9000;
    const step = 250;

    for (let rpm = startRpm; rpm <= endRpm; rpm += step) {
      // Power curve shape (rises, peaks, falls)
      const rpmRatio = rpm / peakRpm;
      const powerFactor = rpmRatio < 1
        ? Math.pow(rpmRatio, 1.8)
        : 1 - Math.pow((rpmRatio - 1) * 2, 2) * 0.3;

      // Torque peaks earlier and stays flatter
      const torqueRpmRatio = rpm / (peakRpm * 0.75);
      const torqueFactor = torqueRpmRatio < 1
        ? Math.pow(torqueRpmRatio, 1.2)
        : 1 - Math.pow((torqueRpmRatio - 1) * 1.5, 2) * 0.2;

      points.push({
        rpm,
        hp: Math.max(0, Math.round(peakPower * Math.max(0, powerFactor))),
        tq: Math.max(0, Math.round(peakTq * Math.max(0, torqueFactor))),
      });
    }
    return points;
  };

  const stockCurve = generateCurve(safeStockHp, stockTorque || safeStockHp * 0.85, true);
  const modCurve = generateCurve(safeEstimatedHp, estimatedTq || safeEstimatedHp * 0.9, false);

  const maxHp = Math.max(safeEstimatedHp, safeStockHp) * 1.15;
  const hpGain = safeEstimatedHp - safeStockHp;

  // Calculate HP gain for prompt context
  const hpGainForPrompt = safeEstimatedHp - safeStockHp;
  const hasGains = hpGainForPrompt > 0;
  
  // Build contextual prompt for AL
  const alPrompt = carName 
    ? `Explain my ${carName}'s dyno curve. ${hasGains ? `I've gained ${hpGainForPrompt} HP from ${safeStockHp} to ${safeEstimatedHp} HP.` : `It's currently stock at ${safeStockHp} HP.`} What does the power curve tell me about how my car delivers power? Where is the powerband and how can I optimize my driving for it?`
    : `Explain this dyno curve showing ${safeStockHp} HP stock to ${safeEstimatedHp} HP modified. What does the power curve shape tell me about power delivery and how to drive it?`;
  
  const alDisplayMessage = hasGains 
    ? `Explain my dyno curve (+${hpGainForPrompt} HP)`
    : 'Explain my power curve';

  return (
    <div className={`${styles.virtualDyno} ${compact ? styles.compact : ''}`}>
      {/* Header */}
      <div className={styles.dynoHeader}>
        <div className={styles.dynoTitleSection}>
          <span className={styles.dynoTitle}>Virtual Dyno</span>
          <span className={styles.dynoSubtitle}>Estimated power curve based on your modifications</span>
        </div>
        <AskALButton
          category="Virtual Dyno"
          prompt={alPrompt}
          displayMessage={alDisplayMessage}
          carName={carName}
          carSlug={carSlug}
          variant="header"
          metadata={{ 
            section: 'virtual-dyno',
            stockHp: safeStockHp,
            estimatedHp: safeEstimatedHp,
            hpGain: hpGainForPrompt,
          }}
        />
      </div>
      
      {/* Legend */}
      <div className={styles.dynoLegend}>
        <span className={styles.dynoLegendItem}>
          <span className={styles.dynoLegendLine} style={{ background: 'rgba(255,255,255,0.4)', borderStyle: 'dashed' }} />
          <span>Stock: {safeStockHp} HP</span>
        </span>
        <span className={styles.dynoLegendItem}>
          <span className={styles.dynoLegendLine} style={{ background: '#10b981' }} />
          <span>Modified: {safeEstimatedHp} HP</span>
        </span>
      </div>

      {/* Chart Area */}
      <div className={styles.dynoChart}>
        {/* Y-Axis Labels */}
        <div className={styles.dynoYAxis}>
          <span>{Math.round(maxHp)}</span>
          <span>{Math.round(maxHp * 0.75)}</span>
          <span>{Math.round(maxHp * 0.5)}</span>
          <span>{Math.round(maxHp * 0.25)}</span>
          <span>0</span>
        </div>
        
        {/* Chart Area */}
        <div className={styles.dynoChartArea}>
          {/* Grid lines */}
          <div className={styles.dynoGrid}>
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className={styles.dynoGridLine} style={{ bottom: `${i * 25}%` }} />
            ))}
          </div>
          
          {/* Gain area fill between curves */}
          <svg className={styles.dynoCurveSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="gainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            {/* Fill area between curves */}
            <path
              d={
                modCurve.map((p, i) => {
                  const x = ((p.rpm - 1000) / 8000) * 100;
                  const y = 100 - (p.hp / maxHp) * 100;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ') +
                stockCurve.slice().reverse().map((p) => {
                  const x = ((p.rpm - 1000) / 8000) * 100;
                  const y = 100 - (p.hp / maxHp) * 100;
                  return `L ${x} ${y}`;
                }).join(' ') + ' Z'
              }
              fill="url(#gainGradient)"
            />
          </svg>
          
          {/* Stock HP curve */}
          <svg className={styles.dynoCurveSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d={stockCurve.map((p, i) => {
                const x = ((p.rpm - 1000) / 8000) * 100;
                const y = 100 - (p.hp / maxHp) * 100;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1"
              strokeDasharray="4 2"
            />
          </svg>
          
          {/* Modified HP curve */}
          <svg className={styles.dynoCurveSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d={modCurve.map((p, i) => {
                const x = ((p.rpm - 1000) / 8000) * 100;
                const y = 100 - (p.hp / maxHp) * 100;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
            />
          </svg>
          
          {/* Stock peak marker */}
          <div
            className={styles.dynoPeakMarkerStock}
            style={{
              left: `${((peakRpm - 1000) / 8000) * 100}%`,
              bottom: `${(safeStockHp / maxHp) * 100}%`
            }}
          >
            <span className={styles.dynoPeakValueStock}>{safeStockHp}</span>
          </div>
          
          {/* Modified peak marker */}
          <div
            className={styles.dynoPeakMarkerMod}
            style={{
              left: `${((peakRpm - 1000) / 8000) * 100}%`,
              bottom: `${(safeEstimatedHp / maxHp) * 100}%`
            }}
          >
            <span className={styles.dynoPeakValueMod}>{safeEstimatedHp}</span>
            <span className={styles.dynoPeakLabelMod}>HP</span>
          </div>

          {/* Gain annotation line */}
          <div
            className={styles.dynoGainLine}
            style={{
              left: `${((peakRpm - 1000) / 8000) * 100}%`,
              bottom: `${(safeStockHp / maxHp) * 100}%`,
              height: `${((safeEstimatedHp - safeStockHp) / maxHp) * 100}%`
            }}
          >
            <span className={styles.dynoGainAnnotation}>+{hpGain}</span>
          </div>
        </div>
        
        {/* X-Axis Labels */}
        <div className={styles.dynoXAxis}>
          <span>1k</span>
          <span>3k</span>
          <span>5k</span>
          <span>7k</span>
          <span>9k RPM</span>
        </div>
      </div>
    </div>
  );
}
