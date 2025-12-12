'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import { useCarSelection } from '@/components/providers/CarSelectionProvider';
import { useFavorites } from '@/components/providers/FavoritesProvider';
import { useCompare } from '@/components/providers/CompareProvider';
import { useSavedBuilds } from '@/components/providers/SavedBuildsProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';

// Background pattern for gaming-style garage
const garageBackgroundUrl = '/images/pages/garage-mood.png';

// Icons
const Icons = {
  heart: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  clipboard: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  bot: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <circle cx="12" cy="5" r="2"/>
      <path d="M12 7v4"/>
      <line x1="8" y1="16" x2="8" y2="16"/>
      <line x1="16" y1="16" x2="16" y2="16"/>
    </svg>
  ),
  user: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  lock: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  arrowRight: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  zap: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  car: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
      <circle cx="6.5" cy="16.5" r="2.5"/>
      <circle cx="16.5" cy="16.5" r="2.5"/>
    </svg>
  ),
  sparkles: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3L13.5 9L19 9L14.5 13L16 19L12 15.5L8 19L9.5 13L5 9L10.5 9L12 3Z"/>
    </svg>
  ),
  calendar: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

// Feature cards for the garage - Active features
const ACTIVE_FEATURES = [
  {
    id: 'favorites',
    title: 'Favorite Cars',
    description: 'Save cars you love for quick access. Build your dream garage wishlist.',
    icon: Icons.heart,
    color: '#e74c3c',
    comingSoon: false,
  },
  {
    id: 'builds',
    title: 'Saved Builds',
    description: 'Save Performance HUB configurations. Compare different build paths for your car.',
    icon: Icons.wrench,
    color: '#3498db',
    comingSoon: false,
  },
  {
    id: 'compare',
    title: 'Compare Vehicles',
    description: 'Side-by-side comparisons of specs, scores, and ownership costs.',
    icon: Icons.compare,
    color: '#2ecc71',
    comingSoon: false,
  },
];

// Coming soon features - Gated until account system
const COMING_SOON_FEATURES = [
  {
    id: 'ai-mechanic',
    title: 'AI Mechanic',
    description: 'Your personal car advisor. Get answers about maintenance, modifications, and more.',
    icon: Icons.bot,
    color: '#9b59b6',
    comingSoon: true,
  },
  {
    id: 'vin-lookup',
    title: 'VIN Auto-Fill',
    description: 'Enter your VIN to automatically load your exact car specs, history, and recalls.',
    icon: Icons.car,
    color: '#e67e22',
    comingSoon: true,
  },
  {
    id: 'maintenance',
    title: 'Maintenance Log',
    description: 'Track service history, upload receipts, and get maintenance reminders.',
    icon: Icons.clipboard,
    color: '#f39c12',
    comingSoon: true,
  },
  {
    id: 'service-analyzer',
    title: 'Service Analyzer',
    description: 'AI-powered analysis of repair estimates. Know if you\'re getting a fair price.',
    icon: Icons.sparkles,
    color: '#1abc9c',
    comingSoon: true,
  },
];

// All features combined
const GARAGE_FEATURES = [...ACTIVE_FEATURES, ...COMING_SOON_FEATURES];

// Feature Card Component
function FeatureCard({ feature, isAuthenticated }) {
  const Icon = feature.icon;
  
  return (
    <div 
      className={`${styles.featureCard} ${feature.comingSoon ? styles.comingSoon : ''}`}
      style={{ '--feature-color': feature.color }}
    >
      <div className={styles.featureIcon}>
        <Icon size={24} />
      </div>
      <div className={styles.featureContent}>
        <div className={styles.featureHeader}>
          <h3 className={styles.featureTitle}>{feature.title}</h3>
          {feature.comingSoon && (
            <span className={styles.comingSoonBadge}>Coming Soon</span>
          )}
        </div>
        <p className={styles.featureDescription}>{feature.description}</p>
      </div>
      {!feature.comingSoon && !isAuthenticated && (
        <div className={styles.featureLock}>
          <Icons.lock size={16} />
        </div>
      )}
    </div>
  );
}

// Empty state for when user is not signed in
function SignUpCTA({ onSignUpClick }) {
  return (
    <div className={styles.signUpCta}>
      <div className={styles.signUpIcon}>
        <Icons.user size={32} />
      </div>
      <h2 className={styles.signUpTitle}>Your Personal Garage Awaits</h2>
      <p className={styles.signUpDescription}>
        Create a free account to unlock your personal garage. Save favorite cars, 
        build configurations, and get personalized recommendations.
      </p>
      <div className={styles.signUpBenefits}>
        <div className={styles.benefit}>
          <Icons.heart size={16} />
          <span>Save favorite cars</span>
        </div>
        <div className={styles.benefit}>
          <Icons.wrench size={16} />
          <span>Save build configurations</span>
        </div>
        <div className={styles.benefit}>
          <Icons.compare size={16} />
          <span>Compare vehicles side-by-side</span>
        </div>
        <div className={styles.benefit}>
          <Icons.bot size={16} />
          <span>AI-powered car advice</span>
        </div>
      </div>
      <div className={styles.signUpActions}>
        <button className={styles.signUpButton} onClick={onSignUpClick}>
          <Icons.user size={18} />
          Create Free Account
        </button>
        <span className={styles.signUpNote}>Free forever. No credit card required.</span>
      </div>
    </div>
  );
}

// Quick access card for selected car
function SelectedCarQuickAccess({ selectedCar }) {
  if (!selectedCar) return null;
  
  return (
    <div className={styles.selectedCarCard}>
      <div className={styles.selectedCarHeader}>
        <Icons.car size={18} />
        <span>Currently Selected</span>
      </div>
      <h3 className={styles.selectedCarName}>{selectedCar.name}</h3>
      <p className={styles.selectedCarMeta}>{selectedCar.years} • {selectedCar.hp} hp</p>
      <div className={styles.selectedCarActions}>
        <Link href={`/cars/${selectedCar.slug}`} className={styles.selectedCarLink}>
          View Details
        </Link>
        <Link href={`/performance?car=${selectedCar.slug}`} className={styles.selectedCarLink}>
          Build It
        </Link>
      </div>
    </div>
  );
}

export default function GaragePage() {
  // Get auth state
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const authModal = useAuthModal();
  
  // Get currently selected car from global state
  const { selectedCar, isHydrated } = useCarSelection();
  
  // Get favorites from store
  const { favorites, count: favoriteCount, removeFavorite, isHydrated: favoritesHydrated, isLoading: favoritesLoading } = useFavorites();
  
  // Get compare list from store
  const { cars: compareCars, count: compareCount, removeFromCompare, isHydrated: compareHydrated, savedLists } = useCompare();
  
  // Get saved builds
  const { builds, isLoading: buildsLoading, deleteBuild } = useSavedBuilds();
  
  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroImageWrapper}>
          <Image
            src={heroImageUrl}
            alt="Personal garage workspace"
            fill
            priority
            quality={85}
            className={styles.heroImage}
          />
        </div>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>My Garage</span>
          <h1 className={styles.title}>
            Your Personal<br />
            <span className={styles.titleAccent}>Car Hub</span>
          </h1>
          <p className={styles.subtitle}>
            Your garage is your personal space to save favorites, plan builds, 
            compare options, and get AI-powered advice. Everything you need to 
            make informed decisions about your next car or upgrade.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.mainContent}>
        <div className={styles.container}>
          {/* Sidebar with selected car (if any) */}
          {isHydrated && selectedCar && (
            <aside className={styles.sidebar}>
              <SelectedCarQuickAccess selectedCar={selectedCar} />
            </aside>
          )}
          
          {/* Main area */}
          <div className={styles.mainArea}>
            {/* Favorites Section */}
            {favoritesHydrated && favorites.length > 0 && (
              <div className={styles.favoritesSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    <Icons.heart size={22} />
                    Your Favorites
                  </h2>
                  <span className={styles.favoritesCount}>{favoriteCount} cars</span>
                </div>
                <div className={styles.favoritesGrid}>
                  {favorites.map(car => (
                    <div key={car.slug} className={styles.favoriteCard}>
                      <div className={styles.favoriteCardContent}>
                        <h3 className={styles.favoriteCardName}>{car.name}</h3>
                        <p className={styles.favoriteCardMeta}>
                          {car.years} • {car.hp} hp • {car.priceRange}
                        </p>
                      </div>
                      <div className={styles.favoriteCardActions}>
                        <Link 
                          href={`/cars/${car.slug}`}
                          className={styles.favoriteCardLink}
                        >
                          View
                        </Link>
                        <Link 
                          href={`/performance?car=${car.slug}`}
                          className={styles.favoriteCardLink}
                        >
                          Build
                        </Link>
                        <button
                          onClick={() => removeFavorite(car.slug)}
                          className={styles.favoriteRemoveBtn}
                          title="Remove from favorites"
                        >
                          <Icons.heart size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compare Section */}
            {compareHydrated && compareCars.length > 0 && (
              <div className={styles.compareSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    <Icons.compare size={22} />
                    Compare List
                  </h2>
                  <Link href="/garage/compare" className={styles.compareLink}>
                    View Comparison →
                  </Link>
                </div>
                <div className={styles.compareCarsList}>
                  {compareCars.map(car => (
                    <div key={car.slug} className={styles.compareCarChip}>
                      <span className={styles.compareCarName}>{car.name}</span>
                      <button
                        onClick={() => removeFromCompare(car.slug)}
                        className={styles.compareRemoveBtn}
                        title="Remove from compare"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Saved Builds Section - Only for authenticated users */}
            {isAuthenticated && builds.length > 0 && (
              <div className={styles.buildsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    <Icons.wrench size={22} />
                    Saved Builds
                  </h2>
                  <span className={styles.buildsCount}>{builds.length} builds</span>
                </div>
                <div className={styles.buildsGrid}>
                  {builds.slice(0, 4).map(build => (
                    <div key={build.id} className={styles.buildCard}>
                      <div className={styles.buildCardHeader}>
                        <h3 className={styles.buildCardName}>{build.name}</h3>
                        {build.isFavorite && (
                          <span className={styles.buildFavoriteBadge}>★</span>
                        )}
                      </div>
                      <p className={styles.buildCardCar}>{build.carName}</p>
                      <div className={styles.buildCardStats}>
                        <span className={styles.buildStat}>
                          +{build.totalHpGain} hp
                        </span>
                        <span className={styles.buildStat}>
                          ${build.totalCostLow?.toLocaleString()} - ${build.totalCostHigh?.toLocaleString()}
                        </span>
                      </div>
                      <div className={styles.buildCardActions}>
                        <Link 
                          href={`/cars/${build.carSlug}/performance`}
                          className={styles.buildCardLink}
                        >
                          Load Build
                        </Link>
                        <button
                          onClick={() => deleteBuild(build.id)}
                          className={styles.buildRemoveBtn}
                          title="Delete build"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {builds.length > 4 && (
                  <Link href="/garage/builds" className={styles.viewAllLink}>
                    View all {builds.length} builds →
                  </Link>
                )}
              </div>
            )}

            {/* Sign Up CTA - Show if not authenticated and no content */}
            {!isAuthenticated && (!favoritesHydrated || favorites.length === 0) && (!compareHydrated || compareCars.length === 0) && (
              <SignUpCTA onSignUpClick={authModal.openSignUp} />
            )}
            
            {/* Welcome back message for authenticated users */}
            {isAuthenticated && user && favorites.length === 0 && compareCars.length === 0 && builds.length === 0 && (
              <div className={styles.welcomeBack}>
                <div className={styles.welcomeBackIcon}>
                  <Icons.user size={32} />
                </div>
                <h2 className={styles.welcomeBackTitle}>
                  Welcome, {user.user_metadata?.full_name?.split(' ')[0] || 'Enthusiast'}!
                </h2>
                <p className={styles.welcomeBackText}>
                  Your garage is empty. Start exploring cars to add favorites, 
                  compare options, or save Performance HUB builds.
                </p>
                <div className={styles.welcomeBackActions}>
                  <Link href="/car-selector" className={styles.welcomeBackPrimary}>
                    <Icons.zap size={18} />
                    Find Your Car
                  </Link>
                </div>
              </div>
            )}
            
            {/* Active Features */}
            <div className={styles.featuresSection}>
              <h2 className={styles.sectionTitle}>
                <Icons.sparkles size={22} />
                Available Now
              </h2>
              <p className={styles.sectionSubtitle}>
                Tools you can use today to research and plan your car ownership journey.
              </p>
              
              <div className={styles.featuresGrid}>
                {ACTIVE_FEATURES.map(feature => (
                  <FeatureCard 
                    key={feature.id} 
                    feature={feature} 
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            </div>

            {/* Coming Soon Features */}
            <div className={styles.comingSoonSection}>
              <div className={styles.comingSoonHeader}>
                <h2 className={styles.sectionTitle}>
                  <Icons.calendar size={22} />
                  Coming Soon
                </h2>
                <span className={styles.comingSoonBadge}>In Development</span>
              </div>
              <p className={styles.sectionSubtitle}>
                Premium features we&apos;re building to take your car ownership experience to the next level.
              </p>
              
              <div className={styles.comingSoonGrid}>
                {COMING_SOON_FEATURES.map(feature => {
                  const Icon = feature.icon;
                  return (
                    <div 
                      key={feature.id}
                      className={styles.comingSoonCard}
                      style={{ '--feature-color': feature.color }}
                    >
                      <div className={styles.comingSoonIcon}>
                        <Icon size={28} />
                      </div>
                      <div className={styles.comingSoonContent}>
                        <h3 className={styles.comingSoonTitle}>{feature.title}</h3>
                        <p className={styles.comingSoonDesc}>{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Email signup for coming soon features */}
              <div className={styles.notifySection}>
                <p className={styles.notifyText}>
                  Want to be first to know when these features launch?
                </p>
                <div className={styles.notifyForm}>
                  <input 
                    type="email" 
                    placeholder="Enter your email"
                    className={styles.notifyInput}
                    disabled
                  />
                  <button className={styles.notifyButton} disabled title="Coming Soon">
                    Notify Me
                  </button>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </section>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModal.isOpen}
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />
    </div>
  );
}
