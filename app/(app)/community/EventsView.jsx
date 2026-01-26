'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import LoadingSpinner from '@/components/LoadingSpinner';
import EventRSVPButton from '@/components/EventRSVPButton';
import styles from './EventsView.module.css';

/**
 * EventsView - Community Events Tab
 * 
 * Shows upcoming car events with RSVP functionality.
 * Features:
 * - Search by event name, city, or venue
 * - Location-based filtering (Near Me)
 * - Category filters (Cars & Coffee, Track Day, etc.)
 * - RSVP with Going/Interested status
 * - Toggle between "Find Events" and "My Events" (RSVP'd/saved)
 */

// View modes
const VIEW_MODES = {
  FIND: 'find',
  MY_EVENTS: 'my_events',
};


// Icons - following brand guidelines (Lucide style, 1.5px stroke)
const SearchIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const ClearIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const CalendarIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const MapPinIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

// NOTE: ChevronRightIcon available for future event navigation enhancement
const _ChevronRightIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const ChevronDownIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const UsersIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const LocateIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2v4"/>
    <path d="M12 18v4"/>
    <path d="M2 12h4"/>
    <path d="M18 12h4"/>
    <circle cx="12" cy="12" r="4"/>
  </svg>
);

const CheckCircleIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const HeartIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const RepeatIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="17 1 21 5 17 9"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <polyline points="7 23 3 19 7 15"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);


// Fallback event types - matches database seed data
// Used if API fails to load types
const FALLBACK_EVENT_TYPES = [
  { slug: 'cars-and-coffee', name: 'Cars & Coffee' },
  { slug: 'car-show', name: 'Car Show' },
  { slug: 'track-day', name: 'Track Day' },
  { slug: 'autocross', name: 'Autocross' },
  { slug: 'cruise', name: 'Cruise' },
  { slug: 'club-meetup', name: 'Club Meetup' },
  { slug: 'industry', name: 'Industry' },
  { slug: 'auction', name: 'Auction' },
  { slug: 'professional-race', name: 'Pro Race' },
];

// Event type colors - using brand-approved colors
const EVENT_TYPE_COLORS = {
  'cars-and-coffee': 'var(--brand-amber, #f59e0b)',
  'track-day': 'var(--brand-error, #ef4444)',
  'autocross': 'var(--brand-amber, #f59e0b)',
  'car-show': 'var(--brand-blue, #3b82f6)',
  'club-meetup': 'var(--brand-teal, #10b981)',
  'professional-race': 'var(--brand-error, #ef4444)',
  'cruise': 'var(--brand-teal, #10b981)',
  'auction': 'var(--brand-text-tertiary, #64748b)',
  'industry': 'var(--brand-text-secondary, #94a3b8)',
  'time-attack': 'var(--brand-error, #ef4444)',
  'default': 'var(--brand-text-tertiary, #64748b)',
};

// Get month and day for date badge
function getDateParts(dateStr) {
  if (!dateStr) return { month: '', day: '', weekday: '', isoDate: '' };
  const date = new Date(dateStr + 'T00:00:00');
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: date.getDate().toString(),
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    isoDate: dateStr, // ISO format for datetime attribute
  };
}

/**
 * Detect if search query looks like a location (city name, ZIP code, or "City, ST")
 * Used to trigger geocoded radius search vs text search on event name
 */
function looksLikeLocation(query) {
  if (!query || query.length < 2) return false;
  const trimmed = query.trim();
  
  // ZIP code pattern (5 digits, optionally with +4)
  if (/^\d{5}(-\d{4})?$/.test(trimmed)) return true;
  
  // "City, ST" or "City, State" pattern
  if (/^[a-zA-Z\s]+,\s*[A-Z]{2}$/i.test(trimmed)) return true;
  
  // Single word that could be a city (4+ chars, letters only)
  // Avoid triggering on short words or words with numbers (likely event names)
  if (/^[a-zA-Z]{4,}$/.test(trimmed)) return true;
  
  return false;
}

export default function EventsView() {
  const { user, profile, isAuthenticated } = useAuth();
  
  // View mode state
  const [viewMode, setViewMode] = useState(VIEW_MODES.FIND);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [nearMeEnabled, setNearMeEnabled] = useState(false);
  const [searchRadius, setSearchRadius] = useState(50); // Default 50 miles
  // Initialize with fallback types so pills show immediately (API will update if available)
  const [eventTypes, setEventTypes] = useState(FALLBACK_EVENT_TYPES);
  
  // Track if current search is location-based (for showing radius control)
  const isLocationSearch = useMemo(() => {
    const queryTrimmed = debouncedQuery.trim();
    return queryTrimmed && looksLikeLocation(queryTrimmed);
  }, [debouncedQuery]);
  
  // Data state
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMyEvents, setIsLoadingMyEvents] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  
  const searchInputRef = useRef(null);
  
  // Get user's location for "near me" filter
  const userLocation = useMemo(() => {
    if (profile?.location_city && profile?.location_state) {
      return `${profile.location_city}, ${profile.location_state}`;
    }
    return null;
  }, [profile?.location_city, profile?.location_state]);
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);
  
  // Fetch user's events (RSVPs + saved) when switching to "My Events" mode
  useEffect(() => {
    async function fetchMyEvents() {
      if (viewMode !== VIEW_MODES.MY_EVENTS || !isAuthenticated || !user?.id) {
        return;
      }
      
      try {
        setIsLoadingMyEvents(true);
        setError(null);
        
        const res = await fetch(`/api/users/${user.id}/my-events`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch your events');
        }
        
        const data = await res.json();
        setMyEvents(data.events || []);
      } catch (err) {
        console.error('[EventsView] Error fetching my events:', err);
        setError('Unable to load your events');
        setMyEvents([]); // Clear any stale data on error
      } finally {
        setIsLoadingMyEvents(false);
      }
    }
    
    fetchMyEvents();
  }, [viewMode, isAuthenticated, user?.id]);
  
  // Fetch event types on mount (with fallback)
  useEffect(() => {
    async function fetchEventTypes() {
      try {
        const res = await fetch('/api/events/types');
        if (res.ok) {
          const data = await res.json();
          const types = data.types || [];
          // Use API data if available, otherwise fallback
          setEventTypes(types.length > 0 ? types : FALLBACK_EVENT_TYPES);
        } else {
          console.warn('[EventsView] Event types API returned', res.status, '- using fallback');
          setEventTypes(FALLBACK_EVENT_TYPES);
        }
      } catch (err) {
        console.error('[EventsView] Failed to fetch event types:', err);
        setEventTypes(FALLBACK_EVENT_TYPES);
      }
    }
    fetchEventTypes();
  }, []);

  // Fetch events when filters change
  useEffect(() => {
    async function fetchEvents() {
      try {
        setIsSearching(true);
        setError(null);
        
        const params = new URLSearchParams();
        params.set('limit', '30');
        
        // Determine if search query looks like a location
        const queryTrimmed = debouncedQuery.trim();
        const isLocationSearch = queryTrimmed && looksLikeLocation(queryTrimmed);
        
        // Determine if we're doing a location-based search
        const doingLocationSearch = (queryTrimmed && looksLikeLocation(queryTrimmed)) || (nearMeEnabled && userLocation);
        
        // Add search query - either as location or text search
        if (queryTrimmed) {
          if (looksLikeLocation(queryTrimmed)) {
            // Treat as location search with radius
            params.set('location', queryTrimmed);
            params.set('radius', String(searchRadius));
          } else {
            // Regular text search on event name/venue
            params.set('query', queryTrimmed);
          }
        }
        
        // Add event type filter
        if (selectedType) {
          params.set('type', selectedType);
        }
        
        // Add location filter if "near me" is enabled and user has location
        // (this overrides location search if both are active)
        if (nearMeEnabled && userLocation) {
          params.set('location', userLocation);
          params.set('radius', String(searchRadius));
        }
        
        // Sort by distance when doing location search, otherwise by date
        params.set('sort', doingLocationSearch ? 'distance' : 'date');
        
        // Group recurring events (e.g., weekly Cars & Coffee) into single entries
        params.set('group_recurring', 'true');
        
        const res = await fetch(`/api/events?${params.toString()}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error('[EventsView] Error:', err);
        setError('Unable to load events');
      } finally {
        setIsLoading(false);
        setIsSearching(false);
      }
    }
    
    fetchEvents();
  }, [debouncedQuery, selectedType, nearMeEnabled, userLocation, searchRadius]);
  
  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  }, []);
  
  // Toggle event type filter
  const toggleEventType = useCallback((slug) => {
    setSelectedType(prev => prev === slug ? null : slug);
  }, []);
  
  // Switch view mode
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
    setIsDropdownOpen(false);
    // Clear filters when switching modes
    if (mode === VIEW_MODES.MY_EVENTS) {
      setSearchQuery('');
      setSelectedType(null);
      setNearMeEnabled(false);
    }
  }, []);
  
  // Get the display events based on view mode
  const displayEvents = viewMode === VIEW_MODES.MY_EVENTS ? myEvents : events;
  const isLoadingEvents = viewMode === VIEW_MODES.MY_EVENTS ? isLoadingMyEvents : isLoading;

  if (isLoadingEvents) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner 
          variant="branded" 
          text={viewMode === VIEW_MODES.MY_EVENTS ? "Loading Your Events" : "Loading Events"}
          subtext={viewMode === VIEW_MODES.MY_EVENTS ? "Getting your RSVPs and saved events..." : "Finding car events near you..."}
        />
      </div>
    );
  }

  // Error state for "Find Events" mode - show inline error with retry
  // For "My Events" mode, we show the error within the main container so dropdown is accessible
  if (error && !isSearching && viewMode === VIEW_MODES.FIND) {
    return (
      <div className={styles.errorContainer}>
        <CalendarIcon size={48} />
        <p className={styles.errorTitle}>{error}</p>
        <button onClick={() => window.location.reload()} className={styles.retryBtn}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Compact Header Section */}
      <div className={styles.headerSection}>
        {/* Title Row */}
        <div className={styles.header}>
          <div className={styles.titleDropdown} ref={dropdownRef}>
            <button 
              className={styles.titleDropdownBtn}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="listbox"
            >
              <h2 className={styles.title}>
                {viewMode === VIEW_MODES.FIND ? 'Find Events' : 'My Events'}
              </h2>
              <ChevronDownIcon size={16} />
            </button>
            
            {isDropdownOpen && (
              <div className={styles.dropdownMenu} role="listbox">
                <button
                  className={`${styles.dropdownItem} ${viewMode === VIEW_MODES.FIND ? styles.dropdownItemActive : ''}`}
                  onClick={() => handleViewModeChange(VIEW_MODES.FIND)}
                  role="option"
                  aria-selected={viewMode === VIEW_MODES.FIND}
                >
                  <CalendarIcon size={16} />
                  <span>Find Events</span>
                  {viewMode === VIEW_MODES.FIND && <CheckCircleIcon size={14} />}
                </button>
                <button
                  className={`${styles.dropdownItem} ${viewMode === VIEW_MODES.MY_EVENTS ? styles.dropdownItemActive : ''}`}
                  onClick={() => handleViewModeChange(VIEW_MODES.MY_EVENTS)}
                  role="option"
                  aria-selected={viewMode === VIEW_MODES.MY_EVENTS}
                  disabled={!isAuthenticated}
                  title={!isAuthenticated ? 'Sign in to see your events' : undefined}
                >
                  <HeartIcon size={16} />
                  <span>My Events</span>
                  {viewMode === VIEW_MODES.MY_EVENTS && <CheckCircleIcon size={14} />}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Search Bar - directly under title */}
        {viewMode === VIEW_MODES.FIND && (
          <div className={styles.searchBar}>
            <SearchIcon size={16} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search events or enter city/ZIP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button onClick={clearSearch} className={styles.clearBtn} aria-label="Clear search">
                <ClearIcon size={14} />
              </button>
            )}
          </div>
        )}
        
        {/* Compact Filter Row - Categories + Location + Results */}
        {viewMode === VIEW_MODES.FIND && (
          <div className={styles.filterRow}>
            {/* Category Pills - inline scrollable */}
            <div className={styles.categoryScroller}>
              {(eventTypes.length > 0 ? eventTypes : FALLBACK_EVENT_TYPES).map((type) => (
                <button
                  key={type.slug}
                  className={`${styles.categoryPill} ${selectedType === type.slug ? styles.categoryPillActive : ''}`}
                  onClick={() => toggleEventType(type.slug)}
                  style={selectedType === type.slug ? { 
                    backgroundColor: EVENT_TYPE_COLORS[type.slug] || EVENT_TYPE_COLORS.default,
                    borderColor: EVENT_TYPE_COLORS[type.slug] || EVENT_TYPE_COLORS.default,
                  } : {}}
                >
                  {type.name}
                </button>
              ))}
              
              {/* Divider */}
              <span className={styles.filterDivider} />
              
              {/* Near Me / Location Button */}
              {userLocation && (
                <button 
                  className={`${styles.locationBtn} ${nearMeEnabled ? styles.locationBtnActive : ''}`}
                  onClick={() => setNearMeEnabled(!nearMeEnabled)}
                  title={`Events near ${userLocation}`}
                >
                  <LocateIcon size={12} />
                  <span>Near Me</span>
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Active Filters Bar - compact, only when filters active */}
        {viewMode === VIEW_MODES.FIND && (nearMeEnabled || selectedType || isLocationSearch || debouncedQuery) && (
          <div className={styles.activeFiltersBar}>
            {/* Results count */}
            <span className={styles.resultsCount}>
              {isSearching ? 'Searching...' : `${displayEvents.length} found`}
            </span>
            
            {/* Active filter pills */}
            <div className={styles.filterPills}>
              {/* Location pill */}
              {(isLocationSearch || nearMeEnabled) && (
                <div className={styles.filterPill}>
                  <MapPinIcon size={10} />
                  <span>{nearMeEnabled ? 'Near me' : debouncedQuery.trim()}</span>
                  <select
                    className={styles.radiusSelect}
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(Number(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value={25}>25mi</option>
                    <option value={50}>50mi</option>
                    <option value={100}>100mi</option>
                    <option value={200}>200mi</option>
                  </select>
                  <button 
                    className={styles.pillRemove}
                    onClick={() => nearMeEnabled ? setNearMeEnabled(false) : setSearchQuery('')}
                    aria-label="Remove"
                  >
                    <ClearIcon size={8} />
                  </button>
                </div>
              )}
              
              {/* Type pill */}
              {selectedType && (
                <div className={styles.filterPill}>
                  <span>{eventTypes.find(t => t.slug === selectedType)?.name || selectedType}</span>
                  <button 
                    className={styles.pillRemove}
                    onClick={() => setSelectedType(null)}
                    aria-label="Remove"
                  >
                    <ClearIcon size={8} />
                  </button>
                </div>
              )}
            </div>
            
            {/* Clear all */}
            <button 
              className={styles.clearAllBtn}
              onClick={() => {
                setSearchQuery('');
                setSelectedType(null);
                setNearMeEnabled(false);
                setSearchRadius(50);
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>
      
      {/* My Events Mode Header */}
      {viewMode === VIEW_MODES.MY_EVENTS && (
        <div className={styles.myEventsHeader}>
          {!isAuthenticated ? (
            <p className={styles.signInPrompt}>
              Sign in to see events you&apos;ve RSVP&apos;d to or saved
            </p>
          ) : myEvents.length > 0 && !error ? (
            <p className={styles.myEventsCount}>
              {myEvents.length} event{myEvents.length !== 1 ? 's' : ''} you&apos;re interested in
            </p>
          ) : null}
        </div>
      )}
      
      {/* My Events Error State - shown within container so dropdown is accessible */}
      {viewMode === VIEW_MODES.MY_EVENTS && error && !isSearching && (
        <div className={styles.emptyState}>
          <CalendarIcon size={48} />
          <p className={styles.emptyTitle}>{error}</p>
          <span className={styles.emptySubtext}>
            There was a problem loading your events
          </span>
          <button 
            className={styles.retryBtn}
            onClick={() => {
              setError(null);
              setIsLoadingMyEvents(true);
              // Re-trigger the useEffect by toggling view mode
              setViewMode(VIEW_MODES.FIND);
              setTimeout(() => setViewMode(VIEW_MODES.MY_EVENTS), 100);
            }}
          >
            Try Again
          </button>
          <button 
            className={styles.clearFiltersLinkBtn}
            onClick={() => handleViewModeChange(VIEW_MODES.FIND)}
            style={{ marginTop: 'var(--space-sm, 12px)' }}
          >
            Browse All Events
          </button>
        </div>
      )}

      {/* Events List */}
      {/* Skip if showing error state for My Events mode */}
      {!(viewMode === VIEW_MODES.MY_EVENTS && error && !isSearching) && displayEvents.length === 0 ? (
        <div className={styles.emptyState}>
          {viewMode === VIEW_MODES.MY_EVENTS ? (
            <>
              <HeartIcon size={48} />
              <p className={styles.emptyTitle}>
                {!isAuthenticated 
                  ? 'Sign in to see your events'
                  : 'No events yet'}
              </p>
              <span className={styles.emptySubtext}>
                {!isAuthenticated
                  ? 'Track events you\'re interested in'
                  : 'RSVP to events or save them to see them here'}
              </span>
              {isAuthenticated && (
                <button 
                  className={styles.clearFiltersLinkBtn}
                  onClick={() => handleViewModeChange(VIEW_MODES.FIND)}
                >
                  Find Events
                </button>
              )}
            </>
          ) : (
            <>
              <CalendarIcon size={48} />
              <p className={styles.emptyTitle}>
                {debouncedQuery || selectedType 
                  ? 'No events match your search' 
                  : 'No upcoming events found'}
              </p>
              <span className={styles.emptySubtext}>
                {debouncedQuery || selectedType
                  ? 'Try adjusting your filters'
                  : 'Check back soon for new events!'}
              </span>
              {(debouncedQuery || selectedType) && (
                <button 
                  className={styles.clearFiltersLinkBtn}
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType(null);
                    setNearMeEnabled(false);
                  }}
                >
                  Clear all filters
                </button>
              )}
            </>
          )}
        </div>
      ) : !(viewMode === VIEW_MODES.MY_EVENTS && error && !isSearching) ? (
        <div className={styles.eventsList}>
          {displayEvents.map((event) => {
            const dateParts = getDateParts(event.start_date);
            const typeSlug = event.event_type?.slug || 'default';
            const typeColor = EVENT_TYPE_COLORS[typeSlug] || EVENT_TYPE_COLORS.default;
            
            return (
              <div key={event.id} className={styles.eventCard}>
                {/* Date Badge - semantic time element for accessibility */}
                <time className={styles.dateBadge} dateTime={dateParts.isoDate}>
                  <span className={styles.dateMonth}>{dateParts.month}</span>
                  <span className={styles.dateDay}>{dateParts.day}</span>
                  <span className={styles.dateWeekday}>{dateParts.weekday}</span>
                </time>
                
                {/* Event Info */}
                <Link href={`/community/events/${event.slug}`} className={styles.eventInfo}>
                  <div className={styles.eventHeader}>
                    <span 
                      className={styles.eventType}
                      style={{ backgroundColor: typeColor }}
                    >
                      {event.event_type?.name || 'Event'}
                    </span>
                    {event.is_free && <span className={styles.freeBadge}>Free</span>}
                    {/* User Status Badge - shown in My Events mode */}
                    {viewMode === VIEW_MODES.MY_EVENTS && event.user_status && (
                      <span className={`${styles.userStatusBadge} ${
                        event.user_status.rsvp_status === 'going' 
                          ? styles.userStatusGoing 
                          : event.user_status.rsvp_status === 'interested'
                          ? styles.userStatusInterested
                          : styles.userStatusSaved
                      }`}>
                        {event.user_status.rsvp_status === 'going' && (
                          <>
                            <CheckCircleIcon size={10} />
                            <span>Going</span>
                          </>
                        )}
                        {event.user_status.rsvp_status === 'interested' && (
                          <>
                            <CheckCircleIcon size={10} />
                            <span>Interested</span>
                          </>
                        )}
                        {event.user_status.type === 'saved' && (
                          <>
                            <HeartIcon size={10} />
                            <span>Saved</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>
                  
                  <h3 className={styles.eventName}>{event.name}</h3>
                  
                  <div className={styles.eventLocation}>
                    <MapPinIcon size={12} />
                    <span>
                      {event.venue_name ? `${event.venue_name}, ` : ''}
                      {event.city}{event.state ? `, ${event.state}` : ''}
                    </span>
                    {event.distance_miles && (
                      <span className={styles.distance}>{Math.round(event.distance_miles)} mi</span>
                    )}
                  </div>
                  
                  {/* Attendees Preview */}
                  {event.rsvp_counts && (event.rsvp_counts.going > 0 || event.rsvp_counts.interested > 0) && (
                    <div className={styles.attendeesRow}>
                      <UsersIcon size={12} />
                      <span>
                        {event.rsvp_counts.going > 0 && `${event.rsvp_counts.going} going`}
                        {event.rsvp_counts.going > 0 && event.rsvp_counts.interested > 0 && ' · '}
                        {event.rsvp_counts.interested > 0 && `${event.rsvp_counts.interested} interested`}
                      </span>
                    </div>
                  )}
                  
                  {/* Recurring Event Indicator */}
                  {event.is_recurring && event.upcoming_occurrences > 1 && (
                    <div className={styles.recurringBadge}>
                      <RepeatIcon size={12} />
                      <span>
                        {event.series?.recurrence_rule || 'Recurring'}
                        {' · '}{event.upcoming_occurrences} upcoming
                      </span>
                    </div>
                  )}
                </Link>
                
                {/* RSVP Button */}
                <div className={styles.rsvpSection}>
                  <EventRSVPButton 
                    eventSlug={event.slug}
                    eventName={event.name}
                    variant="compact"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      
      {/* View All Link */}
{/* Events footer removed - events are shown inline */}
    </div>
  );
}
