'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './OnboardingPopup.module.css';

// Check icon for feature list
const CheckIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/**
 * ONBOARDING_VERSION - Increment this to reset page-specific onboarding for all users
 * 
 * When bumped, users will see onboarding again because their localStorage key
 * (e.g., "garage_onboarding_dismissed_v2") won't exist yet.
 * 
 * History:
 * - v1: Initial release
 * - v2: January 2026 app refresh - reset to communicate new features
 */
export const ONBOARDING_VERSION = 2;

/**
 * OnboardingPopup Component
 * 
 * A multi-step onboarding flow for introducing users to features.
 * Stores "don't show again" preference in localStorage with versioning.
 * 
 * @param {Object} props
 * @param {string} props.storageKey - Base key for localStorage (e.g., 'garage_onboarding_dismissed')
 *                                    Version suffix is added automatically (e.g., '_v2')
 * @param {Array} props.steps - Array of step objects with { icon, title, description }
 * @param {string} props.accentColor - Optional accent color for progress indicators
 */
export default function OnboardingPopup({ storageKey, steps, accentColor = 'var(--sn-accent)', isOpen: controlledIsOpen, onClose: controlledOnClose }) {
  // Add version suffix to storage key for easy future resets
  const versionedStorageKey = `${storageKey}_v${ONBOARDING_VERSION}`;
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState('next');
  const [isMounted, setIsMounted] = useState(false);
  
  // Portal mounting - required for SSR compatibility
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Determine if we are in controlled mode
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  // ============================================================
  // IMPORTANT: Define handleClose BEFORE any useEffect that
  // references it to avoid TDZ (Temporal Dead Zone) errors.
  // ============================================================
  const handleClose = useCallback((persistDismissal = false) => {
    // Only save to localStorage if user explicitly checked "Don't show this again"
    // This ensures onboarding shows every time until user opts out
    if (persistDismissal && versionedStorageKey && typeof localStorage !== 'undefined') {
      localStorage.setItem(versionedStorageKey, 'true');
    }
    
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
    
    // Reset step for next time (if they didn't opt out)
    setCurrentStep(0);
  }, [versionedStorageKey, isControlled, controlledOnClose]);

  // Check localStorage on mount (only for uncontrolled mode)
  useEffect(() => {
    if (isControlled) return;

    if (typeof window !== 'undefined') {
      // Allow reset via URL param
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('reset_onboarding') === 'true') {
        localStorage.removeItem(versionedStorageKey);
      }
      
      const dismissed = localStorage.getItem(versionedStorageKey);
      if (!dismissed) {
        // Small delay for smoother page load
        const timer = setTimeout(() => setInternalIsOpen(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [versionedStorageKey, isControlled]);

  // Handle escape key - closes without persisting (user can see onboarding again next visit)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose(false); // Don't persist - show again next time
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setSlideDirection('next');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(false);
      }, 200);
    } else {
      // On last step, persist dismissal only if checkbox is checked
      handleClose(dontShowAgain);
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
      handleClose(false); // Don't persist - show again next time
    }
  };

  // Don't render until mounted (SSR) or if not open/no steps
  if (!isMounted || !isOpen || !steps || steps.length === 0) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Use portal to render at document body level (above all other content)
  // This ensures the modal is not trapped inside any parent's stacking context
  const popupContent = (
    <div className={styles.overlay} onClick={handleBackdropClick} data-overlay-modal>
      <div className={styles.popup} role="dialog" aria-modal="true">
        {/* Close Button */}
        <button className={styles.closeBtn} onClick={() => handleClose(false)} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Progress Bar - teal for non-CTA indicator */}
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ 
              width: `${((currentStep + 1) / steps.length) * 100}%`,
              backgroundColor: '#10b981' 
            }} 
          />
        </div>

        {/* Step Content - Fixed height container */}
        <div className={`${styles.content} ${isAnimating ? (slideDirection === 'next' ? styles.slideOutLeft : styles.slideOutRight) : styles.slideIn}`}>
          {/* Icon - centered */}
          {step.icon && (
            <div className={styles.iconWrapper}>
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
                    <span className={styles.featureIcon} style={{ color: 'var(--color-accent-teal)' }}><CheckIcon size={16} /></span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className={styles.footer}>
          {/* Dot Navigation - teal for non-CTA indicator */}
          <div className={styles.dots}>
            {steps.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${index === currentStep ? styles.dotActive : ''}`}
                onClick={() => handleDotClick(index)}
                aria-label={`Go to step ${index + 1}`}
                style={index === currentStep ? { backgroundColor: 'var(--color-accent-teal)' } : {}}
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
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
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

  return createPortal(popupContent, document.body);
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
  clipboard: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
      <path d="M9 12h6"/>
      <path d="M9 16h6"/>
    </svg>
  ),
  package: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4l-9-5.19"/>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  tool: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  camera: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
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
  timer: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 9v4l2 2"/>
      <path d="M5 3L2 6"/>
      <path d="M22 6l-3-3"/>
      <path d="M12 5V2"/>
      <path d="M10 2h4"/>
    </svg>
  ),
  flag: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
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
 * 
 * Maps directly to the 6 Garage tabs: Specs → Build → Perf → Parts → Install → Photos
 * Each step introduces what the user can do in that section.
 * 
 * Flow:
 * 1. Welcome - The value prop
 * 2. Specs - Know your car inside out
 * 3. Build - Configure your upgrades
 * 4. Performance - See the impact
 * 5. Parts - Find and buy the right parts
 * 6. Install - DIY or find a shop
 * 7. Photos - Document and share your build
 */
export const garageOnboardingSteps = [
  {
    icon: OnboardingIcons.garage,
    title: 'Welcome to Your Garage',
    description: 'Your command center for building the car you\'ve always wanted. Research, plan, and track every modification—all in one place.',
    features: [
      'Vehicle-specific recommendations',
      'Track every mod from idea to install',
      'Share your build with the community',
    ],
  },
  {
    icon: OnboardingIcons.clipboard,
    title: 'Specs',
    description: 'Everything you need to know about your car. Factory specs, performance ratings, tuning potential, and maintenance schedules.',
    features: [
      'Full factory specifications',
      'Tuning profiles & power limits',
      'Service intervals & known issues',
    ],
  },
  {
    icon: OnboardingIcons.wrench,
    title: 'Build',
    description: 'Configure your perfect build. Select from curated upgrade categories and see exactly what\'s possible for your car.',
    features: [
      'Intake, exhaust, suspension & more',
      'Goal-based recommendations',
      'Auto-saves as you go',
    ],
  },
  {
    icon: OnboardingIcons.gauge,
    title: 'Performance',
    description: 'See exactly how your upgrades affect your car. HP gains, 0-60 times, braking, grip—plus comfort and reliability tradeoffs.',
    features: [
      'Real-time performance estimates',
      'Before vs. after comparisons',
      'Experience scores for daily driveability',
    ],
  },
  {
    icon: OnboardingIcons.package,
    title: 'Parts',
    description: 'Turn your build plan into a shopping list. Get AL-powered part recommendations with pricing and compatibility info.',
    features: [
      'Ask AL: "Which intake should I buy?"',
      'Track: planned → purchased',
      'Copy your full parts list to shop',
    ],
  },
  {
    icon: OnboardingIcons.tool,
    title: 'Install',
    description: 'Choose your path: DIY with tool lists and install videos, or find a trusted service center near you.',
    features: [
      'DIY: tools needed & how-to videos',
      'Shop finder: nearby service centers',
      'Track: purchased → installed',
    ],
  },
  {
    icon: OnboardingIcons.camera,
    title: 'Photos',
    description: 'Document your build journey. Upload photos, track your progress, and share your finished build with the community.',
    features: [
      'Upload unlimited build photos',
      'Create a visual timeline',
      'Share with the AutoRev community',
    ],
  },
];

/**
 * Data Page Onboarding Steps
 * 
 * Two main areas with virtual + real-world logging for each:
 * - DYNO: Virtual dyno estimates + Log your actual dyno results
 * - TRACK: Virtual lap time estimator + Log your actual track times
 * 
 * The feedback loop: Predictions → Actuals → Compare → Improve
 */
export const dataOnboardingSteps = [
  {
    icon: OnboardingIcons.chart,
    title: 'Welcome to My Data',
    description: 'Your performance data hub. Get estimates for what your mods should deliver, then log your actual results to compare predictions vs. reality.',
    features: [
      'Virtual estimates for dyno & track',
      'Log real results to compare',
      'Track your progress over time',
    ],
  },
  {
    icon: OnboardingIcons.gauge,
    title: 'Virtual Dyno',
    description: 'See estimated HP and torque curves based on your modifications. Stock vs. modified side-by-side, with interactive RPM exploration.',
    features: [
      'HP/TQ curves for your exact build',
      'Stock vs. modified comparison',
      'Models turbo spool & power delivery',
    ],
  },
  {
    icon: OnboardingIcons.save,
    title: 'Log Dyno Results',
    description: 'Been to the dyno? Log your actual numbers to compare against our estimates. Track your power progression over time.',
    features: [
      'Enter WHP & torque readings',
      'Compare actual vs. predicted',
      'Build your dyno history',
    ],
  },
  {
    icon: OnboardingIcons.timer,
    title: 'Lap Time Estimator',
    description: 'Estimate lap times at real tracks based on your build. Powered by 3,800+ real lap times across 340+ tracks.',
    features: [
      'Select from real tracks worldwide',
      'Adjust for driver skill level',
      'See how mods affect lap times',
    ],
  },
  {
    icon: OnboardingIcons.flag,
    title: 'Log Track Times',
    description: 'Hit the track? Log your actual lap times to compare against estimates. Track your personal bests and improvement over time.',
    features: [
      'Record lap times by track',
      'Compare actual vs. estimated',
      'Track PBs & improvement',
    ],
  },
];

/**
 * @deprecated Use dataOnboardingSteps instead
 * Kept for backwards compatibility
 */
export const tuningShopOnboardingSteps = dataOnboardingSteps;
