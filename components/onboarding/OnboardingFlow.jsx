'use client';

import { useState, useEffect, useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { createPortal } from 'react-dom';

import { useAnalytics, ANALYTICS_EVENTS } from '@/hooks/useAnalytics';
import { useSafeAreaColor, SAFE_AREA_COLORS } from '@/hooks/useSafeAreaColor';
import { ONBOARDING_IMAGES } from '@/lib/images';

import styles from './OnboardingFlow.module.css';
import BrandsStep from './steps/BrandsStep';
import FeatureSlide from './steps/FeatureSlide';
import FinalStep from './steps/FinalStep';
import NameStep from './steps/NameStep';
import ReferralStep from './steps/ReferralStep';
import WelcomeStep from './steps/WelcomeStep';



// Feature slides configuration - each becomes its own step
// Now supports multiple images per feature with auto-rotation
// Images served from Vercel Blob CDN for optimal performance
// Personalized titles/descriptions based on user's name
const getFeatureSlides = (firstName) => [
  {
    id: 'garage',
    title: firstName ? `${firstName}'s Garage` : 'Your Garage',
    description: 'Your cars, specs, and build progress.',
    images: [
      { src: ONBOARDING_IMAGES.garageCard, alt: 'Garage landing with your car' },
      { src: ONBOARDING_IMAGES.garageSpecs, alt: 'Detailed vehicle specs' },
      { src: ONBOARDING_IMAGES.tuningShopOverview, alt: 'Build & upgrade categories' },
      { src: ONBOARDING_IMAGES.dataPerformanceMetrics, alt: 'Performance overview' },
      { src: ONBOARDING_IMAGES.garagePhotos, alt: 'Your photo gallery' },
    ],
  },
  {
    id: 'data',
    title: 'Your Data',
    description: 'Track power gains and lap time estimates.',
    images: [
      { src: ONBOARDING_IMAGES.dataVirtualDyno, alt: 'Virtual dyno power curves' },
      { src: ONBOARDING_IMAGES.dataPowerBreakdown, alt: 'Power breakdown by mod' },
      { src: ONBOARDING_IMAGES.dataLapTimeEstimator, alt: 'Track lap time estimates' },
    ],
  },
  {
    id: 'community',
    title: 'The Community',
    description: 'Real builds and insights from enthusiasts.',
    images: [
      { src: ONBOARDING_IMAGES.communityFeed, alt: 'Community builds feed' },
      { src: ONBOARDING_IMAGES.communityBuildEvoX, alt: 'Build details & stats' },
      { src: ONBOARDING_IMAGES.communityBuildMods, alt: 'Modification breakdown' },
    ],
  },
  {
    id: 'al',
    title: firstName ? `${firstName}, Meet AL` : 'Meet AL',
    description: 'Your AI car expert — ask anything.',
    images: [
      { src: ONBOARDING_IMAGES.alChatHome, alt: 'AL ready to help' },
      { src: ONBOARDING_IMAGES.alChatResponse, alt: 'Detailed recommendations' },
      { src: ONBOARDING_IMAGES.alChatThinking, alt: 'AL researching your question' },
    ],
  },
];

// Static reference for step counting (doesn't need personalization)
const FEATURE_SLIDES_COUNT = 4;

// Calculate total steps: Welcome + Name + Referral + Brands + Feature slides + Final
// Flow: 1 + 1 + 1 + 1 + 4 + 1 = 9 total steps
const TOTAL_STEPS = 4 + FEATURE_SLIDES_COUNT + 1;

// Step labels for progress bar
// Maps to: Welcome (1), You (2), Source (3), Explore (4-8), Go (9)
const STEP_LABELS = ['Welcome', 'You', 'Source', 'Explore', 'Go'];

// Map step number to label index for progress display
const getProgressLabelIndex = (step) => {
  if (step === 1) return 0; // Welcome
  if (step === 2) return 1; // Name (You)
  if (step === 3) return 2; // Referral (Source)
  if (step >= 4 && step < TOTAL_STEPS) return 3; // Brands + Features (Explore)
  return 4; // Final (Go)
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
  // Set safe area color to match overlay background when modal is open
  // Both top and bottom should be charcoal to match onboarding background
  useSafeAreaColor(SAFE_AREA_COLORS.OVERLAY, { 
    enabled: isOpen,
    bottom: SAFE_AREA_COLORS.OVERLAY 
  });
  
  const router = useRouter();
  const { trackEvent, trackOnboardingStep } = useAnalytics();
  const [step, setStep] = useState(initialStep);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState('next');
  const [isSaving, setIsSaving] = useState(false);
  
  // Track if component is mounted (for portal - SSR compatibility)
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  // Form data - pre-populated from user's existing profile data
  // Users who already provided referral_source will see it pre-selected
  const [formData, setFormData] = useState({
    referral_source: initialData.referral_source || null,
    display_name: initialData.display_name || profile?.display_name || '',
  });

  // Get user's display name and extract first name for personalization
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || null;
  
  // Use the name from onboarding form (what they want to be called) or fall back to profile
  const userDisplayName = formData.display_name || displayName;
  const firstName = userDisplayName?.split(' ')[0] || null;

  // Calculate progress percentage
  const progressPercent = ((step - 1) / (TOTAL_STEPS - 1)) * 100;
  
  // Get current progress label index
  const currentLabelIndex = getProgressLabelIndex(step);

  // Handle escape key (disabled on required steps: Welcome, Name, Referral)
  const isRequiredStep = step <= 3;

  // =========================================================================
  // CALLBACKS - All useCallback hooks MUST be declared before any useEffect
  // that references them to avoid TDZ (Temporal Dead Zone) errors.
  // =========================================================================

  // Save progress to database
  const saveProgress = useCallback(async (data, completed = false) => {
    if (!user?.id) {
      console.warn('[Onboarding] No user ID, skipping save');
      return { success: false, error: 'No user ID' };
    }
    
    try {
      const endpoint = `/api/users/${user.id}/onboarding`;
      const method = completed ? 'POST' : 'PATCH';
      
      // Prepare data for API
      const legacyData = {
        ...data,
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
    // Track skip event
    trackEvent(ANALYTICS_EVENTS.ONBOARDING_SKIPPED, {
      skipped_at_step: step,
      referral_source: formData.referral_source
    });
    saveProgress(formData);
    onClose?.();
  }, [formData, saveProgress, onClose, step, trackEvent]);

  // Handle form data updates
  const updateFormData = useCallback((updates) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      return newData;
    });
  }, []);

  // =========================================================================
  // EFFECTS - All useEffect hooks come AFTER callbacks to avoid TDZ errors.
  // =========================================================================
  
  // Track onboarding started
  useEffect(() => {
    if (isOpen && step === 1) {
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_STARTED);
    }
  }, [isOpen, step, trackEvent]);

  // Handle escape key
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

  // Prevent body scroll and hide other fixed elements when open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('onboarding-active');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('onboarding-active');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('onboarding-active');
    };
  }, [isOpen]);

  // Navigate to next step
  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS) {
      setSlideDirection('next');
      setIsAnimating(true);
      setTimeout(() => {
        const newStep = step + 1;
        setStep(newStep);
        setIsAnimating(false);
        saveProgress(formData);
        
        // Track step progression
        const featureIds = getFeatureSlides(null).map(f => f.id);
        const stepNames = ['welcome', 'name', 'referral', 'brands', ...featureIds, 'final'];
        trackOnboardingStep(newStep, stepNames[newStep - 1] || `step_${newStep}`);
      }, 200);
    }
  }, [step, formData, saveProgress, trackOnboardingStep]);

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
      
      // Track onboarding completion
      trackEvent(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, {
        referral_source: formData.referral_source,
        has_display_name: !!formData.display_name,
        steps_viewed: TOTAL_STEPS
      });
      
      console.log('[Onboarding] Completed. saveSuccess:', result.success);
      onComplete?.(formData);
      
    } catch (err) {
      console.error('[Onboarding] Error completing:', err);
    } finally {
      setIsSaving(false);
    }
  }, [formData, saveProgress, onComplete, trackEvent]);

  // Check if current step can proceed
  const canProceed = useCallback(() => {
    switch (step) {
      case 1: // Welcome
        return true;
      case 2: // Name - optional but encouraged
        return true; // Allow proceeding even without a name
      case 3: // Referral - REQUIRED
        return !!formData.referral_source;
      default: // Brands, Feature slides, and Final
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

    // Step 1: Welcome (REQUIRED)
    if (step === 1) {
      return <WelcomeStep {...stepProps} />;
    }
    
    // Step 2: Name - What should we call you? (REQUIRED)
    if (step === 2) {
      return <NameStep {...stepProps} />;
    }
    
    // Step 3: Referral - How did you hear about us? (REQUIRED)
    if (step === 3) {
      return <ReferralStep {...stepProps} />;
    }
    
    // Step 4: Brands showcase (skippable)
    if (step === 4) {
      return <BrandsStep className={animationClass} firstName={firstName} />;
    }
    
    // Steps 5 through 8: Feature slides (skippable)
    const featureIndex = step - 5;
    const featureSlides = getFeatureSlides(firstName);
    if (featureIndex >= 0 && featureIndex < featureSlides.length) {
      const feature = featureSlides[featureIndex];
      return (
        <FeatureSlide
          className={animationClass}
          title={feature.title}
          description={feature.description}
          images={feature.images}
        />
      );
    }
    
    // Final step (9) - action buttons handle navigation
    if (step === TOTAL_STEPS) {
      return (
        <FinalStep 
          className={animationClass}
          firstName={firstName}
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

  // The modal content
  const modalContent = (
    <div className={styles.overlay} onClick={handleBackdropClick} data-overlay-modal data-onboarding-overlay>
      {/* Safe area fills - actual DOM elements for reliable cross-browser coverage */}
      <div className={styles.safeAreaTop} aria-hidden="true" />
      <div className={styles.safeAreaBottom} aria-hidden="true" />
      
      <div className={`${styles.modal} ${isFinalStep ? styles.finalStepModal : ''}`} role="dialog" aria-modal="true" aria-label="Welcome to AutoRev">
        {/* Unified Progress Bar - Hidden on final step */}
        {!isFinalStep && (
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
        )}

        {/* Step Content */}
        <div className={`${styles.stepContainer} ${isFinalStep ? styles.finalStepContainer : ''}`}>
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
            {/* Skip link - only shown on non-required steps */}
            {!isRequiredStep && (
              <button className={styles.skipLink} onClick={handleDismiss}>
                Skip for now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Use portal to render at document body level (above all other content)
  // This ensures the modal is not trapped inside any parent's stacking context
  if (!isMounted) return null;
  return createPortal(modalContent, document.body);
}
