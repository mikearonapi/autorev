'use client';

/**
 * AL Feedback Buttons Component
 * 
 * Provides thumbs up/down feedback buttons for AL responses.
 * Handles feedback submission and shows confirmation.
 * 
 * Usage:
 *   <ALFeedbackButtons
 *     messageId="uuid"
 *     conversationId="uuid"
 *     queryText="What HP does the M3 have?"
 *     responseText="The M3 produces 473 HP..."
 *   />
 */

import { useState, useCallback } from 'react';
import styles from './ALFeedbackButtons.module.css';

// SVG Icons as inline components for consistency
const ThumbsUpIcon = ({ filled }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const ThumbsDownIcon = ({ filled }) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
  </svg>
);

const CheckIcon = () => (
  <svg 
    width="14" 
    height="14" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5"
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Feedback categories for optional follow-up
const FEEDBACK_CATEGORIES = {
  thumbs_up: [
    { value: 'helpful', label: 'Helpful' },
    { value: 'accurate', label: 'Accurate' },
    { value: 'well_explained', label: 'Well explained' },
  ],
  thumbs_down: [
    { value: 'inaccurate', label: 'Inaccurate' },
    { value: 'unhelpful', label: 'Not helpful' },
    { value: 'confusing', label: 'Confusing' },
    { value: 'missing_info', label: 'Missing info' },
    { value: 'off_topic', label: 'Off topic' },
  ],
};

export default function ALFeedbackButtons({
  messageId,
  conversationId = null,
  queryText = null,
  responseText = null,
  toolsUsed = [],
  promptVersionId = null,
  onFeedbackSubmit = null,
  compact = false,
  showCategories = true,
}) {
  const [feedback, setFeedback] = useState(null); // 'thumbs_up' | 'thumbs_down' | null
  const [category, setCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = useCallback(async (feedbackType, feedbackCategory = null) => {
    if (!messageId || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/al/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          conversationId,
          feedbackType,
          feedbackCategory,
          queryText,
          responseText,
          toolsUsed,
          promptVersionId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setFeedback(feedbackType);
        setCategory(feedbackCategory);
        setSubmitted(true);
        setShowCategoryPicker(false);
        
        if (onFeedbackSubmit) {
          onFeedbackSubmit({ feedbackType, feedbackCategory });
        }
      } else {
        console.error('Feedback submission failed:', data.error);
      }
    } catch (err) {
      console.error('Feedback submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [messageId, conversationId, queryText, responseText, toolsUsed, promptVersionId, isSubmitting, onFeedbackSubmit]);

  const handleThumbClick = useCallback((type) => {
    if (submitted) return;
    
    if (showCategories && !compact) {
      // Show category picker
      setFeedback(type);
      setShowCategoryPicker(true);
    } else {
      // Submit immediately
      submitFeedback(type);
    }
  }, [submitted, showCategories, compact, submitFeedback]);

  const handleCategorySelect = useCallback((categoryValue) => {
    setCategory(categoryValue);
    submitFeedback(feedback, categoryValue);
  }, [feedback, submitFeedback]);

  const handleSkipCategory = useCallback(() => {
    submitFeedback(feedback, null);
  }, [feedback, submitFeedback]);

  // Submitted state - show thank you
  if (submitted) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.thankYou}>
          <CheckIcon />
          <span>Thanks for your feedback</span>
        </div>
      </div>
    );
  }

  // Category picker state
  if (showCategoryPicker && feedback) {
    const categories = FEEDBACK_CATEGORIES[feedback] || [];
    
    return (
      <div className={`${styles.container} ${styles.categoryPicker}`}>
        <span className={styles.categoryPrompt}>
          {feedback === 'thumbs_up' ? 'What did you like?' : 'What went wrong?'}
        </span>
        <div className={styles.categoryOptions}>
          {categories.map(cat => (
            <button
              key={cat.value}
              className={styles.categoryButton}
              onClick={() => handleCategorySelect(cat.value)}
              disabled={isSubmitting}
            >
              {cat.label}
            </button>
          ))}
          <button
            className={`${styles.categoryButton} ${styles.skipButton}`}
            onClick={handleSkipCategory}
            disabled={isSubmitting}
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  // Default state - show thumbs buttons
  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      <span className={styles.label}>Was this helpful?</span>
      <div className={styles.buttons}>
        <button
          className={`${styles.feedbackButton} ${styles.thumbsUp} ${feedback === 'thumbs_up' ? styles.active : ''}`}
          onClick={() => handleThumbClick('thumbs_up')}
          disabled={isSubmitting}
          aria-label="Helpful"
          title="Helpful"
        >
          <ThumbsUpIcon filled={feedback === 'thumbs_up'} />
        </button>
        <button
          className={`${styles.feedbackButton} ${styles.thumbsDown} ${feedback === 'thumbs_down' ? styles.active : ''}`}
          onClick={() => handleThumbClick('thumbs_down')}
          disabled={isSubmitting}
          aria-label="Not helpful"
          title="Not helpful"
        >
          <ThumbsDownIcon filled={feedback === 'thumbs_down'} />
        </button>
      </div>
    </div>
  );
}
