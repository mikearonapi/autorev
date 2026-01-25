'use client';

/**
 * QuestionCard Component
 * 
 * Displays an individual questionnaire question with options.
 * Supports single-select, multi-select, scale, and freeform types.
 */

import { useState, useCallback } from 'react';
import styles from './QuestionCard.module.css';

// Category icons
const CATEGORY_ICONS = {
  star: '⭐',
  steering: '🏎️',
  wrench: '🔧',
  flag: '🏁',
  calendar: '📅',
  book: '📚',
  users: '👥',
  dollar: '💰',
};

export default function QuestionCard({
  question,
  value,
  onChange,
  onSubmit,
  compact = false,
  showCategory = true,
  showPoints = true,
  disabled = false,
  autoSubmit = false,
}) {
  const [localValue, setLocalValue] = useState(value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSingleSelect = useCallback((optionValue) => {
    if (disabled) return;
    
    const newValue = { value: optionValue };
    setLocalValue(newValue);
    
    if (onChange) {
      onChange(question.id, newValue);
    }
    
    if (autoSubmit && onSubmit) {
      setIsSubmitting(true);
      onSubmit(question.id, newValue).finally(() => setIsSubmitting(false));
    }
  }, [question.id, onChange, onSubmit, autoSubmit, disabled]);
  
  const handleMultiSelect = useCallback((optionValue) => {
    if (disabled) return;
    
    const currentValues = localValue?.values || [];
    const maxSelections = question.maxSelections || Infinity;
    
    let newValues;
    if (currentValues.includes(optionValue)) {
      // Remove if already selected
      newValues = currentValues.filter(v => v !== optionValue);
    } else {
      // Add if under limit
      if (currentValues.length >= maxSelections) {
        // At limit, replace oldest selection
        newValues = [...currentValues.slice(1), optionValue];
      } else {
        newValues = [...currentValues, optionValue];
      }
    }
    
    const newValue = { values: newValues };
    setLocalValue(newValue);
    
    if (onChange) {
      onChange(question.id, newValue);
    }
  }, [question.id, question.maxSelections, localValue, onChange, disabled]);
  
  const handleSubmit = useCallback(async () => {
    if (disabled || isSubmitting) return;
    if (!localValue || (question.type === 'multi' && (!localValue.values || localValue.values.length === 0))) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(question.id, localValue);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [question.id, question.type, localValue, onSubmit, disabled, isSubmitting]);
  
  const isSelected = (optionValue) => {
    if (question.type === 'multi') {
      return localValue?.values?.includes(optionValue);
    }
    return localValue?.value === optionValue;
  };
  
  const hasSelection = question.type === 'multi' 
    ? (localValue?.values?.length > 0)
    : Boolean(localValue?.value);
  
  return (
    <div className={`${styles.card} ${compact ? styles.compact : ''} ${disabled ? styles.disabled : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        {showCategory && (
          <span className={styles.category} style={{ '--category-color': question.categoryColor }}>
            <span className={styles.categoryIcon}>
              {CATEGORY_ICONS[question.categoryIcon] || '📋'}
            </span>
            {question.categoryName}
          </span>
        )}
        {showPoints && question.points && (
          <span className={styles.points}>+{question.points} pts</span>
        )}
      </div>
      
      {/* Question */}
      <h3 className={styles.question}>{question.question}</h3>
      {question.hint && <p className={styles.hint}>{question.hint}</p>}
      
      {/* Options */}
      <div className={`${styles.options} ${question.type === 'multi' ? styles.multiOptions : ''}`}>
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.option} ${isSelected(option.value) ? styles.selected : ''}`}
            onClick={() => question.type === 'multi' 
              ? handleMultiSelect(option.value) 
              : handleSingleSelect(option.value)
            }
            disabled={disabled}
          >
            {option.emoji && <span className={styles.emoji}>{option.emoji}</span>}
            <span className={styles.optionLabel}>{option.label}</span>
            {question.type === 'multi' && (
              <span className={styles.checkbox}>
                {isSelected(option.value) && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Multi-select hint */}
      {question.type === 'multi' && question.maxSelections && (
        <p className={styles.selectionHint}>
          Select up to {question.maxSelections} 
          {localValue?.values?.length > 0 && ` (${localValue.values.length} selected)`}
        </p>
      )}
      
      {/* Submit button for non-autoSubmit mode */}
      {!autoSubmit && question.type === 'multi' && (
        <button
          type="button"
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={disabled || isSubmitting || !hasSelection}
        >
          {isSubmitting ? 'Saving...' : 'Save Answer'}
        </button>
      )}
    </div>
  );
}
