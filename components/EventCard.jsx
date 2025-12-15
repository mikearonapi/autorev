'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from './EventCard.module.css';
import SaveEventButton from './SaveEventButton';

// Skeleton component for loading state
export function EventCardSkeleton() {
  return (
    <div className={styles.cardWrapper}>
      <div className={`${styles.card} ${styles.skeleton}`}>
        <div className={styles.imageContainer}>
          <div className={styles.skeletonImage} />
        </div>
        <div className={styles.content}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonText} />
          <div className={styles.skeletonText} style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}

// Icons
const Icons = {
  mapPin: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  clock: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  chevronRight: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  calendar: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

function formatEventDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00'); // Prevent timezone shifts
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatEventTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export default function EventCard({ 
  event, 
  featured, 
  isSaved, 
  onSaveToggle,
  savingInProgress,
  showSaveButton = true,
  compact = false
}) {
  const {
    id,
    slug,
    name,
    start_date,
    start_time,
    venue_name,
    city,
    state,
    image_url,
    event_type,
    cost_text,
    is_free,
    car_affinities
  } = event;

  const dateDisplay = formatEventDate(start_date);
  const timeDisplay = formatEventTime(start_time);
  const location = venue_name || `${city}, ${state}`;
  const cost = is_free ? 'Free' : cost_text || '';

  // Get first brand affinity if any
  const brandAffinity = car_affinities?.find(a => a.brand);

  return (
    <div className={`${styles.cardWrapper} ${featured ? styles.featuredWrapper : ''} ${compact ? styles.compactWrapper : ''}`}>
      {/* Save Button */}
      {showSaveButton && (
        <div className={styles.cardActions}>
          <SaveEventButton
            eventId={id}
            eventSlug={slug}
            eventName={name}
            isSaved={isSaved}
            onSaveChange={onSaveToggle}
            loading={savingInProgress}
          />
        </div>
      )}

      <Link href={`/community/events/${slug}`} className={styles.card}>
        <div className={styles.imageContainer}>
          {image_url ? (
            <Image
              src={image_url}
              alt={name}
              fill
              className={styles.image}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className={`${styles.placeholderImage} ${styles[`type-${event_type?.slug || 'default'}`]}`}>
              <span className={styles.placeholderIcon}>
                {/* Event type icon fallback */}
                <Icons.calendar size={32} />
              </span>
            </div>
          )}
          
          <div className={styles.imageOverlay} />
          
          <div className={styles.badges}>
            {event_type && (
              <span className={styles.typeBadge}>
                {event_type.name}
              </span>
            )}
            {featured && (
              <span className={styles.featuredBadge}>Featured</span>
            )}
          </div>

          <div className={styles.dateBox}>
            <span className={styles.dateMonth}>
              {new Date(start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
            </span>
            <span className={styles.dateDay}>
              {new Date(start_date + 'T00:00:00').getDate()}
            </span>
          </div>
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{name}</h3>
          
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <Icons.mapPin />
              <span className={styles.detailText}>{location}</span>
            </div>
            
            {timeDisplay && (
              <div className={styles.detailRow}>
                <Icons.clock />
                <span className={styles.detailText}>{timeDisplay}</span>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <div className={styles.footerInfo}>
              {cost && <span className={`${styles.cost} ${is_free ? styles.free : ''}`}>{cost}</span>}
              {brandAffinity && (
                <span className={styles.brandBadge}>{brandAffinity.brand}</span>
              )}
            </div>
            <span className={styles.viewLink}>
              View Details
              <Icons.chevronRight />
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
