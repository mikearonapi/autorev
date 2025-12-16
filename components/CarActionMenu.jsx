'use client';

/**
 * CarActionMenu Component
 * 
 * Universal action menu for any car, providing consistent actions:
 * 1. Add to Collection (I Own This)
 * 2. Add to Favorites (Wishlist)
 * 3. Modify the Car (Tuning Shop)
 * 4. Compare the Car (Comparison Tool)
 * 5. See Car Profile (Details)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './CarActionMenu.module.css';
import { useFavorites } from './providers/FavoritesProvider';
import { useOwnedVehicles } from './providers/OwnedVehiclesProvider';
import { useCompare } from './providers/CompareProvider';

// Icons - Premium Lucide-style SVGs
const Icons = {
  car: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  heart: ({ size = 20, filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  ),
  compare: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10"/>
      <path d="M12 20V4"/>
      <path d="M6 20v-6"/>
    </svg>
  ),
  wrench: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  check: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  moreVertical: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/>
      <circle cx="12" cy="5" r="1"/>
      <circle cx="12" cy="19" r="1"/>
    </svg>
  ),
  eye: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  arrowRight: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/>
      <path d="m12 5 7 7-7 7"/>
    </svg>
  ),
  spinner: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  )
};

/**
 * Utility to extract make/model from car name
 */
function extractMakeModel(car) {
  let make = '';
  let model = car.name;

  // Use brand if available
  if (car.brand) {
    make = car.brand;
    model = car.name.replace(car.brand, '').trim();
  } else if (car.name.startsWith('718') || car.name.startsWith('911') || 
             car.name.startsWith('981') || car.name.startsWith('997') || 
             car.name.startsWith('987') || car.name.startsWith('991') || 
             car.name.startsWith('992')) {
    make = 'Porsche';
  } else {
    const parts = car.name.split(' ');
    make = parts[0];
    model = parts.slice(1).join(' ');
  }

  return { make, model };
}

/**
 * CarActionMenu - Inline button group variant
 * @param {Object} car - Car data object with slug, name, etc.
 * @param {string} variant - 'inline' (default), 'compact', or 'dropdown'
 * @param {boolean} showLabels - Whether to show text labels
 * @param {string} className - Additional CSS class
 * @param {string} theme - 'auto' | 'light' | 'dark'
 * @param {Function} onAction - Callback when an action is triggered
 * @param {Array} hideActions - Array of action names to hide: 'own', 'favorite', 'compare', 'mod', 'profile'
 */
export default function CarActionMenu({ 
  car, 
  variant = 'inline', 
  showLabels = false,
  className = '',
  theme = 'auto',
  onAction,
  hideActions = [],
}) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // Safe hooks usage (in case providers aren't wrapped)
  let favorites = [], addFavorite = () => {}, removeFavorite = () => {}, isFavorite = () => false;
  let vehicles = [], addVehicle = async () => {};
  let compareList = [], toggleCompare = () => {}, isCompareFull = false, isInCompare = () => false;

  try {
    const favUtils = useFavorites();
    favorites = favUtils.favorites;
    addFavorite = favUtils.addFavorite;
    removeFavorite = favUtils.removeFavorite;
    isFavorite = favUtils.isFavorite;
  } catch (e) { /* Provider missing */ }

  try {
    const vehicleUtils = useOwnedVehicles();
    vehicles = vehicleUtils.vehicles;
    addVehicle = vehicleUtils.addVehicle;
  } catch (e) { /* Provider missing */ }

  try {
    const compareUtils = useCompare();
    compareList = compareUtils.cars;
    toggleCompare = compareUtils.toggleCompare;
    isCompareFull = compareUtils.isFull;
    isInCompare = compareUtils.isInCompare;
  } catch (e) { /* Provider missing */ }

  if (!car) return null;

  // Check states
  const isOwned = vehicles?.some(v => v.matchedCarSlug === car.slug);
  const isFav = isFavorite(car.slug);
  const isComparing = isInCompare(car.slug);
  const canCompare = !isCompareFull || isComparing;

  // Handle adding to collection (ownership)
  const handleAddToCollection = async (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    
    if (isOwned || isAdding) return;
    
    setIsAdding(true);
    try {
      const yearMatch = car.years?.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      const { make, model } = extractMakeModel(car);

      await addVehicle({
        year,
        make,
        model,
        matchedCarSlug: car.slug,
      });

      // Auto-remove from favorites when promoted to owned
      if (isFav) {
        removeFavorite(car.slug);
      }

      onAction?.('added-to-collection', car);
    } catch (err) {
      console.error('[CarActionMenu] Error adding to collection:', err);
    } finally {
      setIsAdding(false);
    }
  };

  // Handle favorite toggle
  const handleToggleFavorite = (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    
    if (isFav) {
      removeFavorite(car.slug);
      onAction?.('removed-favorite', car);
    } else {
      addFavorite(car);
      onAction?.('added-favorite', car);
    }
  };

  // Handle compare toggle
  const handleToggleCompare = (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    
    if (canCompare || isComparing) {
      toggleCompare(car);
      onAction?.(isComparing ? 'removed-compare' : 'added-compare', car);
    }
  };

  // Handle mod - go to tuning shop
  const handleMod = (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    
    router.push(`/tuning-shop?plan=${car.slug}`);
    onAction?.('mod', car);
  };

  // Handle View Profile
  const handleViewProfile = (e) => {
    e?.stopPropagation?.();
    // For button elements, navigate programmatically
    // Link elements will handle navigation themselves
    const isLink = e?.currentTarget?.tagName === 'A' || e?.target?.closest('a');
    if (!isLink) {
      e?.preventDefault?.();
      router.push(`/browse-cars/${car.slug}`);
    }
    onAction?.('view-profile', car);
  };

  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div 
        className={`${styles.container} ${styles.dropdownWrapper} ${className}`}
        data-theme={theme !== 'auto' ? theme : undefined}
      >
        <button 
          className={styles.dropdownTrigger}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsDropdownOpen(!isDropdownOpen);
          }}
          aria-label="Car actions"
        >
          <Icons.moreVertical size={18} />
        </button>
        
        {isDropdownOpen && (
          <>
            <div 
              className={styles.dropdownBackdrop} 
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(false);
              }}
            />
            <div className={styles.dropdownMenu}>
              <button 
                className={`${styles.dropdownItem} ${isOwned ? styles.active : ''}`}
                onClick={(e) => {
                  handleAddToCollection(e);
                  setIsDropdownOpen(false);
                }}
                disabled={isOwned}
              >
                {isOwned ? <Icons.check size={16} /> : <Icons.car size={16} />}
                <span>{isOwned ? 'In My Collection' : 'Add to Collection'}</span>
              </button>
              
              <button 
                className={`${styles.dropdownItem} ${isFav ? styles.active : ''}`}
                onClick={(e) => {
                  handleToggleFavorite(e);
                  setIsDropdownOpen(false);
                }}
              >
                <Icons.heart size={16} filled={isFav} />
                <span>{isFav ? 'Remove from Favorites' : 'Add to Favorites'}</span>
              </button>
              
              <button 
                className={`${styles.dropdownItem} ${isComparing ? styles.active : ''}`}
                onClick={(e) => {
                  handleToggleCompare(e);
                  setIsDropdownOpen(false);
                }}
                disabled={!canCompare && !isComparing}
              >
                <Icons.compare size={16} />
                <span>{isComparing ? 'Remove from Compare' : 'Add to Compare'}</span>
              </button>
              
              <div className={styles.dropdownDivider} />
              
              <button 
                className={styles.dropdownItem}
                onClick={(e) => {
                  handleMod(e);
                  setIsDropdownOpen(false);
                }}
              >
                <Icons.wrench size={16} />
                <span>Mod This Car</span>
              </button>

              <Link 
                href={`/browse-cars/${car.slug}`}
                className={styles.dropdownItem}
                onClick={(e) => {
                  setIsDropdownOpen(false);
                  onAction?.('view-profile', car);
                }}
              >
                <Icons.eye size={16} />
                <span>View Profile</span>
              </Link>
            </div>
          </>
        )}
      </div>
    );
  }

  // Compact variant - smaller icons, no labels
  if (variant === 'compact') {
    return (
      <div 
        className={`${styles.container} ${styles.compactMenu} ${className}`}
        data-theme={theme !== 'auto' ? theme : undefined}
      >
        {!hideActions.includes('own') && (
          <div className={styles.tooltipWrapper}>
            <button 
              className={`${styles.compactBtn} ${isOwned ? styles.active : ''} ${isAdding ? styles.loading : ''}`}
              onClick={handleAddToCollection}
              disabled={isOwned || isAdding}
              aria-label={isOwned ? 'Owned' : 'Add to Collection'}
            >
              {isAdding ? <Icons.spinner size={14} /> : isOwned ? <Icons.check size={14} /> : <Icons.car size={14} />}
              <span className={styles.tooltip}>{isAdding ? 'Adding...' : isOwned ? 'In Your Collection' : 'Add to My Collection'}</span>
            </button>
          </div>
        )}
        
        {!hideActions.includes('favorite') && (
          <div className={styles.tooltipWrapper}>
            <button 
              className={`${styles.compactBtn} ${isFav ? styles.activeFavorite : ''}`}
              onClick={handleToggleFavorite}
              aria-label={isFav ? 'Unfavorite' : 'Favorite'}
            >
              <Icons.heart size={14} filled={isFav} />
              <span className={styles.tooltip}>{isFav ? 'Remove Favorite' : 'Add to Favorites'}</span>
            </button>
          </div>
        )}
        
        {!hideActions.includes('compare') && (
          <div className={styles.tooltipWrapper}>
            <button 
              className={`${styles.compactBtn} ${isComparing ? styles.active : ''}`}
              onClick={handleToggleCompare}
              disabled={!canCompare && !isComparing}
              aria-label={isComparing ? 'Remove Compare' : 'Compare'}
            >
              <Icons.compare size={14} />
              <span className={styles.tooltip}>{isComparing ? 'Remove Compare' : 'Compare Car'}</span>
            </button>
          </div>
        )}
        
        {!hideActions.includes('mod') && (
          <div className={styles.tooltipWrapper}>
            <button 
              className={styles.compactBtn}
              onClick={handleMod}
              aria-label="Mod Shop"
            >
              <Icons.wrench size={14} />
              <span className={styles.tooltip}>Mod This Car</span>
            </button>
          </div>
        )}

        {!hideActions.includes('profile') && (
          <div className={styles.tooltipWrapper}>
            <Link href={`/browse-cars/${car.slug}`} className={styles.compactBtn} aria-label="View Profile">
              <Icons.eye size={14} />
              <span className={styles.tooltip}>View Profile</span>
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Default inline variant
  return (
    <div 
      className={`${styles.container} ${styles.inlineMenu} ${className}`}
      data-theme={theme !== 'auto' ? theme : undefined}
    >
      <div className={styles.tooltipWrapper}>
        <button 
          className={`${styles.actionBtn} ${isOwned ? styles.active : ''} ${isAdding ? styles.loading : ''}`}
          onClick={handleAddToCollection}
          disabled={isOwned || isAdding}
        >
          {isAdding ? <Icons.spinner size={16} /> : isOwned ? <Icons.check size={16} /> : <Icons.car size={16} />}
          {showLabels && <span>{isAdding ? 'Adding...' : isOwned ? 'Owned' : 'Own'}</span>}
          <span className={styles.tooltip}>{isAdding ? 'Adding...' : isOwned ? 'In Your Collection' : 'Add to My Collection'}</span>
        </button>
      </div>
      
      <div className={styles.tooltipWrapper}>
        <button 
          className={`${styles.actionBtn} ${isFav ? styles.activeFavorite : ''}`}
          onClick={handleToggleFavorite}
        >
          <Icons.heart size={16} filled={isFav} />
          {showLabels && <span>{isFav ? 'Saved' : 'Save'}</span>}
          <span className={styles.tooltip}>{isFav ? 'Remove Favorite' : 'Add to Favorites'}</span>
        </button>
      </div>
      
      <div className={styles.tooltipWrapper}>
        <button 
          className={`${styles.actionBtn} ${isComparing ? styles.active : ''}`}
          onClick={handleToggleCompare}
          disabled={!canCompare && !isComparing}
        >
          <Icons.compare size={16} />
          {showLabels && <span>Compare</span>}
          <span className={styles.tooltip}>{isComparing ? 'Remove Compare' : 'Compare Car'}</span>
        </button>
      </div>
      
      <div className={styles.tooltipWrapper}>
        <button 
          className={`${styles.actionBtn} ${styles.modBtn}`}
          onClick={handleMod}
        >
          <Icons.wrench size={16} />
          {showLabels && <span>Mod</span>}
          <span className={styles.tooltip}>Mod This Car</span>
        </button>
      </div>

      <div className={styles.tooltipWrapper}>
        <Link href={`/browse-cars/${car.slug}`} className={styles.actionBtn}>
          <Icons.arrowRight size={16} />
          {showLabels && <span>Details</span>}
          <span className={styles.tooltip}>View Profile</span>
        </Link>
      </div>
    </div>
  );
}

/**
 * Quick add button for specific action (kept for backward compatibility, but updated icons)
 */
export function QuickActionButton({ car, action, size = 'default', showLabel = false, theme = 'auto' }) {
  const router = useRouter();
  
  // Safe hooks
  let favorites = [], addFavorite = () => {}, removeFavorite = () => {}, isFavorite = () => false;
  let vehicles = [], addVehicle = async () => {};
  let compareList = [], toggleCompare = () => {}, isCompareFull = false, isInCompare = () => false;

  try {
    const favUtils = useFavorites();
    addFavorite = favUtils.addFavorite;
    removeFavorite = favUtils.removeFavorite;
    isFavorite = favUtils.isFavorite;
  } catch(e) {}

  try {
    const vehicleUtils = useOwnedVehicles();
    vehicles = vehicleUtils.vehicles;
    addVehicle = vehicleUtils.addVehicle;
  } catch(e) {}

  try {
    const compareUtils = useCompare();
    toggleCompare = compareUtils.toggleCompare;
    isCompareFull = compareUtils.isFull;
    isInCompare = compareUtils.isInCompare;
  } catch(e) {}

  const [isLoading, setIsLoading] = useState(false);

  if (!car) return null;

  const isOwned = vehicles?.some(v => v.matchedCarSlug === car.slug);
  const isFav = isFavorite(car.slug);
  const isComparing = isInCompare(car.slug);

  const handleClick = async (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();

    switch (action) {
      case 'own':
        if (!isOwned) {
          setIsLoading(true);
          try {
            const yearMatch = car.years?.match(/(\d{4})/);
            const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
            const { make, model } = extractMakeModel(car);
            await addVehicle({ year, make, model, matchedCarSlug: car.slug });
            if (isFav) removeFavorite(car.slug);
          } finally {
            setIsLoading(false);
          }
        }
        break;
      case 'favorite':
        isFav ? removeFavorite(car.slug) : addFavorite(car);
        break;
      case 'compare':
        if (!isCompareFull || isComparing) {
          toggleCompare(car);
        }
        break;
      case 'mod':
      case 'project':
        router.push(`/tuning-shop?plan=${car.slug}`);
        break;
      case 'profile':
        router.push(`/browse-cars/${car.slug}`);
        break;
    }
  };

  const icons = { own: Icons.car, favorite: Icons.heart, compare: Icons.compare, mod: Icons.wrench, project: Icons.wrench, profile: Icons.arrowRight };
  const Icon = icons[action] || Icons.car;
  const isActive = action === 'own' ? isOwned : action === 'favorite' ? isFav : action === 'compare' ? isComparing : false;

  const sizeClass = size === 'small' ? styles.quickBtnSmall : size === 'large' ? styles.quickBtnLarge : styles.quickBtn;

  return (
    <button 
      className={`${sizeClass} ${isActive ? styles.quickBtnActive : ''}`}
      onClick={handleClick}
      disabled={isLoading || (action === 'own' && isOwned)}
      data-theme={theme !== 'auto' ? theme : undefined}
    >
      <Icon size={size === 'small' ? 14 : size === 'large' ? 20 : 16} filled={action === 'favorite' && isFav} />
      {showLabel && <span>{action === 'own' ? (isOwned ? 'Owned' : 'Own') : action === 'favorite' ? (isFav ? 'Saved' : 'Save') : action === 'compare' ? 'Compare' : action === 'profile' ? 'Profile' : 'Mod'}</span>}
    </button>
  );
}
