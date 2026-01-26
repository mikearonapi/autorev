'use client';

/**
 * Quick Actions Component
 * 
 * Common admin tasks for easy access.
 * Uses SVG icons (no emojis).
 */

import { useState } from 'react';

import styles from './QuickActions.module.css';

// SVG Icons
const ChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="20" y2="10"/>
    <line x1="18" x2="18" y1="20" y2="4"/>
    <line x1="6" x2="6" y1="20" y2="16"/>
  </svg>
);

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M8 16H3v5"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);

const VideoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="15" x="2" y="4" rx="2"/>
    <polygon points="10,9 16,12 10,15"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.spinIcon}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" x2="6" y1="6" y2="18"/>
    <line x1="6" x2="18" y1="6" y2="18"/>
  </svg>
);

const ACTIONS = [
  {
    id: 'refresh-content',
    label: 'Refresh Content Metrics',
    icon: <ChartIcon />,
  },
  {
    id: 'run-scrape',
    label: 'Run Scrape Jobs',
    icon: <RefreshIcon />,
  },
  {
    id: 'refresh-events',
    label: 'Refresh Events',
    icon: <CalendarIcon />,
  },
  {
    id: 'youtube-enrich',
    label: 'YouTube Enrichment',
    icon: <VideoIcon />,
  },
];

export function QuickActions({ token, onRefresh }) {
  const [running, setRunning] = useState({});
  const [results, setResults] = useState({});
  
  const runAction = async (action) => {
    setRunning(prev => ({ ...prev, [action.id]: true }));
    setResults(prev => ({ ...prev, [action.id]: null }));
    
    try {
      const res = await fetch('/api/admin/run-action', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: action.id }),
      });
      
      const data = await res.json();
      setResults(prev => ({
        ...prev,
        [action.id]: { success: res.ok && data.success, data },
      }));
      
      // Refresh dashboard data after successful action
      if (res.ok && data.success && onRefresh) {
        setTimeout(() => onRefresh(), 500);
      }
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [action.id]: { success: false, error: err.message },
      }));
    } finally {
      setRunning(prev => ({ ...prev, [action.id]: false }));
    }
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Quick Actions</h3>
      </div>
      
      <div className={styles.actionsList}>
        {ACTIONS.map(action => (
          <button
            key={action.id}
            className={styles.actionButton}
            onClick={() => runAction(action)}
            disabled={running[action.id]}
          >
            <span className={styles.actionIcon}>{action.icon}</span>
            <span className={styles.actionLabel}>{action.label}</span>
            {running[action.id] && <SpinnerIcon />}
            {results[action.id] && (
              <span className={`${styles.resultIcon} ${results[action.id].success ? styles.success : styles.error}`}>
                {results[action.id].success ? <CheckIcon /> : <XIcon />}
              </span>
            )}
          </button>
        ))}
      </div>
      
      <div className={styles.links}>
        <a href="/internal/feedback" className={styles.link}>
          View Feedback
        </a>
        <a href="/internal/data" className={styles.link}>
          Data Manager
        </a>
        <a href="/internal/events" className={styles.link}>
          Event Manager
        </a>
      </div>
    </div>
  );
}

export default QuickActions;
