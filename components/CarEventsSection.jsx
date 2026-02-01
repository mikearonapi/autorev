'use client';

import { useMemo } from 'react';

import Link from 'next/link';

import { EventTypeIcon, TrackEventBadgeIcon, CategoryIcons } from '@/components/icons/EventIcons';
import { useEvents } from '@/hooks/useEventsData';
import { getMonthAbbrev, getDayOfMonth } from '@/lib/dateUtils';

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

  return (
    <Link href={`/events/${event.slug}`} className={styles.card}>
      <div className={styles.dateBadge}>
        <span className={styles.dateDay}>{getDayOfMonth(event.start_date)}</span>
        <span className={styles.dateMonth}>{getMonthAbbrev(event.start_date)}</span>
      </div>
      <div className={styles.cardContent}>
        <div className={styles.eventType}>
          <EventTypeIcon slug={event.event_type?.slug} size={14} />
          <span>{event.event_type?.name || 'Event'}</span>
        </div>
        <h4 className={styles.eventName}>{event.name}</h4>
        <div className={styles.eventMeta}>
          <span className={styles.location}>
            {event.city}
            {event.state ? `, ${event.state}` : ''}
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
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles.loadingCard} />
      ))}
    </div>
  );
}

function EmptyState({ brand }) {
  const CalendarIcon = CategoryIcons['other'];
  return (
    <div className={styles.empty}>
      <span className={styles.emptyIcon}>
        <CalendarIcon size={24} />
      </span>
      <p>No upcoming events found{brand ? ` for ${brand}` : ''}.</p>
      <Link href="/events" className={styles.browseLink}>
        Browse all events →
      </Link>
    </div>
  );
}

export default function CarEventsSection({ carId: _carId, car, carName: _carName, brand }) {
  // Build filter params for the query
  const filters = useMemo(() => {
    const f = { limit: 3, sort: 'date' };
    if (car?.slug) {
      f.carSlug = car.slug;
    } else if (brand) {
      f.brand = brand;
    }
    return f;
  }, [car, brand]);

  // React Query hook for events
  const {
    data: eventsData,
    isLoading: loading,
    error: queryError,
  } = useEvents(filters, {
    enabled: !!(car?.slug || brand),
  });

  const events = eventsData?.events || [];
  const error = queryError?.message || null;

  // Build link for "find more events"
  const findMoreLink = brand ? `/events?brand=${encodeURIComponent(brand)}` : '/events';

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span className={styles.icon}>
            <TrackEventBadgeIcon size={18} />
          </span>
          Upcoming Events
        </h3>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <div className={styles.error}>Unable to load events.</div>
      ) : events.length === 0 ? (
        <EmptyState brand={brand} />
      ) : (
        <>
          <div className={styles.eventsList}>
            {events.map((event) => (
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
