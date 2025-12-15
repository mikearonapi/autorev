'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './CarEventsSection.module.css';

/**
 * CarEventsSection - Shows upcoming events for a specific car on its detail page
 * 
 * Queries events where:
 * - car_slug matches the current car OR
 * - brand matches the current car's brand
 * 
 * Displayed in the sidebar or after main content on car detail pages.
 */

function CompactEventCard({ event }) {
  if (!event) return null;
  
  const date = new Date(event.start_date + 'T00:00:00');
  
  return (
    <Link href={`/events/${event.slug}`} className={styles.card}>
      <div className={styles.dateBadge}>
        <span className={styles.dateDay}>{date.getDate()}</span>
        <span className={styles.dateMonth}>
          {date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
        </span>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.eventType}>
          <span>{event.event_type?.icon || '📅'}</span>
          <span>{event.event_type?.name || 'Event'}</span>
        </div>
        <h4 className={styles.eventName}>{event.name}</h4>
        <div className={styles.eventMeta}>
          <span className={styles.location}>
            {event.city}{event.state ? `, ${event.state}` : ''}
          </span>
          <span className={`${styles.cost} ${event.is_free ? styles.costFree : ''}`}>
            {event.is_free ? 'Free' : event.cost_text || 'See details'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function LoadingState() {
  return (
    <div className={styles.loading}>
      {[1, 2, 3].map(i => (
        <div key={i} className={styles.loadingCard} />
      ))}
    </div>
  );
}

function EmptyState({ brand }) {
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>📅</span>
      <p>No upcoming events found{brand ? ` for ${brand}` : ''}.</p>
      <Link href="/events" className={styles.browseLink}>
        Browse all events →
      </Link>
    </div>
  );
}

export default function CarEventsSection({ carSlug, carName, brand }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchEvents = async () => {
      if (!carSlug && !brand) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Build query - prefer car_slug, fall back to brand
        const params = new URLSearchParams();
        
        if (carSlug) {
          params.set('car_slug', carSlug);
        } else if (brand) {
          params.set('brand', brand);
        }
        
        params.set('limit', '3');
        params.set('sort', 'date');
        
        const response = await fetch(`/api/events?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error('[CarEventsSection] Error fetching events:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [carSlug, brand]);
  
  // Build link for "find more events"
  const findMoreLink = brand 
    ? `/events?brand=${encodeURIComponent(brand)}`
    : '/events';
  
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className={styles.icon}>🏁</span>
          Upcoming Events
        </h3>
      </div>
      
      {loading ? (
        <LoadingState />
      ) : error ? (
        <div className={styles.error}>
          Unable to load events.
        </div>
      ) : events.length === 0 ? (
        <EmptyState brand={brand} />
      ) : (
        <>
          <div className={styles.eventsList}>
            {events.map(event => (
              <CompactEventCard key={event.slug} event={event} />
            ))}
          </div>
          
          {brand && (
            <Link href={findMoreLink} className={styles.findMoreLink}>
              Find more {brand} events →
            </Link>
          )}
        </>
      )}
    </section>
  );
}

