'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './GarageEventsSection.module.css';
import PremiumGate from '@/components/PremiumGate';

/**
 * GarageEventsSection - Shows upcoming events for user's owned vehicles or favorites
 * 
 * For Collector+ tier users:
 * - If user has owned vehicles: Shows events matching their car brands/models
 * - If user has no vehicles but has favorites: Shows events matching favorite car brands
 */

// Compact event card for sidebar/inline display
function CompactEventCard({ event }) {
  if (!event) return null;
  
  const date = new Date(event.start_date + 'T00:00:00');
  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  
  return (
    <Link href={`/events/${event.slug}`} className={styles.compactCard}>
      <div className={styles.dateBadge}>
        <span className={styles.dateDay}>{date.getDate()}</span>
        <span className={styles.dateMonth}>
          {date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
        </span>
      </div>
      <div className={styles.eventInfo}>
        <span className={styles.eventType}>
          {event.event_type?.icon || '📅'} {event.event_type?.name || 'Event'}
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
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>📅</span>
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
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get unique brands from vehicles and favorites
  const brands = [...new Set([
    ...vehicles.map(v => v.vehicle?.make || v.make).filter(Boolean),
    ...favorites.map(f => f.brand).filter(Boolean),
  ])];
  
  // Get car slugs from owned vehicles
  const carSlugs = vehicles
    .map(v => v.vehicle?.matchedCarSlug || v.matchedCarSlug)
    .filter(Boolean);
  
  const hasVehicles = vehicles.length > 0;
  const hasFavorites = favorites.length > 0;
  
  useEffect(() => {
    const fetchEvents = async () => {
      // Don't fetch if no vehicles or favorites
      if (brands.length === 0 && carSlugs.length === 0) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Build query with brands (we'll search by brand since it matches more events)
        const params = new URLSearchParams();
        
        // Prioritize car slugs if we have them
        if (carSlugs.length > 0) {
          // Use the first car slug (API supports one at a time)
          params.set('car_slug', carSlugs[0]);
        } else if (brands.length > 0) {
          // Fall back to first brand
          params.set('brand', brands[0]);
        }
        
        params.set('limit', '5');
        params.set('sort', 'date');
        
        const response = await fetch(`/api/events?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error('[GarageEventsSection] Error fetching events:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [brands.join(','), carSlugs.join(',')]);
  
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
            <span className={styles.icon}>🏁</span>
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

