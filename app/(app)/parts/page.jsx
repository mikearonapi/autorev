'use client';

/**
 * Parts Database Page - Build Pivot (January 2026)
 * 
 * Browse the parts database with filtering by:
 * - Category (intake, exhaust, suspension, etc.)
 * - Brand
 * - Car compatibility
 * - Price range
 */

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import styles from './page.module.css';

// Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const FilterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const WrenchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

// Part categories with display names
const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'intake', label: 'Intake' },
  { id: 'exhaust', label: 'Exhaust' },
  { id: 'turbo', label: 'Turbo/Supercharger' },
  { id: 'ecu', label: 'ECU/Tune' },
  { id: 'suspension', label: 'Suspension' },
  { id: 'brakes', label: 'Brakes' },
  { id: 'wheels', label: 'Wheels & Tires' },
  { id: 'cooling', label: 'Cooling' },
  { id: 'fuel', label: 'Fuel System' },
  { id: 'drivetrain', label: 'Drivetrain' },
  { id: 'aero', label: 'Aero' },
  { id: 'interior', label: 'Interior' },
];

function PartsContent() {
  const [parts, setParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch parts from database
  useEffect(() => {
    async function fetchParts() {
      if (!isSupabaseConfigured()) {
        setError('Database not configured');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('parts')
          .select('*')
          .order('name', { ascending: true });

        if (fetchError) throw fetchError;
        setParts(data || []);
      } catch (err) {
        console.error('Error fetching parts:', err);
        setError('Failed to load parts');
      } finally {
        setIsLoading(false);
      }
    }

    fetchParts();
  }, []);

  // Get unique brands from parts
  const brands = useMemo(() => {
    const brandSet = new Set(parts.map(p => p.brand).filter(Boolean));
    return ['all', ...Array.from(brandSet).sort()];
  }, [parts]);

  // Filter parts based on search and filters
  const filteredParts = useMemo(() => {
    return parts.filter(part => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          part.name?.toLowerCase().includes(query) ||
          part.brand?.toLowerCase().includes(query) ||
          part.description?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (part.category?.toLowerCase() !== selectedCategory) return false;
      }

      // Brand filter
      if (selectedBrand !== 'all') {
        if (part.brand?.toLowerCase() !== selectedBrand.toLowerCase()) return false;
      }

      return true;
    });
  }, [parts, searchQuery, selectedCategory, selectedBrand]);

  // Group parts by category for display
  const groupedParts = useMemo(() => {
    const groups = {};
    filteredParts.forEach(part => {
      const category = part.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(part);
    });
    return groups;
  }, [filteredParts]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <LoadingSpinner />
          <p>Loading parts database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Parts Database</h1>
          <p className={styles.subtitle}>
            Browse {parts.length} verified parts with fitment data
          </p>
        </div>
        <Link href="/tuning-shop" className={styles.buildLink}>
          <WrenchIcon />
          Start a Build
        </Link>
      </header>

      {/* Search and Filters */}
      <div className={styles.searchSection}>
        <div className={styles.searchBar}>
          <SearchIcon />
          <input
            type="text"
            placeholder="Search parts by name, brand, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <button 
          className={`${styles.filterToggle} ${showFilters ? styles.filterToggleActive : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FilterIcon />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Category</label>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.filterSelect}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Brand</label>
            <select 
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Brands</option>
              {brands.filter(b => b !== 'all').map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          <button 
            className={styles.clearFilters}
            onClick={() => {
              setSelectedCategory('all');
              setSelectedBrand('all');
              setSearchQuery('');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className={styles.resultsInfo}>
        <span>{filteredParts.length} parts found</span>
        {(selectedCategory !== 'all' || selectedBrand !== 'all' || searchQuery) && (
          <span className={styles.filterIndicator}>
            (filtered)
          </span>
        )}
      </div>

      {/* Parts Grid */}
      {filteredParts.length === 0 ? (
        <div className={styles.emptyState}>
          <WrenchIcon />
          <h3>No parts found</h3>
          <p>Try adjusting your filters or search query</p>
        </div>
      ) : selectedCategory === 'all' ? (
        // Grouped view when no category filter
        <div className={styles.groupedParts}>
          {Object.entries(groupedParts).map(([category, categoryParts]) => (
            <div key={category} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>
                {category}
                <span className={styles.categoryCount}>{categoryParts.length}</span>
              </h2>
              <div className={styles.partsGrid}>
                {categoryParts.slice(0, 6).map(part => (
                  <PartCard key={part.id} part={part} />
                ))}
              </div>
              {categoryParts.length > 6 && (
                <button 
                  className={styles.viewMoreBtn}
                  onClick={() => setSelectedCategory(category.toLowerCase())}
                >
                  View all {categoryParts.length} {category} parts
                  <ChevronRightIcon />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        // Flat grid when category is selected
        <div className={styles.partsGrid}>
          {filteredParts.map(part => (
            <PartCard key={part.id} part={part} />
          ))}
        </div>
      )}
    </div>
  );
}

// Part Card Component
function PartCard({ part }) {
  const formatPrice = (price) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className={styles.partCard}>
      <div className={styles.partCardHeader}>
        <span className={styles.partCategory}>{part.category || 'Part'}</span>
        {part.brand && <span className={styles.partBrand}>{part.brand}</span>}
      </div>
      <div className={styles.partCardBody}>
        <h3 className={styles.partName}>{part.name}</h3>
        {part.description && (
          <p className={styles.partDescription}>{part.description}</p>
        )}
      </div>
      <div className={styles.partCardStats}>
        {part.hp_gain && (
          <span className={styles.partStat}>
            <strong>+{part.hp_gain}</strong> HP
          </span>
        )}
        {part.tq_gain && (
          <span className={styles.partStat}>
            <strong>+{part.tq_gain}</strong> TQ
          </span>
        )}
      </div>
      <div className={styles.partCardFooter}>
        {(part.price_min || part.price_max) && (
          <span className={styles.partPrice}>
            {part.price_min && part.price_max 
              ? `${formatPrice(part.price_min)} - ${formatPrice(part.price_max)}`
              : formatPrice(part.price_min || part.price_max)
            }
          </span>
        )}
        <Link 
          href={`/tuning-shop?part=${part.id}`} 
          className={styles.partAction}
        >
          Add to Build
          <ChevronRightIcon />
        </Link>
      </div>
    </div>
  );
}

// Loading component
function PartsLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.loadingState}>
        <LoadingSpinner />
        <p>Loading parts database...</p>
      </div>
    </div>
  );
}

// Main export
export default function PartsPage() {
  return (
    <ErrorBoundary name="PartsPage" featureContext="parts">
      <Suspense fallback={<PartsLoading />}>
        <PartsContent />
      </Suspense>
    </ErrorBoundary>
  );
}
