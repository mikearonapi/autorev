'use client';

/**
 * Event Detail Page - Simplified Fullscreen View
 * 
 * GRAVL-Inspired Design matching DynoLogModal:
 * - Centered white card on charcoal overlay
 * - Essential information only: Date, Location, Actions
 * - Clean, focused UX
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { createPortal } from 'react-dom';


import AddToCalendarButton from '@/components/AddToCalendarButton';
import EventAttendeesPreview from '@/components/EventAttendeesPreview';
import { useAuth } from '@/components/providers/AuthProvider';
import SaveEventButton from '@/components/SaveEventButton';
import { useUserSavedEvents } from '@/hooks/useUserData';
import { isPastDate } from '@/lib/dateUtils';

import styles from './page.module.css';

/**
 * Format date for display
 */
function formatEventDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time for display
 */
function formatTime(timeStr) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Get Google Maps URL for an address
 */
function getGoogleMapsUrl(event) {
  const parts = [];
  if (event.venue_name) parts.push(event.venue_name);
  if (event.address) parts.push(event.address);
  if (event.city) parts.push(event.city);
  if (event.state) parts.push(event.state);
  if (event.zip) parts.push(event.zip);
  
  const query = encodeURIComponent(parts.join(', '));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

/**
 * Icons
 */
const Icons = {
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
  externalLink: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/>
      <line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  ),
  share: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  dollar: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
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
};

export default function CommunityEventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSavedLocal, setIsSavedLocal] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  
  // Mount check for portal rendering (SSR compatibility)
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  // Lock body scroll and set safe area colors when page is mounted
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    if (mounted) {
      document.body.style.overflow = 'hidden';
      // Set safe area backgrounds to charcoal overlay color
      document.documentElement.style.setProperty('--safe-area-top-bg', '#1a1a1a');
      document.documentElement.style.setProperty('--safe-area-bottom-bg', '#1a1a1a');
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.removeProperty('--safe-area-top-bg');
      document.documentElement.style.removeProperty('--safe-area-bottom-bg');
    };
  }, [mounted]);
  
  // React Query hook for saved events
  const { data: savedEventsData } = useUserSavedEvents(
    user?.id, 
    { includeExpired: true },
    { enabled: isAuthenticated && !!user?.id && !authLoading }
  );
  
  // Derive saved status from query data or local state
  const savedSlugs = useMemo(() => {
    const slugs = new Set(savedEventsData?.savedEvents?.map(se => se.event?.slug).filter(Boolean) || []);
    return slugs;
  }, [savedEventsData]);
  
  const isSaved = isSavedLocal !== null ? isSavedLocal : savedSlugs.has(slug);
  
  // Sync local state with query data
  useEffect(() => {
    if (savedEventsData && slug) {
      setIsSavedLocal(savedSlugs.has(slug));
    }
  }, [savedEventsData, slug, savedSlugs]);

  // Fetch event data
  useEffect(() => {
    if (!slug) return;
    
    async function fetchEvent() {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(`/api/events/${slug}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            setError('Event not found');
          } else {
            throw new Error('Failed to fetch event');
          }
          return;
        }
        
        const data = await res.json();
        setEvent(data.event);
      } catch (err) {
        console.error('[EventDetailPage] Error:', err);
        setError('Unable to load event details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchEvent();
  }, [slug]);

  // Handle save change
  const handleSaveChange = useCallback((eventSlug, newSavedState) => {
    setIsSavedLocal(newSavedState);
  }, []);

  // Handle share
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ 
        title: event?.name, 
        url: window.location.href 
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied!');
    }
  }, [event?.name]);
  
  // Handle close/back navigation
  const handleClose = useCallback(() => {
    router.push('/community');
  }, [router]);

  // Don't render until mounted (SSR compatibility for portal)
  if (!mounted) return null;

  // Loading state
  if (loading) {
    const loadingContent = (
      <div className={styles.overlay} data-overlay-modal>
        <div className={styles.modal}>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <div className={styles.skeletonTitle} />
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">×</button>
            </div>
            <div className={styles.skeletonActions} />
          </div>
          <div className={styles.content}>
            <div className={styles.skeletonSection} />
            <div className={styles.skeletonSection} />
            <div className={styles.skeletonSection} />
          </div>
        </div>
      </div>
    );
    
    return createPortal(loadingContent, document.body);
  }

  // Error state
  if (error || !event) {
    const errorContent = (
      <div className={styles.overlay} onClick={handleClose} data-overlay-modal>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <h2 className={styles.title}>Event</h2>
              <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">×</button>
            </div>
          </div>
          <div className={styles.content}>
            <div className={styles.errorState}>
              <h3>Event Not Found</h3>
              <p>{error || 'The event you\'re looking for doesn\'t exist or has expired.'}</p>
            </div>
          </div>
        </div>
      </div>
    );
    
    return createPortal(errorContent, document.body);
  }

  const {
    name,
    description,
    start_date,
    end_date,
    start_time,
    end_time,
    timezone,
    venue_name,
    address,
    city,
    state,
    zip,
    cost_text,
    is_free,
  } = event;

  const isMultiDay = end_date && end_date !== start_date;
  const formattedStartDate = formatEventDate(start_date);
  const formattedEndDate = isMultiDay ? formatEventDate(end_date) : null;
  const formattedStartTime = formatTime(start_time);
  const formattedEndTime = formatTime(end_time);
  const googleMapsUrl = getGoogleMapsUrl(event);
  
  // Check if event is in the past
  const eventEndDate = end_date || start_date;
  const isPastEvent = eventEndDate ? isPastDate(eventEndDate) : false;

  const pageContent = (
    <div className={styles.overlay} onClick={handleClose} data-overlay-modal>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{name}</h2>
            <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">×</button>
          </div>
          
          {/* Action Buttons - Right under title */}
          <div className={styles.actionRow}>
            <SaveEventButton
              eventId={event.id}
              eventSlug={slug}
              eventName={name}
              isSaved={isSaved}
              onSaveChange={handleSaveChange}
              size="small"
              theme="light"
            />
            {!isPastEvent && <AddToCalendarButton event={event} variant="compact" />}
            <button 
              className={styles.iconBtn}
              onClick={handleShare}
              aria-label="Share event"
            >
              <Icons.share size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className={styles.content}>
          {/* Past Event Banner */}
          {isPastEvent && (
            <div className={styles.pastBanner}>
              This event has ended
            </div>
          )}

          {/* Cost Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Icons.dollar size={16} />
              Cost
            </h3>
            <div className={styles.sectionContent}>
              <span className={`${styles.costBadge} ${is_free ? styles.costFree : ''}`}>
                {is_free ? 'Free' : cost_text || 'Contact organizer'}
              </span>
            </div>
          </div>

          {/* Description (if present) */}
          {description && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>About</h3>
              <p className={styles.description}>{description}</p>
            </div>
          )}

          {/* Date & Time Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Icons.calendar size={16} />
              Date & Time
            </h3>
            <div className={styles.sectionContent}>
              {isMultiDay ? (
                <div className={styles.dateRange}>
                  <span className={styles.dateLabel}>From</span>
                  <span className={styles.dateValue}>{formattedStartDate}</span>
                  <span className={styles.dateLabel}>To</span>
                  <span className={styles.dateValue}>{formattedEndDate}</span>
                </div>
              ) : (
                <p className={styles.dateValue}>{formattedStartDate}</p>
              )}
              {(formattedStartTime || formattedEndTime) && (
                <p className={styles.timeValue}>
                  {formattedStartTime}
                  {formattedStartTime && formattedEndTime && ' – '}
                  {formattedEndTime}
                  {timezone && (
                    <span className={styles.timezone}>
                      {' '}({timezone.split('/').pop().replace('_', ' ')})
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Location Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Icons.mapPin size={16} />
              Location
            </h3>
            <div className={styles.sectionContent}>
              {venue_name && <p className={styles.venueName}>{venue_name}</p>}
              <p className={styles.address}>
                {address && <>{address}<br /></>}
                {city}{state ? `, ${state}` : ''} {zip}
              </p>
              <a 
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.mapLink}
              >
                <Icons.externalLink size={14} />
                View on Google Maps
              </a>
            </div>
          </div>

          {/* Attendees Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Icons.users size={16} />
              Who's Going
            </h3>
            <div className={styles.sectionContent}>
              <EventAttendeesPreview 
                eventSlug={slug} 
                variant="compact"
                maxAvatars={6}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(pageContent, document.body);
}
