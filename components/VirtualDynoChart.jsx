'use client';

/**
 * Virtual Dyno Chart Component
 * 
 * Displays estimated HP/TQ curves based on modifications.
 * Uses physics model to generate RPM-based power curves.
 * 
 * Features:
 * - Shows BOTH HP and Torque curves
 * - Models turbo spool characteristics (big turbo = delayed torque peak)
 * - Simplified display: shows modified OR stock, not both
 * 
 * Note: All values are CRANK HP/TQ for consistency (database stores crank values)
 */

import React, { useMemo } from 'react';
import AskALButton from './AskALButton';
import InfoTooltip from './ui/InfoTooltip';
import styles from './VirtualDynoChart.module.css';

/**
 * Turbo spool characteristics for curve shifting
 * Big turbos = more lag, torque peak shifts right
 * Small turbos / superchargers = instant response
 */
const FORCED_INDUCTION_PROFILES = {
  // NA - standard curve shape
  'na': {
    torquePeakRatio: 0.70, // Torque peaks at 70% of HP peak RPM
    lowEndMultiplier: 1.0, // No low-end loss
    spoolDelay: 0, // No spool
  },
  // Stock turbo - mild curve shift
  'turbo-stock': {
    torquePeakRatio: 0.72,
    lowEndMultiplier: 0.85, // Slight low-end reduction vs NA
    spoolDelay: 0.1, // Minimal lag
  },
  // Upgraded turbo (bigger) - noticeable lag
  'turbo-upgraded': {
    torquePeakRatio: 0.78, // Torque peaks later
    lowEndMultiplier: 0.70, // Less low-end torque
    spoolDelay: 0.25, // More lag
  },
  // Big single turbo - significant lag, huge top-end
  'turbo-big-single': {
    torquePeakRatio: 0.85, // Torque peaks much later
    lowEndMultiplier: 0.50, // Much less low-end
    spoolDelay: 0.40, // Significant lag
  },
  // Twin turbo - better response than single
  'turbo-twin': {
    torquePeakRatio: 0.75,
    lowEndMultiplier: 0.80,
    spoolDelay: 0.15,
  },
  // Supercharger - instant response
  'supercharged': {
    torquePeakRatio: 0.60, // Early torque peak
    lowEndMultiplier: 1.1, // Better low-end than NA
    spoolDelay: 0,
  },
  // Centrifugal supercharger - builds with RPM
  'supercharged-centrifugal': {
    torquePeakRatio: 0.80, // Later peak like turbo
    lowEndMultiplier: 0.90,
    spoolDelay: 0,
  },
};

/**
 * Detect forced induction profile from car/build data
 */
function detectForcedInductionProfile(car, selectedUpgrades = []) {
  const engine = (car?.engine || '').toLowerCase();
  const upgradeKeys = selectedUpgrades.map(u => typeof u === 'string' ? u : u.key).join(' ');
  
  // Check for big turbo upgrades first
  if (upgradeKeys.includes('turbo-kit-single') || upgradeKeys.includes('turbo-big')) {
    return 'turbo-big-single';
  }
  if (upgradeKeys.includes('turbo-kit-twin')) {
    return 'turbo-twin';
  }
  if (upgradeKeys.includes('turbo-upgrade')) {
    return 'turbo-upgraded';
  }
  if (upgradeKeys.includes('supercharger-centrifugal')) {
    return 'supercharged-centrifugal';
  }
  if (upgradeKeys.includes('supercharger')) {
    return 'supercharged';
  }
  
  // Check base car engine
  if (engine.includes('twin turbo') || engine.includes('biturbo') || engine.includes(' tt')) {
    return 'turbo-twin';
  }
  if (engine.includes('turbo')) {
    return 'turbo-stock';
  }
  if (engine.includes('supercharged') || engine.includes(' sc')) {
    return 'supercharged';
  }
  
  return 'na';
}

export default function VirtualDynoChart({ 
  stockHp, 
  estimatedHp, 
  stockTorque, 
  estimatedTq, 
  peakRpm = 6500,
  compact = false,
  carName = null,
  carSlug = null,
  car = null, // Full car object for engine detection
  selectedUpgrades = [], // Selected upgrades for turbo detection
}) {
  // Guard against invalid values
  const safeStockHp = (typeof stockHp === 'number' && !isNaN(stockHp) && stockHp > 0) ? stockHp : 300;
  const safeEstimatedHp = (typeof estimatedHp === 'number' && !isNaN(estimatedHp) && estimatedHp > 0) ? estimatedHp : safeStockHp;
  const safeStockTq = (typeof stockTorque === 'number' && !isNaN(stockTorque) && stockTorque > 0) ? stockTorque : safeStockHp * 0.85;
  const safeEstimatedTq = (typeof estimatedTq === 'number' && !isNaN(estimatedTq) && estimatedTq > 0) ? estimatedTq : safeEstimatedHp * 0.88;
  
  // Determine if there are modifications
  const hasModifications = safeEstimatedHp > safeStockHp || selectedUpgrades.length > 0;
  
  // Detect forced induction profile for curve shaping
  const fiProfile = useMemo(() => {
    return detectForcedInductionProfile(car, selectedUpgrades);
  }, [car, selectedUpgrades]);
  
  const fiCharacteristics = FORCED_INDUCTION_PROFILES[fiProfile] || FORCED_INDUCTION_PROFILES['na'];
  
  /**
   * Generate dyno curve data points with forced induction modeling
   * 
   * Uses a realistic bell-curve approach for torque that:
   * - Starts low at idle
   * - Builds smoothly to peak torque RPM
   * - Falls off gradually after peak
   * - Models turbo spool delay for forced induction
   * 
   * @param {number} peakPower - Peak HP
   * @param {number} peakTq - Peak torque
   * @param {Object} fiChar - Forced induction characteristics
   */
  const generateCurve = useMemo(() => {
    return (peakPower, peakTq, fiChar) => {
      const points = [];
      const startRpm = 1000;
      const endRpm = 9000;
      const step = 250;
      
      // Torque peak RPM based on forced induction profile
      const torquePeakRpm = peakRpm * fiChar.torquePeakRatio;
      const spoolStartRpm = 2000 + (fiChar.spoolDelay * 3000); // Where boost starts building
      
      for (let rpm = startRpm; rpm <= endRpm; rpm += step) {
        // === HP CURVE ===
        // HP builds progressively with RPM, peaks at peakRpm, then falls off
        const rpmRatio = rpm / peakRpm;
        let powerFactor = rpmRatio < 1
          ? Math.pow(rpmRatio, 1.8)
          : 1 - Math.pow((rpmRatio - 1) * 2, 2) * 0.3;
        
        // Clamp power factor
        powerFactor = Math.max(0, Math.min(1, powerFactor));
        
        // === TORQUE CURVE with improved spool modeling ===
        // Torque uses a bell curve centered on torquePeakRpm
        let torqueFactor;
        
        // Calculate a smooth bell curve for base torque shape
        // Using Gaussian-like distribution centered on torque peak
        const torqueDeviation = (rpm - torquePeakRpm) / (torquePeakRpm * 0.6);
        const baseBellCurve = Math.exp(-0.5 * torqueDeviation * torqueDeviation);
        
        // Apply forced induction characteristics
        if (fiChar.spoolDelay > 0 && rpm < spoolStartRpm) {
          // Below spool threshold - reduced torque (turbo lag region)
          // Smooth ramp up to spool point
          const lagProgress = rpm / spoolStartRpm;
          const lagFactor = Math.pow(lagProgress, 1.2) * fiChar.lowEndMultiplier;
          // Blend lag factor with bell curve for smooth transition
          torqueFactor = lagFactor * baseBellCurve * 1.2; // Scale up slightly since bell curve is < 1 here
        } else if (rpm < torquePeakRpm) {
          // Building to peak - blend between spool behavior and peak
          // Calculate how far we are from spool to peak
          const buildProgress = fiChar.spoolDelay > 0 
            ? Math.max(0, (rpm - spoolStartRpm) / (torquePeakRpm - spoolStartRpm))
            : rpm / torquePeakRpm;
          
          // For NA/supercharged, use smooth ramp up
          // For turbo, transition from lag to full boost
          const lowEndBase = fiChar.lowEndMultiplier * Math.pow(buildProgress, 0.5);
          const peakApproach = Math.pow(buildProgress, 0.7);
          
          // Blend between low-end behavior and approaching peak
          torqueFactor = lowEndBase + (1 - lowEndBase) * peakApproach;
          
          // Apply bell curve for natural shape
          torqueFactor = Math.max(torqueFactor, baseBellCurve);
        } else {
          // At or past peak - use bell curve falloff
          torqueFactor = baseBellCurve;
          
          // Ensure we reach peak at torquePeakRpm
          if (Math.abs(rpm - torquePeakRpm) < step) {
            torqueFactor = 1.0;
          }
        }
        
        // Clamp torque factor to valid range
        torqueFactor = Math.max(0.1, Math.min(1, torqueFactor));
        
        points.push({
          rpm,
          hp: Math.max(0, Math.round(peakPower * powerFactor)),
          tq: Math.max(0, Math.round(peakTq * torqueFactor)),
        });
      }
      return points;
    };
  }, [peakRpm]);

  // Generate curves - only the one we'll display
  const displayCurve = useMemo(() => {
    if (hasModifications) {
      return generateCurve(safeEstimatedHp, safeEstimatedTq, fiCharacteristics);
    } else {
      // Stock curve uses NA characteristics (or stock turbo if applicable)
      const stockFiProfile = detectForcedInductionProfile(car, []);
      const stockFiChar = FORCED_INDUCTION_PROFILES[stockFiProfile] || FORCED_INDUCTION_PROFILES['na'];
      return generateCurve(safeStockHp, safeStockTq, stockFiChar);
    }
  }, [hasModifications, safeEstimatedHp, safeEstimatedTq, safeStockHp, safeStockTq, fiCharacteristics, generateCurve, car]);
  
  // Find peak values from the curve
  const peakHpPoint = useMemo(() => {
    return displayCurve.reduce((max, p) => p.hp > max.hp ? p : max, displayCurve[0]);
  }, [displayCurve]);
  
  const peakTqPoint = useMemo(() => {
    return displayCurve.reduce((max, p) => p.tq > max.tq ? p : max, displayCurve[0]);
  }, [displayCurve]);
  
  // Max values for scaling (use higher of HP or TQ for Y axis)
  const displayHp = hasModifications ? safeEstimatedHp : safeStockHp;
  const displayTq = hasModifications ? safeEstimatedTq : safeStockTq;
  const maxValue = Math.max(displayHp, displayTq) * 1.15;
  
  // HP gain (only shown if modified)
  const hpGain = safeEstimatedHp - safeStockHp;
  const tqGain = safeEstimatedTq - safeStockTq;

  // Build contextual prompt for AL
  const alPrompt = carName 
    ? `Explain my ${carName}'s dyno curve. ${hasModifications ? `I've gained ${hpGain} HP (${safeStockHp}→${safeEstimatedHp}) and ${Math.round(tqGain)} lb-ft torque. The torque curve ${fiProfile.includes('turbo-big') ? 'peaks later due to my big turbo - I lose some low-end response but gain massive top-end power' : fiProfile.includes('turbo') ? 'shows typical turbo characteristics' : fiProfile.includes('supercharged') ? 'shows great low-end response from my supercharger' : 'shows a balanced NA power delivery'}.` : `It's currently stock at ${safeStockHp} HP and ${Math.round(safeStockTq)} lb-ft.`} What does the power curve tell me about how my car delivers power? Where is the powerband and how can I optimize my driving for it?`
    : `Explain this dyno curve showing ${displayHp} HP and ${Math.round(displayTq)} lb-ft. What does the curve shape tell me about power delivery?`;
  
  const alDisplayMessage = hasModifications 
    ? `Explain my dyno curve (+${hpGain} HP)`
    : 'Explain my power curve';

  // Get FI profile description for display
  const getProfileDescription = () => {
    if (!hasModifications) return null;
    switch (fiProfile) {
      case 'turbo-big-single':
        return 'Big turbo: Spools late, massive top-end';
      case 'turbo-upgraded':
        return 'Upgraded turbo: More power, slight lag increase';
      case 'turbo-twin':
        return 'Twin turbo: Fast spool, big power';
      case 'supercharged':
        return 'Supercharged: Instant response';
      case 'supercharged-centrifugal':
        return 'Centrifugal SC: Builds with RPM';
      default:
        return null;
    }
  };
  
  const profileDescription = getProfileDescription();

  return (
    <div className={`${styles.virtualDyno} ${compact ? styles.compact : ''}`}>
      {/* Header */}
      <div className={styles.dynoHeader}>
        <div className={styles.dynoTitleSection}>
          <span className={styles.dynoTitle}>Virtual Dyno</span>
          <span className={styles.dynoSubtitle}>
            {hasModifications 
              ? 'Estimated power curves based on your modifications'
              : 'Stock power curves for your vehicle'
            }
          </span>
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
            hpGain: hpGain,
            fiProfile,
          }}
        />
      </div>
      
      {/* Profile description for turbo builds */}
      {profileDescription && (
        <div className={styles.dynoProfileNote}>
          <span className={styles.dynoProfileIcon}>⚡</span>
          <span>{profileDescription}</span>
        </div>
      )}
      
      {/* Legend - HP and TQ */}
      <div className={styles.dynoLegend}>
        <span className={styles.dynoLegendItem}>
          <span className={styles.dynoLegendLine} style={{ background: '#10b981' }} />
          <InfoTooltip topicKey="hp" carName={carName} carSlug={carSlug}>
            <span>HP: {Math.round(displayHp)}</span>
          </InfoTooltip>
        </span>
        <span className={styles.dynoLegendItem}>
          <span className={styles.dynoLegendLine} style={{ background: '#3b82f6', borderStyle: 'dashed' }} />
          <InfoTooltip topicKey="torque" carName={carName} carSlug={carSlug}>
            <span>TQ: {Math.round(displayTq)} lb-ft</span>
          </InfoTooltip>
        </span>
        {hasModifications && hpGain > 0 && (
          <span className={styles.dynoLegendGain}>
            +{hpGain} HP / +{Math.round(tqGain)} TQ
          </span>
        )}
      </div>

      {/* Chart Area */}
      <div className={styles.dynoChart}>
        {/* Y-Axis Labels */}
        <div className={styles.dynoYAxis}>
          <span>{Math.round(maxValue)}</span>
          <span>{Math.round(maxValue * 0.75)}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>{Math.round(maxValue * 0.25)}</span>
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
          
          {/* Area fill under HP curve */}
          <svg className={styles.dynoCurveSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="hpGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="tqGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {/* HP area fill */}
            <path
              d={
                displayCurve.map((p, i) => {
                  const x = ((p.rpm - 1000) / 8000) * 100;
                  const y = 100 - (p.hp / maxValue) * 100;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ') + ' L 100 100 L 0 100 Z'
              }
              fill="url(#hpGradient)"
            />
          </svg>
          
          {/* Torque curve (dashed, blue) */}
          <svg className={styles.dynoCurveSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d={displayCurve.map((p, i) => {
                const x = ((p.rpm - 1000) / 8000) * 100;
                const y = 100 - (p.tq / maxValue) * 100;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />
          </svg>
          
          {/* HP curve (solid, teal) */}
          <svg className={styles.dynoCurveSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d={displayCurve.map((p, i) => {
                const x = ((p.rpm - 1000) / 8000) * 100;
                const y = 100 - (p.hp / maxValue) * 100;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            />
          </svg>
          
          {/* HP peak marker */}
          <div
            className={styles.dynoPeakMarkerMod}
            style={{
              left: `${((peakHpPoint.rpm - 1000) / 8000) * 100}%`,
              bottom: `${(peakHpPoint.hp / maxValue) * 100}%`
            }}
          >
            <span className={styles.dynoPeakValueMod}>{peakHpPoint.hp}</span>
            <InfoTooltip topicKey="hp" carName={carName} carSlug={carSlug}>
              <span className={styles.dynoPeakLabelMod}>HP</span>
            </InfoTooltip>
          </div>
          
          {/* TQ peak marker */}
          <div
            className={styles.dynoPeakMarkerTq}
            style={{
              left: `${((peakTqPoint.rpm - 1000) / 8000) * 100}%`,
              bottom: `${(peakTqPoint.tq / maxValue) * 100}%`
            }}
          >
            <span className={styles.dynoPeakValueTq}>{peakTqPoint.tq}</span>
            <InfoTooltip topicKey="torque" carName={carName} carSlug={carSlug}>
              <span className={styles.dynoPeakLabelTq}>TQ</span>
            </InfoTooltip>
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
