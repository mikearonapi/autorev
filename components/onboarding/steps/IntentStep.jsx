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

/**
 * IntentStep Component
 * Step 3: What brings you to AutoRev?
 */
export default function IntentStep({ className, formData, updateFormData }) {
  const handleSelect = (value) => {
    updateFormData({ user_intent: value });
  };

  return (
    <div className={className}>
      <h2 className={styles.stepTitle}>What brings you here?</h2>
      <p className={styles.stepDescription}>
        This helps us personalize your experience.
      </p>
      
      <div className={styles.intentGrid}>
        {INTENT_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`${styles.intentCard} ${formData.user_intent === option.value ? styles.selected : ''}`}
            onClick={() => handleSelect(option.value)}
            type="button"
          >
            <span className={styles.intentEmoji}>{option.emoji}</span>
            <div className={styles.intentContent}>
              <h3 className={styles.intentTitle}>{option.title}</h3>
              <p className={styles.intentDesc}>{option.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

