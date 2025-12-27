'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './OnboardingFlow.module.css';
import WelcomeStep from './steps/WelcomeStep';
import ReferralStep from './steps/ReferralStep';
import IntentStep from './steps/IntentStep';
import FeatureTourStep from './steps/FeatureTourStep';
import FinalStep from './steps/FinalStep';

const TOTAL_STEPS = 5; // Welcome, Referral, Intent, FeatureTour, Final

/**
 * OnboardingFlow Component
 * 
 * Multi-step onboarding modal for first-time users.
 * Collects referral source, user intent, and email preferences.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.onClose - Called when modal is dismissed
 * @param {Function} props.onComplete - Called when onboarding is completed
 * @param {Object} props.user - Current user object
 * @param {Object} props.profile - Current user profile
 * @param {number} props.initialStep - Step to start from (for resume)
 * @param {Object} props.initialData - Partial data for resume
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
  
  const [formData, setFormData] = useState({
    referral_source: initialData.referral_source || null,
    referral_source_other: initialData.referral_source_other || '',
    user_intent: initialData.user_intent || null,
    email_opt_in_features: initialData.email_opt_in_features || false,
    email_opt_in_events: initialData.email_opt_in_events || false,
  });

  // Get user's display name
  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || null;

  // Handle escape key
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

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

  // Save progress to database
  const saveProgress = useCallback(async (data, completed = false) => {
    if (!user?.id) return;
    
    try {
      const endpoint = `/api/users/${user.id}/onboarding`;
      const method = completed ? 'POST' : 'PATCH';
      
      const payload = completed 
        ? { ...data }
        : { step, ...data };
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        console.error('[Onboarding] Failed to save progress:', await response.text());
      } else {
        console.log('[Onboarding] Progress saved:', completed ? 'completed' : `step ${step}`);
      }
    } catch (err) {
      console.error('[Onboarding] Error saving progress:', err);
    }
  }, [user?.id, step]);

  // Handle form data updates
  const updateFormData = useCallback((updates) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };
      // Save progress when significant data changes
      if (updates.referral_source !== undefined || updates.user_intent !== undefined) {
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
        // Save step progress
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

  // Handle dismissal (save progress for resume)
  const handleDismiss = useCallback(() => {
    saveProgress(formData);
    onClose?.();
  }, [formData, saveProgress, onClose]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleDismiss();
    }
  };

  // Handle completion
  const handleComplete = useCallback(async () => {
    setIsSaving(true);
    
    try {
      // Save completion to database
      await saveProgress(formData, true);
      
      // Determine destination based on user intent
      let destination = '/browse-cars';
      if (formData.user_intent === 'owner') {
        destination = '/garage?add=true';
      } else if (formData.user_intent === 'shopping') {
        destination = '/car-selector';
      } else if (formData.user_intent === 'learning') {
        destination = '/browse-cars';
      }
      
      console.log('[Onboarding] Completed. Routing to:', destination);
      
      // Call completion callback
      onComplete?.(formData);
      
      // Navigate to contextual destination
      router.push(destination);
      
    } catch (err) {
      console.error('[Onboarding] Error completing:', err);
    } finally {
      setIsSaving(false);
    }
  }, [formData, saveProgress, onComplete, router]);

  // Navigate to specific step via dot
  const handleDotClick = (targetStep) => {
    if (targetStep === step) return;
    // Only allow going back to completed steps, not forward
    if (targetStep < step) {
      setSlideDirection(targetStep > step ? 'next' : 'prev');
      setIsAnimating(true);
      setTimeout(() => {
        setStep(targetStep);
        setIsAnimating(false);
      }, 200);
    }
  };

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
      case 3: // Intent
        return formData.user_intent !== null;
      case 4: // Feature Tour
        return true;
      case 5: // Final
        return true;
      default:
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

    switch (step) {
      case 1:
        return <WelcomeStep {...stepProps} displayName={displayName} />;
      case 2:
        return <ReferralStep {...stepProps} />;
      case 3:
        return <IntentStep {...stepProps} />;
      case 4:
        return <FeatureTourStep {...stepProps} userIntent={formData.user_intent} />;
      case 5:
        return (
          <FinalStep 
            {...stepProps} 
            userIntent={formData.user_intent}
            isSaving={isSaving}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  // Get button text based on step
  const getNextButtonText = () => {
    switch (step) {
      case 1:
        return "Let's Get Started";
      case 5:
        return isSaving ? 'Finishing...' : 'Finish & Explore';
      default:
        return 'Continue';
    }
  };

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Welcome to AutoRev">
        {/* Close Button */}
        <button 
          className={styles.closeBtn} 
          onClick={handleDismiss} 
          aria-label="Close and continue later"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Progress Dots */}
        <div className={styles.progressDots}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i + 1 === step ? styles.dotActive : ''} ${i + 1 < step ? styles.dotCompleted : ''}`}
              onClick={() => handleDotClick(i + 1)}
              aria-label={`Step ${i + 1}`}
              disabled={i + 1 > step}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className={styles.stepContainer}>
          {renderStep()}
        </div>

        {/* Footer Navigation */}
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
              onClick={step === 5 ? handleComplete : handleNext}
              disabled={!canProceed() || isSaving}
            >
              {getNextButtonText()}
              {step < 5 && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              )}
            </button>
          </div>
          <button className={styles.skipLink} onClick={handleDismiss}>
            I'll do this later
          </button>
        </div>
      </div>
    </div>
  );
}

