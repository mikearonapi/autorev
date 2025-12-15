'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import EventCard, { EventCardSkeleton } from '@/components/EventCard';
import { useAuth } from '@/components/providers/AuthProvider';
import { useOwnedVehicles } from '@/components/providers/OwnedVehiclesProvider';
import AuthModal, { useAuthModal } from '@/components/AuthModal';
import { TeaserPrompt } from '@/components/PremiumGate';
import { hasTierAccess, IS_BETA } from '@/lib/tierAccess';

// Regions for filtering
const REGIONS = [
  { value: '', label: 'All Regions' },
  { value: 'Northeast', label: 'Northeast' },
  { value: 'Southeast', label: 'Southeast' },
  { value: 'Midwest', label: 'Midwest' },
  { value: 'Southwest', label: 'Southwest' },
  { value: 'West', label: 'West' },
];

// Scopes for filtering
const SCOPES = [
  { value: '', label: 'All Events' },
  { value: 'local', label: 'Local' },
  { value: 'regional', label: 'Regional' },
  { value: 'national', label: 'National' },
];

// Icons
const Icons = {
  search: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  ),
  filter: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
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
  mapPin: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  plus: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  refresh: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
};

function EventsPageContent() {
  // Auth & Navigation
  const { isAuthenticated, user, profile } = useAuth();
  const authModal = useAuthModal();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { vehicles } = useOwnedVehicles();
  const userTier = profile?.subscription_tier || 'free';
  const canSaveEvents = IS_BETA || hasTierAccess(userTier, 'collector');
  
  // State
  const [events, setEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [initialized, setInitialized] = useState(false);
  
  // Saved events state
  const [savedEventSlugs, setSavedEventSlugs] = useState(new Set());
  const [savingEventSlug, setSavingEventSlug] = useState(null);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  
  // Filters
  const [locationQuery, setLocationQuery] = useState('');
  const [radius, setRadius] = useState(50); // Default 50 miles
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedScope, setSelectedScope] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCarSlug, setSelectedCarSlug] = useState('');
  const [trackEventsOnly, setTrackEventsOnly] = useState(false);
  const [freeEventsOnly, setFreeEventsOnly] = useState(false);
  const [showingGarageEvents, setShowingGarageEvents] = useState(false);
  
  // Search results metadata
  const [searchCenter, setSearchCenter] = useState(null); // For radius search info
  
  // Pagination
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  
  // Context from URL params (for breadcrumbs)
  const urlBrand = searchParams.get('brand');
  const urlCarSlug = searchParams.get('car');
  const urlType = searchParams.get('type');
  
  // Get user's garage brands for "Events for Your Cars" feature
  const garageBrands = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];
    return [...new Set(vehicles.map(v => v.make).filter(Boolean))];
  }, [vehicles]);
  
  // Initialize filters from URL params on mount
  useEffect(() => {
    if (initialized) return;
    
    if (urlBrand) setSelectedBrand(urlBrand);
    if (urlCarSlug) setSelectedCarSlug(urlCarSlug);
    if (urlType) setSelectedType(urlType);
    
    setInitialized(true);
  }, [urlBrand, urlCarSlug, urlType, initialized]);

  // Fetch event types on mount
  useEffect(() => {
    async function fetchTypes() {
      try {
        const res = await fetch('/api/events/types');
        const data = await res.json();
        if (data.types) {
          setEventTypes(data.types);
        }
      } catch (err) {
        console.error('[EventsPage] Error fetching event types:', err);
      }
    }
    fetchTypes();
  }, []);
  
  // Fetch saved events when user is authenticated and has access
  useEffect(() => {
    async function fetchSavedEvents() {
      if (!isAuthenticated || !user?.id || !canSaveEvents) {
        setSavedEventSlugs(new Set());
        return;
      }
      
      try {
        const res = await fetch(`/api/users/${user.id}/saved-events`);
        if (res.ok) {
          const data = await res.json();
          const slugs = new Set(data.savedEvents?.map(se => se.event.slug) || []);
          setSavedEventSlugs(slugs);
        }
      } catch (err) {
        console.error('[EventsPage] Error fetching saved events:', err);
      }
    }
    fetchSavedEvents();
  }, [isAuthenticated, user?.id, canSaveEvents]);
  
  // Handle save toggle
  const handleSaveToggle = useCallback(async (eventSlug) => {
    // Check authentication
    if (!isAuthenticated) {
      authModal.openSignIn();
      return;
    }
    
    // Check tier access
    if (!canSaveEvents) {
      setShowUpgradePrompt(true);
      return;
    }
    
    setSavingEventSlug(eventSlug);
    const isCurrentlySaved = savedEventSlugs.has(eventSlug);
    
    // Optimistic update
    setSavedEventSlugs(prev => {
      const next = new Set(prev);
      if (isCurrentlySaved) {
        next.delete(eventSlug);
      } else {
        next.add(eventSlug);
      }
      return next;
    });
    
    try {
      const res = await fetch(`/api/events/${eventSlug}/save`, {
        method: isCurrentlySaved ? 'DELETE' : 'POST',
      });
      
      if (!res.ok) {
        // Revert on error
        setSavedEventSlugs(prev => {
          const next = new Set(prev);
          if (isCurrentlySaved) {
            next.add(eventSlug);
          } else {
            next.delete(eventSlug);
          }
          return next;
        });
        console.error('[EventsPage] Error saving/unsaving event');
      }
    } catch (err) {
      // Revert on error
      setSavedEventSlugs(prev => {
        const next = new Set(prev);
        if (isCurrentlySaved) {
          next.add(eventSlug);
        } else {
          next.delete(eventSlug);
        }
        return next;
      });
      console.error('[EventsPage] Error saving/unsaving event:', err);
    } finally {
      setSavingEventSlug(null);
    }
  }, [isAuthenticated, canSaveEvents, savedEventSlugs, authModal]);

  // Check if location query is a ZIP code
  const isZipCode = useMemo(() => {
    return /^\d{5}$/.test(locationQuery.trim());
  }, [locationQuery]);

  // Build query params from filters
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    
    // Location parsing - simple city/state or ZIP detection
    if (locationQuery.trim()) {
      const trimmed = locationQuery.trim();
      // Check if it's a ZIP code (5 digits)
      if (/^\d{5}$/.test(trimmed)) {
        params.set('zip', trimmed);
        // Add radius when searching by ZIP
        params.set('radius', radius.toString());
      } else if (trimmed.includes(',')) {
        // City, State format
        const [city, state] = trimmed.split(',').map(s => s.trim());
        if (city) params.set('city', city);
        if (state) params.set('state', state);
      } else {
        // Assume it's a city name
        params.set('city', trimmed);
      }
    }
    
    if (selectedRegion) params.set('region', selectedRegion);
    if (selectedScope) params.set('scope', selectedScope);
    if (selectedType) params.set('type', selectedType);
    if (selectedBrand) params.set('brand', selectedBrand);
    if (selectedCarSlug) params.set('car_slug', selectedCarSlug);
    if (trackEventsOnly) params.set('is_track_event', 'true');
    if (freeEventsOnly) params.set('is_free', 'true');
    
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    
    return params.toString();
  }, [locationQuery, radius, selectedRegion, selectedScope, selectedType, selectedBrand, selectedCarSlug, trackEventsOnly, freeEventsOnly, limit, offset]);
  
  // Toggle "Events for Your Cars" filter
  const toggleGarageEvents = useCallback(() => {
    if (showingGarageEvents) {
      // Clear garage filter
      setSelectedBrand('');
      setShowingGarageEvents(false);
    } else if (garageBrands.length > 0) {
      // Set to first garage brand (could be enhanced to show all)
      setSelectedBrand(garageBrands[0]);
      setShowingGarageEvents(true);
    }
  }, [showingGarageEvents, garageBrands]);

  // Fetch events when filters change
  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      setError(null);
      
      try {
        const queryString = buildQueryParams();
        const res = await fetch(`/api/events?${queryString}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await res.json();
        setEvents(data.events || []);
        setTotal(data.total || 0);
        setSearchCenter(data.searchCenter || null);
      } catch (err) {
        console.error('[EventsPage] Error fetching events:', err);
        setError('Unable to load events. Please try again later.');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchEvents();
  }, [buildQueryParams]);

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0);
  }, [locationQuery, radius, selectedRegion, selectedScope, selectedType, selectedBrand, selectedCarSlug, trackEventsOnly, freeEventsOnly]);

  // Clear all filters
  const clearFilters = () => {
    setLocationQuery('');
    setRadius(50);
    setSelectedRegion('');
    setSelectedScope('');
    setSelectedType('');
    setSelectedBrand('');
    setSelectedCarSlug('');
    setTrackEventsOnly(false);
    setFreeEventsOnly(false);
    setShowingGarageEvents(false);
    setSearchCenter(null);
    setOffset(0);
    // Clear URL params
    router.replace('/events', { scroll: false });
  };

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return locationQuery || selectedRegion || selectedScope || selectedType || selectedBrand || selectedCarSlug || trackEventsOnly || freeEventsOnly;
  }, [locationQuery, selectedRegion, selectedScope, selectedType, selectedBrand, selectedCarSlug, trackEventsOnly, freeEventsOnly]);
  
  // Generate breadcrumb context
  const filterContext = useMemo(() => {
    if (selectedCarSlug) {
      return { type: 'car', value: selectedCarSlug };
    }
    if (selectedBrand) {
      return { type: 'brand', value: selectedBrand };
    }
    return null;
  }, [selectedBrand, selectedCarSlug]);

  // Pagination
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className={styles.page}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>Events</span>
          <h1 className={styles.heroTitle}>
            {filterContext 
              ? <>Events for <span className={styles.titleAccent}>{filterContext.value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></>
              : <>Find Your <span className={styles.titleAccent}>Next Event</span></>}
          </h1>
          <p className={styles.heroSubtitle}>
            {filterContext
              ? `Upcoming ${filterContext.type === 'brand' ? filterContext.value : ''} events and meetups`
              : 'Discover Cars & Coffee meetups, track days, car shows, and more near you'}
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className={styles.filtersSection}>
        <div className={styles.filtersContainer}>
          {/* Location Search */}
          <div className={styles.locationSearch}>
            <div className={styles.searchInputWrapper}>
              <Icons.mapPin size={18} />
              <input
                type="text"
                placeholder="ZIP code or City, State"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            
            {/* Radius Slider - shown when ZIP is entered */}
            {isZipCode && (
              <div className={styles.radiusSlider}>
                <label className={styles.radiusLabel}>
                  <span>Radius: {radius} miles</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value, 10))}
                  className={styles.radiusInput}
                />
                <div className={styles.radiusMarks}>
                  <span>10mi</span>
                  <span>100mi</span>
                  <span>200mi</span>
                </div>
              </div>
            )}
          </div>

          {/* Filter Row */}
          <div className={styles.filterRow}>
            {/* Region */}
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className={styles.filterSelect}
            >
              {REGIONS.map(region => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>

            {/* Scope */}
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className={styles.filterSelect}
            >
              {SCOPES.map(scope => (
                <option key={scope.value} value={scope.value}>
                  {scope.label}
                </option>
              ))}
            </select>

            {/* Event Type */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Types</option>
              {eventTypes.map(type => (
                <option key={type.slug} value={type.slug}>
                  {type.icon} {type.name}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Filters */}
          <div className={styles.toggleRow}>
            {/* Events for Your Cars - only show when authenticated with garage cars */}
            {isAuthenticated && garageBrands.length > 0 && (
              <button 
                onClick={toggleGarageEvents}
                className={`${styles.garageEventsBtn} ${showingGarageEvents ? styles.garageEventsBtnActive : ''}`}
              >
                🚗 {showingGarageEvents ? 'Showing Your Cars' : 'Events for Your Cars'}
              </button>
            )}
            
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={trackEventsOnly}
                onChange={(e) => setTrackEventsOnly(e.target.checked)}
                className={styles.toggleCheckbox}
              />
              <span className={styles.toggleText}>🏁 Track Events Only</span>
            </label>

            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={freeEventsOnly}
                onChange={(e) => setFreeEventsOnly(e.target.checked)}
                className={styles.toggleCheckbox}
              />
              <span className={styles.toggleText}>💚 Free Events Only</span>
            </label>

            {hasActiveFilters && (
              <button onClick={clearFilters} className={styles.clearButton}>
                <Icons.refresh size={14} />
                Clear Filters
              </button>
            )}
          </div>

          {/* Results Count & Saved Events Link */}
          <div className={styles.resultsInfo}>
            <span className={styles.resultsCount}>
              {loading ? 'Loading...' : `${total} event${total !== 1 ? 's' : ''} found`}
            </span>
            {isAuthenticated && canSaveEvents && savedEventSlugs.size > 0 && (
              <Link href="/events/saved" className={styles.savedEventsLink}>
                ❤️ Saved Events ({savedEventSlugs.size})
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className={styles.eventsSection}>
        <div className={styles.eventsContainer}>
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
              {[...Array(6)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && events.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <Icons.calendar size={48} />
              </div>
              <h3>No events found</h3>
              <p>
                {hasActiveFilters 
                  ? 'Try expanding your search or adjusting filters.'
                  : 'There are no upcoming events at this time.'}
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className={styles.clearButton}>
                  Clear Filters
                </button>
              )}
              <Link href="/events/submit" className={styles.submitButton}>
                <Icons.plus size={16} />
                Submit an Event
              </Link>
            </div>
          )}

          {/* Events Grid */}
          {!loading && !error && events.length > 0 && (
            <>
              <div className={styles.eventsGrid}>
                {events.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    featured={event.featured}
                    isSaved={savedEventSlugs.has(event.slug)}
                    onSaveToggle={handleSaveToggle}
                    savingInProgress={savingEventSlug === event.slug}
                    showSaveButton={true}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                    disabled={offset === 0}
                    className={styles.pageButton}
                  >
                    ← Previous
                  </button>
                  <span className={styles.pageInfo}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setOffset(offset + limit)}
                    disabled={offset + limit >= total}
                    className={styles.pageButton}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Submit Event CTA */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Know of an event we're missing?</h2>
          <p className={styles.ctaSubtitle}>
            Help the community discover great car events in their area
          </p>
          <Link href="/events/submit" className={styles.ctaButton}>
            <Icons.plus size={18} />
            Submit an Event
          </Link>
        </div>
      </section>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={authModal.isOpen} 
        onClose={authModal.close}
        defaultMode={authModal.defaultMode}
      />
      
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className={styles.upgradeModal} onClick={() => setShowUpgradePrompt(false)}>
          <div className={styles.upgradeContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.upgradeClose}
              onClick={() => setShowUpgradePrompt(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3 className={styles.upgradeTitle}>Save Events for Later</h3>
            <p className={styles.upgradeDescription}>
              Bookmark events so you never miss them! Saving events is available for Collector members and above.
            </p>
            <div className={styles.upgradeActions}>
              <Link href="/join?upgrade=collector" className={styles.upgradeButton}>
                Upgrade to Collector
              </Link>
              <button 
                onClick={() => setShowUpgradePrompt(false)}
                className={styles.upgradeDismiss}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading fallback for Suspense boundary
function EventsPageLoading() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <span className={styles.badge}>Events</span>
          <h1 className={styles.heroTitle}>
            Find Your <span className={styles.titleAccent}>Next Event</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Discover Cars & Coffee meetups, track days, car shows, and more near you
          </p>
        </div>
      </section>
      <section className={styles.eventsSection}>
        <div className={styles.eventsContainer}>
          <div className={styles.eventsGrid}>
            {[...Array(6)].map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Wrap with Suspense to allow static generation with useSearchParams
export default function EventsPage() {
  return (
    <Suspense fallback={<EventsPageLoading />}>
      <EventsPageContent />
    </Suspense>
  );
}

