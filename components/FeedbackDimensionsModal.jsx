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
import { Icons } from '@/components/ui/Icons';

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
          <Icons.star size={20} filled={star <= (hoverValue || value)} />
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

  const handleFeedbackDimensionsSubmit = async () => {
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
            <Icons.close size={20} />
          </button>
        )}

        <div className={styles.content}>
          {/* Header */}
          <div className={`${styles.iconContainer} ${isPositive ? styles.iconPositive : styles.iconNegative}`}>
            {isPositive ? <Icons.thumbsUp size={24} /> : <Icons.thumbsDown size={24} />}
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
                  {selectedTags.includes(tag.id) && <span className={styles.tagCheck}><Icons.check size={14} /></span>}
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
              onClick={handleFeedbackDimensionsSubmit}
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
