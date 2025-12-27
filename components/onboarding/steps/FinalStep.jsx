'use client';

import styles from '../OnboardingFlow.module.css';

// Checkmark icon for checkbox
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// CTA configurations based on intent
const CTA_CONFIG = {
  owner: {
    emoji: '🚗',
    title: 'Add Your First Car',
    description: 'Track maintenance, get recalls, and more',
  },
  shopping: {
    emoji: '🎯',
    title: 'Find Your Perfect Match',
    description: 'Answer a few questions to get personalized recommendations',
  },
  learning: {
    emoji: '🔍',
    title: 'Explore 98 Sports Cars',
    description: 'Browse specs, reviews, and community insights',
  },
};

/**
 * FinalStep Component
 * Step 5: Email preferences and contextual CTA
 */
export default function FinalStep({ 
  className, 
  formData, 
  updateFormData, 
  userIntent,
  isSaving,
}) {
  const ctaConfig = CTA_CONFIG[userIntent] || CTA_CONFIG.learning;

  const handleEmailToggle = (field) => {
    updateFormData({ [field]: !formData[field] });
  };

  return (
    <div className={className}>
      <h2 className={styles.stepTitle}>Stay in the loop</h2>
      <p className={styles.stepDescription}>
        Optional: Get notified about features and events you care about.
      </p>
      
      <div className={styles.emailPrefs}>
        <label className={styles.emailCheckbox}>
          <input
            type="checkbox"
            checked={formData.email_opt_in_features}
            onChange={() => handleEmailToggle('email_opt_in_features')}
          />
          <span className={styles.checkmark}>
            <span className={styles.checkmarkIcon}>
              <CheckIcon />
            </span>
          </span>
          <span className={styles.emailLabel}>
            Email me about new features and updates
          </span>
        </label>
        
        <label className={styles.emailCheckbox}>
          <input
            type="checkbox"
            checked={formData.email_opt_in_events}
            onChange={() => handleEmailToggle('email_opt_in_events')}
          />
          <span className={styles.checkmark}>
            <span className={styles.checkmarkIcon}>
              <CheckIcon />
            </span>
          </span>
          <span className={styles.emailLabel}>
            Notify me about car events near me
          </span>
        </label>
      </div>
      
      <div className={styles.ctaSection}>
        <div className={styles.ctaIcon}>{ctaConfig.emoji}</div>
        <h3 className={styles.ctaTitle}>{ctaConfig.title}</h3>
        <p className={styles.ctaDesc}>{ctaConfig.description}</p>
      </div>
    </div>
  );
}

