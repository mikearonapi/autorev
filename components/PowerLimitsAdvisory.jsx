'use client';

/**
 * Power Limits Advisory - Shows component limits from database
 * 
 * CONFIDENCE: This is community-reported data, NOT OEM engineering specs.
 * Should be treated as rough estimates based on enthusiast experience.
 */

import React from 'react';
import styles from './PowerLimitsAdvisory.module.css';

// Icons
const AlertTriangleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/>
    <path d="M12 17h.01"/>
  </svg>
);

const InfoIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
  </svg>
);

export default function PowerLimitsAdvisory({ powerLimits, currentHp }) {
  if (!powerLimits || Object.keys(powerLimits).length === 0) return null;
  
  // Sort limits by value ascending (weakest first)
  const sortedLimits = Object.entries(powerLimits)
    .filter(([_, value]) => typeof value === 'number')
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5);
  
  if (sortedLimits.length === 0) return null;
  
  // User-friendly labels for component limits
  const limitLabels = {
    // Drivetrain
    stock_transmission: 'Transmission',
    stock_transmission_tq: 'Transmission',
    stock_dsg: 'DSG Gearbox',
    stock_dsg_tq: 'DSG Gearbox',
    stock_clutch: 'Clutch',
    stock_clutch_tq: 'Clutch',
    stock_driveshaft: 'Driveshaft',
    stock_driveshaft_tq: 'Driveshaft',
    stock_axles: 'Axles (CV Shafts)',
    stock_axles_tq: 'Axles (CV Shafts)',
    stock_differential: 'Differential',
    stock_differential_tq: 'Differential',
    // Engine internals
    stock_internals: 'Engine Internals',
    stock_internals_hp: 'Engine Internals',
    stock_internals_whp: 'Engine Internals',
    stock_rods: 'Connecting Rods',
    stock_rods_hp: 'Connecting Rods',
    stock_pistons: 'Pistons',
    stock_pistons_hp: 'Pistons',
    stock_head_gasket: 'Head Gasket',
    stock_valvetrain: 'Valvetrain',
    stock_block: 'Engine Block',
    block: 'Engine Block',
    internals: 'Engine Internals',
    // Forced induction
    stock_turbo: 'Stock Turbo',
    stock_turbo_whp: 'Stock Turbo',
    is38_turbo: 'IS38 Turbo',
    // Fuel system
    stock_fuel_system: 'Fuel System',
    stock_fuel_system_hp: 'Fuel System',
    stock_injectors: 'Fuel Injectors',
    stock_fuel_pump: 'Fuel Pump',
  };
  
  // Get clean label for a key
  const getLabel = (key) => {
    if (limitLabels[key]) return limitLabels[key];
    // Fallback: clean up key for display
    return key
      .replace(/^stock_/, '')
      .replace(/_(hp|tq|whp)$/, '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };
  
  return (
    <div className={styles.powerLimits}>
      <div className={styles.powerLimitsHeader}>
        <AlertTriangleIcon size={16} />
        <span>Estimated Component Limits</span>
        <span className={styles.powerLimitsDisclaimer}>Community estimates</span>
      </div>
      
      <div className={styles.powerLimitsList}>
        {sortedLimits.map(([key, limit]) => {
          const isAtRisk = currentHp >= limit * 0.9;
          const isOverLimit = currentHp >= limit;
          
          return (
            <div 
              key={key} 
              className={`${styles.powerLimitItem} ${isOverLimit ? styles.overLimit : isAtRisk ? styles.atRisk : ''}`}
            >
              <span className={styles.powerLimitLabel}>
                {getLabel(key)}
              </span>
              <div className={styles.powerLimitBar}>
                <div 
                  className={styles.powerLimitFill}
                  style={{ width: `${Math.min(100, (currentHp / limit) * 100)}%` }}
                />
              </div>
              <span className={styles.powerLimitValue}>
                ~{limit} hp
                {isOverLimit && <AlertTriangleIcon size={12} />}
              </span>
            </div>
          );
        })}
      </div>
      
      <div className={styles.powerLimitsFooter}>
        <InfoIcon size={12} />
        Based on community reports. Actual limits vary by driving style, tune quality, and supporting mods.
      </div>
    </div>
  );
}
