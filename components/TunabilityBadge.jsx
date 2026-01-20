'use client';

/**
 * Tunability Badge Component
 * 
 * Displays a car's tunability score with visual indicator.
 * Shows how moddable a car is and the aftermarket support available.
 * 
 * @module components/TunabilityBadge
 */

import { useMemo, useState } from 'react';
import styles from './TunabilityBadge.module.css';
import { calculateTunability, getTunabilityColor } from '@/lib/tunabilityCalculator';
import { Icons } from '@/components/ui/Icons';

/**
 * TunabilityBadge Component
 * 
 * @param {Object} props
 * @param {Object} props.car - Car object
 * @param {'compact'|'default'|'detailed'} [props.variant='default'] - Display variant
 * @param {boolean} [props.showTooltip=true] - Whether to show tooltip on hover
 * @param {string} [props.className] - Additional CSS class
 */
export default function TunabilityBadge({
  car,
  variant = 'default',
  showTooltip = true,
  className = '',
}) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  
  const tunability = useMemo(() => {
    return calculateTunability(car);
  }, [car]);

  const color = getTunabilityColor(tunability.score);

  if (variant === 'compact') {
    return (
      <span 
        className={`${styles.badgeCompact} ${className}`}
        style={{ '--tunability-color': color }}
        title={`Tunability: ${tunability.score}/10 - ${tunability.label}`}
      >
        <Icons.wrench size={12} />
        <span>{tunability.score.toFixed(1)}</span>
      </span>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`${styles.badgeDetailed} ${className}`} style={{ '--tunability-color': color }}>
        <div className={styles.detailedHeader}>
          <div className={styles.detailedIcon}>
            <Icons.wrench size={20} />
          </div>
          <div className={styles.detailedInfo}>
            <span className={styles.detailedLabel}>Tunability Score</span>
            <div className={styles.detailedScore}>
              <span className={styles.scoreNumber}>{tunability.score.toFixed(1)}</span>
              <span className={styles.scoreMax}>/10</span>
              <span className={styles.scoreLabel}>{tunability.label}</span>
            </div>
          </div>
        </div>
        
        <p className={styles.detailedDescription}>{tunability.description}</p>
        
        {tunability.factors && tunability.factors.length > 0 && (
          <div className={styles.factorsList}>
            <span className={styles.factorsTitle}>Factors:</span>
            {tunability.factors.map((factor, index) => (
              <div key={index} className={styles.factorItem}>
                <span className={styles.factorName}>{factor.factor}</span>
                <span 
                  className={styles.factorImpact}
                  data-positive={factor.impact.startsWith('+')}
                  data-negative={factor.impact.startsWith('-')}
                >
                  {factor.impact}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div 
      className={`${styles.badge} ${className}`}
      style={{ '--tunability-color': color }}
      onMouseEnter={() => showTooltip && setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
    >
      <div className={styles.badgeContent}>
        <Icons.wrench size={14} />
        <span className={styles.score}>{tunability.score.toFixed(1)}</span>
        <span className={styles.label}>{tunability.label}</span>
      </div>
      
      {showTooltip && isTooltipVisible && (
        <div className={styles.tooltip}>
          <div className={styles.tooltipHeader}>
            <strong>Tunability: {tunability.score.toFixed(1)}/10</strong>
            <span className={styles.tooltipLabel}>{tunability.label}</span>
          </div>
          <p className={styles.tooltipDescription}>{tunability.description}</p>
          {tunability.factors && tunability.factors.length > 0 && (
            <div className={styles.tooltipFactors}>
              {tunability.factors.slice(0, 3).map((factor, index) => (
                <span key={index} className={styles.tooltipFactor}>
                  {factor.factor}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Inline score display (just the number)
 */
export function TunabilityScore({ car, className = '' }) {
  const tunability = useMemo(() => calculateTunability(car), [car]);
  const color = getTunabilityColor(tunability.score);

  return (
    <span 
      className={`${styles.inlineScore} ${className}`}
      style={{ '--tunability-color': color }}
      title={`Tunability: ${tunability.label}`}
    >
      {tunability.score.toFixed(1)}
    </span>
  );
}

/**
 * Progress bar style display
 */
export function TunabilityBar({ car, showLabel = true, className = '' }) {
  const tunability = useMemo(() => calculateTunability(car), [car]);
  const color = getTunabilityColor(tunability.score);
  const percentage = (tunability.score / 10) * 100;

  return (
    <div className={`${styles.barContainer} ${className}`}>
      {showLabel && (
        <div className={styles.barHeader}>
          <span className={styles.barLabel}>
            <Icons.wrench size={14} />
            Tunability
          </span>
          <span className={styles.barValue} style={{ color }}>
            {tunability.score.toFixed(1)} - {tunability.label}
          </span>
        </div>
      )}
      <div className={styles.barTrack}>
        <div 
          className={styles.barFill}
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
