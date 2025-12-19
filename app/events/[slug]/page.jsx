'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import EventCard from '@/components/EventCard';
import { useAuth } from '@/components/providers/AuthProvider';
import { useAuthModal } from '@/components/AuthModal';
import { usePremiumAccess, TeaserPrompt } from '@/components/PremiumGate';
import { EventTypeIcon, TrackEventBadgeIcon, FeaturedBadgeIcon } from '@/components/icons/EventIcons';

/**
 * Format a date for display
 */
function formatEventDate(dateStr, options = {}) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: options.weekday || 'long',
    month: options.month || 'long',
    day: options.day || 'numeric',
    year: options.year || 'numeric',
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
  if (event.country) parts.push(event.country);
  
  const query = encodeURIComponent(parts.join(', '));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

// Icons
const Icons = {
  arrowLeft: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
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
  clock: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
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
  heart: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
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
  car: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  ),
};

export default function EventDetailPage() {
  const params = useParams();
  const slug = params?.slug;
  
  const [event, setEvent] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  
  // Save functionality
  const { isAuthenticated, user } = useAuth();
  const { openSignIn } = useAuthModal();
  const { hasAccess: canSaveEvents, shouldShowUpgradePrompt, upgradeCTA } = usePremiumAccess('eventSaves', 'collector');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [savedEventSlugs, setSavedEventSlugs] = useState(new Set());

  // Check if event is saved
  useEffect(() => {
    async function checkSavedStatus() {
      if (!isAuthenticated || !user?.id || !canSaveEvents || !slug) {
        setIsSaved(false);
        return;
      }
      
      try {
        const res = await fetch(`/api/users/${user.id}/saved-events`);
        if (res.ok) {
          const data = await res.json();
          const slugs = new Set(data.savedEvents.map(item => item.event.slug));
          setSavedEventSlugs(slugs);
          setIsSaved(slugs.has(slug));
        }
      } catch (err) {
        console.error('[EventDetailPage] Error checking saved status:', err);
      }
    }
    
    checkSavedStatus();
  }, [isAuthenticated, user?.id, canSaveEvents, slug]);

  // Handle save toggle for main event (direct button, not SaveEventButton)
  const handleSaveToggle = useCallback(async () => {
    if (!isAuthenticated) {
      openSignIn();
      return;
    }
    
    if (!canSaveEvents) {
      setShowUpgradePrompt(true);
      return;
    }
    
    setIsSaving(true);
    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const res = await fetch(`/api/events/${slug}/save`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      if (res.ok) {
        setIsSaved(!isSaved);
      } else {
        const data = await res.json();
        console.error('[EventDetailPage] Save error:', data.error);
      }
    } catch (err) {
      console.error('[EventDetailPage] Error toggling save:', err);
    } finally {
      setIsSaving(false);
    }
  }, [isAuthenticated, canSaveEvents, isSaved, slug, openSignIn]);

  // Handle related event save toggle - called by SaveEventButton after it makes the API call
  // SaveEventButton handles auth checks, tier checks, and API calls internally
  const handleRelatedSaveToggle = useCallback((eventSlug, isSaved) => {
    // Update local saved events tracking
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
        
        // Fetch related events
        if (data.event) {
          fetchRelatedEvents(data.event);
        }
      } catch (err) {
        console.error('[EventDetailPage] Error:', err);
        setError('Unable to load event details');
      } finally {
        setLoading(false);
      }
    }
    
    async function fetchRelatedEvents(eventData) {
      try {
        // Build query for related events (same type or same region)
        const params = new URLSearchParams();
        if (eventData.event_type?.slug) {
          params.set('type', eventData.event_type.slug);
        }
        params.set('limit', '4');
        
        const res = await fetch(`/api/events?${params.toString()}`);
        const data = await res.json();
        
        // Filter out current event
        const related = (data.events || []).filter(e => e.slug !== slug);
        setRelatedEvents(related.slice(0, 4));
      } catch (err) {
        console.error('[EventDetailPage] Error fetching related events:', err);
      }
    }
    
    fetchEvent();
  }, [slug]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <h2>Event Not Found</h2>
          <p>{error || 'The event you\'re looking for doesn\'t exist or has expired.'}</p>
          <Link href="/events" className={styles.backButton}>
            <Icons.arrowLeft size={16} />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const {
    name,
    description,
    event_type,
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
    country,
    region,
    scope,
    source_url,
    source_name,
    registration_url,
    image_url,
    cost_text,
    is_free,
    featured,
    car_affinities = [],
  } = event;

  const isMultiDay = end_date && end_date !== start_date;
  const formattedStartDate = formatEventDate(start_date);
  const formattedEndDate = isMultiDay ? formatEventDate(end_date) : null;
  const formattedStartTime = formatTime(start_time);
  const formattedEndTime = formatTime(end_time);
  const googleMapsUrl = getGoogleMapsUrl(event);
  const hasImage = image_url && !imageError;

  // Group affinities by type
  const brandAffinities = car_affinities.filter(a => a.brand);
  const carAffinities = car_affinities.filter(a => a.car_slug);

  return (
    <div className={styles.page}>
      {/* Back Link */}
      <div className={styles.backLinkContainer}>
        <Link href="/events" className={styles.backLink}>
          <Icons.arrowLeft size={16} />
          Back to Events
        </Link>
      </div>

      {/* Hero Image */}
      {hasImage && (
        <div className={styles.heroImage}>
          <Image
            src={image_url}
            alt={name}
            fill
            priority
            className={styles.image}
            onError={() => setImageError(true)}
          />
          <div className={styles.heroOverlay} />
        </div>
      )}

      {/* Main Content */}
      <div className={styles.content}>
        <div className={styles.mainColumn}>
          {/* Event Header */}
          <header className={styles.header}>
            <div className={styles.badges}>
              {event_type && (
                <span className={styles.typeBadge}>
                  <EventTypeIcon slug={event_type.slug} size={16} />
                  {event_type.name}
                </span>
              )}
              {event_type?.is_track_event && (
                <span className={styles.trackBadge}>
                  <TrackEventBadgeIcon size={14} />
                  Track Event
                </span>
              )}
              {featured && (
                <span className={styles.featuredBadge}>
                  <FeaturedBadgeIcon size={12} />
                  Featured
                </span>
              )}
            </div>
            
            <h1 className={styles.title}>{name}</h1>
            
            {/* Action Buttons */}
            <div className={styles.headerActions}>
              <button 
                className={`${styles.saveButton} ${isSaved ? styles.saved : ''}`}
                onClick={handleSaveToggle}
                disabled={isSaving}
                title={
                  !isAuthenticated
                    ? 'Sign in to save events'
                    : !canSaveEvents
                      ? 'Upgrade to Collector to save events'
                      : isSaved
                        ? 'Unsave event'
                        : 'Save event'
                }
              >
                {isSaving ? (
                  <span className={styles.saveSpinner} />
                ) : (
                  <Icons.heart size={18} />
                )}
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button 
                className={styles.shareButton}
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: name, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied!');
                  }
                }}
              >
                <Icons.share size={18} />
                Share
              </button>
            </div>
            
            {/* Upgrade Prompt */}
            {showUpgradePrompt && shouldShowUpgradePrompt && (
              <div className={styles.upgradePromptOverlay} onClick={() => setShowUpgradePrompt(false)}>
                <div className={styles.upgradePrompt} onClick={e => e.stopPropagation()}>
                  <TeaserPrompt
                    message={`Save events requires ${upgradeCTA?.tierName || 'Collector'}`}
                    targetTier={upgradeCTA?.tier || 'collector'}
                    variant="compact"
                  />
                  <button 
                    className={styles.closePrompt}
                    onClick={() => setShowUpgradePrompt(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </header>

          {/* Date & Time */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Icons.calendar size={20} />
              Date & Time
            </h2>
            <div className={styles.dateTime}>
              <div className={styles.dateBlock}>
                {isMultiDay ? (
                  <>
                    <span className={styles.dateLabel}>From</span>
                    <span className={styles.dateValue}>{formattedStartDate}</span>
                    <span className={styles.dateLabel}>To</span>
                    <span className={styles.dateValue}>{formattedEndDate}</span>
                  </>
                ) : (
                  <span className={styles.dateValue}>{formattedStartDate}</span>
                )}
              </div>
              {(formattedStartTime || formattedEndTime) && (
                <div className={styles.timeBlock}>
                  <Icons.clock size={16} />
                  {formattedStartTime && <span>{formattedStartTime}</span>}
                  {formattedStartTime && formattedEndTime && <span> – </span>}
                  {formattedEndTime && <span>{formattedEndTime}</span>}
                  {timezone && (
                    <span className={styles.timezone}>({timezone.split('/').pop().replace('_', ' ')})</span>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Location */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Icons.mapPin size={20} />
              Location
            </h2>
            <div className={styles.location}>
              {venue_name && <div className={styles.venueName}>{venue_name}</div>}
              <div className={styles.address}>
                {address && <div>{address}</div>}
                <div>
                  {city}{state ? `, ${state}` : ''} {zip}
                </div>
                {country && country !== 'USA' && <div>{country}</div>}
              </div>
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
          </section>

          {/* Description */}
          {description && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>About This Event</h2>
              <p className={styles.description}>{description}</p>
            </section>
          )}

          {/* Cost */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Icons.dollar size={20} />
              Cost
            </h2>
            <div className={`${styles.costBadge} ${is_free ? styles.costFree : ''}`}>
              {is_free ? 'Free Event' : cost_text || 'See event page for pricing'}
            </div>
          </section>

          {/* Car Affinities */}
          {(brandAffinities.length > 0 || carAffinities.length > 0) && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Icons.car size={20} />
                Featured Cars & Brands
              </h2>
              <p className={styles.affinityIntro}>
                This event features:{' '}
                {[...carAffinities.map(a => a.car_name || a.car_slug), ...brandAffinities.map(a => a.brand)]
                  .slice(0, 5)
                  .join(', ')}
                {car_affinities.length > 5 && ' and more'}
              </p>
              <div className={styles.affinities}>
                {brandAffinities.map((aff, i) => (
                  <Link 
                    key={`brand-${i}`} 
                    href={`/browse-cars?brand=${encodeURIComponent(aff.brand)}`}
                    className={`${styles.affinityBadge} ${styles.affinityLink}`}
                  >
                    {aff.brand}
                    {aff.affinity_type === 'exclusive' && (
                      <span className={styles.affinityType}> Only</span>
                    )}
                  </Link>
                ))}
                {carAffinities.map((aff, i) => (
                  <Link 
                    key={`car-${i}`} 
                    href={`/browse-cars/${aff.car_slug}`}
                    className={`${styles.affinityBadge} ${styles.affinityLink}`}
                  >
                    {aff.car_name || aff.car_slug}
                  </Link>
                ))}
              </div>
              {brandAffinities.length > 0 && (
                <Link 
                  href={`/events?brand=${encodeURIComponent(brandAffinities[0].brand)}`}
                  className={styles.findMoreLink}
                >
                  Find more {brandAffinities[0].brand} events →
                </Link>
              )}
            </section>
          )}

          {/* Source Attribution */}
          <section className={styles.section}>
            <div className={styles.source}>
              Event information from{' '}
              <a href={source_url} target="_blank" rel="noopener noreferrer">
                {source_name || 'external source'}
              </a>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {/* CTA Card */}
          <div className={styles.ctaCard}>
            <h3>Interested in this event?</h3>
            <a
              href={registration_url || source_url}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaButton}
            >
              <Icons.externalLink size={18} />
              {registration_url ? 'Register / Learn More' : 'View Full Event Details'}
            </a>
            <p className={styles.ctaNote}>
              Opens in a new tab
            </p>
          </div>

          {/* Quick Info */}
          <div className={styles.quickInfo}>
            <h4>Quick Info</h4>
            <dl>
              <dt>Event Type</dt>
              <dd>{event_type?.name || 'General'}</dd>
              
              <dt>Scope</dt>
              <dd style={{ textTransform: 'capitalize' }}>{scope}</dd>
              
              {region && (
                <>
                  <dt>Region</dt>
                  <dd>{region}</dd>
                </>
              )}
            </dl>
          </div>
        </aside>
      </div>

      {/* Related Events */}
      {relatedEvents.length > 0 && (
        <section className={styles.relatedSection}>
          <div className={styles.relatedContainer}>
            <h2 className={styles.relatedTitle}>Similar Events</h2>
            <div className={styles.relatedGrid}>
              {relatedEvents.map(e => (
                <EventCard 
                  key={e.id} 
                  event={e} 
                  isSaved={savedEventSlugs.has(e.slug)}
                  onSaveToggle={handleRelatedSaveToggle}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

