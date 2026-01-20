'use client';

import styles from './IntentStep.module.css';

const INTENT_OPTIONS = [
  { 
    value: 'owner', 
    emoji: '🏎️', 
    title: 'I own a sports car',
    description: 'Track mods, log dyno runs, plan your next build',
  },
  { 
    value: 'shopping', 
    emoji: '🎯', 
    title: "I'm shopping for one",
    description: 'Compare specs, find your perfect match',
  },
  { 
    value: 'learning', 
    emoji: '🔥', 
    title: 'Just here to explore',
    description: 'Browse the database, learn about cars',
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
 * Step 2: What brings you to AutoRev? (MULTI-SELECT)
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
    <div className={`${className || ''} ${styles.container}`}>
      <h2 className={styles.title}>What brings you here?</h2>
      <p className={styles.subtitle}>
        This helps us personalize your experience.
      </p>
      
      <div className={styles.optionGrid}>
        {INTENT_OPTIONS.map((option, index) => {
          const isSelected = selectedIntents.includes(option.value);
          
          return (
            <button
              key={option.value}
              className={`${styles.optionCard} ${isSelected ? styles.selected : ''}`}
              onClick={() => handleToggle(option.value)}
              type="button"
              aria-pressed={isSelected}
              style={{ animationDelay: `${0.1 + index * 0.05}s` }}
            >
              <span className={styles.emoji}>{option.emoji}</span>
              <div className={styles.content}>
                <h3 className={styles.optionTitle}>{option.title}</h3>
                <p className={styles.optionDesc}>{option.description}</p>
              </div>
              <span className={styles.checkbox}>
                <CheckIcon />
              </span>
            </button>
          );
        })}
      </div>
      
      <p className={styles.hint}>
        Select all that apply
      </p>
    </div>
  );
}
