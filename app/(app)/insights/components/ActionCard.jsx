'use client';

/**
 * ActionCard Component
 * 
 * Displays time-sensitive action items like oil changes due,
 * registration expiring, etc. Inspired by Whoop's activity cards.
 */

import Link from 'next/link';
import styles from './ActionCard.module.css';

// Icons for different action types
const OilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7h-5a8 8 0 0 0-5 2 8 8 0 0 0-5-2H2Z"/>
    <path d="M6 11c1.5 0 3 .5 3 2-2 0-3 0-3-2Z"/>
  </svg>
);

const DocumentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <line x1="10" y1="9" x2="8" y2="9"/>
  </svg>
);

const TireIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="4"/>
    <line x1="12" y1="2" x2="12" y2="4"/>
    <line x1="12" y1="20" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="4" y2="12"/>
    <line x1="20" y1="12" x2="22" y2="12"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const ICON_MAP = {
  oil_change: OilIcon,
  registration: DocumentIcon,
  inspection: CheckIcon,
  tires: TireIcon,
};

const PRIORITY_STYLES = {
  critical: {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.25)',
    color: '#ef4444',
    label: 'Overdue',
  },
  high: {
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.25)',
    color: '#f59e0b',
    label: 'Due Soon',
  },
  medium: {
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.25)',
    color: '#3b82f6',
    label: 'Upcoming',
  },
  low: {
    bg: 'rgba(255, 255, 255, 0.04)',
    border: 'rgba(255, 255, 255, 0.08)',
    color: '#64748b',
    label: '',
  },
};

export default function ActionCard({ action }) {
  const { 
    type, 
    priority, 
    title, 
    description, 
    metric, 
    vehicleName, 
    link 
  } = action;
  
  const Icon = ICON_MAP[type] || CheckIcon;
  const priorityStyle = PRIORITY_STYLES[priority] || PRIORITY_STYLES.low;
  
  const content = (
    <div 
      className={styles.card}
      style={{
        background: priorityStyle.bg,
        borderColor: priorityStyle.border,
      }}
    >
      <div className={styles.iconContainer} style={{ color: priorityStyle.color }}>
        <Icon />
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          {metric && (
            <span 
              className={styles.metric}
              style={{ 
                color: priorityStyle.color,
                background: `${priorityStyle.color}15`,
              }}
            >
              {metric}
            </span>
          )}
        </div>
        <p className={styles.vehicleName}>{vehicleName}</p>
      </div>
      
      {link && (
        <div className={styles.chevron}>
          <ChevronRight />
        </div>
      )}
    </div>
  );
  
  if (link) {
    return (
      <Link href={link} className={styles.link}>
        {content}
      </Link>
    );
  }
  
  return content;
}
