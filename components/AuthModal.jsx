'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
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
  mail: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  eye: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  eyeOff: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
      <line x1="2" y1="2" x2="22" y2="22"/>
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
};

/**
 * AuthModal Component
 * Modal for sign in / sign up flows
 */
export default function AuthModal({ isOpen, onClose, defaultMode = 'signin' }) {
  const [mode, setMode] = useState(defaultMode); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginWithGoogle, loginWithEmail, signUp, isSupabaseConfigured } = useAuth();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
      setMode(defaultMode);
    }
  }, [isOpen, defaultMode]);

  // Handle escape key
  useEffect(() => {
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

  // Handle email sign in
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const { error } = await loginWithEmail(email, password);

    if (error) {
      setError(error.message || 'Invalid email or password');
      setIsSubmitting(false);
    } else {
      onClose();
    }
  };

  // Handle email sign up
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsSubmitting(false);
      return;
    }

    const { error } = await signUp(email, password, { full_name: name });

    if (error) {
      setError(error.message || 'Failed to create account');
      setIsSubmitting(false);
    } else {
      setSuccess('Check your email to confirm your account!');
      setIsSubmitting(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!email.trim()) {
      setError('Please enter your email address');
      setIsSubmitting(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setError('Email reset is not available at this time');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        setError(error.message || 'Failed to send reset email');
        setIsSubmitting(false);
      } else {
        setSuccess('Password reset link sent to your email!');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('[AuthModal] Forgot password error:', err);
      setError('Failed to send reset email. Please try again.');
      setIsSubmitting(false);
    }
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
            {mode === 'signin' && 'Welcome Back'}
            {mode === 'signup' && 'Create Your Garage'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className={styles.subtitle}>
            {mode === 'signin' && 'Sign in to access your personalized garage'}
            {mode === 'signup' && 'Join to save favorites, builds, and get AI advice'}
            {mode === 'forgot' && 'Enter your email to reset your password'}
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}><Icons.check size={16} /> {success}</div>}

        {/* Google Sign In */}
        {mode !== 'forgot' && isSupabaseConfigured && (
          <>
            <button 
              className={styles.googleBtn} 
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
            >
              <Icons.google size={20} />
              <span>Continue with Google</span>
            </button>

            <div className={styles.divider}>
              <span>or</span>
            </div>
          </>
        )}

        {/* Email Form */}
        {mode === 'signin' && (
          <form onSubmit={handleEmailSignIn} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <div className={styles.inputWrapper}>
                <Icons.mail size={18} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.inputWrapper}>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isSubmitting}
                />
                <button 
                  type="button" 
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="button" 
              className={styles.forgotLink}
              onClick={() => setMode('forgot')}
            >
              Forgot password?
            </button>

            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleEmailSignUp} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="signup-email">Email</label>
              <div className={styles.inputWrapper}>
                <Icons.mail size={18} />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="signup-password">Password</label>
              <div className={styles.inputWrapper}>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  disabled={isSubmitting}
                />
                <button 
                  type="button" 
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Icons.eyeOff size={18} /> : <Icons.eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="reset-email">Email</label>
              <div className={styles.inputWrapper}>
                <Icons.mail size={18} />
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={isSubmitting}
            >
              Send Reset Link
            </button>

            <button 
              type="button" 
              className={styles.backLink}
              onClick={() => setMode('signin')}
            >
              ← Back to sign in
            </button>
          </form>
        )}

        {/* Toggle Mode */}
        {mode !== 'forgot' && (
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
        )}
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
