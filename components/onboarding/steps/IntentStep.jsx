'use client';

import styles from '../OnboardingFlow.module.css';

const INTENT_OPTIONS = [
  { 
    value: 'owner', 
    emoji: '🚗', 
    title: 'I own a sports car',
    description: 'Track maintenance, get recalls, and plan upgrades',
  },
  { 
    value: 'shopping', 
    emoji: '🔍', 
    title: "I'm shopping for one",
    description: 'Research, compare, and find your perfect match',
  },
  { 
    value: 'learning', 
    emoji: '📚', 
    title: 'Just exploring/learning',
    description: 'Browse specs, watch reviews, and learn about cars',
  },
];

// Checkmark icon for multi-select
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/**
 * IntentStep Component
 * Step 3: What brings you to AutoRev? (MULTI-SELECT)
 * 
 * Users can select MULTIPLE reasons. At least one required.
 */
export default function IntentStep({ className, formData, updateFormData }) {
  // Get current selections as array
  const selectedIntents = Array.isArray(formData.user_intents) ? formData.user_intents : [];
  
  // Toggle selection - add or remove from array
  const handleToggle = (value) => {
    let newIntents;
    if (selectedIntents.includes(value)) {
      // Remove if already selected
      newIntents = selectedIntents.filter(v => v !== value);
    } else {
      // Add if not selected
      newIntents = [...selectedIntents, value];
    }
    updateFormData({ user_intents: newIntents });
  };

  return (
    <div className={className}>
      <h2 className={styles.stepTitle}>What brings you here?</h2>
      <p className={styles.stepDescription}>
        This helps us personalize your experience.
      </p>
      
      <div className={styles.intentGrid}>
        {INTENT_OPTIONS.map((option) => {
          const isSelected = selectedIntents.includes(option.value);
          
          return (
            <button
              key={option.value}
              className={`${styles.intentCard} ${isSelected ? styles.selected : ''}`}
              onClick={() => handleToggle(option.value)}
              type="button"
              aria-pressed={isSelected}
            >
              <span className={styles.intentEmoji}>{option.emoji}</span>
              <div className={styles.intentContent}>
                <h3 className={styles.intentTitle}>{option.title}</h3>
                <p className={styles.intentDesc}>{option.description}</p>
              </div>
              <span className={styles.intentCheckbox}>
                <CheckIcon />
              </span>
            </button>
          );
        })}
      </div>
      
      <p className={styles.intentHint}>
        Select all that apply
      </p>
    </div>
  );
}
