'use client';

/**
 * My Builds Page - Build Pivot (January 2026)
 * 
 * This page wraps the Garage functionality but defaults to the Builds tab
 * and uses Build-focused messaging. The /garage route redirects here.
 * 
 * Features:
 * - Build projects (primary focus)
 * - Owned vehicles (secondary)
 * - Saved/favorite cars (tertiary)
 */

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import BuildDetailView from '@/components/BuildDetailView';
import styles from './page.module.css';

// Icons
const WrenchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
);

const CarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

function MyBuildsContent() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { builds, isLoading: buildsLoading, refreshBuilds } = useSavedBuilds();
  const { vehicles, isLoading: vehiclesLoading } = useOwnedVehicles();
  const { favorites, isLoading: favoritesLoading } = useFavorites();
  const authModal = useAuthModal();
  
  const [activeTab, setActiveTab] = useState('builds'); // Default to builds
  const [selectedBuild, setSelectedBuild] = useState(null);
  
  // Refresh builds on mount
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshBuilds();
    }
  }, [isAuthenticated, user?.id, refreshBuilds]);

  // Not authenticated - show sign in prompt
  if (!authLoading && !isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <WrenchIcon />
          <h2>Sign in to view your builds</h2>
          <p>Save your build projects and track your modifications.</p>
          <button className={styles.signInBtn} onClick={() => authModal.openSignIn()}>
            Sign In
          </button>
          <Link href="/tuning-shop" className={styles.exploreLink}>
            Or start building without an account
          </Link>
        </div>
        <AuthModal 
          isOpen={authModal.isOpen} 
          onClose={authModal.close}
          defaultMode={authModal.defaultMode}
        />
      </div>
    );
  }

  // Loading state
  if (authLoading || buildsLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <LoadingSpinner />
          <p>Loading your builds...</p>
        </div>
      </div>
    );
  }

  // Build detail view
  if (selectedBuild) {
    return (
      <div className={styles.container}>
        <button 
          className={styles.backBtn}
          onClick={() => setSelectedBuild(null)}
        >
          ← Back to My Builds
        </button>
        <BuildDetailView 
          build={selectedBuild} 
          onClose={() => setSelectedBuild(null)}
        />
      </div>
    );
  }

  const tabs = [
    { id: 'builds', label: 'Build Projects', icon: <WrenchIcon />, count: builds?.length || 0 },
    { id: 'vehicles', label: 'My Vehicles', icon: <CarIcon />, count: vehicles?.length || 0 },
    { id: 'saved', label: 'Saved Cars', icon: <HeartIcon />, count: favorites?.length || 0 },
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Builds</h1>
        <p className={styles.subtitle}>Manage your build projects and tracked vehicles</p>
      </header>

      {/* Tab Navigation */}
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span className={styles.tabCount}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {activeTab === 'builds' && (
          <BuildsTab 
            builds={builds} 
            onSelectBuild={setSelectedBuild}
          />
        )}
        {activeTab === 'vehicles' && (
          <VehiclesTab vehicles={vehicles} />
        )}
        {activeTab === 'saved' && (
          <SavedTab favorites={favorites} />
        )}
      </div>
    </div>
  );
}

// Builds Tab
function BuildsTab({ builds, onSelectBuild }) {
  if (!builds || builds.length === 0) {
    return (
      <div className={styles.emptyTabState}>
        <WrenchIcon />
        <h3>No build projects yet</h3>
        <p>Start planning your first build in the Tuning Shop</p>
        <Link href="/tuning-shop" className={styles.primaryBtn}>
          <PlusIcon /> Start a New Build
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.buildGrid}>
      {/* New Build Card */}
      <Link href="/tuning-shop" className={styles.newBuildCard}>
        <PlusIcon />
        <span>New Build</span>
      </Link>
      
      {builds.map(build => (
        <div 
          key={build.id} 
          className={styles.buildCard}
          onClick={() => onSelectBuild(build)}
        >
          <div className={styles.buildCardHeader}>
            <h3>{build.name || `${build.car_year} ${build.car_make} ${build.car_model}`}</h3>
            <span className={styles.buildStatus}>
              {build.status === 'completed' ? 'Complete' : 'In Progress'}
            </span>
          </div>
          <div className={styles.buildCardBody}>
            <p className={styles.buildCarName}>
              {build.car_year} {build.car_make} {build.car_model}
            </p>
            <div className={styles.buildStats}>
              <span className={styles.buildStat}>
                <strong>{build.parts_count || 0}</strong> parts
              </span>
              <span className={styles.buildStat}>
                <strong>+{build.hp_gain || 0}</strong> HP
              </span>
            </div>
          </div>
          <div className={styles.buildCardFooter}>
            <span>View Details</span>
            <ChevronRightIcon />
          </div>
        </div>
      ))}
    </div>
  );
}

// Vehicles Tab
function VehiclesTab({ vehicles }) {
  if (!vehicles || vehicles.length === 0) {
    return (
      <div className={styles.emptyTabState}>
        <CarIcon />
        <h3>No vehicles added</h3>
        <p>Add your cars to track builds and modifications</p>
        <Link href="/tuning-shop" className={styles.primaryBtn}>
          <PlusIcon /> Add a Vehicle
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.vehicleGrid}>
      {vehicles.map(vehicle => (
        <Link 
          key={vehicle.id} 
          href={`/tuning-shop?car=${vehicle.car_slug}`}
          className={styles.vehicleCard}
        >
          <div className={styles.vehicleCardBody}>
            <h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3>
            {vehicle.nickname && (
              <p className={styles.vehicleNickname}>&quot;{vehicle.nickname}&quot;</p>
            )}
          </div>
          <div className={styles.vehicleCardFooter}>
            <span>Plan Build</span>
            <ChevronRightIcon />
          </div>
        </Link>
      ))}
    </div>
  );
}

// Saved Tab
function SavedTab({ favorites }) {
  if (!favorites || favorites.length === 0) {
    return (
      <div className={styles.emptyTabState}>
        <HeartIcon />
        <h3>No saved cars</h3>
        <p>Save cars you&apos;re interested in building</p>
        <Link href="/browse-cars" className={styles.secondaryBtn}>
          Browse Cars
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.savedGrid}>
      {favorites.map(fav => (
        <Link 
          key={fav.car_slug} 
          href={`/tuning-shop?car=${fav.car_slug}`}
          className={styles.savedCard}
        >
          <div className={styles.savedCardBody}>
            <h3>{fav.car_name || fav.car_slug}</h3>
          </div>
          <div className={styles.savedCardFooter}>
            <span>Plan Build</span>
            <ChevronRightIcon />
          </div>
        </Link>
      ))}
    </div>
  );
}

// Loading component
function MyBuildsLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.loadingState}>
        <LoadingSpinner />
        <p>Loading your builds...</p>
      </div>
    </div>
  );
}

// Main export
export default function MyBuildsPage() {
  return (
    <ErrorBoundary name="MyBuildsPage" featureContext="my-builds">
      <Suspense fallback={<MyBuildsLoading />}>
        <MyBuildsContent />
      </Suspense>
    </ErrorBoundary>
  );
}
