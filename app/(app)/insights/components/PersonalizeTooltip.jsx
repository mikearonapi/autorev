'use client';

/**
 * PersonalizeTooltip Component
 * 
 * Modal questionnaire for collecting user preferences.
 * Awards points for answering questions.
 * Responses feed into insight personalization and AL conversations.
 */

import { useState, useCallback } from 'react';
import { INSIGHT_QUESTIONS, POINTS_PER_QUESTION } from '@/data/insightQuestions';
import styles from './PersonalizeTooltip.module.css';

// Icons
const CloseIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const CheckIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const SparklesIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

export default function PersonalizeTooltip({ userId, currentPreferences, onClose, onSaved }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);

  // Filter questions that haven't been answered yet
  const unansweredQuestions = INSIGHT_QUESTIONS.filter(q => {
    const existingAnswer = currentPreferences?.responses?.[q.id];
    return !existingAnswer;
  });

  const currentQuestion = unansweredQuestions[currentStep];
  const totalQuestions = unansweredQuestions.length;
  const isLastQuestion = currentStep === totalQuestions - 1;

  const handleSelect = useCallback((value) => {
    const questionId = currentQuestion.id;
    const isMultiSelect = currentQuestion.multiSelect;
    
    if (isMultiSelect) {
      const currentValues = answers[questionId] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      setAnswers(prev => ({ ...prev, [questionId]: newValues }));
    } else {
      setAnswers(prev => ({ ...prev, [questionId]: value }));
    }
  }, [currentQuestion, answers]);

  const isAnswered = () => {
    const answer = answers[currentQuestion?.id];
    if (currentQuestion?.multiSelect) {
      return answer && answer.length > 0;
    }
    return !!answer;
  };

  const handleNext = async () => {
    if (!isAnswered()) return;
    
    const newPointsEarned = pointsEarned + POINTS_PER_QUESTION;
    setPointsEarned(newPointsEarned);
    
    if (isLastQuestion) {
      // Save all answers
      await handleSave();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/users/${userId}/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: answers,
          pointsEarned: pointsEarned + POINTS_PER_QUESTION,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }
      
      onSaved();
    } catch (err) {
      console.error('Save preferences error:', err);
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    if (isLastQuestion) {
      if (Object.keys(answers).length > 0) {
        handleSave();
      } else {
        onClose();
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  // No more questions
  if (!currentQuestion) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <button className={styles.closeBtn} onClick={onClose}>
            <CloseIcon size={20} />
          </button>
          <div className={styles.completeState}>
            <SparklesIcon size={40} />
            <h3>All Done!</h3>
            <p>You&apos;ve answered all personalization questions.</p>
            <button className={styles.doneBtn} onClick={onClose}>
              View Insights
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <CloseIcon size={20} />
        </button>

        {/* Progress */}
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${((currentStep + 1) / totalQuestions) * 100}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {currentStep + 1} of {totalQuestions}
          </span>
        </div>

        {/* Points indicator */}
        {pointsEarned > 0 && (
          <div className={styles.pointsEarned}>
            +{pointsEarned} pts earned
          </div>
        )}

        {/* Question */}
        <h3 className={styles.question}>{currentQuestion.question}</h3>
        
        {currentQuestion.hint && (
          <p className={styles.hint}>{currentQuestion.hint}</p>
        )}

        {/* Options */}
        <div className={styles.options}>
          {currentQuestion.options.map((option) => {
            const isSelected = currentQuestion.multiSelect
              ? (answers[currentQuestion.id] || []).includes(option.value)
              : answers[currentQuestion.id] === option.value;
            
            return (
              <button
                key={option.value}
                className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                onClick={() => handleSelect(option.value)}
              >
                {option.emoji && <span className={styles.optionEmoji}>{option.emoji}</span>}
                <span className={styles.optionLabel}>{option.label}</span>
                {isSelected && (
                  <span className={styles.checkmark}>
                    <CheckIcon size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {currentQuestion.multiSelect && (
          <p className={styles.multiSelectHint}>Select all that apply</p>
        )}

        {/* Actions */}
        <div className={styles.actions}>
          <button 
            className={styles.skipBtn}
            onClick={handleSkip}
          >
            Skip
          </button>
          <button 
            className={styles.nextBtn}
            onClick={handleNext}
            disabled={!isAnswered() || isSaving}
          >
            {isSaving ? 'Saving...' : isLastQuestion ? 'Finish' : 'Next'}
            <span className={styles.pointsBadge}>+{POINTS_PER_QUESTION}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
