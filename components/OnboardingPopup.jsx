'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './OnboardingPopup.module.css';

/**
 * OnboardingPopup Component
 * 
 * A multi-step onboarding flow for introducing users to features.
 * Stores "don't show again" preference in localStorage.
 * 
 * @param {Object} props
 * @param {string} props.storageKey - Unique key for localStorage (e.g., 'garage_onboarding_dismissed')
 * @param {Array} props.steps - Array of step objects with { icon, title, description }
 * @param {string} props.accentColor - Optional accent color for progress indicators
 */
export default function OnboardingPopup({ storageKey, steps, accentColor = 'var(--sn-accent)', isOpen: controlledIsOpen, onClose: controlledOnClose }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState('next');

  // Determine if we are in controlled mode
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  // Check localStorage on mount (only for uncontrolled mode)
  useEffect(() => {
    if (isControlled) return;

    if (typeof window !== 'undefined') {
      // Allow reset via URL param
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('reset_onboarding') === 'true') {
        localStorage.removeItem(storageKey);
      }
      
      const dismissed = localStorage.getItem(storageKey);
      if (!dismissed) {
        // Small delay for smoother page load
        const timer = setTimeout(() => setInternalIsOpen(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [storageKey, isControlled]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    // CF-004: Always save dismissed state on any close action (not just "don't show again")
    // This prevents the modal from persisting across navigation
    if (storageKey) {
      localStorage.setItem(storageKey, 'true');
    }
    
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  }, [storageKey, isControlled, controlledOnClose]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setSlideDirection('next');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setSlideDirection('prev');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleDotClick = (index) => {
    if (index === currentStep) return;
    setSlideDirection(index > currentStep ? 'next' : 'prev');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(index);
      setIsAnimating(false);
    }, 200);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen || !steps || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.popup} role="dialog" aria-modal="true">
        {/* Close Button */}
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Progress Bar */}
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ 
              width: `${((currentStep + 1) / steps.length) * 100}%`,
              backgroundColor: accentColor 
            }} 
          />
        </div>

        {/* Step Content - Fixed height container */}
        <div className={`${styles.content} ${isAnimating ? (slideDirection === 'next' ? styles.slideOutLeft : styles.slideOutRight) : styles.slideIn}`}>
          {/* Icon - centered */}
          {step.icon && (
            <div className={styles.iconWrapper} style={{ background: `linear-gradient(135deg, ${accentColor} 0%, var(--sn-primary) 100%)` }}>
              {step.icon}
            </div>
          )}

          {/* Title */}
          <h2 className={styles.title}>{step.title}</h2>

          {/* Description */}
          <p className={styles.description}>{step.description}</p>

          {/* Feature List (optional) - always reserve space */}
          <div className={styles.featureListContainer}>
            {step.features && step.features.length > 0 && (
              <ul className={styles.featureList}>
                {step.features.map((feature, i) => (
                  <li key={i} className={styles.featureItem}>
                    <span className={styles.featureIcon} style={{ color: accentColor }}>✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className={styles.footer}>
          {/* Dot Navigation */}
          <div className={styles.dots}>
            {steps.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${index === currentStep ? styles.dotActive : ''}`}
                onClick={() => handleDotClick(index)}
                aria-label={`Go to step ${index + 1}`}
                style={index === currentStep ? { backgroundColor: accentColor } : {}}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className={styles.navButtons}>
            {!isFirstStep && (
              <button className={styles.prevBtn} onClick={handlePrev}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
                Back
              </button>
            )}
            <button 
              className={styles.nextBtn} 
              onClick={handleNext}
              style={{ backgroundColor: accentColor }}
            >
              {isLastStep ? 'Get Started' : 'Next'}
              {!isLastStep && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              )}
            </button>
          </div>

          {/* Don't Show Again - small at bottom */}
          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <span className={styles.checkmark}>
              {dontShowAgain && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </span>
            <span className={styles.checkboxLabel}>Don't show this again</span>
          </label>
        </div>
      </div>
    </div>
  );
}

/**
 * Predefined Icons for Steps (24px for compact design)
 */
export const OnboardingIcons = {
  garage: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <path d="M9 22V12h6v10"/>
    </svg>
  ),
  car: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/>
      <path d="M9 17h6"/>
      <circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  heart: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  wrench: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  gauge: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  folder: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  sparkles: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/>
      <path d="M5 3v4M19 17v4M3 5h4M17 19h4"/>
    </svg>
  ),
  chart: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/>
      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
    </svg>
  ),
  shield: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  ),
  save: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
};

/**
 * Garage Page Onboarding Steps
 * Focus: How to use Collection and Favorites, with clear value differentiation
 */
export const garageOnboardingSteps = [
  {
    icon: OnboardingIcons.garage,
    title: 'Welcome to Your Garage',
    description: 'Your Garage has two sections: "My Collection" for vehicles you own, and "Favorites" for cars you\'re researching or dreaming about.',
  },
  {
    icon: OnboardingIcons.car,
    title: 'My Collection',
    description: 'Add cars you actually own to unlock premium owner features. Click "Add to Collection" on any car page.',
    features: [
      'VIN-specific safety recall alerts',
      'Personalized maintenance schedules',
      'Service history tracking',
      'Owner-only insights & recommendations',
    ],
  },
  {
    icon: OnboardingIcons.heart,
    title: 'Favorites',
    description: 'Click the ♥ heart icon on any car to save it for later. Perfect for researching your next purchase.',
    features: [
      'Save any car to your wishlist',
      'Compare specs side-by-side',
      'Track prices & market trends',
    ],
  },
  {
    icon: OnboardingIcons.sparkles,
    title: 'Why Add to Collection?',
    description: 'Collection unlocks features designed for actual owners—maintenance alerts, recall notifications, and insights tailored to your specific vehicle.',
  },
];

/**
 * Tuning Shop Onboarding Steps
 * Focus: Step-by-step process for using the tuning features
 */
export const tuningShopOnboardingSteps = [
  {
    icon: OnboardingIcons.wrench,
    title: 'Welcome to the Tuning Shop',
    description: 'Plan and visualize performance upgrades for any vehicle. Create build projects, compare setups, and see estimated power gains.',
  },
  {
    icon: OnboardingIcons.car,
    title: 'Step 1: Select a Car',
    description: 'Click the ⚙ gear "Tune" icon on any car across the site—or select one here—to open the Upgrade Center.',
    features: [
      'Click the gear icon on any car page',
      'Or select from your Collection/Favorites',
      'Browse our full car catalog here',
    ],
  },
  {
    icon: OnboardingIcons.gauge,
    title: 'Step 2: Build Your Setup',
    description: 'In the Upgrade Center, choose from preset packages or build custom. See real-time HP/torque gains and cost estimates.',
    features: [
      'Select upgrade packages or go custom',
      'View performance gains instantly',
      'Track total build cost as you go',
    ],
  },
  {
    icon: OnboardingIcons.save,
    title: 'Step 3: Save & Compare',
    description: 'Save your build as a Project. Create multiple projects per car, compare different setups, and revisit anytime.',
    features: [
      'Save unlimited build projects',
      'Compare projects side-by-side',
      'Update or delete projects anytime',
    ],
  },
];

