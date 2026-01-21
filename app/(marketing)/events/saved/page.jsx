'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import EventCard, { EventCardSkeleton } from '@/components/EventCard';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAuthModal } from '@/components/AuthModal';
import AuthModal from '@/components/AuthModal';
import PremiumGate from '@/components/PremiumGate';
import { hasTierAccess, IS_BETA } from '@/lib/tierAccess';
import { Icons } from '@/components/ui/Icons';

export default function SavedEventsPage() {
  const { isAuthenticated, user, profile, session, isLoading: authLoading } = useAuth();
  const authModal = useAuthModal();
  const userTier = profile?.subscription_tier || 'free';
  const canAccessSavedEvents = IS_BETA || hasTierAccess(userTier, 'collector');
  
  // State
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [includeExpired, setIncludeExpired] = useState(false);
  
  // Fetch saved events
  useEffect(() => {
    async function fetchSavedEvents() {
      if (!isAuthenticated || !user?.id || !canAccessSavedEvents) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        if (includeExpired) {
          params.set('includeExpired', 'true');
        }

        const headers = {};
        // Include Bearer token when available (client auth may not be cookie-based).
        if (session?.access_token) {
          headers.Authorization = `Bearer ${session.access_token}`;
        }

        const res = await fetch(`/api/users/${user.id}/saved-events?${params.toString()}`, { headers });
        
        if (!res.ok) {
          throw new Error('Failed to fetch saved events');
        }
        
        const data = await res.json();
        setSavedEvents(data.savedEvents || []);
      } catch (err) {
        console.error('[SavedEvents] Error fetching:', err);
        setError('Unable to load saved events. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchSavedEvents();
  }, [isAuthenticated, user?.id, canAccessSavedEvents, includeExpired, session?.access_token]);
  
  // Handle unsave - called by SaveEventButton after it makes the API call
  const handleSaveToggle = useCallback((eventSlug, isSaved) => {
    if (!isSaved) {
      setSavedEvents(prev => prev.filter(se => se.event.slug !== eventSlug));
    }
  }, []);
  
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
              <Link href="/join" className={styles.joinButton}>
                Create Account
              </Link>
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
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Icons.calendar size={48} />
            </div>
            <h3>No saved events yet</h3>
            <p>
              Browse events and click the heart icon to save them for later.
            </p>
            <Link href="/community/events" className={styles.browseButton}>
              Browse Events
            </Link>
          </div>
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
