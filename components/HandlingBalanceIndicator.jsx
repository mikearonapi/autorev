'use client';

/**
 * Handling Balance Indicator - Shows understeer/oversteer tendency
 * Based on suspension, aero, tires, and drivetrain configuration
 */

import React from 'react';
import styles from './HandlingBalanceIndicator.module.css';

// Icons
const TargetIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const InfoIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 16v-4"/>
    <path d="M12 8h.01"/>
  </svg>
);

const CheckIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export default function HandlingBalanceIndicator({ suspensionSetup, aeroSetup, tireCompound, drivetrain }) {
  // Calculate handling balance based on setup
  const calculateBalance = () => {
    let balance = 0; // -100 = understeer, +100 = oversteer, 0 = neutral
    
    // Drivetrain base tendency
    const drivetrainEffect = { 'FWD': -20, 'RWD': 15, 'AWD': -5 }[drivetrain] || 0;
    balance += drivetrainEffect;
    
    // Sway bar balance
    if (suspensionSetup?.swayBarFront === 'adjustable' && suspensionSetup?.swayBarRear !== 'adjustable') {
      balance -= 10; // Stiffer front = understeer
    }
    if (suspensionSetup?.swayBarRear === 'adjustable' && suspensionSetup?.swayBarFront !== 'adjustable') {
      balance += 10; // Stiffer rear = oversteer
    }
    if (suspensionSetup?.swayBarRear === 'removed') {
      balance -= 15; // No rear sway = understeer
    }
    
    // Aero balance
    if (aeroSetup?.rearWing?.includes('gt-wing')) {
      balance -= 8; // Rear downforce = understeer at high speed
    }
    if (aeroSetup?.frontSplitter === 'splitter-rods') {
      balance += 5; // Front downforce = more rotation
    }
    
    // Alignment
    const alignmentEffect = {
      'stock': 0, 'street': -5, 'aggressive': -10, 'track': -15
    }[suspensionSetup?.alignment] || 0;
    balance += alignmentEffect;
    
    return Math.max(-100, Math.min(100, balance));
  };
  
  const balance = calculateBalance();
  const balanceLabel = balance < -30 ? 'Understeer' : balance > 30 ? 'Oversteer' : 'Neutral';
  const balanceColor = Math.abs(balance) < 30 ? '#10b981' : Math.abs(balance) < 60 ? '#f59e0b' : '#ef4444';
  
  return (
    <div className={styles.handlingBalance}>
      <div className={styles.handlingBalanceHeader}>
        <TargetIcon size={16} />
        <span>Handling Balance</span>
        <span className={styles.handlingBalanceLabel} style={{ color: balanceColor }}>
          {balanceLabel}
        </span>
      </div>
      
      <div className={styles.balanceTrack}>
        <span className={styles.balanceEndLabel}>Understeer</span>
        <div className={styles.balanceBar}>
          <div 
            className={styles.balanceIndicator}
            style={{ 
              left: `${50 + (balance / 2)}%`,
              backgroundColor: balanceColor 
            }}
          />
          <div className={styles.balanceCenter} />
        </div>
        <span className={styles.balanceEndLabel}>Oversteer</span>
      </div>
      
      <div className={styles.balanceTips}>
        {balance < -40 && (
          <span><InfoIcon size={12} /> Stiffen rear sway bar or soften front to reduce understeer</span>
        )}
        {balance > 40 && (
          <span><InfoIcon size={12} /> Stiffen front sway bar or add rear aero to reduce oversteer</span>
        )}
        {Math.abs(balance) <= 40 && (
          <span><CheckIcon size={12} /> Well-balanced setup for spirited driving</span>
        )}
      </div>
    </div>
  );
}
