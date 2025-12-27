'use client';

import styles from './ReferralStep.module.css';
import sharedStyles from '../OnboardingFlow.module.css';

// Simplified, focused referral options for an automotive enthusiast site
const REFERRAL_OPTIONS = [
  { 
    value: 'search', 
    label: 'Search Engine',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    )
  },
  { 
    value: 'youtube', 
    label: 'YouTube',
    icon: (
      <svg viewBox="0 0 24 24">
        <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    )
  },
  { 
    value: 'social', 
    label: 'Social Media',
    sublabel: 'Instagram, Facebook, TikTok',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="4"/>
        <circle cx="18" cy="6" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    )
  },
  { 
    value: 'reddit', 
    label: 'Reddit',
    icon: (
      <svg viewBox="0 0 24 24">
        <circle fill="#FF4500" cx="12" cy="12" r="12"/>
        <path fill="#FFF" d="M20 12.25c0-.9-.7-1.63-1.57-1.63-.42 0-.8.17-1.08.44-1.07-.76-2.54-1.25-4.18-1.32l.72-3.37 2.33.5c.02.63.54 1.13 1.18 1.13.65 0 1.18-.53 1.18-1.2s-.53-1.18-1.18-1.18c-.47 0-.87.27-1.06.67l-2.6-.56c-.14-.03-.28.06-.3.2l-.8 3.78c-1.65.06-3.13.55-4.2 1.32-.28-.28-.67-.45-1.1-.45C4.72 10.62 4 11.35 4 12.25c0 .6.32 1.13.8 1.42-.02.13-.04.27-.04.4 0 2.08 2.42 3.77 5.4 3.77s5.42-1.7 5.42-3.78c0-.13-.02-.27-.04-.4.5-.3.82-.82.82-1.42zm-11.38.95c0-.64.52-1.17 1.17-1.17s1.17.53 1.17 1.17-.52 1.17-1.17 1.17-1.17-.53-1.17-1.17zm6.55 2.85c-.8.8-2.33.87-3.17.87-.85 0-2.38-.07-3.18-.87-.12-.12-.12-.32 0-.44.13-.13.32-.13.45 0 .5.5 1.57.68 2.73.68s2.22-.18 2.72-.68c.13-.13.33-.13.45 0 .13.12.13.32 0 .44zm-.24-1.68c-.65 0-1.17-.53-1.17-1.17s.52-1.17 1.17-1.17 1.17.53 1.17 1.17-.52 1.17-1.17 1.17z"/>
      </svg>
    )
  },
  { 
    value: 'forum', 
    label: 'Car Forum',
    sublabel: 'Rennlist, Bimmerpost, etc.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    )
  },
  { 
    value: 'friend', 
    label: 'Friend / Referral',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )
  },
];

/**
 * ReferralStep - How did you hear about us?
 * Purpose: Marketing attribution for growth tracking
 */
export default function ReferralStep({ className, formData, updateFormData }) {
  const handleSelect = (value) => {
    updateFormData({ referral_source: value });
  };

  return (
    <div className={className}>
      <h2 className={sharedStyles.stepTitle}>How did you find us?</h2>
      <p className={sharedStyles.stepDescription}>
        Help us understand where car enthusiasts discover AutoRev.
      </p>
      
      <div className={styles.optionGrid}>
        {REFERRAL_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`${styles.optionCard} ${formData.referral_source === option.value ? styles.selected : ''}`}
            onClick={() => handleSelect(option.value)}
            type="button"
          >
            <span className={styles.optionIcon}>{option.icon}</span>
            <span className={styles.optionLabel}>{option.label}</span>
            {option.sublabel && (
              <span className={styles.optionSublabel}>{option.sublabel}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
