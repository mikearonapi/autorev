'use client';

/**
 * TimeRangeToggle Component
 * 
 * Segmented control for selecting dashboard time ranges.
 * Follows the design system from data-visualization-ui-ux.mdc
 */

import styles from './TimeRangeToggle.module.css';

const TIME_RANGES = [
  { key: 'day', label: 'Today' },
  { key: 'week', label: '7 Days' },
  { key: 'month', label: '30 Days' },
  { key: 'all', label: 'All Time' },
];

export function TimeRangeToggle({ value, onChange, disabled = false }) {
  return (
    <div className={styles.container}>
      <div className={styles.toggle} role="radiogroup" aria-label="Time range selection">
        {TIME_RANGES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value === key}
            className={`${styles.option} ${value === key ? styles.active : ''}`}
            onClick={() => onChange(key)}
            disabled={disabled}
          >
            {label}
          </button>
        ))}
        <div 
          className={styles.indicator}
          style={{
            transform: `translateX(${TIME_RANGES.findIndex(r => r.key === value) * 100}%)`,
          }}
        />
      </div>
    </div>
  );
}

export default TimeRangeToggle;

