'use client';

import Link from 'next/link';
import styles from './EventCard.module.css';
import SaveEventButton from './SaveEventButton';

// Skeleton component for loading state
export function EventCardSkeleton() {
  return (
    <div className={styles.cardWrapper}>
      <div className={`${styles.card} ${styles.skeleton}`}>
        <div className={styles.skeletonHeader} />
        <div className={styles.content}>
          <div className={styles.skeletonTitle} />
          <div className={styles.skeletonText} />
          <div className={styles.skeletonText} style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}

// Event type icons - matches EventCategoryPill icons
const EVENT_TYPE_ICONS = {
  'cars-and-coffee': ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>
  ),
  'track-day': ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  ),
  'autocross': ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
      <polyline points="2 17 12 22 22 17"/>
      <polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  'car-show': ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
    </svg>
  ),
  'club-meetup': ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  'cruise': ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  'auction': ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m14 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9"/>
      <path d="M15 13 9 7l4-4 6 6h3a8 8 0 0 1-7 7z"/>
    </svg>
  ),
  'industry': ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18"/>
      <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/>
      <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/>
      <path d="M9 7h.01"/>
      <path d="M15 7h.01"/>
      <path d="M9 11h.01"/>
      <path d="M15 11h.01"/>
    </svg>
  ),
  'time-attack': ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  'professional-race': ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
      <path d="M12 6v3"/>
    </svg>
  ),
  'club-racing': ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
      <circle cx="17" cy="17" r="3"/>
    </svg>
  ),
  'default': ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

// Other icons
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
  dollar: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  check: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  repeat: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m17 2 4 4-4 4"/>
      <path d="M3 11v-1a4 4 0 0 1 4-4h14"/>
      <path d="m7 22-4-4 4-4"/>
      <path d="M21 13v1a4 4 0 0 1-4 4H3"/>
    </svg>
  ),
};

function formatEventTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

// Format recurrence frequency for display
function formatRecurrence(frequency, occurrences) {
  const freqLabels = {
    weekly: 'Weekly',
    biweekly: 'Biweekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annual: 'Annual',
    irregular: 'Recurring',
  };
  const label = freqLabels[frequency] || 'Recurring';
  if (occurrences > 1) {
    return `${label} · ${occurrences} upcoming`;
  }
  return label;
}

export default function EventCard({ 
  event, 
  featured, 
  isSaved, 
  onSaveToggle,
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
    event_type,
    cost_text,
    is_free,
    car_affinities,
    // Recurring event info
    is_recurring,
    upcoming_occurrences,
    series,
  } = event;

  const timeDisplay = formatEventTime(start_time);
  const location = venue_name || `${city}, ${state}`;
  const cost = is_free ? 'Free' : cost_text || '';
  
  // Parse date for display
  const eventDate = new Date(start_date + 'T00:00:00');
  const dateMonth = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const dateDay = eventDate.getDate();
  const dateWeekday = eventDate.toLocaleDateString('en-US', { weekday: 'short' });

  // Get first brand affinity if any
  const brandAffinity = car_affinities?.find(a => a.brand);
  
  // Get event type icon
  const eventTypeSlug = event_type?.slug || 'default';
  const EventTypeIcon = EVENT_TYPE_ICONS[eventTypeSlug] || EVENT_TYPE_ICONS['default'];

  return (
    <div className={`${styles.cardWrapper} ${featured ? styles.featuredWrapper : ''} ${compact ? styles.compactWrapper : ''}`}>
      <Link href={`/community/events/${slug}`} className={styles.card}>
        {/* Type Header - Color-coded by event type */}
        <div className={`${styles.typeHeader} ${styles[`type-${eventTypeSlug}`]}`}>
          <div className={styles.typeInfo}>
            <span className={styles.typeIcon}>
              <EventTypeIcon size={16} />
            </span>
            <span className={styles.typeName}>{event_type?.name || 'Event'}</span>
          </div>
          <div className={styles.headerBadges}>
            {is_recurring && series && (
              <span className={styles.recurringBadge} title={`${formatRecurrence(series.recurrence_frequency, upcoming_occurrences)}`}>
                <Icons.repeat size={12} />
                {series.recurrence_frequency === 'weekly' ? 'Weekly' : 
                 series.recurrence_frequency === 'biweekly' ? 'Biweekly' : 
                 series.recurrence_frequency === 'monthly' ? 'Monthly' : 'Recurring'}
              </span>
            )}
            {featured && <span className={styles.featuredBadge}>Featured</span>}
          </div>
        </div>

        <div className={styles.content}>
          {/* Date + Title Row */}
          <div className={styles.mainRow}>
            <div className={styles.dateBox}>
              <span className={styles.dateMonth}>{dateMonth}</span>
              <span className={styles.dateDay}>{dateDay}</span>
              <span className={styles.dateWeekday}>{dateWeekday}</span>
            </div>
            
            <div className={styles.eventInfo}>
              <h3 className={styles.title}>{name}</h3>
              
              <div className={styles.details}>
                <div className={styles.detailRow}>
                  <Icons.mapPin size={12} />
                  <span className={styles.detailText}>{location}</span>
                </div>
                
                {timeDisplay && (
                  <div className={styles.detailRow}>
                    <Icons.clock size={12} />
                    <span className={styles.detailText}>{timeDisplay}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <div className={styles.footerInfo}>
              {cost && (
                <span className={`${styles.cost} ${is_free ? styles.free : ''}`}>
                  {is_free && <Icons.check size={12} />}
                  {is_free ? 'Free' : cost}
                </span>
              )}
              {brandAffinity && (
                <span className={styles.brandBadge}>{brandAffinity.brand}</span>
              )}
            </div>
            <div className={styles.footerActions}>
              <span className={styles.viewLink}>
                View Details
                <Icons.chevronRight size={14} />
              </span>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Save Button - positioned in footer area outside the Link */}
      {showSaveButton && (
        <div className={styles.saveButtonWrapper}>
          <SaveEventButton
            eventId={id}
            eventSlug={slug}
            eventName={name}
            isSaved={isSaved}
            onSaveChange={onSaveToggle}
            size="small"
          />
        </div>
      )}
    </div>
  );
}
