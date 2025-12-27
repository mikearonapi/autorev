'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import styles from './AuthModal.module.css';

/**
 * Icons for the modal
 */
const Icons = {
  x: ({ size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  google: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  garage: ({ size = 28 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <path d="M9 22V12h6v10"/>
    </svg>
  ),
  shield: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
};

/**
 * AuthModal Component
 * Modal for Google-only sign in / sign up flow
 */
export default function AuthModal({ isOpen, onClose, defaultMode = 'signin' }) {
  const [mode, setMode] = useState(defaultMode); // 'signin' | 'signup'
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginWithGoogle, isSupabaseConfigured } = useAuth();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setMode(defaultMode);
    }
  }, [isOpen, defaultMode]);

  // Handle escape key
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll
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

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    
    const { error } = await loginWithGoogle();
    
    if (error) {
      setError(error.message || 'Failed to sign in with Google');
      setIsSubmitting(false);
    }
    // If successful, will redirect to Google
  };

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.container} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        {/* Close Button */}
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Icons.x size={20} />
        </button>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.iconWrapper}>
            <Icons.garage size={28} />
          </div>
          <h2 className={styles.title}>
            {mode === 'signin' ? 'Welcome Back' : 'Create Your Garage'}
          </h2>
          <p className={styles.subtitle}>
            {mode === 'signin' 
              ? 'Sign in to access your personalized garage' 
              : 'Join to save favorites, builds, and get AI advice'}
          </p>
        </div>

        {/* Error Message */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Google Sign In Button */}
        {isSupabaseConfigured && (
          <button 
            className={styles.googleBtn} 
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
          >
            <Icons.google size={20} />
            <span>{isSubmitting ? 'Connecting...' : 'Continue with Google'}</span>
          </button>
        )}

        {/* Security note */}
        <p className={styles.securityNote}>
          <Icons.shield size={14} />
          <span>Secure sign-in powered by Google</span>
        </p>

        {/* Toggle Mode */}
        <p className={styles.toggleMode}>
          {mode === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button type="button" onClick={() => setMode('signup')}>Sign up</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button type="button" onClick={() => setMode('signin')}>Sign in</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/**
 * Hook to manage auth modal state
 */
export function useAuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultMode, setDefaultMode] = useState('signin');

  const openSignIn = useCallback(() => {
    setDefaultMode('signin');
    setIsOpen(true);
  }, []);

  const openSignUp = useCallback(() => {
    setDefaultMode('signup');
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    defaultMode,
    openSignIn,
    openSignUp,
    close,
  };
}
