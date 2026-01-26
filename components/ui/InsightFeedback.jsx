'use client';

/**
 * InsightFeedback - Reusable thumbs up/down feedback for insight sections
 * 
 * Provides a compact feedback mechanism for any insight card/section.
 * Connects to /api/insights/feedback endpoint.
 */

import React, { useState, useCallback } from 'react';

import styles from './InsightFeedback.module.css';

// Icons
const ThumbsUpIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
  </svg>
);

const ThumbsDownIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
  </svg>
);

/**
 * InsightFeedback component
 * 
 * @param {string} insightType - Category/type of the insight (e.g., 'build-progress', 'value-analysis')
 * @param {string} insightKey - Unique key for the insight item
 * @param {string} insightTitle - Title/name of the insight for tracking
 * @param {function} onFeedback - Callback when feedback is submitted (type, key, rating)
 * @param {string} variant - Visual variant: 'default' | 'compact' | 'inline'
 */
export default function InsightFeedback({ 
  insightType,
  insightKey,
  insightTitle,
  onFeedback,
  variant = 'default',
}) {
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedback = useCallback(async (rating) => {
    if (isSubmitting || feedback === rating) return;
    
    setIsSubmitting(true);
    setFeedback(rating);
    
    try {
      if (onFeedback) {
        await onFeedback(insightType, insightKey, rating, insightTitle);
      }
    } catch (err) {
      console.error('[InsightFeedback] Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, feedback, onFeedback, insightType, insightKey, insightTitle]);

  return (
    <div className={`${styles.feedbackContainer} ${styles[variant]}`}>
      <button 
        className={`${styles.feedbackBtn} ${feedback === 'up' ? styles.activeUp : ''}`}
        onClick={() => handleFeedback('up')}
        disabled={isSubmitting}
        aria-label="This was helpful"
        title="This was helpful"
      >
        <ThumbsUpIcon size={variant === 'compact' ? 12 : 14} />
      </button>
      <button 
        className={`${styles.feedbackBtn} ${feedback === 'down' ? styles.activeDown : ''}`}
        onClick={() => handleFeedback('down')}
        disabled={isSubmitting}
        aria-label="Not helpful"
        title="Not helpful"
      >
        <ThumbsDownIcon size={variant === 'compact' ? 12 : 14} />
      </button>
    </div>
  );
}
