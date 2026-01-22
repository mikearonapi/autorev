'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import EventCard, { EventCardSkeleton } from '@/components/EventCard';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAuthModal } from '@/components/AuthModal';
import AuthModal from '@/components/AuthModal';
import PremiumGate from '@/components/PremiumGate';
import { hasTierAccess, IS_BETA } from '@/lib/tierAccess';
import { Icons } from '@/components/ui/Icons';
import EmptyState from '@/components/ui/EmptyState';
import { useUserSavedEvents } from '@/hooks/useUserData';

export default function SavedEventsPage() {
  const { isAuthenticated, user, profile, session, isLoading: authLoading } = useAuth();
  const authModal = useAuthModal();
  const userTier = profile?.subscription_tier || 'free';
  const canAccessSavedEvents = IS_BETA || hasTierAccess(userTier, 'collector');
  
  // State
  const [includeExpired, setIncludeExpired] = useState(false);
  
  // React Query hook for saved events
  const { 
    data: savedEventsData,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useUserSavedEvents(
    user?.id, 
    { includeExpired },
    { enabled: isAuthenticated && !!user?.id && canAccessSavedEvents }
  );
  
  const savedEvents = savedEventsData?.savedEvents || [];
  const error = queryError ? 'Unable to load saved events. Please try again.' : null;
  
  // Handle unsave - called by SaveEventButton after it makes the API call
  const handleSaveToggle = useCallback((eventSlug, isSaved) => {
    if (!isSaved) {
      // Refetch to update the list (React Query will handle caching)
      refetch();
    }
  }, [refetch]);
  
  // Loading state (auth)
  if (authLoading) {
    return (
      <div className={styles.page} data-no-main-offset>
        <header className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.badge}>My Events</span>
            <h1 className={styles.heroTitle}>
              <span className={styles.titleAccent}>Saved</span> Events
            </h1>
            <p className={styles.heroSubtitle}>
              Events you&apos;ve bookmarked for later
            </p>
          </div>
        </header>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Not authenticated - show sign in prompt
  if (!isAuthenticated) {
    return (
      <div className={styles.page} data-no-main-offset>
        <header className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.badge}>My Events</span>
            <h1 className={styles.heroTitle}>
              <span className={styles.titleAccent}>Saved</span> Events
            </h1>
            <p className={styles.heroSubtitle}>
              Sign in to see your bookmarked events
            </p>
          </div>
        </header>
        
        <div className={styles.container}>
          <div className={styles.signInPrompt}>
            <div className={styles.signInIcon}>
              <Icons.user size={48} />
            </div>
            <h3>Sign in to view saved events</h3>
            <p>
              Create an account or sign in to save events and access them anytime.
            </p>
            <div className={styles.signInActions}>
              <button 
                onClick={() => authModal.openSignIn()}
                className={styles.signInButton}
              >
                Sign In
              </button>
              <button 
                onClick={() => authModal.openSignUp()}
                className={styles.joinButton}
              >
                Create Account
              </button>
            </div>
            <Link href="/community/events" className={styles.browseLink}>
              ← Browse Events
            </Link>
          </div>
        </div>
        
        <AuthModal 
          isOpen={authModal.isOpen} 
          onClose={authModal.close}
          defaultMode={authModal.defaultMode}
        />
      </div>
    );
  }
  
  // Tier gate (only shows if not in beta and user doesn't have collector tier)
  if (!canAccessSavedEvents) {
    return (
      <div className={styles.page} data-no-main-offset>
        <header className={styles.hero}>
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            <span className={styles.badge}>My Events</span>
            <h1 className={styles.heroTitle}>
              <span className={styles.titleAccent}>Saved</span> Events
            </h1>
            <p className={styles.heroSubtitle}>
              Bookmark events so you never miss them
            </p>
          </div>
        </header>
        
        <div className={styles.container}>
          <div className={styles.gateContainer}>
            <PremiumGate requiredTier="collector" variant="default" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.page} data-no-main-offset>
      {/* Hero Header */}
      <header className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>My Events</span>
          <h1 className={styles.heroTitle}>
            <span className={styles.titleAccent}>Saved</span> Events
          </h1>
          <p className={styles.heroSubtitle}>
            Events you&apos;ve bookmarked for later
          </p>
        </div>
      </header>
      
      <div className={styles.container}>
        
        {/* Filter Toggle */}
        <div className={styles.filterBar}>
          <label className={styles.filterToggle}>
            <input
              type="checkbox"
              checked={includeExpired}
              onChange={(e) => setIncludeExpired(e.target.checked)}
            />
            <span>Show past events</span>
          </label>
          
          <span className={styles.eventCount}>
            {loading ? 'Loading...' : `${savedEvents.length} saved event${savedEvents.length !== 1 ? 's' : ''}`}
          </span>
        </div>
        
        {/* Error State */}
        {error && (
          <div className={styles.errorState}>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        )}
        
        {/* Loading State */}
        {loading && !error && (
          <div className={styles.eventsGrid}>
            {[...Array(3)].map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        )}
        
        {/* Empty State */}
        {!loading && !error && savedEvents.length === 0 && (
          <EmptyState
            icon={Icons.calendar}
            title="No saved events yet"
            description="Browse events and click the heart icon to save them for later."
            action={{ label: "Browse Events", href: "/community/events" }}
            variant="centered"
            size="lg"
          />
        )}
        
        {/* Events Grid */}
        {!loading && !error && savedEvents.length > 0 && (
          <div className={styles.eventsGrid}>
            {savedEvents.map(savedEvent => (
              <EventCard
                key={savedEvent.event.id}
                event={savedEvent.event}
                featured={savedEvent.event.featured}
                isSaved={true}
                onSaveToggle={handleSaveToggle}
                showSaveButton={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
