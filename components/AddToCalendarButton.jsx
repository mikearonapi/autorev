'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from './AddToCalendarButton.module.css';
import { useAuth } from './providers/AuthProvider';
import { useAuthModal } from './AuthModal';
import { hasAccess, getUpgradeCTA, IS_BETA } from '@/lib/tierAccess';

/**
 * Calendar Icon
 */
const CalendarIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <line x1="9" y1="14" x2="9" y2="18"/>
    <line x1="15" y1="14" x2="15" y2="18"/>
    <line x1="9" y1="16" x2="15" y2="16"/>
  </svg>
);

/**
 * Download Icon
 */
const DownloadIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

/**
 * Calendar provider icons
 */
const ProviderIcons = {
  google: () => (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      <path fill="#fff" d="M17 12h-4v4h-2v-4H7v-2h4V6h2v4h4v2z"/>
    </svg>
  ),
  apple: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  ),
  outlook: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0078D4">
      <path d="M24 7.387v10.478c0 .23-.08.424-.238.576-.158.152-.357.228-.595.228h-8.16v-6.837l1.097.826c.158.11.342.166.551.166.21 0 .392-.055.55-.166l5.697-4.29a1.02 1.02 0 01.395-.283c.135-.057.276-.085.423-.085h.28V7.06c0-.124-.042-.228-.126-.313a.432.432 0 00-.315-.127h-.279V7.387zM8.007 15.332H.833c-.23 0-.425-.076-.583-.228A.777.777 0 010 14.528V3.05c0-.209.083-.389.25-.54.166-.151.361-.227.583-.227h7.174c.223 0 .417.076.584.228a.749.749 0 01.249.54v11.477c0 .209-.083.39-.25.541-.166.152-.36.228-.583.228h0v.035zm6.66-8.67v7.17l-1.097-.826a.974.974 0 00-.551-.166c-.21 0-.393.055-.551.166L8 17.296v-10.634h6.667zM4.42 5.937c-.703 0-1.27.236-1.702.707-.432.472-.648 1.082-.648 1.83v3.052c0 .748.216 1.358.648 1.83.432.47 1 .706 1.702.706.703 0 1.27-.236 1.702-.707.432-.471.648-1.081.648-1.829V8.474c0-.748-.216-1.358-.648-1.83-.432-.47-.999-.707-1.702-.707z"/>
    </svg>
  ),
  ics: () => <DownloadIcon size={16} />,
};

/**
 * Format date for calendar URLs
 */
function formatDateForCalendar(dateStr, timeStr = null, allDay = false) {
  if (!dateStr) return '';
  
  // Create date object in local time
  const date = new Date(dateStr + 'T' + (timeStr || '00:00:00'));
  
  if (allDay) {
    // For all-day events, use YYYYMMDD format
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }
  
  // For timed events, use YYYYMMDDTHHMMSS format
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

/**
 * Generate ICS file content
 */
function generateICS(event) {
  const {
    name,
    description,
    start_date,
    end_date,
    start_time,
    end_time,
    venue_name,
    address,
    city,
    state,
    zip,
    source_url,
  } = event;

  const location = [venue_name, address, city, state, zip]
    .filter(Boolean)
    .join(', ');

  const allDay = !start_time;
  const startDT = formatDateForCalendar(start_date, start_time, allDay);
  const endDT = end_date 
    ? formatDateForCalendar(end_date, end_time, allDay)
    : startDT;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AutoRev//Events//EN',
    'BEGIN:VEVENT',
    `DTSTART${allDay ? ';VALUE=DATE' : ''}:${startDT}`,
    `DTEND${allDay ? ';VALUE=DATE' : ''}:${endDT}`,
    `SUMMARY:${name}`,
    description && `DESCRIPTION:${description.replace(/\n/g, '\\n').substring(0, 500)}`,
    location && `LOCATION:${location}`,
    source_url && `URL:${source_url}`,
    `UID:${event.id || event.slug}@autorev.com`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

/**
 * Generate Google Calendar URL
 */
function generateGoogleCalendarUrl(event) {
  const { name, description, start_date, end_date, start_time, end_time, venue_name, city, state, source_url } = event;
  
  const location = [venue_name, city, state].filter(Boolean).join(', ');
  const allDay = !start_time;
  
  const dates = allDay
    ? `${formatDateForCalendar(start_date, null, true)}/${formatDateForCalendar(end_date || start_date, null, true)}`
    : `${formatDateForCalendar(start_date, start_time)}/${formatDateForCalendar(end_date || start_date, end_time || start_time)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: name,
    dates,
    location,
    details: `${description || ''}\n\nMore info: ${source_url || ''}`.trim(),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook.com URL
 */
function generateOutlookUrl(event) {
  const { name, description, start_date, end_date, start_time, end_time, venue_name, city, state, source_url } = event;
  
  const location = [venue_name, city, state].filter(Boolean).join(', ');
  const startdt = start_date + (start_time ? `T${start_time}` : '');
  const enddt = (end_date || start_date) + (end_time ? `T${end_time}` : start_time ? `T${start_time}` : '');

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: name,
    startdt,
    enddt,
    location,
    body: `${description || ''}\n\nMore info: ${source_url || ''}`.trim(),
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * AddToCalendarButton component
 * 
 * A dropdown button to add events to various calendar apps.
 * Tier-gated: Collector+ only.
 * 
 * @param {Object} props
 * @param {Object} props.event - Event object with date/time/location
 * @param {string} [props.variant] - 'default' | 'compact'
 */
export default function AddToCalendarButton({ event, variant = 'default' }) {
  const { isAuthenticated, profile } = useAuth();
  const { openSignIn } = useAuthModal();
  const userTier = profile?.subscription_tier || 'free';
  
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const dropdownRef = useRef(null);

  // Check if user has access
  const canExport = IS_BETA ? isAuthenticated : hasAccess(userTier, 'eventsCalendarExport', isAuthenticated);
  const upgradeCTA = getUpgradeCTA('collector');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleButtonClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      openSignIn();
      return;
    }

    if (!canExport) {
      setShowUpgradePrompt(true);
      return;
    }

    setIsOpen(!isOpen);
  }, [isAuthenticated, canExport, isOpen, openSignIn]);

  const handleCalendarSelect = useCallback((provider) => {
    setIsOpen(false);

    if (provider === 'google') {
      window.open(generateGoogleCalendarUrl(event), '_blank');
    } else if (provider === 'outlook') {
      window.open(generateOutlookUrl(event), '_blank');
    } else if (provider === 'apple' || provider === 'ics') {
      // Generate and download ICS file
      const icsContent = generateICS(event);
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.slug || 'event'}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [event]);

  return (
    <>
      <div className={styles.container} ref={dropdownRef}>
        <button
          type="button"
          className={`${styles.button} ${styles[variant]} ${isOpen ? styles.open : ''}`}
          onClick={handleButtonClick}
          title={
            !isAuthenticated
              ? 'Sign in to add to calendar'
              : !canExport
                ? 'Upgrade to Collector to add to calendar'
                : 'Add to calendar'
          }
        >
          <CalendarIcon size={variant === 'compact' ? 16 : 18} />
          {variant !== 'compact' && <span className={styles.label}>Add to Calendar</span>}
          <span className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </span>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className={styles.dropdown}>
            <button 
              className={styles.option}
              onClick={() => handleCalendarSelect('google')}
            >
              <ProviderIcons.google />
              <span>Google Calendar</span>
            </button>
            <button 
              className={styles.option}
              onClick={() => handleCalendarSelect('apple')}
            >
              <ProviderIcons.apple />
              <span>Apple Calendar</span>
            </button>
            <button 
              className={styles.option}
              onClick={() => handleCalendarSelect('outlook')}
            >
              <ProviderIcons.outlook />
              <span>Outlook</span>
            </button>
            <div className={styles.divider} />
            <button 
              className={styles.option}
              onClick={() => handleCalendarSelect('ics')}
            >
              <ProviderIcons.ics />
              <span>Download .ics</span>
            </button>
          </div>
        )}
      </div>

      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className={styles.modal} onClick={() => setShowUpgradePrompt(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button 
              className={styles.modalClose}
              onClick={() => setShowUpgradePrompt(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className={styles.modalIcon}>📅</div>
            <h3 className={styles.modalTitle}>Add to Your Calendar</h3>
            <p className={styles.modalDescription}>
              Never miss an event! Export events directly to Google Calendar, Apple Calendar, 
              or Outlook. Available for Collector members and above.
            </p>
            <div className={styles.modalActions}>
              <Link 
                href={upgradeCTA.href} 
                className={styles.upgradeBtn}
                style={{ '--tier-color': upgradeCTA.tierColor }}
              >
                {upgradeCTA.text}
              </Link>
              <button 
                onClick={() => setShowUpgradePrompt(false)}
                className={styles.dismissBtn}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

