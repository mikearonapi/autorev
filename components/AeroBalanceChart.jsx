'use client';

/**
 * Aero Balance Chart - Shows downforce at different speeds
 * Based on aero modifications (splitter, wing, diffuser, etc.)
 */

import React from 'react';

import styles from './AeroBalanceChart.module.css';

// Icons
const WindIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/>
    <path d="M9.6 4.6A2 2 0 1 1 11 8H2"/>
    <path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>
  </svg>
);

const AlertCircleIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 8v4"/>
    <path d="M12 16h.01"/>
  </svg>
);

export default function AeroBalanceChart({ aeroSetup, weight }) {
  const speeds = [60, 80, 100, 120, 140];
  
  // Calculate downforce at speed (simplified)
  const calculateDownforce = (speed, setup) => {
    // Base drag coefficient
    let cd = 0.32;
    let cl = 0; // Lift coefficient (negative = downforce)
    
    if (setup?.frontSplitter === 'lip') cl -= 0.02;
    if (setup?.frontSplitter === 'splitter') cl -= 0.05;
    if (setup?.frontSplitter === 'splitter-rods') cl -= 0.08;
    
    if (setup?.rearWing === 'lip-spoiler') cl -= 0.02;
    if (setup?.rearWing === 'duckbill') cl -= 0.04;
    if (setup?.rearWing === 'gt-wing-low') cl -= 0.12;
    if (setup?.rearWing === 'gt-wing-high') cl -= 0.18;
    
    if (setup?.diffuser) cl -= 0.04;
    if (setup?.flatBottom) { cl -= 0.03; cd -= 0.02; }
    if (setup?.canards) cl -= 0.02;
    
    // Downforce in lbs: F = 0.5 * rho * v^2 * A * Cl
    // Simplified: ~0.0026 * v^2 * Cl * frontalArea(22 sqft)
    const frontalArea = 22;
    const speedMs = speed * 0.44704; // mph to m/s
    const downforceLbs = 0.5 * 1.225 * speedMs * speedMs * frontalArea * Math.abs(cl) * 2.205;
    
    // Drag power loss in hp: P = F * v
    const dragForce = 0.5 * 1.225 * speedMs * speedMs * frontalArea * cd;
    const dragPowerHp = (dragForce * speedMs) / 745.7;
    
    return { downforce: Math.round(downforceLbs), dragHp: Math.round(dragPowerHp) };
  };
  
  const aeroData = speeds.map(speed => ({
    speed,
    ...calculateDownforce(speed, aeroSetup)
  }));
  
  const maxDownforce = Math.max(...aeroData.map(d => d.downforce), 1);
  const hasAero = aeroSetup && (aeroSetup.frontSplitter !== 'none' || aeroSetup.rearWing !== 'none');
  
  return (
    <div className={styles.aeroBalance}>
      <div className={styles.aeroBalanceHeader}>
        <WindIcon size={16} />
        <span>Aero at Speed</span>
      </div>
      
      {!hasAero ? (
        <div className={styles.aeroEmpty}>
          <AlertCircleIcon size={24} />
          <span>No aero modifications selected</span>
          <span className={styles.aeroEmptyHint}>Add splitter, wing, or diffuser to see downforce data</span>
        </div>
      ) : (
        <>
          <div className={styles.aeroChart}>
            {aeroData.map((data, i) => (
              <div key={data.speed} className={styles.aeroBar}>
                <div className={styles.aeroBarLabel}>{data.speed}</div>
                <div className={styles.aeroBarTrack}>
                  <div 
                    className={styles.aeroBarFill}
                    style={{ height: `${(data.downforce / maxDownforce) * 100}%` }}
                  />
                </div>
                <div className={styles.aeroBarValue}>{data.downforce} lbs</div>
              </div>
            ))}
          </div>
          
          <div className={styles.aeroStats}>
            <div className={styles.aeroStat}>
              <span className={styles.aeroStatValue}>{aeroData[4]?.downforce || 0}</span>
              <span className={styles.aeroStatLabel}>lbs @ 140mph</span>
            </div>
            <div className={styles.aeroStat}>
              <span className={styles.aeroStatValue}>{aeroData[4]?.dragHp || 0}</span>
              <span className={styles.aeroStatLabel}>hp drag loss</span>
            </div>
            <div className={styles.aeroStat}>
              <span className={styles.aeroStatValue}>
                {((aeroData[4]?.downforce || 0) / (weight || 3500) * 100).toFixed(1)}%
              </span>
              <span className={styles.aeroStatLabel}>of vehicle weight</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
