'use client';

import { useState, useMemo, useCallback } from 'react';

import Link from 'next/link';

import { EventTypeIcon, TrackEventBadgeIcon } from '@/components/icons/EventIcons';
import { Icons } from '@/components/ui/Icons';
import { formatEventDateFull } from '@/lib/dateUtils';

import styles from './EventCalendarView.module.css';
import PremiumGate from './PremiumGate';

/**
 * Get days in a month
 */
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the first day of the month (0 = Sunday, 6 = Saturday)
 */
function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}


/**
 * Month names
 */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Day names
 */
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * EventCalendarView component
 * 
 * A monthly calendar grid showing events on their dates.
 * Tier-gated: Enthusiast+ only.
 * 
 * @param {Object} props
 * @param {Array} props.events - Array of event objects
 * @param {number} [props.initialYear] - Initial year to display
 * @param {number} [props.initialMonth] - Initial month (0-11) to display
 * @param {Function} [props.onDateSelect] - Callback when date is clicked
 * @param {Function} [props.onEventClick] - Callback when event is clicked
 */
export default function EventCalendarView({
  events = [],
  initialYear,
  initialMonth,
  onDateSelect,
  onEventClick,
}) {
  // Initialize with current date or provided values
  // Memoize today to prevent recalculation on every render
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(initialYear || today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialMonth ?? today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped = {};
    events.forEach(event => {
      if (!event.start_date) return;
      const dateKey = event.start_date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [events]);

  // Calculate calendar grid
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Previous month padding
    const prevMonthDays = getDaysInMonth(
      currentMonth === 0 ? currentYear - 1 : currentYear,
      currentMonth === 0 ? 11 : currentMonth - 1
    );
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isPast: true,
      });
    }

    // Current month days
    const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(currentYear, currentMonth, day);
      const dateEvents = eventsByDate[dateStr] || [];
      const isToday = dateStr === todayStr;
      const isPast = new Date(dateStr) < new Date(todayStr);

      days.push({
        day,
        dateStr,
        isCurrentMonth: true,
        isToday,
        isPast,
        events: dateEvents,
      });
    }

    // Next month padding (fill to complete the grid)
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        day,
        isCurrentMonth: false,
        isFuture: true,
      });
    }

    return days;
  }, [currentYear, currentMonth, eventsByDate, today]);

  // Navigation handlers
  const goToPrevMonth = useCallback(() => {
    if (currentMonth === 0) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  }, [currentMonth, currentYear]);

  const goToNextMonth = useCallback(() => {
    if (currentMonth === 11) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  }, [currentMonth, currentYear]);

  const goToToday = useCallback(() => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(null);
  }, [today]);

  // Handle date click
  const handleDateClick = useCallback((dayData) => {
    if (!dayData.isCurrentMonth) return;
    setSelectedDate(dayData.dateStr);
    onDateSelect?.(dayData.dateStr, dayData.events);
  }, [onDateSelect]);

  // Handle event click
  const handleEventClick = useCallback((e, event) => {
    e.stopPropagation();
    onEventClick?.(event);
  }, [onEventClick]);

  // Get events for selected date
  const selectedDateEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  return (
    <PremiumGate feature="eventsCalendarView">
      <div className={styles.calendar}>
        {/* Header */}
        <div className={styles.header}>
          <button
            className={styles.navButton}
            onClick={goToPrevMonth}
            aria-label="Previous month"
          >
            <Icons.chevronLeft size={20} />
          </button>

          <div className={styles.monthYear}>
            <span className={styles.month}>{MONTH_NAMES[currentMonth]}</span>
            <span className={styles.year}>{currentYear}</span>
          </div>

          <button
            className={styles.navButton}
            onClick={goToNextMonth}
            aria-label="Next month"
          >
            <Icons.chevronRight size={20} />
          </button>

          <button
            className={styles.todayButton}
            onClick={goToToday}
          >
            Today
          </button>
        </div>

        {/* Day names */}
        <div className={styles.dayNames}>
          {DAY_NAMES.map(day => (
            <div key={day} className={styles.dayName}>{day}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className={styles.grid}>
          {calendarDays.map((dayData, index) => (
            <div
              key={index}
              className={[
                styles.day,
                !dayData.isCurrentMonth && styles.otherMonth,
                dayData.isToday && styles.today,
                dayData.isPast && dayData.isCurrentMonth && styles.past,
                selectedDate === dayData.dateStr && styles.selected,
                dayData.events?.length > 0 && styles.hasEvents,
              ].filter(Boolean).join(' ')}
              onClick={() => handleDateClick(dayData)}
            >
              <span className={styles.dayNumber}>{dayData.day}</span>
              
              {/* Event dots */}
              {dayData.events?.length > 0 && (
                <div className={styles.eventDots}>
                  {dayData.events.slice(0, 3).map((event, i) => (
                    <span
                      key={event.id || i}
                      className={styles.eventDot}
                      style={{
                        background: event.event_type?.is_track_event
                          ? '#ef4444'
                          : '#6366f1'
                      }}
                      title={event.name}
                    />
                  ))}
                  {dayData.events.length > 3 && (
                    <span className={styles.moreEvents}>
                      +{dayData.events.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selected date events panel */}
        {selectedDate && (
          <div className={styles.eventPanel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>
                {formatEventDateFull(selectedDate).replace(/, \d{4}$/, '')}
              </h3>
              <button
                className={styles.panelClose}
                onClick={() => setSelectedDate(null)}
              >
                ×
              </button>
            </div>
            
            {selectedDateEvents.length > 0 ? (
              <div className={styles.eventList}>
                {selectedDateEvents.map(event => (
                  <Link
                    key={event.id}
                    href={`/community/events/${event.slug}`}
                    className={styles.eventItem}
                    onClick={(e) => handleEventClick(e, event)}
                  >
                    <span className={styles.eventIcon}>
                      <EventTypeIcon slug={event.event_type?.slug} size={16} />
                    </span>
                    <div className={styles.eventInfo}>
                      <span className={styles.eventName}>{event.name}</span>
                      <span className={styles.eventMeta}>
                        {event.city}{event.state ? `, ${event.state}` : ''}
                        {event.start_time && ` · ${formatTime(event.start_time)}`}
                      </span>
                    </div>
                    {event.event_type?.is_track_event && (
                      <span className={styles.trackBadge}>
                        <TrackEventBadgeIcon size={14} />
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className={styles.noEvents}>No events on this date</p>
            )}
          </div>
        )}
      </div>
    </PremiumGate>
  );
}

/**
 * Format time for display
 */
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * EventCalendarViewCompact - Smaller variant for sidebars
 */
export function EventCalendarViewCompact(props) {
  return (
    <div className={styles.compact}>
      <EventCalendarView {...props} />
    </div>
  );
}

