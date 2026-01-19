'use client';

import { useState, useEffect, useMemo, Suspense, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import { fetchCars, tierConfig } from '@/lib/carsClient.js';
import { calculateWeightedScore } from '@/lib/scoring';
import { loadPreferences, hasUserPreferences, defaultPreferences } from '@/lib/stores/userPreferencesStore';
import PerformanceHub from '@/components/PerformanceHub';
import LoadingSpinner from '@/components/LoadingSpinner';
import CarImage from '@/components/CarImage';
import Button from '@/components/Button';
import { useCarSelection } from '@/components/providers/CarSelectionProvider';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import TunabilityBadge from '@/components/TunabilityBadge';

// AI-generated hero image - dramatic engine bay (owned/licensed)
const heroImageUrl = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/pages/performance/hero.webp';

// Icons
const Icons = {
  gauge: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  search: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  car: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
      <circle cx="6.5" cy="16.5" r="2.5"/>
      <circle cx="16.5" cy="16.5" r="2.5"/>
    </svg>
  ),
  chevronDown: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  wrench: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  heart: ({ size = 20, filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  arrowRight: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  garage: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/>
      <path d="M6 18h12"/>
      <path d="M6 14h12"/>
      <rect width="12" height="12" x="6" y="10"/>
    </svg>
  ),
  close: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

/**
 * Inner component that uses useSearchParams
 * Must be wrapped in Suspense
 */
function PerformanceContent() {
  const searchParams = useSearchParams();
  const [cars, setCars] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCarSlug, setSelectedCarSlug] = useState(searchParams.get('car') || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);
  
  // Get build ID from URL params (for loading saved builds)
  const buildId = searchParams.get('build') || null;
  
  // Context providers
  const { selectedCar: globalSelectedCar, selectCar, isHydrated: carSelectionHydrated } = useCarSelection();
  const { favorites, isHydrated: favoritesHydrated } = useFavorites();
  const { vehicles, isHydrated: vehiclesHydrated } = useOwnedVehicles();
  const { isAuthenticated, isLoading: authLoading, sessionExpired, authError } = useAuth();

  // Load cars from database via carsClient (has fallback built-in)
  useEffect(() => {
    async function loadCars() {
      try {
        setIsLoading(true);
        const fetchedCars = await fetchCars();
        setCars(fetchedCars);
      } catch (err) {
        console.error('[Performance] Error loading cars:', err);
        setCars([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadCars();
  }, []);

  // Initialize from global state if no URL param but global car is selected
  useEffect(() => {
    if (carSelectionHydrated && !selectedCarSlug && globalSelectedCar?.slug) {
      setSelectedCarSlug(globalSelectedCar.slug);
    }
  }, [carSelectionHydrated, globalSelectedCar, selectedCarSlug]);

  // Update URL when car is selected
  useEffect(() => {
    if (selectedCarSlug) {
      window.history.pushState({}, '', `/mod-planner?car=${selectedCarSlug}`);
    } else {
      window.history.pushState({}, '', '/mod-planner');
    }
  }, [selectedCarSlug]);

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get the selected car
  const selectedCar = useMemo(() => {
    return cars.find(car => car.slug === selectedCarSlug);
  }, [cars, selectedCarSlug]);

  // Get owned vehicles with matched car data
  const ownedCarsWithData = useMemo(() => {
    if (!vehiclesHydrated) return [];
    return vehicles
      .filter(v => v.matchedCarSlug)
      .map(v => ({
        vehicle: v,
        car: cars.find(c => c.slug === v.matchedCarSlug)
      }))
      .filter(v => v.car);
  }, [vehicles, cars, vehiclesHydrated]);

  // Get favorites with full car data
  const favoriteCarsWithData = useMemo(() => {
    if (!favoritesHydrated) return [];
    return favorites
      .map(fav => cars.find(c => c.slug === fav.slug))
      .filter(Boolean)
      .slice(0, 6); // Limit to 6 for compact display
  }, [favorites, cars, favoritesHydrated]);

  // Get user preferences for scoring (uses their "Find Your Car" weights if set)
  const userWeights = useMemo(() => {
    if (typeof window === 'undefined') return defaultPreferences.weights;
    const prefs = loadPreferences();
    return prefs.weights || defaultPreferences.weights;
  }, []);

  // Search results (filtered cars)
  // Searches: name, brand, category, engine, years
  // Sorted by: weighted vehicle score (uses user preferences if set, otherwise default weights)
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    
    // Filter matching cars
    const matches = cars.filter(car => 
      car.name?.toLowerCase().includes(term) ||
      car.brand?.toLowerCase().includes(term) ||
      car.category?.toLowerCase().includes(term) ||
      car.engine?.toLowerCase().includes(term) ||
      car.years?.toLowerCase().includes(term)
    );
    
    // Sort by weighted score (highest scoring cars first)
    // This uses either user's "Find Your Car" preferences or default enthusiast weights
    return matches
      .map(car => ({
        car,
        score: calculateWeightedScore(car, userWeights)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.car)
      .slice(0, 12);
  }, [cars, searchTerm, userWeights]);

  // Handle car selection - updates both local state and global context
  const handleSelectCar = (car) => {
    setSelectedCarSlug(car.slug);
    selectCar(car);
    setSearchTerm('');
    setShowSearchResults(false);
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSearchResults(e.target.value.trim().length > 0);
  };

  // Handle changing car - clears selection and returns to car picker
  const handleChangeCar = () => {
    setSelectedCarSlug('');
  };

  // If a car is selected, show the Performance HUB
  if (selectedCar) {
    return (
      <div className={styles.pageFullWidth} data-no-main-offset>
        <PerformanceHub car={selectedCar} initialBuildId={buildId} onChangeCar={handleChangeCar} />
      </div>
    );
  }

  // Consider auth loading state along with provider hydration
  const isHydrated = carSelectionHydrated && favoritesHydrated && vehiclesHydrated && !authLoading;
  const hasOwnedCars = ownedCarsWithData.length > 0;
  const hasFavorites = favoriteCarsWithData.length > 0;
  const hasPersonalCars = hasOwnedCars || hasFavorites;

  // Car selection view - Redesigned for quick access
  return (
    <div className={styles.page} data-no-main-offset>
      {/* Hero Section - Compact */}
      <section className={styles.heroCompact}>
        <div className={styles.heroImageWrapper}>
          <Image
            src={heroImageUrl}
            alt="Performance car engine"
            fill
            priority
            unoptimized // Skip Next.js Image Optimization - blob images are pre-compressed via TinyPNG
            className={styles.heroImage}
            sizes="100vw"
          />
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.container}>
          <div className={styles.heroContentCompact}>
            <h1 className={styles.titleCompact}>
              Performance <span className={styles.titleAccent}>HUB</span>
            </h1>
            <p className={styles.subtitleCompact}>
              Select your car to build a personalized modification plan
            </p>
            
            {/* Search Bar - Prominent */}
            <div className={styles.heroSearch} ref={searchRef}>
              <div className={styles.searchBoxLarge}>
                <Icons.search size={22} />
                <input
                  type="text"
                  placeholder="Search any car in our database..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => searchTerm.trim() && setShowSearchResults(true)}
                  className={styles.searchInputLarge}
                  autoComplete="off"
                />
                {searchTerm && (
                  <button 
                    onClick={() => { setSearchTerm(''); setShowSearchResults(false); }}
                    className={styles.searchClear}
                  >
                    <Icons.close size={18} />
                  </button>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className={styles.searchResults}>
                  {searchResults.map(car => (
                    <button
                      key={car.slug}
                      onClick={() => handleSelectCar(car)}
                      className={styles.searchResultItem}
                    >
                      <div className={styles.searchResultImage}>
                        <CarImage car={car} variant="thumbnail" showName={false} />
                      </div>
                      <div className={styles.searchResultInfo}>
                        <span className={styles.searchResultName}>{car.name}</span>
                        <span className={styles.searchResultMeta}>
                          {car.hp} hp • {car.category} • {car.priceRange}
                        </span>
                      </div>
                      <Icons.arrowRight size={16} className={styles.searchResultArrow} />
                    </button>
                  ))}
                </div>
              )}
              
              {showSearchResults && searchTerm.trim() && searchResults.length === 0 && (
                <div className={styles.searchResults}>
                  <div className={styles.searchNoResults}>
                    No cars found for "{searchTerm}"
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Selection Section */}
      <section className={styles.quickSelection}>
        <div className={styles.container}>
          
          {/* Loading State */}
          {(isLoading || !isHydrated) && (
            <LoadingSpinner 
              text="Loading your cars..." 
              size="large"
            />
          )}

          {!isLoading && isHydrated && (
            <>
              {/* My Collection Section - Most Prominent */}
              {hasOwnedCars && (
                <div className={styles.selectionSection}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitleGroup}>
                      <Icons.garage size={22} />
                      <h2 className={styles.sectionTitle}>My Collection</h2>
                    </div>
                    <Link href="/garage" className={styles.sectionLink}>
                      Manage Garage <Icons.arrowRight size={14} />
                    </Link>
                  </div>
                  <p className={styles.sectionDescription}>
                    Build a modification plan for a car you own
                  </p>
                  <div className={styles.quickGrid}>
                    {ownedCarsWithData.map(({ vehicle, car }) => (
                      <button
                        key={vehicle.id}
                        onClick={() => handleSelectCar(car)}
                        className={styles.quickCard}
                      >
                        <div className={styles.quickCardImage}>
                          <CarImage car={car} variant="hero" showName={false} />
                        </div>
                        <div className={styles.quickCardContent}>
                          <span className={styles.quickCardName}>
                            {vehicle.nickname || car.name}
                          </span>
                          <span className={styles.quickCardMeta}>
                            {vehicle.year} • {car.hp} hp
                          </span>
                          <TunabilityBadge car={car} variant="compact" />
                        </div>
                        <div className={styles.quickCardAction}>
                          <Icons.wrench size={18} />
                          <span>Modify</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Favorites Section */}
              {hasFavorites && (
                <div className={styles.selectionSection}>
                  <div className={styles.sectionHeader}>
                    <div className={styles.sectionTitleGroup}>
                      <Icons.heart size={20} filled />
                      <h2 className={styles.sectionTitle}>Favorites</h2>
                    </div>
                    <Link href="/garage" className={styles.sectionLink}>
                      View All <Icons.arrowRight size={14} />
                    </Link>
                  </div>
                  <p className={styles.sectionDescription}>
                    Explore upgrades for cars on your wishlist
                  </p>
                  <div className={styles.quickGrid}>
                    {favoriteCarsWithData.map(car => (
                      <button
                        key={car.slug}
                        onClick={() => handleSelectCar(car)}
                        className={styles.quickCard}
                      >
                        <div className={styles.quickCardImage}>
                          <CarImage car={car} variant="hero" showName={false} />
                        </div>
                        <div className={styles.quickCardContent}>
                          <span className={styles.quickCardName}>{car.name}</span>
                          <span className={styles.quickCardMeta}>
                            {car.hp} hp • {car.priceRange}
                          </span>
                          <TunabilityBadge car={car} variant="compact" />
                        </div>
                        <div className={styles.quickCardAction}>
                          <Icons.wrench size={18} />
                          <span>Explore</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State - No personal cars */}
              {!hasPersonalCars && (
                <div className={styles.emptyStateCompact}>
                  <Icons.heart size={20} />
                  <p className={styles.emptyStateText}>
                    Add cars to your garage or favorites for quick access to modification planning.
                  </p>
                  <Link href="/browse-cars" className={styles.emptyStateLink}>
                    Browse Cars
                  </Link>
                </div>
              )}

              {/* Browse Link - For users who want to explore */}
              <div className={styles.browseSection}>
                <p className={styles.browseText}>
                  Looking for something specific?
                </p>
                <Link href="/browse-cars" className={styles.browseLink}>
                  Browse all {cars.length} cars in our catalog <Icons.arrowRight size={16} />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * Loading fallback for Suspense
 */
function PerformanceLoading() {
  return (
    <div className={styles.page} data-no-main-offset>
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image
            src={heroImageUrl}
            alt="Performance car on track"
            fill
            priority
            unoptimized // Skip Next.js Image Optimization - blob images are pre-compressed via TinyPNG
            className={styles.heroImage}
            sizes="100vw"
          />
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.container}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>
              Maximize Your<br />
              <span className={styles.titleAccent}>Performance</span>
            </h1>
          </div>
        </div>
      </section>
      <LoadingSpinner 
        variant="branded" 
        text="Performance HUB" 
        subtext="Loading tuning tools..."
        fullPage 
      />
    </div>
  );
}

/**
 * Main page export - wraps content in Suspense for useSearchParams
 */
export default function Performance() {
  return (
    <Suspense fallback={<PerformanceLoading />}>
      <PerformanceContent />
    </Suspense>
  );
}
