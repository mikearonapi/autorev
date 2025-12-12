'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page-gaming.module.css';
import { useCarSelection } from '@/components/providers/CarSelectionProvider';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { useCompare } from '@/components/providers/CompareProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import CarImage from '@/components/CarImage';
import { carData } from '@/data/cars.js';

// Icons
const Icons = {
  heart: ({ size = 20, filled = false }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  wrench: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  compare: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  lock: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  user: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  arrowRight: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  trash: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  gauge: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
};

// Car Card Component - Gaming style
function CarCard({ car, onRemove, actionLabel, actionHref, showStats = true }) {
  return (
    <div className={styles.carCard}>
      <div className={styles.carCardImage}>
        <CarImage car={car} variant="hero" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
        <div className={styles.carCardOverlay} />
      </div>
      
      <div className={styles.carCardContent}>
        <div className={styles.carCardHeader}>
          <div>
            <h3 className={styles.carCardName}>{car.name}</h3>
            <p className={styles.carCardMeta}>{car.years} • {car.category || 'Sports Car'}</p>
          </div>
          {onRemove && (
            <button 
              onClick={(e) => { e.preventDefault(); onRemove(); }}
              className={styles.removeButton}
              title="Remove from garage"
            >
              <Icons.trash size={16} />
            </button>
          )}
        </div>
        
        {showStats && (
          <div className={styles.carCardStats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Power</span>
              <span className={styles.statValue}>{car.hp} HP</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>0-60</span>
              <span className={styles.statValue}>{car.zeroToSixty}s</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Weight</span>
              <span className={styles.statValue}>{car.curbWeight?.toLocaleString()} kg</span>
            </div>
          </div>
        )}
        
        <Link href={actionHref} className={styles.carCardAction}>
          {actionLabel}
          <Icons.arrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

// Build Card Component - For saved configurations
function BuildCard({ build, car, onRemove }) {
  return (
    <div className={styles.buildCard}>
      <div className={styles.buildCardImage}>
        <CarImage car={car} variant="hero" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
        <div className={styles.buildCardBadge}>
          <Icons.wrench size={14} />
          <span>{build.upgrades?.length || 0} Upgrades</span>
        </div>
      </div>
      
      <div className={styles.buildCardContent}>
        <div className={styles.buildCardHeader}>
          <div>
            <h3 className={styles.buildCardName}>{build.name || `${car.name} Build`}</h3>
            <p className={styles.buildCardCar}>{car.name}</p>
          </div>
          <button 
            onClick={() => onRemove(build.id)}
            className={styles.removeButton}
            title="Delete build"
          >
            <Icons.trash size={16} />
          </button>
        </div>
        
        <div className={styles.buildCardMeta}>
          <span>${build.totalCost?.toLocaleString() || '0'}</span>
          <span>•</span>
          <span>Saved {new Date(build.createdAt).toLocaleDateString()}</span>
        </div>
        
        <Link href={`/cars/${car.slug}/performance?build=${build.id}`} className={styles.buildCardAction}>
          View Build
          <Icons.arrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <Icon size={48} />
      </div>
      <h3 className={styles.emptyTitle}>{title}</h3>
      <p className={styles.emptyDescription}>{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className={styles.emptyAction}>
          {actionLabel}
          <Icons.arrowRight size={16} />
        </button>
      )}
    </div>
  );
}

// Main Garage Component
export default function GaragePage() {
  const [activeTab, setActiveTab] = useState('favorites');
  const { user, isAuthenticated } = useAuth();
  const authModal = useAuthModal();
  const { favorites, removeFavorite } = useFavorites();
  const { builds, deleteBuild } = useSavedBuilds();
  const { compareList, removeFromCompare } = useCompare();
  
  // Get full car data for favorites/compare
  const favoriteCars = favorites.map(slug => carData.find(c => c.slug === slug)).filter(Boolean);
  const compareCars = compareList.map(slug => carData.find(c => c.slug === slug)).filter(Boolean);
  
  // Get cars for builds
  const buildsWithCars = builds.map(build => ({
    ...build,
    car: carData.find(c => c.slug === build.carSlug)
  })).filter(b => b.car);
  
  const tabs = [
    { id: 'favorites', label: 'Favorite Cars', icon: Icons.heart, count: favoriteCars.length },
    { id: 'builds', label: 'Saved Builds', icon: Icons.wrench, count: buildsWithCars.length },
    { id: 'compare', label: 'Compare List', icon: Icons.compare, count: compareCars.length },
  ];
  
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.title}>
              <span className={styles.titleMain}>My Garage</span>
              <span className={styles.titleAccent}>Collection</span>
            </h1>
            <p className={styles.subtitle}>
              Your personal automotive workspace. Build, compare, and plan your perfect setup.
            </p>
          </div>
          
          {!isAuthenticated && (
            <button onClick={() => authModal.open('signup')} className={styles.signInButton}>
              <Icons.user size={18} />
              Sign In to Save
            </button>
          )}
        </div>
      </div>
      
      {/* Tabs */}
      <div className={styles.tabs}>
        <div className={styles.tabsContainer}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={styles.tabCount}>{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Content */}
      <div className={styles.content}>
        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className={styles.gridContainer}>
            {favoriteCars.length > 0 ? (
              <div className={styles.carGrid}>
                {favoriteCars.map(car => (
                  <CarCard
                    key={car.slug}
                    car={car}
                    onRemove={() => removeFavorite(car.slug)}
                    actionLabel="View Details"
                    actionHref={`/cars/${car.slug}`}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Icons.heart}
                title="No Favorite Cars Yet"
                description="Start building your dream garage by adding cars you love. Browse the catalog and tap the heart icon on any car."
                actionLabel="Browse Cars"
                onAction={() => window.location.href = '/cars'}
              />
            )}
          </div>
        )}
        
        {/* Builds Tab */}
        {activeTab === 'builds' && (
          <div className={styles.gridContainer}>
            {buildsWithCars.length > 0 ? (
              <div className={styles.carGrid}>
                {buildsWithCars.map(({ car, ...build }) => (
                  <BuildCard
                    key={build.id}
                    build={build}
                    car={car}
                    onRemove={deleteBuild}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Icons.wrench}
                title="No Saved Builds Yet"
                description="Create and save build configurations in the Performance HUB. Compare different upgrade paths and costs for your car."
                actionLabel="Go to Performance HUB"
                onAction={() => window.location.href = '/performance'}
              />
            )}
          </div>
        )}
        
        {/* Compare Tab */}
        {activeTab === 'compare' && (
          <div className={styles.gridContainer}>
            {compareCars.length > 0 ? (
              <>
                <div className={styles.compareHeader}>
                  <p className={styles.compareNote}>
                    {compareCars.length} cars selected. Add up to 4 cars to compare side-by-side.
                  </p>
                  {compareCars.length >= 2 && (
                    <Link href="/garage/compare" className={styles.compareButton}>
                      <Icons.compare size={18} />
                      Compare Now
                    </Link>
                  )}
                </div>
                <div className={styles.carGrid}>
                  {compareCars.map(car => (
                    <CarCard
                      key={car.slug}
                      car={car}
                      onRemove={() => removeFromCompare(car.slug)}
                      actionLabel="View Car"
                      actionHref={`/cars/${car.slug}`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={Icons.compare}
                title="No Cars in Compare List"
                description="Add cars to your compare list to see them side-by-side. Perfect for deciding between models."
                actionLabel="Browse Cars"
                onAction={() => window.location.href = '/cars'}
              />
            )}
          </div>
        )}
      </div>
      
      <AuthModal 
        isOpen={authModal.isOpen}
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />
    </div>
  );
}
