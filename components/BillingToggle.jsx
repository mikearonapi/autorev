'use client';

/**
 * BillingToggle Component
 * 
 * A toggle switch for selecting between monthly and annual billing.
 * Displays savings badge for annual option.
 * 
 * @module components/BillingToggle
 * 
 * @example
 * <BillingToggle
 *   interval={interval}
 *   onChange={setInterval}
 *   savingsPercent={50}
 * />
 */

import React from 'react';

import styles from './BillingToggle.module.css';

/**
 * BillingToggle props
 * @typedef {Object} BillingToggleProps
 * @property {'month'|'year'} interval - Current selected interval
 * @property {Function} onChange - Callback when interval changes
 * @property {number} [savingsPercent] - Percentage savings for annual (default: 50)
 * @property {boolean} [disabled] - Whether toggle is disabled
 * @property {'default'|'compact'} [variant] - Visual variant
 */

/**
 * BillingToggle component
 * @param {BillingToggleProps} props
 */
export default function BillingToggle({
  interval,
  onChange,
  savingsPercent = 50,
  disabled = false,
  variant = 'default',
}) {
  const isAnnual = interval === 'year';

  const handleToggle = () => {
    if (disabled) return;
    onChange(isAnnual ? 'month' : 'year');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  if (variant === 'compact') {
    return (
      <div className={styles.compactContainer}>
        <button
          type="button"
          className={`${styles.compactOption} ${!isAnnual ? styles.compactActive : ''}`}
          onClick={() => onChange('month')}
          disabled={disabled}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`${styles.compactOption} ${isAnnual ? styles.compactActive : ''}`}
          onClick={() => onChange('year')}
          disabled={disabled}
        >
          Annual
          {savingsPercent > 0 && (
            <span className={styles.compactBadge}>-{savingsPercent}%</span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <span 
        className={`${styles.label} ${!isAnnual ? styles.labelActive : ''}`}
        onClick={() => !disabled && onChange('month')}
      >
        Monthly
      </span>

      <div
        className={`${styles.toggle} ${isAnnual ? styles.toggleActive : ''} ${disabled ? styles.disabled : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="switch"
        aria-checked={isAnnual}
        aria-label="Toggle between monthly and annual billing"
        tabIndex={disabled ? -1 : 0}
      >
        <div className={styles.toggleTrack}>
          <div className={styles.toggleThumb} />
        </div>
      </div>

      <span 
        className={`${styles.label} ${isAnnual ? styles.labelActive : ''}`}
        onClick={() => !disabled && onChange('year')}
      >
        Annual
        {savingsPercent > 0 && (
          <span className={styles.savingsBadge}>
            Save {savingsPercent}%
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * Inline BillingToggle for use in pricing cards
 * Shows as pill-shaped selector
 */
export function BillingTogglePill({
  interval,
  onChange,
  savingsPercent = 50,
  disabled = false,
}) {
  const isAnnual = interval === 'year';

  return (
    <div className={styles.pillContainer}>
      <button
        type="button"
        className={`${styles.pillOption} ${!isAnnual ? styles.pillActive : ''}`}
        onClick={() => onChange('month')}
        disabled={disabled}
        aria-pressed={!isAnnual}
      >
        Monthly
      </button>
      <button
        type="button"
        className={`${styles.pillOption} ${isAnnual ? styles.pillActive : ''}`}
        onClick={() => onChange('year')}
        disabled={disabled}
        aria-pressed={isAnnual}
      >
        Yearly
        {savingsPercent > 0 && (
          <span className={styles.pillBadge}>-{savingsPercent}%</span>
        )}
      </button>
    </div>
  );
}
