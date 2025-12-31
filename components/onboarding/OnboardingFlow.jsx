'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './OnboardingFlow.module.css';
import WelcomeStep from './steps/WelcomeStep';
import ReferralStep from './steps/ReferralStep';
import IntentStep from './steps/IntentStep';
import FeatureSlide from './steps/FeatureSlide';
import FinalStep from './steps/FinalStep';


// Feature slides configuration - each becomes its own step
// Now supports multiple images per feature with auto-rotation
const FEATURE_SLIDES = [
  {
    id: 'browse',
    title: 'Browse & Research',
    description: 'Explore sports cars with detailed specs, buying guides, and expert insights.',
    images: [
      { src: '/images/onboarding/browse-cars-01-hero.png', alt: 'Car detail hero page' },
      { src: '/images/onboarding/browse-cars-02-overview.png', alt: 'Car overview with quick take' },
      { src: '/images/onboarding/browse-cars-03-buying-guide.png', alt: 'Buying guide with best years' },
    ],
  },
  {
    id: 'selector',
    title: 'Find Your Match',
    description: 'Tell us what matters most and get personalized car recommendations.',
    images: [
      { src: '/images/onboarding/car-selector-01-preferences.png', alt: 'Preference sliders' },
      { src: '/images/onboarding/car-selector-02-results.png', alt: 'Personalized recommendations' },
    ],
  },
  {
    id: 'garage',
    title: 'Your Garage',
    description: 'Track your cars, maintenance, recalls, and build progress all in one place.',
    images: [
      { src: '/images/onboarding/garage-01-hero.png', alt: 'Modified GT-R with performance stats' },
      { src: '/images/onboarding/garage-02-details.png', alt: 'Performance details and specs' },
      { src: '/images/onboarding/garage-03-reference.png', alt: 'VIN decoder and fluid specs' },
      { src: '/images/onboarding/garage-04-safety.png', alt: 'Recalls and safety info' },
      { src: '/images/onboarding/garage-05-health.png', alt: 'Maintenance tracking' },
    ],
  },
  {
    id: 'tuning',
    title: 'Tuning Shop',
    description: 'Plan your build with upgrade guides, compatibility checks, and performance estimates.',
    images: [
      { src: '/images/onboarding/tuning-shop-01-overview.png', alt: 'Tunability score overview' },
      { src: '/images/onboarding/tuning-shop-02-config-wheels.png', alt: 'Wheels and tires config' },
      { src: '/images/onboarding/tuning-shop-03-presets.png', alt: 'Build presets' },
      { src: '/images/onboarding/tuning-shop-04-power-list.png', alt: 'Power upgrades list' },
      { src: '/images/onboarding/tuning-shop-05-part-detail.png', alt: 'Part details' },
      { src: '/images/onboarding/tuning-shop-06-metrics.png', alt: 'Performance metrics' },
    ],
  },
  {
    id: 'community',
    title: 'Community',
    description: 'Discover car events, meets, and shows happening near you.',
    images: [
      { src: '/images/onboarding/community-01-events-list.png', alt: 'Events list' },
      { src: '/images/onboarding/community-02-event-detail.png', alt: 'Event details' },
    ],
  },
  {
    id: 'al',
    title: 'Ask AL',
    description: 'Get instant answers from our AI assistant trained on real car data.',
    images: [
      { src: '/images/onboarding/ai-al-01-intro.png', alt: 'AL introduction' },
      { src: '/images/onboarding/ai-al-03-thinking.png', alt: 'AL thinking' },
      { src: '/images/onboarding/ai-al-04-response-mods.png', alt: 'AL modification response' },
      { src: '/images/onboarding/ai-al-05-response-analysis.png', alt: 'AL analysis response' },
    ],
  },
];

// Calculate total steps: Welcome + Referral + Intent + Feature slides + Final
const TOTAL_STEPS = 3 + FEATURE_SLIDES.length + 1;

// Step labels for progress bar (simplified grouping)
const STEP_LABELS = ['Welcome', 'Source', 'Goals', 'Features', 'Finish'];

// Map step number to label index for progress display
const getProgressLabelIndex = (step) => {
  if (step === 1) return 0; // Welcome
  if (step === 2) return 1; // Source/Referral
  if (step === 3) return 2; // Goals/Intent
  if (step >= 4 && step < TOTAL_STEPS) return 3; // Features
  return 4; // Finish
};

/**
 * OnboardingFlow Component
 * 
 * Multi-step onboarding modal for first-time users.
 * Collects referral source, user intent (multi-select), and shows features.
 * 
 * Redesigned with:
 * - Single unified progress bar
 * - Individual feature slides (no carousel)
 * - Full-screen mobile layout
 */
export default function OnboardingFlow({ 
  isOpen, 
  onClose, 
  onComplete,
  user,
  profile,
  initialStep = 1,
  initialData = {}
}) {
  const router = useRouter();
  const [step, setStep] = useState(initialStep);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState('next');
  const [isSaving, setIsSaving] = useState(false);
  
  // Form data - note: user_intents is now an array for multi-select
  const [formData, setFormData] = useState({
    referral_source: initialData.referral_source || null,
    referral_source_other: initialData.referral_source_other || '',
    user_intents: initialData.user_intents || initialData.user_intent 
      ? (Array.isArray(initialData.user_intents) ? initialData.user_intents : [initialData.user_intent])
      : [],
  });

  // Get user's display name
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || null;

  // Calculate progress percentage
  const progressPercent = ((step - 1) / (TOTAL_STEPS - 1)) * 100;
  
  // Get current progress label index
  const currentLabelIndex = getProgressLabelIndex(step);

  // Save progress to database
  const saveProgress = useCallback(async (data, completed = false) => {
    if (!user?.id) {
      console.warn('[Onboarding] No user ID, skipping save');
      return { success: false, error: 'No user ID' };
    }
    
    try {
      const endpoint = `/api/users/${user.id}/onboarding`;
      const method = completed ? 'POST' : 'PATCH';
      
      // Convert user_intents array to legacy user_intent for API compatibility
      const legacyData = {
        ...data,
        user_intent: data.user_intents?.[0] || null,
      };
      
      const payload = completed 
        ? { ...legacyData }
        : { step, ...legacyData };
      
      console.log(`[Onboarding] Saving progress via ${method}:`, { completed, userId: user.id.slice(0, 8) });
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Onboarding] Failed to save progress:', response.status, errorText);
        return { success: false, error: errorText };
      }
      
      const result = await response.json();
      console.log('[Onboarding] Progress saved:', completed ? 'completed' : `step ${step}`, result);
      return { success: true, data: result };
    } catch (err) {
      console.error('[Onboarding] Error saving progress:', err);
      return { success: false, error: err.message };
    }
  }, [user?.id, step]);

  // Handle dismissal (save progress for resume)
  const handleDismiss = useCallback(() => {
    saveProgress(formData);
    onClose?.();
  }, [formData, saveProgress, onClose]);

  // Handle escape key (disabled on required steps: Welcome, Referral, Intent)
  const isRequiredStep = step === 1 || step === 2 || step === 3;
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isRequiredStep) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isRequiredStep, handleDismiss]);

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

  // Handle form data updates
  const updateFormData = useCallback((updates) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      // Save progress when significant data changes
      if (updates.referral_source !== undefined || updates.user_intents !== undefined) {
        saveProgress(newData);
      }
      return newData;
    });
  }, [saveProgress]);

  // Navigate to next step
  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS) {
      setSlideDirection('next');
      setIsAnimating(true);
      setTimeout(() => {
        setStep(step + 1);
        setIsAnimating(false);
        saveProgress(formData);
      }, 200);
    }
  }, [step, formData, saveProgress]);

  // Navigate to previous step
  const handleBack = useCallback(() => {
    if (step > 1) {
      setSlideDirection('prev');
      setIsAnimating(true);
      setTimeout(() => {
        setStep(step - 1);
        setIsAnimating(false);
      }, 200);
    }
  }, [step]);

  // Handle backdrop click (disabled on required steps: Welcome, Referral, Intent)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isRequiredStep) {
      handleDismiss();
    }
  };

  // Handle completion - saves progress, FinalStep handles navigation
  const handleComplete = useCallback(async () => {
    setIsSaving(true);
    
    try {
      const result = await saveProgress(formData, true);
      
      if (!result.success) {
        console.error('[Onboarding] Failed to complete onboarding:', result.error);
      }
      
      console.log('[Onboarding] Completed. saveSuccess:', result.success);
      onComplete?.(formData);
      
    } catch (err) {
      console.error('[Onboarding] Error completing:', err);
    } finally {
      setIsSaving(false);
    }
  }, [formData, saveProgress, onComplete]);

  // Check if current step can proceed
  const canProceed = useCallback(() => {
    switch (step) {
      case 1: // Welcome
        return true;
      case 2: // Referral
        if (formData.referral_source === 'other') {
          return formData.referral_source_other?.trim().length > 0;
        }
        return formData.referral_source !== null;
      case 3: // Intent (multi-select - at least one required)
        return formData.user_intents && formData.user_intents.length > 0;
      default: // Feature slides and Final
        return true;
    }
  }, [step, formData]);

  if (!isOpen) return null;

  // Render current step content
  const renderStep = () => {
    const animationClass = isAnimating 
      ? (slideDirection === 'next' ? styles.slideOutLeft : styles.slideOutRight)
      : styles.slideIn;
    
    const stepProps = {
      className: animationClass,
      formData,
      updateFormData,
      onNext: handleNext,
    };

    // Step 1: Welcome
    if (step === 1) {
      return <WelcomeStep {...stepProps} displayName={displayName} />;
    }
    
    // Step 2: Referral
    if (step === 2) {
      return <ReferralStep {...stepProps} />;
    }
    
    // Step 3: Intent
    if (step === 3) {
      return <IntentStep {...stepProps} />;
    }
    
    // Steps 4 through (TOTAL_STEPS - 1): Feature slides
    const featureIndex = step - 4;
    if (featureIndex >= 0 && featureIndex < FEATURE_SLIDES.length) {
      const feature = FEATURE_SLIDES[featureIndex];
      return (
        <FeatureSlide
          className={animationClass}
          title={feature.title}
          description={feature.description}
          images={feature.images}
        />
      );
    }
    
    // Final step - action buttons handle navigation
    if (step === TOTAL_STEPS) {
      return (
        <FinalStep 
          className={animationClass}
          onComplete={handleComplete}
        />
      );
    }
    
    return null;
  };

  // Get button text based on step
  const getNextButtonText = () => {
    if (step === 1) return "Let's Get Started";
    if (step === TOTAL_STEPS) return isSaving ? 'Finishing...' : "Let's Go!";
    return 'Continue';
  };

  // Check if we're on the final step
  const isFinalStep = step === TOTAL_STEPS;

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Welcome to AutoRev">
        {/* Unified Progress Bar */}
        <div className={styles.progressBarContainer}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill} 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className={styles.progressSteps}>
            {STEP_LABELS.map((label, i) => (
              <span 
                key={i}
                className={`${styles.progressStep} ${i === currentLabelIndex ? styles.active : ''} ${i < currentLabelIndex ? styles.completed : ''}`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className={styles.stepContainer}>
          {renderStep()}
        </div>

        {/* Footer Navigation - hidden on final step (action buttons handle it) */}
        {!isFinalStep && (
          <div className={styles.footer}>
            <div className={styles.navButtons}>
              {step > 1 && (
                <button className={styles.backBtn} onClick={handleBack}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  Back
                </button>
              )}
              {/* Skip button - only shown on non-required steps (feature slides) */}
              {!isRequiredStep && !isFinalStep && (
                <button className={styles.skipBtn} onClick={handleDismiss}>
                  Skip for now
                </button>
              )}
              <button 
                className={styles.nextBtn} 
                onClick={handleNext}
                disabled={!canProceed() || isSaving}
              >
                {getNextButtonText()}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
