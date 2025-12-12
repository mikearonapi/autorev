'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { carData as cars, tierConfig } from '@/data/cars.js';
import CarImage from '@/components/CarImage';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useCompare } from '@/components/providers/CompareProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';

// Hero image - Curated collection of diverse sports cars (same as Explore car catalog section)
const heroImageUrl = 'https://abqnp7qrs0nhv5pw.public.blob.vercel-storage.com/pages/selector/hero.webp';

// Icons
const Icons = {
  heart: ({ size = 20, filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  search: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  filter: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  grid: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  list: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/>
      <line x1="3" y1="12" x2="3.01" y2="12"/>
      <line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  chevronRight: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  compare: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  garage: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/>
      <path d="M3 21h18"/>
      <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/>
      <path d="M10 9h4"/>
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

// Get unique makes from car data
function getUniqueMakes(carList) {
  const makes = new Set();
  carList.forEach(car => {
    const make = car.brand || car.name?.split(' ')[0];
    if (make) makes.add(make);
  });
  return Array.from(makes).sort();
}

// Get unique categories
function getUniqueCategories(carList) {
  const categories = new Set();
  carList.forEach(car => {
    if (car.category) categories.add(car.category);
  });
  return Array.from(categories).sort();
}

export default function CarCatalog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMake, setSelectedMake] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  // Favorites functionality
  const { toggleFavorite, isFavorite } = useFavorites();
  
  // Compare functionality
  const { toggleCompare, isInCompare, isFull: isCompareFull } = useCompare();
  
  // My Collection functionality
  const { vehicles, addVehicle } = useOwnedVehicles();
  const { isAuthenticated } = useAuth();
  const authModal = useAuthModal();
  const [addingCar, setAddingCar] = useState(null);
  
  // Check if a car is already in My Collection
  const isInMyCars = (slug) => vehicles.some(v => v.matchedCarSlug === slug);
  
  // Handle adding car to My Collection
  const handleAddToMyCars = async (car) => {
    // Auth check removed for testing - will be re-enabled for production
    // if (!isAuthenticated) {
    //   authModal.openSignIn();
    //   return;
    // }
    
    if (isInMyCars(car.slug)) return;
    
    setAddingCar(car.slug);
    
    try {
      // Parse year from car data
      const yearMatch = car.years?.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
      
      // Extract make and model
      let make = '';
      let model = car.name;
      
      if (car.name.startsWith('718') || car.name.startsWith('911') || car.name.startsWith('981') || car.name.startsWith('997') || car.name.startsWith('987')) {
        make = 'Porsche';
      } else if (car.name.startsWith('991') || car.name.startsWith('992')) {
        make = 'Porsche';
      } else {
        const parts = car.name.split(' ');
        make = parts[0];
        model = parts.slice(1).join(' ');
      }
      
      const { error } = await addVehicle({
        year,
        make,
        model,
        matchedCarSlug: car.slug,
      });
      
      if (error) {
        console.error('[CarCatalog] Failed to add vehicle:', error.message);
      }
    } catch (err) {
      console.error('[CarCatalog] Error adding vehicle:', err);
    } finally {
      setAddingCar(null);
    }
  };

  // Get filter options
  const makes = useMemo(() => getUniqueMakes(cars), []);
  const categories = useMemo(() => getUniqueCategories(cars), []);
  const tiers = Object.keys(tierConfig);

  // Filter and sort cars
  const filteredCars = useMemo(() => {
    let result = [...cars];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(car => 
        car.name?.toLowerCase().includes(query) ||
        car.brand?.toLowerCase().includes(query) ||
        car.category?.toLowerCase().includes(query)
      );
    }

    // Make filter
    if (selectedMake !== 'all') {
      result = result.filter(car => {
        const carMake = car.brand || car.name?.split(' ')[0];
        return carMake?.toLowerCase() === selectedMake.toLowerCase();
      });
    }

    // Tier filter
    if (selectedTier !== 'all') {
      result = result.filter(car => car.tier === selectedTier);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(car => car.category === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'hp-high':
        result.sort((a, b) => (b.hp || 0) - (a.hp || 0));
        break;
      case 'hp-low':
        result.sort((a, b) => (a.hp || 0) - (b.hp || 0));
        break;
      case 'price-high':
        result.sort((a, b) => {
          const aPrice = parseInt(a.priceRange?.replace(/\D/g, '')) || 0;
          const bPrice = parseInt(b.priceRange?.replace(/\D/g, '')) || 0;
          return bPrice - aPrice;
        });
        break;
      case 'price-low':
        result.sort((a, b) => {
          const aPrice = parseInt(a.priceRange?.replace(/\D/g, '')) || 0;
          const bPrice = parseInt(b.priceRange?.replace(/\D/g, '')) || 0;
          return aPrice - bPrice;
        });
        break;
      default:
        break;
    }

    return result;
  }, [searchQuery, selectedMake, selectedTier, selectedCategory, sortBy]);

  return (
    <div className={styles.catalogPage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image
            src={heroImageUrl}
            alt="Enthusiast sports cars on track"
            fill
            priority
            quality={85}
            className={styles.heroImage}
            sizes="100vw"
          />
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Browse.<br />
            <span className={styles.titleAccent}>Discover.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Explore our collection of {cars.length}+ sports cars. Compare specs, 
            find your perfect match, and learn what makes each one special.
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className={styles.filtersSection}>
        <div className={styles.filtersContainer}>
          {/* Search */}
          <div className={styles.searchWrapper}>
            <Icons.search size={18} />
            <input
              type="text"
              placeholder="Search cars..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Filters */}
          <div className={styles.filters}>
            <select 
              value={selectedMake} 
              onChange={(e) => setSelectedMake(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Makes</option>
              {makes.map(make => (
                <option key={make} value={make}>{make}</option>
              ))}
            </select>

            <select 
              value={selectedTier} 
              onChange={(e) => setSelectedTier(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Price Tiers</option>
              {tiers.map(tier => (
                <option key={tier} value={tier}>{tierConfig[tier]?.label || tier}</option>
              ))}
            </select>

            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="name">Sort: A-Z</option>
              <option value="hp-high">Sort: HP (High to Low)</option>
              <option value="hp-low">Sort: HP (Low to High)</option>
              <option value="price-high">Sort: Price (High to Low)</option>
              <option value="price-low">Sort: Price (Low to High)</option>
            </select>
          </div>

          {/* Results count */}
          <div className={styles.resultsCount}>
            Showing {filteredCars.length} of {cars.length} vehicles
          </div>
        </div>
      </section>

      {/* Car Grid */}
      <section className={styles.gridSection}>
        <div className={styles.carGrid}>
          {filteredCars.map(car => {
            const isCarFavorite = isFavorite(car.slug);
            const isCarInCompare = isInCompare(car.slug);
            const canAddToCompare = !isCompareFull || isCarInCompare;
            const isCarInMyCars = isInMyCars(car.slug);
            const isAddingThis = addingCar === car.slug;
            return (
              <div key={car.id || car.slug} className={styles.carCardWrapper}>
                <Link 
                  href={`/browse-cars/${car.slug}`}
                  className={styles.carCard}
                >
                  <div className={styles.cardImage}>
                    <CarImage 
                      car={car}
                      priority={false}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    {car.tier && (
                      <span 
                        className={styles.tierBadge}
                        style={{ 
                          backgroundColor: tierConfig[car.tier]?.color || '#666',
                        }}
                      >
                        {tierConfig[car.tier]?.label || car.tier}
                      </span>
                    )}
                    <div className={styles.cardActions}>
                      <button
                        className={`${styles.actionButton} ${isCarInMyCars ? styles.myCarsActive : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isCarInMyCars && !isAddingThis) handleAddToMyCars(car);
                        }}
                        disabled={isCarInMyCars || isAddingThis}
                        title={isCarInMyCars ? 'In My Collection' : 'Add to My Collection'}
                      >
                        {isCarInMyCars ? <Icons.check size={14} /> : <Icons.garage size={16} />}
                      </button>
                      <button
                        className={`${styles.actionButton} ${isCarInCompare ? styles.compareActive : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (canAddToCompare) toggleCompare(car);
                        }}
                        disabled={!canAddToCompare}
                        title={isCarInCompare ? 'Remove from compare' : isCompareFull ? 'Compare list full' : 'Add to compare'}
                      >
                        <Icons.compare size={16} />
                      </button>
                      <button
                        className={`${styles.actionButton} ${isCarFavorite ? styles.favoriteActive : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleFavorite(car);
                        }}
                        title={isCarFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Icons.heart size={16} filled={isCarFavorite} />
                      </button>
                    </div>
                  </div>
              <div className={styles.cardContent}>
                <h3 className={styles.carName}>{car.name}</h3>
                <p className={styles.carYears}>{car.years}</p>
                <div className={styles.carSpecs}>
                  {car.hp && <span className={styles.spec}>{car.hp} hp</span>}
                  {car.zeroToSixty && <span className={styles.spec}>{car.zeroToSixty}s 0-60</span>}
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.priceRange}>{car.priceRange}</span>
                  <span className={styles.viewLink}>
                    View Details
                    <Icons.chevronRight size={14} />
                  </span>
                </div>
              </div>
                </Link>
              </div>
            );
          })}
        </div>

        {/* No results */}
        {filteredCars.length === 0 && (
          <div className={styles.noResults}>
            <h3>No cars found</h3>
            <p>Try adjusting your filters or search query.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedMake('all');
                setSelectedTier('all');
                setSelectedCategory('all');
              }}
              className={styles.clearFiltersBtn}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </section>

      <AuthModal 
        isOpen={authModal.isOpen}
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />
    </div>
  );
}
