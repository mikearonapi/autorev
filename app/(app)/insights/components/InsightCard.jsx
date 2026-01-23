'use client';

/**
 * InsightCard Component
 * 
 * Individual insight card with:
 * - Title and description
 * - Optional severity indicator
 * - Optional link
 * - Thumbs up/down feedback buttons
 */

import { useState } from 'react';
import Link from 'next/link';
import styles from './InsightCard.module.css';

// Icons
const ThumbsUpIcon = ({ size = 16, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10v12"/>
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>
  </svg>
);

const ThumbsDownIcon = ({ size = 16, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 14V2"/>
    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/>
  </svg>
);

const ChevronRightIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const SEVERITY_COLORS = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#eab308',
  low: '#22c55e',
};

export default function InsightCard({
  type,
  insightKey,
  title,
  description,
  severity,
  dueInfo,
  link,
  carId,
  onFeedback,
}) {
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = async (rating) => {
    if (isSubmitting || feedback === rating) return;
    
    setIsSubmitting(true);
    setFeedback(rating);
    
    try {
      await onFeedback(type, insightKey, rating);
    } catch (err) {
      console.error('Feedback error:', err);
      setFeedback(null); // Revert on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const CardWrapper = link ? Link : 'div';
  const cardProps = link ? { href: link } : {};

  return (
    <div className={styles.card}>
      <CardWrapper {...cardProps} className={styles.cardContent}>
        {severity && (
          <span 
            className={styles.severityDot}
            style={{ backgroundColor: SEVERITY_COLORS[severity] || SEVERITY_COLORS.medium }}
          />
        )}
        <div className={styles.textContent}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>
          {dueInfo && (
            <span className={styles.dueInfo}>{dueInfo}</span>
          )}
        </div>
        {link && (
          <ChevronRightIcon size={16} className={styles.chevron} />
        )}
      </CardWrapper>
      
      <div className={styles.feedbackBar}>
        <span className={styles.feedbackLabel}>Was this helpful?</span>
        <div className={styles.feedbackButtons}>
          <button
            className={`${styles.feedbackBtn} ${feedback === 'up' ? styles.active : ''}`}
            onClick={() => handleFeedback('up')}
            disabled={isSubmitting}
            aria-label="Helpful"
          >
            <ThumbsUpIcon size={14} filled={feedback === 'up'} />
          </button>
          <button
            className={`${styles.feedbackBtn} ${styles.down} ${feedback === 'down' ? styles.active : ''}`}
            onClick={() => handleFeedback('down')}
            disabled={isSubmitting}
            aria-label="Not helpful"
          >
            <ThumbsDownIcon size={14} filled={feedback === 'down'} />
          </button>
        </div>
      </div>
    </div>
  );
}
