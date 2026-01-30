'use client';

/**
 * InsightFeedback - Reusable thumbs up/down feedback for insight sections
 *
 * Provides a compact feedback mechanism for any insight card/section.
 * Connects to /api/insights/feedback endpoint.
 *
 * For thumbs down, opens FeedbackDimensionsModal for detailed feedback collection.
 */

import React, { useState, useCallback } from 'react';

import FeedbackDimensionsModal from '@/components/FeedbackDimensionsModal';

import styles from './InsightFeedback.module.css';

// Icons - filled prop controls whether icon is filled or outline
const ThumbsUpIcon = ({ size = 14, filled = false }) => (
  <svg
    width={size}
    height={size}
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

const ThumbsDownIcon = ({ size = 14, filled = false }) => (
  <svg
    width={size}
    height={size}
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

/**
 * InsightFeedback component
 *
 * @param {string} insightType - Category/type of the insight (e.g., 'build-progress', 'value-analysis')
 * @param {string} insightKey - Unique key for the insight item
 * @param {string} insightTitle - Title/name of the insight for tracking
 * @param {function} onFeedback - Callback when feedback is submitted (type, key, rating, title, feedbackText)
 * @param {string} variant - Visual variant: 'default' | 'compact' | 'inline'
 */
export default function InsightFeedback({
  insightType,
  insightKey,
  insightTitle,
  onFeedback,
  variant = 'default',
}) {
  const [feedback, setFeedback] = useState(null); // 'up' | 'down' | null
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = useCallback(
    async (rating, feedbackText = null) => {
      console.log('[InsightFeedback] submitFeedback called:', {
        rating,
        feedbackText,
        insightType,
        insightKey,
        hasOnFeedback: !!onFeedback,
      });

      if (isSubmitting) return;

      setIsSubmitting(true);
      setFeedback(rating);

      try {
        if (onFeedback) {
          console.log('[InsightFeedback] Calling onFeedback callback');
          await onFeedback(insightType, insightKey, rating, insightTitle, feedbackText);
          console.log('[InsightFeedback] onFeedback completed');
        } else {
          console.warn('[InsightFeedback] No onFeedback callback provided');
        }
        setSubmitted(true);
      } catch (err) {
        console.error('[InsightFeedback] Error:', err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, onFeedback, insightType, insightKey, insightTitle]
  );

  const handleThumbsUp = useCallback(() => {
    if (isSubmitting || submitted) return;
    submitFeedback('up');
  }, [isSubmitting, submitted, submitFeedback]);

  const handleThumbsDown = useCallback(() => {
    if (isSubmitting || submitted) return;
    // Show the feedback modal for detailed negative feedback
    setFeedback('down');
    setShowFeedbackModal(true);
  }, [isSubmitting, submitted]);

  const handleModalSubmit = useCallback(
    async ({ tags, feedbackText }) => {
      // Combine tags and text into a single feedback string
      const combinedFeedback = [
        tags.length > 0 ? `Tags: ${tags.join(', ')}` : '',
        feedbackText ? `Comment: ${feedbackText}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      await submitFeedback('down', combinedFeedback || null);
      setShowFeedbackModal(false);
    },
    [submitFeedback]
  );

  const handleModalClose = useCallback(() => {
    // If modal is closed without submitting, reset the feedback state
    if (!submitted) {
      setFeedback(null);
    }
    setShowFeedbackModal(false);
  }, [submitted]);

  // Submitted state - show illuminated button for the selected feedback
  if (submitted) {
    return (
      <div className={`${styles.feedbackContainer} ${styles[variant]}`}>
        <button
          className={`${styles.feedbackBtn} ${feedback === 'up' ? styles.activeUp : styles.dimmed}`}
          disabled
          aria-label="Helpful - submitted"
        >
          <ThumbsUpIcon size={variant === 'compact' ? 12 : 14} filled={feedback === 'up'} />
        </button>
        <button
          className={`${styles.feedbackBtn} ${feedback === 'down' ? styles.activeDown : styles.dimmed}`}
          disabled
          aria-label="Not helpful - submitted"
        >
          <ThumbsDownIcon size={variant === 'compact' ? 12 : 14} filled={feedback === 'down'} />
        </button>
      </div>
    );
  }

  // Default state - show thumbs buttons
  return (
    <>
      <div className={`${styles.feedbackContainer} ${styles[variant]}`}>
        <button
          className={`${styles.feedbackBtn} ${feedback === 'up' ? styles.activeUp : ''}`}
          onClick={handleThumbsUp}
          disabled={isSubmitting}
          aria-label="This was helpful"
          title="This was helpful"
        >
          <ThumbsUpIcon size={variant === 'compact' ? 12 : 14} filled={feedback === 'up'} />
        </button>
        <button
          className={`${styles.feedbackBtn} ${feedback === 'down' ? styles.activeDown : ''}`}
          onClick={handleThumbsDown}
          disabled={isSubmitting}
          aria-label="Not helpful"
          title="Not helpful"
        >
          <ThumbsDownIcon size={variant === 'compact' ? 12 : 14} filled={feedback === 'down'} />
        </button>
      </div>

      {/* Feedback modal for detailed negative feedback */}
      <FeedbackDimensionsModal
        isOpen={showFeedbackModal}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        feedbackType="negative"
        subtitle="What went wrong? Your feedback helps us improve."
        showDimensionRatings={false}
      />
    </>
  );
}
