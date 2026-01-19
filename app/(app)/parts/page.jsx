'use client';

/**
 * Parts Database Page - Build Pivot (January 2026)
 * 
 * GRAVL-Inspired Design:
 * - Full-screen category filter
 * - Clean, minimal part cards
 * - Slide-up panel for part details
 * - Native app-like experience
 */

import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import SlideUpPanel from '@/components/SlideUpPanel';
import styles from './page.module.css';

// Part categories with display names and icons
const CATEGORIES = [
  { id: 'all', label: 'All', icon: '⚙️' },
  { id: 'intake', label: 'Intake', icon: '💨' },
  { id: 'exhaust', label: 'Exhaust', icon: '🔥' },
  { id: 'turbo', label: 'Turbo/SC', icon: '🌀' },
  { id: 'ecu', label: 'ECU/Tune', icon: '💻' },
  { id: 'suspension', label: 'Suspension', icon: '🛞' },
  { id: 'brakes', label: 'Brakes', icon: '🛑' },
  { id: 'wheels', label: 'Wheels', icon: '⭕' },
  { id: 'cooling', label: 'Cooling', icon: '❄️' },
  { id: 'fuel', label: 'Fuel', icon: '⛽' },
  { id: 'drivetrain', label: 'Drivetrain', icon: '⚡' },
  { id: 'aero', label: 'Aero', icon: '🏎️' },
];

function PartsContent() {
  const [parts, setParts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPart, setSelectedPart] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

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

  // Filter parts based on search and category
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

      return true;
    });
  }, [parts, searchQuery, selectedCategory]);

  // Handle part selection
  const handlePartClick = useCallback((part) => {
    setSelectedPart(part);
    setShowDetailPanel(true);
  }, []);

  // Close detail panel
  const handleClosePanel = useCallback(() => {
    setShowDetailPanel(false);
    // Delay clearing selection for animation
    setTimeout(() => setSelectedPart(null), 300);
  }, []);

  // Format price
  const formatPrice = (price) => {
    if (!price) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <LoadingSpinner 
          variant="branded" 
          text="Loading Parts" 
          subtext="Fetching parts database..."
          fullPage 
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Parts</h1>
        <span className={styles.count}>{parts.length}</span>
      </header>

      {/* Search */}
      <div className={styles.searchContainer}>
        <SearchIcon />
        <input
          type="text"
          placeholder="Search parts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        {searchQuery && (
          <button 
            className={styles.clearSearch}
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <CloseIcon />
          </button>
        )}
      </div>

      {/* Category Pills */}
      <div className={styles.categoryScroll}>
        <div className={styles.categoryPills}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`${styles.categoryPill} ${selectedCategory === cat.id ? styles.categoryPillActive : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className={styles.categoryIcon}>{cat.icon}</span>
              <span className={styles.categoryLabel}>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Info */}
      <div className={styles.resultsInfo}>
        {filteredParts.length} {filteredParts.length === 1 ? 'part' : 'parts'}
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* Parts List */}
      {filteredParts.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>🔍</span>
          <h3>No parts found</h3>
          <p>Try adjusting your search or filters</p>
          <button 
            className={styles.clearBtn}
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className={styles.partsList}>
          {filteredParts.map(part => (
            <button
              key={part.id}
              className={styles.partCard}
              onClick={() => handlePartClick(part)}
            >
              <div className={styles.partMain}>
                <span className={styles.partCategory}>{part.category || 'Part'}</span>
                <h3 className={styles.partName}>{part.name}</h3>
                <span className={styles.partBrand}>{part.brand || 'Generic'}</span>
              </div>
              <div className={styles.partMeta}>
                <div className={styles.partGains}>
                  {part.hp_gain ? (
                    <span className={styles.hpGain}>+{part.hp_gain} HP</span>
                  ) : null}
                  {part.tq_gain ? (
                    <span className={styles.tqGain}>+{part.tq_gain} TQ</span>
                  ) : null}
                </div>
                {(part.price_min || part.price_max) && (
                  <span className={styles.partPrice}>
                    {part.price_min && part.price_max 
                      ? `${formatPrice(part.price_min)} - ${formatPrice(part.price_max)}`
                      : formatPrice(part.price_min || part.price_max)
                    }
                  </span>
                )}
              </div>
              <ChevronIcon />
            </button>
          ))}
        </div>
      )}

      {/* Part Detail Panel */}
      <SlideUpPanel
        isOpen={showDetailPanel}
        onClose={handleClosePanel}
        title={selectedPart?.name || 'Part Details'}
      >
        {selectedPart && (
          <PartDetail part={selectedPart} formatPrice={formatPrice} />
        )}
      </SlideUpPanel>
    </div>
  );
}

// Part Detail Component (shown in SlideUpPanel)
function PartDetail({ part, formatPrice }) {
  return (
    <div className={styles.partDetail}>
      {/* Header */}
      <div className={styles.detailHeader}>
        <span className={styles.detailCategory}>{part.category || 'Part'}</span>
        <h2 className={styles.detailName}>{part.name}</h2>
        <span className={styles.detailBrand}>{part.brand || 'Generic'}</span>
      </div>

      {/* Stats */}
      <div className={styles.detailStats}>
        {part.hp_gain && (
          <div className={styles.detailStat}>
            <span className={styles.detailStatValue}>+{part.hp_gain}</span>
            <span className={styles.detailStatLabel}>HP Gain</span>
          </div>
        )}
        {part.tq_gain && (
          <div className={styles.detailStat}>
            <span className={styles.detailStatValue}>+{part.tq_gain}</span>
            <span className={styles.detailStatLabel}>TQ Gain</span>
          </div>
        )}
        {(part.price_min || part.price_max) && (
          <div className={styles.detailStat}>
            <span className={styles.detailStatValue}>
              {part.price_min && part.price_max 
                ? `${formatPrice(part.price_min)} - ${formatPrice(part.price_max)}`
                : formatPrice(part.price_min || part.price_max)
              }
            </span>
            <span className={styles.detailStatLabel}>Price Range</span>
          </div>
        )}
      </div>

      {/* Description */}
      {part.description && (
        <div className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>Description</h3>
          <p className={styles.detailDescription}>{part.description}</p>
        </div>
      )}

      {/* Compatibility */}
      {part.compatible_cars && part.compatible_cars.length > 0 && (
        <div className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>Compatible Vehicles</h3>
          <div className={styles.compatibilityList}>
            {(Array.isArray(part.compatible_cars) ? part.compatible_cars : [part.compatible_cars]).map((car, idx) => (
              <span key={idx} className={styles.compatibilityTag}>{car}</span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {part.notes && (
        <div className={styles.detailSection}>
          <h3 className={styles.detailSectionTitle}>Notes</h3>
          <p className={styles.detailNotes}>{part.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className={styles.detailActions}>
        <Link 
          href={`/tuning-shop?part=${part.id}`}
          className={styles.addToBuildBtn}
        >
          Add to Build
        </Link>
      </div>
    </div>
  );
}

// Icons
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const ChevronIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// Loading component
function PartsLoading() {
  return (
    <div className={styles.page}>
      <LoadingSpinner 
        variant="branded" 
        text="Loading Parts" 
        subtext="Fetching parts database..."
        fullPage 
      />
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
