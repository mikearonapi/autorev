'use client';

/**
 * Compare Button Component
 * 
 * Button to add/remove cars from the comparison list.
 * 
 * @module components/CompareButton
 */

import { useCompare, useIsInCompare } from '@/components/providers/CompareProvider';
import styles from './CompareButton.module.css';

// Icons
const Icons = {
  compareOutline: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  check: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

/**
 * Compare Button Component
 * 
 * @param {Object} props
 * @param {Object} props.car - Car object
 * @param {'icon'|'button'|'compact'} [props.variant='icon'] - Display variant
 * @param {number} [props.size=20] - Icon size
 * @param {string} [props.className] - Additional CSS class
 */
export default function CompareButton({
  car,
  variant = 'icon',
  size = 20,
  className = '',
}) {
  const { toggleCompare, isFull, isHydrated } = useCompare();
  const isInCompare = useIsInCompare(car?.slug);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!car?.slug) return;
    if (!isInCompare && isFull) return; // Don't add if full
    
    toggleCompare(car);
  };

  if (!isHydrated) {
    return null;
  }

  const isDisabled = !isInCompare && isFull;

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        className={`${styles.button} ${isInCompare ? styles.inCompare : ''} ${isDisabled ? styles.disabled : ''} ${className}`}
        disabled={isDisabled}
        aria-label={isInCompare ? 'Remove from compare' : 'Add to compare'}
        title={isDisabled ? 'Compare list is full (max 4)' : isInCompare ? 'Remove from compare' : 'Add to compare'}
      >
        {isInCompare ? <Icons.check size={size} /> : <Icons.compareOutline size={size} />}
        <span>{isInCompare ? 'In Compare' : 'Compare'}</span>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={`${styles.compact} ${isInCompare ? styles.inCompare : ''} ${isDisabled ? styles.disabled : ''} ${className}`}
        disabled={isDisabled}
        aria-label={isInCompare ? 'Remove from compare' : 'Add to compare'}
        title={isDisabled ? 'Compare list is full' : isInCompare ? 'Remove from compare' : 'Add to compare'}
      >
        {isInCompare ? <Icons.check size={size - 4} /> : <Icons.compareOutline size={size - 4} />}
      </button>
    );
  }

  // Default: icon variant
  return (
    <button
      onClick={handleClick}
      className={`${styles.icon} ${isInCompare ? styles.inCompare : ''} ${isDisabled ? styles.disabled : ''} ${className}`}
      disabled={isDisabled}
      aria-label={isInCompare ? 'Remove from compare' : 'Add to compare'}
      title={isDisabled ? 'Compare list full (max 4)' : isInCompare ? 'Remove from compare list' : 'Add to compare list'}
    >
      {isInCompare ? <Icons.check size={size} /> : <Icons.compareOutline size={size} />}
    </button>
  );
}

/**
 * Compare count badge with link to compare page
 */
export function CompareCountBadge({ className = '' }) {
  const { count, isHydrated } = useCompare();

  if (!isHydrated || count === 0) {
    return null;
  }

  return (
    <span className={`${styles.countBadge} ${className}`}>
      {count}
    </span>
  );
}
