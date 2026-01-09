'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  facebook: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  mail: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  checkCircle: ({ size = 48 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  alertCircle: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  arrowLeft: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/>
      <polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
};

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
      <div className={styles.overlay} onClick={handleBackdropClick}>
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
      <div className={styles.overlay} onClick={handleBackdropClick}>
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
      <div className={styles.overlay} onClick={handleBackdropClick}>
        <div className={styles.modal} role="dialog" aria-modal="true">
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <Icons.x size={20} />
          </button>

          <button className={styles.backBtn} onClick={() => setView('signin')}>
            <Icons.arrowLeft size={18} />
          </button>

          <h2 className={styles.title}>Reset Password</h2>
          
          <div className={styles.infoBox}>
            Enter your email and we'll send you a reset link.
          </div>

          {error && (
            <div className={styles.errorBox}>
              <Icons.alertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleForgotPassword} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                disabled={isSubmitting}
                autoComplete="email"
                ref={emailInputRef}
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
      <div className={styles.overlay} onClick={handleBackdropClick}>
        <div className={styles.modal} role="dialog" aria-modal="true">
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <Icons.x size={20} />
          </button>

          <h2 className={styles.title}>Create an Account</h2>
          
          <div className={styles.infoBox}>
            Join AutoRev to save favorites, track your garage, and get AI advice.
          </div>

          {error && (
            <div className={styles.errorBox}>
              <Icons.alertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleEmailSignUp} className={styles.form}>
            <div className={styles.inputGroup}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name (optional)"
                disabled={isSubmitting}
                autoComplete="name"
              />
            </div>

            <div className={styles.inputGroup}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                disabled={isSubmitting}
                autoComplete="email"
                ref={emailInputRef}
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
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          <Icons.x size={20} />
        </button>

        <h2 className={styles.title}>Log Into Your Account</h2>
        
        <div className={styles.infoBox}>
          Access your garage, saved cars, and personalized recommendations.
          <button 
            type="button" 
            className={styles.forgotInline}
            onClick={() => setView('forgot')}
          >
            Forgot?
          </button>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <Icons.alertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleEmailSignIn} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              disabled={isSubmitting}
              autoComplete="email"
              ref={emailInputRef}
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
