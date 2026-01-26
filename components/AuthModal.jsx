'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import styles from './AuthModal.module.css';
import { Icons } from '@/components/ui/Icons';

/**
 * Email validation
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Password strength validation
 */
function validatePassword(password) {
  if (!password) return { isValid: false, message: '', strength: 0 };
  if (password.length < 8) {
    return { isValid: false, message: 'At least 8 characters required', strength: 1 };
  }
  
  let strength = 1;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  return { isValid: true, message: '', strength: Math.min(strength, 4) };
}

/**
 * AuthModal Component
 * Clean, minimal authentication modal
 */
export default function AuthModal({ isOpen, onClose, defaultMode = 'signin' }) {
  // View states: 'signin' | 'signup' | 'forgot' | 'check-email' | 'verification-sent'
  const [view, setView] = useState(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const emailInputRef = useRef(null);

  const { loginWithGoogle, loginWithFacebook, loginWithEmail, signUp, isSupabaseConfigured } = useAuth();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setView(defaultMode);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setTimeout(() => emailInputRef.current?.focus(), 300);
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
  };

  // Handle Facebook sign in
  const handleFacebookSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    const { error } = await loginWithFacebook();
    if (error) {
      if (error.message?.includes('provider is not enabled') || error.message?.includes('Provider not found')) {
        setError('Facebook sign-in is coming soon!');
      } else {
        setError(error.message || 'Failed to sign in with Facebook');
      }
      setIsSubmitting(false);
    }
  };

  // Handle email sign in
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!password) {
      setError('Please enter your password');
      return;
    }
    
    setIsSubmitting(true);
    const { error } = await loginWithEmail(email, password);
    
    if (error) {
      if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Please verify your email first. Check your inbox.');
      } else {
        setError(error.message || 'Failed to sign in');
      }
      setIsSubmitting(false);
    }
  };

  // Handle email sign up
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      setError(passwordCheck.message || 'Password must be at least 8 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsSubmitting(true);
    
    const metadata = {};
    if (name.trim()) {
      metadata.full_name = name.trim();
      metadata.name = name.trim();
    }
    
    const { data, error } = await signUp(email, password, metadata);
    
    if (error) {
      if (error.message?.includes('already registered')) {
        setError('This email is already registered. Try signing in.');
      } else {
        setError(error.message || 'Failed to create account');
      }
      setIsSubmitting(false);
      return;
    }
    
    if (data?.user && !data.session) {
      setView('verification-sent');
    }
    
    setIsSubmitting(false);
  };

  // Handle forgot password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { resetPassword } = await import('@/lib/auth');
      const { error } = await resetPassword(email);
      
      if (error) {
        setError(error.message || 'Failed to send reset email');
        setIsSubmitting(false);
        return;
      }
      
      setView('check-email');
    } catch (err) {
      setError('Failed to send reset email');
    }
    
    setIsSubmitting(false);
  };

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Password strength for signup
  const passwordValidation = validatePassword(password);
  const strengthColors = ['#dc2626', '#f59e0b', '#eab308', '#22c55e'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

  if (!isOpen) return null;

  // Verification sent view
  if (view === 'verification-sent') {
    return (
      <div className={styles.overlay} onClick={handleBackdropClick} data-overlay-modal>
        <div className={styles.modal} role="dialog" aria-modal="true">
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <Icons.x size={20} />
          </button>

          <div className={styles.successView}>
            <div className={styles.successIcon}>
              <Icons.checkCircle size={48} />
            </div>
            <h2 className={styles.title}>Check Your Email</h2>
            <p className={styles.subtitle}>
              We sent a verification link to<br /><strong>{email}</strong>
            </p>
            <p className={styles.helpText}>
              Click the link to verify your account. Check spam if you don't see it.
            </p>
            <button className={styles.primaryBtn} onClick={() => setView('signin')}>
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check email (password reset) view
  if (view === 'check-email') {
    return (
      <div className={styles.overlay} onClick={handleBackdropClick} data-overlay-modal>
        <div className={styles.modal} role="dialog" aria-modal="true">
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <Icons.x size={20} />
          </button>

          <div className={styles.successView}>
            <div className={styles.successIcon}>
              <Icons.mail size={48} />
            </div>
            <h2 className={styles.title}>Check Your Email</h2>
            <p className={styles.subtitle}>
              We sent a password reset link to<br /><strong>{email}</strong>
            </p>
            <p className={styles.helpText}>
              The link expires in 24 hours.
            </p>
            <button className={styles.primaryBtn} onClick={() => setView('signin')}>
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Forgot password view
  if (view === 'forgot') {
    return (
      <div className={styles.overlay} onClick={handleBackdropClick} data-overlay-modal>
        <div className={styles.modal} role="dialog" aria-modal="true">
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <Icons.x size={20} />
          </button>

          <button className={styles.backBtn} onClick={() => setView('signin')} aria-label="Back to sign in">
            <Icons.arrowLeft size={18} />
          </button>

          <h2 className={styles.title}>Reset Password</h2>
          
          <div className={styles.infoBox}>
            Enter your email and we'll send you a reset link.
          </div>

          {error && (
            <div className={styles.errorBox} id="auth-error" role="alert" aria-live="assertive">
              <Icons.alertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleForgotPassword} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                disabled={isSubmitting}
                autoComplete="email"
                ref={emailInputRef}
                aria-describedby={error ? 'auth-error' : undefined}
              />
            </div>

            <button type="submit" className={styles.primaryBtn} disabled={isSubmitting || !email}>
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Sign Up view
  if (view === 'signup') {
    return (
      <div className={styles.overlay} onClick={handleBackdropClick} data-overlay-modal>
        <div className={styles.modal} role="dialog" aria-modal="true">
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <Icons.x size={20} />
          </button>

          <h2 className={styles.title}>Create an Account</h2>
          
          <div className={styles.infoBox}>
            Join AutoRev to save favorites, track your garage, and get AI advice.
          </div>

          {error && (
            <div className={styles.errorBox} id="auth-error" role="alert" aria-live="assertive">
              <Icons.alertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailSignUp} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                disabled={isSubmitting}
                autoComplete="email"
                ref={emailInputRef}
                aria-describedby={error ? 'auth-error' : undefined}
              />
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.showBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              
              {/* Password strength indicator */}
              {password && (
                <div className={styles.strengthRow}>
                  <div className={styles.strengthBars}>
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={styles.strengthBar}
                        style={{
                          backgroundColor: passwordValidation.strength >= level 
                            ? strengthColors[passwordValidation.strength - 1] 
                            : 'var(--color-gray-200)',
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ color: strengthColors[passwordValidation.strength - 1] || 'var(--color-gray-400)' }}>
                    {passwordValidation.strength > 0 ? strengthLabels[passwordValidation.strength - 1] : ''}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.passwordWrapper}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className={styles.showBtn}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <span className={styles.fieldError}>Passwords don't match</span>
              )}
            </div>

            <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className={styles.switchMode}>
            Already have an account?{' '}
            <button type="button" onClick={() => setView('signin')}>Log In</button>
          </p>

          {/* Social login divider */}
          <div className={styles.divider}>
            <span>or sign up with</span>
          </div>

          {/* Social buttons - icon only */}
          {isSupabaseConfigured && (
            <div className={styles.socialRow}>
              <div className={styles.socialBtnWrapper}>
                <button 
                  className={`${styles.socialBtn} ${styles.socialBtnDisabled}`}
                  disabled
                  aria-label="Sign up with Facebook - Coming Soon"
                >
                  <Icons.facebook size={22} />
                </button>
                <span className={styles.comingSoon}>Coming Soon</span>
              </div>
              <button 
                className={styles.socialBtn}
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                aria-label="Sign up with Google"
              >
                <Icons.google size={22} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Sign In view (default)
  return (
    <div className={styles.overlay} onClick={handleBackdropClick} data-overlay-modal>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Icons.x size={20} />
        </button>

        <h2 className={styles.title}>Log Into Your Account</h2>

        {error && (
          <div className={styles.errorBox} id="auth-error" role="alert" aria-live="assertive">
            <Icons.alertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEmailSignIn} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              disabled={isSubmitting}
              autoComplete="email"
              ref={emailInputRef}
              aria-describedby={error ? 'auth-error' : undefined}
            />
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.showBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <button 
              type="button" 
              className={styles.forgotLink}
              onClick={() => setView('forgot')}
            >
              Forgot password?
            </button>
          </div>

          <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <p className={styles.switchMode}>
          <button type="button" onClick={() => setView('signup')}>Create an Account</button>
        </p>

        {/* Social login divider */}
        <div className={styles.divider}>
          <span>or log in with</span>
        </div>

        {/* Social buttons - icon only */}
        {isSupabaseConfigured && (
          <div className={styles.socialRow}>
            <div className={styles.socialBtnWrapper}>
              <button 
                className={`${styles.socialBtn} ${styles.socialBtnDisabled}`}
                disabled
                aria-label="Log in with Facebook - Coming Soon"
              >
                <Icons.facebook size={22} />
              </button>
              <span className={styles.comingSoon}>Coming Soon</span>
            </div>
            <button 
              className={styles.socialBtn}
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              aria-label="Log in with Google"
            >
              <Icons.google size={22} />
            </button>
          </div>
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
