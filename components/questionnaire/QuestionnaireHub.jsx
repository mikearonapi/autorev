'use client';

/**
 * QuestionnaireHub Component
 * 
 * Main container for the Enthusiast Profile questionnaire.
 * Shows overall progress, categories, quick questions, and persona summary.
 * 
 * Used in Settings page as the primary questionnaire interface.
 */

import { useState, useMemo } from 'react';

import LoadingSpinner from '@/components/LoadingSpinner';
import { QUESTION_CATEGORIES } from '@/data/questionnaireLibrary';
import { useQuestionnaire } from '@/hooks/useQuestionnaire';

import CategoryProgress from './CategoryProgress';
import PersonaSummary from './PersonaSummary';
import ProgressRing from './ProgressRing';
import QuestionCard from './QuestionCard';
import styles from './QuestionnaireHub.module.css';


export default function QuestionnaireHub({
  userId,
  compact = false,
  initialCategory = null,
}) {
  const [expandedCategory, setExpandedCategory] = useState(initialCategory);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  
  // Fetch questionnaire data
  const {
    responses,
    summary,
    nextQuestions,
    categoryCompletion,
    isLoading,
    isError,
    submitResponse,
    isSubmitting,
  } = useQuestionnaire(userId);
  
  // Sort categories by priority
  const sortedCategories = useMemo(() => {
    return Object.values(QUESTION_CATEGORIES).sort((a, b) => a.priority - b.priority);
  }, []);
  
  // Handle answer submission
  const handleAnswer = async (questionId, answer) => {
    try {
      await submitResponse(questionId, answer);
      // Move to next question if available
      if (activeQuestionIndex < (nextQuestions?.length || 0) - 1) {
        setActiveQuestionIndex(prev => prev + 1);
      }
    } catch (err) {
      console.error('[QuestionnaireHub] Failed to submit answer:', err);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.loading}>
          <LoadingSpinner size="small" />
          <span>Loading your profile...</span>
        </div>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
        <div className={styles.error}>
          <span>Failed to load questionnaire</span>
        </div>
      </div>
    );
  }
  
  const completeness = summary?.profileCompletenessPct || 0;
  const answeredCount = summary?.answeredCount || 0;
  const currentQuestion = nextQuestions?.[activeQuestionIndex];
  
  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      {/* Header with progress */}
      <div className={styles.header}>
        <ProgressRing
          percentage={completeness}
          size={compact ? 80 : 100}
          strokeWidth={compact ? 6 : 8}
          color="#10b981"
          label={compact ? null : "Complete"}
        />
        <div className={styles.headerInfo}>
          <h3 className={styles.headerTitle}>Enthusiast Profile</h3>
          <p className={styles.headerSubtitle}>
            {answeredCount === 0 
              ? 'Help AL understand you better'
              : `${answeredCount} questions answered`
            }
          </p>
          <div className={styles.headerBenefits}>
            <span className={styles.benefit}>
              <span className={styles.benefitIcon}>🎯</span>
              Better recommendations
            </span>
            <span className={styles.benefit}>
              <span className={styles.benefitIcon}>⚡</span>
              Earn points
            </span>
          </div>
        </div>
      </div>
      
      {/* Quick Question Carousel */}
      {nextQuestions && nextQuestions.length > 0 && (
        <div className={styles.quickQuestionSection}>
          <div className={styles.quickQuestionHeader}>
            <h4 className={styles.quickQuestionTitle}>
              Quick Questions
            </h4>
            <span className={styles.quickQuestionCount}>
              {activeQuestionIndex + 1} of {nextQuestions.length}
            </span>
          </div>
          
          <QuestionCard
            question={{
              ...currentQuestion,
              categoryName: QUESTION_CATEGORIES[currentQuestion?.category]?.name,
              categoryIcon: QUESTION_CATEGORIES[currentQuestion?.category]?.icon,
              categoryColor: QUESTION_CATEGORIES[currentQuestion?.category]?.color,
            }}
            value={responses?.[currentQuestion?.id]}
            onChange={() => {}}
            onSubmit={handleAnswer}
            compact={compact}
            showCategory
            showPoints
            disabled={isSubmitting}
            autoSubmit={currentQuestion?.type === 'single'}
          />
          
          {/* Question navigation */}
          {nextQuestions.length > 1 && (
            <div className={styles.questionNav}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => setActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={activeQuestionIndex === 0}
              >
                Previous
              </button>
              <div className={styles.navDots}>
                {nextQuestions.slice(0, 5).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.navDot} ${idx === activeQuestionIndex ? styles.navDotActive : ''}`}
                    onClick={() => setActiveQuestionIndex(idx)}
                  />
                ))}
              </div>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => setActiveQuestionIndex(prev => Math.min(nextQuestions.length - 1, prev + 1))}
                disabled={activeQuestionIndex === nextQuestions.length - 1}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Persona Summary */}
      {answeredCount > 0 && (
        <div className={styles.personaSection}>
          <PersonaSummary
            drivingPersona={summary?.drivingPersona}
            knowledgeLevel={summary?.knowledgeLevel}
            interests={summary?.interests || []}
            answeredCount={answeredCount}
            completenessPercent={completeness}
            compact={compact}
          />
        </div>
      )}
      
      {/* Category Progress */}
      <div className={styles.categoriesSection}>
        <h4 className={styles.categoriesTitle}>Categories</h4>
        <div className={styles.categoriesList}>
          {sortedCategories.map(category => {
            const stats = categoryCompletion?.[category.id] || { answered: 0, total: category.targetCount || 8, percentage: 0 };
            
            return (
              <CategoryProgress
                key={category.id}
                category={category}
                answered={stats.answered}
                total={stats.total}
                color={category.color}
                expandable={false}
              />
            );
          })}
        </div>
      </div>
      
      {/* All Done Message */}
      {completeness === 100 && (
        <div className={styles.allDone}>
          <span className={styles.allDoneIcon}>🎉</span>
          <span className={styles.allDoneText}>
            Profile complete! AL now knows you well.
          </span>
        </div>
      )}
    </div>
  );
}
