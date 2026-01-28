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

import { useState, useCallback } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Icons } from '@/components/ui/Icons';
import styles from './CarActionMenu.module.css';
import { useCompare } from './providers/CompareProvider';
import { useFavorites } from './providers/FavoritesProvider';
import { useOwnedVehicles } from './providers/OwnedVehiclesProvider';

// Minimum time to show loading state (prevents flickering on fast operations)
const MIN_LOADING_DURATION_MS = 400;

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
  // Use refs to store callback functions to avoid dependency changes
  const noopFn = useCallback(() => {}, []);
  const noopAsyncFn = useCallback(async () => {}, []);
  const noopCheckFn = useCallback(() => false, []);
  
  const _favorites = [];
  let addFavorite = noopFn, removeFavorite = noopFn, isFavorite = noopCheckFn;
  let vehicles = [], addVehicle = noopAsyncFn;
  const _compareList = [];
  let toggleCompare = noopFn, isCompareFull = false, isInCompare = noopCheckFn;

  try {
    const favUtils = useFavorites();
    addFavorite = favUtils.addFavorite;
    removeFavorite = favUtils.removeFavorite;
    isFavorite = favUtils.isFavorite;
  } catch (_e) { /* Provider missing */ }

  try {
    const vehicleUtils = useOwnedVehicles();
    vehicles = vehicleUtils.vehicles;
    addVehicle = vehicleUtils.addVehicle;
  } catch (_e) { /* Provider missing */ }

  try {
    const compareUtils = useCompare();
    toggleCompare = compareUtils.toggleCompare;
    isCompareFull = compareUtils.isFull;
    isInCompare = compareUtils.isInCompare;
  } catch (_e) { /* Provider missing */ }

  // Check states (safe even if car is null)
  const isOwned = car && vehicles?.some(v => v.matchedCarSlug === car.slug);
  const isFav = car && isFavorite(car.slug);
  const isComparing = car && isInCompare(car.slug);
  const canCompare = !isCompareFull || isComparing;

  // Handle adding to collection (ownership)
  // Optimistic UI pattern: immediately show success, sync in background
  // NOTE: useCallback must be called unconditionally (before any early returns)
  const handleAddToCollection = useCallback(async (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    
    if (!car || isOwned || isAdding) return;
    
    // Briefly show adding state for tactile feedback
    setIsAdding(true);
    
    const yearMatch = car.years?.match(/(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
    const { make, model } = extractMakeModel(car);
    
    // Optimistic: immediately notify parent of success
    onAction?.('added-to-collection', car);
    
    // Auto-remove from favorites when promoted to owned (optimistic)
    if (isFav) {
      removeFavorite(car.slug);
    }
    
    // Clear adding state quickly for responsive feel
    setTimeout(() => setIsAdding(false), 150);
    
    // Save in background
    try {
      await addVehicle({
        year,
        make,
        model,
        matchedCarSlug: car.slug,
      });
    } catch (err) {
      console.error('[CarActionMenu] Error adding to collection:', err);
      // Revert: notify parent of failure
      onAction?.('add-to-collection-failed', car);
      // Note: Provider will handle data revert via React Query
    }
  }, [car, isOwned, isAdding, addVehicle, isFav, removeFavorite, onAction]);

  if (!car) return null;

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
    
    router.push(`/garage/my-build?car=${car.slug}`);
    onAction?.('mod', car);
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
                onClick={(_e) => {
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
          aria-label={isAdding ? 'Adding to collection' : isOwned ? 'In your collection' : 'Add to my collection'}
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
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
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
          aria-label={isComparing ? 'Remove from compare' : 'Add to compare'}
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
          aria-label="Mod this car"
        >
          <Icons.wrench size={16} />
          {showLabels && <span>Mod</span>}
          <span className={styles.tooltip}>Mod This Car</span>
        </button>
      </div>

      <div className={styles.tooltipWrapper}>
        <Link href={`/browse-cars/${car.slug}`} className={styles.actionBtn} aria-label="View car profile">
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
  
  // Safe hooks with stable default functions
  const noopFn = useCallback(() => {}, []);
  const noopAsyncFn = useCallback(async () => {}, []);
  const noopCheckFn = useCallback(() => false, []);
  
  let addFavorite = noopFn, removeFavorite = noopFn, isFavorite = noopCheckFn;
  let vehicles = [], addVehicle = noopAsyncFn;
  let toggleCompare = noopFn, isCompareFull = false, isInCompare = noopCheckFn;

  try {
    const favUtils = useFavorites();
    addFavorite = favUtils.addFavorite;
    removeFavorite = favUtils.removeFavorite;
    isFavorite = favUtils.isFavorite;
  } catch(_e) {}

  try {
    const vehicleUtils = useOwnedVehicles();
    vehicles = vehicleUtils.vehicles;
    addVehicle = vehicleUtils.addVehicle;
  } catch(_e) {}

  try {
    const compareUtils = useCompare();
    toggleCompare = compareUtils.toggleCompare;
    isCompareFull = compareUtils.isFull;
    isInCompare = compareUtils.isInCompare;
  } catch(_e) {}

  const [isLoading, setIsLoading] = useState(false);

  // Check states (safe even if car is null)
  const isOwned = car && vehicles?.some(v => v.matchedCarSlug === car.slug);
  const isFav = car && isFavorite(car.slug);
  const isComparing = car && isInCompare(car.slug);

  // NOTE: useCallback must be called unconditionally (before any early returns)
  const handleCarActionClick = useCallback(async (e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();

    if (!car) return;

    switch (action) {
      case 'own':
        if (!isOwned) {
          const startTime = Date.now();
          setIsLoading(true);
          try {
            const yearMatch = car.years?.match(/(\d{4})/);
            const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
            const { make, model } = extractMakeModel(car);
            await addVehicle({ year, make, model, matchedCarSlug: car.slug });
            if (isFav) removeFavorite(car.slug);
          } finally {
            // Ensure minimum loading duration to prevent flickering on Android
            const elapsed = Date.now() - startTime;
            const remaining = MIN_LOADING_DURATION_MS - elapsed;
            
            if (remaining > 0) {
              setTimeout(() => setIsLoading(false), remaining);
            } else {
              setIsLoading(false);
            }
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
        router.push(`/garage/my-build?car=${car.slug}`);
        break;
      case 'profile':
        router.push(`/browse-cars/${car.slug}`);
        break;
    }
  }, [action, car, isOwned, isFav, isComparing, isCompareFull, router, addVehicle, removeFavorite, addFavorite, toggleCompare]);

  if (!car) return null;

  const icons = { own: Icons.car, favorite: Icons.heart, compare: Icons.compare, mod: Icons.wrench, project: Icons.wrench, profile: Icons.arrowRight };
  const Icon = icons[action] || Icons.car;
  const isActive = action === 'own' ? isOwned : action === 'favorite' ? isFav : action === 'compare' ? isComparing : false;

  const sizeClass = size === 'small' ? styles.quickBtnSmall : size === 'large' ? styles.quickBtnLarge : styles.quickBtn;

  return (
    <button 
      className={`${sizeClass} ${isActive ? styles.quickBtnActive : ''}`}
      onClick={handleCarActionClick}
      disabled={isLoading || (action === 'own' && isOwned)}
      data-theme={theme !== 'auto' ? theme : undefined}
    >
      <Icon size={size === 'small' ? 14 : size === 'large' ? 20 : 16} filled={action === 'favorite' && isFav} />
      {showLabel && <span>{action === 'own' ? (isOwned ? 'Owned' : 'Own') : action === 'favorite' ? (isFav ? 'Saved' : 'Save') : action === 'compare' ? 'Compare' : action === 'profile' ? 'Profile' : 'Mod'}</span>}
    </button>
  );
}
