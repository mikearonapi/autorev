'use client';

/**
 * EventAttendeesPreview Component
 * 
 * Shows a preview of who's attending an event - avatars, names, and counts.
 * Helps users see who they might meet at the event, fostering community connections.
 */

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './EventAttendeesPreview.module.css';
import { useEventAttendees } from '@/hooks/useEventsData';
import { useAuth } from './providers/AuthProvider';

// Icons
const UsersIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CheckIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const StarIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

/**
 * Default avatar with initials
 */
function DefaultAvatar({ name, size = 32 }) {
  const initials = (name || 'A')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  
  // Generate consistent color from name
  const hash = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue = hash % 360;
  
  return (
    <div 
      className={styles.defaultAvatar}
      style={{ 
        width: size, 
        height: size,
        background: `hsl(${hue}, 65%, 50%)`,
      }}
    >
      {initials}
    </div>
  );
}

/**
 * Single attendee avatar
 */
function AttendeeAvatar({ attendee, size = 32, showStatus = false }) {
  return (
    <div className={styles.avatarWrapper} title={attendee.displayName}>
      {attendee.avatarUrl ? (
        <Image 
          src={attendee.avatarUrl} 
          alt={attendee.displayName}
          width={size}
          height={size}
          className={styles.avatar}
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <DefaultAvatar name={attendee.displayName} size={size} />
      )}
      {showStatus && (
        <span className={`${styles.statusBadge} ${styles[attendee.status]}`}>
          {attendee.status === 'going' ? <CheckIcon size={8} /> : <StarIcon size={8} />}
        </span>
      )}
    </div>
  );
}

/**
 * Stacked avatar row
 */
function AvatarStack({ attendees, maxVisible = 5, size = 32 }) {
  const visible = attendees.slice(0, maxVisible);
  const overflow = attendees.length - maxVisible;
  
  return (
    <div className={styles.avatarStack}>
      {visible.map((attendee, i) => (
        <div 
          key={attendee.userId} 
          className={styles.stackedAvatar}
          style={{ zIndex: maxVisible - i }}
        >
          <AttendeeAvatar attendee={attendee} size={size} />
        </div>
      ))}
      {overflow > 0 && (
        <div 
          className={styles.overflowBadge}
          style={{ width: size, height: size }}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

/**
 * EventAttendeesPreview component
 * 
 * @param {Object} props
 * @param {string} props.eventSlug - Event slug
 * @param {string} [props.variant] - 'compact' | 'default' | 'expanded'
 * @param {number} [props.maxAvatars] - Max avatars to show (default 5)
 * @param {boolean} [props.showLink] - Show "See all" link (default true)
 * @param {Function} [props.onViewAll] - Callback when "See all" is clicked
 */
export default function EventAttendeesPreview({
  eventSlug,
  variant = 'default',
  maxAvatars = 5,
  showLink = true,
  onViewAll,
}) {
  const { isAuthenticated } = useAuth();
  
  const { data, isLoading, error } = useEventAttendees(eventSlug, { limit: 20 });
  
  if (isLoading) {
    return (
      <div className={`${styles.container} ${styles[variant]}`}>
        <div className={styles.loading}>
          <div className={styles.skeleton} />
          <div className={styles.skeletonText} />
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    return null;
  }
  
  const { counts, attendees, viewerIsAttending } = data;
  
  // No attendees yet
  if (counts.total === 0) {
    return (
      <div className={`${styles.container} ${styles[variant]} ${styles.empty}`}>
        <UsersIcon size={18} />
        <span className={styles.emptyText}>Be the first to RSVP!</span>
      </div>
    );
  }
  
  // Filter to "going" attendees for the preview
  const goingAttendees = attendees.filter(a => a.status === 'going');
  const interestedAttendees = attendees.filter(a => a.status === 'interested');
  
  return (
    <div className={`${styles.container} ${styles[variant]}`}>
      {/* Avatar Stack */}
      <div className={styles.avatarsSection}>
        {goingAttendees.length > 0 && (
          <AvatarStack 
            attendees={goingAttendees} 
            maxVisible={maxAvatars} 
            size={variant === 'compact' ? 28 : 32}
          />
        )}
      </div>
      
      {/* Counts & Text */}
      <div className={styles.info}>
        <div className={styles.counts}>
          {counts.going > 0 && (
            <span className={styles.countItem}>
              <CheckIcon size={12} />
              <strong>{counts.going}</strong> going
            </span>
          )}
          {counts.interested > 0 && (
            <span className={styles.countItem}>
              <StarIcon size={12} />
              <strong>{counts.interested}</strong> interested
            </span>
          )}
        </div>
        
        {/* Names preview (expanded variant) */}
        {variant === 'expanded' && goingAttendees.length > 0 && (
          <div className={styles.names}>
            {goingAttendees.slice(0, 3).map((a, i) => (
              <span key={a.userId}>
                {a.displayName}
                {i < Math.min(goingAttendees.length - 1, 2) && ', '}
              </span>
            ))}
            {goingAttendees.length > 3 && (
              <span className={styles.moreNames}> and {goingAttendees.length - 3} more</span>
            )}
          </div>
        )}
        
        {/* "You're going" indicator */}
        {viewerIsAttending && (
          <span className={styles.youIndicator}>
            <CheckIcon size={10} />
            You're going
          </span>
        )}
      </div>
      
      {/* See All Link */}
      {showLink && counts.total > maxAvatars && (
        <button 
          className={styles.seeAllBtn}
          onClick={onViewAll}
          type="button"
        >
          See all
        </button>
      )}
    </div>
  );
}

/**
 * Compact variant - for event cards
 */
export function EventAttendeesCompact({ eventSlug, counts }) {
  // If counts are passed directly, use them (avoids API call)
  if (counts && (counts.going > 0 || counts.interested > 0)) {
    return (
      <div className={`${styles.container} ${styles.compact} ${styles.inline}`}>
        <UsersIcon size={14} />
        <span className={styles.countInline}>
          {counts.going > 0 && <>{counts.going} going</>}
          {counts.going > 0 && counts.interested > 0 && ' · '}
          {counts.interested > 0 && <>{counts.interested} interested</>}
        </span>
      </div>
    );
  }
  
  return <EventAttendeesPreview eventSlug={eventSlug} variant="compact" maxAvatars={3} showLink={false} />;
}

/**
 * Full attendee list modal/sheet component
 */
export function EventAttendeesList({ eventSlug, onClose }) {
  const [filter, setFilter] = useState(null); // null = all, 'going', 'interested'
  
  const { data, isLoading } = useEventAttendees(eventSlug, { 
    status: filter,
    limit: 50,
  });
  
  return (
    <div className={styles.listContainer}>
      <div className={styles.listHeader}>
        <h3 className={styles.listTitle}>Attendees</h3>
        {data && (
          <span className={styles.listCount}>{data.counts.total} people</span>
        )}
      </div>
      
      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        <button
          className={`${styles.filterTab} ${!filter ? styles.filterTabActive : ''}`}
          onClick={() => setFilter(null)}
          type="button"
        >
          All
        </button>
        <button
          className={`${styles.filterTab} ${filter === 'going' ? styles.filterTabActive : ''}`}
          onClick={() => setFilter('going')}
          type="button"
        >
          <CheckIcon size={12} />
          Going ({data?.counts.going || 0})
        </button>
        <button
          className={`${styles.filterTab} ${filter === 'interested' ? styles.filterTabActive : ''}`}
          onClick={() => setFilter('interested')}
          type="button"
        >
          <StarIcon size={12} />
          Interested ({data?.counts.interested || 0})
        </button>
      </div>
      
      {/* Attendee List */}
      {isLoading ? (
        <div className={styles.listLoading}>Loading...</div>
      ) : (
        <div className={styles.attendeeList}>
          {data?.attendees.map(attendee => (
            <div key={attendee.userId} className={styles.attendeeRow}>
              <AttendeeAvatar attendee={attendee} size={40} showStatus />
              <div className={styles.attendeeInfo}>
                <span className={styles.attendeeName}>
                  {attendee.displayName}
                  {attendee.isCurrentUser && <span className={styles.youBadge}>You</span>}
                </span>
                {attendee.notes && (
                  <span className={styles.attendeeNotes}>{attendee.notes}</span>
                )}
              </div>
            </div>
          ))}
          
          {data?.attendees.length === 0 && (
            <div className={styles.noAttendees}>
              No one has RSVP'd yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
