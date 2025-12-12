'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { fetchCarBySlug } from '@/lib/carsClient.js';
import { getCarBySlug as getLocalCarBySlug, tierConfig } from '@/data/cars.js';
import { calculateScoreBreakdown, getScoreLabel, DEFAULT_WEIGHTS } from '@/lib/scoring.js';
import CarImage from '@/components/CarImage';
import ScoringInfo from '@/components/ScoringInfo';
import ExpertReviews from '@/components/ExpertReviews';
import { useCarSelection } from '@/components/providers/CarSelectionProvider';
import FavoriteButton from '@/components/FavoriteButton';
import CompareButton from '@/components/CompareButton';

// Icons - compact inline SVG components
const Icons = {
  arrowLeft: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  x: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  zap: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  target: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  tool: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  alertCircle: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  gauge: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  ),
  book: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  car: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
      <circle cx="6.5" cy="16.5" r="2.5"/>
      <circle cx="16.5" cy="16.5" r="2.5"/>
    </svg>
  ),
  shield: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  dollar: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  flag: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  users: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  star: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  play: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  externalLink: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  chevronDown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  chevronUp: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  ),
  trendingUp: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  trendingDown: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
      <polyline points="17 18 23 18 23 12"/>
    </svg>
  ),
  minus: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  heart: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  clipboard: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  plus: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  checkCircle: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  timer: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  layers: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  activity: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  cpu: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" />
      <line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" />
      <line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" />
      <line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" />
      <line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  ),
  engine: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="8" rx="2" />
      <path d="M6 10V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4" />
      <line x1="2" y1="13" x2="4" y2="13" />
      <line x1="20" y1="13" x2="22" y2="13" />
      <circle cx="12" cy="14" r="3" />
      <line x1="12" y1="4" x2="12" y2="2" />
    </svg>
  ),
};

// Tab definitions
const TABS = [
  { id: 'overview', label: 'Overview', icon: Icons.car },
  { id: 'buying', label: 'Buying Guide', icon: Icons.clipboard },
  { id: 'ownership', label: 'Ownership', icon: Icons.dollar },
  { id: 'reviews', label: 'Reviews', icon: Icons.star },
];

// Get tier badge class
const getTierClass = (tier) => {
  const tierClasses = {
    premium: styles.tierPremium,
    'upper-mid': styles.tierUpper,
    mid: styles.tierMid,
    budget: styles.tierEntry,
  };
  return tierClasses[tier] || styles.tierMid;
};

// Get score tier class
const getScoreTierClass = (score) => {
  if (score >= 9) return styles.scoreExcellent;
  if (score >= 7) return styles.scoreGood;
  if (score >= 5) return styles.scoreAverage;
  return styles.scorePoor;
};

// Get market position icon
const getMarketIcon = (position) => {
  switch (position) {
    case 'appreciating': return <Icons.trendingUp size={16} />;
    case 'depreciating': return <Icons.trendingDown size={16} />;
    default: return <Icons.minus size={16} />;
  }
};

// Expandable Section Component (for use within tabs)
function ExpandableSection({ title, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className={styles.expandableSection}>
      <button 
        className={styles.expandableHeader} 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{title}</span>
        {isOpen ? <Icons.chevronUp size={20} /> : <Icons.chevronDown size={20} />}
      </button>
      {isOpen && <div className={styles.expandableContent}>{children}</div>}
    </div>
  );
}

export default function CarDetail() {
  const params = useParams();
  const slug = params.slug;
  const [car, setCar] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Car selection integration
  const { selectedCar, selectCar, isHydrated } = useCarSelection();
  const isThisCarSelected = isHydrated && selectedCar?.slug === slug;

  // Fetch car data
  useEffect(() => {
    let isMounted = true;

    async function loadCar() {
      try {
        setIsLoading(true);
        setError(null);
        const carData = await fetchCarBySlug(slug);
        
        if (isMounted) {
          if (carData) {
            setCar(carData);
          } else {
            const localCar = getLocalCarBySlug(slug);
            if (localCar) {
              setCar(localCar);
            } else {
              setError('Vehicle not found');
            }
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[CarDetail] Error loading car:', err);
        if (isMounted) {
          const localCar = getLocalCarBySlug(slug);
          if (localCar) {
            setCar(localCar);
          } else {
            setError('Failed to load vehicle data');
          }
          setIsLoading(false);
        }
      }
    }

    loadCar();
    return () => { isMounted = false; };
  }, [slug]);

  // Calculate score breakdown
  const scoreBreakdown = useMemo(() => {
    if (!car) return [];
    return calculateScoreBreakdown(car, DEFAULT_WEIGHTS);
  }, [car]);

  // Calculate average score for quick take
  const averageScore = useMemo(() => {
    if (!scoreBreakdown.length) return null;
    const sum = scoreBreakdown.reduce((acc, s) => acc + s.rawScore, 0);
    return (sum / scoreBreakdown.length).toFixed(1);
  }, [scoreBreakdown]);

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading vehicle...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !car) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <Icons.alertCircle size={48} />
          <h2>{error || 'Vehicle not found'}</h2>
          <p>The vehicle you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.</p>
          <Link href="/car-selector" className={styles.backButton}>
            <Icons.arrowLeft size={18} />
            Back to Car Selector
          </Link>
        </div>
      </div>
    );
  }

  const tier = tierConfig[car.tier] || { label: car.tier };

  return (
    <div className={styles.container}>
      {/* ================================================================
          HERO SECTION - Compact, impactful first impression
          ================================================================ */}
      <section className={styles.heroSection}>
        <div className={styles.heroInner}>
          <div className={styles.heroMain}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadges}>
                <span className={`${styles.tierBadge} ${getTierClass(car.tier)}`}>
                  {tier.label}
                </span>
                <span className={styles.categoryBadge}>{car.category}</span>
                {car.brand && <span className={styles.brandBadge}>{car.brand}</span>}
              </div>
              
              <h1 className={styles.heroTitle}>{car.name}</h1>
              <p className={styles.heroYears}>{car.years}</p>
              
              {car.essence && (
                <p className={styles.heroEssence}>{car.essence}</p>
              )}
              
              <div className={styles.heroHighlight}>
                <Icons.zap size={18} />
                <span>{car.highlight}</span>
              </div>
              
              {/* Actions */}
              <div className={styles.heroActions}>
                <FavoriteButton car={car} variant="icon" />
                <CompareButton car={car} variant="icon" />
                <button 
                  onClick={() => selectCar(car)}
                  className={`${styles.modButton} ${isThisCarSelected ? styles.modButtonActive : ''}`}
                  disabled={isThisCarSelected}
                  title={isThisCarSelected ? 'Car selected for upgrades' : 'Select this car for upgrades'}
                  aria-label={isThisCarSelected ? 'Car selected for upgrades' : 'Select this car for upgrades'}
                >
                  {isThisCarSelected ? <Icons.checkCircle size={20} /> : <Icons.tool size={20} />}
                </button>
              </div>
            </div>
            
            <div className={styles.heroImageWrapper}>
              <CarImage car={car} variant="hero" className={styles.heroImage} lazy={false} />
            </div>
          </div>
          
          <div className={styles.specBar}>
            <div className={styles.specItem}>
              <Icons.engine size={20} />
              <div className={styles.specContent}>
                <span className={styles.specLabel}>Engine</span>
                <span className={styles.specValue}>{car.engine}</span>
              </div>
            </div>
            <div className={styles.specItem}>
              <Icons.zap size={20} />
              <div className={styles.specContent}>
                <span className={styles.specLabel}>Power</span>
                <span className={styles.specValue}>{car.hp} hp</span>
              </div>
            </div>
            {car.torque && (
              <div className={styles.specItem}>
                <Icons.activity size={20} />
                <div className={styles.specContent}>
                  <span className={styles.specLabel}>Torque</span>
                  <span className={styles.specValue}>{car.torque} lb-ft</span>
                </div>
              </div>
            )}
            {car.zeroToSixty && (
              <div className={styles.specItem}>
                <Icons.timer size={20} />
                <div className={styles.specContent}>
                  <span className={styles.specLabel}>0-60 mph</span>
                  <span className={styles.specValue}>{car.zeroToSixty}s</span>
                </div>
              </div>
            )}
            <div className={styles.specItem}>
              <Icons.layers size={20} />
              <div className={styles.specContent}>
                <span className={styles.specLabel}>Trans</span>
                <span className={styles.specValue}>{car.trans}</span>
              </div>
            </div>
            <div className={styles.specItem}>
              <Icons.dollar size={20} />
              <div className={styles.specContent}>
                <span className={styles.specLabel}>Price</span>
                <span className={styles.specValue}>{car.priceRange}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          QUICK TAKE - 30-second summary for fast scanners
          ================================================================ */}
      <section className={styles.quickTake}>
        <div className={styles.quickTakeInner}>
          <div className={styles.quickTakeHeader}>
            <h2>Quick Take</h2>
            {averageScore && (
              <div className={`${styles.quickScore} ${getScoreTierClass(parseFloat(averageScore))}`}>
                <span className={styles.quickScoreValue}>{averageScore}</span>
                <span className={styles.quickScoreLabel}>/ 10</span>
              </div>
            )}
          </div>
          
          {/* What's Special */}
          <div className={styles.quickTakeContent}>
            {car.notes && (
              <p className={styles.quickSummary}>{car.notes}</p>
            )}
            
            <div className={styles.quickGrid}>
              {/* Best For */}
              {car.bestFor?.length > 0 && (
                <div className={styles.quickCard}>
                  <h3>Best For</h3>
                  <div className={styles.quickTags}>
                    {car.bestFor.slice(0, 3).map((item, i) => (
                      <span key={i} className={styles.quickTag}>{item}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Key Strength */}
              {car.definingStrengths?.[0] && (
                <div className={styles.quickCard}>
                  <h3>
                    <Icons.check size={16} />
                    Key Strength
                  </h3>
                  <p>{car.definingStrengths[0].title}</p>
                </div>
              )}
              
              {/* Watch Out For */}
              {car.honestWeaknesses?.[0] && (
                <div className={styles.quickCard}>
                  <h3>
                    <Icons.x size={16} />
                    Watch For
                  </h3>
                  <p>{car.honestWeaknesses[0].title}</p>
                </div>
              )}
              
              {/* Price Snapshot */}
              {car.priceGuide?.mid && (
                <div className={styles.quickCard}>
                  <h3>Sweet Spot Price</h3>
                  <p className={styles.quickPrice}>{car.priceGuide.mid.price}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          TAB NAVIGATION - Clean, scannable navigation
          ================================================================ */}
      <nav className={styles.tabNav}>
        <div className={styles.tabNavInner}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ================================================================
          TAB CONTENT - Progressive disclosure
          ================================================================ */}
      <div className={styles.tabContent}>
        
        {/* ============================================================
            TAB: OVERVIEW - The story, driving experience, strengths
            ============================================================ */}
        {activeTab === 'overview' && (
          <div className={styles.tabPanel}>
            
            {/* The Story */}
            {(car.heritage || car.designPhilosophy) && (
              <section className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <Icons.book size={22} />
                  <h2>The Story</h2>
                </div>
                
                {car.heritage && (
                  <div className={styles.storyBlock}>
                    <h3>Heritage & Legacy</h3>
                    <div className={styles.storyText}>
                      {car.heritage.split('\n\n').map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </div>
                )}
                
                {car.designPhilosophy && (
                  <div className={styles.storyBlock}>
                    <h3>Design Philosophy</h3>
                    <div className={styles.storyText}>
                      {car.designPhilosophy.split('\n\n').map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Lineage */}
                {(car.predecessors?.length > 0 || car.generationCode) && (
                  <div className={styles.lineageBar}>
                    {car.predecessors?.length > 0 && (
                      <div className={styles.lineageItem}>
                        <span className={styles.lineageLabel}>Preceded by</span>
                        <span className={styles.lineageValue}>{car.predecessors.join(', ')}</span>
                      </div>
                    )}
                    {car.generationCode && (
                      <div className={styles.lineageItem}>
                        <span className={styles.lineageLabel}>Generation</span>
                        <span className={styles.lineageValue}>{car.generationCode}</span>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Driving Experience */}
            {(car.engineCharacter || car.chassisDynamics || car.transmissionFeel) && (
              <section className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <Icons.car size={22} />
                  <h2>The Driving Experience</h2>
                </div>
                
                <div className={styles.experienceGrid}>
                  {car.engineCharacter && (
                    <div className={styles.experienceCard}>
                      <h3>Engine Character</h3>
                      <p>{car.engineCharacter.split('\n\n')[0]}</p>
                    </div>
                  )}
                  {car.chassisDynamics && (
                    <div className={styles.experienceCard}>
                      <h3>Chassis Dynamics</h3>
                      <p>{car.chassisDynamics.split('\n\n')[0]}</p>
                    </div>
                  )}
                  {car.transmissionFeel && (
                    <div className={styles.experienceCard}>
                      <h3>Transmission Feel</h3>
                      <p>{car.transmissionFeel.split('\n\n')[0]}</p>
                    </div>
                  )}
                  {car.steeringFeel && (
                    <div className={styles.experienceCard}>
                      <h3>Steering Feel</h3>
                      <p>{car.steeringFeel.split('\n\n')[0]}</p>
                    </div>
                  )}
                  {car.soundSignature && (
                    <div className={styles.experienceCard}>
                      <h3>Sound Signature</h3>
                      <p>{car.soundSignature.split('\n\n')[0]}</p>
                    </div>
                  )}
                  {car.brakeConfidence && (
                    <div className={styles.experienceCard}>
                      <h3>Brake Confidence</h3>
                      <p>{car.brakeConfidence.split('\n\n')[0]}</p>
                    </div>
                  )}
                </div>

                {car.comfortNotes && (
                  <div className={styles.dailyBox}>
                    <div className={styles.dailyHeader}>
                      <h4>Daily Usability</h4>
                      {car.comfortTrackBalance && (
                        <span className={styles.balanceBadge}>
                          {car.comfortTrackBalance.replace('-', ' ')}
                        </span>
                      )}
                    </div>
                    <p>{car.comfortNotes}</p>
                  </div>
                )}
              </section>
            )}

            {/* Strengths & Tradeoffs */}
            <section className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <Icons.shield size={22} />
                <h2>Strengths & Tradeoffs</h2>
              </div>
              
              <div className={styles.prosConsGrid}>
                {/* Strengths */}
                <div className={styles.prosColumn}>
                  <h3 className={styles.prosTitle}>
                    <Icons.check size={18} />
                    Defining Strengths
                  </h3>
                  {car.definingStrengths?.length > 0 ? (
                    <div className={styles.prosConsList}>
                      {car.definingStrengths.map((item, i) => (
                        <div key={i} className={styles.strengthItem}>
                          <strong>{item.title}</strong>
                          <p>{item.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : car.pros?.length > 0 ? (
                    <ul className={styles.simpleList}>
                      {car.pros.map((pro, i) => (
                        <li key={i}>
                          <Icons.check size={14} />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {/* Tradeoffs */}
                <div className={styles.consColumn}>
                  <h3 className={styles.consTitle}>
                    <Icons.x size={18} />
                    Honest Tradeoffs
                  </h3>
                  {car.honestWeaknesses?.length > 0 ? (
                    <div className={styles.prosConsList}>
                      {car.honestWeaknesses.map((item, i) => (
                        <div key={i} className={styles.weaknessItem}>
                          <strong>{item.title}</strong>
                          <p>{item.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : car.cons?.length > 0 ? (
                    <ul className={styles.simpleList}>
                      {car.cons.map((con, i) => (
                        <li key={i}>
                          <Icons.x size={14} />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>

              {/* Ideal Owner */}
              {(car.idealOwner || car.notIdealFor) && (
                <div className={styles.ownerFit}>
                  {car.idealOwner && (
                    <div className={styles.fitCard}>
                      <h4><Icons.check size={16} /> Ideal Owner</h4>
                      <p>{car.idealOwner}</p>
                    </div>
                  )}
                  {car.notIdealFor && (
                    <div className={styles.fitCard}>
                      <h4><Icons.x size={16} /> Not Ideal For</h4>
                      <p>{car.notIdealFor}</p>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ============================================================
            TAB: BUYING GUIDE - Years, options, pricing, alternatives
            ============================================================ */}
        {activeTab === 'buying' && (
          <div className={styles.tabPanel}>
            
            {/* Buyer's Summary */}
            {car.buyersSummary && (
              <div className={styles.buyersSummary}>
                <p>{car.buyersSummary}</p>
              </div>
            )}

            {/* Market Position */}
            {car.marketPosition && (
              <div className={`${styles.marketBadge} ${styles[car.marketPosition]}`}>
                {getMarketIcon(car.marketPosition)}
                <span>Market: {car.marketPosition.charAt(0).toUpperCase() + car.marketPosition.slice(1)}</span>
              </div>
            )}

            {/* Best Years */}
            {car.bestYearsDetailed?.length > 0 && (
              <section className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <Icons.check size={22} />
                  <h2>Best Years to Buy</h2>
                </div>
                <div className={styles.yearsList}>
                  {car.bestYearsDetailed.map((item, i) => (
                    <div key={i} className={styles.yearItem}>
                      <span className={styles.yearBadge}>{item.years}</span>
                      <p>{item.reason}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Years to Avoid */}
            {car.yearsToAvoidDetailed?.length > 0 && (
              <section className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <Icons.x size={22} />
                  <h2>Years to Avoid</h2>
                </div>
                <div className={styles.yearsList}>
                  {car.yearsToAvoidDetailed.map((item, i) => (
                    <div key={i} className={`${styles.yearItem} ${styles.avoid}`}>
                      <span className={`${styles.yearBadge} ${styles.avoid}`}>{item.years}</span>
                      <p>{item.reason}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Must-Have Options */}
            {car.mustHaveOptions?.length > 0 && (
              <section className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <Icons.star size={22} />
                  <h2>Must-Have Options</h2>
                </div>
                <div className={styles.optionsList}>
                  {car.mustHaveOptions.map((opt, i) => (
                    <div key={i} className={styles.optionItem}>
                      <strong><Icons.check size={14} /> {opt.name}</strong>
                      <p>{opt.reason}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Price Guide */}
            {car.priceGuide && (
              <section className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <Icons.dollar size={22} />
                  <h2>Price Guide</h2>
                </div>
                <div className={styles.priceGrid}>
                  {car.priceGuide?.low && (
                    <div className={styles.priceCard}>
                      <span className={styles.priceLabel}>Entry Level</span>
                      <span className={styles.priceValue}>{car.priceGuide.low.price}</span>
                      <p>{car.priceGuide.low.condition}</p>
                    </div>
                  )}
                  {car.priceGuide?.mid && (
                    <div className={`${styles.priceCard} ${styles.recommended}`}>
                      <span className={styles.priceLabel}>Sweet Spot</span>
                      <span className={styles.priceValue}>{car.priceGuide.mid.price}</span>
                      <p>{car.priceGuide.mid.condition}</p>
                    </div>
                  )}
                  {car.priceGuide?.high && (
                    <div className={styles.priceCard}>
                      <span className={styles.priceLabel}>Collector Grade</span>
                      <span className={styles.priceValue}>{car.priceGuide.high.price}</span>
                      <p>{car.priceGuide.high.condition}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Alternatives */}
            {(car.directCompetitors || car.ifYouWantMore || car.ifYouWantLess) && (
              <section className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <Icons.target size={22} />
                  <h2>Alternatives to Consider</h2>
                </div>

                {Array.isArray(car.directCompetitors) && car.directCompetitors.length > 0 && (
                  <div className={styles.alternativesBlock}>
                    <h3>Direct Competitors</h3>
                    <div className={styles.altList}>
                      {car.directCompetitors.map((alt, i) => (
                        <Link key={i} href={alt.slug ? `/cars/${alt.slug}` : '#'} className={styles.altCard}>
                          <strong>{alt.name}</strong>
                          <p>{alt.comparison}</p>
                          <Icons.externalLink size={14} />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(car.ifYouWantMore) && car.ifYouWantMore.length > 0 && (
                  <div className={styles.alternativesBlock}>
                    <h3>If You Want More</h3>
                    <div className={styles.altList}>
                      {car.ifYouWantMore.map((alt, i) => (
                        <Link key={i} href={alt.slug ? `/cars/${alt.slug}` : '#'} className={styles.altCard}>
                          <strong>{alt.name}</strong>
                          <p>{alt.reason}</p>
                          <Icons.externalLink size={14} />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(car.ifYouWantLess) && car.ifYouWantLess.length > 0 && (
                  <div className={styles.alternativesBlock}>
                    <h3>Save Money With</h3>
                    <div className={styles.altList}>
                      {car.ifYouWantLess.map((alt, i) => (
                        <Link key={i} href={alt.slug ? `/cars/${alt.slug}` : '#'} className={styles.altCard}>
                          <strong>{alt.name}</strong>
                          <p>{alt.reason || alt.comparison}</p>
                          <Icons.externalLink size={14} />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Pre-Purchase Checklist */}
            {car.preInspectionChecklist?.length > 0 && (
              <ExpandableSection title="Pre-Purchase Inspection Checklist">
                <ul className={styles.checklist}>
                  {car.preInspectionChecklist.map((item, i) => (
                    <li key={i}>
                      <Icons.check size={14} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {car.ppiRecommendations && (
                  <p className={styles.ppiNote}>{car.ppiRecommendations}</p>
                )}
              </ExpandableSection>
            )}
          </div>
        )}

        {/* ============================================================
            TAB: OWNERSHIP - Costs, issues, community, track
            ============================================================ */}
        {activeTab === 'ownership' && (
          <div className={styles.tabPanel}>

            {/* Annual Costs */}
            {car.annualOwnershipCost && (
              <section className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <Icons.dollar size={22} />
                  <h2>Annual Ownership Cost</h2>
                </div>
                <div className={styles.costGrid}>
                  <div className={styles.costCard}>
                    <span className={styles.costLabel}>Light Use</span>
                    <span className={styles.costValue}>{car.annualOwnershipCost.low}</span>
                  </div>
                  <div className={`${styles.costCard} ${styles.typical}`}>
                    <span className={styles.costLabel}>Typical</span>
                    <span className={styles.costValue}>{car.annualOwnershipCost.typical}</span>
                  </div>
                  <div className={styles.costCard}>
                    <span className={styles.costLabel}>Heavy/Track</span>
                    <span className={styles.costValue}>{car.annualOwnershipCost.heavy}</span>
                  </div>
                </div>
                {car.annualOwnershipCost.notes && (
                  <p className={styles.costNotes}>{car.annualOwnershipCost.notes}</p>
                )}
              </section>
            )}

            {/* Major Service Costs */}
            {car.majorServiceCosts && (
              <section className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <Icons.tool size={22} />
                  <h2>Major Service Costs</h2>
                </div>
                <div className={styles.serviceGrid}>
                  {car.majorServiceCosts.oilChange && (
                    <div className={styles.serviceCard}>
                      <h4>Oil Change</h4>
                      <span className={styles.serviceCost}>{car.majorServiceCosts.oilChange.cost}</span>
                      <span className={styles.serviceInterval}>{car.majorServiceCosts.oilChange.interval}</span>
                    </div>
                  )}
                  {car.majorServiceCosts.majorService && (
                    <div className={styles.serviceCard}>
                      <h4>Major Service</h4>
                      <span className={styles.serviceCost}>{car.majorServiceCosts.majorService.cost}</span>
                      <span className={styles.serviceInterval}>{car.majorServiceCosts.majorService.interval}</span>
                    </div>
                  )}
                  {car.majorServiceCosts.brakes && (
                    <div className={styles.serviceCard}>
                      <h4>Brakes</h4>
                      <span className={styles.serviceCost}>{car.majorServiceCosts.brakes.cost}</span>
                      <span className={styles.serviceInterval}>{car.majorServiceCosts.brakes.typicalLife}</span>
                    </div>
                  )}
                  {car.majorServiceCosts.tires && (
                    <div className={styles.serviceCard}>
                      <h4>Tires</h4>
                      <span className={styles.serviceCost}>{car.majorServiceCosts.tires.cost}</span>
                      <span className={styles.serviceInterval}>{car.majorServiceCosts.tires.typicalLife}</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Known Issues */}
            {car.commonIssuesDetailed?.length > 0 && (
              <section className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <Icons.alertCircle size={22} />
                  <h2>Known Issues</h2>
                </div>
                <div className={styles.issuesList}>
                  {car.commonIssuesDetailed.map((issue, i) => (
                    <div key={i} className={`${styles.issueCard} ${styles[issue.severity]}`}>
                      <div className={styles.issueHeader}>
                        <strong>{issue.issue}</strong>
                        <div className={styles.issueMeta}>
                          <span className={`${styles.severityBadge} ${styles[issue.severity]}`}>
                            {issue.severity}
                          </span>
                          <span className={styles.frequencyBadge}>{issue.frequency}</span>
                        </div>
                      </div>
                      <p>{issue.notes}</p>
                      <span className={styles.issueCost}>Typical: {issue.cost}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Track & Performance */}
            {(car.trackReadiness || car.recommendedTrackPrep) && (
              <section className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <Icons.flag size={22} />
                  <h2>Track & Performance</h2>
                </div>

                {car.trackReadiness && (
                  <div className={`${styles.trackBadge} ${styles[car.trackReadiness]}`}>
                    <Icons.flag size={18} />
                    <span>{car.trackReadiness.replace('-', ' ')}</span>
                  </div>
                )}

                {car.trackReadinessNotes && (
                  <p className={styles.trackNotes}>{car.trackReadinessNotes}</p>
                )}

                {car.recommendedTrackPrep?.length > 0 && (
                  <ExpandableSection title="Recommended Track Prep">
                    <div className={styles.trackPrepList}>
                      {car.recommendedTrackPrep.map((item, i) => (
                        <div key={i} className={`${styles.trackPrepItem} ${styles[item.priority]}`}>
                          <div className={styles.trackPrepHeader}>
                            <strong>{item.item}</strong>
                            <span className={`${styles.priorityBadge} ${styles[item.priority]}`}>
                              {item.priority}
                            </span>
                          </div>
                          <span className={styles.trackPrepCost}>{item.cost}</span>
                          <p>{item.notes}</p>
                        </div>
                      ))}
                    </div>
                  </ExpandableSection>
                )}
              </section>
            )}

            {/* Community */}
            {(car.communityStrength || car.keyResources) && (
              <section className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <Icons.users size={22} />
                  <h2>Community & Culture</h2>
                </div>

                {car.communityStrength && (
                  <div className={styles.communityBar}>
                    <span>Community Strength</span>
                    <div className={styles.strengthMeter}>
                      <div 
                        className={styles.strengthFill} 
                        style={{ width: `${car.communityStrength * 10}%` }}
                      />
                    </div>
                    <span>{car.communityStrength}/10</span>
                  </div>
                )}

                {car.communityNotes && (
                  <p className={styles.communityNotes}>{car.communityNotes}</p>
                )}

                {car.keyResources?.length > 0 && (
                  <div className={styles.resourcesGrid}>
                    {car.keyResources.map((res, i) => (
                      <a 
                        key={i} 
                        href={res.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.resourceCard}
                      >
                        <strong>{res.name}</strong>
                        <span className={styles.resourceType}>{res.type}</span>
                        <p>{res.notes}</p>
                      </a>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Ownership Meta */}
            <div className={styles.ownershipMeta}>
              {car.partsAvailability && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Parts Availability</span>
                  <span className={`${styles.metaValue} ${styles[car.partsAvailability]}`}>
                    {car.partsAvailability}
                  </span>
                </div>
              )}
              {car.diyFriendliness && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>DIY Friendly</span>
                  <span className={styles.metaValue}>{car.diyFriendliness}/10</span>
                </div>
              )}
              {car.dealerVsIndependent && (
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Service</span>
                  <span className={styles.metaValue}>{car.dealerVsIndependent}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================
            TAB: REVIEWS - Expert reviews, scores, media
            ============================================================ */}
        {activeTab === 'reviews' && (
          <div className={styles.tabPanel}>

            {/* Expert Reviews (YouTube AI) */}
            <section className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <Icons.play size={22} />
                <h2>Expert Reviews</h2>
              </div>
              <ExpertReviews carSlug={car.slug} car={car} />
            </section>

            {/* Expert Quotes */}
            {car.expertQuotes?.length > 0 && (
              <section className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <Icons.star size={22} />
                  <h2>What Experts Say</h2>
                </div>
                <div className={styles.quotesGrid}>
                  {car.expertQuotes.map((quote, i) => (
                    <blockquote key={i} className={styles.expertQuote}>
                      <p>&ldquo;{quote.quote}&rdquo;</p>
                      <cite>— {quote.person}, {quote.outlet}</cite>
                    </blockquote>
                  ))}
                </div>
              </section>
            )}

            {/* Notable Reviews */}
            {car.notableReviews?.length > 0 && (
              <section className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <Icons.book size={22} />
                  <h2>Notable Reviews</h2>
                </div>
                <div className={styles.reviewsList}>
                  {car.notableReviews.map((review, i) => (
                    <div key={i} className={styles.reviewCard}>
                      <div className={styles.reviewHeader}>
                        <strong>{review.source}</strong>
                        {review.rating && <span className={styles.reviewRating}>{review.rating}</span>}
                      </div>
                      <p>&ldquo;{review.quote}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Performance Scores */}
            <section className={styles.contentSection}>
              <div className={styles.sectionHeader}>
                <Icons.gauge size={22} />
                <h2>Performance Scores</h2>
              </div>
              
              <div className={styles.scoreGrid}>
                {scoreBreakdown.map(score => {
                  const { label: ratingLabel } = getScoreLabel(score.rawScore);
                  return (
                    <div key={score.key} className={styles.scoreCard}>
                      <div className={styles.scoreCardHeader}>
                        <span className={styles.scoreCardLabel}>{score.label}</span>
                        <span className={`${styles.scoreValue} ${getScoreTierClass(score.rawScore)}`}>
                          {score.rawScore}/10
                        </span>
                      </div>
                      <div className={styles.scoreBar}>
                        <div 
                          className={`${styles.scoreBarFill} ${getScoreTierClass(score.rawScore)}`}
                          style={{ width: `${score.percentage}%` }}
                        />
                      </div>
                      <span className={styles.scoreRating}>{ratingLabel}</span>
                    </div>
                  );
                })}
              </div>

              <ScoringInfo variant="carDetail" />
            </section>
          </div>
        )}
      </div>

      {/* ================================================================
          UPGRADE TEASER - CTA for modifications
          ================================================================ */}
      <section className={styles.upgradeTeaser}>
        <div className={styles.upgradeTeaserInner}>
          <div className={styles.upgradeTeaserContent}>
            <Icons.tool size={24} />
            <div>
              <h3>Thinking About Upgrades?</h3>
              <p>
                Explore popular modification paths for the {car.name}. 
                No pressure—just ideas and honest advice.
              </p>
            </div>
          </div>
          <div className={styles.upgradeTeaserActions}>
            <Link href={`/performance?car=${car.slug}`} className={styles.primaryBtn}>
              Explore Upgrades
            </Link>
            <Link href="/education" className={styles.secondaryBtn}>
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================
          FOOTER CTA
          ================================================================ */}
      <section className={styles.footerCta}>
        <div className={styles.footerCtaInner}>
          <Link href={`/performance?car=${car.slug}`} className={styles.ctaPrimary}>
            <Icons.gauge size={20} />
            See Performance Impact
          </Link>
          <Link href="/car-selector" className={styles.ctaSecondary}>
            <Icons.arrowLeft size={18} />
            Back to Car Selector
          </Link>
        </div>
      </section>
    </div>
  );
}
