'use client';

/**
 * FullscreenQuestionnaire Component
 *
 * A professional, full-page immersive questionnaire experience.
 * Clean, minimal design with one question at a time.
 * Rendered via React Portal to document.body for proper stacking context.
 *
 * Design principles:
 * - Minimal and professional (no emojis, no step counts)
 * - Compact but readable layout
 * - X close button in top right
 * - Single prominent CTA button
 * - PWA-safe footer spacing
 */

import { useState, useCallback, useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';

import { createPortal } from 'react-dom';


import LoadingSpinner from '@/components/LoadingSpinner';
import { usePointsNotification } from '@/components/providers/PointsNotificationProvider';
import { QUESTIONNAIRE_LIBRARY, getAvailableQuestions } from '@/data/questionnaireLibrary';
import { useQuestionnaire } from '@/hooks/useQuestionnaire';
import { useSafeAreaColor, SAFE_AREA_COLORS } from '@/hooks/useSafeAreaColor';

import styles from './FullscreenQuestionnaire.module.css';

export default function FullscreenQuestionnaire({ userId, onComplete, onClose }) {
  const router = useRouter();
  const [currentQuestionIndex, _setCurrentQuestionIndex] = useState(0);
  const [localSelection, setLocalSelection] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Portal mounting - required for SSR compatibility
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Set safe area color to match overlay background (charcoal)
  // This ensures the iOS status bar area matches the modal background
  useSafeAreaColor(SAFE_AREA_COLORS.OVERLAY);

  // Ref to prevent race condition with rapid clicks
  // This is checked synchronously before any async work, preventing double-submits
  // even when React state updates are batched
  const isProcessingRef = useRef(false);

  // Points notification hook
  const { showPointsEarned } = usePointsNotification();

  const {
    responses,
    summary: _summary,
    isLoading,
    isError,
    submitResponse,
    isSubmitting,
  } = useQuestionnaire(userId);

  // Get available (unanswered) questions
  const availableQuestions = getAvailableQuestions(responses || {});
  const currentQuestion = availableQuestions[currentQuestionIndex];
  const totalQuestions = availableQuestions.length;
  const completedCount = Object.keys(responses || {}).length;
  const totalLibraryCount = QUESTIONNAIRE_LIBRARY.length;

  // Calculate progress percentage (used only in success state)
  const progressPercent = Math.round((completedCount / totalLibraryCount) * 100);

  // Reset local selection when the current question changes
  // NOTE: We use currentQuestion?.id instead of currentQuestionIndex because
  // the index stays at 0 while questions rotate through (answered questions
  // are filtered out by getAvailableQuestions). This ensures selection is
  // cleared when the optimistic update causes a new question to appear.
  useEffect(() => {
    setLocalSelection(null);
  }, [currentQuestion?.id]);

  // Handle single-select option click
  const handleSingleSelect = useCallback(
    (optionValue) => {
      if (isSubmitting || isTransitioning) return;
      setLocalSelection({ value: optionValue });
    },
    [isSubmitting, isTransitioning]
  );

  // Handle multi-select option click
  const handleMultiSelect = useCallback(
    (optionValue) => {
      if (isSubmitting || isTransitioning) return;

      const currentValues = localSelection?.values || [];
      const maxSelections = currentQuestion?.maxSelections || Infinity;

      let newValues;
      if (currentValues.includes(optionValue)) {
        newValues = currentValues.filter((v) => v !== optionValue);
      } else {
        if (currentValues.length >= maxSelections) {
          newValues = [...currentValues.slice(1), optionValue];
        } else {
          newValues = [...currentValues, optionValue];
        }
      }

      setLocalSelection({ values: newValues });
    },
    [localSelection, currentQuestion, isSubmitting, isTransitioning]
  );

  // Submit current answer and advance
  const handleQuestionnaireAnswerSubmit = useCallback(async () => {
    // Use ref to prevent race condition with rapid clicks
    // React state (isSubmitting, isTransitioning) can have stale values in the callback
    // closure due to batched renders, but ref check is synchronous and immediate
    if (isProcessingRef.current) return;
    if (!currentQuestion || isSubmitting || isTransitioning) return;

    // Validate selection exists
    if (currentQuestion.type === 'multi') {
      if (!localSelection?.values?.length) return;
    } else {
      if (!localSelection?.value) return;
    }

    // Set processing flag immediately to block any subsequent clicks
    isProcessingRef.current = true;

    // Capture the question ID we're answering before any async work
    // This ensures we track the correct question even if state changes during async
    const questionIdBeingAnswered = currentQuestion.id;

    try {
      await submitResponse(questionIdBeingAnswered, localSelection);

      // Show points earned notification
      showPointsEarned(5, 'Profile question');

      // Transition to next question
      setIsTransitioning(true);

      setTimeout(() => {
        // NOTE: We do NOT increment currentQuestionIndex here.
        // The optimistic update in useQuestionnaire immediately adds the response,
        // which causes getAvailableQuestions() to return a smaller list
        // (the answered question is filtered out). The "next" question naturally
        // slides into the current index position. Incrementing would skip a question.
        //
        // We only show success when this was the last available question.
        // Since totalQuestions is computed from availableQuestions.length BEFORE
        // the optimistic update shrinks it, we check if we were at the last question.
        if (currentQuestionIndex >= totalQuestions - 1) {
          // This was the last question - show success
          setShowSuccess(true);
        }
        // Clear selection for the next question (which is now at the same index)
        // Note: This is a backup clear - the useEffect on currentQuestion?.id
        // should have already cleared it when the question changed
        setLocalSelection(null);
        setIsTransitioning(false);

        // Reset processing flag after transition completes
        isProcessingRef.current = false;
      }, 300);
    } catch (err) {
      console.error('[FullscreenQuestionnaire] Submit error:', err);
      // Reset processing flag on error so user can retry
      isProcessingRef.current = false;
    }
  }, [
    currentQuestion,
    localSelection,
    submitResponse,
    showPointsEarned,
    currentQuestionIndex,
    totalQuestions,
    isSubmitting,
    isTransitioning,
  ]);

  // Handle close/finish
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      router.push('/dashboard');
    }
  }, [onClose, router]);

  // Handle complete
  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete();
    } else {
      router.push('/dashboard');
    }
  }, [onComplete, router]);

  // Check if option is selected
  const isSelected = (optionValue) => {
    if (!localSelection) return false;
    if (currentQuestion?.type === 'multi') {
      return localSelection.values?.includes(optionValue);
    }
    return localSelection.value === optionValue;
  };

  // Check if can submit
  const canSubmit =
    currentQuestion?.type === 'multi'
      ? localSelection?.values?.length > 0
      : Boolean(localSelection?.value);

  // Explanatory text - concise, explains the value
  const explanatoryText = 'Personalizes your entire AutoRev experience.';

  // Don't render until mounted (SSR compatibility)
  if (!isMounted) return null;

  // Loading state
  if (isLoading) {
    return createPortal(
      <div className={styles.container} data-overlay-modal>
        <div className={styles.loadingState}>
          <LoadingSpinner size="medium" />
          <span>Loading your profile...</span>
        </div>
      </div>,
      document.body
    );
  }

  // Error state
  if (isError) {
    return createPortal(
      <div className={styles.container} data-overlay-modal>
        <div className={styles.errorState}>
          <span>Something went wrong. Please try again.</span>
          <button onClick={handleClose} className={styles.primaryBtn}>
            Close
          </button>
        </div>
      </div>,
      document.body
    );
  }

  // All questions answered or success state
  if (showSuccess || totalQuestions === 0) {
    return createPortal(
      <div className={styles.container} data-overlay-modal>
        <div className={styles.successState}>
          <div className={styles.successIcon}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className={styles.successTitle}>
            {progressPercent >= 100 ? 'Profile Complete' : 'Great Progress'}
          </h2>
          <p className={styles.successText}>
            {progressPercent >= 100
              ? "You've completed your enthusiast profile. AL now knows you well and can give personalized recommendations."
              : `You've answered ${completedCount} questions. Come back anytime to continue.`}
          </p>
          <div className={styles.successProgress}>
            <div className={styles.successProgressBar}>
              <div
                className={styles.successProgressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className={styles.successProgressText}>{progressPercent}% complete</span>
          </div>
          <button onClick={handleComplete} className={styles.primaryBtn}>
            Continue
          </button>
        </div>
      </div>,
      document.body
    );
  }

  // Main questionnaire content
  const questionnaireContent = (
    <div className={styles.container} data-overlay-modal>
      {/* Header - minimal with close button */}
      <header className={styles.header}>
        <div className={styles.headerSpacer} />

        <button
          onClick={handleClose}
          className={styles.closeButton}
          aria-label="Close questionnaire"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      {/* Main content */}
      <main className={styles.main}>
        <div
          className={`${styles.questionContainer} ${isTransitioning ? styles.transitioning : ''}`}
        >
          {/* Question */}
          <h1 className={styles.question}>{currentQuestion?.question}</h1>

          {/* Multi-select hint */}
          {currentQuestion?.type === 'multi' && currentQuestion.maxSelections && (
            <p className={styles.selectionHint}>Select up to {currentQuestion.maxSelections}</p>
          )}

          {/* Options */}
          <div className={styles.options}>
            {currentQuestion?.options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`${styles.option} ${isSelected(option.value) ? styles.optionSelected : ''}`}
                onClick={() =>
                  currentQuestion.type === 'multi'
                    ? handleMultiSelect(option.value)
                    : handleSingleSelect(option.value)
                }
                disabled={isSubmitting}
              >
                <span className={styles.optionLabel}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer - explanatory text and CTA button */}
      <footer className={styles.footer}>
        <p className={styles.explanatoryText}>{explanatoryText}</p>

        <button
          onClick={handleQuestionnaireAnswerSubmit}
          className={styles.submitBtn}
          disabled={!canSubmit || isSubmitting || isTransitioning}
        >
          {isSubmitting ? 'Saving...' : 'Next'}
        </button>
      </footer>
    </div>
  );

  // Use portal to render at document body level
  return createPortal(questionnaireContent, document.body);
}
