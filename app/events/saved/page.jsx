'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import EventCard, { EventCardSkeleton } from '@/components/EventCard';
import { useAuth } from '@/components/providers/AuthProvider';
import PremiumGate from '@/components/PremiumGate';
import { hasTierAccess, IS_BETA, FEATURES } from '@/lib/tierAccess';

// Icons
const Icons = {
  heart: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
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

export default function SavedEventsPage() {
  const router = useRouter();
  const { isAuthenticated, user, profile, isLoading: authLoading } = useAuth();
  const userTier = profile?.subscription_tier || 'free';
  const canAccessSavedEvents = IS_BETA || hasTierAccess(userTier, 'collector');
  
  // State
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingEventSlug, setSavingEventSlug] = useState(null);
  const [includeExpired, setIncludeExpired] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/events');
    }
  }, [authLoading, isAuthenticated, router]);
  
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
        
        const res = await fetch(`/api/users/${user.id}/saved-events?${params.toString()}`);
        
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
  }, [isAuthenticated, user?.id, canAccessSavedEvents, includeExpired]);
  
  // Handle unsave
  const handleSaveToggle = useCallback(async (eventSlug) => {
    setSavingEventSlug(eventSlug);
    
    // Optimistic removal
    setSavedEvents(prev => prev.filter(se => se.event.slug !== eventSlug));
    
    try {
      const res = await fetch(`/api/events/${eventSlug}/save`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        // Revert on error - refetch
        const refetchRes = await fetch(`/api/users/${user.id}/saved-events${includeExpired ? '?includeExpired=true' : ''}`);
        const data = await refetchRes.json();
        setSavedEvents(data.savedEvents || []);
      }
    } catch (err) {
      console.error('[SavedEvents] Error unsaving:', err);
      // Refetch to get correct state
      const refetchRes = await fetch(`/api/users/${user.id}/saved-events${includeExpired ? '?includeExpired=true' : ''}`);
      const data = await refetchRes.json();
      setSavedEvents(data.savedEvents || []);
    } finally {
      setSavingEventSlug(null);
    }
  }, [user?.id, includeExpired]);
  
  // Loading state (auth)
  if (authLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Not authenticated - will redirect
  if (!isAuthenticated) {
    return null;
  }
  
  // Tier gate
  if (!canAccessSavedEvents) {
    return (
      <div className={styles.page}>
        {/* Hero Header */}
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
    <div className={styles.page}>
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
            <Link href="/events" className={styles.browseButton}>
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
                savingInProgress={savingEventSlug === savedEvent.event.slug}
                showSaveButton={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

