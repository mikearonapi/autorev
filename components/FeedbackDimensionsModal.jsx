'use client';

/**
 * Feedback Dimensions Modal
 * 
 * Multi-dimensional feedback collection for AL responses.
 * Supports both positive and negative feedback flows:
 * 
 * Positive: "What did you like?" - Quick tags + optional text
 * Negative: "Help us improve" - Quick tags + dimension ratings + required text
 * 
 * All additional input is optional to minimize friction.
 * Basic thumbs up/down is captured regardless.
 */

import { useState, useEffect } from 'react';
import styles from './FeedbackDimensionsModal.module.css';

// Quick feedback tags
const POSITIVE_TAGS = [
  { id: 'accurate', label: 'Accurate info' },
  { id: 'helpful', label: 'Very helpful' },
  { id: 'thorough', label: 'Thorough answer' },
  { id: 'easy_to_understand', label: 'Easy to understand' },
  { id: 'good_recommendations', label: 'Good recommendations' },
];

const NEGATIVE_TAGS = [
  { id: 'wrong_info', label: 'Wrong information' },
  { id: 'outdated', label: 'Outdated info' },
  { id: 'missing_context', label: 'Missing context' },
  { id: 'not_helpful', label: 'Not helpful' },
  { id: 'too_vague', label: 'Too vague' },
  { id: 'hallucination', label: 'Made something up' },
];

// Dimension definitions for detailed feedback
const DIMENSIONS = [
  { 
    id: 'accuracy', 
    label: 'Accuracy',
    question: 'Was the information correct?',
  },
  { 
    id: 'completeness', 
    label: 'Completeness',
    question: 'Did it fully answer your question?',
  },
  { 
    id: 'relevance', 
    label: 'Relevance',
    question: 'Was it relevant to your car?',
  },
  { 
    id: 'actionability', 
    label: 'Actionability',
    question: 'Can you act on this advice?',
  },
];

// Icons
const Icons = {
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  thumbsUp: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  ),
  thumbsDown: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
    </svg>
  ),
  star: (filled) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  check: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

/**
 * Star Rating Component
 */
function StarRating({ value, onChange, disabled = false }) {
  const [hoverValue, setHoverValue] = useState(0);
  
  return (
    <div className={styles.starRating}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`${styles.starBtn} ${star <= (hoverValue || value) ? styles.starFilled : ''}`}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          disabled={disabled}
          aria-label={`Rate ${star} stars`}
        >
          {Icons.star(star <= (hoverValue || value))}
        </button>
      ))}
    </div>
  );
}

/**
 * Main Modal Component
 */
export default function FeedbackDimensionsModal({
  isOpen,
  onClose,
  onSubmit,
  feedbackType = 'negative', // 'positive' or 'negative'
  messageContent = '',
  disabled = false,
}) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [feedbackText, setFeedbackText] = useState('');
  const [dimensionRatings, setDimensionRatings] = useState({});
  const [showDimensions, setShowDimensions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isPositive = feedbackType === 'positive';
  const tags = isPositive ? POSITIVE_TAGS : NEGATIVE_TAGS;

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedTags([]);
      setFeedbackText('');
      setDimensionRatings({});
      setShowDimensions(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, isSubmitting, onClose]);

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleDimensionRating = (dimensionId, rating) => {
    setDimensionRatings((prev) => ({ ...prev, [dimensionId]: rating }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        tags: selectedTags,
        feedbackText: feedbackText.trim(),
        dimensions: showDimensions ? dimensionRatings : null,
      });
      onClose();
    } catch (err) {
      console.error('[FeedbackDimensionsModal] Submit error:', err);
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Submit with minimal data (just the basic rating was already captured)
    onSubmit({
      tags: [],
      feedbackText: '',
      dimensions: null,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={!isSubmitting ? onClose : undefined}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        {!isSubmitting && (
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            {Icons.close}
          </button>
        )}

        <div className={styles.content}>
          {/* Header */}
          <div className={`${styles.iconContainer} ${isPositive ? styles.iconPositive : styles.iconNegative}`}>
            {isPositive ? Icons.thumbsUp : Icons.thumbsDown}
          </div>
          
          <h2 className={styles.title}>
            {isPositive ? 'Thanks for the feedback!' : 'Help us improve'}
          </h2>
          
          <p className={styles.subtitle}>
            {isPositive 
              ? 'What did you like about this response? (optional)'
              : 'What went wrong? This helps us make AL smarter.'
            }
          </p>

          {/* Quick Tags */}
          <div className={styles.tagsSection}>
            <div className={styles.tagsGrid}>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={`${styles.tag} ${selectedTags.includes(tag.id) ? styles.tagSelected : ''}`}
                  onClick={() => toggleTag(tag.id)}
                  disabled={disabled || isSubmitting}
                >
                  {selectedTags.includes(tag.id) && <span className={styles.tagCheck}>{Icons.check}</span>}
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Text Feedback */}
          <div className={styles.textSection}>
            <textarea
              className={styles.textInput}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder={isPositive 
                ? 'Any other comments? (optional)'
                : 'Tell us more about what went wrong...'
              }
              rows={3}
              maxLength={500}
              disabled={disabled || isSubmitting}
            />
            <span className={styles.charCount}>{feedbackText.length}/500</span>
          </div>

          {/* Dimension Ratings (expandable, negative feedback only) */}
          {!isPositive && (
            <div className={styles.dimensionsSection}>
              <button
                type="button"
                className={styles.dimensionsToggle}
                onClick={() => setShowDimensions(!showDimensions)}
                disabled={isSubmitting}
              >
                <span>{showDimensions ? 'Hide' : 'Show'} detailed ratings</span>
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`${styles.chevron} ${showDimensions ? styles.chevronUp : ''}`}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              
              {showDimensions && (
                <div className={styles.dimensionsList}>
                  {DIMENSIONS.map((dim) => (
                    <div key={dim.id} className={styles.dimensionRow}>
                      <div className={styles.dimensionInfo}>
                        <span className={styles.dimensionLabel}>{dim.label}</span>
                        <span className={styles.dimensionQuestion}>{dim.question}</span>
                      </div>
                      <StarRating
                        value={dimensionRatings[dim.id] || 0}
                        onChange={(rating) => handleDimensionRating(dim.id, rating)}
                        disabled={isSubmitting}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.skipBtn}
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              {isPositive ? 'Close' : 'Skip'}
            </button>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={isSubmitting || (selectedTags.length === 0 && !feedbackText.trim())}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
