'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import styles from './SportsCarComparison.module.css';
import { carData as localCarData, categories, tierConfig, recommendationTypes } from '@/data/cars.js';
import { fetchCars } from '@/lib/carsClient.js';
import { 
  calculateWeightedScore, 
  calculateMaxScore, 
  getRecommendations,
  DEFAULT_WEIGHTS 
} from '@/lib/scoring.js';

// SVG Icons - Optimized for light theme
const Icons = {
  sound: ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
    </svg>
  ),
  interior: ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  track: ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  reliability: ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <polyline points="9 12 11 14 15 10"/>
    </svg>
  ),
  value: ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  driverFun: ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <polygon points="10 8 16 12 10 16 10 8"/>
    </svg>
  ),
  aftermarket: ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  search: ({ size = 18, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  trophy: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  ),
  zap: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  shield: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  tool: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  car: ({ size = 20, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  alertCircle: ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  externalLink: ({ size = 14, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  )
};

// Car data, categories, and tier config are imported from src/data/cars.js

// Categories with icons for UI (extending imported categories)
const categoriesWithIcons = categories.map(cat => ({
  ...cat,
  icon: Icons[cat.key] || Icons.alertCircle
}));

// Tier configuration with CSS classes
const tierConfigWithStyles = {
  premium: { ...tierConfig.premium, className: styles.tierPremium },
  'upper-mid': { ...tierConfig['upper-mid'], className: styles.tierUpper },
  mid: { ...tierConfig.mid, className: styles.tierMid },
  budget: { ...tierConfig.budget, className: styles.tierEntry }
};

// Recommendation types with icons for UI
const recommendationTypesWithIcons = [
  { key: 'top', label: 'Top Match', icon: Icons.trophy, colorVar: '--rec-top' },
  { key: 'sound', label: 'Best Sound & Feel', icon: Icons.sound, colorVar: '--rec-sound' },
  { key: 'track', label: 'Best for Track', icon: Icons.track, colorVar: '--rec-track' },
  { key: 'value', label: 'Best Value', icon: Icons.value, colorVar: '--rec-value' },
  { key: 'reliable', label: 'Most Reliable', icon: Icons.shield, colorVar: '--rec-reliable' },
  { key: 'modder', label: 'Best Aftermarket', icon: Icons.tool, colorVar: '--rec-aftermarket' }
];

// Get score badge class
const getScoreBadgeClass = (score) => {
  if (score >= 9) return styles.scoreBadgeExcellent;
  if (score >= 7) return styles.scoreBadgeGood;
  if (score >= 5) return styles.scoreBadgeAverage;
  return styles.scoreBadgePoor;
};

// Get total score class
const getTotalScoreClass = (score, maxScore) => {
  const ratio = score / maxScore;
  if (ratio >= 0.8) return styles.tableTotalHigh;
  if (ratio >= 0.65) return styles.tableTotalMid;
  return styles.tableTotalLow;
};

export default function SportsCarComparison() {
  // State for car data (fetched from Supabase or local fallback)
  const [carData, setCarData] = useState(localCarData);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  
  // State for user preferences
  const [weights, setWeights] = useState(() => DEFAULT_WEIGHTS);
  const [sortBy, setSortBy] = useState('total');
  const [priceMax, setPriceMax] = useState(100000);
  const [priceMin, setPriceMin] = useState(25000);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Refs
  const tableRef = useRef(null);
  const rowRefs = useRef({});

  // Fetch car data on mount
  useEffect(() => {
    let isMounted = true;
    
    async function loadCars() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const cars = await fetchCars();
        if (isMounted) {
          setCarData(cars);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[SportsCarComparison] Error loading cars:', err);
        if (isMounted) {
          setLoadError('Failed to load vehicle data. Using cached data.');
          setCarData(localCarData); // Fallback to local data
          setIsLoading(false);
        }
      }
    }
    
    loadCars();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate weighted total score using scoring library
  const calculateTotal = useCallback((car) => 
    calculateWeightedScore(car, weights),
    [weights]
  );

  // Maximum possible score based on current weights
  const maxScore = useMemo(() => 
    calculateMaxScore(weights),
    [weights]
  );

  // Filtered and sorted cars
  const filteredCars = useMemo(() => {
    return carData
      .filter(car => car.priceAvg >= priceMin && car.priceAvg <= priceMax)
      .filter(car => car.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(car => selectedCategory === 'all' || car.category === selectedCategory)
      .map(car => ({ ...car, total: calculateTotal(car) }))
      .sort((a, b) => {
        if (sortBy === 'price') return a.priceAvg - b.priceAvg;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return b[sortBy] - a[sortBy];
      });
  }, [carData, weights, sortBy, priceMin, priceMax, searchTerm, selectedCategory, calculateTotal]);

  // Personalized recommendations using scoring library
  const recommendations = useMemo(() => {
    return getRecommendations(filteredCars, weights);
  }, [filteredCars, weights]);

  // Active priorities for summary display
  const activePriorities = useMemo(() => 
    categoriesWithIcons
      .filter(cat => weights[cat.key] > 1)
      .map(cat => ({ ...cat, weight: weights[cat.key] })),
    [weights]
  );

  // Handle recommendation card click - expand and scroll to car
  const handleRecCardClick = useCallback((car) => {
    if (!car) return;
    setExpandedId(car.id);
    
    // Scroll to the row after a brief delay to allow expansion
    setTimeout(() => {
      const rowElement = rowRefs.current[car.id];
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, []);

  // Handle weight change
  const handleWeightChange = useCallback((key, value) => {
    setWeights(prev => ({ ...prev, [key]: parseFloat(value) }));
  }, []);

  // Handle price filter change
  const handlePriceChange = useCallback((e) => {
    const [min, max] = e.target.value.split('-').map(Number);
    setPriceMin(min);
    setPriceMax(max);
  }, []);

  // Get priority badge text and class
  const getPriorityBadge = (weight) => {
    if (weight === 0) return { text: 'Off', className: styles.priorityBadgeOff };
    if (weight === 1) return { text: 'Normal', className: styles.priorityBadge };
    return { text: `${weight}× Priority`, className: styles.priorityBadgeHigh };
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.main}>
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading vehicle database...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        {/* Error notice (non-blocking) */}
        {loadError && (
          <div className={styles.errorNotice}>
            <Icons.alertCircle size={16} />
            <span>{loadError}</span>
          </div>
        )}
        
        {/* Step 1: Define Priorities */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.stepBadge}>1</div>
            <h2 className={styles.sectionTitle}>Define Your Priorities</h2>
            <span className={styles.sectionMeta}>Adjust importance of each category</span>
          </div>

          <div className={styles.prioritiesGrid}>
            {categoriesWithIcons.map(cat => {
              const IconComponent = cat.icon;
              const isActive = weights[cat.key] > 0;
              const isHighPriority = weights[cat.key] > 1;
              const badge = getPriorityBadge(weights[cat.key]);
              
              return (
                <div 
                  key={cat.key} 
                  className={`${styles.priorityCard} ${isHighPriority ? styles.priorityCardActive : ''}`}
                >
                  <div className={styles.priorityCardHeader}>
                    <div className={styles.priorityCardIcon}>
                      <IconComponent size={18} />
                      <span className={styles.priorityCardLabel}>{cat.label}</span>
                    </div>
                    <span className={badge.className}>{badge.text}</span>
                  </div>
                  <p className={styles.priorityCardDesc}>{cat.desc}</p>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="0.5"
                    value={weights[cat.key]}
                    onChange={e => handleWeightChange(cat.key, e.target.value)}
                    className={styles.prioritySlider}
                    aria-label={`${cat.label} priority weight`}
                    style={{
                      background: `linear-gradient(to right, #1a4d6e 0%, #1a4d6e ${(weights[cat.key] / 3) * 100}%, #e5e5e5 ${(weights[cat.key] / 3) * 100}%, #e5e5e5 100%)`
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Priority Summary */}
          {activePriorities.length > 0 && (
            <div className={styles.prioritySummary}>
              <span className={styles.prioritySummaryLabel}>You're prioritizing:</span>
              <div className={styles.prioritySummaryTags}>
                {activePriorities.map(cat => {
                  const IconComponent = cat.icon;
                  return (
                    <span key={cat.key} className={styles.priorityTag}>
                      <IconComponent size={14} />
                      {cat.label} ({cat.weight}×)
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Step 2: Recommendations */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.stepBadge}>2</div>
            <h2 className={styles.sectionTitle}>Your Personalized Recommendations</h2>
          </div>

          <div className={styles.recommendationsGrid}>
            {recommendationTypesWithIcons.map(rec => {
              const car = recommendations[rec.key];
              const IconComponent = rec.icon;
              
              return (
                <div 
                  key={rec.key}
                  className={styles.recCard}
                  style={{ '--rec-color': `var(${rec.colorVar})` }}
                  onClick={() => handleRecCardClick(car)}
                  onKeyDown={e => e.key === 'Enter' && handleRecCardClick(car)}
                  tabIndex={car ? 0 : -1}
                  role="button"
                  aria-label={car ? `View ${car.name} - ${rec.label}` : `${rec.label} - No match`}
                >
                  <div className={styles.recCardHeader}>
                    <div className={styles.recCardIcon}>
                      <IconComponent size={18} />
                  </div>
                    <span className={styles.recCardLabel}>{rec.label}</span>
                  </div>
                  {car ? (
                    <>
                      <div className={styles.recCardName}>{car.name}</div>
                      <div className={styles.recCardPrice}>{car.priceRange}</div>
                      <div className={styles.recCardScore}>
                        Score: <strong>{car.total}</strong>/{maxScore}
                      </div>
                      {car.slug && (
                        <Link 
                          to={`/cars/${car.slug}`}
                          className={styles.recCardLink}
                          onClick={e => e.stopPropagation()}
                        >
                          View Profile <Icons.externalLink size={12} />
                        </Link>
                      )}
                    </>
                  ) : (
                    <div className={styles.recCardEmpty}>No match in current filters</div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Step 3: Explore All Vehicles */}
        <section className={styles.section} ref={tableRef}>
          <div className={styles.sectionHeader}>
            <div className={styles.stepBadge}>3</div>
            <h2 className={styles.sectionTitle}>Explore All Vehicles</h2>
            <span className={styles.sectionMeta}>{filteredCars.length} vehicles</span>
            </div>

            {/* Filters */}
          <div className={styles.filtersBar}>
            <div className={styles.filtersGroup}>
              <div className={styles.searchInput}>
                <div className={styles.searchInputIcon}>
                  <Icons.search size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  aria-label="Search vehicles"
                />
              </div>
              
              <select 
                value={selectedCategory} 
                onChange={e => setSelectedCategory(e.target.value)}
                className={styles.filterSelect}
                aria-label="Filter by engine layout"
              >
                <option value="all">All Types</option>
                <option value="Mid-Engine">Mid-Engine</option>
                <option value="Front-Engine">Front-Engine</option>
                <option value="Rear-Engine">Rear-Engine</option>
              </select>

              <select 
                value={`${priceMin}-${priceMax}`} 
                onChange={handlePriceChange}
                className={styles.filterSelect}
                aria-label="Filter by price range"
              >
                <option value="25000-100000">$25K – $100K</option>
                <option value="25000-50000">$25K – $50K</option>
                <option value="40000-75000">$40K – $75K</option>
                <option value="60000-100000">$60K – $100K</option>
              </select>

              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className={styles.filterSelect}
                aria-label="Sort vehicles by"
              >
                <option value="total">Sort by Score</option>
                <option value="price">Sort by Price</option>
                {categories.map(c => (
                  <option key={c.key} value={c.key}>Sort by {c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Data Table */}
          <div className={styles.tableWrapper}>
            {filteredCars.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyStateIcon}>
                  <Icons.alertCircle size={32} />
                </div>
                <h3>No vehicles found</h3>
                <p>Try adjusting your filters or widening the price range.</p>
              </div>
            ) : (
              <div className={styles.tableScrollContainer}>
                {/* Table Header - Desktop only */}
                <div className={styles.tableHeader}>
              <span>Rank</span>
              <span>Vehicle</span>
                  {categoriesWithIcons.map(cat => {
                    const IconComponent = cat.icon;
                return (
                      <div key={cat.key} className={styles.tableHeaderIcon} title={cat.label}>
                        <IconComponent size={16} />
                  </div>
                );
              })}
              <span style={{ textAlign: 'center' }}>Score</span>
              <span style={{ textAlign: 'right' }}>Price</span>
            </div>

            {/* Table Rows */}
                {filteredCars.map((car, index) => {
              const isExpanded = expandedId === car.id;
                  const tier = tierConfigWithStyles[car.tier];
                  const isTop = index === 0;
                  const isPodium = index < 3;
              
              return (
                    <div 
                      key={car.id}
                      ref={el => rowRefs.current[car.id] = el}
                    >
                      {/* Desktop Row */}
                      {!isMobile ? (
                        <div
                          className={`${styles.tableRow} ${isTop ? styles.tableRowTop : ''}`}
                    onClick={() => setExpandedId(isExpanded ? null : car.id)}
                          onKeyDown={e => e.key === 'Enter' && setExpandedId(isExpanded ? null : car.id)}
                          tabIndex={0}
                          role="button"
                          aria-expanded={isExpanded}
                          aria-label={`${car.name}, rank ${index + 1}, score ${car.total}`}
                        >
                          <span className={`${styles.tableRank} ${isTop ? styles.tableRankTop : isPodium ? styles.tableRankPodium : ''}`}>
                            {index + 1}
                    </span>
                    
                          <div className={styles.tableVehicle}>
                            <div className={styles.tableVehicleName}>
                              <span className={styles.tableVehicleTitle}>{car.name}</span>
                              <span className={`${styles.tierChip} ${tier.className}`}>
                                {tier.label}
                        </span>
                      </div>
                            <div className={styles.tableVehicleMeta}>
                        {car.years} · {car.category}
                      </div>
                    </div>

                    {categories.map(cat => (
                            <div key={cat.key} className={styles.scoreCell}>
                              <div className={`${styles.scoreBadge} ${getScoreBadgeClass(car[cat.key])}`}>
                          {car[cat.key]}
                        </div>
                      </div>
                    ))}

                          <div className={styles.tableTotal}>
                            <span className={`${styles.tableTotalScore} ${getTotalScoreClass(car.total, maxScore)}`}>
                        {car.total}
                      </span>
                    </div>

                          <div className={styles.tablePrice}>
                      {car.priceRange}
                          </div>
                        </div>
                      ) : (
                        /* Mobile Card */
                        <div
                          className={`${styles.tableRow} ${isTop ? styles.tableRowTop : ''}`}
                          onClick={() => setExpandedId(isExpanded ? null : car.id)}
                          onKeyDown={e => e.key === 'Enter' && setExpandedId(isExpanded ? null : car.id)}
                          tabIndex={0}
                          role="button"
                          aria-expanded={isExpanded}
                        >
                          <div className={styles.mobileCard}>
                            <div className={styles.mobileCardHeader}>
                              <div className={`${styles.mobileCardRank} ${isTop ? styles.mobileCardRankTop : ''}`}>
                                {index + 1}
                              </div>
                              <div className={styles.mobileCardInfo}>
                                <div className={styles.tableVehicleName}>
                                  <span className={styles.tableVehicleTitle}>{car.name}</span>
                                  <span className={`${styles.tierChip} ${tier.className}`}>
                                    {tier.label}
                                  </span>
                                </div>
                                <div className={styles.tableVehicleMeta}>
                                  {car.years} · {car.category}
                                </div>
                              </div>
                              <div className={styles.mobileCardPrice}>
                                <div className={styles.mobileCardPriceValue}>{car.priceRange}</div>
                                <div className={styles.mobileCardPriceScore}>
                                  Score: <strong>{car.total}</strong>
                                </div>
                              </div>
                            </div>
                            <div className={styles.mobileCardScores}>
                              {categoriesWithIcons.map(cat => {
                                const IconComponent = cat.icon;
                                return (
                                  <div 
                                    key={cat.key} 
                                    className={styles.mobileScorePill}
                                    title={cat.label}
                                  >
                                    <IconComponent size={14} />
                                    <span className={getScoreBadgeClass(car[cat.key]).replace(styles.scoreBadge, '')}>
                                      {car[cat.key]}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className={styles.expandedRow}>
                          <div className={styles.expandedGrid}>
                            <div className={styles.expandedSection}>
                              <h4>Specifications</h4>
                              <div className={styles.expandedSpecs}>
                                <div><span>Engine:</span> {car.engine}</div>
                                <div><span>Power:</span> {car.hp} hp</div>
                                <div><span>Transmission:</span> {car.trans}</div>
                              </div>
                            </div>
                            <div className={styles.expandedSection}>
                              <h4>Notes</h4>
                              <p className={styles.expandedNotes}>{car.notes}</p>
                            </div>
                            <div className={styles.expandedSection}>
                              <h4>Highlight</h4>
                              <span className={styles.highlightBadge}>{car.highlight}</span>
                            </div>
                          </div>
                          {car.slug && (
                            <div className={styles.expandedActions}>
                              <Link href={`/cars/${car.slug}`} className={styles.viewProfileButton}>
                                View Full Profile <Icons.externalLink size={14} />
                              </Link>
                            </div>
                          )}
                        </div>
                      )}
                </div>
              );
            })}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
