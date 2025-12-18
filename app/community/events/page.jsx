'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import EventCard from '@/components/EventCard';
import EventFilters from '@/components/EventFilters';
import EventMap from '@/components/EventMap';
import EventCalendarView from '@/components/EventCalendarView';
import PremiumGate from '@/components/PremiumGate';
import { useAuth } from '@/components/providers/AuthProvider';

// Icons
const Icons = {
  plus: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  refresh: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
      <path d="M16 21h5v-5"/>
    </svg>
  ),
  calendar: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, profile, session } = useAuth();
  const userTier = profile?.subscription_tier || 'free';

  // State
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [eventTypes, setEventTypes] = useState([]);
  const [garageBrands, setGarageBrands] = useState([]);
  const [showPastEvents, setShowPastEvents] = useState(false);
  
  // Saved events tracking
  const [savedEventSlugs, setSavedEventSlugs] = useState(new Set());
  
  // View state (List, Map, Calendar)
  const [view, setView] = useState('list');
  const [selectedMapEvent, setSelectedMapEvent] = useState(null);

  // Items per page - dense layout allows more events per page
  const ITEMS_PER_PAGE = 500;

  // Filters state
  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    radius: parseInt(searchParams.get('radius'), 10) || 50,
    type: searchParams.get('type') || '',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
    region: searchParams.get('region') || '',
    scope: searchParams.get('scope') || '',
    is_track_event: searchParams.get('track_only') === 'true',
    is_free: searchParams.get('free_only') === 'true',
    brand: searchParams.get('brand') || '',
    for_my_cars: false,
    // Optional coordinates from Google Places autocomplete
    locationLat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : null,
    locationLng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')) : null,
  });

  // Fetch event types, garage brands, and saved events on mount
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const authHeaders = {};
        // Saved events is an authenticated endpoint; our client auth may be localStorage-based,
        // so forward a Bearer token when available.
        if (session?.access_token) {
          authHeaders.Authorization = `Bearer ${session.access_token}`;
        }

        const [typesRes, userRes, savedRes] = await Promise.all([
          fetch('/api/events/types'),
          isAuthenticated && user?.id ? fetch(`/api/users/${user.id}/garage`, { headers: authHeaders }) : Promise.resolve(null),
          isAuthenticated && user?.id ? fetch(`/api/users/${user.id}/saved-events?includeExpired=true`, { headers: authHeaders }) : Promise.resolve(null)
        ]);

        if (typesRes.ok) {
          const data = await typesRes.json();
          setEventTypes(data.types || []);
        }

        if (userRes && userRes.ok) {
          const data = await userRes.json();
          const brands = new Set(data.vehicles?.map(v => v.make) || []);
          setGarageBrands(Array.from(brands));
        }

        if (savedRes && savedRes.ok) {
          const data = await savedRes.json();
          const slugs = new Set((data.savedEvents || []).map(se => se.event?.slug).filter(Boolean));
          setSavedEventSlugs(slugs);
        }
      } catch (err) {
        console.error('Failed to fetch metadata:', err);
      }
    }
    fetchMetadata();
  }, [isAuthenticated, user?.id, session?.access_token]);

  // Handle save toggle - called by SaveEventButton after API call
  const handleSaveToggle = useCallback((eventSlug, isSaved) => {
    setSavedEventSlugs(prev => {
      const newSet = new Set(prev);
      if (isSaved) {
        newSet.add(eventSlug);
      } else {
        newSet.delete(eventSlug);
      }
      return newSet;
    });
  }, []);

  // Fetch events when filters or page change
  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        
        // Add filters to params - use 'location' param for flexible ZIP/city search
        if (filters.location) params.set('location', filters.location);
        
        // Always include radius when location is set (enables radius-based search)
        if (filters.location && filters.radius) {
          params.set('radius', filters.radius.toString());
        }
        
        // Pass coordinates if available from Google Places (more accurate geocoding)
        if (filters.locationLat && filters.locationLng) {
          params.set('lat', filters.locationLat.toString());
          params.set('lng', filters.locationLng.toString());
        }
        
        if (filters.type) params.set('type', filters.type);
        if (filters.region) params.set('region', filters.region);
        if (filters.scope) params.set('scope', filters.scope);
        if (filters.is_track_event) params.set('is_track_event', 'true');
        if (filters.is_free) params.set('is_free', 'true');
        if (filters.brand) params.set('brand', filters.brand);
        
        // Date filtering - default to future events unless showPastEvents is true
        if (showPastEvents) {
          // Set a very old date to include all past events
          params.set('start_after', '2000-01-01');
        }
        // Note: When no start_after is set, the API defaults to today (upcoming only)
        
        // Custom date range overrides
        if (filters.start_date) params.set('start_after', filters.start_date);
        if (filters.end_date) params.set('start_before', filters.end_date);

        // Pagination
        params.set('limit', ITEMS_PER_PAGE.toString());
        params.set('offset', ((page - 1) * ITEMS_PER_PAGE).toString());

        const res = await fetch(`/api/events?${params.toString()}`);
        
        if (!res.ok) throw new Error('Failed to fetch events');
        
        const data = await res.json();
        
        // Filter for "My Cars" client-side if needed
        let fetchedEvents = data.events || [];
        if (filters.for_my_cars && garageBrands.length > 0) {
          fetchedEvents = fetchedEvents.filter(e => 
            e.car_affinities?.some(a => garageBrands.includes(a.brand))
          );
        }

        setEvents(fetchedEvents);
        // Handle both pagination formats from API
        setTotalCount(data.total || data.pagination?.total || fetchedEvents.length);
        
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchEvents, 300);
    return () => clearTimeout(timer);
  }, [filters, page, garageBrands, showPastEvents]);

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
    
    // Build URL params for shareable links (exclude internal-only fields)
    const params = new URLSearchParams();
    const mergedFilters = { ...filters, ...newFilters };
    
    // Only include user-facing filter params in URL
    if (mergedFilters.location) params.set('location', mergedFilters.location);
    if (mergedFilters.radius && mergedFilters.radius !== 50) params.set('radius', mergedFilters.radius.toString());
    if (mergedFilters.type) params.set('type', mergedFilters.type);
    if (mergedFilters.region) params.set('region', mergedFilters.region);
    if (mergedFilters.start_date) params.set('start_date', mergedFilters.start_date);
    if (mergedFilters.end_date) params.set('end_date', mergedFilters.end_date);
    if (mergedFilters.is_track_event) params.set('track_only', 'true');
    if (mergedFilters.is_free) params.set('free_only', 'true');
    if (mergedFilters.brand) params.set('brand', mergedFilters.brand);
    
    router.replace(`/community/events?${params.toString()}`, { scroll: false });
  };

  // Handle view change
  const handleViewChange = (newView) => {
    setView(newView);
  };

  return (
    <div className={styles.page}>
      {/* Hero Header */}
      <header className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>Events</span>
          <h1 className={styles.heroTitle}>
            Discover <span className={styles.titleAccent}>Car Events</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Cars & Coffee meetups, track days, car shows, and more near you
          </p>
          <Link href="/events/submit" className={styles.submitEventBtn}>
            <Icons.plus />
            Submit Event
          </Link>
        </div>
      </header>

      {/* Filters */}
      <section className={styles.filtersSection}>
        <div className={styles.filtersContainer}>
          <EventFilters 
            initialFilters={filters}
            onFilterChange={handleFilterChange}
            eventTypes={eventTypes}
            showCategoryPills
            showLocationInput
            showDateRange
            showCarFilters={isAuthenticated}
            showViewToggle
            currentView={view}
            onViewChange={handleViewChange}
            garageBrands={garageBrands}
            isAuthenticated={isAuthenticated}
            userTier={userTier}
          />
          
          {/* Results bar */}
          <div className={styles.resultsBar}>
            <span className={styles.resultsCount}>
              {loading ? 'Loading...' : `${totalCount} event${totalCount !== 1 ? 's' : ''} found`}
            </span>
            <label className={styles.pastEventsToggle}>
              <input
                type="checkbox"
                checked={showPastEvents}
                onChange={(e) => {
                  setShowPastEvents(e.target.checked);
                  setPage(1);
                }}
              />
              <span>Include past events</span>
            </label>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.mainContainer}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>Loading events...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <Icons.calendar size={48} />
              <h3>Unable to load events</h3>
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className={styles.retryBtn}
              >
                <Icons.refresh />
                Retry
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className={styles.emptyState}>
              <Icons.calendar size={48} />
              <h3>No upcoming events found</h3>
              <p>Try adjusting your filters or check the "Include past events" option.</p>
              <button 
                onClick={() => handleFilterChange({ 
                  location: '', type: '', start_date: '', end_date: '', 
                  is_track_event: false, is_free: false, brand: '', for_my_cars: false 
                })}
                className={styles.submitBtn}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {/* List View */}
              {view === 'list' && (
                <div className={styles.eventsGrid}>
                  {events.map(event => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      showSaveButton={true}
                      isSaved={savedEventSlugs.has(event.slug)}
                      onSaveToggle={handleSaveToggle}
                      compact
                    />
                  ))}
                </div>
              )}

              {/* Map View */}
              {view === 'map' && (
                <div className={styles.mapContainer}>
                  <PremiumGate feature="eventsCalendarView">
                    <EventMap 
                      events={events}
                      onEventSelect={setSelectedMapEvent}
                      selectedEvent={selectedMapEvent}
                    />
                  </PremiumGate>
                </div>
              )}

              {/* Calendar View */}
              {view === 'calendar' && (
                <div className={styles.calendarContainer}>
                  <PremiumGate feature="eventsCalendarView">
                    <EventCalendarView 
                      events={events}
                      month={new Date().getMonth()}
                      year={new Date().getFullYear()}
                    />
                  </PremiumGate>
                </div>
              )}

              {/* Pagination (List View Only) */}
              {view === 'list' && totalCount > ITEMS_PER_PAGE && (
                <div className={styles.pagination}>
                  <button 
                    className={styles.pageBtn}
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className={styles.pageInfo}>
                    Page {page} of {Math.ceil(totalCount / ITEMS_PER_PAGE)}
                  </span>
                  <button 
                    className={styles.pageBtn}
                    disabled={page >= Math.ceil(totalCount / ITEMS_PER_PAGE)}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className={styles.page}><div className={styles.loadingState}>Loading...</div></div>}>
      <EventsContent />
    </Suspense>
  );
}
