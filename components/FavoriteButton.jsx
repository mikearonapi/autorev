'use client';

/**
 * Favorite Button Component
 * 
 * A heart button to toggle favorite status on cars.
 * 
 * @module components/FavoriteButton
 */

import { useFavorites, useIsFavorite } from '@/components/providers/FavoritesProvider';
import styles from './FavoriteButton.module.css';

// Heart icons
const Icons = {
  heartOutline: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  heartFilled: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
};

/**
 * Favorite Button Component
 * 
 * @param {Object} props
 * @param {Object} props.car - Car object with at least slug and name
 * @param {'icon'|'button'|'compact'} [props.variant='icon'] - Display variant
 * @param {number} [props.size=20] - Icon size
 * @param {string} [props.className] - Additional CSS class
 * @param {function} [props.onClick] - Additional click handler
 */
export default function FavoriteButton({
  car,
  variant = 'icon',
  size = 20,
  className = '',
  onClick,
}) {
  const { toggleFavorite, isHydrated } = useFavorites();
  const isFavorited = useIsFavorite(car?.slug);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!car?.slug) return;
    
    toggleFavorite(car);
    onClick?.(e);
  };

  // Don't render until hydrated to prevent mismatch
  if (!isHydrated) {
    return null;
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleClick}
        className={`${styles.button} ${isFavorited ? styles.favorited : ''} ${className}`}
        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isFavorited ? <Icons.heartFilled size={size} /> : <Icons.heartOutline size={size} />}
        <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleClick}
        className={`${styles.compact} ${isFavorited ? styles.favorited : ''} ${className}`}
        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isFavorited ? <Icons.heartFilled size={size - 4} /> : <Icons.heartOutline size={size - 4} />}
      </button>
    );
  }

  // Default: icon variant
  return (
    <button
      onClick={handleClick}
      className={`${styles.icon} ${isFavorited ? styles.favorited : ''} ${className}`}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      title={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
    >
      {isFavorited ? <Icons.heartFilled size={size} /> : <Icons.heartOutline size={size} />}
    </button>
  );
}

/**
 * Favorite count badge
 */
export function FavoriteCountBadge({ className = '' }) {
  const { count, isHydrated } = useFavorites();

  if (!isHydrated || count === 0) {
    return null;
  }

  return (
    <span className={`${styles.countBadge} ${className}`}>
      {count}
    </span>
  );
}
