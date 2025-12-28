'use client';

import styles from './ReferralStep.module.css';
import sharedStyles from '../OnboardingFlow.module.css';

// Comprehensive referral options for precise marketing attribution
const REFERRAL_OPTIONS = [
  { 
    value: 'google', 
    label: 'Google',
    icon: (
      <svg viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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
    value: 'instagram', 
    label: 'Instagram',
    icon: (
      <svg viewBox="0 0 24 24">
        <defs>
          <radialGradient id="ig1" cx="30%" cy="107%" r="150%">
            <stop offset="0%" stopColor="#fdf497"/>
            <stop offset="5%" stopColor="#fdf497"/>
            <stop offset="45%" stopColor="#fd5949"/>
            <stop offset="60%" stopColor="#d6249f"/>
            <stop offset="90%" stopColor="#285AEB"/>
          </radialGradient>
        </defs>
        <rect fill="url(#ig1)" x="2" y="2" width="20" height="20" rx="5"/>
        <circle cx="12" cy="12" r="3.5" fill="none" stroke="#fff" strokeWidth="2"/>
        <circle cx="17.5" cy="6.5" r="1.25" fill="#fff"/>
      </svg>
    )
  },
  { 
    value: 'facebook', 
    label: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24">
        <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    )
  },
  { 
    value: 'tiktok', 
    label: 'TikTok',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    )
  },
  { 
    value: 'twitter', 
    label: 'X / Twitter',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
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
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    )
  },
  { 
    value: 'podcast', 
    label: 'Podcast',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    )
  },
  { 
    value: 'blog', 
    label: 'Blog / Article',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        <line x1="8" y1="7" x2="16" y2="7"/>
        <line x1="8" y1="11" x2="14" y2="11"/>
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
  { 
    value: 'other', 
    label: 'Other',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="1"/>
        <circle cx="19" cy="12" r="1"/>
        <circle cx="5" cy="12" r="1"/>
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
    // Clear "other" text if switching away from "other"
    if (value !== 'other' && formData.referral_source_other) {
      updateFormData({ referral_source_other: '' });
    }
  };

  const handleOtherChange = (e) => {
    updateFormData({ referral_source_other: e.target.value });
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
          </button>
        ))}
      </div>

      {/* Other text input - shown when "Other" is selected */}
      {formData.referral_source === 'other' && (
        <div className={styles.otherInputWrapper}>
          <input
            type="text"
            className={styles.otherInput}
            placeholder="Please specify where you found us..."
            value={formData.referral_source_other || ''}
            onChange={handleOtherChange}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
