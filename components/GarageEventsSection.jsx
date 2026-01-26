'use client';

import { useState, useEffect, useMemo } from 'react';

import Link from 'next/link';

import { EventTypeIcon, TrackEventBadgeIcon, CategoryIcons } from '@/components/icons/EventIcons';
import PremiumGate from '@/components/PremiumGate';
import { useEvents } from '@/hooks/useEventsData';
import { getMonthAbbrev, getDayOfMonth, formatEventDateShort } from '@/lib/dateUtils';

import styles from './GarageEventsSection.module.css';

/**
 * GarageEventsSection - Shows upcoming events for user's owned vehicles or favorites
 * 
 * For Enthusiast+ tier users:
 * - If user has owned vehicles: Shows events matching their car brands/models
 * - If user has no vehicles but has favorites: Shows events matching favorite car brands
 */

// Compact event card for sidebar/inline display
function CompactEventCard({ event }) {
  if (!event) return null;
  
  const formattedDate = formatEventDateShort(event.start_date);
  
  return (
    <Link href={`/events/${event.slug}`} className={styles.compactCard}>
      <div className={styles.dateBadge}>
        <span className={styles.dateDay}>{getDayOfMonth(event.start_date)}</span>
        <span className={styles.dateMonth}>{getMonthAbbrev(event.start_date)}</span>
      </div>
      <div className={styles.eventInfo}>
        <span className={styles.eventType}>
          <EventTypeIcon slug={event.event_type?.slug} size={14} /> {event.event_type?.name || 'Event'}
        </span>
        <h4 className={styles.eventName}>{event.name}</h4>
        <span className={styles.eventLocation}>
          {event.city}{event.state ? `, ${event.state}` : ''}
        </span>
      </div>
      <div className={styles.eventMeta}>
        <span className={`${styles.cost} ${event.is_free ? styles.costFree : ''}`}>
          {event.is_free ? 'Free' : event.cost_text || 'See details'}
        </span>
      </div>
    </Link>
  );
}

function LoadingState() {
  return (
    <div className={styles.loading}>
      <div className={styles.loadingCard} />
      <div className={styles.loadingCard} />
      <div className={styles.loadingCard} />
    </div>
  );
}

function EmptyState({ hasVehicles }) {
  const CalendarIcon = CategoryIcons['other'];
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>
        <CalendarIcon size={24} />
      </span>
      <p className={styles.emptyText}>
        {hasVehicles 
          ? 'No upcoming events found for your vehicles.'
          : 'Add vehicles to your garage to see relevant events.'}
      </p>
      <Link href="/events" className={styles.browseLink}>
        Browse all events →
      </Link>
    </div>
  );
}

export default function GarageEventsSection({ vehicles = [], favorites = [] }) {
  // Get unique brands from vehicles and favorites
  const brands = useMemo(() => [...new Set([
    ...vehicles.map(v => v.vehicle?.make || v.make).filter(Boolean),
    ...favorites.map(f => f.brand).filter(Boolean),
  ])], [vehicles, favorites]);
  
  // Get car slugs from owned vehicles
  const carSlugs = useMemo(() => vehicles
    .map(v => v.vehicle?.matchedCarSlug || v.matchedCarSlug)
    .filter(Boolean), [vehicles]);
  
  const hasVehicles = vehicles.length > 0;
  const hasFavorites = favorites.length > 0;
  
  // Build filter params for the query
  const filters = useMemo(() => {
    const f = { limit: 5, sort: 'date' };
    if (carSlugs.length > 0) {
      f.carSlug = carSlugs[0];
    } else if (brands.length > 0) {
      f.brand = brands[0];
    }
    return f;
  }, [carSlugs, brands]);
  
  // React Query hook for events
  const { 
    data: eventsData, 
    isLoading: loading, 
    error: queryError,
  } = useEvents(filters, {
    enabled: brands.length > 0 || carSlugs.length > 0,
  });
  
  const events = eventsData?.events || [];
  const error = queryError?.message || null;
  
  // If no vehicles and no favorites, show a minimal prompt
  if (!hasVehicles && !hasFavorites) {
    return null;
  }
  
  // Build the "see all" link based on what we have
  const seeAllLink = carSlugs.length > 0
    ? `/events?car=${carSlugs[0]}`
    : brands.length > 0
      ? `/events?brand=${brands[0]}`
      : '/events';
  
  const seeAllText = hasVehicles
    ? 'See all events for your cars →'
    : 'Browse all events →';
  
  return (
    <PremiumGate feature="garageEvents" variant="compact">
      <section className={styles.section}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.icon}>
              <TrackEventBadgeIcon size={18} />
            </span>
            <h3 className={styles.title}>Upcoming Events</h3>
          </div>
          <Link href={seeAllLink} className={styles.seeAllLink}>
            {seeAllText}
          </Link>
        </div>
        
        {loading ? (
          <LoadingState />
        ) : error ? (
          <div className={styles.error}>
            <p>Unable to load events. <button onClick={() => { if (typeof window !== 'undefined') window.location.reload(); }}>Try again</button></p>
          </div>
        ) : events.length === 0 ? (
          <EmptyState hasVehicles={hasVehicles} />
        ) : (
          <div className={styles.eventsList}>
            {events.map(event => (
              <CompactEventCard key={event.slug} event={event} />
            ))}
          </div>
        )}
      </section>
    </PremiumGate>
  );
}

