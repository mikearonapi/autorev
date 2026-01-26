'use client';

/**
 * QuestionnairePrompt Component
 * 
 * Prompt card shown on Dashboard when profile is incomplete.
 * Links to full-page immersive questionnaire experience.
 */

import Link from 'next/link';

import styles from './QuestionnairePrompt.module.css';

export default function QuestionnairePrompt({
  completeness = 0,
  onDismiss,
  compact = false,
}) {
  // Don't show if profile is mostly complete
  if (completeness >= 75) {
    return null;
  }
  
  return (
    <div className={`${styles.card} ${compact ? styles.compact : ''}`}>
      {/* Dismiss button */}
      {onDismiss && (
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <svg 
            className={styles.iconSvg}
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <div className={styles.textContent}>
          <h4 className={styles.title}>Tell us about you</h4>
          <p className={styles.description}>
            Help AL give you personalized recommendations
          </p>
        </div>
      </div>
      
      {/* Progress indicator */}
      <div className={styles.progressSection}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${completeness}%` }} 
          />
        </div>
        <span className={styles.progressText}>
          {completeness}% complete
        </span>
      </div>
      
      {/* Action */}
      <Link href="/questionnaire" className={styles.fullBtn}>
        Answer some questions
      </Link>
      
      {/* Benefits hint */}
      <div className={styles.benefits}>
        <svg 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          className={styles.benefitIconSvg}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span className={styles.benefitText}>
          Earn <strong>10 points</strong> per question
        </span>
      </div>
    </div>
  );
}
